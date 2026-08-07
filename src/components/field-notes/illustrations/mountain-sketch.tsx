import { cn } from "#/lib/utils";

import { ANNOTATION_DELAY, DrawnCircle, DrawnFigure, DrawnPath, INK_DURATION } from "./drawn";

/**
 * The peak profile from the journal's cover, drawn in the hero.
 *
 * Order matters: the ridge draws left to right, the dashed ascent traces over
 * it, then the summit gets circled and flicked - the sequence a hand actually
 * follows when it marks the point it cares about.
 */
export function MountainSketch({ className }: { className?: string }) {
  return (
    <DrawnFigure
      className={cn("text-ink", className)}
      label="A hand-drawn mountain profile with the summit circled"
      viewBox="0 0 200 150"
    >
      <DrawnPath d="M10 128 L58 52 L86 92 L120 34 L190 128 Z" duration={INK_DURATION * 1.2} strokeWidth={2} />
      <DrawnPath
        d="M10 128 L58 52 L86 92 L120 34"
        delay={ANNOTATION_DELAY * 0.6}
        stroke="currentColor"
        strokeDasharray="4 4"
        strokeWidth={2}
      />
      <DrawnCircle
        className="text-rust"
        cx={120}
        cy={34}
        delay={ANNOTATION_DELAY + 0.25}
        r={7}
        stroke="currentColor"
        strokeWidth={2}
      />
      <DrawnPath
        className="text-rust"
        d="M138 26 Q156 16 162 30"
        delay={ANNOTATION_DELAY + 0.55}
        duration={0.45}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </DrawnFigure>
  );
}
