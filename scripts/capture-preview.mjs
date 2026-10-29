import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir(".local/previews", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
for (const [name, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:4000/", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `.local/previews/${name}.png`,
    fullPage: true,
  });
  await page.close();
}
await browser.close();
