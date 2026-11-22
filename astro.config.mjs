// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static site: every page is built to plain HTML (dist/), ready for any static host.
export default defineConfig({
  // the live domain, e.g. SITE_URL=https://syasyarealis.com npm run build  → canonical, og:url, sitemap
  site: process.env.SITE_URL || undefined,
  integrations: process.env.SITE_URL ? [sitemap({ filter: page => !page.includes("/404") })] : [],
  output: "static",
  // keep the whitespace between tags exactly as in V4.4 (inline-block spacing depends on it)
  compressHTML: false,
  // /about → /about/index.html; links in the site use /about (no trailing slash)
  trailingSlash: "ignore",
  build: { format: "directory" },
});
