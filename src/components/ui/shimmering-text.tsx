import type { UseInViewOptions } from "motion/react";
import type { CSSProperties } from "react";

import { cn } from "#/lib/utils";
import { motion, useInView } from "motion/react";
import { useMemo, useRef } from "react";

interface ShimmeringTextProps {
  /** Text to display with shimmer effect */
  text: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before starting animation */
  delay?: number;
  /** Whether to repeat the animation */
  repeat?: boolean;
  /** Pause duration between repeats in seconds */
  repeatDelay?: number;
  /** Custom className */
  className?: string;
  /** Whether to start animation when component enters viewport */
  startOnView?: boolean;
  /** Whether to animate only once */
  once?: boolean;
  /** Margin for in-view detection (rootMargin) */
  inViewMargin?: UseInViewOptions["margin"];
  /** Shimmer spread multiplier */
  spread?: number;
  /** Base text color */
  color?: string;
  /** Shimmer gradient color */
  shimmerColor?: string;
}

function ShimmeringText({
  text,
  duration = 2,
  delay = 0,
  repeat = true,
  repeatDelay = 0.5,
  className,
  startOnView = true,
  once = false,
  inViewMargin,
  spread = 2,
  color,
  shimmerColor,
}: ShimmeringTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: inViewMargin });

  const dynamicSpread = useMemo(() => text.length * spread, [text, spread]);
  const shouldAnimate = !startOnView || isInView;

  const style: CSSProperties & Record<`--${string}`, string> = {
    "--spread": `${dynamicSpread}px`,
    backgroundImage: "var(--shimmer-bg), linear-gradient(var(--base-color), var(--base-color))",
  };
  if (color) style["--base-color"] = color;
  if (shimmerColor) style["--shimmer-color"] = shimmerColor;

  return (
    <motion.span
      ref={ref}
      data-slot="shimmering-text"
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
        "[--base-color:var(--muted-foreground)] [--shimmer-color:var(--foreground)]",
        "[background-repeat:no-repeat,padding-box]",
        "[--shimmer-bg:linear-gradient(90deg,transparent_calc(50%-var(--spread)),var(--shimmer-color),transparent_calc(50%+var(--spread)))]",
        className,
      )}
      style={style}
      initial={{
        backgroundPosition: "100% center",
        opacity: 0,
      }}
      animate={
        shouldAnimate
          ? {
              backgroundPosition: "0% center",
              opacity: 1,
            }
          : {}
      }
      transition={{
        backgroundPosition: {
          repeat: repeat ? Infinity : 0,
          duration,
          delay,
          repeatDelay,
          ease: "linear",
        },
        opacity: {
          duration: 0.3,
          delay,
        },
      }}
    >
      {text}
    </motion.span>
  );
}

export { ShimmeringText };
