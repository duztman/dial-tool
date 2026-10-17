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
if (process.argv[1].endsWith("links.mjs")) {
  for (const file of process.argv.slice(2)) console.log(file.split("/").pop().replace(".json", "").padEnd(14), SITE + link(JSON.parse(fs.readFileSync(file, "utf8"))));
}
