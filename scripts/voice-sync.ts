import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readCorpusFromDisk } from "../evals/corpus";
import { buildVoiceAgentConfig, VOICE_AGENT_ID, type VoiceAgentConfig } from "../src/lib/voice/agent-config";

export function buildConfigFromDisk(contentDir: string, syncedAt: Date): VoiceAgentConfig {
  return buildVoiceAgentConfig({
    corpus: readCorpusFromDisk(contentDir),
    syncedAt,
    systemPromptTemplate: readFileSync(join(contentDir, "system-prompt.md"), "utf-8"),
    voicePrompt: readFileSync(join(contentDir, "voice-prompt.md"), "utf-8"),
  });
}

export function summarize(config: VoiceAgentConfig): string {
  const { agent, realtime_model } = config.conversation_config;
  return [
    `agent: ${VOICE_AGENT_ID}`,
    `prompt: ${agent.prompt.prompt.length} chars`,
    `model: ${realtime_model}`,
    `tools: ${agent.prompt.tools.map((tool) => tool.name).join(", ")}`,
  ].join("\n");
}

export async function patchVoiceAgent({
  apiKey,
  config,
  fetch,
}: {
  apiKey: string;
  config: VoiceAgentConfig;
  fetch: typeof globalThis.fetch;
}): Promise<void> {
  const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${VOICE_AGENT_ID}`, {
    body: JSON.stringify(config),
    headers: { "content-type": "application/json", "xi-api-key": apiKey },
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error(`ElevenLabs rejected the agent update (${response.status}): ${await response.text()}`);
  }
}

/**
 * Pushes Poof's prompt (the whole content/ corpus plus the voice rules) and settings to the
 * ElevenLabs voice agent. `--dry-run` prints what would be sent without calling the API.
 */
async function main() {
  const config = buildConfigFromDisk(join(import.meta.dirname, "..", "content"), new Date());
  console.log(summarize(config));
  if (process.argv.includes("--dry-run")) {
    console.log("Dry run: the agent was not updated.");
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");
  await patchVoiceAgent({ apiKey, config, fetch });
  console.log("Voice agent updated.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
