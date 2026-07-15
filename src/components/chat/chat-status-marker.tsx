import { Marker, MarkerContent, MarkerIcon } from "#/components/ui/marker";
import { ShimmeringText } from "#/components/ui/shimmering-text";
import { Spinner } from "#/components/ui/spinner";

export function ChatStatusMarker({ label }: { label: string }) {
  return (
    <Marker role="status">
      <MarkerIcon>
        <Spinner />
      </MarkerIcon>
      <MarkerContent>
        <ShimmeringText duration={1.8} startOnView={false} text={label} />
      </MarkerContent>
    </Marker>
  );
}
