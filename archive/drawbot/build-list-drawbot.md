# Dial Tool — the DrawBot version's build-list items (archived)

Moved here 19 Oct 2026 (beta 4.87). dial.py is frozen (R30); none of these will be done.

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
| 37 | **Preview: canvas.** Core Animation layers drawn from one scene shared with export; pinch / two-finger pan / ⌘-scroll zoom, Fit; sharp during zoom; no flash (`archive/drawbot/docs/preview.md` §3.1–3.2) | verify (beta 2.3) |
| 38 | **Preview: frame clock.** Controls request a frame; a display-synced clock draws at most once per frame; Play runs on it, also while a slider is held (§3.3) | verify (beta 2.3) |
| 39 | **Preview: Canvas · PDF switch** (`ui_preview`), PDF as fallback and reference (§3.5) | verify (beta 2.3) |
| 40 | **Preview: Mac check** — `archive/drawbot/docs/preview.md` §6, steps 1–10 | **set aside** — Okay, 4 Oct: "No mac check. Trust as if." beta 2.3 is treated as working; reopen on the first screenshot or log that says otherwise |
| 41 | **skia-pathops** for shape combining, installed through DrawBot's package menu on each Mac (§3.6) — Okay: yes, 4 Oct. Log must say `shape combining: skia-pathops …` on each Mac | verify (beta 2.3) |
| 42 | Smoke test: stand-ins for Quartz / Core Animation, a driven frame clock, canvas and zoom checks (§5.2) | done (4 Oct) |
| 43 | Guidebook window: the screenshot is gone; the window is redrawn from `archive/drawbot/dial.py` (design canon §6). Compare the drawing with the real window on the Mac once: proportions, row order, control looks | verify |
| 45 | Classic dial presets (`docs/guide/presets/`): load each on the Mac — fonts DIN Alternate, Futura, Helvetica Neue, Bodoni 72 resolve; compare with the guide's pictures | verify |
| 44 | Canvas: show the page edge (dial + margin)? The canvas fills the whole preview with the backdrop; the PDF preview shows the page. Ask Okay after the Mac check | open |
