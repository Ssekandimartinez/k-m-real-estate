import { z } from "zod";
import sanitize from "sanitize-html";
export const kinds = [
  "property",
  "service",
  "product",
  "project",
  "post",
  "team",
  "testimonial",
] as const;
export const kindSchema = z.enum(kinds);
const safeUrl = z
  .string()
  .max(2000)
  .refine(
    (v) =>
      /^\/((images|branding|media)\/)\S+$/.test(v) || /^https:\/\//.test(v),
    "Use a local asset path or HTTPS URL",
  );
const nullableNumber = z.number().finite().nonnegative().nullable().optional();
export const entrySchema = z
  .object({
    kind: kindSchema,
    slug: z
      .string()
      .min(2)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(2).max(200),
    summary: z.string().max(1000).default(""),
    body: z
      .string()
      .max(100000)
      .transform((v) =>
        sanitize(v, {
          allowedTags: sanitize.defaults.allowedTags.concat([
            "h1",
            "h2",
            "img",
          ]),
          allowedAttributes: {
            ...sanitize.defaults.allowedAttributes,
            img: ["src", "alt", "width", "height"],
          },
          allowedSchemes: ["https", "mailto", "tel"],
        }),
      ),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    featured: z.boolean().default(false),
    verified: z.boolean().default(false),
    categoryId: z.string().nullable().optional(),
    location: z.string().max(300).default(""),
    price: nullableNumber,
    currency: z.enum(["USD", "SSP"]).default("USD"),
    transaction: z.enum(["SALE", "RENT"]).nullable().optional(),
    bedrooms: z.number().int().min(0).max(100).nullable().optional(),
    bathrooms: z.number().int().min(0).max(100).nullable().optional(),
    area: nullableNumber,
    amenities: z.array(z.string().max(100)).max(100).default([]),
    specs: z
      .record(
        z.string(),
        z.union([z.string().max(1000), z.number(), z.boolean(), z.null()]),
      )
      .default({}),
    seoTitle: z.string().max(200).default(""),
    seoDescription: z.string().max(350).default(""),
    images: z
      .array(
        z.object({
          url: safeUrl,
          alt: z.string().min(2).max(300),
          mediaId: z.string().nullable().optional(),
        }),
      )
      .max(30)
      .default([]),
  })
  .superRefine((v, ctx) => {
    if (
      v.kind === "testimonial" &&
      v.status === "PUBLISHED" &&
      !v.verified &&
      v.specs.sample !== true
    )
      ctx.addIssue({
        code: "custom",
        message: "Verify a testimonial before publishing",
        path: ["verified"],
      });
    if (
      v.kind === "property" &&
      v.status === "PUBLISHED" &&
      (!v.transaction || !v.location || !v.images.length)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Published properties require transaction, location and images",
      });
  });
export const requestSchema = z.object({
  kind: z.enum(["CONTACT", "PROPERTY", "VIEWING", "QUOTATION", "CONSULTATION"]),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().regex(/^[+\d ()-]{7,30}$/),
  location: z.string().max(300).default(""),
  service: z.string().max(200).default(""),
  message: z.string().trim().min(10).max(10000),
  quantities: z.string().max(5000).default(""),
  preferredDate: z.iso.datetime().nullable().optional(),
  entryId: z.string().nullable().optional(),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});
export const categorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(180),
  kind: kindSchema,
  description: z.string().max(2000).default(""),
  image: safeUrl.nullable().optional(),
});
export const passwordSchema = z.string().min(12).max(128);
export const settingsSchema = z.object({
  name: z.literal("K&M Real Estate"),
  tagline: z.string().min(2).max(200),
  phone: z.string().min(7).max(50),
  email: z.email(),
  address: z.string().min(5).max(500),
  overview: z.string().min(20).max(5000),
  mission: z.string().min(20).max(5000),
  vision: z.string().min(20).max(5000),
  heroTitle: z.string().min(5).max(200),
  heroDescription: z.string().min(20).max(2000),
  heroImage: safeUrl,
  logo: safeUrl,
  footer: z.string().max(1000),
  values: z
    .array(z.object({ title: z.string().max(100), text: z.string().max(1000) }))
    .max(12),
  socialLinks: z
    .array(
      z.object({
        label: z.string().max(50),
        url: z.url().refine((v) => v.startsWith("https://")),
      }),
    )
    .max(10),
  whatsappVerified: z.boolean(),
  whatsappNumber: z
    .string()
    .regex(/^\d{7,15}$/)
    .or(z.literal("")),
  seoDescription: z.string().max(350),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  featuredSections: z.array(
    z.enum(["properties", "projects", "posts", "testimonials"]),
  ),
  analyticsId: z
    .string()
    .regex(/^G-[A-Z0-9]+$/)
    .or(z.literal("")),
});
