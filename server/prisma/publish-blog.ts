import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { db } from "../src/db.js";
import { entrySchema } from "../src/validation.js";

const articleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: z.string(),
  image: z.string(),
  summary: z.string(),
  sections: z.array(z.tuple([z.string(), z.string()])).min(4),
});
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]!,
  );

async function main() {
  const articles = z
    .array(articleSchema)
    .length(10)
    .parse(
      JSON.parse(
        await readFile(
          new URL("./blog-articles.json", import.meta.url),
          "utf8",
        ),
      ),
    );
  if (new Set(articles.map((article) => article.slug)).size !== 10)
    throw new Error("Article slugs must be unique");
  const entries = articles.map((article) => ({
    article,
    data: entrySchema.parse({
      kind: "post",
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      status: "PUBLISHED",
      seoTitle: `${article.title} | K&M Real Estate`,
      seoDescription: article.summary,
      body:
        `<p>${escapeHtml(article.summary)}</p>` +
        article.sections
          .map(
            ([heading, paragraph]) =>
              `<h2>${escapeHtml(heading)}</h2><p>${escapeHtml(paragraph)}</p>`,
          )
          .join(""),
      images: [
        {
          url: `/images/${article.image}`,
          alt: `Illustrative image for: ${article.title}`,
        },
      ],
    }),
  }));
  for (const { article } of entries)
    await access(path.resolve("client/public/images", article.image));
  const created = await db.$transaction(
    async (tx) => {
      let count = 0;
      for (const { article, data } of entries) {
        const where = { kind_slug: { kind: "post", slug: data.slug } };
        if (await tx.entry.findUnique({ where })) continue;
        const category = await tx.category.upsert({
          where: {
            kind_slug: {
              kind: "post",
              slug: article.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            },
          },
          create: {
            kind: "post",
            slug: article.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: article.category,
          },
          update: {},
        });
        const { images, ...fields } = data;
        await tx.entry.create({
          data: {
            ...fields,
            categoryId: category.id,
            publishedAt: new Date(),
            images: {
              create: images.map((image, position) => ({ ...image, position })),
            },
          },
        });
        count++;
      }
      return count;
    },
    { timeout: 30000 },
  );
  console.log(
    `Published ${created} new articles; existing articles preserved.`,
  );
  console.log(
    `Verified ${await db.entry.count({ where: { kind: "post", status: "PUBLISHED", slug: { in: articles.map((article) => article.slug) } } })}/10 articles published in the database.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
