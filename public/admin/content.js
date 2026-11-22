/* =====================================================================
   Syasya&Realis admin — Content panel (CMS).
   DESIGN PREVIEW: sample data, nothing is uploaded, saved or published.
   The database side exists (site_content, content_versions, media_assets,
   publish_content / restore_version / discard_drafts, bucket "media"),
   but this panel is not wired to it yet. Until then every action here says
   so, so nobody believes a change reached the website.
   ===================================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const h = (t, a = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(a)) { if (n.startsWith("on")) e.addEventListener(n.slice(2), v); else if (v === true) e.setAttribute(n, ""); else if (v !== false && v != null) e.setAttribute(n, v); } e.append(...k.flat().filter(x => x != null)); return e; };
  const G = ["linear-gradient(135deg,#3A0D12,#0E0B0A)","linear-gradient(160deg,#16252E,#0C0A09)","linear-gradient(135deg,#2E0B10,#0D0B0A)","linear-gradient(200deg,#1B3442,#0C0A0A)","linear-gradient(150deg,#3B1016,#0E0B0A)"];
  const toast = t => { const d = h("div", {class:"cm-toast", role:"status"}, t); document.body.append(d); setTimeout(() => d.remove(), 2600); };
  const MAX_MB = 50;   // the bucket's file_size_limit (52428800 bytes, Supabase Free plan upload ceiling)

  /* sample data = what the website holds today */
  const FILM = [["J Luxe — Teaser","Fashion","Teaser","jluxe-teaser.mp4"],["J Luxe — Instagram Teaser","Fashion","Instagram teaser","jluxe-ig.mp4"],["Pilihan Hidup","Short Film","Short film","pilihan-hidup.mp4"],["Respect & Responsibility","Short Film","Cyberbully PSA","respect.mp4"],["Unisel FSSR — Promo","Education","Promo","unisel-promo.mp4"],["J Luxe — Ready-to-Wear","Fashion","Campaign","jluxe-rtw.mp4"],["Unisel FSSR","Education","Feature","unisel.mp4"]];
  const S = {
    media: [...FILM.map(([,,,f], i) => ({ id:"v"+i, name:f, type:"video", size:(14 + i * 5) + " MB", g:G[i % 5] })),
            ...Array.from({length:27}, (_, i) => ({ id:"p"+i, name:`photo-${String(i+1).padStart(2,"0")}.jpg`, type:"photo", size:(1.1 + (i % 5) * .3).toFixed(1) + " MB", g:G[(i+2) % 5] })),
            ...Array.from({length:6}, (_, i) => ({ id:"d"+i, name:`design-${String(i+1).padStart(2,"0")}.jpg`, type:"design", size:(2 + i * .4).toFixed(1) + " MB", g:G[(i+1) % 5] }))],
    film: FILM.map(([title,cat,tags,f], i) => ({ id:"v"+i, title, cat, tags, file:f, reel:true, intro:true, on:true, g:G[i % 5] })),
    stills: Array.from({length:27}, (_, i) => ({ id:"p"+i, title:`Photograph ${i+1}`, cat:["Fashion","Portrait","Product","Event"][i % 4], tags:"", file:`photo-${String(i+1).padStart(2,"0")}.jpg`, on:true, g:G[(i+2) % 5] })),
    design: ["Branding","Social kit","Poster","Social kit","Print","Key visual"].map((cat, i) => ({ id:"d"+i, title:`Design piece ${String(i+1).padStart(2,"0")}`, cat, tags:"", file:`design-${String(i+1).padStart(2,"0")}.jpg`, on:true, g:G[(i+1) % 5] })),
    hist: [{ v:"v4.4", who:"Cries", when:"22 Nov 2026, 02:23", note:"Theme on all pages" }, { v:"v4.3", who:"Cries", when:"22 Nov 2026, 01:36", note:"About + Brand guidelines" }, { v:"v4.2", who:"Cries", when:"22 Nov 2026, 01:00", note:"New S&R logo" }]
  };
  const CATS = { film:["Fashion","Short Film","Education","Company Profile","Marketing","Product"], stills:["Fashion","Portrait","Product","Event"], design:["Branding","Social kit","Poster","Print","Key visual"] };
  const PAGES = [
    { k:"cover", t:"Home · cover", s:"Landing headline and quote", f:[["Headline line 1","Visual Narratives",30],["Headline line 2","& Moving Art",30],["Cover quote","A visual practice in reality, rhythm, and refined expression. Where the authenticity of a moment meets the intention of an artist. An independent creative practice devoted to imagery that lingers.",240,"area"]] },
    { k:"archive", t:"Home · archive", s:"Featured archive intro", f:[["Heading","Featured archive.",40],["Intro","A curated collection of moments, movement, and visual explorations.",140,"area"]] },
    { k:"manifesto", t:"Home · manifesto", s:"The one-line statement", f:[["Statement","Reality gives us the moment; imagination gives it meaning.",90,"area"]] },
    { k:"services", t:"Services", s:"Four disciplines", f:[["01 Photography","An intimate study of light, form, and fleeting moments…",220,"area"],["02 Videography","Cinematic storytelling through purposeful movement…",220,"area"],["03 Montage Design","A considered arrangement of imagery, sound and rhythm…",220,"area"],["04 Graphic Design","Distinctive visual compositions where typography…",220,"area"]] },
    { k:"process", t:"Process", s:"From brief to delivery", f:[["Step 01","Project Kickoff & Brief",40],["Step 02","Research & Direction",40],["Step 03","Concepting & Production",40],["Step 04","Presentation & Revisions",40],["Step 05","Approval & Delivery",40]] },
    { k:"about", t:"About", s:"Founder, name, mark", f:[["Page headline","Between what is seen and what is felt.",60],["Founder paragraph 1","Our work spans fashion campaigns, short films, education promos and brand content — including projects for J Luxe and Unisel.",320,"area"],["Founder paragraph 2","Guided by an instinct for composition, atmosphere, and narrative, Syasya transforms everyday realities into considered visual expressions that balance authenticity with artistic intention.",320,"area"],["Based in","",40],["Founded","",10]] },
    { k:"testi", t:"Testimonials", s:"Hidden while empty", list:"testi" },
    { k:"faq", t:"FAQ", s:"Questions & answers", list:"faq" }
  ];
  const LISTS = { faq:[["How much does a project cost?","Every project is quoted after a short brief…"],["How long does a project take?","It depends on the scope…"],["How do I book?","Use the contact form…"]], testi:[] };

  /* change tracking (local to this page only) */
  let dirty = 0;
  const mark = () => { dirty++; $("#cmState").classList.add("dirty"); $("#cmState span").textContent = "Draft in this preview — not saved"; $("#cmPublish").disabled = false; $("#cmDock").hidden = false; $("#cmN").textContent = dirty; };
  const clean = msg => { dirty = 0; $("#cmState").classList.remove("dirty"); $("#cmState span").textContent = "All changes published"; $("#cmPublish").disabled = true; $("#cmDock").hidden = true; if (msg) toast(msg); };
  const publish = () => { S.hist.unshift({ v:"v4." + (5 + (S.hist.length - 3)), who:"Preview", when:new Date().toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}), note:`${dirty} change${dirty>1?"s":""} (preview)` }); renderHist(); clean("Preview only — nothing was published to the website"); };
  $("#cmPublish").onclick = publish; $("#cmPublish2").onclick = publish;
  $("#cmDiscard").onclick = () => clean("Draft discarded");
  $("#cmPreview").onclick = () => toast("Preview links come when content editing is connected");
  document.getElementById("v-content").addEventListener("input", e => { if (e.target.matches("input, textarea, select")) mark(); });

  /* tabs */
  $$(".cm-tabs [data-t]").forEach(b => b.onclick = () => { $$(".cm-tabs [data-t]").forEach(x => x.setAttribute("aria-selected", x === b)); $$(".cm-pane").forEach(p => p.hidden = p.dataset.p !== b.dataset.t); });

  /* media library */
  let filt = "all", q = "";
  const fileCard = (m, onclick) => h(onclick ? "button" : "div", { class:"cm-file", type: onclick ? "button" : null, onclick },
    h("div", { class:"th", style:`--g:${m.g}` }, m.url ? h("img", { src:m.url, alt:"" }) : m.name, h("span", { class:"ty" }, m.type)),
    m.up != null ? h("div", { class:"prog" }, h("i", { style:`width:${m.up}%` })) : null,
    h("div", { class:"meta" }, h("b", {}, m.name), h("span", {}, m.size)));
  const renderLib = () => { const list = S.media.filter(m => (filt === "all" || m.type === filt) && m.name.toLowerCase().includes(q));
    $("#cmLib").replaceChildren(...list.map(m => fileCard(m))); $("#cmCount").textContent = S.media.length; };
  $$("#cmFilter button").forEach(b => b.onclick = () => { $$("#cmFilter button").forEach(x => x.setAttribute("aria-pressed", x === b)); filt = b.dataset.f; renderLib(); });
  $("#cmSearch").oninput = e => { q = e.target.value.toLowerCase(); renderLib(); };
  const addFiles = files => [...files].forEach(f => {
    if (f.size > MAX_MB * 1048576) return toast(`${f.name} is larger than ${MAX_MB} MB — link it from YouTube/Vimeo or export it smaller`);
    const type = f.type.startsWith("video") ? "video" : /design/i.test(f.name) ? "design" : "photo";
    const m = { id:"u" + Math.random().toString(36).slice(2, 7), name:f.name, type, size:(f.size / 1048576).toFixed(1) + " MB", g:G[0], up:0, url: type !== "video" ? URL.createObjectURL(f) : null };
    S.media.unshift(m); renderLib(); mark();
    const t = setInterval(() => { m.up = Math.min(100, m.up + 20 + Math.random() * 25); if (m.up >= 100) { clearInterval(t); delete m.up; toast(`${f.name} added to this preview (not uploaded)`); } renderLib(); }, 260); });
  $("#cmFile").onchange = e => addFiles(e.target.files);
  const drop = $("#cmDrop");
  ["dragenter","dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave","drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => addFiles(e.dataTransfer.files));

  /* archive lists with drag-to-reorder */
  let arch = "film", dragI = -1;
  const flag = (it, k, label) => h("button", { class:"cm-flag", type:"button", "aria-pressed": String(!!it[k]), onclick:e => { it[k] = !it[k]; e.currentTarget.setAttribute("aria-pressed", it[k]); e.currentTarget.closest(".cm-row").classList.toggle("off", !it.on); mark(); } }, label);
  const renderList = () => { const L = S[arch];
    $("#cmList").replaceChildren(...L.map((it, i) => h("li", { class:"cm-row" + (it.on ? "" : " off"), draggable:"true",
        ondragstart:e => { dragI = i; e.currentTarget.classList.add("drag"); e.dataTransfer.effectAllowed = "move"; },
        ondragend:e => e.currentTarget.classList.remove("drag"),
        ondragover:e => { e.preventDefault(); e.currentTarget.classList.add("over"); },
        ondragleave:e => e.currentTarget.classList.remove("over"),
        ondrop:e => { e.preventDefault(); const [m] = L.splice(dragI, 1); L.splice(i, 0, m); renderList(); mark(); } },
      h("span", { class:"hd", title:"Drag to reorder", "aria-hidden":"true" }, "⋮⋮"),
      h("div", { class:"th", style:`--g:${it.g}` }, it.file.replace(/\.\w+$/, "")),
      h("input", { value:it.title, "aria-label":"Title", oninput:e => it.title = e.target.value }),
      h("select", { "aria-label":"Category", onchange:e => it.cat = e.target.value }, ...CATS[arch].map(c => h("option", { selected: c === it.cat }, c))),
      h("input", { class:"tags", value:it.tags, placeholder:"Tags", "aria-label":"Tags", oninput:e => it.tags = e.target.value }),
      h("div", { class:"flags" }, arch === "film" ? flag(it, "reel", "Reel") : null, arch === "film" ? flag(it, "intro", "Intro") : null, flag(it, "on", "Visible"),
        h("button", { class:"cm-flag", type:"button", title:"Move up", "aria-label":"Move up", disabled: i === 0, onclick:() => { [L[i-1], L[i]] = [L[i], L[i-1]]; renderList(); mark(); } }, "↑")))));
  };
  $$("#cmArch button").forEach(b => b.onclick = () => { $$("#cmArch button").forEach(x => x.setAttribute("aria-pressed", x === b)); arch = b.dataset.a; renderList(); });
  const modal = $("#cmModal");
  $("#cmAdd").onclick = () => { const type = arch === "film" ? "video" : arch === "stills" ? "photo" : "design";
    $("#cmPick").replaceChildren(...S.media.filter(m => m.type === type).map(m => fileCard(m, () => { S[arch].unshift({ id:m.id + "x", title:m.name.replace(/\.\w+$/, ""), cat:CATS[arch][0], tags:"", file:m.name, on:true, reel:false, intro:false, g:m.g }); modal.hidden = true; renderList(); mark(); toast("Added to the top — drag to place it"); })));
    modal.hidden = false; };
  modal.addEventListener("click", e => { if (e.target === modal || e.target.closest("[data-close]")) modal.hidden = true; });

  /* page text */
  let pk = "cover";
  const field = ([label, val, max, kind]) => { const id = "cmf" + Math.random().toString(36).slice(2, 7);
    const inp = kind === "area" ? h("textarea", { id, maxlength:max }, val) : h("input", { id, value:val, maxlength:max });
    const cnt = h("span", { class:"cm-count" }, `${val.length} / ${max}`); inp.addEventListener("input", () => cnt.textContent = `${inp.value.length} / ${max}`);
    return h("div", { class:"fld" }, h("label", { for:id }, label), inp, cnt); };
  const listEditor = key => { const L = LISTS[key], wrap = h("div", { style:"display:grid;gap:10px" });
    const draw = () => wrap.replaceChildren(...L.map((r, i) => h("div", { class:"cm-qa" },
        field([key === "faq" ? `Question ${i+1}` : `Client name & company ${i+1}`, r[0], 120]), field([key === "faq" ? "Answer" : "Quote", r[1], 400, "area"]),
        h("button", { class:"btn sm x", type:"button", onclick:() => { L.splice(i, 1); draw(); mark(); } }, "Remove"))),
      h("button", { class:"btn sm", type:"button", onclick:() => { L.push(["", ""]); draw(); mark(); } }, key === "faq" ? "+ Add question" : "+ Add testimonial"));
    draw(); return wrap; };
  const renderPages = () => {
    $("#cmPnav").replaceChildren(...PAGES.map(p => h("button", { type:"button", "aria-current": String(p.k === pk), onclick:() => { pk = p.k; renderPages(); } }, p.t, h("small", {}, p.s))));
    const p = PAGES.find(x => x.k === pk);
    $("#cmPform").replaceChildren(h("div", { class:"card-h", style:"margin:0" }, h("h2", {}, p.t), h("span", { class:"hint" }, "Line breaks and italics follow the website design")),
      ...(p.list ? [listEditor(p.list), p.list === "testi" ? h("p", { class:"hint" }, "Add at least one testimonial to show the Testimonials section on About.") : null] : p.f.map(field)));
  };

  /* guidelines mockups */
  $("#cmMock").replaceChildren(...["Business cards","Tags & stationery","Blade signage"].map((t, i) => h("button", { type:"button", style:`--g:${G[i]}`, onclick:() => toast("Choosing from the media library comes when content editing is connected") }, t)));

  /* history */
  const renderHist = () => $("#cmHist").replaceChildren(...S.hist.map((v, i) => h("li", { class: i === 0 ? "cur" : "" },
    h("span", { class:"v" }, (i === 0 ? "● live · " : "") + v.v), h("span", {}, h("b", {}, v.note), h("br"), h("span", { class:"hint" }, `${v.when} · ${v.who}`)),
    i === 0 ? h("span", { class:"hint" }, "On the website") : h("button", { class:"btn sm", type:"button", onclick:() => { mark(); toast(`${v.v} restored as a draft in this preview`); } }, "Restore"))));

  renderLib(); renderList(); renderPages(); renderHist();
})();
