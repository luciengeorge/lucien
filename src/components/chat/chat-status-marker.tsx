import { ShimmeringText } from "#/components/ui/shimmering-text";
import { Spinner } from "#/components/ui/spinner";
import { Trace, TraceIcon, TraceLine, TraceTitle } from "#/components/ui/trace";

/** A step Poof is in the middle of, drawn as a Trace line so it lines up with the reasoning row. */
export function ChatStatusMarker({ label }: { label: string }) {
  return (
    <Trace role="status">
      <TraceLine status="running">
        <TraceIcon>
          <Spinner />
        </TraceIcon>
        <TraceTitle>
          <ShimmeringText duration={1.8} startOnView={false} text={label} />
        </TraceTitle>
      </TraceLine>
    </Trace>
  );
}
