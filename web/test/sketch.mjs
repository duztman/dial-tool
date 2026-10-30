// sketch.mjs — a sketch round on the real page (Okay, 31 Oct 2026: "pixel accurate fast drawings" he marks up).
// Shows one part of the window twice, as it is and with a tune, one over the other, a pixel ruler along each.
// Because it is the real page, every button, slider, switch, rule and token is the app's own: nothing is imitated.
//
//   node test/sketch.mjs <name>          reads test/sketches/<name>.js, writes test/sketches/out/<name>.png
//
// The tune file (kept in git, so the next agent has it) is plain JavaScript run in the page, with three things set:
//   part   = ".bar .lead"          the part to show (a selector)
//   tab    = "Dial"                the tab to open first (optional)
//   below  = 300                   optional: px more under the part, for a popup hanging from it
//   css    = `...`                 rules laid over the stylesheet: use the tokens (docs/sectors.md, docs/css-map.md)
//   states = ["closed", "open"]    optional: one tuned shot per state; build receives the state's name
//   build  = async (state) => {…}  optional: anything CSS can't do (a new row from the app's own builders, a changed word);
//                                  it may await ink(".selector") — the part's ink rectangle, read off the screen — to
//                                  centre or space things on what is drawn, not on their boxes; it may return
//                                  { hover: ".selector" } to be shot with the pointer over that part
// When Okay says build, the tune's values go into src/ and the tune file is deleted.
//
// Rulers: 1 tick = 1 px of the window (the shot is 2×, so a tick is 2 px of the picture), longer every 5, longest every
// 10; numbered every 50 across, every 10 down. His marks read against them, whatever size the picture ends at on his iPad.
import { chromium } from "playwright";
import fs from "fs";
const name = process.argv[2];
if (!name) { console.log("usage: node test/sketch.mjs <name>   (test/sketches/<name>.js)"); process.exit(1); }
const tune = fs.readFileSync(`test/sketches/${name}.js`, "utf8");
const W = +(process.env.CROP_W || 1440), H = +(process.env.CROP_H || 900), M = 12;      // the window; the margin round the part
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });

async function shot(tuned, state = "") {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("page error:", e.message));
  page.on("console", (m) => { if (m.text().startsWith("measured")) console.log(m.text()); });      // what a tune reports of itself
  await page.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: "fonts/" + decodeURIComponent(r.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
  await page.addInitScript(() => { setTimeout(() => { localStorage.setItem("dial-tool-last", "{}"); localStorage.setItem("dial-tool-folds", '{"*":false}'); }, 0); });
  await page.goto("file://" + process.cwd() + "/dial-tool.html");
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await page.evaluate(() => window.dial_tool.set_time(10 * 3600 + 9 * 60 + 36));      // the watchmaker's 10:09:36, still
  // ink(selector): the rectangle a part's ink covers, in window pixels, read from the screen itself (R21: measured,
  // not estimated). Its border and background are not ink: only pixels far from the part's own commonest colour.
  await page.exposeFunction("ink", async (sel) => {
    const r = await page.evaluate((q) => { const e = document.querySelector(q), b = e.getBoundingClientRect(); const i = e.clientLeft || e.clientTop ? 2 : 0; return { x: b.x + e.clientLeft + i, y: b.y + e.clientTop + i, width: (e.clientWidth || b.width) - 2 * i, height: (e.clientHeight || b.height) - 2 * i }; }, sel);      // 2 px in from a border: its edge is not ink
    const png = (await page.screenshot({ clip: r })).toString("base64");
    return page.evaluate(async ([data, r]) => {
      const img = new Image(); img.src = "data:image/png;base64," + data; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
      const counts = new Map(); for (let i = 0; i < d.length; i += 4) { const k = d[i] << 16 | d[i + 1] << 8 | d[i + 2]; counts.set(k, (counts.get(k) || 0) + 1); }
      const ground = [...counts].sort((a, b) => b[1] - a[1])[0][0], gr = ground >> 16, gg = ground >> 8 & 255, gb = ground & 255;
      // the ink's edge where a pixel is at least half as far from the ground as the strongest ink: an edge smoothed over
      // two dots counts the same on a figure as on a 1 px rule
      const far = (i) => Math.abs(d[i] - gr) + Math.abs(d[i + 1] - gg) + Math.abs(d[i + 2] - gb);
      let most = 0; for (let i = 0; i < d.length; i += 4) most = Math.max(most, far(i));
      let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const i = 4 * (y * c.width + x); if (far(i) < most / 2) continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1);
      }
      const k = c.width / r.width;      // 2: the shot is at twice the window's pixels
      return { left: r.x + x0 / k, right: r.x + x1 / k, top: r.y + y0 / k, bottom: r.y + y1 / k };
    }, [png, r]);
  });
  const T = await page.evaluate(`(() => { let part = ".bar", tab = "Dial", css = "", build = null, below = 0, states = [""]; ${tune}; return { part, tab, css, below, states, build: build ? String(build) : null }; })()`);
  await page.click(`button[data-tab="${T.tab}"]`);
  await page.evaluate(() => window.dial_tool.paint && window.dial_tool.paint());
  if (tuned) {
    await page.addStyleTag({ content: T.css });
    const did = T.build ? await page.evaluate(`(${T.build})(${JSON.stringify(state)})`) : null;
    if (did && did.hover) await page.hover(did.hover);      // a state shown under the pointer: build returns { hover: selector }
  }
  await page.waitForTimeout(400);
  const b = await (await page.$(T.part)).boundingBox();
  const clip = { x: Math.max(0, b.x - M), y: Math.max(0, b.y - M), width: b.width + 2 * M, height: b.height + 2 * M + T.below };      // below: room for a popup hanging under the part (the same in both shots)
  const png = await page.screenshot({ clip });
  await page.close();
  return { png: png.toString("base64"), clip, states: T.states };
}

const before = await shot(false), shots = [["As it is", before]];
for (const st of before.states) shots.push([`Tuned: ${name}` + (st ? ` · ${st}` : ""), await shot(true, st)]);      // one shot per state the tune names (closed, hover, open…)
// lay the two out with their rulers, on a page of its own, and shoot that
const page = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 2 });
await page.setContent(`<!doctype html><style>
  body { margin: 0; padding: 16px 16px 16px 40px; background: #ECECE8; font: 11px/1 system-ui, sans-serif; color: #5C5C58; width: max-content; }
  .cap { margin: 0 0 6px; letter-spacing: .06em; text-transform: uppercase; } .cap + * { margin-bottom: 0; }
  .fig { position: relative; margin-bottom: 30px; } .fig img { display: block; }
  .x, .y { position: absolute; } .x { left: 0; top: 100%; height: 14px; } .y { right: 100%; top: 0; width: 14px; }
  .t { position: absolute; background: #5C5C58; } .x .t { width: 1px; } .y .t { height: 1px; }
  .n { position: absolute; font-size: 8px; } .x .n { top: 11px; translate: -50% 0; } .y .n { right: 12px; translate: 0 -50%; }
</style><body>${shots.map(([cap, s]) => {
  const w = s.clip.width, h = s.clip.height;
  const ticks = (n, axis) => Array.from({ length: Math.floor(n) + 1 }, (_, i) => {
    const len = i % 10 === 0 ? 8 : i % 5 === 0 ? 5 : 3, pos = axis === "x" ? `left:${i}px;top:0;height:${len}px` : `top:${i}px;right:0;width:${len}px`;
    return `<i class="t" style="${pos}"></i>` + (i % (axis === "x" ? 50 : 10) === 0 ? `<b class="n" style="${axis === "x" ? "left" : "top"}:${i}px">${i}</b>` : "");      // numbers every 50 across, every 10 down
  }).join("");
  return `<p class="cap">${cap}</p><div class="fig" style="width:${w}px"><img src="data:image/png;base64,${s.png}" style="width:${w}px;height:${h}px"><div class="x" style="width:${w}px">${ticks(w, "x")}</div><div class="y" style="height:${h}px">${ticks(h, "y")}</div></div>`;
}).join("")}<p class="cap">1 tick = 1 px · rulers start at the picture's corner</p></body>`);
fs.mkdirSync("test/sketches/out", { recursive: true });
await page.locator("body").screenshot({ path: `test/sketches/out/${name}.png` });
console.log(`test/sketches/out/${name}.png`);
await browser.close();
