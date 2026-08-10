import { cn } from "#/lib/utils";

import {
  DrawnCircle,
  DrawnFigure,
  DrawnLabel,
  DrawnPath,
  DrawnRect,
} from "../../motion-primitives/illustrations/drawn";

/**
 * The three surfaces he shipped at Fyxer, in order.
 *
 * Boxes and their text are ink; the arrows and the one circled annotation are
 * the stamp colour, which is the only place the accent earns its keep here.
 * The stage still being built is drawn at a lighter ink weight rather than in a
 * dashed outline, so the diagram says where he is without borrowing the
 * journal's hand.
 *
 * Timing follows the sequence, so the diagram tells its own story as it
 * arrives: each box draws, its arrow travels, then the next box.
 */
export function FyxerSequence({ className }: { className?: string }) {
  return (
    <DrawnFigure
      className={cn("text-ink", className)}
      label="What he shipped at Fyxer, in order: chat, then the notetaker app, then B2B and enterprise"
      viewBox="0 0 880 210"
    >
      <DrawnRect duration={0.7} height={76} width={200} x={6} y={62} />
      <DrawnLabel className="fill-ink font-sans text-[13px]" delay={0.5} x={26} y={96}>
        Fyxer chat
      </DrawnLabel>
      <DrawnLabel className="fill-label font-sans text-[12px]" delay={0.6} x={26} y={116}>
        query your meetings
      </DrawnLabel>

      <DrawnPath className="text-stamp" d="M216 100 H258" delay={0.75} duration={0.35} strokeWidth={1.5} />
      <DrawnPath className="text-stamp" d="M250 94 L258 100 L250 106" delay={1} duration={0.2} strokeWidth={1.5} />

      <DrawnRect delay={1.1} duration={0.7} height={92} width={216} x={276} y={54} />
      <DrawnLabel className="fill-ink font-sans text-[13px]" delay={1.5} x={296} y={88}>
        notetaker app
      </DrawnLabel>
      <DrawnLabel className="fill-label font-sans text-[12px]" delay={1.6} x={296} y={108}>
        macOS and Windows,
      </DrawnLabel>
      <DrawnLabel className="fill-label font-sans text-[12px]" delay={1.67} x={296} y={126}>
        no bot joins
      </DrawnLabel>

      <DrawnPath className="text-stamp" d="M502 100 H544" delay={1.8} duration={0.35} strokeWidth={1.5} />
      <DrawnPath className="text-stamp" d="M536 94 L544 100 L536 106" delay={2.05} duration={0.2} strokeWidth={1.5} />

      <DrawnRect className="text-ink/35" delay={2.15} duration={0.7} height={76} width={200} x={562} y={62} />
      <DrawnLabel className="fill-ink font-sans text-[13px]" delay={2.5} x={582} y={96}>
        B2B and enterprise
      </DrawnLabel>
      <DrawnLabel className="fill-label font-sans text-[12px]" delay={2.6} x={582} y={116}>
        in progress
      </DrawnLabel>

      <DrawnCircle className="text-stamp" cx={700} cy={52} delay={2.8} r={8} strokeWidth={1.6} />
      <DrawnPath className="text-stamp" d="M714 44 Q734 32 746 46" delay={3} duration={0.35} strokeWidth={1.4} />
      <DrawnLabel className="fill-stamp font-mono text-[13px]" delay={3.25} x={752} y={42}>
        shipping now
      </DrawnLabel>

      <DrawnPath className="text-rule" d="M12 178 H762" delay={3.35} strokeWidth={1} />
      <DrawnLabel className="fill-label font-mono text-[10px]" delay={3.55} x={12} y={198}>
        SEP 2025 TO NOW · A TEAM OF TWO, INSIDE A LARGER PRODUCT
      </DrawnLabel>
    </DrawnFigure>
  );
}
