# DIAL TOOL

A watch-dial design tool for DrawBot on macOS. Guidebook · {{version}} · {{date}}

![A sector dial|A 270° scale|Imported marker and hand shapes](fig-dial-sectors.png | fig-dial-scale.png | fig-dial-files.png)

## What it does

- **Rings.** The dial is a list of rings — ticks, markers, numerals, bands of colour. As many as you like: reorder, hide, duplicate, rename.
- **Positions.** Any count, any start, any span. Every n-th. Scales and arcs.
- **Give way.** A ring can skip the positions of the rings above it, or knock a gap round them.
- **Type.** Any installed font, per numerals ring: styles, variable axes, OpenType features, language, tracking.
- **Hands.** Ten shapes or your own drawing. Lengths in mm, lume openings, counterweights; sweeping or beating seconds.
- **Files in.** SVG, PDF and AI shapes for markers and hands.
- **Files out.** PDF, SVG, PNG at any dpi, MP4, GIF — true size in mm. Outlines, or live text.
- **Production.** A one-colour print mask, mirrored for toner transfer, with the date aperture as a cut line.

## In one minute

1. Install DrawBot (free, macOS).
2. Open `dial.py` in DrawBot.
3. Press **⌘R**. Change anything; the preview follows.

> Everything is in millimetres. Angles are clock angles: 0° is 12 o'clock, growing clockwise.

## Typing numbers

Every number has a slider, a field and a stepper. In the field: `1.2` sets · `+0.5` adds · `x0.5` multiplies · `/2` divides. Typing past a slider's end extends the slider.

# INSTALL AND FIRST RUN

## Install

1. **DrawBot 3.132 or newer** — free, macOS only. `drawbot.com` → Download.
2. **dial.py** — `github.com/duztman/dial-tool` → `dial.py` → download the raw file. Branch `main` is released; `dev` is the newest work.
3. Open `dial.py` in DrawBot and press **⌘R**. The Dial Tool window opens.
4. Optional, for speed: DrawBot → Python → Install Python Packages → `skia-pathops` → Go.

Pressing ⌘R again replaces the window and keeps your settings. Quitting DrawBot keeps them too: the last session reopens next time.

## The window

![](fig-window.png){w=170}

| 1 | **Sections** — Dial · Rings · Hands · Date · Export | 5 | **Preview** — pinch or ⌘-scroll zooms, two fingers pan, Fit resets |
| 2 | **Ring list** — show · name (double-click to rename) · kind | 6 | **Time** — drag, or type `10:09:36`; Now; Play |
| 3 | **Add ring…** · Duplicate · Delete · Up · Down | 7 | **Guides** — construction circles, never exported |
| 4 | **The selected ring's settings** — one scrolling list | 8 | **Status** — ring · font · diameter · build and frame time |

# RINGS

The dial is a list of rings. Each ring repeats one thing around the centre, at its positions. The list order is the stacking order: the top ring is drawn last, in front.

![Minute ticks|Markers|Numerals|= the dial](fig-ring-ticks.png | fig-ring-markers.png | fig-ring-numerals.png | fig-ring-all.png)

## Kinds

| **ticks** | the minute track, dots, a crosshair |
| **markers** | bars, wedges, dots or your own shape; a special 12 o'clock (double, triangle, none) |
| **numerals** | Arabic, Roman, Eastern Arabic, Chinese, words, numbers from a start, or your own list |
| **band** | a ring of colour; sectors; pies to the centre |

Change a ring's kind at any time — its settings stay. **Radius** is the outer edge (numerals: the text's centre).

## Positions

- **Count** — how many. **Start °** — where the first sits. **Span °** — 360 for all round; less makes an arc with both ends marked.
- **Every** n-th, from **Offset**. **Skip those instead** turns it round. Cardinals: every 3. The other hours: every 3, skip those instead.

## Give way to rings above

- **Skip where** — leave out positions where markers, markers & numerals, or any marks above already sit.
- **Knock out** — cut a gap of **Clearance** mm round markers, numerals, or everything above.

## Recipes

- **Railroad track** — ticks (count 60), and two thin bands: one at the ticks' radius, one at radius − tick length + band width.
- **Fifths of a second** — ticks count 60 above ticks count 300; the 300 skip where: all marks above.
- **Minute numerals 05 … 60** — numerals, labels Numbers, first 5, step 5, digits 2, start 30°.
- **Sector dial** — a band with count 12, every 2, band width = radius: alternate pies.
- **A 270° scale** — numerals count 10, start −135°, span 270°, Numbers from 0, step 10.
- **A gap round numerals on a band** — band below the numerals; knock out: markers & numerals above.

# HANDS, TYPE, FILES

## Hands

Choose Hour, Minute or Seconds, then a shape. Lengths are millimetres from the pivot.

![](fig-hands.png){w=170}

Each shape adds its own controls: tip length, head width, ring or disc and where it sits. **Hollow wall** cuts a lume opening; a **counterweight** fits any tail. Seconds move as a sweep, quartz (1/s), or 6 or 8 beats per second.

## Type

Each numerals ring has its own type: family → style → named instance; variable axes as sliders; OpenType features with the designer's names; language (Turkish İ ı); tracking in 1/1000 em, like Illustrator. The date window uses the top numerals ring's type.

## Files in — SVG · PDF · AI

- Draw pointing up (12 o'clock). The artboard's centre is the anchor: a hand's pivot, a marker's centre.
- Black is ink. White shapes cut holes. Strokes become outlines.
- Outline text first; images and gradients are skipped, and the Export log says so.
- Save AI files with "Create PDF Compatible File". For hands: **Fit file to length**, or **Size ×**; **Width ×** stretches.

## Files out — the Export section

| **PDF** | vector, true size in mm — Illustrator, print, the press |
| **SVG** | vector, true size — Illustrator, laser, the web |
| **PNG** | raster at the dpi you set — previews, film for toner transfer |
| **MP4 · GIF** | the hands moving from the set time — Clip seconds, Frames per s |

- **Production** — one-colour mask: no plate, no hands, the aperture as a cut line.
- **Mirror** — flipped, for toner transfer.
- **Live text** — numerals stay text in PDF and SVG. Off by default: outlines need no fonts and print exactly as seen.
- **Settings** — Save… and Load… a `.json` of everything; Defaults starts over.

# NOTES · FAQ · HELP

## FAQ

- **Where are my settings?** In `~/Library/Application Support/DialTool/last.json`, saved as you work. Export → Save… keeps a named copy.
- **I changed the diameter and nothing moved.** Radii and hand lengths are millimetres from the centre, as on a real movement. A "scale everything" action is on the list.
- **Outlines or live text?** Outlines, unless you need to edit text later. With live text, Illustrator may still outline numerals that use ligatures or alternate glyphs, and on-path numerals become one text per letter.
- **Which fonts can I use?** Any font installed on the Mac. There is no fonts folder.
- **A ring disappeared.** Check its show checkbox, its Every and Offset, and whether it skips positions a ring above takes.
- **A numeral is missing at the date.** Markers and numerals leave the date's position empty, and all print keeps the Print clearance from the hole.
- **How do I start over?** Export → Settings → Defaults.
- **Canvas or PDF?** The switch under the preview. Canvas is fast and sharp; PDF is DrawBot's own viewer, the reference. They should look the same.
- **Do my beta 1.0 files still open?** Yes — they open as rings, unchanged.

## When something goes wrong

1. Open the Export section and read the log. At launch it says `preview: canvas` and `all controls connected`.
2. Send a screenshot and the log.
3. If the window doesn't build at all, run `tools/dial_probe.py` in DrawBot and send its report.

> Draw at true size. A 30 mm dial at 600 dpi is 709 pixels across; thin lines need room: check the thinnest one at 100 % before you etch or print.

## Where things live

- **Code and docs** — `github.com/duztman/dial-tool` (`main` released · `dev` in progress).
- **Claude Project "Dial Tool"** — reads the same repository.
- **This guide** — `docs/guide/guide.md`, built by `tools/make_guide.py` into `docs/Dial-Tool-guide.pdf`, updated with each release.
- **Words** — ring, kind, positions, give way, band, nudge: `docs/glossary.md`.
