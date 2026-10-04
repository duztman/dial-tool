# Writing the guidebook

*4 Oct 2026. For whoever edits the guide next. The look is decided in `docs/design.md`; this file is the how.*

| File | What it holds |
|---|---|
| `pages/NN-name.html` | One file per page (or small group of pages), in reading order. Text, and which pictures go where. |
| `style.css` | Every style. One unit, `--b` = 1.375 mm. |
| `icons.svg` | The line icons, each a `<symbol id="i-NAME">` on a 24-unit square. |
| `img/`, `presets/` | Generated. Don't edit. |
| `tools/make_guide.py` | Figures (`FIGURES`), large examples (`HEROES`), their annotations (`overlay`), the build. |
| `tools/guide_dials.py` | The nine classic dials as settings. |

## Build

```
python tools/make_guide.py              # everything → docs/Dial-Tool-guide.pdf
python tools/make_guide.py marks date   # two pages → docs/guide/cache/preview/*.png, in seconds
```

Both print `CHECK` lines for what the build measured wrong: a box too small for its text, a box off the
grid, an annotation that leaves its picture or overlaps another. Fix every line before committing.

## The grid

A page is **12 columns × 14 rows**. A column is 19.08 mm with 4 mm between; a row is 6 units (8.25 mm) with
4 units between. The head takes rows 1–2; a `<col>` holds the 12 rows under it. Every box says how many
columns (`c`) and rows (`r`) it takes, and they fill a `<col>` left to right, top to bottom.

The usual page: pictures in the top 8 rows, words and controls in the bottom 4, so one line runs across
the page under the pictures.

What fits: a block with an icon above holds 7 lines of text in 4 rows and 3 in 3 rows; with `side="1"`
(icon beside) 2 rows hold 2 lines. A caption holds 2 lines. If it doesn't fit, shorten the text.

## Tags

```
<page id="marks" no="05" title="Marks" lead="One or two lines.">
<col c="4">
  {{hero:marks:4:6}}                               large example, 4 columns × 6 rows
  <block c="4" r="3" k="The mark above">           a block: k = small grey label
    {{ui:strip:shapes-0:0:shape,r,len,w}}</block>
  <watch c="4" r="3">What the tool does that you’d otherwise find out the hard way.</watch>
</col>
<col c="8">
  {{strip:shapes}}                                 the small figures, each with its caption
  <block c="4" r="3" ic="fill" side="1" k="Label" h="Headline.">
    <p>Text.</p></block>
</col>
</page>
```

- `<block>`: `c`, `r`; optional `ic` (icon name), `side="1"` (icon beside the text), `xl="1"` (large icon),
  `k` (label), `tag` (a callout number), `big` (a large word), `h` (headline). The body is HTML.
- `<watch>`: `c`, `r`; optional `k` (default "Watch") and `ic`.
- `<find>`: an index. One line each: `what you want | what the tool calls it | page id`.
- A page with `no="14.2"` is a sub-page: it is indented in the contents and shares its section's tab.

## Marks

`{{version}} {{date}} {{contents}} {{cover}} {{window}} {{classics}}` ·
`{{page:ID}}` a page's number · `{{dial:NAME}}` a classic dial's picture · `{{thumb:NAME}}` the same, small,
with caption · `{{strip:NAME}}` `{{strip:NAME:FROM-TO}}` a row of small figures · `{{hero:NAME:COLUMNS:ROWS}}`
a large example · `{{rings:NAME:SELECTED}}` a dial's ring list, redrawn ·
`{{ui:strip:NAME-INDEX:RING:keys}}` `{{ui:dial:NAME:RING|hour|minute|second|date|dial:keys}}` controls, redrawn ·
`{{ref:ring1|ring2|dial|hands|date|export}}` every setting, from `dial.py`'s row descriptions.

## Pictures

- A small figure is one line in `FIGURES`: a title, the values text, and the rings (or a classic dial as
  `base`). `crop="top"` makes it a close-up of 12 o’clock.
- A large example is one line in `HEROES` and, if it is annotated, a branch in `overlay()`. Annotations are
  written in the dial’s own millimetres from its centre (y grows downward): `leader()`, `dim()`, `label()`.
  Their text is always 7.5 pt and their lines 0.2 mm on paper: the page measures each picture and sets them.
- Close-ups are placed by `CLOSE` / `CROPS`: an enlargement and the radius that sits at the panel’s top.
