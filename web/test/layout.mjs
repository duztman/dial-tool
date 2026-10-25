// layout.mjs — the layout check (#188; atlas 5.10, Okay, 14 Oct 2026: "THIS ROCKS. YEZXS PLEAĞSE."): reads the window's
// boxes and reports what misses the box rule (R32). A report only, for now: it never fails, so it is not in npm test.
// Okay sorts real misses from intended ones; then the intended ones are listed here and it can fail npm test.
//
//   node test/layout.mjs            → test/out/layout.txt (and the summary printed)
//
// Three readings, per tab, every pane open, at the desktop size (1440 × 900):
//   1 · columns: where each row's first control starts. Each place is counted; a place only one or two controls use is a
//       stray — a field or a stepper off its column.
//   2 · spaces: the room between one row and the next. Every space is a step of the unit (R32: --u1 is half a unit,
//       2.75 px); a space that is not a whole number of half-units (to a quarter of a pixel) is listed.
//   3 · frames: anything inside a pane that reaches past the pane's right line (the panel's margin).
import { chromium } from "playwright";
import fs from "fs";

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.route("https://duztman.github.io/dial-tool/fonts/**", (route) => route.fulfill({ path: "fonts/" + decodeURIComponent(route.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
await page.addInitScript(() => { setTimeout(() => { localStorage.setItem("dial-tool-last", "{}"); localStorage.setItem("dial-tool-folds", '{"*":false}'); }, 0); });
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });

const lines = [], summary = [];
for (const tab of ["Dial", "Rings", "Hands", "Date", "Export"]) {
  await page.click(`button[data-tab="${tab}"]`);
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const panel = document.querySelector(".panel"), P = panel.getBoundingClientRect(), half = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit")) / 2;
    const margin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--margin"));
    const rows = [...panel.querySelectorAll(".row")].filter((x) => x.offsetParent && x.getBoundingClientRect().height > 0);
    const name = (x) => (x.querySelector("label, h2, .words")?.textContent || x.className).trim().slice(0, 40);
    // 1 · columns
    const starts = new Map();
    for (const row of rows) {
      const c = row.querySelector("input:not([type=checkbox]):not([hidden]), select, button, .numbox, .check");
      if (!c || !c.getBoundingClientRect().width) continue;
      const x = +(c.getBoundingClientRect().left - P.left).toFixed(1);
      if (!starts.has(x)) starts.set(x, []);
      starts.get(x).push(name(row));
    }
    // 2 · spaces
    const off = [];
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1].getBoundingClientRect(), b = rows[i].getBoundingClientRect();
      if (rows[i - 1].closest(".pane") !== rows[i].closest(".pane")) continue;
      const gap = b.top - a.bottom, steps = gap / half;
      if (gap >= 0 && Math.abs(steps - Math.round(steps)) * half > 0.25) off.push(`${name(rows[i - 1])} → ${name(rows[i])}: ${gap.toFixed(2)} px (${steps.toFixed(2)} half-units)`);
    }
    // 3 · frames
    const right = P.right - margin, past = [];
    for (const x of panel.querySelectorAll(".pane *")) {
      if (!x.offsetParent) continue;
      const b = x.getBoundingClientRect();
      if (b.width && b.right > right + 0.5 && getComputedStyle(x).position !== "absolute") past.push(`${x.tagName.toLowerCase()}.${[...x.classList].join(".")} (${name(x.closest(".row") || x)}): ${(b.right - right).toFixed(1)} px past`);
    }
    return { starts: [...starts].sort((a, b) => a[0] - b[0]), off, past: [...new Set(past)] };
  });
  const strays = r.starts.filter(([, who]) => who.length <= 2);
  lines.push(`── ${tab} ──`, "columns (x from the panel's left: how many controls start there):",
    ...r.starts.map(([x, who]) => `  ${String(x).padStart(6)}  ${who.length}${who.length <= 2 ? "  ← stray: " + who.join(" · ") : ""}`),
    `spaces off the half-unit (${r.off.length}):`, ...r.off.map((x) => "  " + x),
    `past the pane's right line (${r.past.length}):`, ...r.past.map((x) => "  " + x), "");
  summary.push(`${tab}: ${strays.length} stray columns, ${r.off.length} spaces off the scale, ${r.past.length} past the line`);
}
fs.mkdirSync("test/out", { recursive: true });
fs.writeFileSync("test/out/layout.txt", `Layout check (#188), ${new Date().toISOString()}: a report, not a test.\n\n${summary.join("\n")}\n\n${lines.join("\n")}\n`);
console.log(summary.join("\n") + "\n→ test/out/layout.txt");
await browser.close();
