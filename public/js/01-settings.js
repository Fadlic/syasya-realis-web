/* =====================================================================
   SETTINGS — contact details, About facts, testimonials, intro and
   protection come from the admin Content panel (built into the page as
   JSON #site-data; built-in values in src/data/content.mjs). Archive media:
   #archive-data on the home page. Only fixed brand values stay here.
   ===================================================================== */
const SITE_DATA = (() => {
  try {
    return JSON.parse(document.getElementById("site-data")?.textContent || "{}");
  } catch {
    return {};
  }
})();
/* interface text in the page's language (src/i18n/<lang>.mjs → js); English when a key is missing */
const LANG = SITE_DATA.lang || "en";
const I18N = SITE_DATA.i18n || {};
const tr = (key, fallback, vars) =>
  String(I18N[key] ?? fallback).replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : m));
/* About page facts — an empty value hides that row on the live site */
const ABOUT = Object.assign({ based: "", founded: "", team: "" }, SITE_DATA.about);
/* Testimonials — real client quotes only ({ quote, name, role }). The section is hidden while empty. */
const TESTIMONIALS = Array.isArray(SITE_DATA.testimonials) ? SITE_DATA.testimonials : [];
const PREVIEW_PLACEHOLDERS = false; // true = show empty slots (layout preview only)

const SITE = {
  name: "Syasya&Realis", // company name
  short: "S&R", // short mark (film strip edge print)
  email: SITE_DATA.email || "hello@studio.com",
  instagram: SITE_DATA.instagram || "#",
  whatsapp: SITE_DATA.whatsapp || "#",
  whatsappNumber: SITE_DATA.whatsappNumber || "", // used by "Send via WhatsApp"
  showreel: "/media/showreel.mp4", // hero background + showreel
  showreelPoster: "/media/showreel.jpg",
};

/* Archive (films, photos, designs): edited in the admin Content panel (built-in: src/data/archive.mjs). Astro renders it into the
   page and embeds the same data as JSON, read here for the reel, the lightbox and "Show more photos". */
const ARCHIVE = (() => {
  try {
    return JSON.parse(document.getElementById("archive-data")?.textContent || "{}");
  } catch {
    return {};
  }
})();
const WORK = ARCHIVE.work || [];
const DESIGN = ARCHIVE.design || [];
const PHOTOS = ARCHIVE.photos || [];

const FRAME = "film"; // "film" = film strip frames · "devices" = MacBook / iPad / iPhone
const PREVIEW_SECONDS = 10; // hover preview length for videos
const CLIENTS = ["J Luxe", "Unisel"];
const DISCIPLINES = ARCHIVE.disciplines || ["Photography", "Videography", "Montage Design", "Graphic Design"]; // the strip under the cover

/* ===================================================================== */

(() => {
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  const tones = [
    "linear-gradient(135deg,#3A0D12,#0E0B0A)",
    "linear-gradient(160deg,#16252E,#0C0A09)",
    "linear-gradient(135deg,#2E0B10,#0D0B0A)",
    "linear-gradient(200deg,#1B3442,#0C0A0A)",
    "linear-gradient(135deg,#1F1A19,#0B0908)",
    "linear-gradient(150deg,#3B1016,#0E0B0A)",
  ];

  /* apply settings */
  $$("[data-name]").forEach(e => (e.textContent = SITE.name));
  $$("[data-email]").forEach(e => (e.textContent = SITE.email));
  // a link with no address set yet is hidden, never left pointing at "#"
  const setLink = (a, url) => (url && url !== "#" ? (a.href = url) : (a.style.display = "none"));
  $$("[data-ig]").forEach(a => setLink(a, SITE.instagram));
  $$("[data-wa]").forEach(a => setLink(a, SITE.whatsapp));
  $("#yr").textContent = new Date().getFullYear();

  /* placeholder helper: shows a tinted tile with the file name until the file exists */
  const ph = (label, i) => {
    const d = document.createElement("div");
    d.className = "ph";
    d.dataset.label = label;
    d.style.setProperty("--g", tones[i % tones.length]);
    return d;
  };
  /* builds an element whose text is set as text, never parsed as HTML (titles may come from the CMS later) */
  const tx = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const img = (src, label, i, alt = "") => {
    const im = new Image();
    im.alt = alt;
    im.loading = "lazy";
    im.decoding = "async";
    im.onerror = () => im.replaceWith(ph(label, i));
    im.src = src;
    return im;
  };
  const vid = (src, poster, label, i, opts = {}) => {
    const v = document.createElement("video");
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "metadata", ...opts });
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    if (poster) v.poster = poster;
    const s = document.createElement("source");
    s.src = src;
    s.type = "video/mp4";
    s.onerror = () => v.replaceWith(ph(label, i));
    v.appendChild(s);
    return v;
  };

  /* home page only (/, Astro): hero, archive, gallery, design, contact form */
  const HOME = !!$("#top");
  if (HOME) {
    /* hero */
    const hero = vid(SITE.showreel, SITE.showreelPoster, "showreel.mp4", 0, { autoplay: true, preload: matchMedia("(max-width: 700px)").matches ? "metadata" : "auto" });
    $("#heroMedia").appendChild(hero);
    hero.play && hero.play().catch(() => {});

    /* timecode */
    const t0 = performance.now(),
      pad = n => String(n).padStart(2, "0");
    setInterval(() => {
      const ms = performance.now() - t0,
        s = Math.floor(ms / 1000);
      $("#tc").textContent =
        `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(Math.floor(ms / 40) % 25)}`;
    }, 40);

    /* work grid */
    const grid = $("#grid");
    WORK.forEach((w, i) => {
      const a = document.createElement("article");
      a.className = `item ${w.size}`;
      a.dataset.cat = w.cat;
      a.tabIndex = 0;
      const shot = document.createElement("div");
      shot.className = "shot stage";
      if (FRAME === "film") {
        /* film strip: 9:16 videos run on a vertical strip, everything else on a horizontal one */
        const vert = w.device === "iphone" || (!w.device && w.size === "narrow");
        shot.classList.add("filmstage");
        const film = document.createElement("div");
        film.className = `film ${vert ? "v" : "h"}`;
        const no = String(i + 1).padStart(2, "0"),
          frame = document.createElement("div");
        frame.className = "fr main";
        const screen = document.createElement("div");
        screen.className = "screen";
        screen.appendChild(vid(w.video, w.poster, w.video.split("/").pop(), i + 1));
        frame.appendChild(screen);
        const peek = () => {
          const p = document.createElement("div");
          p.className = "fr peek";
          return p;
        };
        film.append(peek(), frame, peek());
        film.insertAdjacentHTML(
          "beforeend",
          `<i class="perf a"></i><i class="perf b"></i><span class="edge a"></span><span class="edge b"></span>`
        );
        film
          .querySelector(".edge.a")
          .append(
            `${SITE.short || SITE.name} 400  `,
            Object.assign(document.createElement("b"), { textContent: `▸ ${no}` })
          );
        film.querySelector(".edge.b").textContent = `${no}A  ·  ${w.cat}`;
        shot.appendChild(film);
      } else {
        const kind = w.device || { wide: "macbook", narrow: "iphone" }[w.size] || "ipad";
        const dev = document.createElement("div");
        dev.className = `device ${kind}`;
        const screen = document.createElement("div");
        screen.className = "screen";
        screen.appendChild(vid(w.video, w.poster, w.video.split("/").pop(), i + 1));
        if (kind === "iphone") screen.insertAdjacentHTML("beforeend", '<span class="island"></span>');
        if (kind === "macbook") {
          screen.insertAdjacentHTML("beforeend", '<span class="mb-notch"></span>');
          const lid = document.createElement("div");
          lid.className = "lid";
          lid.appendChild(screen);
          dev.appendChild(lid);
          dev.insertAdjacentHTML("beforeend", '<div class="base"></div>');
        } else {
          dev.insertAdjacentHTML(
            "beforeend",
            kind === "iphone"
              ? '<i class="hw act"></i><i class="hw vu"></i><i class="hw vd"></i><i class="hw pw"></i>'
              : '<i class="hw top"></i><i class="hw v1"></i><i class="hw v2"></i>'
          );
          dev.appendChild(screen);
        }
        shot.appendChild(dev);
      }
      shot.insertAdjacentHTML("beforeend", `<div class="cursor mono">Play</div>`);
      a.appendChild(shot);
      const meta = tx("div", "item-meta"),
        cat = tx("span", "mono"),
        tags = tx("div", "meta-tags v2-only");
      cat.append(tx("span", "meta-view v2-only", "View ↗\u00a0\u00a0"), w.cat);
      meta.append(tx("h3", null, w.title), cat);
      w.tags.forEach(t => tags.append(tx("span", null, t)));
      a.append(meta, tags);
      /* hover preview: plays the first PREVIEW_SECONDS on a loop, resets when the cursor leaves */
      const startPreview = () => {
        const vv = a.querySelector("video");
        if (!vv) return;
        vv.loop = false;
        vv.muted = true;
        if (!vv._pv) {
          vv._pv = true;
          vv.addEventListener("timeupdate", () => {
            if (vv.currentTime >= PREVIEW_SECONDS) vv.currentTime = 0;
          });
          vv.addEventListener("ended", () => {
            if (a.matches(":hover")) {
              vv.currentTime = 0;
              vv.play().catch(() => {});
            }
          });
        }
        vv.preload = "auto";
        vv.play().catch(() => {});
      };
      const stopPreview = () => {
        const vv = a.querySelector("video");
        if (!vv) return;
        vv.pause();
        try {
          vv.currentTime = 0;
        } catch {
          /* storage or clipboard blocked: nothing to do */
        }
      };
      a.addEventListener("mouseenter", startPreview);
      a.addEventListener("mouseleave", stopPreview);
      a.addEventListener("focus", startPreview);
      a.addEventListener("blur", stopPreview);
      const open = () => openLB("video", i);
      a.addEventListener("click", open);
      a.addEventListener("keydown", e => {
        if (e.key === "Enter") open();
      });
      grid.appendChild(a);
    });

    /* filters */
    const cats = ["All", ...new Set(WORK.map(w => w.cat))];
    cats.forEach(c => {
      const b = document.createElement("button");
      b.textContent = c === "All" ? tr("all", "All") : c;
      b.setAttribute("aria-pressed", c === "All");
      b.onclick = () => {
        $$("#filters button").forEach(x => x.setAttribute("aria-pressed", x === b));
        $$("#grid .item").forEach(it => it.classList.toggle("hide", c !== "All" && it.dataset.cat !== c));
      };
      $("#filters").appendChild(b);
    });

    /* clients */
    const cl = DISCIPLINES.concat(DISCIPLINES)
      .map((c, i) => `<span class="${i % 2 ? "s" : ""}">${c}</span>`)
      .join("");
    $("#clientTrack").innerHTML = cl;
    $("#clientTrack2").innerHTML = cl;

    /* gallery: the first photos are already in the HTML (rendered at build); "Show more" adds the rest */
    const gal = $("#gallery"),
      STEP = ARCHIVE.photoStep || 12;
    /* an image that failed before this script ran never fires "error" again: check it once */
    const guard = (im, swap) => {
      if (im.complete && !im.naturalWidth) swap();
      else im.addEventListener("error", swap, { once: true });
    };
    const photoPh = (p, i) => {
      const x = ph(p.src.split("/").pop(), i);
      x.style.setProperty("--ar", p.ar);
      return x;
    };
    [...gal.children].forEach((d, i) => {
      const im = d.querySelector("img");
      if (im) guard(im, () => im.replaceWith(photoPh(PHOTOS[i], i)));
      d.onclick = () => openLB("photo", i);
    });
    let shown = gal.children.length;
    const addPhotos = () => {
      PHOTOS.slice(shown, shown + STEP).forEach((p, k) => {
        const i = shown + k,
          d = document.createElement("div");
        d.className = "ph-item";
        d.style.setProperty("--ar", p.ar);
        const im = img(p.src, p.src.split("/").pop(), i, p.alt || `Photograph ${i + 1}`);
        im.onerror = () => im.replaceWith(photoPh(p, i));
        d.appendChild(im);
        d.onclick = () => openLB("photo", i);
        gal.appendChild(d);
      });
      shown = Math.min(PHOTOS.length, shown + STEP);
      $("#moreBtn").style.display = shown >= PHOTOS.length ? "none" : "";
    };
    if (!shown) addPhotos();
    else $("#moreBtn").style.display = shown >= PHOTOS.length ? "none" : "";
    $("#moreBtn").onclick = addPhotos;

    /* design grid: rendered at build; here it only gets its click / keyboard handlers */
    [...$("#designGrid").children].forEach((a, i) => {
      const im = a.querySelector("img");
      if (im) guard(im, () => im.replaceWith(ph(DESIGN[i].src.split("/").pop(), i + 3)));
      const open = () => openLB("design", i);
      a.onclick = open;
      a.onkeydown = e => {
        if (e.key === "Enter") open();
      };
    });
  } /* end home page only */

  /* lightbox — "screening room": theme gradient backdrop, counter, viewfinder frame, filmstrip */
  const lb = $("#lb"),
    stage = $("#lbStage"),
    strip = $("#lbStrip");
  let mode, idx;
  const art = (m, i) => (m === "video" ? WORK[i].poster : m === "design" ? DESIGN[i].src : PHOTOS[i].src);
  const buildStrip = list => {
    if (!strip) return;
    strip.innerHTML = "";
    strip.hidden = mode === "reel" || list.length < 2;
    if (strip.hidden) return;
    list.forEach((_, i) => {
      const t = document.createElement("button");
      t.type = "button";
      t.className = "lb-th";
      t.setAttribute("aria-label", tr("open", "Open {n} of {total}", { n: i + 1, total: list.length }));
      const s = art(mode, i);
      if (s) t.style.backgroundImage = `url("${s}")`;
      t.onclick = () => {
        idx = i;
        render();
      };
      strip.appendChild(t);
    });
  };
  let quiet = false; // set by the arrow keys: the next frame appears without the fade
  const render = () => {
    stage.innerHTML = "";
    stage.classList.remove("in");
    if (!quiet) {
      void stage.offsetWidth;
      stage.classList.add("in");
    }
    quiet = false;
    const frame = document.createElement("div");
    frame.className = "lb-frame";
    if (mode === "reel") {
      $("#lbEye").textContent = tr("showreel", "Showreel");
      $("#lbTitle").textContent = SITE.name;
      $("#lbCount").textContent = "";
      frame.appendChild(
        vid(SITE.showreel, SITE.showreelPoster, "showreel.mp4 not uploaded yet", 0, {
          controls: true,
          autoplay: true,
          muted: false,
          loop: false,
        })
      );
      stage.appendChild(frame);
      return;
    }
    const list = mode === "video" ? WORK : mode === "design" ? DESIGN : PHOTOS;
    if (mode === "video") {
      const w = WORK[idx];
      $("#lbEye").textContent = `${tr("film", "Film")} · ${w.cat}`;
      $("#lbTitle").textContent = w.title;
      frame.appendChild(
        vid(w.video, w.poster, `${w.video.split("/").pop()} not uploaded yet`, idx + 1, {
          controls: true,
          autoplay: true,
          muted: false,
          loop: false,
        })
      );
    } else if (mode === "design") {
      const d = DESIGN[idx];
      $("#lbEye").textContent = `${tr("design", "Design")} · ${d.cat}`;
      $("#lbTitle").textContent = d.title;
      frame.appendChild(img(d.src, `${d.src.split("/").pop()} not uploaded yet`, idx + 3, d.title));
    } else {
      $("#lbEye").textContent = tr("stills", "Stills");
      $("#lbTitle").textContent = `${tr("photograph", "Photograph")} ${idx + 1}`;
      frame.appendChild(
        img(PHOTOS[idx].src, `${PHOTOS[idx].src.split("/").pop()} not uploaded yet`, idx, `Photograph ${idx + 1}`)
      );
    }
    frame.insertAdjacentHTML(
      "beforeend",
      '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>'
    );
    stage.appendChild(frame);
    $("#lbCount").innerHTML = `<b>${String(idx + 1).padStart(2, "0")}</b> / ${String(list.length).padStart(2, "0")}`;
    const prev = document.createElement("button"),
      next = document.createElement("button");
    prev.className = "lb-nav lb-prev";
    next.className = "lb-nav lb-next";
    prev.textContent = "←";
    next.textContent = "→";
    prev.setAttribute("aria-label", tr("prev", "Previous"));
    next.setAttribute("aria-label", tr("next", "Next"));
    prev.onclick = () => {
      idx = (idx - 1 + list.length) % list.length;
      render();
    };
    next.onclick = () => {
      idx = (idx + 1) % list.length;
      render();
    };
    stage.append(prev, next);
    if (strip && !strip.hidden) {
      [...strip.children].forEach((t, i) => t.classList.toggle("on", i === idx));
      const t = strip.children[idx];
      if (t) strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: "smooth" });
    } // scroll the strip only, never the page
  };
  /* while open: focus moves into the viewer, Tab stays inside it, the page behind is inert; focus returns on close */
  let lastFocus = null;
  const behind = () => [...document.body.children].filter(x => x !== lb && x.tagName !== "SCRIPT");
  const openLB = (window.__openLB = (m, i = 0) => {
    mode = m;
    idx = i;
    lastFocus = document.activeElement;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    behind().forEach(x => (x.inert = true));
    buildStrip(m === "video" ? WORK : m === "design" ? DESIGN : m === "photo" ? PHOTOS : []);
    render();
    setTimeout(() => $("#lbClose").focus({ preventScroll: true }), 30);
  });
  const closeLB = () => {
    if (!lb.classList.contains("open") || lb.classList.contains("closing")) return;
    // the page comes back at once (scroll, focus); the viewer fades out over 200ms on top of it
    document.body.style.overflow = "";
    behind().forEach(x => (x.inert = false));
    $("#sheet").inert = !document.body.classList.contains("menu");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    const done = () => {
      lb.classList.remove("open", "closing");
      lb.style.pointerEvents = "";
      stage.innerHTML = "";
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    lb.style.pointerEvents = "none";
    lb.classList.add("closing");
    setTimeout(done, 200);
  };
  $("#lbClose").onclick = closeLB;
  lb.addEventListener("click", e => {
    if (e.target === lb || e.target === stage) closeLB();
  });
  addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLB();
    // arrow keys step through without the fade: keyboard actions never animate
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      quiet = true;
      $(e.key === "ArrowRight" ? ".lb-next" : ".lb-prev")?.click();
    }
  });
  if (HOME) $("#playReel").onclick = () => openLB("reel");

  /* nav: the solid header is set in 02-site.js with the progress bar */
  /* mobile menu: while closed it is inert, so Tab and screen readers skip its links */
  const sheet = $("#sheet"),
    burger = $("#burger");
  const menu = o => {
    document.body.classList.toggle("menu", o);
    sheet.inert = !o;
    burger.setAttribute("aria-expanded", String(o));
  };
  window.__menu = menu;
  menu(false);
  burger.onclick = () => menu(!document.body.classList.contains("menu"));
  addEventListener("keydown", e => {
    if (e.key === "Escape" && document.body.classList.contains("menu")) {
      menu(false);
      burger.focus();
    }
  });
  $$("#sheet a").forEach(
    a =>
      (a.onclick = () => {
        menu(false);
      })
  ); // braces: returning false would cancel the link

  /* copy helpers */
  const copy = async (text, hintEl, okText, resetText) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      /* storage or clipboard blocked: nothing to do */
    }
    hintEl.textContent = ok ? okText : tr("selectToCopy", "Select to copy");
    setTimeout(() => (hintEl.textContent = resetText), 2000);
  };
  if (HOME) {
    $("#copyMail").onclick = () => copy(SITE.email, $("#copyHint"), tr("copied", "Copied ✓"), tr("copy", "Copy"));

    /* brief form: no server — builds a brief the visitor copies and sends */
    $("#brief").addEventListener("submit", e => {
      e.preventDefault();
      const f = e.target;
      if (!f.name.value.trim()) {
        const st = $("#saveStatus");
        st.textContent = tr("addName", "Please add your name.");
        st.dataset.tone = "warn";
        f.name.setAttribute("aria-invalid", "true");
        f.name.setAttribute("aria-describedby", "saveStatus");
        f.name.focus();
        return;
      }
      const svcs = [...f.querySelectorAll("input[name=svc]:checked")].map(x => x.value).join(", ") || "—";
      $("#outText").textContent = `Name: ${f.name.value}
Company: ${f.company.value || "—"}
Email: ${f.email.value || "—"}
Services: ${svcs}
Timeline: ${f.timeline.value}${LANG === "en" ? "" : `\nPreferred language: ${SITE_DATA.langName || LANG}`}

${f.msg.value || ""}`;
      $("#out").classList.add("show");
      Object.assign($("#saveStatus"), { textContent: tr("briefReady", "Brief ready below.") }).dataset.tone = "ok";
      f.name.removeAttribute("aria-invalid");
    });
    $("#copyBrief").onclick = e =>
      copy($("#outText").textContent, e.target, tr("copied", "Copied ✓"), tr("copyBrief", "Copy brief"));
  } /* end home page only */

  /* wordmark fit */
  const fitWM = () => {
    const el = $("#wm");
    el.style.fontSize = "100px";
    const w = el.firstElementChild.offsetWidth;
    el.style.fontSize = ((100 * document.documentElement.clientWidth) / w) * 0.96 + "px";
  };

  /* archive counts: shown as final numbers at rest (no scroll-triggered motion) */
  [
    ["[data-count-work]", WORK],
    ["[data-count-photo]", PHOTOS],
    ["[data-count-design]", DESIGN],
  ].forEach(([sel, list]) => $(sel) && ($(sel).textContent = list.length));

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    fitWM();
    document.body.classList.add("ready");
  });
  addEventListener("resize", fitWM);
})();
