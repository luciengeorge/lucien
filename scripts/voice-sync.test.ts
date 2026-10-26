import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { buildVoiceAgentConfig, VOICE_AGENT_ID } from "../src/lib/voice/agent-config";
import { buildConfigFromDisk, patchVoiceAgent, summarize } from "./voice-sync";

const CONTENT_DIR = join(import.meta.dirname, "..", "content");

describe("buildConfigFromDisk", () => {
  it("builds the prompt from the content on disk, prompts left out of the corpus", () => {
    const { prompt } = buildConfigFromDisk(CONTENT_DIR, new Date()).conversation_config.agent.prompt;
    expect(prompt).toContain('<document source="bio.md">');
    expect(prompt).not.toContain('source="system-prompt.md"');
    expect(prompt).not.toContain('source="voice-prompt.md"');
    expect(prompt).toContain("This is a live spoken conversation");
  });
});

describe("summarize", () => {
  it("says what would be synced: prompt size, model and tools", () => {
    const config = buildVoiceAgentConfig({
      corpus: "ctx",
      syncedAt: new Date(),
      systemPromptTemplate: "{context}",
      voicePrompt: "voice",
    });
    const summary = summarize(config);
    expect(summary).toContain(`prompt: ${config.conversation_config.agent.prompt.prompt.length} chars`);
    expect(summary).toContain("model: eleven_realtime_v1_max");
    expect(summary).toContain("tools: show_contact_form");
  });
});

describe("patchVoiceAgent", () => {
  const config = buildVoiceAgentConfig({
    corpus: "ctx",
    syncedAt: new Date(),
    systemPromptTemplate: "{context}",
    voicePrompt: "v",
  });

  it("PATCHes the agent with the config, authenticated with the API key", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 }));
    await patchVoiceAgent({ apiKey: "key", config, fetch: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith(`https://api.elevenlabs.io/v1/convai/agents/${VOICE_AGENT_ID}`, {
      body: JSON.stringify(config),
      headers: { "content-type": "application/json", "xi-api-key": "key" },
      method: "PATCH",
    });
  });

  it("fails loudly with the API's reason when the update is rejected", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("Realtime models are not available", { status: 400 }));
    await expect(patchVoiceAgent({ apiKey: "key", config, fetch: fetchMock })).rejects.toThrow(
      /400.*Realtime models are not available/,
    );
  });
});
