# Plan: square and rounded-square dials (#484, with #363)

*Written 20 Oct 2026 for Okay's reading (beta 4.90, branch `wip-4.90`). A plan only: nothing here is built.*

Okay, 20 Oct 2026: "How hard is to make a square and rounded square like an apple watch … i know its big work but plan. This is an obstacle between us and beta v5."

## 1 · What it is

A dial's outline is one of: **round** (today), **square**, **rounded square** (a corner radius, as an Apple Watch's), later **rectangle** and **cushion** (#363). Everything on the dial follows the outline: the rings run round it, not round a circle.

## 2 · How hard: where the circle lives today

Every place on the dial is measured as *a radius and an angle from 12* (`place(p, r, a)`, `clock_point`, `ring_angles`). The plate is `circle(S.dial_d)`; the margin, the case, the sheet's packing (`pack_discs`), the Wear OS export, the guides, the handles and the hit-testing all take the dial as a circle. `dial_d` is read in 14 places in `geometry.js`, 13 in `output.js`, 21 in `app.js`.

The good news: **rings already go through one door** — a radius at an angle. Change what "a radius at an angle" means and most of the dial follows.

## 3 · The idea: a ring's radius becomes "how far in from the edge"

On a round dial, a ring at radius `r` sits `R − r` in from the edge. On any outline, keep that meaning: a ring is a copy of the outline, **inset** by the same amount. A point at angle `a` on that ring is where the ray from the centre at `a` meets the inset outline.

- **Square and rounded square**: the inset of a rounded square is again a rounded square (corner radius shrinks by the inset, never below 0). The ray-meets-outline point has a closed form — no searching.
- **Marks**: a mark points along the outline's *normal* at its place (straight in on a side, diagonal at a corner), not along the ray. Option to keep them on the ray (some Apple faces do) — a setting per ring: *Points: to the centre · square to the edge*.
- **Spacing**: positions are by angle (as now: 12, 1, 2… at 30° each). On a square, angle-spaced marks bunch at the corners — true to a clock face. A second spacing, *even along the edge*, comes later.
- **Bands**: the band between two inset outlines — a frame, not an annulus.
- **Numerals**: placed at the ring's point, upright or turned as now; the anchor (outer, middle, inner) measured along the normal.
- **Windows**: a window's centre is a place (radius, angle) and its own shape stays round — unchanged. A window's disc (the date disc under it) stays round: it is a part, under the dial.
- **Hands**: unchanged. They turn round the centre whatever the outline; their lengths are set by the person.

## 4 · Steps, in order (each its own version, each checked)

1. **The outline** — new keys (R30, the web version's alone): `dial_shape` (0 round · 1 square · 2 rounded square), `dial_corner` (mm). Plate, margin, the cut line in Print, the spec sheet and the sheet packing take the outline. Rings still circles. *Small*: a day.
2. **Rings on the outline** — one function, `edge_point(S, inset, a)` and `edge_normal(S, inset, a)`, replacing the circle in `place` and the ring builders; ticks, markers, numerals, bands follow. *The big one*: two to three days with checks; parity with `dial.py` (R30) holds only for round dials — a square dial has no DrawBot twin, so its check is a saved look (`test/same.mjs`) instead.
3. **The window** — guides, handles (#486) and hit-testing on the outline; the preview's fit and zoom by the outline's box; the case (bezels.js) gets square cases or hides for a non-round dial at first.
4. **Exports** — SVG, PDF, masks, Print's sheet (rounded squares pack in a plain grid), Wear OS: a Wear OS watch is round, so a square dial exports with a warning, or is clipped.
5. **Then** rectangle and cushion (#363), *even along the edge* spacing, square date windows.

## 5 · What it touches that Okay should decide

- **Ring radius in the panel**: shown as now (mm from the centre at 12), or as *Inset* (mm in from the edge)? Recommend: keep the number as now — at 12 o'clock they are the same thing — so a round dial and a square one read alike.
- **Marks at the corners**: to the centre, or square to the edge, as the default?
- **Size**: a square dial's size is its width (`dial_d` reads as width), corner radius in mm.
- **Wear OS**: refuse, warn or clip.

## 6 · Risk

The rings' code is the oldest and most checked part (parity with `dial.py`). Step 2 changes its core; the round case must stay exactly as it is — `edge_point` on a round dial returns the same numbers as today, proven by the full parity check before anything else moves.
