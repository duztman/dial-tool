// fonts.mjs — the web version's own font list: fetches the files once, and writes src/font_list.js.
//
// Twenty open-licence families that suit dial numerals. The files live in web/fonts/ (and are
// published with the page), so choosing one never depends on another site staying as it is.
// For each file this reads its names and axes with HarfBuzz and draws "1234567890" once, as a
// small outline — the picker shows that, so no font has to be downloaded just to be looked at.
//
//   cd web && node fonts.mjs          (downloads only what is missing)
//
// To add a family: add a line to FAMILIES, run this, run build.mjs. Keep the list at 20 (Okay, 11 Oct 2026).

import fs from "fs";
import path from "path";
import * as HB from "harfbuzzjs";

const here = path.dirname(new URL(import.meta.url).pathname);
const DIR = path.join(here, "fonts");
const SOURCES = {
  google: (dir, file) => `https://raw.githubusercontent.com/google/fonts/${GOOGLE_COMMIT}/ofl/${dir}/${encodeURIComponent(file)}`,
  routed: (dir, file) => `https://raw.githubusercontent.com/dse/routed-gothic/365e340/dist/ttf/${file}`,
};
const GOOGLE_COMMIT = "bd8f81ddb5c74d5c8897b36ad88b440266245103";   // github.com/google/fonts as of 11 Oct 2026

// [family shown, what it is good for, source, folder, [file, style shown]…]
const FAMILIES = [
  ["Arimo", "neutral grotesque, Helvetica's proportions", "google", "arimo", ["Arimo[wght].ttf", "Regular"]],
  ["Archivo", "grotesque with width and weight axes", "google", "archivo", ["Archivo[wdth,wght].ttf", "Regular"]],
  ["Barlow", "DIN-like, rounded corners", "google", "barlow", ["Barlow-Regular.ttf", "Regular"], ["Barlow-Medium.ttf", "Medium"], ["Barlow-SemiBold.ttf", "SemiBold"], ["Barlow-Bold.ttf", "Bold"]],
  ["Barlow Condensed", "DIN-like, narrow", "google", "barlowcondensed", ["BarlowCondensed-Regular.ttf", "Regular"], ["BarlowCondensed-Medium.ttf", "Medium"], ["BarlowCondensed-SemiBold.ttf", "SemiBold"]],
  ["Overpass", "after US highway signs", "google", "overpass", ["Overpass[wght].ttf", "Regular"]],
  ["B612", "made for aircraft cockpit displays", "google", "b612", ["B612-Regular.ttf", "Regular"], ["B612-Bold.ttf", "Bold"]],
  ["Routed Gothic", "engraved lettering of instruments and drawings", "routed", "", ["routed-gothic.ttf", "Regular"], ["routed-gothic-narrow.ttf", "Narrow"], ["routed-gothic-wide.ttf", "Wide"]],
  ["Jost", "geometric, after Futura", "google", "jost", ["Jost[wght].ttf", "Regular"]],
  ["Josefin Sans", "geometric, 1920s", "google", "josefinsans", ["JosefinSans[wght].ttf", "Regular"]],
  ["Montserrat", "wide geometric", "google", "montserrat", ["Montserrat[wght].ttf", "Regular"]],
  ["Oswald", "condensed gothic", "google", "oswald", ["Oswald[wght].ttf", "Regular"]],
  ["Antonio", "tall condensed", "google", "antonio", ["Antonio[wght].ttf", "Regular"]],
  ["Michroma", "square, after Microgramma", "google", "michroma", ["Michroma-Regular.ttf", "Regular"]],
  ["Saira", "squarish, width and weight axes", "google", "saira", ["Saira[wdth,wght].ttf", "Regular"]],
  ["Bodoni Moda", "high-contrast serif for dress dials", "google", "bodonimoda", ["BodoniModa[opsz,wght].ttf", "Regular"]],
  ["Playfair Display", "transitional serif", "google", "playfairdisplay", ["PlayfairDisplay[wght].ttf", "Regular"]],
  ["Cormorant", "light Garamond-like serif", "google", "cormorant", ["Cormorant[wght].ttf", "Regular"]],
  ["Poiret One", "art deco, hairline", "google", "poiretone", ["PoiretOne-Regular.ttf", "Regular"]],
  ["Allerta Stencil", "stencil", "google", "allertastencil", ["AllertaStencil-Regular.ttf", "Regular"]],
];                                                                // + Inter, inside the page = 20

const local = (file) => file.replace(/[\[\],]+/g, "-").replace(/-\./, ".");
async function get(url, to) {
  if (fs.existsSync(to)) return;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  fs.writeFileSync(to, Buffer.from(await r.arrayBuffer()));
  console.log("fetched", path.basename(to));
}

fs.mkdirSync(path.join(DIR, "licences"), { recursive: true });
const list = [], credits = [];
for (const [family, what, source, dir, ...files] of FAMILIES) {
  const licence = family.replace(/ /g, "") + "-OFL.txt";
  await get(source === "google" ? SOURCES.google(dir, "OFL.txt") : "https://raw.githubusercontent.com/dse/routed-gothic/365e340/LICENSE.md", path.join(DIR, "licences", licence));
  const holder = (fs.readFileSync(path.join(DIR, "licences", licence), "utf8").match(/^Copyright.*$/m) || [""])[0].trim();
  credits.push(`| ${family} | ${files.map((f) => "`" + local(f[0]) + "`").join(" ")} | ${holder} | [licence](licences/${licence}) |`);
  for (const [file, style] of files) {
    const to = path.join(DIR, local(file));
    await get(SOURCES[source](dir, file), to);
    const face = new HB.Face(new HB.Blob(fs.readFileSync(to)), 0), font = new HB.Font(face);
    // a variable font may rest at its thinnest weight: start at regular (400) where the font has it
    const all = face.getAxisInfos(), start = {};
    if (all.wght && all.wght.default !== 400 && all.wght.min <= 400 && all.wght.max >= 400) start.wght = 400;
    font.setVariations(Object.entries(start).map(([tag, v]) => new HB.Variation(tag, v)));
    const k = 1000 / face.upem;
    const outline = (text) => {                                     // a word as an outline, 1000 units to the em, y down
      const buffer = new HB.Buffer();
      buffer.addText(text);
      buffer.guessSegmentProperties();
      HB.shape(font, buffer);
      let x = 0, d = "";
      for (const g of buffer.getGlyphInfosAndPositions()) {
        for (const c of font.glyphToJson(g.codepoint)) {
          d += c.type + c.values.map((v, i) => Math.round(i % 2 ? -v * k : (v + x / k * 1) * k)).join(" ");
        }
        x += g.xAdvance * k;
      }
      return { d, w: Math.round(x) };
    };
    // name: the family's name in its own face, for the font sheet (the family's first file only) · axes: what a variable font can vary, each with its least and most
    const first = !list.some((f) => f.family === family);
    // features: the OpenType switches that matter for numerals, and the numbered sets and variants (for the font sheet's stickers)
    const features = [...new Set(face.getTableFeatureTags("GSUB"))].filter((tag) => /^(tnum|pnum|lnum|onum|zero|frac|ss\d\d|cv\d\d)$/.test(tag)).sort();
    list.push({ family, style, ps: face.getName(6, "en"), file: local(file), what, start, axes: Object.fromEntries(Object.entries(all).map(([tag, x]) => [tag, [x.min, x.max]])), features, sample: outline("1234567890"), ...(first ? { name: outline(family) } : {}) });
  }
}
const text = `// Written by web/fonts.mjs — do not edit. The web version's own fonts: ${FAMILIES.length} families, ${list.length} files,
// all under the SIL Open Font Licence (web/fonts/README.md). sample: "1234567890" as an outline, 1000 units to the em; name: the family's name likewise.
export const FONT_SITE = "https://duztman.github.io/dial-tool/fonts/";
export const FONT_LIST = ${JSON.stringify(list)};
`;
fs.writeFileSync(path.join(here, "src/font_list.js"), text);
fs.writeFileSync(path.join(DIR, "README.md"), `# Fonts that come with the web version

Open-licence fonts the web version offers in its font list. All are under the SIL Open Font Licence 1.1,
which allows passing them on with their licence. Each family's own licence file, with its copyright line, is in \`licences/\`.
Taken from github.com/google/fonts (folder \`ofl/\`) and github.com/dse/routed-gothic on 11 Oct 2026; unchanged, only renamed
(\`Jost[wght].ttf\` → \`Jost-wght.ttf\`). Inter, the page's stand-in font, is packed inside the page itself (also OFL).
The list is written by \`web/fonts.mjs\`.

| Family | Files | Copyright | Licence |
|---|---|---|---|
${credits.join("\n")}
`);
const bytes = list.reduce((sum, f) => sum + fs.statSync(path.join(DIR, f.file)).size, 0);
console.log(`${FAMILIES.length} families · ${list.length} files · ${(bytes / 1e6).toFixed(1)} MB · list ${(text.length / 1e3).toFixed(0)} kB`);
console.log(list.map((f) => f.ps + (Object.keys(f.start).length ? " " + JSON.stringify(f.start) : "")).join(" · "));
