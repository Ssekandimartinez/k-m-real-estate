import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
dotenv.config({ path: path.join(serverRoot, ".env"), quiet: true });
export const config = {
  production: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT || 4000),
  origin: process.env.APP_ORIGIN || "http://localhost:5173",
  siteUrl: process.env.SITE_URL || "http://localhost:4000",
};
if (
  config.production &&
  (!process.env.DATABASE_URL ||
    !process.env.APP_ORIGIN ||
    !process.env.SITE_URL?.startsWith("https://"))
)
  throw new Error(
    "Production requires DATABASE_URL, APP_ORIGIN and HTTPS SITE_URL",
  );
