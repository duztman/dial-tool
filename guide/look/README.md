# guide/look — the guide in its look

*15 Oct 2026, `guide/PLAN.md` steps 7–8. The composer that sets edition 1 as A4 landscape pages and, from the same words and pictures, as a stack for a phone. Started from the 4.36.1 web guide's composer (`archive/guide/web/`), whose look Okay settled over ten rounds (`guide/notes-okay.md`).*

## Build, in this order (each step refuses to run on a different app version than the one before)

```
cd web
node build.mjs                          # the app (dial-tool.html)
node ../guide/checks/checks.mjs         # every "do X and Y happens" check (~2 min) → guide/checks/results.json
node ../guide/checks/first-dial.mjs     # the First dial done like a person → guide/checks/first-dial.json (its links)
node ../guide/look/shots.mjs            # the pictures, from a cold start → guide/look/img/ (not committed)
cd ..
node guide/look/build.mjs               # → guide/look/out/index.html, guide.pdf; out/review/ to look at
```

Then **look at `guide/look/out/review/page-NN.png` and `phone-NN.png`** before publishing. The build prints a `CHECK` line for each measurable rule a page breaks (words past their box, ragged endings, labels too close, lines that cross or run through words, a crop at an unstated scale) and `check_lines.py` reports lines over the picture. Publish: copy `guide/look/out/` (without `review/`) to `guide/` on the `gh-pages` branch.

## Files

| File | What it does |
|---|---|
| `shots.mjs` | Opens the First dial by its link in a fresh browser (iPad 1180 × 820, 3 px a point; phone 390 × 844) and reaches every state by tapping what the screen names. Writes the screenshots, `rects.json` (where each named part sits, in points) and the app's own SVG exports (each First-dial step, the final dial, its print mask, its colour file without hands). `SHOTS_OUT=folder` and an app path as first argument shoot elsewhere (for the diff). |
| `build.mjs` | The pages. Words from `guide/text/edition-1.md` (format at its top); pictures from `img/`. Each page is written twice: once placed in millimetres on the 12 × 14 grid (design canon §3), once as a stack for the phone (`FLOW`). Crops go through `cards.py`. |
| `cards.py` | Cuts a part of a screenshot with a margin of its own background (Okay's cards). |
| `check_lines.py` | Any leader line or outline that runs over the picture under it. |
| `diff.py` | The picture diff: `python3 guide/look/diff.py img img-new` compares every crop a page uses between two sets of shots, the version number covered; flags go to a human look. |
| `style.css` | The look. A4 pages on a wide screen (scaled to the window), the stack under 760 px, the pages alone in print. |
| `fonts/` | Inter (OFL). |
| `out/` | What is published: `index.html`, `style.css`, `fonts/`, `img/`, `guide.pdf`. |

## Rules the build keeps

- Interface crops are at **0.2 mm a point** (1 iPad point; `guide/BRIEF.md`), or **× 2 (0.4)** when the caption says so. The build measures every crop as set and prints its scale.
- Dials are the app's own SVG exports and are links that open the dial in the app.
- A word on a page comes from `edition-1.md`; a word written there and set nowhere is a `CHECK`.
