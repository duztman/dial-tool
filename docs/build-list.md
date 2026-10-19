# Dial Tool — build list

Numbered, never renumbered. Status: **open** · **verify** · **done** · **parked**.
*Last updated 19 Oct 2026 (beta 4.87: done items moved to build-list-done.md; the DrawBot items archived; stale "verify" rows closed).*
Every item keeps its number for good. Done items: `docs/build-list-done.md`. The DrawBot version's items: `archive/drawbot/build-list-drawbot.md`.

## Next

| # | Item | Status |
|---|---|---|
| 12 | Production limits per method: minimum line width and clearance; warn in the preview | open |
| 13 | Numerals centred on the cap height instead of each numeral's own outlines. The radius' anchors are centre · outer edge · inner edge (ring key `anchor`, #95, #338; baseline and ascender retired, #418) | open |
| 14 | Heavy dials (knock-outs over hundreds of ticks take about 90 ms a slider step in Chromium, more on the Intel Mac): redraw on mouse-up if dragging feels slow | open |
| 15 | Fallback font for scripts the main font lacks (Eastern Arabic, Chinese: HarfBuzz has no automatic fallback). Okay, 17 Oct 2026: "Fallback set is a good idea but not necessary, we run on fonts" | parked (Okay) |
| 16 | Live text in the SVG (*Keep numerals as text in the SVG*, Export; R10): open one in Illustrator with the font installed — do the numerals land where the outlines do, do the cuts arrive as clipping masks? The PDF's live text is #63 | verify |
| 47 | Design canon §8, ideas for the tool's window: tabular figures in number fields; grey + orange guides; presentation sheets on the canon's grid. Ask Okay | open |

## Web version (Okay's first asks, 11–12 Oct 2026)

| # | Item | Status |
|---|---|---|
| 50 | Imported shapes (SVG, PDF, AI) for markers and hands: a "file" shape is drawn as a bar or baton and the log says so; the hands' dashed SVG tile says "not built yet". In a browser the file's content has to travel inside the settings (no file paths). With #72, #173 | open |
| 51 | MP4 and GIF export (WebCodecs) | open |
| 52 | Named instances of variable fonts in the font box (a weight axis without named styles gets Regular · Bold, #275; the font's own instances are not listed). The PDF's live text is #63, the fallback font #15 | open |
| 53 | **Better interface overall** — Okay, 11 Oct 2026: "better ui overall, learn and implement. Move delete layers, export better." Research first (how good parametric tools lay out lists, inspectors and export), then propose. Left of it: an export panel that shows what will be written (#171); the atlas's other interface patterns (sections 4 and 6) are not picked | open (Okay: later) |
| 56 | Remembered fonts: fonts added from a link are remembered; font files added by hand are forgotten when the page closes | open |
| 60 | A dial opened from a link could fetch a missing Google family by its name by itself — not done: every unknown font would cost three failed requests | open |
| 63 | **Live text in the PDF**: the SVG keeps numerals as text; the PDF is written by hand (`web/src/output.js`), so live text there means building the font into the file. Okay, 11 Oct 2026: "SVG now, PDF later" | open |
| 68 | File names: `dial-30mm-2026-10-12.pdf` (diameter and day; a mask says `-mask`, `-mirrored`). Okay was asked (12 Oct 2026): this, or a name field for the dial? With #227 | open |
| 69 | Split `web/src/app.js` (one class, about 5,900 lines). Scrollbars that take room (macOS "Show scroll bars: always") would make the scrolling rows about 15 narrower than the pinned ones — not reproduced here; ask Okay what his Mac is set to | open |
| 72 | **Logo**: an SVG placed on the dial with the mouse; it is also a ring, edited in Rings "differently"; a link from the Dial pane goes to it. Its file's content travels in the settings (#50). Ask Okay before building: its colours (he first wanted an SVG's colours adjustable), scale and rotation, whether a link can carry it. Words are the text ring's (#297) | open |
| 73 | **Background image** on the plate: only the button exists (Dial pane, says "Not built yet"; #218). When built: PNG, scale · rotate · move · opacity, *Include in export*; not in a link; R4 needs an exception. Okay, 12 Oct 2026: "No background image functionality now. Just the button" | parked (Okay) |
| 76 | Units box (mm · pt · in · lig · thou): should sliders and steppers step in the shown unit? They step in mm | open |
| 77 | **Persistent groupings for every section** — Okay, 12 Oct 2026: "Persistent lines are scary for me too. Sucks to have no left view height, especially on rings on iPad… Park for now." Only All hands is pinned; main selectors stand on heading lines instead | parked (Okay) |
| 75 | Usability review, the other tabs: Rings · Hands · Windows · Export, one at a time (Okay, 12 Oct 2026) | open |
| 66 | Tabs and the columns: five tabs share six columns, so they sit between columns (Okay, 11 Oct 2026: "Columns? They fit 'em"). Ways: tabs one column each with the sixth free, or a sixth sign. Ask Okay | open |

## From the atlas review (13 Oct 2026)

Atlas: https://claude.ai/artifact/QdvVC37Y6csV7FcUjJHqAH. Numbers in brackets are the atlas's entries.

| # | Item | Status |
|---|---|---|
| 83 | **Positions law** [1.1]: a selector on the Positions heading line: even · reciprocal · logarithmic · table · squeeze toward an angle [7.15]. Only `ring_angles()` changes. Tachymeter [1.2] = reciprocal with base, from, to, step; one ticks ring per stretch of steps. Depth cartouches [1.14] = table, typed as angle and label pairs. To decide when it is built: Count hides where the law sets it (R16); what "a partial span marks both ends" means per law; a table brings its own labels | open — Next |
| 84 | **Jog** [7.19]: the on-screen jog ring (atlas 2nd ed. 4.4). The keys exist: ← → a minute, ⇧ an hour, space plays or pauses (not while typing, on a slider or a menu) | open |
| 85 | **Hand tip to a ring's edge** [7.13, Max Bill]: a button in Hands → Size that sets Length once. A lasting link would need rings to have identities; they are a list that is reordered. Okay, 14 Oct 2026: "easy to do?"; "while resizing that, it would be nice if it could 'snap' places. But this is a bigger question for later. park for now." | parked (14 Oct) |
| 87 | **Registration marks** [3.7]: the same two marks in the page margin of every production file. With per-ink masks (#35); needs a line in R5 / R26 | open — Later, with #35 |
| 88 | **Weight** [6.19]: one value in Dial that multiplies every width on the dial, applied like Scale everything (#70) so the panel's numbers stay true. Okay, 14 Oct 2026: "very very good… under Dial, and note the danger of changing all the settings all at once" | open — Next |
| 89 | **Movement numbers**: a *Size from movement* menu for windows [2.2] and the dial feet as a sixth kind of guide [3.8]. Blocked: only Sellita's two window sizes were read from a source (SW200-1 2.00 × 2.70 mm, SW400-1 2.40 × 3.24 mm); Ronda's are inferred, NH35 and Miyota drawings were unreadable; feet positions depend on the movement (brief §5.1). Okay opens the drawings on a Mac first | open — Later, blocked |
| 90 | **A ring edited flat** [7.16, Fischinger]: cut at 12, edited as a strip, rolled back. A second way to show the preview; close to #61 | parked (Claude's proposal) |
| 91 | **A sliding strip for Count** [7.5, Citroën GS]: a new kind of number control; R15 would need an exception, and Count has a typed field and a stepper | parked (Claude's proposal) |
| 132 | **The font box's preview follows the switches** (Okay, 13 Oct 2026: "Slashed zero updates font preview, also fractions etc get previewed instead of abc. These are notes for later"): the preview is drawn with the box's own settings — its OpenType features (a slashed zero shows in the 0), its axes — and, when a feature that needs other text is on, shows that text in place of "Abcdefg" (fractions: 1/2 3/4; ordinals: 1st 2nd; superscript…). The preview is drawn plain (`sample()` in `app.js` passes `features: {}` and the font's resting axes). Not to be built until Okay says | open — later |
| 100 | **The whole interface smaller on an iPad**, about 80 % (Okay, 13 Oct 2026: "note for later"). The sizes are tokens (R32), so one factor on them — or the page's zoom — can do it; the reach rule keeps small controls pressable. Decide: iPad only or a setting | open — later |
| 93 | **Guidebook for the web version** (R25): edition 1 at https://duztman.github.io/dial-tool/guide/ — eight A4 pages and a phone stack from one source, composer `guide/look/` (README there), also an InDesign package (IDML); the app's Help link opens it. Rebuilt only when Okay asks (`bash guide/make.sh`), never with an app release. Open: the human reader round (two people new to the app, `guide/tests/humans.md`); Okay's look at the pages and the package's first open in InDesign; step 9 (his production round); edition 2 (per-pane anchors, #230). For the next rebuild: the guide's First dial steps no longer end on the opener (#331) and its script should press *Plain dial*, not Defaults (#279) | open |

## Okay's evening review on the iPad (13 Oct 2026)

Okay's notes of 13 Oct 2026, 21:02–22:15, most with pictures (the session's zip of 13 Oct, `images-okay/`).

| # | Item | Status |
|---|---|---|
| 134 | One line of Okay's note on the Windows section (13 Oct 2026, 21:02) is unread: "Input should work with defaults? (which the title has to move up" — a window's Text field showing its default? the label above it? Ask | open — ask |
| 135 | **Weekday and month names by language, built into the tool** (Okay, 13 Oct 2026): Arabic, Farsi, European languages (which? ask), Turkish, Japanese, Chinese, Korean, as an option under the day selection. EN · TR · DE · FR · IT exist (#346); non-Latin scripts need a fallback font (#15); a month window would be a new kind (R9) or the day window's list | open — later (Okay) |
| 140 | **Everything print-related under Export › Print** (Okay, 13 Oct 2026): registration marks per ink (#87, #35) and all else about printing go there | noted → with #87, #35 |
| 149 | "Lock the ring on preview" (Okay, 13 Oct 2026, on the window cards' pictures) — unclear: the ring fixed and only the window moving in the pictures? Ask | open — ask |
| 158 | **Icon states not checked by the pipeline:** hover; the font box's *Same font as* sign (shown only with a window's own font); the labelmenu chevron (12). Drawn on the grid, not visited by `check.mjs` | open |
| 162 | **A few more icons to redraw** (Okay, 14 Oct 2026: "Few more ugly icons to fix… not for today. Ask for them next time I go into the project"). Okay has them; ask, then draw them through `web/icons/` (R33) | open — ask Okay |

## From the atlas, second edition (14 Oct 2026)

Okay's notes on the atlas and his answers, 14 Oct 2026. Atlas numbers are the second edition's.

| # | Item | Status |
|---|---|---|
| 169 | **One strip for every position** (atlas 2.1; Okay: "very very good… prioritize this", "core to our mission"): one per-position value per setting, shown as a strip of cells under a ring; draw a line across to set the ends and get the middle; type a rhythm (`L S S S`) to repeat. Nudge holds per-position values (#349). Draw and show Okay before building | open — Next |
| 171 | **Export as a list of files** (atlas 6.3): tick what to write (dial, mask, mirrored mask, PNG), one press | open — Next |
| 172 | **A history you can read** (atlas 5.15): undo steps named by what changed, listed under the undo buttons | open — Next |
| 173 | **Image or SVG import onto the dial** (Okay: "guilloche is a good point but not our job, instead we should implement image or svg import for the dial"). With #72 (logo), #50 (imported shapes), #73 (background) | open — Next |
| 174 | **Loupe** (atlas 6.4; Okay: "not necessary but cute. if very easy, implement") | Later |
| 175 | **A hand as a stack**: caps, windows, lume openings within the current interface | Later |
| 176 | **A fit section under Dial's sizes** so rings and windows fit | Later |
| 177 | **The am · pm disc as a ring of its own**, its geometry accurate and isolatable (the windows' discs show in X-ray, #346) | Later |
| 178 | **Combinations side by side as a preview mode** | Later |
| 179 | **What the counterweight is for** (Okay: "maybe later") | Later |
| 180 | **Gerstner's programme** (Okay: "park for now, remind when applicable") — remind Okay when #169 exists | parked |
| 184 | **Snapping** (Okay, 14 Oct 2026, on #85): lengths and radii that snap to rings' edges while dragged. "A bigger question for later" | parked |
| 187 | **Units typed anywhere** (atlas 5.7; Okay, 18:39: "do this"): a field takes `0.5in`, `12pt`, `1lig`, `3mm`, `0.3cm`, `0.5″` and converts to the unit shown; storage stays mm (R1) | open |
| 188 | **A layout check** (atlas 5.10; Okay, 18:39: "THIS ROCKS. YEZXS PLEAĞSE."): a test that reads the window's boxes and reports what misses the box rule (R32): fields and steppers off their column, spaces off the unit, framed things past the pane's lines. Reports first; fails `npm test` once Okay has sorted real misses from intended ones | open |

## From the guide's inventory (15 Oct 2026)

App faults the guide's reviewers and its coverage walk found (`guide/PLAN.md` step 1). The guide states the behaviour, dated, until each is fixed.

| # | Item | Status |
|---|---|---|
| 218 | **"Add image…" is a dead end**: it says "Not built yet" (R17). Build it (#73, #173) or hide it. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 219 | **No export without the hands and the window content**: a colour export always holds the hands at the time shown and the date (a printer sent it prints hands onto the dial). An Export option to leave them out. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 220 | **Marks lying on a band vanish in the mask** unless the band knocks them out; nothing warns (the Sector dial: its chapter band's ticks and numerals are lost). Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 221 | **Knock-out ignores hidden rings**: hiding the rings above a band and exporting gives the band solid, so per-ink films made that way lose their holes. Films come from one full export's PDF layers until this changes. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 222 | **Cut lines in the resist's black**: the window's and the centre hole's 0.05 mm cut lines are drawn in the mask's black (layers "Window 1 cut line", "Hole"); the PNG mask bakes them in. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 223 | **No mask invert** (toner where there are no marks, for sunk marks). Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 224 | **No blank outline or registration marks** on the mask; the centre hole's cut line is the only reference. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 225 | **No thinnest-line report**: the Export log could name the thinnest line of a dial; numerals' strokes have no width setting to read it from. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 226 | **Exported files carry no app version** (PDF, SVG, PNG metadata). Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 227 | **The file name gives the dial's size; the page is larger** by twice the margin ("dial-30mm" is a 36 mm page). Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 228 | **Defaults asks for Helvetica Neue**, which isn't bundled: the Type pane says "not loaded" and Inter stands in. A bundled font in the starting values needs a new link scheme number (R31). Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 229 | **No blank start ("New")**: the only reset is Defaults, under Export › Settings file. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 230 | **Per-pane anchors from the app into the guide** (edition 2). The Help link beside the version opens the guide (Okay, 15 Oct 2026: "Help next to beta number same font but underlined"). Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 231 | **Word collisions**: Backdrop (a colour and a switch) · Frame (a colour and a width, Windows) · Size, Size %, Size × · Ring Ø and Ring at % on hands · the opener's ring named Band whose kind is numerals. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 232 | **Phone: with the drawer dragged up, Undo · Redo overlap the Backdrop switch**. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 233 | **Diameter takes 0 and 1000 when typed** (the slider runs 15–50); no limit, no note. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 234 | **While time plays, changes aren't kept**: the address and the browser's copy update only once time stops (autosave restarts its wait on every frame). A link copied from the address while playing is a step behind; a tab closed while playing keeps the old dial only if the page-hide save runs. Reproduced 15 Oct 2026 (`guide/tests/baseline.md`, stall 14) | open |

## From Okay's notes on the dial app (16 Oct 2026)

Okay's PDF *Notes on dial app* (21 pages, text and screenshots; on his Google Drive). Page numbers are the PDF's; "Reading" marks Claude's interpretation.

| # | Item | Status |
|---|---|---|
| 252 | **Nudge's picker**: a small copy of the ring's numerals to click or tap (Okay's notes, p. 6–7). In place: the four number rows on the chosen numeral, sliding one hides the guides; a second press on the dial picks a mark or numeral (#349). With #339 | open |
| 294 | **Off the scale as found** (the specials block's second group): spaces and lines with no figure from Okay — `--nudge` 2, `--btn-pad` 10, `--frame-pad` 8, `--ring-gap` 4, `--foot-gap` 4, the ring line's 8 · 8 · 2, `--name-in` 6, `--chip-gap` 4, `--pop-pad` 16, `--pop-gap` 12, `--guide-gap` 10, `--ring-gap-in` 2, `--logo-disc` 2, `--canvas-inset` 12, the pointer's outline 1.5 and 4, the pointer label's arrow 5 and 2.6. Also bare values left in rules (R32: a value is written once, as a token): the tag's arrow (`top: -6px`, `4f-rings.css`), the pointer label's arrow (`- 10px`, `6-preview.css`), opacities written as numbers (the ruler's 0.4 · 0.85 · 0.6 · 0.38, a dragged ring's 0.45), `calc(var(--unit) / 2)` where `--u1` is meant. For each: put it on the scale (a look change, shown first) or keep it as a special. With the layout check (#188) | open — for Okay to look through |

## From Okay's notes 2 (18 Oct 2026)

Okay's Google Doc *Dial tool notes 2* (text and 23 pictures; on his Google Drive; his drawings `font-selector_171026`, `selected-ring_181026` and `svg/controller 2.svg` are in his Mac's `dial-maker/` folder). Rank: *now* · *next* · *mechanism* · *later*, his order. "Reading" marks Claude's interpretation.

| # | Item | Rank | Status |
|---|---|---|---|
| 316 | **A faster loop** ("Simple html push-pull is where we lose time, efficient solutions solicited. How do people do it?"). `npm test` takes about 9 minutes, GitHub Pages about a minute. Proposal: a quick tier (build, the touched checks, one screenshot) per small change, the full suite once before each live push, pushes batched. Jev is out (Okay, 18 Oct 2026: "Forget about jev. I researched it, not for us") | now | in use — the sketch loop (handoff §4b, 19 Oct 2026): small checks and a private preview page per round, crops in the chat, the full check, docs and version once per push |
| 329 | **Hovering a row lights its part on the picture at the left — "these preview gestures are sitewide"**: the hands have it (the part a number changes, lit in the selected guide's colour while its row is pointed at, focused or its controller open); the rings' rows don't | later | open — rings |
| 339 | **Nudge one numeral more intuitive**: "keep the data and functionality as is, maybe better naming, guiding, visualizing, let's think" | later | open |
| 344 | **Every hand tile exaggerates its shape's features** (the disc hand's tile is right; a window stays inside a disc hand, key `mark_in`) | later | open |
| 346 | **Complications, systematized** — what is left: the moon's own disc (its moon following a drawn path); a big date's two discs in X-ray (the X-ray switch hides on a big date, #373); your own SVG for a complication's picture. In place: one moment (`web/src/moment.js`, `web/test/moment.mjs`) gives the date, weekday, month, AM/PM and the moon's age; five languages EN · TR · DE · FR · IT; the date set in the bar; the discs under the plate seen in X-ray, their edges as guides, physics (a disc's band must end inside the case) as a tick per window; the twelve sketched looks (moon: humps · phase · line; am · pm: sky · half · band; date: neighbours · big date) | later (mechanism first) | open — the rest |
| 349 | **Each marker selectable and editable**: a first press picks the ring, a second the mark or numeral; Nudge works on ticks and markers too, with a shape of its own; the chosen one is outlined on the dial. Left: the numeral's preview at the left with its controls; an SVG for a mark (#50) | later (mechanism first) | open — the rest |
| 358 | **The LINK pill on other linkable pairs** (a window's width and height have it; the mechanism, `LINKED_PAIRS` in `app.js`, takes any two numbers of one ring, hand or window). Candidates: a mark's length × width, a hand's length × width, a disc hand's Ø × hole. Okay, 18 Oct 2026: "Common sense or park for now" | next | parked (brief §8) |

## From Okay's notes on 4.78 (19 Oct 2026)

| # | Item | Status |
|---|---|---|
| 366 | **"Width height linked in name only, no actual locked aspect ratio growing?"** — the big date's pair was missing from the link and is in; rectangle windows checked by mouse and controller. Ask Okay if he still sees it, and where | open — ask |
| 369 | **"The preview gets these wonky orange parts"** (his screenshot: a dauphine with orange slivers) — read as the lit part of #329 stuck on after a tap; it goes off under a finger. Ask if he still sees them | open — ask |
| 373 | **Check 4.70–4.78 end to end; immediate improvements** — the first pass found and fixed two bugs (links' key codes, the hand's handles). Open: the big date's discs in X-ray (#346) | open |

## From the housekeeping audit and Okay's notes after it (19 Oct 2026)

Found by the audit of beta 4.86 (changelog 4.87), and Okay's notes of 14:13 ("These are after the audit").

| # | Item | Status |
|---|---|---|
| 398 | **The stylesheet's values off the scale** (R32; the #294 review, with Okay): 34 literals in rules that are not specials — letter-spacings and underline offsets in em (`h1`, `.atmore`, `.bio a`, `.asnumbers`, `.popvalue input`, `.irisgo`), the ruler's opacities (0.4 · 0.85 · 0.6 · 0.38) and `.dragged`/`.above` at 0.45, `.tinyshut`'s 0.15 s, SVG stroke widths (`.grips .frame` 1 and `.handle` 1.5, `.picked` 3 2, `.paper` 1, `.ruler` 1), the play cap's 12 % hover lift, the mast's 250 % / 70 % sweep, `.pinned` 33 px foot, `--sign-w` 18 on a phone, `--thumb-eye-edge` + 0.75, `.tip svg` − 10; one literal negative margin (`.ringlist .grip`, −4 px: find what the grid is doing instead); the breakpoints 860 / 861 hard-coded in `8-narrow.css` and `4d-hands.css`; five rules styling another part's selector from the wrong file (`4c-rows.css` on the font sheet's fields, `3-controls.css` on `.row > .btnline`, `4f-rings.css` undoing `.detail`'s border, `4b-lines-tabs.css` undoing `.pane`'s top line, `4g-fonts.css` re-skinning `.tab.on`); `--handle` meaning a width token and a JS-set colour; the round-corner canon ("colour things only", `0-order.css`) that the signs, tabs, pills and the Tiny Preview don't follow — settle the canon or the corners. The layout check (#188) is what would hold the line afterwards. | open |
| 399 | **Big date as an option of the Date complication**, not a kind of its own (Okay, 19 Oct 2026, 14:13: "Big date function is an under selection of date function") | **done — 4.88** (a tick under the Date tile; four tiles) |
| 400 | **The windows' discs: X-ray shows what is under, in a stack; minimal graphics on every disc** (Okay, 14:13 and 17:32: "remove stars from nights etc."; the X-ray spec at 17:32) | **done — 4.88** (am · pm: one plain disc, half am and half pm; X-ray: a stack with the selected disc on top at 100 % and a white dotted outline, each layer below 15 % fainter) |
| 401 | **am · pm with a jump on/off** (Okay, 14:13: "am pm gets a jump function on/off"): snaps at noon and midnight, or sweeps | open — on the one disc of 4.88 |
| 402 | **The bar's date: click to edit in a popup**, with − and + for the date and the time both (Okay, 14:13: "Date on the black bar is click to edit on popup. Plusminus for both. No controller") | **done — 4.88** (the popup in Dial Pop, Barlow Regular; − + for the day and the hour; the day opens the system picker) |
| 403 | **Playwright 1.56 → 1.64**: the window test's measured values (e.g. the font sheet's "184 64 -1 183") come from this Chromium build; bump it in a session of its own, re-measure, save the look again (`same.mjs save`) | open |
| 404 | **Dauphine and leaf hands: hubs as on a real movement** — the connecting circles where the hand meets the cannon pinion, life-accurate (Okay, 19 Oct 2026, 17:43: "dauphin and leaf get life accurate movement connecting circles"); refines #370's plain hub for these two shapes | open — next |
| 405 | **SVG inserts: a blank template file** — a downloadable SVG with guides and registration dots (the artboard's centre, the 12 o'clock line, a hand's pivot, a marker's box) so a drawing made on it imports editable and in place; one template per place an SVG can go (a hand, a marker, a window picture, a logo). The plan for every SVG upload (#50, #72, #173, #346), noted for when they are built (Okay, 17:43: "give the user a blank file with guides and dots to stick to make things editable and such. For the future, note under all svg upload available areas") | open — later, with #50 |
| 406 | **Moving away from a slider makes it finer**: while a slider is held, the farther the pointer or finger moves from the track (up or down), the smaller each step along it — fine-tuning without a controller (Okay, 17:43: "Moving away from slider increases accuracy: build soon") | open — soon |
| 407 | **The window test in sections that stand alone** — `test/window.mjs` is one script whose later checks use what earlier ones set up; restructure it so each section sets up and restores its own state, then `node test/window.mjs --only hands,bar` runs the sections a change touches (~1 min for a small push, R19); the full run stays for a step. Meanwhile `npm run small` skips parity and Wear OS and runs the icon check only when an icon changed (`icons/changed.mjs`, 4.88.1). Also: the full run on two Chromiums at once (~3 min), and the screenshots on the full run only (Okay, 19 Oct 2026, 17:46–17:54: "Compiling and updating takes too much time … Only filter makes more sense now. Memory stuff makes sense too") | open — next |
| 408 | **The font box's head**: its colour as a full swatch pill with the hex, as the colour rows have; the font name 2 px larger, growing from its baseline and its left edge — nothing else in the box moves (Okay, 19 Oct 2026, 18:08, a picture of the box: "color here gets full swatch with hex. Font name 2px bigger but nothing else moves, just text gets bigger, grows snapped to baseline and left") | open — look lane |
| 409 | **Tick rows and the Show tick** (Okay, 19 Oct 2026, 18:00: "align first line with tick sign. Try not having orphans, limit text to two lines or explain more to fill the second line … 'Show tick' in white gets bigger, black box stays the same. These are rules now") — design canon §6, §7 | **done — 4.88.2** |
| 410 | **A window's colours one to a line; Neighbours on by default, for every link** (Okay, 18:04) | **done — 4.88.2** |

## From Okay's notes 3 (19 Oct 2026)

Nine annotated screenshots under *Notes 3* in Okay's Google Doc *Dial tool notes* (the session's notes doc, read at the start of each round). Red = change, green = keep, blue = his reading of the words.

| # | Item | Status |
|---|---|---|
| 411 | **The hand's selection: drop the orange handles and the dotted box** — "Thick selection indicators faulty at times. Abort this type. Find 'highlighting active sides' kind of simple solution please." Reading: the side a row changes is lit (#329's lighting), no grips drawn | sketch — on the preview (the sides lit as a line on the outline; the squares and the box gone; a side's reach unseen, its cursor says the way) |
| 412 | **The bar's date popup** — "Popup larger overall"; "Remove time" goes; "drop down for each item"; "size fixed, no movements by change in content" (the box keeps its width whatever the date reads). Okay, 19:31: "Minus moves next to plus, dropdowns just for groupings" — − and + together at the right, a dropdown per group | sketch — on the preview (one line, menus, − + together, the time line gone, 15 % larger, fixed size) |
| 413 | **A window's three ticks at the end of its column** (Follows the date in the bar · Its neighbours show… · Its disc stays inside the case); "Last two sliders come in their place. All on by default" | approved (Okay, 19:47) — open: *Follows the date* on for old links too? |
| 414 | **The bar: "1 px gap?"** left of the time box, and "Why? fill with grey, worst colour" at NOW | sketch — NOW outlined as the bar's boxes; the 1 px gap not found (5.5 px measured): ask for a picture |
| 415 | **A window's font gets its own section and eye** — "Font needs own section & eye" | approved (Okay, 19:47) |
| 416 | **A window's sub-tab: "Show" hidden until …**; "Window at 6" loses "Window". Okay, 19:31: hidden until "the tab is picked" — only the picked tab shows its Show | approved — as R16: a pane whose rows all don't apply goes |
| 417 | **Positions: the picture as tall as its controls** — the green box from the top rule to the bottom rule, the circle grown to it | approved (Okay, 19:47) |
| 418 | **Resize from: Baseline and Ascender out, "from the functions as well"**; Centre · Outer edge · Inner edge stay. Inconsistent with #13 (five anchors): #13 to be read as three | approved (Okay, 19:47) |
| 419 | **"Resize Ring From"**: the head reads *Resize Ring From* with the anchor's menu at its right; the row keeps the slider and the number | sketch — "Resize Ring" · *from* · the menu stretched (Okay, 19:47) |
| 420 | **A tick says its name; its meaning a note under it, in one box** — design canon §6 (Okay, 19:47 and 20:00: "I like b … hiding the white line … applies to small grays too … within the same box that ends with a bottom white border"). Big date, Follows the date, Neighbours, Inside the case split; every note small and grey, no line above it | sketch — on the preview |
| 421 | **Keep a hand's details in the lit picture** — the dauphine's connecting dot (Okay, 20:02: "Let's do not lose details such as dauphine's connector dot, we might make it larger too if we want"); with #404's hubs | open — note |
| 422 | **Two *Frame* rows in a window's Shape pane** (its colour, its width) now stand near each other: *Frame width*? | open — ask |

## Dial Packer (side product, 19 Oct 2026)

`packer/`; how it works: `packer/README.md`.

| # | Item | Status |
|---|---|---|
| 394 | **Dial Packer shipped**: discs only, A4 landscape, Grow · Even gaps · Voronoi, Big to centre, corners, sides, palettes, mosaics (Okay, 14:34: "Ship as a side product. Dial packer for visuals.") | **done — 19 Oct** (online at `/packer/`) |
| 395 | **Place dials in the discs** (Okay, 01:36: "I will announce when to cross to placing dials"): each disc gets a dial from the Gallery or made in the app; colours from the packer's palette | **waiting for Okay's word** |
| 397 | **Colour mosaic with Centre → edge goes by lightness alone** (14:42: "a step always has similar value lightnesses so center dark, outside light. Invert possible"): each step one lightness shared by every colour (step 1 at the palette's mean, the last To white % of the way to white), hues mixed within a step; Invert switch. **Opening settings** (14:42): both mosaics on, Palette, Centre → edge, 1 large · 10 medium · 20 small, five colours purple → reds → orange | **done — 19 Oct** |
| 396 | **With the large discs off the sides, the band between them and an edge can stay thin and white** when few small discs land there (seen on 1 of 6 seeds) | noted |

## Later

| # | Item | Status |
|---|---|---|
| 17 | Variation grid sheet | open |
| 18 | Spec sheet with dimension callouts | open |
| 19 | More hand styles: cathedral (through file import, #50); lume plots | open |
| 20 | Subdials (small seconds, chronograph registers) | open |
| 21 | Plotter output for the pen plotter via LightBurn | open |
| 33 | Surface finishes on bands: sunray, grain, guilloché (Okay: flat for now) | open |
| 35 | Per-ink separations: one production mask per ring colour | open |
| 362 | **An Apple Watch preview** (Okay, 18 Oct 2026: "Future feature, some kind of preview for apple watch?"): a sibling of the Wear OS export (Export → Wear OS) — at least the dial in an Apple Watch's frame; a real watch face is not open to third parties on watchOS, so a preview or a photo face is the likely reach (to research) | open |
| 363 | **Non-round dials: square, rectangle, rounded rectangle, diamond** (Okay, 18 Oct 2026: "And all that would bring to previews and functions. At the end of the future list"): every ring, window, case, export and preview measured from a circle today | open — last |

## Parked

| # | Item | Status |
|---|---|---|
| 61 | **Editing on the preview**: movers and shifters drawn on the dial itself, e.g. spread the numerals. Models named by Okay: Illustrator's radial Repeat tool and its Gradient tool. The panel keeps the detailed settings; the handles are the quick way. In place: the selected ring's radius, size, start and span handles and a hand's length, tail and width handles (#345). Okay, 11 Oct 2026: "Park now" | parked |
