import { chromium } from "playwright"; import fs from "fs";
const KIND = { d: ["Dress", "Calatrava 5196"], f: ["Field", "1939 military cushion"], v: ["Diver", "Seiko SPB143"] };
const SIZE = { d: 37, f: 40, v: 40.5 };
const LIGHT = { 180: "the left", 0: "the right", 270: "the top", 195: "the low left", 345: "the low right" };
const runs = [
  ["d1", "brown leather", ["Okay blue"], "gold", 180, 45, 1], ["d2", "NATO, regimental stripes", ["Okay Cinzel", "navy, cream, gold"], "steel", 0, 30, 1], ["d3", "tan leather", ["Okay Cinzel"], "bronze", 270, 70, 1], ["d4", "black leather", ["Okay blue", "cream, black, red"], "gold", 195, 20, 0.84], ["d5", "NATO, olive", ["Okay blue", "burgundy, cream, gold"], "steel", 345, 15, 1],
  ["f1", "NATO, grey", ["Okay military"], "aluminium", 195, 20, 0.9], ["f2", "brown leather", ["Okay military", "olive, cream, orange"], "bronze", 180, 45, 1], ["f3", "NATO, bond stripes", ["Public Sans"], "steel", 270, 70, 1], ["f4", "black leather", ["Public Sans", "cream, black, red"], "aluminium", 0, 30, 1.1], ["f5", "NATO, khaki stripes", ["Okay military", "blue, cream, amber"], "bronze", 345, 15, 1, "big knit"],
  ["v1", "vaulted bracelet", ["Quiet diver", "black, orange"], "steel", 0, 30, 1], ["v2", "vaulted bracelet", ["Quiet diver", "navy, gold"], "gold", 180, 45, 1], ["v3", "vaulted bracelet", ["Quiet diver", "green, cream, orange"], "steel", 270, 70, 1], ["v4", "tan leather", ["Quiet diver", "brown, sand"], "bronze", 195, 20, 1], ["v5", "NATO, black and grey stripes", ["Quiet diver", "cream, black, orange"], "steel", 345, 15, 1],
];
const glyph = (L, h) => { const r = 8.5, d = r * Math.cos(h * Math.PI / 180), x = 12 + Math.cos(L * Math.PI / 180) * d, y = 12 + Math.sin(L * Math.PI / 180) * d;
  return `<svg viewBox="0 0 24 24" width="6.5mm" height="6.5mm"><circle cx="12" cy="12" r="${r}" fill="none" stroke="#000" stroke-width="1.6"/><path d="M12 12L${x} ${y}" stroke="#000" stroke-width="1.6" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="3" fill="#000"/></svg>`; };
const info = (r) => { const [id, strap, dial, metal, L, h, k, extra] = r, [kind, model] = KIND[id[0]];
  return `<b>${kind}</b><span>${model}</span><span>${+(SIZE[id[0]] * k).toFixed(1)} mm ${metal}</span><span>${strap}${extra ? `, ${extra}` : ""}</span><span>${dial[0]}${dial[1] ? `: ${dial[1]}` : ""}</span>`; };
const lightBox = (L, h) => `<div class="lb">${glyph(L, h)}<span>${h}°</span></div>`;
const M = 7, G = 7, S = 210 - 2 * M, RW = 297 - 2 * M - S - G, Q = (S - G) / 2;
let n = 1;
const main = [];
for (const [pre, style] of [["L", "Engineer"], ["B", "Miyazaki"]])
  for (const r of runs) main.push(`<section class="page" id="p${n + 1}"><img class="sq" src="file:///home/claude/cases/png/${pre}-${r[0]}-detail.png"><div class="col"><img class="full" src="file:///home/claude/cases/png/${pre}-${r[0]}-full.png"><div class="top"><div class="txt">${info(r)}<em>${style}</em></div>${lightBox(r[4], r[5])}</div><div class="no">${++n}</div></div></section>`);
let n2 = 0; const cmp = [], byId = Object.fromEntries(runs.map((r) => [r[0], r]));
const cap = (r, style) => { const [id, strap, dial, metal, L, h, k, extra] = r, [kind, model] = KIND[id[0]];
  return `<figcaption><b>${kind}, ${model}</b><span>${+(SIZE[id[0]] * k).toFixed(1)} mm ${metal}, ${strap}</span><span>${dial[0]}${dial[1] ? `: ${dial[1]}` : ""}</span><span>${style}, light ${h}°</span></figcaption>`; };
for (const group of [["d1", "d2", "d3", "d4"], ["f1", "f2", "f3", "f4"], ["v1", "v2", "v3", "v4"], ["d5", "f5", "v5"]]) {
  const rs = group.map((id) => byId[id]);
  cmp.push(`<section class="page cmp4"><div class="g8">${[["L", "Engineer"], ["B", "Miyazaki"]].map(([pre, style]) => rs.map((r) => `<figure><img src="file:///home/claude/cases/png/${pre}-${r[0]}-cmp.png">${cap(r, style)}</figure>`).join("") + (rs.length < 4 ? "<figure></figure>" : "")).join("")}</div><div class="no2">${++n2}</div></section>`);
}
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 297mm 210mm; margin: 0; }
body { margin: 0; font-family: Inter, sans-serif; font-feature-settings: 'tnum' 0; color: #000; }
.page { width: 297mm; height: 210mm; box-sizing: border-box; padding: ${M}mm; display: flex; gap: ${G}mm; background: #ece9e2; page-break-after: always; }
.sq { width: ${S}mm; height: ${S}mm; display: block; }
.col { position: relative; width: ${RW}mm; height: ${S}mm; background: #b9b3a6; }
.col.plain { background: #e2ded5; }
.full { width: 100%; height: 100%; display: block; }
.top { position: absolute; left: 3mm; right: 3mm; top: 3mm; display: flex; justify-content: space-between; align-items: flex-start; gap: 3mm; }
.txt { font-size: 6.8pt; line-height: 1.12; max-width: 25mm; color: #000; }
.txt b { display: block; font-weight: 600; }
.txt span, .txt em { display: block; font-style: normal; }
.txt small { display: block; font-size: 6.8pt; margin-bottom: .8mm; }
.lb { display: flex; flex-direction: column; align-items: center; gap: .6mm; font-size: 6.8pt; line-height: 1; color: #000; }
.no { position: absolute; right: 3mm; bottom: 3mm; font-size: 6.8pt; color: #000; }
.cmp4 { position: relative; align-items: center; }
.g8 { display: grid; grid-template-columns: repeat(4, ${(297 - 2 * M - 3 * G) / 4}mm); column-gap: ${G}mm; row-gap: ${G}mm; }
.g8 figure { margin: 0; } .g8 img { width: 100%; aspect-ratio: 1; display: block; }
figcaption { font-size: 6.8pt; line-height: 1.12; color: #000; margin-top: 2mm; } figcaption b, figcaption span { display: block; } figcaption b { font-weight: 600; }
.no2 { position: absolute; right: ${M}mm; bottom: ${M - 4}mm; font-size: 6.8pt; }
.grid { width: ${S}mm; height: ${S}mm; display: grid; grid-template-columns: ${Q}mm ${Q}mm; grid-template-rows: ${Q}mm ${Q}mm; gap: ${G}mm; }
.grid img { width: 100%; height: 100%; display: block; }
.cmp { position: absolute; left: 3mm; right: 3mm; top: 3mm; bottom: 3mm; display: grid; grid-template-rows: 1fr 1fr; gap: ${G}mm; }
.cover { flex-direction: column; justify-content: center; padding: 0 30mm; }
.cover h1 { font-size: 26pt; font-weight: 600; margin: 0 0 6mm; color: #000; } .cover p { font-size: 10.5pt; line-height: 1.55; max-width: 190mm; margin: 0 0 3mm; color: #000; }
</style></head><body>
__COVER__
__BODY__
</body></html>`;
// the title page (19:04): the render runs the whole page, the watch a fifth of the square left of where it was; Dial
// Tool and Okay's mark up top; the title on one line; the two styles explained; the contents as links, rows of one height
const logo = `<svg viewBox="0 0 16 16" width="4.2mm" height="4.2mm" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="7" stroke-width="1.375"/><path d="M1.62 10.88L10.88 1.62M6.5 6H14.71M6.5 6V14.84M10 6V10H6.5M10 10L12.95 12.95" stroke-width="1"/></svg>`;
const row = (r, p) => { const [id, strap, dial, metal, L, h, k] = r, [kind] = KIND[id[0]];
  return `<a class="r" href="#p${p}"><span>${String(p).padStart(2, "0")}</span><span>${kind}, ${+(SIZE[id[0]] * k).toFixed(1)} mm ${metal}</span><span>${strap.replace("NATO, ", "NATO ").replace(" stripes", "").replace("black and grey", "black, grey")}</span><span>${dial[0]}${dial[1] ? ", " + dial[1].split(",")[0] : ""}</span></a>`; };
const cover = () => `<section class="page tp"><img src="file:///home/claude/cases/png/cover-page.png">
<div class="brand">${logo}<span>Dial Tool</span><span class="by">by Okay K.</span></div>
<h1>Cases and straps rendering engine</h1>
<div class="intro"><p><b>Introducing</b> Two new ways for Dial Tool to render a whole watch. Both are parametric and AI-assisted, so new ones will come quicker: the first parts of a builder for watches made of components.</p><p><b>Miyazaki</b> No lines: flat shapes with a light and a dark crescent cut by the light, deeper colours, harsher shadows, a round flare, one outline round the metal that fades away from the light.</p><p><b>Engineer</b> A technical drawing: every part outlined in dark ink, each facet in one of three tones by the light, a hard block shadow.</p></div>
<div class="toc"><div class="h">Engineer</div>${runs.map((r, i) => row(r, i + 2)).join("")}<div class="h">Miyazaki</div>${runs.map((r, i) => row(r, i + 17)).join("")}</div></section>`;
const css = `.tp { padding: 0; display: block; position: relative; background: #100f0e; color: #fff; } .brand svg { align-self: center; } .by { font-weight: 300; }
.tp > img { position: absolute; inset: 0; width: 297mm; height: 210mm; display: block; }
.brand { position: absolute; left: 9mm; top: 8mm; display: flex; align-items: baseline; gap: 1.8mm; font-size: 8pt; font-weight: 400; letter-spacing: -0.01em; }
.tp h1 { position: absolute; left: 9mm; top: 15mm; margin: 0; font-weight: 300; font-size: 30pt; letter-spacing: -0.045em; line-height: 1; white-space: nowrap; }
.intro { position: absolute; left: 9mm; top: 30mm; width: 98mm; display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 4mm; font-size: 6.6pt; line-height: 1.25; font-weight: 300; }
.intro p { margin: 0; } .intro b { display: block; font-weight: 600; margin-bottom: 0.6mm; }
.toc { position: absolute; left: 9mm; top: 64mm; width: 98mm; font-size: 5.6pt; font-weight: 400; }
.toc .h, .toc .r { display: grid; grid-template-columns: 5mm 31mm 28mm 34mm; height: 4.1mm; align-items: center; border-top: 1px solid rgba(255,255,255,0.35); color: #fff; text-decoration: none; white-space: nowrap; overflow: hidden; }
.toc .h { display: flex; font-weight: 600; } .toc .r span:nth-child(-n+2) { font-weight: 600; } .toc .r span { overflow: hidden; text-overflow: ellipsis; padding-right: 1mm; }
.toc .r:last-child { border-bottom: 1px solid rgba(255,255,255,0.35); }`;
const b = await chromium.launch();
for (const [name, body, out] of [["watches", cover() + main.join(""), "cases-watches.pdf"], ["dials", cmp.join(""), "cases-dial-comparisons.pdf"]]) {
  const page = html.replace("</style>", css + "</style>").replace("__COVER__", "").replace("__BODY__", body);
  fs.writeFileSync(`/home/claude/cases/book-${name}.html`, page);
  const pg = await b.newPage(); await pg.goto(`file:///home/claude/cases/book-${name}.html`); await pg.waitForTimeout(3000);
  await pg.pdf({ path: "/home/claude/cases/" + out, width: "297mm", height: "210mm", printBackground: true }); await pg.close();
}
await b.close();
