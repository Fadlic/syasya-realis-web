/* ===== Scroll reveal, smooth section navigation, inertial wheel scrolling =====
   1) Content fades up softly the first time it enters the screen (once; never again on the way back).
      Items that arrive together follow each other by a few frames. Once arrived, the classes are removed
      so the element is exactly as before (hover transitions included).
   2) Links to a section of this page glide there on an eased curve and land below the fixed nav.
      A wheel, touch or key during the glide hands control straight back to the visitor.
   3) On desktop the mouse wheel eases the page toward its target instead of stepping.
   Reduced motion: nothing is hidden, links jump instantly and the wheel scrolls natively. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = s => [...document.querySelectorAll(s)];

  /* ---------- 1. reveal ---------- */
  const SEL = [
    "main section .eyebrow",
    "main section .h2",
    "main section .lead",
    "#gallery > .ph-item",
    "#designGrid .d-item",
    "#manifesto .mf",
    "#about .facts > div",
    "#services .svc",
    "#process .step",
    "#contact .big",
    "#contact .reach > *",
    "footer .fgrid > div",
    "#wm",
  ].join(",");

  if (!reduce && "IntersectionObserver" in window) {
    const done = el => {
      el.classList.remove("rv", "rv-in");
      el.style.removeProperty("--rv-d");
    };
    const io = new IntersectionObserver(
      es => {
        let i = 0;
        es.forEach(e => {
          if (!e.isIntersecting) return;
          const el = e.target;
          io.unobserve(el);
          const d = Math.min(i++, 5) * 0.07;
          el.style.setProperty("--rv-d", `${d}s`);
          el.classList.add("rv-in");
          setTimeout(() => done(el), (d + 1) * 1000);
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    const watch = () =>
      $$(SEL).forEach(el => {
        if (el._rv) return;
        el._rv = 1;
        el.classList.add("rv");
        io.observe(el);
      });
    watch();
    const gal = document.getElementById("gallery");
    if (gal) new MutationObserver(watch).observe(gal, { childList: true }); // "Show more photos"
  }

  /* ---------- 2. smooth section navigation ---------- */
  const html = document.documentElement;
  const navH = () => parseFloat(getComputedStyle(html).scrollPaddingTop) || 0;
  const ease = t => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2); // quart in-out
  let stop = null;

  const glide = target => {
    const y = Math.max(0, target.getBoundingClientRect().top + scrollY - navH());
    if (reduce) return scrollTo({ top: y, behavior: "instant" });
    stop && stop();
    const from = scrollY,
      dist = y - from,
      dur = Math.min(1400, Math.max(600, Math.abs(dist) * 0.35)),
      t0 = performance.now();
    let raf;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto"; // each frame is set exactly; CSS smoothing would fight it
    const end = () => {
      cancelAnimationFrame(raf);
      html.style.scrollBehavior = prev;
      ["wheel", "touchstart", "keydown"].forEach(ev => removeEventListener(ev, end));
      stop = null;
    };
    ["wheel", "touchstart", "keydown"].forEach(ev => addEventListener(ev, end, { passive: true }));
    stop = end;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      scrollTo(0, from + dist * ease(p));
      if (p < 1) raf = requestAnimationFrame(step);
      else end();
    };
    raf = requestAnimationFrame(step);
  };

  /* ---------- 3. inertial wheel scrolling (mouse and trackpad on desktop only) ----------
     The wheel sets a target; the page eases toward it a little each frame, so scrolling flows instead of
     stepping. Anything else that scrolls (keys, scrollbar, the section glide, a locked page, an inner
     scroll box, pinch-zoom) is left to the browser and simply re-syncs the target. */
  if (!reduce && matchMedia("(pointer: fine)").matches) {
    let target = scrollY,
      cur = scrollY,
      written = -1,
      running = false,
      last = 0;
    const max = () => html.scrollHeight - innerHeight;
    const locked = () =>
      document.body.classList.contains("intro-on") ||
      getComputedStyle(document.body).overflowY === "hidden" ||
      getComputedStyle(html).overflowY === "hidden";
    const scrollsInside = el => {
      for (; el && el !== document.body && el !== html; el = el.parentElement) {
        const o = getComputedStyle(el).overflowY;
        if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight) return true;
      }
      return false;
    };
    const halt = () => {
      running = false;
      html.style.scrollBehavior = "";
    };
    const frame = now => {
      if (!running) return;
      if (written >= 0 && Math.abs(scrollY - written) > 2) return halt(); // something else moved the page
      const dt = Math.min(64, now - (last || now - 16.7));
      last = now;
      cur += (target - cur) * (1 - Math.pow(1 - 0.1, dt / 16.7));
      if (Math.abs(target - cur) < 0.5) cur = target;
      scrollTo(0, cur);
      written = scrollY;
      if (cur === target) return halt();
      requestAnimationFrame(frame);
    };
    addEventListener(
      "wheel",
      e => {
        if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        if (locked() || scrollsInside(e.target)) return;
        e.preventDefault();
        stop && stop(); // a wheel turn takes over from a section glide
        if (!running) target = cur = scrollY;
        const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
        target = Math.max(0, Math.min(max(), target + e.deltaY * k));
        if (!running) {
          running = true;
          written = -1;
          last = 0;
          html.style.scrollBehavior = "auto";
          requestAnimationFrame(frame);
        }
      },
      { passive: false }
    );
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("a[href*='#']");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const id = decodeURIComponent(url.hash.slice(1));
    const target = id === "top" ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, "", url.hash);
    // let the mobile menu close first, then glide
    requestAnimationFrame(() => {
      if (target === document.body) glide(html);
      else glide(target);
      // move focus for keyboard and screen-reader users without a second jump
      if (target !== document.body) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });
})();
