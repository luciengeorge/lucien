import { cn } from "#/lib/utils";

import { DrawnCircle, DrawnFigure, DrawnLabel, DrawnPath, DrawnRect } from "./drawn";

/**
 * Fig. 1 on the Fyxer sheet: how the notetaker records without a bot.
 *
 * The animation follows the data. Boxes draw left to right, each arrow travels
 * only after the box it leaves has finished, and the "he built this" note is
 * last - the annotation you add once the diagram is already on the page.
 */
export function RecordingFlow({ className }: { className?: string }) {
  return (
    <DrawnFigure
      className={cn("text-ink", className)}
      label="Diagram: a meeting feeds the desktop app, which feeds the meeting chat"
      viewBox="0 0 820 210"
    >
      <DrawnRect duration={0.7} height={76} width={150} x={14} y={62} />
      <DrawnLabel className="fill-ink font-mono text-[12px]" delay={0.5} x={34} y={96}>
        the meeting
      </DrawnLabel>
      <DrawnLabel className="fill-label font-mono text-[11px]" delay={0.6} x={34} y={116}>
        no bot joins
      </DrawnLabel>

      <DrawnPath className="text-rust" d="M172 100 H262" delay={0.75} duration={0.4} strokeWidth={1.5} />
      <DrawnPath className="text-rust" d="M254 94 L262 100 L254 106" delay={1.05} duration={0.2} strokeWidth={1.5} />

      <DrawnRect delay={1.15} duration={0.7} height={104} strokeDasharray="6 4" width={176} x={272} y={48} />
      <DrawnLabel className="fill-ink font-mono text-[12px]" delay={1.55} x={294} y={86}>
        desktop app
      </DrawnLabel>
      <DrawnLabel className="fill-label font-mono text-[11px]" delay={1.65} x={294} y={106}>
        Electron, macOS
      </DrawnLabel>
      <DrawnLabel className="fill-label font-mono text-[11px]" delay={1.72} x={294} y={124}>
        and Windows
      </DrawnLabel>

      <DrawnPath className="text-rust" d="M456 100 H546" delay={1.85} duration={0.4} strokeWidth={1.5} />
      <DrawnPath className="text-rust" d="M538 94 L546 100 L538 106" delay={2.15} duration={0.2} strokeWidth={1.5} />

      <DrawnRect delay={2.25} duration={0.7} height={76} width={180} x={556} y={62} />
      <DrawnLabel className="fill-ink font-mono text-[12px]" delay={2.65} x={578} y={96}>
        meeting chat
      </DrawnLabel>
      <DrawnLabel className="fill-label font-mono text-[11px]" delay={2.75} x={578} y={116}>
        decisions, actions
      </DrawnLabel>

      <DrawnCircle className="text-rust" cx={646} cy={52} delay={2.95} r={8} strokeWidth={1.6} />
      <DrawnPath className="text-rust" d="M660 44 Q680 32 692 46" delay={3.15} duration={0.35} strokeWidth={1.4} />
      <DrawnLabel className="fill-pen font-display text-[14px] italic" delay={3.4} x={698} y={42}>
        he built this
      </DrawnLabel>

      <DrawnPath className="text-dot" d="M20 178 H756" delay={3.5} strokeDasharray="4 5" strokeWidth={1} />
      <DrawnLabel className="fill-label font-mono text-[10px]" delay={3.7} x={20} y={198}>
        48% OF USERS ASKED FOR RECORDING WITHOUT A BOT PRESENT
      </DrawnLabel>
    </DrawnFigure>
  );
}
