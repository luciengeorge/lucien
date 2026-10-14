import { Button } from "#/components/ui/button";

import { STARTER_PROMPTS } from "./chat.constants";

export function ChatStarterPrompts({ onStarterPrompt }: { onStarterPrompt: (prompt: string) => Promise<void> }) {
  /*
   * The label is a heading, not a styled paragraph: it names the section the
   * chips belong to, so it belongs in the outline (one of the homepage's H2s
   * the agent-readiness check counts). It is visually hidden: the chips say
   * what they are, and the label cost a row of the conversation's space.
   *
   * The chips wrap at every width. They used to sit in a horizontal scroller
   * below `sm` with no fade, scrollbar or arrow, so at 390px the second chip
   * was cut mid-word and three of the four openers were invisible. Short
   * labels keep the wrap to two rows on a phone.
   */
  return (
    <section aria-labelledby="starter-prompts-heading">
      <h2 id="starter-prompts-heading" className="sr-only">
        Start here
      </h2>
      <div className="flex flex-wrap gap-2">
        {STARTER_PROMPTS.map(({ label, prompt }) => (
          <Button
            key={prompt}
            className="h-auto rounded-full border border-neutral-950/10 px-3 py-1.5 text-[13px] whitespace-nowrap hover:bg-neutral-950/4 sm:px-3.5 sm:py-2 sm:text-sm"
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => void onStarterPrompt(prompt)}
          >
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
