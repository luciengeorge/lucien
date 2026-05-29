import type { SVGProps } from "react";

/**
 * Lucien George monogram. Authored as a 90×90 SVG with `currentColor` fills
 * so it adapts to the surrounding text color (light/dark themes, hover states).
 */
export function InitialsMark({ title = "Lucien George", ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 90 90"
      fill="currentColor"
      role="img"
      aria-label={title}
      {...props}
    >
      <path d="M9.5 80H80L90 90H0L9.5 80Z" />
      <path d="M9.10107 0H73.8202L63.9999 10H73.8202H9.10107H20.4999L9.10107 0Z" />
      <path d="M0 0L10 10V80L0 90V0Z" />
      <path d="M80 59.8637L90 51V79.8637L80 70.3637V59.8637Z" />
    </svg>
  );
}
