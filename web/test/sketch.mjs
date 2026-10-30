// sketch.mjs — a sketch round on the real page (Okay, 31 Oct 2026: "pixel accurate fast drawings" he marks up).
// Shows one part of the window twice, as it is and with a tune, one over the other, a pixel ruler along each.
// Because it is the real page, every button, slider, switch, rule and token is the app's own: nothing is imitated.
//
//   node test/sketch.mjs <name>          reads test/sketches/<name>.js, writes test/sketches/out/<name>.png
//
// The tune file (kept in git, so the next agent has it) is plain JavaScript run in the page, with three things set:
//   part   = ".bar .lead"          the part to show (a selector)
//   tab    = "Dial"                the tab to open first (optional)
//   css    = `...`                 rules laid over the stylesheet: use the tokens (docs/sectors.md, docs/css-map.md)
//   build  = () => { ... }         optional: anything CSS can't do (a new row from the app's own builders, a changed word)
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

async function shot(tuned) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("page error:", e.message));
  await page.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: "fonts/" + decodeURIComponent(r.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
  await page.addInitScript(() => { setTimeout(() => { localStorage.setItem("dial-tool-last", "{}"); localStorage.setItem("dial-tool-folds", '{"*":false}'); }, 0); });
  await page.goto("file://" + process.cwd() + "/dial-tool.html");
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await page.evaluate(() => window.dial_tool.set_time(10 * 3600 + 9 * 60 + 36));      // the watchmaker's 10:09:36, still
  const T = await page.evaluate(`(() => { let part = ".bar", tab = "Dial", css = "", build = null; ${tune}; return { part, tab, css, build: build ? String(build) : null }; })()`);
  await page.click(`button[data-tab="${T.tab}"]`);
  await page.evaluate(() => window.dial_tool.paint && window.dial_tool.paint());
  if (tuned) {
    await page.addStyleTag({ content: T.css });
    if (T.build) await page.evaluate(`(${T.build})()`);
  }
  await page.waitForTimeout(400);
  const b = await (await page.$(T.part)).boundingBox();
  const clip = { x: Math.max(0, b.x - M), y: Math.max(0, b.y - M), width: b.width + 2 * M, height: b.height + 2 * M };
  const png = await page.screenshot({ clip });
  await page.close();
  return { png: png.toString("base64"), clip };
}

const before = await shot(false), after = await shot(true);
// lay the two out with their rulers, on a page of its own, and shoot that
const page = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 2 });
await page.setContent(`<!doctype html><style>
  body { margin: 0; padding: 16px 16px 16px 40px; background: #ECECE8; font: 11px/1 system-ui, sans-serif; color: #5C5C58; width: max-content; }
  .cap { margin: 0 0 6px; letter-spacing: .06em; text-transform: uppercase; } .cap + * { margin-bottom: 0; }
  .fig { position: relative; margin-bottom: 30px; } .fig img { display: block; }
  .x, .y { position: absolute; } .x { left: 0; top: 100%; height: 14px; } .y { right: 100%; top: 0; width: 14px; }
  .t { position: absolute; background: #5C5C58; } .x .t { width: 1px; } .y .t { height: 1px; }
  .n { position: absolute; font-size: 8px; } .x .n { top: 11px; translate: -50% 0; } .y .n { right: 12px; translate: 0 -50%; }
</style><body>${[["As it is", before], ["Tuned: " + name, after]].map(([cap, s]) => {
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
