# Help page — the plan

*24 Oct 2026. Okay: "This is a continuation of the guide but this is denser, faster … something simple at that very address that will open on new tab."*

**What it is.** One text page at https://duztman.github.io/dial-tool/help/ — every pane and control in the app's own words, one sentence each, read away from the tool. The guide (`guide/`, R25) stays the illustrated walk-through and the maker sheet; the help page is the quick reference. Its motto is the guide's: exact, lean, quick (`guide/notes-okay.md`).

**Source.** `guide/help/index.html`, hand-written, one file, no build. Published by copying it to `help/index.html` on `gh-pages`. Written against beta 4.92.5 (`dev`); the footer names the version. Updated on Okay's word, like the guide.

**Where the words come from.** Pane titles and row labels are the app's (`hdr(…)`, `num/chk/seg/pick(…)` in `web/src/app.js`, the `SECTIONS` block), button titles and aria labels for the canvas. A sentence says what a control does; nothing from memory. Next pass: a script that lists every label in `app.js` and flags any the page doesn't name (so a new row can't be missed).

**Order.** The idea (four models) · the screen · a first dial · Dial · Rings · Hands · Date · Export · corners and bar · show mode · How do I… · Words.

**Not yet done.**
- The app's **Help** link still opens the guide (`GUIDE` in `web/src/app.js`, line 38, `target="_blank"`). Pointing it at `/help/` is one line in a small push, on Okay's word: the page links the guide at its top.
- Per-pane anchors from the app (#230): each pane's `?` could open `/help/#rings` etc.; the page's `id`s are ready: `idea screen first dial rings hands date export canvas show how words`.
- Icons: the app's own signs (`web/icons/`) beside the corner and bar entries.

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

All made by script from the current app (the window test in `web/test/` already shoots most of them: `4-rings`, `4c-guides`, `4f-hands-bar`, `4h-window-cards`, `13-xray`, `10-bar`).

## Words: the trade's own terms

Berner's *Illustrated Professional Dictionary of Horology* (FH, 2023 revision, 6,000+ entries, French · English · German, online and as an app: https://www.fhs.swiss/eng/dictionary.html) is the reference for watch-part names. Okay, 24 Oct 2026: its case illustrations may be of interest (for show mode's cases). Proposed: a Berner column on the Watch terms in `docs/glossary.md`, so a name the tool or this page uses is checked, not guessed. Not done; whether online access is free is unconfirmed.
