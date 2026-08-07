import { RevealGroup, RevealItem } from "#/components/field-notes/reveal";

import { STARTER_PROMPTS } from "./chat.constants";

export function ChatStarterPrompts({ onStarterPrompt }: { onStarterPrompt: (prompt: string) => Promise<void> }) {
  return (
    <section className="flex flex-col gap-5 border-t rule-stone pt-5">
      <h2 className="font-mono text-[11px] tracking-[0.3em] text-label">START HERE</h2>
      <RevealGroup as="ul" className="flex flex-col gap-3">
        {STARTER_PROMPTS.map((prompt, index) => (
          <RevealItem as="li" key={prompt}>
            <button
              className="group flex w-full items-baseline gap-3 text-left"
              onClick={() => void onStarterPrompt(prompt)}
              type="button"
            >
              <span className="w-6 shrink-0 font-mono text-[11px] text-label">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-sans text-[17px] text-ink transition-colors group-hover:text-cedar">{prompt}</span>
            </button>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
