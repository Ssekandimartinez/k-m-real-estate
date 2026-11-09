import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { paths, descriptions } from "../../server/src/seo-content";
import { api, destinations, type Company, type Entry } from "./api";

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
  const { data: entry, error } = useQuery({
    queryKey: ["detail", kind, parts[1]],
    queryFn: () => api<Entry>(`/content/${kind}/${parts[1]}`),
    enabled: detail,
  });
  useEffect(() => {
    const route = paths[path];
    const title =
      (detail ? entry?.seoTitle || entry?.title : route?.title) ||
      (path.startsWith("/admin") ? "Staff access" : "Page not found");
    const description =
      (detail ? entry?.seoDescription || entry?.summary : descriptions[path]) ||
      company?.seoDescription ||
      "K&M Real Estate, Juba, South Sudan.";
    const noindex =
      path.startsWith("/admin") ||
      (!route && !detail) ||
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
    // Server-generated breadcrumbs describe the initial URL only.
    document.head
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((element) => {
        try {
          const data = JSON.parse(element.textContent || "null");
          if (Array.isArray(data))
            element.textContent = JSON.stringify(
              data.filter((item) => item["@type"] !== "BreadcrumbList"),
            );
        } catch {
          /* Leave unrelated structured data intact. */
        }
      });
  }, [path, detail, entry, error, company]);
  return null;
}
