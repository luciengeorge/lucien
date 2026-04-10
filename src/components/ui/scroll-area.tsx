import { cn } from "#/lib/utils";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

function ScrollArea({ className, children, ...props }: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({ className, orientation = "vertical", ...props }: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "pointer-events-none relative flex touch-none opacity-0 transition-opacity select-none data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-0 data-horizontal:m-2 data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:before:absolute data-horizontal:before:right-0 data-horizontal:before:-bottom-2 data-horizontal:before:left-0 data-horizontal:before:h-5 data-horizontal:before:w-full data-horizontal:before:content-[''] data-vertical:m-2 data-vertical:h-full data-vertical:w-2.5 data-vertical:before:absolute data-vertical:before:left-1/2 data-vertical:before:h-full data-vertical:before:w-5 data-vertical:before:-translate-x-1/2 data-vertical:before:content-['']",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb data-slot="scroll-area-thumb" className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
