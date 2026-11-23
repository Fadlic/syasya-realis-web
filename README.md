# syasya-realis-web

Syasya&Realis — portfolio website (Astro + Supabase).

## Status

Step 1 of the move to Astro: the V4.4 single-file site, split into a layout, components and four real pages.
The look is unchanged from V4.4 (compared pixel by pixel at 1440 / 1024 / 768 / 390 px).

| URL | Page | Source |
|---|---|---|
| `/` | Landing intro + home (archive, services, process, contact) | `src/pages/index.astro` |
| `/about` | The studio | `src/pages/about.astro` |
| `/guidelines` | Brand guidelines | `src/pages/guidelines.astro` |
| `/faq` | FAQ | `src/pages/faq.astro` |

Old links (`/#about-us`, `/#brand-guidelines`, `/#faq`) are redirected to the new pages.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static files in dist/
```

Requires Node 20.3 or newer.

## Layout

```
src/layouts/Base.astro       <head>, header, footer, lightbox, pop-up, scripts
src/components/Intro.astro   landing trailer (home page only)
src/components/Header.astro  top menu + mobile menu
src/components/Footer.astro  footer, lightbox, pop-up
src/styles/site.css          all styles (unchanged from V4.4)
public/js/01-settings.js     SETTINGS: name, contacts, WORK / PHOTOS / DESIGN lists
public/js/config.js          Supabase URL + publishable key (public by design; never the secret key)
public/js/live.js            enquiry saving + live pop-ups
public/brand/                logo marks, favicon, guideline mockups
```

The scripts are kept as plain files (`is:inline`) so they behave exactly as in V4.4.

## Next steps

1. Read published content from Supabase (`get_published_content()`) at build time, with the built-in content as fallback.
2. Seed the first draft from the V4.4 content.
3. Admin at `/admin` with the Content panel.
4. Publish → hosting deploy hook → rebuild.
