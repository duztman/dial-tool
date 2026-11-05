# Open — in the order to do it

Numbered now → later, easier → harder. Each: what, why, where in the code.

1. ~~Brushed sweeps blow out white~~ — done, round 15: `sweep()` writes a tangent attribute (`rounds.md` 15). Still to check on the iPad: the grain itself (software GL can't show it, `system.md`).
2. ~~Teeth too tall~~ — done, round 18: depth 0.5, fill 0.62, chamfer 0.45 (`rounds.md` 18).
3. ~~End link~~ — closed, round 19 (Okay: "end link ok").
4. ~~Lug tip chamfer~~ — done, round 16, with the lug's outer wall taking the band's belly (`rounds.md` 16).
5. **Convex outer faces** of the outermost links (dropped in the rewrite); and the Oyster centre link's polished option (the Sub's centres are polished).
6. **Crown**: a bigger dome and a shoulder on the tube;
7. ~~Cushion case~~ — dropped, round 19 (Okay: "sub par"); its `CASES` row is in the history (commit 14fa29d) if a cushion is ever wanted again.
8. **Lume**: milky surface by day (a slight sub-surface look: clearcoat + sheen), the glow at night — tie to Dial Tool's Night (`night.js`).
9. **Clasp** (refs 5, 6, 8): a folded sheet with a brushed cover, at `LEN`; the bracelet's far end today just stops.
10. **Crystal**: edge refraction of the rehaut and a soft window reflection; three's transmission with thickness blurs the dial — try a thin `transmission` plus a separate reflective shell.
11. **Performance on the iPad**: 60–120 teeth meshes merged (done), links ≈ 60 sweeps; measure on the M1 iPad, aim < 16 ms. Export: render at 2–4× for PNG; a PDF the Show Case's way (JPEG in a page).
12. **Integration**: show mode's Photo style = this scene fed by the app's `S` (sun keys, colours, bezel/strap choices); the two SVG paints untouched. A spec per `CASE_OF_BEZEL` kind: dress and field cases need rows in `CASES` (dress = Calatrava: thin band, stepped bezel, no teeth; field = the 1939 cushion with sharp corners).
13. **The sheet in Illustrator**: write `CASES.<key>` profiles out as an SVG (one named path per part, mm) and read them back — the drawing becomes the spec.
14. **A true cut** for holes and engravings (three-bvh-csg) — only if the photo look ever needs it.
