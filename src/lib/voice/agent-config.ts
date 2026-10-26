import { formatPromptDate, renderSystemPrompt } from "#/lib/chat/system-prompt";

import { VOICE_LIMITS } from "../../../convex/voiceLimits";

export { VOICE_AGENT_ID } from "../../../convex/voiceAgent";

const TODAY_VARIABLE = "today";

export const CONTACT_FORM_TOOL = {
  description: "Open a contact form on the visitor's screen so they can send Lucien a message.",
  expects_response: false,
  name: "show_contact_form",
  type: "client",
};

const DISABLED_OVERRIDES = {
  conversation_config_override: {
    agent: {
      first_message: false,
      language: false,
      max_conversation_duration_message: false,
      prompt: {
        knowledge_base: false,
        llm: false,
        native_mcp_server_ids: false,
        prompt: false,
        tool_ids: false,
        tool_ids_strict: false,
      },
      silence_end_call_message: false,
    },
    asr: { keywords: false },
    conversation: { max_duration_seconds: false, text_only: false },
    tts: {
      clone_strength: false,
      model_id: false,
      pronunciation_dictionary_locators: false,
      similarity_boost: false,
      speed: false,
      stability: false,
      supported_voices: false,
      voice_id: false,
    },
    turn: {
      noisy_environment_message: false,
      soft_timeout_config: { additional_soft_timeout_messages: false, message: false },
    },
  },
  custom_llm_extra_body: false,
  enable_conversation_initiation_client_data_from_webhook: false,
  enable_procedure_ids_from_client: false,
  enable_starting_workflow_node_id_from_client: false,
};

/**
 * The PATCH body for the voice agent, in the API's snake_case. Fields left out keep their
 * current value on the agent, which is how the voice (tts) stays as set in the dashboard.
 */
export function buildVoiceAgentConfig({
  corpus,
  syncedAt,
  systemPromptTemplate,
  voicePrompt,
}: {
  corpus: string;
  /** Fills the date for calls that do not pass one, e.g. tests in the ElevenLabs dashboard. */
  syncedAt: Date;
  systemPromptTemplate: string;
  voicePrompt: string;
}) {
  const prompt = `${renderSystemPrompt(systemPromptTemplate, { context: corpus, today: `{{${TODAY_VARIABLE}}}` })}\n\n${voicePrompt.trim()}\n`;
  const unknownVariables = [...prompt.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)]
    .map((match) => match[1])
    .filter((name) => name !== TODAY_VARIABLE);
  if (unknownVariables.length > 0) {
    throw new Error(`Voice prompt has text ElevenLabs would read as dynamic variables: ${unknownVariables.join(", ")}`);
  }

  return {
    conversation_config: {
      agent: {
        dynamic_variables: {
          dynamic_variable_placeholders: { call_id: "dashboard-test", [TODAY_VARIABLE]: formatPromptDate(syncedAt) },
        },
        first_message: "Hey, I'm Poof, Lucien's assistant. What would you like to know about him?",
        prompt: { max_tokens: -1, prompt, tools: [CONTACT_FORM_TOOL] },
      },
      conversation: { max_duration_seconds: VOICE_LIMITS.callMaxSecs },
      // Max reasons before it speaks, which the long prompt and the scope rules need.
      realtime_model: "eleven_realtime_v1_max",
    },
    platform_settings: {
      auth: { enable_auth: true },
      overrides: DISABLED_OVERRIDES,
      // No audio kept; ElevenLabs deletes its transcript after 30 days (ours lives on in the chat).
      // Only these two, so the agent's other privacy settings stay as they are.
      privacy: { record_voice: false, retention_days: 30 },
    },
  };
}

export type VoiceAgentConfig = ReturnType<typeof buildVoiceAgentConfig>;
