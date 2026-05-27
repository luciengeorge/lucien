import { buttonVariants } from "#/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "#/components/ui/empty";
import { cn } from "#/lib/utils";
import { Compass01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="flex min-h-0 grow items-center justify-center px-4 sm:px-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-10 rounded-full">
            <HugeiconsIcon icon={Compass01Icon} />
          </EmptyMedia>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Error 404</p>
          <EmptyTitle className="text-xl sm:text-2xl">Poof - this page vanished</EmptyTitle>
          <EmptyDescription>
            The page you're looking for doesn't exist, has moved, or never existed in the first place.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link to="/" className={cn(buttonVariants(), "rounded-full")}>
            Back to chat
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  );
}
