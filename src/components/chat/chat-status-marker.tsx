import { Marker, MarkerContent, MarkerIcon } from "#/components/ui/marker";
import { Spinner } from "#/components/ui/spinner";

export function ChatStatusMarker({ label }: { label: string }) {
  return (
    <Marker role="status">
      <MarkerIcon>
        <Spinner />
      </MarkerIcon>
      <MarkerContent className="shimmer">{label}</MarkerContent>
    </Marker>
  );
}
