// light.cjs — the Show Case's Light tab, pane by pane, for the help page (Okay, 26 Oct 2026: "You can add screenshots to these").
//   cd web && node ../guide/help/light.cjs   → guide/help/img/light-<pane>.webp at 2×
// From the committed web/dial-tool.html, the dial in the help's greys (grey.cjs); the foot's switches hidden so no pane is cut.
const { chromium } = require("playwright");
const grey = require("./grey.cjs");
const path = require("path"), { execFileSync } = require("child_process");
const OUT = path.join(__dirname, "img"), WEB = path.join(__dirname, "../../web");
const NAMES = ["style", "sun", "flare", "glass", "effects"];      // the tab's panes, in order
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await p.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
  await p.goto("file://" + path.join(WEB, "dial-tool.html"));
  await p.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await grey(p);
  await p.evaluate(() => window.dial_tool.show_mode(true, true)); await p.waitForTimeout(1500);
  await p.click('button[data-tab="Light"]'); await p.waitForTimeout(600);
  await p.addStyleTag({ content: ".shenanigans{visibility:hidden}" });
  await p.mouse.move(5, 5);
  const n = await p.evaluate(() => [...document.querySelectorAll(".panel .pane")].filter((e) => e.offsetParent).length);
  for (let i = 0; i < Math.min(n, NAMES.length); i++) {
    const clip = await p.evaluate((i) => { const e = [...document.querySelectorAll(".panel .pane")].filter((e) => e.offsetParent)[i];
      e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, i);
    await p.waitForTimeout(200);
    const png = path.join(OUT, `light-${NAMES[i]}.png`);
    await p.screenshot({ path: png, clip });
    execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}").convert("RGB");im.save("${png.replace(".png", ".webp")}",quality=86,method=6)`]);
    require("fs").unlinkSync(png);
  }
  await b.close();
  console.log("light panes:", NAMES.slice(0, n).join(" · "));
})();
