import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  copyFile,
  stat,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import sharp from "sharp";
import { chromium } from "@playwright/test";
await mkdir("client/public/media/library", { recursive: true });
await mkdir(".local/media-review", { recursive: true });
const assets = [],
  duplicates = [],
  hashes = new Map();
for (const [folder, type] of [
  ["images", "image"],
  ["videos", "video"],
]) {
  for (const name of (await readdir(folder)).sort()) {
    if (!/\.(jpe?g|png|webp|mp4)$/i.test(name)) continue;
    if (/K&M|KM_Favicon/.test(name)) continue;
    const source = `${folder}/${name}`;
    const bytes = await readFile(source);
    const hash = createHash("sha256")
      .update(
        type === "image"
          ? await sharp(bytes)
              .rotate()
              .resize(64, 64, { fit: "fill" })
              .removeAlpha()
              .raw()
              .toBuffer()
          : bytes,
      )
      .digest("hex");
    if (hashes.has(hash)) {
      duplicates.push({ source, sameAs: hashes.get(hash) });
      continue;
    }
    hashes.set(hash, source);
    const id = `${type}-${String(assets.filter((a) => a.type === type).length + 1).padStart(3, "0")}`;
    const url = `/media/library/${id}.${type === "image" ? "webp" : "mp4"}`;
    if (type === "image")
      await sharp(bytes)
        .rotate()
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(`client/public${url}`);
    else await copyFile(source, `client/public${url}`);
    assets.push({
      id,
      type,
      source,
      url,
      alt: `Illustrative ${type === "image" ? "photograph" : "video"} ${id.split("-")[1]}`,
      placement: "gallery",
    });
  }
}
await writeFile(
  "docs/media-library.json",
  JSON.stringify({ assets, duplicates }, null, 2) + "\n",
);
console.log(
  "Imported",
  assets.length,
  "unique media;",
  duplicates.length,
  "duplicate files",
);
const server = createServer(async (req, res) => {
  const asset = assets.find((a) => a.id === req.url.slice(1));
  if (!asset) {
    res.writeHead(404);
    res.end();
    return;
  }
  const file = `client/public${asset.url}`,
    size = (await stat(file)).size;
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Accept-Ranges", "bytes");
  const range = req.headers.range;
  if (range) {
    const [startString, endString] = range.replace("bytes=", "").split("-");
    const start = Number(startString),
      end = endString ? Math.min(Number(endString), size - 1) : size - 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": end - start + 1,
    });
    createReadStream(file, { start, end }).pipe(res);
  } else {
    res.setHeader("Content-Length", size);
    createReadStream(file).pipe(res);
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  for (const asset of assets.filter((a) => a.type === "video")) {
    await page.goto(`http://127.0.0.1:${server.address().port}/${asset.id}`);
    await page.waitForFunction(
      () => document.querySelector("video")?.readyState >= 2,
    );
    const frame = await page.evaluate(async () => {
      const video = document.querySelector("video");
      video.pause();
      video.currentTime = Math.min(2, video.duration / 2);
      await new Promise((resolve) =>
        video.addEventListener("seeked", resolve, { once: true }),
      );
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      canvas.getContext("2d").drawImage(video, 0, 0, 640, 360);
      return canvas.toDataURL("image/png").split(",")[1];
    });
    asset.poster = `/media/library/${asset.id}-poster.webp`;
    await sharp(Buffer.from(frame, "base64"))
      .webp({ quality: 75 })
      .toFile(`client/public${asset.poster}`);
  }
} finally {
  await browser.close();
  server.close();
}
await writeFile(
  "docs/media-library.json",
  JSON.stringify({ assets, duplicates }, null, 2) + "\n",
);
for (let offset = 0; offset < assets.length; offset += 48) {
  const slice = assets.slice(offset, offset + 48);
  const tiles = [];
  for (const [i, a] of slice.entries()) {
    const thumb = await sharp(`client/public${a.poster || a.url}`)
      .resize(180, 110, { fit: "contain", background: "#eee" })
      .extend({ bottom: 24, background: "#fff" })
      .composite([
        {
          input: Buffer.from(
            `<svg width="180" height="24"><text x="5" y="17" font-size="14">${a.id}</text></svg>`,
          ),
          top: 110,
          left: 0,
        },
      ])
      .png()
      .toBuffer();
    tiles.push({
      input: thumb,
      left: (i % 6) * 180,
      top: Math.floor(i / 6) * 134,
    });
  }
  await sharp({
    create: {
      width: 1080,
      height: Math.ceil(slice.length / 6) * 134,
      channels: 3,
      background: "#fff",
    },
  })
    .composite(tiles)
    .jpeg()
    .toFile(`.local/media-review/sheet-${offset}.jpg`);
}
console.log("Posters and review sheets ready.");
