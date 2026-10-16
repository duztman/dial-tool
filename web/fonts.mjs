// fonts.mjs — the web version's own font list: fetches the files once, and writes src/font_list.js.
//
// Forty-two open-licence families that suit dial numerals. The files live in web/fonts/ (and are
// published with the page), so choosing one never depends on another site staying as it is.
// For each file this reads its names and axes with HarfBuzz and draws "1234567890" once, as a
// small outline — the picker shows that, so no font has to be downloaded just to be looked at.
//
//   cd web && node fonts.mjs          (downloads only what is missing)
//
// To add a family: add a line to FAMILIES, run this, run build.mjs. The list was kept at 20 (Okay, 11 Oct 2026) — 21 since
// Rubik (Okay, 15 Oct 2026, 11:29: "Ad rubik to the roster") — and is 42 since 17 Oct 2026: the top tier of the font research
// (docs/font-tiers-2026-10-16.md, build list #313) joined it (Okay: "incorporate it … Add just font list to defaults").
// Sources: google — github.com/google/fonts, ofl/; routed — github.com/dse/routed-gothic; wiegel — a zip on peter-wiegel.de
// (the fonts and their licence are taken out of it); datto — D-DIN from a GitHub mirror of Datto's own archive (Datto's page
// and Font Squirrel are not reachable from a session). GL-Nummernschild comes from a Wiegel zip but is Gutenberg Labo's
// free-software font, its licence only in the font's own name table: that text is kept by hand in licences/ (never fetched).

import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import * as HB from "harfbuzzjs";

const here = path.dirname(new URL(import.meta.url).pathname);
const DIR = path.join(here, "fonts");
const GOOGLE_COMMIT = "bd8f81ddb5c74d5c8897b36ad88b440266245103";   // github.com/google/fonts as of 11 Oct 2026
const DATTO_COMMIT = "e199c84";                                     // github.com/amcchord/datto-d-din: Datto's D-DIN_complete.zip as a repo (6 Oct 2022)
const WIEGEL = (zip) => `https://www.peter-wiegel.de/Fonts/${zip}`;
// a source: where a family's file is (font), where its licence is (licence: a URL, or [zip URL, file inside]; null = kept by hand), the licence file's suffix
const SOURCES = {
  google: { font: (dir, file) => `https://raw.githubusercontent.com/google/fonts/${GOOGLE_COMMIT}/ofl/${dir}/${encodeURIComponent(file)}`, licence: (dir) => `https://raw.githubusercontent.com/google/fonts/${GOOGLE_COMMIT}/ofl/${dir}/OFL.txt`, suffix: "-OFL.txt" },
  routed: { font: (dir, file) => `https://raw.githubusercontent.com/dse/routed-gothic/365e340/dist/ttf/${file}`, licence: () => "https://raw.githubusercontent.com/dse/routed-gothic/365e340/LICENSE.md", suffix: "-OFL.txt" },
  wiegel: { font: (zip, file) => [WIEGEL(zip), file], licence: (zip) => [WIEGEL(zip), "Open Font License.txt"], suffix: "-OFL.txt" },
  gutenberg: { font: (zip, file) => [WIEGEL(zip), file], licence: () => null, suffix: "-free-software.txt" },
  datto: { font: (dir, file) => `https://raw.githubusercontent.com/amcchord/datto-d-din/${DATTO_COMMIT}/${file}`, licence: () => `https://raw.githubusercontent.com/amcchord/datto-d-din/${DATTO_COMMIT}/OFL-1.1.txt`, suffix: "-OFL.txt" },
};

// [family shown, what it is good for, source, folder or zip, [file, style shown]…]
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
  ["Rubik", "grotesque with softly rounded corners", "google", "rubik", ["Rubik[wght].ttf", "Regular"]],      // added 15 Oct 2026 (Okay, 11:29: "Ad rubik to the roster"): the list is 21
  ["Oswald", "condensed gothic", "google", "oswald", ["Oswald[wght].ttf", "Regular"]],
  ["Antonio", "tall condensed", "google", "antonio", ["Antonio[wght].ttf", "Regular"]],
  ["Michroma", "square, after Microgramma", "google", "michroma", ["Michroma-Regular.ttf", "Regular"]],
  ["Saira", "squarish, width and weight axes", "google", "saira", ["Saira[wdth,wght].ttf", "Regular"]],
  ["Bodoni Moda", "high-contrast serif for dress dials", "google", "bodonimoda", ["BodoniModa[opsz,wght].ttf", "Regular"]],
  ["Playfair Display", "transitional serif", "google", "playfairdisplay", ["PlayfairDisplay[wght].ttf", "Regular"]],
  ["Cormorant", "light Garamond-like serif", "google", "cormorant", ["Cormorant[wght].ttf", "Regular"]],
  ["Poiret One", "art deco, hairline", "google", "poiretone", ["PoiretOne-Regular.ttf", "Regular"]],
  ["Allerta Stencil", "stencil", "google", "allertastencil", ["AllertaStencil-Regular.ttf", "Regular"]],
  // the top tier of the font research, 17 Oct 2026 (docs/font-tiers-2026-10-16.md, #313): what the twenty lacked, a voice or two each
  ["Anybody", "grotesque with width (50 to 150) and weight axes", "google", "anybody", ["Anybody[wdth,wght].ttf", "Regular"]],
  ["Bebas Neue", "poster condensed, tabular digits", "google", "bebasneue", ["BebasNeue-Regular.ttf", "Regular"]],
  ["Cinzel", "Trajan-like capitals, for Roman numerals", "google", "cinzel", ["Cinzel[wght].ttf", "Regular"]],
  ["Italiana", "fine high-contrast, old-style digits", "google", "italiana", ["Italiana-Regular.ttf", "Regular"]],
  ["Marcellus", "flared Roman capitals, light", "google", "marcellus", ["Marcellus-Regular.ttf", "Regular"]],
  ["Public Sans", "neutral; tabular, lining and old-style digits to switch", "google", "publicsans", ["PublicSans[wght].ttf", "Regular"]],
  ["Sometype Mono", "monospace grotesque, tabular, weight axis", "google", "sometypemono", ["SometypeMono[wght].ttf", "Regular"]],
  ["Space Grotesk", "instrument-like grotesque, slashed zero", "google", "spacegrotesk", ["SpaceGrotesk[wght].ttf", "Regular"]],
  ["Tourney", "tournament techno, width and weight axes", "google", "tourney", ["Tourney[wdth,wght].ttf", "Regular"]],
  ["Unica One", "compact grotesque with technical corners", "google", "unicaone", ["UnicaOne-Regular.ttf", "Regular"]],
  ["D-DIN", "DIN 1451 homage, the working DIN", "datto", "", ["D-DIN.ttf", "Regular"], ["D-DIN-Bold.ttf", "Bold"], ["D-DINCondensed.ttf", "Condensed"], ["D-DINExp.ttf", "Expanded"]],
  ["Alte DIN 1451 Mittelschrift", "the old DIN 1451 itself, the historic numerals", "wiegel", "Din1451altTT.zip", ["din1451alt.ttf", "Regular"]],      // the zip's din1451alt_g.ttf (a little fatter, as embossing makes it) carries the same PostScript name, so it can't be listed beside it
  ["Apollo", "Gründerzeit display, 1888", "wiegel", "ApolloASM.zip", ["ApolloASM.ttf", "Regular"]],
  ["Bernardo Moda Contrast", "high-contrast Didone, old-style figures", "wiegel", "BernardoModaContrast.zip", ["Bernardo Moda contrast.ttf", "Regular"]],
  ["CAT DyFa", "LCD segments", "wiegel", "CATDyFa.zip", ["CAT_DyFa.ttf", "Regular"]],
  ["CAT Kurier", "brush script, 1954", "wiegel", "CATKurier.zip", ["CATKurier.ttf", "Regular"]],
  ["Erika Type", "typewriter", "wiegel", "ErikaType.zip", ["Erika Type.ttf", "Regular"], ["Erika Type_B.ttf", "Bold"]],
  ["GL-Nummernschild", "German number-plate face (FE-Schrift), tabular", "gutenberg", "GL_Nummernschild.zip", ["GL-Nummernschild-Mtl.ttf", "Mittelschrift"], ["GL-Nummernschild-Eng.ttf", "Engschrift"]],
  ["Immermann", "condensed street-sign lettering", "wiegel", "Immermann.zip", ["immermann.ttf", "Regular"]],
  ["Koch-Fraktur", "poster Fraktur, 1908", "wiegel", "KochFraktur-UNZ1A.zip", ["Koch Fraktur_UNZ1A.ttf", "Regular"]],
  ["TGL 0-16", "technical-drawing lettering (DIN 16); DIN 17, slanted", "wiegel", "TGL_0-16.zip", ["TGL 0-16.ttf", "Regular"], ["TGL 0-17.ttf", "Slanted"]],
];                                                                // + Inter, inside the page = 42

const local = (file) => file.replace(/[\[\], ]+/g, "-").replace(/-\./, ".");      // "Jost[wght].ttf" → "Jost-wght.ttf"; spaces to dashes too (a file is fetched by its address)
const zips = new Map();                                                           // a zip is fetched once, to a temporary folder
async function get(from, to) {
  if (fs.existsSync(to)) return;
  if (Array.isArray(from)) {                                                      // [zip's URL, file inside it]
    const [url, inside] = from;
    if (!zips.has(url)) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status} for ${url}`);
      const zip = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "fonts-")), path.basename(url));
      fs.writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
      zips.set(url, zip);
    }
    fs.writeFileSync(to, execFileSync("unzip", ["-p", zips.get(url), inside], { maxBuffer: 64e6 }));
  } else {
    const r = await fetch(from);
    if (!r.ok) throw new Error(`${r.status} for ${from}`);
    fs.writeFileSync(to, Buffer.from(await r.arrayBuffer()));
  }
  console.log("fetched", path.basename(to));
}

fs.mkdirSync(path.join(DIR, "licences"), { recursive: true });
const list = [], credits = [];
for (const [family, what, source, dir, ...files] of FAMILIES) {
  const licence = family.replace(/ /g, "") + SOURCES[source].suffix, from = SOURCES[source].licence(dir);
  if (from) await get(from, path.join(DIR, "licences", licence));
  else if (!fs.existsSync(path.join(DIR, "licences", licence))) throw new Error(`${licence} is kept by hand and is missing`);
  const holder = (fs.readFileSync(path.join(DIR, "licences", licence), "utf8").match(/^(Copyright|\(C\)).*$/m) || [""])[0].trim();
  credits.push(`| ${family} | ${files.map((f) => "`" + local(f[0]) + "`").join(" ")} | ${holder} | [licence](licences/${licence}) |`);
  for (const [file, style] of files) {
    const to = path.join(DIR, local(file));
    await get(SOURCES[source].font(dir, file), to);
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
// all under the SIL Open Font Licence but GL-Nummernschild, free software (web/fonts/README.md). sample: "1234567890" as an outline, 1000 units to the em; name: the family's name likewise.
export const FONT_SITE = "https://duztman.github.io/dial-tool/fonts/";
export const FONT_LIST = ${JSON.stringify(list)};
`;
fs.writeFileSync(path.join(here, "src/font_list.js"), text);
fs.writeFileSync(path.join(DIR, "README.md"), `# Fonts that come with the web version

Open-licence fonts the web version offers in its font list. All are under the SIL Open Font Licence 1.1,
which allows passing them on with their licence — but one: GL-Nummernschild is Gutenberg Labo's free-software font
("unlimited permission is granted to use, copy, and distribute it, with or without modification"; its licence is only in
the font's own name table, copied into \`licences/\`). Each family's own licence file, with its copyright line, is in \`licences/\`.
Taken from github.com/google/fonts (folder \`ofl/\`) and github.com/dse/routed-gothic on 11 Oct 2026, and on 17 Oct 2026
(the font research's top tier, \`docs/font-tiers-2026-10-16.md\`) from google/fonts again, from Peter Wiegel's zips at
peter-wiegel.de, and — D-DIN — from github.com/amcchord/datto-d-din, a copy of Datto's own \`D-DIN_complete.zip\` (Datto's
page is not reachable from a session); unchanged, only renamed (\`Jost[wght].ttf\` → \`Jost-wght.ttf\`, spaces to dashes).
Most carry Reserved Font Names: a file is passed on whole, never subset (docs/font-research-2026-10-16.md §4).
Inter, the page's stand-in font, is packed inside the page itself (also OFL). The list is written by \`web/fonts.mjs\`.

| Family | Files | Copyright | Licence |
|---|---|---|---|
${credits.join("\n")}
`);
const bytes = list.reduce((sum, f) => sum + fs.statSync(path.join(DIR, f.file)).size, 0);
console.log(`${FAMILIES.length} families · ${list.length} files · ${(bytes / 1e6).toFixed(1)} MB · list ${(text.length / 1e3).toFixed(0)} kB`);
console.log(list.map((f) => f.ps + (Object.keys(f.start).length ? " " + JSON.stringify(f.start) : "")).join(" · "));
