// cases.mjs — every case and strap of the preview kept as an SVG file (Okay, 19 Oct 2026: "Can i get the svgs of the
// straps and cases on my harddisk like the icons?"). One file per case kind × strap kind, drawn by bezels.js exactly
// as the preview draws them, round a dial of 36 mm (the First dial's size): cases/svg/<case>.svg (no strap),
// <case>-strap.svg, <case>-bracelet.svg. Millimetres, the dial's centre at the origin; the dial itself is not drawn,
// a hairline circle marks it. The folder is committed, as icons/svg is: an archive at each version.
//
//   cd web && node cases.mjs            (then copy cases/svg/ wherever it is wanted)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BEZELS, STRAPS, bezel_parts, bezel_svg } from "./src/bezels.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "cases/svg");
const DIAL = 36;                                   // mm, the First dial

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const written = [];
for (let b = 1; b < BEZELS.length; b++) for (let s = 0; s < STRAPS.length; s++) {
  // the drawing's extent: every coordinate in its paths (the strap reaches past the case's own reach), plus 2 mm
  const { parts, reach } = bezel_parts(b, DIAL, s);
  const nums = parts.flatMap((p) => (p.d.match(/-?\d*\.?\d+/g) || []).map(Number));
  const rx = Math.ceil(reach) + 2, ry = Math.ceil(Math.max(...nums.map(Math.abs))) + 2;      // across: the case (lugs, crown); down: the strap
  const box = `${-rx} ${-ry} ${2 * rx} ${2 * ry}`, size = `width="${2 * rx}mm" height="${2 * ry}mm"`;
  // bezels.js draws y up (R2); an SVG's y goes down, so the drawing is flipped once, as app.js does on the preview.
  // The dial's disc is filled in the tool's paper, as the dial covers it on the preview
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" ${size}>\n`
    + `<g transform="scale(1 -1)">${bezel_svg(b, DIAL, s)}<circle r="${DIAL / 2}" fill="#FCFCFA"/></g>\n</svg>\n`;
  const name = BEZELS[b].toLowerCase() + (s ? "-" + STRAPS[s].toLowerCase() : "") + ".svg";
  fs.writeFileSync(path.join(OUT, name), svg);
  written.push(name);
}
console.log(written.length + " files in cases/svg/: " + written.join(" · "));
