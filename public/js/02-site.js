(() => {
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  /* eyebrow numbers in accent colour */
  $$(".eyebrow span:first-child").forEach(
    s => (s.innerHTML = s.textContent.replace(/^\((\d+)\)/, '<span class="num">($1)</span>'))
  );
  /* footer links */
  $$("[data-ig2]").forEach(a => (a.href = SITE.instagram));
  $$("[data-wa2]").forEach(a => (a.href = SITE.whatsapp));

  /* active section + progress */
  const links = $$(".links a.l:not(.page)").filter(a => !a.dataset.nav), // section links only (pages have their own URL)
    secs = links.map(a => document.getElementById(a.getAttribute("href").split("#")[1] || ""));
  const onScroll = () => {
    const h = document.documentElement;
    $("#progress").style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
    let cur = -1;
    secs.forEach((s, i) => {
      if (s && !s.closest("[hidden]") && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i;
    });
    links.forEach((a, i) => a.classList.toggle("on", i === cur));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* send via WhatsApp / email with the brief pre-filled (home page only) */
  const f = $("#brief");
  if (!f) return;
  const brief = () => {
    const svcs = [...f.querySelectorAll("input[name=svc]:checked")].map(x => x.value).join(", ") || "-";
    const pc = $("#booking-code").value;
    return `Hi ${SITE.name}, I'd like to start a project.${pc ? `\n\nBooking code: ${pc} (pop-up offer)` : ""}\n\nName: ${f.name.value || "-"}\nCompany: ${f.company.value || "-"}\nEmail: ${f.email.value || "-"}\nServices: ${svcs}\nTimeline: ${f.timeline.value}\n\n${f.msg.value || ""}`;
  };
  const update = () => {
    const t = brief();
    $("#sendWa").href = SITE.whatsappNumber
      ? `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(t)}`
      : "#";
    $("#sendMail").href =
      `mailto:${SITE.email}?subject=${encodeURIComponent("New project — " + (f.company.value || f.name.value || "enquiry"))}&body=${encodeURIComponent(t)}`;
  };
  f.addEventListener("input", update);
  f.addEventListener("change", update);
  update();
  $("#sendWa").addEventListener("click", e => {
    if (!SITE.whatsappNumber) {
      e.preventDefault();
      $("#outText").textContent = brief();
      $("#out").classList.add("show");
    }
  });
})();
