// labels: Numbers that start again after n positions (13 Oct 2026). Run by `npm test`.
import { engines } from "./engines.mjs";
const G = await engines();
let bad = 0;
const check = (ok, what) => { console.log((ok ? "ok    " : "FAIL  ") + what); if (!ok) bad++; };
const ring = (o) => ({ ...G.RING_BASE, kind: 2, labels: G.LABEL_SETS.findIndex((s) => s[0] === "Numbers"), ...o });
const two_hours = G.ring_labels(ring({ count: 24, num_from: 5, num_step: 5, num_again: 12 }));
check(two_hours.join(" ") === "5 10 15 20 25 30 35 40 45 50 55 60 5 10 15 20 25 30 35 40 45 50 55 60", "a two-hour track: 24 numerals, 5 to 60 twice");
const ferguson = G.ring_labels(ring({ count: 60, num_from: 0, num_step: 1, num_again: 10 }));
check(ferguson.slice(8, 13).join(" ") === "8 9 0 1 2" && ferguson[59] === "9", "Ferguson's minute digits: 0 to 9, six times round");
check(G.ring_labels(ring({ count: 14, num_from: 0, num_step: 5 })).join(" ") === "0 5 10 15 20 25 30 35 40 45 50 55 60 65" && G.RING_BASE.num_again === 0, "0, the start, counts on as before (R31)");
process.exit(bad ? 1 : 0);
