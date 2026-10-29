import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { db } from "../server/src/db.js";
let adminEmail = "",
  adminPassword = "";
const testSlug = "browser-qa-" + randomBytes(6).toString("hex");
test.beforeAll(async () => {
  adminEmail = `${testSlug}@example.test`;
  adminPassword = randomBytes(24).toString("hex");
  await db.user.create({
    data: {
      name: "Browser QA Administrator",
      email: adminEmail,
      passwordHash: await argon2.hash(adminPassword),
      role: "ADMIN",
    },
  });
});
test.afterAll(async () => {
  await db.entry.deleteMany({ where: { slug: testSlug } });
  const user = await db.user.findUnique({ where: { email: adminEmail } });
  if (user) await db.auditLog.deleteMany({ where: { userId: user.id } });
  await db.user.deleteMany({ where: { email: adminEmail } });
  await db.customerRequest.deleteMany({
    where: { email: "browser-qa@example.test" },
  });
  await db.$disconnect();
});
test("public pages, service details and responsive navigation", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your Property. Our Expertise. Real Results.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (isMobile)
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About Us", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Real people. Real commitment.",
  );
  await page.goto("/services");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Plumbing & Technical Services",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Plumbing Installation", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Plumbing Installation",
  );
  await page.goto("/catalogue");
  await page.getByLabel("Supply group").selectOption("Furniture Supply");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: "Office Tables", exact: true }),
  ).toBeVisible();
  await page.goto("/properties?transaction=RENT&location=nonexistent");
  await expect(
    page.getByText(
      "No published properties match this selection. Tell us what you’re looking for and our team can help.",
    ),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});
test("quote form persists a request and server HTML includes content metadata", async ({
  page,
  request,
}) => {
  const response = await request.get("/catalogue/cement");
  const html = await response.text();
  expect(html).toContain("<h1>Cement</h1>");
  expect(html).toContain("og:title");
  expect(html).toContain("canonical");
  await page.goto("/quote?service=Cement");
  await page.getByLabel("Full name *").fill("Browser QA Customer");
  await page.getByLabel("Email *").fill("browser-qa@example.test");
  await page.getByLabel("Telephone *").fill("+211924265999");
  await page
    .getByLabel("Project requirements *")
    .fill(
      "Automated browser verification. Please disregard this test request.",
    );
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(
    page.getByRole("heading", { name: "Thank you. Your request is saved." }),
  ).toBeVisible();
});
test("staff can publish, edit and delete an article through the dashboard", async ({
  page,
  isMobile,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Email or username").fill(adminEmail);
  await page.getByLabel("Password", { exact: true }).fill(adminPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A clear view of what’s next.",
  );
  if (isMobile)
    await page.getByRole("button", { name: "Toggle staff navigation" }).click();
  await page.getByRole("link", { name: "Blog articles", exact: true }).click();
  await page.getByRole("button", { name: "Add new", exact: true }).click();
  await page.getByLabel("Title *", { exact: true }).fill("Browser QA article");
  await page.getByLabel("URL slug *").fill(testSlug);
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Temporary automated browser verification article.");
  await page.getByLabel("Publication status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(
    page.getByText("Browser QA article", { exact: true }),
  ).toBeVisible();
  const published = await page.request.get(`/api/content/post/${testSlug}`);
  expect(published.status()).toBe(200);
  await page
    .getByRole("row")
    .filter({ hasText: "Browser QA article" })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await page.getByLabel("Publication status").selectOption("DRAFT");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "DRAFT", exact: true }),
  ).toBeVisible();
  expect(
    (await page.request.get(`/api/content/post/${testSlug}`)).status(),
  ).toBe(404);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Browser QA article" }).click();
  await expect(
    page.getByText("Browser QA article", { exact: true }),
  ).not.toBeVisible();
});
