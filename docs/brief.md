# Dial Tool — brief

*Started 3 Oct 2026. Last updated 12 Oct 2026 (web version, beta 4.4, on `dev`). Before: 11 Oct 2026 (web version, beta 3.0); 4 Oct 2026 (beta 2.3 on `dev`: preview plan built, Mac check pending — `docs/preview.md` §6).*

## 1 · Goal

A tool to design watch dials for a watch Okay will actually build. One tool, four jobs:

- **Explore** — sketch variations fast, test proportions.
- **Present** — clean vector sheets, animated loops (moving hands), variation grids.
- **Produce** — files that go to real production: etched brass (toner transfer), pad or screen printing, laser.
- **Learn** — Okay learns the concepts of generative design along the way (concepts, not syntax).

Not photorealistic. Real proportions and perfect vector rendering are.

## 2 · Context and constraints

- Okay: graphic designer; uses Illustrator daily, also InDesign, After Effects, LightBurn. Comfortable with code; wants to understand what it does.
- Machines: Macs, both Apple Silicon and Intel, not always the latest macOS; iPhone and iPad as viewers. As of 4 Oct 2026 both Macs run macOS 15; the Intel one has integrated graphics — the slowest machine to test speed on.
- Existing practice: prototyping dials by acid-etching brass blanks with toner transfer (PnP Blue film). Pad printing is the industry pipeline.
- Materials and parts are sourced locally: don't plan around ordering from abroad (books excepted).
- The movement is not chosen yet — design first, then pick a movement that fits.
- **Production doesn't limit design** (Okay, 4 Oct). The production outputs stay and grow, but what the tool can draw is not narrowed to what a method can print; production-specific checks and outputs are optional layers on top.

## 3 · Outputs

| Output | Format | Notes |
|---|---|---|
| Design / present | PDF, SVG → Illustrator | True size in mm; numerals as outlines |
| Motion | MP4, GIF | Hands from the set time, sweep / quartz / 6 or 8 beats per second |
| Production mask | PDF, SVG, PNG (dpi set) | Mono, optional mirror for toner transfer, aperture outline |

Imports: SVG, PDF and AI (PDF-compatible) files as marker and hand shapes (rules R23).

## 4 · Decisions

| Date | Decision | Why |
|---|---|---|
| 3 Oct | Build in **DrawBot** (Python, macOS) | Best-in-class type: CoreText, OpenType features, variable fonts, outlines; PDF/SVG/MP4/GIF export in one place. Browser tool and Illustrator script were the alternatives. |
| 3 Oct | v1 does **geometry and division** first | Okay's pick; everything else hangs off it. |
| 3 Oct | Scope v1: a **regular watch + date window**; subdials, apertures, sectors later | Keep the first version pure. *Sectors arrived 4 Oct as band rings.* |
| 3 Oct | All **collision rules** stay available: one ring, skip, knockout, stack | Different dials need different rules. *Superseded 4 Oct by skip where / knock out per ring; every old rule still reachable.* |
| 3 Oct | Numeral placement: upright, radial, radial auto-flip, on path; any label set; each numeral movable | "The whole shebang" — words, Chinese, Eastern Arabic, custom. |
| 3 Oct | Everything is a **filled shape**, no strokes | Exact widths in Illustrator; clean masks for etching and print. |
| 4 Oct | Own **vanilla window** instead of DrawBot's `Variable()` panel | `Variable()` is a fixed 250 px column, one control per row — no slider + number field, no sections, no conditional rows (read in DrawBot's source). DrawBot's own window is vanilla + `DrawView`; the DrawBot devs point users there. |
| 4 Oct | **vanilla only** — no RoboFont, no ezui | Okay: only DrawBot. ezui has no public source we could find; it ships inside RoboFont. |
| 4 Oct | **System fonts** via macOS's font manager: family → style → named instance. No fonts folder. | Okay: no folder. DrawBot reads axes and features from installed fonts by name. |
| 4 Oct | Section switcher (segmented control) instead of vanilla **Tabs** | Tabs run on Apple's tab view controller, which shrank to fit auto-layout content — the probe showed a collapsed panel. |
| 4 Oct | Tracking in **1/1000 em** | Same unit as Illustrator. |
| 4 Oct | Typed numbers accept `1.2`, `+0.5`, `x0.5`, `/2` | Matches how Okay describes changes. |
| 4 Oct | Settings are one dictionary, saved as JSON; last session restored on launch | Presets for free; re-running keeps work. |
| 4 Oct | Project set up: GitHub `duztman/dial-tool`, Claude Project "Dial Tool"; Mac folder later | Okay. |
| 4 Oct | **The dial is a list of rings.** Everything in the list is a *ring* (Okay: "rings instead of layers, all round"). Kinds: ticks, markers, numerals, band. Unlimited; select to edit; add, duplicate, delete, move up/down, hide, rename. | Fixed sections allowed one track, one marker set, one numeral set. Rings let any number of each be stacked (minute numerals, scales, rails, zones). |
| 4 Oct | A ring's **kind** can change later; every ring carries every setting, so nothing is lost. Word: *kind*, not *type* (type = typography). | Okay. |
| 4 Oct | **Type belongs to each numerals ring.** A new numerals ring copies the top one; the date window uses the top numerals ring's type. | Okay: "type specific to that ring". Date has no font of its own yet (build list #34). |
| 4 Oct | **List order = stacking order.** Each ring chooses how it gives way to the rings above: *skip where* (markers / markers & numerals / all marks above) and *knock out* (same choices, or everything above) with a clearance. Replaces beta 1.0's four collision rules. | One mechanism for every pair of rings. beta 1.0 dials convert exactly: 11 test dials, zero area difference. |
| 4 Oct | **Positions:** count, start, span, every, offset, skip those instead. Partial spans mark both ends. | Replaces fixed divisions and "show at" lists; gives scales and arcs for free. |
| 4 Oct | **Surfaces: flat colour for now** — band rings make full rings, sectors (count · every · fill %) and pies. Finishes (sunray, grain…) later. | Okay: "flat, for now; designs later". |
| 4 Oct | **Hands:** each hand has its own shape and settings, in mm (R1): baton, pencil, sword, dauphine, leaf, arrow, syringe, Breguet, lollipop, or a file (SVG/PDF/AI) with fit to length, size ×, width ×. Hollow wall and counterweight on any hand. | Okay: "more sensible options, able to import (pdf), size, change shape". Lengths in mm match how movements specify hands. |
| 4 Oct | **PDF/AI import** reads the page's drawing operators with macOS's own PDF scanner (CoreGraphics `CGPDFScanner`, via pyobjc). | No PDF library ships with DrawBot; pyobjc supports the scanner callbacks (checked in pyobjc's tests). The drawing logic is Mac-free and tested in the harness. |
| 4 Oct | **Ring settings: one scrolling list**, not pages. **Guides** checkbox under the preview. **Regular-size controls**; panel 470 px. **Tab titles left-aligned.** | Okay, after beta 2.0: pages felt fragmented; guides needed from every section; type too small. |
| 4 Oct | **Live text** is an export option; **outlines stay the default**. | Okay. Outlines need no fonts and print as seen; live text keeps numerals editable, with Illustrator's limits (§5.2). |
| 4 Oct | **Guidebook**: a 5-page PDF in IBM Plex Mono — what it does, install, files in and out, FAQ — built from `docs/guide/guide.md` by `tools/make_guide.py`, updated with each release (R25). *Redesigned the same day, see below.* | Okay: "a guidebook that gets updated, part of the project". Source and script in the repo so any agent can rebuild it; figures come from dial.py itself. |
| 4 Oct | **beta 2.2 released to `main`.** | Okay: "we have beta v2 here" — beta 2.1 ran on his Mac. |
| 4 Oct | **Repository public, MIT licence** (fonts stay SIL OFL). City and machine details trimmed from the docs first. | Okay. |
| 4 Oct | **Preview plan** (`docs/preview.md`): draw the preview with Core Animation from one scene shared with export; a display-synced frame clock; the PDF preview kept as a switch and fallback; skia-pathops optional. Runs when Okay says *"run the preview plan"*. | Okay's complaints after beta 2.1: flashing, lag while dragging, blur while zooming. Causes found in DrawBot's source and Apple's docs (PDF document swap; scroll-view magnification; `booleanOperations` 2–14× slower than skia-pathops, measured with `tools/bool_bench.py`). |
| 4 Oct | **skia-pathops** for shape combining, installed per Mac through DrawBot's package menu; the tool falls back to DrawBot's own if it's missing. **Canvas** is the preview at first launch; PDF stays a switch. | Okay. Shape combining is 2–14× faster and matches the harness; reversible by uninstalling. Canvas fixes flash, lag and blur; PDF remains the reference. |
| 4 Oct | **beta 2.3 (on `dev`): the preview is drawn by Core Animation from one scene** shared with export (R26); a frame clock draws (R28); the PDF preview stays as a switch and automatic fallback; skia-pathops is used when installed. `main` stays at beta 2.2 until Okay's Mac check. | Okay: "run the preview plan". Built as planned; differences from the plan are listed in `docs/preview.md` §12. |
| 11 Oct | **MP4 · GIF are rendered at a chosen pixel size** (`out_px`, "Clip size px", 1080), always even. | Okay: "mp4 export does not work". Cause read in DrawBot 3.132's source: clips come out at 72 ppi and MP4 refuses odd pixel counts; his 33.5 mm dial made 111 px frames. Not yet seen on a Mac. |
| 11 Oct | **A web version** (`web/`, beta 3.0): the same settings, geometry and scene in a browser, built to one HTML file. Not p5.js: the preview is SVG, shapes are combined by PathKit (Skia), text is shaped by HarfBuzz. `dial.py` stays in the repo; whether it is kept up is open (§5.11). | Okay: "can we do this with p5js? on a modern browser? … if answers are yes go." Asked for round ends on everything and a click on the preview that opens the clicked part's settings. Checked first: HarfBuzz in the browser does kerning, OpenType features, variable axes, collections and the designer's feature names (run here on Lora, Inter, Noto CJK); Chrome and Edge can read installed fonts (Local Font Access; not Safari or Firefox). Unlike DrawBot's window, a browser page can be run and looked at before handing over. p5.js draws to a bitmap canvas and has its own, thinner text engine — the wrong tool for true-size vector files and type. |
| 11 Oct | **Round ends.** Marks: `round_out` / `round_in` at half the width or more already make a round end (in `dial.py` too); the web version adds a "Round both ends" button. Hands: new key `round` in each hand (web version; `dial.py` ignores it). | Okay: "I need round caps on everything. Minute markers, hands." |
| 11 Oct | **Click the preview → that part's settings** (web version): a ring, a numeral (also picks it for Nudge), a hand, the date window, the plate. A click beside a thin tick takes the ring whose mark is nearest. | Okay. |
| 11 Oct | **The web version is online** at https://duztman.github.io/dial-tool/ (GitHub Pages, `gh-pages` branch). **No MCP server.** | Okay: "No need for mcp since we are on github. Can I get it online working somewhere? Under GitHub?" A web address also gives the browser a normal site to ask the fonts permission for. |
| 11 Oct | **A dial is a link** (web version): the address after `#` is the whole dial — the settings that differ from the start, compressed. The address bar follows every change; *Copy link* in Export; opening a link opens that dial; Save… / Load… stay for files. Fonts travel by name only. Starting values are frozen from now on (R31). | Okay: "can we make a url system on this to denote a full build, instead of saves of dials?" Nothing is stored anywhere: the link is the dial, so it can't expire. Okay's `dialx` is 325 characters after the `#`; the starting dial 7. |
| 11 Oct | **The web version carries its own fonts**: twenty open-licence families (list in `web/fonts.mjs`, kept at 20), served from the tool's own site, shown in a picker by their numerals. | Okay: "can we get lists from google fonts at least? think of other open source fonts… routed gothic being one… limit to 20… better font selection ui with preview, remove drop downs". Own copies, not links to other sites: a dial's link must keep working. Peter Wiegel's fonts (Okay's pointer) are left to *Add font file…* until their licence files are read. |
| 11 Oct | **Windows**: up to four apertures; kinds date · day · am–pm · moon phase. | Okay: "give me an option to add second…4th date windows… am-pm indicator, moon phase. only 4 options for now, find the 4th." The fourth is the day of the week: with the date it is the commonest pair on a dial. |
| 11 Oct | **Guides**: a box at the top right that only switches them (Okay, later the same evening: "guide box clicking toggles only"); their colour, strength and thickness are a group in Dial. **Tabs:** Dial · Rings · Hands · Windows · Export; larger, a sign in a ring. **Rings are dragged** to reorder. **Pointer label** on the preview. **Five examples** under Export. | Okay, same evening, from screenshots. |
| 11 Oct | **Panel, beta 4.0** (web version): a toggle column and six equal columns; a thick line opens a pane, hairlines inside; an **eye** in the toggle column folds a pane (open / closed with lashes) and, in the ring list, shows or hides a ring; renaming only through the **rename box** on the selected ring; choices as picture tiles; a colour picker (field, hues, RGB / CMYK, hex to copy); OpenType tiles in three groups. | Okay's proposal picture and marked-up screenshots: "clicking anywhere tries to rename… a cursor icon with a rounded box… show toggleability of hiding on leftmost column… thin thick lines, equal widths, column logic, more breathing space"; asked what the eye does: "Folds the pane". |
| 11 Oct | **Live text in the SVG** is an export option in the web version too (`out_live_text`); the PDF stays outlines for now. | Okay: "FONTS LIVE!"; asked which files: "SVG now, PDF later" (build list #63). |
| 11 Oct | **Editing on the preview is parked**; the panel keeps the detailed settings. | Okay: "more visual editing tools: handles, movers, shifters… keep detailed options on left column. Park now" (build list #61). |
| 11 Oct | **Bar and Guides switch, beta 4.1** (web version): the bar is light grey, in three parts (selected · time · view), on the panel's columns; Play can run at 1×, 60× or 720× (not saved with the dial); − + zoom buttons; the Guides switch is a rounded box with a bullseye, filled when on, dashed outline when off. | Okay: "Lighter gray, better organization, better usability. Add a fast time option… bullseye with lines, rounded corners, on/off distinct… Columns? They fit 'em". |
| 11 Oct | **beta 4.2** (web version): bar a middle grey; time controls under the panel on its six columns, low contrast; the day slider has steps a click snaps to (the hours and 10:10); lines run from margin to margin over the eyes (one margin, 24); rename box light and thin. | Okay: "bar color went too light. Darker. Under left column have the controls. Day slider has steps that clicking snaps to. 10:10 is a special one… lines extend on top of eyes… cursor icon much lighter and thinner strokes." |
| 12 Oct | **beta 4.3** (web version): the bar is 80 % black with light controls; each ring in the list is a framed row; what is selected is light blue, not yellow. | Okay's drawing on the ring list: "frame layers", "light blue"; "Yet darker bottom bar, 80% black. Invert appropriate". |
| 4 Oct | **Guidebook redesigned**, then made landscape in a Swiss, catalogue manner (Okay: "think Braun catalogs… grid system… no visual fluff… redrawn UI"): 23 pages, 12-column grid, cover with contents, controls redrawn from `dial.py`'s own row descriptions, one classic per page, more figures, nine classic dials with real values and presets. Type: **Recursive Sans + Mono** (Okay asked for Input; it isn't on Google Fonts and its free licence is for private use only, so Okay chose Recursive). Built from HTML through Chromium. Off-Mac renders use open stand-ins for the macOS fonts the dials name. | Okay: "a better pdf… panels, details, helpful, nicer dials, real-world classics, examples with real values". |
| 4 Oct | **Design canon** (`docs/design.md`, R29) and the guidebook's third edition built on it: one sans like Univers (Inter, open licence), no mono, dark cover, grey redrawn window at true proportions, better contrast and sizes. The canon also lists ideas for the tool's own window (§8) — not decided. | Okay: "research Braun catalogs and instruction guides… Lupton… a sans like Univers, scrap the mono… better cover, darker… UI: more detail, grayscale, right proportions… let's make it canon". |
| 4 Oct | **Guidebook, fourth edition; canon revised** (`docs/design.md` §2–§5): unit 1.375 mm (text leading −8 %), leads and titles +3 % (12.4 / 31 pt), no accent colour, one large annotated example per topic then thumbnails, line icons, "Watch" notes, classic pages 8 · 4. | Okay: "line height … down just a little bit, larger text up just a little tiny bit … less white space … a few examples larger, then smaller … line drawing icons, no red dots … what to point out, what to warn about". |
| 4 Oct | **Guidebook, fifth edition; canon revised again** (`docs/design.md` §1, §3–§5, §7). Source split into `docs/guide/pages/` + `style.css` + `icons.svg` with short tags and a per-page build that measures its own mistakes. 12 × 14 grid (rows added); grounds only where a picture needs an edge; plain plates as hairline circles; construction/finished cover; thumb index; every setting in tables printed from `dial.py`; a Find it index. 28 pages. | Okay: "you struggle on creating the guide.html. Make it easier… add horizontal alignment… some illustrations are allowed backgrounds. Where it's needed? Reason… a more creative cover… check teenage engineering, they have loads of data… what can you push?" |
| 4 Oct | **Guidebook, sixth edition** (`docs/design.md` §2, §4, §5): grounds back behind every picture (the fifth edition's "only where needed" withdrawn); one colour, signal yellow `#F5C518`, as the plate of every plain figure; three type sizes, 8 · 10 · 32 pt. | Okay: "Bring back the backgrounds. Blocks seem better aligned that way. Add bg (dial) color to the cropped out blocks. Select a characteristic color like teenage eng… overall larger type, fewer type sizes." |
| 4 Oct | **Guidebook, seventh edition** (`docs/design.md` §4, §5): a pale colour per section instead of one yellow; cover with the whole dial on two fields and a 96 pt title; Start icons on one outline; picture labels checked against their backgrounds. | Okay: "Yellow is lovely. Start with that but revert to paler, less contrasty to bg color palette. Every section gets own color. Cover: do not crop dial. Minimal padding, fit big and add bg to either half. Larger title. Start section: redraw icons more uniform… Some text got bgs. Check and refine." |
| 4 Oct | **No Mac check.** beta 2.3 is treated as working; the guide describes it as such (the "not opened on a Mac yet" note is gone). `main` is still beta 2.2: releasing 2.3 is Okay's call. | Okay: "No mac check. Trust as if. This pdf will guide the future." |
| 4 Oct | Interface checked off-Mac with **`tools/ui_smoke.py`**: stand-ins that accept only vanilla 0.5.0's real signatures and methods. | The full window can't run off-Mac; this catches wrong calls and lost callbacks (it reproduces the beta 1.0 dropdown bug when R22 is removed). |
| 12 Oct | **Web version, beta 4.4: the review.** Rows stay when the preview is clicked; sections keep their scroll; panes slide. The stylesheet is layers and tokens (rule R32). Sliders are a black disc on a thin track; tick boxes are square; things on the scrolling grey are paper-light. | Okay: "Code review time. All on the table", then "All good 1-4", "redesign sliders like this" (a sketch), "Bg color created clashes, look around." |
| 12 Oct | **Files (web version):** the PDF has a named layer per part and writes a production mask in grey ink; the PNG carries its dpi and a mask's is on white; SVG shapes are named plainly; file names say size and day (`dial-30mm-2026-10-12.pdf`). | Part of the review Okay approved. The file-name pattern is Claude's proposal, not yet confirmed by Okay (build list #68). |
| 12 Oct | **`dial.py` is frozen.** Work goes into the web version only; new settings keys need no counterpart in `dial.py` (R30 reworded). | Okay: "Do not work on dial.py anymore, we're on github." |
| 12 Oct | **Web version, beta 4.5: the Dial tab.** Panes Dial (diameter, plate, background) and Page (margin, backdrop). A hairline before and after every row: white on the grey, the grey on paper. | Okay's usability review, "one tab at a time": "Page margin and backdrop are a separate group… These gray lines I drew before and after every value. They come in. 1px white for this light gray bg. On white, this bg color." |
| 12 Oct | **Guides: a switch on the preview's top right**, its colour following the backdrop; its list drops from it: one row per kind of guide (five), an eye and one of eight fixed colours each, Reset. No colour picker for guides. | Okay: "Remove guides from under… Guides come in 8 different colors, neons mostly, but darks and lights if needed. Add a button to reset." Then: "No picker on guides. Eight colors, they may share. Guides button move over to the canvas top right… Adjust color with bg, dark bg inverts." One row per kind (not per ring): Okay's answer to the question. |
| 12 Oct | **Colour: one pop-out**, at the right of the swatch, draggable, widening over the preview. Rows: on this dial · palette of ten that can be added to. Field and hues sized for a finger. RGB · CMYK · HEX and COPY on one line, boxed capitals. | Okay: "Make it a tab popping up from color swatch. First row: on this dial, second row, 10 preselected. Add color to palette adds to this 10… Gradients better navigable by finger on iPad. RGB CMYK hex colors smaller, fit in one line bottom including copy, all boxed uppercase, like buttons. Compact. Expandable to cover the canvas. Appear on the right of swatch." Dragging and the − are Claude's additions, said to Okay before building. |
| 12 Oct | **Planned next, agreed:** step 2 — a toggle to scale the contents with the diameter; a colour per sector of a band ring, with a Colours pane on Dial. Step 3 — a **logo**: an SVG placed with the mouse, which is also a ring (editable in Rings "differently"), with a link from Dial to it. **A background image is not being built now** (only its button); when it is, one image with an *Include in export* switch. | Okay: "Each sector its own", "Both, with a switch", then "No background image functionality now. Just the button. Remove svg and call it logo. Let mouse place it. This is also a ring!! Editable through there also, differently. A link from this menu sends you there." |

## 5 · Open questions

1. **Movement** — which one? It fixes the real dial diameter, hand lengths, the date window's position and size (date wheel), and the feet positions.
2. ~~**Live text vs outlines**~~ — settled 4 Oct: outlines by default, live text as an option (beta 2.2). Background: DrawBot writes real text to PDF when drawing a `FormattedString`. Limits found 4 Oct: Illustrator outlines or rebuilds text with ligatures/alternate glyphs when it opens a PDF; the font must be installed where it's opened; on-path numerals become one text object per letter; knockouts and the date clearance would have to become clipping masks; production masks stay outlines.
3. **Minimum line width and clearance** per production method (toner-transfer etching, pad print, laser). Should become rules the tool can warn about.
4. **Eastern Arabic and Chinese labels** — which fonts; is CoreText's automatic fallback good enough, or do we need a fallback-font control?
5. Does DrawBot's SVG import into Illustrator at **exact size**, and with usable groups?
6. When `dial.py` grows, split it into modules or keep one file? (beta 2.3: about 2,700 lines, still one file.)
7. **Should rings and hands scale with the diameter?** Radii and lengths are absolute mm (R1), so changing the diameter leaves them in place — right for a fixed movement, awkward while exploring. (Build list #32.)
8. **PDF import with real Illustrator files** — forms, compound paths, white made in spot or CMYK colours. Tested only with hand-written operators so far. (Build list #30.)
9. **Preview drawing** — do Core Animation shape layers draw fine lines (0.12 mm ticks) as the PDF does? Apple says shape rasterization "may favor speed over accuracy". Built in beta 2.3; **still open until the Mac check** (`docs/preview.md` §6 step 5: also look at whether curves stay smooth when zoomed); contingency in §8.
11. **One tool or two?** With the web version (11 Oct), is `dial.py` kept up, or frozen at beta 2.3 as the reference the web version is checked against? Until Okay says: new features go to the web version only; `dial.py` gets fixes.
12. **Installed fonts in the web version on Okay's Macs** — not yet tried there: does Chrome list Helvetica Neue (a collection file) and do the numerals match `dial.py`'s? (Build list #49.)
10. ~~**skia-pathops**~~ — settled 4 Oct: yes (§4).

## 6 · Avenues (ideas, not commitments)

- Subdials (small seconds, chronograph registers), day/date apertures — perhaps as further ring kinds.
- Surface finishes on bands: sunray, grain, guilloché (Okay: later).
- Per-ink separations: one production mask per ring colour (pad printing etches one plate per colour).
- Variation grid: one rule set, many dials on one sheet.
- Spec sheet export: dial with dimension callouts for suppliers.
- More hand styles: cathedral (file import covers it now); lume plots.
- Plotter output via LightBurn for the pen plotter (AxiDraw clone).
- Production warnings: flag lines thinner than the method allows.

## 7 · Workflow

1. Okay runs `dial.py` on a Mac and reports back with screenshots and the Export log.
2. Claude changes code, tests geometry with `tools/test_harness.py` and the interface with `tools/ui_smoke.py`, checks UI calls against vanilla/DrawBot source.
3. Work happens on `dev`; a tested version is merged to `main` with a changelog entry.
4. When the interface misbehaves at its foundation, run `tools/dial_probe.py` and paste its report.

## 8 · Parked

- Mac folder set-up — Okay will ask when it's time.
- Editing on the preview (web version) — handles, movers, shifters on the dial, after Illustrator's radial Repeat and Gradient tools; detailed settings stay in the panel. Parked by Okay on 11 Oct 2026 (build list #61); the panel's controls come first.
- ~~Browser version of the tool — DrawBot chosen for type.~~ Built 11 Oct 2026 (`web/`, §4): HarfBuzz gives the browser the type control DrawBot was chosen for.
- drawbot-skia (cross-platform DrawBot) — test harness only; it lacks much of DrawBot's text engine.
- ezui (RoboFont) — not available without RoboFont.
