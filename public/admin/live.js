/* =====================================================================
   Syasya&Realis admin — live connection (Supabase)
   - sign-in: email + password, then a 6-digit authenticator code (2FA).
     The first sign-in sets up the authenticator with a QR code.
   - loads enquiries, briefs, pop-ups, visitors, activity log, team and
     settings, keeps them up to date, and saves every change.
   - the Supabase client comes from our own bundle (window.__loadSupabase,
     src/scripts/supabase-loader.ts), never from a CDN.
   Runs only when /js/config.js has a Supabase URL + publishable key;
   otherwise the board stays in demo mode with sample data.
   ===================================================================== */
(() => {
  const C = window.STUDIO_CONFIG || {};
  if (!(C.supabaseUrl && C.supabaseAnonKey)) return;
  const S = window.__studio;
  if (!S) return;
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
  const fD = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  /* ---------- lock the board until signed in (styles: .gate in admin.css) ---------- */
  document.body.classList.add("locked");
  const gate = el("div", { class: "gate", role: "dialog", "aria-modal": "true", "aria-labelledby": "g-h" });
  document.body.appendChild(gate);
  const screen = (title, intro, ...kids) => {
    gate.replaceChildren(
      el(
        "div",
        { class: "box" },
        el("span", { class: "mono muted" }, "Syasya&Realis admin"),
        el("h1", { id: "g-h" }, title),
        intro ? el("p", {}, intro) : null,
        ...kids
      )
    );
    setTimeout(() => (gate.querySelector("input,button") || gate).focus(), 30);
  };
  const errLine = () => el("p", { class: "err", role: "alert" });
  const busy = (form, on) => form.querySelectorAll("button,input").forEach(x => (x.disabled = on));
  screen("Connecting…", "Loading the secure sign-in.");

  /* ---------- Supabase client (bundled) ---------- */
  let sb,
    me = null,
    settings = {},
    rt = null,
    idleTimer = null;
  /* last activity, shared by all admin tabs of this browser */
  const ls = {
    get: k => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, String(v));
      } catch {
        /* storage blocked: the in-page timer still works */
      }
    },
  };
  const idleMin = () => +settings.session_timeout_min || +ls.get("studio-admin-idle-min") || 15;
  const idle = {
    last: () => +ls.get("studio-admin-active") || 0,
    touch: (t = Date.now()) => ls.set("studio-admin-active", t),
    setMin: m => ls.set("studio-admin-idle-min", m),
    expired: () => idle.last() > 0 && Date.now() - idle.last() > idleMin() * 60000,
    /* this device only — the team's other signed-in devices stay signed in */
    signOut: async () => {
      try {
        sessionStorage.setItem("studio-admin-idle-out", String(idleMin()));
      } catch {
        /* no notice after reload, sign-out still happens */
      }
      ls.set("studio-admin-active", 0);
      await sb.auth.signOut({ scope: "local" });
    },
  };
  const loader = () =>
    window.__loadSupabase
      ? Promise.resolve(window.__loadSupabase)
      : new Promise(r =>
          document.addEventListener("supabase-loader-ready", () => r(window.__loadSupabase), { once: true })
        );
  loader()
    .then(load => load())
    .then(m => {
      sb = m.createClient(C.supabaseUrl, C.supabaseAnonKey, {
        auth: { storageKey: "studio-admin", persistSession: true },
      });
      route();
    })
    .catch(() =>
      screen("Can't load sign-in", "The sign-in could not be loaded. Check the internet connection and reload.")
    );

  const device = () => {
    const u = navigator.userAgent;
    const b = /Edg\//.test(u)
      ? "Edge"
      : /Chrome\//.test(u)
        ? "Chrome"
        : /Safari\//.test(u)
          ? "Safari"
          : /Firefox\//.test(u)
            ? "Firefox"
            : "Browser";
    const o = /Windows/.test(u)
      ? "Windows"
      : /iPhone|iPad/.test(u)
        ? "iOS"
        : /Mac OS/.test(u)
          ? "Mac"
          : /Android/.test(u)
            ? "Android"
            : /Linux/.test(u)
              ? "Linux"
              : "Device";
    return `${b} · ${o}`;
  };

  async function route() {
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (session && !session.user.is_anonymous && idle.expired()) {
      await idle.signOut();
      return stepLogin();
    }
    if (!session || session.user.is_anonymous) {
      if (session) await sb.auth.signOut();
      return stepLogin();
    }
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.currentLevel === "aal2") return enter();
    const { data: f } = await sb.auth.mfa.listFactors();
    const all = (f && (f.all || f.totp)) || [];
    const ok = all.find(x => x.factor_type === "totp" && x.status === "verified");
    if (ok) return stepVerify(ok.id);
    for (const x of all.filter(x => x.status !== "verified")) await sb.auth.mfa.unenroll({ factorId: x.id });
    return stepEnroll();
  }

  function stepLogin() {
    const err = errLine();
    const f = el(
      "form",
      {},
      el(
        "div",
        { class: "fld" },
        el("label", { for: "g-em" }, "Email"),
        el("input", { id: "g-em", type: "email", autocomplete: "username", required: true })
      ),
      el(
        "div",
        { class: "fld" },
        el("label", { for: "g-pw" }, "Password"),
        el("input", { id: "g-pw", type: "password", autocomplete: "current-password", required: true })
      ),
      err,
      el("button", { class: "btn fill", type: "submit" }, "Continue")
    );
    f.addEventListener("submit", async ev => {
      ev.preventDefault();
      busy(f, true);
      err.textContent = "";
      const { error } = await sb.auth.signInWithPassword({
        email: $("#g-em").value.trim(),
        password: $("#g-pw").value,
      });
      busy(f, false);
      if (error) {
        err.textContent = /rate|too many/i.test(error.message)
          ? "Too many attempts. Wait a few minutes and try again."
          : "Email or password is not correct.";
        $("#g-pw").value = "";
        return $("#g-pw").focus();
      }
      idle.touch();
      route();
    });
    let out = null;
    try {
      out = sessionStorage.getItem("studio-admin-idle-out");
      sessionStorage.removeItem("studio-admin-idle-out");
    } catch {
      /* storage blocked */
    }
    screen(
      "Sign in",
      out
        ? `You were signed out after ${out} minute${out === "1" ? "" : "s"} without activity. Sign in again to continue.`
        : "Team members only. You'll be asked for a code from your authenticator app.",
      f
    );
  }

  function stepVerify(factorId) {
    const err = errLine();
    const f = el(
      "form",
      {},
      el(
        "div",
        { class: "fld" },
        el("label", { for: "g-otp" }, "6-digit code"),
        el("input", {
          id: "g-otp",
          class: "otp",
          inputmode: "numeric",
          autocomplete: "one-time-code",
          pattern: "[0-9]{6}",
          maxlength: "6",
          required: true,
        })
      ),
      err,
      el("button", { class: "btn fill", type: "submit" }, "Verify"),
      el(
        "button",
        {
          class: "btn",
          type: "button",
          onclick: async () => {
            await sb.auth.signOut();
            stepLogin();
          },
        },
        "Use another account"
      )
    );
    f.addEventListener("submit", async ev => {
      ev.preventDefault();
      busy(f, true);
      err.textContent = "";
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: $("#g-otp").value.trim() });
      busy(f, false);
      if (error) {
        err.textContent = "That code didn't work. Wait for a new code and try again.";
        $("#g-otp").value = "";
        return $("#g-otp").focus();
      }
      enter();
    });
    screen("Two-step check", "Open your authenticator app and enter the current code for Syasya&Realis.", f);
  }

  async function stepEnroll() {
    const { data, error } = await sb.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Syasya&Realis admin " + new Date().toISOString().slice(0, 10),
    });
    if (error) return screen("Can't set up 2FA", error.message);
    const qr = data.totp.qr_code.startsWith("data:")
      ? data.totp.qr_code
      : "data:image/svg+xml;utf8," + encodeURIComponent(data.totp.qr_code);
    const err = errLine();
    const f = el(
      "form",
      {},
      el(
        "div",
        { class: "fld" },
        el("label", { for: "g-otp" }, "Code from the app"),
        el("input", {
          id: "g-otp",
          class: "otp",
          inputmode: "numeric",
          autocomplete: "one-time-code",
          pattern: "[0-9]{6}",
          maxlength: "6",
          required: true,
        })
      ),
      err,
      el("button", { class: "btn fill", type: "submit" }, "Turn on 2FA")
    );
    f.addEventListener("submit", async ev => {
      ev.preventDefault();
      busy(f, true);
      err.textContent = "";
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: data.id, code: $("#g-otp").value.trim() });
      busy(f, false);
      if (error) {
        err.textContent = "That code didn't work. Check the phone's time is automatic and try again.";
        return $("#g-otp").focus();
      }
      enter();
    });
    screen(
      "Set up 2FA",
      "Scan this with Google Authenticator, Microsoft Authenticator or 1Password, then enter the 6-digit code. 2FA is required for every admin.",
      el("div", { class: "qr" }, el("img", { src: qr, alt: "QR code for your authenticator app" })),
      el(
        "p",
        { class: "hint", style: "margin-top:10px" },
        "Can't scan? Enter this key by hand: ",
        el("code", {}, data.totp.secret)
      ),
      f
    );
  }

  async function enter() {
    screen("Loading…", "Fetching enquiries and briefs.");
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: tm } = await sb.from("team_members").select("role, display_name").eq("user_id", uid).maybeSingle();
    if (!tm) {
      await sb.auth.signOut();
      return screen(
        "No access",
        "This account is not on the studio team. Ask the owner to add you.",
        el("button", { class: "btn", style: "margin-top:16px", onclick: stepLogin }, "Back to sign in")
      );
    }
    me = { id: uid, name: tm.display_name, role: tm.role };
    await sb.rpc("record_sign_in", { p_device: device() });
    window.STUDIO_LIVE = API;
    API.on = true;
    // clear sample data and demo-only copy
    [S.E, S.B, S.BLOCKS, S.VIS, S.CAMPS, S.LOG, S.USERS].forEach(a => (a.length = 0));
    const flag = $("#mode-flag");
    flag.textContent = "Live · connected";
    flag.classList.add("live");
    $$(".demo-only").forEach(p => (p.hidden = true));
    const status = $("#sys-status");
    if (status) {
      status.textContent = "Live";
      status.dataset.s = "Won";
    }
    const meBox = $(".me");
    if (meBox) {
      meBox.querySelector(".av").textContent = me.name
        .split(/\s+/)
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      meBox.querySelector(":scope > div > div:first-child").textContent = me.name;
      meBox.querySelector(".hint").textContent = `${me.role === "owner" ? "Owner" : "Staff"} · 2FA on`;
      if (!$("#signout"))
        meBox.after(
          el(
            "button",
            {
              class: "btn sm",
              id: "signout",
              style: "margin:8px 14px",
              onclick: async () => {
                await sb.auth.signOut();
                location.reload();
              },
            },
            "Sign out"
          )
        );
    }
    const hello = $("#h-dash .serif");
    if (hello) hello.textContent = me.name.split(/\s+/)[0] + ".";
    await loadAll();
    subscribe();
    watchVisitors();
    startIdle();
    gate.remove();
    document.body.classList.remove("locked");
    S.show(location.hash.slice(1) || "dash");
    /* the Content panel (content.js) uses the same signed-in client */
    window.__adminDB = { sb, me, url: C.supabaseUrl };
    document.dispatchEvent(new Event("studio-live-ready"));
  }

  /* ---------- load everything ---------- */
  const must = r => {
    if (r.error) throw r.error;
    return r.data;
  };
  async function loadAll() {
    try {
      const [enq, br, camps, stats, log, team, set, deliv] = await Promise.all([
        sb.from("enquiries").select("*").order("created_at", { ascending: false }).limit(2000),
        sb.from("briefs").select("*").order("starts_at"),
        sb.from("campaigns").select("*"),
        sb.from("campaign_stats").select("*").order("created_at", { ascending: false }),
        sb.from("activity_log").select("*").order("at", { ascending: false }).limit(500),
        sb.from("team_members").select("*"),
        sb.from("settings").select("data").eq("id", 1).single(),
        sb.from("popup_deliveries").select("campaign_id, visitor_id, status").limit(5000),
      ]).then(rs => rs.map(must));
      S.TODAY.setTime(Date.now());
      settings = set.data || {};
      const campById = Object.fromEntries(camps.map(c => [c.id, c]));
      const live = new Set(camps.filter(c => c.status === "Live").map(c => c.id));
      // activity log
      S.LOG.length = 0;
      log.forEach(l =>
        S.LOG.push({
          at: new Date(l.at),
          who: l.actor_name,
          cat: l.category,
          act: l.action,
          dev: l.category === "Sign-in" ? l.action.split(" · ").slice(1).join(" · ") || "—" : "—",
          entity: l.entity_id,
          actor: l.actor,
        })
      );
      // briefs (need enquiry refs)
      const refById = Object.fromEntries(enq.map(e => [e.id, e.ref]));
      const briefIdsByEnq = {};
      S.B.length = 0;
      br.filter(b => refById[b.enquiry_id]).forEach(b => {
        (briefIdsByEnq[b.enquiry_id] ||= []).push(b.id);
        S.B.push({
          id: b.id,
          enquiry_id: b.enquiry_id,
          ref: refById[b.enquiry_id],
          start: new Date(b.starts_at),
          dur: b.duration_min,
          mode: b.mode,
          status: b.status,
          notes: b.notes || {},
        });
      });
      // enquiries
      const read = readSet();
      S.E.length = 0;
      enq.forEach(r => {
        const c = r.campaign_id && campById[r.campaign_id];
        const ids = new Set([r.id, ...(briefIdsByEnq[r.id] || [])]);
        const hist = S.LOG.filter(l => ids.has(l.entity))
          .slice()
          .reverse()
          .map(
            l =>
              `${l.act} · ${l.who} · ${l.at.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${l.at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
          );
        S.E.push({
          id: r.id,
          ref: r.ref,
          name: r.name,
          company: r.company || r.name,
          email: r.email || "—",
          phone: r.phone || "",
          svcs: r.services || [],
          timeline: r.timeline || "—",
          src: r.source,
          at: new Date(r.created_at),
          status: r.stage,
          msg: r.message || "—",
          read: r.stage !== "New" || read.has(r.id),
          notes: r.notes || "",
          first_reply_at: r.first_reply_at && new Date(r.first_reply_at),
          log: hist.length ? hist : [`Received via ${r.source}`],
          promo: r.booking_code
            ? {
                code: r.booking_code.split("-")[0],
                booking: r.booking_code,
                campaign: c ? c.name : "Pop-up",
                value: (c && c.value) || "Offer",
                applies: c ? c.applies_to : "—",
                until: c && c.valid_until ? fD(new Date(c.valid_until + "T00:00")) : "—",
              }
            : null,
        });
      });
      // campaigns
      S.CAMPS.length = 0;
      stats.forEach(c =>
        S.CAMPS.push({
          id: c.id,
          name: c.name,
          type: c.type,
          code: c.code || "",
          sent: +c.sent,
          shown: +c.shown,
          clicked: +c.clicked,
          enq: +c.enquiries,
          status: c.status,
          at: new Date(c.created_at),
        })
      );
      deliveryStatus = {};
      deliv
        .filter(d => live.has(d.campaign_id))
        .forEach(d => {
          deliveryStatus[d.visitor_id] = d.status;
        });
      // team
      S.USERS.length = 0;
      team.forEach(t => {
        const last = S.LOG.find(l => l.cat === "Sign-in" && l.actor === t.user_id);
        S.USERS.push({
          name: t.user_id === me.id ? `${t.display_name} (you)` : t.display_name,
          role: t.role === "owner" ? "Owner" : "Staff",
          status: t.user_id === me.id ? "Online" : "Offline",
          seen:
            t.user_id === me.id
              ? "now"
              : last
                ? `last sign-in ${last.at.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : "never signed in",
          dev: last ? last.dev : "—",
          fa: last ? "On" : "Not set up yet",
          me: t.user_id === me.id,
          last: last ? fD(last.at) : "—",
        });
      });
      const tr = $("#team-rows");
      if (tr)
        tr.replaceChildren(
          ...S.USERS.map(u =>
            el("tr", {}, el("td", {}, u.name), el("td", {}, u.role), el("td", {}, u.fa), el("td", {}, u.last))
          )
        );
      fillSettings();
      if (!S.E.find(e => e.ref === S.getSelected()) && S.E[0]) S.setSelected(S.E[0].ref);
      S.render();
      S.renderPop();
    } catch (e) {
      S.toast("Couldn't load data: " + (e.message || e));
    }
  }
  const readSet = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem("studio-read") || "[]"));
    } catch {
      return new Set();
    }
  };
  document.addEventListener("click", ev => {
    const li = ev.target.closest("#list .li");
    if (!li || !API.on) return;
    const e = S.byRef(S.getSelected());
    if (!e) return;
    const r = readSet();
    r.add(e.id);
    try {
      localStorage.setItem("studio-read", JSON.stringify([...r].slice(-500)));
    } catch {
      /* storage blocked: unread dots come back after reload */
    }
  });

  /* ---------- realtime (database changes) ---------- */
  let reloadT;
  const reload = () => {
    clearTimeout(reloadT);
    reloadT = setTimeout(loadAll, 400);
  };
  function subscribe() {
    rt = sb.channel("admin-db");
    ["enquiries", "briefs", "popup_deliveries", "campaign_views", "activity_log"].forEach(t =>
      rt.on("postgres_changes", { event: "*", schema: "public", table: t }, p => {
        if (t === "enquiries" && p.eventType === "INSERT")
          S.toast(`New enquiry ${p.new.ref}${p.new.booking_code ? " · pop-up " + p.new.booking_code : ""}`);
        reload();
      })
    );
    rt.subscribe();
  }

  /* ---------- active website visitors ----------
     Visitors send a heartbeat (RPC visitor_ping) every 30 s into the private
     table visitor_presence; only team members can read it. A visitor counts as
     "on the site" while their last heartbeat is under 90 s old. */
  let deliveryStatus = {},
    visWarned = false;
  const ACTIVE_S = 90;
  async function pollVisitors() {
    const since = new Date(Date.now() - ACTIVE_S * 1000).toISOString();
    const { data, error } = await sb
      .from("visitor_presence")
      .select("visitor_id, page, device, visit, since, seen_at")
      .gt("seen_at", since)
      .order("since");
    if (error) {
      if (!visWarned) {
        visWarned = true;
        S.toast("Visitor list unavailable: " + error.message);
      }
      return;
    }
    S.VIS.length = 0;
    data.forEach(v =>
      S.VIS.push({
        id: v.visitor_id.slice(0, 4).toUpperCase(),
        uid: v.visitor_id,
        page: v.page || "—",
        secs: Math.max(0, Math.round((Date.now() - new Date(v.since)) / 1000)),
        dev: v.device || "—",
        loc: "—",
        visit: v.visit || "New",
        p: deliveryStatus[v.visitor_id] || "—",
      })
    );
    S.renderPop();
  }
  function watchVisitors() {
    pollVisitors();
    setInterval(() => {
      if (document.visibilityState === "visible") pollVisitors();
    }, 15000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pollVisitors();
    });
  }

  /* ---------- auto sign-out after inactivity ----------
     The time of the last activity is kept in localStorage, so the limit also holds after the
     tab was closed, the laptop slept or another admin tab was used (all tabs share it).
     Limit: Settings → "Sign out after inactivity" (default 15 minutes). */
  function startIdle() {
    idle.setMin(idleMin());
    let lastWrite = 0,
      warn = null;
    const hideWarn = () => warn && (warn.remove(), (warn = null));
    const mark = () => {
      const n = Date.now();
      hideWarn();
      if (n - lastWrite > 5000) {
        lastWrite = n;
        idle.touch(n);
      }
    };
    ["click", "keydown", "mousemove", "scroll", "touchstart", "input"].forEach(e =>
      addEventListener(e, mark, { passive: true, capture: true })
    );
    idle.touch();
    const check = async () => {
      idle.setMin(idleMin());
      const left = idle.last() + idleMin() * 60000 - Date.now();
      if (left <= 0) {
        clearInterval(idleTimer);
        await idle.signOut();
        location.reload();
      } else if (left <= 60000) {
        if (!warn) {
          warn = el("div", { class: "idle-warn", role: "alert" });
          document.body.append(warn);
        }
        warn.textContent = `No activity — signing out in ${Math.ceil(left / 1000)} s. Move the mouse or press a key to stay signed in.`;
      } else hideWarn();
    };
    idleTimer = setInterval(check, 5000);
    document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && check());
    /* signed out in another tab (or by the idle limit there): close this one too */
    sb.auth.onAuthStateChange(ev => {
      if (ev === "SIGNED_OUT") location.reload();
    });
  }

  /* ---------- settings form <-> database (only settings that are really used) ---------- */
  const num = t => parseInt(String(t).match(/\d+/) || [0], 10);
  const setSel = (sel, match) => {
    if (!sel) return;
    const o = [...sel.options].find(o => match(o.textContent));
    if (o) sel.value = o.value || o.textContent;
  };
  function fillSettings() {
    const d = settings;
    if (d.brief_from) $("#s-from").value = d.brief_from;
    if (d.brief_to) $("#s-to").value = d.brief_to;
    setSel($("#s-dur"), t => num(t) === +d.brief_length_min);
    setSel($("#s-buf"), t => (num(t) || 0) === +d.brief_gap_min);
    if (Array.isArray(d.brief_days))
      $$("#days label").forEach(l => (l.querySelector("input").checked = d.brief_days.includes(l.textContent.trim())));
    const acc = $$("#ss-access select:not([disabled])"),
      dat = $$("#ss-data select:not([disabled])");
    setSel(acc[0], t => (/hour/.test(t) ? num(t) * 60 : num(t)) === +d.session_timeout_min);
    setSel(dat[0], t => num(t) === +d.form_limit_per_hour);
    setSel(dat[1], t => num(t) === +d.lost_retention_months);
  }

  /* ---------- reports from real data ---------- */
  const monday = d => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  };
  function report(period) {
    const now = new Date();
    let from,
      to = now;
    if (period === "m") from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === "l") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 1);
    } else from = new Date(+now - 90 * 864e5);
    const E = S.E.filter(e => e.at >= from && e.at < to),
      ids = new Set(E.map(e => e.id));
    const weeks = [];
    for (let w = monday(from); w < to; w = new Date(+w + 7 * 864e5))
      weeks.push([w, E.filter(e => e.at >= w && e.at < new Date(+w + 7 * 864e5)).length]);
    const briefsOf = S.B.filter(b => ids.has(b.enquiry_id));
    const withBrief = new Set(briefsOf.map(b => b.enquiry_id)),
      held = new Set(briefsOf.filter(b => b.status === "Done").map(b => b.enquiry_id));
    const total = E.length;
    const funnel = [
      ["Enquiries", total],
      ["Contacted", E.filter(e => e.status !== "New").length],
      ["Brief scheduled", withBrief.size],
      ["Brief held", held.size],
      ["Quoted", E.filter(e => ["Quoted", "Won"].includes(e.status)).length],
      ["Won", E.filter(e => e.status === "Won").length],
    ];
    const replies = E.filter(e => e.first_reply_at).map(e => Math.round((e.first_reply_at - e.at) / 60000));
    const srcs = [...new Set(["Website form", "Pop-up", "WhatsApp", "Email", "Instagram DM", ...E.map(e => e.src)])];
    const inWin = S.B.filter(b => b.start >= from && b.start < to);
    return {
      weeks: weeks.length ? weeks : [[monday(from), 0]],
      total,
      funnel,
      svc: S.SVCS.map(s => [s, E.filter(e => e.svcs.includes(s)).length]),
      src: srcs.map(s => [s, E.filter(e => e.src === s).length]),
      outcomes: [
        ["Held", inWin.filter(b => b.status === "Done").length],
        ["Rescheduled", inWin.filter(b => b.status === "Cancelled").length],
        ["No-show", inWin.filter(b => b.status === "No-show").length],
      ],
      reply: replies.length ? Math.round(replies.reduce((a, b) => a + b, 0) / replies.length) : null,
    };
  }

  /* ---------- hooks called by the board ---------- */
  const fail = e => {
    S.toast("Not saved: " + (e.message || e));
    reload();
  };
  const run = q =>
    q.then(r => {
      if (r.error) throw r.error;
      return r.data;
    });
  let notesT = {};
  const API = {
    on: false,
    stage: (e, s) => run(sb.from("enquiries").update({ stage: s }).eq("id", e.id)).catch(fail),
    notes: (e, text) => {
      clearTimeout(notesT[e.id]);
      notesT[e.id] = setTimeout(
        () =>
          run(
            sb
              .from("enquiries")
              .update({ notes: text.slice(0, 4000) })
              .eq("id", e.id)
          ).catch(fail),
        800
      );
    },
    addBrief: (b, e, agenda) =>
      run(
        sb
          .from("briefs")
          .insert({ enquiry_id: e.id, starts_at: b.start.toISOString(), duration_min: b.dur, mode: b.mode, agenda })
          .select("id")
          .single()
      )
        .then(r => {
          b.id = r.id;
          b.enquiry_id = e.id;
        })
        .catch(fail),
    updateBrief: (b, patch) =>
      typeof b.id !== "string"
        ? S.toast("Still saving — try again in a moment")
        : run(sb.from("briefs").update(patch).eq("id", b.id)).catch(fail),
    addEnquiry: p =>
      run(
        sb
          .from("enquiries")
          .insert({
            name: p.name,
            company: p.company || null,
            services: p.services,
            timeline: p.timeline,
            source: p.source,
            message: p.message || null,
            created_by: me.id,
          })
          .select("ref")
          .single()
      ).then(r => {
        reload();
        return r.ref;
      }),
    sendPopup: async (d, targets, toAll, delay, once) => {
      const hint =
        d.applies === "All services"
          ? null
          : S.SVCS.find(s => s.toLowerCase().startsWith(d.applies.toLowerCase().split(" ")[0])) || null;
      const c = await run(
        sb
          .from("campaigns")
          .insert({
            name: d.head.slice(0, 80),
            type: d.type,
            value: d.val || null,
            headline: d.head,
            message: d.msg || d.head,
            code: d.type === "News" ? null : d.code,
            cta: (d.cta || "Book a brief").slice(0, 24),
            applies_to: d.applies,
            service_hint: hint,
            valid_until: d.until || null,
            show_after_seconds: delay || 0,
            once_per_visitor: once,
            audience: toAll ? "present" : "selected",
          })
          .select("id")
          .single()
      );
      await run(sb.from("popup_deliveries").insert(targets.map(v => ({ campaign_id: c.id, visitor_id: v.uid }))));
      targets.forEach(v => {
        deliveryStatus[v.uid] = "Delivered";
      });
      reload();
      pollVisitors();
      return targets.length;
    },
    stopCampaign: c =>
      run(sb.from("campaigns").update({ status: "Stopped", stopped_at: new Date().toISOString() }).eq("id", c.id))
        .then(() => {
          S.toast("Pop-up stopped");
          reload();
        })
        .catch(fail),
    saveSettings: async form => {
      const d = { ...settings };
      if (form === "#f-avail")
        Object.assign(d, {
          brief_from: $("#s-from").value,
          brief_to: $("#s-to").value,
          brief_length_min: num($("#s-dur").value) || 45,
          brief_gap_min: num($("#s-buf").value),
          brief_days: $$("#days label")
            .filter(l => l.querySelector("input").checked)
            .map(l => l.textContent.trim()),
        });
      if (form === "#ss-access") {
        const s = $$("#ss-access select:not([disabled])");
        const t = s[0].selectedOptions[0].textContent;
        d.session_timeout_min = /hour/.test(t) ? num(t) * 60 : num(t);
      }
      if (form === "#ss-data") {
        const s = $$("#ss-data select:not([disabled])");
        d.form_limit_per_hour = num(s[0].value) || 3;
        d.lost_retention_months = num(s[1].value) || 12;
      }
      ["ui_f-notif", "ui_ss-access", "ui_ss-data"].forEach(k => delete d[k]); // old design-only choices: no longer stored
      try {
        const rows = await run(sb.from("settings").update({ data: d }).eq("id", 1).select("id"));
        if (!rows.length) return S.toast("Only the owner can change settings");
        settings = d;
        S.toast("Settings saved");
        reload();
      } catch (e) {
        fail(e);
      }
    },
    signOutOthers: () =>
      sb.auth
        .signOut({ scope: "others" })
        .then(({ error }) => S.toast(error ? error.message : "Your other sessions are signed out")),
    invite: () => S.toast("Invite in Supabase → Authentication → Users, then add them to team_members (see README)"),
    report,
    avgReply: () => {
      const since = Date.now() - 30 * 864e5,
        r = S.E.filter(e => e.first_reply_at && +e.at >= since).map(e => (e.first_reply_at - e.at) / 60000);
      if (!r.length) return null;
      const m = Math.round(r.reduce((a, b) => a + b, 0) / r.length);
      return `${Math.floor(m / 60)} h ${m % 60} m`;
    },
  };
})();
