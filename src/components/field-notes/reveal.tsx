import type { ReactNode } from "react";

import { cn } from "#/lib/utils";
import { motion } from "motion/react";

/**
 * Scroll-triggered reveals for the journal.
 *
 * Everything here animates once, on entry, and never again - the page is a
 * document, not a toy, so re-animating on every scroll-back would read as
 * noise. Reduced-motion is handled globally by `MotionConfig reducedMotion="user"`
 * in the root route: it strips the transform and leaves the fade, so the
 * content still arrives without anything sliding.
 */

const ELEMENTS = {
  article: motion.article,
  div: motion.div,
  li: motion.li,
  ol: motion.ol,
  section: motion.section,
  ul: motion.ul,
} as const;

type ElementKey = keyof typeof ELEMENTS;

const VIEWPORT = { amount: 0.2, once: true } as const;

const HIDDEN = { opacity: 0, y: 12 };
const VISIBLE = { opacity: 1, y: 0 };

const REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const TRANSITION = { duration: 0.5, ease: REVEAL_EASE };

interface RevealProps {
  as?: ElementKey;
  children?: ReactNode;
  className?: string;
  /** Seconds to hold before starting. Use to sequence a header against its body. */
  delay?: number;
}

export function Reveal({ as = "div", children, className, delay = 0, ...rest }: RevealProps) {
  const Component = ELEMENTS[as];

  return (
    <Component
      className={cn(className)}
      initial={HIDDEN}
      whileInView={VISIBLE}
      viewport={VIEWPORT}
      transition={{ ...TRANSITION, delay }}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * A parent that walks its children in. Children must be `RevealItem`s - the
 * stagger is driven by variant propagation, so an item with its own `initial`
 * would opt itself out.
 */
interface RevealGroupProps {
  as?: ElementKey;
  children?: ReactNode;
  className?: string;
  delay?: number;
  /** Seconds between each child. Keep it short; long staggers feel like loading. */
  stagger?: number;
}

export function RevealGroup({ as = "div", children, className, delay = 0, stagger = 0.06, ...rest }: RevealGroupProps) {
  const Component = ELEMENTS[as];

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: delay, staggerChildren: stagger } },
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}

interface RevealItemProps {
  as?: ElementKey;
  children?: ReactNode;
  className?: string;
}

export function RevealItem({ as = "div", children, className, ...rest }: RevealItemProps) {
  const Component = ELEMENTS[as];

  return (
    <Component
      className={cn(className)}
      variants={{ hidden: HIDDEN, visible: VISIBLE }}
      transition={TRANSITION}
      {...rest}
    >
      {children}
    </Component>
  );
}
