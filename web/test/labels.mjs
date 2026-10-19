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
// every file says which build made it (#226): a PNG's text record and dpi, an SVG's metadata
{
  const { png_with_dpi, svg_document, MADE_BY } = await import("../src/output.js");
  const tiny = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC", "base64"));
  const png = Buffer.from(png_with_dpi(tiny, 600)), text = png.indexOf("tEXtSoftware"), said = text > 0 ? png.subarray(text + 13, text + 13 + png.readUInt32BE(text - 4) - 9).toString() : "";
  const S = G.fresh_settings({}), svg = svg_document(S, G.build_static(S), 0);
  check(said === MADE_BY && MADE_BY.endsWith(G.VERSION) && png.includes("pHYs") && svg.includes(`<metadata>${MADE_BY}</metadata>`), `files carry the build: the PNG's Software "${said}", the SVG's metadata`);
}
// a hand's own Bevel (20 Oct 2026): off to start; an older dial that drew bevels (Bevels % above 0, no per-hand key) keeps them on every hand; a dial made since says each hand's own, so it comes back as it was
{
  const old = G.fresh_settings({ sh_bevel: 60 }), plain = G.fresh_settings({}), mine = G.fresh_settings({}); mine.sh_bevel = 60; mine.ha_hour.bevel = true;      // made in the tool: Bevels % 60, the hour hand's Bevel on
  const again = G.fresh_settings(JSON.parse(JSON.stringify(G.lean(mine))));
  const say = (S) => ["hour", "minute", "second"].map((h) => (S["ha_" + h].bevel ? 1 : 0)).join("");
  check(say(plain) === "000" && plain.sh_bevel === 100 && say(old) === "111" && say(again) === "100" && again.sh_bevel === 60, `Bevel per hand: none to start (${say(plain)}); an older dial with Bevels % keeps them on every hand (${say(old)}); a dial made since comes back as made (${say(again)})`);
}
process.exit(bad ? 1 : 0);
