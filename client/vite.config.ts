import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { buildStaticContent } from "../scripts/static-content";
const repository = fileURLToPath(new URL("..", import.meta.url));
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "approved-static-content",
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
    proxy:
      loadEnv(mode, process.cwd()).VITE_STANDALONE === "true" ||
      process.env.VITE_STANDALONE === "true"
        ? undefined
        : {
            "/api": "http://127.0.0.1:4000",
            "/media": "http://127.0.0.1:4000",
          },
  },
}));
