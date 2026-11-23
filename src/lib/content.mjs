/* =====================================================================
   Build-time content: published content from the database, laid over the
   built-in defaults (src/data/content.mjs).
   - Read once per build through the public RPC get_published_content()
     with the publishable key from public/js/config.js (no secret needed).
   - Database empty, unreachable or slow (> 8 s) → the defaults are used and
     the build continues; a note is printed in the build log.
   - CONTENT_OFFLINE=1 skips the database (repeatable test builds);
     CONTENT_JSON=file.json uses that file as the published content (tests, previews).
   ===================================================================== */
import fs from "node:fs";
import { DEFAULTS } from "../data/content.mjs";

const isObj = v => v && typeof v === "object" && !Array.isArray(v);

/* published values win; arrays are replaced whole (lists are edited as a whole) */
export function merge(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base) || Array.isArray(over)) return Array.isArray(over) ? over : base;
  if (isObj(base) && isObj(over)) {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = k in base ? merge(base[k], over[k]) : over[k];
    return out;
  }
  return typeof over === typeof base || base === undefined ? over : base;
}

function config() {
  try {
    const src = fs.readFileSync(new URL("../../public/js/config.js", import.meta.url), "utf8");
    const url = (src.match(/supabaseUrl:\s*"([^"]*)"/) || [])[1];
    const key = (src.match(/supabaseAnonKey:\s*"([^"]*)"/) || [])[1];
    return url && key ? { url, key } : null;
  } catch {
    return null;
  }
}

function build(pub, from) {
  const merged = {};
  for (const k of Object.keys(DEFAULTS)) merged[k] = merge(DEFAULTS[k], pub[k]);
  const empty = Object.values(pub).every(v => !v || (isObj(v) && !Object.keys(v).length));
  console.log(
    `[content] ${empty ? "nothing published yet — built-in content used" : `published content loaded (${from})`}`
  );
  return { ...merged, source: empty ? "defaults" : from };
}

let cached;
export async function getContent() {
  if (cached) return cached;
  cached = (async () => {
    const cfg = config();
    if (process.env.CONTENT_OFFLINE === "1" || (!cfg && !process.env.CONTENT_JSON))
      return { ...DEFAULTS, source: "defaults" };
    try {
      if (process.env.CONTENT_JSON) return build(JSON.parse(fs.readFileSync(process.env.CONTENT_JSON, "utf8")), "file");
      const res = await fetch(`${cfg.url}/rest/v1/rpc/get_published_content`, {
        method: "POST",
        headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return build((await res.json()) || {}, "database");
    } catch (e) {
      console.warn(`[content] database not reachable (${e.message}) — built-in content used`);
      return { ...DEFAULTS, source: "defaults" };
    }
  })();
  return cached;
}

/* page text for a language, falling back to English field by field */
export function pageText(content, lang = "en") {
  const en = content.pages.en;
  return lang === "en" ? en : merge(en, content.pages[lang] || {});
}

/* ---------- text → safe HTML ---------- */
const esc = s =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
/* _words_ → accent; headings use the serif italic, paragraphs the highlight */
export const heading = s =>
  esc(s)
    .replace(/_([^_]+)_/g, '<span class="serif">$1</span>')
    .replace(/\n/g, "<br>");
export const para = s =>
  esc(s)
    .replace(/_([^_]+)_/g, '<em class="hl">$1</em>')
    .replace(/\n/g, " ");
export const plain = s =>
  String(s ?? "")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\n/g, " ");

/* what the browser scripts need (contact, intro, protection, About facts, testimonials) */
export function siteData(content, lang = "en") {
  const c = content.site.contact || {};
  const wa = String(c.whatsapp || "").replace(/\D/g, "");
  return {
    email: c.email || DEFAULTS.site.contact.email,
    instagram: c.instagram || "#",
    whatsappNumber: wa,
    whatsapp: wa ? `https://wa.me/${wa}` : "#",
    intro: content.site.intro,
    protect: content.site.protect,
    about: content.site.about,
    testimonials: pageText(content, lang).testimonials || [],
  };
}
export const jsonForScript = v => JSON.stringify(v).replace(/</g, "\\u003c");
