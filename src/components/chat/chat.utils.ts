import { cn } from "#/lib/utils";

export function entryItemClassName(isFirst: boolean) {
  return cn("py-6 sm:py-8", !isFirst && "border-t border-neutral-950/8");
}
