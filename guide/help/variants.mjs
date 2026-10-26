// variants.mjs — the help page's small pictures of what a choice does (Okay, 26 Oct 2026: "All do. All."): the First
// dial with one setting changed at a time, drawn by the Gallery's own card() (links.mjs), and the watch in show mode
// shot from the built page. Into guide/help/img/v-<set>-<word>.webp at 2× of the page's size.
//   node guide/help/variants.mjs
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { execFileSync } from "child_process";
const WEB = new URL("../../web/", import.meta.url), OUT = new URL("./img/", import.meta.url).pathname;
const req = createRequire(new URL("package.json", WEB));
const { chromium } = req("playwright");
const { engines } = await import(new URL("test/engines.mjs", WEB));
const { card } = await import(new URL("links.mjs", WEB));
const { FONT_LIST } = await import(new URL("src/font_list.js", WEB));
const { OPENER } = await import(new URL("src/opener.js", WEB));
const { svg_document } = await import(new URL("src/output.js", WEB));

const G = await engines();
for (const f of FONT_LIST) G.add_font(fs.readFileSync(path.join(WEB.pathname, "fonts", f.file)));
const copy = (x) => JSON.parse(JSON.stringify(x));
// the help's neutral greys (grey.cjs; Okay, 26 Oct 2026: "a neutral gray was the help's main. Replace the blue")
const GREY = { c_backdrop: [0.82, 0.82, 0.82, 1], c_plate: [0.20, 0.20, 0.20, 1], print: [0.94, 0.94, 0.94, 1], hands: [[0.86, 0.86, 0.86, 1], [0.70, 0.70, 0.70, 1], [1, 1, 1, 1]], c_cap: [0.96, 0.96, 0.96, 1], frame: [0.94, 0.94, 0.94, 1], figures: [0.16, 0.16, 0.16, 1] };
export const greyed = (S) => { S.c_backdrop = GREY.c_backdrop; S.c_plate = GREY.c_plate; S.c_cap = GREY.c_cap;
  S.rings.forEach((r) => { r.c = GREY.print; if (r.cs) r.cs = {}; }); ["ha_hour", "ha_minute", "ha_second"].forEach((k, i) => { S[k] = { ...S[k], c: GREY.hands[i] }; });
  S.da_ink = GREY.frame; S.da_text_c = GREY.figures; (S.windows || []).forEach((w) => { w.ink = GREY.frame; w.text_c = GREY.figures; }); return S; };
const base = () => greyed(copy(OPENER));
const INK_GREY = GREY.print;
const ring = (S, name) => S.rings.find((r) => r.name === name);
const alone = (S, keep) => { S.rings = S.rings.filter((r) => keep.includes(r.name)); return S; };

// each set: [file word, caption, settings]
const SETS = {};
// Hands › Shape: the hour and minute hands in each shape (the file shape, a picture of one's own, is not built)
SETS.hand = G.HAND_SHAPES.map((shape, i) => [shape, shape, (() => { if (shape === "file") return null; const S = base(); S.ha_hour = { ...S.ha_hour, shape: i }; S.ha_minute = { ...S.ha_minute, shape: i };
  if (shape === "disc") { S.ha_hour = { ...S.ha_hour, disc_d: 2 * S.ha_hour.len, c: [0.86, 0.86, 0.86, 0.45], mark_as: 1, mark_c: [1, 1, 1, 1], mark_len: 2.4, mark_w: 0.8 }; S.ha_minute = { ...S.ha_minute, shape: 0 }; }      // a disc hand: one disc, as wide as its length reaches, see-through so the dial shows, its marker painted at its edge (Okay: "bigger transparent disc for previews")
  return S; })()]).filter((x) => x[2]);
// Windows › Complication: one window at 3 in each kind
SETS.window = ["date", "day", "am · pm", "moon phase"].map((k) => [k, k === "moon phase" ? "moon" : k, (() => { const S = base(); S.da_on = true; S.da_kind = G.WINDOW_KINDS.indexOf(k); return S; })()]);
// Rings › kinds: one ring of each kind, alone on the plate
const one = (r) => { const S = base(); S.rings = [{ ...G.RING_BASE, c: INK_GREY, ...r }]; S.da_on = false; S.ha_on = false; return S; };
SETS.kind = [
  ["ticks", "ticks", one({ kind: 0, name: "ticks", r: 16.2, count: 60, len: 1.95, w: 0.2 })],
  ["markers", "markers", one({ kind: 1, name: "markers", r: 16.2, count: 12, len: 2.4, w: 0.7 })],
  ["numerals", "numerals", one({ kind: 2, name: "numerals", r: 13.83, count: 12, size: 4.8, family: "Barlow", ps: "Barlow-SemiBold", anchor: 3 })],
  ["band", "band", one({ kind: 3, name: "band", r: 15.5, count: 1, width: 1.2 })],
  ["text", "text", one({ kind: 4, name: "text", r: 6, count: 1, start: 180, custom: "AUTOMATIC", size: 1.6, family: "Barlow", ps: "Barlow-SemiBold" })],
];
// Rings › Numerals › Labels: the numerals at every hour, markers off
const numerals = (f) => { const S = base(); const n = ring(S, "Numerals"); n.every = 1; ring(S, "Markers").on = false; S.da_on = false; f(n); return S; };
SETS.labels = [["arabic", "Arabic", 0], ["iiii", "Roman · IIII", 1], ["iv", "Roman · IV", 2], ["eastern", "Eastern Arabic", 3], ["chinese", "Chinese", 4], ["words", "Words", 5]]
  .map(([w, c, i]) => [w, c, numerals((n) => { n.labels = i; if (i === 5) n.size = 2; if (i === 3) Object.assign(n, { family: "Vazirmatn", ps: "Vazirmatn-Regular", size: 4.4 }); if (i === 4) Object.assign(n, { family: "Noto Serif SC", ps: "NotoSerifSC-ExtraLight", size: 3.4, axes: { wght: 600 } }); })]);      // the two non-Latin sets in a font that has them, as one would choose in the app
// Rings › Numerals › Placement
SETS.place = G.MODES.map((m, i) => [m.replace(/[^a-z]+/g, "-"), m === "radial, auto-flip" ? "auto-flip" : m, numerals((n) => { n.mode = i; if (i) n.anchor = 0; })]);
// Rings › Resize Ring from: the same radius, the markers measured from their outer end, middle, inner end; a red circle at the radius
SETS.from = G.FROM.map((f, i) => [f, f[0].toUpperCase() + f.slice(1), (() => { const S = base(); S.da_on = false; S.ha_on = false;
  S.rings = [{ ...G.RING_BASE, kind: 3, name: "radius", c: [0.8, 0.22, 0.1, 1], r: 15, count: 1, width: 0.15 }, { ...ring(S, "Markers"), r: 15, from: i, every: 1, invert: false, len: 3 }]; return S; })()]);
// Rings › Give way: the First dial's numerals over a ring of long ticks that runs under them; the ticks draw through,
// skip the positions the numerals take, or are cut back round them
SETS.give = [["nothing", "nothing", 0, 0], ["skip", "Skip where", 2, 0], ["knock", "Knock out", 0, 2]].map(([w, c, skip, knock]) => [w, c, (() => { const S = base(); S.da_on = false; S.ha_on = false;
  S.rings = [{ ...ring(S, "Numerals") }, { ...G.RING_BASE, kind: 0, name: "ticks", c: INK_GREY, r: 16, count: 60, len: 6.5, w: 0.3, skip, knock, clear: 0.45 }]; return S; })()]);
// Windows: a few of their choices, zoomed on the window at 3 (Okay, 26 Oct 2026: "Dates weekdays, am pm. Do not overdo but illustrate")
const win = (set) => { const S = base(); S.da_on = true; S.da_size = 62; Object.assign(S, set); return S; };      // the text at the code's own 62 % (the First dial prints its date larger, and a word would overflow)
SETS.wbig = [["date", "date", win({ da_kind: 0 })], ["big", "Big date", win({ da_kind: 4 })]];
SETS.wwritten = [["short", "Short", win({ da_kind: 1, da_day_form: 0 })], ["full", "Full", win({ da_kind: 1, da_day_form: 1, da_w: 8.6 })]];
SETS.wnames = ["EN", "TR", "DE"].map((n, i) => [n.toLowerCase(), n, win({ da_kind: 1, da_names: ["EN", "TR", "DE", "FR", "IT"].indexOf(n) })]);
SETS.wshows = [["disc", "Disc", win({ da_kind: 2, da_ampm_form: 0 })], ["words", "Words", win({ da_kind: 2, da_ampm_form: 1 })]];
SETS.wshape = [["rectangle", "rectangle", 1, 0], ["circle", "circle", 2, 0], ["polygon", "polygon", 3, 0], ["arch", "arch · moon", 4, 3], ["half", "half · am · pm", 6, 2]]
  .map(([w, c, shape, kind]) => [w, c, win({ da_kind: kind, da_shape: shape })]);
const WIN_VIEW = (r) => `viewBox="${r - 6} -3 12 6"`;      // the window at 3, 12 × 6 mm round it
const pictures = [];
const zoom = (svg, r) => svg.replace(/viewBox="[^"]+"/, `viewBox="${-r} ${-r} ${2 * r} ${2 * r}"`);
for (const [set, list] of Object.entries(SETS)) for (const [word, caption, S] of list) pictures.push({ file: `v-${set}-${word}`, caption, svg: set.startsWith("w") && set !== "window" ? card(G, S).picture.replace(/viewBox="[^"]+"/, WIN_VIEW(S.da_r)) : set === "labels" || set === "place" ? card(G, S).picture.replace(/viewBox="[^"]+"/, 'viewBox="-7 -17.5 24.5 24.5"') : set === "hand" ? zoom(card(G, S).picture, 13) : set === "give" ? card(G, S).picture.replace(/viewBox="[^"]+"/, 'viewBox="6 -5.5 11 11"') : card(G, S).picture, size: set.startsWith("w") && set !== "window" || set === "labels" || set === "place" ? 288 : 192, h: set.startsWith("w") && set !== "window" ? 144 : set === "labels" || set === "place" ? 288 : 192 });      // the labels and placements: the quarter from 12 to 3, so every word reads (Okay, 26 Oct 2026: "Should be able to read all the word … Arabic japanese and stuff too"); those and the windows at twice the size they show      // the hands: their middle, where the shapes differ; Give way: round the 3, where the ticks meet the figure
// Export › Print: the colour file and its Mono print mask
{ const S = G.fresh_settings(base());
  pictures.push({ file: "v-print-colour", caption: "colour", svg: card(G, base()).picture, size: 192 });
  const M = { ...S, out_production: true };
  pictures.push({ file: "v-print-mask", caption: "Mono print mask", svg: svg_document(M, G.build_static(M), S.t, { preview: true }), size: 192 }); }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 192, height: 192 } });      // a window's picture 192 × 96
const save = (png) => { execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}");im.save("${png.replace(".png", ".webp")}",quality=86,method=6)`]); fs.unlinkSync(png); };
for (const p of pictures) {
  const h = p.h || p.size; await page.setViewportSize({ width: p.size, height: h });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${p.size}px;height:${h}px}</style>${p.svg.replace(/<svg /, `<svg width="${p.size}" height="${h}" `)}`);
  await page.screenshot({ path: OUT + p.file + ".png", omitBackground: true }); save(OUT + p.file + ".png");
}

// show mode: the watch as the app's own PNG export draws it (Export › Image · PNG), its frame the view's (Detail or Whole watch)
const shots = [];
const watch = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", acceptDownloads: true });
await watch.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB.pathname, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
await watch.goto(new URL("dial-tool.html", WEB).href); await watch.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
await req(new URL("../guide/help/grey.cjs", WEB).pathname)(watch);      // the help's greys, as every picture of the window
await watch.evaluate(() => { window.dial_tool.show_mode(true, true); [...document.querySelectorAll("button[data-tab]")].find((b) => b.dataset.tab === "Show export").click(); });
const shoot = async (file, caption, set) => {
  await watch.evaluate((set) => { const t = window.dial_tool; for (const [k, v] of Object.entries({ out_watch_px: 480, ...set })) t.set_value("global", k, v); t.render(); }, set);
  await watch.waitForTimeout(300);
  const [dl] = await Promise.all([watch.waitForEvent("download"), watch.click("#export-watch-png")]);
  await dl.saveAs(OUT + file + ".png"); save(OUT + file + ".png"); shots.push({ file, caption });
};
const B = { dress: 3, field: 2, diver: 1, emre01: 5 };
for (const [k, c] of [["dress", "Dress"], ["field", "Field"], ["diver", "Diver"], ["emre01", "Emre"]]) await shoot(`v-case-${k}`, c, { bezel: B[k], strap: 1, w_view: 0, w_style: 1, w_lighting: 0 });
for (const [st, l, c] of [[1, 0, "Miyazaki · Dramatic"], [0, 0, "Engineer · Dramatic"], [1, 1, "Miyazaki · Flat"], [0, 1, "Engineer · Flat"]]) await shoot(`v-style-${st}${l}`, c, { bezel: 1, strap: 1, w_view: 0, w_style: st, w_lighting: l });
for (const [st, c] of [[1, "leather"], [3, "NATO"], [2, "bracelet"], [4, "links"]]) await shoot(`v-strap-${c.toLowerCase()}`, c, { bezel: 1, strap: st, w_view: 1, w_style: 1, w_lighting: 0 });
await browser.close();
fs.writeFileSync("/tmp/claude-0/help/variants.json", JSON.stringify({ pictures: pictures.map(({ file, caption }) => ({ file, caption })), shots }, null, 1));
console.log(pictures.length, "dial pictures ·", shots.length, "watch pictures");
