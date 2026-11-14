# The case in 2D — how a bezel and a rehaut are drawn flat

*14 Nov 2026. Okay, 17:26: "still the bezel is not looking realistic enough. are there other ways of 3 shade-ifying the bezel an rehaut? the bezels outside line and the rehaut depth from bezel and crystal is a little weird. can't point my finger on the why, but I'm sure others have tried and perfected this. could we give this a web search, 2d representations of these kinds of geometric 3d shapes? and can you implement your findings here?"*

Read for: #595, `geometry.js` `lit_band` and `case_grounds`, show mode's case. Tags as the index says: **D** stated by the source · **I** inferred here from it.

## What was read

| Source | What it is | What it says |
|---|---|---|
| Gooch, Gooch, Shirley, Cohen, *A Non-Photorealistic Lighting Model for Automatic Technical Illustration* (SIGGRAPH 1998), <https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/gooch98.pdf> | The conventions of hand-drawn technical illustration, turned into a rule | **D** Edges are drawn as lines and carry most of the shape; one light gives white highlights; cast shadows are left out; shading stays in a narrow middle range, far from black and white. **D** Metal is shaded "as if very anisotropic": alternating light and dark bands, twenty of them along the part's axis, each a random darkness between 0 and 0.5, the one nearest the light white, blended between centres — used even for smooth metal, so the look is a convention, not realism. |
| The same authors' course notes, <https://users.cs.northwestern.edu/~ago820/NPRcourse1/node5.html> and `node6.html` | Line conventions, after Judy Martin's *Technical Illustration* (1989) | **D** Three line habits: one weight throughout; a heavier line for outer edges and thinner ones inside (the usual); weight varied along a line. **D** Where a drawing is shaded, some inner lines are drawn white, as a highlight: black and white lines together say where the light is. |
| Nikola Lazarević, *Designing A Realistic Chronograph Watch In Sketch*, Smashing Magazine, 2017, <https://www.smashingmagazine.com/2017/10/realistic-chronograph-watch-sketch> | A top-view vector watch (Heuer Autavia), every style written out | **D** A raised ring (the outer bezel) is a many-stop gradient plus a PAIR of offset inner shadows — white 50 % moved (1, 1), black 10 % moved (−1, −1) — "to look slightly raised", and a dark outer shadow (black 50 %, blur 4) where it sits on what is under it. **D** The inner bezel is an angular gradient of eight near-equal stops with a 1 px outside border. **D** What lies under the bezel (the dial's rings) is a flat fill, a light 4 px border and an inner shadow all round (black 50 %, blur 6–10). |
| *Draw an Analog Stopwatch with Illustrator*, WebFX, <https://webfx.com/blog/web-design/draw-an-analog-stopwatch-with-illustrator> | A top-view metal casing in vectors | **D** A ring's edge highlight is made by sliding a copy of the shape a pixel to one side: what shows past it is the highlight. |
| Armengaud, *The Practical Draughtsman's Book of Industrial Design* (1855), the plate on a ring's line of shade, <https://digi.ub.uni-heidelberg.de/diglit/armengaud1855/0100> | The draughtsman's construction of the shade on a ring in plan | **D** The line of shade on a ring is found from tangent points: it is a curve that runs out to nothing, never a cut across the ring. Read in the search result's text only; the plate itself was not seen. |

## What it means for the drawing

1. **A ring's light tapers; it is never cut along a radius. I** Every source that shades a ring does it by sliding a shape — an offset inner shadow, a copy moved a pixel, a line of shade from tangents. The shape left over is a crescent. Sectors in flat tones cut the ring along radii, which no ring does: this is what looked wrong in show mode's first three tones.
2. **Raised and sunk are the same pair, turned round. D** (Smashing) A raised ring: light toward the light, dark away. A recess: dark toward the light (the lip's shadow), light away.
3. **A recess is dark all round where it meets what stands over it. D** (Smashing: the inner shadow with no offset.) So the rehaut has a fine dark line under the bezel's lip on every side, besides the lip's cast shadow on the sun's side.
4. **Few tones, and the edges do the work. D** (Gooch.) Three tones of the metal are enough; the fine lines at a face's edges matter more than the range of the shading.
5. **Not built: metal's bands. D** (Gooch; the angular gradients of the vector drawings.) Brushed or polished metal is drawn with several light and dark bands round the ring, the lightest toward the light. It is a finish, not an angle: it belongs with the Materials and finishing the brief notes for later, and would show on a flat bezel top where the angle rule shows almost nothing.
6. **Not built: a heavier outer line. D** (Martin, by Gooch.) The outer edge of a part takes the heavier line. In show mode the published case's own ring already stands round the tool's bezel; whether the bezel wants a line of its own there is Okay's to see.

## How it is built

`geometry.js` `lit_band`: in show mode a face is its ring in its own colour and two crescents in the light and the dark tone of the case's metal (`watch.js` `tones_of`). A crescent is the ring less its own outer circle slid along the light; it is as deep as `relief()` makes that side lighter or darker, so the chamfer's fill it, a nearly flat top's are slivers, and the part's Relief scales them. The edit view keeps its smooth sectors (Okay, 14 Nov 2026: "the preview look is good").

## Not reached

- **Pictures.** No reference picture was looked at: this session had no browser on Okay's Mac, and its picture search shows results to him, not to the agent. The findings are from the sources' words and written values. To check them against photographs, open the sources above in a browser and compare a steel bezel's top, its chamfer and the rehaut under it with show mode at the same light.
- **Behance and Dribbble case studies of vector watches** say that gradients and shadows are used and give no values: nothing to build from.
