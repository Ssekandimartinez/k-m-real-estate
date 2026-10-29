import sharp from "sharp";

await sharp("images/pexels-artbovich-8135112.jpg")
  .rotate()
  .resize({ width: 2560, withoutEnlargement: true })
  .webp({ quality: 88 })
  .toFile("client/public/images/home-interior-hero.webp");
