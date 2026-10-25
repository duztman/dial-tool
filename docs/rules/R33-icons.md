# R33 · Icons

**Icons** (canon: `docs/design.md` §9). Every icon is drawn in `web/src/icons.js`, at the size it is shown (viewBox = size on screen; the hand tiles alone at ×2). Every stroked line uses one of the four widths there, `LINE` 1.5 · `SLANT` 1.5625 · `CURVE` 1.625 · `DENSE` 1.25, chosen by what the line is (straight · slanted · curved · crowded), or a pictured width listed in `web/icons/check.mjs`; a quiet sign (Okay's choice, e.g. the rename box) is `DENSE` with its box's corners `DENSE + 1/8`; a dashed ring ends its dashes square, every other line round; a box with round corners is drawn with `box()`; a `LINE`'s level and upright runs sit on quarter points. Rings, frames and outlines inside an icon are icon lines and weigh the same as the rest; a stylesheet border is never used for a line that is part of a sign. A new or changed icon goes through the pipeline: `web/icons/fit.mjs` (on the grid), `web/icons/check.mjs` (the rules; in `npm test`, must pass), `web/icons/look.py` (how heavy it looks: within 6 % of a straight `LINE`, or a reason), and a look at `web/icons/out/sheet.png`. Okay, 14 Oct 2026: "Let this knowledge of good and proper icon making be canon. This pipeline for upcoming icons."*

**Checked by:** `icons/check.mjs` (in `npm test`); `icons/look.py` → `web/icons/out/sheet.png`

Back to the index: [rules.md](../rules.md)
