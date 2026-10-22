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
import * as WATCH from "./watch.js";

export const METAL_NAMES = ["steel", "gold", "alu", "bronze", "titanium", "black"];
export const NATO_NAMES = ["bond", "regimental", "khaki", "blackgrey", "olive", "grey"];
export const INSERTS = [["#2b2c30", "#2b2c30"], ["#1f3a6e", "#1f3a6e"], ["#1f5a3a", "#1f5a3a"], ["#23407a", "#a8262e"], ["#222326", "#22457e"], ["#222326", "#a3232b"], ["#2a2420", "#6b3f24"], ["#222326", "#2f7a3c"]];
const STYLE_NAMES = ["engineer", "miyazaki"], VIEW_NAMES = ["detail", "full", "dial"];
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
const PRINTED = (role) => !["plate", "cap", "hand", "mark", "date disc"].includes(role);      // what carries ink relief: a window's disc is the ground under its hole, not ink
const HANDS = ["hour", "minute", "second"];

/** what watch.js draws for this dial and these settings — the Show Case's `options()` */
export function options(S, items, effects) {
  const style = STYLE_NAMES[S.w_style] || "miyazaki", kind = G.CASE_OF_BEZEL[S.bezel] || "dress", diver = kind === "diver";
  const P = WATCH.presets(style), lit = effects;
  return {
    style, key: kind, d: S.dial_d, size: WATCH.sizeFor(kind, S.dial_d), view: VIEW_NAMES[S.w_view] || "detail",
    items: items.map((x) => ({ role: x.role, hand: (x.role === "hand" || x.role === "mark") && HANDS.includes(x.name) ? x.name : null, p: x.path.svg(3), f: hex(x.fill), a: +x.fill[3], ink: PRINTED(x.role) ? S.w_ink : 0 })),
    A: Object.fromEntries(HANDS.map((h) => [h, 0])),
    strap: S.strap === 2 && diver ? "bracelet" : S.strap === 3 ? "nato" : "leather", nato: NATO_NAMES[S.w_nato] || "regimental",
    metal: S.c_metal ? hex(S.c_metal) : P.metals[METAL_NAMES[S.w_metal]] || P.metals.steel,
    leather: hex(S.c_strap), natoColours: S.c_nato ? S.c_nato.map(hex) : P.nato[NATO_NAMES[S.w_nato]] || P.nato.regimental,
    insert: S.c_insert ? { top: hex(S.c_insert[0]), bottom: hex(S.c_insert[1]) } : { top: INSERTS[S.w_insert][0], bottom: INSERTS[S.w_insert][1] },
    floor: hex(S.c_backdrop), floor2: S.c_backdrop2 ? hex(S.c_backdrop2) : null,
    L: S.sh_from - 90, h: S.sh_rise, shadow: S.sh_on ? S.sh_dark / 25 : 0,
    lighting: S.w_lighting ? "flat" : "dramatic", flare: S.w_flare ? "dot" : "arc", flareOn: lit && S.sh_blur && S.w_flare_on, blurs: lit && S.sh_blur,
    fl: { size: S.w_fl_size / 100, tint: S.w_fl_tint / 100, bright: S.w_fl_bright / 100 }, glass: { fat: S.w_glass_fat / 100, len: S.w_glass_len / 100, op: lit ? S.w_glass_op / 100 : 0 },
    ink: S.w_ink, bevels: false, outline: lit,
  };
}

const rgba = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1);
/** the metal's preset colour, for the Case colour row when none of your own is set */
export const metal_colour = (S) => rgba(WATCH.presets(STYLE_NAMES[S.w_style] || "miyazaki").metals[METAL_NAMES[S.w_metal]] || "#9c8250");

const angles_of = (items) => { const A = {}; for (const x of items) if (x.role === "hand" && HANDS.includes(x.name)) A[x.name] = x.angle; return A; };

/** the watch for this frame. The whole drawing is made again only when something but the time changed (the shapes,
 *  a colour, the watch, the light); the hands turn in place every frame, as in the Show Case */
export function draw(tool, items) {
  const S = tool.S, g = tool.watch_g;
  const shapes = items.filter((x) => x.fill && !x.stroke);
  const key = [tool.statik === tool.watch_statik ? 1 : 0, shapes.length, ...shapes.map((x) => x.fill.join(",")), ...Object.keys(S).filter((k) => k.startsWith("w_") || k.startsWith("sh_") || k.startsWith("c_") || k === "strap" || k === "bezel" || k === "dial_d" || k === "margin").map((k) => JSON.stringify(S[k])), S.ui_effects, G.shows_day(S) ? G.day_hour(S) : "", tool.day_key].join("|");
  if (key !== tool.watch_key || !tool.watch_statik || tool.statik !== tool.watch_statik) {
    tool.watch_key = key; tool.watch_statik = tool.statik;
    const o = options(S, shapes, S.ui_effects), svg = WATCH.draw(o);
    g.innerHTML = `<g transform="scale(1 -1)">${svg.slice(svg.indexOf("\n") + 1, svg.lastIndexOf("</svg>"))}</g>`;      // the page's own box is not used: the view is the tool's zoom
    tool.watch_box = /viewBox="([^"]+)"/.exec(svg)[1].split(" ").map(Number);
  }
  const A = angles_of(items), L = (S.sh_from - 90) * Math.PI / 180;
  for (const n of g.querySelectorAll("[data-h]")) n.setAttribute("transform", `rotate(${-A[n.dataset.h]})`);
  for (const n of g.querySelectorAll("[data-hs]")) n.setAttribute("transform", `translate(${n.dataset.sh}) rotate(${-A[n.dataset.hs]})`);
  for (const n of g.querySelectorAll("[data-hb]")) {
    const a = A[n.dataset.hb] * Math.PI / 180, side = Math.cos(a) * Math.cos(L) + Math.sin(a) * Math.sin(L), lit = 0.22 * Math.abs(side), dark = 0.26 * Math.abs(side);
    const [right, left] = n.querySelectorAll("rect");
    n.setAttribute("transform", `rotate(${-A[n.dataset.hb]})`);
    right.setAttribute("fill", side > 0 ? "#fff" : "#000"); right.setAttribute("fill-opacity", (side > 0 ? lit : dark).toFixed(3));
    left.setAttribute("fill", side > 0 ? "#000" : "#fff"); left.setAttribute("fill-opacity", (side > 0 ? dark : lit).toFixed(3));
  }
}

/** Fit in show mode (Okay: "while fit shows the case on showcase, dial on dial tool side"): Detail — lug tip to lug tip
 *  as tall as the canvas less a margin, the case as wide as it allows; Whole watch — the whole drawing; Dial — as the
 *  dial side's Fit. Screen pixels per millimetre */
export function fit_zoom(tool, w, h) {
  const S = tool.S, kind = G.CASE_OF_BEZEL[S.bezel] || "dress", M = 2 * 64, cb = WATCH.caseBox(kind, WATCH.sizeFor(kind, S.dial_d));
  if (S.w_view === 2) return Math.min(w, h) / G.page_mm(S);
  const [bw, bh] = S.w_view === 1 && tool.watch_box ? [tool.watch_box[2], tool.watch_box[3]] : [cb.w, cb.h];
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
  const svg = WATCH.draw(o), [, , w, h] = /viewBox="([^"]+)"/.exec(svg)[1].split(" ").map(Number);
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
