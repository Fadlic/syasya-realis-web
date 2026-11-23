# 002 · Landing intro: shatter and zoom into the website on click

- **Severity:** LOW (additive, a rare delight moment seen once per visit)
- **Category:** Missed opportunities · Physicality & origin
- **Commit:** fa2ca7c
- **Status:** DONE

## Goal

On the landing trailer (`#intro`), the visitor clicks "Go to site", the focused centre, or presses Enter or Space. Then:

1. The current trailer frame **cracks into shards** radiating from the click point.
2. The shards **fly outward and fade** while the whole shard layer **zooms toward the click point**.
3. The website behind **zooms in from slightly large to its normal size** and fades up. The visitor "falls through" the broken frame into the site.

"Skip intro" and Escape stay a quick plain fade, because skipping should be instant.

Why: this is seen once per visit, which is the frequency tier where delight is allowed. The shatter starts exactly under the cursor, so the motion explains cause and effect.

## Current code (what to change)

`public/js/05-intro.js`, the `enter()` function, around lines 137–157:

```js
const enter = () => {
  if (box.classList.contains("out")) return;
  try { sessionStorage.setItem("sr-intro", "1"); } catch { /* … */ }
  box.classList.add("out");
  document.body.classList.remove("intro-on");
  behind.forEach(el => (el.inert = false));
  clearInterval(timer);
  clearInterval(tick);
  setTimeout(() => {
    box.querySelectorAll("video").forEach(v => v.pause());
    box.remove();
    document.querySelector(".hero video")?.play?.().catch(() => {});
  }, 1000);
  document.getElementById("top")?.focus?.();
};
document.getElementById("introGo").addEventListener("click", enter);
document.getElementById("introSkip").addEventListener("click", enter);
box.addEventListener("click", e => {
  if (box.classList.contains("focus") && !e.target.closest(".skip")) enter();
});
addEventListener("keydown", function k(e) {
  if (!document.getElementById("intro")) return removeEventListener("keydown", k);
  if (["Enter", " ", "Escape"].includes(e.key)) { e.preventDefault(); enter(); }
});
```

`src/styles/site.css` around line 3382:

```css
.trailer {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: #050404;
  …
  transition: opacity 0.9s var(--ease), transform 1.1s var(--ease);
}
.trailer.out { opacity: 0; transform: scale(1.04); pointer-events: none; }
```

The visible clip is the `.trailer .clip.on` element. It contains a `<video>` with `media/*.mp4`, which is same-origin, so it can be drawn to a canvas. When the video is missing, a `.ph` gradient div shows instead.

## Target behaviour and values (use exactly)

**Signature:** `enter(mode, x, y)`.

- `mode` is `"shatter"` or `"fade"`.
- `x, y` is the origin in viewport px. Default it to the centre of `#introGo` (from `getBoundingClientRect()`), or to `innerWidth/2, innerHeight/2` if that button is missing.

**Wiring:**

- `#introGo` click: `enter("shatter", e.clientX || goCentreX, e.clientY || goCentreY)`. Keyboard activation of the button gives `clientX = 0`, so fall back to the button centre.
- Box click (focused centre): `enter("shatter", e.clientX, e.clientY)`.
- Enter or Space key: `enter("shatter")`, which uses the button centre.
- `#introSkip` click and Escape: `enter("fade")`. This is the existing behaviour, unchanged.
- `prefers-reduced-motion: reduce`: always `"fade"`. `reduce` is already defined in `run()`.

**Shatter sequence.** Total 820ms. Use WAAPI (`el.animate`), not CSS transitions.

1. **Freeze frame** (synchronous, at t=0):
   - Make a `<canvas>` sized `innerWidth × innerHeight` (multiply by `Math.min(devicePixelRatio, 2)` and scale the context).
   - Draw the `.clip.on video` with "cover" fit: scale = `max(cw/vw, ch/vh)`, centred. If `video.readyState < 2`, or drawing throws, fill with `#0e0b0a` and then a linear gradient from `#3A0D12` to `#0E0B0A` (135°).
   - Then draw a radial vignette: transparent at 45%, then `rgba(0,0,0,0.55)` at 100%.
   - `const url = canvas.toDataURL("image/jpeg", 0.82)`.
2. **Shard layer**:
   - Create `<div class="shards" aria-hidden="true">` with `position:fixed; inset:0; z-index:301; pointer-events:none; transform-origin:${x}px ${y}px`. Append it to `document.body`.
   - Hide the trailer immediately: `box.style.visibility = "hidden"`. Keep it in the DOM until cleanup.
3. **Shard geometry**. These are radial wedges cut into rings around `(x, y)`:
   - `R = Math.hypot(innerWidth, innerHeight)`.
   - Ring radii: `[0, 0.12R, 0.32R, 0.62R, 1.2R]`, which gives 4 rings.
   - Sectors: 12. For each ring boundary `j` and sector `i`, the boundary angle is `θ = i * 30° + jitter`. The jitter is seeded in ±9° and is shared by both rings that touch that boundary, so shards tile with no holes.
   - For ring 0 (the centre), use triangles from `(x, y)`.
   - Seeded random: `const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;` with seed `7`.
   - Each shard is a `<i>` with `position:absolute; inset:0; background:url(${url}) 0 0 / 100% 100%; clip-path: polygon(…)`, with px points in viewport coordinates. That is 48 elements in total.
   - Compute each shard's centroid `(cx, cy)`, its unit direction `(ux, uy)` away from `(x, y)`, and its ring index `j`.
4. **Animate each shard**: `el.animate(keyframes, { duration: 700, delay: 120 + j * 25, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" })`.
   - Keyframes:
     - from: `{ transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 }`
     - at 60%: `{ opacity: 1 }`
     - to: `{ transform: \`translate(${ux*dist}px, ${uy*dist}px) rotate(${rot}deg) scale(${sc})\`, opacity: 0 }`
   - `dist = (0.35 + 0.45*r1) * R`, `rot = (r2*2-1) * 28`, `sc = 1.08 + 0.25*r3`. Draw r1–r3 from the seeded rnd.
   - Set `transform-origin` on each shard to its centroid: `${cx}px ${cy}px`.
5. **Crack beat (t = 0–120ms):** during the 120ms delay the shards sit in place. To make the crack visible, give each shard `filter: brightness(1.15)` and the layer `background: transparent`. The page behind is already visible through the 1px gaps, because each polygon point is inset 0.5px toward its centroid.
6. **Layer zoom:** `layer.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }], { duration: 820, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" })`.
7. **Website zoom-in:**
   - Targets: every element in `behind`, the array already built in `run()`, that is `header`, `main` or `footer`. Query `document.querySelectorAll("body > header, body > main, body > footer, #nav")` and dedupe.
   - Animate `[{ transform: "scale(1.08)", opacity: 0.2 }, { transform: "scale(1)", opacity: 1 }]` with `{ duration: 700, delay: 120, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" }`.
   - Set `transform-origin` to `${x}px ${y + scrollY}px` on `main`, and to `${x}px 0` on `header` or `#nav`.
   - Use `fill: "backwards"`, NOT `"forwards"`. A lingering transform would break `position: sticky/fixed` on the nav after the animation.
8. **Cleanup** after `Promise.all([...shardAnims, layerAnim].map(a => a.finished))`, or a 1000ms timeout fallback, whichever comes first:
   - `layer.remove()`.
   - Then run the existing cleanup body: pause videos, `box.remove()`, play the hero video.
   - Also run the existing immediate lines at t=0: sessionStorage, `intro-on` removal, un-inert, clearing the intervals, focusing `#top`.

**Fade mode:** keep the current behaviour exactly (`box.classList.add("out")` plus the 1000ms timeout). Only shorten the CSS so skip feels instant: `.trailer.out` transition becomes `opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out)`. Add that as a separate rule `.trailer.out { transition: … }` and leave the base `.trailer` transition alone.

## Steps

1. In `public/js/05-intro.js`:
   - Change `enter` to `enter(mode = "fade", x, y)`, with the guard `if (box.dataset.leaving) return; box.dataset.leaving = "1";`. Keep the existing `.out` guard too.
   - Move the shared immediate lines (storage, body class, inert, intervals, focus) into the top of `enter`.
   - Branch on `mode === "shatter" && !reduce`. Put the shatter code in a local helper `shatter(x, y, done)` inside `run()`.
2. Rewire the four listeners as described under "Wiring".
3. In `src/styles/site.css`, after the `.trailer.out` rule (around line 3398), add:
   ```css
   .trailer.out { transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out); }
   .shards { position: fixed; inset: 0; z-index: 301; pointer-events: none; }
   .shards i { position: absolute; inset: 0; will-change: transform, opacity; }
   ```
4. Do not touch: the reel, the strips, the focus logic, the timecode, `__playIntro` (replay must still work, so the new code must not depend on module-level state), or anything outside the intro.

## Scope boundaries

- Only `public/js/05-intro.js` and the intro block of `src/styles/site.css`. No libraries, no WebGL, no new images.
- No layout properties animated: only `transform` and `opacity`.
- Never leave a persistent `transform` on `header`, `main`, `footer` or `#nav` (`fill: "backwards"` only).

## Verification

1. `npm run dev -- --port 4330`. In DevTools → Application → Session storage, delete `sr-intro`, then reload `http://localhost:4330/`.
2. Move to the centre and click somewhere off-centre:
   - The frame cracks from exactly that point.
   - The shards fly outward and fade.
   - The site zooms from big to normal.
   - The whole thing is done in under a second.
3. Repeat, and press Enter instead. It shatters from the "Go to site" button centre.
4. Repeat, and click "Skip intro" or press Escape. Plain quick fade, no shards.
5. After entry:
   - The nav is still sticky.
   - Scrolling works.
   - `#top` has focus.
   - The hero video plays.
   - No `.shards` element remains (`document.querySelector(".shards") === null`).
6. Click the logo to replay the intro (`__playIntro`), then enter again. It shatters again with no errors in the console.
7. Reduced motion (DevTools → Rendering → emulate `reduce`): always a plain fade.
8. **Feel check:**
   - Performance panel at 4× CPU slowdown. The shard animation should hold frame rate, because it is composite-only.
   - If it stutters, drop sectors from 12 to 10 and rings from 4 to 3. Change only those numbers.
   - Record at 0.25× (DevTools → Animations panel) and check that the shards start moving from the click point outward and not all at once. The per-ring delay `j * 25ms` should be visible.
   - On a phone, tap the centre: it shatters from the tap point.
