import { cn } from "#/lib/utils";

export function ChatShimmerLine({ widthClassName }: { widthClassName: string }) {
  return <div className={cn("h-4 animate-pulse rounded-full bg-neutral-950/7", widthClassName)} />;
}
