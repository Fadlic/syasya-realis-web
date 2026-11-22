/* =====================================================================
   Studio — live features for the public website
   1) the contact form saves a copy of every enquiry (RPC submit_enquiry)
      before WhatsApp / email opens, and shows the reference number
   2) anonymous visitors appear as "active" in the admin board (private
      heartbeat, RPC visitor_ping) and can receive pop-up offers sent from it
   Runs only when config.js has a Supabase URL + anon key.
   Astro version: the form lives on the home page only, pop-ups work on every page.
   An offer accepted on another page is carried to /#contact (sessionStorage "sr-offer").
   ===================================================================== */
(() => {
  const C = window.STUDIO_CONFIG || {};
  const enabled = !!(C.supabaseUrl && C.supabaseAnonKey);
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const form = $("#brief");
  const session = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } },
                    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* storage or clipboard blocked: nothing to do */ } },
                    del: k => { try { sessionStorage.removeItem(k); } catch { /* storage or clipboard blocked: nothing to do */ } } };

  /* offer → contact form (shared by the pop-up button and the carried-over offer) */
  function applyOffer(o) {
    if (!form) return;
    $("#booking-code").value = o.booking || ""; $("#campaign-id").value = o.booking ? o.id : "";
    const ap = $("#applied"); if (ap && o.booking) { ap.hidden = false; ap.replaceChildren();
      const l = document.createElement("span"); l.append(`Offer applied: ${o.value || "offer"}${o.applies_to ? " on " + o.applies_to.toLowerCase() : ""} · booking code `); const b = document.createElement("b"); b.textContent = o.booking; l.append(b);
      const rm = document.createElement("button"); rm.type = "button"; rm.textContent = "Remove offer"; rm.onclick = () => { $("#booking-code").value = ""; $("#campaign-id").value = ""; ap.hidden = true; form.dispatchEvent(new Event("input")); };
      ap.append(l, rm); }
    if (o.service_hint) { const chip = $$('#brief input[name="svc"]').find(x => x.value === o.service_hint); if (chip) chip.checked = true; }
    form.dispatchEvent(new Event("input"));
  }

  /* ---------- 1. save enquiries (home page) ---------- */
  if (form) {
    const carried = session.get("sr-offer");
    if (carried) { session.del("sr-offer"); try { applyOffer(JSON.parse(carried)); } catch { /* storage or clipboard blocked: nothing to do */ }
      setTimeout(() => form.name.focus({ preventScroll: true }), 900); }
  }
  const status = $("#saveStatus");
  const say = (t, tone) => { if (!status) return; status.textContent = t; status.dataset.tone = tone || ""; };
  const rpc = async (fn, args, token) => {
    const res = await fetch(`${C.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: "POST", keepalive: true,
      headers: { apikey: C.supabaseAnonKey, Authorization: `Bearer ${token || C.supabaseAnonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error((body && (body.message || body.hint)) || `HTTP ${res.status}`);
    return body;
  };
  const MESSAGES = {
    rate_limited: "You've sent a few enquiries already — please message us directly.",
    invalid_email: "Please check the email address.",
    invalid_name: "Please add your name.",
    invalid_code: "That offer has ended — we'll still reply to your enquiry.",
    rejected: "Could not send."
  };
  const payload = () => ({
    p_name: form.name.value.trim(),
    p_company: form.company.value.trim() || null,
    p_email: form.email.value.trim() || null,
    p_services: $$('#brief input[name="svc"]:checked').map(x => x.value),
    p_timeline: form.timeline.value || null,
    p_message: form.msg.value.trim() || null,
    p_booking_code: ($("#booking-code") || {}).value || null,
    p_campaign_id: ($("#campaign-id") || {}).value || null,
    p_website: ($("#hp-website") || {}).value || null
  });
  let lastKey = "", lastRef = null;
  const save = async () => {
    const p = payload(), key = JSON.stringify(p);
    if (key === lastKey && lastRef) return lastRef;               // no duplicate on double click
    say("Saving your enquiry…");
    try {
      let ref, ended = false;
      try { ref = await rpc("submit_enquiry", p); }
      catch (err) {                                              // offer ended → save without the code
        if (/invalid_code/.test(err.message) && p.p_booking_code) { ref = await rpc("submit_enquiry", { ...p, p_booking_code: null, p_campaign_id: null }); ended = true; }
        else throw err;
      }
      lastKey = key; lastRef = ref;
      say(`Saved · your reference is ${ref}` + (ended ? " — the offer has ended, but we'll still reply." : ""), ended ? "warn" : "ok");
      return ref;
    } catch (err) {
      const k = Object.keys(MESSAGES).find(k => err.message.includes(k));
      say(k ? MESSAGES[k] : "Couldn't save a copy — your message will still open.", "warn");
      return null;
    }
  };
  if (enabled && form) {
    const withRef = (url, ref) => ref ? url.replace(/(text=|body=)/, `$1${encodeURIComponent(`Reference: ${ref}\n`)}`) : url;
    const needName = e => { if (form.name.value.trim().length >= 2) return false; e.preventDefault(); say(MESSAGES.invalid_name, "warn"); form.name.focus(); return true; };
    $("#sendWa")?.addEventListener("click", async e => {
      const url = e.currentTarget.href; if (needName(e) || url.endsWith("#")) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const w = window.open("about:blank", "_blank");                // opened inside the click so it is not blocked
      const ref = await save();
      if (w) w.location = withRef(url, ref); else location.href = withRef(url, ref);
    }, true);
    $("#sendMail")?.addEventListener("click", async e => {
      if (needName(e)) return; e.preventDefault();
      const url = e.currentTarget.href, ref = await save();
      location.href = withRef(url, ref);
    }, true);
  }

  /* ---------- 2. live pop-ups (every page) ---------- */
  if (!enabled || C.livePopups === false) return;
  const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage or clipboard blocked: nothing to do */ } } };

  // short notice about anonymous visit data (once)
  if (C.visitNotice !== false && !store.get("studio-visit-notice")) {
    const n = document.createElement("div"); n.className = "visit-notice"; n.setAttribute("role", "status");
    const t = document.createElement("span"); t.textContent = "We use anonymous visit data to show offers. No personal data is collected until you send the form.";
    const b = document.createElement("button"); b.type = "button"; b.textContent = "OK";
    b.onclick = () => { store.set("studio-visit-notice", "1"); n.remove(); };
    n.append(t, b); document.body.appendChild(n);
  }

  /* the Supabase client comes from our own bundle (src/scripts/supabase-loader.ts), never from a CDN */
  const loader = () => window.__loadSupabase ? Promise.resolve(window.__loadSupabase)
    : new Promise(r => document.addEventListener("supabase-loader-ready", () => r(window.__loadSupabase), { once: true }));
  /* wait until the page has loaded and the browser is idle, so the client never competes with the first view */
  const idle = () => new Promise(r => {
    let done = false; const go = () => { if (done) return; done = true; EV.forEach(t => removeEventListener(t, go)); r(); };
    const EV = ["scroll", "pointerdown", "keydown", "mousemove", "touchstart"];   // first sign of a real visitor…
    EV.forEach(t => addEventListener(t, go, { once: true, passive: true }));
    const later = () => setTimeout(go, 4000);                                      // …or 4 s after the page has loaded
    document.readyState === "complete" ? later() : addEventListener("load", later, { once: true }); });
  idle().then(loader).then(load => load()).then(m => start(m.createClient)).catch(() => {});

  async function start(createClient) {
    const sb = createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, storageKey: "studio-visitor" } });
    let { data: { session: auth } } = await sb.auth.getSession();
    if (!auth) { const r = await sb.auth.signInAnonymously(); if (r.error) return; auth = r.data.session; }
    const uid = auth.user.id;

    // heartbeat: what the admin board lists as "active visitors".
    // Each visitor writes only its own row (RPC visitor_ping); only team members can read the list.
    const device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : /iPad|Tablet/i.test(navigator.userAgent) ? "Tablet" : "Desktop";
    const browser = /Edg\//.test(navigator.userAgent) ? "Edge" : /Chrome\//.test(navigator.userAgent) ? "Chrome" : /Safari\//.test(navigator.userAgent) ? "Safari" : /Firefox\//.test(navigator.userAgent) ? "Firefox" : "Browser";
    /* "Returning" = seen on an earlier day/tab; kept for the whole visit so page 2 is not counted as a return */
    const returning = session.get("sr-visit") ? session.get("sr-visit") === "Returning" : !!store.get("studio-seen");
    session.set("sr-visit", returning ? "Returning" : "New"); store.set("studio-seen", "1");
    const PAGE_NAME = { about: "about us", guidelines: "brand guidelines", faq: "faq" }[document.body.dataset.page];
    const section = () => { if (PAGE_NAME) return PAGE_NAME;
      const s = $$("main section[id], main[id]:not([hidden])").filter(x => !x.closest("[hidden]")).find(x => { const r = x.getBoundingClientRect(); return r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.3; }); return s ? (s.id === "top" ? "Hero" : s.id.replace(/-/g, " ")) : "Hero"; };
    let lastPage = "";
    const ping = (force) => { if (document.visibilityState !== "visible") return; const page = section();
      if (!force && page === lastPage) return; lastPage = page;
      sb.rpc("visitor_ping", { p_page: page, p_device: `${browser} · ${device}`, p_visit: returning ? "Returning" : "New" }).then(() => {}, () => {}); };
    ping(true);
    setInterval(() => ping(true), 30000);                                               // still here
    let tmr; addEventListener("scroll", () => { clearTimeout(tmr); tmr = setTimeout(() => ping(false), 1500); }, { passive: true });   // moved to another section
    document.addEventListener("visibilitychange", () => ping(true));
    // no "leave" call: moving between pages keeps the visit; a closed tab drops off the list after 90 s

    // pop-ups addressed to this visitor
    sb.channel(`deliveries-${uid}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "popup_deliveries", filter: `visitor_id=eq.${uid}` },
      async ({ new: d }) => { const { data } = await sb.rpc("get_delivery_campaign", { p_delivery: d.id }); if (data) queue(data, d.id); }).subscribe();

    // a campaign shown to everyone while it is live
    const { data: live } = await sb.rpc("get_live_campaign");
    if (live && !(live.once_per_visitor && store.get(`studio-popup-${live.id}`))) queue(live, null);

    function queue(c, deliveryId) { setTimeout(() => show(c, deliveryId), Math.max(0, (c.show_after_seconds || 0) * 1000)); }
    const event = (c, ev, deliveryId) => sb.rpc("popup_event", { p_campaign: c.id, p_event: ev, p_delivery: deliveryId });

    function show(c, deliveryId) {
      if (document.body.classList.contains("intro-on")) return setTimeout(() => show(c, deliveryId), 1000);   // wait until the intro trailer is closed
      const po = $("#po"); if (!po || po.classList.contains("show")) return;
      const until = c.valid_until ? new Date(c.valid_until + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
      $("#po-eye").textContent = c.type === "News" ? "News from the studio" : c.type === "Discount" ? "Limited discount" : "Special offer";
      $("#po-big").textContent = c.value || ""; $("#po-big").hidden = !c.value;
      $("#po-h").textContent = c.headline; $("#po-m").textContent = c.message;
      $("#po-codev").textContent = c.code || ""; $("#po-code").hidden = c.type === "News" || !c.code;
      $("#po-cta").textContent = (c.cta || "Book a brief") + " ↗";
      $("#po-fine").textContent = [c.applies_to && c.applies_to !== "All services" ? `For ${c.applies_to.toLowerCase()}` : "For all services", until ? `valid until ${until}` : ""].filter(Boolean).join(" · ");
      const last = document.activeElement;
      po.classList.add("show"); po.setAttribute("aria-hidden", "false"); document.body.classList.add("po-open");
      requestAnimationFrame(() => requestAnimationFrame(() => po.classList.add("in"))); setTimeout(() => $("#po-cta").focus(), 80);
      event(c, "Shown", deliveryId); store.set(`studio-popup-${c.id}`, "1");
      const close = (ev) => { po.classList.remove("in"); document.body.classList.remove("po-open"); po.setAttribute("aria-hidden", "true");
        setTimeout(() => po.classList.remove("show"), 450); if (ev) event(c, ev, deliveryId); last && last.focus && last.focus(); cleanup(); };
      const onKey = e => { if (e.key === "Escape") close("Closed");
        if (e.key === "Tab") { const f = [...po.querySelectorAll("button")].filter(b => !b.hidden); if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); } } };
      const onBg = e => { if (e.target === po) close("Closed"); };
      const onX = () => close("Closed");
      const onCode = async () => { try { await navigator.clipboard.writeText(c.code); $("#po-code span").textContent = "Copied ✓"; } catch { /* storage or clipboard blocked: nothing to do */ } };
      const onCta = () => {
        const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const rnd = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => A[b % A.length]).join("");
        const offer = { booking: c.code ? `${c.code}-${rnd}` : "", id: c.id, value: c.value, applies_to: c.applies_to, service_hint: c.service_hint };
        close("Clicked");
        if (!form) { session.set("sr-offer", JSON.stringify(offer)); location.href = "/#contact"; return; }   // the form is on the home page
        applyOffer(offer);
        document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => form.name.focus({ preventScroll: true }), 700);
      };
      po.addEventListener("keydown", onKey); po.addEventListener("click", onBg);
      $("#po-x").addEventListener("click", onX); $("#po-code").addEventListener("click", onCode); $("#po-cta").addEventListener("click", onCta);
      function cleanup() { po.removeEventListener("keydown", onKey); po.removeEventListener("click", onBg); $("#po-x").removeEventListener("click", onX); $("#po-code").removeEventListener("click", onCode); $("#po-cta").removeEventListener("click", onCta); }
    }
  }
})();
