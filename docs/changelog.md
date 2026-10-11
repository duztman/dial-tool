# Dial Tool — changelog

## beta 4.1 (web version) · 11 Oct 2026

On `dev` and online. Okay, 11 Oct, after beta 4.0: "Bottom (and top) black bar. Lighter gray, better organization, better usability. Add a fast time option. Make a better guides toggler. Icon bullseye with lines, rounded corners, on/off distinct", then "Columns? They fit 'em". Seen in Chromium here only.

- **The bar is light grey** (`#DADAD5`, was black `#111111`), with a hairline where it meets the preview, white controls and a black Play.
- **Three parts, split by hairlines:** what is selected (with the square that puts the panel away) · **time**: Play / Pause, speed, the time, the slider, Now · **view**: − and + (zoom by 1.4 about the middle; new), Fit.
- **Fast time:** 1× (real time) · 60× (a minute every second) · 720× (twelve hours in a minute). It is the window's state, not the dial's: not saved, not in a link.
- **The bar keeps the panel's columns:** under the panel the square stands in the toggle column and the status runs over the six columns; beside it Play, Now, − +, Fit are one column wide (54), the speeds and the time two (120), 12 apart; the slider takes what is left.
- **Guides switch:** a rounded box two columns wide (columns 5–6) with a bullseye crossed by lines. On: filled black, "Guides on". Off: dashed grey outline, "Guides off". A press only switches (unchanged).
- **Phone:** the bar's controls share one row, the slider has the row under it; no zoom buttons (a phone pinches).
- **Tests:** 114 checks: 60× speed, the zoom buttons, the switch's two looks, and the widths above.
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
