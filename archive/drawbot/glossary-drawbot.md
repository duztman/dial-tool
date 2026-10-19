# Dial Tool — the DrawBot version's words (archived)

*Moved here 19 Oct 2026 (beta 4.87) from docs/glossary.md. The DrawBot version is frozen (R30).*

## Retired words (beta 1.0)

Kept so older notes still read.

- **Collision rule** (one ring / skip / knockout / stack) → **skip where** and **knock out**, per ring. One ring = markers' radius on the track's outer edge + ticks skip where markers.
- **Divisions** (60/120/240/300) → a ticks ring's **count**.
- **Offset** (marker from the track) → the markers ring's **radius**.
- **Rank** → ring order.
- **Show at** → every · offset · skip those instead.
- **Track, Markers, Type, Numerals sections** → the **Rings** section.

## Code terms (DrawBot only)

| Term | Meaning |
|---|---|
| **DrawBot** | The macOS app (Python) the tool runs in. Version 3.132. |
| **vanilla** | The macOS interface library DrawBot itself is built with. Version 0.5.0 inside DrawBot. |
| **DrawView** | DrawBot's PDF viewer (Apple's `PDFView`), reused as the tool's preview — the **PDF preview**. |
| **Canvas** | The preview drawn by macOS's Core Animation (class `Canvas`, beta 2.3): one layer per scene item. Zoom and pan live in it. Not to be confused with DrawBot's own drawing area. |
| **Slot** | One shape layer of the canvas plus what it shows now (class `Slot`); slot *i* shows scene item *i*. Only changes are sent to macOS. |
| **Preview switch** | `Canvas · PDF` under the preview; setting `ui_preview` (0 canvas, 1 PDF). |
| **Frame clock** | A clock in step with the display's refresh (class `Clock`: a display link, or a timer on older macOS). Controls only ask for a frame; the clock draws at most once per frame (R28). **Build** = rebuilding geometry; **frame** = drawing it — both shown in the status line. |
| **Shape combining** | Union, difference, xor and overlap removal of paths (knockouts, cuts, hollow shapes). DrawBot's own is `booleanOperations`; the harness uses `skia-pathops`, and so does the tool on a Mac where it's installed (beta 2.3). The launch log says which. |
| **Private engine** | A separate `DrawBotDrawingTool` so the tool never disturbs DrawBot's own canvas. |
| **GridView** | Apple's form grid, used for every form (label · control · field · stepper columns). |
| **Binding** | The link from a control to a setting key in a scope — global, the selected ring, or the selected hand — so selecting another ring refills the controls. |
| **Probe** | `archive/drawbot/tools/dial_probe.py`, a self-reporting test of the interface foundation, run on the Mac. |
| **Harness** | `archive/drawbot/tools/test_harness.py`, renders geometry off-Mac (drawbot-skia). |
| **Smoke test** | `archive/drawbot/tools/ui_smoke.py`, runs the whole interface off-Mac on **stand-ins** that accept only what vanilla 0.5.0 accepts. |

## The DrawBot version's guidebook

| Term | Meaning |
|---|---|
| **Guidebook** | `docs/Dial-Tool-guide.pdf`, the user guide (A4 landscape, 28 pages, set by the design canon), built from `docs/guide/pages/` and `style.css` by `tools/make_guide.py`. |
| **Classics** | The guide's nine example dials (field, diver, dress, pilot, California, station clock, Bauhaus, sector, gauge): settings in `tools/guide_dials.py`, also saved as presets in `docs/guide/presets/`. Drawn by eye after dial types, not measured. |
