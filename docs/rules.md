# Dial Tool — rules

Standing rules. Check code against these in reviews; cite them by number.
*Last updated 4 Oct 2026 (R22 added).*

## Geometry

- **R1 · Millimetres.** All geometry is in mm. Points appear only at render time (`MM = 72 / 25.4`).
- **R2 · Clock angles.** 0° = 12 o'clock, growing clockwise. DrawBot turns counter-clockwise, so rotations are negated in one place: `place()`.
- **R3 · Draw upright, then place.** A shape is drawn at the origin pointing outward (+y), then moved to its radius and turned to its angle.
- **R4 · Filled shapes only.** Everything that can be exported is a filled path — no strokes. Rings are two circles subtracted; hollow markers are an outline minus an inset.
- **R5 · Guides and backdrop are preview-only.** Never exported.
- **R6 · Geometry is a function of settings.** Parts 1–3 of `dial.py` (settings, geometry, drawing) never touch the interface; they take the settings dictionary `S` and return shapes. That is what makes them testable off-Mac.

## Settings

- **R7 · Every setting lives in `DEFAULTS`** with a prefix: `dial_`/`margin` · `c_` colour · `tr_` track · `mk_` markers · `ty_` type · `nu_` numerals · `ha_` hands · `da_` date · `out_` output · `ui_` interface.
- **R8 · Never rename a setting key** without a migration: saved presets and the last session use these names.
- **R9 · Popups store an index**, never the label text.

## Type

- **R10 · Text always goes through DrawBot's `FormattedString`** and becomes outlines (`BezierPath.text`), so font, tracking, features, axes and language all reach the vectors.
- **R11 · Tracking is in 1/1000 em** (Illustrator's unit), converted to absolute only at drawing time.
- **R12 · OpenType features store only what differs from the font's default** (kern, liga, calt… are on by default).

## Interface

- **R13 · Only APIs in vanilla 0.5.0 and DrawBot 3.132** (what the DrawBot app bundles). Read the source before using a call.
- **R14 · No vanilla `Tabs` around auto-layout content** — it collapses. Use the segmented section switcher.
- **R15 · A number control is label · slider · typed field · stepper**, kept in sync. Typing past the slider's range extends it.
- **R16 · Rows that don't apply are hidden**, not disabled.
- **R17 · No dead ends.** Every risky call has a fallback or reports to the Export log — never fails silently.
- **R22 · Keep every control's Python object alive.** vanilla stores a control's callback on the Python object (`_target`); Cocoa controls don't retain their target; `GridView` keeps only the Cocoa view. A control that exists only inside a grid loses its callback as soon as the building function returns: popup items turn grey, clicks do nothing. Store controls on the tool (`self.keep`, or a named attribute). Found 4 Oct 2026 (beta 1.0.1).

## Process

- **R18 · Simplest approach that works** (Occam). No new feature without Okay asking.
- **R19 · Test geometry with `tools/test_harness.py`** and look at the contact sheet before handing over.
- **R20 · Third attempt at the same fix → stop and ask.** The first assumption was probably wrong.
- **R21 · Measure, don't estimate** — sizes and timings come from real renders.
