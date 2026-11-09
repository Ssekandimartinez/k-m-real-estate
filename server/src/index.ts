import { paths, descriptions } from "./seo-content.js";
import express from "express";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { app, errorHandler } from "./app.js";
import { config, serverRoot } from "./config.js";
import { db } from "./db.js";
import { renderHome, renderDetail } from "./render.js";
const root = path.resolve(serverRoot, "../client/dist");
const escape = (s: unknown) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
app.get("/robots.txt", (_req, res) =>
  res
    .type("text")
    .send(
      `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${config.siteUrl}/sitemap.xml\n`,
    ),
);
app.get("/sitemap.xml", async (_req, res) => {
  const items = await db.entry.findMany({
    where: {
      status: "PUBLISHED",
      kind: { in: ["property", "service", "product", "project", "post"] },
    },
    select: { kind: true, slug: true, updatedAt: true, specs: true },
  });
  const base: Record<string, string> = {
    property: "properties",
    service: "services",
    product: "catalogue",
    project: "projects",
    post: "blog",
  };
  res.type("xml").send(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
      paths,
    )
      .map((p) => `<url><loc>${escape(config.siteUrl + p)}</loc></url>`)
      .join("")}${items
      .filter((v) => !(v.specs as Record<string, unknown>)?.demo)
      .map(
        (v) =>
          `<url><loc>${escape(config.siteUrl + "/" + base[v.kind] + "/" + encodeURIComponent(v.slug))}</loc><lastmod>${v.updatedAt.toISOString()}</lastmod></url>`,
      )
      .join("")}</urlset>`,
  );
});
app.use(
  "/assets",
  express.static(path.join(root, "assets"), { maxAge: "1y", immutable: true }),
);
// Only bundles are served here. Public media stays on Netlify; never expose the
// unrendered index.html or build-only content snapshot through Express.
// Server renders crawlable public content and metadata on every route; React
// mounts the interactive interface. No browser-only SEO metadata dependency.
app.get("/{*path}", async (req, res) => {
  const pathname = req.path.replace(/\/+$/, "") || "/";
  let template: string;
  try {
    template = await readFile(path.join(root, "index.html"), "utf8");
  } catch {
    res
      .status(503)
      .send(
        "Build the client with npm run build, or use the Vite development server.",
      );
    return;
  }
  const company = (await db.setting.findUnique({ where: { key: "company" } }))
    ?.value as Record<string, any> | null;
  const visualLibrary = (
    await db.setting.findUnique({ where: { key: "visual-media" } })
  )?.value as { assets: { placement: string; url: string }[] } | null;
  const homeImage =
    visualLibrary?.assets.find((asset) => asset.placement === "home-hero-0")
      ?.url ||
    company?.heroImage ||
    "/images/architecture.webp";
  const route = paths[pathname],
    parts = pathname.split("/").filter(Boolean),
    base: Record<string, string> = {
      properties: "property",
      services: "service",
      catalogue: "product",
      projects: "project",
      blog: "post",
    };
  let title =
      route?.title ||
      (pathname.startsWith("/admin") ? "Staff access" : "Page not found"),
    description =
      descriptions[pathname] ||
      company?.seoDescription ||
      "K&M Real Estate, Juba, South Sudan.",
    image = company?.heroImage || "/images/architecture.webp",
    content = "",
    found = Boolean(route) || pathname.startsWith("/admin");
  let initialEntry: any = null;
  if (parts.length === 2 && base[parts[0]]) {
    const entry = await db.entry.findFirst({
      where: { kind: base[parts[0]], slug: parts[1], status: "PUBLISHED" },
      include: { images: { orderBy: { position: "asc" } }, category: true },
    });
    if (entry) {
      initialEntry = entry;
      found = true;
      title = entry.seoTitle || entry.title;
      description = entry.seoDescription || entry.summary;
      image = entry.images[0]?.url || image;
      content = `<article><h1>${escape(entry.title)}</h1><p>${escape(entry.summary)}</p>${entry.body}</article>`;
    }
  }
  if (route) {
    content = `<h1>${escape(title)}</h1><p>${escape(pathname === "/" ? company?.heroDescription : description)}</p>`;
    if (pathname === "/about")
      content += `<p>${escape(company?.overview)}</p><h2>Mission</h2><p>${escape(company?.mission)}</p><h2>Vision</h2><p>${escape(company?.vision)}</p>`;
    if (route.kind) {
      const entries = await db.entry.findMany({
        where: { kind: route.kind, status: "PUBLISHED" },
        take: 100,
        orderBy: { publishedAt: "desc" },
      });
      content += entries.length
        ? entries
            .map(
              (v) =>
                `<article><h2><a href="${pathname}/${escape(v.slug)}">${escape(v.title)}</a></h2>${(v.specs as Record<string, unknown>)?.demo ? "<p>Illustrative content; contact our team for genuine availability and project information.</p>" : ""}<p>${escape(v.summary)}</p></article>`,
            )
            .join("")
        : "<p>No published records yet. Contact our team to discuss your requirements.</p>";
    }
  }
  const noindex =
    !found ||
    pathname.startsWith("/admin") ||
    Boolean(initialEntry?.specs?.demo);
  const url = config.siteUrl + pathname;
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "K&M Real Estate",
    "@id": `${config.siteUrl}/#company`,
    url: config.siteUrl,
    logo: new URL(company?.logo || "/branding/logo.webp", config.siteUrl).href,
    telephone: company?.phone,
    email: company?.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: company?.address,
      addressLocality: "Juba",
      addressCountry: "SS",
    },
  };
  const preload =
    pathname === "/"
      ? `<link rel="preload" as="image" href="${escape(homeImage)}" fetchpriority="high"/>`
      : "";
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${config.siteUrl}/#website`,
    name: "K&M Real Estate",
    url: config.siteUrl,
    publisher: { "@id": `${config.siteUrl}/#company` },
  };
  const breadcrumbs =
    pathname !== "/" && found && !noindex
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: config.siteUrl + "/",
            },
            ...(initialEntry
              ? [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: paths["/" + parts[0]].title,
                    item: config.siteUrl + "/" + parts[0],
                  },
                ]
              : []),
            {
              "@type": "ListItem",
              position: initialEntry ? 3 : 2,
              name: title,
              item: url,
            },
          ],
        }
      : null;
  const meta = `${preload}<link rel="canonical" href="${escape(url)}"/><meta property="og:site_name" content="K&amp;M Real Estate"/><meta property="og:title" content="${escape(title)} | K&amp;M Real Estate"/><meta property="og:description" content="${escape(description)}"/><meta property="og:type" content="website"/><meta property="og:url" content="${escape(url)}"/><meta property="og:image" content="${escape(new URL(image, config.siteUrl).href)}"/><meta name="twitter:card" content="summary_large_image"/>${noindex ? '<meta name="robots" content="noindex,nofollow"/>' : ""}<script type="application/ld+json">${JSON.stringify([schema, website, ...(breadcrumbs ? [breadcrumbs] : [])]).replaceAll("<", "\\u003c")}</script>`;
  const initialMarkup =
    pathname === "/"
      ? renderHome({ ...company, heroImage: homeImage })
      : initialEntry
        ? renderDetail(company, initialEntry)
        : `<header><a href="/">K&amp;M Real Estate</a></header><main>${content}</main>`;
  const bootstrap = `<script id="km-visual-media" type="application/json">${JSON.stringify(visualLibrary || { assets: [] }).replaceAll("<", "\\u003c")}</script><script id="km-company" type="application/json">${JSON.stringify(company ?? null).replaceAll("<", "\\u003c")}</script>${initialEntry ? `<script id="km-detail" type="application/json">${JSON.stringify(initialEntry).replaceAll("<", "\\u003c")}</script>` : ""}`;
  template = template
    .replace(
      /<title>.*?<\/title>/,
      `<title>${escape(title)} | K&amp;M Real Estate</title>`,
    )
    .replace(
      /<meta name="description"[^>]*\/>/,
      `<meta name="description" content="${escape(description)}"/>`,
    )
    .replace("</head>", meta + "</head>")
    .replace(
      '<div id="root"></div>',
      `<div id="root">${initialMarkup}</div>${bootstrap}`,
    );
  res.setHeader("Cache-Control", "no-store");
  if (noindex) res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res
    .status(found ? 200 : 404)
    .type("html")
    .send(template);
});
app.use(errorHandler);
const server = app.listen(config.port, () =>
  console.log(
    `K&M API and production website: http://localhost:${config.port}`,
  ),
);
async function shutdown() {
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
