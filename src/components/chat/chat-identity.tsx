import { HOMEPAGE_FALLBACK_HTML } from "#/lib/content/homepage-fallback";
import { cn } from "#/lib/utils";
import { PlusSignIcon } from "@hugeicons-pro/core-solid-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSpinDelay } from "spin-delay";

import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

/**
 * Who the page is about, in as little height as possible: the conversation is the page, so
 * this row should not rent the top of the screen for the whole chat.
 *
 * SEO constraints it keeps (the agent-readiness checks scored on the homepage):
 * - a visible h1 outside any `header` element, since extractors drop header/nav/footer;
 * - the short version as a closed `details`: ~4.5k chars, h1 + h2s, readable without
 *   JavaScript. Only its trigger is inline now; opened, it drops over the transcript instead
 *   of pushing it down.
 *
 * Once the visitor has asked something (`compact`), only the name and "New" remain. Crawlers
 * never reach that state, so they always see the full row.
 */
export function ChatIdentity({
  compact,
  isStartingNew,
  onNew,
}: {
  compact: boolean;
  isStartingNew: boolean;
  onNew: () => void;
}) {
  const isLoading = useSpinDelay(isStartingNew, { delay: 250, minDuration: 200 });

  return (
    // Below `lg` the fixed nav's menu button sits at the top right of this row, hence the gutter.
    <div className="relative mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between gap-3 px-4 pb-3 max-lg:pr-16 sm:px-6 max-lg:sm:pr-16">
      <div className="min-w-0">
        <h1
          className={cn(
            "font-semibold tracking-tight text-neutral-950",
            compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl",
          )}
        >
          Lucien George
        </h1>
        {compact ? null : (
          <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600 sm:text-[15px]">
            {/* Trimmed on phones so the role and "Short version" share one line; the full text stays in the HTML. */}
            <p>
              <span className="max-sm:sr-only">Senior </span>Product Engineer at Fyxer
              <span className="max-sm:sr-only">, London</span>
            </p>
            <span aria-hidden className="size-0.75 rounded-full bg-neutral-400" />
            <details>
              <summary className="cursor-pointer list-none text-neutral-950 underline decoration-neutral-950/25 underline-offset-[3px] transition-colors hover:decoration-neutral-950 [&::-webkit-details-marker]:hidden">
                Short version
              </summary>
              <div
                className="absolute inset-x-4 top-full z-20 prose prose-sm max-h-[60vh] max-w-none overflow-y-auto rounded-2xl bg-white p-5 shadow-lg ring-1 ring-neutral-950/10 prose-neutral sm:inset-x-6"
                dangerouslySetInnerHTML={{ __html: HOMEPAGE_FALLBACK_HTML }}
              />
            </details>
          </div>
        )}
      </div>
      <Button
        className={cn("shrink-0 rounded-full", !compact && "max-sm:hidden")}
        disabled={isStartingNew}
        onClick={onNew}
        size="sm"
        type="button"
        variant="outline"
      >
        {isLoading ? <Spinner /> : <HugeiconsIcon icon={PlusSignIcon} />}
        New
      </Button>
    </div>
  );
}
