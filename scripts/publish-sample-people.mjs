import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const root = fileURLToPath(new URL("../", import.meta.url));
dotenv.config({ path: path.join(root, "server/.env"), quiet: true });
const database = new URL(process.env.DATABASE_URL);
if (
  process.env.NODE_ENV === "production" ||
  !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)
)
  throw new Error("Publish sample people to the local preview database only.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Owner-requested fictional copy. Names are not identities of the people pictured.
const teams = [
  [
    "Daniel Lado",
    "Property Consultant",
    "1050464681829777440.jpg",
    "Helps turn a property brief into a focused search, with clear viewing arrangements and practical guidance on the next steps.",
  ],
  [
    "Grace Achieng",
    "Client Relations Coordinator",
    "1137862662109587730.jpg",
    "Keeps enquiries moving with thoughtful follow-ups, organised appointments and a clear point of contact throughout the process.",
  ],
  [
    "Samuel Deng",
    "Property Management Coordinator",
    "269019777730653853.jpg",
    "Coordinates property care, maintenance requests and communication between owners, occupants and service providers.",
  ],
  [
    "Michael Wani",
    "Construction & Supplies Coordinator",
    "304485624828434660.jpg",
    "Brings project requirements, materials enquiries and delivery planning together so each request has a clear scope and next step.",
  ],
  [
    "Esther Nyandeng",
    "Leasing Coordinator",
    "545498573634822386.jpg",
    "Helps households and businesses organise their leasing requirements, compare options and prepare for property viewings.",
  ],
];
const testimonials = [
  [
    "Mary Adut",
    "1048001775776347640.jpg",
    "I appreciated having someone listen to what mattered to our family. The viewing arrangements were straightforward, and we had time to ask questions before deciding on our next step.",
  ],
  [
    "Rose Akello",
    "1116611302513727907.jpg",
    "The conversation started with our needs and budget. Having the options explained in plain language made the whole property search feel more manageable.",
  ],
  [
    "Joseph Lokule",
    "436567757614067850.jpg",
    "It helped to have one point of contact for our property enquiries. We knew which details to prepare and what to expect at each stage of the discussion.",
  ],
  [
    "Agnes Ajak",
    "560346378649028814.jpg",
    "Our questions about maintenance and property care were handled patiently. I valued the clear communication and the attention given to the practical details.",
  ],
  [
    "Peter Ochan",
    "905786543809268461.jpg",
    "We came with a long list of requirements for our workspace. Breaking those into clear priorities helped us have a much more useful conversation about the options.",
  ],
];

async function main() {
  const folder = path.join(root, "client/public/images/people");
  await mkdir(folder, { recursive: true });
  const records = [];
  for (const [kind, rows] of [
    ["team", teams],
    ["testimonial", testimonials],
  ]) {
    for (const row of rows) {
      const [title, jobTitle, source, summary] =
        kind === "team" ? row : [row[0], "", row[1], row[2]];
      const slug = `sample-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      await sharp(path.join(root, "client/public/images", source))
        .rotate()
        .resize({ width: 640, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(folder, `${slug}.webp`));
      records.push({
        kind,
        slug,
        title,
        summary,
        body: `<p>Fictional sample ${kind === "team" ? "team profile" : "testimonial"}. The photograph is illustrative; this name and text do not identify or quote the person pictured.</p><p>${summary}</p>`,
        status: "PUBLISHED",
        featured: true,
        verified: false,
        specs: { sample: true, ...(jobTitle ? { jobTitle } : {}) },
        publishedAt: new Date(),
        images: {
          create: [
            {
              url: `/images/people/${slug}.webp`,
              alt: "Illustrative portrait for a fictional sample profile",
              position: 0,
            },
          ],
        },
      });
    }
  }
  await db.$transaction(async (tx) => {
    for (const data of records) {
      const where = { kind_slug: { kind: data.kind, slug: data.slug } };
      if (await tx.entry.findUnique({ where })) continue;
      await tx.entry.create({ data });
    }
  });
  const count = await db.entry.count({
    where: { status: "PUBLISHED", slug: { in: records.map((r) => r.slug) } },
  });
  if (count !== 10)
    throw new Error(`Expected 10 sample records, found ${count}`);
  console.log(
    "Published and verified 5 sample team profiles and 5 sample testimonials in the local database. Original images and existing entries preserved.",
  );
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
