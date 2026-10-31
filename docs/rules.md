# Rules — the index

Every rule is binding; cite it by its **R-number**, which never changes (code, tests and old notes cite it). The list below is the order to learn them in — **the number before the name is that order**, and the name is what to remember. Each rule has a page of its own in `docs/rules/`: the rule in one line on top, the details under it, how it is checked at the end. Read the page the task touches, not the folder.

Gaps in the R-numbers are the DrawBot version's rules (R13, R14, R22, R24, R27), in `archive/drawbot/rules-drawbot.md`. A new rule takes the next R-number; a part of a rule that outgrows its page takes a letter (R15a, R32a). Where a rule's words come from: the row in `decisions.md` of the same date.

## How we work — the seven to know by heart

| | Rule | Name | In one line |
|---|---|---|---|
| 1 | [R18](rules/R18-nothing-unprompted.md) | **Occam** | The simplest approach that works; nothing Okay didn't ask for. |
| 2 | [R21](rules/R21-measure.md) | **Measure** | Measure, don't estimate — sizes and timings from real renders. |
| 3 | [R20](rules/R20-third-attempt.md) | **Third time, stop** | Third attempt at the same fix → stop and ask. |
| 4 | [R34](rules/R34-no-band-aids.md) | **One mechanism** | One need, one mechanism; a fix for one place is the sign to look again. |
| 5 | [R19](rules/R19-test-before-handing-over.md) | **Test, then hand over** | A small push gets `npm run small`, a step `npm test`; look at the screenshots. |
| 6 | [R25](rules/R25-guide.md) | **The guide waits** | The guide follows the app and is rebuilt only when Okay asks. |
| 7 | [R36](rules/R36-archive.md) | **Pictures on the Mac** | Every picture kept, in Okay's Mac folder, none in the repo. |

## The drawing

| | Rule | Name | In one line |
|---|---|---|---|
| 8 | [R1](rules/R1-millimetres.md) | **Millimetres** | All geometry is in mm; points appear only in a file. |
| 9 | [R2](rules/R2-clock-angles.md) | **Clock angles** | 0° at 12, growing clockwise; negated in one place. |
| 10 | [R3](rules/R3-upright-then-place.md) | **Upright, then place** | Draw at the origin pointing up, then move to the radius and turn. |
| 11 | [R4](rules/R4-filled-shapes.md) | **Filled shapes** | Only filled paths reach a file — no strokes. |
| 12 | [R5](rules/R5-preview-only.md) | **Preview only** | Guides and the backdrop never reach a file. |
| 13 | [R6](rules/R6-geometry-pure.md) | **Pure geometry** | Geometry is a function of the settings; it never touches the window or the clock. |
| 14 | [R26](rules/R26-one-scene.md) | **One scene** | Files and every preview draw the same list of items. |
| 15 | [R23](rules/R23-imported-files.md) | **Imported files** | How an SVG, PDF or AI will be read when import is built (#173). |

## Settings, links and files

| | Rule | Name | In one line |
|---|---|---|---|
| 16 | [R7](rules/R7-starting-values.md) | **Starting values** | Every setting has one, in one of four places. |
| 17 | [R8](rules/R8-key-names.md) | **Keys keep their names** | Never rename a setting key; a dead key stays with a comment. |
| 18 | [R9](rules/R9-popup-index.md) | **Index, not label** | A popup stores an index; a list of choices only grows at its end. |
| 19 | [R30](rules/R30-web-version.md) | **The web is the tool** | `dial.py` is frozen; new keys are the web's alone. |
| 20 | [R31](rules/R31-link-and-file.md) | **Link now, file to keep** | A link shares a dial now and may die; a settings file keeps one. |

## Type

| | Rule | Name | In one line |
|---|---|---|---|
| 21 | [R10](rules/R10-harfbuzz.md) | **HarfBuzz** | Text is shaped by HarfBuzz and becomes outlines. |
| 22 | [R11](rules/R11-tracking.md) | **Tracking** | Tracking is in 1/1000 em. |
| 23 | [R12](rules/R12-features-differ.md) | **Only the difference** | OpenType features store only what differs from the font's default. |
| 24 | [R35](rules/R35-font-list.md) | **Every font listed** | The font sheet lists every font from the start; files load on use; six filters; licences settled. |

## The window

| | Rule | Name | In one line |
|---|---|---|---|
| 25 | [R15](rules/R15-number-forms.md) | **Three ways in** | A number is typed, stepped or swept, in listed forms (A, B, C, D, Words, Toggle). |
| 26 | [R15a](rules/R15a-controller.md) | **The controller** | The one popup every number form opens; its measures. |
| 27 | [R16](rules/R16-hidden-not-disabled.md) | **Hidden, not disabled** | What can't be used is hidden; a pane with nothing that applies goes too. |
| 28 | [R17](rules/R17-no-dead-ends.md) | **No dead ends** | Every risky call has a fallback or reports to the Export log. |
| 29 | [R28](rules/R28-no-render-in-handler.md) | **One frame** | Nothing renders inside a handler; `render()` asks for a frame. |
| 30 | [R29](rules/R29-design-canon.md) | **The canon** | `docs/design.md` is the design canon for anything shown. |
| 31 | [R32](rules/R32-stylesheet.md) | **The stylesheet** | Cascade layers, tokens, the unit scale, the bans, hover under `(hover: hover)`. |
| 32 | [R32a](rules/R32a-type-sizes.md) | **Type sizes** | The `--t-` tokens, `--t-pixel`, labels centred on their ink. |
| 33 | [R32b](rules/R32b-specials.md) | **Specials** | The one block in `1-tokens.css` that may leave the scale. |
| 34 | [R32c](rules/R32c-look-check.md) | **The look-check** | `test/same.mjs` proves a change that must not change the look. |
| 35 | [R33](rules/R33-icons.md) | **Icons** | One grid, one line weight, drawn through `web/icons/`. |
