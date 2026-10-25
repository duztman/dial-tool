# Dial Research — what exists, how it is built, how to work on it

*25 Oct 2026. For a session that continues the research. Read this before touching the document or the page.*

## What exists

| Thing | Where | What it is |
|---|---|---|
| The research document, fourth edition | https://claude.ai/artifact/CcrpwibkqwuyZ2oQ9ppbxr (a Claude Docs doc; edit with the docs tools, never recreate) | The working text: 18 sections, 56 tables, every claim tagged and linked; the Map (Now · Next · Later · Parked); the open questions; 52 further readings; what could not be reached. Tab 2, *Image pool*: Okay's saved pictures, each read against the research and the code. |
| The research page | https://claude.ai/artifact/8JEZRJgc83ht6Xw3YN8sii (an HTML artifact with files) | The edition Okay reads: the document's text reorganised around the tool, 26 figures, 45 openly licensed photos, 105 of Okay's pictures placed in context, a picture beside every imageable table row, a lightbox, light and dark. Design after `guide/help/`. |
| The first edition | https://claude.ai/artifact/RK6D7qM1Kf5qbd1otV7E5G | Superseded; its 17 figures are in the page (recovered from its PDF export). |
| The page's source | `claude/research-page/` in this repo (scripts and data only; the images are not in the repo) | `build2.py` composes the page; `figs.py` draws the SVG figures; `swatches.py` draws the row swatches; `catalogue.py` is the picture pool with its five fields per picture; `template2.html` is the page; `data.json`, `photos.json`, `canon.json` the data. `doc/main.md` is the document's markdown export. |
| The images | not in the repo: Okay's `~/Desktop/dial-maker/` once he unpacks the zip the session sent (`research-page-source.zip`), else regenerate | `img/`: pool tiles and large views (WebP), licensed photos (`cc-*.webp`), canon figures (`canon-*.webp`). |

## How the page is rebuilt

1. Export the document's main tab as markdown with the docs `export` tool into `doc/main.md` (the result lands as base64 in a tool-result file; decode it with Python).
2. Pictures: drop new files into a pool folder, add a line per picture to `catalogue.py` (section, title, shows, means, tool today, possibility, build-list number, focal point, zoom), run the tile script (in `build.py`'s history: it cuts a square tile at the focal point and a 1800 px large view, writes `data.json`).
3. `python3 -I build2.py` → `index.built.html`. Look at it with Playwright (`shot.cjs`, `shot2.cjs`) before publishing; the figures are drawn blind.
4. Publish with the Artifact tool: `file_path` the built page, `root` the site folder, `files` only the image files that are new (published files persist across versions).

## Working rules learned the hard way (the session of 25 Oct 2026 got these wrong)

1. **Pictures first, apparatus later.** Okay wants to see pictures within the first hour. Download, convert, show. Build catalogues and generators after he has seen something.
2. **Research photos are for his eyes.** The page is private. Put every photo an agent fetched in front of him at once; the licence table can follow. Do not hold 31 files for an hour over credits.
3. **Drawings in the canon, not in a hurry.** Figures are made with the Project's generator (`claude/research-figs/figs-v2.mjs` on his Mac: canon colours from `docs/design.md`, Public Sans, the sun at 300°). A quick SVG in the page's tokens is a placeholder, not a figure. If the Mac is not linked, say so and ask for the generator or the figures before drawing substitutes.
4. **Rewrite, don't export.** "Fold the text in" means more detail per bit, written for the page, around the tool. A markdown export with intros on top reads as what it is.
5. **Every imageable row gets an image beside it.** Finishes, lume grades, print methods, stones, failure modes, brands: a swatch or a photo in the first column. This is the single feature he asked for most clearly.
6. **Organise around the tool.** The point → the dial as it is made → lume · ink · finishes · rendering · type · the case → the market → learnings (drawings gathered) → possibilities (one table by build-list number) → the record.
7. **Images in the document cannot be fetched from a cloud session.** The Artifact asset read fails. Recover them by exporting the tab as PDF and running `pdfimages -png`; the figures come out at 1960 px.
8. **Wikimedia throttles the container's address.** Originals return 429. Fetch `https://commons.wikimedia.org/wiki/Special:FilePath/<File name>?width=1920` with 6–9 s between requests; the API (`action=query&prop=imageinfo&iiprop=url|extmetadata`) gives author and licence.
9. **The proxy refuses** Kickstarter, BackerKit, Reddit, WatchUseek, most brand sites, Fiverr, Upwork, Behance, Alibaba, Watchonista, Oracle of Time, WatchPro, Bloomberg. Facts that reach the doc only from a search snippet are marked "not opened" and tagged [I]. Ask Okay for PDFs of what matters; he reads them in as [F].
10. **Research agents run out of searches** at about 40–200 queries each. Give each a narrow brief and ask for "opened" and "snippet only" in separate tables.
11. **The rail must scroll** on an iPad (dynamic viewport height, overflow-y auto). Check at 1024 px landscape.
12. **Before anything non-trivial**: state the reading of the goal, five lines of plan, at most three questions, then wait. When he says design is automatic, stop asking about design.

## Where the research stands (25 Oct 2026)

- The Map's Now is v1 work (#511, #506, #507, #510, #526, #536); the research changes nothing there. Next: lume as an ink with grade and layer count (#545), the Day · Night switch (#532), the finest-line check with text measured (#225). Later: the proof sheet for a factory, pattern rings (#33), case kinds beyond the four (#484, #363).
- Least verified: the pain ranking (11 of 27 incidents from unopened snippets); the sunburst bow-tie's direction (a derivation; a phone torch settles it); every toner number is copper PCB, not brass.
- Waiting on Okay: PDFs of the Reddit, WatchUseek and Kickstarter threads listed in the document's *Their pain* and *Sources and reach*; any brand photos he saves (no openly licensed photo exists for Baltic, Studio Underd0g, Furlan Marri, Nodus, anOrdain, Serica, Brew, Zelos, Vero, Traska, Formex or any fair).
