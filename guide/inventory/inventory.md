# Guide inventory — step 1 of `guide/PLAN.md`

*15 Oct 2026, beta 4.41.12. What the app lets a person do, what it does that the guide must state (each to get a scripted check in step 4), the words, and the app faults found. Sources: the coverage walk (`labels.md`), the three blind reviewers' tests of 15 Oct (newcomer, information designer, maker), and the app's own panel definitions. Every "→" claim below is a candidate: it is written into the guide only once its check passes.*

## Coverage walk, run once
- `guide/tools/walk.mjs`: 153 states (5 tabs; 4 ring kinds × shapes, 12 o'clock styles, label sets, sectors; 3 hands × 11 shapes; 4 windows × 4 shows × 5 shapes; live text; Guides, Shadows, bio, colour pop-out, add menu, font sheet; a phone) → **366 names in 14 s**, values filtered out.
- Errors it caught, in itself: the first run put window 1 at 4:30 (an index read as a position) and missed the colour pop-out (wrong selector); both fixed. In the app: ring summaries say "12 band", "1 numerals" (#185, still open).
- Trustworthy in well under a day → it stays in edition 1 as a report (PLAN §5).

## Tasks, and where the guide puts them
E1 = edition 1 (web core), E2 = edition 2. Page names are the guide's.

| # | Task | Where in the app | Guide |
|---|---|---|---|
| T1 | Open the tool; what opens (Okay's watch first; your last dial after) | — | E1 the screen |
| T2 | Start from the starting dial; undo it | Export › Settings file › Defaults · ⌘Z | E1 first dial, find it |
| T3 | Open a dial from the Gallery | Gallery pill · Export › Gallery | E1 the screen · E2 recipes |
| T4 | Keep and share: autosave in this browser and the address; copy the link; save and load a settings file | Export › Link · Settings file | E1 four models (4), find it · E2 present and share |
| T5 | Undo, redo | corner buttons · ⌘Z / ⇧⌘Z | E1 the screen |
| T6 | Size the dial; scale everything with it | Dial › Diameter | E1 first dial · E2 build 1 |
| T7 | Centre hole | Dial › Centre hole | E2 build 1 |
| T8 | Colours: the plate, every part in one list, opacity | Dial › Plate · Colours · colour pop-out | E1 find it · E2 build |
| T9 | Page margin and backdrop | Dial › Page | E1 four models (4), maker sheet |
| T10 | Units (mm · pt · in · lignes); arithmetic in fields | mm box · any number field | E2 shortcuts |
| T11 | Add, order, duplicate, delete, rename, show or hide rings | Rings › list tools · row grip · eye | E1 first dial · E2 build 2 |
| T12 | Select a ring: its row, or tap its mark on the preview | Rings list · preview | E1 four models (3) |
| T13 | Change a ring's kind (it keeps its settings) | ring drawer kind tiles | E2 build 2 |
| T14 | The ring drawer: kind, colour, size, radius (press to type, drag to change) | Rings › selected row | E1 the screen · E2 build 2 |
| T15 | Marks: bar, wedge, dot; length, width, taper, hollow, round ends | Rings › Shape | E1 first dial · E2 build 3 |
| T16 | Positions: count, start, span, every, offset, skip those instead | Rings › Positions | E1 first dial · E2 build 3 |
| T17 | Give way: skip where, knock out, clearance | Rings › Give way to rings above | E1 four models (2) · E2 build 6 |
| T18 | 12 o'clock: same, double, triangle, none; scale, gap | Rings › 12 o'clock | E2 build 3 |
| T19 | Numerals: label sets, Custom, Numbers (first, step, digits, start again), placement, what the radius measures to | Rings › Numerals · radius button | E1 first dial · E2 build 4 |
| T20 | Nudge one numeral | Rings › Nudge one numeral | E2 build 4 |
| T21 | Type: the font sheet (bundled, Google link, file, installed), style, size, tracking, axes, features, Lang. | Rings › Type · Change… | E1 first dial (bundled font) · E2 build 4 |
| T22 | Bands: width, fill %, sectors, sector colours, pies | Rings › Band · Sector colours | E2 build 5 |
| T23 | Hands: show, motion (sweep, quartz, 6 and 8 beats) | Hands › All hands | E2 build 7 |
| T24 | Each hand: 11 shapes and their settings, colour and opacity; the disc hand; SVG tile (placeholder) | Hands › Hour · Minute · Seconds | E1 first dial · E2 build 7 |
| T25 | Cap | Hands › Cap | E2 build 7 |
| T26 | A window: show it; position (quarters, between, any time); radius, size | Windows › cards · Position | E1 first dial · E2 build 8 |
| T27 | What it shows: date, day, am · pm, moon; text, font, moon age | Windows › Shows | E2 build 8 |
| T28 | Its shape: rectangle, circle, polygon, arch, arc; sides, corner, turn, text turn | Windows › Shape | E2 build 8 |
| T29 | Its colours, frame and clearance | Windows › Colours · Frame · Clearance | E1 find it · E2 build 8 |
| T30 | Time: field, day slider and its steps, Now, AM · PM; keys ← → ⇧ Space | bottom bar | E1 the screen · E2 present |
| T31 | Play and speed 1×–720× | bottom bar | E2 present |
| T32 | Zoom and pan: pinch, ⌘ + scroll, − +, FIT | preview · bottom bar | E1 the screen |
| T33 | Guides: centre lines, window radii, per ring, added line · crosshair · circle, colours, thickness | Guides switch and list | E2 build 1 |
| T34 | Shadows: on, light, darkness, soft edge, heights | Shadows switch and list | E2 present |
| T35 | Backdrop switch | preview corner | E1 the screen |
| T36 | The dial alone | eye switch | E2 present |
| T37 | The showcase: activate, Now, 10:10, hands key, drag the light, leave | iris switch | E1 find it (leave) · E2 present |
| T38 | Export PDF, SVG (keep numerals as text), PNG at a dpi | Export › Export a file | E1 first dial, maker sheet |
| T39 | Print mask, mirrored; the preview shows the mask | Export › Print | E1 maker sheet |
| T40 | Read the Log | Export › Log | E1 maker sheet |
| T41 | The bio | the mark | — (not taught) |
| T42 | On a phone: the drawer and its gripper; switches folded to signs, words on a tap | phone layout | E1 the screen (phone page) |

## Behaviours the guide states (each gets a scripted check, step 4)
- B1 Every change is kept in this browser and in the address, about half a second after it stops; a reload or a later visit shows it again.
- B2 A link opens the dial and the time shown, not the tab, the selected ring or the unit.
- B3 Defaults replaces the dial with the starting dial; ⌘Z brings back the one before.
- B4 The starting dial asks for Helvetica Neue; where it isn't loaded the Type pane says "not loaded" and Inter stands in.
- B5 Tapping a mark on the preview selects its ring and opens Rings.
- B6 A ring changed to another kind and back is as it was.
- B7 Skip where drops a ring's positions where the chosen rings above have a mark; knock out cuts round them by the clearance.
- B8 A shown window drops the numeral and the marker at its angle, at any radius; a minute tick there, skipped before, shows again.
- B9 A window's clearance keeps rings clear round it.
- B10 An export's page is the diameter plus twice the margin; its file name gives the diameter.
- B11 A colour export holds the hands at the time shown and the window's content; guides, backdrop and shadows are never exported.
- B12 The mask is black on white, without plate, hands or window content; window and centre hole are 0.05 mm cut lines; marks on a band vanish unless the band knocks them out.
- B13 Mirrored flips the export left to right.
- B14 Knock-out cuts only round rings that are shown.
- B15 A number field takes 1.2 · +0.5 · x0.5 · /2.
- B16 The unit changes what is shown and typed, not what is kept.
- B17 Scale everything multiplies every measure but the margin.
- B18 A PNG opens at true size (its dpi is written in it).
- B19 "Keep numerals as text" writes numerals as text in the SVG only.
- B20 The showcase's X leaves it as it was before.

## Words
- **The app's words, used as they are:** ring, kind (ticks · markers · numerals · band), ring list ("Rings, top first"), Positions (Count, Start °, Span °, Every, Offset, Skip those instead), Give way to rings above (Skip where, Knock out, Clearance), Shape, Placement, Nudge one numeral, Type, Sector colours, Show this hand, Motion, Cap, Show this window, Shows, Frame, Export a file, Print, Mono print mask, Mirrored, Link to this dial, Settings file, Defaults, Log, Gallery, Guides, Shadows, Backdrop, The dial alone, The showcase. Full list: `labels.md`.
- **Collisions in the app** (filed, #231; the guide notes them in the margin until fixed): Backdrop (a colour and a switch) · Frame (a colour and a width) · Size, Size %, Size × (three meanings) · Ring Ø and Ring at % on hands (not rings) · the opener's ring named Band whose kind is numerals.
- **The guide's own words** (marked as the guide's, never presented as the app's): the screen · four models · first dial · find it · maker sheet · recipe · the drawer and gripper (the glossary's, not on screen) · film · resist.

## App faults found (filed in `docs/build-list.md`, #218–#233)
Each found by a blind reviewer on 15 Oct and seen again in this inventory. None is written around in the guide; the guide states the behaviour, dated.
- #218 "Add image…" says "Not built yet" (R17).
- #219 No way to export without the hands and window content.
- #220 Marks lying on a band vanish in the mask unless the band knocks them out; no warning.
- #221 Knock-out ignores hidden rings, so hide-and-export films lose their holes.
- #222 Cut lines (window, centre hole) are hairlines in the resist's black; the PNG mask bakes them in.
- #223 No mask invert (for sunk marks).
- #224 No blank outline or registration marks.
- #225 No thinnest-line report; numerals' strokes have no width setting to read.
- #226 Exported files carry no app version.
- #227 The file name gives the dial's size; the page is larger by twice the margin.
- #228 Defaults asks for Helvetica Neue, which isn't bundled ("not loaded").
- #229 No blank start ("New").
- #230 No way into the guide from the app (help link; per-pane anchors).
- #231 Word collisions (above).
- #232 Phone, drawer dragged up: Undo · Redo overlap the Backdrop switch.
- #233 Diameter takes 0 and 1000 when typed.
- (#185, already open: ring summaries "12 band", "1 numerals".)
