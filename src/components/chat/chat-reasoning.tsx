import { ShimmeringText } from "#/components/ui/shimmering-text";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceLine,
  TraceTitle,
} from "#/components/ui/trace";
import { useState } from "react";

/**
 * Poof's reasoning as a Trace line: open while it streams so the visitor can watch it think, then
 * folded to "Thought" once the answer takes over. A click always wins over the automatic state.
 */
export function ChatReasoning({ parts, thinking }: { parts: { key: string; text: string }[]; thinking: boolean }) {
  const [open, setOpen] = useState<boolean>();

  return (
    <Trace>
      <TraceCollapsible open={open ?? thinking} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={thinking ? "running" : undefined}>
            <TraceTitle className="font-mono tracking-wide uppercase">
              {thinking ? <ShimmeringText duration={1.8} startOnView={false} text="Thinking" /> : "Thought"}
            </TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="space-y-2">
          {parts.map((part) => (
            <p key={part.key} className="max-w-[62ch] text-sm text-pretty text-neutral-500 italic">
              {part.text}
            </p>
          ))}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
