import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  buildStaticContent,
  staticContentPlugin,
} from "../scripts/static-content";
const repository = fileURLToPath(new URL("..", import.meta.url));
export default defineConfig({
  // Public website content is always bundled; hosting environment settings
  // cannot reconnect it to an API or admin-managed database.
  define: { "import.meta.env.VITE_STANDALONE": JSON.stringify("true") },
  plugins: [
    react(),
    tailwindcss(),
    staticContentPlugin(repository),
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
});
