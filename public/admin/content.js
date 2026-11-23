/* =====================================================================
   Syasya&Realis admin — Content panel (CMS)
   Signed in (live): reads and saves the DRAFT in public.site_content,
   publishes with publish_content(), restores with restore_version(),
   discards with discard_drafts(), and uploads media to the Storage bucket
   "media" (+ a row in media_assets). The website reads the PUBLISHED copy
   when it is built (src/lib/content.mjs).
   Not signed in (demo): the same screens on the built-in content; changes
   stay in this page.
   Every text is set with textContent / value — never parsed as HTML.
   ===================================================================== */
(() => {
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  const h = (t, a = {}, ...k) => {
    const e = document.createElement(t);
    for (const [n, v] of Object.entries(a)) {
      if (v === false || v == null) continue;
      if (n.startsWith("on")) e.addEventListener(n.slice(2), v);
      else if (n === "value") e.value = v;
      else if (n === "checked") e.checked = !!v;
      else e.setAttribute(n, v === true ? "" : v);
    }
    e.append(...k.flat().filter(x => x != null && x !== false));
    return e;
  };
  const toast = t => {
    const d = h("div", { class: "cm-toast", role: "status" }, t);
    document.body.append(d);
    setTimeout(() => d.remove(), 3200);
  };
  const CFG = (() => {
    try {
      return JSON.parse($("#content-defaults").textContent);
    } catch {
      return null;
    }
  })();
  if (!CFG) return;
  const KEYS = ["site", "pages", "archive"];
  const MAX_MB = 50,
    MAX = MAX_MB * 1048576,
    QUOTA = 1024 * 1048576; // bucket limit · Free plan storage (1 GB)
  const clone = v => JSON.parse(JSON.stringify(v));
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  /* same rule as the website build: saved values over the built-in ones, lists replaced whole */
  const merge = (base, over) => {
    if (over === undefined || over === null) return clone(base);
    if (Array.isArray(base) || Array.isArray(over)) return clone(Array.isArray(over) ? over : base);
    if (isObj(base) && isObj(over)) {
      const o = clone(base);
      for (const k of Object.keys(over)) o[k] = k in base ? merge(base[k], over[k]) : clone(over[k]);
      return o;
    }
    return typeof over === typeof base || base === undefined ? over : base;
  };
  const get = (o, path) => path.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
  const set = (o, path, v) => {
    const ks = path.split(".");
    let x = o;
    ks.slice(0, -1).forEach((k, i) => {
      if (x[k] == null) x[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
      x = x[k];
    });
    x[ks.at(-1)] = v;
  };
  const unset = (o, path) => {
    const ks = path.split("."),
      p = ks.length === 1 ? o : get(o, ks.slice(0, -1).join("."));
    if (p && typeof p === "object") delete p[ks.at(-1)];
  };
  const mb = n => (n / 1048576).toFixed(1) + " MB";
  const fmtDate = d =>
    new Date(d).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const G = [
    "linear-gradient(135deg,#3A0D12,#0E0B0A)",
    "linear-gradient(160deg,#16252E,#0C0A09)",
    "linear-gradient(135deg,#2E0B10,#0D0B0A)",
  ];
  const abs = u => (!u ? "" : /^(https?:|blob:|data:)/.test(u) ? u : "/" + u.replace(/^\/+/, "")); // site paths are relative to "/"

  /* ---------- state ---------- */
  const DB = { live: false, sb: null, url: "", me: null };
  const draft = {},
    pub = {};
  let assets = [],
    versions = [];
  const saveT = {},
    saving = new Set();
  KEYS.forEach(k => {
    draft[k] = clone(CFG.defaults[k]);
    pub[k] = clone(CFG.defaults[k]);
  });

  /* ---------- status, dirty, saving ---------- */
  const NAMES = { site: "Site settings", pages: "Page text", archive: "Archive" };
  const dirtyKeys = () => KEYS.filter(k => JSON.stringify(draft[k]) !== JSON.stringify(pub[k]));
  const state = (t, tone) => {
    const s = $("#cmState");
    s.classList.toggle("dirty", tone === "dirty");
    s.querySelector("span").textContent = t;
  };
  const refreshState = () => {
    const d = dirtyKeys(),
      n = d.length;
    $("#cmPublish").disabled = !n;
    $("#cmDock").hidden = !n;
    $("#cmDockText").textContent = n ? `Unpublished changes: ${d.map(k => NAMES[k]).join(", ")}` : "";
    if (saving.size) state("Saving draft…", "dirty");
    else
      state(
        n
          ? DB.live
            ? "Draft saved — not on the website yet"
            : "Changed in this demo — not saved"
          : "Everything is published",
        n ? "dirty" : ""
      );
  };
  const changed = k => {
    if (DB.live) {
      clearTimeout(saveT[k]);
      saving.add(k);
      saveT[k] = setTimeout(() => saveKey(k), 800);
    }
    refreshState();
  };
  async function saveKey(k) {
    clearTimeout(saveT[k]);
    try {
      const { data, error } = await DB.sb.from("site_content").update({ draft: draft[k] }).eq("key", k).select("key");
      if (error) throw error;
      if (!data.length) throw new Error("not allowed");
    } catch (e) {
      toast(`Draft not saved: ${e.message || e}`);
    }
    saving.delete(k);
    refreshState();
  }
  const flush = () => Promise.all(KEYS.filter(k => saving.has(k)).map(saveKey));

  /* ---------- load ---------- */
  async function loadLive() {
    const { sb } = DB;
    state("Loading…");
    try {
      const [rows, media, hist] = await Promise.all([
        sb.from("site_content").select("key, draft, published"),
        sb.from("media_assets").select("*").order("created_at", { ascending: false }),
        sb
          .from("content_versions")
          .select("id, note, published_name, published_at")
          .order("id", { ascending: false })
          .limit(30),
      ]);
      for (const r of [rows, media, hist]) if (r.error) throw r.error;
      const byKey = Object.fromEntries(rows.data.map(r => [r.key, r]));
      const val = o => (o && Object.keys(o).length ? o : undefined);
      KEYS.forEach(k => {
        const r = byKey[k] || {};
        pub[k] = merge(CFG.defaults[k], val(r.published));
        draft[k] = merge(CFG.defaults[k], val(r.draft));
      });
      assets = media.data;
      versions = hist.data;
      renderAll();
    } catch (e) {
      state("Could not load content");
      toast(`Couldn't load content: ${e.message || e}`);
    }
  }

  /* ---------- tabs ---------- */
  $$(".cm-tabs [data-t]").forEach(
    b =>
      (b.onclick = () => {
        $$(".cm-tabs [data-t]").forEach(x => x.setAttribute("aria-selected", x === b));
        $$(".cm-pane").forEach(p => (p.hidden = p.dataset.p !== b.dataset.t));
      })
  );

  /* ---------- media library ---------- */
  const publicUrl = path => `${DB.url}/storage/v1/object/public/media/${path}`;
  const library = () => {
    const up = assets.map(a => ({
      id: a.id,
      name: a.original_name || a.path.split("/").pop(),
      kind: a.kind,
      url: a.url || publicUrl(a.path),
      size: a.size_bytes,
      w: a.width,
      h: a.height,
      asset: a,
    }));
    const seen = new Set(),
      built = [];
    const add = (url, kind) => {
      if (!url || seen.has(url) || /^https?:/.test(url)) return;
      seen.add(url);
      built.push({ id: "b:" + url, name: url.split("/").pop(), kind, url, builtin: true });
    };
    CFG.defaults.archive.film.forEach(w => {
      add(w.video, "video");
      add(w.poster, "poster");
    });
    CFG.defaults.archive.photos.forEach(p => add(p.src, "photo"));
    CFG.defaults.archive.design.forEach(d => add(d.src, "design"));
    return [...up, ...built];
  };
  const inUse = url => {
    const a = draft.archive;
    return [
      ...a.film.flatMap(w => [w.video, w.poster]),
      ...a.photos.map(p => p.src),
      ...a.design.map(d => d.src),
    ].includes(url);
  };
  const thumb = m =>
    m.kind === "video"
      ? h("div", { class: "th", style: `--g:${G[0]}` }, m.name)
      : h(
          "div",
          { class: "th", style: `--g:${G[1]}` },
          m.url ? h("img", { src: abs(m.url), alt: "", loading: "lazy" }) : m.name
        );
  const fileCard = (m, onpick) =>
    h(
      onpick ? "button" : "div",
      { class: "cm-file", type: onpick ? "button" : null, onclick: onpick },
      h("div", { class: "thw" }, thumb(m), h("span", { class: "ty" }, m.builtin ? `${m.kind} · site file` : m.kind)),
      m.up != null ? h("div", { class: "prog" }, h("i", { style: `width:${m.up}%` })) : null,
      h(
        "div",
        { class: "meta" },
        h("b", {}, m.name),
        h(
          "span",
          {},
          [m.size ? mb(m.size) : m.builtin ? "In the site files" : "", m.w && m.h ? ` · ${m.w}×${m.h}` : ""].join("")
        )
      ),
      !onpick && !m.builtin && m.up == null
        ? h(
            "button",
            { class: "cm-del", type: "button", "aria-label": `Delete ${m.name}`, onclick: () => removeAsset(m) },
            "Delete"
          )
        : null
    );
  let filt = "all",
    q = "",
    uploading = [];
  const renderLib = () => {
    const all = [...uploading, ...library()].filter(
      m => (filt === "all" || m.kind === filt) && m.name.toLowerCase().includes(q)
    );
    $("#cmLib").replaceChildren(
      ...(all.length ? all.map(m => fileCard(m)) : [h("p", { class: "hint" }, "No files here yet.")])
    );
    const used = assets.reduce((s, a) => s + (+a.size_bytes || 0), 0);
    $("#cmUsed").textContent = used >= 1073741824 ? (used / 1073741824).toFixed(2) + " GB" : mb(used);
    $("#cmCount").textContent = assets.length;
    $("#cmMeter").style.width = Math.min(100, (used / QUOTA) * 100) + "%";
  };
  $$("#cmFilter button").forEach(
    b =>
      (b.onclick = () => {
        $$("#cmFilter button").forEach(x => x.setAttribute("aria-pressed", x === b));
        filt = b.dataset.f;
        renderLib();
      })
  );
  $("#cmSearch").oninput = e => {
    q = e.target.value.toLowerCase();
    renderLib();
  };

  const EXT = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const slug = n =>
    n
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  const dims = file =>
    new Promise(res => {
      const url = URL.createObjectURL(file),
        done = v => {
          URL.revokeObjectURL(url);
          res(v);
        };
      if (file.type.startsWith("video")) {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () =>
          done({
            width: v.videoWidth || null,
            height: v.videoHeight || null,
            duration_s: isFinite(v.duration) ? +v.duration.toFixed(1) : null,
          });
        v.onerror = () => done({});
        v.src = url;
      } else {
        const i = new Image();
        i.onload = () => done({ width: i.naturalWidth, height: i.naturalHeight });
        i.onerror = () => done({});
        i.src = url;
      }
    });
  async function addFiles(files) {
    for (const f of [...files]) {
      if (!EXT[f.type]) {
        toast(`${f.name}: use MP4, WebM, JPG, PNG or WebP`);
        continue;
      }
      if (f.size > MAX) {
        toast(`${f.name} is larger than ${MAX_MB} MB — export a lighter version for the web`);
        continue;
      }
      const kind = f.type.startsWith("video") ? "video" : $("#cmKind").value;
      const item = {
        id: "u" + Math.random().toString(36).slice(2, 8),
        name: f.name,
        kind,
        url: f.type.startsWith("image") ? URL.createObjectURL(f) : "",
        size: f.size,
        up: 10,
      };
      uploading.unshift(item);
      renderLib();
      const meta = await dims(f);
      if (!DB.live) {
        // demo: keep it in this page only
        uploading = uploading.filter(x => x !== item);
        assets.unshift({
          id: item.id,
          path: `${kind}/demo/${slug(f.name)}`,
          kind,
          original_name: f.name,
          mime: f.type,
          size_bytes: f.size,
          ...meta,
          url: item.url || "",
        });
        renderLib();
        toast(`${f.name} added to this demo (not uploaded)`);
        continue;
      }
      const path = `${kind}/${new Date().getFullYear()}/${slug(f.name)}-${Math.random().toString(36).slice(2, 6)}.${EXT[f.type]}`;
      try {
        item.up = 40;
        renderLib();
        const up = await DB.sb.storage
          .from("media")
          .upload(path, f, { contentType: f.type, cacheControl: "31536000", upsert: false });
        if (up.error) throw up.error;
        item.up = 85;
        renderLib();
        const row = await DB.sb
          .from("media_assets")
          .insert({
            path,
            kind,
            original_name: f.name.slice(0, 200),
            mime: f.type,
            size_bytes: f.size,
            ...meta,
            created_by: DB.me.id,
          })
          .select("*")
          .single();
        if (row.error) {
          await DB.sb.storage.from("media").remove([path]);
          throw row.error;
        }
        assets.unshift(row.data);
        toast(`${f.name} uploaded`);
      } catch (e) {
        toast(`${f.name} not uploaded: ${e.message || e}`);
      }
      uploading = uploading.filter(x => x !== item);
      renderLib();
    }
  }
  async function removeAsset(m) {
    if (inUse(m.url)) return toast("This file is used in the archive — remove it there first");
    if (!confirm(`Delete ${m.name}? This cannot be undone.`)) return;
    if (!DB.live) {
      assets = assets.filter(a => a.id !== m.id);
      return renderLib();
    }
    const st = await DB.sb.storage.from("media").remove([m.asset.path]);
    if (st.error) return toast(`Not deleted: ${st.error.message}`);
    const del = await DB.sb.from("media_assets").delete().eq("id", m.id);
    if (del.error) return toast(`File removed, but the library row was not: ${del.error.message}`);
    assets = assets.filter(a => a.id !== m.id);
    renderLib();
    toast(`${m.name} deleted`);
  }
  const drop = $("#cmDrop");
  $("#cmFile").onchange = e => {
    addFiles(e.target.files);
    e.target.value = "";
  };
  ["dragenter", "dragover"].forEach(ev =>
    drop.addEventListener(ev, e => {
      e.preventDefault();
      drop.classList.add("over");
    })
  );
  ["dragleave", "drop"].forEach(ev =>
    drop.addEventListener(ev, e => {
      e.preventDefault();
      drop.classList.remove("over");
    })
  );
  drop.addEventListener("drop", e => addFiles(e.dataTransfer.files));

  /* ---------- archive ---------- */
  let arch = "film",
    dragI = -1;
  const CATS = {
    film: ["Fashion", "Short Film", "Education", "Company Profile", "Marketing", "Product"],
    design: ["Branding", "Social kit", "Poster", "Print", "Key visual"],
  };
  const SIZES = {
    film: [
      ["wide", "Large"],
      ["", "Medium"],
      ["narrow", "Small · 9:16"],
    ],
    design: [
      ["", "Normal"],
      ["wide", "Double width"],
    ],
  };
  const ARS = ["2/3", "3/2", "4/5", "1/1", "3/4", "16/9", "9/16"];
  const ratio = (w, hh) => {
    if (!w || !hh) return "";
    const r = w / hh;
    return ARS.reduce(
      (best, a) => {
        const [x, y] = a.split("/").map(Number);
        const d = Math.abs(x / y - r);
        return d < best[1] ? [a, d] : best;
      },
      ["", 9]
    )[0];
  };
  const touch = () => changed("archive");
  const sel = (opts, value, onchange, label) =>
    h(
      "select",
      { "aria-label": label, onchange },
      ...opts.map(([v, t]) => h("option", { value: v, selected: v === value }, t))
    );
  const flag = it =>
    h(
      "button",
      {
        class: "cm-flag",
        type: "button",
        "aria-pressed": String(!it.hidden),
        onclick: e => {
          if (it.hidden) delete it.hidden;
          else it.hidden = true;
          e.currentTarget.setAttribute("aria-pressed", String(!it.hidden));
          e.currentTarget.closest(".cm-row").classList.toggle("off", !!it.hidden);
          touch();
        },
      },
      "Visible"
    );
  const rowThumb = (url, label) =>
    h(
      "div",
      { class: "th", style: `--g:${G[2]}` },
      url ? h("img", { src: abs(url), alt: "", loading: "lazy" }) : label
    );
  const renderList = () => {
    const L = draft.archive[arch];
    $("#cmList").replaceChildren(
      ...(L.length
        ? L.map((it, i) => {
            const move = h(
              "button",
              {
                class: "cm-flag",
                type: "button",
                title: "Move up",
                "aria-label": "Move up",
                disabled: i === 0,
                onclick: () => {
                  [L[i - 1], L[i]] = [L[i], L[i - 1]];
                  renderList();
                  touch();
                },
              },
              "↑"
            );
            const del = h(
              "button",
              {
                class: "cm-flag",
                type: "button",
                title: "Remove from the archive",
                "aria-label": "Remove from the archive",
                onclick: () => {
                  L.splice(i, 1);
                  renderList();
                  touch();
                },
              },
              "✕"
            );
            let cells;
            if (arch === "film")
              cells = [
                rowThumb(it.poster, (it.video || "").split("/").pop()),
                h("input", {
                  value: it.title,
                  "aria-label": "Title",
                  maxlength: "80",
                  oninput: e => {
                    it.title = e.target.value;
                    touch();
                  },
                }),
                h("input", {
                  value: it.cat,
                  list: "cmCatFilm",
                  "aria-label": "Category",
                  maxlength: "30",
                  oninput: e => {
                    it.cat = e.target.value;
                    touch();
                  },
                }),
                h("input", {
                  class: "tags",
                  value: (it.tags || []).join(", "),
                  placeholder: "Tags, comma separated",
                  "aria-label": "Tags",
                  oninput: e => {
                    it.tags = e.target.value
                      .split(",")
                      .map(t => t.trim())
                      .filter(Boolean);
                    touch();
                  },
                }),
                h(
                  "div",
                  { class: "flags" },
                  sel(
                    SIZES.film,
                    it.size || "",
                    e => {
                      it.size = e.target.value;
                      it.device = { wide: "macbook", narrow: "iphone" }[it.size] || "ipad";
                      touch();
                    },
                    "Frame size"
                  ),
                  h(
                    "button",
                    {
                      class: "cm-flag",
                      type: "button",
                      onclick: () =>
                        pick(["poster", "photo"], m => {
                          it.poster = m.url;
                          renderList();
                          touch();
                        }),
                    },
                    it.poster ? "Poster ✓" : "Poster"
                  ),
                  flag(it),
                  move,
                  del
                ),
              ];
            else if (arch === "photos")
              cells = [
                rowThumb(it.src),
                h("input", {
                  value: it.alt || "",
                  "aria-label": "Description for screen readers and Google",
                  placeholder: "What is in the photo (who, what, where)",
                  maxlength: "160",
                  oninput: e => {
                    it.alt = e.target.value;
                    touch();
                  },
                }),
                sel(
                  ARS.map(a => [a, a.replace("/", ":")]),
                  it.ar,
                  e => {
                    it.ar = e.target.value;
                    touch();
                  },
                  "Shape"
                ),
                h("span", { class: "hint" }, (it.src || "").split("/").pop()),
                h("div", { class: "flags" }, flag(it), move, del),
              ];
            else
              cells = [
                rowThumb(it.src),
                h("input", {
                  value: it.title,
                  "aria-label": "Title",
                  maxlength: "60",
                  oninput: e => {
                    it.title = e.target.value;
                    touch();
                  },
                }),
                h("input", {
                  value: it.cat,
                  list: "cmCatDesign",
                  "aria-label": "Category",
                  maxlength: "30",
                  oninput: e => {
                    it.cat = e.target.value;
                    touch();
                  },
                }),
                h("input", {
                  class: "tags",
                  value: it.alt || "",
                  placeholder: "Description (optional)",
                  "aria-label": "Description",
                  maxlength: "160",
                  oninput: e => {
                    it.alt = e.target.value;
                    if (!it.alt) delete it.alt;
                    touch();
                  },
                }),
                h(
                  "div",
                  { class: "flags" },
                  sel(
                    SIZES.design,
                    it.size || "",
                    e => {
                      it.size = e.target.value;
                      if (!it.size) delete it.size;
                      touch();
                    },
                    "Width"
                  ),
                  sel(
                    [["", "Auto"], ...ARS.map(a => [a, a.replace("/", ":")])],
                    it.ar || "",
                    e => {
                      it.ar = e.target.value;
                      if (!it.ar) delete it.ar;
                      touch();
                    },
                    "Shape"
                  ),
                  flag(it),
                  move,
                  del
                ),
              ];
            return h(
              "li",
              {
                class: "cm-row" + (it.hidden ? " off" : ""),
                draggable: "true",
                ondragstart: e => {
                  dragI = i;
                  e.currentTarget.classList.add("drag");
                  e.dataTransfer.effectAllowed = "move";
                },
                ondragend: e => e.currentTarget.classList.remove("drag"),
                ondragover: e => {
                  e.preventDefault();
                  e.currentTarget.classList.add("over");
                },
                ondragleave: e => e.currentTarget.classList.remove("over"),
                ondrop: e => {
                  e.preventDefault();
                  if (dragI < 0 || dragI === i) return;
                  const [m] = L.splice(dragI, 1);
                  L.splice(i, 0, m);
                  dragI = -1;
                  renderList();
                  touch();
                },
              },
              h("span", { class: "hd", title: "Drag to reorder", "aria-hidden": "true" }, "⋮⋮"),
              ...cells
            );
          })
        : [h("p", { class: "hint" }, "Nothing here yet — add files from the media library.")])
    );
  };
  document.body.append(
    h("datalist", { id: "cmCatFilm" }, ...CATS.film.map(c => h("option", { value: c }))),
    h("datalist", { id: "cmCatDesign" }, ...CATS.design.map(c => h("option", { value: c })))
  );
  $$("#cmArch button").forEach(
    b =>
      (b.onclick = () => {
        $$("#cmArch button").forEach(x => x.setAttribute("aria-pressed", x === b));
        arch = b.dataset.a;
        renderList();
      })
  );
  const modal = $("#cmModal");
  const pick = (kinds, onpick) => {
    const list = library().filter(m => kinds.includes(m.kind));
    $("#cmPick").replaceChildren(
      ...(list.length
        ? list.map(m =>
            fileCard(m, () => {
              modal.hidden = true;
              onpick(m);
            })
          )
        : [h("p", { class: "hint" }, "No matching files — upload them in the media library first.")])
    );
    modal.hidden = false;
    modal.querySelector("[data-close]").focus();
  };
  $("#cmAdd").onclick = () => {
    const kind = { film: ["video"], photos: ["photo"], design: ["design"] }[arch];
    pick(kind, m => {
      const name = m.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
      const L = draft.archive[arch];
      if (arch === "film")
        L.unshift({ title: name, cat: "", tags: [], video: m.url, poster: "", size: "", device: "ipad" });
      else if (arch === "photos") L.unshift({ src: m.url, ar: ratio(m.w, m.h) || "2/3", alt: "" });
      else L.unshift({ src: m.url, title: name, cat: "", ...(ratio(m.w, m.h) ? { ar: ratio(m.w, m.h) } : {}) });
      renderList();
      touch();
      toast(
        arch === "film" ? "Added at the top — pick a poster image for it" : "Added at the top — drag it into place"
      );
    });
  };
  modal.addEventListener("click", e => {
    if (e.target === modal || e.target.closest("[data-close]")) modal.hidden = true;
  });
  modal.addEventListener("keydown", e => {
    if (e.key === "Escape") modal.hidden = true;
  });

  /* ---------- page text (per language) ---------- */
  let lang = "en",
    group = 0;
  $("#cmLang").replaceChildren(
    ...CFG.langs.map(l => h("option", { value: l.code }, l.main ? `${l.name} (main)` : l.name))
  );
  $("#cmLang").onchange = e => {
    lang = e.target.value;
    renderPages();
  };
  const P = () => (draft.pages[lang] ||= {});
  const field = ([label, path, max, kind]) => {
    const id = "cmf-" + path.replace(/\./g, "-"),
      en = get(draft.pages.en, path) ?? "",
      v = get(P(), path) ?? "";
    const dir = (CFG.langs.find(l => l.code === lang) || {}).dir || "ltr";
    const cnt = h("span", { class: "cm-count" }, `${String(v).length} / ${max}`);
    const props = {
      id,
      maxlength: max,
      dir,
      placeholder: lang === "en" ? "" : en,
      value: v,
      oninput: e => {
        const t = e.target.value;
        if (lang !== "en" && !t) unset(P(), path);
        else set(P(), path, t);
        cnt.textContent = `${t.length} / ${max}`;
        changed("pages");
      },
    };
    return h(
      "div",
      { class: "fld" },
      h("label", { for: id }, label),
      kind === "area" ? h("textarea", props) : h("input", props),
      cnt
    );
  };
  const listEditor = path => {
    const faq = path === "faq.items",
      wrap = h("div", { style: "display:grid;gap:10px" });
    const L = () => get(P(), path);
    const draw = () => {
      if (!Array.isArray(L())) {
        const en = get(draft.pages.en, path) || [];
        return wrap.replaceChildren(
          h(
            "p",
            { class: "hint" },
            lang === "en" ? "Empty." : `Uses the English list (${en.length} item${en.length === 1 ? "" : "s"}).`
          ),
          h(
            "button",
            {
              class: "btn sm",
              type: "button",
              onclick: () => {
                set(P(), path, lang === "en" ? [] : clone(en));
                draw();
                changed("pages");
              },
            },
            lang === "en" ? "Start the list" : "Translate this list"
          )
        );
      }
      const list = L(),
        F = faq
          ? [
              ["Question", "q", 140],
              ["Answer", "a", 500, "area"],
            ]
          : [
              ["Quote", "quote", 400, "area"],
              ["Client name", "name", 60],
              ["Role, company", "role", 80],
            ];
      wrap.replaceChildren(
        ...list.map((r, i) =>
          h(
            "div",
            { class: "cm-qa" },
            ...F.map(([label, k, max, kind]) => {
              const id = `cmq-${path}-${i}-${k}`.replace(/\./g, "-"),
                props = {
                  id,
                  maxlength: max,
                  value: r[k] || "",
                  oninput: e => {
                    r[k] = e.target.value;
                    changed("pages");
                  },
                };
              return h(
                "div",
                { class: "fld" },
                h("label", { for: id }, `${label} ${i + 1}`),
                kind === "area" ? h("textarea", props) : h("input", props)
              );
            }),
            h(
              "div",
              { class: "acts", style: "margin-top:0" },
              h(
                "button",
                {
                  class: "btn sm",
                  type: "button",
                  disabled: i === 0,
                  onclick: () => {
                    [list[i - 1], list[i]] = [list[i], list[i - 1]];
                    draw();
                    changed("pages");
                  },
                },
                "↑ Up"
              ),
              h(
                "button",
                {
                  class: "btn sm",
                  type: "button",
                  onclick: () => {
                    list.splice(i, 1);
                    draw();
                    changed("pages");
                  },
                },
                "Remove"
              )
            )
          )
        ),
        h(
          "div",
          { class: "acts" },
          h(
            "button",
            {
              class: "btn sm",
              type: "button",
              onclick: () => {
                list.push(faq ? { q: "", a: "" } : { quote: "", name: "", role: "" });
                draw();
                changed("pages");
              },
            },
            faq ? "+ Add question" : "+ Add testimonial"
          ),
          lang !== "en"
            ? h(
                "button",
                {
                  class: "btn sm",
                  type: "button",
                  onclick: () => {
                    unset(P(), path);
                    draw();
                    changed("pages");
                  },
                },
                "Use the English list instead"
              )
            : null
        )
      );
    };
    draw();
    return wrap;
  };
  const renderPages = () => {
    const g = CFG.fields[group],
      L = CFG.langs.find(l => l.code === lang);
    $("#cmLangNote").textContent = L.main
      ? "English is the main language and is on the website."
      : `${L.name} (/${L.code}/ on the website): the text below starts as a DRAFT translation by Claude — have a native speaker check it before launch. A field left empty uses the draft text again.`;
    $("#cmPnav").replaceChildren(
      ...CFG.fields.map((x, i) =>
        h(
          "button",
          {
            type: "button",
            "aria-current": String(i === group),
            onclick: () => {
              group = i;
              renderPages();
            },
          },
          x.group
        )
      )
    );
    $("#cmPform").replaceChildren(
      ...[
        h("div", { class: "card-h", style: "margin:0" }, h("h2", {}, g.group), h("span", { class: "hint" }, L.name)),
        ...g.fields.map(field),
        g.list ? listEditor(g.list) : null,
        g.list === "testimonials"
          ? h(
              "p",
              { class: "hint" },
              "Real client quotes only. The Testimonials section on About stays hidden while this list is empty."
            )
          : null,
      ].filter(Boolean) // replaceChildren would print "null" for an empty slot
    );
  };

  /* ---------- site settings ---------- */
  const siteInputs = () => $$("#cmSiteContact [data-k], #cmSiteBehaviour [data-k]");
  const renderSite = () =>
    siteInputs().forEach(x => {
      const v = get(draft.site, x.dataset.k);
      if (x.type === "checkbox") x.checked = !!v;
      else x.value = v ?? "";
    });
  siteInputs().forEach(x =>
    x.addEventListener(x.type === "checkbox" ? "change" : "input", () => {
      let v = x.type === "checkbox" ? x.checked : x.value.trim();
      if (x.type === "number") v = Math.min(8, Math.max(2, +v || 3.2));
      if (x.dataset.k === "contact.whatsapp") v = v.replace(/\D/g, "");
      set(draft.site, x.dataset.k, v);
      changed("site");
    })
  );
  $$("#cmSiteContact, #cmSiteBehaviour").forEach(f => f.addEventListener("submit", e => e.preventDefault()));

  /* ---------- publish, discard, history ---------- */
  const publish = async () => {
    if (!dirtyKeys().length) return;
    if (!DB.live) {
      KEYS.forEach(k => (pub[k] = clone(draft[k])));
      versions.unshift({
        id: versions.length + 1,
        note: "Demo publish",
        published_name: "Demo",
        published_at: new Date().toISOString(),
      });
      renderAll();
      return toast("Demo — nothing was published");
    }
    const note = prompt("Short note for the history (optional)", "");
    if (note === null) return;
    $("#cmPublish").disabled = true;
    state("Publishing…", "dirty");
    await flush();
    const { error } = await DB.sb.rpc("publish_content", {
      p_note:
        note.trim() ||
        `Changed: ${dirtyKeys()
          .map(k => NAMES[k])
          .join(", ")}`,
    });
    if (error) {
      toast(`Not published: ${error.message}`);
      return refreshState();
    }
    await loadLive();
    toast("Published. The website shows it after its next build (automatic once hosting is set up).");
  };
  $("#cmPublish").onclick = publish;
  $("#cmPublish2").onclick = publish;
  $("#cmDiscard").onclick = async () => {
    if (!confirm("Throw away every unpublished change and go back to what is on the website?")) return;
    if (!DB.live) {
      KEYS.forEach(k => (draft[k] = clone(pub[k])));
      renderAll();
      return toast("Changes discarded");
    }
    KEYS.forEach(k => {
      clearTimeout(saveT[k]);
      saving.delete(k);
    });
    const { error } = await DB.sb.rpc("discard_drafts");
    if (error) return toast(`Not discarded: ${error.message}`);
    await loadLive();
    toast("Changes discarded");
  };
  const renderHist = () =>
    $("#cmHist").replaceChildren(
      ...(versions.length
        ? versions.map((v, i) =>
            h(
              "li",
              { class: i === 0 ? "cur" : "" },
              h("span", { class: "v" }, (i === 0 ? "● live · " : "") + "v" + v.id),
              h(
                "span",
                {},
                h("b", {}, v.note || "Published"),
                h("br"),
                h("span", { class: "hint" }, `${fmtDate(v.published_at)} · ${v.published_name || "—"}`)
              ),
              i === 0
                ? h("span", { class: "hint" }, "On the website")
                : h("button", { class: "btn sm", type: "button", onclick: () => restore(v) }, "Restore as draft")
            )
          )
        : [
            h(
              "li",
              {},
              h("span", { class: "v" }, "—"),
              h("span", { class: "hint" }, "Nothing published from here yet. The website uses its built-in content."),
              h("span")
            ),
          ])
    );
  async function restore(v) {
    if (!confirm(`Replace the current draft with v${v.id}? Publish afterwards to put it on the website.`)) return;
    if (!DB.live) return toast("Demo — no stored versions to restore");
    const { error } = await DB.sb.rpc("restore_version", { p_id: v.id });
    if (error) return toast(`Not restored: ${error.message}`);
    await loadLive();
    toast(`v${v.id} restored as the draft — publish to make it live`);
  }

  /* ---------- render & start ---------- */
  function renderAll() {
    renderLib();
    renderList();
    renderPages();
    renderSite();
    renderHist();
    refreshState();
  }
  renderAll();
  document.addEventListener("studio-live-ready", () => {
    const d = window.__adminDB;
    if (!d) return;
    Object.assign(DB, { live: true, sb: d.sb, url: d.url, me: d.me });
    assets = [];
    $("#cmNote").replaceChildren(
      h("b", {}, "Connected. "),
      "Changes are saved as a draft automatically. Publish puts them on the website at its next build (automatic once hosting is set up)."
    );
    loadLive();
  });
  addEventListener("beforeunload", e => {
    if (saving.size) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
})();
