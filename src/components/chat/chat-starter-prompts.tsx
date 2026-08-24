import { Button } from "#/components/ui/button";

import { STARTER_PROMPTS } from "./chat.constants";

export function ChatStarterPrompts({ onStarterPrompt }: { onStarterPrompt: (prompt: string) => Promise<void> }) {
  /*
   * The label is a heading, not a styled paragraph: it names the section the
   * chips belong to, so it belongs in the outline. The homepage otherwise has
   * a lone h1 and nothing under it, which an audit reads as a flat document
   * (and a screen reader gets no region to jump to). Same classes, so nothing
   * moves on screen.
   */
  return (
    <section
      aria-labelledby="starter-prompts-heading"
      className="space-y-2 border-t border-neutral-950/8 pt-1 sm:space-y-3"
    >
      <h2
        id="starter-prompts-heading"
        className="font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase sm:text-sm sm:tracking-wide"
      >
        Start here
      </h2>
      {/*
        These wrap at every width. They used to sit in a horizontal scroller
        below `sm` with no fade, scrollbar or arrow, so at 390px the second
        chip was cut mid-word and three of the four openers were invisible
        with nothing to suggest they existed. Four short chips wrap fine and
        need no gesture to discover.
      */}
      <div className="pt-1 pb-1 sm:pt-0">
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {STARTER_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              className="h-auto rounded-full border border-neutral-950/10 px-3 py-1.5 text-[13px] whitespace-nowrap hover:bg-neutral-950/4 sm:px-3 sm:py-2 sm:text-sm"
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => void onStarterPrompt(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
