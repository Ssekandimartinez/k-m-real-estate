import { readFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const { exports: images } = JSON.parse(
  await readFile("docs/image-allocation.json", "utf8"),
);
await mkdir("client/public/images/available", { recursive: true });
for (const image of images) {
  await sharp(image.source)
    .rotate()
    .resize({ width: 1800, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(`client/public${image.url}`);
}
console.log(`Prepared ${images.length} available photos; originals preserved.`);
