import { Button } from "#/components/ui/button";

import { STARTER_PROMPTS } from "./chat.constants";

export function ChatStarterPrompts({ onStarterPrompt }: { onStarterPrompt: (prompt: string) => Promise<void> }) {
  return (
    <div className="space-y-2 border-t border-neutral-950/8 pt-1 sm:space-y-3">
      <p className="font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase sm:text-sm sm:tracking-wide">
        Start here
      </p>
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
    </div>
  );
}
