// build.mjs — the web version's guidebook, pages 00–06 for review (Okay, 14 Oct 2026, 13:36: "Build these 7 pages first").
//   node docs/guide/web/shots.mjs   (once: pictures from the locked beta 4.36.1)
//   node docs/guide/web/build.mjs   → out/guide-review.pdf and out/page-NN.png
// Words: docs/guide/text-web.md (read here, never copied). Look: docs/design.md (grid §3, colour §4, pictures §5).
// Screenshots follow one rule (Okay, 13:36): every inset is the same grid box; in it a wider span of the window,
// grey and faded, and the part that matters, larger, in full, framed and centred over it; a box marks where it came from.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const OUT = path.join(HERE, "out");
fs.mkdirSync(OUT, { recursive: true });
const IMG = path.join(HERE, "img");
const SHOTS = JSON.parse(fs.readFileSync(path.join(IMG, "rects.json"), "utf8"));
const SITE = "https://duztman.github.io/dial-tool/";
const problems = [];
const check = (ok, what) => { if (!ok) { problems.push(what); console.log("CHECK  " + what); } };

// ── the grid (design canon §3): A4 landscape, 12 columns × 14 rows, in millimetres ──
const PAGE = [297, 210], SIDE = 12, TOP = 11.5, COL = 19.08, GUT = 4, B = 1.375, ROW = 6 * B, RGAP = 4 * B;
const X = (c) => SIDE + (c - 1) * (COL + GUT);                 // left edge of column c (1–12)
const Y = (r) => TOP + (r - 1) * (ROW + RGAP);                 // top edge of row r (1–14)
const W = (n) => n * COL + (n - 1) * GUT;                      // width of n columns
const H = (n) => n * ROW + (n - 1) * RGAP;                     // height of n rows
const box = (c, r, cs, rs) => ({ x: X(c), y: Y(r), w: W(cs), h: H(rs) });
const css = (b) => `left:${b.x.toFixed(2)}mm;top:${b.y.toFixed(2)}mm;width:${b.w.toFixed(2)}mm;height:${b.h.toFixed(2)}mm`;

// ── colour (canon §4): one pale tint per part, OKLCH L 0.90, hue stepped from yellow ──
function oklch(L, C, h) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  return "#" + lin.map((v) => { v = Math.max(0, Math.min(1, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, "0"); }).join("").toUpperCase();
}
const PARTS = ["A", "B", "C", "D", "E"];
const tint = (part) => { const i = PARTS.indexOf(part), near = Math.cos(i / PARTS.length * Math.PI); return oklch(0.90, 0.042 + (0.095 - 0.042) * Math.max(0, near), 95 + i * 360 / PARTS.length); };

// ── the words, from text-web.md ──
const MD = fs.readFileSync(path.join(ROOT, "docs/guide/text-web.md"), "utf8");
function page_text(no) {
  const start = MD.indexOf(`\n## ${no} · `);
  const end = MD.indexOf("\n## ", start + 5);
  const part = MD.slice(start, end < 0 ? undefined : end).replace(/\n# [A-E] · .*\n/g, "\n");
  const title = part.match(/## \d+ · (.*)/)[1].trim();
  const lead = (part.match(/\*\*Lead:\*\* (.*)/) || [])[1] || "";
  const blocks = {};
  for (const m of part.matchAll(/^\*\*([^*]+?)\.?\*\* (.*)$/gm)) if (m[1] !== "Lead:") blocks[m[1].replace(/\.$/, "")] = m[2];
  return { title, lead, blocks };
}
const inline = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*([^*]+)\*/g, "<em>$1</em>")
  .replace(/duztman\.github\.io\/dial-tool/g, `<a href="${SITE}">duztman.github.io/dial-tool</a>`).replace(/'/g, "’");
const text = (t, label, o = {}) => {
  const body = t.blocks[label];
  check(body !== undefined, `page "${t.title}": no block "${label}" in text-web.md`);
  const watch = label === "Watch";
  return { label: o.as || label, body: body || "", watch };
};

// ── an inset: the context faded, the part that matters framed and enlarged over it ──
const [VW, VH] = SHOTS.viewport;
function inset(b, shot, focus, o = {}) {
  const R = SHOTS.rects[shot];
  const f = (Array.isArray(focus) ? focus : [].concat(...[focus].map((k) => R[k]))).slice();
  check(f.length === 4 && f.every(Number.isFinite), `inset: no rect for ${shot}.${focus}`);
  const pad = o.pad ?? 6;
  const F = [f[0] - pad, f[1] - pad, f[2] + 2 * pad, f[3] + 2 * pad];
  // the context: k × the focus, the box's own shape, kept inside the window
  const aspect = b.w / b.h, k = o.k ?? 2.4;
  let cw = Math.max(F[2] * k, F[3] * k * aspect, o.min_ctx ?? 360), ch = cw / aspect;
  if (ch > VH) { ch = VH; cw = ch * aspect; } if (cw > VW) { cw = VW; ch = cw / aspect; }
  let cx = F[0] + F[2] / 2 - cw / 2, cy = F[1] + F[3] / 2 - ch / 2;
  if (o.ctx) [cx, cy] = o.ctx;
  cx = Math.max(0, Math.min(VW - cw, cx)); cy = Math.max(0, Math.min(VH - ch, cy));
  // the enlarged part: as large as fits in 86 % × 64 % of the box, and no larger than the screenshot stays sharp
  // (3 pixels a point: 0.62 mm a point is about 120 dpi)
  const z = Math.min(b.w * (o.zw ?? 0.86) / F[2], b.h * (o.zh ?? 0.64) / F[3], 0.62);
  // the context is wide enough that the enlarged part is at least 1.8 times it (Okay: the part that matters, bigger)
  if (b.w / cw > z / 1.8) { cw = Math.min(VW, b.w / (z / 1.8)); ch = cw / aspect; if (ch > VH) { ch = VH; cw = ch * aspect; }
    cx = F[0] + F[2] / 2 - cw / 2; cy = F[1] + F[3] / 2 - ch / 2; if (o.ctx) [cx, cy] = o.ctx;
    cx = Math.max(0, Math.min(VW - cw, cx)); cy = Math.max(0, Math.min(VH - ch, cy)); }
  const s = b.w / cw;                                         // mm per point, context
  check(z / s >= 1.5, `inset ${shot}.${focus}: the enlarged part is only ${(z / s).toFixed(2)}× the context — widen the context`);
  const zw = F[2] * z, zh = F[3] * z, zx = (b.w - zw) / 2, zy = o.zy ?? (b.h - zh) / 2;
  const src = `../img/${shot}.png`;
  const fx = (F[0] - cx) * s, fy = (F[1] - cy) * s, fw = F[2] * s, fh = F[3] * s;
  const lines = [[fx, fy, zx, zy], [fx + fw, fy, zx + zw, zy], [fx, fy + fh, zx, zy + zh], [fx + fw, fy + fh, zx + zw, zy + zh]];
  return `<div class="inset" style="${css(b)}">
    <div class="ctx" style="width:${b.w}mm;height:${b.h}mm"><img src="${src}" style="width:${VW * s}mm;left:${-cx * s}mm;top:${-cy * s}mm"></div>
    <svg class="lead" viewBox="0 0 ${b.w} ${b.h}" style="width:${b.w}mm;height:${b.h}mm">
      ${lines.map(([a, c, d, e]) => `<line x1="${a}" y1="${c}" x2="${d}" y2="${e}"/>`).join("")}
      <rect class="from" x="${fx}" y="${fy}" width="${fw}" height="${fh}"/></svg>
    <div class="zoom" style="left:${zx}mm;top:${zy}mm;width:${zw}mm;height:${zh}mm"><img src="${src}" style="width:${VW * z}mm;left:${-F[0] * z}mm;top:${-F[1] * z}mm"></div>
  </div>`;
}

// ── a dial picture from the tool's own SVG export ──
const dial = (b, file, o = {}) => `<div class="pic" style="${css(b)}"><img src="../img/${file}.svg" style="height:${o.fill ?? 92}%"></div>`;

// ── blocks of words ──
const ICON = { Watch: "watch" };
const block = (b, t, o = {}) => `<div class="block${t.watch ? " watch" : ""}${o.small ? " small" : ""}" style="${css(b)}">
  ${t.watch ? `<svg class="tri" viewBox="0 0 24 24"><path d="M12 3 L22 20 L2 20 Z"/><path d="M12 10 V14.5 M12 16.8 V17.6"/></svg>` : ""}
  <p><b>${inline(t.label)}${/[?.!]$/.test(t.label) ? "" : "."}</b> ${inline(t.body)}</p></div>`;

const head = (no, t) => `<div class="head" style="left:${X(1)}mm;top:${Y(1)}mm;width:${W(12)}mm;height:${H(2)}mm">
    <div class="tno">${no}</div><h1 style="width:${W(6)}mm">${inline(t.title)}</h1>
    <p class="lead" style="left:${X(7) - X(1)}mm;width:${W(5)}mm">${inline(t.lead)}</p></div>`;
const thumb = (part) => { const i = PARTS.indexOf(part); return `<div class="thumb" style="top:${Y(3 + i * 2)}mm;height:${H(2)}mm;background:${tint(part)}">${part}</div>`; };
const page = (part, inner) => `<section class="page" style="--sig:${tint(part)}">${inner}${part ? thumb(part) : ""}</section>`;

// ════════════════════════ the pages ════════════════════════
const pages = [];

// 00 · cover (canon §5: one dial, 198 mm, 6 mm from three edges; left the construction, right the dial).
// Here the left half is the same dial as the print mask, a ghost under the title: what the tool hands to the etching bath.
{
  const D = 198, cx = PAGE[0] - 6 - D / 2, cy = PAGE[1] / 2, svg = D * 40 / 36;        // the SVG is 40 mm for a 36 mm dial
  const contents = [["A", "Start", [["01", "Start"], ["02", "A first dial"], ["03", "The window"], ["04", "The whole window"]]],
    ["B", "Build", [["05", "Dial and page"], ["06", "Rings"], ["07", "Positions"], ["08", "Marks"], ["09", "Give way"], ["10", "Bands and sectors"], ["11", "Numerals"], ["12", "Type"], ["14", "Hands"], ["15", "Windows"], ["16", "Guides"]]],
    ["C", "Out", [["17", "Export"], ["18", "Making it real"], ["20", "Links, files, Gallery"]]],
    ["D", "Classics", [["21", "Nine classics"]]], ["E", "Reference", [["31", "Every setting"], ["32", "Find it"]]]];
  const desc = MD.slice(MD.indexOf("## 00 · Cover")).split("\n").find((l) => l.startsWith("A tool for drawing"));
  check(desc, "cover: no description line");
  pages.push(`<section class="page cover">
    <div class="field dark" style="width:${cx}mm"></div><div class="field" style="left:${cx}mm;width:${PAGE[0] - cx}mm;background:${tint("A")}"></div>
    <div class="half" style="left:0;width:${cx}mm"><img class="mask" src="../img/dial-mask.svg" style="width:${svg}mm;left:${cx - svg / 2}mm;top:${cy - svg / 2}mm"></div>
    <div class="half" style="left:${cx}mm;width:${PAGE[0] - cx}mm"><img src="../img/dial-step-10.svg" style="width:${svg}mm;left:${-svg / 2}mm;top:${cy - svg / 2}mm"></div>
    <div class="ctitle" style="left:${X(1)}mm;top:${Y(1)}mm">Dial Tool</div>
    <div class="csub" style="left:${X(1)}mm;top:${Y(4)}mm;width:${W(3)}mm"><b>Guidebook</b><br>beta 4.36 · October 2026</div>
    <p class="cdesc" style="left:${X(1)}mm;top:${Y(6)}mm;width:${W(3)}mm">${inline(desc)}</p>
    <div class="ccontents" style="left:${X(1)}mm;top:${Y(9)}mm;width:${W(3) + 8}mm">${contents.map(([p, name, list]) =>
      `<div class="cpart"><span>${p} · ${name}</span>${list.map(([n, s]) => `<i>${n}</i> ${s}`).join("<br>")}</div>`).join("")}</div>
    <div class="cnote" style="left:${X(1)}mm;top:${Y(14) + 3}mm;width:${W(5)}mm">Left, in grey, the same dial as the print mask the tool exports for etching. Right, the dial.</div>
  </section>`);
}

// a page's usual body: four insets on rows 3–8, the four blocks they belong to under them (rows 9–11),
// and up to four more blocks under those (rows 12–14). Okay, 14 Oct: one inset size for every screenshot.
const usual = (part, no, t, ins, first, second = []) => page(part, head(no, t) + ins.join("")
  + first.map((l, i) => { if (!l) return ""; const [label, rows] = Array.isArray(l) ? l : [l, 3]; return block(box(1 + i * 3, 9, 3, rows), text(t, label)); }).join("")
  + second.map((l, i) => l ? block(box(1 + i * 3, 12, 3, 3), text(t, l)) : "").join(""));

// 01 · Start
{
  const t = page_text("01");
  pages.push(usual("A", "01", t, [
    inset(box(1, 3, 3, 6), "dial", [24, 18, 170, 28], { pad: 8 }),
    inset(box(4, 3, 3, 6), "dial", "unit", { pad: 10 }),
    inset(box(7, 3, 3, 6), "export", "pane_link", { pad: 4 }),
    inset(box(10, 3, 3, 6), "dial", "undo", { pad: 10 }),
  ], ["Where it lives", ["Everything is in millimetres", 4], "The link is the dial", "Changed your mind?"], [null, null, "Watch"]));
}

// 02 · A first dial, in ten pictures — two bands of six slots: the picture 4 rows, its words 2; the last two slots the finished dial
{
  const t = page_text("02");
  const steps = Object.keys(t.blocks).filter((k) => /^\d+ · /.test(k));
  check(steps.length === 10, `first dial: ${steps.length} steps, not 10`);
  let html = head("02", t);
  steps.forEach((k, i) => {
    const band = i < 6 ? 3 : 9, c = 1 + (i % 6) * 2, b = box(c, band, 2, 4);
    if (i === 9) html += `<div class="pic" style="${css(b)}"><div class="file"><img src="../img/dial-step-10.svg"><span>dial.svg · 40 × 40 mm</span></div></div>`;
    else html += dial(b, `dial-step-${i + 1}`, { fill: 88 });
    html += `<div class="block small step" style="${css(box(c, band + 4, 2, 2))}"><p><b>${inline(k)}</b><br>${inline(t.blocks[k])}</p></div>`;
  });
  const fin = box(9, 9, 4, 4);
  html += dial(fin, "dial-step-10", { fill: 94 })
    + `<div class="block small step" style="${css(box(9, 13, 4, 2))}"><p><b>The finished dial.</b> <a href="${SITE}${SHOTS.links["step-10"]}">Open it in the tool</a> and take it apart, ring by ring: every step above is still in it.</p></div>`;
  pages.push(page("A", html));
}

// 03 · The window
{
  const t = page_text("03"), R = SHOTS.rects;
  pages.push(usual("A", "03", t, [
    inset(box(1, 3, 3, 6), "dial", "tabs", { pad: 4 }),
    inset(box(4, 3, 3, 6), "dial", "pane_dial", { pad: 2 }),
    inset(box(7, 3, 3, 6), "hover", union(R.hover.tip, R.hover.pointer), { pad: 12 }),
    inset(box(10, 3, 3, 6), "dial", union(R.dial.play, R.dial.time), { pad: 4 }),
  ], ["Five tabs", "The panel", "Point and click", "The bottom bar"], ["The dial"]));
}

// 04 · The whole window — the window in grey, each part boxed, a thin line to its name (no numbers: Okay, 14 Oct)
{
  const t = page_text("04");
  const img = { x: X(3), y: Y(4) - 1, w: W(8) };
  img.h = img.w * VH / VW;
  const s = img.w / VW, R = SHOTS.rects.dial;
  const parts = [   // [rect, name, side] — side: L left of the window, R right, D under it
    [R.title, "The tool’s name and version", "L"], [R.tabs, "The five tabs", "L"], [[R.pane_dial[0], R.pane_dial[1], R.pane_dial[2], 26], "A group, with its eye", "L"],
    [R.number_row, "A slider, a field and − +: three ways to set one value", "L"], [R.plate, "A colour: a click opens the colour box", "L"],
    [R.unit, "Units", "U"], [R.undo, "Undo · redo", "U"], [union(R.guides), "Guides: the drawing aids", "U"], [R.backdrop, "Backdrop: the colour behind the dial", "R"],
    [union(R.play), "Play and speed", "D"], [union(R.time), "The time", "D"], [R.day, "The day, from 12 to 12", "D"], [union(R.zoom), "Zoom and Fit", "D"],
  ];
  const items = parts.map(([r, name, side]) => {
    const bx = img.x + (r[0] - 2) * s, by = img.y + (r[1] - 2) * s, bw = (r[2] + 4) * s, bh = (r[3] + 4) * s;
    return { name, side, bx, by, bw, bh, my: by + bh / 2 };
  });
  // labels on one side keep their order and at least two lines' room between them
  for (const side of ["L", "R"]) {
    let last = -1e9;
    for (const it of items.filter((i) => i.side === side).sort((a, b) => a.my - b.my)) { it.ly = Math.max(it.my, last + 7.5); last = it.ly; }
  }
  let svg = "", labels = "";
  for (const it of items) {
    svg += `<rect x="${it.bx}" y="${it.by}" width="${it.bw}" height="${it.bh}"/>`;
    if (it.side === "L") {
      const ex = X(3) - 2, bend = X(3) - 5;
      svg += `<polyline points="${it.bx},${it.my} ${ex},${it.my} ${bend},${it.ly} ${bend - 2},${it.ly}"/>`;
      labels += `<div class="plabel l" style="left:${X(1)}mm;width:${bend - 3 - X(1)}mm;top:${it.ly - 1.7}mm">${it.name}</div>`;
    }
    if (it.side === "R") {
      const ex = img.x + img.w + 2, bend = img.x + img.w + 5;
      svg += `<polyline points="${it.bx + it.bw},${it.my} ${ex},${it.my} ${bend},${it.ly} ${bend + 2},${it.ly}"/>`;
      labels += `<div class="plabel" style="left:${bend + 3}mm;width:${PAGE[0] - SIDE - bend - 10}mm;top:${it.ly - 1.7}mm">${it.name}</div>`;
    }
    if (it.side === "U") {
      const uy = Y(3) + 3, mx = it.bx + it.bw / 2;
      svg += `<polyline points="${mx},${it.by} ${mx},${uy + 1.2}"/>`;
      labels += `<div class="plabel" style="left:${mx - 0.2}mm;width:${W(3)}mm;top:${uy - 3.4}mm">${it.name}</div>`;
    }
    if (it.side === "D") {
      const dy = img.y + img.h + 4, mx = it.bx + it.bw / 2;
      svg += `<polyline points="${mx},${it.by + it.bh} ${mx},${dy}"/>`;
      labels += `<div class="plabel d" style="left:${mx - 0.2}mm;width:${W(2)}mm;top:${dy + 0.6}mm">${it.name}</div>`;
    }
  }
  pages.push(page("A", head("04", t) + `<div class="whole" style="${css(img)}"><img src="../img/dial.png"></div>
    <svg class="marks" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${svg}</svg>${labels}
    ${block(box(1, 13, 4, 2), text(t, "Typing numbers"))}${block(box(5, 13, 4, 2), text(t, "On an iPad"))}`));
}

// 05 · Dial and page
{
  const t = page_text("05"), R = SHOTS.rects;
  pages.push(usual("B", "05", t, [
    inset(box(1, 3, 3, 6), "dial", union(R.dial.diameter, R.dial.plate, [48, R.dial.diameter[1], 1, 1]), { pad: 6 }),
    inset(box(4, 3, 3, 6), "dial", R.dial.pane_page, { pad: 2 }),
    inset(box(7, 3, 3, 6), "dial", R.dial.pane_colours, { pad: 2, zh: 0.8 }),
    inset(box(10, 3, 3, 6), "pop", R.pop.box, { pad: 2, zh: 0.7 }),
  ], ["Diameter", "Page", "Colours, all in one place", ["The colour box", 4]], ["Plate", null, "Watch"]));
}

// 06 · Rings
{
  const t = page_text("06"), R = SHOTS.rects;
  pages.push(usual("B", "06", t, [
    dial(box(1, 3, 3, 6), "dial-step-9", { fill: 86 }),
    inset(box(4, 3, 3, 6), "add", union(R.add.menu, R.add.plus), { pad: 4 }),
    inset(box(7, 3, 3, 6), "rings", R.rings.list, { pad: 3 }),
    inset(box(10, 3, 3, 6), "rings", R.rings.drawer, { pad: 3 }),
  ], ["One idea", "Four kinds", "Top first", "Working on a ring"], [null, null, null, "Copy and reuse"]));
}

function union(...rs) {
  rs = rs.filter(Boolean);
  const x = Math.min(...rs.map((r) => r[0])), y = Math.min(...rs.map((r) => r[1]));
  return [x, y, Math.max(...rs.map((r) => r[0] + r[2])) - x, Math.max(...rs.map((r) => r[1] + r[3])) - y];
}

// ════════════════════════ out ════════════════════════
const inter = pathToFileURL(path.join(HERE, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")).href;
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dial Tool guidebook — review</title>
<style>@font-face{font-family:"Inter";src:url("${inter}") format("woff2");font-weight:100 900;}</style>
<link rel="stylesheet" href="../style.css"></head><body>${pages.join("\n")}</body></html>`;
fs.writeFileSync(path.join(OUT, "guide-review.html"), html);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const pg = await browser.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
await pg.goto(pathToFileURL(path.join(OUT, "guide-review.html")).href);
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(600);
// measure: words that overflow their block
const over = await pg.evaluate(() => [...document.querySelectorAll(".block")].filter((b) => b.scrollHeight > b.clientHeight + 1).map((b) => b.textContent.trim().slice(0, 40)));
for (const o of over) check(false, `words overflow their block: "${o}…"`);
await pg.pdf({ path: path.join(OUT, "guide-review.pdf"), width: "297mm", height: "210mm", printBackground: true, preferCSSPageSize: true });
const n = await pg.$$eval("section.page", (e) => e.length);
await pg.setViewportSize({ width: 1123, height: 794 });
for (let i = 0; i < n; i++) {
  const el = (await pg.$$("section.page"))[i];
  await el.screenshot({ path: path.join(OUT, `page-${String(i).padStart(2, "0")}.png`) });
}
await browser.close();
console.log(`${n} pages → out/guide-review.pdf · ${problems.length} checks`);
