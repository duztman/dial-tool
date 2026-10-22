# Dial Show Case

A dial from a Dial Tool link shown in a whole watch (case, crown, strap or bracelet), under a light that can come
from any side and height, in two drawing styles, **Engineer** and **Miyazaki**, with its own PNG and PDF export.
Live at <https://duztman.github.io/dial-tool/show-case/>; the app is `app/` (its README says how it is built).

**Its engine is Dial Tool's own module, `web/src/watch.js`** (22 Oct 2026, build list #508): one geometry, two paints.
Dial Tool's edit mode draws the same cases flat round the dial; show mode (phase 3, #509) brings this page's
column into the app. Nothing here duplicates the app's code any more: this folder holds the page's own shell
(`app/src/main.js`, `app/src/bar.js`, `app/src/extra.css`), its build, and the three dials it opens with (`src/links.txt`,
links of the current scheme — rewrite them with `node web/links.mjs` when the scheme changes, R31).

## The two styles (both accepted, 20 Oct 2026; Miyazaki "locked", 18:16)

**Engineer** — a technical drawing. Every part outlined in dark ink (0.22 mm), each facet in one of
three tones (light · body · shade) chosen by where the light comes from, a hard block shadow pushed away from the
light, the case's shadow on the dial (a hard crescent on the light's side, longer the lower the sun), and on the
dramatic view a blurred white arc for the flare.

**Miyazaki** — no lines. Each part one base colour cut by two crescents: a dark one away from the
light and a light one toward it, drawn as even-odd cut-outs (no masks — an iPad PDF viewer drew the masks' skeletons,
18:06). Colours a step deeper (saturation × 1.25, lightness × 0.86; greys stay grey), harsher shadows, a hard shadow of
each bezel ring on the case and of the bezel wall on the dial, round crowns with plain knurling, and one outline round
the metal only (case, lugs, crown, bracelet; never leather or nylon) — the watch's parts joined into one shape with
PathKit, its edge white, fading from 65 % on the side facing the light to 0 on the far side (18:26). Two flares, one per
watch, chosen at random with a fixed seed: an arc along the case edge by the glass, or a dot (a big soft bloom, a small
bright core) (18:49).

**Shadows, both styles (Okay, 22 Oct 2026):** one rule. Every shadow is the shape that casts it, swept along the light's
vector (`sweep()`: the shape, the shape moved, and one parallelogram per edge of its outline — the Minkowski sum of a
polygon and a segment; curves flattened once and cached), black at one opacity (`SH_OP`, 0.3 scaled by the Shadows
slider), painted once as a group so overlaps never double. `silhouette(C)` lists what casts and each part's height as a
share of the case's: case 1, lugs 0.55 (they leave the case at mid-height and slope down), crown 0.5. The strap casts by
its own outline (`OUTL_S`). The case's shadow on the strap (`contact()`) is the same sweep, short, clipped to the strap.
No fixed shadow colour anywhere: black at opacity darkens whatever it falls on, so it can never be lighter than the ground.

**Leather strap (22 Oct 2026):** the tang buckle from Okay's photo (`tangBuckle()`: 20 × 16 mm on a 16 mm strap, the thin
bar the strap wraps, side bars widening toward the front, the front bar a fifth of the length, the tongue hinged on the
bar coming up through a slot in the strap 3 mm below and lying over the front bar; the frame lies under the strap's end);
one thick keeper (5.5 mm); a tiny stitch along both edges; the end rolled over the spring bar as a flat dark band at its
edge (0.6 mm, 45 % black — "the topmost point is darkest, the rest fills in flat like the sides"); holes 1.7 mm, 7 mm
apart, the ground in shadow through each and a thread of light on the far wall. The strap fills the lugs' width.

Shared by both: the diver's bezel has 60 round divots (Engineer: three divers with round scoops, two with the cut edge,
19:04); the diver's bracelet is vaulted links in hard bands, every link showing its full range of tones, an L of light on
the two edges facing the light and a reverse L of dark on the other two, its tones taken from the case's own (17:40,
18:16, 18:20); the diver's end link is one solid piece exactly the width between the lugs, its inner edge following the
case; a leather strap's end meets a round case at its middle; NATOs pass under the watch.

The cases follow published measures: dress = Patek Philippe Calatrava 5196 (37 mm; a ladies' size at 31.1), field =
a 1939 military cushion (36, 40 and 44 mm), diver = Seiko SPB143 (40.5 mm). Every drawing is at one scale (mm).

## Next

Okay's notes of 20 Oct 2026, 20:11 (for the future):

- **Flares** take a slight tint of the case metal's hue, still bright; grey metals get white flares. *(tried on the diver check, `INK`/`HB`/`POINT` env switches)*
- **The divers' top end links are wrong; the bottom ones are right** — copy the bottom to the top.
- **Miyazaki bracelets are never lit from directly right or left** (0° or 180°; Okay, 20:21: "banned there"); prefer higher or lower suns for bracelets in both styles.
- **20:21, materials check 2**: ink heights up (level 6 shown: shadow 0.21 mm, highlight 0.15 mm); Miyazaki's ink relief at higher contrast (shadow 62 %, highlight 80 %); Miyazaki's dot flare with a larger core and a softer, wider glow.
- **Bracelet ends**: nothing there now. Draw them as wrapped round a wrist: the closed bracelet's loop seen from three-quarters is a sausage, half of it below the ground; half the closed bracelet shows. Bracelets get no open (flat) views. **Parked** (20:11).
- **Ink heights**: printed ink a hair proud of the dial — a tiny inset inner shadow on the side away from the light and a highlight on the side facing it (a highlight may be a one-pixel dot); the shadow the stronger. One value to lock (levels 1–4 shown on the diver check, `INK=1..4`: shadow 0.035 mm a step, highlight 0.025).
- **Hand bevels** on in the previews (the app's Bevels: the hand's half on the light's side lighter, the other darker, 0.22 / 0.26); on the PDF set, on for about half, where it makes sense (`HB=1`).
- **Miyazaki gets a point light** for the dramatic view (`POINT=1`: a 21 mm spot pushed 15 mm toward the light).

- **Ink thicknesses** (Okay, 19:04: "You can tackle ink thicknesses next") — the Engineer drawing's line weights.
- **Dial Show Case** into Dial Tool (build list group K, #489): phase 2 done (watch.js); phase 3 is show mode in the app.
