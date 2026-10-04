# Dial Tool — rules

Standing rules. Check code against these in reviews; cite them by number.
*Last updated 4 Oct 2026 (beta 2.3: R26–R28 added with the preview plan, R29 with the design canon; beta 2.2: R10 updated, R25 added, R13 reworded).*

## Geometry

- **R1 · Millimetres.** All geometry is in mm — ring radii, hand lengths, everything. Points appear only at render time (`MM = 72 / 25.4`) and when reading imported files (`MM_PER_PT`).
- **R2 · Clock angles.** 0° = 12 o'clock, growing clockwise. DrawBot turns counter-clockwise, so rotations are negated in one place: `place()`.
- **R3 · Draw upright, then place.** A shape is drawn at the origin pointing outward (+y), then moved to its radius and turned to its angle.
- **R4 · Filled shapes only.** Everything that can be exported is a filled path — no strokes. Bands are sectors (two arcs and two lines) or two circles subtracted; hollow shapes are an outline minus an inset; imported strokes are outlined.
- **R5 · Guides and backdrop are preview-only.** Never exported.
- **R6 · Geometry is a function of settings.** Parts 1–3 of `dial.py` (settings, geometry, drawing) never touch the interface; they take the settings dictionary `S` and return shapes. That is what makes them testable off-Mac.
- **R26 · One scene.** Export and every preview draw from `scene()` (part 3). The only differences allowed are preview-only: guides, backdrop, and the canvas drawing guides in screen points. None of them reaches an export (R5).
- **R23 · Imported files (SVG, PDF, AI).** Drawn pointing up (12 o'clock); the artboard's centre is the anchor — a hand's pivot, a marker's centre. Only the first page counts. Fills are ink; plain white fills (gray 1, RGB 1 1 1, CMYK 0 0 0 0) cut; strokes become outlines (R4); clipping is ignored; text, images and gradients are skipped and reported in the Export log. Colours set through spot/indexed spaces (`scn`) count as ink. AI files must be saved with "Create PDF Compatible File".

## Settings

- **R7 · Every setting has a starting value** in one of three places. `DEFAULTS`: the dial, hands, date, output and interface, with prefixed keys — `dial_`/`margin` · `c_` colour · `ha_` hands · `da_` date · `out_` output · `ui_` interface. `RING_BASE`: every key a ring can have; every ring carries all of them, so changing a ring's kind keeps its settings. `HAND_BASE`: one hand's keys. Keys inside a ring or a hand have no prefix.
- **R8 · Never rename a setting key** without a migration: saved presets and the last session use these names. `from_beta1()` converts beta 1.0 settings; `fresh_settings()` runs it automatically.
- **R9 · Popups store an index**, never the label text. Lists of choices (`LABEL_SETS`, `KINDS`, `HAND_SHAPES`…) only ever grow at the end.

## Type

- **R10 · Text always goes through DrawBot's `FormattedString`** and becomes outlines (`BezierPath.text`), so font, tracking, features, axes and language all reach the vectors. The export option *live text* draws the same `FormattedString` as text instead, placed from the outlines' bounds (`numeral_setup`, `path_letters`, `text_centre` are shared) so both land in the same place; cuts become clipping masks. Preview and production masks are always outlines.
- **R11 · Tracking is in 1/1000 em** (Illustrator's unit), converted to absolute only at drawing time.
- **R12 · OpenType features store only what differs from the font's default** (kern, liga, calt… are on by default).

## Interface

- **R13 · Only what ships with DrawBot 3.132:** vanilla 0.5.0, DrawBot itself, and Apple's frameworks through DrawBot's PyObjC (AppKit, Quartz, CoreText, Core Animation — `dial.py` already uses the first three directly). Read the source before using a call; `tools/vanilla-0.5.0-api.json` lists every vanilla class signature and method. APIs from macOS 14 are allowed with a fallback (R17): both of Okay's Macs run macOS 15 (4 Oct 2026). *Reworded 4 Oct: it said "only vanilla and DrawBot", which the code had already outgrown.*
- **R14 · No vanilla `Tabs` around auto-layout content** — it collapses. Use segmented switchers (sections, hands) or one scrolling list (R24).
- **R15 · A number control is label · slider · typed field · stepper**, kept in sync. Typing past the slider's range extends it.
- **R16 · Rows that don't apply are hidden**, not disabled.
- **R17 · No dead ends.** Every risky call has a fallback or reports to the Export log — never fails silently.
- **R22 · Keep every control's Python object alive.** vanilla stores a control's callback on the Python object (`_target`); Cocoa controls don't retain their target; `GridView` keeps only the Cocoa view. A control that exists only inside a grid loses its callback as soon as the building function returns: popup items turn grey, clicks do nothing. Store controls on the tool (`self.keep`, a binding, or a named attribute). Found 4 Oct 2026 (beta 1.0.1).
- **R24 · A scrolling form** is a vanilla `Group` laid out with auto layout, inside a flipped document view (`DialToolFlippedView`, looked up before it is defined so ⌘R again works), pinned to the scroll view's clip view at top, leading and trailing — never bottom, so the content decides the height. A view with no size of its own inside a `GridView` cell (a `List`) needs an explicit width and height.
- **R27 · Our own Cocoa classes** have one name per contract, ending in a number (`DialToolCanvasView1`), are looked up with `objc.lookUpClass` before being defined (a process can't define a class twice; ⌘R runs the script again), and only pass events on to Python. Change what a class must do → a new number. (`DialToolFlippedView` predates the numbering; R24.)
- **R28 · Nothing renders inside a control's callback.** Callbacks change settings and call `render()`, which only asks for a frame; the frame clock (`Clock`, `_frame`) draws, at most once per display frame.

## Process

- **R18 · Simplest approach that works** (Occam). No new feature without Okay asking.
- **R19 · Test before handing over.** Geometry: `tools/test_harness.py`, and look at the contact sheet. Interface: `tools/ui_smoke.py` must pass.
- **R20 · Third attempt at the same fix → stop and ask.** The first assumption was probably wrong.
- **R21 · Measure, don't estimate** — sizes and timings come from real renders.
- **R25 · The guidebook follows each release.** Edit `docs/guide/guide.html` (text, layout) and `tools/guide_dials.py` (the classic dials); run `tools/make_guide.py`; it must report no overflowing page. Figures, the redrawn window and the printed values all come from `dial.py` and the same settings — never type a value into the guide that a figure doesn't use. Fonts are fetched into `docs/guide/cache` (not in the repo).
- **R29 · `docs/design.md` is the design canon** for anything shown that isn't a dial: type, grid, colour, pictures, redrawn controls, writing. Follow it; when a new need doesn't fit, change the canon first, then the page.
