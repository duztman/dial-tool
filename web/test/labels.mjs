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
  const first = told.match(/<path id="([^"]+)" data-role="ring" data-make="printed" data-ink="0\.07"/)?.[1];
  check(told.replace(/ data-[a-z-]+="[^"]*"/g, "") === plain, "a saved SVG's facts are attributes only: without them the file is the plain one, letter for letter");
  check(of("minute-hand").over === "0.42" && of("minute-hand").hand === "minute" && of("cap").over === String(S.sh_cap) && of("plate").role === "plate" && Boolean(first) && /data-dial-d="34"/.test(told),
    `"height and thickness values as well": the minute hand says its height (${of("minute-hand").over} mm), the cap its own, the first ring its ink's thickness (0.07 mm, ${first}), the dial its Ø`);
  S.out_production = true; check(!/data-role/.test(O.svg_document(S, G.build_static(S), 0, { facts: SHOW.svg_facts(S) })), "a print mask carries no facts");
}
// the dial's parts (parts.js; Okay, 11 Nov 2026: "the rules in dial tool and 3d should be synced, caps for hands, hand thicknesses etc
// can also be decided from dial tool"): a saved part's attributes read back to the same record; a file from before the record reads
// with its make worked out and the stack's thicknesses; the dial says the stack's rules
{
  const P = await import("../src/parts.js"), SHOW = await import("../src/show.js"), O = await import("../src/output.js"), { OPENER } = await import("../src/opener.js");
  const S = G.fresh_settings(OPENER); S.ha_hour.bevel = true; S.ha_hour.bevel_look = 2;
  const svg = O.svg_document(S, G.build_static(S), 0, { facts: SHOW.svg_facts(S) }), attrs = (id) => Object.fromEntries([...(svg.match(new RegExp(`<path id="${id}"([^>]*?) d="`))?.[1] ?? "").matchAll(/ data-([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  const back = (id) => P.read_part((k) => attrs(id)[k] ?? null), hour = back("hour-hand"), cap = back("cap"), ring = back("numerals");
  const old = P.read_part((k) => ({ role: "hand", hand: "minute", over: "0.85", bevel: "1" })[k] ?? null), stack = P.read_stack(svg.match(/data-stack="([^"]*)"/)?.[1]);
  check(hour.make === "hand" && hour.section === "domed" && hour.t === P.STACK.hand_t && hour.over === S.sh_hour && cap.make === "cap" && cap.t === P.STACK.cap_t && ring.make === "printed" && ring.ink === 0.21
    && old.make === "hand" && old.section === "ridge" && old.t === P.STACK.hand_t && stack.cap_t === P.STACK.cap_t && /data-parts="1"/.test(svg),
    `"caps for hands, hand thicknesses … decided from dial tool": the hour hand reads back domed, ${hour.t} mm thick at ${hour.over}; the cap ${cap.t} thick; a ring printed ${ring.ink} mm; a file from before the record reads as a ridge hand of the stack's thickness; the dial says the stack (${Object.keys(stack).length} rules)`);
}
// #586, choose your movement (Okay, 11 Nov 2026: "All its defaults", "Yes, remove (R16)", siblings "as their own rows"): a real
// movement writes its defaults and takes off what it can't drive; the Imaginary Movement lifts every limit
{
  const S = G.fresh_settings({}); S.da_on = true; S.da_at = G.DATE_AT.findIndex((d) => d[0] === "4:30"); S.ha_gmt.added = S.ha_gmt.on = true; S.ha_day.added = S.ha_day.on = true;
  const gone = G.apply_movement(S, "nh35"), names = G.MOVEMENT_CHOICES().map((m) => m.id);
  check(S.movement === "nh35" && S.dial_d === 28.5 && S.dial_hole === 2.05 && G.DATE_AT[S.da_at][0] === "3" && S.da_r === 10.55 && S.da_w === 2.9 && S.da_h === 2 && S.sh_hour === 0.6 && S.sh_cap === 1.91 && S.ha_hour.fit_d === 1.5 && S.ha_minute.fit_d === 0.88
    && !S.ha_gmt.added && !S.ha_day.added && gone.join() === "GMT hand,Day hand" && !G.can_hand(S, "gmt") && G.window_places_can(S, 0).join() === "3,6,9" && G.window_kinds_can(S).join() === "0",
    `"All its defaults": the NH35 sets the dial Ø 28.5, its hole 2.05, the date at 3 (moved from 4:30) at r 10.55, 2.9 × 2, the hands at 0.6 … cap 1.91, their holes; "remove (R16)": ${gone.join(" · ")} taken off, the date at 3 · 6 · 9 only`);
  G.apply_movement(S, "nh34"); const gmt = G.can_hand(S, "gmt"), hole = S.dial_hole; G.apply_movement(S, "nh38"); const nodate = !S.da_on && G.window_kinds_can(S).length === 0;
  G.apply_movement(S, "any"); const free = G.can_hand(S, "month") && G.window_places_can(S, 0) === null && S.ha_hour.fit_d === null;
  check(names[0] === "any" && names.includes("nh34") && names.includes("nh36") && names.includes("nh38") && !names.includes("eta-6497-1") && gmt && hole === 2.7 && nodate && free,
    `the list: Imaginary first, the NH35's siblings as rows (${names.join(", ")}); NH34 drives a GMT hand (centre hole ${hole}); NH38 takes the date off; the Imaginary Movement lifts every limit`);
}
// Material and Paint (Okay, 11 Nov 2026: "The dial at the end becomes material, color gets a new line called paint, on off is possible
// through color selector popup adding a no color button"; "Plate left unprinted"): no paint, the preview shows the bare metal, a file leaves the plate out
{
  const O = await import("../src/output.js"), SHOW = await import("../src/show.js"), S = G.fresh_settings({}); S.paint = false; S.material = 2;
  const st = G.build_static(S), seen = G.scene(S, st, 0, true).find((x) => x.role === "plate"), file = O.svg_document(S, st, 0, {}), for3d = O.svg_document(S, st, 0, { facts: SHOW.svg_facts(S) });
  S.paint = true; const painted = O.svg_document(S, G.build_static(S), 0, {});
  check(seen.metal && JSON.stringify(seen.fill) === JSON.stringify(G.PLATE_METAL_COLOURS[2]) && !/id="plate"/.test(file) && /id="plate"/.test(painted) && /id="plate"[^>]*data-role="plate" data-make="plate" data-metal="steel"/.test(for3d),
    `"Plate left unprinted": no paint, the preview's plate is bare ${G.PLATE_METALS[2]}; the file has no plate, a painted one has; a file for a 3D view keeps the metal plate, saying its metal (steel)`);
}
// the case for a 3D view (Okay, 11 Nov 2026: "add bezel and rehaut there"): a saved SVG says the tool's rehaut and bezel; off, nothing
{
  const P = await import("../src/parts.js"), SHOW = await import("../src/show.js"), O = await import("../src/output.js"), S = G.fresh_settings({});
  const none = O.svg_document(S, G.build_static(S), 0, { facts: SHOW.svg_facts(S) });
  S.rh_on = true; S.bz_on = true; S.bz_w = 3.1; const svg = O.svg_document(S, G.build_static(S), 0, { facts: SHOW.svg_facts(S) });
  const c = P.read_case((svg.match(/data-case="([^"]*)"/)?.[1] ?? "").replace(/&quot;/g, '"'));
  check(!/data-case/.test(none) && c && c.bezel.w === 3.1 && c.bezel.kind === "rotating" && c.bezel.teeth.n === S.bz_teeth_n && Math.abs(c.rehaut.w - G.rehaut_w(S)) < 1e-9 && /^#/.test(c.rehaut.c),
    `"add bezel and rehaut there": the file says the case — the bezel ${c?.bezel?.kind} ${c?.bezel?.w} mm with ${c?.bezel?.teeth?.n} scallops, the rehaut ${c?.rehaut?.w?.toFixed(2)} out; none without them`);
}
// markings on the bezel's metal (Okay, 11 Nov 2026: "for bezels, add markings on metal instead of inset ring"): no insert; the rings
// stand inside the chamfer; the file for 3D says so
{
  const SHOW = await import("../src/show.js"), S = G.fresh_settings({}); S.bz_on = true; S.bz_marks = 1;
  const sp = G.case_spans(S), rec = SHOW.case_record(S).bezel;
  check(sp.insert === null && Math.abs(sp.marks[1] - (sp.bezel[1] - S.bz_chamfer)) < 1e-9 && sp.marks[0] === sp.bezel[0] && rec.marks === "metal" && !G.case_grounds(S).some((g) => g[0] === "insert"),
    `"markings on metal instead of inset ring": no insert, the rings between ${sp.marks.map((v) => v.toFixed(2)).join(" and ")} mm (inside the chamfer), the file says ${rec.marks}`);
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
// ENGRAVE (Okay, 11 Nov 2026: "I need the ability to add these engravings instead of paint on metal, needs a switch"): a bare plate's
// rings with Finish Engrave are cut in — the metal's colour in shadow, one layer Engrave in the SVG and the PDF, in no ink film, made
// "engraved" in the parts record; the rehaut's ring and the bezel's markings on its metal the same, an insert's never
{ const O = await import("../src/output.js"), SHOW = await import("../src/show.js"), { OPENER } = await import("../src/opener.js");
  const S = G.fresh_settings(OPENER); S.paint = false; S.engrave = 1; const st = G.build_static(S), items = G.scene(S, st, 0, false, null);
  const cut = items.filter((x) => x.engrave), rings = items.filter((x) => x.role === "ring"), svg = O.svg_document(S, st, 0, { facts: SHOW.svg_facts(S) });
  const pdf = new TextDecoder("latin1").decode(O.pdf_document(S, st, 0)), engraveOCG = (pdf.match(/\/Name <FEFF0045006E00670072006100760065>/g) || []).length;
  S.out_production = true; const film = G.scene(S, st, 0, false, null).filter((x) => x.role === "ring").length; S.out_production = false;
  const painted = G.scene(Object.assign(G.fresh_settings(OPENER), { paint: false }), st, 0, false, null).filter((x) => x.engrave).length;
  const rb = G.fresh_settings({ rh_on: true, rh_engrave: 1, bz_on: true, bz_kind: 0, bz_marks: 0, bz_engrave: 1, rings: [{ ...G.RING_BASE, kind: 1, surface: 1 }, { ...G.RING_BASE, kind: 1, surface: 2 }] });
  const on = (T) => [G.ring_engraved(T, T.rings[0]), G.ring_engraved(T, T.rings[1])].join(); const insert = on(rb); rb.bz_marks = 1; const metal = on(rb);
  check(cut.length === rings.length && cut.length > 0 && cut.every((x) => x.fill[0] < 0.5) && (svg.match(/<g id="engrave">/g) || []).length === 1 && (svg.match(/data-make="engraved"/g) || []).length === cut.length && engraveOCG === 1 && film === 0 && painted === 0 && insert === "true,false" && metal === "true,true",
    `Engrave: a bare plate's ${rings.length} rings cut in (${cut.length}), the metal's colour in shadow; one Engrave group in the SVG, one Engrave layer in the PDF (${engraveOCG}), in no film (${film}); Paint keeps them painted (${painted}); the rehaut's ring and the bezel's on an insert ${insert}, on its metal ${metal} (Okay: "engravings instead of paint on metal, needs a switch")`);
}
// what is engraved, one outline a surface, in the saved SVG (cut_unions): overlapping markings joined, held inside the face's edge
{
  const { svg_document } = await import("../src/output.js"), { svg_facts } = await import("../src/show.js");
  const S = G.fresh_settings({ paint: false, engrave: 1, bz_on: true, bz_kind: 1, bz_engrave: 1, rings: [{ kind: "band", r: 10, width: 2 }, { kind: "ticks", r: 11.5, count: 12, len: 4, w: 0.5 }, { kind: "ticks", surface: 2, r_from: 2, count: 12, w: 0.4 }] });
  const svg = svg_document(S, G.build_static(S), 0, { facts: svg_facts(S) }), plate = /data-cut-plate-v="([^"]+)"/.exec(svg)?.[1] || "", bezel = /data-cut-bezel-v="([^"]+)"/.exec(svg)?.[1] || "";
  const R2 = structuredClone(S); R2.rings[1].cut = 1; const svg2 = svg_document(R2, G.build_static(R2), 0, { facts: svg_facts(R2) }), inset = G.cut_inset(G.circle(10), 1).svg(2);
  const reach = (d) => Math.max(...[...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => Math.hypot(+m[1], +m[2]))), sp = G.case_spans(S);
  const plain = svg_document(G.fresh_settings({}), G.build_static(G.fresh_settings({})), 0, { facts: svg_facts(G.fresh_settings({})) });
  check(plate && bezel && (plate.match(/M/g) || []).length < 13 && reach(bezel) <= sp.bezel[1] - S.bz_chamfer - G.CUT_EDGE + 0.01 && /^<g id="dial" data-dial-d/m.test(svg) && !/data-cut-/.test(plain) && /data-cut-plate-round="/.test(svg2) && /data-cut-plate-v="/.test(svg2) && !/data-cut-plate-round/.test(svg) && Math.abs(reach(inset) - 4) < 0.02,
    `an engraved dial's SVG says each surface's cuts as one outline: the plate's band and the twelve ticks over it joined (${(plate.match(/M/g) || []).length} contours), the bezel's held ${G.CUT_EDGE} mm inside its top's edge (${reach(bezel).toFixed(2)} of ${(sp.bezel[1] - S.bz_chamfer).toFixed(2)}); a ring's Cut set to Round has an outline of its own beside the V's ("Both shapes for every engraving item available, v is default"); an outline moves in by a depth (Ø 10 in by 1 → r ${reach(inset).toFixed(2)}); a painted dial says none (Okay: "cut the shapes out of the bezels top. VisiBLE and engraved at every height")`);
}
process.exit(bad ? 1 : 0);
