# Dial Tool guide — the plan

*Status, 15 Oct 2026, 13:40: steps 1–8 done; edition 1 is out at https://duztman.github.io/dial-tool/guide/ (composer `guide/look/`); the human round of step 6/8 waits for two people (`guide/tests/humans.md`). Next: step 9 (Okay's production round), then edition 2.*

*Agreed 15 Oct 2026, 09:44 (Okay: "Do it, go ahead … who cares about an old version. Do it for now"). Written 15 Oct 08:50–09:40 from first principles, then reviewed in three rounds by three fresh reviewers who saw only this plan and the live app (beta 4.41.11): a newcomer, an information designer, a maker and skeptic. All three signed off. Replaces the guide locked to beta 4.36.1 (build list #93). Shared copy: https://claude.ai/code/artifact/69a9d228-400c-4bdc-b0ba-2f28ee203636*

**Okay's notes are canon for page design:** `guide/notes-okay.md` (all review rounds, 14 Oct). Where this plan and the notes differ, the notes win — for example screenshots go through the section colour's gradient map onto rounded cards with a soft shadow, and the ring list is shown taken apart row by row, each row joined to its ring lifted off the dial (top row = top layer; drawing order, not press order).

App: https://duztman.github.io/dial-tool/

## 0 · Purpose
- Take a newcomer from a link to a true-size file they understand; take a maker from a file to a print.
- Readers: newcomers sent a link (first) · the owner later · a maker or printer (one sheet is theirs).
- Out of scope: developers, history, inspiration.
- **Every "do X and Y happens" sentence is checked by script against the app** (do the action, keep the screenshot) and gates the build. Everything else (advice, file practice) sits on a dated checklist a person reads at each release. No claim from memory; behaviour is stated as observed, dated.

## 1 · Medium and editions
- One source: HTML blocks on a 12-column grid. A4 landscape: spreads. Phone: blocks stack.
- **Edition 1 · web, the core (~10 screens):** four models · the screen · first dial · find it · maker sheet.
- **Edition 2 · web + print (~26 A4 landscape pages, ~6 generated).** Print is for presenting and for the maker. It does not wait for the production round; the sheet's process part stays blank and dated until then.
- Rebuilt only when Okay asks (16 Oct 2026; `guide/make.sh`), not on each release; the picture diff then shows what changed since the last guide. *Before: the diff, run on every release, decided.*
- The look: the project's design canon (Braun printed matter, one grotesque, strict grid, real values), decided on three spreads in iteration 7.
- Released only with a help link in the app (release condition for edition 1) and per-pane anchors (edition 2).

## 2 · Signature ideas
- **Dial pictures are dial links** (web). Print shows the recipe and one QR per spread to that spread's web page at a stable path on the guide's own site.
- **Recipe, bounded:** per ring: kind, count, size, radius, colour, plus only values that differ from that kind's default.
- **The exploded dial, "exploded, not to scale":** date disc · plate with its print as one sheet · hands · cap. Knock-out shown as holes. Beside it, the ring list as a ranked list with leaders: what wins where rings meet. Made by script from per-ring exports.
- **One change per row,** in the app's words: count 4 · 12 · 60 · span 360 · 270 · 180 · Knock out: nothing · markers above · everything above · Skip where on its own row.
- **Pictures come from the app.** Dials: settings through the app's own export. Interface: user-level steps (click by visible name), crop from the visible element's box. The composer only greys, crops and places callouts. Captions carry the app version.
- **Interface crops:** true scale at a stated print scale (1 iPad point = 0.2 mm on A4), greyscale except the control discussed, ring callout; a framed "× 2" inset only where needed. Two box sizes: inline, pop-over. Canonical device: iPad landscape, stated; phone crops where the phone differs (bar on top, drawer, cut names).
- **Words:** a word list built from the app's labels and accessible names; the guide's own coinages marked as such. Bold at first use, margin definition. App collisions noted in the margin, dated, and filed.
- **Guide dials use bundled fonts only,** checked by the build.

## 3 · Structure
**Edition 1**
- **Four models.** (1) Physically: date disc, plate with its print, hands, cap. (2) In the ring list, the top ring wins where rings meet. (3) Select a row or tap a mark on the preview: everything below edits that ring. (4) True mm; the page margin lies outside the dial; your dial is its link, autosaved in this browser only.
- **The screen:** tabs, preview, bottom bar, corner switches, each named; its phone page.
- **First dial:** Defaults (Export › Settings file; Undo if you slip) → change the font to a bundled one → black field watch: numerals, minute ticks, date at 3, sword hands → export. Each step a link.
- **Find it** (each answer script-checked): start fresh · where colours live · why the 3 disappears (the numeral and the marker at a window's position are both dropped, no override; the short mark left is the minute tick, no longer skipped) · "not loaded" font · where my dial went · leaving the showcase · every unlabelled icon named.
- **Maker sheet** (§4).

**Edition 2 adds**
- **Build** (8 spreads, by task): size, margin, guides, mask preview · add, order and select rings · marks and positions (every, offset, skip those instead) · numerals and type (fonts, nudge, Lang.) · bands and sectors · give way · hands (each hand's shape, import) · windows (shows, shapes, clearance).
- **Present and share:** time and speed · showcase · dial alone · shadows · links, settings file, Gallery.
- **Shortcuts and hidden moves:** arithmetic in fields · units and lignes · ⌘+scroll · Scale everything.
- **Gallery recipes:** 4 cards on 2 spreads (band + knock out · numerals and type · windows · hands).
- **Reference (generated):** every setting by tab › pane › state · word list.

## 4 · Maker sheet (generic; one page; also a stand-alone PDF)
- What each export holds and leaves out: hands, date content, shadows, guides, backdrop. Hide hands before a colour export for print.
- Size: the page is diameter + 2 × margin; the file name gives the dial, not the page; read the Export log line.
- Mask: black on white, positive (toner where the marks are → raised marks); no invert yet. Preview it with Mono print mask before exporting.
- **Mirror only for toner transfer. Never send a mirrored file to a pad or screen shop.**
- Marks lying on a band vanish in the mask unless the band knocks them out (the failing example shown).
- Cut lines (window, centre hole) are 0.05 mm hairlines in the resist colour: delete their layers from the PDF or SVG before printing a resist. The PNG mask has them baked in: use PDF or SVG for a resist. Deleting "Hole" removes the only centre reference; no blank outline or registration marks yet.
- **Films per ink: from the PDF layers of one full export. Never hide rings and re-export: knock-out ignores hidden rings.**
- Colours are RGB with no profile: give hex codes and a physical colour reference.
- Thinnest line: ticks and markers from each ring's width and taper; numerals have no width control, so their strokes are measured on the mask (zoom the PDF to a known scale; steps given). Until the app reports it.
- Process advice: "pending first etch and shop round", dated.

## 5 · How it's made
- Pictures as data: dial = settings + export; interface = dial + user-level steps + crop target.
- Coverage: one scripted walk of states (ring kinds × window shows × shapes × hand tabs), labels and accessible names filtered of values, keyed by path. Report, not gate.
- Diff: pixel threshold, header cropped; flags go to a human look.
- Build gates: links open · bundled fonts only · every behavioural check passes · text fits its box (print only). Non-behavioural claims: the dated release checklist.
- Hours logged per iteration from day 1; the check scripts count as pipeline. Pipeline ≤ a third (estimate 45 h, pipeline 11 h). Over: edition 2's crops shrink to the screen page and pop-overs. Re-estimated after edition 1.

## 6 · Iterations
1. **Inventory:** walk the app; every task, label, behaviour; word list; app faults filed; coverage walk run once (time, counts, one caught error).
2. **Brief:** readers, editions, device policy, scale, tolerances, on one page.
3. **Baseline:** three fresh readers, app only, target sheet; times and stalls logged.
4. **Edition 1 text**, every behavioural claim script-checked.
5. **First dial** with plain exports and plain screenshots (no composer yet).
6. **Reader test:** three fresh readers with the guide, iPad and phone (phone stalls logged apart). At most two rounds; then ship with remaining stalls listed.
7. **The look:** three spreads at A4 and 390 px from one source; composer built. Gates: exploded dial shown to two fresh readers ("what is printed first?"); one pop-over crop and one selected-ring crop by user-level script from cold start, then a label change caught by the diff; the four-models spread at both widths at the stated scale.
8. **Edition 1 out** (web), with the help link in the app.
9. **Production round** (owner, whenever it happens): one etch from the mirrored mask, one shop sent the colour PDF and the sheet; questions counted; the sheet's process part filled, dated.
10. **Edition 2** in batch; coverage report reviewed. Gates: a print-only recipe rebuilt within tolerance; the four Gallery dials named; the maker sheet handed to a maker, questions counted.
11. **Print proof** on paper: type, greys, QR at size → edition 2 out.
- Hours, estimated: 4 · 0.5 · 1.5 · 3 · 2 · 3 · 7 · 2 · (owner) · 20 · 2 = 45 h, of which pipeline 11 h.

**The reader test, written now**
- Target sheet: a picture at true size plus diameter and two key dimensions; not in the Gallery or the guide.
- Pass: the reader's export overlaid on the target at true size — counts and kinds exact, every mark within 0.2 mm, sizes within 10 % — with no stall needing outside help; for humans also ≤ 15 min. Times reported raw.
- Stall (humans): 60 s without progress, or a question asked. AI readers: stall count and accuracy only. All stalls logged, including those solved.
- Readers: fresh AI readers (app only, no source) for each round; the last round of each edition adds at least two humans new to the app, and needs them to pass.

## 7 · Dependencies on the app (its build list)
- **Edition 1 release conditions:** a help link; Defaults without a missing font (or the font step stays in First dial).
- **Wanted:** a blank start; per-pane anchors; export options to leave out hands and window content; mask invert; cut lines on their own layer only, never in the resist; blank outline and registration marks; knock-out that holds when rings are hidden; thinnest line reported in the Export log, numerals' strokes included; app version in exported files; a way to keep a numeral at a window's position; word collisions resolved (Backdrop, Frame, Size, Ring Ø, a ring named after a kind); "Add image…" is a dead end ("Not built yet"): build or hide.

## 8 · Standing rules
- State current behaviour, dated; never write around a fault.
- No process numbers without a real test.
- Pictures are scripted or not made; claims are checked by script, or listed on the release checklist.
