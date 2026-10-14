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

// ── frames: every screenshot sits in the same grid box (Okay, 14 Oct 2026) ──
// The window under it is grey and veiled, lower in contrast and darker, so what is shown in full stands out.
// Three kinds: zoom — a fixed window, the same size and place in every frame, shows the part larger, in full;
// thin rays and a thin box in the section's colour say where it came from, the window's own frame is thicker and darker.
// point — no enlargement: the part is lifted out of the veil, in full, framed. two — two points, one above the other:
// a control, then what it opens (Okay: "show two states, divide the panel into two").
const [VW, VH] = SHOTS.viewport;
const shot_src = (shot) => `../img/${shot}.png`;
const pad_rect = (f, p) => [f[0] - p, f[1] - p, f[2] + 2 * p, f[3] + 2 * p];
/** the context: the part's centre in the middle, `s` mm a point, the box's shape, kept inside the window */
function context(b, F, s, o = {}) {
  let cw = b.w / s, ch = b.h / s;
  if (cw > VW) { cw = VW; s = b.w / cw; ch = b.h / s; }
  if (ch > VH) { ch = VH; s = b.h / ch; cw = b.w / s; }
  let cx = F[0] + F[2] / 2 - cw / 2, cy = F[1] + F[3] / 2 - ch / 2;
  if (o.ctx) [cx, cy] = o.ctx;
  cx = Math.max(0, Math.min(VW - cw, cx)); cy = Math.max(0, Math.min(VH - ch, cy));
  return { cx, cy, s };
}
const img_at = (shot, s, ox, oy, cls = "") => `<img class="${cls}" src="${shot_src(shot)}" style="width:${VW * s}mm;left:${-ox * s}mm;top:${-oy * s}mm">`;
const veil = (b, shot, c) => `<div class="ctx" style="width:${b.w}mm;height:${b.h}mm">${img_at(shot, c.s, c.cx, c.cy)}<div class="veil"></div></div>`;

function point(b, shot, focus, o = {}) {
  const F = pad_rect(focus, o.pad ?? 4);
  // the part takes about two thirds of the box's width (or 70 % of its height)
  const s0 = Math.min(b.w * (o.fill ?? 0.66) / F[2], b.h * 0.7 / F[3], 0.62);
  const c = context(b, F, s0, o), s = c.s;
  const fx = (F[0] - c.cx) * s, fy = (F[1] - c.cy) * s, fw = F[2] * s, fh = F[3] * s;
  return `<div class="frame" style="${css(b)}">${veil(b, shot, c)}
    <div class="lift" style="left:${fx}mm;top:${fy}mm;width:${fw}mm;height:${fh}mm">${img_at(shot, s, F[0], F[1])}</div></div>`;
}

function zoom(b, shot, focus, o = {}) {
  const F = pad_rect(focus, o.pad ?? 4);
  // the window: the same size and place in every frame
  const ww = b.w * 0.84, wh = b.h * 0.5, wx = (b.w - ww) / 2, wy = b.h * 0.47 - wh / 2;
  const z = Math.min(ww / F[2], wh / F[3], 0.62);
  check(z * 1 > 0, `zoom ${shot}: no size`);
  const sw = ww / z, sh = wh / z;                                  // the span of the window shown in it, in points
  let sx = F[0] + F[2] / 2 - sw / 2, sy = F[1] + F[3] / 2 - sh / 2;
  // not kept inside the window: the part stays centred, and past the window's edge the frame shows paper
  // the context, wide enough that the window is at least 1.8 times it
  const c = context(b, [sx, sy, sw, sh], Math.min(z / 1.8, b.w / Math.max(sw * 2.2, 300)), o), s = c.s;
  check(z / s >= 1.5, `zoom ${shot}: only ${(z / s).toFixed(2)}× the context`);
  const fx = (sx - c.cx) * s, fy = (sy - c.cy) * s, fw = sw * s, fh = sh * s;
  const rays = [[fx, fy, wx, wy], [fx + fw, fy, wx + ww, wy], [fx, fy + fh, wx, wy + wh], [fx + fw, fy + fh, wx + ww, wy + wh]];
  return `<div class="frame" style="${css(b)}">${veil(b, shot, c)}
    <svg class="rays" viewBox="0 0 ${b.w} ${b.h}" style="width:${b.w}mm;height:${b.h}mm">
      ${rays.map(([a, d, e, g]) => `<line x1="${a}" y1="${d}" x2="${e}" y2="${g}"/>`).join("")}
      <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}"/></svg>
    <div class="win" style="left:${wx}mm;top:${wy}mm;width:${ww}mm;height:${wh}mm">${img_at(shot, z, sx, sy)}</div></div>`;
}

function two(b, a, z) {
  const gap = 1.4, h = (b.h - gap) / 2;
  return point({ x: b.x, y: b.y, w: b.w, h }, ...a) + point({ x: b.x, y: b.y + h + gap, w: b.w, h }, ...z);
}

// ── a dial picture from the tool's own SVG export ──
const dial = (b, file, o = {}) => `<div class="pic" style="${css(b)}"><img src="../img/${file}.svg" style="height:${o.fill ?? 92}%"></div>`;

// ── blocks of words ──
const block = (b, t, o = {}) => `<div class="block${t.watch ? " watch" : ""}${o.small ? " small" : ""}" style="${css(b)}">
  ${t.watch ? `<svg class="tri" viewBox="0 0 24 24"><path d="M12 3 L22 20 L2 20 Z"/><path d="M12 10 V14.5 M12 16.8 V17.6"/></svg>` : ""}
  <p><b>${inline(t.label)}${/[?.!]$/.test(t.label) ? "" : "."}</b> ${inline(t.body)}</p></div>`;

// the head: a tab in the part's colour hanging from the rule, the part and the page together (Okay: "A02 could be
// together and a tab on top left"); the title; the lead, one line for each sentence (Okay: "two lines, one for each sentence")
const lead_lines = (s) => inline(s).split(/(?<=[.!?])\s+/).join("<br>");
const head = (part, no, t) => `<div class="head" style="left:${X(1)}mm;top:${Y(1)}mm;width:${W(12)}mm;height:${H(2)}mm">
    <div class="ptab">${part}<span>${no}</span></div><h1 style="width:${W(6)}mm">${inline(t.title)}</h1>
    <p class="lead" style="left:${X(7) - X(1)}mm;width:${W(6)}mm">${lead_lines(t.lead)}</p></div>`;
const page = (part, inner) => { const i = PARTS.indexOf(part), hue = 95 + i * 360 / PARTS.length;
  return `<section class="page" style="--sig:${tint(part)};--sig-dark:${oklch(0.52, 0.10, hue)}">${inner}</section>`; };

// ════════════════════════ the pages ════════════════════════
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

// a page's usual body: four insets on rows 3–8, the four blocks they belong to under them (rows 9–11),
// and up to four more blocks under those (rows 12–14). Okay, 14 Oct: one inset size for every screenshot.
const usual = (part, no, t, ins, first, second = []) => page(part, head(part, no, t) + ins.join("")
  + first.map((l, i) => { if (!l) return ""; const [label, rows] = Array.isArray(l) ? l : [l, 3]; return block(box(1 + i * 3, 9, 3, rows), text(t, label)); }).join("")
  + second.map((l, i) => l ? block(box(1 + i * 3, 12, 3, 3), text(t, l)) : "").join(""));

// 01 · Start
{
  const t = page_text("01");
  pages.push(usual("A", "01", t, [
    point(box(1, 3, 3, 6), "dial", [20, 14, 420, 36], { fill: 0.86 }),
    two(box(4, 3, 3, 6), ["dial", SHOTS.rects.dial.unit, { pad: 3, fill: 0.3 }], ["unit", union(SHOTS.rects.unit.menu, SHOTS.rects.unit.unit), { pad: 3, fill: 0.5 }]),
    zoom(box(7, 3, 3, 6), "export", SHOTS.rects.export.pane_link, { pad: 2 }),
    zoom(box(10, 3, 3, 6), "dial", SHOTS.rects.dial.undo, { pad: 6 }),
  ], ["Where it lives", ["Everything is in millimetres", 4], "The link is the dial", "Changed your mind?"], [null, null, "Watch"]));
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

// 03 · The window
{
  const t = page_text("03"), R = SHOTS.rects;
  pages.push(usual("A", "03", t, [
    point(box(1, 3, 3, 6), "dial", R.dial.tabs, { pad: 3, fill: 0.86 }),
    point(box(4, 3, 3, 6), "dial", R.dial.pane_dial, { pad: 2, fill: 0.86 }),
    zoom(box(7, 3, 3, 6), "hover", union(R.hover.tip, R.hover.pointer), { pad: 10 }),
    zoom(box(10, 3, 3, 6), "dial", union(R.dial.play, R.dial.time), { pad: 4 }),
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
  pages.push(page("A", head("A", "04", t) + `<div class="whole" style="${css(img)}"><img src="../img/dial.png"></div>
    <svg class="marks" viewBox="0 0 ${PAGE[0]} ${PAGE[1]}">${svg}</svg>${labels}
    ${block(box(1, 13, 4, 2), text(t, "Typing numbers"))}${block(box(5, 13, 4, 2), text(t, "On an iPad"))}`));
}

// 05 · Dial and page
{
  const t = page_text("05"), R = SHOTS.rects;
  pages.push(usual("B", "05", t, [
    zoom(box(1, 3, 3, 6), "dial", union(R.dial.diameter, R.dial.plate, [48, R.dial.diameter[1], 1, 1]), { pad: 4 }),
    point(box(4, 3, 3, 6), "dial", R.dial.pane_page, { pad: 2, fill: 0.86 }),
    point(box(7, 3, 3, 6), "dial", R.dial.pane_colours, { pad: 2, fill: 0.86 }),
    point(box(10, 3, 3, 6), "pop", R.pop.box, { pad: 2, fill: 0.86 }),
  ], ["Diameter", "Page", "Colours, all in one place", ["The colour box", 4]], ["Plate", null, "Watch"]));
}

// 06 · Rings
{
  const t = page_text("06"), R = SHOTS.rects;
  pages.push(usual("B", "06", t, [
    dial(box(1, 3, 3, 6), "dial-step-9", { fill: 86 }),
    two(box(4, 3, 3, 6), ["rings", R.rings.tools, { pad: 3, fill: 0.6 }], ["add", union(R.add.menu, R.add.plus), { pad: 3, fill: 0.5 }]),
    point(box(7, 3, 3, 6), "rings", R.rings.list, { pad: 3, fill: 0.86 }),
    zoom(box(10, 3, 3, 6), "rings", R.rings.drawer, { pad: 3 }),
  ], ["One idea", "Four kinds", "Top first", ["Working on a ring", 4]], [null, null, "Copy and reuse"]));
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
