# Sectors — where a thing on screen lives, and what moves it

An index, not a rule set (Okay, 25 Oct 2026: "an index to easily find what you're looking for, and insurance against agents missing info. No new bulk"). When Okay describes a change in words ("a hair more inside the Guides foot's pills"), walk the tree to the region, read its one line, then open only what it points at: the rule, the canon section, the token in `css-map.md` (generated from the stylesheet; `npm test` keeps it current), the check that guards it. Then measure (R21), change once, prove with `same.mjs` if the look must not move (R32c).

Notation: **Region** `selector` — the one rule · levers → where the full word is. A region inherits every line above it and says nothing about that; it says only what it **sets** (its own tokens, its own rule lines) and what it **borrows** (`borrows: <quirk> from <region>` — a look taken from a region that is not its parent, named so the next session knows it is deliberate). Files are `web/src/css/` unless said; `rules/` is `docs/rules/`.

## 1 · The panel (left; `.panel`, `4a-panel.css`)

The grid: a toggle column (`--eye`) and six columns (`--col`, `--gap`) between two margins (`--margin`); every line runs margin to margin, over the eyes · canon §3; the figures in `1-tokens.css` under *the panel's columns*.

- **Header** `.panel > header`, `.mast`: mark, title, version, Help, unit box, Gallery pill — the title keeps its place; the unit box is `.unitbox` (Dial Mono) · glossary-tool *Unit box*, *Mark · bio*.
- **Section tabs** `.tabs`: five round signs; the chosen one fills ink (`5-chosen.css`) · R33, canon §9.
- **Pinned part** `.pinned`: lines always in view (hand tabs `.handsbar`, window cards `.windowcards`, the Rings pane) · glossary-tool *Pinned line*; a `.tab` draws itself in two clipped layers (R32) · `4b-lines-tabs.css`.
  - **Show box** `.form > .showbox`: the one tick Show, on the words' first line · canon §6 *Tick rows*.
  - **Rings pane** `.ringlist`, `4f-rings.css`: tools, the list (a row: eye · grip · kind · name; the selected row adds rename and figures), the **ring drawer** `.ringline` (a framed thing: canon §10, `--frame-pad`), the **list pill** `.listgrip` · R16 for what hides; the check: window test *ring list*.
- **The scrolling part** `.form`: its own surface (`--surface` → `--scroll`, `--row-rule` → white) so an inset block never melts into its ground · `1-tokens.css` *what a part stands on*.
  - **Pane** `.pane`: a thick line opens it (`--thick`); its **fold** `.fold` holds eye, title, summary (small grey indicator · canon §6); folded, *Name: summary*. A pane whose rows all don't apply goes with them (R16).
  - **Heading with controls** (a window's places, its shapes): a unit over and under, the title where every heading has it · canon §10.
  - **Row** `.row`, `4c-rows.css`: `--line` high, a hairline before and after (`--row-rule`); name on the first two columns, controls from the third (`--nest-from`).
    - **Number row** `.row.num`: tracks laid out in full, `--num-columns` · R15 (the forms), canon §10; the **number box** `.numbox` (`--box-value`, `--box-steps`) · R15; the **controller** it opens, §4 below.
    - **Side row** `.row.side` (beside a detail box): `--side-columns`, the slider straight after its name · canon §6 *A side row*; `4d-hands.css`.
    - **Quiet row** · **named slider** · **value button**: R15 forms B, D, C.
    - **Tiles** `.picks` (`3-controls.css`): four to a line on the control columns, `--tile-w`; two or three keep a four's size · canon §6 *A row of tile buttons*.
    - **Pill switch** `.pillswitch`, **free pills** `.free`, **toggle** `.toggle`: `3-controls.css` · canon §6, R15 *Words*, *Toggle*.
    - **Nested row** `.row.nest/.tied/.under`, **note** `.row.note`: part of the row above's box, no line between, a half line from `--nest-from`; the box ends `--note-air` under a note · canon §6 *A tick says its name; a note says what it means*; the check quotes #420.
    - **Detail box** `.detail` (`4d-hands.css`): the hand large, its handles `.grips .handle`, the lit part `.lit` (#329).
    - **Font box** `.fontbox` (`4g-fonts.css`): a framed thing; hanging tabs `.tab.hang`; Lang. and Change… at `--control-s` · R32a; the **font sheet** `.picker` (search, filters, Installed, Light · Dark) · R35.
    - **Colour** `.colour`, the **swatch** → the **colour pop-out** `.colourpop` (`4e-colour.css`): draggable, doubles; `dvh` for an iPad's bars.
    - **Gallery, examples** `.gallery`, `.examples` (`4h-gallery.css`): cards by `card()` in `web/links.mjs`.
- **Chosen** (`5-chosen.css`): what is switched on, picked or open is ink with paper words — one layer, nothing earlier undoes it · R32.
- **Show mode's column** `.showing .panel`: the same panel, `--show-col`, `--show-margin`, tinted from the backdrop (`show.js` sets `--column`, `--column-top`, `--swatch`, `--uiblack`); **Shenanigans** `.shenanigans` at its foot (borrows: the toggle from a hand's Bevel line, R15 *Toggle*) · glossary-tool *Show mode*; `mode.js`.
  - **Sun box** `.row.sunrow > .sunbox` (Light tab, `4c-rows.css`; its picture's colours in `6-preview.css`): five `--line`s high, an outline in `--ink`; on `--num-columns` — the picture over columns 1–5, the values `.sunvalues` on the number boxes' column; borrows the Shadows pane's `sun_picture` (centred view) · glossary-tool *Sun box*; #526.
  - **Show mode's Dial tab** (#545): every line `.colourlist > .row.showline` on four columns, its first place (eye, an ink's fold, A or B) out in the panel's left column at `--nudge` — `.mark` (`--kind-pic`) · name · the swatch column (`--pill-w`: a `.colour` pill, or `.swatches` — small `--dot` swatches six to a line in `.dots`, `.note` beside) · `.place` (`--side-num`); Colours' lines `.bare` (sectors six to a line) and `.row.showsub .colhead` (group names, grey, sentence case); **Inks** `.inklist` — `.inkline` (fold `.chev` · swatch · `.inkname` hex in `--mono` and count · height box at `--side-num`), `.inkline.open > .place.two` (Two inks at the line's end), `.inkpart` (a part: its `.pillswitch.ab`, its name, its height); the pane's *Height mm* `.pane > .colhead`; Hands `.row.bevels` (pills from column 3) — all in `4e-colour.css` · glossary-tool *Ink*.

## 2 · The preview (`main`, `.preview`; `6-preview.css`)

Canvas measures: `--canvas-top`, `--canvas-inset`; what sits on the canvas is `.onview` (`--control-large` high, `--on-canvas` line) · canon §6 *Grey only*.

- **Top right stack** `.corner`: Guides switch `.guides` with its arrow → **guide list** `.guidelist` (one column, 240 wide, four groups, `--pop-pad`, menus as round chevron boxes); under it Case `.casebox`, X-ray · glossary-tool *Guides*, *X-ray*; #539 for the list.
  - **A popup's foot** `.guidefoot` and the Shadows foot: on the night field, to the box's bottom, its own pills · glossary-tool *Bottom section*; the Shadows foot borrows: the foot's shape from the guide list (#539, #526).
- **Bottom left**: Backdrop switch, Shadows switch → **Shadows pane** `.shadelist` (lives on the body, over the panel's column: `--shade-left/right/bottom` measured by `guides.js`; its measures `--shade-*` in the specials block, from Okay's drawing of 25 Oct 2026): the top box `.suntop` — the **sun picture** `.sunpic` (`--sun-w`, `--sun-h`) and the three named sliders `.three` (R15 form D; `--shade-track`, `--shade-knob`); the heading line `.shadehead`; the parts' rows `.shaderows` (`--stack-name`, `--shade-slide`; `bounds` → LIMIT) and the **diagram** `.stackpic` (`--stack-w`), one line per part; the **footer** `.popfoot` (`--foot-h`, `--foot-in`) — sets: the night grey `--night-grey`, the lit red `--shade-lit` · glossary-tool *Shadows pane*, *Footer*; #526.
- **Bottom right**: the eye switch (dial alone), under it show mode's iris and rays, over it the Tiny Preview's iris `.tinyopen` → `.tinywin` · glossary-tool *Eye switch*, *Tiny Preview*.
- **Top line**: undo · redo `.undos`, its history list `.historylist`; Versions.
- **Night parts** (`.night`, `3-controls.css`): every dark popup (guide list, Shadows pane, colour pop-out, controller) — `--night` and its kin; row names `--pop-label` wide.
- **Handles** `.handles .handle`: `--handle` is the ring's guide colour, set by `preview.js`/`hands.js`; the reach rule round each.
- **Pointer label, switch's word**: `--white` on any colour · glossary-tool.

## 3 · The bottom bar (`.bar`; `7-bar.css`)

`--bar-height` (`--bar-control` for its controls); 80 % black, light on dark (`--bar`, `--bar-ink`, `--bar-field`); the one light tone `--bar-light` (55 %); nothing on the bar is white (Okay, 15 Oct 2026) · tokens' comments. Time group `.lead` (play `.play`, speed `.speedtrack` with its humps, time in Dial Time `--time-face`, Now, day slider `.day`); view group `.viewing`: `.zooms`, zoom out · zoom in · Fit as three joined squares — borrows the canvas switches' `--control-large` and `--round-switch` (they move together), the right edge at `--canvas-inset` (the bar's padding); a phone shows Fit alone (`8-narrow.css`). Type `--t-time` · R32a. On a phone two lines (`8-narrow.css`, `--bar-lead-narrow`, `--bar-day-narrow`).

## 4 · The controller (`.numpop` + `.numground`; `4f-rings.css`)

The one popup for every number form · **R15a** has every measure (the value pill over the knob at 70 %, the discs 70 % × 85 %, as wide as the row's controls, multiply on light / screen on dark, 1.2 s then fades — `--num-pop-linger`, read by `ui.js`). `value_pop` in `panel.js`; the check: window test *controller*.

## 5 · Narrow screens (`8-narrow.css`)

Phone and upright iPad: the panel is a **drawer** under the preview with its **gripper** `.sheetgrip`; the bar in two lines; hover looks are off (`@media (hover: hover)`, R32) · glossary-tool *Drawer · gripper*.

## 6 · The levers in general

- Every value is a token (`css-map.md`: value, what it is for, where used, where set again, set or read by which `.js`). A bare number in a rule is a bug or a missing special (R32b).
- Spaces are steps of the unit: `--u1`–`--u8`; lines `--hair`, `--thick`, `--triple` · R32.
- Type sizes: the `--t-` tokens, `--t-pixel` for Silkscreen · R32a.
- Colours: `--paper`, `--ink`, `--grey`, `--rule`, `--ground`, `--select`, `--glow`, `--hover`, the bar's, the night's · tokens' *colour* block; canon §4.
- Icons: never a stylesheet border or a scaled drawing · R33, `web/icons/`.
- What proves a change: `node test/same.mjs` for the look (R32c); the window test's check for a position, with Okay's words in its message (CLAUDE.md, the loop, step 2); the layout check #188 (not built) will read the specials block.

## 7 · A new region

Three lines at most, in its place in the tree: its selector and one rule line; **sets:** its own tokens; **borrows:** each quirk taken from a region that is not its parent, by name. Nothing for what it inherits.

A borrowed quirk is decided in the token, not in prose — two ways, and the choice is Okay's when it is not obvious:

- **The two should always move together** → use the other region's token as it is. The map shows both regions under that token; a change to it is seen against both.
- **Alike now, free later** → a token of its own whose comment names its origin: `--shade-foot-pad: var(--pop-pad); /* as the guide list's foot, own since 25 Oct 2026 (Okay: "…") */`. The map's *What it is for* carries the origin, so the pair can be found with one search for the other token's name.

Never the number copied into a rule: a bare value is a breach of R32 and loses where it came from. When a region here has no line for what Okay asks, that is the gap: add the line (and the canon or rule it points to), not a bare value.
