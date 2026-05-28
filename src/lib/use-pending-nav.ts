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
      const pendingMatch = state.pendingMatches?.some((match) => match.pathname === to) ?? false;
      const loadingTarget = state.isLoading && state.location.pathname === to;
      return pendingMatch || loadingTarget;
    },
  });
}
