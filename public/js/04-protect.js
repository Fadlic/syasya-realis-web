/* ===== Media protection — level 1 =====
   Stops casual saving only (right-click, drag, long-press, the video Download menu, Picture-in-Picture).
   It cannot stop screen recording or someone reading the page source — use watermarked, web-size files for that. */
const PROTECT = { enabled: true, watermark: true };
(() => {
  if (!PROTECT.enabled) return;
  const b = document.body; b.classList.add("protect"); if (!PROTECT.watermark) b.classList.add("no-wm");
  b.style.setProperty("--wm", JSON.stringify("© " + SITE.name));
  const MEDIA = ".shot, .ph-item, .lb-stage, .screen, #heroMedia";
  const note = document.createElement("div"); note.className = "guard-note"; note.setAttribute("role", "status");
  note.innerHTML = "<span></span>"; note.firstChild.textContent = `© ${SITE.name} — please ask before using our work.`;
  b.appendChild(note); let t;
  const tell = () => { note.classList.add("show"); clearTimeout(t); t = setTimeout(() => note.classList.remove("show"), 2200); };
  document.addEventListener("contextmenu", e => { if (e.target.closest(MEDIA)) { e.preventDefault(); tell(); } });
  document.addEventListener("dragstart", e => { if (e.target.closest(MEDIA)) e.preventDefault(); });
  /* every video, including the ones the viewer creates later: no download button, no PiP, no casting */
  const lock = v => { v.setAttribute("controlsList", "nodownload noremoteplayback noplaybackrate"); v.disablePictureInPicture = true;
    v.setAttribute("disablePictureInPicture", ""); v.disableRemotePlayback = true; };
  document.querySelectorAll("video").forEach(lock);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return;
    if (n.tagName === "VIDEO") lock(n); n.querySelectorAll && n.querySelectorAll("video").forEach(lock); }))).observe(b, { childList: true, subtree: true });
})();
