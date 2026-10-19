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

export const VERSION = "beta 4.89.12";
export const MM = 72 / 25.4;                       // 1 mm in points (files only)

import { moment, window_text, LANGS as MOMENT_LANGS, NAMES as MOMENT_NAMES } from "./moment.js";      // the complications' engine: one moment, a date and the time (#346, 4.62)
const { sin, cos, tan, acos, hypot, PI, ceil, abs, min, max, round } = Math;
const radians = (a) => a * PI / 180;
const degrees = (a) => a * 180 / PI;
const clone = (v) => JSON.parse(JSON.stringify(v));

// ═════════════════════════════════════════════════════════════
//  1 · SETTINGS
// ═════════════════════════════════════════════════════════════

export const KINDS = ["ticks", "markers", "numerals", "band", "text"];      // text: a line of words at every position, with a font of its own (#297, 4.48; appended, R9)
/** the kinds that draw words through the text pipeline (numeral_at): numerals, and a text ring (#297). */
export const has_text = (ring) => kind_of(ring) === "numerals" || kind_of(ring) === "text";
export const SHAPES = ["bar", "wedge", "dot", "file"];
export const TWELVES = ["same", "double", "triangle", "none"];
export const SKIP_FROM = ["nothing", "markers above", "markers & numerals above", "all marks above"];
export const KNOCK_FROM = ["nothing", "markers above", "markers & numerals above", "everything above"];
export const FROM_KINDS = [[], ["markers"], ["markers", "numerals", "text"], ["ticks", "markers", "numerals", "band", "text"]];      // a text ring counts with the numerals (#297)
export const MODES = ["upright", "radial", "radial, auto-flip", "on path"];
export const ANCHORS = ["centre", "baseline", "ascender", "outer edge", "inner edge"];      // the point of a numeral that sits on its ring's radius (web version, 13 Oct 2026). Only grows at its end (R9). The edges (4.53, #338; Okay, 18 Oct 2026: "Tangent to inner or outer"): every numeral's ink touches the radius from inside, or from outside
export const FROM = ["outer", "middle", "inner"];               // the point of a mark or a band that sits on its ring's radius: its outer end, its middle, its inner end (#257, 4.47). Only grows at its end (R9)
/** how far a mark's or band's outer edge lies outside the ring's radius: nothing when the radius measures to the outer
 *  end, half its extent from the middle, all of it from the inner end (#257). extent: the mark's length or the band's width. */
export const from_shift = (ring, extent) => extent * (ring.from || 0) / 2;
export const HANDS = ["hour", "minute", "second"];
export const HAND_SHAPES = ["baton", "pencil", "sword", "dauphine", "leaf", "arrow", "syringe", "breguet", "lollipop", "file", "disc"];      // disc: #164, 14 Oct 2026 (appended, R9)
export const DATE_AT = [["3", 90], ["4:30", 135], ["6", 180], ["9", 270], ["12", 0], ["1:30", 45], ["7:30", 225], ["10:30", 315], ["4", 120]];      // only grows at its end (R9); 4 added 13 Oct 2026 (Ronda's 4H dial drawing)
export const WINDOW_KINDS = ["date", "day", "am · pm", "moon phase", "big date"];      // big date appended (4.74, R9): two square holes, the tens and the units each on a disc of its own      // what a window shows (web version)
// the hole's shape, apart from what shows through it (Okay, 13 Oct 2026). 0, the start, is "as its kind": an arch for a
// moon phase, a rectangle for the others — what was drawn before there was a choice (R31). Only grows at its end (R9).
export const WINDOW_SHAPES = ["as its kind", "rectangle", "circle", "polygon", "arch", "arc", "half"];      // half: an am · pm window's own, chosen as a shape (20 Oct 2026; appended, R9)
export const window_shape = (w) => WINDOW_SHAPES[w.shape] && w.shape ? WINDOW_SHAPES[w.shape]
  : WINDOW_KINDS[w.kind] === "moon phase" ? (w.look ? "circle" : "arch") : WINDOW_KINDS[w.kind] === "am · pm" ? "half"
  : WINDOW_KINDS[w.kind] === "big date" ? "pair" : "rectangle";      // a big date: two square holes side by side (4.74)      // a moon's Phase and Line sit in a round hole, an am · pm Half in a half-round one (4.73)      // a moon's Phase and Line pictures sit in a round hole (4.73)
// what a moon window pictures (4.73, #346; the disc sketches B and C, Okay, 18 Oct 2026: "All are good"): Arch (the
// humps) · Phase (the moon as it is lit, in three colours) · Line (its outline and dark side, one ink). An am · pm
// window has one picture: a disc, half am and half pm, under a half-round hole (Okay, 19 Oct 2026: "Am pm should be
// one half of a circle each"); its three former pictures keep their places here (R9) but `look` is not read for it
// (link scheme 3, R31). Only grows at its end (R9)
export const PICTURES = { "moon phase": ["Arch", "Phase", "Line"], "am · pm": ["Sky", "Half", "Band"] };
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
  num_again: 0,                                    // Numbers: the count starts again after this many positions (0 = never), as on Ferguson's dial or a two-hour track (13 Oct 2026)
  guide: -1,                                       // its guide's colour (preview only, R5): a place in GUIDE_COLOURS · -1 = one by its place in the list (ring_guide) · -2 = none (13 Oct 2026)
  anchor: 0,                                       // numerals: what the radius measures to, a place in ANCHORS. 0 = the text's centre, as before (R31)
  from: 0,                                         // ticks, markers, bands: what the radius measures to, a place in FROM — the mark's or band's outer end, its middle, or its inner end (Okay's notes, p. 9, #257: "resize from"). Starting at outer, every link draws as before (R31)
  cs: {},                                          // a band's sectors with a colour of their own: position → RGBA. Empty = all in the ring's colour (beta 4.6)
};
export const TYPE_KEYS = ["family", "ps", "size", "tracking", "lang", "axes", "features"];

// round: corner radius of a hand's ends (web version, beta 3.0). Half the width or more = a round end.
export const HAND_BASE = {
  on: true, shape: 0, file: "", fit: true, scale: 1.0, w_scale: 1.0,
  len: 10.0, w: 1.0, tail: 1.0, tip: 1.0, feature: 1.2, feature_at: 75.0,
  counter: 0.0, wall: 0.0, round: 0.0, c: [0.10, 0.10, 0.12, 1],
  // (4.80, #370, #368; Okay, 19 Oct 2026: "These hands need a disc to attach to the mechanism … a ball that the leaf
  // attaches to"; "centre buttons on preview allowed to go up/down to adjust eg where the leaf bulges"): hub — the
  // round boss the hand sits on at the pivot, its Ø (0: none, as every hand before 4.80; a disc hand has none) ·
  // bulge — where a leaf is widest, its two curves' middle as a share of the length (37.5: the leaf as it always was)
  hub: 0.0, bulge: 37.5,
  // a disc hand (#164, 14 Oct 2026; Okay: "disk just gets a marker now… one marker as the arrow"): a disc of Ø disc_d
  // on the pivot, carrying one marker drawn as a markers ring draws its marks — mark: a place in SHAPES (bar · wedge ·
  // dot), mark_len · mark_w its length and width — with its outer end at the hand's Length. Used only by shape "disc"
  disc_d: 8.0, mark: 0, mark_len: 1.6, mark_w: 0.6,
  // the marker as a hole or a mark (#300, beta 4.45.4; Okay, 16 Oct 2026: "Mark if also possible easily"): mark_as 0 —
  // cut out of the disc (the dial shows through), as before; 1 — painted on it, whole, in mark_c
  mark_as: 0, mark_c: [1, 1, 1, 1],
  // the window kept inside the disc (#344; Okay, 18 Oct 2026: "Window is always inside disc hands, constrain" — "Off in
  // old links for window"): its outer end at the hand's Length, or at the disc's edge if Length reaches past it. Off to
  // start, as every older dial was drawn (R31: no new scheme); a hand made a disc in the tool turns it on (app.js)
  mark_in: false,
  // its bevel on or off (Okay, 19 Oct 2026: "on off from hand window"; 20 Oct 2026, 01:33: the tick "appears as soon as
  // show tick turned on"): the shading Shadows → Bevels % draws on a hand, per hand. Off to start ("Hand bevel off on
  // default", 19 Oct). An older link or file that drew bevels (Bevels % above 0, no per-hand key) gets them on every
  // hand when read (fresh_settings), so it draws as before (R31: no new scheme)
  bevel: false,
};

// windows 2 to 4 (web version, beta 3.0). Window 1 is the date window both tools know: its keys are da_….
// text: what a date or day window shows · age: of the moon, in days · hour: of the day, for am · pm until 13 Oct
// 2026 — since then an am · pm window follows the time shown (S.t, 0 to 86400: the second half of a day is pm), as
// its disc is geared to the hour wheel. `hour` stays because old links and files carry it (R8, R31); nothing reads it.
export const WINDOW_BASE = {
  on: false, kind: 0, at: 0, r: 10.5, w: 2.6, h: 2.0, round: 0.2, frame: 0.15, clear: 0.25,
  text: "17", size: 62.0, ink: INK, hour: 10.0, age: 14.8,
  // 13 Oct 2026 — shape: a place in WINDOW_SHAPES · sides: of a polygon · turn: the hole turns with its radius (off the
  // quarters) · text_turn: what shows turns with it · ps, family, axes: its own font ("" = the top numerals ring's type) ·
  // text_c, disc_c: the colour of what shows and of the disc under the hole (null = the print colour, and white)
  shape: 0, sides: 6, turn: false, text_turn: true, family: "", ps: "", axes: {}, text_c: null, disc_c: null,
  tracking: null, lang: null,                      // its own tracking and language (beta 4.26); null = the top numerals ring's, as before
  features: null,                                  // its own OpenType features (beta 4.30); null = none of its own. axes: {} likewise
  at_deg: null,                                    // a place of its own, in clock degrees (beta 4.34); null = the named place, at
  guide: -1,                                       // its guide's colour, as a ring's (#271): a place in GUIDE_COLOURS · -1 = by its place (window_guide) · -2 = none
  follows: true,                                   // a date, day or moon window shows the bar's date; on to start, and for every link (Okay, 19 Oct 2026, 21:09, #413: "All on by default", for old links too)
  names: 0,                                        // a day window following the date: its names' language, a place in moment.js LANGS (EN · TR · DE · FR · IT; 4.62)
  jump: false,                                     // an am · pm disc jumps at noon and midnight instead of sweeping (#401, beta 5; Okay, 19 Oct 2026, 14:13: "am pm gets a jump function on/off"); off, it sweeps, as before
  neighbours: true,                               // a date or day window shows its disc's places either side of the shown one, where the hole lets them (4.74; the disc sketch D1), in c2
  look: 0,                                         // its picture, a place in PICTURES[its kind] (4.73); 0 = as before
  c2: null, c3: null,                              // its picture's further colours (4.73): a moon's shade · an am · pm half's sun and moon · a band's dawn and dusk; null = the picture's own (PICTURE_TONES)
  physics: true,                                   // its disc stays inside the case (4.72, #346): passing it, its guide shows red and the panel says so; off for a face on a screen, where a disc may be bigger than the dial
  wh_link: false,                                  // width and height linked: one changed, the other keeps their ratio (#358, beta 4.57); off, so every link draws and behaves as before
};
const FIRST_WINDOW = { on: "da_on", kind: "da_kind", at: "da_at", r: "da_r", w: "da_w", h: "da_h", round: "da_round", frame: "da_frame",
  clear: "da_clear", text: "da_day", size: "da_size", ink: "da_ink", hour: "da_hour", age: "da_age",
  shape: "da_shape", sides: "da_sides", turn: "da_turn", text_turn: "da_text_turn", family: "da_family", ps: "da_ps", axes: "da_axes", text_c: "da_text_c", disc_c: "da_disc_c", guide: "da_guide", tracking: "da_tracking", lang: "da_lang", features: "da_features", at_deg: "da_at_deg", wh_link: "da_wh_link", follows: "da_follows", names: "da_names", physics: "da_physics", look: "da_look", c2: "da_c2", c3: "da_c3", neighbours: "da_neighbours", jump: "da_jump" };

export const DEFAULTS = {
  version: 2,
  dial_d: 30.0, margin: 3.0, guides: true,
  dial_hole: 2.7,                                  // the centre hole's Ø (#165, 14 Oct 2026; web only, R30); 0 = none. Okay waived R31 for it: old links get the hole too
  c_plate: [0.93, 0.91, 0.86, 1], c_backdrop: [0.80, 0.80, 0.78, 1],
  rings: [],
  ha_on: true, ha_beat: 0, ha_cap: 1.6, c_cap: ACCENT, ha_hour: {}, ha_minute: {}, ha_second: {},
  ha_cap_top: false,                               // the cap is part of the seconds hand (#262, beta 4.43); with no seconds hand it is drawn on the topmost hand only when this is on (web only, R30)
  da_on: false, da_at: 0, da_r: 10.5, da_w: 2.6, da_h: 2.0, da_round: 0.2, da_frame: 0.15,
  da_clear: 0.25, da_day: "17", da_size: 62.0, da_ink: INK,
  da_kind: 0, da_hour: 10.0, da_age: 14.8, windows: [WINDOW_BASE, WINDOW_BASE, WINDOW_BASE],
  da_shape: 0, da_sides: 6, da_turn: false, da_text_turn: true, da_family: "", da_ps: "", da_axes: {}, da_text_c: null, da_disc_c: null, da_tracking: null, da_lang: null, da_features: null, da_at_deg: null,      // window 1's share of WINDOW_BASE's keys of 13 Oct 2026
  t: 10 * 3600 + 9 * 60 + 36,
  out_production: false, out_mirror: false, out_live_text: false,
  // what a file for production holds (the production debts, #219–#224; beta 5): every one starts as files were made
  // before, so older links and files draw as they did (R31, no new scheme). Preview and files alike (R26: one scene)
  out_window_content: true,                        // #219: what the windows show (discs, numbers, pictures); off, their holes stay empty, for a printer who prints the face alone
  out_hidden_cut: false,                           // #221: a hidden ring still knocks out and skips as if it were there, so a film made by hiding rings keeps its holes
  out_cutlines: true,                              // #222: a mask's cut lines (each window's, the centre hole's); off, the mask holds only what is etched
  out_invert: false,                               // #223: a mask inverted inside the dial — toner everywhere but the marks, for sunk marks
  out_marks: false,                                // #224: a mask's blank outline and four registration marks in the page's corners
  // a set of files in one press (#171; atlas 6.3): which of FILE_SET it writes
  out_f_pdf: true, out_f_svg: false, out_f_png: false, out_f_mask: false, out_f_mirrored: false, out_f_mask_png: false, out_f_sheet: false,
  out_paper: 0, out_copies: 0, out_gap: 3.0, out_cutline: false,      // a print sheet (4.75, #348): its paper (output.js PAPERS: A4 · Letter · A5), how many (0 = as many as fit), the room between, a cut line round each
  out_dpi: 600.0, out_seconds: 4.0, out_fps: 30.0, out_px: 1080,
  ui_section: 0, ui_ring: 0, ui_hand: 0, ui_preview: 0, ui_window: 0,
  ui_unit: 0,                                      // the unit lengths are shown and typed in: a place in UNITS. Settings stay in mm (R1)
  ui_scale: false,                                 // changing the diameter scales everything on the dial with it (the window's state: not in a link)
  ui_weight: 100,                                  // Weight % (#88): every width on the dial times this, from the widths as they were when it was last moved; the widths carry it, so it is the window's state, not in a link
  // guides: preview only, never in a file (R5). Five kinds, each with an eye (shown or not) and a colour:
  // a place in GUIDE_COLOURS (R9: a number, never the colour itself). One thickness (screen points) for all;
  // the selected ring's lines are half as thick again. (beta 4.5, 12 Oct 2026)
  // Starting values since beta 4.38.5 (Okay, 15 Oct 2026, 02:06, a picture of the list: "Remove dial edge and set these
  // defaults, on"): centre lines in the first colour (pink), no window radii, the selected ring's guides only. Old
  // links that left them at the start see the new ones — preview only (R31 notes it). Dial edge: gone from the list
  // and never drawn; its keys stay for old links (R8).
  gd_edge: false, gd_axes: true, gd_win: false, gd_rings: false, gd_sel: true,
  gd_hole: true, gd_k_hole: 1,                    // the centre hole's own guide, first in the list (Okay, 16 Oct 2026, #267)
  gd_wins: false, gd_wsel: true,                  // which windows show their guides: all · the chosen one (to start) · none, as rings (#271). gd_win, gd_k_win (the windows' radii) unread since
  da_guide: -1,                                   // the first window's guide colour, as every window's `guide` (#271)
  da_follows: true, da_names: 0,                   // the first window's `follows` and `names`: following the bar's date to start (#413)
  wearos_name: "",                                 // a Wear OS watch face's name (4.67, farukahmet's PR #1); "" = Dial Tool. Its package's name follows from it
  strap: 1, c_strap: [0.29, 0.2, 0.14, 1],      // its strap (4.69, bezels.js STRAPS): 0 none, 1 a leather strap in c_strap, 2 a metal bracelet in the case's metal. Shown only with a case
  bezel: 0,                                        // a case round the dial on the preview (4.66, bezels.js BEZELS): 0 none, 1 diver, 2 pilot, 3 dress, 4 sport. Preview only, like the backdrop (R26)
  date: "",                                        // the day the dial shows, "2026-10-18", set in the bar (4.62; Okay, 18 Oct 2026: "Date best set at the bar … Default from system date"); "" = today, wherever the dial is opened
  da_jump: false,                                  // … and `jump` (#401, beta 5)
  da_look: 0, da_c2: null, da_c3: null, da_neighbours: true,      // … and `neighbours` (4.74)            // the first window's `look`, `c2`, `c3` (4.73)
  da_physics: true, xray: false,                   // the first window's `physics` · X-ray, every window's disc seen under a veil of the plate, preview only (4.72, #346)
  da_wh_link: false,                               // the first window's width and height linked, as every window's `wh_link` (#358, beta 4.57)
  gd_k_edge: 1, gd_k_axes: 0, gd_k_win: 1, gd_k_rings: 1, gd_k_sel: 4, gd_w: 1.0,
  // shadows: preview only, never in a file (R5, R26). One light, far away: it comes from a clock angle (sh_from, degrees)
  // at a height over the dial (sh_rise, degrees above the plate's face). Each hand floats at its own height over the
  // plate (mm); the cap's top is the top of the stack; the date discs lie sh_disc mm under the plate's face. A thing
  // of height z casts its shape shifted by z / tan(rise), away from the light, onto everything lower; each surface
  // keeps only the part that falls on it — so a shadow steps where it crosses a hand or a window's edge.
  // sh_dark: how dark, 0–100 %. sh_blur: a small soft edge (on/off only). The starting values are Okay's (14 Oct
  // 2026, 23:05, a picture of the list: "these in the image are the default values"); the movement, not chosen yet,
  // will fix the real heights.
  sh_on: true, sh_from: 270, sh_rise: 35, sh_dark: 25, sh_blur: false,
  sh_bevel: 100,                                   // the hands' bevels' strength, 0–100 % (Okay, 19 Oct 2026: "Hand bevel off on default, add an adjuster"): a hand's own Bevel tick turns its bevel on (HAND_BASE.bevel, off to start); 100 = as 4.77 drew them
  sh_hour: 0.15, sh_minute: 0.35, sh_second: 0.6, sh_cap: 0.75, sh_disc: 0.15,
  gd_more: [],                                     // guides added by hand: lines, crosshairs, circles (GUIDE_MORE). gd_k_rings and gd_k_sel: unread, a ring's guide has the ring's own colour
  // the next five keys are unread: old settings files carry them (R8). Nothing writes them any more.
  gd_c: [0.0, 0.55, 0.9, 1], gd_strength: 50.0,
  gd_sel_c: [1.0, 0.45, 0.0, 1], gd_sel_strength: 95.0, gd_sel_w: 1.5,
};

/** units a length can be shown and typed in: [short name, name, how many make a millimetre, extra decimals].
 *  Only for the window: every setting, link and file stays in mm (R1). The list only grows at its end (R9).
 *  A ligne is the watchmakers' unit for movement sizes: 2.2558 mm. */
export const UNITS = [["mm", "Millimetres", 1, 0], ["pt", "Points", 72 / 25.4, 0], ["in", "Inches", 1 / 25.4, 2], ["lig", "Lignes", 1 / 2.2558, 1],
  ["thou", "Thou", 1 / 0.0254, -1]];      // thou: a thousandth of an inch (Okay, 16 Oct 2026, #299); one decimal fewer than mm. Only grows at its end (R9)

/** the eight colours a guide can have: six neons, a dark and a light (Okay, 12 Oct 2026). The list only grows at its end (R9). */
export const DISC_WARN = [0.9, 0.22, 0.17];        // a disc past the case, with physics on: its edge in red (A4)
export const GUIDE_COLOURS = ["#FF2D95", "#00E5FF", "#39FF14", "#FFE600", "#FF6A00", "#7A5CFF", "#111111", "#FFFFFF"];
/** the five kinds of guide: [key of its eye, key of its colour, name]. */
export const GUIDE_KINDS = [["gd_edge", "gd_k_edge", "Dial edge"], ["gd_axes", "gd_k_axes", "Centre lines"], ["gd_win", "gd_k_win", "Window radii"],
  ["gd_rings", "gd_k_rings", "Ring edges"], ["gd_sel", "gd_k_sel", "Selected ring"], ["gd_hole", "gd_k_hole", "Centre hole"]];      // only grows (R9)
/** a ring's guide has the ring's own colour (Okay, 13 Oct 2026: "connect guides to layers"). Rings that have none
 *  of their own yet take one by their place in the list, in this order — neighbours never alike ("default guide colors
 *  come scrambled"). → a place in GUIDE_COLOURS, or null for none */
export const RING_GUIDE_ORDER = [4, 0, 2, 5, 3, 1];
// the windows' own order (#301, beta 4.43.2): yellow first, so the first window's guide is no other guide's colour to
// start with (until then the rings' order from its end: cyan, the centre hole's)
export const WINDOW_GUIDE_ORDER = [3, 5, 2, 0, 4, 1];
export const GUIDE_FADE = 0.4;                     // a ring's or window's guide out of focus, with "All": this much of it (#301)
export const ring_guide = (S, i) => { const g = S.rings[i] ? S.rings[i].guide : -2; return g === -2 ? null : g >= 0 && g < GUIDE_COLOURS.length ? g : RING_GUIDE_ORDER[i % RING_GUIDE_ORDER.length]; };
/** a window's guide, as a ring's (#271): its own colour, or one by its place — from the end of the rings' order, so a
 *  window's first colours are not the first rings' */
export const window_guide = (S, i) => { const w = windows_of(S)[i], g = w ? w.guide ?? -1 : -2; return g === -2 ? null : g >= 0 && g < GUIDE_COLOURS.length ? g : WINDOW_GUIDE_ORDER[i % WINDOW_GUIDE_ORDER.length]; };
/** how near and how far from the centre a shape reaches: [least, most] radius in mm, or null. A straight edge counts
 *  its nearest point; a curve is read at eight points along it (#272: a ring's and a window's guides). */
export function radial_extent(path) {
  let lo = Infinity, hi = 0, px = 0, py = 0;
  const see = (x, y) => { const r = Math.hypot(x, y); if (r < lo) lo = r; if (r > hi) hi = r; };
  for (const c of path ? path.d : []) {
    if (c[0] === "M") { see(c[1], c[2]); px = c[1]; py = c[2]; }
    else if (c[0] === "L") {
      const dx = c[1] - px, dy = c[2] - py, len = dx * dx + dy * dy, t = len ? Math.max(0, Math.min(1, -(px * dx + py * dy) / len)) : 0;
      see(px + t * dx, py + t * dy); see(c[1], c[2]); px = c[1]; py = c[2];
    } else if (c[0] === "C") {
      for (let s = 1; s <= 8; s++) { const t = s / 8, u = 1 - t; see(u * u * u * px + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5], u * u * u * py + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6]); }
      px = c[5]; py = c[6];
    }
  }
  return lo <= hi ? [lo, hi] : null;
}
/** guides you add yourself (S.gd_more): [{kind, a, r, k}] — kind: a place in this list · a: clock angle · r: radius in mm
 *  · k: a place in GUIDE_COLOURS, -2 = none. line: a diameter at angle a · crosshair: a small cross at angle a and
 *  radius r, to mark a point · circle: radius r. The list only grows at its end (R9). */
export const GUIDE_MORE = ["line", "crosshair", "circle"];
export const NOT_GEOMETRY = ["t", "guides", "xray", "bezel", "strap", "c_strap", "wearos_name", "ui_section", "ui_ring", "ui_hand", "ui_window", "ui_preview", "ui_scale", "ui_unit"];
/** a set of files (#171): its tick's key, its words, the kind export() writes, and what it writes it as — the colour
 *  files plain (not a mask, not mirrored), the masks as said; the print sheet as Print says. */
export const FILE_SET = [
  ["out_f_pdf", "Dial · PDF", "pdf", { out_production: false, out_mirror: false }],
  ["out_f_svg", "Dial · SVG", "svg", { out_production: false, out_mirror: false }],
  ["out_f_png", "Dial · PNG", "png", { out_production: false, out_mirror: false }],
  ["out_f_mask", "Mask · PDF", "pdf", { out_production: true, out_mirror: false }],
  ["out_f_mirrored", "Mirrored mask · PDF", "pdf", { out_production: true, out_mirror: true }],
  ["out_f_mask_png", "Mirrored mask · PNG", "png", { out_production: true, out_mirror: true }],
  ["out_f_sheet", "Print sheet · PDF", "sheet", {}],
];
export const NOT_GEOMETRY_PREFIX = ["c_", "ha_", "out_", "gd_", "sh_"];
export const GEOMETRY_AFTER_ALL = ["out_hidden_cut"];      // under a quiet prefix, but it changes the rings' shapes (#221)

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
  text: (R) => ({ r: round(R * 0.35 * 100) / 100, count: 1, start: 180, custom: "AUTOMATIC", size: 1.2 }),      // one word under the centre, as a dial's remark (#297)
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
  // a new ring keeps a guide colour of its own from the start: the first in the order that no ring shows yet
  const taken = new Set(S.rings.map((r, i) => ring_guide(S, i)));
  ring.guide = RING_GUIDE_ORDER.find((k) => !taken.has(k)) ?? RING_GUIDE_ORDER[S.rings.length % RING_GUIDE_ORDER.length];
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
  // bevels from before a hand had its own tick: Bevels % above 0 drew them on every hand, so a hand that doesn't say gets one (a link
  // made since always says, lean())
  if ("sh_bevel" in over && +over.sh_bevel > 0) for (const h of HANDS) { const raw = over["ha_" + h]; if (!raw || !("bevel" in raw)) S["ha_" + h] = { ...(S["ha_" + h] || {}), bevel: true }; }
  for (const h of HANDS) S["ha_" + h] = complete(HAND_BASE, S["ha_" + h]);
  S.windows = [0, 1, 2].map((i) => ({ ...clone(WINDOW_BASE), ...((Array.isArray(S.windows) && S.windows[i]) || {}) }));
  S.ui_window = min(max(parseInt(S.ui_window) || 0, 0), 3);
  S.ui_ring = min(max(parseInt(S.ui_ring) || 0, 0), S.rings.length - 1);
  S.ui_preview = 0;
  return S;
}

// ── a dial as a link ─────────────────────────────────────────
//   A link carries only what differs from the starting values, so it stays short. The starting values may change
//   (R31 as replaced, 16 Oct 2026: "previous links may die"), but a change that would make an existing link draw
//   something else — a starting value, the key table, the alphabet — raises LINK_SCHEME, and a link of another
//   scheme is not read: the tool opens the First dial and says so.
//   Scheme 2 (beta 4.43, #278 and #246's lossless parts): the lean settings, every key written as its code from
//   LINK_KEYS, colours as hex, numbers to 3 decimals, the time to the second → JSON → deflate → Crockford's base 32
//   (capitals and digits, no I L O U), after the scheme's number. Scheme 3 (beta 4.88): the same writing, after "3";
//   it went up because an am · pm window now draws its one disc whatever its old `look`, so a scheme-2 link with the
//   Sky or Band picture would draw something else. Links of schemes 1 and 2 are not read (R31).

export const LINK_SCHEME = 3;      // 3 since 4.88: an am · pm window draws its one disc whatever its old `look` (R31)

/** the topmost hand that shows: its place in HANDS, or -1 */
export const top_hand = (S) => [2, 1, 0].find((i) => S["ha_" + HANDS[i]].on) ?? -1;
/** the cap is part of the seconds hand (#262, beta 4.43): drawn with it; with no seconds hand, on the topmost hand
 *  only when asked (ha_cap_top). */
export const cap_shows = (S) => S.ha_on && S.ha_cap > 0 && (S.ha_second.on || (S.ha_cap_top && top_hand(S) >= 0));

// A key's code is its place in this list, written with CODE_DIGITS (one letter for the first 62, then two). The
// most used keys first, as counted in the Gallery's and the examples' links (16 Oct 2026). The list only ever grows
// at its end: a key moved or removed changes what every link says (then: a new scheme). The settings' keys inside
// a ring, a hand, a window and an added guide are coded too; a font's axes and features, a band's sector colours and
// a numeral's nudges are data and keep theirs.
export const LINK_KEYS = [
  "c", "r", "w", "name", "len", "kind", "count", "shape", "tail", "size", "family", "ps", "width", "start", "tip",
  "labels", "skip", "feature", "span", "c_plate", "rings", "c_cap", "ha_hour", "ha_minute", "ha_second", "mode",
  "ha_cap", "clear", "feature_at", "round", "num_from", "axes", "dial_d", "num_step", "twelve_gap", "taper",
  "custom", "every", "c_backdrop", "tracking", "round_in", "on", "twelve", "guide", "h", "frame", "round_out",
  "knock", "invert", "ha_beat", "da_on", "da_r", "da_w", "da_round", "da_frame", "da_clear", "da_day", "gd_axes",
  "cs", "margin", "wall", "da_at", "da_h", "da_ink", "windows", "at", "text", "ink", "text_c", "disc_c", "da_text_c",
  "da_disc_c", "gd_k_win", "gd_k_rings", "gd_k_sel", "gd_w", "nudge", "counter", "features", "disc_d", "mark_len",
  "mark_w", "da_size", "num_digits", "t", "guides", "dial_hole", "ha_on", "da_kind", "da_hour", "da_age", "da_shape",
  "da_sides", "da_turn", "da_text_turn", "da_family", "da_ps", "da_axes", "da_tracking", "da_lang", "da_features",
  "da_at_deg", "out_production", "out_mirror", "out_live_text", "out_dpi", "out_seconds", "out_fps", "out_px",
  "gd_edge", "gd_win", "gd_rings", "gd_sel", "gd_hole", "gd_k_hole", "gd_wins", "gd_wsel", "da_guide", "gd_k_edge",
  "gd_k_axes", "sh_on", "sh_from", "sh_rise", "sh_dark", "sh_blur", "sh_hour", "sh_minute", "sh_second", "sh_cap",
  "sh_disc", "gd_more", "gd_c", "gd_strength", "gd_sel_c", "gd_sel_strength", "gd_sel_w", "offset", "file", "scale",
  "twelve_scale", "lang", "fill", "num_again", "anchor", "fit", "w_scale", "mark", "hour", "age", "sides", "turn",
  "text_turn", "at_deg", "a", "k", "ha_cap_top",
  "mark_as", "mark_c",      // 4.45.4 (#300): appended; starting as a hole, so every scheme-2 link draws as before
  "from",                   // 4.47 (#257): appended; starting at the outer end, as always, so every scheme-2 link draws as before
  "mark_in",                // 4.52.2 (#344): appended; off to start, so every scheme-2 link draws as before
  "wh_link", "da_wh_link",  // 4.57 (#358): appended; off to start, and they draw nothing: only how W and H move together
  "follows", "names", "da_follows", "da_names", "date",      // 4.62: appended; a window follows the bar's date only when asked, so every older link shows its typed text
  "bezel",                  // 4.66: appended; no case to start, so every older link looks as before
  "wearos_name",            // 4.67: appended; empty to start
  "out_paper", "out_copies", "out_gap", "out_cutline",      // 4.75: appended; a print sheet's settings
  "neighbours", "da_neighbours",      // 4.74: appended; off to start, so every older link looks as before
  "look", "c2", "c3", "da_look", "da_c2", "da_c3",      // 4.73: appended; the picture as before (0) and its own colours (null), so every older link looks as before
  "xray", "physics", "da_physics",      // 4.72: appended; X-ray off and physics on to start, so every older link looks as before
  "strap", "c_strap",       // 4.69: appended; a case's strap — drawn only with a case, which older links don't have
  // ↑ 4.72–4.75 put their keys above 4.69's instead of under them, so each moved the codes of the ones before it: a
  // link made in 4.69–4.74 with a case's strap, X-ray, a window's picture or neighbours reads those wrongly since
  // (found 19 Oct 2026, 4.79). The order above is 4.75–4.78's, kept as it is, since the live page and saved dials
  // (#347) carry it. From here on: only ever under the last line, and test/link-keys.json says so (linktrip.mjs).
  "sh_bevel",               // 4.79: appended; off to start
  "hub", "bulge",           // 4.80: appended; no hub and the leaf as always to start, so every older link looks as before
  "bevel",                  // 4.89.1: appended; on to start, so every older link looks as before
  "out_window_content", "out_hidden_cut", "out_cutlines", "out_invert", "out_marks",
  "out_f_pdf", "out_f_svg", "out_f_png", "out_f_mask", "out_f_mirrored", "out_f_mask_png", "out_f_sheet",      // beta 5 (#171): appended; what a set of files holds
  "jump", "da_jump",        // beta 5 (#401): appended; off to start, the disc sweeps as before      // beta 5 (#219–#224): appended; each starts as files were, so every older link looks as before
];
const CODE_DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const code_of = (i) => (i < 62 ? CODE_DIGITS[i] : CODE_DIGITS[Math.floor(i / 62) - 1] + CODE_DIGITS[i % 62]);
const KEY_CODE = new Map(LINK_KEYS.map((k, i) => [k, code_of(i)]));
const CODE_KEY = new Map(LINK_KEYS.map((k, i) => [code_of(i), k]));
const SETTINGS_INSIDE = (k) => k === "rings" || k === "windows" || k === "gd_more" || k === "ha_hour" || k === "ha_minute" || k === "ha_second";

const is_colour = (v) => Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === "number" && x >= 0 && x <= 1);
const COLOUR_TEXT = /^#([0-9a-f]{6}|[0-9a-f]{8})$/;
const hex2 = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
/** a value as a link writes it: a colour as hex (its alpha only when not whole), a number to 3 decimals; a text
 *  starting with "#" gets a second one, so no text is ever read back as a colour. */
function squeeze(v) {
  if (is_colour(v)) return "#" + v.slice(0, 3).map(hex2).join("") + (v[3] === 1 ? "" : hex2(v[3]));
  if (typeof v === "number") return Math.round(v * 1000) / 1000;
  if (typeof v === "string") return v.startsWith("#") ? "#" + v : v;
  if (Array.isArray(v)) return v.map(squeeze);
  if (v && typeof v === "object") { const out = {}; for (const k in v) out[k] = squeeze(v[k]); return out; }
  return v;
}
function unsqueeze(v) {
  if (typeof v === "string") {
    if (!COLOUR_TEXT.test(v)) return v.startsWith("##") ? v.slice(1) : v;
    const n = (i) => +(parseInt(v.slice(1 + 2 * i, 3 + 2 * i), 16) / 255).toFixed(4);      // as the colour pop-out keeps a colour: 4 decimals
    return [n(0), n(1), n(2), v.length === 9 ? n(3) : 1];
  }
  if (Array.isArray(v)) return v.map(unsqueeze);
  if (v && typeof v === "object") { const out = {}; for (const k in v) out[k] = unsqueeze(v[k]); return out; }
  return v;
}
/** rename the settings' keys (with fn), at the top and inside a ring, a hand, a window, an added guide. */
function rekey(o, fn) {
  const out = {};
  for (const k in o) {
    const name = fn(k), v = o[k], inner = SETTINGS_INSIDE(fn === code_key ? name : k);
    out[name] = !inner ? v : Array.isArray(v) ? v.map((x) => (x && typeof x === "object" && !Array.isArray(x) ? rekey(x, fn) : x)) : v && typeof v === "object" ? rekey(v, fn) : v;
  }
  return out;
}
const key_code = (k) => KEY_CODE.get(k) ?? "!" + k;      // a key not in the list (from a file of another tool) travels as it is, marked
const code_key = (c) => (c.startsWith("!") ? c.slice(1) : CODE_KEY.get(c) ?? c);

/** the dial as a link's text (before deflate): lean, coded, squeezed; the time to the second. */
export function link_text(S) {
  const L = lean(S);
  if (typeof L.t === "number") L.t = Math.round(L.t);
  return JSON.stringify(squeeze(rekey(L, key_code)));
}
/** a link's text back to (lean) settings, or null if it isn't any. */
export function from_link_text(text) {
  const o = JSON.parse(text);
  return o && typeof o === "object" && !Array.isArray(o) ? unsqueeze(rekey(o, code_key)) : null;
}

// Crockford's base 32: five bits a letter; read forgiving — small letters, O for 0, I and L for 1, spaces and dashes skipped
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function base32(bytes) {
  let out = "", acc = 0, bits = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b; bits += 8;
    while (bits >= 5) { bits -= 5; out += B32[(acc >> bits) & 31]; }
    acc &= (1 << bits) - 1;
  }
  return bits ? out + B32[(acc << (5 - bits)) & 31] : out;
}
export function un_base32(text) {
  const out = [];
  let acc = 0, bits = 0;
  for (const ch of text.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1").replace(/[\s-]/g, "")) {
    const v = B32.indexOf(ch);
    if (v < 0) return null;
    acc = (acc << 5) | v; bits += 5;
    if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 255); acc &= (1 << bits) - 1; }
  }
  return Uint8Array.from(out);
}
/** what the part after # is: a scheme-2 dial's letters, a link of an older scheme, or not a dial at all. */
export function link_kind(hash) {
  const h = (hash || "").replace(/^#/, "");
  if (/^[23][0-9A-Za-z]+$/.test(h)) return { scheme: +h[0], letters: h.slice(1) };      // schemes 2 and 3: the same writing after their number
  if (/^[01]\.[A-Za-z0-9_~-]+$/.test(h)) return { scheme: +h[0] };
  return null;
}

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
  if ("sh_bevel" in out) for (const h of HANDS) out["ha_" + h] = { ...(out["ha_" + h] || {}), bevel: Boolean(S["ha_" + h] && S["ha_" + h].bevel) };      // with Bevels % in it, every hand says its Bevel, so fresh_settings never takes it for an older link
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
function key_of(d, skip = ["c", "cs", "name", "guide"]) {
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

/** does the font have a drawing for every character of `txt`? (A missing one comes back from HarfBuzz as glyph 0.)
 *  Web version only (R30). */
export function has_chars(txt, t) {
  const info = font_of(t), buffer = new HB.Buffer();
  buffer.addText(txt);
  buffer.guessSegmentProperties();
  HB.shape(info.font, buffer, []);
  return buffer.getGlyphInfosAndPositions().every((g) => g.codepoint !== 0);
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

/** the positions a ring uses, by number: for a band, its sectors. */
export const positions_of = (ring) => ring_angles(ring).map((_, i) => i).filter((i) => picked(ring, i));

/** the colour of a band's sector at position i: its own, or the ring's. */
export const sector_colour = (ring, i) => (ring.cs && ring.cs[String(i)]) || ring.c;

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

/** the mark at position i: its outer end on the ring's radius — or its middle, or its inner end (ring.from, #257). */
function mark_at(ring, i, a, grow = 0, solid = false) {
  const first = kind_of(ring) === "markers" && i === 0;
  const style = first ? TWELVES[ring.twelve] : "same";
  if (style === "none") return null;
  // a mark's own nudge, as a numeral's (#349, groundwork for editing one mark; Okay, 18 Oct 2026, notes 2: "Each individual
  // marker could be selected and edited"): radius ±, angle ±, size ×, turn — stored per position in the ring's `nudge`
  const n = (ring.nudge && ring.nudge[String(i)]) || {};
  const k = (first ? ring.twelve_scale : 1) * (n.s ?? 1);
  const L = ring.len * k, W = ring.w * k;
  // its own shape (4.78, #349: "a tick can grow or become anything else … a wedge"): nudge.shape, a place in SHAPES
  // after "as the ring" (0); a mark of its own shape keeps the ring's length, width and rounding
  const own = n.shape > 0 && SHAPES[n.shape - 1] && SHAPES[n.shape - 1] !== "file" ? SHAPES[n.shape - 1] : null;
  const shape = own ? mark_outline(ring, L, W, own, own === "wedge" ? 0 : null, grow, solid)
    : style === "triangle" ? mark_outline(ring, L * 1.1, W * 2.4, "wedge", 0, grow, solid) : mark_outline(ring, L, W, null, null, grow, solid);
  const b = shape.bounds();
  if (!b) return null;
  if (n.rot) shape.rotate(-n.rot, [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
  if (n.da) a += n.da;
  const extent = (b[3] - b[1]) - 2 * grow, width = (b[2] - b[0]) - 2 * grow;
  const r_mid = max(ring.r + (n.dr || 0) + from_shift(ring, extent) - extent / 2, 0.1);
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
  if (kind_of(ring) === "text") return Array.from({ length: n }, () => ring.custom || "");      // a text ring says its words at every position (#297)
  const [name, txt] = LABEL_SETS[ring.labels];
  if (name === "Custom") {
    const parts = ring.custom.split(",").map((s) => s.trim());
    return Array.from({ length: n }, (_, i) => parts[i] || "");
  }
  if (name === "Numbers") {
    const again = max(parseInt(ring.num_again) || 0, 0);       // 0: count on for ever
    return Array.from({ length: n }, (_, i) => number_label(ring.num_from + (again ? i % again : i) * ring.num_step, ring.num_digits));
  }
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
  const dy = numeral_dy(t, txt, size);
  const out = [];
  letters.forEach((ch, i) => {
    if (!ch.trim()) return;
    const own = advance(ch, t, size) - tr;
    const c = adv[i] + own / 2 - total / 2;        // letter centre along the word
    out.push([ch, flip ? a - degrees(c / r) : a + degrees(c / r), flip, [-own / 2, dy]]);
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

/** how far a numeral's outlines move up or down in their own space (baseline at 0, y up) so that its centre lands
 *  on the origin, which is then put on the radius (the edges add their shift in tangent_shift). Sideways a numeral is
 *  always centred. */
function numeral_dy(ring, txt, size) {
  // baseline and ascender are retired (Okay, 19 Oct 2026, #418: "Remove these two from the functions as well"):
  // their places in ANCHORS stay (R9) and a ring stored with one measures to the centre
  const b = text_path(txt, ring, size).bounds();
  return b ? -(b[1] + b[3]) / 2 : 0;
}

/** the radius that keeps the drawing still when what it measures to changes (#326; Okay, 18 Oct 2026: "Nothing changed …
 *  just the dotted line moves", and "My comment applies to reverse auto reverse"): marks and bands keep their outer edge
 *  (resize from: outer · middle · inner); numerals keep the middle of the label at the first position — exact for numerals
 *  turned with the ring (radial, auto-flip), whose anchors all lie on one line through the middle; for upright ones it
 *  holds the first label still. → the new radius for `ring` (as it is now) measured to `to`. */
export function radius_kept(ring, key, to) {
  if (key === "from") {
    const extent = kind_of(ring) === "band" ? ring.width : ring.len;
    return max(ring.r + extent * ((ring.from || 0) - to) / 2, 0);
  }
  const label = ring_labels(ring).find(Boolean);
  if (!label) return ring.r;
  const mode = MODES[ring.mode], a = ring.start || 0, size = ring.size;
  const middle = (anchor) => {      // the label's middle, as a distance from the centre, with the ring measured to `anchor`
    const R = { ...ring, anchor }, b = text_path(label, R, size).bounds();
    const up = b ? numeral_dy(R, label, size) + (b[1] + b[3]) / 2 : 0;      // how far the middle stands above the radius, in the numeral's own up
    const out = mode === "upright" ? up * cos(a * PI / 180) : mode === "on path" ? 0 : up * (mode === "radial, auto-flip" && a % 360 > 90 && a % 360 < 270 ? -1 : 1);
    return ring.r + out + (mode === "on path" ? 0 : tangent_shift(R, mode, a, label, size));
  };
  return max(ring.r + middle(ring.anchor || 0) - middle(to), 0);
}

/** placement, radius, angle, size and rotation of the numeral at position i, nudge included. */
function numeral_setup(ring, i, a) {
  const n = ring.nudge[String(i)] || {};
  return [MODES[ring.mode], ring.r + (n.dr || 0), a + (n.da || 0), ring.size * (n.s ?? 1), n.rot || 0];
}

/** how far a numeral's middle stands from the radius when the ring is tangent (#338): its ink's reach toward the dial's
 *  edge — the box's corner in that direction for an upright numeral, half its height for one turned with the ring.
 *  → 0 for the other anchors. Outer edge: inward (−), inner edge: outward (+). */
function tangent_shift(ring, mode, a, label, size) {
  const anchor = ANCHORS[ring.anchor];
  if (anchor !== "outer edge" && anchor !== "inner edge") return 0;
  const b = text_path(label, ring, size).bounds();
  if (!b) return 0;
  const w = b[2] - b[0], h = b[3] - b[1], t = a * PI / 180;
  const reach = mode === "upright" ? abs(sin(t)) * w / 2 + abs(cos(t)) * h / 2 : h / 2;
  return anchor === "outer edge" ? -reach : reach;
}

function numeral_at(ring, i, a0, label) {
  const [mode, r0, a, size, rot] = numeral_setup(ring, i, a0);
  const r = mode === "on path" ? r0 : r0 + tangent_shift(ring, mode, a, label, size);
  if (mode === "on path") {
    const p = on_path(label, r, a, ring, size);
    if (rot) p.rotate(-rot, clock_point(r, a));
    return p;
  }
  const p = text_path(label, ring, size), b = p.bounds();
  if (b) p.translate(-(b[0] + b[2]) / 2, numeral_dy(ring, label, size));
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
  return [{ ...base, txt: label, at: [-c[0], numeral_dy(ring, label, size)], steps }];
}

/** a scene item as live text, or null if it has none: {texts, removed}. removed = what knockouts
 *  and the windows' clear zones cut away from the outlines; live text can't be cut, so a file
 *  hides that area with a clipping mask. */
export function live_texts(S, statik, item) {
  if (item.role === "ring" && has_text(item.ring.ring)) {
    const d = item.ring, ring = d.ring, angles = ring_angles(ring), labels = ring_labels(ring);
    const removed = d.path !== d.shape ? d.shape.difference(d.path) : null;
    return { texts: d.keep.filter((i) => labels[i]).flatMap((i) => numeral_live(ring, i, angles[i], labels[i])), removed: removed && !empty(removed) ? removed : null };
  }
  if (item.role === "date number") {
    const x = statik.windows.find((w) => w.index === item.window);
    if (!x || !["date", "day"].includes(WINDOW_KINDS[x.w.kind]) || window_shape(x.w) === "arc") return null;      // bent text (#166) stays outlines
    const t = window_type(S, x.w), size = text_room(x.w) * x.w.size / 100, c = text_centre(x.w.text, t, size);
    if (!c) return null;
    const turn = x.w.text_turn ? window_turn(x.w) : 0;
    return { texts: [{ txt: x.w.text, t, size, fill: x.w.text_c || x.w.ink, at: [-c[0], -c[1]], steps: [["t", ...clock_point(x.w.r, window_angle(x.w))], ...(turn ? [["r", -turn, 0, 0]] : [])] }], removed: null };
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
    if (kind === "numerals" || kind === "text") {
      const labels = ring_labels(ring);
      for (const i of keep) {
        if (labels[i]) { parts.push(numeral_at(ring, i, angles[i], labels[i])); taken.push(angles[i]); at.push(i); }
      }
    } else {                                       // band
      const n = max(parseInt(ring.count) || 1, 1);
      const length = ring.span / n * min(max(ring.fill, 0), 100) / 100;
      const outer = ring.r + from_shift(ring, ring.width);      // the radius measures to the band's outer edge, its middle or its inner edge (#257)
      for (const i of keep) { parts.push(sector(outer - ring.width, outer, angles[i], angles[i] + length)); at.push(i); }
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
/** where a window stands, in clock degrees: one of the named places (at), or a time of its own (at_deg; beta 4.34). */
export const window_angle = (w) => w.at_deg ?? DATE_AT[w.at][1];
/** …and how that place is said: "3", "4:30", "2:15". */
export const window_place = (w) => {
  if (w.at_deg == null) return DATE_AT[w.at][0];
  const minutes = Math.round((((w.at_deg % 360) + 360) % 360) * 2) % 720, h = Math.floor(minutes / 60) || 12, m = minutes % 60;      // half a degree is a minute
  return m ? `${h}:${String(m).padStart(2, "0")}` : String(h);
};

/** every visible ring, top first: its positions, what it skips, what knocks it out.
 *
 *  skip      — drop positions where the chosen rings above have a mark (bands have no positions).
 *  knock out — cut gaps (clearance) round the shapes of the chosen rings above.
 *  cut       — the date window's clear zone; markers and numerals also leave its position empty. */
function build_rings(S, cut = null) {
  const holes = windows_of(S).filter((w) => w.on).map(window_angle), done = [];
  for (const ring of S.rings) {
    // a hidden ring is left out, unless hidden rings still cut (#221, Export › Print): then it skips and knocks out
    // the rings under it as if it were there, and is not drawn (a ghost) — so a film made by hiding rings keeps its holes
    if (!ring.on && !S.out_hidden_cut) continue;
    const kind = kind_of(ring), angles = ring_angles(ring);
    let keep = angles.map((_, i) => i).filter((i) => picked(ring, i));
    if (kind === "markers" || kind === "numerals" || kind === "text") keep = keep.filter((i) => !holes.some((a) => near(angles[i], a)));
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
    const d = { ring, kind, keep, taken, shape, at, parts, path: memo(key, final), ghost: !ring.on };
    // a band whose sectors have colours of their own is drawn as one shape per colour: the sectors of that
    // colour, cut like the whole ring. Which sectors go together is remembered, not which colour they have.
    if (kind === "band" && at.some((i) => ring.cs && ring.cs[String(i)])) {
      const groups = new Map();
      at.forEach((i, j) => { const c = JSON.stringify(sector_colour(ring, i)); groups.set(c, [...(groups.get(c) || []), j]); });
      d.tints = [...groups.values()].map((js) => ({
        at: at[js[0]],                             // one of its sectors: where its colour is read
        path: memo("tint" + key + JSON.stringify(js), () => merge(js.map((j) => parts[j])).intersection(d.path)),
      }));
    }
    done.push(d);
  }
  return done.filter((d) => !d.ghost);
}

// ── windows: date · day · am–pm · moon phase ─────────────────
//   A window is a hole in the plate with something showing through from below, drawn on white.
//   Everything is in the window's own space first (its centre at the origin, upright), then moved
//   to its position. Filled shapes only (R4).

function date_key(S) {
  const all = windows_of(S).map((w) => { const k = { ...w }; delete k.ink; delete k.text_c; delete k.disc_c; return k; });
  return JSON.stringify(all) + JSON.stringify(TYPE_KEYS.map((a) => date_type(S)[a]));      // (a window's own font is among its keys)
}

/** a window's text uses the type of the top numerals ring… */
function date_type(S) {
  return S.rings.find((ring) => kind_of(ring) === "numerals") || RING_BASE;
}
/** …unless the window has a font of its own (13 Oct 2026): then that font, plain, with the ring's tracking and language —
 *  unless the window has those of its own too (beta 4.26). */
export function window_type(S, w) {
  const t = date_type(S);
  if (!w) return t;
  // with a font of its own: that font, its own axes and features. Without: the numerals' type, and over it whatever
  // the window has of its own (an axis, a feature) — nothing, on every dial made before beta 4.30
  const more = Object.keys(w.axes || {}).length > 0 || w.features != null;
  const own = w.ps ? { ...t, family: w.family, ps: w.ps, axes: w.axes || {}, features: w.features || {} }
    : more ? { ...t, axes: { ...t.axes, ...(w.axes || {}) }, features: { ...t.features, ...(w.features || {}) } } : t;
  return w.tracking == null && w.lang == null ? own : { ...own, tracking: w.tracking ?? t.tracking, lang: w.lang ?? t.lang };
}
/** how far a window is turned, in clock degrees, when it turns with its radius: from the quarter before it
 *  (4 o'clock: 30°, half past four: 45°, as on movement makers' dial drawings). On a quarter: 0. */
export const window_turn = (w) => (w.turn && window_shape(w) !== "arc" ? ((window_angle(w) % 90) + 90) % 90 : 0);

/** the moon window, from its width alone: an arch over two humps. The moon, a disc as big as a hump,
 *  rises from behind the left hump (new), stands clear in the middle (full) and sets behind the right one.
 *  → {opening (the arch), moon}: the night sky is the hole minus the moon — the moon alone, no stars (Okay, 20 Oct
 *  2026, 01:33: "for all moon face illustrations. please remove the stars. all now include the moon only, exclusively") */
function moon_parts(w, age) {
  const m = w / 4, base = -0.36 * w;               // hump and moon radius · the bottom edge
  const arch = circle(2 * 0.5336 * w).translate(0, base + 0.1864 * w).intersection(new Path().rect(-w, base, 2 * w, 2 * w));
  const opening = arch.difference(circle(2 * m).translate(-m, base)).difference(circle(2 * m).translate(m, base));
  const f = (((age % 29.53) + 29.53) % 29.53) / 29.53;           // 0 new · 0.5 full · 1 new again
  const moon = circle(2 * m).translate(-m * cos(PI * f), base - 0.3 * m + (Math.sqrt(3) + 0.3) * m * sin(PI * f));
  return { opening, moon };
}

/** the moon as it is lit at an age (days), a disc of radius rm round the origin: {disc, lit, dark}. Waxing the right
 *  side is lit, waning the left (as seen from the north); the terminator is half an ellipse, as wide as the cosine of
 *  the phase angle (4.73). */
function moon_lit(rm, age) {
  const f = (((age % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS) / SYNODIC_DAYS, c = cos(2 * PI * f), wx = Math.max(Math.abs(c) * rm, 0.001);
  const disc = circle(2 * rm), half = disc.intersection(new Path().rect(0, -rm - 1, rm + 1, 2 * rm + 2));
  const ell = new Path().oval(-wx, -rm, 2 * wx, 2 * rm);
  let lit = c > 0 ? half.difference(ell) : half.union(ell);
  if (f > 0.5) lit = lit.scale(-1, 1);
  return { disc, lit, dark: disc.difference(lit) };
}
const SYNODIC_DAYS = 29.530588853;
/** an am · pm window's disc, for a hole w wide: two plain halves, pm in the picture's colour and am the disc's
 *  (Okay, 19 Oct 2026: "one half of a circle each … minimalize inside graphics"). It turns on the hole's flat side,
 *  (0, -w/4), once a day: at hour 0 the pm half fills the hole, at 12 the am half. → {night (the pm half), r} */
function half_disc(w, hour) {
  const R = w / 2, pivot = [0, -w / 4], turn = (((hour % 24) + 24) % 24) / 24 * 360;
  const night = sector(0, R + DISC_PAD, -90, 90).rotate(-turn).translate(...pivot);
  return { night, r: R };
}
/** the room a date or day window's text is sized from (its Size % of it): the hole's height (rectangle, arc), half an
 *  arch's width, a round hole's Ø. With its neighbours showing (4.74), no more than the disc's step from one place to
 *  the next — a hole made tall to show them keeps the shown date its size. */
function text_room(w) {
  const shape = window_shape(w), high = shape === "rectangle" || shape === "arc" ? w.h : shape === "arch" ? w.w / 2 : w.w;
  if (!w.neighbours) return high;
  const n = WINDOW_KINDS[w.kind] === "day" ? 7 : 31;
  return Math.min(high, 2 * PI * w.r / n);
}
/** a big date's gap between its two holes: an eighth of its width. */
const pair_gap = (w) => w.w / 8;
/** a date or day window's disc, place by place (4.72, 4.74): the places it carries, the one shown, and any place p's
 *  print in the dial's space — as the window prints its own, turned (p − now) steps clockwise round the dial's centre. */
function disc_places(S, w) {
  const kind = WINDOW_KINDS[w.kind], shape = window_shape(w), high = text_room(w);
  const lang = MOMENT_LANGS[w.names] || "en";
  const list = kind === "date" ? Array.from({ length: 31 }, (_, i) => String(i + 1))
    : (MOMENT_NAMES[w.follows ? lang : (MOMENT_LANGS.find((l) => MOMENT_NAMES[l].days.includes(w.text)) || "en")]).days;
  const now = Math.max(list.indexOf(kind === "date" ? String(parseInt(w.text, 10)) : String(w.text)), 0), n = list.length;      // "07" is the 7th
  const type = window_type(S, w), size = high * w.size / 100, centre = clock_point(w.r, window_angle(w)), turn = window_turn(w), a = window_angle(w);
  const at = (p) => {
    const t = list[((p % n) + n) % n], one = shape === "arc" ? on_path(t, w.r, a, type, size)
      : (turn && w.text_turn ? centred(text_path(t, type, size)).rotate(-turn) : centred(text_path(t, type, size))).translate(...centre);
    return one.rotate(-(p - now) * 360 / n);
  };
  return { list, now, n, at, key: JSON.stringify([kind, list, now, w.r, w.at, w.at_deg, w.turn, w.text_turn, shape, size, type]) };
}
/** a picture's colours not set by the person (4.73): the moon's shade (light, dawn and dusk belonged to the am · pm pictures retired in 4.88; kept, R9). */
export const PICTURE_TONES = { shade: [0.5, 0.5, 0.52, 1], light: [0.95, 0.86, 0.6, 1], dawn: [0.91, 0.65, 0.71, 1], dusk: [0.91, 0.59, 0.35, 1] };

/** a window's hole, in its own space (centre at the origin, upright), and the same hole grown by d all round.
 *  rectangle: width × height, corners rounded · circle: Ø = width · polygon: sides, inscribed in Ø = width, a flat
 *  side down, corners rounded · arch: the moon's, from its width · arc: a piece of a ring through the window's
 *  centre, as long as its width along the circle and as thick as its height (a day window at 12). */
function window_hole(w) {
  const shape = window_shape(w);
  if (shape === "rectangle") return [rounded_rect(w.w, w.h, w.round), (d) => rounded_rect(w.w + 2 * d, w.h + 2 * d, w.round + d)];
  // circles, polygons and arcs grow by their measures, as rectangles do (#168, 14 Oct 2026): growing a curve by
  // stroking it (offset) bulged a circle up to 6 % at 45° — the "four-petal blob" Okay saw on a stroked frame
  if (shape === "circle") return [circle(w.w), (d) => circle(w.w + 2 * d)];
  if (shape === "polygon") {
    const n = min(max(parseInt(w.sides) || 6, 3), 24), R = w.w / 2;
    const make = (d) => {                          // every side moves out by d: the corners by d / cos(180°/n), their rounding by d
      const Rd = R + d / cos(PI / n);
      const points = Array.from({ length: n }, (_, i) => { const a = radians(180 / n + i * 360 / n); return [Rd * sin(a), -Rd * cos(a)]; });
      return poly(points, points.map(() => min(w.round, R * 0.9) + d));
    };
    return [make(0), make];
  }
  if (shape === "arc") {
    const a = window_angle(w), c = clock_point(w.r, a);
    const make = (d) => {                          // thicker by d each side, longer by d at each end (along its middle circle)
      const half = degrees((w.w / 2 + d) / max(w.r, 0.1));
      return sector(max(w.r - w.h / 2 - d, 0), w.r + w.h / 2 + d, a - half, a + half).translate(-c[0], -c[1]);
    };
    return [make(0), make];
  }
  if (shape === "pair") {                          // a big date's two square holes side by side, as wide as the window together, a gap between (4.74)
    const gap = pair_gap(w), cw = (w.w - gap) / 2, dx = (cw + gap) / 2;
    const make = (d) => rounded_rect(cw + 2 * d, w.h + 2 * d, w.round + d).translate(-dx, 0).union(rounded_rect(cw + 2 * d, w.h + 2 * d, w.round + d).translate(dx, 0));
    return [make(0), make];
  }
  if (shape === "half") {                          // half a circle, its flat side down, as wide as the window (an am · pm Half, 4.73); its middle on the window's place
    const make = (d) => circle(w.w + 2 * d).intersection(new Path().rect(-w.w, -d, 2 * w.w, w.w)).translate(0, -w.w / 4);
    return [make(0), make];
  }
  const hole = moon_parts(w.w, 0).opening;         // the arch: its humps are hollow, so it grows by stroking
  return [hole, (d) => offset(hole.copy(), d)];
}

/** the hour of the day the time shown is in, 0 to 24, in steps of six minutes: what an am · pm window shows, and
 *  when it has to be drawn again (the disc turns 1.5° in six minutes). */
export const day_hour = (S) => Math.floor((((S.t % 86400) + 86400) % 86400) / 360) / 10;
/** …and the hour a window's disc stands at: the day's hour, or with Jump (#401) the middle of its half — at noon the
 *  am half fills the hole all morning, at midnight the pm half all afternoon and evening (half_disc's turning). */
export const disc_hour = (S, w) => (w.jump ? (day_hour(S) < 12 ? 12 : 0) : day_hour(S));
export const shows_day = (S) => windows_of(S).some((w) => w.on && WINDOW_KINDS[w.kind] === "am · pm");

/** the day the dial shows: the bar's date, or today where it is opened (S.date "", 4.62). */
export function shown_day(S) {
  if (S.date) return S.date;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** a window as it shows now: one that follows the date (4.62) says the moment's date or weekday, and a moon window its
 *  age, from the bar's date and the time (moment.js); any other shows its own typed text and age, as before. */
export function shown_window(S, w) {
  if (!w.follows) return w;
  const kind = WINDOW_KINDS[w.kind], mo = moment(shown_day(S), S.t);
  if (kind === "date" || kind === "day" || kind === "big date") return { ...w, text: window_text(kind === "big date" ? "date" : kind, mo, MOMENT_LANGS[w.names] || "en") };
  if (kind === "moon phase") return { ...w, age: +mo.moon.toFixed(1) };
  return w;
}

/** one window, built: {w (its settings), index, window (the hole), frame, cutline, number (what shows through it),
 *  clear (keep-out zone)}. Everything is made upright in the window's own space, then turned (if it turns with its
 *  radius) and moved to its place. */
function build_window(S, w, index) {
  const centre = clock_point(w.r, window_angle(w)), kind = WINDOW_KINDS[w.kind], shape = window_shape(w), turn = window_turn(w);
  const [opening, grown] = window_hole(w);
  const high = shape === "rectangle" || shape === "arc" ? w.h : shape === "arch" ? w.w / 2 : w.w;       // the room for what shows, top to bottom
  let content;
  let more = [];                                   // a picture's further colours: [{path, key, or}] (4.73)
  if (kind === "moon phase" && w.look === 1) {      // Phase: the sky in the picture's colour, the lit moon the disc's, its dark side the shade
    const rm = 0.36 * high, { disc, dark } = moon_lit(rm, w.age);
    content = opening.copy().difference(disc);
    more = [{ path: dark, key: "c2", or: PICTURE_TONES.shade }];
  } else if (kind === "moon phase" && w.look === 2) {      // Line: one ink — the moon's outline, its dark side filled
    const rm = 0.36 * high, t = Math.max(0.05 * high, 0.06), { dark } = moon_lit(rm, w.age);
    const ring = circle(2 * rm).difference(circle(2 * (rm - t)));
    content = merge([ring, dark]).intersection(opening);
  } else if (kind === "moon phase") {
    const { moon } = moon_parts(w.w, w.age);
    content = opening.copy().difference(moon);
  } else if (kind === "am · pm") {                 // the disc under the half-round hole, turning on its flat side once a day: pm in the picture's colour, am the disc's
    content = half_disc(w.w, disc_hour(S, w)).night.intersection(opening);
  }
  else if (kind === "big date") {                 // the tens in the left hole (none before 10), the units in the right (4.74)
    const n = parseInt(w.text, 10), [tens, units] = Number.isFinite(n) ? [n >= 10 ? String(Math.floor(n / 10) % 10) : "", String(n % 10)] : [String(w.text)[0] || "", String(w.text)[1] || ""];
    const dx = ((w.w - pair_gap(w)) / 2 + pair_gap(w)) / 2, t = window_type(S, w), size = w.h * w.size / 100;
    content = merge([tens && centred(text_path(tens, t, size)).translate(-dx, 0), units && centred(text_path(units, t, size)).translate(dx, 0)].filter(Boolean));
  } else if (shape === "arc") {                     // an arc window's word bends along its middle circle, as numerals on path do;
    const a = window_angle(w);                     // read left → right at the bottom too (#166, atlas 2.1, 14 Oct 2026)
    content = on_path(w.text, w.r, a, window_type(S, w), text_room(w) * w.size / 100).translate(...centre.map((v) => -v));
  } else content = centred(text_path(w.text, window_type(S, w), text_room(w) * w.size / 100));
  const put = (p, turned = true) => (turn && turned ? p.rotate(-turn) : p).translate(...centre);
  const shows_text = kind === "date" || kind === "day" || kind === "big date";
  const win = put(opening.copy());
  more = more.map((m) => ({ ...m, path: put(m.path.intersection(opening)) }));
  if (w.neighbours && (kind === "date" || kind === "day")) {      // its disc's places either side, where the hole lets them show (4.74)
    const D = disc_places(S, w), near = merge([-2, -1, 1, 2].map((d) => D.at(D.now + d))).intersection(win);
    if (!empty(near)) more.push({ path: near, key: "c2", like_number: true });      // in the number's own colour unless given one (Okay, 19 Oct 2026, 23:11: "why are the rest of the numbers gray? actual color please")
  }
  return {
    w, index, window: win, number: put(content, !shows_text || w.text_turn),      // a hole's picture turns with it; its text only if asked
    more,
    frame: w.frame > 0 ? put(grown(w.frame)).difference(win) : null,
    cutline: put(grown(0.05)).difference(win),                 // aperture outline for production
    clear: put(grown(w.frame + w.clear)),                      // keep print clear of the hole
  };
}

// ── a window's disc (#346, 4.72) ─────────────────────────────
// what turns under the plate and shows through a window. A date or day window's disc is a band round the dial's
// centre, as a movement's date ring: as wide as the hole reaches, DISC_PAD more each side, every place printed on it
// as the window prints its own, each turned to stand where it will read upright under the window; the next place a
// step clockwise (moment.js disc_turn). An am · pm window's disc is a small one turning on the hole's bottom edge, half
// night, half day. A moon window has none yet: its moon is drawn moving along its path, not carried on a disc.
export const DISC_PAD = 0.3, DISC_RIM = 0.5;       // mm: the disc past the hole each side · the case's rim it must stay inside (physics)
/** x: a built window (statik.windows). → {band, print, inner, outer, centre, reach, fits} in mm on the dial, or null.
 *  band: the disc · print: what is printed on it · inner, outer: its edges round its own centre · reach: how far from
 *  the dial's centre it goes · fits: inside the case less the rim, or physics off. */
export function window_disc(S, x) {
  const w = x.w, kind = WINDOW_KINDS[w.kind], R = S.dial_d / 2, room = R - DISC_RIM;
  const centre = clock_point(w.r, window_angle(w)), turn = window_turn(w);
  const put = (p, turned = true) => (turn && turned ? p.rotate(-turn) : p).translate(...centre);
  const shape = window_shape(w), high = shape === "rectangle" || shape === "arc" ? w.h : shape === "arch" ? w.w / 2 : w.w;      // as build_window
  if (kind === "date" || kind === "day") {
    const e = radial_extent(x.window);
    if (!e) return null;
    const inner = Math.max(e[0] - DISC_PAD, 0), outer = e[1] + DISC_PAD;
    const D = disc_places(S, w), print = memo("disc" + D.key, () => merge(D.list.map((_, p) => D.at(p))));
    return { band: circle(2 * outer).difference(circle(2 * inner)), print, inner, outer, centre: [0, 0], reach: outer, fits: w.physics === false || outer <= room };
  }
  if (kind === "am · pm") {                      // its disc turns on the hole's flat side
    const { night, r } = half_disc(w.w, disc_hour(S, w)), rho = r + DISC_PAD;
    const band = put(circle(2 * rho).translate(0, -w.w / 4)), print = put(night.copy());
    const off = put(new Path().rect(-0.001, -w.w / 4 - 0.001, 0.002, 0.002)).bounds(), pv = [(off[0] + off[2]) / 2, (off[1] + off[3]) / 2];
    const reach = Math.hypot(...pv) + rho;
    return { band, print, inner: 0, outer: rho, centre: pv, reach, fits: w.physics === false || reach <= room };
  }
  return null;
}

/** the disc of window i, built fresh from the settings (the panel asks before the dial is drawn again). */
export function disc_of(S, i) {
  const w = windows_of(S)[i];
  return w && w.on ? window_disc(S, build_window(S, shown_window(S, w), i)) : null;
}

// ── everything that doesn't move ─────────────────────────────

export function build_static(S) {
  const windows = windows_of(S).map((w, i) => (w.on ? build_window(S, shown_window(S, w), i) : null)).filter(Boolean);
  const cut = windows.length === 0 ? null : windows.length === 1 ? windows[0].clear : merge(windows.map((x) => x.clear)).removeOverlap();
  let plate = circle(S.dial_d);
  for (const x of windows) plate = plate.difference(x.window);
  // the centre hole (#165): cut in the plate; the hands' pipes fill it, so it shows only while the hands are hidden
  // (Okay, 14 Oct 2026: "if we hide hands it will show"). hole: the opening · plate_holed: the plate with it cut ·
  // hole_line: its outline for a production mask, as a window's cutline
  const d = S.dial_hole > 0 ? min(S.dial_hole, S.dial_d) : 0;
  const hole = d > 0 ? circle(d) : null;
  return { plate, plate_holed: hole ? plate.difference(hole) : plate, hole, hole_line: hole ? circle(d + 0.1).difference(hole) : null,
    rings: build_rings(S, cut), windows, date: windows[0] || null };
}

/** the thinnest lines a dial asks for, read from its settings (#225; the guide's reviewers, 15 Oct 2026: "the Export log
 *  could name the thinnest line of a dial"): every shown ring's mark width (a wedge's at its base; the smallest nudged
 *  size counted), a band's width, each shown hand's width, each shown window's frame; and every knock-out's clearance,
 *  the narrowest gap. Numerals and text have no stroke width to read, so they are named, not measured.
 *  → { lines: [[what, mm]] thinnest first, gaps: [[what, mm]], unmeasured: [ring names] } */
export function thinnest(S) {
  const lines = [], gaps = [], unmeasured = [];
  for (const ring of S.rings) {
    if (!ring.on) continue;
    const kind = kind_of(ring), name = ring.name || kind;
    if (kind === "ticks" || kind === "markers") {
      const sizes = Object.values(ring.nudge || {}).map((n) => n.s ?? 1);
      const k = Math.min(1, ...sizes, kind === "markers" && ring.twelve_scale < 1 ? ring.twelve_scale : 1);
      lines.push([`${name}${SHAPES[ring.shape] === "wedge" ? " (wedge, at its base)" : ""}`, ring.w * k]);
    } else if (kind === "band") lines.push([name, ring.width]);
    else unmeasured.push(name);
    if (ring.knock > 0) gaps.push([`${name}'s clearance`, ring.clear]);
  }
  if (S.ha_on) for (const [key, word] of [["ha_hour", "Hour hand"], ["ha_minute", "Minute hand"], ["ha_second", "Seconds hand"]]) {
    const h = { ...HAND_BASE, ...(S[key] || {}) };
    if (h.on) lines.push([word, h.w * (h.w_scale || 1)]);
  }
  windows_of(S).forEach((w, i) => { if (w.on && w.frame > 0) lines.push([`Window ${i + 1}'s frame`, w.frame]); });
  const by = (a, b) => a[1] - b[1];
  return { lines: lines.filter((l) => l[1] > 0).sort(by), gaps: gaps.sort(by), unmeasured };
}

/** what a mono print mask loses (#220): a ring that lies on a ring below it in another colour. On the dial the two
 *  inks tell them apart; a mask has one ink, so the upper ring's shapes merge into the lower one and vanish. Not
 *  lost: a ring knocked out of the one below (the lower ring is cut round it, so the mask keeps it), or two rings of
 *  one colour (the colour export merges them too). → [{ top, under }] ring names, top first. statik: build_static's. */
export function mask_merges(statik) {
  const out = [], rings = statik.rings, colour = (d) => JSON.stringify([d.ring.c, d.ring.cs || null]);
  rings.forEach((top, i) => {
    if (empty(top.path)) return;
    for (const under of rings.slice(i + 1)) {
      if (empty(under.path) || colour(top) === colour(under)) continue;
      const both = top.path.intersection(under.path), b = both && both.bounds();
      if (b && (b[2] - b[0]) * (b[3] - b[1]) > 1e-4) out.push({ top: top.ring.name, under: under.ring.name });      // more than a sliver where two edges touch
    }
  });
  return out;
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
function hand_outline(shape, L, W, T, tip, F, at, R = 0, bulge = 37.5) {
  tip = min(max(tip, 0), L);
  const shaft = (top, r_top) => poly([[-W / 2, -T], [W / 2, -T], [W / 2, top], [-W / 2, top]], [R, R, r_top, r_top]);
  const pointed = () => poly([[-W / 2, -T], [W / 2, -T], [W / 2, L - tip], [0, L], [-W / 2, L - tip]], [R, R, 0, 0, 0]);
  if (shape === "baton") return shaft(L, R);
  if (shape === "pencil") return pointed();
  if (shape === "sword") return poly([[0, L], [W / 2, L - tip], [W * 0.4, -T], [-W * 0.4, -T], [-W / 2, L - tip]], [0, 0, R, R, 0]);
  if (shape === "dauphine") return new Path().polygon([0, L], [W / 2, at], [0, -T], [-W / 2, at]);
  if (shape === "leaf") {
    const k = 0.55, a = (bulge / 100 - 0.225) * L, b = (bulge / 100 + 0.225) * L;      // at 37.5: 0.15 L and 0.6 L, the leaf of every version before 4.80
    return new Path().moveTo([0, -T]).curveTo([W * k, a], [W * k, b], [0, L])
      .curveTo([-W * k, b], [-W * k, a], [0, -T]).closePath();
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
    let p = shape === "disc" ? disc_hand(h) : hand_outline(shape, h.len, h.w, h.tail, h.tip, h.feature, h.feature_at / 100 * h.len, h.round || 0, h.bulge ?? 37.5);
    if (h.wall > 0) p = p.difference(offset(p, -h.wall));
    if (h.hub > 0 && shape !== "disc") p = p.union(circle(h.hub));      // its hub, solid even on a hollow hand (#370)
    if (h.counter > 0) p = p.union(place(circle(h.counter), -h.tail * COUNTER_AT, 0));
    return p;
  });
}

/** where a hand is widest, for the handles on its picture (#368): its height up the hand in mm, the number that moves
 *  it and how much that number changes per mm. Only for the shapes whose widest place is their width's own (a
 *  dauphine's corners, a leaf's bulge, the shoulder of a pencil's or a sword's point); null for the rest. */
export function hand_widest(h) {
  const shape = HAND_SHAPES[h.shape], L = h.len, T = h.tail;
  if (shape === "dauphine") return { at: h.feature_at / 100 * L, key: "feature_at", per_mm: 100 / L };
  if (shape === "leaf") return { at: (6 * (h.bulge ?? 37.5) / 100 * L + L - T) / 8, key: "bulge", per_mm: 100 * 8 / (6 * L) };      // the curves' middle (t = ½): (P0 + 3 P1 + 3 P2 + P3) / 8
  if (shape === "pencil" || shape === "sword") return { at: L - min(max(h.tip, 0), L), key: "tip", per_mm: -1 };
  return null;
}

/** a disc hand, pointing at 12: the disc with its one marker. Disc and marker are one colour, so where the marker lies
 *  on the disc it is cut out of it (the dial shows through), and where it reaches past the disc it is ink. */
function disc_hand(h) {
  const disc = circle(max(h.disc_d, 0.1)), placed = disc_mark(h);
  if (!placed) return disc;
  if (h.mark_as === 1) return disc.union(placed);      // a mark: the disc whole and the marker with it; the scene paints the marker again, in its own colour
  return disc.difference(placed).union(placed.difference(disc));
}
/** a disc hand's marker, upright, its outer end at the hand's Length (null if it has no size). */
export function disc_mark(h) {
  return memo("mark" + key_of(h), () => {
    const mark_ring = { ...RING_BASE, shape: h.mark, len: h.mark_len, w: h.mark_w, round_out: h.round || 0, round_in: h.round || 0 };
    const mark = mark_outline(mark_ring, h.mark_len, h.mark_w), b = mark.bounds();
    if (!b) return null;
    const outer = h.mark_in ? min(h.len, max(h.disc_d, 0.1) / 2) : h.len;      // kept inside the disc (#344)
    return place(mark, max(outer - (b[3] - b[1]) / 2, 0.1), 0);
  });
}
/** a disc hand whose marker is painted on (#300) */
export const paints_mark = (h) => HAND_SHAPES[h.shape] === "disc" && h.mark_as === 1;

/** the hands that are on, bottom first: [name, colour, upright shape, clock angle]. */
function hand_items(S, t) {
  const angles = hand_angles(t, BEATS[S.ha_beat][1]);
  return HANDS.map((name, i) => [name, S["ha_" + name].c, S["ha_" + name], angles[i]])
    .filter(([, , h]) => h.on).map(([name, c, h, a]) => [name, c, hand_shape(h), a, h]);
}

// ═════════════════════════════════════════════════════════════
//  3 · DRAWING — the scene
// ═════════════════════════════════════════════════════════════


/** what to draw, bottom to top. Every export and the preview read this list (R26).
 *
 *  Each item: role · path (mm; a hand's is upright, see angle) · fill (RGBA, null for guides)
 *  · angle (clock angle for hands, else 0). Rings add ring (their entry in static.rings) and
 *  index (their place in S.rings); hands add name; guides add stroke and px (screen points).
 *  selected = index of the ring being edited; its guides are drawn stronger. */
/** a mask's production marks (#224; the guide's reviewers, 15 Oct 2026: "no blank outline or registration marks"): the
 *  blank's outline, a 0.1 mm ring just outside the dial's edge, so the film is laid on the blank by it; and a
 *  registration mark in each corner of the page — a ring with a cross through it, 4 mm across — so two films (one per
 *  ink, #35) are laid on each other by them. The corners lie outside the dial's circle, so they hold a mark even on a
 *  page with no margin; a mark that would come closer than 1 mm to the dial is made smaller, and none is drawn under
 *  1.5 mm (production_marks_fit says so). Filled shapes (R4). → [[role, path]] */
export const REG_MARK = 4, REG_LINE = 0.1;
export function production_marks(S) {
  const H = page_mm(S) / 2, out = [["outline", circle(S.dial_d + 2 * REG_LINE).difference(circle(S.dial_d))]];
  const m = production_mark_size(S);
  if (!m) return out;
  const at = H - m / 2 - 0.5;                      // the mark's centre: half a millimetre in from the page's corner
  for (const [sx, sy] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
    const ring = circle(m * 0.6).difference(circle(m * 0.6 - 2 * REG_LINE));
    const cross = new Path().rect(-m / 2, -REG_LINE / 2, m, REG_LINE).union(new Path().rect(-REG_LINE / 2, -m / 2, REG_LINE, m));
    out.push(["registration", ring.union(cross).translate(sx * at, sy * at)]);
  }
  return out;
}
/** how big the registration marks can be on this page (mm), or 0 if a corner can't hold one 1.5 mm across. */
export function production_mark_size(S) {
  const R = S.dial_d / 2, H = page_mm(S) / 2;
  // a mark m across, centred at (c, c) with c = H - m/2 - 0.5, stands c·√2 from the dial's centre; the disc round it
  // (radius m/√2, its cross's ends) must keep 1 mm off the dial's edge
  const fits = (m) => (H - m / 2 - 0.5) * Math.SQRT2 - m / Math.SQRT2 >= R + 1;
  for (let m = REG_MARK; m >= 1.5; m -= 0.25) if (fits(m)) return m;
  return 0;
}

export function scene(S, statik, t, preview = true, selected = null) {
  const items = [];
  const add = (role, path, fill, more = {}) => {
    if (path) items.push({ role, path, fill, angle: 0, ...more });
  };
  const windows = statik.windows;
  // a window's colours come from the settings as they are now, not the still parts' copy: a colour changed doesn't
  // rebuild them (app.js set_value), so the copy can be a step behind (Okay, 20 Oct 2026, 01:33: "moon face colors
  // selector does not work … changing radius refreshes and fixes color issue")
  const set_now = windows_of(S), now_w = new Map();
  const wc = (x) => { if (!now_w.has(x.index)) now_w.set(x.index, set_now[x.index] ? shown_window(S, set_now[x.index]) : x.w); return now_w.get(x.index); };
  const rings = statik.rings.slice().reverse();    // bottom ring first, top ring last
  const index = (d) => S.rings.indexOf(d.ring);

  if (S.out_production) {                          // mono mask, no plate, no hands
    const black = [0, 0, 0, 1], cuts = S.out_cutlines !== false;      // #222: the cut lines only while asked for (they are on to start)
    for (const d of rings) add("ring", d.path, black, { ring: d, index: index(d) });
    for (const x of windows) {
      add("date frame", x.frame, black, { window: x.index });
      if (cuts) add("cutline", x.cutline, black, { window: x.index });
    }
    if (statik.hole_line && cuts) add("hole", statik.hole_line, black);
    if (S.out_invert) {                            // #223: toner on the blank everywhere but the marks — the dial's disc less all of the above, one shape
      const marks = merge(items.map((i) => i.path));
      items.length = 0;
      add("inverted", empty(marks) ? circle(S.dial_d) : circle(S.dial_d).difference(marks.removeOverlap()), black);
    }
    if (S.out_marks) for (const [role, path] of production_marks(S)) add(role, path, black);      // #224: the blank's outline, registration marks in the corners
  } else {
    // X-ray (4.72, #346; rewritten 4.88 — Okay, 19 Oct 2026: "Xray makes the unseen full visible, sensible z height
    // differences (not editable) and a stacking order. Selected shows above all others. Top is 100% opacity, with a
    // white dotted outline, below gets -15 opacity gradually"). Preview only (R5, R26). The stack, top down: the
    // selected window's disc · the hands · the face (plate, rings, what the holes show) · the other discs, the
    // biggest deepest, as a movement stacks them. Each layer under the top one is 15 % fainter than the one above.
    const discs = preview && S.xray ? windows.map((x) => ({ x, d: window_disc(S, x) })).filter((v) => v.d) : [];
    const xray = discs.length > 0, chosen = xray ? discs.find((v) => v.x.index === (S.ui_window ?? 0)) || null : null;
    const under = discs.filter((v) => v !== chosen).sort((p, q) => q.d.outer - p.d.outer);      // the biggest first: the deepest
    const layers = (chosen ? 1 : 0) + 1 + 1 + under.length;      // the selected disc · the hands · the face · each other disc
    const dim = (fill, layer) => (xray && fill ? [...fill.slice(0, 3), fill[3] * Math.max(1 - 0.15 * layer, 0.25)] : fill);      // layer 0 at the top
    const face = chosen ? 2 : 1, hands_layer = chosen ? 1 : 0;
    under.forEach(({ x, d }, i) => {
      const layer = face + 1 + (under.length - 1 - i);
      add("disc", d.band, dim(wc(x).disc_c || [1, 1, 1, 1], layer), { window: x.index });
      add("disc print", d.print, dim(wc(x).text_c || wc(x).ink, layer), { window: x.index });
    });
    for (const x of windows) {                     // what shows through each hole, on white
      if (S.out_window_content === false) continue;      // #219: the holes alone, for a printer who prints the face
      add("date disc", x.window, dim(wc(x).disc_c || [1, 1, 1, 1], face), { window: x.index });
      add("date number", x.number, dim(wc(x).text_c || wc(x).ink, face), { window: x.index });
      for (const m of x.more || []) add("date picture", m.path, dim(wc(x)[m.key] || (m.like_number ? wc(x).text_c || wc(x).ink : m.or), face), { window: x.index });      // a picture's further colours (4.73)
    }
    add("plate", S.ha_on ? statik.plate : statik.plate_holed, dim(S.c_plate, face));      // the hole shows when the hands are hidden
    for (const d of rings) {
      if (d.tints) d.tints.forEach((tint, n) => add("ring", tint.path, dim(sector_colour(d.ring, tint.at), face), { ring: d, index: index(d), part: n + 1 }));
      else add("ring", d.path, dim(d.ring.c, face), { ring: d, index: index(d) });
    }
    for (const x of windows) add("date frame", x.frame, dim(wc(x).ink, face), { window: x.index });
    if (S.ha_on) {
      for (const [name, colour, path, a, h] of hand_items(S, t)) {
        add("hand", path, dim(colour, hands_layer), { name, angle: a });
        if (paints_mark(h) && disc_mark(h)) add("mark", disc_mark(h), dim(h.mark_c, hands_layer), { name, angle: a });      // a disc's painted mark turns with it (#300)
      }
      if (cap_shows(S)) add("cap", circle(S.ha_cap), dim(S.c_cap, hands_layer));
    }
    if (chosen) {                                  // the selected window's disc on top, whole, with a white dotted outline
      const { x, d } = chosen;
      add("disc", d.band, wc(x).disc_c || [1, 1, 1, 1], { window: x.index });
      add("disc print", d.print, wc(x).text_c || wc(x).ink, { window: x.index });
      add("disc edge", circle(2 * d.outer).translate(...d.centre), null, { stroke: [1, 1, 1, 1], px: 1.5, dots: true, window: x.index });
      if (d.inner > 0) add("disc edge", circle(2 * d.inner).translate(...d.centre), null, { stroke: [1, 1, 1, 1], px: 1.5, dots: true, window: x.index });
    }
  }

  if (preview && S.guides) {                       // never exported (R5)
    const R = S.dial_d / 2;
    const colour = (key) => {                      // a place in GUIDE_COLOURS → RGBA
      const hex = GUIDE_COLOURS[S[key]] || GUIDE_COLOURS[0];
      return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).concat([1]);
    };
    const round_guide = (r, key, px) => add("guide", circle(2 * r), null, { stroke: colour(key), px });
    const line_guide = (p0, p1) => add("guide", new Path().line(p0, p1), null, { stroke: colour("gd_k_axes"), px: S.gd_w });
    // the dial edge's guide is gone (Okay, 15 Oct 2026): gd_edge is no longer read; nor the windows' radii (gd_win), since
    // each window has guides of its own (below, #271). The centre hole has its own, first in the list; while the hole
    // is being sized it shows whatever the guides are set to (gd_hole_live, from the window: Okay, 16 Oct 2026, #267)
    if ((S.gd_hole || S.gd_hole_live) && S.dial_hole > 0) round_guide(S.dial_hole / 2, "gd_k_hole", S.gd_w);
    if (S.gd_axes) {
      line_guide([-R, 0], [R, 0]);
      line_guide([0, -R], [0, R]);
    }
    const tone = (k, a = 1) => { const hex = GUIDE_COLOURS[k] || GUIDE_COLOURS[0]; return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).concat([a]); };
    const stroke_guide = (path, k, px = S.gd_w, a = 1) => add("guide", path, null, { stroke: tone(k, a), px });
    // a ring's edges, in the ring's own guide colour; the selected ring's half as thick again. Which rings: all
    // (gd_rings), only the selected one (gd_sel alone), or none.
    // its outer and inner edges whole, its middle dotted (Okay, 16 Oct 2026, #272: "center of the ring is dotted. All
    // rings and windows get their own outer and inner guide circles in solid line"). Numerals: the edges their figures
    // reach as drawn. A window: the edges its hole reaches; which windows, as for rings (gd_wins, gd_wsel).
    // A ring's dotted line is its radius — where it is resized from (#257, 4.47: the outer end, the middle or the inner
    // end of its marks; a numeral's anchor); a window's is its middle.
    const built = new Map(statik.rings.map((d) => [d.ring, d]));
    const edges = (k, outer, inner, px, a, at = (outer + inner) / 2) => {
      for (const r of [...new Set([outer, inner])]) if (r > 0) stroke_guide(circle(2 * r), k, px, a);
      if (outer - inner > 0.01 && at > 0) add("guide", circle(2 * at), null, { stroke: tone(k, a), px, dots: true });
    };
    // one thing in focus (#301; Okay, 16 Oct 2026, on 4.43: "both window and [ring] active gives us a complex look"):
    // the tab one works in says what — on Rings its selected ring, on Windows its selected window, on the others
    // neither (the dial's own guides, centre hole and lines, show in every tab). "All" still shows every ring or
    // window, those out of focus faded, as Blender fades what one isn't editing.
    const focus = { 1: "rings", 3: "windows" }[S.ui_section];      // ui_section: the tab's place (app.js SECTIONS; R9)
    const faded = (focused) => (focused ? 1 : GUIDE_FADE);
    S.rings.forEach((ring, i) => {
      const focused = focus === "rings" && i === selected, chosen = focused && S.gd_sel, k = ring_guide(S, i);
      if (!ring.on || k === null || !(S.gd_rings || chosen)) return;
      const kind = kind_of(ring);
      const extent = { ticks: ring.len, markers: ring.len, band: ring.width }[kind] || 0;
      let outer = ring.r + from_shift(ring, extent), inner = outer - extent;
      if (has_text(ring)) { const e = radial_extent(built.get(ring)?.path); if (e) [inner, outer] = e; }
      edges(k, outer, inner, focused ? S.gd_w * 1.5 : S.gd_w, faded(focused), ring.r);
    });
    for (const x of windows) {
      const focused = focus === "windows" && x.index === (S.ui_window ?? 0), chosen = focused && S.gd_wsel, k = window_guide(S, x.index), e = radial_extent(x.window);
      if (k === null || !e || !(S.gd_wins || chosen)) continue;
      edges(k, e[1], e[0], focused ? S.gd_w * 1.5 : S.gd_w, faded(focused));
      // its disc's edges, dashed, in the window's colour — the outer one red when the disc passes the case with physics on (4.72, #346)
      const d = window_disc(S, x);
      if (d) {
        const px = focused ? S.gd_w * 1.5 : S.gd_w, a = faded(focused);
        for (const r of [d.inner, d.outer]) if (r > 0) add("guide", circle(2 * r).translate(...d.centre), null, { stroke: r === d.outer && !d.fits ? [...DISC_WARN, a] : tone(k, a), px, dashes: true });
      }
    }
    for (const g of S.gd_more || []) {              // the guides added by hand
      if (!(g.k >= 0)) continue;
      const kind = GUIDE_MORE[g.kind], at = clock_point(g.r || 0, g.a || 0), arm = 1.2;      // a crosshair's arms, in mm
      if (kind === "line") stroke_guide(new Path().line(clock_point(R, g.a || 0), clock_point(R, (g.a || 0) + 180)), g.k);
      else if (kind === "crosshair") { stroke_guide(new Path().line([at[0] - arm, at[1]], [at[0] + arm, at[1]]), g.k); stroke_guide(new Path().line([at[0], at[1] - arm], [at[0], at[1] + arm]), g.k); }
      else if (kind === "circle" && g.r > 0) stroke_guide(circle(2 * g.r), g.k);
    }
  }
  return items;
}

/** a copy of an upright shape, turned to a clock angle (R2). */
export const turned = (path, angle) => path.copy().rotate(-angle);

/** everything on the dial that is measured in mm — what "scale everything with the diameter" changes. Not angles,
 *  counts, percentages or the page margin; and not the diameter itself, which the caller sets.
 *  measures(S) → the values, in a fixed order; set_measures(S, values) puts a list of the same length back. */
export const RING_MM = ["r", "len", "w", "width", "clear", "round_out", "round_in", "wall", "size", "twelve_gap"];
export const HAND_MM = ["len", "w", "tail", "tip", "feature", "counter", "wall", "round", "disc_d", "mark_len", "mark_w", "hub"];
export const WINDOW_MM = ["r", "w", "h", "round", "frame", "clear"];
function each_measure(S, visit, keys = null) {
  if (keys) {                                      // a chosen set: Weight's widths (#88)
    for (const ring of S.rings) for (const key of keys.ring) visit(ring, key);
    for (const h of HANDS) for (const key of keys.hand) visit(S["ha_" + h], key);
    for (const w of windows_of(S)) for (const key of keys.window) visit(w, key);
    return;
  }
  for (const ring of S.rings) {
    for (const key of RING_MM) visit(ring, key);
    for (const at of Object.keys(ring.nudge).sort()) if (ring.nudge[at].dr) visit(ring.nudge[at], "dr");      // a numeral's own radius ±
  }
  for (const h of HANDS) for (const key of HAND_MM) visit(S["ha_" + h], key);
  for (const w of windows_of(S)) for (const key of WINDOW_MM) visit(w, key);
  visit(S, "ha_cap");
}
/** every width on the dial — how thick a thing is, never how long or where (#88, Weight; atlas 6.19): a mark's width
 *  and a hollow one's wall, a band's width; a hand's width, its wall and its disc's mark; a window's frame. Numerals
 *  have no stroke width of their own (their font's weight is theirs). */
export const WEIGHT_KEYS = { ring: ["w", "width", "wall"], hand: ["w", "wall", "mark_w"], window: ["frame"] };
export function measures(S, keys = null) {
  const out = [];
  each_measure(S, (d, key) => out.push(d[key]), keys);
  return out;
}
export function set_measures(S, values, keys = null) {
  let i = 0;
  each_measure(S, (d, key) => { d[key] = values[i++]; }, keys);
}

/** the page's side in mm: the dial and its margins. */
export const page_mm = (S) => S.dial_d + 2 * S.margin;
