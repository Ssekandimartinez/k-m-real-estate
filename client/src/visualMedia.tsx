import ResponsiveImage from "./ResponsiveImage";
import { publicContent } from "./staticContent";
import { useEffect, useRef, useState } from "react";

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
  // Curated media ships with the frontend, so it must not wait for the API.
  return { data: publicContent.visualMedia, error: null };
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
    <ResponsiveImage
      className={className}
      src={asset.url}
      alt={asset.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  ) : (
    <span
      className={className}
      aria-hidden="true"
      style={{ display: "block", aspectRatio: "3 / 2", background: "#ebdac5" }}
    />
  );
}
export function VisualVideo({ asset }: { asset: VisualAsset }) {
  const element = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!window.IntersectionObserver) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  return (
    <video
      ref={element}
      controls
      playsInline
      muted
      preload="none"
      poster={visible ? asset.poster : undefined}
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
