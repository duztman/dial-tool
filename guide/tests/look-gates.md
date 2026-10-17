# Step 7's gates (`guide/PLAN.md` §6, 7)

*15 Oct 2026, on beta 4.41.23. The look: `guide/look/` (README there). Pages to look at: `guide/look/out/review/` (made by the build, not committed); published at https://duztman.github.io/dial-tool/guide/.*

## 1 · The exploded dial, shown to two fresh readers ("what is printed first?")

Page 01 only (`out/review/page-01.png`), no other file, no web. Two readers (one Sonnet, one Opus), asked: what is printed first, the three rings first to last; why the minute ticks have gaps; what is at the bottom and at the top; what made them look twice.

| | Printed first → last | Gaps | Bottom · top | Looked twice at |
|---|---|---|---|---|
| Reader 1 | Minute ticks → Markers → Numerals ✔ | skip where a marker stands ✔ | date disc · cap ✔ | "Every 3 with Skip those instead" hard to parse; plate and disc read as layers, not rings |
| Reader 2 | Minute ticks → Markers → Numerals ✔ | Skip where, gaps under the markers ✔ | date disc · cap ✔ | the stack's sentence ran bottom-up while the picture runs top-down; a row's numbers unlabelled |

**Pass, both.** Changed after it: the block is now "Cap, hands, print, plate, disc", top-down like the picture, and says the tool draws the stack from the bottom up; the caption says a row's two numbers are its size and radius.

## 2 · A pop-over crop and a selected-ring crop by user-level script from cold start; a label change caught by the diff

`shots.mjs` opens a fresh browser (nothing kept), opens the First dial by its link and only taps what the screen names: Guides, Rings, the Markers row, the Outer radius button (the pop-over), the colour chip, Change…. The selected-ring crop (`c8`, page 03) and the pop-over crops (`c9`/`c10` closed and open, `c11` the colour pop-out) come from it.

Shot again from cold start, same app (`python3 guide/look/diff.py img img-rerun`):

```
same   c1-window.png          window   113 282 44 34            0.00 % changed
same   c2-rows-b.png          rows-b   158 244 44 34            0.00 % changed
same   c3-window.png          window   204 282 44 34            0.00 % changed
same   c4-window.png          window   250 282 44 34            0.00 % changed
same   c5-window.png          window   52 195 384 34            0.00 % changed
same   c6-rows-b.png          rows-b   52 295 384 34            0.00 % changed
same   c7-rows-b.png          rows-b   52 333 384 34            0.00 % changed
same   c8-window.png          window   52 233 384 96            0.00 % changed
same   c9-window.png          window   296 272 184 154          0.00 % changed
same   c10-pop.png            pop      296 272 184 154          0.00 % changed
same   c11-colour.png         colour   355 273 445 104          0.00 % changed
same   c12-font.png           font     210 125 262 160          0.00 % changed
same   window.png (whole)                                       0.00 % changed
same   phone.png (whole)                                        0.00 % changed
diff: 0 of 14 pictures changed
```

Shot again with one label changed in a copy of the app ("Palette" → "Swatches", in the colour pop-out; `diff.py img img-label`):

```
same   c1-window.png          window   113 282 44 34            0.00 % changed
same   c2-rows-b.png          rows-b   158 244 44 34            0.00 % changed
same   c3-window.png          window   204 282 44 34            0.00 % changed
same   c4-window.png          window   250 282 44 34            0.00 % changed
same   c5-window.png          window   52 195 384 34            0.00 % changed
same   c6-rows-b.png          rows-b   52 295 384 34            0.00 % changed
same   c7-rows-b.png          rows-b   52 333 384 34            0.00 % changed
same   c8-window.png          window   52 233 384 96            0.00 % changed
same   c9-window.png          window   296 272 184 154          0.00 % changed
same   c10-pop.png            pop      296 272 184 154          0.00 % changed
FLAG   c11-colour.png         colour   355 273 445 104          0.41 % changed
same   c12-font.png           font     210 125 262 160          0.00 % changed
same   window.png (whole)                                       0.00 % changed
same   phone.png (whole)                                        0.00 % changed
diff: 1 of 14 pictures changed: c11-colour.png
```

**Pass.** Nothing moves between two cold starts; the one changed word flags exactly the one crop it is in (0.41 % of its pixels; the flag line is 0.2 %).

## 3 · The four-models spread at both widths at the stated scale

- A4: `out/review/page-01.png`, and page 1 of `out/guide.pdf`. The build measures every interface crop as set: "p01: 7 interface crops at 0.2 mm a point (stated)"; p03: the close-up at 0.4 (× 2, said in its caption), the rest at 0.2.
- 390 px: `out/review/phone-01.png` — the same words and pictures stacked; the exploded dial becomes one row per layer (the ring's row beside its layer); no sideways scroll (checked by the build).

**Pass.**

## Left for a person

- Okay's eye on the three spreads (pages 01–03) and the rest. Rules the build can't measure (balance, white space) are his.
