import type { Category, Company, Entry } from "./api";
import type { VisualAsset } from "./visualMedia";

export const standalone = import.meta.env.VITE_STANDALONE === "true";
export interface StaticContent {
  company: Company;
  categories: Category[];
  entries: Entry[];
  visualMedia: { assets: VisualAsset[] };
}
let content: Promise<StaticContent> | undefined;
export function loadStaticContent() {
  return (content ||= fetch("/content/site.json")
    .then(async (response) => {
      if (!response.ok)
        throw new Error(
          "Website content could not be loaded. Please refresh or call +211 924 265 999.",
        );
      return response.json() as Promise<StaticContent>;
    })
    .catch((error) => {
      content = undefined;
      throw error;
    }));
}
export function readStaticContent(data: StaticContent, path: string): unknown {
  const url = new URL(path, "https://static.invalid");
  const query = url.searchParams;
  if (url.pathname === "/settings") return data.company;
  if (url.pathname === "/visual-media") return data.visualMedia;
  if (url.pathname === "/categories")
    return data.categories
      .filter((item) => item.kind === query.get("kind"))
      .sort((a, b) => a.name.localeCompare(b.name));
  if (url.pathname === "/catalogue-groups")
    return [
      ...new Set(
        data.entries
          .filter((item) => item.kind === "product")
          .map((item) => item.specs.supplyCategory)
          .filter(Boolean),
      ),
    ].sort();
  const [, section, kind, slug] = url.pathname.split("/");
  if (section !== "content")
    throw new Error("This feature requires the staff service.");
  let items = data.entries.filter(
    (item) =>
      item.kind === kind &&
      item.status === "PUBLISHED" &&
      (kind !== "testimonial" || item.verified),
  );
  if (slug) {
    const item = items.find((entry) => entry.slug === decodeURIComponent(slug));
    if (!item) throw new Error("Content not found");
    return item;
  }
  const includes = (value: string, term: string) =>
    value.toLowerCase().includes(term.toLowerCase());
  items = items.filter(
    (item) =>
      (query.get("featured") !== "true" || item.featured) &&
      (!query.get("category") ||
        item.category?.slug === query.get("category")) &&
      (!query.get("subgroup") ||
        item.specs.supplyCategory === query.get("subgroup")) &&
      (!query.get("transaction") ||
        item.transaction === query.get("transaction")) &&
      (!query.get("currency") || item.currency === query.get("currency")) &&
      (!query.get("location") ||
        includes(item.location, query.get("location")!)) &&
      (!query.get("q") ||
        includes(`${item.title} ${item.summary}`, query.get("q")!)) &&
      (!query.has("min") ||
        (item.price !== null &&
          Number(item.price) >= Number(query.get("min")))) &&
      (!query.has("max") ||
        (item.price !== null &&
          Number(item.price) <= Number(query.get("max")))) &&
      (!query.has("bedrooms") ||
        (item.bedrooms !== null &&
          item.bedrooms >= Number(query.get("bedrooms")))) &&
      (!query.has("bathrooms") ||
        (item.bathrooms !== null &&
          item.bathrooms >= Number(query.get("bathrooms")))) &&
      (!query.get("amenity") || item.amenities.includes(query.get("amenity")!)),
  );
  const sort = query.get("sort");
  items.sort((a, b) =>
    sort?.startsWith("price-")
      ? a.price === null
        ? b.price === null
          ? 0
          : 1
        : b.price === null
          ? -1
          : (Number(a.price) - Number(b.price)) *
            (sort === "price-desc" ? -1 : 1)
      : (b.publishedAt || "").localeCompare(a.publishedAt || ""),
  );
  const limit = Math.min(100, Math.max(1, Number(query.get("limit")) || 24));
  const page = Math.max(1, Number(query.get("page")) || 1);
  return {
    items: items.slice((page - 1) * limit, page * limit),
    total: items.length,
  };
}
