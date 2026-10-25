// icons/fit.mjs — puts a new icon drawing on the icon grid (R33, docs/design.md §9), ready to paste into src/icons.js.
//
//   cd web && node icons/fit.mjs drawing.svg 16 [name]
//
// drawing.svg: any SVG (Illustrator, Figma, by hand). 16: the size it will be shown at, in points (its width; the
// height follows the drawing's proportion, to a whole point). What it does, in order:
//   1. one unit, one point: the drawing is scaled so its viewBox is the size on screen
//   2. each stroked shape gets its width by what it is: straight runs only → LINE; slanted lines (no curves) → SLANT;
//      circles, arcs and curves → CURVE (a path that is mostly straight with a short curve: SLANT). A box with round
//      corners becomes box(): sides LINE, corners CURVE. DENSE is not chosen here: look.py says when a sign crowds.
//   3. it snaps: a LINE's level and upright runs onto quarter points; every other point onto quarter points; a
//      circle's centre onto a quarter and its radius onto a half (or the reverse), so its edges land on whole dots;
//      filled shapes' points onto half points
// It prints the snippet (the inside of icon(…, size)) and writes icons/out/fit-<name>.svg to look at and
// icons/out/fit-<name>.json for `python3 icons/look.py icons/out/fit-<name>.json`.
// It reads paths (all commands, absolute or relative), rect, circle, ellipse, line, polyline, polygon, and translate
// or scale on them or on a <g>. Anything else is reported, not guessed. Text is not read: draw letters as shapes.
import fs from "fs";
import path from "path";

const [file, sizeArg, nameArg] = process.argv.slice(2);
if (!file || !sizeArg) { console.log("use: node icons/fit.mjs drawing.svg <size in points> [name]"); process.exit(1); }
const SIZE = +sizeArg, NAME = nameArg || path.basename(file, ".svg");
const src = fs.readFileSync(file, "utf8");
const app = fs.readFileSync(new URL("../src/icons.js", import.meta.url), "utf8");
const decl = /const (LINE = [^;]+);/.exec(app)[1];
const W = {};
for (const part of decl.split(/,\s*(?=[A-Z]+ =)/)) { const [k, v] = part.split("=").map((s) => s.trim()); W[k] = Function(...Object.keys(W), `return ${v}`)(...Object.values(W)); }

// ── reading ─────────────────────────────────────────────────
const vbm = /viewBox="([^"]+)"/.exec(src);
const vb = vbm ? vbm[1].trim().split(/[\s,]+/).map(Number) : [0, 0, +(/width="([\d.]+)/.exec(src) || [0, 24])[1], +(/height="([\d.]+)/.exec(src) || [0, 24])[1]];
const K = SIZE / vb[2], HIGH = Math.round(vb[3] * K);
const notes = [];
const attr = (tag, a) => { const m = new RegExp(`\\s${a}="([^"]*)"`).exec(tag); return m ? m[1] : null; };
const style = (tag, p) => { const s = attr(tag, "style"); const m = s && new RegExp(`(?:^|;)\\s*${p}\\s*:\\s*([^;]+)`).exec(s); return m ? m[1].trim() : attr(tag, p); };
// a transform as [a b c d e f]; translate and scale only (a rotation is reported)
const parseT = (t) => {
  let m = [1, 0, 0, 1, 0, 0];
  for (const [, fn, args] of (t || "").matchAll(/(\w+)\(([^)]*)\)/g)) {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === "translate") m = [m[0], 0, 0, m[3], m[4] + m[0] * n[0], m[5] + m[3] * (n[1] || 0)];
    else if (fn === "scale") m = [m[0] * n[0], 0, 0, m[3] * (n[1] ?? n[0]), m[4], m[5]];
    else if (fn === "matrix" && Math.abs(n[1]) < 1e-9 && Math.abs(n[2]) < 1e-9) m = [m[0] * n[0], 0, 0, m[3] * n[3], m[4] + m[0] * n[4], m[5] + m[3] * n[5]];
    else notes.push(`a ${fn}() transform was left out: flatten it in the drawing program`);
  }
  return m;
};
const mul = (A, B) => [A[0] * B[0], 0, 0, A[3] * B[3], A[4] + A[0] * B[4], A[5] + A[3] * B[5]];
// walk the elements, keeping the stack of <g> transforms and their paint
const shapes = [];
const stack = [{ T: [K, 0, 0, K, -vb[0] * K, -vb[1] * K], stroke: null, fill: null }];
for (const m of src.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)) {
  const [, close, tag, rest, selfClose] = m, el = `<${tag}${rest}>`;
  if (close) { if (tag === "g") stack.pop(); continue; }
  const top = stack[stack.length - 1];
  const T = mul(top.T, parseT(attr(el, "transform")));
  const stroke = style(el, "stroke") ?? top.stroke, fill = style(el, "fill") ?? top.fill;
  if (tag === "svg") { stack[0].stroke = stroke; stack[0].fill = fill; continue; }      // the drawing's own paint, inherited
  if (tag === "g") { if (!selfClose) stack.push({ T, stroke, fill }); continue; }
  if (["path", "rect", "circle", "ellipse", "line", "polyline", "polygon"].includes(tag)) shapes.push({ tag, el, T, stroke: stroke && stroke !== "none", fill: fill !== "none" && !(fill == null && stroke && stroke !== "none") });
  else if (tag === "text") notes.push("text was left out: outline it, or draw the letter as lines");
}

// ── paths: to absolute segments ─────────────────────────────
const parsePath = (d) => {
  const toks = d.match(/[A-Za-z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) || [];
  const segs = []; let i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0, lc = null;
  const n = () => +toks[i++];
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase() && cmd !== "z" && cmd !== "Z", C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === "M") { x = ox + n(); y = oy + n(); sx = x; sy = y; segs.push(["M", x, y]); cmd = rel ? "l" : "L"; lc = null; }
    else if (C === "L") { x = ox + n(); y = oy + n(); segs.push(["L", x, y]); lc = null; }
    else if (C === "H") { x = ox + n(); segs.push(["L", x, y]); lc = null; }
    else if (C === "V") { y = oy + n(); segs.push(["L", x, y]); lc = null; }
    else if (C === "C") { const a = [ox + n(), oy + n(), ox + n(), oy + n()]; x = ox + n(); y = oy + n(); segs.push(["C", ...a, x, y]); lc = [a[2], a[3]]; }
    else if (C === "S") { const r = lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y]; const a = [ox + n(), oy + n()]; const px = x, py = y; x = ox + n(); y = oy + n(); segs.push(["C", ...r, ...a, x, y]); lc = a; }
    else if (C === "Q") { const q = [ox + n(), oy + n()]; const px = x, py = y; x = ox + n(); y = oy + n(); segs.push(["C", px + 2 / 3 * (q[0] - px), py + 2 / 3 * (q[1] - py), x + 2 / 3 * (q[0] - x), y + 2 / 3 * (q[1] - y), x, y]); lc = null; }
    else if (C === "T") { const px = x, py = y; x = ox + n(); y = oy + n(); segs.push(["L", x, y]); lc = null; notes.push("a T curve was read as a straight line: check it"); }
    else if (C === "A") { const a = [n(), n(), n(), n(), n()]; x = ox + n(); y = oy + n(); segs.push(["A", ...a, x, y]); lc = null; }
    else if (C === "Z") { segs.push(["Z"]); x = sx; y = sy; lc = null; }
    else { notes.push(`a path command ${cmd} was not read`); break; }
  }
  return segs;
};
const tx = (T, x, y) => [T[0] * x + T[4], T[3] * y + T[5]];

// ── snapping ────────────────────────────────────────────────
const q = (v) => Math.round((v - 0.25) * 2) / 2 + 0.25;        // the nearest quarter point (x.25, x.75)
const quarter = (v) => Math.round(v * 4) / 4;                    // the nearest quarter of a point
const half = (v) => Math.round(v * 2) / 2;
const f = (v) => +v.toFixed(3);
const out = [], preview = [];
const widthName = (w) => (w === "LINE" ? "" : ` \${sw(${w})}`);
for (const s of shapes) {
  const { tag, el, T } = s;
  const g = (a) => +(attr(el, a) || 0);
  if (!s.stroke && !s.fill) continue;
  if (tag === "circle" || tag === "ellipse") {
    let [cx, cy] = tx(T, g("cx"), g("cy")), rx = (tag === "circle" ? g("r") : g("rx")) * T[0], ry = (tag === "circle" ? g("r") : g("ry")) * T[3];
    if (s.fill && !s.stroke) { out.push(`<circle cx="${half(cx)}" cy="${half(cy)}" r="${quarter(rx)}" fill="currentColor" stroke="none"/>`); continue; }
    if (Math.abs(rx - ry) > 0.01) notes.push("an ellipse was drawn as a circle of its average radius");
    cx = q(cx); cy = q(cy); const r = half((rx + ry) / 2);      // centre on a quarter, radius on a half: edges on whole dots
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r}"${widthName("CURVE")}/>`);
    continue;
  }
  if (tag === "rect") {
    let [x, y] = tx(T, g("x"), g("y")), w = g("width") * T[0], h = g("height") * T[3], r = (+(attr(el, "rx") || attr(el, "ry") || 0)) * T[0];
    if (s.fill && !s.stroke) { out.push(`<rect x="${half(x)}" y="${half(y)}" width="${half(w)}" height="${half(h)}"${r ? ` rx="${quarter(r)}"` : ""} fill="currentColor" stroke="none"/>`); continue; }
    const X = q(x), Y = q(y), X2 = q(x + w), Y2 = q(y + h);
    if (r > 0.01) out.push(`\${box(${X}, ${Y}, ${f(X2 - X)}, ${f(Y2 - Y)}, ${quarter(r)})}`);
    else out.push(`<rect x="${X}" y="${Y}" width="${f(X2 - X)}" height="${f(Y2 - Y)}"/>`);
    continue;
  }
  let segs;
  if (tag === "path") segs = parsePath(attr(el, "d") || "");
  else if (tag === "line") segs = [["M", g("x1"), g("y1")], ["L", g("x2"), g("y2")]];
  else { const p = (attr(el, "points") || "").trim().split(/[\s,]+/).map(Number); segs = []; for (let i = 0; i < p.length; i += 2) segs.push([i ? "L" : "M", p[i], p[i + 1]]); if (tag === "polygon") segs.push(["Z"]); }
  // to screen points
  segs = segs.map((sg) => {
    if (sg[0] === "Z") return sg;
    if (sg[0] === "A") { const [x, y] = tx(T, sg[6], sg[7]); return ["A", sg[1] * T[0], sg[2] * T[3], sg[3], sg[4], sg[5], x, y]; }
    const pts = []; for (let i = 1; i < sg.length; i += 2) pts.push(...tx(T, sg[i], sg[i + 1]));
    return [sg[0], ...pts];
  });
  if (s.fill && !s.stroke) {      // a filled shape: every point on a half point
    out.push(`<path d="${segs.map((sg) => sg[0] === "Z" ? "Z" : sg[0] === "A" ? `A${quarter(sg[1])} ${quarter(sg[2])} ${sg[3]} ${sg[4]} ${sg[5]} ${half(sg[6])} ${half(sg[7])}` : sg[0] + sg.slice(1).map(half).join(" ")).join("")}" fill="currentColor" stroke="none"/>`);
    continue;
  }
  // what kind of line: lengths of level/upright runs, slanted runs and curves
  let px = 0, py = 0, sx = 0, sy = 0, straight = 0, slant = 0, curve = 0;
  for (const sg of segs) {
    const [x, y] = sg[0] === "Z" ? [sx, sy] : sg.slice(-2);
    const len = Math.hypot(x - px, y - py);
    if (sg[0] === "M") { sx = x; sy = y; }
    else if (sg[0] === "L" || sg[0] === "Z") { if (Math.abs(x - px) < 0.05 || Math.abs(y - py) < 0.05) straight += len; else slant += len; }
    else curve += len * (sg[0] === "A" ? 1.4 : 1.1);
    px = x; py = y;
  }
  const total = straight + slant + curve || 1;
  const kind = curve / total > 0.5 ? "CURVE" : curve > 0 ? "SLANT" : slant === 0 ? "LINE" : straight / total > 0.5 ? "LINE" : "SLANT";
  // snap: every point to a quarter point; a LINE's level and upright runs onto quarter points (x.25, x.75)
  let lx = null, ly = null, d = "";
  const snapped = segs.map((sg) => sg[0] === "Z" ? sg : sg[0] === "A" ? ["A", quarter(sg[1]), quarter(sg[2]), sg[3], sg[4], sg[5], sg[6], sg[7]] : sg.slice());
  for (const sg of snapped) {
    if (sg[0] === "Z") { d += "Z"; continue; }
    const n = sg.length;
    let x = sg[n - 2], y = sg[n - 1];
    const level = ly != null && Math.abs(y - ly) < 0.05, upright = lx != null && Math.abs(x - lx) < 0.05;
    x = kind === "LINE" ? q(x) : quarter(x); y = kind === "LINE" ? q(y) : quarter(y);
    if (sg[0] === "L" && upright) d += `V${y}`;
    else if (sg[0] === "L" && level) d += `H${x}`;
    else if (sg[0] === "C") d += `C${sg.slice(1, 5).map(quarter).join(" ")} ${x} ${y}`;
    else if (sg[0] === "A") d += `A${sg[1]} ${sg[2]} ${sg[3]} ${sg[4]} ${sg[5]} ${x} ${y}`;
    else d += `${sg[0]}${x} ${y}`;
    lx = sg[n - 2]; ly = sg[n - 1];
  }
  out.push(`<path d="${d}"${widthName(kind)}/>`);
}

// ── what it made ────────────────────────────────────────────
const snippet = out.join("");
const numeric = snippet.replace(/\$\{sw\((\w+)\)\}/g, (m, k) => `stroke-width="${W[k]}"`)
  .replace(/\$\{box\(([^)]*)\)\}/g, (m, a) => { const [x, y, w, h, r] = a.split(",").map(Number), X = x + w, Y = y + h;
    return `<path d="M${x + r} ${y}H${X - r}M${X} ${y + r}V${Y - r}M${X - r} ${Y}H${x + r}M${x} ${Y - r}V${y + r}"/><path d="M${X - r} ${y}A${r} ${r} 0 0 1 ${X} ${y + r}M${X} ${Y - r}A${r} ${r} 0 0 1 ${X - r} ${Y}M${x + r} ${Y}A${r} ${r} 0 0 1 ${x} ${Y - r}M${x} ${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}" stroke-width="${W.CURVE}"/>`; });
const svg = `<svg viewBox="0 0 ${SIZE} ${HIGH}" width="${SIZE}" height="${HIGH}" fill="none" stroke="currentColor" stroke-width="${W.LINE}" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${numeric}</svg>`;
const dir = new URL("out/", import.meta.url).pathname;
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(dir + `fit-${NAME}.svg`, svg);
fs.writeFileSync(dir + `fit-${NAME}.json`, JSON.stringify([{ id: NAME, svg }]));
console.log(`${NAME}: ${SIZE} × ${HIGH} points (drawn ${vb[2]} × ${vb[3]}, ×${+K.toFixed(4)})`);
console.log(`paste: icon(\`${snippet}\`${SIZE === 16 && HIGH === 16 ? "" : `, ${SIZE}${HIGH !== SIZE ? `, ${HIGH}` : ""}`})`);
console.log(`look:  icons/out/fit-${NAME}.svg · weight: python3 icons/look.py icons/out/fit-${NAME}.json`);
for (const n of new Set(notes)) console.log("note  " + n);
