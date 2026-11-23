/* ===== Intro trailer =====
   Full-screen opening: random clips from WORK play a few seconds each like a trailer, under film grain,
   a soft blur and a running film-strip border. Moving the cursor to the centre focuses the picture and
   reveals the logo + "Go to site"; on touch screens it appears by itself. Shown once per visit. */
const INTRO = Object.assign({ enabled: true, clipSeconds: 3.2, oncePerVisit: true }, SITE_DATA.intro); // set in the admin Content panel
(() => {
  const box0 = document.getElementById("intro");
  if (!box0) return;
  const TPL = box0.outerHTML,
    HOME = { parent: box0.parentNode, next: box0.nextSibling };
  const done = (() => {
    try {
      if (sessionStorage.getItem("sr-intro-replay") === "1") {
        sessionStorage.removeItem("sr-intro-replay");
        return false;
      } // logo clicked on another page
      return INTRO.oncePerVisit && sessionStorage.getItem("sr-intro") === "1";
    } catch {
      return false;
    }
  })();
  // the logo opens the landing again (see brand click handler)
  window.__playIntro = () => {
    if (!INTRO.enabled || document.getElementById("intro")) return false;
    const t = document.createElement("div");
    t.innerHTML = TPL;
    const nb = t.firstElementChild;
    HOME.parent.insertBefore(nb, HOME.next && HOME.next.parentNode ? HOME.next : HOME.parent.firstChild);
    run(nb);
    return true;
  };
  if (!INTRO.enabled || done) {
    box0.remove();
    return;
  }
  run(box0);
  function run(box) {
    // the landing always opens the site at its top, not at a restored scroll position
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollTo(0, 0);
    document.body.classList.add("intro-on");
    // the page behind the trailer is out of reach for Tab and screen readers until the visitor enters
    const behind = [...document.body.children].filter(el => el !== box && !el.contains(box) && el.tagName !== "SCRIPT");
    behind.forEach(el => (el.inert = true));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches,
      touch = matchMedia("(hover: none)").matches;
    const tones = [
      "linear-gradient(135deg,#3A0D12,#0E0B0A)",
      "linear-gradient(160deg,#16252E,#0C0A09)",
      "linear-gradient(135deg,#2E0B10,#0D0B0A)",
      "linear-gradient(200deg,#1B3442,#0C0A0A)",
      "linear-gradient(150deg,#3B1016,#0E0B0A)",
    ];
    const list = WORK.map((w, i) => ({ ...w, i })).sort(() => Math.random() - 0.5);
    const reel = document.getElementById("introReel"),
      cap = document.getElementById("introCap"),
      cut = document.getElementById("introCut");
    // edge print on the strips
    // one segment per frame: 8 perforations + its frame number, repeated twice for a seamless loop
    const frames = Math.max(12, Math.ceil(innerWidth / 240) + 2);
    const segs = Array.from({ length: frames }, (_, k) => {
      const n = String(k + 1).padStart(2, "0");
      return `<div class="seg"><span>S&amp;R 400 <b>▸ ${n}</b> ${n}A</span></div>`;
    }).join("");
    document.getElementById("trackT").innerHTML = segs + segs;
    document.getElementById("trackB").innerHTML = segs + segs;
    // the strip advances exactly one frame (8 perforations) per clip, so the moving numbers keep time with the trailer
    ["trackT", "trackB"].forEach(
      id => (document.getElementById(id).style.animationDuration = frames * INTRO.clipSeconds + "s")
    );
    const make = w => {
      const c = document.createElement("div");
      c.className = "clip";
      const ph = document.createElement("div");
      ph.className = "ph";
      ph.style.setProperty("--g", tones[w.i % tones.length]);
      c.appendChild(ph);
      const v = document.createElement("video");
      Object.assign(v, { muted: true, playsInline: true, preload: "auto" });
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      if (w.poster) v.poster = w.poster;
      const src = document.createElement("source");
      src.src = w.video;
      src.type = "video/mp4";
      src.onerror = () => v.remove();
      v.appendChild(src);
      v.addEventListener("loadedmetadata", () => {
        if (v.duration > 8) v.currentTime = Math.random() * Math.max(0, Math.min(v.duration - 5, 40));
      });
      c.appendChild(v);
      reel.appendChild(c);
      return c;
    };
    const clips = list.map(make);
    let k = 0,
      timer;
    const show = n => {
      clips.forEach((c, j) => {
        c.classList.toggle("on", j === n);
        const v = c.querySelector("video");
        if (v) {
          if (j === n) v.play().catch(() => {});
          else v.pause();
        }
      });
      const w = list[n];
      cap.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = String(w.i + 1).padStart(2, "0");
      cap.append(b, `${w.title} · ${w.cat}`);
      cut.classList.remove("go");
      void cut.offsetWidth;
      cut.classList.add("go");
    };
    show(0);
    if (!reduce)
      timer = setInterval(() => {
        k = (k + 1) % clips.length;
        show(k);
      }, INTRO.clipSeconds * 1000);
    // timecode
    const t0 = performance.now(),
      pad = n => String(n).padStart(2, "0"),
      tc = document.getElementById("introTc");
    const tick = setInterval(() => {
      const ms = performance.now() - t0,
        s = Math.floor(ms / 1000);
      tc.textContent = `00:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(Math.floor(ms / 40) % 25)}`;
    }, 40);
    // centre focus
    const focus = on => box.classList.toggle("focus", on);
    if (touch || reduce) setTimeout(() => focus(true), 1500);
    else
      box.addEventListener("mousemove", e => {
        const dx = e.clientX - innerWidth / 2,
          dy = e.clientY - innerHeight / 2;
        focus(Math.hypot(dx / innerWidth, dy / innerHeight) < 0.2 || e.target.closest(".go"));
      });
    const goBtn = document.getElementById("introGo");
    const goCentre = () => {
      const r = goBtn?.getBoundingClientRect();
      return r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] : [innerWidth / 2, innerHeight / 2];
    };
    const ease = "cubic-bezier(0.23, 1, 0.32, 1)";

    /* the current frame cracks from (x, y), the shards fly out and the site zooms in behind them */
    const shatter = (x, y, finish) => {
      const W = innerWidth,
        H = innerHeight,
        dpr = Math.min(devicePixelRatio || 1, 2);
      const cv = document.createElement("canvas");
      cv.width = W * dpr;
      cv.height = H * dpr;
      const g = cv.getContext("2d");
      g.scale(dpr, dpr);
      const fallback = () => {
        g.fillStyle = "#0e0b0a";
        g.fillRect(0, 0, W, H);
        const lg = g.createLinearGradient(0, 0, W, H);
        lg.addColorStop(0, "#3A0D12");
        lg.addColorStop(1, "#0E0B0A");
        g.fillStyle = lg;
        g.fillRect(0, 0, W, H);
      };
      const v = box.querySelector(".clip.on video");
      try {
        if (!v || v.readyState < 2) throw 0;
        const s = Math.max(W / v.videoWidth, H / v.videoHeight),
          vw = v.videoWidth * s,
          vh = v.videoHeight * s;
        g.drawImage(v, (W - vw) / 2, (H - vh) / 2, vw, vh);
      } catch {
        fallback();
      }
      const R = Math.hypot(W, H);
      const vg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, R / 2);
      vg.addColorStop(0.45, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      g.fillStyle = vg;
      g.fillRect(0, 0, W, H);
      const url = cv.toDataURL("image/jpeg", 0.82);

      const layer = document.createElement("div");
      layer.className = "shards";
      layer.setAttribute("aria-hidden", "true");
      layer.style.transformOrigin = `${x}px ${y}px`;
      box.style.visibility = "hidden";

      // radial wedges cut into rings; boundary angles are shared so the shards tile with no holes
      const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
      const radii = [0, 0.07, 0.18, 0.34, 0.58, 1.2].map(r => r * R),
        SECT = 16,
        step = (Math.PI * 2) / SECT;
      const ang = radii.map(() => Array.from({ length: SECT }, (_, i) => i * step + (rnd() * 2 - 1) * 0.12));
      const pt = (j, i) => {
        const a = ang[j][i % SECT] + (i >= SECT ? Math.PI * 2 : 0);
        return [x + Math.cos(a) * radii[j], y + Math.sin(a) * radii[j]];
      };
      const anims = [];
      for (let j = 0; j < radii.length - 1; j++)
        for (let i = 0; i < SECT; i++) {
          const pts = j === 0 ? [[x, y], pt(1, i), pt(1, i + 1)] : [pt(j, i), pt(j, i + 1), pt(j + 1, i + 1), pt(j + 1, i)];
          const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length,
            cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
          // inset each point 0.5px toward the centroid so a hairline crack shows the site behind
          const poly = pts
            .map(([px, py]) => {
              const d = Math.hypot(px - cx, py - cy) || 1;
              return `${px - ((px - cx) / d) * 1.5}px ${py - ((py - cy) / d) * 1.5}px`;
            })
            .join(",");
          let ux = cx - x,
            uy = cy - y;
          const n = Math.hypot(ux, uy) || 1;
          ux /= n;
          uy /= n;
          if (j === 0 && n < 1) [ux, uy] = [Math.cos(i * step), Math.sin(i * step)];
          const dist = (0.5 + 0.6 * rnd()) * R,
            rot = (rnd() * 2 - 1) * 45,
            sc = 1.1 + 0.4 * rnd();
          const el = document.createElement("i");
          el.style.cssText = `background:url(${url}) 0 0/100% 100%;clip-path:polygon(${poly});transform-origin:${cx}px ${cy}px;filter:brightness(1.15)`;
          layer.appendChild(el);
          anims.push(
            el.animate(
              [
                { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
                // the crack: every shard snaps a few px apart, holds, then breaks away
                { transform: `translate(${ux * 5}px, ${uy * 5}px) rotate(${rot * 0.03}deg) scale(1)`, offset: 0.04 },
                { transform: `translate(${ux * 12}px, ${uy * 12}px) rotate(${rot * 0.08}deg) scale(1.02)`, opacity: 1, offset: 0.3, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
                { transform: `translate(${ux * dist}px, ${uy * dist}px) rotate(${rot}deg) scale(${sc})`, opacity: 0 },
              ],
              { duration: 1900, delay: j * 60, easing: "linear", fill: "forwards" }
            )
          );
        }
      document.body.appendChild(layer);
      // impact flash
      layer.animate([{ filter: "brightness(1.9)" }, { filter: "brightness(1)" }], { duration: 320, easing: ease });
      anims.push(
        layer.animate([{ transform: "scale(1)" }, { transform: "scale(1.6)" }], {
          duration: 2000,
          delay: 450,
          easing: "cubic-bezier(0.77, 0, 0.175, 1)",
          fill: "forwards",
        })
      );
      // the website falls into place behind the shards; "backwards" so no transform lingers on the sticky nav
      [...new Set(document.querySelectorAll("body > header, body > main, body > footer, #nav"))].forEach(el => {
        el.style.transformOrigin = el.tagName === "MAIN" ? `${x}px ${y + scrollY}px` : `${x}px 0`;
        el.animate(
          [
            { transform: "scale(1.15)", opacity: 0.15 },
            { transform: "scale(1)", opacity: 1 },
          ],
          { duration: 1300, delay: 700, easing: ease, fill: "backwards" }
        ).finished.then(() => (el.style.transformOrigin = ""));
      });
      let ended = false;
      const end = () => {
        if (ended) return;
        ended = true;
        layer.remove();
        finish();
      };
      Promise.all(anims.map(a => a.finished)).then(end, end);
      setTimeout(end, 2800);
    };

    const enter = (mode = "fade", x, y) => {
      if (box.classList.contains("out") || box.dataset.leaving) return;
      box.dataset.leaving = "1";
      try {
        sessionStorage.setItem("sr-intro", "1");
      } catch {
        /* storage or clipboard blocked: nothing to do */
      }
      document.body.classList.remove("intro-on");
      behind.forEach(el => (el.inert = false));
      clearInterval(timer);
      clearInterval(tick);
      const cleanup = () => {
        box.querySelectorAll("video").forEach(v => v.pause());
        box.remove();
        document
          .querySelector(".hero video")
          ?.play?.()
          .catch(() => {});
      };
      document.getElementById("top")?.focus?.({ preventScroll: true });
      if (mode === "shatter" && !reduce) {
        if (x == null || (!x && !y)) [x, y] = goCentre();
        try {
          return shatter(x, y, cleanup);
        } catch {
          box.style.visibility = "";
        }
      }
      box.classList.add("out");
      setTimeout(cleanup, 1000);
    };
    goBtn.addEventListener("click", e => {
      e.stopPropagation();
      enter("shatter", e.clientX, e.clientY);
    });
    document.getElementById("introSkip").addEventListener("click", e => {
      e.stopPropagation();
      enter("fade");
    });
    box.addEventListener("click", e => {
      if (box.classList.contains("focus") && !e.target.closest(".skip")) enter("shatter", e.clientX, e.clientY);
    });
    addEventListener("keydown", function k(e) {
      if (!document.getElementById("intro")) return removeEventListener("keydown", k);
      if (["Enter", " ", "Escape"].includes(e.key)) {
        e.preventDefault();
        enter(e.key === "Escape" ? "fade" : "shatter");
      }
    });
    setTimeout(() => document.getElementById("introGo").focus({ preventScroll: true }), 50);
  }
})();
