# Dial Tool

A parametric watch-dial design tool that runs inside [DrawBot](https://www.drawbot.com) on macOS.
Built to explore, present and produce dials for a watch Okay will actually build.

**Status: beta 2.2 (4 Oct 2026)** on `main` — rings. **beta 2.3** on `dev` — new preview (canvas, frame clock, Canvas · PDF switch), waiting for the Mac check in `docs/preview.md` §6. **Start here: [`docs/Dial-Tool-guide.pdf`](docs/Dial-Tool-guide.pdf)** — the guidebook, with nine classic dials and their settings.
Geometry is tested off-Mac with `tools/test_harness.py`; the interface runs off-Mac in
`tools/ui_smoke.py` against vanilla 0.5.0's real signatures. Its foundation was verified on Okay's Mac
with `tools/dial_probe.py`; beta 2.1's window ran on Okay's Mac (4 Oct); what's still to check there is in `docs/build-list.md`, Verify.

## Run

1. DrawBot 3.132 or newer (free, macOS 15 or newer for everything; older macOS falls back where it can).
2. Open `dial.py`, press ⌘R. A window opens. Running again replaces it and keeps the settings.
3. Optional, faster shape combining: DrawBot → Python → Install Python Packages → `skia-pathops`.

Off-Mac checks (Python 3, `pip install drawbot-skia skia-pathops pillow`):
`python tools/test_harness.py` (geometry → `test-renders/sheet.png`) and `python tools/ui_smoke.py` (interface).

## Files

| File | What it is |
|---|---|
| `dial.py` | The tool. One file, four parts: settings · geometry · drawing (the scene) · interface (window, canvas preview, frame clock). The dial is a list of rings. |
| `tools/dial_probe.py` | Foundation test for the interface. Run it in DrawBot when something breaks; its Report tab says which part failed. |
| `tools/test_harness.py` | Renders the geometry without a Mac (drawbot-skia) into a contact sheet; checks the PDF importer's drawing logic. |
| `tools/ui_smoke.py` | Runs the whole interface without a Mac on stand-ins that accept only what vanilla 0.5.0 accepts; drives the frame clock and compares the canvas's layers with the scene. |
| `tools/bool_bench.py` | Times shape combining: DrawBot's `booleanOperations` vs the harness's `skia-pathops`, on every harness dial (off-Mac). |
| `tools/vanilla-0.5.0-api.json` | vanilla 0.5.0's class signatures and method names, extracted from its source (used by the smoke test and for R13). |
| `docs/Dial-Tool-guide.pdf` | The guidebook: what it does, install, files in and out, FAQ. |
| `docs/guide/` | Its source: `pages/` (one file per page), `style.css`, `icons.svg`, `README.md` (how to write a page), figures (`img/`, generated), `presets/` (the classic dials as loadable settings). |
| `tools/guide_dials.py` | The classic dials shown in the guide, as Dial Tool settings. |
| `tools/make_guide.py` | Rebuilds the guidebook: figures drawn by dial.py itself, recipes printed from the same settings, PDF through Chromium. Fetches open fonts (Inter and stand-ins) into `docs/guide/cache`. |
| `docs/brief.md` | Goals, decisions, open questions, parked ideas. |
| `docs/rules.md` | Standing rules — check code against these in reviews. |
| `docs/design.md` | The design canon: type, grid, colour, pictures, redrawn controls — for the guide and anything else shown. |
| `docs/glossary.md` | Watch terms and tool terms, and which word means what here. |
| `docs/build-list.md` | Numbered open items, things to verify, ideas. |
| `docs/preview.md` | The preview: findings (flash, lag, blur), design, build steps, tests, the **Mac check (§6)**, and what the run changed (§12). |
| `docs/changelog.md` | Versions. |
| `docs/project-prompt.md` | Start-off prompt for the Claude Project. |
| `docs/beta-1.0-geometry.png` | Reference renders of beta 1.0. |
| `docs/beta-2.0-geometry.png` | Reference renders of beta 2.0: beta 1.0 dials converted to rings, a sector dial, a scale, imported shapes. |

## For agents

Read in this order: `README.md` → `docs/rules.md` → `docs/brief.md` → `docs/glossary.md` → `docs/build-list.md`.
Keep the docs up to date after every decision and flag inconsistencies between them.

## Licence

MIT — see [`LICENSE`](LICENSE). No fonts are kept in the repository; the guide's build fetches open-licence fonts.

## Where it lives

GitHub [`duztman/dial-tool`](https://github.com/duztman/dial-tool), public (branches `main` = released beta, `dev` = work in progress) ·
Claude Project "Dial Tool" · a Mac folder (later).
