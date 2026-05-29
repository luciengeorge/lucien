import { useRouterState } from "@tanstack/react-router";

/**
 * Returns true while the router is navigating to (or actively loading) the
 * given path. Pair with a spinner to show progress on a specific Link.
 *
 * Matches by exact pathname against `pendingMatches` (preferred) and falls back
 * to `location.pathname` for cases where the navigation has resolved to a route
 * but children are still loading.
 */
export function usePendingNav(to: string) {
  return useRouterState({
    select: (state) => {
      // `pendingMatches` is not in the public RouterState type across all router
      // versions, but is present at runtime during navigation — read it defensively.
      const pendingMatches = (state as { pendingMatches?: Array<{ pathname: string }> }).pendingMatches;
      const pendingMatch = pendingMatches?.some((match) => match.pathname === to) ?? false;
      const loadingTarget = state.isLoading && state.location.pathname === to;
      return pendingMatch || loadingTarget;
    },
  });
}
