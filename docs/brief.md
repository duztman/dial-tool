# Dial Tool — brief

*Started 3 Oct 2026. Last updated 10 Nov 2026 (§5.1: #585, the movement choice);  1 Nov 2026 (the docs' audit: §5–§8 brought in line with the build list; v1 is behind us — a beta counts as v1).*

## 1 · Goal

A tool to design watch dials for a watch Okay will actually build. One tool, four jobs:

- **Explore** — sketch variations fast, test proportions.
- **Present** — clean vector sheets, animated loops (moving hands), variation grids.
- **Produce** — files that go to real production: etched brass (toner transfer), pad or screen printing, laser.
- **Learn** — Okay learns the concepts of generative design along the way (concepts, not syntax).

Not photorealistic. Real proportions and perfect vector rendering are.

## 2 · Context and constraints

- Okay: graphic designer; uses Illustrator daily, also InDesign, After Effects, LightBurn. Comfortable with code; wants to understand what it does.
- Machines: Macs, both Apple Silicon and Intel (macOS 15; the Intel one has integrated graphics — the slowest machine to test speed on), an iPad and an iPhone. The tool runs in Chrome on the Macs and in Safari on the iPad and the phone. The phone's layout is not cared for until Okay says so (2 Nov 2026: "we do not care about the iphone layout anymore, do not fuss over it until this state is changed by me"): the window test's phone checks are said, never counted.
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

Not built: SVG import — a picture, a logo, marker and hand shapes, a moon's picture, a template (#173, R23).

## 4 · Decisions

The dated record of decisions and their reasons is `docs/decisions.md`. Read it when you need to know why something is as it is; the last ~25 rows show the recent work. A decision made in a session goes there the same day, as a row with Okay's words.

## 5 · Open questions

Numbers are never reused; a settled question is deleted here and its decision stands in `docs/decisions.md`.

1. **Movement** — which one? It fixes the real dial diameter, hand lengths, the date window's position and size (date wheel), and the feet positions (#89 waits on it). Since 10 Nov 2026 the tool is to offer five calibres and an imaginary Any (#586): the numbers are `docs/research/movements.json`, the research `docs/research/movements.md`.
8. **Imported shapes with real Illustrator files** — forms, compound paths, white made in spot or CMYK colours — to settle when import is built (#173).
15. **Show Case 3D in the tool** — it is Dial Tool Pro's (with Dial Tool; an iPad app considered), and when it comes in, the 3D scene replaces show mode's look; everything up to v1.2 is open source (decisions, 11 Nov 2026). Pro's work is in the private repo duztman/dial-tool-pro. Open: where this public repo's work stops after v1.2.
14. **Okay's Mac clone** (`~/Desktop/dial-maker/dial-tool-github-repo/`): his; he pulls it himself when he wants it (Okay, 17 Oct 2026: "if you can reach mc do clone if not never bother anymore") — **not to be raised again**.

## 6 · Avenues (ideas, not commitments)

Every avenue is a row in `docs/build-list.md`, under Later; this section only says which: a variation grid from one rule set (#17 left this open; Versions › Sheet exists), finishes and materials (#522), non-round dials (#363), an Apple Watch preview (#362), plotter output for the pen plotter (#21), movement numbers (#89). Production warnings (#12) were dropped: the Export log names the thinnest line (#225) and production doesn't limit design (§2).

## 7 · Workflow

The loop of a push — set up, change, test, docs, bump, release, reply — is `CLAUDE.md`; how a session goes with Okay (rounds, crops, his notes, the archive) is `docs/working-with-okay.md`. In short: work on `dev`; a small push goes to the /dev/ page, a step to the released page on Okay's word (R19); he tests in Chrome on a Mac and Safari on the iPad and answers with marked-up screenshots and the Export log; every version has a changelog section, every decision a row in `decisions.md` and its line in the build list, the same day.

## 8 · Parked

What is parked is the Parked section of `docs/build-list.md`, with Okay's words: editing on the preview (#61), persistent groupings (#77), the LINK pill on other pairs (#358), a fallback font (#15), placing dials in the Packer's discs (#395). Snapping (#184) is no longer parked: it is first of the features (Okay, 1 Nov 2026).

From the research atlas (13 Oct 2026, https://claude.ai/artifact/QdvVC37Y6csV7FcUjJHqAH), Okay's No's worth keeping — kept on Claude's proposal, not confirmed by him: the **snail tachymeter** (atlas 1.6), a fifth positions law after #83; **disorder with a seed** (atlas 7.14, Vera Molnár), a disorder % per ring with a typed seed. The other No's stay in the atlas. Of his Yes's, two are parked on Claude's proposal: the ring edited flat (7.16) and the sliding strip for Count (7.5).
