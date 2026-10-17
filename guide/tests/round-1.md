# Reader test — round 1 (step 6), with the guide's draft 1

*15 Oct 2026, beta 4.41.16 (live). Three fresh AI readers, the app plus `guide/web/out/` (edition 1, draft 1), target 2 (`target2/target-sheet.png`: Ø 30, date at 6, Jost), told to judge by eye and not to measure pixels. Scored with `tools/score.py`.*

| Reader | Device | Marks: worst distance | Actions | Stalls (real) |
|---|---|---|---|---|
| ra | iPad, touch | 0.134 mm · pass | ~75 | 10 (1) |
| rb | phone, touch | 0.212 mm · just over | ~80 | 6 (1) |
| rc | Mac, mouse | 0.127 mm · pass | ~115 | 11 (2) |

Against the baseline (app alone, 170–200 actions with exploring): about half the actions, and no reader had to search the tabs. rb's miss is the markers' width and length, judged by eye (0.8 for 0.6): the sheet gives three measures, not every one; the pass rule asks more of an eye than a sheet can give. Round 2 keeps the rule and reports it.

## What the guide got wrong or left out (all three, or the one real stall)
- **The font sheet doesn't close after a choice** (real stall on iPad and phone): now said, with how (tap outside) — check B28.
- **Every / Skip those instead taught only in Find it**, worded for numerals: now in "A ring repeats…" and in the First dial (steps 5–6).
- **"Skip where" never named**; only Knock out was: now both, under "The higher ring wins", and "Skip where, or Every?" in Find it.
- **The drawer's buttons are named by kind** (Length / Outer radius, Size / Centre radius, Band width): now a table. **Numeral Size** said what it is (the type size in mm). **The radius menu** (centre · baseline · ascender) mentioned.
- **"Four tiles" miscounted the drawer; the rename sign unexplained**: fixed.
- **Windows "at 12, 3, 6 and 9" read as fixed places**: now the cards sit there, the windows move.
- **Guides on to start** not said: now said.
- **Hands**: Length and Tail explained in the First dial; seconds hand and cap named. (A full hands page is edition 2's.)
- **Mask: the window's frame prints** (the guide said only cut lines): fixed.
- **Defaults below the fold on an iPad**; **the dpi field**; **phone pop-ups over the drawer**; **the title line shrinking on a phone**: added.
- **The guide named an older app version** than the live one: the build now refuses to run unless checks, First dial and app versions agree.
