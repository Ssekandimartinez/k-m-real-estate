import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/db.js";
import { serverRoot } from "../src/config.js";
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const company = {
  name: "K&M Real Estate",
  tagline: "Real Estate. Real Results.",
  phone: "+211 924 265 999",
  email: "kmrealestate38@gmail.com",
  address: "Juba Town, opposite Gabat Primary School, Juba, South Sudan",
  overview:
    "K&M Real Estate is a full-service real estate solutions provider specializing in residential brokerage, commercial leasing, property management, and strategic property investments. We connect individuals, families, businesses and institutions with property, construction, design and supply solutions in South Sudan.",
  mission:
    "To deliver exceptional, data-driven real estate services that exceed client expectations. We provide transparent communication, rigorous property analysis, and top-tier marketing platforms to help buyers find their dream spaces and landlords secure high-performing tenants.",
  vision:
    "To be the most trusted and forward-thinking real estate partner in the region, recognized for executing seamless property journeys and building multi-generational wealth through real asset appreciation.",
  heroTitle: "Your Property. Our Expertise. Real Results.",
  heroDescription:
    "Professional real estate, construction, architectural design, consultancy, and supply solutions for individuals, businesses, and institutions in South Sudan.",
  heroImage: "/images/architecture.webp",
  logo: "/branding/logo.webp",
  footer:
    "A considered approach to property, construction and supply. Based in Juba. Focused on you.",
  values: [
    {
      title: "Integrity",
      text: "Honest advice, transparent communication and responsible property transactions.",
    },
    {
      title: "Excellence",
      text: "Thoughtful customer service supported by market knowledge and attention to detail.",
    },
    {
      title: "Collaboration",
      text: "Shared expertise and teamwork, from the first conversation to project delivery.",
    },
    {
      title: "Technology and Innovation",
      text: "Modern tools to make property services and communication easier.",
    },
  ],
  socialLinks: [],
  whatsappVerified: false,
  whatsappNumber: "",
  seoDescription:
    "K&M Real Estate provides property, construction, design, building materials and general supply services in Juba, South Sudan.",
  primaryColor: "#681F36",
  featuredSections: ["properties", "projects", "posts", "testimonials"],
  analyticsId: "",
};
const groups = [
  {
    marker: "CATEGORY A",
    name: "Real Estate & Property Services",
    kind: "service",
    image: "/images/consultancy.webp",
    intro:
      "From finding the right space to caring for an existing investment, we help you make informed property decisions. Tell us your objectives, location and timeline so we can agree the next steps.",
  },
  {
    marker: "CATEGORY B",
    name: "Construction & Design",
    kind: "service",
    image: "/images/construction.webp",
    intro:
      "Bring your building plans into focus with coordinated construction and design support. We discuss your brief, site conditions, budget and schedule before preparing an appropriate scope.",
  },
  {
    marker: "CATEGORY C",
    name: "Construction Materials",
    kind: "product",
    image: "/images/materials.webp",
    intro:
      "Source materials around your project requirements. Share specifications, quantities and delivery location for a tailored quotation. Prices and availability are confirmed individually.",
  },
  {
    marker: "CATEGORY D",
    name: "General Supplies & Procurement",
    kind: "product",
    image: "/images/supplies.webp",
    intro:
      "Procurement support for businesses, contractors, NGOs and institutions. Share your specification, quantity, delivery schedule and quality requirements for an itemized quotation.",
  },
  {
    marker: "CATEGORY E",
    name: "Electrical, Electronics & IT Solutions",
    kind: "product",
    image: "/images/electrical.webp",
    intro:
      "Electrical equipment, electronics and IT procurement shaped around your operational needs. Our team confirms technical specifications, compatibility, delivery and availability before quoting.",
  },
  {
    marker: "CATEGORY F",
    name: "Plumbing & Technical Services",
    kind: "service",
    image: "/images/plumbing.webp",
    intro:
      "Practical plumbing support for homes, workplaces and facilities. Describe the installation or fault, location and access requirements so we can assess the work and prepare a quotation.",
  },
];
async function main() {
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
