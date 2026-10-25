# Rules — the index

Every rule is binding and has a page of its own in `docs/rules/`; cite the number. Read the page the task touches, not the folder. A rule's page ends with how it is checked, when a test checks it. Numbers are never reused: the DrawBot version's own rules (R13, R14, R22, R24, R27) are in `archive/drawbot/rules-drawbot.md`; a new rule takes the next number, a part of a rule that outgrows its page takes a letter (R15a, R32a).

## Geometry

- **[R1](rules/R1-millimetres.md)** — All geometry is in millimetres; points appear only in a file.
- **[R2](rules/R2-clock-angles.md)** — Clock angles: 0° at 12, growing clockwise; negated in one place.
- **[R3](rules/R3-upright-then-place.md)** — Draw upright at the origin, then move to the radius and turn.
- **[R4](rules/R4-filled-shapes.md)** — Only filled paths reach the files — no strokes.
- **[R5](rules/R5-preview-only.md)** — Guides and the backdrop are preview-only — never in a file.
- **[R6](rules/R6-geometry-pure.md)** — Geometry is a pure function of the settings (`set_today` for the date).
- **[R23](rules/R23-imported-files.md)** — Imported files (SVG, PDF, AI): how they will be read when built (#50).
- **[R26](rules/R26-one-scene.md)** — One scene: the files and the preview draw the same list of items.

## Settings

- **[R7](rules/R7-starting-values.md)** — Every setting has a starting value.
- **[R8](rules/R8-key-names.md)** — Never rename a setting key.
- **[R9](rules/R9-popup-index.md)** — Popups store an index, never a label.

## Type

- **[R10](rules/R10-harfbuzz.md)** — Text is shaped by HarfBuzz and becomes outlines.
- **[R11](rules/R11-tracking.md)** — Tracking is in 1/1000 em.
- **[R12](rules/R12-features-differ.md)** — OpenType features store only what differs from the font's default.

## Interface

- **[R15](rules/R15-number-forms.md)** — A number has three ways in — type, step, sweep — in listed forms (A, B, C, D, Words, Toggle).
- **[R15a](rules/R15a-controller.md)** — The controller: the one popup every number form opens; its measures.
- **[R16](rules/R16-hidden-not-disabled.md)** — What can't be used is hidden, not disabled.
- **[R17](rules/R17-no-dead-ends.md)** — No dead ends: every risky call has a fallback or reports to the Export log.
- **[R28](rules/R28-no-render-in-handler.md)** — Nothing renders inside a control's handler.
- **[R30](rules/R30-web-version.md)** — The web version is the tool; `dial.py` is frozen; new keys are the web's alone.
- **[R31](rules/R31-link-and-file.md)** — A dial's link is for sharing now; a settings file is for keeping.
- **[R32](rules/R32-stylesheet.md)** — The stylesheet: cascade layers, tokens, the unit scale, the bans, hover under `(hover: hover)`.
- **[R32a](rules/R32a-type-sizes.md)** — Sizes of type: the `--t-` tokens, `--t-pixel`, INKED labels.
- **[R32b](rules/R32b-specials.md)** — The specials block in `1-tokens.css`: the only way off the scale.
- **[R32c](rules/R32c-look-check.md)** — The look-check `test/same.mjs` proves a change that must not change the look.
- **[R33](rules/R33-icons.md)** — Icons: one grid, one line weight, drawn through `web/icons/`.

## Process

- **[R18](rules/R18-nothing-unprompted.md)** — Simplest approach that works; nothing unprompted.
- **[R19](rules/R19-test-before-handing-over.md)** — Test before handing over — `npm run small` for a small push, `npm test` for a step; look at the screenshots.
- **[R34](rules/R34-no-band-aids.md)** — No band-aids: one need, one mechanism.
- **[R20](rules/R20-third-attempt.md)** — Third attempt at the same fix → stop and ask.
- **[R21](rules/R21-measure.md)** — Measure, don't estimate.
- **[R25](rules/R25-guide.md)** — The guide follows the app; rebuilt only when Okay asks.
- **[R35](rules/R35-font-list.md)** — The font list: every font from the start, files on use.
- **[R36](rules/R36-archive.md)** — The archive: every picture kept, on Okay's Mac, none in the repo.
- **[R29](rules/R29-design-canon.md)** — `docs/design.md` is the design canon.

Where a rule's words come from: the row in `decisions.md` of the same date. How a rule came to be is the repo's history, not the page (docs state the present).
