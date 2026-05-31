import type { CSSProperties } from "react";

import { companyInitials } from "#/lib/resume/load";
import { cn } from "#/lib/utils";
import { useState } from "react";

export function CompanyLogo({
  className,
  color,
  company,
  logo,
  style,
}: {
  className?: string;
  color?: string;
  company: string;
  logo?: string | null;
  style?: CSSProperties;
}) {
  const [hasError, setHasError] = useState(false);
  const useFallback = !logo || hasError;

  if (useFallback) {
    return (
      <span
        aria-label={company}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-xs font-semibold text-white",
          className,
        )}
        style={{ backgroundColor: color ?? "#0f172a", ...style }}
      >
        {companyInitials(company)}
      </span>
    );
  }

  return (
    <img
      alt={`${company} logo`}
      className={cn("rounded-full bg-white object-cover ring-1 ring-neutral-950/8", className)}
      onError={() => setHasError(true)}
      src={logo}
      style={style}
    />
  );
}
