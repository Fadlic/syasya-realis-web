import type { APIRoute } from "astro";
/* robots.txt: everything public is crawlable; the admin board never is. The sitemap line appears once SITE_URL is set. */
export const GET: APIRoute = ({ site }) =>
  new Response(["User-agent: *", "Allow: /", "Disallow: /admin/", site ? `Sitemap: ${new URL("sitemap-index.xml", site).href}` : ""].filter(Boolean).join("\n") + "\n",
    { headers: { "Content-Type": "text/plain; charset=utf-8" } });
