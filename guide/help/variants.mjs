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
// Hands › Shape: the hour and minute hands in each shape on a bare plate, no marks, windows or seconds hand (Okay, 26 Oct
// 2026: "Just to show varieties of hands. Simplify"; "some are dangerously touching the corners, better spacing. You can
// crop out the second if it's consistent. Center the center"): the pivot in the middle of a 26 mm square, the minute
// tip 2.5 mm inside it, the plate 38 mm so the square is all plate. The file shape, a picture of one's own, is not built
SETS.hand = G.HAND_SHAPES.map((shape, i) => [shape, shape, (() => { if (shape === "file") return null; const S = base(); S.rings.forEach((r) => { r.on = false; }); S.da_on = false; S.dial_d = 38; S.ha_second = { ...S.ha_second, on: false }; S.ha_hour = { ...S.ha_hour, shape: i }; S.ha_minute = { ...S.ha_minute, shape: i };
  if (shape === "disc") { S.ha_hour = { ...S.ha_hour, disc_d: 2 * S.ha_hour.len, c: [0.86, 0.86, 0.86, 0.45], mark_as: 1, mark_c: [1, 1, 1, 1], mark_len: 2.4, mark_w: 0.8 }; S.ha_minute = { ...S.ha_minute, shape: 0 }; }      // a disc hand: one disc, as wide as its length reaches, see-through so the dial shows, its marker painted at its edge (Okay: "bigger transparent disc for previews")
  return S; })()]).filter((x) => x[2]);
// Rings › kinds: one ring of each kind, alone on the plate
const one = (r) => { const S = base(); S.rings = [{ ...G.RING_BASE, c: INK_GREY, ...r }]; S.da_on = false; S.ha_on = false; return S; };
SETS.kind = [
  ["ticks", "ticks", one({ kind: 0, name: "ticks", r: 16.2, count: 60, len: 1.95, w: 0.2 })],
  ["markers", "markers", one({ kind: 1, name: "markers", r: 16.2, count: 12, len: 2.4, w: 0.7 })],
  ["numerals", "numerals", one({ kind: 2, name: "numerals", r: 13.83, count: 12, size: 4.8, family: "Barlow", ps: "Barlow-SemiBold", anchor: 3 })],
  ["band", "band", one({ kind: 3, name: "band", r: 15.5, count: 1, width: 1.2 })],
  ["text", "text", one({ kind: 4, name: "text", r: 6, count: 1, start: 180, custom: "AUTOMATIC", size: 2.4, family: "Barlow", ps: "Barlow-SemiBold" })],
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
// the windows (Okay, 26 Oct 2026: "better number spacing, number varieties (not just one) better color separation
// between inks and dial floor"): the disc a light grey under the white frame and marks, so the hole's edge shows; the
// figures at 56 % of the hole, with room round them; each picture on its own day, so the dates differ; no neighbours
// peeking at the hole's edge, no hands across the window (they have no picture of their own); the full day name drawn nearer the centre, clear of the ticks
const DISC = [0.76, 0.76, 0.76, 1], FRAME = [0.55, 0.55, 0.55, 1];      // a window's frame a grey of its own, between the plate and the disc (Okay, 26 Oct 2026: "Window borders another tone of gray instead of white")
const win = (set, date = "2026-10-17") => { const S = base(); S.da_on = true; S.da_size = 56; S.da_disc_c = DISC; S.date = date; S.da_neighbours = false; S.ha_on = false;
  S.da_ink = FRAME; (S.windows || []).forEach((w) => { w.disc_c = DISC; w.ink = FRAME; }); Object.assign(S, set); return S; };
SETS.window = [["date", "2026-10-17"], ["day", "2026-10-29"], ["am · pm", "2026-10-17"], ["moon phase", "2026-10-21"]].map(([k, d]) => [k.replace(/[^a-z]+/g, ""), k === "moon phase" ? "moon" : k, win({ da_kind: G.WINDOW_KINDS.indexOf(k) }, d)]);      // zoomed on the window, as the other window strips (Okay, 26 Oct 2026: "Should be able to read all the word")
SETS.wbig = [["date", "date", win({ da_kind: 0 }, "2026-10-08")], ["big", "Big date", win({ da_kind: 4 }, "2026-10-26")]];
SETS.wwritten = [["short", "Short", win({ da_kind: 1, da_day_form: 0 }, "2026-10-24")], ["full", "Full", win({ da_kind: 1, da_day_form: 1, da_w: 8.6, da_r: 9.9 }, "2026-10-24")]];
SETS.wnames = ["EN", "TR", "DE"].map((n, i) => [n.toLowerCase(), n, win({ da_kind: 1, da_names: ["EN", "TR", "DE", "FR", "IT"].indexOf(n) }, "2026-10-30")]);
SETS.wshows = [["disc", "Disc", win({ da_kind: 2, da_ampm_form: 0 })], ["words", "Words", win({ da_kind: 2, da_ampm_form: 1 })]];
SETS.wshape = [["rectangle", "rectangle", 1, 0], ["circle", "circle", 2, 0], ["polygon", "polygon", 3, 0], ["arch", "arch · moon", 4, 3], ["half", "half · am · pm", 6, 2]]
  .map(([w, c, shape, kind], i) => [w, c, win({ da_kind: kind, da_shape: shape }, ["2026-10-12", "2026-10-03", "2026-10-21", "2026-10-21", "2026-10-21"][i])]);
const WIN_VIEW = (r) => `viewBox="${r - 6} -3 12 6"`;      // the window at 3, 12 × 6 mm round it
const pictures = [];
const zoom = (svg, r) => svg.replace(/viewBox="[^"]+"/, `viewBox="${-r} ${-r} ${2 * r} ${2 * r}"`);
const from_app = [];
// a cropped picture is a whole rectangle on the help's grey, not the plate's edge cut against the page (Okay, 27 Oct 2026:
// "Complete squares (+ rectangles like these) with grey background"; "Fill BGs"); the whole dials (Placement, the kinds) stay on the page
const FILL = GREY.c_backdrop, FILL_CSS = `rgb(${FILL.slice(0, 3).map((v) => Math.round(v * 255)).join(",")})`;
for (const [set, list] of Object.entries(SETS)) for (const [word, caption, S] of list) if (set === "hand" || set.startsWith("w")) from_app.push({ file: `v-${set}-${word}`, caption, S: { ...S, c_backdrop: FILL, guides: false }, mm: set === "hand" ? [-13, -13, 26, 26] : [S.da_r - 6, -3, 12, 6], px: set === "hand" ? [192, 192] : [288, 144] });
  else pictures.push({ file: `v-${set}-${word}`, caption, svg: set.startsWith("w") ? card(G, S).picture.replace(/viewBox="[^"]+"/, WIN_VIEW(S.da_r)) : set === "labels" ? card(G, S).picture.replace(/viewBox="[^"]+"/, 'viewBox="-7 -17.5 24.5 24.5"') : set === "hand" ? zoom(card(G, S).picture, 11.8) : set === "kind" && word === "text" ? zoom(card(G, S).picture, 9) : set === "give" ? card(G, S).picture.replace(/viewBox="[^"]+"/, 'viewBox="6 -5.5 11 11"') : card(G, S).picture, fill: set === "labels" || set === "give", size: set.startsWith("w") || set === "labels" || set === "place" ? 288 : 192, h: set.startsWith("w") ? 144 : set === "labels" || set === "place" ? 288 : 192 });      // the labels: the quarter from 12 to 3, so every word reads; the placements whole, where turning shows (Okay, 26 Oct 2026: "some like numbers placement auto rotate etc better show all dial") (Okay, 26 Oct 2026: "Should be able to read all the word … Arabic japanese and stuff too"); those and the windows at twice the size they show      // the hands: their middle, a square inside the plate, where the shapes differ; Give way: round the 3, where the ticks meet the figure
// Export › Print: the colour file and its Mono print mask
{ const S = G.fresh_settings(base());
  pictures.push({ file: "v-print-colour", caption: "colour", svg: card(G, base()).picture, size: 192 });
  const M = { ...S, out_production: true };
  pictures.push({ file: "v-print-mask", caption: "Mono print mask", svg: svg_document(M, G.build_static(M), S.t, { preview: true }), size: 192 }); }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 192, height: 192 } });      // a window's picture 192 × 96
const save = (png) => { execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}");im.save("${png.replace(".png", ".webp")}",quality=86,method=6)`]); fs.unlinkSync(png); };
const FULL = 1200;
for (const p of pictures) for (const big of [false, true]) {
  const k = big ? FULL / p.size : 1, w = Math.round(p.size * k), h = Math.round((p.h || p.size) * k), file = p.file + (big ? "-full" : "");
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<style>html,body{margin:0;background:${p.fill ? FILL_CSS : "transparent"}}svg{display:block;width:${w}px;height:${h}px}</style>${p.svg.replace(/<svg /, `<svg width="${w}" height="${h}" `)}`);
  await page.screenshot({ path: OUT + file + ".png", omitBackground: !p.fill }); save(OUT + file + ".png");
}

// show mode: the watch as the app's own PNG export draws it (Export › Image · PNG), its frame the view's (Detail or Whole watch)
const shots = [];
const watch = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", acceptDownloads: true });
await watch.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB.pathname, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
await watch.goto(new URL("dial-tool.html", WEB).href); await watch.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
// the app's own drawing of each: its settings loaded as a settings file, the dial alone, the view set so the picture's
// millimetres fill the shot (z px a mm; c the dial's centre in the preview), at twice the size it shows
const SHARP = 8;
const sharp = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SHARP, reducedMotion: "reduce" });
await sharp.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB.pathname, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
await sharp.goto(new URL("dial-tool.html", WEB).href); await sharp.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
const frames = () => sharp.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
for (const p of from_app) {
  await sharp.evaluate((S) => { const t = window.dial_tool; t.statik = null; t.load_text(JSON.stringify(S), "help.json"); }, p.S);
  await sharp.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await sharp.evaluate(() => document.fonts.ready); await frames();
  if (!(await sharp.evaluate(() => document.querySelector("#app").classList.contains("away")))) { await sharp.keyboard.press("e"); await sharp.waitForTimeout(1300); }
  await sharp.mouse.move(5, 5); await sharp.waitForTimeout(400);
  const clip = await sharp.evaluate(([mm, px]) => {
    const t = window.dial_tool, svg = t.dial.ownerSVGElement, R = svg.getBoundingClientRect(), [W, H] = [px[0] / 2, px[1] / 2];
    t.z = W / mm[2]; t.c = [R.width / 2 - (mm[0] + mm[2] / 2) * t.z, R.height / 2 + (mm[1] + mm[3] / 2) * t.z]; t.fitted = false; t.place(); t.render();
    return { x: R.x + R.width / 2 - W / 2, y: R.y + R.height / 2 - H / 2, width: W, height: H };
  }, [p.mm, p.px]);
  await frames();
  // shot at 8× (SHARP): the page's file brought down to its 2×, the lightbox's kept at 8×
  await sharp.screenshot({ path: OUT + p.file + "-full.png", clip });
  execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${OUT + p.file}-full.png");im.resize((${p.px[0]},${p.px[1]}),Image.LANCZOS).save("${OUT + p.file}.webp",quality=86,method=6);im.save("${OUT + p.file}-full.webp",quality=88,method=6)`]); fs.unlinkSync(OUT + p.file + "-full.png");
}
await req(new URL("../guide/help/grey.cjs", WEB).pathname)(watch);      // the help's greys, as every picture of the window
await watch.evaluate(() => { window.dial_tool.show_mode(true, true); [...document.querySelectorAll("button[data-tab]")].find((b) => b.dataset.tab === "Show export").click(); });
const shoot = async (file, caption, set) => {
  await watch.evaluate((set) => { const t = window.dial_tool; for (const [k, v] of Object.entries({ out_watch_px: 480, ...set })) t.set_value("global", k, v); t.render(); }, set);
  await watch.waitForTimeout(300);
  const [dl] = await Promise.all([watch.waitForEvent("download"), watch.click("#export-watch-png")]);
  await dl.saveAs(OUT + file + ".png"); save(OUT + file + ".png"); shots.push({ file, caption });
  if (set.out_watch_px) return;      // the straps' whole watch is already the lightbox's picture
  await watch.evaluate(() => { const t = window.dial_tool; t.set_value("global", "out_watch_px", 1600); t.render(); }); await watch.waitForTimeout(300);
  const [big] = await Promise.all([watch.waitForEvent("download"), watch.click("#export-watch-png")]);
  await big.saveAs(OUT + file + "-full.png"); save(OUT + file + "-full.png");
};
const B = { dress: 3, field: 2, diver: 1, emre01: 5 };
for (const [k, c] of [["dress", "Dress"], ["field", "Field"], ["diver", "Diver"], ["emre01", "Emre"]]) await shoot(`v-case-${k}`, c, { bezel: B[k], strap: 1, w_view: 0, w_style: 1, w_lighting: 0 });
for (const [st, l, c] of [[1, 0, "Miyazaki · Dramatic"], [0, 0, "Engineer · Dramatic"], [1, 1, "Miyazaki · Flat"], [0, 1, "Engineer · Flat"]]) await shoot(`v-style-${st}${l}`, c, { bezel: 1, strap: 1, w_view: 0, w_style: st, w_lighting: l });
for (const [st, c] of [[1, "leather"], [3, "NATO"], [2, "bracelet"], [4, "links"]]) await shoot(`v-strap-${c.toLowerCase()}`, c, { bezel: 1, strap: st, w_view: 1, w_style: 1, w_lighting: 0, out_watch_px: 1200 });
// the straps on the page: one square crop each, the same size and place, on the strap under the case (Okay, 26 Oct 2026:
// "zoom into crops on straps, all same square crops. Click to lightbox the full images"); the whole watch stays for the lightbox.
// A strap on its own (leather, NATO) is drawn smaller in its whole-watch picture than a bracelet: its square is cut tighter, so each strap fills its square alike
for (const c of ["leather", "nato", "bracelet", "links"]) execFileSync("python3", ["-c", `from PIL import Image
im=Image.open("${OUT}v-strap-${c}.webp"); w,h=im.size; s=round(h*(0.16 if w < h/2 else 0.3)); x=round(w/2-s/2); y=round(h*0.7)
im.crop((x,y,x+s,y+s)).resize((224,224),Image.LANCZOS).save("${OUT}v-strap-${c}-crop.webp",quality=86,method=6)`]);
await browser.close();
fs.mkdirSync("/tmp/claude-0/help", { recursive: true }); fs.writeFileSync("/tmp/claude-0/help/variants.json", JSON.stringify({ pictures: [...pictures, ...from_app].map(({ file, caption }) => ({ file, caption })), shots }, null, 1));
console.log(pictures.length, "dial pictures ·", from_app.length, "from the app ·", shots.length, "watch pictures");
