# Movements — 3D files, templates and generators found on the way

*10 Nov 2026. Okay: "record a copy of 3d files for all movements that pass through your hands under research today for others to use." The files themselves could not be copied from the research container (the hosts refuse it and the files are binaries); this is the catalogue — what each is, where, what it encodes, and how to fetch it. Copies, once fetched on a Mac, go to `~/Desktop/dial-maker/research/movements/3d/` (R36: pictures and binaries stay on the Mac, not in the repo); add the file name to the row.*

Tag: **D** built from the maker's drawing (says so) · **T** built from a measured part · **?** origin not stated. Licences are the sites' defaults (Thingiverse/Printables: usually CC BY; MakerWorld: per model) — check before reuse.

| Calibre | What | Where | Encodes | Tag | Copy |
|---|---|---|---|---|---|
| NH35 (dial feet) | Miyota 2035 movement holder with holes at the NH35 dial-feet positions, OpenSCAD source included — the .scad carries the feet coordinates the author took from TMI's spec sheet | Thingiverse thing:7020663 (kennethlee) — `2035_NH35dial.scad` + `.stl`, CC BY-SA | NH35 dial feet: angles and radius (the one source that encodes them numerically) | D | zip in ~/Downloads (11 Nov) |
| NH35 (dial feet, 3 and 3.8 crowns) | VH31 / Miyota 2115 → NH35 case spacer with feet holes for both crown positions (TinkerCAD remix) | Thingiverse thing:6683661 (KenVersus) — one `.stl`, CC BY-NC-SA; his own VH31 spacer thing:6784946 | feet holes for the 3:00 and 3.8 layouts; feet Ø ≈ 0.65 (another spacer, Printables 1194756, says the holes are drawn 1.0 for a 0.65 foot) | T | zip in ~/Downloads (11 Nov) |
| NH35 (dial feet) | VH31 → NH35 movement adapter with 28.5 dial seat and feet holes | Thingiverse thing:7313698 (kenweise, Mar 2026) — `.stl` + `.f3d` Fusion source, CC BY-NC-SA | 28.5 seat, feet holes | T | zip in ~/Downloads (11 Nov) |
| NH35 (dial) | 3D-printable dial for NH34/35/36, 28.8 mm | MakerWorld 1122615 | a dial's outline, centre hole and feet; untested on a movement | ? | — |
| NH35 (dial) | A diver dial modelled by disassembling and measuring an original NH35 dial | CGTrader "a classic diver sport watch" | dial outline, date aperture and feet as measured from a real Seiko dial — the best lead for the date radius | T | — |
| NH35 (tool) | Laser dial holder / logo alignment tool | Printables 1286501 (jomiller97) | 28.5 dial seat | T | — |
| NH35 · SW200 · ETA 2824/2836/2892 · SW300 · 9015 · 8215 · 6497 | **Movement-ring generator** (OpenSCAD, presets for all of these, dial-seat recess, off-centre and rotated movements) | MakerWorld 3440336 | casing Ø and heights of nine calibres as the author uses them; the .scad is included | ? | — |
| NH35 · 7S26 · 2824-2 · 2836 · 8215 · ST1612/ST2130 · DG2813 · PT5000 · Vostok | **Dial-feet stencil** for marking feet on a blank, one print | Shapeways MYU2CFUDR (Claassen Design) | the feet positions of all the listed calibres, as a physical template (no numbers published) | ? | — |
| Miyota 2305 | Day-date quartz holder for NH3 cases | Printables 1182657 (kenVersus) | the 2305's outline in a 29.36 seat | T | — |
| Miyota 2035 | Holder for NH35 cases (see row 1) and the "Trolex" printed watch built round a 2035 | Thingiverse 6789735 (`Miyota_2035.stl`, CC BY-NC-SA — a model of the movement itself); MakerWorld 463323 | the 2035's body as a solid | T | zip in ~/Downloads (11 Nov) |
| NH35/4R35, NH36 | Movement holders for work (dial-up, rotor free) | Thingiverse 3471154 (AG875, `Seiko_movement_holder.stl`, CC BY), MakerWorld 668644, 1645845 | outside Ø 27.40, rotor clearance | T | zip in ~/Downloads (11 Nov) |

## The maker PDFs, fetched (10 Nov 2026)

Through the desktop PDF tools (`fetch_pdf_from_url` on the Mac, then `render_pdf_page` to read a page as a picture) — the way around the research container's network. Archived 11 Nov 2026 in `~/Desktop/dial-maker/research/movements/pdf/` on Okay's Mac (re-fetched there with `fetch_pdf_from_url`'s `destination_dir`; the first copies of 10 Nov sit in `~/Documents/`). Models go in `~/Desktop/dial-maker/research/movements/3d/` (README there says how):

| File | Source | Pages read |
|---|---|---|
| `Sellita_SW200-1_DocTec_rev07.pdf` | sellita.ch DocTec_SW200-1_7.pdf | 21 (dial, rev A) · 22 (dial, rev B) · 23 (hand heights) |
| `Sellita_SW100_DocTec.pdf` | cousinsuk 9264_sellita 100.pdf | 19 (dial) · 21 (stem) |
| `Miyota_9015-20A_dial_drawing.pdf` · `Miyota_9015_drawing.pdf` | miyotamovement.com/product/9015 → Dial Drawing, Drawing | 1 · 1 (Frame for Case) |
| `Ronda_715_spec.pdf` | gleave.london | 1–2 (links to the drawings) |
| `Ronda_714_715_complete_technical_documentation.pdf` | cousinsuk 9886 | 4 (dial 5010.377) · 11 (hand heights, 2-hand) · 12 (stem) |
| `Ronda_705_715_bundle_beco.pdf` (in ~/Documents only) | cousinsuk (beco bundle, 18 p) | 11 (hand heights, 3-hand 715 — sheet 3316.077, height 6) |
| `Ronda_3316.030_hand_heights_0-5_705_715.pdf` | beco-technic.com ronda_HF0-5_712-715 | 1 (hand heights 0–5, 3-hand) |
| `Miyota_8215_drawing.pdf` · `Miyota_9015_spec.pdf` | miyotamovement.com | — (the 8215 drawing is §4.9's source) |
| `TMI_NH36_spec_sheet.pdf` | TMI /category/25/ (10 p) | 8 (dial: day-date window 3H · 6H, feet) |
| `TMI_NH35_spec_sheet.pdf` | TMI (NH35A) | dial, hand fitting, casing — the sheet Okay screenshotted |
| NH35: Okay's screenshots of timemodule.com NH35_SS.pdf | — | all 11 |

## Fetching from the research container — tried 11 Nov 2026

The container's network: GitHub and package registries only. Exa reads Thingiverse pages as empty (JS-rendered). Apify's Thingiverse scraper (`maximedupre/thingiverse-scraper`) returns each thing's file names, CDN links and licence — the file lists above came from it — but Thingiverse answers **403** to any non-browser download of the zip or the CDN file; a proxy run to get past that is bot-check circumvention and was not done. GitHub holds no usable movement models (searched). **What works (11 Nov 2026, 00:05): the Mac's browser pane** (`Claude_Browser__navigate` to `thingiverse.com/thing:<id>/files`, reject the cookie banner once, click "Download all files", wait ~8 s for "Download completed"). It is a real browser session, so Thingiverse serves the zip; the file lands in `~/Downloads/` on the Mac — a folder the session cannot open until it is added to the session ("Add folder" in the desktop app) — so the last step is moving `thing-<id>.zip` into `3d/`. Done that night for all five Thingiverse things (7020663 · 6683661 · 7313698 · 6789735 · 3471154). Printables holds the pane on a Cloudflare bot check and MakerWorld needs a login: neither was pushed through; those two need Okay's own browser.

## How to fetch on a Mac

1. Open the link, download the model files (prefer the source: `.scad` over `.stl`).
2. Save under `~/Desktop/dial-maker/research/movements-3d/<calibre>-<site>-<id>/` with the page saved as PDF beside it (author, licence, date).
3. Open a `.scad` in a text editor: the feet coordinates and diameters are plain numbers — copy them into `movements.json` with tag **T** (or **D** where the author cites the maker's drawing, as thing:7020663 does) and name the file in the row.

## What these would close

- The NH35 dial feet (thing:7020663's `.scad`) — today a clock-position description only.
- The NH35 date aperture and its radius (the CGTrader measured dial).
- Casing diameters of nine calibres in one place (the MakerWorld generator), to check against §4 of `movements.md`.
