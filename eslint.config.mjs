// The site scripts in public/js are classic browser scripts that share a few globals
// (settings defined in 01-settings.js, used by the others). They are listed here so a
// missing or misspelled name is still caught.
import js from "@eslint/js";
import globals from "globals";

const shared = {
  SITE: "readonly", WORK: "readonly", PHOTOS: "readonly", DESIGN: "readonly", ABOUT: "readonly",
  TESTIMONIALS: "readonly", PREVIEW_PLACEHOLDERS: "readonly", CLIENTS: "readonly", DISCIPLINES: "readonly",
  FRAME: "readonly", PREVIEW_SECONDS: "readonly", INTRO: "readonly", PROTECT: "readonly",
};

export default [
  { ignores: ["dist/", "node_modules/", ".astro/", "src/**/*.ts"] }, // TypeScript is checked by Astro
  js.configs.recommended,
  {
    files: ["public/js/**/*.js"],
    languageOptions: { ecmaVersion: 2024, sourceType: "script", globals: { ...globals.browser, ...shared } },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^(_|ABOUT|TESTIMONIALS|PREVIEW_PLACEHOLDERS|CLIENTS|DISCIPLINES|FRAME|PREVIEW_SECONDS|INTRO|PROTECT|SITE|WORK|PHOTOS|DESIGN)$" }],
      "no-redeclare": "off",
    },
  },
  {
    files: ["src/**/*.ts", "*.mjs", "tools/**/*.mjs"],
    languageOptions: { ecmaVersion: 2024, sourceType: "module", globals: { ...globals.browser, ...globals.node } },
  },
];
