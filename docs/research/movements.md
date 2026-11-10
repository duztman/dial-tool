# Movements — the numbers a dial inherits from its calibre

*11 Nov 2026. Research for #586 (Choose your movement) and #587 (the record the tool reads, built). Written for the agent that builds it. Built: the record and its generator (#587) and the 3D exercise's Movement switch; #586's choice in the tool is not. Index of all research: `README.md` beside this file.*

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
| **NH36 day-date window** | at **3H**: one aperture for day and date, centre **r 8.45** on the 3-o'clock axis, **7.00 (radial) × 2.00 (tangential)** — from r 4.95 to r 11.95; the day disc's text sits inboard, the date's outboard. The same sheet draws a **6H** version (crown at 6): same radius and aperture on the 6 axis. Dial Ø 28.50 ±0.05, centre hole Ø 2.05 ±0.05, feet F1 (+9.672, +8.667) / F2 (−9.466, −8.930), foot Ø 1.00 head / Ø 0.64 pin 2.15 long — all the NH35's. No 9H drawing on the NH36 sheet | D — TMI NH36 sheet, Dial page (read 10 Nov 2026 on the Mac, `TMI_NH36_spec_sheet.pdf` p. 8) |
| NH34 (GMT) | same footprint; the NH34's 24 h hand hole 2.20 and dial centre hole 2.7 | T — Lucius |
| Minimum case height | floor from the sheet: 5.32 + 0.40 dial + 1.91 (second hand's top, M) + crystal clearance + crystal + case back; TMI's own limit line sits 0.45 over the second hand | I from D |

### 4.2 Miyota 9015 (9039 · 9075)

Read from Miyota's own drawings (fetched to Okay's Mac through the PDF tools, 10 Nov 2026): *Indications for Dial* 901500D0 for Cal. 9015-20A (date 3H, crown 3H; 2023-03-06) and *Frame for Case* 901500C0 (2023-03-17); the 9015-20Y (date 6H) drawing is on the same product page. Everything in this table is **D** unless tagged.

| | Value | Where |
|---|---|---|
| Ø · casing Ø | 26.00 ±0.02 · 25.60 js8 (±0.0165); back-side Ø 25.50 max, Ø 23.90 max | Frame for Case |
| Height | 3.90 (9039 3.90 · 9075 4.92) | Miyota spec |
| Date disc Ø | 23.40 | Frame for Case |
| Hand-fitting pipes | hour wheel Ø 1.52 (−0.001/−0.009) · cannon pinion Ø 1.00 (+0.003/−0.005) · seconds Ø 0.17 ±0.004; **post tops over the dial's seat: hour wheel 1.20 · cannon pinion +0.45 (~0.41) → 1.65 · seconds tip +0.45 → 2.10 (~2.06)**; over the face (0.40 dial) the hour hand has 0–0.80, the minute hand 0.80–1.25, the seconds hand 1.25–1.70. The catalogue's 0.45 · 0.45 · 1.20 is these three steps, the 1.20 first: no hand sits 0.45 over the dial | Frame for Case section (1200 · 450(~410) · 450, 2100(~2060), each from the dial's seat) |
| Minimum clearance | hand 0.40 min · movement 0.40 min | Miyota spec "Clearance" |
| Minimum case thickness | 9015 8.6 · 9039 8.25 | T — calibercorner |
| Dial Ø · thickness | 25.60 drawn (the bare 11½''' dial; the trade fits 28–29 over a dial ring) · 0.40 ±0.04 | Indications for Dial |
| Centre hole | Ø 2.00 ±0.04 | Indications for Dial |
| **Date window** (20A, 3H) | **from r 8.85 to r 11.55 (2.70 radial) × 2.00 tangential, centre r 10.20** on the 3-o'clock axis — the same cut as the ETA 2824 / Sellita SW200-1 rev A | Indications for Dial |
| **Dial feet** | DH11 at (+11.85, +2.83), DH12 at (−11.60, −3.76) — **r 12.18 at 2:33 and r 12.19 at 8:24** (not opposite: 175.4° apart); foot Ø 0.70 ±0.01, 1.50–1.70 long, chamfer C0.10 | Indications for Dial (coordinates D, polar I) |
| Stem | at 3H; axis 1.53 below the dial ring's top; thread S0.9 | Frame for Case |
| 9075 GMT | 24 h hand central; date at 3; 24 h hand hole ? | D/? |

### 4.3 Sellita SW200-1 (= ETA 2824-2; SW220-1 day-date, SW330 GMT)

| | Value | Tag · source |
|---|---|---|
| Ø · casing Ø | 26.00 · 25.60 | D — Sellita DocTec SW200-1 rev 07 (2 Sep 2024) p. 3 |
| Height | 4.60 | D |
| Height to the seconds pivot tip | Horotec's "total height" 6.56 for hand-fitting 2 (= 4.60 + 1.96, the pinion's tip a little over the 1.75 pipe top) | T |
| Hand holes H · M · S | 1.50 · 0.90 · 0.25 | D — DocTec p. 23 (0.25 cylindrical, −4/+6 µm; conicity 3 %) |
| Hand fitting heights — the pipe tops above the dial seat ("dépassement"), height 2 (standard) | **hour wheel 0.95 · cannon pinion 1.35 · seconds pinion 1.75** (columns F · E · G); the parts' lengths (A · B · C · D): cannon pinion 2.20, hour wheel 1.25, seconds pinion 5.07, centre tube 2.50; column H 0.95 (a hub datum, unlabelled) | D — DocTec p. 23, drawing SW106769 A, read on the page itself (10 Nov 2026) |
| The eight heights | the pipe tops step 0.25 a row: row 1 hour 0.70 · minute 1.10 · second 1.50 … row 8 hour 2.45 · minute 2.85 · second 3.25; rows 3–8 at extra cost; the centre tube 2.50 (3.50 at row 8) | D — the same table |
| Above the dial's top (0.40 dial) | hour 0.55 · minute 0.95 · second 1.35 — the Miyota 9015 sits 0.45 · 0.90 · 2.10 (its 2.10 is the tip, not the pipe top) | I |
| Without seconds (SW210-type use) | same hour and minute heights, no fourth wheel | D — p. 24 |
| Dial thickness assumed | 0.40 | D — "appui de cadran 0,40" |
| Centre hole | 2.00 (−0/+60 µm) | D — p. 22 |
| **Date window** | rev A (SW106765 A, p. 21): **from r 8.85 to r 11.55 (2.70 radial) × 2.00 tangential at 3H, centre r 10.20**, with dashed alternatives at 12, 9 and 6; rev B (SW108592 B, p. 22, 2021): a **round Ø 2.30 window at r 10.40** drawn on the 6-o'clock axis ("rectification of the window Ø to 2.300 and centre distance to 10.400"). Both pages are in the 2024 document; the rectangle is the classic cut, the round one the newer drawing | D — read on the pages (10 Nov 2026) |
| Date disc | 0.16 thick, under the dial; 31 teeth; the SW330-1 sheet's figures 23.35 (Ø, likely) and 11.55 (= the window's outer edge) | D (0.16, teeth) · unmapped (the rest) |
| **Dial feet** | at (+11.60, +3.78) and (−11.60, −3.78) — **r 12.20 at 2:24 and 8:24**, exactly opposite; foot Ø 0.75 (−0.014), 1.55 long under the dial, held by bolts 2.40 deep | D — p. 21/22 (coordinates D, polar I) |
| Stem | 3 o'clock; stem axis 1.80 above the dial underside (2824-2; 2836-2 2.25; 2892 1.50) | T — WUS quoting ETA |
| Minimum case height | ? | I |

### 4.4 Ronda 715 (quartz; 714/712 siblings; a 2-hand version exists)

| | Value | Tag · source |
|---|---|---|
| Ø · casing Ø | 26.20 · 25.60 (dealer: 25.94) | D — Ronda normtech 700 sheet (27 May 2013) |
| Height | 2.50 (2.75 over the battery) | D |
| Height to the seconds pivot tip | H1 3.90–3.92 · H2 4.12 · H6 4.79 (hand heights 0–6) | T — Horotec, watchpartsdirect |
| **Hand fitting, the 715 three-hand** (Ronda sheet 3316.077 rev 08, 3 Feb 2012; shared by 775 · 785 · 705 · 715 · 715Li) | **one height only, No. 6**: over the dial seat the hour wheel top **F 1.58**, cannon pinion top **E 1.98**, seconds pinion top **G 2.29**; H 1.44 (hour wheel shoulder), B 2.10 (hour wheel length). Max dial-plus-paint under the seconds hand 1.75, under the minute hand 1.55, under the hour hand 0.40; hands ≤ 0.15 thick. Hand fits: hour Ø 1.200 (+4/−2 µm), minute Ø 0.700 (+6/−4), seconds Ø 0.206 (+6/−4) cylindrical, tapering 2 % to Ø 0.200 at the tip, 0.65 long. The trade's "H0–H5" list (0.60 · 0.75 · 0.95 · 1.23 · 1.58 · 3.24) is the 700-family's catalogue of hour-wheel heights, not a choice on the 715: its hour wheel is the 1.58 one | D — cousinsuk's 705/715 bundle (beco), p. 11, read 10 Nov 2026 on the Mac |
| Hand holes H · M · S | 1.20 · 0.70 · 0.20 | D/T — Horotec "120-70-20" |
| Movement rest (dial seat step) · stem | 0.60 · stem axis 1.00 above | D — Ronda sheet |
| Hands | 3 hands, or **2 hands (no seconds)** | D — "available as 2 or 3 hands version" |
| Date window | at 3 (715) · at 6 (715 D6) · at 4 (715 D4); the 2-hand version shows the date too | D/T |
| Dial feet | 2:30 and 8:30 (calibercorner, jewelerssupplies, uswatchparts) · "2 & 8" (watchpartsdirect) | T, three dealers agree |
| **Dial drawing** (Ronda 5010.377, shared by 515 · 515S · 714 · 715 · 715Li) | bare dial Ø 25.5; centre hole Ø 1.7 (+0.06); **date window from r 8.85 to r 11.55 (2.70 radial) × 2.00 tangential, centre r 10.20** — drawn at 4H (30° below 3) on this sheet, the 3H sheet (5010.417) and 6H (5010.534) the same cut turned; the "round" variants (5010.477, R 10.2) put a round window at r 10.2; **feet at (+11.6, +3.78) and (−11.6, −3.78), r 12.20 at 2:24 / 8:24** — the ETA 2824's; foot Ø 0.75 (−0.014), 2.0 long, 0.3 × 30° chamfer; dial 0.5 max | D — cousinsuk's bundle "datasheet 714 complete technical documentation", read on the page (10 Nov 2026) |
| Hand fitting, the two-hand sibling 714 (sheet 3316.120) | heights 1 · 2 · 3: cannon pinion top over the dial seat 1.08 · 1.28 · 1.63, hour wheel 0.75 · 0.95 · 1.23; max dial under the minute hand 0.70 · 0.85 · 1.10, under the hour hand 0.40 · 0.60 · 0.90; hands ≤ 0.15 thick; hand holes 1.20 (+4/−2) · 0.70 (+6/−4) | D — same bundle |

### 4.5 Sellita SW100 a (= ETA 2671; SW100 b no date)

| | Value | Tag · source |
|---|---|---|
| Ø · casing Ø | 17.50 · 17.20 | D — Sellita catalogue 2024, DocTec SW100 rev 03 (19 Mar 2021) |
| Height | 4.80 | D |
| Hand holes H · M · S | 1.20 · 0.70 · 0.20 | D — catalogue diagram "Ø1,20 Ø0,70 Ø0,20" |
| Pipe tops above the dial seat (height 2, the standard) | **hour wheel 1.05 · cannon pinion 1.35 · seconds pinion 1.70** (columns F · E · G); parts' lengths: cannon pinion 2.13, hour wheel 1.31, centre tube 2.01; stem axis 1.75 | D — DocTec SW100 "Aiguillages" SW104205 A, the SW200-1's column layout; the catalogue diagram (1,05 · 1,35 · 1,70 · 1,75) matches |
| The five heights | rows 1–5 stepping 0.25: hour 0.80 · minute 1.10 · second 1.45 (row 1) … 1.80 · 2.10 · 2.45 (row 5) | D — same table |
| Above the dial's top (0.40 dial; the sheet's dial seat reference 0.30) | hands at 0.65 · 0.95 · 1.30; seconds tip 1.61 | I |
| Date window | at 3 (SW100 a); SW100 b has no date wheel | D |
| **Dial feet** | at (+7.75, +2.35) and (−7.75, −2.35) — **r 8.10 at 2:26 / 8:26**, opposite; foot Ø 0.65 (−0.014), 1.60 long under the dial, bolts 2.00 deep | D — DocTec SW100 p. 19, drawing SW103202 A, read on the page (10 Nov 2026) |
| Height to the seconds pivot tip | 6.29 (ETA 2671, hand-fitting 1) | T — Horotec |
| **Date window** · centre hole | **from r 5.97 to r 8.22 (2.25 radial) × 2.00 tangential, centre r 7.10**; the numeral 1.40 tall, the window's print frame 1.65 wide; alternatives dashed at 6H and at 4:30 (45°); the window's edge chamfered 45° × 0.30; date disc 0.16, 0.10 under the dial · centre hole **Ø 1.70 (+0.06)** | D — same drawing |
| Dial Ø | the drawing's disc is the bare 7¾''' dial (≈ 17.5); the trade fits 19–20 over a ring | D / I |
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
| Sellita SW200-1 / ETA 2824-2 | **10.20** (rev A rectangle, r 8.85–11.55); rev B draws a round Ø 2.30 at 10.40 | 2.70 radial × 2.00 | D |
| Miyota 9015 | **10.20** (r 8.85–11.55) — the 2824's cut to the hundredth | 2.70 × 2.00 | D |
| NH35 | **10.55** (the window's centre on TMI's Dial-1) | 2.90 radial × 2.00 tangential | D |
| Ronda 715 | **10.20** (r 8.85–11.55), at 3H · 4H · 6H by sheet; round variants R 10.2 | 2.70 × 2.00 (round: Ø ≈ 2) | D |
| SW100 | **7.10** (r 5.97–8.22); numeral 1.40 tall | 2.25 × 2.00 | D |

Every shown calibre's window is documented now. One cut serves the three 11½''' movements and the Ronda: r 8.85–11.55 × 2.00; the NH35's is r 9.10–12.00 × 2.00 (centre 10.55); the SW100's r 5.97–8.22 × 2.00. The rule stands for any calibre added later: no made-up aperture.

## 4.9 Spare — Miyota 8215

| | Value | Source |
|---|---|---|
| Ø · casing Ø · height | 26.00 ±0.02 · 25.60 · 5.67 | D — Miyota 8215 drawing, "Frame for Case" |
| Post tops over the dial's seat | hour wheel 1.13 (~1.08) · cannon pinion +0.35 → 1.48 · seconds tip +0.37 → 1.85; over the face 0–0.73 · 0.73–1.08 · 1.08–1.45 | D — the same section (1130(~1080) · 350 · 370, 1850) |
| Posts Ø H · M · S | 1.52 · 1.00 · 0.17 | D — the same section |
| Dial | thickness 0.40 ±0.04, centre hole 2.00 ±0.04 | D — "Indications for Dial" (8215-33E) |
| Dial feet | DH1 at x +2.165, y −11.855 · DH2 at x −7.065, y +9.80 (x toward 3H, y toward 12H); Ø 0.725 ±0.01 | D — the same sheet |
| Date window (at 3) | 8.95 to 11.30 along the radius (2.35) × 1.90 across; date dial Ø 23.0 | D |
| Not printed | a hand's thickness, where a hand sits on its post, the date disc's depth | ? |

Read in a session's browser pane (10 Nov 2026): the maker's site open, pdf.js loaded from cdnjs in the page, a PDF page of the same site rendered to a canvas with `intent: "print"`, crops of it drawn on a fixed canvas and screenshotted — a second way to a maker PDF when no Mac is linked. Also read this way: the NH35 sheet's clearance from the seconds hand's top to the glass, **0.45** (E on the Hand Fitting page).

## 5 · What this means for the build

- **The three 11½''' movements and the Ronda share one dial** in the tool's terms: window r 8.85–11.55 × 2.00 at 3 (and 4 · 6 · 9 · 12 by variant), centre hole 1.7–2.0, feet r 12.2 at 2:24/8:24 (Miyota's a touch off at 2:33/8:24). They differ in hand holes, heights and the GMT/day options. One geometry record with overlays.
- **NH35 is the odd 12'''**: 28.5 dial, 2.27 to the seconds tip over the plate, date window at r 10.55 (2.90 × 2.00), feet at r 13.0 at 1:36 and 7:33 — all from TMI's sheet now.
- **SW100 is the second dial size** (bare 17.5, fitted 19–20): window r 5.97–8.22 × 2.00, feet r 8.10 at 2:26/8:26 — documented. The 6497 (a third size, with a subdial) is a spare; Sellita's SW260-1 shows how a subdial is specified ("small second at 9 o'clock, pivot point distance 6.4 mm").
- **Hand heights are per-calibre choices, not constants**: Sellita sells eight, Seiko two (M, L), Ronda seven (0–6), Miyota one per calibre (two for the 2035 family). Above the dial's top the standard stacks agree to a tenth — SW200-1 0.55 · 0.95 · 1.35 (tip 2.10), 9015 0.45 · 0.90 · 2.10, SW100 0.65 · 0.95 · 1.30 — so one default stack with per-calibre overrides is honest. The movement record should carry the *standard* height and name the alternatives; #584's `data-over` then has a source.
- **Minimum case height** is not published by anyone; it is a sum: movement height + 0.40 dial + hand stack to the seconds tip + hand thickness + crystal clearance (Miyota: 0.40 min) + crystal + case back. Give the Show Case the sum from the record and say which terms are the maker's.

- **In the code** (#587, v1.1.65): `movements.json` is the one record; `web/movements.mjs` writes `web/src/movements.js` from it (`MOVEMENTS`, each with its `heights` worked out by one rule: the maker's hand places where printed — NH35 — else a 0.15 mm hand in the middle of its space on the post, to 0.05); a new dial's hands start on the 8215's; the 3D exercise's Movement switch and its crystal clearance read the same file. The 8215 is a spare with its row (§4.9).

## 6 · Not reached, and how to get it

3D files and templates others made from these drawings, catalogued for reuse: `movements-3d.md`.

- **All five read (10 Nov 2026, 23:17–23:40)**: the NH35 from Okay's screenshots of TMI's sheet; the SW200-1, SW100, Miyota 9015 and Ronda 714/715 drawings fetched to his Mac with the desktop PDF tools (`fetch_pdf_from_url` → `render_pdf_page`) — the way to read any maker PDF from now on; the files are in `~/Documents/` on the Mac (to move to `dial-maker/research/movements/`, R36): `Sellita_SW200-1_DocTec_rev07.pdf`, `Sellita_SW100_DocTec.pdf`, `Miyota_9015_drawing.pdf`, `Miyota_9015-20A_dial_drawing.pdf`, `Ronda_715_spec.pdf`, `Ronda_714_715_complete_technical_documentation.pdf`. Still open: Miyota 9015 drawing; Sellita SW200-1 p. 21–24 and SW100 "Indications pour cadran"; ETA 6497 dial drawing; Ronda casing ring) are PDFs; the research container cannot download them and the browser pane does not paint PDFs — but the **desktop PDF tools can** (see above). Second-hand sources were tried the same night (mod shops, dealers, Thingiverse/Printables, Reddit): they gave hand heights, feet clock positions and disc sizes, never a date radius — nobody publishes it; dial makers cut to the drawing. **On a Mac**: open the PDFs in Chrome, screenshot the dial and hand-height pages, and read the numbers off — 20 minutes; The 715's three-hand height sheet (3316.077, in `Ronda_705_715_bundle_beco.pdf` p. 11) and the NH36 day-date window (`TMI_NH36_spec_sheet.pdf` p. 8) were opened the same way at 23:55; `TMI_NH35_spec_sheet.pdf` is on the Mac too. Nothing in §4 is left unread for the five. **Without a Mac** (tested 11 Nov 2026, 00:00): Exa's `web_fetch_exa` reads a maker PDF's text from the research container (spec tables, hand-height tables with a text layer); it cannot show a drawing, and Adobe's cloud PDF tools refuse a plain URL. Drawings need the picture: the Mac's PDF tools or the browser-pane pdf.js route (§4.9) — both need a linked Mac.
- Sellita SW200-1: https://www.sellita.ch/scripts/calibres/images/DocTec_SW200-1_7.pdf (p. 22 dial, p. 23 heights). TMI NH35A sheet: okta.ua/files/pdf/1482851267NH35A.PDF. Miyota: miyotamovement.com/product/9015/ → Documents. Ronda: gleave.london/content/TECH/Ronda 715 - Specification.pdf (links the two hand-fitting drawings).
