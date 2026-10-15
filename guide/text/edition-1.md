# Dial Tool guide — edition 1 (text, draft 4)

*15 Oct 2026. The words of edition 1, one section per page (`## NN · Title`). Draft 2 answered the first reader round (`guide/tests/round-1.md`), draft 3 the second (`guide/tests/round-2.md`), draft 4 sets the words into the look (step 7: blocks, labels and notes per page; no claim changed). A sentence that says "do this and that happens" carries its check, `<!-- check: B8 -->`; the checks are in `guide/checks/checks.mjs` and pass on the version the page names.*

*Format, read by `guide/look/build.mjs`: `**Lead:**` the lines under the title, one sentence a line. `**Label.** words` a block. `**Watch: key.** words` a Watch note (shown as "Watch"). `**Note: key** words` a label on a picture or a caption. `**Step N · Title.** words` a step of the First dial. A table follows a `**Table: key**` line.*

## 01 · How the tool thinks

**Lead:** Five ideas explain almost everything the tool does.
The rest of the guide leans on them.

**Cap, hands, print, plate, disc.** A watch dial, seen from the side, is a short stack: from the top, the cap that holds the hands, the hands, the plate with its print, and the date disc under the plate. The tool draws that stack from the bottom up. The print on the plate is made of rings.

**A ring repeats one thing round the centre.** A ring is ticks, markers, numerals or a band, repeated at its positions: *Count* of them, from *Start °*, across *Span °*. *Every* keeps one position in so many; *Skip those instead* keeps the others. Every 3 on twelve positions keeps 12, 3, 6, 9; with Skip those instead, the eight hours in between them. <!-- check: B21 -->

**The higher ring wins.** A dial is a list of rings, top first. A ring below gives way to the rings above in one of two ways, under Rings › Give way to rings above. *Skip where* leaves out its own marks at the angles where a ring above has one: minute ticks that skip where markers stand. <!-- check: B7 --> *Knock out* keeps its marks but cuts them round the rings above, leaving a gap the width of the Clearance. <!-- check: B12b -->

**The panel edits what is selected.** Select a ring in the list, or tap one of its marks on the dial: everything below the list now edits that ring. <!-- check: B5 --> The hand tabs in Hands and the window cards in Windows work in just the same way.

**True size.** Every length is in millimetres, measured on the dial; files come out at true size. The page is the diameter plus twice the page margin: a 30 mm dial with a 3 mm margin makes a 36 mm page, and the file is still named after the dial. <!-- check: B10 -->

**Kept as you go.** There is no Save to press. About half a second after you stop, the dial is kept in this browser and written into the page's address. <!-- check: B1 --> The address is a link to the dial: send it and the dial opens at the time shown, though not on your tab or in your unit. <!-- check: B2 -->

**Watch: kept.** While time is playing nothing is kept; the dial is kept once you stop it. <!-- check: B1p -->

**Note: together** The First dial (page 05), as the tool draws it.

**Note: exploded** Exploded, not to scale, top to bottom. A row's two numbers are its size and radius.

**Note: kind Ticks** Lines, as on a minute track.

**Note: kind Markers** Bars, wedges or dots, usually for the hours.

**Note: kind Numerals** Numbers or words, in any font.

**Note: kind Band** A flat ring of colour, whole or in sectors.

**Note: layer cap** The cap holds the hands.

**Note: layer hands** The hands, at the time shown (Hands tab).

**Note: layer Numerals** Top of the list, so drawn over everything below it. Every 3 keeps 12, 3, 6, 9; the 3 gives way to the window.

**Note: layer Markers** Every 3 with Skip those instead: the eight hours between.

**Note: layer Minute ticks** Sixty ticks that skip where a marker stands (Skip where).

**Note: layer plate** The plate, under every ring, with the window cut in it (Dial tab).

**Note: layer disc** The date disc, under the plate: a file draws only what the window shows.

## 02 · The screen

**Lead:** The panel on the left, the dial on the right, the bottom bar along the foot.
Pictures from an iPad held landscape; a Mac is the same with more room.

**Note: tabs** Five tabs choose what the panel edits; the dial and the time stay as they are.

**Note: rows** The rings, top first, and buttons to add, move, duplicate or delete one. Everything under the list edits the selected ring. <!-- check: B5 -->

**Note: drawer** The drawer of the selected ring: kind, colour, size and radius (page 03).

**Note: fold** The eye beside a pane's name folds it to one line, and opens it again. <!-- check: B29 -->

**Note: title** The mark opens a note about the tool; Help opens this guide. <!-- check: B32 -->

**Note: gallery** Gallery: dials you can open and take apart. <!-- check: B23 -->

**Note: unit** The unit numbers are shown and typed in: mm, points, inches or lignes. The dial stays in millimetres. <!-- check: B2 -->

**Note: undo** Undo and redo: step back and forth through your changes. <!-- check: B3 -->

**Note: guides** Guides: construction lines, never exported. Press to hide them; the arrow picks which. <!-- check: B11 -->

**Note: look** Backdrop and Shadows: how the dial is seen, never exported. <!-- check: B11 -->

**Note: alone** The dial alone: the panel slides away. Beside it, the showcase: a dark view; press again to leave. <!-- check: B20 -->

**Note: play** Play, and its speed from 1× to 720×. While time plays, nothing is kept. <!-- check: B1p -->

**Note: time** The time: type it, or press NOW for the time it is.

**Note: day** Drag across twelve hours; its steps are the hours and 10:10, the classic pose. <!-- check: B22 -->

**Note: zoom** Zoom, and FIT to see the whole dial.

**Typing numbers.** A number field takes sums: 1.2 sets, +0.5 adds, x0.5 multiplies, /2 divides. <!-- check: B15 -->

**Gallery and mm.** Both are drawn light, but they are live: a press works.

## 03 · A ring, close up

**Lead:** Each ring has a row in the list, and a drawer under the row when it is selected.
Most of what you change is in the drawer and the panes under it.

**Note: eye** Shows or hides the ring.

**Note: grip** Drag here to move the ring up or down.

**Note: name** Its name; the sign beside it renames it.

**Note: count** How many marks, of what kind.

**Note: values** Its colour, size and radius in mm.

**Note: kinds** Its kind. Change it and back, and the ring is as it was. <!-- check: B6 -->

**Note: chip** Its colour: a tap opens the colour pop-out.

**Note: buttons** Size and radius: press one to type.

**Note: closeup** The Markers ring of the First dial, selected; twice its size on an iPad.

**The round buttons.** Press one and its number opens in a small pop-up: on a Mac it is ready to type over; on a touch screen, tap the number first. A tap anywhere else on the screen closes it. <!-- check: B24 -->

**Note: pop** The radius button, pressed: its pop-up.

**Table: buttons**

| The ring is | First button | Second button |
|---|---|---|
| ticks, markers | Length: of one mark, inward from its outer end | Outer radius: where the marks' outer ends sit |
| numerals | Size: the type size in mm, as in any layout program | Centre radius: where the numerals' centres sit |
| band | Band width | Outer radius |

**Watch: anchor.** A numerals ring's radius can measure to the numerals' centres, their baseline or their tops: the small menu in the radius button's pop-up. Centre is the start.

**Colours.** A colour opens a pop-out beside it: its × closes it; the square beside the × makes it twice the size. <!-- check: B30 -->

**Fonts.** Change… opens the font sheet, which stays open after you choose: tap outside it to close it. <!-- check: B28 --> The fonts listed there ship with the tool and look the same everywhere. <!-- check: B4 -->

**Note: colour** The Markers ring's colour, from the chip in its drawer.

**Note: font** The font sheet's list, from Numerals › Type › Change….


## 04 · The screen on a phone

**Lead:** The same tool, stacked: the bar on top, the dial, the panel as a drawer.
Everything works by finger.

**Note: bar** The bottom bar moves to the top. The round red button at its left is Play: a tap starts time, and while it runs nothing is kept, so tap it again to stop. <!-- check: B1p -->

**Note: grip** Drag the grey pill on the drawer's top line to make the drawer taller or shorter.

**Note: title** The title line, with Help, Gallery and mm, shrinks once you scroll.

**Note: rows** Long ring names are cut short; the row's "4 numerals" tells them apart.

**Note: switches** The switches over the dial show only their signs.

**The font sheet on a phone.** It covers the dial as well as the drawer, so a tap "outside" it can land on a font: close it with a tap on the dark bar at the top. <!-- check: B28p --> Colour pop-outs close with their ×.

## 05 · Your first dial

**Lead:** A black field watch, 34 mm, in ten steps; the pictures are about true size.
Each picture is a link: tap it to open the dial as it is after that step.

**Step 1 · Start from the starting dial.** Export › Settings file › *Defaults* (scroll the panel down to it). It replaces the dial you had; ⌘Z or the undo arrow brings it back. <!-- check: B3 -->

**Step 2 · Size.** Dial › Diameter: type 34.

**Step 3 · Colours.** Dial › Plate: #141414, a near-black. Then in Colours, set Numerals, Markers, Minute ticks, Hour hand and Minute hand to #EFE9DC, a warm white: tap the colour chip beside each name, then HEX, and type.

**Step 4 · A font that ships with the tool.** Rings › select Numerals › Type › *Change…*, choose Barlow, then tap outside the sheet. <!-- check: B28 --> The starting dial asks for Helvetica Neue; where it isn't installed, the panel says "not loaded" and Inter stands in. <!-- check: B4 -->

**Step 5 · Numerals.** With Numerals selected: its radius button, 11.5; its size button, 3. Under Positions, Every: 3. Now only 12, 3, 6 and 9 are left. <!-- check: B21 -->

**Step 6 · Markers and ticks.** Select Markers: radius 16.2, length 2.4; Every 3 and *Skip those instead*, so the bars stand at the eight hours between. Select Minute ticks: radius 16.2. They already skip where markers stand.

**Step 7 · The date at 3.** Windows › the card at 3 › *Show this window*. The numeral at 3 gives way to it: a window that is shown leaves out the numeral and the marker at its position, at any radius. <!-- check: B8 -->

**Step 8 · Hands.** Hands › Hour › shape *sword*; then Minute › *sword*. Length runs from the centre to the tip, Tail behind the centre, Width across the blade. The seconds hand and the cap keep their starting red.

**Step 9 · The pose.** In the bottom bar, the 10:10 step. <!-- check: B22 -->

**Step 10 · A file.** Export › *PDF*. It opens at true size: a 34 mm dial on a 40 mm page. <!-- check: B10 --> Before you print from it, read For the maker, on page 08.

**Note: whole** The First dial: what the ten steps make.

## 06 · Your first dial, continued

**Lead:** The pose and a file, and what the ten steps make.
The file is shown here at its true size.

**Note: page40** The page: 40 mm, the diameter plus twice the 3 mm margin. <!-- check: B10 -->

**Note: dial34** The dial: 34 mm, as typed in step 2.

**Note: truesize** The PDF of step 10, printed at 100 %: true size.

## 07 · Find it

**Lead:** Questions readers asked, and where the answer is.
Each answer was checked on the version named at the top.

**I want to start fresh.** Export › Settings file › Defaults, or any dial in the Gallery. Either replaces your dial; ⌘Z brings it back. <!-- check: B3 --> <!-- check: B23 --> There is no empty dial yet.

**Where do colours live?** Every colour on the dial is in one list: Dial › Colours, a chip beside each name. A ring's own colour is also in its drawer; a hand's colour is in its pane.

**Why did the 3 disappear?** A window that is shown takes its place: the numeral and the marker at its position are left out, at any radius. <!-- check: B8 --> If a minute tick was hidden under that marker, it shows again. There is no way to keep the numeral yet.

**Why isn't my window showing?** The four windows exist from the start but are hidden: Windows › its card › Show this window. A card says "(not shown)" in its name until then. Width and Height size the hole; Size % sizes the date in it, as a share of the hole's height.

**Window at 6, or Window 3?** The cards name a window by where it is; the colour list and the file's layers number them in the order they came: Window 1 is the card at 3, then 12, 6 and 9. <!-- check: B31 -->

**I asked for four numerals and got 12, 1, 2, 3.** Numerals follow the positions in order. For 12, 3, 6, 9 keep Count at 12 and set Every to 3. <!-- check: B21 -->

**Skip where, or Every?** Every chooses a ring's positions by counting, whatever is above it. Skip where leaves out positions where a ring above has a mark, and follows that ring when it changes. Minute ticks under markers: Skip where. Bars between the numerals: Every, and tick Skip those instead.

**The panel says "not loaded".** The font isn't on this device. Inter stands in until you choose one with Change…; the fonts listed there ship with the tool and look the same everywhere. <!-- check: B4 -->

**My time isn't 10:10.** The time keeps its seconds. Press the 10:10 step in the bottom bar, or type 10:10:00. <!-- check: B22 -->

**Where did my dial go?** It is kept in this browser and in the address. <!-- check: B1 --> Another browser or device doesn't have it: send yourself the link (Export › Link to this dial › Copy link), or save a settings file (Export › Settings file › Save…).

**How do I leave the showcase?** Press its switch again, bottom right. <!-- check: B20 -->

**A number field takes sums.** Type 1.2 to set a value, +0.5 to add, x0.5 to multiply and /2 to divide. <!-- check: B15 -->

**Table: signs**

| Sign | Where | What it does |
|---|---|---|
| Eye | each ring's row | shows or hides the ring |
| Grip (six dots) | each ring's row | drag to reorder |
| Text cursor in a box | the selected row | renames the ring |
| + ↑ ↓ and two more | the ring list's heading | add a ring · move up · move down · duplicate · delete |
| Four tiles | the ring drawer | the ring's kind: ticks, markers, numerals, band |
| Two round buttons | the ring drawer | size · radius: press to type |
| Four small dials | Windows | the windows whose cards sit at 12, 3, 6, 9 |
| Square with rays | over the dial, bottom right | the dial alone |
| Square with a dot | over the dial, bottom right | the showcase |
| Arrows | over the dial, top left | undo · redo |

## 08 · For the maker

**Lead:** One page for whoever etches or prints the dial.
File facts only; advice on each process waits for a first etch and a shop's questions.

**What a file holds.** A colour export holds the plate, every ring, the windows with their content, the hands at the time shown, and the cap. Guides, the backdrop and shadows are never in a file. <!-- check: B11 --> Hide the hands (Hands › Show hands) before exporting a colour file for print: hidden hands are left out. <!-- check: B26 -->

**Size.** True size, in millimetres. The page is the diameter plus twice the margin; the file name gives the diameter. <!-- check: B10 --> A PNG has its dpi written in (Export, the number under PNG), so it opens at true size. <!-- check: B18 --> The Export log names each file and its size.

**The print mask.** Export › Print › Mono print mask: every ring and the windows' frames in black on white, without plate, hands or window content. The edge of each window's hole and the centre hole are 0.05 mm cut lines. <!-- check: B12 --> The dial on screen shows the mask while it is on. <!-- check: B25 -->

**Mirrored, for toner transfer only.** It flips the file left to right. <!-- check: B13 --> Never send a mirrored file to a pad or screen printer.

**Watch: band.** Marks lying on a band disappear in the mask, black on black, unless the band knocks them out (Rings › Give way to rings above › Knock out). <!-- check: B12b -->

**Watch: cut.** The cut lines are in the same black as the marks. Delete the layers "Window 1 cut line" and "Hole" from the PDF or SVG before printing a resist; the PNG has them baked in. Without "Hole" there is no centre mark; the tool has no registration marks yet.

**One film per ink.** Export one PDF with everything shown and use its layers: one per ring, named as in the list. <!-- check: B27 --> Don't hide rings and export again: a ring only knocks out round rings that are shown. <!-- check: B14 -->

**Colour.** Colours are plain RGB values, with no colour profile. Give the printer the hex codes from Dial › Colours and a physical colour reference.

**Text.** Numerals and dates are outlines in every file. Export › "Keep numerals as text in the SVG" writes them as text in the SVG only; the font must then be installed where the file is opened. <!-- check: B19 -->

**The thinnest line.** For ticks and markers it is in the ring's settings, in its Shape pane: Width, and Inner width × if the marks taper. Numerals have no width setting: zoom into the PDF and measure the thinnest stroke yourself; the tool doesn't report it yet.

**Process advice.** Minimum line, clearance, ink order: pending a first etch and a shop's questions.

**Note: mask** The First dial as the print mask: the toner or resist.

**Note: colourfile** The same dial as a colour file, hands hidden.
