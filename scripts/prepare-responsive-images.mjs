import { readdir, mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = process.cwd();
const publicRoot = path.join(root, "client/public");
const output = path.join(publicRoot, "media/responsive");
await mkdir(output, { recursive: true });
const files = [];
async function scan(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const filename = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (filename !== output) await scan(filename);
    } else if (/\.webp$/i.test(entry.name)) files.push(filename);
  }
}
for (const folder of ["images", "media/library", "branding"])
  await scan(path.join(publicRoot, folder));
const manifest = {};
let created = 0;
for (const filename of files.sort()) {
  const source = await readFile(filename);
  const { width, height } = await sharp(source).metadata();
  if (!width || !height || width < 400) continue;
  const url =
    "/" + path.relative(publicRoot, filename).split(path.sep).join("/");
  const id = createHash("sha256").update(source).digest("hex").slice(0, 16);
  const sizes = [];
  for (const size of [320, 480, 960]) {
    if (size >= width) continue;
    const name = `${id}-${size}.webp`;
    try {
      await access(path.join(output, name));
    } catch {
      await sharp(source)
        .rotate()
        .resize({ width: size })
        .webp({ quality: 76, effort: 4 })
        .toFile(path.join(output, name));
    }
    sizes.push({ width: size, url: `/media/responsive/${name}` });
    created++;
  }
  sizes.push({ width, url });
  manifest[url] = [width, height, id];
}
await mkdir(path.join(root, "client/src/generated"), { recursive: true });
await writeFile(
  path.join(root, "client/src/generated/image-variants.json"),
  JSON.stringify(manifest),
);
console.log(
  `Prepared ${created} responsive derivatives for ${Object.keys(manifest).length} images. Originals preserved.`,
);
