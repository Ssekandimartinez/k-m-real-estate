import { readFile, access } from "node:fs/promises";

const plan = JSON.parse(await readFile("docs/image-allocation.json", "utf8"));
const library = JSON.parse(await readFile("docs/media-library.json", "utf8"));
const owners = new Map();
const exceptions = new Map(
  plan.retainedSharedPhotos.map((item) => [item.id, new Set(item.owners)]),
);
function claim(identity, owner) {
  const previous = owners.get(identity);
  if (
    previous &&
    previous !== owner &&
    !(
      exceptions.get(identity)?.has(previous) &&
      exceptions.get(identity)?.has(owner)
    )
  )
    throw new Error(`${identity} reused by ${previous} and ${owner}`);
  owners.set(identity, owner);
}
for (const image of plan.changes) {
  if (image.url)
    claim(image.sourceId || image.url, `${image.kind}:${image.slug}`);
}
for (const asset of library.assets.filter((asset) => asset.type === "image")) {
  if (!asset.placement.startsWith("content-"))
    claim(asset.id, asset.placement === "gallery" ? asset.id : asset.placement);
  await access(`client/public${asset.url}`);
}
for (const image of plan.exports) await access(`client/public${image.url}`);
console.log(
  `Checked ${owners.size} distinct photo assignments and ${plan.exports.length} available exports.`,
);
