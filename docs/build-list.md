# Dial Tool — build list

Numbered, never renumbered. Status: **open** · **verify** · **done** · **parked**.
*Last updated 13 Oct 2026 (atlas review: #78–#91 added, #59 settled, #53 corrected). Before: 12 Oct 2026 (beta 4.6: #70, #71 built; beta 4.5: #70–#75; #32 moved to the web version). Before: 11 Oct 2026 (web version: #49–#56; MP4 fix: #48). Before: 4 Oct 2026 (beta 2.3: preview plan built, #37–#41 were waiting for the Mac check, `docs/preview.md` §6 — set aside by Okay the same day, see #40). Seen working on Okay's Mac 4 Oct (beta 2.1 screenshot): window, sections, ring list, ring settings list, regular-size controls, live popups, type per numerals ring with feature names.*

## Verify on a Mac

| # | Item | Status |
|---|---|---|
| 1 | Window opens; section switcher (Dial · Rings · Hands · Date · Export) shows each section; rows hide/show as settings change | done (4 Oct) |
| 2 | Number controls: slider, typed field (incl. `+`, `x`, `/`), stepper stay in sync | verify |
| 3 | Type (per numerals ring): family box, style, named instance (try Skia), axis sliders appear/disappear per font | verify |
| 4 | OpenType feature list toggles change the numerals; designer names show where the font has them | verify |
| 5 | Zoom and place survive redraws; Fit resets — *canvas: kept in Python, checked in the smoke test; PDF preview: as before* | verify |
| 6 | Play runs; Stop stops; closing the window stops it; Play keeps running while a slider is held (beta 2.3, frame clock) | verify |
| 7 | Button bars register which button was clicked (Export, Settings, ring tools, Reset nudge) | verify |
| 8 | Export PDF / SVG / PNG / MP4 / GIF; check SVG and PDF open at true size in Illustrator | verify |
| 48 | MP4 · GIF at **Clip size px** (`out_px`, beta 2.3, 11 Oct): export an MP4 of a 33.5 mm dial (it failed before: odd pixel count); the log says `… · 1080 × 1080 px`; the file plays. GIF at the same size — is it too heavy? | verify |
| 9 | SVG import: a marker and three hands drawn in Illustrator (pointing up, anchor at artboard centre) | verify |
| 10 | Save / Load / Defaults; last session restored after quitting DrawBot | verify |
| 11 | Eastern Arabic and Chinese labels render (font fallback) | verify |
| 23 | beta 1.0.1+: Export log shows `all controls connected`; popups open with live items and change the dial; checkboxes, segmented controls, colour wells, text fields respond | done (4 Oct) |
| 24 | Ring list: add each kind, select, rename, hide (checkbox), duplicate, delete, ↑ ↓; changing a ring's kind keeps its settings | verify |
| 25 | Ring settings list: right rows per kind; Nudge and Type only for numerals; axis rows follow the font | verify |
| 26 | Two numerals rings with different fonts; the Type rows follow the selected ring; the date uses the top numerals ring's type | verify |
| 27 | Skip where / knock out behave as named; clearance; the date window clears every ring | verify |
| 28 | Bands: full ring, sectors (count, every, fill %), pie (band width ≥ radius), partial span | verify |
| 29 | Hands: Hour · Minute · Seconds picker; every shape; tip, head/ring/disc, hollow wall, counterweight, colours | verify |
| 30 | PDF and AI import (AI saved PDF-compatible) for a marker and three hands; fit to length, size ×, width ×; white shapes cut; the log notes skipped text or images | verify |
| 31 | A beta 1.0 last session or preset opens as rings and looks the same | verify |
| 36 | beta 2.1: the ring settings list starts at the top, scrolls, and shrinks when rows hide; regular-size controls and labels fit; tab titles left; Guides checkbox works from every section | verify |

## Next

| # | Item | Status |
|---|---|---|
| 12 | Production limits per method: minimum line width and clearance; warn in the preview | open |
| 13 | Numeral vertical alignment option: glyph bounds (now) vs cap height / baseline | open |
| 14 | Heavy modes (knockout + 300 ticks ≈ 140–170 ms off-Mac): redraw on mouse-up if dragging feels slow. *4 Oct: DrawBot's shape combining is 2–14× slower than the harness's (`tools/bool_bench.py`, `docs/preview.md` §2.4) — beta 2.3 has the frame clock and skia-pathops: decide after the Mac check (#40) whether this is still needed* | open |
| 15 | Fallback-font control for scripts the main font lacks (depends on #11) | open |
| 16 | Live-text export option alongside outlines (beta 2.2) — verify: export PDF and SVG with it on, open in Illustrator with the font installed | verify |
| 37 | **Preview: canvas.** Core Animation layers drawn from one scene shared with export; pinch / two-finger pan / ⌘-scroll zoom, Fit; sharp during zoom; no flash (`docs/preview.md` §3.1–3.2) | verify (beta 2.3) |
| 38 | **Preview: frame clock.** Controls request a frame; a display-synced clock draws at most once per frame; Play runs on it, also while a slider is held (§3.3) | verify (beta 2.3) |
| 39 | **Preview: Canvas · PDF switch** (`ui_preview`), PDF as fallback and reference (§3.5) | verify (beta 2.3) |
| 40 | **Preview: Mac check** — `docs/preview.md` §6, steps 1–10 | **set aside** — Okay, 4 Oct: "No mac check. Trust as if." beta 2.3 is treated as working; reopen on the first screenshot or log that says otherwise |
| 41 | **skia-pathops** for shape combining, installed through DrawBot's package menu on each Mac (§3.6) — Okay: yes, 4 Oct. Log must say `shape combining: skia-pathops …` on each Mac | verify (beta 2.3) |
| 42 | Smoke test: stand-ins for Quartz / Core Animation, a driven frame clock, canvas and zoom checks (§5.2) | done (4 Oct) |
| 43 | Guidebook window: the screenshot is gone; the window is redrawn from `dial.py` (design canon §6). Compare the drawing with the real window on the Mac once: proportions, row order, control looks | verify |
| 47 | Design canon §8, ideas for the tool's window: tabular figures in number fields; grey + orange guides; presentation sheets on the canon's grid. Ask Okay | open |
| 45 | Classic dial presets (`docs/guide/presets/`): load each on the Mac — fonts DIN Alternate, Futura, Helvetica Neue, Bodoni 72 resolve; compare with the guide's pictures | verify |
| 46 | Date window on a dark plate: frame and day share one Print colour, so a light frame means a light day on the white disc. Separate colours? (found drawing the diver) | open |
| 44 | Canvas: show the page edge (dial + margin)? The canvas fills the whole preview with the backdrop; the PDF preview shows the page. Ask Okay after the Mac check | open |
| 32 | Scale the whole dial (rings, hands, date) when the diameter changes, or a "scale everything" action (brief §5.7) | → web version, #70 |

## Web version (beta 4.6, 12 Oct 2026)

| # | Item | Status |
|---|---|---|
| 49 | **Installed fonts on Okay's Intel Mac** — 11 Oct: Chrome listed nothing (page opened from a file in Downloads; cause unknown: not allowed for file pages, blocked in Chrome's site settings, or an extension). The page now says what happened under the buttons: get that line from Okay. If file pages can't be allowed, serve the tool from a web address (#55). Then the rest of the first run, in Chrome: open `web/dial-tool.html`; load a settings file; Rings → a numerals ring → Type → *Installed fonts* (Chrome asks once) → the numerals turn from Inter to Helvetica Neue. Compare with `dial.py`'s export of the same settings. Export PDF and SVG, open in Illustrator at true size. | verify |
| 50 | Imported shapes (SVG, PDF, AI) for markers and hands — not in the web version; a "file" shape is drawn as a bar or baton and the log says so. In a browser the file's content has to travel inside the settings (no file paths). | open |
| 51 | MP4 and GIF export (WebCodecs) | open |
| 52 | Live text in PDF · SVG; named instances of variable fonts; a fallback font for scripts the main font lacks (Eastern Arabic, Chinese: HarfBuzz has no automatic fallback, CoreText had) | open |
| 53 | **Better interface overall** — Okay, 11 Oct: "better ui overall, learn and implement. Move delete layers, export better." Research first (how good parametric tools lay out lists, inspectors and export), then propose. Includes: undo, an export panel that shows what will be written. (Drag to reorder rings: done 11 Oct.) 13 Oct: the ring list's rows are #78; the atlas's other interface patterns (section 4 and 6) are not picked. | open (Okay: later) |
| 54 | **Use it through Claude (MCP)** — Okay, 11 Oct: "can we attach an mcp to that, so someone can use over claude?" `web/src/geometry.js` and `output.js` run in Node without a window (the parity test does it), so a small server could offer: read and change settings, list fonts, return a PNG / SVG / PDF. Decide: local (runs on the user's computer) or hosted. | **dropped** — Okay, 11 Oct: "No need for mcp since we are on github." |
| 55 | Online at <https://duztman.github.io/dial-tool/> — Okay, 11 Oct: "can I get it online somewhere? Under GitHub?" The `gh-pages` branch holds `index.html` (a copy of `web/dial-tool.html`); pushing the branch switched GitHub Pages on. Seen live 11 Oct. To update: copy the new build to `index.html` on `gh-pages`, commit, push. | done (11 Oct) |
| 57 | **Look at it on Okay's Mac**: everything added on 11 Oct after the first screenshot was only seen in Chromium here — font picker, examples, pointer label, tabs, Guides, dragging rings, four windows. | verify |
| 58 | Peter Wiegel's fonts (peter-wiegel.de: alte DIN 1451, DIN 1451 Breitschrift 1936, DIN 1451 Form H): read the licence file in each download; if it allows passing on, swap them into the list of 20 | open |
| 59 | Windows: am · pm and moon phase follow settings (hour, moon age), not the time shown; a day window is as wide as its Width, not its word. A window's shape is upright at every position. Ask Okay what he wants here. **Settled 13 Oct** (brief §4): am · pm follows the time shown → #79; moon age stays a setting; a day window stays as wide as its Width; turning a window with its radius → #82 | settled → #79, #82 |
| 56 | Remembered fonts: fonts added from a link are remembered (11 Oct); font files added by hand are still forgotten when the page closes | open |
| 60 | Add fonts by Google link: try it on the real page (it was tested against local copies of the same paths). A dial opened from a link could fetch a missing Google family by its name by itself — not done: every unknown font would cost three failed requests | verify / open |
| 62 | OpenType tiles, grouped (web version): features that have a name of their own first; the numbered sets (`ss01`…, stylistic sets) and (`cv01`…, character variants) each in a group below. A note from Okay, 11 Oct 2026, while he marks up screenshots of the whole panel. Done in beta 4.0 | done |
| 63 | **Live text in the PDF** (web version). The SVG keeps numerals as text since beta 4.0; the PDF is written by hand (`web/src/output.js`), so live text there means building the font into the file. Okay, 11 Oct: "SVG now, PDF later" | open |
| 64 | **Panel (beta 4.0), bar, speeds, Guides switch (4.1), day steps and margins (4.2), dark bar and framed rings (4.3): look at them on Okay's devices** — columns, eyes, rename box, picture tiles, colour picker, grouped OpenType tiles, Export rows, the panel put away. Only seen in Chromium here. Ask: keep the square in the bar that hides the panel? Are the picture tiles the right pictures? | verify |
| 67 | **Beta 4.4 on Okay's devices**: sliders (disc 18, track 4 — say bigger or smaller), square tick boxes, panes sliding, the paper-light cards and log on the grey, pane headings at 13. **Open the PDF in Illustrator: does each part arrive as a named layer?** (Layers are written as PDF "optional content"; read back here with MuPDF and qpdf only.) Place the PNG in InDesign: true size? | verify |
| 68 | File names: `dial-30mm-2026-10-12.pdf` (diameter and day; a mask says `-mask`, `-mirrored`). Asked Okay, 12 Oct: this, or a name field for the dial? No answer yet | open |
| 69 | Review, 12 Oct, found and not done: split `web/src/app.js` (one class, 1,800 lines; the colour picker alone is 85 lines inside `build_row`); scrollbars that take room (macOS "Show scroll bars: always") would make the scrolling rows about 15 narrower than the pinned ones — not reproduced here, ask Okay what his Mac is set to; `main` has no `web/` though the tool is online from `gh-pages` | open |
| 70 | **Scale the contents with the diameter** (step 2): a toggle under Diameter, off by default. On: every mm value follows (radii, widths, lengths, type size, windows, clearances); angles and counts don't. Scale from the values at the start of the drag, so repeated dragging doesn't drift. Okay, 12 Oct: "Size change needs (scale innards as well) toggle". Built in beta 4.6: look at it on Okay's devices; is the list of what scales right (the page margin doesn't)? | verify |
| 71 | **A colour per sector** of a band ring (step 2), and a **Colours pane** on Dial listing every coloured part. A new ring key; empty = the ring's colour, so old links draw as before (R31). Okay, 12 Oct: "pies, rings. All get individual color controls" → "Each sector its own". Built in beta 4.6 (`cs`, Sector colours in Rings, Colours in Dial): look at it; open the PDF and SVG of a two-colour band in Illustrator | verify |
| 72 | **Logo** (step 3): an SVG placed on the dial with the mouse; it is also a ring, edited in Rings "differently"; a link from the Dial pane goes to it. Its file's content travels in the settings (see #50). Ask Okay before building: its colours (he first wanted an SVG's colours adjustable), scale and rotation, whether a link can carry it | open |
| 73 | **Background image** on the plate: only the button exists (Dial pane, says "Not built yet"). When built: PNG, scale · rotate · move · opacity, *Include in export*; not in a link; R4 needs an exception. Okay, 12 Oct: "No background image functionality now. Just the button" | parked by Okay |
| 74 | **Beta 4.5 on Okay's Mac and iPad**: row lines (white on grey — enough contrast?); the Guides switch on the preview and its list; the eight guide colours at full strength on his dials; the colour pop-out: where it opens, dragging, widening, the field and strip under a finger, the one line of values. Ask: are the palette's ten his ten? Should the palette's − be there? | verify |
| 76 | Units box (mm · pt · in · lig): ask Okay — keep lignes as the fourth unit? Should sliders and steppers step in the shown unit (they step in mm)? | verify |
| 77 | **Persistent groupings for every section** — proposed 12 Oct; Okay: "Persistent lines are scary for me too. Sucks to have no left view height, especially on rings on iPad… Park for now." Only All hands is pinned. Built instead: main selectors on heading lines. Open: a way to give Rings its height back on an iPad (see #65) | parked by Okay |
| 75 | Usability review, the other tabs: Rings · Hands · Windows · Export, one at a time (Okay, 12 Oct) | open |
| 65 | Rings on a low window: the pinned part (list + the ring's first pane) is taller since beta 4.0, leaving less to scroll. If it bothers: pin only the list | open |
| 66 | Tabs and the columns: five tabs share six columns, so they sit between columns (Okay, 11 Oct: "Columns? They fit 'em"). Ways: tabs one column each with the sixth free, or a sixth sign. Ask Okay | open |

## From the atlas review (13 Oct 2026)

Atlas: https://claude.ai/artifact/QdvVC37Y6csV7FcUjJHqAH. Numbers in brackets are the atlas's entries. Order: brief §4, 13 Oct — Okay has confirmed the first phase (docs) only; the rest is Claude's proposal until he says go, phase by phase.

| # | Item | Status |
|---|---|---|
| 78 | **Ring list rows with a summary** [4.1]: after a ring's kind, two or three of its values (count, radius, size…), the row still one line high; long names are cut. Stylesheet: R32 | open — Now 2 |
| 79 | **am · pm follows the time shown** [2.6]. The window reads the time, not its *Hour of the day* setting (key `hour` stays, R8). Time is twelve hours today (`t` is taken mod 43200): the bottom bar needs an AM · PM switch and *Now* must keep the real hour. **Ask before building:** an am · pm window in an old link would draw from the time instead of its `hour` (R31) — always follow, or a tick that is off to start? Okay's answer of 13 Oct, "switch on windows on via a small analog on the menu", is not understood yet: ask what it means | open — Now 3, ask first |
| 80 | **Labels that start again** [1.8 Ferguson, 1.11 two-hour track]: Numerals → Numbers gets *Start again after n positions*, 0 = off (a new ring key; off draws as before, R31). Ferguson: from 0, step 1, again after 10. Two-hour track: count 24, from 5, step 5, again after 12 | open — Now 4 |
| 81 | **Gallery**: a section of its own under everything else in Export, 10–15 example dials (Okay, 13 Oct). First ones, all drawable today: B-Uhr Baumuster B [1.9], 12 + 24 hours [1.10], MIL-PRF-46374 Type III [3.4], Montgomery as two numerals rings [1.7]; then world time [1.15] and a diver's bezel drawn as outer rings on a larger plate [1.13] ("the user might hack things for creativity and this is one"). The four ways a window meets the rings [2.9] need nothing built | open — Now 5 |
| 82 | **Window shape**: one Shape pane for every window, apart from what it shows: rectangle · circle · polygon (sides) · arch (the moon's) · arc (a day window at 12 [2.8]), one Corner value; a moon phase window may be a plain rectangle or circle [2.5, Okay's note]. With it: a 4 o'clock position (appended, R9), *Turn the window with its radius* [2.1] and *Turn the digits with it* [2.3]. Old windows draw as before (R31) | open — Next |
| 83 | **Positions law** [1.1]: a selector on the Positions heading line: even · reciprocal · logarithmic · table · squeeze toward an angle [7.15]. Only `ring_angles()` changes. Tachymeter [1.2] = reciprocal with base, from, to, step; one ticks ring per stretch of steps. Depth cartouches [1.14] = table, typed as angle and label pairs. To decide when it is built: Count hides where the law sets it (R16); what "a partial span marks both ends" means per law; a table brings its own labels | open — Next |
| 84 | **Jog** [7.19]: step the time by a minute from the bottom bar. The shuttle half exists (1× · 60× · 720×) | open — Next |
| 85 | **Hand tip to a ring's edge** [7.13, Max Bill]: a button in Hands → Size that sets Length once. A lasting link would need rings to have identities; they are a list that is reordered | open — Next |
| 86 | **Big date** [2.7]: a fifth window kind (appended, R9): two cells; bar, frame or none | open — Later |
| 87 | **Registration marks** [3.7]: the same two marks in the page margin of every production file. With per-ink masks (#35); needs a line in R5 / R26 | open — Later, with #35 |
| 88 | **Weight** [6.19]: one value in Dial that multiplies every width on the dial, applied like Scale everything (#70) so the panel's numbers stay true | open — Later |
| 89 | **Movement numbers**: a *Size from movement* menu for windows [2.2] and the dial feet as a sixth kind of guide [3.8]. Blocked: only Sellita's two window sizes were read from a source (SW200-1 2.00 × 2.70 mm, SW400-1 2.40 × 3.24 mm); Ronda's are inferred, NH35 and Miyota drawings were unreadable; feet positions depend on the movement (brief §5.1). Okay opens the drawings on a Mac first | open — Later, blocked |
| 90 | **A ring edited flat** [7.16, Fischinger]: cut at 12, edited as a strip, rolled back. A second way to show the preview; close to #61 | parked (Claude's proposal) |
| 91 | **A sliding strip for Count** [7.5, Citroën GS]: a new kind of number control; R15 would need an exception, and Count has a typed field and a stepper | parked (Claude's proposal) |

Not checked, 13 Oct: R25 says the guidebook follows each release and is drawn by `dial.py`, which is frozen (R30) — does the guide cover the web betas (3.0 to 4.6), and what should R25 say now? Ask Okay.

## Later

| # | Item | Status |
|---|---|---|
| 17 | Variation grid sheet | open |
| 18 | Spec sheet with dimension callouts | open |
| 19 | More hand styles: pencil, syringe, Breguet done in beta 2.0 (plus arrow, lollipop); cathedral via file import; lume plots still open | open |
| 20 | Subdials; day/date apertures. (Sectors and zones: done as band rings, beta 2.0.) | open |
| 21 | Plotter output for the pen plotter via LightBurn | open |
| 33 | Surface finishes on bands: sunray, grain, guilloché (Okay: flat for now) | open |
| 34 | Date window: its own font (now the top numerals ring's type) | open |
| 35 | Per-ink separations: one production mask per ring colour | open |

## Parked

| # | Item | Status |
|---|---|---|
| 22 | Mac folder set-up (Okay will ask) | parked |
| 61 | **Editing on the preview** (web version): handles, movers and shifters drawn on the dial itself, e.g. drag a ring's radius or size, spread the numerals. Models named by Okay: Illustrator's radial Repeat tool and its Gradient tool. The panel keeps the detailed settings; the handles are the quick way. Okay, 11 Oct 2026: "Park now" | parked |
