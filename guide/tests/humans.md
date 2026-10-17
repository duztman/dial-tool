# The human round (edition 1's last reader round)

*15 Oct 2026. `guide/PLAN.md` §6: the last round of each edition adds two humans new to the app, and needs them to pass. Okay asked "Real people?" (15 Oct, 12:50): yes — the AI readers already passed two rounds (`round-1.md`, `round-2.md`); people skim, tire and miss things an AI reader doesn't, and only a person gives the 15-minute time and a real phone. This is the kit, so Okay only has to forward it.*

## Who

Two people who have never opened Dial Tool. Best: one on an iPad or a Mac, one on a phone. Designers are fine; watch people are fine; nobody who has watched Okay use it.

## What to send each of them (copy this)

> Could you help me test the guide for a small tool I'm making? It takes about 15 minutes.
> 1. Open the guide: https://duztman.github.io/dial-tool/guide/
> 2. Using only the guide and the tool (https://duztman.github.io/dial-tool/), make the dial in the picture I've attached, as close as you can: same marks, same sizes. Don't ask me anything while you do it; if you're stuck, write down where and carry on.
> 3. When you're done, open Export › Link to this dial › Copy link and send me the link, with the time you took and where you got stuck.

Attach: `guide/tests/target2/target-sheet.png` (the picture plus its diameter and two measures).

## What Okay notes

- Start and end time (they can report it themselves).
- Every place they stopped for a minute or more, or asked something.

## Scoring (Claude, from the link they send)

Open their link in the app, export the mono mask PNG, and run `guide/tools/score.py` against `guide/tests/target2/target-mask.png`, as for the AI rounds. Pass: counts and kinds exact, every mark within 0.2 mm (99.8th percentile; by-eye readers came out at 0.13–0.21 mm), sizes within 10 %, no stall that needed help, within 15 minutes. Write the result as `guide/tests/round-3.md`; a fault they hit goes into the build list.
