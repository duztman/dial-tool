# Open — in the order to do it

Numbered now → later, easier → harder. Each: what, why, where in the code.

1. ~~Brushed sweeps blow out white~~ — done, round 15: `sweep()` writes a tangent attribute (`rounds.md` 15). Still to check on the iPad: the grain itself (software GL can't show it, `system.md`). Publish as v15.
2. **Teeth too tall** — in the photo view they read as a crenellation. `teeth.depth` 0.7 → 0.5, `fill` 0.74 → 0.62, and the top chamfer larger; the Sub's are 120 and fine, the Baltic's ~60 and wide (`refs.md` 24).
3. **End link too bright / too high at the body**: its top is `lugTop − 0.35`; the Seiko (ref-10) shows it lower near the body and brushed across. Set the top from a law of its own (−0.6 at the body, −0.35 at the tip) and give its brushing the bracelet's direction.
4. ~~Lug tip chamfer~~ — done, round 16, with the lug's outer wall taking the band's belly (`rounds.md` 16).
5. **Convex outer faces** of the outermost links (dropped in the rewrite); and the Oyster centre link's polished option (the Sub's centres are polished).
6. **Crown**: a bigger dome and a shoulder on the tube; the cushion's crown sits in a guard on real Seikos — a guard is another sweep (two humps on the outline).
7. **Cushion case**: check against a real 6309/SRP photo straight from above (none in the refs yet); the lug length and the chamfer width are guesses.
8. **Lume**: milky surface by day (a slight sub-surface look: clearcoat + sheen), the glow at night — tie to Dial Tool's Night (`night.js`).
9. **Clasp** (refs 5, 6, 8): a folded sheet with a brushed cover, at `LEN`; the bracelet's far end today just stops.
10. **Crystal**: edge refraction of the rehaut and a soft window reflection; three's transmission with thickness blurs the dial — try a thin `transmission` plus a separate reflective shell.
11. **Performance on the iPad**: 60–120 teeth meshes merged (done), links ≈ 60 sweeps; measure on the M1 iPad, aim < 16 ms. Export: render at 2–4× for PNG; a PDF the Show Case's way (JPEG in a page).
12. **Integration**: show mode's Photo style = this scene fed by the app's `S` (sun keys, colours, bezel/strap choices); the two SVG paints untouched. A spec per `CASE_OF_BEZEL` kind: dress and field cases need rows in `CASES` (dress = Calatrava: thin band, stepped bezel, no teeth; field = the 1939 cushion with sharp corners).
13. **The sheet in Illustrator**: write `CASES.<key>` profiles out as an SVG (one named path per part, mm) and read them back — the drawing becomes the spec.
14. **A true cut** for holes and engravings (three-bvh-csg) — only if the photo look ever needs it.
