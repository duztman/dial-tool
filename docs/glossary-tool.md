# Glossary — the tool and its code

What each word means **in this project**: one line per term — the meaning, the key or the code name, the place. The look to the pixel is in the code and `design.md`; the reason is the row in `decisions.md`. Watch and dial words: [glossary-watch.md](glossary-watch.md). If a term is used differently in conversation, ask, then change the line.

## The window

| Term | Meaning |
|---|---|
| **Section** | A page of the left panel, by tab: Dial · Rings · Hands · Windows · Export (the fourth's key stays Date / 3, R8). |
| **Pane** | A named part of a section; its eye folds it. |
| **Pinned line** | A line outside the panes, always in view (row option `bar`). |
| **Toggle column** | The narrow far-left column holding the panes' eyes. |
| **Eye** | Open = showing, closed = put away; on a ring row it shows or hides the ring, never selects it. |
| **Margin** | The panel's side space, 24; lines and eyes align to it. |
| **Row line** · **Half line** | Hairline before and after every row; a half line runs from the controls' column to the right edge before a **nested row**. |
| **Nested question** | A tick or menu about the row above, starting on the controls' column. |
| **Nested row** | A row belonging to the one above: a question (`nest`), its settings (`tie`) or a note (`under`); starts on the controls' column. |
| **Side row** | A row squeezed beside a detail box: label · slider · number box (`side`). |
| **Heading selector** | A pane's main selector on its heading line (Labels, Complication). |
| **Tab** | A choice of what the panes below edit, drawn as touching tabs with V-cut corners: hand tabs, window cards, Complication buttons. |
| **Hand tabs** | Hour · Minute · Seconds, on Hands' second pinned line. |
| **Window cards** | Four cards on top of Windows (12 · 3 · 6 · 9), tabs choosing the window to edit. |
| **Show box** | The thin box under the hand tabs and window cards holding the tick **Show**. |
| **Detail box** | Left of a hand pane's rows: the chosen hand, large; **hand handles** (squares for Length, Tail, Width) on it; its **lit part** is what the pointed-at number makes. |
| **Picture tile** | One choice as a small drawing with its name. |
| **Pill switch** | A choice of a few words as pills in one rounded outline, the chosen one ink (`.pillswitch`); **free pills** are single pills wrapping (`free`). |
| **Toggle** | A small track with a travelling dot standing for on and off without words (`seg` with `bool`). |
| **Tick** (control) | A box with its name beside it; what it does goes in a note under it (design canon §6). |
| **Unit box** | At the title line's right: mm, points, inches, lignes, thou; settings stay mm. **Ligne** 2.2558 mm, **thou** 0.0254 mm. |
| **Mark · bio** | Okay's logo left of the title; opens the **bio**. |
| **Tag** | The small label a wordless button shows on hover (`.tag`). |
| **Reach** | The unseen touch area round a small control (R32). |
| **Drawer** · **gripper** | On a phone the panel is the drawer under the preview; its gripper sets its height. |
| **Bottom bar** | The dark strip at the window's bottom: time (play, **speed slider**, time with AM · PM, Now, **day slider**) · view: **zoom out · zoom in · Fit**, three squares stuck together, made as the canvas's switches and on their right line (a phone: Fit alone). |
| **Speed slider** | 0.1× to 720×; **slow motion** 0.1 · 0.25 · 0.5 · 1×, then log. |
| **Play triangle** | The white triangle on the play button, flaring with each beat. |
| **Undo step** | The dial before a change, taken once it stands still; ⌘Z, ⇧⌘Z. |
| **Sticker** | Font sheet: a small coloured pixel-font box naming one thing a family has. |

## Numbers and the controller

| Term | Meaning |
|---|---|
| **Number form** | How a row shows a number (R15): **A** full row · **B** quiet row · **C** value button · **D** named slider; the same ways in and one popup, the **controller**. |
| **Number box** | Every number's box: value, then − and +, touching (`.numbox`); shorthand `1.2`, `+0.5`, `x0.5`, `/2`. |
| **Number control** | Label · slider · number box: form A. |
| **Quiet row** | Form B (`quiet`): label · number box; the slider in the controller. |
| **Number block** | A Positions row (`block`): name and number box, no slider. |
| **Named slider** | Form D (`named`): the name over its slider, the value riding in the knob. |
| **Value button** | Form C: a number drawn as a small picture; a click opens the controller, press-and-move changes it. |
| **Controller** | The one popup for every number form (R15a): value pill over the knob, slider, − and + with the name between; `value_pop` in code. |
| **Chevron box** | A value from a menu: value box plus ⌄ (`menubox`, `chevron_box()`); opens the tool's own **menu list** (`menu_list()`). |
| **LINK pill** | Between two rows whose numbers may move together (`wh_link`); LINKED keeps their ratio. |

## Rings on the panel

| Term | Meaning |
|---|---|
| **Rings pane** | The pinned pane on top of Rings: tools, the **ring list**, the **ring drawer**. |
| **Ring list** | The list in Rings; its order is the **stacking order** (top drawn last). A row: eye, grip, kind icon, name; the selected row adds the **rename box** and its numbers. |
| **Ring drawer** | The framed box under the selected row: details, a swatch, **size** and **radius** as value buttons (`ringline`). |
| **List pill** | The black pill on the Rings pinned line with more than five rings: drag or tap for more rows. |
| **Ring settings** | The panes under the list, each shown only for the kinds it applies to (R16). |
| **Handles** | The selected ring's draggable marks on its guides: disc = radius, square = size, triangles = start and span end. |
| **Pointer label** | The name beside the pointer for the piece under it. |

## The preview

| Term | Meaning |
|---|---|
| **Guides** | Construction lines, never exported: the dial's kinds, a ring's or a window's guide (two solid circles at the edges, dotted in the middle), **added guides**; the **Guides switch** at the top right, its arrow the **guide list** (one column, four groups, a foot). |
| **Backdrop** | The preview's background colour (`c_backdrop`, `c_backdrop2`); the **backdrop switch** at the bottom left opens its colours. Never exported. |
| **X-ray** | Switch under Case: every window's disc whole, stacked, each layer fainter. Never exported. |
| **Switch's word** | A canvas switch's name beside its sign, folded to the sign; out for 3 s at load and under the pointer. |
| **Eye switch** | Square switch at the bottom right, drawn as an eye: the **dial alone**; under it show mode's switch (the **rays**), over it the Tiny Preview's iris. |
| **Dial alone** | Panel away, the dial fills the preview. |
| **Tiny Preview** | A small draggable window showing the dial at its own size (96 px to the inch). |
| **Shadows pane** | The Shadows switch's pane over the panel's column: the **sun picture** with Angle · Height · Strength in one box; then one line per part — the rows at the left, the **diagram** (`.stackpic`) at the right, each part on its row's line; the **footer** in cells. |
| **Footer** (of a night popup) | `.popfoot`: a band of the field colour, cells divided by hairlines of the night, content 13 in from each line, the last cell to the edge (the Shadows pane; Okay's drawing, 25 Oct 2026). |
| **LIMIT** | What a number row's name says, in red, for a moment, when its value reaches an end its neighbours set (`bounds`; the Shadows pane's heights). |
| **Bottom section** | A popup's foot on the night field: the Guides list's; the Shadows pane's is the **footer**. |
| **Colour pop-out** | What a swatch opens: *On this dial* · *Palette* · field and hues · RGB / HEX / CMYK / RAL; Copy is the copy sign. |
| **RAL mode** | The pop-out's fourth mode: a **family's grid** (7 steps of lightness × 16 of chroma; RAL Classic cells plain, RAL Design System+ cells dotted, the **Design switch** under, on to start) in the field's place, the nine **family bands** (1000 yellow … 9000 white and black, named under them) in the strip's; the line groups swatch and code in one box, the name beside, "≈" before a code the colour is near, not on. The values are the web's sRGB stand-ins; the printed card is the reference; Design colours are not what shops stock. |
| **Colour pill** | A button with swatch and hex that opens the pop-out. |
| **Palette** | The pop-out's second row: ten colours plus added ones; kept by the browser. |
| **Opacity** | The colour's fourth number; rings and sectors only. |
| **Versions** | Saved dials (at most nine, in this browser) and **Compare**; not a **build**. |
| **Gallery** | Last pane of Export: dials to open and take apart (`gallery.mjs`); its **examples** are five of the **classics** (`examples.mjs`). |
| **Classics** | Nine example dials drawn by eye after dial types, in `web/presets/`. |
| **Opener** | The dial opened with nothing in the address and nothing kept: the **First dial** (`opener.js`); what Reset restores. |
| **Blank face** | Button under Reset: starting values, no windows, one hidden ring; hands stay. |

## Show mode

| Term | Meaning |
|---|---|
| **Show mode** · **edit mode** | The tool's two modes: edit mode is the tool as it is; show mode (from the iris switch, ACTIVATE SHOWCASE) slides the panel out and the show column in — the whole watch, tabs Dial · Watch · Light · Export, **Shenanigans** at its foot. |
| **Show Case** | The public name of **show mode**: what a reader sees, in the app's title line ("Dial Tool Show Case") and on the help page (Okay, 26 Oct 2026: "Show mode is an internal term, public facing name is show case"). **Showcase**, one word, is retired (22 Oct 2026). |
| **Dial Show Case** | The standalone page at `/show-case/`, built from `web/src/watch.js`, kept as a sandbox. |
| **Engineer** · **Miyazaki** | The watch's two paints: ink outlines and hard shadows; flat shapes cut by light, a flare. |
| **Shown dot** (show mode) | A line's show or hide in show mode's Dial tab: a filled dot shown, a ring hidden (`shown_dot`); the eye is a pane's fold. |
| **Ink** (show mode) | One colour printed on the dial, exactly the same colour (`dial_inks`); its height in mm stands it proud of the plate (`w_inks`, default `INK_MM` 0.21). **Two inks**: one colour split into ink **A** and ink **B**, each its own height, each part on one by its A \| B pill before its name (an ink of two parts: the letters as text, first A, second B), its box that letter's height (`ink_b`, `frame_b`). **On the discs**: what a window's disc carries, its own height (`print_h`), never one of the dial's inks; the disc's colour is their baseline. **All inks at once** (`w_ink_all`): mm added to every printed height. |
| **Sun box** | The top of show mode's Light tab Sun pane: the **sun picture** centred in an outlined box, Angle · Height · Strength as plain values beside it; the rows under it change them (`row_sunbox`). |
| **Shenanigans** | Show mode's foot: Shadows, Flare, Blurs, Bevels on and off, as toggles. |

## Files, links, export

| Term | Meaning |
|---|---|
| **Settings** (`S`) | One dictionary of every value, saved as JSON; rings, hands and windows are lists in it. |
| **Link** (a dial's) | The address with the dial after `#`, **scheme 5**: lean settings, keys as codes from `LINK_KEYS`, deflated, base 32 (R31). Once opened the address bar shows the site alone; **Copy link** gives the whole. A **set link** (`#V`) carries the saved dials. |
| **Settings file** | A dial kept as JSON (Export → Settings file pane); the *Plain dial* is the starting values. |
| **Build** | A numbered release ("beta 4.90"), a row in `versions.md`; numbering R19. |
| **Print** (pane) | In Export: what only the printed dial needs (mask, mirror, sheet). |
| **Wear OS export** | The dial as a Wear OS watch face APK (Faruk Koç's PR #1); sideloaded, never for the Play Store. |
| **Guidebook** · the guide | The user guide, `guide/`, built by `guide/make.sh` on Okay's word only (R25); edition 1 at `/guide/`. |
| **Design canon** | `docs/design.md` (R29). |

## Code

| Term | Meaning |
|---|---|
| **Web version** | The tool: `web/src/` built by `node build.mjs` into one file, `web/dial-tool.html`, fetching nothing at run time (R30). |
| **Part** | One file of the window under `web/src/` (`panel.js`, `rings.js`…): an object of methods put on the tool's class in `app.js`. |
| **Scene** | What `scene()` returns: everything to draw, bottom to top, each **item** with a **role** (R26). |
| **Static geometry** | What doesn't move, rebuilt on a geometry change; hands turn every frame. |
| **PathKit** | Skia's shape combining (union, difference, xor) in the browser, pinned; the parity test's `skia-pathops` is the same engine. |
| **HarfBuzz** | The text engine: text + font + features + axes + language → outlines (R10). |
| **Stand-in font** | Inter, packed in: draws numerals whose font isn't loaded. |
| **Font list** | The open-licence families in `web/fonts/` via `fonts.mjs`, each with its `kinds` for the sheet's filters. |
| **Font sheet** | Opens from the font in Type: fonts shown by numerals, search, filters, **Add fonts**, **Installed** (`queryLocalFonts`), Light · Dark. |
| **Installed fonts** | The font sheet's **Installed** button: the computer's fonts (Chrome, Edge, `queryLocalFonts`). |
| **Font box** | The font in Type: numerals, language button, name, styles as **hanging tabs**, Size, Tracking and axes. |
| **Ink centre** | A short label centred on the box its ink covers (`ink.js`, the `INKED` list). |
| **Look-check** | `test/same.mjs`: every element's computed style, saved before and compared after a stylesheet change (R32c). |
| **Special** | A value off the stylesheet's scale on purpose: a named token in the specials block of `1-tokens.css` (R32b). |
| **Box rule** | A framed thing spans from the labels' start to the pane's right line, `--frame-pad` inside (design canon §10). |
| **Scale** (of spaces) | Every space a step of the unit (5.5): `--u1` ½ … `--u8` 4 units (R32). |
| **Icon** | A small SVG drawn in `icons.js` by R33: the **icon grid** (one unit a point, lines on **quarter points**), four widths **LINE · SLANT · CURVE · DENSE**, a **pictured width** kept as drawn, a **rim** an ordinary line, a line's **look** read by `icons/look.py`. |
| **Dial Mono** · **Dial Time** · **Pixel font** | The tool's own packed fonts: JetBrains Mono (the unit box, the row's numbers), Barlow Condensed Light (the bar's time), Silkscreen (stickers, tiny numbers). Not dial fonts. |
| **Imported file** | An SVG, PDF or AI as a marker or hand shape (R23; not built, #50). |
