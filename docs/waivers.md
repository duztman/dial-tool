# Dial Tool — waivers

Every time an old link was allowed to draw something other than what it drew when it was made (R31). One row per change. Written for agents: plain, dated, with Okay's words.
*Started 16 Oct 2026, from what the brief, the build list and the rules already said (nothing here is new; it was spread over three files and a paragraph of R31).*

## How to use it

- A change that makes an old link draw or export differently needs **a new link scheme** (R31, build list #292) **or Okay's waiver**. Ask him before; write the row here when he says yes, with his words and the date.
- A change that is **preview-only** (guides, shadows, the window's look) needs no waiver, but is listed here so the count is visible (R5, R26).
- The golden-link test (build list #291, not built yet) will fail on any difference between a stored link and what it drew before, unless the change has a row here. When a waiver is given, the golden links it touches are re-saved in the same commit.
- Audience: on 14 Oct 2026 Okay said two people had been given links ("2 people got them till now"). The Gallery's dials and the guide's pictures are links too. Count them when a waiver is weighed.

## Waivers and changes so far

| # | Date | Beta | What changed | An old link now | Export? | Okay's words | Kind |
|---|---|---|---|---|---|---|---|
| W1 | 13 Oct 2026 | 4.7 | An am · pm window follows the time shown; its `hour` key stays but nothing reads it (build list #79) | An am · pm window shows the link's time, not its stored hour | yes (the window is drawn in every export) | Yes on atlas 2.6 ("am · pm follows the time shown"). *"Always follow" was Claude's recommendation, listed before building and not objected to; there was no separate ask about old links.* | recorded afterwards |
| W2 | 14 Oct 2026 | 4.37 | The centre hole: `dial_hole` starts at 2.7 mm (build list #165) | Every old link gets a hole in its plate | yes | 18:00: "do not care about the earlier links. 2 people got them till now." | waiver |
| W3 | 15 Oct 2026 | 4.38 | Shadows on by default (`sh_*`, new keys; build list #189) | Every old link shows shadows in the preview | no (R5, R26) | 01:08: "let this take over the main dial tool page" | preview only |
| W4 | 15 Oct 2026 | 4.38.5 | Guides' starting values: centre lines pink, no window radii, the selected ring's only, the dial edge's guide gone (build list #192) | Old links that kept the old starting values see the new guides | no | 02:06: "set these defaults" | preview only |

## A fix, not a waiver

- **14 Oct 2026, beta 4.37 (#168):** a circle, polygon or arc window's frame was grown by `offset()`, which bulged a circle by up to 6 % at 45°; it now grows by the shape's own measures. An old link with a framed window of those shapes draws that frame up to 6 % differently, in exports too. Okay asked for the fix ("adding stroke to that creates a weird 4 petal blob… investigate"). Listed because the golden-link test will see it.

## Asked, not decided

- **#262 (16 Oct 2026):** the cap as part of the seconds hand, "off by default" when the watch has no seconds hand. Taken literally it removes the cap from old dials that have no seconds hand. Until Okay says otherwise the cap keeps today's value (`ha_cap`, `c_cap` stay as they are; only where it is edited moves).
