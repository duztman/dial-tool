// links.mjs — settings files → dial links (the same packing as the page's Copy link).
//   node web/links.mjs web/presets/field.json [more.json …]
import fs from "fs";
import zlib from "zlib";
import { fresh_settings, link_text, base32, LINK_SCHEME } from "./src/geometry.js";

export const SITE = "https://duztman.github.io/dial-tool/";
// scheme 2, as the page writes them (app.js pack, beta 4.43): the link's text, deflated, in Crockford's base 32
export function link(settings) {
  return `#${LINK_SCHEME}` + base32(zlib.deflateRawSync(Buffer.from(link_text(fresh_settings(settings))), { level: 9 }));
}
/** a dial's card in the Gallery or under Export: its link, a small SVG picture (see-through fills kept) and whether its
 *  plate reads light (#286). G is the engines, loaded by the caller with its fonts; `settings` must name open fonts. */
export function card(G, settings) {
  const S = G.fresh_settings(settings);      // as the dial says: a card's link carries nothing the dial doesn't (found 25 Oct 2026: every card switched the guides on, against "Defaults are all off", #485)
  const statik = G.build_static(S), R = S.dial_d / 2 + 0.6;
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  const shapes = G.scene(S, statik, S.t, false).map((i) => `<path d="${(i.role === "hand" || i.role === "mark" ? G.turned(i.path, i.angle) : i.path).svg(2, true)}" fill="${hex(i.fill)}"${i.fill[3] < 1 ? ` fill-opacity="${i.fill[3]}"` : ""}/>`).join("");
  const plate = S.c_plate, light = 0.2126 * plate[0] + 0.7152 * plate[1] + 0.0722 * plate[2] > 0.5;
  return { light, link: link(S), picture: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-R} ${-R} ${2 * R} ${2 * R}">${shapes}</svg>` };
}
if (process.argv[1].endsWith("links.mjs")) {
  for (const file of process.argv.slice(2)) console.log(file.split("/").pop().replace(".json", "").padEnd(14), SITE + link(JSON.parse(fs.readFileSync(file, "utf8"))));
}
