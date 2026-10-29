import { describe, expect, it } from "vitest";
import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const library = JSON.parse(
  await readFile(path.join(root, "docs/media-library.json"), "utf8"),
);
describe("Supplied visual collection", () => {
  it("accounts for every supplied non-branding image and video", async () => {
    const sources = new Set([
      ...library.assets.map((a: { source: string }) => a.source),
      ...library.duplicates.map((a: { source: string }) => a.source),
    ]);
    for (const folder of ["images", "videos"]) {
      for (const name of await readdir(path.join(root, folder))) {
        if (
          !/\.(jpe?g|png|webp|mp4)$/i.test(name) ||
          /K&M|KM_Favicon/.test(name)
        )
          continue;
        expect(
          sources.has(`${folder}/${name}`),
          `Unaccounted source: ${name}`,
        ).toBe(true);
      }
    }
  });
  it("assigns each unique asset once and supplies every video poster", async () => {
    const ids = new Set(),
      urls = new Set(),
      placements = new Set();
    for (const asset of library.assets) {
      expect(ids.has(asset.id)).toBe(false);
      expect(urls.has(asset.url)).toBe(false);
      ids.add(asset.id);
      urls.add(asset.url);
      expect(asset.category).toBeTruthy();
      expect(asset.alt).toBeTruthy();
      await access(path.join(root, "client/public", asset.url));
      if (asset.placement !== "gallery") {
        expect(
          placements.has(asset.placement),
          `Repeated placement: ${asset.placement}`,
        ).toBe(false);
        placements.add(asset.placement);
      }
      if (asset.type === "video") {
        expect(asset.poster).toBeTruthy();
        await access(path.join(root, "client/public", asset.poster));
      }
    }
  }, 20000);
});
