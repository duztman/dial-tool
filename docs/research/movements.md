# Movements — the numbers a dial inherits from its calibre

*10 Nov 2026. Research for #586 (Choose your movement). Written for the agent that builds it. Nothing here is built. Index of all research: `README.md` beside this file.*

## 1 · What the feature is (Okay, 10 Nov 2026)

"Choose your movement. 5 most popular movements, their capabilities are available as defaults … and we'll have one imaginary movement that can do any and all." Answers the same night: popular for **microbrands and modders**; a real movement **sets defaults and removes what the calibre can't drive** ("Any" is the escape hatch); the data is **capabilities and deep geometry — minimum case height, hand heights and their possibilities**. Then (22:53): "Movement wise let the last two give variety. A quartz? Small movement?" — so the two non-standard slots are a quartz and a small calibre; the large small-seconds 6497 becomes a spare.

Settled (23:04): "Not greys out, removes them" — a real movement **removes** what the calibre can't drive, as R16 says (hidden, not disabled); Any shows everything.

## 2 · The five, and why

| # | Calibre | Family (same footprint, other displays) | Why it is in |
|---|---|---|---|
| 1 | **Seiko/TMI NH35** | NH36 day-date · NH38 no date · NH34 GMT · NH70/72 skeleton | The modder's movement; the largest parts ecosystem; "the most widely used OEM automatic in the world" (usamodwatch). |
| 2 | **Miyota 9015** | 9039 no date (lower hands) · 9075 true GMT · 90S5 open heart | The microbrand staple 2010–2020 (Halios, Farer, Nodus, Lorier, Brew); 3.90 mm thin. |
| 3 | **Sellita SW200-1** (= ETA 2824-2) | SW220-1 day-date · SW330 GMT · ETA 2836-2 | The Swiss standard; the only one with a public dial drawing and an eight-row hand-height table. |
| 4 | **Ronda 715** (quartz, 11½''') | 715 two-hand version · 714/712 · 715 date at 4 or 6 | The quartz: 2.50 mm, 2 or 3 hands, date at 3 · 4 · 6 — the microbrand quartz staple, same dial as the Swiss automatics. |
| 5 | **Sellita SW100 a** (= ETA 2671; small automatic, 7¾''') | SW100 b no date · ETA 2671 | The small one: 17.2 mm, 4.80 high, date at 3, hands 1.20 · 0.70 · 0.20 — the ladies'/small-case automatic (Toledano & Chan B/1, Tudor T201, Longines L561). |

Spares in the record, not shown in the tool unless Okay says: **Miyota 2035** (small quartz, 6¾ × 8''', the most-produced movement ever, 2 or 3 hands, no date), **ETA/Unitas 6497-1** (36.6 mm, small seconds at 9, no window), **Miyota 8215** (the budget automatic; v1.1.64 already uses its hand heights).

Source for popularity (secondary, written for buyers, not for this purpose): usamodwatch ranking (2026), watchpolice calibre notes, aigitime (2026), underdial (2026), sugargoo (2025). All agree on NH35 · 9015 · SW200-1 as the three; 6497 and a quartz are Claude's picks for coverage, to confirm.

## 3 · What a movement decides on the dial

Tool-side, a movement is a bundle of defaults and limits for keys that already exist:

| Dial thing | Keys today | What the calibre fixes |
|---|---|---|
| Plate size | `dial_d` | Casing Ø → the dial Ø the trade uses (NH35 28.5; 11½''' 28–29; SW100 ≈ 19–20 (I); 6497 34.5–37) |
| Centre hole | `dial_hole` | Hole Ø (Sellita 2.00; NH34 GMT 2.7) |
| Hand holes | `HOLE_FIT` (1.50 · 0.90 · 0.20) | Per calibre, see §4 — the tool's constant is NH35/ETA's; Miyota and Ronda differ |
| Hands present | `ha_second` shown or not | Central seconds (1–5) · none (Ronda 715 two-hand, Miyota 2035's 2025) · small seconds at 9 or 6 (spare 6497 / 6498) |
| Functions (#577) | the + after the hand tabs | GMT only where a 24 h wheel exists (NH34, 9075, SW330); Date/Day/Month *hands* exist on none of the five — they are disc-driven (window) calendars |
| Windows | up to four at 12 · 3 · 6 · 9; `kind` date · day · am·pm · moon | Date at 3 (all with date); 6 by special order (NH35 6H, 9015 date-at-6, Ronda 715 D6); 4–4:30 by crown position (NH35 3.8/4.1 cases, Ronda 715 D4); day only on NH36 (day over date at 3, or at 9/12 by dial cut); am·pm, moon on none |
| Disc geometry (the Physics tick) | the disc's edges as guides | Numeral centre radius and aperture — documented for SW200-1 only (§4) |
| Hand heights (#584 `data-over`) | hand height over the plate | Per calibre, §4 — the 3D exercise reads these |
| Case floor | — (new) | Movement height + dial + hands + crystal: a minimum case height the Show Case could show |

The "Any" movement: every limit off, defaults as today.

## 4 · The numbers

Legend — **D** documented by the maker's sheet or a drawing of it; **T** trade figure (dealers, mod shops, parts catalogues: reliable, not from the maker's drawing); **I** inferred by Claude from documented numbers; **?** not found. Dial thickness is 0.40 mm everywhere unless said (Sellita "appui de cadran 0,40"; NH35 "0.4 mm, 0.6 practical ceiling" — Lucius Atelier).

### 4.1 Seiko/TMI NH35A (NH36 · NH38 · NH34 share the footprint)

Read from TMI's own *Watch Movement Specification and Drawing* NH35A (11 pages, version 1, revised 16 Nov 2022; timemodule.com/upload/category/24/spec_sheet/NH35_SS.pdf), screenshotted by Okay on 10 Nov 2026. The drawings are in 1/100 mm; below in mm. Everything in this table is **D** unless tagged.

| | Value | Where on the sheet |
|---|---|---|
| Outside Ø · casing Ø | 27.40 ±0.03 (main plate) · 29.36 +0.10/−0.03 (case fitting Ø, with the dial holding spacer); spacer outer 29.255; assembly plan "casing diameter" 29.30 ±0.03 | Casing, Assembly Plan |
| Height | 5.32; oscillating weight sweep Ø 26.80, back-side clearance Ø 23.94; weight sits 0.304 off the floor, boss recess 0.40 deep, 0.15 step | Casing |
| Seconds pivot tip above the main plate (H1) | **Type M 2.267 · Type L 2.667**; total with the movement (H2) 7.587 · 7.987 | Casing, "Center post" table |
| Stem | axis 1.92 below the main plate's top face; thread S0.90 × P0.225; pull strokes 0.399 and 0.400; stem Ø 1.10, part 0351 200 (A 11.00 · B 21.48) | Casing, Hand Setting Stem |
| Hand-fitting pipes | hour wheel Ø 1.506 (+0.006), pipe H1 0.88 (M) / 1.28 (L) + 0.30 flange = 1.18 / 1.58 top; cannon pinion Ø 0.891 ±0.005, H2 0.61 above the hour wheel (top 1.77 / 2.17); fourth wheel Ø 0.215 ±0.005, H3 0.42 above the cannon pinion, tip 0.13 at 90°, taper 4°36' | Hand Fitting |
| Hand holes (the hands' own drawing) | second Ø 0.198 +0.004/−0.005 · minute Ø 0.88 +0.005/−0.003 · hour Ø 1.50 +0.005/−0.003 | Hands |
| Hands' hubs | second: pipe Ø 0.35 (max 0.37), 0.60 tall (max 0.64, min 0.50 engaged), blade 0.10 ±0.02 thick · minute: hub Ø 1.05 (max 1.08), 0.30 tall (max 0.33), blade 0.18 (max 0.21) · hour: hub Ø 1.76 (max 1.79), 0.60 tall (max 0.70), blade 0.18 (max 0.21) | Hands |
| **The hand stack above the dial's top** (dial 0.40, Type M) | hour hand 0.60 → 0.78 · gap 0.41 · minute 1.19 → 1.37 · gap 0.44 · second 1.81 → 1.91 · 0.45 to the drawn limit. Type L: hour 1.00 → 1.18, minute 1.59 → 1.77, second 2.21 → 2.31 (every hand +0.40). Letters: A B C the hands' tops over the dial top (78 · 137 · 191), D the dial 40, E 45, F 44, G 41, H the hour hand's underside over the dial top (60 / 100), t1 t2 t3 the blades 18 · 18 · 10 | Hand Fitting, stack table |
| Dial Ø · thickness | 28.50 ±0.05 · 0.40 ±0.04 | Dial-1 |
| Centre hole | Ø 2.05 ±0.05 | Dial-1 |
| **Date window** | at **3H**: centre **10.55 from the dial centre** on the 3-o'clock axis, aperture **2.90 (radial) × 2.00 (tangential)**. The same sheet draws the movement turned for a **6H** window (crown at 6) and a **9H** window (crown at 9): same radius, same aperture, the feet turned with it | Dial-1 (3H, 6H), Dial-2 (9H) |
| **Dial feet** (3H, crown at 3) | F1 at (+9.672, +8.667), F2 at (−9.466, −8.930) from the centre, x toward 3, y toward 12 — **radius 12.99 / 13.01, at 1:36 and 7:33** (48.1° and 226.7° from 12, clockwise; 178.6° apart, not quite opposite). Foot: Ø 1.00 at the dial, pin Ø 0.64 +0.015/−0.01, 2.15 ±0.10 long, 0.15 tip chamfered at 25° | Dial-1 (coordinates D, polar I) |
| Dial leg holes on the spacer | the spacer takes two legs; a mod dial carries four for the 3 and 3.8/4 crowns | Casing; trade |
| Hands' unbalance limits | hour ≤ 1.50 µN·m · minute ≤ 1.25 · second ≤ 0.60 | Specification |
| Casing notes | screw-type case back required; not for diver's watches (TMI's words) | Specification |
| Date disc numeral size · disc Ø | not on this sheet (the disc is a part, drawn elsewhere); the window 2.90 × 2.00 at r 10.55 is what a dial needs | — |
| NH36 (day-date) · NH34 (GMT) | same footprint; the NH34's 24 h hand hole 2.20 and dial centre hole 2.7 (T, Lucius); the NH36's day disc window is on its own sheet (NH36_SS.pdf, /category/25/) | T |
| Minimum case height | floor from the sheet: 5.32 + 0.40 dial + 1.91 (second hand's top, M) + crystal clearance + crystal + case back; TMI's own limit line sits 0.45 over the second hand | I from D |

### 4.2 Miyota 9015 (9039 · 9075)

| | Value | Tag · source |
|---|---|---|
| Ø · casing Ø | 26.00 · 25.60 | D — Miyota spec; Horotec |
| Height | 3.90 (9039 3.90 · 9075 4.92) | D |
| Height to the seconds pivot tip | 5.98 | T — Horotec "total height" |
| Hand stack (dial top → hour hand · hour → minute · minute → seconds tip) | 9015: 0.45 · 0.45 · 1.20 = 2.10 · 9039: 0.45 · 0.40 · 0.90 = 1.75 | D — Miyota catalogue diagram (450µ/450µ/1200µ); the order of the three is Claude's reading (I) |
| Hand holes H · M · S | 1.52 · 1.00 · 0.17 (Horotec: 152-100-17) | D/T — Horotec, calibercorner |
| Minimum clearance | hand 0.40 min · movement 0.40 min | D — Miyota spec "Clearance" |
| Minimum case thickness | 9015 8.6 · 9039 8.25 | T — calibercorner, from a Miyota hand-stack comparison |
| Dial feet | "near 2:00 and 8:00" (8215: "5:30 and 11:00"); same on 9039 | T — WUS reading of Miyota's downloads drawing |
| Date window | at 3 (9015-20A) · at 6 (9015-20Y, crown 3) · at 6 with crown at 2 (2ZZ); "same distance as a 2824" | D (grail-watch list of variants) · T (WUS) |
| Date disc numeral radius, aperture | ? | ? |
| 9075 GMT | 24 h hand central; date at 3; 24 h hand hole ? | D/? |

### 4.3 Sellita SW200-1 (= ETA 2824-2; SW220-1 day-date, SW330 GMT)

| | Value | Tag · source |
|---|---|---|
| Ø · casing Ø | 26.00 · 25.60 | D — Sellita DocTec SW200-1 rev 07 (2 Sep 2024) p. 3 |
| Height | 4.60 | D |
| Height to the seconds pivot tip | 4.60 + 2.50 = 7.10 (I); Horotec lists a "total height" 6.56 for hand-fitting 2 — a different datum, not used | I / T |
| Hand holes H · M · S | 1.50 · 0.90 · 0.25 | D — DocTec p. 23 (0.25 cylindrical, −4/+6 µm; conicity 3 %) |
| Hand fitting heights, above the dial seat (height 2, standard) | **the hands sit at hour 0.95 · minute 1.35 · second 1.75**; the pipe tops they press onto: hour wheel 1.25 · cannon pinion 2.20 · seconds pivot 2.50; stem axis 1.80 | D — Sellita catalogue 2019/2024 "standard hand fitting height" diagram (0,95 · 1,35 · 1,75 · 1,80) read against DocTec p. 23 columns F · E · G and B · A · D; the pipe names from the ETA/Sellita parts catalogues (Ofrei: "height 2 cannon pinion 2.20, hour wheel 1.25") |
| The eight heights | the whole stack steps 0.25 a row: row 1 hands at 0.70 · 1.10 · 1.50 (pipes 1.00 · 1.95 · 2.50) … row 8 hands at 2.45 · 2.85 · 3.25 (pipes 2.75 · 3.70); rows 3–8 at extra cost; the seconds pivot stays 2.50 through rows 1–7 (3.50 at row 8) | D — DocTec p. 23; the seconds column (D) is the one reading still to confirm on the drawing |
| Above the dial's top (0.40 dial) | hands at 0.55 · 0.95 · 1.35; seconds tip 2.10 — the same stack as the Miyota 9015's (0.45 · 0.90 · 2.10) | I |
| Without seconds (SW210-type use) | same hour and minute heights, no fourth wheel | D — p. 24 |
| Dial thickness assumed | 0.40 | D — "appui de cadran 0,40" |
| Centre hole | 2.00 (−0/+60 µm) | D — p. 22 |
| Date window | centre 10.40 from the centre (rev B, 2024); the window ("Guichet") figures on the SW330 copy of the same drawing: 2.3 · 2.7 · 2.4 · 3.3 · 8°2' — an aperture about 2.7 wide × 3.3 high turned 8° to the radius is the likely reading, unmapped | D — p. 22, drawing SW108592 B; cousinsuk's SW330-1 sheet (same dial drawing) |
| Date disc | 31 teeth; figures 23.35 (its Ø, likely) · 17.9 / 17.5 · 11.55 (the numerals' radius, likely — 10.40 is the window's) · numeral strokes 0.26 / 0.67 / 0.18; font "Sellita standard"; disc to dial 0.16 | D — SW330-1 sheet, unmapped except 0.16 |
| Dial feet | two, opposite each other, ≈ 25.1 apart (TimeZone) · feet Ø 0.75, length 2.40 (DocTec "fixation par verrous" 2,40 / 0,75) · drawing figures 11.60 / 3.78 (a radius and an offset? not mapped) | T · D · ? |
| Stem | 3 o'clock; stem axis 1.80 above the dial underside (2824-2; 2836-2 2.25; 2892 1.50) | T — WUS quoting ETA |
| Minimum case height | ? | I |

### 4.4 Ronda 715 (quartz; 714/712 siblings; a 2-hand version exists)

| | Value | Tag · source |
|---|---|---|
| Ø · casing Ø | 26.20 · 25.60 (dealer: 25.94) | D — Ronda normtech 700 sheet (27 May 2013) |
| Height | 2.50 (2.75 over the battery) | D |
| Height to the seconds pivot tip | H1 3.90–3.92 · H2 4.12 · H6 4.79 (hand heights 0–6) | T — Horotec, watchpartsdirect |
| Hour wheel top above the dial seat, by hand height | H0 0.60 · H1 0.75 · H2 0.95 · H3 1.23 · H4 1.58 · H5 3.24 (H1 is Ronda's standard) | T — watchmakingtools.com's Ronda table |
| Hand holes H · M · S | 1.20 · 0.70 · 0.20 | D/T — Horotec "120-70-20" |
| Movement rest (dial seat step) · stem | 0.60 · stem axis 1.00 above | D — Ronda sheet |
| Hands | 3 hands, or **2 hands (no seconds)** | D — "available as 2 or 3 hands version" |
| Date window | at 3 (715) · at 6 (715 D6) · at 4 (715 D4); the 2-hand version shows the date too | D/T |
| Dial feet | 2:30 and 8:30 (calibercorner, jewelerssupplies, uswatchparts) · "2 & 8" (watchpartsdirect) | T, three dealers agree |
| Date disc numeral radius, aperture | ? (Ronda's casing-ring and hand-fitting drawings are PDFs, not reached) | ? |

### 4.5 Sellita SW100 a (= ETA 2671; SW100 b no date)

| | Value | Tag · source |
|---|---|---|
| Ø · casing Ø | 17.50 · 17.20 | D — Sellita catalogue 2024, DocTec SW100 rev 03 (19 Mar 2021) |
| Height | 4.80 | D |
| Hand holes H · M · S | 1.20 · 0.70 · 0.20 | D — catalogue diagram "Ø1,20 Ø0,70 Ø0,20" |
| Hands above the dial seat (height 2, the standard) | **hour 1.05 · minute 1.35 · second 1.70**; pipe tops: hour wheel 1.31 · cannon pinion 2.13 · seconds pivot 2.01; stem axis 1.75 | D — DocTec SW100 p. "Aiguillages" SW104205 A, columns F · E · G and B · A · D, the same layout as the SW200-1's; the catalogue diagram (1,05 · 1,35 · 1,70 · 1,75) confirms the row |
| The five heights | rows 1–5, the stack stepping 0.25: hands at 0.80 · 1.10 · 1.45 (row 1) … 1.80 · 2.10 · 2.45 (row 5); the seconds pivot 2.01 in every row | D — same table |
| Above the dial's top (0.40 dial; the sheet's dial seat reference 0.30) | hands at 0.65 · 0.95 · 1.30; seconds tip 1.61 | I |
| Date window | at 3 (SW100 a); SW100 b has no date wheel | D |
| Dial feet | 2:30 and 8:30 (the ETA 2671's; the SW100 is its copy) | T — uswatchparts, jewelerssupplies |
| Height to the seconds pivot tip | 6.29 (ETA 2671, hand-fitting 1) | T — Horotec |
| Date disc numeral radius, aperture · centre hole | ? — the dial drawing SW103202 A is in the DocTec (cousinsuk.com/pdf/products/9264_sellita 100.pdf) but its numbers do not survive text extraction; the drawing says the dial is held by bolts set at 45°; read on a Mac | ? |
| Dial Ø used | ≈ 19–20 (I; the ETA 2671's cases run 20–28 mm with a spacer) | I |
| Minimum case height | ? | I |

### 4.6 Spare — ETA/Unitas 6497-1 (6498-1; Sea-Gull ST3600/ST3620)

| | Value | Tag · source |
|---|---|---|
| Ø · casing Ø | 37.2 overall · 36.60 casing | D — ranfft, ETA |
| Height | 4.50 | D |
| Hand holes H · M · small S | 2.00 · 1.15 · 0.27 | T — ranfft, Perrin "200/115/27" |
| Hands | central hour and minute; **small seconds at 9** (6497, opposite the crown) or **at 6** (6498); no central seconds, no date | D |
| Small seconds centre, from the dial centre | ? — not found in text; the usual 36.6 mm Lépine layout puts it near the edge of the balance side (dials for it are drawn to the ETA drawing) | ? |
| Dial feet | two, screwed from the side of the plate (dial-foot screws at ~23 and ~51 minutes) | T — calibercorner comment |
| Stem axis above the dial | 1.85 (ranfft "T") · mounting height F 0.5 | T |
| Dial Ø used | 34.5 (blanks) … 37.2 | T — WUS (Helana Rou blanks) |
| Crown | at 3 with the 6497 giving seconds at 9; turned 90° (crown at 12) for pocket-watch dials | D |

### 4.7 Spare — Miyota 2035 (small quartz; 2025 two-hand; 2036/203A high-hand)

| | Value | Tag · source |
|---|---|---|
| Size | 6¾ × 8''' = 15.3 × 18.5 (oblong) | D — Miyota spec |
| Height · to the seconds pivot tip | 3.15 · 4.57–4.7 (2036 high hand 5.16) | D · T (hswalsh 4.57, dealers 4.7) |
| Hand holes H · M · S | 1.20 · 0.70 · 0.17 | T — every dealer "120/70/17" |
| Hour wheel height · cannon pinion over the plate | 0.85 · (2036: 2.00; 2033: 2.92) | T — uhrmacherwerkzeuge, Perrin |
| Clearance | movement 0.30–0.45 · hand 0.15 min | D — Miyota spec "Clearance" |
| Hands | 3 (2035) or 2 (2025); no date (the 2036-family date calibres are 4.15 high) | D |
| Dial feet | ~7:00 and ~11:30 | T — two dealers; calibercorner "needs confirmed" |
| Why a spare | the smallest footprint, an oblong one: the natural movement for non-round dials (#363) and the tool's two-hand case | — |

## 4.8 The date radius — what it is and why it decides the window

The **date radius** is the distance from the dial's centre to the middle of the numeral printed on the date disc — the one number that puts a window in the right place. A window drawn elsewhere shows half a numeral, or the gap between two. The tool's Windows have the disc's edges as guides and a Physics tick; with the radius per calibre those guides become real. What is known:

| Calibre | Date radius | Window | Tag |
|---|---|---|---|
| Sellita SW200-1 / ETA 2824-2 | 10.40 (the window's centre on the drawing); the disc's numeral radius itself likely 11.55 — the two differ because the numeral sits inboard of the disc's edge and the window is drawn around it | ≈ 2.7 × 3.3, turned 8° (likely reading) | D / unmapped |
| Miyota 9015 | "the same distance as a 2824" — so ≈ 10.4 | ? | T (WUS) |
| NH35 | **10.55** (the window's centre on TMI's Dial-1) | 2.90 radial × 2.00 tangential | D |
| Ronda 715 | ? — an 11½''' quartz; its disc is small (the battery takes the room): the radius is likely *inside* the Swiss automatics' | ? | I |
| SW100 | ? — on a 17.2 mm movement the disc is tiny; the numeral radius is about 6.5–7.5 (I, from the movement's Ø) and the numerals are 1.2–1.4 mm tall, so a window at 3 sits well inside a 19–20 mm dial | ? | I |

Rule for the build: a calibre whose radius is **?** offers its window at the trade's position (3; 6 by variant) with the disc guide at the inferred radius and the cell marked "unverified" in the record — never a made-up aperture.

## 5 · What this means for the build

- **The three 11½''' movements share one dial** in the tool's terms (Ø 28–29, date centre ≈ 10.4 mm from the centre at 3); they differ in hand holes, heights and the GMT/day options. One geometry record with three overlays.
- **NH35 is the odd 12'''**: 28.5 dial, 2.27 to the seconds tip over the plate, date window at r 10.55 (2.90 × 2.00), feet at r 13.0 at 1:36 and 7:33 — all from TMI's sheet now.
- **SW100 is the second dial size** (≈ 19–20): the same window logic at a smaller radius — its dial drawing is the one to read next. The 6497 (a third size, with a subdial) is a spare; Sellita's SW260-1 shows how a subdial is specified ("small second at 9 o'clock, pivot point distance 6.4 mm").
- **Hand heights are per-calibre choices, not constants**: Sellita sells eight, Seiko two (M, L), Ronda seven (0–6), Miyota one per calibre (two for the 2035 family). Above the dial's top the standard stacks agree to a tenth — SW200-1 0.55 · 0.95 · 1.35 (tip 2.10), 9015 0.45 · 0.90 · 2.10, SW100 0.65 · 0.95 · 1.30 — so one default stack with per-calibre overrides is honest. The movement record should carry the *standard* height and name the alternatives; #584's `data-over` then has a source.
- **Minimum case height** is not published by anyone; it is a sum: movement height + 0.40 dial + hand stack to the seconds tip + hand thickness + crystal clearance (Miyota: 0.40 min) + crystal + case back. Give the Show Case the sum from the record and say which terms are the maker's.

- **Already in the code, the same night**: v1.1.64 (#585) set a new dial's hand heights to the Miyota 8215's (`MOVEMENT_HEIGHTS` in `geometry.js`: 0.30 · 0.85 · 1.20, cap 1.45) with the 9015's beside them. That is a second movement record; #586 should absorb it (R34, one mechanism), and the 8215 is then the sixth real calibre or the alternate of §2.

## 6 · Not reached, and how to get it

3D files and templates others made from these drawings, catalogued for reuse: `movements-3d.md`.

- **NH35: done** — Okay screenshotted TMI's sheet (10 Nov 2026, 23:17); the pictures are on his iPad/Mac (R36), the numbers in §4.1. Still to read the same way: Miyota 9015 drawing; Sellita SW200-1 p. 21–24 and SW100 "Indications pour cadran"; ETA 6497 dial drawing; Ronda casing ring) are PDFs; the workspace cannot download them and the browser pane does not paint PDFs (tried three ways, 10 Nov 2026). Second-hand sources were tried the same night (mod shops, dealers, Thingiverse/Printables, Reddit): they gave hand heights, feet clock positions and disc sizes, never a date radius — nobody publishes it; dial makers cut to the drawing. **On a Mac**: open the PDFs in Chrome, screenshot the dial and hand-height pages, and read the numbers off — 20 minutes; this closes the remaining ? cells (Miyota 9015, Sellita SW100 dial page, Ronda 715).
- Sellita SW200-1: https://www.sellita.ch/scripts/calibres/images/DocTec_SW200-1_7.pdf (p. 22 dial, p. 23 heights). TMI NH35A sheet: okta.ua/files/pdf/1482851267NH35A.PDF. Miyota: miyotamovement.com/product/9015/ → Documents. Ronda: gleave.london/content/TECH/Ronda 715 - Specification.pdf (links the two hand-fitting drawings).
