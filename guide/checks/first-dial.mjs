// first-dial.mjs — the guide's First dial (guide/text/edition-1.md), done as a person does it, on an iPad held
// landscape: taps and typing by the names on screen, nothing else. After each step it keeps the dial's link and a
// screenshot; at the end it exports the PDF and checks it: a 34 mm dial on a 40 mm page.
//
//   cd web && node ../guide/checks/first-dial.mjs   → guide/web/img/first-*.png, guide/checks/first-dial.json
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const WEB = process.cwd(), OUT = path.join(WEB, "../guide/checks/out"), IMG = path.join(OUT, "first");      // its screenshots are for looking at; the guide shows the app's own exports (guide/look/shots.mjs)
fs.mkdirSync(IMG, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, acceptDownloads: true, reducedMotion: "reduce" });
await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
const page = await context.newPage();
await page.goto("file://" + path.join(WEB, "dial-tool.html"));
await page.getByRole("heading", { name: "Dial Tool" }).waitFor(); await page.waitForTimeout(800);

const wait = (ms = 350) => page.waitForTimeout(ms);
const tab = async (name) => { await page.getByRole("button", { name, exact: true }).first().tap(); await wait(); };
const type = async (label, v) => { const f = page.getByRole("textbox", { name: label, exact: true }).filter({ visible: true }).first(); await f.fill(String(v)); await f.press("Enter"); await wait(); };
const ring = async (name) => { await tab("Rings"); const row = page.getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) }).first(), b = await row.boundingBox(); await row.tap({ position: { x: b.width - 12, y: b.height / 2 } }); await wait(); };
const value_button = async (label, v) => {        // its pop-up opens ready to type in: type, Enter, done
  await page.getByRole("button", { name: new RegExp("^" + label) }).filter({ visible: true }).first().tap(); await wait();
  const f = page.getByRole("textbox", { name: new RegExp("^(" + label + "|1\\.2 sets)") }).filter({ visible: true }).last();      // the pop-up's field (its name is its hint: filed)
  if (!(await f.count())) await page.screenshot({ path: path.join(OUT, "stuck-" + label + ".png") });
  await f.tap(); await f.fill(String(v)); await f.press("Enter"); await wait();
  await page.keyboard.press("Escape"); await wait();
};
const tile = async (name) => { const r = page.getByRole("radio", { name, exact: true }).filter({ visible: true }).first(); await r.tap(); await wait(); };
const colour = async (opener, hex) => {
  await opener.tap(); await wait();
  await page.getByRole("button", { name: "HEX", exact: true }).tap(); const f = page.getByRole("textbox", { name: "hex" }); await f.fill(hex); await f.press("Enter");
  await page.getByRole("button", { name: "Close", exact: true }).tap(); await wait();
};
const row_pill = (label) => page.getByText(label, { exact: true }).filter({ visible: true }).first().locator("xpath=..").getByRole("button").first();

const steps = [], shots = [];
async function step(n, title, act, clip) {
  await act(); await wait(900);                    // the address catches up half a second after the last change
  const link = await page.evaluate(() => location.hash);
  const file = `first-${String(n).padStart(2, "0")}.png`;
  const guides = page.getByRole("button", { name: "Guides", exact: true });      // the pictures leave the guides off; the link keeps them as the reader has them
  const on = (await guides.getAttribute("aria-pressed")) === "true";
  if (on) { await guides.tap(); await wait(); }
  await page.screenshot({ path: path.join(IMG, file), ...(clip ? { clip } : {}) });
  if (on) { await guides.tap(); await wait(); }
  steps.push({ n, title, link, picture: file });
  console.log(`step ${n} · ${title} · link ${link.length} characters`);
}
const PANEL = { x: 0, y: 0, width: 460, height: 760 }, DIAL = { x: 460, y: 0, width: 720, height: 760 };

await step(1, "Start from the starting dial", async () => { await tab("Export"); await page.getByRole("button", { name: "Defaults", exact: true }).tap(); }, DIAL);
await step(2, "Size", async () => { await tab("Dial"); await type("Diameter", 34); }, DIAL);
await step(3, "Colours", async () => {
  await tab("Dial");
  await colour(page.getByRole("button", { name: "Plate" }).first(), "#141414");
  for (const name of ["Numerals", "Markers", "Minute ticks", "Hour hand", "Minute hand"]) await colour(row_pill(name), "#EFE9DC");
}, DIAL);
await step(4, "A font that ships with the tool", async () => {
  await ring("Numerals"); await page.getByRole("button", { name: "Change…", exact: true }).filter({ visible: true }).first().tap(); await wait();
  await page.getByRole("searchbox", { name: "Find a font" }).fill("Barlow"); await wait();
  await page.getByRole("button", { name: /^Barlow bold/ }).first().tap(); await wait(1500);
  await page.mouse.click(1170, 810); await wait();          // a tap outside the sheet closes it
}, DIAL);
await step(5, "Numerals", async () => { await ring("Numerals"); await value_button("Centre radius", 11.5); await value_button("Size", 3); await type("Every", 3); }, DIAL);
await step(6, "Markers and ticks", async () => {
  await ring("Markers"); await value_button("Outer radius", 16.2); await value_button("Length", 2.4); await type("Every", 3);
  const skip = page.getByRole("checkbox", { name: "Skip those instead", exact: true }).filter({ visible: true }).first(); if (!(await skip.isChecked())) await skip.tap(); await wait();
  await ring("Minute ticks"); await value_button("Outer radius", 16.2);
}, DIAL);
await step(7, "The date at 3", async () => {
  await tab("Windows"); await page.getByRole("tab", { name: /The window at 3/ }).first().tap(); await wait();
  const c = page.getByRole("checkbox", { name: "Show this window", exact: true }).first(); if (!(await c.isChecked())) await c.tap();
}, DIAL);
await step(8, "Hands", async () => {
  await tab("Hands"); await page.getByRole("tab", { name: "Hour", exact: true }).tap(); await wait(); await tile("sword");
  await page.getByRole("tab", { name: "Minute", exact: true }).tap(); await wait(); await tile("sword");
}, DIAL);
await step(9, "The pose", async () => { await page.getByRole("button", { name: /10:10/ }).first().tap(); }, DIAL);

// 10 · a file: the PDF, and what it is
await tab("Export");
const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "PDF", exact: true }).tap()]);
const pdf = path.join(OUT, d.suggestedFilename()); await d.saveAs(pdf);
const box = fs.readFileSync(pdf, "latin1").match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/), page_mm = box ? +box[1] * 25.4 / 72 : 0;
await step(10, "A file", async () => {}, PANEL);
const ok = Math.abs(page_mm - 40) < 0.05 && /dial-34mm/.test(d.suggestedFilename());
console.log(`PDF ${d.suggestedFilename()}: page ${page_mm.toFixed(2)} mm · ${ok ? "pass" : "FAIL"}`);
await page.screenshot({ path: path.join(IMG, "first-whole.png") });
fs.writeFileSync(path.join(WEB, "../guide/checks/first-dial.json"), JSON.stringify({ when: new Date().toISOString(), version: fs.readFileSync(path.join(WEB, "src/geometry.js"), "utf8").match(/VERSION = "([^"]+)"/)[1], ok, pdf: d.suggestedFilename(), page_mm: +page_mm.toFixed(2), steps }, null, 1) + "\n");
await browser.close();
process.exit(ok ? 0 : 1);
