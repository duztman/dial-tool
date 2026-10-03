# Dial Tool — glossary

What each word means **in this project**. Turkish where it's the common trade word.
If a term is used differently in conversation, ask, then update this file.
*Last updated 4 Oct 2026.*

## Watch terms

| Term | TR | Meaning here |
|---|---|---|
| **Dial** | kadran | The printed or etched plate under the hands. In the tool: the *plate*, its print and the date aperture. |
| **Plate** | | The dial disc itself (setting `dial_d`, colour `c_plate`). |
| **Movement** | mekanizma | The mechanism behind the dial. Not chosen yet; it will fix dial size, hand lengths and date position. |
| **Hour / minute / seconds hand** | akrep / yelkovan / saniye ibresi | |
| **Tail** | | The part of a hand behind the pivot (`ha_tail`, % of hand length). |
| **Counterweight** | | The disc on the seconds hand's tail (`ha_counter`). |
| **Cap** | | The disc over the pivot (`ha_cap`). |
| **Track** · minute track · chapter ring | | The ring of minute ticks round the edge. In the tool always **track**. |
| **Tick** | | One mark of the track. Minute ticks, plus **fine** ticks when divisions > 60. |
| **Divisions** | | How many ticks the track has: 60, 120, 240, 300 (300 = fifths of a second). |
| **Railroad** | | Two thin rails along the track's edges, ticks between them (`tr_rail`). |
| **Marker** · index · hour marker | endeks | The mark at each hour. In the tool always **marker**. |
| **Numeral** | | The hour label: Arabic, Roman, Eastern Arabic, Chinese, words, custom. |
| **Date window** · aperture | takvim penceresi | The hole that shows the date disc. **Aperture** = the hole itself; **frame** = the printed border around it. |
| **Beat** | | Steps per second of the seconds hand: sweep (smooth), quartz 1/s, 6/s (21,600 vph), 8/s (28,800 vph). |
| **Applied** vs **printed** | | Applied = separate metal parts fixed on the dial; printed = ink or etch. The tool draws printed elements; applied ones can be drawn as their outline. |

## Tool terms

| Term | Meaning |
|---|---|
| **Rank** | Every position on the track asks "what is the biggest division I belong to?" — twelve › hour › minute › fine. |
| **Collision rule** | What happens where a tick and a marker share a position. **One ring**: the marker replaces the tick and sits on the track's outer edge. **Skip**: the marker replaces the tick, placed by its own offset. **Knockout**: both drawn, the tick cut back around the marker by the *clearance*. **Stack**: both drawn, overlapping. |
| **Clearance** | The gap knocked out around a marker (knockout) and around the date aperture. |
| **Offset** | Distance from the track's inner edge to a marker's outer end (negative = overlapping the track). |
| **Taper** (inner width ×) | A wedge's inner width as a fraction of its outer width. 0 = triangle, 1 = bar, >1 = wider inside. |
| **Round outer / inner** | Corner radius at a marker's outer or inner end; true fillets, any angle. |
| **Hollow wall** | Turns any marker into an outline of that thickness (a dot becomes a ring). |
| **Placement** | How numerals sit: **upright** (always level) · **radial** (turn with the circle) · **radial, auto-flip** (never upside down) · **on path** (letters follow the circle, kerning kept). |
| **Nudge** | A per-numeral correction: radius ±, angle ±, rotate, size ×. |
| **Production mask** | Export mode: everything printable in solid black, no plate, no hands, aperture as an outline. |
| **Mirror** | Flips the output for toner transfer. |
| **Guides** | Thin blue construction circles in the preview; never exported. |
| **Backdrop** | The preview's background colour; never exported. |
| **Section** | One page of the left panel: Dial · Track · Markers · Type · Numerals · Hands · Date · Export. |
| **Number control** | Label · slider · typed field · stepper, all showing one value. Typed shorthand: `1.2` set, `+0.5` add, `x0.5` multiply, `/2` divide. |
| **Settings** (`S`) | One dictionary holding every value; saved as JSON (presets, last session). |
| **Static geometry** | Everything that doesn't move (plate, track, markers, numerals, date). Rebuilt only when a geometry setting changes; hands are redrawn every frame. |

## Type terms

| Term | Meaning |
|---|---|
| **Family / style** | From macOS's font manager: a family (Helvetica Neue) and its styles (Bold, Light…). |
| **PostScript name** | The exact name of one style (`HelveticaNeue-Bold`); what's stored in `ty_ps`. |
| **Variable axis** | A continuous design dimension inside a variable font (weight `wght`, width `wdth`…). Each becomes a slider. |
| **Named instance** | A preset point on a variable font's axes (e.g. "Bold Condensed"). |
| **OpenType feature** | A switchable behaviour in the font: `tnum` tabular figures, `onum` oldstyle figures, `ss01` stylistic set 1, `zero` slashed zero… Shown with the type designer's own name when the font has one. |
| **Language** | Turns on language-specific forms (`locl`), e.g. Turkish İ/ı. |
| **Tracking** | Even spacing added between letters, in 1/1000 em. |
| **Outlines** | Text converted to shapes; the font isn't needed afterwards, but the text isn't editable. |

## Code terms

| Term | Meaning |
|---|---|
| **DrawBot** | The macOS app (Python) the tool runs in. Version 3.132. |
| **vanilla** | The macOS interface library DrawBot itself is built with. Version 0.5.0 inside DrawBot. |
| **DrawView** | DrawBot's PDF canvas, reused as the tool's preview. |
| **Private engine** | A separate `DrawBotDrawingTool` so the tool never disturbs DrawBot's own canvas. |
| **GridView** | Apple's form grid, used for every section (label · control · field · stepper columns). |
| **Probe** | `tools/dial_probe.py`, a self-reporting test of the interface foundation. |
| **Harness** | `tools/test_harness.py`, renders geometry off-Mac. |
