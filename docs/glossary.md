# Dial Tool — glossary

What each word means **in this project**. Turkish where it's the common trade word.
If a term is used differently in conversation, ask, then update this file.
*Last updated 21 Oct 2026 (made leaner: meanings, places and keys only; reasons are in docs/decisions.md; the look to the pixel is in docs/design.md and the code, and the full glossary before this cut, with its drawing details, is archive/glossary-full-2026-10-21.md). The DrawBot terms are in archive/drawbot/glossary-drawbot.md.*

## Watch terms

| Term | TR | Meaning here |
|---|---|---|
| **Dial** | kadran | The printed or etched plate under the hands. In the tool: the *plate*, its rings and the windows. |
| **Plate** | | The dial disc (`dial_d`, colour `c_plate`). |
| **Movement** | mekanizma | The mechanism behind the dial. Not chosen yet; it will fix dial size, hand lengths and date position. |
| **Hour / minute / seconds hand** | akrep / yelkovan / saniye ibresi | Each has its own shape and settings (`ha_hour`, `ha_minute`, `ha_second`). |
| **Tail** | | The part of a hand behind the pivot, in mm. |
| **Counterweight** | | A disc on any hand's tail, centred at 73 % of the tail. |
| **Cap** | | The disc over the pivot (`ha_cap`, colour `c_cap`). Part of the seconds hand, edited in its pane (#262). With no seconds hand it sits on the topmost hand only if **Cap on this hand** (`ha_cap_top`) is ticked. |
| **Centre hole** | | The hole in the plate for the hand pipes (`dial_hole`, Ø mm, 2.7 to start; 0 = none). Shown when the hands are hidden, under them otherwise; a production mask always has its cut line. Not the holes in the hands. |
| **Disc hand** | | Hand shape `disc`: a disc on the pivot (`disc_d`) carrying one marker in a markers ring's shapes (`mark`: bar · wedge · dot, `mark_len`, `mark_w`), outer end at the hand's Length. No blade. The marker (`mark_as`, #300) is a **Hole** (cut out; rows *Hole*, *Hole length*, *Hole width*; keys stay `mark…`, R8) or a **Mark** (painted, colour `mark_c`, row *Mark ink*). *Inside the disc* = `mark_in`. |
| **Track** · minute track · chapter ring | | The minute marks round the edge. In the tool: a **ticks ring**; railroad rails are thin **band rings**. |
| **Tick** | | One mark of a ticks ring. A 300-division track = two ticks rings: 60 minute ticks over 300 fine ticks that skip their positions. |
| **Railroad** | | Two thin rails along a track's edges, ticks between. In the tool: two thin bands. |
| **Marker** · index · hour marker | endeks | A mark at an hour (or any position). In the tool always **marker**, made by a **markers ring**. |
| **Numeral** | | A label at a position: Arabic, Roman, Eastern Arabic, Chinese, words, custom, or numbers counted from a start. |
| **Sector dial** | | A dial split into zones of colour or finish. In the tool: band rings. |
| **Date window** · aperture | takvim penceresi | The hole showing the date disc. **Aperture** = the hole; **frame** = the printed border round it. |
| **Beat** | | Seconds-hand steps per second: sweep, quartz 1/s, 6/s (21,600 vph), 8/s (28,800 vph). |
| **Applied** vs **printed** | | Applied = metal parts fixed on the dial; printed = ink or etch. The tool draws printed; applied as outline. |

## Rings

| Term | Meaning |
|---|---|
| **Ring** | One entry in the ring list; repeats one thing round the centre at its **positions**. Every dial element in the list is a ring (not a *layer*). Unlimited. |
| **Kind** | What a ring repeats: **ticks**, **markers**, **numerals**, **band** or **text**. Changed from the row's kind icon; settings kept. ("Type" means typography.) |
| **Text ring** | Kind `text` (#297): a line of words (*AUTOMATIC*) at each position, own font; drawn like numerals. An idea of Faruk Koç (farukahmet on GitHub). Its **Start** snaps to other rings' indices within 2°. |
| **Ring list** | The list in Rings; its order is the **stacking order** (top ring drawn last, in front). A row (#254): **eye**, grip, **kind** icon, name; the selected row adds the **rename box** and its size and radius numbers. The **ring drawer** hangs under it. |
| **Radius** | Ticks, markers, bands: radius of the **outer** end, **middle** or **inner** end — *resize from* (ring key `from`, #257), set beside the radius label; the dotted guide is that radius. Numerals and text: the band's **outer**, **middle** or **inner** circle (the **anchor**, #488). |
| **Anchor** | Which circle of a numerals or text ring's **band** its radius is (ring key `anchor`): **Outer** · **Middle** · **Inner**, set in *Resize Ring from …* (#419) and the radius popup. That circle holds still; a bigger size grows the band away from it, as a ticks ring's *resize from* (#488). Older centre, baseline, ascender and cap middle read as Middle. |
| **Band** (of numerals) | A numerals or text ring's thickness: one cap height of its font at its size (#488). Every label stands on the band's middle line (the middle of a capital H), so a 1, a 10 and old-style figures share one line; with Outer or Inner, labels touch that circle (upright ones by their reach toward the edge). A label nudged bigger keeps its place. Guides and handles show the band. Not a **band ring**. |
| **Positions** | **count**, **start °**, **span °**. A full turn spaces evenly; a partial span marks both ends. Bands: positions start segments tiling the span. Shown as a round preview in the pane (#251). Count and Every are **chevron boxes**, the rest **number blocks**. |
| **Every · Offset · Skip those** | Which positions are used: every n-th from the offset; *Skip those* inverts (#357). Cardinals = every 3; non-cardinals = every 3, inverted. |
| **The date** | The day shown (`date`), set in the bar beside AM · PM; today until one is picked; Now resets. A window that **follows the date** (`follows`) shows it: date = day of month, day = weekday in its **Names** language (EN · TR · DE · FR · IT), moon = moon's age. One **moment** (`web/src/moment.js`) drives every complication. |
| **Handles** | The selected ring's draggable marks on its guides: disc = radius, square = size, triangles = start and (under 360°) span end. On the Rings tab, only where its guide shows. |
| **Case** | Preview-only watch case round the dial: Diver, Pilot, Dress or Sport, a top-view technical drawing at real proportions. Switch at the preview's top right under Guides. Keys `bezel`, `strap`, `c_strap`. Never exported (R26). The view fits the dial, not the case. |
| **Disc** | What turns under the plate and shows through a window (#346): date or day = a band round the centre; am · pm = a small disc on the hole's bottom edge; moon: none yet. Edges as dashed guides. |
| **X-ray** | Preview switch at the top right, under Case: every window's disc whole, stacked — selected disc on top, then hands, face, other discs (biggest deepest), each layer 15 % fainter. Never exported (R26). |
| **Neighbours** | Date or day window tick: the disc's places either side of the shown one, where the hole lets them, in the number's colour unless given their own (Windows → Neighbours). |
| **Big date** | The fifth complication: two square holes, tens and units of the date. |
| **Bevel** | A hand's two long halves lit and shaded; preview only. Per-hand **Bevel** tick (`bevel`, off to start) in the Show box, while Shadows is on; strength Shadows → Bevels % (`sh_bevel`, 100 to start). |
| **Hub** | The round boss at a hand's pivot, Ø per hand (Hands → Hub Ø, `hub`), joined to the hand. 0 = none. Not a disc hand. |
| **Print sheet** | Copies of the dial at true size (#348): Export → Print → Sheet PDF; A4, Letter or A5, straight or staggered, optional cut lines. |
| **Versions** | Switch under undo on the preview: saved dials (at most nine, in this browser, *Save this dial*) and **Compare**, all side by side (#435). Numbered releases are **builds**. |
| **Weight %** | Under Dial: every width at once (marks, bands, hands, frames), as Scale does every measure (#88). Not a font's weight. |
| **Picture** | What a moon window shows: Arch, Phase (three colours) or Line (one ink). Key `look`; shade `c2`. An am · pm window has one picture and no Picture row: a disc half am, half pm, under a half-round hole, turning once a day. |
| **Physics** | Window tick: its disc must end inside the case (dial edge less a 0.5 mm rim); past it the outer guide shows red and the panel says by how much. Off, a disc may outgrow the dial (screen faces). |
| **Strap** | From a case's lugs on the preview: leather **strap** (`c_strap`) or metal **bracelet**, on the Strap switch under Case (`strap`: 0 none · 1 strap · 2 bracelet). Only with a case; never exported (R26). Not a diver's bezel drawn as rings. |
| **Wear OS export** | The dial as a Wear OS watch face (Faruk Koç's PR #1, as farukahmet): Export → Wear OS → APK; sideloaded, debug-signed, never for the Play Store. |
| **Tiny Preview** | A small draggable window showing the dial at its own size (approximate, 96 px to the inch) (#337); button with the iris at the preview's bottom right; closed by the eye at its top left. Not editable. Not **show mode**. |
| **LINK pill** | Between two rows whose numbers may move together (#358); LINKED keeps their ratio. On a window's width and height (`wh_link`); a LINK disc in the controller. |
| **Number block** | A Positions row (`block: true`): name and **number box**, no slider; the name opens the controller. Count and Every are **chevron boxes**. |
| **12 o'clock · first position** | A markers ring's first position style: same, double (gap), triangle, none; and scale. |
| **Give way to rings above** | **Skip where** drops positions where chosen rings above have a mark; **Knock out** cuts gaps round their shapes by the **clearance**. Choices: nothing · markers above · markers & numerals above · all marks / everything above. Neither = **stack**. Two **side tabs** in the pane (#258). |
| **Clearance** | The gap a knockout leaves; the print-free zone round a window (`da_clear`, a window's `clear`). |
| **Band** | Colour between radius and radius − band width. Count 1 = full ring; more = **sectors**; **fill %** = each sector's share of its step; width ≥ radius = **pies**. Flat colour for now. |
| **Taper** (inner width ×) | A wedge's inner width as a fraction of its outer. 0 = triangle, 1 = bar, >1 = wider inside. |
| **Round outer / inner** | Corner radius at a mark's outer or inner end; true fillets, any angle. |
| **Hollow wall** | Turns a mark or hand into an outline of that thickness (dot → ring; hand → lume opening). |
| **Placement** | How numerals sit: **upright** · **radial** · **radial, auto-flip** (never upside down) · **on path** (letters follow the circle). |
| **Nudge** | Per-position correction: radius ±, angle ±, rotate, size ×, and a mark's own shape; for every ring but a band (#349). On the dial: first press picks the ring, second the item. |
| **Rings pane** | The pinned pane on top of Rings: tools (plus for the five kinds; move up · move down · duplicate · delete), the ring list, the **ring drawer**. Folded: *Rings: <name>* and a summary. |
| **Ring drawer** | Framed box under the selected row (#253, after Okay's PSD `selected-ring_181026`): the **details** on two lines, a swatch, and **size** (a mark's length, a dot's Ø, a numeral's size, a band's width; Okay's "scale") and **radius** as value buttons. `ringline` / `lineholder` in code. |
| **Dial Mono** | JetBrains Mono, packed and subset (`web/fonts/ui/mono_font.py`): the unit box's face and the selected row's numbers (#302). Not a dial font. |
| **Dial Time** | Barlow Condensed Light, packed and subset (`web/fonts/ui/time_font.py`): the bottom bar's time (#284). Not a dial font. |
| **Play triangle** | The white triangle on the play button; flares with each beat while time runs (#282, #308). |
| **Pixel font** | Silkscreen, packed: stickers, the LINK pill, the speed slider's numbers. Not used for the numerals picture (#255). Not a dial font. |
| **Value button** | A number drawn as a small picture without digits (radius, size); value shown in the row and its tag. Click opens the **controller**; press-and-move changes it. R15's form C. |
| **Ring settings** | Scrolling panes under the ring list, each shown only for kinds it applies to (R16): **Text** and **Type** first for word rings (#296), **Resize Ring** (size, **Shapes width**, radius, #257), Sector colours · **Shapes** · Positions · Give way · 12 o'clock · Numerals · Band · Nudge. |

## Hands

| Term | Meaning |
|---|---|
| **Shape** | baton · pencil (pointed baton) · sword · dauphine · leaf · arrow (broad-arrow head) · syringe (shaft, barrel, needle) · Breguet (open ring near tip) · lollipop (disc near tip) · disc (see **Disc hand**) · file (imported; not built, #50). |
| **Tip length** | Length of the pointed end (pencil, sword, arrow, syringe, Breguet). |
| **Head width · ring/disc Ø · …at %** | Arrow head or syringe barrel width; Breguet ring or lollipop disc Ø; where it sits, % of length (dauphine: widest point). |
| **Fit to length** | An imported hand is scaled so its tip reaches the hand's length; else **Scale ×** (the word for a multiplier, as on a label's nudge, #231). **Width ×** stretches sideways. |

## Tool terms

| Term | Meaning |
|---|---|
| **Section** | A page of the left panel, by tab: Dial · Rings · Hands · Windows · Export. The fourth's key and number are Date / 3 (R8, R9). |
| **Pane** | A named part of a section; its eye folds it. Dial section: **Dial**, **Page** (margin, backdrop), **Colours**, **Reset**. |
| **Sector colour** | A band sector's own colour (ring key `cs`); else the ring's. **Alternate**: even count, two colours on odd and even sectors. |
| **Scale everything** | Tick under Diameter: a diameter change multiplies every measure (not the page margin). |
| **Unit box** | Box at the title line's right: lengths shown and typed in mm, points, inches, lignes, thou (#302). Settings stay mm. **Ligne** = 2.2558 mm. **Thou** = 0.0254 mm. |
| **Hand handles** | On a hand's detail box: squares for Length, Tail and Width (a disc hand's Ø), dragged to set them (#345). Ring ones are **Handles**. |
| **Lit part** | On a hand's detail box, the part a number makes, filled in the guide colour while its row is pointed at, focused or its controller open (#329). |
| **Reach** | The unseen touch area round a small control. |
| **Heading selector** | A pane's main selector on its heading line, no name of its own (Labels, Complication). |
| **Backdrop switch** | Chip at the preview's bottom left; opens the colour pop-out for the backdrop. |
| **Hand tabs** | Hour · Minute · Seconds, Hands' second pinned line: choose the hand the panes edit. |
| **Window cards** | Four cards on top of Windows (12 · 3 · 6 · 9), each a small dial with its window; they are tabs choosing the window to edit. Shown via the **Show box** tick. |
| **Show box** | Thin box under the hand tabs and window cards holding the one tick **Show** (#261). |
| **Gallery** | Last pane of Export: dials to open and take apart (`web/gallery.mjs`; #286, #289): the First dial, Okay's versions from the research atlas, six to pick from, five **examples** (of the **classics**, `web/examples.mjs`), Okay's watch. The **Gallery pill** leads there. A card opens in **focus**: *Edit this dial* or *In a new tab*. |
| **Tab** | A choice of what the panes below edit, drawn as touching tabs with V-cut corners, the chosen one black: hand tabs, window cards, Complication buttons. Not the five section **tabs**. |
| **Tag** | The small label shown with a wordless button on hover; one for the tool (`.tag`). A value button's tag gives name and value. |
| **Build** | A numbered release ("beta 4.90"), listed with its commit in `docs/versions.md`; not a **Version** (saved dial). Numbering: R19. |
| **Undo step** | The dial before a change, taken once it stands still. ⌘Z back, ⇧⌘Z forward. |
| **Mark · bio** | Okay's logo in the panel's first column, left of the title; opens the **bio** (tool, maker, source, open-source credits, contact). |
| **Eye switch** | Square switch at the preview's bottom right; shows the **dial alone**. Okay also says *preview icon*. |
| **Showcase** | Retired 22 Oct 2026; the word now means **show mode** (Okay: "no spotlight, no animation on showcase. This replaces that"). |
| **Dial Show Case** | A dial from a Dial Tool link shown in a whole watch, with its own export. Two words, title capitals. Live at `/show-case/` (beta 1.0.x); its source in `show-case/` on `dev`, built from `web/src/watch.js`; kept as a sandbox (Okay, 22 Oct 2026: "left as a dev to tinker without touching main code"). In Dial Tool as **show mode** since 4.91.8. |
| **Show mode** · **edit mode** | Dial Tool's two modes once the Show Case is in (Okay, 22 Oct 2026): **edit mode** is the tool as it is, with a flat, simply shadowed case round the dial; **show mode** opens from the iris switch (ACTIVATE SHOWCASE) — the panel slides out on the left and in on the right with the show tabs Dial · Watch · Light · Export, tinted by the backdrop; the whole watch with shadows, flares and Miyazaki; the dial's colours, the watch's colours, ink height and light editable, and Versions; a persistent "shenanigans" switch (Effects) for the costly layers. |
| **Engineer** · **Miyazaki** | The watch's two paints (`web/src/watch.js`), Okay's names. **Engineer**: technical drawing, ink outlines, three tones, hard shadows. **Miyazaki**: no lines, flat shapes cut by light and dark crescents, deeper colours, a flare. |
| **Dial alone** | Eye switch view: panel away, dial fills the preview; mark, title, version and bottom bar stay. Not part of a dial. |
| **Drawer** · **gripper** | On a phone (or upright iPad) the panel is the **drawer** under the preview; its **gripper** (grey dot) sets its height (drag; tap toggles two heights). |
| **List pill** | Black pill on the Rings pinned line when there are more than five rings (#256): drag to show more or fewer rows; tap toggles five / all. Kept by the browser. |
| **Opener** | The dial opened when the address has no dial and nothing was kept, and what **Reset** (Dial → Reset, "Reset to the First dial") restores: the **First dial** (`web/src/opener.js`). Not the starting values (*Plain dial*, Settings file pane). |
| **Blank face** | Button under Reset (#333): starting values, white plate, no windows, one hidden ring (list never empty); hands stay. Undoable. |
| **Bottom bar** | Dark strip at the window's bottom: time (play, speed slider, time with AM · PM, Now, day slider) · view (zoom, − +, Fit). |
| **Speed slider** | 0.1× to 720× (#283): **slow motion** steps 0.1 · 0.25 · 0.5 · 1×, then log scale. Starts at 1×. |
| **Pinned line** | A line outside the panes, always in view (Hands: All hands · Show hands · Motion; the hand tabs). Row option `bar` in `app.js`. |
| **Half line** | Hairline between a row and a **nested row**, from the controls' column (third of six) to the right edge. |
| **Sticker** | Font sheet: a small coloured pixel-font box naming one thing a family has (*weight*, *italic*, *4 styles*), colour per kind; legend under the list. |
| **Detail box** | Left of a hand pane's rows: the chosen hand, large, centre marked; over the rows on a phone. A picture **tile** shows a shape in general; the detail box shows this hand. |
| **Number box** | Every number's box (R15): value, then − and +, touching (`.numbox`). Typed shorthand: `1.2` set, `+0.5` add, `x0.5` multiply, `/2` divide. |
| **Chevron box** | A value from a menu (Count and Every, `num_menu`, #357): value box plus ⌄ (`menubox`); *Custom…* allows typing. Always shows the value. |
| **Number form** | How a row shows a number (R15): **A** full row (label · slider · number box) · **B** quiet row (no slider) · **C** value button. Same ways in (type, step, sweep) and one popup, the **controller** (#249). Linked pairs use a **LINK pill** (#358). |
| **Quiet row** | R15's form B (`quiet: true` on a side row, e.g. Clearance): label · number box; slider in the controller. For numbers set more than swept. |
| **Controller** | The number popup for every form (R15, #249, #330; Okay's drawing `controller 2.svg`): value, slider, − and +; **No name**. Appears where pressed, fades 1.2 s after use; Escape, Enter or a press elsewhere close it. Opened by a value button, a row's name (sideways drag changes the value, #170), a quiet row's number, or a touched slider. `value_pop` in code. |
| **Ink centre** | Centring a short label on the box its ink covers, as drawn (`web/src/ink.js`); boxes listed in `INKED`. Not advance width or line box. |
| **Look-check** | `web/test/same.mjs`: every element's computed style in 447 states, saved before a stylesheet change and compared after; no difference = same look. Four minutes a run. |
| **Box rule** | A framed thing in the panel (ring row, font box) spans from the labels' start to the pane's right line; `--frame-pad` inside, labels `--btn-pad` in (#125). |
| **Scale** (of spaces) | Every stylesheet space is a step of the unit (5.5): `--u1` ½, `--u2` 1, `--u3` 1½, `--u4` 2, `--u6` 3, `--u8` 4 units. Not the ring drawer's *scale* (size). |
| **Bottom section** | A popup's last line, filled with the line colour to the bottom (#305): Guides (Thickness · Reset All), Shadows (Reset). |
| **Special** | A value off R32's scale or tokens on purpose: a named token in the labelled block at the end of `:root` in `1-tokens.css`, with Okay's words and date; never a bare number (R32). Two groups: asked for by Okay; found off scale (#294). |
| **Side row** | Row beside the detail box, last four columns: label · slider · number box (`side` in `app.js`). |
| **Print** (pane) | In Export: what only the printed or etched dial needs (mono print mask, mirrored, print sheet). Nothing drawn on the dial. |
| **Nested row** | A row belonging to the one above: a question (`nest`), its settings (`tie`) or a note (`under`). Starts on the controls' column, under a **half line**. |
| **Nested question** | A tick or menu about the row above; starts on the controls' column. |
| **Row line** | Hairline before and after every row. |
| **Logo** | Planned (build list #72): an SVG placed on the dial with the mouse; a ring in the list. Not the *background* (a picture on the plate, not built). |
| **Toggle column** | Narrow far-left panel column holding only the panes' eyes. A ring's eye is in its row. |
| **Margin** | The panel's side space, 24, left and right; lines and eyes align to it. |
| **Day slider · step** | Bottom-bar slider over twelve hours; steps at each hour and 10:10. **AM · PM** (the time's small window) flips the half. |
| **Eye** | Toggle-column sign: open = showing, closed with lashes = put away. On a ring row it only shows or hides the ring, never selects it (#183). |
| **Rename box** | Text-cursor box beside the selected ring's name (hidden when the row is full); it or the name renames the ring. |
| **Picture tile** | One choice as a small drawing with its name (ring kind, mark shape, hand shape, window content…). |
| **Colour pop-out** | What a swatch opens; one for the tool: *On this dial* · *Palette* · field and hues · RGB / CMYK / HEX with COPY. Draggable; doubles in size. |
| **Colour pill** | A button with swatch and hex; opens the pop-out; not typed in. |
| **Opacity** | The colour's fourth number. Rings and band sectors only. |
| **Palette** | The pop-out's second row: ten colours plus those added with **+**. Kept by the browser, not the dial or link. |
| **Production mask** | Export mode: every ring solid black, no plate, no hands, aperture as an outline. |
| **Live text** | Export option: numerals and date stay text in PDF/SVG (fonts needed). Off by default — then text is **outlines**. |
| **Design canon** | `docs/design.md`: rules for type, grid, colour, pictures and redrawn controls (R29). |
| **Guidebook** · the guide | The user guide, `guide/` (plan `guide/PLAN.md`, page design `guide/notes-okay.md` and the design canon), pictures and claims made and checked by script. Built by `bash guide/make.sh` on Okay's word only (R25); edition 1 is at `/guide/` on gh-pages. Old guides: `archive/guide/`. |
| **Classics** | Nine example dials drawn by eye after dial types (field, diver, dress, pilot, California, railway, Bauhaus, sector, gauge) in `web/presets/`; five are the Gallery's **examples** (`web/examples.mjs`). Not measured from real dials. |
| **Mirror** | Flips the output for toner transfer. |
| **Guides** | Construction lines in the preview, never exported. The dial's **kinds** — **centre hole** · centre lines — each take one of eight **guide colours** or **None**; the centre hole guide also shows **live** while sizing. **A ring's guide** / **A window's guide**: its own colour, shown per *All · Selected · None*; two solid circles at the **edges**, dotted at the **middle**. **In focus** (#301): *Selected* = the current tab's selection; *All* fades the rest. **Added guides**: line, crosshair, circle. **Guides switch** at the preview's top right; its arrow opens the **guide list** with **settings** (Rings · Windows · Add, Thickness, Reset All). |
| **Backdrop** | The preview's background colour; never exported. |
| **Number control** | Label · slider · number box: R15's form A. |
| **Settings** (`S`) | One dictionary of every value, saved as JSON. Rings are a list in it (`S["rings"]`, top first); so are hands and windows. |
| **Static geometry** | What doesn't move (plate, rings, windows); rebuilt on a geometry change, per ring by its settings. Hands turn every frame. |
| **Imported file** | An SVG, PDF or AI file used as a marker or hand shape (R23; not built, #50). |
| **Icon** | A small SVG in the window (section sign, tool, picture tile), drawn in the icon block at the top of `web/src/app.js` by R33 and design canon §9. Not the boxes round it. |
| **Icon grid** | One unit = one point, four line widths, straight lines on quarter points. |
| **LINE · SLANT · CURVE · DENSE** | The four icon line widths (design canon §9): straight 1.5 · slanted 1.5625 · round 1.625 · crowded 1.25. |
| **Quarter point** | A coordinate ending in .25 or .75; a 1.5 line there covers three whole dots on a 2× screen. |
| **Pictured width** | An icon width depicting a thing's own width (ticks, marks, band), not a line; kept as drawn. |
| **Rim** | The ring holding a sign (section tab, window card, round tool); an ordinary icon line. |
| **Look** (of a line) | How heavy a line appears, read by `web/icons/look.py` against a straight `LINE`. |

## Type terms

| Term | Meaning |
|---|---|
| **Type** | Typography of a numerals or text ring (family, style, instance, language, size, tracking, axes, features). A new numerals ring copies the top one; date and day windows use it unless given a font. |
| **Family / style** | A family (Helvetica Neue) and its styles, from the **font list** (`web/fonts.mjs`), an added font, or — in Chrome and Edge — the computer's fonts (**Installed**). |
| **PostScript name** | One style's exact name (`HelveticaNeue-Bold`); stored in the ring's `ps`. |
| **Variable axis** | A continuous dimension of a variable font (`wght`, `wdth`…); each becomes a slider. |
| **Named instance** | A preset point on a variable font's axes ("Bold Condensed"). |
| **OpenType feature** | A font switch: `tnum` tabular, `onum` oldstyle, `ss01` stylistic set 1, `zero` slashed zero…; named as the font names it. |
| **Language** | Language-specific forms (`locl`), e.g. Turkish İ/ı. |
| **Tracking** | Even letter spacing, in 1/1000 em. |
| **Outlines** | Text converted to shapes: no font needed, not editable. |

## Code terms

| Term | Meaning |
|---|---|
| **Web version** | The tool (`web/`): source in `web/src/` (`app.js` the window, `geometry.js` settings, geometry and drawing, R6), built by `node build.mjs` into **one file**, `web/dial-tool.html`, fetching nothing at run time (R30). Settings keys shared with the frozen `archive/drawbot/dial.py` (R8, R30). |
| **Scene** | What `scene()` returns (`geometry.js`): everything to draw, bottom to top, each **item** with a **role** (plate, ring, hand, guide…). Export and every preview read it (R26). |
| **Shape combining** | Union, difference, xor and overlap removal of paths, done by PathKit. |
| **PathKit** | Skia's **shape combining** for the browser, pinned in `web/package.json` (R30); same engine as `skia-pathops` in the parity test. |
| **HarfBuzz** | The text engine, pinned in `web/package.json` (R30): text + font + features + axes + language → glyph outlines (R10). |
| **Stand-in font** | Inter, packed in: draws numerals whose font isn't loaded; the log names it. |
| **Installed fonts** | The font sheet's **Installed** button: the computer's fonts (Chrome, Edge, `queryLocalFonts`). Elsewhere: add files. |
| **Link** (a dial's) | The tool's address with the dial after `#`: the dial only, not window state or font files (R31). **Link scheme 4** (`LINK_SCHEME`): "4" then **lean** settings (`lean()`, only what differs from the starting values), keys as codes from the **key table** (`LINK_KEYS`, only grows), colours hex, numbers to 3 decimals, time to the second, deflated, in Crockford's base 32. Other schemes are not read: the opener opens with a **note on the preview** and in the log. |
| **Window shape** | The hole's outline: rectangle · circle · polygon · arch (moon's) · half (am · pm's) · arc (a ring piece, for a day window at 12). Arch and half belong to their kind. **Turned**: along its radius, not level (off the quarters only). |
| **Complication** | What a window shows (date · day · am · pm · moon phase; **big date** = Date with its tick, stored as kind 4, R9), and its row's name on Windows (#328). Its buttons act as **tabs**, each keeping its own settings for the window; position shared. Here only a window's kind. Key stays `kind` (R8). |
| **Window** | A hole in the plate showing something, up to four, at 12 · 3 · 6 · 9; what shows is its **Complication**. Tab says Windows; key and number stay Date / 3 (R8). |
| **Font list** | Forty-two open-licence families (`web/fonts/`, via `web/fonts.mjs`, #313): Google Fonts, D-DIN, ten by Peter Wiegel. |
| **Font sheet** | Opens from the font in Type: fonts shown by numerals, search, **Add fonts** (Google, font URL, file, installed). **Light · Dark** pill (`--font-night`), kept per session; font boxes follow it (#276). |
| **Font box** | The box in Type (and date or day window panes): the font's numerals, the language button (**EN** while the font sets it, #273), name and colour, styles as **hanging tabs** (#275), Size, Tracking and axes rows (#274). |
| **Pointer label** | The name beside the pointer for the piece under it, which is outlined. |
| **Round ends** | A hand's `round`: corner radius of its flat ends. Marks use *Round outer* / *Round inner*. Okay's "round caps". |
