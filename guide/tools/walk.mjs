// walk.mjs — the guide's coverage walk (guide/PLAN.md §5): opens the built app, visits every state that changes
// what the panel shows (each tab; each ring kind, mark shape, label set; each hand shape; each window's shows and
// shapes; every pop-out), and writes every label and accessible name it finds, keyed by where it was found.
//
//   cd web && node ../guide/tools/walk.mjs        → guide/inventory/labels.json · labels.md
//
// It sets states through the window's own object (quicker than clicking 200 states); it only READS what a person
// would see or hear (the accessibility tree). The guide's checks of behaviour (PLAN §0) click like a person instead.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const WEB = process.cwd(), OUT = path.join(WEB, "../guide/inventory");
fs.mkdirSync(OUT, { recursive: true });
const started = Date.now();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: "fonts/" + decodeURIComponent(r.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
const page = await context.newPage();
await page.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("dial-tool-last", "{}"); sessionStorage.setItem("seeded", "1"); } });
await page.goto("file://" + WEB + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const run = (body) => page.evaluate(`(() => { const t = window.dial_tool, S = t.S; ${body}; t.show_section(); t.render(); })()`);

const found = new Map();                           // name → { role, where: Set }
const VALUE = /^(#?[0-9A-F]{6}|[-+−]?\d[\d.,:×x %°]*|\d+(\.\d+)? ?(mm|pt|in|lig|dpi|px|×|X)?|beta [\d.]+)$/i;
async function collect(where, scope = "body") {
  await frame();
  const tree = await page.locator(scope).first().ariaSnapshot().catch(() => "");
  for (const line of tree.split("\n")) {
    const m = line.match(/^\s*- (\w+)(?: "((?:[^"\\]|\\.)*)")?(?:[^:]*)?(?::\s*(.*))?$/);
    if (!m) continue;
    const [, role, name, text] = m;
    for (const raw of [name, role === "text" || role === "paragraph" || role === "heading" ? text : null]) {
      const s = (raw || "").replace(/\\"/g, '"').trim();
      if (!s || VALUE.test(s) || s.length > 160) continue;
      if (!found.has(s)) found.set(s, { role, where: new Set() });
      found.get(s).where.add(where);
    }
  }
}

const SECTIONS = ["Dial", "Rings", "Hands", "Date", "Export"];
const states = [];
// ── each tab as it opens ──
for (let i = 0; i < 5; i++) states.push([`${SECTIONS[i]}`, `S.ui_section = ${i}`]);
// ── Rings: each kind on the selected ring, and what each kind's choices open ──
const ring = (body) => `S.ui_section = 1; S.ui_ring = 0; const R = S.rings[0]; ${body}; t.static_dirty = true`;
for (const [k, kind] of ["ticks", "markers", "numerals", "band"].entries()) {
  states.push([`Rings › ${kind}`, ring(`R.kind = ${k}`)]);
  if (k < 2) for (const [s, shape] of ["bar", "wedge", "dot"].entries()) states.push([`Rings › ${kind} › shape ${shape}`, ring(`R.kind = ${k}; R.shape = ${s}; R.knock = 1`)]);
  if (k === 1) for (let tw = 0; tw < 4; tw++) states.push([`Rings › markers › 12 o'clock ${tw}`, ring(`R.kind = 1; R.twelve = ${tw}`)]);
  if (k === 2) for (let l = 0; l < 12; l++) states.push([`Rings › numerals › labels ${l}`, ring(`R.kind = 2; if (${l} < window.dial_tool.G?.LABEL_SETS?.length ?? 12) R.labels = ${l}`)]);
  if (k === 3) states.push([`Rings › band › sectors`, ring(`R.kind = 3; R.count = 12`)]);
}
// ── Hands: each hand, each shape ──
for (let h = 0; h < 3; h++) for (let s = 0; s < 11; s++) states.push([`Hands › hand ${h} › shape ${s}`, `S.ui_section = 2; S.ui_hand = ${h}; const H = [S.ha_hour, S.ha_minute, S.ha_second][${h}]; H.shape = ${s}; H.on = true`]);
// ── Windows: each card, shown, each kind and each shape ──
for (let w = 0; w < 4; w++) for (let k = 0; k < 4; k++) for (let sh = 0; sh < 5; sh++)
  states.push([`Windows › window ${w} › shows ${k} › shape ${sh}`, `S.ui_section = 3; S.ui_window = ${w}; const T = window.dial_tool.G ? null : null; const W = (${w} === 0) ? null : S.windows[${w} - 1];
    if (W) { W.on = true; W.kind = ${k}; W.shape = ${sh}; W.turn = true; } else { S.da_on = true; S.da_kind = ${k}; S.da_shape = ${sh}; S.da_turn = true; S.da_at = 0; } t.static_dirty = true`]);
// ── Export: with live text ──
states.push(["Export › live text", "S.ui_section = 4; S.out_live_text = true"]);

let n = 0;
for (const [where, body] of states) {
  await run(body).catch((e) => console.log("state failed:", where, e.message.split("\n")[0]));
  await collect(where); n++;
}
// ── pop-outs, opened as a person opens them ──
const POPS = [
  ["Guides list", "#guides-more"], ["Shadows list", "#shadows-more"], ["Bio", "#logo"],
];
await run("S.ui_section = 0");
for (const [where, sel] of POPS) {
  const el = page.locator(sel).first();
  if (await el.count()) { await el.click().catch(() => {}); await collect(where); await page.keyboard.press("Escape"); n++; }
  else console.log("pop-out not found:", where, sel);
}
// colour pop-out: the plate's pill
await page.locator("#global-c-plate-Plate").first().click().catch(() => console.log("plate pill not found"));
await collect("Colour pop-out"); await page.keyboard.press("Escape"); n++;
// add-ring menu, font sheet
await run("S.ui_section = 1; S.ui_ring = 0; S.rings[0].kind = 2; t.static_dirty = true");
await page.getByRole("button", { name: /add/i }).first().click().catch(() => console.log("add ring not found"));
await collect("Rings › add menu"); await page.keyboard.press("Escape"); n++;
await page.getByRole("button", { name: /Change/ }).first().click().catch(() => console.log("Change… not found"));
await collect("Font sheet"); await page.keyboard.press("Escape"); n++;
// a phone: the same app in its narrow layout
await page.setViewportSize({ width: 390, height: 844 });
await run("S.ui_section = 0"); await collect("Phone › Dial"); n++;

const rows = [...found].map(([name, v]) => ({ name, role: v.role, where: [...v.where] })).sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(path.join(OUT, "labels.json"), JSON.stringify(rows, null, 1));
const md = ["# Labels and names found by the coverage walk", "", `*${new Date().toISOString().slice(0, 16)} · ${n} states · ${rows.length} names · ${((Date.now() - started) / 1000).toFixed(0)} s. Values (hex, numbers, times) filtered out.*`, "",
  "| Name | Role | First seen at | States |", "|---|---|---|---|",
  ...rows.map((r) => `| ${r.name.replace(/\|/g, "\\|")} | ${r.role} | ${r.where[0]} | ${r.where.length} |`)];
fs.writeFileSync(path.join(OUT, "labels.md"), md.join("\n") + "\n");
console.log(`${n} states, ${rows.length} names, ${((Date.now() - started) / 1000).toFixed(0)} s`);
await browser.close();
