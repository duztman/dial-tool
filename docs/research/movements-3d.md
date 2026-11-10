# Movements — 3D files, templates and generators found on the way

*10 Nov 2026. Okay: "record a copy of 3d files for all movements that pass through your hands under research today for others to use." The files themselves could not be copied from the research container (the hosts refuse it and the files are binaries); this is the catalogue — what each is, where, what it encodes, and how to fetch it. Copies, once fetched on a Mac, go to `~/Desktop/dial-maker/research/movements-3d/` (R36: pictures and binaries stay on the Mac, not in the repo); add the file name to the row.*

Tag: **D** built from the maker's drawing (says so) · **T** built from a measured part · **?** origin not stated. Licences are the sites' defaults (Thingiverse/Printables: usually CC BY; MakerWorld: per model) — check before reuse.

| Calibre | What | Where | Encodes | Tag | Copy |
|---|---|---|---|---|---|
| NH35 (dial feet) | Miyota 2035 movement holder with holes at the NH35 dial-feet positions, OpenSCAD source included — the .scad carries the feet coordinates the author took from TMI's spec sheet | Thingiverse thing:7020663 (kennethlee) | NH35 dial feet: angles and radius (the one source that encodes them numerically) | D | — |
| NH35 (dial feet, 3 and 3.8 crowns) | VH31 / Miyota 2115 → NH35 case spacer with feet holes for both crown positions (TinkerCAD remix) | Thingiverse thing:6683661 (KenVersus); his own VH31 spacer thing:6784946 | feet holes for the 3:00 and 3.8 layouts; feet Ø ≈ 0.65 (another spacer, Printables 1194756, says the holes are drawn 1.0 for a 0.65 foot) | T | — |
| NH35 (dial feet) | VH31 → NH35 movement adapter with 28.5 dial seat and feet holes | Thingiverse thing:7313698 (kenweise, Mar 2026) | 28.5 seat, feet holes | T | — |
| NH35 (dial) | 3D-printable dial for NH34/35/36, 28.8 mm | MakerWorld 1122615 | a dial's outline, centre hole and feet; untested on a movement | ? | — |
| NH35 (dial) | A diver dial modelled by disassembling and measuring an original NH35 dial | CGTrader "a classic diver sport watch" | dial outline, date aperture and feet as measured from a real Seiko dial — the best lead for the date radius | T | — |
| NH35 (tool) | Laser dial holder / logo alignment tool | Printables 1286501 (jomiller97) | 28.5 dial seat | T | — |
| NH35 · SW200 · ETA 2824/2836/2892 · SW300 · 9015 · 8215 · 6497 | **Movement-ring generator** (OpenSCAD, presets for all of these, dial-seat recess, off-centre and rotated movements) | MakerWorld 3440336 | casing Ø and heights of nine calibres as the author uses them; the .scad is included | ? | — |
| NH35 · 7S26 · 2824-2 · 2836 · 8215 · ST1612/ST2130 · DG2813 · PT5000 · Vostok | **Dial-feet stencil** for marking feet on a blank, one print | Shapeways MYU2CFUDR (Claassen Design) | the feet positions of all the listed calibres, as a physical template (no numbers published) | ? | — |
| Miyota 2305 | Day-date quartz holder for NH3 cases | Printables 1182657 (kenVersus) | the 2305's outline in a 29.36 seat | T | — |
| Miyota 2035 | Holder for NH35 cases (see row 1) and the "Trolex" printed watch built round a 2035 | Thingiverse 6789735 (Ken's STL 2035 movement — a model of the movement itself); MakerWorld 463323 | the 2035's body as a solid | T | — |
| NH35/4R35, NH36 | Movement holders for work (dial-up, rotor free) | Thingiverse 3471154 (AG875), MakerWorld 668644, 1645845 | outside Ø 27.40, rotor clearance | T | — |

## The maker PDFs, fetched (10 Nov 2026)

Through the desktop PDF tools (`fetch_pdf_from_url` on the Mac, then `render_pdf_page` to read a page as a picture) — the way around the research container's network. Saved in `~/Documents/` on Okay's Mac; to move to `~/Desktop/dial-maker/research/movements/` (R36):

| File | Source | Pages read |
|---|---|---|
| `Sellita_SW200-1_DocTec_rev07.pdf` | sellita.ch DocTec_SW200-1_7.pdf | 21 (dial, rev A) · 22 (dial, rev B) · 23 (hand heights) |
| `Sellita_SW100_DocTec.pdf` | cousinsuk 9264_sellita 100.pdf | 19 (dial) · 21 (stem) |
| `Miyota_9015-20A_dial_drawing.pdf` · `Miyota_9015_drawing.pdf` | miyotamovement.com/product/9015 → Dial Drawing, Drawing | 1 · 1 (Frame for Case) |
| `Ronda_715_spec.pdf` | gleave.london | 1–2 (links to the drawings) |
| `Ronda_714_715_complete_technical_documentation.pdf` | cousinsuk 9886 | 4 (dial 5010.377) · 11 (hand heights, 2-hand) · 12 (stem) |
| `Ronda_705_715_bundle_beco.pdf` | cousinsuk (beco bundle, 18 p) | 11 (hand heights, 3-hand 715 — sheet 3316.077) |
| `TMI_NH36_spec_sheet.pdf` | TMI /category/25/ (10 p) | 8 (dial: day-date window 3H · 6H, feet) |
| `TMI_NH35_spec_sheet.pdf` | TMI (NH35A) | dial, hand fitting, casing — the sheet Okay screenshotted |
| NH35: Okay's screenshots of timemodule.com NH35_SS.pdf | — | all 11 |

## How to fetch on a Mac

1. Open the link, download the model files (prefer the source: `.scad` over `.stl`).
2. Save under `~/Desktop/dial-maker/research/movements-3d/<calibre>-<site>-<id>/` with the page saved as PDF beside it (author, licence, date).
3. Open a `.scad` in a text editor: the feet coordinates and diameters are plain numbers — copy them into `movements.json` with tag **T** (or **D** where the author cites the maker's drawing, as thing:7020663 does) and name the file in the row.

## What these would close

- The NH35 dial feet (thing:7020663's `.scad`) — today a clock-position description only.
- The NH35 date aperture and its radius (the CGTrader measured dial).
- Casing diameters of nine calibres in one place (the MakerWorld generator), to check against §4 of `movements.md`.
