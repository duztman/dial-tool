// examples.mjs — the five example dials under Export: writes src/examples.js.
//
// They are five of the guidebook's classics (web/presets/), with the Mac system fonts
// swapped for open ones from the web version's own list (the guide's own stand-ins), so a link
// to one looks the same for everybody. Each gets a small picture, drawn here once. Where Okay has sent his own version
// of one (OKAY below), that is used instead of the preset.
//
//   cd web && node fonts.mjs && node examples.mjs

import fs from "fs";
import path from "path";
import { engines } from "./test/engines.mjs";
import { link } from "./links.mjs";
import { FONT_LIST } from "./src/font_list.js";

const here = path.dirname(new URL(import.meta.url).pathname);
const PICK = [["field", "Field"], ["diver", "Diver"], ["bauhaus", "Bauhaus"], ["sector", "Sector"], ["gauge", "Gauge"]];
const OPEN = {                                                     // Mac font → open font, as tools/guide_dials.py's STAND_INS
  "DINAlternate-Bold": ["Barlow", "Barlow-SemiBold", {}],
  "Futura-Medium": ["Jost", "Jost-Regular", { wght: 500 }],
  "HelveticaNeue": ["Arimo", "Arimo-Regular", {}],
  "HelveticaNeue-Medium": ["Arimo", "Arimo-Regular", { wght: 500 }],
  "HelveticaNeue-Bold": ["Arimo", "Arimo-Regular", { wght: 700 }],
  "BodoniSvtyTwoITCTT-Book": ["Bodoni Moda", "BodoniModa-Regular", { wght: 700, opsz: 6 }],
};

// Okay's own versions, in place of a preset (lean settings, as his links carry them; the guide's presets stay as they are)
const OKAY = {
  // the sector dial (15 Oct 2026, 12:47, his link): a thin band added round the inner pies, at 6.45
  sector: {
    "guides": false, "c_plate": [0.94, 0.92, 0.87, 1], "c_cap": [0.13, 0.22, 0.36, 1],
    "rings": [
      { "kind": 2, "name": "Hours", "r": 8.6, "every": 3, "size": 2, "family": "Jost", "ps": "Jost-Regular", "axes": { "wght": 500 } },
      { "kind": 1, "name": "Hour bars", "r": 11.9, "every": 3, "invert": true, "len": 1.4, "w": 0.45 },
      { "name": "Minutes", "c": [1, 1, 1, 1], "r": 14.4, "count": 60, "len": 0.7, "w": 0.1 },
      { "kind": 2, "name": "Minute numerals", "c": [1, 1, 1, 1], "r": 12.9, "start": 30, "labels": 7, "num_from": 5, "num_digits": 2, "mode": 2, "size": 0.9, "family": "Jost", "ps": "Jost-Regular", "axes": { "wght": 500 } },
      { "kind": 3, "name": "Chapter", "c": [0.13, 0.22, 0.36, 1], "r": 14.7, "width": 2.6 },
      { "name": "Crosshair", "r": 12, "count": 4, "len": 12, "w": 0.1 },
      { "kind": 3, "name": "Band", "c": [0.8588, 0.8196, 0.7216, 1], "r": 6.45, "count": 1, "width": 0.2, "guide": 0 },
      { "kind": 3, "name": "Sectors", "c": [0.86, 0.82, 0.72, 1], "r": 6, "every": 2, "width": 6 },
    ],
    "ha_hour": { "shape": 3, "len": 7.5, "w": 1.3, "feature_at": 22, "c": [0.13, 0.22, 0.36, 1] },
    "ha_minute": { "shape": 3, "len": 12.6, "w": 1.1, "tail": 1.4, "feature_at": 18, "c": [0.13, 0.22, 0.36, 1] },
    "ha_second": { "shape": 8, "len": 13.4, "w": 0.12, "tail": 3, "feature": 0.9, "feature_at": 80, "c": [0.82, 0.12, 0.1, 1] } },
};

/** the five dials' settings, their Mac fonts swapped for open ones (also for test/links.mjs) */
export function example_dials() {
  return PICK.map(([file, name]) => {
    const settings = OKAY[file] ? structuredClone(OKAY[file]) : JSON.parse(fs.readFileSync(path.join(here, "../web/presets", file + ".json"), "utf8"));
    for (const ring of settings.rings || []) if (ring.ps in OPEN) [ring.family, ring.ps, ring.axes] = OPEN[ring.ps];
    if (file === "field") for (const ring of settings.rings) if (ring.name === "24 hours") { ring.ps = "Barlow-Bold"; ring.tracking = 40; }      // small figures a weight up and tracked (#288, 4.49: "the field watch we have for example it fails"); the preset stays as it is (R30)
    if (file === "gauge") settings.ha_cap_top = true;      // no seconds hand: its cap stays, on the minute hand (#262, beta 4.43; the preset is dial.py's, R30)
    return { file, name, settings };
  });
}

// run as `node examples.mjs`: write src/examples.js
if (process.argv[1]?.endsWith("examples.mjs")) {
  const G = await engines();
  for (const f of FONT_LIST) G.add_font(fs.readFileSync(path.join(here, "fonts", f.file)));
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  const out = [];
  for (const { file, name, settings } of example_dials()) {
    for (const ring of settings.rings || []) if (ring.ps && !G.has_font(ring.ps)) throw new Error(`${file}: no open font for ${ring.ps}`);
    const S = G.fresh_settings({ ...settings, guides: true });
    const statik = G.build_static(S), size = G.page_mm(S), R = S.dial_d / 2 + 0.6;
    const shapes = G.scene(S, statik, S.t, false).map((i) => `<path d="${(i.role === "hand" ? G.turned(i.path, i.angle) : i.path).svg(2, true)}" fill="${hex(i.fill)}"/>`).join("");
    const plate = S.c_plate, light = 0.2126 * plate[0] + 0.7152 * plate[1] + 0.0722 * plate[2] > 0.5;      // a white dial (#286)
    out.push({ name, light, link: link(S), picture: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-R} ${-R} ${2 * R} ${2 * R}">${shapes}</svg>` });
    while (G.NOTES.length) console.log("note:", G.NOTES.shift());
  }
  const text = `// Written by web/examples.mjs — do not edit. Five of the guidebook's classic dials, as links, each with a small picture.
export const EXAMPLES = ${JSON.stringify(out)};
`;
  fs.writeFileSync(path.join(here, "src/examples.js"), text);
  console.log(out.map((e) => `${e.name}: link ${e.link.length} · picture ${(e.picture.length / 1e3).toFixed(0)} kB`).join("\n"));
}
