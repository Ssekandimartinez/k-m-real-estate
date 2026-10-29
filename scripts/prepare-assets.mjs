import sharp from "sharp";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const selected = {
  architecture: "pexels-expect-best-79873-323780.jpg",
  interior: "pexels-artbovich-7546707.jpg",
  consultancy: "pexels-kindelmedia-7578983.jpg",
  construction: "pexels-thisisengineering-3862379.jpg",
  materials: "Steel Construction Materials.jpg",
  supplies: "combined desk.jpg",
  electrical: "pexels-pixabay-164829.jpg",
  plumbing: "Plumbing installation.jpg",
};
await mkdir(path.join(root, "client/public/images"), { recursive: true });
await mkdir(path.join(root, "client/public/branding"), { recursive: true });
for (const [name, file] of Object.entries(selected)) {
  await access(path.join(root, "images", file));
  await sharp(path.join(root, "images", file))
    .rotate()
    .resize({
      width: name === "architecture" ? 1800 : name==='plumbing'?800:1000,
      withoutEnlargement: true,
    })
    .webp({ quality: name==='plumbing'?66:name==='supplies'?72:82 })
    .toFile(path.join(root, "client/public/images", name + ".webp"));
}
await sharp(path.join(root, "images/pexels-expect-best-79873-323780.jpg"))
  .resize(900)
  .webp({ quality: 76 })
  .toFile(path.join(root, "client/public/images/architecture-mobile.webp"));
await sharp(path.join(root, "images/K&M Real Estate Logo.png"))
  .resize({ width: 192 })
  .webp({ quality: 80 })
  .toFile(path.join(root, "client/public/branding/logo.webp"));
await sharp(path.join(root, "images/KM_Favicon.png"))
  .resize(64, 64, { fit: "contain" })
  .png()
  .toFile(path.join(root, "client/public/branding/favicon.png"));
await writeFile(
  path.join(root, "docs/asset-manifest.json"),
  JSON.stringify(selected, null, 2) + "\n",
);
console.log("Optimized public assets prepared; original files preserved.");
