import { test, expect } from "@playwright/test";
test("reveals content, responds to scrolling and returns to the top", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const card = page.locator(".service-card").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute("data-revealed", "true");
  const top = page.getByRole("button", { name: "Back to top", exact: true });
  await expect(top).toBeVisible();
  expect(
    await page
      .locator(".reading-progress")
      .evaluate((el) => el.style.transform),
  ).not.toBe("scaleX(0)");
  await top.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  if (isMobile)
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About Us", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
test("reduced motion keeps content visible without scroll reveal animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".service-card").first().scrollIntoViewIfNeeded();
  await expect(page.locator("[data-revealed]")).toHaveCount(0);
  expect(
    await page
      .locator(".service-card")
      .first()
      .evaluate((el) => window.getComputedStyle(el).opacity),
  ).toBe("1");
  await page.getByRole("button", { name: "Back to top", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
});
