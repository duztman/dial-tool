# Dial Tool — glossary

What each word means **in this project**. Turkish where it's the common trade word.
If a term is used differently in conversation, ask, then update this file.
*Last updated 14 Oct 2026, evening (beta 4.37: centre hole and disc hand built; the eye). Before, 14 Oct 2026 (centre hole, disc hand: planned, build list #164, #165). Before, 13 Oct 2026, night (beta 4.35: tab reworded, look-check, the box rule, scale). Before (beta 4.13: tabs, Export's order; beta 4.12: guides per ring, added guides, window cards as tabs; beta 4.11: ring drawer, a row's order; beta 4.8: window shape, turn, size button; beta 4.7: ring line, value button, gallery, card switch; Section, Ring list and Bar brought up to the web version). Before: 12 Oct 2026 (web version, beta 4.6: sector colours, scale everything).*

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
| **Centre hole** | | The hole in the plate the hand pipes pass through (`dial_hole`, Ø in mm, 2.7 to start; 0 = none; beta 4.37). Shown when the hands are hidden, under the hands otherwise; a production mask always has its cut line. Not the holes in the hands themselves. |
| **Disc hand** | | A hand shape (`disc`, beta 4.37): a disc on the pivot (`disc_d`) carrying one marker drawn with a markers ring's shapes (`mark`: bar · wedge · dot, `mark_len`, `mark_w`), its outer end at the hand's Length; the marker is cut out of the disc where it lies on it. No blade. After the mystery dials, where a clear disc carries a dot or an arrow. |
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
| **Ring list** | The list in the Rings section. Its order is the **stacking order**: the top ring is drawn last (in front). Each row (web version): an **eye** (show or hide the ring), a grip to drag it, its name, the **rename box** on the selected ring, its **ring summary** (kind · colour · size · radius). (`archive/drawbot/dial.py`: a show checkbox and an editable name.) |
| **Radius** | Ticks, markers, bands: the **outer** radius. Numerals: the radius of the numeral's **anchor** — its centre (the start), its baseline or its top. |
| **Anchor** | The point of a numeral that sits on its ring's radius (ring key `anchor`, web version, 13 Oct 2026): **centre** (the middle of its outlines) · **baseline** (the middle of the line it stands on) · **ascender** (the middle of its top; the top of the ring's tallest label, so all hang from one line). Chosen in the small menu beside the radius' label (in the radius button's pop-up), which then reads Centre / Baseline / Ascender radius. |
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
| **Rings pane** | The pinned pane on top of Rings (web version, 13 Oct 2026): its heading line with the list's tools (a plus that opens the four kinds; move up · move down · duplicate · delete), the ring list, the **ring line**. Folded it is one line: *Rings: <name>* and a summary. |
| **Ring drawer** | The framed box inside the ring list, right under the selected ring's row, holding that ring's main controls as buttons without words: four kinds · its colour · its **size** (how big one of its things is: a mark's length, a dot's Ø, a numeral's size, a band's width; Okay's "scale") · its radius. Each of the last three stands under its value in the row above. Its outer line has the selected ring's guide colour, its inner line the row's ground. Named 13 Oct 2026; "ring line" before, and `ringline` / `lineholder` in the code. |
| **Tag** | The small label under a wordless button while the pointer is on it ("Ticks"); one for the whole tool, laid over everything. A value button's tag says name and value and is as wide as the pop-up it grows into. |
| **Pixel font** | Silkscreen (SIL OFL), packed into the page: the tool's own tiny numbers inside small drawings, always at 8 (now only 12 · 3 · 6 · 9 in the numerals picture; kept for later). Not one of the dial's fonts. |
| **Value button** | A number as a small round drawing, without the number (a ring's radius: a circle with its radius drawn; its size: a small circle growing into a large one, whole inside the button since beta 4.18); the value is read in the ring's row above it and in its tag. Click: its tag grows downwards into the pop-up (the number's name, field, − +), ready to type in. Press and move: the value changes. R15's exception. |
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
| **Section** | One page of the left panel, chosen by its tab: Dial · Rings · Hands · Windows · Export. The fourth was *Date* until 11 Oct 2026; its key and number are still Date / 3 (R8, R9). |
| **Pane** | A named part of a section, opened by a thick line (web version, beta 4.0; called a *group* in beta 3.0). Its eye folds it. The Dial section's panes: **Dial** (diameter, plate, background) and **Page** (margin, backdrop). |
| **Sector colour** | A band's sector with a colour of its own (ring key `cs`). Without one, a sector has the ring's colour. |
| **Scale everything** | The tick under Diameter: a change of diameter multiplies every measure on the dial (not the page margin). |
| **Unit box** | The box at the panel's top right: the unit lengths are shown and typed in (mm, points, inches, lignes). Settings stay in mm. **Ligne**: the watchmakers' unit for movement sizes, 2.2558 mm. |
| **Reach** | The unseen frame round a small control that also takes a finger's press (web version, touch only). |
| **Heading selector** | A pane's main selector, standing on its heading line with no name of its own (Labels, Position). |
| **Backdrop switch** | The button at the preview's bottom left: the backdrop's colour as a chip; it opens the colour pop-out. |
| **Hand tabs** | Hour · Minute · Seconds, the second pinned line of Hands, under All hands: they choose the hand the panes below are about. |
| **Window cards** | The four cards on top of Windows, at 12 · 3 · 6 · 9, starting on the second column: each a small dial with the window in its place, filled when that window is shown. They are tabs: they choose the window the panes below are about. A window is shown by *Show this window* on its heading line. |
| **Gallery** | The last pane of Export: dials to open and take apart — six drawn after documents in the research atlas (`web/gallery.mjs`), then the five first **examples** (five of the guide's classics, `web/examples.mjs`; a pane of their own on top of Export until beta 4.13). |
| **Tab** | A choice of what the panes below are about, drawn as a tab: touching its neighbours, standing on the thick line under it, each cutting its own two top corners one unit deep so a sharp V stands over each joint (beta 4.35; two triangles over the joint before), the first and last corner square (beta 4.18; round corners before), the chosen one black, its line winning where tabs meet. The hand tabs and the window cards. Not the five section **tabs** on top of the panel, which keep their own look. |
| **Undo step** | The dial as it was before a change; taken when the dial has stood still for a moment. ⌘Z goes back one, ⇧⌘Z forward. |
| **Mark · bio** | Okay's logo, drawn as a sign, in the panel's first column left of the title; a press opens the **bio**: the tool, its maker, its source and the open-source work it stands on (beta 4.38.8). While the bio is open the mark is light on a night disc (beta 4.38.10). The bio ends with a contact link (beta 4.38.11). |
| **Eye switch** | The square switch at the preview's bottom right (beside Backdrop until 4.38.11): an iris with thin rays running out to the box, the eye's outline knocked out of them. A preview: it turns on and off and does nothing yet (beta 4.38.8). Okay also calls it the *preview icon*. |
| **Opener** | The dial the tool opens with when the address has no dial and nothing was kept from the last session: Okay's watch (`web/src/opener.js`, beta 4.38.12). Not the starting values: "Defaults" gives those. |
| **Bottom bar** | The dark strip along the bottom of the window, in two parts: time (play, the speed slider, the time with its AM · PM window, Now, the day slider) · view (how to zoom, − +, Fit). Three parts until 14 Oct 2026, when the panel's square and the status line left it (#190, try/shadows). Called "the bar" in notes before 13 Oct 2026. |
| **Speed slider** | The bottom bar's speed: one slider from 1× to 720× on a log scale (0.5× until 15 Oct 2026). Its ends are black rings named 1X and 720X; the speed rides over the thumb in white ("12X"). A ball at 1× with snapping, 14–15 Oct 2026; humps at 1 · 6 · 60 · 720 before that; three buttons (1× · 60× · 720×) before #190. |
| **Pinned line** | One line of its own, outside the panes and always in view (Hands: All hands · Show hands · Motion; the hand tabs). Called "bar" from 12 Oct until Okay named the two on 13 Oct 2026; the row option in `app.js` is still `bar`. |
| **Half line** | The hairline between a row and a **nested row**: it starts at the controls' column (the third of six) and ends at the right edge. Okay, 13 Oct 2026 (beta 4.17). |
| **Sticker** | In the font sheet: a small box in the pixel font saying one thing a family has (*weight*, *italic*, *4 styles*). A colour for each kind (weight and bold · italic · width · optical · other axes · styles), round corners; the legend under the list says which is which (beta 4.29; bold and regular in 4.27). In *Variable axes* an axis's sticker is a button in the tool's own colours. |
| **Detail box** | In a hand's pane, at the left of its rows (beta 4.25; under the *Shape* label in 4.23): the chosen hand itself, large, with all its settings, its centre marked. On a phone it lies over the rows. A picture **tile** shows a shape in general; the detail box shows this hand. |
| **Number box** | In a row beside the detail box: a number with a tiny plus over a tiny minus joined to it. A press on the number and it grows over the slider into a large minus · number · plus (beta 4.25). Elsewhere a number has a field and a stepper (R15). |
| **Ink centre** | Where a short label in a box is centred (beta 4.37.1): the middle of the rectangle its ink covers, measured as drawn (`web/src/ink.js`). The boxes that get it are listed in `INKED`. Not the label's advance width, not the font's line box. |
| **Look-check** | `web/test/same.mjs`: the computed style of every element of the window in 447 states (three screens, each section, the pop-outs, the pointer on each kind of control), saved before a change to the stylesheet and compared after it. It prints every difference; none means the look is the same, to the pixel. Four minutes a run. Beta 4.35. |
| **Box rule** | A framed thing in the panel (a ring row, the font box) stands between the pane's lines, from where the labels start to the pane's right line; inside, `--frame-pad` keeps what is in it off the frame, and the labels take what is left, `--btn-pad` in. Beta 4.35, build list #125; inside the lines since beta 4.35.13–14 (before, it stood `--frame-out`, 8 px, past the lines). |
| **Scale** (of spaces) | Every space in the stylesheet is a step of the unit (5.5): `--u1` half a unit, `--u2` one, `--u3` one and a half, `--u4` two, `--u6` three, `--u8` four. Beta 4.35. Not the *scale* button of the ring drawer (size). |
| **Side row** | A row beside the detail box, in the last four columns: label · slider · number box, on one line (`side` in `app.js`). |
| **Print** (pane) | In Export: what only the printed or etched dial needs (mono print mask, mirrored). Named *For production* until beta 4.19. Nothing that is drawn on the dial belongs here (Okay, 13 Oct 2026). |
| **Nested row** | A row that belongs to the row above it: a question about it (`nest`), its settings (`tie`), or a note about it (`under`). It starts on the controls' column and has a **half line** over it. |
| **Ring summary** | What a ring's row says after its name, in the drawer's order: how many and of what kind (`60 ticks`) · a small square of its colour · its size · its radius — the last two as bare numbers in the mono face, in the unit box's unit. |
| **Nested question** | A tick or menu that asks about the row above it; it starts on the controls' column, not at the left. |
| **Row line** | The hairline before and after every row: white on the scrolling grey, that grey on paper. |
| **Logo** | Planned (build list #72): an SVG placed on the dial with the mouse; it is a ring in the ring list. Not the *background* (a picture on the plate, not built). |
| **Toggle column** | The narrow column at the far left of the panel (web version). It holds only the panes' eyes (open or folded). A ring's eye (shown or hidden on the dial) is inside its row since 13 Oct 2026. |
| **Margin** | The panel's side space, 24, the same left and right (web version, beta 4.2). Lines start and end on it; so do the eyes. |
| **Day slider · step** | The bottom bar's slider over twelve hours. Its steps are the twelve hours and 10:10: a click goes exactly to one. It stays in the half of the day that is showing; **AM · PM**, the time's own small window (light in the morning, dark in the afternoon; inside the time's box until #190), turns the half over. |
| **Eye** | The sign in the toggle column. Open = showing; closed, with lashes = put away. On a ring row it only shows or hides that ring; it doesn't select it (beta 4.37, #183). |
| **Rename box** | A text cursor in a rounded box, right beside the selected ring's name; left out when the row is too full. A click on it, or on the selected ring's name, renames the ring (beta 4.10; until then the box was the only way). |
| **Picture tile** | One choice shown as a small drawing with its name under it (ring kind, mark shape, hand shape, what a window shows…). |
| **Colour pop-out** | What a swatch opens, at its right (web version, beta 4.5; the *colour picker* of 4.0–4.4): one for the whole tool. *On this dial* · *Palette* · the field and the hues · one line of RGB / CMYK / HEX with COPY. Its head drags it; its square makes it twice the size. |
| **Colour pill** | How a colour shows in the panel: one small button holding a swatch and the hex in monospace. It opens the pop-out; nothing is typed in it. |
| **Opacity** | How see-through a ring's colour is (the colour's fourth number). Rings and band sectors only. |
| **Palette** | The pop-out's second row: ten colours to start, plus the ones added with **+**. Kept by the browser, not by the dial or its link. |
| **Production mask** | Export mode: every ring in solid black, no plate, no hands, aperture as an outline. |
| **Live text** | Export option: numerals and the date stay text in PDF/SVG (the fonts are needed to open them). Off by default — then text is **outlines**. |
| **Design canon** | `docs/design.md`: the rules for type, grid, colour, pictures and redrawn controls (R29). |
| **Guidebook** | `docs/Dial-Tool-guide.pdf`, the user guide (A4 landscape, 28 pages, set by the design canon), built from `docs/guide/pages/` and `style.css` by `tools/make_guide.py`. |
| **Classics** | The guide's nine example dials (field, diver, dress, pilot, California, station clock, Bauhaus, sector, gauge): settings in `tools/guide_dials.py`, also saved as presets in `docs/guide/presets/`. Drawn by eye after dial types, not measured. |
| **Mirror** | Flips the output for toner transfer. |
| **Guides** | Thin construction lines in the preview, never exported. The dial's two **kinds** — centre lines · window radii (the dial edge was a third until 15 Oct 2026) — each have one of the eight **guide colours** (six neons, a dark, a light) or **None**. **A ring's guide** (its edges) has that ring's own colour: one by its place in the list to start with, so neighbours differ; *Rings: All · Selected · None* says which rings show theirs. **Added guides**: a line (a diameter at an angle), a crosshair (a point at an angle and a radius), a circle (a radius). Switched with the **Guides switch** at the preview's top right; its arrow drops the **guide list**. (Until beta 4.12: five kinds, with *Ring edges* and *Selected ring* as kinds of one colour each.) |
| **Backdrop** | The preview's background colour; never exported. |
| **Number control** | Label · slider · typed field · stepper, all showing one value. Typed shorthand: `1.2` set, `+0.5` add, `x0.5` multiply, `/2` divide. |
| **Settings** (`S`) | One dictionary holding every value; saved as JSON (presets, last session). Rings are a list inside it (`S["rings"]`, top first). |
| **Static geometry** | Everything that doesn't move (plate, rings, date). Rebuilt when a geometry setting changes; each ring's shapes are remembered by their settings, so editing one ring rebuilds only what depends on it. Hands are turned every frame. |
| **Imported file** | An SVG, PDF or AI file used as a marker or hand shape (R23). |
| **Icon** | A small SVG drawing in the window (a section's sign, a tool, a picture tile). Drawn in the icon block at the top of `web/src/app.js`, by R33 and the design canon §9. Not the stylesheet's boxes around them. |
| **Icon grid** | The rules every icon is drawn by (14 Oct 2026): one unit = one point, four line widths, straight lines on quarter points. |
| **LINE · SLANT · CURVE · DENSE** | The four icon line widths, one look (design canon §9): straight 1.5 · slanted 1.5625 · round 1.625 · crowded 1.25. |
| **Quarter point** | A coordinate ending in .25 or .75. A 1.5 line centred there covers three whole screen dots on a 2× screen. |
| **Pictured width** | A width in an icon that pictures a thing's own width (a ring kind's ticks, marks, band), not a line; kept as drawn. |
| **Rim** | The ring that holds a sign: a section tab's, a window card's, a round tool's. An icon line like any other. |
| **Look** (of a line) | How heavy a line appears, read by `web/icons/look.py` against a straight `LINE`. |

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
| **Type** | Typography. Belongs to each numerals ring (family, style, instance, language, size, tracking, axes, features). A new numerals ring copies the top one; the date window uses the top numerals ring's type, unless it has a font of its own (beta 4.8). |
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
| **Web version** | The tool in a browser (`web/`, beta 3.0): `web/dial-tool.html`, one file. Same settings and scene as `archive/drawbot/dial.py` (R30). |
| **PathKit** | Skia's shape combining, compiled for the browser; the web version's **shape combining**. The same engine as `skia-pathops`. |
| **HarfBuzz** | The web version's text engine: turns text + font + features + axes + language into positioned glyph outlines. Does what DrawBot's `FormattedString` (CoreText) does in `archive/drawbot/dial.py`. |
| **Stand-in font** | Inter, packed inside the web version's file: draws numerals whose font isn't loaded yet. The log names the font it replaces. |
| **Installed fonts** | The web version's button that lists the computer's fonts (Chrome, Edge). Other browsers: add font files. |
| **Link** (a dial's) | The web version's address with the dial after `#`: scheme number, a dot, the packed settings. Carries the dial, not the window's state (section, selected ring) and not font files. R31. |
| **Window shape** | The hole's outline, apart from what the window shows (beta 4.8): rectangle · circle · polygon · arch (the moon's) · arc (a piece of a ring, for a day window at 12). **Turned**: the hole stands along its radius instead of level (only off the quarters). |
| **Window** | A hole in the plate with something showing through (web version: up to four). **Kind**: date · day · am · pm (follows the time shown since beta 4.7) · moon phase. Window 1 is the **date window** of `archive/drawbot/dial.py`. The section's tab says Windows; its key and number stay Date / 3. |
| **Font list** | The web version's own twenty open-licence families (`web/fonts/`). |
| **Font sheet** | The sheet that opens from the font in Type: every font by its numerals, a search, and **Add fonts** (Google link or name, link to a font file, font file, installed fonts). |
| **Pointer label** | The name shown beside the pointer for the piece under it; the piece is outlined. |
| **Round ends** | A hand's setting `round` (web version): the corner radius of its flat ends. Marks get round ends from *Round outer* / *Round inner*. Okay's "round caps". |
| **Probe** | `archive/drawbot/tools/dial_probe.py`, a self-reporting test of the interface foundation, run on the Mac. |
| **Harness** | `archive/drawbot/tools/test_harness.py`, renders geometry off-Mac (drawbot-skia). |
| **Smoke test** | `archive/drawbot/tools/ui_smoke.py`, runs the whole interface off-Mac on **stand-ins** that accept only what vanilla 0.5.0 accepts. |
