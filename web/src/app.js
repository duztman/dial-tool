// Dial Tool, web version — part 4: the window.
//
//   left: sections (Dial · Rings · Hands · Windows · Export), each a list of panes; a pane is a heading and its rows
//   right: the preview (SVG — one element per scene item) and the bar under it
//
// Rows are described as data (ROWS), as in dial.py; one function turns a row into
// controls. Controls change the settings S and ask for a frame; the frame draws (R28).

import * as G from "./geometry.js";
import { svg_document, pdf_document, png_with_dpi, file_name } from "./output.js";
import { FONT_LIST, FONT_SITE } from "./font_list.js";
import { EXAMPLES } from "./examples.js";
import { GALLERY } from "./gallery.js";
import { start_ink, offset as ink_offset } from "./ink.js";

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const c of children) e.append(c);
  return e;
};
const svg_el = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
/** a slider tells its stylesheet how far along it is (--p, 0 to 1): the filled part of its track. */
const filled = (slider) => slider.style.setProperty("--p", clamp((slider.value - slider.min) / ((slider.max - slider.min) || 1), 0, 1).toFixed(4));

const PNG_MOST = 16384;                            // a browser's canvas is at most this many pixels a side
const PNG_SAFE = 4096 * 4096;                      // Safari on a phone or tablet draws nothing past this many pixels in all
const LAST = "dial-tool-last";                     // the last session, kept by the browser
const FEATURE_NAMES = {
  kern: "kerning", liga: "ligatures", calt: "contextual alternates", dlig: "discretionary ligatures",
  tnum: "tabular figures", pnum: "proportional figures", onum: "oldstyle figures", lnum: "lining figures",
  zero: "slashed zero", frac: "fractions", sups: "superscript", subs: "subscript", sinf: "scientific inferiors",
  ordn: "ordinals", smcp: "small caps", c2sc: "caps to small caps", case: "case-sensitive forms",
  salt: "stylistic alternates", swsh: "swash", titl: "titling", ccmp: "glyph composition", locl: "localized forms",
  mark: "mark positioning", mkmk: "mark to mark", aalt: "access all alternates", cpsp: "capital spacing",
  hist: "historical forms", ornm: "ornaments", dnom: "denominators", numr: "numerators",
  afrc: "alternative fractions", rvrn: "variation alternates",
};
const PALETTE = ["#111111", "#FFFFFF", "#EDE8DB", "#A7A7AA", "#3A3A3C", "#0E2A47", "#12372A", "#7A1F1F", "#C8E6A0", "#E8742A"];      // the palette's first ten: black, white, cream, silver, anthracite, navy, green, burgundy, lume, orange
const POP_GAP = 12;                              // between a swatch and the pop-out it opens, in screen points
const PALETTE_KEY = "dial-tool-palette";           // the palette as this browser keeps it: the ten, and what was added
const DEFAULT_ON = new Set(["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "rlig", "rclt", "curs", "clig", "rvrn"]);

// ── icons: drawn here, so they take the colour of their button ──
//
// The icon grid (icon audit, 14 Oct 2026). Every screen the tool is used on is 2× (iPad, both Macs): one point is
// two screen dots, and the browser puts every icon's corner on a dot. So, in every drawing:
//   · one drawing unit = one point. The viewBox is the icon's size on screen; no icon is scaled up or down.
//   · every line in every icon looks equally heavy (Okay, 14 Oct 2026: "equalizing line thicknesses over all
//     icons… perception overrules, sensibly"), rings and frames included. Equal on the eye is not equal in
//     numbers: a straight line on the grid is three solid dots; a curve or a slant spreads the same ink over
//     more, paler dots and looks lighter; short lines that crowd a small sign look heavier. So four widths, each a
//     step of 1/16 from LINE, measured (the audit's weigh.py: the screen blurred as an eye sees it, sigma 1.5 dots,
//     each line read in place among its neighbours, against a lone straight 1.5 line):
//       LINE  1.5     straight runs, on the grid; arrows (their heads meet the shaft and look heavier there)
//       SLANT 1.5625  slanted lines alone: chevrons, crosses, a polygon, a handle, a letter
//       CURVE 1.625   circles, arcs, waves, an eye, a ring that holds a sign
//       DENSE 1.25    short lines crowded inside a small sign (the Guides target, the arrow in a box, a stand)
//     Picture weights that show a thing's own width (a tick, a marker, a band) are not lines and stay as drawn.
//   · LINE's straight runs are centred on quarter points (x.25, x.75): three dots wide, they cover whole dots.
//     So a 16-point sign is centred on 8.25, not 8: half a dot off the middle, never seen. Curves antialias
//     whatever their width; a ring that holds a sign keeps its outer edge where it was (r + width/2 = 15.5).
//   · round caps and joins, as on the dial (Okay, 13 Oct 2026). Filled shapes have their edges on half points.
//   · one drawing per idea: one plus, one cross, one chevron, one copy sign, one sheet — wherever they appear.
const LINE = 1.5, SLANT = LINE + 1 / 16, CURVE = LINE + 2 / 16, DENSE = LINE - 4 / 16;
const sw = (w) => `stroke-width="${w}"`;
// a box with round corners: its straight sides LINE, on the grid; its corners CURVE, because a round corner drawn as
// thin as the sides looks thinner (measured: 3–5 % lighter at r 2 and 4). Two paths, so each gets its own width.
const box = (x, y, w, h, r, side = LINE, corner = CURVE) => {      // side, corner: a quiet sign passes its own pair
  const X = x + w, Y = y + h;
  return `<path d="M${x + r} ${y}H${X - r}M${X} ${y + r}V${Y - r}M${X - r} ${Y}H${x + r}M${x} ${Y - r}V${y + r}"${side === LINE ? "" : ` ${sw(side)}`}/>`
    + `<path d="M${X - r} ${y}A${r} ${r} 0 0 1 ${X} ${y + r}M${X} ${Y - r}A${r} ${r} 0 0 1 ${X - r} ${Y}M${x + r} ${Y}A${r} ${r} 0 0 1 ${x} ${Y - r}M${x} ${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}" ${sw(corner)}/>`;
};
const icon = (inside, size = 16, high = size) => `<svg viewBox="0 0 ${size} ${high}" width="${size}" height="${high}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="round" stroke-linejoin="round">${inside}</svg>`;
const ticks = (n, r0, r1, c = 0) => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n, x = Math.sin(a), y = -Math.cos(a); return `M${(c + x * r0).toFixed(2)} ${(c + y * r0).toFixed(2)}L${(c + x * r1).toFixed(2)} ${(c + y * r1).toFixed(2)}`; }).join("");
// a wave ring: a circle whose radius swings n times round it, r(θ) = R + a·cos(nθ) — a guilloché line, drawn smooth
const wave = (cx, cy, R, a, n, steps = 72) => {
  const P = Array.from({ length: steps }, (_, i) => { const t = (i / steps) * 2 * Math.PI, r = R + a * Math.cos(n * t); return [cx + r * Math.sin(t), cy - r * Math.cos(t)]; });
  const f = (v) => v.toFixed(2);
  return `M${f(P[0][0])} ${f(P[0][1])}` + P.map((p1, i) => {     // through every point, a cubic each (Catmull-Rom)
    const p0 = P[(i - 1 + steps) % steps], p2 = P[(i + 1) % steps], p3 = P[(i + 2) % steps];
    return `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }).join("") + "Z";
};
// a ring that holds a sign (a tab, a window card): outer edge at 15.5 from the centre, as before; drawn in CURVE
const RIM = 15.5 - CURVE / 2, RIM_IN = 15.5 - CURVE;      // its radius, and its inner edge
const rim = (cls = "") => `<circle${cls ? ` class="${cls}"` : ""} cx="17" cy="17" r="${RIM}" ${sw(CURVE)}/>`;

// the shared signs, on 16 points. Their live area is 3.25 … 13.25; a plus is a little shorter (9) and a cross shorter
// still (8), because open shapes look larger than the arrows and boxes beside them.
const SIGNS = {
  plus: `<path d="M8.25 3.75V12.75M3.75 8.25H12.75"/>`,
  minus: `<path d="M3.75 8.25H12.75"/>`,
  cross: `<path d="M4.25 4.25L12.25 12.25M12.25 4.25L4.25 12.25" ${sw(SLANT)}/>`,
  down: `<path d="M4.25 6.25L8.25 10.25L12.25 6.25" ${sw(SLANT)}/>`,         // a chevron; up is the same, turned
  up: `<path d="M4.25 10.25L8.25 6.25L12.25 10.25" ${sw(SLANT)}/>`,
  copy: `<rect x="5.75" y="5.75" width="7.5" height="7.5"/><path d="M10.25 5.75V2.75H2.75V10.25H5.75"/>`,
  sheet: `<path d="M4.25 2.75H9.25L12.25 5.75V13.25H4.25ZM9.25 2.75V5.75H12.25"/>`,
};
// a section's sign: a small picture inside a ring. Signs of circles share the ring's centre (17); signs with
// straight lines sit on the grid (17.25).
const C = 17.25;
const SECTION_ICONS = {
  // a dial: the plate and its centre hole (Okay's drawing, 14 Oct 2026, after the guilloché rings: "Dial → a circle
  // with a small o"; chosen, the plate filled and the hole a dot of paper: the hub's fill, in the stylesheet)
  Dial: `<circle class="hub" cx="17" cy="17" r="2" ${sw(CURVE)}/>`,
  // two rings, the three gaps equal: rim to ring, ring to ring, ring to the middle (Okay, 14 Oct 2026: "equalized")
  Rings: `<g ${sw(CURVE)}><circle cx="17" cy="17" r="9.5"/><circle cx="17" cy="17" r="4.375"/></g>`,
  Hands: `<path d="M${C} ${C}V8.75M${C} ${C}L22.75 20.75"/><circle cx="${C}" cy="${C}" r="1.5" fill="currentColor" stroke="none"/>`,
  Date: `<rect x="19" y="14" width="8" height="6.5" rx="1.5" fill="currentColor" stroke="none"/>`,      // a dial with a window at 3, four points from the rim (Okay's drawing, 11 Oct 2026)
  Export: `<path d="M${C} 9.25V20.25M13.25 16.25L${C} 20.25L21.25 16.25M10.75 24.25H23.75"/>`,
};
// a round sign button (the ring list's tools): its ring is part of the sign, drawn here as heavy as the sign
// (Okay, 14 Oct 2026: "they all count as part of icon"); the button's own border stays clear. 26 points, the sign's
// 16 in the middle; the ring's outer edge where the border's was (13 from the centre).
const round_sign = (inside) => icon(`<circle class="rim" cx="13" cy="13" r="${13 - CURVE / 2}" ${sw(CURVE)}/><g transform="translate(5 5)">${inside}</g>`, 26);
const section_icon = (name) => icon(`${rim("ring")}<g class="sign">${SECTION_ICONS[name]}</g>`, 34);
const EYE = {                                      // the left column's sign: open = showing, closed (with lashes) = put away
  open: `<path d="M1.75 8.25C3.75 4.85 6.05 3.55 8.25 3.55S12.75 4.85 14.75 8.25C12.75 11.65 10.45 12.95 8.25 12.95S3.75 11.65 1.75 8.25Z" ${sw(CURVE)}/><circle cx="8.25" cy="8.25" r="2.25" fill="currentColor" stroke="none"/>`,
  closed: `<path d="M1.75 6.75C3.75 9.85 6.05 11.05 8.25 11.05S12.75 9.85 14.75 6.75M8.25 11.05V13.75M4.95 10.35L3.95 12.65M11.55 10.35L12.55 12.65M2.75 8.35L1.35 10.05M13.75 8.35L15.15 10.05" ${sw(CURVE)}/>`,
};
const eye = (open) => icon(EYE[open ? "open" : "closed"]);
const NONE_SIGN = SIGNS.sheet + `<path d="M6.75 8.25L9.75 11.25M9.75 8.25L6.75 11.25" ${sw(SLANT)}/>`;      // the sheet with a cross: this font has none of it
// a "none" in a row of colour dots: a slashed circle at the dot's own size (10), its outer edge where it was (4); so small, LINE is enough
const none_dot = `<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="round"><circle cx="5" cy="5" r="${4 - LINE / 2}"/><path d="M3.25 3.25L6.75 6.75"/></svg>`;
// small pictures for choices that are easier seen than read: drawn at the size they are shown, 38 × 27 (they were
// drawn on 28 × 20 and enlarged 1.35 times; Okay, 13 Oct 2026: "bigger, better (less detail) icons… this goes for all")
const pic = (inside) => icon(inside, 38, 27);
const solid = `fill="currentColor" stroke="none"`;
const faint = `${sw(CURVE)} opacity="0.45"`;       // context (the dial's edge behind the A's): as heavy as any line, fainter in colour
const KIND_PIC = 24;                               // a kind's picture, a square this wide: the ring line and the Add menu
const A = (x) => `M${x - 2.75} 12.25L${x} 5.5L${x + 2.75} 12.25`;      // an A, as a chevron: how a numeral stands
const PICS = {
  // a ring's kind: the whole circle, as on a dial (Okay's drawing, 13 Oct 2026), centre 12. The four weigh about the
  // same (Okay, 13 Oct 2026: "equalize contrast"): many thin ticks (1), eight thicker marks (2), four numbers in the
  // pixel font at its own size (8), a band (3). These are the dial's own widths, pictured, not lines: kept.
  kind: (i) => icon([
    `<path d="${ticks(24, 7, 11, 12)}" stroke-width="1" stroke-linecap="butt"/>`,
    `<path d="${ticks(8, 7, 11, 12)}" stroke-width="2" stroke-linecap="butt"/>`,
    [["12", 12, 5], ["3", 20, 12], ["6", 12, 19], ["9", 4, 12]].map(([t, x, y]) => `<text class="pixel" x="${x}" y="${y}" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" stroke="none">${t}</text>`).join(""),
    `<circle cx="12" cy="12" r="8.5" stroke-width="3"/>`,
  ][i], KIND_PIC),
  shape: [`<rect x="16.5" y="4" width="5" height="19" ${solid}/>`, `<path d="M14.5 4H23.5L20.5 23H17.5Z" ${solid}/>`, `<circle cx="19" cy="13.5" r="6" ${solid}/>`],
  twelve: [                                        // the baton is the shape tile's baton: same width (5)
    `<rect x="16.5" y="4" width="5" height="19" ${solid}/>`,
    `<rect x="11.5" y="4" width="5" height="19" ${solid}/><rect x="21.5" y="4" width="5" height="19" ${solid}/>`,
    `<path d="M11 4H27L19 23Z" ${solid}/>`,
    `<rect x="16.75" y="4.75" width="4.5" height="17.5" stroke-width="2" stroke-dasharray="1.5 2.5"/>`,      // the baton, outlined and dashed (a place left empty): a dashed line looks lighter than a whole one, so 2
  ],
  mode: [                                          // an A at 3 and at 6 o'clock: how it stands
    `<path d="M4 23A15 15 0 0 1 34 23" ${faint}/><path d="M5.5 17L8.25 10.25L11 17M16.25 12.25L19 5.5L21.75 12.25M27 17L29.75 10.25L32.5 17"/>`,
    `<path d="M4 23A15 15 0 0 1 34 23" ${faint}/><path d="${A(19)}"/><path d="${A(19)}" transform="rotate(-52 19 23)"/><path d="${A(19)}" transform="rotate(52 19 23)"/>`,
    `<circle cx="19" cy="13.5" r="11.5" ${faint}/><path d="M16.75 8.75L19 3.5L21.25 8.75M16.75 23.5L19 18.25L21.25 23.5"/>`,
    `<path d="M4 23A15 15 0 0 1 34 23" ${faint}/>` + [0, -24, 24, -48, 48].map((t) => `<path d="M17 11.5L19 6.5L21 11.5" transform="rotate(${t} 19 23)"/>`).join(""),
  ],
  hole: [                                          // a window's shape: rectangle · circle · polygon · arch · arc
    box(8.25, 5.25, 21.5, 16.5, 2),
    `<circle cx="19" cy="13.5" r="8.75" ${sw(CURVE)}/>`,
    `<path d="M19 4L27.25 8.75V18.25L19 23L10.75 18.25V8.75Z" ${sw(SLANT)}/>`,
    `<path d="M4 21.5A15 15 0 0 1 34 21.5A7.5 7.5 0 0 0 19 21.5A7.5 7.5 0 0 0 4 21.5Z" ${sw(CURVE)}/>`,
    `<path d="M6 17A19 19 0 0 1 32 17L28.5 22.25A13 13 0 0 0 9.5 22.25Z" ${sw(CURVE)}/>`,
  ],
  window: [                                        // what a window shows, in as few lines as say it: one figure · one letter · a half filled · a crescent
    box(6.75, 3.25, 24.5, 20.5, 2) + `<path d="M16.25 10.5L19.5 8V19" ${sw(CURVE)}/>`,
    box(2.75, 5.25, 32.5, 16.5, 2) + `<path d="M13.5 18V9L19 15.5L24.5 9V18" ${sw(SLANT)}/>`,
    box(4.25, 4.75, 29.5, 17.5, 2) + `<path d="M19 4.75H6.25A2 2 0 0 0 4.25 6.75V20.25A2 2 0 0 0 6.25 22.25H19Z" ${solid}/>`,
    `<path d="M19 1.75A11.75 11.75 0 0 0 19 25.25A15 15 0 0 1 19 1.75Z" ${solid}/><circle cx="19" cy="13.5" r="11.75"/>`,      // the crescent beside it makes the circle look heavier: it stays LINE
  ],
};
/** a hand's picture is the hand itself, drawn by the geometry with a standard size (twice its units, so already on whole dots). */
const hand_pic = (i) => {
  const p = G.hand_shape({ ...G.HAND_BASE, shape: i, len: 13, w: 2.2, tail: 3, tip: 4.5, feature: 4.4, feature_at: [0, 0, 0, 30, 0, 0, 45, 62, 62][i] || 0, round: 0, wall: 0, counter: 0, disc_d: 6, mark_len: 7, mark_w: 2.2 });
  return `<svg viewBox="-3 -14 6 18.5" width="12" height="38" aria-hidden="true"><path d="${p.svg(3, true)}" fill="currentColor"/></svg>`;
};
/** the chosen hand as it is now, with all its settings (length, width, tail, round ends, hollow wall, counterweight),
 *  as large as its box allows: upright for a tall box, lying (tip to the right) for a wide one — both are drawn, the
 *  stylesheet shows one. The centre it turns on is marked: a line across the box and a small ring (Okay, 13 Oct 2026). */
const hand_detail = (h) => {
  const p = G.hand_shape(h), b = p.bounds();
  if (!b) return "";
  const w = b[2] - b[0], high = b[3] - b[1], m = high * 0.03, f = (v) => v.toFixed(3);      // m: a little room round it
  const d = p.svg(3, true), ring = f(Math.max(high * 0.012, 0.12));
  const centre = (line) => `<path class="axis" d="${line}"/><circle class="pivot" r="${ring}"/>`;
  return `<svg class="upright" viewBox="${f(b[0] - m)} ${f(-b[3] - m)} ${f(w + 2 * m)} ${f(high + 2 * m)}" aria-hidden="true"><path d="${d}" fill="currentColor" fill-rule="evenodd"/>${centre("M-999 0L999 0")}</svg>`
    + `<svg class="lying" viewBox="${f(b[1] - m)} ${f(b[0] - m)} ${f(high + 2 * m)} ${f(w + 2 * m)}" aria-hidden="true"><path d="${d}" transform="rotate(90)" fill="currentColor" fill-rule="evenodd"/>${centre("M0 -999L0 999")}</svg>`;
};
const TOOL_ICONS = {
  // on 18; a quiet sign, thin and light (Okay, 11 Oct 2026; again 14 Oct, 04:11: "thinner lines"): DENSE, corners
  // a sixteenth heavier as on any box; light by its grey. Outer edge where it was (1 … 17)
  rename: box(1.625, 1.625, 14.75, 14.75, 4, DENSE, DENSE + 1 / 8) + `<path d="M9.25 4.75V13.25M7.25 4.75H11.25M7.25 13.25H11.25" ${sw(DENSE)}/>`,
  panel: `<rect x="1.75" y="2.75" width="12.5" height="10.5"/><path d="M6.25 2.75V13.25"/>`,
  copy: SIGNS.copy,
  up: `<path d="M8.25 13.25V3.25M4.25 7.25L8.25 3.25L12.25 7.25"/>`,
  down: `<path d="M8.25 3.25V13.25M4.25 9.25L8.25 13.25L12.25 9.25"/>`,
  duplicate: SIGNS.copy,
  delete: `<path d="M2.75 4.75H13.75M6.25 2.25H10.25"/><path d="M4.25 4.75L5 13.25H11.5L12.25 4.75"/>`,      // the handle a flat line: a 2-point box at this weight clogs
  grip: `<g fill="currentColor" stroke="none"><circle cx="5.5" cy="4" r="1"/><circle cx="10.5" cy="4" r="1"/><circle cx="5.5" cy="8" r="1"/><circle cx="10.5" cy="8" r="1"/><circle cx="5.5" cy="12" r="1"/><circle cx="10.5" cy="12" r="1"/></g>`,
  undo: `<path d="M3.25 6.75H9.75A3.25 3.25 0 0 1 9.75 13.25H6.25M6.25 3.75L3.25 6.75L6.25 9.75" ${sw(SLANT)}/>`,
  redo: `<path d="M13.25 6.75H6.75A3.25 3.25 0 0 0 6.75 13.25H10.25M10.25 3.75L13.25 6.75L10.25 9.75" ${sw(SLANT)}/>`,
  wide: `<rect x="2.75" y="2.75" width="10.5" height="10.5"/><path d="M6.25 10.25L10.25 6.25M7.25 6.25H10.25V9.25" ${sw(DENSE)}/>`,
  find: `<circle cx="7" cy="7" r="4.25" ${sw(CURVE)}/><path d="M10.25 10.25L13.25 13.25" ${sw(SLANT)}/>`,
  // how to zoom (the bar, beside − +): a magnifier with a larger ring and an i in it (Okay, 15 Oct 2026, 00:32: "Magnifier
  // before the sentence, larger ring and an info i in that"). Through fit.mjs; the i's dot is a round end of its line
  // (a filled dot snaps to half points, a LINE to quarters: the two would not stand on one axis)
  zoominfo: `<circle cx="6.75" cy="6.75" r="5.5" ${sw(CURVE)}/><path d="M10.75 10.75L14.25 14.25" ${sw(SLANT)}/><path d="M6.75 6.25V9.75M6.75 4.25V4.25"/>`,
  screen: `<rect x="2.75" y="3.25" width="10.5" height="7.5"/><path d="M8.25 10.75V13.25M5.75 13.25H10.75" ${sw(DENSE)}/>`,
  // the Guides switch, on 18: a target and its cross; its lines crowd, so DENSE. Okay's drawings (14 Oct 2026, 04:11):
  // guides on, the centre ring dashed in six, square-ended (a dash pattern is a texture, not line ends) (core-on); guides off, a hollow slash, two lines with the target cut away
  // between them (the slash group, and the mask that cuts). The stylesheet shows one state's parts (6-preview.css).
  guides: `<mask id="guides-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18"><rect width="18" height="18" fill="white"/><path class="slash" d="M2.75 15.75L15.75 2.75" stroke="black" stroke-width="2.5" stroke-linecap="butt"/></mask>`
    + `<g ${sw(DENSE)}><g mask="url(#guides-cut)"><circle cx="9.25" cy="9.25" r="5.5"/><circle class="core-off" cx="9.25" cy="9.25" r="2"/><path d="M9.25 1.25V5.75M9.25 12.75V17.25M1.25 9.25H5.75M12.75 9.25H17.25"/></g>`
    + `<circle class="core-on" cx="9.25" cy="9.25" r="2" stroke-dasharray="1.25 0.844" stroke-linecap="butt" transform="rotate(-107.9 9.25 9.25)"/><path class="slash" d="M1.87 14.87L14.87 1.87M3.63 16.63L16.63 3.63"/></g>`,
};
// play and pause, filled, on 12: the triangle a half point right of the middle, so its weight (not its box) is centred
// play: an arcade button seen from above, on 32 (Okay, 14 Oct 2026, 23:55: "imitate a arcade button, top view, add
// shadows and highlights in basic svg sausage shapes. 3 colors and a black outline"; 15 Oct, 00:18: "fatter halfcircle
// sausages and a black even outline… the sausage thickness is equal to outer black ring"). A black disc, the red cap
// inside it leaving an even black ring RING wide; on the cap two curved sausages as thick as that ring, on one circle:
// light on the upper left, dark red on the lower right. Pressed — time running — they change places: lit from inside.
const ARCADE = (down) => {
  const RING = 3, R = 16, mid = R - RING - RING / 2;      // the sausages touch the black ring: no red between (Okay, 15 Oct 2026, 00:32)
  const arc = (from, to) => {      // a sausage along the circle of radius mid, clock-free angles: 0 = right, growing downward
    const p = (a) => `${(16 + mid * Math.cos(a * Math.PI / 180)).toFixed(3)} ${(16 + mid * Math.sin(a * Math.PI / 180)).toFixed(3)}`;
    return `M${p(from)}A${mid} ${mid} 0 0 1 ${p(to)}`;
  };
  const [light, dark] = down ? [arc(15, 135), arc(195, 315)] : [arc(195, 315), arc(15, 135)];
  return `<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">`
    + `<circle class="arc-out" cx="16" cy="16" r="${R}"/><circle class="arc-cap" cx="16" cy="16" r="${R - RING}"/>`
    + `<path class="arc-hi" d="${light}" stroke-width="${RING}"/><path class="arc-lo" d="${dark}" stroke-width="${RING}"/></svg>`;
};
// a window card: a small dial with the window where it is. The window keeps four points from the rim's inner edge at
// every angle (as on the Windows tab; Okay, 13 Oct 2026, #149): its distance from the centre is found from its own
// half-width and half-height in that direction. Its outline is LINE, its corners on quarter points.
const card_pic = (angle, on) => {
  const a = angle * Math.PI / 180, s = Math.sin(a), c = -Math.cos(a), hw = 4, hh = 3.25;
  const r = RIM_IN - 4 - (hw * Math.abs(s) + hh * Math.abs(c));
  const q = (v) => Math.round((v - 0.25) * 2) / 2 + 0.25;      // the nearest quarter point
  const x = q(17 + r * s - hw), y = q(17 + r * c - hh);
  return icon(rim() + (on ? `<rect x="${x}" y="${y}" width="8" height="6.5" rx="1.5" fill="currentColor" stroke="none"/>` : "") + box(x, y, 8, 6.5, 1.5), 34);
};

// ── rows: what each section shows ────────────────────────────

const num = (key, text, lo, hi, step, o = {}) => ({ kind: "num", key, text, lo, hi, step, ...o });
const pop = (key, text, items, o = {}) => ({ kind: "pop", key, text, items, ...o });
const seg = (key, text, items, o = {}) => ({ kind: "seg", key, text, items, ...o });
const pick = (key, text, items, pics, o = {}) => ({ kind: "pick", key, text, items, pics, ...o });      // a choice shown as pictures
const chk = (key, text, o = {}) => ({ kind: "chk", key, text, ...o });
const col = (key, text, o = {}) => ({ kind: "col", key, text, ...o });
const txt = (key, text, o = {}) => ({ kind: "txt", key, text, ...o });
const hdr = (text, o = {}) => ({ kind: "hdr", text, ...o });
const info = (text, o = {}) => ({ kind: "note", text, ...o });
const custom = (name, o = {}) => ({ kind: "custom", name, ...o });

// a ring's radius as a number row: what the radius button's pop-up shows. A numeral's radius can measure to its
// centre, its baseline or its top: the small menu beside the label, in the order Okay wrote them; what is stored is
// the place in G.ANCHORS (R9).
const RADIUS_ROWS = {
  outer: num("r", "Outer radius", 0, 25, 0.05, { scope: "ring" }),
  numerals: num("r", "Centre radius", 0, 25, 0.05, { scope: "ring", menu: { key: "anchor", title: "What the radius measures to", items: [[1, "Baseline"], [2, "Ascender"], [0, "Centre"]] } }),
};
const radius_row = (R) => RADIUS_ROWS[G.kind_of(R) === "numerals" ? "numerals" : "outer"];
// how big one thing of a ring is — its "inner" size, the number in the ring summary: a mark's length (a dot's Ø), a
// numeral's size, a band's width. As a number row: what the size button's pop-up shows (Okay, 13 Oct 2026).
const SIZE_ROWS = {
  len: num("len", "Length", 0.05, 10, 0.05, { scope: "ring" }), dot: num("w", "Ø", 0.02, 5, 0.01, { scope: "ring" }),
  numerals: num("size", "Size", 0.3, 8, 0.05, { scope: "ring" }), band: num("width", "Band width", 0.02, 25, 0.05, { scope: "ring" }),
};
const size_row = (R) => SIZE_ROWS[G.kind_of(R) === "numerals" ? "numerals" : G.kind_of(R) === "band" ? "band" : G.SHAPES[R.shape] === "dot" ? "dot" : "len"];
const VALUE_PICS = {                               // a value button's drawing, at its size (36), centre 18. Its disc is the button's edge and, since the audit's second round, a line as heavy as the others (Okay, 14 Oct 2026: "same thicknesses"); outer edges where they were
  radius: `<circle class="disc" cx="18" cy="18" r="${18 - CURVE / 2}" ${sw(CURVE)}/><path d="M18 18.25H35.5" ${sw(LINE)}/><circle class="pivot" cx="18" cy="18.25" r="2"/>`,     // a radius, from the centre to the edge
  // scale: a small circle growing into the large one, joined by their two tangents (Okay's drawing, Asset_1.svg, 13 Oct
  // 2026, turned 25° to fit the height; 22:52). The hull (both circles and what lies between the tangents) fills when
  // the button is pressed (Okay's drawing, 14 Oct 2026). Tangents and hull computed from the circles.
  size: `<path class="hull" d="M14.05 33.01L26.89 26.99A12.6875 12.6875 0 1 0 9.78 10.65L4.36 23.75A7.1875 7.1875 0 0 0 14.05 33.01Z"/><circle class="disc" cx="21.5" cy="15.5" r="12.6875" ${sw(CURVE)}/><circle class="small" cx="11" cy="26.5" r="7.1875" ${sw(CURVE)}/><path class="tangent" d="M4.36 23.75L9.78 10.65M14.05 33.01L26.89 26.99" ${sw(SLANT)}/><path class="dark" d="M11 26.5L21.5 15.5" ${sw(SLANT)}/><circle class="pivot" cx="21.5" cy="15.5" r="2"/>`,
};

// a language in the list, by its name; on its button, by two letters ("zh-Hans" → ZH; the font's own choice → "Lang.")
const LANG_NAMES = { default: "As the font sets it", tr: "Turkish", nl: "Dutch", de: "German", pl: "Polish", ro: "Romanian", ca: "Catalan", ar: "Arabic", fa: "Persian", "zh-Hans": "Chinese, simplified", ja: "Japanese" };
const lang_short = (code) => (code === "default" ? "Lang." : code.slice(0, 2).toUpperCase());      // none chosen: the button says what it is for (Okay, 13 Oct 2026: "Lang.", case and point as written; "LAN" before, a dash before that)

// a tile's word is one line: a name too long for a tile is said shorter there (its tag still says it whole)
const TILE_WORDS = { "moon phase": "moon", "radial, auto-flip": "auto-flip" };

// the font sheet's legend: a sticker of each kind, and what it says about a family. The stickers' words are short, so a
// family's stickers stand on one line; bold and italic keep their words (Okay, 13 Oct 2026: "condense all sticker text but
// bold and italic. weight gets w. and range"). The legend spells each one out.
// Each meaning is a sentence; at its end, light, in square brackets, the OpenType abbreviation of what the sticker reads (Okay, 14 Oct 2026).
// a meaning's last line is never one word alone: its last word stays with the bracket after it, or with the word before it (Okay, 14 Oct 2026: "no orphans")
function no_orphan(says, code) {
  const words = says.split(" "), keep = code ? 1 : 2, tail = words.splice(-keep);
  const end = el("span", { className: "together" }, tail.join(" "), ...(code ? [" ", el("small", { textContent: `[${code}]` })] : []));
  return [words.length ? words.join(" ") + " " : "", end];
}
const STICKER_LEGEND = [["w. 100–900", "weight", "Any weight in the range.", "wght"], ["bold", "weight", "Has a bold.", ""],
  ["italic", "italic", "Has an italic, axis or style.", "ital, slnt"], ["wd", "width", "Any width, narrow to wide.", "wdth"],
  ["opt", "optical", "Shapes made for small and large sizes.", "opsz"], ["tab", "figure", "Tabular figures, all one width.", "tnum"],
  ["old", "figure", "Oldstyle figures, which rise and fall.", "onum"], ["zero", "figure", "A slashed zero.", "zero"],
  ["frac", "figure", "Fractions: ½ made from 1/2.", "frac"], ["2 ss", "sets", "Stylistic sets: other shapes.", "ss01–ss20"],
  ["5 cv", "sets", "Single letters redrawn.", "cv01–cv99"], ["3 st", "styles", "Separate styles: Regular, Bold…", ""]];      // short, so the window rarely scrolls (Okay, 14 Oct 2026)
// the OpenType switches that change numerals, in a short word each, for the stickers
const FIGURE_WORDS = [["tnum", "tab"], ["onum", "old"], ["zero", "zero"], ["frac", "frac"]];
// a variable font's axes, in words, for the font sheet's stickers
const NAME_LEAST = 0.7;                            // in the font sheet a family's name may shrink to this share of its size to fit its column
const AXIS_WORDS = { wdth: "wd", opsz: "opt", GRAD: "grad", XHGT: "xh", SOFT: "soft", MONO: "mono", CASL: "cas" };

const kind_in = (...names) => (R) => names.includes(G.kind_of(R));
const marks_with = (...shapes) => (R) => ["ticks", "markers"].includes(G.kind_of(R)) && shapes.includes(G.SHAPES[R.shape]);
const labels_are = (name) => (R) => G.kind_of(R) === "numerals" && G.LABEL_SETS[R.labels][0] === name;
const hand_is = (...shapes) => (H) => shapes.includes(G.HAND_SHAPES[H.shape]);
const numerals_only = kind_in("numerals");
const W = { scope: "window" };
const win_on = (T) => T.on;
const win_is = (...kinds) => (T) => T.on && kinds.includes(G.WINDOW_KINDS[T.kind]);
const shape_is = (...shapes) => (T) => T.on && shapes.includes(G.window_shape(T));
// the Windows cards, left to right: 12 · 3 · 6 · 9. slot = which of the four windows a card is (window 1, the date
// window of old, starts at 3, so the second card is its); at = that place in G.DATE_AT.
const WINDOW_CARDS = [{ slot: 1, at: 4 }, { slot: 0, at: 0 }, { slot: 2, at: 2 }, { slot: 3, at: 3 }];
const HAND_NAMES = ["Hour hand", "Minute hand", "Seconds hand"];
const TAB_NAMES = { Date: "Windows" };            // the section's number and key stay "Date" (R8, R9); its tab says what it now holds
const H = { scope: "hand" };

const ROWS = {
  Dial: [
    // Okay, 13 Oct 2026: Dial and Page stay in view (pinned); the list of colours scrolls under them.
    hdr("Dial", { pin: true }),                    // the plate: how big, what colour, what is on it
    num("dial_d", "Diameter", 15, 50, 0.1),
    chk("ui_scale", "Scale everything with it", { nest: true }),
    num("dial_hole", "Centre hole", 0, 6, 0.1),      // Ø; 0 = none. Shows when the hands are hidden (#165)      // nest: a question about the row above starts on the controls' column (Okay, 12 Oct 2026)
    col("c_plate", "Plate"),
    custom("background"),
    hdr("Page", { pin: true }),                    // around the dial: preview and page only
    num("margin", "Page margin", 0, 10, 0.5),
    col("c_backdrop", "Backdrop"),
    hdr("Colours"),                                // every coloured part on the plate, in one list; a band's sectors one by one
    custom("colours"),
  ],
  Rings: [                                         // one list; rows that don't apply hide (R16)
    // one pinned pane (Okay's drawings, 13 Oct 2026). Its heading line carries the list's tools: a plus that opens
    // the four kinds, and move up · move down · duplicate · delete. Then the list. Then the selected ring in one
    // line: its name · its kind · its colour · its radius. Folded, the pane is one line: "Rings: Hours   numerals · ■ · …".
    hdr("Rings, top first", { scope: "global", pin: true, tools: "ring_tools",       // pin: stays in view while the rest scrolls
      title: (S, folded) => (folded && S.rings[S.ui_ring] ? `Rings: ${S.rings[S.ui_ring].name || G.kind_of(S.rings[S.ui_ring])}` : "Rings, top first"),
      summary: (S, tool) => { const R = S.rings[S.ui_ring]; return R ? [G.kind_of(R), { c: R.c }, `${label_of(radius_row(R), R).toLowerCase()} ${tool.in_unit(R.r, 2)}`] : []; } }),
    custom("ring_list", { scope: "global", pin: true }),
    custom("ring_line", { pin: true }),
    hdr("Sector colours", { show: (R) => G.kind_of(R) === "band" && G.positions_of(R).length > 1 }),
    custom("sectors", { show: (R) => G.kind_of(R) === "band" && G.positions_of(R).length > 1 }),
    // what one mark is comes first (Okay, 13 Oct 2026: "moves up to the top"), then where the marks are
    hdr("Shape", { show: kind_in("ticks", "markers") }),
    pick("shape", "Shape", G.SHAPES.slice(0, 3), PICS.shape, { show: kind_in("ticks", "markers") }),
    num("len", "Length", 0.05, 10, 0.05, { show: marks_with("bar", "wedge", "file") }),
    num("w", "Width · Ø", 0.02, 5, 0.01, { show: marks_with("bar", "wedge", "dot", "file") }),
    num("taper", "Inner width ×", 0, 2, 0.01, { show: marks_with("wedge") }),
    num("wall", "Hollow wall", 0, 1.5, 0.01, { show: kind_in("ticks", "markers") }),
    // the ends belong to the shape: nested under it, no pane of their own (Okay, 13 Oct 2026)
    num("round_out", "Round outer", 0, 2, 0.01, { show: marks_with("bar", "wedge", "file") }),
    num("round_in", "Round inner", 0, 2, 0.01, { show: marks_with("bar", "wedge", "file") }),
    custom("round_ends", { show: marks_with("bar", "wedge", "file") }),
    hdr("Positions"),
    num("count", "Count", 1, 360, 1, { whole: true }),
    num("start", "Start °", -180, 180, 0.5),
    num("span", "Span °", 1, 360, 1),
    num("every", "Every", 1, 60, 1, { whole: true }),
    num("offset", "Offset", 0, 59, 1, { whole: true }),
    chk("invert", "Skip those instead", { nest: true }),
    hdr("Give way to rings above"),
    pop("skip", "Skip where", G.SKIP_FROM),
    pop("knock", "Knock out", G.KNOCK_FROM),
    num("clear", "Clearance", 0, 2, 0.01, { show: (R) => R.knock !== 0 }),
    hdr("12 o’clock · first position", { show: kind_in("markers") }),
    pick("twelve", "Style", G.TWELVES, PICS.twelve, { show: kind_in("markers") }),
    num("twelve_scale", "Scale ×", 0.5, 2.5, 0.05, { show: (R) => G.kind_of(R) === "markers" && R.twelve !== 3 }),
    num("twelve_gap", "Gap", 0, 3, 0.05, { show: (R) => G.kind_of(R) === "markers" && R.twelve === 1 }),
    hdr("Numerals", { show: numerals_only }),
    pop("labels", "Labels", G.LABEL_SETS.map((s) => s[0]), { show: numerals_only, head: true }),      // head: a pane's main selector stands on its heading line, without a name of its own (Okay, 12 Oct 2026)
    txt("custom", "Custom", { show: labels_are("Custom") }),
    num("num_from", "First number", -1000, 1000, 1, { show: labels_are("Numbers") }),
    num("num_step", "Step", -100, 100, 1, { show: labels_are("Numbers") }),
    num("num_digits", "Digits", 0, 4, 1, { whole: true, show: labels_are("Numbers") }),
    num("num_again", "Start again after", 0, 60, 1, { whole: true, show: labels_are("Numbers") }),      // positions; 0 = never
    info("0 counts on. 12 with first 5, step 5: 5 to 60, then 5 again.", { show: labels_are("Numbers") }),
    pick("mode", "Placement", G.MODES, PICS.mode, { show: numerals_only }),
    hdr("Band", { show: kind_in("band") }),
    num("width", "Band width", 0.02, 25, 0.05, { show: kind_in("band") }),
    num("fill", "Fill % of step", 1, 100, 1, { show: kind_in("band") }),
    hdr("Nudge one numeral", { show: numerals_only }),
    custom("nudge", { show: numerals_only }),
    hdr("Type", { show: numerals_only }),
    custom("font", { show: numerals_only }),
  ],
  Hands: [
    custom("hands_bar", { pin: true, bar: true }),      // bar: one line of its own, always in view: All hands · Show hands · Motion
    custom("hand_tabs", { pin: true, bar: true }),      // under it, always in view: which hand the panes below are about (Okay, 12 Oct 2026: "acts as a tab system for what's below")
    hdr("One hand", { title: (S) => HAND_NAMES[S.ui_hand] }),      // its heading says which: Hour hand · Minute hand · Seconds hand
    chk("on", "Show this hand", { ...H, head: true }),      // on the heading line, beside the hand's name
    // one pane for a hand (Okay's drawings, 13 Oct 2026): at the left a box with the hand itself, as it is now; beside
    // it everything that makes it — its shape (one line of tiles that opens; a plus for a shape of one's own, later),
    // then its numbers and its colour. So what a number changes is seen right beside it, and on the dial at the right.
    // side: the row stands beside the box · short: the label when there is little room for it.
    custom("hand_detail", { ...H }),
    pick("shape", "Shape", G.HAND_SHAPES, hand_pic, { ...H, side: true, line: true, skip: [9] }),      // every shape but "file" (a shape of one's own: the SVG tile)
    num("len", "Length", 0.5, 30, 0.05, { ...H, side: true }),      // a disc's: where its marker's outer end is
    num("disc_d", "Disc Ø", 0.5, 30, 0.05, { ...H, side: true, show: hand_is("disc") }),
    seg("mark", "Marker", G.SHAPES.slice(0, 3), { ...H, side: true, show: hand_is("disc") }),      // the markers ring's shapes (#164)
    num("mark_len", "Marker length", 0.05, 10, 0.05, { ...H, side: true, short: "Marker L", show: hand_is("disc") }),
    num("mark_w", "Marker width", 0.02, 5, 0.01, { ...H, side: true, short: "Marker W", show: hand_is("disc") }),
    num("w", "Width", 0.02, 4, 0.01, { ...H, side: true, show: (H) => G.HAND_SHAPES[H.shape] !== "disc" }),
    num("tail", "Tail", 0, 10, 0.05, { ...H, side: true, show: (H) => G.HAND_SHAPES[H.shape] !== "disc" }),
    num("round", "Round ends", 0, 2, 0.01, { ...H, side: true, show: hand_is("baton", "pencil", "sword", "arrow", "syringe", "breguet", "lollipop", "file", "disc") }),      // a disc: its marker's ends
    num("tip", "Tip length", 0, 10, 0.05, { ...H, side: true, show: hand_is("pencil", "sword", "arrow", "syringe", "breguet") }),
    num("feature", "Head width", 0, 6, 0.05, { ...H, side: true, show: hand_is("arrow", "syringe") }),
    num("feature", "Ring · disc Ø", 0, 6, 0.05, { ...H, side: true, short: "Ring Ø", show: hand_is("breguet", "lollipop") }),
    num("feature_at", "Widest at %", 0, 100, 1, { ...H, side: true, show: hand_is("dauphine") }),
    num("feature_at", "Barrel from %", 0, 100, 1, { ...H, side: true, short: "Barrel %", show: hand_is("syringe") }),
    num("feature_at", "Ring · disc at %", 0, 100, 1, { ...H, side: true, short: "Ring at %", show: hand_is("breguet", "lollipop") }),
    num("counter", "Counterweight Ø", 0, 4, 0.05, { ...H, side: true, short: "Counter Ø" }),
    num("wall", "Hollow wall", 0, 1, 0.01, { ...H, side: true }),
    col("c", "Colour", { ...H, side: true }),
    hdr("Cap"),                                    // after the hand's own panes: it belongs to all three
    num("ha_cap", "Cap Ø", 0, 4, 0.05),
    col("c_cap", "Colour"),
  ],
  Date: [                                          // "Windows" on its tab: up to four holes in the plate
    custom("window_cards", { pin: true, bar: true }),      // pin: always in view, like the hand tabs (Okay, 13 Oct 2026) ·         // four cards, 12 · 3 · 6 · 9: where each window is, and tabs for the panes below (Okay, 12 Oct 2026)
    // the cards are tabs only; a window is shown by the tick on its heading line (Okay, 13 Oct 2026, after trying a
    // small switch on each card: "unnecessarily complex… enable window tickmark is the way to go. leave them as tabs")
    hdr("Window", { title: (S) => `Window at ${G.window_place(G.windows_of(S)[S.ui_window])}` }),
    chk("on", "Show this window", { ...W, head: true }),
    // where it is and how big come first, right under the tick (Okay, 13 Oct 2026); a pane of their own, Place and size, until beta 4.22
    custom("window_at", { ...W, show: win_on, text: "Position" }),
    num("r", "Radius", 2, 18, 0.05, { ...W, show: win_on }),
    num("w", "Width", 0.5, 8, 0.05, { ...W, show: shape_is("rectangle", "arch", "arc") }),
    num("w", "Ø", 0.5, 8, 0.05, { ...W, show: shape_is("circle", "polygon") }),
    num("h", "Height", 0.5, 5, 0.05, { ...W, show: shape_is("rectangle", "arc") }),
    pick("kind", "Shows", G.WINDOW_KINDS, PICS.window, { ...W, show: win_on }),
    txt("text", "Text", { ...W, show: win_is("date", "day") }),
    custom("font", { ...W, show: win_is("date", "day") }),      // its own font, or the top numerals ring's (the start)
    info("Follows the time shown: AM · PM beside the time, under the panel.", { ...W, show: win_is("am · pm") }),
    num("age", "Moon age, days", 0, 29.5, 0.1, { ...W, show: win_is("moon phase") }),
    info("0 new moon · 14.8 full.", { ...W, show: win_is("moon phase") }),
    hdr("Colours", { ...W, show: win_on }),
    col("text_c", "Picture", { ...W, show: win_is("am · pm", "moon phase"), or: (T) => T.ink }),       // or: what an unset colour is. A text's colour stands beside its font's name; this row is for the windows that show a picture       // or: what an unset colour is
    col("disc_c", "Disc under it", { ...W, show: win_on, or: () => [1, 1, 1, 1] }),
    col("ink", "Frame", { ...W, show: win_on }),
    // the hole's shape, apart from what shows through it (Okay, 13 Oct 2026): one pane for every window
    hdr("Shape", { ...W, show: win_on }),
    custom("window_shape", { ...W, show: win_on }),
    num("sides", "Sides", 3, 12, 1, { ...W, whole: true, show: shape_is("polygon") }),
    num("round", "Corner", 0, 2, 0.05, { ...W, show: shape_is("rectangle", "polygon") }),
    chk("turn", "Turn it with its radius", { ...W, show: (T) => T.on && G.window_shape(T) !== "arc" }),
    info("Only off the quarters: at 4 it turns 30°, at half past four 45°.", { ...W, show: (T) => T.on && T.turn && G.window_turn(T) === 0 && G.window_shape(T) !== "arc" }),
    chk("text_turn", "Turn the text with it", { ...W, nest: true, show: (T) => T.on && T.turn && G.window_shape(T) !== "arc" && ["date", "day"].includes(G.WINDOW_KINDS[T.kind]) }),
    // the frame round the hole and the room kept clear round it are drawn on the dial: they are design, so they
    // stand here, not under a pane called Print (Okay, 13 Oct 2026: print things under Print, design among design)
    num("frame", "Frame", 0, 0.6, 0.01, { ...W, show: win_on }),
    num("clear", "Clearance", 0, 1, 0.01, { ...W, show: win_on }),
  ],
  Export: [
    // Okay's order, 13 Oct 2026. Export a file stays in view (pinned): Vector · PDF | SVG, with its tick right
    // under it | Image · PNG on the same column, with its settings under it. Then the rest scrolls; the examples are part of the Gallery.
    hdr("Export a file", { scope: "global", pin: true }),
    custom("export_pdf"),
    custom("export_svg"),
    chk("out_live_text", "Keep numerals as text in the SVG", { nest: true, tie: true }),      // tie: no line between it and the row above: they are one thing
    info("The font must be installed where the file is opened. PDF and PNG stay outlines.", { show: (S) => S.out_live_text }),
    custom("export_png"),
    num("out_dpi", "dpi", 72, 2400, 1, { tie: true, bare: true }),      // bare: no word before it (the line under it says "at 600 dpi"); the slider stands under the buttons
    custom("png_size"),
    hdr("Print"),                                  // what only the printed or etched dial needs (was "For production" until beta 4.19)
    chk("out_production", "Mono print mask"),
    chk("out_mirror", "Mirrored, for toner transfer"),
    hdr("Link to this dial"),
    custom("link"),
    hdr("Settings file"),
    custom("settings"),
    hdr("Log"),
    custom("log"),
    hdr("Gallery"),                                // under everything else: dials to open and take apart (Okay, 13 Oct 2026), the five first examples among them
    custom("gallery"),
  ],
};
// the day slider's steps: every hour, and 10:10 — hands spread like a smile, the pose watches are photographed in
const DAY_STEPS = [...Array.from({ length: 12 }, (_, h) => [h * 3600, String(h || 12), false]), [10 * 3600 + 10 * 60, "10:10", true]].sort((a, b) => a[0] - b[0]);
// how fast time runs: one slider from half speed to 720×, on a log scale, with humps on its track at 1× (larger),
// 6×, 60× and 720× (Okay, 14 Oct 2026, 23:26: "a regular sliding track with humps on it on 1 (larger), 6 then
// logarithmicly up to 720"; "slightly slower is acceptable": it starts at 0.5×). Near a hump the slider snaps onto
// it. The speed is written beside the track, not on its thumb, which a finger covers.
const SPEED_LO = 0.5, SPEED_HI = 720, SPEED_HUMPS = [1], SPEED_SNAP = 0.025;      // one ball now, at 1× (Okay, 14 Oct 2026, 23:55: "remove the humps but the one at 1x"); the slider snaps there only
const speed_place = (k) => Math.log(k / SPEED_LO) / Math.log(SPEED_HI / SPEED_LO);      // a speed → 0 to 1 along the track
const speed_word = (k) => (k >= 10 ? String(Math.round(k)) : String(+k.toFixed(1)));      // the figures; the × follows in a span of its own, drawn larger
const SECTIONS = Object.keys(ROWS);                // their numbers are what ui_section stores (R9)
const TAB_ORDER = ["Dial", "Rings", "Hands", "Date", "Export"];      // left to right. Guides is a switch on the preview (Okay, 12 Oct 2026)
for (const name of SECTIONS) for (const row of ROWS[name]) row.scope ??= name === "Rings" ? "ring" : "global";

// ── small helpers ────────────────────────────────────────────

/** '1.2' absolute · '+0.5' add · 'x0.5' multiply · '/2' divide */
function parse_number(text, current) {
  const s = String(text).trim().replace(",", ".").replace("×", "x");
  const v = parseFloat(s.slice(1));
  let out = s[0] === "+" ? current + v : s[0] === "x" || s[0] === "*" ? current * v : s[0] === "/" ? current / v : parseFloat(s);
  return Number.isFinite(out) ? out : current;
}
/** is this row a length (kept in mm, shown in the chosen unit)? Decided by its key, where the scale tick decides it too. */
const LENGTH_KEYS = { ring: G.RING_MM, hand: G.HAND_MM, window: G.WINDOW_MM, global: ["dial_d", "margin", "ha_cap", "dial_hole", "sh_hour", "sh_minute", "sh_second", "sh_cap", "sh_disc"] };
/** a row's label: its own words, or, with a menu beside it, the chosen item's word before the last of its own
 *  ("Centre radius" → "Baseline radius"). */
const label_of = (row, T) => (row.menu ? `${(row.menu.items.find(([v]) => v === (T[row.menu.key] ?? 0)) || row.menu.items[0])[1]} ${row.text.split(" ").pop()}` : row.text);
const is_length = (row) => row.kind === "num" && (LENGTH_KEYS[row.scope] || []).includes(row.key);
const decimals = (step) => (String(step).split(".")[1] || "").length;
const fmt = (v, step) => (+v).toFixed(Math.max(decimals(step), 0));
const fmt_time = (t) => {
  t = ((Math.floor(t) % 43200) + 43200) % 43200;
  return [Math.floor(t / 3600) || 12, Math.floor(t / 60) % 60, t % 60].map((v, i) => (i ? String(v).padStart(2, "0") : v)).join(":");
};
/** "3:20", "3:20:10" keep the half of the day that is showing (pm_now); "3:20 pm", "15:20" say which. → 0 to 86400 */
function parse_time(text, pm_now = false) {
  const said = /([ap])\.?\s*m\.?\s*$/i.exec(String(text));
  if (said) text = String(text).slice(0, said.index);
  const p = String(text).split(/[:.\s]+/).map(Number);
  if (p.some((v) => !Number.isFinite(v))) return null;
  const pm = said ? said[1].toLowerCase() === "p" : p[0] >= 12 && p[0] < 24 ? true : p[0] === 24 || p[0] === 0 ? false : pm_now;
  return ((p[0] % 12) * 3600 + (p[1] || 0) * 60 + (p[2] || 0)) % 43200 + (pm ? 43200 : 0);
}
const to_hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, "0")).join("");
/** colour as hue (0–360), strength and brightness (0–1), and back. */
function rgb_hsv([r, g, b]) {
  const hi = Math.max(r, g, b), d = hi - Math.min(r, g, b);
  const h = d === 0 ? 0 : hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, hi === 0 ? 0 : d / hi, hi];
}
function hsv_rgb([h, s, v]) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)];
}
/** CMYK by plain arithmetic (no printer profile): good for naming a colour, not for proofing one. */
function rgb_cmyk([r, g, b]) {
  const k = 1 - Math.max(r, g, b);
  return k >= 1 ? [0, 0, 0, 1] : [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k];
}
const cmyk_rgb = ([c, m, y, k]) => [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)];
/** '#abc', 'ABCDEF', '#a1b2c3' → '#A1B2C3'; anything else → null. */
function parse_hex(text) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(text).trim());
  return m ? "#" + (m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1]).toUpperCase() : null;
}
const has_focus = (e) => document.activeElement === e;
/** a colour as a stylesheet reads it, see-through part included. */
const css_colour = (c) => `rgba(${c.slice(0, 3).map((v) => Math.round(clamp(v, 0, 1) * 255)).join(", ")}, ${c[3] ?? 1})`;
/** a swatch shows a colour: over a checkerboard, so a see-through one looks it (--c, read by the stylesheet). */
const paint = (swatch, c) => swatch.style.setProperty("--c", css_colour(c));
/** drag inside a box: move(x, y) gets where the pointer is, 0 to 1 across and down. */
function drag_in(box, move) {
  box.onpointerdown = (e) => {
    e.preventDefault();
    box.setPointerCapture(e.pointerId);
    const at = (ev) => { const r = box.getBoundingClientRect(); move(clamp((ev.clientX - r.left) / r.width, 0, 1), clamp((ev.clientY - r.top) / r.height, 0, 1)); };
    box.onpointermove = at;
    box.onpointerup = box.onpointercancel = () => { box.onpointermove = null; };
    at(e);
  };
}
const from_hex = (h, alpha = 1) => [1, 3, 5].map((i) => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)).concat([alpha]);

function save_file(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = el("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── a dial as a link: the settings, packed into the part of the address after # ──
//   scheme 1: lean settings (only what differs from the start) → JSON → deflate → base64 for addresses.
//   scheme 0: the same without deflate, for a browser that can't compress.

const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const un_b64 = (text) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

async function pack(S) {
  const bytes = new TextEncoder().encode(JSON.stringify(G.lean(S)));
  try { return `${G.LINK_SCHEME}.` + b64(await through(bytes, new CompressionStream("deflate-raw"))); }
  catch (e) { return "0." + b64(bytes); }
}

/** the part after # → settings, or null if it isn't a dial. */
async function unpack(hash) {
  const m = /^#?([01])\.([A-Za-z0-9_-]+)$/.exec(hash || "");
  if (!m) return null;
  try {
    const bytes = m[1] === "0" ? un_b64(m[2]) : await through(un_b64(m[2]), new DecompressionStream("deflate-raw"));
    const settings = JSON.parse(new TextDecoder().decode(bytes));
    return settings && typeof settings === "object" && !Array.isArray(settings) ? settings : null;
  } catch (e) {
    return null;
  }
}

// ── undo ─────────────────────────────────────────────────────
//   The dial as it was after each change, as text: PAST (oldest first) · NOW · FUTURE (what was undone, until the
//   next change). It belongs to the page, not to one DialTool, so loading a file or Defaults is one step back too.
//   A step is taken when the dial has been still for a moment (with the autosave), so one drag of a slider is one
//   step. Not part of a dial: the time shown and the window's own state (section, selected ring, unit…).
const HISTORY = { past: [], now: null, future: [], most: 200 };
const dial_text = (S) => JSON.stringify(S, (key, value) => (key === "t" || key.startsWith("ui_") ? undefined : value));

// ── the tool ─────────────────────────────────────────────────

class DialTool {
  constructor(settings) {
    this.S = G.fresh_settings(settings);
    this.statik = null;                            // everything that doesn't move, rebuilt when geometry changes
    this.static_dirty = true;
    this.pending = false;                          // a frame has been asked for
    this.playing = false;
    this.slots = [];                               // one SVG element per scene item, and what it shows
    this.z = 10; this.c = [0, 0]; this.fitted = true;      // preview: screen points per mm · dial centre in the view
    this.catalog = new Map();                      // fonts that can be loaded: PostScript name → {family, style, ps, load()}
    this.nudge_at = "0";                           // which numeral the nudge rows edit
    this.font_note = "";                           // what the last font action did, shown under its buttons
    this.build_ms = 0;
    this.rows = [];
    this.scrolls = {};                             // how far each section was scrolled (the window's state, not the dial's)
    this.log_lines = [];
    this.build_window();
    if (!DialTool.listening) {                     // once for the page: the tool that is open now gets the press
      DialTool.listening = true;
      document.addEventListener("pointerdown", (e) => { if (window.dial_tool) window.dial_tool.pressed(e); }, true);
      const tipped = (e) => (e.target.closest ? e.target.closest("[data-tip]") : null);      // tags: under the pointer, or where the keyboard is
      // how the last press came: a finger (or pen) or a mouse, and a key — a tap leaves no focus ring (#153)
      document.addEventListener("pointerdown", (e) => { document.documentElement.dataset.press = e.pointerType === "mouse" ? "mouse" : "touch"; }, true);
      document.addEventListener("keydown", () => { document.documentElement.dataset.press = "key"; }, true);
      document.addEventListener("pointerover", (e) => { const t = tipped(e); if (window.dial_tool) { if (t && e.pointerType !== "touch") window.dial_tool.tag_show(t); else window.dial_tool.tag_hide(); } });
      document.addEventListener("focusin", (e) => { const t = tipped(e); if (t && window.dial_tool && t.matches(":focus-visible") && document.documentElement.dataset.press !== "touch") window.dial_tool.tag_show(t); });
      document.addEventListener("focusout", () => { if (window.dial_tool) window.dial_tool.tag_hide(); });
      // the time from the keyboard (#84, atlas 4.3): ← → a minute, with ⇧ an hour; space plays or pauses. Not while
      // typing, on a slider or a menu (they use these keys), with ⌘/Ctrl/⌥ held, or with a dialog open.
      document.addEventListener("keydown", (e) => {
        const tool = window.dial_tool, at = e.target;
        if (!tool || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("dialog[open]")) return;
        if (at && at.closest && at.closest("input, textarea, select, [contenteditable='true']")) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const step = (e.shiftKey ? 3600 : 60) * (e.key === "ArrowLeft" ? -1 : 1);
          tool.set_time(((tool.S.t + step) % 86400 + 86400) % 86400);
          e.preventDefault();
        } else if (e.key === " " && !e.repeat) {
          tool.play(!tool.playing);
          e.preventDefault();
        }
      });
      document.addEventListener("keydown", (e) => {   // ⌘Z undo · ⇧⌘Z or ⌘Y redo (Ctrl on Windows) — Okay, 13 Oct 2026
        const z = (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "z", y = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "y";
        if (!(z || y) || !window.dial_tool || document.querySelector("dialog[open]")) return;
        e.preventDefault();
        window.dial_tool.undo(y || e.shiftKey ? 1 : -1);
      });
    }
    this.show_section();
    this.fit();
    this.sync_time();
    this.render();
    this.log(`Dial Tool · ${G.VERSION} · shapes: PathKit · text: HarfBuzz`);
    this.fonts_at_start();
  }

  // ── settings in scopes: the dial, the selected ring, the selected hand ──

  ring() { return this.S.rings[this.S.ui_ring]; }
  hand() { return this.S["ha_" + G.HANDS[this.S.ui_hand]]; }
  window() { return G.windows_of(this.S)[this.S.ui_window]; }
  target(scope) { return scope === "ring" ? this.ring() : scope === "hand" ? this.hand() : scope === "window" ? this.window() : this.S; }

  set_value(scope, key, value) {
    const T = this.target(scope);
    if (JSON.stringify(T[key]) === JSON.stringify(value)) return;
    // the diameter, with "scale everything" ticked: every measure on the dial grows or shrinks by the same factor
    if (scope === "global" && key === "dial_d" && this.S.ui_scale && T.dial_d > 0 && value > 0) this.scale_with(T.dial_d, value);
    T[key] = value;
    if (scope === "ring") {
      if (!["c", "name", "guide"].includes(key)) this.static_dirty = true;      // (cs too: which sectors share a colour decides the shapes)
      if (key === "kind" || key === "name" || key === "on") this.fill_ring_list();
    } else if (scope === "window") {
      if (!["ink", "text_c", "disc_c"].includes(key)) this.static_dirty = true;
      if (key === "kind") {                        // a date shows a number, a day a word: swap the untouched starting text
        if (G.WINDOW_KINDS[value] === "day" && T.text === "17") T.text = "MON";
        if (G.WINDOW_KINDS[value] === "date" && T.text === "MON") T.text = "17";
      }
    } else if (scope === "global") {
      const quiet = G.NOT_GEOMETRY.includes(key) || G.NOT_GEOMETRY_PREFIX.some((p) => key.startsWith(p));
      if (!quiet) this.static_dirty = true;
      if (key === "dial_d" || key === "margin") { if (this.fitted) this.fit(); }
    }
    this.sync_rows();
    this.render();
  }

  /** the diameter goes from one value to another and everything on the dial goes with it. The measures are always
   *  worked out from where a run of changes began (this.scale_from), not from the last step, so dragging the slider
   *  up and back lands exactly on the first values. Anything else edited in between starts a new run. */
  scale_with(from, to) {
    const S = this.S, now = JSON.stringify(G.measures(S));
    if (!this.scale_from || this.scale_from.now !== now) this.scale_from = { d: from, base: G.measures(S) };
    const run = this.scale_from;
    G.set_measures(S, run.base.map((v) => +(v * to / run.d).toFixed(6)));
    run.now = JSON.stringify(G.measures(S));
  }

  /** a press anywhere outside the colour pop-out or the guides' list puts it away (Okay, 12 Oct 2026). A press on a
   *  swatch or a colour pill is left to that swatch: it opens, moves or closes the pop-out itself. */
  pressed(e) {
    const on = (q) => e.target.closest && e.target.closest(q);
    if (this.pop && this.pop.at && !on("#colour-pop") && !on(".swatch, .colour, .backdropbox")) this.pop_close();
    if (this.guides_open && !$("#guide-list").hidden && !on(".guides")) this.guides_open(false);
    if (this.shadows_open && !$("#shadow-list").hidden && !on(".shadows")) this.shadows_open(false);
    if (this.unit_open && !$("#unit-menu").hidden && !on(".unit")) this.unit_open(false);
    if (this.lang_opens && !on(".langs")) for (const shut of this.lang_opens) shut(false);
    if (this.add_open && $("#add-menu") && !$("#add-menu").hidden && !on(".adder")) this.add_open(false);
    if (this.value_pop && !on("#value-pop") && !on(".valueb, .atmore")) this.value_pop_close();
    this.tag_hide();
  }

  // ── building the window ──────────────────────────────────

  build_window() {
    const root = $("#app");
    root.replaceChildren();
    this.tabs = el("nav", { className: "tabs" });
    TAB_ORDER.forEach((name) => {
      const i = SECTIONS.indexOf(name);
      const tab = el("button", { type: "button", onclick: () => { if (this.S.ui_section === i) return; this.S.ui_section = i; this.show_section(); this.render(); } });
      tab.dataset.tab = name;
      tab.innerHTML = section_icon(name);
      tab.append(el("span", { textContent: TAB_NAMES[name] || name }));
      this.tabs.append(tab);
    });
    this.pinned = el("div", { className: "pinned" });              // rows that stay in view
    this.form = el("div", { className: "form" });                  // rows that scroll
    const panel = el("aside", { className: "panel" },
      el("header", {}, this.title = el("div", { className: "title" }, el("h1", { textContent: "Dial Tool" }), el("span", { className: "quiet", textContent: G.VERSION })), this.unit_box()),
      this.tabs, this.pinned, this.form);

    this.svg = svg_el("svg");
    this.svg.setAttribute("class", "preview");
    this.backdrop = svg_el("rect");
    this.backdrop.setAttribute("width", "100%");
    this.backdrop.setAttribute("height", "100%");
    this.dial = svg_el("g");
    this.over = svg_el("g");                       // above the dial, same place and zoom: the outline of what the pointer is on
    this.over.setAttribute("pointer-events", "none");
    this.glow = ["glow under", "glow"].map((name) => { const line = svg_el("path"); line.setAttribute("class", name); this.over.append(line); return line; });
    this.svg.append(this.backdrop, this.dial, this.over);
    this.tip = el("div", { className: "tip", hidden: true }, el("span"));       // the name of what the pointer is on
    this.tip.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 20 10" width="20" height="10" aria-hidden="true"><path class="a" d="M0 0 L10 10 L20 0"/><path class="b" d="M0 0 L10 10 L20 0"/><path class="c" d="M-1 -3 L21 -3 L21 0 L10 9 L-1 0 Z"/></svg>');
    this.preview_events();

    this.time_field = el("input", { id: "time", className: "time", type: "text", title: "Time shown, h:mm:ss" });
    this.time_field.onchange = () => { const t = parse_time(this.time_field.value, this.S.t >= 43200); if (t !== null) this.set_time(t); else this.sync_time(); this.time_field.value = fmt_time(this.S.t); };      // "15:20" reads back as 3:20:00, PM
    // which half of the day: the hands can't say, an am · pm window can (it follows the time shown). Typing "15:20" or "3:20 pm" sets it too.
    this.half_button = el("button", { type: "button", id: "ampm", className: "half", title: "Morning or afternoon: an am · pm window follows it", onclick: () => this.set_time((this.S.t + 43200) % 86400) });
    const time_box = el("span", { className: "timebox" }, el("span", { className: "timewell" }, this.time_field), this.half_button);
    this.time_slider = el("input", { id: "time-slider", type: "range", min: 0, max: 43199, step: 1 });
    this.time_slider.oninput = () => this.set_time(+this.time_slider.value + this.half());
    this.play_button = el("button", { type: "button", className: "icon play", id: "play", onclick: () => this.play(!this.playing) });
    this.status = el("div", { className: "status" });      // what is selected, the size, the build time: kept, not shown (Okay, 14 Oct 2026, 23:19: "hide it")
    // the bar, in two parts: time (play, how fast, the time and its half of the day, now, the day slider) · view
    // (how to zoom, zoom out, in, fit). The panel's square left the bar (Okay, 14 Oct 2026, 23:19: it "doesn't work
    // anyway"; build list #190)
    this.speed = 1;
    this.speed_slider = el("input", { id: "speed", type: "range", min: 0, max: 1000, step: 1, ariaLabel: "How fast time runs", title: "How fast time runs: 0.5× to 720×" });
    this.speed_slider.oninput = () => {
      let p = +this.speed_slider.value / 1000, k = SPEED_LO * (SPEED_HI / SPEED_LO) ** p;
      const near = SPEED_HUMPS.find((h) => Math.abs(speed_place(h) - p) < SPEED_SNAP);
      if (near) k = near;
      this.set_speed(k);
    };
    // no words for the speed in the box any more (Okay, 15 Oct 2026, 00:18: "Remove 1x next to red button"): the slider
    // tells a screen reader its speed (aria-valuetext); the eye has the ball at 1× and where the thumb stands
    const humps = el("span", { className: "humps", ariaHidden: "true" }, el("i", { className: "knob first" }), el("i", { className: "knob last" }));
    for (const h of SPEED_HUMPS) {
      const ball = el("i", { className: "hump" }), name = el("span", { className: "humpname", textContent: h + "X" });      // "1X", as Okay wrote it (15 Oct 2026, 00:32)
      for (const x of [ball, name]) x.style.setProperty("--at", speed_place(h).toFixed(4));
      humps.append(ball, name);
    }
    this.speeds = el("span", { className: "speeds" }, el("span", { className: "speedtrack" }, humps, this.speed_slider));
    const view = (id, title, inside, act) => { const b = el("button", { type: "button", className: "icon", id, title, ariaLabel: title, onclick: act }); b.innerHTML = icon(inside); return b; };
    const middle = () => [this.svg.clientWidth / 2, this.svg.clientHeight / 2];
    // the day: the slider, and under it the steps a click snaps to — the twelve hours and 10:10, the pose watches are shown in
    const steps = el("div", { className: "steps12" });
    for (const [t, text, special] of DAY_STEPS) {
      const b = el("button", { type: "button", className: special ? "special" : "", textContent: text, title: special ? "10:10, the classic pose" : `${text} o’clock`, onclick: () => this.set_time(t + this.half()) });
      b.style.setProperty("--at", t / 43200);
      b.dataset.t = t;
      steps.append(b);
    }
    // a click on the slider (not a drag) goes to the nearest step
    let pressed = null;
    this.time_slider.onpointerdown = (e) => { pressed = [e.clientX, e.clientY]; };
    this.time_slider.onpointerup = (e) => {
      if (!pressed || Math.hypot(e.clientX - pressed[0], e.clientY - pressed[1]) > 3) return;
      const t = +this.time_slider.value;
      this.set_time([...this.day_ticks, 10 * 3600 + 600].reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best)) + this.half());
    };
    // the ruler behind the slider: a line with ticks crossing it. The wider the window, the finer it is cut.
    this.ruler = svg_el("svg");
    this.ruler.setAttribute("class", "ruler");
    this.ruler.setAttribute("aria-hidden", "true");
    this.day_ticks = DAY_STEPS.map((x) => x[0]);
    this.watchers = [new ResizeObserver(() => this.draw_ruler())];      // closed with the tool (close)
    this.watchers[0].observe(this.time_slider);
    const bar = el("footer", { className: "bar" },
      el("div", { className: "lead" }, this.play_button, this.speeds, time_box,
        el("button", { type: "button", id: "now", textContent: "Now", title: "The time it is now", onclick: () => { const d = new Date(); this.set_time(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000); } })),
      el("div", { className: "group day" }, this.ruler, this.time_slider, steps),
      el("div", { className: "group viewing" }, this.status, this.zoom_hint(),
        el("span", { className: "zooms" },
          view("zoom-out", "Zoom out", SIGNS.minus, () => { this.zoom(1 / 1.4, middle()); this.render(); }),
          view("zoom-in", "Zoom in", SIGNS.plus, () => { this.zoom(1.4, middle()); this.render(); })),
        el("button", { type: "button", id: "fit", textContent: "Fit", title: "Show the whole page", onclick: () => { this.fit(); this.render(); } })));
    this.set_speed(1);
    const guides = this.guides_box();
    // on the preview: undo · redo top left, beside the panel (Okay, 13 Oct 2026) · the Guides switch top right · Backdrop bottom left
    this.main = el("main", {}, this.svg, this.tip, this.undo_box(), guides, this.shadows_box(), this.backdrop_box());
    root.append(panel, this.main, bar, this.build_picker(), this.build_pop());
    requestAnimationFrame(() => this.level_title());
    this.play_icon();
    try { localStorage.removeItem("dial-tool-panel"); } catch (e) { /* not kept */ }      // the panel can't be put away any more: forget that it was
    this.watchers.push(new ResizeObserver(() => this.resized()));
    this.watchers.at(-1).observe(this.svg);
  }

  /** how to zoom, beside the zoom buttons: words, then a faint magnifier, nothing to press (Okay, 14 Oct 2026,
   *  23:19: "say cmd+scroll is zoom in out attached to the zoom area. Put a magnifier icon at the end"; 23:26: "at the
   *  end, not a button, faint"). On a screen without a pointer the words say what a finger does. */
  zoom_hint() {
    const hint = el("span", { className: "zoomhint" }, el("span", { textContent: "⌘ + scroll to zoom" }));
    hint.insertAdjacentHTML("afterbegin", icon(TOOL_ICONS.zoominfo));      // the sign before the words (Okay, 15 Oct 2026, 00:32)
    return hint;
  }

  /** the whole panel, away or back: the dial gets the window. Remembered by this browser. (Since #190 nothing in
   *  the window calls it; kept for the notes.) */
  show_panel(on) {
    $("#app").classList.toggle("nopanel", !on);
    try { localStorage.setItem("dial-tool-panel", on ? "on" : "off"); } catch (e) { /* not kept */ }
  }

  // ── units ────────────────────────────────────────────────
  //   Lengths are kept in mm (R1). The box at the panel's top right chooses the unit they are shown and typed in;
  //   it says the unit's short name and keeps its size. Its menu: the units by their full names.

  /** one line runs through the top of the window (Okay, 13 Oct 2026): the middle of the title's small letters (its
   *  x-height), the unit box, and undo · Guides on the preview. The boxes are centred on the header's middle by the
   *  stylesheet; the title is moved onto it here, because where a font's small letters sit can only be measured. */
  level_title() {
    const h = this.title.querySelector("h1"), look = getComputedStyle(h);
    this.title.style.translate = "";
    const probe = el("span");                      // an empty box in the line stands on the baseline
    probe.style.cssText = "display:inline-block;width:0;height:0";
    h.append(probe);
    const baseline = probe.getBoundingClientRect().top;
    probe.remove();
    const pen = document.createElement("canvas").getContext("2d");
    pen.font = `${look.fontWeight} ${look.fontSize} ${look.fontFamily}`;
    const x_height = pen.measureText("x").actualBoundingBoxAscent;
    const header = this.title.parentElement.getBoundingClientRect();
    if (!header.height || !x_height) return;
    this.title.style.translate = `0 ${(header.top + header.height / 2 - (baseline - x_height / 2)).toFixed(2)}px`;
  }

  unit() { return G.UNITS[this.S.ui_unit] || G.UNITS[0]; }
  /** a length in mm → the text of it in the chosen unit. */
  in_unit(mm, places) { const u = this.unit(); return (mm * u[2]).toFixed(places + u[3]); }

  unit_box() {
    const menu = el("div", { className: "unitmenu", id: "unit-menu", hidden: true });
    menu.setAttribute("role", "menu");
    this.unit_button = el("button", { type: "button", className: "unitbox", id: "unit", title: "The unit lengths are shown in" });
    this.unit_button.setAttribute("aria-haspopup", "menu");
    const open = (on) => { menu.hidden = !on; this.unit_button.setAttribute("aria-expanded", String(on)); };
    this.unit_open = open;
    this.unit_button.onclick = () => open(menu.hidden);
    this.unit_items = G.UNITS.map(([short, name], i) => {
      const b = el("button", { type: "button", id: "unit-" + short, onclick: () => { this.S.ui_unit = i; open(false); this.sync_rows(); this.render(); } }, el("span", { textContent: name }), el("span", { className: "quiet", textContent: short }));
      b.setAttribute("role", "menuitemradio");
      menu.append(b);
      return b;
    });
    const box = el("div", { className: "unit" }, this.unit_button, menu);
    box.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); this.unit_button.focus(); } };
    open(false);
    return box;
  }

  /** the backdrop's colour, at the preview's bottom left (Okay, 12 Oct 2026): one switch like the Guides one, always
   *  with a solid line, showing the colour as a chip. A press opens the colour pop-out for the backdrop. */
  backdrop_box() {
    const dot = el("i", { className: "dot" });
    const box = el("button", { type: "button", className: "onview backdropbox", id: "backdrop", title: "The backdrop’s colour (preview only)" }, dot, el("span", { textContent: "Backdrop" }));
    box.setAttribute("aria-expanded", "false");
    box.onclick = () => this.pop_open({ read: () => this.S.c_backdrop, write: (v) => this.set_value("global", "c_backdrop", v), label: () => "Backdrop" }, box);
    this.backdrop_dot = dot;
    return box;
  }

  /** guides, at the preview's top right (Okay, 12 Oct 2026): a switch (a bullseye and the word; solid outline = on,
   *  dashed = off) and, joined to it, an arrow that drops their list: the five kinds of guide, each with an eye and
   *  one of eight colours; one thickness; Reset. No free colours here. */
  guides_box() {
    this.guides_tick = el("button", { type: "button", className: "onview guidesbox", id: "guides", onclick: () => this.set_value("global", "guides", !this.S.guides) });
    this.guides_tick.innerHTML = icon(TOOL_ICONS.guides, 18);
    const word = el("span", { className: "word", textContent: "Guides" });
    word.dataset.text = "Guides";
    this.guides_tick.append(word);
    const list = el("div", { className: "guidelist night", id: "guide-list", hidden: true });
    const more = el("button", { type: "button", className: "onview guidesmore", id: "guides-more", title: "Which guides, and their colours", ariaLabel: "Which guides, and their colours" });
    more.innerHTML = icon(SIGNS.down);
    more.setAttribute("aria-expanded", "false");
    const open = (on) => { list.hidden = !on; more.setAttribute("aria-expanded", String(on)); if (on) this.sync_guides(); };
    more.onclick = () => open(list.hidden);
    this.guides_open = open;
    // a guide is one line: its name, then nine round choices — none (a struck circle), then the eight colours. The
    // chosen one wears a thick ring (after a list Okay drew on, 12 Oct 2026). get() → a place in the colours or
    // null for none; set(that) changes it.
    const dots_line = (name, get, set, none_id = "") => {
      const dots = el("span", { className: "dots", role: "radiogroup", ariaLabel: name });
      const none = el("button", { type: "button", className: "none", id: none_id, title: "None: hide " + name.toLowerCase(), ariaLabel: "None", onclick: () => { set(null); this.sync_rows(); this.render(); } });
      none.innerHTML = none_dot;
      dots.append(none);
      G.GUIDE_COLOURS.forEach((hex, i) => {
        const b = el("button", { type: "button", className: "tone", title: hex, ariaLabel: hex, onclick: () => { set(i); this.sync_rows(); this.render(); } });
        b.style.setProperty("--c", hex);
        dots.append(b);
      });
      for (const b of dots.children) b.setAttribute("role", "radio");
      const label = el("span", { className: "name", textContent: name, title: name });
      const line = el("div", { className: "guidekind" }, label, dots);
      const refresh = () => {
        const k = get();
        line.classList.toggle("off", k === null);
        [...dots.children].forEach((b, n) => { const on = n === 0 ? k === null : n - 1 === k; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); });
      };
      return { line, label, refresh };
    };
    this.guide_dots = dots_line;
    // the dial's own three: its edge, its centre lines, the windows' radii
    this.guide_kinds = G.GUIDE_KINDS.slice(0, 3).map(([show, colour, name]) => {
      const d = dots_line(name, () => (this.S[show] ? this.S[colour] : null), (k) => { if (k === null) this.S[show] = false; else { this.S[show] = true; this.S[colour] = k; } }, "guide-" + show);
      list.append(d.line);
      return d;
    });
    // the rings' guides: each ring's edges in that ring's own colour (Okay, 13 Oct 2026: "connect guides to layers").
    // One switch for which rings show theirs, then a line per ring; built again when the ring list changes (sync_guides).
    const which = el("span", { className: "segs", role: "radiogroup", ariaLabel: "Which rings show their guides" });
    [["All", true, true], ["Selected", false, true], ["None", false, false]].forEach(([word, rings, sel]) => {
      const b = el("button", { type: "button", id: "guide-rings-" + word.toLowerCase(), textContent: word, onclick: () => { this.S.gd_rings = rings; this.S.gd_sel = sel; this.sync_rows(); this.render(); } });
      b.setAttribute("role", "radio");
      which.append(b);
    });
    this.guide_which = which;
    this.guide_rings = el("div", { className: "guiderings" });
    // guides you add: a line, a crosshair, a circle (Okay: "add an option to add others, crosshair, straight line etc.")
    this.guide_more = el("div", { className: "guidemore" });
    const adds = el("span", { className: "segs" });
    G.GUIDE_MORE.forEach((kind, i) => adds.append(el("button", { type: "button", id: "guide-add-" + kind, textContent: kind[0].toUpperCase() + kind.slice(1), onclick: () => {
      const used = new Set((this.S.gd_more || []).map((g) => g.k));
      this.S.gd_more = [...(this.S.gd_more || []), { kind: i, a: 0, r: +(this.S.dial_d / 4).toFixed(2), k: [3, 0, 2, 5, 4, 1].find((k) => !used.has(k)) ?? 3 }];
      this.sync_rows(); this.render();
    } })));
    list.append(el("div", { className: "guidehead" }, el("span", { className: "name", textContent: "Rings" }), which), this.guide_rings,
      el("div", { className: "guidehead" }, el("span", { className: "name", textContent: "Add" }), adds), this.guide_more);
    this.guide_rows = [this.build_row({ ...num("gd_w", "Thickness", 0.25, 6, 0.25), scope: "global" })];
    const reset = el("button", { type: "button", className: "btn", id: "guides-reset", textContent: "Reset", title: "The guides as they started", onclick: () => {
      for (const key of Object.keys(G.DEFAULTS)) if (key.startsWith("gd_")) this.S[key] = structuredClone(G.DEFAULTS[key]);
      for (const ring of this.S.rings) ring.guide = G.RING_BASE.guide;       // the rings' own colours too: by their place again
      this.sync_rows();
      this.render();
    } });
    list.append(...this.guide_rows.map((r) => r.el), el("div", { className: "guidefoot" }, reset));
    const box = el("div", { className: "guides" }, this.guides_tick, more, list);
    box.onkeydown = (e) => { if (e.key === "Escape" && !list.hidden) { open(false); more.focus(); } };
    return box;
  }

  /** shadows, at the preview's bottom left, over the Backdrop switch (a trial; Okay, 14 Oct 2026): a switch and,
   *  joined to it, an arrow that opens their settings upward — made like the Guides switch. Preview only (R5). */
  shadows_box() {
    this.shadows_tick = el("button", { type: "button", className: "onview guidesbox shadowsbox", id: "shadows", onclick: () => this.set_value("global", "sh_on", !this.S.sh_on) });
    const word = el("span", { className: "word", textContent: "Shadows" });
    word.dataset.text = "Shadows";
    this.shadows_tick.append(word);
    const list = el("div", { className: "guidelist shadelist night", id: "shadow-list", hidden: true });
    const more = el("button", { type: "button", className: "onview guidesmore", id: "shadows-more", title: "The light, and how high each part stands", ariaLabel: "The light, and how high each part stands" });
    more.innerHTML = icon(SIGNS.down);
    more.setAttribute("aria-expanded", "false");
    const open = (on) => { list.hidden = !on; more.setAttribute("aria-expanded", String(on)); if (on) this.sync_shadows(); };
    more.onclick = () => open(list.hidden);
    this.shadows_open = open;
    const row = (r) => this.build_row({ ...r, scope: "global" });
    const head = (text) => el("div", { className: "guidehead" }, el("span", { className: "name", textContent: text }));
    const light = [row(num("sh_from", "From", 0, 359, 1, { whole: true })), row(num("sh_rise", "Height", 5, 85, 1, { whole: true })),
      row(num("sh_dark", "Darkness", 0, 100, 1, { whole: true })), row(chk("sh_blur", "Soft edge"))];
    const heights = [row(num("sh_hour", "Hour hand", 0, 3, 0.05)), row(num("sh_minute", "Minute hand", 0, 3, 0.05)), row(num("sh_second", "Seconds hand", 0, 3, 0.05)), row(num("sh_cap", "Cap’s top", 0, 4, 0.05))];
    const under = [row(num("sh_disc", "Date discs", 0, 2, 0.05))];
    this.shadow_rows = [...light, ...heights, ...under];
    // the soft edge blurs every shadow again on every frame: a warning beside it (Okay, 23:05: "we don't even need blur but keep it, write a warning beside it")
    light[3].el.querySelector("label.check").append(el("span", { className: "quiet", textContent: "\u00a0· may stutter while time runs" }));
    const reset = el("button", { type: "button", className: "btn", id: "shadows-reset", textContent: "Reset", title: "The shadows as they started", onclick: () => {
      for (const key of Object.keys(G.DEFAULTS)) if (key.startsWith("sh_") && key !== "sh_on") this.S[key] = structuredClone(G.DEFAULTS[key]);
      this.sync_rows();
      this.render();
    } });
    list.append(head("Light · degrees"), ...light.map((r) => r.el), head("Over the plate · mm"), ...heights.map((r) => r.el),
      head("Under the plate · mm"), ...under.map((r) => r.el), el("div", { className: "guidefoot" }, reset));
    const box = el("div", { className: "shadows" }, this.shadows_tick, more, list);
    box.onkeydown = (e) => { if (e.key === "Escape" && !list.hidden) { open(false); more.focus(); } };
    return box;
  }

  /** shadows on the preview (a trial, preview only: R5). One light, far away. Each part stands at a height: the date
   *  discs under the plate, the plate's face at 0, the hands over it, the cap on top. A part at height z casts its own
   *  outline, shifted by z / tan(the light's height) away from the light, onto every surface lower than it; each
   *  surface keeps only what falls on itself (a clip by its own outline). So a seconds hand's shadow lies further out
   *  on the plate than on the minute hand it crosses, and steps at that hand's edge — and at a window's edge.
   *  The hands and the cap are tied to the centre by their pipes: the pipes' shadow is a band from the centre to the
   *  cap's shadow, as wide as the cap. Nothing is drawn outside the dial: the plate's own shadow falls only into its
   *  windows. Each surface's shadows are one group with one opacity, so where two overlap it is not darker. */
  draw_shadows(items) {
    const S = this.S;
    if (!this.shade) {
      const defs = svg_el("defs"), filter = svg_el("filter"), blur = svg_el("feGaussianBlur");
      filter.id = "shadow-soft";
      for (const [k, v] of [["x", "-20%"], ["y", "-20%"], ["width", "140%"], ["height", "140%"]]) filter.setAttribute(k, v);
      filter.append(blur);
      defs.append(filter);
      this.svg.prepend(defs);
      this.shade = { defs, blur, parts: new Map() };
    }
    const shade = this.shade, used = new Set();
    // a node, made once and kept by its name; parts not used this frame are removed at the end
    const part = (name, tag, parent) => {
      let n = shade.parts.get(name);
      if (!n) { n = svg_el(tag); shade.parts.set(name, n); }
      if (n.parentNode !== parent) parent.append(n);
      used.add(name);
      return n;
    };
    const set = (n, k, v) => { if (n.getAttribute(k) !== v) n.setAttribute(k, v); };
    const finish = () => { for (const [name, n] of shade.parts) if (!used.has(name)) { n.remove(); shade.parts.delete(name); } };
    if (!S.sh_on || S.out_production) return finish();

    set(shade.blur, "stdDeviation", "0.07");      // mm: a small soft edge, the same for every shadow (0.08 until Okay, 23:05: "sharpen it just a little")
    const a = S.sh_from * Math.PI / 180, per = 1 / Math.tan(clamp(S.sh_rise, 1, 89) * Math.PI / 180);
    const away = (dz) => [-Math.sin(a) * per * dz, -Math.cos(a) * per * dz];      // y grows upward inside the dial (place())
    const f = (v) => v.toFixed(4);
    const height = { hour: S.sh_hour, minute: S.sh_minute, second: S.sh_second };
    const nodes = items.map((_, i) => this.slots[i].node);
    const hands = items.map((item, i) => ({ item, i })).filter((x) => x.item.role === "hand").map((x) => ({ ...x, z: height[x.item.name] ?? 0, d: this.slots[x.i].d }));
    const cap_r = S.ha_on && S.ha_cap > 0 ? S.ha_cap / 2 : 0;
    const top = Math.max(S.sh_cap, ...hands.map((h) => h.z));

    // one surface: its group goes just before `before` (a node, or null for the end), clipped to its own outline
    const surface = (name, before, outline, from_z) => {
      const g = part(name, "g", this.dial), clip = part(name + "/clip", "clipPath", shade.defs);
      clip.id = "shadow-clip-" + name;
      outline.forEach(([d, turn], k) => { const p = part(`${name}/clip/${k}`, "path", clip); set(p, "d", d); set(p, "transform", turn ? `rotate(${f(-turn)})` : ""); });
      set(g, "clip-path", `url(#${clip.id})`);
      set(g, "opacity", String(clamp(S.sh_dark, 0, 100) / 100));
      set(g, "fill", "#000");
      set(g, "pointer-events", "none");
      if (S.sh_blur) set(g, "filter", "url(#shadow-soft)"); else g.removeAttribute("filter");
      if (g.nextSibling !== before) this.dial.insertBefore(g, before);
      // what falls on it: every hand higher than it, then the pipes' band up to the cap's top
      let k = 0;
      const cast = (d, turn, dz) => {
        const p = part(`${name}/cast/${k++}`, "path", g), [x, y] = away(dz);
        set(p, "d", d);
        set(p, "transform", `translate(${f(x)} ${f(y)})` + (turn ? ` rotate(${f(-turn)})` : ""));
      };
      for (const h of hands) if (h.z > from_z) cast(h.d, h.item.angle, h.z - from_z);
      if (cap_r && top > from_z) {
        // the pipes stand from the plate's face (0) to the cap's top: on a surface under the plate their band starts
        // where the face's height lands, not at the centre
        const [x0, y0] = away(Math.max(0, -from_z)), [x, y] = away(top - from_z);
        const len = Math.hypot(x - x0, y - y0) || 1, nx = -(y - y0) / len * cap_r, ny = (x - x0) / len * cap_r;
        const ring = (cx, cy) => `M${f(cx - cap_r)} ${f(cy)}A${f(cap_r)} ${f(cap_r)} 0 1 0 ${f(cx + cap_r)} ${f(cy)}A${f(cap_r)} ${f(cap_r)} 0 1 0 ${f(cx - cap_r)} ${f(cy)}Z`;
        for (const d of [ring(x0, y0), ring(x, y), `M${f(x0 + nx)} ${f(y0 + ny)}L${f(x + nx)} ${f(y + ny)}L${f(x - nx)} ${f(y - ny)}L${f(x0 - nx)} ${f(y0 - ny)}Z`]) {
          const p = part(`${name}/cast/${k++}`, "path", g);
          set(p, "d", d);
          set(p, "transform", "");
        }
      }
      return { cast, g };
    };

    // the date discs, under the plate: they catch the plate's own shadow at the window's edge, and the hands'
    const plate_at = items.findIndex((x) => x.role === "plate");
    const discs = items.map((x, i) => ({ x, i })).filter(({ x }) => x.role === "date disc");
    if (discs.length && plate_at >= 0) {
      const s = surface("discs", nodes[plate_at], discs.map(({ i }) => [this.slots[i].d, 0]), -S.sh_disc);
      s.cast(this.slots[plate_at].d, 0, S.sh_disc);
    }
    // the plate's face, with everything printed on it: drawn after the last thing before the hands
    if (plate_at >= 0 && hands.length) {
      const first = items.findIndex((x) => x.role === "hand" || x.role === "cap" || x.role === "guide");
      surface("plate", first >= 0 ? nodes[first] : null, [[this.slots[plate_at].d, 0]], 0);
    }
    // each hand catches the hands above it
    for (const h of hands) if (hands.some((o) => o.z > h.z) || (cap_r && top > h.z)) surface("hand-" + h.item.name, nodes[h.i + 1] || null, [[h.d, h.item.angle]], h.z);
    finish();
  }

  /** the guides' switch and list show the settings. */
  sync_guides() {
    const S = this.S;
    this.guides_tick.setAttribute("aria-pressed", String(Boolean(S.guides)));
    this.guides_tick.title = S.guides ? "Guides are on: press to hide them" : "Guides are off: press to show them";
    if ($("#guide-list").hidden) return;
    for (const k of this.guide_kinds) k.refresh();
    // which rings show their guides
    const which = S.gd_rings ? 0 : S.gd_sel ? 1 : 2;
    [...this.guide_which.children].forEach((b, n) => { b.classList.toggle("on", n === which); b.setAttribute("aria-checked", String(n === which)); });
    // a line per ring, top first, built again when the list of rings changes
    const rings = JSON.stringify(S.rings.map((r) => r.name));
    if (this.guide_rings.dataset.rings !== rings) {
      this.guide_rings.dataset.rings = rings;
      this.guide_ring_lines = S.rings.map((ring, i) => {
        const d = this.guide_dots(ring.name || G.kind_of(ring), () => G.ring_guide(this.S, i), (k) => { this.S.rings[i].guide = k === null ? -2 : k; });
        d.line.classList.add("ring");
        return d;
      });
      this.guide_rings.replaceChildren(...this.guide_ring_lines.map((d) => d.line));
    }
    this.guide_ring_lines.forEach((d, i) => { d.refresh(); d.line.classList.toggle("selected", i === S.ui_ring); });
    // the guides added by hand: name · its measures · remove, then its colours
    const more = JSON.stringify((S.gd_more || []).map((g) => g.kind));
    if (this.guide_more.dataset.more !== more) {
      this.guide_more.dataset.more = more;
      this.guide_more_lines = (S.gd_more || []).map((g, i) => {
        const kind = G.GUIDE_MORE[g.kind], d = this.guide_dots(kind[0].toUpperCase() + kind.slice(1), () => (this.S.gd_more[i].k >= 0 ? this.S.gd_more[i].k : null), (k) => { this.S.gd_more[i].k = k === null ? -2 : k; });
        const field = (key, word, length) => {
          const input = el("input", { type: "text", inputMode: "decimal", id: `guide-more-${i}-${key}`, title: word, ariaLabel: word });
          input.onchange = () => { const now = this.S.gd_more[i][key] * (length ? this.unit()[2] : 1); this.S.gd_more[i][key] = +(parse_number(input.value, now) / (length ? this.unit()[2] : 1)).toFixed(4); this.sync_rows(); this.render(); };
          return { key, length, input, el: el("label", { className: "guidefield" }, el("span", { textContent: word }), input) };
        };
        const fields = [...(kind !== "circle" ? [field("a", "°", false)] : []), ...(kind !== "line" ? [field("r", "r", true)] : [])];
        const gone = el("button", { type: "button", className: "sign", id: `guide-more-${i}-remove`, title: "Remove this guide", ariaLabel: "Remove this guide", onclick: () => { this.S.gd_more = this.S.gd_more.filter((_, n) => n !== i); this.sync_rows(); this.render(); } });
        gone.innerHTML = icon(SIGNS.cross);
        d.label.replaceChildren(d.label.textContent, ...fields.map((f) => f.el));
        d.line.classList.add("added");
        d.line.append(gone);
        return { ...d, fields };
      });
      this.guide_more.replaceChildren(...this.guide_more_lines.map((d) => d.line));
    }
    this.guide_more_lines.forEach((d, i) => {
      d.refresh();
      for (const f of d.fields) if (document.activeElement !== f.input) f.input.value = f.length ? String(parseFloat(this.in_unit(S.gd_more[i][f.key], 2))) : String(+(+S.gd_more[i][f.key]).toFixed(1));
    });
    for (const r of this.guide_rows) r.refresh(S);
  }

  /** the rows of the section that is showing. A heading opens a pane; the rows after it go inside the pane,
   *  which can be folded. Each section remembers how far it was scrolled. */
  show_section() {
    if (!(this.S.ui_section in SECTIONS)) this.S.ui_section = 0;
    const name = SECTIONS[this.S.ui_section];
    if (this.section_shown) this.scrolls[this.section_shown] = this.form.scrollTop;
    this.pop_close();                              // its swatch goes with the rows
    [...this.tabs.children].forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
    this.form.replaceChildren();
    this.pinned.replaceChildren();
    this.ring_list = null;                         // the Rings section builds it again
    this.ring_line_holder = null;
    this.font_scope = SECTIONS[this.S.ui_section] === "Date" ? "window" : "ring";      // whose font the font row here is about
    this.rows = ROWS[name].map((row) => this.build_row(row));
    let pane = null;
    for (const r of this.rows) {
      if (r.row.bar) (r.row.pin ? this.pinned : this.form).append(r.el);      // a line of its own, outside the panes
      else if (r.fold) { pane = r; (r.row.pin ? this.pinned : this.form).append(r.el); }
      else if (r.row.head && pane) {               // a pane's main selector: its control alone, on the heading line
        const control = r.el.lastElementChild;
        control.classList.add("headcontrol");
        control.ariaLabel = r.row.text;
        r.el = control; r.group = pane; r.in_head = true;
        pane.button.after(control);
        pane.el.classList.add("has");
      }
      else { r.group = pane; pane.body.append(r.el); }
    }
    this.pinned.hidden = !this.pinned.children.length;
    this.sync_rows();
    this.section_shown = name;
    this.form.scrollTop = this.scrolls[name] || 0;
  }

  /** folded groups are remembered by this browser (a convenience, not part of the dial). */
  is_folded(r) {
    if (!this.folds) { try { this.folds = JSON.parse(localStorage.getItem("dial-tool-folds")) || {}; } catch (e) { this.folds = {}; } }
    return this.folds[r.fold] ?? Boolean(r.row.folded);
  }
  fold(r, folded) {
    this.is_folded(r);
    this.folds[r.fold] = folded;
    try { localStorage.setItem("dial-tool-folds", JSON.stringify(this.folds)); } catch (e) { /* not kept */ }
    const open = r.body.offsetHeight;                // the pane's height before anything changes (0 if it was folded)
    this.sync_rows();
    this.slide(r, open, folded);
  }

  /** a pane closes and opens by sliding, so what is under it travels instead of jumping.
   *  Not when the system asks for less motion; and never left half-way (R17). */
  slide(r, from, folded) {
    const body = r.body;
    if (r.sliding) { r.sliding.onfinish = r.sliding.oncancel = null; r.sliding.cancel(); r.sliding = null; }      // turned round half-way
    const done = () => { body.classList.remove("sliding"); body.hidden = this.is_folded(r); r.sliding = null; };
    body.hidden = false;                             // in view while it slides
    const to = folded ? 0 : body.offsetHeight;
    if (!body.animate || from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    body.classList.add("sliding");
    r.sliding = body.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 140, easing: "ease-out" });
    r.sliding.onfinish = r.sliding.oncancel = done;
  }

  /** the shadows' switch and list show the settings. */
  sync_shadows() {
    const on = Boolean(this.S.sh_on);
    this.shadows_tick.setAttribute("aria-pressed", String(on));
    this.shadows_tick.title = on ? "Shadows are on: press to hide them" : "Shadows are off: press to show them";
    if (!$("#shadow-list").hidden) for (const r of this.shadow_rows) r.refresh(this.S);
  }

  /** every row: hidden if it doesn't apply (R16); its controls showing the scope's value. A pane hides its rows
   *  when it is folded, and everything in it when its heading doesn't apply. */
  sync_rows() {
    this.sync_guides();
    this.sync_shadows();
    this.sync_ring_summaries();
    paint(this.backdrop_dot, this.S.c_backdrop);
    this.unit_button.textContent = this.unit()[0];
    this.unit_items.forEach((b, i) => { b.classList.toggle("on", i === this.S.ui_unit); b.setAttribute("aria-checked", String(i === this.S.ui_unit)); });
    for (const r of this.rows) {
      const T = this.target(r.row.scope);
      const applies = r.row.show ? Boolean(r.row.show(T)) : true;
      r.el.hidden = !applies;
      if (r.fold) {
        const folded = this.is_folded(r);
        r.el.classList.toggle("folded", folded);
        if (!r.sliding) r.body.hidden = folded;
        if (r.folded_shown !== folded) { r.folded_shown = folded; r.eye.innerHTML = eye(!folded); r.button.setAttribute("aria-expanded", String(!folded)); }
        const parts = folded ? this.summary(r) : [], said = JSON.stringify(parts);
        if (r.summary_shown !== said) { r.summary_shown = said; this.show_summary(r.summary, parts); }
      }
      const pane = r.group;
      if (applies && (r.in_head || !(pane && (pane.el.hidden || this.is_folded(pane))))) r.refresh(T);      // a heading's selector shows even when its pane is folded
    }
    if (this.value_pop) {
      if (!this.value_pop.box.isConnected) this.value_pop = null;      // its line went with the section
      else this.value_pop.r.refresh(this.target(this.value_pop.r.row.scope));
    }
    this.pop_refresh();
  }

  /** what a folded pane holds, in a few words: the values of its first rows. Folding hides controls, not information. */
  summary(heading) {
    if (heading.row.summary) return heading.row.summary(this.S, this);
    const parts = [];
    for (const r of this.rows) {
      if (r.group !== heading || !r.row.key || r.in_head || parts.length === 3) continue;
      const row = r.row, T = this.target(row.scope);
      if (row.show && !row.show(T)) continue;
      const v = T[row.key];
      if (row.kind === "num") parts.push(`${label_of(row, T).replace(/^…/, "").toLowerCase()} ${is_length(row) ? this.in_unit(v, decimals(row.step)) : fmt(v, row.step)}`);
      else if (row.kind === "pop" || row.kind === "pick" || row.kind === "seg") parts.push(String(row.items[v] ?? ""));
      else if (row.kind === "col") parts.push({ c: v || (row.or ? row.or(T) : [0, 0, 0, 1]) });       // a colour is shown, not spelled: a tiny swatch (Okay, 13 Oct 2026)
      else if (row.kind === "txt") parts.push(String(v));
      else if (row.kind === "chk" && v) parts.push(row.text.toLowerCase());
    }
    return parts.filter(Boolean);
  }

  /** a summary's parts in a line, a dot between them: words as words, a colour as a tiny swatch. */
  show_summary(box, parts) {
    box.replaceChildren();
    parts.forEach((part, i) => {
      if (i) box.append(" · ");
      if (typeof part === "string") return box.append(part);
      const dot = el("i", { className: "dot tiny", title: to_hex(part.c).toUpperCase() });
      paint(dot, part.c);
      box.append(dot);
    });
  }

  /** one row of the form → {row, el, refresh(T)}. */
  build_row(row) {
    const wrap = el("div", { className: "row " + row.kind + (row.nest ? " nest" : "") + (row.side ? " side" : "") });
    const tied = () => { if (row.tie) out.el.classList.add("tied"); };      // tie: this row belongs to the one above it, no line between them
    const out = { row, el: wrap, refresh: () => {} };
    const set = (v) => this.set_value(row.scope, row.key, v);
    const id = `${row.scope}-${row.key}-${row.text || row.name}`.replace(/[^A-Za-z0-9]+/g, "-");
    const active = (e) => document.activeElement === e;

    if (row.kind === "hdr") {                      // a heading: click it to fold or unfold its group
      out.fold = `${SECTIONS[this.S.ui_section]}/${row.text || row.name}`;
      // the eye in the left column says whether the pane is open; the whole heading is its button
      const title = el("h2", { textContent: row.text || "" });
      out.eye = el("span", { className: "eye" });
      out.summary = el("span", { className: "summary quiet" });
      out.button = el("button", { type: "button", className: "fold", title: "Show or hide this pane", onclick: () => this.fold(out, !this.is_folded(out)) }, out.eye, title, out.summary);
      out.body = el("div", { className: "body" });
      out.el = el("section", { className: "pane" }, out.button, out.body);
      if (row.tools) {                             // tools on the heading line, at its right; folded, the summary stands there instead
        out.el.classList.add("tooled");
        out.button.after(this["head_" + row.tools]());
      }
      if (row.title) out.refresh = (T) => { title.textContent = row.title(T, this.is_folded(out)); };
      return out;
    }
    if (row.kind === "note") wrap.append(el("span"), el("span", { className: "quiet", textContent: row.text }));

    if (row.kind === "num") {                      // label · slider · typed field · stepper (R15)
      const slider = el("input", { type: "range", min: row.lo, max: row.hi, step: row.step, id: id + "-slider" });
      const field = el("input", { type: "text", id, inputMode: "decimal", title: "1.2 sets · +0.5 adds · x0.5 multiplies · /2 divides" });
      const commit = (v) => {
        v = row.whole ? Math.round(v) : +(+v).toFixed(6);
        set(row.whole ? clamp(v, row.lo, row.hi) : v);       // typing past the slider's range is allowed
      };
      // a length is kept in mm and shown in the chosen unit: per = how many of that unit make a mm, places = decimals shown
      const length = is_length(row);
      const per = () => (length ? this.unit()[2] : 1), places = () => decimals(row.step) + (length ? this.unit()[3] : 0);
      const shown = (v) => (v * per()).toFixed(places());
      const now = () => { const T = this.target(row.scope); return T[row.key] ?? (row.or ? row.or(T) : 0); };      // or: what an unset number is (a window's tracking: the numerals')
      let typing = false;                          // the field follows every change, except while you type in it
      slider.oninput = () => commit(+slider.value);
      field.oninput = () => { typing = true; };
      field.onblur = () => { typing = false; out.refresh(this.target(row.scope)); };
      field.onchange = () => { typing = false; commit(parse_number(field.value, now() * per()) / per()); out.refresh(this.target(row.scope)); };
      field.onkeydown = (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); commit(now() + (e.key === "ArrowUp" ? 1 : -1) * row.step * (e.shiftKey ? 10 : 1)); }
      };
      const step = (dir) => el("button", { type: "button", className: "step", textContent: dir > 0 ? "+" : "−", tabIndex: -1, onclick: () => commit(now() + dir * row.step) });
      const label = el("label", { htmlFor: id, textContent: row.text });
      if (row.short) { label.textContent = ""; label.title = row.text; label.append(el("span", { className: "whole", textContent: row.text }), el("span", { className: "short", textContent: row.short })); }      // two wordings; the stylesheet shows the one there is room for
      let lead = label, menu = null;
      if (row.button) lead = el("button", { type: "button", className: "btn main", id: "export-" + row.button, textContent: row.button.toUpperCase(), title: `Export a ${row.button.toUpperCase()} at this dpi`, onclick: () => this.export(row.button) });
      if (row.menu) {                              // label · a small boxed arrow: the browser's own menu lies over the arrow, unseen
        menu = el("select", { id: id + "-" + row.menu.key, title: row.menu.title, ariaLabel: row.menu.title });
        for (const [v, name] of row.menu.items) menu.append(el("option", { value: v, textContent: name }));
        menu.onchange = () => this.set_value(row.scope, row.menu.key, +menu.value);
        const arrow = el("span", { className: "labelmenu" }, menu);
        arrow.insertAdjacentHTML("afterbegin", icon(`<path d="M3.25 4.75L6.25 7.75L9.25 4.75" ${sw(SLANT)}/>`, 12));
        lead = el("span", { className: "menulabel" }, label, arrow);
      }
      if (row.button) { slider.ariaLabel = field.ariaLabel = row.text; field.title = row.text + " · " + field.title; }
      if (row.bare) { label.textContent = ""; label.className = "blank"; slider.ariaLabel = field.ariaLabel = row.text; field.title = row.text + " · " + field.title; }
      if (row.side) {
        // beside a hand's box there is little room (Okay, 13 Oct 2026): the number with a tiny plus over a tiny minus
        // joined to it. A press on the number and the box grows towards the slider, over it, into a large field
        // between a large minus and plus; it goes back when one presses elsewhere, or Enter or Escape.
        const box = el("span", { className: "numbox" }, field, step(-1), step(1));
        for (const b of box.querySelectorAll(".step")) b.onmousedown = (e) => e.preventDefault();      // a press on minus or plus leaves the field as it is: closed stays closed, open stays open
        field.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === "Escape") field.blur(); });
        wrap.append(lead, slider, box);
      } else wrap.append(lead, slider, field, el("span", { className: "steps" }, step(-1), step(1)));
      out.refresh = (T) => {
        const v = T[row.key] ?? (row.or ? row.or(T) : 0);
        if (v > +slider.max) slider.max = v;       // the slider grows to hold a typed value
        if (v < +slider.min) slider.min = v;
        if (+slider.value !== v) slider.value = v;
        filled(slider);
        if (!typing) field.value = shown(v);
        if (menu) { menu.value = T[row.menu.key] ?? 0; label.textContent = label_of(row, T); }
      };
    }

    if (row.kind === "pop") {
      const select = el("select", { id });
      row.items.forEach((name, i) => select.append(el("option", { value: i, textContent: name })));
      select.onchange = () => set(+select.value);
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), select);
      out.refresh = (T) => { select.value = T[row.key]; };
    }

    if (row.kind === "pick") {                     // a choice as pictures: one tile per item, on the columns
      const group = el("span", { className: "picks", role: "radiogroup", ariaLabel: row.text });
      row.items.forEach((name, i) => {
        if (row.skip && row.skip.includes(i)) return;      // an item kept in the list for its place (R9) but not offered here
        const tile = el("button", { type: "button", className: "pickt", id: `${id}-${i}`, title: name, onclick: () => set(i) });
        tile.setAttribute("role", "radio");
        tile.innerHTML = typeof row.pics === "function" ? row.pics(i) : pic(row.pics[i]);
        tile.append(el("span", { textContent: TILE_WORDS[name] || name }));
        group.append(tile);
      });
      const label = el("label", { textContent: row.text, className: row.label ? "strong" : "" });
      // line: the tiles alone on one line, without their label; the line shows the chosen one and the first few others,
      // a "more" tile opens all of them, and a dashed plus stands for a shape of one's own (an SVG file: not built yet)
      let more = null;
      if (row.line) {
        more = el("button", { type: "button", className: "pickt more", id: id + "-more", title: "All the shapes" });
        more.innerHTML = icon(`<path d="M7.75 11L13.75 17L19.75 11" ${sw(SLANT)}/>`, 27) + "<span>more</span>";
        more.setAttribute("aria-expanded", "false");
        more.onclick = () => { const open = !group.classList.contains("open"); group.classList.toggle("open", open); more.setAttribute("aria-expanded", String(open)); more.lastChild.textContent = open ? "less" : "more"; };
        const own = el("button", { type: "button", className: "pickt own", id: id + "-own", title: "A shape of your own, from an SVG file: not built yet" });
        own.innerHTML = icon(`<path d="M13.75 6.25V21.25M6.25 13.75H21.25"/>`, 27) + "<span>SVG</span>";
        own.setAttribute("aria-disabled", "true");
        group.classList.add("line");
        group.append(more, own);
        wrap.append(group);
      } else wrap.append(label, group);
      out.refresh = (T) => {
        if (row.label) label.textContent = row.label(T);
        const tiles = [...group.querySelectorAll('[role="radio"]')];
        tiles.forEach((b, i) => { b.classList.toggle("on", i === T[row.key]); b.setAttribute("aria-checked", String(i === T[row.key])); });
        if (row.line) for (const [name, n] of [["in3", 3], ["in4", 4]]) {      // which tiles the closed line shows: the first n, the last of them giving its place to the chosen one
          const chosen = T[row.key] || 0, shown = chosen < n ? tiles.slice(0, n) : [...tiles.slice(0, n - 1), tiles[chosen]];
          tiles.forEach((b) => b.classList.toggle(name, shown.includes(b)));
        }
      };
    }

    if (row.kind === "seg") {
      // order: the buttons' order when it isn't the list's (the list only grows at its end, R9) · many: on two lines
      const group = el("span", { className: row.many ? "segs many" : "segs" });
      const buttons = row.items.map((name, i) => el("button", { type: "button", id: `${id}-${i}`, textContent: name, onclick: () => { set(i); if (row.key.startsWith("ui_")) this.sync_rows(); } }));
      group.append(...(row.order || buttons.map((b, i) => i)).map((i) => buttons[i]));
      wrap.append(el("label", { textContent: row.text }), group);
      out.refresh = (T) => buttons.forEach((b, i) => b.classList.toggle("on", i === T[row.key]));
    }

    if (row.kind === "chk") {
      const box = el("input", { type: "checkbox", id });
      box.onchange = () => set(box.checked);
      wrap.append(el("span"), el("label", { className: "check", htmlFor: id }, box, " " + row.text));
      out.refresh = (T) => { box.checked = Boolean(T[row.key]); };
    }

    if (row.kind === "col") {                      // a colour pill: a button that opens the colour pop-out. Nothing is typed in it; the pop-out has the HEX field.
      const pill = this.colour_pill(id, "Choose a colour");
      pill.onclick = () => this.pop_open(this.colour_of_row(row), pill);
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), pill);
      out.refresh = (T) => pill.show(T[row.key] || (row.or ? row.or(T) : [0, 0, 0, 1]));
    }

    if (row.kind === "txt") {
      const field = el("input", { type: "text", id });      // on the label's line, from the controls' column on (Okay, 13 Oct 2026; under the label, full width, before)
      field.oninput = () => set(field.value);
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), field);
      out.refresh = (T) => { if (!active(field)) field.value = T[row.key]; };
    }

    if (row.kind === "custom") this["row_" + row.name](wrap, out);
    tied();
    return out;
  }

  // ── the colour pop-out ───────────────────────────────────
  //   One for the whole tool (Okay, 12 Oct 2026). A swatch opens it at its right; it edits that swatch's setting:
  //   a scope and a key, so with a ring's colour open, selecting another ring shows that ring's colour.
  //   Top to bottom: this dial's colours · the palette (ten to start, + adds the colour in hand, − takes it out;
  //   kept by this browser, not by the dial) · the field of one hue and the hues, sized for a finger ·
  //   one line: RGB / CMYK / HEX, the values, COPY. Its head drags it; the square widens it over the preview.

  build_pop() {
    const P = this.pop = { at: null, hsv: [0, 0, 0], used: "", mode: "", wide: false };
    try { this.palette = JSON.parse(localStorage.getItem(PALETTE_KEY)); } catch (e) { /* not kept */ }
    if (!Array.isArray(this.palette)) this.palette = PALETTE.slice();
    this.colour_mode = "HEX";
    const put = (rgb) => P.at.write(rgb.map((v) => +clamp(v, 0, 1).toFixed(4)).concat([P.at.read()[3] ?? 1]));
    P.put = put;
    P.pick = (hex) => put(from_hex(hex).slice(0, 3));
    P.title = el("h2");
    const wide = el("button", { type: "button", className: "sign", id: "pop-wide", title: "Twice the size, and back", ariaLabel: "Twice the size, and back", onclick: () => this.pop_wide(!P.wide) });
    wide.innerHTML = icon(TOOL_ICONS.wide);
    const shut = el("button", { type: "button", className: "sign", id: "pop-close", title: "Close", ariaLabel: "Close", onclick: () => this.pop_close() });
    shut.innerHTML = icon(SIGNS.cross);
    const head = el("header", { title: "Drag to move" }, P.title, wide, shut);
    P.used_chips = el("span", { className: "chips", id: "pop-used" });
    P.palette_chips = el("span", { className: "chips", id: "pop-palette" });
    P.field = el("div", { className: "sv", title: "Across: how strong. Down: how dark." }, el("i"));
    P.hues = el("div", { className: "hue", title: "Hue" }, el("i"));
    drag_in(P.field, (x, y) => { P.hsv = [P.hsv[0], x, 1 - y]; put(hsv_rgb(P.hsv)); });
    drag_in(P.hues, (x) => { P.hsv = [x * 360, P.hsv[1], P.hsv[2]]; put(hsv_rgb(P.hsv)); });
    // how see-through: a strip from nothing to the full colour, and the same as a percentage. Rings only.
    const see_through = (a) => P.at.write(P.at.read().slice(0, 3).concat([+clamp(a, 0, 1).toFixed(2)]));
    P.alpha = el("div", { className: "alpha", title: "Opacity" }, el("i"));
    drag_in(P.alpha, (x) => see_through(x));
    P.alpha_field = el("input", { type: "text", inputMode: "numeric", id: "pop-alpha", ariaLabel: "Opacity, %", title: "Opacity, %" });
    P.alpha_field.onchange = () => { const v = parseFloat(P.alpha_field.value); if (Number.isFinite(v)) see_through(v / 100); P.alpha_field.value = `${Math.round((P.at.read()[3] ?? 1) * 100)}%`; };
    P.alpha_row = el("div", { className: "alpharow" }, P.alpha, P.alpha_field);
    P.dot = el("i", { className: "dot" });
    P.modes = el("span", { className: "segs" });
    for (const mode of ["RGB", "CMYK", "HEX"]) P.modes.append(el("button", { type: "button", textContent: mode, id: "pop-as-" + mode, onclick: () => { this.colour_mode = mode; this.pop_refresh(); } }));
    P.numbers = el("span", { className: "numbers" });
    P.copy = el("button", { type: "button", className: "btn copy", id: "pop-copy", textContent: "COPY", title: "Copy the values shown", onclick: async () => {
      try { await navigator.clipboard.writeText(this.pop_text()); P.copy.textContent = "COPIED"; } catch (e) { P.copy.textContent = "NO"; }
      setTimeout(() => { P.copy.textContent = "COPY"; }, 1200);
    } });
    P.el = el("div", { className: "colourpop night", id: "colour-pop", hidden: true },
      head,
      el("div", { className: "chiprow" }, el("span", { className: "quiet", textContent: "On this dial" }), P.used_chips),
      el("div", { className: "chiprow" }, el("span", { className: "quiet", textContent: "Palette" }), P.palette_chips),
      P.field, P.hues, P.alpha_row, el("div", { className: "asnumbers" }, P.modes, P.dot, P.numbers, P.copy));
    P.el.setAttribute("role", "dialog");
    P.el.onkeydown = (e) => { if (e.key === "Escape") { const swatch = P.at && P.at.swatch; this.pop_close(); if (swatch) swatch.focus(); } };
    // the head drags it (not when it is wide, and not on a phone, where it is a sheet)
    head.onpointerdown = (e) => {
      if (e.target.closest("button") || this.pop_is_sheet()) return;
      e.preventDefault();
      head.setPointerCapture(e.pointerId);
      const r = P.el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      head.onpointermove = (ev) => this.pop_place(ev.clientX - dx, ev.clientY - dy);
      head.onpointerup = head.onpointercancel = () => { head.onpointermove = null; };
    };
    return P.el;
  }

  pop_is_sheet() { return matchMedia("(max-width: 860px)").matches; }

  /** put its top left corner there, kept inside the window. */
  pop_place(x, y) {
    const P = this.pop, r = P.el.getBoundingClientRect();
    if (this.pop_is_sheet()) { P.el.style.left = P.el.style.top = ""; return; }      // a sheet stands where the stylesheet puts it
    P.el.style.left = `${clamp(x, 0, Math.max(0, innerWidth - r.width))}px`;
    P.el.style.top = `${clamp(y, 0, Math.max(0, innerHeight - r.height))}px`;
  }

  /** a colour pill: one small button — a swatch and the hex in monospace (Okay, 12 Oct 2026: "all sleek"). It only
   *  opens the pop-out, on every device. While the pop-out is open for it, it is black. show(rgba) fills it. */
  colour_pill(id, title) {
    const dot = el("i", { className: "dot" }), hex = el("span", { className: "hex", id: id + "-hex" });
    const pill = el("button", { type: "button", className: "colour", id, title }, dot, hex);
    pill.setAttribute("aria-expanded", "false");
    pill.show = (c) => { paint(dot, c); hex.textContent = to_hex(c).toUpperCase(); };
    return pill;
  }

  /** a row's colour, as the pop-out wants it: read it, write it, say whose it is ("Numerals · Colour", "Plate").
   *  It follows the scope, so with a ring's colour open, selecting another ring shows that ring's. */
  colour_of_row(row) {
    return {
      alpha: row.scope === "ring" || row.scope === "hand",      // rings (Okay, 12 Oct 2026) and hands (#163, 14 Oct 2026) can be see-through
      read: () => { const T = this.target(row.scope); return T ? T[row.key] || (row.or ? row.or(T) : null) : null; },
      write: (value) => this.set_value(row.scope, row.key, value),
      label: () => {
        const S = this.S, scope = row.scope;
        const whose = scope === "ring" ? this.ring().name || G.kind_of(this.ring()) : scope === "hand" ? ["Hour hand", "Minute hand", "Seconds hand"][S.ui_hand] : scope === "window" ? `Window ${S.ui_window + 1}` : "";
        return whose ? `${whose} · ${row.text}` : row.text;
      },
    };
  }

  /** a swatch was pressed: open beside it; pressed again: close. colour = {read(), write(rgba), label()}.
   *  beside = what it opens at the right of: the swatch, or the row of swatches it is in, so its neighbours stay in reach. */
  pop_open(colour, swatch, beside = swatch) {
    const P = this.pop;
    if (P.at && P.at.swatch === swatch) return this.pop_close();
    if (P.at) P.at.swatch.setAttribute("aria-expanded", "false");
    P.at = { ...colour, swatch };
    swatch.setAttribute("aria-expanded", "true");
    P.el.hidden = false;
    this.pop_wide(false);
    this.sync_rows();
    this.pop_place(beside.getBoundingClientRect().right + POP_GAP, swatch.getBoundingClientRect().top - POP_GAP);
  }

  pop_close() {
    const P = this.pop;
    if (!P || !P.at) return;
    const swatch = P.at.swatch;
    P.at = null;
    P.el.hidden = true;
    swatch.setAttribute("aria-expanded", "false");
  }

  /** twice its size (Okay, 12 Oct 2026: "size of popup grows ×2"), or back. Twice as wide; the field of one hue takes
   *  the added height, so the whole is twice as high. Never larger than the window. On a phone it is a sheet: wide,
   *  it is the whole screen, and the stylesheet does it. */
  pop_wide(on) {
    const P = this.pop;
    if (on === P.wide) return;
    const r = P.el.getBoundingClientRect(), field = P.field.getBoundingClientRect().height;
    P.wide = on;
    P.el.classList.toggle("wide", on);
    $("#pop-wide").setAttribute("aria-pressed", String(on));
    if (on && !this.pop_is_sheet()) {
      P.el.style.width = `${Math.min(2 * r.width, innerWidth)}px`;
      P.field.style.height = `${field}px`;
      const rest = P.el.getBoundingClientRect().height - field;      // everything but the field, at the new width (the chips grew)
      P.field.style.height = `${Math.max(field, Math.min(2 * r.height, innerHeight) - rest)}px`;
    } else P.el.style.width = P.field.style.height = "";
    if (!P.el.hidden) this.pop_place(r.left, r.top);          // where it was, moved only as far as the window asks
  }
  /** the window changed size: a sheet is placed by the stylesheet; anything else stays inside the window. */
  pop_cover() {
    const P = this.pop;
    if (!P.at) return;
    if (this.pop_is_sheet()) { P.el.style.width = P.field.style.height = ""; }
    const r = P.el.getBoundingClientRect();
    this.pop_place(r.left, r.top);
  }

  /** the values as the line shows them, to copy: #RRGGBB · 255, 128, 0 · 0, 50, 100, 0 */
  pop_text() {
    const rgb = this.pop.at.read().slice(0, 3), mode = this.colour_mode;
    return mode === "HEX" ? to_hex(rgb).toUpperCase() : (mode === "RGB" ? rgb.map((v) => Math.round(v * 255)) : rgb_cmyk(rgb).map((v) => Math.round(v * 100))).join(", ");
  }

  /** the pop-out shows the setting it edits. */
  pop_refresh() {
    const P = this.pop;
    if (!P || !P.at) return;
    const S = this.S, colour = P.at.swatch.isConnected ? P.at.read() : null;
    if (!Array.isArray(colour)) return this.pop_close();      // its swatch is gone (another section, a ring deleted)
    const rgb = colour.slice(0, 3), value = to_hex(rgb).toUpperCase();
    P.title.textContent = P.at.label();
    const put = (c) => P.pick(c);
    const chip = (c) => { const b = el("button", { type: "button", title: c, ariaLabel: c, onclick: () => put(c) }); b.style.background = c; b.dataset.colour = c; return b; };
    // this dial's colours: every part that has one, each colour once
    const all = [S.c_plate, S.c_backdrop, S.c_cap, ...S.rings.flatMap((r) => [r.c, ...Object.values(r.cs || {})]), ...G.HANDS.map((h) => S["ha_" + h].c), ...G.windows_of(S).filter((w) => w.on).map((w) => w.ink)];
    const used = [...new Set(all.map((c) => to_hex(c).toUpperCase()))];
    if (P.used !== used.join()) { P.used = used.join(); P.used_chips.replaceChildren(...used.map(chip)); }
    // the palette, then its + (or −, when the colour in hand is already in it)
    const kept = this.palette.includes(value), list = this.palette.join() + kept;
    if (P.listed !== list) {
      P.listed = list;
      const change = el("button", { type: "button", className: "add", id: "pop-add", textContent: kept ? "−" : "+", title: kept ? "Take this colour out of the palette" : "Add this colour to the palette", onclick: () => {
        const now = to_hex(P.at.read()).toUpperCase();
        this.palette = this.palette.includes(now) ? this.palette.filter((c) => c !== now) : [...this.palette, now];
        try { localStorage.setItem(PALETTE_KEY, JSON.stringify(this.palette)); } catch (e) { /* not kept */ }
        this.pop_refresh();
      } });
      P.palette_chips.replaceChildren(...this.palette.map(chip), change);
    }
    for (const b of P.el.querySelectorAll(".chips button[data-colour]")) b.classList.toggle("on", b.dataset.colour === value);
    // the field and the hues. Grey has no hue and black no strength: keep the ones last chosen.
    const fresh = rgb_hsv(rgb);
    if (to_hex(hsv_rgb(P.hsv)).toUpperCase() !== value) P.hsv = [fresh[1] > 0 && fresh[2] > 0 ? fresh[0] : P.hsv[0], fresh[2] > 0 ? fresh[1] : P.hsv[1], fresh[2]];
    const knob = P.field.firstChild;
    P.field.style.setProperty("--hue", `hsl(${P.hsv[0]} 100% 50%)`);
    knob.style.left = `${P.hsv[1] * 100}%`; knob.style.top = `${(1 - P.hsv[2]) * 100}%`;
    knob.style.background = value;
    P.hues.firstChild.style.left = `${P.hsv[0] / 360 * 100}%`;
    P.hues.firstChild.style.background = `hsl(${P.hsv[0]} 100% 50%)`;
    const a = colour[3] ?? 1;
    P.alpha_row.hidden = !P.at.alpha;
    P.alpha.style.setProperty("--solid", value);
    P.alpha.firstChild.style.left = `${a * 100}%`;
    if (!has_focus(P.alpha_field)) P.alpha_field.value = `${Math.round(a * 100)}%`;
    paint(P.dot, P.at.alpha ? colour : rgb);
    // the line: the same colour as numbers
    const mode = this.colour_mode;
    [...P.modes.children].forEach((b) => b.classList.toggle("on", b.textContent === mode));
    if (P.mode !== mode) {
      P.mode = mode;
      P.numbers.dataset.mode = mode;
      const commit = () => {
        const fields = [...P.numbers.querySelectorAll("input")];
        if (mode === "HEX") { const hex = parse_hex(fields[0].value); if (hex) P.pick(hex); else this.pop_refresh(); return; }
        const all = fields.map((x) => parseFloat(x.value) || 0);
        const next = mode === "RGB" ? all.map((v) => v / 255) : cmyk_rgb(all.map((v) => v / 100));
        P.put(next);
        this.pop_refresh();
      };
      P.numbers.replaceChildren(...(mode === "HEX" ? ["hex"] : [...mode]).map((letter, i) => {
        const f = el("input", { type: "text", inputMode: mode === "HEX" ? "text" : "numeric", ariaLabel: letter, id: "pop-" + letter, spellcheck: false, onchange: commit });
        f.dataset.i = i;
        return f;
      }));
    }
    const values = mode === "HEX" ? [value] : mode === "RGB" ? rgb.map((v) => Math.round(v * 255)) : rgb_cmyk(rgb).map((v) => Math.round(v * 100));
    for (const f of P.numbers.querySelectorAll("input")) if (!has_focus(f)) f.value = values[f.dataset.i];
  }

  // ── rows built by hand ───────────────────────────────────

  // ── colours in lists: small swatches, each opening the pop-out ──

  /** a setting changed outside set_value (a colour in a list): show it. shapes = the dial's shapes changed too. */
  changed(shapes = false) {
    if (shapes) this.static_dirty = true;
    this.sync_rows();
    this.render();
  }

  /** a band's sectors as colours: [{id, title, read, write}], one per position it uses. */
  sector_colours(i) {
    const ring = this.S.rings[i], name = ring.name || G.kind_of(ring);
    return G.positions_of(ring).map((at, n) => ({
      id: `ring-${i}-sector-${at}`, title: `${name} · sector ${n + 1}`, alpha: true,
      read: () => { const R = this.S.rings[i]; return R ? G.sector_colour(R, at) : null; },
      write: (value) => { const R = this.S.rings[i]; R.cs = { ...R.cs, [at]: value }; this.changed(true); },
    }));
  }

  /** lines of swatches inside a holder: lines() → [{text, colours: [{id, title, read, write}]}]. Built again only
   *  when the list itself changes (a ring added, renamed, a sector more), so an open pop-out keeps its swatch. */
  swatch_lines(holder, lines) {
    const list = lines(), signature = JSON.stringify(list.map((l) => [l.text, l.colours.map((c) => c.id)]));
    if (holder.dataset.list !== signature) {
      holder.dataset.list = signature;
      holder.replaceChildren(...list.map((line) => {
        const group = el("span", { className: line.colours.length === 1 ? "single" : "swatches" });
        for (const c of line.colours) {
          // one colour: a pill with its hex, like a colour row. Many (a band's sectors): squares.
          const swatch = line.colours.length === 1 ? this.colour_pill("colour-" + c.id, c.title) : el("button", { type: "button", className: "swatch", id: "colour-" + c.id, title: c.title });
          swatch.onclick = () => this.pop_open({ read: c.read, write: c.write, label: () => c.title, alpha: Boolean(c.alpha) }, swatch, group);
          group.append(swatch);
        }
        return el("div", { className: "row" }, el("label", { textContent: line.text }), group);
      }));
    }
    const all = list.flatMap((l) => l.colours);
    [...holder.querySelectorAll("button.colour, button.swatch")].forEach((swatch, k) => {
      const c = all[k].read();
      if (swatch.show) swatch.show(c); else paint(swatch, c);
    });
  }

  /** Dial → Colours: every coloured part on the plate. Rings top first, a band's sectors one by one; hands, cap, windows. */
  row_colours(wrap, out) {
    wrap.className = "colourlist";
    const one = (id, title, read, write, alpha = false) => [{ id, title, read, write, alpha }];
    out.refresh = () => this.swatch_lines(wrap, () => {
      const S = this.S, lines = [];
      S.rings.forEach((ring, i) => {
        const text = ring.name || G.kind_of(ring), sectors = G.kind_of(ring) === "band" && G.positions_of(ring).length > 1;
        lines.push({ text, colours: sectors ? this.sector_colours(i) : one(`ring-${i}`, text, () => (this.S.rings[i] || {}).c, (v) => { this.S.rings[i].c = v; this.changed(); }, true) });
      });
      G.HANDS.forEach((h, k) => { const text = ["Hour hand", "Minute hand", "Seconds hand"][k]; lines.push({ text, colours: one("hand-" + h, text, () => this.S["ha_" + h].c, (v) => { this.S["ha_" + h].c = v; this.changed(); }) }); });
      lines.push({ text: "Cap", colours: one("cap", "Cap", () => this.S.c_cap, (v) => { this.S.c_cap = v; this.changed(); }) });
      G.windows_of(S).forEach((w, k) => { if (w.on) lines.push({ text: `Window ${k + 1}`, colours: one("window-" + k, `Window ${k + 1}`, () => G.windows_of(this.S)[k].ink, (v) => { G.windows_of(this.S)[k].ink = v; this.changed(); }) }); });
      return lines;
    });
  }

  /** Rings → Sector colours (a band with more than one sector): a swatch per sector, and all back to the ring's colour. */
  row_sectors(wrap, out) {
    wrap.className = "colourlist";
    const lines = el("div"), same = el("button", { type: "button", className: "btn", id: "sectors-same", textContent: "All as the ring", title: "Every sector in the ring’s colour again", onclick: () => this.set_value("ring", "cs", {}) });
    wrap.append(lines, el("div", { className: "row" }, el("span"), el("span", { className: "tools" }, same)));
    out.refresh = () => this.swatch_lines(lines, () => [{ text: "Sectors", colours: this.sector_colours(this.S.ui_ring) }]);
  }

  /** Windows, on top: four cards, 12 · 3 · 6 · 9, starting on the second column. A card is a small dial with its window
   *  drawn where it is: filled when it is shown, an outline when it isn't. They are tabs: a press chooses the window
   *  the panes below are about. A window not in use yet goes to its card's place when its card is first pressed. */
  row_window_cards(wrap, out) {
    wrap.className = "windowcards";
    const grid = el("div", { className: "cards", role: "tablist", ariaLabel: "Which window" });
    const cards = WINDOW_CARDS.map((c) => {
      const pic = el("span", { className: "pic" });       // the card is its picture alone: a small dial with the window in its place, filled when the window is shown (Okay, 13 Oct 2026: no number under it)
      const b = el("button", { type: "button", className: "tab", id: "window-card-" + c.slot, onclick: () => {
        const w = G.windows_of(this.S)[c.slot];
        this.S.ui_window = c.slot;
        if (!w.on && w.at === G.WINDOW_BASE.at && c.at !== w.at) { w.at = c.at; this.static_dirty = true; }      // never used: it starts at its card's place
        this.sync_rows();
        this.render();
      } }, pic);
      b.setAttribute("role", "tab");
      grid.append(el("div", { className: "card" }, b));
      return { ...c, b, pic, drawn: "" };
    });
    wrap.append(grid);
    out.refresh = (S) => {
      for (const c of cards) {
        const w = G.windows_of(S)[c.slot], at = !w.on && w.at === G.WINDOW_BASE.at ? c.at : w.at;      // never used: shown at its card's place, where it will start
        const used = w.on || w.at !== G.WINDOW_BASE.at || w.at_deg != null;
        const place = used ? G.window_place(w) : G.DATE_AT[at][0], angle = used ? G.window_angle(w) : G.DATE_AT[at][1], a = angle * Math.PI / 180;
        const state = `${angle}/${Boolean(w.on)}`;
        if (c.drawn !== state) {
          c.drawn = state;
          c.pic.innerHTML = card_pic(angle, w.on);
          c.b.title = `The window at ${place}${w.on ? "" : " (not shown)"}`;
        }
        c.b.classList.toggle("on", c.slot === S.ui_window);
        c.b.classList.toggle("off", !w.on);
        c.b.setAttribute("aria-selected", String(c.slot === S.ui_window));
      }
    };
  }

  /** a window's shape as picture tiles: rectangle · circle · polygon · arch · arc. What is stored is the place in
   *  G.WINDOW_SHAPES; 0, "as its kind", shows as the shape that kind has had all along. */
  row_window_shape(wrap, out) {
    wrap.className = "row pick";
    const group = el("span", { className: "picks five", role: "radiogroup", ariaLabel: "Shape" });
    const names = G.WINDOW_SHAPES.slice(1);
    names.forEach((name, i) => {
      const tile = el("button", { type: "button", className: "pickt", id: `window-shape-${name}`, title: name, onclick: () => this.set_value("window", "shape", i + 1) });
      tile.setAttribute("role", "radio");
      tile.innerHTML = pic(PICS.hole[i]);
      tile.append(el("span", { textContent: name }));
      group.append(tile);
    });
    wrap.append(group);                            // no label: the pane's heading says Shape, and five tiles need all six columns for their words
    out.refresh = (T) => [...group.children].forEach((b, i) => { const on = names[i] === G.window_shape(T); b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); });
  }

  /** Hands, on top and always in view: Hour · Minute · Seconds, as tabs for the panes below. */
  row_hand_tabs(wrap, out) {
    wrap.className = "tabsbar";
    const tabs = el("span", { className: "segs", role: "tablist", ariaLabel: "Which hand" });
    ["Hour", "Minute", "Seconds"].forEach((name, i) => {
      const b = el("button", { type: "button", className: "tab", id: "hand-tab-" + i, textContent: name, onclick: () => this.set_value("global", "ui_hand", i) });
      b.setAttribute("role", "tab");
      tabs.append(b);
    });
    wrap.append(tabs);
    out.refresh = (S) => [...tabs.children].forEach((b, i) => { b.classList.toggle("on", i === S.ui_hand); b.setAttribute("aria-selected", String(i === S.ui_hand)); });
  }

  /** Hands, always in view, one line (Okay, 12 Oct 2026): the name, a tick to show the hands, how they move. */
  row_hands_bar(wrap, out) {
    wrap.className = "handsbar";
    const tick = el("input", { type: "checkbox", id: "global-ha-on-Show-hands" });
    tick.onchange = () => this.set_value("global", "ha_on", tick.checked);
    const motion = el("select", { id: "global-ha-beat-Motion", title: "How the seconds hand moves", ariaLabel: "Motion" });
    G.BEATS.forEach((b, i) => motion.append(el("option", { value: i, textContent: b[0] })));
    motion.onchange = () => this.set_value("global", "ha_beat", +motion.value);
    wrap.append(el("h2", { textContent: "All hands" }), el("label", { className: "check", htmlFor: tick.id }, tick, " Show hands"), motion);
    out.refresh = (S) => { tick.checked = Boolean(S.ha_on); motion.value = S.ha_beat; };
  }

  /** the plate's background: only the button for now (Okay, 12 Oct 2026: "no background image functionality now. Just the button"). */
  row_background(wrap) {
    const note = el("span", { className: "quiet", hidden: true, textContent: "Not built yet." });
    wrap.append(el("label", { textContent: "Background" }),
      el("span", { className: "tools" }, el("button", { type: "button", className: "btn", id: "background-add", textContent: "Add image…", onclick: () => { note.hidden = false; } }), note));
  }


  /** the ring list: order = stacking order, top ring first. Its tools are on the pane's heading line (head_ring_tools). */
  row_ring_list(wrap, out) {
    wrap.className = "ringlist";
    this.ring_list = el("ol");
    this.ring_list.onscroll = () => this.value_pop_close();      // the pop-up hangs where the ring line was
    wrap.append(this.ring_list);
    this.fill_ring_list();
  }

  /** the list's tools, on the heading line: a plus that opens the four kinds (add one above the selected ring),
   *  then what you can do to the selected ring. All five are the same outlined circle (Okay, 13 Oct 2026). */
  head_ring_tools() {
    const menu = el("div", { className: "addmenu", id: "add-menu", hidden: true });
    menu.setAttribute("role", "menu");
    const plus = el("button", { type: "button", className: "sign", id: "ring-add", title: "Add a ring", ariaLabel: "Add a ring" });
    plus.innerHTML = round_sign(SIGNS.plus);
    plus.setAttribute("aria-haspopup", "menu");
    const open = (on) => { menu.hidden = !on; plus.setAttribute("aria-expanded", String(on)); };
    this.add_open = open;
    plus.onclick = () => open(menu.hidden);
    G.KINDS.forEach((kind, i) => {
      const b = el("button", { type: "button", id: "add-" + kind, onclick: () => { open(false); this.ring_tool("add", kind); } });
      b.innerHTML = PICS.kind(i, 24);
      b.append(el("span", { textContent: kind[0].toUpperCase() + kind.slice(1) }));
      b.setAttribute("role", "menuitem");
      menu.append(b);
    });
    const tools = el("span", { className: "headtools signs" }, el("span", { className: "adder" }, plus, menu));
    tools.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); plus.focus(); } };
    for (const [action, title] of [["up", "Move up"], ["down", "Move down"], ["duplicate", "Duplicate"], ["delete", "Delete"]]) {
      const b = el("button", { type: "button", className: "sign", id: "ring-" + action, title, ariaLabel: title, onclick: () => this.ring_tool(action) });
      b.innerHTML = round_sign(TOOL_ICONS[action]);
      tools.append(b);
    }
    open(false);
    return tools;
  }

  /** the selected ring's line (Okay's design, 13 Oct 2026): a framed line in the list, right under the selected
   *  ring's row, its buttons starting where the names start — four kinds, pictures only · its colour · how big one
   *  of its things is and its radius, two round value buttons. All one height. No words: a tag says what a button
   *  is while the pointer is on it (data-tip). The frame has the colour of the selected ring's guide, like the row
   *  above it, on white. */
  row_ring_line(wrap, out) {
    wrap.className = "ringline";
    const kinds = el("span", { className: "kinds", role: "radiogroup", ariaLabel: "Kind" });
    G.KINDS.forEach((kind, i) => {
      const b = el("button", { type: "button", id: `ring-kind-Kind-${i}`, ariaLabel: kind, onclick: () => this.set_value("ring", "kind", i) });
      b.setAttribute("role", "radio");
      b.dataset.tip = kind[0].toUpperCase() + kind.slice(1);
      b.innerHTML = PICS.kind(i, 24);
      kinds.append(b);
    });
    const colour = this.colour_pill("ring-c-Colour", "");
    colour.classList.add("bare");                  // the swatch alone: no hex
    colour.dataset.tip = colour.ariaLabel = "Colour";
    colour.onclick = () => this.pop_open(this.colour_of_row({ scope: "ring", key: "c", text: "Colour" }), colour);
    const size = this.value_button("ring-size", () => size_row(this.ring()), VALUE_PICS.size);
    const radius = this.value_button("ring-r", () => radius_row(this.ring()), VALUE_PICS.radius);
    wrap.append(kinds, colour, size.el, radius.el);
    this.ring_line_holder = el("li", { className: "lineholder" }, wrap);      // it lives in the list (place_ring_line), not among the pane's rows
    out.el = el("span", { className: "nothing" });
    out.refresh = (R) => {
      [...kinds.children].forEach((b, i) => { b.classList.toggle("on", i === R.kind); b.setAttribute("aria-checked", String(i === R.kind)); });
      colour.show(R.c);
      size.refresh();
      radius.refresh();
    };
  }

  // ── a value as a button ──────────────────────────────────
  //   A number as a small round drawing (Okay, 13 Oct 2026; first: a ring's radius and size). A click pops up a
  //   small square at its corner, the field ready to type in; pressing and moving the pointer changes the value
  //   without opening anything (right or up: more; Shift: ten times finer); a press outside puts the pop-up away.
  //   The value itself is read in the ring's row above, and in the tag.
  //   row() says which number row it stands for right now.

  value_button(id, row, drawing) {
    const b = el("button", { type: "button", className: "valueb", id });
    b.innerHTML = `<svg viewBox="0 0 36 36" aria-hidden="true">${drawing}</svg>`;
    const T = () => this.target(row().scope);
    const refresh = () => {                        // no number in it (Okay, 13 Oct 2026): the ring's row, right above, says it; so does the tag
      const r = row(), v = T()[r.key] ?? 0, text = String(parseFloat(this.in_unit(v, decimals(r.step))));
      b.dataset.tip = label_of(r, T());
      b.dataset.value = text;
      b.ariaLabel = `${label_of(r, T())} ${text} ${this.unit()[0]}`;
    };
    let press = null;
    b.onpointerdown = (e) => { press = { x: e.clientX, y: e.clientY, v: T()[row().key], moved: false }; b.setPointerCapture(e.pointerId); };
    b.onpointermove = (e) => {
      if (!press) return;
      const d = (e.clientX - press.x) - (e.clientY - press.y);      // right or up: more
      if (!press.moved && Math.abs(d) < 4) return;
      if (!press.moved) { press.moved = true; this.value_pop_close(); this.tag_hide(); b.classList.add("dragging"); }
      const r = row(), step = r.step * (e.shiftKey ? 0.1 : 1);
      this.set_value(r.scope, r.key, +Math.max(press.v + Math.round(d / 2) * step, r.lo).toFixed(6));       // two screen points a step
    };
    b.onpointerup = b.onpointercancel = () => { const was = press; press = null; b.classList.remove("dragging"); if (was && !was.moved) this.value_pop_open(b, row()); };
    b.onclick = (e) => { if (!e.detail && !this.value_pop) this.value_pop_open(b, row()); };      // the keyboard (Enter, Space) opens it too
    return { el: b, refresh };
  }

  /** the tag: what a wordless button is, said under it while the pointer or the keyboard is on it. One for the whole
   *  tool, laid over everything, so a list that scrolls can't cut it off. A value button's tag is as wide as the
   *  pop-up it grows into on a click (value_pop_open): its name at the left, its value at the right. */
  tag_show(target) {
    if (!this.tag) { this.tag = el("div", { className: "tag", id: "tag", hidden: true }); document.body.append(this.tag); }
    if (target.getAttribute("aria-expanded") === "true") return this.tag_hide();       // its pop-up is open under it: the tag would lie on it
    const value = target.classList.contains("valueb");
    this.tag.classList.toggle("value", value);
    if (value) this.tag.replaceChildren(el("span", { textContent: target.dataset.tip }), el("span", { className: "figure", textContent: target.dataset.value }));
    else this.tag.textContent = target.dataset.tip;
    this.tag.hidden = false;
    this.tag_place(this.tag, target);
  }
  tag_hide() { if (this.tag) this.tag.hidden = true; }
  /** under a button, centred on it (kept inside the window), its point on the button's middle. */
  tag_place(box, target) {
    const at = target.getBoundingClientRect(), half = box.offsetWidth / 2, x = clamp(at.left + at.width / 2, half + 4, innerWidth - half - 4);
    box.style.left = `${x}px`;
    box.style.top = `${at.bottom + 7}px`;
    box.style.setProperty("--point", `${at.left + at.width / 2 - x}px`);
  }

  /** a value button's pop-up is its tag, grown (Okay, 13 Oct 2026: "do it out of our tooltip. consistent width,
   *  closed/open, height grows on click"): the same box under the button, the same width, now holding the number's
   *  row — its name (for a numeral's radius with the menu beside it), the field ready to type in, − +. Enter,
   *  Escape or a press outside closes it. */
  value_pop_open(button, row) {
    if (this.value_pop && this.value_pop.button === button) return this.value_pop_close();
    this.value_pop_close();
    const closed = this.tag && !this.tag.hidden ? this.tag.offsetHeight : 0;      // as high as the tag it grows from
    this.tag_hide();
    const r = this.build_row(row), box = el("div", { className: "tag value valuepop", id: "value-pop" }, r.el);
    document.body.append(box);
    button.setAttribute("aria-expanded", "true");
    this.value_pop = { button, box, r };
    r.refresh(this.target(row.scope));
    this.tag_place(box, button);
    if (box.animate && closed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      box.classList.add("growing");
      const grow = box.animate([{ height: `${closed}px` }, { height: `${box.offsetHeight}px` }], { duration: 120, easing: "ease-out" });
      grow.onfinish = grow.oncancel = () => box.classList.remove("growing");
    }
    const field = box.querySelector('input[type="text"]');
    box.onkeydown = (e) => {
      if (!(e.key === "Escape" || (e.key === "Enter" && e.target === field))) return;
      e.preventDefault();                          // or the same key press would go on to the button and open it again
      this.value_pop_close();                      // (what was typed is taken as the field goes)
      button.focus();
    };
    field.focus(); field.select();
  }
  value_pop_close() {
    if (!this.value_pop) return;
    const { button, box } = this.value_pop;
    this.value_pop = null;
    const field = box.querySelector('input[type="text"]');
    if (document.activeElement === field) field.blur();      // what was typed is taken before the field goes
    box.remove();
    button.setAttribute("aria-expanded", "false");
  }

  /** a ring's row says what the ring is, in the ring drawer's own order (Okay, 13 Oct 2026): its kind (with how many
   *  it draws) · its colour · how big one of its things is · its radius. Each of the last three stands over the
   *  drawer's button for it, so the row is the read-out and the drawer under it the controls. "How big" is what you
   *  would name first for its kind: a tick's or marker's length (a dot's Ø), a numeral's size, a band's width.
   *  Lengths in the unit box's unit, without trailing zeros. → {kind, size, r} as text */
  ring_summary(ring) {
    const kind = G.kind_of(ring), len = (mm) => String(parseFloat(this.in_unit(mm, 2)));
    const one = kind === "numerals" ? ring.size : kind === "band" ? ring.width : G.SHAPES[ring.shape] === "dot" ? ring.w : ring.len;
    return { kind: `${G.positions_of(ring).length} ${kind}`, size: len(one), r: len(ring.r) };
  }

  /** the summaries follow every change without the list being built again (a name may be being typed in it). */
  sync_ring_summaries() {
    if (!this.ring_list) return;
    // the selected row has the colour of the selected ring's guide on the dial (Okay, 13 Oct 2026): the same thing,
    // marked the same way in both places. No such guide (None): the light blue of before.
    const k = G.ring_guide(this.S, this.S.ui_ring);     // the selected ring's own guide colour (none, or guides for rings off: the light blue)
    const wrap = this.ring_list.closest(".pane"), guide = k !== null && (this.S.gd_rings || this.S.gd_sel) ? G.GUIDE_COLOURS[k] : null;      // on the pane: the ring's row and the ring drawer both take it
    wrap.classList.toggle("guided", Boolean(guide));
    if (guide) wrap.style.setProperty("--guide", guide); else wrap.style.removeProperty("--guide");
    this.place_ring_line();
    this.ring_rows().forEach((li, i) => {
      const ring = this.S.rings[i];
      if (!ring) return;
      const says = this.ring_summary(ring);
      for (const part of ["kind", "size", "r"]) { const cell = li.querySelector(".says-" + part); if (cell && cell.textContent !== says[part]) cell.textContent = says[part]; }
      const chip = li.querySelector(".dot.tiny");
      if (chip) paint(chip, ring.c);
    });
  }

  /** one row per ring: eye (show or hide it on the dial) · grip · name, with the rename box right beside it (selected
   *  ring only, not while it is hidden, and not when the line is too full) · its kind · its colour · its size · its
   *  radius (ring_summary). A click on the selected ring's name renames it; a click anywhere else on a row selects it. */
  fill_ring_list() {
    if (!this.ring_list) return;
    this.ring_list.replaceChildren();
    this.S.rings.forEach((ring, i) => {
      const selected = i === this.S.ui_ring;
      const show = el("button", { type: "button", className: "eye", title: ring.on ? "Hide this ring" : "Show this ring", ariaLabel: `Show ${ring.name}`, onclick: (e) => { e.stopPropagation(); this.show_ring(i, !ring.on); } });      // the eye only shows or hides: the selection stays, so the ring line doesn't move and the next eye stays under the pointer (#183)
      show.setAttribute("aria-pressed", String(ring.on));
      show.innerHTML = eye(ring.on);
      const grip = el("span", { className: "grip", title: "Drag to change the order" });
      grip.innerHTML = icon(TOOL_ICONS.grip);
      grip.onpointerdown = (e) => this.drag_ring(e, i);
      const name = el("span", { className: "name", textContent: ring.name || G.kind_of(ring) });
      const cell = el("span", { className: "namecell" }, name);       // the name and, right beside it, the rename box
      const item = el("li", { className: "ring" + (selected ? " on" : "") + (ring.on ? "" : " off") }, show, grip, cell);
      let rename = null;
      if (selected && ring.on) {                   // the selected ring is renamed by a click on its name, or on the box beside it (Okay, 13 Oct 2026)
        const start = (e) => { e.stopPropagation(); this.rename_ring(i, item, cell); };
        rename = el("button", { type: "button", className: "rename", title: "Rename this ring", ariaLabel: "Rename this ring", onclick: start });
        rename.innerHTML = icon(TOOL_ICONS.rename, 18);
        cell.append(rename);
        name.classList.add("renames");
        name.title = "Rename this ring";
        name.onclick = start;
      }
      const says = this.ring_summary(ring), chip = el("i", { className: "dot tiny", title: "Its colour" });
      paint(chip, ring.c);
      item.append(el("span", { className: "quiet kind says-kind", textContent: says.kind, title: "How many, and of what kind" }), el("span", { className: "says chipcell" }, ...(selected ? [] : [chip])),      // the selected ring's colour is the drawer's button, right under
        el("span", { className: "quiet says says-size", textContent: says.size, title: "How big one is" }), el("span", { className: "quiet says says-r", textContent: says.r, title: "Radius" }));
      item.onclick = () => { if (!item.querySelector("input")) this.select_ring(i); };
      this.ring_list.append(item);
      if (rename && name.scrollWidth > name.clientWidth) rename.hidden = true;       // no room: the box goes, the name keeps its letters (and still renames)
    });
    this.place_ring_line();
  }

  /** the rings' rows in the list, top first (the list also holds the ring line, which is not one of them). */
  ring_rows() { return this.ring_list ? [...this.ring_list.children].filter((li) => li.classList.contains("ring")) : []; }

  /** show or hide ring i on the dial without selecting it (the eye's job; a click on the row selects). */
  show_ring(i, on) {
    const ring = this.S.rings[i];
    if (!ring || ring.on === on) return;
    ring.on = on;
    this.static_dirty = true;
    this.fill_ring_list();
    this.sync_rows();
    this.render();
  }

  /** the ring line stands in the list, right under the selected ring's row (Okay's design, 13 Oct 2026). */
  place_ring_line() {
    const row = this.ring_rows()[this.S.ui_ring], holder = this.ring_line_holder;
    if (row && holder && (holder.previousElementSibling !== row || !holder.isConnected)) row.after(holder);
  }

  /** the name becomes a field: Enter or a click elsewhere keeps it, Esc puts the old name back. */
  rename_ring(i, item, name) {                     // name: what the field stands in for (the name's cell)
    const ring = this.S.rings[i], before = ring.name;
    const field = el("input", { type: "text", value: ring.name, className: "name", ariaLabel: "Ring name" });
    let done = false;
    const end = (keep) => {
      if (done) return;
      done = true;
      ring.name = keep ? field.value.trim() || before : before;
      this.fill_ring_list(); this.sync_rows(); this.autosave();
    };
    field.oninput = () => { ring.name = field.value; this.sync_rows(); };
    field.onblur = () => end(true);
    field.onkeydown = (e) => { if (e.key === "Enter") end(true); if (e.key === "Escape") end(false); };
    name.replaceWith(field);
    item.classList.add("renaming");
    field.focus(); field.select();
  }

  /** drag a ring by its grip to another place in the list. The list's order is the stacking order:
   *  the top row is drawn last, in front. A line shows where the ring will land. */
  drag_ring(e, from) {
    e.preventDefault();
    const list = this.ring_list, rows = this.ring_rows(), grip = e.currentTarget;
    const line = el("div", { className: "dropline" });
    list.append(line);
    rows[from].classList.add("dragged");
    grip.setPointerCapture(e.pointerId);
    let to = from;
    const move = (ev) => {                         // the gap nearest the pointer: 0 = above the first row
      const box = list.getBoundingClientRect(), y = ev.clientY - box.top + list.scrollTop;
      let gap = rows.findIndex((row) => y < row.offsetTop + row.offsetHeight / 2);      // the list is the rows' frame of reference
      if (gap < 0) gap = rows.length;
      to = gap > from ? gap - 1 : gap;               // where the ring ends up once it is taken out
      const at = gap < rows.length ? rows[gap].offsetTop : rows[rows.length - 1].offsetTop + rows[rows.length - 1].offsetHeight;
      line.style.top = `${Math.max(at - 1, 0)}px`;
      line.hidden = to === from;
    };
    const drop = () => {
      grip.onpointermove = grip.onpointerup = grip.onpointercancel = null;
      line.remove();
      rows[from].classList.remove("dragged");
      if (to === from) return this.select_ring(from);
      const rings = this.S.rings, [ring] = rings.splice(from, 1);
      rings.splice(to, 0, ring);
      this.S.ui_ring = to;
      this.static_dirty = true;
      this.fill_ring_list();
      this.sync_rows();
      this.render();
    };
    grip.onpointermove = move;
    grip.onpointerup = drop;
    grip.onpointercancel = () => { to = from; drop(); };
    move(e);
  }

  select_ring(i, refill = true) {
    if (i === this.S.ui_ring && !refill) return;
    this.value_pop_close();                        // it was about the ring that was selected
    this.S.ui_ring = clamp(i, 0, this.S.rings.length - 1);
    if (refill) this.fill_ring_list();
    else { this.ring_rows().forEach((li, k) => li.classList.toggle("on", k === this.S.ui_ring)); this.place_ring_line(); }
    this.sync_rows();
    this.render();
  }

  ring_tool(action, kind) {
    const rings = this.S.rings, i = this.S.ui_ring;
    if (action === "add") {
      rings.splice(i, 0, G.new_ring(kind, this.S, kind === "numerals" ? rings.find((r) => G.kind_of(r) === "numerals") : null));
    } else if (action === "duplicate") {
      const copy = JSON.parse(JSON.stringify(rings[i]));
      copy.name += " copy";
      rings.splice(i, 0, copy);
    } else if (action === "delete") {
      if (rings.length === 1) return this.log("A dial keeps at least one ring: hide it instead.");
      rings.splice(i, 1);
      this.S.ui_ring = Math.min(i, rings.length - 1);
    } else {
      const j = i + (action === "up" ? -1 : 1);
      if (j < 0 || j >= rings.length) return;
      [rings[i], rings[j]] = [rings[j], rings[i]];
      this.S.ui_ring = j;
    }
    this.static_dirty = true;
    this.fill_ring_list();
    this.sync_rows();
    this.render();
  }

  /** one click for round ends: both corner radii to half the mark's width or more. */
  row_round_ends(wrap) {
    wrap.className = "row";
    const both = (radius) => () => {
      const R = this.ring();
      R.round_out = R.round_in = radius(R);
      this.static_dirty = true; this.sync_rows(); this.render();
    };
    wrap.append(el("span"), el("span", { className: "tools" },
      el("button", { type: "button", className: "btn", textContent: "Round both ends", onclick: both((R) => Math.max(+(R.w / 2).toFixed(2), 0.01)) }),
      el("button", { type: "button", className: "btn", textContent: "Square", onclick: both(() => 0) })));
  }

  /** a correction for one numeral: radius ±, angle ±, rotate, size ×. Click a numeral in the preview to pick it. */
  row_nudge(wrap, out) {
    wrap.className = "nudge";
    const pick = el("select", { id: "nudge-pick" });
    pick.onchange = () => { this.nudge_at = pick.value; this.sync_rows(); };
    const fields = {};
    const line = (key, text, step, neutral) => {
      const f = el("input", { type: "text", id: "nudge-" + key, inputMode: "decimal" });
      f.onchange = () => {
        const R = this.ring(), n = { ...(R.nudge[this.nudge_at] || {}) };
        const per = key === "dr" ? this.unit()[2] : 1;      // the radius ± is a length: typed in the chosen unit, kept in mm
        const v = parse_number(f.value, (n[key] ?? neutral) * per) / per;
        if (Math.abs(v - neutral) < 1e-9) delete n[key]; else n[key] = +v.toFixed(4);
        const all = { ...R.nudge };
        if (Object.keys(n).length) all[this.nudge_at] = n; else delete all[this.nudge_at];
        this.set_value("ring", "nudge", all);
      };
      fields[key] = [f, step, neutral];
      return el("div", { className: "row txt" }, el("label", { htmlFor: "nudge-" + key, textContent: text }), f);
    };
    wrap.append(el("div", { className: "row pop" }, el("label", { htmlFor: "nudge-pick", textContent: "Numeral" }), pick),
      line("dr", "Radius ±", 0.05, 0), line("da", "Angle ± °", 0.1, 0), line("rot", "Rotate °", 1, 0), line("s", "Size ×", 0.01, 1),
      el("div", { className: "row" }, el("span"), el("button", { type: "button", className: "btn", textContent: "Reset this numeral", onclick: () => {
        const all = { ...this.ring().nudge };
        delete all[this.nudge_at];
        this.set_value("ring", "nudge", all);
      } })));
    out.refresh = (R) => {
      const labels = G.ring_labels(R);
      if (+this.nudge_at >= labels.length) this.nudge_at = "0";
      const want = labels.map((l, i) => `${i + 1} · ${l || "—"}${R.nudge[String(i)] ? "  •" : ""}`).join("|");
      if (pick.dataset.items !== want) {
        pick.replaceChildren(...labels.map((l, i) => el("option", { value: String(i), textContent: `${i + 1} · ${l || "—"}${R.nudge[String(i)] ? "  •" : ""}` })));
        pick.dataset.items = want;
      }
      pick.value = this.nudge_at;
      const n = R.nudge[this.nudge_at] || {};
      for (const key in fields) { const [f, step, neutral] = fields[key]; if (document.activeElement !== f) f.value = key === "dr" ? this.in_unit(n[key] ?? neutral, decimals(step / 10)) : fmt(n[key] ?? neutral, step / 10); }
    };
  }

  // ── fonts: the Type group shows the ring's font; the list of all fonts is a sheet of its own ──

  /** family → its fonts, in the catalogue's order. */
  families() {
    const by = new Map();
    for (const f of this.catalog.values()) { if (!by.has(f.family)) by.set(f.family, []); by.get(f.family).push(f); }
    return by;
  }

  /** "1234567890" in the font itself: the outline made with the list, or drawn now, or set by the browser.
   *  what = "name": the family's name in its own face instead, likewise. */
  sample(f, what = "sample", fits = what === "name") {
    const box = el("span", { className: what === "name" ? "face" : "sample" });
    // preview: in a font box the numerals are followed by letters, A to g (Okay, 13 Oct 2026)
    // …and an ellipsis after the g (Okay, 13 Oct 2026): the font's own, or three full stops where it has none (Routed Gothic)
    const t = G.has_font(f.ps) ? { ...G.RING_BASE, ps: f.ps, axes: f.start || {}, features: {}, tracking: 0, lang: 0 } : null;
    const text = what === "name" ? f.family : what === "preview" ? "1234567890 Abcdefg" + (t && G.has_chars("…", t) ? "…" : "...") : "1234567890", high = what === "name" ? 16 : 20;
    let s = what === "preview" ? (t ? null : f.sample) : f[what];
    if (!s && t) {
      s = { d: G.text_path(text, t, 1000).svg(0, true), w: Math.round(G.advance(text, t, 1000)) };
    }
    // the law of the name column: a name wider than its column is drawn smaller to fit, down to NAME_LEAST of its size,
    // then cut. Numerals keep their size: what doesn't fit is cut at their column's right edge (Okay, 13 Oct 2026).
    // The picture is taller than the em (from 1000 over the baseline to 250 under it), so tall figures are never cut above.
    const wide = s ? Math.ceil(s.w / 1000 * high) : 0, tall = Math.round(high * 1.25);
    if (s && s.d) box.innerHTML = `<svg viewBox="0 -1000 ${s.w} 1250" width="${wide}" height="${tall}"${fits ? ` style="min-width:${Math.ceil(wide * NAME_LEAST)}px"` : ""} aria-hidden="true"><path d="${s.d}" fill="currentColor"/></svg>`;
    else { box.textContent = text; box.style.fontFamily = `"${f.family}"`; }       // an installed font: the browser can show it
    return box;
  }

  /** what a family has, for the font sheet's last column, as small stickers in the pixel font (Okay, 13 Oct 2026):
   *  → [[word, kind]…]. The kind gives the sticker its colour (the legend under the list says which is which).
   *  Short words, spelled out in the legend: "w. 100–900", "tab", "2 ss". */
  family_says(fonts) {
    const styles = fonts.map((f) => f.style || ""), first = fonts[0];
    // a font of the tool's own list says its axes there, [least, most] each; a loaded one is asked
    const ranges = first.axes || (G.has_font(first.ps) ? Object.fromEntries(Object.entries(G.font_axes(G.font_of({ ps: first.ps, axes: {} }))).map(([tag, x]) => [tag, [x.min, x.max]])) : {});
    const axes = Object.keys(ranges);
    const said = [];
    if (axes.includes("wght")) said.push([`w. ${Math.round(ranges.wght[0])}–${Math.round(ranges.wght[1])}`, "weight"]);      // the range it can take (Okay, 13 Oct 2026)
    else if (styles.some((x) => /bold|black|heavy/i.test(x))) said.push(["bold", "weight"]);
    if (axes.includes("ital") || axes.includes("slnt") || styles.some((x) => /italic|oblique/i.test(x))) said.push(["italic", "italic"]);
    for (const tag of axes) if (!["wght", "ital", "slnt"].includes(tag)) said.push([AXIS_WORDS[tag] || tag, { wdth: "width", opsz: "optical" }[tag] || "other"]);
    // what it can do to numerals (Okay, 13 Oct 2026: "open type features related to numbers as stickers. Not just axes"),
    // then its numbered sets and variants: one colour, two stickers at most
    const tags = first.features || (G.has_font(first.ps) ? G.font_features(G.font_of({ ps: first.ps, axes: {} })).map(([tag]) => tag) : []);
    for (const [tag, word] of FIGURE_WORDS) if (tags.includes(tag)) said.push([word, "figure"]);
    const sets = tags.filter((tag) => /^ss\d\d$/.test(tag)).length, variants = tags.filter((tag) => /^cv\d\d$/.test(tag)).length;
    if (sets) said.push([`${sets} ss`, "sets"]);
    if (variants) said.push([`${variants} cv`, "sets"]);
    if (fonts.length > 1) said.push([`${fonts.length} st`, "styles"]);
    return said;
  }

  /** whose font the font sheet and the style buttons set: the selected ring's, or the selected window's. */
  font_holder() { return this.font_scope === "window" ? this.window() : this.ring(); }
  /** …and the type that holder draws with: a window without a font of its own draws with the top numerals ring's. */
  font_shown() { const T = this.font_holder(); return this.font_scope === "window" ? G.window_type(this.S, T) : T; }

  /** a font, in a white box of three lines with hairlines between (Okay, 13 Oct 2026): its numerals · its name, with
   *  the language (a ring's only: two letters, a list under them) and Change… at the right · its styles as buttons
   *  · its tracking (a ring's only).
   *  The numerals and Change… both open the font sheet. */
  row_font(wrap, out) {
    wrap.className = "font";
    const scope = out.row.scope, own = scope === "window";       // a window's font row: the same, with a way back to the numerals' font
    const pre = own ? "window-" : "";
    const choose = (act) => { this.font_scope = scope; return act(); };
    const open = () => choose(() => this.open_picker());
    const current = el("button", { type: "button", className: "fontrow current", id: pre + "font-current", title: "Choose a font", onclick: open });
    const name = el("span", { className: "name", id: pre + "font-name" });
    // a window has tracking and a language of its own too (Okay, 13 Oct 2026); unset, they are the numerals'
    const numerals = () => G.window_type(this.S, {});
    const lang = own ? this.lang_box("window", "window-", () => numerals().lang) : this.lang_box();
    // the text's colour, small, beside the font's name (Okay, 13 Oct 2026: "text get their color swatch, small. Next to name"):
    // a window's text colour (unset: its frame's) · a numerals ring's colour
    const crow = own ? { key: "text_c", scope: "window", text: "Text", or: (T) => T.ink } : { key: "c", scope: "ring", text: "Colour" };
    const swatch = this.colour_pill(pre + "font-c", "The text’s colour");
    swatch.classList.add("mini");
    swatch.onclick = () => this.pop_open(this.colour_of_row(crow), swatch);
    const tracking = this.build_row(own ? { ...num("tracking", "Tracking", -200, 800, 5), scope: "window", or: () => numerals().tracking } : { ...num("tracking", "Tracking", -200, 800, 5), scope: "ring" });      // the box's last line
    const named = el("div", { className: "fontname", onclick: (e) => { if (!e.target.closest(".colour, .langs, button")) open(); } }, name, ...(lang ? [lang.el] : []), swatch, el("button", { type: "button", className: "btn", id: pre + "font-change", textContent: "Change…", onclick: open }));
    const styles = el("div", { className: "segs styles" });
    const state = el("div", { className: "quiet note", id: pre + "font-note" });
    const back = el("button", { type: "button", className: "btn", id: "window-font-back", innerHTML: icon(SIGNS.copy) + "<span>Copy style of <i>Numerals</i></span>", title: "Use the top numerals ring’s font again", hidden: true,
      onclick: () => { const w = this.window(); w.family = ""; w.ps = ""; w.axes = {}; w.features = null; w.tracking = null; w.lang = null; this.changed(true); } });
    // every font box has all of it (Okay, 13 Oct 2026): numerals and letters · name, colour · styles, language · size ·
    // tracking · the variable axes · the OpenType features. The last can be put away.
    // size · tracking · the variable axes, one under the other without a heading (Okay's drawing, 13 Oct 2026)
    const size = this.build_row(own ? { ...num("size", "Size %", 20, 100, 1), scope: "window" } : { ...num("size", "Size", 0.3, 8, 0.05), scope: "ring" });      // a window's text is sized in % of its height
    const axes = this.axes_part(pre, own);
    const features = this.box_part("font/features", "OpenType features", this.features_part(pre, own), true);
    wrap.append(el("div", { className: "fontbox" }, current, named, styles, size.el, tracking.el, axes.el, features.el), ...(own ? [back] : []), state);
    let shown = null;
    out.refresh = (T) => {
      const R = own ? G.window_type(this.S, T) : T;
      back.hidden = !(own && (T.ps || T.tracking != null || T.lang != null || T.features != null || Object.keys(T.axes || {}).length));
      if (own) back.querySelector("i").textContent = numerals().name || "Numerals";      // the top numerals ring, by its name as it is written (Okay, 14 Oct 2026: "Copy style of Numerals")
      if (lang) lang.refresh(T);
      size.refresh(T);
      tracking.refresh(T);
      axes.el.hidden = !axes.refresh(R, T);
      features.refresh(R, T);
      swatch.show(T[crow.key] || (crow.or ? crow.or(T) : [0, 0, 0, 1]));
      const mine = this.families().get(R.family) || [], f = this.catalog.get(R.ps) || mine[0];
      const key = R.ps + "/" + G.has_font(R.ps) + "/" + Boolean(T.ps);
      if (key !== shown) {
        shown = key;
        current.replaceChildren(f ? this.sample(f, "preview") : el("span", { className: "sample quiet", textContent: "not loaded" }));
        name.textContent = R.family;                // a window without a font of its own shows the numerals' font, plainly (Okay, 13 Oct 2026: no "· as the numerals" after it)
      }
      styles.hidden = mine.length < 2;             // the family's styles, as buttons
      styles.replaceChildren(...mine.map((x) => {
        const b = el("button", { type: "button", textContent: x.style || x.ps, onclick: () => choose(() => this.use_font(x)) });
        b.classList.toggle("on", x.ps === R.ps);
        return b;
      }));
      const missing = G.has_font(R.ps) ? "" : this.catalog.has(R.ps) ? "Loading… "
        : `${R.family} isn’t loaded yet, so ${G.font_list()[0].family} stands in. Press Change… to choose another or to add it. `;
      state.textContent = missing + (this.font_note || "");
      if (this.picker && this.picker.open) this.fill_picker();
    };
  }

  /** the chosen hand in detail: a box of its own, at the left of the hand's rows (on a phone: over them, the hand lying). */
  row_hand_detail(wrap, out) {
    wrap.className = "detail";
    wrap.id = "hand-detail";
    let drawn = "";
    out.refresh = (T) => { const now = hand_detail(T); if (now !== drawn) { drawn = now; wrap.innerHTML = now; } };
  }

  /** a window's place (Okay, 13 Oct 2026): every named place is a button, so the others are seen and pressed — first
   *  the four quarters, a square of 3 · 6 · 9 · 12; a white bar; then the places between; and a last box, three dots,
   *  that opens the tag with a field for any time ("2:15"). The window keeps the place in the list (at, R9), or the
   *  time's angle (at_deg) when it has one of its own. */
  row_window_at(wrap, out) {
    wrap.className = "row windowat";
    const at = (name) => G.DATE_AT.findIndex((d) => d[0] === name);
    const press = (i) => { const w = this.window(); w.at = i; w.at_deg = null; this.changed(true); };
    const button = (name) => el("button", { type: "button", id: "window-at-Position-" + at(name), textContent: name, onclick: () => press(at(name)) });
    const quarters = ["3", "6", "9", "12"].map(button), between = ["1:30", "4:30", "7:30", "10:30", "4"].map(button);      // the half-hours together, then the rest (Okay, 13 Oct 2026: ":30s together")
    const more = el("button", { type: "button", className: "atmore", id: "window-at-more", textContent: "···", title: "Any time: 2:15, 7:40…" });
    more.setAttribute("aria-expanded", "false");
    more.onclick = () => this.value_pop_open(more, { kind: "custom", name: "at_time", scope: "window", key: "at_deg", text: "Time" });
    wrap.append(el("label", { textContent: "Position" }),
      el("span", { className: "atgrid" }, el("span", { className: "segs quarters" }, ...quarters), el("i", { className: "divide" }), el("span", { className: "segs between" }, ...between, more)));
    out.refresh = (T) => {
      for (const b of [...quarters, ...between]) b.classList.toggle("on", T.at_deg == null && b.id === "window-at-Position-" + T.at);
      more.classList.toggle("on", T.at_deg != null);
      more.textContent = T.at_deg != null ? G.window_place(T) : "···";
    };
  }

  /** inside the tag that the three dots open: the window's place as a time, typed. "2:15", "2.25" and "14:15" all
   *  say a quarter past two; a named place typed here ("4:30") is that place. */
  row_at_time(wrap, out) {
    wrap.className = "row txt";
    const field = el("input", { type: "text", id: "window-at-time", inputMode: "numeric", placeholder: "2:15" });
    const take = () => {
      const m = field.value.trim().match(/^(\d{1,2})(?:[:.,h ](\d{1,2}))?$/), w = this.window();
      if (!m || +m[1] > 24 || +(m[2] || 0) > 59) { field.value = G.window_place(w); return; }
      const dot = /[.,]/.test(field.value) && m[2] !== undefined;      // 2.25: a quarter of an hour, not 25 minutes
      const deg = ((+m[1] % 12) + (dot ? +("0." + m[2]) : +(m[2] || 0) / 60)) * 30, named = G.DATE_AT.findIndex((d) => Math.abs(d[1] - deg) < 0.01);
      if (named >= 0) { w.at = named; w.at_deg = null; } else w.at_deg = deg;
      this.changed(true);
    };
    field.onchange = take;
    wrap.append(el("label", { htmlFor: "window-at-time", textContent: "Time" }), field);
    out.refresh = (T) => { if (document.activeElement !== field) field.value = G.window_place(T); };
  }

  /** the language the numerals are set in (a font may draw a figure differently for one): a small button saying its
   *  two letters; a press opens the list (Okay, 13 Oct 2026). The ring keeps the place in G.LANGS (R9). */
  lang_box(scope = "ring", pre = "", or = null) {
    const menu = el("div", { className: "unitmenu langmenu", id: pre + "lang-menu", hidden: true });
    menu.setAttribute("role", "menu");
    const button = el("button", { type: "button", className: "btn langbox", id: pre + "lang" });
    button.setAttribute("aria-haspopup", "menu");
    const open = (on) => { menu.hidden = !on; button.setAttribute("aria-expanded", String(on)); };
    (this.lang_opens = this.lang_opens || []).push(open);
    button.onclick = () => open(menu.hidden);
    const items = G.LANGS.map((code, i) => {
      const b = el("button", { type: "button", id: pre + "lang-" + code, onclick: () => { open(false); this.set_value(scope, "lang", i); } },
        el("span", { textContent: LANG_NAMES[code] || code }), el("span", { className: "quiet", textContent: lang_short(code) }));
      b.setAttribute("role", "menuitemradio");
      menu.append(b);
      return b;
    });
    const box = el("div", { className: "langs" }, button, menu);
    box.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); button.focus(); } };
    open(false);
    const refresh = (T) => {
      const R = { lang: T.lang ?? (or ? or(T) : 0) };
      const code = G.LANGS[R.lang] || G.LANGS[0];
      button.textContent = lang_short(code);
      button.title = "Language: " + (LANG_NAMES[code] || code);
      items.forEach((b, i) => { b.classList.toggle("on", i === (R.lang || 0)); b.setAttribute("aria-checked", String(i === (R.lang || 0))); });
    };
    return { el: box, refresh };
  }

  /** the font sheet: every font with its numerals — the tool's own twenty, then yours, then (Chrome, Edge)
   *  this computer's — and the ways to add more. It lies over the panel, so the dial stays in view. */
  build_picker() {
    // Find: a field with a magnifier, no words in it (Okay, 13 Oct 2026)
    const find = el("input", { type: "search", id: "font-find", ariaLabel: "Find a font", title: "Find a font" });
    find.oninput = () => this.fill_picker(true);
    const finder = el("span", { className: "find" }, find);
    finder.insertAdjacentHTML("beforeend", icon(TOOL_ICONS.find));
    const list = el("div", { className: "fontlist", id: "font-list" });
    // the list's own scrollbar, drawn by the tool (an iPad shows its own only while the list moves): a light pill the
    // whole height, a darker one as long as the share of the list in view, where that share is (Okay, 13 Oct 2026)
    const rail = el("span", { className: "rail", ariaHidden: "true" }, el("i"));
    this.rail = rail;
    list.addEventListener("scroll", () => this.rail_place(), { passive: true });
    rail.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const thumb = rail.firstChild, r = rail.getBoundingClientRect(), t = thumb.getBoundingClientRect();
      const span = list.scrollHeight - list.clientHeight, room = r.height - t.height;
      const grab = e.target === thumb ? e.clientY - t.top : t.height / 2;
      const go = (y) => { list.scrollTop = room > 0 ? Math.min(1, Math.max(0, (y - r.top - grab) / room)) * span : 0; };
      if (e.target !== thumb) go(e.clientY);
      rail.setPointerCapture(e.pointerId);
      rail.classList.add("held");
      rail.onpointermove = (m) => go(m.clientY);
      rail.onpointerup = rail.onpointercancel = () => { rail.onpointermove = rail.onpointerup = rail.onpointercancel = null; rail.classList.remove("held"); };
    });
    // the legend: folded to one button beside the squares; open, it stands over them and pushes the list up
    const legend = el("dl", { className: "legend", id: "font-legend", hidden: true }, el("div", { className: "legendhead" }, "Variable font axes and", el("br"), "OpenType abbreviations"), ...STICKER_LEGEND.flatMap(([word, kind, says, code]) => [el("dt", {}, el("span", { className: "sticker " + kind, textContent: word })), el("dd", {}, ...no_orphan(says, code))]));
    const legend_button = el("button", { type: "button", className: "pickt legendbutton", id: "font-legend-open", title: "What the stickers mean" });
    legend_button.innerHTML = icon(SIGNS.up) + "<span>Legend<br><small>(OpenType abbr.)</small></span>";      // a second line like its brothers (Okay, 14 Oct 2026)
    legend_button.setAttribute("aria-expanded", "false");
    this.legend_fit = () => {      // the window grows upwards as far as the font list's top, then scrolls (Okay, 14 Oct 2026)
      if (legend.hidden) return;
      const room = legend.parentElement.getBoundingClientRect().top - list.getBoundingClientRect().top - parseFloat(getComputedStyle(legend).marginBottom || 0);
      legend.style.maxHeight = Math.max(0, Math.floor(room - parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit")))) + "px";
    };
    legend_button.onclick = () => {
      legend.hidden = !legend.hidden;
      this.legend_fit();
      legend_button.setAttribute("aria-expanded", String(!legend.hidden));
      requestAnimationFrame(() => this.rail_place());
    };
    const paste = el("input", { type: "text", id: "font-link", placeholder: "Google Fonts link or family name, or a link to a font file" });
    const add = () => { if (paste.value.trim()) this.add_from_text(paste.value).then((ok) => { if (ok) paste.value = ""; }); };
    paste.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } };
    paste.hidden = true;
    const file = el("input", { type: "file", accept: ".ttf,.otf,.ttc,.otc", multiple: true, hidden: true, id: "font-file" });
    file.onchange = async () => { await this.add_font_files([...file.files]); file.value = ""; };
    // no Done button (Okay, 13 Oct 2026): a press beside the sheet, or Escape, puts it away. Adding fonts: a field
    // for a link or a name, and three square buttons.
    const square = (id, word, title, d, act, o = {}) => { const b = el("button", { type: "button", className: "pickt", id, title, onclick: act, ...o }); const [what, takes] = word.split(" ("); b.innerHTML = icon(d) + `<span>${what}${takes ? `<br><small>(${takes}</small>` : ""}</span>`; return b; };      // the second line, light: what it takes (Okay, 13 Oct 2026)
    this.picker = el("dialog", { className: "picker", id: "font-picker" },
      el("header", {}, el("h2", { textContent: "Fonts" }), finder),      // the search stands at the sheet's top right
      el("div", { className: "listwrap" }, list, rail),
      el("div", { className: "adding" },
        paste,
        el("div", { className: "quiet note", id: "picker-note" }),
        legend,
        el("div", { className: "squares" },
          // the ways to add a font, in the first two of the sheet's three columns, sharing them equally: Installed first when
          // the browser can read this computer's fonts (Chrome, Edge), then a link, then a file (Okay, 14 Oct 2026)
          el("div", { className: "adds" + ("queryLocalFonts" in window ? " three" : "") },
            square("local-fonts", "Installed", "The fonts installed on this computer", TOOL_ICONS.screen, () => this.local_fonts(true), { hidden: !("queryLocalFonts" in window) }),
            square("font-add", "Add font link (gfonts, url)", "A font by its Google Fonts link or name, or by a link to a font file", SIGNS.plus, () => { if (paste.hidden) { paste.hidden = false; paste.focus(); } else if (paste.value.trim()) add(); else paste.focus(); }),      // the field for the link is out of sight until this is pressed (Okay, 13 Oct 2026)
            square("font-file-open", "Add font file (woff, ttf, otf)", "A font file from this computer: .ttf · .otf · .woff", SIGNS.sheet, () => file.click())),
          file, legend_button)));
    this.picker.tabIndex = -1;
    window.addEventListener("resize", () => { if (this.picker.open) { this.rail_place(); this.legend_fit(); } });
    this.picker.addEventListener("click", (e) => { if (e.target === this.picker) this.picker.close(); });      // a click outside closes it
    // the legend's window closes at a press anywhere outside it (but its own button, which toggles it) (Okay, 14 Oct 2026)
    this.picker.addEventListener("pointerdown", (e) => { if (!legend.hidden && !e.target.closest("#font-legend, #font-legend-open")) legend_button.click(); });
    return this.picker;
  }

  open_picker() {
    $("#font-find").value = "";
    if (!this.picker.open) {
      this.picker.showModal();
      this.picker.focus();                         // not the search field: it waits for a press (on an iPad the keyboard would come up at once; Okay, 13 Oct 2026)
    }
    this.fill_picker(true);                        // after it is open: the stickers' column is measured on the page
    this.load_remembered();
  }

  fill_picker(again = false) {
    const list = $("#font-list"), R = this.font_shown(), by = this.families(), q = $("#font-find").value.trim().toLowerCase();
    const regular = (fonts) => fonts.find((f) => /^(regular|roman|book|normal)$/i.test(f.style)) || fonts[0];
    const key = [...by.keys()].join("|") + "/" + q + "/" + G.font_list().length;
    if (again || list.dataset.shown !== key) {     // the list itself changes only when fonts arrive or the search does
      list.dataset.shown = key;
      list.replaceChildren();
      let group = null;
      for (const [family, fonts] of by) {
        if (q && !family.toLowerCase().includes(q)) continue;
        const f = regular(fonts);
        if (f.group !== group) {
          group = f.group;
          const title = { added: "Added by you", computer: "On this computer" }[group];
          if (title) list.append(el("div", { className: "group quiet", textContent: title }));
        }
        // a line of the sheet (Okay, 13 Oct 2026): the family's name in its own face · its numerals · what it has
        const named = this.sample(fonts.find((x) => x.name) || f, "name");
        named.classList.add("name");
        named.setAttribute("aria-label", family);
        const row = el("button", { type: "button", className: "fontrow", title: f.what ? `${family} · ${f.what}` : family, onclick: () => { this.font_note = ""; this.use_font(f); } },
          named, this.sample(f), el("span", { className: "has" }, ...this.family_says(fonts).map(([word, kind]) => el("span", { className: "sticker " + kind, textContent: word }))));
        row.dataset.family = family;
        row.dataset.group = f.group;
        list.append(row);
      }
      // the stickers' column is as wide as the Find field above it and starts under its left edge (Okay, 13 Oct 2026):
      // the stylesheet sets it (--font-has); the numerals are cut at its edge
      const on = list.querySelector(`.fontrow[data-family="${CSS.escape(R.family)}"]`);
      if (on && again) list.scrollTop = Math.max(0, on.offsetTop - list.offsetTop - 80);
    }
    for (const row of list.querySelectorAll(".fontrow")) row.classList.toggle("on", row.dataset.family === R.family);
    $("#picker-note").textContent = this.font_note || "";
    requestAnimationFrame(() => this.rail_place());
  }

  /** the font list's scrollbar: the dark pill's length is the share of the list in view, its place where that share is;
   *  no scrollbar when everything is in view. */
  rail_place() {
    const list = $("#font-list"), rail = this.rail;
    if (!list || !rail) return;
    const span = list.scrollHeight - list.clientHeight;
    rail.hidden = span <= 1;
    if (rail.hidden) return;
    const h = rail.clientHeight, thumb = Math.max(h * list.clientHeight / list.scrollHeight, 3 * parseFloat(getComputedStyle(rail).width));
    rail.firstChild.style.height = thumb + "px";
    rail.firstChild.style.translate = `0 ${(h - thumb) * list.scrollTop / span}px`;
  }

  /** whose type a font box sets, and what an unset part of it is: a ring's own · a window's, which follows the top
   *  numerals ring wherever it has nothing of its own. → {scope, base_axis(T, tag, a), base_feature(T, tag)} */
  font_side(own) {
    const numerals = () => G.window_type(this.S, {});
    return own
      ? { scope: "window", base_axis: (T, tag, a) => (T.ps ? a.default : numerals().axes[tag] ?? a.default), base_feature: (T, tag) => (T.ps ? DEFAULT_ON.has(tag) : numerals().features[tag] ?? DEFAULT_ON.has(tag)) }
      : { scope: "ring", base_axis: (T, tag, a) => a.default, base_feature: (T, tag) => DEFAULT_ON.has(tag) };
  }

  /** a variable font's axes, one slider each: a part of every font box (Okay, 13 Oct 2026: "all font boxes get all
   *  font functionality"). Only what differs from where the axis rests is stored. → {el, refresh(R, T)}: R the type
   *  that is drawn, T whose it is. */
  axes_part(pre, own) {
    const wrap = el("div", { className: "axes" }), side = this.font_side(own);
    let shown = null, axes = {};
    const refresh = (R, T) => {
      const font = G.has_font(R.ps) ? G.font_of(R) : null;
      axes = font ? G.font_axes(font) : {};
      const key = R.ps + JSON.stringify(Object.keys(axes));
      if (key !== shown) {
        shown = key;
        wrap.replaceChildren();
        for (const tag in axes) {
          const a = axes[tag], id = pre + "axis-" + tag;
          const slider = el("input", { type: "range", min: a.min, max: a.max, step: (a.max - a.min) / 1000, id: id + "-slider" });
          const field = el("input", { type: "text", id, inputMode: "decimal" });
          const now = () => { const H = this.target(side.scope); return (H.axes || {})[tag] ?? side.base_axis(H, tag, a); };
          const commit = (v) => {
            const H = this.target(side.scope), all = { ...(H.axes || {}) };
            v = clamp(+(+v).toFixed(2), a.min, a.max);
            if (Math.abs(v - side.base_axis(H, tag, a)) < 1e-6) delete all[tag]; else all[tag] = v;
            this.set_value(side.scope, "axes", all);
          };
          slider.oninput = () => commit(slider.value);
          field.onchange = () => commit(parse_number(field.value, now()));
          slider.dataset.tag = field.dataset.tag = tag;
          // the axis is named in the tool's own type, with its code as a sticker of the size and colours the font sheet's
          // have (Okay, 13 Oct 2026: "axes nested here also get ui type"). The name is a button: a press sets the axis
          // back to where the font rests. Axes are not OpenType features.
          const word = { wght: "Weight", wdth: "Width", opsz: "Optical size", ital: "Italic", slnt: "Slant" }[tag] || a.name || tag;
          const kind = { wght: "weight", wdth: "width", opsz: "optical", ital: "italic", slnt: "italic" }[tag] || "other";
          const back = el("button", { type: "button", className: "axisname", id: id + "-back", title: `${a.name} (${tag}), ${a.min}–${a.max}: press to set it back to ${a.default}`, onclick: () => commit(a.default) },
            el("span", { textContent: word }), el("span", { className: "sticker " + kind, textContent: tag }));
          slider.ariaLabel = field.ariaLabel = a.name;
          wrap.append(el("div", { className: "row num" }, el("span", { className: "stickerlabel" }, back), slider, field, el("span")));
        }
      }
      for (const input of wrap.querySelectorAll("input")) {
        const a = axes[input.dataset.tag];
        if (a && document.activeElement !== input) input.value = input.type === "range" ? (R.axes[input.dataset.tag] ?? a.default) : fmt(R.axes[input.dataset.tag] ?? a.default, 0.1);
        if (input.type === "range") filled(input);
      }
      return Object.keys(axes).length > 0;
    };
    return { el: wrap, refresh };
  }

  /** the font's OpenType features, likewise a part of every font box. Only what differs from the font's default is stored (R12). */
  features_part(pre, own) {
    const wrap = el("div", { className: "features" }), side = this.font_side(own);
    let shown = null;
    const refresh = (R, T) => {
      const font = G.has_font(R.ps) ? G.font_of(R) : null;
      const key = font ? font.ps : "";
      if (key !== shown) {
        shown = key;
        wrap.replaceChildren();
        // the switches a designer would use: named by the font, or known by name here, or a stylistic set
        // or character variant. (Fonts also list features their script needs to work at all; those stay on.)
        const plumbing = ["aalt", "ccmp", "locl", "mark", "mkmk", "rvrn"];
        const useful = ([tag, designer]) => !plumbing.includes(tag) && (designer || FEATURE_NAMES[tag] || /^(ss|cv)\d\d$/.test(tag));
        // three groups: features with a name of their own, then the numbered ones — stylistic sets (ss01…),
        // character variants (cv01…) — each under its own small heading (Okay, 11 Oct 2026)
        const groups = [["", []], ["Stylistic sets", []], ["Character variants", []]];
        for (const [tag, designer] of font ? G.font_features(font).filter(useful) : []) {
          // a switch is a tile: its name in the tool's type, and its code as a sticker, of the size and the colours
          // the font sheet's stickers have (Okay, 13 Oct 2026: "back to rectangular grid with ui type… add codes in actual sticker size/form")
          const kind = /^(tnum|pnum|lnum|onum|zero|frac|numr|dnom|afrc|sups|subs|sinf|ordn)$/.test(tag) ? "figure" : /^(ss|cv)\d\d$/.test(tag) ? "sets" : "styles";
          const tile = el("button", { type: "button", className: "tile", id: pre + "feature-" + tag }, el("span", { textContent: designer || FEATURE_NAMES[tag] || tag }), el("span", { className: "sticker " + kind, textContent: tag }));
          tile.dataset.tag = tag;
          tile.onclick = () => {                     // press to switch; only what differs from what it would be anyway is stored (R12)
            const H = this.target(side.scope), on = tile.getAttribute("aria-pressed") !== "true", all = { ...(H.features || {}) };
            if (on === side.base_feature(H, tag)) delete all[tag]; else all[tag] = on;
            this.set_value(side.scope, "features", own && !Object.keys(all).length ? null : all);
          };
          groups[/^ss\d\d$/.test(tag) ? 1 : /^cv\d\d$/.test(tag) ? 2 : 0][1].push(tile);
        }
        // what changes numerals comes first (Okay, 13 Oct 2026), then the rest; each by name
        const figures = (tile) => (tile.querySelector(".sticker.figure") ? 0 : 1);
        groups[0][1].sort((x, y) => figures(x) - figures(y) || x.firstChild.textContent.localeCompare(y.firstChild.textContent));
        for (const [title, tiles] of groups) {
          if (!tiles.length) continue;
          if (title) wrap.append(el("h3", { textContent: title }));
          wrap.append(el("div", { className: "tiles" }, ...tiles));
        }
      }
      for (const tile of wrap.querySelectorAll(".tile")) tile.setAttribute("aria-pressed", String((R.features || {})[tile.dataset.tag] ?? DEFAULT_ON.has(tile.dataset.tag)));
      return font ? (wrap.children.length ? true : "none") : false;      // none: a font without switches — its line says so, no line more
    };
    return { el: wrap, refresh };
  }

  /** a part of a font box that can be put away (Okay, 13 Oct 2026: "show hide within block possible"): a line with its
   *  name, a press folds what is under it. Kept with the panes' folds, one for all font boxes. */
  box_part(name, title, part, shut = false) {
    const head = el("button", { type: "button", className: "partfold", title: "Show or hide this part" });
    let none = false;                              // nothing to show (a font without switches): the line is grey, its sign a sheet with a cross, and it folds nothing
    const set = () => {
      this.is_folded({ fold: name, row: {} });
      const folded = this.folds[name] ?? shut;     // shut: put away until asked for (the OpenType features)
      part.el.hidden = folded || none;
      head.classList.toggle("none", none);
      head.title = none ? `This font has no ${title}` : "Show or hide this part";
      head.setAttribute("aria-expanded", String(!folded && !none));
      const many = part.el.querySelectorAll(".tile").length;      // how many switches the font has, beside the name (Okay, 13 Oct 2026: "How many?")
      head.innerHTML = (none ? icon(NONE_SIGN) : eye(!folded)) + `<span>${title}</span>` + (many ? `<span class="many">${many}</span>` : "");
    };
    head.onclick = () => { if (none) return; this.is_folded({ fold: name, row: {} }); this.folds[name] = !(this.folds[name] ?? shut); try { localStorage.setItem("dial-tool-folds", JSON.stringify(this.folds)); } catch (e) { /* not kept */ } set(); };
    const wrap = el("div", { className: "boxpart" }, head, part.el);
    return { el: wrap, refresh: (R, T) => { const has = part.refresh(R, T); wrap.hidden = !has; none = has === "none"; set(); } };
  }

  /** five dials to start from: each is a link (R31), so it can also be copied or opened in a new tab. */
  /** the gallery: dials drawn after documents (web/gallery.mjs), then the five first examples (web/examples.mjs), three to
   *  a line, each with a line saying what it is. */
  row_gallery(wrap) {
    wrap.className = "examples gallery";
    const grid = el("div", { className: "cards" });
    for (const e of [...GALLERY, ...EXAMPLES.map((x) => ({ ...x, note: `${x.name}: one of the guidebook's classic dials` }))]) {
      const card = el("a", { href: e.link, title: e.note });
      card.innerHTML = e.picture;
      card.append(el("span", { textContent: e.name }));
      grid.append(card);
    }
    wrap.append(grid);
  }

  /** files that stay drawings. The PNG button is on its own row, with its dpi. */
  row_export_pdf(wrap) {
    wrap.className = "row";
    wrap.append(el("label", { textContent: "Vector" }), this.export_button("PDF"));
  }
  row_export_svg(wrap) {                             // under PDF, on the same column
    wrap.className = "row";
    wrap.append(el("span", { className: "blank" }), this.export_button("SVG"));
  }
  row_export_png(wrap) {                             // on the same column as PDF and SVG (Okay, 13 Oct 2026); its settings are the rows under it
    wrap.className = "row";
    wrap.append(el("label", { textContent: "Image" }), this.export_button("PNG"));
  }
  export_button(kind) {
    return el("button", { type: "button", className: "btn main", id: "export-" + kind.toLowerCase(), textContent: kind, title: `Export a ${kind}`, onclick: () => this.export(kind.toLowerCase()) });
  }

  /** under the PNG row: what that dpi comes to. */
  row_png_size(wrap, out) {
    wrap.className = "row note under";                // under: it starts on the buttons' column, not at the left (Okay, 13 Oct 2026)
    const text = el("span", { className: "quiet", id: "png-size" });
    wrap.append(el("span"), text);
    out.refresh = () => { const mm = G.page_mm(this.S), px = Math.round(mm / 25.4 * this.S.out_dpi); text.textContent = `${this.in_unit(mm, 1)} ${this.unit()[0]} at ${Math.round(this.S.out_dpi)} dpi = ${px} × ${px} px`; };
  }

  row_settings(wrap) {
    wrap.className = "row";
    const file = el("input", { type: "file", accept: ".json,application/json", hidden: true, id: "load-file" });
    file.onchange = async () => { if (file.files[0]) this.load_text(await file.files[0].text(), file.files[0].name); file.value = ""; };
    wrap.append(el("span", { className: "tools wide" },
      el("button", { type: "button", className: "btn", id: "save", textContent: "Save…", onclick: () => { const name = file_name(this.S, "json"); save_file(name, JSON.stringify({ ...this.S, ui_section: Math.min(this.S.ui_section, 4) }, null, 1), "application/json"); this.log(`saved ${name} to your downloads`); } }),   // dial.py knows sections 0–4
      el("button", { type: "button", className: "btn", textContent: "Load…", onclick: () => file.click() }),
      el("button", { type: "button", className: "btn", textContent: "Defaults", onclick: () => this.reopen({ ui_section: this.S.ui_section }) }), file));
  }

  /** the dial's link, spelled out, and a button that copies it. */
  row_link(wrap, out) {
    wrap.className = "linkrow";
    this.link_box = el("textarea", { id: "link", className: "link", readOnly: true, rows: 3, spellcheck: false, ariaLabel: "Link to this dial" });
    this.link_box.onfocus = () => this.link_box.select();
    wrap.append(this.link_box, el("div", { className: "tools" },
      el("button", { type: "button", className: "btn", id: "copy-link", textContent: "Copy link", onclick: () => this.copy_link() }),
      el("span", { className: "quiet", id: "link-size" })));
    out.refresh = () => this.show_link();
  }

  async show_link() {
    const link = location.href.split("#")[0] + "#" + await pack(this.S);
    if (this.link_box && this.link_box.isConnected) {
      this.link_box.value = link;
      $("#link-size").textContent = `${link.length} characters · fonts travel by name`;
    }
    return link;
  }

  row_log(wrap, out) {
    wrap.className = "logrow";
    const box = el("pre", { className: "log", id: "log" });
    wrap.append(box);
    out.refresh = () => { box.textContent = this.log_lines.join("\n"); };
  }

  // ── fonts ────────────────────────────────────────────────

  /** fonts are needed before the first numerals are right: load what the settings name, if we may. */
  async fonts_at_start() {
    for (const f of G.font_list()) this.catalog.set(f.ps, { family: f.family, style: f.style, ps: f.ps, group: "list" });   // Inter, inside the page
    for (const f of FONT_LIST) if (!this.catalog.has(f.ps)) this.catalog.set(f.ps, { ...f, group: "list" });               // the tool's own list
    for (const f of this.remembered()) if (!this.catalog.has(f.ps)) this.catalog.set(f.ps, { ...f, group: "added" });      // added from a link, earlier
    await this.load_fonts_in_use();
    try {
      const status = await navigator.permissions.query({ name: "local-fonts" });
      if (status.state === "granted") await this.local_fonts(false);
    } catch (e) { /* this browser has no such permission: fonts come from files */ }
    this.sync_rows();
  }

  /** list the fonts installed on this computer (Chrome and Edge ask once), and load the ones in use. */
  async local_fonts(asked) {
    const say = (text) => { if (asked) this.say_font(text); };
    say("Asking the browser for this computer’s fonts… (it may show a question near the address bar)");
    try {
      const list = await window.queryLocalFonts();
      for (const f of list) {
        if (!this.catalog.has(f.postscriptName)) this.catalog.set(f.postscriptName, { family: f.family, style: f.style, ps: f.postscriptName, data: f, group: "computer" });
      }
      // a browser that isn't allowed answers with an empty list, not with an error
      if (list.length) say(`${list.length} installed fonts are now listed under Family.`);
      else say("The browser gave no fonts: it isn’t allowed to for this page. Click the icon at the left of the address bar → Site settings → Fonts → Allow, reload, and press Installed fonts again. Or use Add font file… (Helvetica Neue is /System/Library/Fonts/HelveticaNeue.ttc).");
      await this.load_fonts_in_use();
    } catch (e) {
      say(`The browser refused to list fonts (${e.name}: ${e.message}). Use Add font file… instead.`);
    }
    this.sync_rows();
  }

  /** read one catalogued font into the text engine. A collection file holds several: find ours. */
  async load_font(entry) {
    if (G.has_font(entry.ps) || !(entry.data || entry.file || entry.url)) return G.has_font(entry.ps);
    let bytes;
    if (entry.file || entry.url) {                 // one of the tool's own, or one added from a link: fetched when first used
      const address = entry.url || FONT_SITE + entry.file;
      const answer = await fetch(address);
      if (!answer.ok) throw new Error(`${answer.status} from ${address}`);
      bytes = new Uint8Array(await answer.arrayBuffer());
    } else bytes = new Uint8Array(await (await entry.data.blob()).arrayBuffer());
    for (let i = 0; i < 64; i++) {
      const got = G.add_font(bytes, i);
      if (!got) break;
      if (got.ps === entry.ps) return true;
    }
    return G.has_font(entry.ps);
  }

  async load_fonts_in_use() {
    let loaded = false;
    for (const ring of [...this.S.rings, ...G.windows_of(this.S).filter((w) => w.ps)]) {      // rings, and windows with a font of their own
      const entry = this.catalog.get(ring.ps);
      try {
        if (entry && !G.has_font(ring.ps)) loaded = (await this.load_font(entry)) || loaded;
      } catch (e) {
        this.font_note = `Couldn’t fetch ${entry.family} (${e.message}). Are you online?`;
        this.log(this.font_note);
      }
    }
    if (loaded) { this.static_dirty = true; this.sync_rows(); this.render(); }
  }

  /** font files chosen or dropped. */
  async add_font_files(files) {
    try {
      const got = [];
      for (const file of files) got.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
      await this.take_fonts(got);
    } catch (e) {
      this.say_font(`Couldn’t read ${files.map((f) => f.name).join(", ")} (${e.name}: ${e.message}).`);
    }
  }

  say_font(text) { this.font_note = text; this.log(text); this.sync_rows(); if (this.picker && this.picker.open) this.fill_picker(); }

  /** fonts that arrived as bytes → the text engine and the list. A source with a url is remembered by this
   *  browser, so the font is there again next time. → how many were added */
  async take_fonts(sources, family = null) {
    const added = [];
    for (const src of sources) {
      for (let i = 0; i < 64; i++) {               // a collection (.ttc) holds several fonts
        const got = G.add_font(src.bytes, i);
        if (!got) break;
        if (!this.catalog.has(got.ps) || this.catalog.get(got.ps).group !== "list") {       // the tool's own twenty keep their entry
          this.catalog.set(got.ps, { family: family || got.family, style: src.style || got.style, ps: got.ps, group: "added", url: src.url, start: this.start_of(got.ps) });
        }
        added.push(this.catalog.get(got.ps));
      }
    }
    if (!added.length) { this.say_font(`${sources.map((x) => x.name).join(", ")} didn’t open as a font (TTF, OTF, TTC).`); return 0; }
    this.remember(added);
    const names = [...new Set(added.map((f) => f.family))];
    this.say_font(`Added ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}: ${added.length} style${added.length > 1 ? "s" : ""}.`);
    const R = this.ring();
    if (G.kind_of(R) === "numerals" && !added.some((f) => f.ps === R.ps)) {       // not the ring's own font: switch to the new one
      await this.use_font(added.find((f) => /^(regular|roman|book|normal)$/i.test(f.style)) || added[0]);
    }
    G.forget();
    this.static_dirty = true; this.sync_rows(); this.render();
    if (this.picker && this.picker.open) this.fill_picker(true);
    return added.length;
  }

  /** what was typed or pasted into Add fonts → fonts. Understands: a Google Fonts page or embed link, a family's
   *  name as Google Fonts spells it, and a direct link to a font file. → true if something was added */
  async add_from_text(text) {
    text = text.trim();
    let names = [text], file = null;
    try {
      const u = new URL(text);
      names = [];
      if (/\.(ttf|otf|ttc|otc)$/i.test(u.pathname)) file = text;
      else if (u.hostname === "fonts.googleapis.com") names = u.searchParams.getAll("family").map((f) => f.split(":")[0]);
      else if (u.hostname.endsWith("fonts.google.com")) {
        const page = /\/specimen\/([^/?]+)/.exec(u.pathname);
        if (page) names = [decodeURIComponent(page[1]).replace(/\+/g, " ")];
        else names = u.searchParams.getAll("selection.family").flatMap((v) => v.split("|")).map((f) => f.split(":")[0]);
      }
      if (!file && !names.length) { this.say_font("That link isn’t one I can read: use a Google Fonts page (fonts.google.com/specimen/…), its embed link, or a link that ends in .ttf or .otf."); return false; }
    } catch (e) { /* not a link: a family name */ }
    try {
      if (file) {
        this.say_font(`Fetching ${file}…`);
        const answer = await fetch(file);
        if (!answer.ok) throw new Error(`the site answered ${answer.status}`);
        return (await this.take_fonts([{ name: file.split("/").pop(), bytes: new Uint8Array(await answer.arrayBuffer()), url: file }])) > 0;
      }
      let total = 0;
      for (const name of names) total += await this.add_google(name.trim());
      return total > 0;
    } catch (e) {
      this.say_font(`Couldn’t fetch that (${e.message}). A site has to allow other pages to read its files; if it doesn’t, download the font and use Font file….`);
      return false;
    }
  }

  /** one family from Google Fonts' own repository on GitHub (the font files as their designers delivered them;
   *  Google's font service itself only hands out a compressed web format this tool's text engine can't read). */
  async add_google(name) {
    const folder = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!folder) return 0;
    this.say_font(`Looking for ${name} in Google Fonts…`);
    for (const licence of ["ofl", "apache", "ufl"]) {
      const base = `https://raw.githubusercontent.com/google/fonts/main/${licence}/${folder}/`;
      const answer = await fetch(base + "METADATA.pb");
      if (!answer.ok) continue;
      const about = await answer.text();
      const family = (/^name: "([^"]+)"/m.exec(about) || [])[1] || name;
      const fonts = [...about.matchAll(/fonts \{([^}]*)\}/g)].map((m) => Object.fromEntries([...m[1].matchAll(/(\w+): "?([^"\n]*)"?/g)].map((x) => [x[1], x[2]])));
      const upright = fonts.filter((f) => f.style === "normal").slice(0, 12);     // italics lean: not for a dial
      const sources = [];
      for (const f of upright) {
        const url = base + encodeURIComponent(f.filename);
        const file = await fetch(url);
        if (!file.ok) throw new Error(`${f.filename}: ${file.status}`);
        sources.push({ name: f.filename, bytes: new Uint8Array(await file.arrayBuffer()), url, style: upright.length > 1 ? (f.full_name || "").replace(family, "").trim() || "Regular" : "Regular" });
      }
      return this.take_fonts(sources, family);
    }
    this.say_font(`Google Fonts has no family spelled “${name}”. Copy the name from its page, or paste the page’s link.`);
    return 0;
  }

  /** fonts added from a link are remembered by this browser as their addresses, and fetched again when wanted. */
  remember(added) {
    try {
      const kept = JSON.parse(localStorage.getItem("dial-tool-fonts") || "[]").filter((k) => !added.some((f) => f.ps === k.ps));
      for (const f of added) if (f.url) kept.push({ family: f.family, style: f.style, ps: f.ps, url: f.url });
      localStorage.setItem("dial-tool-fonts", JSON.stringify(kept));
    } catch (e) { /* not kept */ }
  }
  remembered() {
    try { return JSON.parse(localStorage.getItem("dial-tool-fonts") || "[]"); } catch (e) { return []; }
  }
  /** when the sheet opens: fetch the remembered fonts that aren't here yet, so each can show its numerals. */
  async load_remembered() {
    let any = false;
    for (const f of this.catalog.values()) {
      if (f.url && !G.has_font(f.ps)) { try { any = (await this.load_font(f)) || any; } catch (e) { /* offline: it keeps its name */ } }
    }
    if (any && this.picker.open) this.fill_picker(true);
  }

  /** a variable font may rest at its thinnest weight: start it at regular (400) where it has that. */
  start_of(ps) {
    const wght = G.font_axes(G.font_of({ ps })).wght;
    return wght && wght.default !== 400 && wght.min <= 400 && wght.max >= 400 ? { wght: 400 } : {};
  }

  async use_font(entry) {
    try {
      await this.load_font(entry);
    } catch (e) {
      return this.say_font(`Couldn’t fetch ${entry.family} (${e.message}). Are you online?`);
    }
    if (!entry.start && G.has_font(entry.ps)) entry.start = this.start_of(entry.ps);
    const R = this.font_holder();
    R.family = entry.family; R.ps = entry.ps; R.axes = { ...(entry.start || {}) };
    if (this.font_scope !== "window") R.features = {};       // a window's font is plain: no features of its own
    this.static_dirty = true;
    this.sync_rows();
    this.render();
  }

  // ── the frame: nothing draws inside a control (R28) ──────

  render() {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => this.frame());
  }

  frame() {
    this.pending = false;
    if (this.closed) return;
    try {
      if (this.playing) {
        const [wall, t] = this.play_from;
        this.S.t = (t + (performance.now() - wall) / 1000 * this.speed) % 86400;
        this.sync_time();
        this.render();
      }
      this.draw();
    } catch (e) {
      this.play(false);
      this.log("error while drawing a frame: " + (e.stack || e));
    }
  }

  draw() {
    const S = this.S;
    const day = G.shows_day(S) ? G.day_hour(S) : null;       // an am · pm window follows the time shown, in steps of six minutes
    if (day !== this.day_drawn) { this.day_drawn = day; this.static_dirty = true; }
    if (!this.statik || this.static_dirty) {
      const t0 = performance.now();
      this.statik = G.build_static(S);
      this.static_dirty = false;
      this.build_ms = performance.now() - t0;
    }
    const items = G.scene(S, this.statik, S.t, true, S.ui_ring);
    this.items = items;
    const backdrop = S.out_production ? [1, 1, 1, 1] : S.c_backdrop;
    this.backdrop.setAttribute("fill", to_hex(backdrop));
    // what stands on the preview (Guides, Backdrop) is outline only, in black or white: whichever stands out more from
    // the backdrop. One of the two always has a contrast of 4.5 or more, so they can't be lost on any colour.
    const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4), L = 0.2126 * lin(backdrop[0]) + 0.7152 * lin(backdrop[1]) + 0.0722 * lin(backdrop[2]);
    this.main.classList.toggle("dark", 1.05 / (L + 0.05) > (L + 0.05) / 0.05);
    while (this.slots.length < items.length) {
      const node = svg_el("path");
      this.dial.append(node);
      this.slots.push({ node, path: null, fill: null, stroke: null, angle: null });
    }
    while (this.slots.length > items.length) this.slots.pop().node.remove();
    items.forEach((item, i) => {
      const slot = this.slots[i], node = slot.node;
      if (slot.path !== item.path) {               // the same object = the same shape (remembered geometry)
        const d = item.path.svg(4);                // guides are new objects every frame: compare their text
        if (d !== slot.d) node.setAttribute("d", d);
        slot.d = d;
        slot.path = item.path;
      }
      const fill = item.fill ? to_hex(item.fill) + "/" + item.fill[3] : "none";
      if (fill !== slot.fill) {
        slot.fill = fill;
        node.setAttribute("fill", item.fill ? to_hex(item.fill) : "none");
        node.setAttribute("fill-opacity", item.fill ? item.fill[3] : 1);
      }
      const stroke = item.stroke ? to_hex(item.stroke) + "/" + item.stroke[3] + "/" + item.px : "none";
      if (stroke !== slot.stroke) {
        slot.stroke = stroke;
        if (item.stroke) {
          node.setAttribute("stroke", to_hex(item.stroke));
          node.setAttribute("stroke-opacity", item.stroke[3]);
          node.setAttribute("stroke-width", item.px);
          node.setAttribute("vector-effect", "non-scaling-stroke");      // guides keep their width on screen
          node.setAttribute("pointer-events", "none");
        } else for (const a of ["stroke", "stroke-opacity", "stroke-width", "vector-effect", "pointer-events"]) node.removeAttribute(a);
      }
      if (item.angle !== slot.angle) {             // hands turn about the pivot (R2: clockwise)
        slot.angle = item.angle;
        if (item.angle) node.setAttribute("transform", `rotate(${-item.angle})`); else node.removeAttribute("transform");
      }
      node.dataset.i = i;
    });
    this.draw_shadows(items);
    this.place();
    const ring = this.ring();
    const font = G.kind_of(ring) === "numerals" ? `   ·   ${ring.ps}` : "";
    this.status.textContent = `${ring.name}${font} · Ø ${this.in_unit(S.dial_d, 1)} ${this.unit()[0]} · build ${this.build_ms.toFixed(0)} ms`;
    while (G.NOTES.length) {                       // a font that is on its way isn't worth a line: it arrives in a moment
      const note = G.NOTES.shift(), ps = (/\(([^)]+)\) isn’t loaded|\(([^)]+)\) isn't loaded/.exec(note) || []).slice(1).find(Boolean);
      const coming = ps && this.catalog.has(ps) && (this.catalog.get(ps).file || this.catalog.get(ps).data);
      if (!coming) this.log(note);
    }
    this.autosave();
  }

  // ── the preview: zoom, pan, click ────────────────────────

  size() { const r = this.svg.getBoundingClientRect(); return [r.width, r.height]; }
  fit_zoom() { const [w, h] = this.size(); return Math.min(w, h) / G.page_mm(this.S); }

  /** put the dial at c, scaled to z; mirrored for toner transfer. y grows upward inside. */
  place() {
    const flip = this.S.out_mirror ? -1 : 1;
    const where = `translate(${this.c[0]} ${this.c[1]}) scale(${flip * this.z} ${-this.z})`;
    this.dial.setAttribute("transform", where);
    this.over.setAttribute("transform", where);
  }

  fit() {
    const [w, h] = this.size();
    if (w < 1 || h < 1) return;
    this.fitted = true;
    this.z = this.fit_zoom();
    this.c = [w / 2, h / 2];
    this.place();
  }

  /** zoom by k so that the spot under view point p stays there. */
  zoom(k, p) {
    const lo = this.fit_zoom() / 4, hi = 400;
    k = clamp(this.z * k, lo, hi) / this.z;
    this.z *= k;
    this.c = [p[0] + (this.c[0] - p[0]) * k, p[1] + (this.c[1] - p[1]) * k];
    this.fitted = false;
    this.place();
  }

  resized() {
    this.pop_cover();
    const [w, h] = this.size();
    if (w < 1 || h < 1) return;
    if (this.fitted) this.fit();
    else if (this.view) { this.c = [this.c[0] + (w - this.view[0]) / 2, this.c[1] + (h - this.view[1]) / 2]; this.place(); }
    this.view = [w, h];
  }

  /** a point of the view → millimetres on the dial (y up). */
  to_mm(p) {
    const flip = this.S.out_mirror ? -1 : 1;
    return [(p[0] - this.c[0]) / this.z * flip, -(p[1] - this.c[1]) / this.z];
  }

  preview_events() {
    const at = (e) => { const r = this.svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    this.svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.hover(null);
      if (e.ctrlKey || e.metaKey) this.zoom(Math.exp(-e.deltaY * 0.01), at(e));      // pinch, or ⌘ / ctrl + scroll
      else { this.fitted = false; this.c = [this.c[0] - e.deltaX, this.c[1] - e.deltaY]; this.place(); }
    }, { passive: false });
    // fingers and the mouse, each tracked by its id (#152: one shared `down` let a second finger reset the pan and
    // both fingers drag it from different places — the jump at the start of a pinch). One pointer pans (or clicks,
    // if it hasn't moved); two pinch: the zoom follows their distance, the pan their midpoint.
    const pts = new Map();                         // pointerId → where it is now
    let down = null;                               // one pointer: {p, c, moved} · two: {d, mid, moved}
    const pair = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; };
    const restart = () => {                        // a pointer came or went: start again from where they all are now
      const moved = down ? down.moved : false;
      if (pts.size === 1) down = { p: [...pts.values()][0], c: this.c.slice(), moved };
      else if (pts.size >= 2) down = { ...pair(), moved: true };      // a pinch is never a click
      else down = null;
    };
    this.svg.addEventListener("pointerdown", (e) => { pts.set(e.pointerId, at(e)); this.svg.setPointerCapture(e.pointerId); if (pts.size === 1) down = null; restart(); });
    this.svg.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return e.pointerType === "mouse" ? this.hover(at(e), document.elementFromPoint(e.clientX, e.clientY)) : null;
      pts.set(e.pointerId, at(e));
      if (pts.size >= 2) {
        const now = pair();
        this.hover(null);
        this.c = [this.c[0] + now.mid[0] - down.mid[0], this.c[1] + now.mid[1] - down.mid[1]];      // pan by the midpoint…
        this.zoom(now.d / down.d, now.mid);                                                        // …zoom by the distance (zoom places)
        down.d = now.d; down.mid = now.mid;
        return;
      }
      const p = at(e);
      if (Math.hypot(p[0] - down.p[0], p[1] - down.p[1]) > 4) down.moved = true;
      if (down.moved) { this.hover(null); this.fitted = false; this.c = [down.c[0] + p[0] - down.p[0], down.c[1] + p[1] - down.p[1]]; this.place(); }
    });
    const up = (e) => {
      if (!pts.has(e.pointerId)) return;
      const click = pts.size === 1 && down && !down.moved && e.type === "pointerup";
      pts.delete(e.pointerId);
      if (click) this.clicked(at(e), document.elementFromPoint(e.clientX, e.clientY));
      restart();
    };
    this.svg.addEventListener("pointerup", up);
    this.svg.addEventListener("pointercancel", up);
    this.svg.addEventListener("pointerleave", () => this.hover(null));
    let pinch = 1;                                 // Safari reports a pinch as gesture events
    this.svg.addEventListener("gesturestart", (e) => { e.preventDefault(); pinch = 1; });
    this.svg.addEventListener("gesturechange", (e) => {      // a Mac trackpad in Safari; on a touch screen the two pointers above already pinch
      e.preventDefault();
      if (pts.size < 2) this.zoom(e.scale / pinch, at(e));
      pinch = e.scale;
    });
  }

  /** what is under a point of the preview: {kind, name, …} or null. kind: ring · hand · cap · date · plate.
   *  Used by the hover label and by the click, so they always agree. */
  piece_at(p, node) {
    const S = this.S, mm = this.to_mm(p), r = Math.hypot(mm[0], mm[1]);
    const item = node && node.dataset && node.dataset.i !== undefined ? this.items[+node.dataset.i] : null;
    const role = item ? item.role : null;
    if (role === "hand") return { kind: "hand", hand: G.HANDS.indexOf(item.name), name: { hour: "Hour hand", minute: "Minute hand", second: "Seconds hand" }[item.name], path: item.path, angle: item.angle };
    if (role === "cap") return { kind: "cap", name: "Cap", path: item.path, angle: 0 };
    if (role && (role.startsWith("date") || role === "cutline")) {
      const x = this.statik.windows.find((b) => b.index === item.window), kind = G.WINDOW_KINDS[x.w.kind];
      return { kind: "date", window: x.index, name: { date: "Date window", day: "Day window", "am · pm": "AM · PM window", "moon phase": "Moon phase window" }[kind], path: x.window, angle: 0 };
    }
    let d = role === "ring" ? item.ring : null;
    if (!d) {                                      // the plate or the backdrop. Thin ticks are hard to hit, so:
      const slack = 4 / this.z;                    // of the rings whose zone (between their radii) is under the
      const angle = Math.atan2(mm[0], mm[1]) * 180 / Math.PI;      // point, take the one with the nearest mark
      let best = Infinity;
      for (const x of this.statik.rings) {         // top ring first, so the top one wins a tie
        const R = x.ring;
        const [lo, hi] = x.kind === "numerals" ? [R.r - R.size / 2, R.r + R.size / 2] : [R.r - (x.kind === "band" ? R.width : R.len), R.r];
        if (r < lo - slack || r > hi + slack) continue;
        const away = x.kind === "band" ? 1e6 : Math.min(...x.taken.map((a) => Math.abs(((angle - a + 540) % 360) - 180))) * Math.PI / 180 * r;
        if (away < best) { best = away; d = x; }
      }
    }
    if (!d) return r <= S.dial_d / 2 && !S.out_production ? { kind: "plate", name: "Plate", path: this.statik.plate, angle: 0 } : null;
    const piece = { kind: "ring", ring: S.rings.indexOf(d.ring), name: d.ring.name || G.kind_of(d.ring), path: d.path, angle: 0 };
    if (d.kind === "numerals") {                   // which numeral? the nearest one's centre
      let best = Infinity;
      d.parts.forEach((part, k) => {
        const b = part.bounds();
        if (!b) return;
        const dist = Math.hypot((b[0] + b[2]) / 2 - mm[0], (b[1] + b[3]) / 2 - mm[1]);
        if (dist < best) { best = dist; piece.numeral = String(d.at[k]); }
      });
    }
    return piece;
  }

  /** a click on the preview opens the settings of what was clicked. */
  clicked(p, node) {
    const piece = this.piece_at(p, node), S = this.S;
    if (!piece) return;
    const section = { ring: 1, hand: 2, cap: 2, date: 3, plate: 0 }[piece.kind], same = section === S.ui_section;
    S.ui_section = section;
    if (piece.kind === "ring") { S.ui_ring = piece.ring; if (piece.numeral !== undefined) this.nudge_at = piece.numeral; }
    if (piece.kind === "hand") S.ui_hand = piece.hand;
    if (piece.kind === "date") S.ui_window = piece.window;
    if (same) { this.fill_ring_list(); this.sync_rows(); } else this.show_section();
    this.render();
  }

  /** the pointer rests on something that can be edited: outline it, and say its name beside the pointer. */
  hover(p, node) {
    const piece = p ? this.piece_at(p, node) : null;
    this.tip.hidden = !piece;
    for (const line of this.glow) line.setAttribute("d", piece ? piece.path.svg(4) : "");
    if (!piece) return;
    for (const line of this.glow) { if (piece.angle) line.setAttribute("transform", `rotate(${-piece.angle})`); else line.removeAttribute("transform"); }
    this.tip.firstChild.textContent = piece.name;
    // the label sits above the pointer, its arrow's tip 10 points from it; under the pointer near the top edge.
    // Near a side edge the label stops at the edge and the arrow slides along it, so it still points at the pointer.
    const [w] = this.size(), box = this.tip.getBoundingClientRect(), half = box.width / 2, gap = 10, edge = 6;
    const below = p[1] - gap - box.height - 8 < edge;
    const x = clamp(p[0], edge + half, Math.max(edge + half, w - edge - half));
    this.tip.classList.toggle("below", below);
    this.tip.style.left = `${x - half}px`;
    this.tip.style.top = `${below ? p[1] + gap + 8 : p[1] - gap - 8 - box.height}px`;
    this.tip.style.setProperty("--arrow", `${clamp(p[0] - (x - half), 12, box.width - 12)}px`);
  }

  // ── time ─────────────────────────────────────────────────

  /** the half of the day that is showing, in seconds: 0 in the morning, 43200 after noon. The slider and its steps
   *  are twelve hours long and stay in the half they are in. */
  half() { return this.S.t % 86400 >= 43200 ? 43200 : 0; }

  sync_time() {
    const t12 = ((this.S.t % 43200) + 43200) % 43200;
    if (document.activeElement !== this.time_field) this.time_field.value = fmt_time(this.S.t);
    // centred on its ink, measured with every figure a 0, so it stands still while its figures change (ink.js)
    const zeros = this.time_field.value.replace(/[0-9]/g, "0");
    if (zeros !== this.time_zeros) {
      this.time_zeros = zeros;
      const [dx, dy] = ink_offset(zeros, getComputedStyle(this.time_field));
      this.time_field.style.setProperty("--ink-dx", dx + "px");
      this.time_field.style.setProperty("--ink-dy", dy + "px");
    }
    if (document.activeElement !== this.time_slider || this.playing) this.time_slider.value = Math.floor(t12);
    for (const b of document.querySelectorAll(".steps12 button")) b.classList.toggle("on", Math.abs(+b.dataset.t - t12) < 0.5);
    const word = this.half() ? "PM" : "AM";
    if (this.half_button.textContent !== word) this.half_button.textContent = word;
  }

  set_time(t) {
    this.S.t = t;
    if (this.playing) this.play_from = [performance.now(), t];     // Play carries on from the new time
    this.sync_time();
    this.render();
  }

  /** the day's ruler. An hour gets as many cuts as its width allows: none, halves, quarters, ten or five minutes.
   *  Hour lines are long, the others shorter; all cross the line. A click on the slider snaps to the nearest cut. */
  draw_ruler() {
    const W = this.time_slider.clientWidth, H = 22, THUMB = 3;
    if (!W) return;
    const hour = (W - THUMB) / 12;
    const minutes = [5, 10, 15, 30, 60].find((m) => hour / (60 / m) >= 7) || 60;      // cuts at least 7 apart
    const x = (t) => (THUMB / 2 + (W - THUMB) * t / 43200).toFixed(2);
    const lines = { hour: "", half: "", small: "" };
    this.day_ticks = [];
    for (let m = 0; m < 720; m += minutes) {
      const kind = m % 60 === 0 ? "hour" : m % 30 === 0 ? "half" : "small", h = { hour: 16, half: 10, small: 6 }[kind];
      lines[kind] += `M${x(m * 60)} ${(H - h) / 2}V${(H + h) / 2}`;
      this.day_ticks.push(m * 60);
    }
    this.ruler.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.ruler.dataset.minutes = minutes;
    this.ruler.innerHTML = `<path class="line" d="M0 ${H / 2}H${W}"/>` + Object.entries(lines).map(([kind, d]) => `<path class="${kind}" d="${d}"/>`).join("")
      + `<path class="pose" d="M${x(36600)} 1V${H - 1}"/>`;
  }

  /** how fast time runs while playing: 1 = a real second each second. Part of the window, not of the dial. */
  set_speed(k) {
    this.speed = k;
    if (this.playing) this.play_from = [performance.now(), this.S.t];
    const p = Math.round(speed_place(k) * 1000);
    if (document.activeElement !== this.speed_slider || Math.abs(+this.speed_slider.value - p) > 1000 * SPEED_SNAP) this.speed_slider.value = p;
    this.speed_slider.setAttribute("aria-valuetext", speed_word(k) + "×");
    this.speed_slider.title = `How fast time runs: ${speed_word(k)}× (0.5× to 720×)`;
    this.speeds.classList.toggle("real", k === 1);
  }

  play(on) {
    this.playing = on;
    this.play_from = [performance.now(), this.S.t];
    this.play_icon();
    this.render();
  }

  /** the arcade button shows whether time runs: up, still; pressed in, running (ARCADE). Its name says what a press does. */
  play_icon() {
    this.play_button.innerHTML = ARCADE(this.playing);
    this.play_button.setAttribute("aria-pressed", String(this.playing));
    this.play_button.title = this.play_button.ariaLabel = this.playing ? "Pause" : "Play";
  }

  // ── files out and in ─────────────────────────────────────

  async export(kind) {
    try {
      const S = this.S, statik = G.build_static(S);
      const name = file_name(S, kind);
      if (kind === "svg") {
        const live = S.out_live_text && !S.out_production;
        save_file(name, svg_document(S, statik, S.t, { live }), "image/svg+xml");
        if (live) return this.log(`exported ${name} · ${G.page_mm(S).toFixed(2)} mm square · numerals are text: ${[...new Set(S.rings.filter((r) => r.on && G.kind_of(r) === "numerals").map((r) => r.family))].join(", ") || "no numerals"} must be installed to open it`);
      }
      if (kind === "pdf") save_file(name, pdf_document(S, statik, S.t), "application/pdf");
      if (kind === "png") {
        const px = Math.round(G.page_mm(S) / 25.4 * S.out_dpi);
        if (px > PNG_MOST) return this.log(`PNG not made: ${px} × ${px} px is more than a browser can draw (${PNG_MOST} a side). Lower the dpi to ${Math.floor(PNG_MOST / G.page_mm(S) * 25.4)} or less, or use the PDF.`);
        const image = new Image();
        image.src = URL.createObjectURL(new Blob([svg_document(S, statik, S.t)], { type: "image/svg+xml" }));
        await image.decode();
        const canvas = el("canvas", { width: px, height: px }), pen = canvas.getContext("2d");
        if (S.out_production) { pen.fillStyle = "#fff"; pen.fillRect(0, 0, px, px); }      // a mask is black on white, never on nothing
        pen.drawImage(image, 0, 0, px, px);
        URL.revokeObjectURL(image.src);
        const blob = await new Promise((done) => canvas.toBlob(done, "image/png"));
        if (!blob) throw new Error(`this browser couldn’t make a picture of ${px} × ${px} px: lower the dpi`);
        save_file(name, png_with_dpi(new Uint8Array(await blob.arrayBuffer()), S.out_dpi), "image/png");
        this.log(`exported ${name} · ${px} × ${px} px · ${Math.round(S.out_dpi)} dpi is written in the file, so it opens at ${G.page_mm(S).toFixed(2)} mm`
          + (px * px > PNG_SAFE ? ` · large: if it is empty in Safari, lower the dpi` : ""));
        return;
      }
      this.log(`exported ${name} · ${G.page_mm(S).toFixed(2)} mm square, to your downloads`);
    } catch (e) {
      this.log(`export ${kind} failed: ${e.stack || e}`);
    }
  }

  load_text(text, name) {
    try {
      const settings = JSON.parse(text);
      if (typeof settings !== "object" || Array.isArray(settings)) throw new Error("not a settings file");
      this.reopen(settings);
      tool.log(`loaded ${name}`);
    } catch (e) {
      this.log(`couldn’t load ${name}: ${e.message}`);
    }
  }

  /** this tool is being replaced (reopen): stop everything it still has running, so it can't draw or
   *  save over the new one. */
  close() {
    this.closed = true;
    this.playing = false;
    clearTimeout(this.saving);
    for (const w of this.watchers) w.disconnect();
  }

  /** start again with new settings (the simplest way to update every control). */
  reopen(settings) {
    this.close();
    const fonts = this.catalog;
    tool = new DialTool(settings);
    for (const [ps, f] of fonts) if (!tool.catalog.has(ps)) tool.catalog.set(ps, f);
    tool.load_fonts_in_use();
    window.dial_tool = tool;
  }

  /** undo and redo on the preview, top right, before the Guides switch (Okay, 13 Oct 2026): two outlined buttons,
   *  like the switches there; pale when there is nothing to go back or forward to. */
  undo_box() {
    const make = (id, title, way, d) => { const b = el("button", { type: "button", className: "onview undobox", id, title, ariaLabel: title, onclick: () => this.undo(way) }); b.innerHTML = icon(d); return b; };
    this.undo_buttons = [make("undo", "Undo (⌘Z)", -1, TOOL_ICONS.undo), make("redo", "Redo (⇧⌘Z)", 1, TOOL_ICONS.redo)];
    this.sync_undo();
    return el("span", { className: "undos" }, ...this.undo_buttons);
  }
  sync_undo() {
    if (!this.undo_buttons) return;
    [HISTORY.past, HISTORY.future].forEach((steps, i) => { this.undo_buttons[i].classList.toggle("none", !steps.length); this.undo_buttons[i].setAttribute("aria-disabled", String(!steps.length)); });
  }

  /** the dial has changed and stood still: that is one step to undo. */
  take_step() {
    const now = dial_text(this.S);
    if (HISTORY.now === null) HISTORY.now = now;
    this.sync_undo();
    if (now === HISTORY.now) return;
    HISTORY.past.push(HISTORY.now);
    if (HISTORY.past.length > HISTORY.most) HISTORY.past.shift();
    HISTORY.now = now;
    HISTORY.future = [];
    this.sync_undo();
  }

  /** one step back (-1) or forward again (1). The time shown and the window's state stay as they are. */
  undo(way) {
    const field = document.activeElement;
    if (field && field.matches && field.matches("input, textarea, select")) field.blur();      // what is being typed counts as a change first
    this.take_step();
    const [from, to] = way < 0 ? [HISTORY.past, HISTORY.future] : [HISTORY.future, HISTORY.past];
    if (!from.length) return this.log(way < 0 ? "nothing to undo" : "nothing to redo");
    to.push(HISTORY.now);
    HISTORY.now = from.pop();
    const keep = Object.fromEntries(Object.entries(this.S).filter(([key]) => key === "t" || key.startsWith("ui_")));
    this.S = G.fresh_settings({ ...JSON.parse(HISTORY.now), ...keep });
    this.S.ui_ring = clamp(this.S.ui_ring, 0, this.S.rings.length - 1);
    this.static_dirty = true;
    this.scale_from = null;
    this.value_pop = null;
    this.show_section();                           // every control from the settings again
    this.load_fonts_in_use();
    this.render();
    this.sync_undo();
    this.log(way < 0 ? `undone · ${HISTORY.past.length} more` : `redone · ${HISTORY.future.length} more`);
  }

  /** shortly after the last change: keep the session, take a step for undo, and make the address bar say this dial. */
  autosave() {
    clearTimeout(this.saving);
    this.saving = setTimeout(async () => {
      if (this.closed) return;
      this.take_step();
      try { localStorage.setItem(LAST, JSON.stringify(this.S)); } catch (e) { /* private window: nothing kept */ }
      try { history.replaceState(null, "", await this.show_link()); } catch (e) { /* the address stays as it was */ }
    }, 400);
  }

  /** the whole dial as one address: open it anywhere and the dial is back. Fonts travel by name only. */
  async copy_link() {
    const link = await this.show_link();
    try {
      await navigator.clipboard.writeText(link);
      this.log(`link copied · ${link.length} characters`);
    } catch (e) {
      this.log(`couldn’t copy by itself; the link is in the address bar, and here:\n${link}`);
    }
    try { history.replaceState(null, "", link); } catch (e) { /* fine */ }
  }

  log(message) {
    const stamp = new Date().toTimeString().slice(0, 8);
    this.log_lines.unshift(`${stamp}  ${message}`);
    this.log_lines.length = Math.min(this.log_lines.length, 200);
    const box = $("#log");
    if (box) box.textContent = this.log_lines.join("\n");
    console.log(message);
  }
}

// ── start ────────────────────────────────────────────────────

let tool = null;

export async function open_window(pathkit, harfbuzz, font_bytes) {
  G.start(pathkit, harfbuzz);
  G.add_font(font_bytes, 0, true);                 // the page's own font: stands in until yours are loaded
  let settings = await unpack(location.hash);      // a dial in the address comes first…
  const from_link = settings !== null;
  if (!settings) { try { settings = JSON.parse(localStorage.getItem(LAST)); } catch (e) { settings = null; } }   // …then the last session
  tool = new DialTool(settings);
  if (from_link) tool.log("opened the dial in the address");
  window.addEventListener("hashchange", async () => {              // another dial's link pasted into this tab
    const next = await unpack(location.hash);
    if (next) { tool.reopen({ ...next, ui_section: tool.S.ui_section }); tool.log("opened the dial in the address"); }
  });
  tool.sync_time();
  start_ink();                                     // short labels in boxes, centred on their ink (ink.js)
  window.dial_tool = tool;
  window.addEventListener("pagehide", () => { try { localStorage.setItem(LAST, JSON.stringify(tool.S)); } catch (e) { /* nothing kept */ } });
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", async (e) => {    // drop a settings file or font files anywhere
    e.preventDefault();
    const files = [...e.dataTransfer.files];
    const json = files.find((f) => f.name.toLowerCase().endsWith(".json"));
    if (json) tool.load_text(await json.text(), json.name);
    const fonts = files.filter((f) => /\.(ttf|otf|ttc|otc)$/i.test(f.name));
    if (fonts.length) tool.add_font_files(fonts);
  });
}
