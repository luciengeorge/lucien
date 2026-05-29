import type { ReactNode } from "react";

import { renderMarkdown } from "#/lib/content/markdown";

interface ContentPageProps {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  sources: string[];
  footer?: ReactNode;
}

export function ContentPage({ eyebrow, title, intro, sources, footer }: ContentPageProps) {
  const html = sources.map((source) => renderMarkdown(source)).join("\n");

  return (
    <div className="min-h-0 grow overflow-y-auto">
      <article className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-10 sm:pb-20">
        <header className="mb-10 border-b border-neutral-950/10 pb-8">
          {eyebrow ? (
            <p className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{title}</h1>
          {intro ? <div className="mt-4 text-base text-neutral-600">{intro}</div> : null}
        </header>

        <div
          className="prose max-w-none prose-neutral prose-p:text-neutral-700 prose-a:text-neutral-950 prose-a:underline prose-a:underline-offset-2 prose-strong:text-neutral-950 prose-li:text-neutral-700"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {footer ? <div className="mt-12 border-t border-neutral-950/10 pt-8">{footer}</div> : null}
      </article>
    </div>
  );
}
