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
// what a mono print mask loses (#220; found 15 Oct 2026 by the guide's blind reviewers: the Sector dial's chapter band
// swallows its ticks and numerals): ticks lying on a band of another colour are named; knocked out of the band, or of
// one colour with it, they are not
{
  const K = (name) => G.KINDS.indexOf(name), R = 14;
  const dial = (ticks, band) => G.build_static(G.fresh_settings({ da_on: false, rings: [
    { ...G.RING_BASE, name: "Ticks", kind: K("ticks"), r: R, count: 60, len: 1.5, w: 0.2, c: [0, 0, 0, 1], ...ticks },
    { ...G.RING_BASE, name: "Chapter", kind: K("band"), r: R + 0.5, count: 1, width: 3, c: [0.8, 0.2, 0.1, 1], ...band }] }));
  const said = (st) => G.mask_merges(st).map((m) => `${m.top} on ${m.under}`).join(" · ") || "none";
  const lost = said(dial({}, {})), knocked = said(dial({}, { knock: G.KNOCK_FROM.indexOf("everything above"), clear: 0.2 })), one = said(dial({}, { c: [0, 0, 0, 1] }));
  check(lost === "Ticks on Chapter" && knocked === "none" && one === "none", `a mono mask's losses: ticks on a red band (${lost}); knocked out of it (${knocked}); both black (${one})`);
}
process.exit(bad ? 1 : 0);
