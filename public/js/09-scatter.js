/* ===== Scroll scatter =====
   Every section flows the same way: its heading letters and its cards are loose while they enter from the
   bottom, settle exactly into place in the centre of the screen, and come loose again as they leave through
   the top. Tied 1:1 to scroll, no timers. Writes only translate / rotate / scale / opacity, so hover
   transforms keep working. Form fields are left alone so typing is never disturbed. */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];

  // [translate X, translate Y base, Y extra, rotate, scale drop, opacity drop]; px for cards, em for letters
  const CARD = [180, 80, 170, 16, 0.14, 0.45],
    BLOCK = [90, 60, 110, 8, 0.06, 0.4], // large single blocks (manifesto) move less
    LETTERS = [0.7, 0.4, 0.9, 45, 0, 0.6],
    HERO = [0.6, 0.4, 1, 40, 0, 0.7];

  // cards: each one moves on its own; the selectors are queried again when the gallery grows
  const CARDS = [
    ["#gallery > .ph-item", CARD],
    ["#designGrid .d-item", CARD],
    ["#services .svc", CARD],
    ["#process .step", CARD],
    ["#about .facts > div", CARD],
    ["#contact .reach > *", CARD],
    ["footer .fgrid > div", CARD],
    ["#manifesto .mf", BLOCK],
  ];
  // letter groups: the group's position drives all its letters, so a heading assembles as one
  const HEADINGS = "main section .h2, #contact .big, #wm > span";

  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  let nSeed = 1;
  const seed = el => {
    if (!el._sc) {
      // hash a running index into a spread-out seed and drop the first draws, which are correlated
      const r = rnd(((nSeed++ * 2654435761) % 2147483646) + 1);
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
    letters.forEach(seed);
    return letters;
  };
  /* a heading keeps one readable name; its letters are hidden from screen readers */
  const splitHeading = el => {
    if (el.closest("[aria-hidden='true']")) return split(el);
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const box = document.createElement("span");
    box.setAttribute("aria-hidden", "true");
    box.append(...el.childNodes);
    el.appendChild(box);
    return split(box);
  };

  /* only what is on (or near) the screen is computed */
  const visible = new Set();
  let onScroll = () => {};
  const io = new IntersectionObserver(
    es => {
      es.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      onScroll(); // a jump (anchor link, Show more) brings cards in without a scroll frame
    },
    { rootMargin: "25% 0px" }
  );
  const watchCards = () =>
    CARDS.forEach(([sel, V]) =>
      $$(sel).forEach(c => {
        if (c._sc) return;
        seed(c)._v = V;
        io.observe(c);
      })
    );
  watchCards();
  const gal = $("#gallery");
  if (gal) new MutationObserver(watchCards).observe(gal, { childList: true });

  $$(HEADINGS).forEach(h => {
    h._letters = splitHeading(h);
    io.observe(h);
  });

  // the hero is on screen at load, so it follows scrollY instead: tidy at the top, loose as it leaves
  const hero = $(".hero"),
    h1 = $(".hero h1");
  let heroLetters = [];
  if (h1) {
    h1.setAttribute("aria-label", h1.textContent.replace(/\s+/g, " ").trim());
    h1.querySelectorAll(".ln").forEach(ln => {
      ln.setAttribute("aria-hidden", "true");
      heroLetters.push(...split(ln.firstElementChild || ln));
    });
  }

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
      jobs.push([el, a, s, el._letters ? emOf(el) : 1]);
    });
    let heroA = 0,
      heroEm = 0;
    if (hero && heroLetters.length) {
      heroA = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.7))) ** 2;
      if (heroA || heroLetters[0]._sc.a > 0) heroEm = emOf(h1);
    }

    jobs.forEach(([el, a, s, unit]) => {
      if (el._letters) el._letters.forEach(l => write(l, a, s, LETTERS, unit, k));
      else write(el, a, s, el._sc._v || CARD, 1, k);
    });
    if (heroEm) {
      // the line mask is only for the load entrance; let loose letters show outside it
      h1.classList.toggle("sc-loose", heroA > 0);
      heroLetters.forEach(l => write(l, heroA, -1, HERO, heroEm, k));
    }
  };
  onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  };
  const reset = () => {
    em = new Map();
    $$(".sc-l").forEach(l => l._sc && (l._sc.a = -1));
    CARDS.forEach(([sel]) => $$(sel).forEach(c => c._sc && (c._sc.a = -1)));
    onScroll();
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", reset);
  // the wordmark is re-fitted after fonts load; measure again then
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(reset);
  render();
})();
