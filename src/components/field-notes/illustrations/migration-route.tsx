import { cn } from "#/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

import { DrawnCircle, DrawnFigure, DrawnLabel } from "./drawn";

const ROUTE = "M18 88 C70 52, 108 96, 152 44 C176 16, 200 34, 224 22";

/** How long the whole journey takes to travel, in seconds. */
const TRAVEL = 1.6;

/*
 * Where each stop falls along the route, as a fraction of total path length.
 * The first bezier (Beirut to Montreal) is roughly twice the arc of the second,
 * so Montreal sits around two thirds of the way rather than halfway. These are
 * measured off the curve above; if ROUTE changes, re-measure them.
 */
const AT_BEY = 0;
const AT_YUL = 0.65;
const AT_LDN = 1;

const START_DELAY = 0.1;
const stopDelay = (fraction: number) => START_DELAY + TRAVEL * fraction;
/** A label lands just after the traveller reaches its stop, not with it. */
const LABEL_LAG = 0.15;

/**
 * Beirut to Montreal to London, drawn as a migration route.
 *
 * The dashes have to stay dashes while the route is revealed, and Motion's
 * pathLength drawing would overwrite the dash pattern to do it (see DrawnPath).
 * So the dashed route is static and a mask travels along it instead: a thick
 * stroke of the same path, drawn with pathLength, used as the reveal window.
 * The result is dashes appearing in travel order, which pathLength alone
 * cannot produce.
 *
 * Each stop then lands as the reveal crosses it, so the labels read as places
 * being reached rather than as decoration fading in.
 */
export function MigrationRoute({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const maskId = useId();

  return (
    <DrawnFigure
      className={cn("text-ink", className)}
      label="Migration route: Beirut, then Montreal, then London"
      viewBox="0 0 240 120"
    >
      <defs>
        <mask id={maskId}>
          <motion.path
            d={ROUTE}
            fill="none"
            stroke="#fff"
            strokeLinecap="round"
            // Comfortably wider than the route's own stroke so the mask never
            // clips the dash caps as it passes over them.
            strokeWidth={12}
            variants={{
              hidden: { pathLength: reduced ? 1 : 0 },
              visible: { pathLength: 1 },
            }}
            transition={reduced ? { duration: 0 } : { delay: START_DELAY, duration: TRAVEL, ease: "easeInOut" }}
          />
        </mask>
      </defs>

      <path
        className="text-rust"
        d={ROUTE}
        fill="none"
        mask={`url(#${maskId})`}
        stroke="currentColor"
        strokeDasharray="5 4"
        strokeLinecap="round"
        strokeWidth={1.5}
      />

      <DrawnCircle cx={18} cy={88} delay={stopDelay(AT_BEY)} r={4.5} stroke="currentColor" strokeWidth={1.5} />
      <DrawnCircle cx={152} cy={44} delay={stopDelay(AT_YUL)} r={4.5} stroke="currentColor" strokeWidth={1.5} />
      <DrawnCircle className="text-rust" cx={224} cy={22} delay={stopDelay(AT_LDN)} fill="currentColor" r={5.5} />

      <DrawnLabel className="fill-label font-mono text-[10px]" delay={stopDelay(AT_BEY) + LABEL_LAG} x={6} y={108}>
        BEY
      </DrawnLabel>
      <DrawnLabel className="fill-label font-mono text-[10px]" delay={stopDelay(AT_YUL) + LABEL_LAG} x={138} y={66}>
        YUL
      </DrawnLabel>
      <DrawnLabel className="fill-label font-mono text-[10px]" delay={stopDelay(AT_LDN) + LABEL_LAG} x={206} y={14}>
        LDN
      </DrawnLabel>
    </DrawnFigure>
  );
}
