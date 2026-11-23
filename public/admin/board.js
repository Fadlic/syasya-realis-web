/* =====================================================================
   Syasya&Realis admin — the board (dashboard, enquiries, briefs,
   pop-ups, reports, settings, security).
   Runs with sample data (demo mode) until live.js connects it to the
   database: live.js clears the sample arrays and fills them from Supabase,
   then calls the hooks in window.STUDIO_LIVE for every change.
   Every text from clients or admins is set with textContent, never as HTML.
   ===================================================================== */
(() => {
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  const el = (tag, props = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === false || v == null) continue;
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "text") e.textContent = v;
      else e.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach(k => k != null && e.append(k.nodeType ? k : document.createTextNode(k)));
    return e;
  };
  /* live hooks: live.js sets window.STUDIO_LIVE when connected to the database */
  const LIVE = () => !!(window.STUDIO_LIVE && window.STUDIO_LIVE.on);
  const H = (n, ...a) => (LIVE() && window.STUDIO_LIVE[n] ? window.STUDIO_LIVE[n](...a) : undefined);
  const toast = t => {
    const x = $("#toast");
    x.textContent = t;
    x.classList.add("show");
    clearTimeout(x._t);
    x._t = setTimeout(() => x.classList.remove("show"), 2800);
  };

  /* ---------- dates ---------- */
  const TODAY = new Date();
  TODAY.setSeconds(0, 0);
  const day0 = d => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const addD = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const monday = d => {
    const x = day0(d);
    const k = (x.getDay() + 6) % 7;
    return addD(x, -k);
  };
  const at = (d, h, m = 0) => {
    const x = day0(d);
    if (x.getDay() === 0) x.setDate(x.getDate() + 1);
    x.setHours(h, m);
    return x;
  }; // never on Sunday
  const fD = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const fT = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const ago = d => {
    const m = Math.round((TODAY - d) / 60000);
    return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : fD(d);
  };

  /* ---------- sample data (demo mode only) ---------- */
  const STAGES = ["New", "Contacted", "Brief scheduled", "Brief done", "Quoted", "Won", "Lost"];
  const SVCS = [
    "Company profile video",
    "Marketing / business montage",
    "Product video",
    "Videography",
    "Photography",
    "Editing & post-production",
    "Social content",
    "Graphic design",
  ];
  const SRC = ["Website form", "Pop-up", "WhatsApp", "Email", "Instagram DM"];
  const mk = (ref, name, company, svcs, timeline, src, mins, status, msg) => ({
    ref,
    name,
    company,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    svcs,
    timeline,
    src,
    at: new Date(TODAY - mins * 60000),
    status,
    msg,
    read: status !== "New",
    notes: "",
    log: [`Received via ${src}`],
  });
  const E = [
    Object.assign(
      mk(
        "SB-0013",
        "Sample Client J",
        "Sample Logistics",
        ["Company profile video"],
        "Within a month",
        "Pop-up",
        12,
        "New",
        "Sample message: saw the November offer — we'd like a company profile for our new warehouse."
      ),
      {
        promo: {
          code: "NOV10",
          booking: "NOV10-4K2P",
          campaign: "November · 10% off",
          value: "10% off",
          applies: "Company profile videos",
          until: "30 Nov 2026",
        },
      }
    ),
    mk(
      "SB-0012",
      "Sample Client A",
      "Sample Coffee Co.",
      ["Company profile video"],
      "Within a month",
      "Website form",
      35,
      "New",
      "Sample message: we need a 2-minute company profile for our website and investor deck."
    ),
    mk(
      "SB-0011",
      "Sample Client B",
      "Example Skincare",
      ["Product video", "Photography"],
      "Within 2 weeks",
      "WhatsApp",
      190,
      "New",
      "Sample message: product launch next month, need hero shots and 3 reels."
    ),
    mk(
      "SB-0010",
      "Sample Client C",
      "Demo Property",
      ["Marketing / business montage", "Social content"],
      "Flexible",
      "Website form",
      1500,
      "Contacted",
      "Sample message: montage for a new housing project, 30s and 60s cuts."
    ),
    mk(
      "SB-0009",
      "Sample Client D",
      "Example Clinic",
      ["Company profile video", "Graphic design"],
      "1–3 months",
      "Email",
      2900,
      "Brief scheduled",
      "Sample message: profile video plus brochure redesign."
    ),
    mk(
      "SB-0008",
      "Sample Client E",
      "Demo Fashion",
      ["Videography", "Photography"],
      "Within a month",
      "Instagram DM",
      4400,
      "Brief scheduled",
      "Sample message: lookbook shoot and runway recap."
    ),
    mk(
      "SB-0007",
      "Sample Client F",
      "Sample Foods",
      ["Product video"],
      "Within 2 weeks",
      "Website form",
      7200,
      "Brief done",
      "Sample message: three short product videos for marketplace listings."
    ),
    mk(
      "SB-0006",
      "Sample Client G",
      "Example Tech",
      ["Editing & post-production"],
      "Flexible",
      "Email",
      10100,
      "Quoted",
      "Sample message: we have footage, need editing and colour."
    ),
    mk(
      "SB-0005",
      "Sample Client H",
      "Demo School",
      ["Company profile video", "Social content"],
      "1–3 months",
      "Website form",
      14500,
      "Won",
      "Sample message: school profile and admission campaign."
    ),
    mk(
      "SB-0004",
      "Sample Client I",
      "Sample Hotel",
      ["Photography"],
      "Within a month",
      "WhatsApp",
      20000,
      "Lost",
      "Sample message: room and F&B photography."
    ),
  ];
  const mon = monday(TODAY);
  const B = [
    // briefs
    { id: 1, ref: "SB-0009", start: at(addD(TODAY, 1), 10), dur: 45, mode: "Google Meet", status: "Scheduled" },
    { id: 2, ref: "SB-0008", start: at(addD(TODAY, 2), 14), dur: 60, mode: "In person", status: "Scheduled" },
    { id: 3, ref: "SB-0007", start: at(addD(TODAY, -2), 11), dur: 45, mode: "WhatsApp call", status: "Done" },
    { id: 4, ref: "SB-0006", start: at(addD(TODAY, -6), 15), dur: 30, mode: "Zoom", status: "Done" },
  ];
  const BLOCKS = [
    { start: at(mon, 12), dur: 60, label: "Lunch" },
    { start: at(addD(mon, 3), 12), dur: 60, label: "Lunch" },
    { start: at(addD(mon, 2), 9), dur: 180, label: "Shoot day" },
  ];
  E.find(e => e.ref === "SB-0009").log.push("Brief scheduled");
  E.find(e => e.ref === "SB-0008").log.push("Brief scheduled");
  const AGENDA = [
    "Objective — what should the video/photo achieve?",
    "Audience & channels — who sees it, where it's published",
    "Deliverables & formats — lengths, 16:9 / 9:16 / 1:1, number of photos",
    "References & mood — examples they like and dislike",
    "Timeline — shoot date, review rounds, final deadline",
    "Budget range & approvals — who signs off",
    "Next step — date the quote is due",
  ];
  const byRef = r => E.find(e => e.ref === r);
  let seq = 14,
    bseq = 5,
    filter = "Open",
    selected = E[0].ref,
    wk = 0,
    lastFocus = null;

  /* ---------- nav (the hash keeps the view: /admin/#inbox, #cal, #content, #pop, #rep, #set, #sys) ---------- */
  const VIEWS = ["dash", "inbox", "cal", "content", "pop", "rep", "set", "sys"];
  // a single marker slides to the active nav item; it jumps (no slide) on first paint and on resize
  const placeInd = (still = false) => {
    const side = $(".side"),
      b = $(".nav-b[aria-current=\"page\"]");
    if (!side || !b) return;
    let ind = $(".nav-ind");
    if (!ind) {
      ind = document.createElement("span");
      ind.className = "nav-ind";
      ind.setAttribute("aria-hidden", "true");
      side.prepend(ind);
      side.classList.add("has-ind");
      still = true;
    }
    ind.classList.toggle("still", still);
    ind.style.width = b.offsetWidth + "px";
    ind.style.height = b.offsetHeight + "px";
    ind.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
    if (still) requestAnimationFrame(() => ind.classList.remove("still"));
    // on narrow screens the nav is a scrolling row: keep the active item in view
    if (side.scrollWidth > side.clientWidth) side.scrollTo({ left: Math.max(0, b.offsetLeft - 16), behavior: still ? "auto" : "smooth" });
  };
  addEventListener("resize", () => placeInd(true));
  if ("ResizeObserver" in window && $(".side")) new ResizeObserver(() => placeInd(true)).observe($(".side"));
  const show = v => {
    if (!VIEWS.includes(v)) v = "dash";
    $$(".nav-b").forEach(b => b.toggleAttribute("aria-current", false));
    $(`.nav-b[data-v="${v}"]`).setAttribute("aria-current", "page");
    placeInd();
    $$(".view").forEach(x => (x.hidden = x.id !== "v-" + v));
    render();
    $("#main").focus({ preventScroll: true });
    scrollTo({ top: 0 });
    const h = v === "dash" ? location.pathname : "#" + v;
    if (location.hash !== (v === "dash" ? "" : h)) history.replaceState(null, "", h);
  };
  $$(".nav-b").forEach(b => (b.onclick = () => show(b.dataset.v)));
  document.addEventListener("click", e => {
    const g = e.target.closest("[data-go]");
    if (g) show(g.dataset.go);
  });
  addEventListener("hashchange", () => show(location.hash.slice(1)));

  /* ---------- dashboard ---------- */
  const st = s => el("span", { class: "st", "data-s": s }, s);
  const briefRow = b => {
    const e = byRef(b.ref);
    return el(
      "button",
      { class: "up-i", style: "text-align:left;width:100%", onclick: () => openBrief(b) },
      el(
        "div",
        { class: "date" },
        el("b", {}, String(b.start.getDate())),
        el("span", {}, b.start.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase())
      ),
      el(
        "div",
        {},
        el("h3", {}, e ? e.company : b.ref),
        el("div", { class: "hint" }, `${fT(b.start)} · ${b.dur} min · ${b.mode}`)
      ),
      el("span", { class: "st", "data-s": b.status === "Done" ? "Brief done" : "Brief scheduled" }, b.status)
    );
  };
  const renderDash = () => {
    $("#today-l").textContent = TODAY.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const nNew = E.filter(e => e.status === "New").length;
    $("#k1").textContent = nNew;
    $("#c-new").textContent = nNew;
    const wkB = B.filter(b => b.start >= mon && b.start < addD(mon, 7));
    $("#k2").textContent = wkB.length;
    const left = wkB.filter(b => b.start > TODAY).length;
    $("#k2s").textContent = `${left} still to come`;
    $("#c-brief").textContent = B.filter(b => b.start > TODAY).length;
    $("#k3").textContent = LIVE() ? H("avgReply") || "—" : "1 h 40 m";
    $("#k4").textContent = E.filter(e => e.status === "Won").length;
    const quoted = E.filter(e => e.status === "Quoted").length;
    $("#k4s").textContent = `${quoted} ${quoted === 1 ? "quote" : "quotes"} waiting`;
    const attn = E.filter(e => e.status === "New" || e.status === "Brief done");
    $("#attn").replaceChildren(
      ...attn
        .map(e =>
          el(
            "button",
            {
              class: "li",
              style: "width:100%;border:0;border-bottom:1px solid var(--line)",
              onclick: () => {
                selected = e.ref;
                filter = "Open";
                show("inbox");
              },
            },
            el("span", {}, el("span", { class: "nm" }, e.company), " ", el("span", { class: "src" }, " · " + e.src)),
            el("span", { class: "tm" }, ago(e.at)),
            el(
              "span",
              { class: "sn" },
              e.promo && e.status === "New"
                ? `Pop-up lead (${e.promo.code}) — reply within 1 hour`
                : e.status === "New"
                  ? "Reply and schedule a brief"
                  : "Brief done — send the quote"
            )
          )
        )
        .concat(attn.length ? [] : [el("p", { class: "hint" }, "All caught up.")])
    );
    $("#up-dash").replaceChildren(
      ...B.filter(b => b.start > TODAY)
        .sort((a, b) => a.start - b.start)
        .slice(0, 3)
        .map(briefRow)
    );
    const open = STAGES.slice(0, 5).map(s => [s, E.filter(e => e.status === s).length]);
    const mx = Math.max(1, ...open.map(x => x[1]));
    $("#pipe-dash").replaceChildren(...open.map(([s, n]) => bar(s, n, mx, `${n}`, `${s}: ${n} enquiries`)));
  };

  /* ---------- enquiries inbox ---------- */
  const FILTERS = {
    Open: e => !["Won", "Lost"].includes(e.status),
    New: e => e.status === "New",
    "Pop-up": e => !!e.promo,
    Briefs: e => ["Brief scheduled", "Brief done"].includes(e.status),
    Closed: e => ["Won", "Lost"].includes(e.status),
    All: () => true,
  };
  Object.keys(FILTERS).forEach(k =>
    $("#f-seg").append(
      el(
        "button",
        {
          "aria-pressed": String(k === filter),
          onclick: ev => {
            filter = k;
            $$("#f-seg button").forEach(b => b.setAttribute("aria-pressed", b === ev.currentTarget));
            renderInbox();
          },
        },
        k
      )
    )
  );
  /* replies open the studio's own app; only a phone number on the enquiry makes WhatsApp possible */
  const digits = p => String(p || "").replace(/\D/g, "");
  const replyWa = e => {
    if (e.status === "New") setStage(e, "Contacted", e.promo ? "Replied with the offer" : "Replied on WhatsApp");
    if (!LIVE())
      return toast("Demo: marked as contacted. Connected, this opens WhatsApp when the enquiry has a phone number.");
    if (digits(e.phone).length >= 8) return void window.open(`https://wa.me/${digits(e.phone)}`, "_blank", "noopener");
    toast("Marked as contacted. No phone number on this enquiry — reply from WhatsApp on your phone.");
  };
  const replyMail = e => {
    if (e.status === "New") setStage(e, "Contacted", "Replied by email");
    if (!LIVE()) return toast("Demo: marked as contacted. Connected, this opens your email app.");
    if (!e.email || e.email === "—") return toast("Marked as contacted. No email address on this enquiry.");
    location.href = `mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent(`Your enquiry ${e.ref} — Syasya&Realis`)}`;
  };
  const renderInbox = () => {
    const q = $("#q").value.trim().toLowerCase();
    const rows = E.filter(FILTERS[filter])
      .filter(e => !q || [e.name, e.company, e.ref].join(" ").toLowerCase().includes(q))
      .sort((a, b) => b.at - a.at);
    if (!rows.find(e => e.ref === selected) && rows[0]) selected = rows[0].ref;
    $("#list").replaceChildren(
      ...(rows.length
        ? rows.map(e =>
            el(
              "button",
              {
                class: "li" + (e.read ? "" : " unread"),
                role: "listitem",
                "aria-current": String(e.ref === selected),
                onclick: () => {
                  selected = e.ref;
                  e.read = true;
                  renderInbox();
                },
              },
              el("span", { class: "nm" }, e.company),
              el("span", { class: "tm" }, ago(e.at)),
              el(
                "span",
                { class: "sn" },
                e.promo ? el("span", { class: "tagp", style: "margin-right:8px" }, "POP-UP · " + e.promo.code) : null,
                el("span", { class: "src" }, e.ref + " · " + e.src + " · "),
                e.svcs.join(", ")
              ),
              el("span", { style: "grid-column:1/-1;margin-top:4px" }, st(e.status))
            )
          )
        : [el("p", { class: "hint", style: "padding:18px" }, "No enquiries match.")])
    );
    const e = byRef(selected);
    if (!e) {
      $("#detail").replaceChildren(el("p", { class: "hint" }, "Select an enquiry."));
      return;
    }
    e.read = true;
    const brief = B.find(b => b.ref === e.ref && b.status === "Scheduled");
    const idx = STAGES.indexOf(e.status);
    $("#detail").replaceChildren(
      el(
        "div",
        { class: "card-h" },
        el(
          "div",
          {},
          el("span", { class: "mono", style: "color:var(--rose-t)" }, e.ref),
          el("h2", { style: "font-size:26px;margin-top:4px" }, e.company)
        ),
        st(e.status)
      ),
      el(
        "dl",
        { class: "dl" },
        el("dt", {}, "Contact"),
        el(
          "dd",
          {},
          e.name,
          el("br"),
          el("span", { class: "hint" }, e.email),
          e.phone ? [el("br"), el("span", { class: "hint" }, e.phone)] : null
        ),
        el("dt", {}, "Services"),
        el(
          "dd",
          {},
          e.svcs.map(s => el("span", { class: "chip" }, s))
        ),
        el("dt", {}, "Timeline"),
        el("dd", {}, e.timeline),
        el("dt", {}, "Source"),
        el("dd", {}, `${e.src} · ${fD(e.at)} ${fT(e.at)}`)
      ),
      e.promo
        ? el(
            "div",
            { class: "promo" },
            el(
              "div",
              { class: "pt" },
              el("strong", {}, "Pop-up lead — handle as promo"),
              el("span", { class: "tagp" }, "BOOKING " + e.promo.booking)
            ),
            el(
              "p",
              { class: "hint", style: "margin-top:6px" },
              `${e.promo.campaign} · ${e.promo.value} on ${e.promo.applies} · valid until ${e.promo.until} · code valid, first use`
            ),
            el(
              "ul",
              {},
              el("li", {}, "Reply within 1 hour — the client is warm and expects the offer."),
              el("li", {}, `Confirm the offer in the first message (${e.promo.value}, ${e.promo.applies}).`),
              el("li", {}, `Put booking code ${e.promo.booking} on the quote and apply the discount there.`),
              el("li", {}, "If the request is outside the offer, explain what the code covers before the brief.")
            )
          )
        : el(
            "p",
            { class: "hint", style: "margin-top:10px" },
            "Direct enquiry — standard handling: reply the same working day, start with the brief."
          ),
      el("div", { class: "msg", style: "margin-top:12px" }, e.msg),
      el(
        "div",
        { class: "acts" },
        el(
          "button",
          { class: "btn fill sm", onclick: () => replyWa(e) },
          e.promo ? "Reply with offer" : "Reply on WhatsApp"
        ),
        el("button", { class: "btn sm", onclick: () => replyMail(e) }, "Reply by email"),
        brief
          ? el(
              "button",
              { class: "btn sm", onclick: () => openBrief(brief) },
              `Brief · ${fD(brief.start)} ${fT(brief.start)}`
            )
          : el("button", { class: "btn sm", onclick: () => openSchedule(e.ref) }, "Schedule brief")
      ),
      el("div", { class: "mono muted", style: "margin-top:20px" }, "Stage"),
      el(
        "div",
        { class: "pipe", role: "group", "aria-label": "Move to stage" },
        STAGES.map((s, i) =>
          el(
            "button",
            {
              class: i < idx && e.status !== "Lost" ? "done" : "",
              "aria-pressed": String(s === e.status),
              onclick: () => setStage(e, s, `Stage changed to ${s}`),
            },
            s
          )
        )
      ),
      el(
        "div",
        { class: "fld", style: "margin-top:14px" },
        el("label", { for: "notes" }, "Internal notes"),
        el(
          "textarea",
          {
            id: "notes",
            placeholder: "Only visible to the team",
            oninput: ev => {
              e.notes = ev.target.value;
              H("notes", e, e.notes);
            },
          },
          e.notes
        )
      ),
      el("div", { class: "mono muted", style: "margin-top:18px" }, "History"),
      el(
        "ul",
        { class: "tl" },
        e.log
          .slice()
          .reverse()
          .map(t => el("li", {}, el("span", {}, t)))
      )
    );
  };
  const setStage = (e, s, note) => {
    e.status = s;
    e.log.push(note);
    if (LIVE()) {
      H("stage", e, s);
      render();
      toast(`${e.ref} → ${s}`);
      return;
    }
    addLog(/Brief/.test(s) ? "Brief" : "Enquiry", `${e.ref} → ${s}`);
    render();
    toast(`${e.ref} → ${s}`);
  };
  $("#q").addEventListener("input", () => {
    if ($("#v-inbox").hidden) show("inbox");
    else renderInbox();
  });

  /* ---------- calendar ---------- */
  const H0 = 8,
    H1 = 18;
  const renderCal = () => {
    const m0 = addD(mon, wk * 7),
      cal = $("#cal");
    cal.style.setProperty("--hours", H1 - H0);
    $("#wk-l").textContent =
      `${m0.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addD(m0, 5).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    const kids = [el("div", { class: "corner" })];
    for (let d = 0; d < 6; d++) {
      const dd = addD(m0, d);
      kids.push(
        el(
          "div",
          { class: "dh" + (+day0(dd) === +day0(TODAY) ? " today" : "") },
          el("span", { class: "mono muted" }, dd.toLocaleDateString("en-GB", { weekday: "short" })),
          el("b", {}, String(dd.getDate()))
        )
      );
    }
    const times = el("div", { class: "times" });
    for (let h = H0 + 1; h < H1; h++)
      times.append(el("span", { style: `top:${(h - H0) * 56}px` }, `${String(h).padStart(2, "0")}:00`));
    kids.push(times);
    const pos = (s, dur) =>
      `top:${(s.getHours() + s.getMinutes() / 60 - H0) * 56}px;height:${Math.max(26, (dur / 60) * 56 - 4)}px`;
    for (let d = 0; d < 6; d++) {
      const dd = addD(m0, d),
        col = el("div", { class: "col", role: "group", "aria-label": fD(dd) });
      for (let h = 1; h < H1 - H0; h++) col.append(el("div", { class: "hr", style: `top:${h * 56}px` }));
      /* side-by-side lanes when events overlap */
      const evs = [
        ...BLOCKS.filter(b => +day0(b.start) === +dd).map(b => ({ ...b, block: true })),
        ...B.filter(b => +day0(b.start) === +dd),
      ].sort((a, b) => a.start - b.start);
      const end = x => +x.start + x.dur * 60000,
        lanes = [];
      evs.forEach(x => {
        let l = lanes.findIndex(t => t <= +x.start);
        if (l < 0) {
          l = lanes.length;
          lanes.push(0);
        }
        lanes[l] = end(x);
        x.lane = l;
      });
      evs.forEach(x => {
        const group = evs.filter(y => +y.start < end(x) && end(y) > +x.start);
        x.cols = Math.max(...group.map(y => y.lane)) + 1;
      });
      const lanePos = x =>
        `${pos(x.start, x.dur)};left:calc(${(x.lane / x.cols) * 100}% + 4px);right:auto;width:calc(${100 / x.cols}% - 8px)`;
      evs.forEach(x => {
        if (x.block) {
          col.append(
            el(
              "div",
              { class: "ev block", style: lanePos(x) },
              el("b", {}, x.label),
              el("span", {}, `${fT(x.start)} · ${x.dur / 60} h`)
            )
          );
          return;
        }
        const e = byRef(x.ref),
          b = B.find(y => y.id === x.id),
          co = e ? e.company : x.ref;
        col.append(
          el(
            "button",
            {
              class: "ev" + (b.status === "Done" ? " done" : ""),
              style: lanePos(x),
              onclick: () => openBrief(b),
              "aria-label": `Brief with ${co}, ${fD(b.start)} ${fT(b.start)}, ${b.status}`,
            },
            el("b", {}, co),
            el("span", {}, `${fT(b.start)} · ${b.mode}`)
          )
        );
      });
      if (+day0(TODAY) === +dd && TODAY.getHours() >= H0 && TODAY.getHours() < H1)
        col.append(
          el("div", {
            class: "now",
            style: `top:${(TODAY.getHours() + TODAY.getMinutes() / 60 - H0) * 56}px`,
            "aria-hidden": "true",
          })
        );
      kids.push(col);
    }
    cal.replaceChildren(...kids);
    $("#up-cal").replaceChildren(
      ...B.filter(b => b.start > TODAY)
        .sort((a, b) => a.start - b.start)
        .map(briefRow)
        .concat(B.some(b => b.start > TODAY) ? [] : [el("p", { class: "hint" }, "No briefs scheduled.")])
    );
  };
  $("#wk-prev").onclick = () => {
    wk--;
    renderCal();
  };
  $("#wk-next").onclick = () => {
    wk++;
    renderCal();
  };
  $("#wk-now").onclick = () => {
    wk = 0;
    renderCal();
  };
  $("#agenda-std").replaceChildren(...AGENDA.map(a => el("li", {}, a)));

  /* ---------- drawer: schedule / brief notes / add enquiry ---------- */
  const openDrawer = (title, body) => {
    lastFocus = document.activeElement;
    $("#dr-h").textContent = title;
    $("#dr-body").replaceChildren(body);
    $("#drawer").classList.add("open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#scrim").classList.add("show");
    setTimeout(() => ($("#dr-body").querySelector("input,select,textarea,button") || $("#dr-x")).focus(), 50);
  };
  const closeDrawer = () => {
    $("#drawer").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    $("#scrim").classList.remove("show");
    lastFocus && lastFocus.focus();
  };
  $("#dr-x").onclick = closeDrawer;
  $("#scrim").onclick = closeDrawer;
  $("#drawer").addEventListener("keydown", e => {
    if (e.key === "Escape") closeDrawer();
    if (e.key === "Tab") {
      const f = $$("#drawer button, #drawer input, #drawer select, #drawer textarea").filter(
        x => x.offsetParent !== null && !x.disabled
      );
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault();
        f.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === f.at(-1)) {
        e.preventDefault();
        f[0].focus();
      }
    }
  });

  const overlaps = (start, dur, skipId) =>
    [...B.filter(b => b.status === "Scheduled" && b.id !== skipId), ...BLOCKS].find(
      b => start < new Date(+b.start + b.dur * 60000) && new Date(+start + dur * 60000) > b.start
    );
  const openSchedule = ref => {
    const open = E.filter(e => !["Won", "Lost", "Brief scheduled"].includes(e.status));
    /* suggest the next free slot inside availability (09:00–17:00, 45 min + 15 min gap, Mon–Sat) */
    const slot = (() => {
      let d = addD(day0(TODAY), 1);
      for (let k = 0; k < 21; k++, d = addD(d, 1)) {
        if (d.getDay() === 0) continue;
        for (let m = 9 * 60; m + 45 <= 17 * 60; m += 15) {
          const s = at(d, Math.floor(m / 60), m % 60);
          if (!overlaps(new Date(+s - 15 * 60000), 45 + 30)) return s;
        }
      }
      return at(addD(TODAY, 1), 10);
    })();
    const d = slot;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const f = el(
      "form",
      { style: "display:grid;gap:14px" },
      el(
        "div",
        { class: "fld" },
        el("label", { for: "s-ref" }, "Enquiry"),
        el(
          "select",
          { id: "s-ref" },
          open.map(e => el("option", { value: e.ref, selected: e.ref === ref }, `${e.ref} · ${e.company}`))
        )
      ),
      el(
        "div",
        { class: "row" },
        el(
          "div",
          { class: "fld" },
          el("label", { for: "s-date" }, "Date"),
          el("input", { id: "s-date", type: "date", value: iso, required: true })
        ),
        el(
          "div",
          { class: "fld" },
          el("label", { for: "s-time" }, "Start"),
          el("input", { id: "s-time", type: "time", value: fT(slot), step: "900", required: true })
        )
      ),
      el(
        "div",
        { class: "row" },
        el(
          "div",
          { class: "fld" },
          el("label", { for: "s-len" }, "Length"),
          el(
            "select",
            { id: "s-len" },
            ["30", "45", "60"].map(m => el("option", { value: m, selected: m === "45" }, `${m} min`))
          )
        ),
        el(
          "div",
          { class: "fld" },
          el("label", { for: "s-mode" }, "Where"),
          el(
            "select",
            { id: "s-mode" },
            ["Google Meet", "Zoom", "WhatsApp call", "Phone", "In person"].map(m => el("option", {}, m))
          )
        )
      ),
      el("p", { class: "hint", style: "margin-top:-6px" }, "Suggested: the next free time in your availability."),
      el("div", { class: "warn-box", id: "s-warn", role: "alert" }),
      el(
        "fieldset",
        { class: "fld" },
        el("legend", {}, "Agenda to cover"),
        el(
          "div",
          { class: "agenda" },
          AGENDA.map(a => el("label", {}, el("input", { type: "checkbox", checked: true }), el("span", {}, a)))
        )
      ),
      el(
        "label",
        { class: "agenda is-soon" },
        el(
          "span",
          { style: "display:flex;gap:10px;font-size:14px;color:var(--ink-2)" },
          el("input", { type: "checkbox", disabled: true, style: "accent-color:var(--rose);width:17px;height:17px" }),
          "Send the client an invite with the agenda",
          el("span", { class: "soon" }, "Coming soon")
        )
      ),
      el(
        "p",
        { class: "hint", style: "margin-top:-6px" },
        "Send the meeting link and agenda to the client yourself for now."
      ),
      el(
        "div",
        { class: "acts" },
        el("button", { class: "btn fill", type: "submit" }, "Schedule brief"),
        el("button", { class: "btn", type: "button", onclick: closeDrawer }, "Cancel")
      )
    );
    const check = () => {
      const s = new Date(`${$("#s-date").value}T${$("#s-time").value}`),
        c = overlaps(s, +$("#s-len").value);
      const who = c && (c.label || "a brief with " + (byRef(c.ref) ? byRef(c.ref).company : c.ref));
      $("#s-warn").classList.toggle("show", !!c);
      $("#s-warn").textContent = c
        ? `Clashes with ${who} at ${fT(c.start)}. Pick another time or continue anyway.`
        : "";
    };
    f.addEventListener("change", check);
    f.addEventListener("submit", ev => {
      ev.preventDefault();
      const s = new Date(`${$("#s-date").value}T${$("#s-time").value}`);
      if (isNaN(s)) return toast("Pick a date and time");
      const e = byRef($("#s-ref").value);
      if (!e) return toast("No open enquiry to schedule");
      const nb = {
        id: bseq++,
        ref: e.ref,
        start: s,
        dur: +$("#s-len").value,
        mode: $("#s-mode").value,
        status: "Scheduled",
      };
      B.push(nb);
      H(
        "addBrief",
        nb,
        e,
        [...f.querySelectorAll("fieldset .agenda input:checked")].map(x => x.closest("label").textContent.trim())
      );
      setStage(e, "Brief scheduled", `Brief scheduled for ${fD(s)} ${fT(s)} (${$("#s-mode").value})`);
      closeDrawer();
      wk = Math.round((monday(s) - mon) / (7 * 864e5));
      toast(`Brief scheduled · ${fD(s)} ${fT(s)}`);
    });
    openDrawer("Schedule brief", f);
    setTimeout(check, 60);
  };
  const openBrief = b => {
    const e = byRef(b.ref);
    if (!e) return toast("This brief's enquiry is not loaded");
    b.notes = b.notes || Object.fromEntries(AGENDA.map((a, i) => [i, ""]));
    const f = el(
      "form",
      { style: "display:grid;gap:14px" },
      el(
        "div",
        { class: "card", style: "padding:14px" },
        el(
          "div",
          { class: "card-h", style: "margin:0" },
          el(
            "div",
            {},
            el("span", { class: "mono", style: "color:var(--rose-t)" }, e.ref),
            el("h3", { style: "font-size:20px" }, e.company)
          ),
          el("span", { class: "st", "data-s": b.status === "Done" ? "Brief done" : "Brief scheduled" }, b.status)
        ),
        el(
          "p",
          { class: "hint", style: "margin-top:6px" },
          `${fD(b.start)} · ${fT(b.start)} · ${b.dur} min · ${b.mode}`
        ),
        el("p", { class: "hint" }, `${e.name} · ${e.svcs.join(", ")}`)
      ),
      el("div", { class: "mono muted" }, "Brief notes"),
      ...AGENDA.map((a, i) =>
        el(
          "div",
          { class: "fld" },
          el("label", { for: `bn${i}` }, a.split(" — ")[0]),
          el(
            "textarea",
            {
              id: `bn${i}`,
              rows: "2",
              placeholder: a.split(" — ")[1] || "",
              oninput: ev => (b.notes[i] = ev.target.value),
              style: "min-height:56px",
            },
            b.notes[i]
          )
        )
      ),
      el(
        "div",
        { class: "acts" },
        b.status === "Scheduled"
          ? el("button", { class: "btn fill", type: "submit" }, "Mark brief done")
          : el(
              "button",
              {
                class: "btn fill",
                type: "button",
                onclick: () => {
                  setStage(e, "Quoted", "Quote sent");
                  closeDrawer();
                },
              },
              "Mark quote sent"
            ),
        b.status === "Scheduled"
          ? el(
              "button",
              {
                class: "btn",
                type: "button",
                onclick: () => {
                  closeDrawer();
                  setTimeout(() => openSchedule(e.ref), 60);
                  H("updateBrief", b, { status: "Cancelled", notes: b.notes });
                  H("stage", e, "Contacted");
                  B.splice(B.indexOf(b), 1);
                  e.status = "Contacted";
                  e.log.push("Brief rescheduled");
                },
              },
              "Reschedule"
            )
          : null,
        b.status === "Scheduled"
          ? el(
              "button",
              {
                class: "btn",
                type: "button",
                onclick: () => {
                  b.status = "No-show";
                  H("updateBrief", b, { status: "No-show", notes: b.notes });
                  e.log.push("Client did not join the brief");
                  closeDrawer();
                  render();
                  toast("Marked as no-show");
                },
              },
              "No-show"
            )
          : null
      )
    );
    f.addEventListener("submit", ev => {
      ev.preventDefault();
      b.status = "Done";
      H("updateBrief", b, { status: "Done", notes: b.notes });
      setStage(e, "Brief done", "Brief done — notes saved");
      closeDrawer();
    });
    openDrawer("Brief", f);
  };
  $("#new-brief").onclick = () => openSchedule();
  $("#add-enq").onclick = () => {
    const f = el(
      "form",
      { style: "display:grid;gap:14px" },
      el("p", { class: "hint" }, "For enquiries that arrive directly on WhatsApp, Instagram or by phone."),
      el(
        "div",
        { class: "row" },
        el(
          "div",
          { class: "fld" },
          el("label", { for: "a-name" }, "Name"),
          el("input", { id: "a-name", required: true })
        ),
        el("div", { class: "fld" }, el("label", { for: "a-co" }, "Company"), el("input", { id: "a-co" }))
      ),
      el(
        "div",
        { class: "row" },
        el(
          "div",
          { class: "fld" },
          el("label", { for: "a-src" }, "Came from"),
          el(
            "select",
            { id: "a-src" },
            SRC.map(s => el("option", {}, s))
          )
        ),
        el(
          "div",
          { class: "fld" },
          el("label", { for: "a-tl" }, "Timeline"),
          el(
            "select",
            { id: "a-tl" },
            ["Flexible", "Within 2 weeks", "Within a month", "1–3 months"].map(s => el("option", {}, s))
          )
        )
      ),
      el(
        "fieldset",
        { class: "fld" },
        el("legend", {}, "Services"),
        el(
          "div",
          { class: "agenda", style: "grid-template-columns:1fr 1fr" },
          SVCS.map(s => el("label", {}, el("input", { type: "checkbox", name: "a-svc", value: s }), el("span", {}, s)))
        )
      ),
      el("div", { class: "fld" }, el("label", { for: "a-msg" }, "Message / summary"), el("textarea", { id: "a-msg" })),
      el(
        "div",
        { class: "acts" },
        el("button", { class: "btn fill", type: "submit" }, "Add enquiry"),
        el("button", { class: "btn", type: "button", onclick: closeDrawer }, "Cancel")
      )
    );
    f.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = $("#a-name").value.trim();
      if (!name) return $("#a-name").focus();
      if (LIVE()) {
        const btn = f.querySelector("[type=submit]");
        btn.disabled = true;
        H("addEnquiry", {
          name,
          company: $("#a-co").value.trim(),
          services: $$('input[name="a-svc"]:checked').map(x => x.value),
          timeline: $("#a-tl").value,
          source: $("#a-src").value,
          message: $("#a-msg").value.trim(),
        })
          .then(ref => {
            closeDrawer();
            selected = ref;
            filter = "Open";
            show("inbox");
            toast(`${ref} added`);
          })
          .catch(err => {
            btn.disabled = false;
            toast(err.message);
          });
        return;
      }
      const e = mk(
        "SB-" + String(seq++).padStart(4, "0"),
        name,
        $("#a-co").value.trim() || name,
        $$('input[name="a-svc"]:checked').map(x => x.value),
        $("#a-tl").value,
        $("#a-src").value,
        0,
        "New",
        $("#a-msg").value.trim() || "—"
      );
      e.log = [`Added by hand (${e.src})`];
      E.unshift(e);
      selected = e.ref;
      filter = "Open";
      closeDrawer();
      show("inbox");
      toast(`${e.ref} added`);
    });
    openDrawer("Add enquiry", f);
  };

  /* ---------- reports (single-series bars in accent; tooltips; table view) ---------- */
  const tip = $("#tip");
  const hover = (node, text) => {
    node.addEventListener("mousemove", ev => {
      tip.textContent = text;
      tip.style.left = ev.clientX + 14 + "px";
      tip.style.top = ev.clientY - 34 + "px";
      tip.classList.add("show");
    });
    node.addEventListener("mouseleave", () => tip.classList.remove("show"));
    node.tabIndex = 0;
    node.setAttribute("aria-label", text);
    node.addEventListener("focus", () => {
      const r = node.getBoundingClientRect();
      tip.textContent = text;
      tip.style.left = r.left + "px";
      tip.style.top = r.top - 36 + "px";
      tip.classList.add("show");
    });
    node.addEventListener("blur", () => tip.classList.remove("show"));
  };
  const bar = (label, v, max, valText, tipText) => {
    const r = el(
      "div",
      { class: "bar-row" },
      el("span", { class: "lab" }, label),
      el("div", { class: "track" }, el("div", { class: "fillb", style: `width:${max ? (v / max) * 100 : 0}%` })),
      el("span", { class: "val" }, valText)
    );
    hover(r, tipText);
    return r;
  };
  const table = (id, head, rows) =>
    $("#" + id).replaceChildren(
      el(
        "table",
        { class: "tbl" },
        el(
          "thead",
          {},
          el(
            "tr",
            {},
            head.map(h => el("th", { scope: "col" }, h))
          )
        ),
        el(
          "tbody",
          {},
          rows.map(r =>
            el(
              "tr",
              {},
              r.map(c => el("td", {}, String(c)))
            )
          )
        )
      )
    );
  $$(".tbl-toggle").forEach(
    b =>
      (b.onclick = () => {
        const t = $("#" + b.dataset.tbl);
        t.hidden = !t.hidden;
        b.textContent = t.hidden ? "Show table" : "Hide table";
      })
  );
  // deterministic sample generator per period (demo mode)
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let period = "m";
  const sample = () => {
    const R = rng({ m: 7, l: 19, q: 31 }[period]),
      weeks = period === "q" ? 13 : period === "m" ? 3 : 4;
    const perWeek = Array.from({ length: weeks }, () => 3 + Math.floor(R() * 7));
    const total = perWeek.reduce((a, b) => a + b, 0);
    const contacted = Math.round(total * 0.9),
      sched = Math.round(contacted * 0.62),
      held = Math.round(sched * 0.88),
      quoted = Math.round(held * 0.8),
      won = Math.round(quoted * 0.45);
    const svc = SVCS.map((s, i) => [
      s,
      Math.max(1, Math.round(total * [0.38, 0.3, 0.34, 0.18, 0.22, 0.12, 0.2, 0.14][i] * (0.8 + R() * 0.4))),
    ]);
    const src = SRC.map((s, i) => [s, Math.max(1, Math.round(total * [0.38, 0.16, 0.27, 0.11, 0.08][i]))]);
    const startW = monday(addD(TODAY, -7 * (weeks - 1)));
    return {
      weeks: perWeek.map((n, i) => [addD(startW, i * 7), n]),
      total,
      funnel: [
        ["Enquiries", total],
        ["Contacted", contacted],
        ["Brief scheduled", sched],
        ["Brief held", held],
        ["Quoted", quoted],
        ["Won", won],
      ],
      svc,
      src,
      outcomes: [
        ["Held", held],
        ["Rescheduled", Math.max(0, Math.round(sched * 0.08))],
        ["No-show", Math.max(0, sched - held - Math.round(sched * 0.08))],
      ],
      reply: 70 + Math.round(R() * 60),
    };
  };
  const renderRep = () => {
    const d = (LIVE() && H("report", period)) || sample(),
      f = d.funnel;
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    $("#rep-kpis").replaceChildren(
      ...[
        ["Enquiries", d.total, `${(d.total / d.weeks.length).toFixed(1)} per week`],
        [
          "Avg first reply",
          d.reply == null ? "—" : `${Math.floor(d.reply / 60)} h ${d.reply % 60} m`,
          "Target under 2 hours",
        ],
        ["Briefs held", f[3][1], `${pct(f[3][1], f[2][1])}% of scheduled`],
        ["Win rate", `${pct(f[5][1], f[0][1])}%`, `${f[5][1]} won of ${f[0][1]}`],
      ].map(([k, v, s]) =>
        el("div", { class: "kpi" }, el("span", { class: "mono muted" }, k), el("b", {}, String(v)), el("small", {}, s))
      )
    );
    // weekly columns
    const mx = Math.max(...d.weeks.map(w => w[1])),
      top = Math.ceil(mx / 5) * 5 || 5;
    const cols = $("#ch-weeks");
    cols.replaceChildren(
      ...[top / 2, top].map(v =>
        el("div", { class: "gl", style: `bottom:${(v / top) * 100}%` }, el("span", {}, String(v)))
      ),
      ...d.weeks.map(([w, n]) => {
        const c = el("div", { class: "c" }, el("i", { style: `height:${(n / top) * 100}%` }));
        hover(c, `Week of ${w.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${n} enquiries`);
        return c;
      })
    );
    $("#ch-weeks-x").replaceChildren(
      ...d.weeks.map(([w]) => el("span", {}, w.toLocaleDateString("en-GB", { day: "numeric", month: "short" })))
    );
    $("#wk-sub").textContent = `${d.total} enquiries over ${d.weeks.length} weeks`;
    table(
      "t-weeks",
      ["Week of", "Enquiries"],
      d.weeks.map(([w, n]) => [w.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), n])
    );
    $("#ch-fun").replaceChildren(
      ...f.map(([s, n]) =>
        bar(s, n, Math.max(1, f[0][1]), `${pct(n, f[0][1])}%`, `${s}: ${n} (${pct(n, f[0][1])}% of enquiries)`)
      )
    );
    table(
      "t-fun",
      ["Stage", "Count", "% of enquiries"],
      f.map(([s, n]) => [s, n, pct(n, f[0][1]) + "%"])
    );
    const sv = d.svc.slice().sort((a, b) => b[1] - a[1]),
      smx = Math.max(1, sv[0][1]);
    $("#ch-svc").replaceChildren(
      ...sv.map(([s, n]) =>
        bar(
          s.replace(" & post-production", "").replace(" / business montage", " montage"),
          n,
          smx,
          String(n),
          `${s}: ${n} enquiries`
        )
      )
    );
    table("t-svc", ["Service", "Enquiries"], sv);
    const sr = d.src.slice().sort((a, b) => b[1] - a[1]),
      srx = Math.max(1, sr[0][1]),
      stt = sr.reduce((a, b) => a + b[1], 0);
    $("#ch-src").replaceChildren(
      ...sr.map(([s, n]) => bar(s, n, srx, `${pct(n, stt)}%`, `${s}: ${n} (${pct(n, stt)}%)`))
    );
    table(
      "t-src",
      ["Source", "Enquiries", "Share"],
      sr.map(([s, n]) => [s, n, pct(n, stt) + "%"])
    );
    const oc = d.outcomes,
      ot = oc.reduce((a, b) => a + b[1], 0) || 1,
      omx = Math.max(...oc.map(o => o[1])) || 1;
    $("#ch-out").replaceChildren(
      ...oc.map(([s, n]) => bar(s, n, omx, String(n), `${s}: ${n} briefs (${pct(n, ot)}%)`))
    );
    table(
      "t-out",
      ["Outcome", "Briefs", "Share"],
      oc.map(([s, n]) => [s, n, pct(n, ot) + "%"])
    );
    $("#copy-rep").onclick = async () => {
      const txt = `Syasya&Realis report (${$("#p-seg [aria-pressed=true]").textContent})${LIVE() ? "" : " — sample data"}\nEnquiries: ${d.total}\nBriefs held: ${f[3][1]}\nQuoted: ${f[4][1]}\nWon: ${f[5][1]} (${pct(f[5][1], f[0][1])}%)\nTop service: ${sv[0][0]}\nTop source: ${sr[0][0]}`;
      try {
        await navigator.clipboard.writeText(txt);
        toast("Summary copied");
      } catch {
        toast("Copy blocked by the browser");
      }
    };
  };
  $$("#p-seg button").forEach(
    b =>
      (b.onclick = () => {
        period = b.dataset.p;
        $$("#p-seg button").forEach(x => x.setAttribute("aria-pressed", x === b));
        renderRep();
      })
  );

  /* ---------- settings ---------- */
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d, i) =>
    $("#days").append(
      el(
        "label",
        { class: "chip", style: "display:inline-flex;gap:6px;align-items:center;padding:6px 10px" },
        el("input", { type: "checkbox", checked: i < 6, style: "accent-color:var(--rose)" }),
        d
      )
    )
  );
  $("#f-avail").addEventListener("submit", e => {
    e.preventDefault();
    if (LIVE()) return H("saveSettings", "#f-avail");
    addLog("Settings", "Updated brief availability");
    toast("Saved (demo)");
  });
  $("#f-notif").addEventListener("submit", e => e.preventDefault());
  $("#invite").onclick = () =>
    LIVE() ? H("invite") : toast("Demo: invite a team member in Supabase, then add them to the team (see README)");

  /* ---------- pop-ups ---------- */
  const VIS = [
    {
      id: "7F2A",
      page: "Selected work",
      secs: 312,
      dev: "Chrome · Windows",
      loc: "Jakarta, ID",
      visit: "Returning",
      p: "—",
    },
    { id: "3C9D", page: "Services", secs: 148, dev: "Safari · iPhone", loc: "Banjarnegara, ID", visit: "New", p: "—" },
    { id: "A41E", page: "Contact", secs: 95, dev: "Chrome · Android", loc: "Semarang, ID", visit: "New", p: "—" },
    { id: "B88F", page: "Hero", secs: 22, dev: "Edge · Windows", loc: "Kuala Lumpur, MY", visit: "New", p: "—" },
    {
      id: "5D07",
      page: "Photography",
      secs: 410,
      dev: "Safari · Mac",
      loc: "Yogyakarta, ID",
      visit: "Returning",
      p: "Shown",
    },
    { id: "E1B3", page: "Design", secs: 61, dev: "Chrome · Android", loc: "Bandung, ID", visit: "New", p: "—" },
  ];
  const CAMPS = [
    {
      name: "Launch week · free reel",
      type: "Special offer",
      code: "FREEREEL",
      sent: 14,
      shown: 12,
      clicked: 3,
      enq: 1,
      status: "Ended",
      at: new Date(TODAY - 5 * 1440 * 60000),
    },
  ];
  const sel = new Set();
  const until0 = addD(TODAY, 11);
  $("#pc-until").value =
    `${until0.getFullYear()}-${String(until0.getMonth() + 1).padStart(2, "0")}-${String(until0.getDate()).padStart(2, "0")}`;
  const fmtSecs = s => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);
  const pcData = () => ({
    type: $('input[name="pc-type"]:checked').value,
    val: $("#pc-val").value.trim(),
    code: $("#pc-code")
      .value.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12),
    head: $("#pc-head").value.trim(),
    msg: $("#pc-msg").value.trim(),
    cta: $("#pc-cta").value.trim() || "Book a brief",
    until: $("#pc-until").value,
    applies: $("#pc-for").value,
  });
  /* the card is built with textContent only, so admin text can never run as code on the website */
  const cardEl = d => {
    const u = d.until
      ? new Date(d.until + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "";
    return el(
      "div",
      { class: "pcard", role: "dialog", "aria-label": d.head || "Offer" },
      el("button", { class: "x", type: "button", "aria-label": "Close offer", tabindex: "-1" }, "✕"),
      el(
        "div",
        { class: "eyebrow" },
        d.type === "News" ? "News from the studio" : d.type === "Discount" ? "Limited discount" : "Special offer"
      ),
      d.val ? el("div", { class: "big" }, d.val) : null,
      el("h3", {}, d.head || "Headline"),
      el("p", {}, d.msg || "Message"),
      d.type !== "News" && d.code
        ? el("div", { class: "code" }, el("span", { class: "hint" }, "Your code"), el("b", {}, d.code))
        : null,
      el("span", { class: "cta" }, d.cta, " ↗"),
      el(
        "div",
        { class: "fine" },
        [
          d.applies !== "All services" ? `For ${d.applies.toLowerCase()}` : "For all services",
          u ? `valid until ${u}` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      )
    );
  };
  const renderPreview = () => {
    $("#pc-n").textContent = $("#pc-msg").value.length;
    $("#pc-preview").replaceChildren(cardEl(pcData()));
  };
  $("#pc-form").addEventListener("input", renderPreview);
  $("#pc-form").addEventListener("change", renderPreview);
  $("#pc-gen").onclick = () => {
    const m = TODAY.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
    $("#pc-code").value = m + Math.random().toString(36).slice(2, 5).toUpperCase();
    renderPreview();
  };
  const renderPop = () => {
    $("#c-live").textContent = VIS.length;
    $("#live-n").textContent = `${VIS.length} visitor${VIS.length === 1 ? "" : "s"} online now`;
    $("#v-rows").replaceChildren(
      ...(VIS.length
        ? VIS.map(v =>
            el(
              "tr",
              {},
              el(
                "td",
                { class: "l" },
                el(
                  "label",
                  {},
                  el("span", { class: "sr" }, `Select visitor ${v.id}`),
                  el("input", {
                    type: "checkbox",
                    checked: sel.has(v.id),
                    disabled: v.p !== "—",
                    onchange: ev => {
                      ev.target.checked ? sel.add(v.id) : sel.delete(v.id);
                      counts();
                    },
                  })
                )
              ),
              el("td", { class: "l" }, el("strong", {}, "Visitor " + v.id)),
              el("td", { class: "l" }, v.page),
              el("td", { class: "l" }, fmtSecs(v.secs)),
              el("td", { class: "l hint" }, v.dev),
              el("td", { class: "l hint" }, v.loc || "—"),
              el("td", { class: "l" }, v.visit),
              el("td", { class: "l" }, el("span", { class: "ps", "data-p": v.p }, v.p === "—" ? "Not sent" : v.p))
            )
          )
        : [el("tr", {}, el("td", { class: "l hint", colspan: "8" }, "No one is on the website right now."))])
    );
    $("#camp-rows").replaceChildren(
      ...CAMPS.map(c =>
        el(
          "tr",
          {},
          el("td", {}, el("strong", {}, c.name), el("div", { class: "hint" }, `${c.type} · ${fD(c.at)} ${fT(c.at)}`)),
          el("td", {}, el("span", { class: "mono", style: "color:var(--rose-t)" }, c.code || "—")),
          el("td", {}, String(c.sent)),
          el("td", {}, String(c.shown)),
          el("td", {}, String(c.clicked)),
          el("td", {}, String(c.enq)),
          el("td", {}, el("span", { class: "st", "data-s": c.status === "Live" ? "Won" : "Lost" }, c.status)),
          el(
            "td",
            {},
            c.status === "Live"
              ? el(
                  "button",
                  {
                    class: "btn sm",
                    onclick: () => {
                      if (LIVE()) {
                        H("stopCampaign", c);
                        return toast("Stopping…");
                      }
                      c.status = "Stopped";
                      addLog("Pop-up", `Stopped pop-up "${c.name}"`);
                      renderPop();
                      toast("Pop-up stopped — no longer shown");
                    },
                  },
                  "Stop"
                )
              : ""
          )
        )
      )
    );
    counts();
  };
  const eligible = () => VIS.filter(v => v.p === "—");
  const counts = () => {
    [...sel].forEach(id => {
      const v = VIS.find(x => x.id === id);
      if (!v || v.p !== "—") sel.delete(id);
    });
    $("#n-sel").textContent = sel.size;
    $("#n-all").textContent = eligible().length;
    const all = $("#v-all");
    all.checked = eligible().length > 0 && eligible().every(v => sel.has(v.id));
    all.indeterminate = sel.size > 0 && !all.checked;
  };
  $("#v-all").onchange = e => {
    eligible().forEach(v => (e.target.checked ? sel.add(v.id) : sel.delete(v.id)));
    renderPop();
  };
  $$('input[name="aud"]').forEach(r => (r.onchange = counts));
  let confirmTargets = [];
  $("#pc-send").onclick = () => {
    const d = pcData();
    if (!d.head) {
      toast("Add a headline first");
      return $("#pc-head").focus();
    }
    if (d.type !== "News" && !d.code) {
      toast("Add a discount code");
      return $("#pc-code").focus();
    }
    const toAll = $('input[name="aud"]:checked').value === "all";
    confirmTargets = toAll ? eligible() : eligible().filter(v => sel.has(v.id));
    if (!confirmTargets.length)
      return toast(toAll ? "No active visitors without a pop-up" : "Select at least one visitor");
    $("#cf-t").textContent =
      `"${d.head}" goes to ${confirmTargets.length} active visitor${confirmTargets.length > 1 ? "s" : ""}${toAll ? " (all)" : ""}. It appears after ${$("#pc-delay").selectedOptions[0].text.toLowerCase()} and cannot be unsent, but you can stop it.`;
    lastFocus = document.activeElement;
    $("#pc-confirm").classList.add("show");
    $("#cf-yes").focus();
  };
  const closeCf = () => {
    $("#pc-confirm").classList.remove("show");
    lastFocus && lastFocus.focus();
  };
  $("#cf-no").onclick = closeCf;
  $("#pc-confirm").addEventListener("keydown", e => {
    if (e.key === "Escape") closeCf();
  });
  $("#cf-yes").onclick = () => {
    if (LIVE()) {
      const d = pcData(),
        targets = confirmTargets.slice(),
        toAll = $('input[name="aud"]:checked').value === "all";
      sel.clear();
      closeCf();
      H("sendPopup", d, targets, toAll, +$("#pc-delay").value, $("#pc-once").checked)
        .then(n => toast(`Pop-up sent to ${n} visitor${n > 1 ? "s" : ""}`))
        .catch(err => toast(err.message));
      return;
    }
    const d = pcData(),
      targets = confirmTargets.slice(),
      c = {
        name: d.head.slice(0, 34) + (d.head.length > 34 ? "…" : ""),
        type: d.type,
        code: d.type === "News" ? "" : d.code,
        sent: targets.length,
        shown: 0,
        clicked: 0,
        enq: 0,
        status: "Live",
        at: new Date(),
      };
    CAMPS.unshift(c);
    targets.forEach(v => (v.p = "Delivered"));
    sel.clear();
    closeCf();
    addLog("Pop-up", `Sent "${c.name}" to ${targets.length} visitor${targets.length > 1 ? "s" : ""}`);
    renderPop();
    toast(`Pop-up sent to ${targets.length} visitor${targets.length > 1 ? "s" : ""}`);
    /* simulated visitor behaviour (demo mode only) */
    setTimeout(() => {
      targets.forEach(v => (v.p = "Shown"));
      c.shown = targets.length;
      renderPop();
    }, 1800);
    setTimeout(() => {
      const v = targets[0];
      v.p = "Clicked";
      c.clicked = 1;
      if (targets[1]) targets[1].p = "Closed";
      renderPop();
    }, 3400);
    setTimeout(() => {
      const v = targets[0],
        code = c.code || "INFO",
        ref = "SB-" + String(seq++).padStart(4, "0"),
        bk = `${code}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const e = Object.assign(
        mk(
          ref,
          "Simulated visitor " + v.id,
          "From pop-up click",
          d.applies === "All services"
            ? ["Company profile video"]
            : [SVCS.find(s => s.toLowerCase().startsWith(d.applies.toLowerCase().split(" ")[0])) || SVCS[0]],
          "Within a month",
          "Pop-up",
          0,
          "New",
          "Simulated enquiry sent after clicking the pop-up."
        ),
        {
          promo: {
            code,
            booking: bk,
            campaign: c.name,
            value: d.val || "Offer",
            applies: d.applies,
            until: d.until
              ? new Date(d.until + "T00:00").toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—",
          },
        }
      );
      e.log = [`Received via pop-up "${c.name}" · booking code ${bk}`];
      E.unshift(e);
      c.enq = 1;
      addLog("Pop-up", `Enquiry ${ref} came from pop-up · ${bk}`, "System");
      render();
      renderPop();
      toast(`New pop-up lead ${ref} · ${bk}`);
    }, 5200);
  };

  /* ---------- system & security ---------- */
  const mins = m => new Date(TODAY - m * 60000);
  const LOG = [
    { at: mins(4), who: "Admin", cat: "Sign-in", act: "Signed in with 2FA", dev: "Chrome · Windows · Banjarnegara" },
    { at: mins(35), who: "System", cat: "Enquiry", act: "New enquiry SB-0012 received (Website form)", dev: "—" },
    { at: mins(190), who: "System", cat: "Enquiry", act: "New enquiry SB-0011 added (WhatsApp)", dev: "—" },
    { at: mins(1500), who: "Sample Staff", cat: "Enquiry", act: "SB-0010 → Contacted", dev: "Safari · iPhone" },
    {
      at: mins(2900),
      who: "Admin",
      cat: "Brief",
      act: "Brief scheduled for SB-0009",
      dev: "Chrome · Windows · Banjarnegara",
    },
    {
      at: mins(3000),
      who: "Admin",
      cat: "Settings",
      act: "Session timeout set to 1 hour",
      dev: "Chrome · Windows · Banjarnegara",
    },
    { at: mins(4300), who: "Unknown", cat: "Sign-in", act: "Failed sign-in (wrong code)", dev: "Firefox · Linux" },
  ];
  const addLog = (cat, act, who = "Admin") =>
    LOG.unshift({ at: new Date(), who, cat, act, dev: "Chrome · Windows · Banjarnegara" });
  const USERS = [
    { name: "Admin (you)", role: "Owner", status: "Online", seen: "now", dev: "Chrome · Windows", fa: "On", me: true },
    { name: "Sample Staff", role: "Staff", status: "Idle", seen: "12 min ago", dev: "Safari · iPhone", fa: "On" },
  ];
  let logF = "All";
  ["All", "Sign-in", "Enquiry", "Brief", "Pop-up", "Content", "Settings"].forEach(k =>
    $("#log-f").append(
      el(
        "button",
        {
          "aria-pressed": String(k === logF),
          onclick: ev => {
            logF = k;
            $$("#log-f button").forEach(b => b.setAttribute("aria-pressed", b === ev.currentTarget));
            renderSys();
          },
        },
        k
      )
    )
  );
  $$("#sys-tabs button").forEach(
    b =>
      (b.onclick = () => {
        $$("#sys-tabs button").forEach(x => {
          const on = x === b;
          x.setAttribute("aria-selected", on);
          x.setAttribute("aria-pressed", on);
        });
        $$(".sys-p").forEach(p => (p.hidden = p.id !== "t-" + b.dataset.t));
        renderSys();
      })
  );
  const sDot = s =>
    el(
      "span",
      {},
      el("span", {
        class: "dot",
        style: `--c:${s === "Online" ? "var(--good)" : s === "Idle" ? "var(--warn)" : "var(--ink-4)"}`,
      }),
      s
    );
  const renderSys = () => {
    $("#c-online").textContent = USERS.filter(u => u.status === "Online").length;
    $("#log-rows").replaceChildren(
      ...LOG.filter(l => logF === "All" || l.cat === logF).map(l =>
        el(
          "tr",
          {},
          el("td", { class: "l", style: "white-space:nowrap" }, `${fD(l.at)} ${fT(l.at)}`),
          el("td", { class: "l" }, l.who),
          el("td", { class: "l" }, el("span", { class: "chip" }, l.cat), " ", l.act),
          el("td", { class: "l hint" }, l.dev)
        )
      )
    );
    $("#u-kpis").replaceChildren(
      el(
        "div",
        { class: "kpi" },
        el("span", { class: "mono muted" }, "Online now"),
        el("b", {}, String(USERS.filter(u => u.status === "Online").length)),
        el("small", {}, "Signed in and active")
      ),
      el(
        "div",
        { class: "kpi" },
        el("span", { class: "mono muted" }, "Idle"),
        el("b", {}, String(USERS.filter(u => u.status === "Idle").length)),
        el("small", {}, "Signed out automatically when idle")
      ),
      el(
        "div",
        { class: "kpi" },
        el("span", { class: "mono muted" }, "Team members"),
        el("b", {}, String(USERS.length)),
        el("small", {}, "2FA is required to sign in")
      ),
      el(
        "div",
        { class: "kpi" },
        el("span", { class: "mono muted" }, "Failed sign-ins"),
        el("b", {}, LIVE() ? "—" : String(LOG.filter(l => /Failed sign-in/.test(l.act)).length)),
        el("small", {}, LIVE() ? "See Supabase → Authentication logs" : "Last 7 days")
      )
    );
    $("#u-rows").replaceChildren(
      ...USERS.map(u =>
        el(
          "tr",
          {},
          el("td", { class: "l" }, el("strong", {}, u.name)),
          el("td", { class: "l" }, u.role),
          el("td", { class: "l" }, sDot(u.status), el("span", { class: "hint" }, " · " + u.seen)),
          el("td", { class: "l hint" }, u.dev),
          el("td", { class: "l" }, u.fa),
          el(
            "td",
            {},
            u.me
              ? el("span", { class: "hint" }, "This session")
              : LIVE()
                ? el("span", { class: "hint" }, u.last || "—")
                : el(
                    "button",
                    {
                      class: "btn sm",
                      disabled: u.status === "Offline",
                      onclick: () => {
                        u.status = "Offline";
                        u.seen = "signed out just now";
                        addLog("Sign-in", `Signed out ${u.name}'s session`);
                        renderSys();
                        toast(`${u.name} signed out`);
                      },
                    },
                    "Sign out"
                  )
          )
        )
      )
    );
    const boxes = $$("#setup-list input"),
      done = boxes.filter(b => b.checked).length;
    $("#setup-n").textContent = `${done} of ${boxes.length} done`;
    $("#setup-bar").style.width = `${(done / boxes.length) * 100}%`;
  };
  $$("#setup-list input").forEach(b => b.addEventListener("change", renderSys));
  $("#u-all").onclick = () => {
    if (LIVE()) return H("signOutOthers");
    USERS.filter(u => !u.me && u.status !== "Offline").forEach(u => {
      u.status = "Offline";
      u.seen = "signed out just now";
    });
    addLog("Sign-in", "Signed out all other sessions");
    renderSys();
    toast("All other sessions signed out");
  };
  ["#ss-access", "#ss-data"].forEach(s =>
    $(s).addEventListener("submit", e => {
      e.preventDefault();
      if (LIVE()) return H("saveSettings", s);
      addLog(
        "Settings",
        s === "#ss-access" ? "Updated sign-in & access settings" : "Updated enquiry form & data settings"
      );
      toast("Saved (demo)");
      renderSys();
    })
  );
  $("#log-csv").onclick = async () => {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Time", "Who", "Category", "Action", "Device"],
      ...LOG.map(l => [`${fD(l.at)} ${fT(l.at)}`, l.who, l.cat, l.act, l.dev]),
    ];
    try {
      await navigator.clipboard.writeText(rows.map(r => r.map(q).join(",")).join("\n"));
      toast("Log copied as CSV");
    } catch {
      toast("Copy blocked by the browser");
    }
  };

  const render = () => {
    renderSys();
    if (!$("#v-pop").hidden) renderPop();
    renderDash();
    if (!$("#v-inbox").hidden) renderInbox();
    if (!$("#v-cal").hidden) renderCal();
    if (!$("#v-rep").hidden) renderRep();
    $("#c-new").textContent = E.filter(e => e.status === "New").length;
  };
  window.__studio = {
    E,
    B,
    BLOCKS,
    VIS,
    CAMPS,
    LOG,
    USERS,
    STAGES,
    SVCS,
    TODAY,
    render,
    renderPop,
    toast,
    show,
    byRef,
    getSelected: () => selected,
    setSelected: r => {
      selected = r;
    },
    sel,
  };
  render();
  renderPreview();
  renderPop();
  if (location.hash) show(location.hash.slice(1));
  document.dispatchEvent(new Event("studio-board-ready"));
})();
