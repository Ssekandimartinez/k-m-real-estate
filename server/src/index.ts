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
const paths: Record<string, { title: string; kind?: string }> = {
  "/": { title: "Real Estate. Real Results." },
  "/about": { title: "About K&M" },
  "/gallery": { title: "Photos & Videos" },
  "/properties": { title: "Properties in Juba", kind: "property" },
  "/services": { title: "Our Services", kind: "service" },
  "/catalogue": { title: "Materials & Supply Catalogue", kind: "product" },
  "/projects": { title: "Projects & Portfolio", kind: "project" },
  "/blog": { title: "Blog & Insights", kind: "post" },
  "/contact": { title: "Contact Us" },
  "/quote": { title: "Request a Quote" },
  "/privacy": { title: "Privacy Policy" },
  "/terms": { title: "Terms of Service" },
};
app.get("/robots.txt", (_req, res) =>
  res
    .type("text")
    .send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: ${config.siteUrl}/sitemap.xml\n`,
    ),
);
app.get("/sitemap.xml", async (_req, res) => {
  const items = await db.entry.findMany({
    where: {
      status: "PUBLISHED",
      kind: { in: ["property", "service", "product", "project", "post"] },
    },
    select: { kind: true, slug: true, updatedAt: true },
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
      .join(
        "",
      )}${items.map((v) => `<url><loc>${escape(config.siteUrl + "/" + base[v.kind] + "/" + v.slug)}</loc><lastmod>${v.updatedAt.toISOString()}</lastmod></url>`).join("")}</urlset>`,
  );
});
app.use(
  "/assets",
  express.static(path.join(root, "assets"), { maxAge: "1y", immutable: true }),
);
app.use(express.static(root, { index: false, maxAge: "7d" }));
// Server renders crawlable public content and metadata on every route; React
// mounts the interactive interface. No browser-only SEO metadata dependency.
app.get("/{*path}", async (req, res) => {
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
  const route = paths[req.path],
    parts = req.path.split("/").filter(Boolean),
    base: Record<string, string> = {
      properties: "property",
      services: "service",
      catalogue: "product",
      projects: "project",
      blog: "post",
    };
  let title = route?.title || "Page not found",
    description =
      company?.seoDescription || "K&M Real Estate, Juba, South Sudan.",
    image = company?.heroImage || "/images/architecture.webp",
    content = "",
    found = Boolean(route) || req.path.startsWith("/admin");
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
    content = `<h1>${escape(title)}</h1><p>${escape(req.path === "/" ? company?.heroDescription : description)}</p>`;
    if (req.path === "/about")
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
                `<article><h2><a href="${req.path}/${escape(v.slug)}">${escape(v.title)}</a></h2><p>${escape(v.summary)}</p></article>`,
            )
            .join("")
        : "<p>No published records yet. Contact our team to discuss your requirements.</p>";
    }
  }
  const url = config.siteUrl + req.path;
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "K&M Real Estate",
    url: config.siteUrl,
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
    req.path === "/"
      ? `<link rel="preload" as="image" href="${escape(homeImage)}" fetchpriority="high"/>`
      : "";
  const meta = `${preload}<link rel="canonical" href="${escape(url)}"/><meta property="og:title" content="${escape(title)} | K&amp;M Real Estate"/><meta property="og:description" content="${escape(description)}"/><meta property="og:type" content="website"/><meta property="og:url" content="${escape(url)}"/><meta property="og:image" content="${escape(new URL(image, config.siteUrl).href)}"/><meta name="twitter:card" content="summary_large_image"/>${req.path.startsWith("/admin") ? '<meta name="robots" content="noindex,nofollow"/>' : ""}<script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>`;
  const initialMarkup =
    req.path === "/"
      ? renderHome({ ...company, heroImage: homeImage })
      : initialEntry
        ? renderDetail(company, initialEntry)
        : `<header><a href="/">K&amp;M Real Estate</a></header><main>${content}</main>`;
  const bootstrap = `<script id="km-visual-media" type="application/json">${JSON.stringify(visualLibrary || { assets: [] }).replaceAll("<", "\\u003c")}</script><script id="km-company" type="application/json">${JSON.stringify(company).replaceAll("<", "\\u003c")}</script>${initialEntry ? `<script id="km-detail" type="application/json">${JSON.stringify(initialEntry).replaceAll("<", "\\u003c")}</script>` : ""}`;
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
