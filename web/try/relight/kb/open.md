# Open — in the order to do it

Numbered now → later, easier → harder. Each: what, why, where in the code.

1. ~~Brushed sweeps blow out white~~ — done, round 15: `sweep()` writes a tangent attribute (`rounds.md` 15). Still to check on the iPad: the grain itself (software GL can't show it, `system.md`).
2. ~~Teeth too tall~~ — done, round 18: depth 0.5, fill 0.62, chamfer 0.45 (`rounds.md` 18).
3. ~~End link~~ — closed, round 19 (Okay: "end link ok").
4. ~~Lug tip chamfer~~ — done, round 16, with the lug's outer wall taking the band's belly (`rounds.md` 16).
5. ~~Convex outer faces~~ — done, round 20 (bulge 0.2); the polished-centre option is a column's fifth field `"polished"`, off by default.
6. ~~Crown~~ — done, round 21: dome 0.95, shoulder r 2.1 × 0.5.
7. ~~Cushion case~~ — dropped, round 19 (Okay: "sub par"); its `CASES` row is in the history (commit 14fa29d) if a cushion is ever wanted again.
8. **Lume**: milky surface by day (a slight sub-surface look: clearcoat + sheen), the glow at night — tie to Dial Tool's Night (`night.js`).
8a. ~~Ground grain invisible~~ — solved, round 34: the table mesh was never added to the scene (its add sat inside a comment); there was no ground to show grain on. Back in; grain visible. The relief itself may still want tuning on the iPad.
8b. ~~The strap~~ — done (Okay, 7 Nov 2026: "Leather strap is done"); stitching, buckle and texture not asked for.
9. ~~Clasp~~ — out of budget (Okay, 5 Nov 2026).
10. ~~Crystal~~ — done, round 30 (dome 0.5, thickness 1.2). No window streak: the dome is too flat to show one (`rounds.md` 30).
11. **Performance on the iPad**: 60–120 teeth meshes merged (done), links ≈ 60 sweeps; measure on the M1 iPad, aim < 16 ms. Export: render at 2–4× for PNG; a PDF the Show Case's way (JPEG in a page).
12b. **The render styles** (rounds 35–36), to refine on Okay's marks: line weights per style, Toon's step count and warmth on gold, Technical as a true orthographic three-view sheet with hidden lines dashed and the lines as SVG vectors (joins 13). 'Rotating' vs 'fixed' bezel: the fixed profile is unstudied. The Dress preset (round 36) is Claude's draft — stage 3 proper waits on photographs.
12a. **The parametric case** — CLOSED for now (Okay, 8 Nov 2026: "Call this case closed 3D for now"); stages 1, 2 and 4 are in, stage 3 (the dress row from photographs) waits with it. Kept for the record: (Okay, 8 Nov 2026: "I want to be able to go from a diver to dress watch and design it"; plan approved, soft blend the default), in stages, one a round: ~~1 one body~~ (round 32) · ~~2 the bezel stack by named relative numbers~~ (round 34; a `plain` kind exists, unstudied) · 3 a dress row in `CASES` (thin band, stepped smooth bezel, tapering curved lugs, small crown — waits on his reference photographs) · ~~4 an Outline technical view~~ (round 35: the Technical style, lines from the EdgePass; as SVG later, see 13). Assumed, not yet said by him: lug families slab and tapered-curved only; the plan by numbers, the Illustrator sheet later.
11a. **Round 76, for Okay to judge on the iPad**: that the page no longer moves; the wood (rings, knots) and the scruffy top at his zoom; the system picker over a swatch inside the popup. A gradient is not in the SVG drawing (it takes the first colour).
12d. ~~The dial from Dial Tool~~ — done, rounds 82–84: the tool's SVG with each part's heights, and a pasted link through the tool's engine shipped with the page (`system.md`). Left: the window's depth built (the disc sunk `data-under`, the plate's hole a real edge); a hand's own thickness (no setting in the tool: 0.3 mm here); lume as a material; the tool's bezel and rehaut (#582) driving this case; the engine rebuilt when the tool's link grows keys; a font added from a file or a link in the tool is not with this page.
12. **Integration**: show mode's Photo style = this scene fed by the app's `S` (sun keys, colours, bezel/strap choices); the two SVG paints untouched. A spec per `CASE_OF_BEZEL` kind: dress and field cases need rows in `CASES` (dress = Calatrava: thin band, stepped bezel, no teeth; field = the 1939 cushion with sharp corners).
13. **The sheet in Illustrator**: write `CASES.<key>` profiles out as an SVG (one named path per part, mm) and read them back — the drawing becomes the spec.
14. **A true cut** for holes and engravings (three-bvh-csg) — only if the photo look ever needs it.
