import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  buildStaticContent,
  staticContentPlugin,
} from "../scripts/static-content";
const repository = fileURLToPath(new URL("..", import.meta.url));
export default defineConfig(({ mode }) => {
  const env = loadEnv(
    mode,
    fileURLToPath(new URL(".", import.meta.url)),
    "VITE_",
  );
  const standalone =
    (process.env.VITE_STANDALONE ?? env.VITE_STANDALONE) === "true";
  return {
    plugins: [
      react(),
      tailwindcss(),
      staticContentPlugin(repository),
      {
        name: "approved-static-content",
        transformIndexHtml() {
          return standalone
            ? []
            : ["/api/settings", "/api/visual-media"].map((href) => ({
                tag: "link",
                attrs: {
                  rel: "preload",
                  as: "fetch",
                  href,
                  crossorigin: "anonymous",
                },
                injectTo: "head" as const,
              }));
        },
        configureServer(server) {
          server.middlewares.use("/content/site.json", (_req, res) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(buildStaticContent(repository)));
          });
        },
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "content/site.json",
            source: JSON.stringify(buildStaticContent(repository)),
          });
        },
      },
    ],
    preview: { proxy: {} },
    server: {
      proxy: { "/api": "http://127.0.0.1:4000" },
    },
  };
});
