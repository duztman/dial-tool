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
const block = (b, t, o = {}) => `<div class="block${t.watch ? " watch" : ""}${o.small ? " small" : ""}${o.bare ? " bare" : ""}"${o.flow ? ` data-flow="${o.flow}" data-bottom="${o.bottom ?? Y(14) + ROW}"` : ""} style="${css(b)}">
  ${t.watch ? `<svg class="tri" viewBox="0 0 24 24"><path d="M12 3 L22 20 L2 20 Z"/><path d="M12 10 V14.5 M12 16.8 V17.6"/></svg>` : ""}
  <p><b>${inline(t.label)}${/[?.!]$/.test(t.label) ? "" : "."}</b> ${inline(t.body)}</p></div>`;

// the head (Okay, 16:56): the part's tab above the rule, on the grid (one row high); the guide's name beside it;
// the address at the far right of the same line. Under the rule the title and the lead, one sentence a line.
const lead_lines = (s) => s.split(/\n|(?<=[.!?])\s+(?=[A-Z])/).map((l) => inline(l.trim())).join("<br>");
const head = (part, no, t) => `<div class="tabline" style="left:${X(1)}mm;top:${TOP - ROW}mm;width:${W(12)}mm;height:${ROW}mm">
    <div class="ptab" style="width:${W(1)}mm">${part}<span>${no}</span></div><div class="gname">Dial Tool · Guidebook · beta 4.36</div>
    <div class="gurl">duztman.github.io/dial-tool</div></div>
  <div class="head" style="left:${X(1)}mm;top:${Y(1)}mm;width:${W(12)}mm;height:${H(2)}mm">
    <h1 style="width:${W(6)}mm">${inline(t.title)}</h1>
    <p class="lead" style="left:${X(7) - X(1)}mm;width:${W(6)}mm">${lead_lines(t.lead)}</p></div>`;
const page = (part, inner) => `<section class="page" style="--sig:${tint(part)};--sig-ink:${ink_of(part)}">${inner}</section>`;

// ── pictures: tinted screenshots, cut-out cards, lines with labels ──
const JOBS = [];
const tinted = (shot, part) => { const out = `t-${shot}-${part}.jpg`; if (!JOBS.some((j) => j.out === out)) JOBS.push({ kind: "tint", shot, out, light: tint(part), dark: tint_dark(part) }); return `../img/made/${out}`; };
/** a tinted span of a screenshot filling box b: `k` mm a point, the point (cx, cy) of the screenshot at the box's centre */
function ground(b, shot, part, cx, cy, k) {
  let ox = cx - b.w / 2 / k, oy = cy - b.h / 2 / k;
  ox = Math.max(0, Math.min(VW - b.w / k, ox)); oy = Math.max(0, Math.min(VH - b.h / k, oy));
  return { html: `<div class="ground" style="${css(b)}"><img src="${tinted(shot, part)}" style="width:${f2(VW * k)}mm;left:${f2(-ox * k)}mm;top:${f2(-oy * k)}mm"></div>`,
    at: (r) => [b.x + (r[0] - ox) * k, b.y + (r[1] - oy) * k, r[2] * k, r[3] * k] };
}
let card_n = 0;
/** a cut-out card: rect (points) of a shot with `pad` points of its own background around it, `k` mm a point,
 *  its top left at (x, y) mm, or centred on (x, y) with o.centre */
function card(shot, rect, x, y, k, o = {}) {
  const pad = o.pad ?? 6, out = `c${++card_n}-${shot}.png`;
  JOBS.push({ kind: "card", shot, rect, pad, out, bg: o.bg });
  const w = (rect[2] + 2 * pad) * k, h = (rect[3] + 2 * pad) * k;
  if (o.centre) { x -= w / 2; y -= h / 2; }
  const x0 = rect[0] - pad, y0 = rect[1] - pad;
  return { html: `<img class="card${o.flat ? " flat" : ""}" src="../img/made/${out}" style="left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(w)}mm;height:${f2(h)}mm">`,
    x, y, w, h, at: (r) => [x + (r[0] - x0) * k, y + (r[1] - y0) * k, r[2] * k, r[3] * k] };
}
/** lines with labels. Each: { r: [x,y,w,h] mm of the part, side: "L"|"R"|"T"|"D", to: mm (x for L/R, y for T/D), text,
 *  w: label width mm, along: optional mm (y for L/R, x for T/D) where the label sits, box: draw a box round the part } */
function lines(items) {
  let svg = "", labels = "";
  // lines on one side bend at different places, the outermost first, so they never cross
  for (const side of ["L", "R"]) {
    const g = items.filter((i) => i.side === side).sort((a, b) => (a.along ?? a.r[1]) - (b.along ?? b.r[1]));
    const down = g.filter((i) => (i.along ?? 0) >= i.r[1] + i.r[3] / 2), up = g.filter((i) => !down.includes(i));
    up.forEach((it, i) => { it.step = i; }); down.reverse().forEach((it, i) => { it.step = i; });
  }
  for (const it of items) {
    const [x, y, w, h] = it.r;
    if (it.box) svg += `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}"/>`;
    const lw = it.w ?? 30;
    if (it.side === "L" || it.side === "R") {
      const sx = it.side === "L" ? x : x + w, sy = y + h / 2, ly = it.along ?? sy, st = (it.step ?? 0) * 1.5, bend = it.side === "L" ? it.to + 2 + st : it.to - 2 - st;
      svg += `<circle cx="${f2(sx)}" cy="${f2(sy)}" r=".45"/><polyline points="${f2(sx)},${f2(sy)} ${f2(bend + (it.side === "L" ? 1.5 : -1.5))},${f2(sy)} ${f2(bend)},${f2(ly)} ${f2(it.to)},${f2(ly)}"/>`;
      labels += `<div class="nlabel ${it.side === "L" ? "r" : ""}" style="${it.side === "L" ? `left:${f2(it.to - 1 - lw)}mm` : `left:${f2(it.to + 1)}mm`};top:${f2(ly - 1.75)}mm;width:${f2(lw)}mm">${inline(it.text)}</div>`;
    } else {
      const sx = x + w / 2, sy = it.side === "T" ? y : y + h, lx = it.along ?? sx;
      svg += `<circle cx="${f2(sx)}" cy="${f2(sy)}" r=".45"/><polyline points="${f2(sx)},${f2(sy)} ${f2(sx)},${f2((sy + it.to) / 2)} ${f2(lx)},${f2((sy + it.to) / 2)} ${f2(lx)},${f2(it.to)}"/>`;
      const al = it.align ?? "c";
      const left = al === "c" ? lx - lw / 2 : al === "l" ? lx - 0.2 : lx - lw + 0.2;
      labels += `<div class="nlabel ${al}" style="left:${f2(left)}mm;top:${f2(it.side === "T" ? it.to - 3.6 * (it.lines ?? 1) : it.to + 0.6)}mm;width:${f2(lw)}mm">${inline(it.text)}</div>`;
    }
  }
  return `<svg class="lines" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${svg}</svg>${labels}`;
}
/** a part lifted out of its own window: the window tinted at the same scale, the part in place over it, in full */
function lift(b, shot, part, rect, k, o = {}) {
  const pad = o.pad ?? 4, cx = o.cx ?? rect[0] + rect[2] / 2, cy = o.cy ?? rect[1] + rect[3] / 2;
  const g = ground(b, shot, part, cx, cy, k), at = g.at([rect[0] - pad, rect[1] - pad, 0, 0]);
  const c = card(shot, rect, at[0], at[1], k, { ...o, pad });
  return { ...c, html: g.html + c.html };
}
const dial = (b, file, o = {}) => `<div class="pic" style="${css(b)}"><img src="../img/${file}.svg" style="height:${o.fill ?? 92}%"></div>`;
const caption = (x, y, w, s, al = "l") => `<div class="cap ${al}" style="left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(w)}mm">${inline(s)}</div>`;
const union = (...rs) => { rs = rs.filter(Boolean); const x = Math.min(...rs.map((r) => r[0])), y = Math.min(...rs.map((r) => r[1])); return [x, y, Math.max(...rs.map((r) => r[0] + r[2])) - x, Math.max(...rs.map((r) => r[1] + r[3])) - y]; };

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
// Large: the tool in a browser, its address carrying the dial. Middle: the unit box, closed and open, the same
// size so the change shows. Small: Copy link; undo · redo.
{
  const t = page_text("01"), P = "A";
  let h = head(P, "01", t);
  const big = box(1, 3, 6, 8);
  h += `<div class="ground" style="${css(big)}"></div>`;
  const iw = big.w - 14, ih = iw * VH / VW, ix = big.x + 7, iy = big.y + big.h - 7 - ih;
  h += `<div class="bar" style="left:${f2(ix)}mm;top:${f2(iy - 9.5)}mm;width:${f2(iw)}mm;height:7mm"><span>duztman.github.io/dial-tool/</span><b>#1.q1ZKL81MSS1WskpLzClOrQUA</b></div>`;
  h += `<div class="shot" style="left:${f2(ix)}mm;top:${f2(iy)}mm;width:${f2(iw)}mm;height:${f2(ih)}mm"><img src="${tinted("dial", P)}"></div>`;
  h += lines([{ r: [ix + 42.6, iy - 8.3, 1.2, 4.6], side: "T", to: iy - 13.2, text: note(t, "hash"), w: 70, align: "l", along: ix + 43.2 }]);
  h += block(box(1, 11, 3, 4), text(t, "Where it lives"), { flow: "a" }) + block(box(4, 11, 3, 4), text(t, "The link is the dial"), { flow: "b" });

  // middle — the unit box, closed and open, side by side
  const mid = box(7, 3, 3, 4);
  h += ground(mid, "dial", P, 380, 90, 0.2).html;
  const ur = [262, 12, 180, 184], k = 0.158;
  const ca = card("dial", ur, mid.x + 3, mid.y + (mid.h - (ur[3] + 8) * k) / 2, k, { pad: 4 });
  const cb = card("unit", ur, mid.x + mid.w - 3 - (ur[2] + 8) * k, ca.y, k, { pad: 4 });
  h += ca.html + cb.html;
  h += block(box(7, 7, 3, 4), text(t, "Everything is in millimetres"), { flow: "c" }) + block(box(7, 11, 3, 2), text(t, "Watch: units"), { flow: "c" });

  // small — Copy link, then the fonts
  const s1 = box(10, 3, 3, 3);
  const lr = [24, 546, 412, 150], kl = 0.142;
  const cl = lift(s1, "export", P, lr, kl, { pad: 3, cy: 640 });
  const cp = cl.at([52, 652, 79, 26]);
  h += cl.html + lines([{ r: cp, side: "D", to: s1.y + s1.h - 5.2, text: note(t, "copy"), w: 50, align: "l", along: cp[0] + cp[2] / 2 }]);
  h += block(box(10, 6, 3, 3), text(t, "Watch"), { flow: "d", bottom: Y(8) + ROW });
  // small — undo · redo
  const s2 = box(10, 9, 3, 2);
  const cu = lift(s2, "dial", P, [470, 13, 70, 38], 0.3, { pad: 3, cx: 470, cy: 40 });
  h += cu.html;
  const ub = cu.at([473, 16, 32, 32]), rb = cu.at([505, 16, 32, 32]);
  h += lines([{ r: ub, side: "D", to: s2.y + s2.h - 5.2, text: note(t, "undo"), w: 22, align: "r", along: ub[0] + ub[2] / 2 },
    { r: rb, side: "D", to: s2.y + s2.h - 5.2, text: note(t, "redo"), w: 24, align: "l", along: rb[0] + rb[2] / 2 }]);
  h += block(box(10, 11, 3, 3), text(t, "Changed your mind?"), { flow: "e" });
  pages.push(page(P, h));
}


// 02 · A first dial, in ten pictures — two bands of six slots: the picture 4 rows, its words 2; the last two slots the finished dial
{
  const t = page_text("02");
  const steps = Object.keys(t.blocks).filter((k) => /^\d+ · /.test(k));
  check(steps.length === 10, `first dial: ${steps.length} steps, not 10`);
  let html = head("A", "02", t);
  steps.forEach((k, i) => {
    const band = i < 6 ? 3 : 9, c = 1 + (i % 6) * 2, b = box(c, band, 2, 4);
    if (i === 9) html += `<div class="pic" style="${css(b)}"><div class="file"><img src="../img/dial-step-10.svg"><span>dial.svg · 40 × 40 mm</span></div></div>`;
    else html += dial(b, `dial-step-${i + 1}`, { fill: 88 });
    const tb = { x: b.x, y: b.y + b.h + 1.8, w: b.w, h: H(2) + RGAP - 1.8 };
    html += `<div class="block small step" style="${css(tb)}"><p><b>${inline(k)}</b><br>${inline(t.blocks[k])}</p></div>`;
  });
  const fin = box(9, 9, 4, 4);
  html += dial(fin, "dial-step-10", { fill: 94 })
    + `<div class="block small step" style="${css({ x: fin.x, y: fin.y + fin.h + 1.8, w: fin.w, h: H(2) + RGAP - 1.8 })}"><p><b>The finished dial.</b> <a href="${SITE}${SHOTS.links["step-10"]}">Open it in the tool</a> and take it apart, ring by ring: every step above is still in it.</p></div>`;
  pages.push(page("A", html));
}

// ════════════════════════ 03 · The whole window ════════════════════════
// Okay: "we need to see the whole first before explaining the parts". Every label is one sentence that says what
// the part does; the eye is boxed alone.
{
  const t = page_text("03"), P = "A";
  const img = { x: X(3) + 2, y: Y(4) - 2, w: W(8) - 4 };
  img.h = img.w * VH / VW;
  const s = img.w / VW, D = R.dial;
  const at = (r) => [img.x + r[0] * s, img.y + r[1] * s, r[2] * s, r[3] * s];
  const pad = (r, p = 2) => [r[0] - p, r[1] - p, r[2] + 2 * p, r[3] + 2 * p];
  const lh = (s, w) => Math.ceil(s.length * 1.5 / w) * 3.7;
  // left: in order down the panel, never closer than their own height
  const left = [[[20, 26, 170, 32], "name"], [D.tabs, "tabs"], [[26, 163, 16, 16], "eye"], [D.number_row, "number"], [D.plate, "colour"]]
    .map(([r, key]) => ({ r: at(pad(r)), key, text: note(t, key) }));
  let last = img.y - 2;
  for (const it of left) { const my = it.r[1] + it.r[3] / 2, hh = lh(it.text, W(2) - 4); it.along = Math.max(my, last + hh / 2 + 1.5); last = it.along + hh / 2; }
  const L = left.map((it) => ({ ...it, box: true, side: "L", to: X(3) - 3, w: W(2) - 4 }));
  // above: units, undo, guides
  const U = [[D.unit, "units", "r", 2], [D.undo, "undo", "l", -2], [union(D.guides), "guides", "r", 2]].map(([r, key, al, nudge], i) => {
    const rr = at(pad(r)); return { r: rr, box: true, side: "T", to: img.y - 4.2, text: note(t, key), w: i === 1 ? 52 : 50, align: al, lines: 2, along: rr[0] + rr[2] / 2 + nudge };
  });
  // right: the backdrop
  const Rr = [{ r: at(pad(D.backdrop)), box: true, side: "R", to: img.x + img.w + 4, text: note(t, "backdrop"), w: 34 }];
  // below: four, each label leaning away from its neighbour
  const Dn = [[union(D.play), "play", "r", 2, 46], [union(D.time), "time", "l", -2, 46], [D.day, "day", "l", 0, 46], [union(D.zoom), "zoom", "r", 2, 40]].map(([r, key, al, nudge, w]) => {
    const rr = at(pad(r)); return { r: rr, box: true, side: "D", to: img.y + img.h + 4, text: note(t, key), w, align: al, along: rr[0] + rr[2] / 2 + nudge };
  });
  Dn[2].align = "c"; Dn[2].along = Dn[2].r[0] + Dn[2].r[2] / 2;
  let h = head(P, "03", t);
  h += `<div class="shot framed" style="${css(img)}"><img src="../img/dial.png"></div>`;
  h += lines([...L, ...U, ...Rr, ...Dn]);
  h += block(box(1, 13, 4, 2), text(t, "Typing numbers")) + block(box(5, 13, 4, 2), text(t, "On an iPad")) + block(box(9, 13, 4, 2), text(t, "Watch"));
  pages.push(page(P, h));
}

// ════════════════════════ 04 · The window ════════════════════════
// Large: point and click — the whole dial under the pointer, the label and outline lifted out; then three smaller
// cases: a numeral, a marker, and where the click lands. Middle: the tabs, and two of the panels they open.
// Small: a group open and folded, the same frame; the bottom bar, its parts named.
{
  const t = page_text("04"), P = "A";
  let h = head(P, "04", t);
  const big = box(1, 3, 6, 6);
  h += ground(big, "hover-hand", P, 950, 424, 0.092).html;
  const HR = [745, 278, 240, 172], kh = 0.235;
  const ch = card("hover-hand", HR, big.x + big.w - 5 - (HR[2] + 8) * kh, big.y + (big.h - (HR[3] + 8) * kh) / 2, kh, { pad: 4 });
  h += ch.html;
  const cases = [["hover-numeral", [900, 140, 100, 80], "A numeral"], ["hover", [1170, 222, 92, 70], "A marker"], ["clicked", [52, 192, 384, 140], "The click: Markers, in Rings"]];
  cases.forEach(([shot, r, cap], i) => {
    const b = box(1 + i * 2, 9, 2, 2), k = (b.w - 6) / (r[2] + 8);
    const kk = Math.min(k, (b.h - 8) / (r[3] + 8));
    h += `<div class="ground" style="${css(b)}"></div>`;
    const c = card(shot, r, b.x + b.w / 2, b.y + 2.5 + (r[3] + 8) * kk / 2, kk, { pad: 4, centre: true });
    h += c.html + caption(b.x + 2, b.y + b.h - 4.2, b.w - 4, cap);
  });
  h += block(box(1, 11, 3, 4), text(t, "Point and click"), { flow: "a" }) + block(box(4, 11, 3, 4), text(t, "Moving around"), { flow: "b" });
  h += block(box(4, 13, 3, 2), text(t, "Watch"), { flow: "b" });

  // middle — the tabs; Rings and Hands, as the tabs open them
  const mid = box(7, 3, 3, 2);
  const ct = lift(mid, "dial", P, R.dial.tabs, 0.142, { pad: 3 });
  h += ct.html;
  const th = box(7, 5, 3, 3);
  h += `<div class="ground" style="${css(th)}"></div>`;
  ["rings", "hands"].forEach((shot, i) => {
    const tw = (th.w - 7) / 2, r = [0, 64, 460, 430], k = tw / 460;
    const c = card(shot, r, th.x + 2.5 + i * (tw + 2), th.y + 2.5, k, { pad: 0, flat: true });
    h += c.html + caption(c.x, c.y + c.h + 0.8, tw, ["Rings", "Hands"][i]);
  });
  h += block(box(7, 8, 3, 4), text(t, "Five tabs"), { flow: "c" });

  // small — a group open, then folded
  const s1 = box(10, 3, 3, 4);
  h += ground(s1, "dial", P, 230, 400, 0.17).html;
  const gr = [24, 344, 412, 140], kk = 0.142;
  const g1 = card("dial", gr, s1.x + s1.w / 2, s1.y + 2.5 + (gr[3] + 8) * kk / 2, kk, { pad: 4, centre: true });
  const g2 = card("folded", gr, s1.x + s1.w / 2, s1.y + s1.h - 2.5 - (gr[3] + 8) * kk / 2, kk, { pad: 4, centre: true });
  h += g1.html + g2.html;
  h += block(box(10, 7, 3, 3), text(t, "Groups and the eye"), { flow: "d", bottom: Y(9) + ROW });
  // small — the bottom bar
  const s2 = box(10, 10, 3, 2);
  const br = [48, 856, 392, 38], kb = 0.152;
  const cb = lift(s2, "dial", P, br, kb, { pad: 2 });
  h += cb.html;
  const bits = [[[52, 860, 54, 30], "play"], [[118, 860, 120, 30], "speeds"], [[250, 860, 88, 30], "bartime"], [[340, 860, 30, 30], "ampm"], [[382, 860, 54, 30], "now"]];
  h += lines(bits.map(([r, key], i) => ({ r: cb.at(r), side: "T", to: cb.y - 2 - (i % 2) * 4.2, text: note(t, key), w: 16, align: "c" })));
  h += block(box(10, 12, 3, 3), text(t, "The bottom bar"), { flow: "e" });
  pages.push(page(P, h));
}

// ════════════════════════ 05 · Dial and page ════════════════════════
// Large: the colour box, every part named. Middle: the Dial group and what Scale everything does, three dials at
// their true sizes. Small: the Page group; the Colours group, cut in the middle of its list.
{
  const t = page_text("05"), P = "B";
  let h = head(P, "05", t);
  const big = box(1, 3, 6, 8), Q = R.pop;
  h += ground(big, "pop", P, 560, 420, 0.155).html;
  const kp = 0.215, cp = card("pop", Q.box, big.x + big.w / 2, big.y + big.h / 2, kp, { pad: 0, centre: true, bg: "#141414" });
  h += cp.html;
  const field = [292, 362, 354, 180], lx = cp.x - 4, rx = cp.x + cp.w + 4;
  h += lines([
    { r: cp.at(Q.used), side: "L", to: lx, text: note(t, "used"), w: 24 },
    { r: cp.at(Q.palette), side: "L", to: lx, text: note(t, "palette"), w: 24, along: cp.at(Q.palette)[1] + 7.5 },
    { r: cp.at(field), side: "L", to: lx, text: note(t, "field"), w: 24 },
    { r: cp.at(union(Q.as, Q.hex)), side: "L", to: lx, text: note(t, "values"), w: 24 },
    { r: cp.at(Q.wide), side: "R", to: rx, text: note(t, "wide"), w: 22 },
    { r: cp.at(Q.copy), side: "R", to: rx, text: note(t, "copy"), w: 22 },
  ]);
  h += block(box(1, 11, 3, 4), text(t, "The colour box"), { flow: "a" });
  h += block(box(4, 11, 3, 2), text(t, "Watch"), { flow: "b" }) + block(box(4, 13, 3, 2), text(t, "Watch: see-through"), { flow: "b" });

  // middle — the Dial group; three dials at their true sizes
  const m1 = box(7, 3, 3, 2);
  const dg = [24, 186, 412, 70], kd = 0.142;
  h += lift(m1, "dial", P, dg, kd, { pad: 4 }).html;
  const m2 = box(7, 5, 3, 3);
  h += `<div class="ground" style="${css(m2)}"></div>`;
  const mm = 0.55;                                                     // mm on the page per mm of dial page
  [["scale-30", "d30", 36], ["scale-off", "doff", 42], ["scale-on", "don", 42]].forEach(([f, key, pgmm], i) => {
    const cw = (m2.w - 4) / 3, cx = m2.x + 2 + i * cw + cw / 2, wd = pgmm * mm;
    h += `<img class="svgdial" src="../img/${f}.svg" style="left:${f2(cx - wd / 2)}mm;top:${f2(m2.y + 2 + (42 * mm - wd) / 2)}mm;width:${f2(wd)}mm">`;
    h += caption(cx - cw / 2 + 1, m2.y + 2.5 + 42 * mm, cw - 2, note(t, key), "c");
  });
  h += block(box(7, 8, 3, 4), text(t, "Diameter"), { flow: "c" }) + block(box(7, 11, 3, 3), text(t, "Scale everything with it"), { flow: "c" });

  // small — Page; Colours, cut in the middle
  const s1 = box(10, 3, 3, 2);
  h += lift(s1, "dial", P, [24, 344, 412, 92], 0.142, { pad: 3 }).html;
  h += block(box(10, 5, 3, 2), text(t, "Plate"), { flow: "d" }) + block(box(10, 7, 3, 3), text(t, "The page"), { flow: "d", bottom: Y(9) + ROW });
  const s2 = box(10, 10, 3, 2);
  h += `<div class="ground" style="${css(s2)}"></div>`;
  h += card("dial", [24, 482, 250, 92], s2.x + s2.w / 2, s2.y + s2.h / 2 + 1, 0.2, { pad: 3, centre: true }).html.replace('class="card"', 'class="card cut"');
  h += block(box(10, 12, 3, 3), text(t, "Colours, all in one place"), { flow: "e" });
  pages.push(page(P, h));
}

// ════════════════════════ 06 · Rings ════════════════════════
// Large: a dial of eleven rings, each named with its kind. Middle: how a ring shows in the list, its parts named.
// Small: adding — the same frame before and after the +; the drawer, every button named.
{
  const t = page_text("06"), P = "B";
  let h = head(P, "06", t);
  const S = JSON.parse(fs.readFileSync(path.join(IMG, "dial-diver.json"), "utf8"));
  const big = box(1, 3, 6, 8);
  h += `<div class="ground plain" style="${css(big)}"></div>`;
  const dd = 58, kd = dd / S.dial_d, pg = (S.dial_d + 2 * S.margin) * kd, cx = big.x + big.w / 2, cy = big.y + big.h / 2;
  h += `<img class="svgdial" src="../img/dial-diver.svg" style="left:${f2(cx - pg / 2)}mm;top:${f2(cy - pg / 2)}mm;width:${f2(pg)}mm">`;
  const KIND = ["ticks", "markers", "numerals", "band"];
  // each ring: a point on it at its own angle, then a line out to its name on the nearer side
  const angle = [355, 300, 200, 140, 75, 40, 320, 5, 90, 240, 112];
  const pts = S.rings.map((r, i) => {
    const rad = r.kind === 3 ? r.r - r.width / 2 : r.kind === 2 ? r.r : r.shape === 2 ? r.r - r.w / 2 : r.r - (r.len || 1) / 2;
    const a = angle[i] * Math.PI / 180;
    return { r, i, x: cx + rad * kd * Math.sin(a), y: cy - rad * kd * Math.cos(a), side: Math.sin(a) < 0 ? "L" : "R" };
  });
  for (const side of ["L", "R"]) {
    const g = pts.filter((q) => q.side === side).sort((a, b) => a.y - b.y);
    let last = big.y + 1;
    for (const p of g) { p.ly = Math.max(p.y, last + 7.6); last = p.ly; }
    const over = last - (big.y + big.h - 5); if (over > 0) g.forEach((p) => { p.ly -= over; });
  }
  h += lines(pts.map((p) => ({ r: [p.x, p.y, 0, 0], side: p.side, to: p.side === "L" ? cx - pg / 2 - 1 : cx + pg / 2 + 1, along: p.ly, w: 28,
    text: `${p.r.name} · ${KIND[p.r.kind]}` })));
  h += block(box(1, 11, 3, 4), text(t, "What a ring is"), { flow: "a" }) + block(box(4, 11, 3, 4), text(t, "Four kinds"), { flow: "b" });

  // middle — the list as it shows this dial; its parts named under it, on the paper
  const m = box(7, 3, 3, 4);
  const lr = [52, 190, 384, 150], kl = 0.155;
  const cl = lift(m, "diver-rings", P, lr, kl, { pad: 3 });
  h += cl.html.replace('class="card"', 'class="card cut"');
  const row = 295, eye = cl.at([60, row + 6, 20, 20]), grip = cl.at([88, row + 6, 14, 20]), name = cl.at([112, row + 6, 80, 22]), sum = cl.at([214, row + 6, 216, 22]);
  h += lines([
    { r: eye, side: "T", to: cl.y - 5.8, text: note(t, "eye"), w: 26, align: "l", along: eye[0] + eye[2] / 2 },
    { r: grip, side: "T", to: cl.y - 1.6, text: note(t, "grip"), w: 30, align: "l", along: grip[0] + grip[2] / 2 },
    { r: name, side: "D", to: cl.y + cl.h + 1.6, text: note(t, "name"), w: 42, align: "l", along: name[0] + 3 },
    { r: sum, side: "D", to: cl.y + cl.h + 5.4, text: note(t, "summary"), w: 46, align: "r", along: sum[0] + sum[2] - 4 },
  ]);
  h += block(box(7, 8, 3, 2), text(t, "Top first"), { flow: "c" }) + block(box(7, 10, 3, 2), text(t, "A ring's row"), { flow: "c" }) + block(box(7, 12, 3, 3), text(t, "Watch"), { flow: "c" });

  // small — the + and its menu: the same frame before and after
  const s1 = box(10, 3, 3, 3);
  h += ground(s1, "rings", P, 300, 230, 0.16).html;
  const ar = [190, 150, 132, 184], ka = 0.172;
  const a1 = card("rings", ar, s1.x + 3, s1.y + (s1.h - (ar[3] + 8) * ka) / 2, ka, { pad: 4 });
  const a2 = card("add", ar, s1.x + s1.w - 3 - (ar[2] + 8) * ka, a1.y, ka, { pad: 4 });
  h += a1.html + a2.html;
  h += block(box(10, 6, 3, 3), text(t, "Adding and arranging"), { flow: "d", bottom: Y(8) + ROW });
  // small — the drawer
  const s2 = box(10, 9, 3, 2);
  const dr = [100, 239, 334, 44], kr = 0.17;
  const cr = lift(s2, "rings", P, dr, kr, { pad: 3, cy: 290 });
  const rr = cr.at(R.rings.radius);
  h += cr.html + lines([
    { r: cr.at(R.rings.kinds), side: "D", to: cr.y + cr.h + 1.8, text: note(t, "kinds"), w: 22, align: "c" },
    { r: cr.at(R.rings.colour), side: "D", to: cr.y + cr.h + 6, text: note(t, "colour"), w: 14, align: "r", along: cr.at(R.rings.colour)[0] + cr.at(R.rings.colour)[2] / 2 + 1 },
    { r: cr.at(R.rings.size), side: "D", to: cr.y + cr.h + 1.8, text: note(t, "size"), w: 12, align: "c" },
    { r: rr, side: "D", to: cr.y + cr.h + 6, text: note(t, "radius"), w: 16, align: "l", along: rr[0] + rr[2] / 2 - 1 },
  ]);
  h += block(box(10, 11, 3, 4), text(t, "The drawer"), { flow: "e" });
  pages.push(page(P, h));
}

// ════════════════════════ out ════════════════════════
fs.writeFileSync(path.join(OUT, "jobs.json"), JSON.stringify(JOBS));
execFileSync("python3", [path.join(HERE, "cards.py"), path.join(OUT, "jobs.json")], { stdio: "inherit" });
const inter = pathToFileURL(path.join(HERE, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")).href;
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dial Tool guidebook — review</title>
<style>@font-face{font-family:"Inter";src:url("${inter}") format("woff2");font-weight:100 900;}</style>
<link rel="stylesheet" href="../style.css"></head><body>${pages.join("\n")}</body></html>`;
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
      let y = parseFloat(list[0].style.top);
      for (const b of list) {
        b.style.top = y + "mm"; b.style.height = "auto";
        const hmm = b.getBoundingClientRect().height / MM;
        const n = Math.max(1, Math.ceil((hmm + RGAP - 0.3) / (ROW + RGAP)));
        const h = n * ROW + (n - 1) * RGAP;
        b.style.height = h + "mm";
        if (y + h > parseFloat(b.dataset.bottom) + 0.5) out.push(b.textContent.trim().slice(0, 40));
        y += h + RGAP;
      }
    }
  }
  return out;
}, [ROW, RGAP]);
for (const o of flowed) check(false, `a column of words runs past its end: "${o}…"`);
await pg.waitForTimeout(600);
// measure: words that overflow their block
const over = await pg.evaluate(() => [...document.querySelectorAll(".block")].filter((b) => b.scrollHeight > b.clientHeight + 1).map((b) => b.textContent.trim().slice(0, 40)));
for (const o of over) check(false, `words overflow their block: "${o}…"`);
// no line of one word, at the end of a paragraph or inside it (Okay, 14 Oct: "one word lines are not allowed")
const lonely = await pg.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll(".block p, .lead, .cdesc, .cnote, .plabel")) {
    const lines = new Map();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      for (const m of n.textContent.matchAll(/\S+/g)) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const rect = r.getClientRects()[0]; if (!rect) continue;
        const y = Math.round(rect.top / 3);
        lines.set(y, [...(lines.get(y) || []), m[0]]);
      }
    }
    const ls = [...lines.values()];
    if (ls.length > 1) ls.forEach((l, i) => { if (l.length === 1 && l[0].length > 1) out.push(`"${l[0]}" alone on line ${i + 1} of "${el.textContent.trim().slice(0, 36)}…"`); });
  }
  return out;
});
for (const o of lonely) check(false, o);
await pg.pdf({ path: path.join(OUT, "guide-review.pdf"), width: "297mm", height: "210mm", printBackground: true, preferCSSPageSize: true });
const n = await pg.$$eval("section.page", (e) => e.length);
await pg.setViewportSize({ width: 1123, height: 794 });
for (let i = 0; i < n; i++) {
  const el = (await pg.$$("section.page"))[i];
  await el.screenshot({ path: path.join(OUT, `page-${String(i).padStart(2, "0")}.png`) });
}
await browser.close();
console.log(`${n} pages → out/guide-review.pdf · ${problems.length} checks`);
