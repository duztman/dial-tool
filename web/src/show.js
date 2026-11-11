// show.js — show mode (build list #509; Okay, 22 Oct 2026: "Lego brick like merger. Take one out put other (bigger) in").
//
// The dial in a whole watch, drawn by watch.js from the dial's own shapes. What show mode is:
//   - Activate Showcase: the panel slides out to the left, comes back on the right with the show tabs (Dial · Watch ·
//     Light · Export), tinted by the backdrop; the bar stays as it is; the dial's own drawing gives way to the watch.
//   - Only the dial's colours and the ink height are editable there (the Dial tab reuses the Colours pane); the watch
//     (case, strap, metal, light, style) is the Watch and Light tabs; PNG and PDF of the watch on Export.
//   - One sun: Dial Tool's shadow keys (sh_from, sh_rise, sh_dark, sh_blur) light the watch and the dial alike.
//   - The watch's settings are w_ keys and the strap's (R7); saved with the dial, never in a link (R31).
//   - The effects switch (Okay: "turn off shenanigans") leaves out what costs on an old computer: blurs, the flare,
//     the glass shine, the silhouette outline. Stored as ui_effects, so it stays.
// Everything here takes the tool (the window, app.js) as its first argument and touches only what it names.
import * as G from "./geometry.js";
import { night } from "./night.js";      // the night laid over the watch's drawing (#175)
import * as WATCH from "./watch.js";
import * as P from "./parts.js";      // the dial's parts as a 3D view reads them, and the stack's rules (Okay, 11 Nov 2026: "the rules in dial tool and 3d should be synced")

export const METAL_NAMES = G.METAL_NAMES;
export const NATO_NAMES = ["bond", "regimental", "khaki", "blackgrey", "olive", "grey", "solid"];      // solid: one colour, your own (#524; Okay, 24 Oct 2026: "One solid option")
const SOLID_NATO = "#2a3550";      // a solid NATO's colour to start: the regimental's navy
/** a NATO's three stripe colours as drawn: your own (c_nato), else the pattern's, in the style's tones; a solid one's, three of one */
export function nato_colours(S) {
  const name = NATO_NAMES[S.w_nato], P = WATCH.presets(STYLE_NAMES[S.w_style] || "artisan");
  if (S.c_nato) return S.c_nato.map(hex);
  return name === "solid" ? [SOLID_NATO, SOLID_NATO, SOLID_NATO] : P.nato[name] || P.nato.regimental;
}
export const INSERTS = [["#2b2c30", "#2b2c30"], ["#1f3a6e", "#1f3a6e"], ["#1f5a3a", "#1f5a3a"], ["#23407a", "#a8262e"], ["#222326", "#22457e"], ["#222326", "#a3232b"], ["#2a2420", "#6b3f24"], ["#222326", "#2f7a3c"]];
/** a metal's picture for its tile: a disc in its colour, lit on one side as a case is */
export const metal_picture = (i) => { const c = WATCH.presets("artisan").metals[METAL_NAMES[i]] || "#9a9a9a";
  return `<svg viewBox="-19 -13.5 38 27" width="38" height="27" aria-hidden="true"><circle r="11" fill="${c}"/><path d="M-11 0A11 11 0 0 1 11 0A11 8 0 0 0 -11 0Z" fill="#fff" fill-opacity="0.3"/><circle r="11" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.35"/></svg>`; };
/** an insert's picture for its tile: a ring, its top half in its first colour, its bottom half in its second */
export const insert_picture = (i) => { const [a, b] = INSERTS[i] || INSERTS[0];
  return `<svg viewBox="-19 -13.5 38 27" width="38" height="27" aria-hidden="true"><path d="M-11 0A11 11 0 0 1 11 0H6.5A6.5 6.5 0 0 0 -6.5 0Z" fill="${a}"/><path d="M-11 0A11 11 0 0 0 11 0H6.5A6.5 6.5 0 0 1 -6.5 0Z" fill="${b}"/><circle r="11" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.35"/></svg>`; };
const STYLE_NAMES = G.STYLE_NAMES, VIEW_NAMES = ["detail", "full", "dial"];
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
const PRINTED = (role) => !["plate", "cap", "hand", "mark", "date disc", "rehaut", "bezel", "bezel chamfer", "insert"].includes(role);      // the case's grounds (#582) are flat, not inks      // what carries ink relief: a window's disc is the ground under its hole, not ink
// a hand's lume is printed too: an ink on the hand (#175), its height the ink's

// one part of the scene as watch.js takes it: its role, which hand, its bevel, its path and colour, its ink height
const one = (x, hand, H, S) => {
  // a disc hand is flat, as on the dial side (Okay, 3 Nov 2026, 02:11: "Disc hand does not get bevels")
  return { role: x.role, hand, bevel: Boolean(H && x.role === "hand" && H.bevel && G.HAND_SHAPES[H.shape] !== "disc"), dome: Boolean(H && G.BEVEL_LOOKS[H.bevel_look] === "Domed"), hw: H ? Math.max((+H.w || 1) / 2, 0.05) : 0, p: x.path.svg(3), f: hex(x.fill), a: +x.fill[3], ink: PRINTED(x.role) || x.role === "mark" ? G.ink_mm(S, x) / G.INK_STEP_MM : 0, metal: Boolean(x.metal) };
};      // a disc's painted mark is printed on it: an ink (02:11)      // the engine counts ink in its steps (0.035 mm); the heights are mm (#545)

/** what a saved SVG says of each part, beyond its shape and colour (#584; Okay, 10 Nov 2026: "i need you to get height and thickness
 *  values as well, this preview depends on it") — so a 3D view built from the file stands every part where this dial puts it, with
 *  nothing guessed. The part's record (parts.js: its make and its numbers, the stack's rules for what the dial does not set) as
 *  `data-` attributes, which a drawing program ignores. → a function: a scene's part → its attributes, as text; `.dial` the dial's own */
export const part_record = (S, x) => {
  const hand = (x.role === "hand" || x.role === "mark" || x.role === "lume") && G.HANDS.includes(x.name) ? x.name : null, H = hand ? S["ha_" + hand] : null, p = one(x, hand, H, S);
  const r = { role: x.role, make: P.make_of(x.role, hand), hand };
  if (x.metal) r.metal = (G.PLATE_METALS[S.material] || G.PLATE_METALS[0]).toLowerCase();      // a bare plate: its metal, for a 3D view to make it metal
  if (x.engrave) { r.make = "engraved"; return r; }      // cut in, not printed (Finish Engrave): no ink
  if (PRINTED(x.role) || x.role === "mark") r.ink = G.ink_mm(S, x);
  if (r.make === "hand" && hand) Object.assign(r, { over: S["sh_" + hand] ?? S.sh_hour, t: P.STACK.hand_t, hw: p.hw, boss: G.hand_boss(H, hand) ? H.hub / 2 : null,
    section: !p.bevel ? "flat" : P.SECTIONS[1 + (H.bevel_look | 0)] ?? "ridge" });      // a hand's section in the Bevel words: Ridge · Faceted · Domed, flat with no Bevel
  if (r.make === "hand" && !hand) r.make = "printed";      // a hand the record has no name for (none today) stays a print, as before
  if (r.make === "cap") Object.assign(r, { over: S.sh_cap, t: P.STACK.cap_t });
  if (r.make === "disc") r.under = G.windows_of(S)[x.window]?.depth ?? S.sh_disc;
  return r;
};
/** the case for a 3D view (parts.js case_attrs): the tool's rehaut and bezel, in mm, the bezel's metal the case's own */
export const case_record = (S) => ({
  rehaut: S.rh_on ? { w: G.rehaut_w(S), h: G.rehaut_h(S), c: hex(S.rh_c) } : null,
  bezel: S.bz_on ? { kind: G.BEZEL_KINDS[S.bz_kind] === "Fixed" ? "fixed" : "rotating", marks: G.BEZEL_KINDS[S.bz_kind] === "Fixed" || G.BEZEL_MARKS[S.bz_marks] === "Metal" ? "metal" : "insert", w: S.bz_w, chamfer: S.bz_chamfer, in_in: S.bz_in_in, in_out: S.bz_in_out, insert: hex(S.bz_insert_c),
    teeth: { n: S.bz_teeth_n, depth: S.bz_teeth_depth, fill: S.bz_teeth_fill, chamfer: S.bz_teeth_chamfer }, dial_up: S.bz_dial_up, seat: G.bezel_seat(S), melt: G.bezel_melted(S) || undefined, h: S.bz_h, lip: S.bz_lip, rim: S.bz_rim, up: S.bz_up, dome: S.bz_dome } : null,
  body: S.w_body > 0 ? Math.max(body_fit(S), S.w_body) : null,      // the body's Ø, mm, when it isn't Fit (Okay, 11 Nov 2026: Body Ø)
});
/** the body's Ø at Fit for this dial, mm (Body Ø's floor) */
export const body_fit = (S) => WATCH.bodyFit(G.CASE_OF_BEZEL[S.bezel] || "dress", S.dial_d, S.rh_on || S.bz_on ? G.reach_mm(S) : null, G.bezel_melted(S));
export const svg_facts = (S) => Object.assign((x) => P.part_attrs(part_record(S, x)), { dial: P.dial_attrs(S.dial_d) + P.case_attrs(case_record(S)) });

/** what watch.js draws for this dial and these settings — the Show Case's `options()` */
export function options(S, items, effects) {
  const style = STYLE_NAMES[S.w_style] || "artisan", kind = G.CASE_OF_BEZEL[S.bezel] || "dress", diver = kind === "diver";
  const P = WATCH.presets(style), lit = effects;
  return {
    style, key: kind, d: S.dial_d, size: WATCH.sizeFor(kind, S.dial_d, S.rh_on || S.bz_on ? G.reach_mm(S) : null, S.w_body, G.bezel_melted(S)), fit: WATCH.fitFor(kind, S.dial_d, S.rh_on || S.bz_on ? G.reach_mm(S) : null, G.bezel_melted(S)), view: VIEW_NAMES[S.w_view] || "detail",
    case: S.rh_on || S.bz_on ? { outer: G.reach_mm(S), melt: G.bezel_melted(S), glass: G.case_spans(S).bezel ? G.case_spans(S).bezel[0] : G.reach_mm(S) } : null,      // glass: the crystal's edge — inside the bezel, not over it (Okay, 11 Nov 2026: "the glass is drawn over the bezel now somehow")      // the tool's own rehaut and bezel, as they are (#582): the published case opens to them
    items: items.flatMap((x) => { const hand = (x.role === "hand" || x.role === "mark" || x.role === "lume") && G.HANDS.includes(x.name) ? x.name : null;
      const H = hand ? S["ha_" + hand] : null;
      // a hand's boss as a part of its own over the hand (#404; Okay, 3 Nov 2026: "The boss itself, as a round disc"): the
      // hub disc with the pipe's hole, lit as a dome by watch.js (bossLight); round, so it needs no turning with the hand
      const boss = x.role === "hand" && H ? G.hand_boss(H, hand) : null;
      const part = one(x, hand, H, S);
      return boss ? [part, { role: "boss", hand: null, bevel: false, dome: false, hw: 0, r: H.hub / 2, p: boss.svg(3), f: part.f, a: part.a, ink: 0 }] : [part]; }),
    A: Object.fromEntries(G.HANDS.map((h) => [h, 0])),
    strap: S.strap === 2 && diver ? "bracelet" : S.strap === 4 && diver ? "links" : S.strap === 3 ? "nato" : "leather", nato: NATO_NAMES[S.w_nato] || "regimental",
    metal: S.c_metal ? hex(S.c_metal) : P.metals[METAL_NAMES[S.w_metal]] || P.metals.steel,
    leather: hex(S.c_strap), natoColours: nato_colours(S),
    insert: S.c_insert ? { top: hex(S.c_insert[0]), bottom: hex(S.c_insert[1]) } : { top: INSERTS[S.w_insert][0], bottom: INSERTS[S.w_insert][1] },
    floor: hex(S.c_backdrop), floor2: S.c_backdrop2 && S.w_gradients !== false ? hex(S.c_backdrop2) : null, gradients: S.w_gradients !== false,      // Gradients off: one colour, no spotlight, a flat outline (#525)
    L: S.sh_from - 90, h: S.sh_rise, shadow: S.sh_on ? S.sh_dark / 25 : 0,
    heights: { ...Object.fromEntries(G.HANDS.map((h) => [h, S["sh_" + h]])), cap: S.sh_cap },      // the hands' own heights, as the dial side's shadows use them (#519)
    lighting: S.w_lighting || S.w_gradients === false ? "flat" : "dramatic", flare: S.w_flare ? "dot" : "arc", flareOn: lit && S.sh_blur && S.w_flare_on, blurs: lit && S.sh_blur,
    fl: { size: S.w_fl_size / 100, tint: S.w_fl_tint / 100, bright: S.w_fl_bright / 100 }, glass: { fat: S.w_glass_fat / 100, len: S.w_glass_len / 100, op: lit ? S.w_glass_op / 100 : 0 },
    ink: S.w_ink, bevels: S.w_bevels ? S.sh_bevel / 100 : 0, outline: lit,      // the hands' bevels as the dial side sets them (each hand's tick, Bevels %), and Shenanigans' Bevels
  };
}

const rgba = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1);
/** Backdrop › Auto (#510): the paint's own ground (watch.js presets().floor — Engineer Stone, Artisan Umber), as a colour */
export const auto_ground = (S) => rgba(WATCH.presets(STYLE_NAMES[S.w_style] || "artisan").floor);
/** the metal's preset colour, for the Case colour row when none of your own is set */
export const metal_colour = (S) => rgba(WATCH.presets(STYLE_NAMES[S.w_style] || "artisan").metals[METAL_NAMES[S.w_metal]] || "#9c8250");

/** Night (the Light tab's Time pill): the drawing under the night filter with its lume glowing, by the Moon's Strength and Lume decay (night.js) */
const at_night = (S, svg) => (S.w_night ? night(svg, S.w_moon, S.w_decay, Boolean(S.ui_effects && S.sh_blur)) : svg);      // Blurs on: the halo a real blur, one small filter a shape (Okay, 19:18: "blurs on makes them glow?")

const angles_of = (items) => { const A = {}; for (const x of items) if (x.role === "hand" && G.HANDS.includes(x.name)) A[x.name] = x.angle; return A; };

/** the watch for this frame. The whole drawing is made again only when something but the time changed (the shapes,
 *  a colour, the watch, the light); the hands turn in place every frame, as in the Show Case */
export function draw(tool, items) {
  const S = tool.S, g = tool.watch_g;
  const shapes = items.filter((x) => x.fill && !x.stroke);
  const key = [shapes.length, ...shapes.map((x) => x.fill.join(",")), ...Object.keys(S).filter((k) => k.startsWith("w_") || k.startsWith("sh_") || k.startsWith("c_") || k.startsWith("rh_") || k.startsWith("bz_") || k === "strap" || k === "bezel" || k === "dial_d" || k === "margin").map((k) => JSON.stringify(S[k])), S.ui_effects, G.shows_day(S) ? G.day_hour(S) : "", tool.day_key, S.rings.map((r) => +Boolean(r.ink_b)).join(""), G.windows_of(S).map((w) => `${+Boolean(w.frame_b)}${w.print_h ?? ""}`).join(","), G.HANDS.map((h) => `${+Boolean(S["ha_" + h].bevel)}${S["ha_" + h].bevel_look || 0}${+Boolean(S["ha_" + h].added)}`).join("")].join("|");      // a hand's Bevel and its look redraw the watch (Okay, 3 Nov 2026, 01:56: "Bevels is not working on of or edit on show mode")      // which ink each part is printed with (#545)
  if (key !== tool.watch_key || !tool.watch_statik || tool.statik !== tool.watch_statik) {
    tool.watch_key = key; tool.watch_statik = tool.statik;
    const o = options(S, shapes, S.ui_effects), svg = at_night(S, WATCH.draw(o));
    g.innerHTML = `<g transform="scale(1 -1)">${svg.slice(svg.indexOf("\n") + 1, svg.lastIndexOf("</svg>"))}</g>`;      // the page's own box is not used: the view is the tool's zoom
    const frame_key = [S.w_view, S.bezel, S.strap, S.dial_d].join();      // a new view, case, strap or size: fitted again, if the view was fitted (the light never moves it)
    if (frame_key !== tool.watch_frame && tool.fitted) tool.fit();
    tool.watch_frame = frame_key;
  }
  const A = angles_of(items), L = (S.sh_from - 90) * Math.PI / 180;
  for (const n of g.querySelectorAll("[data-h]")) n.setAttribute("transform", `rotate(${-A[n.dataset.h]})`);
  for (const n of g.querySelectorAll("[data-hs]")) n.setAttribute("transform", `translate(${n.dataset.sh}) rotate(${-A[n.dataset.hs]})`);
  for (const n of g.querySelectorAll("[data-hl]")) {      // a hand's lume: its relief shifted toward the light in the hand's own frame (#175)
    const a = A[n.dataset.hl], [ux, uy] = WATCH.lumeShift(+n.dataset.l, a, +n.dataset.s), [dark, light] = n.firstElementChild.children;
    n.setAttribute("transform", `rotate(${-a})`);
    dark.setAttribute("transform", `translate(${(ux * n.dataset.es).toFixed(3)} ${(uy * n.dataset.es).toFixed(3)})`);
    light.setAttribute("transform", `translate(${(-ux * n.dataset.eh).toFixed(3)} ${(-uy * n.dataset.eh).toFixed(3)})`);
  }
  for (const n of g.querySelectorAll("[data-hb]")) {
    const B = S.w_bevels ? (+S.sh_bevel || 0) / 100 : 0;      // Bevels %, as the drawing has it (watch.js, HAND_BEVEL): every frame too, or a turning hand loses it (01:56: "not working on of or edit")
    const a = A[n.dataset.hb] * Math.PI / 180, side = Math.cos(a) * Math.cos(L) + Math.sin(a) * Math.sin(L), lit = 0.22 * B * Math.abs(side), dark = 0.26 * B * Math.abs(side);
    const [right, left] = n.querySelectorAll("rect");
    n.setAttribute("transform", `rotate(${-A[n.dataset.hb]})`);
    if (n.dataset.dome) {      // Domed: its two ramps' colours and strengths
      const put = (s, c, k) => { for (const stop of g.querySelectorAll(`#${n.dataset.dome}${s} stop`)) stop.setAttribute("stop-color", c); g.querySelector(`#${n.dataset.dome}${s} stop:last-child`)?.setAttribute("stop-opacity", Math.min(2 * k, 1).toFixed(3)); };
      put("r", side > 0 ? "#fff" : "#000", side > 0 ? lit : dark); put("l", side > 0 ? "#000" : "#fff", side > 0 ? dark : lit);
      continue;
    }
    right.setAttribute("fill", side > 0 ? "#fff" : "#000"); right.setAttribute("fill-opacity", (side > 0 ? lit : dark).toFixed(3));
    left.setAttribute("fill", side > 0 ? "#000" : "#fff"); left.setAttribute("fill-opacity", (side > 0 ? dark : lit).toFixed(3));
  }
}

/** the Backdrop's presets in show mode (the Show Case's, 21 Oct 2026): ten single colours and ten gradients, each [name,
 *  first colour, second colour] — the gradient at 135° from the first to the second. Ember is the Show Case's opener */
export const GROUNDS = [["Stone", "#b9b3a6"], ["Umber", "#877f6d"], ["Paper", "#e8e4da"], ["Bone", "#d8d0bf"], ["Sky", "#a9bccb"],
  ["Sage", "#9aa891"], ["Olive", "#6b6a4e"], ["Brick", "#8a4a3a"], ["Slate", "#5b6066"], ["Night", "#1c1c1f"]];
export const GRADIENTS = [["Dusk", "#3b3f58", "#b8876c"], ["Sea", "#1f4e5a", "#a9c7c0"], ["Clay", "#d9b8a0", "#7a4a3a"], ["Fog", "#e6e6e3", "#8c9096"], ["Dune", "#e8d8b8", "#a5835a"],
  ["Moss", "#1e2a1f", "#8fa27b"], ["Steel", "#2b3138", "#9aa6b2"], ["Plum", "#2a1f33", "#9c6d8f"], ["Ember", "#2a1a17", "#b4533a"], ["Ink", "#0e0f14", "#3b4256"]];

/** Fit in show mode (Okay: "while fit shows the case on showcase, dial on dial tool side"): Detail — lug tip to lug tip
 *  as tall as the canvas less a margin, the case as wide as it allows; Whole watch — the whole drawing; Dial — as the
 *  dial side's Fit. Screen pixels per millimetre */
export function fit_zoom(tool, w, h) {
  const S = tool.S, kind = G.CASE_OF_BEZEL[S.bezel] || "dress", M = 2 * 64, size = WATCH.sizeFor(kind, S.dial_d, S.rh_on || S.bz_on ? G.reach_mm(S) : null, S.w_body, G.bezel_melted(S)), cb = WATCH.caseBox(kind, size);
  if (S.w_view === 2) return Math.min(w, h) / G.page_mm(S);
  const [bw, bh] = S.w_view === 1 ? WATCH.fullBox(kind, size, kind === "diver" && (S.strap === 2 || S.strap === 4)) : [cb.w, cb.h];      // the whole watch's frame is known before it is drawn
  return Math.min(Math.max(w - M, 40) / bw, Math.max(h - M, 40) / bh);
}

/** the column's colours from the backdrop (the Show Case's `ground_look()`, kept whole: Okay, 22 Oct 2026: "Only the color
 *  switching of the whole controls … is well worked out"): the column a much darker, strongly saturated version of the
 *  ground at 85 %, its lines a clear step from it, its whites and greys tinted the same way. On: the tokens are set on the
 *  panel; off: they are removed and the stylesheet's own stand again */
export function tint_panel(panel, on, backdrop, in_greys = false) {
  const keys = ["--swatch", "--column", "--column-top", "--column-solid", "--uiblack", "--uiblack-text", "--ink", "--grey", "--white", "--night", "--night-field", "--field", "--hover", "--rule", "--chip-rule"];
  if (!on) { for (const k of keys) panel.style.removeProperty(k); return; }
  const [r, g, b] = backdrop, hi = Math.max(r, g, b), lo = Math.min(r, g, b), l = (hi + lo) / 2, d = hi - lo, sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let hh = 0; if (d) hh = hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  let ch = Math.round(hh * 60), cs = Math.round(Math.min(1, sat * 2.2 + 0.15) * 100), cl = Math.round(l * 30), op = 0.85;
  const set = (k, v) => panel.style.setProperty(k, v);
  set("--swatch", in_greys ? `hsl(${ch} ${cs}% ${cl}%)` : "hsl(0 0% 13%)");      // the round swatch shows the other look: the bar's grey, or the tinted column
  if (in_greys) { [ch, cs, cl] = [0, 0, 13]; op = 1; }      // the panel in greys, solid, as the bar (Okay, 21 Oct 2026, 03:35)
  set("--column", `hsl(${ch} ${cs}% ${cl}% / ${op})`); set("--column-top", `hsl(${ch} ${cs}% ${Math.min(100, cl + 10)}% / ${op})`); set("--column-solid", `hsl(${ch} ${cs}% ${Math.min(100, cl + 10)}%)`);
  set("--uiblack", cl >= 22 ? `hsl(${ch} ${cs}% ${cl - 22}%)` : `hsl(${ch} ${Math.min(cs, 60)}% ${cl + 22}%)`);
  set("--uiblack-text", cl >= 22 ? `hsl(${ch} ${cs}% ${Math.max(0, cl - 40)}%)` : `hsl(${ch} ${Math.min(cs, 50)}% ${cl + 40}%)`);
  const tint = Math.min(cs, 40), grey = Math.min(cs, 25), wl = Math.min(97, cl + 22 + 44), by = (k) => Math.max(0, Math.min(100, cl >= 22 ? cl - k : cl + k));
  set("--ink", `hsl(${ch} ${tint}% ${wl}%)`); set("--grey", `hsl(${ch} ${tint}% ${wl}% / 0.66)`); set("--white", `hsl(${ch} ${tint}% ${Math.min(100, wl + 6)}%)`);
  set("--night", `hsl(${ch} ${grey}% ${Math.max(0, cl - 4)}%)`); set("--night-field", `hsl(${ch} ${grey}% ${by(11)}%)`); set("--field", `hsl(${ch} ${grey}% ${by(11)}%)`);
  set("--hover", `hsl(${ch} ${grey}% ${by(16)}%)`); set("--rule", `hsl(${ch} ${grey}% ${by(22)}%)`); set("--chip-rule", `hsl(${ch} ${tint}% ${wl}% / 0.28)`);
}

/** the whole watch as a picture, `px` along its longer side, in the frame of the view (Detail or Whole watch) */
async function picture(tool, px) {
  const S = tool.S, items = G.scene(S, tool.statik, S.t, true, null).filter((x) => x.fill && !x.stroke);
  const o = options(S, items, S.ui_effects); o.A = angles_of(G.scene(S, tool.statik, S.t, true, null)); if (o.view === "dial") o.view = "detail";
  const svg = at_night(S, WATCH.draw(o)), [, , w, h] = /viewBox="([^"]+)"/.exec(svg)[1].split(" ").map(Number);
  const k = px / Math.max(w, h), cw = Math.round(w * k), ch = Math.round(h * k);
  const url = URL.createObjectURL(new Blob([svg.replace("<svg ", `<svg width="${cw}" height="${ch}" `)], { type: "image/svg+xml" }));
  const img = new Image();
  await new Promise((ok, fail) => { img.onload = ok; img.onerror = () => fail(new Error("the drawing couldn’t be turned into a picture")); img.src = url; });
  const canvas = document.createElement("canvas"); canvas.width = cw; canvas.height = ch;
  canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
  URL.revokeObjectURL(url);
  return { canvas, mm: [w, h] };
}
/** PNG, or a PDF of one page at the drawing's real size in millimetres with the picture inside it (JPEG) */
export async function export_watch(tool, kind, save) {
  const S = tool.S, name = `${(S.name || "dial").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "dial"}-${G.CASE_OF_BEZEL[S.bezel] || "dress"}-${STYLE_NAMES[S.w_style]}`;
  tool.log(`drawing the watch as ${kind.toUpperCase()}…`);
  const { canvas, mm } = await picture(tool, S.out_watch_px);
  if (kind === "png") return save(name + ".png", await new Promise((ok) => canvas.toBlob(ok, "image/png")), "image/png");
  const jpeg = new Uint8Array(await (await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.95))).arrayBuffer());
  const pt = mm.map((v) => (v * 72 / 25.4).toFixed(2)), enc = new TextEncoder(), parts = [], offsets = [];
  let size = 0;
  const put = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); size += b.length; };
  const obj = (n, body) => { offsets[n] = size; put(`${n} 0 obj\n`); for (const b of [].concat(body)) put(b); put("\nendobj\n"); };
  const draw = `q ${pt[0]} 0 0 ${pt[1]} 0 0 cm /Im0 Do Q`;
  put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt[0]} ${pt[1]}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, "\nendstream"]);
  obj(5, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
  const xref = size;
  put(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  save(name + ".pdf", new Blob(parts, { type: "application/pdf" }), "application/pdf");
}
