import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AGENT_QUIET_MS, useSettledSpeaking } from "./use-settled-speaking";

describe("useSettledSpeaking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts talking the moment the agent speaks", () => {
    const { rerender, result } = renderHook(({ speaking }) => useSettledSpeaking(speaking), {
      initialProps: { speaking: false },
    });
    expect(result.current).toBe(false);

    rerender({ speaking: true });
    expect(result.current).toBe(true);
  });

  it("keeps talking through a short pause between sentences", () => {
    const { rerender, result } = renderHook(({ speaking }) => useSettledSpeaking(speaking), {
      initialProps: { speaking: true },
    });

    rerender({ speaking: false });
    act(() => vi.advanceTimersByTime(AGENT_QUIET_MS - 100));
    expect(result.current).toBe(true);

    rerender({ speaking: true });
    act(() => vi.advanceTimersByTime(AGENT_QUIET_MS));
    expect(result.current).toBe(true);
  });

  it("holds a pause the same way when the agent started speaking after mount", () => {
    const { rerender, result } = renderHook(({ speaking }) => useSettledSpeaking(speaking), {
      initialProps: { speaking: false },
    });

    rerender({ speaking: true });
    rerender({ speaking: false });
    act(() => vi.advanceTimersByTime(AGENT_QUIET_MS - 100));
    expect(result.current).toBe(true);
  });

  it("listens once the agent has been quiet long enough", () => {
    const { rerender, result } = renderHook(({ speaking }) => useSettledSpeaking(speaking), {
      initialProps: { speaking: true },
    });

    rerender({ speaking: false });
    act(() => vi.advanceTimersByTime(AGENT_QUIET_MS));
    expect(result.current).toBe(false);
  });
});
