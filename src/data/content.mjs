/* =====================================================================
   CONTENT — what the admin "Content" panel edits.
   These are the BUILT-IN values (the website as it is today). At build time
   src/lib/content.mjs reads the PUBLISHED content from the database and lays
   it over these, field by field: anything not published yet keeps the value
   below, so the site never breaks when the database is empty or unreachable.

   Text conventions (kept simple so non-developers can edit them):
     _words_   → the accent style of that spot (italic serif in headings,
                 highlighted italic in paragraphs)
     new line  → line break (headings only)
   Page text is stored per language: pages.en, pages.id, pages.ms. English is
   the main language at "/"; Indonesian and Malay are at /id/ and /ms/.
   ===================================================================== */
import { WORK, PHOTOS, DESIGN } from "./archive.mjs";
import { PAGE_DRAFTS } from "../i18n/index.mjs";

export const LANGS = [
  { code: "en", name: "English", dir: "ltr", main: true },
  { code: "id", name: "Bahasa Indonesia", dir: "ltr" },
  { code: "ms", name: "Bahasa Melayu", dir: "ltr" },
];

export const DEFAULTS = {
  /* ---------- site settings ---------- */
  site: {
    contact: {
      email: "hello@studio.com",
      instagram: "", // full link, e.g. https://instagram.com/syasyarealis
      whatsapp: "", // number with country code, digits only, e.g. 6281234567890
    },
    intro: { enabled: true, clipSeconds: 3.2 },
    protect: { enabled: true, watermark: true },
    about: { based: "", founded: "", team: "" }, // empty = row hidden on About
  },

  /* ---------- page text, per language ---------- */
  pages: {
    en: {
      home: {
        headline1: "Visual Narratives",
        headline2: "& _Moving_ Art",
        quote:
          "A visual practice in reality, rhythm, and refined expression. Where the authenticity of a moment meets the intention of an artist. An independent creative practice devoted to _imagery that lingers._",
        archiveHeading: "Featured _archive._",
        archiveIntro: "A curated collection of _moments, movement, and visual explorations._",
        stillsHeading: "Frames that _sell._",
        stillsIntro:
          "Product, fashion, portrait and event photography — _lit, shot and retouched_ for campaigns and catalogues.",
        designHeading: "Design that _speaks._",
        designIntro:
          "Brand identity, social media kits, posters, brochures and campaign key visuals — _designed to match the films and photos we produce._",
        manifesto: "Reality gives us the moment; _imagination_ gives it meaning.",
        aboutHeading: "Meet _Syasya Ahmad._",
        aboutP1:
          "Founded by Syasya Ahmad, Syasya&Realis is an independent multidisciplinary creative studio exploring the intersection of _photography, film, montage, and graphic design._",
        aboutP2:
          "Guided by an instinct for composition, atmosphere, and narrative, Syasya transforms everyday realities into _considered visual expressions_ that balance authenticity with artistic intention.",
        servicesHeading: "Four disciplines. _One visual philosophy._",
        services: [
          {
            title: "Photography",
            text: "An intimate study of light, form, and fleeting moments, captured with honesty and a deliberate editorial eye.",
          },
          {
            title: "Videography",
            text: "Cinematic storytelling through purposeful movement, atmosphere, and rhythm, bringing real moments into lasting motion.",
          },
          {
            title: "Montage Design",
            text: "Imagery, sound and timing cut to one rhythm, turning separate clips into a single emotional story.",
          },
          {
            title: "Graphic Design",
            text: "Distinctive visual compositions where typography, colour, and form converge to communicate with clarity and character.",
          },
        ],
        processHeading: "From brief to _delivery._",
        steps: [
          { title: "Project Kickoff & Brief", points: ["Align on goals & audience", "Lock scope, budget & timeline"] },
          { title: "Research & Direction", points: ["Competitor & brand audit", "Visual moodboards & direction"] },
          {
            title: "Concepting & Production",
            points: ["Develop core creative routes", "Design & build primary assets"],
          },
          {
            title: "Presentation & Revisions",
            points: ["Present in realistic context", "Structured feedback & revisions"],
          },
          { title: "Approval & Delivery", points: ["Formal written sign-off", "Organized final file handoff"] },
        ],
        contactHeading: "Let's create\nsomething _iconic._",
      },
      about: {
        headline: "Between what is seen and what is _felt._",
        lead: "Founded by Syasya Ahmad, Syasya&Realis is an independent multidisciplinary creative studio exploring the intersection of _photography, film, montage, and graphic design._",
        p1: "Our work spans fashion campaigns, short films, education promos and brand content — including projects for J Luxe and Unisel.",
        p2: "Guided by an instinct for composition, atmosphere, and narrative, Syasya transforms everyday realities into _considered visual expressions_ that balance authenticity with artistic intention.",
      },
      faq: {
        headline: "Questions, _answered._",
        lead: "Everything clients usually ask before a project. _Still unsure?_ Send us a message — we reply on WhatsApp or by email.",
        items: [
          {
            q: "How much does a project cost?",
            a: "Every project is quoted after a short brief, based on the deliverables, shoot days and editing time. You get a clear written quote before anything starts.",
          },
          {
            q: "How long does a project take?",
            a: "It depends on the scope. A product video or photo session is quicker than a full company profile. We agree the shoot date, review rounds and final deadline at the brief.",
          },
          {
            q: "How do I book?",
            a: "Use the contact form — it opens WhatsApp or email with your brief filled in. We reply and suggest a time for a short brief call.",
          },
          {
            q: "How many revisions are included?",
            a: "Revision rounds are written in the quote, so you know in advance what is included.",
          },
          {
            q: "Do you shoot on location?",
            a: "Yes. We shoot at your office, factory, store or event. Any travel costs are listed in the quote.",
          },
          {
            q: "Who owns the final files?",
            a: "Usage rights for the final videos, photos and designs are set out in the quote. Raw footage can be included on request.",
          },
          {
            q: "Can you edit footage we already have?",
            a: "Yes — editing, colour grading, sound and motion titles are available as a separate service.",
          },
        ],
      },
      testimonials: [], // { quote, name, role } — real client quotes only; the section is hidden while empty
    },
    /* id, ms: draft translations by Claude (src/i18n/<lang>.mjs) — a native speaker should check them */
    ...PAGE_DRAFTS,
  },

  /* ---------- archive (media paths: "media/…" in the site, or a full Storage URL) ---------- */
  archive: { film: WORK, photos: PHOTOS, design: DESIGN },
};

/* the fields the Page text tab shows, in order (label, path inside pages.<lang>, max length, kind) */
export const PAGE_FIELDS = [
  {
    group: "Home · cover",
    fields: [
      ["Headline line 1", "home.headline1", 30],
      ["Headline line 2", "home.headline2", 30],
      ["Cover quote", "home.quote", 260, "area"],
    ],
  },
  {
    group: "Home · archive",
    fields: [
      ["Film heading", "home.archiveHeading", 40],
      ["Film intro", "home.archiveIntro", 160, "area"],
      ["Stills heading", "home.stillsHeading", 40],
      ["Stills intro", "home.stillsIntro", 200, "area"],
      ["Design heading", "home.designHeading", 40],
      ["Design intro", "home.designIntro", 220, "area"],
    ],
  },
  { group: "Home · manifesto", fields: [["Statement", "home.manifesto", 100, "area"]] },
  {
    group: "Home · about",
    fields: [
      ["Heading", "home.aboutHeading", 40],
      ["Paragraph 1", "home.aboutP1", 320, "area"],
      ["Paragraph 2", "home.aboutP2", 320, "area"],
    ],
  },
  {
    group: "Services",
    fields: [
      ["Heading", "home.servicesHeading", 60],
      ...[0, 1, 2, 3].flatMap(i => [
        [`0${i + 1} title`, `home.services.${i}.title`, 30],
        [`0${i + 1} text`, `home.services.${i}.text`, 220, "area"],
      ]),
    ],
  },
  {
    group: "Process",
    fields: [
      ["Heading", "home.processHeading", 40],
      ...[0, 1, 2, 3, 4].flatMap(i => [
        [`Step 0${i + 1}`, `home.steps.${i}.title`, 40],
        [`Step 0${i + 1} · point 1`, `home.steps.${i}.points.0`, 50],
        [`Step 0${i + 1} · point 2`, `home.steps.${i}.points.1`, 50],
      ]),
    ],
  },
  { group: "Contact", fields: [["Heading", "home.contactHeading", 60, "area"]] },
  {
    group: "About page",
    fields: [
      ["Headline", "about.headline", 70],
      ["Intro", "about.lead", 320, "area"],
      ["Intro paragraph 2", "about.p2", 320, "area"],
    ],
  },
  {
    group: "FAQ page",
    fields: [
      ["Headline", "faq.headline", 40],
      ["Intro", "faq.lead", 200, "area"],
    ],
    list: "faq.items",
  },
  { group: "Testimonials", fields: [], list: "testimonials" },
];
