/* =====================================================================
   Languages of the site. English is the main language at "/"; the others
   live under "/<code>/" (e.g. /id/about). Interface text comes from the
   files in this folder; page text the studio edits comes from the content
   (admin → Content → Page text), with these drafts as the defaults.
   The non-English text is a DRAFT translation by Claude: a native speaker
   should check it before the site goes live.
   ===================================================================== */
import { ui as en } from "./en.mjs";
import * as id from "./id.mjs";
import * as ms from "./ms.mjs";

export const LANG_LIST = [
  { code: "en", name: "English", short: "EN", hreflang: "en" },
  { code: "id", name: "Bahasa Indonesia", short: "ID", hreflang: "id" },
  { code: "ms", name: "Bahasa Melayu", short: "MS", hreflang: "ms" },
];
export const OTHER_LANGS = LANG_LIST.filter(l => l.code !== "en").map(l => l.code);
const UI = { id: id.ui, ms: ms.ui };
export const PAGE_DRAFTS = { id: id.pages, ms: ms.pages };

const isObj = v => v && typeof v === "object" && !Array.isArray(v);
function fill(base, over) {
  if (!isObj(base) || !isObj(over)) return over === undefined || over === "" ? base : over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = fill(base[k], over[k]);
  return out;
}
/* interface text for a language; a key the language lacks uses the English text */
export const t = lang => (lang === "en" || !UI[lang] ? en : fill(en, UI[lang]));
export const langInfo = lang => LANG_LIST.find(l => l.code === lang) || LANG_LIST[0];

/* "/about" → "/id/about"; "/#work" → "/id/#work"; "/" → "/id/" */
export function href(lang, path = "/") {
  if (lang === "en") return path;
  if (path === "/" || path.startsWith("/#")) return `/${lang}/${path.slice(1)}`;
  return `/${lang}${path}`;
}
/* the same page in every language, for hreflang and the switcher */
export function alternates(path) {
  return LANG_LIST.map(l => ({ ...l, url: href(l.code, path) }));
}
