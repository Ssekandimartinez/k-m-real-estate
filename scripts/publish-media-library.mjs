import { readFile, writeFile, access, readdir } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: "server/.env", quiet: true });
const library = JSON.parse(await readFile("docs/media-library.json", "utf8"));
const { annotations } = JSON.parse(
  await readFile("docs/media-curation.json", "utf8"),
);
const ids = new Set(),
  urls = new Set(),
  slots = new Set();
for (const asset of library.assets) {
  Object.assign(asset, annotations.find((a) => a.id === asset.id) || {});
  asset.category ||= "Visual inspiration";
  if (ids.has(asset.id) || urls.has(asset.url))
    throw new Error("Repeated media " + asset.id);
  if (asset.placement !== "gallery" && slots.has(asset.placement))
    throw new Error("Repeated placement " + asset.placement);
  ids.add(asset.id);
  urls.add(asset.url);
  if (asset.placement !== "gallery") slots.add(asset.placement);
  await access(`client/public${asset.url}`);
  if (asset.type === "video") {
    if (!asset.poster) throw new Error("Missing poster " + asset.id);
    await access(`client/public${asset.poster}`);
  }
}
// Every supplied non-branding media file is accounted for, including duplicate copies.
const covered = new Set([
  ...library.assets.map((a) => a.source),
  ...library.duplicates.map((a) => a.source),
]);
for (const folder of ["images", "videos"])
  for (const name of await readdir(folder)) {
    if (!/\.(jpe?g|png|webp|mp4)$/i.test(name) || /K&M|KM_Favicon/.test(name))
      continue;
    if (!covered.has(`${folder}/${name}`))
      throw new Error("Unaccounted source " + name);
  }
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const assets = library.assets.map(
    ({ id, type, url, poster, alt, placement, category }) => ({
      id,
      type,
      url,
      ...(poster ? { poster } : {}),
      alt,
      placement,
      category,
    }),
  );
  await db.setting.upsert({
    where: { key: "visual-media" },
    create: { key: "visual-media", value: { assets } },
    update: { value: { assets } },
  });
  await writeFile(
    "docs/media-library.json",
    JSON.stringify(library, null, 2) + "\n",
  );
  console.log(
    `Published ${assets.filter((a) => a.type === "image").length} unique images and ${assets.filter((a) => a.type === "video").length} unique videos; ${slots.size} exclusive page placements; ${library.duplicates.length} duplicate source copies accounted for.`,
  );
} finally {
  await db.$disconnect();
}
