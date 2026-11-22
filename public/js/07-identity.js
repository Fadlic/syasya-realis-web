/* ===== Identity pages: interactions ===== */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // the mark tilts toward the cursor
  const st = document.getElementById("mkStage");
  if (st && !reduce) { const m = st.querySelector(".srm");
    st.addEventListener("pointermove", e => { const r = st.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      m.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg) translateZ(20px)`; });
    st.addEventListener("pointerleave", () => m.style.transform = ""); }
  // anatomy: list <-> hotspots
  const items = [...document.querySelectorAll(".anat-list li")], spots = [...document.querySelectorAll(".anat-mark .hs")];
  const pick = k => { items.forEach(i => i.classList.toggle("on", i.dataset.k === k)); spots.forEach(s => s.classList.toggle("on", s.dataset.k === k)); };
  [...items, ...spots].forEach(el => { el.addEventListener("pointerenter", () => pick(el.dataset.k)); el.addEventListener("focus", () => pick(el.dataset.k)); el.addEventListener("click", () => pick(el.dataset.k)); });
  if (items[0]) pick(items[0].dataset.k);
  // palette: copy hex
  document.querySelectorAll(".ci-pal button").forEach(b => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.hex); } catch { /* storage or clipboard blocked: nothing to do */ }
    b.classList.add("copied"); setTimeout(() => b.classList.remove("copied"), 1400); }));
})();
