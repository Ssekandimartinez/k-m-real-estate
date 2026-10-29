import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/db.js";
import { serverRoot } from "../src/config.js";
import { slug, company, groups } from "./approved-content.js";
import { buildStaticContent } from "../../scripts/static-content.js";
async function main() {
  // Validate the approved media and initialize only a fresh database's library.
  // Preserve any library already curated through the administration tools.
  const { visualMedia } = buildStaticContent(path.resolve(serverRoot, ".."));
  await db.setting.upsert({
    where: { key: "visual-media" },
    create: { key: "visual-media", value: visualMedia },
    update: {},
  });
  await db.setting.upsert({
    where: { key: "company" },
    create: { key: "company", value: company },
    update: {},
  });
  const text = await readFile(
    path.resolve(serverRoot, "../docs/MASTER_REQUIREMENTS.md"),
    "utf8",
  );
  const seededSlugs = new Set<string>();
  for (const [index, g] of groups.entries()) {
    const section =
      text
        .split(`## ${g.marker}`)[1]
        ?.split(
          index === 5
            ? "### SERVICE MANAGEMENT REQUIREMENT"
            : `## ${groups[index + 1]?.marker}`,
        )[0] || "";
    const cat = await db.category.upsert({
      where: { kind_slug: { kind: g.kind, slug: slug(g.name) } },
      create: {
        kind: g.kind,
        slug: slug(g.name),
        name: g.name,
        description: g.intro,
        image: g.image,
      },
      update: {},
    });
    const catalogueText =
      index === 2 ? section.split("Each item must support:")[0] : section;
    const names = [
      ...catalogueText.matchAll(/^(?:\d+\. |[-*] )([^\r\n]+)$/gm),
    ].map((v) => v[1]);
    if (index === 3) names.push("Relief Items");
    for (const name of [...new Set(names)]) {
      const baseSlug = slug(name);
      const entrySlug = seededSlugs.has(`${g.kind}:${baseSlug}`)
        ? `${slug(g.name)}-${baseSlug}`
        : baseSlug;
      seededSlugs.add(`${g.kind}:${baseSlug}`);
      const existing = await db.entry.findUnique({
        where: { kind_slug: { kind: g.kind, slug: entrySlug } },
      });
      const supplyCategory =
        index === 3
          ? name === "Relief Items"
            ? "Relief Items"
            : [
                ...section
                  .slice(0, section.indexOf(name))
                  .matchAll(/^### ([^\r\n]+)$/gm),
              ].at(-1)?.[1] || g.name
          : g.name;
      const summary =
        index === 2 || index === 3 || index === 4
          ? `${name} sourcing for your project or organization. Request a quotation with your required specifications and quantities.`
          : `${name} tailored to your property or project. Speak with our team about your requirements and the right next step.`;
      await db.entry.upsert({
        where: { kind_slug: { kind: g.kind, slug: entrySlug } },
        create: {
          kind: g.kind,
          slug: entrySlug,
          title: name,
          categoryId: cat.id,
          summary,
          body: `<p>${summary}</p><p>${g.intro}</p><h2>How to get started</h2><p>Tell us what you need, where the work or delivery is required, and your preferred timeline. We will review your requirements, clarify the scope and provide the next steps. Any technical assessments, documentation requirements and professional involvement will be agreed for your particular request.</p><h2>What to include in your request</h2><ul><li>Your location and contact information</li><li>Relevant dimensions, specifications or quantities</li><li>Preferred schedule and any access requirements</li></ul><p>All quotations are subject to assessment and confirmation. No specific availability, price, licensing status or outcome is implied.</p>`,
          status: "PUBLISHED",
          publishedAt: new Date(),
          images: {
            create: {
              url: g.image,
              alt: `Illustrative ${g.name.toLowerCase()} photograph`,
            },
          },
          specs: {
            group: g.name,
            ...(g.kind === "product" ? { supplyCategory } : {}),
          },
        },
        update:
          g.kind === "product" &&
          existing &&
          !(existing.specs as Record<string, unknown>).supplyCategory
            ? {
                specs: {
                  ...(existing.specs as Record<string, any>),
                  supplyCategory,
                },
              }
            : {},
      });
    }
  }
  const categories = {
    property: [
      "House",
      "Apartment",
      "Land & Plots",
      "Commercial",
      "Office Space",
    ],
    project: [
      "Residential Buildings",
      "Commercial Developments",
      "Architectural Design",
      "Interior Design",
      "Construction Projects",
      "Infrastructure Development",
      "Paving Projects",
    ],
    post: [
      "Real Estate in South Sudan",
      "Property Investment",
      "Buying and Renting",
      "Property Management",
      "Construction",
      "Architectural Design",
      "Building Materials",
      "Real Estate Consultancy",
    ],
    team: ["Our Team"],
    testimonial: ["Client Experiences"],
  };
  for (const [kind, names] of Object.entries(categories))
    for (const name of names)
      await db.category.upsert({
        where: { kind_slug: { kind, slug: slug(name) } },
        create: { kind, slug: slug(name), name },
        update: {},
      });
  console.log(
    "Company information, complete service and supply catalogue seeded. No properties, projects or testimonials were invented.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
