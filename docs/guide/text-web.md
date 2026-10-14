# Dial Tool — guidebook text (draft 1)

*14 Oct 2026, beta 4.36.1. The words of the new guidebook, page by page, before any picture or layout (build list #93). Plan: `docs/guide/outline-web.md`. Okay, 12:14: "less jargon … explain in layman's terms, leave the jargon for references … short prose … minimal bullet points." Each page has a title, a lead (the line under the title) and its blocks; a block's label is in small capitals in the book. [Square brackets] are notes for whoever builds the page, not text.*

---

## 00 · Cover

**Dial Tool**
Guidebook · beta 4.36 · October 2026

A tool for drawing watch dials in a web browser. You describe a dial the way a watchmaker would think about it — a few rings of marks and numbers, three hands, a window or two — and it draws it at its true size, ready to print, etch or cut.

[Contents down the left, as on the 4 Oct cover.]

---

# A · Start

## 01 · Start

**Lead:** Open the address and start drawing. Nothing to install, nothing to sign up for.

**Where it lives.** The tool is a single web page: duztman.github.io/dial-tool. It works in any current browser on a Mac or a PC, and on an iPad with your finger. Chrome and Edge do a little more: they can use the fonts already on your computer.

**Everything is in millimetres.** A dial here is the size it will be on your wrist, usually between 28 and 40 mm across. Every length you type is a real length. If you think in points, inches or *lignes* (the watchmaker's own unit), change it in the box at the top right; the dial doesn't change, only the numbers you read.

**The link is the dial.** Whatever you draw is written into the page's address as you go. Copy the address and you have saved the dial; send it to someone and they open the same dial. There is no account and no file to keep, unless you want one.

**Changed your mind?** Undo and redo sit at the top left of the dial (⌘Z and ⇧⌘Z on a keyboard). The tool remembers each change once you stop for a moment.

**Watch.** A link carries the dial, not the fonts. If you used a font from your own computer, the person you send it to needs the same font, or they will see a stand-in.

---

## 02 · A first dial, in ten pictures

**Lead:** From an empty plate to a field watch in ten steps. Each picture is one change.

**1 · The plate.** Open the Dial tab. Set the diameter to 36 and pick a colour for the plate. This is the disc everything else sits on.

**2 · The minute track.** Open Rings and add a ring of ticks. Sixty short lines around the edge: this is the minute track every watch has.

**3 · The hours.** Add a ring of markers: twelve bars, longer and wider than the minute ticks, at the same distance from the centre.

**4 · Let them make room.** The minute ticks still run under the hour bars. Tell the ticks to *give way* to the markers and they step aside wherever a bar stands.

**5 · The numbers.** Add a ring of numerals. Twelve numbers, inside the markers. Move them in or out until they breathe.

**6 · The font.** Choose a font for the numerals from the list. You see every font as numbers, so you choose by eye, not by name.

**7 · The hands.** Open Hands. Pick a shape for the hour, minute and seconds hand, and make each one long enough to reach its own ring.

**8 · A date.** Open Windows and switch on the window at 3. A small opening appears with today's date in it.

**9 · Colour.** Give the seconds hand a colour of its own. One accent is usually enough.

**10 · Out.** Open Export and save a PDF. It is the dial at its true size, ready for the next step.

[Each step a small dial, as the window draws it; the change in that step in black, the rest grey. Ends with a link to the finished dial.]

---

## 03 · The window

**Lead:** Settings on the left, your dial on the right, the time along the bottom.

**Five tabs.** Across the top of the panel: Dial, Rings, Hands, Windows and Export. Each opens its own set of settings below. You will spend most of your time in Rings.

**The panel.** Settings come in groups, each under a thick line with a name. The eye beside a name folds the group away when you don't need it. Some lines stay pinned at the top while the rest scrolls, so you always know which ring or hand you are working on.

**The dial.** It is drawn live: every change shows at once. Drag to move it, pinch or scroll to zoom, and *Fit* brings it back to the middle.

**Point and click.** Hover over any part of the dial and its name appears; click it and the panel jumps to its settings. This is often the quickest way to find something.

**The bottom bar.** The hands follow the time. Play them at real speed, sixty times or seven hundred and twenty times faster, or drag along the bar to any hour. A click lands exactly on the hour, or on 10:10, the time watches are photographed at.

**Hiding the panel.** The square at the bottom left puts the panel away, leaving the dial alone on the screen.

---

## 04 · The window, drawn whole

**Lead:** The whole window in grey, with every part numbered.

[A full-page grey-toned screenshot from Chromium, numbered callouts. Each callout one line, as below.]

1. The tool's name and version. 2. Units. 3. The five tabs. 4. A group, with its eye. 5. A slider, a number field and minus · plus: three ways to set one value. 6. A colour: a click opens the colour box. 7. Undo · redo. 8. Guides: the drawing aids. 9. Backdrop: the colour behind the dial. 10. Play and speed. 11. The time. 12. The day, from 12 to 12. 13. Zoom and Fit.

**Typing numbers.** A number field also does small sums: type *+0.5* to add, *x2* to double, */3* to take a third. Useful when a drawing says "a third of the radius".

**On an iPad.** Everything works by finger. Small controls answer to a press a little outside their edge, and a number field grows larger when you touch it.

---

# B · Build

## 05 · Dial and page

**Lead:** The plate, the space around it, and every colour on the dial in one list.

**Diameter.** How wide the dial is, edge to edge. Tick *Scale everything with it* and the whole design grows or shrinks with it, rings, numerals and hands together. Leave it off and only the plate changes, which is what you want when you are fitting a design to a case.

**Plate.** The colour of the dial itself.

**Page.** When you export, the dial sits on a page with a margin around it. The backdrop is the colour you see behind the dial on screen; it is never exported.

**Colours, all in one place.** The last group lists every colour the dial uses: each ring, each hand, the cap, each window. Change them here when you want to see the whole palette at once.

**The colour box.** Any colour opens the same box beside it. The top row shows the colours already on this dial, so it is easy to reuse one. The second row is your own palette of ten, plus any you add. Below are the colour field and its values, which you can copy. Rings can also be see-through: lower the opacity to let the plate show through.

**Watch.** Your palette is kept by your browser, not by the dial. A link carries the dial's colours, not your palette.

---

## 06 · Rings

**Lead:** A dial is a short list of rings. Each ring repeats one thing around the centre.

**One idea.** Almost everything printed on a dial is something repeated in a circle: sixty ticks, twelve bars, twelve numbers, a coloured ring. So the tool has only one thing to build with: the ring. A field watch is four or five of them. A complicated dial might be fifteen.

**Four kinds.** A ring repeats *ticks* (thin lines, like a minute track), *markers* (heavier shapes for the hours), *numerals* (numbers or words) or a *band* (a ring of flat colour). You can change a ring's kind at any time; it keeps everything you set.

**Top first.** The list is in stacking order. The ring at the top is drawn last, in front of the others. Drag a ring by its handle to move it up or down.

**Working on a ring.** Click a ring to choose it. Under it opens a small drawer with its main controls: its kind, its colour, its size and its distance from the centre. Everything else about the ring follows in the groups below. The eye in its row hides a ring without deleting it; click its name to rename it.

**Copy and reuse.** The buttons on the list's heading add, move, duplicate and delete. A numerals ring can also take the type of another one, so two rings of numbers always match.

---

## 07 · Positions

**Lead:** Where a ring puts its things. Six numbers describe almost any track or scale.

**How many, where, how far.** *Count* is how many things the ring places. *Start* is where the first one sits, in degrees, with 0 at twelve o'clock and the angle growing clockwise. *Span* is how far round they go. A full turn, 360, spaces them evenly around the dial.

**Part of a circle.** Give a span smaller than a full turn and the things are spread over that arc, with one at each end. This is how you draw a scale that runs from seven to five, like a gauge.

**Only some of them.** *Every* keeps one in so many: every 3rd of twelve gives the quarters, 3, 6, 9 and 12. *Offset* moves that choice along by one or more. *Skip those instead* turns it round: every 3rd skipped gives the eight hours that are not quarters.

**Watch.** Distances are measured from the centre of the dial, not from the edge. Make the dial bigger without *Scale everything* and the rings stay where they were.

---

## 08 · Marks

**Lead:** Ticks and markers share one set of shapes.

**Three shapes.** A *bar* is a straight line. A *wedge* is wider at the outside than the inside, like a slice of pie, or the other way round. A *dot* is round.

**Size.** Length is how far a mark reaches inwards; width is how wide it is. For a dot, the width is its diameter.

**Finish.** Round the outer or inner end, or both, for softer marks. *Hollow* turns a mark into an outline of a given thickness, so a dot becomes a small ring and a bar a frame.

**The mark at twelve.** On most watches the twelve is different: two bars, a triangle, or nothing at all to leave room for a logo. A markers ring can give its first position its own style and size.

---

## 09 · Give way

**Lead:** How a ring behaves when another ring is in its way.

**The problem.** Lay a minute track under hour markers and the two overlap at every hour. Real dials solve this in two ways, and so does the tool.

**Step aside.** A ring can *skip* its own marks wherever a ring above it has one. The minute ticks then stop at each hour, leaving the marker on its own.

**Cut a gap.** A ring can *knock out* a gap around the shapes above it, at a distance you choose. A coloured band then stops neatly around a number instead of running behind it.

**Which rings count.** You choose what to give way to: only markers, markers and numerals, or everything above. Rings below are never affected.

---

## 10 · Bands and sectors

**Lead:** Flat colour: full rings, thin rails, zones and slices.

**A ring of colour.** A band is coloured from its outer edge inwards, as wide as you set. A hairline band is a rail; two rails with ticks between them make the "railroad" track of older watches.

**Pieces.** Give a band a count above one and it splits into segments. *Fill* says how much of each step a segment covers, so a band can become a dashed ring or a set of separate zones.

**Pie slices.** Make a band as wide as its distance from the centre and the segments reach the middle: slices, as on a sector dial.

**A colour each.** Each segment can have a colour of its own. Without one, it takes the ring's colour.

---

## 11 · Numerals

**Lead:** One number, word or sign at each position.

**Ready-made sets.** Arabic numbers, Roman numbers (with IIII or IV for four, as you like), Eastern Arabic, Chinese, or the hours written as words.

**Counting.** Choose *Numbers* and the ring counts for itself: start at 5, add 5 each time, and a ring of eleven gives 5 to 55, the minutes of a pilot's watch. Set how many digits to show, and where the count starts again, for a 24-hour ring.

**Your own list.** Type any list, separated by commas: letters, words, symbols. Leave a place empty to leave a position blank.

**How they sit.** *Upright* keeps every numeral level. *Radial* turns them with the circle, like spokes, and can flip the lower ones so nothing reads upside down. *On the path* sets the letters along the curve, for a line of text that follows the edge.

**Which point sits on the line.** The ring's distance from the centre can measure to the middle of each numeral, to the line it stands on, or to its top, so a row of numbers can hang from one circle.

---

## 12 · Type

**Lead:** Every numerals ring has its own type. You choose fonts by looking at them.

**Twenty fonts to start.** The tool comes with twenty open-licence font families chosen for dials: narrow and wide, technical and soft. They work on every device and travel with a link.

**Choosing.** Open the font list from the font box. Each font shows its own numbers, 1 to 0, so you compare the figures that will actually be on the dial. The small labels beside each say what it can do: its range of weights, italics, special figures. *Find* searches by name.

**More fonts.** Paste a Google Fonts name or link, or a link to a font file, or add a file from your computer. In Chrome and Edge, *Installed* lists the fonts already on your machine.

**Size and spacing.** Size is the height of the numerals in millimetres. Tracking adds even space between letters, for words and numbers of more than one digit.

---

## 13 · Type, in detail

**Lead:** What a good font can do beyond its weight.

**Sliding fonts.** Some fonts are drawn so you can slide them: lighter to heavier, narrower to wider. Each slide appears as its own control, so you can set a weight between the usual steps, exactly for the size you print at.

**Hidden figures.** Many fonts hold alternative drawings of their numbers: figures of equal width so a column lines up, a zero with a slash, a different 1 or 7. The font box lists them in plain words; tick the ones you want. The legend in the font list explains the short codes.

**Language.** Some letters change between languages, the Turkish dotted İ for one. Set the ring's language and the font uses the right forms.

**Nudging one numeral.** The eye forgives a circle less than a ruler does. A 1 can look too far from its neighbours; a wide 12 can crowd the markers. Choose any single numeral and move it in or out, turn it, or make it a little larger or smaller, without touching the rest.

---

## 14 · Hands

**Lead:** Three hands, each with its own shape, size and colour.

**Shapes.** Baton, pencil, sword, dauphine, leaf, arrow, syringe, Breguet and lollipop, the shapes watch hands have taken for a century.

**Size.** A hand's length is measured from the centre to its tip. Width is how wide it is; the tail is how far it reaches back past the centre. The detail box at the left shows the chosen hand on its own, large, as you change it.

**Details.** The tip can be longer or shorter. Arrow and syringe hands have a head or a barrel whose width and place you set. Breguet and lollipop hands have a ring or disc near the tip. Any hand can have a counterweight on its tail, round ends, or be hollow, an outline with a gap inside, as on hands filled with luminous paint.

**All hands.** The line at the top shows or hides all three at once and sets how the seconds hand moves: smoothly, in one jump a second like a quartz watch, or in six or eight small steps a second like a mechanical one.

**The cap.** The small disc over the centre that holds the hands, with its own size and colour.

---

## 15 · Windows

**Lead:** Up to four openings in the dial, each showing something.

**Where.** The four cards at the top stand for windows at 12, 3, 6 and 9. Choose a card, tick *Show this window*, and set its place: one of the hours, the half hours, or any angle, at a distance from the centre.

**What it shows.** The date, the day of the week, AM or PM, or the phase of the moon. The date and day follow the time in the bottom bar; AM · PM changes as the hands pass twelve; the moon shows the age you set.

**Shape.** A rectangle, a circle, a polygon of any number of sides, the arch of a moon window, or an arc that follows the curve of the dial. Corners can be rounded. A window off the quarters can turn to face the centre, and its text with it.

**Frame and room.** A printed frame can run round the opening. *Clearance* keeps the print of the rings away from the window by the distance you set, so nothing is cut in half by the hole.

**Colours.** The colour of what shows through, of the disc under it, and of the frame.

---

## 16 · Guides

**Lead:** Thin coloured lines that help you see. They are never printed.

**Switching them.** The Guides button at the top right of the dial turns them on and off. Its arrow opens the list where you choose them.

**The dial's guides.** The edge of the dial, the two centre lines, and the circles windows sit on. Each can have one of eight colours, or none.

**Each ring's edges.** Every ring can show its own outline in its own colour, so you can see exactly where it starts and ends. Show them for all rings, only the one you are working on, or none.

**Your own.** Add a straight line at any angle, a crosshair at a point, or a circle at any distance. Useful for lining things up with a drawing or a movement's measurements.

**Watch.** Guides follow the colour behind the dial, so they stay visible on light and dark dials alike.

---

# C · Out

## 17 · Export

**Lead:** Your dial as a file, at its true size.

**PDF and SVG.** Drawings made of lines and shapes rather than pixels, at exactly the size of the dial. Open them in Illustrator, send them to a printer, or use them for cutting. Numerals are turned into shapes, so the file looks the same anywhere; tick *Keep numerals as text* if you want to edit them later in the SVG.

**PNG.** A picture made of pixels. Set the resolution in dots per inch; the tool starts at 600 and shows the size in pixels before you save.

**Watch.** Kept as text, the numerals need the same fonts on the computer that opens the file.

---

## 18 · Making it real

**Lead:** A file for the screen and a file for making are not the same.

**What making needs.** Most ways of putting a design on metal print one colour at a time: one layer of ink, toner or resist. So a dial for making is usually one colour, solid black, nothing else. Colours, shades and see-through rings mean nothing to a laser or an etching bath.

**The print mask.** Tick *Mono print mask* in the Print group and the export changes: every ring in solid black, no plate colour, no hands, and each window drawn as an outline, the shape to cut or leave bare.

**Mirrored.** Some methods transfer the design face down, so it must be printed back to front. *Mirrored, for toner transfer* flips it.

**Hands are separate.** Real hands are cut from their own sheet of metal. Export them on their own when you are ready to make them.

---

## 19 · Before you make it

**Lead:** A few checks that save a sheet of brass.

**Print it at size first.** Print the PDF on paper at 100 %, no scaling, and measure the diameter with a ruler. If it isn't right on paper, it won't be right on metal.

**Look at the thinnest line.** Every method has a smallest line it can hold and a smallest gap it can keep open. Hairlines that look fine on screen can vanish when etched, and small gaps can fill in. Find the limits of your method with a test plate before the real one, and set your thinnest ticks above them.

**Small type.** Numerals under about a millimetre tall lose their shape in most methods. Test them at their real size.

**Leave the windows clear.** Make sure the clearance around each window is wide enough for the hole to be cut without touching the print.

[Production methods (toner transfer and etching, pad printing, screen printing, laser) and their real limits get their own text after Okay's first tests. Until then this page gives no figures. Build list #93.]

---

## 20 · Links, files and the Gallery

**Lead:** Keep a dial, share it, start from someone else's.

**Link to this dial.** The Export tab shows the dial's link and a button to copy it. Paste it anywhere: a message, a note, a bookmark. Opening it opens the dial exactly as it was.

**Settings file.** If you prefer files, *Save* writes the dial to a small file on your computer and *Load* opens one. *Defaults* starts again from a new dial.

**Gallery.** At the bottom of Export, a set of dials and parts of dials to open and take apart: tracks, scales, numbers and whole classic dials. Open one and look at how its rings are made. It is often faster to change something close than to start empty.

**Log.** If something looks wrong, the log at the bottom of Export says what the tool did. Send it along with a screenshot when you report a problem.

---

# D · Classics

## 21 · Nine classics

**Lead:** Nine dials after well-known types, each drawn with this tool. Each page shows how it is built and opens in the tool with its link.

[The nine dials small, in a grid, each with its name and page number.]

**How to read the next pages.** Each dial is shown at a large size with its rings named. Beside it, the rings from top to bottom, with only the settings that differ from a new ring. The link at the bottom opens the dial, so you can change it and make it your own.

**After, not copies.** These dials are drawn by eye after a type of watch, not measured from any one watch.

---

## 22 · Field watch

**Lead:** After the army watches of the 1940s and their descendants: 12 and 24 hours, a plain minute track, nothing else.

**What to look at.** The 24-hour numbers are a second numerals ring on a smaller circle, counting from 13. The minute track gives way to the hour markers so each hour stands alone.

## 23 · Diver

**Lead:** A diver with its timing bezel drawn on the dial: a navy plate, a dark bezel ring with its first fifteen minutes marked finely, and pale luminous markers.

**What to look at.** The bezel is a band with ticks and numbers on top of it, 10 to 50, counted by the ring itself. The first quarter has a tick for every minute, the rest only every five. The hands are an arrow, a pencil and a lollipop.

## 24 · Dress watch

**Lead:** After the plain dress watches of the 1950s: thin batons, a double bar at 12, dauphine hands, a framed date.

**What to look at.** The double bar is the markers ring's own style for its first position. The words along the bottom follow the curve of the dial.

## 25 · B-Uhr, type B

**Lead:** After the observer's watch of the 1940s: minutes in large numbers on the outside, hours small on an inner ring, a triangle with two dots at 12.

**What to look at.** The large numbers count 5 to 55 by themselves; the hours sit inside a thin circle. The two dots at 12 are one markers ring of two, spread over a small arc either side of the triangle.

## 26 · California

**Lead:** After the 1930s and 40s: Roman numbers above, Arabic below, bars at 3, 6 and 9, a railroad track.

**What to look at.** Two numerals rings share one circle, each leaving empty the places the other fills.

## 27 · Station clock

**Lead:** After the Swiss railway clock: heavy bars, a red seconds hand ending in a disc.

**What to look at.** Everything is in proportion to the dial, so it can be any size. The seconds hand is a lollipop.

## 28 · Red minimal

**Lead:** A red plate, light numerals in a thin, narrow face, dark markers and a fine white minute track.

**What to look at.** The numerals use a sliding font set very light and slightly narrow, something only a font with those slides can do. [Okay's link was cut off when copied; ask for it again before this page is finished.]

## 29 · Sector dial

**Lead:** After the scientific dials of the 1930s: a ring of minutes, a crosshair, zones of colour.

**What to look at.** The zones are bands split into segments, each with its own colour. The crosshair is a ring of four long ticks.

## 30 · Gauge

**Lead:** Not a watch: a 270° scale with a red zone, marks at both ends.

**What to look at.** The scale is a ring with a span smaller than a full turn, so its first and last marks sit at the ends of the arc. The red zone is a band on a short span of its own.

[Each classic page: the dial large with its rings named; the settings that differ from a new ring, top to bottom; the link. Pages 22–30 printed from the dials' own settings so they cannot drift.]

---

# E · Reference

## 31 · Every setting

**Lead:** Every setting in the tool, printed from the tool itself, with where its slider stops and what a new dial starts with.

**Reading the table.** *From · to* is the slider's range; a typed number can go past it. *Step* is how much one press of minus or plus changes it. *New* is the value a new ring or dial starts with.

[Two tables, generated: rings; then dial, hands, windows and export. Here the tool's own words are used without explanation; the pages before explain them.]

---

## 32 · Find it, and the words

**Lead:** You know what you want on the dial. This says what the tool calls it, and where this book shows it.

[The index: one line each, "what you want → what the tool calls it → page". Examples: a minute track → a ticks ring, count 60 → 07. A railroad track → two thin bands with ticks between → 10. A 24-hour ring → numerals, numbers from 13 → 11. Numbers that don't turn → placement upright → 11. A gap around a number → knock out → 09. A date at 6 → Windows, the card at 6 → 15. Lume holes in a hand → hollow → 14. A file for etching → mono print mask, mirrored → 18.]

**Watch words.** [The trade words from `docs/glossary.md`, Watch terms, each in a line: applied, beat, cap, chapter ring, counterweight, dial, index, ligne, marker, movement, railroad, sector dial, tail, track; with the Turkish where the glossary has it. This is the one place the book uses them freely.]

**Type words.** [Variable axis, OpenType feature, tracking, outlines, named instance; one line each.]
