/* =====================================================================
   SETTINGS — edit here. Name, contacts, and media file paths.
   Put media files next to this page in a folder named "media/".
   ===================================================================== */
/* About page facts — leave a value "" to hide that row on the live site */
const ABOUT = { based: "", founded: "", team: "" };
/* Testimonials — real client quotes only. The section is hidden on the live site while this list is empty.
   { quote:"…", name:"Full name", role:"Role, Company" } */
const TESTIMONIALS = [];
const PREVIEW_PLACEHOLDERS = false;  // true = show empty slots (layout preview only)

const SITE = {
  name: "Syasya&Realis",           // company name
  short: "S&R",                      // short mark (film strip edge print)
  email: "hello@studio.com",
  instagram: "#",
  whatsapp: "#",
  whatsappNumber: "",                // e.g. "6281234567890" — used by "Send via WhatsApp" (preview v2)
  showreel: "media/showreel.mp4",    // hero background + showreel
  showreelPoster: "media/showreel.jpg",
};

const WORK = [
  // size decides the frame: "wide" = MacBook (large), "" = iPad (medium), "narrow" = iPhone (small, for 9:16 videos).
  // You can still force a frame with device:"macbook" | "ipad" | "iphone".
  // Layout tip: keep each row adding up — wide + narrow, or two normal items side by side.
  { title:"J Luxe — Teaser",              cat:"Fashion",   tags:["Teaser"],         video:"media/jluxe-teaser.mp4",   poster:"media/jluxe-teaser.jpg",   size:"wide",   device:"macbook"},
  { title:"J Luxe — Instagram Teaser",    cat:"Fashion",   tags:["Instagram teaser"],      video:"media/jluxe-ig.mp4",       poster:"media/jluxe-ig.jpg",       size:"narrow", device:"iphone" },
  { title:"Pilihan Hidup",                cat:"Short Film", tags:["Short film"],     video:"media/pilihan-hidup.mp4",  poster:"media/pilihan-hidup.jpg",  size:"",       device:"ipad"   },
  { title:"Respect & Responsibility",     cat:"Short Film", tags:["Cyberbully PSA"], video:"media/respect.mp4",        poster:"media/respect.jpg",        size:"",       device:"ipad"   },
  { title:"Unisel FSSR — Promo",          cat:"Education", tags:["Promo"],          video:"media/unisel-promo.mp4",   poster:"media/unisel-promo.jpg",   size:"narrow", device:"iphone" },
  { title:"J Luxe — Ready-to-Wear",       cat:"Fashion",   tags:["Campaign"],       video:"media/jluxe-rtw.mp4",      poster:"media/jluxe-rtw.jpg",      size:"narrow",       device:"ipad"   },
  { title:"Unisel FSSR",                  cat:"Education", tags:["Feature"],        video:"media/unisel.mp4",         poster:"media/unisel.jpg",         size:"narrow",       device:"ipad"   },
  // Add your company profile, marketing montage and product videos like this:
  // { title:"Client — Company Profile", cat:"Company Profile",  tags:["Corporate film"], video:"media/xxx.mp4", poster:"media/xxx.jpg", size:"wide" },
  // { title:"Client — Brand Montage",   cat:"Marketing",        tags:["Montage"],        video:"media/xxx.mp4", poster:"media/xxx.jpg", size:"" },
  // { title:"Client — Product Video",   cat:"Product",          tags:["Hero shots"],     video:"media/xxx.mp4", poster:"media/xxx.jpg", size:"narrow" },
];

// Graphic design pieces: media/design-01.jpg …  (cat shows under each piece; size "wide" = double width)
const DESIGN = [
  { src:"media/design-01.jpg", title:"Design piece 01", cat:"Branding",   size:"wide" },
  { src:"media/design-02.jpg", title:"Design piece 02", cat:"Social kit", ar:"4/5"  },
  { src:"media/design-03.jpg", title:"Design piece 03", cat:"Poster",     ar:"3/4"  },
  { src:"media/design-04.jpg", title:"Design piece 04", cat:"Social kit", ar:"1/1"  },
  { src:"media/design-05.jpg", title:"Design piece 05", cat:"Print",      ar:"3/4"  },
  { src:"media/design-06.jpg", title:"Design piece 06", cat:"Key visual", ar:"4/5"  },
];

const FRAME = "film";                            // "film" = film strip frames · "devices" = MacBook / iPad / iPhone
const PREVIEW_SECONDS = 10;                     // hover preview length for videos
const CLIENTS = ["J Luxe","Unisel"];
const DISCIPLINES = ["Photography","Videography","Montage Design","Graphic Design"];   // the strip under the cover   // brands from the work above

// 27 photos: media/photo-01.jpg … media/photo-27.jpg  (ar = aspect ratio for the placeholder)
const PHOTOS = Array.from({length:27}, (_,i) => ({
  src:`media/photo-${String(i+1).padStart(2,"0")}.jpg`,
  ar:["2/3","3/2","2/3","4/5","3/2","2/3"][i % 6]
}));
/* ===================================================================== */

(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const tones = [
    "linear-gradient(135deg,#3A0D12,#0E0B0A)","linear-gradient(160deg,#16252E,#0C0A09)","linear-gradient(135deg,#2E0B10,#0D0B0A)",
    "linear-gradient(200deg,#1B3442,#0C0A0A)","linear-gradient(135deg,#1F1A19,#0B0908)","linear-gradient(150deg,#3B1016,#0E0B0A)"];

  /* apply settings */
  $$("[data-name]").forEach(e => e.textContent = SITE.name);
  $$("[data-email]").forEach(e => e.textContent = SITE.email);
  $$("[data-ig]").forEach(a => a.href = SITE.instagram); $$("[data-wa]").forEach(a => a.href = SITE.whatsapp);
  document.title = `${SITE.name} — Visual Narratives & Moving Art`;
  $("#yr").textContent = new Date().getFullYear();

  /* placeholder helper: shows a tinted tile with the file name until the file exists */
  const ph = (label, i) => { const d = document.createElement("div"); d.className = "ph";
    d.dataset.label = label; d.style.setProperty("--g", tones[i % tones.length]); return d; };
  const img = (src, label, i, alt="") => { const im = new Image(); im.alt = alt; im.loading = "lazy"; im.decoding = "async";
    im.onerror = () => im.replaceWith(ph(label, i)); im.src = src; return im; };
  const vid = (src, poster, label, i, opts={}) => {
    const v = document.createElement("video"); Object.assign(v, {muted:true, loop:true, playsInline:true, preload:"metadata", ...opts});
    v.setAttribute("muted",""); v.setAttribute("playsinline","");
    if (poster) v.poster = poster;
    const s = document.createElement("source"); s.src = src; s.type = "video/mp4";
    s.onerror = () => v.replaceWith(ph(label, i)); v.appendChild(s); return v; };

  /* home page only (/, Astro): hero, archive, gallery, design, contact form */
  const HOME = !!$("#top");
  if (HOME) {
  /* hero */
  const hero = vid(SITE.showreel, SITE.showreelPoster, "showreel.mp4", 0, {autoplay:true, preload:"auto"});
  $("#heroMedia").appendChild(hero); hero.play && hero.play().catch(()=>{});

  /* timecode */
  const t0 = performance.now(), pad = n => String(n).padStart(2,"0");
  setInterval(() => { const ms = performance.now() - t0, s = Math.floor(ms/1000);
    $("#tc").textContent = `${pad(Math.floor(s/3600))}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}:${pad(Math.floor(ms/40)%25)}`; }, 40);

  /* work grid */
  const grid = $("#grid");
  WORK.forEach((w, i) => {
    const a = document.createElement("article"); a.className = `item rv ${w.size}`; a.dataset.cat = w.cat; a.tabIndex = 0;
    const shot = document.createElement("div"); shot.className = "shot stage";
    if (FRAME === "film") {
      /* film strip: 9:16 videos run on a vertical strip, everything else on a horizontal one */
      const vert = (w.device === "iphone") || (!w.device && w.size === "narrow");
      shot.classList.add("filmstage");
      const film = document.createElement("div"); film.className = `film ${vert ? "v" : "h"}`;
      const no = String(i + 1).padStart(2, "0"), frame = document.createElement("div"); frame.className = "fr main";
      const screen = document.createElement("div"); screen.className = "screen";
      screen.appendChild(vid(w.video, w.poster, w.video.split("/").pop(), i+1)); frame.appendChild(screen);
      const peek = () => { const p = document.createElement("div"); p.className = "fr peek"; return p; };
      film.append(peek(), frame, peek());
      film.insertAdjacentHTML("beforeend", `<i class="perf a"></i><i class="perf b"></i><span class="edge a"></span><span class="edge b"></span>`);
      film.querySelector(".edge.a").append(`${SITE.short || SITE.name} 400  `, Object.assign(document.createElement("b"), {textContent:`▸ ${no}`}));
      film.querySelector(".edge.b").textContent = `${no}A  ·  ${w.cat}`;
      shot.appendChild(film);
    } else {
    const kind = w.device || ({wide:"macbook", narrow:"iphone"}[w.size] || "ipad");
    const dev = document.createElement("div"); dev.className = `device ${kind}`;
    const screen = document.createElement("div"); screen.className = "screen";
    screen.appendChild(vid(w.video, w.poster, w.video.split("/").pop(), i+1));
    if (kind === "iphone") screen.insertAdjacentHTML("beforeend", '<span class="island"></span>');
    if (kind === "macbook") {
      screen.insertAdjacentHTML("beforeend", '<span class="mb-notch"></span>');
      const lid = document.createElement("div"); lid.className = "lid"; lid.appendChild(screen);
      dev.appendChild(lid); dev.insertAdjacentHTML("beforeend", '<div class="base"></div>');
    } else {
      dev.insertAdjacentHTML("beforeend", kind === "iphone"
        ? '<i class="hw act"></i><i class="hw vu"></i><i class="hw vd"></i><i class="hw pw"></i>'
        : '<i class="hw top"></i><i class="hw v1"></i><i class="hw v2"></i>');
      dev.appendChild(screen);
    }
    shot.appendChild(dev);
    }
    shot.insertAdjacentHTML("beforeend", `<div class="cursor mono">Play</div>`);
    a.appendChild(shot);
    a.insertAdjacentHTML("beforeend", `<div class="item-meta"><h3>${w.title}</h3><span class="mono"><span class="meta-view v2-only">View ↗&nbsp;&nbsp;</span>${w.cat}</span></div><div class="meta-tags v2-only">${w.tags.map(t=>`<span>${t}</span>`).join("")}</div>`);
    /* hover preview: plays the first PREVIEW_SECONDS on a loop, resets when the cursor leaves */
    const startPreview = () => { const vv = a.querySelector("video"); if (!vv) return;
      vv.loop = false; vv.muted = true;
      if (!vv._pv) { vv._pv = true; vv.addEventListener("timeupdate", () => { if (vv.currentTime >= PREVIEW_SECONDS) vv.currentTime = 0; });
        vv.addEventListener("ended", () => { if (a.matches(":hover")) { vv.currentTime = 0; vv.play().catch(()=>{}); } }); }
      vv.preload = "auto"; vv.play().catch(()=>{}); };
    const stopPreview = () => { const vv = a.querySelector("video"); if (!vv) return; vv.pause(); try { vv.currentTime = 0; } catch (e) {} };
    a.addEventListener("mouseenter", startPreview);
    a.addEventListener("mouseleave", stopPreview);
    a.addEventListener("focus", startPreview); a.addEventListener("blur", stopPreview);
    const open = () => openLB("video", i); a.addEventListener("click", open);
    a.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
    grid.appendChild(a);
  });

  /* filters */
  const cats = ["All", ...new Set(WORK.map(w => w.cat))];
  cats.forEach(c => { const b = document.createElement("button"); b.textContent = c; b.setAttribute("aria-pressed", c==="All");
    b.onclick = () => { $$("#filters button").forEach(x => x.setAttribute("aria-pressed", x===b));
      $$("#grid .item").forEach(it => it.classList.toggle("hide", c!=="All" && it.dataset.cat!==c)); };
    $("#filters").appendChild(b); });

  /* clients */
  const cl = DISCIPLINES.concat(DISCIPLINES).map((c,i) => `<span class="${i%2?'s':''}">${c}</span>`).join("");
  $("#clientTrack").innerHTML = cl; $("#clientTrack2").innerHTML = cl;

  /* gallery */
  let shown = 0; const STEP = 12;
  const addPhotos = () => {
    PHOTOS.slice(shown, shown + STEP).forEach((p, k) => {
      const i = shown + k, d = document.createElement("div"); d.className = "ph-item rv in"; d.style.setProperty("--ar", p.ar);
      const im = img(p.src, p.src.split("/").pop(), i, `Photograph ${i+1}`);
      im.onerror = () => { const x = ph(p.src.split("/").pop(), i); x.style.setProperty("--ar", p.ar); im.replaceWith(x); };
      d.appendChild(im); d.onclick = () => openLB("photo", i); $("#gallery").appendChild(d);
    });
    shown = Math.min(PHOTOS.length, shown + STEP);
    $("#moreBtn").style.display = shown >= PHOTOS.length ? "none" : "";
  };
  addPhotos(); $("#moreBtn").onclick = addPhotos;

  /* design grid */
  DESIGN.forEach((d, i) => {
    const a = document.createElement("article"); a.className = `d-item rv ${d.size||""}`; a.tabIndex = 0;
    const shot = document.createElement("div"); shot.className = "shot"; if (d.ar) shot.style.setProperty("--ar", d.ar);
    shot.appendChild(img(d.src, d.src.split("/").pop(), i+3, d.title));
    a.appendChild(shot);
    a.insertAdjacentHTML("beforeend", `<div class="item-meta"><h3 style="font-size:17px">${d.title}</h3><span class="mono">${d.cat}</span></div>`);
    const open = () => openLB("design", i); a.onclick = open; a.onkeydown = e => { if (e.key === "Enter") open(); };
    $("#designGrid").appendChild(a);
  });

  } /* end home page only */

  /* counters */
  const countUp = (el, n) => { let k = 0; const step = () => { k++; el.textContent = Math.min(n, Math.round(n*k/30)); if (k < 30) requestAnimationFrame(step); }; step(); };

  /* lightbox — "screening room": theme gradient backdrop, counter, viewfinder frame, filmstrip */
  const lb = $("#lb"), stage = $("#lbStage"), strip = $("#lbStrip"); let mode, idx;
  const art = (m, i) => m === "video" ? WORK[i].poster : m === "design" ? DESIGN[i].src : PHOTOS[i].src;
  const buildStrip = list => { if (!strip) return; strip.innerHTML = ""; strip.hidden = mode === "reel" || list.length < 2; if (strip.hidden) return;
    list.forEach((_, i) => { const t = document.createElement("button"); t.type = "button"; t.className = "lb-th"; t.setAttribute("aria-label", `Open ${i+1} of ${list.length}`);
      const s = art(mode, i); if (s) t.style.backgroundImage = `url("${s}")`; t.onclick = () => { idx = i; render(); }; strip.appendChild(t); }); };
  const render = () => {
    stage.innerHTML = ""; stage.classList.remove("in"); void stage.offsetWidth; stage.classList.add("in");
    const frame = document.createElement("div"); frame.className = "lb-frame";
    if (mode === "reel") {
      $("#lbEye").textContent = "Showreel"; $("#lbTitle").textContent = SITE.name; $("#lbCount").textContent = "";
      frame.appendChild(vid(SITE.showreel, SITE.showreelPoster, "showreel.mp4 not uploaded yet", 0, {controls:true, autoplay:true, muted:false, loop:false}));
      stage.appendChild(frame); return;
    }
    const list = mode === "video" ? WORK : mode === "design" ? DESIGN : PHOTOS;
    if (mode === "video") { const w = WORK[idx]; $("#lbEye").textContent = `Film · ${w.cat}`; $("#lbTitle").textContent = w.title;
      frame.appendChild(vid(w.video, w.poster, `${w.video.split("/").pop()} not uploaded yet`, idx+1, {controls:true, autoplay:true, muted:false, loop:false}));
    } else if (mode === "design") { const d = DESIGN[idx]; $("#lbEye").textContent = `Design · ${d.cat}`; $("#lbTitle").textContent = d.title;
      frame.appendChild(img(d.src, `${d.src.split("/").pop()} not uploaded yet`, idx+3, d.title));
    } else { $("#lbEye").textContent = "Stills"; $("#lbTitle").textContent = `Photograph ${idx+1}`;
      frame.appendChild(img(PHOTOS[idx].src, `${PHOTOS[idx].src.split("/").pop()} not uploaded yet`, idx, `Photograph ${idx+1}`)); }
    frame.insertAdjacentHTML("beforeend", '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>');
    stage.appendChild(frame);
    $("#lbCount").innerHTML = `<b>${String(idx+1).padStart(2,"0")}</b> / ${String(list.length).padStart(2,"0")}`;
    const prev = document.createElement("button"), next = document.createElement("button");
    prev.className = "lb-nav lb-prev"; next.className = "lb-nav lb-next"; prev.textContent = "←"; next.textContent = "→";
    prev.setAttribute("aria-label","Previous"); next.setAttribute("aria-label","Next");
    prev.onclick = () => { idx = (idx - 1 + list.length) % list.length; render(); };
    next.onclick = () => { idx = (idx + 1) % list.length; render(); };
    stage.append(prev, next);
    if (strip && !strip.hidden) { [...strip.children].forEach((t, i) => t.classList.toggle("on", i === idx));
      const t = strip.children[idx]; if (t) strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: "smooth" }); }   // scroll the strip only, never the page
  };
  const openLB = window.__openLB = (m, i=0) => { mode = m; idx = i; lb.classList.add("open"); document.body.style.overflow = "hidden";
    buildStrip(m === "video" ? WORK : m === "design" ? DESIGN : m === "photo" ? PHOTOS : []); render(); };
  const closeLB = () => { lb.classList.remove("open"); stage.innerHTML = ""; document.body.style.overflow = ""; };
  $("#lbClose").onclick = closeLB;
  lb.addEventListener("click", e => { if (e.target === lb || e.target === stage) closeLB(); });
  addEventListener("keydown", e => { if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowRight") $(".lb-next")?.click();
    if (e.key === "ArrowLeft") $(".lb-prev")?.click(); });
  if (HOME) $("#playReel").onclick = () => openLB("reel");

  /* nav */
  addEventListener("scroll", () => $("#nav").classList.toggle("solid", scrollY > 40), {passive:true});
  const menu = o => document.body.classList.toggle("menu", o);
  $("#burger").onclick = () => menu(!document.body.classList.contains("menu"));
  $$("#sheet a").forEach(a => a.onclick = () => { menu(false); });   // braces: returning false would cancel the link

  /* copy helpers */
  const copy = async (text, hintEl, okText, resetText) => {
    let ok = false; try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {}
    hintEl.textContent = ok ? okText : "Select to copy"; setTimeout(() => hintEl.textContent = resetText, 2000); };
  if (HOME) {
  $("#copyMail").onclick = () => copy(SITE.email, $("#copyHint"), "Copied ✓", "Copy");

  /* brief form: no server — builds a brief the visitor copies and sends */
  $("#brief").addEventListener("submit", e => {
    e.preventDefault(); const f = e.target;
    if (!f.name.value.trim()) { $("#formNote").textContent = "Please add your name."; f.name.focus(); return; }
    const svcs = [...f.querySelectorAll("input[name=svc]:checked")].map(x => x.value).join(", ") || "—";
    $("#outText").textContent =
`Name: ${f.name.value}
Company: ${f.company.value || "—"}
Email: ${f.email.value || "—"}
Services: ${svcs}
Timeline: ${f.timeline.value}

${f.msg.value || ""}`;
    $("#out").classList.add("show"); $("#formNote").textContent = "Brief ready below.";
  });
  $("#copyBrief").onclick = e => copy($("#outText").textContent, e.target, "Copied ✓", "Copy brief");
  } /* end home page only */

  /* wordmark fit */
  const fitWM = () => { const el = $("#wm"); el.style.fontSize = "100px"; const w = el.firstElementChild.offsetWidth;
    el.style.fontSize = (100 * document.documentElement.clientWidth / w * .96) + "px"; };

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return;
    en.target.classList.add("in"); io.unobserve(en.target);
    if (en.target.querySelector?.("[data-count-work]")) { countUp($("[data-count-work]"), WORK.length); countUp($("[data-count-photo]"), PHOTOS.length); countUp($("[data-count-design]"), DESIGN.length); }
  }), {threshold:.12});
  $$(".rv").forEach((el,i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fitWM(); document.body.classList.add("ready"); });
  addEventListener("resize", fitWM);
})();
