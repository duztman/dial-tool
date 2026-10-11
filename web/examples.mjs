// examples.mjs — the five example dials under Export: writes src/examples.js.
//
// They are five of the guidebook's classics (docs/guide/presets/), with the Mac system fonts
// swapped for open ones from the web version's own list (the guide's own stand-ins), so a link
// to one looks the same for everybody. Each gets a small picture, drawn here once.
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

const G = await engines();
for (const f of FONT_LIST) G.add_font(fs.readFileSync(path.join(here, "fonts", f.file)));
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
const out = [];
for (const [file, name] of PICK) {
  const settings = JSON.parse(fs.readFileSync(path.join(here, "../docs/guide/presets", file + ".json"), "utf8"));
  for (const ring of settings.rings || []) {
    if (!(ring.ps in OPEN)) { if (ring.ps && !G.has_font(ring.ps)) throw new Error(`${file}: no open font for ${ring.ps}`); continue; }
    [ring.family, ring.ps, ring.axes] = OPEN[ring.ps];
  }
  const S = G.fresh_settings({ ...settings, guides: true });
  const statik = G.build_static(S), size = G.page_mm(S), R = S.dial_d / 2 + 0.6;
  const shapes = G.scene(S, statik, S.t, false).map((i) => `<path d="${(i.role === "hand" ? G.turned(i.path, i.angle) : i.path).svg(2, true)}" fill="${hex(i.fill)}"/>`).join("");
  out.push({ name, link: link(S), picture: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-R} ${-R} ${2 * R} ${2 * R}">${shapes}</svg>` });
  while (G.NOTES.length) console.log("note:", G.NOTES.shift());
}
const text = `// Written by web/examples.mjs — do not edit. Five of the guidebook's classic dials, as links, each with a small picture.
export const EXAMPLES = ${JSON.stringify(out)};
`;
fs.writeFileSync(path.join(here, "src/examples.js"), text);
console.log(out.map((e) => `${e.name}: link ${e.link.length} · picture ${(e.picture.length / 1e3).toFixed(0)} kB`).join("\n"));
