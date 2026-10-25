# R32a · Sizes of type

Sizes of type are the `--t-` tokens only: four, and `--t-xxs`, 10, and one for the bottom bar alone, `--t-time`, 20, the time (Okay, 14 Oct 2026, 23:55); the smallest, for the font sheet's legend and the font box's quiet buttons, Lang. and Change…, which are three quarters of a button, `--control-s` (Okay, 14 Oct 2026).

`--t-pixel` (8) is for the pixel font, Silkscreen (and, for the bar's time and AM · PM alone, Dial Time — Barlow Condensed Light, packed, `--time-face`, #284). It sets the tiny numbers inside small drawings (a value button, the numerals picture) and the **stickers**, and is used at that size or its double, 16 (a sticker in a font box), never between — one exception: the font sheet's legend (title and stickers), at 12 (Okay, 14 Oct 2026: ".5 more size on all silkscreen"; on a 2× screen, as the iPad and the Macs are, its dots still fall on the screen's). Pixel type stands at `--pixel-ink` (70 %) of its colour (Okay, 13 Oct 2026) — but the "1×" over the bottom bar's speed ball is in the ball's own colour (Okay, 15 Oct 2026: "same color as the ball").

A short label in a box of its own is listed in `INKED` (`web/src/ink.js`): it gets proportional figures and is centred on its ink, measured, never nudged by hand (design canon §2; Okay, 14 Oct 2026); numbers that change in place stay tabular.

**Checked by:** `node test/same.mjs`; `web/test/layout.mjs`

Back to the index: [rules.md](../rules.md)
