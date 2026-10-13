# Dial Tool — changelog

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
