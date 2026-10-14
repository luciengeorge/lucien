import { createContext, useContext } from "react";

import type { PoofSignal } from "./poof-engine";

export type PoofSignals = {
  emit: (signal: PoofSignal) => void;
  subscribe: (listener: (signal: PoofSignal) => void) => () => void;
};

/**
 * A plain emitter rather than React state: the composer fires on every keystroke, and Poof's
 * engine reacts imperatively, so nothing needs to re-render for the face to notice typing.
 */
export function createPoofSignals(): PoofSignals {
  const listeners = new Set<(signal: PoofSignal) => void>();
  return {
    emit(signal) {
      for (const listener of listeners) listener(signal);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const PoofSignalsContext = createContext<PoofSignals | null>(null);

export function usePoofSignals(): PoofSignals | null {
  return useContext(PoofSignalsContext);
}
