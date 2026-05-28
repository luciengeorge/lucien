import type { ReactNode } from "react";

import { Spinner } from "#/components/ui/spinner";
import { usePendingNav } from "#/lib/use-pending-nav";
import { cn } from "#/lib/utils";
import { Link, type LinkComponentProps } from "@tanstack/react-router";
import { useSpinDelay } from "spin-delay";

type SpinDelayOptions = Parameters<typeof useSpinDelay>[1];

type NavLinkProps = Omit<LinkComponentProps<"a">, "children"> & {
  children?: ReactNode;
  /**
   * Optional leading element (e.g., an icon). When the navigation is pending,
   * this is replaced by a spinner.
   */
  icon?: ReactNode;
  /**
   * Override the spin-delay defaults (200ms delay, 200ms min duration). Useful
   * when you want the spinner to appear sooner/later on a specific link.
   */
  spinDelay?: SpinDelayOptions;
};

const DEFAULT_SPIN_DELAY: SpinDelayOptions = { delay: 200, minDuration: 200 };

export function NavLink({ children, className, icon, spinDelay, to, ...props }: NavLinkProps) {
  const targetPath = typeof to === "string" ? to : "";
  const isPending = usePendingNav(targetPath);
  const showSpinner = useSpinDelay(isPending, spinDelay ?? DEFAULT_SPIN_DELAY);

  return (
    <Link
      {...props}
      to={to}
      aria-busy={isPending || undefined}
      className={cn("inline-flex items-center gap-1.5 aria-busy:pointer-events-none aria-busy:opacity-60", className)}
    >
      {showSpinner ? <Spinner className="size-3" /> : icon}
      {children}
    </Link>
  );
}
