import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { paths, descriptions } from "../../server/src/seo-content";
import {
  api,
  destinations,
  type Company,
  type Entry,
  type Category,
} from "./api";

const origin = "https://kmrealestatecompany.com";
function meta(attribute: "name" | "property", name: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${name}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.append(element);
  }
  element.content = value;
}

// Complements the server-rendered head when React Router changes pages.
export default function Seo({ company }: { company: Company | null }) {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  const kind = Object.keys(destinations).find(
    (key) => destinations[key] === parts[0],
  );
  const detail = parts.length === 2 && Boolean(kind);
  const categoryPage =
    parts.length === 3 && parts[0] === "services" && parts[1] === "category";
  const { data: services } = useQuery({
    queryKey: ["services", "categories"],
    queryFn: () => api<Category[]>("/categories?kind=service"),
    enabled: categoryPage,
  });
  const { data: products } = useQuery({
    queryKey: ["products", "categories"],
    queryFn: () => api<Category[]>("/categories?kind=product"),
    enabled: categoryPage,
  });
  const category = categoryPage
    ? [...(services || []), ...(products || [])].find(
        (item) => item.slug === parts[2],
      )
    : undefined;
  const { data: entry, error } = useQuery({
    queryKey: ["detail", kind, parts[1]],
    queryFn: () => api<Entry>(`/content/${kind}/${parts[1]}`),
    enabled: detail,
  });
  useEffect(() => {
    const route = paths[path];
    const title =
      (detail
        ? entry?.seoTitle || entry?.title
        : categoryPage
          ? category?.name
          : route?.title) ||
      (path.startsWith("/admin") ? "Staff access" : "Page not found");
    const description =
      (detail
        ? entry?.seoDescription || entry?.summary
        : categoryPage
          ? category?.description
          : descriptions[path]) ||
      company?.seoDescription ||
      "K&M Real Estate, Juba, South Sudan.";
    const noindex =
      path.startsWith("/admin") ||
      (!route && !detail && !categoryPage) ||
      (categoryPage && !category) ||
      (detail && (Boolean(error) || !entry || Boolean(entry.specs?.demo)));
    const url = origin + path;
    document.title = `${title} | K&M Real Estate`;
    meta("name", "description", description);
    meta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
    for (const [name, value] of Object.entries({
      "og:title": document.title,
      "og:description": description,
      "og:url": url,
      "og:type": "website",
      "og:site_name": "K&M Real Estate",
      "og:image": new URL(
        entry?.images[0]?.url ||
          category?.image ||
          company?.heroImage ||
          "/images/architecture.webp",
        origin,
      ).href,
    }))
      meta("property", name, value);
    meta("name", "twitter:card", "summary_large_image");
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = url;
    // Keep breadcrumbs accurate after navigation as well as in the initial HTML.
    document.head
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((element) => {
        try {
          const data = JSON.parse(element.textContent || "null");
          if (Array.isArray(data)) {
            const updated = data.filter(
              (item) => item["@type"] !== "BreadcrumbList",
            );
            if (!noindex && path !== "/")
              updated.push({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: origin + "/",
                  },
                  ...(detail || categoryPage
                    ? [
                        {
                          "@type": "ListItem",
                          position: 2,
                          name: paths["/" + parts[0]]?.title || "Services",
                          item: origin + "/" + parts[0],
                        },
                      ]
                    : []),
                  {
                    "@type": "ListItem",
                    position: detail || categoryPage ? 3 : 2,
                    name: title,
                    item: url,
                  },
                ],
              });
            element.textContent = JSON.stringify(updated);
          }
        } catch {
          /* Leave unrelated structured data intact. */
        }
      });
  }, [path, detail, entry, error, company, categoryPage, category]);
  return null;
}
