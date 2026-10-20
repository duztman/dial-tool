// window-only.mjs — some sections of the window test, not all (#407; Okay, 19 Oct 2026: "Compiling and updating takes
// too much time … Only filter makes more sense now"). For a small push (R19): the sections a change touches.
//
//   cd web && node build.mjs && node test/window-only.mjs --list            the sections, by their headings
//   cd web && node build.mjs && node test/window-only.mjs files,gallery     those whose heading holds a word given
//
// How: window.mjs is read, cut at its section headings (lines "// ── … ──"), and run again with only its set-up, the
// first section (the starting dial) and the sections asked for — each after the page is opened afresh on the starting
// dial, so a section starts as the full run's first one does. window.mjs itself is not changed. A section that uses
// something an earlier section made (a ring it added, a variable it set) fails here with a ReferenceError or a FAIL that
// the full run doesn't have: that section is not yet standing alone, and the full run (npm test) is the one to trust.
import fs from "fs";
import { spawnSync } from "child_process";

const words = (process.argv[2] || "").toLowerCase().split(",").map((w) => w.trim()).filter(Boolean);
const text = fs.readFileSync(new URL("./window.mjs", import.meta.url), "utf8").split("\n");
const heads = text.map((l, i) => (/^\/\/ ── .* ──\s*$/.test(l) ? i : -1)).filter((i) => i >= 0);
const end = text.findIndex((l) => l.startsWith("await browser.close();"));
const sections = heads.map((h, k) => ({ name: text[h].replace(/^\/\/ ── | ──\s*$/g, ""), from: h, to: k + 1 < heads.length ? heads[k + 1] : end }));
if (!words.length || words[0] === "--list") {
  console.log(sections.map((s, i) => `${String(i).padStart(2)}  ${s.name}`).join("\n"));
  process.exit(0);
}
const chosen = sections.slice(1).filter((s) => words.some((w) => s.name.toLowerCase().includes(w)));
if (!chosen.length) { console.log(`no section's heading holds ${words.join(" or ")} — node test/window-only.mjs --list`); process.exit(1); }
const fresh = `await page.goto("file://" + process.cwd() + "/dial-tool.html"); await page.waitForTimeout(500); await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 }); await tab("Export"); await page.click("#plain"); await page.waitForFunction(() => window.dial_tool.statik); await frame();`;
const out = [
  ...text.slice(0, sections[0].to),
  ...chosen.flatMap((s, k) => [`// (window-only: ${s.name}${k ? ", from a fresh page" : ""})`, ...(k ? [fresh] : []), ...text.slice(s.from, s.to)]),
  ...text.slice(end),
];
const file = new URL("./.window-only.run.mjs", import.meta.url);
fs.writeFileSync(file, out.join("\n"));
console.log(`window test, ${chosen.length} of ${sections.length - 1} sections: ${chosen.map((s) => s.name.slice(0, 40)).join(" · ")}`);
const run = spawnSync(process.execPath, [file.pathname, ...process.argv.slice(3)], { stdio: "inherit" });
fs.rmSync(file, { force: true });
process.exit(run.status ?? 1);
