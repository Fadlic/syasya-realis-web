// @ts-check
import { defineConfig } from "astro/config";

// Static site: every page is built to plain HTML (dist/), ready for any static host.
export default defineConfig({
  output: "static",
  // keep the whitespace between tags exactly as in V4.4 (inline-block spacing depends on it)
  compressHTML: false,
  // /about → /about/index.html; links in the site use /about (no trailing slash)
  trailingSlash: "ignore",
  build: { format: "directory" },
});
