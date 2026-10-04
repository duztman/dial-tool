# Dial Tool — design canon

*Written 4 Oct 2026 with the guidebook's third edition (beta 2.3); revised the same day with the fourth, fifth and sixth. Okay: "this design research might influence
the whole build, take notes… let's make it canon."*

This file is the rule for everything Dial Tool shows on paper or screen that isn't a dial: the guidebook
first, then presentation sheets, spec sheets and, where it applies, the tool's own window.
`docs/guide/` (`style.css`, `pages/`) is its reference implementation; if they disagree, fix one of them the same day.

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
  Univers itself can't be redistributed. Changing the family is one `@font-face` line in `docs/guide/style.css`.
  No monospace anywhere: file names are italic, things you type or click are semibold.
- **Two weights and one light.** 400 text, 600 emphasis, headlines and leads, 300 for the big titles only
  ("big, light type with small, dark type").
- **Three sizes** (sixth edition, 4 Oct 2026; Okay: "overall larger type, fewer type sizes"). 8 pt small:
  labels, captions, tables, annotations. 10 pt text — and its semibold is every headline and the lead.
  32 pt light: titles and the four big words on Start (the cover alone doubles it, 64 pt). Before: 7.5 · 9 ·
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
- **One colour: signal yellow `#F5C518`** (sixth edition; Okay: "select a characteristic color like teenage
  eng."). It is the plate of every plain figure — so a figure reads as "a dial", black ink on yellow — and
  the thumb index, and the line that cuts the cover. Nothing else. Chosen over orange because it carries
  black marks and navy bands at full contrast and is the yellow of a Braun seconds hand. One constant each:
  `PAPER` in `tools/make_guide.py`, `--sig` in `style.css`.
- Dials keep their own colours. Everything around them is neutral.
- No tinted panels, rounded cards, shadows or decorative rules. A hairline above a block is the only frame.

## 5 · Pictures

- **Every dial is drawn by `dial.py`** from settings kept in the repo, and the values printed beside a
  picture are the ones that drew it (R25).
- **Every picture has a ground** (sixth edition; Okay: "bring back the backgrounds. Blocks seem better
  aligned that way"). The ground is the grid box made visible: whole dials, close-ups, hands and large
  examples all sit on `#ECECE8`. The fifth edition's rule — ground only where a picture needs an edge — was
  tried and withdrawn. Icons and the cover have no ground.
- **A plain plate is yellow** (§4), in whole figures and in close-ups. Classic dials keep their plates.
- **Side by side, one thing changes.** Figures in a row share view, scale and crop; only the setting in the
  caption differs. A caption is two lines: what it is (semibold), then its values (grey).
- **Annotations are drawn in the dial's own millimetres** (`overlay()` in `tools/make_guide.py`): dimension
  lines with end ticks, leaders ending in a small ring, dashed construction lines. Text on them is 8 pt and
  lines 0.2 mm on paper at any enlargement — the page measures each picture and sets them. The build reports
  a label that leaves its picture or overlaps another.
- **Line icons.** One set, drawn on a 24-unit square with a single stroke, square ends, no fill
  (`docs/guide/icons.svg`). One per text block, above its label or beside it; a few per page, never as
  decoration without a block. Four are drawn large on the Start page.
- **Watch notes.** A triangle icon and a short paragraph: what a careful reader would otherwise find out the
  hard way (order works twice, radii are absolute, fillets stop silently …). One or two per page, under the
  large example. They state the tool's behaviour, not advice.
- **Steps are pictures in a row**, numbered in their captions: one view, one change per step (Start: a first
  dial in four moves; Give way: stack, skip, knock out).
- **The cover is the idea in one picture**: a dial cut by a vertical line. Left of it the construction —
  every radius and angle the settings name, in hairlines over a ghost of the dial — right of it the dial
  those settings print. Dark field, the dial larger than the page, contents on the left.

## 6 · The tool's controls, redrawn

- **Grey only.** Window `#ECECEC`, controls white with `#C2C2C2` edges, filled parts `#6E6E6E`–`#8A8A8A`.
  Colour wells and the dial are the only colour.
- **True proportions.** The window is drawn in the tool's own units — 1300 × 860 points, panel 470, the form's
  columns 132 · 200 · 62 · 24 — and scaled as a whole. Rows, labels, slider ranges and values are read from
  `dial.py`'s row descriptions and a classic dial's settings; the preview is the tool's own, with guides.
- Small groups of controls beside figures use the same drawing at text size.
- One thing in the window drawing is invented: the build and frame times in the status line.

## 7 · Writing

- A block is a label, a one-sentence headline, and two to four lines. If it needs more, it is two blocks.
- Say what a setting does and give a real value. No adjectives about the tool.
- Glossary words only (`docs/glossary.md`).
- **Written for use.** A block says what you would do with the setting, not only what it is. One dry line a
  page is welcome ("the ranges are habits, not limits"); two is a tone.
- **Three ways in**: the contents (cover), the thumb index (page edges), and Find it (last page: what you
  want → what the tool calls it → page). Every setting is also listed once, with its range, step and
  starting value, in tables printed from `dial.py`'s own rows (R25): they cannot drift.

## 8 · For the tool itself — ideas, not decisions

Noted while drawing the window; none is built. Each needs Okay's word (R18).

- Number fields in tabular figures, so values don't jitter while a slider moves.
- One accent in the preview too: guides are blue and orange today; the canon would make them grey and orange.
- The ring settings list could take the guide's order of ideas: Positions · Give way · Look · Type.
- Presentation sheets (build list #17, #18) should use this grid and type from the start.
