import { readFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const root = fileURLToPath(new URL("../", import.meta.url));
dotenv.config({ path: path.join(root, "server/.env"), quiet: true });
if (process.env.NODE_ENV === "production")
  throw Error("Local demo importer only.");
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(
    new URL(process.env.DATABASE_URL).hostname,
  )
)
  throw Error("Local database required.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
// Owner-authorised fictional local inventory; never verified company listings.
const rows = [
  [
    "Open Plan Business Office",
    "office-space",
    "RENT",
    1050,
    130,
    "pexels-babydov-7789604.jpg",
    "A flexible workspace for a small team with space for meetings and everyday administration.",
  ],
  [
    "Professional Team Workspace",
    "office-space",
    "RENT",
    1500,
    190,
    "pexels-jakubzerdzicki-20555791.jpg",
    "A team office arrangement with dedicated workstations and room for client discussions.",
  ],
  [
    "Client Reception Office Suite",
    "office-space",
    "RENT",
    750,
    90,
    "combined desk.jpg",
    "A compact office suite for client reception, focused work and daily business operations.",
  ],
  [
    "Glass Front Business Centre",
    "commercial",
    "RENT",
    2600,
    350,
    "pexels-cottonbro-4604701.jpg",
    "A commercial space suited to customer-facing business operations and flexible internal layouts.",
  ],
  [
    "Modern Commercial Building",
    "commercial",
    "SALE",
    420000,
    620,
    "coomercail building.webp",
    "A commercial building concept with space for business operations across a generous floor area.",
  ],
  [
    "Urban Enterprise Premises",
    "commercial",
    "RENT",
    1900,
    260,
    "pexels-dextarstudio-16140813.jpg",
    "Flexible premises for business use with space for reception, operations and storage.",
  ],
  [
    "Corporate Business Premises",
    "commercial",
    "SALE",
    350000,
    480,
    "pexels-punttim-5600669.jpg",
    "Business premises with scope for office and customer service layouts.",
  ],
  [
    "Neighbourhood Business Space",
    "commercial",
    "RENT",
    1350,
    180,
    "coomercail building.webp",
    "A manageable commercial space for a local business, showroom or service operation.",
  ],
  [
    "Residential Development Plot",
    "land-and-plots",
    "SALE",
    35000,
    500,
    "pexels-max-o-88958793-9494281.jpg",
    "A residential plot concept for planning a home with outdoor space.",
  ],
  [
    "Neighbourhood Building Plot",
    "land-and-plots",
    "SALE",
    48000,
    750,
    "pexels-seyhmus-yakut-114873224-19143956.jpg",
    "A building plot concept offering room for a residential layout and garden.",
  ],
  [
    "Family Home Land Parcel",
    "land-and-plots",
    "SALE",
    62000,
    1000,
    "pexels-quang-nguyen-vinh-222549-11669967.jpg",
    "A land parcel concept for a family residence with flexible site planning.",
  ],
  [
    "Mixed Use Development Land",
    "land-and-plots",
    "SALE",
    125000,
    2000,
    "pexels-cheikh-mbed-363896776-39865786.jpg",
    "A larger land parcel concept for exploring residential and business development options.",
  ],
  [
    "Spacious Residential Land",
    "land-and-plots",
    "SALE",
    89000,
    1500,
    "pexels-max-o-88958793-9494281.jpg",
    "A generous residential land concept with room for a home, landscaping and supporting spaces.",
  ],
];
async function main() {
  const entries = rows.map(
    ([title, category, transaction, price, area, source, summary], i) => ({
      title,
      category,
      transaction,
      price,
      area,
      source,
      summary,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      reference: `KM-D${String(20 + i).padStart(3, "0")}`,
    }),
  );
  for (const e of entries) await access(path.join(root, "images", e.source));
  const folder = path.join(root, "client/public/images/properties");
  await mkdir(folder, { recursive: true });
  for (const e of entries) {
    const target = path.join(folder, `${e.slug}.webp`);
    try {
      await access(target);
    } catch {
      await sharp(await readFile(path.join(root, "images", e.source)))
        .rotate()
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(target);
    }
  }
  const created = await db.$transaction(
    async (tx) => {
      let count = 0;
      for (const e of entries) {
        if (
          await tx.entry.findUnique({
            where: { kind_slug: { kind: "property", slug: e.slug } },
          })
        )
          continue;
        const category = await tx.category.findUniqueOrThrow({
          where: { kind_slug: { kind: "property", slug: e.category } },
        });
        await tx.entry.create({
          data: {
            kind: "property",
            slug: e.slug,
            title: e.title,
            summary: e.summary,
            body: `<p>${e.summary}</p><h2>Property overview</h2><p>Area: ${e.area} m2.</p><h2>Enquire</h2><p>Quote reference ${e.reference} when contacting the team.</p>`,
            status: "PUBLISHED",
            verified: false,
            categoryId: category.id,
            location: "Juba, South Sudan",
            price: e.price,
            currency: "USD",
            transaction: e.transaction,
            area: e.area,
            bedrooms: null,
            bathrooms: null,
            amenities: [],
            specs: {
              demo: true,
              reference: e.reference,
              sourceImage: e.source,
              ...(e.transaction === "RENT"
                ? { rentalPeriod: "Per month" }
                : {}),
            },
            publishedAt: new Date(),
            seoTitle: `${e.title} | K&M Real Estate`,
            seoDescription: e.summary,
            images: {
              create: {
                url: `/images/properties/${e.slug}.webp`,
                alt: e.title,
                position: 0,
              },
            },
          },
        });
        count++;
      }
      return count;
    },
    { timeout: 30000 },
  );
  console.log(`Created ${created} local demo properties.`);
  const categories = await db.category.findMany({
    where: { kind: "property" },
  });
  for (const c of categories) {
    const count = await db.entry.count({
      where: { kind: "property", status: "PUBLISHED", categoryId: c.id },
    });
    console.log(`${c.name}: ${count}`);
    if (count < 5) throw Error(`Category below target: ${c.name}`);
  }
  for (const e of entries) {
    const item = await db.entry.findUniqueOrThrow({
      where: { kind_slug: { kind: "property", slug: e.slug } },
      include: { images: true },
    });
    if (item.verified || item.specs.demo !== true || !item.images.length)
      throw Error("Demo validation failed");
  }
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
