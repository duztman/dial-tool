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

// ── icons: drawn here, 1.4-point lines, so they take the colour of their button ──

const icon = (inside, size = 16, box = "0 0 16 16") => `<svg viewBox="${box}" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${inside}</svg>`;
const ticks = (n, r0, r1) => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n, x = Math.sin(a), y = -Math.cos(a); return `M${(x * r0).toFixed(2)} ${(y * r0).toFixed(2)}L${(x * r1).toFixed(2)} ${(y * r1).toFixed(2)}`; }).join("");
// a section's sign: a small picture inside a ring
const SECTION_ICONS = {
  // pies: the ring cut in eight (four until beta 4.3). Chosen: every other pie filled, a checkerboard ("dama"; Okay, 11–12 Oct 2026)
  Dial: `<path d="M0.0 -15.0L0.0 15.0M10.61 -10.61L-10.61 10.61M15.0 -0.0L-15.0 0.0M10.61 10.61L-10.61 -10.61" stroke-width="1.1"/><path class="dama" d="M0 0L0.0 -15.0A15 15 0 0 1 10.61 -10.61ZM0 0L15.0 -0.0A15 15 0 0 1 10.61 10.61ZM0 0L0.0 15.0A15 15 0 0 1 -10.61 10.61ZM0 0L-15.0 0.0A15 15 0 0 1 -10.61 -10.61Z" fill="currentColor" stroke="none"/>`,
  Rings: `<circle r="8"/><circle r="3.5"/>`,
  Hands: `<path d="M0 0L0 -8.5M0 0L5.5 3.5"/><circle r="1.3" fill="currentColor" stroke="none"/>`,
  Date: `<rect x="2.2" y="-3.2" width="8" height="6.4" rx="1.4" fill="currentColor" stroke="none"/>`,      // a dial with a window at 3 (Okay's drawing, 11 Oct 2026)
  Export: `<path d="M0 -8L0 3M-4 -1L0 3L4 -1M-6.5 7L6.5 7"/>`,
  Guides: `<circle r="5.5"/><path d="M0 -9.5L0 9.5M-9.5 0L9.5 0"/>`,
};
const section_icon = (name) => icon(`<circle class="ring" r="15"/><g class="sign">${SECTION_ICONS[name]}</g>`, 34, "-17 -17 34 34");
const EYE = {                                      // the left column's sign: open = showing, closed (with lashes) = put away
  open: `<path d="M1.5 8C3.5 4.6 5.8 3.3 8 3.3S12.5 4.6 14.5 8C12.5 11.4 10.2 12.7 8 12.7S3.5 11.4 1.5 8Z"/><circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/>`,
  closed: `<path d="M1.5 6.5C3.5 9.6 5.8 10.8 8 10.8S12.5 9.6 14.5 6.5M8 10.8L8 13.4M4.7 10.1L3.7 12.4M11.3 10.1L12.3 12.4M2.5 8.1L1.1 9.8M13.5 8.1L14.9 9.8"/>`,
};
const eye = (open) => icon(EYE[open ? "open" : "closed"]);
// small pictures for choices that are easier seen than read: drawn on 28 × 20 like the other signs, shown larger
// (Okay, 13 Oct 2026: "bigger, better (less detail) icons… this goes for all"). Their lines stay as thick as a sign's.
const PIC_SCALE = 1.35;
const pic = (inside) => icon(inside, 28, "0 0 28 20").replace('width="28" height="28"', `width="${Math.round(28 * PIC_SCALE)}" height="${Math.round(20 * PIC_SCALE)}"`).replace('stroke-width="1.4"', `stroke-width="${(1.4 / PIC_SCALE).toFixed(2)}"`);
const solid = `fill="currentColor" stroke="none"`;
const KIND_PIC = 30;                               // a kind's picture on a tile, a square this wide (28 × 20 for the others); 24 in the ring line, 20 in the Add menu
const PICS = {
  // a ring's kind: the whole circle, as on a dial (Okay's drawing, 13 Oct 2026). Square, a little larger than the others.
  kind: (i, size = KIND_PIC) => icon([
    // the four weigh about the same (Okay, 13 Oct 2026: "equalize contrast"): many thin ticks, eight thicker marks,
    // four numbers set in the pixel font at its own size (10 here is 8 on the screen at 24), a ring of middle weight
    `<path d="${ticks(24, 8.5, 13.5)}" stroke-width="1.25" stroke-linecap="butt"/>`,
    `<path d="${ticks(8, 8.5, 13.5)}" stroke-width="2.6" stroke-linecap="butt"/>`,
    [["12", 0, -8.75], ["3", 10, 0], ["6", 0, 8.75], ["9", -10, 0]].map(([t, x, y]) => `<text class="pixel" x="${x}" y="${y}" font-size="10" text-anchor="middle" dominant-baseline="central" fill="currentColor" stroke="none">${t}</text>`).join(""),
    `<circle r="10.6" stroke-width="3.6"/>`,
  ][i], size, "-15 -15 30 30"),
  shape: [`<rect x="12" y="3" width="4" height="14" ${solid}/>`, `<path d="M10.5 3L17.5 3L15.2 17L12.8 17Z" ${solid}/>`, `<circle cx="14" cy="10" r="4.5" ${solid}/>`],
  twelve: [
    `<rect x="12.2" y="3" width="3.6" height="14" ${solid}/>`,
    `<rect x="8.6" y="3" width="3.6" height="14" ${solid}/><rect x="15.8" y="3" width="3.6" height="14" ${solid}/>`,
    `<path d="M8 3L20 3L14 17Z" ${solid}/>`,
    `<rect x="12.2" y="3" width="3.6" height="14" stroke-width="1" stroke-dasharray="1.6 1.6"/>`,
  ],
  mode: [                                          // an A at 3 and at 6 o'clock: how it stands
    `<path d="M3 17A11 11 0 0 1 25 17" stroke-width="0.8" opacity="0.45"/><path d="M4 12.5L6 7.5L8 12.5M12 9L14 4L16 9M20 12.5L22 7.5L24 12.5"/>`,
    `<path d="M3 17A11 11 0 0 1 25 17" stroke-width="0.8" opacity="0.45"/><path d="M12 9L14 4L16 9"/><path d="M12 9L14 4L16 9" transform="rotate(-52 14 17)"/><path d="M12 9L14 4L16 9" transform="rotate(52 14 17)"/>`,
    `<circle cx="14" cy="10" r="8.5" stroke-width="0.8" opacity="0.45"/><path d="M12.4 6.4L14 2.6L15.6 6.4"/><path d="M12.4 17.4L14 13.6L15.6 17.4"/>`,
    `<path d="M3 17A11 11 0 0 1 25 17" stroke-width="0.8" opacity="0.45"/><path d="M12.6 8.4L14 4.8L15.4 8.4" /><path d="M12.6 8.4L14 4.8L15.4 8.4" transform="rotate(-24 14 17)"/><path d="M12.6 8.4L14 4.8L15.4 8.4" transform="rotate(24 14 17)"/><path d="M12.6 8.4L14 4.8L15.4 8.4" transform="rotate(-48 14 17)"/><path d="M12.6 8.4L14 4.8L15.4 8.4" transform="rotate(48 14 17)"/>`,
  ],
  hole: [                                          // a window's shape: rectangle · circle · polygon · arch · arc
    `<rect x="6" y="4" width="16" height="12" rx="1.5"/>`,
    `<circle cx="14" cy="10" r="6.5"/>`,
    `<path d="M14 3.2L19.9 6.6L19.9 13.4L14 16.8L8.1 13.4L8.1 6.6Z"/>`,
    `<path d="M3 16A11 11 0 0 1 25 16A5.5 5.5 0 0 0 14 16A5.5 5.5 0 0 0 3 16Z"/>`,
    `<path d="M4.5 12.5A14 14 0 0 1 23.5 12.5L21 16.4A10 10 0 0 0 7 16.4Z"/>`,
  ],
  window: [                                        // what a window shows, in as few lines as say it: one figure · one letter · a half filled · a crescent
    `<rect x="5" y="2.5" width="18" height="15" rx="1.5"/><path d="M12.4 7.6L14.6 6L14.6 14" stroke-width="1.6"/>`,
    `<rect x="2" y="4" width="24" height="12" rx="1.5"/><path d="M10 13.5L10 6.5L14 11.5L18 6.5L18 13.5" stroke-width="1.6"/>`,
    `<rect x="3" y="3.5" width="22" height="13" rx="1.5"/><path d="M3.5 16L3.5 4L14 4L14 16Z" ${solid}/>`,
    `<path d="M17.5 2.8A7.4 7.4 0 1 0 17.5 17.2A9 9 0 0 1 17.5 2.8Z" ${solid}/>`,
  ],
};
/** a hand's picture is the hand itself, drawn by the geometry with a standard size. */
const hand_pic = (i) => {
  const p = G.hand_shape({ ...G.HAND_BASE, shape: i, len: 13, w: 2.2, tail: 3, tip: 4.5, feature: 4.4, feature_at: [0, 0, 0, 30, 0, 0, 45, 62, 62][i] || 0, round: 0, wall: 0, counter: 0 });
  return `<svg viewBox="-3 -14 6 18.5" width="${Math.round(9 * PIC_SCALE)}" height="${Math.round(28 * PIC_SCALE)}" aria-hidden="true"><path d="${p.svg(3, true)}" fill="currentColor"/></svg>`;
};
/** the chosen hand as it is now, with all its settings (length, width, tail, round ends, hollow wall, counterweight):
 *  upright, as large as its box allows. A small ring marks the centre it turns on. */
const hand_detail = (h) => {
  const p = G.hand_shape(h), b = p.bounds();
  if (!b) return "";
  const w = b[2] - b[0], high = b[3] - b[1], m = high * 0.03;      // a little room round it
  return `<svg viewBox="${(b[0] - m).toFixed(3)} ${(-b[3] - m).toFixed(3)} ${(w + 2 * m).toFixed(3)} ${(high + 2 * m).toFixed(3)}" aria-hidden="true"><path d="${p.svg(3, true)}" fill="currentColor" fill-rule="evenodd"/><circle r="${(high * 0.012).toFixed(3)}" class="pivot"/></svg>`;
};
const TOOL_ICONS = {
  rename: `<rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke-width="0.7"/><path d="M8 4.4L8 11.6M6.2 4.2L9.8 4.2M6.2 11.8L9.8 11.8" stroke-width="0.7"/>`,      // thin and light (Okay, 11 Oct 2026)
  panel: `<rect x="1.5" y="2.5" width="13" height="11"/><path d="M6 2.5L6 13.5"/>`,
  copy: `<rect x="5.5" y="5.5" width="8" height="8"/><path d="M10.5 5.5L10.5 2.5L2.5 2.5L2.5 10.5L5.5 10.5"/>`,
  up: `<path d="M8 13L8 3M4 7L8 3L12 7"/>`,
  down: `<path d="M8 3L8 13M4 9L8 13L12 9"/>`,
  duplicate: `<rect x="5.5" y="5.5" width="8" height="8"/><path d="M10.5 5.5L10.5 2.5L2.5 2.5L2.5 10.5L5.5 10.5"/>`,
  delete: `<path d="M3 4.5L13 4.5M6.5 4.5L6.5 2.5L9.5 2.5L9.5 4.5M4.5 4.5L5.2 13.5L10.8 13.5L11.5 4.5"/>`,
  grip: `<path d="M5.5 4L5.5 4.01M10.5 4L10.5 4.01M5.5 8L5.5 8.01M10.5 8L10.5 8.01M5.5 12L5.5 12.01M10.5 12L10.5 12.01" stroke-width="2"/>`,
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
const VALUE_PICS = {                               // a value button's drawing, on a 40 × 40 field with the centre at 0 0. Its first circle is the button's own disc
  radius: `<circle r="19.4"/><path d="M0 0L19.4 0"/><circle class="pivot" r="2"/>`,     // a radius, from the centre to the edge
  // scale: a small circle growing into the large one, joined by their two tangents. Okay's drawing (Asset_1.svg, 13 Oct
  // 2026: circles at 8.48 20.93 r 8.11 and 24.29 14.71 r 14.33), whole inside the button's own square (Okay, 13 Oct:
  // "shrink scale icon for better h-spacing"): the drawing's middle (19.5 14.71) is the button's.
  size: `<circle cx="4.79" r="14.33"/><circle class="small" cx="-11.02" cy="6.22" r="8.11"/><path d="M-16.55 0.3L-4.99 -10.48M-10.77 14.33L4.79 14.33"/>`,
};

// a language in the list, by its name; on its button, by two letters ("zh-Hans" → ZH; the font's own choice → a dash)
const LANG_NAMES = { default: "As the font sets it", tr: "Turkish", nl: "Dutch", de: "German", pl: "Polish", ro: "Romanian", ca: "Catalan", ar: "Arabic", fa: "Persian", "zh-Hans": "Chinese, simplified", ja: "Japanese" };
const lang_short = (code) => (code === "default" ? "–" : code.slice(0, 2).toUpperCase());

// a tile's word is one line: a name too long for a tile is said shorter there (its tag still says it whole)
const TILE_WORDS = { "moon phase": "moon", "radial, auto-flip": "auto-flip" };

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
    chk("ui_scale", "Scale everything with it", { nest: true }),      // nest: a question about the row above starts on the controls' column (Okay, 12 Oct 2026)
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
    num("size", "Size", 0.3, 8, 0.05, { show: numerals_only }),
    hdr("Band", { show: kind_in("band") }),
    num("width", "Band width", 0.02, 25, 0.05, { show: kind_in("band") }),
    num("fill", "Fill % of step", 1, 100, 1, { show: kind_in("band") }),
    hdr("Nudge one numeral", { show: numerals_only }),
    custom("nudge", { show: numerals_only }),
    hdr("Type", { show: numerals_only }),
    custom("font", { show: numerals_only }),
    hdr("Variable axes", { show: (R) => numerals_only(R) && G.has_font(R.ps) && Object.keys(G.font_axes(G.font_of(R))).length > 0 }),
    custom("axes", { show: numerals_only }),
    hdr("OpenType features", { show: (R) => numerals_only(R) && G.has_font(R.ps) }),
    custom("features", { show: numerals_only }),
  ],
  Hands: [
    custom("hands_bar", { pin: true, bar: true }),      // bar: one line of its own, always in view: All hands · Show hands · Motion
    custom("hand_tabs", { pin: true, bar: true }),      // under it, always in view: which hand the panes below are about (Okay, 12 Oct 2026: "acts as a tab system for what's below")
    hdr("One hand", { title: (S) => HAND_NAMES[S.ui_hand] }),      // its heading says which: Hour hand · Minute hand · Seconds hand
    chk("on", "Show this hand", { ...H, head: true }),      // on the heading line, beside the hand's name
    pick("shape", "Shape", G.HAND_SHAPES.slice(0, 9), hand_pic, { ...H, detail: hand_detail }),      // detail: under the label, the chosen hand itself, large (Okay's drawing, 13 Oct 2026: "reproduce selected hand in detail")
    col("c", "Colour", H),
    hdr("Size", H),
    num("len", "Length", 0.5, 30, 0.05, H),
    num("w", "Width", 0.02, 4, 0.01, H),
    num("tail", "Tail", 0, 10, 0.05, H),
    hdr("Details", H),
    num("round", "Round ends", 0, 2, 0.01, { ...H, show: hand_is("baton", "pencil", "sword", "arrow", "syringe", "breguet", "lollipop", "file") }),
    num("tip", "Tip length", 0, 10, 0.05, { ...H, show: hand_is("pencil", "sword", "arrow", "syringe", "breguet") }),
    num("feature", "Head width", 0, 6, 0.05, { ...H, show: hand_is("arrow", "syringe") }),
    num("feature", "Ring · disc Ø", 0, 6, 0.05, { ...H, show: hand_is("breguet", "lollipop") }),
    num("feature_at", "Widest at %", 0, 100, 1, { ...H, show: hand_is("dauphine") }),
    num("feature_at", "Barrel from %", 0, 100, 1, { ...H, show: hand_is("syringe") }),
    num("feature_at", "Ring · disc at %", 0, 100, 1, { ...H, show: hand_is("breguet", "lollipop") }),
    num("counter", "Counterweight Ø", 0, 4, 0.05, H),
    num("wall", "Hollow wall", 0, 1, 0.01, H),
    hdr("Cap"),                                    // after the hand's own panes: it belongs to all three
    num("ha_cap", "Cap Ø", 0, 4, 0.05),
    col("c_cap", "Colour"),
  ],
  Date: [                                          // "Windows" on its tab: up to four holes in the plate
    custom("window_cards", { pin: true, bar: true }),      // pin: always in view, like the hand tabs (Okay, 13 Oct 2026) ·         // four cards, 12 · 3 · 6 · 9: where each window is, and tabs for the panes below (Okay, 12 Oct 2026)
    // the cards are tabs only; a window is shown by the tick on its heading line (Okay, 13 Oct 2026, after trying a
    // small switch on each card: "unnecessarily complex… enable window tickmark is the way to go. leave them as tabs")
    hdr("Window", { title: (S) => `Window at ${G.DATE_AT[G.windows_of(S)[S.ui_window].at][0]}` }),
    chk("on", "Show this window", { ...W, head: true }),
    // where it is and how big come first, right under the tick (Okay, 13 Oct 2026); a pane of their own, Place and size, until beta 4.22
    pop("at", "Position", G.DATE_AT.map((d) => d[0]), { ...W, show: win_on }),
    num("r", "Radius", 2, 18, 0.05, { ...W, show: win_on }),
    num("w", "Width", 0.5, 8, 0.05, { ...W, show: shape_is("rectangle", "arch", "arc") }),
    num("w", "Ø", 0.5, 8, 0.05, { ...W, show: shape_is("circle", "polygon") }),
    num("h", "Height", 0.5, 5, 0.05, { ...W, show: shape_is("rectangle", "arc") }),
    pick("kind", "Shows", G.WINDOW_KINDS, PICS.window, { ...W, show: win_on }),
    txt("text", "Text", { ...W, show: win_is("date", "day") }),
    num("size", "Text % of height", 20, 100, 1, { ...W, show: win_is("date", "day") }),
    custom("font", { ...W, show: win_is("date", "day") }),      // its own font, or the top numerals ring's (the start)
    info("Follows the time shown: AM · PM beside the time, under the panel.", { ...W, show: win_is("am · pm") }),
    num("age", "Moon age, days", 0, 29.5, 0.1, { ...W, show: win_is("moon phase") }),
    info("0 new moon · 14.8 full.", { ...W, show: win_is("moon phase") }),
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
    hdr("Colours", { ...W, show: win_on }),
    col("text_c", "Text · picture", { ...W, show: win_on, or: (T) => T.ink }),       // or: what an unset colour is
    col("disc_c", "Disc under it", { ...W, show: win_on, or: () => [1, 1, 1, 1] }),
    col("ink", "Frame", { ...W, show: win_on }),
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
const SPEEDS = [[1, "Real time"], [60, "A minute every second"], [720, "An hour every five seconds: twelve hours in a minute"]];
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
const LENGTH_KEYS = { ring: G.RING_MM, hand: G.HAND_MM, window: G.WINDOW_MM, global: ["dial_d", "margin", "ha_cap"] };
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
      document.addEventListener("pointerover", (e) => { const t = tipped(e); if (window.dial_tool) { if (t && e.pointerType !== "touch") window.dial_tool.tag_show(t); else window.dial_tool.tag_hide(); } });
      document.addEventListener("focusin", (e) => { const t = tipped(e); if (t && window.dial_tool && t.matches(":focus-visible")) window.dial_tool.tag_show(t); });
      document.addEventListener("focusout", () => { if (window.dial_tool) window.dial_tool.tag_hide(); });
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
    if (this.unit_open && !$("#unit-menu").hidden && !on(".unit")) this.unit_open(false);
    if (this.lang_open && $("#lang-menu") && !$("#lang-menu").hidden && !on(".langs")) this.lang_open(false);
    if (this.add_open && $("#add-menu") && !$("#add-menu").hidden && !on(".adder")) this.add_open(false);
    if (this.value_pop && !on("#value-pop") && !on(".valueb")) this.value_pop_close();
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
      el("header", {}, el("div", { className: "title" }, el("h1", { textContent: "Dial Tool" }), el("span", { className: "quiet", textContent: G.VERSION })), this.unit_box()),
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
    const time_box = el("span", { className: "timebox" }, this.time_field, this.half_button);
    this.time_slider = el("input", { id: "time-slider", type: "range", min: 0, max: 43199, step: 1 });
    this.time_slider.oninput = () => this.set_time(+this.time_slider.value + this.half());
    this.play_button = el("button", { type: "button", className: "icon", id: "play", onclick: () => this.play(!this.playing) });
    this.status = el("div", { className: "status" });
    const side = el("button", { type: "button", className: "icon side", id: "panel-toggle", title: "Hide or show the settings", ariaLabel: "Hide or show the settings", onclick: () => this.show_panel(root.classList.contains("nopanel")) });
    side.innerHTML = icon(TOOL_ICONS.panel);
    // the bar, in three parts: what is selected · time (play, how fast, the time, the slider, now) · view (zoom out, in, fit)
    this.speed = 1;
    this.speeds = el("span", { className: "segs speeds", role: "radiogroup", ariaLabel: "How fast time runs" });
    for (const [k, title] of SPEEDS) {
      const b = el("button", { type: "button", id: "speed-" + k, textContent: k + "×", title, onclick: () => this.set_speed(k) });
      b.setAttribute("role", "radio");
      this.speeds.append(b);
    }
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
      el("div", { className: "lead" }, side, this.play_button, this.speeds, time_box,
        el("button", { type: "button", id: "now", textContent: "Now", title: "The time it is now", onclick: () => { const d = new Date(); this.set_time(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000); } })),
      el("div", { className: "group day" }, this.ruler, this.time_slider, steps),
      el("div", { className: "group viewing" }, this.status,
        el("span", { className: "zooms" },
          view("zoom-out", "Zoom out", `<path d="M3.5 8L12.5 8"/>`, () => { this.zoom(1 / 1.4, middle()); this.render(); }),
          view("zoom-in", "Zoom in", `<path d="M3.5 8L12.5 8M8 3.5L8 12.5"/>`, () => { this.zoom(1.4, middle()); this.render(); })),
        el("button", { type: "button", id: "fit", textContent: "Fit", title: "Show the whole page", onclick: () => { this.fit(); this.render(); } })));
    this.set_speed(1);
    const guides = this.guides_box();
    // on the preview: undo · redo top left, beside the panel (Okay, 13 Oct 2026) · the Guides switch top right · Backdrop bottom left
    this.main = el("main", {}, this.svg, this.tip, this.undo_box(), guides, this.backdrop_box());
    root.append(panel, this.main, bar, this.build_picker(), this.build_pop());
    this.play_icon();
    let shown = true;
    try { shown = localStorage.getItem("dial-tool-panel") !== "off"; } catch (e) { /* not kept */ }
    if (!shown) this.show_panel(false);
    this.watchers.push(new ResizeObserver(() => this.resized()));
    this.watchers.at(-1).observe(this.svg);
  }

  /** the whole panel, away or back: the dial gets the window. Remembered by this browser. */
  show_panel(on) {
    $("#app").classList.toggle("nopanel", !on);
    $("#panel-toggle").setAttribute("aria-pressed", String(!on));
    try { localStorage.setItem("dial-tool-panel", on ? "on" : "off"); } catch (e) { /* not kept */ }
  }

  // ── units ────────────────────────────────────────────────
  //   Lengths are kept in mm (R1). The box at the panel's top right chooses the unit they are shown and typed in;
  //   it says the unit's short name and keeps its size. Its menu: the units by their full names.

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
    const box = el("button", { type: "button", className: "backdropbox", id: "backdrop", title: "The backdrop’s colour (preview only)" }, dot, el("span", { textContent: "Backdrop" }));
    box.setAttribute("aria-expanded", "false");
    box.onclick = () => this.pop_open({ read: () => this.S.c_backdrop, write: (v) => this.set_value("global", "c_backdrop", v), label: () => "Backdrop" }, box);
    this.backdrop_dot = dot;
    return box;
  }

  /** guides, at the preview's top right (Okay, 12 Oct 2026): a switch (a bullseye and the word; solid outline = on,
   *  dashed = off) and, joined to it, an arrow that drops their list: the five kinds of guide, each with an eye and
   *  one of eight colours; one thickness; Reset. No free colours here. */
  guides_box() {
    this.guides_tick = el("button", { type: "button", className: "guidesbox", id: "guides", onclick: () => this.set_value("global", "guides", !this.S.guides) });
    this.guides_tick.innerHTML = icon(`<circle r="5.6"/><circle r="2.1"/><path d="M0 -8.6L0 -3.6M0 3.6L0 8.6M-8.6 0L-3.6 0M3.6 0L8.6 0"/><path class="slash" d="M-7.4 7.4L7.4 -7.4"/>`, 18, "-9 -9 18 18");
    const word = el("span", { className: "word", textContent: "Guides" });
    word.dataset.text = "Guides";
    this.guides_tick.append(word);
    const list = el("div", { className: "guidelist night", id: "guide-list", hidden: true });
    const more = el("button", { type: "button", className: "guidesmore", id: "guides-more", title: "Which guides, and their colours", ariaLabel: "Which guides, and their colours" });
    more.innerHTML = icon(`<path d="M4 6.5L8 10.5L12 6.5"/>`);
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
      none.innerHTML = icon(`<circle cx="8" cy="8" r="6.3"/><path d="M3.6 3.6L12.4 12.4"/>`);
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
        gone.innerHTML = icon(`<path d="M4 4L12 12M12 4L4 12"/>`);
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

  /** every row: hidden if it doesn't apply (R16); its controls showing the scope's value. A pane hides its rows
   *  when it is folded, and everything in it when its heading doesn't apply. */
  sync_rows() {
    this.sync_guides();
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
    const wrap = el("div", { className: "row " + row.kind + (row.nest ? " nest" : "") });
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
      let typing = false;                          // the field follows every change, except while you type in it
      slider.oninput = () => commit(+slider.value);
      field.oninput = () => { typing = true; };
      field.onblur = () => { typing = false; out.refresh(this.target(row.scope)); };
      field.onchange = () => { typing = false; commit(parse_number(field.value, this.target(row.scope)[row.key] * per()) / per()); out.refresh(this.target(row.scope)); };
      field.onkeydown = (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); commit(this.target(row.scope)[row.key] + (e.key === "ArrowUp" ? 1 : -1) * row.step * (e.shiftKey ? 10 : 1)); }
      };
      const step = (dir) => el("button", { type: "button", className: "step", textContent: dir > 0 ? "+" : "−", tabIndex: -1, onclick: () => commit(this.target(row.scope)[row.key] + dir * row.step) });
      const label = el("label", { htmlFor: id, textContent: row.text });
      let lead = label, menu = null;
      if (row.button) lead = el("button", { type: "button", className: "btn main", id: "export-" + row.button, textContent: row.button.toUpperCase(), title: `Export a ${row.button.toUpperCase()} at this dpi`, onclick: () => this.export(row.button) });
      if (row.menu) {                              // label · a small boxed arrow: the browser's own menu lies over the arrow, unseen
        menu = el("select", { id: id + "-" + row.menu.key, title: row.menu.title, ariaLabel: row.menu.title });
        for (const [v, name] of row.menu.items) menu.append(el("option", { value: v, textContent: name }));
        menu.onchange = () => this.set_value(row.scope, row.menu.key, +menu.value);
        const arrow = el("span", { className: "labelmenu" }, menu);
        arrow.insertAdjacentHTML("afterbegin", icon(`<path d="M4.5 6.5L8 10L11.5 6.5"/>`, 12));
        lead = el("span", { className: "menulabel" }, label, arrow);
      }
      if (row.button) { slider.ariaLabel = field.ariaLabel = row.text; field.title = row.text + " · " + field.title; }
      if (row.bare) { label.textContent = ""; label.className = "blank"; slider.ariaLabel = field.ariaLabel = row.text; field.title = row.text + " · " + field.title; }
      wrap.append(lead, slider, field, el("span", { className: "steps" }, step(-1), step(1)));
      out.refresh = (T) => {
        const v = T[row.key] ?? 0;
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
        const tile = el("button", { type: "button", className: "pickt", id: `${id}-${i}`, title: name, onclick: () => set(i) });
        tile.setAttribute("role", "radio");
        tile.innerHTML = typeof row.pics === "function" ? row.pics(i) : pic(row.pics[i]);
        tile.append(el("span", { textContent: TILE_WORDS[name] || name }));
        group.append(tile);
      });
      const label = el("label", { textContent: row.text, className: row.label ? "strong" : "" });
      const detail = row.detail ? el("span", { className: "detail", id: id + "-detail" }) : null;      // a box under the label, as high as the tiles: what is chosen, as it is now
      wrap.append(detail ? el("span", { className: "pickside" }, label, detail) : label, group);
      let drawn = "";
      out.refresh = (T) => {
        if (detail) { const now = row.detail(T); if (now !== drawn) { drawn = now; detail.innerHTML = now; } }
        if (row.label) label.textContent = row.label(T);
        [...group.children].forEach((b, i) => { b.classList.toggle("on", i === T[row.key]); b.setAttribute("aria-checked", String(i === T[row.key])); });
      };
    }

    if (row.kind === "seg") {
      const group = el("span", { className: "segs" });
      row.items.forEach((name, i) => group.append(el("button", { type: "button", textContent: name, onclick: () => { set(i); if (row.key.startsWith("ui_")) this.sync_rows(); } })));
      wrap.append(el("label", { textContent: row.text }), group);
      out.refresh = (T) => [...group.children].forEach((b, i) => b.classList.toggle("on", i === T[row.key]));
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
      const field = el("input", { type: "text", id, className: "wide" });
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
    wide.innerHTML = icon(`<rect x="2.5" y="2.5" width="11" height="11"/><path d="M6 10L10 6M7 6L10 6L10 9"/>`);
    const shut = el("button", { type: "button", className: "sign", id: "pop-close", title: "Close", ariaLabel: "Close", onclick: () => this.pop_close() });
    shut.innerHTML = icon(`<path d="M4 4L12 12M12 4L4 12"/>`);
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
      alpha: row.scope === "ring",                 // only a ring can be see-through (Okay, 12 Oct 2026)
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
      const b = el("button", { type: "button", id: "window-card-" + c.slot, onclick: () => {
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
        const [place, angle] = G.DATE_AT[at], a = angle * Math.PI / 180;
        const x = 9.3 * Math.sin(a), y = -9.3 * Math.cos(a), state = `${at}/${Boolean(w.on)}`;
        if (c.drawn !== state) {
          c.drawn = state;
          c.pic.innerHTML = icon(`<circle r="15" stroke-width="1.1"/><rect x="${(x - 3.6).toFixed(2)}" y="${(y - 2.8).toFixed(2)}" width="7.2" height="5.6" rx="1.2" stroke-width="1.1"${w.on ? ' fill="currentColor"' : ""}/>`, 34, "-17 -17 34 34");
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
      const b = el("button", { type: "button", id: "hand-tab-" + i, textContent: name, onclick: () => this.set_value("global", "ui_hand", i) });
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
    plus.innerHTML = icon(`<path d="M8 3L8 13M3 8L13 8"/>`);
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
      b.innerHTML = icon(TOOL_ICONS[action]);
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
    b.innerHTML = `<svg viewBox="-20 -20 40 40" aria-hidden="true">${drawing}</svg>`;
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
      const show = el("button", { type: "button", className: "eye", title: ring.on ? "Hide this ring" : "Show this ring", ariaLabel: `Show ${ring.name}`, onclick: (e) => { e.stopPropagation(); this.S.ui_ring = i; this.set_value("ring", "on", !ring.on); } });
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

  /** "1234567890" in the font itself: the outline made with the list, or drawn now, or set by the browser. */
  sample(f) {
    const box = el("span", { className: "sample" });
    let s = f.sample;
    if (!s && G.has_font(f.ps)) {
      const t = { ...G.RING_BASE, ps: f.ps, axes: f.start || {}, features: {} };
      s = { d: G.text_path("1234567890", t, 1000).svg(0, true), w: Math.round(G.advance("1234567890", t, 1000)) };
    }
    if (s) box.innerHTML = `<svg viewBox="0 -800 ${s.w} 1000" height="22" aria-hidden="true"><path d="${s.d}" fill="currentColor"/></svg>`;
    else { box.textContent = "1234567890"; box.style.fontFamily = `"${f.family}"`; }       // an installed font: the browser can show it
    return box;
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
    const lang = own ? null : this.lang_box();
    const tracking = own ? null : this.build_row({ ...num("tracking", "Tracking", -200, 800, 5), scope: "ring" });      // the box's last line (Okay, 13 Oct 2026); a window has no tracking of its own
    const named = el("div", { className: "fontname" }, name, ...(lang ? [lang.el] : []), el("button", { type: "button", className: "btn", id: pre + "font-change", textContent: "Change…", onclick: open }));
    const styles = el("div", { className: "segs styles" });
    const state = el("div", { className: "quiet note", id: pre + "font-note" });
    const back = el("button", { type: "button", className: "btn", id: "window-font-back", textContent: "As the numerals", title: "Use the top numerals ring’s font again", hidden: true,
      onclick: () => { const w = this.window(); w.family = ""; w.ps = ""; w.axes = {}; this.changed(true); } });
    wrap.append(el("div", { className: "fontbox" }, current, named, styles, ...(tracking ? [tracking.el] : [])), ...(own ? [back] : []), state);
    let shown = null;
    out.refresh = (T) => {
      const R = own ? G.window_type(this.S, T) : T;
      back.hidden = !(own && T.ps);
      if (lang) lang.refresh(T);
      if (tracking) tracking.refresh(T);
      const mine = this.families().get(R.family) || [], f = this.catalog.get(R.ps) || mine[0];
      const key = R.ps + "/" + G.has_font(R.ps) + "/" + Boolean(T.ps);
      if (key !== shown) {
        shown = key;
        current.replaceChildren(f ? this.sample(f) : el("span", { className: "sample quiet", textContent: "not loaded" }));
        name.textContent = own && !T.ps ? `${R.family} · as the numerals` : R.family;
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

  /** the language the numerals are set in (a font may draw a figure differently for one): a small button saying its
   *  two letters; a press opens the list (Okay, 13 Oct 2026). The ring keeps the place in G.LANGS (R9). */
  lang_box() {
    const menu = el("div", { className: "unitmenu", id: "lang-menu", hidden: true });
    menu.setAttribute("role", "menu");
    const button = el("button", { type: "button", className: "btn langbox", id: "lang" });
    button.setAttribute("aria-haspopup", "menu");
    const open = (on) => { menu.hidden = !on; button.setAttribute("aria-expanded", String(on)); };
    this.lang_open = open;
    button.onclick = () => open(menu.hidden);
    const items = G.LANGS.map((code, i) => {
      const b = el("button", { type: "button", id: "lang-" + code, onclick: () => { open(false); this.set_value("ring", "lang", i); } },
        el("span", { textContent: LANG_NAMES[code] || code }), el("span", { className: "quiet", textContent: lang_short(code) }));
      b.setAttribute("role", "menuitemradio");
      menu.append(b);
      return b;
    });
    const box = el("div", { className: "langs" }, button, menu);
    box.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); button.focus(); } };
    open(false);
    const refresh = (R) => {
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
    const find = el("input", { type: "text", id: "font-find", placeholder: "Find a font" });
    find.oninput = () => this.fill_picker(true);
    const list = el("div", { className: "fontlist", id: "font-list" });
    const paste = el("input", { type: "text", id: "font-link", placeholder: "Google Fonts link or family name, or a link to a font file" });
    const add = () => { if (paste.value.trim()) this.add_from_text(paste.value).then((ok) => { if (ok) paste.value = ""; }); };
    paste.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } };
    const file = el("input", { type: "file", accept: ".ttf,.otf,.ttc,.otc", multiple: true, hidden: true, id: "font-file" });
    file.onchange = async () => { await this.add_font_files([...file.files]); file.value = ""; };
    this.picker = el("dialog", { className: "picker", id: "font-picker" },
      el("header", {}, el("h2", { textContent: "Fonts" }), el("button", { type: "button", className: "btn main", id: "font-done", textContent: "Done", onclick: () => this.picker.close() })),
      find, list,
      el("div", { className: "adding" },
        el("h2", { textContent: "Add fonts" }),
        el("div", { className: "pasting" }, paste, el("button", { type: "button", className: "btn", id: "font-add", textContent: "Add", onclick: add })),
        el("div", { className: "tools" },
          el("button", { type: "button", className: "btn", textContent: "Font file…", onclick: () => file.click() }),
          el("button", { type: "button", className: "btn", id: "local-fonts", textContent: "Installed fonts", hidden: !("queryLocalFonts" in window), onclick: () => this.local_fonts(true) }), file),
        el("div", { className: "quiet note", id: "picker-note" })));
    this.picker.addEventListener("click", (e) => { if (e.target === this.picker) this.picker.close(); });      // a click outside closes it
    return this.picker;
  }

  open_picker() {
    $("#font-find").value = "";
    this.fill_picker(true);
    if (!this.picker.open) this.picker.showModal();
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
        const row = el("button", { type: "button", className: "fontrow", title: f.what ? `${family} · ${f.what}` : family, onclick: () => { this.font_note = ""; this.use_font(f); } },
          this.sample(f), el("span", { className: "name", textContent: family }));
        row.dataset.family = family;
        row.dataset.group = f.group;
        list.append(row);
      }
      const on = list.querySelector(`.fontrow[data-family="${CSS.escape(R.family)}"]`);
      if (on && again) list.scrollTop = Math.max(0, on.offsetTop - list.offsetTop - 80);
    }
    for (const row of list.querySelectorAll(".fontrow")) row.classList.toggle("on", row.dataset.family === R.family);
    $("#picker-note").textContent = this.font_note || "";
  }

  /** a variable font's axes, one slider each. */
  row_axes(wrap, out) {
    wrap.className = "axes";
    let shown = null;
    out.refresh = (R) => {
      const font = G.has_font(R.ps) ? G.font_of(R) : null;
      const axes = font ? G.font_axes(font) : {};
      const key = R.ps + JSON.stringify(Object.keys(axes)) + this.S.ui_ring;
      if (key !== shown) {
        shown = key;
        wrap.replaceChildren();
        for (const tag in axes) {
          const a = axes[tag], id = "axis-" + tag;
          const slider = el("input", { type: "range", min: a.min, max: a.max, step: (a.max - a.min) / 1000, id: id + "-slider" });
          const field = el("input", { type: "text", id, inputMode: "decimal" });
          const commit = (v) => {
            const all = { ...this.ring().axes };
            v = clamp(+(+v).toFixed(2), a.min, a.max);
            if (Math.abs(v - a.default) < 1e-6) delete all[tag]; else all[tag] = v;
            this.set_value("ring", "axes", all);
          };
          slider.oninput = () => commit(slider.value);
          field.onchange = () => commit(parse_number(field.value, this.ring().axes[tag] ?? a.default));
          slider.dataset.tag = field.dataset.tag = tag;
          wrap.append(el("div", { className: "row num" }, el("label", { htmlFor: id, textContent: `${a.name} · ${tag}` }), slider, field, el("span")));
        }
      }
      for (const input of wrap.querySelectorAll("input")) {
        const a = axes[input.dataset.tag];
        if (a && document.activeElement !== input) input.value = input.type === "range" ? (R.axes[input.dataset.tag] ?? a.default) : fmt(R.axes[input.dataset.tag] ?? a.default, 0.1);
        if (input.type === "range") filled(input);
      }
    };
  }

  /** the font's OpenType features. Only what differs from the font's default is stored (R12). */
  row_features(wrap, out) {
    wrap.className = "features";
    let shown = null;
    out.refresh = (R) => {
      const font = G.has_font(R.ps) ? G.font_of(R) : null;
      const key = (font ? font.ps : "") + this.S.ui_ring;
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
          const tile = el("button", { type: "button", className: "tile", id: "feature-" + tag }, el("span", { textContent: designer || FEATURE_NAMES[tag] || tag }), el("small", { textContent: tag }));
          tile.dataset.tag = tag;
          tile.onclick = () => {                     // press to switch; only what differs from the font's default is stored (R12)
            const on = tile.getAttribute("aria-pressed") !== "true", all = { ...this.ring().features };
            if (on === DEFAULT_ON.has(tag)) delete all[tag]; else all[tag] = on;
            this.set_value("ring", "features", all);
          };
          groups[/^ss\d\d$/.test(tag) ? 1 : /^cv\d\d$/.test(tag) ? 2 : 0][1].push(tile);
        }
        groups[0][1].sort((x, y) => x.firstChild.textContent.localeCompare(y.firstChild.textContent));
        for (const [title, tiles] of groups) {
          if (!tiles.length) continue;
          if (title) wrap.append(el("h3", { textContent: title }));
          wrap.append(el("div", { className: "tiles" }, ...tiles));
        }
        if (!wrap.children.length && font) wrap.append(el("span", { className: "quiet", textContent: "This font has no switches." }));
      }
      for (const tile of wrap.querySelectorAll(".tile")) tile.setAttribute("aria-pressed", String(R.features[tile.dataset.tag] ?? DEFAULT_ON.has(tile.dataset.tag)));
    };
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
    let down = null;
    this.svg.addEventListener("pointerdown", (e) => { down = { p: at(e), c: this.c.slice(), moved: false }; this.svg.setPointerCapture(e.pointerId); });
    this.svg.addEventListener("pointermove", (e) => {
      if (!down) return e.pointerType === "mouse" ? this.hover(at(e), document.elementFromPoint(e.clientX, e.clientY)) : null;
      const p = at(e);
      if (Math.hypot(p[0] - down.p[0], p[1] - down.p[1]) > 4) down.moved = true;
      if (down.moved) { this.hover(null); this.fitted = false; this.c = [down.c[0] + p[0] - down.p[0], down.c[1] + p[1] - down.p[1]]; this.place(); }
    });
    this.svg.addEventListener("pointerup", (e) => {
      if (down && !down.moved) this.clicked(at(e), document.elementFromPoint(e.clientX, e.clientY));
      down = null;
    });
    this.svg.addEventListener("pointerleave", () => this.hover(null));
    let pinch = 1;                                 // Safari reports a pinch as gesture events
    this.svg.addEventListener("gesturestart", (e) => { e.preventDefault(); pinch = 1; });
    this.svg.addEventListener("gesturechange", (e) => { e.preventDefault(); this.zoom(e.scale / pinch, at(e)); pinch = e.scale; });
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
    [...this.speeds.children].forEach((b) => { const on = b.id === "speed-" + k; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); });
  }

  play(on) {
    this.playing = on;
    this.play_from = [performance.now(), this.S.t];
    this.play_icon();
    this.render();
  }

  /** the button shows what a press will do: a triangle to play, two bars to pause. */
  play_icon() {
    const shape = this.playing ? '<rect x="3" y="2" width="3.5" height="12"/><rect x="9.5" y="2" width="3.5" height="12"/>' : '<path d="M4 2 L14 8 L4 14 Z"/>';
    this.play_button.innerHTML = `<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="currentColor">${shape}</svg>`;
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
    const make = (id, title, way, d) => { const b = el("button", { type: "button", className: "undobox", id, title, ariaLabel: title, onclick: () => this.undo(way) }); b.innerHTML = icon(d); return b; };
    this.undo_buttons = [make("undo", "Undo (⌘Z)", -1, `<path d="M3 6.5H10A3.5 3.5 0 0 1 10 13.5H6M6 3.5L3 6.5L6 9.5"/>`), make("redo", "Redo (⇧⌘Z)", 1, `<path d="M13 6.5H6A3.5 3.5 0 0 0 6 13.5H10M10 3.5L13 6.5L10 9.5"/>`)];
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
