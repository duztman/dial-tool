// icons/archive.mjs — every icon of the tool kept as an SVG file (build list #336; Okay, 18 Oct 2026, notes 2: "would be
// nice to have all the icons archived somewhere as svg"). Reads icons/out/inventory.json, which the icon check
// (icons/check.mjs, run by npm test) writes from the running window, and writes one file per drawing into icons/svg/:
// its name, then "-on" when it was seen in its switched-on state. The same drawing seen twice is written once. Each
// file is the icon as the page draws it — its own size, its four line widths, currentColor — with a black stroke
// written in, so it opens as a picture in Illustrator or a browser. The folder is committed: an archive of the icons at
// each version, in the repo's history.
//
//   cd web && node build.mjs && node icons/check.mjs && node icons/archive.mjs
import fs from "fs";

const OUT = "icons/svg";
const inventory = JSON.parse(fs.readFileSync("icons/out/inventory.json", "utf8"));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const seen = new Map();                            // drawing → file name: one file per drawing
const used = new Set();
for (const ic of inventory) {
  const svg = ic.inline
    .replace(/<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(/ aria-hidden="true"/, "")
    .replace(/ style="[^"]*"/g, "")                // the page's own colours (a grey, a chosen state): the archive keeps lines in black
    .replace(/currentColor/g, "#000");
  if (seen.has(svg)) continue;
  let name = (ic.name + (ic.on ? "-on" : "")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "icon";
  for (let k = 2; used.has(name); k++) name = name.replace(/-\d+$/, "") + "-" + k;
  used.add(name);
  seen.set(svg, name);
  fs.writeFileSync(`${OUT}/${name}.svg`, `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`);
}
console.log(`${seen.size} icons written to ${OUT}/ (of ${inventory.length} seen)`);
