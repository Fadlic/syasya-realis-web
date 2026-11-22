/* ===== About facts + testimonials + navigation between real pages (/, /about, /guidelines, /faq) =====
   V4.4 switched pages with a hash router (#about-us …). In Astro every page is its own URL,
   so this script only marks the active menu item, keeps old hash links working, and
   reveals the content of the sub-pages straight away (as the old page switch did). */
(() => {
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  const PAGE = document.body.dataset.page || "index";

  /* old links such as /#about-us → the new page */
  const pre = LANG === "en" ? "" : "/" + LANG;
  const OLD = { "#about-us": pre + "/about", "#brand-guidelines": pre + "/guidelines", "#faq": pre + "/faq" };
  if (PAGE === "index" && OLD[location.hash]) {
    location.replace(OLD[location.hash]);
    return;
  }
  addEventListener("hashchange", () => {
    if (OLD[location.hash]) location.replace(OLD[location.hash]);
  });

  /* about page: facts + testimonials */
  const factsBox = $("#ab-facts");
  if (factsBox) {
    const F = I18N.facts || {};
    const facts = [
      [F.disciplines || "Disciplines", F.disciplinesV || "Photography · videography · montage design · graphic design"],
      [F.formats || "Formats", "16:9 · 9:16 · 1:1 · 4:5"],
      [F.based || "Based in", ABOUT.based],
      [F.founded || "Founded", ABOUT.founded],
      [F.team || "Team", ABOUT.team],
    ];
    factsBox.replaceChildren(
      ...facts
        .filter(([, v]) => v || PREVIEW_PLACEHOLDERS)
        .map(([k, v]) => {
          const d = document.createElement("div");
          if (!v) d.className = "ph-row";
          const dt = document.createElement("dt");
          dt.textContent = k;
          const dd = document.createElement("dd");
          dd.textContent = v || "Add in settings";
          d.append(dt, dd);
          return d;
        })
    );
  }
  const box = $("#quotes");
  if (box) {
    if (TESTIMONIALS.length) {
      box.replaceChildren(
        ...TESTIMONIALS.map(t => {
          const f = document.createElement("figure");
          f.className = "quote rv in";
          const q = document.createElement("blockquote");
          q.textContent = t.quote;
          const c = document.createElement("figcaption");
          const b = document.createElement("b");
          b.textContent = t.name;
          c.append(b, t.role || "");
          f.append(q, c);
          return f;
        })
      );
    } else if (PREVIEW_PLACEHOLDERS) {
      box.replaceChildren(
        ...[1, 2, 3].map(i => {
          const f = document.createElement("figure");
          f.className = "quote empty";
          const q = document.createElement("blockquote");
          q.textContent = `Slot ${i} — a real quote from a client goes here, with their name and company. Send me the quotes and I'll add them.`;
          f.append(q);
          return f;
        })
      );
    } else {
      $("#ab-testi").hidden = true;
    }
  }

  /* active menu item + title (follows SITE.name like before) */
  $$("[data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === PAGE));

  /* sub-pages: show everything at once, as the old page switch did */
  if (PAGE !== "index") $$("main .rv").forEach(el => el.classList.add("in"));

  /* closing the mobile menu when a link to a section of the same page is used */
  document.addEventListener("click", e => {
    if (e.target.closest(".sheet a")) (window.__menu || (() => document.body.classList.remove("menu")))(false);
  });

  /* kept for older code that still calls it: navigate like a normal link */
  window.__go = target => {
    if (!target || target === "#top") {
      if (PAGE === "index") scrollTo({ top: 0 });
      else location.href = "/";
      return;
    }
    if (OLD[target]) {
      location.href = OLD[target];
      return;
    }
    if (PAGE === "index") document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    else location.href = (LANG === "en" ? "/" : `/${LANG}/`) + target;
  };
})();
