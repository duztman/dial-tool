# Dial Tool — design canon

*Written 4 Oct 2026 for the guidebook; §9 (the tool's icons) 14 Oct 2026; last updated 19 Oct 2026 (beta 4.88.2: tick rows, §6). Okay: "this design research might influence
the whole build, take notes… let's make it canon."*

This file is the rule for everything Dial Tool shows on paper or screen that isn't a dial: the guidebook
first, then presentation sheets, spec sheets and, where it applies, the tool's own window.
`guide/look/` (`style.css`, `build.mjs`) is its reference implementation; if they disagree, fix one of them the same day. The old guides are in `archive/guide/`.

## 1 · What it is modelled on

**Braun's printed matter, late 1950s–60s** — catalogues and instructions for use: a product shown plainly on
a neutral ground, a few lines of exact text, numbered parts, one grotesque typeface, a great deal of white,
colour used almost never.

**Ellen Lupton, *Thinking with Type*** — the working rules for letter, text and grid.

What was read on 4 Oct 2026, and what is only remembered:

| Source | Status |
|---|---|
| Lupton, *Grid*: thinkingwithtype.com/grid | **Read.** "The more columns you create, the more flexible your grid becomes"; "Not all the space has to be filled"; body text "can 'hang' from a common line"; base a baseline grid on the type's size and leading, "avoid auto leading", "position all page elements in relation to the baseline grid" where feasible, override it when a layout needs it. |
| Lupton, *Letter*: thinkingwithtype.com/letter | **Read.** Lining numerals "take up uniform widths… enabling the numbers to line up when tabulated"; running text in capitals "can look utterly insane"; "try mixing big, light type with small, dark type"; Univers "conceived as a total system from its inception". |
| Lupton, *Text* (kerning, tracking, line spacing, alignment, hierarchy) | **Not reachable** (the page refused the fetch). Rules below marked *(recalled)* are from memory of the book, not re-read. |
| Braun *Guidelines for the visual design of information and advertising*, Wolfgang Schmittel, 1958 (Vignelli Center archive) | **Existence and authorship read** (iainclaridge.co.uk/blog/52187). Its pages are images; their content was not readable here. |
| "Braun's own sparing, hierarchical use of colour"; Akzidenz Grotesk, Helvetica and Univers as "the obvious type choices" for Braun-related work | **Read** (the-brandidentity.com, on Das Programm). |
| How Braun manuals actually look (lowercase headings, Akzidenz, numbered line drawings, multilingual columns) | **Recalled**, not documented by a page read on this day. Treat as a description of an intention, not a citation. |

**teenage engineering's guides** (added with the fifth edition, at Okay's pointer: "they have loads of data,
they are top notch") — for how much reference a guide can carry and stay calm: one view of the thing
repeated with a single part changed, labels outside the drawing on thin leaders, outline drawings with
almost no fills, decimal section numbers, parameter tables.

| Source | Status |
|---|---|
| teenage.engineering/guides/ep-133, /guides/op-1/original, the OP-1 field guide PDF | **Read as text summaries only** (a fetch tool's description of each page). The pages were not seen. Section numbering, tables and lowercase prose are documented by those summaries; the drawing style is the summary's wording, not an observation. |
| "The best way to use teenage engineering manuals" (observer.bearblog.dev) | **Read.** Its complaint: 100-page PDFs are written to be read through, and people need "quick answers to specific questions". Answered here by the Find it page and the thumb index. |

Not found: a text source describing the layout of Braun instruction leaflets in detail. If one turns up,
check §2–§6 against it.

## 2 · Type

- **One family, sans.** Inter (open licence; fetched at build time). Okay asked for "a sans like Univers";
  Univers itself can't be redistributed. Changing the family is one `@font-face` line in `guide/look/style.css`.
  No monospace anywhere: file names are italic, things you type or click are semibold.
- **Two weights and one light.** 400 text, 600 emphasis, headlines and leads, 300 for the big titles only
  ("big, light type with small, dark type").
- **Three sizes** (sixth edition, 4 Oct 2026; Okay: "overall larger type, fewer type sizes"). 8 pt small:
  labels, captions, tables, annotations. 10 pt text — and its semibold is every headline and the lead.
  32 pt light: titles and the four big words on Start (the cover alone triples it, 96 pt). Before: 7.5 · 9 ·
  12.4 · 31.
- **Leading on a 1.375 mm unit.** Small 2.5 units (3.44 mm), text 3 (4.125 mm), titles 8 (11 mm). Every space
  between things is a multiple of the unit: 1 inside a cluster, 4 between clusters.
- **Line length 40–75 characters.** *(recalled)* So text blocks are 3 or 4 columns wide (65 or 88 mm at 9 pt),
  never 2. Leads run 6 columns at 12 pt.
- **Flush left, ragged right.** *(recalled)* No justification, no centring, no hyphenation.
- **Sentence case.** No words in capitals; no letterspaced capitals; no small capitals.
- **A level of hierarchy gets one or two signals, not more.** *(recalled)* Label: small + grey. Headline:
  size + weight. Emphasis in text: weight only.
- **Figures are lining and tabular** wherever they line up: tables, captions, recipes, the redrawn controls.
- **In the tool's window, two kinds of figures** (Okay, 14 Oct 2026): numbers that change in place — fields, the time,
  counters — are tabular, so they don't jitter; a label that stands still in a box of its own ("10:30", "720×", "AM")
  is proportional, so a "1" doesn't carry a "0"'s width.
  Numbers alone in the interface are in the panel's own type, lining and tabular, with a plain zero — never slashed
  (Okay, 20 Oct 2026, 00:20: "tabular linings on … in all interface where we use nothing but numbers, no slashed zero").
  The mono faces are for what the tool says (log, hex, link) and the bar.
- **A label in a box is centred on its ink** (Okay, 14 Oct 2026: "FIND THE RECTANGLE… AND CENTER THAT"): the rectangle
  its ink covers, left to right and top to bottom, stands on the box's centre — not its advance widths, not the font's
  line box. Overhangs are fine. Measured in the face actually drawn, on that screen, never typed in as a nudge
  (`web/src/ink.js`). Not the ink's weight: shown and not chosen.
- **Air before size** *(Claude's, to confirm)*: a label's ink keeps at least a quarter of its font size clear of the
  box's edge; if it can't, the box grows or the label gets shorter — the type does not shrink.
- **Real characters.** ’ “ ” · × − ° → ⌘, not their typewriter stand-ins.
- **No type crimes.** *(recalled)* Nothing stretched, no faux bold or italic, no tight tracking of text.

## 3 · Grid

*Fifth edition, 4 Oct 2026: rows added. Okay: "you are fine at stacking by the rules, let's add horizontal
alignment to these rules as well."*

- **A4 landscape, 12 columns × 14 rows.** Side margins 12 mm, top and bottom 11.5 mm. A column is 19.08 mm
  with 4 mm between; a row is 6 units (8.25 mm) with 4 units (5.5 mm) between. 14 × 6 + 13 × 4 = 136 units =
  187 mm, the page's height inside its margins.
- **Every box starts and ends on a column line and a row line.** Its size is said in columns and rows
  (`c`, `r`), never in millimetres. The build measures this and reports any box that is off.
- **The head is rows 1–2**: the rule, the section number, title, and a lead of one or two lines.
- **The line under the pictures.** In the 12 rows under the head, pictures take the top 8 and words and
  controls the bottom 4, so one rule runs across the whole page at row 9 (Marks: row 10, for three rows of
  shapes; Numerals: row 11). Left of it the large example with its controls and a Watch note; right of it the
  small figures with the blocks that explain them.
- **Large first, then small.** Each topic opens with one example big enough to carry dimension lines and
  labels (4 or 6 columns, 6 or 8 rows), then goes to thumbnails.
- **Fixed sizes for small things.** A thumbnail of a whole dial is 2 columns × 4 rows: the picture is the top
  three rows and the spaces between them, the caption exactly the fourth row (two lines). A close-up is
  2 × 3 or 3 × 4; a hand 1 × 4. A text block is 3 or 4 columns wide and 2, 3 or 4 rows high.
- **Pages of words** (Start, The window, Classics, Reference) use the same rows: blocks of 3 or 4 rows, in
  bands across the page.
- **The classic pages** split 8 · 4 and use all 14 rows: the dial on a ground the full height of the page;
  beside it the title (rows 1–3), what to look for (4–6), and the settings table hanging from row 7.
- **Reference tables** keep the rhythm: a table row is 4 units, so five of them are two grid rows.
- **The thumb index.** Fourteen sections, fourteen rows: section *n* has a black tab at the page's edge on
  row *n*. Flip the edge to find a section.
- **The cover** is the one page off the grid.

## 4 · Colour

- Paper `#FCFCFA`, ink `#111111`, grey text `#5C5C58` (never lighter: it must stay readable at 8 pt),
  rules `#B9B9B4`, ground `#ECECE8`.
- **Every section has its own colour** (seventh edition, 4 Oct 2026; Okay: "Yellow is lovely. Start with
  that but revert to paler, less contrasty to bg color palette. Every section gets own color."). Fourteen
  pale tints of one lightness (OKLCH L 0.90), the hue stepped round the circle from yellow (95°) in
  fourteenths. Yellow keeps the most colour (C 0.095); hues far from it get less (down to 0.045), because a
  green or blue of equal strength looks louder on the grey ground. Section 1 is `#F0DC8E`.
- A section's colour is used for exactly two things: the **plate of its plain figures** (whole and close-up)
  and its **tab** on the page edge. The cover's right field is section 1's. Defined once, in `guide/look/`;
  pages receive it as `--sig`.
- Dials keep their own colours. Everything around them is neutral.
- No tinted panels, rounded cards, shadows or decorative rules. A hairline above a block is the only frame.
  *Exception, the tool's window only (Okay, 12 Oct 2026): colour things are round and the colour pop-out is near black — the pop-out, a colour pill, a swatch.*

## 5 · Pictures

- **Every dial is drawn by `archive/drawbot/dial.py`** from settings kept in the repo, and the values printed beside a
  picture are the ones that drew it (R25).
- **Every picture has a ground** (sixth edition; Okay: "bring back the backgrounds. Blocks seem better
  aligned that way"). The ground is the grid box made visible: whole dials, close-ups, hands and large
  examples all sit on `#ECECE8`. The fifth edition's rule — ground only where a picture needs an edge — was
  tried and withdrawn. Icons and the cover have no ground.
- **A plain plate takes its section's colour** (§4), in whole figures and in close-ups. Classic dials keep their plates.
- **Side by side, one thing changes.** Figures in a row share view, scale and crop; only the setting in the
  caption differs. A caption is two lines: what it is (semibold), then its values (grey).
- **Annotations are drawn in the dial's own millimetres** (`guide/look/`): dimension
  lines with end ticks, leaders ending in a small ring, dashed construction lines. Text on them is 8 pt and
  lines 0.2 mm on paper at any enlargement — the page measures each picture and sets them. The build reports
  a label that leaves its picture or overlaps another.
- **Line icons** (the guidebook's; the tool's own icons follow §9). One set, drawn on a 24-unit square with a single stroke, square ends, no fill
  (drawn inline by `guide/look/build.mjs`). One per text block, above its label or beside it; a few per page, never as
  decoration without a block. Four are drawn large on the Start page.
- **Watch notes.** A triangle icon and a short paragraph: what a careful reader would otherwise find out the
  hard way (order works twice, radii are absolute, fillets stop silently …). One or two per page, under the
  large example. They state the tool's behaviour, not advice.
- **Steps are pictures in a row**, numbered in their captions: one view, one change per step (Start: a first
  dial in four moves; Give way: stack, skip, knock out).
- **The cover is the idea in one picture**: one whole dial, 198 mm across, 6 mm from three edges of the
  page, on two fields that meet on its centre line. Left, dark: the construction — every radius and angle the
  settings name, in hairlines over a ghost of the dial — with the title (96 pt) and contents. Right, section
  1's yellow: the dial those settings print. Nothing is cropped.
- **The four Start icons share one outline**, the dial's circle, with one idea drawn inside each (a radius
  with millimetre ticks, an angle from 12, a hatched mark, a stack).
- **Labels on pictures**: ink, with their second line in dark grey `#3A3A38`; white where they cross a dark
  band. A label sits wholly on the plate or wholly on the ground, never across the edge.

## 6 · The tool's controls, redrawn

- **Grey only.** Window `#ECECEC`, controls white with `#C2C2C2` edges, filled parts `#6E6E6E`–`#8A8A8A`.
  Colour wells and the dial are the only colour.
- **True proportions.** The window is drawn in the tool's own units — 1300 × 860 points, panel 470, the form's
  columns 132 · 200 · 62 · 24 — and scaled as a whole. Rows, labels, slider ranges and values are read from
  `archive/drawbot/dial.py`'s row descriptions and a classic dial's settings; the preview is the tool's own, with guides.
- Small groups of controls beside figures use the same drawing at text size.
- One thing in the window drawing is invented: the build and frame times in the status line.
- **Tick rows in the window** (Okay, 19 Oct 2026, 18:00: "These are rules now"): the tick box stands on the words'
  first line, its middle on that line's middle — never between two lines. The words run to two lines at most, with
  no orphan: a second line gets filled (say more) or the first is cut short so the lines balance (`text-wrap:
  balance`). The Show tick under the window cards and the hand tabs: the white tick fills its black box
  (the box as it is, the tick grown to the box less half a unit).
- **A tick says its name; a note says what it means** (Okay, 19 Oct 2026, #420: "I like b … hiding the white line, one
  line or two line if necessary explanations … applies to small grays too. They are always within the same box that
  ends with a bottom white border"). A tick's words are its name, a few words in ink, on one line ("Big date",
  "Neighbours", "Inside the case"). What it does goes in a note under it. Every note, under a tick or under any other
  row, is part of that row's box: no line between them, the box's line under the note. A note is small (`--t-s`)
  and grey, one line or two. Its first line follows the row's line at the panel's line spacing (`--leading`): under
  a tick, as a tick's second line would, starting where the tick's words start; under controls, just below their
  boxes, on the controls' column. The box ends as far under the note as a row's words start above
  (`--note-air`). The CSS for it: `4c-rows.css`, *a note and the row it explains are one box*.
- **A word on a heading's line that is not its title** (Resize Ring's *from*; a folded pane's summary) is an indicator:
  small and grey, the summary's look (Okay, 20 Oct 2026, 01:16: "Small and gray like other indicators on the below left
  column").
- **A note belongs to its row**: no line between them, however many hidden rows lie between (`sync_rows` marks the row
  *noted*); under a field it starts just below the box, under a tick at the words' start, under a row of tiles a
  tile-gap below them (20 Oct 2026, 01:16: "why the follows.. line stuck up there? what is the actual shape it must be in?").
- **A side row** — a name, a slider and a number box squeezed beside a box (a hand's rows beside its picture; Give
  way's Clearance): the slider follows its name with no gap, the name's column as wide as the longest name; the gap
  that would stand there goes to the slider and the number box, so four figures show whole (Okay, 19 Oct 2026, 23:46
  and 23:53: "love the slider growth. this special case happens when sliders need to fit with boxes like this").
  `--side-columns` in `1-tokens.css`. A full row (R15 form A) keeps its gaps.
- **A choice of a few words is a pill switch** (Picture, Names, Paper, a disc hand's Marker, the font sheet's Light ·
  Dark): a rounded outline as wide as its words, the words in it as pills, the chosen one ink (Okay, 20 Oct 2026, 01:33:
  "Arch phase line selector exactly like this light dark selector here. exactly same style. can we make this
  universal?"). `.pillswitch`. The dark popups too: the Guides list's foot (Thickness; Add as free pills; Okay, 25 Oct 2026, #539).
- **A row of tile buttons** (a window's complications, a mark's shapes; Okay, 19 Oct 2026, 21:26: "Complications tabs
  are 10/10. Do not touch, rule for 4 item buttons like this from the future. 5th squeezes in, or we find another
  way"; "2 or 3 buttons on a selector like complications work the same. Same size buttons, gaps on the right"): the
  tiles stand on the controls' column, beside the row's name, four to a line and equal. Two or three keep a four's
  size, the room left at the right. A fifth squeezes in, the five equal; more than five is a sign to find another
  way. `.picks` in `3-controls.css`; `--across` (windows.js) is never less than four.

## 7 · Writing

- A block is a label, a one-sentence headline, and two to four lines. If it needs more, it is two blocks.
- Say what a setting does and give a real value. No adjectives about the tool.
- Glossary words only (`docs/glossary.md`).
- A tick row's words: at most two lines, the second filled or none (§6).
- **Written for use.** A block says what you would do with the setting, not only what it is. One dry line a
  page is welcome ("the ranges are habits, not limits"); two is a tone.
- **Three ways in**: the contents (cover), the thumb index (page edges), and Find it (last page: what you
  want → what the tool calls it → page). Every setting is also listed once, with its range, step and
  starting value, in tables printed from `archive/drawbot/dial.py`'s own rows (R25): they cannot drift.

## 8 · For the tool itself — ideas, not decisions

Noted while drawing the window; none is built. Each needs Okay's word (R18).

- Number fields in tabular figures, so values don't jitter while a slider moves.
- One accent in the preview too: guides are blue and orange today; the canon would make them grey and orange.
- The ring settings list could take the guide's order of ideas: Positions · Give way · Look · Type.
- Presentation sheets (build list #17, #18) should use this grid and type from the start.

## 9 · The tool's icons

*Canon since 14 Oct 2026 (beta 4.36), from the icon audit Okay asked for ("Let this knowledge of good and proper icon
making be canon. This pipeline for upcoming icons"). Binding through R33. Source: the icon block at the top of
`web/src/icons.js`; checks and tools: `web/icons/` (its `README.md` says how to use them).*

Every screen the tool is used on is 2× (iPad, both Macs): a point is two screen dots, and Chrome puts each icon's
corner on a dot even when the layout puts it on a fraction (measured, 14 Oct). So what decides sharpness is the grid
inside the drawing.

- **One unit, one point.** An icon's viewBox is its size on screen. Nothing is drawn at one size and shown at
  another: scaled drawings land no line on a dot (before the audit, nine families were scaled ×0.63 to ×1.69 and
  their lines came out 0.79 to 2.36 thick). The hand tiles are the one exception: drawn by the geometry at exactly ×2.
- **Every line in an icon is a line**: a tab's ring, a window card's dial, a window's frame, the rename box, a round
  button's ring, a value button's disc. They weigh the same as the sign inside them (Okay, 14 Oct: "Borders, circles
  outlines. They all count as part of icon"). A ring that holds a sign keeps its outer edge where it was, so nothing
  grows. The square button boxes around icons are the stylesheet's and are not icons.
- **Equal on the eye, not in numbers** (Okay: "consistent line thickness is a good goal, but OPTICALLY CONSISTENT
  needs finesse … perception overrules, sensibly"). A straight line on the grid is three solid dots; a curve or a
  slant spreads the same ink over more, paler dots and looks lighter; short lines crowded into a small sign look
  heavier. So one look takes four widths, each a sixteenth of a point from the next:

  | Name | Width | For |
  |---|---|---|
  | `LINE` | 1.5 (three dots, about the stem of the panel's type) | straight runs on the grid; arrows (their heads meet the shaft and look heavier there) |
  | `SLANT` | 1.5625 | slanted lines alone: chevrons, crosses, a polygon, a handle, a letter, undo and redo |
  | `CURVE` | 1.625 | circles, arcs, waves, the eye, every ring that holds a sign, the round corners of a box |
  | `DENSE` | 1.25 | short lines crowded inside a small sign: the Guides target, the arrow in a box, a stand |

  The widths were measured, not guessed: each line read in place, the screen blurred as an eye sees it at a desk
  (sigma 1.5 screen dots), against a lone straight 1.5 line (`web/icons/look.py`). After the audit the median line is
  1.5 % off that reference and the worst tenth 4 % (before: 9 % and 26 %).
- **Round corners weigh more.** A box's round corner drawn as thin as its sides looks 3–5 % lighter (measured at
  r 2 and r 4). A box is drawn with `box()`: sides `LINE` on the grid, corners `CURVE`.
- **The grid where it helps.** A `LINE`'s level and upright runs sit on quarter points (x.25, x.75): three dots wide,
  they then cover whole dots. So a 16-point sign is centred on 8.25, half a dot off the middle, which no eye sees. A
  circle's centre on a quarter and its radius on a half (or the reverse) puts its top, bottom and sides on whole dots.
  Curves antialias at any width: for them the eye wins over the grid. Fills put their edges on half points.
- **Pictured widths are not lines.** The ring kinds' ticks (1), marks (2) and band (3) picture the dial's own widths
  and stay as drawn; so does the dashed none-baton (2: a dashed line looks lighter than a whole one). Fills (pupils,
  pivots, the window block) are not lines either.
- **A stylesheet border is not an icon line.** Chrome draws a border in whole points only: asked for 1.5 or 1.62, it
  draws 1 (measured, 14 Oct). Where a border is part of a sign, the sign draws it (`round_sign()`, the ring list's
  round tools).
- **One drawing per idea.** One plus (9 long), one minus, one cross (8), one chevron (8 × 4), one copy sign, one
  sheet, wherever they appear (`SIGNS` in `icons.js`). Open shapes are drawn a little smaller than arrows and boxes
  beside them, because they look larger. Round caps and joins on every line, as on the dial (Okay, 13 Oct).
- **A quiet sign** may be drawn `DENSE`, with its box's corners an eighth heavier (`box(…, DENSE, DENSE + 1 / 8)`): the
  rename box (Okay, 11 Oct: "thin and light"; 14 Oct: "thinner lines"). Quiet is a choice per sign, Okay's, not a
  default.
- **Colour is not weight.** A ring that frames a tool (the round tools' rims, the value buttons' discs) is light grey,
  the stylesheet's `--rule` (#B9B9B4, about 28 % grey), at full weight (Okay, 14 Oct: "lighter gray, keep the
  thickness… 30 % gray").
- **A dashed ring is a texture**, so its dashes end square (the Guides switch's centre ring when guides are on);
  every other line ends round.
- **Optical, after equal.** The play triangle sits half a point right so its weight is centred, not its box; a window
  keeps 4 points from its dial's rim at every angle (not one radius); a sign whose lines crowd gets `DENSE`.
- **The Guides switch** (Okay's drawings, 14 Oct): on, a target whose centre ring is dashed; off, the target cut by a
  hollow slash — two lines with the target cut away between them (an SVG mask).
- **Chosen states** fill: a tab's disc fills ink and its sign turns paper; the Dial sign's centre hole becomes a dot
  of paper; a pressed value button fills its shape with ink, keeps its outlines grey, and turns its inner line and
  pivot paper (Okay's drawing, 14 Oct).

**For a new icon** (the pipeline, `web/icons/README.md`): draw it at any size in any program → `node icons/fit.mjs
drawing.svg 16` puts it on the grid, gives each line its width and prints the code to paste → paste it into the icon
block → `node icons/check.mjs` (also part of `npm test`) checks every icon in the running window against the rules
above → `python3 icons/look.py` reads how heavy each line looks and names any that is off, and why → look at
`icons/out/sheet.png`, then on the Mac and the iPad. The numbers propose; the eye decides.
