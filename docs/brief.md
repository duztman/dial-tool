# Dial Tool — brief

*Started 3 Oct 2026. Last updated 4 Oct 2026 (beta 1.0).*

## 1 · Goal

A tool to design watch dials for a watch Okay will actually build. One tool, four jobs:

- **Explore** — sketch variations fast, test proportions.
- **Present** — clean vector sheets, animated loops (moving hands), variation grids.
- **Produce** — files that go to real production: etched brass (toner transfer), pad or screen printing, laser.
- **Learn** — Okay learns the concepts of generative design along the way (concepts, not syntax).

Not photorealistic. Real proportions and perfect vector rendering are.

## 2 · Context and constraints

- Okay: graphic designer in Istanbul; uses Illustrator daily, also InDesign, After Effects, LightBurn. Comfortable with code; wants to understand what it does.
- Machines: two Macs (Apple Silicon M4 and a recent Intel), not always the latest macOS; iPhone and iPad as viewers.
- Existing practice: prototyping dials by acid-etching brass blanks with toner transfer (PnP Blue film). Pad printing is the industry pipeline.
- Ordering from abroad is not possible (except books): materials and parts are sourced in Istanbul.
- The movement is not chosen yet — design first, then pick a movement that fits.

## 3 · Outputs

| Output | Format | Notes |
|---|---|---|
| Design / present | PDF, SVG → Illustrator | True size in mm; numerals as outlines |
| Motion | MP4, GIF | Hands from the set time, sweep / quartz / 6 or 8 beats per second |
| Production mask | PDF, SVG, PNG (dpi set) | Mono, optional mirror for toner transfer, aperture outline |

## 4 · Decisions

| Date | Decision | Why |
|---|---|---|
| 3 Oct | Build in **DrawBot** (Python, macOS) | Best-in-class type: CoreText, OpenType features, variable fonts, outlines; PDF/SVG/MP4/GIF export in one place. Browser tool and Illustrator script were the alternatives. |
| 3 Oct | v1 does **geometry and division** first | Okay's pick; everything else hangs off it. |
| 3 Oct | Scope v1: a **regular watch + date window**; subdials, apertures, sectors later | Keep the first version pure. |
| 3 Oct | All **collision rules** stay available: one ring, skip, knockout, stack | Different dials need different rules. |
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

## 5 · Open questions

1. **Movement** — which one? It fixes the real dial diameter, hand lengths, the date window's position and size (date wheel), and the feet positions.
2. **Live text vs outlines** in SVG/PDF export. Now always outlines (the font is not needed in Illustrator, but text is not editable).
3. **Minimum line width and clearance** per production method (toner-transfer etching, pad print, laser). Should become rules the tool can warn about.
4. **Eastern Arabic and Chinese labels** — which fonts; is CoreText's automatic fallback good enough, or do we need a fallback-font control?
5. Does DrawBot's SVG import into Illustrator at **exact size**, and with usable groups?
6. When `dial.py` grows, split it into modules or keep one file?

## 6 · Avenues (ideas, not commitments)

- Subdials (small seconds, chronograph registers), day/date apertures, sectors and zones.
- Variation grid: one rule set, many dials on one sheet.
- Spec sheet export: dial with dimension callouts for suppliers.
- More hand styles: cathedral, syringe, Breguet, pencil; lume plots.
- Plotter output via LightBurn for the pen plotter (AxiDraw clone).
- Production warnings: flag lines thinner than the method allows.

## 7 · Workflow

1. Okay runs `dial.py` on a Mac and reports back with screenshots and the Export log.
2. Claude changes code, tests geometry with `tools/test_harness.py`, checks UI calls against vanilla/DrawBot source.
3. Work happens on `dev`; a tested version is merged to `main` with a changelog entry.
4. When the interface misbehaves at its foundation, run `tools/dial_probe.py` and paste its report.

## 8 · Parked

- Mac folder set-up — Okay will ask when it's time.
- Browser version of the tool — DrawBot chosen for type.
- drawbot-skia (cross-platform DrawBot) — test harness only; it lacks much of DrawBot's text engine.
- ezui (RoboFont) — not available without RoboFont.
