import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Application de facturation (projet séparé, voir facturation/README.md)
    "facturation/**",
    // Fichiers générés par Payload
    "src/payload-types.ts",
    "src/migrations/**",
    "src/app/(payload)/admin/importMap.js",
  ]),
]);

export default eslintConfig;
