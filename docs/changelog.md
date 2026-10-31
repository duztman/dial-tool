# Dial Tool — changelog

## v1.1.7 beta · 31 Oct 2026 — a stroke round bands

Okay, 31 Oct 2026, 04:05: "Add them to bands as well".

- A band ring has the Stroke pane too (after its Sector colours): On, Width · Colour · Join · Side; the stroke grown round the band's sectors, in its own colour and ink.

## v1.1.6 beta · 31 Oct 2026 — a stroke round ticks and markers

Okay, 31 Oct 2026, 03:31: "Also indices and markers get outlines"; 03:57, on the drawing: "Place is good. Move up color after width. Implement".

- A ticks or markers ring has a **Stroke** pane after Shapes: On on its heading line (ticked, the pane opens), then Width · Colour · Join · Side. The marks' stroke is drawn as the letters' is — a grown outline of the ring's merged marks, in its own colour, an ink on show mode's Inks list and its own film.
- The font box's Stroke part takes the same order: Width · Colour · Join · Side.

## v1.1.5 beta · 31 Oct 2026 — strokes without spikes; a stroke's colour is an ink

Okay, 31 Oct 2026, 03:20, on Montserrat's figures with a Miter stroke: "Is there a way to fix this?"; 03:31: "it has color, will go into a ink group in showcase"; 03:33: "Yes to all".

- A stroke is grown round each figure as one outline (`stroke_outline` merges first). A font that draws a figure from overlapping pieces (Montserrat's 5) no longer throws spikes where the pieces cross: measured, the stroke reaches 1.32 widths beyond the letters at most, where the spikes reached 2.9 (`test/frames.mjs`).
- A ring's stroke colour is an ink: on show mode's Inks list as "… stroke" under its colour, recoloured there, split to A or B (`stroke_b`, show mode's like `ink_b`, not in the link), its own film when the export is one ink per film, its height from its ink.

## v1.1.4 beta · 31 Oct 2026 — the cog thinner, in the Gallery pill's grey

Okay, 31 Oct 2026, 03:20: "cog, thinner line, same color as gallery, no opacity".

- The cog's line 1.25 → 1 (two screen dots; listed in `icons/check.mjs` as his width). At rest it is the Gallery pill's grey (35 % ink), mixed with the paper, not see-through.

## v1.1.3 beta · 31 Oct 2026 — Settings in the mm box's place; the bar's time squeezed

Okay, 31 Oct 2026, 02:29: "Ok now build the settings and the new clock" — both drawn first on the real page (`test/sketch.mjs`) and approved round by round; 02:32: "Do not change its system, it worked".

- **Settings** (#554): a cog at the header's top right where the unit box was (20, `DENSE`, never boxed; ink under the pointer, filled ink when open). Its box: Unit (mm · pt · in · lig · thou — the same `ui_unit`, conversions and typed units) and Colours (`ui_colour_as`: the mode the colour pop-out opens in, HEX to start). Design canon §6 *The Settings box*. The unit box, its menu and its sizing code are gone.
- **The bar's time** (#553): figures with a split hairline for each colon, 4 px (`--clock-gap`) from the figures' ink either side; the box padded `--u2`; the typing field over it, shown when typed in. AM · PM as narrow as its word at `--t-m` 13. The speed slider 81 → 113.
- **ink.js**: a label's line box is laid as Chromium does, the face's ascent and descent rounded to whole pixels, and the text measured as drawn (text-transform): AM and NOW sit on the time's ink middle within a pixel (were 1.5 and 1.25 over).
- `test/sketch.mjs`: sketch rounds on the real page — a tune file over the app, before and tuned with pixel rulers, `ink()` read off the screen, states (closed · hover · open).

## v1.1.2 beta · 31 Oct 2026 — the Stroke part on the column edge, the joins as pictures alone

Okay, 31 Oct 2026, 00:55: "The column left edge, everything within is flush left to line. Including on"; 01:00: "Join BUTTONS: NO LABEL, LARGER icon"; 01:09: "Bingo on stroke".

- The Stroke head line and its rows stand on the font box's own columns (`--font-label`, then the rest): On, the join tiles, the Side pill and the Colour pill all begin where the sliders start.
- Join: three square tiles (32) with the picture alone, drawn at 24 (`PICS.join`, an L-shaped band 7 wide); the name is the tile's title. A `pick` row can be `bare`.

## v1.1.1 beta · 31 Oct 2026 — the Stroke part as drawn: On on its head line, the joins as tiles, rules between the rows

Okay, 31 Oct 2026, 00:44, his marks on v1.1: "Change corner pills into buttons that I designed on the side. And the sections need hr rules like above. And also turning stroke on expands panel. Opening eye just expands panel without turning it on."

- **On** is a tick on the Stroke head's line; ticked, the part opens. The eye opens the part without turning the stroke on; Width · Join · Side · Colour show whenever the part is open.
- **Join** is three tiles (`PICS.join`): an L-shaped band each, its outer corner sharp, round or cut — Miter · Round · Bevel.
- A hairline over each of the part's rows, as between the box's own lines.
- A box part can carry a control on its head line (`box_part`'s `aside`) and be opened from outside (`open`).

## v1.1 beta · 31 Oct 2026 — a stroke round a ring's letters (#551)

Okay, 30 Oct 2026, 21:58: "I'd like to add strokes to shapes, numbers as well, but good strokes, uniform. And round/sharp/miter options"; 31 Oct, 00:25: "add strokes to Type, under OpenType features. Stroke on off, miter round sharp, inside middle outside of vector, and its color"; in question mode: Miter · Round · Bevel; the colour "Only in the Type pane".

- **Stroke** is a part of a ring's font box, under OpenType features, folded to start: its switch, and with it on, Width (mm), Join (Miter · Round · Bevel), Side (Inside · Middle · Outside) and Colour. Numerals and text rings.
- **How it is drawn**: never a stroke in a file (R4) — a grown outline of the ring's final shape (`stroke_outline` in `geometry.js`: outside = grown − shape, inside = shape − shrunk, middle = half out, half in), through the stroker at scale with the join asked, as a scene item of its own ("ring stroke": a layer in the PDF, an id in the SVG, a shape in the Wear OS face, a mask of its own ink in production), drawn over the letters. Keys `stroke`, `stroke_w`, `stroke_join`, `stroke_side`, `stroke_c` on the ring (R7, R8, R9), appended to the link's table.
- A toggle's name turns white only on the dark shenanigans box: the rule that did it everywhere made the Stroke switch's name vanish on the panel.
- `test/frames.mjs` checks the outline's sides and joins on a 2 × 1 box; the window test the part, its rows and the scene.
- Not in this step: strokes on markers, ticks, bands and a window's text; show mode's Inks don't count a stroke (Okay: "Only in the Type pane").

## v1.0.7 beta · 31 Oct 2026 — window frames even all round: the stroker at scale (#550)

Okay, 26 Oct 2026: "Check hexagon and moon shape's outlines, they are not uniform"; 30 Oct, 23:53: "1-2 together" (fix the stroker; the polygon through it).

- **Why the frames were uneven**: PathKit's stroker approximates a curve to a tolerance in path units, and the tool's paths are in millimetres, so a 2.6 mm circle was stroked as coarsely as a 2.6 px one — measured, grown by 0.3 it bulged 21 % (the "four-petal blob" of #168, which had every shape but the arch grown by hand instead). `expandStroke` now strokes a thousand times larger and scales back: 4 µm off (`test/crops/stroke-scale.mjs` measured 1 · 10 · 100 · 1000).
- **The polygon** grows by stroking again, like the arch, so its corner roundings are concentric with the hole's: frame 0.300–0.300 mm all round (its corners were a quarter thick). The arch's frame 0.300–0.317 (was 0.197–0.46). Circles, rectangles, arcs, pairs and halves grow by their measures as before.
- Everything else grown by `offset()` gains the same accuracy: a hollow hand's wall, a ring grown for its clearance.
- `test/frames.mjs`, in the full check: each frame's outer outline against its hole, and the stroked circle's radius. The parity check with `dial.py` stays within its thresholds.

## v1.0.6 beta · 30 Oct 2026 — the bar's time and AM · PM in Dial Mono; the hours' names over the ruler, its marks taller

Okay, 30 Oct 2026, 18:31: "While you're at it, make the time and ampm mono too"; 18:37, on the crop: "The screenshot looks gorgeous. Now for the time ruler, put the numbers up top"; 18:38: "I meant taller marks as wider vertically".

- The time field and AM · PM are set in `--mono` (Dial Mono), weight 400, at the same 20 px: `--time-figure` and `--time-colon` are a mono's 0.6 em, AM · PM's box 1.2 em. The time field grows 66 → 102, AM 28 → 36; the speed slider, the lead's flexible part, gives the room (133 → 89), so slow motion's first part now holds one thumb, not two (#283's check reads so). Dial Time stays packed (the Show Case).
- The day: the hours' names stand over the ruler; the ruler is 26 high with cuts of 21 · 14 · 8 (were 22 and 18 · 12 · 7); the bar keeps its 62.

## v1.0.5 beta · 30 Oct 2026 — Dial Mono is the interface's mono

Okay, 30 Oct 2026, 16:56: "House mono i meant we have a monospace font selected for the whole ui dont we? Sf mono should be a fallback for macs"; 18:10: "Ok go with dial mono for all then, but try not to change shapes."

- `--mono` is now `"Dial Mono", ui-monospace, "SF Mono", …`: the packed JetBrains Mono cut (plain 0) draws everything the tool sets in mono — the bar, the log, links, a hex, a RAL name, the feature tags — on every machine the same; the system's mono stands behind it. `fonts/ui/mono_font.py` cuts the whole printable set now (and ≈ · × — → …), in two weights: the regular at the stem weight 456, and a semibold for the bar's sliding speed pill (11 KB each, packed by `build.mjs`).
- Shapes held: measured before and after at 1440 px, the bar's three parts (460 · 562 · 121) and the log are unchanged, a colour pill 79.1 → 78.9; a mono character advances 0.6 em in both faces.
- `ink.js` measures a label ten times larger and scales back: at a label's own size the canvas rounds a face's metrics to whole pixels, and a Dial Mono "1" on the bar sat a pixel low.
- v1.0.4's split (the pop-out's number cells in the sans) stands: numbers alone are the panel's type (design.md §type); the hex, the name and the pill are mono.

## v1.0.4 beta · 30 Oct 2026 — the pop-out's numbers in the panel's type; v1.0.3's Dial Mono taken back

Okay, 30 Oct 2026, 16:50: "You overdid it instead of reading the rules. No new fonts necessary … Ui elements do not get slashed 0s."

- Per the canon (design.md §type: numbers alone in the interface are the panel's own type, lining and tabular, plain zero; the mono is for what the tool says): the bands' thousands and the line's number cells (R G B, C M Y K, the RAL code) are the sans, tabular lining; the hex cell, the name cell and the colour pill stay mono. Dial Mono is as it was (v1.0.3 had widened it to the pop-out's words — undone).
- From v1.0.3, kept: the R on a RAL chip centred; no hairline above On this dial, the rows up under the head's line (Okay, 16:43: "centered"; "Remove & move up").

## v1.0.2 beta · 30 Oct 2026 — the colour pop-out redrawn round RAL: the line, the rows, the bands, the pill

Okay, 30 Oct 2026, 15:48–16:23, in drawing rounds ("Just draw windows"; "give it to me whole 4 ways"; "Done. Implement"; "R's placements, top gray hr, spacing downtown was perfect here, implement this").

- **The line**: RGB · HEX · CMYK · RAL, then one box holding the colour's swatch (plain, no stroke) and the values in cells divided by black rules, a small grey letter over each cell (HEX · R G B · C M Y K · RAL NAME; "colors listed as rgb hex cmyk ral"; "Incorporate swatches into the color code boxes, no stroke for them. combine rgb and cmyk into boxes with black vertical rules, add a rule after color swatch"). RAL's name cell is twice a code's and cuts a long name. Copy is a square as small as its sign. The letters make the line one letter taller.
- **The rows**: a hairline above On this dial, between the rows and after the Palette; the chips 5.5 apart, eleven to a row, a twelfth colour on a second line on the same columns ("Line above on this dial and after palette swatches. If palette goes to a second line, new colors come in on their column"). A chip that is exactly a RAL colour carries a faded R ("Faded R"); the +/− slot stays as it was ("Ok keep the system").
- **RAL mode**: the thousands inside the bands, dark on a light band ("Put ral's thousands inside the colored section to win one line there"); the chart is a pill switch, flush left, smaller type — RAL Classic | Classic & Design System+ — each choice with the tiles it shows, the second on to start ("Pill selectors we have designed use them"; "inside the pills give all thumbnails"; "RAL classic on the left").
- **The panel's colour pills** say a RAL colour as R and its code, no space, dashes inside (R5015, R210-50-30), at the hex's width, a long code cut ("rals get into big swatch pills like hex with R 5001 pill size does not change, longer names get cropped"; "R does not have space, spaces inside color names become dashes").
- **Growing**: RAL mode is taller; a pop-out standing low on the screen keeps its bottom and grows upward ("ral selection makes color popup grow up when it's down on screen, down when up").
- The window test's colour pop-out section checks the line (letters, rules, the swatch), the rows (5.5 apart), the pill, the bands' names inside, the R marks, the panel pill's word and width, and the upward growth.

## v1.0.1 beta · 30 Oct 2026 — RAL mode in the colour pop-out

Okay, 30 Oct 2026, 14:22: "I am thinking about a color picker that is made of ral colors. I want to keep the gradient view and hue slider, but instead of an endless tiny gradient, can we get classified colors show up as a grid in gradient's place?"; 14:31: "Fixed band for slider, include design system but with a note on the swatches for non standard ones. In our style and shape of the popup"; 14:37: "Fuckin awesome. Implement on dev"; 15:16, his drawing: "smaller, rounded color swatches, design system on off possible and group the color code with the swatch down below"; 15:19: "Copy gets an icon, color name area grows. İf name does not fit crop it"; 15:28: "Copy box as small as the icon, colors listed as rgb hex cmyk ral. Ral switcher better. Visible when off and switch connected to design system. Comes on as default".

- **RAL** is the fourth mode on the pop-out's line — RGB · HEX · CMYK · RAL. On it, the field of one hue and the strip of hues give way to **a family's grid** and **nine family bands** (`web/src/ral.js`, `colour.js`, `4e-colour.css`). The grid is 7 rows of lightness (light at the top) × 16 columns of chroma (grey at the left), the steps between the family's own lightest and darkest, greyest and most vivid; a cell holds the colour nearest its step, small and rounded (19 × 18 at the pop-out's width, 5 round); an empty step is nothing. **RAL Classic** (215 colours) cells are plain; **RAL Design System+** (1,825, each filed under the family of the Classic colour nearest it) cells carry a white dot, and the line under the grid names both and holds the Design switch, on to start, right after its words and visible off. The bands are the nine Classic families (1000 yellow … 9000 white and black) in their plainest traffic or signal colour, named by their thousand under them, the shown one ringed. The grid opens on the family nearest the colour in hand; a band shows its family; a cell takes its colour exactly and is ringed like a chip. The line groups the colour's swatch with the code in one box ("≈" before the code when the colour is near a RAL, not on it), then the name in a box that takes the rest and cuts a long name; a code typed is taken ("5015", "RAL 5015", "210 50 30"); Copy is the copy sign alone, a square, in every mode, and gives "RAL 5015 Sky blue". Wide, the grid takes the added height as the field does; on a phone the sheet's rules cover it.
- The values are the web's sRGB stand-ins for RAL (the printed card is the reference): good for naming and choosing, not for matching a paint; the Design colours are not what the shops stock (Okay: "not stock").
- The window test's colour pop-out section checks it (7 × 16, Classic plain and Design dotted, the switch, the bands' names, the blue plate on the blue family, 3020 pressed, a Design code typed, "≈" on a colour off the charts, HEX back, Copy a sign).

## help page · 26 Oct 2026, evening — the release audit: summary first, one voice, one grid

Okay, 26 Oct 2026, 17:32: "We are auditing the help document. The software is locked, we are going to release … Are there redundant things? Icons section necessary? … Better information hierarchy. Start sections with summary, then go into detail bit by bit as necessary. Prose. Economical, with a heart … Three colors, three font sizes. No bolds, italics … x for before, 2x for after. Hr Lines can get the two grays only … Japanese zen and good plenty white space." Built in rounds on the private preview page, each on his word.

- **Structure**: 17 sections to 14, about 14,250 words to 11,000. Signs went (every icon now stands in the sentence about its control); The idea and The screen became *Dial Tool, in short*; the two Gallery sections one; Keys and pointer with iPad and desktop *Keys and touch*; How do I… one line a task with a link to its section; Words the trade's terms only (64 to 36); no reference to the guide.
- **Every section** opens with a summary of the panes below it (19 px grey, beside its map), then the panes in the app's order and words. Long panes split under the app's pane names; numbered pictures (the window, the Show Case, the font sheet, Guides, Shadows, the bar) number their rows to match. `check.py`: all 154 row labels named.
- **The look** (`index.html`'s stylesheet, twelve modules): ink · grey · red; 26 · 19 · 15 px; weight 400, titles 500; one unit `--x` (12 px): prose x before, 2x after, a title none after (its text x/2 under it), table rows x/2 and x; rules in two greys only; the page 1100 px wide at most.
- **Icons in prose** fitted like letters by `fit.cjs`: each icon's drawing measured, its viewBox cut to it, its height and baseline set in em from Inter's cap height; four set by hand, each with its reason.
- **The menu**: its hairlines; the eye beside the active group, a dot beside the active entry; one line for jumping and marking (a jump lands a section's rule on the menu's first line, and that section is marked); it scrolls inside the visible screen.
- **The maps**: a caricature of the window on one grid (one inset, the top buttons and the panel's title on one row, stacks at one pitch), every small button a dot, the target in ink, a 3 px red box centred on it; a 1 px square frame; a caption under each. The Show Case's way in and way out side by side, an arrow between. A Gallery map.
- **Pictures**: the windows and the hands shot from the app itself (`variants.mjs` loads each as a settings file); the windows each on their own day, the figures at 56 %, a grey disc and frame; the hands on a bare plate without the seconds hand, the pivot centred; the straps as square crops. Every picture opens whole in the lightbox, ‹ › and the arrow keys stepping through them.
- **Show Case**, the public name, throughout; show mode stays the internal word.

## help page · 26 Oct 2026 — the bar, piece by piece; one stylesheet, one grid

Okay, 26 Oct 2026, 03:25: "The black bar and its screenshots, buttons like start stop am date etc. and pieces not screenshotted and explained thorougly. The design needs better adherence to columns, discrepancies exist. Check the css, it might be too bloated … Dial crops elegant, kudos. However some like numbers placement auto rotate etc better show all dial."

- **The bar**: two numbered pictures (its left end ①–⑥, the timeline ⑦), the numbers over the picture; a row each for Play, Speed (with the speed's pill while dragged), Time, AM · PM, Date, Now, the timeline (scrub, the snap to the hour or 10:10, the hour buttons, the needle) and Zoom · Fit. A new pane, the date's popup: weekday · Day · Month · Year · − +, numbered.
- **Pieces not shown before**, from the current build (`shoot3.cjs`): the steps, named; Versions open with two saved; the Tiny preview.
- **One stylesheet** in place of the old one and its appended layers (196 rules, 17 matching nothing): one grid — names and headings on the name column, everything that is content (text, notes, pictures, strips, the How cards, the matrix's kinds, the Signs, the form, the window's numbered pictures) on the text column. Measured at 1200 px: every block starts at 0, 171 or 740.
- **A pane's heading and what opens it share a line** (Okay, 03:48: "This area a weirdness here. Check headings etc"): the heading on the name column, its first line, picture, signs or cards beside it on the text column, not a step below. A pane of one row that repeated its heading (Text, Log) became the heading and its line. A section's first pane straight under its heading takes the heading's rule (no second rule); every section's panes end on an ink rule.
- **Placement** shows the whole dial again, where the turning shows; the Complication strip zoomed on the window, as the other window strips; the text kind's picture zoomed on its word.

## help page · 26 Oct 2026 — Watch notes on the grid, with their sign; every word readable

Okay, 26 Oct 2026, 03:09: "Watch's placed well into the grid. Watches multiply overall, and receive an icon; triangle with watch hands inside. Should be able to read all the word when showing weekdays and such. Content visible. Arabic japanese and stuff too." In question mode: more Watch notes; the icon, then "Watch ·".

- The grid's widths in px (`--name` 171, `--spec` 190: 9 and 10 of the text's 19 px), so a note in smaller type stands on the text's column.
- The Watch sign: a rounded triangle with a watch's two hands at 10:10 in it, before "Watch ·".
- The cautions moved out of their rows into Watch notes at their pane's foot: what stays out of a link (Scale everything with it, Weight %, a watch face's name), what comes after v1 (a background, a hand or a picture of your own), what replaces the dial (Reset, Blank face, Edit this dial), what a link may not keep.
- Labels and Placement show the quarter from 12 to 3 (every word, Eastern Arabic and Chinese too); those and the windows drawn at twice the size they show.

## help page · 26 Oct 2026 — the pictures in the help's greys; the disc hand; the windows' choices

Okay, 26 Oct 2026, 03:04: "a neutral gray was the help's main. Replace the blue. All other details are fine. Disc hands are drawn with a mistake floating marker, bigger transparent disc for previews. Windows might like some of these squares too. Dates weekdays, am pm. Do not overdo but illustrate."

- Every dial and watch picture in the help's greys (`grey.cjs`'s palette: a dark plate, near-white print, light hands, the light grey ground); the Gallery's thumbnails keep each dial's own colours.
- The disc hand drawn as a preview should be: the hour hand alone, its disc as wide as its length reaches (16.5 mm), see-through (45 %), its marker painted at the edge.
- The windows, zoomed on the window at 3 (12 × 6 mm), the text at the code's 62 %: Big date (date · Big date), Written (Short · Full), Names (EN · TR · DE), Shows (Disc · Words), Shape (rectangle · circle · polygon · arch · half, in place of the icon row).

## help page · 26 Oct 2026 — what a choice does, in pictures

Okay, 26 Oct 2026, 02:41: "Gallery needs thumbnails for each dial. What else can get a thumbnail?"; 02:51: "All do. All."

- **The Gallery**: every card with its own dial over its name (`thumbs.mjs`, from the cards' own drawings, 64 px).
- **What a choice does** (`variants.mjs`): the First dial drawn by the Gallery's `card()` with one setting changed — the ten hand shapes (their middle), the four complications, the five ring kinds alone, six Labels (Eastern Arabic in Vazirmatn, Chinese in Noto Serif SC, as one would choose), the four Placements, Resize Ring's Outer · Middle · Inner against a red circle at the radius, Give way's nothing · Skip where · Knock out round the 3, the colour file beside its Mono print mask; and show mode from the app's own PNG export — the four cases, Engineer · Miyazaki by Dramatic · Flat, the four straps (Whole watch, the bracelets closed). Each strip sits in the row or pane it shows; a strip that stands for a row of icons replaces it.

## help page · 26 Oct 2026 — the spec column only where it informs

Okay, 26 Oct 2026, 02:24: "These right columns become less informative and perplexing in many views. Either incorporate sentence format pertinent information there or leave it empty or remove altogether. decide for each instance."

- A pane keeps the spec column when three or more of its rows, and at least 60 % of them, carry a range (8 panes: the sizes of a ring, a hand, a window): range in ink, then "starts …" in grey, so a value always says what it is.
- Every other pane (62: choices, switches, a value here and there) drops it: its ranges and start values close the row's sentence ("Range 15–50 mm; starts 34."), on two columns, name · text (`dl.rows.two`). `check.py` holds those rows to two cells.

## help page · 26 Oct 2026 — one grid, three sizes, pictures of the panes

Okay, 26 Oct 2026, four drawn rounds (01:43–02:08): "These sections need better design … Utilize darker hr lines to denote sub sections starting and finishing"; "Too cluttered and busy" (ia.net); "horizontal rows unreadable on dotted table. Work about levels of hr lines"; "One grid to rule everything. Keep it simple. No many font sizes, 3 is the limit … Design is not adding shit you think might look good"; "Hr lines closer to the paragraph start then paragraph end … Try populating with images any bit of process".

- **One grid** for every list, table and card: name (`--name` 9em) · text · spec (`--spec` 10em: the range in ink over the start value in grey). Each pane of the app a `section.pane`; Rings and Windows open on a matrix of which pane shows for which kind.
- **Three sizes**: 26 a section, 19 the text and a pane's name, 15 the small things (spec, captions, keys, notes, footer).
- **Rules in three levels**: a section's ink rule under its heading; an ink rule where a pane begins, and where a section's last pane ends; a row's hairline, nearer the row it opens (`--row-top` 13.5 px under it, `--row-bottom` 19.5 px over the next).
- **Twelve pictures** from the current build (`shoot2.cjs`), each at its true 1× size: the controller on a desk and on an iPad, the iPad window, the Shadows pane, the Guides list and the font sheet (numbered, their numbers in the picture's margins), the colour pop-out, show mode's Backdrop and Light › Sun, the ring list, Positions, the bar's zoom.
- `check.py` holds every row to its three cells.

## help page · 26 Oct 2026 — rewritten against beta 4.94.20, published

Okay, 26 Oct 2026, 01:02: "help page needs a lot of info, a lot of work. its design is great now. add a round numbered what is where for show case screenshot as well." 01:22: "keep building and push when ready".

- Every section read from the code (fact sheets per area, each fact with its file and line), then written in the page's own markup: every pane and row with its label as the app shows it, its range and its starting value. Starting values are the First dial's (`opener.js`), the code's defaults where it sets none.
- **Show mode** in full: a numbered picture of its window (nine parts, `img/show.webp`), then Into show mode and back · Dial (Colours · Inks · Hands) · Watch · Light · Export · Shenanigans · Backdrop · The eye · What is drawn · What is kept where (which keys travel in a link and which don't).
- **Gallery**, a new section: the pill, a card's two buttons, and all twenty cards in order, each with its rings and the setting that makes it.
- **How do I…** in six groups (Start · Rings and type · Hands and windows · Look and light · Save, share, print · Show mode); **Words** from 8 to 64 terms.
- Corrected: "Inks · sheets" is part of Print; Copy set link is in Share dial as link; the bar's zoom is three squares; X-ray shows with a date, day or am · pm window; no Cap tab; the windows' colours are in Shape; the Light tab's sun is Angle ° · Height ° · Strength %.
- `check.py`: every one of the app's 154 labels named on the page.

## beta 4.94.20 (web version) · 26 Oct 2026 — the Strap row's choices as free pills

- **Show mode's Strap row** (Watch tab): Leather · NATO · Bracelet · Links as free single pills that wrap, as the NATO Pattern row under it. The four in one pill were wider than the column (246 against 202), so Links sat scrolled off its end.
- Checked: the window test (the diver's strap choices all in view; the NATO count is its own row's).
- The help page's tools: `check.py` reads the rows from `rows.js` (app.js is in parts); the page's zoom signs are the bar's three squares; `shoot.cjs` also takes show mode's window (`img/show.png`), its parts measured for the page's numbers.

## beta 4.94.19 (web version) · 26 Oct 2026 — show mode's title flush right; Dramatic's spotlight still and true

Okay, 25 Oct 2026, 23:45: "on right name needs to stay flush right sadly, an exception. go on to the remaining points"; #528 (24 Oct 2026): "Dramatic needs more dramatic lighting. A non animated spotlight, darker bg. Spotlight highlights bg to real color."

- **Show mode's title, the panel away**: flush right, the show panel's margin (16) from the window's edge, sliding there with the panel (`--mast-shift`, measured in `dial_alone()` before the panel moves; 4a-panel.css). The dial side's title stays where it stood.
- **Dramatic's spotlight** (`watch.js`, `POOL_*`): still on the watch's centre whatever the sun; the ground's own colour out to 45 % of its 44 mm radius (about the case's edge), its lightness × 0.82 at 70 % and × 0.57 at the rim and past it. Over a gradient backdrop: clear in the middle, 35 % black at the rim.
- Checked: the window test (the eye's check now measures the title flush right, 16 px); the spotlight before and after on crops, two suns.

## beta 4.94.18 (web version) · 25 Oct 2026 — bracelets closed round a wrist; Links on the diver; the eye hides the bar, the title stays

Okay, 25 Oct 2026, 23:29: "Eye hides bar too. Links add. Bracelets viewed ad closed. I have a sample i sent you in the last few days, a photo from an online retailer. The preview was bracelet closed. I want that for our bracelets. Not for other straps." 23:32: "Dial tool header stays on collapsed panels on show case same as main." The photo: his notes doc, 24 Oct (a steel diver on its bracelet, seen from above).

- **Bracelets closed round a wrist** (#529; `wristWrap()` in `watch.js`): the links run 1 mm flat past the end link (`WRIST_FLAT`), then over a wrist of radius 12 mm (`WRIST_R`); seen from above a point s along the bend stands at its start + 12·sin(s/12), so the rows shorten toward the wrist's horizon (13 mm past the end link) and stop there. Each row is lit by its own tilt. The ground shadow and the outline follow the same rows. Both bracelets, every view; leather and NATO unchanged. Whole watch frames a bracelet to the horizon and 6 mm of ground past it (`fullBox()`).
- **Links on the diver** (#510): the Strap row offers Leather · NATO · Bracelet · Links (`strap` 4, appended, R9); Links is Emre's H-links bracelet (`linksBracelet`).
- **Show mode's eye** hides the bar too: it slides out of the window with the panel (`#app.showing.alone`, 2-base.css); the title — mark, Dial Tool Show Case, Help — stays where it stood, as on the dial side (4a-panel.css: twice the panel's width back, as the panel both narrows its column and slides). The dial side's eye keeps its bar.
- Checked: the window test (new: the eye's bar and title there and back; the diver's Bracelet and Links); both bracelets closed on crops.

## beta 4.94.17 (web version) · 25 Oct 2026 — show mode's Backdrop rebuilt; Blurs softens the shadows; the case casts from its height

Okay, 25 Oct 2026, 23:10, question mode: "Backdrop on show case wonky, fix it. Make the all swatches same, large size, gradents are 2x blocks of the same single swatch with a gradient in it. Better design of the popup. Adding colors or gradients by user possible, save file carries those too"; chose Backdrop Auto and Blurs softens shadows (#510, #507).

- **The Backdrop popup** (`ground_pop()` in `preview.js`): the Shadows pane's night box, its width (498) and room (25), its heading lines and its footer (§popfoot). One grid of eight large squares to a line (`--ground-cols` 8, `--ground-chip` what the row leaves after its gaps, 45 px); a gradient two squares side by side, as tall as one. Colours: **Auto**, the ten, yours, then **+**; Gradients: the ten, yours, then **+**. The + is the colour pop-out's palette: it adds what is in hand of its kind, and turns to − when that is already yours. The footer: *Colour* (dot and hex) and *Gradient* (its two ends, each a dot in a pill; the guides' dot class they borrowed drew them broken).
- **Yours** are `w_grounds` (each [colour] or [first, second]): in the settings file and the session, never in a link (R31).
- **Auto** (`w_ground_auto`): the paint's own ground (Engineer Stone #B9B3A6, Miyazaki Umber #877F6D), following the Style row; any other pick turns it off. Off to start.
- **Blurs** (the Shenanigans switch, the Light tab's Soft shadows, one key `sh_blur`) now softens every shadow of the watch — the ground's, the case's on the strap, the hands' on the dial — with the dial side's one edge, 0.07 mm (`shsoft` in `watch.js`, in user space so a thin hand's shadow is never cut).
- **The case casts from its own height** (#507; Okay, 23:21: "Case heights are cheap and they matter. Simply. Do"; 23:22: "Case height comes with case and is uneditable"): a share of its width — Dress 0.22 (8.1 mm on the 37 mm Calatrava), Field 0.28 (11.2 on 40), Diver 0.32 (13.0 on 40.5) — after the published cases; Emre keeps 2.0 mm. The ground shadow is that height over the sun's tangent, never past a 20° sun (`CASE_H` in `watch.js`). No control: it comes with the case.
- Checked: the window test's Backdrop check (Auto, twenty tiles, a + each, a gradient as tall as a colour and wider than two); the popup at rest and in use on crops.

## beta 4.94.16 (web version) · 25 Oct 2026 — show mode's Dial tab: small swatches

Okay, 25 Oct 2026, 22:50, with a crop of the tab: "these swatches are big. i dont think they are up to code. ui on left either uses small swatches or labelled code, do the same."

- **Several colours on a line are small swatches** (`--dot`, the dial side's swatch to pick from: 14, 18 under a finger): a band's sectors, a hand and its cap, a window's colours, a disc's prints, and each Hands line's colour. A lone colour stays the labelled pill (swatch and hex).
- **Six to a line** in a box of their own (`.dots`), the grey note beside them, not under ("Six to a line, two lines").

## beta 4.94.15 (web version) · 25 Oct 2026 — show mode's Dial tab: show or hide is a dot

Okay, 25 Oct 2026, 22:13: "Eyes doing different functions, make the second levels something else?"; in question mode, "A · dot", "Show mode's Dial tab only"; 22:14: "Build" (#547).

- **A line's show/hide is a dot** in the panel's left column: filled, the part shows on the watch; a ring, it is hidden, and its line greys (mark, name and colours, as a hidden ring's in main's list). Two drawings through the icon pipeline (R33: the ring weighed within 6 %), `SHOWN` and `shown_dot()` in `icons.js`. The eye is the panes' fold alone. Main's ring list keeps its eyes.
- Checked in the window test: the dot, its ring, the hidden line greyed.

## beta 4.94.14 (web version) · 25 Oct 2026 — show mode's Dial tab: the eyes in the left column

Okay, 25 Oct 2026, 22:02: "Eyes and icons won't gel. Hands unnecessary to iconize. Check if pushing eyes to left column work?" Tried, pictured, it works.

- **The lines' eyes stand in the panel's left column**, under the panes' own eyes (their column, their `--nudge`: 1085 = 1085 measured); an ink's fold and a part's A or B there too. Each line starts with its tiny mark; the lines' gaps are a unit again (the name keeps 96).
- **No hand marks**: the hands' lines in Colours and Hands have none ("Hands unnecessary to iconize"); the hand mark is gone from `icons.js`. Rings and windows keep theirs.
- **Bevels on one line**: its name, its pills to the line's end.
- Checked in the window test: the lines' eyes under the panes' eyes.

## beta 4.94.13 (web version) · 25 Oct 2026 — show mode's Dial tab, its look

Okay, 25 Oct 2026, 21:36: "Ok now make this look good … swatches, alone spelled out. Grouped? Nice spacing. All colors aligned on a line like rings on main but appropriate to this wiew. Tiny marks, secondary labels, look at prescedents, don't use allcaps everywhere." Drawn once, settled in question mode, built on "Build it" (#546).

- **One swatch column** on every line of Colours, Inks and Hands, as on main's ring list: five columns — the eye (an ink's fold, a part's A or B) · the kind mark (`--kind-pic`, 24) · the name · the swatch column (`--pill-w`, the pill's 79) · the height box (`--side-num`) — with half-unit gaps, so a name keeps room for "Triangle at 12" (85 measured).
- **A lone colour spelled out**: a pill with its swatch and hex in mono, as the dial side's Colours; several colours squares from the column's left, a band's sectors six to a line, with a grey note after them ("12 sectors", "hand · cap", "frame · disc · figures"). On a Hands line a square only ("a · square only").
- **Tiny marks**: the ring list's kind marks before rings, under an open ink too; a window mark through the icon pipeline (R33), at the kind marks' 24.
- **Group names in grey, sentence case** at the rows' size, as the Shadows pane's (Rings · Hands · Windows · On the dial · On the discs · Disc depths); *Height, mm* small and grey at the Inks and Hands headings' end. No capitals.
- **Inks**: a line named by its part count, the ink's pill on the swatch column; open, Two inks in the height's place.
- Checked: the window test (one swatch column across the tab, no capitals, the Bevels pills inside their line); the icon check (it does not visit show mode: the marks were weighed with `look.py` before pasting, within 6 %).

## beta 4.94.12 (web version) · 25 Oct 2026 — show mode's Dial tab: Colours · Inks · Hands

Okay, 25 Oct 2026, 20:41: "finish show case's ink height color selectable thing now"; drawn in six rounds, on Rally, Moon phase and an invented complex dial, and locked ("Ok, done. Build it"). Build list #545.

- **Colours**: every part by what it is — Dial, then RINGS · HANDS · WINDOWS in small capitals — each line its eye, its name and every colour it has (a band's sectors four to a line; a hand and the cap; a window's frame · disc · what is printed on it). No numbers there.
- **Inks**: ON THE DIAL, one line per exact colour (two near-blacks are two inks: "Exact match only"), closed to start with its part count ("Closed, each says its part count"); its swatch recolours every part of it at once and its heights go with it ("recolours the whole ink"); its height in mm. Open, **Two inks** at the line's right end, its word stuck to it, and under it each part with its ink's height; on, the ink is A and B, each part an A | B pill before its name and its box its letter's height ("One thick red one thin possible via a switch on the pane"; "Just A · B"; two at most; his marks of 21:18: "a part on its letter's line", "Switch in the right place label stuck to it all the way to the right"). An ink of two parts has nothing to choose: split, its first part is A and its second B, the letters as text ("Switch stays, but on two item lists leave them text only"). A window's frame is one of the dial's inks ("Joins its colour's ink"). ON THE DISCS: each window's disc prints (figures, picture, shade, neighbours) with one height ("Frame and discs figure … all differently editable numbers get ink height"). DISC DEPTHS: each disc under the plate, the Shadows pane's number. All inks at once (mm) at the foot.
- **Hands**: Cap · Seconds · Minutes · Hours, each its colour (the same as in Colours: "colors also editable on hands pane everywhere") and its height in mm; Bevels as three pills; Bevels % ("Bevels % slider plus the pill").
- **mm everywhere** ("mm everywhere"): new keys `w_inks`, `w_ink_all`, and a ring's `ink_b`, a window's `frame_b`, `print_h` — the file and the session, not a link (R7, R31). An older file's steps are read once: All inks → `w_ink_all` = (steps − 6) × 0.035 mm, a ring's step → its colour's height; `w_ink`, `ink_d` kept (R8). The watch reads each printed part's height (`ink_mm`).
- Not as drawn: an open ink's height is on each of its parts' lines (the switch takes the line's end), so open looks the same split or not. Closed, a split ink's line shows A's height.
- **Gallery: Complex inks** (Okay, 21:25: "add your very complicated dial to the gallery so i can play with it"): the drawings' dial — navy, white figures and track, a thick red triangle and thin red tips of one red, a black and white tachymeter rail, a gold logo, a date at 3, a moon at 6. A link carries no inks (R7), so it opens with every ink at 0.21 and unsplit.
- Checked: the window test (the tab's panes, an ink made by recolouring a ring, the split, a part's box setting B's height, a two-part ink's letters as text, the boxes on one edge, the Hands pane's swatch, height and Bevels); the link test (the inks stay out of a link; old steps read as mm; A and B heights with All inks).

## beta 4.94.11 (web version) · 25 Oct 2026 — show mode's top as main's

Okay, 25 Oct 2026, 18:05, with the two tops side by side: "Show mode and main tops, missing bar and alignments check, main looks correct"; in question mode, "B: main's height".

- **The tabs' line is back in show mode**: the top's colour rule set the whole `background`, which took away the hairline drawn as the tabs' background picture; it sets the colour alone now.
- **The title line is main's height** (`--header`, 43): the line falls on the undo buttons' bottom as on the dial side, as `--header`'s rule says "for the Show Case too". `--show-header` is gone.
- Checked in the window test: show mode's title line 43 high, the line drawn, on the undo buttons' bottom.

## beta 4.94.10 (web version) · 25 Oct 2026 — the sun box's values on the minuses' line

Okay, 25 Oct 2026, 18:01: "Only the stack on the right in sun box should align with the minuses boxes from below. Sun centers accordingly." The values' stack is as wide as a number box's − + (`--box-steps`), so it starts on the minus buttons' left line (1364 = 1364, measured); the picture takes the room before it, less a gap, and the dial stays centred in it. The window test's check follows.

## beta 4.94.9 (web version) · 25 Oct 2026 — the bar's view as three squares; the sun box on show mode's Light tab

Okay, 25 Oct 2026, 17:31: "redesigning fit area at the end of black bar: like 3 stuck together canvas buttons on the bar, aligned with canvas brothers from edge. Two m glasses one with a plus other minus. And lastly the fit is an icon four arrows from a square's corners into center. Make them with icon rules." And: "the sun diagram takes its place under light, fits sensibly." Drawn first, in chat; the bar approved at once, the sun locked after four rounds ("Sun centres the open space. Inner sun box text all same size with the rest of ui. Faded colors. Black figures"). The dial parts' stack with ink heights and colours (show mode's Dial tab) is paused.

- **The bar's view**: zoom out · zoom in · fit, three 32 squares stuck together, made as the canvas's switches (`--control-large`, `--round-switch`, joined as undo · redo), in the bar's light; their right edge on the canvas switches' line, `--canvas-inset` from the window (the bar's right padding was the margin). Three new icons through the pipeline (R33): a lens with − (LINE), a lens with + (its cross DENSE: it crowds the lens), four arrows from the corners in (slanted shafts SLANT, heads DENSE: they read heavier where they meet). The faint magnifier and its phone popup are gone; how to zoom and move is in the squares' tags. A phone: Fit alone, its own four corners and left line, the same right edge.
- **The Light tab's Sun pane**: one box five rows high, an outline with sharp corners in the column's ink; the Shadows pane's own sun picture (`sun_picture`, with its rays and the far side's dots) seen through a square centred on the dial, so the dial stands in the middle of the open space; at the right Angle · Height · Strength as plain values, each name over its figure, flush left on the number boxes' line, names in the column's grey, figures in ink. Under it the ordinary rows Angle ° · Height ° · Strength % (Darkness renamed, moved from the Shadows pane of the tab, which is gone), Soft shadows, the note.
- Checked in the window test: the squares' sizes, joins, corners and edge (wide and phone); the tags; the sun box's outline, centring, the values' line, a press in the picture moving the sun and its value.
- Open: the divider before the squares stays a margin from them while their edge is now 12 from the window (Okay's "equalize those gaps", 15 Oct 2026, held for Fit at a margin) — asked.

## beta 4.94.8 (web version) · 25 Oct 2026 — a finger on a named slider keeps its controller

Okay, 25 Oct 2026, 17:21: "these new sliders up top are dismissing prematurely with controller. Check for ipad." Reproduced with a simulated finger: the controller opened on the touch and went away on the first move. A named slider (form D) has no number box on its row, so the field the controller hung on was not in the window, and `sync_rows` — run by the value's change — took a controller whose button is "not connected" for one whose row had gone. The controller of a named slider now hangs on the slider itself. A check with a simulated finger (named slider and a part's row alike) guards it.

## beta 4.94.7 (web version) · 25 Oct 2026 — the fat sliders' thin fill starts with a round cap

Okay, 25 Oct 2026, 17:16: "the white line needs round cap on start THIS ONLY". A dot of the fill's thickness at its start, the line from the dot's middle to the knob; nothing else touched.

## beta 4.94.6 (web version) · 25 Oct 2026 — real ends for the heights; the controller inverts on a night popup; the fat sliders as drawn

Okay, 25 Oct 2026, 17:08: "Cap height should not be thiiiiis high. All controllers and ipad actions, slides, on offs on visuals, behaviors should be checked … Controllers need to invert on this dark bg … Take a look at my sliders drawings. Compare to yours."

- **The ends from a real watch**: the cap to 2 mm (was 4), a hand to 1.5 (was 3), a disc to 1 under the plate (was 2) — a hand stack under a crystal is 1–2.5 mm.
- **A controller opened from a night popup** (the Shadows pane, the guides' list) counts as on a dark ground: its twin screens instead of multiplying, so the box is light over the night, and its words are black on it (`.numpop.screen`). The Shadows rows' controllers keep the red slider.
- **The three fat sliders as his drawing**: the thin fill is 4 thick inside the 15 track (it had grown to the track's height) and starts 8 in from the track's end (`--shade-fill`, `--shade-fill-in`).
- Checked in the window test: the pane's measures, the limits, the disc rows, the touch section (a finger on the rows and the controller). Not checkable here: Safari's hover on the iPad — for Okay.

## beta 4.94.5 (web version) · 25 Oct 2026 — the lit part's line says what the slider changes; the pane 498 wide everywhere

Okay, 25 Oct 2026, 16:37, after sketches of other ways (one scale on every row; one lane with four thumbs; the diagram as the control — set aside: "No no no, this made it more cumbersome. Dont change our visual adjustments. Sliders we have, how can they adapt … Identify the changing bit of the sliding slider as the section of the red line and make that section dashed"), and his drawing of 16:55.

- **The red line**, while a part is lit: from the part down the axis to the plate, **dashed from the part to the next part toward the plate** (the piece this row's slider changes), solid under it (the stack the slider doesn't touch). The order of the drawing: the grey parts, the red line over them (a line of the night under it knocks the grey axis out, so the dashes stand alone: "Red line is always above and knocks out the gray dashline"), the white lit part over all ("White indicator drawing is the topest of all"). For the cap: cap to seconds; for hours: the whole line; for a disc: plate to disc.
- **The controller** of a Shadows part shows its slider in the lit red, as its row does ("Controller on ipad needs a red slider for this").
- **The pane is 498 wide on every screen** (`--shade-w`), over the dial when the panel is narrower — on an iPad its footer's Reset was cut off at the switch's right edge ("Keep window width same, ok to go over onto the dial if need be").

## beta 4.94.5 (web version) · 25 Oct 2026 — the lit part's line says what the slider changes; the pane 498 wide everywhere

Okay, 25 Oct 2026, 16:37, after two sketches of other ways (one scale on every row; one lane with four thumbs; the diagram as the control — all set aside: "No no no, this made it more cumbersome. Dont change our visual adjustments. Sliders we have, how can they adapt … Identify the changing bit of the sliding slider as the section of the red line and make that section dashed"), and his drawing of 16:55.

- **The red line**, while a part is lit: from the part down the axis to the plate, **dashed from the part to the next part toward the plate** (the piece this row's slider changes), solid under it (the stack this slider doesn't touch); always on top, and a line of the night under it knocks the grey axis out, so the dashes stand alone ("Red line is always above and knocks out the gray dashline"). For the cap: cap to seconds; for hours: the whole line; for a disc: plate to disc.
- **The controller** of a Shadows part shows its slider in the lit red, as its row does ("Controller on ipad needs a red slider for this").
- **The pane is 498 wide on every screen** (`--shade-w`), over the dial when the panel is narrower — on an iPad its footer's Reset was cut off at the switch's right edge ("Keep window width same, ok to go over onto the dial if need be").

## beta 4.94.4 (web version) · 25 Oct 2026 — the Shadows pane to Okay's drawing

Okay, 25 Oct 2026, 15:55, with his drawing (`dial-tool-shadows-pane-4.93_O.pdf`, three pages): "ok new shadows popup. just the objects that have a shadow on the right side diagram. plate untouchable. all hover as now. Just made things pixel perfect and introduced some new stylings and special ui bits here. The bottom part, logically pixel perfect. This is a stellar example of one line. objects snap to edges, inbetween padding equal, black lines connect to top. font and border stylings. this needs to apply to other black popups that have this footer." Measured from the PDF (vector: every line, box and word), built to it, measured back in the window test.

- **The pane** (498 wide as before, 25 inside its edge, corners 15): one box on top, 204 high — the sun's picture, and a column as wide as the diagram (151) holding Angle° · Height · Strength % as named sliders (R15 form D) on fat tracks (15) with a thin fill (4) and the value in a pill knob (25; round at two figures, a pill at three — his note of 16:13). A hairline 14 under the box, the heading line (Part Heights · Parts, 34), then **one line per part across both columns**: each part of the diagram stands on its row's line (the cap, the three hands, the plate, a date disc), the y read from the row in the window (R21). The diagram's box runs from the hairline over the heading to 21 under the last line; the axis from the rows' first line.
- **What is in it**: Cap · Seconds · Minutes · Hours · Plate (no control: "plate untouchable") · **a row per window that shows a disc**, round the dial from 12 ("Disc at 12"), each sizing its own disc's depth (window key `depth`, null = the shared `sh_disc`, R7; link code appended, R31). The rings' ink heights have left the pane (Okay: "Ink heights only on show case. Remove from the tool side").
- **The heights keep their order** (Okay, 16:06: "seconds hand cant go below minutes and so on. Limit every value to their obvious limits"): a row's slider runs between its neighbours' heights, a step clear (a hidden hand does not count); a value at or past an end flashes **LIMIT** in red where the name was, 0.9 s (`bounds` on a number row, panel.js; `--limit-flash-ms`).
- **Lit**: the row under the pointer turns its name white and its slider's fill and knob red; in the diagram the part is white, drawn over everything, with a red line down the axis to the plate's hole, red too (Okay, 16:19: "on top of the whole diagram").
- **The footer** (`.popfoot`, for every night popup with a foot; the guides' list next, on his word): a band of the field colour, 53 high, the popup's bottom corners; cells divided by hairlines of the night running the band's full height; each cell its content with 13 at both sides, the first and last with the pane's 25 at the outer edge, the last taking what is left. Shadows (the switch itself, mirrored; bold, a 2 px tick) · Soft edges · Bevels % (a 36 value box) · Reset (an outlined button).
- Colours: the rows' names in a new night grey (`--night-grey`, 47 %: "one new shade of gray for clarity"); the headings and lines the night rule. Tokens of the drawing in the specials block with his words.
- Checked: the window test's pane section measures the drawing's figures; min (hands hidden) and max (three hands, four discs: 675 high) fit a desktop and an iPad on its side without scrolling; the pane scrolls as a whole past that.

## beta 4.94.3 (web version) · 25 Oct 2026 — the stretched tokens say so; two copied rules folded

Okay, 25 Oct 2026, 15:02: "scan the system for these" (quirks borrowed between regions); 15:05: "do the cheap". The scan (tokens used by two regions, bare numbers, copied blocks, repeated composites) found 10 tokens stretched to a second region, 15 bare numbers (all #398's), 5 copied blocks (2 real), 17 repeated idioms (left: tokens for idioms would be bulk).

- **Eight tokens' comments name both regions** they serve (`--scroll`, `--wait`, `--box-side-value/-step`, `--side-num`, `--bare-dot`, `--dot`, `--nudge`, `--pill-gap`), so `css-map.md` says it and the check keeps it; no prose added to `sectors.md`.
- **Two copied rules are one**, in the controls layer: the browser's own list unseen over a chevron box (`.menubox`, `.casebox`); a gripper's groove (`.listgrip`, `.sheetgrip`). The look-check: the only difference of the change is the drawer's groove now existing on wide screens too, inside the hidden gripper.
- **#543 noted**: `same.mjs`'s *first pane folded* states (finger, phone) and *guides list, two added* differ between two runs of the same build — the switches' words still fading when read; not a look change. Compare twice before reading a difference there.

## beta 4.94.2 (web version) · 25 Oct 2026 — sectors: the index from a thing on screen to its lever

Okay, 25 Oct 2026, 14:12: "does it make sense to create a design rules separately so when i'm drawing by words, you get what to implement … an agent working on pushing and pulling css values struggles"; 14:15: "not a rule set, an index to easily find what you're looking for, and insurance against agents missing info. No new bulk to the system. Go".

- **`docs/sectors.md`** (~1,100 words, by hand): the screen as nested regions — the panel (header, tabs, pinned part, the scrolling part's panes, rows and their kinds, boxes, pop-outs), the preview (the corner stack and its lists, the Shadows pane, the switches), the bar, the controller, narrow screens — each with its selector, one line of rule, its tokens, and where the full word is (rule, canon §, glossary line, check). An index into what exists; nothing restated at length.
- **`docs/css-map.md`** (generated, never edited): every token of `web/src/css/` with its value, the comment beside it, where it is used, where a part sets it again, and which `.js` sets or reads it. `web/css-map.mjs` writes it; `node css-map.mjs check` runs first in `npm test` and `npm run small`, so the map can't go stale.
- The map's first find: `--ring-gap-in` was set and used nowhere since the audit removed `.dots` (4.93.1) — gone. The build changes by that one line; the small check is green.
- `CLAUDE.md` (the read order, the loop's step 2), R32's page, canon §10 and the README point at the index.
- **Sets and borrows** (Okay, 14:25: a new design "uses some of the rules it's governed by, sets few specific ones and copies an unrelated sector's one quirk"; 14:59: "ok do it"): a region's entry says only what it *sets* and what it *borrows* from a region that is not its parent; a borrowed quirk is decided in the token — the other region's token when the two must move together, a token of its own with the origin in its comment when alike now and free later; never the number copied (sectors.md §7). The map lists every token whose comment names another, so such pairs are found in one search.

## docs · 25 Oct 2026 — the docs made lean (no build change)

Okay, 25 Oct 2026, 13:41: "back to our documents, the read order, the detailed parts. what can we trim ther, how to organize better. going and reading one specific rule or process for each function better through one large md or several smaller mds?" — then "Do all" (13:54) to the plan: one mandatory read, one file per rule, one line per term, one line per open item. Measured before: the start read was 25,400 words; after, `CLAUDE.md` + `handoff.md` §1 + the build list are 3,600, with `working-with-okay.md` and the rules index 5,600.

- **`CLAUDE.md`** is the one mandatory read (~900 words): the read order, what is binding, the loop of a push in seven steps, where things live and what not to touch. The loop and the setup steps that were in `handoff.md` §2–§3 and in `README.md` live only here now.
- **`docs/rules/`**: one page per rule, named `R<n>-<slug>.md`, each ending with how it is checked; `docs/rules.md` is the index (number, one-line gist, link). R15's controller is **R15a**; R32 is split into R32 (cascade, tokens, the bans, hover), **R32a** (sizes of type, INKED), **R32b** (the specials block), **R32c** (the look-check); R32's layout paragraphs (a framed thing, a heading with controls, a number row's tracks) are design canon now, `docs/design.md` §10.
- **The glossary** in two files, one line per term: `docs/glossary-watch.md` (the watch, rings, hands, windows, type) and `docs/glossary-tool.md` (the window, numbers and the controller, the preview, show mode, files and links, code); `docs/glossary.md` points to them.
- **The build list**: a row is #, title, where it came from (date, his words), status; the full rows, by number, are `docs/build-list-notes.md`, read when an item is taken up. Six rows whose status was done (#515, #516, #519, #521, #524, #525) moved to `docs/build-list-done.md`. The "Last updated" paragraph is one line.
- **`docs/handoff.md`** is §1 (where things stand, rewritten at each handover) and how to hand over; what it said about working with Okay and the sketch loop is **`docs/working-with-okay.md`**.
- `README.md`'s agent section points to `CLAUDE.md`; its files table names the new files. Every link between the docs checked by script; the only stale paths left are in the changelog, decisions and the guide's test notes, which are history.

## beta 4.94.1 (web version) · 25 Oct 2026 — faster, the same output

Okay, 25 Oct 2026, 13:11: "Deeper look, what would make us and the app work faster, optimize but do not lose function." Measured first (`docs/working-with-okay.md` §2 has the numbers), then only changes whose output is the same.

- **For us**: `same.mjs` in 2 minutes instead of 4 — its three screens (mouse, finger, phone) walk at once in contexts of their own, and a snapshot reads the properties from a list made once instead of walking each element's style declaration (five times faster, byte-identical text, proved on every element). The window test is 126 s, 47 s of them sleeps that wait for the app's own animations — left as they are. The full `npm test` is about 3 minutes.
- **For the app**: the packed engines and font are decoded by a plain loop (`Uint8Array.from` with a function was the single largest cost at start: 154 → 11 ms of a 600 ms first frame). PathKit gets our paths as numbers and gives them back as numbers (`_pk`, `_from_pk`; the SVG-text round trip cost more than Skia's own work: 2.3 ms against 0.3 for a ten-figure word) — a slider step on a heavy ring 40 % faster (the Gauge's Scale ring 40 → 22 ms, Rally 16 → 7). A stroke's round caps come back as conics, which have no place in our commands: that one path still goes through the text, as before. Coordinates are now exact to the float, not to five decimals; a file may differ from before in its fifth decimal.
- Not changed, and why: the page's parse (~350 ms of the first frame) is the one-file build (R30) — gzip on the wire covers the download; `JSON.parse` for the big lists was tried and gave no gain above the noise; the rest of a slider step is Skia on text outlines.
- Checked: labels, links, the moment, parity, the window test whole.

## beta 4.94 (web version) · 25 Oct 2026 — the step: app.js in parts

Okay, 25 Oct 2026, 11:56: "Split app.js into how many as makes sense. Light load smooth running operation. Here and for users. Do 542 too."

- **`app.js` split into parts** (#69): the one class of 7,100 lines is now `app.js` (the tool: its class, start and lifetime, 650 lines) and sixteen files, one per part of the window — `ui.js` the shared helpers · `icons.js` every icon (R33: the icon pipeline reads it now) · `rows.js` the ROWS tables · `session.js` links, saved dials, undo · `panel.js` panes, rows, the controller · `rings.js` · `hands.js` · `windows.js` · `colour.js` · `fonts.js` · `preview.js` · `guides.js` · `bar.js` · `cards.js` · `export.js` · `mode.js`. Each part exports one object of methods, put on the class in `app.js` (`Object.assign`), so `this` in any of them is the tool; nothing was rewritten, every method moved whole with its comment. The rows' callbacks (`show`, `title`, `text`, `info`) get the tool as an argument instead of reaching for the file's `tool` variable. Each file starts with what it is, for a reader.
- **#542 built**: (a) on-path text keeps its kerning — the word is shaped once and each letter stands where the kerning puts it (`letter_places`), one shaping per word instead of one per letter; (b) a tapped control on an iPad no longer keeps its hover look — every `:hover` rule stands under `@media (hover: hover)` (R32); (c) the colour pop-out stands over the Guides and Shadows lists; (d) the geometry no longer reads the clock — the window tells it the day (`set_today`, R6), so tests draw one fixed day; (e) the mode change is moved by the swoop alone (the `transitionend` fit that could snap it a frame early is gone — #511's flash, to verify on Safari); (f) the controller's row ids end in `-pop`, so no id stands twice; (g) up, down and delete in the ring list are faint when they can't act (R16); (h) the Shadows pane's picture and the controller's timings are read from the stylesheet's tokens (`token()`), written once (R32); (i) the window's own document and window listeners are registered (`listen()`) and taken off when the tool closes.
- **Load** (measured here in Chromium; an Intel Mac is slower, #14 has the figures): a frame while time plays 0.2–0.6 ms on every Gallery dial; a slider step on a ring 2–40 ms, the cost Skia's own (removeOverlap, expandStroke on text outlines); the page opens to its first frame in about 0.55 s with 36 MB of heap. Taken: `_wound()` tests a contour's box before counting crossings; the Gallery's and examples' pictures at a tenth of a millimetre (the page 4.82 → 4.69 MB). The engines, the font list and Inter are the rest of the page, by design (R30, R35).
- Checked: the full `npm test` (parity, labels, links, complications, Wear OS, the window, the icons), `same.mjs` against 4.93, the screenshots.

## beta 4.93.2 (web version) · 25 Oct 2026

- **Six more of Peter Wiegel's fonts in the list** (#501; Okay, 12:02: "Go with 1"): Berliner Wand, Böcklins Universe, CAT Childs, CAT Robertson, CAT Stack and Varieté (its main cut), all SIL OFL, from Okay's own download of Wiegel's CAT Fonts zip. `web/fonts.mjs` has a source for such files, `catfonts`: kept by hand in `web/fonts/`, never fetched. 75 families now; the list 1.0 MB, 0.41 MB as loaded.
- **The site's fonts folder is filled at every push**: `tools/release.sh` copies `web/fonts/` up to the site's `fonts/` (where both pages fetch a font from) with every dev push and every step. The folder had only ever been copied by hand, before #501, so the 28 families of 4.92.21 were not online until this push.
- Left out of his download, and why: Questa (its desktop licence forbids web embedding; installed on his Mac it shows under Installed), Banana Serif (a brand's own font), and the families not in the tier list (to come only on his word).
- Checked: links, labels, complications, the window test; the six in the sheet on a screenshot.

## beta 4.93.1 (web version) · 25 Oct 2026 — the code audit

Okay, 25 Oct 2026, 02:46: "get this software tip top position code wise … fix all the bugs, known flakes". Three review passes over `web/src` (the window, the geometry and files, the stylesheet) and a peer audit of the fixes; nothing new to see on the dial unless a fix says so.

- **Links**: with Bevels % moved, a dial whose hands were still the starting hands came back with the plain hands (`{ bevel }` alone replaced the hand; `lean()` now writes such a hand whole) — a `linktrip` case holds it. An unreadable link of this scheme (cut short in a paste) is said on the preview and in the log instead of quietly opening the last session (R17, R31). The Gallery's and examples' cards no longer switch the guides on when opened (`card()` carried `guides: true`; against #485's "all off"); a disc hand's painted mark turns in a card as it does in a file.
- **Files**: the Wear OS sprite sheets drew today's date, weekday and moon on every frame (a window that follows the bar's date overwrote the frame's) — each frame its own now, the day sheet in the window's language and form (`day_list`), and `wearos_test` counts distinct frames; a label in the APK's string pool is cut by whole characters, never inside one. A mask per ink (#35) lists one numeral's own colour too (`inks_of`). On-path text at a radius of 0 wrote NaN into SVG and PDF; a hair of a radius now. `svg_document` with X-ray on threw on the discs' dashed edges (fill null); a line item is drawn as a line; the Tiny Preview leaves X-ray out (R26). A dark red or magenta in show mode could be written as "#3e-f0f" and drew black: `clampL` goes through `hex2hsl`/`hsl2hex`. A date that is not a day (any text in a link) is today, never NaN in the moment.
- **The window**: the Shadows pane listed hidden rings and hands (`show` is no key; `on` is). A name or value button dragged on a row that stands for another setting (the Shadows pane's ink rows) wrote `S.ink`, a key that is no setting; the drag goes through the row's `put` as `build_row` does (R34). Undo left the controller on the page over nothing; it closes, and so does one whose row has gone. A named slider's controller (form D, R15) opened bare — it is the full one. X and G do nothing in show mode (no X-ray switch, no guides there). The font sheet no longer jumps back to the ring's font at every keystroke of a search (R35: on opening). A strap of 0 (an older file) lights Leather. `close()` clears every timer of the tool and takes its menu list and tag off the body (one more of each per dial opened before). A link that can't be packed is said in the log (R17).
- **The stylesheet** (R32): four show-mode rules of `4c-rows.css` stood outside their layer (a brace closed it early) and beat every layer by accident; the bar's `--handle` (a width) and the handles' `--handle` (a colour, set by `app.js`) were one name — the bar's is `--day-handle`; a colour not chosen in a guide's popup was dimmed twice (0.4 × 0.4): the old dots block is gone with the old Thickness-line rules it overrode, `.popfoot` too; nine `[hidden] { display: none }` repeats gone (`0-order.css` has the one); bare values put on tokens (`--dim`, `--ruler-line` … `--ruler-small`, `--tiny-fade`, `--three-quarter`, `--sign-18`, `--sign-16`, `--tip-half`, `--track-20`; `--hair`, `--glow-line`, `--track-100` where they already fitted); `100vh` → `100dvh` on the colour pop-out and the steps list (iPad's bars); `-webkit-overflow-scrolling` gone. Proved with `same.mjs`: the one look change is the guide popup's dim.
- **Dead code gone**: `wave`, `cross_dot`, `faint`, `A`, `SPIN_MS`, `this.opened` and four locals in `app.js`; `high`, `layers` and the per-frame `built` map in `geometry.js`; `brighter`, the unused rib patterns and six locals in `watch.js`; the English-only `day_labels_for`.
- **The tests** (#541): a test init script touching `localStorage` at the document's start loses a file:// page's storage at its next reload in Chromium (7 of 30 reloads; 0 of 30 with the touch deferred a task) — every test's init script now waits a task, so the short address's reload and "the last session is back" are steady; the settings file's load waits on the app's own word and hands the file over once more if none comes; a shadowed key (`three`) in a font-sheet check now reads what it meant; `same.mjs` lets a forced state's transition finish before reading it (the switches' unfolding words differed between two saves).
- Noted for Okay (#542): on-path text's kerning, hover kept after a tap on the iPad, and the rest of the audit's findings that would change a look.
- Checked: the full `npm test` (parity, labels, links, complications, Wear OS, the window, the icons), `same.mjs` against 4.93, the screenshots.

## beta 4.93 (web version) · 25 Oct 2026 — the step

- **Released to main**: the Guides list in one column (#539, 4.92.29) and the Shadows pane (#526, 4.92.30–33) — plus everything on dev since 4.92.1: the font library's Google and Noto fonts, the filters and the Installed tab (#501), the short address (#537), link scheme 5 and Arimo (#228), a set of saved dials as one link (#523), Help → the help page (#538), the Guides popup's handles (#527), Shenanigans as toggles, show mode's Colours per ring and hand (#521), one numeral's own font and colour (#513), custom day names and am · pm words (#515, #516), hand bevels on the dial side (#531), the controller's value over the knob.
- Checked: the full `npm test` (parity, labels, links, complications, Wear OS, the window, the icons), the screenshots.

## beta 4.92.33 (web version) · 25 Oct 2026

- **The Shadows pane's balance** (#526; Okay, 02:29, his marks: "This balance is what I'm after"): the sun box runs wide up to the sliders' column, same height; Angle · Height · Strength stand at the right edge, their column as wide as the squeezed slider; the exploded view is titled *Components* as the sun box is titled *Sun*; every corner of the pane round. A press on the sun's picture is read through the picture's scale, so a wide box places the sun right.
- Checked: labels, links, the moment, the window test whole, the screenshots.

## beta 4.92.32 (web version) · 25 Oct 2026

- **The Shadows pane squeezed** (#526; Okay, 02:20, his marks: "SQUEEZE sliders"; "In aligned with rings tab above. Right side stays still"): its left edge on the Rings tab's left edge, its right edge still the switch's; every slider shorter — 100 on a part's row, 160 beside the sun (`--shade-slide`, `--shade-slide-top`) — the rows as wide as they need, the exploded view takes the rest.
- Checked: labels, links, the moment, the icons, the window test whole, the screenshots.

## beta 4.92.31 (web version) · 25 Oct 2026

- **The Shadows pane laid out as Okay marked it** (#526; 25 Oct, 01:27–01:47): the panel's width (424); the sun's picture at the left (224 × 204, the figures gone from it) with **Angle · Height · Strength stacked at its right**, each name over its slider and **the value riding in the knob** (form D: "numbers on the buttons since we have nowhere else to write"); an ink hairline across, with the inner box's room over and under it; then **the rows at the left** (the Hands tab's side rows: name · slider · number box, names as long as "Minute ticks") and **the exploded view at the right edge**, outline only: one axis, every part centred on it, the cap a small disc, a hand its pipe on the axis with the hand out to the right and a tail left, each ring a thin ellipse, the plate wider with its hole and a window, the discs dashed under it; y follows the heights and no two parts come closer than a gap; the stack is centred in its frame by its extent; the part pointed at, focused or with its controller open is white (`stack_picture()`, `shade_light()`). "Dial" is "Plate" here (the glossary's word).
- **The pane opens over the panel's column** (Okay, 02:02: "This has to open on the left so we'd see the shadow on the dials"; 02:09: "similar to fonts left margin and organically one side full touching connection kept with button. Above button"): from the panel's margin to the Shadows switch's right edge, standing on the switch with its corner there square; on the body (the canvas clips what it holds); the room inside it one margin all round, the line across with that room over and under it; a press elsewhere or Escape puts it away; the dial stays in view.
- **The rays** (Okay, 01:58): sixteen; Strength lengthens them; the farther the sun, the more are hidden — 5 % near the dial, 75 % at the corners — the ones facing away from the dial first, the ones toward it always kept ("Imagine magnet attracting iron shavings"). **The stack**: rounder ellipses (height 0.42 of width), the rings spread evenly to the frame's width, a visible dashed centre line.
- Tokens: `--sun-w`, `--stack-w`, `--stack-line`, `--stack-name`; the pane's own names column and short sliders are gone.
- Checked: labels, links, the moment, the icons, the window test whole (the Shadows pane section rewritten), the screenshots.

## beta 4.92.30 (web version) · 25 Oct 2026

- **The Shadows pane rebuilt from Okay's drawing** (#526; his answers of 24 Oct, 21:50, and 25 Oct, 01:20): the sun's picture on top — the dial as a ring, the sun outside it with eight rays pointing away from the dial, longer the farther the sun ("Rays can grow on distant suns"), cut by the frame near a corner; a dashed disc on the far side where the shadows fall; the three figures along its foot. One finger or the pointer drags the sun: round the dial for the angle, toward the middle for higher; the sliders follow. Under it **Angle · Height · Strength** as three named sliders (R15, form D, new). Then the parts, exploded, top to bottom as they stand — Cap · Seconds · Minutes · Hours; every ring's ink height under *Inks · 0 to 10* (the same number as show mode's Colours, #521); Dial, the reference; Date discs under the plate — each with a small side-view drawing (`PART_PICS`), grey, white while that part is sized (pointed at, held, or its controller open). The foot on the night field: Soft edge · Bevels % (a quiet number) · Reset, one line.
- Rows: `pic` puts a drawing before a row's name; `named` makes form D. Tokens: `--sun-h`, `--sun-ray`; the pane's names column 110, its sliders 78.
- Not yet: the same sun picture on show mode's Light tab (decided 24 Oct; a push of its own).
- Checked: labels, links, the moment, the icons, the window test whole (new: the Shadows pane section), the screenshots.

## beta 4.92.29 (web version) · 25 Oct 2026

- **The Guides list rebuilt in one column** (#539; Okay, 00:10: "One column of items instead of two. Sensible width, 75% of now. Better spacing, better design. Categorization is impeccable"; built from his marks on two drawings, 00:29–00:39): 240 wide; four groups — **Dial** (the centre hole, the centre lines) · **Rings** · **Windows** · **Added** — each a bold heading over its lines, the lines inset two units under it ("inset tiered layer system"), one hairline under every line, every line ending on one right edge. A line: its name, its colour dot and its chevron each in a 20 px circle, concentric ("If something can be a circle, is"); the selected ring's or window's name in a filled pill ("Selected one gets its own personally tailored one word pill"). The headings' *Selected · All · None* are chevron boxes opening the tool's own list (R15, "can be a dropdown to gain width"); Added's minus a circle. One foot on the night field: Add with Line · Crosshair · Circle as free pills, Thickness 1 · 2 · 3 a pill switch (the chosen one filled), Reset All a quiet word; the colour box's chosen colour ringed by its circle's edge in ink.
- Gone: the two columns, the foot's two tiers and the three tokens they needed (`--guide-col`, `--guide-add-gap`, `--guide-foot-light`), the outlined-pill menu and its box (`gpill`, `gdrop`; R15's exception). New tokens: `--guide-list` 240, `--guide-circle` 20, `--guide-inset`, `--guide-pill-pad`.
- Open: Okay asked for 1–2 px more inside the foot's pills; at 240 the Add line has no room for it (its right edge is the lines'). A unit it stays until he chooses: wider, or the words as they are.
- Checked: labels, links, the moment, the window test whole (new: the column, the foot; the NATO's pill count now the panel's alone), the screenshots.

## beta 4.92.28 (web version) · 24 Oct 2026

- **The Guides list's foot in two tiers** (#527; Okay, 23:32: "Bottom gray area, two tiers. Bottom lighter because bottom row solids don't get bg, they all simply outline. Unless clicked"; marks "GAP VERTICAL", "ADD HR. LINE"): Add with the same 12 px over and under it, its boxes solid; a hairline; under it a lighter tier where Thickness is an outline pill with the chosen number filled ("Box outlined, chosen number filled") and Reset All an outline, filled while pressed. Add's boxes and the lower line share their left and right edges (one grid for both tiers).
- **The font sheet** (R35, #501): the filters' box hangs from the search bar, as wide as it, down onto the list's top line, a tab of the list beside Dial Tool's fonts · Installed (Okay, 23:48–23:51: "Pills inside a box that's attached to the search bar. Not equal pills. All pills fit word shapes like gloves"; "The tab can shrink and attach to lower window"); each pill as wide as its word. In a narrow window the box runs the sheet's width under the search bar, closed at its foot. The numerals bigger (26 px, was 20: "ENLARGE NUMS"); a row's stickers on one line, fading out at the column's edge ("Bigger numerals, stickers on one line").
- To confirm: the lower tier's grey (#5F5E5A) is Claude's choice.
- Checked: links, labels, complications, the window test (new: the foot's two tiers; the filters' box; the numerals' size); both on screenshots, the sheet also at phone width.

## beta 4.92.27 (web version) · 25 Oct 2026

- **The Guides list's spacing, Okay's marks of 23:21** ("Lines need spacing, close repeating lines need more space"): the white line two units off the last row's rule; the last added line has no rule of its own where it meets the foot; Added's minus a square; the Add line 12 px under the foot's top and 5 px over Thickness ("Top = 12px", "Bottom = 5px", specials); Add and Thickness share one grid, Line · Crosshair · Circle three equal boxes from the Thickness box's left edge to the right edge, the Thickness box from there to the rule, 1 · 2 · 3 spread in it.
- Checked: links, labels, complications, the window test; the list on a screenshot.

## beta 4.92.26 (web version) · 25 Oct 2026

- **The Guides list, as drawn — round two** (#527; Okay, 23:07: "pills chevrons you misinterpreted"; his companion picture with the menus open): a guide's line is its name, its colour dot and a **chevron**; the chevron (or the dot) opens a small rounded box under the line, None and seven colours in two lines of four, the chosen one ringed in its own colour — black is left out ("Drop the black"; still in the list, R9). None hides a guide: its dot an empty ring, its name grey. No tick.
- Rings' and Windows' menus are **outlined pills** with their choice; pressed, a small box with Selected · All · None opens in the pill's place (R15 notes the exception).
- Rings · Windows · Added in grey, regular; Added's minus a rounded square; Thickness 1 · 2 · 3 on a dark box, the chosen one ringed.
- Checked: links, labels, complications, the window test (its guides checks follow the new controls); the list at rest and open on screenshots.

## beta 4.92.25 (web version) · 24 Oct 2026

- **Added guides are dragged on the preview** (#527; Okay: placed "Both" ways): while the Guides list is open and the guides are on, each added guide has a handle in its own colour, as a ring's handles are drawn — a line a triangle on it at four fifths of the dial's radius, dragged round (0–180°); a crosshair a square on its point, dragged anywhere; a circle a disc on it at half past four (clear of the list), dragged in or out. Their numbers in the list follow; pressing a handle doesn't put the list away. A hidden guide has no handle.
- Checked: links, labels, complications, the window test (new: a crosshair and a circle dragged by their handles, their numbers following, the list open).

## beta 4.92.24 (web version) · 24 Oct 2026

- **The Guides popup, as Okay drew it** (#527; his answers: "Which rings show guides", "Both", "The last added", "Steps of today's", "A small popup by the dot"): two columns — Rings at the left with its menu (Selected · All · None) on its heading and a line per ring; the centre hole, the centre lines and Windows (its own menu) at the right. A white line, then *Added* with a minus that takes the last added away, its lines in the right column. A guide's line is its name, its colour as a dot and a tick: the dot opens None and the eight colours under its line (the chosen one ringed in its own colour); the tick hides it and brings it back in the colour it had. Under them, always in view: Add · Line · Crosshair · Circle; Thickness 1 · 2 · 3 (steps of 0.75, the start) · Reset All.
- Under a finger a dot and a tick are pressed from just outside them; the colours hang under the line, so their reach never covers the dot.
- Not yet: dragging an added guide on the preview (the second push of #527).
- Checked: links, labels, complications, the window test (its guides section rewritten for the new popup); the popup on a screenshot.

## beta 4.92.23 (web version) · 24 Oct 2026

- **Installed is a tab over the font list** (R35, #501; Okay, 22:45: "Two tabs over the list"): *Dial Tool's fonts* · *Installed*, standing on the list's top line as the hands' tabs do, shown only where the browser can read this computer's fonts (Chrome, Edge). Installed asks the browser the first time; its fonts are found by name, so the filters step out of sight there (keeping their room, so the list doesn't jump). The Installed button at the foot is gone; a link and a file share the two columns with their second lines. A family both added and installed stands in both tabs, each with its own styles.
- **The sheet opens where it was left**: its tab, search and filters, kept in this browser; scrolled to the ring's own font ("The ring's font").
- Checked: the window test (new: the tab, the sheet reopened on Installed with its search and no filters, back to Dial Tool's fonts).

## beta 4.92.22 (web version) · 24 Oct 2026

- **The font sheet's filters** (R35, #501; Okay, 22:20, question mode: "A tray under the field"; "Any of them"): six pills in a tray hanging under the search field, in its outline — Sans · Serif · Variable / Condensed · Mono · Non-Latin (three lines of two on a phone). Each pressed adds its fonts; none pressed shows every font. Variable is a file with axes; Mono is drawn monospaced or has tabular figures; the rest the font list says (`kinds`). Fonts you added or that are on this computer show only with no filter pressed.
- A font from the list that has been loaded keeps what the list says of it (kinds, axes, features); Inter, the page's own, counts as a sans.
- The sheet's header lines the title and Light · Dark up with the search field.
- Checked: links, labels, complications, the window test (new: the filters, the tray as wide as the field and under it); desktop and phone on screenshots. A settings file's load stalled twice in the window test tonight and passed on reruns; the check now prints the app's log if it stalls.

## beta 4.92.21 (web version) · 24 Oct 2026

- **Twenty-eight more fonts** (#501; Okay, 21:50: "501 is on, priority"): the middle tier's eighteen on google/fonts (Aboreto, Anta, Audiowide, Big Shoulders Display, Black Ops One, Courier Prime, Gilda Display, Julius Sans One, Krona One, Libre Caslon Display, Limelight, Major Mono Display, Pathway Extreme, Sirin Stencil, Stardos Stencil, Syncopate — Apache 2.0, Tenor Sans, Zen Dots) and the ten non-Latin numeral fonts (Reem Kufi, Noto Sans Bengali, Noto Sans Devanagari, Vazirmatn, Noto Sans Indic Siyaq Numbers, Noto Sans Mayan Numerals, Noto Serif Ottoman Siyaq, Noto Sans Tamil, Kanit, Noto Serif SC). 69 families and Inter; the list's outlines 0.87 MB in the page (4.79 MB in all).
- A non-Latin numeral font shows its own numerals in the sheet, left to right. Noto Serif SC (25 MB whole) is cut to Latin, digits, Chinese numerals and the date's words (167 kB); its licence has no Reserved Font Name, so a cut copy may be passed on. Every other file is whole.
- Each family says what it is (`kinds`: sans · serif · condensed · mono · nonlatin) for the sheet's filters (R35), which come next.
- Not in yet: Wiegel's 31 and Railway Sans — their sites can't be reached from a session or from Okay's Mac's shell.
- Checked: the window test (the sheet lists every family, each with numerals in its own outlines; a long name drawn at 70 % then cut, the name column's law); the sheet's end on a screenshot.

## beta 4.92.20 (web version) · 24 Oct 2026

- **Help opens the help page** (#538; Okay, 21:52: "new help is in, link it there"): the Help link beside the version opens https://duztman.github.io/dial-tool/help/ in a new tab; the guide is linked from the help page's top.

## beta 4.92.19 (web version) · 24 Oct 2026

- **A set of saved dials as one link** (#523; his answers in question mode: the Share pane · Compare · ask first · saved dials only): *Copy set link*, under Copy link in *Share dial as link*, shown with two saved dials or more (R16), copies every dial under Versions in one link (`#V5…`: the dials' names and link texts deflated together; three dials ≈ 780 characters). Opened elsewhere, the address goes short (#537) and the set stands in Compare, its pictures drawn there once their fonts are in; a note asks *Add to my Versions* · *Just look*, and says how many of the receiver's oldest an Add replaces. Nothing is kept until Add. A press on one of the set's dials edits it (the receiver's own saved dials stay unpickable in Compare). A set of an older scheme says so on the preview (R17).
- **Saved dials survive a new link scheme**: a dial saved under Versions keeps its whole settings too, so a scheme change (R31) no longer stops it opening; dials saved with only their link are read from it, scheme 4 too (4.92.18's change had left them unopenable). *In a new tab* opens today's link.
- **The font sheet's shadows are solid** (Okay, 21:39: "make it solid 50% opacity. no fancy, static left plus bottom"): black at 50 %, no blur, two units left and two down; its legend one and one (`--shadow-solid`, `--shadow-solid-near`).
- **Show mode's switch has no tag and no tooltip** (21:39: "show mode tooltip no need and incorrect on desktop").
- Copy link's look (its sign beside its word) is the `copylink` class anywhere, not only on a heading line.
- Checked: links, labels, complications, the window test (new: the set link end to end; the Guides switch measured with the pointer moved off, since a name shows under a pointer, #518).

## beta 4.92.18 (web version) · 24 Oct 2026

- **A ring's starting font is Arimo** (#228; Okay, 21:05: "Helvetica not a bundled font. Bundled fonts are all free to use"): bundled (Apache 2.0), Helvetica's proportions, so the Type pane no longer says "not loaded" with Inter standing in. The DrawBot-era key `ty_family` follows. Settings files that name Helvetica Neue keep it.
- **Link scheme 5** (R31): a link that left the font out meant Helvetica Neue, so it would now draw Arimo; links of scheme 4 open the First dial with the older-link note. The Gallery and the examples are written again (`node gallery.mjs`, `node examples.mjs`).
- Checked: links (scheme 5 there and back), labels, complications, the window test; the starting dial's numerals in Arimo on the screenshot.

## beta 4.92.17 (web version) · 24 Oct 2026

- **The short address** (#537; Okay, 19:40: "hide the full address and make the link still work"; 20:45: "OK, Copy link only"): a dial's link opens its dial, keeps it in the session, then the address bar shows only the site's address. Copy link copies the whole dial; a reload brings the dial back from the session. In a private window, where nothing can be kept, the address keeps the dial (R17). Bookmarks and the iPad's share sheet give the bare site.
- **SVG places made ready** (#530; "spaces set. Moon, ampm, dial only"): one note, *Your own picture, from an SVG file, comes after v1*, under a moon window's Picture, under an am · pm window's Shows, and on the Dial tab's Background line.
- **Add image… is gone** (#218, a dead end, R17): Background holds the note instead.
- R31 names link scheme 4 and the short address; the glossary's *Link* too.
- Checked: links, labels, complications, the window test (new: the address short after a link opens, after Copy link and after a pasted link; a reload keeps the dial; Background is a note and no button), the three notes on screenshots.

## beta 4.92.16 (web version) · 24 Oct 2026

- **Show mode's Colours names its number column**: INK HEIGHT on the Dial line, in black small capitals, over the rings' ink boxes and the hands' heights (Okay, 20:26: "Is that column not ink height? Labelling there in black would be ok").

## beta 4.92.15 (web version) · 24 Oct 2026

- **Ink per ring, and per hand, in show mode's Colours** (#521; "Yes, as drawn"): each ring's line is its eye · name · colour · its ink height in a number box; each hand's is its eye · name · colour · a Bevel toggle · its height (the dial side's shadow heights). The cap's colour is a square on the line of the hand it sits on ("A swatch on its hand's line"). Colours there are squares, so the names keep their room. The Ink pane's row is *All inks at once*: it moves every ring by the same amount, each keeping its step from it ("adding to or subbing from each same amount"). A ring's step (`ink_d`) is kept in the file and the session, not in a link.
- **Shenanigans on two lines, no bar** (19:57: "Remove vertical white bar"): Shadows · Blurs · Gradients, then Flare · Bevels · All.

## beta 4.92.14 (web version) · 24 Oct 2026

- **Shenanigans' toggles, his marks of 19:40**: off, all black — the outline, the dot, the name ("Off; colors all black"); on, the name white, the dot at the right on the black-filled track ("On text white switch to the right and pill filled 'black'"); every line one height with the same room over the first and under the last, All centred on the block's middle in its third, its toggle on the same right edge ("Greens show equal paddings and alignment").
- Noted for later: a short address that still opens the dial (#537).

## beta 4.92.13 (web version) · 24 Oct 2026

- **Edit one numeral gives one numeral its own font and colour** (#513; "gets font (with it color) change"): a *Font* row (its font's name opens the font sheet for this numeral alone; *As the ring* takes it back) and a *Colour* pill. The font is kept with the numeral's nudges (`nudge[i].family`, `ps`, `axes`) and fetched when used (R35); the colour is the ring's colour for that position (`cs`, the band's sector colours' key), drawn as a shape of its own, as a band's sectors are. *Reset this numeral* takes both away with the nudges. Marks get theirs with #349.
- Checked: links, labels, the window test (a check added: the 3 in Barlow SemiBold and red, two shapes, reset back).

## beta 4.92.12 (web version) · 24 Oct 2026

Okay's answers of 20:50:
- **A numeral's Size slider runs to the dial's diameter** ("Dial's diameter"; #535): a row's slider end can follow the dial (`top`), typing past it still works.
- **Gradients in Shenanigans** ("Both"): off, show mode has no gradient — the backdrop one colour, Dramatic without its spotlight, the case's outline one even light (`w_gradients`, file and session, not the link). Five toggles, two to a line beside All.
- **Show mode casts the dial's shadows as the dial side does** (#519; "Dial side's"): each hand from its own height (`sh_hour`, `sh_minute`, `sh_second`, `sh_cap`), as long as the sun's height throws it and no longer than a 20° sun, at the dial side's darkness. One offset for every hand before.
- Checked: the window test (Shenanigans' check counts five); both modes' shadows side by side under one sun.

## beta 4.92.11 (web version) · 24 Oct 2026

- **Your own day names** (#515; "Or custom (open 7 slots, 7 input boxes when so)"): *Written* gets **Custom**, third (R9), and seven fields under it, four to a line, each showing its day's short name faintly; a blank one draws that name.
- **An am · pm window's words** (#516; "Am/pm gets two sub options, one is this disc, other is a typed out am pm default jump mechanism, allows custom text, opens up inputs like the week"): *Shows*: Disc · Words. Words draws AM or PM (or your own two, typed in two fields like the week's) in a rectangular hole, jumping at noon and midnight; *Jumps* and *Inside the case*, which are the disc's, hide (R16); its two colours read *Disc under it* and *Text*.
- One mechanism for both: a window's `own_names` (null, or the words; a blank = the tool's) and the fields row `own_names`; `ampm_form` 0 the disc, 1 the words. Both keys appended to the link keys, starting as every older link draws (R31); a link carries the words (checked: Cuma!, sabah, akşam there and back).
- Checked: links there and back, the complications test (a check added), labels, the window test; crops of a Custom day window and an am · pm window in Words.

## beta 4.92.10 (web version) · 24 Oct 2026

- **Hand bevels back on the dial side** (#531; "bevels are lost on this current version on tool side. Bring them back"): the Bevel tick stood beside Show only while Shadows was on, and the dial side opens with Shadows off, so it was out of sight. The tick now shows whenever its hand does, and a hand with it ticked is bevelled by the sun's direction with Shadows on or off (at Bevels %, the Shadows popup's). The join options (Normal · Miter · Round) come after v1.
- Checked: the window test; a bevelled hour hand with Shadows off, looked at.

## beta 4.92.9 (web version) · 24 Oct 2026

- **Shenanigans, after his drawings** (#525; 19:04, 19:08): a **toggle** each, no words — off, its outline with the dot at the left and the name dark; on, the dot white at the right on a filled track ("A dot travels … Apple style … Off text label also goes black"); Shadows · Blurs over Flare · Bevels, **All** alone in the third column behind a white hairline, turning the four on or off together; the top white line across the column's whole width ("look at the white lines, they are crucial"); three equal columns, each name set right against its toggle so the toggles stand in line, in small capitals, tracked 50, weight 500 ("Try all caps small. Bit more tracking bit weight"). No heading. The toggle is `seg` with `bool` (R15); `.dot` was already the swatches' class, so its dot is `.knob`.
- **The NATO** (#524; "Nato colors should be selectable. One solid option. Options can be free living single pills"): its seven patterns as free pills, wrapping, **Solid** last (R9); a swatch for each stripe (Solid one, colouring all three), starting from the pattern's colours in the style's tones (`nato_colours()` in show.js); a pattern taken again starts from its own. The colour rows read and write part of a setting through `get` and `put`, as other rows do.
- Checked: the window test, two checks added (Shenanigans' toggles and All; the NATO's pills and swatches).

## beta 4.92.8 (web version) · 24 Oct 2026

Okay, 18:43:
- **Show mode's rays shine instead of spin**: a 45° part turn over 1.1 s, eased ("too fast to read as something shining briefly. Faintly. An eased less rotation motion"); they run on past the box behind ACTIVATE SHOWCASE, whole in the box, a third just past it, fading to nothing ("Extend behind text at all times"); the words stand over them.
- **The stack, bottom to top: show mode, the dial alone, the Tiny Preview** ("Lowest is activate middle normal, top mini"). The Tiny Preview opens inside the canvas's padding ("Mini appears within canvas inside normal view padding").
- **The controller's darks are true black**: its discs and the knob ("Controller darks actual black now").
- Checked: the window test (the stack's order, the eye over show mode's switch, the discs' black), the icon check.

## beta 4.92.7 (web version) · 24 Oct 2026

- **The controller's value rides over the knob** (Okay, 18:31: "Shrink to the size of the numbers, make it follow the slider button all the way in its lane. Grey bg persists, name goes back below, normal size. Buttons a bit more smaller %15"): its grey pill as wide as its figures, placed by the slider's own place (`--p`): its left at p of the lane less p of its own width, so it meets each end as the knob does — no script. The name back between − and +, at 15 semibold; − and + at 85 % (29.45 px), the signs redrawn at that size (R33); corners still concentric (27.1). A field that can't size to its text (older Safari) keeps five figures' room.
- The font sheet's check allows the bar's 1 px rounding (837 or 838, seen in three runs).

## beta 4.92.6 (web version) · 24 Oct 2026

Okay's notes of 17:54, settled in question mode:
- **The controller's top pill holds the name at the left and the value at the right**; − and + at the two ends of the foot, nothing between. The discs and the top pill are 70 % of before (35 px), the slider's pill stays 50 ("Keep slider big"); the signs redrawn at their new size (4.2 thick on 23.1, R33).
- **Its corners are concentric** with the discs: their round plus the padding, 29.7 (37.1 before) — the law of his `controller 2.svg`.
- **Its ground multiplies with what is under it, or screens on a dark ground** — dark as the canvas counts it (the test that turns the switches white) or show mode's column. Drawn as a twin under the box (`.numground`): a blend inside the box would blend with nothing, the box being a layer of its own. The 85 % opacity token is gone.
- **Show mode's switch wears the rays, the dial alone the eye** ("switch activate showcase to rays and regular eye to regular preview"); the rays turn once as ACTIVATE SHOWCASE unfolds and once back as it folds (0.25 s, the words' own time). **Tags** on the three: Tiny Preview · Show mode · The dial alone.
- Checked: the window test (the controller's two checks hold the new measures: 188 × 156, discs 35, corners 29.7, the ground's multiply), the icon check, the rays' turn measured (0 → 146° → 360° open, and back).

## beta 4.92.5 (web version) · 24 Oct 2026

- **The controller is as wide as the row's controls** (#514; Okay, 24 Oct 2026: "as wide as two columns"; "On very wide coluns, controller takes over and spans exactly as wide as the slider below … slider overlapping slider"): everything right of the row's name, slider and number box — about 250 px in the panel (it was the drawing's 188), the whole slider in show mode's two-line rows, where it now lies exactly over the row's slider. Opened from a row it stands over that row, its slider on the row's; from a value button (outside a row) as before, where pressed. Never narrower than the drawing.
- **Its name between − and +**, untouchable ("the gap between plus and minus becomes a good place to just untouchably write the name"); a linked pair's LINK disc keeps that place. R15 rewritten: it said "No name".
- Checked: the window test (the phone's controller check measures the row's controls now), crops of Diameter's and show mode's From.

## beta 4.92.4 (web version) · 24 Oct 2026

- **The canvas switches show their signs alone** (#518; Okay, 24 Oct 2026: "All canvas buttons, labels default hidden. Like on mobile, load with animation. On desktop hover on icon reveals the name"; "Labels appear when canvas empty area clicked"): Guides, Case, X-ray, Versions, Backdrop and Shadows are squares; their words unfold for 3 s when the page opens and after a press on the empty canvas, and under the pointer on a Mac. One mechanism for every width: the phone's (`main.words`, `words_unfold()`), moved out of `8-narrow.css` into `6-preview.css` (R34). A switch is filled with the backdrop's colour only while its word shows (Okay, 15 Oct 2026), never in show mode.
- Case's chevron folds with its word; it has no square of its own any more.
- Checked: the window test (two checks follow the folded words; the font sheet's check measures in two steps and prints the bar's top and the sheet's foot: it missed by 1 px, 33 for 34, in some runs and not others, both with 4.92.3's stylesheet and this one), crops at 1440, a phone's 390, and show mode.

## beta 4.92.3 (web version) · 24 Oct 2026

Okay's Oct 24 notes, group 1 (small things; build list group L):
- **Versions on the top line**, a unit after undo · redo · ⌄ (#517) — the phone already had it so; one rule now for every width.
- **Every chevron on the canvas points down** (#518): Case's and Shadows' turned; open, each turns as Guides' does.
- **The Plate row is gone; the plate's colour stands on the Dial heading** (#533, his drawing).
- **Show mode**: Style's top dark rule removed — a pane with no heading draws no line over its first row (#534); the canvas switches (Backdrop) have no fill, so no patch on the gradient backdrop ("same as main").
- **Day names in full** (#515): a day window following the date gets *Written*: Short · Full (`day_form`, a window key, appended to the link keys; short to start, so older links draw as before). Full names are the language's own, in its capitals (SAMEDI, CUMARTESİ).
- **Export › Share dial as link** (was *Link to this dial*, #523).
- From the morning's session, on `dev` since: Edit one numeral lists only what is drawn, by its own words (#513); show mode's Case tiles are filled silhouettes (#520); show mode's Colours scroll with the rest (#521).
- Checked: `npm run small`; crops of the canvas buttons, the Dial pane, show mode's Light tab and a full-name day window.

## beta 4.92.2 (web version) · 24 Oct 2026

- **The pane "Nudge one numeral" is called "Edit one numeral"** (a ring of marks: "Edit one mark"), the first of Okay's Oct 24 notes (build list #513; "Nudge one numeral is named 'edit one numeral'"). The name only: the picker, the rows and the data are as they were; the font and colour for one numeral, and the picker's list, wait for his pictures (#513).
- The Oct 24 notes are build list group L (#513–#522), not built.

## beta 4.92.1 (web version) · 23 Oct 2026

- **Show mode's Colours list takes the Dial's colour first** (the plate, `c_plate`) and **a line for each window's disc** under the window's own (`disc_c`; none of its own shows white). Okay, 17:36: "Disk behind each window and plate color, yes." The dial side's Colours pane is as it was: the plate has its own row on the Dial tab, the disc under each window's.
- Checked: `npm run small`, a check for the two lines added to the window test; pushed to `main` and the released page as well, on Okay's word ("Push this update to main as well").

## beta 4.92 (web version) · 23 Oct 2026 — the step: the Show Case merged

The step that releases 4.90.1 – 4.91.15 (the Show Case into Dial Tool as show mode, #506–#509), with Okay's last notes of the day (17:07):
- **Shadows have a limit**: no shadow falls longer than a 20° sun throws it — the watch's hands, the strap's contact, the ground, and the dial side's shadows (`LOW_SUN` in watch.js; `sh_rise` read from 20 in app.js) — as the case's crescent already did ("Dial shadows move unnecessarily far, they'd have a limit").
- **The buttons' eyes**: show mode's switch has its eye again (the lids and the iris); the dial-alone switch takes the rays drawing, 16 rays at 0.75 ("Activate showcase back to old, replace regular preview with this version").
- Checked: `npm test` whole.

## beta 4.91.15 (web version) · 23 Oct 2026

Okay's notes of 23 Oct 2026, 16:38 — the merger's last round:
- **Shenanigans** at the foot of show mode's column, always in view on the top's darker ground: Shadows, Flare, Blurs, Bevels on and off — shortcuts to the same keys as their rows (`sh_on`, `w_flare_on`, `sh_blur`, the new `w_bevels`). A dial with Shadows off (as the opener) drew its watch without a shadow, and show mode had no switch for it.
- **Bevels in show mode**: the watch's hands are bevelled as the dial side says — each hand's own Bevel tick, at Bevels % — and Shenanigans turns them all off.
- **Metal is picture tiles**, as Case and Insert: each fits the column.
- **Scroll zooms everywhere**, both modes, no key ("Scroll to zoom in out, universal"); a right-button drag moves the drawing in both modes; the zoom note says so ("Scroll zooms · right-drag moves · two fingers pinch and move"). One wheel rule instead of three.
- **The opener is Okay's link** of today: its dial on a #97725B backdrop ("This view and #97725B for bg as default").
- **Main's case is charcoal** (the three greys at a third of their brightness: "65% darker").
- **Emre01 is Emre** wherever it is shown (its key stays `emre01`, R8).
- **The Show strip under a hand's or window's tab** stands on the chosen tab's measured edges: the tabs overlap a hair each, which engines place differently, so grid columns alone put it off its tab in Safari.
- **Icons**: the zoom note's sign is a lens with an i in it (Okay's drawing); the Shadows switch has its 4.38.6 drawing again (a ball, its dark side, its shadow); show mode's switch is the eye with rays (Okay's 4.39 drawing, 16 rays at 0.75).
- Checked: `npm test` whole (updated: the wheel and right-drag check, the zoom note's words).

## beta 4.91.14 (web version) · 23 Oct 2026

Okay's notes of 23 Oct 2026, 16:04:
- **The swoop carries no load** ("Case fades in fast after panel transition complete. During panel transition no load on the system"): while the panels move, the dial alone moves and zooms; the watch is drawn once at the end, in its place, and fades in fast (`--watch-fade`, 250 ms); going back it fades out first. Show mode's Fit knows the whole watch's frame before drawing it (`fullBox()` in watch.js).
- **The watch was drawn twice after every change**: its redraw key held a flag that flipped right after each redraw; gone.
- **Show mode opens on the Watch tab** (and remembers the tab after).
- **A press on empty canvas deselects** ("DESELECT anything that is selected (guides disappear)"): the selected ring's or window's guides, its handles and the picked numeral go until something is chosen again — on the dial, in the ring list, a window's card, the numeral menu, or a tab.
- **The Shadows pane wide again**: room for a slider between the names and the number boxes, Soft edge on one line.
- **An app, not a page** ("interface untouchable, like an actual app"): nothing in the interface selects by dragging and no browser menu opens on a right press, except in a text field; in show mode the right-button move ends as soon as the button is let go.
- Checked: `npm test` whole (new: the deselect and the Shadows pane; the hands turn without the watch being drawn again).

## beta 4.91.13 (web version) · 23 Oct 2026

Okay's notes of 23 Oct 2026, 14:59:
- **Into show mode and out in one movement** ("one zoom and done … Right column moves in when the left has left halfway. smoother, slower"): a still copy of the panel slides away (`panel_copy()`), the other mode's panel starts in from its side when the copy is halfway out; meanwhile the drawing moves and zooms once, eased, from where it stood to where it ends, the watch fading in over the dial (out, going back) — `swoop()` in app.js, each slide `--show-time` (1000 ms), the drawing over 1.5 of it. The show-mode rules are written on `.showing` (no longer `#app.showing`) so the copy's frame keeps its old mode's look.
- **Main's case is filled in** ("sillhouette means filled in. engineer without the lines, 3 shades of gray"): the Engineer's parts without a line, in three greys, the diver's insert grey too; no shadow, no strap.
- **No system dropdowns** ("system dropdown is no more, all around the app"): the canvas switches lit every child on hover, the unseen select over the case switch among them, so the browser's own select box showed over the button; selects are never lit now, and Space, Enter and the arrows on a menu open the tool's own list (whose arrows walk it).
- **Show mode, the mouse**: a right-button drag moves the watch; the wheel zooms, no key needed.
- **Watch drawing**: the bracelet's strips stand on a fill of their own and each row on dark metal, so no seam shows the backdrop ("gaps in the bracelet"); a NATO draws its buckle — frame and tongue, its bar where the strap ends — whose shadow alone was cast before ("ghost buckle"); the leather end's dark band stops a tenth of the strap's width in from each edge.
- **Show mode's layout**: colour chips and ticks back in the first column after the names; Flare's and Effects' ticks on their heading lines in that column, Effects' word "Blurs, flare, shine, outline"; Backdrop in the bottom slot; at the bottom right the iris stands above the eye (the Tiny Preview above them on the dial side), in both modes; in show mode the iris lit in the column's colours.
- **Undo history**: one rounded black popup, plain lines, a hairline between them across the whole width.
- Checked: `npm run small`, all passing (updated: the case check for the filled silhouette; the bottom-right stack).

## beta 4.91.12 (web version) · 23 Oct 2026

Okay's notes of 23 Oct 2026, 14:23:
- **Main is caseless to start** ("On main default is caseless"): the case menu opens with No case (`ui_case`, a ui_ key: never in a link); a kind picked turns it on and is show mode's kind too. **No Strap switch on the dial side** ("strap is only available through showcase").
- **Main's case is its silhouette** ("Just a silhouette, very faint lines. no shadows, nothing"): the case, lugs and crown joined into one shape, its edge one screen pixel in the canvas's ink at the switches' faintness (`frame()` in `watch.js`, via `silhouetteOf()`).
- **Show mode's title line**: no version ("hidden for users"); the mark opens no bio ("unclickable icon").
- **Show mode's Backdrop**: the Show Case's popup — ten colours and ten gradients, each side with its own colour under it opening the colour pop-out (`c_backdrop`, `c_backdrop2`); the Backdrop's chip shows a gradient as one. The dial side's Backdrop still opens the colour pop-out.
- **One dive bezel** (Okay chose Miyazaki's): Engineer draws the toothed rim straight in to the insert, the insert out to its own edge, the five-minute ticks and the triangle, in its own flat tones; the "round divot" code that was never used is gone.
- **The Dress case's tiny shine**: a lug's light crescent peeked out as a sliver where the lug meets the case; it now stops 0.6 mm short of the case's edge.
- **Show mode's rows**: ticks and colour chips stand in the number boxes' column (the pills stay where they are); notes span the row; Flare's and Effects' ticks are on their pane's heading line (Effects' word is "On" there; the note under it names the layers).
- **Case and Insert are picture tiles** ("check main for inspiration"): each case its silhouette and opening, each insert a ring in its two colours (main's `pick` rows, which now take an `order`).
- Checked: `npm run small`, all passing (new: main's caseless start and silhouette; show mode's title, Backdrop popup and tiles).

## beta 4.91.11 (web version) · 23 Oct 2026

Show mode set back to the Show Case where it had drifted (Okay, 23 Oct 2026, 01:23, iPad screenshots):
- **See-through column**: the canvas runs on under the column, so the backdrop and the watch show through its 85 %; the watch is centred in the part left of it (`size()` measures to the column's edge, and follows it frame by frame while it slides).
- **One finger or the pointer moves the sun** anywhere on the canvas: its direction from the middle is where the light comes from, nearer the middle higher (85° to 10°); two fingers zoom and move. The Light tab says so under Sun.
- **The title line** is the Show Case's: Dial Tool **Show Case**, the version, Help and the round swatch — no Gallery, no unit — at its half height.
- **Undo · redo · Versions** back at the canvas's top left; **Guides and Shadows** gone from show mode (the dial side's: "another realm"); the eye and the iris switch stand clear of the column.
- **The chosen tab's sign** in the column's colour, as the dial side's is in its paper.
- **A number's slider** on its own line under its name and box, the row's whole width (they were too short in the narrow column).
- A new view, case, strap or size fits the watch again when it was fitted (Whole watch drew at the Detail fit).
- **10:10 left the timeline** in both modes ("10:10 was a good joke while it lasted"): the step, its thick line on the ruler and its rules.
- Checked: `npm run small` (458 checks; new: the timeline's twelve hours; show mode's canvas, title, buttons and the sun by drag).

## beta 4.91.10 (web version) · 22 Oct 2026

- **The Show Case page republished** at /show-case/ as beta 1.0.20 (Okay: "update the show case site with the new stuff"): built from `dev`'s `watch.js` — the shadow rule, the buckle, the strap's ends, stitches and holes.
- **A long pill scrolls sideways in show mode** (Okay, 22 Oct 2026, 21:05: "Scroll sideways it is"): Metal's six choices stay on one line in the narrower column, the pill scrolling under the finger or the trackpad, no scrollbar — the Show Case's rule; on the dial side pills wrap as before.

## beta 4.91.9 (web version) · 22 Oct 2026

- **Show mode's column checked against the Show Case's** (Okay, 22 Oct 2026, 20:21–20:29: "Colors adapting to bg was good, if you got it back, that's all I want"): the same width (six columns at 42 px, margins at 16 — "less wide"), the tint one colour with the top band (title, tabs, pinned lines) a tenth lighter; the Light tab's Style and Lighting are the pinned lines, with no heading, and everything else scrolls (the pinned Watch and Export blocks made the rows under them look grey — "under the persistent, goes too gray"); the tabs' hairline inset by the margin. The round **grey swatch** at the title line's end (`ui_grey_panel`): the panel in greys like the bar, pressed again the backdrop's colour; it shows the look it would switch to; on the dial side none (R16).
- Not done on purpose: the Show Case's control looks (outlined pills, one control height, number boxes on the third column with the slider under) stay the tool's — "lots of shared buttons and links, if user wants the main to look like showcase, that'll be an option on settings" (#510).
- Checked: `npm run small` (456 checks).

## beta 4.91.8 (web version) · 22 Oct 2026

- **Show mode** (build list #509, phase 3 of the Show Case merge; Okay, 22 Oct 2026: "Lego brick like merger. Take one out put other (bigger) in"): the iris switch (ACTIVATE SHOWCASE) slides the panel out on the left and back in on the right with the show tabs — *Dial* (the dial's colours, Ink height), *Watch* (view, case, metal, insert, strap, NATO), *Light* (Engineer · Miyazaki, lighting, the Sun, Shadows, Flare, Glass, Effects) and *Export* (PNG, PDF of the watch) — tinted from the backdrop as the Show Case's column was (#505: the panel's tokens set from the backdrop's lightness; the dial side's colours untouched). The whole watch is drawn in `g.watch` by `watch.js` through the new `web/src/show.js` (the settings → the module's options; redrawn when a key changes, the hands turned each frame); Fit fits the case. The X slides back; the dial, its bezel and overlays return; Fit fits the dial. The mode is remembered (`ui_show`): a session closed in show mode opens there, no slide.
- **The watch's keys** (`w_` group, R7; `c_metal`, `c_nato`, `c_insert`, `c_backdrop2`, `out_watch_px`) live in the settings file and the session, never in a link (`NOT_IN_LINK` in `geometry.js`, R31); a saved dial carries its watch (Okay: "Versions are shared. Dial keeps the dial showcase keeps the case").
- **One sun**: `sh_from`, `sh_rise` and Shadows % light the dial's shadows and the watch's; the bar is unchanged in both modes.
- **The old Showcase is retired** (sky, spotlight pool, shine ring, sun day, the Now and 10:10 pills, the hands key, the sun hint, the dial's travel): "no spotlight, no animation on showcase. This replaces that". Its tokens, stylesheet rules and icons are gone.
- Not yet (phase 4, #510): the Backdrop's gradients and auto (`c_backdrop2` waits in `DEFAULTS` without a row), the preview button hiding the panels in show mode, the shenanigans switch in the bar's place (today a tick, *Effects*, on the Light tab, remembered in `ui_effects`), the bracelet of links, ink heights per colour, dragging the sun by hand, hiding show mode on a phone.
- Checked: `npm run small` (455 checks; the window test's show-mode section: in, the hands turning, the Watch tab's case, out); the Show Case page still builds from `dev`.

## beta 4.91.7 (web version) · 22 Oct 2026

- **The watch round the dial is drawn by `web/src/watch.js`** (build list #508, phase 2 of the Show Case merge; Okay, 22 Oct 2026: "Cases snap to dials. Size of dial determines … Dial side only shows cases as solid 3 color as engineer. No glow, nothing"): the Show Case's two engines are one module — one geometry (cases, lugs, crown, straps, buckle, keeper, bracelets, insert, holes; every measure a share of a published case, scaled to the dial), two paints (Engineer: outlines and three flat tones; Miyazaki: crescents, deeper colours, a flare), the shadow rule written once. `bezels.js` and the case archive (`web/cases.mjs`, `web/cases/svg/`) are gone.
- **Edit mode's case**: Dress · Field · Diver · Emre01 in the case menu, drawn flat in steel with one hard shadow from the dial's own sun (`sh_from`, `sh_rise`, Shadows %); no caseless watch. The strap: leather in its colour, or a bracelet on the diver alone (R16). Old files and links keep their meaning (R9: `bezel` 0 Dress, 1 Diver, 2 Field, 3 Dress, 4 Field, 5 Emre01; the pilot and sport sketches draw Field).
- **The Show Case page builds from the same module** (`show-case/` is on `dev`; `convert.mjs`, the draw tails, the batch PDF scripts, the PDF screens and the Playbox sources are gone); its three opener links rewritten in link scheme 4.
- Checked: the Show Case's drawings pixel-identical before and after in 15 views of both styles, every case and strap (the Engineer's leather strap excepted: it takes the roll and the tiny stitches approved today); `npm run small` (454 checks).

## beta 4.91.6 (web version) · 21 Oct 2026

- **The canvas's top buttons sit on the title's line** (Okay, 21 Oct 2026, 23:29: "Align bottom line of top button row on the same line as title's hr line first. Then push from top to adjust for left gap"): undo · redo and Guides stand as far from the canvas's top as from its side (12 px), their bottom on the hairline under the title; the title row grows to 43 px for it, its content centred, a hair kept at its foot so the unit box lands on whole screen dots.
- **Redo or undo with no step keeps its outline** as the others' (23:34: "keep outlines as others while inactive"); only its sign is paler, and it takes no press.

## beta 4.91.5 (web version) · 21 Oct 2026

- **The title row is 42 px**, as the Show Case's (half of 64, then 10 more; Okay, 21 Oct 2026, 23:11: "take only the top level … row height styling and adapt to app now too"). Undo and Guides stand on its middle line still; the font sheet starts under it.

## beta 4.91.4 (web version) · 21 Oct 2026

- **Every ring's row shows its colour, size and radius** (#504; Okay, 21 Oct 2026, 22:57 and 23:07: "The collapsed ring list shows numbers and appropriate swatch too"): a row not selected has its colour as a bare swatch in the colour column, where the selected ring's line has its own, and its two numbers in Dial Mono over the drawer's size and radius columns; a hidden ring's are faint.
- **The font box's colour is the colour rows' own pill**, a white block with swatch and hex (Okay, 23:07: "no need to invent new stuff"); 10 px from EN, so EN keeps its size.

## beta 4.91.3 (web version) · 21 Oct 2026

Small-jobs batch 1 (Okay, 21 Oct 2026: "Easy to do things: doing 10 of them and checking once is a solid job"; 22:48: "Do the small batch first").

- **Words** (#231, Okay's picks): a label's nudge *Scale ×*; the breguet and lollipop hand's *Circle Ø* · *Circle at %*; Export's *fps*; Okay's watch's numerals ring named *Numerals*.
- **Undo keeps 20 steps** (#495), as many as its list shows.
- **The settings file's pane: Save… · Load… only** (#434: "Remove both"); the resets are Dial › Reset's.
- **Positions**: Count and Every have their names again — the rows' rule put a menu in a third column that squeezed the name to nothing (#498); the round picture ends two units above the pane's line, twice the room it had (#499).
- **FIT's left line on a phone** (#453): `border-left: 0` on the zoom group's buttons took the line's style away too, so the phone's rule giving FIT its width back drew nothing; now only the width is taken. Measured on a 390 px window: 0 px · none before, 1 px solid after.
- **The font box's head** (#408): the text's colour is a full pill with its hex, its swatch where the small one stood (in the ring list's colour column), the hex running towards EN (Okay's drawing, 22:57: "FIT HERE"); the font's name 2 px larger (--t-l), its baseline and left edge where they were (measured 19.3 px down the line before and after), the line as tall as before.
- **Lengths step in the shown unit** (#76): − +, the arrow keys and the slider move in round amounts of pt, in, lig or thou (0.1 mm is 0.2 pt, 0.005 in, 0.05 lig, 5 thou) and land on round values; mm as before. Its setting waits for the universal settings panel (#496).
- **Compare packs densely** (#468): rows as even as can be, each centred, a shorter row nested in the dips of its neighbours (5 dials: 3 over 2); every count of rows tried, the largest dials win (`pack_even` in output.js).
- **The icon check visits three more states** (#158): a window's own font (Same font as and its sign), the bar's date pop-up (the labelmenu chevron), hover. 116 icons, all on the grid.

## beta 4.91.2 (web version) · 21 Oct 2026

Okay, 21 Oct 2026: "Let's have a /dev under dial tool online, work there … Small updates only on dev … Main gets all the tests"; "Yes: loader + own storage".

- **A /dev/ page** (#500): <https://duztman.github.io/dial-tool/dev/> shows `dev`, every small push after the quick checks; the root stays `main`, moved at a step after the full check. The page is a small loader (`web/dev/index.html`) that fetches the build with a fresh address and no cache, so a plain refresh shows the newest one; if the fetch fails it says so and points to the released page.
- **The dev build keeps its own browser storage**: on `/dial-tool/dev/` every key is `dial-tool-dev-…` and the kept font files' database `dial-tool-dev`, so the released page's last session, saved dials, palette and fonts are never read or written. Its title line reads "beta 4.91.2 · dev".
- `tools/release.sh dev "first line"` puts a small push on /dev/; `tools/release.sh 4.92 "first line"` now moves `main` to `dev` as well as the released page; a third-number version is refused there.

## beta 4.91.1 (web version) · 21 Oct 2026

- **A numerals ring's guides show the band's three circles**: the one that holds still (the radius) solid, the other two dotted (Okay, 21:47: "the center line (dashed) disappears. Instead selected line gets full, others dashed (Dashed=dotted)"). On `dev`, not released.

## beta 4.91 (web version) · 21 Oct 2026

Okay, 21 Oct 2026: "This is an urgent thing to finish … Let's tackle this"; on the drawing: "100%".

- **A numerals ring is a band one cap height thick** (#488). *Resize Ring from* Outer · Middle · Inner picks the band's circle that holds still, as a ticks ring's ends do; a bigger size grows the band away from it (Outer inward, Middle both ways, Inner outward). Every label stands on the capital H's middle, so figures of every height share one line; with Outer or Inner they touch that circle (an upright one by its reach toward the edge). A label nudged bigger keeps its place. Guides and handles show the band; the size handle on its free edge sets the size.
- The per-ink Centre is gone: centre, baseline, ascender and cap middle read as Middle. **Link scheme 4**: a link made before opens the First dial with a note (R31); the Gallery and examples are written again.
- Live text in the SVG takes the same radius as the outlines (it ignored Outer and Inner).
- The parity test leaves numerals rings out on both sides (R30): they are the web version's alone now.

## beta 4.90 (web version) · 20 Oct 2026

Built alone overnight (Okay, 02:02: "Build functionality … noted and screenshotted for my approval later") and accepted (Okay, 05:02: "this version is accepted, dev main, publish"). Every item, its readings and the open questions: `docs/review-4.90.md`.

- **Versions under undo, with Compare** (#435); nine kept, arranged by dragging. The Gallery no longer holds *Yours*.
- **Print**: What the windows show (#219), Hidden rings still cut (#221), Cut lines (#222), Inverted (#223), Outline and registration marks (#224). **A set of files** (#171).
- **Dial**: Weight % (#88); Diameter's limits, 5–300 mm (#233).
- **Undo steps named**, a list of 20 under undo (#172). **Units typed** in a length's field (#187). **Sliders finer away from their track** (#406).
- **am · pm Jumps** (#401). **The thinnest line** in the Export log (#225). The ring list's pill whenever it has a use (#448). Changes kept while time plays (#234).
- **04:52**: handles on solid guide-coloured discs, white signs; handles and the selected ring's guide always together on the Rings tab; the numeral picked for Nudge a hairline box touching it.
- **04:20 notes**: guides off to start, live while editing, 0.75 thick, dotted not dashed (#485); the selected ring's handles always on the Rings tab, seated on a guide-coloured disc, finer as the pointer strays (#486); selection light red (#483); the steps' chevron pale with no steps (#481); Settings' buttons one width (#482); Print's sheet rows under Sheet (#480); Frame first among a window's colours (#487); the pill hides when every pinned pane is folded (#479); a plan for square dials (#484).
- Code: `pack_discs` and `centre_block` (`output.js`) are the print sheet's packing, shared with Compare; `thinnest`, `production_marks`, `FILE_SET`, `WEIGHT_KEYS`, `GEOMETRY_AFTER_ALL`, `disc_hour` (`geometry.js`); `step_name`, `limits` on number rows (`app.js`). New keys appended to `LINK_KEYS`; no new link scheme.

## beta 4.89.12 (web version) · 20 Oct 2026

Okay, 01:33.

- **Bevel beside Show as soon as Show is on** (#459): each hand's Bevel off to start (`HAND_BASE.bevel` false), Bevels % 100 to start as its strength. An older link or file that had Bevels % above 0 and no per-hand key gets every hand's on (`fresh_settings`); `lean()` writes every hand's Bevel whenever Bevels % is in a link, so a link made since comes back as made. Link scheme stays 3.
- **A window's colours reach the dial at once** (#461): the scene reads them from the settings, not from the still parts' copy (which a colour change doesn't rebuild).
- **No stars in a moon window** (#462): Arch, Phase and Line draw the moon alone.
- **Every word choice a pill switch** (#463), the font sheet's Light · Dark look.
- **LINK in the labels' grey** (#460).

## beta 4.89.11 (web version) · 20 Oct 2026

Okay, 01:16.

- **A kind's own window shape** (#456): the fourth Shape button is the moon's arch or the am · pm's half, for its kind alone and chosen to start; a date or day window has four. `half` appended to `WINDOW_SHAPES`.
- **Icons** (#457): the arc's a sixth larger and 2 up, on its box's middle; the half's new.
- **A note belongs to its row** (#458) through any number of hidden rows (`sync_rows` marks the row `noted` and tells the note what it stands under); under tiles it starts a tile-gap below them. The am · pm note no longer sits on a line.
- **Resize Ring's *from* small and grey** (#454), as a summary; canon §6.

## beta 4.89.10 (web version) · 20 Oct 2026

Okay, 01:05: his final drawing of the date popup, and the menus.

- **The date popup as drawn** (#449), measured from his picture: a light ground in the bar's dark frame, the boxes' cells at his widths, 2 between boxes and 4 before − +, values white and semibold; the weekday in the panel's dark type, as wide as the widest weekday so the popup never changes size. Its tokens are specials (`--datepop-*`).
- **Every menu one look, one list** (#450): a chevron box (`chevron_box()`), and the tool's own list on a press (`menu_list()`, the unit box's look), for every menu in the tool — the browser's own list no longer opens.
- **A menu's whole box opens it** (#451): Resize from's box no longer folds its pane.
- **Shapes width last** in Resize Ring (#452).

## beta 4.89.9 (web version) · 20 Oct 2026

Okay, 00:34.

- **A phone's zoom** (#445): − and + in a popup the magnifier opens, with the note how to zoom; the date's popup and this one are one kind, `.barpop`. Elsewhere the magnifier's tag as before.
- **FIT on a phone** (#446): its own left line (it shared − +'s, hidden there).
- **Shapes** (#447): the rings' Shape pane is called Shapes; a bar or wedge mark's Width also stands in Resize Ring, as *Shapes width*.

## beta 4.89.8 (web version) · 20 Oct 2026

Okay, 00:20, a picture of the selected ring's row.

- **Its size and radius in the panel's type** (#443), at its size, black, tabular lining figures; Dial Mono and `--t-fig` gone from there. Design canon §2: numbers alone in the interface are the panel's type, lining, tabular, the zero plain.
- **No line between the selected ring's row and its line** (#444): the box 1 px lower.

## beta 4.89.7 (web version) · 20 Oct 2026

- **Every file says which build made it** (#226, the production debts): "Dial Tool, web version, beta 4.89.7" as the PDF's Creator (dial and sheet), the SVG's `<metadata>`, the PNG's Software text record beside its dpi. `MADE_BY` in `output.js`; a check in `labels.mjs`.
- **The date popup, finer** (#442; Okay, 00:17): inside each value box a unit less 2 px (`--datepop-in`); before the weekday 3 px more (`--datepop-lead`).

## beta 4.89.6 (web version) · 20 Oct 2026

Two of 4.89.5's faults, marked by Okay (00:06: "Why are you breaking things and not understanding me?").

- **The date popup's gaps the bar's own** (#438): a unit, as from the date's box to NOW's. "In between boxes stay as bottom bar date now width" was read as "the gaps stay as they are"; it meant the bar's gap. `--datepop-gap` gone; the padding stays a unit and 2 px.
- **The Show box's ticks back on their words' middles** (#441): putting Show and Bevel in one line (4.89.5) let each tick rise to its line's top, 3 px high. Now centred, and the words 2 px closer to the ticks (`--show-tick-gap`; 00:08). A window-test check holds both.

## beta 4.89.5 (web version) · 20 Oct 2026

Okay's notes of 19 Oct, 23:53.

- **A hand's Bevel tick beside Show** (#440), in the Show box under the hand's tab, once Show is on — and while Shadows is on and Bevels % above 0 (R16). Out of the side rows. The Show box's grey is now a line (`.showline`) holding its ticks.
- **The date popup a little roomier** (#438): its padding a unit and 2 px (`--datepop-pad`), the gaps between its boxes kept.
- **Backdrop's swatch** (#439): its colour painted inside its outline only (`background-clip: padding-box`, Backdrop and strap), so the hairline can't vanish into it where WebKit draws it on part of a pixel. To verify on Safari.
- Design canon §6: **a side row** — the slider follows its name with no gap; the gap goes to the slider and the number box.

## beta 4.89.4 (web version) · 19 Oct 2026

Okay's notes of 23:46.

- **The date popup as the panel's own controls, in the dark** (#436): day · month · year as chevron boxes (the value's box and a ⌄ box, touching), − and + touching, each on the bar's dark with the bar's hairline; the popup's ground the date's lit tone; the panel's type at its size (13), a control high (26); a unit and 2 px between boxes (`--datepop-gap`, a special). Dial Pop (Barlow Regular) removed from the page (−30 kB): `fonts/ui/DialPop-Regular.ttf`, `pop_font.py`, `--pop-face`, `--datepop-step` gone.
- **A hand's side rows** (#437): the gap between a name and its slider gone; its 12 px to the number's box (`--box-side-value` 44 → 52: four figures show whole) and the slider (+4). `--side-columns` lays the tracks out for every side row, Give way's Clearance too.

## beta 4.89.3 (web version) · 19 Oct 2026

Okay's notes of 23:11 (seven screenshots).

- **The bar's date popup** (#432): on the date's lit tone (`--bar-field`), the date lit while it is open, its words as big as the bar's date (`--t-date`); `--datepop-type` gone. The date's and AM · PM's weights stay: their faces are static ("if not don't touch it").
- **A window's neighbours in the number's colour** (#433) unless Neighbours has a colour of its own; the grey tone `PICTURE_TONES.near` gone.

## beta 4.89.2 (web version) · 19 Oct 2026

The production debts, first row (#220; Okay, 22:45: "Go with list").

- **What a mono print mask loses is said** (#220): a ring lying on a ring below it in another colour merges into it in one ink and vanishes. While *Mono print mask* is on, a note under its tick names each one ("Lost in one ink: Minutes on Chapter · …") and the two ways out — knock them out of the ring below (*Give way to rings above*), or export each ink alone; every mask export says it in the Export log too (R17). Not named: a ring knocked out of the one below, or two rings of one colour. `G.mask_merges(statik)` in `geometry.js`; worked out once the dial has been still 0.4 s (up to 200 ms on a busy dial). Found on: B-Uhr, Diver, World time, Rally, Teal and coral, Sector. Nothing about the drawing or the files changed.
- CLAUDE.md: a small push counts in the third number (R19).

## beta 4.89.1 (web version) · 19 Oct 2026

Okay, 22:25: "we had the beginnings of a hand bevel. on off from hand window. seconds preview needs cap preview."

- **A hand's Bevel tick** (#430): in each hand's pane after Wall, on to start; off, that hand stays flat. Shown while Shadows is on and Bevels % is above 0 (R16); not on a disc hand. New per-hand key `bevel` (link key appended; on draws as before, so link scheme 3 stays). A row's `show` sees the dial's settings too (`show(T, S)`).
- **The cap in the hand's picture** (#431): the detail box of the hand the cap is drawn with (the seconds hand, or the topmost with *Cap on this hand*) draws the cap over the pivot in the picture's ink, as the hand ("Color stays on the face"); the box widens to hold it.

## beta 4.89 (web version) · 19 Oct 2026

Okay's *Notes 3* (nine screenshots in his notes doc) and his notes through the session's sketch rounds, the first session on the sketch loop (handoff §4b): built round by round on a private preview page, released once.

- **R16 widened: a pane whose rows all don't apply goes**, heading and all ("We don't need to see a header we do not have the interaction with"); Undo and Redo the one kind that shows inactive. A window that is off leaves its tab empty under Show.
- **R34, no band-aids**: one need, one mechanism; a rule for what has none; a contradicted rule edited in the same push.
- **A tick says its name; its meaning a note under it, in one box** (design canon §6): *Big date*, *Follows the date*, *Neighbours*, *Inside the case* with their notes; every note 12 px and grey, no line between it and its row, its first line a line's spacing under the row's words (`--leading`), the box ending `--note-air` under it. Every tick and note on the controls' column, the first in a pane too (Print's *Mono print mask*). The gap from a box to its words one token (`--tick-gap`, 11).
- **A row of tile buttons** (design canon §6): on the controls' column beside its name, four to a line and equal; two or three keep a four's size; a fifth squeezes in. A window's four complications so.
- **A window's tab**: the three ticks at the end of Shape, Frame and Clearance in their place; the text and its font a *Font* pane of their own; *Frame width* for the frame's number; *Follows the date* on to start and for every link (Okay: "yes"); Show's tick closer to its word (8.25), the heading a unit under Show.
- **Resize Ring from …**: the pane's heading, *from* in plain type and the menu stretched to the margin; Baseline and Ascender retired from the menu and the drawing (a ring stored with one measures to the centre).
- **Positions' circle** from the first row's line to a unit above the pane's foot, growing left into the eye's column, never past the controls' names; its lines 1.75 (a hairline + 0.75).
- **The bar's date popup**: one line — the weekday, day · month · year as menus, − and + together — no time line, 15 % larger, the same size whatever the date. **NOW** outlined as the bar's other boxes, no grey fill.
- **The hand's picture**: no squares and no dotted box; pointing at a side, or its row, lights that side as a line on the outline in the guide's colour; the sides' reach unseen, the cursor saying the way.
- **A phone's sheets** (colour, fonts, Guides, Shadows) 7 px in from the sides and the foot, over the drawer's gripper.
- `test/crop.mjs`: a picture of one part of the window, with measures (`CROP_W`, `CROP_H`, `CROP_TOUCH`); crops kept in `web/test/crops/`.
- Build list: Notes 3 as #411–#429; the production debts gathered and ranked (#12, #16, #63, #218–#228); #229 closed (Blank face).

## beta 4.88.2 (web version) · 19 Oct 2026

Okay's notes of 18:00–18:04, the look lane ("These are rules now"; design canon §6, §7).

- **Tick rows**: the box stands on the words' first line, its middle on that line's middle — never between two lines; the words run to two lines at most and the lines balance, so no orphan word (`text-wrap: balance`).
- **The Show tick** under the window cards and the hand tabs: the white tick fills its black box — the box as it was (9), the tick the box less half a unit (6.25; 3.5 before).
- **A window's colours one to a line**, as the rings' and hands' are ("List these colors in lines like elsewhere"): Disc under it · Frame · Picture · Shade · Neighbours, each a row with its pill; an am · pm window's say *AM half* and *PM half*. The one-line Colours row and its stylesheet are gone.
- **Neighbours on to start**, and for every link ("default on, on retroactively for all links"): `neighbours: true` in `WINDOW_BASE`, so a link that doesn't say otherwise draws them; the Gallery's First dial card redrawn. The link scheme stays 3 — Okay's word makes this a retroactive change, not a dial quietly drawn wrong (R31).
- Build list #408 noted: the font box's colour as a full swatch with its hex, the font name 2 px larger from its baseline and left.

## beta 4.88.1 (web version) · 19 Oct 2026

- **Two sizes of check (R19)**, after Okay's note on the time a push takes ("Each .x step up gets the full check … Only filter makes more sense now … Check smartly"): a small push (the third number) runs what it touches, a step (the second number) and a release run everything. `npm run small`: the labels, the links, the complications, the build, the window test, and the icon check only when an icon could have changed — `icons/changed.mjs` looks at whether the icon block in `app.js` or anything under `icons/` differs from the last commit; nothing changed, nothing runs. The window test's own filter (`--only`) needs its sections made independent first: build list #407, next.
- The bar's date popup is as wide as its words and centred on the date's box (it was bound to the box's width and spilled).
- Okay's notes of 17:43 in the build list: #404 dauphine and leaf hubs as on a real movement; #405 a blank SVG template with guides and dots for every place an SVG can go, for when imports are built; #406 moving away from a held slider makes its steps finer, soon.

## beta 4.88 (web version) · 19 Oct 2026

Okay's notes of 17:30 on the am · pm window and X-ray ("All confirmed, go").

- **am · pm is one disc, half am and half pm** (Okay: "Am pm should be one half of a circle each"): a half-round hole over a disc that turns once a day on the hole's flat side — the am half in the disc's colour (the Colours line says *AM*), the pm half in the picture's (*PM*); no sun, moon or stars ("minimalize inside graphics … remove stars from nights"). The Sky and Band pictures are gone, with their colours (Dawn, Dusk, Sun · moon) and Band's now-mark on the frame; no Picture row for an am · pm window. Their places in `PICTURES` stay (R9) but `look` is not read for am · pm. What Okay saw: a Band window (a strip of the day's colours) under which X-ray drew the Sky disc — the two never matched.
- **Link scheme 3** (R31): a scheme-2 link with Sky or Band would now draw something else, so the number went up; `#2…` links open the First dial with the note. The Gallery's and the examples' links rewritten (`node gallery.mjs`, `node examples.mjs`); the live guide's links die until the guide is rebuilt on Okay's word (R25).
- **X-ray as a stack** (Okay: "makes the unseen full visible, sensible z height differences (not editable) and a stacking order. Selected shows above all others. Top is 100% opacity, with a white dotted outline, below gets -15 opacity gradually"): the selected window's disc on top, whole, at full strength, its edges dotted in white (1.5 px, preview only); under it the hands, then the face — plate, rings, what the holes show — then the other windows' discs, the biggest deepest, as a movement stacks them; each layer under the top one 15 % fainter than the one above (85 · 70 · 55 …, never under 25). The plate's veil (`XRAY_VEIL`) is gone. The discs' dashed guide edges stay. Never in a file or the Tiny Preview (R5, R26).
- **Big date is an option of the Date window** (Okay: "Big date function is an under selection of date function"): four complication tiles (date · day · am · pm · moon phase); under Date a tick, *Big date: two holes, the tens and the units each on a disc*, which sets the stored kind to 4 and back (R9: the kind keeps its place; every link draws as before).
- **The bar's date opens a popup** (Okay: "Date on the black bar is click to edit on popup. Plusminus for both. No controller"): over the date's box, in the bar's tones — the day written out ("Mon 19 Oct 2026") between − and +, a day each; under it the time ("10:09:36 AM") between − and +, an hour each; a press on the day opens the system's date picker as before; Escape or a press elsewhere closes it. In **Dial Pop**, Barlow Regular ("Try barlow not condensed for font"), cut down to its letters and figures by `fonts/ui/pop_font.py` (22 kB) and packed into the page.
- Build list #399, #400, #402 done; #401 (am · pm's jump) waits on this disc.

## beta 4.87.1 (web version) · 19 Oct 2026

- **The cases and straps as SVG files** (Okay, 17:15: "Can i get the svgs of the straps and cases on my harddisk like the icons?"): `web/cases.mjs` writes `web/cases/svg/` — twelve files, every case kind (Diver, Pilot, Dress, Sport) alone, with a strap and with a bracelet, drawn by `bezels.js` exactly as the preview draws them round a 36 mm dial (the dial's disc filled in paper), in millimetres, each as wide as its case and as tall as its strap. Committed, as `icons/svg/` is. Copied to his Mac, `dial-maker/cases-svg/`.

## beta 4.87 (web version) · 19 Oct 2026

Housekeeping, on Okay's ask ("Housekeeping, audit, system check, all at once … No retired rules up there to see, no forgotten comments within the code"; then: "eliminate history from current docs. All common sense options, go with all"; "in the end i need this all on main and current"). Nothing on the dial or in the look changes: the look-check (`test/same.mjs`, 447 states) shows only the showcase's Now pill mid-transition; `npm test` passes (443 checks). Released to `main` the same day.

- **Code.** `icons/check.mjs` reaches the font sheet again: it pressed `#font-change`, a button gone since 4.54, and noted the sheet "could not be reached" on every run since — 111 icons in 21 states are checked now (108 in 20 before). The Gallery's and the examples' cards are drawn by one `card()` in `web/links.mjs`: the examples' copy of the loop lacked `fill-opacity`, so a see-through fill on an example card drew solid; `src/gallery.js` regenerated (the First dial's card was stale). `output.js` exports its `num` and `rgb`; the Wear OS export imports them instead of its own copies. Out: `show_panel()` (nothing called it) and its `#app.nopanel` rules, `HAND_NAMES`, the three `GUIDE…` colour arrays in `geometry.js` (`GUIDE_COLOURS` replaced them; `GUIDE` also shadowed the guide's URL in `app.js`), `MM_PER_PT` (R1 named it for imports; nothing imports), `svg_dial_plate` and `svg_dial_rings` (superseded by `svg_dial_face`), the unused `DISC_PLACES` import, the `.picks.five` rules (nothing emits `five` since `--across`), seven unused tokens (`--bar-dim`, `--bar-faint`, `--bar-on`, `--bar-edge`, `--bar-hover`, `--half`, `--time-cap`), one dead duplicate `.fontbox .row.num` rule and the dead `42%` rows value in `8-narrow.css`. Sixteen screenshots committed into `web/` in 4.80 and 4.82 (`case-*.png`, `hd-*.png`, `hub-*.png`, `tl-*.png`) deleted. Fourteen spaces written as unit arithmetic (`calc(var(--unit) / 2)`…) now use their `--uN` token; `-2px`, `-3px` and `#000` in rules written as `--thick`, `--triple`, `--black` (R32); `--ring-thick` is `var(--triple)`. esbuild 0.25 → 0.28 (Playwright stays pinned at 1.56: a new Chromium would move the window test's measured values).
- **Comments.** Every code comment now says what a thing is and why (Okay's words), never what it was until which version: about 50 such notes gone from `app.js`, `geometry.js`, `opener.js`, the `.mjs` tools and the stylesheet. Stale ones fixed: the controller's comment in `1-tokens.css` still described the light head with the name (gone since 4.52); `draw_shadows` still called shadows a trial on a branch; two docstrings named `test/links.mjs` (it is `linktrip.mjs`); `opener.js` pointed "(below)" at the wrong dial; the Tiny Preview's docstring kept "regular eye for now"; `4d-hands.css` described a `.pm` band no rule or element has; a tag's comment described the old name-and-field pop-up; the bar's date comment still said "day, month, year".
- **Rules.** `docs/rules.md` lists only the web version's rules, in web wording (R2, R6, R10, R19, R28, R30 reworded; R1 without `MM_PER_PT`; R7 with `WINDOW_BASE`, the `gd_` and `sh_` prefixes; R23 marked not built, #50). The DrawBot window's rules — R13, R14, R22, R24, R27 — moved whole to `archive/drawbot/rules-drawbot.md`; numbers are never reused. **R15's form A2 retired**: the code has had no two-to-a-line row since width and height became two full rows with the LINK pill (4.57). The header's 2,500-character edit history is one line.
- **Docs state the present.** `docs/glossary.md`: every entry rewritten as the thing is now (the chronology inside entries gone — Number form, Controller, Opener, Gallery, Guides, Speed slider…); the DrawBot words (DrawBot, vanilla, DrawView, Canvas, Slot, Preview switch, Frame clock, GridView, Binding, Probe, Harness, Smoke test, the old Guidebook and Classics) and the beta 1.0 retired words moved to `archive/drawbot/glossary-drawbot.md`; entries added for Controller, Quiet row, Chevron box, Blank face; Tag, Classics, Guidebook, Family / style, Web version rewritten. `docs/build-list.md`: open items only — done rows in `docs/build-list-done.md`, the DrawBot items ("Verify on a Mac", the preview plan's #37–#45) in `archive/drawbot/build-list-drawbot.md`; nine rows marked *verify* that the changelog shows built are closed (#49, #57, #64, #67, #74, #78, #94, #95, #170), #54 (MCP) dropped, #293's two contradictory rows about `try/shadows` made one (the branch is gone). `docs/brief.md`: header current (it said 16 Oct with 56 rows since), §5 in numeric order with the settled and the DrawBot-era questions out, §7 and §8 present tense; §4, the dated decision record, kept whole. `CLAUDE.md`, `README.md`, `docs/handoff.md` (§1 rewritten), `docs/design.md` (`tools/make_guide.py` → `guide/look/`), `docs/project-prompt.md` (the block to paste into the Claude Project, whose live instructions still said vanilla/DrawBot/`test_harness.py`), `docs/versions.md` (4.52.1 and 4.52.2 went live inside 4.53's commit, so they have no row of their own — said so) brought current. The rule itself is in CLAUDE.md and handoff §4: docs and comments state the present and the reason; the change goes in this file.
- **Still open from the audit** (build list #398; Okay's notes of 14:13 are #399–#402; the Playwright bump #403): 34 values off the unit scale in the stylesheet's rules that are not in the specials block (letter-spacings, underline offsets, opacities on the ruler, `.tinyshut`'s 0.15 s, SVG stroke widths, the hover lift's 12 %), one literal negative margin (`.ringlist .grip`, −4 px), the two hard-coded breakpoints (860 / 861 px), five rules that style another part's selector from the wrong file, `--handle` meaning two things (a width token and a JS-set colour), and the round-corner canon ("colour things only") that the signs, tabs and pills don't follow — for the #294 review, with Okay.

## beta 4.86 (web version) · 19 Oct 2026

Okay's notes, 19 Oct, 12:46.

- **The controller's square at 85 %** (70 in 4.85). **Its LINK a disc** as − and + are; linked it reads LINK over +ED (his words). **Height's controller has it too**, not only Width's ("tapping second item in the linkees should also trigger button").
- **Guides, the case (and its strap) and X-ray down the top right corner**, one column in that order; the Guides list drops from it (it rose from the bottom left, 4.59–4.85). Backdrop over Shadows stay at the bottom left; undo and redo alone at the top left.
- **X-ray's box**: room after its word, as much as Backdrop's.
- **A switch that is off** (the case, the strap, X-ray): its outline dotted — shorter dashes, shorter gaps, a denser line (dashed until 4.85).
- **Signs swapped, places kept**: Tiny Preview's button has the dot (the iris, the showcase's sign until now); the showcase's has the eye — the iris with its lids, and in the showcase the X cut by them, as before.

## beta 4.85 (web version) · 19 Oct 2026

Okay's notes, 19 Oct, 12:30 (on the iPad).

- **The ring of shine: three circles that meet at noon** (#385; his choice of the two readings): three circles round the one centre, 0.3 of the dial's radius apart at dawn and dusk, closing as the sun climbs, one at noon — where their light adds up, so noon is the brightest. Each a soft light band with a dark one either side; their width from 4.83's dawn and noon (0.8 → 0.017 of the radius), now stepping down in ratio so the three stay apart while they close.
- **The controller**: three quarters of its size everywhere (on a phone only, 4.68–4.84); its square at 70 % (the preview shows through); a pair's **LINK** a button of its own between − and +, in the middle of their line (it used to fall on the square's corner, the row's pill). Its − and + redrawn at the size they now show (33, 6 thick; R33).
- **On a touch screen, a press on a slider or a name scrubs at once**: the controller comes under the finger and its slider follows the same finger without lifting it — by as much as the finger moves, along the knob's travel. A name still scrolls the panel up and down.

## beta 4.84 (web version) · 19 Oct 2026

Okay's notes, 19 Oct, 12:06.

- **Ticks and notes after a row of controls start on the controls' column**, under them — app-wide ("The drawing of secondary lines after an adjustment, they start on the column aligned with the upper row"): *Turn it with its radius*, *Follows the date in the bar*, a window's neighbours and physics, the moon's age note, and every other tick or note that follows a row in a pane. One that heads a pane's rows keeps the left edge; rows beside a hand's box keep their own columns.
- **The font box's eye as low as every heading's eye**, the box down with it, their tops level ("general eye top padding is the same as all the rows, the font box moves down with eye"): 12 under the line over the pane, as a heading's eye centred on its 40; in 4.79–4.83 both stood on the line.

## beta 4.83 (web version) · 19 Oct 2026

The ring of shine, after Okay's look at 4.81 (19 Oct, 01:59: "almost perfect, bring in more bands, wider (5x) on dusk and dawn, sharpest (3x) on noon. Smaller shine diameter").

- **Seven bands** in place of three: light in the middle, dark either side, then a fainter light and a fainter dark, each pair 0.55 as strong as the one inside it. Drawn as two radial gradients (the light screened, the dark laid on), so the bands are soft: a wide one blurs, a narrow one is crisp.
- **Their width**: × 5 at dawn and dusk (0.16 → 0.8 of the dial's radius), ÷ 3 at noon (0.05 → 0.017); between, in step with the sun's height.
- **The circle 15 % smaller**: 1.275 × the dial's radius (1.5 in 4.81), still crossing the dial at noon a third of the radius above its centre, so its centre comes nearer (0.94 R behind, 1.17 R in 4.81).

## beta 4.82 (web version) · 19 Oct 2026

Okay's notes on 4.81 (19 Oct, 01:40: "Do these and advance").

- **The cases redrawn as technical drawings** (#377, #379; "better proportions … real lug widths etc in relation to the dial size … less illustrationy, more technical drawingy"): seen from above, flat fills, an ink outline round every part (1 screen point at any zoom), finer lines for the edges inside one (a bezel's step, a lug's chamfer, a crown's grooves), the spring bars as dashed hidden lines. Proportions from real cases, as shares of the case's diameter: the strap between the lugs half of it (20 mm on 40), lug tip to lug tip 1.16–1.22 of it, a diver's opening about three quarters. Each kind's own: the diver's guards and turning bezel with its grips, the pilot's onion crown and long lugs, the dress case's slim flaring lugs and narrow gold bezel, the sport case's pushers at 2 and 4. No highlight or shadow bands any more.
- **Straps**: stitched along both edges (a dashed thread a shade off the leather), the buckle with its tongue and two keepers on the 12 side, the holes and a round tip on the 6 side. **The bracelet's ends are finished** — the folding clasp at 6, the clasp's tongue at 12 — so it reads as one closed loop.
- **Case and Strap at the top left**, beside undo and redo (in the bottom-left column since 4.79). **The case's sign** redrawn: the lugs now run out of the case (they floated clear of it), a dial opening inside; its box spaced as Guides' — the sign as far in, the chevron in a square of its own behind a line; a sign's 26-point room was leaving 4 empty either side of its 18.
- **Tiny Preview's eye at the bottom right**, over the dial-alone eye (top right until 4.81). The showcase stays where it is.
- **The bar's date: day over month**, no year (Okay: "i don't want it there"), 10 on 11 so it stands clear inside its box (three lines of 9 touched its lines).

## beta 4.81 (web version) · 19 Oct 2026

Okay's notes on 4.80 (19 Oct, 01:26), the small ones.

- **The ring of shine redrawn** (#365; "centre is about 6 on noon", "circle extends to be 150% dial size", "horizontally starts from 2/3 way from top of dial on the radius"): a circle 1.5 × the dial's radius, its centre on the side away from the sun — at noon just past 6 — so it crosses the dial a third of the radius above the centre. Unseen at sunrise and sunset, strongest at noon; its bands wide while the sun is low, narrow at noon. A light middle band (screened: it shows on a dark dial) between two dark ones (they show on a light dial).
- **The selected ring and its line are one box** (#364; "two boxes, yours is not connected, mine is"): no gap between them, one line shared, the corners square where they meet.
- **None, dotted** (a numerals ring's 12 left empty): the baton's outline as dots, one at each corner and the rest evenly spaced along the sides (2 apart), in place of dashes.

## beta 4.80 (web version) · 19 Oct 2026

Hands that sit on something, and handles that move where a hand is widest (#370, #368; Okay, 19 Oct 2026, 00:59).

- **A hub on each hand** (#370; "these hands need a disc to attach to the mechanism … a ball that the leaf attaches to"): Hands → **Hub Ø**, a round boss at the pivot joined to the hand's shape, solid even on a hollow hand. 0 = none, as every hand before; a disc hand has none. The First dial now opens with hubs: the hour hand's 2.4, the minute's 2.0, each a ring round the one above it, the cap (1.6) on top. New key `hub`.
- **The side handles on a hand's picture move up and down** (#368; "centre buttons on preview allowed to go up/down to adjust eg where the leaf bulges"): on a leaf, a dauphine, a pencil and a sword they stand where the hand is widest, and a drag along the hand moves that place — a leaf's bulge, a dauphine's corners, the shoulder of a pencil's or sword's point. Across, they set the width as before. The first 4 points of a drag decide which, held to the end.
- **A leaf's Widest at %** in the rows (20–70; 37.5 is the leaf of every version before). New key `bulge`.
- The handles' box leaves the hub out, so a hub wider than the hand does not pull the width handles off its edges.
- Every handle on a hand's picture stood a point down and right of its place since 4.71 (measured from the box, not from the overlay inside its border); now on it.

## beta 4.79 (web version) · 19 Oct 2026

Okay's notes on 4.78 (19 Oct, 00:59 and 01:03), the parts that were clear.

- **The guides' list** (#372): the guides scroll in a box of their own, with a thin scrollbar (and on touch a fade at the bottom while more is below), measured to stand between the top of the window and the Guides button; the settings — Rings · Windows · Add, Thickness, Reset All — sit under it on a lighter ground and never scroll away. The colour dots 7 px (8 before; 11 under a finger), the none sign ⊘ 14 px (it had shrunk with the dots). Headings for Windows and Added name only; their choices moved to the settings.
- **Bevels on the hands off by default** (#367): Shadows → **Bevels %** (0–100, 0 = flat; 4.77 drew them at full strength whenever shadows were on). New key `sh_bevel`.
- **The hand's shape named under its picture** (#371): a finger cannot hover the shape tiles to read their names, so the chosen one's name is written under the picture ("Your SVG" for a file).
- **The orange slivers on a hand's picture** (#369, Claude's reading: the lit part stuck on after a tap): a part lights only while a mouse points at its row; under a finger it goes off when the controller closes or a handle is let go.
- **LINKED on a big date** (#366): the pair's width and height now keep their ratio too (4.57's link only knew the other shapes).
- **Case and Strap** (#375) stack in the list at the bottom left with Backdrop and X-ray, each with an icon; on a phone only the icons show (the words come back where the panel shows words).
- **The font box flush with the eye** (#374): a bare pane's eye stands at the top of the box, not centred on it.
- A window's **Complication** picker keeps its five kinds on one line (the big date had fallen to a line of its own).
- **Links' key codes**: 4.72–4.75 added their keys above 4.69's instead of under them, so a link made in 4.69–4.74 with a strap, X-ray, a window's picture or neighbours reads those wrongly in later versions. The 4.75–4.78 order (the live page's, and saved dials') is kept; `test/link-keys.json` now holds the released list and `linktrip.mjs` fails if a key moves.

## beta 4.78 (web version) · 19 Oct 2026

Every mark selectable and editable, mechanism first (#349; Okay's notes 2: "a double click or tap selects the ring, a second what was clicked … a tick can grow or become anything else (an SVG later), a wedge").

- **On the dial**: a first press on a ring chooses the ring (as before); a press on the ring already chosen chooses the numeral or mark pressed, and opens its Nudge pane. Until 4.77 a single press chose a numeral at once, and marks could not be chosen.
- **Nudge one mark**: the Nudge pane, until now for numerals only, works on every ring but a band — ticks and markers too: Radius ±, Angle ±, Rotate, Size ×, and for a mark a **Shape of its own** (As the ring · Bar · Wedge · Dot). The list names a mark by the time it stands at (6 · 5:00); a dot marks those with nudges; Reset this mark.
- **The one chosen is outlined on the dial**, dashed in its ring's guide colour on a white line, while the Nudge pane is open on the Rings tab — whether a press or the list chose it.
- Left for the next steps of #349: a numeral's preview at the left of its controls, an SVG of one's own for a mark.

## beta 4.77 (web version) · 19 Oct 2026

The showcase, a step further, and bevels on the hands (#351, #354; Okay, 19 Oct 2026, 00:29: "1 and 3, go").

- **A dim backdrop still makes a spotlight**: the pool's colour is the backdrop's, lifted toward white until it is at least 20 % light, so a near-black backdrop gives a grey pool instead of none.
- **A ring of shine** in the showcase: three bands round a centre moved toward the sun (the middle one brightest), screened onto the dial and onto the hands, moving with the sun through its day. On a dark dial it lightens a ring, and the hands' shadows read on it.
- **The showcase's shadows** are a quarter darker than the Shadows setting.
- **Bevels on the hands** (#354), wherever shadows are drawn: each hand split along its length, the half the light falls on lighter, the other darker, by as much as the light comes from the side — two tones of the hand's own colour, not facets in 3D. A disc hand stays flat. Preview only (R26).

## beta 4.76 (web version) · 19 Oct 2026

Your own dials (#347; Okay's notes 2: "Instances of a watch: a save instance button; a gallery of them; printable; shown big or at actual size").

- **Export → Gallery → Yours · Save this dial**: the dial as it is now, kept in this browser with a small picture (its scene, as the Gallery's are drawn), named by its size and when. Newest first, sixty at most.
- Each is a card as the Gallery's: pressed, it comes forward with *Edit this dial*, *In a new tab* and *Remove*. A link or a settings file still takes a dial to another browser — the line under the button says so.
- Printable and at actual size: open one, then Sheet PDF (4.75) or the Tiny Preview (4.59). A print sheet of several different dials is not built.
- Stored under `dial-tool-instances`; a full or closed storage (a private window) says so in the log instead of failing.

## beta 4.75 (web version) · 19 Oct 2026

A print sheet (#348; Okay's notes 2: "Printing: print page preparation, preview, copies, stacks — something simple, elegant, efficient and paper savingly"). The first of "other work" after the discs (Okay, 18 Oct, 23:52).

- **Export → Print → Sheet PDF**: one page of copies of the dial at true size — A4, Letter or A5 — packed in straight rows or staggered ones, whichever holds more (circles stack tighter staggered: 45 of a 30 mm dial on an A4 with 3 mm between, against 40), the block centred, 8 mm clear at the paper's edges. Mirrored and as a print mask as the two ticks above say, so a toner-transfer sheet is one click.
- **Copies** (0 = as many as fit), **Room between** (mm), **A cut line round each** (a hairline ring 0.4 mm outside the dial, filled, R4). A line under Copies says what the page will hold; the page is drawn small beside the button, every copy where it will stand.
- The dial is drawn once in the file and placed at every copy, so a full sheet stays small (16 KB for 45). Print at 100 %, not "fit to page" — the log says so.
- New keys `out_paper`, `out_copies`, `out_gap`, `out_cutline`.

## beta 4.74 (web version) · 19 Oct 2026

Date discs (#346; the disc sketches D1 and D2). The last of the twelve.

- **Neighbours** (D1): a date or day window's new tick, *Its neighbours show where the hole allows*. Its disc's places either side of the shown one are drawn where the hole lets them — make the hole tall at 3 or 9, wide at 12 or 6 — cut by its edges, in a *Neighbours* colour of their own (a grey to start). With them showing, the text is sized from the disc's step from one place to the next (no more than the hole's height), so a hole made tall keeps the shown date its size.
- **Big date** (D2), a fifth complication: two square holes side by side (Width is both together, an eighth of it the gap between), the tens in the left (none before the 10th), the units in the right, each in the window's font. It follows the bar's date or takes typed text, as a date. Its own icon in the Complication row. No X-ray disc for it yet (its two discs, tens and units, are a mechanism of their own).
- A moon window's Phase now names its disc's colour *Moon*.
- The Wear OS export carries the pictures' further colours and the neighbours into its window frames, and builds a big date's frames as a date's.
- New keys `neighbours`, `da_neighbours` (off); the kind *big date* appended to the complications (R9).

## beta 4.73 (web version) · 19 Oct 2026

The moon's and am · pm's pictures (#346; the disc sketches B and C, Okay, 18 Oct 2026, 23:52: "All are good"). B and C in one version: they share their making.

- **A moon window's Picture**: *Arch* (as before) · *Phase* — the moon as it is lit that night (waxing on the right, waning on the left, its terminator half an ellipse), in a round hole: the sky in the picture's colour, the lit moon the disc's, its dark side a *Shade* of its own, two small stars · *Line* — one ink: the moon's outline, its dark side filled, two small crosses for stars (for etching).
- **An am · pm window's Picture**: *Sky* (as before) · *Half* — a half-round hole, flat side down, over a disc turning on that side once a day: night in the picture's colour, day the disc's, the moon, three stars and the sun in a *Sun · moon* colour of their own · *Band* — the day's colours along a strip, twelve hours across the hole, now at its middle: night (21–5) in the picture's colour, *Dawn* (5–7) and *Dusk* (18–21) their own, day the disc's; a small triangle in the frame's ink over the hole marks now.
- The Colours line names each colour by what it paints (Sky, Shade; Day, Night, Sun · moon, Dawn, Dusk). X-ray draws a Half's disc whole.
- New keys `look`, `c2`, `c3` (and `da_look`, `da_c2`, `da_c3`): the picture as before and its own tones to start, so every older link looks as before. Width row for the half-round hole.

## beta 4.72 (web version) · 18 Oct 2026

The windows' discs (#346; Okay, 23:52, on the disc sketches: "All are good but a3 not enough, a2 and others"). Sketches A2, A3 and A4.

- **Each window's disc** is now a shape the tool knows: a date or day window's is a band round the dial's centre, as wide as the hole reaches and 0.3 mm more each side, every place printed on it as the window prints its own (1–31; the seven days in the window's language), each turned to read upright when it comes under the window, the next a step clockwise. An am · pm window's is a small disc turning on the hole's bottom edge, half night, half day. A moon window has none yet: its moon is drawn moving along a path, not carried on a disc.
- **X-ray** (A2), a switch beside Case while such a window is on: every disc drawn whole under the plate, the plate a veil (82 %). Preview only — never in an export or the Tiny Preview (R26). New key `xray`, off.
- **The disc's edges as guides** (A3): two dashed circles in the window's guide colour, beside its solid edges and dotted middle, whenever its guides show.
- **Physics** (A4): a window's new tick, *Its disc stays inside the case* (on). On, a disc that ends past the dial's edge less a 0.5 mm rim turns its outer guide red, and a line under the tick says by how much; off, it may (a face on a screen). New keys `physics`, `da_physics`, on.

## beta 4.71 (web version) · 18 Oct 2026

Handles on the hand's picture (#345; Okay's notes 2: "draggable dots at the extremes of what can be edited, a dotted bounding box like Photoshop's transform; one side's width drag edits the other symmetrically").

- **A dotted box round the hand** in its detail box, and **a square at the middle of each side**, in the selected guide's colour with a white hairline (as the ring handles of 4.65): at the tip, Length; at the other end, Tail; at the two edges, Width — both edges together, so the width grows by twice the travel. A disc hand: Length (its marker's end) and, at the edges, Disc Ø; no tail.
- Dragged, a handle adds the pointer's travel (in mm at the picture's scale when the drag began) to its number, through the row (undo, the dial, the number box all follow), its part lit (4.70). The picture keeps fitting the hand as it changes, so the whole hand stays in view; a handle drifts a little from the pointer when the hand grows a lot.
- Each handle's tag says what it sets; a fingertip's reach round each.

## beta 4.70 (web version) · 18 Oct 2026

A hand's number lights its part (#329; Okay's notes 2: "hovering a row lights its part on the hand's picture at the left").

- **Pointing at a hand's number lights the part it makes** on the hand's picture, in the selected guide's colour: Length a band at the tip, Width both edges, Tail its end, Round ends the corners, Hollow wall the hollow, Tip length and Head width their head. It stays lit while the row holds the focus or its controller is open (so on a phone or iPad too).
- How: the hand is drawn again with that number a little less and a little more (15 % of it), and the part is where those differ from the hand as it is — so it is always true to the shape, whatever the shape. A number at 0 shows where its part would come, at half its range (a counterweight's circle, a wall's hollow).

## beta 4.69 (web version) · 18 Oct 2026

Straps for the cases (Okay, 22:35: "Add straps to bezels metal bands too, same style, style very good. Fit and previews care about the dial still, the bezel and strap secondary. Add strap color change option").

- **A strap or a bracelet** on every case, drawn as the cases are: a leather strap in its colour with a lighter band on its left and a darker one on its right, a keeper past the lugs, holes and a rounded tip at the bottom, a buckle at the top; or a bracelet of three links to a row in the case's own metal (steel, or gold for the dress case), its middle links polished, its gaps in shade. Both run from between the lugs and narrow a fifth.
- **A Strap switch** beside Case while a case is on: the strap's colour as a chip (a press opens the colour pop-out), then No strap · Strap · Bracelet. New keys `strap` (a strap to start) and `c_strap` (a dark brown).
- **The view fits the dial again**, never the case: the case and strap run off the edges as they will. From 4.66 to 4.68 the view made room for the case.

## beta 4.68 (web version) · 18 Oct 2026

Okay's notes of 22:35 on 4.67, phones and iPad.

- **Under a finger, the slider and the name open the controller** — tapped or slid; the slider itself doesn't move. The number's field takes typing (the keyboard comes up) and − + step in place, as with a mouse. From 4.60 to 4.67 it was the other way round: the field and − + opened the controller ("On phones and ipad tapping or sliding slider or title opens controller, you can type in box or tap plusminus").
- **The controller at three quarters on a phone** (narrower than 600): one scale token, `--num-pop-k`, multiplies every measure of it — discs, pills, value, signs, gaps. An iPad keeps it whole ("Controller too big on the phones, 75% scale").
- **A hand's rows on a narrow screen**: name · slider · number box on one line, the slider taking all the room between, the short names (Round, Counter Ø) as on a wide screen. Until 4.67 they fell to the panel's six tiles there and the slider got one ("Hands sliders squeezed, use all row width").
- **Choosing a font closes the font sheet** ("Font window, selecting font closes window").

## beta 4.67 (web version) · 18 Oct 2026

A Wear OS watch face (farukahmet's PR #1, ported; Okay, 21:20: "All three great on pull request").

- **Export → Wear OS → APK**: the dial as a Watch Face Format face — the plate and every ring as one picture, each hand its own, the windows as sprite sheets, ambient (always-on) versions — packed and signed in the browser into an `.apk` to sideload onto a Wear OS watch (`adb install`, or a sideloading app).
- **Its name on the watch** (a field under the button) makes its package's name too, so several dials can live on one watch. A new key `wearos_name`, empty to start.
- Signed (v2/v3) with a **shared debug key**: right for one's own watch, never for the Play Store (said under the button). Checked here with apksigtool: v2 and v3 verify. Not tried on a watch.
- `web/src/wearos/` (farukahmet's modules, as he wrote them; fflate's MIT notice put back) and `web/test/wearos_test.mjs` in npm test. His Windows tools for making the template APK stay on his branch (`pr-1`).

## beta 4.66 (web version) · 18 Oct 2026

A case round the dial, preview only (farukahmet's PR #3, "abstractified"; Okay, 21:20: "low number of colors, thick lines, minimal, maybe just sillhouettes of classics. One highlight one shadow").

- **Case**, beside Backdrop: No case · Diver · Pilot · Dress · Sport. Each a silhouette of its kind, not of a model — a flat body, one lighter band on its upper left, one darker on its lower right; a diver's dark insert with its pip and five-minute bars and a coin edge; a sport case's flat bezel with sixty marks and two pushers; a pilot's onion crown; a slim gold dress case. Sized from the dial, so it fits any dial.
- The view fits the case when one is chosen, and the dial again without it. Never in an export or the Tiny Preview (R26 updated). A new key `bezel`, none to start: older links look as before.

## beta 4.65 (web version) · 18 Oct 2026

Handles on the guides (farukahmet's PR #2, redrawn our way; Okay, 21:20: "Drag handles great as an idea, needs to be implemented in our ways and design, inner outer thing already has dotted line, all these handles should be in guide color, adapted").

- On the Rings tab, with the selected ring's guide showing, **four handles in the ring's guide colour**, a hairline of white round them:
  - a **disc on its dotted line** (what its radius measures to): dragged in or out it sets the radius;
  - a **square on the far edge**: dragged, it sets how big one of its things is (a mark's length or a dot's Ø, a numeral's size, a band's width) — the edge follows the pointer;
  - a **triangle outside the ring at its first position**: dragged round, Start;
  - with a span under 360°, **a triangle at its end**: dragged round, Span.
- The radius and size handles stand between the first two positions, never on a mark. Each says what it does in a tag; a press that doesn't move changes nothing. They set the ring as its rows do (undo, the guides live while dragged).

## beta 4.64 (web version) · 18 Oct 2026

One number box for the whole tool (Okay, 18 Oct, 21:20: "This version of boxes win: small plusminus and these new thick border ones are retired, these replace all with two changes. Number box touches minus box. Signs grow inside the box as much as these new thick bordered ones. Also add the chevron version with only one box same style").

- **Every number** is the full row's box: the value, then − and +, touching, one hairline of the rule's grey. In a full row the value takes the unit that stood between it and its − +.
- **Beside a hand's box, in a quiet row and in Positions** the same box, narrower. The quiet number with its tiny ± (4.45.1–4.63) and the thick-lined blocks of the font box and Positions (4.54, 4.56) are gone. A side row's name opens the controller, as a full row's does.
- **The signs are drawn**: 12 across in a full row's box, 9 in a narrow one.
- **The chevron box** (Count, Every): the value and one ⌄ box in the same style.
- The Blank face row lays its words under its button, as Reset's First dial does (they wrapped a word a line).

## beta 4.63 (web version) · 18 Oct 2026

Okay's notes of 21:20.

- **Tags wrap**: no line longer than 240, balanced, kept inside the window ("constrict the width to avoid these unreadable lines").
- **The phone's bar**: the time and AM · PM at 17 (were 12: "Time and am too small"); how fast gives up the room.
- **The date in Inter SemiBold**, still stacked ("three tier with barlow abort, try inter with appropriate weight for that size"): a cut of its figures, "Dial Date" (`fonts/ui/date_font.py`).

## beta 4.62 (web version) · 18 Oct 2026

The date (Okay, 18 Oct: "Date best set at the bar, short date, 07/10/28 style, stacked barlow medium or bold, next to am, touching. Default from system date").

- **A date in the bar**, touching AM · PM: day, month and year stacked in Barlow Bold (18 · 10 · 26). Today's to start, wherever the dial is opened; a press opens the system's date picker; **Now** brings today back.
- **Windows follow it**: a date or day window with *Follows the date in the bar* says the day of the month or the weekday; a moon window shows the moon's age for that day. A day window's **Names**: EN · TR · DE · FR · IT. The typed text (and the moon's age) wait underneath for when the window doesn't follow.
- The default watch's date window follows the date; a window switched on with its starting text (17, MON) follows too. Older links keep their typed text: new keys `date`, `follows`, `names`, off to start.
- The engine behind it: `web/src/moment.js` (one moment — a date and the time — for every complication).

## beta 4.61 (web version) · 18 Oct 2026

- **The complications act like tabs** (#328: "selecting them changes settings accordingly"): each kind — date, day, AM · PM, moon — keeps its own settings for the window (shape, size, text, colours, font). Taking a kind back brings its own back; a kind taken for the first time starts from what the window has. Where the window stands (its place and radius) is shared. Kept while the tool is open; a link keeps the window as it is shown.

## beta 4.60 (web version) · 18 Oct 2026

Okay's notes on 4.59 from the iPad (18 Oct, 20:39).

- **Under a finger, a row's − + and its field open the controller** ("All these + - buttons on mobile, they get the new controller, not the desktop"): no stepping in place and no keyboard. A mouse still types and steps in place.
- **The kinds menu has no note under it** ("Remove the explainer from dropdown").
- **Start and Span lose trailing zeros** (−142° rather than −142.0°), so the value fits its box in Positions.

## beta 4.59 (web version) · 18 Oct 2026

Tiny Preview (notes 2, #337).

- **An eye at the preview's top right** opens the Tiny Preview: the dial with its margins at its own size — the browser's millimetres, about right on most screens ("approximation fine for now") — on the backdrop, framed in ink with round corners and a hard shadow, over everything. It follows the dial as it changes.
- **Drag it anywhere.** Its eye, at its top left on hover or after a tap, puts it away; it opens again where you left it.
- **Guides moved to the bottom left**, between Backdrop and Shadows; their list opens upward.

## beta 4.58 (web version) · 18 Oct 2026

The small ± adjusters (notes 2, #317).

- **A quiet number and its ± are one press**: anywhere on them opens the controller. The signs are a picture of the controller's − and +, and the number is not typed there (from the keyboard: Tab to it, Enter opens the controller, the arrows still step it).
- **The tiny plus 4 px higher** than the figures' top.

## beta 4.57 (web version) · 18 Oct 2026

A window's width and height, linked (notes 2, #358).

- **Two rows again**, Width over Height, each with its slider ("Two sliders on one line is not a good idea … two stories tall").
- **A LINK pill** on the line between them, at their names: a white outline on the pane's grey, LINK in the pixel font. Pressed it turns ink with **LINKED** in white, and changing one keeps their ratio, as in Illustrator.
- Kept with the dial: new keys `wh_link` and `da_wh_link`, off in every older link.

## beta 4.56 (web version) · 18 Oct 2026

Positions after Okay's drawing (notes 2, #357).

- **The preview, large**, at the left, three rows high. It is a control now: a press in its outer band (the marks, the dot) drags the **start** round the dial; a press inside drags the **span's end**. The span is a **dotted arc** ("make it dotted instead of ruler"), ending in a small ring.
- **Count and Every are menus**: the usual numbers, then *Custom…*, which turns the box into a field with → (Enter takes it, Escape puts the menu back).
- **Offset, Start and Span are number blocks**: the value and its − + in one box, as in the font box (#317). Each name still opens the controller and drags the value.
- **Skip those** (was *Skip those instead*) has an (i): a tap or the pointer shows what it does. Offset's name says what it does in a tag.
- On a phone the controls stand in one column beside the preview.

## beta 4.55 (web version) · 18 Oct 2026

The selected ring after Okay's Photoshop drawing (`selected-ring_181026`; notes 2, #335, #327).

- **The selected row** carries the ring's **size and radius** at its right, in Dial Mono, each over its button in the drawer ("Large mono numbers for size and radius, slashless 0 if possible"). Dial Mono, cut from JetBrains Mono for the unit box, now has the figures; its 0 has no dot (`web/fonts/ui/mono_font.py`).
- **The kind** is changed from the selected row's kind icon: a press opens the kinds. The drawer's kind square is gone.
- **The drawer** writes the ring out on two lines, grey names and dark values: what it draws (*Arabic: 12, 3, 6, 9*, *Text: AUTOMATIC*, *Shape: Bar · Length: 2.4 · Width: 0.7*, *Width · Fill* for a band), then where (*Positions: 12*, and a start, a span, a give-way or nudged numerals when there are some). **Change** is gone ("meaningless").
- The colour is a **bare swatch**; size and radius are pressed (the controller) or dragged, with **no tag**: their numbers are right above. The rename box at half its grey.
- **Fixed**: in 4.54, selecting a ring whose font is not in the catalog (a markers ring of the default watch) stopped the panel — the Type pane's summary had an empty part.

## beta 4.54 (web version) · 18 Oct 2026

The font box after Okay's Photoshop drawing (`font-selector_171026`, light and dark; notes 2).

- **A grey head** (#334, #321): on the panel's grey, the preview on white 4 in from the box's edge, then the name's line — the family's name grey and bold, running up to the text's colour, and **EN** at the line's right end (it was inside the preview's cell). **No Change…**: the preview and the name open the font sheet, as they did.
- **The chosen style** mid grey with white words (was ink).
- **Number blocks** for Size and Tracking: the value and its − + joined, one thick line of the rule's grey round them ("new number entering blocks", to come elsewhere: #317).
- **The Type pane** (#318, #319): open, its heading is just the eye, the box beside it from the pane's top; folded, its line says the family, style and size.
- **Dark** (#320) darkens a font box's preview only; the rest of the box keeps its look.

## beta 4.53 (web version) · 18 Oct 2026

Mechanisms after Okay's answers (18 Oct, 19:02). Goes live with 4.52.1 and 4.52.2.

- **Numerals tangent to the ring** (#338: "Tangent to inner or outer"): the radius' menu gains **Outer edge** and **Inner edge**: every numeral's ink touches the radius, from inside or from outside — an upright numeral by the corner of its box that faces the edge, one turned with the ring by its top or foot. Like Illustrator's paragraph alignment for a ring of figures.
- **A change of what the radius measures to moves nothing on the dial** (#326: "Nothing changed … just the dotted line moves"; "applies to reverse auto reverse"): the radius changes with it, so only the dotted line goes. Marks and bands keep their outer edge (outer · middle · inner); numerals keep the first label's middle — exact for radial and auto-flip, where every anchor lies on one line. Undo takes both back.
- **One mark nudged** (#349, groundwork): ticks and markers read the ring's per-position Nudge as numerals do — radius ±, angle ±, size ×, turn. Nothing in the window sets it yet: picking and editing one mark comes with its design.

## beta 4.52.2 (web version) · 18 Oct 2026

Okay's answers of 18 Oct, 19:02 ("Rest is good, common sense wins go"). Goes live with 4.52.1.

- **The day's needle** (#343: "Ruler pin does not move on bottom bar"; notes 2: "The moving needle is 1px wide and red, starts from the bottom of the screen"): the slider's own thumb kept its place whenever the slider had the focus — after a tap on it, on an iPad — so the time moved and the pin didn't. Now a red needle, 1 wide, from the ruler's top to the bar's foot, placed from the time itself; the slider's thumb is not drawn. Presses and drags on the day's strip are read by the tool and set the time (a press that doesn't move still goes to the nearest step), so scrubbing works the same in every browser; the slider stays for the keyboard and a screen reader.
- **Showcase left of the eye** (#341): the iris switch stands left of the eye switch, a unit apart (over it since 4.42.4).
- **Same font as Hours** (#359): a window's way back to the numerals' font was called *Copy style of*; it never copied.
- **A disc hand's window inside its disc** (#344): *Inside the disc*, a tick in the disc hand's rows; its window then ends at the disc's edge however long the hand is. A new key (`mark_in`), off in older links so they draw as before, on for a hand made a disc in the tool.

## beta 4.52.1 (web version) · 18 Oct 2026

Okay's eye on 4.51.1's items drawn from his words (18 Oct, 18:55).

- **The kind pictures** (#255, "Do my notes"): the numerals' 12 in proportional figures, 0.75 tighter; the text ring's ABC · XYZ a weight heavier (800), tracked 0.5, the two lines 7.5 apart (were 9).
- **Give way** (#258: "thicker indices, better indication of the actual state on watch. And left knockout not a button, these are regular rows, changing to fit this view"): this ring's ticks 3 thick, in ink; the marks of the rings above drawn as faint outlines lying on the ticks where they really would, so the ticks run through them (nothing), are gone under them (Skip where) or stop the clearance short of them (Knock out). *Skip where* and *Knock out* are rows now — a row's grey, the rows' white lines, no frames — the chosen one in ink, lit white and joined to the square as before.
- **Placement's pictures** (#259: "Thinner lines overall, thinner but big headed arrows, try again"): the circle and the arrows' stems 1.25 (were 1.5), each head a filled triangle, 2.75 long and 3.5 across.

## beta 4.52 (web version) · 18 Oct 2026

From Okay's notes 2 (18 Oct 2026; build list #316–#359, all of them ranked there), the small ones (Okay: "in the meantime start working on small things").

- **The controller, second drawing** (#330; `controller 2.svg`: "The new controller is in. No name necessary, preview shows what's changing anyway"): one dark square (the grey, 251 × 248, corners 49.5) holding three things 66 high — the value in bold 41 on a grey pill, the slider in a white pill (its line 10, the knob 44 with a white eye), and − and + as two dark discs with square-ended white signs, one at each side, 86 apart; 16.5 round them, 8.25 between. No name: a row's menu (the numerals' anchor) stays on the row. R15 rewritten.
- **The default watch is Okay's link** (#331: "This becomes the default watch"): Barlow SemiBold numerals at 4.8, four ticks, grey hour and minute hands, a red seconds hand, a Barlow Bold date at 3, a red backdrop. It is what the tool opens with, what Reset and Defaults bring back, and the Gallery's first card. The guide's First dial steps no longer end on it (said at the guide's next rebuild, R25).
- **Copy link on an iPad and in Safari** (#332): WebKit lets a page write to the clipboard only while the click is fresh; the link was packed first, so the copy was refused, silently. Now the clipboard is asked at once and handed the link when it is ready (a ClipboardItem holding a promise); writeText after the wait stays as the fallback. The button says **Copied** or **Not copied** for 1.6 s (R17); not copied, the link box is selected. Tested in Chromium only: WebKit can't be installed here.
- **A blank face** (#333: "White dial color, no rings, etc."): a **Blank face** button in Dial › Reset gives a white plate and the hands, one ring hidden (the list is never empty), no windows. Undo brings the dial back.
- **Complication** (#328): the Windows page's *Shows* row is named *Complication* (glossary).
- **The Show box's tick** (#323: "just as big as shows ascender … the outer gray box does not change size; padding … equal top, left, bottom"): 9 high at 12 px words, with 8.5 left, over and under it.
- **The Custom labels note under its field** (#324): a note about a field starts on the field's column (`info(…, { under: true })`; the rule was there, nothing could ask for it).
- **No second line under the pinned part** (#325): the first pane *shown* under it has no line of its own (until now the first in the list, which in a numerals ring is the hidden Text pane).
- **The zoom area** (#342): the magnifier first, then − + FIT side by side, sharing their lines; how to zoom and move is the magnifier's tag ("⌘ + scroll zooms · drag moves · pinch on a trackpad"; on a touch screen "Pinch to zoom · two fingers move", shown a moment on a tap); the words at the left are gone. On a touch screen **one finger no longer moves the dial**: two do, with the pinch. A tag with no room under it (the bar) stands over its button, its arrow down.
- **G turns the guides on and off** (#353), as the Guides switch does; not while typing, nor with ⌘ · Ctrl · ⌥ or ⇧.
- **The Gallery's chosen card** (#355: "these options should not push all the rows, just that cell grows. No outlines, just full colours, bigger cell padding and walls"): filled with the chosen tint, no line round it; its two choices grow down over the row under it; walls 8.25 (were 5.5), room inside 11 · 11 · 8.25 (were 8.25 · 8.25 · 5.5).
- **Tags** (#356: "more inner padding and centeredness and 1px borders"): 5.5 over and under, 11 at the sides (were 2.75 and 8.25), the words centred, a hairline round them (was 2 px).
- **vibecoded** (#340), in the bio.
- **The showcase's arrow and ✕** (#350, #352): the side-to-side arrow's stem in three, straight · dashed · straight; the ✕ on the iris is cut by the eye switch's absent eye, so its lines stop where the eye's rays stop and leave the iris alone.
- **The Guides list's bottom section** (#322: "the functions are below, grouped under a lighter bg color area. The grey area grows to include add line … Smaller color dots, closer, much compacter width. Fainter unselected swatches … a 1px dark gray border when selected"): Add and the guides added under it stand on the section's ground with Thickness · Reset All, 5.5 more room over Add; the colours 8 across (were 10), 7 apart (were 9), so the list is 275 wide (was 311); a colour not chosen at 40 % (was 60 %); in a dark popup the chosen one of All · Selected · None keeps a 1 px dark-grey line.
- **The disc hand's tile** (#344): its marker a cut-out inside the disc, as a disc hand's window is (it ran outside the disc).
- **The icons as SVG files** (#336): `web/icons/archive.mjs` writes every icon the icon check finds into `web/icons/svg/`, one file per drawing.
- **A controller left open no longer outlives its dial** (found on the way): picking a Gallery dial, Reset or a link while a controller was open left it standing over the new panel, catching presses. The tool closes it when it opens a new dial.

## beta 4.51.1 (web version) · 17 Oct 2026

- **The magnifier out of FIT** (#315; Okay, 17 Oct: "icon moves out of the fit box, sits in between plusminus and fit; the horizontal padding like now and am"): at the bar's right the zoom area is now − + · the magnifier alone, in the bar's light tone · **FIT**, a word button as wide as its word and NOW's padding either side (a column wide, with the magnifier inside, since 15 Oct). The phone's own rule for FIT's width went with it: the one rule serves both.

## beta 4.51 (web version) · 17 Oct 2026

Phase H, the fonts, from Okay's notes (p. 12–13) alone (17 Oct: "draw me all the sketches … proceed with plan").

- **EN** (#273): the language button says **EN** while the font sets the language itself (nothing is stored; "Lang." until 4.50.2), and stands at the right **inside the preview's cell**, on the cell's grey, so it knocks the preview out where it reaches. The name line keeps the name, the colour and Change…. Okay's "end gray lines with the text as shown here" stays unread (#273's open part).
- **The box's sliders, wide** (#274; "break the rules"): in the font box the rows (Size, Tracking, an axis) give their name a column of twelve characters, cut past that, and the slider all the rest; the number and the stepper stay where every row has them. A special, `--font-label` (R32).
- **The styles as tabs** (#275; Okay, 16 Oct: "it is a part of the font so it needs to look like tabs of the upper box which is the font name"): Regular · Medium · Bold… are tabs **hanging from the line under the font's name**, the hand tabs turned over (their notches at the foot, no line of their own at the top, one line between neighbours; `.tab.hang`); the chosen one ink with paper words; more than fit slide sideways. A variable font with a weight axis and no named styles gets **Regular · Bold** here, which set the axis (what a font may offer here is limited to bold and italic; the other axes stay down with the sliders).
- **Light · Dark** (#276): a pill at the top middle of the font sheet, between Fonts and Find, shows the previews on white or on a dark grey; kept for the session (sessionStorage), not in the dial. The font boxes follow it: the inverse of their white, never pitch black (Okay, 16 Oct: "inverse of existing block can't be black") — a dark grey ground (`--font-night`), near-white words, lighter lines; inside, the usual names turn over, so what is chosen is light with dark words (R32's chosen layer holds).

## beta 4.50.2 (web version) · 17 Oct 2026

- **Give way, pictured** (#258; Okay's notes, p. 4: "what's happening should be visible here"): *Skip where* and *Knock out* are **side tabs** at the left, cells drawn with the rows' white lines; the open one lights up white and reaches onto a **white-bordered square** beside it. In the square: a drawing in the icons' line, twice an icon's size — a row of this ring's ticks and, over them, faint, three marks of rings above (a marker, a numeral, a tick); the choice is read off it: Skip where takes the tick under each named mark away, Knock out cuts it back by the clearance (20 px a mm in the drawing, never less than a line). At the foot the four choices as **radio buttons** (new: a round sister to the tick box, ink ring and disc), and under them **Clearance** as a quiet row (R15 B), only on the Knock out tab and only when something is knocked out (R16). Which tab is open is the session's, not the dial's (R31 free). On a phone the two tabs stand over the square. The folded pane says the two choices and the clearance.
- **Placement's tiles redrawn** (#259, closing #142; Okay's notes, p. 6: "each shows what it does on a ring, as auto-flip's does; no clash with the dial's ring; cleaner arrows with stems, six arrows each"): each tile is a micro dial — the ring as a faint circle and on it six arrows with stems, each the way up of a numeral standing there. Upright: all up. Radial: pointing out. Auto-flip: out above, in below. On path: along the ring (Claude's reading: the word runs round the ring). The A's at 3 and 6 o'clock of 4.36 are gone. Every arrow point sits on the quarter points, so an upright stem covers whole dots (R33).

## beta 4.50.1 (web version) · 17 Oct 2026

- **Positions, with a preview** (#251; Okay's notes, p. 5: "none of these need slider — text boxes and ±; a ring-specific preview at the left, like the hands' detail box: round, not in a square box, with even padding, it may use the eye's column"): at the pane's left a round drawing of the ring's positions — a faint circle, a mark at every position, the used ones in ink, the ones Every · Offset · Skip leave out faint, the first position a dot, so Start is seen (the answer chosen on 16 Oct). It stands where the hand's box stands (the eye's column and the next), as high as the rows beside it, the circle as large as that allows with a unit round it, no frame. Beside it Count · Start ° · Span ° · Every · Offset as **quiet rows** (R15 form B, declared as such now: `quiet`): the name and the number with its compact ±, no slider on the row; the name or the number opens the controller, whose slider does the sweeping. *Skip those instead* beside the box too.

## beta 4.50 (web version) · 17 Oct 2026

Phase G's rest begins, from Okay's notes alone (17 Oct: "now draw me all the sketches … proceed with plan"): the ring drawer and the rows.

- **The ring drawer** (#253; Okay's notes, p. 2–3): the five kind buttons are gone. At the left a **square lit with the ring's kind** (ink, its picture in paper, 36 like the other buttons); beside it the **details** in words — "12 numerals · size 2.4 · radius 10", in the unit box's unit — left-aligned and cut with an ellipsis when the line is short; then **Change**, underlined, never cut, which takes you to the ring's settings (the first pane under the pinned part); then colour · size · radius as before (the answer chosen on 16 Oct). A press on the square opens the five kinds under it, over everything (the list scrolls and would cut it), the ring's kind marked, ending with the note "Settings stay with the ring. Switch back any time." (Okay, 16 Oct: "ok, recommended"; his warning line was not true, R7).
- **The rows** (#254; "no text details, only the kind icon … no adjustments, just an indicator"): a row is eye · grip · the kind as an icon · the name (and the selected ring's rename box). The summary of 4.7–4.49.2 (how many, colour, size, radius) and the colour chip are gone from the rows; the drawer says them. The name stays (the answer chosen). The list's columns: eye · grip · kind (the icon, the drawer's square) · name (the details) · Change · colour · size · radius.
- **The kind pictures** (#255; "a smaller optical size; abort silkscreen there"): the five drawings a size smaller in their 24 box (radius 9.75, was 11), the numerals' 12 · 3 · 6 · 9 and the text ring's ABC · XYZ in the tool's sans, bold (`.figure`), not the pixel font, which now stays for the stickers and the tiny numbers elsewhere.

## beta 4.49.2 (web version) · 17 Oct 2026

- **The number popup is the controller** (#314; Okay's drawing of 17 Oct 2026, "to replace with our current one"): a light head — the name (with its bare chevron where the row has a menu) on a line of 28 over a hairline, inset 22, and the value in bold 25 standing over the slider's knob and moving with it — and under it a dark square (#3F3F3E) holding the slider in a white pill and − and + as two grey discs with white signs (8 thick, 40 long), all three 66 high, a unit and a half round and between them, no frame. 157 × 223 (166 × 219 before). The track is a unit and a half thick, dark to the knob and light after; the knob 44 with a white eye of 12.
  - **Where it stands:** at the finger — the knob under the point that pressed, kept inside the window ("appears covering everything, finger on the middle slider section upon tap, place as needed, on top of everything"). From the keyboard, or with no slider (a window's places), under its button as before. The phone's sheet is gone: the same everywhere.
  - **It comes at once and fades after use** ("comes lightning fast, fade away quickish after use"): no way in; 1.2 s after its last use (a slide, a press on a disc) it fades out in 120 ms (`--num-pop-linger`, `--num-pop-fade`, `POP_LINGER_MS`). A press held, or typing, holds it; Escape, Enter or a press elsewhere put it away at once; none of it where the system asks for less motion.
- **The play flash** (#308, again; Okay: "like a flash: zero to bright in milliseconds, then slow descent. but all very quickly"): the triangle goes from nothing to full within the first 3 % of the flash (12 ms at 1×; a fifth before), then descends, eased; the whole flash is 0.4 of a beat (half before), in real time below 1× as before.

## beta 4.49.1 (web version) · 17 Oct 2026

- **Six more dials in the Gallery** (#287; Okay's notes, p. 18: "a few with windows — am · pm, or an arced date as on a presidential Rolex; a few colourful ones, do not have to be historical, homages welcome"), drawn for Okay to pick from — he keeps what he likes, the rest go: **Day and date** (the day in an arc under 12, the date at 3, batons on champagne) · **Dress, am · pm** (Bodoni on ivory, a dot track, am · pm in a round window at 6) · **Moon phase** (midnight blue, a moon in an arch at 6, thin gold figures) · **California** (half Roman, half Arabic in D-DIN on coral) · **Rally** (a yellow racing dial, a tachymeter ring, a RALLY text ring, a date at 6) · **Teal and coral** (coral Unica One figures on teal, white dots, the date on a coral disc). Two use the text ring (4.48). The zigzag places them with the rest (19 cards, seven lines).

## beta 4.49 (web version) · 17 Oct 2026

Phase J, the Gallery: its order, a card in focus, a tuning pass. (#287, six new dials, still to draw.)

- **The Gallery's order** (#286; Okay's notes, p. 17–18: "the new default watch first; Okay's watch last; just whites zigzag diagonally"): the First dial first, Okay's watch last, and the white dials on the diagonals of the three-column grid — the third slot, the middle of the next line, the first of the line after, and back (`gallery_order`); the rest keep their order between. Each card says whether its plate is light (`light`, from the plate's luminance, written by `gallery.mjs` and `examples.mjs`). Bauhaus-third (15 Oct) goes with it.
- **A card walks into focus** (#289: "choosing a dial no longer takes it over; it comes forward with two choices, take over editing or open in a new window"): a press lifts the card (the chosen tint, the thick ink line) and shows **Edit this dial** · **In a new tab** (short, so it fits a card); Escape or a press elsewhere puts it back. The card is still a link, so a middle click or ⌘-click opens it as before.
- **Okay's watch, tweaked** (Okay, 17 Oct 2026, his link: "Tweaked my dial in the meantime, replace"): the Gallery's last card is his new version — a window, a ring of numerals he calls Band — in `src/opener.js` (`OKAYS_WATCH`), lean as his link carries it.
- **Tuned** (#288: "small numerals get a heavier weight and gradually more tracking … the field watch we have for example it fails; B-Uhr in neutral colours"): the Field's 24-hour figures in Barlow Bold, tracked +40 (SemiBold, untracked); Montgomery's every-minute figures in Barlow SemiBold, tracked +40 (Medium); the B-Uhr — Okay's layout — on a black plate with white marks and cream figures, hands and cap, no coloured backdrop (navy, red, cyan and orange before). The optical-size axis: none of the Gallery's fonts has one but Bodoni Moda, unused there.

## beta 4.48 (web version) · 17 Oct 2026

Phase I: the text ring. (Phase H, the font sheet's design, waits: Okay, 17 Oct, "push the design ui stuff for later".)

- **A text ring** (#297; Faruk Koç's finding of 16 Oct, Okay: "makes perfect sense … Snap to indice is a great idea for this"): a fifth kind, `text` (appended, R9): a line of words — a brand, *AUTOMATIC*, *SWISS MADE* — said at every one of its positions, with a font of its own. It is the numerals' pipeline with one label: HarfBuzz, the anchor (centre · baseline · ascender), the four placements (level, radial, auto-flip, along the circle), Nudge, live text in exports, the guides' edges, a click on the dial, Give way (it counts with the numerals: "markers & numerals above").
  - A new one starts as *AUTOMATIC*, once, under the centre (start 180°, radius a third of the dial's, size 1.2 mm), with the top numerals ring's type.
  - Its panes: **Text** (the words) · Type · Resize · Positions · Give way · Nudge. Its row says "1 text", "3 texts".
  - **Snapping to the indices**: its Start ° holds to the positions of the other rings — the hours' markers, the minute ticks — when it comes within 2° of one (`SNAP_DEG`), typed or slid alike.
  - The kinds' menu and the drawer show five kinds; the picture: words on the dial, in the pixel font, under 12 and over 6 (the drawer's icons are reworked later, #255).
  - `dial.py` does not know the kind (R30): a settings file with a text ring is the web version's alone.

## beta 4.47.2 (web version) · 17 Oct 2026

- **Names a screen reader hears** (#244, from the guide's readers, 15 Oct 2026): a ring's row is an option in a listbox, reached with Tab (the controls' focus ring) and taken with Enter or Space; every slider says its row's name (only the field had it); a colour pill says whose colour it is before its hex ("Colour #141414", "Plate #FCFCFA"); in the showcase the panel and the bar are inert — out of reach for the keyboard and a screen reader. The size and radius popups' fields are already named by their row (4.45.2), and the font box's Size reads once; both are checked now.

## beta 4.47.1 (web version) · 17 Oct 2026

- **Selecting a ring fits the list** (#256; Okay's notes, p. 2: "even if only a few pixels of it show, scrolls so its whole row and drawer are in the view box"): the ring list scrolls so the selected ring's row and the drawer under it are whole in view (the row wins when both can't fit). The finger's anchor (15 Oct) takes the row's new place as its own, so nothing fights.
- **The list's pill** (#256: "when its scrollbar comes on … a resize pill appears in the middle of its bottom black line, like the phone's gripper but black"): with more than five rings a black pill with a paper groove stands in the middle of the pinned part's line, the gripper's measures (`--grip-…`). Dragging it shows more or fewer rows (whole rows, it snaps; one to all); a tap jumps between five and all. Kept by the browser (`dial-tool-ring-rows`), not by the dial. The list's height is `--ring-rows` on the list (five to start).

## beta 4.47 (web version) · 17 Oct 2026

Phase G's first push: the panes' order and *resize from*.

- **Type first in a numerals ring** (#296; Okay: "Move fonts top of adjustments in rings that involves fonts"): the font box is the first pane under the pinned part (it was the last).
- **Resize, the first pane for every ring** (#257; Okay's notes, p. 9: "a proper pane below the quick size and radius buttons … shown first"): how big one thing is — Length for a mark, Ø for a dot, Band width — and the radius, as full rows. Length and Ø leave the Shape pane (which keeps Width for bars and wedges), Band width leaves the Band pane. A numeral's size stays in the font box, among the type's settings (and in the size button's popup); open for Okay whether it should stand here too.
- **Resize from** (#257: "resize from — outer end · middle · inner end"): a new ring key `from` (appended to the link table; starting at the outer end, so every link draws as before, R31). The radius of ticks, markers and bands measures to the mark's or band's outer end, its middle or its inner end: the small menu beside the radius' label, as the numerals' anchor menu (13 Oct); the label reads Outer · Middle · Inner radius, and the ring's row and the radius button's tag say it. A ring's dotted guide is now that radius (a numeral's anchor), not the middle of its extent; a window's is still its middle. `dial.py` ignores the key (R30).

## beta 4.46.7 (web version) · 17 Oct 2026

- **Twenty-one fonts join the list** (#313; the font research of 16 Oct, `docs/font-tiers-2026-10-16.md`, its top tier; Okay, 17 Oct: "incorporate it, push the design ui stuff for later. Add just font list to defaults in these versions nothing else"). The font sheet lists 42 families (21 before). Nothing else changes: the sheet's design (phase H, #273–#276) waits.
  - From Google Fonts (OFL): Anybody · Bebas Neue · Cinzel · Italiana · Marcellus · Public Sans · Sometype Mono · Space Grotesk · Tourney · Unica One.
  - D-DIN (Datto, OFL), in four cuts: Regular · Bold · Condensed · Expanded — from a GitHub copy of Datto's own archive, since Datto's page is not reachable from a session.
  - From Peter Wiegel's zips (OFL): Alte DIN 1451 Mittelschrift · Apollo · Bernardo Moda Contrast · CAT DyFa · CAT Kurier · Erika Type (Regular, Bold) · Immermann · Koch-Fraktur · TGL 0-16 (Regular; DIN 17 as its Slanted style). And GL-Nummernschild (Mittelschrift, Engschrift), Gutenberg Labo's free-software font: its licence lives only in the font's own name table, so that text is kept by hand in `web/fonts/licences/`.
  - `web/fonts.mjs` has three sources more (`wiegel`, a zip opened with `unzip`; `gutenberg`; `datto`), and a space in a file's name becomes a dash. Alte DIN's bolder `_g` file is left out: it carries the same PostScript name as the regular, so the catalogue (keyed by it) could hold only one.
  - The page grows by the new families' outlines (about 300 kB); the fonts themselves are fetched when first chosen, as before, from the live page's `fonts/`.
  - Reserved Font Names on most: files are passed on whole, never subset (research §4).

## beta 4.46.6 (web version) · 17 Oct 2026

Three small ones left over from Okay's marks on 4.46 (handoff §1).

- **The number popup, third look** (#310; Okay: "pill height equals the plus and minus. But that growth does not affect slider, it may move up for good padding. Name is on top, lighter, chevron boxless"):
  - the value's pill is as high as the − and + discs (66, was 44); the slider's pill stays 44. The popup is 219 high (was 197);
  - a popup with a name (a row with a menu, such as *Centre radius*) shows it on top in a lighter grey (`--num-pop-name`, the rule grey #B9B9B4; the pills' mid grey before) with its chevron bare, no box;
  - the name's line is as high as its words (12, was 18), so its ink stands 13 from the frame, as the discs do at the foot ("top padding equals the bottom"); the slider follows it at the usual gap (8.25), 6 higher than in 4.46.5.
- **NOW darker** (#307; Okay: "darker than ams outlines by 20%"): its fill is the bar's light tone (AM's outline, #737373) made 20 % darker, #5C5C5C (`--bar-now`; #B9B9B4 since 4.45.5). Its word turns light (`--bar-now-ink`, the panel's light rule tone #D4D4CF — not white: nothing on the bar is, 15 Oct): the bar's dark on that fill would read 1.7 : 1; now 4.5 : 1. A hover 10 % darker than the outline; a press still the outline's tone.
- **The play pulse at slow speeds** (#308; Okay: "the play animation flash and dim the arrow much faster on slow speeds, flash brighter. Like an analog fade. Eased over the line and comes back kind"):
  - below 1× the triangle's flash lasts as long in real seconds as it does at 1× — half a beat (half a second on a quartz movement) — instead of stretching with the slow motion (five seconds at 0.1×). It still starts on the beat, with the seconds hand's step;
  - its peak there is full (`--play-tri-slow` 1; 0.7 otherwise), set by the button's class `slow`;
  - the flash itself is a lamp's: an eased rise over its first fifth, then an eased fall (`PULSE_RISE`; a jump to full and a fall before). At 1× the rise is a tenth of a second. A sweep's breath runs in real seconds below 1× too.
  - The cap's own fade (the whole beat) is as it was.

## beta 4.46.5 (web version) · 16 Oct 2026

- **A hand's page, the shapes' first black line moves down** (#311; Okay: "Short black line is part of hand selector. Comes after wall and preview box … THERE'S A SPACE. THEN COMES BLACK LINE. BUT THAT SPACE, IS THE SAME WITH ALL WHITES AND BLACK AROUND HERE"). The box and the last row (Wall) end on one line. Then come two units of space (11 px), then the thin black line that opens the shapes' row. In 4.46.4 that line lay on the box's foot. The thumbs keep two units to each black line, so every space here is the same.

## beta 4.46.4 (web version) · 16 Oct 2026

After Okay's marks on 4.46.3.

- **The Show box**: a darker ground (12 % ink, was 7 %), its tick 3 px smaller ("Shows bg darker, tick 3px smaller").
- **The line under it, the same room over and under** ("Vertical gaps before after same"): two units (11 px) from the box to the line, and two from the line to what follows.
  - On a hand's page that is the thin black line, then the rows. The room under it is counted to the first row's own white line.
  - On a window's page it is the pane's thick line ("Thick line stands here"), with the title as far under it as on every heading.
- **Window at x** loses its "Position" line ("Delete position name, that works without"); the circles stand on the title's line.
- **A hand's page**:
  - its shapes are a row of their own after every row (after Wall, and the cap's rows on the seconds hand), from the box's left to the end, all eleven thumbs on one line ("Put hand type as a row spanning preview to end, after wall");
  - the box is as high as the rows beside it, from the first row's line to the last row's foot ("Enlarge the preview to fit the area"). It grows with a shape that has more rows (breguet: three more), and no longer stays in view while the rows scroll, since it is as tall as they are.
  - the thumbs stand between two thin black lines ("a thin black after thin white which mistakenly touches preview box"; "End of hand types, black thin bar to finish instead of white"). The first lies on the line where the box and the last row end, so the white line no longer meets the box. Two units separate the thumbs from each line.

## beta 4.46.3 (web version) · 16 Oct 2026

- **A hand's shapes move under its box** (#311; Okay: "type of hand moves under preview. Fit sensibly, rectangular thumbs would work there"):
  - every shape shows at once as an upright thumb, its picture in a tall tile with no word (pointing at a thumb names it), the dashed SVG tile last;
  - four to a line on a wide screen, in the box's own column, so three lines hold all of them; six to a line on a phone, under the box lying flat;
  - the line of tiles beside the box that opened with "more" is gone. The rows beside the box are now exactly its height (Colour and the numbers).

## beta 4.46.2 (web version) · 16 Oct 2026

After Okay's marks on 4.46.1.

- **The Show box grows down from the chosen tab** (#261; "the top tab attaches traveling show ticker"). It sits under that tab alone, as wide as it, and moves when another tab is chosen. It keeps its darker grey; the rest of the strip is gone. It is less tall, a control high (26, was 31.5), with the room of an open pane under it. The hand tabs now stand in equal columns, as the window cards do, so the box finds their edges exactly.
- **Window at x** (#264):
  - a **4** joins the circles before the dots: 3 · 6 · 9 · 12 · 4 · ··· ("Add 4 to the circles before …");
  - the circles fill their line a unit apart, as large as that allows (37 px at the panel's width, was 36), with a unit over and under them;
  - the heading grows to hold them; its title keeps the gap every heading has over its title ("top gap stays same"), with "Position" tight under it;
  - a time in the dots ("2:15") is set a size smaller so it fits the circle.
- **The hand's page** (Okay: "Blue lines, align, black line, new black line, thin"):
  - under the Show box a thin black line opens the hand's pane, from where the tabs start, with the room of an open pane under it;
  - the hand's box starts where the tabs do, and its top is the first row's line.
  - A fix found on the way: in 4.46 the headless pane carried the class `plain`, which is a button's class, so it took a button's border and padding and stood 6.5 px in from everything else. It is now `headless`.
- **Shape**: its buttons are as high as a place's circle, with a unit over and under them, and the heading grows to hold them, its title in its usual place ("either shrink or enlarge height to fit shape buttons and appropriate vertical padding like all the rows"). As a rule: R32, a heading that carries controls.

## beta 4.46.1 (web version) · 16 Oct 2026

The Windows page, reordered after Okay's marks on three mock-ups (#263–#266).

- **Window at x** holds where the window is and what it shows:
  - **Position** stands on its heading's line (Okay, on the mock-ups: "Move eye up with Window at… put Position after a tight br in its usual size and color, draw the white line below. If it's taller so be it, enlarge buttons. And 3 6 9 12 are circular buttons now"):
    - the heading has two lines, "Window at x" and under it "Position" in a row name's size and grey, with the eye level with the title and the usual white line under it;
    - the buttons are five rounds 36 px across, 3 · 6 · 9 · 12 · ···, spread from the controls' column to the end (#264).
  - The dots open a popup with every place as a button, in the clock's order, and the field for any time. A place pressed is taken and the popup closes. When the window stands elsewhere, the dots say where ("4:30", "2:15") and grow into a pill to hold it.
  - **Shows**, its pictures smaller (30 × 21, was 38 × 27; "smaller icons").
- **Shape** holds the hole itself. On a first visit it is folded, as every pane but the one a tab is about (#270), and its shape buttons stay on its line:
  - its five shapes are buttons without words on the heading's line, stretched across the same columns as Position's (#265; "stretch shapes like position, top-right"), their pictures redrawn at 26 × 18;
  - **Radius** (Okay: "ok but below shapes"), then the sizes. **Width and Height on one line have their sliders again** (Okay: "they can have them"), as R15's new form A2, *two to a line*;
  - Corner, Sides and the turning;
  - the **colours on one line** (#266): Disc and Frame, and Picture for am · pm and moon. The Colours pane is gone;
  - Text, its font, Frame and Clearance.
- **The number popup under a finger** (#310) no longer chooses its value to be typed over, so an iPad's keyboard comes up only when the value is pressed (Okay: "Value gets selected was the wrong choice, triggers the keypad on ipad"). With a mouse it still does.
- **The bar's sliders under a finger** (#309): they no longer drag or pull the page (`touch-action: none`), and the window is never pulled past its edge. The iPad's own edge gestures stay its own (Okay: "simple blocks are fine").

## beta 4.46 (web version) · 16 Oct 2026

Phase F, first push: one tab look and the Show box.

- **One tab look** (#260; Okay, notes p. 1–2: "hands do it better"). A chosen tab squares up, losing its cut corners, and lies over its neighbours. The hand tabs already did this, but only by chance: the chosen layer filled their whole button. The window cards did not. Now it is the tabs' own rule, for both.
- **The Show box** (#261; notes p. 2: "Show this window moves with the tab and says just Show: a thin box, darker than the pane's grey, grows down from the tab and holds it").
  - Under the tabs, on top of the grey page, a thin box a little darker than the page holds one tick: **Show**, for a hand and a window alike. It runs from where the tabs start to the pane's end, with a white line under it.
  - **Hands:** the hand's name line ("Hour hand", its eye, *Show this hand*) is gone, since the tab names the hand. Everything under the box is the tab's content: a pane with no heading, so no thick line either.
  - **Windows:** *Show this window* left the heading line for the box. The *Window at x* pane stays under it until the Windows page is reordered (#263, sketch first).
  - Their ids are now `hand-on-Show` and `window-on-Show`.

## beta 4.45.5 (web version) · 16 Oct 2026

The bar's time, second look (#306; Okay, on 4.45.3, a screenshot marked in three colours).

- **The time** has more room between its figures ("Greens add tracking"): tracking +0.04em, −0.02em before, about 1 px more per figure at 20 px. Its window grows by that. AM · PM keeps its −0.02em (the greens were under the figures; its box width is set for that).
- **AM · PM** has less room beside its word ("Reds reduce hor padding"): 5.5 px each side, 8.25 px before.
- **NOW** is filled ("fill bg, invert type, make button much lighter colored, now still readable?"). Its fill is a light grey (#B9B9B4, the panel's rule tone), much lighter than the bar's light tone, and its word is the bar's dark (#333). Contrast is about 6.5 : 1, so it still reads. Lighter under the pointer, the bar's light tone when pressed. It is the bar's one filled button: an exception, asked for, to "nothing on this bar is white" (#B9B9B4 is not white).

## beta 4.45.4 (web version) · 16 Oct 2026

- **A disc hand's mark** (#300; Okay, on 4.43: "Mark if also possible easily"). A new row, *Marker*, has two choices, **Hole** and **Mark**:
  - **Hole** cuts the marker out of the disc, so the dial shows through. This is what disc hands did before.
  - **Mark** paints the marker on the disc, whole, in a colour of its own (*Mark ink*, white to start). On the dial it is a part of its own that turns with its hand, catches the shadows of the hands above, and is named "… hand mark" in an exported SVG. The hand's box shows it in its colour.
  - The rows below follow the choice: *Hole*, *Hole length*, *Hole width* or *Mark*, *Mark length*, *Mark width*.
- Two keys are appended to the link table, `mark_as` and `mark_c`. They start as a hole, so every scheme-2 link still draws as before (R31; no new scheme).

## beta 4.45.3 (web version) · 16 Oct 2026

- **The number popup, after Okay's drawing** (#304; "tighter, dark background. Thicker plus minus, rounded ends, text larger, no white despite the drawing, all colors mid grays, text, buttons, dial excluded, they are black"):
  - a dark ground (the night colour). The pills and the − and + discs are mid grey. The value, the signs and the slider's knob are black. The chosen value is black with mid-grey figures.
  - the slider and the value in pills 44 px high. Under them, − and + as two discs 66 px across, the signs thick (3) with round ends.
  - tighter: 11 px round them, 8 between them. It is 166 × 197.
  - its corners follow what they hold: 35 at the top (a pill's round + the room + the frame) and 46 at the bottom (a disc's round + the room + the frame), Okay's "plus minus roundness + some offset".
  - the value at 23 px (20 before).
- **The Guides popup, tighter** (#305; "tighter spacing overall, fit all in one line, all selected… line fits better. Small like beta version allowed"):
  - lines 30 high (38 before; under a finger still 38); no extra room over the headings;
  - **an added guide is one line**: its name and values as quiet numbers to type in (grey, no box), its colours, and in the none sign's place a ✕ that removes it. An added guide is removed, no longer hidden;
  - **All · Selected · None** is smaller and spans the colours exactly, from the none sign to the last colour;
  - the names' column 106 wide (92), the room between colours 9 (10), so the list keeps its width and "Window at 4:30" is no longer cut. The Shadows list keeps its 92 for its sliders.
- **A popup's bottom section** (#305, for Guides and Shadows; Okay: "whole bottom section hr line color, top line gone, perpendicular same thickness touches box bottom, lowest line gone"). It is filled with the line colour from edge to edge and down to the box's bottom, cut by its round corners, with no line over or under it. Guides' rule before Reset All is a hairline of the ground, from the section's top to the box's bottom.

## beta 4.45.2 (web version) · 16 Oct 2026

- **The number popup, a square** (#249, #304; Okay, on 4.45: "everything bigger … three pills inside a square … plus minus roundness + some offset to draw the square"):
  - three pills 44 px high (a finger's size), 12 px apart: the slider, the value (at 20 px), and − and + as one pill split in two, with the shared plus and minus signs;
  - 16 px round them, inside the 2 px frame: 192 × 192;
  - its corners 40 px, a pill's round (22) plus the room (16) and the frame (2), so they run parallel to the pills';
  - no name: the row it opens from already says it ("forget the label"). A row with a menu keeps its menu, over the pills.
- **Guides while sliding** (Okay: "activate guides on slide. Even if off"): sliding in the popup, or dragging a name or a value button, shows the guides as they are set, even with Guides off, until 1.2 s after the last change, as the centre hole's guide does. A numeral being nudged hides them instead (#252: "when a numeral is being nudged hide all guides").
- **The tiny ± on the figures** (#250; Okay: "Compact minusplus too far apart, closer, parallels on baseline ascender, plus's top pushes past"): the plus's top on the top of the number's figures, the minus on their baseline. They are drawn signs now (6 points, `DENSE`), not typed characters. Each still answers to half the number's height.
- **Nudge's adjusters** (#252): Radius ±, Angle ± °, Rotate ° and Size × are number rows on the chosen numeral: a slider, the value, ±, and the popup from their names. A neutral value (0, or ×1) is not kept.
- **A window's width and height on one line** (#265, R15 form B): W and H, two quiet numbers whose names open their popups. The arch keeps its one Width row.

## beta 4.45.1 (web version) · 16 Oct 2026

- **The hand rows, quiet** (#250; Okay's notes, p. 18):
  - The number beside a hand's box has no box. It and its compact ± are grey until the number differs from how the dial opened, then ink.
  - A press on the number opens its popup. With the keyboard (Tab) it still takes typing and the arrow keys.
  - The box that grew over the slider (4.25) is gone.
- **Names:** one line each, none longer than "Counter Ø": Round, Tip, Head W, Widest %, Wall, alongside the existing short ones. The names' column is that wide, so the sliders are longer.
- **Order:** Colour stands first beside the box; the cap stays last.

## beta 4.45 (web version) · 16 Oct 2026

Phase E, first push: the number popup.

- **The number popup** (#249; R15's popup). It holds:
  - the number's name;
  - the slider, its thumb a pill a fifth larger than the panel's;
  - the value in a pill;
  - round − and + under it.
  It sits in a 2 px dark-grey frame on a ground darker than the pane's, its corners as round as its pills. It is the number's own row laid out anew, so it does everything the row does (typing past the slider's range widens it). It opens under what was pressed. On a phone it is a sheet at the bottom, over the drawer, so the dial stays in view, and the keyboard comes only when the value is pressed. Enter, Escape or a press outside closes it.
- **It opens from:**
  - a value button, which no longer grows its tag into a small square;
  - **a full row's name**: a press on "Diameter" opens Diameter's popup;
  - **the guides' Thickness**, whose slider is back, in the popup (R15 form B, #271).
  A press on a name moved sideways changes the value instead, two screen points a step, as a value button does (#170).
- **Reset All asks first** (#271): "Reset all guides?" in its line's place, with round ✕ and ✓. ✕ keeps the guides.

## beta 4.44.6 (web version) · 16 Oct 2026

- **The time larger, its colons roomier, AM · PM attached** (Okay: "Barlow larger, don't worry optically will be better, more spaces both sides of :s, am attached to time and same size barlow"):
  - The time is 20 px (17 before).
  - Each colon is 0.24 em wide (0.155), so it has about twice the room either side.
  - AM · PM is attached to the time's box again, as high, its word the time's size, one width for both.
  - On a phone both are 12 px.

## beta 4.44.5 (web version) · 16 Oct 2026

- **1× has a dot on the speed line** (Okay: "1x needs a dot"): a filled black dot, the end rings' size, where slow motion ends.
- **The play button's pulse goes faster** (Okay: "Play button can go faster in animation"): it now follows the time up to six flashes a second, not three. The three-flash limit (WCAG 2.3.1) is for flashes over a large part of the view; a 31-point button is far under it.

## beta 4.44.4 (web version) · 16 Oct 2026

- **The unit box, done** (#302; Okay: "Mm looks perfect now add 2px more padding and we are done. Others use the same height, width can change"):
  - 4 px round mm's letters.
  - Every unit's box is mm's height on mm's baseline, as wide as its own word; ascenders and descenders reach into the padding (2.5 px or more left).
- **The unit menu stands over the rows under it** (Okay: "Thou falls under, this top bar here needs a z index of its own"). The unit box is moved onto the title's baseline with a `translate`, which made it a layer of its own at 0, so its menu fell under the − + of the row below. It now has its own level, as the title has.

## beta 4.44.3 (web version) · 16 Oct 2026

- **The unit box: the same room on every side, on every screen** (#302). Counted on Okay's screen (4.44.1), "mm" stood on the box's bottom line: 4.5 px above it, 0 below, 3 left, 2.5 right.
  - The box was the right size; his browser placed the word inside a button differently from Chromium.
  - Now the word is placed by the page, not by the button. The letters' size and place come from Dial Mono's own outlines (`UNIT_INK`, printed by `fonts/ui/mono_font.py`). The baseline is measured with a dot on the word's line, once the face has loaded; browsers round a face's ascent and descent each their own way (8 px down a 10 px line here, 8.6 by the face's figures).
  - The box, the word and the box's place on the title's line are snapped to whole screen dots, so its line stays crisp.
  - Counted again at 2× (Chromium): every side 2 px, to a screen dot, for all five units.
- **The Shadows sign: no seam round the ball** (Okay: "There's a single faint line around the ball"). Its shadow was cut at the ball's outer edge, where two smoothed edges met and let a hairline of the ground through. It is now cut at the middle of the ball's line, so the cut lies under the line.

## beta 4.44.2 (web version) · 16 Oct 2026

- **Reset's button stands flush left with its warning** (Okay: "reset button flush left with explaner text"), on the heading line where the warning starts, the controls' column. It was at the line's right (#269).
- **The Shadows sign: the ball sunk 2 px into its shadow** (Okay: "Shadow's ball sinks 2px down into its shadow"). The ball stands in front, its disc cut out of the shadow, which shows to its right and under it. It touched the shadow from 4.42.4.

## beta 4.44.1 (web version) · 16 Oct 2026

- **The unit box, third look** (#302; Okay: "mm button sucks … use mono, abort silkscreen, border and letters should match, small"; then "Not system font, something universal … match the box please, and mm lowercase"):
  - The word is in small letters ("mm") in **Dial Mono**, a packed cut of JetBrains Mono (3 KB). It is the same on every machine, and its weight (456) makes its stems exactly as thick as the box's 1 px line at 10 px.
  - The box stands 2 px round the letters' ink on every side, so each unit's box is its own size; "thou" is taller for its ascenders.
  - Line and letters are one colour.

## beta 4.44 (web version) · 16 Oct 2026

Phase D: the bottom bar.

- **A play triangle on the red cap** (#282), in place of the beat's dot. It is white and soft, 40 % at rest, its corners on a circle 0.45 of the cap's radius, centred on its ink. While time runs:
  - At each beat the cap lightens by up to 30 % and fades the whole way to the next beat, eased.
  - The triangle flares to 70 % with it and fades faster, back to 10 % by half the beat.
  - The pulse follows the time shown, so it falls with the seconds hand's steps and quickens as time runs faster. Above three a second (or the movement's own beat, if that is more) it holds, in real seconds; 720× no longer means hundreds of flashes a second.
  - Where the system asks for less motion, nothing pulses and the triangle stays at 40 %.
- **Slow motion is back** (#283). The speed slider's first part, two thumbs wide, holds 0.1 · 0.25 · 0.5 · 1×, and the thumb snaps onto them; from 1× the log scale runs to 720× as before. The thumb starts at 1×; the left end says 0.1X. While the speed is being moved, its name over the thumb is a pill exactly like 10:10's. On a phone, where the speed is written in the thumb, a slow speed loses its leading 0 (".25X") to fit.
- **The time in Barlow Condensed** (#284). Light, whose strokes are 0.90 px at the time's 17 px, against the box's 1 px line. Tabular figures, tight tracking (−0.02 em), the colons 80 % as large and centred on the figures.
  - It is packed into the page as **Dial Time**: cut down to what the time needs (11.8 KB) and renamed, so it can't clash with a ring's Barlow Condensed (`web/fonts/ui/time_font.py`, SIL OFL).
  - The time's box is narrower (113 → 69 px), so the speed track is wider (123 → 171 px).
  - AM · PM is in the same face, in a smaller box beside the time with the same room on every side, one size for both words. NOW is untouched.

## beta 4.43.2 (web version) · 16 Oct 2026

- **The guides follow the tab you're in** (#301; Okay, on 4.43: "both window and [ring] active gives us a complex look"). *Selected* now means the selected one in the tab you work in: the Rings tab shows the selected ring's guides, the Windows tab the selected window's, the other tabs neither. The dial's own guides (centre hole, centre lines) show in every tab while on. With *All*, every ring's or window's guides show, and those out of focus are faded to 40 %. Researched first: Glyphs' local and global guides, Fusion 360's sketch dimensions, Blender's *Fade Inactive Geometry*, Illustrator's smart guides and Figma's measuring lines all show one thing in focus at a time.
- **The first window's guide starts yellow**, a colour no other guide starts with (it was cyan, the centre hole's).

## beta 4.43.1 (web version) · 16 Oct 2026

- **A disc hand's marker is called its hole** (#300): *Hole*, *Hole length*, *Hole width*. It is cut out of the disc, and Okay liked it that way ("work as holes now, perfect, just call it that"). Only the row names changed; the settings keys stay (R8). A mark drawn on the disc as well is on the list (phase E).

## beta 4.43 (web version) · 16 Oct 2026

Phase C: the link system.

- **Links in capitals and digits only** (#278, link scheme 2). A link is now `#2` followed by letters and digits (Crockford's base 32: no I, L, O or U, so nothing looks alike). No dashes, underscores or tildes, so it breaks evenly wherever it is pasted. Typed in small letters, or with O for 0, it still reads.
- **And shorter** (#246, its lossless parts). Each key is written as a short code from a table that only grows. Colours are written as hex, numbers to 3 decimals, the time to the second. Every link kept in the repo got shorter, even with base 32's longer letters: Okay's watch 1214 → 1001 characters, the Gallery and the examples together 8092 → 7464. The most a value moves: a colour channel by half a hex step (0.9 → 0.902).
- **Old links don't open any more** (R31 as replaced). A scheme-1 link opens the First dial, and a note says so on the preview (a press puts it away) and in the log. The Gallery's and the examples' links are written again. **The live guide's links are scheme 1: they open the First dial until the guide is rebuilt** (on Okay's word, R25).
- **The cap is part of the seconds hand** (#262). Its size and colour are in the seconds hand's pane; the Cap pane is gone. With no seconds hand, the topmost hand's pane offers *Cap on this hand*, off: a dial without a seconds hand has no cap until it is ticked. Okay's World time (Gallery) and the Gauge example have no seconds hand; they keep their cap, ticked in their settings, and their pictures are unchanged.
- **Tests:** `web/test/linktrip.mjs` (#291, in `npm test`, under a second). Every Gallery and example dial, the opener and Okay's watch go there and back as the same dial, and their links come out the same when written again. A text starting with "#" stays a text; the beat and the time travel; base 32 holds any bytes; every settings key has a code; the key table only grows.

## beta 4.42.5 (web version) · 16 Oct 2026

The last push of phase B: the guides.

- **The centre hole has a guide** (#267), first in the guide list, cyan to start. While the hole is being sized it shows live, even with the Guides switch off or this guide set to None, and goes 1.2 s after the last change.
- **Every ring and every window has two solid circles at its edges and a dotted one at its middle** (#272). A ring's edges are where its marks, numerals or text actually reach as drawn.
- **Windows have their own section in the guide list** (#271), like Rings: *All · Selected · None*, Selected to start, then a line for each window that is on, with its own colour. The section is hidden when no window is on. *Window radii* is gone; the top of the list keeps only Centre hole and Centre lines.
- **The guide list, tidied** (#271):
  - Lines 4 px shorter (38).
  - A colour not chosen shows at 60 %.
  - The "none" sign is one path, so nothing in it overlaps.
  - A band of the fields' colour before *Add*.
  - The last line: Thickness, its number with a compact plus and minus, a rule, then **Reset All**. Reset All also resets the rings' and windows' guide colours.
  - Thickness lost its slider: next to Reset All it had no room left (0 px, measured). It comes back in the number popup (phase E). Reset All's "Are you sure?" comes with it too.
- **Test fix** (`web/test/window.mjs`): the "someone else's browser" in the link checks is now a browser context of its own. As a second tab it shared the first tab's storage, and the first tab, its clock running, saved its dial while the second was starting. The check "no last session: it opens with the First dial" failed twice in a row because of this.

## beta 4.42.4 (web version) · 16 Oct 2026

- **The title line, second look** (#299): a fifth unit, **thou** (a thousandth of an inch); the unit box says its unit in the pixel font, in capitals (MM · PT · IN · LIG · THOU), a smaller box (35 × 15.5), one width for all; the Gallery pill a hair taller, upward (1 px).
- **See-through shadows** (#295): a hand that lets light through casts a lighter shadow, tinted with its colour, as light through coloured glass does; a solid hand casts the shadow it always did. Each shadow is multiplied onto what it falls on; see-through shadows are drawn first, so where a solid one crosses them nothing is darkened twice.
- **The Shadows sign**: its cast shadow moved up to touch the ball (#281). **The eye switch**: its rays a hair thicker, 0.625 (was 0.5); **the showcase's iris stands over the eye**, one unit apart, as Backdrop over Shadows (#280).

## beta 4.42.3 (web version) · 16 Oct 2026

- **Copy link** (#277) stands on the heading line of *Link to this dial*, flush right, with a link sign (a new icon, through the pipeline), and stays there when the pane is folded. The link stands on one line, cut at the box's edge (Copy link copies it whole); under it, its length and what "fonts travel by name" means. The beat travels in the link (it always did; now a test says so).
- **Settings file** (#279): a sentence says what a settings file is; after Load the pane's heading names the file and Save… offers that name again. **Defaults** now gives the guide's First dial, as the tool opens with ("Guide default wins"); a new **Plain dial** gives the plain starting values, where the guide's First dial begins.

## beta 4.42.2 (web version) · 16 Oct 2026

- **A first visit opens tidy** (#270): in every tab the pinned panes are open and the panes under them folded, each saying in its line what it holds — but for the pane a tab is about when only tabs are pinned above it (a hand's, a window's). What a visitor opens or folds is remembered, as before. A click on a numeral in the preview opens Nudge, since it starts folded.
- **Colours, folded, shows its colours** (#268) as tiny swatches, as many as fit on its line; it starts folded.
- **Reset** (#269): open, its button stands at the right of the pane's heading line, the warning under it; folded, the line says Reset and nothing else.
- **Custom labels say how they work** (#298): "Commas between labels: one label for each position, the rest stay empty" (found by Faruk Koç).
- **Hands:** the line between All hands and the hand tabs starts and ends where the tabs do (#260).

## beta 4.42.1 (web version) · 16 Oct 2026

- **The title line, quieter** (#285): the unit box is a small box at Help's size, one width for every unit, flush right; the Gallery pill stands right after Help, as far from it as Help is from the version, a small pill as high as the unit box, darker than the unit box and lighter than Help. Both stand on the title's baseline (placed by measuring, like the title).

## beta 4.42 (web version) · 16 Oct 2026

Phase A of Okay's notes (build list #290). Nothing on screen changes: the look-check (`web/test/same.mjs`, 489 states) finds no difference but six readings of the showcase's Now and 10:10 pills caught mid-fade (a 250 ms opacity transition, read at another moment; none of their tokens moved).

- **Specials, in one place** (R32): every value in the stylesheet that leaves the scale of spaces, the three line widths or the type sizes now stands in one labelled block at the end of `1-tokens.css`, by name, with why — first the ones Okay asked for (the quiet buttons at 75 %, the type sizes 10 and 17, the pixel font at 12 in the legend, the bar's pixel labels at full strength, the pop-out's chip gap, the speed box's padding), then the ones found off the scale with no figure from him (#294, to look through). Three bare values in rules became tokens there (the legend's pixel size and sticker padding, the bar labels' strength).

## beta 4.41.25 (web version) · 16 Oct 2026

- **Reset moved into the Dial tab**, last, under Colours, with a warning under it: it replaces the whole dial with the guide's First dial (undo brings yours back). The pill over the dial is gone: a view option it is not.

## beta 4.41.24 (web version) · 16 Oct 2026

- **The tool opens with the guide's First dial** (the black field watch, 34 mm) when the address has no dial and nothing was kept. Okay's watch stays first in the Gallery.
- **Reset**, a pill at the foot of the dial: brings back the First dial, every setting. Undo brings back what you had.

## beta 4.41.23 (web version) · 15 Oct 2026

- **Help**, beside the version in the title line: opens the guide (duztman.github.io/dial-tool/guide/) in a new tab.

## beta 4.41.22 (web version) · 15 Oct 2026

- **Gallery:** Sector is Okay's own version (a thin band round the inner pies).

## beta 4.41.21 (web version) · 15 Oct 2026

- **Dial links have no dashes**: a tilde where a dash was, so a pasted link breaks only at its line's end. Old links still open.
- **Gallery:** World time before Elapsed time.

## beta 4.41.20 (web version) · 15 Oct 2026

- **Gallery:** World time is Okay's own version (dark red hands, larger day and night figures).

## beta 4.41.19 (web version) · 15 Oct 2026

- **Opening a Gallery dial keeps the panel where it was** (it jumped back to the top).
- **What you press stays under your finger** while rows above it appear, go or move (the ring line, more/less, folds), as far as the panel can scroll.
- **A ring's grip is easier to catch** by finger (it reaches into the start of the name).
- **Alternate**: a band with an even number of sectors can take two colours that alternate.
- **Gallery:** the B-Uhr is Okay's second version (navy, cyan marks).

## beta 4.41.18 (web version) · 15 Oct 2026

- **Gallery:** Montgomery fifth; the 12 + 24 is Okay's own, in Rubik.
- **Rubik** joins the font list (twenty-one).
- **Selecting, showing or moving a ring keeps the panel where it was scrolled** (it could jump by hundreds of points).

## beta 4.41.17 (web version) · 15 Oct 2026

- **Montgomery comes right after 12 + 24 hours** in the Gallery.

## beta 4.41.16 (web version) · 15 Oct 2026

- **The Gallery's diver is Okay's own**, blue with a striped dial, and fourth.

## beta 4.41.15 (web version) · 15 Oct 2026

- **Bauhaus is the Gallery's third dial**, after Okay's watch and his B-Uhr.
- **The Gallery pill folds Export a file** (its eye shut), so the Gallery has the room; open it again with its eye.

## beta 4.41.14 (web version) · 15 Oct 2026

- **Fixed: steppers showed through the open bio.**

## beta 4.41.13 (web version) · 15 Oct 2026

- **The size button's drawing lies level**: the small and large circle side by side on the radius line, larger than before.

## beta 4.41.12 (web version) · 15 Oct 2026

- **The Gallery's B-Uhr is Okay's own**: green plate, yellow triangle, orange hours, lilac minute numerals; same name.

## beta 4.41.11 (web version) · 15 Oct 2026

- **On a phone the mark is larger on the full title line** (22, as in the showcase); squeezed, it is the eyes' size again.

## beta 4.41.10 (web version) · 15 Oct 2026

- **A phone's title line, full and squeezed**: at the drawer's top it is full — the title at its size, the Gallery pill, mm; once the drawer scrolls it squeezes (no Gallery, no mm) and stays on top with the tabs held under it; back at the very top it is full again.

## beta 4.41.9 (web version) · 15 Oct 2026

- **Okay's watch opens the Gallery**: the dial the tool opens with, first of its cards.
- **A Gallery pill on the panel's top line**, centred between the version and the unit box, dressed like the unit box: pressed, Export with the Gallery open and in view.
- **A phone's bar**: the time at the bar's text size (12, as AM); how fast takes the room it gives; the red dot has 16.5 either side (was 14 and 10).

## beta 4.41.8 (web version) · 15 Oct 2026

- **The showcase has 10:10 beside Now**: the same whirl, to the classic pose. Whichever is pressed turns into the undo sign; the other stays where it is. The way back is always to the time first shown.
- **A hands key at the showcase's bottom left**, across from the X: round, the Hands sign inside. Pressed, it hides the hands (filled, the sign dark); the dial's own Show hands is left as it is.

## beta 4.41.7 (web version) · 15 Oct 2026

- **The showcase's Now, rechoreographed**: the hour hand turns once clockwise, the minute hand once anticlockwise, both landing on the time; the seconds hand makes no turn and goes the short way to its place meanwhile. Slow to start, slow to land. Going back, each big hand turns the other way. (Was: every hand two turns, the same way.)

## beta 4.41.6 (web version) · 15 Oct 2026

- **The thick line under what stays put stops at the margins**, like every other thick line; in the margins the white meets the grey with no line. Desktop and phone.

## beta 4.41.5 (web version) · 15 Oct 2026

- **On a phone FIT is as wide as its sign and word need**, with equal room either side (9 px, as NOW has); the day slider gives way.

## beta 4.41.4 (web version) · 15 Oct 2026

- **The narrow layout's font sheet offers link and file only**: Installed (a desktop Chrome or Edge thing) isn't shown there, and the two keep their second lines.

## beta 4.41.3 (web version) · 15 Oct 2026

- **On a phone the font sheet reaches up to the bar**, over the whole preview.
- **A word longer than its box in the font sheet's buttons is cut at the box's edge** (Legend's "(OpenType abbr.)").

## beta 4.41.2 (web version) · 15 Oct 2026

- **A switch whose words show is filled with the backdrop's colour**, so the dial under it doesn't show through: the iris switch opened to ACTIVATE SHOWCASE, and Guides, Backdrop and Shadows (always on a wide screen; on a phone while their words are unfolded).

## beta 4.41.1 (web version) · 15 Oct 2026

On a phone:
- **The drawer's title line is compact**: a pane heading's height, the mark at the eyes' size, "Dial Tool" at the panes' size; the unit box is gone (lengths in mm).
- **Scrolling the whole drawer**, the tabs stay on paper across its whole width and on the thick line, as at its top (the panes no longer show past their edges).

## beta 4.41 (web version) · 15 Oct 2026 · released

- **A phone's edges meet halfway**: the bar, the switches on the preview and the drawer all stand 2.5 units (13.75) in from both sides (the bar and drawer had 16.5, the switches 12).
- **The bottom bar's monospace is tracked 50** (time, AM · PM, NOW, FIT, the hours, 10:10); labels stay centred on their ink, tracking counted.
- **The drawer's gripper is a pill** with one groove across it; held, it is black with a white edge and the whole line goes black.
- **On a phone the speed is written in its thumb**, in the pixel face, in place of the eye.
- **The bio**: "Designed and vibe coded by Okay"; the contact line ends the first paragraph.

## beta 4.40.1 (web version) · 15 Oct 2026

On a phone (and an iPad held upright):
- **The drawer has a gripper**, a grey dot on its top line: drag it to make the drawer taller or shorter, tap it to jump between about half and three quarters. Tall enough, the drawer holds its title, tabs and pinned panes still and only the rest scrolls.
- **The switches on the preview show their signs only**; a tap on empty backdrop unfolds their words for three seconds.
- **The Guides and Shadows lists open as sheets from the bottom**, over the drawer, never cut by it.
- **The strip under the phone's status bar takes the bar's colour**, so the bar no longer starts against white.
- **The showcase keeps the mark and "Dial Tool" at the top left**; the mark is larger on a phone.

Everywhere:
- **What stays put ends on the thick line on every tab** (Dial, Rings and Export had a hairline).
- **FIT** in capitals at 12, as NOW and AM.

## beta 4.40 (web version) · 15 Oct 2026 · released

The night's work after 4.38 (4.38.1 to 4.38.11, 4.39, 4.39.1 to 4.39.4), released to `main` as 4.40 (Okay, 05:53: "Release this, it deserves a 4.4" — 4.4 is taken, by 12 Oct's review, so 4.40). Nothing in a dial changed; links and settings files open as before.

- **The play button pulses with the movement's beat**, a light dot at its middle; the speed runs 1× to 720×.
- **Your watch opens the tool** on a first visit (`web/src/opener.js`); Defaults still gives the plain starting dial.
- **Okay's mark and bio** in the panel's first column: who made the tool, its source, the open-source work it stands on, and a contact link.
- **Guides** start with pink centre lines and the selected ring; their sign has ink traps and stays the same off and on. **Shadows** has a sign. The window never zooms; only the dial does.
- **The eye switch** (bottom right) shows the dial alone: the panel slides away, the dial grows to fit.
- **The showcase** (the iris switch beside it, through ACTIVATE SHOWCASE): the dial at 2/3 of an A4 on a dark 45° sky, a spotlight through a twenty-second sun day (drag across to move the sun), the clock running; Now spins the hands to now and back; the X goes back the long way.

## beta 4.39.4 (web version, printed as 4.38.16) · 15 Oct 2026

- **Out of the showcase the long way**: the bar rises and the panel slides back, eased, while the dial travels home.
- **A gentler sun**: a day in twenty seconds, always 40° high on its ray; at sunrise and sunset its light (shadows and spotlight) fades out and in instead of the shadows growing long.
- **The X and Now** are a quarter larger, less faint, and stand a margin in from the window's edges, like the mark at the top left.
- **The arrow hint** is three times larger, white with a glow, centred between the dial and Now.
- The iris and eye switches no longer touch: the unit between them, as between the other switches.

## beta 4.39.3 (web version, printed as 4.38.15) · 15 Oct 2026

- **The showcase, reshaped.** The iris switch opens to ACTIVATE SHOWCASE first; only those words go in. Going in and out, the panel, the bar and the switches go (and come back) at once and only the dial travels, eased — to 2/3 of the width of a portrait A4 fitted in the window, centred; out, back exactly where it stood.
- The sky is a 45° gradient, lightest at the top left. A spotlight lies behind the dial and takes its shadow: an oval at sunrise and sunset (faintest, softest), a circle at midday (brightest, almost crisp).
- The sun crosses a day in ten seconds — rising at the left, at midday from the top (40° high), setting at the right — then rises again. A drag across the window moves it along that day.
- The iris switch is an X in the showcase (the way out); Now is tracked 100. Pressed, every hand turns twice and lands on now, and Now shrinks into an undo sign; pressed, the hands turn twice back and it grows into Now again. Over Now, a left-right arrow sways once when the dial arrives. The mark and "Dial Tool" are fainter and can't be pressed.
- The shadows' soft edge is off while anything moves (the dial travelling, the panel sliding, the hands spinning, a drag) and comes back when it stops.

## beta 4.39.2 (web version, printed as 4.38.14) · 15 Oct 2026

- **The showcase**: a new switch left of the eye, the iris alone. Pressed, it shows the dial alone and more: the backdrop darkens to a faint gradient (black at the bottom, the backdrop's colour much darkened at the top), the bar sinks away, and nothing stays but the mark and "Dial Tool" (top left), the iris (bottom right, twice as big) and a Now pill (bottom centre). The clock runs at 1× from where it was, shadows are on with the soft edge, and the sun goes round six times as fast as the minute hand, rising and setting once a round; a press or drag on the preview puts the sun there. Pressed again, back to where you were.
- **The mark is aligned to the title's capitals** (it sat a point low).

## beta 4.39.1 (web version, printed as 4.38.13) · 15 Oct 2026

- **The eye switch shows the dial alone**: pressed, it fills (a hair inside its line) and the panel slides away to the left, eased; the dial grows and centres in step. The mark, "Dial Tool" and the version stay where they were, turning white on a dark backdrop; Backdrop and Shadows ride left and stop on the mark's line; undo · redo stop after the title; the bottom bar stays. Pressed again, all comes back. On a phone or a portrait iPad the preview grows down over the panel instead.
- The speed box's growth toward play is now taken from play's margin, not by a negative margin (R32).

## beta 4.39 (web version, printed as 4.38.12) · 15 Oct 2026

- **The tool opens with Okay's watch** when there is no dial in the address and no last session (`web/src/opener.js`). "Defaults" still gives the plain starting dial.
- **The Guides sign is one drawing**, on and off: off it is only fainter (the slash is gone).
- **The eye switch moved to the preview's bottom right**, over the zoom, and is redrawn: the iris, 24 thin rays from it cut by the box, and the eye's outline knocked out of the rays; inside the eye only the iris.

## beta 4.38.11 (web version) · 15 Oct 2026

- **mm is quiet**: the unit box's word and line one colour, as light as a switch that can't be pressed; dark under the pointer.
- **The speed box clears its thumb evenly**: at either end the thumb stands as far from the wall as from the top and bottom (3); the box grows toward the play button to make the room, so the track keeps its length.
- **The bio ends "Contact him here."**: a mail link to Okay whose address is kept scrambled in the page and source and put together only when pressed.

## beta 4.38.10 (web version) · 15 Oct 2026

- **Okay's mark redrawn thinner and on the grid**: lines 1 (were 1.25), the ring 1.375 (was 1.625); every straight edge on a whole dot of a 2× screen; each line ends on the ring, as in his drawing.
- **The mark turns over while the bio is open**: light on a night disc a little wider than its ring.
- **The bio has no title of its own**; its text stands on the title's line, the bullets hang left of it.

## beta 4.38.9 (web version) · 15 Oct 2026

- **The eye switch has eight lashes**: four more from the eye's corners out to the box's corners; the upright lashes no longer bulge into the eye.
- **The Guides sign's ink traps as Okay picked them** (r 0.45), and their true size: in 4.38.8 the cuts took the sign's stroke and came out wider.

## beta 4.38.8 (web version) · 15 Oct 2026

- **Okay's mark** in the panel's first column, left of the title; a press opens a short **bio**: who made the tool, the source and its licence, and the open-source work it stands on — HarfBuzz, Skia's PathKit, Inter, Silkscreen, the twenty OFL dial typefaces, DrawBot, esbuild, Playwright.
- **An eye beside Backdrop**: a square switch with an open eye whose lashes run out to its edge. A preview of something to come: a press only turns it on and off.
- **The speed's thumb 160 %** (14 → 22), its eye the same size.
- **The Shadows sign mirrored** (lit from the upper left, the shadow to the right), its outline as thin as Guides'.
- **Ink traps in the Guides sign**: a small cut in each inside corner where an arm crosses the ring.

## beta 4.38.7 (web version) · 15 Oct 2026

- **The window never zooms, only the dial** (#193): a pinch on the panel, the bar or anywhere but the preview does nothing; inside the preview it zooms the dial as before. The page asks iOS not to scale it, fingers may only scroll (`touch-action`), Safari's gesture events and ctrl + wheel are refused outside the preview.

## beta 4.38.6 (web version) · 15 Oct 2026

- **The Shadows switch has a sign** (#192): a sphere lit from the upper right, its shade a crescent on the lower left, its shadow a flat ellipse cast to the left — after a photograph Okay sent. Whole when shadows are on, faint when off.

## beta 4.38.5 (web version) · 15 Oct 2026

- **Guides start lighter**: centre lines in pink, no window radii, only the selected ring's edges; the dial edge's guide is gone from the list and the preview. Old links that kept the old starting values see these (preview only; R31 notes it).
- **A switch that is on shows its sign whole**, not only its word (Guides; Shadows has only its word).

## beta 4.38.4 (web version) · 15 Oct 2026

- **No slow motion** (#190): the speed runs 1× to 720×. Its two ends are black rings with empty eyes, named 1X and 720X in the bar's grey; the ball at 1× and the snapping are gone. The speed riding over the thumb is white — the one white thing on the bar.

## beta 4.38.3 (web version) · 15 Oct 2026

- **The beat's dot three times as large** (#191): radius 7.5 of the cap's 15.5.

## beta 4.38.2 (web version) · 15 Oct 2026

- **A light dot in the middle of the play button** (#191): it lights with each beat and fades with the pulse.

## beta 4.38.1 (web version) · 15 Oct 2026

- **The play button pulses with the movement's beat** (#191): while time runs its red cap brightens faintly at each beat and fades before the next — 1 a second for quartz, 6 or 8 for the mechanical beats, counted in real seconds (at 1× in step with the seconds hand; faster speeds don't make it flicker); a sweep breathes once every two seconds. Not where the system asks for less motion.

## beta 4.38 (web version) · 15 Oct 2026

Shadows and a new bottom bar, built on a trial page (`try/shadows`) from 14 Oct, 22:36 to 15 Oct, 01:08, then made the live page (Okay: "Congratulations this is v4.38"). Released to `main` with 4.37 and 4.37.1.

- **Shadows on the preview** (#189): one far light; the hands, the cap and the date discs at heights in mm; each surface catches only what falls on it, so a shadow steps where it crosses a hand or a window's edge; nothing outside the dial; preview only (R5, R26). A Shadows switch at the bottom left of the preview with its list (light from · height · darkness · soft edge; each hand's height, the cap's top; the date discs' depth; Reset), Okay's values to start. Switches on the preview no longer go bold when on: their word turns whole.
- **The bottom bar, redone** (#190): a fifth higher; all monospace; one light tone, 55 % grey, nothing white. Play is a red arcade button seen from above, the size of a section tab, pressed in while time runs. How fast is one slider, 0.5× to 720× on a log scale: a black line with knobs at its ends, a ball at 1× (snaps there), the speed riding over the thumb in Silkscreen with a black 1X left over its ball. The time larger, centred on its ink, its AM · PM window beside it; NOW in capitals. The day slider no wider than on an iPad, 10:10 on its own thick line. "⌘ + scroll to zoom" on a desktop; Fit with a magnifier. The panel's square and the status line are gone.

## beta 4.37.1 (web version) · 14 Oct 2026, evening

- **Short labels centred on their ink** (#186): the window's places (3 … 10:30, 4, ···), the speeds (1× · 60× · 720×), AM · PM, the bottom bar's hours and 10:10, and the unit box. Each label is measured as it is drawn (`web/src/ink.js`) and moved so the rectangle its ink covers stands on the box's centre; its figures are proportional, so a "1" no longer carries a "0"'s width. Measured on the page at 1440 wide: "10:30" was 0.5 px right and 1.25 px high, now 0 and 0.75; "1×" was 1.25 px high, now 0.25 (test: the window test reads the dots). Fields and the time keep tabular figures.

## beta 4.37 (web version) · 14 Oct 2026, evening

The Now list, built by Claude alone in an hour (Okay, 18:00). On `dev` and the live page; `main` stays at 4.36.1.

- **The eye only shows or hides** (#183): it no longer selects the ring, so the rows below don't jump and the next eye stays under the pointer. A click on the row still selects.
- **Touch** (#153, #152): no grey tap box and no focus ring after a finger's tap (a key brings the ring back); a pinch follows both fingers from the moment the second lands — zoom by their distance, pan by their midpoint.
- **Opacity on hands** (#163): the colour pop-out's opacity strip for each hand.
- **Time from the keyboard** (#84): ← → a minute, ⇧ an hour, space plays or pauses — not while typing, on a slider or in a menu.
- **Window frames stay even** (#168): circles, polygons and arcs grow by their measures; stroking a circle had bulged it up to 6 % at the diagonals (the "four-petal blob").
- **Centre hole** (#165): `dial_hole`, Ø 2.7 mm to start, a row under Diameter; seen when the hands are hidden; a cut line on a production mask. Every dial gets it, old links too (Okay waived R31 for it).
- **Arc text** (#166): a date or day in an arc window bends along the arc and reads left to right at the bottom; it stays outlines with live text on.
- **Disc hand** (#164): a new hand shape — a disc carrying one marker (bar · wedge · dot), its outer end at the hand's Length, cut out of the disc where it lies on it.
- Not done: #85 (hand tip to a ring's edge) parked with snapping (#184); #167 (am · pm colours) couldn't be reproduced.

## beta 4.36.1 (web version) · 14 Oct 2026

- **The Guides switch as Okay drew it:** guides on, the target's centre ring dashed; off, a hollow slash — two lines with the target cut away between them.
- **The rename box thinner:** a quiet sign, `DENSE` (corners an eighth heavier, as on any box).
- **The round tools' rims light grey** (`--rule`, about 28 %, the value discs' colour), at full weight.
- **The icon check** visits the size button pressed; `<mask>` parts are not read as lines.
- **The repository is the web tool** (no change to the tool): the DrawBot version — `dial.py`, its tests, its preview plan, reference renders and the 4 Oct guidebook — moved to `archive/drawbot/`, unchanged. Every build since beta 1.0 is listed in `docs/versions.md`; `tools/versions.sh` tags them or opens one beside the clone. README rewritten around the web version.

## beta 4.36 (web version) · 14 Oct 2026

The icon audit (Okay, 14 Oct: "Truly awesome work. Apply on live page. Let this knowledge of good and proper icon making be canon.").

- **Every icon on one 2× pixel grid.** Each is drawn at the size it is shown (40 were drawn at one size and scaled to another, ×0.63 to ×1.69); straight lines on quarter points, so they cover whole screen dots.
- **Every line equally heavy on the eye.** Four widths for one look: `LINE` 1.5 straight, `SLANT` 1.5625 slanted, `CURVE` 1.625 round, `DENSE` 1.25 crowded (were 15 widths, 0.79 to 2.88). Measured: the median line 1.5 % off a straight 1.5 (was 9 %), the worst tenth 4 % (was 26 %).
- **Rings and frames are lines:** the section tabs' rings, the window cards' dials, the rename box, the value buttons' discs, now as heavy as the signs; outer edges kept. The ring list's round tools draw their ring in the sign (their border could only be 1 point). A box's round corners `CURVE`.
- **Dial sign:** the plate with its centre hole (was eight pies); chosen, the plate fills and the hole is a dot of paper. **Rings sign:** three equal gaps.
- **Value buttons pressed:** the shape fills with ink, outlines stay grey, inner line and pivot paper.
- **One drawing per idea:** one plus (the ring tools' was a point longer), one cross, one chevron, one copy sign (Copy style of… had its own), one sheet. The bin's handle a flat line. Play centred by weight. The 12's dashed none-baton readable. Window cards: window 8 × 6.5 as on the tab, 4 points from the rim at every angle (#149, first half).
- **The icon pipeline** (`web/icons/`): `fit.mjs`, `check.mjs` (now the last step of `npm test`), `look.py`. Canon: `docs/design.md` §9; rule R33.

## beta 4.35.17 (web version) · 14 Oct 2026

- **The hand's preview box** stops one unit under the line, the same gap as between the shape tiles.

## beta 4.35.16 (web version) · 14 Oct 2026

- **The hand's preview box** scrolls up with its pane until its top meets the line under the hand tabs, and stays there (4.35.15 held it where it started, under the pane's heading).

## beta 4.35.15 (web version) · 14 Oct 2026

- **The hand's preview box stays still** while the hand's shapes and rows scroll beside it, until the end of the hand's pane (the Cap pane) pushes it up (wide layout; `position: sticky` in `4d-hands.css`).

## beta 4.35.14 (web version) · 14 Oct 2026

- **Lang. and Change…** in the font box at three quarters, box and words (20 high, 10 type), in lighter grey with a lighter line; under a finger the whole height of the font name's line presses them.
- **The ring rows** stand between the pane's lines too, like the font box: the name gives up the room. The colour column and the font box's swatch still line up. `--frame-out` is gone; the room inside a frame is `--frame-pad` (R32: no negative margins, no exception).

## beta 4.35.13 (web version) · 14 Oct 2026

- **The window tabs** start where the labels start (the eyes' column is left free) and end on the pane's line; each is narrower.
- **The font box** stands between the pane's lines, as the rows above it do, instead of 8 px past the right one; its sliders are 8 px shorter, so its fields, steppers and Change… end 8 px inside the box. The text colour's swatch stays in the ring list's colour column.

## beta 4.35.12 (web version) · 14 Oct 2026

- **The legend's meanings, shorter**, so the window no longer scrolls on an iPad in landscape (1180 × 820 and larger; at 1024 × 768 about two lines still scroll): *Any weight in the range · Has an italic, axis or style · Any width, narrow to wide · Shapes made for small and large sizes · Tabular figures, all one width · Oldstyle figures, which rise and fall · A slashed zero · Stylistic sets: other shapes · Single letters redrawn · Separate styles: Regular, Bold…* Every meaning is one or two lines.
- **No orphans**: a meaning's last word never stands alone on a line — it stays with its bracket, or, without one, with the word before it (`no_orphan()` in `app.js`, `.together` in the stylesheet).

## beta 4.35.11 (web version) · 14 Oct 2026

- **The legend's title**, in two lines: *Variable font axes and / OpenType abbreviations* (uppercase, as all the pixel font).

## beta 4.35.10 (web version) · 14 Oct 2026

- **The legend's window**: its title on one line, across both columns from the top left; the pixel font (title and stickers) at 12, half a size more than in the list; the meanings smaller, at 10, a size under the buttons' words (a new token, `--t-xxs`); a press anywhere outside it closes it (the sheet stays open; its own button still opens and closes it). The last item is still below the fold.

## beta 4.35.9 (web version) · 14 Oct 2026

- **The legend's window**: its meanings at the size of the buttons' words under it (11); a title over them in the pixel font, *OpenType abbreviations*; a bracket never breaks across two lines. The last two items are still below the fold.

## beta 4.35.8 (web version) · 14 Oct 2026

- **The legend's window**: twice the padding; in the open Legend button's grey; a hairline over every item, the first too, running unbroken across sticker and meaning; the meanings start on the third column's line (the Legend button's left edge), the stickers end before it; the full sentences back, in the tool's own size (13), the OpenType abbreviation at the end in light square brackets (*… here 100 to 900. [wght]*); the window grows upwards as far as the font list's top and scrolls past that (`legend_fit` in `app.js`). At this size about a third of it is below the fold.

## beta 4.35.7 (web version) · 14 Oct 2026

- **The font sheet's add buttons**: where the browser can read this computer's fonts (Chrome, Edge on a Mac), *Installed* comes first and the three ways to add a font share the first two columns equally, on one line, without their light second lines; the legend's button keeps the third column. Elsewhere (Safari, the iPad) there are two, each a column, as before.

## beta 4.35.6 (web version) · 14 Oct 2026

- **The legend's window** is two of the sheet's columns wide (from over *Add font file* to the right edge), its items one under the other with a hairline between; each meaning shortened to one line, so an item is two lines at most (meaning · OpenType name), and the window fits without scrolling.
- **Shadows**: the sheet's a little less blurred (6, was 7); the legend's lighter and closer (`--shadow-light`).
- **The font sheet** ends one row height above the bar (its top stays).

## beta 4.35.5 (web version) · 14 Oct 2026

- **The legend is a window**: open, it floats over the foot of the font list (the list keeps its height), with a light frame and the sheet's shadow; its items two to a row, a hairline between them; the stickers keep their size, the words are small (11) on as many lines as they need, set closer (1.2).
- **The Legend button** has a second line like its brothers: *(OpenType abbr.)*.

## beta 4.35.4 (web version) · 14 Oct 2026

- **The font sheet's legend**: on the sheet's three columns — each sticker ends on the first column's line, its meaning starts on the second (where the second button starts); the stickers at three quarters of their former size (12, R32's one exception); every meaning a sentence with a capital and a full stop, and under it, light, the OpenType name of what it reads (*wght axis*, *tnum*, *ss01 to ss20*…).
- **Buttons' second lines** a step lighter (`--wait`).
- **Font box**: as much room under the style buttons as before them.

## beta 4.35.3 (web version) · 14 Oct 2026

- **Font sheet**: the numerals are drawn 6.5 px (a unit and a hairline) to the left, every row alike, so they don't look inset: most fonts' first numeral now touches the name column's edge (within half a pixel; Michroma's 1 starts 2.6 further in, Routed Gothic's 1.5). Okay: "artificially push them left a bit, all at the same time, make many touch the red line."

## beta 4.35.2 (web version) · 14 Oct 2026

- **Font box of a window**: *As the numerals* is now **Copy style of *Numerals*** — the top numerals ring's name as it is written, in italic — beside a copy sign; a box with no fill (Okay: "Copy style of Numerals (case sensitive)… Box has no bg fill").

## beta 4.35.1 (web version) · 14 Oct 2026

On `dev` and on the live page. A small push: the second number after the point counts small pushes from now on (Okay, 14 Oct 2026), so the iPad shows which one it has.

- **Font sheet**: a line is three columns of one width — name · numerals · stickers (Okay's "X as in X = 10"); the stickers a little tighter, so every row of the tool's own list takes two lines at most; the frame's line light grey; the buttons stand on the same three columns, their words on two lines, the second light (*Add font link* / *(gfonts, url)*).
- **Font box**: *OpenType features* says how many there are; *As the numerals* is a box with a copy sign, quiet until the pointer is on it.
- Also since 4.35's first push, the same night: the font sheet redrawn (short stickers, Find with a magnifier, a drawn scrollbar, the legend opening upwards), the preview's ellipsis, the moon tile, the grey preview cell, the hand box seven rows high.

## beta 4.35 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only; the look-check (`web/test/same.mjs`) proves the first step against 4.34.

- **Stylesheet ordered, the look kept** (`web/src/css/`, one file per layer and part; R32 rewritten): a *chosen* layer (what is on, picked or open is ink with paper words, one rule), the repeats merged (pane headings, small menus, the preview's switches, rules said twice), two unused tokens gone, dated citations out of the comments. Proof: `node test/same.mjs` — the computed style of every element in 447 states, three screens, the pointer on each kind of control — found one difference against 4.34, a fix (the open language button under the pointer was ink on ink).
- **Fixes**: tabs cut their own top corners (`.tab`), so the V over a joint is a clean V and the chosen tab's line wins at its edges (no paper chip on the black tab, no grey sliver); `--faint` was two tokens, the rename box is grey again (`--wait`); a slider's track shows in the white font box (build list #128: it was white on white); a row's field for words is one height with the other fields.
- **The font box stands on the pane's columns** (build list #125): a ring row's frame (from the labels' start to 8 past the lines); Lang. and the sliders on the controls' column, fields and steppers on the third and fourth tile, Change… ending on the line; labels take what is left. The numerals and letters in a thick light frame one unit inside the box (Okay's sketch). A number's row everywhere lays its tracks out in full (`--num-columns`) — no negative margins for the field and stepper any more (`--tile-wider` is gone).
- **Values on the scale**: every space is a step of the unit (`--u1` … `--u8`), every measure has a name, lines are `--hair` · `--thick` · `--triple`, pure white and black are `--white` · `--black`; hex is short where it is the same colour. Things moved by a pixel or two.
- **Okay's notes of the evening**, the small ones built: the language button says *Lang.* (TR, DE… when chosen); the :30s stand together in a window's Position (1:30 4:30 / 7:30 10:30, then 4); the moon tile's crescent in a circle like its brothers; the scale button's centres joined by a dark line like the radius', a point to the right, the whole drawing lit when pressed; the squares for adding a font say what they take (*Add font link (gfonts, url)* · *Add font file (woff, ttf, otf)*), no heading over them; the font sheet's list has a slim two-pill scrollbar (webkit only; unseen here, Playwright hides scrollbars); the pixel font and *As the numerals* at 70 %. The larger ones are build list #134–#151.
- **The font sheet, later the same night** (Okay: "Do these yes"): it starts under the panel's title line; Find is a field with a magnifier; the stickers' words are short (*w. 100–900*, *tab*, *2 ss*… — *bold* and *italic* whole) and start under the Find field's left edge, one line where they fit, never three; the list has a scrollbar the tool draws (iPad Safari shows none of a page's own styling); the squares are short, a sign beside two lines of words, the legend's button last; the legend is one large column that opens upwards over the squares. The font box: the preview reads *1234567890 Abcdefg…* (three full stops in a font without an ellipsis, `has_chars` in `geometry.js`); *As the numerals* is words only, framed under the pointer.
- **Three more notes, just before midnight**: the moon tile's crescent reaches its circle, as the am · pm tile's dark half reaches its frame; the font box's preview cell is filled with the ground's grey; a hand's detail box is seven rows high and stays so when the shapes open, the closed line shows three shapes and *more*, the SVG tile waits at the end of the opened list (#139).
- **Tests**: `web/test/same.mjs` (the look-check; `save` keeps the look in `web/test/same.json`, not in the repo). The window test reads the new tab shape and the new words.

## beta 4.34 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Windows, position**: a square of the quarters · a white bar · the places between · three dots that open a field for any time (new key `at_deg`).
- **Font box**: the preview reads 1234567890 Abcdefg.

## beta 4.33 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font box**: letters after the numerals; LAN right after the name; Size above Tracking; axes without a heading; axes and features in the tool's type with their codes as small stickers; features as tiles again, the ones for numerals first.
- **Fields for words** on their label's line, larger, darker. **A window's position**: nine buttons in the clock's order.

## beta 4.32 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font box**: no "· as the numerals" after the name; **LAN** at the right end of the styles' line (on the name's line when a family has one style); OpenType features folded to begin with.

## beta 4.31 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Stickers**: also for what a font does to numerals (tabular · oldstyle · zero · fractions) and its counted sets and variants; paler colours, from the guides'.
- **Font box**: axes and features as stickers twice the size, grey; a font without switches says so on one grey line.

## beta 4.30 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font box**: Variable axes and OpenType features are parts of it, each can be put away; the two Rings panes are gone.
- **Windows**: the font box has them too (new key `features`; `axes` now has sliders).

## beta 4.29 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Stickers**: a colour for each kind, round corners, the weight's range on it, one line where the column lets them; a legend at the sheet's bottom right.
- **Numerals in the sheet**: cut at their column's edge, never above.
- **Variable axes**: an axis is named by its sticker, a button that sets it back.

## beta 4.28 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font sheet**: left edge on the third column; shadow blur 7.
- **Font box**: the name's whole line opens the sheet; the language button says *lan* when none is chosen; the colour stands in the ring list's colour column.
- **Hands**: the detail box has no ground.

## beta 4.27 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font sheet**: as high as the panel, down to the bar; hard shadow; Find a font at the top right, not active until pressed; stickers in Silkscreen (bold for bold · weight · italic) in words; long names and wide numerals are drawn smaller to fit; the link field shows when *Add link* is pressed.

## beta 4.26 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font sheet**: name in its own face · numerals · what the family has; full lines between; floats over the panel with a shadow; no Done button; larger Add fonts with square buttons.
- **Windows**: Tracking and a language in the font box (new keys `tracking`, `lang`; unset = the numerals').

## beta 4.25 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Hands**: one pane per hand — the hand itself in a box at the left (its centre marked), its shapes, numbers and colour beside it; shapes on one line that opens; a dashed *SVG* tile for later. On a phone the box lies over the rows.
- **Number box** in those rows: tiny plus over minus; a press on the number grows it over the slider with a large minus and plus.
- **Fields and steppers** elsewhere line up with the tiles' edges.
- **Text colour**: a small swatch beside the font's name (windows, numerals).
- **Top line**: title, unit box, undo and Guides centred on one line.

## beta 4.24 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **On the preview**: three states — faint (can be pressed), fainter (can't), and on (Guides: its word whole, its line faint).
- **Windows**: Colours before Shape.

## beta 4.23 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Hands**: under the *Shape* label a box shows the chosen hand in detail, as it is now.

## beta 4.22 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Windows**: Position · Radius · Width · Height stand right under *Show this window*; the *Place and size* pane is gone.

## beta 4.21 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Picture tiles** stand one unit (5.5) apart and from the row's lines; a tile's word is one line (*moon*, *auto-flip*).
- **Switches on the preview** stay faint after a tap on a touch screen.

## beta 4.20 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **On the preview**: undo · redo · Guides · Backdrop are faint (opacity 0.35) until pointed at or open.
- **Font box**: Tracking is its fourth line; the font's name is bold.
- **Tabs**: smaller notches (5.5 deep), drawn cleanly; the window tabs are pinned, margin to margin.
- **Picture tiles**: pictures 1.35 × larger, equal space around the tiles; simpler pictures for what a window shows.

## beta 4.19 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Windows**: the *Print* pane is gone; *Frame* and *Clearance* are in *Shape*.
- **Export**: *For production* is named *Print*.
- Half line also when a hidden row lies between a row and its nested row.

## beta 4.18 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **10:10** stands on the preview, over the bar (not on a phone).
- **Scale drawing** inside its button; colour · size · radius evenly spaced, in the drawer and the list.
- **Tabs**: sharp V notches, square ends.
- **Undo · redo** on the preview's top left.
- **Font box**: white, hairlines between its three lines, quiet buttons. **Language**: a two-letter button in it that opens a list; the Language row is gone.

## beta 4.17 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Half lines**: before a nested row (a question about the row above, its tied settings, a note under it) the hairline starts at the controls' column. Token `--nest-from`.
- **Dial section**: Dial and Page are pinned, in that order; Colours scrolls under them.

## beta 4.16 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **A font in three lines**: numerals (whole, no longer cut by the name) · name with *Change…* at the right · styles. Spaces from tokens (`--unit`, `--line`, new `--btn-pad`).

## beta 4.15 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Colour pill**: swatch as high as the hex (12); one unit (5.5) everywhere in and around it, up to the row's lines; 23 high, also under a finger (was 28 there).
- **Notes** (the grey lines of words under a row): one unit over and under the words, a hairline under the note.

## beta 4.14 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Export, PNG**: no *dpi* label on the dpi row; its slider and the size note under it start on the buttons' column (PDF · SVG · PNG).

## beta 4.13 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Export**: *Export a file* is pinned: Vector · PDF | SVG and its tick (no line between them) | Image · PNG and its dpi. Below: For production · Link to this dial · Settings file · Log · Gallery. A row can be *tied* to the one above (no line between).
- **Gallery** holds the five examples too (eleven dials); the Examples pane is gone.
- **Tabs**: hand tabs and window cards touch, stand on the pane's thick line, round top corners; window cards fill the columns; taller.

## beta 4.12 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Guides per ring**: a ring's edges in the ring's own guide colour (new ring key `guide`); a mixed order of colours to start with; the selected ring's row and drawer tinted with it. Guides list: the dial's three kinds · *Rings: All · Selected · None* and a line per ring · *Add: Line · Crosshair · Circle* (new key `gd_more`), each added guide with its angle or radius, colours and a cross.
- **Value pop-up = the tag, grown**: same box, same width (132), the height grows on a click. The tag of a round button says name and value.
- **Scale drawing** from Okay's `Asset_1.svg`; the column before the size button is 8 wider for its small circle.
- **Kind buttons** fill the name's and kind's columns. **No colour square on the selected row.**
- **Window cards**: pictures only, from the second column; the switches are gone; *Show this window* is back on the heading line.

## beta 4.11 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Ring drawer**: the name of the box under the selected ring's row (was "ring line").
- **A ring's row** reads name · kind with how many (`60 ticks`) · a small square of its colour · size · radius. The list and the drawer share columns, so a row's colour, size and radius stand over the drawer's buttons for them. Numbers: mono face, 11, quiet.
- **Round buttons carry no number**; their tag says name and value ("Outer radius 15").
- **Rings panes**: Shape comes first, with the Ends rows inside it; then Positions and Give way.

## beta 4.10 (web version) · 13 Oct 2026

On `dev` and on the live page. Okay's marked-up picture of the Rings pane. Seen in Chromium here only.

- **Rename**: the box stands right beside the name; it goes when the row is too full; a click on the selected ring's name renames it.
- **Ring line's frame**: inside the outer line a second one, 3 thick, in the selected row's ground; 8 of room inside (was 5).
- **Value pop-up**: a small square (132 wide) hung on the button's bottom right corner: name (and the anchor menu) · field · − +.
- **Pictures**: round buttons have the square buttons' outline; ticks, markers, numerals and band pictures weigh about the same.
- **Silkscreen** (SIL OFL, `web/fonts/ui/`) is packed into the page for the tool's tiny numbers, at 8: the values in the round buttons and 12 · 3 · 6 · 9 in the numerals picture. R32 amended.

## beta 4.9 (web version) · 13 Oct 2026

On `dev` and on the live page. Okay's designed picture of the ring line. Seen in Chromium here only.

- **The ring line stands in the list**, right under the selected ring's row (2 apart) and moves with the selection; framed in the guide's colour on white. Its buttons start where the names start. **One height for every control** (36): kinds 46 wide · colour · size · radius.
- **Size button's drawing**: a small circle against the large one, the value in the middle. The drag arrow is gone; both round buttons are still dragged themselves.
- **The tag** is one floating label for the whole tool (a scrolling list can't cut it off); it hides while a pop-up is open. The value pop-up hangs under the ring line on the list's frame.
- The list shows five rings and the ring line before it scrolls.

## beta 4.8 (web version) · 13 Oct 2026

On `dev` and on the live page. Okay's third drawing of the ring line, and the Windows section. Seen in Chromium here only.

- **Ring line**: one framed line as wide as the ring rows, all buttons — four kinds · colour · **size** (new: a mark's length, a dot's Ø, a numeral's size or a band's width, as a value button) · radius · a double arrow that drags the radius. No name in it. Frame in the selected ring's guide colour, on white. A **tag** under a wordless button says what it is while the pointer is on it.
- **Undo · Redo** as two outlined buttons on the preview's top right, before the Guides switch; pale when there is no step that way.
- **Windows**: *Show this window* is gone (the card's switch does it). New pane **Shape**: rectangle · circle · polygon (Sides) · arch · arc, Corner, *Turn it with its radius* and *Turn the text with it*; position **4** added. A window's **own font** (font sheet; *As the numerals* takes it back). Pane **Colours**: text or picture · disc under it · frame.
- New keys, all drawing as before at their start (R31): windows `shape`, `sides`, `turn`, `text_turn`, `family`, `ps`, `axes`, `text_c`, `disc_c` (window 1: `da_…`); list `WINDOW_SHAPES` (R9).

## beta 4.7 (web version) · 13 Oct 2026

On `dev`. After Okay's review of the research atlas and two drawings of the Rings panel. Seen in Chromium here only.

- **Rings pane, heading line**: the list's tools stand on it — a plus in an outlined circle opens Ticks · Markers · Numerals · Band as a small menu; move up · move down · duplicate · delete beside it, the same circle. The line under the list is gone.
- **Ring line**: the selected ring in one line — its name · four kind buttons with pictures only (34, pictures 24) · its colour as a swatch · its radius as a **value button**.
- **Value button** (R15's exception): a circle with a radius drawn in it and the value on the line. A click pops up the number's row under it, ready to type in (for numerals with the Baseline · Ascender · Centre menu); pressing and moving changes the value; a press outside, Enter or Escape closes the pop-up.
- **A colour in a line of words is a tiny swatch without hex** (a folded pane's summary).
- **Undo**: ⌘Z back, ⇧⌘Z or ⌘Y forward (Ctrl on Windows); one drag is one step; loading a file, Defaults or a Gallery dial is a step; 200 steps.
- **am · pm follows the time shown.** The time runs over 24 hours; **AM · PM** is a small word in the time's box; "15:20" and "3:20 pm" can be typed; Now takes the real hour. The window's *Hour of the day* row is gone (its key stays, unread). An am · pm window is drawn again every six minutes of the time shown.
- **Card switch**: a small clock on each window card shows or hides that window.
- **Numbers that start again**: *Start again after* (ring key `num_again`, 0 = never; R31).
- **Gallery**: the last pane of Export, six dials, three to a line (`web/gallery.mjs` → `src/gallery.js`): B-Uhr type B · 12 + 24 hours · Elapsed time · Montgomery · World time · Diver with its bezel as rings.
- Tests: `test/labels.mjs` (new, in `npm test`); the window test covers all of the above.

Earlier the same day, replaced by the above where they differ (the Add group under the list, the kind tiles and radius row):

- **Rings: one pinned pane** (Okay's drawing, build list #94). The list, then the selected ring by its name where "Kind" stood, before the kind tiles; colour; radius. The second heading is gone. Folded, the pane is one line: "Rings: Numerals   numerals · #141414 · centre radius 10.00" (382 → 43 high in the test window).
- **Ring rows start where the labels start**; a ring's eye is inside its row. **Add + · Ticks · Markers · Numerals · Band** is one outlined group with round ends; **↑ ↓ duplicate delete** are outlined circles. **Kind pictures** show the whole circle (30 square; the other pictures stay 28 × 20).
- **The selected ring's row is tinted with the selected ring's guide colour** (22 % of it in the ground, 65 % in the frame); light blue as before when that guide is None. Claude's reading of "GUIDE COLOR" on the drawing; not confirmed.
- **Radius anchor for numerals** (build list #95): new ring key `anchor` (0 centre, as before · 1 baseline · 2 ascender; R31, R9). A small boxed arrow beside the label opens Baseline · Ascender · Centre; the label reads Baseline radius, and so on. Outlines, on-path letters and live text all use it. Parity with `dial.py` unchanged at centre.
- **Ring list rows carry a summary** (build list #78, atlas 4.1): before a ring's kind, `how many × how big · r radius` — the positions it draws, one mark's length (a dot's Ø, a numeral's size, a band's width), its radius, in the unit box's unit. The summary follows every change without the list being rebuilt. The list owns the columns and each row borrows them (CSS subgrid), so summaries end and kinds start on one line. Rows stay one line high.

## beta 4.6 (web version) · 12 Oct 2026

On `dev`. Step 2 of the Dial tab (Okay: "Go on with 2"). Seen in Chromium here only.

- **Scale everything on the dial with it**: a tick under Diameter, off to start (`ui_scale`, the window's state: not in a link). On, a change of diameter multiplies every measure in mm — rings (radius, length, width, band width, clearance, round ends, wall, numeral size, 12 o'clock gap, a numeral's radius nudge), hands (length, width, tail, tip, head, counterweight, wall, round), windows (radius, width, height, round, frame, clearance), cap. Not angles, counts, percentages, the page margin. The measures are worked out from where a run of diameter changes began (`scale_with`, `G.measures`), so 30 → 36 → 22 → 30 lands exactly on the first values; editing anything else starts a new run.
- **A colour per sector of a band**: new ring key `cs` (position → RGBA; empty = all in the ring's colour, so earlier links draw as before, R31). A band with sector colours is drawn, and exported, as one shape per colour ("Band colour 1", "Band colour 2"); the print mask stays one shape. Rings → **Sector colours** (a band with more than one sector): a swatch per sector, and **All as the ring**.
- **Dial → Colours**: every coloured part in one list — rings top first (a band's sectors one by one), hour · minute · seconds hand, cap, the windows that are on. Each swatch opens the colour pop-out. Plate and backdrop keep their own rows.
- **The pop-out's binding** is now read · write · label, not scope and key, so list swatches can use it. Opened from a list it stands at the right of the whole row of swatches, so the neighbours stay in reach. *On this dial* includes sector colours.

**Later the same day** (Okay, on the live page: "Guides borders need work… I love this color selector…"; asked which selector, he chose "the example's look, our parts")
- **The colour pop-out is near black** (`#141413`) **with round corners**, after a selector Okay showed: a rounded field, pill handles on the strips, larger rounded chips (26; 34 for a finger), a small swatch before the values. Its parts are unchanged (two rows of colours, RGB · CMYK · HEX, COPY, widen, drag); changes still apply at once, there is no Cancel / Apply.
- **Opacity, rings only**: a third strip and a % field, shown for a ring's colour and a band's sector colours. It is the colour's fourth number, which preview, SVG and PDF already drew.
- **A colour in the panel is a pill**: a small swatch (it opens the pop-out) and the hex, which can be typed. In Dial → Colours a part with one colour is a pill too; a band's sectors stay squares. A swatch shows a see-through colour over a checkerboard.
- **The Guides switch's line** is a hairline (1, was 1.5). Off, it has no gaps: dashes as light as its word over a second, quieter tone; the inside is filled with the backdrop's colour (`--canvas`).
- **The guides' list is near black and round** too (stylesheet class `.night`, shared with the pop-out), after a list Okay drew on: a line per kind — its name, then round choices with room between them: **None** (a struck circle) and the eight colours. The chosen one stands in a thick ring of its own colour. None replaces the eye; pressing a colour shows that kind again. A hairline under every line.
- **Smaller, with more room inside** (Okay, on the live page): the guides' dots are 13 with 9 between (18 / 11 for a finger; were 16 / 13 and 22 / 15), its lines 42 high, its edge space 16; Thickness sits on the list's own columns. The colour pop-out's chips are 22 (28 for a finger; were 26 / 34), its field 140 high (180), its edge space 16 and 12 between its blocks: 388 wide (was 422).
- **A press outside** the colour pop-out or the guides' list **puts it away** (`pressed`). So a click on the preview no longer keeps the pop-out open and retargets it; a press on another swatch still moves it there.
- **Guides switch, off**: sign, word, arrow and dashes are one colour (the sign was dimmer, the arrow filled when open).
- **From Okay's notes on a screenshot**: the pop-out's square makes it **twice the size** (twice as wide; the field takes the added height; never larger than the window; it can still be dragged) instead of covering the preview. **Chips stand 12 apart** (three times the 4 of before) and share the row's width, eleven to a row, so they shrink to fit (about 15 square; 21 for a finger) and grow with the pop-out; its width is a token (`--pop-width`: 388; 454). **The hex in a colour pill opens the pop-out too**; under a finger it is read-only there (the pop-out has its own HEX field), with a mouse it can still be typed in. Guides' dots: 10 with 10 between (14 / 13 for a finger).
- **Windows: four cards on top, 12 · 3 · 6 · 9** (`window_cards`), the size of the example cards: each a small dial with its window drawn where it is — filled when shown, an outline when not. They are the tabs of the section: a press chooses the window the panes below are about (the 1 · 2 · 3 · 4 picker is gone). The first pane's heading says *Window at 3* and carries *Show this window*; what it shows is in that pane (the *What it shows* pane is gone). Position stays on *Place and size*'s heading: a window can still go to 4:30 and the like, and its card then says so. Which window is which card: the date window of old (`da_…`, starts at 3) is the second card; `windows[0]`, `[1]`, `[2]` are 12, 6 and 9. A window never used takes its card's place when its card is first pressed; settings and links are unchanged (R31).
- **From Okay's notes on the Hands screenshot**: *swap* — All hands is the first pinned line, the hand tabs the second, right above the hand's panes. *move up* — Show this hand is on the hand's heading line (`head`). *same gap, bigger* — a colour pill has one space, 8, three times: before the swatch, between swatch and hex, after the hex (`--pill-gap`; was 4 · 6 · 8).
- **Guides and Backdrop switches are outlines, never filled** (Okay: "Background button must be outline all times, never fill. As does the guides section. Make these visible but not the first thing that pops up"). A hairline and plain words in one colour: black or white, whichever has more contrast with the backdrop (`main.dark`, from the backdrop's relative luminance) — one of the two is always 4.5 : 1 or better, so they are not lost on any colour. Guides on: a bold word. Off: a plain word and its sign struck through. Under the pointer the line doubles; no fill. This replaces the filled switches of an hour earlier. Checked on six backdrops (grey, near white, near black, purple, lume green, red).
- **Hands: Hour · Minute · Seconds are tabs** — the first pinned line, across the six columns (`hand_tabs`); the panes under them are about the chosen hand, and the first pane's heading says which (*Hour hand* …). All hands is the second pinned line. Cap, which belongs to all three, moved after the hand's own panes. The picker is no longer on the One hand heading.
- **A pane's main selector stands on its heading line** (row option `head`), on the four control columns, with no name of its own — the heading names it; it shows and works when the pane is folded too. Okay drew it for Numerals → Labels ("This is a simplification. Others possible? Main selector top"); also done for One hand → Hour · Minute · Seconds, Window → 1 · 2 · 3 · 4, Place and size → Position. *Show this hand* and *Show this window* are nested questions now (controls' column).
- **Backdrop switch** at the preview's bottom left: built like the Guides switch when on, always solid-lined, with the backdrop's colour as a chip; a press opens the colour pop-out for the backdrop. The Backdrop row in Dial → Page stays.
- **The colour pill is one small button** (Okay: "Selected state too aggressive… Just black bg to the swatch pill. Overall smaller and monospace hex value. No editing through button anywhere, mobile/desktop. Hover some middle value. All sleek"): 22 high (28 for a finger), a 14 swatch (18), the hex in 12 monospace. At rest quiet, a middle grey under the pointer, black while its pop-out is open; no outlines. The hex is no longer a field on any device: a colour's value is typed in the pop-out's HEX field. Rows and the Colours list share one builder (`colour_pill`).
- **The Guides switch carries its own ground** (Okay: "We lose guides on some colors. Abort dashed, ensure contrast at all times, simply" — it vanished on a mid-grey backdrop). On: light with dark words. Off: near black with quiet words. A solid mid-tone hairline. No dashes, nothing follows the backdrop any more (`main.dark`, `--canvas` and the `--on-canvas` tokens are gone). Checked on grey, near-white and near-black backdrops.
- **A nested question starts on the controls' column**: a tick that asks about the row above it (row option `nest`) — *Scale everything with it* (shortened to fit), *Skip those instead*, *Keep numerals as text in the SVG*. A tick that stands for itself still starts at the left.
- **All hands is one line, always in view** (row option `bar`: a line of its own, outside the panes, pinned): its name · Show hands · the Motion menu, on the columns 2 · 2 · 2. The menu has no word beside it; its title says what it is.
- **Reach** (stylesheet, controls layer): under a finger a small control is pressed from a little outside its edge too, up to half-way to its neighbour — an unseen frame, nothing for a mouse, nothing changes to the eye. Listed in one rule: a guide's colour (the whole height of its line), a colour in the pop-out, a band's sector, signs (under the ring list, the pop-out's square and cross), the rename box, − and +. A new small control goes into that list.
- **The unit box is quiet**: its word like the version beside the title (grey, regular), its line a grey hairline like the header's.
- **Units**: a box at the panel's top right, one column wide, saying the unit by its short name (`mm` · `pt` · `in` · `lig`); its menu lists Millimetres · Points · Inches · Lignes. It changes only what the window shows and takes: every length field (rings, hands, windows, diameter, page margin, cap, a numeral's radius nudge), a folded pane's summary, the status line and the PNG size. Settings, links and files stay in mm (R1); `ui_unit` is the window's state. Inches show two more decimals, lignes one. Sliders and steppers still move in the row's mm step. Lignes (2.2558 mm, the unit of movement sizes) is Claude's answer to Okay's "???" — not yet confirmed.
- Round corners are for colour things only (stylesheet tokens `--round-large`, `--round`, `--round-small`).

## beta 4.5 (web version) · 12 Oct 2026

On `dev`. Okay's usability review, one tab at a time; this is the Dial tab, step 1 of 3. Seen in Chromium here only. `dial.py` is frozen from now on (Okay: "Do not work on dial.py anymore, we're on github").

**The Dial tab, regrouped**
- **Two panes: Dial** (Diameter · Plate · Background) **and Page** (Page margin · Backdrop). Before: Size · Colour · Guides.
- **Background is a button only** ("Add image…"); pressing it says "Not built yet." Okay: "No background image functionality now. Just the button."
- **A hairline before and after every row**, everywhere: white on the scrolling grey, that grey (`#E8E8E6`) on paper and white. Tokens `--line-on-grey`, `--line-on-paper`, `--row-rule`.

**Guides, on the preview**
- **The switch stands at the preview's top right**, 12 from its edges, out of the panel's header. Its colour follows the backdrop: dark on light, light on dark (`main.dark`, set when the backdrop's luminance is under 0.45).
- **An arrow joined to it drops the list**: five kinds — dial edge, centre lines, window radii, ring edges, selected ring — each with an eye and one of **eight colours** (`GUIDE_COLOURS`: six neons, `#111111`, `#FFFFFF`). No free colour. One Thickness; the selected ring's lines are 1.5× it. **Reset** puts the guides back.
- **Settings**: new keys `gd_win`, `gd_sel` (eyes) and `gd_k_edge`, `gd_k_axes`, `gd_k_win`, `gd_k_rings`, `gd_k_sel` (a place in the eight, R9). Guides are drawn at full strength. `gd_c`, `gd_strength`, `gd_sel_c`, `gd_sel_strength`, `gd_sel_w` stay in `DEFAULTS` (R8, R31) and are read by nothing. Window radii had no eye of their own before (they followed the dial edge's).

**Colour: one pop-out for the whole tool**
- **A swatch opens it 12 to its right**; it is not built inside each row any more. It edits a scope and a key, so with a ring's colour open, clicking another ring on the preview shows that ring's colour. Changing section closes it. Escape, its ×, or the swatch again close it.
- **Top to bottom**: *On this dial* · *Palette* (ten to start; **+** adds the colour in hand, and reads **−** to take it out when it is already there; kept by the browser under `dial-tool-palette`, not by the dial or its link) · the field of one hue (168 high; 220 for a finger) and the hue strip (24; 36) with larger handles · one line: `RGB` `CMYK` `HEX`, the values, `COPY`, small boxed capitals. COPY copies what the line shows.
- **Its head drags it. The square widens it** over the whole preview (the field takes the room) and back to where it was. On a phone it is a sheet from the bottom.
- The palette's ten: `#111111 #FFFFFF #EDE8DB #A7A7AA #3A3A3C #0E2A47 #12372A #7A1F1F #C8E6A0 #E8742A` — Claude's choice, offered to Okay, not yet confirmed. The 22 "dial colours" of beta 4.4 are gone.

**Not in this step** (build list #70–#72): scale the contents with the diameter; a colour per sector of a band; a logo (an SVG placed with the mouse, kept as a ring).

## beta 4.4 (web version) · 12 Oct 2026

On `dev`. A code review of the web version, asked for by Okay, 12 Oct ("Code review time. All on the table"), then his go for four steps plus two additions: "redesign sliders like this" (a sketch: a thick black disc on the track) and "Bg color created clashes, look around." Seen in Chromium here only. `dial.py` is unchanged.

**Nothing jumps**
- **A click on the preview keeps the panel.** It used to build every row again, even when its section was already showing: the scroll went back to the top and an open colour picker closed. Now the rows stay and only show the new values.
- **Each section remembers its scroll**, and pressing the tab that is showing does nothing.
- **Panes slide** shut and open (140 ms), so what is under them travels instead of jumping; what is under moves by exactly the pane's height. Off when the system asks for less motion.
- **The Guides switch keeps its width** on and off (it was 89 / 87.9: its word changed weight).

**The stylesheet, rebuilt** (`web/src/style.css`; rule R32)
- **Seven layers** — tokens · base · controls · panel · preview · bar · narrow. A later layer wins whatever the selectors look like, so no part undoes another. There was no `!important` before and there is none now.
- **Tokens:** every colour, size and measure has one name. Before: 224 pixel values, 26px written eight times, `#fff` twenty times.
- **Buttons by kind.** A plain `button` is only its words; a class says what it is (`btn`, `btn main`, `plain`, `sign`, steps, segments, tiles). Before, one look was given to every button and undone in 22 places.
- **Panes are real elements**, and the toggle column is a real column: a pane's body is a grid of seven tracks (the eye's, then the six). The three places that broke out of the panel's padding with negative margins are gone, and so is the air between panes that was worked out in `sync_rows`.
- **Type: four sizes** — 11 · 12 · 13 · 15 (were eight: 10 · 10.5 · 11 · 12 · 12.5 · 13 · 15 · 20). Pane headings are 13 semibold (were 12.5).

**Sliders and grounds**
- **Sliders** after Okay's sketch: a 4-point track, ink up to the handle, and the handle an 18-point black disc with a light centre (26 on a touch screen). The day slider in the bar stays a ruler.
- **Tick boxes** are square, like every other control (ink when ticked); the browser's own were rounded on iPad.
- **On the scrolling grey** (`#E8E8E6`) several things had almost its colour (`#ECECE8`) and melted into it: the example cards, the link, the log, the hex line, a tile under the pointer. A part now knows what it stands on: on the grey these are paper-light; on paper they are grey as before. Buttons are white like the fields (were paper), one hover grey everywhere.
- **Phone:** picture tiles stand under their label on all six columns, so their words fit at the same size as elsewhere.

**Files**
- **PDF: every part is a layer with its name** — plate, each ring by its name, each hand, each window part — listed top first. PDF 1.5 (was 1.4). *Not yet opened in Illustrator: build list #67.*
- **A production mask's PDF is in grey ink** (`0 g`), not RGB black, so nothing can turn it into a four-colour black.
- **PNG: its dpi is written in the file**, so a 600 dpi picture opens at true size in Photoshop or InDesign (was 72). A mask's PNG is black on white (was on nothing). Asking for more pixels than a browser can draw says so instead of saving an empty file.
- **SVG:** shapes are named after what they are (`plate`, `minute-ticks`, `hour-hand`; were `plate-7`, `Markers-9`), colours are hex, a title says what the file is.
- **File names say what they are:** `dial-30mm-2026-10-12.pdf`, `dial-30mm-mask-mirrored-2026-10-12.pdf` (were always `dial.pdf`). Okay was asked whether he would rather name dials himself; no answer yet (build list #68).

**Small**
- Switching between windows 1–4 no longer rebuilds the geometry (`ui_window` was missing from `NOT_GEOMETRY`).
- Load… and Defaults close the tool they replace (its observers and its pending save), instead of leaving it running.
- **Tests:** 137 checks (were 126).

**Found, not done** (Okay's go covered steps 1–4): `app.js` is one class of 1,800 lines; a dial with 300 ticks and knock-outs takes about 90 ms a slider step here, more on the Intel Mac (#14); in Rings the pinned part leaves 300 of 900 points to scroll (#65); `main` has no `web/` although the tool is online.

## beta 4.3 (web version) · 12 Oct 2026

On `dev` and online. Okay, 12 Oct, with a marked-up screenshot of the ring list ("frame layers", "light blue"): "Yet darker bottom bar, 80% black. Invert appropriate". Seen in Chromium here only.

- **Bar: 80 % black** (`#333333`), light on dark: words `#F2F2EE`; under the panel the quiet controls are thin light outlines, the chosen speed a lighter fill; the day slider is light, its steps light grey, the step the time is on white and bold, 10:10 a light pill; − + and Fit are dark-grey buttons with light signs. (The bar so far: black → `#DADAD5` → `#A9A9A4` → this.)
- **Ring list: every ring is a framed row** — a hairline frame with slightly rounded corners (5), white inside, 4 apart, 8 wider than the pane lines on each side so the eye has room inside the frame.
- **Selected is light blue** `#CFE4F5` with a blue frame `#86B4DA` (was the canon's yellow `#F0DC8E`). The same colour marks the chosen font in the font sheet and an example under the pointer: one colour for "selected" everywhere. `docs/design.md` (the guide's canon) still says yellow; it describes the guidebook, not this panel.
- **Guides switch:** tight at the sides, as wide as its sign and word (about 93; was two columns, 120); it still ends on the right margin. Okay: "tighter guides button from the sides".
- **Dial tab:** eight pies (were four); chosen, every other pie is filled. Okay: "dial icon double the pies".
- **The part that scrolls is darker:** `#E8E8E6` under the rows that scroll, 8 % darker than the paper `#FCFCFA` of the header, tabs and pinned rows. Okay: "scrollable area gets a smidge darker bg" (first 3 %, `#F5F5F2`), then "from 3 % dark to 8".
- **Day slider is a ruler** (Okay's marked-up screenshot: "no need to fill in the past there, divide the horizontal stretch more. Lines crossing instead of dots. Fill more as screen grows"): a line with cuts crossing it and a white line for a handle; nothing is filled in behind the handle. Each hour is cut as finely as its width allows — halves, quarters, ten or five minutes, cuts at least 7 apart — so a wider window shows more. A click snaps to the nearest cut shown, or to 10:10; a drag stays free. Hour names and the 10:10 pill stay under it.
- **Tests:** 126 checks.

## beta 4.2 (web version) · 11 Oct 2026

On `dev` and online. Okay, 11 Oct: "That bar color went too light. Darker. Under left column have the controls. Day slider has steps that clicking snaps to. 10:10 is a special one. Nice column fitting controls, low contrast under left column. Leftmost of left column, lines extend on top of eyes. Arrange paddings and fit header nicely. Layers: cursor icon much lighter and thinner strokes." Seen in Chromium here only.

- **Bar: a middle grey** `#A9A9A4` (black `#111111` → `#DADAD5` in 4.1, "too light" → this).
- **Time controls are under the panel, on its columns:** the panel's square in the toggle column, then Play 1 · speeds 2 · time 2 · Now 1 — exactly the six columns. Low contrast there: no fills, thin darker lines; the chosen speed is a shade darker.
- **Day slider** under the preview, with **steps**: the twelve hours and **10:10** (a black pill; the pose watches are shown in). A click on a step goes exactly there. A click on the slider itself (not a drag) goes to the nearest step; a drag stays free. The step the time is on shows bold.
- **View** at the right: − + · Fit. The status line (selected ring · font · Ø · build time) moved here and only shows on windows wider than 1500.
- **Margins and lines.** The panel has one side margin, 24, left and right. Every line — a pane's thick line, the header's hairline, the tabs' — runs from margin to margin, so it passes over the eyes; the eyes stand 2 right of the margin (Okay, minutes later: "eyes closer to the right 2-3 px"; `--nudge`). Toggle column = an eye (16) + a gap (12). Panel 460 wide: 24 + 16 + 12 + 384 + 24.
- **Header:** 64 high, title and Guides switch centred on one line, a hairline under it, then the tabs.
- **Rename box:** grey `#8E8E89` (was black), strokes 0.7 (were 1.2); black when the pointer is on it.
- **Fixed on the way:** the panel's 1-pixel right border was taking its pixel from the columns; it has its own now.
- **Guides switch, again** (Okay: "don't say on or off, active is solid outline dark color, off stays the same"): on is a solid dark outline with a dark sign and word, no fill; off is the dashed grey box as before; the words on / off are gone.
- **Tests:** 121 checks.

## beta 4.1 (web version) · 11 Oct 2026

On `dev` and online. Okay, 11 Oct, after beta 4.0: "Bottom (and top) black bar. Lighter gray, better organization, better usability. Add a fast time option. Make a better guides toggler. Icon bullseye with lines, rounded corners, on/off distinct", then "Columns? They fit 'em". Seen in Chromium here only.

- **The bar is light grey** (`#DADAD5`, was black `#111111`), with a hairline where it meets the preview, white controls and a black Play.
- **Three parts, split by hairlines:** what is selected (with the square that puts the panel away) · **time**: Play / Pause, speed, the time, the slider, Now · **view**: − and + (zoom by 1.4 about the middle; new), Fit.
- **Fast time:** 1× (real time) · 60× (a minute every second) · 720× (twelve hours in a minute). It is the window's state, not the dial's: not saved, not in a link.
- **The bar keeps the panel's columns:** under the panel the square stands in the toggle column and the status runs over the six columns; beside it Play, Now, − +, Fit are one column wide (54), the speeds and the time two (120), 12 apart; the slider takes what is left.
- **Guides switch:** a rounded box two columns wide (columns 5–6) with a bullseye crossed by lines. On: filled black, "Guides on". Off: dashed grey outline, "Guides off". A press only switches (unchanged).
- **Phone:** the bar's controls share one row, the slider has the row under it; no zoom buttons (a phone pinches).
- **Tests:** 114 checks: 60× speed, the zoom buttons, the switch's two looks, and the widths above.
- **Fix, same evening (Okay's Safari screenshots: "show hide jumps blocks"):** folding a pane left a wide gap above the next open pane, and none above the next folded one, so blocks jumped. The air above a pane was decided in the stylesheet by "the element just before", which is wrong once a folded pane's hidden rows sit in between. It is now worked out in `sync_rows`: air above a pane only when the pane before it is open. Not a Safari matter: the same in every browser. A check measures it (115 checks).
- **Not on the columns:** the five tabs share the six columns' width equally, so their centres fall between columns.

## beta 4.0 (web version) · 11 Oct 2026

On `dev` and online. The panel redrawn after Okay's proposal picture and his marked-up screenshots of every tab (11 Oct, late). Run and looked at in Chromium here; **not yet seen on Okay's devices** (build list #57). `dial.py` is unchanged (beta 2.3).

- **Columns.** The panel is a toggle column (36), six equal columns (54, gaps 12) and a right margin (28): 448 wide. Label 2 · slider 2 · value 1 · stepper 1; menus and text 4; a swatch 1 and its value 2; a picture tile 1; an OpenType tile 2. More side space than before (Okay: "more padding").
- **Thick and thin.** A 2-point line opens every pane; inside a pane only hairlines. Rows are 34 high (were 29), pane titles 40.
- **Panes and the eye.** Every pane (was: group) has an eye in the toggle column: open eye = pane open, closed eye with lashes = folded (Okay's choice, asked 11 Oct). The whole heading is the button. A folded pane says what it holds in grey at its right (its first values). Same on desktop, iPad and phone.
- **Ring list.** Edge to edge, hairlines, no box. The eye in the same left column shows or hides the ring on the dial (was a tick). The name is no longer a field: a click anywhere on a row selects; **the rename box** (a text cursor in a rounded box, right after the name, on the selected ring only) turns the name into a field — Enter or a click elsewhere keeps it, Esc puts it back. A hidden ring greys and has no rename box.
- **Choices as pictures.** Ring kind, mark shape, the 12 o'clock style, numeral placement, hand shape (the real outlines, drawn by the geometry) and what a window shows are rows of picture tiles, not menus.
- **Colour picker.** The swatch opens a field of one hue (across: strength, down: darkness) and a strip of hues, the colour as RGB or CMYK numbers (CMYK by plain arithmetic, no printer profile: for naming a colour, not for proofing), this dial's colours, the dial colours, and the hex with a Copy button.
- **OpenType tiles in three groups** (build list #62): features with a name of their own, by name; then *Stylistic sets* (`ss01`…); then *Character variants* (`cv01`…).
- **Export.** Examples run the full width. *Vector*: PDF · SVG. **Keep numerals as text in the SVG** (`out_live_text`, the key `dial.py` already has): numerals and date / day window text stay text, placed from the outlines' bounds as in `dial.py`; what knockouts and window clearances cut away becomes a clipping mask; the font is named, not built in. PDF and PNG stay outlines (live text in the PDF: build list #63). The **PNG button stands on the dpi row**, where the label was, and the line under it says what that dpi comes to in pixels.
- **Tabs.** Dial: the ring cut in four pies; when chosen, two opposite pies filled, a checkerboard (Okay: "pies, active: dama pattern"). Windows: a window at 3 o'clock (Okay's drawing). Windows has a first pane, *Window*.
- **Guides box:** more room inside (Okay: "better spacing").
- **The panel can be put away:** a square at the left of the bar hides and shows the whole panel (remembered by the browser), so the dial can have the window. This was in the proposal picture; Okay did not ask for it in words — say if it should go.
- **Phone:** the same columns, scaled to the screen; the ring tools wrap under the Add words.
- **Tests:** 110 checks (was 89): the rename box, eyes in one column, shared columns for number rows, folded summaries, the colour field / hues / CMYK / RGB, live text placement, the PNG row, the panel put away, a phone-sized window.
- **Known limits:** in Rings the list and the ring's first pane stay in view, and they are taller now, so on a low window less is left to scroll (fold *Rings, top first* or the ring's pane to get it back). The picture tiles are drawings of the idea, except the hands. Installed fonts on the Intel Mac, and the iPad screenshot that looked like the wide layout, are still unexplained (build list #49, #57).

## beta 3.0 (web version) · 11 Oct 2026

On `dev`. The tool in a browser: `web/dial-tool.html`, one file, nothing to install. Run and looked at in Chromium here; **not yet opened on Okay's Mac** (build list #49).

- **Same dial, same files.** `web/src/geometry.js` is parts 1–3 of `dial.py`, name for name: settings, rings, numerals, date, hands, the scene. A settings file saved by either opens in the other; beta 1.0 files convert as before (R8, R30). Checked by `web/test/parity.py`: nine harness dials and Okay's `dialx.json`, drawn by both and compared — under 0.7 % of pixels differ (hairlines along edges, and kerning the Python harness's plain font lacks).
- **Preview:** SVG, one element per scene item. Nothing flashes; zoom is sharp at every step (pinch or ⌘ / ctrl-scroll, about the cursor); two-finger scroll or drag pans; Fit; Play runs on the display's frames. Only what changed is touched; hands turn by one attribute.
- **Click the preview** to open the settings of what you clicked: a ring, a numeral (Nudge is set to it), a hand, the date window, the plate.
- **Round ends.** Hands: *Round ends* (new key `round`; half the width or more gives a full round end; tail corners, and the tip where it is flat). Marks: *Round both ends* sets *Round outer* and *Round inner* to half the width.
- **Type:** HarfBuzz shapes every numeral — kerning, OpenType features with the designer's own names, variable axes, language, tracking, collections. *Installed fonts* lists the computer's fonts (Chrome and Edge ask once; Safari and Firefox can't); *Add font file…* or dropping a file works everywhere. Until a ring's font is loaded, Inter (inside the page) stands in and the log says so.
- **Ring list:** show, rename, add each kind, duplicate, delete, up, down.
- **Files:** PDF and SVG (vector, filled paths only, page = dial + margins at true size), PNG at the chosen dpi, Save… / Load… / Defaults; drop a settings file on the page to load it; the last session comes back when the page is opened again.
- **After Okay's first look (11 Oct, Chrome on the Intel Mac, screenshot):** one dark bar under panel and preview (status · time · slider · play/pause icon · Now · Fit), its time controls starting where the preview starts; Guides moved to the panel's header; the ring list and a ring's Kind, Colour and radius stay in view while the other rows scroll. **Fonts:** Installed fonts listed nothing for him and said nothing — a browser that isn't allowed answers with an empty list, and the message went only to the log in Export. Now every font action writes what happened under its buttons (how to allow fonts for the page; where Helvetica Neue's file is). Adding a collection file keeps the ring's own font if the file holds it, else takes the Regular. Font names are read in any language when there is no English one. **Why Chrome gave him no fonts is not yet known** (build list #49).
- **A dial as a link (11 Oct):** the address bar always holds the dial being edited (`…/dial-tool/#1.…`): only what differs from the starting values, deflated, in address-safe base64. *Copy link* in Export → Settings. A link opens that dial in any browser, ahead of the last session; pasting one into the open tool switches to it; a broken one opens the tool as usual. Rule R31 freezes the starting values so old links keep their meaning.
- **Fonts, a picker (11 Oct):** no dropdowns. A list where every font shows `1234567890` in its own outlines; a family's styles are buttons. **Twenty open-licence families come with the tool** (`web/fonts/`, list in `web/fonts.mjs`): Inter, Arimo, Archivo, Barlow, Barlow Condensed, Overpass, B612, Routed Gothic, Jost, Josefin Sans, Montserrat, Oswald, Antonio, Michroma, Saira, Bodoni Moda, Playfair Display, Cormorant, Poiret One, Allerta Stencil — from Google Fonts' repository and Routed Gothic's, all SIL Open Font Licence, licences in `web/fonts/licences/`. A font is fetched from the tool's own site the first time it is used; a dial that names one loads it by itself. Font files you add and installed fonts join the same list. Peter Wiegel's fonts are not included: his site states "Freeware", with licence files only inside each download, and the files could not be fetched or checked here — add them with *Add font file…*.
- **Examples (11 Oct):** five of the guidebook's classics (Field, Diver, Bauhaus, Sector, Gauge) at the top of Export, each a picture and a link, with the open fonts the guide itself uses as stand-ins (`web/examples.mjs`).
- **Pointer on the preview (11 Oct):** what can be edited is outlined (orange on white) and named in a label — black inside, a white line, a black line, with an arrow that stays on the pointer when the label meets an edge. Label and click use one rule (`piece_at`).
- **Panel (11 Oct):** larger tabs, each a sign inside a ring: Dial · Rings · Hands · Windows · Export (Okay first asked for Export leftmost and a Guides tab, then, the same evening, Export rightmost and Guides as a box at the top right: the word opens the guides' settings, the tick switches them). Headings and labels flush left; four kinds of button (outline: an action · filled: writes a file · words: adds · a sign: acts on the selected ring). The ring list has a foot (add · up, down, duplicate, delete) and **rings can be dragged by their grip** to change the stacking order.
- **Guides have their own section (11 Oct), opened from the Guides box at the top right:** which ones (dial edge and window radii · centre lines · every ring's edges), colour, strength and thickness, and the same three for the selected ring. New keys `gd_…`; the starting values draw what was drawn before.
- **Windows (11 Oct):** the Date section is now Windows: up to four, each a **date, a day, am · pm (a day–night disc, by hour) or a moon phase (an arch over two humps, by the moon's age)**. Window 1 is the date window `dial.py` knows (`da_…`, with new `da_kind`, `da_hour`, `da_age`); windows 2–4 are `windows` in the settings. Three more positions: 1:30, 7:30, 10:30. `dial.py` draws window 1 as a date and ignores the rest.
- **Grouping (11 Oct, after Okay's screenshot of Export):** every section is cut into named groups under a hairline (Export: Examples · For production · Export a file · Settings file · Link to this dial · Log; Hands: All hands · Cap · One hand · Size · Details; Rings: Shape · Ends · Numerals · Band …); ticks start at the left edge. **The link is spelled out** in a box with *Copy link* under it. **The log** is small, monospaced, grey, on a light ground.
- **After Okay's phone screenshot (11 Oct):** on a narrow screen the bar is on top. **Groups fold**: a heading is a button that folds its group; which are folded is remembered by the browser (not part of the dial). **Colour**: a square swatch opens a palette — the dial's own colours, 22 dial colours, any colour — and the value can be typed (the browser's own colour control looked different on every system). **OpenType features are tiles**, pressed = on; the ones a font needs just to work (ccmp, locl, mark, mkmk, rvrn, aalt) are not offered. **The Guides box only switches guides**; their settings are a group in Dial, folded at first (the Guides section is gone).
- **Font sheet and Add fonts (11 Oct):** Type shows only the ring's font (its numerals, its name, *Change…*) and its styles as buttons; pressing it opens the **font sheet** over the panel (from the bottom on a phone), so the dial stays in view while fonts are tried. **Add fonts** in the sheet takes: a Google Fonts page link (`fonts.google.com/specimen/…`), an embed link (`fonts.googleapis.com/css2?family=…`), a family's name, a direct link to a `.ttf`/`.otf`, a font file, or (Chrome, Edge) the installed fonts. Google families are fetched from Google Fonts' repository on GitHub (`raw.githubusercontent.com/google/fonts`, folder from the family's name, files from its `METADATA.pb`, upright styles only): the font service itself only serves WOFF2, which HarfBuzz can't read. Fonts added from a link are remembered by the browser as addresses (`localStorage`, `dial-tool-fonts`). **Not tried against the real site from a browser**: the test serves the same paths locally; the header that lets other sites read those files was checked (`access-control-allow-origin: *`). A dial's link still carries font names only: someone else opening it must add the same font.
- **Phone (11 Oct):** below the bar and the preview the whole panel scrolls as one (header, tabs, ring list, rows); the tabs stay at its top.
- **Not in the web version yet:** imported shapes (SVG, PDF, AI), MP4 and GIF, live text, named instances, automatic fallback fonts (build list #50–#52).
- **Tests:** `cd web && npm test` — the parity check, then `test/window.mjs`: 89 checks on the built page in Chromium, with screenshots in `web/test/out/`.
- **Rules:** R30 (the web version), R19 extended.

## beta 2.3 · 4 Oct 2026

The preview plan (`docs/preview.md`), run in full. On `dev`; **not yet seen on a Mac** — check with `docs/preview.md` §6.

- **Canvas preview.** The preview is drawn by macOS's Core Animation: one layer per plate, ring, date part, hand and guide. No PDF is written or reloaded, so nothing flashes; zoom is redrawn sharp at every step.
- **Gestures:** pinch or ⌘-scroll zooms about the cursor; two fingers pan; **Fit** recentres. Zoom and place survive every redraw. Guides stay one screen point wide at any zoom.
- **Canvas · PDF switch** under the preview (`ui_preview`). PDF is the old preview: the reference to compare against and the fallback. If the canvas can't start, or fails while drawing, the PDF preview takes over and the Export log says why (R17).
- **One scene** (R26): `scene()` lists what to draw, bottom to top; export, the PDF preview and the canvas all read it. Harness renders are pixel-identical to beta 2.2 (45 renders: preview, selected ring, export, live text, no guides).
- **Frame clock** (R28): controls only ask for a redraw; a clock in step with the display draws at most once per frame, with the latest values. A time change turns three layers; a colour change sets one property.
- **Fixed:** Play stopped while a slider was held (its timer ran in the wrong run-loop mode). Play now runs on the frame clock. Dragging the time while playing carries on from the new time.
- **skia-pathops** for shape combining when it's installed in DrawBot (Python → Install Python Packages): 2–14× faster than DrawBot's own, and the same library as the harness. Without it, or if it gives up on a shape, DrawBot's own does the work.
- **Status line:** `canvas` or `pdf` · build ms (geometry) · frame ms (drawing). **Launch log:** preview, path route, shape combining, clock.
- **Window:** minimum width 1180 (was 1060), to keep the time slider's length with the new switch in the bar.
- **Tests:** `ui_smoke.py` has stand-ins for Core Animation and drives the clock: after every click it compares the canvas's layers with the scene; it checks zoom maths, gestures, the switch, every fallback and a second run of the script. Seven deliberate breakages of the canvas and clock were each caught.
- **Fixed, 11 Oct: MP4 export.** DrawBot renders a clip at 72 pixels per inch (one pixel per point) and its MP4 export refuses a frame with an odd pixel count (`imageContext.py`, `ensureEvenPixelDimensions`). The page is dial + margins, so the default 30 mm dial gave 102 px (worked, tiny) and a 33.5 mm or 36 mm dial gave 111 or 119 px (error in the Export log, no file). New setting **Clip size px** (`out_px`, 1080): MP4 and GIF are rendered at that size, always even (`clip_resolution()`); the log line says the size. Smoke test: MP4 at five page sizes against DrawBot's own rounding rule. Not yet run on a Mac.
- **Rules:** R26 (one scene), R27 (our own Cocoa classes), R28 (nothing renders inside a callback).
- **Design canon** (`docs/design.md`, R29): type, grid, colour, pictures and redrawn controls, after Braun's printed matter and Lupton's *Thinking with Type*, with what was read and what is only recalled.
- **Guidebook, third edition** (25 pages, A4 landscape): one sans (Inter), four sizes; a dark cover with contents; figures hang from one line and text stands on the bottom margin; the whole window redrawn in grey at true proportions from `dial.py`'s own measurements; a figure for the features that can be drawn, and nine classic dials (field, diver, dress, pilot type B, California, station clock, Bauhaus, sector, gauge) each printed with the settings that draw it. The classics are also presets: `docs/guide/presets/*.json`. Source is now `docs/guide/guide.html` + `tools/guide_dials.py` (was `guide.md`); R25 updated.
- **Guidebook, fourth edition** (same day): tighter text (unit 1.375 mm, was 1.5), leads and titles 12.4 / 31 pt; each topic opens with one large annotated example whose panel fills its column, then thumbnails; line icons and "Watch" notes; no accent colour; classic pages 8 · 4 with the dial the full page height. Rules in `docs/design.md` §2–§5.
- **Guidebook, fifth edition** (same day, 28 pages): rows join the columns (12 × 14; every box on a row line, one rule across each page under the pictures); pictures stand on paper, with a ground only for close-ups, the classics and the controls; plain plates drawn as hairline circles; a cover that shows one dial half as construction, half finished; a thumb index on the page edges; **every setting with range, step and starting value**, printed from `dial.py`'s rows; a **Find it** index. Source is now `docs/guide/pages/*.html` + `style.css` + `icons.svg` (was one `guide.html`); `tools/make_guide.py NAME` previews single pages and every build prints `CHECK` lines for what it measures wrong. How to write a page: `docs/guide/README.md`.
- **Guidebook, sixth edition** (same day): grounds are back behind every picture; one colour, signal yellow `#F5C518`, for every plain plate, the thumb index and the cover's line; three type sizes, larger (8 · 10 · 32 pt, was 7.5 · 9 · 12.4 · 31).
- **Guidebook, seventh edition** (same day): each of the 14 sections has its own pale colour (plates of its plain figures, its tab), stepped round from yellow; the cover shows the whole dial, uncropped, on a dark field and a yellow one, with a 96 pt title; the four Start icons redrawn on one outline; labels on pictures darkened, white on dark bands.

## beta 2.2 · 4 Oct 2026

Released to `main`: beta 2 runs on Okay's Mac (beta 2.1 screenshot, 4 Oct).

- **Live text export option** (Export → "Live text in PDF · SVG"): numerals and the date stay text the fonts can edit. Off by default — outlines need no fonts and print exactly as seen. Placed from the same outlines' bounds, so live and outlined numerals land in the same place (checked: under 0.05 % of pixels differ, upright, radial, on path, knocked out). What knockouts or the date's clearance cut away becomes a clipping mask.
- **Feature names** for dnom, numr, afrc, rvrn.
- **Guidebook:** `docs/Dial-Tool-guide.pdf`, 5 pages, IBM Plex Mono, from `docs/guide/guide.md` via `tools/make_guide.py` (figures rendered with dial.py itself).
- **Tests:** the harness checks live-text placement; the smoke test exports with live text (it caught a name clash in the date's live text before release).
- **Fixed:** a beta 1.0-style settings file now keeps any beta 2 keys it also contains.

## beta 2.1 · 4 Oct 2026

Interface, after Okay's first look at beta 2.0.

- **Ring settings are one scrolling list** instead of four pages: Kind, Colour, Radius · Positions · Give way · Look · Nudge · Type (with OpenType features and variable axes). Rows that don't apply to the ring's kind hide (R16).
- **Guides checkbox under the preview**, next to Now · Play · Fit, so it's in reach from every section.
- **Larger controls:** every control uses the regular macOS size (was small); the left panel is wider (470 px) to fit the labels.
- **Tab titles aligned left** on the section switcher and the hand picker.

## beta 2.0 · 4 Oct 2026

The dial becomes a list of rings.

- **Rings:** ticks, markers, numerals and bands, as many as you like. Add, select, rename, hide, duplicate, delete, move up/down. A ring's kind can change at any time and keeps its settings.
- **Pages for the selected ring:** Position (kind, colour, radius, positions, giving way) · Look (the kind's own settings) · Type · Nudge.
- **Positions:** count, start °, span °, every, offset, skip those instead. Partial spans make scales and arcs.
- **Giving way:** list order is stacking order; each ring can *skip where* and *knock out* round the rings above it, choosing which ones. Replaces the four collision rules.
- **Bands:** flat colour rings, sectors (count, every, fill %), pies, partial arcs; also used for railroad rails.
- **Type per numerals ring**; numbers counted from a start with a step and zero-padding (minute numerals 05…60, scales).
- **Hands:** each hand on its own — baton, pencil, sword, dauphine, leaf, arrow, syringe, Breguet, lollipop, or a file — with length, width, tail, tip, head/ring/disc, hollow wall, counterweight and colour, in mm. Cap colour of its own.
- **Imports:** SVG, PDF and AI (PDF-compatible) for markers and hands; fit to length, size ×, width ×. White fills cut, strokes are outlined, skipped content is reported (R23).
- **Date:** print clearance and print colour of its own; uses the top numerals ring's type.
- **Guides:** each ring's edges; the selected ring in orange.
- **Faster edits:** each ring's shapes are remembered by its settings, so changing one ring rebuilds only what depends on it.
- **beta 1.0 settings convert automatically** (last session and presets). Checked: 11 test dials give zero area difference against beta 1.0, hands included.
- **Tools:** `tools/ui_smoke.py` runs the whole interface off-Mac on stand-ins checked against vanilla 0.5.0's real signatures (`tools/vanilla-0.5.0-api.json`); it reproduces the beta 1.0 dropdown bug if R22 is removed. `tools/test_harness.py` gains ring variants and a check of the PDF importer's drawing logic.

## beta 1.0.1 · 4 Oct 2026

- **Fixed: dropdowns, checkboxes, segmented controls, colour wells, text fields and the Export/Settings buttons did nothing.** Cause: those controls were only held by the section's `GridView`, which keeps the Cocoa view but not vanilla's Python object; the Python object held the callback, Cocoa doesn't retain targets, so every callback was dropped once the section was built. Popup items showed grey because nothing answered their action. Number controls and the numeral picker worked only because something else happened to hold them. New rule R22.
- **Self-check at launch:** the Export log says `all controls connected`, or lists any control that lost its callback.

## beta 1.0 · 4 Oct 2026

First version as a project. Own window replaces DrawBot's `Variable()` panel.

- **Window:** section switcher (Dial · Track · Markers · Type · Numerals · Hands · Date · Export); live preview keeps zoom; time slider, Now, Play, Fit.
- **Number controls:** label · slider · typed field · stepper; typed shorthand `+`, `x`, `/`; typing past a slider's range extends it.
- **Markers:** bar, wedge (taper), dot, SVG; rounded outer/inner tips (true fillets); hollow wall for any shape; show-at; 12 o'clock style, scale, gap.
- **Fixed:** dots in one-ring mode (were silently turned into bars); double 12 had no gap control.
- **Type:** any installed font (family → style → named instance); language; size; tracking in 1/1000 em; variable axes as sliders; OpenType features as a checkbox list with designer names.
- **Numerals:** on-path placement keeps real kerning and one baseline; per-numeral nudge in the interface.
- **Hands:** proportions, seconds hand with counterweight, motion (sweep / quartz / 6 / 8 beats per second), SVG hands.
- **Date:** rounded aperture with frame; print kept clear of the hole.
- **Export:** PDF, SVG, PNG (dpi), MP4, GIF; production mask; mirror; save/load settings; last session restored; error log.
- **Tools:** `dial_probe.py` (interface foundation test), `test_harness.py` (off-Mac geometry renders).

## probe · 4 Oct 2026

`tools/dial_probe.py`. All checks passed on Okay's Mac (DrawBot 3.132): GridView forms, private drawing engine, 690 font families, feature lists, live outline render ≈ 50 ms. Found: vanilla Tabs collapse around auto-layout content.

## v0 · 3 Oct 2026

Single script with DrawBot's `Variable()` slider panel: track, markers, numerals (upright / radial / auto-flip / on path), parametric hands, date window, production and mirror modes, PDF/SVG/MP4 export. Limits that led to beta 1.0: no typed numbers, no sections, no font picker, fixed panel width.
