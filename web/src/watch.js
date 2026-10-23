// watch.js — the watch round the dial: one geometry, two paints (Okay, 22 Oct 2026, build list #508).
//
// The geometry is the cases, lugs, crown, straps, buckle, keeper, bracelets, insert and holes of the Dial Show Case's two
// engines, written once; every measure a share of a published case (Patek Philippe Calatrava 5196, a 1939 military
// cushion, Seiko SPB143, Emre's prototype), scaled to the dial. Two paints over it, chosen by `STYLE`:
//   engineer — a technical drawing: every part outlined in ink, each facet in one of three tones (light · body · shade)
//              by where the light comes from, hard shadows;
//   miyazaki — no lines: each part one base colour cut by two crescents, a dark one away from the light and a light
//              one toward it; deeper colours; a flare; one outline round the metal.
// Shared by both: the shadow rule (black at one opacity, the casting shape swept along the light — sweep()), the dial
// (Dial Tool's own shapes, with ink relief and hand bevels), the textures, the bracelets.
// Millimetres, y down, the dial's centre at the origin. SVG strings only; nothing here touches the window.
//
// Exports: attach(pathkit) · KINDS · caseBox(kind, size) · presets(style) · edge(floor, view, style) · draw(options) · frame(options) · tilePicture(kind).
let PK = null;
export function attach(pk) { PK = pk; }

// ── state of one drawing: set by draw(), read everywhere ──
let STYLE = "miyazaki";
let GLINT = "plain", INK_K = 6, INK_N = 0, HAND_BEVEL = false, FLARE_TINT = "#ffffff", FLARE_SCALE = 1, GLASS_K = 1, SH_OP = 0.3, FLARE_KIND = "arc";
let BRACELET_KIND = "vault";      // which bracelet the diver wears: vault (Oyster) or links (Emre's)
let DIAL_IN = true, OUTLINE_ON = true;      // OUTLINE_ON false: the effects switch is off (Okay: "turn off shenanigans") — no silhouette outline, which is a PathKit union per drawing      // false: the watch round a dial drawn by someone else (Dial Tool's edit mode) — no dial, no glass, nothing over the opening
const REHAUT = 0.8; let SHD = 1, INSERT = { top: "#2b2c30", bottom: "#2b2c30" }, FL = { size: 1, tint: 0.45, bright: 1 }, GLASS = { fat: 1, len: 1, op: 1 }, DIALS = [], HANDS_A = { hour: 305, minute: 60, second: 180 };
let SUN_H = 40;                                            // the sun's height, degrees (set per drawing)
let CLIPS = [], clipN = 0, BLOB = 0, BLOB_N = 0, VB_N = 0;
let OUTL_S = [], OUTL_C = [], OUTT = [];      // the outlines of what is drawn: the strap's, the case's, and where the next one goes
let WEAVE = "weave";
const f = (v) => +(+v).toFixed(3), rad = (d) => d * Math.PI / 180;

const hex2hsl = (h) => { const n = parseInt(h.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let hh = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; } return [hh, s, l]; };
const hsl2hex = ([h, s, l]) => { s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join(""); };
const mixc = (a, b, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");
const deepen = (c) => { const [h, sat, l] = hex2hsl(c); return hsl2hex([h, sat < 0.12 ? sat : Math.min(1, sat * 1.25), l * 0.86]); };      // greys stay grey
const brighter = (h, k) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) + (255 - parseInt(h.slice(i, i + 2), 16)) * k).toString(16).padStart(2, "0")).join("");
function clampL(h) {
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (l >= 0.15 && l <= 0.85) return h;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0; if (d) hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const L2 = Math.min(0.85, Math.max(0.15, l)), c = (1 - Math.abs(2 * L2 - 1)) * sat, x = c * (1 - Math.abs((hue % 2) - 1)), m = L2 - c / 2;
  const [r1, g1, b1] = hue < 1 ? [c, x, 0] : hue < 2 ? [x, c, 0] : hue < 3 ? [0, c, x] : hue < 4 ? [0, x, c] : hue < 5 ? [x, 0, c] : [c, 0, x];
  return "#" + [r1, g1, b1].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

// ── colours: light · body · shade for every metal, leather and nylon, one table per style ──
// Engineer's are the published drawing's; Miyazaki's a step deeper (saturation × 1.25, lightness × 0.86; greys stay
// grey; steel a step darker still), as locked on 20 Oct 2026.
const tri = (a) => [a, a, a];

const STRIPES = {
  bond: [[0, 0.3, 0], [0.3, 0.42, 1], [0.42, 0.58, 2], [0.58, 0.7, 1], [0.7, 1, 0]],
  regimental: [[0, 0.2, 0], [0.2, 0.3, 2], [0.3, 0.7, 1], [0.7, 0.8, 2], [0.8, 1, 0]],
  khaki: [[0, 0.38, 0], [0.38, 0.62, 1], [0.62, 1, 2]],
  blackgrey: [[0, 0.25, 0], [0.25, 0.75, 1], [0.75, 1, 2]],
};
const TONES = {
  engineer: { INK: "#4d4d4d", INKB: "#4d4d4d", ink: [0.45, 0.5],
    METALS: { steel: ["#dcdedb", "#a3a5a1", "#868885"], gold: ["#e6d3a3", "#b69c66", "#957d50"], alu: ["#cfd2d5", "#9da1a4", "#83878b"], bronze: ["#dcb185", "#a9784c", "#7e5636"], titanium: ["#cac9c3", "#908f89", "#73726d"], black: ["#55565a", "#2c2d30", "#1d1e20"] },
    LEATHER: { tan: ["#b0835a", "#946b47", "#795537"], brown: ["#82614a", "#6c4f3a", "#59412f"], black: ["#4d4c4d", "#3e3d3e", "#323132"] },
    NATO_SETS: { bond: [["#46506a", "#3a4459", "#30384a"], ["#8a4148", "#74343b", "#5e2a30"], ["#aeaba3", "#99968f", "#83817b"]], g10: [["#4d596b", "#414c5d", "#363f4e"], ["#4d596b", "#414c5d", "#363f4e"], ["#4d596b", "#414c5d", "#363f4e"]] },
    NATO_MORE: {
  regimental: [["#2f4a3a", "#263d30", "#1e3026"], ["#2a3550", "#222b42", "#1b2235"], ["#b28a3e", "#957332", "#775c28"]],
  olive: tri(["#6a6c48", "#57593a", "#45472e"]),
  grey: tri(["#7b7d80", "#66686b", "#525457"]),
  khaki: [["#a99a72", "#8f815e", "#76694b"], ["#4b5a3a", "#3e4b30", "#323c27"], ["#a99a72", "#8f815e", "#76694b"]],
  blackgrey: [["#3a3b3d", "#2f3032", "#252628"], ["#8e9093", "#76787b", "#5f6164"], ["#3a3b3d", "#2f3032", "#252628"]],
} },
  miyazaki: { INK: "#262626", INKB: null, ink: [0.62, 0.8],
    METALS: { steel: ["#cfd1cd", "#8a8c88", "#6b6d6a"], gold: ["#dcc18a", "#9c8250", "#7a653d"], alu: ["#c2c6c9", "#82868a", "#676b6f"], bronze: ["#cf9d6c", "#8f6440", "#6a472c"], titanium: ["#bdbcb6", "#7f7e78", "#62615c"], black: ["#4a4b4f", "#26272a", "#17181a"] },
    LEATHER: { tan: ["#a2764f", "#83603f", "#674a30"], brown: ["#74533b", "#5c412e", "#463123"], black: ["#434243", "#323132", "#242324"] },
    NATO_SETS: { bond: [["#46506a", "#3a4459", "#30384a"], ["#8a4148", "#74343b", "#5e2a30"], ["#aeaba3", "#99968f", "#83817b"]], g10: [["#4d596b", "#414c5d", "#363f4e"], ["#4d596b", "#414c5d", "#363f4e"], ["#4d596b", "#414c5d", "#363f4e"]] },
    NATO_MORE: {
  regimental: [["#2f4a3a", "#263d30", "#1e3026"], ["#2a3550", "#222b42", "#1b2235"], ["#b28a3e", "#957332", "#775c28"]],
  olive: tri(["#6a6c48", "#57593a", "#45472e"]),
  grey: tri(["#7b7d80", "#66686b", "#525457"]),
  khaki: [["#a99a72", "#8f815e", "#76694b"], ["#4b5a3a", "#3e4b30", "#323c27"], ["#a99a72", "#8f815e", "#76694b"]],
  blackgrey: [["#3a3b3d", "#2f3032", "#252628"], ["#8e9093", "#76787b", "#5f6164"], ["#3a3b3d", "#2f3032", "#252628"]],
} },
};
{ const T = TONES.miyazaki; T.METALS.steel.forEach((c, i) => { const [h, sat, l] = hex2hsl(c); T.METALS.steel[i] = hsl2hex([h, sat, l * 0.85]); });      // steel a step darker (18:26)
  for (const tab of [T.METALS, T.LEATHER, T.NATO_SETS, T.NATO_MORE]) for (const k in tab) { const v = tab[k]; if (typeof v[0] === "string") v.forEach((c, i) => (v[i] = deepen(c))); else v.forEach((U) => U.forEach((c, i) => (U[i] = deepen(c)))); } }
let INK, INKB, METALS, LEATHER, NATO_SETS, NATO_MORE;
function use(style) { STYLE = style; ({ INK, INKB, METALS, LEATHER, NATO_SETS, NATO_MORE } = TONES[style]); }
use(STYLE);
const ramp6g = (T) => [mixc(T[2], "#000000", 0.62), mixc(T[2], "#000000", 0.3), T[2], T[1], mixc(T[0], "#ffffff", 0.25), mixc(T[0], "#ffffff", 0.8)];
const ramp6E = (T) => { const grey = hex2hsl(T[1])[1] < 0.12;      // a grey metal's own tones sit close together: its darks go deeper (18:20: the steel bracelet read flat)
  return [mixc(T[2], "#000000", grey ? 0.66 : 0.45), mixc(T[2], "#000000", grey ? 0.4 : 0.22), mixc(T[2], "#000000", grey ? 0.15 : 0), T[1], T[0], mixc(T[0], "#ffffff", 0.45)]; };      // the case's own tones (18:16: the bracelet matched to the body); the brightest only for the L
const ramp6M = (T) => { if (T === METALS.gold) return ramp6g(T); const [h, s] = hex2hsl(T[1]); return ramp6g(METALS.gold).map((c) => hsl2hex([h, s, hex2hsl(c)[2]])); };
const ramp6 = (T) => (STYLE === "engineer" ? ramp6E(T) : ramp6M(T));

// ── paths ──
const P = (pts) => "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
const circle = (r, cx = 0, cy = 0) => `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
const rrect = (x0, y0, x1, y1, r) => { const [a, b] = [Math.min(x0, x1), Math.min(y0, y1)], [c, e] = [Math.max(x0, x1), Math.max(y0, y1)]; r = Math.min(r, (c - a) / 2, (e - b) / 2); return `M${f(a + r)} ${f(b)}H${f(c - r)}Q${f(c)} ${f(b)} ${f(c)} ${f(b + r)}V${f(e - r)}Q${f(c)} ${f(e)} ${f(c - r)} ${f(e)}H${f(a + r)}Q${f(a)} ${f(e)} ${f(a)} ${f(e - r)}V${f(b + r)}Q${f(a)} ${f(b)} ${f(a + r)} ${f(b)}Z`; };
function rrect4(x0, y0, x1, y1, [tl, tr, br, bl]) {
  return `M${f(x0 + tl)} ${f(y0)}H${f(x1 - tr)}Q${f(x1)} ${f(y0)} ${f(x1)} ${f(y0 + tr)}V${f(y1 - br)}Q${f(x1)} ${f(y1)} ${f(x1 - br)} ${f(y1)}H${f(x0 + bl)}Q${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - bl)}V${f(y0 + tl)}Q${f(x0)} ${f(y0)} ${f(x0 + tl)} ${f(y0)}Z`;
}
const rrectD = (x0, y0, x1, y1, r, hole = false) => {
  const [a, b] = [Math.min(x0, x1), Math.min(y0, y1)], [c, e] = [Math.max(x0, x1), Math.max(y0, y1)]; r = Math.min(r, (c - a) / 2, (e - b) / 2);
  return hole ? `M${f(a + r)} ${f(b)}Q${f(a)} ${f(b)} ${f(a)} ${f(b + r)}V${f(e - r)}Q${f(a)} ${f(e)} ${f(a + r)} ${f(e)}H${f(c - r)}Q${f(c)} ${f(e)} ${f(c)} ${f(e - r)}V${f(b + r)}Q${f(c)} ${f(b)} ${f(c - r)} ${f(b)}Z`
    : `M${f(a + r)} ${f(b)}H${f(c - r)}Q${f(c)} ${f(b)} ${f(c)} ${f(b + r)}V${f(e - r)}Q${f(c)} ${f(e)} ${f(c - r)} ${f(e)}H${f(a + r)}Q${f(a)} ${f(e)} ${f(a)} ${f(e - r)}V${f(b + r)}Q${f(a)} ${f(b)} ${f(a + r)} ${f(b)}Z`;
};
function notchedPath(R, n, depth) {
  // the bezel's edge with round divots (18:16): n half-round cuts of radius `depth` into the rim, evenly spaced
  const pts = [], rd = depth, dl = Math.asin(rd / R);
  for (let k = 0; k < n; k++) {
    const ac = (k / n) * 2 * Math.PI - Math.PI / 2, next = ((k + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const er = [Math.cos(ac), Math.sin(ac)], et = [-Math.sin(ac), Math.cos(ac)], cc = [er[0] * R, er[1] * R];
    for (let j = 0; j <= 10; j++) { const t = Math.PI * j / 10; pts.push([cc[0] - rd * (Math.cos(t) * et[0] + Math.sin(t) * er[0]), cc[1] - rd * (Math.cos(t) * et[1] + Math.sin(t) * er[1])]); }
    for (let j = 1; j < 4; j++) { const a = ac + dl + (next - ac - 2 * dl) * j / 4; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
  }
  return "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
}
function teeth(R, n, depth) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * 2 * Math.PI - Math.PI / 2, a1 = a0 + 2 * Math.PI / n, r0 = R - depth - 0.05, pts = [];
    for (let j = 0; j <= 4; j++) { const a = a0 + (a1 - a0) * j / 4; pts.push([Math.cos(a) * (R + 0.05), Math.sin(a) * (R + 0.05)]); }
    for (let j = 4; j >= 0; j--) { const a = a0 + (a1 - a0) * j / 4; pts.push([Math.cos(a) * r0, Math.sin(a) * r0]); }
    out.push({ d: "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z", phi: ((a0 + a1) / 2) * 180 / Math.PI });
  }
  return out;
}
function cushionPts(a, n, N = 160) {
  return Array.from({ length: N }, (_, k) => { const t = k / N * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t); return [a * Math.sign(c) * Math.abs(c) ** (2 / n), a * Math.sign(s) * Math.abs(s) ** (2 / n)]; });
}
function cushionLug(C, sx, sy) {
  const half = C.l2l / 2, xi = C.lugw / 2, xo = xi + C.lugT, y0 = C.cushion.a * 0.82, c = 0.9;
  const p = (x, y) => [sx * x, sy * y];
  return P([p(xi, y0), p(xi, half), p(xo - c, half), p(xo, half - c), p(xo, y0)]);
}
function lugPath(C, sx, sy) {
  if (C.rails) { const xi = C.lugw / 2, xo = xi + C.lugT, hy = C.l2l / 2, c = 0.2; return P([[sx * xi, -hy], [sx * (xo - c), -hy], [sx * xo, -hy + c], [sx * xo, hy - c], [sx * (xo - c), hy], [sx * xi, hy]]); }      // a rail, whole (the same for sy ±1)
  const R = C.od / 2, half = C.l2l / 2, xi = C.lugw / 2, xo = xi + C.lugT, xb = xo + C.flare;
  const yb = Math.sqrt(R * R - xb * xb), yi = Math.sqrt(R * R - xi * xi) - 1.5, r = 0.8;
  const p = (x, y) => `${f(sx * x)} ${f(sy * y)}`;
  return `M${p(xi, yi)}L${p(xi, half - r)}Q${p(xi, half)} ${p(xi + r, half)}L${p(xo - r, half)}Q${p(xo, half)} ${p(xo, half - r)}C${p(xo, half - (half - yb) * 0.5)} ${p(xb - 0.6, yb + 1.2)} ${p(xb, yb)}Z`;
}
function lugChamfer(C, sx, sy, w = 0.75) {
  const R = C.od / 2, half = C.l2l / 2, xo = C.lugw / 2 + C.lugT, xb = xo + C.flare, yb = Math.sqrt(R * R - xb * xb), r = 0.8;
  const p = (x, y) => `${f(sx * x)} ${f(sy * y)}`;
  return `M${p(xo, half - r)}C${p(xo, half - (half - yb) * 0.5)} ${p(xb - 0.6, yb + 1.2)} ${p(xb, yb)}L${p(xb - w * 1.3, yb + 0.2)}C${p(xb - 0.6 - w, yb + 1.4)} ${p(xo - w, half - (half - yb) * 0.5)} ${p(xo - w, half - r)}Z`;
}
function scaleCase(C, k) {
  if (k === 1) return C;
  const s = (v) => (typeof v === "number" ? v * k : Array.isArray(v) ? v.map(s) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, ["n", "coin", "knurl", "at"].includes(a) ? b : s(b)])) : v);
  const out = { ...C };
  for (const key of ["od", "l2l", "lugw", "lugT", "flare", "bands", "opening", "dial", "crown", "insert", "cushion", "cushionBevel"]) if (key in C) out[key] = s(C[key]);
  return out;
}

// ── the Engineer's marks: ink lines, filled shapes with one dark line of shading inside, flat facets in three tones ──
const LW = 0.22;                                         // every dark outline this wide; no line on a drawing thinner
const strokeInk = (d, sw = LW, extra = "") => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const stroke = (...a) => (STYLE === "engineer" ? strokeInk(...a) : "");      // Miyazaki draws no lines
const shape = (d, c, sw = LW, inner = null) => {
  sw = LW;
  if (!inner || c === "none") return `<path d="${d}" fill="${c}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const id = "in" + clipN++; CLIPS.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return `<path d="${d}" fill="${c}"/><path d="${d}" fill="none" stroke="${inner}" stroke-width="${f(sw * 3)}" stroke-linejoin="round" clip-path="url(#${id})"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
};
const flat = (d, c) => `<path d="${d}" fill="${c}"/>`;
function tone(T, phi, tilt, L) {
  const s = Math.cos(rad(phi - L)) * tilt * Math.cos(rad(SUN_H)) / Math.cos(rad(40));      // + : faces the light; a high sun flattens it
  return s > 0.5 ? T[0] : s < 0.05 ? T[2] : T[1];      // more darks than lights (15:43): only facets turned well toward the sun light up
}
function sloped(r0, r1, T, L, out = 1, tilt = 1, N = 96) {
  let html = "", run = null;
  const wedge = (a0, a1) => `M${f(Math.cos(a0) * r1)} ${f(Math.sin(a0) * r1)}A${f(r1)} ${f(r1)} 0 0 1 ${f(Math.cos(a1) * r1)} ${f(Math.sin(a1) * r1)}L${f(Math.cos(a1) * r0)} ${f(Math.sin(a1) * r0)}A${f(r0)} ${f(r0)} 0 0 0 ${f(Math.cos(a0) * r0)} ${f(Math.sin(a0) * r0)}Z`;
  const tones = Array.from({ length: N }, (_, k) => tone(T, (k + 0.5) / N * 360 + (out > 0 ? 0 : 180), tilt, L));
  let start = 0; while (start < N && tones[start] === tones[(start + N - 1) % N]) start++;
  if (start === N) return flat(circle(r1) + circle(r0), tones[0]).replace("<path", '<path fill-rule="evenodd"');
  const put = (r) => { const n = Math.ceil((r.a1 - r.a0) / (Math.PI * 0.9)); for (let j = 0; j < n; j++) html += flat(wedge(r.a0 + (r.a1 - r.a0) * j / n, r.a0 + (r.a1 - r.a0) * (j + 1) / n), r.t); };
  for (let k = 0; k < N; k++) {
    const t = tones[(start + k) % N], a0 = (start + k) / N * 2 * Math.PI, a1 = (start + k + 1) / N * 2 * Math.PI;
    if (!run || run.t !== t) { if (run) put(run); run = { t, a0, a1 }; } else run.a1 = a1;
  }
  put(run);
  return html + stroke(circle(r0), 0.12) + stroke(circle(r1), 0.12);
}

// ── Miyazaki's marks: a part is its outline in the body tone, cut by two crescents (no masks, even-odd cut-outs) ──
function blob(d, T, L, a = 0.9, b = 2.0, away = null) {      // away: a shape the light crescent stays out of
  OUTT.push(d);
  const id = "b" + BLOB++, u = [Math.cos(rad(L)), Math.sin(rad(L))];
  const lh = SUN_H > 55 ? 0.7 : 1, dk = (SUN_H < 25 ? 1.35 : 1) * 1.3;       // harsher darks (18:06)
  CLIPS.push(`<clipPath id="${id}c"><path d="${d}"/></clipPath>`);
  // the part in its body tone; the dark crescent = the part less itself moved toward the light; the light one = less
  // itself moved away. Drawn as an even-odd cut-out, no masks (18:06)
  const cut = (dx, dy, fill, op = 1) => `<g transform="translate(${f(dx)} ${f(dy)})"><path d="M-500 -500H500V500H-500Z${d}" fill-rule="evenodd" fill="${fill}" fill-opacity="${op}"/></g>`;
  if (away) CLIPS.push(`<clipPath id="${id}a"><path clip-rule="evenodd" d="M-500 -500H500V500H-500Z${away}"/></clipPath>`);
  const light = cut(-u[0] * a * lh, -u[1] * a * lh, T[0]);
  return `<path d="${d}" fill="${T[1]}"/><g clip-path="url(#${id}c)">${cut(u[0] * b * dk, u[1] * b * dk, T[2])}${away ? `<g clip-path="url(#${id}a)">${light}</g>` : light}</g>`;
}
function blobOver(d, L, a = 0.9, b = 2.0) {
  const id = "o" + BLOB++, u = [Math.cos(rad(L)), Math.sin(rad(L))];
  CLIPS.push(`<clipPath id="${id}c"><path d="${d}"/></clipPath>`);
  const cut = (dx, dy, fill, op) => `<g transform="translate(${f(dx)} ${f(dy)})"><path d="M-500 -500H500V500H-500Z${d}" fill-rule="evenodd" fill="${fill}" fill-opacity="${op}"/></g>`;
  return `<g clip-path="url(#${id}c)">${cut(u[0] * b * 1.3, u[1] * b * 1.3, "#000", 0.36)}${cut(-u[0] * a, -u[1] * a, "#fff", 0.16)}</g>`;
}
/** one part in the style at hand: outlined and shaded (Engineer) or a blob (Miyazaki) */
const part = (d, T, L, a, b) => (STYLE === "engineer" ? shape(d, T[1], LW, T[2]) : blob(d, T, L, a, b));
const TEXTURES = (() => {
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pores = Array.from({ length: 90 }, () => `<ellipse cx="${f(rnd() * 9)}" cy="${f(rnd() * 9)}" rx="${f(0.08 + rnd() * 0.16)}" ry="${f(0.06 + rnd() * 0.1)}" transform="rotate(${f(rnd() * 180)} 0 0)"/>`).join("");
  const creases = Array.from({ length: 14 }, () => { const x = rnd() * 9, y = rnd() * 9, a = rnd() * Math.PI, l = 0.6 + rnd() * 1.2; return `M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}`; }).join("");
  return `<pattern id="grain" width="9" height="9" patternUnits="userSpaceOnUse"><g fill="#000" fill-opacity="0.16">${pores}</g><path d="${creases}" stroke="#000" stroke-opacity="0.06" stroke-width="0.12" fill="none"/><g fill="#fff" fill-opacity="0.05" transform="translate(4.5 4.5)">${pores}</g></pattern>` +
    `<pattern id="weave" width="1.2" height="1.2" patternUnits="userSpaceOnUse">` +
      `<rect width="1.2" height="0.5" fill="#fff" fill-opacity="0.13"/><rect y="0.6" width="1.2" height="0.5" fill="#fff" fill-opacity="0.05"/>` +
      `<rect x="0.1" width="0.38" height="0.6" fill="#000" fill-opacity="0.2"/><rect x="0.7" y="0.6" width="0.38" height="0.6" fill="#000" fill-opacity="0.2"/>` +
      `<rect y="0.55" width="1.2" height="0.07" fill="#000" fill-opacity="0.12"/></pattern>` +
    `<pattern id="weavebig" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><rect width="3.2" height="1.35" fill="#fff" fill-opacity="0.14"/><rect y="1.6" width="3.2" height="1.35" fill="#fff" fill-opacity="0.05"/><rect x="0.25" width="1.05" height="1.6" fill="#000" fill-opacity="0.22"/><rect x="1.85" y="1.6" width="1.05" height="1.6" fill="#000" fill-opacity="0.22"/><rect y="1.5" width="3.2" height="0.18" fill="#000" fill-opacity="0.14"/></pattern>` +
    `<pattern id="brush" width="0.6" height="40" patternUnits="userSpaceOnUse"><rect x="0.05" width="0.07" height="40" fill="#fff" fill-opacity="0.16"/><rect x="0.33" width="0.05" height="40" fill="#000" fill-opacity="0.08"/></pattern>`;
})();
const glint = (r, L, w = 0.55, o = 0.6, span = 26) => {
  if (GLINT === "off") return "";
  if (GLINT !== "flare") return `<path d="M${f(Math.cos(rad(L - span)) * r)} ${f(Math.sin(rad(L - span)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(L + span)) * r)} ${f(Math.sin(rad(L + span)) * r)}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
  // the flare (Detail's bright bloom on the case's edge): Engineer a soft bow; Miyazaki a bow or a dot (a big soft bloom, a small bright core)
  if (STYLE === "engineer") return `<path filter="url(#flare)" d="M${f(Math.cos(rad(L - span * 1.25)) * r)} ${f(Math.sin(rad(L - span * 1.25)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(L + span * 1.25)) * r)} ${f(Math.sin(rad(L + span * 1.25)) * r)}" fill="none" stroke="${FLARE_TINT}" stroke-opacity="${f(Math.min(1, o * 0.45 * FLARE_SCALE * FL.bright))}" stroke-width="${f(w * 5 * FL.size)}" stroke-linecap="round"/>`;
  const x = Math.cos(rad(L)) * r, y = Math.sin(rad(L)) * r;
  if (FLARE_KIND === "arc") return `<path filter="url(#flare)" d="M${f(Math.cos(rad(L - span * 1.6)) * r)} ${f(Math.sin(rad(L - span * 1.6)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(L + span * 1.6)) * r)} ${f(Math.sin(rad(L + span * 1.6)) * r)}" fill="none" stroke="${FLARE_TINT}" stroke-opacity="${f(Math.min(1, o * 0.9 * FL.bright))}" stroke-width="${f(w * 3.5 * FL.size)}" stroke-linecap="round"/>`;
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f((2.2 + w * 2.4) * FL.size)}" fill="${FLARE_TINT}" fill-opacity="${f(Math.min(1, o * 0.85 * FL.bright) * FLARE_SCALE)}" filter="url(#flare)"/><circle cx="${f(x)}" cy="${f(y)}" r="${f((0.32 + w * 0.22) * FL.size)}" fill="#fff" fill-opacity="${f(Math.min(1, 0.95 * Math.sqrt(FLARE_SCALE) * FL.bright))}"/>`;
};
const flareColour = (T) => mixc(T[0], "#ffffff", 1 - FL.tint);

// ── the dial: Dial Tool's shapes, printed ink standing a hair proud, the hands' shadows and bevels ──
const THICK = new Map();
const thickness = (p) => { if (THICK.has(p)) return THICK.get(p);
  const P = PK.FromSVGString(p), cmds = P.toCmds(); P.delete();
  let signed = 0, absum = 0, per = 0, sub = 0, start = null, prev = null;
  const close = () => { signed += sub; absum += Math.abs(sub); sub = 0; };
  const to = (q) => { if (prev) { sub += prev[0] * q[1] - q[0] * prev[1]; per += Math.hypot(q[0] - prev[0], q[1] - prev[1]); } prev = q; };
  for (const c of cmds) {
    const v = c[0], pts = []; for (let k = 1; k + 1 < c.length; k += 2) pts.push([c[k], c[k + 1]]);
    if (v === 0) { if (start && prev) { to(start); close(); } start = pts[0]; prev = pts[0]; }
    else if (v === 5) { if (start && prev) to(start); close(); prev = start; }
    else for (const q of (v === 3 ? pts.slice(0, 2) : pts)) to(q);
  }
  if (sub) close();
  const A = Math.abs(signed) > absum * 0.3 ? Math.abs(signed) / 2 : absum / 2, w = per ? 2 * A / per : 1;
  THICK.set(p, w); return w; };
const inkRelief = (x, s, L) => { const K = x.ink ?? INK_K; if (!K) return "";
  const id = "ik" + (INK_N++), ux = Math.cos(rad(L)) / s, uy = -Math.sin(rad(L)) / s, th = thickness(x.p) * s, es = Math.min(0.035 * K, th * 0.16), eh = Math.min(0.025 * K, th * 0.1);      // a thin line or small text gets a thinner relief (20:49)
  CLIPS.push(`<clipPath id="${id}"><path d="${x.p}"/></clipPath>`);
  const cut = (dx, dy, fill, op) => `<g transform="translate(${f(dx)} ${f(dy)})"><path d="M-9999 -9999H9999V9999H-9999Z${x.p}" fill-rule="evenodd" fill="${fill}" fill-opacity="${op}"/></g>`;
  return `<g clip-path="url(#${id})">${cut(ux * es, uy * es, "#000", TONES[STYLE].ink[0])}${cut(-ux * eh, -uy * eh, "#fff", TONES[STYLE].ink[1])}</g>`; };
const handBevel = (x, A, L) => { if (!HAND_BEVEL || !x.hand) return "";
  const id = "hb" + (INK_N++), a = rad(A[x.hand]), side = Math.cos(a) * Math.cos(rad(L)) + Math.sin(a) * Math.sin(rad(L));
  CLIPS.push(`<clipPath id="${id}"><path d="${x.p}"/></clipPath>`);
  const lit = 0.22 * Math.abs(side), dark = 0.26 * Math.abs(side);
  return `<g data-hb="${x.hand}" transform="rotate(${-A[x.hand]})"><g clip-path="url(#${id})"><rect x="0" y="-50" width="50" height="100" fill="${side > 0 ? "#fff" : "#000"}" fill-opacity="${f(side > 0 ? lit : dark)}"/><rect x="-50" y="-50" width="50" height="100" fill="${side > 0 ? "#000" : "#fff"}" fill-opacity="${f(side > 0 ? dark : lit)}"/></g></g>`; };
function dialSVG(C, v, L) {
  const D = DIALS[0], s = (C.dial - (C.insert ? 2 * REHAUT : 0)) / D.d, A = HANDS_A;
  const col = (x) => clampL(x.f);      // every colour's lightness kept between 15 and 85 %
  const items = D.items;
  const kh = Math.tan(rad(40)) / Math.tan(rad(SUN_H)), sh = [-Math.cos(rad(L)) * 0.35 * kh, Math.sin(rad(L)) * 0.35 * kh];       // the hands' shadow, away from the light (dial space is y up)
  const handsShadow = items.filter((x) => x.hand || x.role === "cap").map((x) => `<path d="${x.p}" fill="#000" fill-opacity="${f(Math.min(1, 0.35 * SHD))}"${x.hand ? ` data-hs="${x.hand}" data-sh="${f(sh[0])} ${f(sh[1])}" transform="translate(${f(sh[0])} ${f(sh[1])}) rotate(${-A[x.hand]})"` : ` transform="translate(${f(sh[0])} ${f(sh[1])})"`}/>`).join("");
  const body = items.map((x) => `<path d="${x.p}" fill="${col(x)}" fill-opacity="${x.a}"${x.hand ? ` data-h="${x.hand}" transform="rotate(${-A[x.hand]})"` : ""}/>` + (x.hand ? handBevel(x, A, L) : x.role !== "plate" && x.role !== "cap" ? inkRelief(x, s, L) : ""));
  const firstHand = items.findIndex((x) => x.hand || x.role === "cap");
  body.splice(firstHand, 0, handsShadow);
  return `<g transform="scale(${f(s)} ${f(-s)})">${body.join("")}</g>`;
}

// ── the cases ──
const CASES = {
  field: {
    // a cushion case with sharp angles, after the 1939 military cushions (Eterna's reissue: 40 mm across, 11.7 high);
    // lug to lug and lug width are assumptions (46, 20) — no drawing found that the workspace could open
    name: "Field · military cushion, 1939 · aluminium", cushion: { a: 20, n: 4.2 }, od: 40, l2l: 46, lugw: 20, lugT: 3.0, metal: null,
    bands: [[17.6, 16.4, 1, 1]], opening: 15.8, dial: 31.4, crown: { at: 0, w: 6.2, h: 3.0, knurl: 9 }, drilled: false, dialName: "Fat field",
    cushionBevel: 1.3,
  },
  diver: {
    name: "Diver · Seiko SPB143 · steel", od: 40.5, l2l: 47.6, lugw: 20, lugT: 2.9, flare: 3.6, metal: null,
    bands: [], insert: { od: 40.0, id: 32.2, coin: 60 }, opening: 15.4, dial: 30.8, crown: { at: 0, w: 6.4, h: 3.0, knurl: 9 }, drilled: false, dialName: "Quiet diver",
  },
  emre01: {
    name: "Emre01 · Emre's prototype · aluminium", rails: true, depth: 0.5, od: 22, l2l: 27, lugw: 19.4, lugT: 3.3, flare: 0, metal: null,
    bands: [[11, 10.5, 1, 0.6], [10.5, 9.1, 1, 0.12], [9.1, 8.6, -1, 0.7], [8.6, 8.0, 1, 0.12]],
    opening: 8.0, dial: 16, crown: { at: 0, w: 1.8, h: 1.1, knurl: 2 }, drilled: false, dialName: "Dress roman",
  },
  dress: {
    name: "Dress · Calatrava 5196 · gold", od: 37, l2l: 44, lugw: 20, lugT: 1.9, flare: 3.0, metal: null,
    bands: [[18.5, 18.1, 1, 0.4], [18.1, 17.3, 1, 1], [17.3, 16.8, 1, 0.5], [16.8, 16.2, 1, 1]],     // stepped: two polished steps
    opening: 15.9, dial: 31.6, crown: { at: 0, w: 4.4, h: 2.2, knurl: 7 }, drilled: false, dialName: "Dress roman",
  },
};
export const KINDS = Object.keys(CASES);
function caseEngineer(C, v, L) {
  FLARE_TINT = flareColour(C.metal);
  const R = C.cushion ? C.cushion.a : C.od / 2, T = C.metal, out = [];
  if (C.cushion) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const d = cushionLug(C, sx, sy); out.push(shape(d, T[1], 0.2, T[2])); }
  } else if (C.rails) for (const sx of [-1, 1]) {
    const xi = sx * C.lugw / 2, xo = sx * (C.lugw / 2 + C.lugT), hy = C.l2l / 2, b = 0.5, xa = Math.min(xi, xo), xz = Math.max(xi, xo);
    const o = [[xa, -hy], [xz, -hy], [xz, hy], [xa, hy]], i = [[xa + b, -hy + b], [xz - b, -hy + b], [xz - b, hy - b], [xa + b, hy - b]];
    out.push(shape(P(o), T[1], 0.2, T[2]));
    [[0, 1, 270], [1, 2, 0], [2, 3, 90], [3, 0, 180]].forEach(([a, z, phi]) => out.push(flat(P([o[a], o[z], i[z], i[a]]), tone(T, phi, 0.85, L))));
    out.push(stroke(P(i), 0.1), stroke(P(o), 0.2));
  } else for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    out.push(shape(lugPath(C, sx, sy), T[1], 0.2, T[2]));
    out.push(flat(lugChamfer(C, sx, sy), tone(T, sx > 0 ? 0 : 180, 0.9, L)), stroke(lugChamfer(C, sx, sy), 0.1));
    if (C.drilled) out.push(`<ellipse cx="${f(sx * (C.lugw / 2 + C.lugT + 0.05))}" cy="${f(sy * (C.l2l / 2 - 2.4))}" rx="0.25" ry="0.55" fill="${INK}"/>`);      // the drilled hole, seen on the lug's outer face's edge
  }
  // the crown: a cylinder lying on its side at 3; its upper half and lower half lit by where the light comes from
  const RC = C.rails ? C.lugw / 2 + C.lugT : R, cw = C.crown.w, ch = C.crown.h, x0 = RC - 0.4;      // on Emre01, out through the rail
  const top = P([[x0, -cw / 2], [x0 + ch, -cw / 2 + 0.25], [x0 + ch, 0], [x0, 0]]), bot = P([[x0, 0], [x0 + ch, 0], [x0 + ch, cw / 2 - 0.25], [x0, cw / 2]]);
  out.push(shape(P([[RC - 1.2, -cw * 0.32], [x0, -cw * 0.32], [x0, cw * 0.32], [RC - 1.2, cw * 0.32]]), T[2], 0.15));        // its stem tube
  out.push(flat(top, tone(T, 270, 0.9, L)), flat(bot, tone(T, 90, 0.9, L)), stroke(P([[x0, -cw / 2], [x0 + ch, -cw / 2 + 0.25], [x0 + ch, cw / 2 - 0.25], [x0, cw / 2]]), 0.2));
  for (let k = 1; k < C.crown.knurl; k++) { const y = -cw / 2 + 0.3 + k * (cw - 0.6) / C.crown.knurl; out.push(stroke(`M${f(x0 + ch * 0.25)} ${f(y)}H${f(x0 + ch)}`, 0.07)); }
  // the case and its bands, from the outside in: each a sloped ring in three tones
  if (C.cushion) {
    // the cushion: its flat top, then a bevel all round, each piece toned by which way it faces
    const o = cushionPts(C.cushion.a, C.cushion.n), i = cushionPts(C.cushion.a - C.cushionBevel, C.cushion.n);
    out.push(shape(P(o), T[1], 0.2, T[2]));
    let run = null; const N = o.length, quads = [];
    for (let k = 0; k < N; k++) {
      const k2 = (k + 1) % N, nx = o[k2][1] - o[k][1], ny = -(o[k2][0] - o[k][0]), phi = Math.atan2(ny, nx) * 180 / Math.PI;
      quads.push({ pts: [o[k], o[k2], i[k2], i[k]], t: tone(T, phi, 0.85, L) });
    }
    for (const q of quads) out.push(`<path d="${P(q.pts)}" fill="${q.t}" stroke="${q.t}" stroke-width="0.05"/>`);
    out.push(stroke(P(i), 0.12), stroke(P(o), 0.2));
  } else out.push(C.insert ? `<path d="${circle(R)}" fill="${mixc(T[2], "#000000", 0.45)}"/>` : "", shape(C.insert ? notchedPath(R, C.insert.coin, 0.5) : circle(R), T[1], 0.2, T[2]));      // the divots show dark metal (18:26)
  for (const [r1, r0, dir, tilt] of C.bands) out.push(sloped(r0, r1, T, L, dir, tilt));
  if (C.insert) {      // the dive bezel, drawn as Miyazaki's (Okay, 23 Oct 2026: "Miyazaki's"): the toothed rim, each tooth lit by the way it faces, straight in to the insert; the insert out to its own edge; the five-minute ticks and the triangle
    const I = C.insert, ro = I.od / 2 - 0.9;
    { const id = "nc" + clipN++; CLIPS.push(`<clipPath id="${id}"><path d="${notchedPath(R, I.coin, 0.5)}"/></clipPath>`);
      out.push(`<g clip-path="url(#${id})">` + teeth(R, I.coin, 0.5).map((t) => `<path d="${t.d}" fill="${tone(T, t.phi, 0.9, L)}"/>`).join("") + `</g>`); }
    out.push(`<path d="${notchedPath(R, I.coin, 0.5)}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>`);
    const ins = (c) => [hsl(c, 1.33), c, hsl(c, 0.78)], half = "hb" + clipN++;
    CLIPS.push(`<clipPath id="${half}"><rect x="-60" y="0" width="120" height="60"/></clipPath>`);
    out.push(sloped(I.id / 2, ro, ins(INSERT.top), L, -1, 0.5));
    if (INSERT.bottom !== INSERT.top) out.push(`<g clip-path="url(#${half})">${sloped(I.id / 2, ro, ins(INSERT.bottom), L, -1, 0.5)}</g>`);
    out.push(sloped(C.opening, I.id / 2, T, L, -1, 0.7));      // the thin metal ring between the insert and the dial
    for (let m = 5; m < 60; m += 5) { const t = rad(m * 6 - 90), r0 = I.id / 2 + 0.6, r1 = I.id / 2 + 2.5; out.push(`<path d="M${f(Math.cos(t) * r0)} ${f(Math.sin(t) * r0)}L${f(Math.cos(t) * r1)} ${f(Math.sin(t) * r1)}" stroke="#d8d6cf" stroke-width="0.7" stroke-linecap="round"/>`); }
    out.push(`<path d="${P([[0, -ro + 0.5], [-1.4, -I.id / 2 - 0.5], [1.4, -I.id / 2 - 0.5]])}" fill="#d8d6cf"/>`);
    out.push(stroke(circle(ro)), stroke(circle(I.id / 2)));
  }
  out.push(glint(C.cushion ? C.cushion.a - 0.7 : C.od / 2 - 0.5, L), glint(C.opening + 0.5, L, 0.4, 0.5, 20));
  out.push(shape(circle(C.opening), T[2], 0.15));                                                  // the crystal's seat, then the dial
  if (DIAL_IN) out.push(`<g clip-path="url(#dial-${C.key})">${dialSVG(C, v, L)}</g>`);
  if (C.insert) out.push(sloped(C.opening - REHAUT, C.opening, T, L, -1, 0.9), stroke(circle(C.opening - REHAUT), 0.15));      // the rehaut
  if (!DIAL_IN) return out.join("");
  // the case's shadow on the dial (18:21): the bezel wall blocks the light on the side it comes from, a hard crescent,
  // longer the lower the sun
  { const uS = [Math.cos(rad(L)), Math.sin(rad(L))], sl = (C.depth ?? 1) * Math.max(0.5, Math.min(2.6, 1.1 * Math.tan(rad(40)) / Math.tan(rad(SUN_H))));
    out.push(`<g clip-path="url(#dial-${C.key})"><g transform="translate(${f(-uS[0] * sl)} ${f(-uS[1] * sl)})"><path d="M-500 -500H500V500H-500Z${circle(C.opening)}" fill-rule="evenodd" fill="#000" fill-opacity="${f(Math.min(1, 0.4 * SHD))}"/></g></g>`); }
  // the crystal: a highlight crescent on the side facing the light, a faint one opposite
  const g = (a, r, w, o) => `<path d="M${f(Math.cos(rad(a - 28 * GLASS.len)) * r)} ${f(Math.sin(rad(a - 28 * GLASS.len)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(a + 28 * GLASS.len)) * r)} ${f(Math.sin(rad(a + 28 * GLASS.len)) * r)}" fill="none" stroke="#fff" stroke-opacity="${f(Math.min(1, o * GLASS.op))}" stroke-width="${f(w * GLASS.fat)}" stroke-linecap="round"/>`;
  out.push(g(L, C.opening - 0.9, 0.8, 0.55), g(L + 180, C.opening - 0.9, 0.4, 0.22));      // the glass's shine: white, and the dial never white, so it always shows
  out.push(stroke(circle(C.opening), 0.2));
  return out.join("");
}
function caseMiyazaki(C, v, L) {
  FLARE_TINT = flareColour(C.metal);
  const R = C.cushion ? C.cushion.a : C.od / 2, T = C.metal, out = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push(blob(C.cushion ? cushionLug(C, sx, sy) : lugPath(C, sx, sy), T, L, 0.5, 1.0, C.cushion || C.rails ? null : circle(R + 0.6)));      // a lug's light edge stops short of the case: at the join it peeked out as a sliver (Okay, 23 Oct 2026: "this tiny unnecessary shine")
  const cw = C.crown.w, ch = C.crown.h;
  const RC = C.rails ? C.lugw / 2 + C.lugT - 0.1 : R;      // on Emre01, out through the rail
  { const R = RC, cd = rrect(R - 1.2, -cw / 2, R + ch, cw / 2, Math.min(1.0, cw / 2)), id = "cr" + BLOB++, ly = Math.sin(rad(L)), lx = Math.cos(rad(L));
    out.push(blob(cd, T, L, 0.5, 0.9));
    CLIPS.push(`<clipPath id="${id}"><path d="${cd}"/></clipPath>`);
    // round (18:34): the crown is a cylinder lying along x — one light band on its side toward the light, one dark on
    // the other, the middle left as it is; then its knurling, dark ridges across the grip, plain to see
    const top = ly <= 0.05, bw = cw * 0.24, xg = R + 0.15;
    out.push(`<g clip-path="url(#${id})"><rect x="${f(R - 1.2)}" y="${f(top ? -cw / 2 : cw / 2 - bw)}" width="${f(ch + 1.2)}" height="${f(bw)}" fill="#fff" fill-opacity="${Math.abs(ly) < 0.3 ? 0.14 : 0.22}"/>` +
      `<rect x="${f(R - 1.2)}" y="${f(top ? cw / 2 - bw : -cw / 2)}" width="${f(ch + 1.2)}" height="${f(bw)}" fill="#000" fill-opacity="0.3"/>` +
      Array.from({ length: C.crown.knurl * 2 - 1 }, (_, k) => { const y = -cw / 2 + (k + 1) * cw / (C.crown.knurl * 2); return `<rect x="${f(xg)}" y="${f(y - 0.09)}" width="${f(R + ch - xg)}" height="0.18" fill="#000" fill-opacity="0.38"/>`; }).join("") +
      `<rect x="${f(lx > 0 ? R + ch - 0.45 : xg)}" y="${f(-cw / 2)}" width="0.45" height="${f(cw)}" fill="${lx > 0 ? "#fff" : "#000"}" fill-opacity="${lx > 0 ? 0.25 : 0.2}"/></g>`); }
  if (C.cushion) out.push(blob(P(cushionPts(C.cushion.a, C.cushion.n)), T, L, 1.1, 2.4));
  else if (C.insert) {      // the notched edge (18:06): the bezel's outline cut into teeth, each tooth a block lit by its face
    out.push(`<path d="${circle(R)}" fill="${mixc(T[2], "#000000", 0.45)}"/>`);      // the grooves between the teeth: dark metal, not floor
    out.push(blob(notchedPath(R, C.insert.coin, 0.5), T, L, 1.0, 2.2));
    { const id = "nc" + BLOB++; CLIPS.push(`<clipPath id="${id}"><path d="${notchedPath(R, C.insert.coin, 0.5)}"/></clipPath>`);
      out.push(`<g clip-path="url(#${id})">` + teeth(R, C.insert.coin, 0.5).map((t) => { const c = Math.cos(rad(t.phi - L)); return `<path d="${t.d}" fill="${c > 0.45 ? mixc(T[0], "#ffffff", 0.3) : c < -0.25 ? T[2] : T[1]}"/>`; }).join("") + `</g>`); }
  } else out.push(blob(circle(R), T, L, 1.0, 2.2));
  const uL = [Math.cos(rad(L)), Math.sin(rad(L))];
  /** a ring's hard shadow on what's under it: the ring's disc moved away from the light, clipped to `under`, drawn before the ring */
  const castBy = (rr, under, s = 0.9, op = 0.38) => { const id = "cb" + BLOB++; CLIPS.push(`<clipPath id="${id}"><path d="${under}"/></clipPath>`); return `<g clip-path="url(#${id})"><path d="${circle(rr)}" transform="translate(${f(-uL[0] * s)} ${f(-uL[1] * s)})" fill="#000" fill-opacity="${op}"/></g>`; };
  if (C.insert) {      // the dive bezel: one dark ring, its own crescents; only the five-minute ticks and the triangle
    const I = C.insert, ro = I.od / 2 - 0.9;
    out.push(castBy(ro, circle(R - 0.55)));
    const ins = (c) => [hsl(c, 1.35), c, hsl(c, 0.65)], half = "hb" + BLOB++;
    CLIPS.push(`<clipPath id="${half}"><rect x="-60" y="0" width="120" height="60"/></clipPath>`);
    out.push(blob(circle(ro), ins(INSERT.top), L, 0.6, 1.2));
    if (INSERT.bottom !== INSERT.top) out.push(`<g clip-path="url(#${half})">${blob(circle(ro), ins(INSERT.bottom), L, 0.6, 1.2)}</g>`);
    { const r0 = C.opening, r1 = I.id / 2, rm = (r0 + r1) / 2, wd = r1 - r0, arc = (a, sp) => `M${f(Math.cos(rad(a - sp)) * rm)} ${f(Math.sin(rad(a - sp)) * rm)}A${f(rm)} ${f(rm)} 0 0 1 ${f(Math.cos(rad(a + sp)) * rm)} ${f(Math.sin(rad(a + sp)) * rm)}`;
      out.push(`<path d="${circle(r1)}${circle(r0)}" fill-rule="evenodd" fill="${T[1]}"/><path d="${arc(L, 55)}" fill="none" stroke="${T[0]}" stroke-width="${f(wd * 0.6)}" stroke-linecap="round"/><path d="${arc(L + 180, 55)}" fill="none" stroke="${T[2]}" stroke-width="${f(wd * 0.6)}" stroke-linecap="round"/>`); }      // the thin metal ring between the insert and the dial
    for (let m = 5; m < 60; m += 5) { const t = rad(m * 6 - 90), r0 = I.id / 2 + 0.6, r1 = I.id / 2 + 2.5; out.push(`<path d="M${f(Math.cos(t) * r0)} ${f(Math.sin(t) * r0)}L${f(Math.cos(t) * r1)} ${f(Math.sin(t) * r1)}" stroke="#bfbcb4" stroke-width="0.7" stroke-linecap="round"/>`); }
    out.push(`<path d="${P([[0, -ro + 0.5], [-1.4, -I.id / 2 - 0.5], [1.4, -I.id / 2 - 0.5]])}" fill="#d0cdc5"/>`);
  } else if (!C.cushion) out.push(castBy(R - 1.0, circle(R)), blob(circle(R - 1.0), T, L, 0.6, 1.1));       // the bezel: a second rounded step, and its shadow
  else out.push(castBy(C.bands[0][0], P(cushionPts(C.cushion.a, C.cushion.n))), blob(circle(C.bands[0][0]), T, L, 0.6, 1.1));
  out.push(glint(C.cushion ? C.cushion.a - 0.8 : C.od / 2 - 0.6, L, 0.8, 0.55, 24));
  out.push(`<path d="${circle(C.opening)}" fill="${T[2]}"/>`);
  if (!DIAL_IN) return out.join("");
  out.push(`<g clip-path="url(#dial-${C.key})">${dialSVG(C, v, L)}</g>`);
  if (C.insert) { const r0 = C.opening - REHAUT, r1 = C.opening, rm = (r0 + r1) / 2, wd = r1 - r0, arc = (a, sp) => `M${f(Math.cos(rad(a - sp)) * rm)} ${f(Math.sin(rad(a - sp)) * rm)}A${f(rm)} ${f(rm)} 0 0 1 ${f(Math.cos(rad(a + sp)) * rm)} ${f(Math.sin(rad(a + sp)) * rm)}`;
    out.push(`<path d="${circle(r1)}${circle(r0)}" fill-rule="evenodd" fill="${T[1]}"/><path d="${arc(L + 180, 70)}" fill="none" stroke="${T[0]}" stroke-width="${f(wd * 0.75)}" stroke-linecap="round"/><path d="${arc(L, 60)}" fill="none" stroke="${T[2]}" stroke-width="${f(wd * 0.75)}" stroke-linecap="round"/><path d="${circle(r0)}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="0.12"/>`); }      // the rehaut
  // the bezel's wall shades the dial on the light's side: a hard crescent (18:06)
  out.push(`<g clip-path="url(#dial-${C.key})"><g transform="translate(${f(-uL[0] * (C.depth ?? 1) * Math.max(0.5, Math.min(2.6, 1.1 * Math.tan(rad(40)) / Math.tan(rad(SUN_H)))))} ${f(-uL[1] * (C.depth ?? 1) * Math.max(0.5, Math.min(2.6, 1.1 * Math.tan(rad(40)) / Math.tan(rad(SUN_H)))))})"><path d="M-500 -500H500V500H-500Z${circle(C.opening)}" fill-rule="evenodd" fill="#000" fill-opacity="${f(Math.min(1, 0.44 * SHD))}"/></g></g>`);
  // the glass: one soft white blob on the light's side
  const r = C.opening - 1.2, a = L;
  out.push(`<path d="M${f(Math.cos(rad(a - 35 * GLASS.len)) * r)} ${f(Math.sin(rad(a - 35 * GLASS.len)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(a + 35 * GLASS.len)) * r)} ${f(Math.sin(rad(a + 35 * GLASS.len)) * r)}" fill="none" stroke="#fff" stroke-opacity="${f(Math.min(1, 0.5 * GLASS.op))}" stroke-width="${f(1.6 * GLASS_K * GLASS.fat)}" stroke-linecap="round"/>`);
  return out.join("");
}
const caseSVG = (C, v, L) => (STYLE === "engineer" ? caseEngineer(C, v, L) : caseMiyazaki(C, v, L));

// ── straps ──
function leatherPiece(y0, y1, w0, w1, T, L, tip = 0, holes = []) {
  const s = Math.sign(y1 - y0), yEnd = y1 - s * tip, rw = 2.2;      // the fold over the bar, rounder (17:04)
  let d = `M${f(-w0 / 2)} ${f(y0 + s * rw)}Q${f(-w0 / 2)} ${f(y0)} ${f(-w0 / 2 + rw)} ${f(y0)}L${f(w0 / 2 - rw)} ${f(y0)}Q${f(w0 / 2)} ${f(y0)} ${f(w0 / 2)} ${f(y0 + s * rw)}L${f(w1 / 2)} ${f(yEnd)}`;
  if (tip) d += `Q${f(w1 / 2)} ${f(y1)} 0 ${f(y1)}Q${f(-w1 / 2)} ${f(y1)} ${f(-w1 / 2)} ${f(yEnd)}Z`; else d += `L${f(-w1 / 2)} ${f(y1)}Z`;
  let html = part(d, T, L, 1.0, 2.6) + `<path d="${d}" fill="url(#grain)"/>`;      // the grain, faint
  if (STYLE === "engineer") {      // the padding's two slopes, as facets
    const xp = (y) => w0 / 2 + (w1 - w0) / 2 * ((y - y0) / (y1 - y0)), pad = (side) => P([[side * (xp(y0) - 1.6), y0], [side * (xp(y0) - 3.4), y0], [side * (xp(yEnd) - 3.4), yEnd], [side * (xp(yEnd) - 1.6), yEnd]]);
    html += flat(pad(1), tone(T, 0, 0.8, L)) + flat(pad(-1), tone(T, 180, 0.8, L));
  }
  // the end rolled over the spring bar (Okay, 22 Oct 2026: "the topmost point is darkest, the rest fills in flat like the
  // sides"): a dark band at the very edge, flat, as the sides' crescents are; no line, no gradient
  html += `<path d="${rrectD(-w0 / 2, y0, w0 / 2, y0 + s * 0.6, rw)}" fill="#000" fill-opacity="0.45"/>`;
  // a tiny stitch along both edges (Okay, 22 Oct 2026)
  const xs = (y) => w0 / 2 + (w1 - w0) / 2 * ((y - y0) / (y1 - y0)), k = 0.9, ys = y0 + s * 1.8;
  html += `<path d="M${f(-xs(ys) + k)} ${f(ys)}L${f(-xs(yEnd) + k)} ${f(yEnd)}M${f(xs(ys) - k)} ${f(ys)}L${f(xs(yEnd) - k)} ${f(yEnd)}" fill="none" stroke="#e9dccb" stroke-opacity="0.6" stroke-width="0.18" stroke-dasharray="0.7 0.6"/>`;
  // the holes (Okay, 22 Oct 2026): through each the ground lies in shadow — a dark disc — and the hole's far wall,
  // the one facing the sun, catches a thin crescent of light
  for (const y of holes) { const u = [Math.cos(rad(L)), Math.sin(rad(L))], r = 0.85, p = [-u[1] * r, u[0] * r]; html += `<circle cx="0" cy="${f(y)}" r="${r}" fill="#000" fill-opacity="0.6"/><path d="M${f(p[0])} ${f(y + p[1])}A${r} ${r} 0 0 0 ${f(-p[0])} ${f(y - p[1])}" fill="none" stroke="${T[0]}" stroke-opacity="0.7" stroke-width="0.22"/>`; }
  return html;
}
function tangBuckle(yEnd, w) {
  // proportions from Okay's photo (22 Oct 2026): nearly square, the front bar a fifth of the length, the side bars
  // widening toward the front, the bar thin; `yEnd` is where the strap ends — the bar sits there, the frame beyond it
  const W = w + 4, H = W * 0.8, x = -W / 2, y = yEnd - H + 1.7, bar = 1.2, sideB = 1.6, sideF = 2.4, front = H * 0.2, r = 2.6, slotY = yEnd + 3.0;
  const hole = `M${f(x + W - sideB)} ${f(y + H - bar)}L${f(x + W - sideF)} ${f(y + front)}Q${f(x + W - sideF)} ${f(y + front - 0.6)} ${f(x + W - sideF - 0.6)} ${f(y + front - 0.6)}`
    + `H${f(x + sideF + 0.6)}Q${f(x + sideF)} ${f(y + front - 0.6)} ${f(x + sideF)} ${f(y + front)}L${f(x + sideB)} ${f(y + H - bar)}Z`;      // anticlockwise: a hole in the clockwise frame
  const frame = rrectD(x, y, x + W, y + H, r) + hole;
  const tongue = `M-1.1 ${f(slotY)}L1.1 ${f(slotY)}L0.7 ${f(y + 0.4)}Q0 ${f(y - 0.9)} -0.7 ${f(y + 0.4)}Z`;
  const slot = `<rect x="-1.4" y="${f(slotY - 0.35)}" width="2.8" height="0.7" rx="0.3" fill="#000" fill-opacity="0.55"/>`;      // the slot the tongue comes through
  return { frame, tongue, slot, W, H, y };
}
function buckle(y, w, T, L) {
  const B = tangBuckle(y, w), x = -B.W / 2;
  if (STYLE === "engineer") return { frame: shape(B.frame, T[1], 0.2) + flat(P([[x + 2.2, B.y], [x + B.W - 2.2, B.y], [x + B.W - 2.2, B.y + 0.9], [x + 2.2, B.y + 0.9]]), tone(T, 270, 0.9, L)), slot: B.slot, tongue: shape(B.tongue, tone(T, 0, 0.3, L), 0.15) };      // the front bar's upper face
  return { frame: blob(B.frame, T, L, 0.6, 1.2), slot: B.slot, tongue: blob(B.tongue, T, L, 0.3, 0.6) };
}
function keeper(y, w, T, L, h = 3.2) {
  const W = w + 1.4;
  if (STYLE === "engineer") return shape(P([[-W / 2, y], [W / 2, y], [W / 2, y + h], [-W / 2, y + h]]), T[1], 0.2) + flat(P([[-W / 2, y], [W / 2, y], [W / 2, y + h * 0.35], [-W / 2, y + h * 0.35]]), tone(T, 270, 0.9, L)) + flat(P([[-W / 2, y + h * 0.65], [W / 2, y + h * 0.65], [W / 2, y + h], [-W / 2, y + h]]), tone(T, 90, 0.9, L));
  return blob(rrect(-W / 2, y, W / 2, y + h, 1), T, L, 0.5, 0.9);
}
function leatherSVG(C, L, colour, open, span) {
  const T = LEATHER[colour], w = C.lugw, end = 16, yc = C.cushion ? C.l2l / 2 - 3.4 : (C.rails ? C.od / 2 - 1.5 : Math.min(C.l2l / 2 - 3.4, C.od / 2 + 0.2));      // the strap's end meets the round case at its middle (17:40)          // the strap's end, wrapped over the spring bar 2.6 mm in from the lug tips
  const gap = "";      // between the case and the strap's end the floor shows; the strap's end wraps over the spring bar and hides it (15:29)
  if (!open) return gap + leatherPiece(-yc, -span, w, w - 1.2, T, L) + leatherPiece(yc, span, w, w - 1.2, T, L, 0, [60, 67].filter((y) => y < span));
  // open, laid flat: the buckle piece at 12 (75 mm), the hole piece at 6 (115 mm), tapering to 16 mm
  const up = leatherPiece(-yc, -(C.l2l / 2 + 75), w, end, T, L), dn = leatherPiece(yc, C.l2l / 2 + 115, w, end, T, L, 7, [72, 79, 86, 93, 100, 107].map((y) => C.l2l / 2 + y - 25));
  const B = buckle(-(C.l2l / 2 + 75), end, C.metal, L);      // the strap's end wraps the buckle's bar (Okay's photo, 22 Oct 2026): the frame lies under the strap, the tongue comes up through a slot and over the front bar
  return gap + B.frame + up + dn + keeper(-(C.l2l / 2 + 62), end + 0.4, T, L, 5.5) + B.slot + B.tongue;
}
function natoEngineer(C, L, set, open, span) {
  const S = NATO_SETS[set] || NATO_MORE[set], w = C.lugw - 0.3, x0 = -w / 2;
  const stripes = STRIPES[set] || [[0, 1, 0]];
  const run = (y0, y1, layer = 0) => {
    let h = "";
    for (const [a, b, k] of stripes) {
      const T = S[k];
      h += `<rect x="${f(x0 + a * w)}" y="${f(Math.min(y0, y1))}" width="${f((b - a) * w)}" height="${f(Math.abs(y1 - y0))}" fill="${T[1]}"/>`;
      // the weave: a rib every 0.8 mm, its lit face toward the light (ribs run across, so their normal is up or down)
      const lit = tone(T, 270, 0.6, L) === T[0] ? T[0] : tone(T, 90, 0.6, L) === T[0] ? T[0] : null;

    }
    h += `<rect x="${f(x0)}" y="${f(Math.min(y0, y1))}" width="${f(w)}" height="${f(Math.abs(y1 - y0))}" fill="url(#${WEAVE})"/>`;      // the weave
    // the two folded edges: a sliver lit on the side the light comes from
    h += flat(P([[x0, y0], [x0 + 0.5, y0], [x0 + 0.5, y1], [x0, y1]]), tone(S[0], 180, 0.9, L)) + flat(P([[-x0 - 0.5, y0], [-x0, y0], [-x0, y1], [-x0 - 0.5, y1]]), tone(S[0], 0, 0.9, L));
    return h + stroke(P([[x0, y0], [-x0, y0], [-x0, y1], [x0, y1]]), 0.2);
  };
  const half = C.l2l / 2;
  if (!open) {
    let h = run(-span, span);
    h += stroke(`M${f(x0)} ${f(half + 10)}H${f(-x0)}`, 0.2);                                          // the second layer's folded end
    h += `<path d="M${f(x0)} ${f(half + 10.3)}H${f(-x0)}" stroke="#000" stroke-opacity="0.25" stroke-width="0.6"/>`;
    h += keeper(half + 15, w, C.metal, L, 3.6);
    for (let y = half + 14; y < span; y += 7) h += `<ellipse cx="0" cy="${f(-y)}" rx="0.85" ry="0.65" fill="${INK}" fill-opacity="0.75"/>`;      // the holes, every 7 mm
    return h;
  }
  // open, laid flat (Timefactors' G10: 280 mm, holes every 7 mm from 25 mm off the end, 75 mm between rings 2 and 3)
  let h = run(-(half + 70), half + 165);
  h += buckle(-(half + 70) - 6, w, C.metal, L) + keeper(-(half + 58), w, C.metal, L, 3.6);
  h += keeper(half + 12, w, C.metal, L, 3.6) + keeper(half + 87, w, C.metal, L, 3.6);
  for (let y = half + 165 - 25; y > half + 100; y -= 7) h += `<ellipse cx="0" cy="${f(y)}" rx="0.85" ry="0.65" fill="${INK}" fill-opacity="0.75"/>`;
  return h;
}
function natoMiyazaki(C, L, set, open, span) {
  const S = NATO_SETS[set] || NATO_MORE[set], w = C.lugw - 0.3, x0 = -w / 2, half = C.l2l / 2;
  const stripes = STRIPES[set] || [[0, 1, 0]];
  const y0 = open ? -(half + 70) : -span, y1 = open ? half + 165 : span, band = rrect(x0, y0, -x0, y1, 1.2);
  let h = stripes.map(([a, b, k]) => `<rect x="${f(x0 + a * w)}" y="${f(y0)}" width="${f((b - a) * w)}" height="${f(y1 - y0)}" fill="${S[k][1]}"/>`).join("");
  OUTT.push(band);
  h += `<path d="${band}" fill="url(#${WEAVE})"/>` + blobOver(band, L, 1.0, 2.6);      // the weave, then the round
  h += `${[0, 1, 2, 3].map((i) => `<rect x="${f(x0)}" y="${f(half + 9.4 + i * 0.35)}" width="${f(w)}" height="${f(1.6 - i * 0.35)}" fill="#000" fill-opacity="0.07"/>`).join("")}`;      // the second layer's end, as a soft dark band
  if (!open) { h += keeper(half + 15, w, C.metal, L, 3.6); for (let y = half + 14; y < span; y += 7) h += `<circle cx="0" cy="${f(-y)}" r="0.85" fill="#000" fill-opacity="0.45"/>`; }
  else { h += buckle(y0 - 6, w, C.metal, L) + keeper(-(half + 58), w, C.metal, L, 3.6) + keeper(half + 12, w, C.metal, L, 3.6) + keeper(half + 87, w, C.metal, L, 3.6); for (let y = y1 - 25, n = 0; n < 9; y -= 7, n++) h += `<circle cx="0" cy="${f(y)}" r="0.85" fill="#000" fill-opacity="0.45"/>`; }
  return h;
}
const natoSVG = (...a) => (STYLE === "engineer" ? natoEngineer(...a) : natoMiyazaki(...a));

// ── bracelets: rows of vaulted links in hard bands (the diver's Oyster type) or Emre's H-links ──
function barrelEngineer(d, x0, y0, x1, y1, k, ramp, lv, flip) {
  // a steep vault in hard bands (17:40): the curve over the wrist cut into 7 strips, each strip one of the ramp's six
  // tones for how much it faces the light — no gradients, a blocky palette; then an L of light on the two edges that
  // face the light and a reverse L of dark on the other two, like a bevel
  const id = "vb" + VB_N++, h = y1 - y0, N = 9;
  CLIPS.push(`<clipPath id="${id}c"><path d="${d}"/></clipPath>`);
  let s = `<g clip-path="url(#${id}c)">`;
  // each strip's tone by its rank in brightness (18:16: depth good, flat bad): the five fill tones shared out over the
  // strips in order, so no link is one flat band, and the brightest strip still faces the light
  const dots = Array.from({ length: N }, (_, i) => { const t = ((i + 0.5) / N * 2 - 1) * flip, b = Math.asin(Math.max(-1, Math.min(1, t * k))); return Math.max(0, Math.sin(b) * lv[1] + Math.cos(b) * lv[2]); });
  const order = dots.map((d, i) => [d, i]).sort((a, b) => a[0] - b[0]).map((p) => p[1]), rank = []; order.forEach((i, r) => (rank[i] = r));
  for (let i = 0; i < N; i++) {
    const q = Math.min(ramp.length - 2, Math.floor(rank[i] / N * (ramp.length - 1)));
    s += `<rect x="${f(x0)}" y="${f(y0 + i * h / N - 0.01)}" width="${f(x1 - x0)}" height="${f(h / N + 0.02)}" fill="${ramp[q]}"/>`;
  }
  const e = 0.32, litL = lv[0] <= 0, litT = Math.abs(lv[1]) < 0.05 ? true : lv[1] < 0;
  const vx = (left) => `<rect x="${f(left ? x0 : x1 - e)}" y="${f(y0)}" width="${f(e)}" height="${f(h)}"/>`;
  const hz = (top) => `<rect x="${f(x0)}" y="${f(top ? y0 : y1 - e)}" width="${f(x1 - x0)}" height="${f(e)}"/>`;
  s += `<g fill="${ramp[0]}">${vx(!litL)}${hz(!litT)}</g><g fill="${ramp[ramp.length - 1]}">${vx(litL)}${hz(litT)}</g>`;
  return s + `</g>`;
}
function barrelMiyazaki(d, x0, y0, x1, y1, k, ramp, lv, flip) {
  // a steep vault in hard bands (17:40): the curve over the wrist cut into 7 strips, each strip one of the ramp's six
  // tones for how much it faces the light — no gradients, a blocky palette; then an L of light on the two edges that
  // face the light and a reverse L of dark on the other two, like a bevel
  const id = "vb" + VB_N++, h = y1 - y0, N = 7;
  CLIPS.push(`<clipPath id="${id}c"><path d="${d}"/></clipPath>`);
  let s = `<g clip-path="url(#${id}c)">`;
  for (let i = 0; i < N; i++) {
    const t = ((i + 0.5) / N * 2 - 1) * flip, b = Math.asin(Math.max(-1, Math.min(1, t * k))), n = [0, Math.sin(b), Math.cos(b)];
    const dot = Math.max(0, n[1] * lv[1] + n[2] * lv[2]), q = Math.min(ramp.length - 2, Math.round(dot * (ramp.length - 2)));      // fills use the five lower tones; the brightest is kept for the L
    s += `<rect x="${f(x0)}" y="${f(y0 + i * h / N - 0.01)}" width="${f(x1 - x0)}" height="${f(h / N + 0.02)}" fill="${ramp[q]}"/>`;
  }
  const e = 0.32, litL = lv[0] <= 0, litT = Math.abs(lv[1]) < 0.05 ? true : lv[1] < 0;
  const vx = (left) => `<rect x="${f(left ? x0 : x1 - e)}" y="${f(y0)}" width="${f(e)}" height="${f(h)}"/>`;
  const hz = (top) => `<rect x="${f(x0)}" y="${f(top ? y0 : y1 - e)}" width="${f(x1 - x0)}" height="${f(e)}"/>`;
  s += `<g fill="${ramp[0]}">${vx(!litL)}${hz(!litT)}</g><g fill="${ramp[ramp.length - 1]}">${vx(litL)}${hz(litT)}</g>`;
  return s + `</g>`;
}
const barrel = (...a) => (STYLE === "engineer" ? barrelEngineer(...a) : barrelMiyazaki(...a));
function vaultEngineer({ W = 19.8, y0 = 0, span = 46, sy = 1, L = 225, H = 40, ramp, ink = null, inkW = 0.22, deep = false, endShape = null }) {
  const lv = [Math.cos(rad(H)) * Math.cos(rad(L)), Math.cos(rad(H)) * Math.sin(rad(L)) * sy, Math.sin(rad(H))];
  const pitch = 6.4, out = [];
  for (let k = 0, y = y0; y + pitch <= span + 0.01; k++, y += pitch) {
    const w = Math.max(16, W - k * 0.45), mid = w * 0.36, g = 0.18, kk = 0.99;      // steeper cylinders (17:40)
    const a = sy * y, b = sy * Math.min(span, y + pitch), top = Math.min(a, b), bot = Math.max(a, b);
    const parts = [
      [-w / 2, -mid / 2 - g / 2, [0.6, 0.12, 0.12, 0.6]],
      [mid / 2 + g / 2, w / 2, [0.12, 0.6, 0.6, 0.12]],
      [-mid / 2 + g / 2, mid / 2 - g / 2, [0.25, 0.25, 0.25, 0.25]],
    ];
    for (const [pi, [x0, x1, rr]] of parts.entries()) {
      const d = rrect4(x0, top, x1, bot, rr);
      out.push(barrel(d, x0, top, x1, bot, kk, ramp, lv, 1));
      // the links round off across the bracelet too (18:20): each outer link's outer quarter one step lighter if it
      // faces the light, two steps darker if not; the polished middle link a step brighter all over
      if (pi < 2) { const side = pi === 0 ? -1 : 1, lit = lv[0] * side > 0.05, wq = (x1 - x0) * 0.3, xa = side < 0 ? x0 : x1 - wq;
        out.push(`<path d="${d}" fill="none"/><g clip-path="url(#vb${VB_N - 1}c)"><rect x="${f(xa)}" y="${f(top)}" width="${f(wq)}" height="${f(bot - top)}" fill="${lit ? "#fff" : "#000"}" fill-opacity="${lit ? 0.16 : 0.3}"/></g>`); }
      else out.push(`<g clip-path="url(#vb${VB_N - 1}c)"><rect x="${f(x0)}" y="${f(top)}" width="${f(x1 - x0)}" height="${f(bot - top)}" fill="#fff" fill-opacity="0.1"/></g>`);
      if (ink) out.push(`<path d="${d}" fill="none" stroke="${ink}" stroke-width="${inkW}" stroke-linejoin="round"/>`);
    }
    // the row casts one hard band onto its neighbour on the side away from the light
    { const down = lv[1] < 0 ? 1 : -1, yc = down * sy > 0 ? bot : top; out.push(`<rect x="${f(-w / 2)}" y="${f(down * sy > 0 ? yc : yc - 0.9)}" width="${f(w)}" height="0.9" fill="#000" fill-opacity="0.22"/>`); }
    out.push(`<path d="M${f(-w / 2 + 0.3)} ${f(sy > 0 ? bot : top)}H${f(w / 2 - 0.3)}" stroke="#141516" stroke-opacity="${ink ? 0.9 : 0.6}" stroke-width="${ink ? inkW * 1.6 : 0.45}"/>`);
  }
  return out.join("");
}
function vaultMiyazaki({ W = 19.8, y0 = 0, span = 46, sy = 1, L = 225, H = 40, ramp, ink = null, inkW = 0.22, deep = false, endShape = null }) {
  const lv = [Math.cos(rad(H)) * Math.cos(rad(L)), Math.cos(rad(H)) * Math.sin(rad(L)) * sy, Math.sin(rad(H))];
  const pitch = 6.4, out = [];
  for (let k = 0, y = y0; y + pitch <= span + 0.01; k++, y += pitch) {
    const w = Math.max(16, W - k * 0.45), mid = w * 0.36, g = 0.18, kk = 0.99;      // steeper cylinders (17:40)
    const a = sy * y, b = sy * Math.min(span, y + pitch), top = Math.min(a, b), bot = Math.max(a, b);
    const parts = [
      [-w / 2, -mid / 2 - g / 2, [0.6, 0.12, 0.12, 0.6]],
      [mid / 2 + g / 2, w / 2, [0.12, 0.6, 0.6, 0.12]],
      [-mid / 2 + g / 2, mid / 2 - g / 2, [0.25, 0.25, 0.25, 0.25]],
    ];
    for (const [x0, x1, rr] of parts) {
      const d = rrect4(x0, top, x1, bot, rr);
      out.push(barrel(d, x0, top, x1, bot, kk, ramp, lv, 1));
      if (ink) out.push(`<path d="${d}" fill="none" stroke="${ink}" stroke-width="${inkW}" stroke-linejoin="round"/>`);
    }
    // the row casts one hard band onto its neighbour on the side away from the light
    { const down = lv[1] < 0 ? 1 : -1, yc = down * sy > 0 ? bot : top; out.push(`<rect x="${f(-w / 2)}" y="${f(down * sy > 0 ? yc : yc - 0.9)}" width="${f(w)}" height="0.9" fill="#000" fill-opacity="0.22"/>`); }
    out.push(`<path d="M${f(-w / 2 + 0.3)} ${f(sy > 0 ? bot : top)}H${f(w / 2 - 0.3)}" stroke="#141516" stroke-opacity="${ink ? 0.9 : 0.6}" stroke-width="${ink ? inkW * 1.6 : 0.45}"/>`);
  }
  return out.join("");
}
const vaultBracelet = (o) => (STYLE === "engineer" ? vaultEngineer(o) : vaultMiyazaki(o));
function linksBracelet({ W = 19.8, y0 = 0, span = 46, sy = 1, L = 225, H = 40, ramp, ink = null, inkW = 0.22 }) {
  const lv = [Math.cos(rad(H)) * Math.cos(rad(L)), Math.cos(rad(H)) * Math.sin(rad(L)) * sy, Math.sin(rad(H))];
  const h = 4.4, g = 0.15, mid = W * 0.46, out = [`<rect x="${f(-W / 2 + 0.3)}" y="${f(Math.min(sy * y0, sy * span))}" width="${f(W - 0.6)}" height="${f(Math.abs(span - y0))}" fill="${ramp[0]}"/>`];      // the pins and the dark between the barrels: no floor shows through
  const piece = (x0, x1, a, b) => { const top = Math.min(sy * a, sy * b), bot = Math.max(sy * a, sy * b), r = Math.min(0.9, (bot - top) * 0.3), d = rrect4(x0, top, x1, bot, [r, r, r, r]);
    out.push(barrel(d, x0, top, x1, bot, 0.99, ramp, lv, 1)); if (ink) out.push(`<path d="${d}" fill="none" stroke="${ink}" stroke-width="${inkW}" stroke-linejoin="round"/>`); };
  piece(-mid / 2 + g / 2, mid / 2 - g / 2, y0, y0 + h / 2 - g);      // a half middle barrel against the end link, so no floor shows there
  for (let y = y0; y + h / 2 <= span + 0.01; y += h) {
    const b = Math.min(span, y + h - g);
    piece(-W / 2, -mid / 2 - g / 2, y, b); piece(mid / 2 + g / 2, W / 2, y, b);      // the outer barrels
    const c0 = y + h / 2, c1 = Math.min(span, c0 + h - g); if (c1 > c0 + 0.5) piece(-mid / 2 + g / 2, mid / 2 - g / 2, c0, c1);      // the middle one, half a step on
  }
  return out.join("");
}
function braceletSVG(C, L, span) {
  // the end link (18:06): one solid piece made for this case — exactly as wide as the gap between the lugs, its inner
  // edge following the case, its outer edge square just past the lug tips; the rows of links start from it
  const R = C.od / 2, lw = C.lugw, W = C.lugw - 0.2, yE = C.l2l / 2 + 0.8, ramp = ramp6(C.metal);
  const lv0 = (sy) => [Math.cos(rad(SUN_H)) * Math.cos(rad(L)), Math.cos(rad(SUN_H)) * Math.sin(rad(L)) * sy, Math.sin(rad(SUN_H))];
  let out = "";
  for (const sy of [-1, 1]) {
    const Rr = R + 0.1, arc = [];
    for (let j = 0; j <= 16; j++) { const x = -lw / 2 + lw * j / 16; arc.push([x, sy * (Math.sqrt(Rr * Rr - x * x) - 0.15)]); }
    const end = "M" + [...arc, [lw / 2, sy * yE], [-lw / 2, sy * yE]].map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
    const ys = [sy * (Math.sqrt(Rr * Rr - lw * lw / 4) - 0.15), sy * (Rr - 0.15), sy * yE], top = Math.min(...ys), bot = Math.max(...ys);
    out += barrel(end, -lw / 2, Math.min(top, bot), lw / 2, Math.max(top, bot), 0.99, ramp, lv0(sy), 1);
    const mid = W * 0.36;
    for (const x of [-mid / 2, mid / 2]) out += `<path d="M${f(x)} ${f(sy * (Math.sqrt(Rr * Rr - x * x) - 0.15))}V${f(sy * yE)}" stroke="${ramp[0]}" stroke-width="0.22"/>`;
    out += `<path d="M${arc.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="0.5"/>`;      // where it meets the case
    out += INKB ? `<path d="${end}" fill="none" stroke="${INKB}" stroke-width="0.22" stroke-linejoin="round"/>` : "";
    OUTT.push(end);
    out += (BRACELET_KIND === "links" ? linksBracelet : vaultBracelet)({ W, y0: yE, span, sy, L, H: SUN_H, ramp, ink: INKB });
    for (let k = 0, y = yE; y + 6.4 <= span + 0.01; k++, y += 6.4) { const w = Math.max(16, W - k * 0.45); OUTT.push(`M${f(-w / 2)} ${f(sy * y)}H${f(w / 2)}V${f(sy * (y + 6.4))}H${f(-w / 2)}Z`); }
  }
  return out;
}

// ── shadows: one rule ──
const FLAT = new Map();
function polylines(d) {
  if (FLAT.has(d)) return FLAT.get(d);
  const P = PK.FromSVGString(d), cmds = P.toCmds(); P.delete();
  const out = []; let cur = null, prev = null;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  for (const c of cmds) {
    const v = c[0], p = []; for (let k = 1; k + 1 < c.length; k += 2) p.push([c[k], c[k + 1]]);
    if (v === 0) { cur = [p[0]]; out.push(cur); prev = p[0]; }
    else if (v === 1) { cur.push(p[0]); prev = p[0]; }
    else if (v === 2 || v === 3) { const w = v === 3 ? c[5] : 1; for (let i = 1; i <= 8; i++) { const t = i / 8, a = (1 - t) * (1 - t), b = 2 * w * t * (1 - t), e = t * t, s = a + b + e; cur.push([(a * prev[0] + b * p[0][0] + e * p[1][0]) / s, (a * prev[1] + b * p[0][1] + e * p[1][1]) / s]); } prev = p[1]; }
    else if (v === 4) { for (let i = 1; i <= 8; i++) { const t = i / 8, q = lerp(lerp(lerp(prev, p[0], t), lerp(p[0], p[1], t), t), lerp(lerp(p[0], p[1], t), lerp(p[1], p[2], t), t), t); cur.push(q); } prev = p[2]; }
    else if (v === 5 && cur) { cur.push(cur[0]); }
  }
  FLAT.set(d, out); return out;
}
function sweep(d, v) {
  let quads = "";
  for (const line of polylines(d)) for (let i = 1; i < line.length; i++) {
    const p = line[i - 1], q = line[i], cross = (q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0];
    if (Math.abs(cross) < 1e-6) continue;      // an edge along the light sweeps nothing
    const [a, b] = cross > 0 ? [p, q] : [q, p];      // every parallelogram wound the same way, so none cancels another under nonzero fill
    quads += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(b[0] + v[0])} ${f(b[1] + v[1])}L${f(a[0] + v[0])} ${f(a[1] + v[1])}Z`;
  }
  return `<path d="${d}"/><path d="${d}" transform="translate(${f(v[0])} ${f(v[1])})"/><path d="${quads}"/>`;
}
function silhouette(C) {
  const R = C.cushion ? C.cushion.a : C.od / 2, crown = rrectD(R - 1.2, -C.crown.w / 2, R + C.crown.h, C.crown.w / 2, 1.0);
  return [[C.cushion ? P(cushionPts(C.cushion.a, C.cushion.n)) : circle(R), 1], ...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => [(C.cushion ? cushionLug : lugPath)(C, sx, sy), 0.55])), [crown, 0.5]];      // the crown, as the lugs, smaller than the case (Okay, 22 Oct 2026)
}
function contact(C, L, strap, span, soft) {
  const u = [Math.cos(rad(L)), Math.sin(rad(L))], k = Math.tan(rad(40)) / Math.tan(rad(SUN_H)), off = [-u[0] * 0.9 * k, -u[1] * 0.9 * k];
  const w = C.lugw - 0.2, yc = C.l2l / 2 - 3.4, leather = strap.startsWith("leather");
  const area = OUTL_S.map((d) => `<path d="${d}"/>`).join("");      // the strap as drawn: the shadow stays on it, never beside it (22 Oct 2026)
  const id = "ct" + (BLOB_N++);
  CLIPS.push(`<clipPath id="${id}">${area}</clipPath>`);
  let h = `<g clip-path="url(#${id})"><g fill="#000" opacity="${f(SH_OP)}">${silhouette(C).map(([d, kk]) => sweep(d, [off[0] * 1.6 * kk, off[1] * 1.6 * kk])).join("")}</g></g>`;      // the parts swept, as the ground shadow (22 Oct 2026)
  const ink = soft ? `stroke="#000" stroke-opacity="0.4" stroke-width="0.35"` : `stroke="${INK}" stroke-width="${LW}"`;
  for (const sy of [-1, 1]) {
    const tip = C.l2l / 2;
    if (!leather) h += `<path d="M${f(-w / 2)} ${f(sy * (tip - 2.6))}H${f(w / 2)}" stroke="#000" stroke-opacity="0.2" stroke-width="0.8"/><path d="M${f(-w / 2)} ${f(sy * (tip - 2.2))}H${f(w / 2)}" stroke="#fff" stroke-opacity="0.12" stroke-width="0.4"/>`;      // the nylon over the bar: a soft ridge
  }
  return h;
}
function silhouetteOutline(paths, L = 0) {
  // the whole watch joined into one shape (case, lugs, crown, strap or bracelet) and that one shape's edge drawn on top:
  // no masks, so every PDF viewer draws it the same (18:06)
  if (!paths.length) return "";
  const u = PK.FromSVGString(paths[0]);
  for (const d of paths.slice(1)) { const p = PK.FromSVGString(d); u.op(p, PK.PathOp.UNION); p.delete(); }
  const d = u.toSVGString(); u.delete();
  // lit by the light (18:26): one closed line round the metal only, its white from 0 on the side away from the light to 65 % on
  // the side facing it — a gradient along the light's direction across the watch
  const id = "og" + BLOB_N++, ux = Math.cos(rad(L)), uy = Math.sin(rad(L)), D = 24;
  CLIPS.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(-ux * D)}" y1="${f(-uy * D)}" x2="${f(ux * D)}" y2="${f(uy * D)}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.65"/></linearGradient>`);
  return `<path d="${d}" fill="none" stroke="url(#${id})" stroke-width="0.2" stroke-linejoin="round"/>`;
}
function sheet(key, strap, v, L, open = false, h = 40, dial = null, metal = null, size = 1) {
  WEAVE = strap.endsWith("-big") ? "weavebig" : "weave"; strap = strap.replace(/-big$/, "");
  SUN_H = h; CLIPS = [];
  const C = { ...scaleCase(CASES[key], size), key, dialOverride: dial, ...(metal ? { metal: METALS[metal] } : {}) }, span = open ? 260 : 64, Wd = 92, H = open ? 290 : 120, cy = open ? -18 : 0;
  OUTL_S = []; OUTT = OUTL_S;
  const strapSVG = strap === "bracelet" ? braceletSVG(C, L, open ? C.l2l / 2 + 84 : span) : strap.startsWith("leather") ? leatherSVG(C, L, strap.split("-")[1], open, span) : natoSVG(C, L, strap.split("-")[1], open, span);
  // shadow: everything's silhouette shifted away from the light, flat; the case casts further than the strap
  const off = (d) => [-Math.cos(rad(L)) * d, -Math.sin(rad(L)) * d];
  const k = Math.tan(rad(40)) / Math.tan(rad(h)), vCase = off(2.4 * k), vStrap = off(0.8 * k);      // a low sun casts longer
  // the shadow (Okay, 22 Oct 2026): every part's footprint swept along the light (sweep()), the strap as drawn (OUTL_S),
  // black at one opacity, painted once as a group — it darkens whatever it falls on and never doubles where parts overlap
  const blockShadow = `<g fill="#000" opacity="${f(SH_OP)}">` + OUTL_S.map((d) => sweep(d, vStrap)).join("") + silhouette(C).map(([d, kk]) => sweep(d, [vCase[0] * kk, vCase[1] * kk])).join("") + `</g>`;
  OUTL_C = []; OUTT = OUTL_C; const caseStr = caseSVG(C, v, L);
  const ribs = Object.entries({ ...NATO_SETS, ...NATO_MORE }).flatMap(([n, S]) => S.map((T, k) => `<pattern id="ribs-${n}-${k}" width="4" height="0.8" patternUnits="userSpaceOnUse"><rect width="4" height="0.3" fill="${T[0]}" fill-opacity="0.55"/></pattern>`)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="__VB__">
<defs>${"__CLIPS__"}<clipPath id="dial-${key}"><path d="${circle(C.opening)}"/></clipPath>${ribs}${TEXTURES}</defs>
<defs><radialGradient id="pool" cx="${f(Math.cos(rad(L)) * 6)}" cy="${f(Math.sin(rad(L)) * 6 + cy * 0)}" r="${open ? 240 : 52}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#c4beb1"/><stop offset="0.55" stop-color="#b3ad9f"/><stop offset="1" stop-color="#8d877c"/></radialGradient></defs>
<rect x="-300" y="-300" width="600" height="600" fill="url(#pool)"/>
${blockShadow}

${strapSVG}${strap === "bracelet" ? "" : contact(C, L, strap, span, STYLE === "miyazaki")}${caseStr}${STYLE === "miyazaki" && OUTLINE_ON ? silhouetteOutline(strap === "bracelet" ? [...OUTL_S, ...OUTL_C] : OUTL_C, L) : ""}
</svg>`;
}

/** the case round a dial drawn by Dial Tool (edit mode): its silhouette alone — the case, lugs and crown joined into one
 *  shape and its edge drawn as one faint line, no fills, no shadow, no strap (Okay, 23 Oct 2026: "Just a silhouette, very
 *  faint lines. no shadows, nothing"). `o`: kind (dress · field · diver · emre01) and d (the dial's diameter: the case
 *  scales to it). In the dial's space (mm, y up); its line a screen pixel at any zoom, in the canvas's ink (currentColor) */
export function frame(o) {
  const d = silhouetteOf(o.kind, sizeFor(o.kind in CASES ? o.kind : "dress", o.d));
  return `<g transform="scale(1 -1)"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></g>`;
}
/** the case, lugs and crown as one shape: the edge of every part of the case joined (Miyazaki's painter keeps each part's
 *  outline, blob), drawn without its dial, glass or flare; SVG path data in the drawing's space (mm, y down) */
function silhouetteOf(key, size) {
  use("miyazaki"); DIAL_IN = false; GLINT = "off"; OUTLINE_ON = false;
  const kind = key in CASES ? key : "dress";
  METALS.custom = METALS.steel; LEATHER.custom = LEATHER.brown;
  sheet(kind, "leather-custom", "own", 225, true, 40, "live", "custom", size);
  DIAL_IN = true; OUTLINE_ON = true;
  const u = PK.FromSVGString(OUTL_C[0]);
  for (const d of OUTL_C.slice(1)) { const p = PK.FromSVGString(d); u.op(p, PK.PathOp.UNION); p.delete(); }
  const d = u.toSVGString(); u.delete();
  return d;
}
/** a case's picture for a tile (show mode's Case, Okay, 23 Oct 2026: "Tiles with pictures"): its silhouette and its dial's
 *  opening, at its published size, in a box `w` × `h` points; the line a point wide, in the tile's ink */
const TILES = {};
export function tilePicture(key, w = 38, h = 27) {
  if (TILES[key]) return TILES[key];
  const C = scaleCase(CASES[key] || CASES.dress, 1), d = silhouetteOf(key, 1), b = caseBox(key, 1), m = 1.15;
  const s = Math.min(w / (b.w * m), h / (b.h * m));
  return (TILES[key] = `<svg viewBox="${f(-w / 2 / s)} ${f(-h / 2 / s)} ${f(w / s)} ${f(h / s)}" width="${w}" height="${h}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><path d="${d}" vector-effect="non-scaling-stroke"/><path d="${circle(C.opening)}" vector-effect="non-scaling-stroke"/></svg>`);
}

// ── one drawing for the page (Dial Show Case, show mode) ──
const DETAIL = 31, FULL = { w: 126 / 1.2, h: 308 / 1.2 }, DIAL = 19.5;      // 17:15: the whole watch at 120 %, centred
const STYLES = {
  engineer: { floor: "#b9b3a6", ramp: [1.19, 1.11, 0.875], shadow: 0.3, blur: `<filter id="flare" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.9"/></filter>` },
  miyazaki: { floor: "#877f6d", ramp: [1.19, 1.12, 0.88], shadow: 0.3, blur: `<filter id="flare" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="1.6"/></filter>` },
};
const hsl = (h, k) => { const [hh, s, l] = hex2hsl(h); return hsl2hex([hh, s, Math.min(0.97, l * k)]); };
const tones = (h, [up, down]) => [hsl(h, up), h, hsl(h, down)];
/** the colours as the engine has them before anything is changed: what the page's colour list shows first */
export function presets(style) { use(style); return { floor: STYLES[style].floor, metals: Object.fromEntries(Object.entries(METALS).map(([k, T]) => [k, T[1]])),
  leather: Object.fromEntries(Object.entries(LEATHER).map(([k, T]) => [k, T[1]])),
  nato: Object.fromEntries(Object.entries({ ...NATO_SETS, ...NATO_MORE }).map(([k, S]) => [k, S.map((T) => T[1])])) }; }
/** the ground's colour at the drawing's edge: what lies beyond it on the screen */
export const edge = (floor, view, style) => (view === "detail" ? hsl(floor, STYLES[style].ramp[2]) : floor);
/** the size that puts a case round a dial of diameter `d` (Okay, 22 Oct 2026: "Cases snap to dials. Size of dial determines"): the
 *  published case's opening — less the rehaut on a diver — scaled to the dial */
export const sizeFor = (key, d) => { const C = CASES[key] || CASES.dress; return d / (C.dial - (C.insert ? 2 * REHAUT : 0)); };
export const caseBox = (key, size) => { const C = scaleCase(CASES[key], size); return { h: C.l2l, w: (C.cushion ? 2 * C.cushion.a : C.rails ? Math.max(C.od, C.lugw + 2 * C.lugT) : C.od) + 2 * C.crown.h, dial: C.dial }; };
export const STRIPE_COUNT = (name) => new Set((STRIPES[name] || [[0, 1, 0]]).map((x) => x[2])).size;
export function draw(o) {
  use(o.style || "miyazaki"); const STYLE_ = STYLES[STYLE]; OUTLINE_ON = o.outline !== false;
  DIALS = [{ name: "live", d: o.d, own: true, items: o.items }];
  HANDS_A = o.A; FLARE_KIND = o.flare; INK_K = o.ink ?? 6; FL = o.fl; GLASS = o.glass; INSERT = o.insert; SHD = o.shadow ?? 1; HAND_BEVEL = Boolean(o.bevels);
  // a colour that is one of the engine's own keeps that entry's three tones; any other gets three made from it
  const own = (tabs, c, k) => tabs.flatMap((t) => Object.entries(t).filter(([n]) => n !== "custom").flatMap(([, v]) => (typeof v[0] === "string" ? [v] : v))).find((T) => T[1] === c) || tones(c, k);
  METALS.custom = own([METALS], o.metal, [1.35, 0.81]);
  LEATHER.custom = own([LEATHER], o.leather, [1.18, 0.82]);
  NATO_MORE.custom = o.natoColours.map((c) => own([NATO_SETS, NATO_MORE], c, [1.18, 0.82]));
  STRIPES.custom = STRIPES[o.nato] || [[0, 1, 0]];
  const two = o.floor2 && o.floor2 !== o.floor;
  SH_OP = Math.min(1, STYLE_.shadow * SHD);      // the Shadows slider scales one opacity (Okay, 22 Oct 2026)
  BRACELET_KIND = o.strap === "links" ? "links" : "vault";      // the diver's two bracelets
  const strap = o.strap === "bracelet" || o.strap === "links" ? "bracelet" : o.strap + "-custom";
  const make = (mode) => { GLINT = mode; return sheet(o.key, strap, "own", o.L, true, o.h, "live", "custom", o.size).replace("__CLIPS__", CLIPS.join("") + STYLE_.blur); };
  const R = STYLE_.ramp, vb = (x, y, w, h) => `${f(x)} ${f(y)} ${f(w)} ${f(h)}`;
  const box = o.view === "full" ? [-FULL.w / 2, -FULL.h / 2, FULL.w, FULL.h] : [-DETAIL, -DETAIL, 2 * DETAIL, 2 * DETAIL];      // the exported picture's frame
  // two colours: a gradient at 45°, the first at the top left, the second at the bottom right of the drawing's box
  const e = (box[2] + box[3]) / 4, cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
  const lin = two ? `<linearGradient id="floorg" gradientUnits="userSpaceOnUse" x1="${f(cx - e)}" y1="${f(cy - e)}" x2="${f(cx + e)}" y2="${f(cy + e)}"><stop offset="0" stop-color="${o.floor}"/><stop offset="1" stop-color="${o.floor2}"/></linearGradient>` : "";
  const ground = (svg, fill) => svg.replace('<rect x="-300" y="-300" width="600" height="600" fill="url(#pool)"/>', `${lin ? `<defs>${lin}</defs><rect x="-300" y="-300" width="600" height="600" fill="url(#floorg)"/>` : ""}<rect x="-300" y="-300" width="600" height="600" fill="${fill}"/>`);
  if (o.lighting !== "flat") {      // dramatic: the spotlight and the flare, in any view (the view is only how far in)
    // the spotlight: on one colour its own lighter and darker tones; over a gradient, a light and a dark laid over it
    const stops = two ? `<stop offset="0" stop-color="#fff" stop-opacity="0.24"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0.1"/>`
      : `<stop offset="0" stop-color="${hsl(o.floor, R[0])}"/><stop offset="0.55" stop-color="${hsl(o.floor, R[1])}"/><stop offset="1" stop-color="${hsl(o.floor, R[2])}"/>`;
    const pool = `<radialGradient id="pool" cx="${f(Math.cos(rad(o.L)) * 6)}" cy="${f(Math.sin(rad(o.L)) * 6)}" r="24" gradientUnits="userSpaceOnUse">${stops}</radialGradient>`;
    return ground(make(o.flareOn ? "flare" : "off").replace(/<radialGradient id="pool"[^>]*>.*?<\/radialGradient>/s, pool), "url(#pool)").replace("__VB__", vb(...box));
  }
  return ground(make("off"), two ? "none" : o.floor).replace("__VB__", vb(...box));
}
