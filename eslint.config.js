import js from "@eslint/js";
import ts from "typescript-eslint";
export default ts.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "client/public/**", ".local/**", "test-results/**", "playwright-report/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        fetch: "readonly",
        document: "readonly",
        window: "readonly",
        FormData: "readonly",
        File: "readonly",
        location: "readonly",
        URLSearchParams: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        RequestInit: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
