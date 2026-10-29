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
  throw new Error("Demo inventory must be imported into a local database.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// Owner-authorised continuation of the local demo inventory, not real company work.
const properties = [
  {
    title: "Shaded Garden Bungalow",
    category: "House",
    source: "properyt 5.webp",
    transaction: "SALE",
    price: 165000,
    bedrooms: 3,
    bathrooms: 2,
    area: 220,
    summary:
      "A single-level family home with a shaded garden, paved approach and covered entrance.",
    amenities: ["Garden", "Paved driveway", "Covered entrance"],
    reference: "KM-D016",
  },
  {
    title: "Hillside Compound Residence",
    category: "House",
    source: "properyt 7.webp",
    transaction: "RENT",
    price: 1600,
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    summary:
      "A two-storey residence with a generous paved compound and room for a larger household.",
    amenities: ["Private compound", "Parking", "Two-storey layout"],
    reference: "KM-D017",
  },
  {
    title: "Contemporary Balcony Apartment",
    category: "Apartment",
    source: "properyt 8.webp",
    transaction: "RENT",
    price: 900,
    bedrooms: 2,
    bathrooms: 2,
    area: 115,
    summary:
      "A contemporary apartment with a private balcony and a practical two-bedroom arrangement.",
    amenities: ["Balcony", "Open-plan living", "Parking"],
    reference: "KM-D018",
  },
  {
    title: "Landscaped Court Apartment",
    category: "Apartment",
    source: "prpoperyt 10.webp",
    transaction: "SALE",
    price: 98000,
    bedrooms: 3,
    bathrooms: 2,
    area: 135,
    summary:
      "A three-bedroom apartment in a landscaped residential setting with space for everyday family living.",
    amenities: ["Shared garden", "Dining area", "Storage"],
    reference: "KM-D019",
  },
];

const projects = [
  {
    title: "Courtyard Residence Design",
    category: "Residential Buildings",
    sources: [
      "pexels-expect-best-79873-323780.jpg",
      "pexels-artbovich-7546707.jpg",
    ],
    summary:
      "A residential concept connecting a welcoming entrance, flexible family rooms and an outdoor courtyard.",
    services:
      "Residential planning, architectural design, interior coordination",
    focus:
      "Organise reception rooms around everyday circulation and a shared outdoor space.",
    scope: [
      "Arrival and entrance layout",
      "Living and dining relationships",
      "Courtyard connections",
    ],
  },
  {
    title: "Urban Apartment Development",
    category: "Commercial Developments",
    sources: ["properyt 8.webp", "apartment.jpg"],
    summary:
      "An apartment development concept exploring repeatable home layouts, balconies and shared circulation.",
    services:
      "Development planning, architectural design, common-area planning",
    focus:
      "Balance private living spaces with legible shared access and practical building circulation.",
    scope: [
      "Apartment arrangement studies",
      "Balcony and facade treatment",
      "Shared access planning",
    ],
  },
  {
    title: "Contemporary Living Room Interior",
    category: "Interior Design",
    sources: ["pexels-artbovich-7546707.jpg", "pexels-artbovich-8135112.jpg"],
    summary:
      "A living room design concept centred on comfortable seating, coordinated finishes and a clear furniture layout.",
    services: "Interior design, furniture planning, finishes selection",
    focus:
      "Create a coherent room arrangement with comfortable conversation areas and space to move.",
    scope: [
      "Furniture layout options",
      "Colour and finish palette",
      "Lighting and accessory brief",
    ],
  },
  {
    title: "Dining and Kitchen Design Study",
    category: "Interior Design",
    sources: ["pexels-artbovich-8082211.jpg", "pexels-artbovich-7546707.jpg"],
    summary:
      "An interior concept exploring the relationship between dining, entertaining and adjacent family spaces.",
    services: "Space planning, interior design, furnishings coordination",
    focus:
      "Plan an inviting dining setting while keeping movement between adjoining spaces straightforward.",
    scope: [
      "Dining furniture arrangement",
      "Material coordination",
      "Connections to adjoining rooms",
    ],
  },
  {
    title: "Bathroom Refurbishment Concept",
    category: "Interior Design",
    sources: ["pexels-artbovich-6908568.jpg", "Plumbing installation.jpg"],
    summary:
      "A bathroom refurbishment concept combining a clear fixture layout with coordinated surfaces and storage.",
    services: "Bathroom design, finishes planning, plumbing coordination",
    focus:
      "Develop a usable bathroom arrangement and a coordinated brief for the relevant technical specialists.",
    scope: [
      "Fixture arrangement",
      "Surface finish palette",
      "Storage and technical coordination",
    ],
  },
  {
    title: "Residential Build Planning",
    category: "Construction Projects",
    sources: [
      "pexels-d-goug-211350543-40017694.jpg",
      "pexels-gustavo-fring-6285150.jpg",
    ],
    summary:
      "A construction planning concept bringing residential drawings, site activities and work sequencing into one brief.",
    services: "Construction planning, scope coordination, materials scheduling",
    focus:
      "Describe a structured approach to moving from design information to an organised construction scope.",
    scope: [
      "Scope and drawing review",
      "Work package sequencing",
      "Materials and access planning",
    ],
  },
  {
    title: "Commercial Structure Planning",
    category: "Commercial Developments",
    sources: [
      "pexels-davidelocatelli-2383649.jpg",
      "Steel Construction Materials.jpg",
    ],
    summary:
      "A commercial building concept focused on coordinating structural work, material needs and future workspace use.",
    services:
      "Commercial planning, construction coordination, supply scheduling",
    focus:
      "Connect the intended use of a commercial building with a coordinated design and construction brief.",
    scope: [
      "Workspace requirements brief",
      "Structural work coordination",
      "Material delivery sequencing",
    ],
  },
  {
    title: "Architectural Brief and Design Study",
    category: "Architectural Design",
    sources: [
      "pexels-gustavo-fring-6285150.jpg",
      "pexels-expect-best-79873-323780.jpg",
    ],
    summary:
      "An architectural study translating a client's space requirements into a clear design direction and review process.",
    services: "Architectural briefing, concept design, drawing coordination",
    focus:
      "Establish the intended use, spatial priorities and design questions before developing detailed proposals.",
    scope: [
      "Client requirements schedule",
      "Layout and massing studies",
      "Design review milestones",
    ],
  },
  {
    title: "Garden Compound and Access Design",
    category: "Paving Projects",
    sources: ["properyt 5.webp", "property 1.jpg"],
    summary:
      "An external works concept combining a paved approach, garden areas and a welcoming residential entrance.",
    services: "External layout design, paving planning, landscape coordination",
    focus:
      "Explore the relationship between arrival, parking, pedestrian movement and planted outdoor areas.",
    scope: [
      "Driveway and footpath arrangement",
      "Entrance and garden relationships",
      "External materials palette",
    ],
  },
  {
    title: "Residential Community Layout",
    category: "Residential Buildings",
    sources: ["prpoperyt 10.webp", "apartment.jpg"],
    summary:
      "A residential community concept balancing individual homes, shared outdoor spaces and clear circulation routes.",
    services:
      "Residential layout planning, landscape coordination, development briefing",
    focus:
      "Arrange residential buildings and shared spaces around useful connections and everyday community activities.",
    scope: [
      "Building arrangement studies",
      "Shared outdoor space planning",
      "Access and circulation brief",
    ],
  },
];

async function main() {
  if (properties.length !== 4 || projects.length !== 10)
    throw new Error("Expected four additional properties and ten projects.");
  const entries = [
    ...properties.map((property) => ({
      category: property.category,
      sources: [property.source],
      data: {
        kind: "property",
        slug: slugify(property.title),
        title: property.title,
        summary: property.summary,
        location: "Juba, South Sudan",
        price: property.price,
        currency: "USD",
        transaction: property.transaction,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        amenities: property.amenities,
        body: `<p>${property.summary}</p><h2>Property overview</h2><p>${property.area} m² of space with ${property.bedrooms} bedrooms and ${property.bathrooms} bathrooms.</p><h2>Features</h2><ul>${property.amenities.map((item) => `<li>${item}</li>`).join("")}</ul><h2>Arrange a viewing</h2><p>Contact K&amp;M Real Estate using the inquiry form and quote reference ${property.reference}.</p>`,
        specs: {
          demo: true,
          sourceImage: property.source,
          reference: property.reference,
          ...(property.transaction === "RENT"
            ? { rentalPeriod: "Per month" }
            : {}),
        },
      },
    })),
    ...projects.map((project, index) => ({
      category: project.category,
      sources: project.sources,
      data: {
        kind: "project",
        slug: slugify(project.title),
        title: project.title,
        summary: project.summary,
        body: `<p>${project.summary}</p><h2>Design direction</h2><p>${project.focus}</p><h2>Proposed scope</h2><ul>${project.scope.map((item) => `<li>${item}</li>`).join("")}</ul><h2>Planning approach</h2><p>The concept starts with a clear brief, review of the intended use and coordinated layout options. Detailed scope, specifications and delivery arrangements would be developed around the requirements of an individual commission.</p><h2>Discuss a similar brief</h2><p>Contact K&amp;M Real Estate to discuss your requirements for ${project.services.toLowerCase()}. Quote reference KM-P${String(index + 1).padStart(3, "0")}.</p>`,
        specs: {
          demo: true,
          reference: `KM-P${String(index + 1).padStart(3, "0")}`,
          projectStatus: "Concept design",
          servicesProvided: project.services,
        },
        featured: index < 3,
      },
    })),
  ];
  // Validate all sources before creating images or database records.
  const sources = new Map();
  for (const entry of entries)
    for (const source of entry.sources)
      if (!sources.has(source))
        sources.set(source, await readFile(path.join(root, "images", source)));
  for (const entry of entries) {
    const folder = entry.data.kind === "property" ? "properties" : "projects";
    await mkdir(path.join(root, "client/public/images", folder), {
      recursive: true,
    });
    entry.images = [];
    for (const [position, source] of entry.sources.entries()) {
      const filename = `${entry.data.slug}-${position + 1}.webp`;
      await sharp(sources.get(source))
        .rotate()
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(root, "client/public/images", folder, filename));
      entry.images.push({
        url: `/images/${folder}/${filename}`,
        alt: `${entry.data.title} — ${position === 0 ? "overview" : "design detail"}`,
        position,
      });
    }
  }
  const created = await db.$transaction(
    async (tx) => {
      const counts = { property: 0, project: 0 };
      for (const entry of entries) {
        const where = {
          kind_slug: { kind: entry.data.kind, slug: entry.data.slug },
        };
        if (await tx.entry.findUnique({ where })) continue;
        const category = await tx.category.upsert({
          where: {
            kind_slug: { kind: entry.data.kind, slug: slugify(entry.category) },
          },
          create: {
            kind: entry.data.kind,
            slug: slugify(entry.category),
            name: entry.category,
          },
          update: {},
        });
        await tx.entry.create({
          data: {
            ...entry.data,
            status: "PUBLISHED",
            verified: false,
            categoryId: category.id,
            publishedAt: new Date(),
            seoTitle: `${entry.data.title} | K&M Real Estate`,
            seoDescription: entry.data.summary,
            images: { create: entry.images },
          },
        });
        counts[entry.data.kind]++;
      }
      return counts;
    },
    { timeout: 30000 },
  );
  console.log(
    `Published ${created.property} additional demo properties and ${created.project} demo projects; existing records preserved.`,
  );
  for (const kind of ["property", "project"])
    console.log(
      `${kind}: ${await db.entry.count({ where: { kind, status: "PUBLISHED" } })} published records in the database.`,
    );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
