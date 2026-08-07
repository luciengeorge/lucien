import { cn } from "#/lib/utils";

import { DrawnCircle, DrawnFigure, DrawnLabel, DrawnPath } from "./drawn";

/**
 * Beirut to Montreal to London, plotted as a migration route.
 *
 * The dashed line fades in rather than drawing (see DrawnPath), so the motion
 * carries in the stations instead: each stop lands in order, west to east, and
 * London arrives last and filled because that is where he still is.
 */
export function MigrationRoute({ className }: { className?: string }) {
  return (
    <DrawnFigure
      className={cn("text-ink", className)}
      label="Migration route: Beirut, then Montreal, then London"
      viewBox="0 0 240 120"
    >
      <DrawnPath
        className="text-rust"
        d="M18 88 C70 52, 108 96, 152 44 C176 16, 200 34, 224 22"
        duration={1.2}
        stroke="currentColor"
        strokeDasharray="5 4"
        strokeWidth={1.5}
      />
      <DrawnCircle cx={18} cy={88} delay={0.15} r={4.5} stroke="currentColor" strokeWidth={1.5} />
      <DrawnCircle cx={152} cy={44} delay={0.45} r={4.5} stroke="currentColor" strokeWidth={1.5} />
      <DrawnCircle className="text-rust" cx={224} cy={22} delay={0.75} fill="currentColor" r={5.5} />
      <DrawnLabel className="fill-label font-mono text-[10px]" delay={0.3} x={6} y={108}>
        BEY
      </DrawnLabel>
      <DrawnLabel className="fill-label font-mono text-[10px]" delay={0.6} x={138} y={66}>
        YUL
      </DrawnLabel>
      <DrawnLabel className="fill-label font-mono text-[10px]" delay={0.9} x={206} y={14}>
        LDN
      </DrawnLabel>
    </DrawnFigure>
  );
}
