# Guidebook for the web version — content outline (draft)

*14 Oct 2026. Build list #93. Okay, 10:56: "better content first, then better design"; English only. This is the content plan, for Okay to approve before anything is built. The look stays the canon's (`docs/design.md`): A4 landscape, 12 × 14 grid, one sans.*

**Locked to beta 4.36.1** (Okay, 14 Oct 2026, 13:02: "lock this for this active version, never mind the new updates that might come up in the meantime"). The guide's text, screenshots, figures and settings tables describe beta 4.36.1 — commit `a279c0a`, `docs/versions.md` — and nothing later. Build its pictures from that version (`tools/versions.sh open 4.36.1`), not from `dev`. Later changes to the tool wait for a later edition.

## What changes from the 4 Oct guide

- **Tasks before settings.** The 4 Oct guide was a manual of the window's rows. This one starts with making a dial, then explains the parts.
- **Pictures drawn by the web geometry** (`web/src/geometry.js` in Node), not by `dial.py`. The guide shows what the tool draws today.
- **Every dial in the book is a link** that opens it in the tool (clickable in the PDF, a short printed address on paper).
- **Production gets its own pages**, because producing a real dial is the point of the tool.
- **The parts that go stale are generated:** settings tables, figures, the window's drawing. The words avoid button-level detail, which changes almost every version.

## Pages (about 32, A4 landscape)

| # | Page | What it says |
|---|---|---|
| 00 | Cover + contents | |
| **A** | **Start** | |
| 01 | Start | Open the address; nothing to install; Mac, PC, iPad by finger; millimetres or other units; undo; **a link is the dial** (no save needed). |
| 02 | A first dial, in ten pictures | From an empty plate to a field watch: diameter → minute track → hour markers → numerals → font → hands → window → export. Each step one picture and one sentence. |
| 03–04 | The window | The tabs, the panel, the preview and its switches (Guides, Backdrop, Undo), time and day controls. Drawn whole, in grey, at true proportions, with numbered callouts. |
| **B** | **Build** | |
| 05 | Dial and page | Diameter and *Scale everything with it*; plate, backdrop, page margin; the colour pop-out and palette; transparency. |
| 06 | Rings | A dial is a list of rings, top first. The four kinds; the list, eye, rename, drag to reorder, the ring line, *Copy style of*. |
| 07 | Positions | Count · Start · Span · Every · Offset · Skip: six numbers for any track or scale. |
| 08 | Marks | Bar, wedge, dot, file; hollow, round ends, taper; the 12 o'clock position. |
| 09 | Give way | Skip where, knock out, clearance: how rings respect each other. |
| 10 | Bands and sectors | Rings, rails, zones, pies; a colour per sector. |
| 11 | Numerals | Label sets, numbers (first, step, digits, start again), your own list; placement upright, radial, on the path. |
| 12–13 | Type | The font sheet: twenty open fonts, the computer's own fonts, Find; variable axes and OpenType features in plain words; nudging one numeral. |
| 14 | Hands | Ten shapes; length, tail, tip, head, counterweight, hollow, round ends; the cap; colours. |
| 15 | Windows | Up to four (12 · 3 · 6 · 9): date, day, AM · PM, moon phase; shape, frame, clearance; turning the text. |
| 16 | Guides | Dial edge, centre lines, window radii, ring edges; guides per ring and added by hand; their colours. |
| **C** | **Out** | |
| 17 | Export | PDF and SVG at true size, PNG at any dpi; live text or outlines. |
| 18–19 | Production | The mono print mask and the mirror; what each method needs from the file (toner transfer and etching on brass, pad and screen printing, laser), smallest line and gap, checks before printing. |
| 20 | Links, files, Gallery | Share a dial as a link; settings files; the Gallery's ready-made rings. |
| **D** | **Classics** | |
| 21 | Nine classics, an overview | |
| 22–30 | One per page | Field, diver (Okay's bezel diver), dress, B-Uhr type B (Okay's), California, station clock, red minimal (Okay's, in Bauhaus's place), sector, gauge, drawn with the open fonts. Each page has its link and the settings that differ from a new ring. |
| **E** | **Reference** | |
| 31 | Every setting | Generated from the window's own rows: range, step, starting value. |
| 32 | Find it + words | "What you want → what the tool calls it → page"; the watch words from `docs/glossary.md` (chapter ring, railroad, sector…). |

## Settled with Okay (14 Oct 2026, 12:14)

1. The window's pictures are **screenshots from Chromium, grey-toned** (the tests already take them), not redrawn.
2. **No production figures yet:** Okay hasn't tested brass; production is upcoming. Pages 18–19 explain what the tool gives and what to check, without numbers.
3. **Three of the classics swapped for Okay's dials:** B-Uhr for pilot type B, his bezel diver for the diver, red minimal (Claude's guess: in Bauhaus's place). His links are in `docs/guide/classics-links.md`.
4. **About 32 pages.** Text first, page by page, no pictures: `docs/guide/text-web.md`. Plain words on the pages, the trade words in the reference.
