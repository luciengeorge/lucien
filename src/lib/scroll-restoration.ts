import { useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";

const STORAGE_PREFIX = "page-scroll:";

/**
 * Restores the scroll position of a page's inner scroll container.
 *
 * The router's own scroll restoration watches the window, and every content page
 * scrolls an inner element instead, so returning from a detail page dropped the
 * reader at the top of the list they had just scrolled through. Wiring the
 * router's element restoration (`data-scroll-restoration-id` plus
 * `useElementScrollRestoration`) did not restore anything here, so this records
 * and applies the offset directly.
 *
 * Keyed by pathname and held in sessionStorage, so each route remembers its own
 * position for the tab's lifetime. Applied in the ref callback rather than an
 * effect: callbacks run during commit before paint and never on the server, so
 * there is no layout-effect SSR warning and no frame at the top before the jump.
 */
export function usePageScrollRestoration() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;
      const key = `${STORAGE_PREFIX}${pathname}`;

      const saved = Number(sessionStorage.getItem(key));
      if (Number.isFinite(saved) && saved > 0) element.scrollTop = saved;

      // Coalesced to one write per frame: scroll fires far more often than that.
      let queued = false;
      const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          sessionStorage.setItem(key, String(element.scrollTop));
        });
      };

      element.addEventListener("scroll", onScroll, { passive: true });
      return () => element.removeEventListener("scroll", onScroll);
    },
    [pathname],
  );

  return { ref, "data-page-scroll": "" } as const;
}
