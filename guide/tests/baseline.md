# Reader test — baseline (step 3), the app alone

*15 Oct 2026, beta 4.41.12. Three fresh AI readers (no source, the app only, no guide) each built the target (`target/target-sheet.png`) on one device and exported a colour PNG, a mask PNG and the link. Scored with `tools/score.py` (marks laid over the target's mask at true size).*

| Reader | Device | Marks: worst distance | Actions (build + exploring) | Stalls |
|---|---|---|---|---|
| r1 | iPad landscape, touch | 0.042 mm · pass | 117 + ~80 | 9 |
| r2 | phone, touch | 0.042 mm · pass | 111 + ~40 | 13 |
| r3 | Mac, mouse | 0.060 mm · pass | 101 + ~70 | 13 |

**What the numbers don't say.** All three measured the target sheet with pixel scripts and all three started from the Gallery's *Field*, which is close to the target (same font, window style). So accuracy is not the signal for AI readers (BRIEF: they are judged on stalls); the humans' round is where time and accuracy count. Next target: further from every Gallery dial, and given to readers who are told not to measure pixels.

## Stalls, grouped (how many readers hit each)
1. **No blank start** (3/3). Found the Gallery or Defaults by searching every tab; Defaults sits under Export.
2. **The ring row's two numbers and the ring drawer's icons are unlabelled** (3/3). Size and radius live behind round icons; the meaning came from hover tags (Mac) or accessible names. On a marker ring the same slot is Length / Outer radius, on a numerals ring Size / Centre radius.
3. **"Every" and "Skip those instead"** (3/3): guessed right, but guessed.
4. **The 3 vanished on its own** when the window at 3 was shown (3/3); nobody found why.
5. **The window exists but is hidden** ("not shown", Show this window) (2/3).
6. **The time was 10:09:36, not 10:10** (2/3); the 10:10 step or typing fixes it.
7. **The Gallery pill and mm look disabled** (2/3) — they are live; both are drawn as light as the dead redo by choice (#197, #214).
8. **The page is the dial plus twice the margin** (1/3 needed it, worked out from the PNG line).
9. **Count 4 gives 12, 1, 2, 3**, not 12, 3, 6, 9 (1/3): numerals follow the positions in order; quarters come from Count 12 + Every 3, or Custom.
10. **What a hand's words mean** — Counter Ø, Tip length, sword vs disc (2/3).
11. **Mask: the tick changes what PNG writes** (1/3); **transparent PNG page** (2/3); **do Shadows reach the file?** (1/3).
12. **Phone: ring names cut to "H…", "Minu…"** (1/3). **The panel's top stays put while the rest scrolls** (2/3, mouse wheel over the pinned part did nothing).
13. **Tapping a kind tile changes the ring at once** while exploring (1/3); undo brings it back.
14. **The address lagged behind the dial** (1/3). Reproduced: while time plays, a change isn't kept in the address or the browser until time stops (filed #234).

## What this changes in edition 1
- First dial starts from Defaults *or* a Gallery dial, and says where both are.
- The screen names the ring row's numbers and the drawer's icons (size, radius) — the most common stall.
- Find it gains: "why did the 3 vanish", "why is my window not showing", "four numerals at the quarters", "the time isn't 10:10", "where is the page size from".
- Four models (4) adds: while time plays, saving waits until it stops (until #234 is fixed).
