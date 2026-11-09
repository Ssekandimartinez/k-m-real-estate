import { describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("./app.js", async () => {
  const { default: express } = await import("express");
  const app = express();
  vi.spyOn(app, "listen").mockReturnValue({ close() {} } as never);
  return {
    app,
    errorHandler: (_err: unknown, _req: unknown, res: any, _next: unknown) =>
      res.status(500).end(),
  };
});
vi.mock("./config.js", () => ({
  serverRoot: process.cwd() + "/server",
  config: { siteUrl: "https://kmrealestatecompany.com", port: 4000 },
}));
vi.mock("node:fs/promises", async (original) => ({
  ...(await original<typeof import("node:fs/promises")>()),
  readFile: vi
    .fn()
    .mockResolvedValue(
      '<html><head><title>Default</title><meta name="description" content="Default"/></head><body><div id="root"></div></body></html>',
    ),
}));
vi.mock("./db.js", () => ({
  db: {
    category: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    setting: { findUnique: vi.fn().mockResolvedValue(null) },
    entry: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));
await import("./index.js");
const { app } = await import("./app.js");
const { db } = await import("./db.js");

describe("crawler responses", () => {
  it("returns homepage content and canonical metadata without browser JavaScript", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Real Estate in Juba, South Sudan");
    expect(res.text).toContain(
      '<link rel="canonical" href="https://kmrealestatecompany.com/"',
    );
    expect(res.text).toContain("<h1>");
    expect(res.text).toContain('"@type":"RealEstateAgent"');
    expect(res.headers["cache-control"]).toBe("no-store");
  });
  it("serves discovery documents with the custom domain", async () => {
    const robots = await request(app).get("/robots.txt");
    expect(robots.text).toContain(
      "Sitemap: https://kmrealestatecompany.com/sitemap.xml",
    );
    expect(robots.text).not.toContain("Disallow: /api/\n");
    const sitemap = await request(app).get("/sitemap.xml");
    expect(sitemap.headers["content-type"]).toContain("xml");
    expect(sitemap.text).toContain(
      "<loc>https://kmrealestatecompany.com/services</loc>",
    );
    expect(sitemap.text).not.toContain("/admin");
  });
  it("keeps missing pages and staff pages out of the index", async () => {
    const missing = await request(app).get("/not-a-real-page");
    expect(missing.status).toBe(404);
    expect(missing.headers["x-robots-tag"]).toContain("noindex");
    const admin = await request(app).get("/admin");
    expect(admin.headers["x-robots-tag"]).toContain("noindex");
  });
  it("normalizes canonical URLs without redirect loops behind Netlify", async () => {
    const res = await request(app).get("/properties/?purpose=RENT");
    expect(res.status).toBe(200);
    expect(res.text).toContain(
      'href="https://kmrealestatecompany.com/properties"',
    );
  });
  it("includes real published detail URLs and excludes demo records from the sitemap", async () => {
    vi.mocked(db.entry.findMany).mockResolvedValueOnce([
      {
        kind: "service",
        slug: "design-and-build",
        updatedAt: new Date("2026-11-09T00:00:00Z"),
        specs: {},
      },
      {
        kind: "property",
        slug: "illustrative-property",
        updatedAt: new Date(),
        specs: { demo: true },
      },
    ] as never);
    const res = await request(app).get("/sitemap.xml");
    expect(res.text).toContain(
      "https://kmrealestatecompany.com/services/design-and-build",
    );
    expect(res.text).toContain("2026-11-09T00:00:00.000Z");
    expect(res.text).not.toContain("illustrative-property");
  });
  it("uses genuine detail metadata and marks illustrative content noindex", async () => {
    vi.mocked(db.entry.findFirst).mockResolvedValueOnce({
      title: "Design & Build",
      summary: "Discuss your design requirements.",
      body: "<p>Contact our team.</p>",
      kind: "service",
      slug: "design-and-build",
      images: [],
      specs: { demo: true },
      seoTitle: "Architectural Design in Juba",
      seoDescription: "Design services from K&M Real Estate.",
    } as never);
    const res = await request(app).get("/services/design-and-build");
    expect(res.status).toBe(200);
    expect(res.text).toContain(
      "Architectural Design in Juba | K&amp;M Real Estate",
    );
    expect(res.text).toContain("<h1>Design &amp; Build</h1>");
    expect(res.headers["x-robots-tag"]).toContain("noindex");
  });
  it("renders service category landing pages and includes them in the sitemap", async () => {
    vi.mocked(db.category.findFirst).mockResolvedValueOnce({
      id: "design",
      slug: "construction-and-design",
      kind: "service",
      name: "Construction & Design",
      description: "Discuss your building plans.",
    } as never);
    const page = await request(app).get(
      "/services/category/construction-and-design",
    );
    expect(page.status).toBe(200);
    expect(page.text).toContain("<h1>Construction &amp; Design</h1>");
    expect(page.headers["x-robots-tag"]).toBeUndefined();
    vi.mocked(db.category.findMany).mockResolvedValueOnce([
      { slug: "construction-and-design", updatedAt: new Date() },
    ] as never);
    const sitemap = await request(app).get("/sitemap.xml");
    expect(sitemap.text).toContain(
      "https://kmrealestatecompany.com/services/category/construction-and-design",
    );
  });
});
