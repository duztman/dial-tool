// build.mjs — the guide in its look (guide/PLAN.md steps 7–8): the words of guide/text/edition-1.md and the pictures
// of shots.mjs, set as A4 landscape pages (12 × 14 grid, design canon §3) and, from the same words and pictures, as a
// stack for a phone. One file: out/index.html (+ img/, fonts/); a wide screen shows the pages whole, a phone the stack.
// Also out/guide.pdf (A4) and, for looking, out/review/page-NN.png and phone-NN.png.
//
//   cd web && node ../guide/look/shots.mjs     (pictures, from the app)
//   node guide/look/build.mjs                  (from the repo's root, or anywhere)
//
// Refuses to build if a sentence's check fails (guide/tools/claims.mjs) or if the checks, the First dial and the
// pictures were made on different versions than the app's. Prints a CHECK line for every rule it can measure that a
// page breaks (words past their box, ragged ends, labels too close, lines that cross or run through words, lines over
// the picture: check_lines.py). Started 15 Oct 2026 from the 4.36.1 web guide's composer (archive/guide/web/build.mjs).
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { extract, make_package } from "./indesign.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../..");
const OUT = path.join(HERE, "out"), IMG = path.join(HERE, "img"), REV = path.join(OUT, "review");
const APP = "https://duztman.github.io/dial-tool/";
const problems = [];
const check = (ok, what) => { if (!ok) { problems.push(what); console.log("CHECK  " + what); } };

// ── the truth gate, and one version for everything ──
execFileSync("node", [path.join(ROOT, "guide/tools/claims.mjs")], { stdio: "inherit" });
const results = JSON.parse(fs.readFileSync(path.join(ROOT, "guide/checks/results.json"), "utf8"));
const FIRST = JSON.parse(fs.readFileSync(path.join(ROOT, "guide/checks/first-dial.json"), "utf8"));
const SH = JSON.parse(fs.readFileSync(path.join(IMG, "rects.json"), "utf8"));
const VERSION = fs.readFileSync(path.join(ROOT, "web/src/geometry.js"), "utf8").match(/VERSION = "([^"]+)"/)[1];
for (const [what, v] of [["the checks", results.version], ["the First dial", FIRST.version], ["the pictures", SH.version]])
  if (v !== VERSION) throw new Error(`${what} ran on ${v}, the app is ${VERSION}: run them again (guide/look/README.md)`);
const R = SH.rects, [VW, VH] = SH.viewport, LINKS = SH.links;
const DATE = new Date().toISOString().slice(0, 10);

// ── the grid (design canon §3): A4 landscape, 12 columns × 14 rows, in millimetres ──
const PAGE = [297, 210], SIDE = 12, TOP = 11.5, COL = 19.08, GUT = 4, B = 1.375, ROW = 6 * B, RGAP = 4 * B;
const X = (c) => SIDE + (c - 1) * (COL + GUT);
const Y = (r) => TOP + (r - 1) * (ROW + RGAP);
const W = (n) => n * COL + (n - 1) * GUT;
const H = (n) => n * ROW + (n - 1) * RGAP;
const box = (c, r, cs, rs) => ({ x: X(c), y: Y(r), w: W(cs), h: H(rs) });
const css = (b) => `left:${b.x.toFixed(2)}mm;top:${b.y.toFixed(2)}mm;width:${b.w.toFixed(2)}mm;height:${b.h.toFixed(2)}mm`;
const f2 = (v) => v.toFixed(2);
const UI = 0.2;            // the stated print scale of interface pictures: 1 iPad point = 0.2 mm (guide/BRIEF.md)

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
const tint_dark = (part) => oklch(0.79, chroma(part) * 0.95, hue(part));
const ink_of = (part) => oklch(0.42, 0.09, hue(part));
const ring_of = (part) => oklch(0.64, 0.13, hue(part));
const PART_NAME = { A: "The tool", B: "First dial", C: "Find it", D: "For the maker" };

// ── the words (guide/text/edition-1.md) ──
const MD = fs.readFileSync(path.join(ROOT, "guide/text/edition-1.md"), "utf8");
const strip = (s) => s.replace(/\s*<!-- check: \w+ -->/g, "").trim();
function page_text(no) {
  const start = MD.indexOf(`\n## ${no} · `); if (start < 0) throw new Error(`no page ${no} in edition-1.md`);
  const end = MD.indexOf("\n## ", start + 5), part = MD.slice(start, end < 0 ? undefined : end);
  const title = part.match(/## \d+ · (.*)/)[1].trim();
  const lm = part.match(/\*\*Lead:\*\* ([\s\S]*?)\n\n/), lead = lm ? lm[1].trim() : "";
  const blocks = {}, notes = {}, steps = [], tables = {};
  const lines = part.split("\n");
  lines.forEach((line, i) => {
    let m;
    if ((m = line.match(/^\*\*Table: (.+?)\*\*\s*$/))) { const rows = []; for (let j = i + 1; j < lines.length && (lines[j].startsWith("|") || !lines[j].trim()); j++) if (lines[j].startsWith("|")) { const c = lines[j].split("|").slice(1, -1).map((x) => x.trim()); if (!c.every((x) => /^-+$/.test(x))) rows.push(c); } tables[m[1]] = rows; return; }
    if ((m = line.match(/^\*\*Note: (.+?)\*\* (.*)$/))) { notes[m[1]] = strip(m[2]); return; }
    if ((m = line.match(/^\*\*Step (\d+) · (.+?)\.\*\* (.*)$/))) { steps.push({ n: +m[1], title: m[2], text: strip(m[3]) }); return; }
    if ((m = line.match(/^\*\*(?!Lead:)(.+?)\*\* (.*)$/))) blocks[m[1].replace(/\.$/, "")] = strip(m[2]);
  });
  return { no, title, lead, blocks, notes, steps, tables };
}
const inline = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/'/g, "’")
  .replace(/(\d) (mm|pt|%|dpi)(?!\w)/g, "$1\u00A0$2").replace(/ › /g, "\u00A0› ");      // a number keeps its unit; a path step keeps its arrow
const lead_lines = (s) => s.split(/\n/).map((l) => inline(l.trim())).join("<br>");
const T = {};                                    // per page: the words used, so the build can say which are left over
function text(t, label) {
  const watch = label.startsWith("Watch");
  const body = t.blocks[label]; check(body !== undefined, `page ${t.no}: no block "${label}"`);
  (T[t.no] = T[t.no] || new Set()).add("b:" + label);
  return { label: watch ? "Watch" : label, body: body || "", watch };
}
function note(t, key) { const v = t.notes[key]; check(v !== undefined, `page ${t.no}: no note "${key}"`); (T[t.no] = T[t.no] || new Set()).add("n:" + key); return v || key; }

// ── a page's parts ──
const TRI = `<svg class="tri" viewBox="0 0 24 24"><path d="M12 3 L22 20 L2 20 Z"/><path d="M12 10 V14.5 M12 16.8 V17.6"/></svg>`;
const block = (b, t, o = {}) => `<div class="block${t.watch ? " watch" : ""}${o.attach ? " attached" : ""}${o.small ? " small" : ""}${o.bare ? " bare" : ""}"${o.flow ? ` data-flow="${o.flow}" data-bottom="${o.bottom ?? Y(14) + ROW}"` : ""} style="${css(b)}">
  ${t.watch ? TRI : ""}<p><b>${inline(t.label)}${/[?.!]$/.test(t.label) ? "" : "."}</b> ${inline(t.body)}</p></div>`;
let CUR = "", PART = "A";
const head = (part, no, t, o = {}) => { CUR = no; PART = part; return `<div class="tabline" style="left:${X(1)}mm;top:${TOP - ROW}mm;width:${W(12)}mm;height:${ROW}mm">
    <div class="ptab" style="width:${W(1)}mm">${part}<span>${no}</span></div><div class="gname">Dial Tool · Guide, edition 1 · ${VERSION}</div>
    <div class="gurl">duztman.github.io/dial-tool/guide</div></div>
  <div class="head" style="left:${f2(X(1))}mm;top:${Y(1)}mm;width:${f2(W(12))}mm;height:${H(2)}mm">
    <h1>${inline(t.title)}</h1>
    <p class="lead${o.leadRight ? " right" : ""}" style="${o.leadRight ? `left:${f2(X(7) - X(1))}mm;width:${f2(W(6))}mm` : `width:${f2(o.leadW ?? W(8))}mm`}">${lead_lines(t.lead)}</p></div>`; };
const page = (part, inner) => `<section class="page" id="p${CUR}" data-no="${CUR}" style="--sig:${tint(part)};--sig-ink:${ink_of(part)};--sig-ring:${ring_of(part)}">${inner}</section>`;
const caption = (x, y, w, s, al = "l") => `<div class="cap ${al}" style="left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(w)}mm">${inline(s)}</div>`;
const table = (b, rows, o = {}) => `<table class="ptable" style="position:absolute;${css({ ...b, h: 0 }).replace(/height:[^;]*;?/, "")}${o.cols ? "" : ""}"><thead><tr>${rows[0].map((c, i) => `<th${o.cols ? ` style="width:${o.cols[i]}%"` : ""}>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

// ── pictures ──
const JOBS = [];
let card_n = 0;
/** a part of a screenshot (rect in points) cut out with a margin of its own background (pad, points), at k mm a point */
function card(shot, rect, x, y, k, o = {}) {
  const pad = o.pad ?? 6, out = `c${++card_n}-${shot}.png`;
  JOBS.push({ kind: "card", shot, rect, pad, out, bg: o.bg, blank: o.blank, keep: o.keep });
  const w = (rect[2] + 2 * pad) * k, h = (rect[3] + 2 * pad) * k;
  if (o.centre) { x -= w / 2; y -= h / 2; }
  const x0 = rect[0] - pad, y0 = rect[1] - pad;
  return { src: `img/${out}`, html: `<img class="card${o.cls ? " " + o.cls : ""}" data-pt="${rect[2] + 2 * pad}" src="img/${out}" style="${o.fade ? `--fade:${o.fade}%;` : ""}left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(w)}mm;height:${f2(h)}mm">`,
    x, y, w, h, k, rect, pad, at: (r) => [x + (r[0] - x0) * k, y + (r[1] - y0) * k, (r[2] ?? 0) * k, (r[3] ?? 0) * k],
    pct: (p) => [((p[0] - x0) / (rect[2] + 2 * pad)) * 100, ((p[1] - y0) / (rect[3] + 2 * pad)) * 100] };
}
/** a whole screenshot, framed, at k mm a point */
function whole(shot, x, y, k) {
  const w = VW * k, h = VH * k;
  return { src: `img/${shot}.png`, html: `<div class="shot framed" style="left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(w)}mm;height:${f2(h)}mm"><img src="img/${shot}.png"></div>`,
    x, y, w, h, at: (r) => [x + r[0] * k, y + r[1] * k, (r[2] ?? 0) * k, (r[3] ?? 0) * k], pct: (p) => [p[0] / VW * 100, p[1] / VH * 100] };
}
const COPY = new Set();
/** a dial: the app's own SVG export, as a link that opens it */
function dial(b, file, hash, o = {}) {
  COPY.add(file + ".svg");
  const svg = fs.readFileSync(path.join(IMG, file + ".svg"), "utf8"), [, , vw] = svg.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+)/).map(Number);
  const size = o.size ?? Math.min(b.w, b.h), x = b.x + (b.w - size) / 2, y = b.y + (o.top ? 0 : (b.h - size) / 2);
  return { html: `<a class="diallink" href="${APP}${hash}" style="left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(size)}mm;height:${f2(size)}mm"><img src="img/${file}.svg" alt="${inline(o.alt || "a dial")}"></a>`, x, y, size, k: size / vw };
}
const ground = (b, cls = "flat") => `<div class="ground ${cls}" style="${css(b)}"></div>`;
const union = (...rs) => { rs = rs.filter(Boolean); const x = Math.min(...rs.map((r) => r[0])), y = Math.min(...rs.map((r) => r[1])); return [x, y, Math.max(...rs.map((r) => r[0] + r[2])) - x, Math.max(...rs.map((r) => r[1] + r[3])) - y]; };
const mid = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];
const pad_r = (r, p) => [r[0] - p, r[1] - p, r[2] + 2 * p, r[3] + 2 * p];

// ── leaders (Okay, 14 Oct): a dot on the thing, lines at 90° only, never crossing, never through words; a label is a
// block of words. { from: [x, y], path: [[x, y]…], box: [x, y, w, h] an outline round the thing,
//   label: { text, side: "R" (label left of the line's end) | "L" | "B" (label above) | "T" (below), x, y, w, align } }
const LEADERS = [];
function leaders(list) {
  let svg = "", labels = "";
  for (const it of list) {
    if (it.box) { const [x, y, w, h] = it.box; svg += `<rect class="outline${it.light ? " light" : ""}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(Math.min(1.6, h / 2, w / 2))}"/>`; }
    const L = it.label, pts = [it.from, ...(it.path || []), [L.x, L.y]];
    for (let i = 1; i < pts.length; i++) check(Math.abs(pts[i][0] - pts[i - 1][0]) < 0.01 || Math.abs(pts[i][1] - pts[i - 1][1]) < 0.01, `p${CUR} leader "${L.text.slice(0, 30)}": a slanted segment`);
    svg += `<circle cx="${f2(it.from[0])}" cy="${f2(it.from[1])}" r=".42"/><polyline points="${pts.map((p) => p.map(f2).join(",")).join(" ")}"/>`;
    LEADERS.push({ page: CUR, pts, text: L.text, through: !!it.through, box: it.box && it.checkbox ? it.box : null });
    const w = L.w ?? 36, LH = 1.85, g = 1.0;
    const pos = L.side === "R" ? `left:${f2(L.x - g - w)}mm;top:${f2(L.y - LH)}mm`
      : L.side === "L" ? `left:${f2(L.x + g)}mm;top:${f2(L.y - LH)}mm`
      : L.side === "B" ? `left:${f2(L.align === "r" ? L.x - w + 0.1 : L.align === "c" ? L.x - w / 2 : L.x - 0.1)}mm;bottom:${f2(PAGE[1] - L.y + 0.9)}mm`
      : `left:${f2(L.align === "r" ? L.x - w + 0.1 : L.align === "c" ? L.x - w / 2 : L.x - 0.1)}mm;top:${f2(L.y + 0.9)}mm`;
    const al = L.side === "R" ? "r" : L.side === "L" ? "l" : (L.align ?? "l");
    labels += `<div class="nlabel ${al}" data-side="${L.side}" style="${pos};width:${f2(w)}mm">${inline(L.text)}</div>`;
  }
  return `<svg class="lines" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${svg}</svg>${labels}`;
}

// ── the phone: the same words and pictures, stacked ──
const FLOW = {};
const fl = (html) => (FLOW[CUR] = FLOW[CUR] || []).push(html);
const fl_head = (t) => fl(`<div class="ftab"><b>${PART} ${t.no}</b> ${PART_NAME[PART] || ""}</div><h1>${inline(t.title)}</h1><p class="lead">${lead_lines(t.lead)}</p>`);
const fl_block = (x) => fl(`<div class="pblock${x.watch ? " watch" : ""}">${x.watch ? TRI.replace('class="tri"', "") : ""}<p><b>${inline(x.label)}${/[?.!]$/.test(x.label) ? "" : "."}</b> ${inline(x.body)}</p></div>`);
/** a picture with its labels as a numbered list: pic has src and pct(); items: [{ at: [pt x, pt y], text }] */
function fl_fig(pic, items = [], cap = "", o = {}) {
  const dots = items.map((it, i) => { const [x, y] = pic.pct(it.at); return `<span class="dot" style="left:${f2(x)}%;top:${f2(y)}%">${i + 1}</span>`; }).join("");
  const img = o.href ? `<a href="${o.href}"><img src="${pic.src}" alt="${inline(cap)}"></a>` : `<img${o.card ? ' class="card"' : ""} src="${pic.src}" alt="${inline(cap || "")}">`;
  fl(`<figure><div class="fig${o.plain ? " plain" : ""}"><div class="in">${img}${dots}</div></div>${items.length ? `<ol class="labels">${items.map((it) => `<li>${inline(it.text)}</li>`).join("")}</ol>` : ""}${cap ? `<figcaption>${inline(cap)}</figcaption>` : ""}</figure>`);
}
const fl_table = (rows) => fl(`<table class="ptable"><thead><tr>${rows[0].map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);

const pages = [];

// ════════════════════════ 01 · How the tool thinks ════════════════════════
// The four models of the plan (here five ideas), on the pattern Okay settled for "Rings" (4.36.1 guide, page 06,
// r10): white; the assembled dial at left with the working blocks; at right the list and the dial taken apart, each
// row joined by a straight line to its ring lifted off as a layer (top row = top layer). Here the stack is the whole
// watch: cap, hands, the three rings, the plate with its window, the date disc — "exploded, not to scale".
{
  const t = page_text("01"), P = "A";
  let h = head(P, "01", t, { leadW: W(6) });
  fl_head(t);
  // the four kinds, top right: the drawer's own tiles
  { const K = R.window.kinds, tw = K[2] / 4, cw = (W(6) - 3 * GUT) / 4, k = UI;
    const KN = ["Ticks", "Markers", "Numerals", "Band"];
    const cells = [];
    KN.forEach((name, i) => {
      const x = X(7) + i * (cw + GUT), y = Y(1) + 0.6;
      const shot = name === "Markers" ? "rows-b" : "window", KK = shot === "window" ? K : R["rows-b"].kinds || K;      // the selected ring's own kind is drawn chosen: take each tile where it isn't
      const ic = card(shot, [KK[0] + i * tw + 1, KK[1] + 1, tw - 2, KK[3] - 2], x, y, k, { pad: 2, bg: "#FFFFFF", cls: "icon" });
      h += ic.html + `<div class="kcell" style="left:${f2(x)}mm;top:${f2(y + ic.h + 1.4)}mm;width:${f2(cw)}mm"><b>${name}.</b> ${inline(note(t, "kind " + name))}</div>`;
      cells.push(`<b>${name}.</b> ${inline(note(t, "kind " + name))}`);
    });
    T["01"].add("kinds");
  }
  // left: the dial together, then the working blocks
  const dl = dial({ x: X(1), y: Y(3), w: W(3), h: H(3) - 3 }, "dial-final", LINKS.final, { alt: "The First dial" });
  h += dl.html + caption(X(1), Y(5) + ROW - 3.4, W(3), note(t, "together"), "c");
  h += block(box(4, 3, 3, 3), text(t, "The panel edits what is selected"), { flow: "c" });
  h += block(box(1, 6, 3, 9), text(t, "A ring repeats one thing round the centre"), { flow: "a" }) + block(box(1, 6, 3, 9), text(t, "The higher ring wins"), { flow: "a" });
  h += block(box(7, 3, 5, 2), text(t, "Cap, hands, print, plate, disc"), { flow: "d", bottom: Y(4) + ROW });
  h += block(box(4, 6, 3, 9), text(t, "True size"), { flow: "b" })
    + block(box(4, 6, 3, 9), text(t, "Kept as you go"), { flow: "b" }) + block(box(4, 6, 3, 9), text(t, "Watch: kept"), { flow: "b", attach: true });

  // right: the stack
  const SVG = fs.readFileSync(path.join(IMG, "dial-final.svg"), "utf8");
  const shape = (id) => { const m = SVG.match(new RegExp(`<path id="${id}"[^>]*/>`)); check(m, `p01: the export has no "${id}"`); return m ? m[0].replace(/ id="[^"]*"/, "") : ""; };
  const DIAL_R = 17, D = 44, sc = D / (2 * DIAL_R), TILT = 0.4, he = D * TILT, pitch = 17.4;
  const cx = X(12) + COL - D / 2, top = Y(5) + 4, y0 = top + he / 2;
  const LAYERS = [
    { key: "cap", ids: ["cap"], sheet: false, edge: true },
    { key: "hands", ids: ["hour-hand", "minute-hand", "seconds-hand"], sheet: false, edge: true },
    { key: "Numerals", ids: ["numerals"], row: "window", rect: R.window.row_numerals, sheet: true },
    { key: "Markers", ids: ["markers"], row: "rows-b", rect: R["rows-b"].row_markers, sheet: true },
    { key: "Minute ticks", ids: ["minute-ticks"], row: "rows-b", rect: R["rows-b"].row_ticks, sheet: true },
    { key: "plate", ids: ["plate", "window-1-frame"], sheet: false },
    { key: "disc", ids: ["window-1-disc", "window-1-content"], sheet: false, ghost: true, edge: true },
  ];
  let layers = "", lines = "", rows = "";
  const at = (i) => `translate(${f2(cx)} ${f2(y0 + i * pitch)}) scale(${f2(sc)} ${f2(sc * TILT)})`;
  const plateFill = (SVG.match(/<path id="plate"[^>]*fill="([^"]+)"/) || [])[1] || "#141414";
  for (let i = LAYERS.length - 1; i >= 0; i--) {
    const L = LAYERS[i];
    let g = "";
    if (L.sheet) g += `<circle r="${DIAL_R}" fill="${plateFill}" fill-opacity=".9" stroke="#FFFFFF" stroke-opacity=".35" stroke-width=".12"/>`;
    if (L.ghost) g += `<circle r="${DIAL_R}" fill="none" stroke="#111" stroke-opacity=".35" stroke-width=".18" stroke-dasharray=".8 .8"/>`;
    g += L.ids.map(shape).join("");
    if (L.edge) g = `<g stroke="#111" stroke-width=".16" stroke-linejoin="round">${g}</g>`;
    layers += `<g transform="${at(i)}">${g}</g>`;
  }
  const kR = UI, RP = 3, rowW = (384 + 2 * RP) * kR, x0 = X(7);
  const phoneLayers = [];
  LAYERS.forEach((L, i) => {
    const y = y0 + i * pitch, lx = cx - D / 2 - 1.2;
    if (L.rect) {
      const c = card(L.shot || L.row, L.rect, x0, y - (L.rect[3] + 2 * RP) * kR / 2, kR, { pad: RP, bg: "#FFFFFF", cls: "row" });
      rows += c.html + `<div class="layernote" style="left:${f2(x0)}mm;top:${f2(c.y + c.h + 1.1)}mm;width:${f2(rowW)}mm">${inline(note(t, "layer " + L.key))}</div>`;
      lines += `<line x1="${f2(c.x + c.w + 1.4)}" y1="${f2(y)}" x2="${f2(lx)}" y2="${f2(y)}"/><circle cx="${f2(lx)}" cy="${f2(y)}" r=".42"/>`;
      LEADERS.push({ page: CUR, pts: [[c.x + c.w + 1.4, y], [lx, y]], text: L.key, through: false, box: null });
      phoneLayers.push({ img: c.src, note: note(t, "layer " + L.key), i });
    } else {
      const w = 62;
      rows += `<div class="layernote" style="left:${f2(x0)}mm;top:${f2(y - 1.85)}mm;width:${f2(w)}mm">${inline(note(t, "layer " + L.key))}</div>`;
      lines += `<line x1="${f2(x0 + w + 1.4)}" y1="${f2(y)}" x2="${f2(lx)}" y2="${f2(y)}"/><circle cx="${f2(lx)}" cy="${f2(y)}" r=".42"/>`;
      LEADERS.push({ page: CUR, pts: [[x0 + w + 1.4, y], [lx, y]], text: L.key, through: false, box: null });
      phoneLayers.push({ note: note(t, "layer " + L.key), i });
    }
  });
  h += `<svg class="stack" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${layers}</svg>` + rows + `<svg class="lines" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${lines}</svg>`;
  h += caption(x0, Y(5) - 0.6, W(6), note(t, "exploded"));
  pages.push(page(P, h));

  // phone
  fl_fig({ src: "img/dial-final.svg", pct: () => [0, 0] }, [], note(t, "together"), { plain: true, href: APP + LINKS.final });
  fl_block(text(t, "Cap, hands, print, plate, disc"));
  fl(`<figure><div class="fig plain">${phoneLayers.map((L) => {
    const one = LAYERS[L.i];
    const svg = `<svg viewBox="${-DIAL_R - 1} ${-(DIAL_R + 1) * TILT} ${2 * DIAL_R + 2} ${(2 * DIAL_R + 2) * TILT}"><g transform="scale(1 ${TILT})">${one.sheet ? `<circle r="${DIAL_R}" fill="${plateFill}" fill-opacity=".9"/>` : ""}${one.ghost ? `<circle r="${DIAL_R}" fill="none" stroke="#111" stroke-opacity=".35" stroke-width=".3" stroke-dasharray="1 1"/>` : ""}${one.edge ? `<g stroke="#111" stroke-width=".25">` : "<g>"}${one.ids.map(shape).join("")}</g></g></svg>`;
    return `<div class="layer"><div>${L.img ? `<img class="card" src="${L.img}" alt="">` : ""}<div class="note">${inline(L.note)}</div></div>${svg}</div>`;
  }).join("")}</div><figcaption>${inline(note(t, "exploded"))}</figcaption></figure>`);
  for (const k of ["The panel edits what is selected", "A ring repeats one thing round the centre", "The higher ring wins", "True size", "Kept as you go", "Watch: kept"]) fl_block(text(t, k));
  fl(`<div class="pblock"><p>${["Ticks", "Markers", "Numerals", "Band"].map((n) => `<b>${n}.</b> ${inline(note(t, "kind " + n))}`).join("<br>")}</p></div>`);
}

// ════════════════════════ 02 · The screen ════════════════════════
// One picture, every part named (the 4.36.1 guide's page 03, Okay's round 4): lines at right angles, never crossing,
// never across the interface; each leaves its part straight sideways, up or down; an outline stands clear of what it
// rings. The labels are this page's text; the three blocks are smaller.
{
  const t = page_text("02"), P = "A";
  let h = head(P, "02", t);
  fl_head(t);
  const s = 0.13, img = whole("window", 78, Y(4) + 16, s);
  h += img.html;
  const Wr = R.window, L = [], FL = [];
  const bx = (r, p = 4) => img.at(pad_r(r, p));
  // left: from each part's left edge straight across
  const lx = img.x - 5, lw = lx - 1 - X(1);
  const left = (r, key, ypt, p = 4) => { const b = bx(r, p), y = img.y + ypt * s; L.push({ box: b, from: [b[0], y], label: { text: note(t, key), side: "R", x: lx, y, w: lw } }); FL.push({ at: [r[0], ypt], text: note(t, key) }); };
  left(union(Wr.logo, Wr.help), "title", 32, 3);
  left([Wr.tabs[0], Wr.tabs[1] + 4, Wr.tabs[2], Wr.tabs[3] - 6], "tabs", 108, 3);
  left(Wr.rows, "rows", 182, 3);
  left(Wr.drawer, "drawer", 299, 2);
  const eye = [Wr.shape_eye[0] + 1, Wr.shape_eye[1] + 11, 18, 18];
  left(eye, "fold", eye[1] + 9, 3);
  // above: gallery and undo on the lower tier, the unit on the upper; Guides out to the right
  const ty1 = img.y - 3.6, ty2 = ty1 - 10;
  const up = (r, key, align, w, ty, p = 4) => { const b = bx(r, p), x = b[0] + b[2] / 2; L.push({ box: b, from: [x, b[1]], label: { text: note(t, key), side: "B", x, y: ty, w, align } }); FL.push({ at: [r[0] + r[2] / 2, r[1]], text: note(t, key) }); };
  up(Wr.gallery, "gallery", "r", 40, ty1);
  up(Wr.unit, "unit", "l", 80, ty2);
  up(Wr.undo, "undo", "l", 44, ty1, 3);
  // right: Guides straight out; Backdrop and Shadows straight out, under the dial; the two switches out from their foot
  const rx = img.x + img.w + 4.5, rw = PAGE[0] - SIDE - rx - 1;
  { const r = Wr.guides, b = bx(r, 3), y = img.y + (r[1] + r[3] / 2) * s; L.push({ box: b, from: [b[0] + b[2], y], label: { text: note(t, "guides"), side: "L", x: rx, y, w: rw } }); FL.push({ at: [r[0] + r[2], r[1] + r[3] / 2], text: note(t, "guides") }); }
  { const r = union(Wr.backdrop, Wr.shadows), b = bx(r, 3), y = img.y + 692 * s, xe = img.x + img.w + 2, y2 = img.y + 640 * s; L.push({ box: b, from: [b[0] + b[2], y], path: [[xe, y], [xe, y2]], label: { text: note(t, "look"), side: "L", x: rx, y: y2, w: rw } }); FL.push({ at: [r[0] + r[2], 692], text: note(t, "look") }); }
  { const r = union(Wr.alone, Wr.showcase), b = bx(r, 2.5), x = b[0] + b[2] / 2 + 3, y = img.y + 752.5 * s; L.push({ box: b, from: [x, b[1] + b[3]], path: [[x, y]], label: { text: note(t, "alone"), side: "L", x: rx, y, w: rw } }); FL.push({ at: [r[0] + r[2] / 2, r[1] + r[3]], text: note(t, "alone") }); }
  // below: four, straight down from outlines on the dark bar
  const dy = img.y + img.h + 4.2;
  const down = (r, key, align, w, p = 3, fx) => { const b = bx(r, p), x = fx !== undefined ? img.x + fx * s : b[0] + Math.min(b[2] / 2, 7); L.push({ box: b, light: true, from: [x, b[1] + b[3]], label: { text: note(t, key), side: "T", x, y: dy, w, align } }); FL.push({ at: [r[0] + r[2] / 2, r[1] + r[3]], text: note(t, key) }); };
  down(union(Wr.play, Wr.speed), "play", "r", 42, 3, Wr.play[0] + Wr.play[2] / 2);
  down(union(Wr.time, Wr.ampm, Wr.now), "time", "l", 36);
  down(union(Wr.day, Wr.pose), "day", "l", 42, 2, 600);
  down(union(Wr.zoom, Wr.fit), "zoom", "l", 34, 3, Wr.zoom[0] + Wr.zoom[2] / 2);
  h += leaders(L);
  // the three small blocks, under the labels at left
  const sb = { x: X(1), y: Y(10), w: img.x - 7 - X(1), h: H(3), bottom: Y(12) + ROW };
  h += block(sb, text(t, "Typing numbers"), { small: true, flow: "s", bottom: sb.bottom }) + block(sb, text(t, "Gallery and mm"), { small: true, flow: "s", bottom: sb.bottom });
  pages.push(page(P, h));
  fl_fig(img, FL, "", {});
  for (const k of ["Typing numbers", "Gallery and mm"]) fl_block(text(t, k));
}

// ════════════════════════ 03 · A ring, close up ════════════════════════
// Large first, then small (canon §3): the selected row and its drawer twice their size, every part named; at right
// the radius button closed and open (two states of one control, same size); under them the table of the round
// buttons, the Watch, and the two sheets a ring opens: its colour, and the font sheet.
{
  const t = page_text("03"), P = "A";
  let h = head(P, "03", t);
  fl_head(t);
  const Wr = R.window, k2 = 2 * UI;
  const rect = union(Wr.row_markers, Wr.drawer), pad = 6;
  const big = box(1, 3, 8, 6);
  h += ground(big);
  const cw = (rect[2] + 2 * pad) * k2;
  const c = card("window", rect, big.x + (big.w - cw) / 2, big.y + 20.5, k2, { pad, bg: "#FCFCFA" });
  h += c.html;
  const L = [], FL = [];
  const tierA = c.y - 4, tierA2 = tierA - 9.6, tierB = c.y + c.h + 4;
  const above = (r, key, align, w, p = 1.5, fx) => { const b = c.at(pad_r(r, p)), x = fx ?? b[0] + b[2] / 2; L.push({ box: b, from: [x, b[1]], label: { text: note(t, key), side: "B", x, y: tierA, w, align } }); FL.push({ at: [r[0] + r[2] / 2, r[1]], text: note(t, key) }); };
  const below = (r, key, align, w, p = 1.5, fx) => { const b = c.at(pad_r(r, p)), x = fx ?? b[0] + b[2] / 2; L.push({ box: b, from: [x, b[1] + b[3]], label: { text: note(t, key), side: "T", x, y: tierB, w, align } }); FL.push({ at: [r[0] + r[2] / 2, r[1] + r[3]], text: note(t, key) }); };
  const eye = [Wr.row_eye[0] + 8, Wr.row_eye[1] + 7, 19, 18], grip = [Wr.row_grip[0] + 5, Wr.row_grip[1] + 8, 12, 16];
  above(eye, "eye", "r", 20);
  { const b = c.at(pad_r(grip, 1.5)), x = b[0] + b[2] / 2; L.push({ box: b, from: [x, b[1]], label: { text: note(t, "grip"), side: "B", x, y: tierA2, w: 34, align: "l" } }); FL.push({ at: [grip[0] + grip[2] / 2, grip[1]], text: note(t, "grip") }); }
  above(union(Wr.row_name, Wr.row_rename), "name", "l", 32);
  above(Wr.row_count, "count", "l", 26);
  above([306, Wr.row_values[1] - 1, Wr.row_values[0] + Wr.row_values[2] - 306, Wr.row_values[3] + 2], "values", "l", 30);
  below(Wr.kinds, "kinds", "r", 44);
  below(Wr.drawer_chip, "chip", "r", 30);
  below(union(Wr.size_button, Wr.radius_button), "buttons", "l", 30, 1.5);
  for (const l of L) l.through = true;      // each starts inside the crop and leaves it across the row's own frame: the frame is the crop's, not a thing it passes
  h += leaders(L);
  h += caption(big.x + big.w - 3 - 92, big.y + 2.2, 92, note(t, "closeup"), "r");

  // right: the radius button, closed and open
  const pr = [296, 272, 184, 154];
  const rb = box(9, 3, 4, 4);
  h += ground(rb);
  const cw2 = (pr[2] + 8) * UI, gap = 4, x1 = rb.x + (rb.w - 2 * cw2 - gap) / 2;
  const a = card("window", pr, x1, rb.y + 4, UI, { pad: 4 }), b2 = card("pop", pr, x1 + cw2 + gap, rb.y + 4, UI, { pad: 4 });
  h += a.html + b2.html + caption(rb.x, a.y + a.h + 1.6, rb.w, note(t, "pop"), "c");
  h += block(box(9, 7, 4, 2), text(t, "The round buttons"), { flow: "r" });
  // under: the table and the Watch; the colour pop-out; the font sheet
  const tb = t.tables["buttons"]; check(tb, "p03: no table");
  h += `<div class="block" style="${css(box(1, 9, 4, 4))}"></div>` + table({ x: X(1), y: Y(9) + 1.6, w: W(4) }, tb, { cols: [22, 39, 39] });
  h += block(box(1, 12, 4, 2), text(t, "Watch: anchor"), { small: true });
  const cl = R.colour.close, cr = [cl[0] + cl[2] + 13 - 445, cl[1] - 3, 445, 104];
  const cb = box(5, 9, 5, 3);
  h += ground(cb);
  const kc = Math.min(UI, (cb.w - 6) / (cr[2] + 8));
  const cc = card("colour", cr, cb.x + (cb.w - (cr[2] + 8) * kc) / 2, cb.y + (cb.h - (cr[3] + 8) * kc) / 2, kc, { pad: 4, cls: "cut", fade: 70 });
  h += cc.html;
  h += block(box(5, 12, 5, 3), text(t, "Colours"), { flow: "c" });
  const fr = [R.font.sheet[0] + 26, R.font.sheet[1] + 61, 262, 160];
  const fb = box(10, 9, 3, 3);
  h += ground(fb);
  const kf = Math.min(UI, (fb.w - 6) / (fr[2] + 8));
  const fc = card("font", fr, fb.x + (fb.w - (fr[2] + 8) * kf) / 2, fb.y + (fb.h - (fr[3] + 8) * kf) / 2, kf, { pad: 4, cls: "cut", fade: 72 });
  h += fc.html;
  h += block(box(10, 12, 3, 3), text(t, "Fonts"), { flow: "f" });
  check(Math.abs(kc - UI) < 1e-9, `p03: the colour pop-out is at ${kc.toFixed(3)} mm a point, not the stated ${UI}`);
  check(Math.abs(kf - UI) < 1e-9, `p03: the font sheet is at ${kf.toFixed(3)} mm a point, not the stated ${UI}`);
  pages.push(page(P, h));

  fl_fig(c, FL, note(t, "closeup"), { card: true });
  fl(`<figure><div class="fig"><div class="in" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><img class="card" src="${a.src}" alt=""><img class="card" src="${b2.src}" alt=""></div></div><figcaption>${inline(note(t, "pop"))}</figcaption></figure>`);
  fl_block(text(t, "The round buttons"));
  fl_table(tb);
  fl_block(text(t, "Watch: anchor"));
  fl_fig(cc, [], note(t, "colour"), { card: true }); fl_block(text(t, "Colours"));
  fl_fig(fc, [], note(t, "font"), { card: true }); fl_block(text(t, "Fonts"));
  T["03"].add("n:colour"); T["03"].add("n:font");
}

// ════════════════════════ 04 · The screen on a phone ════════════════════════
// The phone where it differs (plan §2): the bar on top, the drawer, cut names. One picture, its parts named at
// both sides; the font sheet's way out under it.
{
  const t = page_text("04"), P = "A";
  let h = head(P, "04", t);
  fl_head(t);
  const k = 0.17, Pr = R.phone, [PW, PH] = SH.phone;
  const img = { src: "img/phone.png", x: X(6) + (W(2) - PW * k) / 2, y: Y(3) + 2, w: PW * k, h: PH * k };
  img.at = (r) => [img.x + r[0] * k, img.y + r[1] * k, (r[2] ?? 0) * k, (r[3] ?? 0) * k];
  img.pct = (p) => [p[0] / PW * 100, p[1] / PH * 100];
  h += `<div class="shot framed" style="left:${f2(img.x)}mm;top:${f2(img.y)}mm;width:${f2(img.w)}mm;height:${f2(img.h)}mm"><img src="img/phone.png"></div>`;
  const L = [], FL = [];
  const lx = img.x - 6, lw = 70, rx = img.x + img.w + 6, rw = 70;
  const left = (r, key, ypt, p = 3) => { const b = img.at(pad_r(r, p)), y = img.y + ypt * k; L.push({ box: b, from: [b[0], y], label: { text: note(t, key), side: "R", x: lx, y, w: lw } }); FL.push({ at: [r[0], ypt], text: note(t, key) }); };
  const right = (r, key, ypt, p = 3) => { const b = img.at(pad_r(r, p)), y = img.y + ypt * k; L.push({ box: b, from: [b[0] + b[2], y], label: { text: note(t, key), side: "L", x: rx, y, w: rw } }); FL.push({ at: [r[0] + r[2], ypt], text: note(t, key) }); };
  left(Pr.play, "bar", Pr.play[1] + Pr.play[3] / 2, 3);
  right(union(Pr.showcase, Pr.alone), "switches", Pr.alone[1] + Pr.alone[3] / 2, 3);
  left(Pr.grip, "grip", Pr.grip[1] + Pr.grip[3] / 2, 0);
  right(union(Pr.help, Pr.gallery, Pr.unit), "title", Pr.unit[1] + Pr.unit[3] / 2, 3);
  left(Pr.rows, "rows", Pr.rows[1] + 120, 2);
  for (const l of L) if (l.label.side === "R" ? l.from[0] > img.x : l.from[0] < img.x + img.w) l.through = true;
  h += leaders(L);
  h += caption(img.x - 20, img.y + img.h + 1.6, img.w + 40, "A phone held upright, 390 points wide, at 0.17 mm a point.", "c");
  h += block({ x: X(9), y: Y(11), w: W(4), h: H(4) }, text(t, "The font sheet on a phone"), { flow: "f" });
  pages.push(page(P, h));
  fl_fig(img, FL, "");
  fl_block(text(t, "The font sheet on a phone"));
}

// ════════════════════════ 05–06 · Your first dial ════════════════════════
// Ten steps, one change each (canon §5: "steps are pictures in a row"). Every picture is the app's own export of the
// dial after that step, all at one scale (the dial 33 mm across, about its true size), and a link that opens it.
// Page 06 ends with what the steps make: the dial large, and the file at true size.
{
  const t = page_text("05"), P = "B";
  const K = 33 / 34;                                   // mm on the page per mm of dial
  const stepbox = (c, r, s, hash) => {
    const pic = box(c, r, 2, 3);
    const svg = fs.readFileSync(path.join(IMG, `step-${s.n}.svg`), "utf8"), vw = +svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+)/)[1];
    const d = dial(pic, `step-${s.n}`, hash, { size: vw * K, alt: `The dial after step ${s.n}` });
    return ground(pic, "plain") + d.html + block(box(c + 2, r, 4, 3), { label: `${s.n} · ${s.title}`, body: s.text }, { flow: "s" + c + r, bottom: Y(r + 2) + ROW });
  };
  const S = Object.fromEntries(t.steps.map((s) => [s.n, s]));
  const link = (n) => FIRST.steps.find((x) => x.n === n).link;
  check(t.steps.length === 10, `p05: ${t.steps.length} steps, not 10`);
  let h = head(P, "05", t);
  fl_head(t);
  [[1, 1, 3], [2, 7, 3], [3, 1, 6], [4, 7, 6], [5, 1, 9], [6, 7, 9], [7, 1, 12], [8, 7, 12]].forEach(([n, c, r]) => { h += stepbox(c, r, S[n], link(n)); });
  (T["05"] = T["05"] || new Set()).add("steps");
  pages.push(page(P, h));
  const t6 = page_text("06");
  let hh = head(P, "06", t6);
  [[9, 1, 3], [10, 1, 6]].forEach(([n, c, r]) => { hh += stepbox(c, r, S[n], link(n)); });
  // the file at true size: the 40 mm page, the 34 mm dial on it
  { const fb = box(1, 9, 6, 6);
    hh += ground(fb, "plain");
    const svg = fs.readFileSync(path.join(IMG, "step-10.svg"), "utf8"), vw = +svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+)/)[1];
    const x = fb.x + 30, y = fb.y + (fb.h - vw) / 2;
    COPY.add("step-10.svg");
    hh += `<a class="diallink" href="${APP}${link(10)}" style="left:${f2(x)}mm;top:${f2(y)}mm;width:${f2(vw)}mm;height:${f2(vw)}mm;background:#FFFFFF;outline:.2mm solid var(--line)"><img src="img/step-10.svg" alt="The PDF at true size"></a>`;
    const dr = 17, cx = x + vw / 2, cy = y + vw / 2;
    hh += leaders([
      { from: [x + vw, y + 6], label: { text: note(t6, "page40"), side: "L", x: x + vw + 8, y: y + 6, w: 58 } },
      { from: [cx + dr * Math.cos(Math.PI / 5), cy + dr * Math.sin(Math.PI / 5)], path: [[x + vw + 4, cy + dr * Math.sin(Math.PI / 5)]], label: { text: note(t6, "dial34"), side: "L", x: x + vw + 8, y: cy + dr * Math.sin(Math.PI / 5), w: 58 } },
    ].map((l) => ({ ...l, through: true })));
    hh += caption(fb.x + 3, fb.y + fb.h - 4.6, fb.w - 6, note(t6, "truesize"));
  }
  // what the steps make, large
  { const gb = box(7, 3, 6, 12);
    hh += ground(gb, "plain") + dial({ ...gb, h: gb.h - 8 }, "step-10", link(10), { size: gb.w - 22, alt: "The First dial" }).html + caption(gb.x, gb.y + gb.h - 5, gb.w, note(t, "whole"), "c"); }
  pages.push(page(P, hh));
  // phone: one list
  fl(`<div class="steps">${t.steps.map((s) => `<div class="s"><a href="${APP}${link(s.n)}"><img src="img/step-${s.n}.svg" alt="The dial after step ${s.n}"></a><p><b>${s.n} · ${inline(s.title)}.</b> ${inline(s.text)}</p></div>`).join("")}</div>`);
  for (const s of t.steps) COPY.add(`step-${s.n}.svg`);
}

// ════════════════════════ 07 · Find it ════════════════════════
{
  const t = page_text("07"), P = "C";
  let h = head(P, "07", t);
  fl_head(t);
  const cols = [
    ["I want to start fresh", "Where do colours live?", "Why did the 3 disappear?", "Why isn't my window showing?"],
    ["Window at 6, or Window 3?", "I asked for four numerals and got 12, 1, 2, 3", "Skip where, or Every?", "The panel says \"not loaded\""],
    ["My time isn't 10:10", "Where did my dial go?", "How do I leave the showcase?", "A number field takes sums"],
  ];
  cols.forEach((list, i) => { for (const k of list) h += block(box(1 + 3 * i, 3, 3, 12), text(t, k), { flow: "q" + i }); });
  const sg = t.tables["signs"];
  h += `<div class="block bare" style="${css(box(10, 3, 3, 12))}"><p><b>The signs without words.</b></p></div>` + table({ x: X(10), y: Y(3) + 6, w: W(3) }, sg, { cols: [30, 30, 40] });
  pages.push(page(P, h));
  for (const list of cols) for (const k of list) fl_block(text(t, k));
  fl(`<div class="pblock"><p><b>The signs without words.</b></p></div>`); fl_table(sg);
}

// ════════════════════════ 08 · For the maker ════════════════════════
{
  const t = page_text("08"), P = "D";
  let h = head(P, "08", t);
  fl_head(t);
  const m1 = box(1, 3, 3, 4), m2 = box(4, 3, 3, 4);
  h += ground(m1, "plain") + dial({ ...m1, h: m1.h - 5 }, "dial-mask", LINKS.final, { size: m1.h - 9, alt: "The print mask" }).html.replace('style="', 'style="background:#FFFFFF;outline:.2mm solid var(--line);') + caption(m1.x, m1.y + m1.h - 4.6, m1.w, note(t, "mask"), "c");
  h += ground(m2, "plain") + dial({ ...m2, h: m2.h - 5 }, "dial-nohands", LINKS.final, { size: m2.h - 9, alt: "The colour file, hands hidden" }).html + caption(m2.x, m2.y + m2.h - 4.6, m2.w, note(t, "colourfile"), "c");
  const A = ["What a file holds", "Size"], B2 = ["The print mask", "Mirrored, for toner transfer only", "Watch: band", "Watch: cut"], C = ["One film per ink", "Colour", "Text", "The thinnest line", "Process advice"];
  for (const k of A) h += block(box(1, 7, 3, 8), text(t, k), { flow: "a", attach: k.startsWith("Watch") });
  for (const k of B2) h += block(box(4, 7, 3, 8), text(t, k), { flow: "b", attach: k.startsWith("Watch") });
  C.slice(0, 2).forEach((k) => { h += block(box(7, 3, 3, 12), text(t, k), { flow: "c" }); });
  C.slice(2).forEach((k) => { h += block(box(10, 3, 3, 12), text(t, k), { flow: "d" }); });
  pages.push(page(P, h));
  fl_fig({ src: "img/dial-mask.svg", pct: () => [0, 0] }, [], note(t, "mask"), { plain: true });
  fl_fig({ src: "img/dial-nohands.svg", pct: () => [0, 0] }, [], note(t, "colourfile"), { plain: true });
  for (const k of [...A, ...B2, ...C]) fl_block(text(t, k));
}

// ════════════════════════ out ════════════════════════
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, "img"), { recursive: true }); fs.mkdirSync(REV, { recursive: true });
fs.cpSync(path.join(HERE, "fonts"), path.join(OUT, "fonts"), { recursive: true });
fs.copyFileSync(path.join(HERE, "style.css"), path.join(OUT, "style.css"));
fs.writeFileSync(path.join(REV, "jobs.json"), JSON.stringify(JOBS));
execFileSync("python3", [path.join(HERE, "cards.py"), path.join(REV, "jobs.json")], { stdio: "inherit" });
for (const f of COPY) fs.copyFileSync(path.join(IMG, f), path.join(OUT, "img", f));
for (const f of ["window.png", "phone.png"]) fs.copyFileSync(path.join(IMG, f), path.join(OUT, "img", f));
const flows = Object.entries(FLOW).map(([no, list]) => { const sec = pages.find((p) => p.includes(`data-no="${no}"`)); const sig = sec.match(/style="(--sig[^"]*)"/)[1]; return `<section class="flow" id="f${no}" style="${sig}">${list.join("\n")}</section>`; }).join("\n");
const ZOOM = `<script>if(!location.hash.includes("build")){const z=()=>document.documentElement.style.setProperty("--z",Math.min((innerWidth-24)/1122.5,1.6).toFixed(4));z();addEventListener("resize",z);}</script>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dial Tool guide</title><link rel="stylesheet" href="style.css"></head><body>
<div class="sheets">${pages.join("\n")}</div>
<div class="flows">${flows}<p class="foot">Dial Tool guide, edition 1 · ${VERSION} · ${DATE}. Every “do this and that happens” sentence was checked against this version by a script. Found something wrong? It is a fault: tell Okay.</p></div>
${ZOOM}</body></html>`;
fs.writeFileSync(path.join(OUT, "index.html"), html);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const pg = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
await pg.goto(pathToFileURL(path.join(OUT, "index.html")).href + "#build");
await pg.evaluate(() => document.fonts.ready);
check(await pg.evaluate(() => document.fonts.check("12px Inter")), "Inter did not load");
// text in a column flows: each block as tall as its words, snapped to whole grid rows, the next a row gap under it;
// a block and the Watch note hung under it fill boxes as one (Okay, 19:18)
const flowed = await pg.evaluate(([ROW, RGAP]) => {
  const MM = 96 / 25.4, out = [];
  for (const sec of document.querySelectorAll("section.page")) {
    const groups = {};
    for (const b of sec.querySelectorAll("[data-flow]")) (groups[b.dataset.flow] = groups[b.dataset.flow] || []).push(b);
    for (const list of Object.values(groups)) {
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
          if (y + n * ROW + (n - 1) * RGAP > parseFloat(b.dataset.bottom) + 0.5) out.push(`p${sec.dataset.no} "${b.textContent.trim().slice(0, 40)}"`);
          y += n * (ROW + RGAP);
        });
        i += g.length;
      }
    }
  }
  return out;
}, [ROW, RGAP]);
for (const o of flowed) check(false, `a column of words runs past its end: ${o}…`);
const over = await pg.evaluate(() => [...document.querySelectorAll("section.page .block")].filter((b) => b.scrollHeight > b.clientHeight + 1).map((b) => `p${b.closest("section").dataset.no} "${b.textContent.trim().slice(0, 40)}"`));
for (const o of over) check(false, `words overflow their block: ${o}…`);
// blocks, not ragged ends (Okay, 17:58): the last line at least 40 % of the widest; no line of one or two short words
const ragged = await pg.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("section.page :is(.block p, .lead, .nlabel, .cap, .layernote, .kcell)")) {
    const lines = new Map(), walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) for (const m of n.textContent.matchAll(/\S+/g)) {
      const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const q = r.getClientRects()[0]; if (!q) continue;
      const k = Math.round(q.top / 4), l = lines.get(k) || { words: [], l: 1e9, r: -1e9 };
      l.words.push(m[0]); l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); lines.set(k, l);
    }
    const ls = [...lines.values()]; if (ls.length < 2) continue;
    const wmax = Math.max(...ls.map((l) => l.r - l.l)), last = ls[ls.length - 1], what = `p${el.closest("section").dataset.no} "${el.textContent.trim().slice(0, 34)}`;
    if ((last.r - last.l) < 0.4 * wmax && !el.classList.contains("lead")) out.push(`short last line "${last.words.join(" ")}" in ${what}…"`);
    if (el.getBoundingClientRect().width > 20 * 96 / 25.4) ls.forEach((l, i) => { if (l.words.length <= 2 && l.words.join(" ").length < 14 && !el.classList.contains("lead")) out.push(`line ${i + 1} only "${l.words.join(" ")}" in ${what}…"`); });
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
    const labels = [...sec.querySelectorAll(".nlabel, .layernote")].map((e) => ({ e, b: box(e), t: e.textContent.slice(0, 26) }));
    const words = [...sec.querySelectorAll(".block p, .cap, .lead, h1, .kcell, table")].map((e) => ({ b: box(e), t: e.textContent.slice(0, 26) }));
    const pics = [...sec.querySelectorAll(".card, .shot, a.diallink")].map((e) => ({ b: box(e), t: e.className || e.tagName }));
    const ov = (a, b, g = 0) => a[0] < b[2] + g && b[0] < a[2] + g && a[1] < b[3] + g && b[1] < a[3] + g;
    labels.forEach((a, i) => {
      labels.slice(i + 1).forEach((b) => { if (ov(a.b, b.b, 1.5)) out.push(`p${sec.dataset.no} labels too close: "${a.t}" · "${b.t}"`); });
      words.forEach((b) => { if (ov(a.b, b.b, 1.2)) out.push(`p${sec.dataset.no} label "${a.t}" on words "${b.t}"`); });
      pics.forEach((b) => { if (ov(a.b, b.b, 0.8)) out.push(`p${sec.dataset.no} label "${a.t}" on a picture (${b.t})`); });
    });
    for (const e of sec.querySelectorAll(":scope > *")) { const b = box(e); if (b[2] > 297 - 11.9 || b[0] < 11.9 - 0.1 || b[3] > 210 - 4) if (!e.matches("svg, .tabline")) out.push(`p${sec.dataset.no} past the margin: ${e.className} "${e.textContent.trim().slice(0, 24)}" (${b.map((v) => v.toFixed(1)).join(", ")})`); }
  }
  return out;
});
for (const o of clash) check(false, o);
// lines: no two cross, none runs through a label other than its own
{
  const segs = LEADERS.flatMap((L, li) => L.pts.slice(1).map((p, i) => ({ li, page: L.page, a: L.pts[i], b: p })));
  const cross = (s, t) => {
    const h1 = Math.abs(s.a[1] - s.b[1]) < 0.01, h2 = Math.abs(t.a[1] - t.b[1]) < 0.01;
    if (h1 === h2) return h1 ? Math.abs(s.a[1] - t.a[1]) < 0.6 && Math.min(Math.max(s.a[0], s.b[0]), Math.max(t.a[0], t.b[0])) > Math.max(Math.min(s.a[0], s.b[0]), Math.min(t.a[0], t.b[0]))
      : Math.abs(s.a[0] - t.a[0]) < 0.6 && Math.min(Math.max(s.a[1], s.b[1]), Math.max(t.a[1], t.b[1])) > Math.max(Math.min(s.a[1], s.b[1]), Math.min(t.a[1], t.b[1]));
    const [hs, vs] = h1 ? [s, t] : [t, s], y = hs.a[1], x = vs.a[0];
    return x > Math.min(hs.a[0], hs.b[0]) + 0.05 && x < Math.max(hs.a[0], hs.b[0]) - 0.05 && y > Math.min(vs.a[1], vs.b[1]) + 0.05 && y < Math.max(vs.a[1], vs.b[1]) - 0.05;
  };
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++)
    if (segs[i].li !== segs[j].li && segs[i].page === segs[j].page && cross(segs[i], segs[j])) check(false, `p${segs[i].page} lines cross: "${LEADERS[segs[i].li].text.slice(0, 24)}" × "${LEADERS[segs[j].li].text.slice(0, 24)}"`);
  const lb = await pg.evaluate(() => { const MM = 96 / 25.4; return [...document.querySelectorAll("section.page")].map((sec) => { const P = sec.getBoundingClientRect();
    return [...sec.querySelectorAll(".nlabel, .layernote, .block p, .cap")].map((e) => { const r = e.getBoundingClientRect(); return { no: sec.dataset.no, t: e.textContent, b: [(r.left - P.left) / MM, (r.top - P.top) / MM, (r.right - P.left) / MM, (r.bottom - P.top) / MM] }; }); }).flat(); });
  const norm = (s) => s.replace(/'/g, "’").replace(/\*/g, "");
  for (const s of segs) for (const l of lb) {
    if (l.no !== s.page || norm(LEADERS[s.li].text) === l.t) continue;
    const x1 = Math.min(s.a[0], s.b[0]), x2 = Math.max(s.a[0], s.b[0]), y1 = Math.min(s.a[1], s.b[1]), y2 = Math.max(s.a[1], s.b[1]);
    if (x1 < l.b[2] + 0.5 && x2 > l.b[0] - 0.5 && y1 < l.b[3] + 0.5 && y2 > l.b[1] - 0.5) check(false, `p${s.page} line "${LEADERS[s.li].text.slice(0, 24)}" runs through "${l.t.slice(0, 24)}"`);
  }
}
// interface pictures at the stated scale, measured as set: mm on the page per point on the iPad, per page
const scales = await pg.evaluate(() => { const MM = 96 / 25.4, o = {};
  for (const sec of document.querySelectorAll("section.page")) for (const c of sec.querySelectorAll("img.card[data-pt]")) (o[sec.dataset.no] = o[sec.dataset.no] || []).push(+(c.getBoundingClientRect().width / MM / +c.dataset.pt).toFixed(3));
  return o; });
for (const [no, ks] of Object.entries(scales)) console.log(`scale  p${no}: ${ks.length} interface crops at ${[...new Set(ks)].map((k) => k === 0.2 ? "0.2 mm a point (stated)" : k === 0.4 ? "0.4 (× 2, said in its caption)" : k).join(", ")}`);
for (const [no, ks] of Object.entries(scales)) for (const k of ks) check(k === 0.2 || k === 0.4, `p${no}: a crop at ${k} mm a point, neither the stated 0.2 nor × 2`);
// keep the page as set (the flow moved blocks), then the PDF and pictures to look at
const set = await pg.evaluate(() => document.documentElement.outerHTML);
fs.writeFileSync(path.join(OUT, "index.html"), "<!doctype html>" + set.replace(/<html[^>]*>/, '<html lang="en">'));
await pg.pdf({ path: path.join(OUT, "guide.pdf"), width: "297mm", height: "210mm", printBackground: true, preferCSSPageSize: true });
const LAYOUT = await extract(pg);         // the pages' parts as set, for the InDesign package (made below, once the PDF exists)
const nos = await pg.$$eval("section.page", (e) => e.map((x) => x.dataset.no));
for (const [i, no] of nos.entries()) await (await pg.$$("section.page"))[i].screenshot({ path: path.join(REV, `page-${no}.png`) });
await pg.addStyleTag({ content: ".lines, .nlabel, .layernote, .cap { visibility: hidden !important; }" });
for (const [i, no] of nos.entries()) await (await pg.$$("section.page"))[i].screenshot({ path: path.join(REV, `page-${no}-bare.png`) });
const frames = await pg.evaluate(() => { const MM = 96 / 25.4, o = {}; for (const sec of document.querySelectorAll("section.page")) { const P = sec.getBoundingClientRect();
  o[sec.dataset.no] = [...sec.querySelectorAll(".shot, .card, .ground, a.diallink")].map((e) => { const r = e.getBoundingClientRect(); return [(r.left - P.left) / MM, (r.top - P.top) / MM, (r.right - P.left) / MM, (r.bottom - P.top) / MM]; }); } return o; });
fs.writeFileSync(path.join(REV, "leaders.json"), JSON.stringify({ leaders: LEADERS.filter((L) => nos.includes(L.page)), frames }));
// the phone
const ph = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ph.goto(pathToFileURL(path.join(OUT, "index.html")).href);
await ph.evaluate(() => document.fonts.ready); await ph.waitForTimeout(300);
const wide = await ph.evaluate(() => document.documentElement.scrollWidth);
check(wide <= 390, `the phone page scrolls sideways (${wide} px wide)`);
for (const no of nos) { const el = await ph.$(`#f${no}`); if (el) await el.screenshot({ path: path.join(REV, `phone-${no}.png`) }); }
const pkg = await make_package(browser, LAYOUT, { HERE, OUT, IMG, VERSION });
console.log(`InDesign package → ${path.relative(ROOT, pkg)} (+ .zip)`);
await browser.close();
// words written but not used on any page
for (const no of nos) { const t = page_text(no), used = T[no] || new Set();
  for (const k of Object.keys(t.blocks)) if (!used.has("b:" + k)) check(false, `p${no}: block "${k}" is written but not set`);
  for (const k of Object.keys(t.notes)) if (!used.has("n:" + k) && !(k.startsWith("kind ") && used.has("kinds"))) check(false, `p${no}: note "${k}" is written but not set`); }

console.log(`${nos.length} pages → guide/look/out/index.html, guide.pdf · ${problems.length} checks`);
execFileSync("python3", [path.join(HERE, "check_lines.py")], { stdio: "inherit" });
