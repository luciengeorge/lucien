import type { ReactNode } from "react";

import { SiteFooter } from "#/components/site-footer";
import { usePageScrollRestoration } from "#/lib/scroll-restoration";

/**
 * The scroll area every page with content of its own sits in, and the footer
 * that closes it.
 *
 * The app is a fixed-height flex column (`h-dvh`, `overflow-hidden` on `main`),
 * so each page scrolls an inner element rather than the window. Every one of
 * them had hand-rolled the same container, which is how the footer ended up on
 * the five routes that happened to render through `ContentPage` and nowhere
 * else.
 *
 * `min-h-full` on the inner column plus `grow` on the content is what keeps the
 * footer at the *end* of the scroll area: on a tall viewport a short page
 * leaves slack, and without it the footer floats under the last paragraph with
 * empty space beneath it.
 */
export function PageScroll({ children }: { children: ReactNode }) {
  const scrollRestoration = usePageScrollRestoration();

  return (
    <div className="min-h-0 grow overflow-y-auto" {...scrollRestoration}>
      <div className="flex min-h-full flex-col">
        <div className="grow">{children}</div>
        <SiteFooter />
      </div>
    </div>
  );
}
