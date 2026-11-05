# The rounds — 4–5 Nov 2026

One line a round: what was tried, what Okay said, what failed and why. The commits are on `try/relight` in this order.

| # | Tried | Okay | What failed, why |
|---|---|---|---|
| 1 (relight) | The dial and a diver as a **height field** lit by one shader: normals from slope, shadows by marching toward the sun, Photo · Miyazaki · Engineer as ramps (`relight.html`) | "underwhelming"; Miyazaki and Engineer stay SVG; "better 3D shapes of everything?" | A height field has no walls: no flank, no chamfer, no reflection; the room is a two-tone fake. Kept as a record |
| 1 (3D) | three.js: a **sheet** of lathe profiles (band, rehaut, bezel, insert, crystal), extruded lugs, the dial as a texture, hands pulled up, RoomEnvironment | — | three's room has a ceiling panel straight over the watch → a white disc in the crystal. Replaced by a hand-built studio |
| 2 | Studio · Sun light modes; drooping two-skin lugs; insert markings as extruded ticks; knurled crown | "lugs look weird. You might check references" | Lugs bent after extrusion: the cap folded; the droop was invented, not from a photo |
| 3 | Lugs as a swept five-point section after the SPB143 (from memory); rehaut taller | "lugs are worse now" | Still from memory; the flare's origin was wrong (stations started inside the body) |
| 4 | A three-link bracelet on a wrist arc, an end link cut by the case circle | "strap is next, try a bracelet" → "colder to target" | Links as extruded slabs with big bevels: toy-like; arc invisible from above |
| 5 | The reference's **three-quarter view**, one case body (circle + lugs as one outline), flat sapphire, leather ground, bracelet laid on the table, Steel · Gold | "good step" — "I meant lighting, details, textures, overall reality. View back to on top" | The one-outline body is an extrusion again (folds later); the 28° turn was wrong (12 must sit upper left) |
| 6 | **Applied markers** at ink heights, sunburst plate, brushed anisotropy, coin-edge teeth (a ripple), insert as a picture (numerals feet-to-centre, lower half turned), contact shadow, crown stem, top view default | "ver well, I need a real looking bracelet" | Canvas text drawn under a scale transform rasterised tiny — draw text in pixels then transform |
| 7 | Oyster-kind bracelet: round-ended links, centre half a pitch off, end link with a tongue, link ends = half-cylinders | "links don't seem connected, not symmetrical with end links" | Half-cylinder ends read as rollers; the 6 o'clock end link wasn't mirrored (ran into the case) |
| 8 | Links as **barrels** chained **pin to pin**; a light tent; black flag; **GTAO** | "getting better already" | Found by a **side view**: the tilt's sign was wrong since round 5 (scales, leather showing through). A barrel is a stadium side-profile, not a half-cylinder end |
| 9 | Thickness taper, pillow tops, convex outer faces, pin heads, the case flank's belly | "clock the thicknesses, tapers, bulges" → done | The end link sat half a thickness low (group offset) |
| 10 | The **joint**: bracelet at the spring bar's height (1.6 in from the tips, lug mid-height), end link to just past the tips, drilled holes, a flat polished facet on the outer link edge | "lugs interact with bracelet? spring bar? end links follow the geometry?" → this | — |
| 11 | Lug taper laws (fall + thin), spring bar follows the tips, **pitch taper**, triangular knurling, a **Side** view | "side view looks good but why does the top glitch?" | The extrusion's cap: one polygon for case + lugs, bent → creases |
| 12 | The ring a revolve, **each lug and the end link a sweep** following the laws (`sweep()` born) | his markups: "solid block, not clipped walls; actual holes; follow my drawings" | Right construction; lug tips square, lug root hairline |
| 13 | Lug top and bottom laws meeting at the hole in a **half-round**, bored holes | "this came out worse" | Wrong reading of the tip: the photos show a flat chamfered end face, the hole a dot. Not published |
| 14 | **Rebuilt round the rule**: `CASES` (diver, cushion) and `BRACELETS` (oyster, barn, jubilee) as data; band = flank section round the outline; lugs slabs leaving the band, chamfer to the tip, flat ends; end link a sweep; links by section (bean/barn/slab/barrel); prismatic teeth; fluted domed crown; UVs on sweeps | "that went well but enough for now" | Open: brushed sweeps still blow out white in the photo view (anisotropy on the new UVs — check the tangent direction); the teeth read tall; the end link too bright; not published |

## Things learnt about the work itself

- Read the photograph before building; "from memory" produced rounds 2, 3 and 13. A crop beside the reference, same angle, is the test.
- A **side view** finds what a top view hides (round 8's sign bug, round 11's heights). Shoot it before judging any height.
- An **extrusion** is for parts that don't bend; anything that tapers or bends is a **sweep** with the taper in its stations.
- The order that worked: shape from the photo → side-view check → materials → light. Materials first wastes the round.
- Okay reads crops on an iPad: ship crops at 2×, one change per crop, the value used stated.
