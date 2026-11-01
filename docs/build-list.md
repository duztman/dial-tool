# Dial Tool — build list

One line per open item, in the order it will be done: **the first column is that order**, now → future, and within a group easier → harder. The **#** is the item's name for citing, never reused and never renumbered; a row's full text, by #, is `build-list-notes.md`. Done, folded and dropped items: `build-list-done.md`; the DrawBot version's: `archive/drawbot/build-list-drawbot.md`.

Status words, four: **build** (Okay said build) · **verify** (built; Okay has not seen it on his machines) · **open** (not started; built on his word) · **parked** (Okay said park; comes back on his word). "As touched" means housekeeping done inside whatever push edits that file, never a push of its own.

*Last updated 1 Nov 2026 (v1.1.12 beta): #561 added; #552 fixed, to verify; #548 built, #16 closed, #560 added.* v1 is behind us: v1.0 beta went to `main` on 27 Oct 2026 and a beta counts as v1 (Okay, 1 Nov 2026).

## Now — Okay said build

| Order | # | Item | From | Status |
|---|---|---|---|---|
| 1 | 52 | Named instances of variable fonts: the designer's style names as tabs where Regular · Bold stand | 1 Nov 2026 — "Up to Now" | build |
| 2 | 494 | Compare at one size, as large as the canvas holds, and a real-size switch | 21 Oct 2026 — "One big, as big as what fits on the canvas, one real size option in preview" | build |

## Verify — built, for Okay's Mac, iPad and phone

| Order | # | Item | From | Status |
|---|---|---|---|---|
| 3 | 528 | Dramatic lighting: is the darkness right (×0.57 at the rim, Claude's reading of "darker") | 24 Oct 2026 | verify (4.94.19) |
| 4 | 439 | Backdrop's swatch loses its outline at times (old Safari, iPad; `background-clip: padding-box` taken) | 23 Oct 2026 | verify |
| 5 | 552 | The Type pane rode up 12 px on opening (the finger anchor followed its heading's button, which moves when a bare pane opens); now the anchor holds the pane | 31 Oct 2026 — "it should open in place, without moving up"; 1 Nov 2026 — "2" | verify (v1.1.12) |

## Next — the features, in Okay's order, then easier → harder

Okay, 1 Nov 2026: "#184 first", then #169 ("core to our mission"), #175 ("bump up in importance"), then #346 with #83 ("Up with the big three, after #175").

| Order | # | Item | From | Status |
|---|---|---|---|---|
| 6 | 561 | Windows: the check *a window turned with its radius stands 30° askew… its text turns with it, or stays level* fails on `dev` — the text no longer goes level when *Turn the text with it* is unticked, or the window leaves 4 o'clock; find which, then fix | 1 Nov 2026 — "Add the window problems to do nexts" | open |
| 7 | 184 | Snapping: lengths and radii snap to rings' edges while dragged | 14 Oct 2026, on #85; 1 Nov 2026 — "#184 first" | open |
| 8 | 169 | One strip for every position: a per-position value per setting as a strip of cells under a ring; a drawn line sets the ends; a typed rhythm repeats. Draw first, show Okay, then build | — "very very good… prioritize this" | open |
| 9 | 175 | A hand as a stack: caps, windows, lume openings | 21 Oct 2026 — "bump up in importance" | open |
| 10 | 346 | Complications, systematized — one mechanism for subdials and chronograph registers (#20 folded in), the moon's own disc, the am · pm disc as a ring of its own (#177 folded in), a big date's two discs in X-ray, an SVG for a complication's picture | 1 Nov 2026 — "Up with the big three, after #175" | open |
| 11 | 83 | Positions law: even · reciprocal · logarithmic · table · squeeze, chosen on the Positions heading line; only `ring_angles()` changes. Built with #346 | 1 Nov 2026 — "this might help us adding in complications" | open, with #346 |
| 12 | 526 | The sun's picture on top of show mode's Light tab, the long text behind (i); the guides' list's foot | 24 Oct 2026; locked 25 Oct 2026, 17:46 | open |
| 13 | 531 | Hand bevels: the join options Normal · Miter · Round (his drawing, *Bevel* beside Show) | 24 Oct 2026 | open |
| 14 | 559 | Hover lights its part, sitewide: a ring's or window's row — pointed at, focused, controller open — lights that thing on the dial, as a Hands row does | 18 Oct 2026 — "these preview gestures are sitewide"; split from #329, 1 Nov 2026 | open |
| 15 | 502 | Notices: every warning, error and note in the app looked through — inventory first, then Okay sorts them into kinds, then one look per kind | 21 Oct 2026; 1 Nov 2026 — "Keep, ordinary priority" | open |
| 16 | 404 | Every hand gets a real hub, life-accurate at the cannon pinion; dauphine and leaf first, their details kept in the lit picture (#421 folded in) | 19 Oct 2026; 21 Oct 2026 — "All hands get hubs." | open |
| 17 | 349 | Each marker selectable and editable: first press the ring, second the mark or numeral; Nudge works on ticks and markers | | open |
| 18 | 558 | Bracelet photo lighting: one snapshot-like light on any backdrop, soft outlines, many gradients; "Let's workshop this" | 24 Oct 2026, his photo; split from #529, 1 Nov 2026 | open |

## Housekeeping — as touched, never a push of its own

| Order | # | Item | From | Status |
|---|---|---|---|---|
| — | 398 | The stylesheet's values off the scale (R32): put on the scale when their file is edited for something else; a look change shown in that round | 1 Nov 2026 — "Why is this even a question?" | as touched |
| — | 535 | Sliders that stop short: widen a slider's track where Okay meets its end, a dot on the track at 0 when it crosses zero | 24 Oct 2026 — "Only where I hit it" | as touched |

## Later — easier → harder

| Order | # | Item | From | Status |
|---|---|---|---|---|
| 19 | 403 | Playwright 1.56 → 1.64: a session of its own; re-measure the window test, save the look again | | open |
| 20 | 543 | `same.mjs`: two states differ between two runs of one build (the corner switches' words still folding; a hover left by a click) | 25 Oct 2026 | open |
| 21 | 407 | The window test in sections that stand alone, so a small push runs only the sections it touches | 19 Oct 2026 | open (`window-only.mjs` runs chosen sections) |
| 22 | 132 | The font box's preview follows the switches (a slashed zero shows in the 0; fractions show 1/2) | 13 Oct 2026 — "notes for later" | open |
| 23 | 176 | A fit section under Dial's sizes, so rings and windows fit | | open |
| 24 | 63 | Live text in the PDF (the font built into the file) | 11 Oct 2026 — "SVG now, PDF later"; 1 Nov 2026 — not to be asked again | open |
| 25 | 560 | Live text in the vectors Okay gets from a session to work on in Illustrator (sketch rounds, crops); and look at which fonts the SVG export outlines with the tick on | 1 Nov 2026 — "It would be nice to get live text in some ui elements… Even svg outlines some fonts" | open |
| 26 | 100 | The whole interface smaller on an iPad, about 80 % — one factor on the tokens, or the page's zoom | 13 Oct 2026 — "note for later" | open |
| 27 | 491 | Ink thicknesses for show mode's Engineer style | — "You can tackle ink thicknesses next" | open |
| 28 | 21 | Plotter output for the pen plotter via LightBurn: a centre-line or hatched SVG, a new output under Export → Print | | open |
| 29 | 75 | Usability review, the other tabs: Rings · Hands · Windows · Export, one at a time | 12 Oct 2026; 1 Nov 2026 — "Keep, Later" | open |
| 30 | 14 | Heavy dials: redraw on mouse-up if dragging feels slow (a slider step on the worst ring 40 ms in Chromium; the Intel Mac is slower) | | open |
| 31 | 135 | Weekday and month names by language, built into the tool (which languages: ask); non-Latin scripts need #15 | 13 Oct 2026 | open |
| 32 | 362 | An Apple Watch preview: at least the dial in an Apple Watch's frame (a real face is not open to third parties) | 18 Oct 2026 — "some kind of preview for apple watch?" | open |
| 33 | 173 | SVG import, one mechanism (R34; R23 says how a file is read): a picture on the dial, a logo (#72), imported marker and hand shapes (#50; cathedral hands with them, #19), a moon window's Custom… (#466), a blank template file (#405). The moon, am · pm and dial places are readied with a note | 24 Oct 2026 — "spaces set. Moon, ampm, dial only"; 1 Nov 2026 — "One row" | open |
| 34 | 89 | Movement numbers: a *Size from movement* menu for windows, the feet as a guide — blocked until Okay reads the movement drawings on a Mac | | open, blocked |
| 35 | 53 | Better interface overall: research how good parametric tools lay out lists, inspectors and export, then propose; an export panel that shows what will be written (#171) | 11 Oct 2026 — "learn and implement" | open |
| 36 | 522 | Finishes and materials in show mode, one row: paint finishes and textures, dial finishes and a preview pipeline, sunray · grain · guilloché on bands (#33 folded in), print-like edges, lume view and lume plots (#19), the bezel, 3D indices, a 3D model | 24 Oct 2026; 1 Nov 2026 — "Merge into one: finishes and materials, Later" | open |
| 37 | 363 | Non-round dials, one row: square and rounded-square as an Apple Watch's first, then rectangle, rounded rectangle, diamond; the plan is `docs/plan-non-round.md` | 18 Oct 2026; 1 Nov 2026 — "Merge into one, keep in Later" | open |

## The guide — its own schedule, outside the order

| Order | # | Item | From | Status |
|---|---|---|---|---|
| — | 93 | Guidebook, edition 2 (R25): rebuilt from the current app on Okay's word; the human reader round, his look at the pages, the InDesign package | 1 Nov 2026 — "Guide will happen when it happens, not now. No link to a version just a sub project with its own loose schedule" | on his word |

## Parked — on Okay's word

| Order | # | Item | From | Status |
|---|---|---|---|---|
| — | 395 | Dial Packer: place dials in the discs | — "I will announce when to cross to placing dials" | parked |
| — | 15 | Fallback font for scripts the main font lacks | 17 Oct 2026 — "a good idea but not necessary, we run on fonts" | parked |
| — | 77 | Persistent groupings for every section | 12 Oct 2026 — "Park for now" | parked |
| — | 358 | The LINK pill on other linkable pairs | 18 Oct 2026 — "Common sense or park for now" | parked |
| — | 61 | Editing on the preview: movers and shifters on the dial itself | 11 Oct 2026 — "Park now" | parked |
| — | 180 | Gerstner's programme — remind Okay when #169 exists | — "park for now, remind when applicable" | parked |
