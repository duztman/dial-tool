# Dial Tool — build list

Numbered, never renumbered. Status: **open** · **verify** · **ask** · **parked**. Done items move to `docs/build-list-done.md`; the DrawBot version's to `archive/drawbot/build-list-drawbot.md`.
*Last updated 23 Oct 2026, 20:00 (#511 the mode change's flash on Safari, #512 the dial's shadows from real heights — both for Sunday 25 Oct). 19:30 (4.92.1: show mode's colours take the plate and the windows' discs; on main too; the rest of v1 with Okay on Sunday 25 Oct). 19:00 (beta 4.92: the step, the Show Case merged; shadows' limit; the two eyes). 18:30 (4.91.15: the merger's last round — Shenanigans, bevels in show mode, Metal tiles, scroll zooms everywhere, the new opener; the Show Case merge done, its leftovers stay in #510). 17:30 (4.91.14: the swoop without load, Watch first, deselect, the wide Shadows pane, app-like interface). 16:30 (4.91.13: the mode change in one movement; main's case filled in greys; no system dropdowns; show mode's mouse and layout; the undo history's popup). 15:00 (4.91.12: main caseless with a silhouette and no strap; show mode's title, Backdrop presets and gradients, Case and Insert tiles, rows aligned; one dive bezel). 01:40 (4.91.11: show mode back to the Show Case — see-through column, sun by drag, title line, undo, no Guides/Shadows; 10:10 off the timeline; open: Engineer and Miyazaki draw the dive insert differently, Okay to choose). 22 Oct 2026, 21:15 (/show-case/ republished, beta 1.0.20). 21:10 (4.91.9: the column checked against the Show Case's; the control looks as a setting go to #510). 20:30 (#509 built in 4.91.8, its leftovers in #510). 18:40 (#508 done, 4.91.7). 17:15 (group K: the Show Case into Dial Tool, in v1; #506 done, #507 open). 21 Oct 2026, 23:10 (batch 1 built in 4.91.3; #504 noted). 22:45: #503 the archive. 22:30: #453 open again, #502 notices added. 20:25 (Okay's answers: v1 scope settled, #494 #495 added, #68 #134 #227 #366 closed. 20:10: v1 drafted; the list grouped by v1 instead of by where each note came from; done items moved out). Where an item came from is in its own words and dates.*

## v1 — settled with Okay, 21 Oct 2026

Okay, 21 Oct 2026, 20:10: "Yes let's draft a definition and put square past v1. Now I believe we can release without square dials."

**v1 is the tool as it is, finished, plus SVG import** (Okay, 21 Oct 2026: SVG import in v1). Every question below answered or dropped, every dead end closed, the built things seen working on Okay's own machines, the words clean, then the full check (R19) and the name v1, without "beta", on Okay's word (brief §4, 20 Oct, 02:53). What is not in this section comes after v1.

Settled by Okay on 21 Oct 2026, 20:25 (`docs/decisions.md`): SVG import is in; the guide's next edition comes with v1; no brass dial before naming it; square dials after v1. The number: v1.0 (R19).

### A · Answer (Okay)

| # | Item | Status |
|---|---|---|
| 162 | **A few more icons to redraw** (Okay, 14 Oct 2026: "Few more ugly icons to fix… not for today. Ask for them next time I go into the project"). Okay has them; ask, then draw them through `web/icons/` (R33) | ask — in v1 (Okay, 21 Oct 2026): he sends the drawings |
| 294 | **Off the scale as found** (the specials block's second group, looked through at each release, R32): spaces and lines with no figure from Okay — `--nudge` 2, `--btn-pad` 10, `--frame-pad` 8, `--ring-gap` 4, `--foot-gap` 4, the ring line's 8 · 8 · 2, `--name-in` 6, `--chip-gap` 4, `--pop-pad` 16, `--pop-gap` 12, `--guide-gap` 10, `--ring-gap-in` 2, `--logo-disc` 2, `--canvas-inset` 12, the pointer's outline 1.5 and 4, the pointer label's arrow 5 and 2.6. Also bare values left in rules (R32: a value is written once, as a token): the tag's arrow (`top: -6px`, `4f-rings.css`), the pointer label's arrow (`- 10px`, `6-preview.css`), opacities written as numbers (the ruler's 0.4 · 0.85 · 0.6 · 0.38, a dragged ring's 0.45), `calc(var(--unit) / 2)` where `--u1` is meant. For each: put it on the scale (a look change, shown first) or keep it as a special. With the layout check (#188) | open — before v1 (Okay, 21 Oct 2026) |

### B · Verify on Okay's Mac, iPad and phone

| # | Item | Status |
|---|---|---|
| 16 | Live text in the SVG (*Keep numerals as text in the SVG*, Export; R10): open one in Illustrator with the font installed — do the numerals land where the outlines do, do the cuts arrive as clipping masks? The PDF's live text is #63 | verify |
| 439 | **Backdrop's swatch loses its outline at times** (Okay, 23:53: old Safari on an Intel Mac, the iPad too; his picture: the switch at rest on a dark red backdrop). Not reproduced in Chromium. Measured: the dot stands at x .25, y .5 of a pixel; its colour is painted under the outline too. Taken: `background-clip: padding-box` on the canvas's swatches (Backdrop, strap). Ask Okay if he still sees it; if so, the dot onto whole pixels | verify |
| 453 | **FIT's left line on a phone** ("left wall missing … dont come back empty handed"). Fixed in 4.91.3 (measured: the zoom group's `border-left: 0` took the line's style away, so the phone's width rule drew nothing; 0 px · none before, 1 px solid after on a 390 px window). Before it, the fix in 4.89.9 (#446: the line was − +'s, hidden on a phone) did not hold: Okay, 21 Oct 2026, 22:25, "This fit losing border on mobile still an issue", his picture from the live page shows top, right and bottom lines, no left. The next attempt is the second (R20): measure on a phone-sized window first (where the box's left edge falls in device pixels, what draws it), then one fix; a third goes back to Okay | verify on his phone (4.91.3 on /dev/) |
| 465 | **Bevel not seen in 4.89.12** (01:49: "Bevel is not in this update. I don't see a bevel on the hands coming up. Bevel is off on default. Please note"): off to start is as meant; ask where he looked for the tick (beside Show, under the hand's tab) once he has the released build | verify |
| 232 | **Phone: with the drawer dragged up, Undo · Redo overlap the Backdrop switch**. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 369 | **"The preview gets these wonky orange parts"** (his screenshot: a dauphine with orange slivers) — read as the lit part of #329 stuck on after a tap; it goes off under a finger. Ask if he still sees them | verify (Okay, 21 Oct 2026: not checked yet) |

### C · Close the dead ends (R17)

| # | Item | Status |
|---|---|---|
| 218 | **"Add image…" is a dead end**: it says "Not built yet" (R17). Build it (#73, #173) or hide it. Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |
| 228 | **Defaults asks for Helvetica Neue**, which isn't bundled: the Type pane says "not loaded" and Inter stands in. A bundled font in the starting values needs a new link scheme number (R31). Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | open |

### D · Files and words

| # | Item | Status |
|---|---|---|

### E · With the release

| # | Item | Status |
|---|---|---|
| 503 | **The archive: screenshots, update pages, the progression strip** (Okay, 21 Oct 2026, 22:30: "I want to be able to trace the progression later. A system for those as well?"; R36). (1) Move `archive/screens/` (154 MB) to the Mac folder `~/Desktop/dial-maker/screenshots/` and take it off the repo's tip (the history keeps it); `docs/versions.md` points there. (2) **The progression strip**, once: every build in `docs/versions.md` opened (`tools/versions.sh open X`), the same dials loaded, the same views shot — one strip from 3.0 to now, into the Mac folder; old builds that can't read today's links get the closest dial they can draw; each step then adds its frame. Runs in the background. (3) **The update page at v1.0**, covering 4.90 → 1.0, as the 4.90 Review was | (1) done 21 Oct 2026: 745 pictures in the Mac folder, off the repo. (2) done 23 Oct 2026: every step from 3.0 to 4.92, two frames each (94 steps), in the Mac folder's `progression/` with `index.html`; each step adds its frame at release. (3) open — with v1.0 |
| 93 | **Guidebook for the web version** (R25): edition 1 at https://duztman.github.io/dial-tool/guide/ — eight A4 pages and a phone stack from one source, composer `guide/look/` (README there), also an InDesign package (IDML); the app's Help link opens it. Rebuilt only when Okay asks (`bash guide/make.sh`), never with an app release. Open: the human reader round (two people new to the app, `guide/tests/humans.md`); Okay's look at the pages and the package's first open in InDesign; step 9 (his production round); edition 2 (per-pane anchors, #230). For the next rebuild: the guide's First dial steps no longer end on the opener (#331) and its script should press *Blank face* (Plain dial leaves Settings file, #434) | in v1 (Okay, 21 Oct 2026): a new edition with v1, on his word (R25) |

### F · Changes from Okay's answers (21 Oct 2026)

| # | Item | Status |
|---|---|---|
| 494 | **Compare at one size, as large as the canvas holds, and a real-size switch** (Okay, 21 Oct 2026: "One big, as big as what fits on the canvas, one real size option in preview"): as built, every saved dial at one size; a switch shows them at their own mm (preview only, R26) | build |

### G · SVG import (Okay, 21 Oct 2026: in v1)

Every place an SVG can go, built as one mechanism (R34; R23 says how a file is read). The template file comes with it.

| # | Item | Status |
|---|---|---|
| 173 | **Image or SVG import onto the dial** (Okay: "guilloche is a good point but not our job, instead we should implement image or svg import for the dial"). With #72 (logo), #50 (imported shapes), #73 (background) | open — Next |
| 72 | **Logo**: an SVG placed on the dial with the mouse; it is also a ring, edited in Rings "differently"; a link from the Dial pane goes to it. Its file's content travels in the settings (#50). Ask Okay before building: its colours (he first wanted an SVG's colours adjustable), scale and rotation, whether a link can carry it. Words are the text ring's (#297) | open |
| 50 | Imported shapes (SVG, PDF, AI) for markers and hands: a "file" shape is drawn as a bar or baton and the log says so; the hands' dashed SVG tile says "not built yet". In a browser the file's content has to travel inside the settings (no file paths). With #72, #173 | open |
| 466 | **A moon window's Picture gets Custom…, which takes an SVG** (01:49: "Arc phase line gets a custom… which will insert an svg. Also a note") — with the SVG inserts (#405, #50, #346) | open — note |
| 405 | **SVG inserts: a blank template file** — a downloadable SVG with guides and registration dots (the artboard's centre, the 12 o'clock line, a hand's pivot, a marker's box) so a drawing made on it imports editable and in place; one template per place an SVG can go (a hand, a marker, a window picture, a logo). The plan for every SVG upload (#50, #72, #173, #346), noted for when they are built (Okay, 17:43: "give the user a blank file with guides and dots to stick to make things editable and such. For the future, note under all svg upload available areas") | open — later, with #50 |

### H · Small jobs, batch 1 (Okay, 21 Oct 2026: "Easy to do things: doing 10 of them and checking once is a solid job")

Built in 4.91.3, with #149, #434, #495, #76, #231 from groups D and F and #453 (`docs/build-list-done.md`).

| # | Item | Status |
|---|---|---|

### I · Medium, in v1 (Okay, 21 Oct 2026)

| # | Item | Status |
|---|---|---|
| 502 | **Notices: every warning, error and note in the app looked through** (Okay, 21 Oct 2026, 22:25: "warning labels check everywhere, some need to be click to dissmis like this font note, some needs their design and placement checked. Warnings and errors. This'll be some work?"). First an inventory: each notice with its words, where it stands, when it shows, how it goes away, a screenshot. Then Okay sorts them into kinds (staying beside its control · click to dismiss · the Export log), and one look per kind is built | open — v1: inventory first |
| 329 | **Hovering a row lights its part on the picture at the left — "these preview gestures are sitewide"**: the hands have it (the part a number changes, lit in the selected guide's colour while its row is pointed at, focused or its controller open); the rings' rows don't | v1 (Okay, 21 Oct 2026) |
| 52 | Named instances of variable fonts in the font box (a weight axis without named styles gets Regular · Bold, #275; the font's own instances are not listed). The PDF's live text is #63, the fallback font #15 | v1 (Okay, 21 Oct 2026) |
| 398 | **The stylesheet's values off the scale** (R32; the #294 review, with Okay): 34 literals in rules that are not specials — letter-spacings and underline offsets in em (`h1`, `.atmore`, `.bio a`, `.asnumbers`, `.popvalue input`, `.irisgo`), the ruler's opacities (0.4 · 0.85 · 0.6 · 0.38) and `.dragged`/`.above` at 0.45, `.tinyshut`'s 0.15 s, SVG stroke widths (`.grips .frame` 1 and `.handle` 1.5, `.picked` 3 2, `.paper` 1, `.ruler` 1), the play cap's 12 % hover lift, the mast's 250 % / 70 % sweep, `.pinned` 33 px foot, `--sign-w` 18 on a phone, `--thumb-eye-edge` + 0.75, `.tip svg` − 10; one literal negative margin (`.ringlist .grip`, −4 px: find what the grid is doing instead); the breakpoints 860 / 861 hard-coded in `8-narrow.css` and `4d-hands.css`; five rules styling another part's selector from the wrong file (`4c-rows.css` on the font sheet's fields, `3-controls.css` on `.row > .btnline`, `4f-rings.css` undoing `.detail`'s border, `4b-lines-tabs.css` undoing `.pane`'s top line, `4g-fonts.css` re-skinning `.tab.on`); `--handle` meaning a width token and a JS-set colour; the round-corner canon ("colour things only", `0-order.css`) that the signs, tabs, pills and the Tiny Preview don't follow — settle the canon or the corners. The layout check (#188) is what would hold the line afterwards. | v1 (Okay, 21 Oct 2026) |
| 230 | **Per-pane anchors from the app into the guide** (edition 2). The Help link beside the version opens the guide (Okay, 15 Oct 2026: "Help next to beta number same font but underlined"). Found 15 Oct 2026 by the guide's blind reviewers (`guide/inventory/inventory.md`) | v1, with the guide's next edition #93 (Okay, 21 Oct 2026) |

### J · Site and fonts (Okay, 21 Oct 2026)

| # | Item | Status |
|---|---|---|
| 501 | **The rest of the font library in the list** (Okay, 21 Oct 2026: "Adding them into the site before v1 is a must"): the middle tier (50) and the non-Latin numeral fonts (10) of `docs/font-tiers-2026-10-16.md`, licences and credits as `web/fonts/README.md` keeps them. The bottom tier (14) stays held. The font sheet follows R35 | v1 — build on Okay's word |

### K · Show mode — the Show Case merged into Dial Tool (Okay, 22 Oct 2026: "this is perfectly and mustly a part of v1 rollout. Most big and important part")

The Show Case was built to be put into Dial Tool; its export stays. "Showcase UI is just to test the functionality … Logic will come from main. Only the color switching of the whole controls is well worked out. Delete the whole unnecessary stuff." In phases; before each, 10–20 questions, a report, then Okay's go. Elegance is the brief: "light as a feather … simplest, most elegant and lightweight way … without changing the looks and presentation".

| # | Item | Status |
|---|---|---|
| 489 | **Dial Show Case into Dial Tool** (was: a standalone app). Settled 22 Oct 2026, 17:17 (decisions): cases snap to dials and scale with them; the engine's kinds on both sides, no caseless watch in show mode; the dial side's case Engineer-flat, no glow, strap as show mode set it; show mode edits colours (dial and watch), ink heights, light, style; the watch in file and session, not the link; one sun; PNG and PDF of the watch; the old Showcase's spotlight, sky, shine, animations retired; the bar the same in both modes; the Show Case's arrow goes. Okay's shape of it: Activate Showcase slides the panel out and the show column in; only the dial's colours are editable there, and Versions; the cases will grow in number; the edit mode's case (**show mode** is the other) is flat, Engineer-like, simply shadowed; shadows, flares and Miyazaki come on in show mode; fonts, colour changes and the bottom bar already exist in the app and are reused; a **"turn off shenanigans" switch** for old computers, persistent, in the bar's place in show mode. Phases: 1 shadows (done, 1.0.20) · 2 one case module (the two engines are one geometry with two paints; replaces `bezels.js`) · 3 show mode in the app · 4 clean-up | **in v1**; phase 1 done 22 Oct 2026 |
| 506 | **Phase 1, shadows** (Show Case beta 1.0.20, `show-case/README.md` *Shadows*): one rule — the casting shape swept along the light (`sweep()`, the Minkowski sum of a polygon and a segment), black at one opacity, painted once; `silhouette(C)` with heights (case 1, lugs 0.55, crown 0.5); the strap by its own outline. Also the tang buckle, one thick keeper, stitches, the rolled ends, the holes. Approved on pictures 1–14; not yet seen on Okay's own machines | done — 1.0.20; **verify** on his Mac and iPad (the blur when Soft is on) |
| 509 | **Phase 3 — show mode**: the column from `ROWS` (the Show Case's layout); the watch's keys in `DEFAULTS` (file and session, not the link); one sun (`sh_from`, `sh_rise` are it; bevels Dial Tool's); the Backdrop grows gradients and auto; PNG and PDF of the watch; the shenanigans switch (costly layers off: blurs, flare, glass, outline union), persistent `ui_` key; panel colours (#505); Mac and iPad only; the old Showcase's sky, pool, shine, sun day and whirl removed; the Show Case's panel, bar and css deleted | **built — 4.91.8** (22 Oct 2026): the panel's swap, the four show tabs, the watch, one sun, the keys, the old Showcase gone. Not in it: the Backdrop's gradients and auto, the preview button hiding the panels, the switch in the bar's place (a tick on the Light tab for now), phone hiding, the bracelet of links, ink per colour, dragging the sun — #510 |
| 510 | **Phase 4 — clean-up and the rest of show mode**: #509's leftovers (the Backdrop's auto; the preview button hides the panels and the bar in show mode; the Effects tick becomes the persistent switch in the bar's place; the buttons' looks, with Okay (23 Oct 2026: "We messed up the buttons but I'll help you fix them later"); hidden on a phone; the bracelet of links; ink per colour; the Show Case's control looks — outlined pills, one control height, number boxes on the third column with the slider under (the sideways scroll of a long pill is in, 4.91.10) — as a setting for the whole tool, off by default, Okay 22 Oct 2026, 20:29); docs, R26 (a picture of the watch is a second kind of output), the glossary, the v1 list | **next** |
| 507 | **Phase 1 leftovers**: Blurs = one soft edge on the shadow layer (today Blurs only governs the flare); the strap's rise band under the lugs; case heights by kind (Dress 0.22 × dial, Field 0.28, Diver 0.32 — agreed in question mode, not drawn: the shadow's length today is the engine's 2.4 mm × the sun's factor, not the real height) | open |
| 511 | **The mode change flashes a misplaced dial** (Okay, 23 Oct 2026, 17:53: "activate showcase flashes a misplaced dial for one or two frames on first activation. Same goes for coming back to main from showcase"): Safari on the iPad and on the Intel Mac; the first swoop each way. Not seen in Chromium. To find: which frame draws the dial before `swoop()` places it (the class toggle, the first `place()`, or a font or layout settling on first use) | **Sunday 25 Oct**, with Okay |
| 512 | **The dial's shadows reach where no real light could** (Okay, 23 Oct 2026, 17:53, two pictures: the hands' shadows fall a hand's length away across the plate, under the date window: "These shadows on the dial are impossible… limit the dial shadows to a degree, much smaller than this"). His reading: the shadow logic is right, but a light low enough to throw these would also carry the case's inner shadow across the plate, and that stays at the edge — so the case side has a limit the hands don't. To do: a far smaller limit for the hands' shadows on the dial (4.92 caps every shadow at a 20° sun, too long here), set from real heights — the plate's depth in the case, the hands' heights over the plate (`sh_hour`, `sh_minute`, `sh_second`, `sh_cap`) and the case wall's — so the hands' and the case's shadows come from one light and agree. Investigate those heights first, show Okay the figures | **Sunday 25 Oct**, with Okay |

### L · Before v1, Okay's notes of 24 Oct 2026 ("New crucial items before launch")

From the gdoc "Dial tool notes", the Oct 24 block. Pictures are in the gdoc; Okay's words are quoted. Not built; ranked with him on Sunday 25 Oct.

| # | Item | Status |
|---|---|---|
| 513 | **"Nudge one numeral" is named "Edit one numeral" and gets the ring's font, and with it colour** ("also this selection is redundant, just only have the numbers we can see on screen listed here. For example there are only 4 numerals on this ring, yet we have controls on nonexistent unseeable items. Also horrible number confusion here. Font sizes need to go higher"). Today's picker lists `G.ring_labels(R)`, so which items are "nonexistent" needs his picture; the "number confusion" is the picker's `1 · 12` labels (position and word). With #339, #252, #349 | open — v1 (his note); the list says only what is drawn, by its own words: **done — 4.92.3**; one numeral's font and colour **done — 4.92.13**; font sizes: Size's slider to the dial's diameter, 4.92.12 (#535) |
| 514 | **The controller wider** ("as wide as two columns. The gap between plus and minus becomes a good place to just untouchably write the name of the thing being edited"; on very wide columns "spans exactly as wide as the slider below … always exactly slider overlapping slider, longest as possible"; "positions does not have controllers, add and make them wide as right two columns") | built — 4.92.5: as wide as the row's controls, over the row, its slider on the row's, the name between − and + (R15); **verify** the Positions part: their names already open the controller here — ask where he found none |
| 515 | **Days of the week in full, or custom** (open 7 slots, 7 input boxes). With #135 (names by language) and #346 | in full: **done — 4.92.3** (*Written*: Short · Full, `day_form`; the language's own capitals); Custom **done — 4.92.11**: seven fields, four to a line, a blank one the short name |
| 516 | **Am/pm gets two sub-options**: this disc, and a typed-out am/pm "default jump mechanism" with custom text, opening inputs like the week's (#515) | **done — 4.92.11**: Shows: Disc · Words; Words in a rectangle, AM · PM or your own two, jumping |
| 519 | **The top shadow config is back on the main view** ("shouldn't. Should look the same") — ask which version he last saw it right in | **done — 4.92.12**: show mode casts each hand from its own height, as the dial side (Okay: "Dial side's") |
| 521 | **Ink per ring, and per hand** ("Colors not persistent anymore. Instead of single ink height, every ring gets a color and ink height selector with eye like colours. The individual ink height slider becomes 'all inks at once' which links all inks same amount, not equalizing the ink heights, adding to or subbing from each same amount. Hands also get individual eye rows, bevel, color and height. Cap moves with whatever it's attached to"). Same ground as #510's "ink per colour" | **done — 4.92.15** (his answers: "Yes, as drawn"; "A swatch on its hand's line"; "Quiet number box"): in show mode's Colours each ring's line is eye · name · colour · its ink height in a number box; each hand's eye · name · colour (the cap's square beside the hand it sits on) · Bevel toggle · height; colours are squares there; the number column named INK HEIGHT on the Dial line (4.92.16). *All inks at once* moves every ring by the same amount; a ring's own step (`ink_d`) is kept in the file and the session, not the link (R7). Colours unpinned in show mode: 4.92.3 |
| 522 | **Paint finishes in show mode** ("simple textures and slight shape modification to achieve a closer to real paint distribution look") | after v1 (his note) |
| 535 | **Sliders that stop short** (Okay, 24 Oct 2026: "Sliders limited in places? Shouldn't be, whole span, minus if necessary, with a slider bar like ball at zero"; asked, he chose "Only where I hit it"): a slider's track widened where he meets its end, a dot on the track at 0 when it crosses zero. First: numerals' Size ("main numerals could grow up to 500-600"; **done — 4.92.12**: its slider runs to the dial's diameter ("Dial's diameter")) | open — v1; one slider at a time |
| 536 | **Help page and bug reports**, live at https://duztman.github.io/dial-tool/help/ since 24 Oct 2026 (`guide/help/`; published by copying `index.html` and `img/` to `help/` on gh-pages, PLAN.md there): one text page, every pane in one sentence, opening in a new tab ("denser, faster" than the guide, Okay 24 Oct 2026). Ends with a bug report form for beta testers: name and tester code needed to send ("name must be added to send. Maybe beta tester code?"); reports go by Formspree to Okay's email. Waiting: Okay's Formspree form address (`ENDPOINT` in the page), his tester code (the page holds its SHA-256; it keeps casual visitors out, not security), then the Help link (`GUIDE`, app.js) on his word. Additions to review "when full": `guide/help/ADDITIONS.md`. Kept up by `guide/help/make.sh` → hand revision → `check.py --done` → `publish.sh` on his word (PLAN.md there); edition 2 of the guide takes its sentences as text source | **now**, waiting on Okay |
| 537 | **A short address that still opens the dial** (Okay, 24 Oct 2026, 19:40: "The address bar is nice to copy and share but cumbersome to just copy the domain and folder. Can we hide the full address and make the link still work"): a reading to check when built — the page reads the dial from the address, then shows only the site's own address (history.replaceState), so the bar copies short; Copy link still gives the whole dial; a reload keeps the dial from the session | note — later (his word: "Do later, just note") |
| 523 | **Share a dial set as one link** ("'Share dial (set--if there are versions under dial) as link'"): the title reads *Share dial as link* (4.92.3); a link carrying the saved dials of Versions as a set is not built — a link carries one dial (R31) | open — ask: wanted in v1? |
| 524 | **NATO colours selectable** ("One solid option. Options can be free living single pills"): the patterns as single pills, one solid NATO with its colour | **done — 4.92.9**: the patterns as free pills, Solid last; a swatch a stripe (Solid one), starting from the pattern's, a pattern taken again starting from its own |
| 525 | **Shenanigans in a three-column block of its own, no lines** (his drawing: Shadows · Blurs · Bevels / Flare · Gradients · ALL, each an on · off pill) | **done — 4.92.9**: a toggle each (no words), Shadows · Blurs · Gradients over Flare · Bevels · All, no bar (Okay, 24 Oct 2026, 19:57: "Remove vertical white bar"; 4.92.15), the top line across the whole width, names in small capitals set right against their toggles. Gradients: every gradient in show mode ("Both", 4.92.12) |
| 526 | **The Sun's picture on the Light tab and the new Shadows popup** (his two pictures: a sun round the dial, Angle · Height · Strength under it as big sliders; the watch's parts in an exploded view, the one being sized white, the others grey as the dial; per-part heights Cap · Seconds · Minutes · Hours · Dial · Ring; Soft edge; Reset; the long explanation behind an (i) after the eye; "Sun when moved to the corners the rays pop in and out") ; the sun's rays there (Okay, 24 Oct 2026): "Turn off non directional rays, keep things visually symmetrical in terms of rays when possible. Rays can grow on distant suns, shorter when they are close. No exaggeration, noticeable" | open — v1; sketch first |
| 527 | **The new Guides popup** (his two pictures, 24 Oct 2026): two columns — Rings with *Selected · All · None* on its heading (a menu), each ring a line with its colour dot and tick; Centre hole, Centre lines, then Windows with its own *All*; a white line, *Added* with a minus; the bottom section Add (Line · Crosshair · Circle), Thickness 1 · 2 · 3, a divider, Reset All. A colour dot opens eight dark-toned dots and None, the chosen one ringed in its own colour | open — v1; sketch first |
| 528 | **Dramatic lighting more dramatic**: a still spotlight, darker ground; the spotlight lights the ground to its real colour | open — v1 |
| 529 | **Bracelets drawn half visible, round an imaginary wrist** (his photo, a steel diver on a bracelet): one snapshot-like light on any backdrop, closed rounded shapes, soft outlines, many gradients; rendered lower and refined after a download if heavy. "Let's workshop this" | open — v1; workshop |
| 530 | **SVG imports after v1** ("Svg imports postponed to consideration after v01. However make their places ready and display a message … in relevant places"): moves group G after v1, the 21 Oct decision reversed; each place an SVG will go shows a note now | ask: confirm the move of group G |
| 531 | **Hand bevels lost on the tool side** ("bring them back. Next step is these options for bevel": his drawing, *Bevel* beside Show, then Normal · Miter · Round) | bring back: **done — 4.92.10** (the tick showed only with Shadows on; now always with its hand, the bevel drawn by the sun's direction either way); the options after v1 |
| 532 | **After v1, from his list of 24 Oct**: paint textures · simple dial finishes and a preview pipeline · print-like edges · lume view · edit the case's bezel · 3D indices · different hand bevels · a 3D model → technical drawing → case shape pipeline, new case styles · more straps and bracelets · simple movement renderings · outlines for text and shapes (thickness, colour, miter · round · bevel joins, offset) · Give way to rings above made understandable (highlight and magnify on the canvas, better icons and names: "Skip where sounds like nonsense") · a wall clock, or no case, with its distance from the wall | after v1 (his note) |

## After v1

| # | Item | Status |
|---|---|---|
| 496 | **A universal settings panel** (Okay, 21 Oct 2026: "I am looking for things to put into a universal settings panel. Keep an ear up."): collect candidates as they come up, propose the panel when there are enough. So far: steps in the shown unit (#76); the guides' on and off choices (his note of 20 Oct, 04:20: "Settings will house extensive guide on offs") | collecting |

Open, in rough order of weight within each group. #169 is the one Okay called core ("very very good… prioritize this", "core to our mission"); #83 was marked Next on 13 Oct.

### Features

| # | Item | Status |
|---|---|---|
| 169 | **One strip for every position** (atlas 2.1; Okay: "very very good… prioritize this", "core to our mission"): one per-position value per setting, shown as a strip of cells under a ring; draw a line across to set the ends and get the middle; type a rhythm (`L S S S`) to repeat. Nudge holds per-position values (#349). Draw and show Okay before building | first after v1 (Okay, 21 Oct 2026) |
| 175 | **A hand as a stack**: caps, windows, lume openings within the current interface | after v1, raised (Okay, 21 Oct 2026: "bump up in importance") |
| 184 | **Snapping** (Okay, 14 Oct 2026, on #85): lengths and radii that snap to rings' edges while dragged. "A bigger question for later" | after v1, unparked (Okay, 21 Oct 2026) |
| 83 | **Positions law** [1.1]: a selector on the Positions heading line: even · reciprocal · logarithmic · table · squeeze toward an angle [7.15]. Only `ring_angles()` changes. Tachymeter [1.2] = reciprocal with base, from, to, step; one ticks ring per stretch of steps. Depth cartouches [1.14] = table, typed as angle and label pairs. To decide when it is built: Count hides where the law sets it (R16); what "a partial span marks both ends" means per law; a table brings its own labels | open — Next |
| 484 | **Square and rounded-square dials, as an Apple Watch's** ("How hard is to make a square and rounded square like an apple watch … i know its big work but plan. This is an obstacle between us and beta v5") — with #363. A plan: `docs/plan-non-round.md` | after v1 (Okay, 21 Oct 2026, 20:10: "put square past v1"); plan: `docs/plan-non-round.md` |
| 404 | **Dauphine and leaf hands: hubs as on a real movement** — the connecting circles where the hand meets the cannon pinion, life-accurate (Okay, 19 Oct 2026, 17:43: "dauphin and leaf get life accurate movement connecting circles"); refines #370's plain hub for these two shapes | after v1 — and every hand gets a real hub, not only dauphine and leaf (Okay, 21 Oct 2026: "All hands get hubs.") |
| 421 | **Keep a hand's details in the lit picture** — the dauphine's connecting dot (Okay, 20:02: "Let's do not lose details such as dauphine's connector dot, we might make it larger too if we want"); with #404's hubs | after v1, with #404 |
| 346 | **Complications, systematized** — what is left: the moon's own disc (its moon following a drawn path); a big date's two discs in X-ray (the X-ray switch hides on a big date, #373); your own SVG for a complication's picture. In place: one moment (`web/src/moment.js`, `web/test/moment.mjs`) gives the date, weekday, month, AM/PM and the moon's age; five languages EN · TR · DE · FR · IT; the date set in the bar; the discs under the plate seen in X-ray, their edges as guides, physics (a disc's band must end inside the case) as a tick per window; the twelve sketched looks (moon: humps · phase · line; am · pm: sky · half · band; date: neighbours · big date) | after v1, after #169 (Okay, 21 Oct 2026) |
| 349 | **Each marker selectable and editable**: a first press picks the ring, a second the mark or numeral; Nudge works on ticks and markers too, with a shape of its own; the chosen one is outlined on the dial. Left: the numeral's preview at the left with its controls; an SVG for a mark (#50) | after v1, after #169 (Okay, 21 Oct 2026) |
| 497 | **Resize Ring from on the canvas** (Okay, 21 Oct 2026: "Resize ring from: also doubleclick to activate on canvas like individual numbers will be"). Reading, to confirm when built: a double-click on the selected ring's outer, middle or inner guide circle makes it the circle that holds still, as the menu does; the same gesture family as picking one numeral on the dial (#349) | note — with #349 |
| 467 | **A moon window's disc, as a date window's** (Okay, 20 Oct 2026, 01:53: "moon window for phase needs a ring like date window, no? How many moons fit? Can we get away with less, steps between states. This is a jump complication of course like date"): a moon disc under the plate, seen in X-ray, jumping once a day as the date's does. In watches as Claude knows them (to check at build time): two moons on a 59-tooth disc, one tooth a day (two lunations of 29.5 days), a day off in about 2.7 years; fewer steps means a coarser jump. With #346 (the moon's own disc) | open — note |
| 252 | **Nudge's picker**: a small copy of the ring's numerals to click or tap (Okay's notes, p. 6–7). In place: the four number rows on the chosen numeral, sliding one hides the guides; a second press on the dial picks a mark or numeral (#349). With #339 | open |
| 339 | **Nudge one numeral more intuitive**: "keep the data and functionality as is, maybe better naming, guiding, visualizing, let's think" | later · open |

### Interface and look

| # | Item | Status |
|---|---|---|
| 505 | **The panel's colours from the Show Case** (Okay, 21 Oct 2026, 23:11: "The adaptation of this button and the whole control panel colors system has been worked out in show case and it'll be folded in soon … This left side's colors will be hidden under settings, don't touch showcase"): the column tinted from the backdrop, its lines and fields adapting to its lightness, the colour pill among them (`show-case/app/` on the branch `show-case-app`, README *Column colour*). In Dial Tool's show mode since 4.91.8 (#509: `tint_panel()` in `show.js`, the tokens on `.panel`); the dial side's panel keeps its colours. With it, the Show Case takes Dial Tool's top rule (Okay, 23:29: "This is also a rule for show case when it comes"): the canvas's top buttons as far from the top as from the side, their bottom on the title's line, the title row grown to fit, its content centred | open — note |
| 75 | Usability review, the other tabs: Rings · Hands · Windows · Export, one at a time (Okay, 12 Oct 2026) | open |

### Files

| # | Item | Status |
|---|---|---|
| 63 | **Live text in the PDF**: the SVG keeps numerals as text; the PDF is written by hand (`web/src/output.js`), so live text there means building the font into the file. Okay, 11 Oct 2026: "SVG now, PDF later" | open |

### Code and tests

| # | Item | Status |
|---|---|---|
| 14 | Heavy dials (knock-outs over hundreds of ticks take about 90 ms a slider step in Chromium, more on the Intel Mac): redraw on mouse-up if dragging feels slow | after v1 (Okay, 21 Oct 2026) |
| 69 | Split `web/src/app.js` (one class, about 5,900 lines). Scrollbars that take room (macOS "Show scroll bars: always") would make the scrolling rows about 15 narrower than the pinned ones — not reproduced here; ask Okay what his Mac is set to | open |
| 403 | **Playwright 1.56 → 1.64**: the window test's measured values (e.g. the font sheet's "184 64 -1 183") come from this Chromium build; bump it in a session of its own, re-measure, save the look again (`same.mjs save`) | open |
| 407 | **The window test in sections that stand alone** — `test/window.mjs` is one script whose later checks use what earlier ones set up; restructure it so each section sets up and restores its own state, then `node test/window.mjs --only hands,bar` runs the sections a change touches (~1 min for a small push, R19); the full run stays for a step. Meanwhile `npm run small` skips parity and Wear OS and runs the icon check only when an icon changed (`icons/changed.mjs`, 4.88.1). Also: the full run on two Chromiums at once (~3 min), and the screenshots on the full run only (Okay, 19 Oct 2026, 17:46–17:54: "Compiling and updating takes too much time … Only filter makes more sense now. Memory stuff makes sense too") | **first step done — 4.90**: `test/window-only.mjs` runs chosen sections; making each stand alone is open |

## Later

| # | Item | Status |
|---|---|---|
| 19 | More hand styles: cathedral (through file import, #50); lume plots | open |
| 20 | Subdials (small seconds, chronograph registers) | open |
| 21 | Plotter output for the pen plotter via LightBurn | open |
| 33 | Surface finishes on bands: sunray, grain, guilloché (Okay: flat for now) | open |
| 53 | **Better interface overall** — Okay, 11 Oct 2026: "better ui overall, learn and implement. Move delete layers, export better." Research first (how good parametric tools lay out lists, inspectors and export), then propose. Left of it: an export panel that shows what will be written (#171); the atlas's other interface patterns (sections 4 and 6) are not picked | open (Okay: later) |
| 100 | **The whole interface smaller on an iPad**, about 80 % (Okay, 13 Oct 2026: "note for later"). The sizes are tokens (R32), so one factor on them — or the page's zoom — can do it; the reach rule keeps small controls pressable. Decide: iPad only or a setting | open — later |
| 132 | **The font box's preview follows the switches** (Okay, 13 Oct 2026: "Slashed zero updates font preview, also fractions etc get previewed instead of abc. These are notes for later"): the preview is drawn with the box's own settings — its OpenType features (a slashed zero shows in the 0), its axes — and, when a feature that needs other text is on, shows that text in place of "Abcdefg" (fractions: 1/2 3/4; ordinals: 1st 2nd; superscript…). The preview is drawn plain (`sample()` in `app.js` passes `features: {}` and the font's resting axes). Not to be built until Okay says | open — later |
| 135 | **Weekday and month names by language, built into the tool** (Okay, 13 Oct 2026): Arabic, Farsi, European languages (which? ask), Turkish, Japanese, Chinese, Korean, as an option under the day selection. EN · TR · DE · FR · IT exist (#346); non-Latin scripts need a fallback font (#15); a month window would be a new kind (R9) or the day window's list | open — later (Okay) |
| 89 | **Movement numbers**: a *Size from movement* menu for windows [2.2] and the dial feet as a sixth kind of guide [3.8]. Blocked: only Sellita's two window sizes were read from a source (SW200-1 2.00 × 2.70 mm, SW400-1 2.40 × 3.24 mm); Ronda's are inferred, NH35 and Miyota drawings were unreadable; feet positions depend on the movement (brief §5.1). Okay opens the drawings on a Mac first | open — Later, blocked |
| 176 | **A fit section under Dial's sizes** so rings and windows fit | Later |
| 177 | **The am · pm disc as a ring of its own**, its geometry accurate and isolatable (the windows' discs show in X-ray, #346) | Later |
| 362 | **An Apple Watch preview** (Okay, 18 Oct 2026: "Future feature, some kind of preview for apple watch?"): a sibling of the Wear OS export (Export → Wear OS) — at least the dial in an Apple Watch's frame; a real watch face is not open to third parties on watchOS, so a preview or a photo face is the likely reach (to research) | open |
| 363 | **Non-round dials: square, rectangle, rounded rectangle, diamond** (Okay, 18 Oct 2026: "And all that would bring to previews and functions. At the end of the future list"): every ring, window, case, export and preview measured from a circle today | after v1, with #484 |

## Parked

| # | Item | Status |
|---|---|---|
| 15 | Fallback font for scripts the main font lacks (Eastern Arabic, Chinese: HarfBuzz has no automatic fallback). Okay, 17 Oct 2026: "Fallback set is a good idea but not necessary, we run on fonts" | parked (Okay) |
| 77 | **Persistent groupings for every section** — Okay, 12 Oct 2026: "Persistent lines are scary for me too. Sucks to have no left view height, especially on rings on iPad… Park for now." Only All hands is pinned; main selectors stand on heading lines instead | parked (Okay) |
| 180 | **Gerstner's programme** (Okay: "park for now, remind when applicable") — remind Okay when #169 exists | parked |
| 358 | **The LINK pill on other linkable pairs** (a window's width and height have it; the mechanism, `LINKED_PAIRS` in `app.js`, takes any two numbers of one ring, hand or window). Candidates: a mark's length × width, a hand's length × width, a disc hand's Ø × hole. Okay, 18 Oct 2026: "Common sense or park for now" | next · parked (brief §8) |
| 61 | **Editing on the preview**: movers and shifters drawn on the dial itself, e.g. spread the numerals. Models named by Okay: Illustrator's radial Repeat tool and its Gradient tool. The panel keeps the detailed settings; the handles are the quick way. In place: the selected ring's radius, size, start and span handles and a hand's length, tail and width handles (#345). Okay, 11 Oct 2026: "Park now" | parked |

## Side products

### Dial Packer (`packer/`, `packer/README.md`)

| # | Item | Status |
|---|---|---|
| 395 | **Place dials in the discs** (Okay, 01:36: "I will announce when to cross to placing dials"): each disc gets a dial from the Gallery or made in the app; colours from the packer's palette | **waiting for Okay's word** |
| 396 | **With the large discs off the sides, the band between them and an edge can stay thin and white** when few small discs land there (seen on 1 of 6 seeds) | noted |

### Dial Show Case (`show-case/` on the branch `show-case-app`; live at `/show-case/`) — see group K above

| # | Item | Status |
|---|---|---|
| 491 | **Ink thicknesses** for the Engineer style (Okay, 19:04: "You can tackle ink thicknesses next") | next |
| 492 | **Dial Show Case notes, 20:11**: tinted flares (grey metals white); divers' top end links copied from the bottom; bracelets lit high or low, not side-middle; ink heights as a tiny inner shadow and highlight, one value to lock; hand bevels on; Miyazaki's point light (all in `show-case/README.md`) | ink levels, bevels, flares and point light shown on a diver check, 20:11; the rest open |
| 493 | **Bracelet ends wrapped as round a wrist**, the closed loop half below the ground; no open views for bracelets | parked (Okay, 20:11) |
