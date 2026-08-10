import { RevealGroup, RevealItem } from "#/components/motion-primitives/reveal";

import { STARTER_PROMPTS } from "./chat.constants";

/**
 * The openers, offered as a short list of lines you can send.
 *
 * No leader on these rows: a question is not a label reaching a value, so the
 * arrow sits at the end of the row on its own. The list is held to the width
 * of the reading column so those arrows form one lane with the arrows on the
 * tool cards above them.
 */
export function ChatStarterPrompts({ onStarterPrompt }: { onStarterPrompt: (prompt: string) => Promise<void> }) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:gap-11">
      <h2 className="shrink-0 pt-3 font-mono text-[11px] tracking-[0.3em] text-label sm:w-[120px]">OR ASK</h2>
      <RevealGroup as="ul" className="flex max-w-[46rem] flex-1 flex-col">
        {STARTER_PROMPTS.map((prompt) => (
          <RevealItem as="li" className="border-b rule-hair first:border-t" key={prompt}>
            <button
              className="group flex w-full items-baseline justify-between gap-4 py-3 text-left"
              onClick={() => void onStarterPrompt(prompt)}
              type="button"
            >
              <span className="font-mono text-[15px] text-ink transition-colors group-hover:text-stamp">{prompt}</span>
              <span
                aria-hidden
                className="w-4 shrink-0 text-right font-mono text-[15px] text-stamp transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </button>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
