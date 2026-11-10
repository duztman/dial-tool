# Research — the index

*10 Nov 2026. Every study the project has done, in one folder. Read the study the task touches before searching the web again; file new research here, not in a session's notes. Okay, 10 Nov 2026: "This research is crucial and shared by all."*

## The studies

| Study | File | What it holds | Read it for |
|---|---|---|---|
| **Dials** | `dials.md` (+ the research atlas, a claude.ai document and page it links; source `claude/research-page/`) | What exists on real dials: hands, indices, windows, complications, finishes, patents, interface inspiration — 18 sections, 56 tables, every claim tagged | Any feature that draws something a watch has; the atlas's Now · Next · Later · Parked map |
| **Fonts** | `fonts.md`, `font-tiers.md` | Which fonts Okay accepted (Wiegel's 46, Font Picks' 49), their licences, the tiers of the font list | The font sheet (R35), adding a font, the Wiegel project |
| **Movements** | `movements.md` + `movements.json` | The calibres a dial inherits its numbers from: diameters, heights, hand holes and heights, windows and their discs, feet, case floor — five shown in the tool, three spares, and Any | #586 (Choose your movement), #89, #176, #584's heights, the Show Case's case, anything "does this fit a real watch" |

## How a study is written

- One file per subject, dated at the top, written for the agent that builds from it: what was asked (Okay's words), what was found, what it means for the build, what was not reached and how to get it.
- **Every number carries a tag**: **D** documented by the maker (a spec sheet or its drawing) · **T** trade figure (dealers, parts catalogues, mod shops — reliable, not the maker's drawing) · **I** inferred by Claude from documented numbers (say how) · **?** not found. A cell without a tag is a mistake.
- Sources named inline, in the row (the maker and page where a number is from; the forum and thread for a practical). No source, no number.
- Data the tool will read goes beside the study as JSON with the same tags (`movements.json`), mm throughout (R1), keys that will not be renamed (R8).
- A study states the present: when a number is superseded, replace it and say what superseded it; chronology is git's.
- Links to the atlas, PDFs and pages are kept even when the workspace cannot fetch them, with the way to read them (a Mac, a browser) in the study's last section.

## Adding to this folder

1. Put the file here, add its row above, and a row in `docs/decisions.md` if the study settled anything.
2. Point the build-list item at it (`docs/build-list.md`, the item's row and its note).
3. `README.md` at the repo root lists this folder once; it does not list each study.
