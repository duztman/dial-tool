# Dial Tool — design canon

*Written 4 Oct 2026 with the guidebook's third edition (beta 2.3); revised the same day with the fourth. Okay: "this design research might influence
the whole build, take notes… let's make it canon."*

This file is the rule for everything Dial Tool shows on paper or screen that isn't a dial: the guidebook
first, then presentation sheets, spec sheets and, where it applies, the tool's own window.
`docs/guide/guide.html` is its reference implementation; if they disagree, fix one of them the same day.

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

Not found: a text source describing the layout of Braun instruction leaflets in detail. If one turns up,
check §2–§6 against it.

## 2 · Type

- **One family, sans.** Inter (open licence; fetched at build time). Okay asked for "a sans like Univers";
  Univers itself can't be redistributed. Changing the family is one `@font-face` line in `guide.html`.
  No monospace anywhere: file names are italic, things you type or click are semibold.
- **Two weights and one light.** 400 text, 600 emphasis and headlines, 300 for the big titles only
  ("big, light type with small, dark type").
- **Four sizes.** 7.5 pt captions and labels · 9 pt text · 12.4 pt leads and headlines · 31 pt titles
  (the cover alone goes to 64 pt). Nothing smaller than 7.5 pt. (4 Oct 2026, fourth edition: leads and titles
  up about 3 % from 12 and 30 pt.)
- **Leading on a 1.375 mm unit.** Captions 2.5 units (3.44 mm), text 3 (4.125 mm), leads 4 (5.5 mm), titles 8
  (11 mm). Every space between things is a multiple of the unit: 1 inside a cluster, 4 between clusters.
  (Fourth edition: the unit came down from 1.5 mm, about 8 %, to set text tighter.)
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

- **A4 landscape, 12 mm margins, 12 columns** of 19.08 mm with 4 mm gutters.
- **Two lines hold every page.** A top line: the rule, the section number, title and lead, in a head of fixed
  height — so figures on every page **hang from the same line**. A bottom line: the text that explains the
  figures **stands on the bottom margin**. The white between them varies and is left white.
- **Two columns under the head.** One holds the **large example**, the other the small ones. The large
  example's grey panel takes whatever height its column has left, so no page ends in unexplained white; its
  controls and a Watch note stand under it. In the other column thumbnails hang from the top line and the
  text blocks stand on the bottom margin.
- **Large first, then small.** Each topic opens with one example big enough to carry dimension lines and
  labels (4 or 6 columns), then goes to 2- or 3-column thumbnails with two-line captions.
- **Units.** Thumbnails take 1, 2 or 3 columns; text blocks 3 or 4; the large example 4 or 6.
- **Pages of text only** (Start, The window, Classics, Recipes) have no large example: their rows share the
  white evenly.
- **The classic pages** split 8 · 4: the dial in a square panel the full height of the page, then title,
  what it is drawn after, what to look for, and the settings table standing on the bottom margin.
- **The cover** is the one page off the grid: a dark field the colour of the dial's own plate, the dial far
  larger than the page.

## 4 · Colour

- Paper `#FCFCFA`, ink `#111111`, grey text `#5C5C58` (never lighter: it must stay readable at 7.5 pt),
  rules `#B9B9B4`, figure ground `#ECECE8`.
- **No accent colour** (fourth edition; the orange numbers and dots are gone). Section numbers are ink;
  callout numbers are a figure in a line circle.
- Dials keep their own colours. Everything around them is neutral.
- No tinted panels, rounded cards, shadows or decorative rules. A hairline above a block is the only frame.

## 5 · Pictures

- **Every dial is drawn by `dial.py`** from settings kept in the repo, and the values printed beside a
  picture are the ones that drew it (R25).
- A figure sits on a flat grey square, with a two-line caption: what it is (semibold), then its values (grey).
- Close-ups show the top of a dial, always cropped the same way, so figures in a row compare.
- **Annotations are drawn in the dial's own millimetres** (`overlay()` in `tools/make_guide.py`): dimension
  lines with end ticks, leaders ending in a small ring, dashed construction lines. Text on them is 7.5 pt and
  lines 0.2 mm on paper at any enlargement — the page measures each picture and sets them.
- **Line icons.** One set, drawn on a 24-unit square with a single stroke, square ends, no fill
  (`<symbol>`s at the top of `guide.html`). One per text block, above its label; a few per page, never as
  decoration without a block. Four are drawn large on the Start page.
- **Watch notes.** A triangle icon and a short paragraph: what a careful reader would otherwise find out the
  hard way (order works twice, radii are absolute, fillets stop silently …). One or two per page, under the
  large example. They state the tool's behaviour, not advice.

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

## 8 · For the tool itself — ideas, not decisions

Noted while drawing the window; none is built. Each needs Okay's word (R18).

- Number fields in tabular figures, so values don't jitter while a slider moves.
- One accent in the preview too: guides are blue and orange today; the canon would make them grey and orange.
- The ring settings list could take the guide's order of ideas: Positions · Give way · Look · Type.
- Presentation sheets (build list #17, #18) should use this grid and type from the start.
