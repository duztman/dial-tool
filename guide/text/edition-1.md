# Dial Tool guide — edition 1 (text, draft 1)

*15 Oct 2026, beta 4.41.12. Step 4 of `guide/PLAN.md`: the words only, no layout. A sentence that says "do this and that happens" carries its check, `<!-- check: B8 -->`; the checks are in `guide/checks/checks.mjs` and all pass on this version. Pages are separated by `---`. A line starting `Watch:` is a Watch note, set under the block it belongs to.*

---

## How the tool thinks

Five things explain almost everything the tool does. Read them once; the rest of the guide leans on them.

### Disc, plate, print, hands

A watch dial, seen from the side, is a short stack: the date disc at the bottom, the plate with its print, then the hands, then the cap that holds them. The tool draws that stack. The print on the plate is made of rings.

### A ring repeats one thing round the centre

A ring is ticks, markers, numerals or a band, repeated at its positions. A dial is a list of rings, top first. Where two rings meet, the one higher in the list wins: a ring below can skip the places where a ring above has a mark, or be cut round it. <!-- check: B7 -->

### The panel edits what is selected

Select a ring in the list, or tap one of its marks on the dial: everything below the list now edits that ring. <!-- check: B5 --> The same is true of the hand tabs in Hands and the window cards in Windows.

### True size, in millimetres

Every length is in millimetres, measured on the dial. Files come out at true size. The page around the dial is the diameter plus twice the page margin: a 30 mm dial with a 3 mm margin makes a 36 mm page, and the file is still named after the dial. <!-- check: B10 -->

### Your dial is kept as you go

There is no Save to press. About half a second after you stop, the dial is kept in this browser and written into the page's address; reload, or come back later in the same browser, and it is there. <!-- check: B1 --> The address is a link to the dial: send it and the dial opens, at the time shown, but not on the tab or in the unit you were using. <!-- check: B2 -->

Watch: while time is playing, nothing is kept until you stop it. <!-- check: B1p -->

---

## The screen

The panel on the left, the dial on the right, the bottom bar along the foot. *(iPad held landscape; the phone is on the next page.)*

### The panel's five tabs

**Dial** — its size, the centre hole, the plate's colour, the page around it, and every colour on the dial in one list. **Rings** — the list of rings and the settings of the selected one. **Hands** — hour, minute and seconds hands, and the cap. **Windows** — up to four holes in the plate, at 12, 3, 6 and 9. **Export** — files, the print mask, the link, settings files, the log, and the Gallery.

### A ring's row

Each row in the list reads: the eye (show or hide the ring), the grip (drag to reorder), the name, how many of what kind ("12 markers"), its colour, then two numbers: **its size** and **its radius**, in millimetres.

Under the selected row sits the ring drawer. Its four tiles are the ring's kind: ticks, markers, numerals, band; a ring changed to another kind and back is as it was. <!-- check: B6 --> Then its colour, and two round buttons: size and radius. Press one to type a number. <!-- check: B24 -->

Watch: what "size" and "radius" measure depends on the kind. For ticks and markers: the mark's length, and the outer edge. For numerals: the type's size, and the radius their centres sit on.

### Over the dial

Top left, undo and redo. Top right, **Guides**: construction lines that are never exported. Bottom left, **Backdrop** and **Shadows**: how the dial is seen, never exported. <!-- check: B11 --> Bottom right, two square switches: **the dial alone** (the panel slides away) and **the showcase** (a dark view for presenting).

### The bottom bar

Play and its speed, from 1× to 720×. The time, typed or set with the slider under it; its steps are the twelve hours and 10:10, the pose watches are photographed in. <!-- check: B22 --> **Now** sets the time it is. On the right: zoom, and **FIT** to see the whole dial.

### The title line

The mark opens a note about the tool. **Gallery** takes you to the dials you can open and take apart. **mm** is the unit numbers are shown and typed in: millimetres, points, inches or lignes (the watchmakers' 2.2558 mm). The dial itself stays in millimetres. <!-- check: B2 -->

Watch: Gallery and mm are drawn light, but they are live.

---

## The screen on a phone

The bottom bar moves to the top. The dial sits under it, and the panel becomes a drawer below: drag the grey pill on its top line to make it taller or shorter. Long ring names are cut short; the row's "12 markers" tells them apart. The switches over the dial show only their signs.

---

## Your first dial

A black field watch, 34 mm: twelve numerals, minute ticks, a date at 3, sword hands. Each step is a link: open it to see the dial as it should look after that step.

1. **Start from the starting dial.** Export › Settings file › **Defaults**. It replaces the dial you had; ⌘Z or the undo arrow brings that one back. <!-- check: B3 -->
2. **Size.** Dial › Diameter: type 34.
3. **Colours.** Dial › Plate: a near-black. Then in Colours, set Numerals, Markers and Minute ticks to a warm white.
4. **A font that ships with the tool.** Rings › select Numerals › Type › **Change…** and choose Barlow. The starting dial asks for Helvetica Neue; where it isn't installed, the panel says "not loaded" and Inter stands in. <!-- check: B4 -->
5. **Numerals.** With Numerals selected, press its radius button and type 11.5; its size button, 3.
6. **Markers and ticks.** Select Markers: radius 16.2, size 2.4. Select Minute ticks: radius 16.2.
7. **The date at 3.** Windows › the card at 3 › **Show this window**. The numeral 3 and the marker at 3 give way to it; the minute tick at 3, hidden under the marker until now, shows. <!-- check: B8 -->
8. **Hands.** Hands › Hour › shape **sword**; then Minute › **sword**.
9. **The pose.** In the bottom bar, the 10:10 step. <!-- check: B22 -->
10. **A file.** Export › **PDF**. It opens at true size: a 34 mm dial on a 40 mm page. <!-- check: B10 -->

---

## Find it

**I want to start fresh.** Export › Settings file › Defaults, or any dial in the Gallery. Either replaces your dial; ⌘Z brings it back. <!-- check: B3 --> <!-- check: B23 --> There is no empty dial yet.

**Where do colours live?** Every colour on the dial is in one list: Dial › Colours. A ring's own colour is also in its drawer, a hand's in its pane.

**Why did the 3 disappear?** A window that is shown takes its place: the numeral and the marker at its position are left out, at any radius. <!-- check: B8 --> The short mark left there is the minute tick, no longer hidden under the marker. There is no way to keep the numeral yet.

**Why isn't my window showing?** The four windows exist from the start but are hidden: Windows › its card › Show this window. A card says "(not shown)" in its name until then.

**I asked for four numerals and got 12, 1, 2, 3.** Numerals follow the positions in order. For 12, 3, 6, 9 keep Count at 12 and set Every to 3. <!-- check: B21 --> Every 3 with "Skip those instead" gives the other eight: the hours between.

**The panel says "not loaded".** The font isn't on this device. Inter stands in until you choose one with Change…; the fonts listed there ship with the tool and look the same everywhere. <!-- check: B4 -->

**My time isn't 10:10.** The time keeps its seconds. Press the 10:10 step in the bottom bar, or type 10:10:00. <!-- check: B22 -->

**Where did my dial go?** It is kept in this browser and in the address. <!-- check: B1 --> Another browser or device doesn't have it: send yourself the link (Export › Link to this dial › Copy link), or save a settings file (Export › Settings file › Save…).

**How do I leave the showcase?** Press its switch again, bottom right. <!-- check: B20 -->

**A number field takes sums.** Type 1.2 to set, +0.5 to add, x0.5 to multiply, /2 to divide. <!-- check: B15 -->

**The signs without words.**

| Sign | Where | What it does |
|---|---|---|
| Eye | each ring's row | shows or hides the ring |
| Grip (six dots) | each ring's row | drag to reorder |
| + ↑ ↓ ⧉ 🗑 | the ring list's heading | add a ring · move up · move down · duplicate · delete |
| Four tiles | the ring drawer | the ring's kind: ticks, markers, numerals, band |
| Two round buttons | the ring drawer | size · radius: press to type |
| Four small dials | Windows | the windows at 12, 3, 6, 9 |
| Square with rays | over the dial, bottom right | the dial alone |
| Square with a dot | over the dial, bottom right | the showcase |
| Arrows | over the dial, top left | undo · redo |

---

## For the maker

One page for whoever etches or prints the dial. File facts only; advice on each process waits for a first etch and a shop's questions.

**What a file holds.** A colour export holds the plate, every ring, the windows with their content, the hands at the time shown, and the cap. Guides, the backdrop and shadows are never in a file. <!-- check: B11 --> Hide the hands (Hands › Show hands) before exporting a colour file for print: hidden hands are left out. <!-- check: B26 -->

**Size.** True size, in millimetres. The page is the diameter plus twice the margin; the file name gives the diameter. <!-- check: B10 --> A PNG has its dpi written in, so it opens at true size. <!-- check: B18 --> The Export log names the size of every file written.

**The print mask.** Export › Print › Mono print mask: every ring in black on white, without plate, hands or window content. The window and the centre hole are drawn as 0.05 mm cut lines. <!-- check: B12 --> The dial on screen shows the mask while it is on. <!-- check: B25 -->

**Mirrored, for toner transfer only.** It flips the file left to right. <!-- check: B13 --> Never send a mirrored file to a pad or screen printer.

Watch: marks lying on a band disappear in the mask, black on black, unless the band knocks them out (Rings › Give way to rings above › Knock out). <!-- check: B12b -->

Watch: the cut lines are in the same black as the marks. Delete the layers "Window 1 cut line" and "Hole" from the PDF or SVG before printing a resist; the PNG has them baked in. Without "Hole" there is no centre mark, and there are no registration marks yet.

**One film per ink.** Export one PDF with everything shown and use its layers: one per ring, named as in the list. <!-- check: B27 --> Don't hide rings and export again: a ring only knocks out round rings that are shown. <!-- check: B14 -->

**Colour.** Colours are plain RGB values, with no colour profile. Give the printer the hex codes from Dial › Colours and a physical colour reference.

**Text.** Numerals and dates are outlines in every file. Export › "Keep numerals as text in the SVG" writes them as text in the SVG only; the font must then be installed where the file is opened. <!-- check: B19 -->

**The thinnest line.** For ticks and markers it is in the ring's settings: Width, and Inner width × if the marks taper. Numerals have no width setting: zoom into the PDF and measure the thinnest stroke. The tool doesn't report it yet.

**Process advice** (minimum line, clearance, ink order): pending a first etch and a shop's questions.
