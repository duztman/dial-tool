// links.mjs — settings files → dial links (the same packing as the page's Copy link).
//   node web/links.mjs docs/guide/presets/field.json [more.json …]
import fs from "fs";
import zlib from "zlib";
import { fresh_settings, lean, LINK_SCHEME } from "./src/geometry.js";

export const SITE = "https://duztman.github.io/dial-tool/";
// "~" for "+", as the page writes them (app.js, 15 Oct 2026): no dash for a line to break after
export function link(settings) {
  const packed = zlib.deflateRawSync(Buffer.from(JSON.stringify(lean(fresh_settings(settings)))), { level: 9 });
  return `#${LINK_SCHEME}.` + packed.toString("base64").replace(/\+/g, "~").replace(/\//g, "_").replace(/=+$/, "");
}
if (process.argv[1].endsWith("links.mjs")) {
  for (const file of process.argv.slice(2)) console.log(file.split("/").pop().replace(".json", "").padEnd(14), SITE + link(JSON.parse(fs.readFileSync(file, "utf8"))));
}
