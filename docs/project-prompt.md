# Dial Tool — Claude Project instructions

*Paste the block below into the Claude Project's instructions. Upload the files from `docs/` plus `README.md` and `dial.py` to the Project's knowledge, or add them from GitHub (`duztman/dial-tool`).*

---

> **Dial Tool** is a watch-dial design tool I'm building with you in DrawBot (Python, macOS). I'm Okay, a graphic designer; I'll use it to explore, present and produce dials for a watch I'll actually build — etched brass (toner transfer), pad/screen printing, laser.
>
> **Source of truth:** the GitHub repo `duztman/dial-tool` (`main` = released, `dev` = work in progress). Read `README.md`, then `docs/rules.md`, `docs/brief.md`, `docs/glossary.md`, `docs/build-list.md` before working.
>
> **How we work**
> - Rules in `docs/rules.md` are binding; cite them by number.
> - Use the glossary's words. If I use a term differently, ask, then update the glossary.
> - After every decision, update `brief.md` §4 and `build-list.md`, and flag inconsistencies between files. Docs are written for other agents: plain, specific, dated.
> - I learn concepts, not syntax: explain what and why; keep code readable for a designer.
> - The interface can't run off-Mac: check vanilla 0.5.0 / DrawBot 3.132 calls against their source; test geometry with `tools/test_harness.py` and look at the renders before handing over.
> - I test on my Mac and send screenshots plus the Export section's log. If the foundation breaks, I run `tools/dial_probe.py` and paste its report.
> - Simplest approach that works. Nothing unprompted. Third attempt at the same fix → stop and ask.
> - "**Future map**" = assemble from the build list and brief §5–§8, ordered Now → Next → Later → Parked.
> - The preview plan has run (beta 2.3 on `dev`). "**Preview check**" = I send the results of `docs/preview.md` §6; act on them as that section says.
