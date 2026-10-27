/**
 * An eye is a lens between two curves that share a left and a right corner. `top` and `bottom`
 * are how far each curve bulges away from the corner line (a negative `bottom` bulges upward,
 * which turns the lens into a crescent). Every shape has the same numbers, so any two morph into
 * each other by blending them.
 *
 * `tilt` is in degrees and mirrored per side: positive raises both inner corners (worried, sad),
 * negative lowers them (stern). `dy` shifts the eye down.
 */
export type EyeShape = { bottom: number; dy: number; tilt: number; top: number; w: number };

export const EYES = {
  open: { bottom: 5, dy: 0, tilt: 0, top: 5, w: 4.2 },
  wide: { bottom: 5.6, dy: -0.6, tilt: 0, top: 6.2, w: 5.2 },
  half: { bottom: 3.6, dy: 0.4, tilt: 0, top: 2.4, w: 4.6 },
  focus: { bottom: 1.7, dy: 0.6, tilt: 0, top: 1.9, w: 4.8 },
  heavy: { bottom: 3.8, dy: 1.2, tilt: 6, top: 0.3, w: 4.8 },
  happy: { bottom: -2.7, dy: 0.4, tilt: 0, top: 5.8, w: 6.6 },
  sleep: { bottom: 2.6, dy: 1.6, tilt: 0, top: -1.5, w: 5.8 },
  sad: { bottom: 4.4, dy: 1, tilt: 20, top: 0.6, w: 4.8 },
  angry: { bottom: 4.4, dy: 0.6, tilt: -26, top: 0.3, w: 5.4 },
  squeeze: { bottom: -0.5, dy: 0.6, tilt: -16, top: 2.4, w: 5.6 },
  doubt: { bottom: 3, dy: 1, tilt: -10, top: 0.8, w: 4.8 },
  pop: { bottom: 6.4, dy: -0.8, tilt: 0, top: 6.4, w: 6.4 },
  beam: { bottom: -3.4, dy: 0, tilt: 8, top: 7.2, w: 7.6 },
  smug: { bottom: 3.8, dy: 0.5, tilt: -4, top: 0.7, w: 5.8 },
  shy: { bottom: 3.4, dy: 0.9, tilt: 12, top: 1.8, w: 4.4 },
} satisfies Record<string, EyeShape>;

export type EyeName = keyof typeof EYES;

const KAPPA = 4 / 3;
const MIN_THICKNESS = 0.9;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const round = (n: number) => Math.round(n * 100) / 100;

export function mixEye(a: EyeShape, b: EyeShape, t: number): EyeShape {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    bottom: lerp(a.bottom, b.bottom, t),
    dy: lerp(a.dy, b.dy, t),
    tilt: lerp(a.tilt, b.tilt, t),
    top: lerp(a.top, b.top, t),
    w: lerp(a.w, b.w, t),
  };
}

/** Squeezes the eye toward its corner line. Fully shut is a thin line, never nothing. */
export function withLid(shape: EyeShape, lid: number): EyeShape {
  const top = shape.top * lid;
  const bottom = shape.bottom * lid;
  return top + bottom >= MIN_THICKNESS ? { ...shape, bottom, top } : { ...shape, bottom: MIN_THICKNESS - top, top };
}

export function eyePath(shape: EyeShape, cx: number, cy: number, side: "left" | "right"): string {
  const half = shape.w / 2;
  const y = cy + shape.dy;
  const angle = ((side === "left" ? -shape.tilt : shape.tilt) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const at = (x: number, py: number) => {
    const dx = x - cx;
    const dy = py - y;
    return `${round(cx + dx * cos - dy * sin)} ${round(y + dx * sin + dy * cos)}`;
  };
  const up = y - KAPPA * shape.top;
  const down = y + KAPPA * shape.bottom;
  const left = cx - half;
  const right = cx + half;
  return `M${at(left, y)}C${at(left, up)} ${at(right, up)} ${at(right, y)}C${at(right, down)} ${at(left, down)} ${at(left, y)}Z`;
}
