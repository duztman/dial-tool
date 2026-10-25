// shoot2.cjs — the help page's second set of pictures: the popups, the controller, the iPad, from the current app (built web/dial-tool.html).
//   cd web && node ../guide/help/shoot2.cjs   → guide/help/img/*.png and .webp, and the numbers' places (% of each crop) printed as JSON
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

async function shoot(page, name, sels) {
  const b = await union(page, sels);
  if (!b) { console.log("SKIP", name, "nothing visible for", sels.join(", ")); return null; }
  const clip = await padded(page, b);
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

  // ── the desk: 1440 × 900 ──
  const page = await open(browser, { viewport: { width: 1440, height: 900 } });
  const tab = async (name) => { await page.click(`button[data-tab="${name}"]`); await frame(page); };
  const away = async () => { await page.evaluate(() => { const t = window.dial_tool; t.pop_close && t.pop_close(); t.value_pop_close && t.value_pop_close(); t.guides_open && t.guides_open(false); }); await page.mouse.move(700, 880); await frame(page); };
  await page.mouse.move(700, 880);

  // 1 · a row's controller: Diameter's name pressed, on the Dial tab
  await tab("Dial");
  await page.click('label[for="global-dial-d-Diameter"]'); await page.waitForTimeout(300);
  await shoot(page, "controller-desk", ["#value-pop", ".panel .pane.has:has(#global-dial-d-Diameter)"]);
  await away();

  // 4 · the Shadows pane
  await page.click("#shadows-more"); await page.waitForTimeout(300); await page.mouse.move(700, 880);
  { const clip = await shoot(page, "shadows", ["#shadow-list"]);
    if (clip) await places(page, "shadows", clip, [["the sun picture", ["#shadows-sun"]], ["Angle ° · Height ° · Strength %", ["#shadow-list .three"]], ["the parts' heights", ["#shadow-list .shadecol"]], ["the parts, exploded", ["#shadows-stack"]], ["the foot: Shadows · Soft edges · Bevels % · Reset", ["#shadow-list .shadefoot"]]]); }
  await page.click("#shadows-more"); await away();

  // 5 · the Guides list, with one added line so the Added group shows
  await page.click("#guides-more"); await page.waitForTimeout(200);
  await page.click("#guide-add-line"); await page.waitForTimeout(200); await page.mouse.move(700, 880);
  { const clip = await shoot(page, "guides", ["#guide-list"]);
    if (clip) {
      const heads = await page.$$eval("#guide-list .guidehead", (h) => h.map((e, i) => [i, e.querySelector(".name").textContent, !!(e.checkVisibility && e.checkVisibility())]));
      const groups = heads.filter((h) => h[2] && h[1] !== "Add").map((h) => [h[1] + " (group)", [`#guide-list .guidehead:nth-of-type(n) >> nth=${h[0]}`]]);
      // nth selectors don't work in querySelectorAll; mark the heads instead
      await page.evaluate(() => document.querySelectorAll("#guide-list .guidehead").forEach((e, i) => e.setAttribute("data-help", "h" + i)));
      await page.evaluate(() => { const l = document.querySelector("#guide-list .guidekind"); l.setAttribute("data-help", "line"); });
      await places(page, "guides", clip, [
        ...heads.filter((h) => h[2] && h[1] !== "Add").map((h) => [h[1], [`#guide-list [data-help="h${h[0]}"] .name`]]),
        ["a line's colour dot + chevron", ['#guide-list [data-help="line"] .gdot', '#guide-list [data-help="line"] .gchev']],
        ["Add: Line · Crosshair · Circle", ["#guide-list .guidesettings .pillswitch.free"]],
        ["Thickness", ["#guide-list .guidelast label", "#guide-list .gthick"]],
        ["Reset All", ["#guides-reset"]],
      ]);
      void groups;
    } }
  await page.evaluate(() => { const t = window.dial_tool; t.S.gd_more = []; t.sync_rows(); t.render(); });      // the added line away again
  await page.click("#guides-more"); await away();

  // 7 · the colour pop-out, from the plate's swatch (Colours pane, Dial tab)
  await page.click("#global-c-plate-Plate"); await page.waitForTimeout(300); await page.mouse.move(700, 880);
  await shoot(page, "colour", ["#colour-pop"]);
  await away();

  // 9 · Rings tab: the ring list and the chosen ring's drawer (the pinned pane)
  await tab("Rings");
  await page.evaluate(() => window.dial_tool.select_ring(0)); await frame(page);
  await shoot(page, "ringlist", [".pinned"]);

  // 6 · the font sheet from the numerals ring's font box
  await page.click("#font-current"); await page.waitForTimeout(800); await page.mouse.move(1300, 880);
  await page.evaluate(() => { const top = document.querySelector("#font-picker .fontlist").getBoundingClientRect().top, r = [...document.querySelectorAll("#font-picker .fontlist .fontrow")].find((e) => e.getBoundingClientRect().top >= top - 1); if (r) r.setAttribute("data-help", "first"); });      // the first line in view: the list scrolls to the ring's font
  { const clip = await shoot(page, "fonts", ["#font-picker"]);
    if (clip) await places(page, "fonts", clip, [["Light · Dark", ["#font-ground-light", "#font-ground-dark"]], ["search (Find a font)", ["#font-find"]], ["the six filters", [".filterpill"]], ["Dial Tool’s fonts · Installed", ["#font-picker .sheettabs"]], ["a font's line", ['#font-picker .fontrow[data-help="first"]']], ["the Legend", ["#font-legend-open"]]]); }
  console.log("font tabs shown:", await page.evaluate(() => { const e = document.querySelector("#font-picker .sheettabs"); return !!e && !e.hidden; }));
  await page.keyboard.press("Escape"); await frame(page);
  if (await page.$eval("#font-picker", (d) => d.open)) await page.evaluate(() => document.querySelector("#font-picker").close());

  // 10 · a markers ring chosen: the Positions pane's picture
  await page.evaluate(() => { const t = window.dial_tool, i = t.S.rings.findIndex((r) => r.kind === 1); t.select_ring(i); }); await frame(page);
  await page.evaluate(() => document.querySelector(".pane.positions").scrollIntoView({ block: "center" })); await frame(page);
  await shoot(page, "positions", [".pane.positions"]);

  // 11 · the bar's right end
  await shoot(page, "zoom", [".zooms"]);

  // 8 · show mode: the Backdrop popup
  await page.evaluate(() => window.dial_tool.show_mode(true, true)); await page.waitForTimeout(1500);
  await page.evaluate(() => window.dial_tool.ground_open(true)); await page.waitForTimeout(300); await page.mouse.move(700, 880);
  await shoot(page, "backdrop-show", ["#ground-pop"]);
  await page.evaluate(() => window.dial_tool.ground_open(false));

  // 12 · show mode, Light tab: the Sun pane
  await page.click('button[data-tab="Light"]'); await page.waitForTimeout(400);
  await page.evaluate(() => { const p = [...document.querySelectorAll(".panel .pane")].find((e) => e.offsetParent && (e.querySelector("h2") || {}).textContent === "Sun"); if (p) { p.setAttribute("data-help", "sun"); p.scrollIntoView({ block: "center" }); } }); await frame(page);
  await shoot(page, "show-light", ['.pane[data-help="sun"]']);
  await page.close();

  // ── the iPad on its side: 1180 × 820, a finger ──
  const pad = await open(browser, { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true });
  await frame(pad);
  await pad.screenshot({ path: path.join(OUT, "ipad.png") }); made.push(["ipad", 2360, 1640]);
  await pad.tap('label[for="global-dial-d-Diameter"]'); await pad.waitForTimeout(400);
  await shoot(pad, "controller-ipad", ["#value-pop", ".panel .pane.has:has(#global-dial-d-Diameter)"]);
  await browser.close();

  console.log("MADE", JSON.stringify(made));
  console.log("NUMBERS", JSON.stringify(numbers, null, 1));
  // WebP the way webp.py does (quality 82, method 6), at the shot's own 2× width, the iPad's whole window at 1440 like screen.webp; KEEP=1 keeps the PNGs
  const py = `
import sys
from pathlib import Path
from PIL import Image
here = Path(sys.argv[1]); keep = sys.argv[2] == "1"
for name in sys.argv[3:]:
    p = here / f"{name}.png"
    if not p.exists(): continue
    im = Image.open(p).convert("RGB")
    w = 1440 if name == "ipad" else im.width
    if w != im.width: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(here / f"{name}.webp", quality=82, method=6)
    if not keep: p.unlink()
    print(name, im.size, (here / f"{name}.webp").stat().st_size // 1024, "KB")
`;
  console.log(execFileSync("python3", ["-c", py, OUT, process.env.KEEP === "1" ? "1" : "0", ...made.map((m) => m[0])]).toString());
})();
