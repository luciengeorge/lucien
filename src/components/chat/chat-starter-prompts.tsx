import { RevealGroup, RevealItem } from "#/components/field-notes/reveal";

import { STARTER_PROMPTS } from "./chat.constants";

export function ChatStarterPrompts({ onStarterPrompt }: { onStarterPrompt: (prompt: string) => Promise<void> }) {
  return (
    <section className="flex flex-col gap-5 border-t rule-dashed pt-4">
      <h2 className="font-mono text-[11px] font-medium tracking-[0.3em] text-label not-italic">START HERE</h2>
      <RevealGroup className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
        {STARTER_PROMPTS.map((prompt, index) => (
          <RevealItem key={prompt}>
            <button
              className="group flex w-full items-baseline gap-3 text-left"
              onClick={() => void onStarterPrompt(prompt)}
              type="button"
            >
              <span className="w-6 shrink-0 font-mono text-[11px] text-rust">{String(index + 1).padStart(2, "0")}</span>
              <span className="font-display text-lg text-ink italic transition-colors group-hover:text-pen">
                {prompt}
              </span>
            </button>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
