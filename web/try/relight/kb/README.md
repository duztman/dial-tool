# Show Case 3D — the knowledge base

What the 3D exercise of 4–5 Nov 2026 learnt about drawing a watch photographically, kept so the work can be picked up, rebuilt, edited and searched. Branch `try/relight`; nothing here is on `dev` or the pages.

| Page | What it holds | Read it when |
|---|---|---|
| [`findings.md`](findings.md) | What the reference photographs settled, part by part — lug, band, end link, links, bezel, crown, light — each with the photo it comes from and whether the model has it yet | before touching any part's shape |
| [`system.md`](system.md) | The one rule (section × path × finish), the builders, the spec tables, the coordinate system, materials, light, views, how to add a case or a bracelet, how to shoot a crop | before writing code |
| [`rounds.md`](rounds.md) | Rounds 1–14: what each tried, what Okay said, what failed and why | to avoid repeating a mistake |
| [`open.md`](open.md) | What is still wrong or missing, in the order to do it | to pick the next round |
| [`refs.md`](refs.md) | The reference photographs, numbered, what each shows and which finding it backs | to find a picture again |

## Where things are

- **The model**: `web/try/relight/watch3d.html` (the page; three.js from jsdelivr), `scene.js` (the opener dial's parts, written by `dump.mjs`), `build.mjs` (one-file page for the private preview), `shot3d.mjs` (a crop from Chromium).
- **The preview**: the private artifact *Watch 3D trial*, https://claude.ai/artifact/81kwePNdWKxqEPTMoCBCi9 (round 16 published 5 Nov 2026: tangents, hard edges, the lug one block; every round is republished here).
- **The photographs**: not in the repo (R36). `ref-01…28` in `~/Desktop/dial-maker/screenshots/2026-11-05-3d-refs/` on Okay's Mac (sent as `3d-refs.zip`); `refs.md` is their index.
- **The earlier trial**: `relight.html` — the height-field relighting of round 1, kept as a record; superseded by the 3D build.

## How to pick it up

1. Read `findings.md` and `open.md`.
2. `cd web && npm install --no-save three@0.170.0`, then `node try/relight/shot3d.mjs out.png 300 35 studio photo diver oyster` for a crop (software GL in a session: slow, grainy AO, the numbers meaningless; the look is right).
3. Change the spec tables first, the builders second, the materials last. Every change: a crop in the chat, a line in `rounds.md`.
4. `node try/relight/build.mjs` makes the one-file page; publish it to the same artifact.

Rules that apply here as everywhere: R18 (nothing unprompted), R20 (third attempt → stop and ask), R21 (measure: shoot a side view before judging a height), R36 (pictures on the Mac). The Show Case's SVG paints (Engineer, Miyazaki) are untouched by all this: this is the Photo look only (Okay, 4 Nov 2026: "Miyazaki and engineer out of this exercise, they are svg only").
