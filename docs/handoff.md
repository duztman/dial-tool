# Handoff — taking over the Dial Tool

*Written 16 Oct 2026, night, at beta 4.46.5, by the session that built 4.42–4.46.5 (Okay: "devise way to handoff to another agent"); §1 rewritten 18 Oct 2026 at beta 4.59 by the session that read notes 2 and ran the two hours (before: 17 Oct at 4.51.1 and 4.49.1). For the next Claude session on this repo. §1 is rewritten at every handover; the rest changes when something new is learnt.*

A new session starts with no memory of the last one: the transcript stays in the old container. Everything a successor needs is in the repo. Use this page to find it.

## 1 · Where things stand (18 Oct 2026, night, after the two-hour run)

- **Beta 4.80** (#370 a hub on the hands, #368 the side handles move where a hand is widest) is on `dev` and the live page; next a check of 4.70–4.78 (#373); before it 4.79 (Okay's notes on 4.78, #364–#375: the guides' list scrolls with its settings below, hand bevels off by default, hand names on touch, Case and Strap in the bottom-left list); **LINK_KEYS: append only at the end, and to `web/test/link-keys.json`** (4.72–4.75 inserted mid-list, found in 4.79); waiting on Okay for #364 (his sketch) and #365 (the shine ring's centre); before it 4.78 (#349 mechanism: pick any mark on the dial, nudge it, give it a shape of its own), 4.77 (#351, #354: the showcase's light, bevels on the hands), 4.76 (#347: your own dials), 4.75 (#348: the print sheet), 4.74 (#346: a date's neighbours, the big date), 4.73 (the moon's and am · pm's pictures), 4.72 (the windows' discs — X-ray, dashed disc edges, physics); next the build list (Okay, 23:52: "go on to other work after this"); before it 4.71 (#345: handles on the hand's picture), 4.70 (#329: a hand's number lights its part); the complications' disc sketches (a canvas in Okay's claude.ai) — all twelve picked, 18 Oct, 23:52; before it 4.69 (straps and bracelets, the strap colour; the view fits the dial again), 4.68 (touch reversal, the phone's controller at 75%, hand rows, the font sheet), 4.67 (Wear OS export), 4.66 (a case round the dial, preview only), 4.65 (handles on the guides), 4.64 (one number box everywhere), 4.63 (tags wrap; the phone bar; the date in Inter), 4.62 (the date in the bar; windows that follow it), 4.61 (the complications act like tabs), 4.60 (his iPad notes: a finger opens the controller from any − + or field; the kinds menu without its note), 4.59 (Tiny Preview; Guides at the bottom left), 4.58 (the quiet number and its ± one press that opens the controller), 4.57 (a window's width and height linked by a LINK pill), 4.56 (Positions after his drawing: the preview large and draggable, menus and number blocks), 4.55 (the selected ring after his PSD: size and radius in Dial Mono in the row, the details written out, the kind from the row's icon; and a fix: 4.54 stopped the panel on selecting a ring whose font is not in the catalog), 4.54 (the font box after his drawing), 4.52 pushed once Okay granted access, 18 Oct, 18:55; 4.52.1 his eye pass and 4.52.2 his answers went live with 4.53; 4.53 tangent numerals, a still drawing on an anchor change, a mark's nudge); **`main` is 4.46.5**.
- **4.52** = Okay's *Dial tool notes 2* (a Google Doc with 23 pictures; his Photoshop drawings `font-selector_171026`, `selected-ring_181026` and `svg/controller 2.svg` in his Mac's `dial-maker/`), written down as **build list #316–#359**, each ranked *now · next · mechanism · later*. The *now* ones are built (the controller's second drawing, his link as the opener, Copy link for WebKit, Blank face, Complication, the Show tick, the Guides list's bottom section, the zoom area and two-finger moving, G for guides, the Gallery card, tags, the showcase's arrow and ✕, the icon archive). Changelog 4.52 lists them.
- **The two-hour run** (18 Oct, from 19:02, Okay: "Rest is good, common sense wins go thankyou"): 4.55 the selected ring after his PSD (#335, #327); 4.56 Positions after his drawing (#357); 4.57 W × H linked (#358); 4.58 the quiet ± one press (#317); 4.59 Tiny Preview with Guides at the bottom left (#337); the complications' engine `web/src/moment.js` with `test/moment.mjs` (#346, not in the window yet). Each version released live after `npm test`; the live page checked in the built-in browser at 4.57.
- **Next, in order:** what §5 24–26 settle (which pairs get the LINK pill; Complication as tabs; where the day is set and whether windows follow it — then the engine goes into the window); #349 picking one mark (its design); #339 Nudge one numeral, friendlier; #329 and #345 the hands' preview gestures; #347 instances, #348 printing, #351 and #354 the showcase's shine and bevels — these need his drawings or eye.
- **After the run** (18 Oct, 20:39 → night): 4.60 his iPad notes; 4.61 complications as tabs; 4.62 the date in the bar. farukahmet's three PRs (#1–#3, branches fetched as `pr-1`…`pr-3`) read; only their `build.mjs` fix folded in.
- **Okay's notes of 21:20** (18 Oct): 4.63 tags wrap, the phone's bar, the date in Inter; 4.64 one number box everywhere (R15); 4.65 handles on the guides (PR #2 our way); 4.66 a case round the dial (PR #3 abstractified, R26); 4.67 Wear OS export (PR #1 ported). The PR branches stay fetched as `pr-1`…`pr-3`; nothing was posted on GitHub — the PRs are still open there for Okay to close.
- **Waiting for Okay** (brief §5): nothing open (Jev dropped 22:35). To see: the cases (do the four silhouettes work?), the handles under a finger, the APK on a real watch. Also to see: 4.55–4.59 on the iPad (Copy link #332 is still unverified on WebKit).
- **Okay's last words** (18 Oct, 19:02): "Rest is good, common sense wins go thankyou".

## 2 · First steps in a new session

1. `bash tools/setup.sh`: the system library, the Python packages, the two test fonts, `npm install`, and the clone's fetch widened to every branch (a session's clone is shallow, so single-branch; without that `release.sh` builds the live page on a stale `gh-pages` — found 17 Oct). Safe to run twice.
2. Read what CLAUDE.md lists, in its order. Two places hold the recent work:
   - the last ~25 rows of `docs/brief.md` §4;
   - the build list's rows #249–#315 with the phases above them.
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
- **His notes mid-work are notes, not stops** (17 Oct): "if new chats come in that means I'm just putting down notes, not to do now in this session. Report later. Go ahead." Put them in the build list under the phase they belong to and carry on.
- **Minimal input, push through** (17 Oct): "I trust you to push through … Check back with approved fittings before proposing new views. Old stuff trumps what you don't get from my instructions, distances centerings all under rule." So: reuse a fitting he has passed (a menu beside a label, the gripper's measures, the tab look) before drawing anything new; when a reading is open, take the smaller one and say it.
- **No access → give it up early** and put it under brief §5 (17 Oct: "Quit stuff early like no access and put them under open questions"). His Mac and `try/shadows` are the two so far.
- **Long jobs in parallel** (17 Oct: "Long processes may happen, do other things in parallel"): run `npm test` in the background and read or write docs meanwhile; a subagent fetched the 21 fonts while 4.46.6 was built.
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
