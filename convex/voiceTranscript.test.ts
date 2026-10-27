import { describe, expect, it } from "vitest";

import { toVoiceTranscriptArgs } from "./voiceTranscript";

function transcript(turns: { message: string; role: "agent" | "user" }[]) {
  return toVoiceTranscriptArgs({
    conversation_id: "el-1",
    conversation_initiation_client_data: { dynamic_variables: { call_id: "call-1" } },
    metadata: { call_duration_secs: 30 },
    transcript: turns.map((turn, index) => ({ ...turn, time_in_call_secs: index })),
  }).transcript.map((turn) => turn.message);
}

describe("toVoiceTranscriptArgs", () => {
  /* The voice agent reads the text chat's rules too, so a stray mood tag must not reach the chat. */
  it("strips mood tags from what Poof said, and leaves the visitor's words alone", () => {
    expect(
      transcript([
        { message: "<mood>happy</mood>Hey there.", role: "agent" },
        { message: "What is <mood>?", role: "user" },
      ]),
    ).toEqual(["Hey there.", "What is <mood>?"]);
  });
});
