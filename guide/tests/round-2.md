# Reader test — round 2 (step 6), with the guide's draft 2

*15 Oct 2026, beta 4.41.17. Three new fresh AI readers, the app plus edition 1 draft 2, target 2, judging by eye. Scored with `tools/score.py`. The last AI round (BRIEF: two rounds at most); the humans' round comes with edition 1's release.*

| Reader | Device | Marks: worst distance | Actions | Stalls (real) |
|---|---|---|---|---|
| ra | iPad, touch | 0.212 mm · just over | ~75 build (~109 with mis-taps) | 8 (2) |
| rb | phone, touch | 0.175 mm · pass | ~110 (32 of them colours) | 9 (2) |
| rc | Mac, mouse | 0.127 mm · pass | ~115 | 11 (1) |

Round 1 → round 2: the round-1 stalls are gone (font sheet, Every / Skip where, the drawer's buttons, the window that moves). No reader found a sentence that was wrong except three about closing things, all fixed in draft 3 with checks behind them. ra's 0.012 mm over is the markers' length judged by eye (2.2 for 2.0): the sheet gives three measures, so the 0.2 mm rule really belongs to the humans' round with a fuller target sheet.

## Fixed in draft 3
- **"Its square closes" the colour pop-out — wrong**: the × closes, the square doubles it (B30).
- **The value pop-up on a touch screen isn't ready to type**: tap the number first; a tap elsewhere closes it (B24).
- **Phone: the font sheet covers the dial too**, so "tap outside" landed on a font: close it on the top bar (B28p). **Phone: the red button at the top left is Play**, and while time runs nothing is kept (B1p) — the Watch note moved beside it.
- **Panes fold with their eye** (a mis-tap folded one): said (B29).
- **Window at 6 is "Window 3"** in the colour list and the files: explained (B31); filed with #231.
- **Width and Counter Ø on hands; Width, Height, Size % on windows; marks' Width in the Shape pane**: said.

## Faults found in the app (filed, #244)
The size pop-up's field is announced by its hint ("1.2 sets · +0.5 adds…"), the Type pane's Size as "Size Size"; colour chips are announced only by their hex; ring rows can't be reached from the keyboard; the panel stays readable to a screen reader inside the showcase.
