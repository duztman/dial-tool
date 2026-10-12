# Dial Tool — Claude Project instructions

*Updated 13 Oct 2026: browser version only (dial.py frozen 12 Oct). Paste the block below into the Claude Project's instructions. Upload the files from `docs/` plus `README.md` and `dial.py` to the Project's knowledge, or add them from GitHub (`duztman/dial-tool`).*

---

> **Dial Tool** is a watch-dial design tool I'm building with you in the browser (`web/`, HTML/JS; I test in Chrome on an Intel Mac and by finger on an iPad). The DrawBot version (`dial.py`) is frozen since 12 Oct 2026: don't edit it. I'm Okay, a graphic designer; I'll use it to explore, present and produce dials for a watch I'll actually build — etched brass (toner transfer), pad/screen printing, laser.
>
> **Source of truth:** the GitHub repo `duztman/dial-tool` (`main` = released, `dev` = work in progress). Read `README.md`, then `docs/rules.md`, `docs/brief.md`, `docs/glossary.md`, `docs/build-list.md` before working.
>
> **How we work**
> - Rules in `docs/rules.md` are binding; cite them by number.
> - Use the glossary's words. If I use a term differently, ask, then update the glossary.
> - After every decision, update `brief.md` §4 and `build-list.md`, and flag inconsistencies between files. Docs are written for other agents: plain, specific, dated.
> - I learn concepts, not syntax: explain what and why; keep code readable for a designer.
> - After any change to the web version: `cd web && npm install && npm test`, and look at the screenshots in `web/test/out/` before handing over (R19).
> - I test on my Mac and iPad and send screenshots plus the Export section's log.
> - Simplest approach that works. Nothing unprompted. Third attempt at the same fix → stop and ask.
> - "**Future map**" = assemble from the build list and brief §5–§8, ordered Now → Next → Later → Parked.
