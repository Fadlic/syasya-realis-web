/* ===================== MEDIA COLOUR REVEAL (touch screens) =====================
   Mouse: CSS :hover reveals colour. Touch screens have no hover, so an item gets
   .lit while it sits in the middle band of the screen. Home page only. */
(() => {
  if (!matchMedia("(hover: none)").matches || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("lit", e.isIntersecting)),
    { rootMargin: "-35% 0px -35% 0px" });
  const watch = root => root && root.querySelectorAll(".ph-item,.d-item,.item").forEach(el => {
    if (!el.dataset.litWatch) { el.dataset.litWatch = "1"; io.observe(el); } });
  ["#gallery", "#designGrid", "#grid"].forEach(sel => {
    const root = document.querySelector(sel); if (!root) return;
    watch(root); new MutationObserver(() => watch(root)).observe(root, { childList: true });   // "Show more photos" adds items
  });
})();
