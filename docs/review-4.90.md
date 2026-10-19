# Beta 4.90 — what was built alone, for Okay's approval

*Written 20 Oct 2026, 02:02–05:20, on the branch `wip-4.90` (from `dev` at beta 4.89.12). `dev`, `main` and the live page are untouched. Okay, 02:02 (he first called it "beta 5 v01"; 02:53: "This should not be called beta 5 … Normal progression"): "Build functionality … noted and screenshotted for my approval later, not messing with current build … We might do a design round later."*

How it was built: every new control takes the nearest look Okay has already passed (a tick with its note under it, a full number row, a switch of the preview's make, the Guides list's dark popup, the Gallery's cards). The look of each is for the design round. Every new setting starts as the tool drew before, so older links and files draw as they did (R31: no new link scheme; the new keys are appended to `LINK_KEYS`). Pictures: `archive/screens/2026-10-20-4.90/`.

To try it: the private preview page (the *Dial Tool* artifact), or `git checkout wip-4.90` and open `web/dial-tool.html`.

## Built

| # | What | Where | Claude's readings — say if wrong |
|---|---|---|---|
| 435 | **Versions** under undo: a switch with a dial-with-two-hands sign; its list holds *Save this dial* and *Compare* on the top line, then the saved dials as the Gallery's cards, three across (Edit this dial · In a new tab · Remove). Nine at most: the tenth replaces the oldest, and the list says which one is next to go. Cards are arranged by dragging, in the list only. **Compare**: the panel slides away, every saved dial stands on the backdrop at one size, packed as the print sheet packs (straight or staggered rows, whichever holds them larger), centred; Compare again, the eye or Escape ends it. The Gallery no longer holds *Yours*. | preview, top left | "Snapshots" = the saved dials (not automatic ones). Compare shows each dial's picture as saved, all at one size, not to scale. *Versions* also names the app's builds (`docs/versions.md`): the glossary flags it. "Replace the first" = the oldest by when it was saved, wherever it was dragged to. |
| 219 | **What the windows show** (Print, while a window is on): off, the discs, numbers and pictures are left out and the holes stay empty — a face for a printer. Hands are left out with Show hands. | Export › Print | One tick for window content (hands already have Show hands). Preview and file alike (R26), so the preview shows the empty holes too. |
| 221 | **Hidden rings still cut**: a hidden ring still knocks out and skips the rings under it, as if shown, and is not drawn — so a film made by hiding rings keeps its holes. | Export › Print | Preview and files alike (R26), not files only as asked on 19 Oct: one scene, no surprise between what is seen and what is written. |
| 222 | **Cut lines** (mask): on to start; off, the windows' and the centre hole's cut lines leave the mask (PDF, SVG, PNG). | Export › Print, with the mask on | One tick for all three files, not "PNG leaves them out, PDF keeps them". |
| 223 | **Inverted** (mask): toner everywhere inside the dial but the marks — the dial's disc less every mark, one shape. | Export › Print, with the mask on | Inside the dial only; the page round it stays white. |
| 224 | **Outline and registration marks** (mask): the blank's edge (a 0.1 mm ring just outside the dial) and a 4 mm ring-and-cross in each corner of the page; smaller if the corner is tight, none under 1.5 mm, and the note says so. Not on the print sheet's copies. | Export › Print, with the mask on | Corners, not the margin's sides: they hold a mark even with no margin. |
| 448 | **The ring list's pill** shows whenever it has a use: the list scrolls (fewer rows kept than rings), or it was made taller than five. | Rings | |
| 233 | **Diameter stops at 5 and 300 mm** when typed or dragged past, and says so on the preview and in the log. | Dial | 5–300 is Claude's choice: wrist to wall clock. Other numbers can take `limits` the same way. |
| 234 | **Changes are kept while time plays**: a change starts the 0.4 s wait as before; frames that only move the time no longer restart it, and the session is kept every 2 s. | — | |
| 406 | **A slider grows finer away from its track** (mouse, pen): the press puts the value where it lands; sideways travel then moves it as the track would, at full speed within 12 px of the track, half about 75 px off it, a third about 120 px … down to a twentieth. A finger opens the controller, as before. | every slider in the panel and the controller | Measured: 30 px along moves Diameter 11.6 on the track, 3.2 at 150 px below it. Nothing shows the speed yet (design round). |
| 187 | **Units typed in a length's field**: `0.5in`, `12pt`, `3mm`, `0.3cm`, `1lig`, `0.5″`, `+1mm`; turned into the unit box's unit. Never on the controller; the boxes show numbers only. | every length field | |
| 172 | **Undo steps named** by what they changed ("Numerals · Radius", "Hour hand · Length", "Window 1 shown", "Diameter"), on the undo and redo buttons' tags and in the log; a third box beside undo · redo lists the last 20, a press goes back (or forward) to that step. | preview, top left | "Undo steps limit to 20" read as the list showing 20; undo itself still keeps 200. Names are read by comparing two states, so nothing extra is kept. |
| 401 | **Jumps** (am · pm window): the disc snaps to am at midnight and to pm at noon; off, it sweeps as before. | Windows | |
| 225 | **The thinnest line and the narrowest gap** in the Export log on every file: the narrowest mark, band, hand or frame, and the smallest knock-out clearance; numerals and text are named as not measured (no stroke width to read). | Export log | Read from the settings, not measured on the shapes. |
| 88 | **Weight %** under Dial: every width on the dial at once (marks and walls, bands, hands and their disc's mark, frames), as Scale changes every measure, so the panel's numbers stay true; the note under it says lengths and places stay and one undo takes it back. | Dial | Weight is the window's state (not in a link): the widths carry it. After an undo it still shows its last value. |
| 171 | **A set of files**: ticks for Dial PDF · SVG · PNG, Mask PDF, Mirrored mask PDF and PNG, Print sheet; *Export ticked* writes them one after another. | Export › A set of files | Chrome asks once whether the page may save several files; the log says so. |

## Noted, not built

- #468: Compare packs densely when the count is uneven, as Dial Packer does (02:21, "note for later").
- #469: units — as built.
- #470: the 20 of the steps list — asked above.

## Questions for Okay

1. Versions: is the name right, given the app's builds are also "versions"?
2. Compare: one size for all, or each dial to scale?
3. Undo: 20 shown in the list, or 20 kept?
4. Hidden rings still cut (#221): preview too, as built?
5. Diameter's limits: 5–300 mm?
6. Numbering (02:53): write into R19 that the second and third numbers each run to 99 and that v1 (no "beta") comes on your word?

## Rules touched

- R26 unchanged: every new option is in `scene()`, preview and file alike.
- R31: no new scheme; `LINK_KEYS` appended (out_window_content, out_hidden_cut, out_cutlines, out_invert, out_marks, the seven out_f_ keys, jump, da_jump).
- R34: one mechanism each — `pack_discs` for the sheet and Compare; `limits` on number rows; the export's `over` for a set of files; `GEOMETRY_AFTER_ALL` for an output key that changes shapes.
