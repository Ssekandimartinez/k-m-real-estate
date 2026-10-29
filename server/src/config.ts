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
// Vite binds to 127.0.0.1 locally, while users may open localhost.
// These aliases are allowed only in development and on the configured port.
export const allowedOrigins = new Set([config.origin]);
if (!config.production) {
  const origin = new URL(config.origin);
  if (["localhost", "127.0.0.1"].includes(origin.hostname)) {
    origin.hostname =
      origin.hostname === "localhost" ? "127.0.0.1" : "localhost";
    allowedOrigins.add(origin.origin);
  }
}
if (
  config.production &&
  (!process.env.DATABASE_URL ||
    !process.env.APP_ORIGIN ||
    !process.env.SITE_URL?.startsWith("https://"))
)
  throw new Error(
    "Production requires DATABASE_URL, APP_ORIGIN and HTTPS SITE_URL",
  );
