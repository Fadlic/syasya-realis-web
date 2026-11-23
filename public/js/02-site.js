(() => {
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  /* eyebrow numbers in accent colour */
  $$(".eyebrow span:first-child").forEach(
    s => (s.innerHTML = s.textContent.replace(/^\((\d+)\)/, '<span class="num">($1)</span>'))
  );
  /* footer links */
  const setLink = (a, url) => (url && url !== "#" ? (a.href = url) : (a.style.display = "none"));
  $$("[data-ig2]").forEach(a => setLink(a, SITE.instagram));
  $$("[data-wa2]").forEach(a => setLink(a, SITE.whatsapp));

  /* active section + progress */
  const links = [
      ...$$(".links a.l:not(.page)").filter(a => !a.dataset.nav), // section links only (pages have their own URL)
      ...$$('#nav .btn.fill[href*="#contact"]'), // contact has no text link; the CTA marks it so Services is not lit there
    ],
    secs = links.map(a => document.getElementById(a.getAttribute("href").split("#")[1] || ""));
  const progress = $("#progress"),
    nav = $("#nav");
  let queued = false;
  // progress bar, solid header and active section: one pass per frame
  const render = () => {
    queued = false;
    const h = document.documentElement;
    progress.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
    nav.classList.toggle("solid", scrollY > 40);
    let cur = -1;
    secs.forEach((s, i) => {
      if (s && !s.closest("[hidden]") && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i;
    });
    links.forEach((a, i) => {
      a.classList.toggle("on", i === cur);
      if (i === cur) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  };
  addEventListener("scroll", onScroll, { passive: true });
  render();

  /* send via WhatsApp / email with the brief pre-filled (home page only) */
  const f = $("#brief");
  if (!f) return;
  const brief = () => {
    const svcs = [...f.querySelectorAll("input[name=svc]:checked")].map(x => x.value).join(", ") || "-";
    const pc = $("#booking-code").value;
    return `Hi ${SITE.name}, I'd like to start a project.${pc ? `\n\nBooking code: ${pc} (pop-up offer)` : ""}\n\nName: ${f.name.value || "-"}\nCompany: ${f.company.value || "-"}\nEmail: ${f.email.value || "-"}\nServices: ${svcs}\nTimeline: ${f.timeline.value}${LANG === "en" ? "" : `\nPreferred language: ${SITE_DATA.langName || LANG}`}\n\n${f.msg.value || ""}`;
  };
  const update = () => {
    const t = brief();
    // the WhatsApp button is only rendered once a number is set (admin: Contact)
    if ($("#sendWa")) $("#sendWa").href = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(t)}`;
    $("#sendMail").href =
      `mailto:${SITE.email}?subject=${encodeURIComponent("New project — " + (f.company.value || f.name.value || "enquiry"))}&body=${encodeURIComponent(t)}`;
  };
  f.addEventListener("input", update);
  f.addEventListener("change", update);
  update();
  // with no number the WhatsApp button is not rendered; "Send via email" and the copyable brief remain
})();

/* language switcher: close it on Escape or a click outside */
(() => {
  const d = document.getElementById("langPick");
  if (!d) return;
  document.addEventListener("click", e => {
    if (d.open && !d.contains(e.target)) d.open = false;
  });
  d.addEventListener("keydown", e => {
    if (e.key === "Escape" && d.open) {
      d.open = false;
      d.querySelector("summary").focus();
    }
  });
})();
