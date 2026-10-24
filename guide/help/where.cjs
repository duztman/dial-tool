// where.cjs — the real screen behind each small map: the window at the first dial, the part the section is about boxed.
//   cd web && node ../guide/help/where.cjs   → guide/help/img/where-<section>.png (webp.py makes them WebP)
// Okay, 24 Oct 2026, 20:30: "Clicking thumbs open … big lightboxes with captions. Real screen goodly red boxed. Offset the
// selected objects and center box equally." The box: black inside, red, white outside, the same room on every side of what it holds.
const { chromium } = require("playwright");
const path = require("path");
const OUT = path.join(__dirname, "img");
const WEB = path.join(__dirname, "../../web");
const ROOM = 8;      // px between a part and its box, the same on all four sides

// what each section points at: CSS selectors, or "dial" for the plate on the preview; a list draws one box each
const WHERE = {
  idea: [["dial"]], screen: [], first: [[".panel"]],
  dial: [['button[data-tab="Dial"]'], ["panel"]], rings: [['button[data-tab="Rings"]'], ["panel"]],
  hands: [['button[data-tab="Hands"]'], ["panel"]], date: [['button[data-tab="Date"]'], ["panel"]],
  export: [['button[data-tab="Export"]'], ["panel"]],
  canvas: [[".undos"], [".corner"], [".backdrops", ".shadows"], [".eyes"], [".bar"]],
  show: [["#iris-box"]],
};
const TAB = { dial: "Dial", rings: "Rings", hands: "Hands", date: "Date", export: "Export" };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
  const page = await context.newPage();
  await page.goto("file://" + path.join(WEB, "dial-tool.html"));
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await page.mouse.move(230, 880);
  for (const [name, boxes] of Object.entries(WHERE)) {
    await page.click(`button[data-tab="${TAB[name] || "Dial"}"]`);
    await page.evaluate(([boxes, ROOM]) => new Promise((done) => {
      document.querySelectorAll(".help-box").forEach((e) => e.remove());
      for (const parts of boxes) {
        const rects = parts.flatMap((q) => [q]).map((q) => {
          if (q === "dial") { const t = window.dial_tool, s = t.svg.getBoundingClientRect(), r = t.S.dial_d / 2 * t.z; return { left: s.left + t.c[0] - r, top: s.top + t.c[1] - r, right: s.left + t.c[0] + r, bottom: s.top + t.c[1] + r }; }
          if (q === "panel") {      // the open tab's panes, pinned and scrolling: from under the tabs to the last pane, across the panes' width
            const tabs = document.querySelector(".tabs").getBoundingClientRect(), rs = [...document.querySelectorAll(".panel .pane")].filter((e) => e.offsetParent && e.getBoundingClientRect().height).map((e) => e.getBoundingClientRect());
            return { left: Math.min(...rs.map((r) => r.left)), top: tabs.bottom + 10, right: Math.max(...rs.map((r) => r.right)), bottom: Math.max(...rs.map((r) => r.bottom)) }; }
          if (q.startsWith("all:")) { const rs = [...document.querySelectorAll(q.slice(4))].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect());
            return { left: Math.min(...rs.map((r) => r.left)), top: Math.min(...rs.map((r) => r.top)), right: Math.max(...rs.map((r) => r.right)), bottom: Math.max(...rs.map((r) => r.bottom)) }; }
          const e = document.querySelector(q); return e && e.offsetParent ? e.getBoundingClientRect() : null;      // a part this tab hasn't (no pinned pane on Export) is left out
        }).filter(Boolean);
        const L = Math.min(...rects.map((r) => r.left)), T = Math.min(...rects.map((r) => r.top)), R = Math.max(...rects.map((r) => r.right)), B = Math.max(...rects.map((r) => r.bottom));
        const room = Math.max(1, Math.min(ROOM, L - 6, T - 6, innerWidth - R - 6, innerHeight - B - 6));      // one room for all four sides: less only where the window's edge is nearer
        const b = document.createElement("div"); b.className = "help-box";
        Object.assign(b.style, { position: "fixed", zIndex: 99999, pointerEvents: "none", left: L - room + "px", top: T - room + "px", width: R - L + 2 * room + "px", height: B - T + 2 * room + "px",
          border: "1.5px solid #111", borderRadius: "12px", boxShadow: "0 0 0 3.5px #d0341c, 0 0 0 5.5px #fff" });      // black inside, red, white outside (Okay, 20:39), the red the widest
        document.body.append(b);
      }
      requestAnimationFrame(() => requestAnimationFrame(done));
    }), [boxes, ROOM]);
    await page.screenshot({ path: path.join(OUT, `where-${name}.png`) });
  }
  await browser.close();
})();
