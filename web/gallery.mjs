// gallery.mjs — the Gallery under Export: writes src/gallery.js.
//
// Dials drawn after documents in the research atlas (13 Oct 2026); the number in brackets is the atlas entry.
// Each is plain settings, written here by hand: rings top first, as in the ring list. Fonts are from the web
// version's own list, so a link looks the same for everybody. Okay, 13 Oct 2026: "have a follow up section under
// all in export for the gallery, we can add 10-15 there." To add one: add an entry to DIALS, then
//
//   cd web && node gallery.mjs && node build.mjs

import fs from "fs";
import path from "path";
import { engines } from "./test/engines.mjs";
import { link } from "./links.mjs";
import { FONT_LIST } from "./src/font_list.js";
import { OKAYS_WATCH } from "./src/opener.js";

const here = path.dirname(new URL(import.meta.url).pathname);
const BLACK = [0.07, 0.07, 0.08, 1], WHITE = [0.95, 0.95, 0.92, 1], LUME = [0.80, 0.90, 0.66, 1], RED = [0.78, 0.16, 0.12, 1], PAPER = [0.97, 0.96, 0.93, 1], INK = [0.08, 0.08, 0.08, 1];
const NUMBERS = 7, CUSTOM = 6, RADIAL = 1, FLIP = 2, ON_PATH = 3;      // places in LABEL_SETS and MODES
const type = (family, ps, axes = {}) => ({ family, ps, axes });
const hands = (c, hour, minute, second, cap = 1.4, cap_c = c) => ({ ha_hour: { c, ...hour }, ha_minute: { c, ...minute }, ha_second: { c, ...second }, ha_cap: cap, c_cap: cap_c });

const DIALS = [
  // the dial the tool opens with, Okay's own watch (Okay, 15 Oct 2026, 07:45: "add this 'default' face to gallery as
  // well"; 07:48: "the purple you've been working with"): first, its settings as they are in src/opener.js
  { name: "Okay's watch", note: "Okay's own watch, purple, a 24-hour ring inside the twelve (15 Oct 2026; the dial the tool opened with until 16 Oct)", settings: OKAYS_WATCH },
  // Okay's own B-Uhr (15 Oct 2026, 09:39, his link: "This is replacing nr 2 on the gallery. No new name"; again 11:49,
  // a second link: a navy plate on a dark red backdrop, the triangle and dots cyan, the minute numerals cream): orange
  // hours and seconds hand, the minute numerals moved in, two thin bands framing them. Lean settings, as his link
  // carries them (only what differs from the starting values), without the time.
  { name: "B-Uhr, type B", note: "Navigator's watch, 1941: minutes outside and large, hours inside and small [1.9]", settings: {
    "dial_d": 34, "guides": false, "c_plate": [0.0549, 0.1647, 0.2784, 1], "c_backdrop": [0.4784, 0.1216, 0.1216, 1], "gd_axes": false,
    "rings": [
      { "kind": 1, "name": "Triangle at 12", "c": [0, 1, 0.8941, 1], "r": 15.6, "count": 1, "shape": 1, "len": 4.85, "w": 2.16, "taper": 0, "round_out": 0.35, "round_in": 0.24 },
      { "kind": 1, "name": "Two dots", "c": [0, 1, 0.8929, 1], "r": 16.1, "count": 2, "start": -7, "span": 14, "knock": 3, "shape": 2, "w": 1.01 },
      { "kind": 3, "name": "Hour circle", "c": [0.95, 0.95, 0.92, 1], "r": 9.1, "width": 0.16 },
      { "name": "Minutes", "c": [0.95, 0.95, 0.92, 1], "r": 16.4, "count": 60, "skip": 3, "knock": 3, "len": 1.2, "w": 0.2 },
      { "kind": 2, "name": "Hours", "c": [0.9098, 0.4549, 0.1647, 1], "r": 7.4, "size": 2.15, "family": "Routed Gothic", "ps": "RoutedGothic" },
      { "kind": 2, "name": "Minutes 5–55", "c": [0.902, 0.8863, 0.6275, 1], "r": 11.85, "count": 11, "start": 30, "span": 300, "labels": 7, "num_from": 5, "size": 3, "nudge": { "1": { "dr": -0.3 }, "3": { "dr": -0.35 }, "7": { "dr": -0.35 }, "8": { "dr": -0.35 }, "9": { "dr": -0.5 } }, "family": "Routed Gothic", "ps": "RoutedGothic" },
      { "name": "Five minutes", "c": [0.95, 0.95, 0.92, 1], "r": 16.4, "skip": 1, "len": 2.7, "w": 0.35, "twelve": 3 },
      { "kind": 3, "name": "Band copy", "c": [0.949, 0.949, 0.9216, 1], "r": 14.85, "count": 1, "width": 0.17, "guide": 0 },
      { "kind": 3, "name": "Band", "c": [0.949, 0.949, 0.9216, 1], "r": 16.4, "count": 1, "width": 0.17, "guide": 0 },
    ],
    "ha_beat": 1, "ha_cap": 1.4, "c_cap": [0.9098, 0.4549, 0.1647, 1],
    "ha_hour": { "shape": 2, "len": 8.2, "w": 2, "tail": 1.6, "tip": 2.6, "c": [0.902, 0.8863, 0.6275, 1] },
    "ha_minute": { "shape": 2, "len": 14.6, "w": 1.5, "tail": 1.8, "tip": 3.2, "c": [0.902, 0.8866, 0.6275, 1] },
    "ha_second": { "len": 15.4, "w": 0.2, "tail": 4, "counter": 1.1, "c": [0.9098, 0.4549, 0.1647, 1] } } },
  // Okay's own diver (15 Oct 2026, 11:03, his link: "4th option, replaces og"; 11:05: fourth card, the atlas diver gone):
  // the atlas diver on a blue plate, and under the dial's rings a band of twelve sectors, every other one the plate's
  // blue — a sunburst of stripes. Lean settings, as his link carries them. Fourth with Bauhaus third (row_gallery).
  { name: "Diver, bezel as rings", note: "A bezel drawn with rings on a larger plate, after ISO 6425: a scale to 60, minutes in the first 15 [1.13]", settings: {
    "dial_d": 40, "guides": false, "c_plate": [0.0965, 0.1086, 0.4455, 1],
    "rings": [
      { "kind": 1, "name": "Bezel: triangle", "c": [0.8, 0.9, 0.66, 1], "r": 19.6, "count": 1, "shape": 1, "len": 2.6, "w": 3, "taper": 0 },
      { "kind": 2, "name": "Bezel: 10–50", "c": [0.95, 0.95, 0.92, 1], "r": 18.25, "count": 5, "start": 60, "span": 240, "labels": 7, "num_from": 10, "num_step": 10, "mode": 1, "size": 1.9, "family": "Barlow", "ps": "Barlow-SemiBold" },
      { "name": "Bezel: five minutes", "c": [0.95, 0.95, 0.92, 1], "r": 19.5, "skip": 2, "len": 2.4, "w": 0.6 },
      { "name": "Bezel: first 15", "c": [0.95, 0.95, 0.92, 1], "r": 19.5, "count": 16, "span": 90, "skip": 3, "len": 1.3, "w": 0.22 },
      { "kind": 3, "name": "Bezel", "c": [0.07, 0.07, 0.08, 1], "r": 20, "width": 3.6 },
      { "kind": 3, "name": "Bezel edge", "c": [0.62, 0.64, 0.66, 1], "r": 16.4, "width": 0.25 },
      { "kind": 1, "name": "Triangle at 12", "c": [0.8, 0.9, 0.66, 1], "r": 15.4, "count": 1, "shape": 1, "w": 2.8, "taper": 0 },
      { "kind": 1, "name": "Bars 3 · 6 · 9", "c": [0.8, 0.9, 0.66, 1], "r": 15.4, "count": 4, "w": 1.3, "twelve": 3 },
      { "kind": 1, "name": "Dots", "c": [0.8, 0.9, 0.66, 1], "r": 15.2, "every": 3, "invert": true, "shape": 2, "w": 1.9 },
      { "name": "Minutes", "c": [0.95, 0.95, 0.92, 1], "r": 15.9, "count": 60, "skip": 1, "len": 0.8, "w": 0.16 },
      { "kind": 3, "name": "Band", "c": [0.0549, 0.1647, 0.2784, 1], "r": 15.9, "width": 15.75, "guide": 3,
        "cs": { "1": [0.098, 0.1098, 0.4471, 1], "3": [0.098, 0.1098, 0.4471, 1], "5": [0.098, 0.1098, 0.4471, 1], "7": [0.098, 0.1098, 0.4471, 1], "9": [0.098, 0.1098, 0.4471, 1], "11": [0.098, 0.1098, 0.4471, 1] } },
    ],
    "ha_cap": 1.5, "c_cap": [0.95, 0.95, 0.92, 1],
    "ha_hour": { "shape": 5, "len": 7.6, "w": 1.4, "tail": 1.5, "tip": 3.2, "feature": 3.4, "c": [0.95, 0.95, 0.92, 1] },
    "ha_minute": { "shape": 2, "len": 12.6, "w": 1.6, "tail": 1.8, "tip": 2.6, "c": [0.95, 0.95, 0.92, 1] },
    "ha_second": { "shape": 8, "len": 13.4, "w": 0.18, "tail": 3.4, "feature": 1.3, "feature_at": 68, "c": [0.95, 0.95, 0.92, 1] } } },
  { name: "Montgomery", note: "Railroad safety dial, 1920: every minute numbered, every fifth larger and red [1.7]", settings: {
    dial_d: 38, c_plate: PAPER,
    ...hands(INK, { shape: "breguet", len: 9.6, w: 0.55, tail: 1.6, tip: 2.2, feature: 2.4, feature_at: 72 }, { shape: "breguet", len: 14.2, w: 0.45, tail: 1.8, tip: 2.6, feature: 2.2, feature_at: 76 }, { shape: "baton", len: 15, w: 0.14, tail: 3.6 }, 1.2),
    rings: [
      { kind: "numerals", name: "Every fifth minute", r: 17.5, count: 12, start: 30, labels: NUMBERS, num_from: 5, num_step: 5, size: 1.5, c: RED, ...type("Barlow", "Barlow-Bold") },
      { kind: "numerals", name: "Every minute", r: 17.5, count: 60, start: 6, labels: NUMBERS, num_from: 1, num_step: 1, size: 0.82, c: INK, skip: 2, ...type("Barlow", "Barlow-Medium") },
      { kind: "band", name: "Outer rail", r: 16.5, width: 0.1, c: INK },
      { kind: "ticks", name: "Five minutes", r: 16.5, count: 12, len: 1.1, w: 0.42, c: INK },
      { kind: "ticks", name: "Minutes", r: 16.5, count: 60, len: 1.1, w: 0.14, c: INK, skip: 3 },
      { kind: "band", name: "Inner rail", r: 15.5, width: 0.1, c: INK },
      { kind: "numerals", name: "Hours", r: 11.8, count: 12, size: 4.4, c: INK, ...type("Playfair Display", "PlayfairDisplay-Regular", { wght: 700 }) },
    ] } },
  // Okay's own 12 + 24 (15 Oct 2026, 11:29, his link: "This one replaces 12 24 hrs"): a dark grey plate on a green
  // backdrop, the numerals in Rubik (added to the font list for it), the 24-hour figures tracked and tabular, on the
  // plate's starting size. Lean settings, as his link carries them.
  { name: "12 + 24 hours", note: "US general-purpose watch, MIL-PRF-46374: 13–24 inside 1–12, smaller [1.10]", settings: {
    "guides": false, "gd_axes": false, "c_plate": [0.2308, 0.2308, 0.2498, 1], "c_backdrop": [0.2933, 0.6167, 0.2991, 1],
    "rings": [
      { "kind": 1, "name": "Triangle at 12", "c": [0.8, 0.9, 0.66, 1], "r": 14.6, "count": 1, "shape": 1, "len": 1.9, "w": 1.9, "taper": 0 },
      { "kind": 2, "name": "Hours 1–12", "c": [0.95, 0.95, 0.92, 1], "r": 10.6, "size": 3.1, "family": "Rubik", "ps": "Rubik-Light", "axes": { "wght": 400 } },
      { "kind": 2, "name": "Hours 13–24", "c": [0.95, 0.95, 0.92, 1], "r": 7.5, "start": 30, "labels": 7, "num_from": 13, "num_step": 1, "size": 1.45, "family": "Rubik", "ps": "Rubik-Light", "tracking": 150, "axes": { "wght": 400 }, "features": { "tnum": true } },
      { "name": "Hour marks", "c": [0.95, 0.95, 0.92, 1], "r": 14.6, "skip": 1, "len": 1.7, "w": 0.55 },
      { "name": "Minutes", "c": [0.95, 0.95, 0.92, 1], "r": 14.6, "count": 60, "skip": 3, "len": 0.9, "w": 0.18 },
    ],
    "ha_cap": 1.3, "c_cap": [0.95, 0.95, 0.92, 1],
    "ha_hour": { "shape": 1, "len": 7.2, "w": 1.5, "tail": 1.4, "tip": 1.6, "c": [0.95, 0.95, 0.92, 1] },
    "ha_minute": { "shape": 1, "len": 12.2, "w": 1.1, "tail": 1.6, "tip": 1.8, "c": [0.95, 0.95, 0.92, 1] },
    "ha_second": { "len": 13.2, "w": 0.2, "tail": 3.4, "c": [0.95, 0.95, 0.92, 1] } } },
  { name: "World time", note: "After Cottier, 1948: an hour dial, a 24-hour ring split day and night, a ring of cities typed by hand [1.15]", settings: {
    "dial_d": 38, "guides": false, "c_plate": [0.93, 0.92, 0.88, 1], "c_backdrop": [0.5625, 0.5361, 0.5778, 1],
    "rings": [
      { "kind": 2, "name": "Cities", "r": 16.9, "count": 24, "labels": 6, "custom": "LONDON, PARIS, CAIRO, ISTANBUL, DUBAI, KARACHI, DHAKA, BANGKOK, HONG KONG, TOKYO, SYDNEY, NOUMEA, AUCKLAND, MIDWAY, HONOLULU, ALASKA, L. ANGELES, DENVER, CHICAGO, NEW YORK, CARACAS, RIO, S. GEORGIA, AZORES", "mode": 3, "size": 0.9, "family": "Barlow Condensed", "ps": "BarlowCondensed-Medium", "tracking": 50 },
      { "name": "City marks", "r": 18.6, "count": 24, "start": 7.5, "len": 0.7, "w": 0.12 },
      { "kind": 3, "name": "Cities, inner line", "r": 15.2, "width": 0.1 },
      { "kind": 2, "name": "Night hours 18–24", "c": [0.95, 0.95, 0.92, 1], "r": 13.55, "count": 7, "start": 270, "span": 90, "labels": 7, "num_from": 18, "num_step": 1, "mode": 2, "size": 1.5, "family": "Barlow", "ps": "Barlow-SemiBold" },
      { "kind": 2, "name": "Night hours 1–5", "c": [0.95, 0.95, 0.92, 1], "r": 13.55, "count": 5, "start": 15, "span": 60, "labels": 7, "num_from": 1, "num_step": 1, "mode": 2, "size": 1.5, "family": "Barlow", "ps": "Barlow-SemiBold" },
      { "kind": 2, "name": "Day hours 6–17", "r": 13.55, "start": 90, "span": 165, "labels": 7, "num_from": 6, "num_step": 1, "mode": 2, "size": 1.5, "family": "Barlow", "ps": "Barlow-SemiBold" },
      { "kind": 3, "name": "Day and night", "c": [0.83, 0.8, 0.7, 1], "r": 14.7, "count": 2, "start": 82.5, "width": 2.3, "cs": { "1": [0.12, 0.15, 0.24, 1] } },
      { "kind": 1, "name": "Hours", "r": 11.6, "len": 1.5, "w": 0.45, "twelve": 1, "twelve_gap": 0.35 },
      { "name": "Minutes", "r": 11.6, "count": 60, "skip": 1, "len": 0.5, "w": 0.1 },
    ],
    "ha_cap": 1, "c_cap": [0.08, 0.08, 0.08, 1],
    "ha_hour": { "shape": 5, "len": 10.15, "w": 1.6, "tail": 1.6, "tip": 2.75, "feature": 1.6, "round": 0.05, "c": [0.4784, 0.1216, 0.1216, 1] },
    "ha_minute": { "shape": 5, "len": 12.7, "w": 1.3, "tail": 1.7, "feature": 1.3, "c": [0.4784, 0.1216, 0.1216, 1], "disc_d": 30, "mark_len": 2.3, "mark_w": 1.88 },
    "ha_second": { "on": false, "len": 9, "w": 0.12, "tail": 2, "c": [0.08, 0.08, 0.08, 1] } } },
  { name: "Elapsed time", note: "MIL-PRF-46374, Type III: twelve hour marks, a dot for 12, minute marks only from 12 to 4 [3.4]", settings: {
    dial_d: 30, c_plate: BLACK,
    ...hands(WHITE, { shape: "baton", len: 7.4, w: 1.3, tail: 1.4, round: 0.65 }, { shape: "baton", len: 12.4, w: 1.0, tail: 1.6, round: 0.5 }, { shape: "lollipop", len: 13.2, w: 0.18, tail: 3.2, feature: 1.1, feature_at: 72 }, 1.3),
    rings: [
      { kind: "markers", name: "Dot at 12", r: 11.6, count: 1, shape: "dot", w: 1.5, c: LUME },
      { kind: "markers", name: "Hour marks", r: 14.5, count: 12, len: 2.2, w: 0.75, c: WHITE },
      { kind: "ticks", name: "Minutes, 12 to 4", r: 14.5, count: 21, start: 0, span: 120, len: 1.1, w: 0.2, c: WHITE, skip: 1 },
    ] } },
  // Okay's own world time (15 Oct 2026, 12:08, his link: "This is"): after Cottier, 1948 — the hour hand and the minute
  // hand dark red, the seconds hand off, larger day and night figures upright, on a greyed lilac backdrop. Lean settings,
  // as his link carries them.
];

const G = await engines();
for (const f of FONT_LIST) G.add_font(fs.readFileSync(path.join(here, "fonts", f.file)));
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
const out = [];
for (const { name, note, settings } of DIALS) {
  for (const ring of settings.rings) if (ring.ps && !G.has_font(ring.ps)) throw new Error(`${name}: no font ${ring.ps}`);
  const S = G.fresh_settings({ ...settings, guides: true });
  const statik = G.build_static(S), R = S.dial_d / 2 + 0.6;
  const shapes = G.scene(S, statik, S.t, false).map((i) => `<path d="${(i.role === "hand" ? G.turned(i.path, i.angle) : i.path).svg(2, true)}" fill="${hex(i.fill)}"${i.fill[3] < 1 ? ` fill-opacity="${i.fill[3]}"` : ""}/>`).join("");
  out.push({ name, note, link: link(S), picture: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-R} ${-R} ${2 * R} ${2 * R}">${shapes}</svg>` });
  while (G.NOTES.length) console.log("note:", G.NOTES.shift());
}
fs.writeFileSync(path.join(here, "src/gallery.js"), `// Written by web/gallery.mjs — do not edit. The Gallery's dials, as links, each with a small picture.
export const GALLERY = ${JSON.stringify(out)};
`);
if (process.argv[2]) for (const e of out) fs.writeFileSync(path.join(process.argv[2], e.name.replace(/[^A-Za-z0-9]+/g, "-") + ".svg"), e.picture);      // node gallery.mjs <folder>: the pictures as files, to look at
console.log(out.map((e) => `${e.name}: link ${e.link.length} · picture ${(e.picture.length / 1e3).toFixed(0)} kB`).join("\n"));
