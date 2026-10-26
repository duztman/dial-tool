// shoot4.cjs — the help page's pictures added on 27 Oct 2026 (Okay's marked-up page), from the current app (built web/dial-tool.html):
//   the Dial pane plain (the controller is the iPad's: "show main edit here, note this controller elsewhere"), the ring list
//   and the Positions pane with the places of the parts the page numbers, the colour pop-out with its On this dial row placed
//   ("Highlight and explain in the caption"), and the Show Case's light at work: the same view of the watch, cropped to what
//   Sun, Flare and Glass reflection change ("Both screenshots on the app, same view but different crops to emphasise the
//   effect of controls").
//   cd web && node ../guide/help/shoot4.cjs   → guide/help/img/<name>.webp at 2× and <name>-full.webp at 4× (the lightbox's),
//   and the places (% of each picture: x y w h) printed as JSON, for the numbers and red rings the page lays over them.
const { chromium } = require("playwright");
const grey = require("./grey.cjs");
const path = require("path"), fs = require("fs"), { execFileSync } = require("child_process");
const OUT = path.join(__dirname, "img"), WEB = path.join(__dirname, "../../web");
const PAD = 8, DSF = 4, places = {};

// a shot at 4×, kept as <name>-full.webp, and halved for the page as <name>.webp
const keep = (name) => {
  const png = path.join(OUT, name + ".png");
  execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}").convert("RGB");im.save("${path.join(OUT, name)}-full.webp",quality=88,method=6);im.resize((round(im.width/2),round(im.height/2)),Image.LANCZOS).save("${path.join(OUT, name)}.webp",quality=86,method=6)`]);
  fs.unlinkSync(png);
};
const frame = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const box = (page, q) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, q);
const pct = (clip, b) => b && [(b.x - clip.x) / clip.width, (b.y - clip.y) / clip.height, b.width / clip.width, b.height / clip.height].map((v) => +(v * 100).toFixed(1));

async function shoot(page, name, sel, parts = {}) {
  const b = await box(page, sel);
  const clip = { x: b.x - PAD, y: b.y - PAD, width: b.width + 2 * PAD, height: b.height + 2 * PAD };
  await page.screenshot({ path: path.join(OUT, name + ".png"), clip }); keep(name);
  places[name] = {};
  for (const [k, q] of Object.entries(parts)) places[name][k] = pct(clip, await box(page, q));
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF, reducedMotion: "reduce" });
  await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
  const page = await context.newPage();
  await page.addInitScript(() => { try { if (!localStorage.getItem("dial-tool-folds")) localStorage.setItem("dial-tool-folds", '{"*":false}'); } catch (e) {} });      // every pane open, as the window test does (#270)
  await page.goto("file://" + path.join(WEB, "dial-tool.html"));
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await grey(page);
  const tab = async (name) => { await page.click(`button[data-tab="${name}"]`); await frame(page); };
  const away = async () => { await page.mouse.move(700, 880); await frame(page); };
  await away();

  // the Dial pane as it stands, no controller over it
  await tab("Dial");
  await shoot(page, "dial-pane", ".panel .pane.has:has(#global-dial-d-Diameter)");

  // the colour pop-out from the plate's swatch: where its On this dial row is
  await page.click("#global-c-plate-Plate"); await page.waitForTimeout(300); await away();
  await shoot(page, "colour", "#colour-pop", { used: "#colour-pop .chiprow:has(#pop-used)" });
  await page.keyboard.press("Escape"); await away();

  // the ring list, Numerals chosen: the row's two numbers and the drawer's two buttons under them
  await tab("Rings");
  await page.evaluate(() => window.dial_tool.select_ring(0)); await frame(page);
  await shoot(page, "ringlist", ".pinned", { size: "#ring-size-fig", radius: "#ring-r-fig", size_button: "#ring-size", radius_button: "#ring-r" });

  // the Positions pane on the markers ring: each row's name, the picture
  await page.evaluate(() => { const t = window.dial_tool, i = t.S.rings.findIndex((r) => r.kind === 1); t.select_ring(i); }); await frame(page);
  await page.evaluate(() => document.querySelector(".pane.positions").scrollIntoView({ block: "center" })); await frame(page);
  await shoot(page, "positions", ".pane.positions", { picture: "#ring-positions", count: 'label[for="ring-count-Count-menu"]', every: 'label[for="ring-every-Every-menu"]', offset: 'label[for="ring-offset-Offset"]',
    skip: 'label[for="ring-invert-Skip-those"]', start: 'label[for="ring-start-Start"]', span: 'label[for="ring-span-Span"]' });

  // the Show Case: one view of the watch, its light changed one thing at a time, cropped where that thing shows
  await page.evaluate(() => window.dial_tool.show_mode(true, true)); await page.waitForTimeout(1500);
  await tab("Light"); await page.mouse.move(5, 5);
  const set = async (o) => { await page.evaluate((o) => { const t = window.dial_tool; for (const [k, v] of Object.entries(o)) t.set_value("global", k, v); t.render(); }, o); await page.waitForTimeout(600); };
  const crop = async (name, clip) => { await page.screenshot({ path: path.join(OUT, name + ".png"), clip }); keep(name); };
  // Sun: shadows on at the starting sun (176°, 53°), Strength 60 so the shadows read in a small crop; the case's shadow
  // off its side, the hands' shadows on the dial
  await set({ sh_on: true, sh_dark: 60 });
  await crop("light-sun-case", { x: 650, y: 160, width: 250, height: 320 });
  await crop("light-sun-hands", { x: 410, y: 250, width: 250, height: 320 });
  // Flare: it needs Blurs (Soft shadows) as well as its tick; the light along the bezel's lower edge and on the strap
  await set({ sh_dark: 25, sh_blur: true, w_flare_on: true });
  await crop("light-flare-fx", { x: 330, y: 560, width: 420, height: 240 });
  await set({ sh_blur: false });
  // Glass reflection: the shine across the glass, low on the dial
  await crop("light-glass-fx", { x: 330, y: 460, width: 420, height: 240 });
  await set({ sh_on: false });

  await browser.close();
  console.log(JSON.stringify(places, null, 1));
})();
