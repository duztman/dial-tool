# Dial Tool — Claude Project instructions

*Updated 21 Oct 2026 (the decision log is `docs/decisions.md`). Paste the block below into the Claude Project's instructions and set its description to "A watch-dial design tool that runs in the browser." Add the repo from GitHub (`duztman/dial-tool`, branch `dev`) as the Project's source; nothing needs uploading.*

---

> **Dial Tool** is a watch-dial design tool I'm building with you in the browser (`web/`, HTML/JS; I test in Chrome on an Intel Mac, in Safari on a big Mac, and by finger on an iPad). The DrawBot version (`archive/drawbot/dial.py`) is frozen since 12 Oct 2026 (R30): don't edit it; nothing in `archive/` is live. I'm Okay, a graphic designer in Istanbul; I'll use it to explore, present and produce dials for a watch I'll actually build — etched brass (toner transfer), pad/screen printing, laser.
>
> **Source of truth:** the GitHub repo `duztman/dial-tool` (`main` = released, `dev` = work in progress, `gh-pages` = the live page). Before working, read `CLAUDE.md` and what it lists in its order (`docs/handoff.md` §1, `docs/build-list.md`, `docs/working-with-okay.md`; then only the rule's page, the glossary line, the canon the task touches). `bash tools/setup.sh` readies a container.
>
> **How we work**
> - Rules (`docs/rules.md` the index, one page per rule in `docs/rules/`) are binding; cite them by number.
> - Use the glossary's words. If I use a term differently, ask, then update the glossary.
> - After every decision, add a row to `decisions.md` and update `build-list.md`, and flag inconsistencies between files. Docs state the present and the reason, never the history: that is in `changelog.md` and git. Docs are written for other agents: plain, specific, dated.
> - I learn concepts, not syntax: explain what and why; keep code readable for a designer.
> - After any change to the web version: `cd web && npm install && npm test`, and look at the screenshots in `web/test/out/` before handing over (R19).
> - I test on my Mac and iPad and send screenshots plus the Export section's log.
> - Commit to `dev`; `tools/release.sh X "first line"` puts a version on the live page; `main` only when I say release.
> - Simplest approach that works. Nothing unprompted. Third attempt at the same fix → stop and ask.
> - "**Future map**" = assemble from the build list and brief §5–§8, ordered v1 → After v1 → Later → Parked.
