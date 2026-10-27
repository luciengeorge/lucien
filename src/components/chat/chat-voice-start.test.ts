import { describe, expect, it, vi } from "vitest";

vi.mock("#/lib/functions/release-voice-call", () => ({ releaseVoiceCall: vi.fn() }));
vi.mock("#/lib/functions/start-voice-call", () => ({ checkVoiceResting: vi.fn(), startVoiceCall: vi.fn() }));

import { microphoneRefusal } from "./chat-voice-start";

describe("microphoneRefusal", () => {
  it("tells a visitor who blocked the site to allow it", () => {
    expect(microphoneRefusal(new DOMException("Permission denied", "NotAllowedError"))).toBe("mic_denied");
    expect(microphoneRefusal(new DOMException("Insecure", "SecurityError"))).toBe("mic_denied");
  });

  it("points at the computer's settings when the system, not the site, blocks the mic", () => {
    expect(microphoneRefusal(new DOMException("Permission denied by system", "NotAllowedError"))).toBe(
      "mic_blocked_system",
    );
  });

  it("says when there is no microphone at all", () => {
    expect(microphoneRefusal(new DOMException("Requested device not found", "NotFoundError"))).toBe("mic_missing");
  });

  it("says when another app holds the microphone", () => {
    expect(microphoneRefusal(new DOMException("Could not start audio source", "NotReadableError"))).toBe("mic_busy");
  });

  it("is not a microphone problem otherwise", () => {
    expect(microphoneRefusal(new Error("network"))).toBeNull();
    expect(microphoneRefusal(new DOMException("aborted", "AbortError"))).toBeNull();
  });
});
