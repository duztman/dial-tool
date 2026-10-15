# Guide hours

*The log `guide/PLAN.md` §5 asks for: per step, hours spent, of which pipeline (scripts that make pictures or check claims). Estimate 45 h, pipeline 11 h, at most a third. Times are Claude's working time, Istanbul.*

| Step | Date | Estimate h | Spent h | of which pipeline | Note |
|---|---|---|---|---|---|
| Plan and its review | 15 Oct, 08:50–09:40 | — | 0.8 | — | before the steps; three blind reviewers, three rounds |
| 1 Inventory | 15 Oct, 09:45–09:51 | 4 | 0.1 | 0.05 | coverage walk: 153 states, 366 names, 14 s |
| 2 Brief | 15 Oct, 09:51 | 0.5 | 0.05 | — | waiting for Okay's word |
| 3 Baseline | 15 Oct, 09:55–10:35 | 1.5 | 0.7 | 0.2 | target + scorer (pipeline); three readers ran in parallel (≈30 min) |
| 4 Edition 1 text | 15 Oct, 10:35–11:00 | 3 | 0.6 | 0.4 | 26 checks (`checks/checks.mjs`, 1 m 50 s a run) and the gate (`tools/claims.mjs`); 37 sentences name them. Interrupted 10:47–10:58 for 4.41.15 (not counted) |
| 5 First dial | 15 Oct, 11:00–11:25 | 2 | 0.4 | 0.3 | `checks/first-dial.mjs`: ten steps done like a person, a link and a picture each; the PDF checked (34 on 40 mm); plain page `web/build.mjs` |
| 6 Reader test | 15 Oct, 11:25–12:15 | 3 | 0.8 | 0.2 | two AI rounds (`tests/round-1.md`, `round-2.md`), drafts 2 and 3; checks 27 → 31. Humans' round waits for edition 1 |
