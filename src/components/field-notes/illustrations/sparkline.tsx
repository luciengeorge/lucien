import { cn } from "#/lib/utils";

import { DrawnCircle, DrawnFigure, DrawnPath } from "./drawn";

/**
 * Eight years of shipping, plotted by hand, with the current peak circled.
 * Lives in the home margin next to the note that explains it.
 */
export function Sparkline({ className }: { className?: string }) {
  return (
    <DrawnFigure
      className={cn("text-rust", className)}
      label="A hand-drawn line rising to a circled peak"
      viewBox="0 0 150 46"
    >
      <DrawnPath
        d="M2 38 C22 12, 46 40, 68 16 C86 -2, 108 26, 146 8"
        duration={1.1}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <DrawnCircle cx={68} cy={16} delay={0.85} r={4} stroke="currentColor" strokeWidth={1.5} />
    </DrawnFigure>
  );
}
