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
// the stroke round letters in a narrow counter (#563; Okay, 1 Nov 2026: "The stroke at an exact point here gets a glitch
// inside shapes like 8 and 9"): Saira at weight 800, an 8 of 1.66 mm, a stroke of 0.28 outside — the counters, narrower
// than twice the stroke, close whole: the stroke is one contour round the 8, no sliver left inside; a thin stroke keeps
// them open; a stroke inside the letter keeps the letter's body
{
  const fs = await import("fs");
  const info = G.add_font(new Uint8Array(fs.readFileSync("fonts/Saira-wdth-wght.ttf")));
  const t = { ...G.RING_BASE, ps: info.ps, axes: { wght: 800 }, features: {}, tracking: 0, lang: 0 };
  const eight = G.text_path("8", t, 1.66), nine = G.text_path("9", t, 1.66);
  const thick = G.stroke_outline(eight, 0.28, "Outside", "Miter").contours().length, thin = G.stroke_outline(eight, 0.06, "Outside", "Miter").contours().length;
  const body = G.stroke_outline(nine, 0.1, "Inside", "Round"), kept = nine.difference(body).contours().length;      // the 9 less its inside stroke: its body remains
  check(thick === 4 && thin === 6 && kept >= 1, `the stroke round an 8: at 0.28 outside the counters close whole, filled by the stroke (${thick} contours: outside, against the letter, the two counters — six with the folds that were); at 0.06 the counters stay open (${thin}); an inside stroke of 0.1 leaves the 9's body (${kept}) (#563)`);
}
// a saved SVG says each part's heights (#584; Okay, 10 Nov 2026: "i need you to get height and thickness values as well, this preview
// depends on it"): the facts are there, they are the dial's own numbers, and without them the file is as it was, letter for letter
{
  const O = await import("../src/output.js"), SHOW = await import("../src/show.js"), { OPENER } = await import("../src/opener.js");
  const S = G.fresh_settings(OPENER); S.sh_minute = 0.42; S.rings[0].ink_h = 0.07;
  const st = G.build_static(S), plain = O.svg_document(S, st, 0, {}), told = O.svg_document(S, st, 0, { facts: SHOW.svg_facts(S) });
  const of = (id) => Object.fromEntries([...(told.match(new RegExp(`<path id="${id}"([^>]*?) d="`))?.[1] ?? "").matchAll(/ data-([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  const first = told.match(/<path id="([^"]+)" data-role="ring" data-ink="0\.07"/)?.[1];
  check(told.replace(/ data-[a-z-]+="[^"]*"/g, "") === plain, "a saved SVG's facts are attributes only: without them the file is the plain one, letter for letter");
  check(of("minute-hand").over === "0.42" && of("minute-hand").hand === "minute" && of("cap").over === String(S.sh_cap) && of("plate").role === "plate" && Boolean(first) && /data-dial-d="34"/.test(told),
    `"height and thickness values as well": the minute hand says its height (${of("minute-hand").over} mm), the cap its own, the first ring its ink's thickness (0.07 mm, ${first}), the dial its Ø`);
  S.out_production = true; check(!/data-role/.test(O.svg_document(S, G.build_static(S), 0, { facts: SHOW.svg_facts(S) })), "a print mask carries no facts");
}
// #585, #587: the hands start at a real movement's heights, and every movement's heights come from the one record
{ const D = G.DEFAULTS, by = (id) => G.movement(id), m8 = by("miyota-8215").heights, T = G.HAND_T;
  const own = ["hour", "minute", "second"].every((h) => D["sh_" + h] === m8[h]) && D.sh_cap === m8.cap;
  const worked = G.MOVEMENTS.filter((m) => m.heights?.from === "posts"), fit = worked.every((m) => { const [a, b, c] = m.heights.room, h = m.heights; return h.hour >= 0 && h.hour + T <= a + 1e-9 && h.minute >= a - 1e-9 && h.minute + T <= b + 1e-9 && h.second >= b - 1e-9 && h.second + T <= c + 1e-9 && h.cap === c; });
  check(own && fit && worked.length >= 4, `"Amazing. Implement.": a new dial's hands stand at the Miyota 8215's heights (${D.sh_hour} · ${D.sh_minute} · ${D.sh_second}, cap ${D.sh_cap}); in each of the ${worked.length} movements worked out from its posts a ${T} mm hand lies inside its own space and the cap's top is the seconds post's tip`);
  const nh = by("nh35");
  check(nh.heights.from === "maker" && nh.heights.hour === 0.6 && nh.heights.cap === 1.91 && nh.hand_t.second === 0.1 && by("any").name === "Imaginary Movement" && by("any").heights === null && by("eta-6497-1").heights === null,
    `"a system for values about various movement types": the NH35's hands stand where TMI's sheet puts them (${nh.heights.hour} · ${nh.heights.minute} · ${nh.heights.second}, hands ${nh.hand_t.hour} · ${nh.hand_t.minute} · ${nh.hand_t.second} thick); a movement without printed heights has none; "call it Imaginary Movement"`);
}
// #588: the posts, for the 3D view's side
{ const M = await import("../src/movements.js"), nh = M.movement("nh35"), my = M.movement("miyota-8215");
  check(JSON.stringify(M.HOLE_FIT) === JSON.stringify(G.HOLE_FIT) && nh.posts.top.hour === 0.78 && nh.posts.d.hour === 1.5 && my.posts.top.hour === 0.73 && my.posts.top.second === 1.45 && M.movement("any").posts === null,
    `"do the accurate hand pipes": a movement says its posts — the NH35's hour wheel Ø ${nh.posts.d.hour} to ${nh.posts.top.hour} over the dial, flush with its hand's top; the 8215's to ${my.posts.top.hour}, the seconds tip at ${my.posts.top.second}; without a movement the tool's own hand holes`);
}
process.exit(bad ? 1 : 0);
