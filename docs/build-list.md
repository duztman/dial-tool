# Dial Tool — build list

Numbered, never renumbered. Status: **open** · **verify** · **done** · **parked**.
*Last updated 4 Oct 2026 (beta 2.2). Seen working on Okay's Mac 4 Oct (beta 2.1 screenshot): window, sections, ring list, ring settings list, regular-size controls, live popups, type per numerals ring with feature names.*

## Verify on a Mac

| # | Item | Status |
|---|---|---|
| 1 | Window opens; section switcher (Dial · Rings · Hands · Date · Export) shows each section; rows hide/show as settings change | done (4 Oct) |
| 2 | Number controls: slider, typed field (incl. `+`, `x`, `/`), stepper stay in sync | verify |
| 3 | Type (per numerals ring): family box, style, named instance (try Skia), axis sliders appear/disappear per font | verify |
| 4 | OpenType feature list toggles change the numerals; designer names show where the font has them | verify |
| 5 | Zoom and scroll position survive redraws; Fit resets | verify |
| 6 | Play (macOS timer) runs; Stop stops; closing the window stops it | verify |
| 7 | Button bars register which button was clicked (Export, Settings, ring tools, Reset nudge) | verify |
| 8 | Export PDF / SVG / PNG / MP4 / GIF; check SVG and PDF open at true size in Illustrator | verify |
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
| 14 | Heavy modes (knockout + 300 ticks ≈ 140–170 ms off-Mac): redraw on mouse-up if dragging feels slow | open |
| 15 | Fallback-font control for scripts the main font lacks (depends on #11) | open |
| 16 | Live-text export option alongside outlines (beta 2.2) — verify: export PDF and SVG with it on, open in Illustrator with the font installed | verify |
| 32 | Scale the whole dial (rings, hands, date) when the diameter changes, or a "scale everything" action (brief §5.7) | open |

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
