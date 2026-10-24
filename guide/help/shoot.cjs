// shoot.cjs — the help page's pictures, from the current app (built web/dial-tool.html).
//   cd web && node build.mjs && node ../guide/help/shoot.cjs   → guide/help/img/*.png, then webp.py
// Pictures of the tool for the page (PLAN.md's table), made on demand like the guide's: nothing here is an archive screenshot (R36).
const { chromium } = require("playwright");
const grey = require("./grey.cjs");      // the dial in greys (grey.cjs)
const path = require("path");
const OUT = path.join(__dirname, "img");
const WEB = path.join(__dirname, "../../web");

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
  const page = await context.newPage();
  await page.goto("file://" + path.join(WEB, "dial-tool.html"));
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await grey(page);
  const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const tab = async (name) => { await page.click(`button[data-tab="${name}"]`); await frame(); };
  const box = (q) => page.$eval(q, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  const pad = (b, p) => ({ x: b.x - p, y: b.y - p, width: b.width + 2 * p, height: b.height + 2 * p });
  await page.mouse.move(230, 700); await frame();      // off the dial: no hover label

  // 1 · the screen: the whole window at the first dial; the page numbers its parts over it
  await page.screenshot({ path: path.join(OUT, "screen.png") });
  const parts = await page.evaluate(() => {
    const at = (q) => { const r = document.querySelector(q).getBoundingClientRect(); return [r.x / innerWidth, r.y / innerHeight, r.width / innerWidth, r.height / innerHeight].map((v) => +(v * 100).toFixed(1)); };
    return { title: at(".mast"), tabs: at(".tabs"), preview: at(".rays") , topleft: at(".undos"), topright: at(".corner"), bottomleft: at(".backdrops"), bottomright: at(".eyes"), bar: at(".bar") };
  });
  console.log("parts (% of the window: x y w h)", JSON.stringify(parts));

  // 5 · the hand shapes: the app's own row of thumbs
  await tab("Hands");
  await page.screenshot({ path: path.join(OUT, "hands.png"), clip: pad(await box(".thumbs"), 4) });

  // 6 · the window kinds: date, day, am · pm, moon phase at 3, 6, 9, 12; the dial alone
  await page.evaluate(() => {
    const t = window.dial_tool;
    [[1, 0], [2, 1], [3, 2], [0, 3]].forEach(([card, kind]) => { t.S.ui_window = card; t.set_value("window", "on", true); t.set_value("window", "kind", kind); });
  });
  await frame();
  const kinds = await page.evaluate(() => window.dial_tool.S.windows.length + 1);
  console.log("windows:", kinds);
  await page.keyboard.press("e"); await frame();
  await page.screenshot({ path: path.join(OUT, "windows.png"), clip: { x: 360, y: 59, width: 720, height: 720 } });
  await browser.close();
})();
