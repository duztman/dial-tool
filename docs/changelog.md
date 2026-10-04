# Dial Tool — changelog

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
- **Rules:** R26 (one scene), R27 (our own Cocoa classes), R28 (nothing renders inside a callback).
- **Design canon** (`docs/design.md`, R29): type, grid, colour, pictures and redrawn controls, after Braun's printed matter and Lupton's *Thinking with Type*, with what was read and what is only recalled.
- **Guidebook, third edition** (25 pages, A4 landscape): one sans (Inter), four sizes; a dark cover with contents; figures hang from one line and text stands on the bottom margin; the whole window redrawn in grey at true proportions from `dial.py`'s own measurements; a figure for the features that can be drawn, and nine classic dials (field, diver, dress, pilot type B, California, station clock, Bauhaus, sector, gauge) each printed with the settings that draw it. The classics are also presets: `docs/guide/presets/*.json`. Source is now `docs/guide/guide.html` + `tools/guide_dials.py` (was `guide.md`); R25 updated.

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
