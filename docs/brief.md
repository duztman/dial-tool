# Dial Tool — brief

*Started 3 Oct 2026. Last updated 4 Oct 2026 (beta 2.3 on `dev`: preview plan built, Mac check pending — `docs/preview.md` §6).*

## 1 · Goal

A tool to design watch dials for a watch Okay will actually build. One tool, four jobs:

- **Explore** — sketch variations fast, test proportions.
- **Present** — clean vector sheets, animated loops (moving hands), variation grids.
- **Produce** — files that go to real production: etched brass (toner transfer), pad or screen printing, laser.
- **Learn** — Okay learns the concepts of generative design along the way (concepts, not syntax).

Not photorealistic. Real proportions and perfect vector rendering are.

## 2 · Context and constraints

- Okay: graphic designer; uses Illustrator daily, also InDesign, After Effects, LightBurn. Comfortable with code; wants to understand what it does.
- Machines: Macs, both Apple Silicon and Intel, not always the latest macOS; iPhone and iPad as viewers. As of 4 Oct 2026 both Macs run macOS 15; the Intel one has integrated graphics — the slowest machine to test speed on.
- Existing practice: prototyping dials by acid-etching brass blanks with toner transfer (PnP Blue film). Pad printing is the industry pipeline.
- Materials and parts are sourced locally: don't plan around ordering from abroad (books excepted).
- The movement is not chosen yet — design first, then pick a movement that fits.
- **Production doesn't limit design** (Okay, 4 Oct). The production outputs stay and grow, but what the tool can draw is not narrowed to what a method can print; production-specific checks and outputs are optional layers on top.

## 3 · Outputs

| Output | Format | Notes |
|---|---|---|
| Design / present | PDF, SVG → Illustrator | True size in mm; numerals as outlines |
| Motion | MP4, GIF | Hands from the set time, sweep / quartz / 6 or 8 beats per second |
| Production mask | PDF, SVG, PNG (dpi set) | Mono, optional mirror for toner transfer, aperture outline |

Imports: SVG, PDF and AI (PDF-compatible) files as marker and hand shapes (rules R23).

## 4 · Decisions

| Date | Decision | Why |
|---|---|---|
| 3 Oct | Build in **DrawBot** (Python, macOS) | Best-in-class type: CoreText, OpenType features, variable fonts, outlines; PDF/SVG/MP4/GIF export in one place. Browser tool and Illustrator script were the alternatives. |
| 3 Oct | v1 does **geometry and division** first | Okay's pick; everything else hangs off it. |
| 3 Oct | Scope v1: a **regular watch + date window**; subdials, apertures, sectors later | Keep the first version pure. *Sectors arrived 4 Oct as band rings.* |
| 3 Oct | All **collision rules** stay available: one ring, skip, knockout, stack | Different dials need different rules. *Superseded 4 Oct by skip where / knock out per ring; every old rule still reachable.* |
| 3 Oct | Numeral placement: upright, radial, radial auto-flip, on path; any label set; each numeral movable | "The whole shebang" — words, Chinese, Eastern Arabic, custom. |
| 3 Oct | Everything is a **filled shape**, no strokes | Exact widths in Illustrator; clean masks for etching and print. |
| 4 Oct | Own **vanilla window** instead of DrawBot's `Variable()` panel | `Variable()` is a fixed 250 px column, one control per row — no slider + number field, no sections, no conditional rows (read in DrawBot's source). DrawBot's own window is vanilla + `DrawView`; the DrawBot devs point users there. |
| 4 Oct | **vanilla only** — no RoboFont, no ezui | Okay: only DrawBot. ezui has no public source we could find; it ships inside RoboFont. |
| 4 Oct | **System fonts** via macOS's font manager: family → style → named instance. No fonts folder. | Okay: no folder. DrawBot reads axes and features from installed fonts by name. |
| 4 Oct | Section switcher (segmented control) instead of vanilla **Tabs** | Tabs run on Apple's tab view controller, which shrank to fit auto-layout content — the probe showed a collapsed panel. |
| 4 Oct | Tracking in **1/1000 em** | Same unit as Illustrator. |
| 4 Oct | Typed numbers accept `1.2`, `+0.5`, `x0.5`, `/2` | Matches how Okay describes changes. |
| 4 Oct | Settings are one dictionary, saved as JSON; last session restored on launch | Presets for free; re-running keeps work. |
| 4 Oct | Project set up: GitHub `duztman/dial-tool`, Claude Project "Dial Tool"; Mac folder later | Okay. |
| 4 Oct | **The dial is a list of rings.** Everything in the list is a *ring* (Okay: "rings instead of layers, all round"). Kinds: ticks, markers, numerals, band. Unlimited; select to edit; add, duplicate, delete, move up/down, hide, rename. | Fixed sections allowed one track, one marker set, one numeral set. Rings let any number of each be stacked (minute numerals, scales, rails, zones). |
| 4 Oct | A ring's **kind** can change later; every ring carries every setting, so nothing is lost. Word: *kind*, not *type* (type = typography). | Okay. |
| 4 Oct | **Type belongs to each numerals ring.** A new numerals ring copies the top one; the date window uses the top numerals ring's type. | Okay: "type specific to that ring". Date has no font of its own yet (build list #34). |
| 4 Oct | **List order = stacking order.** Each ring chooses how it gives way to the rings above: *skip where* (markers / markers & numerals / all marks above) and *knock out* (same choices, or everything above) with a clearance. Replaces beta 1.0's four collision rules. | One mechanism for every pair of rings. beta 1.0 dials convert exactly: 11 test dials, zero area difference. |
| 4 Oct | **Positions:** count, start, span, every, offset, skip those instead. Partial spans mark both ends. | Replaces fixed divisions and "show at" lists; gives scales and arcs for free. |
| 4 Oct | **Surfaces: flat colour for now** — band rings make full rings, sectors (count · every · fill %) and pies. Finishes (sunray, grain…) later. | Okay: "flat, for now; designs later". |
| 4 Oct | **Hands:** each hand has its own shape and settings, in mm (R1): baton, pencil, sword, dauphine, leaf, arrow, syringe, Breguet, lollipop, or a file (SVG/PDF/AI) with fit to length, size ×, width ×. Hollow wall and counterweight on any hand. | Okay: "more sensible options, able to import (pdf), size, change shape". Lengths in mm match how movements specify hands. |
| 4 Oct | **PDF/AI import** reads the page's drawing operators with macOS's own PDF scanner (CoreGraphics `CGPDFScanner`, via pyobjc). | No PDF library ships with DrawBot; pyobjc supports the scanner callbacks (checked in pyobjc's tests). The drawing logic is Mac-free and tested in the harness. |
| 4 Oct | **Ring settings: one scrolling list**, not pages. **Guides** checkbox under the preview. **Regular-size controls**; panel 470 px. **Tab titles left-aligned.** | Okay, after beta 2.0: pages felt fragmented; guides needed from every section; type too small. |
| 4 Oct | **Live text** is an export option; **outlines stay the default**. | Okay. Outlines need no fonts and print as seen; live text keeps numerals editable, with Illustrator's limits (§5.2). |
| 4 Oct | **Guidebook**: a 5-page PDF in IBM Plex Mono — what it does, install, files in and out, FAQ — built from `docs/guide/guide.md` by `tools/make_guide.py`, updated with each release (R25). | Okay: "a guidebook that gets updated, part of the project". Source and script in the repo so any agent can rebuild it; figures come from dial.py itself. |
| 4 Oct | **beta 2.2 released to `main`.** | Okay: "we have beta v2 here" — beta 2.1 ran on his Mac. |
| 4 Oct | **Repository public, MIT licence** (fonts stay SIL OFL). City and machine details trimmed from the docs first. | Okay. |
| 4 Oct | **Preview plan** (`docs/preview.md`): draw the preview with Core Animation from one scene shared with export; a display-synced frame clock; the PDF preview kept as a switch and fallback; skia-pathops optional. Runs when Okay says *"run the preview plan"*. | Okay's complaints after beta 2.1: flashing, lag while dragging, blur while zooming. Causes found in DrawBot's source and Apple's docs (PDF document swap; scroll-view magnification; `booleanOperations` 2–14× slower than skia-pathops, measured with `tools/bool_bench.py`). |
| 4 Oct | **skia-pathops** for shape combining, installed per Mac through DrawBot's package menu; the tool falls back to DrawBot's own if it's missing. **Canvas** is the preview at first launch; PDF stays a switch. | Okay. Shape combining is 2–14× faster and matches the harness; reversible by uninstalling. Canvas fixes flash, lag and blur; PDF remains the reference. |
| 4 Oct | **beta 2.3 (on `dev`): the preview is drawn by Core Animation from one scene** shared with export (R26); a frame clock draws (R28); the PDF preview stays as a switch and automatic fallback; skia-pathops is used when installed. `main` stays at beta 2.2 until Okay's Mac check. | Okay: "run the preview plan". Built as planned; differences from the plan are listed in `docs/preview.md` §12. |
| 4 Oct | **Guidebook redesigned**: 12 pages, panels, more figures, nine classic dials with real values and presets. Type: **Recursive Sans + Mono** (Okay asked for Input; it isn't on Google Fonts and its free licence is for private use only, so Okay chose Recursive). Built from HTML through Chromium. Off-Mac renders use open stand-ins for the macOS fonts the dials name. | Okay: "a better pdf… panels, details, helpful, nicer dials, real-world classics, examples with real values". |
| 4 Oct | Interface checked off-Mac with **`tools/ui_smoke.py`**: stand-ins that accept only vanilla 0.5.0's real signatures and methods. | The full window can't run off-Mac; this catches wrong calls and lost callbacks (it reproduces the beta 1.0 dropdown bug when R22 is removed). |

## 5 · Open questions

1. **Movement** — which one? It fixes the real dial diameter, hand lengths, the date window's position and size (date wheel), and the feet positions.
2. ~~**Live text vs outlines**~~ — settled 4 Oct: outlines by default, live text as an option (beta 2.2). Background: DrawBot writes real text to PDF when drawing a `FormattedString`. Limits found 4 Oct: Illustrator outlines or rebuilds text with ligatures/alternate glyphs when it opens a PDF; the font must be installed where it's opened; on-path numerals become one text object per letter; knockouts and the date clearance would have to become clipping masks; production masks stay outlines.
3. **Minimum line width and clearance** per production method (toner-transfer etching, pad print, laser). Should become rules the tool can warn about.
4. **Eastern Arabic and Chinese labels** — which fonts; is CoreText's automatic fallback good enough, or do we need a fallback-font control?
5. Does DrawBot's SVG import into Illustrator at **exact size**, and with usable groups?
6. When `dial.py` grows, split it into modules or keep one file? (beta 2.3: about 2,700 lines, still one file.)
7. **Should rings and hands scale with the diameter?** Radii and lengths are absolute mm (R1), so changing the diameter leaves them in place — right for a fixed movement, awkward while exploring. (Build list #32.)
8. **PDF import with real Illustrator files** — forms, compound paths, white made in spot or CMYK colours. Tested only with hand-written operators so far. (Build list #30.)
9. **Preview drawing** — do Core Animation shape layers draw fine lines (0.12 mm ticks) as the PDF does? Apple says shape rasterization "may favor speed over accuracy". Built in beta 2.3; **still open until the Mac check** (`docs/preview.md` §6 step 5: also look at whether curves stay smooth when zoomed); contingency in §8.
10. ~~**skia-pathops**~~ — settled 4 Oct: yes (§4).

## 6 · Avenues (ideas, not commitments)

- Subdials (small seconds, chronograph registers), day/date apertures — perhaps as further ring kinds.
- Surface finishes on bands: sunray, grain, guilloché (Okay: later).
- Per-ink separations: one production mask per ring colour (pad printing etches one plate per colour).
- Variation grid: one rule set, many dials on one sheet.
- Spec sheet export: dial with dimension callouts for suppliers.
- More hand styles: cathedral (file import covers it now); lume plots.
- Plotter output via LightBurn for the pen plotter (AxiDraw clone).
- Production warnings: flag lines thinner than the method allows.

## 7 · Workflow

1. Okay runs `dial.py` on a Mac and reports back with screenshots and the Export log.
2. Claude changes code, tests geometry with `tools/test_harness.py` and the interface with `tools/ui_smoke.py`, checks UI calls against vanilla/DrawBot source.
3. Work happens on `dev`; a tested version is merged to `main` with a changelog entry.
4. When the interface misbehaves at its foundation, run `tools/dial_probe.py` and paste its report.

## 8 · Parked

- Mac folder set-up — Okay will ask when it's time.
- Browser version of the tool — DrawBot chosen for type.
- drawbot-skia (cross-platform DrawBot) — test harness only; it lacks much of DrawBot's text engine.
- ezui (RoboFont) — not available without RoboFont.
