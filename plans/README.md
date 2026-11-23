# Animation plans

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Scroll scatter: gallery, design grid, wordmark, hero](001-scroll-scatter.md) | LOW (additive) | DONE |
| 002 | [Landing intro: shatter and zoom into the website](002-intro-shatter-zoom.md) | LOW (additive) | DONE |

**Order:** 002 first (it runs before anything else on the page), then 001. They touch different files, apart from appending to `site.css` in different places, so they can run in parallel.

**Dependencies:** none. It builds on the motion layer from commit fa2ca7c: the `--ease-*` tokens and the rAF scroll loop in `02-site.js`.
