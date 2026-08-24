import type { LinkComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { PageScroll } from "#/components/page-scroll";
import { renderMarkdown } from "#/lib/content/markdown";
import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

interface ContentPageProps {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  sources: string[];
  footer?: ReactNode;
  /** Optional leading visual (e.g. a company logo) shown above the title. */
  media?: ReactNode;
  /** Optional header actions (e.g. a Download CV button), right-aligned on desktop. */
  actions?: ReactNode;
  /** Optional `view-transition-name` for the title, to morph from a list view. */
  titleViewTransitionName?: string;
  /** Optional back link shown above the header (for sub-pages like /work/$slug). */
  back?: { to: LinkComponentProps<"a">["to"]; label: string };
}

export function ContentPage({
  eyebrow,
  title,
  intro,
  sources,
  footer,
  media,
  actions,
  titleViewTransitionName,
  back,
}: ContentPageProps) {
  const html = sources.map((source) => renderMarkdown(source)).join("\n");

  return (
    <PageScroll>
      <article className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-10 sm:pb-20">
        {back ? (
          <Link
            to={back.to}
            viewTransition
            className="mb-8 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-neutral-500 uppercase transition-colors hover:text-neutral-950"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            {back.label}
          </Link>
        ) : null}
        <header className="mb-10 border-b border-neutral-950/10 pb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {media ? <div className="mb-4">{media}</div> : null}
              {eyebrow ? (
                <p className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">{eyebrow}</p>
              ) : null}
              <h1
                className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl"
                style={titleViewTransitionName ? { viewTransitionName: titleViewTransitionName } : undefined}
              >
                {title}
              </h1>
            </div>
            {actions ? <div className="shrink-0 pt-1">{actions}</div> : null}
          </div>
          {intro ? <div className="mt-4 text-base text-neutral-600">{intro}</div> : null}
        </header>

        <div
          className="prose max-w-none prose-neutral prose-p:text-neutral-700 prose-a:text-neutral-950 prose-a:underline prose-a:underline-offset-2 prose-strong:text-neutral-950 prose-li:text-neutral-700"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {footer ? <div className="mt-12 border-t border-neutral-950/10 pt-8">{footer}</div> : null}
      </article>
    </PageScroll>
  );
}
