import { motion, useReducedMotion } from "motion/react";

/**
 * Beirut outward. Three stops, in order, with the connector drawing downward
 * between them and each stop arriving as the line reaches it.
 *
 * This used to be a drawn map hidden behind `role="img"`, which meant the one
 * fact it carried - where he has lived and when - was unreadable to anyone
 * using a screen reader. It is an ordered list now: the places and years are
 * real text, and only the connecting rules are decorative.
 */
export const ROUTE_STOPS = [
  { current: false, place: "Beirut", year: "from" },
  { current: false, place: "Montreal", year: "2013" },
  { current: true, place: "London", year: "2018" },
] as const;

/** Seconds the line takes to cross one gap, and the pause before a stop lands. */
const SEGMENT = 0.45;
const STOP_LAG = 0.12;

export function RouteStops() {
  const reduced = useReducedMotion();
  const viewport = { amount: 0.6, once: true } as const;

  return (
    <ol className="flex flex-col">
      {ROUTE_STOPS.map((stop, index) => (
        <li className="flex flex-col" key={stop.place}>
          {index > 0 ? (
            <motion.span
              aria-hidden="true"
              className="ml-[3px] block h-6 w-0.5 border-l-2 border-dotted border-leader"
              data-slot="route-connector"
              initial={reduced ? { opacity: 1 } : { scaleY: 0 }}
              style={{ transformOrigin: "top" }}
              transition={reduced ? { duration: 0 } : { delay: (index - 1) * SEGMENT, duration: SEGMENT }}
              viewport={viewport}
              whileInView={reduced ? { opacity: 1 } : { scaleY: 1 }}
            />
          ) : null}

          <motion.span
            className="flex items-baseline gap-3"
            data-current={stop.current ? "true" : undefined}
            initial={{ opacity: reduced ? 1 : 0 }}
            transition={reduced ? { duration: 0 } : { delay: index * SEGMENT + STOP_LAG, duration: 0.3 }}
            viewport={viewport}
            whileInView={{ opacity: 1 }}
          >
            <span
              aria-hidden="true"
              className={`mt-[5px] size-[7px] shrink-0 self-start ${stop.current ? "bg-stamp" : "bg-ink"}`}
            />
            <span className="shrink-0 font-mono text-xs font-semibold tracking-[0.12em] text-ink uppercase">
              {stop.place}
            </span>
            <span aria-hidden className="leader" />
            <span className="shrink-0 font-mono text-xs whitespace-nowrap text-ink-soft">{stop.year}</span>
          </motion.span>
        </li>
      ))}
    </ol>
  );
}
