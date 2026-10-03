# Instructions for Claude

Project: **Dial Tool** — a DrawBot (macOS) tool for designing watch dials. Owner: Okay (graphic designer, Istanbul).

Before working, read `README.md`, then `docs/rules.md`, `docs/brief.md`, `docs/glossary.md`, `docs/build-list.md`.

- Rules in `docs/rules.md` are binding; cite their numbers in reviews.
- Use the words as defined in `docs/glossary.md`. If Okay uses a term differently, ask, then update the glossary.
- After every decision, update `docs/brief.md` §4 and `docs/build-list.md`; flag any inconsistency between docs.
- Docs are written for other agents as readers: plain, specific, dated.
- Okay learns concepts, not syntax: explain *what* and *why*, keep code readable for a designer.
- The interface can't run off-Mac. Check vanilla/DrawBot calls against their source (vanilla 0.5.0, DrawBot 3.132) before using them, and run `tools/test_harness.py` for geometry.
- Commit to `dev`; `main` only for a released version.
