# Help page — the plan

*24 Oct 2026. Okay: "This is a continuation of the guide but this is denser, faster … something simple at that very address that will open on new tab."*

**What it is.** One text page at https://duztman.github.io/dial-tool/help/ — every pane and control in the app's own words, one sentence each, read away from the tool. The guide (`guide/`, R25) stays the illustrated walk-through and the maker sheet; the help page is the quick reference. Its motto is the guide's: exact, lean, quick (`guide/notes-okay.md`).

**Source.** `guide/help/index.html`, hand-written, one file, no build. Published by copying it to `help/index.html` on `gh-pages`. Written against the version in its `<meta name="checked">` (beta 4.94.20, 26 Oct 2026); the footer names it. Updated on Okay's word, like the guide.

**Where the words come from.** Pane titles and row labels are the app's (`hdr(…)`, `num/chk/seg/pick(…)` in `web/src/app.js`, the `SECTIONS` block), button titles and aria labels for the canvas. A sentence says what a control does; nothing from memory. Next pass: a script that lists every label in `app.js` and flags any the page doesn't name (so a new row can't be missed).

**Order** (26 Oct 2026, the release audit). Start: Dial Tool, in short (two paragraphs, the numbered window) · A first dial · Gallery · Tabs: Dial · Rings · Hands · Windows · Export · Around the dial: Around the preview · The bar · Show Case · More: Keys and touch · How do I… (one line a task, linked) · Words (the trade's terms) · Report a bug. Every section opens with a summary of what is below (Okay, 26 Oct 2026: "Start sections with summary, then go into detail bit by bit"); the look's rules are in the stylesheet's header comment.

**Starting values** are the First dial's (`web/src/opener.js`, what a new visitor opens on and Dial › Reset brings back); a value the First dial doesn't set is the code's default (`DEFAULTS`); a new ring, window or guide gives its own template's.

**Not yet done.**
- The app's **Help** link still opens the guide (`GUIDE` in `web/src/app.js`, line 38, `target="_blank"`). Pointing it at `/help/` is one line in a small push, on Okay's word.
- Per-pane anchors from the app (#230): each pane's `?` could open `/help/#rings` etc.; the page's `id`s are ready: `idea first gallery dial rings hands date export canvas bar show keys how words report`.

## Screenshots to add (few, small, plain crops at 1×; Okay's card style from the guide notes if he wants it)

| # | Where on the page | What | Size |
|---|---|---|---|
| 1 | The screen | The whole window, iPad landscape, with the seven parts named (title line, tabs, preview, top left, top right, bottom right, bottom bar) | full width |
| 2 | Rings › The list | The ring list, three rows, one chosen | column |
| 3 | Rings › Resize Ring | Outer · Middle · Inner on one numerals ring (the #488 sheet) | three small |
| 4 | Rings › Give way | Marks on a band: knocked out vs not | two small |
| 5 | Hands › Shape | The eleven hand shapes in a row | strip |
| 6 | Date › Complication | The five window kinds | strip |
| 7 | Export › Print | Colour export vs Mono print mask of the same dial | two small |
| 8 | Corners and bar | The four corner switches and the bar, cropped | two strips |
| 9 | Show mode | The same dial in edit mode and show mode | two small |

Made: #1 (numbered over the picture; it covers #8 too), #5, #6, by `shoot.cjs` then `webp.py` into `img/` (2×, WebP, 55 KB together). All made by script from the current app (the window test in `web/test/` already shoots most of them: `4-rings`, `4c-guides`, `4f-hands-bar`, `4h-window-cards`, `13-xray`, `10-bar`).

## Updating it (the protocol, 24 Oct 2026)

Okay: "This will have to get updated, and expanded into the big guide." One command refreshes, one publishes; the words stay hand-written, because the page's worth is sentences checked against the app.

1. `bash guide/help/make.sh` (about a minute):
   - `check.py` — the app's version against the one the page was checked against (`<meta name="checked">`), with the changelog headings in between: **read those entries**, they say what changed in behaviour; then row labels added or gone since the last check (`labels.txt`), and labels the page never names (`known.txt` lists the deliberate ones, with why).
   - `shoot2.cjs` (the popups, the controller, the iPad) · `shoot3.cjs` (the bar, the date's popup, the steps, Versions, the Tiny preview), run from `web/`.
   - `icons.cjs` · `shoot.cjs` · `webp.py` · `decorate.py` — the app's own icons and the pictures, taken again from the committed `web/dial-tool.html`; the small maps redrawn.
   - `look.cjs` — every section, wide and on a phone, into `out/` (not committed); fails on sideways scroll, a broken picture or Inter not loading.
2. Revise `index.html` by hand for what step 1 listed: one sentence a control, the app's own labels, in the app's order.
2a. When the content is settled, a last pass with the Humanizer skill (27 Oct 2026, decisions.md): sentence-level prose and repetition only; layout, bold, titles, captions, facts, names and meaning untouched.
3. `python3 guide/help/check.py --done` — records the version and the labels as checked, and dates the footer.
4. Commit and push `dev`; look at `out/`.
5. On Okay's word: `bash guide/help/publish.sh` — copies the page, `img/`, `fonts/` to `help/` on gh-pages from the pushed `dev`.

When: on Okay's word, like the guide (R25) — not with every app push. A step (4.93, …) is the natural moment to ask.
Cost: a small push with no new rows is step 1 and a look; a step with new panes is an hour.

## Into the big guide

The guide (edition 1, `guide/`, R25) is the illustrated walk-through and maker sheet; this page is the reference. Edition 2 takes this page's sentences as its text source, section for section (their ids match the app's tabs), so a fact is checked once, here, and the guide re-uses it; the guide adds the pictures and the walk-through. The per-pane anchors (#230) point at this page's ids. To decide with Okay when edition 2 starts.

## Words: the trade's own terms

Berner's *Illustrated Professional Dictionary of Horology* (FH, 2023 revision, 6,000+ entries, French · English · German, online and as an app: https://www.fhs.swiss/eng/dictionary.html) is the reference for watch-part names. Okay, 24 Oct 2026: its case illustrations may be of interest (for show mode's cases). Proposed: a Berner column on the Watch terms in `docs/glossary.md`, so a name the tool or this page uses is checked, not guessed. Not done; whether online access is free is unconfirmed.
