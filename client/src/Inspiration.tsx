import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useVisualMedia, VisualPhoto, VisualVideo } from "./visualMedia";

export function Inspiration() {
  const { data } = useVisualMedia();
  return (
    <section
      className="section container inspiration"
      aria-labelledby="inspiration-title"
    >
      <div className="section-title">
        <div>
          <p className="eyebrow">ROOM TO IMAGINE</p>
          <h2 id="inspiration-title">
            See the possibilities. Shape your next move.
          </h2>
          <p className="muted">
            Spaces, details and the work that brings an idea to life.
          </p>
        </div>
        <Link className="text-link" to="/gallery">
          Explore all photos & videos <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="inspiration-photos">
        {[
          "A space to feel at home.",
          "Details make the difference.",
          "Start with the right guidance.",
        ].map((title, i) => (
          <Link
            className="inspiration-photo"
            to={
              i === 1
                ? "/services/category/plumbing-and-technical-services"
                : i === 2
                  ? "/services/category/real-estate-and-property-services"
                  : "/services/category/construction-and-design"
            }
            key={title}
          >
            <VisualPhoto slot={`home-inspiration-${i}`} />
            <span>
              {title}
              <ArrowUpRight size={20} />
            </span>
          </Link>
        ))}
      </div>
      <div className="inspiration-videos">
        {data?.assets
          .filter((a) => a.placement.startsWith("home-video-"))
          .map((asset) => (
            <figure key={asset.id}>
              <VisualVideo asset={asset} />
              <figcaption>
                <p className="eyebrow">WATCH & EXPLORE</p>
                <h3>{asset.category}</h3>
              </figcaption>
            </figure>
          ))}
      </div>
      <Link className="button" to="/gallery">
        Discover the full visual collection <ArrowUpRight size={18} />
      </Link>
    </section>
  );
}
