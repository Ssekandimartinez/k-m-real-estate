import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const root = fileURLToPath(new URL("../", import.meta.url));
dotenv.config({ path: path.join(root, "server/.env"), quiet: true });
if (process.env.NODE_ENV === "production")
  throw new Error(
    "This importer is for the local demonstration database only.",
  );
const database = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname))
  throw new Error("Demo properties must be imported into a local database.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Explicitly authorised demo inventory. These details are fictional, not verified listings.
// Keep this separate from the normal company seed and preserve existing entries.
const properties = [
  [
    "Courtyard Family Home",
    "House",
    "RENT",
    950,
    3,
    2,
    180,
    "property 1.jpg",
    "A welcoming family layout with separate living and dining spaces and room for everyday outdoor use.",
    ["Private courtyard", "Parking", "Separate dining area"],
  ],
  [
    "Contemporary Garden Residence",
    "House",
    "SALE",
    185000,
    4,
    3,
    260,
    "property 2.jpg",
    "A spacious residence pairing generous living areas with a garden setting and flexible family accommodation.",
    ["Garden", "Parking", "Guest room"],
  ],
  [
    "Spacious Four-Bedroom Villa",
    "House",
    "RENT",
    1800,
    4,
    3,
    280,
    "property 3.webp",
    "A four-bedroom layout with space for family living, hosting visitors and working from home.",
    ["Home office space", "Parking", "Outdoor seating area"],
  ],
  [
    "Elegant Three-Bedroom Home",
    "House",
    "SALE",
    145000,
    3,
    2,
    210,
    "property 4.webp",
    "A balanced residential layout with three bedrooms, comfortable reception spaces and practical storage.",
    ["Storage", "Parking", "Separate kitchen"],
  ],
  [
    "Private Compound Residence",
    "House",
    "RENT",
    1400,
    4,
    3,
    250,
    "property 6.jpg",
    "A family residence with a private compound arrangement and distinct spaces for relaxing and entertaining.",
    ["Private compound", "Guest room", "Parking"],
  ],
  [
    "Bright Two-Bedroom Bungalow",
    "House",
    "RENT",
    700,
    2,
    2,
    130,
    "property 6.webp",
    "A manageable single-level layout with two bedrooms and an easy connection between living and dining areas.",
    ["Single-level layout", "Dining area", "Parking"],
  ],
  [
    "Generous Five-Bedroom Residence",
    "House",
    "SALE",
    290000,
    5,
    4,
    360,
    "property 9.webp",
    "A substantial home with flexible accommodation for a larger household and dedicated spaces for visitors.",
    ["Guest accommodation", "Storage", "Parking"],
  ],
  [
    "Modern Family Retreat",
    "House",
    "SALE",
    210000,
    4,
    3,
    290,
    "property5.webp",
    "A four-bedroom home combining everyday family spaces with room for a study and outdoor relaxation.",
    ["Study", "Outdoor seating area", "Parking"],
  ],
  [
    "Garden Court Apartment",
    "Apartment",
    "RENT",
    650,
    2,
    2,
    95,
    "apartment.jpg",
    "A two-bedroom apartment with a practical living area and a layout suited to sharing or a small household.",
    ["Balcony", "Shared outdoor space", "Parking"],
  ],
  [
    "City Living Apartment",
    "Apartment",
    "RENT",
    450,
    1,
    1,
    60,
    "apartment.webp",
    "A compact one-bedroom layout with space to unwind, prepare meals and organise daily essentials.",
    ["Open-plan living", "Storage", "Fitted kitchen"],
  ],
  [
    "Three-Bedroom Apartment Residence",
    "Apartment",
    "SALE",
    115000,
    3,
    2,
    140,
    "apartment 4.jpg",
    "A three-bedroom apartment offering room for family life and a separate space for guests or a home study.",
    ["Balcony", "Guest room", "Dining area"],
  ],
  [
    "Light-Filled Two-Bedroom Apartment",
    "Apartment",
    "SALE",
    82000,
    2,
    2,
    100,
    "propery7.webp",
    "A two-bedroom apartment with comfortable reception space and a practical arrangement for daily living.",
    ["Living area", "Storage", "Parking"],
  ],
  [
    "Executive Apartment Suite",
    "Apartment",
    "RENT",
    1100,
    3,
    2,
    150,
    "properyt 11.jpg",
    "A generous apartment layout with three bedrooms and space to combine home life with a dedicated work area.",
    ["Work area", "Dining area", "Storage"],
  ],
  [
    "Flexible Team Office",
    "Office Space",
    "RENT",
    1200,
    null,
    2,
    160,
    "combined desk.jpg",
    "A workspace arranged around team desks, visitor reception and a separate area for focused conversations.",
    ["Reception area", "Meeting room", "Storage"],
  ],
  [
    "Business Workspace Suite",
    "Office Space",
    "RENT",
    850,
    null,
    1,
    110,
    "Office desk and chair @11,000_ Delivery available….jpg",
    "A compact office suite with room for a small team, client meetings and day-to-day administration.",
    ["Meeting area", "Team workspace", "Storage"],
  ],
];

async function main() {
  if (properties.length !== 15)
    throw new Error("Expected exactly 15 demo properties");
  // Resolve every original before writing records. Original assets are never modified.
  const sources = await Promise.all(
    properties.map(async (property) => {
      const source = path.join(root, "images", property[7]);
      return readFile(source);
    }),
  );
  await mkdir(path.join(root, "client/public/images/properties"), {
    recursive: true,
  });
  const entries = [];
  for (const [index, property] of properties.entries()) {
    const [
      title,
      category,
      transaction,
      price,
      bedrooms,
      bathrooms,
      area,
      ,
      summary,
      amenities,
    ] = property;
    const reference = `KM-D${String(index + 1).padStart(3, "0")}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `${slug}.webp`;
    await sharp(sources[index])
      .rotate()
      .resize({ width: 1400, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(root, "client/public/images/properties", filename));
    entries.push({
      category,
      image: { url: `/images/properties/${filename}`, alt: title, position: 0 },
      data: {
        kind: "property",
        slug,
        title,
        summary,
        status: "PUBLISHED",
        verified: false,
        featured: [1, 2, 8, 10, 13, 14].includes(index),
        location: "Juba, South Sudan",
        transaction,
        price,
        currency: "USD",
        bedrooms,
        bathrooms,
        area,
        amenities,
        body: `<p>${summary}</p><h2>Property overview</h2><p>${area} m² of space with ${bathrooms} bathroom${bathrooms === 1 ? "" : "s"}${bedrooms ? ` and ${bedrooms} bedrooms` : ""}.</p><h2>Features</h2><ul>${amenities.map((item) => `<li>${item}</li>`).join("")}</ul><h2>Arrange a viewing</h2><p>Use the inquiry form to discuss this property with K&amp;M Real Estate. Please quote reference ${reference} when contacting our team.</p>`,
        specs: {
          demo: true,
          reference,
          ...(transaction === "RENT" ? { rentalPeriod: "Per month" } : {}),
        },
        seoTitle: `${title} | K&M Real Estate`,
        seoDescription: summary,
        publishedAt: new Date(),
      },
    });
  }
  const created = await db.$transaction(
    async (tx) => {
      let count = 0;
      for (const entry of entries) {
        const where = {
          kind_slug: { kind: "property", slug: entry.data.slug },
        };
        if (await tx.entry.findUnique({ where })) continue;
        const slug = entry.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const category = await tx.category.upsert({
          where: { kind_slug: { kind: "property", slug } },
          create: { kind: "property", slug, name: entry.category },
          update: {},
        });
        await tx.entry.create({
          data: {
            ...entry.data,
            categoryId: category.id,
            images: { create: [entry.image] },
          },
        });
        count++;
      }
      return count;
    },
    { timeout: 30000 },
  );
  const count = await db.entry.count({
    where: {
      kind: "property",
      status: "PUBLISHED",
      slug: { in: entries.map((entry) => entry.data.slug) },
    },
  });
  console.log(
    `Published ${created} new demo properties. Verified ${count}/15 published; existing records preserved.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
