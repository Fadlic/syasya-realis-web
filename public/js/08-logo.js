/* ===== Logo = back to the landing page (intro trailer). =====
   On the home page the intro plays again in place. On other pages the browser goes to "/"
   and a one-time flag asks the home page to play the intro (05-intro.js reads it). */
document.addEventListener("click", e => {
  const a = e.target.closest("a.brand"); if (!a) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (document.body.dataset.page !== "index") {
    try { sessionStorage.setItem("sr-intro-replay", "1"); } catch (err) {}
    location.href = "/"; return;
  }
  scrollTo({ top: 0 });
  if (!(window.__playIntro && window.__playIntro())) scrollTo({ top: 0, behavior: "smooth" });
}, true);
