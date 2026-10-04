# Dial Tool — glossary

What each word means **in this project**. Turkish where it's the common trade word.
If a term is used differently in conversation, ask, then update this file.
*Last updated 4 Oct 2026 (beta 2.3).*

## Watch terms

| Term | TR | Meaning here |
|---|---|---|
| **Dial** | kadran | The printed or etched plate under the hands. In the tool: the *plate*, its rings and the date aperture. |
| **Plate** | | The dial disc itself (setting `dial_d`, colour `c_plate`). |
| **Movement** | mekanizma | The mechanism behind the dial. Not chosen yet; it will fix dial size, hand lengths and date position. |
| **Hour / minute / seconds hand** | akrep / yelkovan / saniye ibresi | Each has its own shape and settings (`ha_hour`, `ha_minute`, `ha_second`). |
| **Tail** | | The part of a hand behind the pivot, in mm. |
| **Counterweight** | | A disc on a hand's tail, centred at 73 % of the tail (beta 1.0's proportion). Any hand can have one. |
| **Cap** | | The disc over the pivot (`ha_cap`, colour `c_cap`). |
| **Track** · minute track · chapter ring | | The minute marks round the edge. In the tool: a **ticks ring**; railroad rails are thin **band rings**. |
| **Tick** | | One mark of a ticks ring. A 300-division track is two ticks rings: 60 minute ticks above 300 fine ticks that skip their positions. |
| **Railroad** | | Two thin rails along a track's edges, ticks between them. In the tool: two thin bands. |
| **Marker** · index · hour marker | endeks | A mark at an hour (or any position). In the tool always **marker**, made by a **markers ring**. |
| **Numeral** | | A label at a position: Arabic, Roman, Eastern Arabic, Chinese, words, custom, or numbers counted from a start. |
| **Sector dial** | | A dial split into zones of different colour or finish. In the tool: band rings. |
| **Date window** · aperture | takvim penceresi | The hole that shows the date disc. **Aperture** = the hole itself; **frame** = the printed border around it. |
| **Beat** | | Steps per second of the seconds hand: sweep (smooth), quartz 1/s, 6/s (21,600 vph), 8/s (28,800 vph). |
| **Applied** vs **printed** | | Applied = separate metal parts fixed on the dial; printed = ink or etch. The tool draws printed elements; applied ones can be drawn as their outline. |

## Rings

| Term | Meaning |
|---|---|
| **Ring** | One entry in the ring list. A ring repeats one thing around the centre at its **positions**. Okay's word for every dial element in the list ("rings, not layers, all round"). Unlimited. |
| **Kind** | What a ring repeats: **ticks**, **markers**, **numerals** or **band**. Changeable at any time; the ring keeps all its settings. ("Type" is kept for typography.) |
| **Ring list** | The list in the Rings section. Its order is the **stacking order**: the top ring is drawn last (in front). Each row has a show checkbox and an editable name. |
| **Radius** | Ticks, markers, bands: the **outer** radius. Numerals: the radius of the text's **centre**. |
| **Positions** | Where a ring puts things: **count**, **start °** (where the first one sits), **span °**. A full turn spaces them evenly; a partial span marks both ends (scales). For bands, positions start segments that tile the span. |
| **Every · Offset · Skip those instead** | Which positions are used: every n-th, starting at the offset; "skip those instead" inverts it. Cardinals = every 3; non-cardinals = every 3, inverted. |
| **12 o'clock · first position** | A markers ring's first position can have its own style: same, double (gap), triangle, none; and scale. |
| **Give way to rings above** | A ring's two ways of reacting to the rings above it. **Skip where** drops its positions where the chosen rings above have a mark. **Knock out** cuts gaps round the chosen rings' shapes, by the **clearance**. Choices: nothing · markers above · markers & numerals above · all marks / everything above. Neither = **stack**. |
| **Clearance** | The gap a knockout leaves, and the print-free zone round the date aperture (`da_clear`). |
| **Band** | A ring of colour between its radius and radius − band width. Count 1 = a full ring; more = **sectors**; **fill %** = how much of each step a sector covers; band width ≥ radius = **pies** to the centre. Flat colour for now. |
| **Taper** (inner width ×) | A wedge's inner width as a fraction of its outer width. 0 = triangle, 1 = bar, >1 = wider inside. |
| **Round outer / inner** | Corner radius at a mark's outer or inner end; true fillets, any angle. |
| **Hollow wall** | Turns a mark or a hand into an outline of that thickness (a dot becomes a ring; a hand gets a lume opening). |
| **Placement** | How numerals sit: **upright** (always level) · **radial** (turn with the circle) · **radial, auto-flip** (never upside down) · **on path** (letters follow the circle, kerning kept). |
| **Nudge** | A per-numeral correction: radius ±, angle ±, rotate, size ×. Stored per position. |
| **Ring settings** | The scrolling list under the ring list: Kind · Colour · Radius · Positions · Give way · Look · Nudge · Type. Nudge and Type show for numerals rings only. (beta 2.0 split it into four pages.) |

## Hands

| Term | Meaning |
|---|---|
| **Shape** | baton · pencil (pointed baton) · sword · dauphine · leaf · arrow (broad-arrow head) · syringe (shaft, wider barrel, needle) · Breguet (open ring near the tip) · lollipop (disc near the tip) · file (imported). |
| **Tip length** | How long the pointed end is (pencil, sword, arrow, syringe, Breguet). |
| **Head width · ring/disc Ø · …at %** | The shape's feature: arrow head or syringe barrel width; Breguet ring or lollipop disc diameter; and where it sits, as % of the length (dauphine: where it is widest). |
| **Fit to length** | An imported hand is scaled so its tip reaches the hand's length; otherwise **Size ×**. **Width ×** stretches it sideways. |

## Tool terms

| Term | Meaning |
|---|---|
| **Section** | One page of the left panel: Dial · Rings · Hands · Date · Export. |
| **Production mask** | Export mode: every ring in solid black, no plate, no hands, aperture as an outline. |
| **Live text** | Export option: numerals and the date stay text in PDF/SVG (the fonts are needed to open them). Off by default — then text is **outlines**. |
| **Design canon** | `docs/design.md`: the rules for type, grid, colour, pictures and redrawn controls (R29). |
| **Guidebook** | `docs/Dial-Tool-guide.pdf`, the user guide (A4 landscape, 28 pages, set by the design canon), built from `docs/guide/pages/` and `style.css` by `tools/make_guide.py`. |
| **Classics** | The guide's nine example dials (field, diver, dress, pilot, California, station clock, Bauhaus, sector, gauge): settings in `tools/guide_dials.py`, also saved as presets in `docs/guide/presets/`. Drawn by eye after dial types, not measured. |
| **Mirror** | Flips the output for toner transfer. |
| **Guides** | Thin blue construction circles in the preview — the dial edge and each ring's edges; the selected ring's in orange. Switched with the **Guides** checkbox under the preview. Never exported. |
| **Backdrop** | The preview's background colour; never exported. |
| **Number control** | Label · slider · typed field · stepper, all showing one value. Typed shorthand: `1.2` set, `+0.5` add, `x0.5` multiply, `/2` divide. |
| **Settings** (`S`) | One dictionary holding every value; saved as JSON (presets, last session). Rings are a list inside it (`S["rings"]`, top first). |
| **Static geometry** | Everything that doesn't move (plate, rings, date). Rebuilt when a geometry setting changes; each ring's shapes are remembered by their settings, so editing one ring rebuilds only what depends on it. Hands are turned every frame. |
| **Imported file** | An SVG, PDF or AI file used as a marker or hand shape (R23). |

## Retired words (beta 1.0)

Kept so older notes still read.

- **Collision rule** (one ring / skip / knockout / stack) → **skip where** and **knock out**, per ring. One ring = markers' radius on the track's outer edge + ticks skip where markers.
- **Divisions** (60/120/240/300) → a ticks ring's **count**.
- **Offset** (marker from the track) → the markers ring's **radius**.
- **Rank** → ring order.
- **Show at** → every · offset · skip those instead.
- **Track, Markers, Type, Numerals sections** → the **Rings** section.

## Type terms

| Term | Meaning |
|---|---|
| **Type** | Typography. Belongs to each numerals ring (family, style, instance, language, size, tracking, axes, features). A new numerals ring copies the top one; the date window uses the top numerals ring's type. |
| **Family / style** | From macOS's font manager: a family (Helvetica Neue) and its styles (Bold, Light…). |
| **PostScript name** | The exact name of one style (`HelveticaNeue-Bold`); stored in the ring's `ps`. |
| **Variable axis** | A continuous design dimension inside a variable font (weight `wght`, width `wdth`…). Each becomes a slider. |
| **Named instance** | A preset point on a variable font's axes (e.g. "Bold Condensed"). |
| **OpenType feature** | A switchable behaviour in the font: `tnum` tabular figures, `onum` oldstyle figures, `ss01` stylistic set 1, `zero` slashed zero… Shown with the type designer's own name when the font has one. |
| **Language** | Turns on language-specific forms (`locl`), e.g. Turkish İ/ı. |
| **Tracking** | Even spacing added between letters, in 1/1000 em. |
| **Outlines** | Text converted to shapes; the font isn't needed afterwards, but the text isn't editable. |

## Code terms

| Term | Meaning |
|---|---|
| **DrawBot** | The macOS app (Python) the tool runs in. Version 3.132. |
| **vanilla** | The macOS interface library DrawBot itself is built with. Version 0.5.0 inside DrawBot. |
| **DrawView** | DrawBot's PDF viewer (Apple's `PDFView`), reused as the tool's preview — the **PDF preview**. |
| **Canvas** | The preview drawn by macOS's Core Animation (class `Canvas`, beta 2.3): one layer per scene item. Zoom and pan live in it. Not to be confused with DrawBot's own drawing area. |
| **Slot** | One shape layer of the canvas plus what it shows now (class `Slot`); slot *i* shows scene item *i*. Only changes are sent to macOS. |
| **Preview switch** | `Canvas · PDF` under the preview; setting `ui_preview` (0 canvas, 1 PDF). |
| **Scene** | The list `scene()` returns: everything to draw, bottom to top, with colours; each entry is an **item** with a **role** (plate, ring, hand, guide…). Export and both previews read it (R26). |
| **Frame clock** | A clock in step with the display's refresh (class `Clock`: a display link, or a timer on older macOS). Controls only ask for a frame; the clock draws at most once per frame (R28). **Build** = rebuilding geometry; **frame** = drawing it — both shown in the status line. |
| **Shape combining** | Union, difference, xor and overlap removal of paths (knockouts, cuts, hollow shapes). DrawBot's own is `booleanOperations`; the harness uses `skia-pathops`, and so does the tool on a Mac where it's installed (beta 2.3). The launch log says which. |
| **Private engine** | A separate `DrawBotDrawingTool` so the tool never disturbs DrawBot's own canvas. |
| **GridView** | Apple's form grid, used for every form (label · control · field · stepper columns). |
| **Binding** | The link from a control to a setting key in a scope — global, the selected ring, or the selected hand — so selecting another ring refills the controls. |
| **Probe** | `tools/dial_probe.py`, a self-reporting test of the interface foundation, run on the Mac. |
| **Harness** | `tools/test_harness.py`, renders geometry off-Mac (drawbot-skia). |
| **Smoke test** | `tools/ui_smoke.py`, runs the whole interface off-Mac on **stand-ins** that accept only what vanilla 0.5.0 accepts. |
