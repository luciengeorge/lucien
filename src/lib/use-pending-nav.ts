import { useRouterState } from "@tanstack/react-router";

/**
 * Returns true while the router is navigating to (or actively loading) the
 * given path. Pair with a spinner to show progress on a specific Link.
 *
 * During a pending navigation the router optimistically points `location` at
 * the target while `isLoading` / `isTransitioning` stay true, so matching the
 * target pathname against `location` covers both the transition and loader
 * phases.
 */
export function usePendingNav(to: string) {
  return useRouterState({
    select: (state) => (state.isLoading || state.isTransitioning) && state.location.pathname === to,
  });
}
