import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.config.{js,mjs,ts}",
      ".agents/**",
      "api/_*", // generierte/gebündelte API-Artefakte
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Frontend (Browser + React)
  {
    files: ["web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  // Backend + shared (Node)
  {
    files: ["server/**/*.ts", "shared/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Vercel-Serverless-Funktion + Edge-Middleware (Node + Web-APIs)
  {
    files: ["api/**/*.ts", "middleware.ts"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  // Build-/Ops-Skripte (Node, inkl. fetch/AbortSignal aus Node 18+)
  {
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...globals.node, fetch: "readonly", AbortSignal: "readonly" },
    },
  },
);
