/* ===== Intro trailer =====
   Full-screen opening: random clips from WORK play a few seconds each like a trailer, under film grain,
   a soft blur and a running film-strip border. Moving the cursor to the centre focuses the picture and
   reveals the logo + "Go to site"; on touch screens it appears by itself. Shown once per visit. */
const INTRO = { enabled: true, clipSeconds: 3.2, oncePerVisit: true };
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
    document.body.classList.add("intro-on");
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
    const enter = () => {
      if (box.classList.contains("out")) return;
      try {
        sessionStorage.setItem("sr-intro", "1");
      } catch {
        /* storage or clipboard blocked: nothing to do */
      }
      box.classList.add("out");
      document.body.classList.remove("intro-on");
      clearInterval(timer);
      clearInterval(tick);
      setTimeout(() => {
        box.querySelectorAll("video").forEach(v => v.pause());
        box.remove();
        document
          .querySelector(".hero video")
          ?.play?.()
          .catch(() => {});
      }, 1000);
      document.getElementById("top")?.focus?.();
    };
    document.getElementById("introGo").addEventListener("click", enter);
    document.getElementById("introSkip").addEventListener("click", enter);
    box.addEventListener("click", e => {
      if (box.classList.contains("focus") && !e.target.closest(".skip")) enter();
    });
    addEventListener("keydown", function k(e) {
      if (!document.getElementById("intro")) return removeEventListener("keydown", k);
      if (["Enter", " ", "Escape"].includes(e.key)) {
        e.preventDefault();
        enter();
      }
    });
    setTimeout(() => document.getElementById("introGo").focus({ preventScroll: true }), 50);
  }
})();
