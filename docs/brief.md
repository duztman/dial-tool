# Dial Tool — brief

*Started 3 Oct 2026. Last updated 21 Oct 2026 (§4 moved to `docs/decisions.md`; v1 drafted in the build list; square dials after v1; §3 and §6 brought up to beta 4.90).*

## 1 · Goal

A tool to design watch dials for a watch Okay will actually build. One tool, four jobs:

- **Explore** — sketch variations fast, test proportions.
- **Present** — clean vector sheets, animated loops (moving hands), variation grids.
- **Produce** — files that go to real production: etched brass (toner transfer), pad or screen printing, laser.
- **Learn** — Okay learns the concepts of generative design along the way (concepts, not syntax).

Not photorealistic. Real proportions and perfect vector rendering are.

## 2 · Context and constraints

- Okay: graphic designer; uses Illustrator daily, also InDesign, After Effects, LightBurn. Comfortable with code; wants to understand what it does.
- Machines: Macs, both Apple Silicon and Intel (macOS 15; the Intel one has integrated graphics — the slowest machine to test speed on), an iPad and an iPhone. The tool runs in Chrome on the Macs and in Safari on the iPad and the phone.
- Existing practice: prototyping dials by acid-etching brass blanks with toner transfer (PnP Blue film). Pad printing is the industry pipeline.
- Materials and parts are sourced locally: don't plan around ordering from abroad (books excepted).
- The movement is not chosen yet — design first, then pick a movement that fits.
- **Production doesn't limit design** (Okay, 4 Oct 2026). The production outputs stay and grow, but what the tool can draw is not narrowed to what a method can print; production-specific checks and outputs are optional layers on top.

## 3 · Outputs

| Output | Format | Notes |
|---|---|---|
| Design / present | PDF, SVG → Illustrator | True size in mm; numerals as outlines; every part a named layer in the PDF; *Keep numerals as text in the SVG* as an option (R10) |
| Image | PNG (dpi set) | The dial at the page's size |
| Production mask | PDF, SVG, PNG | Mono; mirrored for toner transfer; cut lines, inverted, outline and registration marks as asked (Export → Print); one mask PDF per ink |
| Print sheet | PDF | Copies at true size on A4 · Letter · A5, cut lines (Export → Print) |
| Spec sheet | SVG | The dial with each ring's radius marked and tables of rings, hands and windows, for a print shop (Export → Print) |
| Moving picture | MP4, GIF | The hands turning from the time shown (Export → Moving picture) |
| Watch | APK | A Wear OS watch face to sideload (Export → Wear OS) |
| Sharing | a link · a settings file (JSON) | A link carries what differs from the starting values (R31); a file keeps everything |

Not built: imported SVG, PDF and AI shapes for markers and hands (#50, R23).

## 4 · Decisions

The dated record of decisions and their reasons is `docs/decisions.md` (moved 21 Oct 2026). Read it when you need to know why something is as it is; the last ~25 rows show the recent work.

## 5 · Open questions

1. **Movement** — which one? It fixes the real dial diameter, hand lengths, the date window's position and size (date wheel), and the feet positions.
3. **Minimum line width and clearance** per production method (toner-transfer etching, pad print, laser). Should become rules the tool can warn about (build list #12).
4. **Eastern Arabic and Chinese labels** — HarfBuzz has no automatic fallback, so a script the font lacks draws nothing: a fallback-font control (build list #15; Okay, 17 Oct 2026: "not necessary, we run on fonts").
5. Do the tool's SVG and PDF open in Illustrator at **exact size**, with usable layers and groups, and does the SVG's live text land where the outlines do? Not yet looked at on a Mac (build list #16).
8. **Imported shapes with real Illustrator files** — forms, compound paths, white made in spot or CMYK colours — when imports are built (build list #50).
12. **Installed fonts on Okay's Macs** — does Chrome list Helvetica Neue (a collection file) for the page, and do the numerals match `archive/drawbot/dial.py`'s?
14. **Okay's Mac clone** (`~/Desktop/dial-maker/dial-tool-github-repo/`): no session since 16 Oct has been linked to his Mac, so it has not been pulled since 4.40–4.45. Okay, 17 Oct: "if you can reach mc do clone if not never bother anymore" — **not to be raised again**; he pulls it himself when he wants it (and `tools/versions.sh tag` there).

Numbers are never reused; a settled question is deleted here and its decision stands in `docs/decisions.md`.

## 6 · Avenues (ideas, not commitments)

- Subdials (small seconds, chronograph registers) — perhaps as further ring kinds (build list #20).
- Surface finishes on bands: sunray, grain, guilloché (Okay: flat for now; #33).
- Variation grid: one rule set, many dials on one sheet (#17; a sheet of saved dials exists, Versions › Sheet).
- More hand styles: cathedral (through file import); lume plots (#19).
- Plotter output via LightBurn for the pen plotter (AxiDraw clone; #21).
- Production warnings: flag lines thinner than the method allows (#12; the Export log already names the thinnest line, #225).
- An Apple Watch preview (#362); non-round dials — square and rounded square after v1 (#484), the rest later (#363).

## 7 · Workflow

1. Claude changes the web version (`web/src/`), runs `cd web && npm test` and looks at the pictures in `web/test/out/` (R19), builds `web/dial-tool.html`.
2. Work happens on `dev`, one push per small change, the version number in `web/src/geometry.js`. For Okay to see a change, `tools/release.sh <version>` puts the build on the live page (https://duztman.github.io/dial-tool/) and writes its row in `docs/versions.md`; `tools/release.sh main` releases.
3. Okay opens it in Chrome on a Mac or Safari on the iPad and reports back with screenshots, notes and the Export section's log.
4. Every version has a changelog entry; decisions go to `docs/decisions.md` and the build list the same day.

## 8 · Parked

- Editing on the preview with movers and shifters (spread the numerals…), after Illustrator's radial Repeat and Gradient tools; detailed settings stay in the panel. Parked by Okay on 11 Oct 2026 (build list #61); the ring and hand handles exist (#345).
- Snapping lengths and radii to rings' edges while dragged; a hand's tip set to a ring's edge (build list #85, #184; Okay, 14 Oct 2026: "a bigger question for later").
- A background image on the plate — only its button exists (build list #73; Okay, 12 Oct 2026: "Just the button").
- Persistent groupings for every section (build list #77; Okay, 12 Oct 2026: "Park for now").
- The LINK pill on pairs other than a window's width and height (build list #358; Okay, 18 Oct 2026: "Common sense or park for now").
- From the research atlas (13 Oct 2026, https://claude.ai/artifact/QdvVC37Y6csV7FcUjJHqAH), Okay's No's worth keeping (kept on Claude's proposal; Okay has not confirmed this list):
  - **Snail tachymeter** (atlas 1.6): a reciprocal scale wound into a spiral — a fifth positions law where the radius falls with the angle. Comes back only after the positions law (#83).
  - **Disorder with a seed** (atlas 7.14, Vera Molnár): a disorder % per ring with a typed seed, so a link redraws the same dial.
  - The other No's stay in the atlas only: 6.21 the ring as a sentence · 7.6 Citroën CX satellites · 7.7 Apian's volvelles · 7.11 Mengenlehreuhr · 7.12 case outline (TWELVE, ROKU) · 7.18 Powers of Ten · 7.20 Kenya Hara's emptiness. 2.10 is a decision, not a parked idea (§4).
- From the same review, Okay's Yes's that Claude proposes to park (build list #90, #91): the ring edited flat (atlas 7.16) and the sliding strip for Count (atlas 7.5).
- Gerstner's programme (build list #180; Okay: "park for now, remind when applicable" — when #169 exists).
