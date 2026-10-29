import ResponsiveImage from "./ResponsiveImage";
import { useSearchParams } from "react-router-dom";
import { useVisualMedia, VisualVideo } from "./visualMedia";
import { LoadingError, PageHero } from "./Public";

export default function MediaGallery() {
  const { data, error } = useVisualMedia();
  const [params, setParams] = useSearchParams();
  const type = params.get("type") || "all";
  const category = params.get("category") || "all";
  const page = Math.max(1, Math.floor(Number(params.get("page")) || 1));
  const assets = data?.assets.filter((a) => a.placement === "gallery") || [];
  const categories = [...new Set(assets.map((a) => a.category))].sort();
  const filtered = assets.filter(
    (a) =>
      (type === "all" || a.type === type) &&
      (category === "all" || a.category === category),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 18));
  const current = Math.min(page, pages);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next);
    if (key === "page")
      document
        .querySelector(".gallery-filters")
        ?.scrollIntoView?.({ block: "start" });
  }
  return (
    <>
      <PageHero
        eyebrow="PHOTOS & VIDEOS"
        title="Gallery"
        description="Browse our visual collection of property, design, construction and supply inspiration."
      />
      <section className="section container">
        <div className="gallery-filters">
          <label>
            Media type
            <select
              value={type}
              onChange={(event) => filter("type", event.target.value)}
            >
              <option value="all">Photos & videos</option>
              <option value="image">Photos</option>
              <option value="video">Videos</option>
            </select>
          </label>
          <label>
            Explore by subject
            <select
              value={category}
              onChange={(event) => filter("category", event.target.value)}
            >
              <option value="all">All subjects</option>
              {categories.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        {!data || error ? (
          <LoadingError error={error} />
        ) : (
          <>
            <p role="status">
              {filtered.length} items · Page {current} of {pages}
            </p>
            <div className="visual-gallery">
              {filtered.slice((current - 1) * 18, current * 18).map((asset) => (
                <figure key={asset.id}>
                  {asset.type === "video" ? (
                    <VisualVideo asset={asset} />
                  ) : (
                    <ResponsiveImage
                      sizes="(max-width: 700px) 100vw, 33vw"
                      src={asset.url}
                      alt={asset.alt}
                      loading="lazy"
                      width="1400"
                      height="933"
                    />
                  )}
                  <figcaption>
                    <span className="eyebrow">
                      {asset.category} ·{" "}
                      {asset.type === "video" ? "Video" : "Photo"}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            {!filtered.length && <p>No media matches these filters.</p>}
            <div className="pagination" aria-label="Gallery pages">
              <button
                disabled={current === 1}
                onClick={() => filter("page", String(current - 1))}
              >
                Previous
              </button>
              <button
                disabled={current === pages}
                onClick={() => filter("page", String(current + 1))}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
