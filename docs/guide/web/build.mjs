// build.mjs — the web version's guidebook, pages 00–06 for review (#93).
//   node docs/guide/web/shots.mjs   (pictures from the locked beta 4.36.1)
//   node docs/guide/web/build.mjs   → out/guide-review.pdf and out/page-NN.png
// Words: docs/guide/text-web.md (read here, never copied). Look: docs/design.md, and Okay's notes of 14 Oct 2026:
//   round 2 (15:16) frames and colour; round 3 (16:56): one large picture at the left, smaller and more detailed
//   to the right; screenshots tinted through a gradient map of the part's colour; the part that matters cut out,
//   given a margin of its own background, rounded and lifted by a soft shadow; lines and labels, each a sentence;
//   the part tab above the rule, the guide's name beside it, the address at the far right.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { dial_marks } from "./marks.mjs";
import { fileURLToPath, pathToFileURL } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const OUT = path.join(HERE, "out");
fs.mkdirSync(OUT, { recursive: true });
const IMG = path.join(HERE, "img");
const SHOTS = JSON.parse(fs.readFileSync(path.join(IMG, "rects.json"), "utf8"));
const R = SHOTS.rects, [VW, VH] = SHOTS.viewport;
const SITE = "https://duztman.github.io/dial-tool/";
const problems = [];
const check = (ok, what) => { if (!ok) { problems.push(what); console.log("CHECK  " + what); } };

// ── the grid (design canon §3): A4 landscape, 12 columns × 14 rows, in millimetres ──
const PAGE = [297, 210], SIDE = 12, TOP = 11.5, COL = 19.08, GUT = 4, B = 1.375, ROW = 6 * B, RGAP = 4 * B;
const X = (c) => SIDE + (c - 1) * (COL + GUT);
const Y = (r) => TOP + (r - 1) * (ROW + RGAP);
const W = (n) => n * COL + (n - 1) * GUT;
const H = (n) => n * ROW + (n - 1) * RGAP;
const box = (c, r, cs, rs) => ({ x: X(c), y: Y(r), w: W(cs), h: H(rs) });
const css = (b) => `left:${b.x.toFixed(2)}mm;top:${b.y.toFixed(2)}mm;width:${b.w.toFixed(2)}mm;height:${b.h.toFixed(2)}mm`;
const f2 = (v) => v.toFixed(2);

// ── colour (canon §4): one pale tint per part; the gradient map runs from a darker shade of it to it ──
function oklch(L, C, h) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  return "#" + lin.map((v) => { v = Math.max(0, Math.min(1, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, "0"); }).join("").toUpperCase();
}
const PARTS = ["A", "B", "C", "D", "E"];
const hue = (part) => 95 + PARTS.indexOf(part) * 360 / PARTS.length;
const chroma = (part) => { const i = PARTS.indexOf(part), near = Math.cos(i / PARTS.length * Math.PI); return 0.042 + (0.095 - 0.042) * Math.max(0, near); };
const tint = (part) => oklch(0.90, chroma(part), hue(part));
const tint_dark = (part) => oklch(0.79, chroma(part) * 0.95, hue(part));       // the gradient map's black
const ink_of = (part) => oklch(0.42, 0.09, hue(part));                         // lines and boxes on pictures

// ── the words, from text-web.md ──
const MD = fs.readFileSync(path.join(ROOT, "docs/guide/text-web.md"), "utf8");
function page_text(no) {
  const start = MD.indexOf(`\n## ${no} · `);
  const end = MD.indexOf("\n## ", start + 5);
  const part = MD.slice(start, end < 0 ? undefined : end).replace(/\n# [A-E] · .*\n/g, "\n");
  const title = part.match(/## \d+ · (.*)/)[1].trim();
  const lm = part.match(/\*\*Lead:\*\* ([\s\S]*?)\n\n/);
  const lead = lm ? lm[1].trim() : "";
  const blocks = {};
  for (const m of part.matchAll(/^\*\*([^*]+?)\.?\*\* (.*)$/gm)) if (m[1] !== "Lead:") blocks[m[1].replace(/\.$/, "")] = m[2];
  return { title, lead, blocks };
}
const inline = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*([^*]+)\*/g, "<em>$1</em>")
  .replace(/duztman\.github\.io\/dial-tool(?!\/#)/g, `<a href="${SITE}">duztman.github.io/dial-tool</a>`).replace(/'/g, "’");
const text = (t, label) => {
  const body = t.blocks[label];
  check(body !== undefined, `page "${t.title}": no block "${label}" in text-web.md`);
  const watch = label.startsWith("Watch");
  return { label: watch ? "Watch" : label, body: body || "", watch };
};
const note = (t, key) => { const v = t.blocks["Note: " + key]; check(v !== undefined, `page "${t.title}": no note "${key}"`); return v || key; };

// ── blocks of words ──
const block = (b, t, o = {}) => `<div class="block${t.watch ? " watch" : ""}${o.attach ? " attached" : ""}${o.small ? " small" : ""}${o.bare ? " bare" : ""}"${o.flow ? ` data-flow="${o.flow}" data-bottom="${o.bottom ?? Y(14) + ROW}"` : ""} style="${css(b)}">
  ${t.watch ? `<svg class="tri" viewBox="0 0 24 24"><path d="M12 3 L22 20 L2 20 Z"/><path d="M12 10 V14.5 M12 16.8 V17.6"/></svg>` : ""}
  <p><b>${inline(t.label)}${/[?.!]$/.test(t.label) ? "" : "."}</b> ${inline(t.body)}</p></div>`;

// the head (Okay, 14 Oct): the part's tab above the rule, one grid row; the guide's name beside it, the address at
// the far right. Under the rule the title, and directly under the title the lead, one sentence a line (17:58:
// "title > two lines > image > explainer text").
const lead_lines = (s) => s.split(/\n|(?<=[.!?])\s+(?=[A-Z])/).map((l) => inline(l.trim())).join("<br>");
let CUR = "";
// o.leadRight: the lead set beside the title, in the right half, its last line on the title's baseline (Okay, 20:22:
// the empty top right "could have been filled with the two line entrance sentences" — a rule broken on purpose)
const head = (part, no, t, o = {}) => { CUR = no; return `<div class="tabline" style="left:${X(1)}mm;top:${TOP - ROW}mm;width:${W(12)}mm;height:${ROW}mm">
    <div class="ptab" style="width:${W(1)}mm">${part}<span>${no}</span></div><div class="gname">Dial Tool · Guidebook · beta 4.36</div>
    <div class="gurl">duztman.github.io/dial-tool</div></div>
  <div class="head" style="left:${f2(X(1) + (o.inset ?? 0))}mm;top:${Y(1)}mm;width:${f2(o.inset ? (o.leadW ?? W(8)) : W(12))}mm;height:${H(2)}mm${o.inset ? ";border-top:none" : ""}">
    <h1 style="width:${f2(o.inset ? (o.leadW ?? W(8)) : W(8))}mm">${inline(t.title)}</h1>
    <p class="lead${o.leadRight ? " right" : ""}" style="${o.leadRight ? `left:${f2(X(7) - X(1))}mm;width:${f2(W(6))}mm` : `width:${f2(o.leadW ?? W(8))}mm`}">${lead_lines(t.lead)}</p></div>${o.inset ? `<div style="left:${f2(X(1))}mm;top:${f2(Y(1))}mm;width:${f2(W(12))}mm;border-top:.3mm solid var(--ink)"></div>` : ""}`; };
const ring_of = (part) => oklch(0.64, 0.13, hue(part));                         // outlines round what matters
const page = (part, inner) => `<section class="page" data-no="${CUR}" style="--sig:${tint(part)};--sig-ink:${ink_of(part)};--sig-ring:${ring_of(part)}">${inner}</section>`;

// ── pictures ──
const JOBS = [];
const tinted = (shot, part) => { const out = `t-${shot}-${part}.jpg`; if (!JOBS.some((j) => j.out === out)) JOBS.push({ kind: "tint", shot, out, light: tint(part), dark: tint_dark(part) }); return `../img/made/${out}`; };
function ground(b, shot, part, cx, cy, k) {
  let ox = cx - b.w / 2 / k, oy = cy - b.h / 2 / k;
  ox = Math.max(0, Math.min(VW - b.w / k, ox)); oy = Math.max(0, Math.min(VH - b.h / k, oy));
  return { html: `<div class="ground" style="${css(b)}"><img src="${tinted(shot, part)}" style="width:${f2(VW * k)}mm;left:${f2(-ox * k)}mm;top:${f2(-oy * k)}mm"></div>`,
    at: (r) => [b.x + (r[0] - ox) * k, b.y + (r[1] - oy) * k, r[2] * k, r[3] * k] };
}
let card_n = 0;
function card(shot, rect, x, y, k, o = {}) {
  const pad = o.pad ?? 6, out = `c${++card_n}-${shot}.png`;
  JOBS.push({ kind: "card", shot, rect, pad, out, bg: o.bg, blank: o.blank, keep: o.keep });
  const w = (rect[2] + 2 * pad) * k, h = (rect[3] + 2 * pad) * k;
  if (o.centre) { x -= w / 2; y -= h / 2; }
  const x0 = rect[0] - pad, y0 = rect[1] - pad;
  return { html: `<img class="card${o.cls ? " " + o.cls : ""}" src="../img/made/${out}" style="${o.fade ? `--fade:${o.fade}%;` : ""}left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(w)}mm;height:${f2(h)}mm">`,
    x, y, w, h, at: (r) => [x + (r[0] - x0) * k, y + (r[1] - y0) * k, r[2] * k, r[3] * k] };
}
/** a stage (Okay, 18:04 — "flattening the lower level … space around lets you focus"): a flat ground, the piece(s)
 *  centred on it with room around, and one small caption under them saying where the piece comes from. */
function stage(b, items, cap, o = {}) {
  // items: [{ shot, rect, k, pad }], laid side by side (o.dir "row") or stacked ("col"), gap mm
  const gap = o.gap ?? 5, dir = o.dir ?? "row";
  const dims = items.map((it) => [(it.rect[2] + 2 * (it.pad ?? 4)) * it.k, (it.rect[3] + 2 * (it.pad ?? 4)) * it.k]);
  const tw = dir === "row" ? dims.reduce((a, d) => a + d[0], 0) + gap * (dims.length - 1) : Math.max(...dims.map((d) => d[0]));
  const th = dir === "row" ? Math.max(...dims.map((d) => d[1])) : dims.reduce((a, d) => a + d[1], 0) + gap * (dims.length - 1);
  const capH = cap ? 5 : 0, oy = o.dy ?? 0;
  let x = b.x + (b.w - tw) / 2, y = b.y + (b.h - th - capH) / 2 + oy;
  const cards = items.map((it, i) => {
    const [w, h] = dims[i];
    const c = card(it.shot, it.rect, dir === "row" ? x : b.x + (b.w - w) / 2, dir === "row" ? y + (o.align === "top" ? 0 : (th - h) / 2) : y, it.k, { pad: it.pad ?? 4, cls: it.cls, blank: it.blank, bg: it.bg });
    if (dir === "row") x += w + gap; else y += h + gap;
    return c;
  });
  const top = b.y + (b.h - th - capH) / 2 + oy;
  const capy = top + th + 2.2;
  check(!cap || capy + 3.4 <= b.y + b.h - 1.5, `stage "${cap}": no room for its caption`);
  const html = `<div class="ground flat" style="${css(b)}"></div>` + cards.map((c) => c.html).join("")
    + (cap ? `<div class="cap c" style="left:${f2(b.x)}mm;top:${f2(capy)}mm;width:${f2(b.w)}mm">${inline(cap)}</div>` : "");
  return { html, cards, top, bottom: top + th };
}

// ── leaders (Okay, 17:58): lines move at 90° only, never cross, never pass through content; a line from something
// directly below or above goes straight; a highlight box stands clear of what it boxes; labels are blocks.
// A leader: { from: [x, y] (on the thing or its box), path: [[x, y]…] corners, label: { text, side, x, y, w } }.
// side says where the line meets the label: "R" its right edge (label to the left), "L" its left edge, "B" its
// bottom (label above), "T" its top (label below). (x, y) is that meeting point.
const LEADERS = [];
function leaders(list, o = {}) {
  let svg = "", labels = "";
  for (const it of list) {
    if (it.box) { const [x, y, w, h] = it.box; svg += `<rect class="${it.dark ? "dark" : it.light ? "wash light" : "wash"}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx=".5"/>`; }
    const L = it.label, pts = [it.from, ...(it.path || []), [L.x, L.y]];
    for (let i = 1; i < pts.length; i++) check(Math.abs(pts[i][0] - pts[i - 1][0]) < 0.01 || Math.abs(pts[i][1] - pts[i - 1][1]) < 0.01, `leader "${L.text.slice(0, 30)}": a slanted segment`);
    if (o.halo) svg += `<g clip-path="url(#halo-${CUR})"><polyline class="halo" points="${pts.map((p) => p.map(f2).join(",")).join(" ")}"/><circle class="halo" cx="${f2(it.from[0])}" cy="${f2(it.from[1])}" r=".8"/></g>`;
    svg += `<circle cx="${f2(it.from[0])}" cy="${f2(it.from[1])}" r=".42"/><polyline points="${pts.map((p) => p.map(f2).join(",")).join(" ")}"/>`;
    LEADERS.push({ page: CUR, pts, text: L.text + (L.sub ? L.sub : ""), through: !!it.through, box: it.dark ? it.box : null });
    const w = L.w ?? 36, LH = 1.85, g = 1.0;
    const pos = L.side === "R" ? `left:${f2(L.x - g - w)}mm;top:${f2(L.y - LH)}mm`
      : L.side === "L" ? `left:${f2(L.x + g)}mm;top:${f2(L.y - LH)}mm`
      : L.side === "B" ? `left:${f2(L.align === "r" ? L.x - w + 0.1 : L.align === "c" ? L.x - w / 2 : L.x - 0.1)}mm;bottom:${f2(PAGE[1] - L.y + 0.9)}mm`
      : `left:${f2(L.align === "r" ? L.x - w + 0.1 : L.align === "c" ? L.x - w / 2 : L.x - 0.1)}mm;top:${f2(L.y + 0.9)}mm`;
    const al = L.side === "R" ? "r" : L.side === "L" ? "l" : (L.align ?? "l");
    labels += `<div class="nlabel ${al}${L.sub ? " struct" : ""}" style="${pos};width:${f2(w)}mm">${inline(L.text)}${L.sub ? `<br><span class="sub">${inline(L.sub)}</span>` : ""}</div>`;
  }
  // a halo under the lines where they run over a dark dial, clipped to the dial (o.halo = [cx, cy, r])
  const clip = o.halo ? `<clipPath id="halo-${CUR}"><circle cx="${f2(o.halo[0])}" cy="${f2(o.halo[1])}" r="${f2(o.halo[2])}"/></clipPath>` : "";
  return `<svg class="lines" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${clip}${svg}</svg>${labels}`;
}
// ── pointers (Okay, 19:52 — page 06 first) ──
// A pointer is a dot on the thing (or on the outline round a group of things), a straight line, and a label.
// · Highlight = an outline drawn round the group, in the section's dark ink, clear of what it rings; no washes.
// · Labels over a picture stand on one shared baseline (their last lines) and point down; labels under it hang
//   from one shared cap line and point up. A tier's labels sit with the tallest one's ink centred in the free
//   space between the ground's edge and the picture, so lines are long enough to read as lines.
// · A line meets the text, not its box: it ends just under the last line's baseline (or over the first line's
//   capitals) at a point inside that line's ink, never at a corner — anywhere from a quarter to three quarters
//   along, wherever the tier balances best.
// · Side labels (the dial): the line meets the first line at its x-height middle.
// Positions that depend on how the words break are measured in the browser after the fonts load (layout_pointers).
const TIERS = {};      // page → [{ side, zone, xmin, xmax, gap, forbid, items: [{ id, x, from }] }]
let PID = 0;
/** an outline round a group: a rounded rectangle pad mm clear of r (pads may differ per side: [t, r, b, l]) */
function outline(r, pad = 1, radius) {
  const [pt, pr, pb, pl] = Array.isArray(pad) ? pad : [pad, pad, pad, pad];
  const x = r[0] - pl, y = r[1] - pt, w = r[2] + pl + pr, h = r[3] + pt + pb, rx = radius ?? Math.min(h / 2, w / 2, 2.2);   // one corner for every outline
  return { svg: `<rect class="ring" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(rx)}"/>`, box: [x, y, w, h] };
}
/** tiers: [{ side: "above" | "below", zone: [y0, y1], xmin, xmax, forbid: [x…], items: [{ at: [x, y], text, w, f }] }]
 *  sides: [{ at: [x, y], edge: x where the line ends, side: "L" (label to the right) | "R", text, sub, w }]
 *  rings: outline svg strings drawn under the lines. o.halo: [cx, cy, r] a light casing where lines cross a dark dial */
function pointers({ tiers = [], sides = [], rings = [] }, o = {}) {
  let svg = rings.join(""), labels = "";
  const list = (TIERS[CUR] = TIERS[CUR] || []);
  for (const T of tiers) {
    const tier = { side: T.side, zone: T.zone, xmin: T.xmin, xmax: T.xmax, gap: T.gap ?? 4, forbid: T.forbid || [], items: [] };
    for (const it of T.items) {
      const id = `p${CUR}-${++PID}`;
      svg += `<circle cx="${f2(it.at[0])}" cy="${f2(it.at[1])}" r=".42"/><polyline data-id="${id}" points="${f2(it.at[0])},${f2(it.at[1])} ${f2(it.at[0])},${f2(it.at[1])}"/>`;
      labels += `<div class="nlabel plabel" data-id="${id}" style="left:0;top:0;width:${f2(it.w ?? 30)}mm">${inline(it.text)}</div>`;
      tier.items.push({ id, x: it.at[0], from: it.at[1], f: it.f ?? 0.5 });
      LEADERS.push({ page: CUR, id, pts: [it.at, it.at], text: it.text, through: false, box: null });
    }
    list.push(tier);
  }
  for (const it of sides) {
    const id = `p${CUR}-${++PID}`, right = it.side === "L";
    if (o.halo) svg += `<g clip-path="url(#halo-${CUR})"><polyline class="halo" points="${f2(it.at[0])},${f2(it.at[1])} ${f2(it.edge)},${f2(it.at[1])}"/><circle class="halo" cx="${f2(it.at[0])}" cy="${f2(it.at[1])}" r=".8"/></g>`;
    svg += `<circle cx="${f2(it.at[0])}" cy="${f2(it.at[1])}" r=".42"/><polyline data-id="${id}" points="${f2(it.at[0])},${f2(it.at[1])} ${f2(it.edge)},${f2(it.at[1])}"/>`;
    const w = it.w ?? 30, gap = 1.2;
    labels += `<div class="nlabel plabel side ${right ? "l" : "r"}${it.sub ? " struct" : ""}" data-id="${id}" data-y="${f2(it.at[1])}" style="left:${f2(right ? it.edge + gap : it.edge - gap - w)}mm;top:0;width:${f2(w)}mm">${inline(it.text)}${it.sub ? `<br><span class="sub">${inline(it.sub)}</span>` : ""}</div>`;
    LEADERS.push({ page: CUR, id, pts: [it.at, [it.edge, it.at[1]]], text: it.text + (it.sub || ""), through: true, box: null });
  }
  const clip = o.halo ? `<clipPath id="halo-${CUR}"><circle cx="${f2(o.halo[0])}" cy="${f2(o.halo[1])}" r="${f2(o.halo[2])}"/></clipPath>` : "";
  return `<svg class="lines" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${clip}${svg}</svg>${labels}`;
}
const padbox = (r, p = 1) => [r[0] - p, r[1] - p, r[2] + 2 * p, r[3] + 2 * p];
const mid = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];
const dial = (b, file, o = {}) => `<div class="pic" style="${css(b)}"><img src="../img/${file}.svg" style="height:${o.fill ?? 92}%"></div>`;
const caption = (x, y, w, s, al = "l") => `<div class="cap ${al}" style="left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(w)}mm">${inline(s)}</div>`;
const union = (...rs) => { rs = rs.filter(Boolean); const x = Math.min(...rs.map((r) => r[0])), y = Math.min(...rs.map((r) => r[1])); return [x, y, Math.max(...rs.map((r) => r[0] + r[2])) - x, Math.max(...rs.map((r) => r[1] + r[3])) - y]; };

// ── measuring words before the page is set: how many lines a label takes at a width (Okay, 19:52: the space
// round a picture is shared out evenly, so the labels' heights must be known when the picture is placed) ──
const MB = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const MP = await MB.newPage();
fs.writeFileSync(path.join(OUT, "measure.html"), `<!doctype html><html><head><style>@font-face{font-family:"Inter";src:url("${pathToFileURL(path.join(HERE, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")).href}") format("woff2");font-weight:100 900;}</style>
  <link rel="stylesheet" href="../style.css"></head><body><section class="page"><div id="m" class="nlabel plabel" style="left:0;top:0"></div></section></body></html>`);
await MP.goto(pathToFileURL(path.join(OUT, "measure.html")).href);
check(await MP.evaluate(() => getComputedStyle(document.getElementById("m")).fontFamily.includes("Inter")), "measuring page: the stylesheet did not load");
await MP.evaluate(() => document.fonts.ready);
const LH = 2.7 * B, FS = 8 * 25.4 / 72, CAP = 0.727 * FS;
/** lines a label takes at w mm, and its ink height (cap top of the first line to the baseline of the last) */
async function measure(textHtml, w) {
  const n = await MP.evaluate(([h, w]) => { const el = document.getElementById("m"); el.style.width = w + "mm"; el.innerHTML = h;
    const tops = new Set(); const wk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t; (t = wk.nextNode());) for (const m of t.textContent.matchAll(/\S+/g)) { const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length); const q = r.getClientRects()[0]; if (q) tops.add(Math.round(q.top / 3)); }
    const rr = [...el.getClientRects()]; let wmax = 0; const wk2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rows = new Map();
    for (let t; (t = wk2.nextNode());) for (const m of t.textContent.matchAll(/\S+/g)) { const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length); const q = r.getClientRects()[0]; if (!q) continue; const k = Math.round(q.top / 3), l = rows.get(k) || [1e9, -1e9]; l[0] = Math.min(l[0], q.left); l[1] = Math.max(l[1], q.right); rows.set(k, l); }
    for (const l of rows.values()) wmax = Math.max(wmax, (l[1] - l[0]) / (96 / 25.4));
    return [tops.size, wmax]; }, [textHtml, w]);
  return { n: n[0], H: (n[0] - 1) * LH + CAP, W: n[1] };
}
const inkH = async (t, w) => (await measure(inline(t), w)).H;

const pages = [];


// 00 · cover (canon §5: one dial, 198 mm, 6 mm from three edges; left the construction, right the dial).
// Left: the dial as it is built — each ring's edges in its own guide colour, as the tool's Guides view draws them
// (Okay, 14 Oct: "the development of rings and help designing the dials is the main focus"). Right: the dial.
// The dial is Okay's bezel diver for now; Okay will pick or guide a richer one ("I can guide you").
{
  const S = JSON.parse(fs.readFileSync(path.join(IMG, "dial-diver.json"), "utf8"));
  const D = 198, cx = PAGE[0] - 6 - D / 2, cy = PAGE[1] / 2, k = D / S.dial_d, pg = S.dial_d + 2 * S.margin, svg = pg * k;
  const GC = ["#FF2D95", "#00E5FF", "#39FF14", "#FFE600", "#FF6A00", "#7A5CFF", "#111111", "#FFFFFF"], ORDER = [4, 0, 2, 5, 3, 1];
  let lines = `<circle r="${S.dial_d / 2}" stroke="${GC[1]}"/><line x1="${-S.dial_d / 2 - 2}" x2="${S.dial_d / 2 + 2}" stroke="${GC[1]}"/><line y1="${-S.dial_d / 2 - 2}" y2="${S.dial_d / 2 + 2}" stroke="${GC[1]}"/>`;
  S.rings.forEach((r, i) => {
    if (r.on === false) return;
    const c = GC[r.guide >= 0 ? r.guide : ORDER[i % ORDER.length]];
    const inner = r.kind === 3 ? r.r - r.width : r.kind === 2 ? null : r.shape === 2 ? r.r - r.w : r.r - r.len;
    const rs = r.kind === 2 ? [r.r - r.size / 2, r.r + r.size / 2] : [r.r, inner];
    for (const v of rs) if (v > 0) lines += `<circle r="${v}" stroke="${c}"/>`;
  });
  const contents = [["A", "Start", [["01", "Start"], ["02", "A first dial"], ["03", "The window"], ["04", "The whole window"]]],
    ["B", "Build", [["05", "Dial and page"], ["06", "Rings"], ["07", "Positions"], ["08", "Marks"], ["09", "Give way"], ["10", "Bands and sectors"], ["11", "Numerals"], ["12", "Type"], ["14", "Hands"], ["15", "Windows"], ["16", "Guides"]]],
    ["C", "Out", [["17", "Export"], ["18", "Making it real"], ["20", "Links, files, Gallery"]]],
    ["D", "Classics", [["21", "Nine classics"]]], ["E", "Reference", [["31", "Every setting"], ["32", "Find it"]]]];
  const desc = MD.slice(MD.indexOf("## 00 · Cover")).split("\n").find((l) => l.startsWith("A tool for drawing"));
  check(desc, "cover: no description line");
  pages.push(`<section class="page cover">
    <div class="field dark" style="width:${cx}mm"></div><div class="field" style="left:${cx}mm;width:${PAGE[0] - cx}mm;background:${tint("A")}"></div>
    <div class="half" style="left:0;width:${cx}mm"><img class="ghost" src="../img/dial-diver.svg" style="width:${svg}mm;left:${cx - svg / 2}mm;top:${cy - svg / 2}mm">
      <svg class="guides" viewBox="0 0 ${cx} ${PAGE[1]}" style="width:${cx}mm;height:${PAGE[1]}mm"><g transform="translate(${cx} ${cy}) scale(${k})" stroke-width="${0.3 / k}" fill="none">${lines}</g></svg></div>
    <div class="half" style="left:${cx}mm;width:${PAGE[0] - cx}mm"><img src="../img/dial-diver.svg" style="width:${svg}mm;left:${-svg / 2}mm;top:${cy - svg / 2}mm"></div>
    <div class="ctitle" style="left:${X(1)}mm;top:${Y(1)}mm">Dial Tool</div>
    <div class="csub" style="left:${X(1)}mm;top:${Y(4)}mm;width:${W(3)}mm"><b>Guidebook</b><br>beta 4.36 · October 2026</div>
    <p class="cdesc" style="left:${X(1)}mm;top:${Y(6)}mm;width:${W(3)}mm">${inline(desc)}</p>
    <div class="ccontents" style="left:${X(1)}mm;top:${Y(9)}mm;width:${W(3) + 8}mm">${contents.map(([p, name, list]) =>
      `<div class="cpart"><span>${p} · ${name}</span>${list.map(([n, s]) => `<i>${n}</i> ${s}`).join("<br>")}</div>`).join("")}</div>
    <div class="cnote" style="left:${X(1)}mm;top:${Y(14) + 2}mm;width:${W(4)}mm">Left, the dial as you build it: every ring’s edges in its own guide colour, as the Guides view shows them. Right, the dial they make.</div>
  </section>`);
}


// ════════════════════════ 01 · Start ════════════════════════
// Three columns, each picture over its words, rows shared across the page (Okay, 19:18: "homogeneous page is
// better"; a Watch note hangs under the block it warns about, smaller, and the pair fills grid boxes as one).
// Left: the tool in a browser, its address cut off by the bar; where it runs; opening a dial.
// Middle: the unit box closed and open; sizes and units; the same diameter in mm and in lignes.
// Right: the same dial's link pane; saving and sharing; undo and redo.
{
  const t = page_text("01"), P = "A";
  let h = head(P, "01", t);
  const big = box(1, 3, 6, 8);
  h += `<div class="ground flat" style="${css(big)}"></div>`;
  const barH = 7, lab = 8.5, ih0 = big.h - 9 - barH - 3.5 - lab, iw = Math.min(big.w - 12, ih0 * VW / VH), ih = iw * VH / VW, ix = big.x + (big.w - iw) / 2;
  const iy = big.y + (big.h - ih - barH - 3.5 - lab) / 2 + lab + barH + 3.5;
  const hash = SHOTS.links.buhr_live;
  h += `<div class="bar" style="left:${f2(ix)}mm;top:${f2(iy - barH - 3.5)}mm;width:${f2(iw)}mm"><div class="url"><span class="pre">https://duztman.github.io/dial-tool/</span><span class="hash"><i class="hl">${inline(note(t, "hash"))}</i>${hash}</span></div></div>`;
  h += `<div class="shot framed" style="left:${f2(ix)}mm;top:${f2(iy)}mm;width:${f2(iw)}mm;height:${f2(ih)}mm"><img src="../img/buhr.png"></div>`;
  h += block(box(1, 11, 3, 4), text(t, "Where it runs"), { flow: "a" }) + block(box(4, 11, 3, 4), text(t, "Opening a dial"), { flow: "b" });

  // middle — the unit box, closed and open, at one scale, tops aligned; then the same diameter in two units
  const k = 0.19, closed = [309, 8, 132, 46], open = [309, 8, 132, 187];
  h += stage(box(7, 3, 3, 4), [{ shot: "dial", rect: closed, k, bg: "#FFFFFF" }, { shot: "unit", rect: open, k, bg: "#FFFFFF" }], "Top right of the panel: closed, then open", { gap: 5, align: "top" }).html;
  h += block(box(7, 7, 3, 4), text(t, "Sizes and units"), { flow: "c" }) + block(box(7, 7, 3, 4), text(t, "Watch: units"), { flow: "c", attach: true });
  const dr = [44, 192, 396, 34];
  h += stage(box(7, 11, 3, 2), [{ shot: "buhr-mm", rect: dr, k: 0.13, pad: 3 }, { shot: "buhr-lig", rect: dr, k: 0.13, pad: 3 }], "The B-Uhr’s diameter in millimetres, then in lignes", { dir: "col", gap: 1.6 }).html;
  h += block(box(7, 13, 3, 2), text(t, "Lignes"), { flow: "c2" });

  // right — the same dial's link pane and how a dial is kept; undo and redo, each named with its key
  const PL = SHOTS.rects["buhr-export"].pane_link;
  h += stage(box(10, 3, 3, 4), [{ shot: "buhr-export", rect: [PL[0], PL[1] + 6, PL[2], PL[3] - 12], k: 0.14, pad: 3 }], "The same dial’s link, in the Export tab").html;
  h += block(box(10, 7, 3, 4), text(t, "Saving and sharing"), { flow: "d" }) + block(box(10, 7, 3, 4), text(t, "Watch"), { flow: "d", attach: true });
  const su = stage(box(10, 11, 3, 2), [{ shot: "dial", rect: [470, 13, 70, 38], k: 0.22, pad: 4 }], "", { dy: -3.4 });
  h += su.html;
  const c = su.cards[0], ub = c.at([473, 16, 32, 32]), rb = c.at([505, 16, 32, 32]), ly = c.y + c.h + 3.2;
  h += leaders([
    { from: [mid(ub)[0], ub[1] + ub[3]], label: { text: note(t, "undo"), side: "T", x: mid(ub)[0], y: ly, w: 22, align: "r" } },
    { from: [mid(rb)[0], rb[1] + rb[3]], label: { text: note(t, "redo"), side: "T", x: mid(rb)[0], y: ly, w: 24, align: "l" } },
  ]);
  h += block(box(10, 13, 3, 2), text(t, "Undo and redo"), { flow: "e" });
  pages.push(page(P, h));
}

// ════════════════════════ 03 · The whole window ════════════════════════
// One picture, every part named. Lines run at right angles, never cross, never cross the interface: every line
// leaves its part straight, sideways or up or down (Okay, r4: no staircases); a wash stands clear of what it marks.
// The labels are the text of this page; the three blocks under it are smaller (7 pt).
{
  const t = page_text("03"), P = "A";
  const iw = 176, s = iw / VW;
  const img = { x: X(3) + (W(8) - iw) / 2, y: Y(4) + 4.5, w: iw, h: VH * s };
  const at = (r) => [img.x + r[0] * s, img.y + r[1] * s, r[2] * s, r[3] * s];
  const bx = (r, p = 5) => at([r[0] - p, r[1] - p, r[2] + 2 * p, r[3] + 2 * p]);
  const D = R.dial;
  let h = head(P, "03", t);
  h += `<div class="shot framed" style="${css(img)}"><img src="../img/dial.png"></div>`;
  const L = [];
  // left: five parts, each line straight across to its label (y in the window's points)
  const lx = img.x - 9;
  const left = (r, key, yp, p = 5) => { const b = bx(r, p), y = img.y + yp * s; L.push({ box: b, from: [b[0], y], label: { text: note(t, key), side: "R", x: lx, y, w: lx - 1 - X(1) } }); };
  left([D.tabs[0], D.tabs[1] + 3, D.tabs[2], D.tabs[3] + 1], "tabs", 100);
  left([38, 198, 404, 24], "number", 210, 3);
  left([26, 364, 16, 16], "eye", 372, 4);
  left([38, 525, 398, 20], "colour", 535, 3);
  // above: units (higher) and undo, straight up; they stand on two heights so they do not read as one line
  const ty1 = img.y - 4, ty2 = ty1 - 9.8;
  const up = (r, key, align, w, ty, p = 5) => { const b = bx(r, p), x = b[0] + b[2] / 2; L.push({ box: b, from: [x, b[1]], label: { text: note(t, key), side: "B", x, y: ty, w, align } }); };
  up(D.unit, "units", "r", 46, ty1); up(D.undo, "undo", "l", 46, ty1);

  // right: guides and the backdrop, straight out to the right
  const rx = img.x + img.w + 5, rw = PAGE[0] - SIDE - rx - 1;
  { const b = bx(union(D.guides)), y = b[1] + b[3] / 2; L.push({ box: b, from: [b[0] + b[2], y], label: { text: note(t, "guides"), side: "L", x: rx, y, w: rw } }); }
  { const b = bx(D.backdrop), y = img.y + 810 * s; L.push({ box: b, from: [b[0] + b[2], y], label: { text: note(t, "backdrop"), side: "L", x: rx, y, w: rw } }); }
  // below: four, straight down from light washes on the dark bar (the day's wash takes in its 10:10 tag)
  const dy = img.y + img.h + 4.5;
  const down = (r, key, align, w, p = 4) => { const b = bx(r, p), x = b[0] + b[2] / 2; L.push({ box: b, light: true, from: [x, b[1] + b[3]], label: { text: note(t, key), side: "T", x, y: dy, w, align } }); };
  down(union(D.play), "play", "r", 44); down(union(D.time), "time", "l", 44); down([483, 852, 778, 44], "day", "l", 44, 0); down(union(D.zoom), "zoom", "l", 44);
  h += leaders(L);
  h += block(box(1, 14, 4, 1), text(t, "Typing numbers"), { small: true }) + block(box(5, 14, 4, 1), text(t, "On an iPad"), { small: true }) + block(box(9, 14, 4, 1), text(t, "Watch"), { small: true });
  pages.push(page(P, h));
}

// ════════════════════════ 06 · Rings ════════════════════════
// The concept of a ring, and what you need to work with one (Okay, 21:47: white, fewer rings, the stack at the
// right, an assembled dial elsewhere, usable information). Five of the diver's rings — one of each kind, two that
// give way. Left: the five together, as the tool draws them, and four short blocks to work by. Right: the list
// taken apart, each row joined to its ring lifted off the dial as a layer; the plate at the bottom.
{
  const t = page_text("06"), P = "B";
  let h = head(P, "06", t, { leadW: W(6) });
  const S = JSON.parse(fs.readFileSync(path.join(IMG, "dial-five.json"), "utf8"));
  const SVG = fs.readFileSync(path.join(IMG, "dial-five.svg"), "utf8");
  const pathOf = (id) => (SVG.match(new RegExp(`<path id="${id}"[^>]*/>`)) || [""])[0].replace(/ id="[^"]*"/, "");
  const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ids = (r) => r.name === "Bezel" ? ["bezel-colour-1", "bezel-colour-2"] : [slug(r.name)];
  const FOOT = Y(14) + ROW, n = S.rings.length;

  // the four kinds, top right
  { const KN = ["Ticks", "Markers", "Numerals", "Band"], cw = (W(6) - 3 * GUT) / 4, k = 0.22;
    const MN = SHOTS.rects["diver-add"].menu;
    KN.forEach((name, i) => {
      const x = X(7) + i * (cw + GUT), y = Y(1) + 1.2;
      const ic = card("diver-add", [MN[0] + 13, MN[1] + 1.5 + i * 34.5, 34, 31.5], x, y, k, { pad: 2, bg: "#FFFFFF", cls: "icon" });
      h += ic.html + `<div class="kcell" style="left:${f2(x)}mm;top:${f2(y + ic.h + 1.6)}mm;width:${f2(cw)}mm"><b>${name}.</b> ${inline(note(t, "kind " + name))}</div>`;
    });
  }

  // ── left: the five rings together, then four blocks to work by ──
  { const dd = 64, pg = dd * (S.dial_d + 2 * S.margin) / S.dial_d, top = Y(3), cxL = X(1) + W(6) / 2;
    h += `<img class="svgdial" src="../img/dial-five.svg" style="left:${f2(cxL - pg / 2)}mm;top:${f2(top + (H(6) - pg) / 2)}mm;width:${f2(pg)}mm">`;
    h += `<div class="cap c" style="left:${f2(X(1))}mm;top:${f2(top + (H(6) + pg) / 2 - 1)}mm;width:${f2(W(6))}mm">${inline(note(t, "together"))}</div>`; }
  h += block(box(1, 9, 3, 6), text(t, "What makes a ring"), { flow: "a" }) + block(box(1, 9, 3, 6), text(t, "Giving way"), { flow: "a" });
  h += block(box(4, 9, 3, 6), text(t, "Reading a row"), { flow: "b" }) + block(box(4, 9, 3, 6), text(t, "Drawing order"), { flow: "b" });

  // ── right: the list and the dial taken apart together, on the page itself ──
  const R0 = { x: X(7), y: Y(3), w: W(6), h: FOOT - Y(3) };
  const D = 62, sc = D / S.dial_d, TILT = 0.4, he = D * TILT;
  const pitch = he * 0.88, groupH = n * pitch + he;          // the sheets overlap a little: a stack, not a list of discs
  const dialTop = Y(3) + (H(6) - 64 * (S.dial_d + 2 * S.margin) / S.dial_d) / 2 + 1.8;   // the stack's top level with the dial's
  const cx = R0.x + R0.w - D / 2, y0 = dialTop + he / 2;
  const kR = 0.16, RP = 3, rowsW = (384 + 2 * RP) * kR;
  let layers = "", rows = "", lines = "";
  const at = (i) => `translate(${f2(cx)} ${f2(y0 + i * pitch)}) scale(${sc} ${f2(sc * TILT)})`;
  layers += `<g transform="${at(n)}"><circle r="20" class="plate"/></g>`;
  for (let i = n - 1; i >= 0; i--) layers += `<g transform="${at(i)}"><circle r="20" class="sheet"/>${ids(S.rings[i]).map(pathOf).join("")}</g>`;
  S.rings.forEach((r, i) => {
    const rr = SHOTS.rects["five-rows"][i], y = y0 + i * pitch, rh = (rr[3] + 2 * RP) * kR;
    const c = card(`five-row-${i}`, rr, R0.x, y - rh / 2, kR, { pad: RP, bg: "#FFFFFF", cls: "row" });
    rows += c.html;
    lines += `<line x1="${f2(c.x + c.w + 1.5)}" y1="${f2(y)}" x2="${f2(cx - D / 2 - 1.2)}" y2="${f2(y)}"/><circle cx="${f2(cx - D / 2 - 1.2)}" cy="${f2(y)}" r=".42"/>`;
    rows += `<div class="layernote" style="left:${f2(R0.x)}mm;top:${f2(y + rh / 2 + 1.2)}mm;width:${f2(rowsW)}mm">${inline(note(t, "layer " + r.name))}</div>`;
  });
  const yp = y0 + n * pitch;
  lines += `<line x1="${f2(R0.x + 30)}" y1="${f2(yp)}" x2="${f2(cx - D / 2 - 1.2)}" y2="${f2(yp)}"/><circle cx="${f2(cx - D / 2 - 1.2)}" cy="${f2(yp)}" r=".42"/>`;
  h += `<svg class="stack" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${layers}</svg>` + rows
    + `<svg class="lines" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${lines}</svg>`
    + `<div class="layernote plate" style="left:${f2(R0.x)}mm;top:${f2(yp - 2.2)}mm;width:28mm">${inline(note(t, "plate"))}</div>`;
  pages.push(page(P, h));
}

// ════════════════════════ out ════════════════════════
fs.writeFileSync(path.join(OUT, "jobs.json"), JSON.stringify(JOBS));
execFileSync("python3", [path.join(HERE, "cards.py"), path.join(OUT, "jobs.json")], { stdio: "inherit" });
const inter = pathToFileURL(path.join(HERE, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")).href;
const ONLY = (process.env.ONLY || "01,03,06").split(",");
const built = pages.filter((p) => ONLY.includes(p.match(/data-no="(\d+)"/)?.[1]));
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dial Tool guidebook — review</title>
<style>@font-face{font-family:"Inter";src:url("${inter}") format("woff2");font-weight:100 900;}</style>
<link rel="stylesheet" href="../style.css"></head><body>${built.join("\n")}</body></html>`;
fs.writeFileSync(path.join(OUT, "guide-review.html"), html);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const pg = await browser.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
await pg.goto(pathToFileURL(path.join(OUT, "guide-review.html")).href);
await pg.evaluate(() => document.fonts.ready);
// text in a column flows: each block as tall as its words, snapped to whole grid rows, the next one a row gap under it
const flowed = await pg.evaluate(([ROW, RGAP]) => {
  const MM = 96 / 25.4, out = [];
  for (const pg of document.querySelectorAll("section.page")) {
    const groups = {};
    for (const b of pg.querySelectorAll("[data-flow]")) (groups[b.dataset.flow] = groups[b.dataset.flow] || []).push(b);
    for (const list of Object.values(groups)) {
      // a block and the Watch notes hung under it (Okay, 19:18) fill grid boxes as one: the pair may run into the
      // next box, which then counts as full; the next block starts in the box after it
      let y = parseFloat(list[0].style.top);
      for (let i = 0; i < list.length;) {
        const g = [list[i]];
        while (list[i + g.length] && list[i + g.length].classList.contains("attached")) g.push(list[i + g.length]);
        let yy = y;
        g.forEach((b, k) => {
          b.style.top = yy + "mm"; b.style.height = "auto";
          const hmm = b.getBoundingClientRect().height / MM;
          if (k < g.length - 1) { b.style.height = hmm + "mm"; yy += hmm + 1.4; return; }
          const n = Math.max(1, Math.ceil((yy + hmm - y + RGAP - 0.8) / (ROW + RGAP)));
          if (g.length === 1) b.style.height = (n * ROW + (n - 1) * RGAP) + "mm";
          if (y + n * ROW + (n - 1) * RGAP > parseFloat(b.dataset.bottom) + 0.5) out.push(b.textContent.trim().slice(0, 40));
          y += n * (ROW + RGAP);
        });
        i += g.length;
      }
    }
  }
  return out;
}, [ROW, RGAP]);
for (const o of flowed) check(false, `a column of words runs past its end: "${o}…"`);
// pointers: measure every label's lines, stand each tier on its baseline, slide labels sideways till they balance
const pointed = await pg.evaluate((TIERS) => {
  const MM = 96 / 25.4, out = { pts: {}, notes: [] };
  for (const sec of document.querySelectorAll("section.page")) {
    const P = sec.getBoundingClientRect(), tiers = TIERS[sec.dataset.no] || [];
    const lines = (el) => {                       // the label's lines: ink left, right, baseline (mm, page)
      const fs = parseFloat(getComputedStyle(el).fontSize) / MM, rows = new Map();
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) for (const m of n.textContent.matchAll(/\S+/g)) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const q = r.getClientRects()[0]; if (!q) continue;
        const k = Math.round(q.top / 3), l = rows.get(k) || { l: 1e9, r: -1e9, b: -1e9 };
        l.l = Math.min(l.l, (q.left - P.left) / MM); l.r = Math.max(l.r, (q.right - P.left) / MM); l.b = Math.max(l.b, (q.bottom - P.top) / MM);
        rows.set(k, l);
      }
      const ls = [...rows.values()].sort((a, b) => a.b - b.b);
      for (const l of ls) l.base = l.b - 0.2421875 * fs;          // Inter: descender 0.242 em under the baseline
      return { ls, fs };
    };
    const set = (el, left, top) => { el.style.left = left + "mm"; el.style.top = top + "mm"; };
    for (const T of tiers) {
      const els = T.items.map((it) => sec.querySelector(`.plabel[data-id="${it.id}"]`));
      const m = els.map((el) => { set(el, 0, 0); const { ls, fs } = lines(el), c = T.side === "above" ? ls[ls.length - 1] : ls[0];
        return { ls, fs, a: c.l, b: c.r, inkL: Math.min(...ls.map((l) => l.l)), inkR: Math.max(...ls.map((l) => l.r)),
          top: ls[0].base - 0.727 * fs, base: ls[ls.length - 1].base, cap0: ls[0].base - 0.727 * fs }; });
      // vertical: the tallest label's ink centred in the zone; every label on its baseline (above) or cap line (below)
      const H = Math.max(...m.map((q) => q.base - q.top)), [z0, z1] = T.zone, inkTop = z0 + (z1 - z0 - H) / 2;
      const B = inkTop + H, C = inkTop;
      // horizontal: the line meets the contact line between a quarter and three quarters along it
      const S = T.items.map((it, i) => {
        const q = m[i], c = q.b - q.a; let lo = it.x - q.a - 0.75 * c, hi = it.x - q.a - 0.25 * c;
        lo = Math.max(lo, T.xmin - q.inkL); hi = Math.min(hi, T.xmax - q.inkR);
        for (const f of T.forbid) { if (f < it.x) lo = Math.max(lo, f + 2.6 - q.inkL); else hi = Math.min(hi, f - 2.6 - q.inkR); }
        return { i, x: it.x, lo, hi, L: Math.min(hi, Math.max(lo, it.x - q.a - it.f * c)) };
      }).sort((p, q) => p.x - q.x);
      for (let pass = 0; pass < 6; pass++) {
        for (let j = 1; j < S.length; j++) { const p = S[j - 1], q = S[j]; const need = p.L + m[p.i].inkR + T.gap - m[q.i].inkL; if (q.L < need) q.L = Math.min(q.hi, need); }
        for (let j = S.length - 2; j >= 0; j--) { const p = S[j], q = S[j + 1]; const need = q.L + m[q.i].inkL - T.gap - m[p.i].inkR; if (p.L > need) p.L = Math.max(p.lo, need); }
      }
      for (let j = 1; j < S.length; j++) { const p = S[j - 1], q = S[j]; if (p.L + m[p.i].inkR + T.gap - 0.05 > q.L + m[q.i].inkL) out.notes.push(`p${sec.dataset.no} labels crowd: "${els[p.i].textContent.slice(0, 20)}" · "${els[q.i].textContent.slice(0, 20)}"`); }
      for (const s of S) {
        if (s.lo > s.hi + 0.01) out.notes.push(`p${sec.dataset.no} label "${els[s.i].textContent.slice(0, 24)}" has no room`);
        const q = m[s.i], el = els[s.i], it = T.items[s.i];
        const dy = T.side === "above" ? B - q.base : C - q.cap0;
        set(el, s.L, dy); el.style.width = (q.inkR + 0.4) + "mm";          // the label's box is its ink, so checks see what the eye sees
        const yEnd = T.side === "above" ? B + 0.32 * q.fs + 0.7 : C - 0.9;   // under the descenders · over the capitals
        const pl = sec.querySelector(`polyline[data-id="${it.id}"]`);
        pl.setAttribute("points", `${it.x.toFixed(2)},${it.from.toFixed(2)} ${it.x.toFixed(2)},${yEnd.toFixed(2)}`);
        out.pts[it.id] = [[it.x, it.from], [it.x, yEnd]];
      }
    }
    // side labels: the first line's x-height middle on the line
    for (const el of sec.querySelectorAll(".plabel.side")) {
      el.style.top = "0mm"; const { ls, fs } = lines(el);
      el.style.top = (parseFloat(el.dataset.y) - (ls[0].base - 0.2725 * fs)) + "mm";
    }
  }
  return out;
}, TIERS);
for (const L of LEADERS) if (L.id && pointed.pts[L.id]) L.pts = pointed.pts[L.id];
for (const n of pointed.notes) check(false, n);
await pg.waitForTimeout(600);
// measure: words that overflow their block
const over = await pg.evaluate(() => [...document.querySelectorAll(".block")].filter((b) => b.scrollHeight > b.clientHeight + 1).map((b) => b.textContent.trim().slice(0, 40)));
for (const o of over) check(false, `words overflow their block: "${o}…"`);
// blocks, not ragged ends (Okay, 17:58: "every paragraph wants to be a block … two words on a line is just as bad
// as an orphan"): the last line at least 40 % of the widest, and no line of one or two short words.
const ragged = await pg.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll(".block p, .lead, .nlabel:not(.struct), .cap, .hl")) {
    const lines = new Map();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) for (const m of n.textContent.matchAll(/\S+/g)) {
      const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const q = r.getClientRects()[0]; if (!q) continue;
      const k = Math.round(q.top / 4); const l = lines.get(k) || { words: [], l: 1e9, r: -1e9 };
      l.words.push(m[0]); l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); lines.set(k, l);
    }
    const ls = [...lines.values()]; if (ls.length < 2) continue;
    const wmax = Math.max(...ls.map((l) => l.r - l.l)), last = ls[ls.length - 1];
    const what = el.textContent.trim().slice(0, 34);
    if ((last.r - last.l) < 0.4 * wmax) out.push(`short last line "${last.words.join(" ")}" in "${what}…"`);
    if (el.getBoundingClientRect().width > 20 * 96 / 25.4) ls.forEach((l, i) => { if (l.words.length <= 2 && l.words.join(" ").length < 14) out.push(`line ${i + 1} only "${l.words.join(" ")}" in "${what}…"`); });
  }
  return out;
});
for (const o of ragged) check(false, o);
// nothing overlaps: labels, blocks, captions, pictures; labels keep 2 mm from each other
const clash = await pg.evaluate(() => {
  const MM = 96 / 25.4, out = [];
  for (const sec of document.querySelectorAll("section.page")) {
    const P = sec.getBoundingClientRect();
    const box = (e) => { const r = e.getBoundingClientRect(); return [(r.left - P.left) / MM, (r.top - P.top) / MM, (r.right - P.left) / MM, (r.bottom - P.top) / MM]; };
    const labels = [...sec.querySelectorAll(".nlabel")].map((e) => ({ e, b: box(e), t: e.textContent.slice(0, 26) }));
    const words = [...sec.querySelectorAll(".block p, .cap, .lead, h1")].map((e) => ({ b: box(e), t: e.textContent.slice(0, 26) }));
    const pics = [...sec.querySelectorAll(".card, .shot, .bar")].map((e) => ({ b: box(e), t: e.className }));
    const ov = (a, b, g = 0) => a[0] < b[2] + g && b[0] < a[2] + g && a[1] < b[3] + g && b[1] < a[3] + g;
    labels.forEach((a, i) => {
      labels.slice(i + 1).forEach((b) => { if (ov(a.b, b.b, 2)) out.push(`p${sec.dataset.no} labels too close: "${a.t}" · "${b.t}"`); });
      words.forEach((b) => { if (ov(a.b, b.b, 1.5)) out.push(`p${sec.dataset.no} label "${a.t}" on words "${b.t}"`); });
      pics.forEach((b) => { if (ov(a.b, b.b, 0.8)) out.push(`p${sec.dataset.no} label "${a.t}" on a picture (${b.t})`); });
    });
  }
  return out;
});
for (const o of clash) check(false, o);
// lines: no two cross, none runs through a label (other than its own)
{
  const segs = LEADERS.flatMap((L, li) => L.pts.slice(1).map((p, i) => ({ li, page: L.page, a: L.pts[i], b: p })));
  const cross = (s, t) => {
    const h1 = Math.abs(s.a[1] - s.b[1]) < 0.01, h2 = Math.abs(t.a[1] - t.b[1]) < 0.01;
    if (h1 === h2) return h1 ? Math.abs(s.a[1] - t.a[1]) < 0.6 && Math.min(Math.max(s.a[0], s.b[0]), Math.max(t.a[0], t.b[0])) > Math.max(Math.min(s.a[0], s.b[0]), Math.min(t.a[0], t.b[0]))
      : Math.abs(s.a[0] - t.a[0]) < 0.6 && Math.min(Math.max(s.a[1], s.b[1]), Math.max(t.a[1], t.b[1])) > Math.max(Math.min(s.a[1], s.b[1]), Math.min(t.a[1], t.b[1]));
    const [hs, vs] = h1 ? [s, t] : [t, s];
    const y = hs.a[1], x = vs.a[0];
    return x > Math.min(hs.a[0], hs.b[0]) + 0.05 && x < Math.max(hs.a[0], hs.b[0]) - 0.05 && y > Math.min(vs.a[1], vs.b[1]) + 0.05 && y < Math.max(vs.a[1], vs.b[1]) - 0.05;
  };
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++)
    if (segs[i].li !== segs[j].li && segs[i].page === segs[j].page && cross(segs[i], segs[j])) check(false, `p${segs[i].page} lines cross: "${LEADERS[segs[i].li].text.slice(0, 24)}" × "${LEADERS[segs[j].li].text.slice(0, 24)}"`);
  const lb = await pg.evaluate(() => { const MM = 96 / 25.4; return [...document.querySelectorAll("section.page")].map((sec) => { const P = sec.getBoundingClientRect();
    return [...sec.querySelectorAll(".nlabel")].map((e) => { const r = e.getBoundingClientRect(); return { no: sec.dataset.no, t: e.textContent, b: [(r.left - P.left) / MM, (r.top - P.top) / MM, (r.right - P.left) / MM, (r.bottom - P.top) / MM] }; }); }).flat(); });
  for (const s of segs) for (const l of lb) {
    if (l.no !== s.page || LEADERS[s.li].text.replace(/'/g, "’").replace(/\*/g, "") === l.t) continue;
    const x1 = Math.min(s.a[0], s.b[0]), x2 = Math.max(s.a[0], s.b[0]), y1 = Math.min(s.a[1], s.b[1]), y2 = Math.max(s.a[1], s.b[1]);
    if (x1 < l.b[2] + 0.5 && x2 > l.b[0] - 0.5 && y1 < l.b[3] + 0.5 && y2 > l.b[1] - 0.5) check(false, `p${s.page} line "${LEADERS[s.li].text.slice(0, 24)}" runs through label "${l.t.slice(0, 24)}"`);
  }
}
await pg.pdf({ path: path.join(OUT, "guide-review.pdf"), width: "297mm", height: "210mm", printBackground: true, preferCSSPageSize: true });
const nos = await pg.$$eval("section.page", (e) => e.map((x) => x.dataset.no));
await pg.setViewportSize({ width: 1123, height: 794 });
for (const [i, no] of nos.entries()) await (await pg.$$("section.page"))[i].screenshot({ path: path.join(OUT, `page-${no}.png`) });
await pg.addStyleTag({ content: ".lines, .nlabel, .hl { visibility: hidden !important; } .hash::before, .hash::after { display: none !important; }" });
for (const [i, no] of nos.entries()) await (await pg.$$("section.page"))[i].screenshot({ path: path.join(OUT, `page-${no}-bare.png`) });
const frames = await pg.evaluate(() => { const MM = 96 / 25.4; const o = {}; for (const sec of document.querySelectorAll("section.page")) { const P = sec.getBoundingClientRect();
  o[sec.dataset.no] = [...sec.querySelectorAll(".shot, .card, .ground, .bar")].map((e) => { const r = e.getBoundingClientRect(); return [(r.left - P.left) / MM, (r.top - P.top) / MM, (r.right - P.left) / MM, (r.bottom - P.top) / MM]; }); } return o; });
fs.writeFileSync(path.join(OUT, "leaders.json"), JSON.stringify({ leaders: LEADERS.filter((L) => nos.includes(L.page)), frames }));
const n = nos.length;
await browser.close(); await MB.close();
console.log(`${n} pages → out/guide-review.pdf · ${problems.length} checks`);
execFileSync("python3", [path.join(HERE, "check_lines.py")], { stdio: "inherit" });
