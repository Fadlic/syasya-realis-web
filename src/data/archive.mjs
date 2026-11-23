/* =====================================================================
   ARCHIVE — the work shown on the home page (films, photos, designs).
   One source for both sides:
   - Astro renders the archive into the HTML at build time (search engines and
     link previews see real titles and images);
   - the same data is embedded as JSON (#archive-data) for the browser scripts
     (projector reel, intro trailer, lightbox, "Show more photos").
   Media paths are relative to the home page: files live in public/media/.
   `alt`: describe what is in the picture (who/what/where). Fill it in when the
   real photos arrive; until then the title is used.
   ===================================================================== */

export const WORK = [
  // size decides the frame: "wide" = large, "" = medium, "narrow" = small (9:16 videos).
  // device is kept for the older "devices" layout: "macbook" | "ipad" | "iphone".
  {
    title: "J Luxe — Teaser",
    cat: "Fashion",
    tags: ["Teaser"],
    video: "media/jluxe-teaser.mp4",
    poster: "media/jluxe-teaser.jpg",
    size: "wide",
    device: "macbook",
  },
  {
    title: "J Luxe — Instagram Teaser",
    cat: "Fashion",
    tags: ["Instagram teaser"],
    video: "media/jluxe-ig.mp4",
    poster: "media/jluxe-ig.jpg",
    size: "narrow",
    device: "iphone",
  },
  {
    title: "Pilihan Hidup",
    cat: "Short Film",
    tags: ["Short film"],
    video: "media/pilihan-hidup.mp4",
    poster: "media/pilihan-hidup.jpg",
    size: "",
    device: "ipad",
  },
  {
    title: "Respect & Responsibility",
    cat: "Short Film",
    tags: ["Cyberbully PSA"],
    video: "media/respect.mp4",
    poster: "media/respect.jpg",
    size: "",
    device: "ipad",
  },
  {
    title: "Unisel FSSR — Promo",
    cat: "Education",
    tags: ["Promo"],
    video: "media/unisel-promo.mp4",
    poster: "media/unisel-promo.jpg",
    size: "narrow",
    device: "iphone",
  },
  {
    title: "J Luxe — Ready-to-Wear",
    cat: "Fashion",
    tags: ["Campaign"],
    video: "media/jluxe-rtw.mp4",
    poster: "media/jluxe-rtw.jpg",
    size: "narrow",
    device: "ipad",
  },
  {
    title: "Unisel FSSR",
    cat: "Education",
    tags: ["Feature"],
    video: "media/unisel.mp4",
    poster: "media/unisel.jpg",
    size: "narrow",
    device: "ipad",
  },
  // { title:"Client — Company Profile", cat:"Company Profile", tags:["Corporate film"], video:"media/xxx.mp4", poster:"media/xxx.jpg", size:"wide" },
];

// Graphic design pieces (size "wide" = double width, ar = aspect ratio)
export const DESIGN = [
  { src: "media/design-01.jpg", title: "Design piece 01", cat: "Branding", size: "wide" },
  { src: "media/design-02.jpg", title: "Design piece 02", cat: "Social kit", ar: "4/5" },
  { src: "media/design-03.jpg", title: "Design piece 03", cat: "Poster", ar: "3/4" },
  { src: "media/design-04.jpg", title: "Design piece 04", cat: "Social kit", ar: "1/1" },
  { src: "media/design-05.jpg", title: "Design piece 05", cat: "Print", ar: "3/4" },
  { src: "media/design-06.jpg", title: "Design piece 06", cat: "Key visual", ar: "4/5" },
];

// Photos: media/photo-01.jpg … media/photo-27.jpg (ar = aspect ratio)
export const PHOTOS = Array.from({ length: 27 }, (_, i) => ({
  src: `media/photo-${String(i + 1).padStart(2, "0")}.jpg`,
  ar: ["2/3", "3/2", "2/3", "4/5", "3/2", "2/3"][i % 6],
  alt: `Photograph ${i + 1}`,
}));

/* how many photos the gallery shows before "Show more photos" */
export const PHOTO_STEP = 12;
