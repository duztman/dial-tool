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

| | Value | Tag · source |
|---|---|---|
| Outside Ø · casing Ø | 27.40 · 29.36 (with dial holding spacer) | D — TMI NH35A spec sheet |
| Height | 5.32 | D |
| Height to the seconds pivot tip | 7.55 (Type M hands) · ≈ 8.0 (Type L, +0.4) | T — Crystaltimes "height with cannon pinion 7.55"; calibercorner "about 7.6 (M) / 8 (L)" |
| Hand holes H · M · S | 1.50 · 0.89 · 0.21 (sheets say 0.88–0.90 and 0.20–0.21) | T — calibercorner, Lucius, hewore |
| NH34's 24 h hand hole | 2.20; dial centre hole 2.7 | T — Lucius Atelier |
| Hand heights above the dial, each | ? — only the total (7.55 − 5.32 = 2.23 above the movement top, Type M) is public | I |
| Dial Ø | 28.5 (28.4–28.5) | T — every mod shop |
| Dial feet | two, used of four on mod dials, for a 3 or 4 o'clock crown; "roughly 12 and 6 with the crown right" | T — nomods; TMI: "fixed by two dial leg holes of dial holding spacer" (D) |
| Stem | 3 o'clock (3.8 / 4.1 cases turn the movement) | D/T |
| Date window | at 3 (D: "Date 3H", dial drawing NH35 Dial-1); 6H special order (T: Lucius); 4–4:30 by turning | D/T |
| Date disc numeral radius, aperture | ? — the drawing "NH35 Dial-1" is not online in text; mod-shop aperture figure "~2.0 × 1.0" is a guess, treat as ? | ? |
| Date disc Ø | ≈ 21–23 (overlay discs) | T — relaxwatches DWO guide |
| NH36 | day over date at 3; crown position fixed (day wheel aligned); height "~6.0" per one dealer, 5.32 per TMI | D/T, conflicting |
| Minimum case height | ? — build from 7.55 + dial 0.40 + hand clearance + crystal; no published floor | I |

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
| Hand holes H · M · S | 1.20 · 0.70 · 0.20 | D/T — Horotec "120-70-20" |
| Movement rest (dial seat step) · stem | 0.60 · stem axis 1.00 above | D — Ronda sheet |
| Hands | 3 hands, or **2 hands (no seconds)** | D — "available as 2 or 3 hands version" |
| Date window | at 3 (715) · at 6 (715 D6) · at 4 (715 D4); the 2-hand version shows the date too | D/T |
| Dial feet | 2:30 and 8:30 (calibercorner) · "2 & 8" (watchpartsdirect) | T |
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
| Date disc numeral radius, aperture · dial feet · centre hole | ? — the dial drawing SW103202 A is in the DocTec (cousinsuk.com/pdf/products/9264_sellita 100.pdf) but its numbers do not survive text extraction; the drawing says the dial is held by bolts set at 45°; read on a Mac | ? |
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
| NH35 | ? — the 12''' disc is bigger (Ø ≈ 21–23), so the radius is larger than the 11½''' ones: likely 10.9–11.5 | ? | I |
| Ronda 715 | ? — an 11½''' quartz; its disc is small (the battery takes the room): the radius is likely *inside* the Swiss automatics' | ? | I |
| SW100 | ? — on a 17.2 mm movement the disc is tiny; the numeral radius is about 6.5–7.5 (I, from the movement's Ø) and the numerals are 1.2–1.4 mm tall, so a window at 3 sits well inside a 19–20 mm dial | ? | I |

Rule for the build: a calibre whose radius is **?** offers its window at the trade's position (3; 6 by variant) with the disc guide at the inferred radius and the cell marked "unverified" in the record — never a made-up aperture.

## 5 · What this means for the build

- **The three 11½''' movements share one dial** in the tool's terms (Ø 28–29, date centre ≈ 10.4 mm from the centre at 3); they differ in hand holes, heights and the GMT/day options. One geometry record with three overlays.
- **NH35 is the odd 12'''**: 28.5 dial, 7.55 to the seconds tip, its own date radius (unknown — measure one).
- **SW100 is the second dial size** (≈ 19–20): the same window logic at a smaller radius — its dial drawing is the one to read next. The 6497 (a third size, with a subdial) is a spare; Sellita's SW260-1 shows how a subdial is specified ("small second at 9 o'clock, pivot point distance 6.4 mm").
- **Hand heights are per-calibre choices, not constants**: Sellita sells eight, Seiko two (M, L), Ronda seven (0–6), Miyota one per calibre (two for the 2035 family). Above the dial's top the standard stacks agree to a tenth — SW200-1 0.55 · 0.95 · 1.35 (tip 2.10), 9015 0.45 · 0.90 · 2.10, SW100 0.65 · 0.95 · 1.30 — so one default stack with per-calibre overrides is honest. The movement record should carry the *standard* height and name the alternatives; #584's `data-over` then has a source.
- **Minimum case height** is not published by anyone; it is a sum: movement height + 0.40 dial + hand stack to the seconds tip + hand thickness + crystal clearance (Miyota: 0.40 min) + crystal + case back. Give the Show Case the sum from the record and say which terms are the maker's.

- **Already in the code, the same night**: v1.1.64 (#585) set a new dial's hand heights to the Miyota 8215's (`MOVEMENT_HEIGHTS` in `geometry.js`: 0.30 · 0.85 · 1.20, cap 1.45) with the 9015's beside them. That is a second movement record; #586 should absorb it (R34, one mechanism), and the 8215 is then the sixth real calibre or the alternate of §2.

## 6 · Not reached, and how to get it

- The maker drawings (TMI "NH35 Dial-1", Miyota 9015 drawing, Sellita p. 21–24, ETA 6497 dial drawing, Ronda casing ring) are PDFs; the workspace cannot download them and the browser pane does not paint PDFs in the background. **On a Mac**: open the PDFs in Chrome, screenshot the dial and hand-height pages, and read the numbers off — 20 minutes; this closes every ? above except a measured NH35 date radius.
- Sellita SW200-1: https://www.sellita.ch/scripts/calibres/images/DocTec_SW200-1_7.pdf (p. 22 dial, p. 23 heights). TMI NH35A sheet: okta.ua/files/pdf/1482851267NH35A.PDF. Miyota: miyotamovement.com/product/9015/ → Documents. Ronda: gleave.london/content/TECH/Ronda 715 - Specification.pdf (links the two hand-fitting drawings).
