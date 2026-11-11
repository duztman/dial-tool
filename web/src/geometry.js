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

export const VERSION = "v1.1.80 beta";      // the name Okay gave this build (27 Oct 2026: "call this a v1.0 beta version from now on"); a small push counts in the third number (v1.0.1 beta), a step in the second (v1.1 beta)
export const MM = 72 / 25.4;                       // 1 mm in points (files only)

import { presets as WATCH_PRESETS } from "./watch.js";      // the case metals' colours: the bezel is case material (#582, 10 Nov 2026)
import { movement as MOVEMENT_OF, MOVEMENTS as MOVEMENTS_LIST } from "./movements.js";      // the movements' record (#587): a new dial's hand heights are the Miyota 8215's
const START_HEIGHTS = MOVEMENT_OF("miyota-8215").heights;
import { moment, window_text, day_list, LANGS as MOMENT_LANGS, NAMES as MOMENT_NAMES } from "./moment.js";      // the complications' engine: one moment, a date and the time (#346, 4.62)
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
export const ANCHORS = ["centre", "baseline", "ascender", "outer edge", "inner edge", "cap middle"];      // cap middle (#13, 4.90): every label on the middle of the font's capitals, not of its own ink      // the point of a numeral that sits on its ring's radius (web version, 13 Oct 2026). Only grows at its end (R9). The edges (4.53, #338; Okay, 18 Oct 2026: "Tangent to inner or outer"): every numeral's ink touches the radius from inside, or from outside
export const FROM = ["outer", "middle", "inner"];               // the point of a mark or a band that sits on its ring's radius: its outer end, its middle, its inner end (#257, 4.47). Only grows at its end (R9)
/** how far a mark's or band's outer edge lies outside the ring's radius: nothing when the radius measures to the outer
 *  end, half its extent from the middle, all of it from the inner end (#257). extent: the mark's length or the band's width. */
export const from_shift = (ring, extent) => extent * (ring.from || 0) / 2;
// the hands: the three every dial has, then the hands of your own (#577; Okay, 3 Nov 2026: "A plus sign next to the hands
// tabs, creates a new hand … Ask for function upfront, then add hand as normal") — each a key ha_<name>, its name its
// function. An added hand is on the dial once `added` is set (the + on the Hands tab); hidden (on: false) it keeps its tab.
// A new function is appended (R9: tabs and links count on the order).
export const FIXED_HANDS = ["hour", "minute", "second"];
export const ADDED_HANDS = ["gmt", "date", "day", "month"];      // appended only (R9): the + menu's order and the links count on it (gmt 9 Nov 2026; date · day · month 10 Nov 2026)
export const HANDS = [...FIXED_HANDS, ...ADDED_HANDS];
/** the word for a hand in every list: "Hour", "Seconds", "GMT"; hand_word("gmt") = "GMT hand", hand_word("hour", "lume") = "Hour lume" */
export const HAND_WORD = { hour: "Hour", minute: "Minute", second: "Seconds", gmt: "GMT", date: "Date", day: "Day", month: "Month" };
export const HAND_PLURAL = { hour: "Hours", minute: "Minutes", second: "Seconds", gmt: "GMT", date: "Date", day: "Day", month: "Month" };      // the Shadows pane's and show mode's Hands list's words
export const hand_word = (name, what = "hand") => (HAND_WORD[name] || name) + (what ? " " + what : "");
/** does this hand exist on the dial: a fixed hand always, an added one once its + was pressed */
export const hand_added = (S, name) => FIXED_HANDS.includes(name) || Boolean(S["ha_" + name] && S["ha_" + name].added);
// ── the functions a hand of your own can have (#577, the frame of 10 Nov 2026; Okay: "build a reasonable frame") ──
//   A function is a pair: the hand's angle rule and the scale ring it is read on. The + menu offers the pair; adding
//   one adds the hand and its ring (`fn` on the ring names the hand it serves), taking the hand off takes its ring too.
//   ask: the menu's words · places: how many positions its ring has (0: a time hand, its ring the 24 hours) ·
//   labels(lang): the names on its ring in the hand's language (MOMENT_LANGS: EN · TR · DE · FR · IT), as a watch prints
//   them — capitals · rings(S, R, lang): its scale rings over fresh numerals rings, one function may bring two (GMT: the
//   24 hours and the cities) · len(ring): the hand's length to its first ring.
//   The rings' look (Okay, 9 Nov 2026, 23:18: "a nice minimal default ring … All uppercase, condensed fonts. in a few
//   languages, gmt with timezones named. We already have similar dials"): the Gallery's World time dial's type — Barlow
//   Condensed Medium, tracked 50 — upright, in the dial's ink; sizes in mm for a Ø 30 dial, scaled with the radius; radii
//   shares of the radius. All of it a start: his to move or remove (Okay: "User can edit or remove as they wish").
//   The rules of the angles are in hand_angle: a time hand turns with the day, a calendar hand jumps at midnight to its
//   place as a date wheel, a day star or a month wheel does — the first place (1, Monday, January; 24 on the GMT
//   ring) at 12. Later functions (noted in the build list, #577): chronograph hands (a stopped state, not the time),
//   power reserve (a setting on an arc), sunrise · sunset and prayer times (the sun from a place and a date),
//   retrograde hands (an arc, flying back), a second 12-hour time with a day · night disc.
const SCALE_TYPE = { family: "Barlow", ps: "BarlowCondensed-Medium", tracking: 50, axes: {}, features: {} };      // the World time dial's cities (gallery.mjs)
const scale = (R, labels, r_share, size_mm, name, more = {}) => ({ ...SCALE_TYPE, labels: LABEL_SETS.findIndex((l) => l[0] === "Custom"), custom: labels.join(", "), count: labels.length, r: round(R * r_share * 100) / 100, size: round(size_mm * R / 15 * 100) / 100, mode: 0, name, ...more });
// the 24 cities of the world-time convention (Cottier; the Gallery's World time dial): one per hour of offset from London
// at 24 — a legend of the zones under the hours, LONDON 0 · PARIS +1 · … · AUCKLAND +12 · MIDWAY −11 · … · AZORES −1.
// On the ring they stand as three-letter codes (the airports' where there is one): the full names need a Ø 38 dial
// without big numerals (the World time dial); the codes fit inside the numerals of any dial
export const ZONE_CITIES = ["LONDON", "PARIS", "CAIRO", "ISTANBUL", "DUBAI", "KARACHI", "DHAKA", "BANGKOK", "HONG KONG", "TOKYO", "SYDNEY", "NOUMEA", "AUCKLAND", "MIDWAY", "HONOLULU", "ALASKA", "L. ANGELES", "DENVER", "CHICAGO", "NEW YORK", "CARACAS", "RIO", "S. GEORGIA", "AZORES"];
export const ZONE_CODES = ["LON", "PAR", "CAI", "IST", "DXB", "KHI", "DAC", "BKK", "HKG", "TYO", "SYD", "NOU", "AKL", "MDY", "HNL", "ANC", "LAX", "DEN", "CHI", "NYC", "CCS", "RIO", "SGS", "AZO"];
const upper = (words, lang) => words.map((w) => w.toLocaleUpperCase(MOMENT_LANGS[lang] || "en"));
const HOURS_24 = [24, ...Array.from({ length: 23 }, (_, i) => i + 1)];
export const FUNCTIONS = {
  gmt: { ask: "GMT — another time", places: 0, labels: () => HOURS_24,
    rings: (S, R) => [scale(R, HOURS_24, 0.47, 1.15, "24 hours"), scale(R, ZONE_CODES, 0.56, 0.62, "Zones", { mode: 3 })],      // the zones' codes on the path just outside the hours (the full names, ZONE_CITIES, need a Ø 38 dial without big numerals)
    len: (ring) => ring.r * 0.9 },
  date: { ask: "Date — a pointer date", places: 31, labels: () => Array.from({ length: 31 }, (_, i) => i + 1), rings: (S, R, lang, F) => [scale(R, F.labels(lang), 0.8, 0.9, "Date ring")], len: (ring) => ring.r - ring.size * 0.9 },
  day: { ask: "Day — the weekday", places: 7, labels: (lang) => upper((MOMENT_NAMES[MOMENT_LANGS[lang]] || MOMENT_NAMES.en).days, lang), rings: (S, R, lang, F) => [scale(R, F.labels(lang), 0.5, 1.0, "Day ring")], len: (ring) => ring.r * 0.9 },
  month: { ask: "Month", places: 12, labels: (lang) => upper((MOMENT_NAMES[MOMENT_LANGS[lang]] || MOMENT_NAMES.en).months, lang), rings: (S, R, lang, F) => [scale(R, F.labels(lang), 0.38, 0.95, "Month ring")], len: (ring) => ring.r * 0.9 },
};
/** what each added hand does, for the + menu: [name, the question's words] */
export const HAND_FUNCTIONS = ADDED_HANDS.map((h) => [h, FUNCTIONS[h].ask]);
/** the place a calendar hand points at for a moment: 0 = the first (the 1st, Monday, January); null for a time hand */
export const hand_place = (name, mo) => (name === "date" ? mo.d - 1 : name === "day" ? mo.wd : name === "month" ? mo.m - 1 : null);
export const HAND_SHAPES = ["baton", "pencil", "sword", "dauphine", "leaf", "arrow", "syringe", "breguet", "lollipop", "file", "disc"];      // disc: #164, 14 Oct 2026 (appended, R9)
export const DATE_AT = [["3", 90], ["4:30", 135], ["6", 180], ["9", 270], ["12", 0], ["1:30", 45], ["7:30", 225], ["10:30", 315], ["4", 120]];      // only grows at its end (R9); 4 added 13 Oct 2026 (Ronda's 4H dial drawing)
export const WINDOW_KINDS = ["date", "day", "am · pm", "moon phase", "big date"];      // big date appended (4.74, R9): two square holes, the tens and the units each on a disc of its own      // what a window shows (web version)
// the hole's shape, apart from what shows through it (Okay, 13 Oct 2026). 0, the start, is "as its kind": an arch for a
// moon phase, a rectangle for the others — what was drawn before there was a choice (R31). Only grows at its end (R9).
export const WINDOW_SHAPES = ["as its kind", "rectangle", "circle", "polygon", "arch", "arc", "half"];      // half: an am · pm window's own, chosen as a shape (20 Oct 2026; appended, R9)
export const window_shape = (w) => WINDOW_SHAPES[w.shape] && w.shape ? WINDOW_SHAPES[w.shape]
  : WINDOW_KINDS[w.kind] === "moon phase" ? (w.look ? "circle" : "arch") : WINDOW_KINDS[w.kind] === "am · pm" ? (w.ampm_form ? "rectangle" : "half")
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
  surface: 0, r_from: 0,                           // the case (#582): which ground the ring lies on, a place in SURFACES (dial · rehaut · bezel); how its radius reads there, a place in R_FROM — from the centre, as on the dial; from the surface's inner edge; Fit (a band as wide as the surface, marks as long, words on its middle). On the dial both are 0
  on_hand: "",                                     // surface "hand": which disc hand it lies on (Okay, 11 Nov 2026: "A disk hand is allowed a ring in it like rehault"), a name in HANDS
  fn: "",                                          // the hand this ring is the scale of (#577: "gmt", "date", …; "" for a ring of its own): added and removed with that hand
  r: 13.0, count: 12, start: 0.0, span: 360.0, every: 1, offset: 0, invert: false,
  skip: 0, knock: 0, clear: 0.25,
  shape: 0, file: "", scale: 1.0, len: 2.8, w: 0.7, taper: 0.35, round_out: 0.0, round_in: 0.0, wall: 0.0,
  twelve: 0, twelve_scale: 1.0, twelve_gap: 0.5,
  labels: 0, custom: "", num_from: 0.0, num_step: 5.0, num_digits: 0, mode: 0, size: 2.4, nudge: {},
  family: "Arimo", ps: "Arimo-Regular", tracking: 0.0, lang: 0, axes: {}, features: {},
  width: 1.0, fill: 100.0,
  num_again: 0,                                    // Numbers: the count starts again after this many positions (0 = never), as on Ferguson's dial or a two-hour track (13 Oct 2026)
  guide: -1,                                       // its guide's colour (preview only, R5): a place in GUIDE_COLOURS · -1 = one by its place in the list (ring_guide) · -2 = none (13 Oct 2026)
  anchor: 0,                                       // numerals: what the radius measures to, a place in ANCHORS. 0 = the text's centre, as before (R31)
  from: 0,                                         // ticks, markers, bands: what the radius measures to, a place in FROM — the mark's or band's outer end, its middle, or its inner end (Okay's notes, p. 9, #257: "resize from"). Starting at outer, every link draws as before (R31)
  cs: {},                                          // a band's sectors with a colour of their own: position → RGBA. Empty = all in the ring's colour (beta 4.6)
  ink_d: 0,                                        // an older file's step of this ring's ink from w_ink (#521); read once, into w_inks, by fresh_settings (R8)
  stroke_b: false,                                 // show mode's Inks: its stroke's colour split into two inks, the stroke printed with ink B (as ink_b; not in the link)
  ink_h: null, stroke_h: null,                     // show mode's Inks: this ring's own height, and its stroke's, mm — unlinked from its ink's (Okay, 3 Nov 2026, 02:11: "Share one height unless switched to separate heights"); null = the ink's. The file and the session, not the link
  ink_b: false,                                    // show mode's Inks (#545): with its colour split into two inks, this ring is printed with ink B; the file and the session, not the link (R7)
  // a stroke round the numerals or letters (#551; Okay, 30 Oct 2026: "good strokes, uniform. And round/sharp/miter
  // options"; 31 Oct: "Stroke on off, miter round sharp, inside middle outside of vector, and its color"): drawn as a
  // grown outline in its own colour, never a stroke in a file (R4). join: a place in STROKE_JOINS · side: in STROKE_SIDES
  stroke: false, stroke_w: 0.1, stroke_join: 0, stroke_side: 2, stroke_c: [0.85, 0.1, 0.1, 1],
  // a rhythm (#169; Okay, 2 Nov 2026: "Rhythm: give the user a dropdown of a few options and custom, L S system done
  // through actual lengths, dash and gap. Options for line dot and wedge for these"; 12:48: "gap is a gap, it does not
  // need to have a shape … leave only as length"): from the first position, dash marks then gap marks, again and again
  // round the ring; a dash has its own shape and length, a gap the ring's shape and its own length. rhythm: a place in
  // RHYTHMS (0 = none, the ring as it is) · rh_dash, rh_gap: how many of each, read only by Custom · rh_dash_shape: a
  // place in SHAPES, -1 = the ring's own · rh_*_len: in mm, a dot's its Ø; 0 = the ring's own, a dash's 1.5 times it
  rhythm: 0, rh_dash: 1, rh_gap: 4, rh_dash_shape: -1, rh_dash_len: 0, rh_gap_len: 0,
};
export const RHYTHMS = ["None", "Every 5th · dash 1, gap 4", "Quarters · dash 1, gap 14", "Every 3rd · dash 1, gap 2", "Alternate · dash 1, gap 1", "Custom"];
const RHYTHM_STEPS = [null, [1, 4], [1, 14], [1, 2], [1, 1]];      // dash, gap; Custom reads the ring's own
export const RHYTHM_CUSTOM = RHYTHMS.indexOf("Custom");
export const DASH_START = 1.5;                     // a dash with no length of its own: 1.5 times the ring's
/** a mark's shape and length from its ring's rhythm at position i — or null, no rhythm (#169). shape: a name in
 *  SHAPES, or null for the ring's own; len: its length in mm, a dot's Ø. */
export function rhythm_mark(ring, i) {
  if (!ring.rhythm || !["ticks", "markers"].includes(kind_of(ring))) return null;
  const [dash, gap] = RHYTHM_STEPS[ring.rhythm] || [max(1, round(ring.rh_dash) || 1), max(0, round(ring.rh_gap) || 0)];
  const is_dash = i % (dash + gap) < dash;
  const k = is_dash ? ring.rh_dash_shape : -1, own = k >= 0 && k < 3 ? SHAPES[k] : null;      // a gap keeps the ring's shape
  const len = (is_dash ? ring.rh_dash_len : ring.rh_gap_len) || rhythm_start_len(ring, own, is_dash);
  return { shape: own, len, dash: is_dash };
}
/** what a dash or gap measures when it has no length of its own: the ring's length (a dot's Ø), a dash 1.5 times it. */
export const rhythm_start_len = (ring, own, is_dash) => ((own || SHAPES[ring.shape]) === "dot" ? ring.w : ring.len) * (is_dash ? DASH_START : 1);
/** a mark's length before its own nudge — what the Every mark strip shows as 1 × (#169): the rhythm's, or the ring's. */
export const mark_length = (ring, i) => { const rh = rhythm_mark(ring, i); return rh ? rh.len : SHAPES[ring.shape] === "dot" ? ring.w : ring.len; };
export const STROKE_JOINS = ["Miter", "Round", "Bevel"];      // Illustrator's three (Okay, 31 Oct 2026: "Miter · Round · Bevel")
export const STROKE_SIDES = ["Inside", "Middle", "Outside"];  // which side of the outline the stroke stands on
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
  // the pipe's hole through the hub (#404; Okay, 3 Nov 2026: "The pipe's hole" at the centre, "both should be options"):
  // hole_as — 0 none (every hub before #404), 1 the common fit, the hole's Ø by the hand (HOLE_FIT), 2 its own Ø, hole (mm)
  hole_as: 0, hole: 1.0,
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
  // the disc hand as it starts when chosen in the tool (#574; Okay, 2 Nov 2026, 22:18: "the default dot is a wedge that is
  // an equilateral triangle 10% inwards from the edge … This dot gets a stroke if it's painted on"): mark_tri — a wedge
  // come to a point, pointing out from the centre (off: a wedge as a markers ring draws it, as every older dial);
  // mark_stroke_w · mark_stroke_c — a painted marker's stroke, outside its outline, its colour the hand's when null
  // (0: none, as every older dial; app.js gives a disc chosen in the tool 0.1)
  mark_tri: false, mark_stroke_w: 0, mark_stroke_c: null,
  // its bevel on or off (Okay, 19 Oct 2026: "on off from hand window"; 20 Oct 2026, 01:33: the tick "appears as soon as
  // show tick turned on"): the shading Shadows → Bevels % draws on a hand, per hand. Off to start ("Hand bevel off on
  // default", 19 Oct). An older link or file that drew bevels (Bevels % above 0, no per-hand key) gets them on every
  // hand when read (fresh_settings), so it draws as before (R31: no new scheme)
  bevel: false,
  // how the bevel shapes the hand's top (#531; Okay, 24 Oct 2026, his drawing: a pill switch beside Bevel; 2 Nov 2026,
  // 17:25: "Option A"), a place in BEVEL_LOOKS: 0 Ridge — two long halves meeting on the centre line, as every bevel
  // was drawn before (R31: no new scheme) · 1 Faceted — not offered, drawn as a Ridge (2 Nov 2026, 18:48: "facets
  // system does not work, remove for now, note for later", #573) · 2 Domed — round across, shaded from the middle out
  bevel_look: 0,
  facet_turn: 3,      // dead with Faceted (#573): kept, as every key is (R8); nothing reads it
  // its openings (#175; Okay, 2 Nov 2026, 21:52: "C · several shapes"): op_count shapes cut through the hand along it,
  // from op_from % to op_to % of its Length, op_gap mm between them, each op_w mm across — a Bar as long as its share,
  // a Dot round — open (op_fill see-through, alpha 0: the dial seen through) or filled with a lume (op_fill: a lume's colour, lume.js;
  // 22:38: "they only get lume"). Off to start, as every older dial (R31); C3 the lume to start, as drawn
  op_on: false, op_shape: 0, op_count: 3, op_from: 30, op_to: 92, op_w: 0.8, op_gap: 0.4, op_fill: [0.8941, 0.9176, 0.7608, 1],
  // a hand of your own (#577, 9 Nov 2026), read on the added hands only: added — it is on the dial (the + on the Hands
  // tab; off, the hand has no tab and never draws, so `on` is false too) · cycle — how a GMT hand turns, a place in
  // HAND_CYCLES: 0 once a day, read on a 24-hour ring with midnight at 12 (Okay: "Midnight at top") · 1 twice a day, a
  // second hour hand read on the ordinary numerals · offset — the other time, hours ahead of the time shown (half hours
  // for the half-hour zones; 0 to start)
  added: false, cycle: 0, offset: 0,
  fit_d: null,  // the hole's Ø when Hole is Fit (#586): the chosen movement's post for this hand; null = the common fit, HOLE_FIT
  motion: 0,    // a calendar hand's motion, a place in HAND_MOTIONS: 0 jumps at midnight as a date wheel does · 1 sweeps through the day (Okay, 11 Nov 2026: "weekday and stuff need to sweep or jump, with a selector")
  lang: 0,      // a calendar hand's names on its ring, a place in MOMENT_LANGS (EN · TR · DE · FR · IT); the Names pill
};
export const PLATE_METALS = ["Brass", "Bronze", "Steel", "Silver"];      // the plate's material (Okay, 11 Nov 2026: "Brass · Bronze · Steel · Silver"); R9: appended only
export const PLATE_METAL_COLOURS = [[0.78, 0.64, 0.36, 1], [0.64, 0.46, 0.30, 1], [0.66, 0.67, 0.68, 1], [0.85, 0.85, 0.84, 1]];      // their bare colours, the preview's middle tone
export const HAND_MOTIONS = ["Jump", "Sweep"];      // a calendar hand: jumps at midnight · sweeps through the day, the month or the year (R9: appended only)
export const HAND_CYCLES = ["24 h", "12 h"];      // a GMT hand's turn: once a day · twice a day (R9: appended only)
export const BEVEL_LOOKS = ["Ridge", "Faceted", "Domed"];      // R9: a new look is appended; Faceted (1) is not offered (#573) and draws as a Ridge

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
  day_form: 0,                                     // … and how they are written, a place in moment.js DAY_FORMS: short as before, in full, or your own (#515)
  own_names: null,                                 // your own words: a day window's seven (Custom), an am · pm window's two (Text); null or a blank = the tool's (#515, #516)
  ampm_form: 0,                                    // an am · pm window shows: 0 its disc under a half-round hole, as before · 1 its words, jumping at noon and midnight (#516)
  jump: false,                                     // an am · pm disc jumps at noon and midnight instead of sweeping (#401, 4.90; Okay, 19 Oct 2026, 14:13: "am pm gets a jump function on/off"); off, it sweeps, as before
  neighbours: true,                               // a date or day window shows its disc's places either side of the shown one, where the hole lets them (4.74; the disc sketch D1), in c2
  look: 0,                                         // its picture, a place in PICTURES[its kind] (4.73); 0 = as before
  c2: null, c3: null,                              // its picture's further colours (4.73): a moon's shade · an am · pm half's sun and moon · a band's dawn and dusk; null = the picture's own (PICTURE_TONES)
  physics: true,                                   // its disc stays inside the case (4.72, #346): passing it, its guide shows red and the panel says so; off for a face on a screen, where a disc may be bigger than the dial
  wh_link: false,                                  // width and height linked: one changed, the other keeps their ratio (#358, beta 4.57); off, so every link draws and behaves as before
  depth: null,                                     // its disc's depth under the plate, mm, for the shadows (#526, 4.95: a row per disc in the Shadows pane); null = the shared sh_disc
  frame_h: null,                                   // show mode's Inks: its frame's own height, mm, unlinked from its ink's; null = the ink's (02:11)
  frame_b: false,                                  // show mode's Inks (#545): with its frame's colour split into two inks, the frame is printed with ink B; the file and the session, not the link
  print_h: null,                                   // show mode's Inks (#545): how high what is printed on its disc stands, mm; null = INK_MM; the file and the session, not the link
};
const FIRST_WINDOW = { on: "da_on", kind: "da_kind", at: "da_at", r: "da_r", w: "da_w", h: "da_h", round: "da_round", frame: "da_frame",
  clear: "da_clear", text: "da_day", size: "da_size", ink: "da_ink", hour: "da_hour", age: "da_age",
  shape: "da_shape", sides: "da_sides", turn: "da_turn", text_turn: "da_text_turn", family: "da_family", ps: "da_ps", axes: "da_axes", text_c: "da_text_c", disc_c: "da_disc_c", guide: "da_guide", tracking: "da_tracking", lang: "da_lang", features: "da_features", at_deg: "da_at_deg", wh_link: "da_wh_link", follows: "da_follows", names: "da_names", physics: "da_physics", look: "da_look", c2: "da_c2", c3: "da_c3", neighbours: "da_neighbours", jump: "da_jump", day_form: "da_day_form", own_names: "da_own_names", ampm_form: "da_ampm_form", depth: "da_depth", frame_b: "da_frame_b", print_h: "da_print_h", frame_h: "da_frame_h" };

export const DEFAULTS = {
  version: 2,
  dial_d: 30.0, margin: 3.0, guides: false,      // guides off to start; they show while a number is slid or a ring sized, and go when it stops (#485: "Defaults are all off, but while things resize")
  engrave: 0, rh_engrave: 0, bz_engrave: 0,      // FINISH, a place in FINISHES, of the markings on bare metal — the plate's (no paint), the rehaut's ring, the bezel's markings on its metal: painted on, or cut in (Okay, 11 Nov 2026: "I need the ability to add these engravings instead of paint on metal, needs a switch"); an engraved marking is in the files on a layer of its own, Engrave, and in no ink film
  material: 0, paint: true,      // the plate's MATERIAL, a place in PLATE_METALS, and whether it is painted (c_plate): no paint, the metal is the face — seen in the preview with a sheen that follows the sun, left unprinted in the files (Okay, 11 Nov 2026: "The dial at the end becomes material, color gets a new line called paint, on off is possible through color selector popup adding a no color button")
  movement: "any",                                 // the movement the dial is for (#586, the Dial tab's Movement): an id in MOVEMENTS; "any", the Imaginary Movement, has no limits and is where a new dial starts (Okay, 11 Nov 2026: "Any; call it Imaginary Movement")
  dial_hole: 2.7,                                  // the centre hole's Ø (#165, 14 Oct 2026; web only, R30); 0 = none. Okay waived R31 for it: old links get the hole too
  c_plate: [0.93, 0.91, 0.86, 1], c_backdrop: [0.80, 0.80, 0.78, 1],
  rings: [],
  // ── the case round the dial (#582, 10 Nov 2026; Okay: "bezel and rehault and its editable parts … Implement its rules in
  // 2d") — the 3D exercise's bezel stack (try/relight, round 34) by its named numbers, in dial millimetres (the spec's at
  // its opening of Ø 29.2; here for Ø 30, scaled with the dial by Scale everything). Off to start: an older link draws
  // as before (R31). In plan: the REHAUT a wall rising from the dial's edge, rh_len long at rh_deg from the vertical (Okay, 10 Nov 2026: "Rehault degree is what we need and length") — its plan width rh_len · sin(rh_deg), its height rh_len · cos(rh_deg); the BEZEL ring bz_w wide outside it, its
  // top chamfer bz_chamfer in from its outer edge; a rotating bezel's INSERT bz_in_in / bz_in_out in from the ring's
  // inner / outer edge, and its COIN EDGE outside — bz_teeth_n scallops a turn, bz_teeth_depth deep, bz_teeth_fill of the
  // pitch wide, chamfered bz_teeth_chamfer. The heights (bz_dial_up the dial's face over the band's top · bz_seat the ring's
  // seat · bz_h its height · bz_lip the recess · bz_rim · bz_up · bz_dome the crystal's) show in the section diagram and
  // in show mode; the plan does not see them
  rh_on: false, rh_deg: 24, rh_len: 1.5, rh_c: [0.78, 0.78, 0.76, 1],      // 24° and 1.5 mm: the 3D exercise's wall, 0.6 out over 1.35 up. rh_w is dead (R8): nothing reads it
  bz_on: false, bz_kind: 0, bz_w: 3.3, bz_chamfer: 0.45, bz_in_in: 0.4, bz_in_out: 0.6, bz_c: [0.80, 0.80, 0.78, 1], bz_insert_c: [0.17, 0.17, 0.19, 1], bz_marks: 0,      // bz_c is dead (R8): the bezel is case material (case_metal)
  bz_melt: false,                                  // a fixed bezel melted into the case (#599; Okay, 11 Nov 2026: "a bezel that melts into the case, seemlessly, on off style"): one piece with the body — no seat, no step, no line. Read through bezel_melted()
  bz_teeth_n: 60, bz_teeth_depth: 0.5, bz_teeth_fill: 0.62, bz_teeth_chamfer: 0.45,
  bz_dial_up: 0.7, bz_seat: 0.3, bz_h: 2.3, bz_lip: 0.55, bz_rim: 0.4, bz_up: 0.65, bz_dome: 1.35,
  ui_dial_tab: 0,                                  // the Dial tab's own tabs: Dial · Rehaut · Bezel (#582; ui_case is the canvas's Case view)
  ha_on: true, ha_beat: 0, ha_cap: 1.6, c_cap: ACCENT, ha_hour: {}, ha_minute: {}, ha_second: {},
  ha_gmt: {}, ha_date: {}, ha_day: {}, ha_month: {},      // the hands of your own (#577), none added to start; their starting looks are set below with the other hands'
  ha_cap_top: false,                               // the cap is part of the seconds hand (#262, beta 4.43); with no seconds hand it is drawn on the topmost hand only when this is on (web only, R30)
  da_on: false, da_at: 0, da_r: 10.5, da_w: 2.6, da_h: 2.0, da_round: 0.2, da_frame: 0.15,
  da_clear: 0.25, da_day: "17", da_size: 62.0, da_ink: INK,
  da_kind: 0, da_hour: 10.0, da_age: 14.8, windows: [WINDOW_BASE, WINDOW_BASE, WINDOW_BASE],
  da_shape: 0, da_sides: 6, da_turn: false, da_text_turn: true, da_family: "", da_ps: "", da_axes: {}, da_text_c: null, da_disc_c: null, da_tracking: null, da_lang: null, da_features: null, da_at_deg: null,      // window 1's share of WINDOW_BASE's keys of 13 Oct 2026
  t: 10 * 3600 + 9 * 60 + 36,
  out_production: false, out_mirror: false, out_live_text: false,
  // what a file for production holds (the production debts, #219–#224; 4.90): every one starts as files were made
  // before, so older links and files draw as they did (R31, no new scheme). Preview and files alike (R26: one scene)
  out_window_content: true,                        // #219: what the windows show (discs, numbers, pictures); off, their holes stay empty, for a printer who prints the face alone
  out_hidden_cut: false,                           // #221: a hidden ring still knocks out and skips as if it were there, so a film made by hiding rings keeps its holes
  out_cutlines: true,                              // #222: a mask's cut lines (each window's, the centre hole's); off, the mask holds only what is etched
  out_invert: false,                               // #223: a mask inverted inside the dial — toner everywhere but the marks, for sunk marks
  out_ink: "",                                     // #35: a mask of one ink only (#RRGGBB), or "" for every ink — set by the export for each film, not kept between files
  out_marks: false,                                // #224: a mask's blank outline and four registration marks in the page's corners
  // a set of files in one press (#171; atlas 6.3): which of FILE_SET it writes
  out_f_pdf: true, out_f_svg: false, out_f_png: false, out_f_mask: false, out_f_mirrored: false, out_f_mask_png: false, out_f_sheet: false, out_f_spec: false,
  out_paper: 0, out_copies: 0, out_gap: 3.0, out_cutline: false,      // a print sheet (4.75, #348): its paper (output.js PAPERS: A4 · Letter · A5), how many (0 = as many as fit), the room between, a cut line round each
  out_dpi: 600.0, out_seconds: 4.0, out_fps: 30.0, out_px: 1080,
  ui_section: 0, ui_ring: 0, ui_hand: 0, ui_preview: 0, ui_window: 0,
  ui_unit: 0,                                      // the unit lengths are shown and typed in: a place in UNITS. Settings stay in mm (R1)
  ui_colour_as: 1,                                 // the mode the colour pop-out opens in: a place in COLOUR_MODES, HEX to start (Settings, #554)
  ui_strip: 0,                                     // what the Every mark strip shows and sets: a place in STRIP_SHOWS, rows.js (#169; the window's state, not in a link)
  ui_snap: false, ui_snap_guides: true,            // snapping (#184; Settings): a dragged handle lands on rings' edges — off to start; and on the added guides' circles too — on (Okay, 1 Nov 2026: "Snap default is off, snap to guides on")
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
  strap: 1, c_strap: [0.29, 0.2, 0.14, 1],      // the strap round the dial (watch.js): 0 and 1 a leather strap in c_strap, 2 a bracelet in the case's metal (on the diver alone; elsewhere leather), 4 the diver's links bracelet (Emre's H-links; Okay, 25 Oct 2026: "Links add"), 3 a NATO (w_nato). Never none (Okay, 22 Oct 2026)
  bezel: 0,                                        // the case round the dial (watch.js, CASE_OF_BEZEL): the list only grows (R9). 0 dress, 1 diver, 2 field, 3 dress, 4 field, 5 emre01 — 2 and 4 were the pilot and sport sketches, 0 "no case": no watch is caseless now (Okay, 22 Oct 2026). Preview only (R26)
  // ── w_: the watch round the dial in show mode (22 Oct 2026, build list #509; R7). Kept in the settings file and the
  // session, never in a link (R31: these keys are not in LINK_KEYS). Lists only grow at their end (R9).
  w_style: 1,            // the paint: 0 Engineer, 1 Artisan (watch.js). The dial side draws Engineer, flat, whatever this says
  w_lighting: 0,         // 0 dramatic (the spotlight pool and the flare), 1 flat
  w_body: 0,             // the body's Ø in mm, 0 Fit: snug round the dial and its rehaut and bezel (Okay, 11 Nov 2026: "The body size adjustment of the watch should move independently from the dial size, default body fits the dial size snugly")
  w_view: 0,             // what Fit shows in show mode: 0 the detail (lug tip to lug tip), 1 the whole watch, 2 the dial as the dial side
  w_metal: 1,            // 0 steel, 1 gold, 2 aluminium, 3 bronze, 4 titanium, 5 black
  c_metal: null,         // a case colour of your own; null = the metal's preset
  w_nato: 1,             // the NATO's pattern: 0 bond, 1 regimental, 2 khaki, 3 black · grey, 4 olive, 5 grey (strap 3 = a NATO)
  c_nato: null,          // its three stripe colours, your own; null = the pattern's
  w_insert: 0,           // the diver's insert: 0 black, 1 blue, 2 green, 3 pepsi, 4 batman, 5 coke, 6 root beer, 7 sprite
  c_insert: null,        // its two colours (top, bottom), your own; null = the preset
  w_ink: 6,              // an older file's ink height, in steps of INK_STEP_MM; read once, into w_ink_all, by fresh_settings (R8)
  w_inks: {},            // show mode's Inks (#545): each ink by its colour, "#RRGGBB" → { h: mm, two: split into inks A and B, b: B's mm }; a colour not in it stands at INK_MM, one ink
  w_ink_all: 0,          // All inks at once (#545): mm added to every printed height, every ink keeping its own (Okay, 24 Oct 2026: "adding to or subbing from each same amount")
  w_flare_on: true, w_flare: 0,      // the flare on the case's edge; its kind: 0 an arc along the edge, 1 a dot
  w_fl_size: 100, w_fl_tint: 45, w_fl_bright: 100,      // the flare: size %, how close to the case's colour %, brightness %
  w_glass_fat: 100, w_glass_len: 100, w_glass_op: 100,      // the shine on the glass: width %, length %, opacity %
  w_grounds: [],         // show mode's backdrops of your own (#510; Okay, 25 Oct 2026: "Adding colors or gradients by user possible, save file carries those too"): each [colour] or [first, second], colours as c_backdrop's; added at the end
  w_ground_auto: false,  // Backdrop › Auto: the ground follows the paint's own (Engineer Stone, Artisan Umber; watch.js presets().floor), as the Show Case's opener did; picking any other backdrop turns it off
  c_backdrop2: null,     // a second backdrop colour: a gradient at 45°, the backdrop's colour at the top left, this at the bottom right; null = one colour
  out_watch_px: 3000,    // the watch's PNG or PDF, pixels along its longer side
  ui_show: false,        // show mode on (the panel on the right with the show tabs, the watch round the dial)
  ui_show_section: 6, ui_edit_section: 0,      // the tab last used in show mode (Watch to start) and on the dial side (SECTIONS numbers, R9)
  ui_grey_panel: false,      // show mode's panel in greys, like the bar, instead of the backdrop's colour (the round swatch at the title line's end; Okay, 22 Oct 2026)
  w_sun_lock: false,   // show mode's sun held where it is: a drag on the canvas or the sun's picture no longer moves it; the sliders still do (Okay, 2 Nov 2026, 17:24: "Sun needs a lock accessible from its first line. Applies to showcase only")
  w_bevels: true,      // show mode draws the hands' bevels (Shenanigans' Bevels: Okay, 23 Oct 2026)
  w_night: 0,          // show mode's Light › Time: 0 Day, 1 Night — the watch in its lume under a night filter (night.js, #175; Okay, 3 Nov 2026: "Night is lume mode")
  w_moon: 50,          // Night's Moon › Strength %: how much of the daylight picture survives (Okay: "Moon strength defaults to 50%")
  w_decay: 0,          // Night's Lume decay %: 0 freshly charged, 100 gone
  w_gradients: true,   // show mode's gradients — the backdrop's, Dramatic's spotlight, the outline's light — on (Shenanigans' Gradients, #525: "Both")
  ui_case: false,      // the case round the dial on the dial side: off to start (Okay, 23 Oct 2026: "On main default is caseless"); its kind is `bezel`, shared with show mode, which always has one
  ui_effects: true,      // the costly layers in show mode — blurs, the flare, the glass shine, the silhouette outline (Okay: "turn off shenanigans")
  date: "",                                        // the day the dial shows, "2026-10-18", set in the bar (4.62; Okay, 18 Oct 2026: "Date best set at the bar … Default from system date"); "" = today, wherever the dial is opened
  da_jump: false,                                  // … and `jump` (#401, 4.90)
  da_day_form: 0,                                  // … and `day_form` (#515)
  da_own_names: null, da_ampm_form: 0,             // … and `own_names`, `ampm_form` (#515, #516)
  da_depth: null,                                  // … and `depth` (#526)
  da_frame_b: false, da_print_h: null, da_frame_h: null,      // … and `frame_b`, `print_h` (#545), `frame_h`
  da_look: 0, da_c2: null, da_c3: null, da_neighbours: true,      // … and `neighbours` (4.74)            // the first window's `look`, `c2`, `c3` (4.73)
  da_physics: true, xray: false,                   // the first window's `physics` · X-ray, every window's disc seen under a veil of the plate, preview only (4.72, #346)
  da_wh_link: false,                               // the first window's width and height linked, as every window's `wh_link` (#358, beta 4.57)
  gd_k_edge: 1, gd_k_axes: 0, gd_k_win: 1, gd_k_rings: 1, gd_k_sel: 4, gd_w: 0.75,
  // shadows: preview only, never in a file (R5, R26). One light, far away: it comes from a clock angle (sh_from, degrees)
  // at a height over the dial (sh_rise, degrees above the plate's face). Each hand floats at its own height over the
  // plate (mm); the cap's top is the top of the stack; the date discs lie sh_disc mm under the plate's face. A thing
  // of height z casts its shape shifted by z / tan(rise), away from the light, onto everything lower; each surface
  // keeps only the part that falls on it — so a shadow steps where it crosses a hand or a window's edge.
  // sh_dark: how dark, 0–100 %. sh_blur: a small soft edge (on/off only). The light's starting values are Okay's (14 Oct
  // 2026, 23:05, a picture of the list: "these in the image are the default values"). The hands' starting HEIGHTS are
  // the Miyota 8215's, read from the movements' record (Okay, 10 Nov 2026: "Amazing. Implement."; `MOVEMENTS` below).
  sh_on: true, sh_from: 270, sh_rise: 35, sh_dark: 25, sh_blur: false,
  sh_bevel: 100,                                   // the hands' bevels' strength, 0–100 % (Okay, 19 Oct 2026: "Hand bevel off on default, add an adjuster"): a hand's own Bevel tick turns its bevel on (HAND_BASE.bevel, off to start); 100 = as 4.77 drew them
  sh_hour: START_HEIGHTS.hour, sh_minute: START_HEIGHTS.minute, sh_second: START_HEIGHTS.second, sh_cap: START_HEIGHTS.cap, sh_disc: 0.15,      // 0.30 · 0.85 · 1.20 · 1.45
  sh_gmt: 0.1, sh_date: 0.1, sh_day: 0.1, sh_month: 0.1,      // the added hands' heights (#577): under the hour hand to start, a step clear of it; the same for all four until the movement says (one shows on most dials)
  gd_more: [],                                     // guides added by hand: lines, crosshairs, circles (GUIDE_MORE). gd_k_rings and gd_k_sel: unread, a ring's guide has the ring's own colour
  // the next five keys are unread: old settings files carry them (R8). Nothing writes them any more.
  gd_c: [0.0, 0.55, 0.9, 1], gd_strength: 50.0,
  gd_sel_c: [1.0, 0.45, 0.0, 1], gd_sel_strength: 95.0, gd_sel_w: 1.5,
};

/** The movements (#587): `MOVEMENTS` is written from the record, docs/research/movements.json, by web/movements.mjs — the
 *  one place a movement's numbers live; each has its hand heights worked out there by one rule. */
export { MOVEMENTS, movement, HAND_T } from "./movements.js";

// ── CHOOSE YOUR MOVEMENT (#586; Okay, 10 Nov 2026: "5 most popular movements, their capabilities are available as defaults …
// we'll have one imaginary movement that can do any and all"; 11 Nov 2026: "All its defaults", "Yes, remove (R16)", the NH35's
// siblings "as their own rows"). A real movement says what it drives (`can`, from the record): what it can't is removed (R16:
// hidden, not greyed) — from the dial when chosen, and from the menus while it stays chosen. The Imaginary Movement ("any")
// lifts every limit.
/** the movements offered on the Dial tab, in order: the Imaginary Movement first, then the record's shown ones */
export const MOVEMENT_CHOICES = () => [MOVEMENT_OF("any"), ...MOVEMENTS_LIST.filter((m) => m.shown && m.id !== "any")];
const can_of = (S) => MOVEMENT_OF(S.movement)?.can ?? null;
const PLACE_OF = { 3: "3", 4: "4", 4.5: "4:30", 6: "6", 9: "9", 12: "12" };      // the record's date places (o'clock) → DATE_AT's names
/** can this dial's movement drive this hand? */
export const can_hand = (S, name) => { const c = can_of(S); if (!c) return true;
  return name === "hour" || name === "minute" ? true : name === "second" ? c.seconds !== "none" && c.seconds !== "small" : name === "gmt" ? c.gmt : name === "date" ? c.date_hand : name === "day" ? c.day_hand : name === "month" ? c.month_hand : false; };
/** the window kinds this dial's movement drives (places in WINDOW_KINDS) */
export const window_kinds_can = (S) => { const c = can_of(S); if (!c) return WINDOW_KINDS.map((_, i) => i);
  return WINDOW_KINDS.map((k, i) => (k === "date" ? (c.date.length ? i : -1) : k === "day" ? (c.day ? i : -1) : k === "am · pm" ? (c.ampm ? i : -1) : k === "moon phase" ? (c.moon ? i : -1) : -1)).filter((i) => i >= 0); };
/** the places (DATE_AT names) a window of this kind can stand at with this dial's movement; null: anywhere */
export const window_places_can = (S, kind) => { const c = can_of(S); if (!c) return null;
  const k = WINDOW_KINDS[kind]; return k === "date" ? c.date.map((p) => PLACE_OF[p]).filter(Boolean) : k === "day" && c.day ? c.day.positions.map((p) => PLACE_OF[p]).filter(Boolean) : []; };
/** a movement chosen: its defaults written into the settings, and what it can't drive taken off (one undo step for the
 *  caller). The dial's Ø and centre hole, the hands' heights and holes, the date window's place, radius and size (the
 *  record's aperture read as the window's width × height); a day window beside the date on a day-date calibre. → the
 *  names of what was taken off, for the panel to say */
export function apply_movement(S, id) {
  const M = MOVEMENT_OF(id); S.movement = M ? id : "any"; const c = M?.can, gone = [];
  for (const name of FIXED_HANDS) S["ha_" + name] = { ...S["ha_" + name], fit_d: M?.holes?.[name] ?? null };
  if (S.ha_gmt) S.ha_gmt = { ...S.ha_gmt, fit_d: M?.holes?.gmt ?? null };
  if (!c) return gone;
  if (M.dial?.d) S.dial_d = M.dial.d;
  if (M.dial?.hole) S.dial_hole = M.dial.hole;
  if (M.heights) for (const k of ["hour", "minute", "second", "cap"]) if (M.heights[k] != null) S["sh_" + k] = M.heights[k];
  for (const name of ADDED_HANDS) { const H = S["ha_" + name]; if (H && H.added && !can_hand(S, name)) { S["ha_" + name] = { ...H, added: false, on: false }; S.rings = S.rings.filter((r) => r.fn !== name).length ? S.rings.filter((r) => r.fn !== name) : S.rings; gone.push(HAND_WORD[name] + " hand"); } }
  if (!can_hand(S, "second") && S.ha_second.on) { S.ha_second = { ...S.ha_second, on: false }; gone.push("Seconds hand"); }
  const kinds = window_kinds_can(S);
  windows_of(S).forEach((w, i) => {
    if (!w.on) return;
    const put = (o) => { if (i === 0) for (const [k, v] of Object.entries(o)) S[FIRST_WINDOW[k]] = v; else S.windows[i - 1] = { ...S.windows[i - 1], ...o }; };
    if (!kinds.includes(w.kind)) { put({ on: false }); gone.push(WINDOW_KINDS[w.kind] + " window"); return; }
    const places = window_places_can(S, w.kind), here = DATE_AT[w.at]?.[0], at = places.includes(here) && w.at_deg == null ? w.at : DATE_AT.findIndex((d) => d[0] === (PLACE_OF[c.date_default] ?? places[0]));
    if (WINDOW_KINDS[w.kind] === "date" && M.date) put({ at, at_deg: null, r: M.date.r ?? w.r, w: M.date.aperture?.[0] ?? w.w, h: M.date.aperture?.[1] ?? w.h });
    if (WINDOW_KINDS[w.kind] === "day" && c.day) {      // one aperture for day and date (NH36): the day takes the inner part, the date the outer (I)
      const inner = c.day.r - c.day.aperture[0] / 2, day_w = c.day.aperture[0] - (c.day.date_part ?? 0);
      put({ at, at_deg: null, r: +(inner + day_w / 2).toFixed(3), w: +(day_w - 0.2).toFixed(3), h: c.day.aperture[1] }); }
  });
  return gone;
}

/** units a length can be shown and typed in: [short name, name, how many make a millimetre, extra decimals].
 *  Only for the window: every setting, link and file stays in mm (R1). The list only grows at its end (R9).
 *  A ligne is the watchmakers' unit for movement sizes: 2.2558 mm. */
export const COLOUR_MODES = ["RGB", "HEX", "CMYK", "RAL", "Lume"];      // how a colour is written in the colour pop-out; Settings says which of the first four it opens in (#554); Lume the fifth (#175)
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
/** the case each `bezel` number draws (R9: numbers keep their meaning; a new kind is appended) and the number the menu writes for a kind */
export const CASE_OF_BEZEL = ["dress", "diver", "field", "dress", "field", "emre01"];
export const BEZEL_OF_CASE = { dress: 3, diver: 1, field: 2, emre01: 5 };
export const NOT_GEOMETRY = ["t", "guides", "xray", "bezel", "strap", "c_strap", "wearos_name", "ui_section", "ui_ring", "ui_hand", "ui_window", "ui_preview", "ui_strip", "ui_scale", "ui_unit", "ui_colour_as", "ui_snap", "ui_snap_guides",
  "w_style", "w_lighting", "w_view", "w_metal", "c_metal", "w_nato", "c_nato", "w_insert", "c_insert", "w_ink", "w_inks", "w_ink_all", "w_flare_on", "w_bevels", "w_sun_lock", "w_flare", "w_fl_size", "w_fl_tint", "w_fl_bright", "w_glass_fat", "w_glass_len", "w_glass_op", "c_backdrop2", "w_grounds", "w_ground_auto", "out_watch_px", "ui_show", "ui_show_section", "ui_edit_section", "ui_effects", "ui_grey_panel", "ui_case", "w_night", "w_moon", "w_decay"];
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
  ["out_f_spec", "Spec sheet · SVG", "spec", { out_production: false, out_mirror: false }],
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

/** the scale rings of a hand's function (#577, FUNCTIONS): numerals rings in the scale type, their labels in the hand's
 *  language, count, radius and size the function's; `fn` names the hand; the first is the hand's own (its length).
 *  [] for a hand without a function (the fixed three). */
export function function_rings(S, name) {
  const F = FUNCTIONS[name];
  if (!F) return [];
  const lang = +(S["ha_" + name] || {}).lang || 0;
  return F.rings(S, S.dial_d / 2, lang, F).map((settings) => Object.assign(new_ring("numerals", S), settings, { fn: name }));
}
/** a function's rings relabelled in the hand's language (the Names pill): the first ring of a calendar hand */
export function relabel_function(S, name) {
  const F = FUNCTIONS[name], ring = S.rings.find((r) => r.fn === name);
  if (!F || !ring || !F.places) return;
  const words = F.labels(+(S["ha_" + name] || {}).lang || 0);
  ring.custom = words.join(", "); ring.count = words.length;
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
  ty_family: "Arimo", ty_ps: "Arimo-Regular", ty_size: 2.4, ty_tracking: 0.0,
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
  // the GMT hand as it starts when added (#577): an arrow, as the 24-hour hands of the GMT watches, reaching between the
  // hour and the minute hand, thinner than the hour hand, in the seconds' accent colour — not on the dial until its + is pressed
  const hour = start.ha_hour, minute = start.ha_minute, own = (more) => ({ ...HAND_BASE, on: false, added: false, fit: false, tail: hour.tail, c: ACCENT, ...more });
  DEFAULTS.ha_gmt = own({ shape: HAND_SHAPES.indexOf("arrow"), len: +((hour.len + minute.len) / 2).toFixed(2), w: +(hour.w * 0.7).toFixed(2), tip: +(hour.len * 0.18).toFixed(2), feature: +(hour.w * 1.6).toFixed(2) });
  // the calendar hands (10 Nov 2026): a pointer date long and thin with a ring near its tip, as the pointer-date watches
  // draw it; day and month short batons. Their lengths are set to their rings when added (add_hand)
  DEFAULTS.ha_date = own({ shape: HAND_SHAPES.indexOf("breguet"), len: minute.len, w: +(hour.w * 0.4).toFixed(2), tip: +(minute.len * 0.08).toFixed(2), feature: +(hour.w * 1.2).toFixed(2), feature_at: 88 });
  DEFAULTS.ha_day = own({ shape: 0, len: +(hour.len * 0.6).toFixed(2), w: +(hour.w * 0.5).toFixed(2) });
  DEFAULTS.ha_month = own({ shape: 0, len: +(hour.len * 0.5).toFixed(2), w: +(hour.w * 0.5).toFixed(2) });
}
/** the hands' order on the dial, bottom first — the stack as a movement builds it (9 Nov 2026, researched on Okay's
 *  word, "if so just remove movability"): the hands sit on nested pipes, the slow outer wheels lowest, so the hour hand is
 *  closest to the dial, the minute hand over it and the seconds hand on the centre arbor on top; a complication hand
 *  rides a wheel outside the hour wheel (a GMT hand's hole is 1.8 mm against the hour's 1.5) and goes under them all,
 *  as it is fitted first. Not a setting: `ha_stack` in a link is dead (R8). */
export const hand_stack = () => [...ADDED_HANDS, ...FIXED_HANDS];
/** the hands that draw, bottom first: added and on, with the hands shown at all */
export const hands_shown = (S) => (S.ha_on ? hand_stack(S).filter((h) => hand_added(S, h) && S["ha_" + h] && S["ha_" + h].on) : []);
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
  // a numerals ring's radius is its band's middle, outer or inner circle (#488): centre, baseline, ascender and cap
  // middle all read as the middle, place 0 (R9: the list keeps them)
  for (const r of S.rings) if (![0, 3, 4].includes(+r.anchor)) r.anchor = 0;
  if (!S.rings.length) S.rings = [complete(RING_BASE, {})];
  // bevels from before a hand had its own tick: Bevels % above 0 drew them on every hand, so a hand that doesn't say gets one (a link
  // made since always says, lean())
  if ("sh_bevel" in over && +over.sh_bevel > 0) for (const h of FIXED_HANDS) { const raw = over["ha_" + h]; if (!raw || !("bevel" in raw)) S["ha_" + h] = { ...(S["ha_" + h] || {}), bevel: true }; }
  for (const h of HANDS) S["ha_" + h] = complete(HAND_BASE, S["ha_" + h]);
  for (const h of ADDED_HANDS) if (!S["ha_" + h].added) S["ha_" + h].on = false;      // a hand of your own that was not added never draws (#577)
  // inks in steps, from before show mode's Inks (#545): All inks (w_ink, 6 to start) becomes the mm added to every ink,
  // and a ring's own step (ink_d) its colour's height — the first ring of a colour says it
  if (!("w_inks" in over) && ("w_ink" in over || S.rings.some((r) => r.ink_d))) {
    S.w_ink_all = +((S.w_ink - INK_START) * INK_STEP_MM).toFixed(3);
    S.w_inks = {};
    for (const r of S.rings) if (r.ink_d && Array.isArray(r.c)) { const hex = ink_hex(r.c); if (!S.w_inks[hex]) S.w_inks[hex] = { h: +(INK_MM + r.ink_d * INK_STEP_MM).toFixed(3) }; }
  }
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

export const LINK_SCHEME = 5;      // 5 since 4.92.18: a ring's starting font is Arimo, bundled, instead of Helvetica Neue, which isn't (#228; Okay, 24 Oct 2026: "Bundled fonts are all free to use"); 4 since 4.91: a numerals ring sits in its cap-height band (#488); 3 since 4.88: an am · pm window draws its one disc (R31)

/** the topmost hand that shows: its place in HANDS, or -1 */
export const top_hand = (S) => { const shown = hand_stack(S).filter((h) => hand_added(S, h) && S["ha_" + h].on); return shown.length ? HANDS.indexOf(shown.at(-1)) : -1; };      // the stack's order (#577), not the fixed three's
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
  "out_window_content", "out_hidden_cut", "out_cutlines", "out_invert", "out_marks",      // 4.90 (#219–#224): appended; each starts as files were, so every older link looks as before
  "out_f_pdf", "out_f_svg", "out_f_png", "out_f_mask", "out_f_mirrored", "out_f_mask_png", "out_f_sheet", "out_f_spec",      // 4.90 (#171, #18): appended; what a set of files holds
  "out_ink",                // 4.90 (#35): appended; "" to start, every ink in one mask as before
  "jump", "da_jump",        // 4.90 (#401): appended; off to start, the disc sweeps as before
  "day_form", "da_day_form",      // 4.92.3 (#515): appended; short to start, as every older link
  "own_names", "da_own_names", "ampm_form", "da_ampm_form",      // 4.92.11 (#515, #516): appended; none and the disc to start, as every older link
  "ink_d",                  // 4.92.15 (#521): appended for the table's sake; lean() leaves it out of a link (R7)
  "depth", "da_depth",      // 4.95 (#526): appended; null to start = the shared sh_disc, as every older link
  "stroke", "stroke_w", "stroke_join", "stroke_side", "stroke_c",      // v1.1 beta (#551): appended; off to start, as every older link
  "rhythm", "rh_dash", "rh_gap", "rh_dash_shape", "rh_dash_len", "rh_gap_len",      // v1.1.27 beta (#169): appended; no rhythm to start, as every older link
  "bevel_look",             // v1.1.35 beta (#531): appended; Ridge to start, as every older link
  "facet_turn",             // v1.1.36 beta (#531): appended; dead since v1.1.37 with Faceted (#573), kept (R8)
  "op_on", "op_shape", "op_count", "op_from", "op_to", "op_w", "op_gap", "op_fill",      // v1.1.39 beta (#175): appended; no openings to start, as every older link
  "mark_tri", "mark_stroke_w", "mark_stroke_c",      // v1.1.40 beta (#574): appended; a wedge as before and no stroke to start, as every older link
  "ink_h", "stroke_h", "frame_h",      // v1.1.44 beta: appended for the table's sake; a part's own ink height, show mode's, lean() leaves it out of a link (R7)
  "hole_as", "hole",        // v1.1.52 beta (#404): appended; no hole to start, as every older link
  "ha_gmt", "ha_stack", "sh_gmt", "added", "cycle",      // v1.1.54 beta (#577): appended (a hand's `offset` shares the markers' code above); no GMT hand to start, as every older link. ha_stack is dead since v1.1.55 (the stack is the movement's, hand_stack): kept, nothing reads it (R8)
  "ha_date", "ha_day", "ha_month", "sh_date", "sh_day", "sh_month", "fn",      // v1.1.56 beta (#577): appended; the calendar hands and the ring key `fn` (which hand a ring serves); none to start, as every older link
  "rh_on", "rh_w", "rh_c", "bz_on", "bz_kind", "bz_w", "bz_chamfer", "bz_in_in", "bz_in_out", "bz_c", "bz_insert_c", "bz_teeth_n", "bz_teeth_depth", "bz_teeth_fill", "bz_teeth_chamfer", "bz_dial_up", "bz_seat", "bz_h", "bz_lip", "bz_rim", "bz_up", "bz_dome", "surface", "r_from",      // v1.1.58 beta (#582): appended; the case off to start, every ring on the dial, as every older link; rh_w dead since v1.1.59 (the rehaut by angle and length, R8)
  "rh_deg", "rh_len",      // v1.1.59 beta (#582): appended
  "motion", "movement", "fit_d",      // v1.1.69–70 beta (#590, #586): appended; Jump, the Imaginary Movement and the common fit to start, as every older link
  "material", "paint",      // v1.1.71 beta: appended; brass under a painted plate to start, as every older link
  "bz_marks",               // v1.1.75 beta: appended; the insert to start, as every older link
  "w_body", "on_hand",      // v1.1.76 beta: appended; Fit and no disc to start, as every older link (w_body stays out of links, NOT_IN_LINK)
  "engrave", "rh_engrave", "bz_engrave",      // v1.1.76 beta: appended; painted to start, as every older link
  "bz_melt",                // v1.1.80 beta (#599): appended; a bezel seated on the case to start, as every older link
];
const CODE_DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const code_of = (i) => (i < 62 ? CODE_DIGITS[i] : CODE_DIGITS[Math.floor(i / 62) - 1] + CODE_DIGITS[i % 62]);
const KEY_CODE = new Map(LINK_KEYS.map((k, i) => [k, code_of(i)]));
const CODE_KEY = new Map(LINK_KEYS.map((k, i) => [code_of(i), k]));
const SETTINGS_INSIDE = (k) => k === "rings" || k === "windows" || k === "gd_more" || HANDS.some((h) => k === "ha_" + h);

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
/** A WATCH LINK (#600; Okay, 11 Nov 2026: "I need a way to keep showc 3ds edited watches" — "A link") is a dial's link, then
 *  WATCH_MARK, then Show Case 3D's settings packed. The dial's part is read here as any dial's link; the tail is the 3D page's */
export const WATCH_MARK = ".3d.";
export const link_dial = (text) => { const t = String(text || ""), i = t.indexOf(WATCH_MARK); return i < 0 ? t : t.slice(0, i); };
export const link_tail = (text) => { const t = String(text || ""), i = t.indexOf(WATCH_MARK); return i < 0 ? "" : t.slice(i + WATCH_MARK.length).trim(); };
/** what the part after # is: a scheme-2 dial's letters, a link of an older scheme, or not a dial at all. */
export function link_kind(hash) {
  const h = link_dial(hash).replace(/^#/, "");
  if (/^[2-9][0-9A-Za-z]+$/.test(h)) return { scheme: +h[0], letters: h.slice(1) };      // schemes 2 on: the same writing after their number
  if (/^[01]\.[A-Za-z0-9_~-]+$/.test(h)) return { scheme: +h[0] };
  return null;
}

function differing(d, base) {
  const out = {};
  for (const k in d) if (JSON.stringify(d[k]) !== JSON.stringify(base[k])) out[k] = d[k];
  return out;
}

/** the settings, without everything that still has its starting value and without the window's own state. */
/** the watch's own keys (show mode): kept in the file and the session, never in a link (Okay, 22 Oct 2026) */
export const NOT_IN_LINK = (k) => k.startsWith("w_") || ["c_metal", "c_nato", "c_insert", "c_backdrop2", "out_watch_px", "ink_b", "stroke_b", "frame_b", "print_h", "da_frame_b", "da_print_h", "da_frame_h"].includes(k);      // the inks' split and heights (#545) are show mode's too
export function lean(S) {
  const out = {};
  for (const k in S) {
    if (k.startsWith("ui_") || k === "version" || NOT_IN_LINK(k) || JSON.stringify(S[k]) === JSON.stringify(DEFAULTS[k])) continue;
    if (k === "rings") out.rings = S.rings.map((r) => { const d = differing(r, RING_BASE); delete d.ink_d; delete d.ink_b; delete d.stroke_b; delete d.ink_h; delete d.stroke_h; return d; });      // a ring's ink is show mode's: not in the link (R7)
    else if (k === "windows") out.windows = S.windows.map((w) => { const d = differing(w, WINDOW_BASE); delete d.frame_b; delete d.print_h; delete d.frame_h; return d; });
    else if (HANDS.some((h) => k === "ha_" + h)) { out[k] = differing(S[k], HAND_BASE); for (const own of ["op_ink_h", "mark_ink_h", "mark_stroke_ink_h"]) delete out[k][own]; }      // a print's own height is show mode's (R7)
    else out[k] = S[k];
  }
  // with Bevels % in it, every hand says its Bevel, so fresh_settings never takes it for an older link. A hand left out
  // above (still the starting hand) is written whole against HAND_BASE here, never as `{ bevel }` alone: a hand object
  // in a link replaces the starting hand entirely, so a bare one would come back as HAND_BASE (the plain hand), not as
  // DEFAULTS' (found 25 Oct 2026)
  if ("sh_bevel" in out) for (const h of HANDS) if (hand_added(S, h)) out["ha_" + h] = { ...differing(S["ha_" + h] || {}, HAND_BASE), bevel: Boolean(S["ha_" + h] && S["ha_" + h].bevel) };
  return out;
}

// ═════════════════════════════════════════════════════════════
//  2 · GEOMETRY
// ═════════════════════════════════════════════════════════════

// ── the engines ──────────────────────────────────────────────

let PK = null;                                     // PathKit (shape combining)
const STROKE_SCALE = 1000;                         // the stroker works at this scale (expandStroke)
let PK_VERB = null;                                // our command letters as PathKit's verbs (set at start)
let HB = null;                                     // HarfBuzz (text)

export function start(pathkit, harfbuzz) {
  PK = pathkit;
  PK_VERB = { M: PK.MOVE_VERB, L: PK.LINE_VERB, C: PK.CUBIC_VERB, Z: PK.CLOSE_VERB };
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
    if (!parts.length) return this;
    // one outline alone is set to run as every outer outline does too (counter-clockwise), so merging a shape again gives
    // the same shape: PathKit hands a single curved outline back the other way round, and the stroke's grow step
    // (offset) needs the outer way round — a figure merged twice (once as its glyph, once for its stroke) lost its
    // stroke (2 Nov 2026, found with test/frames.mjs)
    if (parts.length === 1) { const [o] = parts, a = o.pts.reduce((t, p, i) => t + p[0] * o.pts[(i + 1) % o.pts.length][1] - o.pts[(i + 1) % o.pts.length][0] * p[1], 0); return a < 0 ? o.c._reversed() : o.c; }
    for (const o of parts) {                       // each contour's box: a probe outside it can't be inside the contour, so most pairs are settled without the crossing count (a 60-tick ring is 60 contours: 3,600 pairs a frame before, a few after)
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [x, y] of o.pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      o.box = [x0, y0, x1, y1];
    }
    const in_box = (p, [x0, y0, x1, y1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
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
      const depth = parts.filter((other) => other !== o && in_box(probe, other.box) && inside(probe, other.pts)).length;
      const hole = depth % 2 === 1, clockwise = area(o.pts) < 0;
      out.appendPath(hole === clockwise ? o.c : o.c._reversed());
    }
    return out;
  }

  // shape combining — through PathKit, the result comes back as a plain path
  /** this path as PathKit's (its commands handed over as numbers, not written out and read back: that round trip
   *  cost more than the shape work itself — measured 25 Oct 2026, 2.3 ms against 0.3 for a ten-figure word). */
  _pk() { return PK.FromCmds(this.d.map((c) => [PK_VERB[c[0]], ...c.slice(1)])); }
  /** PathKit's path → ours, from its commands. A conic (a stroke's round cap) has no place in our commands: that path
   *  is read from PathKit's SVG text, where Skia turns conics into quadratics, as before. */
  static _from_pk(a) {
    const cmds = a.toCmds();
    if (cmds.some((c) => c[0] === PK.CONIC_VERB)) return Path.parse(a.toSVGString());
    const p = new Path();
    let x = 0, y = 0;
    for (const c of cmds) {
      const v = c[0];
      if (v === PK.MOVE_VERB) { p.moveTo([c[1], c[2]]); x = c[1]; y = c[2]; }
      else if (v === PK.LINE_VERB) { p.lineTo([c[1], c[2]]); x = c[1]; y = c[2]; }
      else if (v === PK.CUBIC_VERB) { p.curveTo([c[1], c[2]], [c[3], c[4]], [c[5], c[6]]); x = c[5]; y = c[6]; }
      else if (v === PK.QUAD_VERB) { p.curveTo([x + 2 / 3 * (c[1] - x), y + 2 / 3 * (c[2] - y)], [c[3] + 2 / 3 * (c[1] - c[3]), c[4] + 2 / 3 * (c[2] - c[4])], [c[3], c[4]]); x = c[3]; y = c[4]; }      // a quadratic, as a cubic (as parse does)
      else if (v === PK.CLOSE_VERB) p.closePath();
    }
    return p;
  }
  _combined(other, op) {
    if (empty(other)) return this.copy();
    if (empty(this)) return op === "UNION" ? other.copy() : new Path();
    const a = this._pk(), b = other._pk();
    a.op(b, PK.PathOp[op]);
    const out = Path._from_pk(a)._wound();
    a.delete(); b.delete();
    return out;
  }
  union(other) { return this._combined(other, "UNION"); }
  intersection(other) { return empty(this) || empty(other) ? new Path() : this._combined(other, "INTERSECT"); }
  difference(other) { return this._combined(other, "DIFFERENCE"); }
  removeOverlap() {
    if (empty(this)) return this;
    const a = this._pk();
    a.simplify();
    this.d = Path._from_pk(a)._wound().d;
    a.delete();
    return this;
  }
  /** the outline of a line of this width drawn along the path, round joins and ends. Stroked a thousand times larger
   *  and scaled back: PathKit's stroker approximates a curve to a tolerance in path units, and in millimetres that is
   *  coarse — a Ø 2.6 mm circle grown by 0.3 bulged 21 % (the "four-petal blob", #168); at ×1000 it is 4 µm off
   *  (measured 30 Oct 2026, test/crops/stroke-scale.mjs). */
  expandStroke(width, join = "Round") {
    const K = STROKE_SCALE;
    const a = this.copy().scale(K)._pk();
    a.stroke({ width: width * K, join: PK.StrokeJoin[join.toUpperCase()] || PK.StrokeJoin.ROUND, cap: PK.StrokeCap.ROUND });
    a.simplify();
    const out = Path._from_pk(a)._wound().scale(1 / K);
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

/** the same shape grown (d > 0) or shrunk (d < 0) by d mm; its corners rounded, or mitred or bevelled (join: a word of STROKE_JOINS). */
export function offset(p, d, join = "Round") {
  if (empty(p) || abs(d) < 1e-6) return p;
  // The outer contours and the holes (counters) go separate ways: growing the shape grows an outer contour and shrinks a
  // hole. A hole is shrunk by taking its band away from it, so a counter narrower than 2d closes whole — a stroked band
  // through a narrow counter folds over itself, and its folds come back as slivers of hole that no union with the shape
  // covers (#563; Okay, 1 Nov 2026: "a glitch inside shapes like 8 and 9"). The shape arrives wound (removeOverlap, _wound):
  // a hole runs clockwise, so its signed area is negative.
  const area = (c) => { const pts = c._points(); return pts.reduce((sum, q, i) => sum + q[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * q[1], 0); };
  const outers = new Path(), holes = new Path();
  for (const c of p.contours()) (area(c) < 0 ? holes : outers).appendPath(c);
  // The band itself misleads where the shape is narrower than the band: the stroker's inner edge folds over and the fold
  // comes out as a hole in the band, so a thin counter or stem keeps a sliver it should have lost (#563). The slivers are
  // told from true results by distance: every point of a shape shrunk by s lies at least s from the old outline, a sliver
  // lies nearer; a shape grown by s has no holes of its own. So: grown, the result's holes are dropped; shrunk, a contour
  // with a point nearer the old outline than s is dropped.
  const moved = (q, s) => {
    if (empty(q)) return q;
    const band = q.expandStroke(2 * abs(s), join);      // a band of width 2|s| along the outline
    const out = new Path();
    if (s > 0) { const grown = q.union(band), cs = grown.contours(); if (cs.length < 2) return grown; for (const c of cs) if (area(c) > 0) out.appendPath(c); return out; }      // one contour alone is not wound (_wound): kept as it is
    const box = (pts) => pts.reduce(([x0, y0, x1, y1], [x, y]) => [min(x0, x), min(y0, y), max(x1, x), max(y1, y)], [Infinity, Infinity, -Infinity, -Infinity]);
    const edges = q.contours().map((c) => { const pts = c._points(); return { pts, box: box(pts) }; }), reach = abs(s) * 0.97;      // a little under s: the curves are measured as short straight pieces
    for (const c of q.difference(band).contours()) {
      const pts = c._points(); if (pts.length < 3) continue;
      const [x0, y0, x1, y1] = box(pts), r = abs(s) * 1.05;      // only the outlines within reach of this contour are measured (a ring of sixty numerals: each against its own glyph, not all)
      const near = edges.filter((e) => e.box[0] <= x1 + r && e.box[2] >= x0 - r && e.box[1] <= y1 + r && e.box[3] >= y0 - r).map((e) => e.pts);
      if (pts.every((pt) => distance_to(pt, near) >= reach)) out.appendPath(c);      // every point of a true result keeps its distance; a fold's points stand nearer the far wall
    }
    return out;
  };
  const o = moved(outers, d), h = moved(holes, -d);      // the shape's outer contours move one way, its holes the other
  return empty(h) ? o : o.difference(h);
}

/** how far a point lies from the nearest of several outlines, each a ring of points (straight pieces). */
function distance_to(pt, outlines) {
  let best = Infinity;
  for (const pts of outlines) for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, ay] = pts[j], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    const k = len2 ? Math.max(0, Math.min(1, ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(pt[0] - (ax + k * dx), pt[1] - (ay + k * dy)));
  }
  return best;
}

/** a stroke round a shape as a filled outline (R4): w mm wide, on the inside, the middle or the outside of the edge,
 *  its corners by join. The shape itself stays as it is; the stroke is a path of its own, drawn over it. */
/** does the ring draw a stroke round its letters, marks or band? */
export const has_stroke = (ring) => Boolean(ring.stroke && ring.stroke_w > 0 && ["numerals", "text", "ticks", "markers", "band"].includes(KINDS[ring.kind]));      // letters (#551), marks (#556: "indices and markers get outlines") and bands ("Add them to bands as well")

export function stroke_outline(p, w, side, join) {
  if (empty(p) || !(w > 0)) return null;
  // one outline first: a font draws a figure from overlapping pieces (Montserrat's 5: flag, stem and bowl), and grown
  // piece by piece their crossings poked out of the stroke as spikes (Okay, 31 Oct 2026, 03:20: "Is there a way to fix this?")
  p = p.copy().removeOverlap();
  if (side === "Inside") return p.difference(offset(p, -w, join));
  if (side === "Middle") return offset(p, w / 2, join).difference(offset(p, -w / 2, join));
  return offset(p, w, join).difference(p);
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
      instances: fvar_instances(bytes, index, name),      // a variable font's named styles (#52): [{name, axes: {tag: value}}], [] when it has none
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

/** a variable font's named instances — the designer's own styles (Thin, Regular, Bold…), each a point on the axes.
 *  HarfBuzz does not hand the `fvar` table's instances over, so this reads them from the file itself (#52). An OpenType
 *  file is a directory of tables; `fvar` lists the axes, then the instances: a name id and one value per axis.
 *  A collection (a .ttc) holds several fonts; `index` says which. → [{name, axes: {tag: value}}], [] when there are none. */
export function fvar_instances(bytes, index, name) {
  try {
    const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), tag = (at) => String.fromCharCode(d.getUint8(at), d.getUint8(at + 1), d.getUint8(at + 2), d.getUint8(at + 3));
    let sfnt = 0;
    if (tag(0) === "ttcf") sfnt = d.getUint32(12 + 4 * index);      // the collection's header: the fonts' offsets from byte 12
    const tables = d.getUint16(sfnt + 4);
    let fvar = 0;
    for (let i = 0; i < tables; i++) { const rec = sfnt + 12 + 16 * i; if (tag(rec) === "fvar") { fvar = d.getUint32(rec + 8); break; } }
    if (!fvar) return [];
    const axes_at = fvar + d.getUint16(fvar + 4), axis_count = d.getUint16(fvar + 8), axis_size = d.getUint16(fvar + 10), count = d.getUint16(fvar + 12), size = d.getUint16(fvar + 14);
    const tags = []; for (let i = 0; i < axis_count; i++) tags.push(tag(axes_at + axis_size * i));
    const out = [], first = axes_at + axis_size * axis_count;
    for (let i = 0; i < count; i++) {
      const at = first + size * i, axes = {};
      tags.forEach((t, k) => { axes[t] = d.getInt32(at + 4 + 4 * k) / 65536; });      // Fixed 16.16: the value times 65536
      out.push({ name: name(d.getUint16(at)), axes });
    }
    return out.filter((x) => x.name);
  } catch (e) { return []; }
}

/** the order a family's styles stand in — tabs, the sheet's sample: by weight, light to black, but Thin just before Regular
 *  (Okay, 2 Nov 2026: "Thin looks thicker than lights, so it should move before the regular"). `weight(x)` reads an item's
 *  weight, `name(x)` its name. */
export function ladder_order(items, weight, name) {
  const sorted = [...items].sort((a, b) => weight(a) - weight(b));
  const thin = sorted.filter((x) => /\b(thin|hairline)\b/i.test(name(x))), rest = sorted.filter((x) => !thin.includes(x));
  const at = rest.findIndex((x) => weight(x) >= 400);
  return at < 0 ? [...rest, ...thin] : [...rest.slice(0, at), ...thin, ...rest.slice(at)];
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

/** one glyph's outline in the font's own units, its overlaps merged, remembered per font, axes and glyph so a new size
 *  only scales it. A variable font keeps a figure's strokes as pieces lying over each other (Pathway Extreme's 4: the bar
 *  over the stem), which an even-odd fill — show mode's ink relief — reads as holes, and a laser would burn twice (Okay,
 *  2 Nov 2026, 19:06: "Some fonts fail with ink height on show case"); merged in font units, before scaling, for
 *  precision. The font's variations are set by the caller (shaped). */
function glyph_outline(info, t, codepoint) {
  return memo("glyph" + JSON.stringify([info.ps, t.axes, codepoint]), () => {
    const outline = new Path();
    for (const c of info.font.glyphToJson(codepoint)) {
      const v = c.values;
      if (c.type === "M") outline.moveTo(v);
      else if (c.type === "L") outline.lineTo(v);
      else if (c.type === "C") outline.curveTo([v[0], v[1]], [v[2], v[3]], [v[4], v[5]]);
      else if (c.type === "Q") {
        const last = outline.d[outline.d.length - 1], px = last[last.length - 2], py = last[last.length - 1];
        outline.curveTo([px + 2 / 3 * (v[0] - px), py + 2 / 3 * (v[1] - py)], [v[2] + 2 / 3 * (v[0] - v[2]), v[3] + 2 / 3 * (v[1] - v[3])], [v[2], v[3]]);
      } else outline.closePath();
    }
    return outline.removeOverlap();
  });
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
    const p = new Path(), starts = [];      // where each glyph starts along the line, with the text index (UTF-16) it came from: a word's letters placed one by one (path_letters) keep their kerning
    for (const g of buffer.getGlyphInfosAndPositions()) {
      starts.push([g.cluster, x]);
      const outline = glyph_outline(info, t, g.codepoint).copy();
      outline.scale(k).translate(x + (g.xOffset || 0) * k, (g.yOffset || 0) * k);
      p.appendPath(outline);
      x += (g.xAdvance || 0) * k + tr;
    }
    return { path: p, width: x, starts };
  });
}

/** where each letter of a word starts and how wide it is, from the whole word shaped once (kerning and tracking in):
 *  per code point [start, width], or null for a letter folded into the one before it (a ligature). */
function letter_places(txt, t, size) {
  const { starts, width } = shaped(txt, t, size), tr = t.tracking / 1000 * size, out = [];
  const at = new Map(starts.map(([cl, x]) => [cl, x]));      // the first glyph of a cluster is the one that stands at it
  for (const [i, x] of starts) if (!at.has(i) || at.get(i) > x) at.set(i, x);
  const letters = [...txt];
  let unit = 0;
  const xs = letters.map((ch) => { const x = at.has(unit) ? at.get(unit) : null; unit += ch.length; return x; });
  for (let i = 0; i < letters.length; i++) {
    if (xs[i] === null) { out.push(null); continue; }
    let next = width; for (let j = i + 1; j < letters.length; j++) if (xs[j] !== null) { next = xs[j]; break; }
    out.push([xs[i], Math.max(next - xs[i] - tr, 0)]);
  }
  return out;
}

/** text → outlines. */
export const text_path = (txt, t, size) => shaped(txt, t, size).path.copy();
/** the type the tool sets its own words in, on a sheet (#18): the face that ships with the page (Inter). */
export const page_type = () => ({ family: "Inter", ps: fallback_ps, tracking: 0, lang: 0, axes: {}, features: {} });

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
  // the ring's rhythm first (#169): a dash or a gap mark's own shape and length (a dot's length is its Ø)
  const rh = rhythm_mark(ring, i), rh_dot = rh && (rh.shape || SHAPES[ring.shape]) === "dot";
  const L = (rh && !rh_dot ? rh.len : ring.len) * k, W = (rh_dot ? rh.len : ring.w) * k;
  // its own shape (4.78, #349: "a tick can grow or become anything else … a wedge"): nudge.shape, a place in SHAPES
  // after "as the ring" (0); a mark of its own shape keeps the ring's length, width and rounding. A rhythm's wedge
  // keeps the ring's inner width, as the ring's own wedge does
  const nudged = n.shape > 0 && SHAPES[n.shape - 1] && SHAPES[n.shape - 1] !== "file" ? SHAPES[n.shape - 1] : null;
  const own = nudged || (rh && rh.shape);
  const shape = own ? mark_outline(ring, L, W, own, own === "wedge" && nudged ? 0 : null, grow, solid)
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
  r = Math.max(r, 1e-3);                           // at a radius of 0 the letters' angles would be NaN (c / r), and NaN reaches the file (found 25 Oct 2026); a hair of a radius keeps every number real
  const flip = ((a % 360) + 360) % 360 > 90 && ((a % 360) + 360) % 360 < 270;
  const tr = t.tracking / 1000 * size;
  const letters = [...txt], places = letter_places(txt, t, size);      // the word shaped once: every letter where the kerning puts it (#542a; before, each was placed by the width of the word before it, kerning lost)
  const total = advance(txt, t, size) - tr;
  const dy = numeral_dy(t, txt, size);
  const out = [];
  letters.forEach((ch, i) => {
    if (!ch.trim() || !places[i]) return;
    const [start, own] = places[i];
    const c = start + own / 2 - total / 2;         // letter centre along the word
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
  // every label stands on the middle of the font's capital H (its zero where it has no H), so a 1, a 10 and
  // old-style figures share one line: the middle of the ring's band (#488)
  const h = cap_box(ring, size);
  if (h) return -(h[1] + h[3]) / 2;
  const b = text_path(txt, ring, size).bounds();
  return b ? -(b[1] + b[3]) / 2 : 0;
}

/** the font's capital H at this size (its zero where it has no H): [x0, y0, x1, y1], baseline at 0 */
function cap_box(ring, size) {
  return text_path("H", { ...ring, features: {} }, size).bounds() || text_path("0", ring, size).bounds();
}

/** a numerals or text ring's band (#488; Okay, 20 Oct 2026: "ring size is determined by cap middle layout. This is
 *  our fixed ring thickness for type"): one cap height thick, at the ring's size. Its radius is the circle that holds
 *  still — the outer, the middle or the inner one ("Resize Ring from", as a ticks ring's ends) — and the band grows
 *  away from it as the size grows. → [inner, outer] in mm from the centre. */
export function text_band(ring) {
  const h = cap_box(ring, ring.size), cap = h ? h[3] - h[1] : ring.size * 0.7;
  const mid = ring.r + band_side(ring) * cap / 2;
  return [max(mid - cap / 2, 0), mid + cap / 2];
}
/** every edge a ring has, in mm from the centre: where its radius measures to and the inner and outer ends of what it
 *  draws (a mark's length, a dot's Ø, a band's width, a numeral's cap band). → [r, inner, outer], the same twice when
 *  they fall together. */
export function ring_edges(ring) {
  const kind = kind_of(ring);
  if (has_text(ring)) { const [inner, outer] = text_band(ring); return [ring.r, inner, outer]; }
  const ext = kind === "band" ? ring.width : SHAPES[ring.shape] === "dot" ? ring.w : ring.len;
  const outer = ring.r + from_shift(ring, ext);
  return [ring.r, outer - ext, outer];
}

/** the radii a dragged length or radius snaps to (#184; Okay, 14 Oct 2026: lengths and radii "snap to rings' edges
 *  while dragged"): every edge of every ring shown, but the ring being dragged (`except`, its index). Sorted, no doubles. */
// ── the case: surfaces (#582) ────────────────────────────────
export const SURFACES = ["dial", "rehaut", "bezel", "hand"], R_FROM = ["Centre", "Edge", "Fit"];      // R9: appended only
/** how many rings a surface holds (Okay, 11 Nov 2026: "Bezel ring allows up to three rings … Rehaut gets one ring only") */
export const SURFACE_MOST = [Infinity, 1, 3, 1];      // a disc hand: one (Okay, 11 Nov 2026: "A disk hand is allowed a ring in it like rehault")
/** a disc hand a ring can lie on: on, and a disc */
export const disc_hand_on = (S, name) => Boolean(name) && HANDS.includes(name) && Boolean(S["ha_" + name]?.on) && HAND_SHAPES[S["ha_" + name].shape] === "disc" && (FIXED_HANDS.includes(name) || hand_added(S, name));
/** the surface a ring is on now: its own, or the dial's when that part of the case is off */
export const ring_surface = (S, ring) => (SURFACES[ring.surface] === "rehaut" && S.rh_on ? 1 : SURFACES[ring.surface] === "bezel" && S.bz_on ? 2 : SURFACES[ring.surface] === "hand" && disc_hand_on(S, ring.on_hand) ? 3 : 0);
/** the disc's span a ring on it fills (Fit): its outer 30 %, where a 24-hour disc carries its figures */
const disc_span = (S, name) => { const r = max(S["ha_" + name].disc_d, 0.1) / 2; return [0.7 * r, r]; };
/** how many rings stand on a surface now */
export const rings_on = (S, n) => S.rings.filter((r) => ring_surface(S, r) === n).length;
export const FINISHES = ["Paint", "Engrave"];      // how a marking on bare metal is made (Okay, 11 Nov 2026). R9: appended only
/** the bezel's markings lie on its metal: a fixed bezel's always, a rotating one's when Markings is Metal */
export const bezel_marks_on_metal = (S) => S.bz_on && (BEZEL_KINDS[S.bz_kind] === "Fixed" || BEZEL_MARKS[S.bz_marks] === "Metal");
/** a ring cut into the metal it lies on, not painted: the bare plate's with Finish Engrave, the rehaut's, the bezel's on its metal */
export const ring_engraved = (S, ring) => { const s = ring_surface(S, ring); return s === 0 ? S.paint === false && FINISHES[S.engrave] === "Engrave" : s === 1 ? FINISHES[S.rh_engrave] === "Engrave" : s === 2 ? bezel_marks_on_metal(S) && FINISHES[S.bz_engrave] === "Engrave" : false; };
/** the colour an engraved ring shows: its ground's, in shadow — the cut's floor and walls, darker than the face round it */
export const engraved_colour = (S, ring) => { const s = ring_surface(S, ring), g = s === 0 ? PLATE_METAL_COLOURS[S.material] || PLATE_METAL_COLOURS[0] : s === 1 ? S.rh_c : case_metal(S); return [...g.slice(0, 3).map((v) => v * 0.55), 1]; };
export const BEZEL_MARKS = ["Insert", "Metal"];      // where a rotating bezel's markings are: on an insert set in it, or on its metal (Okay, 11 Nov 2026: "for bezels, add markings on metal instead of inset ring"); a fixed bezel's are always on its metal. R9: appended only
/** the bezel is one piece with the case (#599): a fixed bezel with Melt on. A rotating ring is a part of its own, so it can't melt */
export const bezel_melted = (S) => !!(S.bz_on && S.bz_melt && BEZEL_KINDS[S.bz_kind] === "Fixed");
/** the ring's seat over the band's top, mm: none when the bezel is the case's own metal rising */
export const bezel_seat = (S) => (bezel_melted(S) ? 0 : S.bz_seat);
export const BEZEL_KINDS = ["Rotating", "Fixed"];      // rotating: a turning ring with an insert and a coin edge · fixed: a plain pressed ring
/** the rehaut's reach in plan and its rise: a wall rh_len long leaning rh_deg from the vertical */
export const rehaut_w = (S) => +(S.rh_len * sin(S.rh_deg * PI / 180)).toFixed(4);
export const rehaut_h = (S) => +(S.rh_len * cos(S.rh_deg * PI / 180)).toFixed(4);
/** the case's grounds in plan, from the dial's edge out: [inner, outer] radii of each that is on, and the insert's and the
 *  coin edge's reach. The rehaut starts at the dial's edge (Okay, 5 Nov 2026: the dial's size does not include it); the
 *  bezel starts where the rehaut ends (at the dial's edge without one). */
export function case_spans(S) {
  const R = S.dial_d / 2, rh = S.rh_on ? [R, R + rehaut_w(S)] : null, b0 = rh ? rh[1] : R;
  const bz = S.bz_on ? [b0, b0 + S.bz_w] : null;
  const rotating = bz && S.bz_kind === 0;
  const insert = rotating && S.bz_marks !== 1 ? [b0 + S.bz_in_in, b0 + S.bz_w - S.bz_in_out] : null;
  const marks = insert ?? (bz ? [b0, bz[1] - S.bz_chamfer] : null);      // where the bezel's rings stand: its insert, or its metal inside the chamfer
  const teeth = rotating && S.bz_teeth_depth > 0 ? bz[1] + S.bz_teeth_depth : bz ? bz[1] : null;
  return { dial: [0, R], rehaut: rh, bezel: bz, insert, outer: teeth ?? (rh ? rh[1] : R), chamfer: bz ? [bz[1] - S.bz_chamfer, bz[1]] : null, marks };
}
/** the radius the drawing reaches, mm: the dial's, or the case's outer edge (the page and the view fit it) */
export const reach_mm = (S) => case_spans(S).outer;
/** a ring as the geometry draws it: on the dial it is itself; on the rehaut or the bezel its radius reads from that
 *  surface's inner edge (Edge) or it fills the surface (Fit: a band as wide as the surface and centred on it, marks as
 *  long as it is wide from its outer edge, words on its middle). A surface that is off puts the ring back on the dial. */
export function placed(S, ring) {
  const span = SURFACES[ring.surface] === "rehaut" ? case_spans(S).rehaut : SURFACES[ring.surface] === "bezel" ? case_spans(S).marks : SURFACES[ring.surface] === "hand" && disc_hand_on(S, ring.on_hand) ? disc_span(S, ring.on_hand) : null;
  if (!span || !ring.r_from) return ring;
  const [a, b] = span, kind = kind_of(ring);
  if (R_FROM[ring.r_from] === "Edge") return { ...ring, r: a + ring.r };
  if (kind === "band") return { ...ring, r: (a + b) / 2, width: b - a, from: 1 };      // Fit: the radius its middle
  if (kind === "ticks" || kind === "markers") return { ...ring, r: b, len: b - a, from: 0 };
  return { ...ring, r: (a + b) / 2 };
}
/** the case's metal as a colour: a colour of your own (c_metal) or the chosen metal's preset in the chosen paint (show.js keeps
 *  the same lists). The bezel is always case material (Okay, 10 Nov 2026: "bezel is always case material for now. link and lock") */
export const STYLE_NAMES = ["engineer", "artisan"], METAL_NAMES = ["steel", "gold", "alu", "bronze", "titanium", "black"];      // R9: appended only
const hex_rgba = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1);
export const case_metal = (S) => S.c_metal || hex_rgba(WATCH_PRESETS(STYLE_NAMES[S.w_style] || "artisan").metals[METAL_NAMES[S.w_metal]] || "#9c8250");
/** the rehaut's shading in plan (Okay, 10 Nov 2026: "Rehault might need shadows hightilghts to sell it"): the wall leans out, so
 *  its inner face is lit where it faces the sun — the far side from the sun's clock angle — and dark under the sun; N
 *  sectors of the ring, each tinted toward white or black by REHAUT_SHADE at most, as a drawing of a turned wall is */
export const REHAUT_SHADE = 0.3, REHAUT_SECTORS = 72;
export function shaded_ring(a, b, colour, from, shade = REHAUT_SHADE, N = REHAUT_SECTORS) {
  const out = [], step = 360 / N, arc = 4, tint = (c, k) => (k >= 0 ? c.slice(0, 3).map((v) => v + (1 - v) * k) : c.slice(0, 3).map((v) => v * (1 + k))).concat(c[3]);
  for (let i = 0; i < N; i++) {
    const a0 = i * step, a1 = a0 + step, mid = (a0 + a1) / 2, k = cos((mid - from - 180) * PI / 180) * shade;      // lit opposite the sun
    const pt = (r, deg) => [r * sin(deg * PI / 180), r * cos(deg * PI / 180)], pts = [];
    for (let j = 0; j <= arc; j++) pts.push(pt(b, a0 + (a1 - a0) * j / arc));
    for (let j = arc; j >= 0; j--) pts.push(pt(a, a0 + (a1 - a0) * j / arc));
    out.push([new Path().polygon(...pts), tint(colour, k)]);
  }
  return out;
}
/** the case's grounds in plan: [role, path, colour], bottom first. The coin edge is the bezel ring's own outline —
 *  the radius a law of the angle, full on the lands, a round scallop in each pitch (the 3D exercise's rule, round 28) */
export function case_grounds(S) {
  const key = "grounds" + JSON.stringify([S.dial_d, ...Object.keys(S).filter((k) => k.startsWith("rh_") || k.startsWith("bz_")).sort().map((k) => S[k]), S.sh_from, S.c_metal, S.w_metal, S.w_style, S.c_plate]);
  return memo(key, () => build_case_grounds(S));      // the sectors and the scalloped outline are built once per set of numbers, not every frame
}
function build_case_grounds(S) {
  const sp = case_spans(S), out = [], ring_shape = (a, b) => circle(2 * b).difference(circle(2 * a));
  const lighter = (c, k) => [...c.slice(0, 3).map((v) => min(1, v + (1 - v) * k)), c[3]], darker = (c, k) => [...c.slice(0, 3).map((v) => v * (1 - k)), c[3]];
  if (sp.bezel) {
    const [b0, b1] = sp.bezel, T = { n: max(3, round(S.bz_teeth_n) || 60), depth: S.bz_kind === 0 ? max(0, S.bz_teeth_depth) : 0, fill: min(max(S.bz_teeth_fill, 0.05), 0.95) };
    let outer;
    if (T.depth > 0) {      // the scalloped outline, 28 points a pitch, as the 3D wall's stations
      const R = b1 + T.depth, pitch = 2 * PI / T.n, a = R * pitch * T.fill / 2, rd = (a * a + T.depth * T.depth) / (2 * T.depth), per = 28, N = T.n * per, pts = [];
      for (let k = 0; k < N; k++) { const th = k / N * 2 * PI, x = R * (((th % pitch) + pitch) % pitch - pitch / 2), r = abs(x) < a ? R - (Math.sqrt(rd * rd - x * x) - (rd - T.depth)) : R; pts.push([r * sin(th), r * cos(th)]); }
      outer = new Path().polygon(...pts).difference(circle(2 * b0));
    } else outer = ring_shape(b0, b1);
    const metal = case_metal(S);      // the bezel is case material, linked and locked (bz_c is unread: R8)
    out.push(["bezel", outer, metal]);
    if (sp.chamfer && sp.chamfer[0] > b0) out.push(["bezel chamfer", ring_shape(sp.chamfer[0], sp.chamfer[1]), lighter(metal, 0.35)]);      // the top chamfer catches the light
    if (sp.insert && sp.insert[1] > sp.insert[0]) out.push(["insert", ring_shape(sp.insert[0], sp.insert[1]), S.bz_insert_c]);
  }
  if (sp.rehaut) for (const [path, c] of shaded_ring(sp.rehaut[0], sp.rehaut[1], S.rh_c, S.sh_from)) out.push(["rehaut", path, c]);      // the wall's light and shade, by the sun's angle
  return out;
}
export function snap_radii(S, except = -1) {
  if (!S.ui_snap) return [];                       // Settings: Snap off (the start) — nothing to land on
  const out = new Set();
  S.rings.forEach((ring, i) => { if (ring.on && i !== except) for (const r of ring_edges(placed(S, ring))) if (r > 0) out.add(+r.toFixed(3)); });
  for (const span of [case_spans(S).rehaut, case_spans(S).bezel, case_spans(S).insert]) if (span) for (const r of span) out.add(+r.toFixed(3));      // the case's edges too
  if (S.ui_snap_guides) for (const g of S.gd_more || []) if (g.k >= 0 && GUIDE_MORE[g.kind] === "circle" && g.r > 0) out.add(+g.r.toFixed(3));      // Snap to guides: the added guide circles too (Settings; the Guides list)
  return [...out].sort((a, b) => a - b);
}

/** −1 the outer circle holds still (the band lies inside it), +1 the inner, 0 the middle */
const band_side = (ring) => ({ "outer edge": -1, "inner edge": 1 })[ANCHORS[ring.anchor]] || 0;

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
    return ring.r + out + (mode === "on path" ? band_side(R) * (text_band(R)[1] - text_band(R)[0]) / 2 : tangent_shift(R, mode, a, label));
  };
  return max(ring.r + middle(ring.anchor || 0) - middle(to), 0);
}

/** placement, radius, angle, size and rotation of the numeral at position i, nudge included. */
function numeral_setup(ring, i, a) {
  const n = ring.nudge[String(i)] || {};
  return [MODES[ring.mode], ring.r + (n.dr || 0), a + (n.da || 0), ring.size * (n.s ?? 1), n.rot || 0];
}

/** how far a numeral's middle stands from the radius when the outer or inner circle of the band holds still (#488):
 *  half the cap height for a numeral turned with the ring; for an upright one, its reach toward the dial's edge — half
 *  its width at 3 and 9, half the cap height at 12 and 6. Measured at the ring's size, so a numeral nudged bigger keeps
 *  its place (Okay, 21 Oct 2026: the 12 "sits at the default position"). → 0 for the middle. Outer: inward (−). */
function tangent_shift(ring, mode, a, label) {
  const side = band_side(ring);
  if (!side) return 0;
  const h = cap_box(ring, ring.size), b = text_path(label, ring, ring.size).bounds();
  if (!h || !b) return 0;
  const half = (h[3] - h[1]) / 2, t = a * PI / 180;
  const reach = mode === "upright" ? abs(sin(t)) * (b[2] - b[0]) / 2 + abs(cos(t)) * half : half;
  return side * reach;
}

/** the type one numeral draws with: its own font when Edit one numeral gave it one (#513), the ring's otherwise */
const own_type = (ring, i) => { const n = (ring.nudge && ring.nudge[String(i)]) || {}; return n.ps ? { ...ring, family: n.family, ps: n.ps, axes: n.axes || {} } : ring; };
function numeral_at(ring0, i, a0, label) {
  const ring = own_type(ring0, i);
  const [mode, r0, a, size, rot] = numeral_setup(ring, i, a0);
  const r = mode === "on path" ? r0 + band_side(ring) * (text_band(ring)[1] - text_band(ring)[0]) / 2 : r0 + tangent_shift(ring, mode, a, label);
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
  const [mode, r0, a, size, rot] = numeral_setup(ring, i, a0);
  // the same radius as the outlines (numeral_at): the band's circle that holds still, and the label's reach from it (#488)
  const r = mode === "on path" ? r0 + band_side(ring) * (text_band(ring)[1] - text_band(ring)[0]) / 2 : r0 + tangent_shift(ring, mode, a, label);
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
  for (const raw of S.rings) {
    const ring = placed(S, raw);      // on the rehaut or the bezel: its radius there (#582)
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
    const d = { ring, raw, kind, keep, taken, shape, at, parts, path: memo(key, final), ghost: !ring.on };      // raw: the ring as the settings hold it (the list's identity); ring: as drawn, placed on its surface (#582)
    // a stroke round the letters (#551) or the marks (#556): a grown outline of the ring's final shape, drawn over it in its own colour
    if (has_stroke(ring)) d.stroke = memo("stroke" + key, () => stroke_outline(d.path, ring.stroke_w, STROKE_SIDES[ring.stroke_side] || "Outside", STROKE_JOINS[ring.stroke_join] || "Miter"));
    // a band whose sectors have colours of their own is drawn as one shape per colour: the sectors of that
    // colour, cut like the whole ring. Which sectors go together is remembered, not which colour they have.
    if ((kind === "band" || kind === "numerals" || kind === "text") && at.some((i) => ring.cs && ring.cs[String(i)])) {      // a numeral's own colour too (#513): the same split
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
    : w.follows ? day_list(lang, w.day_form, w.own_names) : MOMENT_NAMES[MOMENT_LANGS.find((l) => MOMENT_NAMES[l].days.includes(w.text)) || "en"].days;
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
  // circles and arcs grow by their measures, as rectangles do (#168, 14 Oct 2026); the polygon and the arch grow by
  // stroking (offset), which is exact now that the stroker works at scale (expandStroke): a polygon grown by its
  // measures had corners a quarter too thick, their rounding not concentric with the hole's (#547, 30 Oct 2026)
  if (shape === "circle") return [circle(w.w), (d) => circle(w.w + 2 * d)];
  if (shape === "polygon") {
    const n = min(max(parseInt(w.sides) || 6, 3), 24), R = w.w / 2;
    const points = Array.from({ length: n }, (_, i) => { const a = radians(180 / n + i * 360 / n); return [R * sin(a), -R * cos(a)]; });
    const hole = poly(points, points.map(() => min(w.round, R * 0.9)));
    return [hole, (d) => offset(hole.copy(), d)];
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
/** a day window's short names in its Names language (EN · TR · DE · FR · IT): what a Custom day left blank shows */
export const day_short = (names) => MOMENT_NAMES[MOMENT_LANGS[names] || "en"].days;

let TODAY = null;                                  // the calendar day "now", as the window tells it (set_today); the geometry never reads the clock itself (R6)
/** the window says what day it is (once at its start, then as time passes): a dial that follows the date shows it */
export function set_today(day) { const was = TODAY; TODAY = day; return was !== day; }
export const day_text = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function shown_day(S) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(S.date || "")) return S.date;      // a day as the bar writes it; anything else (a link can carry any text) is today, never NaN into the moment
  return TODAY || "2026-01-01";                    // with no day told (a test without a window): one fixed day, so the same settings always draw the same
}

/** a window as it shows now: one that follows the date (4.62) says the moment's date or weekday, and a moon window its
 *  age, from the bar's date and the time (moment.js); any other shows its own typed text and age, as before. */
export function shown_window(S, w) {
  if (!w.follows) return w;
  const kind = WINDOW_KINDS[w.kind], mo = moment(shown_day(S), S.t);
  if (kind === "date" || kind === "day" || kind === "big date") return { ...w, text: window_text(kind === "big date" ? "date" : kind, mo, MOMENT_LANGS[w.names] || "en", w.day_form, w.own_names) };
  if (kind === "am · pm" && w.ampm_form) return { ...w, text: window_text(kind, mo, "en", 0, w.own_names) };      // its words jump at noon and midnight (#516)
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
  } else if (kind === "am · pm" && !w.ampm_form) {                 // the disc under the half-round hole, turning on its flat side once a day: pm in the picture's colour, am the disc's
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
  const shows_text = kind === "date" || kind === "day" || kind === "big date" || (kind === "am · pm" && w.ampm_form);
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
  if (S.ha_on) for (const name of hands_shown(S)) {
    const h = S["ha_" + name];
    lines.push([hand_word(name), h.w * (h.w_scale || 1)]);
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

/** one hand's clock angle at time t (seconds of the day): the fixed three from hand_angles; a GMT hand (#577) the
 *  other time — t plus its offset — once round a day (24 h: midnight at 12, so a 24-hour ring reads as a GMT bezel
 *  does; Okay, 9 Nov 2026: "Midnight at top") or twice (12 h: as the hour hand of the other time) */
export function hand_angle(S, name, t) {
  const i = FIXED_HANDS.indexOf(name);
  if (i >= 0) return hand_angles(t, BEATS[S.ha_beat][1])[i];
  const H = S["ha_" + name] || HAND_BASE;
  if (FUNCTIONS[name] && FUNCTIONS[name].places) {      // a calendar hand: its place for the moment, jumping as a wheel does
    const mo = moment(shown_day(S), t);
    let place = hand_place(name, mo) || 0;
    if (HAND_MOTIONS[H.motion] === "Sweep") {      // on through the day: a day's share of a place (the month's hand a month's share)
      const day = (mo.h * 3600 + mo.min * 60 + mo.s) / 86400;
      place += name === "month" ? (mo.d - 1 + day) / new Date(Date.UTC(mo.y, mo.m, 0)).getUTCDate() : day;
    }
    return place / FUNCTIONS[name].places * 360;
  }
  const day = (((t + (+H.offset || 0) * 3600) % 86400) + 86400) % 86400;
  return HAND_CYCLES[H.cycle] === "12 h" ? (day % 43200) / 43200 * 360 : day / 86400 * 360;
}
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

/** the commonest hand fit, the hole's Ø by the hand (mm): hour 1.50 · minute 0.90 · second 0.20 — the pairing
 *  the parts houses sell most (Esslinger's 0.90/1.50 hands; the second's collet 0.20). #89 would add real movements. */
export const HOLE_FIT = { hour: 1.5, minute: 0.9, second: 0.2 };
/** the Ø of the pipe's hole through a hand's hub (#404): 0 when the hand has no hub or Hole is None. */
export const hole_of = (h, name = "") => (!(h.hub > 0) || HAND_SHAPES[h.shape] === "disc" ? 0 : h.hole_as === 1 ? (h.fit_d ?? HOLE_FIT[name]) || 0 : h.hole_as === 2 ? max(+h.hole || 0, 0) : 0);
/** a hand's boss as a part of its own — the hub disc with the hole through it, upright — for show mode's lit picture
 *  (#404: "the boss itself, as a round disc"); null when the hand has no hub. The dial side keeps it in the hand's shape. */
export function hand_boss(h, name = "") {
  if (!(h.hub > 0) || HAND_SHAPES[h.shape] === "disc") return null;
  const hole = hole_of(h, name);
  return memo("boss" + name + key_of(h), () => (hole > 0 && hole < h.hub ? circle(h.hub).difference(circle(hole)) : circle(h.hub)));
}
/** one hand, upright, remembered until its settings change (only turning happens per frame).
 *  name: which hand (hour · minute · second), only for the hole's common fit (hole_of). */
export function hand_shape(h, name = "") {
  return memo("hand" + (h.hole_as === 1 ? name : "") + key_of(h), () => {
    let shape = HAND_SHAPES[h.shape];
    if (shape === "file") { file_shape(h.file); shape = "baton"; }       // no file: a baton (R17)
    let p = shape === "disc" ? disc_hand(h) : hand_outline(shape, h.len, h.w, h.tail, h.tip, h.feature, h.feature_at / 100 * h.len, h.round || 0, h.bulge ?? 37.5);
    if (h.wall > 0) p = p.difference(offset(p, -h.wall));
    if (h.hub > 0 && shape !== "disc") p = p.union(circle(h.hub));      // its hub, solid even on a hollow hand (#370)
    const hole = hole_of(h, name);
    if (hole > 0) p = p.difference(circle(hole));      // the pipe's hole through the hub, and through the hand's tail under it (#404)
    if (h.counter > 0) p = p.union(place(circle(h.counter), -h.tail * COUNTER_AT, 0));
    const holes = hand_openings(h);
    if (holes) p = p.difference(holes);      // cut through: open, the dial shows; filled, the scene lays the lume in them
    return p;
  });
}

/** a hand's openings (#175), upright, one path; null when it has none (Opening off, a disc hand, nothing left to cut).
 *  Along the hand from From % to To % of its Length: Count shapes, Gap between them, each Width across — a Bar as long
 *  as its share, a Dot round, as wide as the narrower of its share and Width. */
export function hand_openings(h) {
  if (!h.op_on || HAND_SHAPES[h.shape] === "disc") return null;
  return memo("open" + key_of(h), () => {
    const n = max(Math.round(h.op_count || 1), 1), a = h.len * h.op_from / 100, b = h.len * h.op_to / 100, gap = max(h.op_gap || 0, 0), w = max(h.op_w || 0, 0);
    const each = (b - a - gap * (n - 1)) / n;
    if (!(each > 0.01) || !(w > 0.01)) return null;
    let p = new Path();
    for (let k = 0; k < n; k++) {
      const y0 = a + k * (each + gap);
      p = p.union(h.op_shape === 1 ? circle(min(w, each)).translate(0, y0 + each / 2) : new Path().rect(-w / 2, y0, w, each));
    }
    return p;
  });
}
/** a hand whose openings are filled with lume (#175): they are a part of their own, in the lume's colour */
export const fills_openings = (h) => Array.isArray(h.op_fill) && (h.op_fill[3] ?? 1) > 0 && Boolean(hand_openings(h));      // Open: alpha 0, nothing laid in them

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
    const tri = h.mark_tri && SHAPES[h.mark] === "wedge";      // a triangle, its point outward (#574)
    let mark = tri ? mark_outline(mark_ring, h.mark_len, h.mark_w, "wedge", 0).rotate(180) : mark_outline(mark_ring, h.mark_len, h.mark_w);
    const b = mark.bounds();
    if (!b) return null;
    const outer = h.mark_in ? min(h.len, max(h.disc_d, 0.1) / 2) : h.len;      // kept inside the disc (#344)
    return place(mark, max(outer - (b[3] - b[1]) / 2, 0.1), 0);
  });
}
/** a disc hand whose marker is painted on (#300) */
export const paints_mark = (h) => HAND_SHAPES[h.shape] === "disc" && h.mark_as === 1;
/** a painted marker's stroke (#574): a filled ring round it, outside its outline (R4: never a stroke in the files); null without one */
export const mark_stroke = (h) => (paints_mark(h) && h.mark_stroke_w > 0 && disc_mark(h) ? memo("mstroke" + key_of(h), () => stroke_outline(disc_mark(h), h.mark_stroke_w, "Outside", "Miter")) : null);


/** the hands that are on, bottom first: [name, colour, upright shape, clock angle]. */
function hand_items(S, t) {
  return hands_shown(S).map((name) => { const h = S["ha_" + name]; return [name, h.c, hand_shape(h, name), hand_angle(S, name, t), h]; });      // the stack's order, bottom first (#577)
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
/** a colour as the inks are named (#35): #RRGGBB, its alpha left out. */
export const ink_hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();

// ── inks (show mode's Inks pane, #545) ───────────────────────
//   What a printer sees: every colour printed on the dial is one ink, the same colour exactly (two near-blacks are two
//   inks: Okay, 25 Oct 2026, "Exact match only"), and an ink stands INK_MM proud of the plate unless given its own
//   height. An ink can be split in two of the same colour, A and B, each its own height (a thick red and a thin one:
//   "One thick red one thin possible via a switch on the pane"); a part says which by its ink_b / frame_b. What is printed
//   on a disc (figures, a moon, its shade) is on another part of the watch, so it is never one of the dial's inks: each
//   window's disc prints have their own height (print_h). The disc itself is their baseline ("no need for ink height
//   there, that's the baseline"). All inks at once (w_ink_all) adds the same mm to every printed height.
export const INK_MM = 0.21, INK_STEP_MM = 0.035, INK_START = 6, INK_MOST = 0.5;      // 0.21 = the 6 steps of 0.035 mm an ink stood at; the most a height can be
/** one ink's settings, with what is not set filled in */
export const ink_of = (S, hex) => { const e = (S.w_inks || {})[hex] || {}; const h = e.h ?? INK_MM; return { h, two: Boolean(e.two), b: e.b ?? h }; };
/** the dial's inks, in the order the Colours pane lists their parts (rings top first, then the windows' frames):
 *  [{ hex, colour, parts: [{ kind: "ring" | "frame", i, name, sectors }] }] — a band's sectors of one colour are one
 *  part of that ink, so a band of two colours is a part of two inks */
export function dial_inks(S) {
  const inks = new Map(), put = (c, part) => { if (!Array.isArray(c)) return; const hex = ink_hex(c); if (!inks.has(hex)) inks.set(hex, { hex, colour: c, parts: [] }); const ink = inks.get(hex), same = ink.parts.find((p) => p.kind === part.kind && p.i === part.i); if (same) same.sectors += 1; else ink.parts.push(part); };
  S.rings.forEach((r, i) => {
    const name = r.name || kind_of(r);
    if (kind_of(r) === "band" && positions_of(r).length > 1) for (const at of positions_of(r)) put(sector_colour(r, at), { kind: "ring", i, name, sectors: 1 });
    else put(r.c, { kind: "ring", i, name, sectors: 0 });
    if (has_stroke(r)) put(r.stroke_c, { kind: "stroke", i, name: name + " stroke", sectors: 0 });      // its stroke is printed in its own colour, so it is an ink's part too (Okay, 31 Oct 2026, 03:31: "it has color, will go into a ink group in showcase")
  });
  windows_of(S).forEach((w, i) => { if (w.on) put(w.ink, { kind: "frame", i, name: window_name(w) + " frame", sectors: 0 }); });
  return [...inks.values()];
}
/** what is printed on the shown hands (#175, #574): each hand's lume, a disc's painted mark and its stroke — in show mode
 *  inks over the blade or disc they sit on (Okay, 3 Nov 2026, 02:11: "all the hands that have other colors or lume areas
 *  are expanded here"). [{ hand, kind: "lume" | "mark" | "stroke", key, own, colour, hex, name }], grouped by colour, so
 *  the parts of one ink stand together; own: the key of the part's own height (null: its ink's) */
export function hand_prints(S) {
  if (!S.ha_on) return [];
  const out = [];      // short: the names' column is narrow ("Hour lume", "Minute stroke")
  for (const h of hands_shown(S)) {
    const H = S["ha_" + h];
    if (fills_openings(H)) out.push({ hand: h, kind: "lume", key: "op_fill", own: "op_ink_h", colour: H.op_fill, name: hand_word(h, "lume") });
    if (paints_mark(H) && disc_mark(H)) out.push({ hand: h, kind: "mark", key: "mark_c", own: "mark_ink_h", colour: H.mark_c, name: hand_word(h, "mark") });
    if (mark_stroke(H)) out.push({ hand: h, kind: "stroke", key: "mark_stroke_c", own: "mark_stroke_ink_h", colour: H.mark_stroke_c || H.c, name: hand_word(h, "stroke") });
  }
  const order = [...new Set(out.map((p) => ink_hex(p.colour)))];
  return out.map((p) => ({ ...p, hex: ink_hex(p.colour) })).sort((p, q) => order.indexOf(p.hex) - order.indexOf(q.hex));
}
/** a window's name in the lists: its kind and where it is ("Date at 3", "Moon phase at 6") */
export const window_name = (w) => { const k = WINDOW_KINDS[w.kind] || "window"; return k[0].toUpperCase() + k.slice(1) + " at " + (w.at_deg != null ? Math.round(w.at_deg) + "°" : (DATE_AT[w.at] || DATE_AT[0])[0]); };
/** how high a printed item of the scene stands, mm: its ink's height (A, or B when the ink is split and the part on B),
 *  or its disc's prints' height; with All inks at once added; never below the plate */
export function ink_mm(S, x) {
  let h = INK_MM;
  if (x.role === "ring" || x.role === "date frame") {
    const ink = ink_of(S, ink_hex(x.fill)), on_b = x.role === "ring" ? x.ring?.ring?.ink_b : windows_of(S)[x.window]?.frame_b;
    const own = x.role === "ring" ? x.ring?.ring?.ink_h : windows_of(S)[x.window]?.frame_h;      // unlinked: the part's own height
    h = own ?? (ink.two && on_b ? ink.b : ink.h);
  } else if (x.role === "ring stroke") {
    const ink = ink_of(S, ink_hex(x.fill));
    h = x.ring?.ring?.stroke_h ?? (ink.two && x.ring?.ring?.stroke_b ? ink.b : ink.h);
  } else if (x.role === "date number" || x.role === "date picture" || x.role === "disc print") h = windows_of(S)[x.window]?.print_h ?? INK_MM;
  else if (x.role === "lume" || x.role === "mark") {      // printed on a hand: a lume (#175), a disc's painted mark and its stroke (#574) — its own height, or its ink's, over the blade or disc it sits on
    const H = S["ha_" + x.name] || {}, own = x.role === "lume" ? H.op_ink_h : x.edge ? H.mark_stroke_ink_h : H.mark_ink_h;
    h = own ?? ink_of(S, ink_hex(x.fill)).h;
  }
  return Math.max(0, Math.min(INK_MOST, h + (+S.w_ink_all || 0)));
}
/** the inks a dial is printed in (#35): every shown ring's colour (each sector's of a band), every shown window's frame;
 *  in the order they lie, top first. → [#RRGGBB] */
export function inks_of(S) {
  const out = [];
  for (const ring of S.rings) {
    if (!ring.on) continue;
    out.push(ink_hex(ring.c));
    if (KINDS[ring.kind] === "band" || has_text(ring)) for (const c of Object.values(ring.cs || {})) out.push(ink_hex(c));      // a sector's or one numeral's own colour (#513) is an ink too: it gets its film (found 25 Oct 2026)
    if (has_stroke(ring)) out.push(ink_hex(ring.stroke_c));      // its stroke's colour gets its film
  }
  for (const w of windows_of(S)) if (w.on) out.push(ink_hex(w.ink || INK));
  return [...new Set(out)];
}

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
  const index = (d) => S.rings.indexOf(d.raw || d.ring);

  if (S.out_production) {                          // mono mask, no plate, no hands
    const black = [0, 0, 0, 1], cuts = S.out_cutlines !== false;      // #222: the cut lines only while asked for (they are on to start)
    // one ink only (#35, a film per ink for pad printing): the rings, sectors and frames of that colour; the cut lines and
    // marks on every film, since they are what the films are laid by
    const ink = S.out_ink || "", of = (c) => !ink || ink_hex(c) === ink;
    for (const d of rings) {
      if (ring_surface(S, d.raw || d.ring) === 3) continue;      // printed on a disc hand, not on the face
      if (ring_engraved(S, d.raw || d.ring)) continue;      // cut in, not printed: in no film
      if (!ink || !d.tints) { if (of(d.ring.c) || (d.tints && !ink)) add("ring", d.path, black, { ring: d, index: index(d) }); }
      else d.tints.forEach((tint, n) => { if (of(sector_colour(d.ring, tint.at))) add("ring", tint.path, black, { ring: d, index: index(d), part: n + 1 }); });
      if (d.stroke && of(d.ring.stroke_c)) add("ring stroke", d.stroke, black, { ring: d, index: index(d), part: "stroke" });
    }
    for (const x of windows) {
      if (of(wc(x).ink)) add("date frame", x.frame, black, { window: x.index });
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
    // the case's grounds (#582), preview only until the surfaces export as parts of their own (R5 for now): the bezel ring
    // with its coin edge, its top chamfer as a lighter band, the insert, the rehaut — under everything, out from the dial
    if (preview) for (const [role, path, fill] of case_grounds(S)) add(role, path, fill);
    const discs = preview && S.xray ? windows.map((x) => ({ x, d: window_disc(S, x) })).filter((v) => v.d) : [];
    const xray = discs.length > 0, chosen = xray ? discs.find((v) => v.x.index === (S.ui_window ?? 0)) || null : null;
    const under = discs.filter((v) => v !== chosen).sort((p, q) => q.d.outer - p.d.outer);      // the biggest first: the deepest
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
    if (S.paint === false) add("plate", S.ha_on ? statik.plate : statik.plate_holed, dim(PLATE_METAL_COLOURS[S.material] || PLATE_METAL_COLOURS[0], face), { metal: true });      // no paint: the bare metal is the face (a file leaves it unprinted, output.js drawn)
    else add("plate", S.ha_on ? statik.plate : statik.plate_holed, dim(S.c_plate, face));      // the hole shows when the hands are hidden
    const on_disc = (d) => ring_surface(S, d.raw || d.ring) === 3;      // a ring on a disc hand: drawn with the hand, turning with it
    for (const d of rings) {
      if (on_disc(d)) continue;
      if (ring_engraved(S, d.raw || d.ring)) {      // cut in (Finish Engrave): the ground's colour in shadow, its letters' stroke with it; a layer of its own in the files
        const cut = dim(engraved_colour(S, d.raw || d.ring), face);
        add("ring", d.path, cut, { ring: d, index: index(d), engrave: true });
        if (d.stroke) add("ring stroke", d.stroke, cut, { ring: d, index: index(d), part: "stroke", engrave: true });
        continue; }
      if (d.tints) d.tints.forEach((tint, n) => add("ring", tint.path, dim(sector_colour(d.ring, tint.at), face), { ring: d, index: index(d), part: n + 1 }));
      else add("ring", d.path, dim(d.ring.c, face), { ring: d, index: index(d) });
      if (d.stroke) add("ring stroke", d.stroke, dim(d.ring.stroke_c, face), { ring: d, index: index(d), part: "stroke" });      // over its letters (#551)
    }
    for (const x of windows) add("date frame", x.frame, dim(wc(x).ink, face), { window: x.index });
    if (S.ha_on) {
      for (const [name, colour, path, a, h] of hand_items(S, t)) {
        add("hand", path, dim(colour, hands_layer), { name, angle: a });
        if (paints_mark(h) && disc_mark(h)) add("mark", disc_mark(h), dim(h.mark_c, hands_layer), { name, angle: a });      // a disc's painted mark turns with it (#300)
        if (mark_stroke(h)) add("mark", mark_stroke(h), dim(h.mark_stroke_c || h.c, hands_layer), { name, angle: a, edge: true });      // and its stroke (#574)
        for (const d of rings) if (on_disc(d) && (d.raw || d.ring).on_hand === name) {      // its ring, printed on it (Okay, 11 Nov 2026: "A disk hand is allowed a ring in it like rehault")
          if (d.tints) d.tints.forEach((tint, n) => add("mark", tint.path, dim(sector_colour(d.ring, tint.at), hands_layer), { name, angle: a, ring: d, index: index(d), part: n + 1 }));
          else add("mark", d.path, dim(d.ring.c, hands_layer), { name, angle: a, ring: d, index: index(d) });
          if (d.stroke) add("mark", d.stroke, dim(d.ring.stroke_c, hands_layer), { name, angle: a, ring: d, index: index(d), part: "stroke" });
        }
        if (fills_openings(h)) add("lume", hand_openings(h), dim(h.op_fill, hands_layer), { name, angle: a });      // its openings' lume turns with it (#175)
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
    S.rings.forEach((raw, i) => {
      const ring = placed(S, raw);      // its guides where it is drawn (#582)
      const focused = focus === "rings" && i === selected, chosen = focused && S.gd_sel, k = ring_guide(S, i);
      if (!ring.on || k === null || !(S.gd_rings || chosen)) return;
      const kind = kind_of(ring);
      const extent = { ticks: ring.len, markers: ring.len, band: ring.width }[kind] || 0;
      let outer = ring.r + from_shift(ring, extent), inner = outer - extent;
      const px = focused ? S.gd_w * 1.5 : S.gd_w, al = faded(focused);
      if (has_text(ring)) {      // the band's three circles: the one that holds still (the radius) solid, the other two dotted (Okay, 21 Oct 2026: "selected line gets full, others dotted")
        [inner, outer] = text_band(ring);
        for (const r of [outer, (outer + inner) / 2, inner]) if (r > 0) add("guide", circle(2 * r), null, { stroke: tone(k, al), px, dots: abs(r - ring.r) > 1e-6 });
      } else edges(k, outer, inner, px, al, ring.r);
    });
    for (const x of windows) {
      const focused = focus === "windows" && x.index === (S.ui_window ?? 0), chosen = focused && S.gd_wsel, k = window_guide(S, x.index), e = radial_extent(x.window);
      if (k === null || !e || !(S.gd_wins || chosen)) continue;
      edges(k, e[1], e[0], focused ? S.gd_w * 1.5 : S.gd_w, faded(focused));
      // its disc's edges, dashed, in the window's colour — the outer one red when the disc passes the case with physics on (4.72, #346)
      const d = window_disc(S, x);
      if (d) {
        const px = focused ? S.gd_w * 1.5 : S.gd_w, a = faded(focused);
        for (const r of [d.inner, d.outer]) if (r > 0) add("guide", circle(2 * r).translate(...d.centre), null, { stroke: r === d.outer && !d.fits ? [...DISC_WARN, a] : tone(k, a), px, spaced: true });
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
export const HAND_MM = ["len", "w", "tail", "tip", "feature", "counter", "wall", "round", "disc_d", "mark_len", "mark_w", "hub", "hole"];
export const WINDOW_MM = ["r", "w", "h", "round", "frame", "clear"];
/** a bezel as it starts (Okay, 11 Nov 2026: "Default bezel is mostly off on all sliders, 1mm height"): a plain ring 1 mm high, its
 *  width kept, every other number 0. Set when the bezel is switched on while its numbers are still DEFAULTS' — so a dial saved
 *  with a bezel (its link leaving out what matched DEFAULTS) comes back as it was */
export const BEZEL_START = { bz_h: 1, bz_chamfer: 0, bz_in_in: 0, bz_in_out: 0, bz_teeth_depth: 0, bz_teeth_chamfer: 0, bz_dial_up: 0, bz_seat: 0, bz_lip: 0, bz_rim: 0, bz_up: 0, bz_dome: 0 };
export const bezel_untouched = (S) => Object.keys(BEZEL_START).every((k) => S[k] === DEFAULTS[k]) && S.bz_w === DEFAULTS.bz_w;
export const CASE_MM = ["rh_len", "bz_w", "bz_chamfer", "bz_in_in", "bz_in_out", "bz_teeth_depth", "bz_teeth_chamfer", "bz_dial_up", "bz_seat", "bz_h", "bz_lip", "bz_rim", "bz_up", "bz_dome"];      // the case's measures (#582); the teeth's count and fill are not mm
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
  for (const key of CASE_MM) visit(S, key);      // the case scales with the dial (#582)
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
export const page_mm = (S) => 2 * reach_mm(S) + 2 * S.margin;      // the page round the dial, or round the case when one is on (#582)
