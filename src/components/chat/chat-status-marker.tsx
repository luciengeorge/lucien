import { ShimmeringText } from "#/components/ui/shimmering-text";

/** What Poof is doing, on the same line as its face: the moving face is the spinner. */
export function PoofStatus({ label }: { label: string }) {
  return (
    <span className="text-sm text-neutral-500" role="status">
      <ShimmeringText duration={1.8} startOnView={false} text={label} />
    </span>
  );
}

/** A line about the conversation rather than in it, centered between the bubbles. */
export function ChatSystemNote({ busy = false, children }: { busy?: boolean; children: string }) {
  return (
    <p className="mx-auto max-w-sm text-center text-xs text-balance text-neutral-500" role="status">
      {busy ? <ShimmeringText duration={1.8} startOnView={false} text={children} /> : children}
    </p>
  );
}
