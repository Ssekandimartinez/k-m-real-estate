import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type VisualAsset = {
  id: string;
  type: "image" | "video";
  url: string;
  poster?: string;
  alt: string;
  placement: string;
  category: string;
};
export function useVisualMedia() {
  return useQuery({
    queryKey: ["visual-media"],
    queryFn: () => api<{ assets: VisualAsset[] }>("/visual-media"),
    staleTime: 300000,
  });
}
export function useVisual(slot: string) {
  return useVisualMedia().data?.assets.find(
    (asset) => asset.placement === slot,
  );
}
export function VisualPhoto({
  slot,
  className,
  priority = false,
}: {
  slot: string;
  className?: string;
  priority?: boolean;
}) {
  const asset = useVisual(slot);
  return asset ? (
    <img
      className={className}
      src={asset.url}
      alt={asset.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  ) : null;
}
export function VisualVideo({ asset }: { asset: VisualAsset }) {
  return (
    <video
      controls
      playsInline
      muted
      preload="none"
      poster={asset.poster}
      aria-label={asset.alt}
      onPlay={(event) => {
        document.querySelectorAll("video").forEach((other) => {
          if (other !== event.currentTarget) other.pause();
        });
      }}
    >
      <source src={asset.url} type="video/mp4" />
      Your browser does not support video playback.
    </video>
  );
}
export function SlotVideo({ slot }: { slot: string }) {
  const asset = useVisual(slot);
  return asset ? (
    <figure className="service-film">
      <VisualVideo asset={asset} />
    </figure>
  ) : null;
}
