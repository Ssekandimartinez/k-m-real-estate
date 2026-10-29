import { lazy, Suspense, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LazyMotion, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
const loadAnimation = () =>
  import("./motion-features").then((mod) => mod.default);
import {
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  Check,
  Compass,
  HardHat,
  Layers3,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Square,
  Unplug,
  Wrench,
  Mail,
  CalendarDays,
} from "lucide-react";
import {
  api,
  destinations,
  type Category,
  type CustomerRequest,
  type Entry,
} from "./api";
import { useCompany } from "./App";
const labels: Record<string, string> = {
  property: "Properties",
  project: "Projects",
  post: "Blog & Insights",
  product: "Materials & Supply Catalogue",
  service: "Services",
};
const icons = [Building2, HardHat, Layers3, Package, Unplug, Wrench];
const groupNames = [
  "Real Estate & Property Services",
  "Construction & Design",
  "Construction Materials",
  "General Supplies & Procurement",
  "Electrical, Electronics & IT Solutions",
  "Plumbing & Technical Services",
];
const groupSlugs = [
  "real-estate-and-property-services",
  "construction-and-design",
  "construction-materials",
  "general-supplies-and-procurement",
  "electrical-electronics-and-it-solutions",
  "plumbing-and-technical-services",
];
const groupImages = [
  "consultancy",
  "construction",
  "materials",
  "supplies",
  "electrical",
  "plumbing",
];
function SectionTitle({
  eyebrow,
  title,
  description,
  link,
  to,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  link?: string;
  to?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p className="muted">{description}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {link || "Explore more"} <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function Empty({ kind }: { kind: string }) {
  return (
    <div className="empty">
      <Compass size={34} strokeWidth={1} />
      <h3>
        {kind === "property"
          ? "Your next opportunity starts with a conversation."
          : kind === "project"
            ? "Our portfolio is being prepared."
            : "There’s more to come."}
      </h3>
      <p>
        {kind === "property"
          ? "No published properties match this selection. Tell us what you’re looking for and our team can help."
          : kind === "project"
            ? "We’ll share verified company projects here as they are published."
            : "Our team will publish new information here. In the meantime, we’re happy to help."}
      </p>
      <Link to="/contact" className="text-link">
        Talk to our team <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
export function LoadingError({ error }: { error?: Error | null }) {
  return error ? (
    <div className="notice error" role="alert">
      {error.message}{" "}
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>
  ) : (
    <p className="loading" role="status">
      Loading the latest information…
    </p>
  );
}
export function Card({ item }: { item: Entry }) {
  return (
    <article className="card">
      {item.images[0] && (
        <Link
          to={`/${destinations[item.kind]}/${item.slug}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="card-image">
            <img
              src={item.images[0].url}
              alt={item.images[0].alt}
              loading="lazy"
            />
            {item.transaction && (
              <span className="badge">
                For {item.transaction === "SALE" ? "sale" : "rent"}
              </span>
            )}
          </div>
        </Link>
      )}
      <div className="card-content">
        <p className="eyebrow">
          {item.specs.supplyCategory || item.category?.name || item.kind}
        </p>
        {item.location && (
          <p className="location">
            <MapPin size={13} />
            {item.location}
          </p>
        )}
        <h3>
          <Link to={`/${destinations[item.kind]}/${item.slug}`}>
            {item.title}
          </Link>
        </h3>
        {item.kind === "property" ? (
          <>
            <p className="price">
              {item.price !== null
                ? `${item.currency} ${Number(item.price).toLocaleString()}`
                : "Price on request"}{" "}
              {item.transaction === "RENT" && (
                <small>
                  {item.specs.rentalPeriod || "Rental terms on request"}
                </small>
              )}
            </p>
            <div className="specs">
              {item.bedrooms !== null && (
                <span>
                  <BedDouble size={16} />
                  {item.bedrooms} beds
                </span>
              )}
              {item.bathrooms !== null && (
                <span>
                  <Bath size={16} />
                  {item.bathrooms} baths
                </span>
              )}
              {item.area !== null && (
                <span>
                  <Square size={15} />
                  {item.area} m²
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="muted">{item.summary}</p>
        )}
        {item.kind === "post" && item.publishedAt && (
          <p className="muted">
            {new Date(item.publishedAt).toLocaleDateString("en-GB")}
          </p>
        )}
        <Link
          className="text-link"
          to={`/${destinations[item.kind]}/${item.slug}`}
        >
          {item.kind === "product"
            ? "View item & request quote"
            : item.kind === "post"
              ? "Read article"
              : "View details"}{" "}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
function Featured({
  kind,
  eyebrow,
  title,
  to,
}: {
  kind: string;
  eyebrow: string;
  title: string;
  to: string;
}) {
  const { data, error } = useQuery({
    queryKey: ["featured", kind],
    queryFn: () =>
      api<{ items: Entry[]; total: number }>(
        `/content/${kind}?${kind === "post" ? "" : "featured=true&"}limit=3`,
      ),
  });
  return (
    <section className="section container">
      <SectionTitle
        eyebrow={eyebrow}
        title={title}
        to={to}
        link={`View all ${kind === "post" ? "insights" : labels[kind].toLowerCase()}`}
      />
      {error || !data ? (
        <LoadingError error={error} />
      ) : data.items.length ? (
        <div className="grid three">
          {data.items.map((v) => (
            <Card key={v.id} item={v} />
          ))}
        </div>
      ) : (
        <Empty kind={kind} />
      )}
    </section>
  );
}
export function SearchForm({ expanded = false }: { expanded?: boolean }) {
  const [params] = useSearchParams();
  const { data: categories } = useQuery({
    queryKey: ["categories", "property"],
    queryFn: () => api<Category[]>("/categories?kind=property"),
  });
  return (
    <form
      action="/properties"
      className={`search-form ${expanded ? "expanded" : ""}`}
      key={params.toString()}
    >
      <label>
        Looking to
        <select
          name="transaction"
          defaultValue={params.get("transaction") || ""}
        >
          <option value="">Buy or rent</option>
          <option value="SALE">Buy</option>
          <option value="RENT">Rent</option>
        </select>
      </label>
      <label>
        Location
        <input
          name="location"
          placeholder="City or neighbourhood"
          defaultValue={params.get("location") || ""}
        />
      </label>
      <label>
        Property type
        <select name="category" defaultValue={params.get("category") || ""}>
          <option value="">All property types</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Currency
        <select name="currency" defaultValue={params.get("currency") || "USD"}>
          <option>USD</option>
          <option>SSP</option>
        </select>
      </label>
      <label>
        Min. price
        <input
          name="min"
          type="number"
          min="0"
          placeholder="Any"
          defaultValue={params.get("min") || ""}
        />
      </label>
      <label>
        Max. price
        <input
          name="max"
          type="number"
          min="0"
          placeholder="Any"
          defaultValue={params.get("max") || ""}
        />
      </label>
      {expanded && (
        <>
          <label>
            Min. bedrooms
            <input
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={params.get("bedrooms") || ""}
            />
          </label>
          <label>
            Min. bathrooms
            <input
              name="bathrooms"
              type="number"
              min="0"
              defaultValue={params.get("bathrooms") || ""}
            />
          </label>
          <label>
            Feature
            <input
              name="amenity"
              placeholder="e.g. Garden"
              defaultValue={params.get("amenity") || ""}
            />
          </label>
          <label>
            Sort by
            <select name="sort" defaultValue={params.get("sort") || "newest"}>
              <option value="newest">Newest listings</option>
              <option value="price-asc">Lowest price</option>
              <option value="price-desc">Highest price</option>
            </select>
          </label>
        </>
      )}
      <button className="button" type="submit">
        <Search size={18} />
        <span>Find a property</span>
      </button>
    </form>
  );
}
export function Home() {
  const c = useCompany();
  const reduced = useReducedMotion();
  return (
    <>
      <section className="hero">
        <img
          className="hero-image"
          src={c?.heroImage || "/images/architecture.webp"}
          alt="Contemporary residential architecture, shown for inspiration"
          fetchPriority="high"
          srcSet={
            !c || c.heroImage === "/images/architecture.webp"
              ? "/images/architecture-mobile.webp 900w, /images/architecture.webp 1800w"
              : undefined
          }
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="container hero-content">
          <LazyMotion features={loadAnimation}>
            <m.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.7 }}
            >
              <p className="eyebrow light">
                <span /> ROOTED IN JUBA. BUILT AROUND YOU.
              </p>
              <h1>
                {c?.heroTitle || "Your Property. Our Expertise. Real Results."}
              </h1>
              <p>
                {c?.heroDescription ||
                  "Professional real estate, construction, design and supply solutions in South Sudan."}
              </p>
              <div className="actions">
                <Link className="button sand" to="/properties">
                  Explore Properties <ArrowUpRight size={18} />
                </Link>
                <Link className="button outline-light" to="/services">
                  Our Services <ArrowUpRight size={18} />
                </Link>
              </div>
            </m.div>
          </LazyMotion>
          <div className="hero-caption">
            <span>01 / A NEW PERSPECTIVE</span>
            <span>
              Spaces for living.
              <br />
              Possibilities for tomorrow.
            </span>
          </div>
        </div>
      </section>
      <div className="container search-wrap">
        <p className="eyebrow">FIND A SPACE THAT FITS YOUR NEXT CHAPTER</p>
        <SearchForm />
      </div>
      <div className="expertise-line container">
        <span>PROPERTY</span>
        <span>CONSTRUCTION</span>
        <span>DESIGN</span>
        <span>CONSULTANCY</span>
        <span>SUPPLIES</span>
      </div>
      <section className="section container about-intro">
        <div className="editorial-image">
          <img
            src="/images/interior.webp"
            alt="Light-filled contemporary interior, illustrative photograph"
            loading="lazy"
          />
          <div className="image-note">
            A thoughtful approach.
            <br />
            <strong>From the ground up.</strong>
          </div>
        </div>
        <div>
          <p className="eyebrow">WELCOME TO K&M REAL ESTATE</p>
          <h2>
            More than a property.
            <br />
            <em>A world of possibility.</em>
          </h2>
          <p className="muted">
            {c?.overview ||
              "Your partner in real estate, construction and supply solutions in South Sudan."}
          </p>
          <div className="intro-points">
            <span>
              <Check size={17} /> Property expertise
            </span>
            <span>
              <Check size={17} /> End-to-end support
            </span>
            <span>
              <Check size={17} /> Personal attention
            </span>
            <span>
              <Check size={17} /> Local understanding
            </span>
          </div>
          <Link to="/about" className="text-link">
            Get to know K&M <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section sandstone">
        <div className="container">
          <SectionTitle
            eyebrow="ONE PARTNER. MANY POSSIBILITIES."
            title="Comprehensive solutions under one roof."
            description="From your first property conversation to the materials that bring a project to life."
            to="/services"
            link="Discover our expertise"
          />
          <div className="grid three service-grid">
            {groupNames.map((name, i) => {
              const Icon = icons[i];
              return (
                <Link
                  key={name}
                  className="service-card"
                  to={
                    i >= 2 && i <= 4
                      ? `/catalogue?category=${groupSlugs[i]}`
                      : `/services#${groupSlugs[i]}`
                  }
                >
                  <img
                    src={`/images/${groupImages[i]}.webp`}
                    alt={`Illustrative ${name.toLowerCase()} photograph`}
                    loading="lazy"
                  />
                  <div className="service-overlay" />
                  <div className="service-card-text">
                    <Icon size={27} strokeWidth={1.2} />
                    <span className="service-number">0{i + 1}</span>
                    <h3>{name}</h3>
                    <p>
                      {
                        [
                          "Informed decisions. Better property journeys.",
                          "Thoughtful spaces, from concept to construction.",
                          "The foundations for your next project.",
                          "Procurement shaped around your operations.",
                          "Connected solutions for modern spaces.",
                          "Practical care for essential systems.",
                        ][i]
                      }
                    </p>
                    <span className="text-link">
                      Explore service <ArrowUpRight size={17} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      {(!c || c.featuredSections.includes("properties")) && (
        <Featured
          kind="property"
          eyebrow="FIND YOUR NEXT CHAPTER"
          title="Properties with possibility."
          to="/properties"
        />
      )}
      <section className="why">
        <div className="container">
          <p className="eyebrow light">THE K&M APPROACH</p>
          <h2>
            Good property decisions
            <br />
            begin with a trusted partner.
          </h2>
          <div className="grid three">
            {[
              [
                "Integrity & transparency",
                "Clear advice and open communication at every step.",
              ],
              [
                "Knowledge with purpose",
                "Property guidance shaped around your goals and the local context.",
              ],
              [
                "Solutions that connect",
                "Real estate, construction, design and supply expertise working together.",
              ],
            ].map(([title, text], i) => (
              <div key={title}>
                <span className="why-icon">
                  {i === 0 ? (
                    <ShieldCheck />
                  ) : i === 1 ? (
                    <Compass />
                  ) : (
                    <Layers3 />
                  )}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {(!c || c.featuredSections.includes("projects")) && (
        <Featured
          kind="project"
          eyebrow="FROM VISION TO REALITY"
          title="Our work. Your possibilities."
          to="/projects"
        />
      )}
      <section className="mission-section sandstone">
        <div className="container mission-grid">
          <div>
            <p className="eyebrow">A CLEAR PURPOSE</p>
            <h2>
              Built on trust.
              <br />
              <em>Looking forward.</em>
            </h2>
            <Link to="/about" className="text-link">
              Our story & values <ArrowUpRight size={18} />
            </Link>
          </div>
          <div>
            <h3>Our mission</h3>
            <p>{c?.mission}</p>
            <h3>Our vision</h3>
            <p>{c?.vision}</p>
          </div>
        </div>
      </section>
      {c?.featuredSections.includes("testimonials") && <Testimonials />}
      {(!c || c.featuredSections.includes("posts")) && (
        <Featured
          kind="post"
          eyebrow="PERSPECTIVES & PRACTICAL ADVICE"
          title="Insights for your next move."
          to="/blog"
        />
      )}
      <CTA />
    </>
  );
}
function Testimonials() {
  const { data } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => api<{ items: Entry[] }>("/content/testimonial?limit=6"),
  });
  return data?.items.length ? (
    <section className="section container">
      <SectionTitle eyebrow="CLIENT EXPERIENCES" title="In their own words." />
      <div className="grid three">
        {data.items.map((v) => (
          <blockquote key={v.id}>
            <p>“{v.summary}”</p>
            <cite>{v.title}</cite>
          </blockquote>
        ))}
      </div>
    </section>
  ) : null;
}
export function CTA() {
  return (
    <section className="cta">
      <div className="container">
        <div>
          <p className="eyebrow light">YOUR NEXT CHAPTER STARTS HERE</p>
          <h2>
            Let’s build your next
            <br />
            opportunity together.
          </h2>
        </div>
        <div className="actions">
          <Link to="/quote" className="button sand">
            Request a Quote <ArrowUpRight size={18} />
          </Link>
          <Link to="/contact" className="button outline-light">
            Contact Us <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  useEffect(() => {
    document.title = `${title} | K&M Real Estate`;
  }, [title]);
  return (
    <section className="page-hero">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </section>
  );
}
export function About() {
  const c = useCompany();
  const { data } = useQuery({
    queryKey: ["team"],
    queryFn: () => api<{ items: Entry[] }>("/content/team?limit=100"),
  });
  return (
    <>
      <PageHero
        eyebrow="OUR COMPANY"
        title="Real people. Real commitment."
        description="A partner for property, construction and supply solutions in South Sudan."
      />
      <section className="section container about-intro">
        <img
          className="rounded-photo"
          src="/images/architecture.webp"
          alt="Architectural inspiration for modern living"
        />
        <div>
          <p className="eyebrow">K&M REAL ESTATE · JUBA</p>
          <h2>
            A considered approach
            <br />
            to every opportunity.
          </h2>
          <p>{c?.overview}</p>
          <p>
            We work with individuals, property owners, businesses, investors,
            contractors, NGOs and institutions. From residential brokerage and
            commercial leasing to property management, design and procurement,
            our services connect your plans with practical next steps.
          </p>
        </div>
      </section>
      <section className="section sandstone">
        <div className="container grid two">
          <div>
            <p className="eyebrow">OUR MISSION</p>
            <h2>Service with purpose.</h2>
            <p>{c?.mission}</p>
          </div>
          <div>
            <p className="eyebrow">OUR VISION</p>
            <h2>A lasting perspective.</h2>
            <p>{c?.vision}</p>
          </div>
        </div>
      </section>
      <section className="section container">
        <SectionTitle
          eyebrow="WHAT GUIDES US"
          title="Values that shape our work."
        />
        <div className="grid four">
          {c?.values.map((v, i) => (
            <div className="value" key={v.title}>
              <span>0{i + 1}</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section container">
        <SectionTitle
          eyebrow="OUR CAPABILITIES"
          title="Expertise that works together."
          to="/services"
        />
        <div className="grid three">
          {groupNames.map((v, i) => (
            <div className="value" key={v}>
              <h3>{v}</h3>
              <Link
                className="text-link"
                to={
                  i >= 2 && i <= 4
                    ? `/catalogue?category=${groupSlugs[i]}`
                    : `/services#${groupSlugs[i]}`
                }
              >
                Explore <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>
      {!!data?.items.length && (
        <section className="section container">
          <SectionTitle
            eyebrow="THE PEOPLE BEHIND K&M"
            title="Meet our team."
          />
          <div className="grid three">
            {data.items.map((v) => (
              <article className="card" key={v.id}>
                {v.images[0] && (
                  <img
                    src={v.images[0].url}
                    alt={v.images[0].alt}
                    loading="lazy"
                  />
                )}
                <div className="card-content">
                  <h3>{v.title}</h3>
                  <p>{v.specs.jobTitle}</p>
                  <p>{v.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <CTA />
    </>
  );
}
export function Services() {
  const { data: services, error } = useQuery({
    queryKey: ["services", "categories"],
    queryFn: () => api<Category[]>("/categories?kind=service"),
  });
  const { data: products } = useQuery({
    queryKey: ["products", "categories"],
    queryFn: () => api<Category[]>("/categories?kind=product"),
  });
  return (
    <>
      <PageHero
        eyebrow="OUR EXPERTISE"
        title="One partner. A complete perspective."
        description="Real estate at our core. Construction, design and supply expertise to take your plans further."
      />
      <section className="section container">
        {error || !services ? (
          <LoadingError error={error} />
        ) : (
          groupNames.map((name, i) => {
            const category = [...services, ...(products || [])].find(
              (c) => c.slug === groupSlugs[i],
            );
            return (
              <section className="service-detail" id={groupSlugs[i]} key={name}>
                <div>
                  <img
                    src={`/images/${groupImages[i]}.webp`}
                    alt={`Illustrative ${name.toLowerCase()} photograph`}
                    loading="lazy"
                  />
                  <p className="caption">Illustrative service photography</p>
                </div>
                <div>
                  <p className="eyebrow">0{i + 1} / OUR EXPERTISE</p>
                  <h2>{category?.name || name}</h2>
                  <p>{category?.description}</p>
                  {category && <ServiceItems category={category} />}
                  <Link
                    className="button"
                    to={`/quote?service=${encodeURIComponent(name)}`}
                  >
                    Discuss your requirements <ArrowUpRight size={16} />
                  </Link>
                </div>
              </section>
            );
          })
        )}
        {[...(services || []), ...(products || [])]
          .filter((c) => !groupSlugs.includes(c.slug))
          .map((category) => (
            <section
              className="service-detail"
              id={category.slug}
              key={category.id}
            >
              <div>
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                  />
                )}
              </div>
              <div>
                <p className="eyebrow">OUR EXPERTISE</p>
                <h2>{category.name}</h2>
                <p>{category.description}</p>
                <ServiceItems category={category} />
                <Link
                  className="button"
                  to={`/quote?service=${encodeURIComponent(category.name)}`}
                >
                  Request a quotation <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>
          ))}
      </section>
      <CTA />
    </>
  );
}
function ServiceItems({ category }: { category: Category }) {
  const { data, error } = useQuery({
    queryKey: ["services", category.id],
    queryFn: () =>
      api<{ items: Entry[] }>(
        `/content/${category.kind}?category=${category.slug}&limit=100`,
      ),
  });
  return error ? (
    <LoadingError error={error} />
  ) : (
    <ul className="service-list">
      {data?.items.map((v) => (
        <li key={v.id}>
          <Link to={`/${destinations[v.kind]}/${v.slug}`}>
            {v.title}
            <ArrowUpRight size={13} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
export function Collection({ kind }: { kind: string }) {
  const [params, setParams] = useSearchParams();
  const key = params.toString();
  const { data, error } = useQuery({
    queryKey: ["collection", kind, key],
    queryFn: () =>
      api<{ items: Entry[]; total: number }>(`/content/${kind}?${key}`),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories", kind],
    queryFn: () => api<Category[]>(`/categories?kind=${kind}`),
  });
  const page = Number(params.get("page") || 1);
  const { data: supplyGroups } = useQuery({
    queryKey: ["catalogue-groups"],
    queryFn: () => api<string[]>("/catalogue-groups"),
    enabled: kind === "product",
  });
  return (
    <>
      <PageHero
        eyebrow={
          kind === "property" ? "A SPACE FOR YOUR NEXT CHAPTER" : "EXPLORE K&M"
        }
        title={labels[kind]}
        description={
          kind === "property"
            ? "Find a place to live, work or invest. Explore published listings, or speak with us about your search."
            : kind === "product"
              ? "Materials, equipment and everyday essentials. Share your specifications for a tailored quotation."
              : kind === "project"
                ? "A closer look at our published company projects."
                : "Thoughtful perspectives on property, construction and the decisions that matter."
        }
      />
      <section className="section container">
        {kind === "property" ? (
          <SearchForm expanded />
        ) : (
          <form
            className="collection-filter"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const p = new URLSearchParams();
              for (const [k, v] of form) if (v) p.set(k, String(v));
              setParams(p);
            }}
          >
            <label>
              Search
              <input
                name="q"
                defaultValue={params.get("q") || ""}
                placeholder={`Search ${labels[kind].toLowerCase()}`}
              />
            </label>
            <label>
              Category
              <select
                name="category"
                defaultValue={params.get("category") || ""}
              >
                <option value="">All categories</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {kind === "product" && (
              <label>
                Supply group
                <select
                  name="subgroup"
                  defaultValue={params.get("subgroup") || ""}
                >
                  <option value="">All supply groups</option>
                  {supplyGroups?.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>
            )}
            <button className="button">
              <Search size={17} /> Search
            </button>
          </form>
        )}
        <div className="results-line">
          <span>
            {data
              ? `${data.total} published ${kind === "property" ? "properties" : kind === "post" ? "articles" : "records"}`
              : "Searching…"}
          </span>
          <Link to={`/${destinations[kind]}`}>Clear filters</Link>
        </div>
        {error || !data ? (
          <LoadingError error={error} />
        ) : data.items.length ? (
          <div className="grid three">
            {data.items.map((v) => (
              <Card key={v.id} item={v} />
            ))}
          </div>
        ) : (
          <Empty kind={kind} />
        )}
        <div className="pagination">
          {page > 1 && (
            <button
              onClick={() => {
                params.set("page", String(page - 1));
                setParams(params);
              }}
            >
              Previous
            </button>
          )}
          {data && data.total > page * 24 && (
            <button
              onClick={() => {
                params.set("page", String(page + 1));
                setParams(params);
              }}
            >
              Next page <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>
      <CTA />
    </>
  );
}
export function Detail() {
  const { slug } = useParams();
  const location = useLocation();
  const kind =
    Object.keys(destinations).find(
      (k) => destinations[k] === location.pathname.split("/")[1],
    ) || "service";
  const { data: item, error } = useQuery({
    queryKey: ["detail", kind, slug],
    queryFn: () => api<Entry>(`/content/${kind}/${slug}`),
  });
  const [active, setActive] = useState(0);
  useEffect(() => {
    setActive(0);
  }, [slug]);
  const c = useCompany();
  if (error || !item)
    return (
      <section className="section container">
        <LoadingError error={error} />
      </section>
    );
  return (
    <>
      <PageHero
        eyebrow={item.category?.name || labels[kind]}
        title={item.title}
        description={item.summary}
      />
      <section className="section container detail-grid">
        <div>
          {item.images.length > 0 && (
            <div className="gallery">
              <img
                className="gallery-main"
                src={item.images[active]?.url}
                alt={item.images[active]?.alt}
              />
              <div className="thumbnails">
                {item.images.map((v, i) => (
                  <button
                    key={v.url + i}
                    onClick={() => setActive(i)}
                    aria-label={`Show image ${i + 1}: ${v.alt}`}
                    aria-pressed={active === i}
                  >
                    <img src={v.url} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {kind === "property" && (
            <div className="property-facts">
              <h2>
                {item.price === null
                  ? "Price on request"
                  : `${item.currency} ${Number(item.price).toLocaleString()}`}
              </h2>
              <p>
                <MapPin size={17} />
                {item.location}
              </p>
              <div className="specs">
                {item.bedrooms !== null && (
                  <span>
                    <BedDouble /> {item.bedrooms} bedrooms
                  </span>
                )}
                {item.bathrooms !== null && (
                  <span>
                    <Bath /> {item.bathrooms} bathrooms
                  </span>
                )}
                {item.area !== null && (
                  <span>
                    <Square /> {item.area} m²
                  </span>
                )}
              </div>
              <p>
                Availability:{" "}
                {item.specs.availability || "Confirm with our team"}
              </p>
              {item.specs.rentalPeriod && (
                <p>Rental period: {item.specs.rentalPeriod}</p>
              )}
              <h3>Amenities</h3>
              <div className="amenities">
                {item.amenities.map((a) => (
                  <span key={a}>
                    <Check size={14} />
                    {a}
                  </span>
                ))}
              </div>
              <a
                className="text-link"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                target="_blank"
                rel="noreferrer"
              >
                Explore the location <ArrowUpRight size={16} />
              </a>
              <p className="caption">
                Area search. Exact location is confirmed with our team.
              </p>
            </div>
          )}
          {kind === "project" && (
            <div className="property-facts">
              <p>
                Project status:{" "}
                {item.specs.projectStatus || "Contact us for details"}
              </p>
              {item.location && <p>Location: {item.location}</p>}
              {item.specs.completionDate && (
                <p>Completion: {item.specs.completionDate}</p>
              )}
              {item.specs.servicesProvided && (
                <p>Services: {item.specs.servicesProvided}</p>
              )}
            </div>
          )}
          {kind === "post" && item.publishedAt && (
            <p className="location">
              <CalendarDays size={15} />
              {new Date(item.publishedAt).toLocaleDateString("en-GB")}
            </p>
          )}
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: item.body }}
          />
        </div>
        <aside className="detail-aside">
          <p className="eyebrow">LET’S TAKE THE NEXT STEP</p>
          <h2>
            {kind === "property"
              ? "Make this your next move."
              : "Tell us what you have in mind."}
          </h2>
          <p>
            Speak to K&M Real Estate for information, a consultation or a
            tailored quotation.
          </p>
          <a className="text-link" href={`tel:${c?.phone || "+211924265999"}`}>
            <Phone size={16} />
            {c?.phone || "+211 924 265 999"}
          </a>
          <RequestForm
            entry={item}
            defaultKind={
              kind === "property"
                ? "VIEWING"
                : kind === "product"
                  ? "QUOTATION"
                  : "CONSULTATION"
            }
          />
          {c?.whatsappVerified && c.whatsappNumber && (
            <a
              className="button secondary"
              href={`https://wa.me/${c.whatsappNumber}?text=${encodeURIComponent("Hello, I am interested in " + item.title)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp inquiry <ArrowUpRight size={16} />
            </a>
          )}
        </aside>
      </section>
      <Related item={item} />
    </>
  );
}
function Related({ item }: { item: Entry }) {
  const { data } = useQuery({
    queryKey: ["related", item.id],
    queryFn: () =>
      api<{ items: Entry[] }>(
        `/content/${item.kind}?limit=4${item.category ? `&category=${item.category.slug}` : ""}`,
      ),
  });
  const items = data?.items.filter((v) => v.id !== item.id).slice(0, 3);
  return items?.length ? (
    <section className="section container">
      <SectionTitle
        eyebrow="KEEP EXPLORING"
        title="You may also be interested in"
      />
      <div className="grid three">
        {items.map((v) => (
          <Card key={v.id} item={v} />
        ))}
      </div>
    </section>
  ) : null;
}
const LazyRequestForm = lazy(() => import("./RequestForm"));
export function RequestForm(props: {
  entry?: Entry;
  defaultKind?: CustomerRequest["kind"];
}) {
  return (
    <Suspense fallback={<p role="status">Loading secure request form…</p>}>
      <LazyRequestForm {...props} />
    </Suspense>
  );
}
export function Contact({ quote = false }: { quote?: boolean }) {
  const c = useCompany();
  return (
    <>
      <PageHero
        eyebrow={
          quote ? "LET’S BUILD SOMETHING TOGETHER" : "WE’RE HERE TO HELP"
        }
        title={
          quote
            ? "Your plans. Our next conversation."
            : "Let’s talk about what’s next."
        }
        description={
          quote
            ? "Tell us what you need. We’ll review the details and follow up with the right next steps."
            : "Property, construction, design or supplies — your next chapter starts with a conversation."
        }
      />
      <section className="section container contact-grid">
        <div>
          <p className="eyebrow">FIND US IN JUBA</p>
          <h2>
            A local team.
            <br />
            An open conversation.
          </h2>
          <div className="contact-item">
            <Phone />
            <div>
              <h3>Call us</h3>
              <a href={`tel:${c?.phone || "+211924265999"}`}>
                {c?.phone || "+211 924 265 999"}
              </a>
            </div>
          </div>
          <div className="contact-item">
            <Mail />
            <div>
              <h3>Write to us</h3>
              <a href={`mailto:${c?.email || "kmrealestate38@gmail.com"}`}>
                {c?.email || "kmrealestate38@gmail.com"}
              </a>
            </div>
          </div>
          <div className="contact-item">
            <MapPin />
            <div>
              <h3>Visit our office</h3>
              <p>
                {c?.address ||
                  "Juba Town, opposite Gabat Primary School, Juba, South Sudan"}
              </p>
              <a
                className="text-link"
                href="https://www.google.com/maps/search/?api=1&query=Gabat+Primary+School+Juba+South+Sudan"
                target="_blank"
                rel="noreferrer"
              >
                Explore the area <ArrowUpRight size={15} />
              </a>
              <p className="caption">
                Please call for precise office directions.
              </p>
            </div>
          </div>
          {c?.whatsappVerified && c.whatsappNumber && (
            <a
              className="button"
              href={`https://wa.me/${c.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              Contact on WhatsApp
            </a>
          )}
        </div>
        <div className="form-panel">
          <h2>{quote ? "Request a quotation" : "Send us a message"}</h2>
          <p className="muted">Fields marked * are required.</p>
          <RequestForm defaultKind={quote ? "QUOTATION" : "CONTACT"} />
        </div>
      </section>
    </>
  );
}
export function Legal({ terms = false }: { terms?: boolean }) {
  const c = useCompany();
  return (
    <>
      <PageHero
        eyebrow="K&M REAL ESTATE"
        title={terms ? "Terms of Service" : "Privacy Policy"}
      />
      <article className="section container prose narrow">
        {terms ? (
          <>
            <h2>Using this website</h2>
            <p>
              This website introduces K&M Real Estate’s services and published
              properties, projects and supply catalogue. Information is provided
              to help you make an inquiry. Confirm current availability,
              specifications and terms directly with our team.
            </p>
            <h2>Listings and quotations</h2>
            <p>
              A listing or quotation request does not create a sale, tenancy,
              supply or construction contract. Prices, availability, ownership
              documentation, scope, delivery schedules and payment terms must be
              verified and agreed in writing. USD and SSP prices are displayed
              as listed, without implied exchange rates.
            </p>
            <h2>Professional advice</h2>
            <p>
              Website content is general information. Obtain appropriate
              independent legal, financial and technical advice for your
              particular transaction. No investment return or legal outcome is
              guaranteed.
            </p>
            <h2>Responsible use</h2>
            <p>
              Do not misuse the website, submit false information, attempt
              unauthorized access or infringe intellectual property rights.
              Company branding and original content remain protected.
            </p>
          </>
        ) : (
          <>
            <h2>Information we collect</h2>
            <p>
              When you submit an inquiry, viewing request, consultation or
              quotation request, we collect your name, email, telephone,
              requirements and any location or scheduling details you choose to
              provide.
            </p>
            <h2>How we use information</h2>
            <p>
              We use these details to respond to your request, prepare
              quotations and manage follow-ups. Authorized staff can access
              requests in the protected dashboard. Configured service providers
              may process website hosting, email and media storage on our
              behalf.
            </p>
            <h2>Cookies and analytics</h2>
            <p>
              The staff dashboard uses an essential secure session cookie for
              authentication. Public visitors do not need an account. No
              optional analytics are activated by default.
            </p>
            <h2>Your choices</h2>
            <p>
              Contact us to request access, correction or deletion of your
              inquiry details, subject to any applicable recordkeeping
              obligations. Avoid submitting sensitive ownership documents
              through public forms.
            </p>
            <h2>Retention and protection</h2>
            <p>
              We retain requests for as long as needed to handle the inquiry and
              meet applicable obligations. Access is restricted to authorized
              staff. Contact us for information about records associated with
              your request.
            </p>
          </>
        )}
        <h2>Contact</h2>
        <p>
          {c?.name || "K&M Real Estate"}
          <br />
          {c?.address}
        </p>
        <a href={`mailto:${c?.email || "kmrealestate38@gmail.com"}`}>
          {c?.email || "kmrealestate38@gmail.com"}
        </a>
      </article>
    </>
  );
}
export function NotFound() {
  return (
    <section className="section container empty">
      <p className="eyebrow">404</p>
      <h1>This page couldn’t be found.</h1>
      <Link className="button" to="/">
        Return home <ArrowRight size={17} />
      </Link>
    </section>
  );
}
