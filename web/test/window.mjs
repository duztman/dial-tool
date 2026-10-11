// window.mjs — runs the built page (dial-tool.html) in a real browser and uses it:
// sections, rows, the ring list, clicking the preview, round ends, fonts, exports, save and load.
//
//   cd web && node build.mjs && node test/window.mjs [settings.json]
//
// Writes screenshots and the exported files to web/test/out/. Exits 1 if anything failed.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = "test/out";
fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const check = (ok, what) => { console.log((ok ? "ok    " : "FAIL  ") + what); if (!ok) problems.push(what); };
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true });
await context.grantPermissions(["local-fonts"]).catch(() => {});
const page = await context.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));
const settings = process.argv[2];
if (settings) await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("dial-tool-last", s); sessionStorage.setItem("seeded", "1"); } }, fs.readFileSync(settings, "utf8"));
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });

const S = (expr) => page.evaluate(`(() => { const t = window.dial_tool, S = t.S; return ${expr}; })()`);
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const tab = async (name) => { await page.click(`.tabs button:text-is("${name}")`); await frame(); };
const shot = async (name) => { await frame(); await page.screenshot({ path: path.join(OUT, name + ".png") }); };
/** click the preview at a spot given in dial millimetres (y up). */
const click_mm = async (x, y) => {
  const p = await page.evaluate(([x, y]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return [r.left + t.c[0] + x * t.z * (t.S.out_mirror ? -1 : 1), r.top + t.c[1] - y * t.z]; }, [x, y]);
  await page.mouse.click(p[0], p[1]);
  await frame();
};
const clock = (r, a) => [r * Math.sin(a * Math.PI / 180), r * Math.cos(a * Math.PI / 180)];
const download = async (selector) => {
  const [d] = await Promise.all([page.waitForEvent("download"), page.click(selector)]);
  const file = path.join(OUT, d.suggestedFilename());
  await d.saveAs(file);
  return file;
};

// ── start with the default dial ──
await tab("Export");
await page.click('button:text-is("Defaults")');
await page.waitForFunction(() => window.dial_tool.statik);
await frame();
check(await S("S.rings.length === 3 && S.dial_d === 30"), "Defaults: the starting dial, three rings");
await shot("1-default");

// ── a number row: slider, typed field with shorthand, stepper ──
await tab("Dial");
await page.fill("#global-dial-d-Diameter", "36");
await page.press("#global-dial-d-Diameter", "Enter");
check(await S("S.dial_d === 36"), "typed 36 → diameter 36");
await page.fill("#global-dial-d-Diameter", "+0.5");
await page.press("#global-dial-d-Diameter", "Enter");
check(await S("S.dial_d === 36.5"), "typed +0.5 → 36.5");
await page.fill("#global-dial-d-Diameter", "x2");
await page.press("#global-dial-d-Diameter", "Enter");
check(await S("S.dial_d === 73") && await page.$eval("#global-dial-d-Diameter-slider", (e) => +e.max === 73), "typed x2 → 73, and the slider grew to hold it");
await page.fill("#global-dial-d-Diameter", "30");
await page.press("#global-dial-d-Diameter", "Enter");
await page.click(".row.num:has(#global-dial-d-Diameter) .step >> nth=1");
check(near(await S("S.dial_d"), 30.1, 1e-9), "stepper + → 30.1");
await page.fill("#global-dial-d-Diameter", "30");
await page.press("#global-dial-d-Diameter", "Enter");
await page.$eval("#global-dial-d-Diameter-slider", (e) => { e.value = 31; e.dispatchEvent(new Event("input", { bubbles: true })); });
check(await S("S.dial_d === 31") && await page.inputValue("#global-dial-d-Diameter") === "31.0", "slider → 31, the field follows");
await page.fill("#global-dial-d-Diameter", "30");
await page.press("#global-dial-d-Diameter", "Enter");

// ── clicking the preview opens the settings of what was clicked ──
await click_mm(...clock(10, 120));                                  // the numeral 4
check(await S("S.ui_section === 1 && ['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'numerals' && t.nudge_at === '4'"), "click the numeral 4 → Rings, the numerals ring, and Nudge is set to that numeral");
await click_mm(...clock(13, 150));                                  // the marker at 5
check(await S("['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'markers'"), "click a marker → the markers ring");
await click_mm(...clock(13.9, 93));                                 // beside a thin tick (in its zone)
check(await S("['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'ticks'"), "click in the ticks' zone → the ticks ring");
const hands = await S("(() => { const a = [S.t / 43200 * 360, (S.t % 3600) / 3600 * 360]; return a; })()");
await click_mm(...clock(6, hands[0]));
check(await S("S.ui_section === 2 && S.ui_hand === 0"), "click the hour hand → Hands, Hour");
await click_mm(...clock(11, hands[1]));
check(await S("S.ui_section === 2 && S.ui_hand === 1"), "click the minute hand → Hands, Minute");
await click_mm(0.5, 3);
check(await S("S.ui_section === 0"), "click the bare plate → Dial");
await tab("Date");
await page.check("#global-da-on-Date-window");
await frame();
await click_mm(...clock(await S("S.da_r"), 90));
check(await S("S.ui_section === 3"), "click the date window → Date");
await shot("2-date");

// ── round ends: markers (one click) and hands ──
await click_mm(...clock(13, 150));
await page.click('button:text-is("Round both ends")');
check(await S("S.rings[S.ui_ring].round_out === 0.35 && S.rings[S.ui_ring].round_in === 0.35"), "Round both ends → both radii = half the marker's width");
await click_mm(...clock(13.9, 93));
await page.fill("#ring-w-Width-", "0.3");
await page.press("#ring-w-Width-", "Enter");
await page.click('button:text-is("Round both ends")');
await click_mm(...clock(6, hands[0]));
await page.fill("#hand-round-Round-ends", "2");
await page.press("#hand-round-Round-ends", "Enter");
await page.click('.segs button:text-is("Minute")');
await page.fill("#hand-round-Round-ends", "2");
await page.press("#hand-round-Round-ends", "Enter");
check(await S("S.ha_hour.round === 2 && S.ha_minute.round === 2"), "Round ends on the hour and minute hands");
const hour = await S("(() => { const p = t.items.find((i) => i.role === 'hand' && i.name === 'hour').path; return { curves: p.d.filter((c) => c[0] === 'C').length, b: p.bounds() }; })()");
check(hour.curves === 4 && near(hour.b[3], await S("S.ha_hour.len"), 1e-6), "the hour hand has four rounded corners and keeps its length");
await shot("3-round-ends");

// ── the ring list: add, rename, hide, duplicate, move, delete ──
await tab("Rings");
const before = await S("S.rings.length");
await page.click('.ringlist .tools button:text-is("Band")');
check(await S(`S.rings.length === ${before + 1} && S.rings[S.ui_ring].kind === 3`), "Add Band → a band ring, selected");
await page.fill(".ringlist li.on .name", "Edge");
check(await S("S.rings[S.ui_ring].name === 'Edge'"), "renamed to Edge");
const was = await S("S.ui_ring");
await page.click('button:text-is("↑ Up")');
check(await S(`S.rings[${was - 1}].name === 'Edge' && S.ui_ring === ${was - 1}`), "↑ Up moves it one place up the list");
await page.click('button:text-is("↓ Down")');
check(await S(`S.rings[${was}].name === 'Edge' && S.ui_ring === ${was}`), "↓ Down moves it back");
await page.click('button:text-is("Duplicate")');
check(await S(`S.rings.length === ${before + 2} && S.rings[S.ui_ring].name === 'Edge copy'`), "Duplicate");
await page.click('button:text-is("Delete")');
check(await S(`S.rings.length === ${before + 1} && S.rings[S.ui_ring].name === 'Edge'`), "Delete removes the copy");
await page.uncheck(".ringlist li.on input[type=checkbox]");
await frame();
check(await S("S.rings[S.ui_ring].on === false && !t.items.some((i) => i.role === 'ring' && i.index === S.ui_ring)"), "unticking hides the ring in the preview");
await page.check(".ringlist li.on input[type=checkbox]");
await page.selectOption("#ring-kind-Kind", "0");
check(await S("S.rings[S.ui_ring].kind === 0 && S.rings[S.ui_ring].width === 1"), "changing a ring's kind keeps its settings");
await page.click('button:text-is("Delete")');
await shot("4-rings");

// ── fonts: a file with a variable axis, features, the fonts on this computer ──
await click_mm(...clock(10, 120));
await page.setInputFiles("#font-file", "/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf");
await page.waitForFunction(() => window.dial_tool.ring().family === "Lora");
await frame();
check(await page.$("#axis-wght") !== null, "Lora added from a file: its weight axis has a slider");
const light = await S("t.statik.rings.find((d) => d.kind === 'numerals').path.svg(3).length");
await page.fill("#axis-wght", "700");
await page.press("#axis-wght", "Enter");
await frame();
check(await S("S.rings[S.ui_ring].axes.wght === 700") && (await S("t.statik.rings.find((d) => d.kind === 'numerals').path.svg(3).length")) !== light, "weight 700 changes the numerals' outlines");
const wide = await S("(() => { const b = t.statik.rings.find((d) => d.kind === 'numerals').parts[0].bounds(); return b[2] - b[0]; })()");
await page.check("#feature-tnum");
await frame();
const tab_w = await S("(() => { const b = t.statik.rings.find((d) => d.kind === 'numerals').parts[0].bounds(); return b[2] - b[0]; })()");
check(await S("S.rings[S.ui_ring].features.tnum === true") && tab_w !== wide, "the tnum feature (tabular figures) changes the width of “12”");
await page.uncheck("#feature-tnum");
check(await S("!('tnum' in S.rings[S.ui_ring].features)"), "switching a feature back to the font's default stores nothing (R12)");
await shot("5-type");
if (await page.evaluate(() => "queryLocalFonts" in window)) {
  await page.click("#local-fonts");
  await page.waitForFunction(() => window.dial_tool.catalog.size > 5, null, { timeout: 15000 }).catch(() => {});
  const listed = await S("t.catalog.size");
  check(listed > 5, `Fonts on this computer: ${listed} listed`);
  const pick = await S("[...t.catalog.values()].find((f) => f.data && /Poppins/.test(f.family) && /^Regular$/.test(f.style))?.family || [...t.catalog.values()].find((f) => f.data).family");
  await page.selectOption("#font-family", pick);
  await page.waitForFunction((f) => window.dial_tool.ring().family === f && window.dial_tool.statik, pick);
  await frame();
    check(await S("S.rings[S.ui_ring].family") === pick && (await page.textContent(".font .note")).trim() === "", `a font installed on this computer (${pick}) draws the numerals`);
} else check(false, "this browser has no queryLocalFonts");
await shot("6-local-font");

// ── zoom, pan, fit; play ──
const z0 = await S("t.z");
const box = await page.$eval(".preview", (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2 + 120, r.top + r.height / 2 - 80]; });
const spot = await page.evaluate(([x, y]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return t.to_mm([x - r.left, y - r.top]); }, box);
await page.mouse.move(box[0], box[1]);
await page.keyboard.down("Control");
await page.mouse.wheel(0, -120);
await page.keyboard.up("Control");
await frame();
const spot2 = await page.evaluate(([x, y]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return t.to_mm([x - r.left, y - r.top]); }, box);
check(await S("t.z") > z0 * 1.5 && near(spot[0], spot2[0], 0.01) && near(spot[1], spot2[1], 0.01), "ctrl-scroll zooms, and the spot under the cursor stays put");
await shot("7-zoomed");
await page.mouse.wheel(40, 30);
await frame();
check(await S("t.fitted === false"), "two-finger scroll pans");
await page.click('button:text-is("Fit")');
check(near(await S("t.z"), z0, 1e-6) && await S("t.fitted"), "Fit puts the whole page back");
const t0 = await S("S.t");
await page.click('button:text-is("Play")');
await page.waitForTimeout(600);
const t1 = await S("S.t");
await page.click('button:text-is("Stop")');
check(t1 - t0 > 0.4 && t1 - t0 < 1.5, `Play moves the time (${(t1 - t0).toFixed(2)} s in 0.6 s)`);
await page.fill("#time", "3:20:10");
await page.press("#time", "Enter");
check(await S("S.t === 3 * 3600 + 20 * 60 + 10"), "typed time 3:20:10");

// ── files: PDF, SVG, PNG, save, load ──
await tab("Export");
const size_mm = await S("S.dial_d + 2 * S.margin");
const pdf = await download("#export-pdf");
const pdf_text = fs.readFileSync(pdf, "latin1");
const box_pt = /MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf_text);
check(pdf_text.startsWith("%PDF-1.4") && box_pt && near(+box_pt[1] / 72 * 25.4, size_mm, 0.001), `PDF: page ${(box_pt[1] / 72 * 25.4).toFixed(2)} mm = dial + margins (${size_mm} mm)`);
check(!/ S\n| re\n|BT\n/.test(pdf_text) && (pdf_text.match(/\nf\n/g) || []).length >= 8, "PDF: filled paths only, no strokes or text (R4, R5)");
const svg = await download("#export-svg");
const svg_text = fs.readFileSync(svg, "utf8");
check(svg_text.includes(`width="${size_mm}mm"`) && !svg_text.includes("stroke=") && (svg_text.match(/<path/g) || []).length >= 8, "SVG: true size in mm, no guides");
const png = await download("#export-png");
const want_px = Math.round(size_mm / 25.4 * await S("S.out_dpi"));
const png_bytes = fs.readFileSync(png);
check(png_bytes.readUInt32BE(16) === want_px && png_bytes.readUInt32BE(20) === want_px, `PNG: ${want_px} × ${want_px} px at ${await S("S.out_dpi")} dpi`);
const saved = await download("#save");
const before_save = await S("JSON.stringify(S)");
check(JSON.stringify(JSON.parse(fs.readFileSync(saved, "utf8"))) === before_save, "Save… writes the settings as they are");
await page.click('button:text-is("Defaults")');
await page.waitForFunction(() => window.dial_tool.statik);
check(await S("S.ha_hour.round === 0"), "Defaults clears them");
await page.setInputFiles("#load-file", saved);
await page.waitForFunction(() => window.dial_tool.S.ha_hour.round === 2);
const after_load = await S("JSON.stringify({ ...S, ui_section: 0 })");
check(after_load === JSON.stringify({ ...JSON.parse(before_save), ui_section: 0 }), "Load… brings every setting back");
await page.reload();
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
check(await S("S.ha_hour.round === 2"), "the last session is back after closing and reopening the page");
await shot("8-reopened");

check(errors.length === 0, "no errors in the browser's console" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s).` : "\nWindow test passed.");
process.exit(problems.length ? 1 : 0);
