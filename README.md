# Dial Tool

A parametric watch-dial design tool that runs inside [DrawBot](https://www.drawbot.com) on macOS.
Built to explore, present and produce dials for a watch Okay will actually build.

**Status: beta 1.0.1 (4 Oct 2026)** — on `dev`; `main` holds beta 1.0. Geometry is tested off-Mac with `tools/test_harness.py`.
The interface was checked against the vanilla and DrawBot sources and its foundation verified on
Okay's Mac with `tools/dial_probe.py`; the full beta window has not run on a Mac yet
(see `docs/build-list.md`, Verify).

## Run

1. DrawBot 3.132 or newer (free, macOS).
2. Open `dial.py`, press ⌘R. A window opens. Running again replaces it and keeps the settings.

## Files

| File | What it is |
|---|---|
| `dial.py` | The tool. One file, four parts: settings · geometry · drawing · interface. |
| `tools/dial_probe.py` | Foundation test for the interface. Run it in DrawBot when something breaks; its Report tab says which part failed. |
| `tools/test_harness.py` | Renders the geometry without a Mac (drawbot-skia) into a contact sheet. |
| `docs/brief.md` | Goals, decisions, open questions, parked ideas. |
| `docs/rules.md` | Standing rules — check code against these in reviews. |
| `docs/glossary.md` | Watch terms and tool terms, and which word means what here. |
| `docs/build-list.md` | Numbered open items, things to verify, ideas. |
| `docs/changelog.md` | Versions. |
| `docs/project-prompt.md` | Start-off prompt for the Claude Project. |
| `docs/beta-1.0-geometry.png` | Reference renders of beta 1.0. |

## For agents

Read in this order: `README.md` → `docs/rules.md` → `docs/brief.md` → `docs/glossary.md` → `docs/build-list.md`.
Keep the docs up to date after every decision and flag inconsistencies between them.

## Where it lives

GitHub `duztman/dial-tool` (branches `main` = released beta, `dev` = work in progress) ·
Claude Project "Dial Tool" · a Mac folder (later).
