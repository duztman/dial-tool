# Dial Tool

A parametric watch-dial design tool that runs inside [DrawBot](https://www.drawbot.com) on macOS.
Built to explore, present and produce dials for a watch Okay will actually build.

**Status: beta 2.2 (4 Oct 2026)** — rings, on `main` and `dev`. **Start here: [`docs/Dial-Tool-guide.pdf`](docs/Dial-Tool-guide.pdf)** — the 5-page guidebook.
Geometry is tested off-Mac with `tools/test_harness.py`; the interface runs off-Mac in
`tools/ui_smoke.py` against vanilla 0.5.0's real signatures. Its foundation was verified on Okay's Mac
with `tools/dial_probe.py`; the full window has not run on a Mac yet (see `docs/build-list.md`, Verify).

## Run

1. DrawBot 3.132 or newer (free, macOS).
2. Open `dial.py`, press ⌘R. A window opens. Running again replaces it and keeps the settings.

Off-Mac checks (Python 3, `pip install drawbot-skia skia-pathops pillow`):
`python tools/test_harness.py` (geometry → `test-renders/sheet.png`) and `python tools/ui_smoke.py` (interface).

## Files

| File | What it is |
|---|---|
| `dial.py` | The tool. One file, four parts: settings · geometry · drawing · interface. The dial is a list of rings. |
| `tools/dial_probe.py` | Foundation test for the interface. Run it in DrawBot when something breaks; its Report tab says which part failed. |
| `tools/test_harness.py` | Renders the geometry without a Mac (drawbot-skia) into a contact sheet; checks the PDF importer's drawing logic. |
| `tools/ui_smoke.py` | Runs the whole interface without a Mac on stand-ins that accept only what vanilla 0.5.0 accepts. |
| `tools/vanilla-0.5.0-api.json` | vanilla 0.5.0's class signatures and method names, extracted from its source (used by the smoke test and for R13). |
| `docs/Dial-Tool-guide.pdf` | The guidebook: what it does, install, files in and out, FAQ. |
| `docs/guide/` | Its source: `guide.md`, figures (`img/`), IBM Plex Mono (`fonts/`, SIL OFL). |
| `tools/make_guide.py` | Rebuilds the guidebook (figures rendered by dial.py itself). |
| `docs/brief.md` | Goals, decisions, open questions, parked ideas. |
| `docs/rules.md` | Standing rules — check code against these in reviews. |
| `docs/glossary.md` | Watch terms and tool terms, and which word means what here. |
| `docs/build-list.md` | Numbered open items, things to verify, ideas. |
| `docs/changelog.md` | Versions. |
| `docs/project-prompt.md` | Start-off prompt for the Claude Project. |
| `docs/beta-1.0-geometry.png` | Reference renders of beta 1.0. |
| `docs/beta-2.0-geometry.png` | Reference renders of beta 2.0: beta 1.0 dials converted to rings, a sector dial, a scale, imported shapes. |

## For agents

Read in this order: `README.md` → `docs/rules.md` → `docs/brief.md` → `docs/glossary.md` → `docs/build-list.md`.
Keep the docs up to date after every decision and flag inconsistencies between them.

## Licence

MIT — see [`LICENSE`](LICENSE). The IBM Plex Mono fonts in `docs/guide/fonts/` are under the SIL Open Font
License ([`OFL.txt`](docs/guide/fonts/OFL.txt)).

## Where it lives

GitHub [`duztman/dial-tool`](https://github.com/duztman/dial-tool), public (branches `main` = released beta, `dev` = work in progress) ·
Claude Project "Dial Tool" · a Mac folder (later).
