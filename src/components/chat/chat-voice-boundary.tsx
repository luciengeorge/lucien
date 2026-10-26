import type { ReactNode } from "react";

import { Component } from "react";

/**
 * Catches the voice call failing to load or render, most often a chunk gone stale after a deploy,
 * so it costs the visitor the call rather than the whole chat.
 */
export class ChatVoiceBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
