// Dial Tool, web version — parts 1 to 3: settings · geometry · the scene.
//
// This file is dial.py's parts 1–3 in JavaScript, name for name, so the two can be
// read side by side and a settings file saved by one opens in the other (R8).
// It never touches the page (R6): it takes the settings S and returns shapes.
//
//   millimetres everywhere (R1) · clock angles, 0° = 12, clockwise (R2)
//   draw upright at the origin, then place (R3) · filled shapes only (R4)
//
// Two engines do the heavy work, both handed in by start():
//   PathKit   — Skia's shape combining (union, difference, outline of a stroke);
//               the same engine the Python test harness uses.
//   HarfBuzz  — the text engine: kerning, OpenType features, variable axes, language.

export const VERSION = "beta 4.3";
export const MM = 72 / 25.4;                       // 1 mm in points (files only)
export const MM_PER_PT = 25.4 / 72;

const { sin, cos, tan, acos, hypot, PI, ceil, abs, min, max, round } = Math;
const radians = (a) => a * PI / 180;
const degrees = (a) => a * 180 / PI;
const clone = (v) => JSON.parse(JSON.stringify(v));

// ═════════════════════════════════════════════════════════════
//  1 · SETTINGS
// ═════════════════════════════════════════════════════════════

export const KINDS = ["ticks", "markers", "numerals", "band"];
export const SHAPES = ["bar", "wedge", "dot", "file"];
export const TWELVES = ["same", "double", "triangle", "none"];
export const SKIP_FROM = ["nothing", "markers above", "markers & numerals above", "all marks above"];
export const KNOCK_FROM = ["nothing", "markers above", "markers & numerals above", "everything above"];
const FROM_KINDS = [[], ["markers"], ["markers", "numerals"], ["ticks", "markers", "numerals", "band"]];
export const MODES = ["upright", "radial", "radial, auto-flip", "on path"];
export const HANDS = ["hour", "minute", "second"];
export const HAND_SHAPES = ["baton", "pencil", "sword", "dauphine", "leaf", "arrow", "syringe", "breguet", "lollipop", "file"];
export const DATE_AT = [["3", 90], ["4:30", 135], ["6", 180], ["9", 270], ["12", 0], ["1:30", 45], ["7:30", 225], ["10:30", 315]];
export const WINDOW_KINDS = ["date", "day", "am · pm", "moon phase"];      // what a window shows (web version)
export const LANGS = ["default", "tr", "nl", "de", "pl", "ro", "ca", "ar", "fa", "zh-Hans", "ja"];
export const BEATS = [["sweep", 0], ["quartz · 1/s", 1], ["6 beats/s", 6], ["8 beats/s", 8]];
export const LABEL_SETS = [                        // popups store the index (R9): only ever append
  ["Arabic", "12 1 2 3 4 5 6 7 8 9 10 11"],
  ["Roman · IIII", "XII I II III IIII V VI VII VIII IX X XI"],
  ["Roman · IV", "XII I II III IV V VI VII VIII IX X XI"],
  ["Eastern Arabic", "١٢ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ١٠ ١١"],
  ["Chinese", "十二 一 二 三 四 五 六 七 八 九 十 十一"],
  ["Words", "TWELVE ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN"],
  ["Custom", ""],
  ["Numbers", ""],
];

export const INK = [0.08, 0.08, 0.08, 1];
export const ACCENT = [0.80, 0.22, 0.10, 1];

// every ring carries every key, so changing its kind keeps everything (R7)
export const RING_BASE = {
  kind: 0, name: "", on: true, c: INK,
  r: 13.0, count: 12, start: 0.0, span: 360.0, every: 1, offset: 0, invert: false,
  skip: 0, knock: 0, clear: 0.25,
  shape: 0, file: "", scale: 1.0, len: 2.8, w: 0.7, taper: 0.35, round_out: 0.0, round_in: 0.0, wall: 0.0,
  twelve: 0, twelve_scale: 1.0, twelve_gap: 0.5,
  labels: 0, custom: "", num_from: 0.0, num_step: 5.0, num_digits: 0, mode: 0, size: 2.4, nudge: {},
  family: "Helvetica Neue", ps: "HelveticaNeue", tracking: 0.0, lang: 0, axes: {}, features: {},
  width: 1.0, fill: 100.0,
};
export const TYPE_KEYS = ["family", "ps", "size", "tracking", "lang", "axes", "features"];

// round: corner radius of a hand's ends (web version, beta 3.0). Half the width or more = a round end.
export const HAND_BASE = {
  on: true, shape: 0, file: "", fit: true, scale: 1.0, w_scale: 1.0,
  len: 10.0, w: 1.0, tail: 1.0, tip: 1.0, feature: 1.2, feature_at: 75.0,
  counter: 0.0, wall: 0.0, round: 0.0, c: [0.10, 0.10, 0.12, 1],
};

// windows 2 to 4 (web version, beta 3.0). Window 1 is the date window both tools know: its keys are da_….
// text: what a date or day window shows · hour: of the day, for am · pm · age: of the moon, in days.
export const WINDOW_BASE = {
  on: false, kind: 0, at: 0, r: 10.5, w: 2.6, h: 2.0, round: 0.2, frame: 0.15, clear: 0.25,
  text: "17", size: 62.0, ink: INK, hour: 10.0, age: 14.8,
};
const FIRST_WINDOW = { on: "da_on", kind: "da_kind", at: "da_at", r: "da_r", w: "da_w", h: "da_h", round: "da_round", frame: "da_frame",
  clear: "da_clear", text: "da_day", size: "da_size", ink: "da_ink", hour: "da_hour", age: "da_age" };

export const DEFAULTS = {
  version: 2,
  dial_d: 30.0, margin: 3.0, guides: true,
  c_plate: [0.93, 0.91, 0.86, 1], c_backdrop: [0.80, 0.80, 0.78, 1],
  rings: [],
  ha_on: true, ha_beat: 0, ha_cap: 1.6, c_cap: ACCENT, ha_hour: {}, ha_minute: {}, ha_second: {},
  da_on: false, da_at: 0, da_r: 10.5, da_w: 2.6, da_h: 2.0, da_round: 0.2, da_frame: 0.15,
  da_clear: 0.25, da_day: "17", da_size: 62.0, da_ink: INK,
  da_kind: 0, da_hour: 10.0, da_age: 14.8, windows: [WINDOW_BASE, WINDOW_BASE, WINDOW_BASE],
  t: 10 * 3600 + 9 * 60 + 36,
  out_production: false, out_mirror: false, out_live_text: false,
  out_dpi: 600.0, out_seconds: 4.0, out_fps: 30.0, out_px: 1080,
  ui_section: 0, ui_ring: 0, ui_hand: 0, ui_preview: 0, ui_window: 0,
  // guides (web version, beta 3.0): which ones, their colour, strength (%) and thickness (screen points).
  // The starting values draw what dial.py draws. Preview only, never in a file (R5).
  gd_edge: true, gd_axes: true, gd_rings: true,
  gd_c: [0.0, 0.55, 0.9, 1], gd_strength: 50.0, gd_w: 1.0,
  gd_sel_c: [1.0, 0.45, 0.0, 1], gd_sel_strength: 95.0, gd_sel_w: 1.5,
};

export const NOT_GEOMETRY = ["t", "guides", "ui_section", "ui_ring", "ui_hand", "ui_preview"];
export const NOT_GEOMETRY_PREFIX = ["c_", "ha_", "out_", "gd_"];

/** base values + d's values (deep copies), names turned into popup indexes. */
export function complete(base, d) {
  const out = Object.assign(clone(base), clone(d || {}));
  for (const [key, names] of [["kind", KINDS], ["shape", "fit" in base ? HAND_SHAPES : SHAPES]]) {
    if (typeof out[key] === "string" && names.includes(out[key])) out[key] = names.indexOf(out[key]);
  }
  return out;
}

export const kind_of = (ring) => KINDS[ring.kind];

const KIND_START = {                               // a new ring, sized for a dial of radius R
  ticks: (R) => ({ r: R - 0.6, count: 60, len: 1.0, w: 0.12 }),
  markers: (R) => ({ r: R - 1.6, count: 12, len: 2.8, w: 0.7 }),
  numerals: (R) => ({ r: round(R * 0.67 * 100) / 100, count: 12 }),
  band: (R) => ({ r: R, count: 1, width: 1.0, c: ACCENT }),
};

/** a fresh ring; numerals copy the type of `like` (another numerals ring). */
export function new_ring(kind, S, like = null) {
  const ring = complete(RING_BASE, { kind: KINDS.indexOf(kind), ...KIND_START[kind](S.dial_d / 2) });
  if (like) for (const k of TYPE_KEYS) ring[k] = clone(like[k]);
  const names = new Set(S.rings.map((r) => r.name));
  const base = kind[0].toUpperCase() + kind.slice(1);
  let n = 2;
  ring.name = base;
  while (names.has(ring.name)) ring.name = `${base} ${n++}`;
  return ring;
}

// ── beta 1.0 settings → rings and hands (R8) ─────────────────

const BETA1_DEFAULTS = {
  dial_d: 30.0, margin: 3.0, guides: true,
  c_plate: [0.93, 0.91, 0.86, 1], c_ink: INK, c_hands: [0.10, 0.10, 0.12, 1],
  c_accent: ACCENT, c_backdrop: [0.80, 0.80, 0.78, 1],
  tr_div: 0, tr_inset: 0.6, tr_len: 1.0, tr_w: 0.12, tr_minor_len: 0.5, tr_minor_w: 0.7,
  tr_rail: false, tr_rail_w: 0.1, tr_collision: 0, tr_clear: 0.25,
  mk_shape: 0, mk_svg: "", mk_at: 0, mk_len: 2.8, mk_w: 0.7, mk_offset: 0.0, mk_taper: 0.35,
  mk_round_out: 0.0, mk_round_in: 0.0, mk_wall: 0.0, mk_twelve: 0, mk_twelve_scale: 1.0, mk_twelve_gap: 0.5,
  ty_family: "Helvetica Neue", ty_ps: "HelveticaNeue", ty_size: 2.4, ty_tracking: 0.0,
  ty_lang: 0, ty_axes: {}, ty_features: {},
  nu_set: 0, nu_custom: "", nu_at: 0, nu_mode: 0, nu_r: 10.0, nu_nudge: {},
  ha_on: true, ha_style: 0, ha_svg_hour: "", ha_svg_min: "", ha_svg_sec: "",
  ha_hour_len: 55.0, ha_min_len: 88.0, ha_hour_w: 1.4, ha_min_w: 1.0, ha_tail: 12.0, ha_cap: 1.6,
  ha_sec_on: true, ha_sec_len: 92.0, ha_sec_w: 0.15, ha_counter: 1.1, ha_beat: 0,
  da_on: false, da_at: 0, da_r: 10.5, da_w: 2.6, da_h: 2.0, da_round: 0.2, da_frame: 0.15,
  da_day: "17", da_size: 62.0,
  t: 10 * 3600 + 9 * 60 + 36,
  out_production: false, out_mirror: false, out_dpi: 600.0, out_seconds: 4.0, out_fps: 30.0,
  ui_section: 0,
};

/** beta 1.0's one track + markers + numerals become rings; its hands become three hands. */
export function from_beta1(old) {
  const o = clone(BETA1_DEFAULTS);
  for (const k in old) if (k in BETA1_DEFAULTS) o[k] = old[k];
  const ink = o.c_ink, R = o.dial_d / 2;
  const t_out = R - o.tr_inset, t_in = t_out - o.tr_len;
  const rule = ["one ring", "skip", "knockout", "stack"][o.tr_collision];
  const skip = rule === "one ring" || rule === "skip" ? 1 : 0;
  const knock = rule === "knockout" ? 1 : 0;
  const clear = o.tr_clear;
  const show = (name) => {
    const [every, invert] = { cardinals: [3, false], "non-cardinals": [3, true], "12 only": [12, false], "12 & 6": [6, false] }[name] || [1, false];
    return { every, offset: 0, invert, on: name !== "none" };
  };
  const ring = (kind, name, kw) => complete(RING_BASE, { kind: KINDS.indexOf(kind), name, c: ink, ...kw });
  const typ = { family: o.ty_family, ps: o.ty_ps, size: o.ty_size, tracking: o.ty_tracking, lang: o.ty_lang, axes: o.ty_axes, features: o.ty_features };
  const nudge = {};
  for (const k in o.nu_nudge) nudge[k === "12" ? "0" : String(parseInt(k))] = o.nu_nudge[k];
  const rings = [
    ring("numerals", "Numerals", { r: o.nu_r, count: 12, labels: o.nu_set, custom: o.nu_custom, mode: o.nu_mode, nudge, ...typ,
      ...show(["all", "cardinals", "non-cardinals", "12 only", "12 & 6", "none"][o.nu_at]) }),
    ring("markers", "Markers", { r: rule === "one ring" ? t_out : t_in - o.mk_offset, count: 12,
      shape: o.mk_shape, file: o.mk_svg, len: o.mk_len, w: o.mk_w, taper: o.mk_taper,
      round_out: o.mk_round_out, round_in: o.mk_round_in, wall: o.mk_wall,
      twelve: o.mk_twelve, twelve_scale: o.mk_twelve_scale, twelve_gap: o.mk_twelve_gap,
      ...show(["all", "cardinals", "non-cardinals", "12 only", "none"][o.mk_at]) }),
    ring("ticks", "Minute ticks", { r: t_out, count: 60, len: o.tr_len, w: o.tr_w, skip, knock, clear }),
  ];
  const div = [60, 120, 240, 300][o.tr_div];
  if (div > 60) rings.push(ring("ticks", "Fine ticks", { r: t_out, count: div, len: o.tr_minor_len, w: o.tr_w * o.tr_minor_w, skip: 3, knock, clear }));
  if (o.tr_rail) {
    const rw = o.tr_rail_w;
    rings.push(ring("band", "Outer rail", { r: t_out, count: 1, width: rw, knock, clear }));
    rings.push(ring("band", "Inner rail", { r: t_in + rw, count: 1, width: rw, knock, clear }));
  }
  const style = ["baton", "dauphine", "sword", "leaf", "file"][o.ha_style];
  const hand = (kw) => complete(HAND_BASE, kw);
  const main_hand = (pct, w, svg) => {
    const L = pct / 100 * R;
    return hand({ shape: HAND_SHAPES.indexOf(style), file: svg, fit: false, len: L, w, tail: o.ha_tail / 100 * L, tip: 0.25 * L, feature_at: 18.0, c: o.c_hands });
  };
  const sec_file = style === "file" ? o.ha_svg_sec : "";
  const out = {
    version: 2, dial_d: o.dial_d, margin: o.margin, guides: o.guides,
    c_plate: o.c_plate, c_backdrop: o.c_backdrop, rings,
    ha_on: o.ha_on, ha_beat: o.ha_beat, ha_cap: o.ha_cap, c_cap: o.c_accent,
    ha_hour: main_hand(o.ha_hour_len, o.ha_hour_w, o.ha_svg_hour),
    ha_minute: main_hand(o.ha_min_len, o.ha_min_w, o.ha_svg_min),
    ha_second: hand({ on: o.ha_sec_on, shape: HAND_SHAPES.indexOf(sec_file ? "file" : "baton"), file: sec_file, fit: false,
      len: o.ha_sec_len / 100 * R, w: o.ha_sec_w, tail: R * 0.22, counter: sec_file ? 0.0 : o.ha_counter, c: o.c_accent }),
    da_clear: clear, da_ink: ink,
    ui_section: [0, 1, 1, 1, 1, 2, 3, 4][o.ui_section],
  };
  for (const k of ["da_on", "da_at", "da_r", "da_w", "da_h", "da_round", "da_frame", "da_day", "da_size", "t",
    "out_production", "out_mirror", "out_dpi", "out_seconds", "out_fps"]) out[k] = o[k];
  return out;
}

{
  const start = from_beta1({});
  for (const k of ["rings", "ha_hour", "ha_minute", "ha_second"]) DEFAULTS[k] = start[k];
}
const OLD_ONLY = Object.keys(BETA1_DEFAULTS).filter((k) => !(k in DEFAULTS));

/** DEFAULTS + saved or partial settings. beta 1.0 settings are converted first (R8). */
export function fresh_settings(over = null) {
  over = { ...(over || {}) };
  if (!("rings" in over) && OLD_ONLY.some((k) => k in over)) {
    const kept = {};
    for (const k in over) if (k in DEFAULTS) kept[k] = over[k];
    over = { ...kept, ...from_beta1(over) };
  }
  const S = clone(DEFAULTS);
  for (const k in over) if (k in S) S[k] = clone(over[k]);
  S.rings = S.rings.map((r) => complete(RING_BASE, r));
  if (!S.rings.length) S.rings = [complete(RING_BASE, {})];
  for (const h of HANDS) S["ha_" + h] = complete(HAND_BASE, S["ha_" + h]);
  S.windows = [0, 1, 2].map((i) => ({ ...clone(WINDOW_BASE), ...((Array.isArray(S.windows) && S.windows[i]) || {}) }));
  S.ui_window = min(max(parseInt(S.ui_window) || 0, 0), 3);
  S.ui_ring = min(max(parseInt(S.ui_ring) || 0, 0), S.rings.length - 1);
  S.ui_preview = 0;
  return S;
}

// ── a dial as a link ─────────────────────────────────────────
//   A link carries only what differs from the starting values, so it stays short.
//   That makes the starting values part of every link ever copied: from now on
//   DEFAULTS, RING_BASE, HAND_BASE and the starting rings and hands must not change (R31).
//   To change one, add LINK_SCHEME 2 with its own table and keep reading scheme 1 with this one.

export const LINK_SCHEME = 1;

function differing(d, base) {
  const out = {};
  for (const k in d) if (JSON.stringify(d[k]) !== JSON.stringify(base[k])) out[k] = d[k];
  return out;
}

/** the settings, without everything that still has its starting value and without the window's own state. */
export function lean(S) {
  const out = {};
  for (const k in S) {
    if (k.startsWith("ui_") || k === "version" || JSON.stringify(S[k]) === JSON.stringify(DEFAULTS[k])) continue;
    if (k === "rings") out.rings = S.rings.map((r) => differing(r, RING_BASE));
    else if (k === "windows") out.windows = S.windows.map((w) => differing(w, WINDOW_BASE));
    else if (HANDS.some((h) => k === "ha_" + h)) out[k] = differing(S[k], HAND_BASE);
    else out[k] = S[k];
  }
  return out;
}

// ═════════════════════════════════════════════════════════════
//  2 · GEOMETRY
// ═════════════════════════════════════════════════════════════

// ── the engines ──────────────────────────────────────────────

let PK = null;                                     // PathKit (shape combining)
let HB = null;                                     // HarfBuzz (text)

export function start(pathkit, harfbuzz) {
  PK = pathkit;
  HB = harfbuzz;
}

export const NOTES = [];                           // messages for the log (R17)
export function note(message) {
  if (!NOTES.includes(message)) NOTES.push(message);
}

// ── a path: a list of moves, lines, curves and closes, in mm ──

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

export class Path {
  constructor(d = []) {
    this.d = d;                                    // ["M", x, y] · ["L", x, y] · ["C", x1, y1, x2, y2, x, y] · ["Z"]
  }
  copy() { return new Path(this.d.map((c) => c.slice())); }
  moveTo(p) { this.d.push(["M", p[0], p[1]]); return this; }
  lineTo(p) { this.d.push(["L", p[0], p[1]]); return this; }
  curveTo(a, b, c) { this.d.push(["C", a[0], a[1], b[0], b[1], c[0], c[1]]); return this; }
  closePath() { this.d.push(["Z"]); return this; }
  polygon(...points) {
    points.forEach((p, i) => (i ? this.lineTo(p) : this.moveTo(p)));
    return this.closePath();
  }
  rect(x, y, w, h) { return this.polygon([x, y], [x + w, y], [x + w, y + h], [x, y + h]); }
  oval(x, y, w, h) {
    const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry, k = 0.5522847498307936;
    this.moveTo([cx + rx, cy]);
    this.curveTo([cx + rx, cy + ry * k], [cx + rx * k, cy + ry], [cx, cy + ry]);
    this.curveTo([cx - rx * k, cy + ry], [cx - rx, cy + ry * k], [cx - rx, cy]);
    this.curveTo([cx - rx, cy - ry * k], [cx - rx * k, cy - ry], [cx, cy - ry]);
    this.curveTo([cx + rx * k, cy - ry], [cx + rx, cy - ry * k], [cx + rx, cy]);
    return this.closePath();
  }
  line(p0, p1) { return this.moveTo(p0).lineTo(p1); }
  appendPath(p) { for (const c of p.d) this.d.push(c.slice()); return this; }
  /** change every point with fn(x, y) → [x, y]. */
  map(fn) {
    for (const c of this.d) {
      for (let i = 1; i < c.length; i += 2) [c[i], c[i + 1]] = fn(c[i], c[i + 1]);
    }
    return this;
  }
  translate(dx, dy) { return this.map((x, y) => [x + dx, y + dy]); }
  scale(sx, sy = sx) { return this.map((x, y) => [x * sx, y * sy]); }
  /** counter-clockwise, in degrees, about `center` (as DrawBot turns). */
  rotate(angle, center = [0, 0]) {
    const s = sin(radians(angle)), k = cos(radians(angle)), [cx, cy] = center;
    return this.map((x, y) => [cx + (x - cx) * k - (y - cy) * s, cy + (x - cx) * s + (y - cy) * k]);
  }
  /** [x0, y0, x1, y1] of the shape itself (curves measured, not their handles), or null if empty. */
  bounds() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, px = 0, py = 0;
    const see = (x, y) => { x0 = min(x0, x); y0 = min(y0, y); x1 = max(x1, x); y1 = max(y1, y); };
    for (const c of this.d) {
      if (c[0] === "M" || c[0] === "L") { see(c[1], c[2]); px = c[1]; py = c[2]; }
      if (c[0] === "C") {
        for (const axis of [0, 1]) {               // where the curve turns round in x, then in y
          const a = axis ? py : px, b = c[1 + axis], d = c[3 + axis], e = c[5 + axis];
          const A = -a + 3 * b - 3 * d + e, B = 2 * (a - 2 * b + d), C = b - a;
          const roots = abs(A) < 1e-12 ? (abs(B) < 1e-12 ? [] : [-C / B])
            : (B * B - 4 * A * C < 0 ? [] : [(-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A), (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A)]);
          for (const t of roots) {
            if (t > 0 && t < 1) {
              const u = 1 - t;
              const at = (i) => u * u * u * (i ? py : px) + 3 * u * u * t * c[1 + i] + 3 * u * t * t * c[3 + i] + t * t * t * c[5 + i];
              see(at(0), at(1));
            }
          }
        }
        see(c[5], c[6]); px = c[5]; py = c[6];
      }
    }
    return x0 === Infinity ? null : [x0, y0, x1, y1];
  }
  /** the path as SVG path data. flip: SVG's y grows downward. */
  svg(digits = 5, flip = false) {
    const f = (v) => { const s = v.toFixed(digits); return s.includes(".") ? s.replace(/\.?0+$/, "") || "0" : s; };
    let out = "";
    for (const c of this.d) {
      out += c[0];
      for (let i = 1; i < c.length; i += 2) out += (i > 1 ? " " : "") + f(c[i]) + " " + f(flip ? -c[i + 1] : c[i + 1]);
    }
    return out;
  }
  /** SVG path data (absolute M L Q C Z, as PathKit writes it) → a path. */
  static parse(text) {
    const p = new Path();
    let x = 0, y = 0;
    for (const m of text.matchAll(/([MLQCZ])([^MLQCZ]*)/gi)) {
      const n = (m[2].match(NUMBER) || []).map(Number), op = m[1].toUpperCase();
      if (op === "Z") { p.closePath(); continue; }
      const size = { M: 2, L: 2, Q: 4, C: 6 }[op];
      for (let i = 0; i + size <= n.length; i += size) {
        const v = n.slice(i, i + size);
        if (op === "M") p.moveTo(v);
        else if (op === "L") p.lineTo(v);
        else if (op === "C") p.curveTo([v[0], v[1]], [v[2], v[3]], [v[4], v[5]]);
        else p.curveTo([x + 2 / 3 * (v[0] - x), y + 2 / 3 * (v[1] - y)],          // a quadratic, as a cubic
          [v[2] + 2 / 3 * (v[0] - v[2]), v[3] + 2 / 3 * (v[1] - v[3])], [v[2], v[3]]);
        x = v[size - 2]; y = v[size - 1];
      }
    }
    return p;
  }

  /** the path's closed outlines, one path each. */
  contours() {
    const out = [];
    for (const c of this.d) {
      if (c[0] === "M") out.push(new Path());
      if (out.length) out[out.length - 1].d.push(c.slice());
    }
    return out;
  }
  /** the points of one outline, curves cut into short straight pieces (for measuring only). */
  _points() {
    const pts = [];
    for (const c of this.d) {
      if (c[0] === "M" || c[0] === "L") pts.push([c[1], c[2]]);
      if (c[0] === "C") {
        const [x0, y0] = pts[pts.length - 1];
        for (let i = 1; i <= 8; i++) {
          const t = i / 8, u = 1 - t;
          pts.push([u * u * u * x0 + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5],
            u * u * u * y0 + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6]]);
        }
      }
    }
    return pts;
  }
  /** one outline, drawn the other way round. */
  _reversed() {
    const d = this.d.filter((c) => c[0] !== "Z"), out = new Path();
    const end = (c) => [c[c.length - 2], c[c.length - 1]];
    out.moveTo(end(d[d.length - 1]));
    for (let i = d.length - 1; i > 0; i--) {
      const c = d[i], to = end(d[i - 1]);
      if (c[0] === "C") out.curveTo([c[3], c[4]], [c[1], c[2]], to);
      else out.lineTo(to);
    }
    return out.closePath();
  }
  /** make holes real. PathKit hands back outlines that don't overlap, but a hole may run the same
   *  way round as its shape — which files and screens (they fill "non-zero") would fill in.
   *  So: an outline inside an odd number of others is a hole, and is turned to run the other way. */
  _wound() {
    const parts = this.contours().map((c) => ({ c, pts: c._points() })).filter((o) => o.pts.length > 2);
    if (parts.length < 2) return this;
    const inside = (p, pts) => {
      let hit = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    const area = (pts) => pts.reduce((sum, p, i) => sum + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0);
    const out = new Path();
    for (const o of parts) {
      const probe = [(o.pts[0][0] + o.pts[1][0]) / 2, (o.pts[0][1] + o.pts[1][1]) / 2];
      const depth = parts.filter((other) => other !== o && inside(probe, other.pts)).length;
      const hole = depth % 2 === 1, clockwise = area(o.pts) < 0;
      out.appendPath(hole === clockwise ? o.c : o.c._reversed());
    }
    return out;
  }

  // shape combining — through PathKit, the result comes back as a plain path
  _combined(other, op) {
    if (empty(other)) return this.copy();
    if (empty(this)) return op === "UNION" ? other.copy() : new Path();
    const a = PK.FromSVGString(this.svg(6)), b = PK.FromSVGString(other.svg(6));
    a.op(b, PK.PathOp[op]);
    const out = Path.parse(a.toSVGString())._wound();
    a.delete(); b.delete();
    return out;
  }
  union(other) { return this._combined(other, "UNION"); }
  intersection(other) { return empty(this) || empty(other) ? new Path() : this._combined(other, "INTERSECT"); }
  difference(other) { return this._combined(other, "DIFFERENCE"); }
  removeOverlap() {
    if (empty(this)) return this;
    const a = PK.FromSVGString(this.svg(6));
    a.simplify();
    this.d = Path.parse(a.toSVGString())._wound().d;
    a.delete();
    return this;
  }
  /** the outline of a line of this width drawn along the path, round joins and ends. */
  expandStroke(width) {
    const a = PK.FromSVGString(this.svg(6));
    a.stroke({ width, join: PK.StrokeJoin.ROUND, cap: PK.StrokeCap.ROUND });
    a.simplify();
    const out = Path.parse(a.toSVGString())._wound();
    a.delete();
    return out;
  }
}

// ── basics ───────────────────────────────────────────────────

/** point at radius r, clock angle a. */
export const clock_point = (r, a) => [r * sin(radians(a)), r * cos(radians(a))];

/** a shape drawn upright at the origin → pushed out to radius r, turned to clock angle a. */
export function place(p, r, a) {
  return p.translate(0, r).rotate(-a);
}

export const circle = (d) => new Path().oval(-d / 2, -d / 2, d, d);

export function merge(paths) {
  const out = new Path();
  for (const p of paths) if (p) out.appendPath(p);
  return out;
}

export const empty = (p) => !p || p.d.length === 0 || p.bounds() === null;

/** closed polygon; radii[i] rounds corner i with a true fillet (tangent arc). */
export function poly(points, radii = null) {
  const n = points.length;
  radii = radii || points.map(() => 0);
  const segs = [];
  for (let i = 0; i < n; i++) {
    const P = points[i], A = points[(i + n - 1) % n], B = points[(i + 1) % n];
    let r = radii[i];
    let ux = A[0] - P[0], uy = A[1] - P[1], vx = B[0] - P[0], vy = B[1] - P[1];
    const la = hypot(ux, uy), lb = hypot(vx, vy);
    if (r <= 0 || la < 1e-9 || lb < 1e-9) { segs.push([P]); continue; }
    ux /= la; uy /= la; vx /= lb; vy /= lb;
    const theta = acos(max(-1, min(1, ux * vx + uy * vy)));        // inside angle
    if (theta < 1e-3 || theta > PI - 1e-3) { segs.push([P]); continue; }
    let d = r / tan(theta / 2);                                    // cut-back along each edge
    const dmax = min(la, lb) / 2;
    if (d > dmax) { d = dmax; r = dmax * tan(theta / 2); }
    const S = [P[0] + ux * d, P[1] + uy * d], E = [P[0] + vx * d, P[1] + vy * d];
    const h = 4 / 3 * tan((PI - theta) / 4) * r;                   // bezier handle for that arc
    segs.push([S, [S[0] - ux * h, S[1] - uy * h], [E[0] - vx * h, E[1] - vy * h], E]);
  }
  const p = new Path();
  p.moveTo(segs[0][0]);
  segs.forEach((s, k) => {
    if (k) p.lineTo(s[0]);
    if (s.length === 4) p.curveTo(s[1], s[2], s[3]);
  });
  return p.closePath();
}

export const rounded_rect = (w, h, r) => poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], [r, r, r, r]);

const near = (a, b, tol = 1.0) => b !== null && b !== undefined && abs(((a - b + 180) % 360 + 360) % 360 - 180) < tol;

/** continue p along a circle of radius r, from clock angle a0 (where p is) to a1. */
function arc(p, r, a0, a1) {
  const n = max(1, ceil(abs(a1 - a0) / 90 - 1e-9));
  const step = (a1 - a0) / n;
  for (let k = 0; k < n; k++) {
    const u = radians(a0 + k * step), v = radians(a0 + (k + 1) * step);
    const h = 4 / 3 * tan((v - u) / 4) * r;
    const x0 = r * sin(u), y0 = r * cos(u), x3 = r * sin(v), y3 = r * cos(v);
    p.curveTo([x0 + h * cos(u), y0 - h * sin(u)], [x3 - h * cos(v), y3 + h * sin(v)], [x3, y3]);
  }
}

/** the area between two radii and two clock angles. A full turn makes a ring; r_in 0 a pie. */
export function sector(r_in, r_out, a0, a1) {
  r_in = max(r_in, 0);
  if (r_out <= r_in) return null;
  if (a1 - a0 >= 360 - 1e-6) {
    const p = circle(2 * r_out);
    return r_in > 1e-6 ? p.difference(circle(2 * r_in)) : p;
  }
  const p = new Path();
  p.moveTo(clock_point(r_out, a0));
  arc(p, r_out, a0, a1);
  if (r_in > 1e-6) {
    p.lineTo(clock_point(r_in, a1));
    arc(p, r_in, a1, a0);
  } else p.lineTo([0, 0]);
  return p.closePath();
}

/** the same shape grown (d > 0) or shrunk (d < 0) by d mm, corners rounded. */
export function offset(p, d) {
  if (empty(p) || abs(d) < 1e-6) return p;
  const band = p.expandStroke(2 * abs(d));         // a band of width 2|d| along the outline
  return d > 0 ? p.union(band) : p.difference(band);
}

const _memo = new Map();

/** remember a result by its inputs, so editing one ring doesn't rebuild the others. */
function memo(key, build) {
  if (!_memo.has(key)) {
    if (_memo.size > 600) _memo.clear();
    _memo.set(key, build());
  }
  return _memo.get(key);
}
export const forget = () => _memo.clear();

/** a settings object as text, without colour and name. */
function key_of(d, skip = ["c", "name"]) {
  const k = {};
  for (const a of Object.keys(d).sort()) if (!skip.includes(a)) k[a] = d[a];
  return JSON.stringify(k);
}

// ── imported files ───────────────────────────────────────────
//   Not in the web version yet: a "file" shape falls back to a bar or a baton (R17).

function file_shape(name) {
  if (name) note(`imported shapes aren't in the web version yet: ${name} is drawn as a plain shape`);
  return null;
}

// ── type: every numeral is shaped by HarfBuzz and becomes outlines (R10) ──

const fonts = new Map();                           // PostScript name → {face, font, upem, family, style, ps}
let fallback_ps = null;                            // the font that ships with the page

/** read a font file's bytes (index: which font of a collection). → what it is, or null. */
export function add_font(bytes, index = 0, fallback = false) {
  try {
    const face = new HB.Face(new HB.Blob(bytes), index);
    if (!face.upem) return null;
    const listed = face.listNames();               // some system fonts carry a name in one language only
    const name = (id) => face.getName(id, "en") || listed.filter((n) => n.nameId === id).map((n) => face.getName(id, n.language)).find(Boolean) || "";
    const info = {
      face, font: new HB.Font(face), upem: face.upem,
      ps: name(6) || name(4), family: name(16) || name(1), style: name(17) || name(2),
    };
    if (!info.ps) return null;
    fonts.set(info.ps, info);
    if (fallback) fallback_ps = info.ps;
    forget();                                      // numerals drawn with a stand-in must be redrawn
    return info;
  } catch (e) {
    return null;
  }
}

export const has_font = (ps) => fonts.has(ps);
export const font_list = () => [...fonts.values()];

/** the font for a ring's type; the page's own font stands in for one that isn't loaded. */
export function font_of(t) {
  if (fonts.has(t.ps)) return fonts.get(t.ps);
  note(`font ${t.family} (${t.ps}) isn't loaded: ${fonts.get(fallback_ps).family} stands in. Add it in the ring's Type rows.`);
  return fonts.get(fallback_ps);
}

/** a font's variable axes: tag → {min, default, max, name}. */
export function font_axes(info) {
  const out = {};
  const axes = info.face.getAxisInfos();
  for (const tag in axes) out[tag] = { min: axes[tag].min, default: axes[tag].default, max: axes[tag].max, name: info.face.getName(axes[tag].nameId, "en") || tag };
  return out;
}

/** a font's switchable OpenType features: [tag, the designer's own name or ""]. */
export function font_features(info) {
  const seen = new Map();
  for (const table of ["GSUB", "GPOS"]) {
    info.face.getTableFeatureTags(table).forEach((tag, i) => {
      if (seen.has(tag)) return;
      const ids = info.face.getFeatureNameIds(table, i);
      seen.set(tag, ids && ids.uiLabelNameId ? info.face.getName(ids.uiLabelNameId, "en") : "");
    });
  }
  return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/** text → glyphs with positions, in mm. Font, tracking, features, axes and language applied. */
function shaped(txt, t, size) {
  return memo("text" + JSON.stringify([txt, t.ps, size, t.tracking, t.lang, t.axes, t.features]), () => {
    const info = font_of(t), k = size / info.upem, tr = t.tracking / 1000 * size;
    info.font.setVariations(Object.entries(t.axes || {}).map(([tag, v]) => new HB.Variation(tag, v)));
    const buffer = new HB.Buffer();
    buffer.addText(txt);
    buffer.guessSegmentProperties();
    const lang = LANGS[t.lang];
    if (lang !== "default") buffer.setLanguage(lang);
    HB.shape(info.font, buffer, Object.entries(t.features || {}).map(([tag, on]) => new HB.Feature(tag, on ? 1 : 0)));
    let x = 0;
    const p = new Path();
    for (const g of buffer.getGlyphInfosAndPositions()) {
      const outline = new Path();
      for (const c of info.font.glyphToJson(g.codepoint)) {
        const v = c.values;
        if (c.type === "M") outline.moveTo(v);
        else if (c.type === "L") outline.lineTo(v);
        else if (c.type === "C") outline.curveTo([v[0], v[1]], [v[2], v[3]], [v[4], v[5]]);
        else if (c.type === "Q") {
          const last = outline.d[outline.d.length - 1], px = last[last.length - 2], py = last[last.length - 1];
          outline.curveTo([px + 2 / 3 * (v[0] - px), py + 2 / 3 * (v[1] - py)], [v[2] + 2 / 3 * (v[0] - v[2]), v[3] + 2 / 3 * (v[1] - v[3])], [v[2], v[3]]);
        } else outline.closePath();
      }
      outline.scale(k).translate(x + (g.xOffset || 0) * k, (g.yOffset || 0) * k);
      p.appendPath(outline);
      x += (g.xAdvance || 0) * k + tr;
    }
    return { path: p, width: x };
  });
}

/** text → outlines. */
export const text_path = (txt, t, size) => shaped(txt, t, size).path.copy();

/** typeset width, kerning and tracking included. */
export const advance = (txt, t, size) => (txt ? shaped(txt, t, size).width : 0);

function centred(p) {
  const b = p.bounds();
  if (b) p.translate(-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2);
  return p;
}

// ── positions: where a ring puts things ──────────────────────

/** clock angle of every position. Full turn: evenly round. Partial span: both ends marked.
 *  Bands: each position starts a segment, segments tile the span. */
export function ring_angles(ring) {
  const n = max(parseInt(ring.count) || 1, 1), span = ring.span;
  const step = kind_of(ring) === "band" || span >= 360 ? span / n : (n > 1 ? span / (n - 1) : 0);
  return Array.from({ length: n }, (_, i) => ring.start + i * step);
}

/** the every / offset / skip-those-instead pattern. */
function picked(ring, i) {
  const every = max(parseInt(ring.every) || 1, 1);
  const hit = (((i - (parseInt(ring.offset) || 0)) % every) + every) % every === 0;
  return hit !== Boolean(ring.invert);
}

// ── ticks and markers ────────────────────────────────────────

/** one mark centred on the origin, pointing outward (+y). */
function mark_outline(ring, L, W, shape = null, taper = null, grow = 0, solid = false) {
  shape = shape || SHAPES[ring.shape];
  taper = taper === null ? ring.taper : taper;
  const wall = solid ? 0 : ring.wall;
  if (shape === "file") {
    file_shape(ring.file);
    shape = "bar";                                 // no file: a bar (R17)
  }
  const outline = (L, W, ro, ri) => {
    if (shape === "dot") return circle(W);
    const wi = shape === "bar" ? W : W * taper;    // width at the inner end
    if (wi < 1e-3) return poly([[0, -L / 2], [W / 2, L / 2], [-W / 2, L / 2]], [ri, ro, ro]);   // taper 0 → triangle
    return poly([[-wi / 2, -L / 2], [wi / 2, -L / 2], [W / 2, L / 2], [-W / 2, L / 2]], [ri, ri, ro, ro]);
  };
  const ro = ring.round_out, ri = ring.round_in;
  let p = outline(L + 2 * grow, W + 2 * grow, ro + grow, ri + grow);
  if (wall > 0 && W - 2 * wall > 0.01 && (shape === "dot" || L - 2 * wall > 0.01)) {
    p = p.difference(outline(L - 2 * wall, W - 2 * wall, max(ro - wall, 0), max(ri - wall, 0)));
  }
  return p;
}

/** the mark at position i: its outer end on the ring's radius. */
function mark_at(ring, i, a, grow = 0, solid = false) {
  const first = kind_of(ring) === "markers" && i === 0;
  const style = first ? TWELVES[ring.twelve] : "same";
  if (style === "none") return null;
  const k = first ? ring.twelve_scale : 1;
  const L = ring.len * k, W = ring.w * k;
  const shape = style === "triangle" ? mark_outline(ring, L * 1.1, W * 2.4, "wedge", 0, grow, solid) : mark_outline(ring, L, W, null, null, grow, solid);
  const b = shape.bounds();
  if (!b) return null;
  const extent = (b[3] - b[1]) - 2 * grow, width = (b[2] - b[0]) - 2 * grow;
  const r_mid = max(ring.r - extent / 2, 0.1);
  if (style === "double") {
    const da = degrees((ring.twelve_gap + width) / 2 / r_mid);
    return merge([place(shape.copy(), r_mid, a - da), place(shape, r_mid, a + da)]);
  }
  return place(shape, r_mid, a);
}

// ── numerals ─────────────────────────────────────────────────

function number_label(v, digits) {
  const s = abs(v - round(v)) < 1e-9 ? String(round(v)) : String(parseFloat(v.toPrecision(6)));
  return digits ? s.padStart(parseInt(digits), "0") : s;
}

/** one label per position. */
export function ring_labels(ring) {
  const n = max(parseInt(ring.count) || 1, 1);
  const [name, txt] = LABEL_SETS[ring.labels];
  if (name === "Custom") {
    const parts = ring.custom.split(",").map((s) => s.trim());
    return Array.from({ length: n }, (_, i) => parts[i] || "");
  }
  if (name === "Numbers") return Array.from({ length: n }, (_, i) => number_label(ring.num_from + i * ring.num_step, ring.num_digits));
  const parts = txt.split(" ");
  return Array.from({ length: n }, (_, i) => parts[i % parts.length]);
}

/** a word on the circle, letter by letter: [letter, clock angle, flipped?, offset].
 *  Real kerning and tracking; one baseline for all letters; the bottom half flips to read left → right. */
function path_letters(txt, r, a, t, size) {
  const flip = ((a % 360) + 360) % 360 > 90 && ((a % 360) + 360) % 360 < 270;
  const tr = t.tracking / 1000 * size;
  const letters = [...txt];
  const adv = letters.map((_, i) => advance(letters.slice(0, i).join(""), t, size));   // where each letter starts
  adv.push(advance(txt, t, size));
  const total = adv[adv.length - 1] - tr;
  const whole = text_path(txt, t, size).bounds();
  const yc = whole ? (whole[1] + whole[3]) / 2 : 0;
  const out = [];
  letters.forEach((ch, i) => {
    if (!ch.trim()) return;
    const own = advance(ch, t, size) - tr;
    const c = adv[i] + own / 2 - total / 2;        // letter centre along the word
    out.push([ch, flip ? a - degrees(c / r) : a + degrees(c / r), flip, [-own / 2, -yc]]);
  });
  return out;
}

function on_path(txt, r, a, t, size) {
  const out = [];
  for (const [ch, angle, flip, [dx, dy]] of path_letters(txt, r, a, t, size)) {
    const g = text_path(ch, t, size).translate(dx, dy);
    if (flip) g.rotate(180);
    out.push(place(g, r, angle));
  }
  return merge(out);
}

/** placement, radius, angle, size and rotation of the numeral at position i, nudge included. */
function numeral_setup(ring, i, a) {
  const n = ring.nudge[String(i)] || {};
  return [MODES[ring.mode], ring.r + (n.dr || 0), a + (n.da || 0), ring.size * (n.s ?? 1), n.rot || 0];
}

function numeral_at(ring, i, a0, label) {
  const [mode, r, a, size, rot] = numeral_setup(ring, i, a0);
  if (mode === "on path") {
    const p = on_path(label, r, a, ring, size);
    if (rot) p.rotate(-rot, clock_point(r, a));
    return p;
  }
  const p = centred(text_path(label, ring, size));
  if (mode === "upright") {
    p.rotate(-rot);
    p.translate(...clock_point(r, a));
  } else {
    const turn = ((a % 360) + 360) % 360;
    const flip = mode === "radial, auto-flip" && turn > 90 && turn < 270 ? 180 : 0;
    p.rotate(-(flip + rot));
    place(p, r, a);
  }
  return p;
}

// ── live text: the export option (as in dial.py) ─────────────
//   The same placements as the outlines above, described so a file can keep them as text.
//   Positions come from the outlines' bounds, so live and outlined numerals sit in the same place.
//   A text is {txt, t (its type), size, fill, steps, at}: steps are moves in mm with y up,
//   ["t", x, y] = move, ["r", degrees anticlockwise, cx, cy] = turn; at = where the baseline starts.

function text_centre(txt, t, size) {
  const b = text_path(txt, t, size).bounds();
  return b ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : null;
}

function numeral_live(ring, i, a0, label) {
  const [mode, r, a, size, rot] = numeral_setup(ring, i, a0);
  const base = { t: ring, size, fill: ring.c };
  if (mode === "on path") {
    return path_letters(label, r, a, ring, size).map(([ch, angle, flip, pos]) => ({
      ...base, txt: ch, at: pos,
      steps: [...(rot ? [["r", -rot, ...clock_point(r, a)]] : []), ["r", -angle, 0, 0], ["t", 0, r], ...(flip ? [["r", 180, 0, 0]] : [])],
    }));
  }
  const c = text_centre(label, ring, size);
  if (!c) return [];
  const turn = ((a % 360) + 360) % 360;
  const flip = mode === "radial, auto-flip" && turn > 90 && turn < 270 ? 180 : 0;
  const steps = mode === "upright" ? [["t", ...clock_point(r, a)], ["r", -rot, 0, 0]] : [["r", -a, 0, 0], ["t", 0, r], ["r", -(flip + rot), 0, 0]];
  return [{ ...base, txt: label, at: [-c[0], -c[1]], steps }];
}

/** a scene item as live text, or null if it has none: {texts, removed}. removed = what knockouts
 *  and the windows' clear zones cut away from the outlines; live text can't be cut, so a file
 *  hides that area with a clipping mask. */
export function live_texts(S, statik, item) {
  if (item.role === "ring" && item.ring.kind === "numerals") {
    const d = item.ring, ring = d.ring, angles = ring_angles(ring), labels = ring_labels(ring);
    const removed = d.path !== d.shape ? d.shape.difference(d.path) : null;
    return { texts: d.keep.filter((i) => labels[i]).flatMap((i) => numeral_live(ring, i, angles[i], labels[i])), removed: removed && !empty(removed) ? removed : null };
  }
  if (item.role === "date number") {
    const x = statik.windows.find((w) => w.index === item.window);
    if (!x || !["date", "day"].includes(WINDOW_KINDS[x.w.kind])) return null;
    const t = date_type(S), size = x.w.h * x.w.size / 100, c = text_centre(x.w.text, t, size);
    if (!c) return null;
    return { texts: [{ txt: x.w.text, t, size, fill: x.w.ink, at: [-c[0], -c[1]], steps: [["t", ...clock_point(x.w.r, window_angle(x.w))]] }], removed: null };
  }
  return null;
}

// ── one ring ─────────────────────────────────────────────────

/** → [one shape, clock angles that got something, the piece at each kept position].
 *  keep = the position indexes to draw. grow > 0 makes the outline used to knock out rings below. */
function ring_shapes(ring, keep, grow = 0, solid = false) {
  return memo("shapes" + key_of(ring) + JSON.stringify([keep, round(grow * 1e6), solid]), () => {
    const kind = kind_of(ring), angles = ring_angles(ring);
    const parts = [], taken = [], at = [];
    if (kind === "ticks" || kind === "markers") {
      for (const i of keep) {
        const m = mark_at(ring, i, angles[i], grow, solid);
        if (m) { parts.push(m); taken.push(angles[i]); at.push(i); }
      }
      return [merge(parts).removeOverlap(), taken, at, parts];
    }
    if (kind === "numerals") {
      const labels = ring_labels(ring);
      for (const i of keep) {
        if (labels[i]) { parts.push(numeral_at(ring, i, angles[i], labels[i])); taken.push(angles[i]); at.push(i); }
      }
    } else {                                       // band
      const n = max(parseInt(ring.count) || 1, 1);
      const length = ring.span / n * min(max(ring.fill, 0), 100) / 100;
      for (const i of keep) { parts.push(sector(ring.r - ring.width, ring.r, angles[i], angles[i] + length)); at.push(i); }
    }
    const out = merge(parts);
    return [grow ? offset(out, grow) : out, taken, at, parts];
  });
}

/** window 1, read through the names windows 2 to 4 use (it is stored as da_…, as dial.py stores it). */
export function first_window(S) {
  return new Proxy({}, {
    get: (_, key) => S[FIRST_WINDOW[key]],
    set: (_, key, value) => { S[FIRST_WINDOW[key]] = value; return true; },
    has: (_, key) => key in FIRST_WINDOW,
    ownKeys: () => Object.keys(FIRST_WINDOW),
    getOwnPropertyDescriptor: (_, key) => (key in FIRST_WINDOW ? { enumerable: true, configurable: true, value: S[FIRST_WINDOW[key]] } : undefined),
  });
}
/** the four windows, in order; ui_window counts along this list. */
export const windows_of = (S) => [first_window(S), ...S.windows];
const window_angle = (w) => DATE_AT[w.at][1];

/** every visible ring, top first: its positions, what it skips, what knocks it out.
 *
 *  skip      — drop positions where the chosen rings above have a mark (bands have no positions).
 *  knock out — cut gaps (clearance) round the shapes of the chosen rings above.
 *  cut       — the date window's clear zone; markers and numerals also leave its position empty. */
function build_rings(S, cut = null) {
  const holes = windows_of(S).filter((w) => w.on).map(window_angle), done = [];
  for (const ring of S.rings) {
    if (!ring.on) continue;
    const kind = kind_of(ring), angles = ring_angles(ring);
    let keep = angles.map((_, i) => i).filter((i) => picked(ring, i));
    if (kind === "markers" || kind === "numerals") keep = keep.filter((i) => !holes.some((a) => near(angles[i], a)));
    if (ring.skip) {
      const taken = done.filter((d) => FROM_KINDS[ring.skip].includes(d.kind)).flatMap((d) => d.taken);
      keep = keep.filter((i) => !taken.some((a) => near(angles[i], a, 0.01)));
    }
    const [shape, taken, at, parts] = ring_shapes(ring, keep);
    const sources = done.filter((d) => FROM_KINDS[ring.knock].includes(d.kind));
    const final = () => {
      let out = shape;
      if (sources.length && !empty(out)) {
        const cutter = merge(sources.map((d) => ring_shapes(d.ring, d.keep, ring.clear, true)[0]));
        if (!empty(cutter)) out = out.difference(cutter.removeOverlap());
      }
      if (cut && !empty(out)) out = out.difference(cut);
      return out;
    };
    const key = "final" + key_of(ring) + JSON.stringify([keep, sources.map((d) => [key_of(d.ring), d.keep]), cut ? date_key(S) : null]);
    done.push({ ring, kind, keep, taken, shape, at, parts, path: memo(key, final) });
  }
  return done;
}

// ── windows: date · day · am–pm · moon phase ─────────────────
//   A window is a hole in the plate with something showing through from below, drawn on white.
//   Everything is in the window's own space first (its centre at the origin, upright), then moved
//   to its position. Filled shapes only (R4).

function date_key(S) {
  const all = windows_of(S).map((w) => { const k = { ...w }; delete k.ink; return k; });
  return JSON.stringify(all) + JSON.stringify(TYPE_KEYS.map((a) => date_type(S)[a]));
}

/** a window's text uses the type of the top numerals ring. */
function date_type(S) {
  return S.rings.find((ring) => kind_of(ring) === "numerals") || RING_BASE;
}

/** the moon window, from its width alone: an arch over two humps. The moon, a disc as big as a hump,
 *  rises from behind the left hump (new), stands clear in the middle (full) and sets behind the right one.
 *  → [the opening, the night sky (opening minus moon and stars)] */
function moon_window(w, age) {
  const m = w / 4, base = -0.36 * w;               // hump and moon radius · the bottom edge
  const arch = circle(2 * 0.5336 * w).translate(0, base + 0.1864 * w).intersection(new Path().rect(-w, base, 2 * w, 2 * w));
  const opening = arch.difference(circle(2 * m).translate(-m, base)).difference(circle(2 * m).translate(m, base));
  const f = (((age % 29.53) + 29.53) % 29.53) / 29.53;           // 0 new · 0.5 full · 1 new again
  const moon = circle(2 * m).translate(-m * cos(PI * f), base - 0.3 * m + (Math.sqrt(3) + 0.3) * m * sin(PI * f));
  const stars = merge([[-0.3, 0.5], [0.33, 0.42], [0.08, 0.63]].map(([x, y]) => circle(0.07 * w).translate(x * w, base + y * w)));
  return [opening, opening.difference(moon).difference(stars)];
}

/** the am · pm window: a disc turns once a day under it, pivot on the window's bottom edge — half night
 *  (dark, with a crescent and two stars), half day (a sun). hour 12 = all day, 0 = all night. → what is dark */
function day_night(w, h, hour) {
  const opening = new Path().rect(-w / 2, -h / 2, w, h), pivot = [0, -h / 2];
  const turn = (((hour % 24) + 24) % 24) / 24 * 360, reach = 0.55 * h;       // clock angle of the night half's middle
  const night = sector(0, 2 * (w + h), -90, 90).rotate(-turn).translate(...pivot).intersection(opening);
  const at = (a, r) => [pivot[0] + r * sin(radians(a)), pivot[1] + r * cos(radians(a))];
  const crescent = circle(0.4 * h).difference(circle(0.4 * h).translate(0.13 * h, 0.05 * h)).translate(...at(turn, reach));
  const stars = merge([[-28, 0.72], [30, 0.8]].map(([da, k]) => circle(0.07 * h).translate(...at(turn + da, k * h))));
  const sun = circle(0.34 * h).translate(...at(turn + 180, reach)).intersection(opening);
  return merge([night.difference(crescent).difference(stars), sun]);
}

/** one window, built: {w (its settings), index, window (the hole), frame, cutline, content, clear (keep-out zone)} */
function build_window(S, w, index) {
  const centre = clock_point(w.r, window_angle(w)), kind = WINDOW_KINDS[w.kind];
  let opening, content, grown;
  if (kind === "moon phase") {
    const [hole, sky] = moon_window(w.w, w.age);
    opening = hole; content = sky;
    grown = (d) => offset(hole.copy(), d).translate(...centre);
  } else {
    opening = rounded_rect(w.w, w.h, w.round);
    grown = (d) => rounded_rect(w.w + 2 * d, w.h + 2 * d, w.round + d).translate(...centre);
    content = kind === "am · pm" ? day_night(w.w, w.h, w.hour).intersection(opening) : centred(text_path(w.text, date_type(S), w.h * w.size / 100));
  }
  const win = opening.translate(...centre);
  return {
    w, index, window: win, number: content.translate(...centre),
    frame: w.frame > 0 ? grown(w.frame).difference(win) : null,
    cutline: grown(0.05).difference(win),                      // aperture outline for production
    clear: grown(w.frame + w.clear),                           // keep print clear of the hole
  };
}

// ── everything that doesn't move ─────────────────────────────

export function build_static(S) {
  const windows = windows_of(S).map((w, i) => (w.on ? build_window(S, w, i) : null)).filter(Boolean);
  const cut = windows.length === 0 ? null : windows.length === 1 ? windows[0].clear : merge(windows.map((x) => x.clear)).removeOverlap();
  let plate = circle(S.dial_d);
  for (const x of windows) plate = plate.difference(x.window);
  return { plate, rings: build_rings(S, cut), windows, date: windows[0] || null };
}

// ── hands ────────────────────────────────────────────────────

const COUNTER_AT = 0.16 / 0.22;                    // counterweight centre, as a share of the tail

export function hand_angles(t, beats_per_second = 0) {
  t = ((t % 43200) + 43200) % 43200;
  let s = t % 60;
  if (beats_per_second) s = Math.floor(s * beats_per_second) / beats_per_second;
  return [t / 43200 * 360, (t % 3600) / 3600 * 360, s / 60 * 360];
}

/** drawn pointing at 12, pivot at the origin. T tail, tip point length,
 *  F head / barrel width or ring / disc Ø, at = where that feature sits.
 *  R rounds the flat ends: the tail's corners, and the tip's where the tip is flat. */
function hand_outline(shape, L, W, T, tip, F, at, R = 0) {
  tip = min(max(tip, 0), L);
  const shaft = (top, r_top) => poly([[-W / 2, -T], [W / 2, -T], [W / 2, top], [-W / 2, top]], [R, R, r_top, r_top]);
  const pointed = () => poly([[-W / 2, -T], [W / 2, -T], [W / 2, L - tip], [0, L], [-W / 2, L - tip]], [R, R, 0, 0, 0]);
  if (shape === "baton") return shaft(L, R);
  if (shape === "pencil") return pointed();
  if (shape === "sword") return poly([[0, L], [W / 2, L - tip], [W * 0.4, -T], [-W * 0.4, -T], [-W / 2, L - tip]], [0, 0, R, R, 0]);
  if (shape === "dauphine") return new Path().polygon([0, L], [W / 2, at], [0, -T], [-W / 2, at]);
  if (shape === "leaf") {
    const k = 0.55;
    return new Path().moveTo([0, -T]).curveTo([W * k, L * 0.15], [W * k, L * 0.6], [0, L])
      .curveTo([-W * k, L * 0.6], [-W * k, L * 0.15], [0, -T]).closePath();
  }
  if (shape === "arrow") return shaft(L - tip, 0).union(new Path().polygon([-F / 2, L - tip], [F / 2, L - tip], [0, L]));
  if (shape === "syringe") {
    let p = shaft(min(at, L - tip), 0).union(new Path().polygon([-W / 2, L - tip], [W / 2, L - tip], [0, L]));
    if (L - tip > at) p = p.union(new Path().rect(-F / 2, at, F, L - tip - at));     // wider barrel between them
    return p;
  }
  if (shape === "breguet") {
    let p = pointed().union(circle(F).translate(0, at));
    if (F - 2 * W > 0.02) p = p.difference(circle(F - 2 * W).translate(0, at));
    return p;
  }
  if (shape === "lollipop") return shaft(L, R).union(circle(F).translate(0, at));
  return new Path();
}

/** one hand, upright, remembered until its settings change (only turning happens per frame). */
export function hand_shape(h) {
  return memo("hand" + key_of(h), () => {
    let shape = HAND_SHAPES[h.shape];
    if (shape === "file") { file_shape(h.file); shape = "baton"; }       // no file: a baton (R17)
    let p = hand_outline(shape, h.len, h.w, h.tail, h.tip, h.feature, h.feature_at / 100 * h.len, h.round || 0);
    if (h.wall > 0) p = p.difference(offset(p, -h.wall));
    if (h.counter > 0) p = p.union(place(circle(h.counter), -h.tail * COUNTER_AT, 0));
    return p;
  });
}

/** the hands that are on, bottom first: [name, colour, upright shape, clock angle]. */
function hand_items(S, t) {
  const angles = hand_angles(t, BEATS[S.ha_beat][1]);
  return HANDS.map((name, i) => [name, S["ha_" + name].c, S["ha_" + name], angles[i]])
    .filter(([, , h]) => h.on).map(([name, c, h, a]) => [name, c, hand_shape(h), a]);
}

// ═════════════════════════════════════════════════════════════
//  3 · DRAWING — the scene
// ═════════════════════════════════════════════════════════════

export const GUIDE = [0.0, 0.55, 0.9, 0.5];              // dial edge, date radius, axes
export const GUIDE_RING = [0.0, 0.55, 0.9, 0.35];        // a ring's edges
export const GUIDE_SELECTED = [1.0, 0.45, 0.0, 0.95];    // the ring being edited

/** what to draw, bottom to top. Every export and the preview read this list (R26).
 *
 *  Each item: role · path (mm; a hand's is upright, see angle) · fill (RGBA, null for guides)
 *  · angle (clock angle for hands, else 0). Rings add ring (their entry in static.rings) and
 *  index (their place in S.rings); hands add name; guides add stroke and px (screen points).
 *  selected = index of the ring being edited; its guides are drawn stronger. */
export function scene(S, statik, t, preview = true, selected = null) {
  const items = [];
  const add = (role, path, fill, more = {}) => {
    if (path) items.push({ role, path, fill, angle: 0, ...more });
  };
  const windows = statik.windows;
  const rings = statik.rings.slice().reverse();    // bottom ring first, top ring last
  const index = (d) => S.rings.indexOf(d.ring);

  if (S.out_production) {                          // mono mask, no plate, no hands
    const black = [0, 0, 0, 1];
    for (const d of rings) add("ring", d.path, black, { ring: d, index: index(d) });
    for (const x of windows) {
      add("date frame", x.frame, black, { window: x.index });
      add("cutline", x.cutline, black, { window: x.index });
    }
  } else {
    for (const x of windows) {                     // what shows through each hole, on white
      add("date disc", x.window, [1, 1, 1, 1], { window: x.index });
      add("date number", x.number, x.w.ink, { window: x.index });
    }
    add("plate", statik.plate, S.c_plate);
    for (const d of rings) add("ring", d.path, d.ring.c, { ring: d, index: index(d) });
    for (const x of windows) add("date frame", x.frame, x.w.ink, { window: x.index });
    if (S.ha_on) {
      for (const [name, colour, path, a] of hand_items(S, t)) add("hand", path, colour, { name, angle: a });
      if (S.ha_cap > 0) add("cap", circle(S.ha_cap), S.c_cap);
    }
  }

  if (preview && S.guides) {                       // never exported (R5)
    const R = S.dial_d / 2;
    const tint = (c, strength) => [c[0], c[1], c[2], Math.min(Math.max(strength, 0), 100) / 100];
    const plain = tint(S.gd_c, S.gd_strength), ring_edge = tint(S.gd_c, S.gd_strength * 0.7), chosen = tint(S.gd_sel_c, S.gd_sel_strength);
    const ring_guide = (r, colour, px) => add("guide", circle(2 * r), null, { stroke: colour, px });
    const line_guide = (p0, p1) => add("guide", new Path().line(p0, p1), null, { stroke: plain, px: S.gd_w });
    if (S.gd_edge) {
      ring_guide(R, plain, S.gd_w);
      for (const r of new Set(windows.map((x) => x.w.r))) ring_guide(r, plain, S.gd_w);
    }
    if (S.gd_axes) {
      line_guide([-R, 0], [R, 0]);
      line_guide([0, -R], [0, R]);
    }
    S.rings.forEach((ring, i) => {
      if (!ring.on || !(S.gd_rings || i === selected)) return;
      const inner = { ticks: ring.len, markers: ring.len, band: ring.width }[kind_of(ring)] || 0;
      for (const r of [...new Set([ring.r, ring.r - inner])].sort((a, b) => b - a)) {
        if (r > 0) ring_guide(r, i === selected ? chosen : ring_edge, i === selected ? S.gd_sel_w : S.gd_w);
      }
    });
  }
  return items;
}

/** a copy of an upright shape, turned to a clock angle (R2). */
export const turned = (path, angle) => path.copy().rotate(-angle);

/** the page's side in mm: the dial and its margins. */
export const page_mm = (S) => S.dial_d + 2 * S.margin;
