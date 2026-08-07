import type { ReactNode } from "react";

import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";

/**
 * Render a fragment that contains router `Link`s.
 *
 * `Link` reads the router from context and throws without one, so tests get a
 * throwaway memory router carrying only the routes the journal links to. That
 * keeps the real `href`s assertable without pulling in the generated route tree.
 */
export async function renderInRouter(ui: ReactNode) {
  const rootRoute = createRootRoute();
  const children = ["/", "/about", "/work", "/work/$slug", "/skills", "/education", "/resume"].map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => (path === "/" ? ui : null) }),
  );

  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: rootRoute.addChildren(children),
  });

  await router.load();

  return render(<RouterProvider router={router} />);
}
