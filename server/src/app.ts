import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import argon2 from "argon2";
import { z, ZodError } from "zod";
import multer from "multer";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { Prisma } from "@prisma/client";
import { db } from "./db.js";
import { config, allowedOrigins } from "./config.js";
import {
  authenticate,
  adminOnly,
  cookieName,
  cookieOptions,
  hashToken,
  token,
  type AuthRequest,
} from "./auth.js";
import {
  categorySchema,
  entrySchema,
  kindSchema,
  passwordSchema,
  requestSchema,
  settingsSchema,
} from "./validation.js";
import { mailConfigured, sendMail } from "./mail.js";

export const app = express();
app.disable("x-powered-by");
app.use(compression());
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://www.googletagmanager.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "https:", "data:"],
        fontSrc: ["'self'"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        connectSrc: [
          "'self'",
          "https://*.google-analytics.com",
          "https://*.analytics.google.com",
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, Boolean(origin && allowedOrigins.has(origin))),
    credentials: true,
  }),
);
app.use(express.json({ limit: "350kb" }));
app.use(cookieParser());
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 180,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
// Origin enforcement also protects unauthenticated login/reset endpoints.
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    !allowedOrigins.has(req.get("origin") || "")
  ) {
    res.status(403).json({ error: "Request origin is not allowed" });
    return;
  }
  next();
});
const authLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
const formLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
const safeUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} as const;
const audit = (req: AuthRequest, action: string, entityId?: string) =>
  db.auditLog.create({ data: { userId: req.staff?.id, action, entityId } });
const paging = (query: Record<string, unknown>) => ({
  take: Math.min(100, Math.max(1, Number(query.limit) || 24)),
  skip:
    Math.max(0, (Number(query.page) || 1) - 1) *
    Math.min(100, Math.max(1, Number(query.limit) || 24)),
});
app.get("/api/health", async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});
app.get("/api/settings", async (_req, res) => {
  const setting = await db.setting.findUnique({ where: { key: "company" } });
  res.json(setting?.value || null);
});
app.get("/api/visual-media", async (_req, res) => {
  const library = await db.setting.findUnique({
    where: { key: "visual-media" },
  });
  res.json(library?.value || { assets: [] });
});
app.get("/api/catalogue-groups", async (_req, res) => {
  const items = await db.entry.findMany({
    where: { kind: "product", status: "PUBLISHED" },
    select: { specs: true },
  });
  res.json(
    [
      ...new Set(
        items
          .map((v) => (v.specs as Record<string, unknown>).supplyCategory)
          .filter((v): v is string => typeof v === "string"),
      ),
    ].sort(),
  );
});
app.get("/api/categories", async (req, res) => {
  const kind = kindSchema.parse(req.query.kind);
  res.json(
    await db.category.findMany({ where: { kind }, orderBy: { name: "asc" } }),
  );
});
app.get("/api/content/:kind", async (req, res) => {
  const kind = kindSchema.parse(req.params.kind);
  const q = req.query;
  const num = (key: string) =>
    q[key] !== undefined
      ? z.coerce.number().finite().nonnegative().parse(q[key])
      : undefined;
  const where: Prisma.EntryWhereInput = {
    kind,
    status: "PUBLISHED",
    ...(kind === "testimonial" ? { verified: true } : {}),
    ...(q.featured === "true" ? { featured: true } : {}),
    ...(q.category ? { category: { slug: String(q.category) } } : {}),
    ...(q.subgroup
      ? {
          specs: {
            path: ["supplyCategory"],
            equals: String(q.subgroup).slice(0, 200),
          },
        }
      : {}),
    ...(q.transaction
      ? { transaction: z.enum(["SALE", "RENT"]).parse(q.transaction) }
      : {}),
    ...(q.currency
      ? { currency: z.enum(["USD", "SSP"]).parse(q.currency) }
      : {}),
    ...(q.location
      ? {
          location: {
            contains: String(q.location).slice(0, 200),
            mode: "insensitive",
          },
        }
      : {}),
    ...(q.q
      ? {
          OR: [
            {
              title: {
                contains: String(q.q).slice(0, 200),
                mode: "insensitive",
              },
            },
            {
              summary: {
                contains: String(q.q).slice(0, 200),
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(num("min") !== undefined || num("max") !== undefined
      ? { price: { gte: num("min"), lte: num("max") } }
      : {}),
    ...(num("bedrooms") !== undefined
      ? { bedrooms: { gte: num("bedrooms") } }
      : {}),
    ...(num("bathrooms") !== undefined
      ? { bathrooms: { gte: num("bathrooms") } }
      : {}),
    ...(q.amenity
      ? { amenities: { has: String(q.amenity).slice(0, 100) } }
      : {}),
  };
  const orderBy: Prisma.EntryOrderByWithRelationInput =
    q.sort === "price-asc"
      ? { price: { sort: "asc", nulls: "last" } }
      : q.sort === "price-desc"
        ? { price: { sort: "desc", nulls: "last" } }
        : { publishedAt: "desc" };
  const [items, total] = await db.$transaction([
    db.entry.findMany({
      where,
      include: { category: true, images: { orderBy: { position: "asc" } } },
      orderBy,
      ...paging(q),
    }),
    db.entry.count({ where }),
  ]);
  res.json({ items, total });
});
app.get("/api/content/:kind/:slug", async (req, res) => {
  const kind = kindSchema.parse(req.params.kind);
  const item = await db.entry.findFirst({
    where: {
      kind,
      slug: req.params.slug,
      status: "PUBLISHED",
      ...(kind === "testimonial" ? { verified: true } : {}),
    },
    include: { category: true, images: { orderBy: { position: "asc" } } },
  });
  if (!item) {
    res.status(404).json({ error: "Content not found" });
    return;
  }
  res.json(item);
});
app.post("/api/requests", formLimit, async (req, res) => {
  const {
    consent: _consent,
    website: _website,
    preferredDate,
    ...data
  } = requestSchema.parse(req.body);
  if (["VIEWING", "PROPERTY"].includes(data.kind) && !data.entryId) {
    res.status(400).json({ error: "Choose a property" });
    return;
  }
  if (
    data.entryId &&
    !(await db.entry.findFirst({
      where: {
        id: data.entryId,
        status: "PUBLISHED",
        ...(["VIEWING", "PROPERTY"].includes(data.kind)
          ? { kind: "property" }
          : {}),
      },
    }))
  ) {
    res.status(400).json({ error: "Selected item is unavailable" });
    return;
  }
  const saved = await db.customerRequest.create({
    data: {
      ...data,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
    },
  });
  let notificationStatus = "NOT_CONFIGURED";
  try {
    if (
      await sendMail(
        process.env.NOTIFY_EMAIL || "kmrealestate38@gmail.com",
        `K&M ${saved.kind} request ${saved.id}`,
        `${saved.name}\n${saved.email}\n${saved.phone}\n${saved.service}\n${saved.message}\n${saved.quantities}`,
      )
    )
      notificationStatus = "SENT";
  } catch {
    notificationStatus = "FAILED";
  }
  await db.customerRequest.update({
    where: { id: saved.id },
    data: { notificationStatus },
  });
  res.status(201).json({
    id: saved.id,
    message: "Your request has been saved. Our team will follow up.",
    notificationStatus,
  });
});
app.post("/api/auth/login", authLimit, async (req, res) => {
  const data = z
    .object({
      email: z.string().trim().min(1).max(200),
      password: z.string().min(1).max(128),
    })
    .parse(req.body);
  const identifier = data.email.toLowerCase();
  const user = await db.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });
  const dummy =
    "$argon2id$v=19$m=65536,t=3,p=4$bm9uc2VjcmV0c2FsdDEyMw$7EO69YhoLR9xJwTOQwLTmKhJoT5QzDuMg0SmI7d8kFU";
  const valid = await argon2
    .verify(user?.passwordHash || dummy, data.password)
    .catch(() => false);
  if (!user || !user.active || !valid) {
    res.status(401).json({ error: "Invalid email, username or password" });
    return;
  }
  const raw = token(),
    csrfToken = token();
  await db.session.create({
    data: {
      tokenHash: hashToken(raw),
      csrfToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 8 * 3600000),
    },
  });
  res.cookie(cookieName, raw, { ...cookieOptions, maxAge: 8 * 3600000 }).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    csrfToken,
  });
});
app.get("/api/auth/me", authenticate, (req: AuthRequest, res) =>
  res.json({ user: req.staff, csrfToken: req.csrfToken }),
);
app.post("/api/auth/logout", authenticate, async (req: AuthRequest, res) => {
  await db.session.delete({ where: { id: req.sessionId } });
  res.clearCookie(cookieName, cookieOptions).json({ ok: true });
});
app.post("/api/auth/password", authenticate, async (req: AuthRequest, res) => {
  const data = z
    .object({ current: z.string(), password: passwordSchema })
    .parse(req.body);
  const user = await db.user.findUniqueOrThrow({
    where: { id: req.staff!.id },
  });
  if (!(await argon2.verify(user.passwordHash, data.current))) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: await argon2.hash(data.password) },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);
  await audit(req, "password.change", user.id);
  res.clearCookie(cookieName, cookieOptions).json({ ok: true });
});
app.post("/api/auth/forgot", authLimit, async (req, res) => {
  const { email } = z.object({ email: z.email() }).parse(req.body);
  if (!mailConfigured()) {
    res.status(503).json({
      error:
        "Password reset email is not configured. Contact the administrator.",
    });
    return;
  }
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (user?.active) {
    const raw = token();
    await db.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 30 * 60000),
      },
    });
    try {
      await sendMail(
        user.email,
        "Reset your K&M staff password",
        `${config.siteUrl}/admin/reset?token=${raw}\nThis link expires in 30 minutes.`,
      );
    } catch {
      console.error("Password reset email delivery failed");
    }
  }
  res.json({
    message: "If the account exists, a reset email has been requested.",
  });
});
app.post("/api/auth/reset", authLimit, async (req, res) => {
  const data = z
    .object({ token: z.string().length(64), password: passwordSchema })
    .parse(req.body);
  const reset = await db.passwordReset.findUnique({
    where: { tokenHash: hashToken(data.token) },
  });
  if (!reset || reset.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset link" });
    return;
  }
  await db.$transaction(async (tx) => {
    await tx.passwordReset.delete({ where: { id: reset.id } });
    await tx.user.update({
      where: { id: reset.userId },
      data: { passwordHash: await argon2.hash(data.password) },
    });
    await tx.session.deleteMany({ where: { userId: reset.userId } });
    await tx.passwordReset.deleteMany({ where: { userId: reset.userId } });
  });
  res.json({ message: "Password updated. Please sign in." });
});

app.use("/api/admin", authenticate, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.get("/api/admin/stats", async (_req, res) => {
  const [
    totalProperties,
    publishedProperties,
    sale,
    rent,
    inquiries,
    pending,
    viewings,
    quotations,
    projects,
    posts,
  ] = await db.$transaction([
    db.entry.count({ where: { kind: "property" } }),
    db.entry.count({ where: { kind: "property", status: "PUBLISHED" } }),
    db.entry.count({ where: { kind: "property", transaction: "SALE" } }),
    db.entry.count({ where: { kind: "property", transaction: "RENT" } }),
    db.customerRequest.count(),
    db.customerRequest.count({ where: { status: "NEW" } }),
    db.customerRequest.count({ where: { kind: "VIEWING" } }),
    db.customerRequest.count({ where: { kind: "QUOTATION" } }),
    db.entry.count({ where: { kind: "project", status: "PUBLISHED" } }),
    db.entry.count({ where: { kind: "post", status: "PUBLISHED" } }),
  ]);
  res.json({
    totalProperties,
    publishedProperties,
    sale,
    rent,
    inquiries,
    pending,
    viewings,
    quotations,
    projects,
    posts,
  });
});
app.get("/api/admin/content/:kind", async (req, res) => {
  const kind = kindSchema.parse(req.params.kind);
  res.json(
    await db.entry.findMany({
      where: { kind },
      include: { category: true, images: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
  );
});
app.post("/api/admin/content", async (req: AuthRequest, res) => {
  const { images, ...data } = entrySchema.parse(req.body);
  if (
    data.categoryId &&
    !(await db.category.findFirst({
      where: { id: data.categoryId, kind: data.kind },
    }))
  ) {
    res.status(400).json({ error: "Category does not match content type" });
    return;
  }
  const item = await db.entry.create({
    data: {
      ...data,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      images: { create: images.map((v, position) => ({ ...v, position })) },
    },
    include: { images: true },
  });
  await audit(req, "content.create", item.id);
  res.status(201).json(item);
});
app.put("/api/admin/content/:id", async (req: AuthRequest, res) => {
  const { images, ...data } = entrySchema.parse(req.body);
  const existing = await db.entry.findUniqueOrThrow({
    where: { id: req.params.id as string },
  });
  if (existing.kind !== data.kind) {
    res.status(400).json({ error: "Content type cannot change" });
    return;
  }
  if (
    data.categoryId &&
    !(await db.category.findFirst({
      where: { id: data.categoryId, kind: data.kind },
    }))
  ) {
    res.status(400).json({ error: "Category does not match content type" });
    return;
  }
  const item = await db.entry.update({
    where: { id: existing.id },
    data: {
      ...data,
      publishedAt:
        data.status === "PUBLISHED" ? existing.publishedAt || new Date() : null,
      images: {
        deleteMany: {},
        create: images.map((v, position) => ({ ...v, position })),
      },
    },
    include: { images: true },
  });
  await audit(req, "content.update", item.id);
  res.json(item);
});
app.delete("/api/admin/content/:id", async (req: AuthRequest, res) => {
  await db.entry.delete({ where: { id: req.params.id as string } });
  await audit(req, "content.delete", req.params.id as string);
  res.json({ ok: true });
});
app.get("/api/admin/categories", async (_req, res) =>
  res.json(await db.category.findMany({ orderBy: { name: "asc" } })),
);
app.post("/api/admin/categories", async (req: AuthRequest, res) => {
  const item = await db.category.create({
    data: categorySchema.parse(req.body),
  });
  await audit(req, "category.create", item.id);
  res.status(201).json(item);
});
app.put("/api/admin/categories/:id", async (req: AuthRequest, res) => {
  const data = categorySchema.parse(req.body);
  const existing = await db.category.findUniqueOrThrow({
    where: { id: req.params.id as string },
  });
  if (existing.kind !== data.kind) {
    res.status(400).json({ error: "Category type cannot change" });
    return;
  }
  const item = await db.category.update({ where: { id: existing.id }, data });
  await audit(req, "category.update", item.id);
  res.json(item);
});
app.delete("/api/admin/categories/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (await db.entry.count({ where: { categoryId: id } })) {
    res
      .status(409)
      .json({ error: "Move all content to another category before deleting" });
    return;
  }
  await db.category.delete({ where: { id } });
  await audit(req, "category.delete", id);
  res.json({ ok: true });
});
function requestWhere(
  q: Record<string, unknown>,
): Prisma.CustomerRequestWhereInput {
  return {
    ...(q.kind
      ? {
          kind: z
            .enum([
              "CONTACT",
              "PROPERTY",
              "VIEWING",
              "QUOTATION",
              "CONSULTATION",
            ])
            .parse(q.kind),
        }
      : {}),
    ...(q.status
      ? { status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]).parse(q.status) }
      : {}),
    ...(q.service
      ? { service: { contains: String(q.service), mode: "insensitive" } }
      : {}),
    ...(q.q
      ? {
          OR: [
            { name: { contains: String(q.q), mode: "insensitive" } },
            { email: { contains: String(q.q), mode: "insensitive" } },
            { message: { contains: String(q.q), mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
app.get("/api/admin/requests", async (req, res) =>
  res.json(
    await db.customerRequest.findMany({
      where: requestWhere(req.query),
      include: { entry: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      ...paging(req.query),
    }),
  ),
);
app.get("/api/admin/requests/export", async (req, res) => {
  const items = await db.customerRequest.findMany({
    where: requestWhere(req.query),
    orderBy: { createdAt: "desc" },
    take: 10000,
  });
  const cols = [
    "id",
    "kind",
    "status",
    "name",
    "email",
    "phone",
    "service",
    "location",
    "message",
    "quantities",
    "notes",
    "createdAt",
  ] as const;
  const cell = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  res
    .set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="km-requests.csv"',
    })
    .send(
      [
        cols.join(","),
        ...items.map((item) => cols.map((key) => cell(item[key])).join(",")),
      ].join("\r\n"),
    );
});
app.patch("/api/admin/requests/:id", async (req: AuthRequest, res) => {
  const data = z
    .object({
      status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]),
      notes: z.string().max(10000),
      followUpAt: z.iso.datetime().nullable(),
    })
    .parse(req.body);
  const item = await db.customerRequest.update({
    where: { id: req.params.id as string },
    data,
  });
  await audit(req, "request.update", item.id);
  res.json(item);
});
app.put("/api/admin/settings", adminOnly, async (req: AuthRequest, res) => {
  const value = settingsSchema.parse(req.body);
  await db.setting.upsert({
    where: { key: "company" },
    create: { key: "company", value },
    update: { value },
  });
  await audit(req, "settings.update");
  res.json(value);
});
app.get("/api/admin/users", adminOnly, async (_req, res) =>
  res.json(
    await db.user.findMany({
      select: safeUser,
      orderBy: { createdAt: "desc" },
    }),
  ),
);
app.post("/api/admin/users", adminOnly, async (req: AuthRequest, res) => {
  const { password, ...data } = z
    .object({
      name: z.string().min(2).max(100),
      email: z.email(),
      role: z.enum(["ADMIN", "STAFF"]),
      password: passwordSchema,
    })
    .parse(req.body);
  const user = await db.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      passwordHash: await argon2.hash(password),
    },
    select: safeUser,
  });
  await audit(req, "user.create", user.id);
  res.status(201).json(user);
});
app.patch("/api/admin/users/:id", adminOnly, async (req: AuthRequest, res) => {
  const data = z
    .object({
      name: z.string().min(2).max(100),
      role: z.enum(["ADMIN", "STAFF"]),
      active: z.boolean(),
    })
    .parse(req.body);
  if (
    req.params.id === req.staff!.id &&
    (data.role !== "ADMIN" || !data.active)
  ) {
    res
      .status(400)
      .json({ error: "You cannot demote or deactivate your own account" });
    return;
  }
  const user = await db.user.update({
    where: { id: req.params.id as string },
    data,
    select: safeUser,
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  await audit(req, "user.update", user.id);
  res.json(user);
});
app.get("/api/admin/audit", adminOnly, async (_req, res) =>
  res.json(
    await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ),
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});
app.get("/api/admin/media", async (_req, res) =>
  res.json(await db.media.findMany({ orderBy: { createdAt: "desc" } })),
);
app.post(
  "/api/admin/media",
  upload.single("file"),
  async (req: AuthRequest, res) => {
    if (!process.env.CLOUDINARY_API_SECRET) {
      res.status(503).json({
        error: "Configure persistent Cloudinary storage before uploading media",
      });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Choose an image or MP4 video" });
      return;
    }
    const meta = z
      .object({
        name: z.string().min(1).max(200),
        alt: z.string().min(2).max(300),
        folder: z.string().regex(/^[a-z0-9-]{1,80}$/),
      })
      .parse(req.body);
    let buffer: Buffer;
    let type: "image" | "video";
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      const image = sharp(file.buffer, { limitInputPixels: 40000000 });
      await image.metadata();
      buffer = await image
        .rotate()
        .resize({ width: 2400, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      type = "image";
    } else if (
      file.mimetype === "video/mp4" &&
      file.buffer.subarray(4, 8).toString() === "ftyp"
    ) {
      buffer = file.buffer;
      type = "video";
    } else {
      res.status(400).json({
        error: "Only genuine JPEG, PNG, WebP and MP4 files are supported",
      });
      return;
    }
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `km/${meta.folder}`, resource_type: type },
        (error, result) => (error ? reject(error) : resolve(result)),
      );
      stream.end(buffer);
    });
    try {
      const media = await db.media.create({
        data: {
          ...meta,
          url: result.secure_url,
          publicId: result.public_id,
          type,
          bytes: result.bytes,
        },
      });
      await audit(req, "media.upload", media.id);
      res.status(201).json(media);
    } catch (error) {
      await cloudinary.uploader.destroy(result.public_id, {
        resource_type: type,
      });
      throw error;
    }
  },
);
app.patch("/api/admin/media/:id", async (req: AuthRequest, res) => {
  const data = z
    .object({
      name: z.string().min(1).max(200),
      alt: z.string().min(2).max(300),
      folder: z.string().regex(/^[a-z0-9-]{1,80}$/),
    })
    .parse(req.body);
  res.json(
    await db.media.update({ where: { id: req.params.id as string }, data }),
  );
  await audit(req, "media.update", req.params.id as string);
});
app.delete("/api/admin/media/:id", async (req: AuthRequest, res) => {
  const media = await db.media.findUniqueOrThrow({
    where: { id: req.params.id as string },
    include: { _count: { select: { images: true } } },
  });
  const settings = await db.setting.findMany();
  if (media._count.images || JSON.stringify(settings).includes(media.url)) {
    res
      .status(409)
      .json({ error: "Replace references to this media before deleting it" });
    return;
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    res.status(503).json({ error: "Cloudinary is not configured" });
    return;
  }
  await cloudinary.uploader.destroy(media.publicId, {
    resource_type: media.type,
  });
  await db.media.delete({ where: { id: media.id } });
  await audit(req, "media.delete", media.id);
  res.json({ ok: true });
});
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "API endpoint not found" }),
);
export const errorHandler: express.ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "Invalid JSON request" });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Please check the submitted information",
      details: error.issues,
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res
      .status(
        error.code === "P2025"
          ? 404
          : error.code === "P2002" || error.code === "P2003"
            ? 409
            : 500,
      )
      .json({
        error:
          error.code === "P2025"
            ? "Record not found"
            : error.code === "P2002"
              ? "This record already exists"
              : error.code === "P2003"
                ? "This record is in use"
                : "Database request failed",
      });
    return;
  }
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: "Upload exceeds the allowed limits" });
    return;
  }
  console.error(error instanceof Error ? error.message : "Request failed");
  res
    .status(500)
    .json({ error: "The request could not be completed. Please try again." });
};
