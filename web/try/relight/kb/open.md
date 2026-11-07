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
8a. **Ground grain invisible** (rounds 22–24): the bump's relief is 0.18 mm — true but unseen under the tent. Either `bumpScale` 2–3 (the usual cheat, one number) or a normal map baked from the same canvas. Okay to choose.
8b. ~~The strap~~ — done (Okay, 7 Nov 2026: "Leather strap is done"); stitching, buckle and texture not asked for.
9. ~~Clasp~~ — out of budget (Okay, 5 Nov 2026).
10. ~~Crystal~~ — done, round 30 (dome 0.5, thickness 1.2). No window streak: the dome is too flat to show one (`rounds.md` 30).
11. **Performance on the iPad**: 60–120 teeth meshes merged (done), links ≈ 60 sweeps; measure on the M1 iPad, aim < 16 ms. Export: render at 2–4× for PNG; a PDF the Show Case's way (JPEG in a page).
12. **Integration**: show mode's Photo style = this scene fed by the app's `S` (sun keys, colours, bezel/strap choices); the two SVG paints untouched. A spec per `CASE_OF_BEZEL` kind: dress and field cases need rows in `CASES` (dress = Calatrava: thin band, stepped bezel, no teeth; field = the 1939 cushion with sharp corners).
13. **The sheet in Illustrator**: write `CASES.<key>` profiles out as an SVG (one named path per part, mm) and read them back — the drawing becomes the spec.
14. **A true cut** for holes and engravings (three-bvh-csg) — only if the photo look ever needs it.
