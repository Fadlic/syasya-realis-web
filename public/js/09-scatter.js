/* ===== Scroll scatter =====
   Cards and letters are loose while they enter from the bottom, settle exactly into place in the centre
   of the screen, and come loose again as they leave through the top. Tied 1:1 to scroll, no timers.
   Writes only translate / rotate / scale / opacity, so hover transforms keep working. */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  const gal = $("#gallery"),
    dgrid = $("#designGrid"),
    wm = $("#wm"),
    hero = $(".hero"),
    h1 = $(".hero h1");
  if (!gal && !dgrid && !wm && !h1) return;

  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const seed = (el, n) => {
    if (!el._sc) {
      // hash the small index into a spread-out seed and drop the first draws, which are correlated
      const r = rnd(((n * 2654435761) % 2147483646) + 1);
      r(), r(), r();
      el._sc = { u: [r(), r(), r()], a: -1 };
    }
    return el._sc;
  };

  /* split text into letters, keeping words together and inner wrappers (.serif, <br>) intact */
  const split = root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
      nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const letters = [];
    nodes.forEach(t => {
      const frag = document.createDocumentFragment();
      t.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(part);
        const w = document.createElement("span");
        w.className = "sc-w";
        [...part].forEach(ch => {
          const l = document.createElement("span");
          l.className = "sc-l";
          l.textContent = ch;
          w.appendChild(l);
          letters.push(l);
        });
        frag.appendChild(w);
      });
      t.replaceWith(frag);
    });
    return letters;
  };

  // [translate X, translate Y base, Y extra, rotate, scale drop, opacity drop]; px for cards, em for letters
  const CARD = [180, 80, 170, 16, 0.14, 0.45],
    WM = [0.7, 0.4, 0.9, 45, 0, 0.6],
    HERO = [0.6, 0.4, 1, 40, 0, 0.7];

  let wmLetters = [],
    heroLetters = [];
  if (wm && wm.firstElementChild) wmLetters = split(wm.firstElementChild);
  if (h1) {
    h1.setAttribute("aria-label", h1.textContent.replace(/\s+/g, " ").trim());
    h1.querySelectorAll(".ln").forEach(ln => {
      ln.setAttribute("aria-hidden", "true");
      heroLetters.push(...split(ln.firstElementChild || ln));
    });
  }
  wmLetters.forEach((l, i) => seed(l, i + 101));
  heroLetters.forEach((l, i) => seed(l, i + 301));

  /* only what is on (or near) the screen is computed */
  const visible = new Set();
  const io = new IntersectionObserver(
    es => {
      es.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      onScroll(); // a jump (anchor link, Show more) brings cards in without a scroll frame
    },
    { rootMargin: "25% 0px" }
  );
  const watchCards = () => {
    if (gal) [...gal.children].forEach((c, i) => c.classList.contains("ph-item") && !c._sc && (seed(c, i + 1), io.observe(c)));
    if (dgrid) [...dgrid.querySelectorAll(".d-item")].forEach((c, i) => !c._sc && (seed(c, i + 51), io.observe(c)));
  };
  watchCards();
  if (gal) new MutationObserver(watchCards).observe(gal, { childList: true });
  if (wm) io.observe(wm);

  let em = new Map();
  const emOf = el => {
    if (!em.has(el)) em.set(el, parseFloat(getComputedStyle(el).fontSize) || 16);
    return em.get(el);
  };

  const amount = d => {
    d = Math.max(-1, Math.min(1, d));
    const m = Math.abs(d);
    return [m <= 0.15 ? 0 : ((m - 0.15) / 0.85) ** 1.6, Math.sign(d) || 1];
  };
  const write = (el, a, s, V, unit, k) => {
    const st = el._sc;
    if (a === st.a) return;
    st.a = a;
    if (!a) {
      el.style.translate = el.style.rotate = el.style.scale = el.style.opacity = "";
      return;
    }
    const [u1, u2, u3] = st.u;
    el.style.translate = `${(u1 * 2 - 1) * V[0] * unit * k * a}px ${s * (V[1] + u2 * V[2]) * unit * k * a}px`;
    el.style.rotate = `${(u3 * 2 - 1) * V[3] * k * a}deg`;
    if (V[4]) el.style.scale = 1 - V[4] * a;
    el.style.opacity = 1 - V[5] * a;
  };

  let queued = false;
  const render = () => {
    queued = false;
    const vh = innerHeight,
      k = innerWidth <= 700 ? 0.6 : 1,
      jobs = [];
    // read everything first, then write
    visible.forEach(el => {
      const r = el.getBoundingClientRect(),
        [a, s] = amount((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2));
      jobs.push([el, a, s]);
    });
    let heroA = 0;
    if (hero && heroLetters.length) heroA = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.7))) ** 2;
    const wmEm = wm && visible.has(wm) ? emOf(wm) : 0,
      heroEm = heroLetters.length && (heroA || heroLetters[0]._sc.a > 0) ? emOf(h1) : 0;

    jobs.forEach(([el, a, s]) => {
      if (el === wm) wmLetters.forEach(l => write(l, a, s, WM, wmEm, k));
      else write(el, a, s, CARD, 1, k);
    });
    if (heroEm) {
      // the line mask is only for the load entrance; let loose letters show outside it
      h1.classList.toggle("sc-loose", heroA > 0);
      heroLetters.forEach(l => write(l, heroA, -1, HERO, heroEm, k));
    }
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => {
    em = new Map();
    [...wmLetters, ...heroLetters, ...$$("#gallery .ph-item, #designGrid .d-item")].forEach(el => el._sc && (el._sc.a = -1));
    onScroll();
  });
  // the wordmark is re-fitted after fonts load; measure again then
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    em = new Map();
    onScroll();
  });
  render();
})();
