import { Button } from "#/components/ui/button";

import { STARTER_PROMPTS } from "./chat.constants";

export function ChatStarterPrompts({ onStarterPrompt }: { onStarterPrompt: (prompt: string) => Promise<void> }) {
  return (
    <div className="space-y-3 border-t border-neutral-950/8 pt-1">
      <p className="font-mono text-sm tracking-wide text-neutral-500 uppercase">Start here</p>
      <div className="flex flex-wrap gap-2.5">
        {STARTER_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            className="h-auto rounded-full px-3 py-2 text-sm ring-1 ring-neutral-950/10 hover:bg-neutral-950/4"
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
  );
}
