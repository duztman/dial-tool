// Dial Tool, web version — part 4: the window.
//
//   left: sections (Dial · Rings · Hands · Windows · Export), each a list of panes; a pane is a heading and its rows
//   right: the preview (SVG — one element per scene item) and the bar under it
//
// Rows are described as data (ROWS), as in dial.py; one function turns a row into
// controls. Controls change the settings S and ask for a frame; the frame draws (R28).

import * as G from "./geometry.js";
import { svg_document, pdf_document, png_with_dpi, file_name, pdf_sheet, sheet_layout, PAPERS } from "./output.js";
import { BEZELS, STRAPS, bezel_svg } from "./bezels.js";
// a Wear OS watch face (4.67; farukahmet's PR #1, 18 Oct 2026): the dial as Watch Face Format, packed and signed in the browser
import { generate_watchface_xml } from "./wearos/wff_xml.js";
import { svg_dial_face, svg_hand, svg_cap, svg_preview, svg_window_sheet, svg_to_png_bytes } from "./wearos/wff_assets.js";
import { build_signed_wearos_apk, format_package_name, sanitize_package_suffix } from "./wearos/apk_packager.js";
import { FONT_LIST, FONT_SITE } from "./font_list.js";
import { EXAMPLES } from "./examples.js";
import { GALLERY } from "./gallery.js";
import { OPENER } from "./opener.js";
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
const filled = (slider) => { const p = clamp((slider.value - slider.min) / ((slider.max - slider.min) || 1), 0, 1).toFixed(4); slider.style.setProperty("--p", p); const pop = slider.closest(".numpop"); if (pop) pop.style.setProperty("--p", p); };      // in the popup the value follows the knob: the box knows --p too

const PNG_MOST = 16384;                            // a browser's canvas is at most this many pixels a side
const PNG_SAFE = 4096 * 4096;                      // Safari on a phone or tablet draws nothing past this many pixels in all
const GUIDE = "https://duztman.github.io/dial-tool/guide/";      // the guide (#230): "Help" beside the version, in its type, underlined (Okay, 15 Oct 2026, 12:50)
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
// the tiny plus over the tiny minus beside a quiet number (#250; 4.45.2, Okay: "Compact minusplus too far apart,
// closer, parallels on baseline ascender"): 6 points wide, the plus 6 high, each drawn ink to edge (its round caps
// inside the box), so the stylesheet stands the plus's top on the figures' top and the minus on their baseline.
// Quiet signs, so DENSE.
// the number popup's − and + (Okay's drawing, 16 Oct 2026, on 4.45.2: "thicker plus minus, rounded ends"): 22 points,
// the sign 20 across, its line 3 — twice LINE, a pictured width (icons/check.mjs) — centred on whole points, so a 3
// line covers whole screen dots
const BIG = {                                      // the controller's − and + (Okay's second drawing, 18 Oct 2026, controller 2.svg): 8 thick, 40 long, square ends, white on the discs (17 Oct to 4.51.1: round ends)
  plus: icon(`<path d="M22 2V42M2 22H42" ${sw(8)} stroke-linecap="butt"/>`, 44),
  minus: icon(`<path d="M2 22H42" ${sw(8)} stroke-linecap="butt"/>`, 44),
};
// the − and + of every number box (4.64; Okay, 18 Oct 2026, 21:20: "Signs grow inside the box as much as these new thick
// bordered ones"): 12 across on 16, LINE, round ends — half the box's cell, as the Positions blocks' signs were. (The
// tiny ± beside a quiet number, 6 across in DENSE, went with it: "small plusminus … retired".)
const STEP = {
  plus: icon(`<path d="M8.25 2.25V14.25M2.25 8.25H14.25"/>`),
  minus: icon(`<path d="M2.25 8.25H14.25"/>`),
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
const none_dot = `<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="round"><path d="M5 ${1 + LINE / 2}A${4 - LINE / 2} ${4 - LINE / 2} 0 1 1 5 ${9 - LINE / 2}A${4 - LINE / 2} ${4 - LINE / 2} 0 1 1 5 ${1 + LINE / 2}M3.25 3.25L6.75 6.75"/></svg>`;      // ring and stroke one path: where they meet nothing doubles, at any opacity (Okay, 16 Oct 2026, #271)
// a cross at the same size, in its place on an added guide's line: remove it (#305, 4.45.3)
const cross_dot = icon(`<path d="M2.25 2.25L7.75 7.75M7.75 2.25L2.25 7.75" ${sw(SLANT)}/>`, 10);
// small pictures for choices that are easier seen than read: drawn at the size they are shown, 38 × 27 (they were
// drawn on 28 × 20 and enlarged 1.35 times; Okay, 13 Oct 2026: "bigger, better (less detail) icons… this goes for all")
const pic = (inside) => icon(inside, 38, 27);
const solid = `fill="currentColor" stroke="none"`;
const faint = `${sw(CURVE)} opacity="0.45"`;       // context (the dial's edge behind the A's): as heavy as any line, fainter in colour
const KIND_PIC = 24;                               // a kind's picture, a square this wide: the ring line and the Add menu
const A = (x) => `M${x - 2.75} 12.25L${x} 5.5L${x + 2.75} 12.25`;      // an A, as a chevron: how a numeral stands
// Placement's arrows (18 Oct 2026): a thin stem and a big filled head, 6 long in all, centred on (px, py), pointing dir
// degrees clockwise from up; the stem runs from the tail into the head's base, so no gap shows between them
const stem_at = (px, py, dir) => {
  const t = dir * Math.PI / 180, ux = Math.sin(t), uy = -Math.cos(t), f = (v) => +v.toFixed(3);
  return `M${f(px - ux * 3)} ${f(py - uy * 3)}L${f(px + ux * 0.5)} ${f(py + uy * 0.5)}`;
};
const head_at = (px, py, dir) => {
  const t = dir * Math.PI / 180, ux = Math.sin(t), uy = -Math.cos(t), f = (v) => +v.toFixed(3);
  const tip = [px + ux * 3, py + uy * 3], base = [px + ux * 0.25, py + uy * 0.25], half = 1.75;
  return `M${f(tip[0])} ${f(tip[1])}L${f(base[0] - uy * half)} ${f(base[1] + ux * half)}L${f(base[0] + uy * half)} ${f(base[1] - ux * half)}Z`;
};
const PICS = {
  // a ring's kind: the whole circle, as on a dial (Okay's drawing, 13 Oct 2026), centre 12. The four weigh about the
  // same (Okay, 13 Oct 2026: "equalize contrast"): many thin ticks (1), eight thicker marks (2), four numbers in the
  // pixel font at its own size (8), a band (3). These are the dial's own widths, pictured, not lines: kept.
  // reworked 4.50 (#255, Okay's notes, p. 3: "a smaller optical size; abort silkscreen there … a fat Inter"): the
  // drawings a size smaller in their box (radius 9.75, was 11), the figures and words in the tool's sans, bold (.figure)
  kind: (i) => icon([
    `<path d="${ticks(24, 6.75, 9.75, 12)}" stroke-width="1" stroke-linecap="butt"/>`,
    `<path d="${ticks(8, 6.25, 9.75, 12)}" stroke-width="2" stroke-linecap="butt"/>`,
    // 18 Oct 2026 (notes 2: "12 is too wide. No tabular, much less tracking (almost touching 1 and 2)"; in his drawing
    // "pushing 1 and 2 together 2 pixels"): proportional figures (.figure) and the 12 drawn 0.75 tighter
    [["12", 12, 6.25, -0.75], ["3", 17.75, 12, 0], ["6", 12, 17.75, 0], ["9", 6.25, 12, 0]].map(([t, x, y, k]) => `<text class="figure" x="${x}" y="${y}" font-size="6.5"${k ? ` letter-spacing="${k}"` : ""} text-anchor="middle" dominant-baseline="central" fill="currentColor" stroke="none">${t}</text>`).join(""),
    `<circle cx="12" cy="12" r="8.25" stroke-width="3"/>`,
    // text (#297): words on the dial, under 12 and over 6. 18 Oct 2026 (notes 2: "bolder text, bit more tracking and
    // less line height to the lines"): heavier (.words), tracked 0.5, the two lines 7.5 apart (were 9)
    [["ABC", 12, 8.25], ["XYZ", 12, 15.75]].map(([t, x, y]) => `<text class="figure words" x="${x}" y="${y}" font-size="5.5" letter-spacing="0.5" text-anchor="middle" dominant-baseline="central" fill="currentColor" stroke="none">${t}</text>`).join(""),
  ][i], KIND_PIC),
  shape: [`<rect x="16.5" y="4" width="5" height="19" ${solid}/>`, `<path d="M14.5 4H23.5L20.5 23H17.5Z" ${solid}/>`, `<circle cx="19" cy="13.5" r="6" ${solid}/>`],
  twelve: [                                        // the baton is the shape tile's baton: same width (5)
    `<rect x="16.5" y="4" width="5" height="19" ${solid}/>`,
    `<rect x="11.5" y="4" width="5" height="19" ${solid}/><rect x="21.5" y="4" width="5" height="19" ${solid}/>`,
    `<path d="M11 4H27L19 23Z" ${solid}/>`,
    `<rect x="16.75" y="4.75" width="4.5" height="17.5" stroke-width="2" stroke-dasharray="1.5 2.5"/>`,      // the baton, outlined and dashed (a place left empty): a dashed line looks lighter than a whole one, so 2
  ],
  // Placement (#259, 4.50.3; Okay's notes, p. 6: "each shows what it does on a ring, as auto-flip's does; no clash
  // with the dial's ring; cleaner arrows with stems, six arrows each"): a micro dial — the ring as a faint circle, and
  // on it six arrows, each the way up of a numeral standing there: all up (upright) · pointing out (radial) · out above,
  // in below (auto-flip) · along the ring (on path). The A's at 3 and 6 o'clock of 4.36–4.50.2 are gone.
  // 18 Oct 2026 (Okay, on 4.50.2's tiles: "Thinner lines overall, thinner but big headed arrows, try again"): the
  // circle and the stems DENSE, each arrow's head a filled triangle, 2.75 long and 3.5 across (were LINE, legs of 1.75)
  mode: [(a) => 0, (a) => a, (a) => (a > 90 && a < 270 ? a + 180 : a), (a) => a + 90].map((way) => {
    const at = [0, 60, 120, 180, 240, 300].map((a) => [19 + 7.5 * Math.sin(a * Math.PI / 180), 13.5 - 7.5 * Math.cos(a * Math.PI / 180), way(a)]);
    return `<circle cx="19" cy="13.5" r="11.5" ${sw(DENSE)} opacity="0.45"/><path d="${at.map(([x, y, d]) => stem_at(x, y, d)).join("")}" ${sw(DENSE)}/>`
      + `<path d="${at.map(([x, y, d]) => head_at(x, y, d)).join("")}" ${solid}/>`;
  }),
  // a window's shape: rectangle · circle · polygon · arch · arc — on 26 × 18, inside the Shape line's buttons (#265,
  // 4.46.1; 38 × 27 before, fitted down by icons/fit.mjs, the box redrawn on quarter points)
  hole: [
    box(5.75, 3.75, 14.5, 10.5, 1.5),
    `<circle cx="13" cy="9" r="6" ${sw(CURVE)}/>`,
    `<path d="M13 2.5L18.75 5.75V12.25L13 15.5L7.25 12.25V5.75Z" ${sw(SLANT)}/>`,
    `<path d="M2.75 14.25A10.25 10.25 0 0 1 23.25 14.25A5.25 5.25 0 0 0 13 14.25A5.25 5.25 0 0 0 2.75 14.25Z" ${sw(CURVE)}/>`,
    `<path d="M4 11.75A13 13 0 0 1 22 11.75L19.5 15.25A9 9 0 0 0 6.5 15.25Z" ${sw(CURVE)}/>`,
  ],
  // what a window shows, in as few lines as say it: one figure · one letter · a half filled · a crescent — on 30 × 21
  // (Okay, 16 Oct 2026, on the Windows page's mock-ups: "smaller icons"; 38 × 27 until 4.46.1)
  window: [
    box(5.25, 2.25, 19.5, 16.5, 1.5) + `<path d="M12.75 8L15.25 6V15" ${sw(CURVE)}/>`,
    box(2.25, 4.25, 25.5, 12.5, 1.5) + `<path d="M10.75 14V7L15 12L19.25 7V14" ${sw(SLANT)}/>`,
    box(3.75, 3.75, 22.5, 13.5, 1.5) + `<path d="M15 3.75H5.25A1.5 1.5 0 0 0 3.75 5.25V15.75A1.5 1.5 0 0 0 5.25 17.25H15Z" ${solid}/>`,
    `<path d="M15 1.25A9.25 9.25 0 0 0 15 19.75A11.75 11.75 0 0 1 15 1.25Z" ${solid}/><circle cx="15" cy="10.5" r="9.25"/>`,      // the crescent beside it makes the circle look heavier: it stays LINE
    // a big date (4.74): two boxes side by side, a 1 and a 7 in them
    box(2.25, 3.75, 12, 13.5, 1.5) + box(15.75, 3.75, 12, 13.5, 1.5) + `<path d="M7.25 8.5L9.25 7V14" ${sw(CURVE)}/><path d="M18.75 7H23.25L20.25 14" ${sw(SLANT)}/>`,
  ],
};
/** a hand's picture is the hand itself, drawn by the geometry with a standard size (twice its units, so already on whole dots). */
const hand_pic = (i) => {
  // the disc: its marker inside it, cut out, as a disc hand's window is (Okay, 18 Oct 2026, notes 2: "Preview icon shows
  // wedge outside the disc, correct it"); until 4.51.1 the marker ran from the disc's edge to 13, outside it
  const disc = G.HAND_SHAPES[i] === "disc" ? { len: 2.75, disc_d: 6, mark_len: 2, mark_w: 1.25 } : {};
  const p = G.hand_shape({ ...G.HAND_BASE, shape: i, len: 13, w: 2.2, tail: 3, tip: 4.5, feature: 4.4, feature_at: [0, 0, 0, 30, 0, 0, 45, 62, 62][i] || 0, round: 0, wall: 0, counter: 0, disc_d: 6, mark_len: 7, mark_w: 2.2, ...disc });
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
  const mark = G.paints_mark(h) && G.disc_mark(h), md = mark ? mark.svg(3, true) : "";      // a disc's painted mark, in its own colour (#300)
  const marked = (turn) => (mark ? `<path class="mark" d="${md}"${turn} fill="${to_hex(h.mark_c)}"/>` : "");
  return `<svg class="upright" viewBox="${f(b[0] - m)} ${f(-b[3] - m)} ${f(w + 2 * m)} ${f(high + 2 * m)}" aria-hidden="true"><path d="${d}" fill="currentColor" fill-rule="evenodd"/>${marked("")}<path class="lit"/>${centre("M-999 0L999 0")}</svg>`
    + `<svg class="lying" viewBox="${f(b[1] - m)} ${f(b[0] - m)} ${f(high + 2 * m)} ${f(w + 2 * m)}" aria-hidden="true"><path d="${d}" transform="rotate(90)" fill="currentColor" fill-rule="evenodd"/>${marked(' transform="rotate(90)"')}<path class="lit" transform="rotate(90)"/>${centre("M0 -999L0 999")}</svg>`;
};
/** the part of a hand that one of its numbers makes (#329; Okay's notes 2, 18 Oct 2026: "hovering a row lights its part
 *  on the hand's picture at the left"): what changes when that number changes. The hand is drawn again with the number a
 *  little less and a little more, and the part is where those differ from the hand as it is — so the length lights the
 *  tip, the width both edges, the tail its end, round ends the ends, the wall the hollow, and a number at 0 shows where
 *  its part would come (a counterweight's circle, a wall's ring). A step of 15 % of the value, or half the row's range
 *  when the value is 0 (a tenth hid a counterweight inside the hand). → a path in the hand's own space, or null. */
const hand_part = (h, row) => {
  const v = +h[row.key] || 0, d = v ? Math.abs(v) * 0.15 : (row.hi - row.lo) / 2;
  const base = G.hand_shape(h);
  let lit = null;
  for (const n of [v - d, v + d]) {
    if (n < row.lo - 1e-9 && n < v) continue;      // never below the row's least
    const other = G.hand_shape({ ...h, [row.key]: n }), changed = base.difference(other).union(other.difference(base));
    lit = lit ? lit.union(changed) : changed;
  }
  return lit && lit.bounds() ? lit : null;
};
// the Guides sign's ink traps (Okay, 15 Oct 2026, 02:42: "Guides icon needs them, see if you can figure out where"):
// where each of the four arms crosses the ring the two lines make four inside corners, and at a small size ink (light,
// here) pools in them and the crossing reads as a blot. A small round cut at each corner — sixteen in all — keeps the
// crossing open. They are holes in the sign's mask: at each corner, where an arm's edge meets the ring's edge.
const INK_TRAPS = (() => {
  const c = 9.25, r = 5.5, half = DENSE / 2, cut = 0.45, out = [];      // cut: 0.45, Okay's pick of four (0 · 0.2 · 0.3 · 0.45), 15 Oct 2026, 02:52: "this guides icon is the best"
  for (const edge of [r + half, r - half]) for (const side of [-half, half]) {
    const along = Math.sqrt(edge * edge - side * side);      // how far out along the arm the ring's edge is met
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const x = c + dx * along + (dx ? 0 : side), y = c + dy * along + (dy ? 0 : side);
      out.push(`<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${cut}" fill="black" stroke="none"/>`);      // no stroke: a mask's shapes take the sign's own stroke and would cut wider
    }
  }
  return out.join("");
})();
const EYE_RAYS = 24, EYE_RAY = 0.625;      // the eye switch's rays: how many, how thick (Okay, 15 Oct 2026, 03:41; 0.5 until 16 Oct: "thicker lines, just barely visibly on 100%, not like +1px")
// ── the showcase (Okay, 15 Oct 2026, 04:26 and 04:59) ──
// its sky: a 45° gradient, the backdrop's colour at this share of its light at the top left, black at the bottom right
const SKY_TOP = 0.3;
// its dial: 2/3 of the width of a portrait A4, centred on it; the A4 fitted in the window, centred ("a lovely proportion")
const SHOWCASE_PAGE = { w: 210, h: 297, dial: 2 / 3 };
// its sun: a day in twenty seconds, then sunrise again — rising at the left (from 270°), at midday from the top,
// setting at the right (90°), always 40° high (an autumn sun) on its ray; at sunrise and sunset its light fades in and
// out instead of the shadows growing long (05:43: "sunrise and sunset generate too extreme shadowage… keep sun constant
// on a ray and fade in and out the light"); `fade`: the share of the day's half it takes. A drag across the window
// moves it along that day, nothing else (04:59)
const SUN = { day: 20, rise: 40, fade: 0.45 };
// its spotlight: a pool of the backdrop's colour on the sky, behind the dial, a bit wider than it (size × its radius);
// the dial casts its shadow into it from `lift` mm above. Through the day: an oval at sunrise and sunset (stretch,
// the long way along the light), a circle at midday; the oval faintest and softest, midday brightest and almost crisp
const POOL = { size: 1.45, stretch: 1.4, soft: [0.06, 0.8], light: [0.08, 0.42], shade: [0.15, 0.55], lift: 1.5, least: 0.2 };      // least: the pool's colour is the backdrop's, lifted toward white until its lightness is at least this (0–1), so a very dim backdrop still makes a spotlight (#351, 4.77)
// the showcase's ring of shine (#351, 4.77; Okay's notes 2: "a ring of shine on the dial moving with the sun ('just a
// ring', two or three bands of brightness) that also shows the hands' shadows on dark dials"): three bands round a
// centre moved toward the sun, the middle one brightest, each a share of the dial's radius; screened onto the dial and
// the hands, so a dark dial lightens there and the hands' shadows read on it
const SHINE = { r: 0.66, toward: 0.3, bands: [[-0.07, 0.03], [0, 0.075], [0.07, 0.03]], width: 0.07 };      // bands: [where, from the ring's radius, as a share of R · how bright]
// the hands' bevels (#354, 4.77; notes 2: "a height simply shaded in a few tones of the hand's colour by the shadows'
// light … not 3d like all facets shifted"): each hand split along its length, the side the light falls on lighter, the
// other darker, by as much as the light comes from the side; preview only (R5, R26)
const BEVEL = { light: 0.22, dark: 0.26 };
const SHOW_DARKER = 1.25;                          // the showcase's shadows, this much darker than the user's setting (#351)
// the dial's travel into and out of the showcase: the only thing that moves (04:59 and 05:09: "only dial travels with ease")
const TRAVEL_MS = 900;
// a phone (Okay, 15 Oct 2026, 06:20): the preview's switches unfold their words this long after a tap on the backdrop
const HOLE_LIVE_MS = 1200;      // how long the centre hole's guide stays after its size last changed (#267); and the guides after a number was last slid (#249)
const WORDS_MS = 3000;
// a phone's drawer: the preview's share of the screen at the two heights a tap on the gripper jumps between (the
// drawer about half, then about three quarters); the least the preview and the drawer keep (px); and how much room for
// scrolling the drawer must have left under its title, tabs and pinned panes before those stay put
const SHEET = { shares: [0.42, 0.22], preview: 120, drawer: 160, room: 140 };
const POP_LINGER_MS = 1200, POP_FADE_MS = 120;      // the number popup: after its last use it fades, quickish (Okay, 17 Oct 2026); the stylesheet's --num-pop-linger and --num-pop-fade say the same
const SNAP_DEG = 2;        // a text ring's angle snaps to an index this close (#297)
const RING_ROWS = 5;       // the ring list shows this many rings (and the drawer) before it scrolls; its pill makes it taller or shorter (#256)
const SPIN_MS = 1600;      // Now and back: the big hands turn once, opposite ways, and land; the seconds hand goes straight there (07:36)
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
  // an (i) beside a setting's name: what it does, in a tag (#357). A ring holding a stem and a dot; quiet by its grey
  info: `<circle cx="8.25" cy="8.25" r="6" ${sw(CURVE)}/><path d="M8.25 7.25V11.25"/><circle cx="8.25" cy="4.75" r="1" fill="currentColor" stroke="none"/>`,
  // →: take what was typed (a Custom count, #357): the up arrow turned
  go: `<path d="M3.25 8.25H13.25M9.25 4.25L13.25 8.25L9.25 12.25"/>`,
  // a link, beside Copy link (Okay, 16 Oct 2026, #277): two open halves facing each other, a bar between (fit.mjs; look.py 0.5 %)
  link: `<path d="M6.75 4.75H4.25A3.25 3.25 0 0 0 4.25 11.25H6.75" ${sw(CURVE)}/><path d="M9.25 4.75H11.75A3.25 3.25 0 0 1 11.75 11.25H9.25" ${sw(CURVE)}/><path d="M5.25 8.25H10.75"/>`,
  // the Shadows switch, on 18 like Guides: a sphere lit from the upper right — its outline, its shade a crescent on the
  // lower left — and its shadow cast to the left on the ground, a flat ellipse it stands on (after a photograph Okay
  // sent, 15 Oct 2026, 02:13: "make it 2d icon like others… fit a square"). The outline goes through fit.mjs's rules
  // (CURVE, centre on a quarter, radius on a half); the shade and the shadow are filled, their ends on half points
  // 15 Oct, 02:42: mirrored (lit from the upper left, the shadow cast to the right) and its outline DENSE, as Guides',
  // the sign beside it on 18 ("ball stroke thickness too much… look at similar size icons, guides and such")
  shadows: `<circle cx="7.25" cy="9.75" r="5.5" ${sw(DENSE)}/><path d="M4.5 14.5A5.5 5.5 0 0 0 12 7A8 8 0 0 1 4.5 14.5Z" fill="currentColor" stroke="none"/>`
    + `<path d="M11.03 13.75A5.625 1.25 0 0 1 16.75 15A5.625 1.25 0 0 1 5.5 15A5.5 5.5 0 0 0 11.03 13.75Z" fill="currentColor" stroke="none"/>`,      // the ball sunk 2 into its shadow (Okay, 16 Oct 2026, on 4.44: "Shadow's ball sinks 2px down into its shadow"; it touched it from 4.42.4): the shadow the same ellipse (11.125 15, 5.625 × 1.25), the ball's disc cut out of it — it stands in front. Cut at the middle of the ball's line (5.5), so the cut's edge lies under the line: cut at its outer edge (6.125, 4.44.2) the two edges met and left a faint light seam round the ball (Okay: "a single faint line around the ball"). The rim crosses the shadow's top at 11.03 and at its left end
  // Okay's own mark, on 16 in the panel's first column (15 Oct 2026, 02:42: "my personal logo. Draw this like an
  // icon"): a ring; a 45° diagonal from ring to ring; through its crossing with them a level line to the right and an
  // upright one down; a cell between them (3.5 × 4, as in his drawing); a 45° slant from the cell's corner to the
  // ring. Every line ends on the ring's middle, where its round cap hides, as in his drawing (03:06: "a bit thinner
  // and better optimised"): the lines 1 (two dots on a 2× screen), centred on whole and half points, so every straight
  // edge lands on a whole dot; the ring 1.375 (it was 1.625; a ring reads lighter than a straight line of its width)
  logo: `<circle cx="8" cy="8" r="7" stroke-width="1.375"/><path d="M1.62 10.88L10.88 1.62M6.5 6H14.71M6.5 6V14.84M10 6V10H6.5M10 10L12.95 12.95" stroke-width="1"/>`,
  // the eye switch, at the preview's bottom right, on 30 — the whole inside of its 32 box (Okay, 15 Oct 2026, 03:41):
  // the iris and its centre kept (15.25, 15, r 2.75: "the only constant we carry over"); rays from the centre "like an
  // overexcited asterisk" — the lashes — run past the box, which cuts them; the eye itself is not drawn: its outline
  // (the 4.38 eye, lids a fifth higher, width kept) at its stroke width (CURVE) is knocked out of the rays, so the eye
  // is completed by absence; inside it nothing but the iris (03:52: "eye inside white, only iris remains there"). The rays are thin, 0.5, against the icon rules on purpose ("I want to see thin lines").
  // EYE_RAYS: 24 of the 12 · 16 · 24 · 32 tried (one ray straight up)
  eyebox: (() => {
    const cx = 15.25, cy = 15, lift = 5.25 * 1.2, n = EYE_RAYS;
    const lid = `M6.25 ${cy}C12.25 ${cy - lift} 18.25 ${cy - lift} 24.25 ${cy}C18.25 ${cy + lift} 12.25 ${cy + lift} 6.25 ${cy}Z`;
    const rays = Array.from({ length: n }, (_, k) => { const a = 2 * Math.PI * k / n; return `M${cx} ${cy}L${(cx + 25 * Math.sin(a)).toFixed(2)} ${(cy - 25 * Math.cos(a)).toFixed(2)}`; }).join("");
    return `<mask id="eye-cut" maskUnits="userSpaceOnUse" x="-2" y="-2" width="34" height="34"><rect x="-2" y="-2" width="34" height="34" fill="white" stroke="none"/><path d="${lid}" fill="black" stroke="black" ${sw(CURVE)}/></mask>`
      + `<path d="${rays}" stroke-width="${EYE_RAY}" stroke-linecap="butt" mask="url(#eye-cut)"/><circle cx="${cx}" cy="${cy}" r="2.75" fill="currentColor" stroke="none"/>`;
  })(),
  // the showcase switch, left of the eye (Okay, 15 Oct 2026, 04:26: "just the iris inside same box"): the eye's iris
  // alone, where it stands in the eye. In the showcase it is the way out: two of the eye's rays cross on it, an X run
  // out to the box (04:59: "iris becomes an x (2rayiris)"); 1, not the eye's 0.5, so it reads while faint
  // the showcase's hands key (07:40): the Hands section's sign drawn again for a 38 inside a round key, lines 1 as the
  // X beside it; the minute hand up, the hour hand at four, the hub a dot
  hands_key: `<path d="M19 19V8.75M19 19L25.5 23.25" stroke-width="1"/><circle cx="19" cy="19" r="1.75" fill="currentColor" stroke="none"/>`,
  // 18 Oct 2026 (notes 2: "the x on the showcase should not penetrate the iris. Lines stop at ghost eye distance"): the X
  // is cut by the eye switch's own absent eye — the same lids, knocked out — so its lines stop where the eye's rays do
  iris: (() => {
    const cy = 15, lift = 5.25 * 1.2;
    const lid = `M6.25 ${cy}C12.25 ${cy - lift} 18.25 ${cy - lift} 24.25 ${cy}C18.25 ${cy + lift} 12.25 ${cy + lift} 6.25 ${cy}Z`;
    return `<mask id="iris-cut" maskUnits="userSpaceOnUse" x="-2" y="-2" width="34" height="34"><rect x="-2" y="-2" width="34" height="34" fill="white" stroke="none"/><path d="${lid}" fill="black" stroke="black" ${sw(CURVE)}/></mask>`
      + `<circle cx="15.25" cy="15" r="2.75" fill="currentColor" stroke="none"/><path class="x" d="M-0.75 -1L31.25 31M31.25 -1L-0.75 31" stroke-width="1" stroke-linecap="butt" mask="url(#iris-cut)"/>`;
  })(),
  // the showcase's hint over Now: a line with a head at each end — the sun can be moved left and right (04:59); on 108
  // by 36, three times its first size, white with a glow (05:43: "can't see it… 3x size")
  // 18 Oct 2026 (notes 2: "connecting stem; straight-dashed-straight … divide current line into three"): the stem in
  // thirds of 32.5, the middle one dashed in five, its dashes square-ended (R33)
  both_ways: `<path d="M5.25 18.25H37.75M70.25 18.25H102.75M17.25 6.25L5.25 18.25L17.25 30.25M90.75 6.25L102.75 18.25L90.75 30.25"/><path d="M37.75 18.25H70.25" stroke-dasharray="3.25" stroke-linecap="butt"/>`,
  screen: `<rect x="2.75" y="3.25" width="10.5" height="7.5"/><path d="M8.25 10.75V13.25M5.75 13.25H10.75" ${sw(DENSE)}/>`,
  // the Guides switch, on 18: a target and its cross; its lines crowd, so DENSE. Okay's drawings (14 Oct 2026, 04:11):
  // guides: a target, its centre ring dashed in six, square-ended (a dash pattern is a texture, not line ends), ink
  // traps where the arms cross the ring. One drawing, on and off: only how much of it shows changes (Okay, 15 Oct
  // 2026, 03:41: "Guides off: icon should not change"; until 4.38.11 off was a hollow slash and a plain centre ring)
  guides: `<mask id="guides-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18"><rect width="18" height="18" fill="white" stroke="none"/>${INK_TRAPS}</mask>`
    + `<g ${sw(DENSE)}><g mask="url(#guides-cut)"><circle cx="9.25" cy="9.25" r="5.5"/><path d="M9.25 1.25V5.75M9.25 12.75V17.25M1.25 9.25H5.75M12.75 9.25H17.25"/></g>`
    + `<circle cx="9.25" cy="9.25" r="2" stroke-dasharray="1.25 0.844" stroke-linecap="butt" transform="rotate(-107.9 9.25 9.25)"/></g>`,
};
// play and pause, filled, on 12: the triangle a half point right of the middle, so its weight (not its box) is centred
// play: an arcade button seen from above, on 34 (Okay, 14 Oct 2026, 23:55: "imitate a arcade button, top view, add
// shadows and highlights in basic svg sausage shapes. 3 colors and a black outline"; 15 Oct, 00:18: "fatter halfcircle
// sausages and a black even outline… the sausage thickness is equal to outer black ring"; 00:32: "Shadows grow until
// they touch the black"; 00:42: "Strokes on button; halved. Button size without the black bar is same size as dial
// tabs icon; black outline does not count but stays"). The red cap is as wide as a section tab's ring (rim(): 31,
// to its outer edge); an even black ring RING wide round it makes 34, a tab icon's box. On the cap two curved
// sausages as thick as the ring, touching it: light on the upper left, dark red on the lower right. Pressed — time
// running — they change places: lit from inside.
const ARCADE = (down) => {
  const RING = 0.75 * 2, CAP = RIM + CURVE / 2, R = CAP + RING, C = R, mid = CAP - RING / 2;      // 1.5 · 15.5 · 17 · the sausages' middle circle
  const arc = (from, to) => {      // a sausage along the circle of radius mid; angles: 0 = right, growing downward
    const p = (a) => `${(C + mid * Math.cos(a * Math.PI / 180)).toFixed(3)} ${(C + mid * Math.sin(a * Math.PI / 180)).toFixed(3)}`;
    return `M${p(from)}A${mid} ${mid} 0 0 1 ${p(to)}`;
  };
  const [light, dark] = down ? [arc(15, 135), arc(195, 315)] : [arc(195, 315), arc(15, 135)];
  return `<svg viewBox="0 0 ${2 * R} ${2 * R}" width="${2 * R}" height="${2 * R}" aria-hidden="true">`
    + `<circle class="arc-out" cx="${C}" cy="${C}" r="${R}"/><circle class="arc-cap" cx="${C}" cy="${C}" r="${CAP}"/>`
    + `<path class="arc-hi" d="${light}" stroke-width="${RING}"/><path class="arc-lo" d="${dark}" stroke-width="${RING}"/>`
    + `<filter id="play-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>`
    + `<path class="arc-play" d="${play_triangle(C, 0.45 * CAP)}" filter="url(#play-soft)"/></svg>`;
};
// the play triangle on the cap (Okay's notes, p. 14, #282; it takes the place of the beat's dot, 4.38.2): pointing
// right, its corners on a circle a bit less than half the cap's radius (0.45), centred on its ink — its centroid on
// the cap's middle, as a play sign is centred by eye. Soft: blurred "2 px" as a design tool counts a blur, a
// deviation of 1 here (a few dots of a 31-point cap, so the blur costs nothing worth a picture instead)
const play_triangle = (c, r) => {
  const p = (a) => `${(c + r * Math.cos(a * Math.PI / 180)).toFixed(3)} ${(c + r * Math.sin(a * Math.PI / 180)).toFixed(3)}`;
  return `M${p(0)}L${p(120)}L${p(240)}Z`;
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

// a ring's radius as a number row: what the radius button's pop-up shows, and the Resize pane's row. A numeral's
// radius can measure to its centre, its baseline or its top: the small menu beside the label, in the order Okay wrote
// them; what is stored is the place in G.ANCHORS (R9). A mark's or a band's, since 4.47 (#257, "resize from"), to its
// outer end (as always), its middle or its inner end: the same menu, a place in G.FROM.
const RADIUS_ROWS = {
  outer: num("r", "Outer radius", 0, 25, 0.05, { scope: "ring", menu: { key: "from", title: "What the radius measures to", items: [[0, "Outer"], [1, "Middle"], [2, "Inner"]] } }),
  numerals: num("r", "Centre radius", 0, 25, 0.05, { scope: "ring", menu: { key: "anchor", title: "What the radius measures to", items: [[1, "Baseline"], [2, "Ascender"], [0, "Centre"], [3, "Outer edge"], [4, "Inner edge"]] } }),      // the edges: tangent (#338, 4.53)
};
const radius_row = (R) => RADIUS_ROWS[G.has_text(R) ? "numerals" : "outer"];
// how big one thing of a ring is — its "inner" size, the number in the ring summary: a mark's length (a dot's Ø), a
// numeral's size, a band's width. As a number row: what the size button's pop-up shows (Okay, 13 Oct 2026).
const SIZE_ROWS = {
  len: num("len", "Length", 0.05, 10, 0.05, { scope: "ring" }), dot: num("w", "Ø", 0.02, 5, 0.01, { scope: "ring" }),
  numerals: num("size", "Size", 0.3, 8, 0.05, { scope: "ring" }), band: num("width", "Band width", 0.02, 25, 0.05, { scope: "ring" }),
};
const size_row = (R) => SIZE_ROWS[G.has_text(R) ? "numerals" : G.kind_of(R) === "band" ? "band" : G.SHAPES[R.shape] === "dot" ? "dot" : "len"];
const VALUE_PICS = {                               // a value button's drawing, at its size (36), centre 18. Its disc is the button's edge and, since the audit's second round, a line as heavy as the others (Okay, 14 Oct 2026: "same thicknesses"); outer edges where they were
  radius: `<circle class="disc" cx="18" cy="18" r="${18 - CURVE / 2}" ${sw(CURVE)}/><path d="M18 18.25H35.5" ${sw(LINE)}/><circle class="pivot" cx="18" cy="18.25" r="2"/>`,     // a radius, from the centre to the edge
  // scale: a small circle growing into the large one, joined by their two tangents (Okay's drawing, Asset_1.svg, 13 Oct
  // 2026). Level since beta 4.41.13: both centres on the radius button's radius line (18.25), small left, large right
  // (Okay, 15 Oct 2026, 10:39, of the variants: "C, but tiny bit far apart for scale circles. Same size."): r 8.5 and
  // 15, centres 11.5 apart (C was 10.875; the grid allows 11 or 11.5), placed by fit.mjs; the small one's edge on the
  // button's, the large one 0.56 past it on the right. The hull (both circles and what lies between the tangents)
  // fills when the button is pressed (Okay's drawing, 14 Oct 2026). Tangents and hull computed from the circles.
  size: `<path class="hull" d="M4.45 11.24L12.27 5.88A15 15 0 1 1 12.27 30.62L4.45 25.26A8.5 8.5 0 0 1 4.45 11.24Z"/><circle class="disc" cx="20.75" cy="18.25" r="15" ${sw(CURVE)}/><circle class="small" cx="9.25" cy="18.25" r="8.5" ${sw(CURVE)}/><path class="tangent" d="M4.45 11.24L12.27 5.88M4.45 25.26L12.27 30.62" ${sw(SLANT)}/><path class="dark" d="M9.25 18.25H20.75" ${sw(LINE)}/><circle class="pivot" cx="20.75" cy="18.25" r="2"/>`,
};

// a language in the list, by its name; on its button, by two letters ("zh-Hans" → ZH; the font's own choice → "Lang.")
const FONT_DARK_KEY = "dial-tool-font-dark";      // the font sheet's ground, light or dark, kept for the session (#276)
const LANG_NAMES = { default: "As the font sets it", tr: "Turkish", nl: "Dutch", de: "German", pl: "Polish", ro: "Romanian", ca: "Catalan", ar: "Arabic", fa: "Persian", "zh-Hans": "Chinese, simplified", ja: "Japanese" };
const lang_short = (code) => (code === "default" ? "EN" : code.slice(0, 2).toUpperCase());      // none chosen: EN, what the font sets by itself (#273, 4.51; Okay's notes, p. 12); "Lang." until 4.50.2: the button said what it was for (Okay, 13 Oct 2026: "Lang.", case and point as written; "LAN" before, a dash before that)

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
const with_text = kind_in("numerals", "text");
const nudgeable = kind_in("ticks", "markers", "numerals", "text");      // what has positions of its own to nudge: all but a band (4.78, #349)      // rings that draw words: numerals, and a text ring (#297)
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
const cap_rows = (S) => S.ui_hand === G.top_hand(S) && (S.ha_second.on || S.ha_cap_top);      // the cap's size and colour: under the hand it belongs to (#262)

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
    // every coloured part on the plate, in one list; a band's sectors one by one. Folded (as it starts, #270), its line
    // shows the colours that fit on it as tiny swatches (Okay, 16 Oct 2026: "when compacted: show all the colors that
    // fit in that line as tiny swatches. Default: compacted")
    hdr("Colours", { folded: true, summary: (S, tool) => tool.dial_colours(false).map((c) => ({ c })) }),
    custom("colours"),
    // under Colours, last in the Dial tab: back to the opener, the whole dial, with a warning beside it (Okay, 16 Oct
    // 2026, 10:46: "under the dial tab under colors. And a warning should be placed near it. Not under the dial like a
    // view option! That is dangerous"). Open, its button stands on the heading line and the warning under it; folded,
    // the line says Reset and nothing else (Okay, 16 Oct 2026, #269)
    hdr("Reset", { folded: true }),
    custom("reset_go", { head: true }),
    custom("reset"),
    custom("reset_blank"),                         // a blank face: for whoever wants to start from nothing (Okay, 18 Oct 2026, notes 2)
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
    // first visit: every pane under the pinned part folded, its line saying what is in it (Okay, 16 Oct 2026, #270)
    // a numerals ring opens with its font (Okay, 16 Oct 2026, #296: "Move fonts top of adjustments in rings that
    // involves fonts"); at the end of the page until 4.47
    // a text ring's words come first (#297, 4.48): what it says, then its font
    hdr("Text", { folded: true, show: kind_in("text") }),
    txt("custom", "Text", { show: kind_in("text") }),
    // the Type pane: open, its heading goes and the font box moves up beside the eye; folded, it says the font, its
    // style and size (Okay, 18 Oct 2026, notes 2: "When expanded, type block header disappears and type block moves up";
    // "Type boxes, when they are collapsed, should have summaries like others")
    hdr("Type", { folded: true, bare: true, show: with_text, summary: (S, tool) => { const R = tool.ring(), f = tool.catalog.get(R.ps); return [R.family, f && f.style, `size ${fmt(R.size, 0.01)}`].filter(Boolean); } }),      // filter: a font not in the catalog has no style (4.54 broke selecting such a ring; 4.55)
    custom("font", { show: with_text }),
    // then Resize (Okay's notes, p. 9, #257: "a proper pane below the quick size and radius buttons … shown first"):
    // how big one thing is — the size button's number — and the radius, with what it measures to: for marks and bands
    // the outer end (as always), the middle or the inner end ("resize from"); for numerals the anchor (13 Oct 2026)
    hdr("Resize", { folded: true }),
    num("len", "Length", 0.05, 10, 0.05, { show: marks_with("bar", "wedge", "file") }),
    num("w", "Ø", 0.02, 5, 0.01, { show: marks_with("dot"), id: "ring-w-dot" }),
    num("width", "Band width", 0.02, 25, 0.05, { show: kind_in("band") }),      // a numeral's size stays in the font box, among the type's settings (and in the size button's popup)
    { ...RADIUS_ROWS.outer, show: kind_in("ticks", "markers", "band") },
    { ...RADIUS_ROWS.numerals, show: with_text },
    hdr("Sector colours", { folded: true, show: (R) => G.kind_of(R) === "band" && G.positions_of(R).length > 1 }),
    custom("sectors", { show: (R) => G.kind_of(R) === "band" && G.positions_of(R).length > 1 }),
    // what one mark is comes first (Okay, 13 Oct 2026: "moves up to the top"), then where the marks are
    hdr("Shape", { folded: true, show: kind_in("ticks", "markers") }),
    pick("shape", "Shape", G.SHAPES.slice(0, 3), PICS.shape, { show: kind_in("ticks", "markers") }),
    num("w", "Width", 0.02, 5, 0.01, { show: marks_with("bar", "wedge", "file") }),      // a dot's Ø, and a mark's length, stand in Resize (4.47)
    num("taper", "Inner width ×", 0, 2, 0.01, { show: marks_with("wedge") }),
    num("wall", "Hollow wall", 0, 1.5, 0.01, { show: kind_in("ticks", "markers") }),
    // the ends belong to the shape: nested under it, no pane of their own (Okay, 13 Oct 2026)
    num("round_out", "Round outer", 0, 2, 0.01, { show: marks_with("bar", "wedge", "file") }),
    num("round_in", "Round inner", 0, 2, 0.01, { show: marks_with("bar", "wedge", "file") }),
    custom("round_ends", { show: marks_with("bar", "wedge", "file") }),
    // Positions (Okay's notes, p. 5, #251, 4.50.1): at the left a round preview of the ring's positions, like the hand's
    // box — the used ones as marks, the skipped ones faint, the first one marked; beside it the numbers as quiet rows
    // (R15 form B: "none of these need slider"), their sliders in the controller a name or a number opens
    // Positions, drawn (Okay's notes 2, 18 Oct 2026, #357: "The new positions pane just dropped. Preview big, controls
    // smaller. Offset and skip need tooltip details"): the round preview at the left, large, its first position and
    // its span's end dragged round it; beside it two columns of small controls, Count · Every as menus (1, 2, 3 …
    // then Custom, a typed field with →), Offset · Start · Span as number blocks, Skip those a tick with an (i)
    hdr("Positions", { folded: true, cls: "positions" }),
    custom("ring_positions"),
    custom("num_menu", { key: "count", text: "Count", lo: 1, hi: 360, items: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 36, 48, 60, 72, 90, 120, 180, 240, 300, 360] }),
    custom("num_menu", { key: "every", text: "Every", lo: 1, hi: 60, items: [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30] }),
    num("offset", "Offset", 0, 59, 1, { whole: true, block: true, tip: "Which of every few is used: with Every 3, Offset 1 takes the 2nd, 5th, 8th…" }),
    chk("invert", "Skip those", { tip: "Turns it over: the positions Every and Offset take are left out, the others drawn" }),
    num("start", "Start", -180, 180, 0.5, { block: true, suffix: "°", trim: true }),
    num("span", "Span", 1, 360, 1, { block: true, suffix: "°", trim: true }),
    // Give way (Okay's notes, p. 4, #258, 4.50.2: "what's happening should be visible here"): Skip where and Knock out
    // as side tabs, the open one lit white and attached to a white-bordered square that shows what the choice does, a
    // drawing in the icons' style; the choices at its foot as radio buttons; Clearance a quiet row under them (R15 B),
    // shown only when something is knocked out (R16)
    hdr("Give way to rings above", { folded: true, summary: (S, app) => { const R = app.ring(); return [G.SKIP_FROM[R.skip], G.KNOCK_FROM[R.knock], R.knock ? `clearance ${fmt(R.clear, 0.01)}` : ""]; } }),
    custom("give_way"),
    hdr("12 o’clock · first position", { folded: true, show: kind_in("markers") }),
    pick("twelve", "Style", G.TWELVES, PICS.twelve, { show: kind_in("markers") }),
    num("twelve_scale", "Scale ×", 0.5, 2.5, 0.05, { show: (R) => G.kind_of(R) === "markers" && R.twelve !== 3 }),
    num("twelve_gap", "Gap", 0, 3, 0.05, { show: (R) => G.kind_of(R) === "markers" && R.twelve === 1 }),
    hdr("Numerals", { folded: true, show: numerals_only }),
    pop("labels", "Labels", G.LABEL_SETS.map((s) => s[0]), { show: numerals_only, head: true }),      // head: a pane's main selector stands on its heading line, without a name of its own (Okay, 12 Oct 2026)
    txt("custom", "Custom", { show: labels_are("Custom") }),
    info("Commas between labels: one label for each position, the rest stay empty.", { show: labels_are("Custom"), under: true }),      // on the field's column (Okay, 18 Oct 2026, notes 2: "aligned left with said block")      // Faruk Koç, 16 Oct 2026: "MLB" with Count 12 drew once and nothing said why (#298; a text ring is #297)
    num("num_from", "First number", -1000, 1000, 1, { show: labels_are("Numbers") }),
    num("num_step", "Step", -100, 100, 1, { show: labels_are("Numbers") }),
    num("num_digits", "Digits", 0, 4, 1, { whole: true, show: labels_are("Numbers") }),
    num("num_again", "Start again after", 0, 60, 1, { whole: true, show: labels_are("Numbers") }),      // positions; 0 = never
    info("0 counts on. 12 with first 5, step 5: 5 to 60, then 5 again.", { show: labels_are("Numbers") }),
    pick("mode", "Placement", G.MODES, PICS.mode, { show: with_text }),
    hdr("Band", { folded: true, show: kind_in("band") }),
    num("fill", "Fill % of step", 1, 100, 1, { show: kind_in("band") }),      // its width stands in Resize (4.47)
    // one numeral or one mark of its own (#252; every kind but a band since 4.78, #349: "Each marker selectable and
    // editable … a tick can grow or become anything else, a wedge"): which one — picked in the list, or on the dial, a
    // first press choosing the ring and a second the one pressed — and its own radius, angle, turn and size; a mark
    // also its own shape. The one chosen is outlined on the dial while this pane is open
    hdr("Nudge one numeral", { folded: true, show: nudgeable, title: (R) => (G.has_text(R) ? "Nudge one numeral" : "Nudge one mark") }),
    custom("nudge", { show: nudgeable }),      // which one, and Reset
    // its four adjusters, number rows on the numeral chosen above (Okay's notes, p. 6–7, #252, beta 4.45.2: "every
    // adjuster gets ±; angle and radius get sliders"): each a full row, its name opening the popup (#249)
    num("dr", "Radius ±", -3, 3, 0.05, { scope: "nudge" }),
    num("da", "Angle ± °", -30, 30, 0.1, { scope: "nudge" }),
    num("rot", "Rotate °", -180, 180, 1, { scope: "nudge" }),
    num("s", "Size ×", 0.2, 3, 0.01, { scope: "nudge" }),
    seg("shape", "Shape", ["As the ring", "Bar", "Wedge", "Dot"], { scope: "nudge", id: "nudge-shape", show: () => tool && tool.ring() && !G.has_text(tool.ring()) }),      // a mark's own shape (4.78)
  ],
  Hands: [
    custom("hands_bar", { pin: true, bar: true }),      // bar: one line of its own, always in view: All hands · Show hands · Motion
    custom("hand_tabs", { pin: true, bar: true }),      // under it, always in view: which hand the panes below are about (Okay, 12 Oct 2026: "acts as a tab system for what's below")
    // the Show box (#261, 4.46; Okay's notes, p. 2): under the tabs, on top of the grey page, Show — the tab says which
    // hand, so the hand's name line goes and everything under it is the tab's content: a pane with no heading (headless)
    custom("show_box", { ...H, bar: true }),
    hdr("One hand", { headless: true }),
    // one pane for a hand (Okay's drawings, 13 Oct 2026): at the left a box with the hand itself, as it is now; beside
    // it everything that makes it — its shape (one line of tiles that opens; a plus for a shape of one's own, later),
    // then its numbers and its colour. So what a number changes is seen right beside it, and on the dial at the right.
    // side: the row stands beside the box · short: the label when there is little room for it.
    custom("hand_detail", { ...H }),
    col("c", "Colour", { ...H, side: true }),      // first beside the box (Okay's notes, p. 18, #250: "Colour to the top, Cap at the end")
    num("len", "Length", 0.5, 30, 0.05, { ...H, side: true }),      // a disc's: where its marker's outer end is
    num("disc_d", "Disc Ø", 0.5, 30, 0.05, { ...H, side: true, show: hand_is("disc") }),
    // the marker: cut out of the disc, named "Hole" (Okay, 16 Oct 2026: "work as holes now, perfect, just call it
    // that"), or painted on it in a colour of its own, named "Mark" (#300, 4.45.4: "Mark if also possible easily");
    // its rows say which (say: their names as [whole, short], by the choice)
    seg("mark_as", "Marker", ["Hole", "Mark"], { ...H, side: true, show: hand_is("disc") }),
    seg("mark", "Hole", G.SHAPES.slice(0, 3), { ...H, side: true, say: (T) => [T.mark_as === 1 ? "Mark" : "Hole"], show: hand_is("disc") }),      // the markers ring's shapes (#164)
    num("mark_len", "Hole length", 0.05, 10, 0.05, { ...H, side: true, short: "Hole L", say: (T) => (T.mark_as === 1 ? ["Mark length", "Mark L"] : ["Hole length", "Hole L"]), show: hand_is("disc") }),
    num("mark_w", "Hole width", 0.02, 5, 0.01, { ...H, side: true, short: "Hole W", say: (T) => (T.mark_as === 1 ? ["Mark width", "Mark W"] : ["Hole width", "Hole W"]), show: hand_is("disc") }),
    col("mark_c", "Mark ink", { ...H, side: true, show: (T) => G.paints_mark(T) }),      // "ink": "Mark colour" is longer than the names' column (Counter Ø)
    chk("mark_in", "Inside the disc", { ...H, side: true, show: hand_is("disc") }),      // #344 (Okay, 18 Oct 2026: "Window is always inside disc hands"); on for a hand made a disc here, off in older links
    num("w", "Width", 0.02, 4, 0.01, { ...H, side: true, show: (H) => G.HAND_SHAPES[H.shape] !== "disc" }),
    num("tail", "Tail", 0, 10, 0.05, { ...H, side: true, show: (H) => G.HAND_SHAPES[H.shape] !== "disc" }),
    num("round", "Round ends", 0, 2, 0.01, { ...H, side: true, short: "Round", show: hand_is("baton", "pencil", "sword", "arrow", "syringe", "breguet", "lollipop", "file", "disc") }),      // a disc: its marker's ends
    num("tip", "Tip length", 0, 10, 0.05, { ...H, side: true, short: "Tip", show: hand_is("pencil", "sword", "arrow", "syringe", "breguet") }),
    num("feature", "Head width", 0, 6, 0.05, { ...H, side: true, short: "Head W", show: hand_is("arrow", "syringe") }),
    num("feature", "Ring · disc Ø", 0, 6, 0.05, { ...H, side: true, short: "Ring Ø", show: hand_is("breguet", "lollipop") }),
    num("feature_at", "Widest at %", 0, 100, 1, { ...H, side: true, short: "Widest %", show: hand_is("dauphine") }),
    num("feature_at", "Barrel from %", 0, 100, 1, { ...H, side: true, short: "Barrel %", show: hand_is("syringe") }),
    num("feature_at", "Ring · disc at %", 0, 100, 1, { ...H, side: true, short: "Ring at %", show: hand_is("breguet", "lollipop") }),
    num("counter", "Counterweight Ø", 0, 4, 0.05, { ...H, side: true, short: "Counter Ø" }),
    num("wall", "Hollow wall", 0, 1, 0.01, { ...H, side: true, short: "Wall" }),
    // the cap is part of the seconds hand (Okay's notes, p. 1, #262, beta 4.43; until then a pane of its own for all
    // three): its rows under the seconds hand's own. With no seconds hand they stand under the topmost hand's, where
    // the cap is off until "Cap on this hand" is ticked (G.cap_shows)
    chk("ha_cap_top", "Cap on this hand", { side: true, show: (S) => !S.ha_second.on && S.ui_hand === G.top_hand(S) }),
    num("ha_cap", "Cap Ø", 0, 4, 0.05, { side: true, show: cap_rows }),
    col("c_cap", "Cap colour", { side: true, show: cap_rows }),
    // its shapes: a row of thumbs under the box and every row beside it, from the box's left to the end (4.46.4; Okay:
    // "Put hand type as a row spanning preview to end, after wall"; under the box in 4.46.3), the SVG tile last
    pick("shape", "Shape", G.HAND_SHAPES, hand_pic, { ...H, thumbs: true, skip: [9] }),      // every shape but "file": the SVG tile stands for it
  ],
  Date: [                                          // "Windows" on its tab: up to four holes in the plate
    custom("window_cards", { pin: true, bar: true }),      // pin: always in view, like the hand tabs (Okay, 13 Oct 2026) ·         // four cards, 12 · 3 · 6 · 9: where each window is, and tabs for the panes below (Okay, 12 Oct 2026)
    // the cards are tabs only; a window is shown by the tick on its heading line (Okay, 13 Oct 2026, after trying a
    // small switch on each card: "unnecessarily complex… enable window tickmark is the way to go. leave them as tabs")
    custom("show_box", { ...W, bar: true }),      // the Show box, as a hand's (#261): its tick, "Show this window" on the heading line until 4.46
    // the Windows page (#263, 4.46.1; Okay's marks on three mock-ups, 16 Oct 2026): first where it is and what it
    // shows, under Window at x; then the hole itself under Shape — its shape buttons on that heading's line, then
    // Radius ("ok but below shapes"), its sizes, its colours on one line, its text and font, its frame
    // the place buttons on its heading's line (Okay, 16 Oct 2026, on the mock-ups: "If it's taller so be it, enlarge
    // buttons. And 3 6 9 12 are circular buttons now")
    hdr("Window", { title: (S) => `Window at ${G.window_place(G.windows_of(S)[S.ui_window])}` }),      // "Position" under it in 4.46.1–2 (Okay: "Delete position name, that works without")
    custom("window_at", { ...W, head: true, show: win_on, text: "Position" }),
    pick("kind", "Complication", G.WINDOW_KINDS, (i) => icon(PICS.window[i], 30, 21), { ...W, small: true, show: win_on }),
    info("Follows the time shown: AM · PM beside the time, under the panel.", { ...W, show: win_is("am · pm") }),
    // its picture (4.73; the disc sketches C): Sky as before · Half, a half-round hole over a two-colour disc · Band, the day's colours along a strip
    seg("look", "Picture", G.PICTURES["am · pm"], { ...W, id: "window-look-day", show: win_is("am · pm") }),
    // its picture (4.73, #346; the disc sketches B: "All are good"): Arch as before · Phase, the moon lit as it is, in
    // the disc's colour, its dark side in the shade's, the sky in the picture's · Line, its outline and dark side in one ink
    seg("look", "Picture", G.PICTURES["moon phase"], { ...W, id: "window-look-moon", show: win_is("moon phase") }),
    num("age", "Moon age, days", 0, 29.5, 0.1, { ...W, show: (T) => win_is("moon phase")(T) && !T.follows }),
    info("0 new moon · 14.8 full.", { ...W, show: (T) => win_is("moon phase")(T) && !T.follows }),
    // the hole: its shape (buttons on the heading's line, #265), where and how big, its colours (one line, #266), what
    // is written in it, its frame. Folded on a first visit, as every pane but the one the tab is about (#270); its shape
    // buttons stay on its heading line
    hdr("Shape", { ...W, folded: true, show: win_on }),
    custom("window_shape", { ...W, head: true, text: "Shape", show: win_on }),
    num("r", "Radius", 2, 18, 0.05, { ...W, show: win_on }),
    // width over height, two rows, a LINK pill on the line between them (Okay's notes 2, #358: "Two sliders on one line
    // is not a good idea … two stories tall … like in illustrator"); one line from 4.46 to 4.55 (#265)
    num("w", "Width", 0.5, 8, 0.05, { ...W, show: shape_is("rectangle", "arc", "pair"), link: "wh_link" }),      // a big date's: both holes together (4.74)
    num("h", "Height", 0.5, 5, 0.05, { ...W, show: shape_is("rectangle", "arc", "pair") }),
    num("w", "Width", 0.5, 8, 0.05, { ...W, show: shape_is("arch", "half"), id: "window-w-Width-arch" }),      // its own id: the line above has window-w-Width
    num("w", "Ø", 0.5, 8, 0.05, { ...W, show: shape_is("circle", "polygon") }),
    num("sides", "Sides", 3, 12, 1, { ...W, whole: true, show: shape_is("polygon") }),
    num("round", "Corner", 0, 2, 0.05, { ...W, show: shape_is("rectangle", "polygon", "pair") }),
    chk("turn", "Turn it with its radius", { ...W, show: (T) => T.on && G.window_shape(T) !== "arc" }),
    info("Only off the quarters: at 4 it turns 30°, at half past four 45°.", { ...W, show: (T) => T.on && T.turn && G.window_turn(T) === 0 && G.window_shape(T) !== "arc" }),
    chk("text_turn", "Turn the text with it", { ...W, nest: true, show: (T) => T.on && T.turn && G.window_shape(T) !== "arc" && ["date", "day"].includes(G.WINDOW_KINDS[T.kind]) }),
    custom("window_colours", { ...W, show: win_on }),      // the disc under the hole · the frame · what an am · pm or moon window pictures, on one line (#266)
    // following the bar's date (4.62): a date or day window says it, a moon window shows its age; its typed text or age
    // waits underneath, for when it doesn't follow
    chk("follows", "Follows the date in the bar", { ...W, show: win_is("date", "day", "moon phase", "big date") }),
    // its neighbours (4.74; the disc sketch D1): the disc's places either side of the shown one, where the hole lets them — a tall hole at 3 or 9, a wide one at 12 or 6
    chk("neighbours", "Its neighbours show where the hole allows", { ...W, show: win_is("date", "day") }),
    seg("names", "Names", ["EN", "TR", "DE", "FR", "IT"], { ...W, show: (T) => T.on && T.follows && G.WINDOW_KINDS[T.kind] === "day" }),
    // physics (4.72, #346: "their discs obey physics or not, chosen by the user"): on, a disc must end inside the case —
    // passing it, its outer guide shows red and this says by how much; off, it may (a face on a screen)
    chk("physics", "Its disc stays inside the case", { ...W, show: win_is("date", "day", "am · pm") }),
    info((T) => `Its disc passes the case by ${tool ? tool.disc_past().toFixed(2) : "?"} mm: move the window in, or untick to let it.`, { ...W, nest: true, show: (T) => win_is("date", "day", "am · pm")(T) && T.physics !== false && tool && tool.disc_past() > 0 }),
    txt("text", "Text", { ...W, show: (T) => win_is("date", "day", "big date")(T) && !T.follows }),
    custom("font", { ...W, show: win_is("date", "day", "big date") }),      // its own font, or the top numerals ring's (the start)
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
    // a watch face for a Wear OS watch (4.67; farukahmet's PR #1, Okay, 18 Oct 2026: "All three great on pull request"):
    // the APK button, the face's name (and so its package, so several dials can live on one watch), sideloaded
    custom("export_wearos"),
    custom("wearos_name"),
    custom("wearos_pkg"),
    hdr("Print", { folded: true }),                                  // what only the printed or etched dial needs (was "For production" until beta 4.19)
    chk("out_production", "Mono print mask"),
    chk("out_mirror", "Mirrored, for toner transfer"),
    // a print sheet (4.75, #348; Okay's notes 2: "print page preparation, preview, copies, stacks — something simple,
    // elegant, efficient and paper savingly"): one page of copies at true size, packed straight or staggered —
    // whichever holds more — mirrored and as a mask as the two ticks above say; a drawing of the page beside the button
    custom("print_sheet"),
    seg("out_paper", "Paper", PAPERS.map((p) => p[0])),
    num("out_copies", "Copies", 0, 60, 1, { whole: true }),
    info((S) => sheet_says(S), { scope: "global" }),
    num("out_gap", "Room between", 0, 20, 0.5),
    chk("out_cutline", "A cut line round each"),
    hdr("Link to this dial", { folded: true }),
    custom("link_copy", { head: true }),           // Copy link, flush right on the heading line, open or folded (#277)
    custom("link"),
    hdr("Settings file", { folded: true, title: () => tool && tool.loaded_name ? `Settings file · ${tool.loaded_name}` : "Settings file" }),      // after Load it names the file (#279)
    custom("settings"),
    hdr("Log", { folded: true }),
    custom("log"),
    hdr("Gallery", { folded: true }),                                // under everything else: dials to open and take apart (Okay, 13 Oct 2026), the five first examples among them
    // your own dials first (4.76, #347; Okay's notes 2: "Instances of a watch: a save instance button; a gallery of them"):
    // Save this dial keeps it, with a small picture, in this browser; each opens as a Gallery card does, or goes
    custom("instances"),
    custom("gallery"),
  ],
};
/** what a print sheet will hold, in words (4.75). */
const sheet_says = (S) => {
  const L = sheet_layout(S), n = L.places.length;
  if (!n) return `A ${S.dial_d} mm dial doesn't fit on ${L.paper[0]}.`;
  return `${n} ${n === 1 ? "copy" : "copies"} on ${L.paper[0]}${L.staggered ? ", rows staggered" : ""}${+S.out_copies > 0 && +S.out_copies > L.fits ? ` — ${L.fits} fit` : +S.out_copies > 0 ? "" : " — as many as fit (Copies 0)"}.`;
};
// the day slider's steps: every hour, and 10:10 — hands spread like a smile, the pose watches are photographed in
const DAY_STEPS = [...Array.from({ length: 12 }, (_, h) => [h * 3600, String(h || 12), false]), [10 * 3600 + 10 * 60, "10:10", true]].sort((a, b) => a[0] - b[0]);
// how fast time runs: one slider from half speed to 720×, on a log scale, with humps on its track at 1× (larger),
// 6×, 60× and 720× (Okay, 14 Oct 2026, 23:26: "a regular sliding track with humps on it on 1 (larger), 6 then
// logarithmicly up to 720"; "slightly slower is acceptable": it starts at 0.5×). Near a hump the slider snaps onto
// it. The speed is written beside the track, not on its thumb, which a finger covers.
// Slow motion is back below 1× (Okay's notes, p. 15, #283; removed 15 Oct 2026, 01:59): the track's first part, two
// thumbs wide, holds four steps — 0.1 · 0.25 · 0.5 · 1× ("not many steps") — and the thumb snaps onto them; from 1×
// the rest runs on a log scale to 720× as before. The thumb starts at 1×; the ends are marked 0.1X and 720X.
const SPEED_SLOW = [0.1, 0.25, 0.5, 1], SPEED_HI = 720;
/** a speed → 0 to 1 along the track, whose first `split` holds the slow steps */
const speed_place = (k, split) => (k < 1 ? split * SPEED_SLOW.reduce((best, x, i) => (Math.abs(x - k) < Math.abs(SPEED_SLOW[best] - k) ? i : best), 0) / (SPEED_SLOW.length - 1) : split + (1 - split) * Math.log(k) / Math.log(SPEED_HI));
/** …and back: a place on the track → its speed (a slow step, or anything from 1× up) */
const speed_at = (p, split) => (p < split ? SPEED_SLOW[Math.round(p / split * (SPEED_SLOW.length - 1))] : SPEED_HI ** ((p - split) / (1 - split)));
const speed_word = (k) => (k >= 10 ? String(Math.round(k)) : String(+k.toFixed(k < 1 ? 2 : 1)));      // the figures: 0.25, 1, 2.5, 60
const frac = (x) => ((x % 1) + 1) % 1;
const PULSE_MOST = 6;      // the play button's pulse: at most this many a second, unless the movement's own beat is more (#282; 3 in 4.44 — Okay: "Play button can go faster in animation"; the three-flash limit is for flashes over a large part of the view, not a 31-point button)
const PULSE_RISE = 0.03;   // the triangle's flash: how much of it is the rise — next to nothing, a few milliseconds — before the eased fall (#308; Okay, 17 Oct 2026: "like a flash: zero to bright in milliseconds, then slow descent. but all very quickly"; a fifth until 4.49.2)
const PULSE_FLASH = 0.4;   // …and how much of a beat the whole flash takes (half until 4.49.2: "all very quickly")
// each unit's ink in Dial Mono, in em, from its outlines (fonts/ui/mono_font.py prints it): [left of the advance's
// start, width, top over the baseline, height]. The unit box is drawn round it (size_unit, #302)
const UNIT_INK = { mm: [0.062, 1.076, 0.56, 0.56], pt: [0.088, 1.035, 0.705, 0.885], in: [0.082, 1.032, 0.78, 0.78], lig: [0.029, 1.683, 0.78, 0.96], thou: [0.052, 2.262, 0.73, 0.74] };      // the play button's pulse: at most this many a second, unless the movement's own beat is more (#282)
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
const LENGTH_KEYS = { ring: G.RING_MM, hand: G.HAND_MM, window: G.WINDOW_MM, global: ["dial_d", "margin", "ha_cap", "dial_hole", "sh_hour", "sh_minute", "sh_second", "sh_cap", "sh_disc"], nudge: ["dr"] };
/** a row's label: its own words, or, with a menu beside it, the chosen item's word before the last of its own
 *  ("Centre radius" → "Baseline radius"). */
const label_of = (row, T) => (row.say ? row.say(T)[0] : row.menu ? `${(row.menu.items.find(([v]) => v === (T[row.menu.key] ?? 0)) || row.menu.items[0])[1]} ${row.text.split(" ").pop()}` : row.text);
// two measures that may be linked, so changing one keeps their ratio (#358; Okay's notes 2: "a link/unlink like in
// illustrator … other width-height or linkable stuff get this too"): its switch key, the pair, and when it applies
const LINKED_PAIRS = { window: [{ link: "wh_link", keys: ["w", "h"], when: (T) => ["rectangle", "arc"].includes(G.window_shape(T)) }] };
const day_look = (T) => (T && T.on && G.WINDOW_KINDS[T.kind] === "am · pm" ? T.look || 0 : -1);      // an am · pm window's picture (4.73), -1 for any other window
const moon_look = (T) => (T && T.on && G.WINDOW_KINDS[T.kind] === "moon phase" ? T.look || 0 : -1);      // a moon window's picture (4.73), -1 for any other window
const KIND_TAB_KEYS = Object.keys(G.WINDOW_BASE).filter((k) => !["on", "kind", "at", "at_deg", "r", "guide", "wh_link"].includes(k));      // what each complication keeps of its own (#328)
const HANDLE_R = 5.5, HANDLE_OUT = 14, HANDLE_REACH = 14;      // a guide handle (4.65): its half-size, how far beyond the ring's outer edge the angle handles stand, the radius a press reaches it within — screen points at any zoom
const TINY_EVERY = 200;                            // the Tiny Preview redrawn at most this often, in ms (#337)
const NUDGE_NEUTRAL = { dr: 0, da: 0, rot: 0, s: 1, shape: 0 };      // a numeral's or a mark's nudge, untouched (#252; shape, a mark's own, 4.78)
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
//   Scheme 2 (beta 4.43, #278): the link's text (G.link_text: lean, coded, squeezed) → deflate → Crockford's base 32,
//   after "2" — capitals and digits only (Okay, p. 14: "no dashes, no underscores"; a line breaks evenly anywhere in
//   it). A link of an older scheme is not read (R31): the First dial opens, with a note on the preview and in the log.

const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

// your saved dials (4.76, #347): in this browser only, newest first, at most INSTANCES_MOST
const INSTANCES_KEY = "dial-tool-instances", INSTANCES_MOST = 60;
const instances_read = () => { try { const v = JSON.parse(localStorage.getItem(INSTANCES_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
const instances_write = (list) => { try { localStorage.setItem(INSTANCES_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } };
/** a dial's small picture, as the Gallery's (gallery.mjs): every shape of its scene, no guides. */
function dial_picture(S, statik) {
  const R = S.dial_d / 2 + 0.6, hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, "0")).join("");
  const shapes = G.scene(S, statik, S.t, false).map((i) => `<path d="${(i.role === "hand" || i.role === "mark" ? G.turned(i.path, i.angle) : i.path).svg(2, true)}" fill="${hex(i.fill)}"${i.fill[3] < 1 ? ` fill-opacity="${i.fill[3]}"` : ""}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-R} ${-R} ${2 * R} ${2 * R}" aria-hidden="true">${shapes}</svg>`;
}

async function pack(S) {
  return `${G.LINK_SCHEME}` + G.base32(await through(new TextEncoder().encode(G.link_text(S)), new CompressionStream("deflate-raw")));
}

/** the part after # → { settings } for a dial, { old: scheme } for a link of an older scheme, or null. */
async function unpack(hash) {
  const kind = G.link_kind(hash);
  if (!kind) return null;
  if (kind.scheme !== G.LINK_SCHEME) return { old: kind.scheme };
  try {
    const settings = G.from_link_text(new TextDecoder().decode(await through(G.un_base32(kind.letters), new DecompressionStream("deflate-raw"))));
    return settings ? { settings } : null;
  } catch (e) {
    return null;
  }
}
const OLD_LINK_NOTE = "This link is from an older Dial Tool and can’t be opened: here is the First dial.";

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
    this.opened = structuredClone(this.S);      // the dial as it opened: a quiet number is grey until it differs from this (#250)
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
      // the window itself never zooms (Okay, 15 Oct 2026, 02:19: "never let us zoom into the interface. That stays
      // still, the zoom only applies to the dial on touches"). A pinch anywhere is refused to the browser: Safari's
      // gesture events (an iPad, a Mac trackpad in Safari) and ctrl + wheel (a trackpad pinch in Chrome). Inside the
      // preview the dial still zooms: its own listeners act on these before they reach here (preview_events). The
      // stylesheet does the same for fingers (touch-action on html and body), the page's viewport for iOS.
      for (const kind of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(kind, (e) => e.preventDefault(), { passive: false });
      document.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
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
        } else if (e.key.toLowerCase() === "g" && !e.repeat && !e.shiftKey) {      // G: guides on or off (Okay, 18 Oct 2026, notes 2)
          tool.set_value("global", "guides", !tool.S.guides);
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
  target(scope) { return scope === "ring" ? this.ring() : scope === "hand" ? this.hand() : scope === "window" ? this.window() : scope === "nudge" ? { ...NUDGE_NEUTRAL, ...(this.ring().nudge[this.nudge_at] || {}) } : this.S; }

  set_value(scope, key, value) {
    if (scope === "ring" && key === "start" && this.ring() && G.kind_of(this.ring()) === "text") value = this.snapped_angle(value);      // a text ring holds to the indices (#297)
    // what the radius measures to changes: the radius changes with it so nothing on the dial moves, only the dotted line
    // (#326; Okay, 18 Oct 2026, notes 2: "Nothing changed … just the dotted line moves"). Undo takes both back.
    if (scope === "ring" && (key === "anchor" || key === "from") && this.ring() && value !== (this.ring()[key] || 0)) this.ring().r = +G.radius_kept(this.ring(), key, value).toFixed(4);
    if (scope === "hand" && key === "shape" && G.HAND_SHAPES[value] === "disc") this.target("hand").mark_in = true;      // a disc made here keeps its window inside (#344); older links keep theirs as drawn
    if (scope === "nudge") {                       // the chosen numeral's own: a neutral value is not kept (#252)
      const R = this.ring(), n = { ...(R.nudge[this.nudge_at] || {}) }, all = { ...R.nudge };
      if (Math.abs(value - NUDGE_NEUTRAL[key]) < 1e-9) delete n[key]; else n[key] = +(+value).toFixed(4);
      if (Object.keys(n).length) all[this.nudge_at] = n; else delete all[this.nudge_at];
      return this.set_value("ring", "nudge", all);
    }
    const T = this.target(scope);
    if (JSON.stringify(T[key]) === JSON.stringify(value)) return;
    // a linked pair (#358, LINKED_PAIRS): the other one keeps their ratio, as in Illustrator
    const pair = (LINKED_PAIRS[scope] || []).find((p) => p.keys.includes(key) && T[p.link] && p.when(T));
    if (pair && T[key] > 0 && value > 0) { const other = pair.keys.find((k) => k !== key); T[other] = +(T[other] * value / T[key]).toFixed(4); }
    // the diameter, with "scale everything" ticked: every measure on the dial grows or shrinks by the same factor
    if (scope === "global" && key === "dial_d" && this.S.ui_scale && T.dial_d > 0 && value > 0) this.scale_with(T.dial_d, value);
    if (scope === "window" && key === "on" && value && !T.on && ["17", "MON"].includes(T.text)) T.follows = true;      // a window switched on with its starting text follows the date (4.62: "Default from system date"); one with typed text keeps it
    const restored = scope === "window" && key === "kind" && value !== T.kind ? this.kind_tab(T, value) : false;
    T[key] = value;
    if (scope === "ring") {
      if (!["c", "name", "guide"].includes(key)) this.static_dirty = true;      // (cs too: which sectors share a colour decides the shapes)
      if (key === "kind" || key === "name" || key === "on") this.fill_ring_list();
    } else if (scope === "window") {
      if (!["ink", "text_c", "disc_c"].includes(key)) this.static_dirty = true;
      if (key === "kind" && !restored) {           // a kind taken for the first time: a date shows a number, a day a word, so swap the untouched starting text
        if (G.WINDOW_KINDS[value] === "day" && T.text === "17") T.text = "MON";
        if (["date", "big date"].includes(G.WINDOW_KINDS[value]) && T.text === "MON") T.text = "17";
      }
    } else if (scope === "global") {
      const quiet = G.NOT_GEOMETRY.includes(key) || G.NOT_GEOMETRY_PREFIX.some((p) => key.startsWith(p));
      if (!quiet) this.static_dirty = true;
      if (key === "dial_d" || key === "margin") { if (this.fitted) this.fit(); }
      if (key === "date") this.sync_time();      // the bar's stacked date (4.62)
      if ((key === "bezel" || key === "strap" || key === "c_strap") && this.case_sync) this.case_sync();
      if (key === "dial_hole") {                  // its guide shows while it is being sized, whatever the guides are set to (#267)
        this.hole_at = performance.now();
        clearTimeout(this.hole_timer);
        this.hole_timer = setTimeout(() => this.render(), HOLE_LIVE_MS + 50);
      }
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
    if (this.pop && this.pop.at && !on("#colour-pop") && !on(".swatch, .colour, .backdropbox, .strapdot")) this.pop_close();
    if (this.guides_open && !$("#guide-list").hidden && !on(".guides")) this.guides_open(false);
    if (this.shadows_open && !$("#shadow-list").hidden && !on(".shadows")) this.shadows_open(false);
    if (this.bio_open && !$("#bio").hidden && !on(".about")) this.bio_open(false);
    if (this.unit_open && !$("#unit-menu").hidden && !on(".unit")) this.unit_open(false);
    if (this.iris_box && !on(".irisbox")) this.iris_open(false);
    if (this.lang_opens && !on(".langs")) for (const shut of this.lang_opens) shut(false);
    if (this.add_open && $("#add-menu") && !$("#add-menu").hidden && !on(".adder")) this.add_open(false);
    if (this.kind_open && $("#kind-menu") && !$("#kind-menu").hidden && !on("#ring-kind-square") && !on("#kind-menu")) this.kind_open(false);
    if (this.value_pop && !on("#value-pop") && !on(".valueb, .atmore, .popname")) this.value_pop_close();
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
      // .mast: the mark, the title and the version — what stays when the panel slides away (dial_alone(), 15 Oct 2026)
      el("header", {}, el("div", { className: "mast" }, this.logo_box(), this.title = el("div", { className: "title" }, el("h1", { textContent: "Dial Tool" }), el("span", { className: "quiet", textContent: G.VERSION }), el("a", { className: "quiet help", href: GUIDE, target: "_blank", rel: "noopener", textContent: "Help" }))), this.gallery_way(), this.unit_box()),
      this.tabs, this.pinned, this.form);
    this.finger_anchor(panel);

    this.svg = svg_el("svg");
    this.svg.setAttribute("class", "preview");
    this.backdrop = svg_el("rect");
    this.backdrop.setAttribute("width", "100%");
    this.backdrop.setAttribute("height", "100%");
    this.dial = svg_el("g");
    this.over = svg_el("g");                       // above the dial, same place and zoom: the outline of what the pointer is on
    this.over.setAttribute("pointer-events", "none");
    this.glow = ["glow under", "glow"].map((name) => { const line = svg_el("path"); line.setAttribute("class", name); this.over.append(line); return line; });
    this.picked = ["picked under", "picked"].map((name) => { const line = svg_el("path"); line.setAttribute("class", name); this.over.append(line); return line; });      // the numeral or mark Nudge works on (4.78)
    // the showcase's sky: over the backdrop, a gradient from black at the bottom up to the backdrop's colour, much
    // darkened; there always, seen only in the showcase (the stylesheet fades it in). Its colours are set in draw()
    const sky_defs = svg_el("defs"), sky = svg_el("linearGradient");
    sky.id = "show-sky";
    for (const [k, v] of [["gradientUnits", "userSpaceOnUse"], ["x1", "0"], ["y1", "0"], ["x2", "1"], ["y2", "1"]]) sky.setAttribute(k, v);
    this.sky_grad = sky;
    // the showcase's spotlight and the dial's shadow in it (draw_pool): two circles with soft-edged radial fills, in a
    // group that stands where the dial does (place())
    this.pool = svg_el("g");
    this.pool.setAttribute("class", "pool");
    this.pool.setAttribute("pointer-events", "none");
    this.pool_parts = ["show-light", "show-shade"].map((id) => {
      const g = svg_el("radialGradient"); g.id = id;
      const stops = [0, 1, 2].map(() => { const s = svg_el("stop"); g.append(s); return s; });
      sky_defs.append(g);
      const circle = svg_el("circle"); circle.setAttribute("fill", `url(#${id})`); this.pool.append(circle);
      return { circle, stops };
    });
    this.sky_stops = [0, 1].map((o) => { const s = svg_el("stop"); s.setAttribute("offset", String(o)); sky.append(s); return s; });
    sky_defs.append(sky);
    this.sky = svg_el("rect");
    for (const [k, v] of [["class", "sky"], ["width", "100%"], ["height", "100%"], ["fill", "url(#show-sky)"], ["pointer-events", "none"]]) this.sky.setAttribute(k, v);
    this.handles = svg_el("g");                    // the selected ring's handles on its guides (4.65, draw_handles), over everything on the dial
    this.handles.setAttribute("class", "handles");
    this.handle_events();
    this.bezel_g = svg_el("g");                    // a case round the dial, preview only (4.66, bezels.js), under it
    this.bezel_g.setAttribute("class", "bezel");
    this.bezel_g.setAttribute("pointer-events", "none");
    this.svg.append(sky_defs, this.backdrop, this.sky, this.pool, this.bezel_g, this.dial, this.over, this.handles);
    this.tip = el("div", { className: "tip", hidden: true }, el("span"));       // the name of what the pointer is on
    this.tip.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 20 10" width="20" height="10" aria-hidden="true"><path class="a" d="M0 0 L10 10 L20 0"/><path class="b" d="M0 0 L10 10 L20 0"/><path class="c" d="M-1 -3 L21 -3 L21 0 L10 9 L-1 0 Z"/></svg>');
    this.preview_events();

    this.time_field = el("input", { id: "time", className: "time", type: "text", title: "Time shown, h:mm:ss" });
    if (document.fonts) document.fonts.ready.then(() => { this.time_zeros = null; this.sync_time(); });      // Dial Time arrived: measure the time's ink again
    this.time_field.onchange = () => { const t = parse_time(this.time_field.value, this.S.t >= 43200); if (t !== null) this.set_time(t); else this.sync_time(); this.time_field.value = fmt_time(this.S.t); };      // "15:20" reads back as 3:20:00, PM
    // which half of the day: the hands can't say, an am · pm window can (it follows the time shown). Typing "15:20" or "3:20 pm" sets it too.
    this.half_button = el("button", { type: "button", id: "ampm", className: "half", title: "Morning or afternoon: an am · pm window follows it", onclick: () => this.set_time((this.S.t + 43200) % 86400) });
    // the date (4.62; Okay, 18 Oct 2026: "Date best set at the bar, short date, 07/10/28 style, stacked barlow medium or
    // bold, next to am, touching. Default from system date"): day, month and year stacked, touching AM · PM. A press opens
    // the system's date picker (an input under it, unseen); a date or day window that follows the date shows it. Until a
    // date is picked it is today's, wherever the dial is opened (S.date ""); Now brings today back.
    this.date_button = el("button", { type: "button", id: "date", className: "date", title: "The day the dial shows: a window that follows the date shows it" });
    this.date_lines = [el("span"), el("span"), el("span")];
    this.date_button.append(...this.date_lines);
    this.date_pick = el("input", { type: "date", id: "date-pick", className: "datepick", tabIndex: -1, ariaLabel: "The day the dial shows" });
    this.date_pick.onchange = () => this.set_value("global", "date", this.date_pick.value || "");
    this.date_button.onclick = () => {
      this.date_pick.value = G.shown_day(this.S);
      try { this.date_pick.showPicker(); } catch (e) { this.date_pick.focus(); this.date_pick.click(); }      // older browsers: the input itself
    };
    const time_box = el("span", { className: "timebox" }, el("span", { className: "timewell" }, this.time_field), this.half_button, el("span", { className: "datewell" }, this.date_button, this.date_pick));
    this.time_slider = el("input", { id: "time-slider", type: "range", min: 0, max: 43199, step: 1 });
    this.time_slider.oninput = () => this.set_time(+this.time_slider.value + this.half());
    this.play_button = el("button", { type: "button", className: "icon play", id: "play", onclick: () => this.play(!this.playing) });
    this.status = el("div", { className: "status" });      // what is selected, the size, the build time: kept, not shown (Okay, 14 Oct 2026, 23:19: "hide it")
    // the bar, in two parts: time (play, how fast, the time and its half of the day, now, the day slider) · view
    // (how to zoom, zoom out, in, fit). The panel's square left the bar (Okay, 14 Oct 2026, 23:19: it "doesn't work
    // anyway"; build list #190)
    this.speed = 1;
    this.speed_slider = el("input", { id: "speed", type: "range", min: 0, max: 1000, step: 1, ariaLabel: "How fast time runs", title: "How fast time runs: 0.1× to 720×" });
    // while the speed is being changed its name over the thumb looks like the 10:10 pill (#283): a press on the track
    // until it is let go; a key, for a moment
    let sliding = 0, pressing = false;
    const slide = (on) => { clearTimeout(sliding); this.speed_name.classList.toggle("sliding", on); if (on && !pressing) sliding = setTimeout(() => slide(false), 900); };
    this.speed_slider.oninput = () => {      // (set_speed puts the rider over the thumb, and a slow speed's thumb onto its step)
      this.set_speed(speed_at(+this.speed_slider.value / 1000, this.speed_split()));
      slide(true);
    };
    this.speed_slider.onpointerdown = () => { pressing = true; slide(true); };
    this.speed_slider.onpointerup = this.speed_slider.onpointercancel = () => { pressing = false; slide(false); };
    // no words for the speed in the box any more (Okay, 15 Oct 2026, 00:18: "Remove 1x next to red button"): the slider
    // tells a screen reader its speed (aria-valuetext); the eye has the ball at 1× and where the thumb stands
    this.one_knob = el("i", { className: "knob one" });      // 1×, now that slow motion stands before it: a dot on the line (Okay, 16 Oct 2026, on 4.44: "1x needs a dot")
    const humps = el("span", { className: "humps", ariaHidden: "true" }, el("i", { className: "knob first" }), this.one_knob, el("i", { className: "knob last" }));
    // its two ends named in the bar's grey, 0.1X and 720X (Okay, 15 Oct 2026, 01:59: "denote them 1x and 720x with the bar's gray"; 0.1X since #283)
    for (const [at, word] of [[0, SPEED_SLOW[0] + "X"], [1, SPEED_HI + "X"]]) { const name = el("span", { className: "humpname end", textContent: word }); name.style.setProperty("--at", at); humps.append(name); }
    // the speed's name rides over the thumb, the one white thing on the bar: how many X (Okay, 15 Oct 2026, 01:08: "1X
    // follows the dot. Indicates how many Xs"; 01:59: "It is the only white thing there")
    this.speed_name = el("span", { className: "humpname rider", ariaHidden: "true" });
    humps.append(this.speed_name);
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
    // the day under a finger or the pointer, read by the tool itself (Okay, 18 Oct 2026, notes 2: "On ipad scrubbing time
    // does not work now"; "Ruler pin does not move on bottom bar"): the slider stays for the keyboard and a screen reader,
    // but presses go to the strip around it, which turns the press's place into the time — the same in every browser,
    // where an iPad's own range control was not. A press that doesn't move goes to the nearest step, as before.
    const at_x = (x) => { const r = this.time_slider.getBoundingClientRect(), THUMB = 3; return Math.round(clamp((x - r.left - THUMB / 2) / (r.width - THUMB), 0, 1) * 43199); };
    let pressed = null;
    const scrub = (e) => { if (!pressed) return; if (Math.abs(e.clientX - pressed.x) > 3) pressed.moved = true; if (pressed.moved) this.set_time(at_x(e.clientX) + this.half()); };
    this.day_strip = (strip) => {
      strip.addEventListener("pointerdown", (e) => {
        if (e.button > 0 || e.target.closest(".steps12 button")) return;      // the hour steps under it are buttons of their own
        pressed = { x: e.clientX, id: e.pointerId, moved: false };
        strip.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      strip.addEventListener("pointermove", scrub);
      const up = (e) => {
        if (!pressed || e.pointerId !== pressed.id) return;
        if (!pressed.moved && e.type === "pointerup") { const t = at_x(e.clientX); this.set_time([...this.day_ticks, 10 * 3600 + 600].reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best)) + this.half()); }
        pressed = null;
      };
      strip.addEventListener("pointerup", up);
      strip.addEventListener("pointercancel", up);
    };
    // the needle: the time on the ruler, a red line one point wide from the ruler's top to the screen's foot, placed by
    // the tool from the time itself, whatever has the focus (notes 2: "The moving needle is 1px wide and red, starts from
    // the bottom of the screen unlike the ruler which has room below"); the slider's own thumb is not drawn
    this.needle = el("span", { className: "needle", ariaHidden: "true" });
    // the ruler behind the slider: a line with ticks crossing it. The wider the window, the finer it is cut.
    this.ruler = svg_el("svg");
    this.ruler.setAttribute("class", "ruler");
    this.ruler.setAttribute("aria-hidden", "true");
    this.day_ticks = DAY_STEPS.map((x) => x[0]);
    this.watchers = [new ResizeObserver(() => this.draw_ruler())];      // closed with the tool (close)
    this.watchers[0].observe(this.time_slider);
    this.watchers.push(new ResizeObserver(() => this.set_speed(this.speed)));      // the slow steps' share of the track follows its width
    this.watchers.at(-1).observe(this.speed_slider);
    // Fit: a word button padded like NOW and AM; the magnifier stands alone before it, between the zoom steps and FIT
    // (#315, 4.51.1; Okay, 17 Oct 2026: "icon moves out of the fit box, sits in between plusminus and fit, the horizontal
    // padding like now and am"). Inside the button at its word's left from 15 Oct to 4.51.
    const fit_button = el("button", { type: "button", id: "fit", className: "fit", title: "Show the whole page" }, el("span", { textContent: "Fit" }));
    fit_button.onclick = () => { this.fit(); this.render(); };
    // the magnifier: first, before − + FIT, which stand together; how to zoom and move is in its tag, under the pointer
    // (Okay, 18 Oct 2026, notes 2: "The magnifying glass moves to the left before minus, plus and fit snap together …
    // Hovering on the mag. glass tells these details. Remove details from the left"). Until 4.51.1: words at the left.
    const touch = matchMedia("(hover: none), (pointer: coarse)").matches;
    const zoom_sign = el("span", { className: "zoomsign", tabIndex: 0, role: "note", ariaLabel: "How to zoom and move" });
    zoom_sign.dataset.tip = touch ? "Pinch to zoom · two fingers move" : "⌘ + scroll zooms · drag moves · pinch on a trackpad";
    zoom_sign.innerHTML = icon(TOOL_ICONS.find);
    zoom_sign.onclick = () => { this.tag_show(zoom_sign); clearTimeout(this.zoom_tip); this.zoom_tip = setTimeout(() => this.tag_hide(), 2400); };      // a finger has no hover: a tap shows the tag a moment
    const bar = el("footer", { className: "bar" },
      el("div", { className: "lead" }, this.play_button, this.speeds, time_box,
        el("button", { type: "button", id: "now", textContent: "Now", title: "The time it is now", onclick: () => this.to_now() })),
      this.day_box = el("div", { className: "group day" }, this.ruler, this.time_slider, steps, this.needle),
      el("div", { className: "group viewing" }, this.status, zoom_sign,
        el("span", { className: "zooms" },
          view("zoom-out", "Zoom out", SIGNS.minus, () => { this.zoom(1 / 1.4, middle()); this.render(); }),
          view("zoom-in", "Zoom in", SIGNS.plus, () => { this.zoom(1.4, middle()); this.render(); }),
          fit_button)));
    this.set_speed(1);
    const guides = this.guides_box();
    // on the preview: undo · redo top left, beside the panel (Okay, 13 Oct 2026) · Tiny Preview top right (4.59, #337; the
    // Guides switch stood there until 4.58) · bottom left, top to bottom: Backdrop, Guides, Shadows
    // a note on the preview (R17, R31: an old link): a dark pill under the header's line; a press puts it away, and so
    // does the first change to the dial
    this.note = el("button", { type: "button", className: "previewnote", id: "preview-note", hidden: true, title: "Put this note away", onclick: () => { this.note.hidden = true; } });
    this.main = el("main", {}, this.svg, this.tip, this.note, this.undo_box(), this.tiny_box(), guides, this.shadows_box(), this.backdrop_box(), this.eye_box, this.now_pill, this.ten_pill, this.hands_key, this.sun_hint);
    this.day_strip(this.day_box);
    root.append(panel, this.main, bar, this.build_picker(), this.build_pop());
    root.append(this.sheet());      // a phone's gripper, on the drawer's top line
    requestAnimationFrame(() => this.level_title());
    this.play_icon();
    try { localStorage.removeItem("dial-tool-panel"); } catch (e) { /* not kept */ }      // the panel can't be put away any more: forget that it was
    this.watchers.push(new ResizeObserver(() => this.resized()));
    this.watchers.at(-1).observe(this.svg);
    // the bar's height, for the rows that make room for it (a phone; the showcase closes its row): kept while it is in place
    this.watchers.push(new ResizeObserver(() => { if (!this.show && bar.offsetHeight) root.style.setProperty("--bar-h", bar.offsetHeight + "px"); }));
    this.watchers.at(-1).observe(bar);
  }

  /** how to zoom, beside the zoom buttons: words, then a faint magnifier, nothing to press (Okay, 14 Oct 2026,
   *  23:19: "say cmd+scroll is zoom in out attached to the zoom area. Put a magnifier icon at the end"; 23:26: "at the
   *  end, not a button, faint"). On a screen without a pointer the words say what a finger does. */
  /** a phone: the switches on the preview show only their signs; a tap on the empty backdrop unfolds their words for
   *  WORDS_MS, then they fold back (Okay, 15 Oct 2026, 06:20: "hide labels until backdrop tap"; the extended-button
   *  pattern: a label that folds back to its sign). On a wider screen the words are always there (the stylesheet) */
  words_unfold() {
    this.main.classList.add("words");
    clearTimeout(this.words_timer);
    this.words_timer = setTimeout(() => this.main.classList.remove("words"), WORDS_MS);
  }

  /** a phone: the drawer under the preview (the panel) takes as much of the screen as its gripper is dragged to; a tap
   *  on the gripper jumps between two heights (SHEET). Remembered by this browser. When the drawer is tall enough for
   *  its title, tabs and pinned panes and some room to scroll (SHEET.room), those stay put and only the rest scrolls,
   *  as on a wider screen (.held); shorter, the whole drawer scrolls (Okay, 15 Oct 2026, 06:20: "on mobile bottom menu
   *  should be height adjustable… simple gripper mid top line dot, grey as the line it sits upon") */
  sheet() {
    const app = $("#app"), grip = el("div", { className: "sheetgrip", id: "sheet-grip", title: "Drag to make the drawer taller or shorter", ariaLabel: "Drawer height" });
    grip.setAttribute("role", "separator");
    const set = (share) => { this.sheet_share = share; app.style.setProperty("--preview-share", (share * 100).toFixed(2) + "%"); };
    try { const kept = parseFloat(localStorage.getItem("dial-tool-sheet")); if (kept > 0 && kept < 1) set(kept); } catch (e) { /* not kept */ }
    const limits = () => { const h = app.clientHeight, bar = $(".bar").offsetHeight; return [SHEET.preview / h, (h - bar - SHEET.drawer) / h]; };
    let down = null;
    grip.onpointerdown = (e) => { grip.setPointerCapture(e.pointerId); down = { y: e.clientY, moved: false }; this.fitted = true; app.classList.add("gripping"); };
    grip.onpointermove = (e) => {
      if (!down) return;
      if (Math.abs(e.clientY - down.y) > 4) down.moved = true;
      if (!down.moved) return;
      const [lo, hi] = limits(), top = app.getBoundingClientRect().top, bar = $(".bar").offsetHeight;
      set(clamp((e.clientY - top - bar) / app.clientHeight, lo, hi));
    };
    grip.onpointerup = grip.onpointercancel = (e) => {
      if (!down) return;
      if (!down.moved && e.type === "pointerup") { const [lo, hi] = limits(), now = this.sheet_share ?? SHEET.shares[0]; set(clamp(Math.abs(now - SHEET.shares[0]) < 0.02 ? SHEET.shares[1] : SHEET.shares[0], lo, hi)); }
      down = null;
      app.classList.remove("gripping");
      try { localStorage.setItem("dial-tool-sheet", String(this.sheet_share)); } catch (er) { /* not kept */ }
    };
    // tall enough to hold its top still? measured whenever the drawer or its pinned part changes size
    const panel = $(".panel"), hold = () => {
      const narrow = matchMedia("(max-width: 860px)").matches, parts = [this.tabs, this.pinned].filter(Boolean);
      const top = head_full() + parts.reduce((sum, x) => sum + (x.hidden ? 0 : x.offsetHeight), 0);      // the title line counted at its full height, so squeezing it never tips the drawer into holding
      panel.classList.toggle("held", narrow && panel.clientHeight - top >= SHEET.room);
    };
    // a phone (8-narrow.css): at the drawer's top its title line is full, with the Gallery pill and the unit box; once it
    // scrolls, the line squeezes (.squeezed) and stays on top, the tabs held under it (.stuck); back at the very top it is
    // full again (Okay, 15 Oct 2026, 07:59: "this squeezed state is persistent. However, the big size with mm… comes up
    // when the user loads the page first or scrolls back all the way. Gallery hides together with mm. Only mobile").
    // Squeezed past 32 px, full again only at 0: the line's own 24 px can't tip it back and forth
    const head = panel.querySelector(":scope > header"), form = panel.querySelector(".form");
    let full_h = 0;
    const head_full = () => (panel.classList.contains("squeezed") && full_h) || (full_h = head.offsetHeight);
    const squeeze = () => {
      const held = panel.classList.contains("held"), top = held ? form.scrollTop : panel.scrollTop;
      if (top > 32) panel.classList.add("squeezed");
      else if (top < 1) panel.classList.remove("squeezed");
      panel.classList.toggle("stuck", !held && panel.classList.contains("squeezed"));
    };
    panel.addEventListener("scroll", squeeze, { passive: true });
    form.addEventListener("scroll", squeeze, { passive: true });
    this.watchers.push(new ResizeObserver(hold));
    this.watchers.at(-1).observe(panel);
    this.watchers.at(-1).observe(this.pinned);
    return grip;
  }

  /** the clock to the time it is now (the bar's Now, the showcase's Now pill) */
  to_now() { const d = new Date(); if (this.S.date) this.set_value("global", "date", ""); this.set_time(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000); }

  /** the showcase, or back (Okay, 15 Oct 2026, 04:26, reshaped 04:59 and 05:09). In: the panel and the bar are gone at
   *  once, what stood on the preview goes at once (fading, it twitched as the sky darkened), and the dial alone travels,
   *  eased, to its showcase place (show_target: 2/3 of a portrait A4 fitted in the window). The sky darkens to a 45°
   *  gradient; a spotlight pool lies behind the dial and takes its shadow; the sun crosses a day in SUN.day seconds;
   *  the clock runs at 1× from where it was. What stays: the mark and "Dial Tool" (fainter, not pressable), the iris
   *  switch as an X (bottom right; the way out) and Now (bottom centre). Out: the same, backwards, to where we were. The
   *  shadows' soft edge is off while anything moves (moving()). Nothing of it is stored or changes the dial. */
  showcase(on) {
    const app = $("#app");
    if (on === !!this.show) return;
    this.hover(null);
    if (this.pop && this.pop.at) this.pop_close();
    if (this.bio_open) this.bio_open(false);
    this.iris_open(false);
    const before = this.svg.getBoundingClientRect(), c0 = this.c.slice(), z0 = this.z;
    if (on) app.classList.add("snap");             // in: panel, bar and switches go at once, only the dial travels;
                                                   // out, the long way: they come back eased while the dial travels home (05:43: "so sudden!")
    if (on) {
      this.show = { away: app.classList.contains("away"), playing: this.playing, speed: this.speed, phase: 0, at: performance.now(), spin: null, back: null,
        view: { c: c0, z: z0, fitted: this.fitted } };      // where the dial stood, to travel back to
      app.classList.add("away", "show");
      this.eye_button.setAttribute("aria-pressed", "true");
      this.set_speed(1);
      if (!this.playing) this.play(true);
    } else {
      const was = this.show;
      this.left_view = was.view;
      this.show = null;
      app.classList.remove("show");
      if (!was.away) { app.classList.remove("away"); this.eye_button.setAttribute("aria-pressed", "false"); }
      this.set_speed(was.speed);
      if (!was.playing) this.play(false);
      for (const b of [this.now_pill, this.ten_pill]) { b.classList.remove("back"); b.title = b.ariaLabel = b.dataset.says; }
      this.hands_key.setAttribute("aria-pressed", "false"); this.hands_key.title = "Hide the hands";
    }
    this.iris_button.setAttribute("aria-pressed", String(on));
    for (const part of [$(".panel"), $(".bar")]) if (part) part.inert = on;      // what slid away is out of reach for the keyboard and a screen reader too (#244, 4.47.2)
    app.style.setProperty("--title-end", this.title.getBoundingClientRect().right.toFixed(1) + "px");
    // the layout has changed at once; the dial is put back where it stood on the screen, then travels from there
    const after = this.svg.getBoundingClientRect();
    this.c = [c0[0] + before.left - after.left, c0[1] + before.top - after.top];
    this.z = z0;
    this.view = [after.width, after.height];
    this.place();
    const home = on ? null : this.left_view;      // out: back exactly where it stood, and as fitted as it was
    this.travel_to(on ? this.show_target() : { c: home.c, z: home.z }, () => { if (this.show) this.hint(); else this.fitted = home.fitted; });
    requestAnimationFrame(() => requestAnimationFrame(() => app.classList.remove("snap")));
  }

  /** where the dial stands in the showcase: centred, as wide as 2/3 of a portrait A4 that is fitted in the window */
  show_target() {
    const [w, h] = this.size(), page = Math.min(w / SHOWCASE_PAGE.w, h / SHOWCASE_PAGE.h);
    return { c: [w / 2, h / 2], z: SHOWCASE_PAGE.dial * SHOWCASE_PAGE.w * page / this.S.dial_d };
  }

  /** the dial travels to `to` ({c, z}), eased; the only thing that moves in and out of the showcase. Then it is fitted */
  travel_to(to, done) {
    this.travel = { from: { c: this.c.slice(), z: this.z }, to, t0: performance.now(), done };
    this.fitted = false;
    this.render();
  }

  /** a step of the travel, from frame(): true while it goes on */
  travel_step() {
    const T = this.travel, p = clamp((performance.now() - T.t0) / TRAVEL_MS, 0, 1), e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;      // slow out, slow in
    const to = this.show ? this.show_target() : T.to;      // the window may change under it
    this.z = T.from.z * (to.z / T.from.z) ** e;           // the scale by ratio, so growing looks even
    this.c = [T.from.c[0] + (to.c[0] - T.from.c[0]) * e, T.from.c[1] + (to.c[1] - T.from.c[1]) * e];
    this.place();
    if (p < 1) return true;
    this.travel = null;
    this.fitted = true;
    if (T.done) T.done();
    return false;
  }

  /** something is moving: the dial travelling, the panel sliding, the hands spinning, the sun being dragged. The
   *  shadows' soft edge waits for it to stop (Okay, 04:59 and 05:09: "blur off on all animations") */
  moving() { return !!(this.travel || this.sliding || (this.show && (this.show.spin || this.show.dragging))); }

  /** the showcase's sun now: where it is in its day (0 sunrise … 1 sunset), the direction its light comes from, its
   *  height (always the same) and how much light it gives (0 at sunrise and sunset, 1 for most of the day) */
  sun() {
    const p = this.show.phase, k = Math.sin(Math.PI * p);      // k: 0 at sunrise and sunset, 1 at midday
    const t = clamp(k / SUN.fade, 0, 1), light = t * t * (3 - 2 * t);
    return { p, k, light, from: (270 + 180 * p) % 360, rise: SUN.rise };
  }

  /** the sun along its day, from a point of the preview: the left edge is sunrise, the right sunset */
  sun_to(p) {
    const [w] = this.size();
    this.show.phase = clamp(p[0] / w, 0, 0.999);
    this.render();
  }

  /** the numeral or mark Nudge works on, outlined on the dial in its ring's guide colour while the Nudge pane is open
   *  on the Rings tab (4.78, #349) — so the one a press chose, or the list chose, is seen. */
  draw_picked() {
    const S = this.S, R = this.ring(), nudge = this.rows && this.rows.find((r) => r.fold && r.row.text === "Nudge one numeral");
    const d = !this.show && S.ui_section === 1 && R && nudge && !nudge.el.hidden && !this.is_folded(nudge) ? this.statik.rings.find((x) => x.ring === R) : null;
    const k = d ? d.at.indexOf(+this.nudge_at) : -1, part = k >= 0 && d.parts ? d.parts[k] : null;
    const path = part ? part.svg(4) : "", tone = G.GUIDE_COLOURS[G.ring_guide(S, S.ui_ring) ?? S.gd_k_sel] || G.GUIDE_COLOURS[0];
    for (const line of this.picked) { if (line.getAttribute("d") !== path) line.setAttribute("d", path); }
    this.picked[1].style.setProperty("--picked", tone);
  }

  /** the light on the dial (4.77): in the showcase a ring of shine (SHINE) over the dial and the hands; wherever shadows
   *  are drawn, each hand's bevel (BEVEL) — its two long halves lighter and darker by where the light comes from.
   *  Drawn into groups kept by name, just under the shadows that fall on the same surfaces. Preview only (R5, R26). */
  draw_light(items) {
    const S = this.S, sun = this.show && this.sun();
    if (!this.light_parts) this.light_parts = new Map();
    const parts = this.light_parts, used = new Set(), f = (v) => v.toFixed(4);
    const part = (name, tag, parent, before = null) => {
      let n = parts.get(name);
      if (!n) { n = svg_el(tag); parts.set(name, n); }
      if (n.parentNode !== parent || (before && n.nextSibling !== before)) parent.insertBefore(n, before);
      used.add(name);
      return n;
    };
    const finish = () => { for (const [name, n] of parts) if (!used.has(name)) { n.remove(); parts.delete(name); } };
    const on = sun ? sun.light : S.sh_on ? Math.min(S.sh_dark / 25, 2) : 0;      // how much light there is to shade by
    if (S.out_production || !(on > 0)) return finish();
    if (!this.light_defs) { this.light_defs = svg_el("defs"); this.svg.prepend(this.light_defs); }
    const from = sun ? sun.from : S.sh_from, R = S.dial_d / 2, nodes = items.map((_, i) => this.slots[i].node);
    // the ring of shine: bands round a centre moved toward the sun, screened onto everything before the hands
    const bands = (g, key) => {
      if (!sun) return;
      const a = from * Math.PI / 180, c = [Math.sin(a) * SHINE.toward * R, Math.cos(a) * SHINE.toward * R];
      SHINE.bands.forEach(([at, bright], k) => {
        const r0 = R * (SHINE.r + at - SHINE.width / 2), r1 = R * (SHINE.r + at + SHINE.width / 2);
        const p = part(`${key}/band/${k}`, "path", g);
        p.setAttribute("d", `M${f(c[0] - r1)} ${f(c[1])}a${f(r1)} ${f(r1)} 0 1 0 ${f(2 * r1)} 0a${f(r1)} ${f(r1)} 0 1 0 ${f(-2 * r1)} 0ZM${f(c[0] - r0)} ${f(c[1])}a${f(r0)} ${f(r0)} 0 1 1 ${f(2 * r0)} 0a${f(r0)} ${f(r0)} 0 1 1 ${f(-2 * r0)} 0Z`);
        p.setAttribute("fill", "#fff"); p.setAttribute("fill-opacity", f(bright * on)); p.setAttribute("fill-rule", "evenodd");
      });
    };
    const first_hand = items.findIndex((x) => x.role === "hand" || x.role === "cap" || x.role === "guide");
    if (sun && items.some((x) => x.role === "plate")) {
      const clip = part("shine/clip", "clipPath", this.light_defs), dial = part("shine/clip/dial", "circle", clip);
      clip.id = "shine-clip"; dial.setAttribute("r", f(R));
      const g = part("shine", "g", this.dial, first_hand >= 0 ? nodes[first_hand] : null);
      g.setAttribute("clip-path", "url(#shine-clip)"); g.setAttribute("style", "mix-blend-mode: screen"); g.setAttribute("pointer-events", "none");
      bands(g, "shine");
    }
    // each hand's bevel: its right and left halves (as it points) lighter and darker by where the light comes from, and the shine's bands on it
    items.forEach((item, i) => {
      if (item.role !== "hand" || G.HAND_SHAPES[S["ha_" + item.name]?.shape] === "disc") return;      // a disc hand is flat
      const side = Math.sin((from - item.angle) * Math.PI / 180);      // + : the light comes from the hand's right
      const key = "bevel-" + item.name, clip = part(key + "/clip", "clipPath", this.light_defs), shape = part(key + "/clip/hand", "path", clip);
      clip.id = "bevel-clip-" + item.name; shape.setAttribute("d", this.slots[i].d);
      let n = i + 1; while (items[n]?.role === "mark" && items[n].name === item.name) n++;
      const g = part(key, "g", this.dial, nodes[n] || null);
      g.setAttribute("transform", `rotate(${f(-item.angle)})`); g.setAttribute("pointer-events", "none");
      const inner = part(key + "/in", "g", g);
      inner.setAttribute("clip-path", `url(#${clip.id})`);
      const half = (name, x, colour, k) => { const r = part(`${key}/${name}`, "rect", inner); r.setAttribute("x", f(x)); r.setAttribute("y", "-50"); r.setAttribute("width", "50"); r.setAttribute("height", "100"); r.setAttribute("fill", colour); r.setAttribute("fill-opacity", f(k)); };
      const lit = BEVEL.light * Math.abs(side) * Math.min(on, 1), dark = BEVEL.dark * Math.abs(side) * Math.min(on, 1);
      half("right", 0, side > 0 ? "#fff" : "#000", side > 0 ? lit : dark);
      half("left", -50, side > 0 ? "#000" : "#fff", side > 0 ? dark : lit);
      if (sun) { const sh = part(key + "/shine", "g", inner); sh.setAttribute("transform", `rotate(${f(item.angle)})`); sh.setAttribute("style", "mix-blend-mode: screen"); bands(sh, key + "/shine"); }
    });
    finish();
  }

  /** the showcase's spotlight and the dial's shadow in it, for the sun now (POOL); in the dial's millimetres */
  draw_pool() {
    if (!this.show) return;
    const S = this.S, sun = this.sun(), a = sun.from * Math.PI / 180, toward = [Math.sin(a), Math.cos(a)];
    const R = S.dial_d / 2, off = POOL.lift / Math.tan(sun.rise * Math.PI / 180), dim = 1 - sun.k;
    const mix = ([lo, hi], t) => lo + (hi - lo) * t;
    const soft = mix(POOL.soft, dim), light = mix(POOL.light, sun.k) * sun.light, shade = mix(POOL.shade, sun.k) * sun.light;
    const f = (v) => v.toFixed(3), [L, D] = this.pool_parts;
    L.circle.setAttribute("r", f(R * POOL.size));
    L.circle.setAttribute("transform", `translate(${f(-toward[0] * off / 2)} ${f(-toward[1] * off / 2)}) rotate(${f(90 - sun.from)}) scale(${f(1 + POOL.stretch * dim)} 1)`);
    const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], b = S.c_backdrop, lift = lum(b) < POOL.least ? (POOL.least - lum(b)) / (1 - lum(b)) : 0;
    const colour = to_hex(b.map((v, i) => (i < 3 ? v + (1 - v) * lift : v)));      // a very dim backdrop: its colour lifted toward white, so the pool still lights (#351)
    L.stops.forEach((s, i) => { s.setAttribute("offset", f([0, 1 - soft, 1][i])); s.setAttribute("stop-color", colour); s.setAttribute("stop-opacity", f(i < 2 ? light : 0)); });
    const r = R * (1 + soft * 0.4);
    D.circle.setAttribute("r", f(r));
    D.circle.setAttribute("transform", `translate(${f(-toward[0] * off)} ${f(-toward[1] * off)})`);
    D.stops.forEach((s, i) => { s.setAttribute("offset", f([0, R / r * (1 - soft * 0.3), 1][i])); s.setAttribute("stop-color", "#000"); s.setAttribute("stop-opacity", f(i < 2 ? shade : 0)); });
  }

  /** Now in the showcase: the hands land on the time it is now; the pill shrinks into an undo sign. Pressed then, they
   *  go back to the time they showed (as it has run on since), each the other way, and the sign grows back into Now
   *  (Okay, 04:59; Okay's choice of the way back) */
  //  10:10 does the same, to 10:10 (07:40). The one pressed turns into the undo sign; the other stays as it is. The other
  //  pressed then takes the hands to its time and the sign moves to it; the way back is still to the time first shown.
  show_now(kind = "now") {
    const sh = this.show, beat = G.BEATS[this.S.ha_beat][1];
    const from = G.hand_angles(this.S.t, beat);
    if (sh.back && sh.back.by === kind) {
      this.set_time(sh.back.t + (performance.now() - sh.back.at) / 1000);
      sh.back = null;
      sh.spin = { from, way: -1, t0: performance.now() };
    } else {
      const d = new Date(), now = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
      sh.back = sh.back ? { ...sh.back, by: kind } : { t: this.S.t, at: performance.now(), by: kind };
      this.set_time(kind === "now" ? now : 10 * 3600 + 600 + this.half());
      sh.spin = { from, way: 1, t0: performance.now() };
    }
    for (const b of [this.now_pill, this.ten_pill]) {
      const back = !!sh.back && b.classList.contains(sh.back.by);
      b.classList.toggle("back", back);
      b.title = b.ariaLabel = back ? "Back to the time it showed" : b.dataset.says;
    }
    this.render();
  }

  /** the hands while they spin (frame()). The hour hand turns one whole turn clockwise and on to where it lands, the
   *  minute hand the same anticlockwise (going back, each the other way); the seconds hand makes no turn, it goes the
   *  short way to its place while the big hands whirl. One easing for all, slow to start and slow to land (Okay, 15 Oct
   *  2026, 07:36: "big arms move different wises, one clock one anticlock. One turn, ease to stop on position. Seconds?
   *  Only moves to position slowly as the chaos ensues. Eases both start and end"; was: every hand two turns, one way) */
  spin_hands(items) {
    const sp = this.show && this.show.spin;
    if (!sp) return;
    const p = clamp((performance.now() - sp.t0) / SPIN_MS, 0, 1), e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
    const k = { hour: 0, minute: 1, second: 2 }, way = { hour: sp.way, minute: -sp.way };
    for (const item of items) {
      if ((item.role !== "hand" && item.role !== "mark") || !(item.name in k) || p >= 1) continue;      // a disc's painted mark turns with its hand
      const a0 = sp.from[k[item.name]], d = item.angle - a0;
      if (item.name === "second") { item.angle = a0 + e * ((d % 360 + 540) % 360 - 180); continue; }      // the short way, under half a turn
      const w = way[item.name], gap = ((d * w) % 360 + 360) % 360;      // how far round it is, going its own way
      item.angle = a0 + w * e * (gap + 360);
    }
    if (p >= 1) this.show.spin = null;
  }

  /** the showcase's hint, once it has arrived: over Now a two-headed arrow comes, sways left and right, and goes */
  hint() {
    const h = this.sun_hint, now = this.now_pill.getBoundingClientRect(), box = this.svg.getBoundingClientRect();
    const below = this.c[1] + this.S.dial_d / 2 * this.z, above = now.top - box.top;      // the dial's bottom, Now's top, in the preview
    h.style.top = ((below + above) / 2 - h.offsetHeight / 2).toFixed(1) + "px";            // centred between them (05:43)
    h.classList.remove("go");
    void h.offsetWidth;
    h.classList.add("go");
  }

  /** the iris switch opened (its words, ACTIVATE SHOWCASE, slid out to its left) or shut */
  iris_open(on) {
    if (!this.iris_box) return;
    this.iris_box.setAttribute("aria-expanded", String(on));
    this.iris_go.tabIndex = on ? 0 : -1;
  }


  /** the dial alone, or back (Okay, 15 Oct 2026, 04:02: "it immediately triggers a sliding away action of the left
   *  white column. Bottom bar stays. Backdrop and shadow stop short. Logo and dial tool and version number is what
   *  remains on top. In sync with panels sliding away dial is centered, enlarged to fit while enlarging. Use easing").
   *  The stylesheet does the moving: #app.away turns --away from 0 to 1 (eased), and the panel's column, the panel and
   *  what stands on the preview follow it. The preview grows with its column; each step of that is a resize, and a
   *  fitted dial re-fits on every one, so the dial grows and centres in step with the slide. Not part of a dial. */
  dial_alone(on) {
    const app = $("#app");
    this.eye_button.setAttribute("aria-pressed", String(on));
    if (this.unit_open) this.unit_open(false);
    app.style.setProperty("--title-end", this.title.getBoundingClientRect().right.toFixed(1) + "px");      // undo · redo stop short of the title
    app.style.setProperty("--bar-h", $(".bar").offsetHeight + "px");      // a phone: the panel's row is what the bar leaves
    this.fitted = true;
    this.sliding = true;                           // the shadows' soft edge waits for the slide (moving())
    if (this.view_end) app.removeEventListener("transitionend", this.view_end);
    this.view_end = (e) => { if (e.target === app) { this.sliding = false; this.fit(); this.render(); } };
    setTimeout(() => { if (this.sliding) { this.sliding = false; this.render(); } }, 1200);      // no slide (less motion asked, nothing to move): don't wait for it
    app.addEventListener("transitionend", this.view_end);
    app.classList.toggle("away", on);
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
    const header = this.title.closest("header").getBoundingClientRect();
    if (!header.height || !x_height) return;
    this.title.style.translate = `0 ${(header.top + header.height / 2 - (baseline - x_height / 2)).toFixed(2)}px`;
    // the mark: its ring centred on the middle of the title's capitals, so it reaches as far above them as below the
    // baseline (Okay, 15 Oct 2026, 04:26: "align icon better"; it was on the header's middle, a point low)
    const logo = $("#logo"), cap = pen.measureText("D").actualBoundingBoxAscent, moved = header.top + header.height / 2 - (baseline - x_height / 2);
    if (logo && cap) { logo.style.translate = ""; const r = logo.getBoundingClientRect(); logo.style.translate = `0 ${(baseline + moved - cap / 2 - (r.top + r.height / 2)).toFixed(2)}px`; }
    // the Gallery pill and the unit box: their words on the title's baseline, as Help's are (Okay, 16 Oct 2026: "same
    // baseline"). Each is moved as a whole (its menu with it); one that isn't shown (a phone's squeezed line) stays put
    for (const box of document.querySelectorAll(".panel > header :is(.galleryway, .unit)")) {
      box.style.translate = "";
      const word = box.querySelector("button .word") || box.querySelector("button"), dot = el("span");      // the unit box: its word's own line
      dot.style.cssText = "display:inline-block;width:0;height:0";
      word.append(dot);
      const at = dot.getBoundingClientRect();
      dot.remove();
      if (at.height === 0 && at.top === 0) continue;
      const dots = window.devicePixelRatio || 1;
      box.style.translate = `0 ${Math.round((baseline + moved - at.top) * dots) / dots}px`;      // in whole screen dots: a hairline box stays crisp (the unit box, #302)
    }
  }

  unit() { return G.UNITS[this.S.ui_unit] || G.UNITS[0]; }
  /** a length in mm → the text of it in the chosen unit. */
  in_unit(mm, places) { const u = this.unit(); return (mm * u[2]).toFixed(Math.max(0, places + u[3])); }      // thou takes a decimal away: never fewer than none

  unit_box() {
    const menu = el("div", { className: "unitmenu", id: "unit-menu", hidden: true });
    menu.setAttribute("role", "menu");
    this.unit_button = el("button", { type: "button", className: "unitbox", id: "unit", title: "The unit lengths are shown in" });
    this.unit_button.setAttribute("aria-haspopup", "menu");
    if (document.fonts) document.fonts.load('10px "Dial Mono"').then(() => this.size_unit(), () => {});      // measured again once Dial Mono is in (fonts.ready can come before a face is even asked for)
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
    const box = el("button", { type: "button", className: "onview backdropbox", id: "backdrop", title: "The backdrop’s colour (preview only)" }, dot, el("span", { className: "word", textContent: "Backdrop" }));
    box.setAttribute("aria-expanded", "false");
    box.onclick = () => this.pop_open({ read: () => this.S.c_backdrop, write: (v) => this.set_value("global", "c_backdrop", v), label: () => "Backdrop" }, box);
    this.backdrop_dot = dot;
    // the eye switch (Okay, 15 Oct 2026, 02:42; at the preview's bottom right since 03:41, .eyes): on, the dial alone —
    // the panel slides away and the dial grows to fit (dial_alone(), 04:02). Not part of a dial
    const eye = el("button", { type: "button", className: "onview eyebox", id: "eye-box", title: "The dial alone: the panel slides away", ariaLabel: "The dial alone" });
    eye.innerHTML = icon(TOOL_ICONS.eyebox, 30);
    eye.setAttribute("aria-pressed", "false");
    eye.onclick = () => this.dial_alone(eye.getAttribute("aria-pressed") !== "true");
    this.eye_button = eye;
    // the showcase switch, left of the eye: an iris in a box. Pressed, it opens to the left with ACTIVATE SHOWCASE, and
    // only those words take you there (Okay, 04:59: "we need affordance"); pressed again, it shuts. In the showcase
    // it is an X, the way out
    const iris = el("button", { type: "button", className: "iriskey", id: "iris-box", title: "The showcase", ariaLabel: "The showcase" });
    iris.innerHTML = icon(TOOL_ICONS.iris, 30);
    iris.setAttribute("aria-pressed", "false");
    iris.onclick = () => { if (this.show) this.showcase(false); else this.iris_open(this.iris_box.getAttribute("aria-expanded") !== "true"); };
    this.iris_go = el("button", { type: "button", className: "irisgo", id: "iris-go", textContent: "Activate showcase", onclick: () => this.showcase(true) });
    this.iris_box = el("div", { className: "onview irisbox" }, this.iris_go, iris);
    this.iris_button = iris;
    this.iris_open(false);
    this.eye_box = el("div", { className: "eyes" }, this.iris_box, eye);
    // the showcase's Now: a pill at the bottom centre, on the iris's line (04:26: "a button appeared bottom center:
    // NOW!"); pressed, the hands spin to now and it shrinks into an undo sign, the way back (show_now)
    // Beside it, 10:10, the pose watches are shown in (Okay, 15 Oct 2026, 07:40): the same whirl to 10:10. Whichever was
    // pressed turns into the undo sign; the other stays as it is (show_now)
    const pill = (kind, id, word, says) => {
      const b = el("button", { type: "button", className: "onview nowpill " + kind, id, title: says, ariaLabel: says, onclick: () => this.show_now(kind) }, el("span", { className: "word", textContent: word }));
      b.insertAdjacentHTML("beforeend", icon(TOOL_ICONS.undo));
      b.dataset.says = says;
      return b;
    };
    this.now_pill = pill("now", "show-now", "Now", "The time it is now");
    this.ten_pill = pill("ten", "show-ten", "10:10", "10:10, the classic pose");
    // the showcase's bottom left corner: the hands shown or hidden, a round key with the Hands sign inside (Okay, 07:40:
    // "show/hide hands. We have a hands icon, adapt to size. Round with hands inside"). The showcase's alone; the
    // dial's own Show hands is left as it is
    this.hands_key = el("button", { type: "button", className: "onview handskey", id: "hands-key", title: "Hide the hands", ariaLabel: "Hands" });
    this.hands_key.innerHTML = icon(TOOL_ICONS.hands_key, 38);
    this.hands_key.setAttribute("aria-pressed", "false");
    this.hands_key.onclick = () => {
      const hide = !this.show.nohands;
      this.show.nohands = hide;
      this.hands_key.setAttribute("aria-pressed", String(hide));
      this.hands_key.title = hide ? "Show the hands" : "Hide the hands";
      this.render();
    };
    // over it, the hint that the sun moves left and right (hint())
    this.sun_hint = el("div", { className: "sunhint", id: "sun-hint" });
    this.sun_hint.innerHTML = icon(TOOL_ICONS.both_ways, 108, 36);
    this.sun_hint.onanimationend = () => this.sun_hint.classList.remove("go");
    return el("div", { className: "backdrops" }, box, ...this.case_box(), this.xray_box());
  }

  /** Okay's mark in the panel's first column, left of the title; a press opens a short bio: who made the tool, where
   *  its source is, and the open-source work it stands on (Okay, 15 Oct 2026, 02:42: "This triggers bio. Make it short,
   *  give links. Acknowledge harfbuzz and other opensource providers"). A press elsewhere or Escape closes it. */
  logo_box() {
    const button = el("button", { type: "button", className: "logo", id: "logo", title: "About Dial Tool", ariaLabel: "About Dial Tool" });
    button.innerHTML = icon(TOOL_ICONS.logo);
    button.setAttribute("aria-expanded", "false");
    const a = (href, text) => el("a", { href, textContent: text, target: "_blank", rel: "noopener" });
    const line = (...parts) => el("p", {}, ...parts);
    const bio = el("div", { className: "bio night", id: "bio", hidden: true },      // no title of its own: the header's is right above it (Okay, 03:06)
      this.bio_first = line("A tool for designing watch dials, ring by ring, in the browser. Designed and vibecoded by Okay, a graphic designer in Istanbul working across contemporary art, architecture and cinema, for a watch he is building. "),      // 06:51: "designed and vibe coded by okay"; the contact line ends this paragraph
      line("Source, every version and the MIT licence: ", a("https://github.com/duztman/dial-tool", "github.com/duztman/dial-tool"), "."),
      el("h3", { textContent: "Built on open source" }),
      el("ul", {},
        el("li", {}, a("https://harfbuzz.github.io", "HarfBuzz"), " sets the type (harfbuzzjs, MIT)."),
        el("li", {}, a("https://skia.org", "Skia"), "’s PathKit joins and cuts the shapes (BSD 3-clause)."),
        el("li", {}, a("https://rsms.me/inter/", "Inter"), " by Rasmus Andersson is the stand-in typeface; ", a("https://fonts.google.com/specimen/Silkscreen", "Silkscreen"), " by Jason Kottke sets the tiny figures (SIL OFL)."),
        el("li", {}, "The twenty-one dial typefaces, each under its designers’ SIL Open Font License, most of them from ", a("https://fonts.google.com", "Google Fonts"), "."),
        el("li", {}, a("https://www.drawbot.com", "DrawBot"), " is where the tool began; ", a("https://esbuild.github.io", "esbuild"), " builds it and ", a("https://playwright.dev", "Playwright"), " tests it.")));
    // contact: Okay's address, kept from address-harvesting robots that read pages and repositories (Okay, 03:18:
    // "encrypt it somehow so no one can get it. Reasonably"): stored as its letters' codes, each XOR 23, back to front,
    // so it never stands in the page or the source as an address; put together only when "here" is pressed
    const MAIL = [122, 120, 116, 57, 123, 126, 118, 122, 112, 87, 101, 118, 123, 126, 110, 118, 115, 118, 101, 118, 124, 110, 118, 124, 120];
    const write = el("a", { href: "#contact", textContent: "here", onclick: (e) => { e.preventDefault(); location.href = "mailto:" + String.fromCharCode(...MAIL.map((c) => c ^ 23).reverse()); } });
    this.bio_first.append("Contact him ", write, ".");
    const open = (on) => { bio.hidden = !on; button.setAttribute("aria-expanded", String(on)); };
    this.bio_open = open;
    button.onclick = () => open(bio.hidden);
    const box = el("div", { className: "about" }, button, bio);
    box.onkeydown = (e) => { if (e.key === "Escape" && !bio.hidden) { open(false); button.focus(); } };
    return box;
  }

  /** Tiny Preview (#337; Okay's notes 2, 18 Oct 2026: "Its button is top-right where 'Guides' are, regular eye as icon
   *  for now … pops up in place when clicked, not editable, just a 100% preview. If the dial is 40mm, this guy is
   *  40mm + appropriate padding. Has a shadow, and like a window it can be dragged and dropped anywhere. Top of
   *  everything. On its top left an eye appears on hover or tap, that hides it, it goes back to its place"). The dial
   *  as its SVG file draws it — at the browser's millimetres (96 to the inch: "approximation fine for now", 18 Oct),
   *  its margins round it on the backdrop — redrawn at most five times a second while the dial changes. */
  tiny_box() {
    const button = el("button", { type: "button", className: "onview tinyopen", id: "tiny-open", ariaLabel: "Tiny preview" });
    button.dataset.tip = "Tiny preview: the dial at its own size";
    button.innerHTML = eye(true);
    const shut = el("button", { type: "button", className: "tinyshut", id: "tiny-shut", ariaLabel: "Put the tiny preview away" });
    shut.innerHTML = eye(true);
    const face = el("div", { className: "tinyface" });
    const win = el("div", { className: "tinywin", id: "tiny", hidden: true, role: "img", ariaLabel: "The dial at its own size" }, face, shut);
    if ($("#tiny")) $("#tiny").remove();           // the last tool's, left in the body (a dial opened anew builds the tool again)
    document.body.append(win);
    const show = (on) => {
      const b = button.getBoundingClientRect();    // measured while the button still stands
      win.hidden = !on; button.hidden = on;
      if (!on) { button.focus({ preventScroll: true }); return; }
      this.tiny_draw(true);
      if (!this.tiny.placed) {                     // until it is dragged: in place of its button, their right edges together
        win.style.left = `${Math.max(b.right - win.offsetWidth, 0)}px`; win.style.top = `${b.top}px`;
      }
    };
    button.onclick = () => show(true);
    shut.onclick = (e) => { e.stopPropagation(); show(false); };
    shut.onpointerdown = (e) => e.stopPropagation();
    // dragged anywhere, kept inside the window; a tap (a finger has no hover) wakes the eye a moment
    let grab = null;
    win.onpointerdown = (e) => {
      const b = win.getBoundingClientRect();
      grab = { dx: e.clientX - b.left, dy: e.clientY - b.top, moved: false };
      win.setPointerCapture(e.pointerId);
      win.classList.add("held");
    };
    win.onpointermove = (e) => {
      if (!grab) return;
      const x = clamp(e.clientX - grab.dx, 0, innerWidth - win.offsetWidth), y = clamp(e.clientY - grab.dy, 0, innerHeight - win.offsetHeight);
      win.style.left = `${x}px`; win.style.top = `${y}px`; grab.moved = true; this.tiny.placed = true;
    };
    win.onpointerup = win.onpointercancel = () => {
      if (grab && !grab.moved) { win.classList.add("awake"); clearTimeout(this.tiny.wake); this.tiny.wake = setTimeout(() => win.classList.remove("awake"), 2400); }
      grab = null; win.classList.remove("held");
    };
    this.tiny = { win, face, show, button, at: 0, timer: 0, placed: false, wake: 0 };
    return button;
  }

  /** the Tiny Preview follows the dial: now, or at most five times a second (it is a whole SVG each time). */
  tiny_draw(now = false) {
    const T = this.tiny;
    if (!T || T.win.hidden || !this.statik) return;
    const go = () => {
      T.at = performance.now(); T.timer = 0;
      T.face.innerHTML = svg_document({ ...this.S, guides: false, out_production: false, out_mirror: false }, this.statik, this.S.t, { preview: true }).replace(/^<\?xml[^>]*>\s*/, "");
    };
    if (now) { clearTimeout(T.timer); return go(); }
    if (!T.timer) T.timer = setTimeout(go, Math.max(0, TINY_EVERY - (performance.now() - T.at)));
  }

  /** the complications act like tabs (Okay, 18 Oct 2026: "Act like tabs, selecting them changes settings accordingly",
   *  #328): each kind keeps its own settings for the window — its shape and size, its text, colours and font — and a kind
   *  taken again brings its own back. Where the window stands (on, place, radius, guide, link) is shared by its kinds.
   *  Kept for this visit (a link keeps the window as it is shown); a kind never taken starts from what the window has.
   *  → whether the kind's own settings came back. */
  kind_tab(T, to) {
    const mine = ((this.kind_tabs ||= {})[this.S.ui_window] ||= {});
    mine[T.kind ?? 0] = Object.fromEntries(KIND_TAB_KEYS.map((k) => [k, structuredClone(T[k])]));
    const back = mine[to];
    if (!back) return false;
    for (const [k, v] of Object.entries(back)) T[k] = structuredClone(v);
    return true;
  }

  /** handles on the selected ring's guides (4.65; farukahmet's PR #2, 18 Oct 2026, redrawn: Okay, 21:20: "Drag handles
   *  great as an idea, needs to be implemented in our ways and design, inner outer thing already has dotted line, all
   *  these handles should be in guide color, adapted"). On the Rings tab, with guides on, over the selected ring:
   *    · a disc on its dotted line (where its radius measures to: outer, middle or inner end, a numeral's anchor) —
   *      dragged in or out, it sets the radius;
   *    · a square on the edge away from it — dragged, it sets how big one of its things is (a mark's length or a dot's
   *      Ø, a numeral's size, a band's width), the edge following the pointer;
   *    · a triangle just outside the ring at its first position — dragged round, it sets Start;
   *    · with a span under 360°, a second triangle at its end — dragged round, it sets Span.
   *  All in the ring's guide colour, a hairline of white round them, the size of a fingertip on any zoom. The radius
   *  and size handles stand halfway between the first two positions, so they never sit on a mark. They go through
   *  set_value, as the panel's rows do: undo, the controller, the guides live while dragged. */
  draw_handles() {
    const H = this.handles;
    if (!H) return;
    const R = this.ring(), k = R ? G.ring_guide(this.S, this.S.ui_ring) : null;
    if (this.show || this.S.ui_section !== 1 || !this.S.guides || !(this.S.gd_rings || this.S.gd_sel) || !R || !R.on || k === null) { H.replaceChildren(); this.handles_key = ""; return; }      // only where its guide shows
    const kind = G.kind_of(R), ext = { ticks: R.len, markers: R.len, band: R.width }[kind] || 0;
    let outer = R.r + G.from_shift(R, ext), inner = outer - ext;
    if (G.has_text(R)) { const e = G.radial_extent(this.statik?.rings?.find((d) => d.ring === R)?.path); if (e) [inner, outer] = e; }
    const angles = G.ring_angles(R), a0 = angles[0] ?? (+R.start || 0);
    const free = angles.length > 1 ? a0 + ((((angles[1] - a0) % 360) + 360) % 360) / 2 : a0 + 15;
    const edge = Math.abs(outer - R.r) >= Math.abs(R.r - inner) ? outer : inner;      // the edge away from the dotted line
    const span = Math.min(Math.max(+R.span || 360, 1), 360), out = outer + HANDLE_OUT / this.z;
    const key = [this.S.ui_ring, R.r, edge, outer, a0, free, span, this.z, this.S.out_mirror, k].join();
    if (key === this.handles_key) return;          // nothing moved: the handles stay as they are
    this.handles_key = key;
    const tone = G.GUIDE_COLOURS[k], s = 1 / this.z, flip = this.S.out_mirror ? -1 : 1;
    const at = (r, a) => G.clock_point(r, a).map((v) => v.toFixed(4)).join(" ");
    const shape = { radius: `<circle r="${HANDLE_R}"/>`, size: `<rect x="${-HANDLE_R}" y="${-HANDLE_R}" width="${2 * HANDLE_R}" height="${2 * HANDLE_R}"/>`,
      start: `<path d="M${-HANDLE_R} ${-HANDLE_R}L${HANDLE_R} 0L${-HANDLE_R} ${HANDLE_R}Z"/>`, span: `<path d="M${HANDLE_R} ${-HANDLE_R}L${-HANDLE_R} 0L${HANDLE_R} ${HANDLE_R}Z"/>` };
    const tip = { radius: "Radius: drag in or out", size: { numerals: "Size", text: "Size", band: "Band width", ticks: "Length", markers: G.SHAPES[R.shape] === "dot" ? "Ø" : "Length" }[kind] + ": drag in or out", start: "Start: drag round", span: "Span: drag round" };
    const place = { radius: [R.r, free], size: [edge, free], start: [out, a0], span: [out, (+R.start || 0) + span] };
    const parts = Object.keys(place).filter((w) => w !== "span" || span < 360).map((w) => {
      const [r, a] = place[w];
      // a handle stands upright on the screen; the triangles turn with their angle, pointing round the ring
      const turn = w === "start" || w === "span" ? a : 0;
      return `<g class="handle ${w}" data-handle="${w}" data-tip="${tip[w]}" transform="translate(${at(r, a)}) scale(${(flip * s).toFixed(6)} ${(-s).toFixed(6)}) rotate(${(flip * turn).toFixed(3)})"><circle class="reach" r="${HANDLE_REACH}"/>${shape[w]}</g>`;
    });
    H.style.setProperty("--handle", tone);
    H.innerHTML = parts.join("");
  }

  /** a handle dragged: the pointer, in mm on the dial, sets its value as the row would (set_value). */
  handle_events() {
    const H = this.handles;
    H.addEventListener("pointerdown", (e) => {
      const g = e.target.closest("[data-handle]");
      if (!g) return;
      e.stopPropagation(); e.preventDefault();      // not a pan, not a press on the dial
      const R = this.ring(), what = g.dataset.handle, kind = G.kind_of(R);
      const key = what === "size" ? (G.has_text(R) ? "size" : kind === "band" ? "width" : G.SHAPES[R.shape] === "dot" ? "w" : "len") : what === "radius" ? "r" : what;
      const ext = { ticks: R.len, markers: R.len, band: R.width }[kind] || 0;
      let outer = R.r + G.from_shift(R, ext), inner = outer - ext;
      if (G.has_text(R)) { const x = G.radial_extent(this.statik?.rings?.find((d) => d.ring === R)?.path); if (x) [inner, outer] = x; }
      const edge = Math.abs(outer - R.r) >= Math.abs(R.r - inner) ? outer : inner;
      this.handle_drag = { what, key, v0: R[key], reach: Math.abs(edge - R.r) || 0.01, side: Math.sign(edge - R.r) || -1, r0: R.r, prev: null, x: e.clientX, y: e.clientY, moved: false };
      H.setPointerCapture(e.pointerId);
      H.classList.add("dragging");
      this.tag_hide();
    });
    H.addEventListener("pointermove", (e) => {
      const d = this.handle_drag;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 3) return;      // a press that hasn't moved changes nothing
      d.moved = true;
      const b = this.svg.getBoundingClientRect(), [x, y] = this.to_mm([e.clientX - b.left, e.clientY - b.top]);
      const dist = Math.hypot(x, y), angle = ((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360;
      this.guides_live();
      if (d.what === "radius") return this.set_value("ring", "r", +Math.max(dist, 0.05).toFixed(2));
      if (d.what === "size") {                       // the edge follows the pointer: the value grows as its reach from the dotted line does
        const reach = Math.max((dist - d.r0) * d.side, 0.02);
        return this.set_value("ring", d.key, +(d.v0 * reach / d.reach).toFixed(3));
      }
      if (d.what === "start") return this.set_value("ring", "start", Math.round(((angle + 540) % 360) - 180));
      const R = this.ring(), s0 = ((+R.start || 0) % 360 + 360) % 360;
      let span = ((angle - s0) % 360 + 360) % 360;
      if (d.prev !== null && d.prev - span > 180) span = 360; else if (d.prev !== null && span - d.prev > 180) span = 1;
      d.prev = span = Math.min(Math.max(Math.round(span), 1), 360);
      this.set_value("ring", "span", span);
    });
    const end = () => { this.handle_drag = null; H.classList.remove("dragging"); };
    H.addEventListener("pointerup", end);
    H.addEventListener("pointercancel", end);
  }

  /** a case round the dial (4.66; farukahmet's PR #3, "abstractified" — bezels.js), drawn again only when its kind or
   *  the dial's size changes. Preview only: never in an export or the Tiny Preview (R26). */
  draw_bezel() {
    const S = this.S, key = `${S.bezel || 0}/${S.dial_d}/${S.strap}/${S.c_strap}`;
    if (key === this.bezel_key) return;
    this.bezel_key = key;
    this.bezel_g.innerHTML = S.bezel ? bezel_svg(S.bezel, S.dial_d, S.strap, S.c_strap) : "";
  }

  /** the case's switch, beside Backdrop (4.66): its kind's name and a chevron; the system's list over it, unseen. */
  case_box() {
    const word = el("span", { className: "word" });
    const arrow = el("span", { className: "arrow" });
    arrow.innerHTML = icon(SIGNS.up);
    const menu = el("select", { id: "case-pick", ariaLabel: "A case round the dial (preview only)", title: "A case round the dial (preview only)" });
    BEZELS.forEach((name, i) => menu.append(el("option", { value: String(i), textContent: i ? name : "No case" })));
    menu.onchange = () => { this.set_value("global", "bezel", +menu.value); this.render(); };      // the view stays on the dial (4.69; it fitted the case in 4.66–4.68)
    const box = el("span", { className: "onview casebox", id: "case" }, word, arrow, menu);
    // its strap (4.69; Okay, 18 Oct 2026, 22:35: "Add straps to bezels metal bands too … Add strap color change option"):
    // a second switch beside it while a case is on — the strap's colour as a chip (a press opens the colour pop-out),
    // then its kind's name and a chevron over the system's list: No strap · Strap · Bracelet. A bracelet is the case's metal: no chip
    const dot = el("button", { type: "button", className: "dot strapdot", id: "strap-colour", title: "The strap’s colour", ariaLabel: "The strap’s colour" });
    dot.onclick = () => this.pop_open({ read: () => this.S.c_strap, write: (v) => this.set_value("global", "c_strap", v), label: () => "Strap" }, dot);
    const sword = el("span", { className: "word" }), sarrow = el("span", { className: "arrow" });
    sarrow.innerHTML = icon(SIGNS.up);
    const smenu = el("select", { id: "strap-pick", ariaLabel: "The case’s strap (preview only)", title: "The case’s strap (preview only)" });
    STRAPS.forEach((name, i) => smenu.append(el("option", { value: String(i), textContent: i ? name : "No strap" })));
    smenu.onchange = () => { this.set_value("global", "strap", +smenu.value); this.render(); };
    const strap = el("span", { className: "onview casebox strapbox", id: "strap" }, dot, el("span", { className: "strapkind" }, sword, sarrow, smenu));
    this.case_sync = () => {
      const S = this.S, i = S.bezel || 0, k = S.strap || 0;
      word.textContent = i ? BEZELS[i] : "Case"; menu.value = String(i); box.classList.toggle("on", i > 0);
      strap.hidden = !i; sword.textContent = k ? STRAPS[k] : "Strap"; smenu.value = String(k); strap.classList.toggle("on", k > 0);
      dot.hidden = k !== 1; paint(dot, S.c_strap);
    };
    this.case_sync();
    return [box, strap];
  }

  /** X-ray (4.72, #346; Okay, 18 Oct 2026, on the disc sketches: "a3 not enough, a2 and others"): a switch beside the
   *  case's, shown while a window with a disc is on — a date, day or am · pm window. On, every such window's disc is
   *  drawn whole under the plate, the plate a veil over it (G.XRAY_VEIL). Preview only: never in an export (R5, R26). */
  xray_box() {
    const b = el("button", { type: "button", className: "onview casebox xraybox", id: "xray", title: "X-ray: the windows' discs under the plate (preview only)", onclick: () => this.set_value("global", "xray", !this.S.xray) }, el("span", { className: "word", textContent: "X-ray" }));
    this.xray_sync = () => {
      const S = this.S, has = G.windows_of(S).some((w) => w.on && ["date", "day", "am · pm"].includes(G.WINDOW_KINDS[w.kind]));
      b.hidden = !has; b.classList.toggle("on", Boolean(S.xray)); b.setAttribute("aria-pressed", String(Boolean(S.xray)));
    };
    this.xray_sync();
    return b;
  }

  /** the selected window's disc past the case, with physics on (4.72): how far, in mm, or 0. (The panel shows the
   *  selected window's rows; its settings come as a fresh object each time, so they are found by the selection.) */
  disc_past() {
    const d = G.disc_of(this.S, this.S.ui_window);
    return d && !d.fits ? d.reach - (this.S.dial_d / 2 - G.DISC_RIM) : 0;
  }

  /** guides, at the preview's bottom left since 4.59 (its top right from 12 Oct 2026, Okay, to 4.58): a switch (a bullseye and the word; solid outline = on,
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
      none.dataset.k = "none";
      dots.append(none);
      G.GUIDE_COLOURS.forEach((hex, i) => {
        const b = el("button", { type: "button", className: "tone", title: hex, ariaLabel: hex, onclick: () => { set(i); this.sync_rows(); this.render(); } });
        b.style.setProperty("--c", hex);
        b.dataset.k = i;
        dots.append(b);
      });
      for (const b of dots.children) b.setAttribute("role", "radio");
      const label = el("span", { className: "name", textContent: name, title: name });
      const line = el("div", { className: "guidekind" }, label, dots);
      const refresh = () => {
        const k = get();
        line.classList.toggle("off", k === null);
        for (const b of dots.querySelectorAll("[data-k]")) { const on = b.dataset.k === "none" ? k === null : +b.dataset.k === k; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); }
      };
      return { line, label, refresh };
    };
    this.guide_dots = dots_line;
    // the dial's own: the centre hole (first, Okay, 16 Oct 2026, #267) and the centre lines. Not the dial edge (gone, 15 Oct
    // 2026) nor the windows' radii (each window has its own guides since #271, under Windows)
    this.guide_kinds = [G.GUIDE_KINDS[5], G.GUIDE_KINDS[1]].map(([show, colour, name]) => {
      const d = dots_line(name, () => (this.S[show] ? this.S[colour] : null), (k) => { if (k === null) this.S[show] = false; else { this.S[show] = true; this.S[colour] = k; } }, "guide-" + show);
      list.append(d.line);
      return d;
    });
    // the rings' guides: each ring's edges in that ring's own colour (Okay, 13 Oct 2026: "connect guides to layers").
    // One switch for which rings show theirs, then a line per ring; built again when the ring list changes (sync_guides).
    const which = el("span", { className: "segs", role: "radiogroup", ariaLabel: "Which rings show their guides" });
    [["All", true, true], ["Selected", false, true], ["None", false, false]].forEach(([word, rings, sel]) => {
      const b = el("button", { type: "button", id: "guide-rings-" + word.toLowerCase(), textContent: word, title: { All: "Every ring’s; the selected one’s stronger while the Rings tab is open", Selected: "The selected ring’s, while the Rings tab is open (#301)", None: "No ring’s" }[word], onclick: () => { this.S.gd_rings = rings; this.S.gd_sel = sel; this.sync_rows(); this.render(); } });
      b.setAttribute("role", "radio");
      which.append(b);
    });
    this.guide_which = which;
    this.guide_rings = el("div", { className: "guiderings" });
    // the windows' guides, as the rings' (Okay, 16 Oct 2026, #271: "Windows get their own sub category like rings.
    // Selected comes default"): which windows show theirs, then a line per window that is on
    const which_w = el("span", { className: "segs", role: "radiogroup", ariaLabel: "Which windows show their guides" });
    [["All", true, true], ["Selected", false, true], ["None", false, false]].forEach(([word, wins, sel]) => {
      const b = el("button", { type: "button", id: "guide-windows-" + word.toLowerCase(), textContent: word, title: { All: "Every window’s; the selected one’s stronger while the Windows tab is open", Selected: "The selected window’s, while the Windows tab is open (#301)", None: "No window’s" }[word], onclick: () => { this.S.gd_wins = wins; this.S.gd_wsel = sel; this.sync_rows(); this.render(); } });
      b.setAttribute("role", "radio");
      which_w.append(b);
    });
    this.guide_which_w = which_w;
    this.guide_windows = el("div", { className: "guiderings" });
    // guides you add: a line, a crosshair, a circle (Okay: "add an option to add others, crosshair, straight line etc.")
    this.guide_more = el("div", { className: "guidemore" });
    const adds = el("span", { className: "segs" });
    G.GUIDE_MORE.forEach((kind, i) => adds.append(el("button", { type: "button", id: "guide-add-" + kind, textContent: kind[0].toUpperCase() + kind.slice(1), onclick: () => {
      const used = new Set((this.S.gd_more || []).map((g) => g.k));
      this.S.gd_more = [...(this.S.gd_more || []), { kind: i, a: 0, r: +(this.S.dial_d / 4).toFixed(2), k: [3, 0, 2, 5, 4, 1].find((k) => !used.has(k)) ?? 3 }];
      this.sync_rows(); this.render();
    } })));
    this.guide_windows_head = el("div", { className: "guidehead" }, el("span", { className: "name", textContent: "Windows" }), which_w);
    list.append(el("div", { className: "guidehead" }, el("span", { className: "name", textContent: "Rings" }), which), this.guide_rings,
      this.guide_windows_head, this.guide_windows,
      el("div", { className: "guidehead add" }, el("span", { className: "name", textContent: "Add" }), adds), this.guide_more);
    // the last line: Thickness, its number with a compact plus and minus (a side row's number box), and Reset All after
    // a rule (Okay, 16 Oct 2026, #271: "Guide thickness and reset on the same line, value boxes get an attached compact
    // plus minus to gain space … Reset also gets a vertical separator before. Written as 'Reset All'"). Its question
    // ("Are you sure?") comes with the number popup (phase E)
    this.guide_rows = [this.build_row({ ...num("gd_w", "Thickness", 0.25, 6, 0.25), scope: "global", side: true })];
    // Reset All asks first, in its line's place: "Reset all guides?" and round ✕ and ✓ (#271; answer: it resets the
    // guides only, and says so)
    const ask = (on) => { last.classList.toggle("asking", on); question.hidden = !on; if (on) yes.focus(); };
    const reset = el("button", { type: "button", className: "btn", id: "guides-reset", textContent: "Reset All", title: "Every guide as it started", onclick: () => ask(true) });
    const round = (id, text, title, act) => { const b = el("button", { type: "button", className: "roundb", id, title, ariaLabel: title, onclick: act }); b.innerHTML = icon(text, 12); return b; };
    const no = round("guides-reset-no", `<path d="M3 3L9 9M9 3L3 9" ${sw(SLANT)}/>`, "Keep the guides", () => { ask(false); reset.focus(); });
    const yes = round("guides-reset-yes", `<path d="M2.5 6.25L5 8.75L9.5 3.5" ${sw(SLANT)}/>`, "Reset all guides", () => {
      for (const key of Object.keys(G.DEFAULTS)) if (key.startsWith("gd_")) this.S[key] = structuredClone(G.DEFAULTS[key]);
      for (const ring of this.S.rings) ring.guide = G.RING_BASE.guide;       // the rings' own colours too: by their place again
      for (const w of G.windows_of(this.S)) w.guide = G.WINDOW_BASE.guide;      // and the windows'
      ask(false);
      this.sync_rows();
      this.render();
      reset.focus();
    });
    const question = el("span", { className: "ask", hidden: true }, el("span", { textContent: "Reset all guides?" }), el("span", { className: "answers" }, no, yes));
    question.onkeydown = (e) => { if (e.key === "Escape") { e.stopPropagation(); ask(false); reset.focus(); } };
    const last = this.guide_rows[0].el, box_ = last.querySelector(".numbox");
    this.name_opens(last.querySelector("label"), this.guide_rows[0].row);      // its slider is in its popup (R15 form B, #271)
    const cell = el("span", { className: "numcell" });
    box_.replaceWith(cell);
    cell.append(box_);
    last.classList.add("guidelast", "popfoot");
    last.append(el("span", { className: "resetall" }, reset), question);
    list.append(last);
    const box = el("div", { className: "guides" }, this.guides_tick, more, list);
    box.onkeydown = (e) => { if (e.key === "Escape" && !list.hidden) { open(false); more.focus(); } };
    return box;
  }

  /** shadows, at the preview's bottom left, over the Backdrop switch (a trial; Okay, 14 Oct 2026): a switch and,
   *  joined to it, an arrow that opens their settings upward — made like the Guides switch. Preview only (R5). */
  shadows_box() {
    this.shadows_tick = el("button", { type: "button", className: "onview guidesbox shadowsbox", id: "shadows", onclick: () => this.set_value("global", "sh_on", !this.S.sh_on) });
    this.shadows_tick.innerHTML = icon(TOOL_ICONS.shadows, 18);      // its sign, before its word, as Guides has
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
      head("Under the plate · mm"), ...under.map((r) => r.el), el("div", { className: "guidefoot popfoot" }, reset));
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
    const sun = this.show && this.sun();
    // the showcase: shadows on, soft, from its own sun, as dark as its light. Anywhere: the soft edge waits while
    // something moves (moving())
    const S = sun ? { ...this.S, sh_on: true, sh_blur: !this.moving(), sh_from: sun.from, sh_rise: sun.rise, sh_dark: Math.min(this.S.sh_dark * SHOW_DARKER, 100) * sun.light } : { ...this.S, sh_blur: this.S.sh_blur && !this.moving() };
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
    const cap_r = G.cap_shows(S) ? S.ha_cap / 2 : 0;
    const top = Math.max(S.sh_cap, ...hands.map((h) => h.z));
    // what a part's shadow does to the surface under it (Okay, 16 Oct 2026, #295: "shadow of transparent items are
    // extreme. Realistic color shadows maybe?"): the shadow multiplies the surface, channel by channel, by
    // 1 − dark × (1 − T), where T is the light that gets through the part: (1 − α)(1 + α × its colour). An opaque part
    // lets none through, whatever its colour: the shadow it always cast. A see-through one casts less, and in its colour.
    const dark = clamp(S.sh_dark, 0, 100) / 100;
    const tint = (c = [0, 0, 0, 1]) => { const a = clamp(c[3] ?? 1, 0, 1); return `rgb(${[0, 1, 2].map((k) => Math.round(255 * (1 - dark * (1 - (1 - a) * (1 + a * c[k]))))).join(", ")})`; };
    hands.sort((p, q) => (p.item.fill?.[3] ?? 1) - (q.item.fill?.[3] ?? 1));      // see-through first, so a solid part's shadow covers theirs where they cross: never darker twice

    // one surface: its group goes just before `before` (a node, or null for the end), clipped to its own outline
    const surface = (name, before, outline, from_z) => {
      const g = part(name, "g", this.dial), clip = part(name + "/clip", "clipPath", shade.defs);
      clip.id = "shadow-clip-" + name;
      outline.forEach(([d, turn], k) => { const p = part(`${name}/clip/${k}`, "path", clip); set(p, "d", d); set(p, "transform", turn ? `rotate(${f(-turn)})` : ""); });
      set(g, "clip-path", `url(#${clip.id})`);
      g.removeAttribute("opacity"); g.removeAttribute("fill");      // each shadow its own tint (#295), multiplied onto the surface
      set(g, "style", "mix-blend-mode: multiply");
      set(g, "pointer-events", "none");
      if (S.sh_blur) set(g, "filter", "url(#shadow-soft)"); else g.removeAttribute("filter");
      if (g.nextSibling !== before) this.dial.insertBefore(g, before);
      // what falls on it: every hand higher than it, then the pipes' band up to the cap's top
      let k = 0;
      const cast = (d, turn, dz, colour) => {
        const p = part(`${name}/cast/${k++}`, "path", g), [x, y] = away(dz);
        set(p, "d", d);
        set(p, "fill", tint(colour));
        set(p, "transform", `translate(${f(x)} ${f(y)})` + (turn ? ` rotate(${f(-turn)})` : ""));
      };
      for (const h of hands) if (h.z > from_z) cast(h.d, h.item.angle, h.z - from_z, h.item.fill);
      if (cap_r && top > from_z) {
        // the pipes stand from the plate's face (0) to the cap's top: on a surface under the plate their band starts
        // where the face's height lands, not at the centre
        const [x0, y0] = away(Math.max(0, -from_z)), [x, y] = away(top - from_z);
        const len = Math.hypot(x - x0, y - y0) || 1, nx = -(y - y0) / len * cap_r, ny = (x - x0) / len * cap_r;
        const ring = (cx, cy) => `M${f(cx - cap_r)} ${f(cy)}A${f(cap_r)} ${f(cap_r)} 0 1 0 ${f(cx + cap_r)} ${f(cy)}A${f(cap_r)} ${f(cap_r)} 0 1 0 ${f(cx - cap_r)} ${f(cy)}Z`;
        for (const d of [ring(x0, y0), ring(x, y), `M${f(x0 + nx)} ${f(y0 + ny)}L${f(x + nx)} ${f(y + ny)}L${f(x - nx)} ${f(y - ny)}L${f(x0 - nx)} ${f(y0 - ny)}Z`]) {
          const p = part(`${name}/cast/${k++}`, "path", g);
          set(p, "d", d);
          set(p, "fill", tint(S.c_cap));
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
      s.cast(this.slots[plate_at].d, 0, S.sh_disc, S.c_plate);
    }
    // the plate's face, with everything printed on it: drawn after the last thing before the hands
    if (plate_at >= 0 && hands.length) {
      const first = items.findIndex((x) => x.role === "hand" || x.role === "cap" || x.role === "guide");
      surface("plate", first >= 0 ? nodes[first] : null, [[this.slots[plate_at].d, 0]], 0);
    }
    // each hand catches the hands above it
    const after = (i) => { let n = i + 1; while (items[n]?.role === "mark" && items[n].name === items[i].name) n++; return n; };      // past a disc's painted mark, which catches the shadow too (#300)
    for (const h of hands) if (hands.some((o) => o.z > h.z) || (cap_r && top > h.z)) surface("hand-" + h.item.name, nodes[after(h.i)] || null, [[h.d, h.item.angle]], h.z);
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
    // which windows show theirs, and a line per window that is on (#271)
    const which_w = S.gd_wins ? 0 : S.gd_wsel ? 1 : 2;
    [...this.guide_which_w.children].forEach((b, n) => { b.classList.toggle("on", n === which_w); b.setAttribute("aria-checked", String(n === which_w)); });
    const shown = G.windows_of(S).map((w, i) => (w.on ? i : -1)).filter((i) => i >= 0), wins = JSON.stringify(shown.map((i) => [i, G.window_place(G.windows_of(S)[i])]));
    if (this.guide_windows.dataset.wins !== wins) {
      this.guide_windows.dataset.wins = wins;
      this.guide_window_lines = shown.map((i) => {
        const d = this.guide_dots(`Window at ${G.window_place(G.windows_of(this.S)[i])}`, () => G.window_guide(this.S, i), (k) => { G.windows_of(this.S)[i].guide = k === null ? -2 : k; });
        d.line.classList.add("ring");
        d.index = i;
        return d;
      });
      this.guide_windows.replaceChildren(...this.guide_window_lines.map((d) => d.line));
    }
    this.guide_windows_head.hidden = this.guide_windows.hidden = !shown.length;      // no window on: nothing to say (R16)
    this.guide_window_lines.forEach((d) => { d.refresh(); d.line.classList.toggle("selected", d.index === S.ui_window); });
    // the guides added by hand, one line each (#305): its name and measures (quiet numbers to type in), its colours,
    // and in the none sign's place a cross that removes it
    const more = JSON.stringify((S.gd_more || []).map((g) => g.kind));
    if (this.guide_more.dataset.more !== more) {
      this.guide_more.dataset.more = more;
      this.guide_more_lines = (S.gd_more || []).map((g, i) => {
        const kind = G.GUIDE_MORE[g.kind], d = this.guide_dots(kind[0].toUpperCase() + kind.slice(1), () => (this.S.gd_more[i].k >= 0 ? this.S.gd_more[i].k : null), (k) => { this.S.gd_more[i].k = k === null ? -2 : k; });
        const field = (key, word, length) => {      // the angle: 45°; the radius: r 8
          const input = el("input", { type: "text", inputMode: "decimal", id: `guide-more-${i}-${key}`, title: key === "a" ? "Angle, degrees" : "Radius", ariaLabel: key === "a" ? "Angle" : "Radius" });
          input.onchange = () => { const now = this.S.gd_more[i][key] * (length ? this.unit()[2] : 1); this.S.gd_more[i][key] = +(parse_number(input.value, now) / (length ? this.unit()[2] : 1)).toFixed(4); this.sync_rows(); this.render(); };
          input.oninput = () => { input.style.width = `${Math.max(1, input.value.length)}ch`; };      // as wide as it is
          const words = key === "a" ? [input, el("span", { textContent: word })] : [el("span", { textContent: word }), input];
          return { key, length, input, el: el("label", { className: "guidefield" }, ...words) };
        };
        const fields = [...(kind !== "circle" ? [field("a", "°", false)] : []), ...(kind !== "line" ? [field("r", "r", true)] : [])];
        const gone = el("button", { type: "button", className: "remove", id: `guide-more-${i}-remove`, title: "Remove this guide", ariaLabel: "Remove this guide", onclick: () => { this.S.gd_more = this.S.gd_more.filter((_, n) => n !== i); this.sync_rows(); this.render(); } });
        gone.innerHTML = cross_dot;
        d.label.replaceChildren(el("span", { className: "word", textContent: d.label.textContent }), ...fields.map((f) => f.el));
        d.line.classList.add("added");
        d.line.querySelector(".dots .none").replaceWith(gone);
        return { ...d, fields };
      });
      this.guide_more.replaceChildren(...this.guide_more_lines.map((d) => d.line));
    }
    this.guide_more_lines.forEach((d, i) => {
      d.refresh();
      for (const f of d.fields) if (document.activeElement !== f.input) { f.input.value = f.length ? String(parseFloat(this.in_unit(S.gd_more[i][f.key], 2))) : String(+(+S.gd_more[i][f.key]).toFixed(1)); f.input.oninput(); }
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

  /** folded groups are remembered by this browser (a convenience, not part of the dial). A pane this browser has never
   *  folded or opened starts as its row says (`folded`: a first visit, #270), unless "*" is kept: one fold for every
   *  such pane (the tests keep "*": false, a visitor who has opened them all). */
  is_folded(r) {
    if (r.row.headless) return false;              // a pane with no heading has nothing to fold it (the hand's, #261)
    if (!this.folds) { try { this.folds = JSON.parse(localStorage.getItem("dial-tool-folds")) || {}; } catch (e) { this.folds = {}; } }
    return this.folds[r.fold] ?? this.folds["*"] ?? Boolean(r.row.folded);
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
    if (this.case_sync) this.case_sync();      // the case's switch follows an undo, a link, a file (4.66)
    if (this.xray_sync) this.xray_sync();      // X-ray's, too (4.72)
    this.sync_guides();
    this.sync_shadows();
    this.sync_ring_summaries();
    paint(this.backdrop_dot, this.S.c_backdrop);
    if (this.unit_button.textContent !== this.unit()[0]) this.size_unit();
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

  /** this dial's colours: every part that has one, each colour once — in the order the Colours pane lists them (rings
   *  and their sectors, hands, cap, windows), or with the page: plate, backdrop, cap, then the rest (the colour
   *  pop-out's "On this dial", in its own order). */
  dial_colours(page = true) {
    const S = this.S, rings = S.rings.flatMap((r) => [r.c, ...Object.values(r.cs || {})]), hands = G.HANDS.map((h) => S["ha_" + h].c), windows = G.windows_of(S).filter((w) => w.on).map((w) => w.ink);
    const all = page ? [S.c_plate, S.c_backdrop, S.c_cap, ...rings, ...hands, ...windows] : [...rings, ...hands, S.c_cap, ...windows];      // the pop-out's order as it was (4.38)
    const once = new Map();
    for (const c of all) if (Array.isArray(c)) { const hex = to_hex(c).toUpperCase(); if (!once.has(hex)) once.set(hex, c); }
    return [...once.values()];
  }

  /** a summary's parts in a line, a dot between them: words as words, a colour as a tiny swatch (colours side by side
   *  with a space between, no dot). */
  show_summary(box, parts) {
    box.replaceChildren();
    parts.filter((part) => part !== undefined && part !== null && part !== false && part !== "").forEach((part, i, parts) => {      // an empty part says nothing and takes no dot
      if (i) box.append(typeof part === "string" || typeof parts[i - 1] === "string" ? " · " : " ");
      if (typeof part === "string") return box.append(part);
      const dot = el("i", { className: "dot tiny", title: to_hex(part.c).toUpperCase() });
      paint(dot, part.c);
      box.append(dot);
    });
  }

  /** one row of the form → {row, el, refresh(T)}. */
  build_row(row) {
    const wrap = el("div", { className: "row " + row.kind + (row.nest ? " nest" : "") + (row.side ? " side" : "") + (row.under ? " under" : "") });      // under: a note about the controls above, on their column
    const tied = () => { if (row.tie) out.el.classList.add("tied"); };      // tie: this row belongs to the one above it, no line between them
    const out = { row, el: wrap, refresh: () => {} };
    const set = (v) => this.set_value(row.scope, row.key, v);
    const id = row.id || `${row.scope}-${row.key}-${row.text || row.name}`.replace(/[^A-Za-z0-9]+/g, "-");      // id: when two rows would share one
    const active = (e) => document.activeElement === e;

    if (row.kind === "hdr") {                      // a heading: click it to fold or unfold its group
      out.fold = `${SECTIONS[this.S.ui_section]}/${row.text || row.name}`;
      // the eye in the left column says whether the pane is open; the whole heading is its button
      const title = el("h2", { textContent: row.text || "" });
      out.eye = el("span", { className: "eye" });
      out.summary = el("span", { className: "summary quiet" });
      out.button = el("button", { type: "button", className: "fold", title: "Show or hide this pane", onclick: () => this.fold(out, !this.is_folded(out)) }, out.eye, title, out.summary);
      out.body = el("div", { className: "body" });
      out.el = el("section", { className: (row.headless ? "pane headless" : row.bare ? "pane bare" : "pane") + (row.cls ? " " + row.cls : "") }, out.button, out.body);      // cls: a pane laid out its own way (Positions, #357)      // ("plain" is a button's class) · bare: open, the heading gives way to what is in it (the Type pane, #319)
      if (row.headless) out.button.hidden = true;
      if (row.tools) {                             // tools on the heading line, at its right; folded, the summary stands there instead
        out.el.classList.add("tooled");
        out.button.after(this["head_" + row.tools]());
      }
      if (row.title) out.refresh = (T) => { title.textContent = row.title(T, this.is_folded(out)); };
      return out;
    }
    if (row.kind === "note") {                     // a line of words; its words may follow the dial (a function of the row's settings, 4.72)
      const words = el("span", { className: "quiet", textContent: typeof row.text === "function" ? "" : row.text });
      wrap.append(el("span"), words);
      if (typeof row.text === "function") out.refresh = (T) => { words.textContent = row.text(T); };
    }

    if (row.kind === "num") {                      // label · slider · typed field · stepper (R15)
      const slider = el("input", { type: "range", min: row.lo, max: row.hi, step: row.step, id: id + "-slider" });
      const field = el("input", { type: "text", id, inputMode: "decimal", title: "1.2 sets · +0.5 adds · x0.5 multiplies · /2 divides" });
      // under a finger (or a pen) a row's slider opens the controller, tapped or slid — its knob is small for a fingertip;
      // the field takes typing and − + step, as with a mouse (Okay, 18 Oct 2026, 22:35: "On phones and ipad tapping or
      // sliding slider or title opens controller, you can type in box or tap plusminus"; from 4.60 to 4.67 the field and
      // the − + opened it instead)
      if (!row.inpop) slider.addEventListener("touchstart", (e) => {
        e.preventDefault();      // the slider itself doesn't move
        const t = e.touches[0];
        this.value_pop_open(field, row, { x: t.clientX, y: t.clientY });
      }, { passive: false });
      const commit = (v) => {
        v = row.whole ? Math.round(v) : +(+v).toFixed(6);
        set(row.whole ? clamp(v, row.lo, row.hi) : v);       // typing past the slider's range is allowed
      };
      // a length is kept in mm and shown in the chosen unit: per = how many of that unit make a mm, places = decimals shown
      const length = is_length(row);
      const per = () => (length ? this.unit()[2] : 1), places = () => Math.max(0, decimals(row.step) + (length ? this.unit()[3] : 0));
      const shown = (v) => (row.trim ? String(parseFloat((v * per()).toFixed(places()))) : (v * per()).toFixed(places())) + (row.suffix || "");      // trim: no trailing zeros, so −142.5° fits a small box (Positions)      // suffix: a degree sign in the field (Positions, #357); parse_number reads past it
      const now = () => { const T = this.target(row.scope); return T[row.key] ?? (row.or ? row.or(T) : 0); };      // or: what an unset number is (a window's tracking: the numerals')
      let typing = false;                          // the field follows every change, except while you type in it
      slider.oninput = () => { if (row.inpop || row.scope === "nudge") this.guides_live(row.scope !== "nudge"); commit(+slider.value); };
      field.oninput = () => { typing = true; };
      field.onblur = () => { typing = false; out.refresh(this.target(row.scope)); };
      field.onchange = () => { typing = false; commit(parse_number(field.value, now() * per()) / per()); out.refresh(this.target(row.scope)); };
      field.onkeydown = (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); commit(now() + (e.key === "ArrowUp" ? 1 : -1) * row.step * (e.shiftKey ? 10 : 1)); }
      };
      // − and +: as typed signs in a full row; in the popup the thick ones (BIG); beside a quiet number the tiny ones
      const step = (dir) => {
        const b = el("button", { type: "button", className: "step", tabIndex: -1, onclick: () => commit(now() + dir * row.step) });
        const sign = (row.inpop ? BIG : row.side || row.block ? SIGNS : STEP)[dir > 0 ? "plus" : "minus"];      // a narrow box (beside a hand's box, a quiet row, Positions) the shared 9-across signs, so they keep their room
        const svg_sign = !row.inpop && (row.side || row.block);
        b.innerHTML = svg_sign ? icon(sign) : sign; b.ariaLabel = dir > 0 ? "Plus" : "Minus";
        if (row.inpop) b.id = "value-pop-" + (dir > 0 ? "plus" : "minus");
        return b;
      };
      const label = el("label", { htmlFor: id, textContent: row.text });
      slider.ariaLabel = row.text;                 // the label is the field's; the slider says its name itself (#244, 4.47.2)
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
      if (row.inpop) slider.ariaLabel = field.ariaLabel = row.text;      // the popup's head says its name too (4.49.2)
      if (!row.inpop && !row.side && !row.bare && !row.button && !row.block) this.name_opens(label, row);      // form A: its name opens the popup (#249)
      // one number box for the whole tool (4.64; Okay, 18 Oct 2026, 21:20: "This version of boxes win: small plusminus and
      // these new thick border ones are retired, these replace all … Number box touches minus box"): the value in its
      // box, then − and + in theirs, all touching. A full row: name · slider · box. Beside a hand's box (side), the same,
      // narrower. A quiet row (form B) and a Positions block: name · box, the slider in the controller its name opens.
      // (Until 4.63: a quiet number with a tiny ± beside a hand's box, #250; thick-lined blocks in Positions and the font box.)
      const numbox = () => el("span", { className: "numbox" }, field, el("span", { className: "steps" }, step(-1), step(1)));
      if (row.side) {
        wrap.append(lead, slider, numbox());
        if (!row.inpop) this.name_opens(label, row);      // its name opens the controller, as a full row's does (#249)
        if (row.quiet) wrap.classList.add("quiet");      // form B: no slider on the row (#251)
      } else if (row.link) {
        // the LINK pill on the line under this row, between its name and the next row's (#358): a white outline on the
        // pane's ground, LINK in the pixel font; pressed, dark with LINKED in white
        wrap.append(lead, slider, numbox());
        const pill = el("button", { type: "button", className: "linkpill", id: id + "-link" });
        pill.onclick = () => this.set_value(row.scope, row.link, !this.target(row.scope)[row.link]);
        wrap.classList.add("haslink");
        wrap.append(pill);
        out.link = pill;
      } else if (row.block) {
        // a number block (#357, #317; the font box's of 4.54): the name, then the value and its − + joined, no slider
        // on the row; the name opens the controller and drags the value, as a quiet row's does (#249)
        wrap.classList.add("block");
        wrap.append(lead, numbox());
        this.name_opens(label, row);
        if (row.tip) label.dataset.tip = row.tip;      // what it does, in a tag over the name (#357: "Offset and skip need tooltip details")
      } else wrap.append(lead, slider, numbox());
      out.refresh = (T) => {
        const v = T[row.key] ?? (row.or ? row.or(T) : 0);
        if (out.link) { const on = Boolean(T[row.link]); out.link.classList.toggle("on", on); out.link.textContent = on ? "LINKED" : "LINK"; out.link.setAttribute("aria-pressed", String(on)); out.link.ariaLabel = on ? "Width and height linked: press to unlink" : "Link width and height"; }
        if (v > +slider.max) slider.max = v;       // the slider grows to hold a typed value
        if (v < +slider.min) slider.min = v;
        if (+slider.value !== v) slider.value = v;
        filled(slider);
        if (!typing) field.value = shown(v);
        if (menu) { menu.value = T[row.menu.key] ?? 0; label.textContent = label_of(row, T); }
        if (row.say) {                             // a name that follows another setting (a disc's Hole or Mark, #300)
          const [whole, short] = row.say(T);
          if (row.short) { label.querySelector(".whole").textContent = whole; label.querySelector(".short").textContent = short; label.title = whole; } else label.textContent = whole;
        }
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
      const group = el("span", { className: row.small ? "picks small" : row.thumbs ? "picks thumbs" : "picks", role: "radiogroup", ariaLabel: row.text });
      row.items.forEach((name, i) => {
        if (row.skip && row.skip.includes(i)) return;      // an item kept in the list for its place (R9) but not offered here
        const tile = el("button", { type: "button", className: "pickt", id: `${id}-${i}`, title: name, onclick: () => set(i) });
        tile.setAttribute("role", "radio");
        tile.innerHTML = typeof row.pics === "function" ? row.pics(i) : pic(row.pics[i]);
        tile.append(el("span", { textContent: TILE_WORDS[name] || name }));
        group.append(tile);
      });
      const label = el("label", { textContent: row.text, className: row.label ? "strong" : "" });
      if (row.thumbs) {                            // thumbs: pictures alone, a row of their own without a name (a hand's shapes, 4.46.3), and the dashed SVG tile last — a shape of one's own, not built yet
        const own = el("button", { type: "button", className: "pickt own", id: id + "-own", title: "A shape of your own, from an SVG file: not built yet" });
        own.innerHTML = icon(SIGNS.plus);
        own.setAttribute("aria-disabled", "true");
        group.append(own);
        wrap.classList.add("thumbs");
        wrap.append(group);
      } else wrap.append(label, group);
      out.refresh = (T) => {
        if (row.label) label.textContent = row.label(T);
        const tiles = [...group.querySelectorAll('[role="radio"]')];
        tiles.forEach((b, i) => { b.classList.toggle("on", i === T[row.key]); b.setAttribute("aria-checked", String(i === T[row.key])); });
      };
    }

    if (row.kind === "seg") {
      // order: the buttons' order when it isn't the list's (the list only grows at its end, R9) · many: on two lines
      const group = el("span", { className: row.many ? "segs many" : "segs" });
      const buttons = row.items.map((name, i) => el("button", { type: "button", id: `${id}-${i}`, textContent: name, onclick: () => { set(i); if (row.key.startsWith("ui_")) this.sync_rows(); } }));
      group.append(...(row.order || buttons.map((b, i) => i)).map((i) => buttons[i]));
      const name = el("label", { textContent: row.text });
      wrap.append(name, group);
      out.refresh = (T) => { buttons.forEach((b, i) => b.classList.toggle("on", i === T[row.key])); if (row.say) name.textContent = label_of(row, T); };
    }

    if (row.kind === "chk") {
      const box = el("input", { type: "checkbox", id });
      box.onchange = () => set(box.checked);
      wrap.append(el("span"), el("label", { className: "check", htmlFor: id }, box, " " + row.text));
      if (row.tip) wrap.append(this.info_sign(row.tip));
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

    if (row.kind === "custom") this["row_" + row.name](wrap, out, row);
    if (row.scope === "hand" && row.kind === "num") {      // pointing at a hand's number, or in its field, lights its part on the picture (#329)
      wrap.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") this.hand_light(row); });
      wrap.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && this.value_pop?.row !== row) this.hand_light(null); });
      wrap.addEventListener("focusin", () => this.hand_light(row));
      wrap.addEventListener("focusout", () => { if (this.value_pop?.row !== row) this.hand_light(null); });
    }
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
    pill.show = (c) => { paint(dot, c); hex.textContent = to_hex(c).toUpperCase(); if (title) pill.ariaLabel = `${title} ${hex.textContent}`; };      // a screen reader hears whose colour it is, not the hex alone (#244, 4.47.2)
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
    const used = this.dial_colours().map((c) => to_hex(c).toUpperCase());      // this dial's colours, each once
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
    out.refresh = () => this.swatch_lines(lines, () => {
      const i = this.S.ui_ring, at = G.positions_of(this.S.rings[i]), out = [{ text: "Sectors", colours: this.sector_colours(i) }];
      if (at.length % 2 === 0) out.push({ text: "Alternate", colours: this.alternate_colours(i) });
      return out;
    });
  }

  /** a band with an even number of sectors: two colours that alternate round it (Okay, 15 Oct 2026, 11:13: "Segmented
   *  stuff coloring, if even; chose two color to alternate"; 11:32: "Good call on alternatings"). The first is the
   *  ring's own colour and takes sectors 1, 3, 5…; the second takes 2, 4, 6…. Kept in the keys a band already has
   *  (`c`, `cs`), so a link carries it as before. Choosing either puts the whole band in the pattern: sectors 1, 3, 5…
   *  lose a colour of their own. */
  alternate_colours(i) {
    const ring = this.S.rings[i], name = ring.name || G.kind_of(ring);
    const pattern = (R, second) => {
      const cs = { ...R.cs };
      G.positions_of(R).forEach((at, n) => { if (n % 2) cs[at] = second; else delete cs[at]; });
      R.cs = cs;
    };
    return [
      { id: `ring-${i}-alternate-1`, title: `${name} · sectors 1, 3, 5…`, alpha: true,
        read: () => (this.S.rings[i] || {}).c,
        write: (value) => { const R = this.S.rings[i], at = G.positions_of(R); R.c = value; pattern(R, G.sector_colour(R, at[1])); this.changed(true); } },
      { id: `ring-${i}-alternate-2`, title: `${name} · sectors 2, 4, 6…`, alpha: true,
        read: () => { const R = this.S.rings[i]; return R ? G.sector_colour(R, G.positions_of(R)[1]) : null; },
        write: (value) => { pattern(this.S.rings[i], value); this.changed(true); } },
    ];
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
    // the shapes as buttons without words, stretched along the Shape heading's line as Position's are along theirs
    // (#265, 4.46.1; Okay on the mock-ups: "stretch shapes like position, top-right"). The row goes on the heading line (head)
    wrap.className = "row pick";
    const group = el("span", { className: "btnline shapes", role: "radiogroup", ariaLabel: "Shape" });
    const names = G.WINDOW_SHAPES.slice(1);
    names.forEach((name, i) => {
      const tile = el("button", { type: "button", id: `window-shape-${name}`, title: name, ariaLabel: name, onclick: () => this.set_value("window", "shape", i + 1) });
      tile.setAttribute("role", "radio");
      tile.innerHTML = icon(PICS.hole[i], 26, 18);
      group.append(tile);
    });
    wrap.append(el("span"), group);
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

  /** Give way to rings above (#258, 4.50.2): two side tabs (Skip where · Knock out) and a square that pictures the
   *  choice. The picture: a row of this ring's ticks, and over them three marks of rings above, faint — a marker, a
   *  numeral, a tick. Skip where drops the tick under each mark the choice names; Knock out cuts it back by the
   *  clearance instead. Which tab is open is this session's, not the dial's (nothing stored, R31 free). */
  row_give_way(wrap, out) {
    wrap.className = "giveway";
    wrap.id = "give-way";
    const NAMES = ["Skip where", "Knock out"], KEYS = ["skip", "knock"], LISTS = [G.SKIP_FROM, G.KNOCK_FROM];
    const tabs = el("div", { className: "givetabs", role: "tablist", ariaLabel: "How this ring gives way" });
    const box = el("div", { className: "givebox", id: "give-box" });
    const picture = el("div", { className: "givepic", role: "img" });
    const choices = el("div", { className: "givechoices", role: "radiogroup" });
    const clear = this.build_row(num("clear", "Clearance", 0, 2, 0.01, { scope: "ring", side: true, quiet: true }));
    box.append(picture, choices, clear.el);
    wrap.append(tabs, box);
    NAMES.forEach((name, i) => {
      const b = el("button", { type: "button", className: "givetab", id: "give-tab-" + i, textContent: name, role: "tab", onclick: () => { this.give_tab = i; this.sync_rows(); } });
      tabs.append(b);
    });
    // the drawing, 2 : 1: this ring's ticks along the foot, in ink and thick (a dial's ticks pictured, as the kind
    // pictures' are — Okay, 18 Oct 2026, on 4.51.1: "thicker indices, better indication of the actual state on watch");
    // over them, in a lighter tone and as outlines, the marks of the rings above where they really lie — on the same
    // band of the dial — so what the choice does to the ticks under them shows: run through (nothing), gone (skip),
    // cut back by the clearance (knock out). (4.50.2 to 4.51.1: thin lines, the marks above standing over the ticks.)
    const TICKS = [16, 30, 44, 58, 72, 86, 100, 114, 128], ABOVE = { 30: "markers", 72: "numerals", 114: "ticks" }, BOTTOM = { 30: 48.25, 72: 44, 114: 48.25 };
    const draw = (tab, i) => {
      const kinds = G.FROM_KINDS[i], gap = tab === 1 ? Math.max(2, 20 * (this.ring().clear || 0)) : 0;      // the clearance in the drawing: 20 px a mm, never less than a line's width
      const ticks = TICKS.map((x) => {                   // 3 wide, its edges on whole dots
        const kind = ABOVE[x];
        if (!kind || !kinds.includes(kind)) return `M${x + 0.5} 34V62`;
        if (tab === 0) return "";
        return BOTTOM[x] + gap >= 62 ? "" : `M${x + 0.5} ${BOTTOM[x] + gap}V62`;
      }).join("");
      return `<svg viewBox="0 0 144 72" width="144" height="72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="butt">`
        + `<path class="own" d="${ticks}" stroke-width="3"/>`
        + `<g class="above"><rect x="26.75" y="20.75" width="7.5" height="27.5"/>`
        + `<text class="figure" x="72.5" y="34" font-size="26" text-anchor="middle" dominant-baseline="central" fill="none" stroke="currentColor" stroke-width="${DENSE}">6</text>`
        + `<rect x="112.25" y="24.75" width="4.5" height="23.5"/></g></svg>`;
    };
    let drawn = "";
    out.refresh = (R) => {
      const tab = this.give_tab ?? (R.knock && !R.skip ? 1 : 0), key = KEYS[tab], list = LISTS[tab], at = R[key] || 0;
      [...tabs.children].forEach((b, i) => { b.classList.toggle("on", i === tab); b.setAttribute("aria-selected", String(i === tab)); });
      const now = `${tab}:${at}:${R.clear}`;
      if (now !== drawn) {
        drawn = now;
        picture.innerHTML = draw(tab, at);
        choices.ariaLabel = NAMES[tab];
        choices.replaceChildren(...list.map((text, i) => {
          const id = `ring-give-${key}-${i}`;
          const r = el("input", { type: "radio", name: "give-" + key, id, checked: i === at });
          r.onchange = () => { if (r.checked) this.set_value("ring", key, i); };
          return el("label", { className: "check", htmlFor: id }, r, " " + text);
        }));
      }
      picture.ariaLabel = `${NAMES[tab]}: ${list[at]}`;
      clear.el.hidden = !(tab === 1 && R.knock !== 0);
      clear.refresh(R);
    };
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

  /** Reset: the opener back, every setting — the guide's First dial (opener.js). It replaces the whole dial, so it
   *  stands last in the Dial tab, apart from what is changed often, with its warning under it; undo brings the dial back. */
  row_reset_go(wrap) {                             // the button, on the pane's heading line (head)
    const go = el("button", { type: "button", className: "btn reset", id: "reset", textContent: "Reset to the First dial", title: "Replaces the whole dial with the guide’s First dial", onclick: () => { this.reopen({ ...structuredClone(OPENER), ui_section: this.S.ui_section }); tool.log("reset to the opener: the First dial"); } });
    go.setAttribute("aria-describedby", "reset-warning");
    wrap.append(go);
  }
  row_reset(wrap) {                                // its warning, under the heading line
    wrap.append(el("p", { className: "warn", id: "reset-warning", textContent: "Replaces everything on this dial — size, rings, hands, windows, colours — with the guide’s First dial. Undo brings yours back." }));
  }

  /** a blank face (Okay, 18 Oct 2026, notes 2: "For if someone wants a 'blank' face: Under dial, reset to first dial: add
   *  a blank face option. White dial color, no rings, etc."): the starting values with a white plate, no rings and no
   *  windows; the hands stay, so the time still reads (Claude's reading, to confirm). The ring list is never empty (a
   *  ring is always selected), so it holds one ring, hidden: turn its eye on to start. One press replaces the dial, as
   *  Reset does, and Undo brings it back. */
  row_reset_blank(wrap) {
    const go = el("button", { type: "button", className: "btn", id: "reset-blank", textContent: "Blank face", title: "A white plate with hands and nothing else",
      onclick: () => { this.reopen({ c_plate: [1, 1, 1, 1], rings: [{ on: false }], da_on: false, ui_section: this.S.ui_section }); tool.log("a blank face: white plate, hands, no rings, no windows"); } });
    wrap.classList.add("resetblank");      // laid out as Reset's First dial: the button on the controls' column, its words under it (4.64; it wrapped a word a line)
    wrap.append(go, el("span", { className: "quiet", textContent: "White plate and hands, nothing else." }));
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
    this.ring_list = el("ol", { ariaLabel: "Rings, top first" });
    this.ring_list.setAttribute("role", "listbox");      // its rows are options (#244)
    this.ring_list.onscroll = () => this.value_pop_close();      // the pop-up hangs where the ring line was
    wrap.append(this.ring_list);
    this.list_grip();
    this.fill_ring_list();
  }

  /** the ring list holds five rings and the drawer, then scrolls (4f-rings.css). With more rings than that a pill
   *  stands in the middle of the pinned part's black line — the phone's gripper, but black — and dragging it shows
   *  more or fewer rows; a tap jumps between five and all. Remembered by this browser, not by the dial (Okay's notes,
   *  p. 2, #256: "there's a limit to it … a resize pill"). */
  list_grip() {
    const ol = this.ring_list, set = (n) => { this.ring_rows_shown = n; ol.style.setProperty("--ring-rows", String(n)); };
    try { const kept = parseInt(localStorage.getItem("dial-tool-ring-rows")); if (kept >= 1) set(kept); } catch (e) { /* not kept */ }
    const grip = el("div", { className: "listgrip", id: "list-grip", title: "Drag to show more or fewer rings", ariaLabel: "Rings shown" });
    grip.setAttribute("role", "separator");
    const most = () => Math.max(this.S.rings.length, 1), rows = () => this.ring_rows_shown ?? RING_ROWS;
    let down = null;
    grip.onpointerdown = (e) => { grip.setPointerCapture(e.pointerId); down = { y: e.clientY, moved: false }; grip.classList.add("gripping"); };
    grip.onpointermove = (e) => {
      if (!down) return;
      if (Math.abs(e.clientY - down.y) > 4) down.moved = true;
      if (!down.moved) return;
      const c = getComputedStyle(ol), pitch = parseFloat(c.getPropertyValue("--line")) + parseFloat(c.getPropertyValue("--ring-gap")), top = ol.getBoundingClientRect().top + parseFloat(c.paddingTop);
      const drawer = this.ring_line_holder ? this.ring_line_holder.offsetHeight : 0;
      set(clamp(Math.round((e.clientY - top - drawer) / pitch), 1, most()));      // whole rows: the pill snaps
    };
    grip.onpointerup = grip.onpointercancel = (e) => {
      if (!down) return;
      if (!down.moved && e.type === "pointerup") set(rows() === RING_ROWS ? most() : RING_ROWS);
      down = null;
      grip.classList.remove("gripping");
      try { localStorage.setItem("dial-tool-ring-rows", String(this.ring_rows_shown)); } catch (er) { /* not kept */ }
    };
    this.pinned.append(grip);
  }

  /** the selected ring's row and the drawer under it, whole in the list's view (Okay's notes, p. 2, #256: "even if
   *  only a few pixels of it show, scrolls so its whole row and drawer are in the view box"); the row wins when both
   *  can't fit. Only the list scrolls here (on a phone it has no height of its own). */
  fit_ring() {
    const ol = this.ring_list, row = this.ring_rows()[this.S.ui_ring], holder = this.ring_line_holder;
    if (!ol || !row || ol.scrollHeight <= ol.clientHeight) return;
    const top = row.offsetTop, bottom = (holder && holder.isConnected ? holder : row).offsetTop + (holder && holder.isConnected ? holder : row).offsetHeight;
    let at = ol.scrollTop;
    if (bottom > at + ol.clientHeight) at = bottom - ol.clientHeight;
    if (top < at) at = top;
    if (at !== ol.scrollTop) ol.scrollTop = at;
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

  /** a text ring's angle snaps to the positions of the other rings — the hours' markers, the minute ticks — when
   *  it comes within SNAP_DEG of one (#297; Okay: "Snap to indice is a great idea for this"). Typed or slid alike. */
  snapped_angle(a) {
    let best = null, off = SNAP_DEG;
    for (const r of this.S.rings) {
      if (r === this.ring() || !r.on || G.kind_of(r) === "band") continue;
      const angles = G.ring_angles(r);
      for (const i of G.positions_of(r)) { const d = Math.abs((((a - angles[i]) % 360) + 540) % 360 - 180); if (d < off) { off = d; best = angles[i]; } }
    }
    return best === null ? a : +(((best + 180) % 360 + 360) % 360 - 180).toFixed(6);
  }

  /** the selected ring's line (Okay's design, 13 Oct 2026; redrawn after his PSD of 18 Oct 2026, notes 2, #335 #327): a
   *  framed line in the list, right under the selected ring's row: the ring's details written out in full on two lines
   *  (grey names, dark values) in the names' room · its colour, a bare swatch · its size and its radius, two round value
   *  buttons that a click opens and a drag changes. Their numbers stand above them, in the selected row (fill_ring_list:
   *  "Numbers update above the icons, that's enough"), so they have no tag. The kind is changed from the row's kind
   *  icon, which opens the kinds (the drawer's kind square and its Change button are gone: "This 'change' is
   *  meaningless, remove it, write the details in full"). The frame has the colour of the selected ring's guide. */
  row_ring_line(wrap, out) {
    wrap.className = "ringline";
    // the kinds, opened from the selected row's kind icon (#ring-kind-square), with the note that nothing is lost by a
    // change (#253, 4.50; the note went in 4.60). The menu lies over everything, under
    // the icon (the list scrolls and would cut it): in the body, placed on opening.
    if ($("#kind-menu")) $("#kind-menu").remove();      // the last drawer's menu, left in the body
    const menu = el("div", { className: "addmenu kindmenu", id: "kind-menu", hidden: true });
    menu.setAttribute("role", "menu");
    const open = (on) => {
      const icon_at = $("#ring-kind-square");
      if (on && icon_at) { document.body.append(menu); const at = icon_at.getBoundingClientRect(); menu.style.left = `${at.left}px`; menu.style.top = `${at.bottom + 5.5}px`; }
      menu.hidden = !(on && icon_at); if (icon_at) icon_at.setAttribute("aria-expanded", String(!menu.hidden));
    };
    this.kind_open = open;
    this.kind_menu = menu;
    G.KINDS.forEach((kind, i) => {
      const b = el("button", { type: "button", id: `ring-kind-Kind-${i}`, onclick: () => { open(false); this.set_value("ring", "kind", i); } });
      b.setAttribute("role", "menuitemradio");
      b.innerHTML = PICS.kind(i, KIND_PIC);
      b.append(el("span", { textContent: kind[0].toUpperCase() + kind.slice(1) }));
      menu.append(b);
    });
    // (its note — "Settings stay with the ring. Switch back any time." — went in 4.60: Okay, "Remove the explainer from dropdown")
    menu.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); const k = $("#ring-kind-square"); if (k) k.focus(); } };
    // the details: two lines, each cut at its end when long (ring_details)
    const details = el("div", { className: "details", id: "ring-details" });
    const colour = this.colour_pill("ring-c-Colour", "");
    colour.classList.add("bare");                  // the swatch alone: no hex
    colour.dataset.tip = colour.ariaLabel = "Colour";
    colour.onclick = () => this.pop_open(this.colour_of_row({ scope: "ring", key: "c", text: "Colour" }), colour);
    const size = this.value_button("ring-size", () => size_row(this.ring()), VALUE_PICS.size, false);
    const radius = this.value_button("ring-r", () => radius_row(this.ring()), VALUE_PICS.radius, false);
    wrap.append(details, colour, size.el, radius.el);
    this.ring_line_holder = el("li", { className: "lineholder" }, wrap);      // it lives in the list (place_ring_line), not among the pane's rows
    out.el = el("span", { className: "nothing" });
    out.refresh = (R) => {
      [...menu.querySelectorAll("button")].forEach((b, i) => { b.classList.toggle("on", i === R.kind); b.setAttribute("aria-checked", String(i === R.kind)); });
      const lines = this.ring_details(R), said = JSON.stringify(lines);
      if (details.dataset.said !== said) {
        details.dataset.said = said;
        details.replaceChildren(...lines.map((line) => el("span", { className: "line" }, ...line.flatMap(([name, value], k) =>
          [...(k ? [" · "] : []), el("span", { className: "k", textContent: `${name}: ` }), value]))));
        details.title = lines.map((line) => line.map(([n, v]) => `${n}: ${v}`).join(" · ")).join("\n");
      }
      colour.show(R.c);
      size.refresh();
      radius.refresh();
    };
  }

  /** a ring written out in full for its drawer (#327; Okay's PSD, 18 Oct 2026: "Custom: LONDON, PARIS, CAIRO…" over
   *  "Positions: 24 · Nudge One Numeral: 1-…"): two lines of [name, value] pairs. The first says what it draws — a
   *  numeral ring its set and the labels it draws, a text ring its words, ticks and markers their shape and its
   *  measures, a band its width and fill. The second says where: how many positions, and what departs from a whole
   *  turn — a start, a span, a give-way, nudged numerals. The names are the panes' and rows' own words. */
  ring_details(R) {
    const kind = G.kind_of(R), len = (mm) => `${parseFloat(this.in_unit(mm, 2))}`, at = G.positions_of(R);
    const what = [], where = [["Positions", String(parseInt(R.count) || 1)]];      // the Positions pane's count (a give-way may draw fewer; it is said after)
    if (kind === "numerals") {
      const labels = G.ring_labels(R);
      what.push([G.LABEL_SETS[R.labels][0], at.map((i) => labels[i]).filter(Boolean).join(", ") || "—"]);
    } else if (kind === "text") what.push(["Text", R.custom || "—"]);
    else if (kind === "band") what.push(["Width", len(R.width)], ["Fill", `${parseFloat(R.fill)}%`]);
    else {
      const shape = G.SHAPES[R.shape];
      what.push(["Shape", shape[0].toUpperCase() + shape.slice(1)]);
      if (shape === "dot") what.push(["Diameter", len(R.w)]);
      else what.push(["Length", len(R.len)], ["Width", len(R.w)]);
    }
    if (+R.start) where.push(["Start", `${parseFloat((+R.start).toFixed(2))}°`]);
    if (+R.span !== 360) where.push(["Span", `${parseFloat((+R.span).toFixed(2))}°`]);
    if (R.skip) where.push(["Skip where", G.SKIP_FROM[R.skip]]);
    if (R.knock) where.push(["Knock out", G.KNOCK_FROM[R.knock]]);
    const nudged = Object.keys(R.nudge || {}).filter((k) => R.nudge[k] && Object.values(R.nudge[k]).some((v) => +v));
    if (G.has_text(R) && nudged.length) { const labels = G.ring_labels(R); where.push(["Nudge one numeral", nudged.map((k) => labels[+k] || +k + 1).join(", ")]); }
    return [what, where];
  }

  /** an (i): what a setting does, in a tag — under the pointer, or a moment after a tap (a finger has no hover), as
   *  the magnifier's (Okay's notes 2, #357: "Offset and skip need tooltip details"). */
  info_sign(text) {
    const b = el("button", { type: "button", className: "infosign", ariaLabel: text });
    b.dataset.tip = text;
    b.innerHTML = icon(TOOL_ICONS.info);
    b.onpointerdown = (e) => e.stopPropagation();      // inside a name that opens the controller: the (i) is its own press
    b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.tag_show(b); clearTimeout(this.info_tip); this.info_tip = setTimeout(() => this.tag_hide(), 2400); };
    return b;
  }

  /** a whole number picked from a menu (#357, Okay's drawing: "4 ⌄" opening 1, 2, 3, 4 … Custom; "Custom … line turns
   *  into" a typed field with →): the browser's own menu lies over the box, unseen, so a finger gets the system's
   *  list. Custom turns the box into a field: Enter or → takes what is typed, Escape or a press elsewhere puts the
   *  menu back. A value not in the list is put in it, so the box always says the value. The name opens the
   *  controller and drags the value (#249), as every number's name does. */
  row_num_menu(wrap, out, row) {
    const spec = { kind: "num", scope: "ring", key: row.key, text: row.text, lo: row.lo, hi: row.hi, step: 1, whole: true };
    wrap.className = "row nummenu";
    const id = `ring-${row.key}-${row.text}`;
    const label = el("label", { htmlFor: id + "-menu", textContent: row.text });
    this.name_opens(label, spec);
    if (row.tip) label.append(this.info_sign(row.tip));
    const menu = el("select", { id: id + "-menu", ariaLabel: row.text });
    const shown = el("span", { className: "v" });
    const arrow = el("span", { className: "arrow" });
    arrow.innerHTML = icon(SIGNS.down);
    const field = el("input", { type: "text", id, inputMode: "numeric", ariaLabel: row.text, hidden: true });
    const go = el("button", { type: "button", className: "go", ariaLabel: "Take it", hidden: true });
    go.innerHTML = icon(TOOL_ICONS.go);
    const box = el("span", { className: "menubox" }, shown, arrow, menu, field, go);
    const typing = (on) => {
      box.classList.toggle("typing", on);
      for (const e of [shown, arrow, menu]) e.hidden = on;
      field.hidden = go.hidden = !on;
      if (on) { field.value = String(this.ring()[row.key]); field.focus(); field.select(); }
    };
    const take = () => { const v = Math.round(parse_number(field.value, this.ring()[row.key])); typing(false); this.set_value("ring", row.key, clamp(v, row.lo, row.hi)); out.refresh(this.ring()); };
    menu.onchange = () => { if (menu.value === "custom") typing(true); else this.set_value("ring", row.key, +menu.value); };
    field.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); take(); } else if (e.key === "Escape") { e.preventDefault(); typing(false); out.refresh(this.ring()); } };
    field.onblur = (e) => { if (e.relatedTarget !== go) { typing(false); out.refresh(this.ring()); } };
    go.onmousedown = (e) => e.preventDefault();
    go.onclick = take;
    wrap.append(label, box);
    let listed = "";
    out.refresh = (R) => {
      const v = parseInt(R[row.key]) || row.lo, items = [...new Set([...row.items, v])].sort((x, y) => x - y), now = items.join();
      if (now !== listed) { listed = now; menu.replaceChildren(...items.map((n) => el("option", { value: String(n), textContent: String(n) })), el("option", { value: "custom", textContent: "Custom…" })); }
      menu.value = String(v);
      shown.textContent = String(v);
    };
  }

  // ── a value as a button ──────────────────────────────────
  //   A number as a small round drawing (Okay, 13 Oct 2026; first: a ring's radius and size). A click pops up a
  //   small square at its corner, the field ready to type in; pressing and moving the pointer changes the value
  //   without opening anything (right or up: more; Shift: ten times finer); a press outside puts the pop-up away.
  //   The value itself is read in the ring's row above, and in the tag.
  //   row() says which number row it stands for right now.

  value_button(id, row, drawing, tagged = true) {      // tagged: false for the ring drawer's two, whose numbers stand in the row above (4.55)
    const b = el("button", { type: "button", className: "valueb", id });
    b.innerHTML = `<svg viewBox="0 0 36 36" aria-hidden="true">${drawing}</svg>`;
    const T = () => this.target(row().scope);
    const refresh = () => {                        // no number in it (Okay, 13 Oct 2026): the ring's row, right above, says it; so does the tag
      const r = row(), v = T()[r.key] ?? 0, text = String(parseFloat(this.in_unit(v, decimals(r.step))));
      if (tagged) b.dataset.tip = label_of(r, T());
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
      this.guides_live(r.scope !== "nudge");
      this.set_value(r.scope, r.key, +Math.max(press.v + Math.round(d / 2) * step, r.lo).toFixed(6));       // two screen points a step
    };
    b.onpointerup = b.onpointercancel = (e) => { const was = press; press = null; b.classList.remove("dragging"); if (was && !was.moved) this.value_pop_open(b, row(), { x: e.clientX, y: e.clientY }); };
    b.onclick = (e) => { if (!e.detail && !this.value_pop) this.value_pop_open(b, row()); };      // the keyboard (Enter, Space) opens it too
    return { el: b, refresh };
  }

  /** a number's name as the way into its popup (#249, #170): a press that doesn't move opens it; a press moved
   *  sideways changes the value, two screen points a step (Shift: ten times finer), as a value button does. The name
   *  keeps its field as its label for a screen reader, but a press on it no longer goes to the field. */
  name_opens(label, row) {
    label.classList.add("popname");
    label.title = `${row.text} — press for its slider, drag sideways to change it`;
    let press = null;
    const now = () => { const T = this.target(row.scope); return T[row.key] ?? (row.or ? row.or(T) : 0); };
    label.onclick = (e) => e.preventDefault();
    label.onpointerdown = (e) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") { e.preventDefault(); press = null; return this.value_pop_open(label, row, { x: e.clientX, y: e.clientY }); }      // a finger: the controller at once, tapped or slid (22:35)
      press = { x: e.clientX, v: now(), moved: false }; label.setPointerCapture(e.pointerId);
    };
    label.onpointermove = (e) => {
      if (!press) return;
      const d = e.clientX - press.x;
      if (!press.moved && Math.abs(d) < 4) return;
      if (!press.moved) { press.moved = true; this.value_pop_close(); label.classList.add("dragging"); }
      const v = press.v + Math.round(d / 2) * row.step * (e.shiftKey ? 0.1 : 1);
      this.guides_live(row.scope !== "nudge");
      this.set_value(row.scope, row.key, row.whole ? clamp(Math.round(v), row.lo, row.hi) : +Math.max(v, row.lo).toFixed(6));
    };
    label.onpointerup = label.onpointercancel = (e) => { const was = press; press = null; label.classList.remove("dragging"); if (was && !was.moved) this.value_pop_open(label, row, { x: e.clientX, y: e.clientY }); };
  }

  /** the guides while a number is slid — the popup's slider, a name or a value button dragged — even with Guides off
   *  (Okay, 16 Oct 2026, on 4.45: "activate guides on slide. Even if off"): as they are set, until a moment after the
   *  last change (draw). A numeral being nudged hides them instead, whatever slides it (on = false; #252: "when a
   *  numeral is being nudged hide all guides"). Call before the change, which draws. */
  guides_live(on = true) {
    this.guides_at = performance.now();
    this.guides_on = on;
    clearTimeout(this.guides_timer);
    this.guides_timer = setTimeout(() => this.render(), HOLE_LIVE_MS + 50);
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
    const above = at.bottom + 7 + box.offsetHeight > innerHeight;      // no room under it (the bottom bar): over it, the arrow down
    box.classList.toggle("above", above);
    box.style.top = `${above ? at.top - 7 - box.offsetHeight : at.bottom + 7}px`;
    box.style.setProperty("--point", `${at.left + at.width / 2 - x}px`);
  }

  /** the number popup (Okay's notes, p. 5 and 18, #249, beta 4.45; R15's popup): one for every number that has one —
   *  a value button's (form C), a row's name (form A), a quiet row's (form B). The number's own row, laid out as the
   *  popup: its name, the slider (its thumb a pill, a fifth larger), the value in a pill, round − and + under it; in a
   *  2-point dark-grey frame on a ground darker than the pane's, its corners as round as its pills. Under what opened
   *  it, centred; on a phone a sheet at the bottom, over the drawer, so the dial stays in view. Being the row itself,
   *  it does all the row does (R15: typing past the slider's range widens it). Enter, Escape or a press outside closes
   *  it. (Until 4.45: the value button's tag, grown into a small square — 4.12.) */
  value_pop_open(button, row, at = null) {
    if (this.value_pop && this.value_pop.button === button) return this.value_pop_close();
    this.value_pop_close();
    for (const old of document.querySelectorAll(".numpop.fading")) old.remove();      // one on its way out: gone now
    this.tag_hide();
    const r = this.build_row({ ...row, inpop: true, side: false, block: false, tip: null });
    // the controller (Okay's second drawing, 18 Oct 2026, controller 2.svg): one dark square; at its top the value in a
    // grey pill, then the slider in a white pill, then − and + as two discs. No name: "No name necessary, preview shows
    // what's changing anyway" (the row's label stays out of sight, for the screen reader: the box is named by it).
    // (17 Oct to 4.51.1: a light head with the name over a hairline, the value riding over the knob.)
    const name = r.el.querySelector(":scope > .menulabel, :scope > label"), field = r.el.querySelector('input[type="text"]');
    if (name) name.hidden = true;
    const head = el("div", { className: "pophead" }, ...(field ? [el("div", { className: "popvalue" }, field)] : []));
    head.hidden = !field;                          // a window's places: no value, so no pill
    const box = el("div", { className: "numpop", id: "value-pop", role: "dialog", ariaLabel: row.text || "" }, head, r.el);
    document.body.append(box);
    button.setAttribute("aria-expanded", "true");
    this.value_pop = { button, box, r, row, timer: 0 };
    if (row.scope === "hand") this.hand_light(row);      // its part lit while the controller is open (#329)
    r.refresh(this.target(row.scope));
    // where it stands: the knob under the finger that opened it (at: the press's point), kept inside the window; opened
    // from the keyboard, or with no slider (a window's places), under its button, centred
    const slider = box.querySelector('input[type="range"]'), w = box.offsetWidth, h = box.offsetHeight, bb = button.getBoundingClientRect();
    let left = (at ? at.x : bb.left + bb.width / 2) - w / 2, top = bb.bottom + 7;
    if (at && slider) {
      const k = slider.getBoundingClientRect(), p = +slider.style.getPropertyValue("--p") || 0, b0 = box.getBoundingClientRect();
      const knob = [k.left + k.height / 2 + p * (k.width - k.height), k.top + k.height / 2];      // the knob's centre: its travel is the pill's width less its height
      left = b0.left + (at.x - knob[0]); top = b0.top + (at.y - knob[1]);
    }
    box.style.left = `${clamp(left, 4, innerWidth - w - 4)}px`;
    box.style.top = `${clamp(top, 4, innerHeight - h - 4)}px`;
    // after its last use it fades away: a press or a slide inside starts the clock again; a press held, or typing, holds it
    const later = () => { clearTimeout(this.value_pop?.timer); if (this.value_pop) this.value_pop.timer = setTimeout(() => this.value_pop_close(true), POP_LINGER_MS); };
    const hold = () => clearTimeout(this.value_pop?.timer);
    box.addEventListener("pointerdown", hold); box.addEventListener("pointerup", later); box.addEventListener("keydown", hold);
    box.addEventListener("input", (e) => { if (e.target.type === "range") later(); });
    box.onkeydown = (e) => {
      if (!(e.key === "Escape" || (e.key === "Enter" && e.target === field))) return;
      e.preventDefault();                          // or the same key press would go on to the button and open it again
      this.value_pop_close();                      // (what was typed is taken as the field goes)
      button.focus();
    };
    // the value ready to type over, for a mouse or the keys only: under a finger (a phone, an iPad) the keyboard comes
    // only when the value is pressed (Okay, 16 Oct 2026, 4.46.1: "Value gets selected was the wrong choice, triggers the keypad on ipad")
    if (field && document.documentElement.dataset.press !== "touch") { field.focus(); field.select(); }
  }
  /** fade: it goes in a short fade (its last use is over); otherwise at once (a press elsewhere, Escape, another opening) */
  value_pop_close(fade = false) {
    if (!this.value_pop) return;
    const { button, box, timer } = this.value_pop;
    clearTimeout(timer);
    if (this.value_pop.row?.scope === "hand" && !button.closest(".row")?.matches(":hover")) this.hand_light(null);      // its part stays lit only while its row is still pointed at
    this.value_pop = null;
    const field = box.querySelector('input[type="text"]');
    if (document.activeElement === field) field.blur();      // what was typed is taken before the field goes
    if (fade && !matchMedia("(prefers-reduced-motion: reduce)").matches) { box.classList.add("fading"); setTimeout(() => box.remove(), POP_FADE_MS); }
    else box.remove();
    button.setAttribute("aria-expanded", "false");
  }

  /** a ring's row says what the ring is, in the ring drawer's own order (Okay, 13 Oct 2026): its kind (with how many
   *  it draws) · its colour · how big one of its things is · its radius. Each of the last three stands over the
   *  drawer's button for it, so the row is the read-out and the drawer under it the controls. "How big" is what you
   *  would name first for its kind: a tick's or marker's length (a dot's Ø), a numeral's size, a band's width.
   *  Lengths in the unit box's unit, without trailing zeros. → {kind, size, r} as text */
  ring_summary(ring) {
    const kind = G.kind_of(ring), len = (mm) => String(parseFloat(this.in_unit(mm, 2))), n = G.positions_of(ring).length;
    const one = G.has_text(ring) ? ring.size : kind === "band" ? ring.width : G.SHAPES[ring.shape] === "dot" ? ring.w : ring.len;
    // the count's word: "1 marker", "60 ticks"; a band is one, more are sectors (#185: "1 markers", "12 band" until 4.47)
    const word = kind === "band" ? (n === 1 ? "band" : "sectors") : kind === "text" ? (n === 1 ? "text" : "texts") : n === 1 ? kind.slice(0, -1) : kind;
    return { kind: `${n} ${word}`, size: len(one), r: len(ring.r) };
  }

  /** the rows follow every change without the list being built again (a name may be being typed in it). */
  sync_ring_summaries() {
    if (!this.ring_list) return;
    // the selected row has the colour of the selected ring's guide on the dial (Okay, 13 Oct 2026): the same thing,
    // marked the same way in both places. No such guide (None): the light blue of before.
    const k = G.ring_guide(this.S, this.S.ui_ring);     // the selected ring's own guide colour (none, or guides for rings off: the light blue)
    const wrap = this.ring_list.closest(".pane"), guide = k !== null && (this.S.gd_rings || this.S.gd_sel) ? G.GUIDE_COLOURS[k] : null;      // on the pane: the ring's row and the ring drawer both take it
    wrap.classList.toggle("guided", Boolean(guide));
    if (guide) wrap.style.setProperty("--guide", guide); else wrap.style.removeProperty("--guide");
    this.place_ring_line();
    const R = this.ring(), says = R ? this.ring_summary(R) : null;
    for (const [id, text] of [["#ring-size-fig", says && says.size], ["#ring-r-fig", says && says.r]]) { const f = $(id); if (f && f.textContent !== text) f.textContent = text; }
    this.ring_rows().forEach((li, i) => {         // a row's kind icon follows a change of kind (#254); the selected row's size and radius (4.55) just above
      const ring = this.S.rings[i], k = li.querySelector(".kindicon");
      if (!ring || !k || k.dataset.kind === String(ring.kind)) return;
      k.dataset.kind = String(ring.kind); k.innerHTML = PICS.kind(ring.kind, KIND_PIC); k.title = G.kind_of(ring);
    });
  }

  /** one row per ring: eye (show or hide it on the dial) · grip · name, with the rename box right beside it (selected
   *  ring only, not while it is hidden, and not when the line is too full) · its kind · its colour · its size · its
   *  radius (ring_summary). A click on the selected ring's name renames it; a click anywhere else on a row selects it. */
  fill_ring_list() {
    if (!this.ring_list) return;
    this.pinned.classList.toggle("ring-scrolls", this.S.rings.length > RING_ROWS);      // more rings than the list shows: its pill (#256)
    this.ring_list.replaceChildren();
    this.S.rings.forEach((ring, i) => {
      const selected = i === this.S.ui_ring;
      const show = el("button", { type: "button", className: "eye", title: ring.on ? "Hide this ring" : "Show this ring", ariaLabel: `Show ${ring.name}`, onclick: (e) => { e.stopPropagation(); this.show_ring(i, !ring.on); } });      // the eye only shows or hides: the selection stays, so the ring line doesn't move and the next eye stays under the pointer (#183)
      show.setAttribute("aria-pressed", String(ring.on));
      show.innerHTML = eye(ring.on);
      const grip = el("span", { className: "grip", title: "Drag to change the order" });
      grip.innerHTML = icon(TOOL_ICONS.grip);
      grip.onpointerdown = (e) => this.drag_ring(e, i);
      // the kind as an icon where the drawer's square stands, then the name; no numbers in a row (#254, 4.50; Okay's
      // notes, p. 3: "no text details, only the kind icon … no adjustments, just an indicator"; the summary of 4.7–4.49.2)
      // the selected row's kind icon is a button that opens the kinds (4.55, Okay's PSD of 18 Oct: the drawer's square went)
      const kind = el(selected ? "button" : "span", { className: "kindicon", id: selected ? "ring-kind-square" : `ring-kind-row-${i}`, title: G.kind_of(ring) });
      kind.dataset.kind = String(ring.kind);
      kind.innerHTML = PICS.kind(ring.kind, KIND_PIC);
      if (selected) {
        kind.type = "button";
        kind.dataset.tip = "Kind"; kind.title = ""; kind.ariaLabel = "Kind";
        kind.setAttribute("aria-haspopup", "menu");
        kind.onclick = (e) => { e.stopPropagation(); if (this.kind_open) this.kind_open(this.kind_menu.hidden); };
        kind.onkeydown = (e) => { if (e.key === "Escape" && this.kind_menu && !this.kind_menu.hidden) { e.stopPropagation(); this.kind_open(false); } };
      }
      const name = el("span", { className: "name", textContent: ring.name || G.kind_of(ring) });
      const cell = el("span", { className: "namecell" }, name);       // the name and, right beside it, the rename box
      // the selected ring's size and radius, large, in Dial Mono, each over its button in the drawer below (4.55, Okay's
      // PSD: "Large mono numbers for size and radius, slashless 0 if possible"); sync_ring_summaries keeps them current
      const says = selected && this.ring_summary(ring);
      const figs = selected ? [el("span", { className: "fig", id: "ring-size-fig", textContent: says.size }), el("span", { className: "fig", id: "ring-r-fig", textContent: says.r })] : [];
      const item = el("li", { className: "ring" + (selected ? " on" : "") + (ring.on ? "" : " off"), tabIndex: 0 }, show, grip, kind, cell, ...figs);
      // a row is a choice in a list, reached with Tab and taken with Enter or Space (#244, 4.47.2: rows had no role and no way in from the keyboard)
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(selected));
      item.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === item) { e.preventDefault(); this.select_ring(i); } };
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
    this.steady(() => { this.fill_ring_list(); this.sync_rows(); });
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
      this.steady(() => { this.fill_ring_list(); this.sync_rows(); });
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
    this.steady(() => {
      if (refill) this.fill_ring_list();
      else { this.ring_rows().forEach((li, k) => li.classList.toggle("on", k === this.S.ui_ring)); this.place_ring_line(); }
      this.sync_rows();
    });
    this.fit_ring();                               // the row and its drawer whole in view (#256)
    if (this.anchor_rebase) this.anchor_rebase();  // …and the finger's anchor holds that place, not the old one
    this.render();
  }

  /** keep what was pressed under the finger (Okay, 15 Oct 2026, 11:13: "Selecting reordering is impossible from
   *  jumpiness"; 11:32, of the ways offered: "A and c together. Jumpiness is everywhere, not just on rings"). Safari,
   *  on the iPad, has no scroll anchoring (caniuse, Oct 2026: no stable Safari nor iOS Safari has overflow-anchor), so
   *  when rows show, hide or move above what was pressed — the ring line moving to the ring just chosen, a "more" that
   *  opens — what is under the finger moves away. Here: a press in the rows (the pinned part or the scrolling form)
   *  notes where the pressed thing stands on screen; until a moment after the finger lifts, every frame scrolls the
   *  panel's scrolling parts, innermost first, so that it stands there again — as far as they can scroll (at the very
   *  top of a list there is nothing to give). A press that moves, other than on a slider or a value button, is a
   *  scroll or a drag: it lets go. Text fields are left alone (the iPad's keyboard moves the page itself). */
  finger_anchor(panel) {
    const SLOP = 8, AFTER_MS = 500;
    let a = null;
    const scrollers = (node) => {
      const out = [];
      for (let n = node.parentElement; n && n !== document.body; n = n.parentElement) {
        const o = getComputedStyle(n).overflowY;
        if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight) out.push(n);
      }
      return out;
    };
    const frame = () => {
      if (!a) return;
      if (!a.down && performance.now() > a.until) { a = null; return; }
      const el = a.el.isConnected ? a.el : a.ring != null ? this.ring_rows()[a.ring] : null;      // a ring's row is drawn again when it is chosen: the same place in the list
      if (el) {
        let d = el.getBoundingClientRect().top - a.y;
        if (Math.abs(d) >= 1) for (const sc of scrollers(el)) {
          const before = sc.scrollTop;
          sc.scrollTop = before + d;
          d -= sc.scrollTop - before;
          if (Math.abs(d) < 1) break;
        }
      }
      requestAnimationFrame(frame);
    };
    panel.addEventListener("pointerdown", (e) => {
      const t = e.target;
      if (!(t instanceof Element) || !t.closest(".form, .pinned") || t.closest("input[type=text], input:not([type]), textarea")) { a = null; return; }
      const row = t.closest("li.ring"), el = row || t.closest("button, input, label, .valueb, [role=radio]") || t;
      const going = !!a;
      a = { el, y: el.getBoundingClientRect().top, ring: row ? this.ring_rows().indexOf(row) : null, down: true, x0: e.clientX, y0: e.clientY, until: 0, holds: !!t.closest("input[type=range], .valueb") };
      if (!going) requestAnimationFrame(frame);
    }, true);
    panel.addEventListener("pointermove", (e) => {
      if (a && a.down && !a.holds && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > SLOP) a = null;      // a scroll or a drag: not a press
    }, true);
    const up = () => { if (a) { a.down = false; a.until = performance.now() + AFTER_MS; } };
    // the list scrolled on purpose under the finger (fit_ring, #256): the anchor takes the row's new place as its own
    this.anchor_rebase = () => { if (a && a.ring != null) { const row = this.ring_rows()[a.ring]; if (row) a.y = row.getBoundingClientRect().top; } };
    panel.addEventListener("pointerup", up, true);
    panel.addEventListener("pointercancel", () => { a = null; }, true);
    panel.addEventListener("wheel", () => { a = null; }, { passive: true, capture: true });
  }

  /** keep the panel's scrolling parts where they stand while the ring list and the rows are rebuilt (Okay, 15 Oct
   *  2026, 11:13: "Menu jumps up down too much on ipad"). Rebuilding empties the list for a moment, so the form is
   *  briefly shorter and its scroll is cut back, and Chrome's scroll anchoring moves it again when the rows of
   *  another kind show: measured, 366 → 32 px on a selection. What is restored is clamped by the browser. */
  steady(fn) {
    const parts = [this.form, this.form && this.form.closest(".panel"), this.ring_list].filter(Boolean), at = parts.map((p) => p.scrollTop);
    fn();
    parts.forEach((p, k) => { if (p.scrollTop !== at[k]) p.scrollTop = at[k]; });
  }

  ring_tool(action, kind) {
    const rings = this.S.rings, i = this.S.ui_ring;
    if (action === "add") {
      rings.splice(i, 0, G.new_ring(kind, this.S, kind === "numerals" || kind === "text" ? rings.find((r) => G.kind_of(r) === "numerals") : null));      // a new ring of words takes the top numerals ring's type
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
  /** a window's width and height on one line (Okay's notes, p. 20, #265, beta 4.45.2; R15 form B): four cells — a
   *  name and its quiet number with a compact ±, twice. A press on a name or a number opens its popup, the slider
   *  there. The two are a side row's parts, each still its own row (build_row), so they do all a number does. */
  /** the Show box (#261, 4.46; Okay's notes, p. 2: "Show this window moves with the tab and says just Show: a thin box,
   *  darker than the pane's grey, grows down from the tab and holds it"; one word for windows and hands alike): the
   *  tick that shows the chosen hand or window, on top of the grey page under the tabs. */
  row_show_box(wrap, out, row) {
    // under the chosen tab alone, as wide as it, and it travels with it (4.46.2; Okay on 4.46.1: "the top tab attaches
    // traveling show ticker"; what #261 said: "grows down from the tab"): the box stands in the same columns as the
    // tabs, in the chosen one's (--tabs, --tab)
    const id = `${row.scope}-on-Show`, box = el("input", { type: "checkbox", id });
    box.onchange = () => this.set_value(row.scope, "on", box.checked);
    wrap.className = "showbox";
    wrap.append(el("label", { className: "check", htmlFor: id, title: row.scope === "hand" ? "Show this hand" : "Show this window" }, box, " Show"));
    out.refresh = (T) => {
      box.checked = Boolean(T.on);
      const tabs = [...document.querySelectorAll(row.scope === "hand" ? ".tabsbar .segs > .tab" : ".windowcards .card > .tab")];
      wrap.style.setProperty("--tabs", Math.max(tabs.length, 1));
      wrap.style.setProperty("--tab", Math.max(tabs.findIndex((t) => t.classList.contains("on")), 0) + 1);
    };
  }

  /** a window's colours on one line (#266, 4.46.1; Okay's notes, p. 19: "one line; two colours to choose"): the disc
   *  under the hole, the frame, and for an am · pm or moon window what it pictures. Each a word and its pill; the
   *  pills are the colour rows' own, so they open the colour pop-out as before. */
  row_window_colours(wrap, out) {
    wrap.className = "row colours";
    const parts = [
      col("disc_c", "Disc under it", { ...W, word: (T) => (day_look(T) > 0 ? "Day" : moon_look(T) === 1 ? "Moon" : "Disc"), or: () => [1, 1, 1, 1] }),
      col("ink", "Frame", { ...W, word: "Frame" }),
      col("text_c", "Picture", { ...W, word: (T) => (moon_look(T) === 1 ? "Sky" : day_look(T) > 0 ? "Night" : "Picture"), only: win_is("am · pm", "moon phase"), or: (T) => T.ink }),      // or: what an unset colour is
      // a picture's further colours (4.73): a moon's dark side in Phase · an am · pm Half's sun and moon · a Band's dawn and dusk
      col("c2", "Shade", { ...W, word: (T) => (moon_look(T) === 1 ? "Shade" : day_look(T) === 1 ? "Sun · moon" : "Dawn"), only: (T) => moon_look(T) === 1 || day_look(T) > 0, or: (T) => G.PICTURE_TONES[moon_look(T) === 1 ? "shade" : day_look(T) === 1 ? "light" : "dawn"] }),
      col("c3", "Dusk", { ...W, word: "Dusk", only: (T) => day_look(T) === 2, or: () => G.PICTURE_TONES.dusk }),
      col("c2", "Neighbours", { ...W, word: "Neighbours", id: "window-c2-Neighbours", only: (T) => win_is("date", "day")(T) && T.neighbours, or: () => G.PICTURE_TONES.near }),      // a date or day window's neighbours (4.74)
    ].map((row) => {
      const word = el("i", { textContent: typeof row.word === "function" ? "" : row.word });
      const built = this.build_row(row), pill = built.el.querySelector(".colour"), part = el("span", { className: "part" }, word, pill);
      return { row, built, part, word };
    });
    wrap.append(el("label", { textContent: "Colours" }), el("span", { className: "parts" }, ...parts.map((p) => p.part)));
    out.refresh = (T) => parts.forEach((p) => {
      const shown = !p.row.only || p.row.only(T); p.part.hidden = !shown;
      if (!shown) return;
      p.built.refresh(T);
      if (typeof p.row.word === "function") p.word.textContent = p.row.word(T);      // a disc's colour is the lit moon in Phase: its words say what each paints
    });
  }


  row_nudge(wrap, out) {                           // which numeral the rows under it nudge (scope "nudge", #252), and a way to undo its nudges
    wrap.className = "nudge";
    const pick = el("select", { id: "nudge-pick" });
    pick.onchange = () => { this.nudge_at = pick.value; this.sync_rows(); };
    const word = el("label", { htmlFor: "nudge-pick", textContent: "Numeral" }), reset = el("button", { type: "button", className: "btn", id: "nudge-reset", textContent: "Reset this numeral" });
    wrap.append(el("div", { className: "row pop" }, word, pick),
      el("div", { className: "row" }, el("span"), Object.assign(reset, { onclick: () => {
        const all = { ...this.ring().nudge };
        delete all[this.nudge_at];
        this.set_value("ring", "nudge", all);
      } })));
    out.refresh = (R) => {
      const text = G.has_text(R);
      word.textContent = text ? "Numeral" : "Mark"; reset.textContent = text ? "Reset this numeral" : "Reset this mark";
      // a numeral by its words; a mark by the time it stands at (1:00, 1:12 …)
      const at = (a) => { const m = Math.round((((a % 360) + 360) % 360) * 2), h = Math.floor(m / 60) % 12 || 12; return `${h}:${String(m % 60).padStart(2, "0")}`; };
      const labels = text ? G.ring_labels(R) : G.ring_angles(R).map(at);
      if (+this.nudge_at >= labels.length) this.nudge_at = "0";
      const want = labels.map((l, i) => `${i + 1} · ${l || "—"}${R.nudge[String(i)] ? "  •" : ""}`).join("|");
      if (pick.dataset.items !== want) {
        pick.replaceChildren(...labels.map((l, i) => el("option", { value: String(i), textContent: `${i + 1} · ${l || "—"}${R.nudge[String(i)] ? "  •" : ""}` })));
        pick.dataset.items = want;
      }
      pick.value = this.nudge_at;
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
    // the language stands at the right inside the preview's cell, on the cell's grey, knocking the preview out where it reaches (#273, 4.51; Okay's notes, p. 12)
    // Okay's drawing of the box (font-selector_171026, 18 Oct 2026): a grey head holding the preview on white and, under
    // it, the name — grey, bold, running to the colour — and EN at the line's right end; no Change…: the preview and the
    // name open the font sheet. (4.51: EN inside the preview's cell; Change… on the name's line until 4.53.)
    const shown_cell = el("div", { className: "currentwrap" }, current);
    const named = el("div", { className: "fontname", title: "Choose a font", onclick: (e) => { if (!e.target.closest(".colour, .langs, button")) open(); } }, name, swatch, ...(lang ? [lang.el] : []));
    const styles = el("div", { className: "styles", role: "tablist", ariaLabel: "Style" });      // tabs hanging from the name's line (#275, 4.51)
    const state = el("div", { className: "quiet note", id: pre + "font-note" });
    const back = el("button", { type: "button", className: "btn", id: "window-font-back", innerHTML: icon(SIGNS.copy) + "<span>Same font as <i>Numerals</i></span>", title: "Use the top numerals ring’s font again", hidden: true,      // "Copy style of" until 4.52.1: it never copied, it gives the window the ring's font again (Okay, 18 Oct 2026: "Same font as hours, yes")
      onclick: () => { const w = this.window(); w.family = ""; w.ps = ""; w.axes = {}; w.features = null; w.tracking = null; w.lang = null; this.changed(true); } });
    // every font box has all of it (Okay, 13 Oct 2026): numerals and letters · name, colour · styles, language · size ·
    // tracking · the variable axes · the OpenType features. The last can be put away.
    // size · tracking · the variable axes, one under the other without a heading (Okay's drawing, 13 Oct 2026)
    const size = this.build_row(own ? { ...num("size", "Size %", 20, 100, 1), scope: "window" } : { ...num("size", "Size", 0.3, 8, 0.05), scope: "ring" });      // a window's text is sized in % of its height
    const axes = this.axes_part(pre, own);
    const features = this.box_part("font/features", "OpenType features", this.features_part(pre, own), true);
    wrap.append(el("div", { className: "fontbox" }, shown_cell, named, styles, size.el, tracking.el, axes.el, features.el), ...(own ? [back] : []), state);
    let shown = null;
    out.refresh = (T) => {
      const R = own ? G.window_type(this.S, T) : T;
      back.hidden = !(own && (T.ps || T.tracking != null || T.lang != null || T.features != null || Object.keys(T.axes || {}).length));
      if (own) back.querySelector("i").textContent = numerals().name || "Numerals";      // the top numerals ring, by its name as it is written (Okay, 14 Oct 2026; "Same font as" since 4.52.2)
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
      // the family's styles as tabs of the name's box, hanging from its line (#275, 4.51; Okay, 16 Oct 2026: "it is a part of
      // the font so it needs to look like tabs of the upper box which is the font name"). A variable font with a weight
      // axis and no named styles gets Regular and Bold here, which set the axis (what a font may offer here is limited
      // to bold and italic; its other axes stay down with the sliders)
      const tab = (text, on, act, id) => { const b = el("button", { type: "button", className: "tab hang", textContent: text, role: "tab", id, onclick: act }); b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); return b; };
      let tabs = mine.length > 1 ? mine.map((x, i) => tab(x.style || x.ps, x.ps === R.ps, () => choose(() => this.use_font(x)), `${pre}font-style-${i}`)) : [];
      if (!tabs.length && G.has_font(R.ps)) {
        const a = G.font_axes(G.font_of(R)).wght;
        if (a && a.max >= 600) {
          const side = this.font_side(own), H = this.target(side.scope), now = (H.axes || {}).wght ?? side.base_axis(H, "wght", a), bold = Math.min(700, a.max);
          const put = (v) => { const all = { ...(this.target(side.scope).axes || {}) }; if (Math.abs(v - side.base_axis(this.target(side.scope), "wght", a)) < 1e-6) delete all.wght; else all.wght = v; this.set_value(side.scope, "axes", all); };
          tabs = [tab("Regular", now < 600, () => put(a.default), `${pre}font-style-0`), tab("Bold", now >= 600, () => put(bold), `${pre}font-style-1`)];
        }
      }
      styles.hidden = tabs.length < 2;
      styles.replaceChildren(...tabs);
      const missing = G.has_font(R.ps) ? "" : this.catalog.has(R.ps) ? "Loading… "
        : `${R.family} isn’t loaded yet, so ${G.font_list()[0].family} stands in. Press its name to choose another or to add it. `;
      state.textContent = missing + (this.font_note || "");
      if (this.picker && this.picker.open) this.fill_picker();
    };
  }

  /** the chosen hand in detail: a box of its own, at the left of the hand's rows (on a phone: over them, the hand lying). */
  /** the ring's positions, drawn (Okay's notes, p. 5, #251, 4.50.1: "a ring-specific preview at the left, like the
   *  hands' detail box: round, not in a square box, with even padding"): a faint circle; a mark at every position, the
   *  used ones in ink, the ones skipped (Every, Offset, Skip those) faint; the first position marked with a dot, so
   *  Start is seen. Since 4.56 (notes 2, #357: "start point" · "Span ruler: make it dotted instead of ruler" · "these
   *  are controls, click/tap dragable") also the span, a dotted arc inside, from the start round to its end, which a
   *  small ring marks. A press in the outer band (the marks and the dot) drags the start round the dial; a press
   *  inside it drags the span's end. Whole degrees; the rows beside it say the numbers. */
  row_ring_positions(wrap, out) {
    wrap.className = "detail round";
    wrap.id = "ring-positions";
    wrap.setAttribute("role", "img");
    const DOT = 0.68, ARC = 0.52;                 // the start's dot and the span's arc, as parts of the radius
    let drawn = "";
    out.refresh = (R) => {
      const angles = G.ring_angles(R), used = new Set(G.positions_of(R)), f = (v) => v.toFixed(4);
      const at = (a, r) => [f(r * Math.sin(a * Math.PI / 180)), f(-r * Math.cos(a * Math.PI / 180))];
      const marks = angles.map((a, i) => { const [x0, y0] = at(a, 0.84), [x1, y1] = at(a, 1); return `<path class="${used.has(i) ? "used" : "skipped"}" d="M${x0} ${y0}L${x1} ${y1}"/>`; }).join("");
      const a0 = +R.start || 0, span = Math.min(Math.max(+R.span || 360, 1), 360), [fx, fy] = at(angles[0] ?? a0, DOT);
      const [sx, sy] = at(a0, ARC), [ex, ey] = at(a0 + span, ARC);
      const arc = span >= 360 ? `<circle class="span" r="${ARC}"/>` : `<path class="span" d="M${sx} ${sy}A${ARC} ${ARC} 0 ${span > 180 ? 1 : 0} 1 ${ex} ${ey}"/>`;
      const now = `<svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"><circle class="axis" r="1"/>${marks}${arc}<circle class="spanend" cx="${ex}" cy="${ey}" r="0.06"/><circle class="first" cx="${fx}" cy="${fy}" r="0.07"/></svg>`;
      if (now !== drawn) { drawn = now; wrap.innerHTML = now; }
      wrap.ariaLabel = `${used.size} of ${angles.length} positions used, the first at ${(angles[0] || 0).toFixed(1)}°`;
    };
    // the drag: the pointer's place as a clock angle and a part of the radius
    const polar = (e) => { const b = wrap.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * 2.2 - 1.1, y = (e.clientY - b.top) / b.height * 2.2 - 1.1; return [Math.atan2(x, -y) * 180 / Math.PI, Math.hypot(x, y)]; };
    let grab = null;
    wrap.onpointerdown = (e) => {
      const [, rho] = polar(e);
      grab = { what: rho > (DOT + ARC) / 2 ? "start" : "span", span: null };      // span: where the drag has it (null: the press itself, taken as it is)
      wrap.setPointerCapture(e.pointerId);
      wrap.classList.add("dragging");
      wrap.onpointermove(e);
    };
    wrap.onpointermove = (e) => {
      if (!grab) return;
      const [a] = polar(e), R = this.ring();
      this.guides_live();
      if (grab.what === "start") { this.set_value("ring", "start", Math.round(((a + 540) % 360) - 180)); return; }
      let d = (((a - (+R.start || 0)) % 360) + 360) % 360;
      if (grab.span === null) { /* the press: where it is */ } else if (grab.span - d > 180) d = 360;           // past the start going on: it stays whole
      else if (d - grab.span > 180) d = 1;        // back past the start: the least there is
      grab.span = Math.min(Math.max(Math.round(d), 1), 360);
      this.set_value("ring", "span", grab.span);
    };
    wrap.onpointerup = wrap.onpointercancel = () => { grab = null; wrap.classList.remove("dragging"); };
  }

  row_hand_detail(wrap, out) {
    wrap.className = "detail";
    wrap.id = "hand-detail";
    let drawn = "";
    // its handles (#345): an overlay of its own, kept when the drawing under it is replaced
    const grips = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    grips.setAttribute("class", "grips");
    this.hand_grips = grips;
    this.hand_grip_events(wrap, grips);
    out.refresh = (T) => {
      const now = hand_detail(T);
      if (now !== drawn) {
        drawn = now;
        // the drawings under the handles replaced, the handles' own layer kept in place (moving it would drop a drag's hold on the pointer)
        for (const old of [...wrap.children]) if (old !== grips) old.remove();
        if (!grips.parentElement) wrap.append(grips);
        grips.insertAdjacentHTML("beforebegin", now);
      }
      this.hand_lit_draw();
      grips_soon();
    };
    // drawn once the panel has settled — the rows round the box show or hide after it, and its size follows them
    let soon = 0;
    const grips_soon = () => { if (!soon) soon = requestAnimationFrame(() => { soon = 0; this.hand_grips_draw(); }); };
    new ResizeObserver(grips_soon).observe(wrap);
  }

  /** the hand's handles on its picture (#345; Okay's notes 2: "draggable dots at the extremes of what can be edited, a
   *  dotted bounding box like Photoshop's transform; one side's width drag edits the other symmetrically"): a dotted
   *  box round the hand and a square at the middle of each of its sides — at the tip the length, at the other end the
   *  tail, at the two edges the width (a disc hand's: its Ø), both edges moving together. In the selected guide's
   *  colour, as the ring handles (4.65). Dragged, a handle sets its number as the row does (set_value), its part lit. */
  hand_grips_draw() {
    const g = this.hand_grips, box = g?.parentElement, h = this.hand();
    if (!box || !h) return;
    const pic = [...box.querySelectorAll("svg:not(.grips)")].find((v) => v.getBoundingClientRect().width > 0), hand = pic?.querySelector("path");
    if (!hand) return g.replaceChildren();
    const B = box.getBoundingClientRect(), r = hand.getBoundingClientRect(), lying = pic.classList.contains("lying");
    const x0 = r.left - B.left, y0 = r.top - B.top, x1 = r.right - B.left, y1 = r.bottom - B.top, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const disc = G.HAND_SHAPES[h.shape] === "disc";
    // where each stands: upright the tip is up; lying (a wide box) the tip is to the right
    const at = lying ? { len: [x1, my], tail: [x0, my], w1: [mx, y0], w2: [mx, y1] } : { len: [mx, y0], tail: [mx, y1], w1: [x0, my], w2: [x1, my] };
    const tips = { len: "Length: drag", tail: "Tail: drag", w: disc ? "Disc Ø: drag, both sides together" : "Width: drag, both sides together" };
    const sq = (name, [x, y], key) => `<g class="handle" data-grip="${name}" data-tip="${tips[key]}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><circle class="reach" r="${HANDLE_REACH}"/><rect x="${-HANDLE_R}" y="${-HANDLE_R}" width="${2 * HANDLE_R}" height="${2 * HANDLE_R}"/></g>`;
    g.style.setProperty("--handle", G.GUIDE_COLOURS[this.S.gd_k_sel] || G.GUIDE_COLOURS[0]);
    g.innerHTML = `<rect class="frame" x="${x0.toFixed(2)}" y="${y0.toFixed(2)}" width="${(x1 - x0).toFixed(2)}" height="${(y1 - y0).toFixed(2)}"/>`
      + sq("len", at.len, "len") + (disc ? "" : sq("tail", at.tail, "tail")) + sq("w1", at.w1, "w") + sq("w2", at.w2, "w");
  }

  /** a handle on the hand's picture dragged: the pointer's travel, in mm at the picture's scale when the drag began,
   *  added to the number it had (so it works the same for every shape, whatever its outline does at that edge). The
   *  picture keeps fitting the hand as it changes, so a handle drifts from the pointer as the hand grows a lot; kept so
   *  the whole hand stays in its box (a picture held at its scale let the tip leave the box after a millimetre). */
  hand_grip_events(box, g) {
    const ROW = (key) => ROWS.Hands.find((r) => r.key === key && r.kind === "num");
    g.addEventListener("pointerdown", (e) => {
      const grip = e.target.closest("[data-grip]");
      if (!grip) return;
      e.preventDefault(); e.stopPropagation();
      const h = this.hand(), disc = G.HAND_SHAPES[h.shape] === "disc", name = grip.dataset.grip;
      const key = name === "len" ? "len" : name === "tail" ? "tail" : disc ? "disc_d" : "w";
      const pic = [...box.querySelectorAll("svg:not(.grips)")];
      const shown = pic.find((v) => v.getBoundingClientRect().width > 0), scale = shown.getScreenCTM().a;      // screen points per mm
      this.hand_drag = { key, name, row: ROW(key), v0: +h[key], x: e.clientX, y: e.clientY, scale, lying: shown.classList.contains("lying") };
      g.setPointerCapture(e.pointerId);
      box.classList.add("dragging");
      this.hand_light(this.hand_drag.row);
      this.tag_hide();
    });
    g.addEventListener("pointermove", (e) => {
      const d = this.hand_drag;
      if (!d) return;
      const dx = (e.clientX - d.x) / d.scale, dy = (e.clientY - d.y) / d.scale;
      // how far the handle's own side moved outwards: the tip away from the centre, the tail the other way, an edge out
      const out = { len: d.lying ? dx : -dy, tail: d.lying ? -dx : dy, w1: d.lying ? -dy : -dx, w2: d.lying ? dy : dx }[d.name];
      const v = d.v0 + (d.key === "w" || d.key === "disc_d" ? 2 * out : out);      // both edges move: the width grows twice the travel
      const R = d.row, step = R.step;
      this.set_value("hand", d.key, +clamp(Math.round(v / step) * step, R.lo, R.hi).toFixed(4));
    });
    const end = () => {
      if (!this.hand_drag) return;
      this.hand_drag = null; box.classList.remove("dragging");
      if (!box.matches(":hover")) this.hand_light(null);
    };
    g.addEventListener("pointerup", end);
    g.addEventListener("pointercancel", end);
  }

  /** light a hand number's part on the hand's picture, or none (#329): while its row is pointed at, holds the focus,
   *  or has its controller open. In the selected guide's colour, as the ring handles are (4.65). */
  hand_light(row) {
    if (row === this.lit_row) return;
    this.lit_row = row;
    this.hand_lit_draw();
  }
  hand_lit_draw() {
    const box = document.querySelector("#hand-detail");
    if (!box) return;
    const row = this.lit_row, h = this.hand(), key = row && h ? `${row.key}/${JSON.stringify(h)}` : "";
    if (key !== this.lit_key) {      // worked out again only when the number or the hand changed
      const part = key ? hand_part(h, row) : null;
      this.lit_key = key; this.lit_d = part ? part.svg(3, true) : "";
    }
    const d = this.lit_d;
    box.style.setProperty("--lit", G.GUIDE_COLOURS[this.S.gd_k_sel] || G.GUIDE_COLOURS[0]);
    for (const p of box.querySelectorAll(".lit")) { if (d) p.setAttribute("d", d); else p.removeAttribute("d"); }
  }

  /** a window's place (Okay, 13 Oct 2026): every named place is a button, so the others are seen and pressed — first
   *  the four quarters, a square of 3 · 6 · 9 · 12; a white bar; then the places between; and a last box, three dots,
   *  that opens the tag with a field for any time ("2:15"). The window keeps the place in the list (at, R9), or the
   *  time's angle (at_deg) when it has one of its own. */
  row_window_at(wrap, out) {
    // Position (#264, 4.46.1; Okay's notes, p. 19–20: "five square buttons, 3 · 6 · 9 · 12 and one with three dots";
    // on the mock-ups, 16 Oct 2026: on the heading's line, "Position should not be small", "3 6 9 12 are circular
    // buttons now"). The dots open the popup with every place as a button and a field for any time; when the window
    // stands elsewhere they say where, and grow into a pill to hold it. The row goes on the heading line (head).
    wrap.className = "row windowat";
    const at = (name) => G.DATE_AT.findIndex((d) => d[0] === name);
    const press = (i) => { const w = this.window(); w.at = i; w.at_deg = null; this.changed(true); };
    const quarters = ["3", "6", "9", "12", "4"].map((name) => el("button", { type: "button", id: "window-at-Position-" + at(name), textContent: name, onclick: () => press(at(name)) }));      // and 4 (Okay, on 4.46.1: "Add 4 to the circles before …")
    const more = el("button", { type: "button", className: "atmore", id: "window-at-more", textContent: "···", title: "Every place, or any time: 2:15, 7:40…" });
    more.setAttribute("aria-expanded", "false");
    more.onclick = () => this.value_pop_open(more, { kind: "custom", name: "at_time", scope: "window", key: "at_deg", text: "Position" });
    wrap.append(el("label", { textContent: "Position" }), el("span", { className: "circles" }, ...quarters, more));
    out.refresh = (T) => {
      for (const b of quarters) b.classList.toggle("on", T.at_deg == null && b.id === "window-at-Position-" + T.at);
      const elsewhere = T.at_deg != null || !["3", "6", "9", "12", "4"].includes(G.DATE_AT[T.at]?.[0]);
      more.classList.toggle("on", elsewhere);
      more.textContent = elsewhere ? G.window_place(T) : "···";
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
    // every named place, in the clock's order, as a button (#264: "the dots open a popup with all the places pre-buttoned")
    const order = ["12", "1:30", "3", "4", "4:30", "6", "7:30", "9", "10:30"], idx = (name) => G.DATE_AT.findIndex((d) => d[0] === name);
    const places = order.map((name) => el("button", { type: "button", id: "window-at-place-" + idx(name), textContent: name, onclick: () => { const w = this.window(); w.at = idx(name); w.at_deg = null; this.changed(true); this.value_pop_close(); } }));
    wrap.append(el("label", { htmlFor: "window-at-time", textContent: "Time" }), el("span", { className: "places" }, ...places), field);
    out.refresh = (T) => {
      if (document.activeElement !== field) field.value = G.window_place(T);
      for (const b of places) b.classList.toggle("on", T.at_deg == null && b.id === "window-at-place-" + T.at);
    };
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

  /** the font sheet: every font with its numerals — the tool’s own twenty-one, then yours, then (Chrome, Edge)
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
    // light or dark (#276, 4.51; Okay's notes, p. 13): a pill at the top middle shows the previews on white or on a dark
    // ground, kept for this session; the font boxes follow it, in the inverse of their present ground, never pitch black
    // (Okay, 16 Oct 2026: "inverse of existing block can't be black")
    const ground = el("div", { className: "pillswitch", role: "radiogroup", ariaLabel: "The previews' ground" });
    const grounds = ["Light", "Dark"].map((w, i) => { const b = el("button", { type: "button", id: "font-ground-" + w.toLowerCase(), textContent: w, role: "radio", onclick: () => this.font_ground(i === 1) }); ground.append(b); return b; });
    this.font_ground = (dark) => {
      this.font_dark = dark;
      try { sessionStorage.setItem(FONT_DARK_KEY, dark ? "1" : ""); } catch (e) { /* not kept */ }
      $("#app").classList.toggle("font-dark", dark);
      grounds.forEach((b, i) => { b.classList.toggle("on", (i === 1) === dark); b.setAttribute("aria-checked", String((i === 1) === dark)); });
    };
    this.picker = el("dialog", { className: "picker", id: "font-picker" },
      el("header", {}, el("h2", { textContent: "Fonts" }), ground, finder),      // the search stands at the sheet's top right
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
    let dark = false;
    try { dark = sessionStorage.getItem(FONT_DARK_KEY) === "1"; } catch (e) { /* not kept */ }
    this.font_ground(dark);
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
        const row = el("button", { type: "button", className: "fontrow", title: f.what ? `${family} · ${f.what}` : family, onclick: () => { this.font_note = ""; this.use_font(f); this.picker.close(); } },      // choosing a font closes the sheet (Okay, 18 Oct 2026, 22:35)
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
          wrap.append(el("div", { className: "row num" }, el("span", { className: "stickerlabel" }, back), slider, el("span", { className: "numbox alone" }, field)));      // the number box without − + (4.64): an axis is swept or typed
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
  /** a way to the Gallery from the panel's top line: a pill dressed as the unit box, centred in the room between the
   *  version and the unit box (Okay, 15 Oct 2026, 07:45: "a shortcut to the gallery centered between beta blabla and mm.
   *  A pill of mm complexion"). Pressed: the Export tab, the Gallery pane open and brought into view */
  gallery_way() {
    const go = el("button", { type: "button", className: "gallerypill", id: "to-gallery", textContent: "Gallery", title: "Dials to open and take apart" });
    go.onclick = () => {
      const i = SECTIONS.indexOf("Export");
      if (this.S.ui_section !== i) { this.S.ui_section = i; this.show_section(); this.render(); }
      const pane = this.rows.find((r) => r.fold === "Export/Gallery");
      if (pane && this.is_folded(pane)) this.fold(pane, false);
      const files = this.rows.find((r) => r.fold === "Export/Export a file");      // the pinned pane shuts its eye, so the Gallery has the room (Okay, 15 Oct 2026, 10:47: "When gallery clicked, can you shuteye the export persistent?")
      if (files && !this.is_folded(files)) this.fold(files, true);
      const tabs = $(".panel .tabs"), held = getComputedStyle(tabs).position === "sticky";      // a phone: the tabs stay on top, so the pane stops under them
      const target = $(".gallery").closest(".pane");
      target.style.scrollMarginTop = held ? tabs.offsetHeight + "px" : "";
      requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    };
    return el("div", { className: "galleryway" }, go);
  }

  /** the gallery: dials drawn after documents (web/gallery.mjs), then the five first examples (web/examples.mjs), three to
   *  a line, each with a line saying what it is. */
  row_gallery(wrap) {
    wrap.className = "examples gallery";
    const grid = el("div", { className: "cards" });
    const cards = this.gallery_order([...GALLERY, ...EXAMPLES.map((x) => ({ ...x, note: `${x.name}: one of the guidebook's classic dials` }))]);
    // a card walks into focus (#289, 4.49; Okay's notes, p. 18: "choosing a dial no longer takes it over; it comes forward
    // with two choices, take over editing or open in a new window"): a press lifts the card and shows the two; Escape or
    // a press elsewhere puts it back. The card is still a link, so a middle click or the keyboard's menu opens it as before.
    const unfocus = () => { for (const c of grid.querySelectorAll("a.focus")) c.classList.remove("focus"); };
    for (const e of cards) {
      const card = el("a", { href: e.link, title: e.note });
      card.dataset.light = String(Boolean(e.light));
      card.innerHTML = e.picture;
      const go = (blank) => { if (blank) window.open(e.link, "_blank"); else location.hash = e.link.replace(/^#/, ""); };
      card.append(el("span", { textContent: e.name }), el("span", { className: "choices" },
        el("button", { type: "button", className: "btn main", textContent: "Edit this dial", title: "Open it here, in place of the dial you have", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); go(false); } }),
        el("button", { type: "button", className: "btn", textContent: "In a new tab", title: "Keep the dial you have; this one opens in a new tab beside it", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); go(true); } })));
      card.onclick = (ev) => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); const was = card.classList.contains("focus"); unfocus(); if (!was) card.classList.add("focus"); };
      card.onkeydown = (ev) => { if (ev.key === "Escape") { unfocus(); card.blur(); } };
      grid.append(card);
    }
    wrap.append(grid);
    document.addEventListener("pointerdown", (ev) => { if (!grid.contains(ev.target)) unfocus(); }, true);
  }

  /** your own dials, over the Gallery (4.76, #347): Save this dial, then a card for each saved one — its picture, its
   *  size and when; pressed, it comes forward as a Gallery card does, with Edit this dial · In a new tab · Remove. */
  row_instances(wrap) {
    wrap.className = "examples gallery instances";
    const save = el("button", { type: "button", className: "btn main", id: "instance-save", textContent: "Save this dial", title: "Keep this dial here, in this browser, as it is now" });
    const note = el("p", { className: "quiet", id: "instance-note" });
    const grid = el("div", { className: "cards", id: "instance-cards" });
    const when = (at) => new Date(at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const unfocus = () => { for (const c of grid.querySelectorAll("a.focus")) c.classList.remove("focus"); };
    const draw = () => {
      const list = instances_read();
      note.textContent = list.length ? `${list.length} saved in this browser.` : "Dials you save stay in this browser; a link or a settings file takes one elsewhere.";
      grid.replaceChildren(...list.map((e) => {
        const card = el("a", { href: e.link, title: e.name });
        card.dataset.light = String(Boolean(e.light));
        card.innerHTML = e.picture;
        // opened here straight from its link, not by changing the address: the address may already hold this very link
        // (it follows the dial a moment late), and then no change is seen
        const go = async (blank) => {
          unfocus();
          if (blank) return window.open(e.link, "_blank");
          const next = await unpack(e.link);
          if (next && next.settings) { this.reopen({ ...next.settings, ui_section: this.S.ui_section }); this.log(`opened ${e.name}`); }
        };
        const remove = () => { instances_write(instances_read().filter((x) => x.id !== e.id)); draw(); this.log(`removed ${e.name}`); };
        card.append(el("span", { textContent: e.name }), el("span", { className: "choices" },
          el("button", { type: "button", className: "btn main", textContent: "Edit this dial", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); go(false); } }),
          el("button", { type: "button", className: "btn", textContent: "In a new tab", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); go(true); } }),
          el("button", { type: "button", className: "btn", textContent: "Remove", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); remove(); } })));
        card.onclick = (ev) => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); const was = card.classList.contains("focus"); unfocus(); if (!was) card.classList.add("focus"); };
        card.onkeydown = (ev) => { if (ev.key === "Escape") { unfocus(); card.blur(); } };
        return card;
      }));
    };
    save.onclick = async () => {
      const S = this.S, statik = G.build_static(S), plate = S.c_plate;
      const e = { id: Date.now().toString(36), at: Date.now(), link: "#" + await pack(S), picture: dial_picture(S, statik), light: 0.2126 * plate[0] + 0.7152 * plate[1] + 0.0722 * plate[2] > 0.5 };
      e.name = `${+S.dial_d.toFixed(2)} mm · ${when(e.at)}`;
      const list = [e, ...instances_read()].slice(0, INSTANCES_MOST);
      if (!instances_write(list)) return this.log("not saved: this browser's storage is full or closed (a private window?) — Copy link keeps it instead");
      draw();
      this.log(`saved ${e.name} — under Gallery, in this browser`);
    };
    wrap.append(el("div", { className: "row" }, el("label", { textContent: "Yours" }), save), note, grid);
    document.addEventListener("pointerdown", (ev) => { if (!grid.contains(ev.target)) unfocus(); }, true);
    draw();
  }

  /** the Gallery's order (#286, 4.49; Okay's notes, p. 17–18): the First dial first, Okay's watch last, and the white
   *  dials on the diagonals of the three-column grid — "just whites zigzag diagonally": the third slot, then the middle
   *  of the next line, then the first of the line after, and back. The rest keep their order in the slots between.
   *  (Until 4.49: Okay's watch first, Bauhaus third — 15 Oct 2026, 10:47; his notes reversed it.) */
  gallery_order(cards) {
    const first = cards.find((c) => c.name === "First dial") || cards[0], last = cards.find((c) => c.name === "Okay's watch");
    const rest = cards.filter((c) => c !== first && c !== last), whites = rest.filter((c) => c.light), others = rest.filter((c) => !c.light);
    const n = cards.length, out = new Array(n).fill(null);
    out[0] = first;
    if (last) out[n - 1] = last;
    for (let r = 0, k = 0; r * 3 < n && whites.length; r++) {      // the zigzag: column 2 · 1 · 0 · 1 · 2 …
      const col = [2, 1, 0, 1][r % 4], at = r * 3 + col;
      if (at < n && !out[at]) out[at] = whites.shift();
    }
    const left = [...others, ...whites];           // a white dial with no slot left on the diagonal comes after the rest
    for (let i = 0; i < n; i++) if (!out[i]) out[i] = left.shift();
    return out.filter(Boolean);
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

  /** a print sheet (4.75, #348): its button, and the page drawn small beside it — the paper, every copy where it will stand. */
  row_print_sheet(wrap, out) {
    wrap.className = "row sheetrow";
    const btn = el("button", { type: "button", className: "btn main", id: "export-sheet", textContent: "Sheet PDF", title: "A page of copies, at true size, to print", onclick: () => this.export("sheet") });
    const page = el("span", { className: "sheetpage", id: "sheet-page" });
    wrap.append(el("label", { textContent: "Sheet" }), btn, page);
    out.refresh = (S) => {
      const L = sheet_layout(S), [, W, H] = L.paper, r = S.dial_d / 2;
      page.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect class="paper" width="${W}" height="${H}"/>${L.places.map(([x, y]) => `<circle class="copy" cx="${x.toFixed(2)}" cy="${(H - y).toFixed(2)}" r="${r}"/>`).join("")}</svg>`;
    };
  }

  /** under the PNG row: what that dpi comes to. */
  /** the Wear OS export (4.67, farukahmet's PR #1): a watch face (Watch Face Format) as an APK to sideload — over adb, or
   *  a sideloading app. Signed with a shared debug key: right for one's own watch, never for the Play Store. */
  row_export_wearos(wrap) {
    wrap.className = "row";
    const btn = el("button", { type: "button", className: "btn main", id: "export-wearos", textContent: "APK", title: "A Wear OS watch face (.apk) to sideload onto your watch", onclick: () => this.export("wearos") });
    wrap.append(el("label", { textContent: "Wear OS" }), btn);
  }

  /** the watch face's name on the watch; it makes the package's name too, so several dials can live on one watch. */
  row_wearos_name(wrap, out) {
    wrap.className = "row txt tied";
    const field = el("input", { type: "text", id: "wearos-name", placeholder: "Its name on the watch: Dial Tool", ariaLabel: "Watch face name" });
    field.onchange = () => this.set_value("global", "wearos_name", field.value.trim());
    wrap.append(el("span"), field);
    out.refresh = (T) => { if (document.activeElement !== field) field.value = T.wearos_name || ""; };
  }

  row_wearos_pkg(wrap, out) {
    wrap.className = "row note under";
    const text = el("span", { className: "quiet", id: "wearos-pkg" });
    wrap.append(el("span"), text);
    out.refresh = (T) => { const label = (T.wearos_name || "").trim() || "Dial Tool"; text.textContent = `${label} · ${format_package_name("", label)} · signed for sideloading, not for the Play Store`; };
  }

  row_png_size(wrap, out) {
    wrap.className = "row note under";                // under: it starts on the buttons' column, not at the left (Okay, 13 Oct 2026)
    const text = el("span", { className: "quiet", id: "png-size" });
    wrap.append(el("span"), text);
    out.refresh = () => { const mm = G.page_mm(this.S), px = Math.round(mm / 25.4 * this.S.out_dpi); text.textContent = `${this.in_unit(mm, 1)} ${this.unit()[0]} at ${Math.round(this.S.out_dpi)} dpi = ${px} × ${px} px`; };
  }

  /** a settings file: the whole dial, every value, kept to open again (R31: a link is for sharing, a file for keeping).
   *  A sentence says so; after Load the pane's heading names the file, and Save… offers that name again (a browser can't
   *  write over it). Defaults is the guide's First dial ("Guide default wins"); Plain dial the tool's plain starting
   *  values, where the guide's First dial begins (Okay's notes, 16 Oct 2026, #279). */
  row_settings(wrap) {
    wrap.className = "row";
    const file = el("input", { type: "file", accept: ".json,application/json", hidden: true, id: "load-file" });
    file.onchange = async () => { if (file.files[0]) this.load_text(await file.files[0].text(), file.files[0].name); file.value = ""; };
    wrap.append(el("p", { className: "quiet setnote", id: "settings-note", textContent: "A settings file keeps this dial with every value, to open again here or on another computer." }), el("span", { className: "tools wide" },
      el("button", { type: "button", className: "btn", id: "save", textContent: "Save…", onclick: () => { const name = this.loaded_name || file_name(this.S, "json"); save_file(name, JSON.stringify({ ...this.S, ui_section: Math.min(this.S.ui_section, 4) }, null, 1), "application/json"); this.log(`saved ${name} to your downloads`); } }),   // dial.py knows sections 0–4
      el("button", { type: "button", className: "btn", textContent: "Load…", onclick: () => file.click() }),
      el("button", { type: "button", className: "btn", id: "defaults", textContent: "Defaults", title: "The guide’s First dial, as the tool opens with", onclick: () => { this.reopen({ ...structuredClone(OPENER), ui_section: this.S.ui_section }); tool.log("defaults: the guide’s First dial"); } }),
      el("button", { type: "button", className: "btn", id: "plain", textContent: "Plain dial", title: "The tool’s plain starting dial, where the guide’s First dial begins", onclick: () => this.reopen({ ui_section: this.S.ui_section }) }), file));
  }

  /** the dial's link, spelled out on one line (cut at the box's edge: Copy link copies it whole), and how long it is.
   *  Its Copy button stands on the pane's heading line (Okay, 16 Oct 2026, #277: "copy link moves to top line flush
   *  right, gets a link icon"; under the link, beside its length, until then). */
  row_link(wrap, out) {
    wrap.className = "linkrow";
    this.link_box = el("input", { type: "text", id: "link", className: "link", readOnly: true, spellcheck: false, ariaLabel: "Link to this dial" });
    this.link_box.onfocus = () => this.link_box.select();
    wrap.append(this.link_box, el("p", { className: "quiet linknote", id: "link-size" }));
    out.refresh = () => this.show_link();
  }
  row_link_copy(wrap) {                            // on the heading line (head)
    const copy = el("button", { type: "button", className: "btn copylink", id: "copy-link", title: "Copy the link to this dial", onclick: (e) => this.copy_link(e.currentTarget) }, el("span", { textContent: "Copy link" }));
    copy.insertAdjacentHTML("afterbegin", icon(TOOL_ICONS.link));
    wrap.append(copy);
  }

  async show_link() {
    const link = location.href.split("#")[0] + "#" + await pack(this.S);
    if (this.link_box && this.link_box.isConnected) {
      this.link_box.value = link;
      $("#link-size").textContent = `${link.length} characters. Fonts travel by name: whoever opens it needs the same fonts.`;      // Okay, 16 Oct 2026: "Explain fonts travel by name"
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
    // Inter, inside the page, and any font already loaded (a dial opened before this one used it) — a font of the tool's
    // list keeps the list's family and style: its file may call itself otherwise ("Routed Gothic Wide" is the list's
    // Routed Gothic, Wide), and the sheet would show it as a family of its own (found 15 Oct 2026, with the opener)
    for (const f of G.font_list()) { const listed = FONT_LIST.find((x) => x.ps === f.ps); this.catalog.set(f.ps, { family: listed ? listed.family : f.family, style: listed ? listed.style : f.style, ps: f.ps, group: "list" }); }
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
        if (!this.catalog.has(got.ps) || this.catalog.get(got.ps).group !== "list") {       // the tool’s own twenty-one keep their entry
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
    if (G.has_text(R) && !added.some((f) => f.ps === R.ps)) {       // not the ring's own font: switch to the new one
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
        this.pulse(this.S.t, performance.now() / 1000);
        this.render();
      }
      if (this.show) {      // the showcase's sun crosses its day (SUN.day seconds), then rises again; held while dragged
        const now = performance.now();
        if (!this.show.dragging) this.show.phase = (this.show.phase + (now - this.show.at) / 1000 / SUN.day) % 1;
        this.show.at = now;
        this.render();
      }
      if (this.travel) { this.travel_step(); this.render(); }      // the dial on its way into or out of the showcase
      if (this.show && this.show.spin) this.render();
      this.draw();
      this.draw_bezel();
      this.draw_handles();
      this.tiny_draw();
    } catch (e) {
      this.play(false);
      this.log("error while drawing a frame: " + (e.stack || e));
    }
  }

  draw() {
    let S = this.show ? { ...this.S, guides: false, ha_on: this.S.ha_on && !this.show.nohands } : this.S;      // the showcase: no guides; its hands key may hide the hands
    if (!this.show && this.hole_at && performance.now() - this.hole_at < HOLE_LIVE_MS) {      // the centre hole being sized: its guide, alone if the guides are off (#267)
      S = S.guides ? { ...S, gd_hole_live: true } : { ...S, guides: true, gd_hole_live: true, gd_axes: false, gd_rings: false, gd_sel: false, gd_wins: false, gd_wsel: false, gd_more: [] };
    } else if (!this.show && this.guides_at && performance.now() - this.guides_at < HOLE_LIVE_MS) S = { ...S, guides: this.guides_on };      // a number being slid: the guides as set; a numeral being nudged: none (guides_live)
    const day = G.shows_day(S) ? G.day_hour(S) : null;       // an am · pm window follows the time shown, in steps of six minutes
    if (day !== this.day_drawn) { this.day_drawn = day; this.static_dirty = true; }
    if (!this.statik || this.static_dirty) {
      const t0 = performance.now();
      this.statik = G.build_static(S);
      this.static_dirty = false;
      this.build_ms = performance.now() - t0;
    }
    const items = G.scene(S, this.statik, S.t, true, S.ui_ring);
    this.spin_hands(items);      // the showcase's Now: the big hands whirl opposite ways, the seconds go straight
    this.items = items;
    const backdrop = S.out_production ? [1, 1, 1, 1] : S.c_backdrop;
    this.backdrop.setAttribute("fill", to_hex(backdrop));
    this.main.style.setProperty("--canvas-fill", to_hex(backdrop));      // the backdrop's colour, for a switch whose words show (6-preview.css)
    this.sky_stops[0].setAttribute("stop-color", to_hex(backdrop.map((v, i) => (i < 3 ? v * SKY_TOP : 1))));      // the showcase's sky: the backdrop, much darker, at the top left…
    this.sky_stops[1].setAttribute("stop-color", "#000");                                                          // …to black at the bottom right,
    const [sw_, sh_] = this.size(), reach = ((sw_ + sh_) / 2).toFixed(1);                                         // at 45°: along (1, 1), as far as the far corner
    this.sky_grad.setAttribute("x2", reach); this.sky_grad.setAttribute("y2", reach);
    this.draw_pool();
    // what stands on the preview (Guides, Backdrop) is outline only, in black or white: whichever stands out more from
    // the backdrop. One of the two always has a contrast of 4.5 or more, so they can't be lost on any colour.
    const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4), L = 0.2126 * lin(backdrop[0]) + 0.7152 * lin(backdrop[1]) + 0.0722 * lin(backdrop[2]);
    this.main.classList.toggle("dark", 1.05 / (L + 0.05) > (L + 0.05) / 0.05);
    $("#app").classList.toggle("dark", this.main.classList.contains("dark"));      // the mark and title stand on the backdrop when the panel is away
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
      const stroke = item.stroke ? to_hex(item.stroke) + "/" + item.stroke[3] + "/" + item.px + (item.dots ? "/dots" : item.dashes ? "/dashes" : "") : "none";
      if (stroke !== slot.stroke) {
        slot.stroke = stroke;
        if (item.stroke) {
          node.setAttribute("stroke", to_hex(item.stroke));
          node.setAttribute("stroke-opacity", item.stroke[3]);
          node.setAttribute("stroke-width", item.px);
          node.setAttribute("vector-effect", "non-scaling-stroke");      // guides keep their width on screen
          node.setAttribute("pointer-events", "none");
          if (item.dots) { node.setAttribute("stroke-dasharray", `0 ${3 * item.px}`); node.setAttribute("stroke-linecap", "round"); }      // a dotted guide: round dots three widths apart (#272)
          else if (item.dashes) { node.setAttribute("stroke-dasharray", `${3 * item.px} ${3 * item.px}`); node.removeAttribute("stroke-linecap"); }      // a dashed guide: a window's disc (4.72), told from the window's own solid edges and dotted middle
          else { node.removeAttribute("stroke-dasharray"); node.removeAttribute("stroke-linecap"); }
        } else for (const a of ["stroke", "stroke-opacity", "stroke-width", "vector-effect", "pointer-events", "stroke-dasharray", "stroke-linecap"]) node.removeAttribute(a);
      }
      if (item.angle !== slot.angle) {             // hands turn about the pivot (R2: clockwise)
        slot.angle = item.angle;
        if (item.angle) node.setAttribute("transform", `rotate(${-item.angle})`); else node.removeAttribute("transform");
      }
      node.dataset.i = i;
    });
    this.draw_picked();
    this.draw_light(items);      // a ring of shine and the hands' bevels, before the shadows that fall over them (4.77)
    this.draw_shadows(items);
    this.place();
    const ring = this.ring();
    const font = G.has_text(ring) ? `   ·   ${ring.ps}` : "";
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
  fit_zoom() { const [w, h] = this.size(); return Math.min(w, h) / G.page_mm(this.S); }      // the dial, never its case (4.69; Okay, 22:35: "Fit and previews care about the dial still, the bezel and strap secondary"; 4.66–4.68 made room for the case)

  /** put the dial at c, scaled to z; mirrored for toner transfer. y grows upward inside. */
  place() {
    const flip = this.S.out_mirror ? -1 : 1;
    const where = `translate(${this.c[0]} ${this.c[1]}) scale(${flip * this.z} ${-this.z})`;
    this.dial.setAttribute("transform", where);
    this.over.setAttribute("transform", where);
    if (this.handles) { this.handles.setAttribute("transform", where); this.handles_key = ""; }
    if (this.bezel_g) this.bezel_g.setAttribute("transform", where);
    if (this.pool) this.pool.setAttribute("transform", where);
  }

  fit() {
    const [w, h] = this.size();
    if (w < 1 || h < 1) return;
    if (this.travel) return;                       // on its way: travel_step aims at the new size
    this.fitted = true;
    const to = this.show ? this.show_target() : { c: [w / 2, h / 2], z: this.fit_zoom() };      // the showcase has its own size
    this.z = to.z;
    this.c = to.c;
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
    if (this.travel) { this.view = [w, h]; return; }
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
      if (this.show) return;                       // the showcase: the dial stays where it is
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
    this.svg.addEventListener("pointerdown", (e) => { pts.set(e.pointerId, at(e)); this.svg.setPointerCapture(e.pointerId); if (pts.size === 1) down = null; restart(); if (this.show && pts.size === 1) { this.show.dragging = true; this.sun_to(at(e)); } });      // the showcase: the sun to the pointer, along its day
    this.svg.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return e.pointerType === "mouse" ? this.hover(at(e), document.elementFromPoint(e.clientX, e.clientY)) : null;
      pts.set(e.pointerId, at(e));
      if (pts.size >= 2) {
        if (this.show) return;                     // the showcase: no pinch, only the sun
        const now = pair();
        this.hover(null);
        this.c = [this.c[0] + now.mid[0] - down.mid[0], this.c[1] + now.mid[1] - down.mid[1]];      // pan by the midpoint…
        this.zoom(now.d / down.d, now.mid);                                                        // …zoom by the distance (zoom places)
        down.d = now.d; down.mid = now.mid;
        return;
      }
      const p = at(e);
      if (this.show) { this.sun_to(p); return; }      // the showcase: a drag moves the sun, not the dial
      if (Math.hypot(p[0] - down.p[0], p[1] - down.p[1]) > 4) down.moved = true;
      // a finger alone doesn't move the dial: two do, with the pinch (Okay, 18 Oct 2026, notes 2: "on ipad and all touch
      // screens, you need two fingers to move as well. One finger drag sometimes confusing as reported"). The mouse drags.
      if (e.pointerType === "touch") return;
      if (down.moved) { this.hover(null); this.fitted = false; this.c = [down.c[0] + p[0] - down.p[0], down.c[1] + p[1] - down.p[1]]; this.place(); }
    });
    const up = (e) => {
      if (!pts.has(e.pointerId)) return;
      const click = pts.size === 1 && down && !down.moved && e.type === "pointerup" && !this.show;
      if (this.show) { this.show.dragging = false; this.show.at = performance.now(); }
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
      if (pts.size < 2 && !this.show) this.zoom(e.scale / pinch, at(e));
      pinch = e.scale;
    });
  }

  /** what is under a point of the preview: {kind, name, …} or null. kind: ring · hand · cap · date · plate.
   *  Used by the hover label and by the click, so they always agree. */
  piece_at(p, node) {
    const S = this.S, mm = this.to_mm(p), r = Math.hypot(mm[0], mm[1]);
    const item = node && node.dataset && node.dataset.i !== undefined ? this.items[+node.dataset.i] : null;
    const role = item ? item.role : null;
    if (role === "hand" || role === "mark") return { kind: "hand", hand: G.HANDS.indexOf(item.name), name: { hour: "Hour hand", minute: "Minute hand", second: "Seconds hand" }[item.name], path: item.path, angle: item.angle };
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
        const [lo, hi] = G.has_text(R) ? [R.r - R.size / 2, R.r + R.size / 2] : [R.r - (x.kind === "band" ? R.width : R.len), R.r];
        if (r < lo - slack || r > hi + slack) continue;
        const away = x.kind === "band" ? 1e6 : Math.min(...x.taken.map((a) => Math.abs(((angle - a + 540) % 360) - 180))) * Math.PI / 180 * r;
        if (away < best) { best = away; d = x; }
      }
    }
    if (!d) return r <= S.dial_d / 2 && !S.out_production ? { kind: "plate", name: "Plate", path: this.statik.plate, angle: 0 } : null;
    const piece = { kind: "ring", ring: S.rings.indexOf(d.ring), name: d.ring.name || G.kind_of(d.ring), path: d.path, angle: 0 };
    if (d.kind !== "band" && d.parts) {            // which numeral or mark? the nearest one's centre (marks since 4.78, #349)
      let best = Infinity;
      d.parts.forEach((part, k) => {
        const b = part && part.bounds();
        if (!b) return;
        const dist = Math.hypot((b[0] + b[2]) / 2 - mm[0], (b[1] + b[3]) / 2 - mm[1]);
        if (dist < best) { best = dist; piece.position = String(d.at[k]); }
      });
    }
    return piece;
  }

  /** a click on the preview opens the settings of what was clicked. */
  clicked(p, node) {
    const piece = this.piece_at(p, node), S = this.S;
    if (!piece) return this.words_unfold();
    const section = { ring: 1, hand: 2, cap: 2, date: 3, plate: 0 }[piece.kind], same = section === S.ui_section;
    // a ring: a first press chooses it; a press on the ring already chosen chooses the numeral or mark pressed (4.78,
    // #349; Okay's notes 2: "a double click or tap selects the ring, a second what was clicked")
    const second = piece.kind === "ring" && same && S.ui_ring === piece.ring && piece.position !== undefined;
    S.ui_section = section;
    if (piece.kind === "ring") { S.ui_ring = piece.ring; if (second) this.nudge_at = piece.position; }
    if (piece.kind === "hand") S.ui_hand = piece.hand;
    if (piece.kind === "date") S.ui_window = piece.window;
    if (same) { this.fill_ring_list(); this.sync_rows(); } else this.show_section();
    if (second) {                                  // a numeral or mark picked for Nudge: its pane opens, since it starts folded (#270)
      const nudge = this.rows.find((r) => r.fold && r.row.text === "Nudge one numeral");
      if (nudge && this.is_folded(nudge)) this.fold(nudge, false);
    }
    this.render();
  }

  /** the pointer rests on something that can be edited: outline it, and say its name beside the pointer. */
  hover(p, node) {
    const piece = p && !this.show ? this.piece_at(p, node) : null;      // the showcase: no outlines, no names
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
    if (this.date_lines) {                         // the date, stacked: day · month · year, two figures each (07/10/28)
      const [y, m, d] = G.shown_day(this.S).split("-");
      [d, m, y.slice(-2)].forEach((v, i) => { if (this.date_lines[i].textContent !== v) this.date_lines[i].textContent = v; });
      this.date_button.classList.toggle("today", !this.S.date);
      this.date_button.ariaLabel = `Date ${d}/${m}/${y.slice(-2)}${this.S.date ? "" : ", today"}`;
    }
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
    this.place_needle(t12);
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

  /** the needle on the ruler, from the time itself (t12: seconds into the half day): over the slider's thumb's place,
   *  from the ruler's top down to the bar's foot. */
  place_needle(t12 = ((this.S.t % 43200) + 43200) % 43200) {
    const n = this.needle, s = this.time_slider;
    if (!n || !n.isConnected || !s.clientWidth) return;
    const THUMB = 3, bar = n.closest(".bar");
    n.style.left = `${s.offsetLeft + THUMB / 2 + (s.clientWidth - THUMB) * t12 / 43200}px`;
    n.style.top = `${s.offsetTop}px`;
    n.style.height = `${bar.getBoundingClientRect().bottom - s.getBoundingClientRect().top}px`;
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
      const kind = m % 60 === 0 ? "hour" : m % 30 === 0 ? "half" : "small", h = { hour: 18, half: 12, small: 7 }[kind];      // all longer (Okay, 15 Oct 2026, 00:42; were 16 · 10 · 6)
      lines[kind] += `M${x(m * 60)} ${(H - h) / 2}V${(H + h) / 2}`;
      this.day_ticks.push(m * 60);
    }
    this.place_needle();
    this.ruler.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.ruler.dataset.minutes = minutes;
    this.ruler.innerHTML = `<path class="line" d="M0 ${H / 2}H${W}"/>` + Object.entries(lines).map(([kind, d]) => `<path class="${kind}" d="${d}"/>`).join("")
      + `<path class="pose" d="M${x(36600)} 1V${H - 1}"/>`;
  }

  /** how fast time runs while playing: 1 = a real second each second. Part of the window, not of the dial. */
  set_speed(k) {
    this.speed = k;
    if (this.playing) this.play_from = [performance.now(), this.S.t];
    const split = this.speed_split(), p = Math.round(speed_place(k, split) * 1000);
    this.one_knob.style.setProperty("--at", split.toFixed(4));      // 1× is where the slow steps end
    if (document.activeElement !== this.speed_slider || k < 1) this.speed_slider.value = p;      // a slow speed: the thumb onto its step, even while dragged
    this.speed_slider.setAttribute("aria-valuetext", speed_word(k) + "×");
    const word = speed_word(k) + "X";      // a slow speed's leading 0 in a span of its own: a phone's thumb, which holds the word, leaves it out (".25X")
    if (this.speed_name.textContent !== word) this.speed_name.replaceChildren(...(k < 1 ? [el("span", { className: "zero", textContent: "0" }), word.slice(1)] : [word]));
    this.speed_name.style.setProperty("--at", (+this.speed_slider.value / 1000).toFixed(4));      // where the thumb stands
    this.speed_slider.title = `How fast time runs: ${speed_word(k)}× (0.1× to 720×)`;
    this.speeds.classList.toggle("real", k === 1);
  }

  /** the unit box round its word's ink, 2 px from every side (Okay, 16 Oct 2026, #302). The ink's size and place on its
   *  line come from Dial Mono's outlines (UNIT_INK); where the browser puts the line's baseline is measured, with a dot
   *  on it — browsers round a face's ascent and descent each their own way (counted 16 Oct 2026: 8 px down a 10 px line
   *  in Chromium, where the face's figures say 8.6; on Okay's screen "mm" stood on the box's bottom line) */
  size_unit() {
    const word = this.unit()[0], ink = UNIT_INK[word] || UNIT_INK.mm, box = this.unit_button, b = box.style;
    const span = el("span", { className: "word", textContent: word }), dot = el("span");
    box.replaceChildren(span);
    dot.style.cssText = "display:inline-block;width:0;height:0";
    span.append(dot);
    const line = span.getBoundingClientRect(), base = dot.getBoundingClientRect().top - line.top;
    dot.remove();
    if (!line.height) return;      // not shown (a phone's squeezed line): placed when it is
    // in whole screen dots, so the line is crisp and the room the same on every side: the box round the ink, the ink's
    // leftover fraction shared out, the word placed so its ink starts the padding in
    const size = parseFloat(getComputedStyle(box).fontSize), dots = window.devicePixelRatio || 1, snap = (v) => Math.round(v * dots) / dots;
    // its width the word's own; its height mm's for every unit, on mm's baseline, so a unit's ascenders and descenders
    // reach into the padding (Okay, on 4.44.3: "Others use the same height, width can change")
    const [l, w] = ink.map((v) => v * size), [, , t, h] = UNIT_INK.mm.map((v) => v * size), W = Math.round(w * dots) / dots, H = Math.round(h * dots) / dots;
    b.setProperty("--ink-w", W + "px");
    b.setProperty("--ink-h", H + "px");
    b.setProperty("--word-x", snap((W - w) / 2 - l) + "px");      // from the padding's inner edge to the word's line
    b.setProperty("--word-y", snap((H - h) / 2 + t - base) + "px");
    requestAnimationFrame(() => this.level_title());      // a box of another height: its word on the title's baseline again
  }

  /** how much of the speed track the slow steps take: two thumbs of the thumb's travel (#283: "at least as wide as two
   *  thumbs"), a fifth to a half of it; before the bar is laid out, two fifths */
  speed_split() {
    const thumb = parseFloat(getComputedStyle(this.speeds).getPropertyValue("--speed-thumb")) || 0, travel = this.speed_slider.getBoundingClientRect().width - thumb;
    return thumb > 0 && travel > 0 ? Math.min(0.5, Math.max(0.2, 2 * thumb / travel)) : 0.4;
  }

  /** while time runs the play button pulses with each beat of the movement (Okay, 15 Oct 2026, 01:20; his notes, p. 14,
   *  #282): its cap brightens and fades the whole way before the next beat, eased (--pulse, 0 to 1 of --play-pulse);
   *  the triangle flares with it and fades faster, gone by half the beat (--pulse-tri, between its two bounds). The beat
   *  is the movement's own (Hands: 1/s quartz, 6 or 8 a second); a sweep has none, and breathes once every two seconds.
   *  It follows the time shown, so it falls with the seconds hand's steps and goes faster as time does — up to six
   *  a second (PULSE_MOST), or the movement's own beat if that is more; past that it holds, in real seconds (720× would
   *  otherwise flash hundreds of times a second; answer to #282).
   *  Below 1× (slow motion) the triangle's flash keeps its own pace (#308; Okay, 16 Oct 2026, on 4.46: "flash and dim
   *  the arrow much faster on slow speeds, flash brighter. Like an analog fade. Eased over the line and comes back"):
   *  it starts at the beat as before, but lasts as long in real seconds as it does at 1× (half a beat), and peaks
   *  brighter (the button's class slow: --play-tri-slow); a sweep's breath runs in real seconds there too. The flash
   *  itself is a flash: zero to bright in milliseconds (PULSE_RISE), then an eased descent, all within PULSE_FLASH of a beat.
   *  t = the time shown, in seconds · now = real seconds. Not where the system asks for less motion. */
  pulse(t, now = 0) {
    let cap = 0, tri = 0;
    const slow = this.speed < 1;
    if (this.playing && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const beat = G.BEATS[this.S.ha_beat] ? G.BEATS[this.S.ha_beat][1] : 0, rate = beat || 0.5, most = Math.max(beat, PULSE_MOST);
      const f = rate * this.speed <= most ? frac(t * rate) : frac(now * most);      // how far from the last beat, 0 to 1
      if (beat > 0) {
        cap = (1 - f) ** 3;                                                         // the cap: a flash at the beat, fading the whole beat
        const h = Math.min(1, (slow ? f / this.speed : f) / PULSE_FLASH);           // the flash's own clock: 0 at the beat, 1 when it is over (PULSE_FLASH of a beat; at 0.1× still that much of a beat in real time)
        tri = h < PULSE_RISE ? 0.5 - 0.5 * Math.cos(Math.PI * h / PULSE_RISE) : (1 - (h - PULSE_RISE) / (1 - PULSE_RISE)) ** 2;
      } else {                                                                      // sweep: a slow breath (in real seconds below 1×)
        cap = 0.5 - 0.5 * Math.cos(2 * Math.PI * (slow ? frac(now * rate) : f)); tri = cap ** 3;
      }
    }
    this.play_button.classList.toggle("slow", this.playing && slow);
    this.play_button.style.setProperty("--pulse", cap.toFixed(3));
    this.play_button.style.setProperty("--pulse-tri", tri.toFixed(3));
  }

  play(on) {
    this.playing = on;
    if (!on) this.pulse(0);
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
        if (live) return this.log(`exported ${name} · ${G.page_mm(S).toFixed(2)} mm square · numerals are text: ${[...new Set(S.rings.filter((r) => r.on && G.has_text(r)).map((r) => r.family))].join(", ") || "no numerals"} must be installed to open it`);
      }
      if (kind === "pdf") save_file(name, pdf_document(S, statik, S.t), "application/pdf");
      if (kind === "sheet") {                      // a print sheet (4.75)
        const L = sheet_layout(S);
        if (!L.places.length) return this.log(`sheet not made: a ${S.dial_d} mm dial doesn't fit on ${L.paper[0]}`);
        save_file(name, pdf_sheet(S, statik, S.t), "application/pdf");
        return this.log(`exported ${name} · ${L.places.length} × ${S.dial_d.toFixed(2)} mm on ${L.paper[0]}${L.staggered ? ", staggered" : ""}${S.out_mirror ? " · mirrored" : ""}${S.out_production ? " · mask" : ""}${S.out_cutline ? " · cut lines" : ""} · print at 100 %, not "fit to page"`);
      }
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
      if (kind === "wearos") {                     // farukahmet's PR #1: each layer a picture at 450 × 450, the face's XML, packed and signed
        this.log("building a Wear OS watch face…");
        const xml = generate_watchface_xml(S, statik), png = (svg) => svg_to_png_bytes(svg), on = (h) => S.ha_on && S["ha_" + h].on;
        const drawables = {
          dial_face: await png(svg_dial_face(S, statik)),
          dial_face_ambient: await png(svg_dial_face(S, statik, "black")),
          dial_face_ambient_black: await png(svg_dial_face(S, statik, "black")),
          dial_face_ambient_dimmed: await png(svg_dial_face(S, statik, "dimmed")),
          hour_hand: on("hour") ? await png(svg_hand(S, "hour")) : null,
          hour_hand_ambient: on("hour") ? await png(svg_hand(S, "hour", "black")) : null,
          minute_hand: on("minute") ? await png(svg_hand(S, "minute")) : null,
          minute_hand_ambient: on("minute") ? await png(svg_hand(S, "minute", "black")) : null,
          second_hand: on("second") ? await png(svg_hand(S, "second")) : null,
          cap: S.ha_on && S.ha_cap > 0 ? await png(svg_cap(S)) : null,
          preview: await png(svg_preview(S, statik)),
          icon: await png(svg_preview(S, statik)),
        };
        for (const x of statik.windows || []) drawables["window_" + x.index] = await png(svg_window_sheet(S, x));
        const label = (S.wearos_name || "").trim() || "Dial Tool", pkg = format_package_name("", label);
        const apk = await build_signed_wearos_apk(xml, drawables, { label, packageId: pkg });
        const apk_name = `dial-wearos-${S.wearos_name && S.wearos_name.trim() ? sanitize_package_suffix(S.wearos_name) : Math.round(S.dial_d) + "mm"}.apk`;
        save_file(apk_name, apk, "application/vnd.android.package-archive");
        return this.log(`exported ${apk_name} · "${label}" (${pkg}) · 450 × 450 px · signed (v2/v3) with a shared debug key: sideload it, adb install`);
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
      tool.loaded_name = name;                     // the new tool says which file it came from, and Save… offers that name (#279)
      tool.sync_rows();
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
    this.value_pop_close();                        // a controller left open would outlive the dial it was for, standing over the new panel (found 18 Oct 2026, 4.52)
    clearTimeout(this.saving);
    for (const w of this.watchers) w.disconnect();
  }

  /** start again with new settings (the simplest way to update every control). */
  reopen(settings) {
    // the window is built again for the new dial: it keeps where it was scrolled, so a Gallery card pressed stays under
    // the finger (Okay, 15 Oct 2026, 11:49: "Found the real jumper: selecting a gallery watch" — measured: the form went
    // back to its top, the Gallery 550 points down, out of sight)
    const panel = $(".panel"), keep = { form: this.form ? this.form.scrollTop : 0, panel: panel ? panel.scrollTop : 0, scrolls: { ...this.scrolls, ...(this.section_shown ? { [this.section_shown]: this.form.scrollTop } : {}) } };
    this.close();
    const fonts = this.catalog;
    tool = new DialTool(settings);
    for (const [ps, f] of fonts) if (!tool.catalog.has(ps)) tool.catalog.set(ps, f);
    tool.load_fonts_in_use();
    window.dial_tool = tool;
    tool.scrolls = keep.scrolls;
    let frames = 0;                                // on a phone or an iPad held upright, which part scrolls is settled a few frames later (.held): try until both stand
    const back = () => {
      const p = $(".panel");
      tool.form.scrollTop = keep.form;
      if (p) p.scrollTop = keep.panel;
      if (++frames < 20 && (Math.abs(tool.form.scrollTop - keep.form) > 1 || (p && Math.abs(p.scrollTop - keep.panel) > 1))) requestAnimationFrame(back);
    };
    back();
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
    if (!this.note.hidden && now !== this.note_for) this.note.hidden = true;      // the dial changed since the note: it is said
    if (HISTORY.now === null) HISTORY.now = now;
    this.sync_undo();
    if (now === HISTORY.now) return;
    HISTORY.past.push(HISTORY.now);
    if (HISTORY.past.length > HISTORY.most) HISTORY.past.shift();
    HISTORY.now = now;
    HISTORY.future = [];
    this.sync_undo();
  }

  /** a note on the preview, as well as the log's line (R17). */
  say(text) {
    this.note.textContent = text;
    this.note.hidden = false;
    this.note_for = dial_text(this.S);
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
  //  Safari and every browser on an iPad (all WebKit) allow the clipboard only while the click is still "fresh": the
  //  link is packed first (a wait), and by then WebKit had refused it, silently (Okay, 18 Oct 2026, notes 2: "The copy
  //  link button is not working, expanded and contracted"). So the clipboard is asked at once, with the link handed over
  //  when it is ready (a ClipboardItem holding a promise, which WebKit accepts); writeText after the wait is the fallback
  //  for browsers without it. The button says what happened, on the button itself (R17: no silent dead end).
  async copy_link(button) {
    const made = this.show_link();
    let copied = false;
    if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": made.then((l) => new Blob([l], { type: "text/plain" })) })]);
        copied = true;
      } catch (e) { /* the fallback below */ }
    }
    const link = await made;
    if (!copied) {
      try { await navigator.clipboard.writeText(link); copied = true; } catch (e) { /* said below */ }
    }
    if (copied) this.log(`link copied · ${link.length} characters`);
    else this.log(`couldn’t copy by itself; the link is in the address bar, and here:\n${link}`);
    if (button) {
      const word = button.querySelector("span");
      clearTimeout(this.copied_back);
      word.textContent = copied ? "Copied" : "Not copied";
      this.copied_back = setTimeout(() => { word.textContent = "Copy link"; }, 1600);
      if (!copied && this.link_box && this.link_box.isConnected && this.link_box.offsetParent) { this.link_box.focus(); this.link_box.select(); }
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
  const linked = await unpack(location.hash);      // a dial in the address comes first…
  let settings = linked?.settings ?? (linked?.old !== undefined ? structuredClone(OPENER) : null);      // (a link of an older scheme: the First dial, R31)
  if (!settings) { try { settings = JSON.parse(localStorage.getItem(LAST)); } catch (e) { settings = null; } }   // …then the last session…
  if (!settings) settings = structuredClone(OPENER);      // …then the opener: the guide's First dial (opener.js; 16 Oct 2026)
  tool = new DialTool(settings);
  const opened = (link) => {
    if (link.settings) { tool.log("opened the dial in the address"); return; }
    tool.log(`${OLD_LINK_NOTE} (link scheme ${link.old}; this Dial Tool reads scheme ${G.LINK_SCHEME})`);
    tool.say(OLD_LINK_NOTE);
  };
  if (linked) opened(linked);
  window.addEventListener("hashchange", async () => {              // another dial's link pasted into this tab
    const next = await unpack(location.hash);
    if (!next) return;
    tool.reopen({ ...(next.settings ?? structuredClone(OPENER)), ui_section: tool.S.ui_section });
    opened(next);
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
