# Handoff — taking over the Dial Tool

*Written 16 Oct 2026, night, at beta 4.46.5, by the session that built 4.42–4.46.5 (Okay: "devise way to handoff to another agent"). For the next Claude session on this repo. §1 is rewritten at every handover; the rest changes when something new is learnt.*

A new session starts with no memory of the last one: the transcript stays in the old container. Everything a successor needs is in the repo. Use this page to find it.

## 1 · Where things stand (16 Oct 2026, night)

- **Beta 4.46.5** is on `dev`, on `main` and on the live page (https://duztman.github.io/dial-tool/). `main` was 4.41 until tonight.
- **The plan** is the phases A–J in `docs/build-list.md`, under *From Okay's notes on the dial app* (16 Oct 2026). A–F are done. What's left, in order:
  1. **One small push, no sketch needed** (4.46.6):
     - #310: the number popup, third look: the name on top, lighter; the chevron without a box; the value pill as tall as the ± discs; the slider moved up.
     - #307: NOW darker. The reading is still open: "darker than AM's outlines by 20 %" ≈ a fill of #5C5C5C, with a light word. Say the value when it's built.
     - #308: the play pulse at slow speeds: much faster, brighter, and an eased fade.
  2. **G · rings** (4.47–4.48):
     - #251, #253 and #258 wait for Okay's sketches: ask for them, don't build from the words alone.
     - #254–#257, #259 and #296 can be built.
  3. **H · fonts** #273–#276 · **I · text ring** #297 · **J · Gallery** #286–#289.
- **Loose ends:**
  - #244: names a screen reader hears.
  - #294: the specials with no figure from Okay, for him to look through.
  - #182 and #185: two bugs from 4.36.1, maybe gone since. Check them before fixing.
- **Okay's Mac copy** is due for a `git pull` (CLAUDE.md, last line). It needs the session linked to his Mac.
- **Okay's last words**, after 4.46.5: "Release on main, devise way to handoff to another agent."

## 2 · First steps in a new session

1. `bash tools/setup.sh`: the system library, the Python packages, the two test fonts, `npm install`. Safe to run twice.
2. Read what CLAUDE.md lists, in its order. Two places hold the recent work:
   - the last ~25 rows of `docs/brief.md` §4;
   - the build list's rows #249–#311 with the phases above them.
3. `git log --oneline -15 dev` and `docs/versions.md`'s top rows confirm where things stand.
4. `cd web && npm test > some.log 2>&1` (about 6 minutes). See it pass before changing anything, and look at `web/test/out/`.

## 3 · The loop, one version at a time

1. **Change** `web/src/`:
   - `app.js`: the panel. Each tab's rows are tables (`ROWS`) built by `build_row`; rows of their own are `row_*` methods.
   - `geometry.js`: the drawing, `VERSION`, the link keys (`LINK_KEYS`, append only, R31).
   - `css/`: one cascade layer per file, R32. The spacing scale is in `1-tokens.css` (`--unit` 5.5 px, `--u1`–`--u8` in half-units). One-off values go in its specials block, with Okay's words.
2. **Look while working:**
   - `node build.mjs`, then `node test/shot.mjs out.png` (one screenshot) or `node test/look.mjs` (every tab).
   - For spacing, measure the DOM with a few lines of Playwright (`getBoundingClientRect`), never by eye.
3. **Guard it:** add or change a check in `web/test/window.mjs`. Its message quotes Okay's words, so a later session sees why it's there.
4. **Test:** `npm test`, then look at the screenshots (R19).
5. **Docs:**
   - `docs/changelog.md`: a new section on top.
   - `docs/brief.md` §4: a row after the last one.
   - `docs/build-list.md`: the item's status, as "done — 4.x.y (…)".
   - The glossary and rules if a word or a rule changed.
6. **Bump** in three places:
   - `VERSION` in `web/src/geometry.js`;
   - README line 8;
   - CLAUDE.md's *Web version* line.

   Run `node build.mjs`, then make one commit on `dev`: "beta X: first line", with the attribution trailers your session gives you.

   Numbering: a small push counts in the third number (4.46.5 → 4.46.6); a phase counts in the second (4.47).
7. **Release:**
   - `tools/release.sh X "first line"` adds the row in `docs/versions.md`, pushes `dev` and copies the build to the live page.
   - When Okay asks for a release, `tools/release.sh main` (fast-forward only).
   - Tags can't be pushed from a session (CLAUDE.md, *Versions*).
8. **Reply** to Okay: short bullets with what changed, the values used, and what's open. He reads on an iPad.

## 4 · Working with Okay — what the other docs don't say

- **His feedback** is annotated screenshots from an iPad or a Mac. Coloured marks mean what that message says. On 4.46, for example: green passed, blue = check spacing, red = change, purple = smaller. If the colours aren't explained, ask.
- **He types fast**, often on an iPad with a Turkish keyboard ("İ" for "I", "wo fit" for "to fit"). Read for intent. In the docs, quote him with only the certain typos mended.
- **Amounts** ("a bit", "much", "x0.5") follow the scale in his preferences. Take the smaller reading and say which value you used.
- **"Proceed automatically"** (16 Oct): go from push to push without asking. Two exceptions:
  - an item marked *sketch first*;
  - a genuinely open reading. Ask once, with a picture: he asked for "better visuals" when asked.
- **Final words.** "DONE, NO MORE DISCUSSION", "trust me", "the answer's there": build exactly that, no alternatives.
- **"Note and move on"**: the note goes to the build list, not into the push at hand.
- **On round three** of the same fix: stop, measure, ask. It's his rule.
- **The bigger picture.** He says he dives into details and loses it; flag it when you see it. Tonight's case: `main` was 53 versions behind `dev`.
- **Don'ts:**
  - Never bring up `try/shadows` again.
  - Don't commit his notes or PDFs as files: quote them into the docs.
  - Don't change the bar's monospace unasked.
  - Don't rebuild the guide unasked.
  - Don't edit `archive/drawbot/`.
- **"p. N" in the build list** is a page of his PDF *Notes on dial app* (21 pages, on his Google Drive; readable through a Google Drive connector if the session has one). The row's text is the full reading. Ask him for the page if it isn't enough.

## 5 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to §4 whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `docs/handoff.md`, then what CLAUDE.md lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
