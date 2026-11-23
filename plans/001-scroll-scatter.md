# 001 · Scroll scatter: loose at the bottom, tidy in the centre, loose again at the top

- **Severity:** LOW (additive, a missed opportunity, not a fix)
- **Category:** Missed opportunities · Purpose
- **Commit:** fa2ca7c
- **Status:** DONE

## Goal

While the user scrolls, four things respond to their position on screen:

1. Photo cards in `#gallery` (`.ph-item`)
2. Design cards in `#designGrid` (`.d-item`)
3. Letters of the footer wordmark `#wm` ("Syasya&Realis")
4. Letters of the hero headline `.hero h1`

An element entering from the **bottom** of the viewport is scattered: offset, tilted, slightly smaller and dimmer. As it reaches the **centre band** of the viewport it settles exactly into its normal layout. As it leaves through the **top** it scatters again, the other way. The motion is tied 1:1 to scroll position. There are no timers, no CSS transitions and no keyframes, so it reverses instantly when the user scrolls back.

**Why it is worth doing:** the archive is the core of a creative-studio portfolio. Assembling cards and letters as they arrive gives a sense of "the work coming into focus", which fits the studio's camera and viewfinder language. Every element is fully tidy while it is being read (the centre band), so the motion never gets in the way of viewing the work.

**Hero exception:** the hero is already at the top on load, and its centre sits above the viewport centre. Measuring it by centre distance would show it half-scattered on load. The hero is therefore driven by `scrollY` instead: tidy at `scrollY = 0`, fully scattered once the user has scrolled 70% of the hero's height.

## Context the executor needs

- Astro 7 static site. Behaviour lives in plain scripts under `public/js/`, loaded in `src/layouts/Base.astro` lines 81–91 with `<script is:inline defer src="/js/NN-name.js">`. Deferred scripts run in document order.
- Easing tokens already exist in `src/styles/site.css`: `--ease-out: cubic-bezier(0.23,1,0.32,1)`. Do not add CSS transitions to this effect, because it is scroll-linked.
- The existing scroll loop pattern to copy is in `public/js/02-site.js` lines 21–44. It uses a `queued` flag, one `requestAnimationFrame(render)` per scroll burst, and `addEventListener("scroll", onScroll, { passive: true })`.
- The reduced-motion check pattern used across the repo is `matchMedia("(prefers-reduced-motion: reduce)").matches`, as in `public/js/06-interactive.js` line 4.
- **Hover transforms already use `transform`.** The executor must NOT write `style.transform`. Use the individual CSS properties `translate`, `rotate` and `scale`, which compose with `transform` instead of replacing it.
  - `.ph-item:hover { transform: translateY(-2px) }` is at `src/styles/site.css` around line 980.
  - `.d-item:hover .shot { transform: translateY(-2px) }` is around line 509. That rule is on `.shot`, a child, so it does not conflict with `.d-item` itself.
  - `.hero h1 .ln > span { transform: translateY(105%) }` is the load entrance, around lines 368–378. The letters are children, so there is no conflict.
- `public/js/01-settings.js` line 69 sets `textContent = SITE.name` on every `[data-name]`, including `#wm > span`. The letter split must run **after** that, which a new script placed after `01-settings.js` does.
- `fitWM()` in `public/js/01-settings.js` around lines 537–542 measures `#wm`'s first child `offsetWidth` to fit the font size. Splitting into inline-block letters keeps that width, and `translate` does not change `offsetWidth`, so fitWM keeps working.
- "Show more photos" appends new `.ph-item`s to `#gallery` later (`01-settings.js` around lines 290–303). Query the cards fresh each time they are observed. Use a `MutationObserver` on `#gallery` (`childList: true`) to observe new cards.
- Hero markup is in `src/views/Home.astro` lines 36–39:
  ```html
  <h1>
    <span class="ln"><span set:html={heading(T.headline1)} /></span>
    <span class="ln"><span set:html={heading(T.headline2)} /></span>
  </h1>
  ```
  `heading()` can produce `<span class="serif">…</span>` and `<br>`. The split must walk **text nodes only** and keep those wrappers.

## Target values (use exactly)

**Progress per element (cards and footer letters):**

```
r  = el.getBoundingClientRect()
d  = ((r.top + r.height/2) - innerHeight/2) / (innerHeight/2 + r.height/2)   // -1 (gone above) … 0 (centred) … +1 (gone below)
d  = clamp(d, -1, 1)
a  = |d| <= 0.18 ? 0 : ((|d| - 0.18) / 0.82) ** 2                           // dead zone = tidy band, then quadratic ease
s  = sign(d)                                                                // +1 below centre, -1 above
```

**Hero progress:** `a = clamp(scrollY / (hero.offsetHeight * 0.7), 0, 1) ** 2`, with `s = -1`.

**Seeded random per element.** The scatter must be stable and must not change every frame. Use the same LCG as `06-interactive.js` line 7: `const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;`. Seed each element with `index + 1` for cards, or `letterIndex + 101` for letters. Draw 3 values `u1, u2, u3` in [0,1) once and cache them on the element.

| Target | translate X | translate Y | rotate | scale | opacity |
| --- | --- | --- | --- | --- | --- |
| `.ph-item`, `.d-item` | `(u1*2-1) * 90px * a` | `s * (50 + u2*90)px * a` | `(u3*2-1) * 9deg * a` | `1 - 0.08*a` | `1 - 0.35*a` |
| `#wm` letters | `(u1*2-1) * 0.35em * a` | `s * (0.25 + u2*0.5)em * a` | `(u3*2-1) * 28deg * a` | `1` | `1 - 0.5*a` |
| hero letters | `(u1*2-1) * 0.3em * a` | `s * (0.2 + u2*0.6)em * a` | `(u3*2-1) * 22deg * a` | `1` | `1 - 0.6*a` |

At ≤ 700px viewport width, multiply every translate and rotate amplitude by **0.5** (`const k = innerWidth <= 700 ? 0.5 : 1`).

Write the values as `el.style.translate = \`${x}px ${y}px\``, `el.style.rotate = \`${r}deg\``, `el.style.scale = sc` and `el.style.opacity = o`. For the em-based rows, compute em × the element's computed font size once and cache it, then write px.

When `a === 0`, write the neutral values (`"0px 0px"`, `"0deg"`, `1`, `""` for opacity) once, then skip writes while the element stays at 0. Cache the last `a` per element.

## Steps

1. **Create `public/js/09-scatter.js`**, an IIFE in the style of `02-site.js`. Return immediately if:
   - `matchMedia("(prefers-reduced-motion: reduce)").matches`, or
   - none of `#gallery`, `#designGrid`, `#wm` or `.hero h1` exists.
2. **Letter split helper `split(root)`**:
   - Walk `root`'s text nodes (`document.createTreeWalker(root, NodeFilter.SHOW_TEXT)`; collect the nodes first, then mutate).
   - Replace each text node with a fragment. Group the letters of each word in `<span class="sc-w">` (`display:inline-block; white-space:nowrap`) so words never break mid-word. Wrap each non-space character in `<span class="sc-l">`. Keep spaces as plain text nodes between word spans.
   - Return the array of `.sc-l` spans.
   - Apply it to `#wm > span` and to each `.hero h1 .ln > span`.
   - On the hero `<h1>`, set `aria-label` to its original `textContent` (trimmed, whitespace collapsed) **before** splitting. Mark each `.ln` with `aria-hidden="true"`.
3. **CSS**: append to the end of `src/styles/site.css`, after the existing "motion layer" block:
   ```css
   /* scroll scatter (public/js/09-scatter.js) */
   .sc-w { display: inline-block; white-space: nowrap; }
   .sc-l { display: inline-block; will-change: translate, rotate; }
   #photography, #design { overflow-x: clip; }
   @media (prefers-reduced-motion: reduce) {
     .sc-l, #gallery .ph-item, #designGrid .d-item { translate: none !important; rotate: none !important; scale: none !important; opacity: 1 !important; }
   }
   ```
   Check that the section ids `photography` and `design` exist (grep `id="photography"` and `id="design"` in `src/views/Home.astro`). If the design section id differs, use the real one. Do not add `will-change` to cards, because there can be 27+ of them.
4. **Visible set**:
   - Track elements with one `IntersectionObserver({ rootMargin: "25% 0px" })`.
   - Keep a `Set` of intersecting elements, and only compute and write for those.
   - Cards: observe `#gallery .ph-item` and `#designGrid .d-item`. Use a `MutationObserver` on `#gallery` to observe newly added `.ph-item`s. Seed new cards with their index among `#gallery` children.
   - `#wm` letters: observe `#wm` itself. When it is visible, process all its letters, using the **`#wm` element's** rect for `d` so the whole word assembles together. The per-letter randomness supplies the scatter.
   - Hero: process its letters while `scrollY < hero.offsetHeight`. Write neutral values once when past it.
5. **Render loop**: copy the `queued`/rAF pattern from `02-site.js` lines 21–44.
   - In `render()`, **read all rects first** into an array, **then** do all style writes, to avoid layout thrash.
   - Listen to `scroll` (passive) and `resize`. On resize, clear the cached em→px factors.
   - Call `render()` once at start.
6. **Load the script**: in `src/layouts/Base.astro`, add `<script is:inline defer src="/js/09-scatter.js"></script>` directly after the `08-logo.js` line (line 91).
7. **Do not touch**:
   - the reel (`06-interactive.js` section B)
   - the lightbox
   - hover rules
   - the hero `.ln > span` entrance transition
   - `fitWM`
   - any other section

## Scope boundaries

- Only the four targets above. No other sections, no new dependencies, no GSAP or Motion library.
- No CSS `transition` or `animation` on `.sc-l`, `.ph-item` or `.d-item` for this effect. The existing hover transitions on `transform`/`box-shadow` stay as they are.
- No `transform` writes from JS. Only `translate`, `rotate`, `scale` and `opacity`.

## Verification

1. `npm run dev -- --port 4330`, then open `http://localhost:4330/` and skip the intro.
2. Scroll slowly into Photography:
   - Cards rise in loose and tilted from the bottom.
   - They are perfectly aligned while in the middle ~35% of the screen.
   - They tilt and drift upward as they leave the top.
   - Scrolling back reverses them exactly, with no lag and no snapping.
3. Hover a gallery card in the centre band. It still lifts 2px and the image still zooms, so hover was not overridden.
4. Click "Show more photos". The new cards also scatter and assemble.
5. Hero on load: the headline is fully tidy and the entrance still rises from below. Scrolling down, letters drift up and apart. At the top of the page they are tidy again.
6. Footer: the wordmark letters assemble as the footer reaches the centre. The `fitWM` width is unchanged, with no horizontal scrollbar at 360, 768 and 1280px (`document.documentElement.scrollWidth === innerWidth`).
7. DevTools → Rendering → "Emulate prefers-reduced-motion: reduce" → reload. Nothing moves and everything is in place.
8. **Feel check:**
   - Performance panel, record a fast scroll. There should be no long tasks over 16ms from `09-scatter.js` and no "Forced reflow" warnings.
   - On a real phone, the motion should feel lighter: half amplitude at ≤700px.
   - If the dead zone feels too short for reading, widen `0.18` to `0.25`. Change only that number.
9. Screen reader: the hero `<h1>` is announced as one phrase, not letter by letter.
