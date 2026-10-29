import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { staticContentPlugin } from "../scripts/static-content";
export default defineConfig({
  plugins: [react(), staticContentPlugin(process.cwd())],
  // Existing API workflow tests exercise the retained server client.
  define: { "import.meta.env.VITE_STANDALONE": JSON.stringify("false") },
  test: { environment: "jsdom", include: ["client/src/**/*.test.tsx"] },
});
