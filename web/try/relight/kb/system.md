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

## Colour: the Background and the column (round 76)

The Show Case's system (`show-case/app/src/main.js` on `show-case-app`; Okay, 10 Nov 2026: "implement show case's color system exactly"). `S.floor` is the ground's colour (hex), `S.floor2` a second one for a gradient at 45°, the first at the top left. **Background** is a canvas switch at the bottom left; its popup holds ten colours (`SOLIDS`), ten gradients (`GROUND_GRADS`) and the colour itself — the system's picker lies over its swatch, inside the popup (`.pickwrap > .overpick`). Nothing may stand outside the layout: an input out of the flow scrolls the document when focused (`rounds.md` 76).

- **The table** takes the colour in its shader (`tintGround`): the material is white, the shader multiplies in `mix(gA, gB, t)`, t read off the pixel's place on the canvas — the gradient stays put while the camera moves. The table's toon stand-in gets the same hook (`styledMaterial`). `setBackdrop()` writes the uniforms; `groundChanged()` is what a control calls.
- **The column** (`groundLook()`): the ground's hue, saturation × 2.2 + 0.15, lightness × 30 %, at 85 %; the title and tabs a tenth lighter; row lines 22 points from the column, words 66 above it, boxes 11, hover 16, outlines 22. The round swatch at the title's end (`#sc-grey`) swaps to the bar's grey (`hsl(0 0% 13%)`, solid).
- **The drawing** (SVG) takes `S.floor` only: a gradient is not drawn there.

## The table's surface (round 76)

`GROUND_KINDS` — Plain · Grid · Scruffy · Wood (`S.ground`). A surface is one picture in **neutral greys**: 128 leaves the colour alone, lighter lifts it, darker lowers it (the shader doubles the picture, `gGain`), so one picture serves every colour and a scratch can be lighter than its table. The same picture is the bump map. Each kind: `tile` (mm on the table), `px`, `bump`, `rough`, `coat`, `draw()`. Pictures are drawn on first use and kept (`groundTex`). `tileNoise` wraps its lattice, so tiles meet without seams.

| Kind | Tile · picture | What is drawn |
|---|---|---|
| Wood | 160 mm · 2048 px | a field whose whole numbers are growth rings (44 a tile, 3.6 mm), wandering by slow noise; each ring light to a dark late-wood line; fibre streaks, pores, a slow drift; two knots (`KNOTS`, mm from the tile's middle, where the watch stands): the rings part round them, inside they run in ragged circles, darker, with a dark core and edge |
| Scruffy | 200 mm · 2048 px | speckle and blotches; 1100 scratches (68 % one way, −22°; 12 % long), each a light line with a dark lip; 40 scuffed patches of fine hairs; 30 gouges; 700 pits |
| Grid | 100 mm · 2000 px | a cutting mat's print: lines each 5 mm (faint), 10 mm, heavier each 50 mm; no relief; dark lines, or light ones where the ground's lightness is under 0.18 |
| Plain | — | no picture |

## On the canvas (round 76)

Dial Tool's canvas switches (`.onview`, `web/src/css/6-preview.css` on `dev`: 32 high, a hairline at 35 % of the canvas ink, the ink white on a ground darker than 0.55 and black otherwise, the ground's colour behind the words, corners 10) — Okay: "On canvas buttons come from the app itself". Top left: **Camera · Sun**, what a drag moves (`S.drag`: `orbit` · `sun` · `none`), each joined to its **lock** (`S.lockCam`, `S.lockSun`). Locked = frozen to the hand: it can't be chosen or dragged; the views and the sliders still move it. Locking the chosen one hands the drag to the other if that is free. Bottom left: Background.

## The dial from Dial Tool (round 82)

The hand-over is **Dial Tool's SVG export** (Export → SVG; `svg_document` in `web/src/output.js`): inside `<g id="dial">` every part is a filled outline in mm, text already outlines, its `id` what it is. `svgToScene(text)` makes the same object `dump.mjs` writes (`window.SCENE`); `setDial(scene, name)` puts it in the watch; **Default** puts the opener back. Nothing of the tool's engine or fonts is in the page.

| The SVG's `id` | Becomes |
|---|---|
| `plate` | the plate (its picture) |
| `window-N-disc`, `window-N-…` but the frame | flat, in the plate's picture |
| `…-hand` (`hour-`, `minute-`, `seconds-`; any other is a function's hand), `cap` | hands, the cap |
| anything else | a mark in relief — unless a contour of it encloses over a tenth of the plate (a band, a sector, a circle line): then flat print |

**Heights come with the file** (round 83; Dial Tool v1.1.63 beta on, #584): each path carries `data-role` (the engine's word), `data-ink` (a printed part's thickness, mm), `data-hand`, `data-over` (a hand's or the cap's height over the plate, mm), `data-under` (a window's disc under the plate), `data-bevel`, `data-dome`, `data-hw`, `data-boss`; the group `data-dial-d`. With them the table above is not used: a printed part (ring, ring stroke, date frame) stands its ink's thickness (`it.h`); a hand stands at its height (`it.z`) and is `HAND.t` thick, bevel included (the Hand thickness slider, 0.15 mm to start: the tool has heights, not thicknesses); a hand's lume or painted mark lies flush in the hand's top; a boss is a disc on its hand filling the space up to the next hand; a window is an opening: the plate is a solid with its holes cut through, under it lies a ring of its own round the dial's centre, 1.0 mm wider than the opening on both sides, `data-under` mm below the face, with what the window shows painted on it (rounds 85–86, `buildDial`). Each later printed part is drawn 0.0015 mm higher than the one before, so two inks of one thickness do not flicker — a drawing need, not a height. The tool's rehaut, bezel and insert are left out by role.

**A file from before v1.1.63** has no such attributes: its parts are told by `id` (the table above), a part enclosing over a tenth of the plate is taken as flat print, the rest stand 0.30 mm and 0.02 more each, the hands 0.08 over the highest and 0.32 apart. The pane says "heights guessed". Either way: the hands arrive turned to their time (angle 0); the Ø is `data-dial-d`, else the title's, else the plate's reach; paths must be absolute M L Q C Z; live text and a print mask are refused.

**The movement** (rounds 87–88): `HAND.move` — "dial" (the file's heights) or a movement's id. `MOVES` is filled at start from `movements.js` beside the page: Dial Tool's generated record (`web/src/movements.js`, from `docs/research/movements.json`), copied by `engine-build.mjs` — the page writes no movement's number. A movement gives the hour, minute and seconds hands' heights and the cap's top (`heights`; `from` "maker" or "posts"), each hand's thickness where printed (`hand_t`, else the slider's) and `crystal_clearance`. A hand's height is its underside; the cap's is its top. **The dial's seat** (`rebuild`): the case's own room under the crystal is `seat + h − CRYSTAL_SEAT − dialUp`; the stack needs `stackTop + clearance` (in mm, so `/ K` in case units); the dial sinks by what is missing (`info_sink`), the rehaut's foot following it.

## A link (round 84)

A link is the dial's settings; shapes need the tool's engine and fonts. An artifact may not load code or fetch from the tool's site (the probe, 10 Nov 2026: github.io blocked; WebAssembly and the artifact's own files allowed), so the engine travels with the page:

- **Build**: `node web/try/relight/engine-build.mjs <a checkout of dev>/web <out>` → `<out>/engine.js` and `<out>/fonts/`. It bundles the tool's own `geometry.js`, `output.js`, `show.js` with PathKit and HarfBuzz (as `web/build.mjs` does), a map from a font's name to its file (`font_list.js` without its samples), and exports `svgFromLink(text, fontsFolder)` → `{ svg, version, d, missing }`: the link read as the page reads it (`session.js` `unpack`), the dial's fonts fetched from the folder, the SVG written as Export writes it with its facts.
- **Page**: `dialFromLink` imports `engine.js` from beside the page at the first link, then hands the SVG to `dialFromText` — one reader for a file and a link. The pane names the engine's version, and any font not with the page (a stand-in is drawn).
- **Publish**: the artifact is `index.html` (the page with `scene.js` inlined), `engine.js`, `fonts/*`. `engine.js` and `fonts/` are built, not committed.
- **When the tool changes**: a link's keys only grow (R31); a link with keys the engine does not know needs the engine built again from the newer `dev` and published. A link of another scheme, a set of dials, a link cut short: said in the pane.

## One file

`watch3d.html` holds the page, imagetracerjs and the drawing's core (the module that was `svg3d-core.mjs`) inline; only `scene.js` is apart. The artifact's page is `watch3d.html` with `scene.js` inlined in place of its tag; beside it, for links, `engine.js` and `fonts/` (A link, above).

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
