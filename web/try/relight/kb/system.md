# The system — how the model is built

## The one rule

**A part is a section swept along a path, with a finish per face.** The case's body and lugs are ONE such part since round 32: `casePlan(C)` gives the plan as one closed outline (body arcs, root fillets, lug edges, tips), each station with its kind, its y for the lug's laws and its chamfer; `buildCase` sweeps one section round it and closes the top with `coons()` patches over the lugs and flat sectors between them. The section carries the shape (a lug's slab, a link's bean, a band's flank), the path carries the taper and the bend (a lug's laws, a bracelet's curve, a case's outline), and the face list says which strips are brushed and which polished. Everything that isn't a sweep is a **lathe** (a profile spun round an axis: caseback, bezel ring, rehaut, crystal, crown) or a **plate** (a flat shape: the case top, the insert, the dial).

So the watch is data. Two tables in `watch3d.html`:

```
CASES.<key>      plan (round | cushion — the builders keep both; only the diver is in the table) and its numbers · zBand, zTop, belly, chamfer, flank finish
                 lug: { tipTop, tipBot, rootBot, chamferTip, holeIn, corner, fillet, chamferIn }   (fillet: the blend's radius where the lug leaves the body; chamferIn: the break on the inner wall's top edge)
                 bezel: { kind (insert | plain), inset, width, dialUp, seat, h, chamfer, lip, inIn, inOut, rim, up, dome, teeth: { n, depth, fill, chamfer } }   — all relative: radii off R, heights off zTop (round 34); teeth = scallops cut into the wall: n a turn, depth deep, fill of the pitch wide
                 crown: { at (degrees from 3 o'clock), w, h, z, flutes }
BRACELETS.<key>  W1, P0, P1, H1, gapx, gap · columns: [[share, section, out, offset, finish?], …]  (finish "polished" for a column; default brushed)
```

A new case = a new row in `CASES`; a new bracelet = a new row in `BRACELETS`. The Illustrator sheet Okay will draw is the **profiles' half** of a `CASES` row: the band section, the lug section and its laws, the bezel profile and tooth, the crown profile — one path per part, named, in mm.

## Coordinates

- **Case space**: millimetres at the published size; x right, y up the dial (12 o'clock is +y), z up from the caseback. The dial's face is at `DIAL_Z` = 10.
- **World**: `W(x, y, z) = [x, z − DIAL_Z, −y]` — three.js y is up, the dial's 12 o'clock is −z. The **case and strap groups** are scaled by K = `scene.size` (the dial's Ø over the case's opening, r 14.6 in case mm); the dial's parts stay at their millimetres, so a 34 mm dial sits whole inside the opening of a 47 mm case. The dial's size does not include the rehaut (Okay, 5 Nov 2026): the rehaut starts at the dial's edge and sits outside it.
- The dial's own parts come from Dial Tool: `dump.mjs` writes `scene.js` with every part's SVG path, colour, ink height, hand angle. Nothing of the dial is modelled here.

## The builders (`watch3d.html` § 2, 5, 6)

| Builder | Takes | Gives |
|---|---|---|
| `sweep(stations, mats, {closeSection, caps, crease})` | a list of sections (same point count), a material index per edge | one `BufferGeometry` with a group per edge; UVs u along the path · v round the section; a **tangent** per vertex along the path (the brushed anisotropy needs it — without it three builds a per-pixel frame from UV derivatives and the sweep blows white); **every strip owns its vertices**, so a section corner is a hard edge unless the bend is under `crease` (40°) — a bean's arc and the band's belly stay smooth, a chamfer stays a line |
| `lathe(pts)` | `[r, z]` pairs in case space | a `LatheGeometry` round the dial's axis |
| `outline(C)` | a case spec | `at(θ)` → point and outward normal on the body's plan (the crown's place) |
| `casePlan(C)` | a case spec | `loop`: the whole plan, body and lugs, as stations `{x, y, nx, ny, kind, part, c}`; `lugs[]`: each lug's inner and outer edge (root → tip) and root arc; the laws `lugTop(y)`, `lugBot(y)`, `u(y)` from the root; `yAt(x)` the slot's edge (body, then fillet) for the end link; `xOut(y)` |
| `coons(bottom, top, left, right, zOf, mat, rows, cols, flip)` | four boundary curves in the plan, a height law | a patch filling them (a lug's top or underside), with UVs and tangents along its length |
| `buildBezel(C, g)` | a case spec, the case's group | rehaut, ring, coin edge, insert or plain top, crystal from the bezel's named numbers; `DIAL_Z` (world y = 0, the dial's face) is `zTop + dialUp`, set at rebuild |
| `buildCase(C)` | a case spec | the group, and `info`: `xi, xo, half, yEdge, lugTop(y), lugBot(y), xOut(y), holeZ, tipH, yAt` — what the bracelet needs |
| `link(sec, w, l, h, out, finish)` | bean · barn · slab · barrel; width, length, thickness; which side faces out; a finish for the whole link | a link whose ends round to the stadium of its thickness; the outer flank bowed 0.2 mm and screw heads on it if `out` |
| `buildBracelet(key, info)` | a bracelet key and the case's `info` | end links, the offset columns' first half-links, then rows pin to pin along the curve |
| `buildLeather(info)` | `STRAP` (T, W1, pillow, edgeR, LEN, gap, fold, foldW, keeper) | a flat pillowed band with burnished edges, its end clear of the body, a fold round the bar; two keepers as stadium loops on the buckle end |
| `insertRing()` | | the insert's picture on a flat ring |
| `mergeGeometries(geos)` | | one geometry (the teeth) |

**Laws** (functions of position, in `casePlan` / `buildBracelet`): `lugTop(y)`, `lugBot(y)` smooth steps from the lug's root (where the inner fillet meets the body) to the tip; `xOut(y)` the lug's plan edge (a cubic for the flare); `widthAt(s)`, `thickAt(s)`, `pitchAt(s)` linear from the case to the clasp; `zAt(s)` the pins' curve — level 6 mm past the lugs, then an S down over 18 mm onto the table.

## Materials

Two metal finishes, used everywhere, chosen per face: **polished** (roughness 0.16) and **brushed** (0.36, anisotropy 0.85 — the highlight stretched along the grain; needs UVs). Plus paint (markers), insert, sapphire (transmission), leather, dark (holes, screw rims), hand. `metalHex` is swapped for Steel / Gold and the parts rebuilt.

## Light

- **Studio**: a light tent (grey sphere) with a key softbox high at the upper left, fills right/front/back, a **black flag** straight over the lens, a darker table; one soft directional sun from the app's `sh_from`/`sh_rise` with a 4 K PCF shadow; **GTAO** ambient occlusion (radius 2.2 mm); ACES tone mapping at 1.05.
- **Sun**: the same with the sun hard and strong, the room dimmed.
- The ground's drawn grain is a bump map; the **Ground** pill (grain / plain) removes it from the shader for a cheaper frame.
- Views: **Top** (fov 13, straight down, 12 up), **Photo** (36° up from the lower right, watch turned −10°), **Wide** (the same angle pulled back: the whole watch, both strap ends), **Low** (14° up from the 5 o'clock side: the crystal's dome, the flank, the lugs' fall), **Side** (from the crown's side, a little above the table — the one that finds height bugs). `shot3d.mjs` takes any of them.

## Rooms (round 37)

`S.studioKind` (not `room` — that is the Room-light slider): tent (grey light tent, `studio()`) · dark (`darkStudio()`: black room, key panel, strip, back glow, low card). `setRoom(room, fresh)` swaps the PMREM environment; each is made once, the dark one again when the card's sliders (`S.card`: height, size, lum) move. Dark is the default (round 38). The sun and the table are the same in both.

## Render styles (round 35)

`S.style`: photo · toon · cel · pixel · dither · tech. `applyStyle()` swaps materials (each photo material keeps its stand-ins in `userData`), switches passes (GTAO for photo; `EdgePass` for the drawn styles; `gridPass` for pixel and dither) and the light (the `fill` hemisphere light, the sun's step strength in `render()`). `rebuild()` re-applies the style to new meshes. The bezel's `kind`: rotating (insert, coin edge) · fixed (plain ring).

## Shooting and publishing

- `node try/relight/shot3d.mjs out.png <from°> <rise°> [studio|sun] [top|photo|side] [diver] [oyster|barn|jubilee|leather]` — Chromium with SwiftShader; needs `three@0.170.0` in `node_modules` (`npm install --no-save three@0.170.0`). Slow (≈ 50 s a shot), grainy AO; the look is true, the frame times are not.
- `node try/relight/build.mjs` → `relight-built.html`… for the 3D page the one-file build is made by inlining `scene.js` into `watch3d.html` (see `rounds.md` round 1's recipe) and published to the artifact *Watch 3D trial* by the same path.
- `python3 try/relight/check.py` before any publish: the module parses and no statement hides after a `//` comment on its line (it happened four times).
- `node try/relight/shot-set.mjs /tmp/n` shoots a round's set (top · low · side · lug join · underside) from the working page, for looking before publishing.
- A part outside the fixed views (the keepers, the buckle): a one-off script on `shot3d.mjs`'s pattern that moves `window.watch3d.camera` (`position`, `lookAt`, `fov`, `updateProjectionMatrix`) before `render()` — run it from `web/` so playwright resolves.
- R21: judge a height from the **Side** view, a seam from a **crop at 2×**, never from the top view alone.

## Known limits of the approach

- No solid modelling: a hole is a disc on the wall. (The lug no longer overlaps the band — body and lugs are one skin since round 32.) Real cuts (a drilled lug, an engraved number) would need a CSG pass (three-bvh-csg) — not needed for the photo look so far.
- `sweep` sections must keep their point count along the path; a shape that changes topology (a slot opening) is two sweeps.
- The crystal refracts at its true thickness (1.2, ior 1.76, roughness 0 — three's transmission blur is roughness, not thickness); its dome is too flat (0.5 over 30 mm) to show a window streak, so the studio has no window panel: the tent's veil is its reflection.
- Software GL in a session can't show anisotropy or AO as the iPad will; check there.
- **GTAO sees front faces only** (its normal/depth pass is a FrontSide `MeshNormalMaterial`): every mesh must wind outward or the AO of its inside is painted on its outside. `sweep()` guarantees this for sweeps; a new builder must too (a mirrored copy of a geometry flips its winding).
