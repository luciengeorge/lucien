import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildVoiceAgentConfig, CONTACT_FORM_TOOL } from "./agent-config";

const CONTENT_DIR = join(import.meta.dirname, "..", "..", "..", "content");
const systemPromptTemplate = readFileSync(join(CONTENT_DIR, "system-prompt.md"), "utf-8");
const voicePrompt = readFileSync(join(CONTENT_DIR, "voice-prompt.md"), "utf-8");

function build(corpus = '<document source="bio.md">\nLucien ran a marathon.\n</document>') {
  return buildVoiceAgentConfig({
    corpus,
    syncedAt: new Date("2026-10-11T23:30:00Z"),
    systemPromptTemplate,
    voicePrompt,
  });
}

function leaves(value: unknown): unknown[] {
  if (typeof value !== "object" || value === null) return [value];
  return Object.values(value).flatMap(leaves);
}

describe("buildVoiceAgentConfig", () => {
  it("answers from the whole corpus, like the text chat", () => {
    const { prompt } = build().conversation_config.agent.prompt;
    expect(prompt).toContain("Lucien ran a marathon.");
    expect(prompt).toContain("You are Poof");
  });

  it("leaves the date to the call, as the today dynamic variable", () => {
    const config = build();
    expect(config.conversation_config.agent.prompt.prompt).toContain("Today is {{today}}.");
    expect(config.conversation_config.agent.dynamic_variables.dynamic_variable_placeholders).toEqual({
      call_id: expect.any(String),
      today: "Monday, 12 October 2026",
    });
  });

  it("ends with the spoken-conversation rules", () => {
    const { prompt } = build().conversation_config.agent.prompt;
    expect(prompt.trimEnd().endsWith(voicePrompt.trim())).toBe(true);
  });

  /* ElevenLabs reads any {{name}} as a dynamic variable and fails calls that do not supply it. */
  it("refuses content that would read as an unknown dynamic variable", () => {
    expect(() => build("Templates use {{name}} slots.")).toThrow(/name/);
  });

  it("runs on Realtime Max with no token cap", () => {
    const config = build();
    expect(config.conversation_config.realtime_model).toBe("eleven_realtime_v1_max");
    expect(config.conversation_config.agent.prompt.max_tokens).toBe(-1);
  });

  it("introduces itself as Poof and caps a call at five minutes", () => {
    const config = build();
    expect(config.conversation_config.agent.first_message).toBe(
      "Hey, I'm Poof, Lucien's assistant. What would you like to know about him?",
    );
    expect(config.conversation_config.conversation.max_duration_seconds).toBe(300);
  });

  it("keeps the agent's current voice by not sending tts", () => {
    expect(build().conversation_config).not.toHaveProperty("tts");
  });

  it("offers one client tool that opens the contact form", () => {
    expect(build().conversation_config.agent.prompt.tools).toEqual([CONTACT_FORM_TOOL]);
    expect(CONTACT_FORM_TOOL).toMatchObject({ expects_response: false, name: "show_contact_form", type: "client" });
  });

  it("only accepts calls with a server-minted token and lets the client override nothing", () => {
    const { platform_settings } = build();
    expect(platform_settings.auth.enable_auth).toBe(true);
    const overrides = leaves(platform_settings.overrides);
    expect(overrides.length).toBeGreaterThan(10);
    expect(overrides.every((value) => value === false)).toBe(true);
  });
});
