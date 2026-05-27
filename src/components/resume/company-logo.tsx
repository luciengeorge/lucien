import { cn } from "#/lib/utils";
import { useState } from "react";

function getInitials(company: string) {
  return company
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CompanyLogo({
  className,
  color,
  company,
  logo,
}: {
  className?: string;
  color?: string;
  company: string;
  logo?: string | null;
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
        style={{ backgroundColor: color ?? "#0f172a" }}
      >
        {getInitials(company)}
      </span>
    );
  }

  return (
    <img
      alt={`${company} logo`}
      className={cn("rounded-full bg-white object-cover ring-1 ring-neutral-950/8", className)}
      onError={() => setHasError(true)}
      src={logo}
    />
  );
}
