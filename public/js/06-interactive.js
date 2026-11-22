/* ===================== INTERACTIVE (viewfinder · projector reel · graded manifesto) ===================== */
(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches,
    fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  /* run an animation only while its element is on (or near) the screen */
  const whileVisible = (el, cb, margin = "200px") => {
    if (!("IntersectionObserver" in window)) return cb(true);
    new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
  };

  /* ---------- A. viewfinder cursor ---------- */
  if (fine) {
    document.body.classList.add("vf-on");
    const vf = document.createElement("div");
    vf.className = "vf";
    vf.innerHTML = '<i></i><i></i><i></i><i></i><span class="x"></span><span class="read"></span>';
    document.body.appendChild(vf);
    const read = vf.querySelector(".read");
    let mx = innerWidth / 2,
      my = innerHeight / 2,
      cx = mx,
      cy = my,
      cw = 46,
      ch = 46,
      target = null;
    const EXP = ["ƒ/1.8 · 1/250 · ISO 200", "ƒ/2.8 · 1/125 · ISO 400", "ƒ/4 · 1/60 · ISO 800", "ƒ/2 · 1/500 · ISO 100"];
    const MEDIA = ".pf, .ph-item, .d-item .shot, .grade";
    addEventListener(
      "mousemove",
      e => {
        if (document.body.classList.contains("intro-on")) return;
        mx = e.clientX;
        my = e.clientY;
        const t = e.target.closest(MEDIA);
        if (t !== target) {
          target = t;
          if (t) {
            const isVid = t.matches(".pf");
            read.innerHTML = (isVid ? "<b>● REC</b> 24 fps · " : "") + EXP[(Math.random() * EXP.length) | 0];
          }
        }
        vf.classList.toggle("link", !t && !!e.target.closest("a, button, label, summary"));
      },
      { passive: true }
    );
    (function loop() {
      let tx = mx,
        ty = my,
        tw = vf.classList.contains("link") ? 30 : 46,
        th = tw;
      if (target) {
        const r = target.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
        tw = r.width + 16;
        th = r.height + 16;
        vf.classList.add("lock");
      } else vf.classList.remove("lock");
      const k = target ? 0.22 : 0.35;
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      cw += (tw - cw) * 0.2;
      ch += (th - ch) * 0.2;
      vf.style.transform = `translate(${cx - cw / 2}px, ${cy - ch / 2}px)`;
      vf.style.width = cw + "px";
      vf.style.height = ch + "px";
      requestAnimationFrame(loop);
    })();
    vf.style.left = vf.style.top = "0";
    vf.style.transition = "opacity .3s";
    addEventListener("mousedown", e => {
      const t = e.target.closest(MEDIA);
      if (!t) return;
      vf.classList.add("focusing");
      const s = document.createElement("i");
      s.className = "shut";
      (t.querySelector(".fr") || t).appendChild(s);
      requestAnimationFrame(() => s.classList.add("go"));
      setTimeout(() => s.remove(), 300);
    });
    addEventListener("mouseup", () => vf.classList.remove("focusing"));
    document.addEventListener("mouseleave", () => (vf.style.opacity = 0));
    document.addEventListener("mouseenter", () => (vf.style.opacity = 1));
  }

  /* ---------- B. projector reel ---------- */
  if ($("#proj")) {
    /* home page only (Astro) */
    const proj = $("#proj"),
      track = $("#projTrack"),
      n = WORK.length;
    proj.style.setProperty("--n", n);
    $("#filters").style.display = "none";
    /* the frames are rendered at build (src/pages/index.astro); here they get their media checks and handlers */
    const frames = [...track.children];
    frames.forEach((f, i) => {
      const phd = f.querySelector(".ph"),
        v = f.querySelector("video");
      if (v) {
        const gone = () => v.remove(),
          ready = () => phd && phd.remove();
        v.preload = "metadata"; // the HTML says "none" so the reel does not compete with the first view
        if (v.readyState >= 2) ready();
        else v.addEventListener("loadeddata", ready, { once: true });
        if (v.networkState === 3) gone();
        else v.querySelector("source")?.addEventListener("error", gone, { once: true });
      }
      const open = () => window.__openLB && window.__openLB("video", i);
      f.addEventListener("click", open);
      f.addEventListener("keydown", e => {
        if (e.key === "Enter") open();
      });
    });
    let cur = -1;
    const size = () => {
      const fw = Math.min(innerWidth < 700 ? innerWidth * 0.84 : innerWidth * 0.58, 980);
      frames.forEach(f => f.style.setProperty("--fw", fw + "px"));
      return fw;
    };
    size();
    addEventListener("resize", () => {
      size();
      onScroll();
    });
    const onScroll = () => {
      const r = proj.getBoundingClientRect(),
        total = proj.offsetHeight - innerHeight,
        p = Math.min(1, Math.max(0, -r.top / total));
      const pos = p * (n - 1);
      const a = Math.floor(pos),
        fr0 = Math.min(1, Math.max(0, (pos - a - 0.3) / 0.4)),
        ez = fr0 * fr0 * (3 - 2 * fr0),
        b = Math.min(n - 1, a + 1),
        c = x => frames[x].offsetLeft + frames[x].offsetWidth / 2,
        ctr = c(a) + (c(b) - c(a)) * ez;
      track.style.transform = `translateX(${innerWidth / 2 - ctr}px)`;
      $("#projBar").style.width = p * 100 + "%";
      const i = Math.round(pos),
        _ = 0;
      if (i !== cur) {
        cur = i;
        frames.forEach((f, j) => {
          f.classList.toggle("on", j === i);
          const v = f.querySelector("video");
          if (v) {
            if (j === i && r.top < innerHeight && r.bottom > 0) v.play().catch(() => {});
            else v.pause();
          }
        });
        const w = WORK[i];
        $("#projNo").textContent = `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
        const t = $("#projTitle");
        t.textContent = "";
        const parts = w.title.split(" — ");
        t.append(parts[0]);
        if (parts[1]) {
          t.append(" — ");
          const em = document.createElement("i");
          em.textContent = parts[1];
          t.append(em);
        }
        $("#projCat").textContent = [w.cat, ...w.tags.filter(t => t.toLowerCase() !== w.cat.toLowerCase())].join(" · ");
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    // dust in the beam
    const cv = $("#dust"),
      cx2 = cv.getContext("2d");
    let motes = [];
    const fit = () => {
      cv.width = cv.offsetWidth;
      cv.height = cv.offsetHeight;
      motes = Array.from({ length: innerWidth < 700 ? 35 : 70 }, () => ({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        r: Math.random() * 1.6 + 0.3,
        v: Math.random() * 0.25 + 0.05,
        a: Math.random() * 0.6 + 0.2,
      }));
    };
    fit();
    addEventListener("resize", fit);
    let dustOn = false,
      dustRunning = false;
    const dust = () => {
      if (!dustOn || reduce) {
        dustRunning = false;
        return;
      }
      cx2.clearRect(0, 0, cv.width, cv.height);
      motes.forEach(m => {
        m.y -= m.v;
        m.x += Math.sin((m.y + m.r * 50) / 40) * 0.2;
        if (m.y < -5) m.y = cv.height + 5;
        cx2.globalAlpha = m.a;
        cx2.fillStyle = "#EEF6FB";
        cx2.beginPath();
        cx2.arc(m.x, m.y, m.r, 0, 7);
        cx2.fill();
      });
      requestAnimationFrame(dust);
    };
    whileVisible(cv, v => {
      dustOn = v;
      if (v && !dustRunning) {
        dustRunning = true;
        requestAnimationFrame(dust);
      }
    });
  } /* end projector reel */

  /* ---------- C. raw → graded manifesto ---------- */
  if ($("#grade")) {
    /* home page only (Astro) */
    const grade = $("#grade"),
      raw = $("#gradeRaw"),
      fin = $("#gradeFin");
    const scene = (c, graded) => {
      if (!c.offsetWidth || !c.offsetHeight) return;
      const w = (c.width = c.offsetWidth * devicePixelRatio),
        h = (c.height = c.offsetHeight * devicePixelRatio),
        x = c.getContext("2d"),
        r = rnd(11);
      const sky = x.createLinearGradient(0, 0, 0, h);
      if (graded) {
        sky.addColorStop(0, "#0B2533");
        sky.addColorStop(0.55, "#3F86AC");
        sky.addColorStop(0.72, "#E8A86B");
        sky.addColorStop(1, "#3A0509");
      } else {
        sky.addColorStop(0, "#5d6266");
        sky.addColorStop(0.6, "#8c9092");
        sky.addColorStop(1, "#6b6a68");
      }
      x.fillStyle = sky;
      x.fillRect(0, 0, w, h);
      x.globalAlpha = graded ? 0.9 : 0.5;
      x.fillStyle = graded ? "#FFD9A0" : "#b8b8b5";
      x.filter = `blur(${w / 120}px)`;
      x.beginPath();
      x.arc(w * 0.68, h * 0.62, w * 0.06, 0, 7);
      x.fill();
      x.filter = "none";
      x.globalAlpha = 1;
      const layers = graded
        ? ["#1B3442", "#16252E", "#3A0509", "#0A0807"]
        : ["#6e7173", "#5d6062", "#4c4e4f", "#3a3b3b"];
      layers.forEach((col, k) => {
        x.fillStyle = col;
        x.beginPath();
        x.moveTo(0, h);
        const base = h * (0.6 + k * 0.1);
        for (let px = 0; px <= w; px += w / 40)
          x.lineTo(px, base - Math.sin((px / w) * (3 + k) + k) * h * (0.08 - k * 0.012) - r() * h * 0.02);
        x.lineTo(w, h);
        x.fill();
      });
      x.globalAlpha = graded ? 0.07 : 0.12;
      for (let i = 0; i < 6000; i++) {
        x.fillStyle = r() > 0.5 ? "#fff" : "#000";
        x.fillRect(r() * w, r() * h, devicePixelRatio, devicePixelRatio);
      }
      x.globalAlpha = 1;
    };
    /* paint only when the section is near the screen, and at most once per size */
    let painted = "",
      near = false;
    const paintGrade = () => {
      if (!near) return;
      const key = grade.offsetWidth + "x" + grade.offsetHeight;
      if (key === painted) return;
      painted = key;
      scene(raw, false);
      scene(fin, true);
    };
    let paintT;
    const paintSoon = () => {
      cancelAnimationFrame(paintT);
      paintT = requestAnimationFrame(paintGrade);
    };
    addEventListener("resize", paintSoon);
    if (window.ResizeObserver) new ResizeObserver(paintSoon).observe(grade);
    let gx = 50,
      gt = 50,
      auto = true;
    const setX = v => {
      gx = v;
      grade.style.setProperty("--x", v + "%");
    };
    grade.addEventListener("pointermove", e => {
      auto = false;
      const r = grade.getBoundingClientRect();
      gt = Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100));
    });
    grade.addEventListener("pointerleave", () => {
      auto = true;
    });
    let gRunning = false;
    const g = () => {
      if (!near) {
        gRunning = false;
        return;
      }
      if (auto && !reduce) gt = 50 + Math.sin(performance.now() / 1800) * 18;
      setX(gx + (gt - gx) * 0.12);
      requestAnimationFrame(g);
    };
    whileVisible(
      grade,
      v => {
        near = v;
        if (v) {
          paintSoon();
          if (!gRunning) {
            gRunning = true;
            requestAnimationFrame(g);
          }
        }
      },
      "800px"
    ); // paint well before it scrolls in
  } /* end manifesto */
})();
