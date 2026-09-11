// jsdom has no IntersectionObserver; framer-motion's useInView (used by ShimmeringText) needs one.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly scrollMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect(): void {}
  observe(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(): void {}
}

globalThis.IntersectionObserver = MockIntersectionObserver;

// jsdom has no matchMedia; motion's useReducedMotion (used by PoofMark) reads it on mount.
// Reports "no preference", so tests exercise the animated path rather than the reduced one.
globalThis.matchMedia ??= (query: string): MediaQueryList => ({
  addEventListener: () => {},
  addListener: () => {},
  dispatchEvent: () => false,
  matches: false,
  media: query,
  onchange: null,
  removeEventListener: () => {},
  removeListener: () => {},
});
