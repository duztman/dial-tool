// ui.js — the window's small helpers: making elements, numbers and their formats, units typed, colours as text,
// the browser's storage keys (KEY), and the sizes and timings the parts share. No part imports another's helpers
// twice: what two parts need lives here.

import * as G from "./geometry.js";
import * as SHOW from "./show.js";      // show mode: the watch round the dial, its tabs, its export (#509)




export const $ = (sel, root = document) => root.querySelector(sel);

export const el = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const c of children) e.append(c);
  return e;
};

export const svg_el = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);

export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/** a slider tells its stylesheet how far along it is (--p, 0 to 1): the filled part of its track. */
export const filled = (slider) => { const p = clamp((slider.value - slider.min) / ((slider.max - slider.min) || 1), 0, 1).toFixed(4); slider.style.setProperty("--p", p); const pop = slider.closest(".numpop"); if (pop) pop.style.setProperty("--p", p); };      // in the popup the value follows the knob: the box knows --p too

export const PNG_MOST = 16384;                            // a browser's canvas is at most this many pixels a side

export const PNG_SAFE = 4096 * 4096;                      // Safari on a phone or tablet draws nothing past this many pixels in all

export const HELP = "https://duztman.github.io/dial-tool/help/";      // the help page (#536, #538; Okay, 24 Oct 2026, 21:52: "new help is in, link it there"): "Help" beside the version, in its type, underlined (Okay, 15 Oct 2026, 12:50); the guide is linked from the help page's top

// Where this page keeps things in the browser. The released page (duztman.github.io/dial-tool/) and the /dev/ page
// (#500) share one origin, so they would share one browser storage: the dev page's tries would land in the released
// page's last session, saved dials, palette and kept fonts. One prefix keeps them apart, read from the page's own
// address at run time, because the same committed build is copied to both places (tools/release.sh): /dial-tool/dev/
// keeps everything under "dial-tool-dev-", every other address (the released page, a file opened by hand, the tests)
// under "dial-tool-". Every key below goes through KEY(); the font files' database takes the same name (R34).
export const DEV = /\/dial-tool\/dev\//.test(location.pathname);

export const PLACE = DEV ? "dial-tool-dev" : "dial-tool";

export const KEY = (name) => `${PLACE}-${name}`;

export const LAST = KEY("last");                          // the last session, kept by the browser

export const FEATURE_NAMES = {
  kern: "kerning", liga: "ligatures", calt: "contextual alternates", dlig: "discretionary ligatures",
  tnum: "tabular figures", pnum: "proportional figures", onum: "oldstyle figures", lnum: "lining figures",
  zero: "slashed zero", frac: "fractions", sups: "superscript", subs: "subscript", sinf: "scientific inferiors",
  ordn: "ordinals", smcp: "small caps", c2sc: "caps to small caps", case: "case-sensitive forms",
  salt: "stylistic alternates", swsh: "swash", titl: "titling", ccmp: "glyph composition", locl: "localized forms",
  mark: "mark positioning", mkmk: "mark to mark", aalt: "access all alternates", cpsp: "capital spacing",
  hist: "historical forms", ornm: "ornaments", dnom: "denominators", numr: "numerators",
  afrc: "alternative fractions", rvrn: "variation alternates",
};

export const DEFAULT_ON = new Set(["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "rlig", "rclt", "curs", "clig", "rvrn"]);

// a phone (Okay, 15 Oct 2026, 06:20): the preview's switches unfold their words this long after a tap on the backdrop
export const HOLE_LIVE_MS = 1200;      // how long the centre hole's guide stays after its size last changed (#267); and the guides after a number was last slid (#249)

export const WORDS_MS = 3000;

// a phone's drawer: the preview's share of the screen at the two heights a tap on the gripper jumps between (the
// drawer about half, then about three quarters); the least the preview and the drawer keep (px); and how much room for
// scrolling the drawer must have left under its title, tabs and pinned panes before those stay put
export const SHEET = { shares: [0.42, 0.22], preview: 120, drawer: 160, room: 140 };

export const GIF_MOST = 600, GIF_FPS_MOST = 25;      // a GIF's largest side (px) and frame rate: past these the file grows past what a GIF is good for (#51)

// one key, one switch on the preview, as G is Guides (#472): H the hands · X X-ray (while a window has a disc) · S
// Shadows · E the dial alone. Not while typing, on a slider or a menu, with ⌘/Ctrl/⌥ held, or with a dialog open
export const KEYS = {
  h: (t) => t.set_value("global", "ha_on", !t.S.ha_on),
  x: (t) => { if ($("#xray")?.offsetParent) t.set_value("global", "xray", !t.S.xray); },      // only while its switch is on screen: show mode puts it away by the stylesheet, not by `hidden`
  s: (t) => t.set_value("global", "sh_on", !t.S.sh_on),
  e: (t) => { if (t.comparing) t.compare(false); else t.dial_alone(t.eye_button.getAttribute("aria-pressed") !== "true"); },
};

export const FINE_FREE = 12, FINE_HALF = 48, FINE_LEAST = 0.05;      // a slider held away from its track (#406): px of free room, then px per halving step, and the finest share of the track's speed

export const FINE = (off) => Math.max(1 / (1 + off / FINE_HALF), FINE_LEAST);

/** a value written once, in the stylesheet (R32): a number read from a token on :root — "1200ms" → 1200, "224px" → 224 */
export const token = (name, or = 0) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || or;
export const POP_LINGER_MS = () => token("--num-pop-linger", 1200), POP_FADE_MS = () => token("--num-pop-fade", 120);      // the number popup: after its last use it fades, quickish (Okay, 17 Oct 2026); read from the stylesheet, so it is written once

export const SNAP_DEG = 2;        // a text ring's angle snaps to an index this close (#297)

export const RING_ROWS = 5;       // the ring list shows this many rings (and the drawer) before it scrolls; its pill makes it taller or shorter (#256)

export const GUIDE_STEP = 0.75;      // the guides' Thickness: 1 · 2 · 3 are steps of this, today's thinnest (#527; Okay, 24 Oct 2026: "Steps of today's")

/** '1.2' absolute · '+0.5' add · 'x0.5' multiply · '/2' divide */
// a length typed in any unit (#187; atlas 5.7, Okay, 14 Oct 2026: "do this"): how many mm one of each is. Typed into a
// field only — the controller has no keys (Okay, 20 Oct 2026, 02:19: "Units cannot be typed on a controller")
export const TYPED_UNITS = { mm: 1, cm: 10, pt: 25.4 / 72, in: 25.4, "″": 25.4, '"': 25.4, lig: 2.2558, thou: 0.0254 };

/** what was typed in a number's field → the number, in the unit the field shows. "1.2" sets · "+0.5" adds · "x0.5"
 *  multiplies · "/2" divides. per (a length's field only): how many of the shown unit make a mm; then a unit may follow
 *  the number — "0.5in", "12 pt", "+1mm" — and is turned into the shown unit (storage stays mm, R1). */
export function parse_number(text, current, per = 0) {
  let s = String(text).trim().replace(",", ".").replace("×", "x"), factor = 1;
  const unit = per ? /\s*(mm|cm|pt|in|lig|thou|″|")$/i.exec(s) : null;
  if (unit && !/^[x*/]/.test(s)) { factor = TYPED_UNITS[unit[1].toLowerCase()] * per; s = s.slice(0, unit.index); }
  const v = parseFloat(s.slice(1)) * factor;
  let out = s[0] === "+" ? current + v : s[0] === "x" || s[0] === "*" ? current * v : s[0] === "/" ? current / v : parseFloat(s) * factor;
  return Number.isFinite(out) ? out : current;
}

/** is this row a length (kept in mm, shown in the chosen unit)? Decided by its key, where the scale tick decides it too. */
export const LENGTH_KEYS = { ring: G.RING_MM, hand: G.HAND_MM, window: G.WINDOW_MM, global: ["dial_d", "margin", "ha_cap", "dial_hole", "sh_hour", "sh_minute", "sh_second", "sh_cap", "sh_disc"], nudge: ["dr"] };

/** a row's label: its own words, or, with a menu beside it, the chosen item's word before the last of its own
 *  ("Centre radius" → "Baseline radius"). */
export const label_of = (row, T) => (row.say ? row.say(T)[0] : row.menu ? `${(row.menu.items.find(([v]) => v === (T[row.menu.key] ?? 0)) || row.menu.items[0])[1]} ${row.text.split(" ").pop()}` : row.text);

// two measures that may be linked, so changing one keeps their ratio (#358; Okay's notes 2: "a link/unlink like in
// illustrator … other width-height or linkable stuff get this too"): its switch key, the pair, and when it applies
export const LINKED_PAIRS = { window: [{ link: "wh_link", keys: ["w", "h"], when: (T) => ["rectangle", "arc", "pair"].includes(G.window_shape(T)) }] };      // a big date's pair too (4.79: its pill showed LINKED and held nothing)

export const is_day = (T) => Boolean(T && T.on && G.WINDOW_KINDS[T.kind] === "am · pm");      // an am · pm window: a disc half am, half pm (4.88)

export const moon_look = (T) => (T && T.on && G.WINDOW_KINDS[T.kind] === "moon phase" ? T.look || 0 : -1);      // a moon window's picture (4.73), -1 for any other window

export const KIND_TAB_KEYS = Object.keys(G.WINDOW_BASE).filter((k) => !["on", "kind", "at", "at_deg", "r", "guide", "wh_link"].includes(k));      // what each complication keeps of its own (#328)

export const HANDLE_AXIS = 4;      // a hand's width handle (#368, 4.80): how far it is dragged, in screen points, before it is known whether across or along

export const HANDLE_R = 5.5, HANDLE_OUT = 14, HANDLE_REACH = 14, HANDLE_SEAT = 10;      // HANDLE_SEAT: the radius of the disc a handle sits in (#486)      // a guide handle (4.65): its half-size, how far beyond the ring's outer edge the angle handles stand, the radius a press reaches it within — screen points at any zoom

export const TINY_EVERY = 200;                            // the Tiny Preview redrawn at most this often, in ms (#337)

export const NUDGE_NEUTRAL = { dr: 0, da: 0, rot: 0, s: 1, shape: 0 };      // a numeral's or a mark's nudge, untouched (#252; shape, a mark's own, 4.78)

export const is_length = (row) => row.kind === "num" && (LENGTH_KEYS[row.scope] || []).includes(row.key);

export const decimals = (step) => (String(step).split(".")[1] || "").length;

// a round step in another unit (#76; Okay, 21 Oct 2026: "This shouldn't be that hard"): a row's mm step, carried into the
// shown unit and taken to the nearest 1, 2 or 5 of a power of ten — 0.05 mm is 0.1 pt, 0.002 in, 0.02 lig, 2 thou
export const round_step = (v) => { const p = 10 ** Math.floor(Math.log10(v)), m = v / p; return +((m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p).toPrecision(1); };

export const fmt = (v, step) => (+v).toFixed(Math.max(decimals(step), 0));

export const fmt_time = (t) => {
  t = ((Math.floor(t) % 43200) + 43200) % 43200;
  return [Math.floor(t / 3600) || 12, Math.floor(t / 60) % 60, t % 60].map((v, i) => (i ? String(v).padStart(2, "0") : v)).join(":");
};

/** "3:20", "3:20:10" keep the half of the day that is showing (pm_now); "3:20 pm", "15:20" say which. → 0 to 86400 */
export function parse_time(text, pm_now = false) {
  const said = /([ap])\.?\s*m\.?\s*$/i.exec(String(text));
  if (said) text = String(text).slice(0, said.index);
  const p = String(text).split(/[:.\s]+/).map(Number);
  if (p.some((v) => !Number.isFinite(v))) return null;
  const pm = said ? said[1].toLowerCase() === "p" : p[0] >= 12 && p[0] < 24 ? true : p[0] === 24 || p[0] === 0 ? false : pm_now;
  return ((p[0] % 12) * 3600 + (p[1] || 0) * 60 + (p[2] || 0)) % 43200 + (pm ? 43200 : 0);
}

export const to_hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, "0")).join("");

export const has_focus = (e) => document.activeElement === e;

/** a colour as a stylesheet reads it, see-through part included. */
export const css_colour = (c) => `rgba(${c.slice(0, 3).map((v) => Math.round(clamp(v, 0, 1) * 255)).join(", ")}, ${c[3] ?? 1})`;

/** a swatch shows a colour: over a checkerboard, so a see-through one looks it (--c, read by the stylesheet). */
export const paint = (swatch, c) => swatch.style.setProperty("--c", css_colour(c));

/** drag inside a box: move(x, y) gets where the pointer is, 0 to 1 across and down. */
export function drag_in(box, move) {
  box.onpointerdown = (e) => {
    e.preventDefault();
    box.setPointerCapture(e.pointerId);
    const at = (ev) => { const r = box.getBoundingClientRect(); move(clamp((ev.clientX - r.left) / r.width, 0, 1), clamp((ev.clientY - r.top) / r.height, 0, 1)); };
    box.onpointermove = at;
    box.onpointerup = box.onpointercancel = () => { box.onpointermove = null; };
    at(e);
  };
}

export const nato_stripe = (S, i) => (S.c_nato ? S.c_nato[i] : from_hex(SHOW.nato_colours(S)[i]));      // a NATO stripe's colour as drawn (#524)

export const from_hex = (h, alpha = 1) => [1, 3, 5].map((i) => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)).concat([alpha]);

export function save_file(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = el("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export const is_light = (plate) => 0.2126 * plate[0] + 0.7152 * plate[1] + 0.0722 * plate[2] > 0.5;      // a saved dial's card: a light plate gets the dark tint
