# Dial Tool — changelog

## beta 4.55 (web version) · 18 Oct 2026

The selected ring after Okay's Photoshop drawing (`selected-ring_181026`; notes 2, #335, #327).

- **The selected row** carries the ring's **size and radius** at its right, in Dial Mono, each over its button in the drawer ("Large mono numbers for size and radius, slashless 0 if possible"). Dial Mono, cut from JetBrains Mono for the unit box, now has the figures; its 0 has no dot (`web/fonts/ui/mono_font.py`).
- **The kind** is changed from the selected row's kind icon: a press opens the kinds. The drawer's kind square is gone.
- **The drawer** writes the ring out on two lines, grey names and dark values: what it draws (*Arabic: 12, 3, 6, 9*, *Text: AUTOMATIC*, *Shape: Bar · Length: 2.4 · Width: 0.7*, *Width · Fill* for a band), then where (*Positions: 12*, and a start, a span, a give-way or nudged numerals when there are some). **Change** is gone ("meaningless").
- The colour is a **bare swatch**; size and radius are pressed (the controller) or dragged, with **no tag**: their numbers are right above. The rename box at half its grey.
- **Fixed**: in 4.54, selecting a ring whose font is not in the catalog (a markers ring of the default watch) stopped the panel — the Type pane's summary had an empty part.

## beta 4.54 (web version) · 18 Oct 2026

The font box after Okay's Photoshop drawing (`font-selector_171026`, light and dark; notes 2).

- **A grey head** (#334, #321): on the panel's grey, the preview on white 4 in from the box's edge, then the name's line — the family's name grey and bold, running up to the text's colour, and **EN** at the line's right end (it was inside the preview's cell). **No Change…**: the preview and the name open the font sheet, as they did.
- **The chosen style** mid grey with white words (was ink).
- **Number blocks** for Size and Tracking: the value and its − + joined, one thick line of the rule's grey round them ("new number entering blocks", to come elsewhere: #317).
- **The Type pane** (#318, #319): open, its heading is just the eye, the box beside it from the pane's top; folded, its line says the family, style and size.
- **Dark** (#320) darkens a font box's preview only; the rest of the box keeps its look.

## beta 4.53 (web version) · 18 Oct 2026

Mechanisms after Okay's answers (18 Oct, 19:02). Goes live with 4.52.1 and 4.52.2.

- **Numerals tangent to the ring** (#338: "Tangent to inner or outer"): the radius' menu gains **Outer edge** and **Inner edge**: every numeral's ink touches the radius, from inside or from outside — an upright numeral by the corner of its box that faces the edge, one turned with the ring by its top or foot. Like Illustrator's paragraph alignment for a ring of figures.
- **A change of what the radius measures to moves nothing on the dial** (#326: "Nothing changed … just the dotted line moves"; "applies to reverse auto reverse"): the radius changes with it, so only the dotted line goes. Marks and bands keep their outer edge (outer · middle · inner); numerals keep the first label's middle — exact for radial and auto-flip, where every anchor lies on one line. Undo takes both back.
- **One mark nudged** (#349, groundwork): ticks and markers read the ring's per-position Nudge as numerals do — radius ±, angle ±, size ×, turn. Nothing in the window sets it yet: picking and editing one mark comes with its design.

## beta 4.52.2 (web version) · 18 Oct 2026

Okay's answers of 18 Oct, 19:02 ("Rest is good, common sense wins go"). Goes live with 4.52.1.

- **The day's needle** (#343: "Ruler pin does not move on bottom bar"; notes 2: "The moving needle is 1px wide and red, starts from the bottom of the screen"): the slider's own thumb kept its place whenever the slider had the focus — after a tap on it, on an iPad — so the time moved and the pin didn't. Now a red needle, 1 wide, from the ruler's top to the bar's foot, placed from the time itself; the slider's thumb is not drawn. Presses and drags on the day's strip are read by the tool and set the time (a press that doesn't move still goes to the nearest step), so scrubbing works the same in every browser; the slider stays for the keyboard and a screen reader.
- **Showcase left of the eye** (#341): the iris switch stands left of the eye switch, a unit apart (over it since 4.42.4).
- **Same font as Hours** (#359): a window's way back to the numerals' font was called *Copy style of*; it never copied.
- **A disc hand's window inside its disc** (#344): *Inside the disc*, a tick in the disc hand's rows; its window then ends at the disc's edge however long the hand is. A new key (`mark_in`), off in older links so they draw as before, on for a hand made a disc in the tool.

## beta 4.52.1 (web version) · 18 Oct 2026

Okay's eye on 4.51.1's items drawn from his words (18 Oct, 18:55).

- **The kind pictures** (#255, "Do my notes"): the numerals' 12 in proportional figures, 0.75 tighter; the text ring's ABC · XYZ a weight heavier (800), tracked 0.5, the two lines 7.5 apart (were 9).
- **Give way** (#258: "thicker indices, better indication of the actual state on watch. And left knockout not a button, these are regular rows, changing to fit this view"): this ring's ticks 3 thick, in ink; the marks of the rings above drawn as faint outlines lying on the ticks where they really would, so the ticks run through them (nothing), are gone under them (Skip where) or stop the clearance short of them (Knock out). *Skip where* and *Knock out* are rows now — a row's grey, the rows' white lines, no frames — the chosen one in ink, lit white and joined to the square as before.
- **Placement's pictures** (#259: "Thinner lines overall, thinner but big headed arrows, try again"): the circle and the arrows' stems 1.25 (were 1.5), each head a filled triangle, 2.75 long and 3.5 across.

## beta 4.52 (web version) · 18 Oct 2026

From Okay's notes 2 (18 Oct 2026; build list #316–#359, all of them ranked there), the small ones (Okay: "in the meantime start working on small things").

- **The controller, second drawing** (#330; `controller 2.svg`: "The new controller is in. No name necessary, preview shows what's changing anyway"): one dark square (the grey, 251 × 248, corners 49.5) holding three things 66 high — the value in bold 41 on a grey pill, the slider in a white pill (its line 10, the knob 44 with a white eye), and − and + as two dark discs with square-ended white signs, one at each side, 86 apart; 16.5 round them, 8.25 between. No name: a row's menu (the numerals' anchor) stays on the row. R15 rewritten.
- **The default watch is Okay's link** (#331: "This becomes the default watch"): Barlow SemiBold numerals at 4.8, four ticks, grey hour and minute hands, a red seconds hand, a Barlow Bold date at 3, a red backdrop. It is what the tool opens with, what Reset and Defaults bring back, and the Gallery's first card. The guide's First dial steps no longer end on it (said at the guide's next rebuild, R25).
- **Copy link on an iPad and in Safari** (#332): WebKit lets a page write to the clipboard only while the click is fresh; the link was packed first, so the copy was refused, silently. Now the clipboard is asked at once and handed the link when it is ready (a ClipboardItem holding a promise); writeText after the wait stays as the fallback. The button says **Copied** or **Not copied** for 1.6 s (R17); not copied, the link box is selected. Tested in Chromium only: WebKit can't be installed here.
- **A blank face** (#333: "White dial color, no rings, etc."): a **Blank face** button in Dial › Reset gives a white plate and the hands, one ring hidden (the list is never empty), no windows. Undo brings the dial back.
- **Complication** (#328): the Windows page's *Shows* row is named *Complication* (glossary).
- **The Show box's tick** (#323: "just as big as shows ascender … the outer gray box does not change size; padding … equal top, left, bottom"): 9 high at 12 px words, with 8.5 left, over and under it.
- **The Custom labels note under its field** (#324): a note about a field starts on the field's column (`info(…, { under: true })`; the rule was there, nothing could ask for it).
- **No second line under the pinned part** (#325): the first pane *shown* under it has no line of its own (until now the first in the list, which in a numerals ring is the hidden Text pane).
- **The zoom area** (#342): the magnifier first, then − + FIT side by side, sharing their lines; how to zoom and move is the magnifier's tag ("⌘ + scroll zooms · drag moves · pinch on a trackpad"; on a touch screen "Pinch to zoom · two fingers move", shown a moment on a tap); the words at the left are gone. On a touch screen **one finger no longer moves the dial**: two do, with the pinch. A tag with no room under it (the bar) stands over its button, its arrow down.
- **G turns the guides on and off** (#353), as the Guides switch does; not while typing, nor with ⌘ · Ctrl · ⌥ or ⇧.
- **The Gallery's chosen card** (#355: "these options should not push all the rows, just that cell grows. No outlines, just full colours, bigger cell padding and walls"): filled with the chosen tint, no line round it; its two choices grow down over the row under it; walls 8.25 (were 5.5), room inside 11 · 11 · 8.25 (were 8.25 · 8.25 · 5.5).
- **Tags** (#356: "more inner padding and centeredness and 1px borders"): 5.5 over and under, 11 at the sides (were 2.75 and 8.25), the words centred, a hairline round them (was 2 px).
- **vibecoded** (#340), in the bio.
- **The showcase's arrow and ✕** (#350, #352): the side-to-side arrow's stem in three, straight · dashed · straight; the ✕ on the iris is cut by the eye switch's absent eye, so its lines stop where the eye's rays stop and leave the iris alone.
- **The Guides list's bottom section** (#322: "the functions are below, grouped under a lighter bg color area. The grey area grows to include add line … Smaller color dots, closer, much compacter width. Fainter unselected swatches … a 1px dark gray border when selected"): Add and the guides added under it stand on the section's ground with Thickness · Reset All, 5.5 more room over Add; the colours 8 across (were 10), 7 apart (were 9), so the list is 275 wide (was 311); a colour not chosen at 40 % (was 60 %); in a dark popup the chosen one of All · Selected · None keeps a 1 px dark-grey line.
- **The disc hand's tile** (#344): its marker a cut-out inside the disc, as a disc hand's window is (it ran outside the disc).
- **The icons as SVG files** (#336): `web/icons/archive.mjs` writes every icon the icon check finds into `web/icons/svg/`, one file per drawing.
- **A controller left open no longer outlives its dial** (found on the way): picking a Gallery dial, Reset or a link while a controller was open left it standing over the new panel, catching presses. The tool closes it when it opens a new dial.

## beta 4.51.1 (web version) · 17 Oct 2026

- **The magnifier out of FIT** (#315; Okay, 17 Oct: "icon moves out of the fit box, sits in between plusminus and fit; the horizontal padding like now and am"): at the bar's right the zoom area is now − + · the magnifier alone, in the bar's light tone · **FIT**, a word button as wide as its word and NOW's padding either side (a column wide, with the magnifier inside, since 15 Oct). The phone's own rule for FIT's width went with it: the one rule serves both.

## beta 4.51 (web version) · 17 Oct 2026

Phase H, the fonts, from Okay's notes (p. 12–13) alone (17 Oct: "draw me all the sketches … proceed with plan").

- **EN** (#273): the language button says **EN** while the font sets the language itself (nothing is stored; "Lang." until 4.50.2), and stands at the right **inside the preview's cell**, on the cell's grey, so it knocks the preview out where it reaches. The name line keeps the name, the colour and Change…. Okay's "end gray lines with the text as shown here" stays unread (#273's open part).
- **The box's sliders, wide** (#274; "break the rules"): in the font box the rows (Size, Tracking, an axis) give their name a column of twelve characters, cut past that, and the slider all the rest; the number and the stepper stay where every row has them. A special, `--font-label` (R32).
- **The styles as tabs** (#275; Okay, 16 Oct: "it is a part of the font so it needs to look like tabs of the upper box which is the font name"): Regular · Medium · Bold… are tabs **hanging from the line under the font's name**, the hand tabs turned over (their notches at the foot, no line of their own at the top, one line between neighbours; `.tab.hang`); the chosen one ink with paper words; more than fit slide sideways. A variable font with a weight axis and no named styles gets **Regular · Bold** here, which set the axis (what a font may offer here is limited to bold and italic; the other axes stay down with the sliders).
- **Light · Dark** (#276): a pill at the top middle of the font sheet, between Fonts and Find, shows the previews on white or on a dark grey; kept for the session (sessionStorage), not in the dial. The font boxes follow it: the inverse of their white, never pitch black (Okay, 16 Oct: "inverse of existing block can't be black") — a dark grey ground (`--font-night`), near-white words, lighter lines; inside, the usual names turn over, so what is chosen is light with dark words (R32's chosen layer holds).

## beta 4.50.2 (web version) · 17 Oct 2026

- **Give way, pictured** (#258; Okay's notes, p. 4: "what's happening should be visible here"): *Skip where* and *Knock out* are **side tabs** at the left, cells drawn with the rows' white lines; the open one lights up white and reaches onto a **white-bordered square** beside it. In the square: a drawing in the icons' line, twice an icon's size — a row of this ring's ticks and, over them, faint, three marks of rings above (a marker, a numeral, a tick); the choice is read off it: Skip where takes the tick under each named mark away, Knock out cuts it back by the clearance (20 px a mm in the drawing, never less than a line). At the foot the four choices as **radio buttons** (new: a round sister to the tick box, ink ring and disc), and under them **Clearance** as a quiet row (R15 B), only on the Knock out tab and only when something is knocked out (R16). Which tab is open is the session's, not the dial's (R31 free). On a phone the two tabs stand over the square. The folded pane says the two choices and the clearance.
- **Placement's tiles redrawn** (#259, closing #142; Okay's notes, p. 6: "each shows what it does on a ring, as auto-flip's does; no clash with the dial's ring; cleaner arrows with stems, six arrows each"): each tile is a micro dial — the ring as a faint circle and on it six arrows with stems, each the way up of a numeral standing there. Upright: all up. Radial: pointing out. Auto-flip: out above, in below. On path: along the ring (Claude's reading: the word runs round the ring). The A's at 3 and 6 o'clock of 4.36 are gone. Every arrow point sits on the quarter points, so an upright stem covers whole dots (R33).

## beta 4.50.1 (web version) · 17 Oct 2026

- **Positions, with a preview** (#251; Okay's notes, p. 5: "none of these need slider — text boxes and ±; a ring-specific preview at the left, like the hands' detail box: round, not in a square box, with even padding, it may use the eye's column"): at the pane's left a round drawing of the ring's positions — a faint circle, a mark at every position, the used ones in ink, the ones Every · Offset · Skip leave out faint, the first position a dot, so Start is seen (the answer chosen on 16 Oct). It stands where the hand's box stands (the eye's column and the next), as high as the rows beside it, the circle as large as that allows with a unit round it, no frame. Beside it Count · Start ° · Span ° · Every · Offset as **quiet rows** (R15 form B, declared as such now: `quiet`): the name and the number with its compact ±, no slider on the row; the name or the number opens the controller, whose slider does the sweeping. *Skip those instead* beside the box too.

## beta 4.50 (web version) · 17 Oct 2026

Phase G's rest begins, from Okay's notes alone (17 Oct: "now draw me all the sketches … proceed with plan"): the ring drawer and the rows.

- **The ring drawer** (#253; Okay's notes, p. 2–3): the five kind buttons are gone. At the left a **square lit with the ring's kind** (ink, its picture in paper, 36 like the other buttons); beside it the **details** in words — "12 numerals · size 2.4 · radius 10", in the unit box's unit — left-aligned and cut with an ellipsis when the line is short; then **Change**, underlined, never cut, which takes you to the ring's settings (the first pane under the pinned part); then colour · size · radius as before (the answer chosen on 16 Oct). A press on the square opens the five kinds under it, over everything (the list scrolls and would cut it), the ring's kind marked, ending with the note "Settings stay with the ring. Switch back any time." (Okay, 16 Oct: "ok, recommended"; his warning line was not true, R7).
- **The rows** (#254; "no text details, only the kind icon … no adjustments, just an indicator"): a row is eye · grip · the kind as an icon · the name (and the selected ring's rename box). The summary of 4.7–4.49.2 (how many, colour, size, radius) and the colour chip are gone from the rows; the drawer says them. The name stays (the answer chosen). The list's columns: eye · grip · kind (the icon, the drawer's square) · name (the details) · Change · colour · size · radius.
- **The kind pictures** (#255; "a smaller optical size; abort silkscreen there"): the five drawings a size smaller in their 24 box (radius 9.75, was 11), the numerals' 12 · 3 · 6 · 9 and the text ring's ABC · XYZ in the tool's sans, bold (`.figure`), not the pixel font, which now stays for the stickers and the tiny numbers elsewhere.

## beta 4.49.2 (web version) · 17 Oct 2026

- **The number popup is the controller** (#314; Okay's drawing of 17 Oct 2026, "to replace with our current one"): a light head — the name (with its bare chevron where the row has a menu) on a line of 28 over a hairline, inset 22, and the value in bold 25 standing over the slider's knob and moving with it — and under it a dark square (#3F3F3E) holding the slider in a white pill and − and + as two grey discs with white signs (8 thick, 40 long), all three 66 high, a unit and a half round and between them, no frame. 157 × 223 (166 × 219 before). The track is a unit and a half thick, dark to the knob and light after; the knob 44 with a white eye of 12.
  - **Where it stands:** at the finger — the knob under the point that pressed, kept inside the window ("appears covering everything, finger on the middle slider section upon tap, place as needed, on top of everything"). From the keyboard, or with no slider (a window's places), under its button as before. The phone's sheet is gone: the same everywhere.
  - **It comes at once and fades after use** ("comes lightning fast, fade away quickish after use"): no way in; 1.2 s after its last use (a slide, a press on a disc) it fades out in 120 ms (`--num-pop-linger`, `--num-pop-fade`, `POP_LINGER_MS`). A press held, or typing, holds it; Escape, Enter or a press elsewhere put it away at once; none of it where the system asks for less motion.
- **The play flash** (#308, again; Okay: "like a flash: zero to bright in milliseconds, then slow descent. but all very quickly"): the triangle goes from nothing to full within the first 3 % of the flash (12 ms at 1×; a fifth before), then descends, eased; the whole flash is 0.4 of a beat (half before), in real time below 1× as before.

## beta 4.49.1 (web version) · 17 Oct 2026

- **Six more dials in the Gallery** (#287; Okay's notes, p. 18: "a few with windows — am · pm, or an arced date as on a presidential Rolex; a few colourful ones, do not have to be historical, homages welcome"), drawn for Okay to pick from — he keeps what he likes, the rest go: **Day and date** (the day in an arc under 12, the date at 3, batons on champagne) · **Dress, am · pm** (Bodoni on ivory, a dot track, am · pm in a round window at 6) · **Moon phase** (midnight blue, a moon in an arch at 6, thin gold figures) · **California** (half Roman, half Arabic in D-DIN on coral) · **Rally** (a yellow racing dial, a tachymeter ring, a RALLY text ring, a date at 6) · **Teal and coral** (coral Unica One figures on teal, white dots, the date on a coral disc). Two use the text ring (4.48). The zigzag places them with the rest (19 cards, seven lines).

## beta 4.49 (web version) · 17 Oct 2026

Phase J, the Gallery: its order, a card in focus, a tuning pass. (#287, six new dials, still to draw.)

- **The Gallery's order** (#286; Okay's notes, p. 17–18: "the new default watch first; Okay's watch last; just whites zigzag diagonally"): the First dial first, Okay's watch last, and the white dials on the diagonals of the three-column grid — the third slot, the middle of the next line, the first of the line after, and back (`gallery_order`); the rest keep their order between. Each card says whether its plate is light (`light`, from the plate's luminance, written by `gallery.mjs` and `examples.mjs`). Bauhaus-third (15 Oct) goes with it.
- **A card walks into focus** (#289: "choosing a dial no longer takes it over; it comes forward with two choices, take over editing or open in a new window"): a press lifts the card (the chosen tint, the thick ink line) and shows **Edit this dial** · **In a new tab** (short, so it fits a card); Escape or a press elsewhere puts it back. The card is still a link, so a middle click or ⌘-click opens it as before.
- **Okay's watch, tweaked** (Okay, 17 Oct 2026, his link: "Tweaked my dial in the meantime, replace"): the Gallery's last card is his new version — a window, a ring of numerals he calls Band — in `src/opener.js` (`OKAYS_WATCH`), lean as his link carries it.
- **Tuned** (#288: "small numerals get a heavier weight and gradually more tracking … the field watch we have for example it fails; B-Uhr in neutral colours"): the Field's 24-hour figures in Barlow Bold, tracked +40 (SemiBold, untracked); Montgomery's every-minute figures in Barlow SemiBold, tracked +40 (Medium); the B-Uhr — Okay's layout — on a black plate with white marks and cream figures, hands and cap, no coloured backdrop (navy, red, cyan and orange before). The optical-size axis: none of the Gallery's fonts has one but Bodoni Moda, unused there.

## beta 4.48 (web version) · 17 Oct 2026

Phase I: the text ring. (Phase H, the font sheet's design, waits: Okay, 17 Oct, "push the design ui stuff for later".)

- **A text ring** (#297; Faruk Koç's finding of 16 Oct, Okay: "makes perfect sense … Snap to indice is a great idea for this"): a fifth kind, `text` (appended, R9): a line of words — a brand, *AUTOMATIC*, *SWISS MADE* — said at every one of its positions, with a font of its own. It is the numerals' pipeline with one label: HarfBuzz, the anchor (centre · baseline · ascender), the four placements (level, radial, auto-flip, along the circle), Nudge, live text in exports, the guides' edges, a click on the dial, Give way (it counts with the numerals: "markers & numerals above").
  - A new one starts as *AUTOMATIC*, once, under the centre (start 180°, radius a third of the dial's, size 1.2 mm), with the top numerals ring's type.
  - Its panes: **Text** (the words) · Type · Resize · Positions · Give way · Nudge. Its row says "1 text", "3 texts".
  - **Snapping to the indices**: its Start ° holds to the positions of the other rings — the hours' markers, the minute ticks — when it comes within 2° of one (`SNAP_DEG`), typed or slid alike.
  - The kinds' menu and the drawer show five kinds; the picture: words on the dial, in the pixel font, under 12 and over 6 (the drawer's icons are reworked later, #255).
  - `dial.py` does not know the kind (R30): a settings file with a text ring is the web version's alone.

## beta 4.47.2 (web version) · 17 Oct 2026

- **Names a screen reader hears** (#244, from the guide's readers, 15 Oct 2026): a ring's row is an option in a listbox, reached with Tab (the controls' focus ring) and taken with Enter or Space; every slider says its row's name (only the field had it); a colour pill says whose colour it is before its hex ("Colour #141414", "Plate #FCFCFA"); in the showcase the panel and the bar are inert — out of reach for the keyboard and a screen reader. The size and radius popups' fields are already named by their row (4.45.2), and the font box's Size reads once; both are checked now.

## beta 4.47.1 (web version) · 17 Oct 2026

- **Selecting a ring fits the list** (#256; Okay's notes, p. 2: "even if only a few pixels of it show, scrolls so its whole row and drawer are in the view box"): the ring list scrolls so the selected ring's row and the drawer under it are whole in view (the row wins when both can't fit). The finger's anchor (15 Oct) takes the row's new place as its own, so nothing fights.
- **The list's pill** (#256: "when its scrollbar comes on … a resize pill appears in the middle of its bottom black line, like the phone's gripper but black"): with more than five rings a black pill with a paper groove stands in the middle of the pinned part's line, the gripper's measures (`--grip-…`). Dragging it shows more or fewer rows (whole rows, it snaps; one to all); a tap jumps between five and all. Kept by the browser (`dial-tool-ring-rows`), not by the dial. The list's height is `--ring-rows` on the list (five to start).

## beta 4.47 (web version) · 17 Oct 2026

Phase G's first push: the panes' order and *resize from*.

- **Type first in a numerals ring** (#296; Okay: "Move fonts top of adjustments in rings that involves fonts"): the font box is the first pane under the pinned part (it was the last).
- **Resize, the first pane for every ring** (#257; Okay's notes, p. 9: "a proper pane below the quick size and radius buttons … shown first"): how big one thing is — Length for a mark, Ø for a dot, Band width — and the radius, as full rows. Length and Ø leave the Shape pane (which keeps Width for bars and wedges), Band width leaves the Band pane. A numeral's size stays in the font box, among the type's settings (and in the size button's popup); open for Okay whether it should stand here too.
- **Resize from** (#257: "resize from — outer end · middle · inner end"): a new ring key `from` (appended to the link table; starting at the outer end, so every link draws as before, R31). The radius of ticks, markers and bands measures to the mark's or band's outer end, its middle or its inner end: the small menu beside the radius' label, as the numerals' anchor menu (13 Oct); the label reads Outer · Middle · Inner radius, and the ring's row and the radius button's tag say it. A ring's dotted guide is now that radius (a numeral's anchor), not the middle of its extent; a window's is still its middle. `dial.py` ignores the key (R30).

## beta 4.46.7 (web version) · 17 Oct 2026

- **Twenty-one fonts join the list** (#313; the font research of 16 Oct, `docs/font-tiers-2026-10-16.md`, its top tier; Okay, 17 Oct: "incorporate it, push the design ui stuff for later. Add just font list to defaults in these versions nothing else"). The font sheet lists 42 families (21 before). Nothing else changes: the sheet's design (phase H, #273–#276) waits.
  - From Google Fonts (OFL): Anybody · Bebas Neue · Cinzel · Italiana · Marcellus · Public Sans · Sometype Mono · Space Grotesk · Tourney · Unica One.
  - D-DIN (Datto, OFL), in four cuts: Regular · Bold · Condensed · Expanded — from a GitHub copy of Datto's own archive, since Datto's page is not reachable from a session.
  - From Peter Wiegel's zips (OFL): Alte DIN 1451 Mittelschrift · Apollo · Bernardo Moda Contrast · CAT DyFa · CAT Kurier · Erika Type (Regular, Bold) · Immermann · Koch-Fraktur · TGL 0-16 (Regular; DIN 17 as its Slanted style). And GL-Nummernschild (Mittelschrift, Engschrift), Gutenberg Labo's free-software font: its licence lives only in the font's own name table, so that text is kept by hand in `web/fonts/licences/`.
  - `web/fonts.mjs` has three sources more (`wiegel`, a zip opened with `unzip`; `gutenberg`; `datto`), and a space in a file's name becomes a dash. Alte DIN's bolder `_g` file is left out: it carries the same PostScript name as the regular, so the catalogue (keyed by it) could hold only one.
  - The page grows by the new families' outlines (about 300 kB); the fonts themselves are fetched when first chosen, as before, from the live page's `fonts/`.
  - Reserved Font Names on most: files are passed on whole, never subset (research §4).

## beta 4.46.6 (web version) · 17 Oct 2026

Three small ones left over from Okay's marks on 4.46 (handoff §1).

- **The number popup, third look** (#310; Okay: "pill height equals the plus and minus. But that growth does not affect slider, it may move up for good padding. Name is on top, lighter, chevron boxless"):
  - the value's pill is as high as the − and + discs (66, was 44); the slider's pill stays 44. The popup is 219 high (was 197);
  - a popup with a name (a row with a menu, such as *Centre radius*) shows it on top in a lighter grey (`--num-pop-name`, the rule grey #B9B9B4; the pills' mid grey before) with its chevron bare, no box;
  - the name's line is as high as its words (12, was 18), so its ink stands 13 from the frame, as the discs do at the foot ("top padding equals the bottom"); the slider follows it at the usual gap (8.25), 6 higher than in 4.46.5.
- **NOW darker** (#307; Okay: "darker than ams outlines by 20%"): its fill is the bar's light tone (AM's outline, #737373) made 20 % darker, #5C5C5C (`--bar-now`; #B9B9B4 since 4.45.5). Its word turns light (`--bar-now-ink`, the panel's light rule tone #D4D4CF — not white: nothing on the bar is, 15 Oct): the bar's dark on that fill would read 1.7 : 1; now 4.5 : 1. A hover 10 % darker than the outline; a press still the outline's tone.
- **The play pulse at slow speeds** (#308; Okay: "the play animation flash and dim the arrow much faster on slow speeds, flash brighter. Like an analog fade. Eased over the line and comes back kind"):
  - below 1× the triangle's flash lasts as long in real seconds as it does at 1× — half a beat (half a second on a quartz movement) — instead of stretching with the slow motion (five seconds at 0.1×). It still starts on the beat, with the seconds hand's step;
  - its peak there is full (`--play-tri-slow` 1; 0.7 otherwise), set by the button's class `slow`;
  - the flash itself is a lamp's: an eased rise over its first fifth, then an eased fall (`PULSE_RISE`; a jump to full and a fall before). At 1× the rise is a tenth of a second. A sweep's breath runs in real seconds below 1× too.
  - The cap's own fade (the whole beat) is as it was.

## beta 4.46.5 (web version) · 16 Oct 2026

- **A hand's page, the shapes' first black line moves down** (#311; Okay: "Short black line is part of hand selector. Comes after wall and preview box … THERE'S A SPACE. THEN COMES BLACK LINE. BUT THAT SPACE, IS THE SAME WITH ALL WHITES AND BLACK AROUND HERE"). The box and the last row (Wall) end on one line. Then come two units of space (11 px), then the thin black line that opens the shapes' row. In 4.46.4 that line lay on the box's foot. The thumbs keep two units to each black line, so every space here is the same.

## beta 4.46.4 (web version) · 16 Oct 2026

After Okay's marks on 4.46.3.

- **The Show box**: a darker ground (12 % ink, was 7 %), its tick 3 px smaller ("Shows bg darker, tick 3px smaller").
- **The line under it, the same room over and under** ("Vertical gaps before after same"): two units (11 px) from the box to the line, and two from the line to what follows.
  - On a hand's page that is the thin black line, then the rows. The room under it is counted to the first row's own white line.
  - On a window's page it is the pane's thick line ("Thick line stands here"), with the title as far under it as on every heading.
- **Window at x** loses its "Position" line ("Delete position name, that works without"); the circles stand on the title's line.
- **A hand's page**:
  - its shapes are a row of their own after every row (after Wall, and the cap's rows on the seconds hand), from the box's left to the end, all eleven thumbs on one line ("Put hand type as a row spanning preview to end, after wall");
  - the box is as high as the rows beside it, from the first row's line to the last row's foot ("Enlarge the preview to fit the area"). It grows with a shape that has more rows (breguet: three more), and no longer stays in view while the rows scroll, since it is as tall as they are.
  - the thumbs stand between two thin black lines ("a thin black after thin white which mistakenly touches preview box"; "End of hand types, black thin bar to finish instead of white"). The first lies on the line where the box and the last row end, so the white line no longer meets the box. Two units separate the thumbs from each line.

## beta 4.46.3 (web version) · 16 Oct 2026

- **A hand's shapes move under its box** (#311; Okay: "type of hand moves under preview. Fit sensibly, rectangular thumbs would work there"):
  - every shape shows at once as an upright thumb, its picture in a tall tile with no word (pointing at a thumb names it), the dashed SVG tile last;
  - four to a line on a wide screen, in the box's own column, so three lines hold all of them; six to a line on a phone, under the box lying flat;
  - the line of tiles beside the box that opened with "more" is gone. The rows beside the box are now exactly its height (Colour and the numbers).

## beta 4.46.2 (web version) · 16 Oct 2026

After Okay's marks on 4.46.1.

- **The Show box grows down from the chosen tab** (#261; "the top tab attaches traveling show ticker"). It sits under that tab alone, as wide as it, and moves when another tab is chosen. It keeps its darker grey; the rest of the strip is gone. It is less tall, a control high (26, was 31.5), with the room of an open pane under it. The hand tabs now stand in equal columns, as the window cards do, so the box finds their edges exactly.
- **Window at x** (#264):
  - a **4** joins the circles before the dots: 3 · 6 · 9 · 12 · 4 · ··· ("Add 4 to the circles before …");
  - the circles fill their line a unit apart, as large as that allows (37 px at the panel's width, was 36), with a unit over and under them;
  - the heading grows to hold them; its title keeps the gap every heading has over its title ("top gap stays same"), with "Position" tight under it;
  - a time in the dots ("2:15") is set a size smaller so it fits the circle.
- **The hand's page** (Okay: "Blue lines, align, black line, new black line, thin"):
  - under the Show box a thin black line opens the hand's pane, from where the tabs start, with the room of an open pane under it;
  - the hand's box starts where the tabs do, and its top is the first row's line.
  - A fix found on the way: in 4.46 the headless pane carried the class `plain`, which is a button's class, so it took a button's border and padding and stood 6.5 px in from everything else. It is now `headless`.
- **Shape**: its buttons are as high as a place's circle, with a unit over and under them, and the heading grows to hold them, its title in its usual place ("either shrink or enlarge height to fit shape buttons and appropriate vertical padding like all the rows"). As a rule: R32, a heading that carries controls.

## beta 4.46.1 (web version) · 16 Oct 2026

The Windows page, reordered after Okay's marks on three mock-ups (#263–#266).

- **Window at x** holds where the window is and what it shows:
  - **Position** stands on its heading's line (Okay, on the mock-ups: "Move eye up with Window at… put Position after a tight br in its usual size and color, draw the white line below. If it's taller so be it, enlarge buttons. And 3 6 9 12 are circular buttons now"):
    - the heading has two lines, "Window at x" and under it "Position" in a row name's size and grey, with the eye level with the title and the usual white line under it;
    - the buttons are five rounds 36 px across, 3 · 6 · 9 · 12 · ···, spread from the controls' column to the end (#264).
  - The dots open a popup with every place as a button, in the clock's order, and the field for any time. A place pressed is taken and the popup closes. When the window stands elsewhere, the dots say where ("4:30", "2:15") and grow into a pill to hold it.
  - **Shows**, its pictures smaller (30 × 21, was 38 × 27; "smaller icons").
- **Shape** holds the hole itself. On a first visit it is folded, as every pane but the one a tab is about (#270), and its shape buttons stay on its line:
  - its five shapes are buttons without words on the heading's line, stretched across the same columns as Position's (#265; "stretch shapes like position, top-right"), their pictures redrawn at 26 × 18;
  - **Radius** (Okay: "ok but below shapes"), then the sizes. **Width and Height on one line have their sliders again** (Okay: "they can have them"), as R15's new form A2, *two to a line*;
  - Corner, Sides and the turning;
  - the **colours on one line** (#266): Disc and Frame, and Picture for am · pm and moon. The Colours pane is gone;
  - Text, its font, Frame and Clearance.
- **The number popup under a finger** (#310) no longer chooses its value to be typed over, so an iPad's keyboard comes up only when the value is pressed (Okay: "Value gets selected was the wrong choice, triggers the keypad on ipad"). With a mouse it still does.
- **The bar's sliders under a finger** (#309): they no longer drag or pull the page (`touch-action: none`), and the window is never pulled past its edge. The iPad's own edge gestures stay its own (Okay: "simple blocks are fine").

## beta 4.46 (web version) · 16 Oct 2026

Phase F, first push: one tab look and the Show box.

- **One tab look** (#260; Okay, notes p. 1–2: "hands do it better"). A chosen tab squares up, losing its cut corners, and lies over its neighbours. The hand tabs already did this, but only by chance: the chosen layer filled their whole button. The window cards did not. Now it is the tabs' own rule, for both.
- **The Show box** (#261; notes p. 2: "Show this window moves with the tab and says just Show: a thin box, darker than the pane's grey, grows down from the tab and holds it").
  - Under the tabs, on top of the grey page, a thin box a little darker than the page holds one tick: **Show**, for a hand and a window alike. It runs from where the tabs start to the pane's end, with a white line under it.
  - **Hands:** the hand's name line ("Hour hand", its eye, *Show this hand*) is gone, since the tab names the hand. Everything under the box is the tab's content: a pane with no heading, so no thick line either.
  - **Windows:** *Show this window* left the heading line for the box. The *Window at x* pane stays under it until the Windows page is reordered (#263, sketch first).
  - Their ids are now `hand-on-Show` and `window-on-Show`.

## beta 4.45.5 (web version) · 16 Oct 2026

The bar's time, second look (#306; Okay, on 4.45.3, a screenshot marked in three colours).

- **The time** has more room between its figures ("Greens add tracking"): tracking +0.04em, −0.02em before, about 1 px more per figure at 20 px. Its window grows by that. AM · PM keeps its −0.02em (the greens were under the figures; its box width is set for that).
- **AM · PM** has less room beside its word ("Reds reduce hor padding"): 5.5 px each side, 8.25 px before.
- **NOW** is filled ("fill bg, invert type, make button much lighter colored, now still readable?"). Its fill is a light grey (#B9B9B4, the panel's rule tone), much lighter than the bar's light tone, and its word is the bar's dark (#333). Contrast is about 6.5 : 1, so it still reads. Lighter under the pointer, the bar's light tone when pressed. It is the bar's one filled button: an exception, asked for, to "nothing on this bar is white" (#B9B9B4 is not white).

## beta 4.45.4 (web version) · 16 Oct 2026

- **A disc hand's mark** (#300; Okay, on 4.43: "Mark if also possible easily"). A new row, *Marker*, has two choices, **Hole** and **Mark**:
  - **Hole** cuts the marker out of the disc, so the dial shows through. This is what disc hands did before.
  - **Mark** paints the marker on the disc, whole, in a colour of its own (*Mark ink*, white to start). On the dial it is a part of its own that turns with its hand, catches the shadows of the hands above, and is named "… hand mark" in an exported SVG. The hand's box shows it in its colour.
  - The rows below follow the choice: *Hole*, *Hole length*, *Hole width* or *Mark*, *Mark length*, *Mark width*.
- Two keys are appended to the link table, `mark_as` and `mark_c`. They start as a hole, so every scheme-2 link still draws as before (R31; no new scheme).

## beta 4.45.3 (web version) · 16 Oct 2026

- **The number popup, after Okay's drawing** (#304; "tighter, dark background. Thicker plus minus, rounded ends, text larger, no white despite the drawing, all colors mid grays, text, buttons, dial excluded, they are black"):
  - a dark ground (the night colour). The pills and the − and + discs are mid grey. The value, the signs and the slider's knob are black. The chosen value is black with mid-grey figures.
  - the slider and the value in pills 44 px high. Under them, − and + as two discs 66 px across, the signs thick (3) with round ends.
  - tighter: 11 px round them, 8 between them. It is 166 × 197.
  - its corners follow what they hold: 35 at the top (a pill's round + the room + the frame) and 46 at the bottom (a disc's round + the room + the frame), Okay's "plus minus roundness + some offset".
  - the value at 23 px (20 before).
- **The Guides popup, tighter** (#305; "tighter spacing overall, fit all in one line, all selected… line fits better. Small like beta version allowed"):
  - lines 30 high (38 before; under a finger still 38); no extra room over the headings;
  - **an added guide is one line**: its name and values as quiet numbers to type in (grey, no box), its colours, and in the none sign's place a ✕ that removes it. An added guide is removed, no longer hidden;
  - **All · Selected · None** is smaller and spans the colours exactly, from the none sign to the last colour;
  - the names' column 106 wide (92), the room between colours 9 (10), so the list keeps its width and "Window at 4:30" is no longer cut. The Shadows list keeps its 92 for its sliders.
- **A popup's bottom section** (#305, for Guides and Shadows; Okay: "whole bottom section hr line color, top line gone, perpendicular same thickness touches box bottom, lowest line gone"). It is filled with the line colour from edge to edge and down to the box's bottom, cut by its round corners, with no line over or under it. Guides' rule before Reset All is a hairline of the ground, from the section's top to the box's bottom.

## beta 4.45.2 (web version) · 16 Oct 2026

- **The number popup, a square** (#249, #304; Okay, on 4.45: "everything bigger … three pills inside a square … plus minus roundness + some offset to draw the square"):
  - three pills 44 px high (a finger's size), 12 px apart: the slider, the value (at 20 px), and − and + as one pill split in two, with the shared plus and minus signs;
  - 16 px round them, inside the 2 px frame: 192 × 192;
  - its corners 40 px, a pill's round (22) plus the room (16) and the frame (2), so they run parallel to the pills';
  - no name: the row it opens from already says it ("forget the label"). A row with a menu keeps its menu, over the pills.
- **Guides while sliding** (Okay: "activate guides on slide. Even if off"): sliding in the popup, or dragging a name or a value button, shows the guides as they are set, even with Guides off, until 1.2 s after the last change, as the centre hole's guide does. A numeral being nudged hides them instead (#252: "when a numeral is being nudged hide all guides").
- **The tiny ± on the figures** (#250; Okay: "Compact minusplus too far apart, closer, parallels on baseline ascender, plus's top pushes past"): the plus's top on the top of the number's figures, the minus on their baseline. They are drawn signs now (6 points, `DENSE`), not typed characters. Each still answers to half the number's height.
- **Nudge's adjusters** (#252): Radius ±, Angle ± °, Rotate ° and Size × are number rows on the chosen numeral: a slider, the value, ±, and the popup from their names. A neutral value (0, or ×1) is not kept.
- **A window's width and height on one line** (#265, R15 form B): W and H, two quiet numbers whose names open their popups. The arch keeps its one Width row.

## beta 4.45.1 (web version) · 16 Oct 2026

- **The hand rows, quiet** (#250; Okay's notes, p. 18):
  - The number beside a hand's box has no box. It and its compact ± are grey until the number differs from how the dial opened, then ink.
  - A press on the number opens its popup. With the keyboard (Tab) it still takes typing and the arrow keys.
  - The box that grew over the slider (4.25) is gone.
- **Names:** one line each, none longer than "Counter Ø": Round, Tip, Head W, Widest %, Wall, alongside the existing short ones. The names' column is that wide, so the sliders are longer.
- **Order:** Colour stands first beside the box; the cap stays last.

## beta 4.45 (web version) · 16 Oct 2026

Phase E, first push: the number popup.

- **The number popup** (#249; R15's popup). It holds:
  - the number's name;
  - the slider, its thumb a pill a fifth larger than the panel's;
  - the value in a pill;
  - round − and + under it.
  It sits in a 2 px dark-grey frame on a ground darker than the pane's, its corners as round as its pills. It is the number's own row laid out anew, so it does everything the row does (typing past the slider's range widens it). It opens under what was pressed. On a phone it is a sheet at the bottom, over the drawer, so the dial stays in view, and the keyboard comes only when the value is pressed. Enter, Escape or a press outside closes it.
- **It opens from:**
  - a value button, which no longer grows its tag into a small square;
  - **a full row's name**: a press on "Diameter" opens Diameter's popup;
  - **the guides' Thickness**, whose slider is back, in the popup (R15 form B, #271).
  A press on a name moved sideways changes the value instead, two screen points a step, as a value button does (#170).
- **Reset All asks first** (#271): "Reset all guides?" in its line's place, with round ✕ and ✓. ✕ keeps the guides.

## beta 4.44.6 (web version) · 16 Oct 2026

- **The time larger, its colons roomier, AM · PM attached** (Okay: "Barlow larger, don't worry optically will be better, more spaces both sides of :s, am attached to time and same size barlow"):
  - The time is 20 px (17 before).
  - Each colon is 0.24 em wide (0.155), so it has about twice the room either side.
  - AM · PM is attached to the time's box again, as high, its word the time's size, one width for both.
  - On a phone both are 12 px.

## beta 4.44.5 (web version) · 16 Oct 2026

- **1× has a dot on the speed line** (Okay: "1x needs a dot"): a filled black dot, the end rings' size, where slow motion ends.
- **The play button's pulse goes faster** (Okay: "Play button can go faster in animation"): it now follows the time up to six flashes a second, not three. The three-flash limit (WCAG 2.3.1) is for flashes over a large part of the view; a 31-point button is far under it.

## beta 4.44.4 (web version) · 16 Oct 2026

- **The unit box, done** (#302; Okay: "Mm looks perfect now add 2px more padding and we are done. Others use the same height, width can change"):
  - 4 px round mm's letters.
  - Every unit's box is mm's height on mm's baseline, as wide as its own word; ascenders and descenders reach into the padding (2.5 px or more left).
- **The unit menu stands over the rows under it** (Okay: "Thou falls under, this top bar here needs a z index of its own"). The unit box is moved onto the title's baseline with a `translate`, which made it a layer of its own at 0, so its menu fell under the − + of the row below. It now has its own level, as the title has.

## beta 4.44.3 (web version) · 16 Oct 2026

- **The unit box: the same room on every side, on every screen** (#302). Counted on Okay's screen (4.44.1), "mm" stood on the box's bottom line: 4.5 px above it, 0 below, 3 left, 2.5 right.
  - The box was the right size; his browser placed the word inside a button differently from Chromium.
  - Now the word is placed by the page, not by the button. The letters' size and place come from Dial Mono's own outlines (`UNIT_INK`, printed by `fonts/ui/mono_font.py`). The baseline is measured with a dot on the word's line, once the face has loaded; browsers round a face's ascent and descent each their own way (8 px down a 10 px line here, 8.6 by the face's figures).
  - The box, the word and the box's place on the title's line are snapped to whole screen dots, so its line stays crisp.
  - Counted again at 2× (Chromium): every side 2 px, to a screen dot, for all five units.
- **The Shadows sign: no seam round the ball** (Okay: "There's a single faint line around the ball"). Its shadow was cut at the ball's outer edge, where two smoothed edges met and let a hairline of the ground through. It is now cut at the middle of the ball's line, so the cut lies under the line.

## beta 4.44.2 (web version) · 16 Oct 2026

- **Reset's button stands flush left with its warning** (Okay: "reset button flush left with explaner text"), on the heading line where the warning starts, the controls' column. It was at the line's right (#269).
- **The Shadows sign: the ball sunk 2 px into its shadow** (Okay: "Shadow's ball sinks 2px down into its shadow"). The ball stands in front, its disc cut out of the shadow, which shows to its right and under it. It touched the shadow from 4.42.4.

## beta 4.44.1 (web version) · 16 Oct 2026

- **The unit box, third look** (#302; Okay: "mm button sucks … use mono, abort silkscreen, border and letters should match, small"; then "Not system font, something universal … match the box please, and mm lowercase"):
  - The word is in small letters ("mm") in **Dial Mono**, a packed cut of JetBrains Mono (3 KB). It is the same on every machine, and its weight (456) makes its stems exactly as thick as the box's 1 px line at 10 px.
  - The box stands 2 px round the letters' ink on every side, so each unit's box is its own size; "thou" is taller for its ascenders.
  - Line and letters are one colour.

## beta 4.44 (web version) · 16 Oct 2026

Phase D: the bottom bar.

- **A play triangle on the red cap** (#282), in place of the beat's dot. It is white and soft, 40 % at rest, its corners on a circle 0.45 of the cap's radius, centred on its ink. While time runs:
  - At each beat the cap lightens by up to 30 % and fades the whole way to the next beat, eased.
  - The triangle flares to 70 % with it and fades faster, back to 10 % by half the beat.
  - The pulse follows the time shown, so it falls with the seconds hand's steps and quickens as time runs faster. Above three a second (or the movement's own beat, if that is more) it holds, in real seconds; 720× no longer means hundreds of flashes a second.
  - Where the system asks for less motion, nothing pulses and the triangle stays at 40 %.
- **Slow motion is back** (#283). The speed slider's first part, two thumbs wide, holds 0.1 · 0.25 · 0.5 · 1×, and the thumb snaps onto them; from 1× the log scale runs to 720× as before. The thumb starts at 1×; the left end says 0.1X. While the speed is being moved, its name over the thumb is a pill exactly like 10:10's. On a phone, where the speed is written in the thumb, a slow speed loses its leading 0 (".25X") to fit.
- **The time in Barlow Condensed** (#284). Light, whose strokes are 0.90 px at the time's 17 px, against the box's 1 px line. Tabular figures, tight tracking (−0.02 em), the colons 80 % as large and centred on the figures.
  - It is packed into the page as **Dial Time**: cut down to what the time needs (11.8 KB) and renamed, so it can't clash with a ring's Barlow Condensed (`web/fonts/ui/time_font.py`, SIL OFL).
  - The time's box is narrower (113 → 69 px), so the speed track is wider (123 → 171 px).
  - AM · PM is in the same face, in a smaller box beside the time with the same room on every side, one size for both words. NOW is untouched.

## beta 4.43.2 (web version) · 16 Oct 2026

- **The guides follow the tab you're in** (#301; Okay, on 4.43: "both window and [ring] active gives us a complex look"). *Selected* now means the selected one in the tab you work in: the Rings tab shows the selected ring's guides, the Windows tab the selected window's, the other tabs neither. The dial's own guides (centre hole, centre lines) show in every tab while on. With *All*, every ring's or window's guides show, and those out of focus are faded to 40 %. Researched first: Glyphs' local and global guides, Fusion 360's sketch dimensions, Blender's *Fade Inactive Geometry*, Illustrator's smart guides and Figma's measuring lines all show one thing in focus at a time.
- **The first window's guide starts yellow**, a colour no other guide starts with (it was cyan, the centre hole's).

## beta 4.43.1 (web version) · 16 Oct 2026

- **A disc hand's marker is called its hole** (#300): *Hole*, *Hole length*, *Hole width*. It is cut out of the disc, and Okay liked it that way ("work as holes now, perfect, just call it that"). Only the row names changed; the settings keys stay (R8). A mark drawn on the disc as well is on the list (phase E).

## beta 4.43 (web version) · 16 Oct 2026

Phase C: the link system.

- **Links in capitals and digits only** (#278, link scheme 2). A link is now `#2` followed by letters and digits (Crockford's base 32: no I, L, O or U, so nothing looks alike). No dashes, underscores or tildes, so it breaks evenly wherever it is pasted. Typed in small letters, or with O for 0, it still reads.
- **And shorter** (#246, its lossless parts). Each key is written as a short code from a table that only grows. Colours are written as hex, numbers to 3 decimals, the time to the second. Every link kept in the repo got shorter, even with base 32's longer letters: Okay's watch 1214 → 1001 characters, the Gallery and the examples together 8092 → 7464. The most a value moves: a colour channel by half a hex step (0.9 → 0.902).
- **Old links don't open any more** (R31 as replaced). A scheme-1 link opens the First dial, and a note says so on the preview (a press puts it away) and in the log. The Gallery's and the examples' links are written again. **The live guide's links are scheme 1: they open the First dial until the guide is rebuilt** (on Okay's word, R25).
- **The cap is part of the seconds hand** (#262). Its size and colour are in the seconds hand's pane; the Cap pane is gone. With no seconds hand, the topmost hand's pane offers *Cap on this hand*, off: a dial without a seconds hand has no cap until it is ticked. Okay's World time (Gallery) and the Gauge example have no seconds hand; they keep their cap, ticked in their settings, and their pictures are unchanged.
- **Tests:** `web/test/linktrip.mjs` (#291, in `npm test`, under a second). Every Gallery and example dial, the opener and Okay's watch go there and back as the same dial, and their links come out the same when written again. A text starting with "#" stays a text; the beat and the time travel; base 32 holds any bytes; every settings key has a code; the key table only grows.

## beta 4.42.5 (web version) · 16 Oct 2026

The last push of phase B: the guides.

- **The centre hole has a guide** (#267), first in the guide list, cyan to start. While the hole is being sized it shows live, even with the Guides switch off or this guide set to None, and goes 1.2 s after the last change.
- **Every ring and every window has two solid circles at its edges and a dotted one at its middle** (#272). A ring's edges are where its marks, numerals or text actually reach as drawn.
- **Windows have their own section in the guide list** (#271), like Rings: *All · Selected · None*, Selected to start, then a line for each window that is on, with its own colour. The section is hidden when no window is on. *Window radii* is gone; the top of the list keeps only Centre hole and Centre lines.
- **The guide list, tidied** (#271):
  - Lines 4 px shorter (38).
  - A colour not chosen shows at 60 %.
  - The "none" sign is one path, so nothing in it overlaps.
  - A band of the fields' colour before *Add*.
  - The last line: Thickness, its number with a compact plus and minus, a rule, then **Reset All**. Reset All also resets the rings' and windows' guide colours.
  - Thickness lost its slider: next to Reset All it had no room left (0 px, measured). It comes back in the number popup (phase E). Reset All's "Are you sure?" comes with it too.
- **Test fix** (`web/test/window.mjs`): the "someone else's browser" in the link checks is now a browser context of its own. As a second tab it shared the first tab's storage, and the first tab, its clock running, saved its dial while the second was starting. The check "no last session: it opens with the First dial" failed twice in a row because of this.

## beta 4.42.4 (web version) · 16 Oct 2026

- **The title line, second look** (#299): a fifth unit, **thou** (a thousandth of an inch); the unit box says its unit in the pixel font, in capitals (MM · PT · IN · LIG · THOU), a smaller box (35 × 15.5), one width for all; the Gallery pill a hair taller, upward (1 px).
- **See-through shadows** (#295): a hand that lets light through casts a lighter shadow, tinted with its colour, as light through coloured glass does; a solid hand casts the shadow it always did. Each shadow is multiplied onto what it falls on; see-through shadows are drawn first, so where a solid one crosses them nothing is darkened twice.
- **The Shadows sign**: its cast shadow moved up to touch the ball (#281). **The eye switch**: its rays a hair thicker, 0.625 (was 0.5); **the showcase's iris stands over the eye**, one unit apart, as Backdrop over Shadows (#280).

## beta 4.42.3 (web version) · 16 Oct 2026

- **Copy link** (#277) stands on the heading line of *Link to this dial*, flush right, with a link sign (a new icon, through the pipeline), and stays there when the pane is folded. The link stands on one line, cut at the box's edge (Copy link copies it whole); under it, its length and what "fonts travel by name" means. The beat travels in the link (it always did; now a test says so).
- **Settings file** (#279): a sentence says what a settings file is; after Load the pane's heading names the file and Save… offers that name again. **Defaults** now gives the guide's First dial, as the tool opens with ("Guide default wins"); a new **Plain dial** gives the plain starting values, where the guide's First dial begins.

## beta 4.42.2 (web version) · 16 Oct 2026

- **A first visit opens tidy** (#270): in every tab the pinned panes are open and the panes under them folded, each saying in its line what it holds — but for the pane a tab is about when only tabs are pinned above it (a hand's, a window's). What a visitor opens or folds is remembered, as before. A click on a numeral in the preview opens Nudge, since it starts folded.
- **Colours, folded, shows its colours** (#268) as tiny swatches, as many as fit on its line; it starts folded.
- **Reset** (#269): open, its button stands at the right of the pane's heading line, the warning under it; folded, the line says Reset and nothing else.
- **Custom labels say how they work** (#298): "Commas between labels: one label for each position, the rest stay empty" (found by Faruk Koç).
- **Hands:** the line between All hands and the hand tabs starts and ends where the tabs do (#260).

## beta 4.42.1 (web version) · 16 Oct 2026

- **The title line, quieter** (#285): the unit box is a small box at Help's size, one width for every unit, flush right; the Gallery pill stands right after Help, as far from it as Help is from the version, a small pill as high as the unit box, darker than the unit box and lighter than Help. Both stand on the title's baseline (placed by measuring, like the title).

## beta 4.42 (web version) · 16 Oct 2026

Phase A of Okay's notes (build list #290). Nothing on screen changes: the look-check (`web/test/same.mjs`, 489 states) finds no difference but six readings of the showcase's Now and 10:10 pills caught mid-fade (a 250 ms opacity transition, read at another moment; none of their tokens moved).

- **Specials, in one place** (R32): every value in the stylesheet that leaves the scale of spaces, the three line widths or the type sizes now stands in one labelled block at the end of `1-tokens.css`, by name, with why — first the ones Okay asked for (the quiet buttons at 75 %, the type sizes 10 and 17, the pixel font at 12 in the legend, the bar's pixel labels at full strength, the pop-out's chip gap, the speed box's padding), then the ones found off the scale with no figure from him (#294, to look through). Three bare values in rules became tokens there (the legend's pixel size and sticker padding, the bar labels' strength).

## beta 4.41.25 (web version) · 16 Oct 2026

- **Reset moved into the Dial tab**, last, under Colours, with a warning under it: it replaces the whole dial with the guide's First dial (undo brings yours back). The pill over the dial is gone: a view option it is not.

## beta 4.41.24 (web version) · 16 Oct 2026

- **The tool opens with the guide's First dial** (the black field watch, 34 mm) when the address has no dial and nothing was kept. Okay's watch stays first in the Gallery.
- **Reset**, a pill at the foot of the dial: brings back the First dial, every setting. Undo brings back what you had.

## beta 4.41.23 (web version) · 15 Oct 2026

- **Help**, beside the version in the title line: opens the guide (duztman.github.io/dial-tool/guide/) in a new tab.

## beta 4.41.22 (web version) · 15 Oct 2026

- **Gallery:** Sector is Okay's own version (a thin band round the inner pies).

## beta 4.41.21 (web version) · 15 Oct 2026

- **Dial links have no dashes**: a tilde where a dash was, so a pasted link breaks only at its line's end. Old links still open.
- **Gallery:** World time before Elapsed time.

## beta 4.41.20 (web version) · 15 Oct 2026

- **Gallery:** World time is Okay's own version (dark red hands, larger day and night figures).

## beta 4.41.19 (web version) · 15 Oct 2026

- **Opening a Gallery dial keeps the panel where it was** (it jumped back to the top).
- **What you press stays under your finger** while rows above it appear, go or move (the ring line, more/less, folds), as far as the panel can scroll.
- **A ring's grip is easier to catch** by finger (it reaches into the start of the name).
- **Alternate**: a band with an even number of sectors can take two colours that alternate.
- **Gallery:** the B-Uhr is Okay's second version (navy, cyan marks).

## beta 4.41.18 (web version) · 15 Oct 2026

- **Gallery:** Montgomery fifth; the 12 + 24 is Okay's own, in Rubik.
- **Rubik** joins the font list (twenty-one).
- **Selecting, showing or moving a ring keeps the panel where it was scrolled** (it could jump by hundreds of points).

## beta 4.41.17 (web version) · 15 Oct 2026

- **Montgomery comes right after 12 + 24 hours** in the Gallery.

## beta 4.41.16 (web version) · 15 Oct 2026

- **The Gallery's diver is Okay's own**, blue with a striped dial, and fourth.

## beta 4.41.15 (web version) · 15 Oct 2026

- **Bauhaus is the Gallery's third dial**, after Okay's watch and his B-Uhr.
- **The Gallery pill folds Export a file** (its eye shut), so the Gallery has the room; open it again with its eye.

## beta 4.41.14 (web version) · 15 Oct 2026

- **Fixed: steppers showed through the open bio.**

## beta 4.41.13 (web version) · 15 Oct 2026

- **The size button's drawing lies level**: the small and large circle side by side on the radius line, larger than before.

## beta 4.41.12 (web version) · 15 Oct 2026

- **The Gallery's B-Uhr is Okay's own**: green plate, yellow triangle, orange hours, lilac minute numerals; same name.

## beta 4.41.11 (web version) · 15 Oct 2026

- **On a phone the mark is larger on the full title line** (22, as in the showcase); squeezed, it is the eyes' size again.

## beta 4.41.10 (web version) · 15 Oct 2026

- **A phone's title line, full and squeezed**: at the drawer's top it is full — the title at its size, the Gallery pill, mm; once the drawer scrolls it squeezes (no Gallery, no mm) and stays on top with the tabs held under it; back at the very top it is full again.

## beta 4.41.9 (web version) · 15 Oct 2026

- **Okay's watch opens the Gallery**: the dial the tool opens with, first of its cards.
- **A Gallery pill on the panel's top line**, centred between the version and the unit box, dressed like the unit box: pressed, Export with the Gallery open and in view.
- **A phone's bar**: the time at the bar's text size (12, as AM); how fast takes the room it gives; the red dot has 16.5 either side (was 14 and 10).

## beta 4.41.8 (web version) · 15 Oct 2026

- **The showcase has 10:10 beside Now**: the same whirl, to the classic pose. Whichever is pressed turns into the undo sign; the other stays where it is. The way back is always to the time first shown.
- **A hands key at the showcase's bottom left**, across from the X: round, the Hands sign inside. Pressed, it hides the hands (filled, the sign dark); the dial's own Show hands is left as it is.

## beta 4.41.7 (web version) · 15 Oct 2026

- **The showcase's Now, rechoreographed**: the hour hand turns once clockwise, the minute hand once anticlockwise, both landing on the time; the seconds hand makes no turn and goes the short way to its place meanwhile. Slow to start, slow to land. Going back, each big hand turns the other way. (Was: every hand two turns, the same way.)

## beta 4.41.6 (web version) · 15 Oct 2026

- **The thick line under what stays put stops at the margins**, like every other thick line; in the margins the white meets the grey with no line. Desktop and phone.

## beta 4.41.5 (web version) · 15 Oct 2026

- **On a phone FIT is as wide as its sign and word need**, with equal room either side (9 px, as NOW has); the day slider gives way.

## beta 4.41.4 (web version) · 15 Oct 2026

- **The narrow layout's font sheet offers link and file only**: Installed (a desktop Chrome or Edge thing) isn't shown there, and the two keep their second lines.

## beta 4.41.3 (web version) · 15 Oct 2026

- **On a phone the font sheet reaches up to the bar**, over the whole preview.
- **A word longer than its box in the font sheet's buttons is cut at the box's edge** (Legend's "(OpenType abbr.)").

## beta 4.41.2 (web version) · 15 Oct 2026

- **A switch whose words show is filled with the backdrop's colour**, so the dial under it doesn't show through: the iris switch opened to ACTIVATE SHOWCASE, and Guides, Backdrop and Shadows (always on a wide screen; on a phone while their words are unfolded).

## beta 4.41.1 (web version) · 15 Oct 2026

On a phone:
- **The drawer's title line is compact**: a pane heading's height, the mark at the eyes' size, "Dial Tool" at the panes' size; the unit box is gone (lengths in mm).
- **Scrolling the whole drawer**, the tabs stay on paper across its whole width and on the thick line, as at its top (the panes no longer show past their edges).

## beta 4.41 (web version) · 15 Oct 2026 · released

- **A phone's edges meet halfway**: the bar, the switches on the preview and the drawer all stand 2.5 units (13.75) in from both sides (the bar and drawer had 16.5, the switches 12).
- **The bottom bar's monospace is tracked 50** (time, AM · PM, NOW, FIT, the hours, 10:10); labels stay centred on their ink, tracking counted.
- **The drawer's gripper is a pill** with one groove across it; held, it is black with a white edge and the whole line goes black.
- **On a phone the speed is written in its thumb**, in the pixel face, in place of the eye.
- **The bio**: "Designed and vibe coded by Okay"; the contact line ends the first paragraph.

## beta 4.40.1 (web version) · 15 Oct 2026

On a phone (and an iPad held upright):
- **The drawer has a gripper**, a grey dot on its top line: drag it to make the drawer taller or shorter, tap it to jump between about half and three quarters. Tall enough, the drawer holds its title, tabs and pinned panes still and only the rest scrolls.
- **The switches on the preview show their signs only**; a tap on empty backdrop unfolds their words for three seconds.
- **The Guides and Shadows lists open as sheets from the bottom**, over the drawer, never cut by it.
- **The strip under the phone's status bar takes the bar's colour**, so the bar no longer starts against white.
- **The showcase keeps the mark and "Dial Tool" at the top left**; the mark is larger on a phone.

Everywhere:
- **What stays put ends on the thick line on every tab** (Dial, Rings and Export had a hairline).
- **FIT** in capitals at 12, as NOW and AM.

## beta 4.40 (web version) · 15 Oct 2026 · released

The night's work after 4.38 (4.38.1 to 4.38.11, 4.39, 4.39.1 to 4.39.4), released to `main` as 4.40 (Okay, 05:53: "Release this, it deserves a 4.4" — 4.4 is taken, by 12 Oct's review, so 4.40). Nothing in a dial changed; links and settings files open as before.

- **The play button pulses with the movement's beat**, a light dot at its middle; the speed runs 1× to 720×.
- **Your watch opens the tool** on a first visit (`web/src/opener.js`); Defaults still gives the plain starting dial.
- **Okay's mark and bio** in the panel's first column: who made the tool, its source, the open-source work it stands on, and a contact link.
- **Guides** start with pink centre lines and the selected ring; their sign has ink traps and stays the same off and on. **Shadows** has a sign. The window never zooms; only the dial does.
- **The eye switch** (bottom right) shows the dial alone: the panel slides away, the dial grows to fit.
- **The showcase** (the iris switch beside it, through ACTIVATE SHOWCASE): the dial at 2/3 of an A4 on a dark 45° sky, a spotlight through a twenty-second sun day (drag across to move the sun), the clock running; Now spins the hands to now and back; the X goes back the long way.

## beta 4.39.4 (web version, printed as 4.38.16) · 15 Oct 2026

- **Out of the showcase the long way**: the bar rises and the panel slides back, eased, while the dial travels home.
- **A gentler sun**: a day in twenty seconds, always 40° high on its ray; at sunrise and sunset its light (shadows and spotlight) fades out and in instead of the shadows growing long.
- **The X and Now** are a quarter larger, less faint, and stand a margin in from the window's edges, like the mark at the top left.
- **The arrow hint** is three times larger, white with a glow, centred between the dial and Now.
- The iris and eye switches no longer touch: the unit between them, as between the other switches.

## beta 4.39.3 (web version, printed as 4.38.15) · 15 Oct 2026

- **The showcase, reshaped.** The iris switch opens to ACTIVATE SHOWCASE first; only those words go in. Going in and out, the panel, the bar and the switches go (and come back) at once and only the dial travels, eased — to 2/3 of the width of a portrait A4 fitted in the window, centred; out, back exactly where it stood.
- The sky is a 45° gradient, lightest at the top left. A spotlight lies behind the dial and takes its shadow: an oval at sunrise and sunset (faintest, softest), a circle at midday (brightest, almost crisp).
- The sun crosses a day in ten seconds — rising at the left, at midday from the top (40° high), setting at the right — then rises again. A drag across the window moves it along that day.
- The iris switch is an X in the showcase (the way out); Now is tracked 100. Pressed, every hand turns twice and lands on now, and Now shrinks into an undo sign; pressed, the hands turn twice back and it grows into Now again. Over Now, a left-right arrow sways once when the dial arrives. The mark and "Dial Tool" are fainter and can't be pressed.
- The shadows' soft edge is off while anything moves (the dial travelling, the panel sliding, the hands spinning, a drag) and comes back when it stops.

## beta 4.39.2 (web version, printed as 4.38.14) · 15 Oct 2026

- **The showcase**: a new switch left of the eye, the iris alone. Pressed, it shows the dial alone and more: the backdrop darkens to a faint gradient (black at the bottom, the backdrop's colour much darkened at the top), the bar sinks away, and nothing stays but the mark and "Dial Tool" (top left), the iris (bottom right, twice as big) and a Now pill (bottom centre). The clock runs at 1× from where it was, shadows are on with the soft edge, and the sun goes round six times as fast as the minute hand, rising and setting once a round; a press or drag on the preview puts the sun there. Pressed again, back to where you were.
- **The mark is aligned to the title's capitals** (it sat a point low).

## beta 4.39.1 (web version, printed as 4.38.13) · 15 Oct 2026

- **The eye switch shows the dial alone**: pressed, it fills (a hair inside its line) and the panel slides away to the left, eased; the dial grows and centres in step. The mark, "Dial Tool" and the version stay where they were, turning white on a dark backdrop; Backdrop and Shadows ride left and stop on the mark's line; undo · redo stop after the title; the bottom bar stays. Pressed again, all comes back. On a phone or a portrait iPad the preview grows down over the panel instead.
- The speed box's growth toward play is now taken from play's margin, not by a negative margin (R32).

## beta 4.39 (web version, printed as 4.38.12) · 15 Oct 2026

- **The tool opens with Okay's watch** when there is no dial in the address and no last session (`web/src/opener.js`). "Defaults" still gives the plain starting dial.
- **The Guides sign is one drawing**, on and off: off it is only fainter (the slash is gone).
- **The eye switch moved to the preview's bottom right**, over the zoom, and is redrawn: the iris, 24 thin rays from it cut by the box, and the eye's outline knocked out of the rays; inside the eye only the iris.

## beta 4.38.11 (web version) · 15 Oct 2026

- **mm is quiet**: the unit box's word and line one colour, as light as a switch that can't be pressed; dark under the pointer.
- **The speed box clears its thumb evenly**: at either end the thumb stands as far from the wall as from the top and bottom (3); the box grows toward the play button to make the room, so the track keeps its length.
- **The bio ends "Contact him here."**: a mail link to Okay whose address is kept scrambled in the page and source and put together only when pressed.

## beta 4.38.10 (web version) · 15 Oct 2026

- **Okay's mark redrawn thinner and on the grid**: lines 1 (were 1.25), the ring 1.375 (was 1.625); every straight edge on a whole dot of a 2× screen; each line ends on the ring, as in his drawing.
- **The mark turns over while the bio is open**: light on a night disc a little wider than its ring.
- **The bio has no title of its own**; its text stands on the title's line, the bullets hang left of it.

## beta 4.38.9 (web version) · 15 Oct 2026

- **The eye switch has eight lashes**: four more from the eye's corners out to the box's corners; the upright lashes no longer bulge into the eye.
- **The Guides sign's ink traps as Okay picked them** (r 0.45), and their true size: in 4.38.8 the cuts took the sign's stroke and came out wider.

## beta 4.38.8 (web version) · 15 Oct 2026

- **Okay's mark** in the panel's first column, left of the title; a press opens a short **bio**: who made the tool, the source and its licence, and the open-source work it stands on — HarfBuzz, Skia's PathKit, Inter, Silkscreen, the twenty OFL dial typefaces, DrawBot, esbuild, Playwright.
- **An eye beside Backdrop**: a square switch with an open eye whose lashes run out to its edge. A preview of something to come: a press only turns it on and off.
- **The speed's thumb 160 %** (14 → 22), its eye the same size.
- **The Shadows sign mirrored** (lit from the upper left, the shadow to the right), its outline as thin as Guides'.
- **Ink traps in the Guides sign**: a small cut in each inside corner where an arm crosses the ring.

## beta 4.38.7 (web version) · 15 Oct 2026

- **The window never zooms, only the dial** (#193): a pinch on the panel, the bar or anywhere but the preview does nothing; inside the preview it zooms the dial as before. The page asks iOS not to scale it, fingers may only scroll (`touch-action`), Safari's gesture events and ctrl + wheel are refused outside the preview.

## beta 4.38.6 (web version) · 15 Oct 2026

- **The Shadows switch has a sign** (#192): a sphere lit from the upper right, its shade a crescent on the lower left, its shadow a flat ellipse cast to the left — after a photograph Okay sent. Whole when shadows are on, faint when off.

## beta 4.38.5 (web version) · 15 Oct 2026

- **Guides start lighter**: centre lines in pink, no window radii, only the selected ring's edges; the dial edge's guide is gone from the list and the preview. Old links that kept the old starting values see these (preview only; R31 notes it).
- **A switch that is on shows its sign whole**, not only its word (Guides; Shadows has only its word).

## beta 4.38.4 (web version) · 15 Oct 2026

- **No slow motion** (#190): the speed runs 1× to 720×. Its two ends are black rings with empty eyes, named 1X and 720X in the bar's grey; the ball at 1× and the snapping are gone. The speed riding over the thumb is white — the one white thing on the bar.

## beta 4.38.3 (web version) · 15 Oct 2026

- **The beat's dot three times as large** (#191): radius 7.5 of the cap's 15.5.

## beta 4.38.2 (web version) · 15 Oct 2026

- **A light dot in the middle of the play button** (#191): it lights with each beat and fades with the pulse.

## beta 4.38.1 (web version) · 15 Oct 2026

- **The play button pulses with the movement's beat** (#191): while time runs its red cap brightens faintly at each beat and fades before the next — 1 a second for quartz, 6 or 8 for the mechanical beats, counted in real seconds (at 1× in step with the seconds hand; faster speeds don't make it flicker); a sweep breathes once every two seconds. Not where the system asks for less motion.

## beta 4.38 (web version) · 15 Oct 2026

Shadows and a new bottom bar, built on a trial page (`try/shadows`) from 14 Oct, 22:36 to 15 Oct, 01:08, then made the live page (Okay: "Congratulations this is v4.38"). Released to `main` with 4.37 and 4.37.1.

- **Shadows on the preview** (#189): one far light; the hands, the cap and the date discs at heights in mm; each surface catches only what falls on it, so a shadow steps where it crosses a hand or a window's edge; nothing outside the dial; preview only (R5, R26). A Shadows switch at the bottom left of the preview with its list (light from · height · darkness · soft edge; each hand's height, the cap's top; the date discs' depth; Reset), Okay's values to start. Switches on the preview no longer go bold when on: their word turns whole.
- **The bottom bar, redone** (#190): a fifth higher; all monospace; one light tone, 55 % grey, nothing white. Play is a red arcade button seen from above, the size of a section tab, pressed in while time runs. How fast is one slider, 0.5× to 720× on a log scale: a black line with knobs at its ends, a ball at 1× (snaps there), the speed riding over the thumb in Silkscreen with a black 1X left over its ball. The time larger, centred on its ink, its AM · PM window beside it; NOW in capitals. The day slider no wider than on an iPad, 10:10 on its own thick line. "⌘ + scroll to zoom" on a desktop; Fit with a magnifier. The panel's square and the status line are gone.

## beta 4.37.1 (web version) · 14 Oct 2026, evening

- **Short labels centred on their ink** (#186): the window's places (3 … 10:30, 4, ···), the speeds (1× · 60× · 720×), AM · PM, the bottom bar's hours and 10:10, and the unit box. Each label is measured as it is drawn (`web/src/ink.js`) and moved so the rectangle its ink covers stands on the box's centre; its figures are proportional, so a "1" no longer carries a "0"'s width. Measured on the page at 1440 wide: "10:30" was 0.5 px right and 1.25 px high, now 0 and 0.75; "1×" was 1.25 px high, now 0.25 (test: the window test reads the dots). Fields and the time keep tabular figures.

## beta 4.37 (web version) · 14 Oct 2026, evening

The Now list, built by Claude alone in an hour (Okay, 18:00). On `dev` and the live page; `main` stays at 4.36.1.

- **The eye only shows or hides** (#183): it no longer selects the ring, so the rows below don't jump and the next eye stays under the pointer. A click on the row still selects.
- **Touch** (#153, #152): no grey tap box and no focus ring after a finger's tap (a key brings the ring back); a pinch follows both fingers from the moment the second lands — zoom by their distance, pan by their midpoint.
- **Opacity on hands** (#163): the colour pop-out's opacity strip for each hand.
- **Time from the keyboard** (#84): ← → a minute, ⇧ an hour, space plays or pauses — not while typing, on a slider or in a menu.
- **Window frames stay even** (#168): circles, polygons and arcs grow by their measures; stroking a circle had bulged it up to 6 % at the diagonals (the "four-petal blob").
- **Centre hole** (#165): `dial_hole`, Ø 2.7 mm to start, a row under Diameter; seen when the hands are hidden; a cut line on a production mask. Every dial gets it, old links too (Okay waived R31 for it).
- **Arc text** (#166): a date or day in an arc window bends along the arc and reads left to right at the bottom; it stays outlines with live text on.
- **Disc hand** (#164): a new hand shape — a disc carrying one marker (bar · wedge · dot), its outer end at the hand's Length, cut out of the disc where it lies on it.
- Not done: #85 (hand tip to a ring's edge) parked with snapping (#184); #167 (am · pm colours) couldn't be reproduced.

## beta 4.36.1 (web version) · 14 Oct 2026

- **The Guides switch as Okay drew it:** guides on, the target's centre ring dashed; off, a hollow slash — two lines with the target cut away between them.
- **The rename box thinner:** a quiet sign, `DENSE` (corners an eighth heavier, as on any box).
- **The round tools' rims light grey** (`--rule`, about 28 %, the value discs' colour), at full weight.
- **The icon check** visits the size button pressed; `<mask>` parts are not read as lines.
- **The repository is the web tool** (no change to the tool): the DrawBot version — `dial.py`, its tests, its preview plan, reference renders and the 4 Oct guidebook — moved to `archive/drawbot/`, unchanged. Every build since beta 1.0 is listed in `docs/versions.md`; `tools/versions.sh` tags them or opens one beside the clone. README rewritten around the web version.

## beta 4.36 (web version) · 14 Oct 2026

The icon audit (Okay, 14 Oct: "Truly awesome work. Apply on live page. Let this knowledge of good and proper icon making be canon.").

- **Every icon on one 2× pixel grid.** Each is drawn at the size it is shown (40 were drawn at one size and scaled to another, ×0.63 to ×1.69); straight lines on quarter points, so they cover whole screen dots.
- **Every line equally heavy on the eye.** Four widths for one look: `LINE` 1.5 straight, `SLANT` 1.5625 slanted, `CURVE` 1.625 round, `DENSE` 1.25 crowded (were 15 widths, 0.79 to 2.88). Measured: the median line 1.5 % off a straight 1.5 (was 9 %), the worst tenth 4 % (was 26 %).
- **Rings and frames are lines:** the section tabs' rings, the window cards' dials, the rename box, the value buttons' discs, now as heavy as the signs; outer edges kept. The ring list's round tools draw their ring in the sign (their border could only be 1 point). A box's round corners `CURVE`.
- **Dial sign:** the plate with its centre hole (was eight pies); chosen, the plate fills and the hole is a dot of paper. **Rings sign:** three equal gaps.
- **Value buttons pressed:** the shape fills with ink, outlines stay grey, inner line and pivot paper.
- **One drawing per idea:** one plus (the ring tools' was a point longer), one cross, one chevron, one copy sign (Copy style of… had its own), one sheet. The bin's handle a flat line. Play centred by weight. The 12's dashed none-baton readable. Window cards: window 8 × 6.5 as on the tab, 4 points from the rim at every angle (#149, first half).
- **The icon pipeline** (`web/icons/`): `fit.mjs`, `check.mjs` (now the last step of `npm test`), `look.py`. Canon: `docs/design.md` §9; rule R33.

## beta 4.35.17 (web version) · 14 Oct 2026

- **The hand's preview box** stops one unit under the line, the same gap as between the shape tiles.

## beta 4.35.16 (web version) · 14 Oct 2026

- **The hand's preview box** scrolls up with its pane until its top meets the line under the hand tabs, and stays there (4.35.15 held it where it started, under the pane's heading).

## beta 4.35.15 (web version) · 14 Oct 2026

- **The hand's preview box stays still** while the hand's shapes and rows scroll beside it, until the end of the hand's pane (the Cap pane) pushes it up (wide layout; `position: sticky` in `4d-hands.css`).

## beta 4.35.14 (web version) · 14 Oct 2026

- **Lang. and Change…** in the font box at three quarters, box and words (20 high, 10 type), in lighter grey with a lighter line; under a finger the whole height of the font name's line presses them.
- **The ring rows** stand between the pane's lines too, like the font box: the name gives up the room. The colour column and the font box's swatch still line up. `--frame-out` is gone; the room inside a frame is `--frame-pad` (R32: no negative margins, no exception).

## beta 4.35.13 (web version) · 14 Oct 2026

- **The window tabs** start where the labels start (the eyes' column is left free) and end on the pane's line; each is narrower.
- **The font box** stands between the pane's lines, as the rows above it do, instead of 8 px past the right one; its sliders are 8 px shorter, so its fields, steppers and Change… end 8 px inside the box. The text colour's swatch stays in the ring list's colour column.

## beta 4.35.12 (web version) · 14 Oct 2026

- **The legend's meanings, shorter**, so the window no longer scrolls on an iPad in landscape (1180 × 820 and larger; at 1024 × 768 about two lines still scroll): *Any weight in the range · Has an italic, axis or style · Any width, narrow to wide · Shapes made for small and large sizes · Tabular figures, all one width · Oldstyle figures, which rise and fall · A slashed zero · Stylistic sets: other shapes · Single letters redrawn · Separate styles: Regular, Bold…* Every meaning is one or two lines.
- **No orphans**: a meaning's last word never stands alone on a line — it stays with its bracket, or, without one, with the word before it (`no_orphan()` in `app.js`, `.together` in the stylesheet).

## beta 4.35.11 (web version) · 14 Oct 2026

- **The legend's title**, in two lines: *Variable font axes and / OpenType abbreviations* (uppercase, as all the pixel font).

## beta 4.35.10 (web version) · 14 Oct 2026

- **The legend's window**: its title on one line, across both columns from the top left; the pixel font (title and stickers) at 12, half a size more than in the list; the meanings smaller, at 10, a size under the buttons' words (a new token, `--t-xxs`); a press anywhere outside it closes it (the sheet stays open; its own button still opens and closes it). The last item is still below the fold.

## beta 4.35.9 (web version) · 14 Oct 2026

- **The legend's window**: its meanings at the size of the buttons' words under it (11); a title over them in the pixel font, *OpenType abbreviations*; a bracket never breaks across two lines. The last two items are still below the fold.

## beta 4.35.8 (web version) · 14 Oct 2026

- **The legend's window**: twice the padding; in the open Legend button's grey; a hairline over every item, the first too, running unbroken across sticker and meaning; the meanings start on the third column's line (the Legend button's left edge), the stickers end before it; the full sentences back, in the tool's own size (13), the OpenType abbreviation at the end in light square brackets (*… here 100 to 900. [wght]*); the window grows upwards as far as the font list's top and scrolls past that (`legend_fit` in `app.js`). At this size about a third of it is below the fold.

## beta 4.35.7 (web version) · 14 Oct 2026

- **The font sheet's add buttons**: where the browser can read this computer's fonts (Chrome, Edge on a Mac), *Installed* comes first and the three ways to add a font share the first two columns equally, on one line, without their light second lines; the legend's button keeps the third column. Elsewhere (Safari, the iPad) there are two, each a column, as before.

## beta 4.35.6 (web version) · 14 Oct 2026

- **The legend's window** is two of the sheet's columns wide (from over *Add font file* to the right edge), its items one under the other with a hairline between; each meaning shortened to one line, so an item is two lines at most (meaning · OpenType name), and the window fits without scrolling.
- **Shadows**: the sheet's a little less blurred (6, was 7); the legend's lighter and closer (`--shadow-light`).
- **The font sheet** ends one row height above the bar (its top stays).

## beta 4.35.5 (web version) · 14 Oct 2026

- **The legend is a window**: open, it floats over the foot of the font list (the list keeps its height), with a light frame and the sheet's shadow; its items two to a row, a hairline between them; the stickers keep their size, the words are small (11) on as many lines as they need, set closer (1.2).
- **The Legend button** has a second line like its brothers: *(OpenType abbr.)*.

## beta 4.35.4 (web version) · 14 Oct 2026

- **The font sheet's legend**: on the sheet's three columns — each sticker ends on the first column's line, its meaning starts on the second (where the second button starts); the stickers at three quarters of their former size (12, R32's one exception); every meaning a sentence with a capital and a full stop, and under it, light, the OpenType name of what it reads (*wght axis*, *tnum*, *ss01 to ss20*…).
- **Buttons' second lines** a step lighter (`--wait`).
- **Font box**: as much room under the style buttons as before them.

## beta 4.35.3 (web version) · 14 Oct 2026

- **Font sheet**: the numerals are drawn 6.5 px (a unit and a hairline) to the left, every row alike, so they don't look inset: most fonts' first numeral now touches the name column's edge (within half a pixel; Michroma's 1 starts 2.6 further in, Routed Gothic's 1.5). Okay: "artificially push them left a bit, all at the same time, make many touch the red line."

## beta 4.35.2 (web version) · 14 Oct 2026

- **Font box of a window**: *As the numerals* is now **Copy style of *Numerals*** — the top numerals ring's name as it is written, in italic — beside a copy sign; a box with no fill (Okay: "Copy style of Numerals (case sensitive)… Box has no bg fill").

## beta 4.35.1 (web version) · 14 Oct 2026

On `dev` and on the live page. A small push: the second number after the point counts small pushes from now on (Okay, 14 Oct 2026), so the iPad shows which one it has.

- **Font sheet**: a line is three columns of one width — name · numerals · stickers (Okay's "X as in X = 10"); the stickers a little tighter, so every row of the tool's own list takes two lines at most; the frame's line light grey; the buttons stand on the same three columns, their words on two lines, the second light (*Add font link* / *(gfonts, url)*).
- **Font box**: *OpenType features* says how many there are; *As the numerals* is a box with a copy sign, quiet until the pointer is on it.
- Also since 4.35's first push, the same night: the font sheet redrawn (short stickers, Find with a magnifier, a drawn scrollbar, the legend opening upwards), the preview's ellipsis, the moon tile, the grey preview cell, the hand box seven rows high.

## beta 4.35 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only; the look-check (`web/test/same.mjs`) proves the first step against 4.34.

- **Stylesheet ordered, the look kept** (`web/src/css/`, one file per layer and part; R32 rewritten): a *chosen* layer (what is on, picked or open is ink with paper words, one rule), the repeats merged (pane headings, small menus, the preview's switches, rules said twice), two unused tokens gone, dated citations out of the comments. Proof: `node test/same.mjs` — the computed style of every element in 447 states, three screens, the pointer on each kind of control — found one difference against 4.34, a fix (the open language button under the pointer was ink on ink).
- **Fixes**: tabs cut their own top corners (`.tab`), so the V over a joint is a clean V and the chosen tab's line wins at its edges (no paper chip on the black tab, no grey sliver); `--faint` was two tokens, the rename box is grey again (`--wait`); a slider's track shows in the white font box (build list #128: it was white on white); a row's field for words is one height with the other fields.
- **The font box stands on the pane's columns** (build list #125): a ring row's frame (from the labels' start to 8 past the lines); Lang. and the sliders on the controls' column, fields and steppers on the third and fourth tile, Change… ending on the line; labels take what is left. The numerals and letters in a thick light frame one unit inside the box (Okay's sketch). A number's row everywhere lays its tracks out in full (`--num-columns`) — no negative margins for the field and stepper any more (`--tile-wider` is gone).
- **Values on the scale**: every space is a step of the unit (`--u1` … `--u8`), every measure has a name, lines are `--hair` · `--thick` · `--triple`, pure white and black are `--white` · `--black`; hex is short where it is the same colour. Things moved by a pixel or two.
- **Okay's notes of the evening**, the small ones built: the language button says *Lang.* (TR, DE… when chosen); the :30s stand together in a window's Position (1:30 4:30 / 7:30 10:30, then 4); the moon tile's crescent in a circle like its brothers; the scale button's centres joined by a dark line like the radius', a point to the right, the whole drawing lit when pressed; the squares for adding a font say what they take (*Add font link (gfonts, url)* · *Add font file (woff, ttf, otf)*), no heading over them; the font sheet's list has a slim two-pill scrollbar (webkit only; unseen here, Playwright hides scrollbars); the pixel font and *As the numerals* at 70 %. The larger ones are build list #134–#151.
- **The font sheet, later the same night** (Okay: "Do these yes"): it starts under the panel's title line; Find is a field with a magnifier; the stickers' words are short (*w. 100–900*, *tab*, *2 ss*… — *bold* and *italic* whole) and start under the Find field's left edge, one line where they fit, never three; the list has a scrollbar the tool draws (iPad Safari shows none of a page's own styling); the squares are short, a sign beside two lines of words, the legend's button last; the legend is one large column that opens upwards over the squares. The font box: the preview reads *1234567890 Abcdefg…* (three full stops in a font without an ellipsis, `has_chars` in `geometry.js`); *As the numerals* is words only, framed under the pointer.
- **Three more notes, just before midnight**: the moon tile's crescent reaches its circle, as the am · pm tile's dark half reaches its frame; the font box's preview cell is filled with the ground's grey; a hand's detail box is seven rows high and stays so when the shapes open, the closed line shows three shapes and *more*, the SVG tile waits at the end of the opened list (#139).
- **Tests**: `web/test/same.mjs` (the look-check; `save` keeps the look in `web/test/same.json`, not in the repo). The window test reads the new tab shape and the new words.

## beta 4.34 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Windows, position**: a square of the quarters · a white bar · the places between · three dots that open a field for any time (new key `at_deg`).
- **Font box**: the preview reads 1234567890 Abcdefg.

## beta 4.33 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font box**: letters after the numerals; LAN right after the name; Size above Tracking; axes without a heading; axes and features in the tool's type with their codes as small stickers; features as tiles again, the ones for numerals first.
- **Fields for words** on their label's line, larger, darker. **A window's position**: nine buttons in the clock's order.

## beta 4.32 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font box**: no "· as the numerals" after the name; **LAN** at the right end of the styles' line (on the name's line when a family has one style); OpenType features folded to begin with.

## beta 4.31 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Stickers**: also for what a font does to numerals (tabular · oldstyle · zero · fractions) and its counted sets and variants; paler colours, from the guides'.
- **Font box**: axes and features as stickers twice the size, grey; a font without switches says so on one grey line.

## beta 4.30 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font box**: Variable axes and OpenType features are parts of it, each can be put away; the two Rings panes are gone.
- **Windows**: the font box has them too (new key `features`; `axes` now has sliders).

## beta 4.29 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Stickers**: a colour for each kind, round corners, the weight's range on it, one line where the column lets them; a legend at the sheet's bottom right.
- **Numerals in the sheet**: cut at their column's edge, never above.
- **Variable axes**: an axis is named by its sticker, a button that sets it back.

## beta 4.28 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font sheet**: left edge on the third column; shadow blur 7.
- **Font box**: the name's whole line opens the sheet; the language button says *lan* when none is chosen; the colour stands in the ring list's colour column.
- **Hands**: the detail box has no ground.

## beta 4.27 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font sheet**: as high as the panel, down to the bar; hard shadow; Find a font at the top right, not active until pressed; stickers in Silkscreen (bold for bold · weight · italic) in words; long names and wide numerals are drawn smaller to fit; the link field shows when *Add link* is pressed.

## beta 4.26 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Font sheet**: name in its own face · numerals · what the family has; full lines between; floats over the panel with a shadow; no Done button; larger Add fonts with square buttons.
- **Windows**: Tracking and a language in the font box (new keys `tracking`, `lang`; unset = the numerals').

## beta 4.25 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Hands**: one pane per hand — the hand itself in a box at the left (its centre marked), its shapes, numbers and colour beside it; shapes on one line that opens; a dashed *SVG* tile for later. On a phone the box lies over the rows.
- **Number box** in those rows: tiny plus over minus; a press on the number grows it over the slider with a large minus and plus.
- **Fields and steppers** elsewhere line up with the tiles' edges.
- **Text colour**: a small swatch beside the font's name (windows, numerals).
- **Top line**: title, unit box, undo and Guides centred on one line.

## beta 4.24 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **On the preview**: three states — faint (can be pressed), fainter (can't), and on (Guides: its word whole, its line faint).
- **Windows**: Colours before Shape.

## beta 4.23 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Hands**: under the *Shape* label a box shows the chosen hand in detail, as it is now.

## beta 4.22 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Windows**: Position · Radius · Width · Height stand right under *Show this window*; the *Place and size* pane is gone.

## beta 4.21 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Picture tiles** stand one unit (5.5) apart and from the row's lines; a tile's word is one line (*moon*, *auto-flip*).
- **Switches on the preview** stay faint after a tap on a touch screen.

## beta 4.20 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **On the preview**: undo · redo · Guides · Backdrop are faint (opacity 0.35) until pointed at or open.
- **Font box**: Tracking is its fourth line; the font's name is bold.
- **Tabs**: smaller notches (5.5 deep), drawn cleanly; the window tabs are pinned, margin to margin.
- **Picture tiles**: pictures 1.35 × larger, equal space around the tiles; simpler pictures for what a window shows.

## beta 4.19 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Windows**: the *Print* pane is gone; *Frame* and *Clearance* are in *Shape*.
- **Export**: *For production* is named *Print*.
- Half line also when a hidden row lies between a row and its nested row.

## beta 4.18 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **10:10** stands on the preview, over the bar (not on a phone).
- **Scale drawing** inside its button; colour · size · radius evenly spaced, in the drawer and the list.
- **Tabs**: sharp V notches, square ends.
- **Undo · redo** on the preview's top left.
- **Font box**: white, hairlines between its three lines, quiet buttons. **Language**: a two-letter button in it that opens a list; the Language row is gone.

## beta 4.17 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Half lines**: before a nested row (a question about the row above, its tied settings, a note under it) the hairline starts at the controls' column. Token `--nest-from`.
- **Dial section**: Dial and Page are pinned, in that order; Colours scrolls under them.

## beta 4.16 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **A font in three lines**: numerals (whole, no longer cut by the name) · name with *Change…* at the right · styles. Spaces from tokens (`--unit`, `--line`, new `--btn-pad`).

## beta 4.15 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Colour pill**: swatch as high as the hex (12); one unit (5.5) everywhere in and around it, up to the row's lines; 23 high, also under a finger (was 28 there).
- **Notes** (the grey lines of words under a row): one unit over and under the words, a hairline under the note.

## beta 4.14 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Export, PNG**: no *dpi* label on the dpi row; its slider and the size note under it start on the buttons' column (PDF · SVG · PNG).

## beta 4.13 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Export**: *Export a file* is pinned: Vector · PDF | SVG and its tick (no line between them) | Image · PNG and its dpi. Below: For production · Link to this dial · Settings file · Log · Gallery. A row can be *tied* to the one above (no line between).
- **Gallery** holds the five examples too (eleven dials); the Examples pane is gone.
- **Tabs**: hand tabs and window cards touch, stand on the pane's thick line, round top corners; window cards fill the columns; taller.

## beta 4.12 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Guides per ring**: a ring's edges in the ring's own guide colour (new ring key `guide`); a mixed order of colours to start with; the selected ring's row and drawer tinted with it. Guides list: the dial's three kinds · *Rings: All · Selected · None* and a line per ring · *Add: Line · Crosshair · Circle* (new key `gd_more`), each added guide with its angle or radius, colours and a cross.
- **Value pop-up = the tag, grown**: same box, same width (132), the height grows on a click. The tag of a round button says name and value.
- **Scale drawing** from Okay's `Asset_1.svg`; the column before the size button is 8 wider for its small circle.
- **Kind buttons** fill the name's and kind's columns. **No colour square on the selected row.**
- **Window cards**: pictures only, from the second column; the switches are gone; *Show this window* is back on the heading line.

## beta 4.11 (web version) · 13 Oct 2026

On `dev` and on the live page. Seen in Chromium here only.

- **Ring drawer**: the name of the box under the selected ring's row (was "ring line").
- **A ring's row** reads name · kind with how many (`60 ticks`) · a small square of its colour · size · radius. The list and the drawer share columns, so a row's colour, size and radius stand over the drawer's buttons for them. Numbers: mono face, 11, quiet.
- **Round buttons carry no number**; their tag says name and value ("Outer radius 15").
- **Rings panes**: Shape comes first, with the Ends rows inside it; then Positions and Give way.

## beta 4.10 (web version) · 13 Oct 2026

On `dev` and on the live page. Okay's marked-up picture of the Rings pane. Seen in Chromium here only.

- **Rename**: the box stands right beside the name; it goes when the row is too full; a click on the selected ring's name renames it.
- **Ring line's frame**: inside the outer line a second one, 3 thick, in the selected row's ground; 8 of room inside (was 5).
- **Value pop-up**: a small square (132 wide) hung on the button's bottom right corner: name (and the anchor menu) · field · − +.
- **Pictures**: round buttons have the square buttons' outline; ticks, markers, numerals and band pictures weigh about the same.
- **Silkscreen** (SIL OFL, `web/fonts/ui/`) is packed into the page for the tool's tiny numbers, at 8: the values in the round buttons and 12 · 3 · 6 · 9 in the numerals picture. R32 amended.

## beta 4.9 (web version) · 13 Oct 2026

On `dev` and on the live page. Okay's designed picture of the ring line. Seen in Chromium here only.

- **The ring line stands in the list**, right under the selected ring's row (2 apart) and moves with the selection; framed in the guide's colour on white. Its buttons start where the names start. **One height for every control** (36): kinds 46 wide · colour · size · radius.
- **Size button's drawing**: a small circle against the large one, the value in the middle. The drag arrow is gone; both round buttons are still dragged themselves.
- **The tag** is one floating label for the whole tool (a scrolling list can't cut it off); it hides while a pop-up is open. The value pop-up hangs under the ring line on the list's frame.
- The list shows five rings and the ring line before it scrolls.

## beta 4.8 (web version) · 13 Oct 2026

On `dev` and on the live page. Okay's third drawing of the ring line, and the Windows section. Seen in Chromium here only.

- **Ring line**: one framed line as wide as the ring rows, all buttons — four kinds · colour · **size** (new: a mark's length, a dot's Ø, a numeral's size or a band's width, as a value button) · radius · a double arrow that drags the radius. No name in it. Frame in the selected ring's guide colour, on white. A **tag** under a wordless button says what it is while the pointer is on it.
- **Undo · Redo** as two outlined buttons on the preview's top right, before the Guides switch; pale when there is no step that way.
- **Windows**: *Show this window* is gone (the card's switch does it). New pane **Shape**: rectangle · circle · polygon (Sides) · arch · arc, Corner, *Turn it with its radius* and *Turn the text with it*; position **4** added. A window's **own font** (font sheet; *As the numerals* takes it back). Pane **Colours**: text or picture · disc under it · frame.
- New keys, all drawing as before at their start (R31): windows `shape`, `sides`, `turn`, `text_turn`, `family`, `ps`, `axes`, `text_c`, `disc_c` (window 1: `da_…`); list `WINDOW_SHAPES` (R9).

## beta 4.7 (web version) · 13 Oct 2026

On `dev`. After Okay's review of the research atlas and two drawings of the Rings panel. Seen in Chromium here only.

- **Rings pane, heading line**: the list's tools stand on it — a plus in an outlined circle opens Ticks · Markers · Numerals · Band as a small menu; move up · move down · duplicate · delete beside it, the same circle. The line under the list is gone.
- **Ring line**: the selected ring in one line — its name · four kind buttons with pictures only (34, pictures 24) · its colour as a swatch · its radius as a **value button**.
- **Value button** (R15's exception): a circle with a radius drawn in it and the value on the line. A click pops up the number's row under it, ready to type in (for numerals with the Baseline · Ascender · Centre menu); pressing and moving changes the value; a press outside, Enter or Escape closes the pop-up.
- **A colour in a line of words is a tiny swatch without hex** (a folded pane's summary).
- **Undo**: ⌘Z back, ⇧⌘Z or ⌘Y forward (Ctrl on Windows); one drag is one step; loading a file, Defaults or a Gallery dial is a step; 200 steps.
- **am · pm follows the time shown.** The time runs over 24 hours; **AM · PM** is a small word in the time's box; "15:20" and "3:20 pm" can be typed; Now takes the real hour. The window's *Hour of the day* row is gone (its key stays, unread). An am · pm window is drawn again every six minutes of the time shown.
- **Card switch**: a small clock on each window card shows or hides that window.
- **Numbers that start again**: *Start again after* (ring key `num_again`, 0 = never; R31).
- **Gallery**: the last pane of Export, six dials, three to a line (`web/gallery.mjs` → `src/gallery.js`): B-Uhr type B · 12 + 24 hours · Elapsed time · Montgomery · World time · Diver with its bezel as rings.
- Tests: `test/labels.mjs` (new, in `npm test`); the window test covers all of the above.

Earlier the same day, replaced by the above where they differ (the Add group under the list, the kind tiles and radius row):

- **Rings: one pinned pane** (Okay's drawing, build list #94). The list, then the selected ring by its name where "Kind" stood, before the kind tiles; colour; radius. The second heading is gone. Folded, the pane is one line: "Rings: Numerals   numerals · #141414 · centre radius 10.00" (382 → 43 high in the test window).
- **Ring rows start where the labels start**; a ring's eye is inside its row. **Add + · Ticks · Markers · Numerals · Band** is one outlined group with round ends; **↑ ↓ duplicate delete** are outlined circles. **Kind pictures** show the whole circle (30 square; the other pictures stay 28 × 20).
- **The selected ring's row is tinted with the selected ring's guide colour** (22 % of it in the ground, 65 % in the frame); light blue as before when that guide is None. Claude's reading of "GUIDE COLOR" on the drawing; not confirmed.
- **Radius anchor for numerals** (build list #95): new ring key `anchor` (0 centre, as before · 1 baseline · 2 ascender; R31, R9). A small boxed arrow beside the label opens Baseline · Ascender · Centre; the label reads Baseline radius, and so on. Outlines, on-path letters and live text all use it. Parity with `dial.py` unchanged at centre.
- **Ring list rows carry a summary** (build list #78, atlas 4.1): before a ring's kind, `how many × how big · r radius` — the positions it draws, one mark's length (a dot's Ø, a numeral's size, a band's width), its radius, in the unit box's unit. The summary follows every change without the list being rebuilt. The list owns the columns and each row borrows them (CSS subgrid), so summaries end and kinds start on one line. Rows stay one line high.

## beta 4.6 (web version) · 12 Oct 2026

On `dev`. Step 2 of the Dial tab (Okay: "Go on with 2"). Seen in Chromium here only.

- **Scale everything on the dial with it**: a tick under Diameter, off to start (`ui_scale`, the window's state: not in a link). On, a change of diameter multiplies every measure in mm — rings (radius, length, width, band width, clearance, round ends, wall, numeral size, 12 o'clock gap, a numeral's radius nudge), hands (length, width, tail, tip, head, counterweight, wall, round), windows (radius, width, height, round, frame, clearance), cap. Not angles, counts, percentages, the page margin. The measures are worked out from where a run of diameter changes began (`scale_with`, `G.measures`), so 30 → 36 → 22 → 30 lands exactly on the first values; editing anything else starts a new run.
- **A colour per sector of a band**: new ring key `cs` (position → RGBA; empty = all in the ring's colour, so earlier links draw as before, R31). A band with sector colours is drawn, and exported, as one shape per colour ("Band colour 1", "Band colour 2"); the print mask stays one shape. Rings → **Sector colours** (a band with more than one sector): a swatch per sector, and **All as the ring**.
- **Dial → Colours**: every coloured part in one list — rings top first (a band's sectors one by one), hour · minute · seconds hand, cap, the windows that are on. Each swatch opens the colour pop-out. Plate and backdrop keep their own rows.
- **The pop-out's binding** is now read · write · label, not scope and key, so list swatches can use it. Opened from a list it stands at the right of the whole row of swatches, so the neighbours stay in reach. *On this dial* includes sector colours.

**Later the same day** (Okay, on the live page: "Guides borders need work… I love this color selector…"; asked which selector, he chose "the example's look, our parts")
- **The colour pop-out is near black** (`#141413`) **with round corners**, after a selector Okay showed: a rounded field, pill handles on the strips, larger rounded chips (26; 34 for a finger), a small swatch before the values. Its parts are unchanged (two rows of colours, RGB · CMYK · HEX, COPY, widen, drag); changes still apply at once, there is no Cancel / Apply.
- **Opacity, rings only**: a third strip and a % field, shown for a ring's colour and a band's sector colours. It is the colour's fourth number, which preview, SVG and PDF already drew.
- **A colour in the panel is a pill**: a small swatch (it opens the pop-out) and the hex, which can be typed. In Dial → Colours a part with one colour is a pill too; a band's sectors stay squares. A swatch shows a see-through colour over a checkerboard.
- **The Guides switch's line** is a hairline (1, was 1.5). Off, it has no gaps: dashes as light as its word over a second, quieter tone; the inside is filled with the backdrop's colour (`--canvas`).
- **The guides' list is near black and round** too (stylesheet class `.night`, shared with the pop-out), after a list Okay drew on: a line per kind — its name, then round choices with room between them: **None** (a struck circle) and the eight colours. The chosen one stands in a thick ring of its own colour. None replaces the eye; pressing a colour shows that kind again. A hairline under every line.
- **Smaller, with more room inside** (Okay, on the live page): the guides' dots are 13 with 9 between (18 / 11 for a finger; were 16 / 13 and 22 / 15), its lines 42 high, its edge space 16; Thickness sits on the list's own columns. The colour pop-out's chips are 22 (28 for a finger; were 26 / 34), its field 140 high (180), its edge space 16 and 12 between its blocks: 388 wide (was 422).
- **A press outside** the colour pop-out or the guides' list **puts it away** (`pressed`). So a click on the preview no longer keeps the pop-out open and retargets it; a press on another swatch still moves it there.
- **Guides switch, off**: sign, word, arrow and dashes are one colour (the sign was dimmer, the arrow filled when open).
- **From Okay's notes on a screenshot**: the pop-out's square makes it **twice the size** (twice as wide; the field takes the added height; never larger than the window; it can still be dragged) instead of covering the preview. **Chips stand 12 apart** (three times the 4 of before) and share the row's width, eleven to a row, so they shrink to fit (about 15 square; 21 for a finger) and grow with the pop-out; its width is a token (`--pop-width`: 388; 454). **The hex in a colour pill opens the pop-out too**; under a finger it is read-only there (the pop-out has its own HEX field), with a mouse it can still be typed in. Guides' dots: 10 with 10 between (14 / 13 for a finger).
- **Windows: four cards on top, 12 · 3 · 6 · 9** (`window_cards`), the size of the example cards: each a small dial with its window drawn where it is — filled when shown, an outline when not. They are the tabs of the section: a press chooses the window the panes below are about (the 1 · 2 · 3 · 4 picker is gone). The first pane's heading says *Window at 3* and carries *Show this window*; what it shows is in that pane (the *What it shows* pane is gone). Position stays on *Place and size*'s heading: a window can still go to 4:30 and the like, and its card then says so. Which window is which card: the date window of old (`da_…`, starts at 3) is the second card; `windows[0]`, `[1]`, `[2]` are 12, 6 and 9. A window never used takes its card's place when its card is first pressed; settings and links are unchanged (R31).
- **From Okay's notes on the Hands screenshot**: *swap* — All hands is the first pinned line, the hand tabs the second, right above the hand's panes. *move up* — Show this hand is on the hand's heading line (`head`). *same gap, bigger* — a colour pill has one space, 8, three times: before the swatch, between swatch and hex, after the hex (`--pill-gap`; was 4 · 6 · 8).
- **Guides and Backdrop switches are outlines, never filled** (Okay: "Background button must be outline all times, never fill. As does the guides section. Make these visible but not the first thing that pops up"). A hairline and plain words in one colour: black or white, whichever has more contrast with the backdrop (`main.dark`, from the backdrop's relative luminance) — one of the two is always 4.5 : 1 or better, so they are not lost on any colour. Guides on: a bold word. Off: a plain word and its sign struck through. Under the pointer the line doubles; no fill. This replaces the filled switches of an hour earlier. Checked on six backdrops (grey, near white, near black, purple, lume green, red).
- **Hands: Hour · Minute · Seconds are tabs** — the first pinned line, across the six columns (`hand_tabs`); the panes under them are about the chosen hand, and the first pane's heading says which (*Hour hand* …). All hands is the second pinned line. Cap, which belongs to all three, moved after the hand's own panes. The picker is no longer on the One hand heading.
- **A pane's main selector stands on its heading line** (row option `head`), on the four control columns, with no name of its own — the heading names it; it shows and works when the pane is folded too. Okay drew it for Numerals → Labels ("This is a simplification. Others possible? Main selector top"); also done for One hand → Hour · Minute · Seconds, Window → 1 · 2 · 3 · 4, Place and size → Position. *Show this hand* and *Show this window* are nested questions now (controls' column).
- **Backdrop switch** at the preview's bottom left: built like the Guides switch when on, always solid-lined, with the backdrop's colour as a chip; a press opens the colour pop-out for the backdrop. The Backdrop row in Dial → Page stays.
- **The colour pill is one small button** (Okay: "Selected state too aggressive… Just black bg to the swatch pill. Overall smaller and monospace hex value. No editing through button anywhere, mobile/desktop. Hover some middle value. All sleek"): 22 high (28 for a finger), a 14 swatch (18), the hex in 12 monospace. At rest quiet, a middle grey under the pointer, black while its pop-out is open; no outlines. The hex is no longer a field on any device: a colour's value is typed in the pop-out's HEX field. Rows and the Colours list share one builder (`colour_pill`).
- **The Guides switch carries its own ground** (Okay: "We lose guides on some colors. Abort dashed, ensure contrast at all times, simply" — it vanished on a mid-grey backdrop). On: light with dark words. Off: near black with quiet words. A solid mid-tone hairline. No dashes, nothing follows the backdrop any more (`main.dark`, `--canvas` and the `--on-canvas` tokens are gone). Checked on grey, near-white and near-black backdrops.
- **A nested question starts on the controls' column**: a tick that asks about the row above it (row option `nest`) — *Scale everything with it* (shortened to fit), *Skip those instead*, *Keep numerals as text in the SVG*. A tick that stands for itself still starts at the left.
- **All hands is one line, always in view** (row option `bar`: a line of its own, outside the panes, pinned): its name · Show hands · the Motion menu, on the columns 2 · 2 · 2. The menu has no word beside it; its title says what it is.
- **Reach** (stylesheet, controls layer): under a finger a small control is pressed from a little outside its edge too, up to half-way to its neighbour — an unseen frame, nothing for a mouse, nothing changes to the eye. Listed in one rule: a guide's colour (the whole height of its line), a colour in the pop-out, a band's sector, signs (under the ring list, the pop-out's square and cross), the rename box, − and +. A new small control goes into that list.
- **The unit box is quiet**: its word like the version beside the title (grey, regular), its line a grey hairline like the header's.
- **Units**: a box at the panel's top right, one column wide, saying the unit by its short name (`mm` · `pt` · `in` · `lig`); its menu lists Millimetres · Points · Inches · Lignes. It changes only what the window shows and takes: every length field (rings, hands, windows, diameter, page margin, cap, a numeral's radius nudge), a folded pane's summary, the status line and the PNG size. Settings, links and files stay in mm (R1); `ui_unit` is the window's state. Inches show two more decimals, lignes one. Sliders and steppers still move in the row's mm step. Lignes (2.2558 mm, the unit of movement sizes) is Claude's answer to Okay's "???" — not yet confirmed.
- Round corners are for colour things only (stylesheet tokens `--round-large`, `--round`, `--round-small`).

## beta 4.5 (web version) · 12 Oct 2026

On `dev`. Okay's usability review, one tab at a time; this is the Dial tab, step 1 of 3. Seen in Chromium here only. `dial.py` is frozen from now on (Okay: "Do not work on dial.py anymore, we're on github").

**The Dial tab, regrouped**
- **Two panes: Dial** (Diameter · Plate · Background) **and Page** (Page margin · Backdrop). Before: Size · Colour · Guides.
- **Background is a button only** ("Add image…"); pressing it says "Not built yet." Okay: "No background image functionality now. Just the button."
- **A hairline before and after every row**, everywhere: white on the scrolling grey, that grey (`#E8E8E6`) on paper and white. Tokens `--line-on-grey`, `--line-on-paper`, `--row-rule`.

**Guides, on the preview**
- **The switch stands at the preview's top right**, 12 from its edges, out of the panel's header. Its colour follows the backdrop: dark on light, light on dark (`main.dark`, set when the backdrop's luminance is under 0.45).
- **An arrow joined to it drops the list**: five kinds — dial edge, centre lines, window radii, ring edges, selected ring — each with an eye and one of **eight colours** (`GUIDE_COLOURS`: six neons, `#111111`, `#FFFFFF`). No free colour. One Thickness; the selected ring's lines are 1.5× it. **Reset** puts the guides back.
- **Settings**: new keys `gd_win`, `gd_sel` (eyes) and `gd_k_edge`, `gd_k_axes`, `gd_k_win`, `gd_k_rings`, `gd_k_sel` (a place in the eight, R9). Guides are drawn at full strength. `gd_c`, `gd_strength`, `gd_sel_c`, `gd_sel_strength`, `gd_sel_w` stay in `DEFAULTS` (R8, R31) and are read by nothing. Window radii had no eye of their own before (they followed the dial edge's).

**Colour: one pop-out for the whole tool**
- **A swatch opens it 12 to its right**; it is not built inside each row any more. It edits a scope and a key, so with a ring's colour open, clicking another ring on the preview shows that ring's colour. Changing section closes it. Escape, its ×, or the swatch again close it.
- **Top to bottom**: *On this dial* · *Palette* (ten to start; **+** adds the colour in hand, and reads **−** to take it out when it is already there; kept by the browser under `dial-tool-palette`, not by the dial or its link) · the field of one hue (168 high; 220 for a finger) and the hue strip (24; 36) with larger handles · one line: `RGB` `CMYK` `HEX`, the values, `COPY`, small boxed capitals. COPY copies what the line shows.
- **Its head drags it. The square widens it** over the whole preview (the field takes the room) and back to where it was. On a phone it is a sheet from the bottom.
- The palette's ten: `#111111 #FFFFFF #EDE8DB #A7A7AA #3A3A3C #0E2A47 #12372A #7A1F1F #C8E6A0 #E8742A` — Claude's choice, offered to Okay, not yet confirmed. The 22 "dial colours" of beta 4.4 are gone.

**Not in this step** (build list #70–#72): scale the contents with the diameter; a colour per sector of a band; a logo (an SVG placed with the mouse, kept as a ring).

## beta 4.4 (web version) · 12 Oct 2026

On `dev`. A code review of the web version, asked for by Okay, 12 Oct ("Code review time. All on the table"), then his go for four steps plus two additions: "redesign sliders like this" (a sketch: a thick black disc on the track) and "Bg color created clashes, look around." Seen in Chromium here only. `dial.py` is unchanged.

**Nothing jumps**
- **A click on the preview keeps the panel.** It used to build every row again, even when its section was already showing: the scroll went back to the top and an open colour picker closed. Now the rows stay and only show the new values.
- **Each section remembers its scroll**, and pressing the tab that is showing does nothing.
- **Panes slide** shut and open (140 ms), so what is under them travels instead of jumping; what is under moves by exactly the pane's height. Off when the system asks for less motion.
- **The Guides switch keeps its width** on and off (it was 89 / 87.9: its word changed weight).

**The stylesheet, rebuilt** (`web/src/style.css`; rule R32)
- **Seven layers** — tokens · base · controls · panel · preview · bar · narrow. A later layer wins whatever the selectors look like, so no part undoes another. There was no `!important` before and there is none now.
- **Tokens:** every colour, size and measure has one name. Before: 224 pixel values, 26px written eight times, `#fff` twenty times.
- **Buttons by kind.** A plain `button` is only its words; a class says what it is (`btn`, `btn main`, `plain`, `sign`, steps, segments, tiles). Before, one look was given to every button and undone in 22 places.
- **Panes are real elements**, and the toggle column is a real column: a pane's body is a grid of seven tracks (the eye's, then the six). The three places that broke out of the panel's padding with negative margins are gone, and so is the air between panes that was worked out in `sync_rows`.
- **Type: four sizes** — 11 · 12 · 13 · 15 (were eight: 10 · 10.5 · 11 · 12 · 12.5 · 13 · 15 · 20). Pane headings are 13 semibold (were 12.5).

**Sliders and grounds**
- **Sliders** after Okay's sketch: a 4-point track, ink up to the handle, and the handle an 18-point black disc with a light centre (26 on a touch screen). The day slider in the bar stays a ruler.
- **Tick boxes** are square, like every other control (ink when ticked); the browser's own were rounded on iPad.
- **On the scrolling grey** (`#E8E8E6`) several things had almost its colour (`#ECECE8`) and melted into it: the example cards, the link, the log, the hex line, a tile under the pointer. A part now knows what it stands on: on the grey these are paper-light; on paper they are grey as before. Buttons are white like the fields (were paper), one hover grey everywhere.
- **Phone:** picture tiles stand under their label on all six columns, so their words fit at the same size as elsewhere.

**Files**
- **PDF: every part is a layer with its name** — plate, each ring by its name, each hand, each window part — listed top first. PDF 1.5 (was 1.4). *Not yet opened in Illustrator: build list #67.*
- **A production mask's PDF is in grey ink** (`0 g`), not RGB black, so nothing can turn it into a four-colour black.
- **PNG: its dpi is written in the file**, so a 600 dpi picture opens at true size in Photoshop or InDesign (was 72). A mask's PNG is black on white (was on nothing). Asking for more pixels than a browser can draw says so instead of saving an empty file.
- **SVG:** shapes are named after what they are (`plate`, `minute-ticks`, `hour-hand`; were `plate-7`, `Markers-9`), colours are hex, a title says what the file is.
- **File names say what they are:** `dial-30mm-2026-10-12.pdf`, `dial-30mm-mask-mirrored-2026-10-12.pdf` (were always `dial.pdf`). Okay was asked whether he would rather name dials himself; no answer yet (build list #68).

**Small**
- Switching between windows 1–4 no longer rebuilds the geometry (`ui_window` was missing from `NOT_GEOMETRY`).
- Load… and Defaults close the tool they replace (its observers and its pending save), instead of leaving it running.
- **Tests:** 137 checks (were 126).

**Found, not done** (Okay's go covered steps 1–4): `app.js` is one class of 1,800 lines; a dial with 300 ticks and knock-outs takes about 90 ms a slider step here, more on the Intel Mac (#14); in Rings the pinned part leaves 300 of 900 points to scroll (#65); `main` has no `web/` although the tool is online.

## beta 4.3 (web version) · 12 Oct 2026

On `dev` and online. Okay, 12 Oct, with a marked-up screenshot of the ring list ("frame layers", "light blue"): "Yet darker bottom bar, 80% black. Invert appropriate". Seen in Chromium here only.

- **Bar: 80 % black** (`#333333`), light on dark: words `#F2F2EE`; under the panel the quiet controls are thin light outlines, the chosen speed a lighter fill; the day slider is light, its steps light grey, the step the time is on white and bold, 10:10 a light pill; − + and Fit are dark-grey buttons with light signs. (The bar so far: black → `#DADAD5` → `#A9A9A4` → this.)
- **Ring list: every ring is a framed row** — a hairline frame with slightly rounded corners (5), white inside, 4 apart, 8 wider than the pane lines on each side so the eye has room inside the frame.
- **Selected is light blue** `#CFE4F5` with a blue frame `#86B4DA` (was the canon's yellow `#F0DC8E`). The same colour marks the chosen font in the font sheet and an example under the pointer: one colour for "selected" everywhere. `docs/design.md` (the guide's canon) still says yellow; it describes the guidebook, not this panel.
- **Guides switch:** tight at the sides, as wide as its sign and word (about 93; was two columns, 120); it still ends on the right margin. Okay: "tighter guides button from the sides".
- **Dial tab:** eight pies (were four); chosen, every other pie is filled. Okay: "dial icon double the pies".
- **The part that scrolls is darker:** `#E8E8E6` under the rows that scroll, 8 % darker than the paper `#FCFCFA` of the header, tabs and pinned rows. Okay: "scrollable area gets a smidge darker bg" (first 3 %, `#F5F5F2`), then "from 3 % dark to 8".
- **Day slider is a ruler** (Okay's marked-up screenshot: "no need to fill in the past there, divide the horizontal stretch more. Lines crossing instead of dots. Fill more as screen grows"): a line with cuts crossing it and a white line for a handle; nothing is filled in behind the handle. Each hour is cut as finely as its width allows — halves, quarters, ten or five minutes, cuts at least 7 apart — so a wider window shows more. A click snaps to the nearest cut shown, or to 10:10; a drag stays free. Hour names and the 10:10 pill stay under it.
- **Tests:** 126 checks.

## beta 4.2 (web version) · 11 Oct 2026

On `dev` and online. Okay, 11 Oct: "That bar color went too light. Darker. Under left column have the controls. Day slider has steps that clicking snaps to. 10:10 is a special one. Nice column fitting controls, low contrast under left column. Leftmost of left column, lines extend on top of eyes. Arrange paddings and fit header nicely. Layers: cursor icon much lighter and thinner strokes." Seen in Chromium here only.

- **Bar: a middle grey** `#A9A9A4` (black `#111111` → `#DADAD5` in 4.1, "too light" → this).
- **Time controls are under the panel, on its columns:** the panel's square in the toggle column, then Play 1 · speeds 2 · time 2 · Now 1 — exactly the six columns. Low contrast there: no fills, thin darker lines; the chosen speed is a shade darker.
- **Day slider** under the preview, with **steps**: the twelve hours and **10:10** (a black pill; the pose watches are shown in). A click on a step goes exactly there. A click on the slider itself (not a drag) goes to the nearest step; a drag stays free. The step the time is on shows bold.
- **View** at the right: − + · Fit. The status line (selected ring · font · Ø · build time) moved here and only shows on windows wider than 1500.
- **Margins and lines.** The panel has one side margin, 24, left and right. Every line — a pane's thick line, the header's hairline, the tabs' — runs from margin to margin, so it passes over the eyes; the eyes stand 2 right of the margin (Okay, minutes later: "eyes closer to the right 2-3 px"; `--nudge`). Toggle column = an eye (16) + a gap (12). Panel 460 wide: 24 + 16 + 12 + 384 + 24.
- **Header:** 64 high, title and Guides switch centred on one line, a hairline under it, then the tabs.
- **Rename box:** grey `#8E8E89` (was black), strokes 0.7 (were 1.2); black when the pointer is on it.
- **Fixed on the way:** the panel's 1-pixel right border was taking its pixel from the columns; it has its own now.
- **Guides switch, again** (Okay: "don't say on or off, active is solid outline dark color, off stays the same"): on is a solid dark outline with a dark sign and word, no fill; off is the dashed grey box as before; the words on / off are gone.
- **Tests:** 121 checks.

## beta 4.1 (web version) · 11 Oct 2026

On `dev` and online. Okay, 11 Oct, after beta 4.0: "Bottom (and top) black bar. Lighter gray, better organization, better usability. Add a fast time option. Make a better guides toggler. Icon bullseye with lines, rounded corners, on/off distinct", then "Columns? They fit 'em". Seen in Chromium here only.

- **The bar is light grey** (`#DADAD5`, was black `#111111`), with a hairline where it meets the preview, white controls and a black Play.
- **Three parts, split by hairlines:** what is selected (with the square that puts the panel away) · **time**: Play / Pause, speed, the time, the slider, Now · **view**: − and + (zoom by 1.4 about the middle; new), Fit.
- **Fast time:** 1× (real time) · 60× (a minute every second) · 720× (twelve hours in a minute). It is the window's state, not the dial's: not saved, not in a link.
- **The bar keeps the panel's columns:** under the panel the square stands in the toggle column and the status runs over the six columns; beside it Play, Now, − +, Fit are one column wide (54), the speeds and the time two (120), 12 apart; the slider takes what is left.
- **Guides switch:** a rounded box two columns wide (columns 5–6) with a bullseye crossed by lines. On: filled black, "Guides on". Off: dashed grey outline, "Guides off". A press only switches (unchanged).
- **Phone:** the bar's controls share one row, the slider has the row under it; no zoom buttons (a phone pinches).
- **Tests:** 114 checks: 60× speed, the zoom buttons, the switch's two looks, and the widths above.
- **Fix, same evening (Okay's Safari screenshots: "show hide jumps blocks"):** folding a pane left a wide gap above the next open pane, and none above the next folded one, so blocks jumped. The air above a pane was decided in the stylesheet by "the element just before", which is wrong once a folded pane's hidden rows sit in between. It is now worked out in `sync_rows`: air above a pane only when the pane before it is open. Not a Safari matter: the same in every browser. A check measures it (115 checks).
- **Not on the columns:** the five tabs share the six columns' width equally, so their centres fall between columns.

## beta 4.0 (web version) · 11 Oct 2026

On `dev` and online. The panel redrawn after Okay's proposal picture and his marked-up screenshots of every tab (11 Oct, late). Run and looked at in Chromium here; **not yet seen on Okay's devices** (build list #57). `dial.py` is unchanged (beta 2.3).

- **Columns.** The panel is a toggle column (36), six equal columns (54, gaps 12) and a right margin (28): 448 wide. Label 2 · slider 2 · value 1 · stepper 1; menus and text 4; a swatch 1 and its value 2; a picture tile 1; an OpenType tile 2. More side space than before (Okay: "more padding").
- **Thick and thin.** A 2-point line opens every pane; inside a pane only hairlines. Rows are 34 high (were 29), pane titles 40.
- **Panes and the eye.** Every pane (was: group) has an eye in the toggle column: open eye = pane open, closed eye with lashes = folded (Okay's choice, asked 11 Oct). The whole heading is the button. A folded pane says what it holds in grey at its right (its first values). Same on desktop, iPad and phone.
- **Ring list.** Edge to edge, hairlines, no box. The eye in the same left column shows or hides the ring on the dial (was a tick). The name is no longer a field: a click anywhere on a row selects; **the rename box** (a text cursor in a rounded box, right after the name, on the selected ring only) turns the name into a field — Enter or a click elsewhere keeps it, Esc puts it back. A hidden ring greys and has no rename box.
- **Choices as pictures.** Ring kind, mark shape, the 12 o'clock style, numeral placement, hand shape (the real outlines, drawn by the geometry) and what a window shows are rows of picture tiles, not menus.
- **Colour picker.** The swatch opens a field of one hue (across: strength, down: darkness) and a strip of hues, the colour as RGB or CMYK numbers (CMYK by plain arithmetic, no printer profile: for naming a colour, not for proofing), this dial's colours, the dial colours, and the hex with a Copy button.
- **OpenType tiles in three groups** (build list #62): features with a name of their own, by name; then *Stylistic sets* (`ss01`…); then *Character variants* (`cv01`…).
- **Export.** Examples run the full width. *Vector*: PDF · SVG. **Keep numerals as text in the SVG** (`out_live_text`, the key `dial.py` already has): numerals and date / day window text stay text, placed from the outlines' bounds as in `dial.py`; what knockouts and window clearances cut away becomes a clipping mask; the font is named, not built in. PDF and PNG stay outlines (live text in the PDF: build list #63). The **PNG button stands on the dpi row**, where the label was, and the line under it says what that dpi comes to in pixels.
- **Tabs.** Dial: the ring cut in four pies; when chosen, two opposite pies filled, a checkerboard (Okay: "pies, active: dama pattern"). Windows: a window at 3 o'clock (Okay's drawing). Windows has a first pane, *Window*.
- **Guides box:** more room inside (Okay: "better spacing").
- **The panel can be put away:** a square at the left of the bar hides and shows the whole panel (remembered by the browser), so the dial can have the window. This was in the proposal picture; Okay did not ask for it in words — say if it should go.
- **Phone:** the same columns, scaled to the screen; the ring tools wrap under the Add words.
- **Tests:** 110 checks (was 89): the rename box, eyes in one column, shared columns for number rows, folded summaries, the colour field / hues / CMYK / RGB, live text placement, the PNG row, the panel put away, a phone-sized window.
- **Known limits:** in Rings the list and the ring's first pane stay in view, and they are taller now, so on a low window less is left to scroll (fold *Rings, top first* or the ring's pane to get it back). The picture tiles are drawings of the idea, except the hands. Installed fonts on the Intel Mac, and the iPad screenshot that looked like the wide layout, are still unexplained (build list #49, #57).

## beta 3.0 (web version) · 11 Oct 2026

On `dev`. The tool in a browser: `web/dial-tool.html`, one file, nothing to install. Run and looked at in Chromium here; **not yet opened on Okay's Mac** (build list #49).

- **Same dial, same files.** `web/src/geometry.js` is parts 1–3 of `dial.py`, name for name: settings, rings, numerals, date, hands, the scene. A settings file saved by either opens in the other; beta 1.0 files convert as before (R8, R30). Checked by `web/test/parity.py`: nine harness dials and Okay's `dialx.json`, drawn by both and compared — under 0.7 % of pixels differ (hairlines along edges, and kerning the Python harness's plain font lacks).
- **Preview:** SVG, one element per scene item. Nothing flashes; zoom is sharp at every step (pinch or ⌘ / ctrl-scroll, about the cursor); two-finger scroll or drag pans; Fit; Play runs on the display's frames. Only what changed is touched; hands turn by one attribute.
- **Click the preview** to open the settings of what you clicked: a ring, a numeral (Nudge is set to it), a hand, the date window, the plate.
- **Round ends.** Hands: *Round ends* (new key `round`; half the width or more gives a full round end; tail corners, and the tip where it is flat). Marks: *Round both ends* sets *Round outer* and *Round inner* to half the width.
- **Type:** HarfBuzz shapes every numeral — kerning, OpenType features with the designer's own names, variable axes, language, tracking, collections. *Installed fonts* lists the computer's fonts (Chrome and Edge ask once; Safari and Firefox can't); *Add font file…* or dropping a file works everywhere. Until a ring's font is loaded, Inter (inside the page) stands in and the log says so.
- **Ring list:** show, rename, add each kind, duplicate, delete, up, down.
- **Files:** PDF and SVG (vector, filled paths only, page = dial + margins at true size), PNG at the chosen dpi, Save… / Load… / Defaults; drop a settings file on the page to load it; the last session comes back when the page is opened again.
- **After Okay's first look (11 Oct, Chrome on the Intel Mac, screenshot):** one dark bar under panel and preview (status · time · slider · play/pause icon · Now · Fit), its time controls starting where the preview starts; Guides moved to the panel's header; the ring list and a ring's Kind, Colour and radius stay in view while the other rows scroll. **Fonts:** Installed fonts listed nothing for him and said nothing — a browser that isn't allowed answers with an empty list, and the message went only to the log in Export. Now every font action writes what happened under its buttons (how to allow fonts for the page; where Helvetica Neue's file is). Adding a collection file keeps the ring's own font if the file holds it, else takes the Regular. Font names are read in any language when there is no English one. **Why Chrome gave him no fonts is not yet known** (build list #49).
- **A dial as a link (11 Oct):** the address bar always holds the dial being edited (`…/dial-tool/#1.…`): only what differs from the starting values, deflated, in address-safe base64. *Copy link* in Export → Settings. A link opens that dial in any browser, ahead of the last session; pasting one into the open tool switches to it; a broken one opens the tool as usual. Rule R31 freezes the starting values so old links keep their meaning.
- **Fonts, a picker (11 Oct):** no dropdowns. A list where every font shows `1234567890` in its own outlines; a family's styles are buttons. **Twenty open-licence families come with the tool** (`web/fonts/`, list in `web/fonts.mjs`): Inter, Arimo, Archivo, Barlow, Barlow Condensed, Overpass, B612, Routed Gothic, Jost, Josefin Sans, Montserrat, Oswald, Antonio, Michroma, Saira, Bodoni Moda, Playfair Display, Cormorant, Poiret One, Allerta Stencil — from Google Fonts' repository and Routed Gothic's, all SIL Open Font Licence, licences in `web/fonts/licences/`. A font is fetched from the tool's own site the first time it is used; a dial that names one loads it by itself. Font files you add and installed fonts join the same list. Peter Wiegel's fonts are not included: his site states "Freeware", with licence files only inside each download, and the files could not be fetched or checked here — add them with *Add font file…*.
- **Examples (11 Oct):** five of the guidebook's classics (Field, Diver, Bauhaus, Sector, Gauge) at the top of Export, each a picture and a link, with the open fonts the guide itself uses as stand-ins (`web/examples.mjs`).
- **Pointer on the preview (11 Oct):** what can be edited is outlined (orange on white) and named in a label — black inside, a white line, a black line, with an arrow that stays on the pointer when the label meets an edge. Label and click use one rule (`piece_at`).
- **Panel (11 Oct):** larger tabs, each a sign inside a ring: Dial · Rings · Hands · Windows · Export (Okay first asked for Export leftmost and a Guides tab, then, the same evening, Export rightmost and Guides as a box at the top right: the word opens the guides' settings, the tick switches them). Headings and labels flush left; four kinds of button (outline: an action · filled: writes a file · words: adds · a sign: acts on the selected ring). The ring list has a foot (add · up, down, duplicate, delete) and **rings can be dragged by their grip** to change the stacking order.
- **Guides have their own section (11 Oct), opened from the Guides box at the top right:** which ones (dial edge and window radii · centre lines · every ring's edges), colour, strength and thickness, and the same three for the selected ring. New keys `gd_…`; the starting values draw what was drawn before.
- **Windows (11 Oct):** the Date section is now Windows: up to four, each a **date, a day, am · pm (a day–night disc, by hour) or a moon phase (an arch over two humps, by the moon's age)**. Window 1 is the date window `dial.py` knows (`da_…`, with new `da_kind`, `da_hour`, `da_age`); windows 2–4 are `windows` in the settings. Three more positions: 1:30, 7:30, 10:30. `dial.py` draws window 1 as a date and ignores the rest.
- **Grouping (11 Oct, after Okay's screenshot of Export):** every section is cut into named groups under a hairline (Export: Examples · For production · Export a file · Settings file · Link to this dial · Log; Hands: All hands · Cap · One hand · Size · Details; Rings: Shape · Ends · Numerals · Band …); ticks start at the left edge. **The link is spelled out** in a box with *Copy link* under it. **The log** is small, monospaced, grey, on a light ground.
- **After Okay's phone screenshot (11 Oct):** on a narrow screen the bar is on top. **Groups fold**: a heading is a button that folds its group; which are folded is remembered by the browser (not part of the dial). **Colour**: a square swatch opens a palette — the dial's own colours, 22 dial colours, any colour — and the value can be typed (the browser's own colour control looked different on every system). **OpenType features are tiles**, pressed = on; the ones a font needs just to work (ccmp, locl, mark, mkmk, rvrn, aalt) are not offered. **The Guides box only switches guides**; their settings are a group in Dial, folded at first (the Guides section is gone).
- **Font sheet and Add fonts (11 Oct):** Type shows only the ring's font (its numerals, its name, *Change…*) and its styles as buttons; pressing it opens the **font sheet** over the panel (from the bottom on a phone), so the dial stays in view while fonts are tried. **Add fonts** in the sheet takes: a Google Fonts page link (`fonts.google.com/specimen/…`), an embed link (`fonts.googleapis.com/css2?family=…`), a family's name, a direct link to a `.ttf`/`.otf`, a font file, or (Chrome, Edge) the installed fonts. Google families are fetched from Google Fonts' repository on GitHub (`raw.githubusercontent.com/google/fonts`, folder from the family's name, files from its `METADATA.pb`, upright styles only): the font service itself only serves WOFF2, which HarfBuzz can't read. Fonts added from a link are remembered by the browser as addresses (`localStorage`, `dial-tool-fonts`). **Not tried against the real site from a browser**: the test serves the same paths locally; the header that lets other sites read those files was checked (`access-control-allow-origin: *`). A dial's link still carries font names only: someone else opening it must add the same font.
- **Phone (11 Oct):** below the bar and the preview the whole panel scrolls as one (header, tabs, ring list, rows); the tabs stay at its top.
- **Not in the web version yet:** imported shapes (SVG, PDF, AI), MP4 and GIF, live text, named instances, automatic fallback fonts (build list #50–#52).
- **Tests:** `cd web && npm test` — the parity check, then `test/window.mjs`: 89 checks on the built page in Chromium, with screenshots in `web/test/out/`.
- **Rules:** R30 (the web version), R19 extended.

## beta 2.3 · 4 Oct 2026

The preview plan (`docs/preview.md`), run in full. On `dev`; **not yet seen on a Mac** — check with `docs/preview.md` §6.

- **Canvas preview.** The preview is drawn by macOS's Core Animation: one layer per plate, ring, date part, hand and guide. No PDF is written or reloaded, so nothing flashes; zoom is redrawn sharp at every step.
- **Gestures:** pinch or ⌘-scroll zooms about the cursor; two fingers pan; **Fit** recentres. Zoom and place survive every redraw. Guides stay one screen point wide at any zoom.
- **Canvas · PDF switch** under the preview (`ui_preview`). PDF is the old preview: the reference to compare against and the fallback. If the canvas can't start, or fails while drawing, the PDF preview takes over and the Export log says why (R17).
- **One scene** (R26): `scene()` lists what to draw, bottom to top; export, the PDF preview and the canvas all read it. Harness renders are pixel-identical to beta 2.2 (45 renders: preview, selected ring, export, live text, no guides).
- **Frame clock** (R28): controls only ask for a redraw; a clock in step with the display draws at most once per frame, with the latest values. A time change turns three layers; a colour change sets one property.
- **Fixed:** Play stopped while a slider was held (its timer ran in the wrong run-loop mode). Play now runs on the frame clock. Dragging the time while playing carries on from the new time.
- **skia-pathops** for shape combining when it's installed in DrawBot (Python → Install Python Packages): 2–14× faster than DrawBot's own, and the same library as the harness. Without it, or if it gives up on a shape, DrawBot's own does the work.
- **Status line:** `canvas` or `pdf` · build ms (geometry) · frame ms (drawing). **Launch log:** preview, path route, shape combining, clock.
- **Window:** minimum width 1180 (was 1060), to keep the time slider's length with the new switch in the bar.
- **Tests:** `ui_smoke.py` has stand-ins for Core Animation and drives the clock: after every click it compares the canvas's layers with the scene; it checks zoom maths, gestures, the switch, every fallback and a second run of the script. Seven deliberate breakages of the canvas and clock were each caught.
- **Fixed, 11 Oct: MP4 export.** DrawBot renders a clip at 72 pixels per inch (one pixel per point) and its MP4 export refuses a frame with an odd pixel count (`imageContext.py`, `ensureEvenPixelDimensions`). The page is dial + margins, so the default 30 mm dial gave 102 px (worked, tiny) and a 33.5 mm or 36 mm dial gave 111 or 119 px (error in the Export log, no file). New setting **Clip size px** (`out_px`, 1080): MP4 and GIF are rendered at that size, always even (`clip_resolution()`); the log line says the size. Smoke test: MP4 at five page sizes against DrawBot's own rounding rule. Not yet run on a Mac.
- **Rules:** R26 (one scene), R27 (our own Cocoa classes), R28 (nothing renders inside a callback).
- **Design canon** (`docs/design.md`, R29): type, grid, colour, pictures and redrawn controls, after Braun's printed matter and Lupton's *Thinking with Type*, with what was read and what is only recalled.
- **Guidebook, third edition** (25 pages, A4 landscape): one sans (Inter), four sizes; a dark cover with contents; figures hang from one line and text stands on the bottom margin; the whole window redrawn in grey at true proportions from `dial.py`'s own measurements; a figure for the features that can be drawn, and nine classic dials (field, diver, dress, pilot type B, California, station clock, Bauhaus, sector, gauge) each printed with the settings that draw it. The classics are also presets: `docs/guide/presets/*.json`. Source is now `docs/guide/guide.html` + `tools/guide_dials.py` (was `guide.md`); R25 updated.
- **Guidebook, fourth edition** (same day): tighter text (unit 1.375 mm, was 1.5), leads and titles 12.4 / 31 pt; each topic opens with one large annotated example whose panel fills its column, then thumbnails; line icons and "Watch" notes; no accent colour; classic pages 8 · 4 with the dial the full page height. Rules in `docs/design.md` §2–§5.
- **Guidebook, fifth edition** (same day, 28 pages): rows join the columns (12 × 14; every box on a row line, one rule across each page under the pictures); pictures stand on paper, with a ground only for close-ups, the classics and the controls; plain plates drawn as hairline circles; a cover that shows one dial half as construction, half finished; a thumb index on the page edges; **every setting with range, step and starting value**, printed from `dial.py`'s rows; a **Find it** index. Source is now `docs/guide/pages/*.html` + `style.css` + `icons.svg` (was one `guide.html`); `tools/make_guide.py NAME` previews single pages and every build prints `CHECK` lines for what it measures wrong. How to write a page: `docs/guide/README.md`.
- **Guidebook, sixth edition** (same day): grounds are back behind every picture; one colour, signal yellow `#F5C518`, for every plain plate, the thumb index and the cover's line; three type sizes, larger (8 · 10 · 32 pt, was 7.5 · 9 · 12.4 · 31).
- **Guidebook, seventh edition** (same day): each of the 14 sections has its own pale colour (plates of its plain figures, its tab), stepped round from yellow; the cover shows the whole dial, uncropped, on a dark field and a yellow one, with a 96 pt title; the four Start icons redrawn on one outline; labels on pictures darkened, white on dark bands.

## beta 2.2 · 4 Oct 2026

Released to `main`: beta 2 runs on Okay's Mac (beta 2.1 screenshot, 4 Oct).

- **Live text export option** (Export → "Live text in PDF · SVG"): numerals and the date stay text the fonts can edit. Off by default — outlines need no fonts and print exactly as seen. Placed from the same outlines' bounds, so live and outlined numerals land in the same place (checked: under 0.05 % of pixels differ, upright, radial, on path, knocked out). What knockouts or the date's clearance cut away becomes a clipping mask.
- **Feature names** for dnom, numr, afrc, rvrn.
- **Guidebook:** `docs/Dial-Tool-guide.pdf`, 5 pages, IBM Plex Mono, from `docs/guide/guide.md` via `tools/make_guide.py` (figures rendered with dial.py itself).
- **Tests:** the harness checks live-text placement; the smoke test exports with live text (it caught a name clash in the date's live text before release).
- **Fixed:** a beta 1.0-style settings file now keeps any beta 2 keys it also contains.

## beta 2.1 · 4 Oct 2026

Interface, after Okay's first look at beta 2.0.

- **Ring settings are one scrolling list** instead of four pages: Kind, Colour, Radius · Positions · Give way · Look · Nudge · Type (with OpenType features and variable axes). Rows that don't apply to the ring's kind hide (R16).
- **Guides checkbox under the preview**, next to Now · Play · Fit, so it's in reach from every section.
- **Larger controls:** every control uses the regular macOS size (was small); the left panel is wider (470 px) to fit the labels.
- **Tab titles aligned left** on the section switcher and the hand picker.

## beta 2.0 · 4 Oct 2026

The dial becomes a list of rings.

- **Rings:** ticks, markers, numerals and bands, as many as you like. Add, select, rename, hide, duplicate, delete, move up/down. A ring's kind can change at any time and keeps its settings.
- **Pages for the selected ring:** Position (kind, colour, radius, positions, giving way) · Look (the kind's own settings) · Type · Nudge.
- **Positions:** count, start °, span °, every, offset, skip those instead. Partial spans make scales and arcs.
- **Giving way:** list order is stacking order; each ring can *skip where* and *knock out* round the rings above it, choosing which ones. Replaces the four collision rules.
- **Bands:** flat colour rings, sectors (count, every, fill %), pies, partial arcs; also used for railroad rails.
- **Type per numerals ring**; numbers counted from a start with a step and zero-padding (minute numerals 05…60, scales).
- **Hands:** each hand on its own — baton, pencil, sword, dauphine, leaf, arrow, syringe, Breguet, lollipop, or a file — with length, width, tail, tip, head/ring/disc, hollow wall, counterweight and colour, in mm. Cap colour of its own.
- **Imports:** SVG, PDF and AI (PDF-compatible) for markers and hands; fit to length, size ×, width ×. White fills cut, strokes are outlined, skipped content is reported (R23).
- **Date:** print clearance and print colour of its own; uses the top numerals ring's type.
- **Guides:** each ring's edges; the selected ring in orange.
- **Faster edits:** each ring's shapes are remembered by its settings, so changing one ring rebuilds only what depends on it.
- **beta 1.0 settings convert automatically** (last session and presets). Checked: 11 test dials give zero area difference against beta 1.0, hands included.
- **Tools:** `tools/ui_smoke.py` runs the whole interface off-Mac on stand-ins checked against vanilla 0.5.0's real signatures (`tools/vanilla-0.5.0-api.json`); it reproduces the beta 1.0 dropdown bug if R22 is removed. `tools/test_harness.py` gains ring variants and a check of the PDF importer's drawing logic.

## beta 1.0.1 · 4 Oct 2026

- **Fixed: dropdowns, checkboxes, segmented controls, colour wells, text fields and the Export/Settings buttons did nothing.** Cause: those controls were only held by the section's `GridView`, which keeps the Cocoa view but not vanilla's Python object; the Python object held the callback, Cocoa doesn't retain targets, so every callback was dropped once the section was built. Popup items showed grey because nothing answered their action. Number controls and the numeral picker worked only because something else happened to hold them. New rule R22.
- **Self-check at launch:** the Export log says `all controls connected`, or lists any control that lost its callback.

## beta 1.0 · 4 Oct 2026

First version as a project. Own window replaces DrawBot's `Variable()` panel.

- **Window:** section switcher (Dial · Track · Markers · Type · Numerals · Hands · Date · Export); live preview keeps zoom; time slider, Now, Play, Fit.
- **Number controls:** label · slider · typed field · stepper; typed shorthand `+`, `x`, `/`; typing past a slider's range extends it.
- **Markers:** bar, wedge (taper), dot, SVG; rounded outer/inner tips (true fillets); hollow wall for any shape; show-at; 12 o'clock style, scale, gap.
- **Fixed:** dots in one-ring mode (were silently turned into bars); double 12 had no gap control.
- **Type:** any installed font (family → style → named instance); language; size; tracking in 1/1000 em; variable axes as sliders; OpenType features as a checkbox list with designer names.
- **Numerals:** on-path placement keeps real kerning and one baseline; per-numeral nudge in the interface.
- **Hands:** proportions, seconds hand with counterweight, motion (sweep / quartz / 6 / 8 beats per second), SVG hands.
- **Date:** rounded aperture with frame; print kept clear of the hole.
- **Export:** PDF, SVG, PNG (dpi), MP4, GIF; production mask; mirror; save/load settings; last session restored; error log.
- **Tools:** `dial_probe.py` (interface foundation test), `test_harness.py` (off-Mac geometry renders).

## probe · 4 Oct 2026

`tools/dial_probe.py`. All checks passed on Okay's Mac (DrawBot 3.132): GridView forms, private drawing engine, 690 font families, feature lists, live outline render ≈ 50 ms. Found: vanilla Tabs collapse around auto-layout content.

## v0 · 3 Oct 2026

Single script with DrawBot's `Variable()` slider panel: track, markers, numerals (upright / radial / auto-flip / on path), parametric hands, date window, production and mirror modes, PDF/SVG/MP4 export. Limits that led to beta 1.0: no typed numbers, no sections, no font picker, fixed panel width.
