// icons.js — every icon of the window (R33, design canon §9): the four line widths, the drawing helpers (icon, box,
// rim), the signs, the section tabs' icons, the pictures of kinds and hands, the tool icons on the preview. Drawn at the
// size they are shown; checked by web/icons/check.mjs, fitted by web/icons/fit.mjs.

import * as G from "./geometry.js";
import { to_hex } from "./ui.js";

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
export const LINE = 1.5, SLANT = LINE + 1 / 16, CURVE = LINE + 2 / 16, DENSE = LINE - 4 / 16;

export const sw = (w) => `stroke-width="${w}"`;

// a box with round corners: its straight sides LINE, on the grid; its corners CURVE, because a round corner drawn as
// thin as the sides looks thinner (measured: 3–5 % lighter at r 2 and 4). Two paths, so each gets its own width.
export const box = (x, y, w, h, r, side = LINE, corner = CURVE) => {      // side, corner: a quiet sign passes its own pair
  const X = x + w, Y = y + h;
  return `<path d="M${x + r} ${y}H${X - r}M${X} ${y + r}V${Y - r}M${X - r} ${Y}H${x + r}M${x} ${Y - r}V${y + r}"${side === LINE ? "" : ` ${sw(side)}`}/>`
    + `<path d="M${X - r} ${y}A${r} ${r} 0 0 1 ${X} ${y + r}M${X} ${Y - r}A${r} ${r} 0 0 1 ${X - r} ${Y}M${x + r} ${Y}A${r} ${r} 0 0 1 ${x} ${Y - r}M${x} ${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}" ${sw(corner)}/>`;
};

export const icon = (inside, size = 16, high = size) => `<svg viewBox="0 0 ${size} ${high}" width="${size}" height="${high}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="round" stroke-linejoin="round">${inside}</svg>`;

export const ticks = (n, r0, r1, c = 0) => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n, x = Math.sin(a), y = -Math.cos(a); return `M${(c + x * r0).toFixed(2)} ${(c + y * r0).toFixed(2)}L${(c + x * r1).toFixed(2)} ${(c + y * r1).toFixed(2)}`; }).join("");

// a ring that holds a sign (a tab, a window card): outer edge at 15.5 from the centre, as before; drawn in CURVE
export const RIM = 15.5 - CURVE / 2, RIM_IN = 15.5 - CURVE;      // its radius, and its inner edge

export const rim = (cls = "") => `<circle${cls ? ` class="${cls}"` : ""} cx="17" cy="17" r="${RIM}" ${sw(CURVE)}/>`;

// the shared signs, on 16 points. Their live area is 3.25 … 13.25; a plus is a little shorter (9) and a cross shorter
// still (8), because open shapes look larger than the arrows and boxes beside them.
export const SIGNS = {
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
export const BIG = {                                      // the controller's − and + (Okay's second drawing, 18 Oct 2026, controller 2.svg): square ends, white on the discs; at the controller's three quarters, 6 thick and 30 long on 33, drawn at the size shown (R33)
  // at 70 % × 85 % of that (Okay, 24 Oct 2026: "plus minus … 70% of now"; 18:31: "a bit more smaller %15"): 3.57 thick, 17.85 long, on 19.635
  plus: icon(`<path d="M9.8175 0.8925V18.7425M0.8925 9.8175H18.7425" ${sw(3.57)} stroke-linecap="butt"/>`, 19.635),
  minus: icon(`<path d="M0.8925 9.8175H18.7425" ${sw(3.57)} stroke-linecap="butt"/>`, 19.635),
};

// the − and + of every number box (4.64; Okay, 18 Oct 2026, 21:20: "Signs grow inside the box as much as these new thick
// bordered ones"): 12 across on 16, LINE, round ends — half the box's cell.
export const STEP = {
  plus: icon(`<path d="M8.25 2.25V14.25M2.25 8.25H14.25"/>`),
  minus: icon(`<path d="M2.25 8.25H14.25"/>`),
};

// a section's sign: a small picture inside a ring. Signs of circles share the ring's centre (17); signs with
// straight lines sit on the grid (17.25).
export const C = 17.25;

export const SECTION_ICONS = {
  // a dial: the plate and its centre hole (Okay's drawing, 14 Oct 2026, after the guilloché rings: "Dial → a circle
  // with a small o"; chosen, the plate filled and the hole a dot of paper: the hub's fill, in the stylesheet)
  Dial: `<circle class="hub" cx="17" cy="17" r="2" ${sw(CURVE)}/>`,
  // two rings, the three gaps equal: rim to ring, ring to ring, ring to the middle (Okay, 14 Oct 2026: "equalized")
  Rings: `<g ${sw(CURVE)}><circle cx="17" cy="17" r="9.5"/><circle cx="17" cy="17" r="4.375"/></g>`,
  Hands: `<path d="M${C} ${C}V8.75M${C} ${C}L22.75 20.75"/><circle cx="${C}" cy="${C}" r="1.5" fill="currentColor" stroke="none"/>`,
  Date: `<rect x="19" y="14" width="8" height="6.5" rx="1.5" fill="currentColor" stroke="none"/>`,      // a dial with a window at 3, four points from the rim (Okay's drawing, 11 Oct 2026)
  Export: `<path d="M${C} 9.25V20.25M13.25 16.25L${C} 20.25L21.25 16.25M10.75 24.25H23.75"/>`,
  // show mode's tabs (the Show Case's, 21 Oct 2026): a watch — its case, lugs and hands; a sun
  Watch: `<g transform="translate(5.9 5.9) scale(1.2)" stroke-width="1.25"><circle cx="9.25" cy="9.25" r="5.5"/><path d="M6.25 2.75V5M12.25 2.75V5M6.25 13.5V15.75M12.25 13.5V15.75"/><path d="M9.25 9.25V6M9.25 9.25H11.75M14.75 9.25H15.75"/></g>`,
  Light: `<circle cx="17" cy="17" r="3" fill="currentColor" stroke="none"/><path d="${Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return `M${(17 + c * 5.75).toFixed(2)} ${(17 + s * 5.75).toFixed(2)}L${(17 + c * 7.75).toFixed(2)} ${(17 + s * 7.75).toFixed(2)}`; }).join("")}"/>`,
};

// a round sign button (the ring list's tools): its ring is part of the sign, drawn here as heavy as the sign
// (Okay, 14 Oct 2026: "they all count as part of icon"); the button's own border stays clear. 26 points, the sign's
// 16 in the middle; the ring's outer edge where the border's was (13 from the centre).
export const round_sign = (inside) => icon(`<circle class="rim" cx="13" cy="13" r="${13 - CURVE / 2}" ${sw(CURVE)}/><g transform="translate(5 5)">${inside}</g>`, 26);

export const section_icon = (name) => icon(`${rim("ring")}<g class="sign">${SECTION_ICONS[{ "Show dial": "Dial", "Show export": "Export" }[name] || name]}</g>`, 34);

export const EYE = {                                      // the left column's sign: open = showing, closed (with lashes) = put away
  open: `<path d="M1.75 8.25C3.75 4.85 6.05 3.55 8.25 3.55S12.75 4.85 14.75 8.25C12.75 11.65 10.45 12.95 8.25 12.95S3.75 11.65 1.75 8.25Z" ${sw(CURVE)}/><circle cx="8.25" cy="8.25" r="2.25" fill="currentColor" stroke="none"/>`,
  closed: `<path d="M1.75 6.75C3.75 9.85 6.05 11.05 8.25 11.05S12.75 9.85 14.75 6.75M8.25 11.05V13.75M4.95 10.35L3.95 12.65M11.55 10.35L12.55 12.65M2.75 8.35L1.35 10.05M13.75 8.35L15.15 10.05" ${sw(CURVE)}/>`,
};

export const eye = (open) => icon(EYE[open ? "open" : "closed"]);
// show mode's Dial tab: a part shown or hidden on the watch, a dot, so the eye stays the panes' fold (#547; Okay, 25 Oct
// 2026: "Eyes doing different functions, make the second levels something else?"; "A · dot"): filled shown, a ring hidden
export const SHOWN = {
  on: `<circle cx="8.25" cy="8.25" r="4" fill="currentColor" stroke="none"/>`,
  off: `<circle cx="8.25" cy="8.25" r="3.5" ${sw(CURVE)}/>`,
};
export const shown_dot = (on) => icon(SHOWN[on ? "on" : "off"]);

export const NONE_SIGN = SIGNS.sheet + `<path d="M6.75 8.25L9.75 11.25M9.75 8.25L6.75 11.25" ${sw(SLANT)}/>`;      // the sheet with a cross: this font has none of it

// a "none" in a row of colour dots: a slashed circle on 14, larger than the dots (Okay, 19 Oct 2026, 00:59: "the oslashes for no went too small"); so small, LINE is enough
export const none_dot = `<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="round"><path d="M7 ${1 + LINE / 2}A${6 - LINE / 2} ${6 - LINE / 2} 0 1 1 7 ${13 - LINE / 2}A${6 - LINE / 2} ${6 - LINE / 2} 0 1 1 7 ${1 + LINE / 2}M4.25 4.25L9.75 9.75"/></svg>`;      // ring and stroke one path: where they meet nothing doubles, at any opacity (Okay, 16 Oct 2026, #271)

// small pictures for choices that are easier seen than read: drawn at the size they are shown, 38 × 27 (they were
// drawn on 28 × 20 and enlarged 1.35 times; Okay, 13 Oct 2026: "bigger, better (less detail) icons… this goes for all")
export const pic = (inside) => icon(inside, 38, 27);

export const solid = `fill="currentColor" stroke="none"`;

export const KIND_PIC = 24;                               // a kind's picture, a square this wide: the ring line and the Add menu

// Placement's arrows (18 Oct 2026): a thin stem and a big filled head, 6 long in all, centred on (px, py), pointing dir
// degrees clockwise from up; the stem runs from the tail into the head's base, so no gap shows between them
export const stem_at = (px, py, dir) => {
  const t = dir * Math.PI / 180, ux = Math.sin(t), uy = -Math.cos(t), f = (v) => +v.toFixed(3);
  return `M${f(px - ux * 3)} ${f(py - uy * 3)}L${f(px + ux * 0.5)} ${f(py + uy * 0.5)}`;
};

export const head_at = (px, py, dir) => {
  const t = dir * Math.PI / 180, ux = Math.sin(t), uy = -Math.cos(t), f = (v) => +v.toFixed(3);
  const tip = [px + ux * 3, py + uy * 3], base = [px + ux * 0.25, py + uy * 0.25], half = 1.75;
  return `M${f(tip[0])} ${f(tip[1])}L${f(base[0] - uy * half)} ${f(base[1] + ux * half)}L${f(base[0] + uy * half)} ${f(base[1] - ux * half)}Z`;
};

export const PICS = {
  // a ring's kind: the whole circle, as on a dial (Okay's drawing, 13 Oct 2026), centre 12. The four weigh about the
  // same (Okay, 13 Oct 2026: "equalize contrast"): many thin ticks (1), eight thicker marks (2), four numbers in the
  // pixel font at its own size (8), a band (3). These are the dial's own widths, pictured, not lines: kept.
  // reworked 4.50 (#255, Okay's notes, p. 3: "a smaller optical size; abort silkscreen there … a fat Inter"): the
  // drawings a size smaller in their box (radius 9.75), the figures and words in the tool's sans, bold (.figure)
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
  // show mode's Dial tab (#546; Okay, 25 Oct 2026: "Tiny marks … look at prescedents"; "Hands unnecessary to iconize"):
  // beside the ring marks above, a window (the Windows tab's, alone), at KIND_PIC
  window_mark: icon(`<rect x="7" y="8.5" width="10" height="7" rx="1.5" fill="currentColor" stroke="none"/>`, KIND_PIC),
  // a stroke's joins (#551; Okay's drawing, 31 Oct 2026: three tiles, an L-shaped band each, its outer corner sharp,
  // round or cut): the band 5 wide, as the shape tile's baton; pictured widths, not lines
  join: [`<path d="M12 6H17V16H27V21H12Z" ${solid}/>`, `<path d="M12 6H17V16H27V21H17A5 5 0 0 1 12 16Z" ${solid}/>`, `<path d="M12 6H17V16H27V21H17L12 16Z" ${solid}/>`],
  shape: [`<rect x="16.5" y="4" width="5" height="19" ${solid}/>`, `<path d="M14.5 4H23.5L20.5 23H17.5Z" ${solid}/>`, `<circle cx="19" cy="13.5" r="6" ${solid}/>`],
  twelve: [                                        // the baton is the shape tile's baton: same width (5)
    `<rect x="16.5" y="4" width="5" height="19" ${solid}/>`,
    `<rect x="11.5" y="4" width="5" height="19" ${solid}/><rect x="21.5" y="4" width="5" height="19" ${solid}/>`,
    `<path d="M11 4H27L19 23Z" ${solid}/>`,
    // none: the baton's outline in dots (a place left empty). 19 Oct 2026 (Okay: "This none icon needs to be dotted.
    // each dot on corners, fill sides with dots with equal spaces"): a dot at each corner of a 4 × 18 outline inside
    // the baton's 5 × 19 and every 2 along its sides — the short sides two steps, the long nine
    // (3.5 apart with no middle dot on the short sides, it read as two columns, the grip's sign)
    [[17, 19, 21].flatMap((x) => [[x, 4.5], [x, 22.5]]), [1, 2, 3, 4, 5, 6, 7, 8].flatMap((i) => [[17, 4.5 + 2 * i], [21, 4.5 + 2 * i]])].flat()
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.625" ${solid}/>`).join(""),
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
    // the arc a sixth larger and 2 up, on its box's middle (Okay, 20 Oct 2026, 01:16: "Arc shape icon larger 2px up")
    `<path d="M2.75 9.75A15 15 0 0 1 23.25 9.75L20.5 13.75A10.25 10.25 0 0 0 5.5 13.75Z" ${sw(CURVE)}/>`,
    // half: an am · pm window's hole, half a circle on its flat side (20 Oct 2026: "Am/pm window should come selected as a shape")
    `<path d="M4.5 13.25A8.5 8.5 0 0 1 21.5 13.25Z" ${sw(CURVE)}/>`,
  ],
  // what a window shows, in as few lines as say it: one figure · one letter · a half filled · a crescent — on 30 × 21
  // (Okay, 16 Oct 2026, on the Windows page's mock-ups: "smaller icons")
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
export const hand_pic = (i) => {
  // the disc: its marker inside it, cut out, as a disc hand's window is (Okay, 18 Oct 2026, notes 2: "Preview icon shows
  // wedge outside the disc, correct it")
  const disc = G.HAND_SHAPES[i] === "disc" ? { len: 2.75, disc_d: 6, mark_len: 2, mark_w: 1.25 } : {};
  const p = G.hand_shape({ ...G.HAND_BASE, shape: i, len: 13, w: 2.2, tail: 3, tip: 4.5, feature: 4.4, feature_at: [0, 0, 0, 30, 0, 0, 45, 62, 62][i] || 0, round: 0, wall: 0, counter: 0, disc_d: 6, mark_len: 7, mark_w: 2.2, ...disc });
  return `<svg viewBox="-3 -14 6 18.5" width="12" height="38" aria-hidden="true"><path d="${p.svg(3, true)}" fill="currentColor"/></svg>`;
};

/** the chosen hand as it is now, with all its settings (length, width, tail, round ends, hollow wall, counterweight),
 *  as large as its box allows: upright for a tall box, lying (tip to the right) for a wide one — both are drawn, the
 *  stylesheet shows one. The centre it turns on is marked: a line across the box and a small ring (Okay, 13 Oct 2026).
 *  cap: {d} when the cap is drawn with this hand (the seconds hand, or the topmost with Cap on this hand), as on the
 *  dial — over the hand, in the picture's ink: colour stays on the face (Okay, 19 Oct 2026: "seconds preview needs cap
 *  preview"; "do not color cap on preview. Color stays on the face"). */
export const hand_detail = (h, cap = null) => {
  const p = G.hand_shape(h), b = p.bounds();
  if (!b) return "";
  if (cap) { const r = cap.d / 2; b[0] = Math.min(b[0], -r); b[1] = Math.min(b[1], -r); b[2] = Math.max(b[2], r); b[3] = Math.max(b[3], r); }      // the box holds the cap too
  const w = b[2] - b[0], high = b[3] - b[1], m = high * 0.03, f = (v) => v.toFixed(3);      // m: a little room round it
  const d = p.svg(3, true), ring = f(Math.max(high * 0.012, 0.12));
  const centre = (line) => `<path class="axis" d="${line}"/><circle class="pivot" r="${ring}"/>`;
  const mark = G.paints_mark(h) && G.disc_mark(h), md = mark ? mark.svg(3, true) : "";      // a disc's painted mark, in its own colour (#300)
  const marked = (turn) => (mark ? `<path class="mark" d="${md}"${turn} fill="${to_hex(h.mark_c)}"/>` : "")
    + (cap ? `<circle class="cap" r="${f(cap.d / 2)}" fill="currentColor"/>` : "");      // the cap over the hand, at its pivot
  return `<svg class="upright" viewBox="${f(b[0] - m)} ${f(-b[3] - m)} ${f(w + 2 * m)} ${f(high + 2 * m)}" aria-hidden="true"><path d="${d}" fill="currentColor" fill-rule="evenodd"/>${marked("")}<clipPath id="lit-upright"><path class="litarea"/></clipPath><path class="lit" d="${d}" clip-path="url(#lit-upright)"/>${centre("M-999 0L999 0")}</svg>`
    + `<svg class="lying" viewBox="${f(b[1] - m)} ${f(b[0] - m)} ${f(high + 2 * m)} ${f(w + 2 * m)}" aria-hidden="true"><path d="${d}" transform="rotate(90)" fill="currentColor" fill-rule="evenodd"/>${marked(' transform="rotate(90)"')}<clipPath id="lit-lying"><path class="litarea"/></clipPath><path class="lit" d="${d}" transform="rotate(90)" clip-path="url(#lit-lying)"/>${centre("M0 -999L0 999")}</svg>`;
};

/** the part of a hand that one of its numbers makes (#329; Okay's notes 2, 18 Oct 2026: "hovering a row lights its part
 *  on the hand's picture at the left"): what changes when that number changes. The hand is drawn again with the number a
 *  little less and a little more, and the part is where those differ from the hand as it is — so the length lights the
 *  tip, the width both edges, the tail its end, round ends the ends, the wall the hollow, and a number at 0 shows where
 *  its part would come (a counterweight's circle, a wall's ring). A step of 15 % of the value, or half the row's range
 *  when the value is 0 (a tenth hid a counterweight inside the hand). → a path in the hand's own space, or null. */
export const hand_part = (h, row) => {
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
// the case sign's ink traps (#476): where each lug (x 9.25 ± 3) meets the ring (r 5.5 on 9.25), on both edges of both
export const CASE_TRAPS = (() => {
  const c = 9.25, r = 5.5, half = DENSE / 2, cut = 0.45, out = [];
  for (const edge of [r + half, r - half]) for (const off of [3 - half, 3 + half]) for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const y = Math.sqrt(edge * edge - off * off);
    out.push(`<circle cx="${(c + sx * off).toFixed(3)}" cy="${(c + sy * y).toFixed(3)}" r="${cut}" fill="black" stroke="none"/>`);
  }
  return out.join("");
})();

export const INK_TRAPS = (() => {
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

export const EYE_RAYS = 16, EYE_RAY = 0.75, RAY_REACH = 240;      // RAY_REACH: how far the rays run, faded to nothing there (behind the words, 24 Oct 2026)

      // 16 at 0.75: Okay's 4.39 drawing, 23 Oct 2026 ("replace regular preview with this version"); 24 at 0.625 before      // the eye switch's rays: how many, how thick (Okay, 15 Oct 2026, 03:41; 0.5 until 16 Oct: "thicker lines, just barely visibly on 100%, not like +1px")
// the hands' bevels (#354, 4.77; notes 2: "a height simply shaded in a few tones of the hand's colour by the shadows'
// light … not 3d like all facets shifted"): each hand split along its length, the side the light falls on lighter, the
// other darker, by as much as the light comes from the side; preview only (R5, R26)
export const BEVEL = { light: 0.22, dark: 0.26 };

export const TOOL_ICONS = {
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
  // Versions, under undo (#435; Okay, 19 Oct 2026, 23:11: "Icon: dial with two hands"): a dial's edge, the minute hand
  // up, the hour hand at four (fit.mjs; look.py 2.1 %)
  versions: `<circle cx="8.25" cy="8.25" r="5.5" ${sw(CURVE)}/><path d="M8.25 8.25V5.25"/><path d="M8.25 8.25L10.5 9.75" ${sw(SLANT)}/>`,
  wide: `<rect x="2.75" y="2.75" width="10.5" height="10.5"/><path d="M6.25 10.25L10.25 6.25M7.25 6.25H10.25V9.25" ${sw(DENSE)}/>`,
  find: `<circle cx="7" cy="7" r="4.25" ${sw(CURVE)}/><path d="M10.25 10.25L13.25 13.25" ${sw(SLANT)}/>`,
  // the bar's three view squares (Okay, 25 Oct 2026: "Two m glasses one with a plus other minus. And lastly the fit is
  // an icon four arrows from a square's corners into center"): a lens with − · a lens with + · four arrows from the
  // corners in (fit.mjs; look.py: − 2.5 %; the + crowds the lens, so its cross is DENSE; the arrows' heads meet their
  // slanted shafts and read heavier there, so the heads are DENSE: 10 % in place, 9 % light alone — perception decides)
  zoomout: `<circle cx="6.75" cy="6.75" r="5.5" ${sw(CURVE)}/><path d="M10.75 10.75L14.25 14.25" ${sw(SLANT)}/><path d="M4.25 6.75H9.25"/>`,
  zoomin: `<circle cx="6.75" cy="6.75" r="5.5" ${sw(CURVE)}/><path d="M10.75 10.75L14.25 14.25" ${sw(SLANT)}/><path d="M4.25 6.75H9.25M6.75 4.25V9.25" ${sw(DENSE)}/>`,
  fit: `<path d="M2.25 2.25L6.25 6.25M14.25 2.25L10.25 6.25M2.25 14.25L6.25 10.25M14.25 14.25L10.25 10.25" ${sw(SLANT)}/><path d="M6.25 3.75V6.25H3.75M10.25 3.75V6.25H12.75M6.25 12.75V10.25H3.75M10.25 12.75V10.25H12.75" ${sw(DENSE)}/>`,
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
  // a case and X-ray (4.79; Okay, 19 Oct 2026, 01:03: "Strap and case: stack on that left bottom list, on mobile
  // icon them"): on 18, DENSE, as the Guides and Shadows signs — a case with its four lugs and crown; a disc's edge whole
  // round a dashed one under it
  // a case from above (4.82; Okay, 19 Oct 2026: "Case icon … need work"): its bezel and dial opening, the lugs running
  // out of it, the crown at 3
  // the case from above (Okay, 20 Oct 2026, 02:37, notes doc: "lugs tooo long. Half, maybe even more … fits inside a
  // square dead center excluding the enormous crown … Crown shorter, barely visible … inktraps like Guides … Inside dial,
  // not a ring but hour and minute hands in L formation"): Guides' ring (r 5.5 on 9.25), its lugs a third of the old
  // length outside it with ink traps where they meet it, the hands at three o'clock, the crown a stub after the centring
  case: `<mask id="case-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18"><rect width="18" height="18" fill="white" stroke="none"/>${CASE_TRAPS}</mask>`
    + `<g ${sw(DENSE)}><g mask="url(#case-cut)"><circle cx="9.25" cy="9.25" r="5.5"/><path d="M6.25 2.75V5M12.25 2.75V5M6.25 13.5V15.75M12.25 13.5V15.75"/></g><path d="M9.25 9.25V6M9.25 9.25H11.75M14.75 9.25H15.75"/></g>`,
  xray: `<g ${sw(DENSE)}><circle cx="9.25" cy="9.25" r="6.5"/><circle cx="9.25" cy="9.25" r="3.25" stroke-dasharray="1.25 1.3" stroke-linecap="butt"/></g>`,
  shadows: `<circle cx="8.25" cy="7.75" r="5.5" ${sw(DENSE)}/><path d="M12 4C14 6 14 9.5 12 11.5C10 14 6.5 14 4.5 11.5C8 12 11.5 9.5 12 5.5C12 5 12 4.5 12 4Z" fill="currentColor" stroke="none"/><ellipse cx="11.5" cy="14.75" rx="5" ry="1.5" fill="currentColor" stroke="none"/>`      // Okay's 4.38.6 drawing again (23 Oct 2026): a ball, its dark side, its shadow on the ground
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
  // EYE_RAYS: 16 (one ray straight up)
  eyebox: (() => {
    const cx = 15.25, cy = 15, lift = 5.25 * 1.2, n = EYE_RAYS;
    const lid = `M6.25 ${cy}C12.25 ${cy - lift} 18.25 ${cy - lift} 24.25 ${cy}C18.25 ${cy + lift} 12.25 ${cy + lift} 6.25 ${cy}Z`;
    // the rays run on past the box, fading with distance, so that opened they reach out behind ACTIVATE SHOWCASE (Okay,
    // 24 Oct 2026: "Extend behind text at all times"); closed, the box cuts them where it always has
    const rays = Array.from({ length: n }, (_, k) => { const a = 2 * Math.PI * k / n; return `M${cx} ${cy}L${(cx + RAY_REACH * Math.sin(a)).toFixed(2)} ${(cy - RAY_REACH * Math.cos(a)).toFixed(2)}`; }).join("");
    return `<radialGradient id="rays-fade" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${RAY_REACH}"><stop offset="${(15 / RAY_REACH).toFixed(3)}" stop-color="white"/><stop offset="${(30 / RAY_REACH).toFixed(3)}" stop-color="#555"/><stop offset="1" stop-color="black"/></radialGradient>`
      + `<mask id="eye-cut" maskUnits="userSpaceOnUse" x="${cx - RAY_REACH}" y="${cy - RAY_REACH}" width="${2 * RAY_REACH}" height="${2 * RAY_REACH}"><rect x="${cx - RAY_REACH}" y="${cy - RAY_REACH}" width="${2 * RAY_REACH}" height="${2 * RAY_REACH}" fill="url(#rays-fade)" stroke="none"/><path d="${lid}" fill="black" stroke="black" ${sw(CURVE)}/></mask>`
      + `<g mask="url(#eye-cut)"><path class="rays" d="${rays}" stroke-width="${EYE_RAY}" stroke-linecap="butt"/></g><circle cx="${cx}" cy="${cy}" r="2.75" fill="currentColor" stroke="none"/>`;      // the mask stays still while the rays turn (.rays, 6-preview.css)
  })(),
  // the show-mode switch, left of the eye (Okay, 15 Oct 2026, 04:26: "just the iris inside same box"): the eye's iris
  // alone, where it stands in the eye. In show mode it is the way out: two of the eye's rays cross on it, an X run
  // out to the box (04:59: "iris becomes an x (2rayiris)"); 1, not the eye's 0.5, so it reads while faint
  // 18 Oct 2026 (notes 2: "the x on the showcase should not penetrate the iris. Lines stop at ghost eye distance"): the X
  // is cut by the eye switch's own absent eye — the same lids, knocked out — so its lines stop where the eye's rays do
  iris: (() => {
    const cy = 15, lift = 5.25 * 1.2;
    const lid = `M6.25 ${cy}C12.25 ${cy - lift} 18.25 ${cy - lift} 24.25 ${cy}C18.25 ${cy + lift} 12.25 ${cy + lift} 6.25 ${cy}Z`;
    return `<mask id="iris-cut" maskUnits="userSpaceOnUse" x="-2" y="-2" width="34" height="34"><rect x="-2" y="-2" width="34" height="34" fill="white" stroke="none"/><path d="${lid}" fill="black" stroke="black" ${sw(CURVE)}/></mask>`
      + `<circle cx="15.25" cy="15" r="2.75" fill="currentColor" stroke="none"/><path class="x" d="M-0.75 -1L31.25 31M31.25 -1L-0.75 31" stroke-width="1" stroke-linecap="butt" mask="url(#iris-cut)"/>`;
  })(),
  // the show-mode switch (Okay, 19 Oct 2026, 12:46: "Swap icons but not places for showcase and tiny preview.
  // Tiny gets the dot, showcase gets the eye"): the iris above with its lids drawn round it — the eye switch's own eye,
  // drawn where that one is left out — and in show mode the same X, cut by the lids
  show_eye: (() => {
    const cy = 15, lift = 5.25 * 1.2;
    const lid = `M6.25 ${cy}C12.25 ${cy - lift} 18.25 ${cy - lift} 24.25 ${cy}C18.25 ${cy + lift} 12.25 ${cy + lift} 6.25 ${cy}Z`;
    return `<mask id="show-cut" maskUnits="userSpaceOnUse" x="-2" y="-2" width="34" height="34"><rect x="-2" y="-2" width="34" height="34" fill="white" stroke="none"/><path d="${lid}" fill="black" stroke="black" ${sw(CURVE)}/></mask>`
      + `<path d="${lid}" ${sw(CURVE)}/><circle cx="15.25" cy="15" r="2.75" fill="currentColor" stroke="none"/><path class="x" d="M-0.75 -1L31.25 31M31.25 -1L-0.75 31" stroke-width="1" stroke-linecap="butt" mask="url(#show-cut)"/>`;
  })(),
  screen: `<rect x="2.75" y="3.25" width="10.5" height="7.5"/><path d="M8.25 10.75V13.25M5.75 13.25H10.75" ${sw(DENSE)}/>`,
  // the Guides switch, on 18: a target and its cross; its lines crowd, so DENSE. Okay's drawings (14 Oct 2026, 04:11):
  // guides: a target, its centre ring dashed in six, square-ended (a dash pattern is a texture, not line ends), ink
  // traps where the arms cross the ring. One drawing, on and off: only how much of it shows changes (Okay, 15 Oct
  // 2026, 03:41: "Guides off: icon should not change")
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
export const ARCADE = (down) => {
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
export const play_triangle = (c, r) => {
  const p = (a) => `${(c + r * Math.cos(a * Math.PI / 180)).toFixed(3)} ${(c + r * Math.sin(a * Math.PI / 180)).toFixed(3)}`;
  return `M${p(0)}L${p(120)}L${p(240)}Z`;
};

// a window card: a small dial with the window where it is. The window keeps four points from the rim's inner edge at
// every angle (as on the Windows tab; Okay, 13 Oct 2026, #149): its distance from the centre is found from its own
// half-width and half-height in that direction. Its outline is LINE, its corners on quarter points.
export const card_pic = (angle, on) => {
  const a = angle * Math.PI / 180, s = Math.sin(a), c = -Math.cos(a), hw = 4, hh = 3.25;
  const r = RIM_IN - 4 - (hw * Math.abs(s) + hh * Math.abs(c));
  const q = (v) => Math.round((v - 0.25) * 2) / 2 + 0.25;      // the nearest quarter point
  const x = q(17 + r * s - hw), y = q(17 + r * c - hh);
  return icon(rim() + (on ? `<rect x="${x}" y="${y}" width="8" height="6.5" rx="1.5" fill="currentColor" stroke="none"/>` : "") + box(x, y, 8, 6.5, 1.5), 34);
};
