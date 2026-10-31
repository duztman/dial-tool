// rows.js — the rows of every section as data (ROWS), as in dial.py: a row is {kind, key, text, …} made by num, pop,
// seg, pick, chk, col, txt, hdr, info, custom. panel.js's build_row turns one into controls. Which rows apply when is
// `show`; what a pane's heading says when folded is `summary`.

import * as G from "./geometry.js";
import { sheet_layout, PAPERS } from "./output.js";
import { tilePicture } from "./watch.js";
import * as SHOW from "./show.js";      // show mode: the watch round the dial, its tabs, its export (#509)
import { GIF_FPS_MOST, GIF_MOST, el, fmt, is_day, label_of, moon_look, nato_stripe } from "./ui.js";
import { CURVE, LINE, PICS, SIGNS, SLANT, hand_pic, icon, sw } from "./icons.js";
import { instances_read } from "./session.js";

// every setting's name as its row says it, so an undo step can be named by what it changed (#172): scope:key → words.
// A row whose scope is set later (ROWS: a section's own) is named again under it below, where ROWS is read
export const NAMED = new Map();

export const name_row = (row) => { if (row.key && row.text && typeof row.text === "string") { const at = `${row.scope || "*"}:${row.key}`; if (!NAMED.has(at)) NAMED.set(at, row.text); } return row; };

export const num = (key, text, lo, hi, step, o = {}) => name_row({ kind: "num", key, text, lo, hi, step, ...o });

export const pop = (key, text, items, o = {}) => name_row({ kind: "pop", key, text, items, ...o });

export const seg = (key, text, items, o = {}) => name_row({ kind: "seg", key, text, items, ...o });

export const pick = (key, text, items, pics, o = {}) => name_row({ kind: "pick", key, text, items, pics, ...o });      // a choice shown as pictures

export const chk = (key, text, o = {}) => name_row({ kind: "chk", key, text, ...o });

export const col = (key, text, o = {}) => name_row({ kind: "col", key, text, ...o });

export const txt = (key, text, o = {}) => name_row({ kind: "txt", key, text, ...o });

export const hdr = (text, o = {}) => ({ kind: "hdr", text, ...o });

/** the small boxed arrow that opens a menu: the browser's own menu lies over it, unseen — beside a row's label, and in
 *  Resize Ring from's box (#419): one drawing for both (R34) */
export const menu_arrow = (select) => { const arrow = el("span", { className: "labelmenu" }, select); arrow.insertAdjacentHTML("afterbegin", icon(`<path d="M3.25 4.75L6.25 7.75L9.25 4.75" ${sw(SLANT)}/>`, 12)); return arrow; };

export const info = (text, o = {}) => ({ kind: "note", text, ...o });

/** a menu as a chevron box (R15; Okay, 20 Oct 2026, 01:05: "apply universal style to 'arabic like' drop downs"): the
 *  value's box saying the choice, a ⌄ box beside it, the menu unseen over both, so a press anywhere on it opens the list.
 *  words: a choice in words, set from the left (a number sits at the right). → { box, sync } — sync after the value moves */
export const chevron_box = (select, words = true) => {
  const shown = el("span", { className: "v" }), arrow = el("span", { className: "arrow" });
  arrow.innerHTML = icon(SIGNS.down);
  const box = el("span", { className: "menubox" + (words ? " words" : "") }, shown, arrow, select);
  const sync = () => { const o = select.options[select.selectedIndex]; shown.textContent = o ? o.textContent : ""; };
  select.addEventListener("change", sync);
  return { box, sync };
};

/** the rings a mono print mask loses (G.mask_merges), worked out once per build of the dial's still parts. It takes
 *  up to 200 ms on a busy dial (measured 19 Oct 2026: World time 195), so it waits until the dial has been still for
 *  MERGE_WAIT, then the panel is synced again; meanwhile the last answer stands */
export const MERGES = new WeakMap(), MERGE_WAIT = 400;

export const merges_of = (app) => {
  const st = app && app.statik;
  if (!st) return [];
  if (MERGES.has(st)) return (app.merges_last = MERGES.get(st));
  clearTimeout(app.merge_wait);
  app.merge_wait = setTimeout(() => { if (app.statik === st) { MERGES.set(st, G.mask_merges(st)); app.sync_rows(); } }, MERGE_WAIT);
  return app.merges_last || [];
};

/** …said in words: which ring vanishes into which, and the two ways out */
export const mask_says = (merges) => {
  if (!merges.length) return "";
  const pairs = merges.slice(0, 3).map((m) => `${m.top} on ${m.under}`).join(" · ") + (merges.length > 3 ? ` · ${merges.length - 3} more` : "");
  return `Lost in one ink: ${pairs}. Knock them out of the ring below (Give way to rings above), or export each ink alone.`;
};

export const custom = (name, o = {}) => ({ kind: "custom", name, ...o });

// a ring's radius as a number row: what the radius button's pop-up shows, and the Resize pane's row. A numeral's
// radius can measure to its centre, its baseline or its top: the small menu beside the label, in the order Okay wrote
// them; what is stored is the place in G.ANCHORS (R9). A mark's or a band's (#257, "resize from"), to its
// outer end (as always), its middle or its inner end: the same menu, a place in G.FROM.
export const RADIUS_ROWS = {
  outer: num("r", "Outer radius", 0, 25, 0.05, { scope: "ring", menu: { key: "from", title: "What the radius measures to", items: [[0, "Outer"], [1, "Middle"], [2, "Inner"]] } }),
  numerals: num("r", "Middle radius", 0, 25, 0.05, { scope: "ring", menu: { key: "anchor", title: "What the radius measures to", items: [[3, "Outer"], [0, "Middle"], [4, "Inner"]] } }),      // the band's circle that holds still as the size changes (#488), as a ticks ring's ends
};

export const radius_row = (R) => RADIUS_ROWS[G.has_text(R) ? "numerals" : "outer"];

// how big one thing of a ring is — its "inner" size, the number in the ring summary: a mark's length (a dot's Ø), a
// numeral's size, a band's width. As a number row: what the size button's pop-up shows (Okay, 13 Oct 2026).
export const SIZE_ROWS = {
  len: num("len", "Length", 0.05, 10, 0.05, { scope: "ring" }), dot: num("w", "Ø", 0.02, 5, 0.01, { scope: "ring" }),
  // a numeral's Size: its slider runs to the dial's diameter (Okay, 24 Oct 2026: "main numerals could grow up to 500-600"; asked, "Dial's diameter")
  numerals: num("size", "Size", 0.3, 8, 0.05, { scope: "ring", top: (S) => S.dial_d }), band: num("width", "Band width", 0.02, 25, 0.05, { scope: "ring" }),
};

export const size_row = (R) => SIZE_ROWS[G.has_text(R) ? "numerals" : G.kind_of(R) === "band" ? "band" : G.SHAPES[R.shape] === "dot" ? "dot" : "len"];

export const VALUE_PICS = {                               // a value button's drawing, at its size (36), centre 18. Its disc is the button's edge and, since the audit's second round, a line as heavy as the others (Okay, 14 Oct 2026: "same thicknesses"); outer edges where they were
  radius: `<circle class="disc" cx="18" cy="18" r="${18 - CURVE / 2}" ${sw(CURVE)}/><path d="M18 18.25H35.5" ${sw(LINE)}/><circle class="pivot" cx="18" cy="18.25" r="2"/>`,     // a radius, from the centre to the edge
  // scale: a small circle growing into the large one, joined by their two tangents (Okay's drawing, Asset_1.svg, 13 Oct
  // 2026). Level since beta 4.41.13: both centres on the radius button's radius line (18.25), small left, large right
  // (Okay, 15 Oct 2026, 10:39, of the variants: "C, but tiny bit far apart for scale circles. Same size."): r 8.5 and
  // 15, centres 11.5 apart (C was 10.875; the grid allows 11 or 11.5), placed by fit.mjs; the small one's edge on the
  // button's, the large one 0.56 past it on the right. The hull (both circles and what lies between the tangents)
  // fills when the button is pressed (Okay's drawing, 14 Oct 2026). Tangents and hull computed from the circles.
  size: `<path class="hull" d="M4.45 11.24L12.27 5.88A15 15 0 1 1 12.27 30.62L4.45 25.26A8.5 8.5 0 0 1 4.45 11.24Z"/><circle class="disc" cx="20.75" cy="18.25" r="15" ${sw(CURVE)}/><circle class="small" cx="9.25" cy="18.25" r="8.5" ${sw(CURVE)}/><path class="tangent" d="M4.45 11.24L12.27 5.88M4.45 25.26L12.27 30.62" ${sw(SLANT)}/><path class="dark" d="M9.25 18.25H20.75" ${sw(LINE)}/><circle class="pivot" cx="20.75" cy="18.25" r="2"/>`,
};

export const LANG_NAMES = { default: "As the font sets it", tr: "Turkish", nl: "Dutch", de: "German", pl: "Polish", ro: "Romanian", ca: "Catalan", ar: "Arabic", fa: "Persian", "zh-Hans": "Chinese, simplified", ja: "Japanese" };

export const lang_short = (code) => (code === "default" ? "EN" : code.slice(0, 2).toUpperCase());      // none chosen: EN, what the font sets by itself (#273; Okay's notes, p. 12)

// a tile's word is one line: a name too long for a tile is said shorter there (its tag still says it whole)
export const TILE_WORDS = { "moon phase": "moon", "radial, auto-flip": "auto-flip", "Root beer": "R. beer" };      // a tile's word is one line: the long ones shortened (the tile's title keeps the whole name)

export const kind_in = (...names) => (R) => names.includes(G.kind_of(R));

export const marks_with = (...shapes) => (R) => ["ticks", "markers"].includes(G.kind_of(R)) && shapes.includes(G.SHAPES[R.shape]);

export const labels_are = (name) => (R) => G.kind_of(R) === "numerals" && G.LABEL_SETS[R.labels][0] === name;

export const hand_is = (...shapes) => (H) => shapes.includes(G.HAND_SHAPES[H.shape]);

export const numerals_only = kind_in("numerals");

export const with_text = kind_in("numerals", "text");

export const nudgeable = kind_in("ticks", "markers", "numerals", "text");      // what has positions of its own to nudge: all but a band (4.78, #349)      // rings that draw words: numerals, and a text ring (#297)

export const W = { scope: "window" };

/** the note in each place an SVG will go after v1 (#530; Okay, 24 Oct 2026: "spaces set. Moon, ampm, dial only"). */
export const SVG_LATER = "Your own picture, from an SVG file, comes after v1.";

export const win_on = (T) => T.on;

export const win_is = (...kinds) => (T) => T.on && kinds.includes(G.WINDOW_KINDS[T.kind]);

export const shape_is = (...shapes) => (T) => T.on && shapes.includes(G.window_shape(T));

// the Windows cards, left to right: 12 · 3 · 6 · 9. slot = which of the four windows a card is (window 1, the date
// window of old, starts at 3, so the second card is its); at = that place in G.DATE_AT.
export const WINDOW_CARDS = [{ slot: 1, at: 4 }, { slot: 0, at: 0 }, { slot: 2, at: 2 }, { slot: 3, at: 3 }];

export const TAB_NAMES = { Date: "Windows", "Show dial": "Dial", "Show export": "Export" };            // the section's number and key stay "Date" (R8, R9); its tab says what it now holds

export const H = { scope: "hand" };

export const cap_rows = (S) => S.ui_hand === G.top_hand(S) && (S.ha_second.on || S.ha_cap_top);      // the cap's size and colour: under the hand it belongs to (#262)

export const ROWS = {
  Dial: [
    // Okay, 13 Oct 2026: Dial and Page stay in view (pinned); the list of colours scrolls under them.
    hdr("Dial", { pin: true }),                    // the plate: how big, what colour, what is on it
    num("dial_d", "Diameter", 15, 50, 0.1, { limits: [5, 300] }),      // typed past these it stops there and says so (#233: 0 and 1000 were taken)
    chk("ui_scale", "Scale everything with it", { nest: true }),
    // Weight (#88; atlas 6.19, Okay, 14 Oct 2026: "very very good… under Dial, and note the danger of changing all the
    // settings all at once"): every width on the dial at once, as Scale changes every measure — the panel's numbers
    // stay true, since the widths themselves change; one undo takes it all back
    num("ui_weight", "Weight %", 50, 200, 1, { whole: true }),
    info("Every width on the dial at once — marks, bands, hands, frames. Lengths and places stay; one undo takes it back.", {}),
    num("dial_hole", "Centre hole", 0, 6, 0.1),      // Ø; 0 = none. Shows when the hands are hidden (#165)      // nest: a question about the row above starts on the controls' column (Okay, 12 Oct 2026)
    col("c_plate", "Plate", { head: true }),      // the plate's colour on the Dial heading line, no row of its own (Okay, 24 Oct 2026: his drawing, the pill up on "Dial", "Row gone")
    custom("background"),
    hdr("Page", { folded: true }),                 // around the dial: preview and page only. Under the pinned part, with what scrolls (Okay, 20 Oct 2026, 03:41: "Page moves to gray area")
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
    // involves fonts")
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
    // its head reads "Resize Ring from" and what the radius measures to: "from" in plain type on the controls' column,
    // then the menu stretched to the margin; the rows keep the slider and the number (Okay, 19 Oct 2026, #419: "from
    // is normal text on second column before dropdown. Dropdown here stretches all in-between")
    hdr("Resize Ring", { folded: true }),
    custom("resize_from", { head: true, text: "Resize ring from" }),
    num("len", "Length", 0.05, 10, 0.05, { show: marks_with("bar", "wedge", "file") }),
    num("w", "Ø", 0.02, 5, 0.01, { show: marks_with("dot"), id: "ring-w-dot" }),
    num("width", "Band width", 0.02, 25, 0.05, { show: kind_in("band") }),      // a numeral's size stays in the font box, among the type's settings (and in the size button's popup)
    { ...RADIUS_ROWS.outer, menu: null, text: "Radius", show: kind_in("ticks", "markers", "band") },      // its menu is on the heading's line (#419)
    { ...RADIUS_ROWS.numerals, menu: null, text: "Radius", id: "ring-r-text", show: with_text },
    num("w", "Shapes width", 0.02, 5, 0.01, { show: marks_with("bar", "wedge", "file"), id: "ring-w-resize" }),      // the Shapes pane's Width, here too (Okay, 20 Oct 2026, 00:34: "Replicate the same shapes-size button on resize rings but call it shapes width"; 01:05: "shapes width to the end")
    hdr("Sector colours", { folded: true, show: (R) => G.kind_of(R) === "band" && G.positions_of(R).length > 1 }),
    custom("sectors", { show: (R) => G.kind_of(R) === "band" && G.positions_of(R).length > 1 }),
    // what one mark is comes first (Okay, 13 Oct 2026: "moves up to the top"), then where the marks are
    hdr("Shapes", { folded: true, show: kind_in("ticks", "markers") }),      // "Shape box is called shapes now" (Okay, 20 Oct 2026, 00:34)
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
    // one numeral or one mark of its own (#252; every kind but a band, #349: "Each marker selectable and
    // editable … a tick can grow or become anything else, a wedge"): which one — picked in the list, or on the dial, a
    // first press choosing the ring and a second the one pressed — and its own radius, angle, turn and size; a mark
    // also its own shape. The one chosen is outlined on the dial while this pane is open
    hdr("Edit one numeral", { folded: true, show: nudgeable, title: (R) => (G.has_text(R) ? "Edit one numeral" : "Edit one mark") }),
    custom("nudge", { show: nudgeable }),      // which one, and Reset
    // its four adjusters, number rows on the numeral chosen above (Okay's notes, p. 6–7, #252, beta 4.45.2: "every
    // adjuster gets ±; angle and radius get sliders"): each a full row, its name opening the popup (#249)
    num("dr", "Radius ±", -3, 3, 0.05, { scope: "nudge" }),
    num("da", "Angle ± °", -30, 30, 0.1, { scope: "nudge" }),
    num("rot", "Rotate °", -180, 180, 1, { scope: "nudge" }),
    num("s", "Scale ×", 0.2, 3, 0.01, { scope: "nudge" }),
    seg("shape", "Shape", ["As the ring", "Bar", "Wedge", "Dot"], { scope: "nudge", id: "nudge-shape", show: (T, S, app) => app.ring() && !G.has_text(app.ring()) }),      // a mark's own shape (4.78)
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
    num("feature", "Circle Ø", 0, 6, 0.05, { ...H, side: true, short: "Circle Ø", show: hand_is("breguet", "lollipop") }),
    num("feature_at", "Widest at %", 0, 100, 1, { ...H, side: true, short: "Widest %", show: hand_is("dauphine") }),
    num("bulge", "Widest at %", 20, 70, 0.5, { ...H, side: true, short: "Widest %", show: hand_is("leaf") }),      // where the leaf bulges (#368, 4.80): its curves' middle as a share of the length
    num("feature_at", "Barrel from %", 0, 100, 1, { ...H, side: true, short: "Barrel %", show: hand_is("syringe") }),
    num("feature_at", "Circle at %", 0, 100, 1, { ...H, side: true, short: "Circle at %", show: hand_is("breguet", "lollipop") }),
    num("hub", "Hub Ø", 0, 4, 0.05, { ...H, side: true, show: (H) => G.HAND_SHAPES[H.shape] !== "disc" }),      // the round boss the hand sits on (#370, 4.80; Okay: "a ball that the leaf attaches to")
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
    custom("show_box", { ...W, bar: true }),      // the Show box, as a hand's (#261): its tick on the heading line
    // the Windows page (#263, 4.46.1; Okay's marks on three mock-ups, 16 Oct 2026): first where it is and what it
    // shows, under Window at x; then the hole itself under Shape — its shape buttons on that heading's line, then
    // Radius ("ok but below shapes"), its sizes, its colours on one line, its text and font, its frame
    // the place buttons on its heading's line (Okay, 16 Oct 2026, on the mock-ups: "If it's taller so be it, enlarge
    // buttons. And 3 6 9 12 are circular buttons now")
    hdr("Window", { ...W, title: (T) => `Window at ${G.window_place(T)}` }),      // off, its rows don't apply, so the pane goes (R16): the tab is empty below its Show (#416)      // "Position" under it in 4.46.1–2 (Okay: "Delete position name, that works without")
    custom("window_at", { ...W, head: true, show: win_on, text: "Position" }),
    // four complications: a big date is the Date tile with its tick below (4.89; Okay, 19 Oct 2026: "Big date function is an under selection of date function"); its kind, 4, stays what is stored (R9)
    pick("kind", "Complication", G.WINDOW_KINDS, (i) => icon(PICS.window[i], 30, 21), { ...W, small: true, across: 4, skip: [4], shown: (T) => (G.WINDOW_KINDS[T.kind] === "big date" ? 0 : T.kind), show: win_on }),
    chk("big", "Big date", { ...W, nest: true, show: win_is("date", "big date"), get: (T) => G.WINDOW_KINDS[T.kind] === "big date", put: (tool, on) => tool.set_value("window", "kind", G.WINDOW_KINDS.indexOf(on ? "big date" : "date")) }),      // all on one line (4.79: the fifth, big date, fell to a line of its own)
    info("Two holes: the tens and the units, each on a disc.", { ...W, show: win_is("date", "big date") }),      // a tick says its name; what it means, a note under it (design canon §6, #420)
    info("Follows the time shown: AM · PM beside the time, under the panel.", { ...W, show: win_is("am · pm") }),
    // an am · pm window has one picture, a disc half am and half pm, so no Picture row (4.88; Okay, 19 Oct 2026: "Am pm should be one half of a circle each")
    // its picture (4.73, #346; the disc sketches B: "All are good"): Arch as before · Phase, the moon lit as it is, in
    // the disc's colour, its dark side in the shade's, the sky in the picture's · Line, its outline and dark side in one ink
    seg("look", "Picture", G.PICTURES["moon phase"], { ...W, id: "window-look-moon", show: win_is("moon phase") }),
    info(SVG_LATER, { ...W, show: win_is("moon phase") }),      // a place made ready for an SVG (#530)
    num("age", "Moon age, days", 0, 29.5, 0.1, { ...W, show: (T) => win_is("moon phase")(T) && !T.follows }),
    info("0 new moon · 14.8 full.", { ...W, show: (T) => win_is("moon phase")(T) && !T.follows }),
    // the hole: its shape (buttons on the heading's line, #265), where and how big, its colours (one line, #266), what
    // is written in it, its frame. Folded on a first visit, as every pane but the one the tab is about (#270); its shape
    // buttons stay on its heading line
    hdr("Shape", { ...W, folded: true, show: win_on }),
    custom("window_shape", { ...W, head: true, text: "Shape", show: win_on }),
    num("r", "Radius", 2, 18, 0.05, { ...W, show: win_on }),
    // width over height, two rows, a LINK pill on the line between them (Okay's notes 2, #358: "Two sliders on one line
    // is not a good idea … two stories tall … like in illustrator"; #265)
    num("w", "Width", 0.5, 8, 0.05, { ...W, show: shape_is("rectangle", "arc", "pair"), link: "wh_link" }),      // a big date's: both holes together (4.74)
    num("h", "Height", 0.5, 5, 0.05, { ...W, show: shape_is("rectangle", "arc", "pair"), poplink: "wh_link" }),      // poplink: the pair's LINK in its controller too, as in Width's (4.86; Okay, 19 Oct 2026: "tapping second item in the linkees should also trigger button")
    num("w", "Width", 0.5, 8, 0.05, { ...W, show: shape_is("arch", "half"), id: "window-w-Width-arch" }),      // its own id: the line above has window-w-Width
    num("w", "Ø", 0.5, 8, 0.05, { ...W, show: shape_is("circle", "polygon") }),
    num("sides", "Sides", 3, 12, 1, { ...W, whole: true, show: shape_is("polygon") }),
    num("round", "Corner", 0, 2, 0.05, { ...W, show: shape_is("rectangle", "polygon", "pair") }),
    chk("turn", "Turn it with its radius", { ...W, show: (T) => T.on && G.window_shape(T) !== "arc" }),
    info("Only off the quarters: at 4 it turns 30°, at half past four 45°.", { ...W, show: (T) => T.on && T.turn && G.window_turn(T) === 0 && G.window_shape(T) !== "arc" }),
    chk("text_turn", "Turn the text with it", { ...W, nest: true, show: (T) => T.on && T.turn && G.window_shape(T) !== "arc" && ["date", "day"].includes(G.WINDOW_KINDS[T.kind]) }),
    // its colours, one to a line as elsewhere (Okay, 19 Oct 2026, 18:04: "List these colors in lines like elsewhere"): the disc under the hole · the frame · what a moon or am · pm window pictures · a moon's shade · the neighbours
    col("ink", "Frame", { ...W, show: win_on }),      // first, over the window's own colours (Okay, 20 Oct 2026, 01:49 and after 03:41: "Frame is always above window specific colors", #464, #487)
    col("disc_c", "Disc under it", { ...W, show: win_on, say: (T) => [is_day(T) && !T.ampm_form ? "AM half" : moon_look(T) === 1 ? "Moon" : "Disc under it"], or: () => [1, 1, 1, 1] }),
    col("text_c", "Picture", { ...W, show: win_is("am · pm", "moon phase"), say: (T) => [moon_look(T) === 1 ? "Sky" : is_day(T) ? (T.ampm_form ? "Text" : "PM half") : "Picture"], or: (T) => T.ink }),      // or: what an unset colour is
    col("c2", "Shade", { ...W, show: (T) => moon_look(T) === 1, or: () => G.PICTURE_TONES.shade }),      // a picture's further colour (4.73): a moon's dark side in Phase
    col("c2", "Neighbours", { ...W, id: "window-c2-Neighbours", show: (T) => win_is("date", "day")(T) && T.neighbours, or: (T) => T.text_c || T.ink }),      // a date or day window's neighbours (4.74), in the number's colour unless given one
    // the frame round the hole and the room kept clear round it are drawn on the dial: they are design, so they
    // stand here, not under a pane called Print (Okay, 13 Oct 2026: print things under Print, design among design)
    num("frame", "Frame width", 0, 0.6, 0.01, { ...W, show: win_on }),      // "width": the Frame colour stands just above (Okay, 19 Oct 2026, #422)
    num("clear", "Clearance", 0, 1, 0.01, { ...W, show: win_on }),
    // the ticks at the end of the column, Frame and Clearance in their place (Okay, 19 Oct 2026, #413: "These three at the end of this column. Last two sliders come in their place")
    // following the bar's date (4.62): a date or day window says it, a moon window shows its age; its typed text or age
    // waits underneath, for when it doesn't follow
    chk("follows", "Follows the date", { ...W, show: win_is("date", "day", "moon phase", "big date") }),
    info("The date set in the bar, not typed text.", { ...W, show: win_is("date", "day", "moon phase", "big date") }),
    // its neighbours (4.74; the disc sketch D1): the disc's places either side of the shown one, where the hole lets them — a tall hole at 3 or 9, a wide one at 12 or 6
    chk("neighbours", "Neighbours", { ...W, show: win_is("date", "day") }),
    info("The disc’s next places show where the hole allows.", { ...W, show: win_is("date", "day") }),
    seg("names", "Names", ["EN", "TR", "DE", "FR", "IT"], { ...W, show: (T) => T.on && T.follows && G.WINDOW_KINDS[T.kind] === "day" }),
    seg("day_form", "Written", ["Short", "Full", "Custom"], { ...W, show: (T) => T.on && T.follows && G.WINDOW_KINDS[T.kind] === "day" }),
    custom("own_names", { ...W, text: "Days", nest: true, count: 7, hint: (T) => G.day_short(T.names), show: (T) => T.on && T.follows && G.WINDOW_KINDS[T.kind] === "day" && T.day_form === 2 }),      // your seven (#515: "Or custom (open 7 slots, 7 input boxes when so)")
    // an am · pm window (#516; Okay, 24 Oct 2026: "Am/pm gets two sub options, one is this disc, other is a typed out am pm
    // default jump mechanism, allows custom text, opens up inputs like the week"): its disc, or its two words, jumping
    seg("ampm_form", "Shows", ["Disc", "Words"], { ...W, show: win_is("am · pm") }),
    info(SVG_LATER, { ...W, show: win_is("am · pm") }),      // a place made ready for an SVG (#530)
    custom("own_names", { ...W, text: "Words", nest: true, count: 2, hint: () => ["AM", "PM"], show: (T) => win_is("am · pm")(T) && T.ampm_form === 1 }),      // MON or MONDAY (#515; Okay, 24 Oct 2026: "Days of the week option to be written in full"); Custom comes third (R9)
    // physics (4.72, #346: "their discs obey physics or not, chosen by the user"): on, a disc must end inside the case —
    // passing it, its outer guide shows red and this says by how much; off, it may (a face on a screen)
    chk("jump", "Jumps", { ...W, show: (T) => win_is("am · pm")(T) && !T.ampm_form }),      // #401, 4.90; words always jump
    info("Snaps to am at midnight and to pm at noon, as a date disc jumps. Off, the disc sweeps round once a day.", { ...W, show: (T) => win_is("am · pm")(T) && !T.ampm_form }),
    chk("physics", "Inside the case", { ...W, show: (T) => win_is("date", "day", "am · pm")(T) && !(G.WINDOW_KINDS[T.kind] === "am · pm" && T.ampm_form) }),      // words have no disc (R16)
    info("Its disc may not pass the case. Off for a face on a screen.", { ...W, show: (T) => win_is("date", "day", "am · pm")(T) && !(G.WINDOW_KINDS[T.kind] === "am · pm" && T.ampm_form) }),
    info((T, app) => `Its disc passes the case by ${app.disc_past().toFixed(2)} mm: move the window in, or untick to let it.`, { ...W, nest: true, show: (T, S, app) => win_is("date", "day", "am · pm")(T) && T.physics !== false && app.disc_past() > 0 }),
    // its text and font: a pane of its own with its eye (Okay, 19 Oct 2026, #415: "Font needs own section & eye")
    hdr("Font", { ...W, folded: true, show: win_is("date", "day", "big date") }),
    txt("text", "Text", { ...W, show: (T) => win_is("date", "day", "big date")(T) && !T.follows }),
    custom("font", { ...W, show: win_is("date", "day", "big date") }),      // its own font, or the top numerals ring's (the start)
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
    hdr("Print", { folded: true, cls: "ticks-wide" }),      // its ticks span every column: nothing on the left to explain them but the title (#474)                                  // what only the printed or etched dial needs
    chk("out_production", "Mono print mask"),
    // what the mask loses (#220): a ring lying on a ring below in another colour merges into it, one ink, and is gone;
    // said under the tick while the mask is on (design canon §6: a tick's note under it), and in the log on export
    info((S, app) => mask_says(merges_of(app)), { scope: "global", show: (S, _S, app) => S.out_production && merges_of(app).length > 0 }),
    // the production debts (#219–#224, 4.90): each a tick that starts as files were made before. Claude's readings of
    // 19 Oct 2026, 22:55 ("questions asked"), built for Okay's approval; preview and files alike (R26)
    chk("out_invert", "Inverted", { show: (S) => S.out_production }),
    info("Toner everywhere inside the dial but the marks, for sunk marks.", { show: (S) => S.out_production }),
    chk("out_cutlines", "Cut lines", { show: (S) => S.out_production }),
    info("Each window's and the centre hole's outline, for cutting. Off, the mask holds only what is etched.", { show: (S) => S.out_production }),
    chk("out_marks", "Outline and registration marks", { show: (S) => S.out_production }),
    info((S) => { const m = G.production_mark_size(S); return m ? `The blank's edge, and a ${+m.toFixed(2)} mm mark in each corner of the page, to lay films on the blank and on each other.` : "The blank's edge. The page's corners are too small for registration marks: give the page more Margin (Dial)."; }, { scope: "global", show: (S) => S.out_production }),
    chk("out_hidden_cut", "Hidden rings still cut"),
    info("A hidden ring still knocks out and skips the rings under it, so a film made by hiding rings keeps its holes.", {}),
    chk("out_window_content", "What the windows show", { show: (S) => !S.out_production && G.windows_of(S).some((w) => w.on) }),
    info("Off, the windows' holes stay empty: discs, numbers and pictures are left out, for a printer who prints the face alone. Hide the hands under Hands.", { show: (S) => !S.out_production && G.windows_of(S).some((w) => w.on) }),
    chk("out_mirror", "Mirrored, for toner transfer"),
    // a film per ink (#35; brief §6: "pad printing etches one plate per colour"): one mask PDF for each colour the dial
    // is printed in, each with the cut lines and marks as ticked, so the films lie on each other by them (#224)
    custom("ink_films", { show: (S) => S.out_production }),
    // a print sheet (4.75, #348; Okay's notes 2: "print page preparation, preview, copies, stacks — something simple,
    // elegant, efficient and paper savingly"): one page of copies at true size, packed straight or staggered —
    // whichever holds more — mirrored and as a mask as the two ticks above say; a drawing of the page beside the button
    custom("print_sheet"),
    // the sheet's own rows, inside it: from the controls' column, as a hand's rows beside its box ("the hands squeeze";
    // Okay, 20 Oct 2026: "These are 'under' sheet. They should be inset", #480)
    seg("out_paper", "Paper", PAPERS.map((p) => p[0]), { side: true }),
    num("out_copies", "Copies", 0, 60, 1, { whole: true, side: true }),
    info((S) => sheet_says(S), { scope: "global", side: true }),
    num("out_gap", "Room between", 0, 20, 0.5, { side: true, short: "Room" }),
    chk("out_cutline", "A cut line round each", { side: true }),
    // a spec sheet (#18): the dial large, each ring's radius marked and numbered, its numbers beside it — for a supplier
    custom("spec_sheet"),
    // a set of files in one press (#171; atlas 6.3: "tick what to write (dial, mask, mirrored mask, PNG), one press")
    hdr("A set of files", { folded: true }),
    ...G.FILE_SET.map(([key, words]) => chk(key, words)),
    custom("export_set"),
    // a moving picture of the dial (#51): the hands turning from the time shown, at the bar's speed, as an MP4 or a GIF
    hdr("Moving picture", { folded: true }),
    custom("export_motion"),
    num("out_seconds", "Seconds", 1, 30, 0.5),
    num("out_fps", "fps", 6, 60, 1, { whole: true }),
    num("out_px", "Size px", 240, 2160, 10, { whole: true }),
    info((S, app) => { const k = app.speed || 1, n = Math.round(S.out_seconds * S.out_fps); return `${n} frames, ${S.out_px} × ${S.out_px} px, ${S.out_seconds} s at the bar's speed (${+k.toFixed(2)}×) from the time shown. A GIF is at most ${GIF_MOST} px and ${GIF_FPS_MOST} frames a second.`; }, { scope: "global" }),
    hdr("Share dial as link", { folded: true }),      // Okay, 24 Oct 2026: "'Share dial … as link' instead of this title"; the set of saved dials in one link is #523
    custom("link_copy", { head: true }),           // Copy link, flush right on the heading line, open or folded (#277)
    custom("link"),
    custom("link_set", { show: () => instances_read().length > 1 }),      // the saved dials as one link (#523)
    hdr("Settings file", { folded: true, title: (T, folded, app) => (app.loaded_name ? `Settings file · ${app.loaded_name}` : "Settings file") }),      // after Load it names the file (#279)
    custom("settings"),
    hdr("Log", { folded: true }),
    custom("log"),
    hdr("Gallery", { folded: true }),                                // under everything else: dials to open and take apart (Okay, 13 Oct 2026), the five first examples among them
    // your own dials are under undo on the preview, as Versions (#435), not here
    custom("gallery"),
  ],
};

/** what a print sheet will hold, in words (4.75). */
export const sheet_says = (S) => {
  const L = sheet_layout(S), n = L.places.length;
  if (!n) return `A ${S.dial_d} mm dial doesn't fit on ${L.paper[0]}.`;
  return `${n} ${n === 1 ? "copy" : "copies"} on ${L.paper[0]}${L.staggered ? ", rows staggered" : ""}${+S.out_copies > 0 && +S.out_copies > L.fits ? ` — ${L.fits} fit` : +S.out_copies > 0 ? "" : " — as many as fit (Copies 0)"}.`;
};


// ── show mode's tabs (#509; the Show Case's column, re-hosted in the tool's rows). Their numbers in SECTIONS come after the dial side's (R9) ──
ROWS["Show dial"] = [
  // three panes, two ways of seeing one set of colours (#545; Okay, 25 Oct 2026, drawn and locked on a complex dial):
  // Colours by what a part is, Inks by what a printer sees, Hands with their heights; a swatch in any of them is the
  // same colour ("All colors editable … via different places, through inks and colors"; "colors also editable on hands
  // pane everywhere")
  hdr("Colours", { summary: (S, tool) => tool.dial_colours(false).map((c) => ({ c })) }),      // not pinned, it scrolls with the rest on the grey (Okay, 24 Oct 2026, 12:41)
  custom("colours"),
  hdr("Inks", { folded: false }),
  custom("colhead", { head: true, text: "Height, mm" }),
  custom("inks"),
  num("w_ink_all", "All inks at once", -0.3, 0.3, 0.01, { limits: [-G.INK_MOST, G.INK_MOST] }),      // every printed height moves by the same mm, each ink keeping its own (Okay, 24 Oct 2026: "adding to or subbing from each same amount")
  hdr("Hands", { folded: false }),
  custom("colhead", { head: true, text: "Height, mm" }),
  custom("show_hands"),
  custom("bevel_pills"),
  num("sh_bevel", "Bevels %", 0, 100, 1, { whole: true }),      // the hands' bevels' strength: the Shadows pane's Bevels %, one number in both places
];

ROWS.Watch = [
  hdr("Watch"),
  seg("w_view", "View", ["Detail", "Whole watch", "Dial"]),
  pick("bezel", "Case", ["Dress", "Diver", "Field", "Dress", "Field", "Emre"], (i) => tilePicture(G.CASE_OF_BEZEL[i]), { order: [3, 2, 1, 5], shown: (S) => G.BEZEL_OF_CASE[G.CASE_OF_BEZEL[S.bezel] || "dress"] }),      // the same key the dial side's case menu writes (R9: the numbers keep their meaning); tiles, each case's silhouette (Okay, 23 Oct 2026: "Tiles with pictures")
  pick("w_metal", "Metal", ["Fe", "Au", "Al", "CuSn", "Ti", "Black"], (i) => SHOW.metal_picture(i)),      // tiles, as Case and Insert: each fits the column (Okay, 23 Oct 2026: "do the same as others")
  col("c_metal", "Case colour", { or: (S) => SHOW.metal_colour(S) }),
  pick("w_insert", "Insert", ["Black", "Blue", "Green", "Pepsi", "Batman", "Coke", "Root beer", "Sprite"], (i) => SHOW.insert_picture(i), { show: (S) => G.CASE_OF_BEZEL[S.bezel] === "diver" }),      // tiles, each insert a ring in its two colours
  hdr("Strap", { folded: false }),
  seg("strap", "Strap", ["Strap", "Leather", "Bracelet", "NATO", "Links"], { free: true, order: [1, 3, 2, 4], offered: (S) => (G.CASE_OF_BEZEL[S.bezel] === "diver" ? [1, 2, 3, 4] : [1, 3]), get: (S) => (S.strap === 0 ? 1 : S.strap) }),      // 0 (an older file) reads as Leather, so a pill is always lit      // 0 and 1 leather; a bracelet is the diver's alone (R16: not offered elsewhere)
  col("c_strap", "Leather", { show: (S) => ![2, 3, 4].includes(S.strap) }),
  // the NATO (#524; Okay, 24 Oct 2026: "Nato colors should be selectable. One solid option. Options can be free living
  // single pills"): its patterns as pills of their own, Solid last (R9); a pattern taken starts again from its own colours
  seg("w_nato", "Pattern", ["Bond", "Regimental", "Khaki", "Black · grey", "Olive", "Grey", "Solid"], { free: true, show: (S) => S.strap === 3,
    put: (tool, v) => { tool.set_value("global", "w_nato", v); tool.set_value("global", "c_nato", null); } }),
  // its colours, one swatch a stripe, starting from the pattern's: a change makes them your own (c_nato); a solid one's one swatch
  ...[0, 1, 2].map((i) => col("c_nato", `Stripe ${i + 1}`, { show: (S) => S.strap === 3 && S.w_nato !== 6, get: (S) => nato_stripe(S, i),
    put: (tool, v) => tool.set_value("global", "c_nato", [0, 1, 2].map((k) => (k === i ? v : nato_stripe(tool.S, k)))) })),
  col("c_nato", "Colour", { show: (S) => S.strap === 3 && S.w_nato === 6, get: (S) => nato_stripe(S, 0), put: (tool, v) => tool.set_value("global", "c_nato", [v, v, v]) }),
];

ROWS.Light = [
  hdr("Light", { pin: true, headless: true }),      // the Show Case's fixed lines: Style and Lighting stay put under the tabs, no heading (Okay, 21 Oct 2026, 01:50); everything else in show mode scrolls, so the top band is small
  seg("w_style", "Style", ["Engineer", "Miyazaki"]),
  seg("w_lighting", "Lighting", ["Dramatic", "Flat"]),
  hdr("Sun", { folded: false }),
  custom("sunbox"),      // the sun's picture with the three values (guides.js, row_sunbox; Okay, 25 Oct 2026: "sun locked")
  num("sh_from", "Angle °", 0, 359, 1, { whole: true }),      // the one sun: the dial's shadow keys light the watch too (Okay, 22 Oct 2026); named as in the Shadows pane
  num("sh_rise", "Height °", 5, 85, 1, { whole: true }),
  num("sh_dark", "Strength %", 0, 100, 1, { whole: true }),      // the shadows' darkness, the Shadows pane's Strength (Okay, 25 Oct 2026: "Darkness becomes the box's Strength slider")
  chk("sh_blur", "Soft shadows"),
  info("One finger or the pointer moves the sun: its direction is where the light comes from; nearer the middle, higher. Two fingers zoom and move the drawing; on a trackpad, pinch and scroll.", {}),      // the Show Case's words
  hdr("Flare", { folded: false, show: (S) => S.ui_effects }),
  chk("w_flare_on", "Flare", { show: (S) => S.ui_effects, head: true }),      // on its pane's heading line (Okay, 23 Oct 2026: "tick box and its label moves up … on the eye's row")
  seg("w_flare", "Kind", ["Arc", "Dot"], { show: (S) => S.ui_effects && S.w_flare_on && S.w_style === 1 }),
  num("w_fl_size", "Size %", 20, 300, 1, { whole: true, show: (S) => S.ui_effects && S.w_flare_on }),
  num("w_fl_tint", "Case colour %", 0, 100, 1, { whole: true, show: (S) => S.ui_effects && S.w_flare_on }),
  num("w_fl_bright", "Brightness %", 0, 300, 1, { whole: true, show: (S) => S.ui_effects && S.w_flare_on }),
  info("The flare shows with dramatic lighting.", { show: (S) => S.ui_effects && S.w_flare_on && S.w_lighting === 1 }),
  hdr("Glass reflection", { folded: false, show: (S) => S.ui_effects }),
  num("w_glass_fat", "Width %", 0, 400, 1, { whole: true, show: (S) => S.ui_effects }),
  num("w_glass_len", "Length %", 10, 300, 1, { whole: true, show: (S) => S.ui_effects }),
  num("w_glass_op", "Shine %", 0, 100, 1, { whole: true, show: (S) => S.ui_effects }),
  hdr("Effects", { folded: false }),
  chk("ui_effects", "Blurs, flare, shine, outline", { head: true }),      // on its heading line, in the first column after the title (Okay, 23 Oct 2026)      // off for an old computer (Okay, 22 Oct 2026: "a 'turn off shenanigans' button … persistent")
  info("Off, the watch is drawn without the layers that cost most: blurs, the flare, the glass shine, the outline round the metal.", {}),
];

ROWS["Show export"] = [
  hdr("Export the watch"),
  custom("export_watch_png"),
  custom("export_watch_pdf"),
  num("out_watch_px", "Pixels", 1000, 8000, 100, { whole: true, tie: true }),
  info("The picture's longer side. The PDF is one page at the drawing's real size, the picture inside it.", {}),
];

export const SHOW_SECTIONS = ["Show dial", "Watch", "Light", "Show export"];

export const SECTIONS = Object.keys(ROWS);                // their numbers are what ui_section stores (R9)

export const TAB_ORDER = ["Dial", "Rings", "Hands", "Date", "Export"];      // left to right. Guides is a switch on the preview (Okay, 12 Oct 2026)

for (const name of SECTIONS) for (const row of ROWS[name]) { row.scope ??= name === "Rings" ? "ring" : "global"; name_row(row); }
