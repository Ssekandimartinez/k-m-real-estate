import { describe, expect, it, vi, afterEach } from "vitest";
import { buildStaticContent } from "../../scripts/static-content";
import { readStaticContent, type StaticContent } from "./staticContent";

const data = buildStaticContent(process.cwd()) as unknown as StaticContent;
afterEach(() => vi.unstubAllEnvs());

describe("standalone public website", () => {
  it("includes approved company content and all curated media without fabricated inventory", () => {
    expect(data.company.name).toBe("K&M Real Estate");
    expect(data.visualMedia.assets).toHaveLength(317);
    expect(
      data.visualMedia.assets.some(
        (asset) => asset.type === "video" && asset.poster,
      ),
    ).toBe(true);
    expect(data.entries.length).toBeGreaterThan(50);
    expect(
      data.entries.every((entry) =>
        ["service", "product"].includes(entry.kind),
      ),
    ).toBe(true);
    expect(readStaticContent(data, "/content/property")).toEqual({
      items: [],
      total: 0,
    });
  });

  it("filters and paginates the catalogue and opens its detail pages", () => {
    const category = data.categories.find((item) => item.kind === "product")!;
    const all = readStaticContent(
      data,
      `/content/product?category=${category.slug}&limit=100`,
    ) as { items: StaticContent["entries"]; total: number };
    expect(all.total).toBeGreaterThan(3);
    expect(all.items.every((item) => item.categoryId === category.id)).toBe(
      true,
    );
    const page = readStaticContent(
      data,
      `/content/product?category=${category.slug}&limit=2&page=2`,
    ) as typeof all;
    expect(page.items.map((item) => item.id)).toEqual(
      all.items.slice(2, 4).map((item) => item.id),
    );
    const first = all.items[0];
    expect(readStaticContent(data, `/content/product/${first.slug}`)).toEqual(
      first,
    );
    const search = readStaticContent(
      data,
      `/content/product?q=${encodeURIComponent(first.title)}&limit=100`,
    ) as typeof all;
    expect(search.items.some((item) => item.id === first.id)).toBe(true);
    expect(() =>
      readStaticContent(data, "/content/product/unknown-item"),
    ).toThrow("Content not found");
  });

  it("serves bundled public content and refuses writes without any network request", async () => {
    vi.stubEnv("VITE_STANDALONE", "true");
    vi.resetModules();
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => data });
    vi.stubGlobal("fetch", fetch);
    try {
      const { api } = await import("./api");
      expect(await api("/settings")).toEqual(data.company);
      expect(await api("/visual-media")).toEqual(data.visualMedia);
      await expect(
        api("/requests", { method: "POST", body: "{}" }),
      ).rejects.toThrow("email or telephone");
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });
});
