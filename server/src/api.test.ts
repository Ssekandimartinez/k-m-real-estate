import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { app, errorHandler } from "./app.js";
import { db } from "./db.js";
import { config } from "./config.js";
app.use(errorHandler);
const run = process.env.RUN_DATABASE_TESTS === "1" ? describe : describe.skip;
run("PostgreSQL API workflows", () => {
  const suffix = randomBytes(5).toString("hex");
  const password = randomBytes(24).toString("hex");
  const adminEmail = `admin-${suffix}@example.test`,
    staffEmail = `staff-${suffix}@example.test`;
  const admin = request.agent(app),
    staff = request.agent(app);
  let csrf = "",
    staffCsrf = "",
    entryId = "",
    requestId = "",
    resetToken = "";
  const slug = "integration-" + suffix;
  beforeAll(async () => {
    await db.user.createMany({
      data: [
        {
          email: adminEmail,
          username: `admin-${suffix}`,
          name: "Integration Admin",
          passwordHash: await argon2.hash(password),
          role: "ADMIN",
        },
        {
          email: staffEmail,
          name: "Integration Staff",
          passwordHash: await argon2.hash(password),
          role: "STAFF",
        },
      ],
    });
  });
  afterAll(async () => {
    await db.customerRequest.deleteMany({
      where: {
        OR: [
          { email: `customer-${suffix}@example.test` },
          { email: `=formula-${suffix}@example.test` },
        ],
      },
    });
    await db.entry.deleteMany({ where: { slug } });
    const users = await db.user.findMany({
      where: { email: { in: [adminEmail, staffEmail] } },
    });
    await db.auditLog.deleteMany({
      where: { userId: { in: users.map((v) => v.id) } },
    });
    await db.user.deleteMany({
      where: { email: { in: [adminEmail, staffEmail] } },
    });
    await db.$disconnect();
  });
  it("filters the real seeded catalogue by logical supply group", async () => {
    const groups = await request(app).get("/api/catalogue-groups");
    expect(groups.body).toContain("Furniture Supply");
    const result = await request(app).get(
      "/api/content/product?subgroup=Furniture%20Supply",
    );
    expect(result.status).toBe(200);
    expect(result.body.total).toBeGreaterThan(0);
    expect(
      result.body.items.every(
        (v: any) => v.specs.supplyCategory === "Furniture Supply",
      ),
    ).toBe(true);
  });
  it("rejects unauthenticated dashboard access", async () => {
    expect((await request(app).get("/api/admin/stats")).status).toBe(401);
  });
  it("signs in with a staff username as well as an email address", async () => {
    const result = await request(app)
      .post("/api/auth/login")
      .set("Origin", config.origin)
      .send({ email: `admin-${suffix}`, password });
    expect(result.status).toBe(200);
    expect(result.body.user.email).toBe(adminEmail);
  });
  it("rejects cross-origin state changes", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Origin", "https://evil.example")
          .send({ email: adminEmail, password })
      ).status,
    ).toBe(403);
  });
  it("accepts the local hostname alias but rejects other ports", async () => {
    if (config.production) return;
    const alias = new URL(config.origin);
    alias.hostname = alias.hostname === "localhost" ? "127.0.0.1" : "localhost";
    const accepted = await request(app)
      .post("/api/auth/login")
      .set("Origin", alias.origin)
      .send({ email: "missing@example.test", password: "not-a-real-password" });
    expect(accepted.status).toBe(401);
    alias.port = String(Number(alias.port || 80) + 1);
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Origin", alias.origin)
          .send({})
      ).status,
    ).toBe(403);
  });
  it("authenticates staff and issues HttpOnly session cookies", async () => {
    const r = await admin
      .post("/api/auth/login")
      .set("Origin", config.origin)
      .send({ email: adminEmail, password });
    expect(r.status).toBe(200);
    csrf = r.body.csrfToken;
    expect(r.headers["set-cookie"][0]).toContain("HttpOnly");
    const s = await staff
      .post("/api/auth/login")
      .set("Origin", config.origin)
      .send({ email: staffEmail, password });
    staffCsrf = s.body.csrfToken;
    expect(s.status).toBe(200);
  });
  it("enforces role and CSRF protections", async () => {
    expect((await staff.get("/api/admin/users")).status).toBe(403);
    expect(
      (
        await admin
          .post("/api/admin/content")
          .set("Origin", config.origin)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await staff
          .put("/api/admin/settings")
          .set("Origin", config.origin)
          .set("X-CSRF-Token", staffCsrf)
          .send({})
      ).status,
    ).toBe(403);
  });
  it("keeps website settings developer-managed even for administrators", async () => {
    const before = await db.setting.findUnique({ where: { key: "company" } });
    const response = await admin
      .put("/api/admin/settings")
      .set("Origin", config.origin)
      .set("X-CSRF-Token", csrf)
      .send({ name: "Attempted dashboard edit" });
    expect(response.status).toBe(403);
    expect(await db.setting.findUnique({ where: { key: "company" } })).toEqual(
      before,
    );
  });
  it("creates draft property and excludes it from public search", async () => {
    const r = await admin
      .post("/api/admin/content")
      .set("Origin", config.origin)
      .set("X-CSRF-Token", csrf)
      .send({
        kind: "property",
        slug,
        title: "Integration property — test only",
        body: "<p>Test fixture</p>",
        status: "DRAFT",
        transaction: "SALE",
        location: `Test location ${suffix}`,
        price: 1000,
        currency: "USD",
        bedrooms: 3,
        bathrooms: 2,
        area: 100,
        amenities: ["Garden"],
        images: [
          { url: "/images/architecture.webp", alt: "Integration fixture" },
        ],
      });
    expect(r.status).toBe(201);
    entryId = r.body.id;
    expect(
      (await request(app).get(`/api/content/property/${slug}`)).status,
    ).toBe(404);
  });
  it("publishes database content and applies filters", async () => {
    const records = await admin.get("/api/admin/content/property");
    const item = records.body.find((v: any) => v.id === entryId);
    const result = await admin
      .put(`/api/admin/content/${entryId}`)
      .set("Origin", config.origin)
      .set("X-CSRF-Token", csrf)
      .send({ ...item, price: Number(item.price), status: "PUBLISHED" });
    expect(result.status).toBe(200);
    const matching = await request(app).get(
      `/api/content/property?location=${suffix}&min=500&max=1500&bedrooms=3&amenity=Garden&currency=USD&transaction=SALE`,
    );
    expect(matching.body.items.some((v: any) => v.id === entryId)).toBe(true);
    const mismatch = await request(app).get(
      `/api/content/property?location=${suffix}&min=2000`,
    );
    expect(mismatch.body.total).toBe(0);
  });
  it("saves genuine viewing requests and notes without email configuration", async () => {
    const r = await request(app)
      .post("/api/requests")
      .set("Origin", config.origin)
      .send({
        kind: "VIEWING",
        name: "Integration Customer",
        email: `customer-${suffix}@example.test`,
        phone: "+211924265999",
        message: "Please arrange a viewing for this test.",
        entryId,
        consent: true,
      });
    expect(r.status).toBe(201);
    requestId = r.body.id;
    expect(
      await db.customerRequest.findUnique({ where: { id: requestId } }),
    ).not.toBeNull();
    const updated = await admin
      .patch(`/api/admin/requests/${requestId}`)
      .set("Origin", config.origin)
      .set("X-CSRF-Token", csrf)
      .send({
        status: "IN_PROGRESS",
        notes: "Integration follow-up",
        followUpAt: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(updated.status).toBe(200);
    expect(updated.body.notes).toBe("Integration follow-up");
  });
  it("exports requests, rejects invalid requests and reports missing storage", async () => {
    const r = await admin.get("/api/admin/requests/export?kind=VIEWING");
    expect(r.status).toBe(200);
    expect(r.text).toContain("Integration Customer");
    expect(
      (
        await request(app)
          .post("/api/requests")
          .set("Origin", config.origin)
          .send({ name: "x" })
      ).status,
    ).toBe(400);
    if (!process.env.CLOUDINARY_API_SECRET) {
      expect(
        (
          await admin
            .post("/api/admin/media")
            .set("Origin", config.origin)
            .set("X-CSRF-Token", csrf)
        ).status,
      ).toBe(503);
    }
  });
  it("consumes password reset tokens once and revokes sessions", async () => {
    const { token, hashToken } = await import("./auth.js");
    resetToken = token();
    const u = await db.user.findUniqueOrThrow({ where: { email: staffEmail } });
    await db.passwordReset.create({
      data: {
        userId: u.id,
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const r = await request(app)
      .post("/api/auth/reset")
      .set("Origin", config.origin)
      .send({ token: resetToken, password: randomBytes(24).toString("hex") });
    expect(r.status).toBe(200);
    expect((await staff.get("/api/auth/me")).status).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/auth/reset")
          .set("Origin", config.origin)
          .send({ token: resetToken, password })
      ).status,
    ).toBe(400);
  });
  it("archives and deletes content through protected endpoints", async () => {
    const records = await admin.get("/api/admin/content/property");
    const item = records.body.find((v: any) => v.id === entryId);
    expect(
      (
        await admin
          .put(`/api/admin/content/${entryId}`)
          .set("Origin", config.origin)
          .set("X-CSRF-Token", csrf)
          .send({ ...item, price: Number(item.price), status: "ARCHIVED" })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get(`/api/content/property/${slug}`)).status,
    ).toBe(404);
    expect(
      (
        await admin
          .delete(`/api/admin/content/${entryId}`)
          .set("Origin", config.origin)
          .set("X-CSRF-Token", csrf)
      ).status,
    ).toBe(200);
  });
});
