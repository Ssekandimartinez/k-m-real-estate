import { readFileSync, accessSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { company, groups, slug } from "../server/prisma/approved-content";

export function staticContentPlugin(root: string): Plugin {
  return {
    name: "bundled-public-content",
    resolveId(id) {
      if (id === "virtual:km-content") return "\0virtual:km-content";
    },
    load(id) {
      if (id === "\0virtual:km-content")
        return `export default ${JSON.stringify(buildStaticContent(root))};`;
    },
  };
}

// Publish only the approved company catalogue and curated illustrative media.
// Development database records, customer information and demo inventory stay out.
export function buildStaticContent(root: string) {
  const text = readFileSync(
    path.join(root, "docs/MASTER_REQUIREMENTS.md"),
    "utf8",
  );
  const categories = groups.map((group) => ({
    id: `category-${slug(group.name)}`,
    kind: group.kind,
    slug: slug(group.name),
    name: group.name,
    description: group.intro,
    image: group.image,
  }));
  const entries: Record<string, any>[] = [];
  const used = new Set<string>();
  groups.forEach((group, index) => {
    const section =
      text
        .split(`## ${group.marker}`)[1]
        ?.split(
          index === 5
            ? "### SERVICE MANAGEMENT REQUIREMENT"
            : `## ${groups[index + 1]?.marker}`,
        )[0] || "";
    const catalogue =
      index === 2 ? section.split("Each item must support:")[0] : section;
    const names = [...catalogue.matchAll(/^(?:\d+\. |[-*] )([^\r\n]+)$/gm)].map(
      (match) => match[1],
    );
    if (index === 3) names.push("Relief Items");
    for (const name of new Set(names)) {
      const base = slug(name);
      const entrySlug = used.has(`${group.kind}:${base}`)
        ? `${slug(group.name)}-${base}`
        : base;
      used.add(`${group.kind}:${base}`);
      const supplyCategory =
        index === 3
          ? name === "Relief Items"
            ? name
            : [
                ...section
                  .slice(0, section.indexOf(name))
                  .matchAll(/^### ([^\r\n]+)$/gm),
              ].at(-1)?.[1] || group.name
          : group.name;
      const summary = [2, 3, 4].includes(index)
        ? `${name} sourcing for your project or organization. Request a quotation with your required specifications and quantities.`
        : `${name} tailored to your property or project. Speak with our team about your requirements and the right next step.`;
      entries.push({
        id: `${group.kind}-${entrySlug}`,
        kind: group.kind,
        slug: entrySlug,
        title: name,
        categoryId: categories[index].id,
        category: categories[index],
        summary,
        body: `<p>${summary}</p><p>${group.intro}</p><h2>How to get started</h2><p>Tell us what you need, where the work or delivery is required, and your preferred timeline. Contact our team to discuss specifications, quantities and the next steps. All quotations are subject to assessment and confirmation.</p>`,
        status: "PUBLISHED",
        featured: false,
        verified: false,
        images: [],
        specs: {
          group: group.name,
          ...(group.kind === "product" ? { supplyCategory } : {}),
        },
        location: "",
        currency: "USD",
        price: null,
        transaction: null,
        bedrooms: null,
        bathrooms: null,
        area: null,
        amenities: [],
        seoTitle: "",
        seoDescription: "",
        publishedAt: null,
        createdAt: null,
      });
    }
  });
  const library = JSON.parse(
    readFileSync(path.join(root, "docs/media-library.json"), "utf8"),
  );
  const { annotations } = JSON.parse(
    readFileSync(path.join(root, "docs/media-curation.json"), "utf8"),
  );
  const assets = library.assets.map((item: Record<string, any>) => {
    const asset = {
      ...item,
      ...annotations.find(
        (annotation: { id: string }) => annotation.id === item.id,
      ),
    };
    for (const url of [asset.url, asset.poster].filter(Boolean)) {
      accessSync(path.join(root, "client/public", url));
    }
    const { id, type, url, poster, alt, placement, category } = asset;
    return {
      id,
      type,
      url,
      ...(poster ? { poster } : {}),
      alt,
      placement,
      category,
    };
  });
  return { company, categories, entries, visualMedia: { assets } };
}
