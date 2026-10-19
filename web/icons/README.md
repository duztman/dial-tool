# Icons: the pipeline

*Written 14 Oct 2026 (beta 4.36), after the icon audit. The rules are R33 (`docs/rules.md`); the why is the design
canon, `docs/design.md` §9. This folder holds the tools that keep every icon on them.*

An icon in Dial Tool is an SVG drawn in the icon block at the top of `web/src/app.js`, at the size it is shown, with
one of four line widths: `LINE` 1.5 (straight) · `SLANT` 1.5625 (slanted) · `CURVE` 1.625 (round) · `DENSE` 1.25
(crowded). The widths differ so that every line *looks* equally heavy.

## Adding or changing an icon

1. **Draw it** anywhere: Illustrator, Figma, by hand in SVG. Any size; strokes for lines, fills for solid parts.
   Keep it simple: at 16 points a line is three screen dots wide.
2. **Fit it to the grid:**
   `cd web && node icons/fit.mjs drawing.svg 16 name`
   (16 = the size it will be shown at). It scales the drawing to that size, gives each line its width by what it
   is (straight → `LINE`, slanted → `SLANT`, round → `CURVE`; a round-cornered box → `box()`), snaps straight runs
   onto quarter points and circles so their edges land on whole dots, and prints the code to paste. It also writes
   `icons/out/fit-name.svg` to look at.
3. **Paste** the printed `icon(…)` into `app.js`: in `SIGNS` if it is a sign used in more than one place, in
   `TOOL_ICONS` or `PICS` otherwise. A sign inside a round button goes through `round_sign()`.
4. **Check the rules:** `node build.mjs && node icons/check.mjs` (also the last step of `npm test`). It opens the
   tool in Chromium at 2×, visits every tab, pick and pop-up, finds every icon and checks: drawn at its size · only
   the four widths (or a listed pictured width) · straight `LINE` runs on quarter points · round-cornered boxes drawn
   with `box()`. It fails on a broken rule and says which icon, which line and why. It also writes
   `icons/out/sheet.png`, every icon cropped from the window: **look at it** (R19).
5. **Check the weight:** `python3 icons/look.py` (or `python3 icons/look.py icons/out/fit-name.json` for a new
   drawing before it is pasted). It blurs each icon as an eye sees a 2× screen at a desk and reads how dark each
   line looks, in place among its neighbours, against a lone straight `LINE`. A line more than 6 % off is listed
   with how it reads alone too: if it is only off in place, a fill or crowding beside it makes the difference (look
   before changing it); if it is off alone, the line itself needs another width, and the report names one. A small
   sign whose lines crowd usually wants `DENSE`.
6. **Look** on the Mac and the iPad. The numbers propose; the eye decides (Okay: "perception overrules, sensibly").

## Files

| File | What it does |
|---|---|
| `fit.mjs` | A drawing in, a fitted icon out: scale, widths, snapping, the code to paste. Reads paths (every command), rect, circle, ellipse, line, polyline, polygon, and translate/scale transforms; reports anything else instead of guessing. |
| `check.mjs` | The rules, over every icon in the running window; writes `out/inventory.json`, `out/icons/*.png`, `out/sheet.png`, `out/look.json`. Exits 1 if a rule is broken. |
| `look.py` | How heavy each line looks (numpy, scipy, pillow). Runs `weigh.mjs`. |
| `weigh.mjs` | Draws icons black on white at 2× and records each line's middle in screen dots, for `look.py`. |
| `out/` | What the tools wrote (not in the repo). |

## What these tools can't judge

- **Colour.** They measure weight in black on white; a grey line still looks lighter than an ink one.
- **Lines on a fill** (a shown window in its card) and **lines crossing a faint one** (the Placement A's over the
  dial's edge) read heavy in `look.py`; the value buttons' light discs read as ink. These are listed in `SKIP` in
  `look.py` or explained in its report; look at them instead.
- **Hover states** are not visited by `check.mjs`.

## The archive

`node icons/archive.mjs` (after `node icons/check.mjs`, which `npm test` runs) writes every icon into `svg/`: one file per drawing, named after where it was found (`-on` when seen switched on), its lines black. The folder is committed, so every version's icons stay in the history (build list #336; Okay, 18 Oct 2026: "would be nice to have all the icons archived somewhere as svg").
