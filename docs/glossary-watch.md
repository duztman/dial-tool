# Glossary — the watch and the dial

What each word means **in this project**; Turkish where it is the trade word. One line per term: the meaning, the setting key, the place. The look to the pixel is in the code and `design.md`; the reason is the row in `decisions.md`. Tool and code words: [glossary-tool.md](glossary-tool.md). If a term is used differently in conversation, ask, then change the line.

## The watch

| Term | TR | Meaning here |
|---|---|---|
| **Dial** | kadran | The plate under the hands: the *plate*, its rings and the windows. |
| **Plate** | | The dial disc (`dial_d`, colour `c_plate`). |
| **Movement** | mekanizma | The mechanism behind the dial; not chosen yet. |
| **Hour / minute / seconds hand** | akrep / yelkovan / saniye ibresi | Each with its own shape and settings (`ha_hour`, `ha_minute`, `ha_second`). |
| **Tail** | | The part of a hand behind the pivot, mm. |
| **Counterweight** | | A disc on a hand's tail, centred at 73 % of it. |
| **Cap** | | The disc over the pivot (`ha_cap`, `c_cap`); part of the seconds hand; on the topmost hand only with **Cap on this hand** (`ha_cap_top`). |
| **Centre hole** | | The hole for the hand pipes (`dial_hole`, Ø mm; 0 = none); a production mask always has its cut line. |
| **Hub** | | The round boss at a hand's pivot (`hub`, Ø per hand; 0 = none). |
| **Disc hand** | | Hand shape `disc`: a disc on the pivot (`disc_d`) carrying one marker (`mark`, `mark_len`, `mark_w`), a **Hole** (cut) or a **Mark** (painted, `mark_c`) by `mark_as`; *Inside the disc* = `mark_in`. |
| **Bevel** | | A hand's two long halves lit and shaded, preview only (`bevel` per hand; strength `sh_bevel`). |
| **Track** · minute track · chapter ring | | The minute marks round the edge: a **ticks ring**; its rails thin **band rings**. |
| **Tick** | | One mark of a ticks ring. |
| **Railroad** | | Two thin rails along a track, ticks between: two thin bands. |
| **Marker** · index | endeks | A mark at an hour or any position, made by a **markers ring**. |
| **Numeral** | | A label at a position: Arabic, Roman, Eastern Arabic, Chinese, words, custom, or counted from a start. |
| **Sector dial** | | A dial split into zones of colour: band rings. |
| **Date window** · aperture | takvim penceresi | The hole showing the date disc; **aperture** = the hole, **frame** = its printed border. |
| **Beat** | | Seconds-hand steps per second: sweep, 1/s, 6/s, 8/s. |
| **Applied** vs **printed** | | Applied = metal parts fixed on; printed = ink or etch. The tool draws printed; applied as outline. |
| **Case** | | Preview-only watch round the dial: Dress · Field · Diver · Emre (`bezel`; Emre's key `emre01`), drawn by `watch.js`; on the dial side its **silhouette** (`ui_case`, off to start); never exported (R26). |
| **Strap** | | Show mode's alone: leather (`c_strap`), NATO (`w_nato`, stripes `c_nato`) or a bracelet (`strap`); never exported. |
| **Mirror** | | Flips the output for toner transfer. |
| **Production mask** | | Export mode: every ring solid black, no plate, no hands, apertures as outlines. |
| **Print sheet** | | Copies of the dial at true size on A4, Letter or A5 (Export → Print). |

## Rings

| Term | Meaning |
|---|---|
| **Ring** | One entry in the ring list: one thing repeated round the centre at its **positions**. Every dial element is a ring; unlimited. |
| **Kind** | What a ring repeats: **ticks**, **markers**, **numerals**, **band** or **text**; changed from the row's kind icon, settings kept. |
| **Text ring** | Kind `text`: a line of words at each position, own font, drawn like numerals; its Start snaps to other rings' indices within 2°. |
| **Radius** | Ticks, markers, bands: the **outer**, **middle** or **inner** end, by *resize from* (`from`). Numerals and text: the band's circle named by the **anchor**. |
| **Anchor** | Which circle of a numerals or text ring's band its radius is (`anchor`: Outer · Middle · Inner); that circle holds still when the size changes. |
| **Band** (of numerals) | A numerals or text ring's thickness: one cap height at its size; every label stands on its middle line. Not a **band ring**. |
| **Band** (ring) | Colour between the radius and radius − width; count 1 = full ring, more = **sectors** with **fill %**; width ≥ radius = **pies**. |
| **Sector colour** | A sector's own colour (`cs`), else the ring's; **Alternate** = two colours on odd and even. |
| **Positions** | **count**, **start °**, **span °**; a full turn spaces evenly, a partial span marks both ends. |
| **Every · Offset · Skip those** | Which positions are used: every n-th from the offset; *Skip those* inverts. |
| **12 o'clock · first position** | A markers ring's first position: same, double, triangle, none; and scale. |
| **Give way to rings above** | **Skip where** drops positions under chosen rings' marks; **Knock out** cuts gaps by the **clearance**; neither = **stack**. |
| **Clearance** | The gap a knockout leaves; the print-free zone round a window (`da_clear`, a window's `clear`). |
| **Taper** | A wedge's inner width as a fraction of its outer: 0 triangle, 1 bar, > 1 wider inside. |
| **Round outer / inner** | Corner radius at a mark's outer or inner end. |
| **Hollow wall** | Turns a mark or hand into an outline of that thickness. |
| **Placement** | How numerals sit: **upright** · **radial** · **radial, auto-flip** · **on path**. |
| **Nudge** | Per-position correction (*Edit one numeral* · *Edit one mark*): radius, angle, rotation, size, own shape, own font, own colour. |
| **Weight %** | Under Dial: every width at once, as **Scale everything** does every measure. Not a font's weight. |
| **Logo** | Planned (#72): an SVG placed on the dial, a ring in the list. |

## Hands

| Term | Meaning |
|---|---|
| **Shape** | baton · pencil · sword · dauphine · leaf · arrow · syringe · Breguet · lollipop · disc · file (imported; not built, #50). |
| **Tip length** | Length of the pointed end. |
| **Head width · ring/disc Ø · …at %** | The arrow head or syringe barrel width; the Breguet ring or lollipop disc Ø; where it sits, % of length. |
| **Round ends** | A hand's `round`: corner radius of its flat ends. Okay's "round caps". |
| **Fit to length** | An imported hand scaled so its tip reaches the hand's length; else **Scale ×**; **Width ×** stretches sideways. |

## Windows and complications

| Term | Meaning |
|---|---|
| **Window** | A hole in the plate showing something, up to four at 12 · 3 · 6 · 9; key and number stay Date / 3 (R8). |
| **Complication** | What a window shows: date · day · am · pm · moon phase; **big date** = Date with its tick (kind 4). Key `kind`. |
| **Window shape** | rectangle · circle · polygon · arch (moon) · half (am · pm) · arc (a ring piece); **Turned** = along its radius. |
| **Disc** | What turns under the plate and shows through a window: a band round the centre, or am · pm's small disc; edges as dashed guides. |
| **Neighbours** | A date or day window's tick: the disc's places either side of the shown one. |
| **Big date** | Two square holes, tens and units. |
| **Picture** | What a moon window shows: Arch, Phase or Line (`look`, shade `c2`). |
| **Physics** | Window tick: its disc must end inside the case; past it the guide shows red. |
| **The date** | The day shown (`date`), set in the bar; today until picked. A window that **follows the date** (`follows`) shows it; **Names** language and **Written** form (`day_form`, `own_names`); am · pm **Shows** disc or **Words** (`ampm_form`). One **moment** (`moment.js`) drives every complication. |
| **Live text** | Export option: text stays text in PDF/SVG; off by default — then **outlines**. |

## Type

| Term | Meaning |
|---|---|
| **Type** | Typography of a numerals or text ring: family, style, instance, language, size, tracking, axes, features. |
| **Family / style** | A family and its styles, from the **font list**, an added font, or the computer's (**Installed**). |
| **PostScript name** | One style's exact name (`Arimo-Regular`), stored in `ps`. |
| **Variable axis** | A continuous dimension of a variable font (`wght`, `wdth`…), a slider each. |
| **Named instance** | A preset point on a variable font's axes. |
| **OpenType feature** | A font switch (`tnum`, `onum`, `ss01`, `zero`…), named as the font names it. |
| **Language** | Language-specific forms (`locl`), e.g. Turkish İ/ı. |
| **Tracking** | Even letter spacing, in 1/1000 em (R11). |
| **Outlines** | Text converted to shapes: no font needed, not editable. |
