import { useRouterState } from "@tanstack/react-router";

/**
 * Returns true while the router is navigating to (or actively loading) the
 * given path. Pair with a spinner to show progress on a specific Link.
 *
 * During a pending navigation the router optimistically points `location` at
 * the target while `isLoading` stays true (it tracks `status === "pending"`,
 * which only returns to idle after the transition commits), so matching the
 * target pathname against `location` covers both the loader and transition
 * phases.
 */
export function usePendingNav(to: string) {
  return useRouterState({
    select: (state) => state.isLoading && state.location.pathname === to,
  });
}
