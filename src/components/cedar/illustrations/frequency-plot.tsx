import { cn } from "#/lib/utils";

import { DrawnFigure, DrawnLabel, DrawnPath } from "../../field-notes/illustrations/drawn";

/**
 * How often each tool actually shows up in the work, rather than a
 * self-scored proficiency chart nobody believes.
 *
 * Each bar is a straight path, so drawing it with pathLength *is* the bar
 * growing from the left - the same primitive as every other figure, no
 * separate scale animation needed.
 *
 * Cedar green is the ground here and terracotta marks only the top two, so the
 * ranking is legible from the colour before you read a single label.
 */
interface Band {
  colorClass: string;
  label: string;
  /** Bar end, on the 0-250 viewBox scale. */
  to: number;
}

const BANDS: readonly Band[] = [
  { colorClass: "text-terracotta", label: "TypeScript", to: 196 },
  { colorClass: "text-terracotta", label: "React", to: 176 },
  { colorClass: "text-cedar", label: "Convex", to: 124 },
  { colorClass: "text-cedar", label: "Ruby on Rails", to: 88 },
  { colorClass: "text-cedar", label: "Swift, Kotlin", to: 54 },
];

const ROW_HEIGHT = 38;
const BAR_Y = 8;
const STAGGER = 0.12;

export function FrequencyPlot({ className }: { className?: string }) {
  return (
    <DrawnFigure
      className={cn(className)}
      label="Frequency of use: TypeScript and React most often, then Convex, Ruby on Rails, Swift and Kotlin"
      viewBox="0 0 250 196"
    >
      {BANDS.map((band, index) => {
        const y = BAR_Y + index * ROW_HEIGHT;
        const delay = index * STAGGER;

        return (
          <g key={band.label}>
            <DrawnPath
              className={band.colorClass}
              d={`M4 ${y} H${band.to}`}
              delay={delay}
              duration={0.7}
              stroke="currentColor"
              strokeWidth={4}
            />
            <DrawnLabel className="fill-label font-mono text-[10px]" delay={delay + 0.3} x={4} y={y + 18}>
              {band.label}
            </DrawnLabel>
          </g>
        );
      })}
    </DrawnFigure>
  );
}
