// shoot3.cjs — the help page's third set of pictures: the bar, piece by piece, and the popups the first two sets left out (date, steps, Versions, Tiny preview).
//   cd web && node ../guide/help/shoot3.cjs   → guide/help/img/*.webp, and the numbers' places (% of each crop) printed as JSON
// Made on demand like shoot.cjs (R36); every crop measured from the page (R21), 8 px of room round what it holds.
const { chromium } = require("playwright");
const grey = require("./grey.cjs");      // the dial in greys (grey.cjs)
const path = require("path");
const { execFileSync } = require("child_process");
const OUT = path.join(__dirname, "img");
const WEB = path.join(__dirname, "../../web");
const PAD = 8;
const made = [], numbers = {};

const fonts = (context) => context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));

async function open(browser, opts) {
  const context = await browser.newContext({ deviceScaleFactor: 2, reducedMotion: "reduce", ...opts });
  await fonts(context);
  const page = await context.newPage();
  await page.addInitScript(() => { try { if (!localStorage.getItem("dial-tool-folds")) localStorage.setItem("dial-tool-folds", '{"*":false}'); } catch (e) {} });      // every pane open, as the window test does (#270)
  await page.goto("file://" + path.join(WEB, "dial-tool.html"));
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await grey(page);
  return page;
}

const frame = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
// the box round every element the selectors find (visible ones), in window px
const union = (page, sels) => page.evaluate((sels) => {
  const rs = sels.flatMap((q) => [...document.querySelectorAll(q)]).filter((e) => e.checkVisibility ? e.checkVisibility() : e.offsetParent).map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
  if (!rs.length) return null;
  const L = Math.min(...rs.map((r) => r.left)), T = Math.min(...rs.map((r) => r.top)), R = Math.max(...rs.map((r) => r.right)), B = Math.max(...rs.map((r) => r.bottom));
  return { x: L, y: T, width: R - L, height: B - T };
}, sels);
const padded = (page, b) => page.evaluate(([b, p]) => {
  const x = Math.max(0, b.x - p), y = Math.max(0, b.y - p);
  return { x, y, width: Math.min(innerWidth, b.x + b.width + p) - x, height: Math.min(innerHeight, b.y + b.height + p) - y };
}, [b, PAD]);

async function shoot(page, name, sels, inside) {
  const b = await union(page, sels);
  if (!b) { console.log("SKIP", name, "nothing visible for", sels.join(", ")); return null; }
  const clip = await padded(page, b);
  if (inside) { const r = await union(page, [inside]); const y = Math.max(clip.y, r.y), bot = Math.min(clip.y + clip.height, r.y + r.height); clip.y = y; clip.height = bot - y; }
  await page.screenshot({ path: path.join(OUT, name + ".png"), clip });
  made.push([name, Math.round(clip.width * 2), Math.round(clip.height * 2)]);
  return clip;
}

// a number's place, just left of its part at the part's middle height (inside the part's left edge when the crop has no room there); % of the crop
async function places(page, name, clip, parts) {
  const out = [];
  for (const [label, sels] of parts) {
    const b = await union(page, sels);
    if (!b) { out.push([label, null]); continue; }
    let x = b.x - 12; if (x - clip.x < 10) x = b.x + 10;
    const y = b.y + Math.min(b.height / 2, 14);
    out.push([label, +((x - clip.x) / clip.width * 100).toFixed(1), +((y - clip.y) / clip.height * 100).toFixed(1), [b.x - clip.x, b.y - clip.y, b.width, b.height].map((v) => Math.round(v))]);
  }
  numbers[name] = out;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const page = await open(browser, { viewport: { width: 1440, height: 900 } });
  const rest = async () => { await page.mouse.move(700, 450); await frame(page); };
  await page.evaluate(() => { const t = window.dial_tool; t.set_time(10 * 3600 + 8 * 60 + 36); }); await frame(page);
  await rest();

  // 1 · the bar's time half: play, speed, time, AM · PM, date, Now
  { const clip = await shoot(page, "bar-time", [".bar .lead"], ".bar");
    if (clip) await places(page, "bar-time", clip, [["Play", ["#play"]], ["Speed", [".speeds"]], ["Time", [".timewell"]], ["AM · PM", ["#ampm"]], ["Date", ["#date"]], ["Now", ["#now"]]]); }
  // 2 · the timeline and the view squares
  { const clip = await shoot(page, "bar-day", [".bar .ruler", ".steps12"], ".bar");
    if (clip) await places(page, "bar-day", clip, [["the ruler", [".bar .ruler"]], ["the hours", [".steps12"]], ["the needle", [".bar .needle"]]]); }
  // 3 · the speed while it is dragged: its name a pill over the thumb
  await page.evaluate(() => { const t = window.dial_tool; t.set_speed(60); t.speed_name.classList.add("sliding"); }); await frame(page);
  await shoot(page, "bar-speed", [".speeds", ".speeds .rider"], ".bar");
  await page.evaluate(() => { const t = window.dial_tool; t.speed_name.classList.remove("sliding"); t.set_speed(1); }); await frame(page);
  // 4 · the date popup
  await page.click("#date"); await page.waitForTimeout(250); await rest();
  { const clip = await shoot(page, "datepop", ["#date-pop", "#ampm", "#now"]);
    if (clip) await places(page, "datepop", clip, [["the weekday", ["#date-pop-weekday"]], ["Day · Month · Year", ["#date-pop .pop-day", "#date-pop .pop-year"]], ["− +", ["#date-pop .popsteps"]]]); }
  await page.keyboard.press("Escape"); await page.evaluate(() => window.dial_tool.date_pop_open(false)); await rest();

  // 5 · the steps, named: a few changes first
  await page.evaluate(async () => { const t = window.dial_tool, f = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (const [k, v] of [["dial_d", 36], ["dial_hole", 3.2], ["ui_weight", 120], ["dial_d", 38]]) { t.set_value("global", k, v); await f(); t.take_step && t.take_step(); await new Promise((r) => setTimeout(r, 700)); } });
  await page.evaluate(() => window.dial_tool.undo(-1)); await frame(page);
  await page.click("#history-more"); await page.waitForTimeout(250); await rest();
  await shoot(page, "steps", ["#history-list", ".undopair"]);
  await page.click("#history-more"); await rest();

  // 6 · Versions with two saved
  await page.click("#versions"); await page.waitForTimeout(250);
  await page.click("#instance-save"); await page.waitForTimeout(300);
  await page.evaluate(() => window.dial_tool.set_value("global", "dial_d", 40)); await page.waitForTimeout(200);
  await page.click("#instance-save"); await page.waitForTimeout(600); await rest();
  { const clip = await shoot(page, "versions", ["#version-list", "#versions"]);
    if (clip) await places(page, "versions", clip, [["Save this dial", ["#instance-save"]], ["Compare", ["#instance-compare"]], ["Sheet", ["#instance-sheet"]], ["a card", ["#version-list .card"]]]); }
  await page.click("#versions"); await rest();

  // 7 · the Tiny preview, open in its button's place
  await page.click("#tiny-open"); await page.waitForTimeout(500); await page.hover("#tiny"); await page.waitForTimeout(200);
  await shoot(page, "tiny", ["#tiny"]);
  await browser.close();

  console.log("MADE", JSON.stringify(made));
  console.log("NUMBERS", JSON.stringify(numbers, null, 1));
  const py = `
import sys
from pathlib import Path
from PIL import Image
here = Path(sys.argv[1])
for name in sys.argv[2:]:
    p = here / f"{name}.png"
    im = Image.open(p).convert("RGB"); im.save(here / f"{name}.webp", quality=82, method=6); p.unlink()
    print(name, im.size, (here / f"{name}.webp").stat().st_size // 1024, "KB")
`;
  console.log(execFileSync("python3", ["-c", py, OUT, ...made.map((m) => m[0])]).toString());
})();
