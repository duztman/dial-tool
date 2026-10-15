// target.mjs — makes the reader test's target dial (guide/BRIEF.md): a dial in neither the Gallery nor the guide,
// drawn and exported by the app itself. Writes guide/tests/target/: its link, settings, the colour PNG and PDF,
// the mono mask PNG (what readers' exports are laid over), and the target sheet (the picture plus three measures).
//
//   cd web && node ../guide/tools/target.mjs
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const WEB = process.cwd(), OUT = path.join(WEB, "../guide/tests/target");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, acceptDownloads: true, reducedMotion: "reduce" });
await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: "fonts/" + decodeURIComponent(r.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
const page = await context.newPage();
await page.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("dial-tool-last", "{}"); sessionStorage.setItem("seeded", "1"); } });
await page.goto("file://" + WEB + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

// the target: a green field dial. Numerals at 12 · 6 · 9 (the 3 gives way to the date), bars at the other hours,
// a minute track that skips the bars, sword hands, a red seconds hand. Bundled font only (Barlow SemiBold).
await page.evaluate(() => {
  const t = window.dial_tool, S = t.S;
  const cream = [0.93, 0.9, 0.83, 1], red = [0.78, 0.22, 0.18, 1];
  S.dial_d = 32; S.margin = 2; S.c_plate = [0.12, 0.23, 0.18, 1]; S.t = 10 * 3600 + 10 * 60;
  const [num, mark, tick] = S.rings;
  Object.assign(num, { kind: 2, name: "Numerals", r: 11, count: 4, labels: 6, custom: "12,3,6,9", size: 3.4, mode: 0, family: "Barlow", ps: "Barlow-SemiBold", c: cream });
  Object.assign(mark, { kind: 1, name: "Markers", r: 15.2, len: 2.6, w: 0.7, count: 12, every: 3, offset: 0, invert: true, shape: 0, c: cream });
  Object.assign(tick, { kind: 0, name: "Minute ticks", r: 15.2, len: 1, w: 0.15, count: 60, skip: 1, c: cream });
  Object.assign(S, { da_on: true, da_at: 0, da_r: 11, da_w: 2.6, da_h: 2 });
  Object.assign(S.ha_hour, { shape: 2, len: 8.5, w: 1.2, c: cream });
  Object.assign(S.ha_minute, { shape: 2, len: 13, w: 1, c: cream });
  Object.assign(S.ha_second, { shape: 0, len: 13.5, w: 0.18, tail: 3, c: red });
  S.ha_cap = 1.4; S.c_cap = red;
  t.static_dirty = true; t.show_section(); t.render();
});
await page.evaluate(async () => { const t = window.dial_tool; await t.load_fonts_in_use(); t.static_dirty = true; t.render(); });
await page.waitForTimeout(1500); await frame();
await page.click('button[data-tab="Export"]'); await frame();
const save = async (button, name) => {
  const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: button, exact: true }).click()]);
  await d.saveAs(path.join(OUT, name)); return name;
};
await save("PDF", "target.pdf"); await save("PNG", "target.png");
await page.getByRole("checkbox", { name: "Mono print mask" }).check(); await frame();
await save("PNG", "target-mask.png");
await page.getByRole("checkbox", { name: "Mono print mask" }).uncheck(); await frame();
await page.waitForTimeout(800);
const link = await page.evaluate(() => location.href.split("#")[1] || "");
const settings = await page.evaluate(() => JSON.stringify(window.dial_tool.S));
fs.writeFileSync(path.join(OUT, "link.txt"), "https://duztman.github.io/dial-tool/#" + link + "\n");
fs.writeFileSync(path.join(OUT, "settings.json"), settings);
await page.screenshot({ path: path.join(OUT, "app.png") });
console.log("target written:", fs.readdirSync(OUT).join(" "));
await browser.close();
