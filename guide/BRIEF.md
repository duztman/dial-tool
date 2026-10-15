# Guide brief — step 2 of `guide/PLAN.md`

*15 Oct 2026. One page; what step 3 onwards is held to. Changes need Okay's word.*

**Readers.** Newcomers sent a link (first) · Okay, later · a maker or printer (the maker sheet). Not developers.

**Editions.**
- Edition 1, web, ~10 screens: four models · the screen (and its phone page) · first dial · find it · maker sheet.
- Edition 2, web + print: build (8 spreads) · present and share · shortcuts · Gallery recipes (4) · reference (generated); print A4 landscape, ~26 pages.
- Address: `https://duztman.github.io/dial-tool/guide/` (the `gh-pages` branch, beside the app). Source: `guide/` on `dev`.
- English only.

**What it follows.** The current app; rebuilt when the picture diff on a release flags a change. Captions carry the app version.

**Devices.**
- Interface pictures: iPad landscape, 1180 × 820 points at 2×, stated on each.
- Phone pictures: 390 × 844 at 3×, only where the phone differs (bar on top, drawer, folded switches, cut names).
- Print scale: 1 iPad point = 0.2 mm on A4.

**Look.** Okay's notes (`docs/guide/notes-okay.md`) and the design canon (`docs/design.md`); decided on three spreads in step 7, at A4 and at 390 px from one source.

**Truth.** Every "do X and Y happens" sentence has a scripted check (behaviours B1–B20 in `inventory/inventory.md` to start). Advice goes on the dated release checklist.

**Reader test.**
- Target sheet: one dial at true size plus its diameter and two key dimensions, not in the Gallery or the guide. Made in step 3.
- Pass: the reader's export laid over the target at true size; counts and kinds exact, every mark within 0.2 mm, sizes within 10 %, no stall needing outside help; humans also within 15 minutes. Times reported raw.
- Stall: for humans, 60 s without progress or a question asked; for AI readers, stall count and accuracy.
- Readers: fresh AI readers (the app only, no source) each round; the last round of each edition adds two humans new to the app, who must pass. At most two rounds.

**Release conditions for edition 1.** A help link in the app (#230). The starting dial's missing font (#228): until fixed, First dial changes the font to a bundled one.

**Hours.** Logged per step in `guide/HOURS.md`; check scripts count as pipeline; pipeline at most a third.

**Open, for Okay**
1. The two humans for the last reader round: who?
2. The help link (#230) is an app change: where should it sit (the mark's bio, the title line, the Export tab)?
3. The old guide's files (`docs/guide/`, `tools/make_guide.py`, `tools/guide_dials.py`): archive them under `archive/`, or leave them where they are?
