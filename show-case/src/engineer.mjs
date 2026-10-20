let GLINT = "plain", INK_K = +(process.env.INK || 0), INK_N = 0, HAND_BEVEL = Boolean(process.env.HB), FLARE_TINT = "#ffffff", FLARE_SCALE = 1, SH_OVR = null, FLARE_KIND = "arc", DIVOT = "cut", SEC = null;
// Field and dress, true to published measures (20 Oct 2026, 15:11). Technical line drawing; every item in three tones
// (light, body, shade) chosen per facet by where the light comes from, so the highlights and shadows move with it.
//   Field — Hamilton Khaki Field Mechanical 38 (H69439931): 38 mm, 47 lug to lug, 20 between the lugs, 9.5 thick,
//           drilled lugs, crown at 3 (WatchBase; Two Broke Watch Snobs' review). Dial after MIL-W-46374: black, white
//           1–12, 13–24 inside in a smaller size.
//   Dress — Patek Philippe Calatrava 5196: 37 mm, 44 lug to lug, 20 between the lugs, 8 thick (Delugs' spec table);
//           a stepped polished bezel, slim lugs, a small crown.
// mm, y down. Usage: node draw2.mjs → many SVGs + PNG via playwright elsewhere.
import fs from "fs";
import { createRequire } from "module";
const requireW = createRequire("/home/claude/dial-tool/web/");
const PK = await requireW("pathkit-wasm/bin/pathkit.js")({ wasmBinary: fs.readFileSync(requireW.resolve("pathkit-wasm/bin/pathkit.wasm")) });
const DIALS = JSON.parse(fs.readFileSync("/home/claude/cases/dials-cases.json", "utf8"));
const f = (v) => +(+v).toFixed(3), rad = (d) => d * Math.PI / 180;
// ── 18:06 helpers: colour in HSL, a notched bezel edge ──
const hex2hsl = (h) => { const n = parseInt(h.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let hh = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; } return [hh, s, l]; };
const hsl2hex = ([h, s, l]) => { s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join(""); };
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
/** the rim's lands: one wedge per divot pitch (R − depth … R), to be clipped by the divoted outline and shaded by its face */
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
const INKB = "#4d4d4d";
const INK = "#4d4d4d";                                  // outlines at 70 % black: 15 % lighter than the last batch (16:10)
const LW = 0.22;                                         // every dark outline this wide; no line on a drawing thinner (15:37: the thicker side of the last batch)                                  // outlines at 85 % black (15:21)
const STEEL = ["#dcdedb", "#a3a5a1", "#868885"];      // the light tone near white: metal shines more (16:10)          // light · body · shade (lower contrast, 15:21)
const GOLD = ["#e6d3a3", "#b69c66", "#957d50"];
const ALU = ["#cfd2d5", "#9da1a4", "#83878b"];             // bead-blasted aluminium: matte, close tones
const ROSE = ["#f3d9c8", "#d9ae94", "#a3725b"];
const LEATHER = { tan: ["#b0835a", "#946b47", "#795537"], brown: ["#82614a", "#6c4f3a", "#59412f"], black: ["#4d4c4d", "#3e3d3e", "#323132"] };
const NATO_SETS = { bond: [["#46506a", "#3a4459", "#30384a"], ["#8a4148", "#74343b", "#5e2a30"], ["#aeaba3", "#99968f", "#83817b"]], g10: [["#4d596b", "#414c5d", "#363f4e"], ["#4d596b", "#414c5d", "#363f4e"], ["#4d596b", "#414c5d", "#363f4e"]] };
const METALS = { steel: ["#dcdedb", "#a3a5a1", "#868885"], gold: ["#e6d3a3", "#b69c66", "#957d50"], alu: ["#cfd2d5", "#9da1a4", "#83878b"], bronze: ["#dcb185", "#a9784c", "#7e5636"] };
let OUTL = [], OUTLINES = false, OUTL_S = [], OUTL_C = [], OUTT = [];
// ═══ 16:50 — the mix: more metals, recoloured dials, more NATOs and leathers, the vault bracelet (D's light, E's gold),
// a light glyph on every drawing ═══
const tri = (a) => [a, a, a];
const NATO_MORE = {
  regimental: [["#2f4a3a", "#263d30", "#1e3026"], ["#2a3550", "#222b42", "#1b2235"], ["#b28a3e", "#957332", "#775c28"]],
  olive: tri(["#6a6c48", "#57593a", "#45472e"]),
  grey: tri(["#7b7d80", "#66686b", "#525457"]),
  khaki: [["#a99a72", "#8f815e", "#76694b"], ["#4b5a3a", "#3e4b30", "#323c27"], ["#a99a72", "#8f815e", "#76694b"]],
  blackgrey: [["#3a3b3d", "#2f3032", "#252628"], ["#8e9093", "#76787b", "#5f6164"], ["#3a3b3d", "#2f3032", "#252628"]],
};
const STRIPES = {
  bond: [[0, 0.3, 0], [0.3, 0.42, 1], [0.42, 0.58, 2], [0.58, 0.7, 1], [0.7, 1, 0]],
  regimental: [[0, 0.2, 0], [0.2, 0.3, 2], [0.3, 0.7, 1], [0.7, 0.8, 2], [0.8, 1, 0]],
  khaki: [[0, 0.38, 0], [0.38, 0.62, 1], [0.62, 1, 2]],
  blackgrey: [[0, 0.25, 0], [0.25, 0.75, 1], [0.75, 1, 2]],
};
const mixc = (a, b, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");
/** a metal's three tones as six, dark to light, for the vault bracelet */
// steel's ramp built on gold's (18:06: only the gold bracelet passed): the same six lightnesses, each in the metal's own hue
const ramp6g = (T) => [mixc(T[2], "#000000", 0.62), mixc(T[2], "#000000", 0.3), T[2], T[1], mixc(T[0], "#ffffff", 0.25), mixc(T[0], "#ffffff", 0.8)];
const ramp6 = (T) => { const grey = hex2hsl(T[1])[1] < 0.12;      // a grey metal's own tones sit close together: its darks go deeper (18:20: the steel bracelet read flat)
  return [mixc(T[2], "#000000", grey ? 0.66 : 0.45), mixc(T[2], "#000000", grey ? 0.4 : 0.22), mixc(T[2], "#000000", grey ? 0.15 : 0), T[1], T[0], mixc(T[0], "#ffffff", 0.45)]; };      // the case's own tones (18:16: the bracelet matched to the body); the brightest only for the L
/** a dial spec "Name|plate|ink|accent|marks": the dial recoloured — the plate; every pale or dark part the ink; every
 *  coloured part (red seconds, a lume colour) the accent; `marks` (if given) the rings' marks and numerals */
function parseDial(spec) { const [name, plate, ink, accent, marks] = (spec || "").split("|"); return { name, plate, ink, accent, marks }; }
function recolour(x, R) {
  if (!R.plate) return null;
  if (x.role === "plate") return R.plate;
  if (x.role === "date disc") return R.accent || R.ink;
  if (x.role === "date number" || x.role === "date picture") return R.plate;
  const c = [1, 3, 5].map((i) => parseInt(x.f.slice(i, i + 2), 16) / 255), mx = Math.max(...c), mn = Math.min(...c), sat = mx === 0 ? 0 : (mx - mn) / mx;
  if (sat > 0.45) return R.accent || R.ink;
  if (R.marks && x.role === "ring") return R.marks;
  return R.ink;
}
/** the light: a little sun-dial glyph at the top right — the circle the horizon, the dot the sun (nearer the middle the
 *  higher it stands), and its height in degrees */
function lightGlyph(Wd, H, cy, L, h) {
  const cx = Wd / 2 - 9, cyy = -H / 2 + cy + 9, r = 5.5, d = r * Math.cos(rad(h));
  return `<g font-family="Helvetica, Arial" font-size="2.2" fill="#4a463f"><circle cx="${f(cx)}" cy="${f(cyy)}" r="${r}" fill="none" stroke="#4a463f" stroke-opacity="0.55" stroke-width="0.25"/><path d="M${f(cx - r)} ${f(cyy)}H${f(cx + r)}M${f(cx)} ${f(cyy - r)}V${f(cyy + r)}" stroke="#4a463f" stroke-opacity="0.2" stroke-width="0.2"/><path d="M${f(cx)} ${f(cyy)}L${f(cx + Math.cos(rad(L)) * d)} ${f(cyy + Math.sin(rad(L)) * d)}" stroke="#4a463f" stroke-opacity="0.5" stroke-width="0.25"/><circle cx="${f(cx + Math.cos(rad(L)) * d)}" cy="${f(cyy + Math.sin(rad(L)) * d)}" r="1.1" fill="#e2a13a"/><text x="${f(cx)}" y="${f(cyy + r + 3)}" text-anchor="middle">${h}° high</text></g>`;
}

// ═══ 17:04 — sizes, soft contact shadows, the big knit, case and strap outlines as whole silhouettes ═══
/** a case at another size: every measure × k (a ladies' Calatrava, a small and a big field watch) */
function scaleCase(C, k) {
  if (k === 1) return C;
  const s = (v) => (typeof v === "number" ? v * k : Array.isArray(v) ? v.map(s) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, ["n", "coin", "knurl", "at"].includes(a) ? b : s(b)])) : v);
  const out = { ...C };
  for (const key of ["od", "l2l", "lugw", "lugT", "flare", "bands", "opening", "dial", "crown", "insert", "cushion", "cushionBevel"]) if (key in C) out[key] = s(C[key]);
  return out;
}
/** a soft shadow: the same shapes laid N times, each nudged a little further and fainter — a rounded fall-off */
function softShadow(paths, off, opacity, N = 6) {
  let h = "";
  for (let i = 1; i <= N; i++) h += `<g transform="translate(${f(off[0] * i / N)} ${f(off[1] * i / N)})" fill="#000" fill-opacity="${f(opacity / N * 1.6)}">${paths}</g>`;
  return h;
}
/** a whole silhouette's outline (17:04): the parts' strokes doubled, then the parts themselves masked out, so only the
 *  outside half of the line is left — one line round the union, nothing inside; the group at 50 % so crossings don't
 *  add up. 1 px on the page whatever the scale */
function silhouetteOutline(paths) {
  if (!paths.length) return "";
  const id = "so" + (BLOB_N++);
  CLIPS.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="-400" y="-400" width="800" height="800"><rect x="-400" y="-400" width="800" height="800" fill="#fff"/>${paths.map((d) => `<path d="${d}" fill="#000"/>`).join("")}</mask>`);
  return `<g opacity="0.5"><g mask="url(#${id})" fill="none" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round">${paths.map((d) => `<path d="${d}" vector-effect="non-scaling-stroke"/>`).join("")}</g></g>`;
}
let WEAVE = "weave";

const P = (pts) => "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
const circle = (r, cx = 0, cy = 0) => `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
const stroke = (d, sw = LW, extra = "") => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
let CLIPS = [], clipN = 0;
/** a filled, outlined shape with one dark line of shading just inside its outline (15:21), in `inner` (the item's shade) */
const shape = (d, c, sw = LW, inner = null) => {
  sw = LW;
  if (!inner || c === "none") return `<path d="${d}" fill="${c}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const id = "in" + clipN++; CLIPS.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return `<path d="${d}" fill="${c}"/><path d="${d}" fill="none" stroke="${inner}" stroke-width="${f(sw * 3)}" stroke-linejoin="round" clip-path="url(#${id})"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
};
const flat = (d, c) => `<path d="${d}" fill="${c}"/>`;
/** a facet's tone: its normal points `phi` (deg, screen: 0 = right, 90 = down), tilted up by `tilt` (0 flat … 1 upright);
 *  the light comes from `L` (deg, same convention) at 40° high. Three tones only. */
let SUN_H = 40;                                            // the sun's height, degrees (set per drawing)
function tone(T, phi, tilt, L) {
  const s = Math.cos(rad(phi - L)) * tilt * Math.cos(rad(SUN_H)) / Math.cos(rad(40));      // + : faces the light; a high sun flattens it
  return s > 0.5 ? T[0] : s < 0.05 ? T[2] : T[1];      // more darks than lights (15:43): only facets turned well toward the sun light up
}
/** an annulus between r0 and r1 sloping outward (normal out) or inward, in N wedges, each its tone, merged */
function sloped(r0, r1, T, L, out = 1, tilt = 1, N = 96) {
  let html = "", run = null;
  const wedge = (a0, a1) => `M${f(Math.cos(a0) * r1)} ${f(Math.sin(a0) * r1)}A${f(r1)} ${f(r1)} 0 0 1 ${f(Math.cos(a1) * r1)} ${f(Math.sin(a1) * r1)}L${f(Math.cos(a1) * r0)} ${f(Math.sin(a1) * r0)}A${f(r0)} ${f(r0)} 0 0 0 ${f(Math.cos(a0) * r0)} ${f(Math.sin(a0) * r0)}Z`;
  const tones = Array.from({ length: N }, (_, k) => tone(T, (k + 0.5) / N * 360 + (out > 0 ? 0 : 180), tilt, L));
  let start = 0; while (start < N && tones[start] === tones[(start + N - 1) % N]) start++;
  if (start === N) return flat(circle(r1) + circle(r0), tones[0]).replace("<path", '<path fill-rule="evenodd"');
  for (let k = 0; k < N; k++) {
    const i = (start + k) % N, t = tones[i];
    if (!run || run.t !== t) { if (run) html += flat(wedge(run.a0, run.a1), run.t); run = { t, a0: i / N * 2 * Math.PI, a1: (i + 1) / N * 2 * Math.PI }; }
    else run.a1 = run.a0 + (k - (run.k0 ?? 0) + 1) / N * 2 * Math.PI, run.a1 = (i + 1) / N * 2 * Math.PI + (i + 1 < start ? 2 * Math.PI : 0);
  }
  html += flat(wedge(run.a0, run.a1 < run.a0 ? run.a1 + 2 * Math.PI : run.a1), run.t);
  return html + stroke(circle(r0), 0.12) + stroke(circle(r1), 0.12);
}
// ── the cases ──
const CASES = {
  field: {
    // a cushion case with sharp angles, after the 1939 military cushions (Eterna's reissue: 40 mm across, 11.7 high);
    // lug to lug and lug width are assumptions (46, 20) — no drawing found that the workspace could open
    name: "Field · military cushion, 1939 · aluminium", cushion: { a: 20, n: 4.2 }, od: 40, l2l: 46, lugw: 20, lugT: 3.0, metal: ALU,
    bands: [[17.6, 16.4, 1, 1]], opening: 15.8, dial: 31.4, crown: { at: 0, w: 6.2, h: 3.0, knurl: 9 }, drilled: false, dialName: "Fat field",
    cushionBevel: 1.3,
  },
  diver: {
    name: "Diver · Seiko SPB143 · steel", od: 40.5, l2l: 47.6, lugw: 20, lugT: 2.9, flare: 3.6, metal: STEEL,
    bands: [], insert: { od: 40.0, id: 32.2, coin: 60 }, opening: 15.4, dial: 30.8, crown: { at: 0, w: 6.4, h: 3.0, knurl: 9 }, drilled: false, dialName: "Quiet diver",
  },
  dress: {
    name: "Dress · Calatrava 5196 · gold", od: 37, l2l: 44, lugw: 20, lugT: 1.9, flare: 3.0, metal: GOLD,
    bands: [[18.5, 18.1, 1, 0.4], [18.1, 17.3, 1, 1], [17.3, 16.8, 1, 0.5], [16.8, 16.2, 1, 1]],     // stepped: two polished steps
    opening: 15.9, dial: 31.6, crown: { at: 0, w: 4.4, h: 2.2, knurl: 7 }, drilled: false, dialName: "Dress roman",
  },
};
// dials: the baked ones, recoloured for light, dark and red
const VARIANTS = {
  // the diver's batons: a pop of colour (15:47) — warm orange lume on dark and light dials, cream on the red one
  diver: { dark: { plate: "#1f2023", map: { "#e6e6db": "#e08a3c" } }, light: { plate: "#dcd8cc", map: { "#e6e6db": "#d0702a", "#bfbfb8": "#5a5b5e", "#d1d4d1": "#3a3b3e", "#d9d9d1": "#3a3b3e" } }, red: { plate: "#6c1b1d", map: {} } },
  field: {
    dark: { plate: "#17171a", map: {} },
    light: { plate: "#e6e0ce", map: { "#ede8db": "#1d1d1f" } },
    red: { plate: "#7a1d1f", map: {} },
  },
  dress: {
    light: { plate: "#f2eee1", map: {} },
    dark: { plate: "#16171b", map: { "#211f24": "#ece6d4", "#faf7ed": "#16171b" } },
    red: { plate: "#6e1418", map: { "#211f24": "#efe3c8", "#faf7ed": "#6e1418", "#a61f1f": "#efe3c8" } },
  },
};
/** a colour's HSL lightness clamped to 15–85 % */
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

/** printed ink stands a hair proud of the dial (20:11): inside each mark an inner shadow along the edge away from the
 *  light and a highlight along the edge facing it — tiny, the shadow the stronger. `INK_K` scales both (0 = flat ink) */

/** how thick a mark is, in the dial's units (20:49): twice its area over its outline's length — a strip of width w gives w */
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
const inkRelief = (x, s, L) => { if (!INK_K) return "";
  const id = "ik" + (INK_N++), ux = Math.cos(rad(L)) / s, uy = -Math.sin(rad(L)) / s, th = thickness(x.p) * s, es = Math.min(0.035 * INK_K, th * 0.16), eh = Math.min(0.025 * INK_K, th * 0.1);      // a thin line or small text gets a thinner relief (20:49)
  CLIPS.push(`<clipPath id="${id}"><path d="${x.p}"/></clipPath>`);
  const cut = (dx, dy, fill, op) => `<g transform="translate(${f(dx)} ${f(dy)})"><path d="M-9999 -9999H9999V9999H-9999Z${x.p}" fill-rule="evenodd" fill="${fill}" fill-opacity="${op}"/></g>`;
  return `<g clip-path="url(#${id})">${cut(ux * es, uy * es, "#000", 0.45)}${cut(-ux * eh, -uy * eh, "#fff", 0.5)}</g>`; };
/** a hand's bevel, as in the app (Shadows → Bevels): the half on the light's side lighter, the other darker (20:11) */
const handBevel = (x, A, L) => { if (!HAND_BEVEL || !x.hand) return "";
  const id = "hb" + (INK_N++), a = rad(A[x.hand]), side = Math.cos(a) * Math.cos(rad(L)) + Math.sin(a) * Math.sin(rad(L));
  CLIPS.push(`<clipPath id="${id}"><path d="${x.p}"/></clipPath>`);
  const lit = 0.22 * Math.abs(side), dark = 0.26 * Math.abs(side);
  return `<g transform="rotate(${-A[x.hand]})"><g clip-path="url(#${id})"><rect x="0" y="-50" width="50" height="100" fill="${side > 0 ? "#fff" : "#000"}" fill-opacity="${f(side > 0 ? lit : dark)}"/><rect x="-50" y="-50" width="50" height="100" fill="${side > 0 ? "#000" : "#fff"}" fill-opacity="${f(side > 0 ? dark : lit)}"/></g></g>`; };
/** a flare's colour (20:11): white on a grey metal, tinted toward the metal's own hue on a coloured one, still bright */
const flareColour = (T) => (hex2hsl(T[1])[1] < 0.12 ? "#ffffff" : mixc(T[0], "#ffffff", 0.55));
function dialSVG(C, v, L) {
  const RC = parseDial(C.dialOverride || C.dialName);
  const D = DIALS.find((d) => d.name === RC.name), s = C.dial / D.d, A = { hour: 305, minute: 60, second: SEC === null ? 180 : SEC * 6 }, V = D.own ? { plate: null, map: {} } : VARIANTS[C.key][v];
  const col = (x) => clampL(recolour(x, RC) || (x.role === "plate" && V.plate ? V.plate : V.map[x.f] || x.f));
  const items = D.items;
  const kh = Math.tan(rad(40)) / Math.tan(rad(SUN_H)), sh = [-Math.cos(rad(L)) * 0.35 * kh, Math.sin(rad(L)) * 0.35 * kh];       // the hands' shadow, away from the light (dial space is y up)
  const handsShadow = items.filter((x) => x.hand || x.role === "cap").map((x) => `<path d="${x.p}" fill="#000" fill-opacity="0.35"${x.hand ? ` transform="translate(${f(sh[0])} ${f(sh[1])}) rotate(${-A[x.hand]})"` : ` transform="translate(${f(sh[0])} ${f(sh[1])})"`}/>`).join("");
  const body = items.map((x) => `<path d="${x.p}" fill="${col(x)}" fill-opacity="${x.a}"${x.hand ? ` transform="rotate(${-A[x.hand]})"` : ""}/>` + (x.hand ? handBevel(x, A, L) : x.role !== "plate" && x.role !== "cap" ? inkRelief(x, s, L) : ""));
  const firstHand = items.findIndex((x) => x.hand || x.role === "cap");
  body.splice(firstHand, 0, handsShadow);
  return `<g transform="scale(${f(s)} ${f(-s)})">${body.join("")}</g>`;
}
/** the cushion's outline: a superellipse |x/a|^n + |y/a|^n = 1, as points (y down) */
function cushionPts(a, n, N = 160) {
  return Array.from({ length: N }, (_, k) => { const t = k / N * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t); return [a * Math.sign(c) * Math.abs(c) ** (2 / n), a * Math.sign(s) * Math.abs(s) ** (2 / n)]; });
}
/** a cushion's lug: a short straight tab off the cushion's corner side, its tip chamfered */
function cushionLug(C, sx, sy) {
  const half = C.l2l / 2, xi = C.lugw / 2, xo = xi + C.lugT, y0 = C.cushion.a * 0.82, c = 0.9;
  const p = (x, y) => [sx * x, sy * y];
  return P([p(xi, y0), p(xi, half), p(xo - c, half), p(xo, half - c), p(xo, y0)]);
}
/** one lug (sx, sy = ±1): the inner edge straight along the strap; the outer edge leaves the case and curves to the tip */
function lugPath(C, sx, sy) {
  const R = C.od / 2, half = C.l2l / 2, xi = C.lugw / 2, xo = xi + C.lugT, xb = xo + C.flare;
  const yb = Math.sqrt(R * R - xb * xb), yi = Math.sqrt(R * R - xi * xi) - 1.5, r = 0.8;
  const p = (x, y) => `${f(sx * x)} ${f(sy * y)}`;
  return `M${p(xi, yi)}L${p(xi, half - r)}Q${p(xi, half)} ${p(xi + r, half)}L${p(xo - r, half)}Q${p(xo, half)} ${p(xo, half - r)}C${p(xo, half - (half - yb) * 0.5)} ${p(xb - 0.6, yb + 1.2)} ${p(xb, yb)}Z`;
}
/** the lug's outer chamfer: a strip along the outer edge, its normal pointing out sideways */
function lugChamfer(C, sx, sy, w = 0.75) {
  const R = C.od / 2, half = C.l2l / 2, xo = C.lugw / 2 + C.lugT, xb = xo + C.flare, yb = Math.sqrt(R * R - xb * xb), r = 0.8;
  const p = (x, y) => `${f(sx * x)} ${f(sy * y)}`;
  return `M${p(xo, half - r)}C${p(xo, half - (half - yb) * 0.5)} ${p(xb - 0.6, yb + 1.2)} ${p(xb, yb)}L${p(xb - w * 1.3, yb + 0.2)}C${p(xb - 0.6 - w, yb + 1.4)} ${p(xo - w, half - (half - yb) * 0.5)} ${p(xo - w, half - r)}Z`;
}
function caseSVG(C, v, L) {
  FLARE_TINT = flareColour(C.metal);
  const R = C.cushion ? C.cushion.a : C.od / 2, T = C.metal, out = [];
  if (C.cushion) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const d = cushionLug(C, sx, sy); out.push(shape(d, T[1], 0.2, T[2])); }
  } else for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    out.push(shape(lugPath(C, sx, sy), T[1], 0.2, T[2]));
    out.push(flat(lugChamfer(C, sx, sy), tone(T, sx > 0 ? 0 : 180, 0.9, L)), stroke(lugChamfer(C, sx, sy), 0.1));
    if (C.drilled) out.push(`<ellipse cx="${f(sx * (C.lugw / 2 + C.lugT + 0.05))}" cy="${f(sy * (C.l2l / 2 - 2.4))}" rx="0.25" ry="0.55" fill="${INK}"/>`);      // the drilled hole, seen on the lug's outer face's edge
  }
  // the crown: a cylinder lying on its side at 3; its upper half and lower half lit by where the light comes from
  const cw = C.crown.w, ch = C.crown.h, x0 = R - 0.4;
  const top = P([[x0, -cw / 2], [x0 + ch, -cw / 2 + 0.25], [x0 + ch, 0], [x0, 0]]), bot = P([[x0, 0], [x0 + ch, 0], [x0 + ch, cw / 2 - 0.25], [x0, cw / 2]]);
  out.push(shape(P([[R - 1.2, -cw * 0.32], [x0, -cw * 0.32], [x0, cw * 0.32], [R - 1.2, cw * 0.32]]), T[2], 0.15));        // its stem tube
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
  } else out.push(C.insert ? `<path d="${circle(R)}" fill="${mixc(T[2], "#000000", 0.45)}"/>` : "", shape(C.insert && DIVOT === "cut" ? notchedPath(R, C.insert.coin, 0.5) : circle(R), T[1], 0.2, T[2]));      // the divots show dark metal (18:26)
  for (const [r1, r0, dir, tilt] of C.bands) out.push(sloped(r0, r1, T, L, dir, tilt));
  if (C.insert) {      // the dive bezel: a coin edge round its rim, lit tooth by tooth; then the black insert and its minute scale
    const I = C.insert, ro = I.od / 2, ri = R - 1.4;
    // the notched edge (18:06): each tooth a block in one of three tones by the way it faces; the ring inside it sloped
    out.push(sloped(ri, R - 0.55, T, L, 1, 0.8, I.coin));      // the ring inside the rim
    { const id = "nc" + clipN++; CLIPS.push(`<clipPath id="${id}"><path d="${notchedPath(R, I.coin, 0.5)}"/></clipPath>`);
      out.push(`<g clip-path="url(#${id})">` + teeth(R, I.coin, 0.5).map((t) => `<path d="${t.d}" fill="${tone(T, t.phi, 0.9, L)}"/>`).join("") + `</g>`);
      // the round scoops (19:04, as on the Miyazaki faces): each divot a dark disc sunk into the rim, outlined, its far wall lit
      if (DIVOT === "round") { const cid = "sc" + clipN++, u = [Math.cos(rad(L)), Math.sin(rad(L))]; CLIPS.push(`<clipPath id="${cid}"><path d="${circle(R)}"/></clipPath>`);
        out.push(`<g clip-path="url(#${cid})">` + Array.from({ length: I.coin }, (_, k) => { const a = (k / I.coin) * 2 * Math.PI - Math.PI / 2, x = Math.cos(a) * R, y = Math.sin(a) * R;
          return `<circle cx="${f(x)}" cy="${f(y)}" r="0.5" fill="${mixc(T[2], "#000000", 0.45)}"/><path d="M${f(x - u[0] * 0.5 + u[1] * 0.42)} ${f(y - u[1] * 0.5 - u[0] * 0.42)}A0.5 0.5 0 0 0 ${f(x - u[0] * 0.5 - u[1] * 0.42)} ${f(y - u[1] * 0.5 + u[0] * 0.42)}" fill="none" stroke="${T[0]}" stroke-width="0.14" transform="translate(${f(u[0] * 0.22)} ${f(u[1] * 0.22)})"/><circle cx="${f(x)}" cy="${f(y)}" r="0.5" fill="none" stroke="${INK}" stroke-width="0.1"/>`; }).join("") + `</g>`); } }
    out.push(`<path d="${DIVOT === "cut" ? notchedPath(R, I.coin, 0.5) : circle(R)}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>`);
    const ins = ["#3a3b3f", "#2b2c30", "#222326"];
    out.push(sloped(I.id / 2, ri, ins, L, -1, 0.5));
    for (let m = 0; m < 60; m++) {
      const t = rad(m * 6 - 90), r0 = I.id / 2 + 0.5, r1 = I.id / 2 + (m % 5 === 0 ? 2.6 : 1.3);      // every minute, the fives longer
      if (m === 0) out.push(`<path d="${P([[0, -ri + 0.4], [-1.3, -I.id / 2 - 0.4], [1.3, -I.id / 2 - 0.4]])}" fill="#d8d6cf"/>`);
      else if (r1 > r0) out.push(`<path d="M${f(Math.cos(t) * r0)} ${f(Math.sin(t) * r0)}L${f(Math.cos(t) * r1)} ${f(Math.sin(t) * r1)}" stroke="#d8d6cf" stroke-width="${m % 5 === 0 ? 0.45 : LW}"/>`);
    }
    // no numbers on the bezel (15:43): ticks only
    out.push(stroke(circle(ro)), stroke(circle(I.id / 2)));
  }
  out.push(glint(C.cushion ? C.cushion.a - 0.7 : C.od / 2 - 0.5, L), glint(C.opening + 0.5, L, 0.4, 0.5, 20));
  out.push(shape(circle(C.opening), T[2], 0.15));                                                  // the crystal's seat, then the dial
  out.push(`<g clip-path="url(#dial-${C.key})">${dialSVG(C, v, L)}</g>`);
  // the case's shadow on the dial (18:21): the bezel wall blocks the light on the side it comes from, a hard crescent,
  // longer the lower the sun
  { const uS = [Math.cos(rad(L)), Math.sin(rad(L))], sl = Math.max(0.5, Math.min(2.6, 1.1 * Math.tan(rad(40)) / Math.tan(rad(SUN_H))));
    out.push(`<g clip-path="url(#dial-${C.key})"><g transform="translate(${f(-uS[0] * sl)} ${f(-uS[1] * sl)})"><path d="M-500 -500H500V500H-500Z${circle(C.opening)}" fill-rule="evenodd" fill="#000" fill-opacity="0.4"/></g></g>`); }
  // the crystal: a highlight crescent on the side facing the light, a faint one opposite
  const g = (a, r, w, o) => `<path d="M${f(Math.cos(rad(a - 28)) * r)} ${f(Math.sin(rad(a - 28)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(a + 28)) * r)} ${f(Math.sin(rad(a + 28)) * r)}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
  out.push(g(L, C.opening - 0.9, 0.8, 0.55), g(L + 180, C.opening - 0.9, 0.4, 0.22));      // the glass's shine: white, and the dial never white, so it always shows
  out.push(stroke(circle(C.opening), 0.2));
  return out.join("");
}
// ── straps ──
/** a strap piece from y0 to y1 (y down), w0 → w1 wide, with a padded middle lit from the side, stitched along both edges */
function leatherPiece(y0, y1, w0, w1, T, L, tip = 0, holes = []) {
  const s = Math.sign(y1 - y0), xs = (y) => w0 / 2 + (w1 - w0) / 2 * ((y - y0) / (y1 - y0));
  const yEnd = y1 - s * tip;
  const rw = 0.9;      // the wrap: the start's corners rounded, as leather folded over a bar
  let d = `M${f(-w0 / 2)} ${f(y0 + s * rw)}Q${f(-w0 / 2)} ${f(y0)} ${f(-w0 / 2 + rw)} ${f(y0)}L${f(w0 / 2 - rw)} ${f(y0)}Q${f(w0 / 2)} ${f(y0)} ${f(w0 / 2)} ${f(y0 + s * rw)}L${f(w1 / 2)} ${f(yEnd)}`;
  if (tip) d += `Q${f(w1 / 2)} ${f(y1)} 0 ${f(y1)}Q${f(-w1 / 2)} ${f(y1)} ${f(-w1 / 2)} ${f(yEnd)}Z`; else d += `L${f(-w1 / 2)} ${f(y1)}Z`;
  const inset = (k) => `M${f(-xs(y0) + k)} ${f(y0)}L${f(-xs(yEnd) + k)} ${f(yEnd)}M${f(xs(y0) - k)} ${f(y0)}L${f(xs(yEnd) - k)} ${f(yEnd)}`;
  const pad = (side) => P([[side * (xs(y0) - 1.6), y0], [side * (xs(y0) - 3.4), y0], [side * (xs(yEnd) - 3.4), yEnd], [side * (xs(yEnd) - 1.6), yEnd]]);
  let html = shape(d, T[1], 0.2, T[2]) + `<path d="${d}" fill="url(#grain)"/>`;      // the grain, faint
  html += flat(pad(1), tone(T, 0, 0.8, L)) + flat(pad(-1), tone(T, 180, 0.8, L));                  // the padding's two slopes
  html += `<path d="${inset(0.9)}" fill="none" stroke="#e9dccb" stroke-opacity="0.7" stroke-width="0.22" stroke-dasharray="0.9 0.7"/>`;   // stitching
  for (const y of holes) html += `<ellipse cx="0" cy="${f(y)}" rx="0.75" ry="0.75" fill="${INK}"/><path d="M${f(-0.75)} ${f(y)}A0.75 0.75 0 0 1 ${f(0.75)} ${f(y)}" fill="none" stroke="${tone(T, 270, 1, L)}" stroke-width="0.2"/>`;
  return html + shape(d, "none");
}
function buckle(y, w, T, L) {
  const W = w + 3, H = 7, x = -W / 2;
  const frame = `M${f(x)} ${f(y)}h${f(W)}v${f(H)}h${f(-W)}Z M${f(x + 1.3)} ${f(y + 1.3)}v${f(H - 2.6)}h${f(W - 2.6)}v${f(-(H - 2.6))}Z`;
  return `<path d="${frame}" fill-rule="evenodd" fill="${T[1]}" stroke="${INK}" stroke-width="0.2"/>` +
    flat(P([[x, y], [x + W, y], [x + W - 1.3, y + 1.3], [x + 1.3, y + 1.3]]), tone(T, 270, 0.9, L)) + flat(P([[x, y + H], [x + W, y + H], [x + W - 1.3, y + H - 1.3], [x + 1.3, y + H - 1.3]]), tone(T, 90, 0.9, L)) +
    shape(P([[-0.5, y + 1.3], [0.5, y + 1.3], [0.5, y + H + 3.5], [-0.5, y + H + 3.5]]), tone(T, 0, 0.3, L), 0.15);        // the tongue
}
function keeper(y, w, T, L, h = 3.2) {
  const W = w + 1.4;
  return shape(P([[-W / 2, y], [W / 2, y], [W / 2, y + h], [-W / 2, y + h]]), T[1], 0.2) + flat(P([[-W / 2, y], [W / 2, y], [W / 2, y + h * 0.35], [-W / 2, y + h * 0.35]]), tone(T, 270, 0.9, L)) + flat(P([[-W / 2, y + h * 0.65], [W / 2, y + h * 0.65], [W / 2, y + h], [-W / 2, y + h]]), tone(T, 90, 0.9, L)) + stroke(P([[-W / 2, y], [W / 2, y], [W / 2, y + h], [-W / 2, y + h]]), 0.2);
}
function leatherSVG(C, L, colour, open, span) {
  const T = LEATHER[colour], w = C.lugw - 0.2, end = 16, yc = C.cushion ? C.l2l / 2 - 3.4 : Math.min(C.l2l / 2 - 3.4, C.od / 2 + 0.2);      // the strap's end meets the round case at its middle (17:40)          // the strap's end, wrapped over the spring bar 2.6 mm in from the lug tips
  const gap = "";      // between the case and the strap's end the floor shows; the strap's end wraps over the spring bar and hides it (15:29)
  if (!open) return gap + leatherPiece(-yc, -span, w, w - 1.2, T, L) + leatherPiece(yc, span, w, w - 1.2, T, L, 0, [60, 67].filter((y) => y < span));
  // open, laid flat: the buckle piece at 12 (75 mm), the hole piece at 6 (115 mm), tapering to 16 mm
  const up = leatherPiece(-yc, -(C.l2l / 2 + 75), w, end, T, L), dn = leatherPiece(yc, C.l2l / 2 + 115, w, end, T, L, 7, [72, 79, 86, 93, 100, 107].map((y) => C.l2l / 2 + y - 25));
  return gap + up + dn + keeper(-(C.l2l / 2 + 64), end + 0.4, T, L, 4) + keeper(-(C.l2l / 2 + 58), end + 0.4, T, L, 3.2) + buckle(-(C.l2l / 2 + 75) - 6, end, C.metal, L);
}
/** the NATO: woven ribbon, stripes along it, its ribs as fine lines that catch the light; under the case and out */
function natoSVG(C, L, set, open, span) {
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
/** the diver's bracelet (15:50): three-link rows from end links fitted to the case out to the frame's edge; the outer
 *  links brushed and flat with a chamfer along their outer edge, the middle link polished and rounded across — its two
 *  halves lit by where the light comes from; the rows taper a little */
// ═══ textures and the real bracelet (16:10) — shared by both styles ═══
// patterns: leather grain (pores and creases, faint, repeating every 9 mm); the NATO's weave (warp threads over weft,
// a twill step); metal brushing (fine lines along the length). All in the drawing's millimetres.
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
const brighter = (h, k) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) + (255 - parseInt(h.slice(i, i + 2), 16)) * k).toString(16).padStart(2, "0")).join("");
/** metal's glint: a short white arc on a round edge, on the side facing the light (metal shines more than leather or nylon) */
const glint = (r, L, w = 0.55, o = 0.6, span = 26) => GLINT === "off" ? "" : GLINT === "flare" ? `<path filter="url(#flare)" d="M${f(Math.cos(rad(L - span * 1.25)) * r)} ${f(Math.sin(rad(L - span * 1.25)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(L + span * 1.25)) * r)} ${f(Math.sin(rad(L + span * 1.25)) * r)}" fill="none" stroke="${FLARE_TINT}" stroke-opacity="${o * 0.45 * FLARE_SCALE}" stroke-width="${w * 5}" stroke-linecap="round"/>` : `<path d="M${f(Math.cos(rad(L - span)) * r)} ${f(Math.sin(rad(L - span)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(L + span)) * r)} ${f(Math.sin(rad(L + span)) * r)}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
/** an Oyster-like bracelet, seen from above: under it a dark strip (the pins and the links' undersides show in the
 *  gaps); per row two brushed outer links rounded on their outer side and a polished, domed middle link with a long
 *  glint on the light's side; solid end links fitted to the case; a slight taper. `look(d, T, kind)` draws a link in
 *  the style (outlined or blob); `kind` is "brushed" or "polished". */
function realBracelet(C, L, span, look) {
  const T = C.metal, R = C.od / 2, W = C.lugw - 0.2, half = C.l2l / 2, pitch = 5.4, gap = 0.32, out = [];
  const u = [Math.cos(rad(L)), Math.sin(rad(L))], lightSide = u[0] < 0 ? -1 : 1;      // the middle link's glint on the light's side
  for (const sy of [-1, 1]) {
    const yIn = Math.sqrt(R * R - (W / 2) ** 2) - 0.6, yOut = half - 0.2;
    const ys = (y) => sy * y;
    // the dark under-strip: what shows between the links
    out.push(`<path d="${P([[-W / 2 + 0.4, ys(yOut)], [W / 2 - 0.4, ys(yOut)], [W / 2 - 1.6, ys(span)], [-W / 2 + 1.6, ys(span)]])}" fill="${T[2]}"/><path d="${P([[-W / 2 + 0.4, ys(yOut)], [W / 2 - 0.4, ys(yOut)], [W / 2 - 1.6, ys(span)], [-W / 2 + 1.6, ys(span)]])}" fill="#000" fill-opacity="0.35"/>`);
    // the end link: its inner edge follows the case; outer thirds brushed, middle polished
    const mid0 = W * 0.36;
    const endOuter = (side) => { const x0 = side * W / 2, x1 = side * (mid0 / 2 + gap / 2);
      return `M${f(x1)} ${f(ys(yIn + 0.3))}L${f(x0 - side * 0.6)} ${f(ys(yIn - 0.4))}Q${f(x0)} ${f(ys(yIn - 0.3))} ${f(x0)} ${f(ys(yIn + 0.6))}L${f(x0)} ${f(ys(yOut - 0.8))}Q${f(x0)} ${f(ys(yOut))} ${f(x0 - side * 0.8)} ${f(ys(yOut))}L${f(x1)} ${f(ys(yOut))}Z`; };
    out.push(look(endOuter(-1), T, "brushed"), look(endOuter(1), T, "brushed"));
    out.push(look(`M${f(-mid0 / 2)} ${f(ys(yIn + 0.4))}L${f(mid0 / 2)} ${f(ys(yIn + 0.4))}L${f(mid0 / 2)} ${f(ys(yOut))}L${f(-mid0 / 2)} ${f(ys(yOut))}Z`, T, "polished"));
    // the rows
    for (let k = 0, y = yOut + gap; y < span; k++, y += pitch) {
      const w = W - Math.min(k, 8) * 0.28, mid = w * 0.36, a = ys(y), b = ys(y + pitch - gap), rr = 1.3;
      const top = Math.min(a, b), bot = Math.max(a, b);
      for (const side of [-1, 1]) {
        const xo = side * w / 2, xi = side * (mid / 2 + gap / 2), xs = Math.min(xo, xi), xe = Math.max(xo, xi);
        // rounded on the outer side only
        const d = side > 0
          ? `M${f(xs)} ${f(top)}H${f(xe - rr)}Q${f(xe)} ${f(top)} ${f(xe)} ${f(top + rr)}V${f(bot - rr)}Q${f(xe)} ${f(bot)} ${f(xe - rr)} ${f(bot)}H${f(xs)}Z`
          : `M${f(xe)} ${f(top)}H${f(xs + rr)}Q${f(xs)} ${f(top)} ${f(xs)} ${f(top + rr)}V${f(bot - rr)}Q${f(xs)} ${f(bot)} ${f(xs + rr)} ${f(bot)}H${f(xe)}Z`;
        out.push(look(d, T, "brushed"));
      }
      const m = `M${f(-mid / 2 + 0.5)} ${f(top)}H${f(mid / 2 - 0.5)}Q${f(mid / 2)} ${f(top)} ${f(mid / 2)} ${f(top + 0.5)}V${f(bot - 0.5)}Q${f(mid / 2)} ${f(bot)} ${f(mid / 2 - 0.5)} ${f(bot)}H${f(-mid / 2 + 0.5)}Q${f(-mid / 2)} ${f(bot)} ${f(-mid / 2)} ${f(bot - 0.5)}V${f(top + 0.5)}Q${f(-mid / 2)} ${f(top)} ${f(-mid / 2 + 0.5)} ${f(top)}Z`;
      out.push(look(m, T, "polished"));
      out.push(`<path d="M${f(lightSide * mid * 0.22)} ${f(top + 0.7)}V${f(bot - 0.7)}" stroke="#fff" stroke-opacity="0.65" stroke-width="0.45" stroke-linecap="round"/>`);      // the polished link's long glint
    }
  }
  return out.join("");
}

// ═══ the bracelet as vaults (option 2, refined 16:43): every row bends over the wrist (a barrel across the bracelet);
// rows all 6.4 mm long; tapering 0.45 mm a row (20 → 16 mm by the clasp); the middle link 36 % of the row; corners:
// the outer links' outside 1.2 mm, where rows meet 0.2 mm, the middle link 0.5 mm. `deep` — the curve steepens with
// each row (the bracelet going away); `ink` — outlines (the line style) or none (impressionist) ═══
function rrect4(x0, y0, x1, y1, [tl, tr, br, bl]) {
  return `M${f(x0 + tl)} ${f(y0)}H${f(x1 - tr)}Q${f(x1)} ${f(y0)} ${f(x1)} ${f(y0 + tr)}V${f(y1 - br)}Q${f(x1)} ${f(y1)} ${f(x1 - br)} ${f(y1)}H${f(x0 + bl)}Q${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - bl)}V${f(y0 + tl)}Q${f(x0)} ${f(y0)} ${f(x0 + tl)} ${f(y0)}Z`;
}
let VB_N = 0;
/** one row's barrel shading over a link: N bands down its length, each one of `ramp` (dark → light) */
function barrel(d, x0, y0, x1, y1, k, ramp, lv, flip) {
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
function vaultBracelet({ W = 19.8, y0 = 0, span = 46, sy = 1, L = 225, H = 40, ramp, ink = null, inkW = 0.22, deep = false, endShape = null }) {
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
    const top = Math.min(sy * (Math.sqrt(Rr * Rr - lw * lw / 4) - 0.15), sy * yE), bot = Math.max(sy * (Math.sqrt(Rr * Rr) - 0.15), sy * yE);
    out += barrel(end, -lw / 2, Math.min(top, bot), lw / 2, Math.max(top, bot), 0.99, ramp, lv0(sy), 1);
    const mid = W * 0.36;
    for (const x of [-mid / 2, mid / 2]) out += `<path d="M${f(x)} ${f(sy * (Math.sqrt(Rr * Rr - x * x) - 0.15))}V${f(sy * yE)}" stroke="${ramp[0]}" stroke-width="0.22"/>`;
    out += `<path d="M${arc.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="0.5"/>`;      // where it meets the case
    out += INKB ? `<path d="${end}" fill="none" stroke="${INKB}" stroke-width="0.22" stroke-linejoin="round"/>` : "";
    OUTT.push(end);
    out += vaultBracelet({ W, y0: yE, span, sy, L, H: SUN_H, ramp, ink: INKB });
    for (let k = 0, y = yE; y + 6.4 <= span + 0.01; k++, y += 6.4) { const w = Math.max(16, W - k * 0.45); OUTT.push(`M${f(-w / 2)} ${f(sy * y)}H${f(w / 2)}V${f(sy * (y + 6.4))}H${f(-w / 2)}Z`); }
  }
  return out;
}
function sheet(key, strap, v, L, open = false, h = 40, dial = null, metal = null, size = 1) {
  WEAVE = strap.endsWith("-big") ? "weavebig" : "weave"; strap = strap.replace(/-big$/, "");
  SUN_H = h; CLIPS = []; OUTL = [];
  const C = { ...scaleCase(CASES[key], size), key, dialOverride: dial, ...(metal ? { metal: METALS[metal] } : {}) }, span = open ? 260 : 64, Wd = 92, H = open ? 290 : 120, cy = open ? -18 : 0;
  OUTL_S = []; OUTT = OUTL_S;
  const strapSVG = strap === "bracelet" ? braceletSVG(C, L, open ? C.l2l / 2 + 84 : span) : strap.startsWith("leather") ? leatherSVG(C, L, strap.split("-")[1], open, span) : natoSVG(C, L, strap.split("-")[1], open, span);
  // shadow: everything's silhouette shifted away from the light, flat; the case casts further than the strap
  const off = (d) => [-Math.cos(rad(L)) * d, -Math.sin(rad(L)) * d];
  const k = Math.tan(rad(40)) / Math.tan(rad(h)), [cxs, cys] = off(2.4 * k), [sxs, sys] = off(0.8 * k);      // a low sun casts longer
  const sil = C.cushion ? [P(cushionPts(C.cushion.a, C.cushion.n)), ...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => cushionLug(C, sx, sy)))].join(" ") : [circle(C.od / 2), ...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => lugPath(C, sx, sy)))].join(" ");
  const SH = SH_OVR || "#7f796e";      // as dark as the lineless set (17:40)
  // the block shadow (15:37): the strap's and the case's silhouettes pushed away from the light in small steps, so
  // the shadow is one solid extruded block joined to the watch — no gaps, no lugs floating apart
  const strapRects = strap === "bracelet" ? `<rect x="${f(-C.lugw / 2)}" y="${open ? -(C.l2l / 2 + 84) : -span}" width="${C.lugw}" height="${open ? C.l2l + 168 : 2 * span}"/>` : strap.startsWith("nato") ? `<rect x="${f(-C.lugw / 2)}" y="${open ? -(C.l2l / 2 + 76) : -span}" width="${C.lugw}" height="${open ? C.l2l + 241 : 2 * span}"/>`
    : `<rect x="${f(-C.lugw / 2)}" y="${open ? -(C.l2l / 2 + 81) : -span}" width="${C.lugw}" height="${f((open ? C.l2l / 2 + 81 : span) - (C.cushion ? C.l2l / 2 - 3.4 : Math.min(C.l2l / 2 - 3.4, C.od / 2 + 0.2)))}"/><rect x="${f(-C.lugw / 2)}" y="${f(C.cushion ? C.l2l / 2 - 3.4 : Math.min(C.l2l / 2 - 3.4, C.od / 2 + 0.2))}" width="${C.lugw}" height="${f((open ? C.l2l / 2 + 115 : span) - (C.cushion ? C.l2l / 2 - 3.4 : Math.min(C.l2l / 2 - 3.4, C.od / 2 + 0.2)))}"/>`;
  const steps = 28, blockShadow = `<g fill="${SH}">` +
    Array.from({ length: steps }, (_, i) => `<g transform="translate(${f(sxs * (i + 1) / steps)} ${f(sys * (i + 1) / steps)})">${strapRects}</g>`).join("") +
    Array.from({ length: steps }, (_, i) => `<g transform="translate(${f(cxs * (i + 1) / steps)} ${f(cys * (i + 1) / steps)})">${sil.split(/ (?=M)/).map((d) => `<path d="${d}"/>`).join("")}</g>`).join("") + `</g>`;
  const caseStr = caseSVG(C, v, L);
  const ribs = Object.entries({ ...NATO_SETS, ...NATO_MORE }).flatMap(([n, S]) => S.map((T, k) => `<pattern id="ribs-${n}-${k}" width="4" height="0.8" patternUnits="userSpaceOnUse"><rect width="4" height="0.3" fill="${T[0]}" fill-opacity="0.55"/></pattern>`)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="__VB__">
<defs>${"__CLIPS__"}<clipPath id="dial-${key}"><path d="${circle(C.opening)}"/></clipPath>${ribs}${TEXTURES}</defs>
<defs><radialGradient id="pool" cx="${f(Math.cos(rad(L)) * 6)}" cy="${f(Math.sin(rad(L)) * 6 + cy * 0)}" r="${open ? 240 : 52}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d9d4c7"/><stop offset="0.55" stop-color="#cbc5b8"/><stop offset="1" stop-color="#a39d91"/></radialGradient></defs>
<rect x="-300" y="-300" width="600" height="600" fill="url(#pool)"/>
${blockShadow}

${strapSVG}${strap === "bracelet" ? "" : contact(C, L, strap, span, false)}${caseStr}
</svg>`;
}
const jobs = [];
const add = (n, ...a) => { const svg = sheet(...a); fs.writeFileSync(n + ".svg", svg.replace("__CLIPS__", CLIPS.join(""))); jobs.push(n); };
// ═══ 16:31: a bracelet that reads as one, contact shadows and touching lines where the strap meets the case ═══
// The bracelet, after an Oyster type on a 20 mm diver (Islander BRAC-172 for the SPB143; Lucius Atelier's Oyster):
// 20 mm at the lugs tapering to 16 mm at the clasp; outer links brushed on top with polished sides; a polished middle
// link, raised a little above them; solid end links curved to the case. The rows touch: between them only a crease —
// a dark line with a soft dark either side — never a gap.
function realBracelet2(C, L, span, look, soft) {
  const T = C.metal, R = C.od / 2, W = C.lugw - 0.2, half = C.l2l / 2, pitch = 6.6, out = [];
  const u = [Math.cos(rad(L)), Math.sin(rad(L))], away = u[0] < 0 ? 1 : -1;      // the side of the middle link its shadow falls on
  const widthAt = (y) => Math.max(16, W - (y - half) * 0.075);
  for (const sy of [-1, 1]) {
    const ys = (y) => sy * y, yIn = Math.sqrt(R * R - (W / 2) ** 2) - 0.6, yOut = half - 0.2;
    // the end link, solid: inner edge on the case's curve
    const mid0 = W * 0.36;
    const endPart = (x0, x1) => `M${f(x0)} ${f(ys(Math.sqrt(R * R - x0 * x0) - 0.6))}A${f(R)} ${f(R)} 0 0 ${(sy > 0) === (x1 > x0) ? 0 : 1} ${f(x1)} ${f(ys(Math.sqrt(R * R - x1 * x1) - 0.6))}L${f(x1)} ${f(ys(yOut))}L${f(x0)} ${f(ys(yOut))}Z`;
    out.push(look(endPart(-W / 2, -mid0 / 2), T, "brushed"), look(endPart(mid0 / 2, W / 2), T, "brushed"), look(endPart(-mid0 / 2, mid0 / 2), T, "polished"));
    out.push(raisedShadow(mid0, ys(yIn), ys(yOut), away, soft));
    for (let y = yOut; y < span; y += pitch) {
      const w = widthAt(y + pitch / 2), mid = w * 0.36, a = ys(y), b = ys(y + pitch), top = Math.min(a, b), bot = Math.max(a, b);
      // the outer links, polished along their outer side
      for (const side of [-1, 1]) {
        const xo = side * w / 2, xi = side * mid / 2, xs = Math.min(xo, xi), xe = Math.max(xo, xi), r = 1.1;
        const d = side > 0 ? `M${f(xs)} ${f(top)}H${f(xe - r)}Q${f(xe)} ${f(top)} ${f(xe)} ${f(top + r)}V${f(bot - r)}Q${f(xe)} ${f(bot)} ${f(xe - r)} ${f(bot)}H${f(xs)}Z`
          : `M${f(xe)} ${f(top)}H${f(xs + r)}Q${f(xs)} ${f(top)} ${f(xs)} ${f(top + r)}V${f(bot - r)}Q${f(xs)} ${f(bot)} ${f(xs + r)} ${f(bot)}H${f(xe)}Z`;
        out.push(look(d, T, "brushed"));
        const bev = side > 0 ? P([[xe - 0.75, top + 0.3], [xe, top + 0.9], [xe, bot - 0.9], [xe - 0.75, bot - 0.3]]) : P([[xs + 0.75, top + 0.3], [xs, top + 0.9], [xs, bot - 0.9], [xs + 0.75, bot - 0.3]]);
        out.push(`<path d="${bev}" fill="${tone([brighter(T[0], 0.3), T[1], T[2]], side > 0 ? 0 : 180, 1, L)}"/>`);      // the polished side
      }
      // the middle link: polished, raised, its ends rounded
      const r = 1.0, m = `M${f(-mid / 2 + r)} ${f(top)}H${f(mid / 2 - r)}Q${f(mid / 2)} ${f(top)} ${f(mid / 2)} ${f(top + r)}V${f(bot - r)}Q${f(mid / 2)} ${f(bot)} ${f(mid / 2 - r)} ${f(bot)}H${f(-mid / 2 + r)}Q${f(-mid / 2)} ${f(bot)} ${f(-mid / 2)} ${f(bot - r)}V${f(top + r)}Q${f(-mid / 2)} ${f(top)} ${f(-mid / 2 + r)} ${f(top)}Z`;
      out.push(raisedShadow(mid, top, bot, away, soft), look(m, T, "polished"));
      out.push(`<path d="M${f(-away * mid * 0.2)} ${f(top + 1.0)}V${f(bot - 1.0)}" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5" stroke-linecap="round"/>`);
      // the crease where this row meets the next: one dark line, soft dark either side
      const yc = ys(y + pitch), wc = widthAt(y + pitch);
      out.push(`<rect x="${f(-wc / 2 + 0.3)}" y="${f(yc - 0.45)}" width="${f(wc - 0.6)}" height="0.9" fill="#000" fill-opacity="0.16"/><path d="M${f(-wc / 2 + 0.4)} ${f(yc)}H${f(wc / 2 - 0.4)}" stroke="#000" stroke-opacity="${soft ? 0.45 : 0.75}" stroke-width="${soft ? 0.3 : LW}"/>`);
    }
  }
  return out.join("");
}
/** a raised middle link's shadow on the outer link beside it, on the side away from the light */
const raisedShadow = (mid, y0, y1, away, soft) => `<rect x="${f(away > 0 ? mid / 2 : -mid / 2 - 0.6)}" y="${f(Math.min(y0, y1))}" width="0.6" height="${f(Math.abs(y1 - y0))}" fill="#000" fill-opacity="${soft ? 0.22 : 0.28}"/>`;
/** where the strap meets the watch (16:31): the case and lugs cast a short, close shadow onto the strap — their own
 *  outline nudged away from the light, kept to the strap — and touching lines where the strap folds over the spring
 *  bar and where its edges run against the lugs */
function contact(C, L, strap, span, soft) {
  const u = [Math.cos(rad(L)), Math.sin(rad(L))], k = Math.tan(rad(40)) / Math.tan(rad(SUN_H)), off = [-u[0] * 0.9 * k, -u[1] * 0.9 * k];
  const sil = C.cushion ? [P(cushionPts(C.cushion.a, C.cushion.n)), ...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => cushionLug(C, sx, sy)))] : [circle(C.od / 2), ...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => lugPath(C, sx, sy)))];
  const w = C.lugw - 0.2, yc = C.l2l / 2 - 3.4, leather = strap.startsWith("leather");
  const area = leather ? `<rect x="${f(-w / 2)}" y="${-span}" width="${f(w)}" height="${f(span - yc)}"/><rect x="${f(-w / 2)}" y="${f(yc)}" width="${f(w)}" height="${f(span - yc)}"/>` : `<rect x="${f(-w / 2)}" y="${-span}" width="${f(w)}" height="${2 * span}"/>`;
  const id = "ct" + (BLOB_N++);
  CLIPS.push(`<clipPath id="${id}">${area}</clipPath>`);
  let h = `<g clip-path="url(#${id})">${softShadow(sil.map((d) => `<path d="${d}"/>`).join(""), [off[0] * 1.6, off[1] * 1.6], soft ? 0.34 : 0.3)}</g>`;      // soft and round (17:04)
  const ink = soft ? `stroke="#000" stroke-opacity="0.4" stroke-width="0.35"` : `stroke="${INK}" stroke-width="${LW}"`;
  for (const sy of [-1, 1]) {
    const tip = C.l2l / 2;
    if (leather) h += `<path d="M${f(-w / 2 + 0.9)} ${f(sy * (yc + 0.7))}H${f(w / 2 - 0.9)}" ${ink} stroke-linecap="round"/>`;      // the fold over the bar
    else h += `<path d="M${f(-w / 2)} ${f(sy * (tip - 2.6))}H${f(w / 2)}" stroke="#000" stroke-opacity="0.2" stroke-width="0.8"/><path d="M${f(-w / 2)} ${f(sy * (tip - 2.2))}H${f(w / 2)}" stroke="#fff" stroke-opacity="0.12" stroke-width="0.4"/>`;      // the nylon over the bar: a soft ridge
    for (const sx of [-1, 1]) h += `<path d="M${f(sx * w / 2)} ${f(sy * (leather ? yc : tip - 6))}V${f(sy * tip)}" ${ink}/>`;      // the edges against the lugs
  }
  return h;
}
let BLOB_N = 0;

const RUNS = [
  ["L-d1", "dress", "leather-brown", "own", 180, 45, "Okay blue", "gold", 1],
  ["L-d2", "dress", "nato-regimental", "own", 0, 30, "Okay Cinzel|#1e2a44|#e9e1cf|#c9a45c", "steel", 1],
  ["L-d3", "dress", "leather-tan", "own", 270, 70, "Okay Cinzel", "bronze", 1],
  ["L-d4", "dress", "leather-black", "own", 195, 20, "Okay blue|#f0ead8|#2a2a2c|#9c2b25", "gold", 0.84],
  ["L-d5", "dress", "nato-olive", "own", 345, 15, "Okay blue|#5b1a1e|#efe6d2|#d7b46a", "steel", 1],
  ["L-f1", "field", "nato-grey", "own", 195, 20, "Okay military", "alu", 0.9],
  ["L-f2", "field", "leather-brown", "own", 180, 45, "Okay military|#2b3324|#e8dfb8|#e08a3c", "bronze", 1],
  ["L-f3", "field", "nato-bond", "dark", 270, 70, "Field Public Sans", "steel", 1],
  ["L-f4", "field", "leather-black", "dark", 0, 30, "Field Public Sans|#e4dccb|#232325|#b5352a", "alu", 1.1],
  ["L-f5", "field", "nato-khaki-big", "own", 345, 15, "Okay military|#1f3a52|#f0ead6|#f0b23c", "bronze", 1],
  ["L-v1", "diver", "bracelet", "dark", 0, 30, null, "steel", 1],
  ["L-v2", "diver", "bracelet", "dark", 180, 45, "Quiet diver|#16233d|#e6c98a|#e6c98a", "gold", 1],
  ["L-v3", "diver", "bracelet", "dark", 270, 70, "Quiet diver|#2c4a3a|#f0e9d6|#e08a3c|#e08a3c", "steel", 1],
  ["L-v4", "diver", "leather-tan", "dark", 195, 20, "Quiet diver|#3a2a1c|#e8d7a8|#e8d7a8", "bronze", 1],
  ["L-v5", "diver", "nato-blackgrey", "dark", 345, 15, "Quiet diver|#e9e4d6|#1f2023|#d0702a|#d0702a", "steel", 1],
];
const DETAIL = 31, FULL = { w: 126 / 1.2, h: 308 / 1.2 }, DIAL = 19.5;      // 17:15: the whole watch at 120 %, centred
for (const [n0, key, strap, v, L0, h, dial, metal0, size] of RUNS) {
  if (process.env.ONLY && !process.env.ONLY.split(",").includes(n0)) continue;
  const n = n0 + (process.env.SUF || ""), metal = process.env.METAL || metal0;
  if (process.env.HBSET) HAND_BEVEL = process.env.HBSET.split(",").includes(n0.slice(2));      // hand bevels on half the set (20:11)
  const L = process.env.COMP ? 225 : process.env.LIGHT ? +process.env.LIGHT : L0;      // the comparisons (19:16): every watch lit from the top left, like the cover
  DIVOT = ["L-v1", "L-v3", "L-v5"].includes(n0) ? "round" : "cut";      // the two divots shared out evenly (19:04)
  const make = (mode) => { GLINT = mode; return sheet(key, strap, v, L, true, h, dial, metal, size).replace("__CLIPS__", CLIPS.join("") + `<filter id="flare" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.9"/></filter>`); };
  const drama = make("flare").replace(/<radialGradient id="pool"[^>]*>.*?<\/radialGradient>/s, `<radialGradient id="pool" cx="${f(Math.cos(rad(L)) * 6)}" cy="${f(Math.sin(rad(L)) * 6)}" r="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d9d4c7"/><stop offset="0.55" stop-color="#cbc5b8"/><stop offset="1" stop-color="#a39d91"/></radialGradient>`);
  const flat = make("off").replace('fill="url(#pool)"', 'fill="#b9b3a6"');
  if (!process.env.COMP) fs.writeFileSync(n + "-full.svg", flat.replace("__VB__", `${-FULL.w / 2} ${-FULL.h / 2} ${FULL.w} ${FULL.h}`));
  if (!process.env.COMP) fs.writeFileSync(n + "-detail.svg", drama.replace("__VB__", `${-DETAIL} ${-DETAIL} ${2 * DETAIL} ${2 * DETAIL}`));
  if (!process.env.COMP) fs.writeFileSync(n + "-dial.svg", flat.replace("__VB__", `${-DETAIL} ${-DETAIL} ${2 * DETAIL} ${2 * DETAIL}`));
  if (process.env.COMP) { fs.writeFileSync(n + "-cmp.svg", flat.replace("__VB__", `${-DETAIL} ${-DETAIL} ${2 * DETAIL} ${2 * DETAIL}`)); fs.writeFileSync(n + "-cmpd.svg", drama.replace("__VB__", `${-DETAIL} ${-DETAIL} ${2 * DETAIL} ${2 * DETAIL}`)); }
  jobs.push(n);
}
fs.writeFileSync("jobs.json", JSON.stringify(jobs));
// ── the title page's square (18:49): one Calatrava, the same low light from the upper left for both drawings, on a very
// dark floor under a spotlight, its shadows near-black and long
if (process.env.COVER) {
  const [key, strap, v, dial, metal] = process.env.COVER.split(",");
  SH_OVR = process.env.MASK || "#0a0a09"; GLINT = "flare"; FLARE_SCALE = 0.5;      // the title page (19:34): a subdued flare; plain straps, a very dark red leather and a dark green NATO
  LEATHER.oxblood = ["#2e1012", "#240c0e", "#1a080a"]; NATO_MORE.darkgreen = [["#1a2218", "#151c13", "#10160e"], ["#1a2218", "#151c13", "#10160e"], ["#1a2218", "#151c13", "#10160e"]]; if (process.env.SEC) SEC = +process.env.SEC; if (process.env.FLARE) FLARE_KIND = process.env.FLARE;
  const L = 225, h = 16, body = sheet(key, strap, v, L, true, h, dial === "-" ? null : dial, metal, 1).replace("__CLIPS__", CLIPS.join("") + `<filter id="flare" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.9"/></filter>`)
    .replace(/<radialGradient id="pool"[^>]*>.*?<\/radialGradient>/s, `<radialGradient id="pool" cx="${f(Math.cos(rad(L)) * 9)}" cy="${f(Math.sin(rad(L)) * 9)}" r="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#35332e"/><stop offset="0.5" stop-color="#1f1e1c"/><stop offset="1" stop-color="#100f0e"/></radialGradient>`);
  fs.writeFileSync(process.env.OUT + ".svg", (process.env.MASK ? body.replace('fill="url(#pool)"', `fill="${process.env.MASK}"`) : body).replace("__VB__", `${f(-195.1 * 58 / 210)} -31.57 ${f(297 * 58 / 210)} 58`).replace(/r="34" gradientUnits/, `r="40" gradientUnits`));
}

console.log(jobs.length);
