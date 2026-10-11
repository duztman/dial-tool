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
// the tool's own fonts come from its site; here they are served from web/fonts/, so the test needs no network
await context.route("https://duztman.github.io/dial-tool/fonts/**", (route) => route.fulfill({ path: "fonts/" + decodeURIComponent(route.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
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
const tab = async (name) => { await page.click(`.tabs button[data-tab="${name}"]`); await frame(); };
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
await page.check("#window-on-Show-this-window");
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
await page.click("#add-band");
check(await S(`S.rings.length === ${before + 1} && S.rings[S.ui_ring].kind === 3`), "Add Band → a band ring, selected");
await page.fill(".ringlist li.on .name", "Edge");
check(await S("S.rings[S.ui_ring].name === 'Edge'"), "renamed to Edge");
const was = await S("S.ui_ring");
await page.click("#ring-up");
check(await S(`S.rings[${was - 1}].name === 'Edge' && S.ui_ring === ${was - 1}`), "↑ Up moves it one place up the list");
await page.click("#ring-down");
check(await S(`S.rings[${was}].name === 'Edge' && S.ui_ring === ${was}`), "↓ Down moves it back");
await page.click("#ring-duplicate");
check(await S(`S.rings.length === ${before + 2} && S.rings[S.ui_ring].name === 'Edge copy'`), "Duplicate");
await page.click("#ring-delete");
check(await S(`S.rings.length === ${before + 1} && S.rings[S.ui_ring].name === 'Edge'`), "Delete removes the copy");
await page.uncheck(".ringlist li.on input[type=checkbox]");
await frame();
check(await S("S.rings[S.ui_ring].on === false && !t.items.some((i) => i.role === 'ring' && i.index === S.ui_ring)"), "unticking hides the ring in the preview");
await page.check(".ringlist li.on input[type=checkbox]");
await page.selectOption("#ring-kind-Kind", "0");
check(await S("S.rings[S.ui_ring].kind === 0 && S.rings[S.ui_ring].width === 1"), "changing a ring's kind keeps its settings");
await page.click("#ring-delete");
await shot("4-rings");

// ── the pointer on the preview: an outline, and a label with the piece's name ──
const over_mm = async (x, y) => {
  const p = await page.evaluate(([x, y]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return [r.left + t.c[0] + x * t.z, r.top + t.c[1] - y * t.z]; }, [x, y]);
  await page.mouse.move(p[0] + 1, p[1] + 1);
  await page.mouse.move(p[0], p[1]);
  await frame();
  return p;
};
const hour_at = await over_mm(...clock(6, hands[0]));
check(await page.isVisible(".tip") && (await page.textContent(".tip span")) === "Hour hand", "pointer on the hour hand: the label says Hour hand");
check(await page.$eval(".glow:not(.under)", (e) => e.getAttribute("d").length > 20 && e.getAttribute("transform") !== null), "…and the hand is outlined, turned with it");
const tip_box = await page.$eval(".tip", (e) => { const r = e.getBoundingClientRect(), a = e.querySelector("svg").getBoundingClientRect(); return { bottom: r.bottom, arrow: a.left + a.width / 2 }; });
check(tip_box.bottom < hour_at[1] && Math.abs(tip_box.arrow - hour_at[0]) < 1.5, "the label sits above the pointer and its arrow points at it");
await over_mm(...clock(13.9, 93));
check((await page.textContent(".tip span")) === "Minute ticks", "pointer beside a thin tick: Minute ticks");
await page.mouse.move(5, 5);
await frame();
check(await page.isHidden(".tip"), "pointer off the preview: no label");
await shot("4b-hover-setup");

// ── drag a ring to another place in the list ──
await tab("Rings");
const order = await S("S.rings.map((r) => r.name)");
const grip = await page.$eval(".ringlist li:nth-child(1) .grip", (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.height]; });
await page.mouse.move(grip[0], grip[1]);
await page.mouse.down();
await page.mouse.move(grip[0], grip[1] + grip[2] * 1.2, { steps: 4 });
check(await page.isVisible(".ringlist .dropline"), "dragging a ring by its grip shows where it will land");
await page.mouse.move(grip[0], grip[1] + grip[2] * 2.2, { steps: 4 });
await page.mouse.up();
await frame();
check(JSON.stringify(await S("S.rings.map((r) => r.name)")) === JSON.stringify([order[1], order[2], order[0], ...order.slice(3)]) && await S("S.ui_ring === 2"), "dropped two rows down: the order changed and the ring stays selected");
await page.mouse.move(grip[0], grip[1] + grip[2] * 2);
await page.mouse.down();
await page.mouse.move(grip[0], grip[1] - grip[2], { steps: 5 });
await page.mouse.up();
await frame();
check(JSON.stringify(await S("S.rings.map((r) => r.name)")) === JSON.stringify(order), "dragged back to the top: the first order again");

// ── guides have their own section ──
await tab("Guides");
await page.fill("#global-gd-w-Thickness", "3");
await page.press("#global-gd-w-Thickness", "Enter");
await page.uncheck("#global-gd-axes-Centre-lines");
await frame();
check(await S("t.items.filter((i) => i.role === 'guide' && i.px === 3).length > 0 && !t.items.some((i) => i.role === 'guide' && i.path.d.length === 2)"), "Guides: thickness 3 and no centre lines reach the preview");
await shot("4c-guides");
await page.uncheck("#global-guides-Show-guides");
await frame();
check(await S("!t.items.some((i) => i.role === 'guide')") && await page.isHidden("#global-gd-w-Thickness"), "Show guides off: none drawn, and the other rows hide");
await page.check("#global-guides-Show-guides");
check(await page.$$eval(".tabs button", (b) => b.map((x) => x.textContent.trim()).join(" ")) === "Export Dial Rings Hands Windows Guides", "tabs: Export first, Guides last");

// ── windows: up to four, each a date, a day, am · pm or a moon phase ──
await tab("Date");
const kinds = [["2", "1", "9"], ["3", "2", "6"], ["4", "3", "12"]];          // window, kind, position
for (const [n, kind, at] of kinds) {
  await page.click(`.segs button:text-is("${n}")`);
  await page.check("#window-on-Show-this-window");
  await page.selectOption("#window-kind-Shows", kind);
  await page.selectOption("#window-at-Position", { label: at });
}
await page.fill("#window-age-Moon-age-days", "6");
await page.press("#window-age-Moon-age-days", "Enter");
await page.fill("#window-w-Width", "4");
await page.press("#window-w-Width", "Enter");
await frame();
check(await S("t.statik.windows.length === 4 && S.windows[0].text === 'MON' && S.windows.map((w) => w.kind).join('') === '123'"), "four windows: date, day (its text became MON), am · pm, moon phase");
check(await S("t.statik.windows.every((x) => x.number.bounds() !== null && x.window.bounds() !== null)") && await S("t.items.filter((i) => i.role === 'date disc').length === 4"), "each window has a hole and something showing through it");
const moon_at = await S("(() => { const b = t.statik.windows[3].window.bounds(); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2 + 0.6]; })()");
await over_mm(...moon_at);
check((await page.textContent(".tip span")) === "Moon phase window", "pointer on the fourth window: Moon phase window");
await click_mm(...moon_at);
check(await S("S.ui_section === 3 && S.ui_window === 3") && await page.isVisible("#window-age-Moon-age-days") && await page.isHidden("#window-h-Height"), "click it: Windows, window 4, with the moon's rows");
await shot("4d-windows");
for (const n of ["2", "3", "4"]) { await page.click(`.segs button:text-is("${n}")`); await page.uncheck("#window-on-Show-this-window"); }
await page.click('.segs button:text-is("1")');
check(await S("t.statik.windows.length === 1"), "windows 2 to 4 switched off again");

// ── fonts: the tool's own list, a file with a variable axis, features, the fonts on this computer ──
await click_mm(...clock(10, 120));
check(await page.$$eval('.fontrow[data-group="list"]', (rows) => rows.length) === 20 && await page.$$eval('.fontrow[data-group="list"] .sample svg path', (p) => p.length) === 20, "the font list: twenty families, each showing numerals in its own outlines");
check(await page.$("#font-family") === null && await page.$$eval(".font select", (e) => e.length) === 0, "no dropdowns in the font rows");
await page.click('.fontrow[data-family="Jost"]');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Jost-Regular" && document.querySelector("#axis-wght"), null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Jost-Regular'") && await page.$("#axis-wght") !== null && !(await page.textContent(".font .note")).includes("stands in"), "click Jost in the list: fetched, drawn, and its weight axis appears");
await page.click('.fontrow[data-family="Barlow"]');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Barlow-Regular");
await page.click('.font .styles button:text-is("Bold")');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Barlow-Bold", null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Barlow-Bold'"), "Barlow's styles are buttons: Bold");
await page.click('.fontrow[data-family="Josefin Sans"]');
await page.waitForFunction(() => window.dial_tool.ring().family === "Josefin Sans");
check(await S("S.rings[S.ui_ring].axes.wght === 400"), "a variable font that rests at Thin starts at regular weight");
await shot("5a-font-list");
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
check((await page.textContent(".font .note")).includes("Added Lora") && await page.$('.fontrow[data-family="Lora"] .sample svg') !== null, "the Type rows say what the font action did, and Lora joins the list with its numerals");
await shot("5-type");
if (await page.evaluate(() => "queryLocalFonts" in window)) {
  await page.click("#local-fonts");
  await page.waitForFunction(() => [...window.dial_tool.catalog.values()].some((f) => f.data), null, { timeout: 15000 }).catch(() => {});
  const listed = await S("[...t.catalog.values()].filter((f) => f.data).length");
  check(listed > 5, `Fonts on this computer: ${listed} listed`);
  const pick = await S("[...t.catalog.values()].find((f) => f.data && /Poppins/.test(f.family) && /^Regular$/.test(f.style))?.family || [...t.catalog.values()].find((f) => f.data).family");
  await page.click(`.fontrow[data-family="${pick}"]`);
  await page.waitForFunction((f) => window.dial_tool.ring().family === f && window.dial_tool.statik, pick);
  await frame();
    check(await S("S.rings[S.ui_ring].family") === pick && !(await page.textContent(".font .note")).includes("stands in"), `a font installed on this computer (${pick}) draws the numerals`);
} else check(false, "this browser has no queryLocalFonts");
await shot("6-local-font");

// ── the ring's main rows stay in view while the rest scrolls ──
await page.$eval(".form", (e) => { e.scrollTop = 99999; });
check(await page.$eval("#ring-kind-Kind", (e) => { const r = e.getBoundingClientRect(), p = document.querySelector(".panel").getBoundingClientRect(); return r.top > p.top && r.bottom < p.bottom && e.closest(".pinned") !== null; }), "Kind, Colour and radius stay in view when the rows are scrolled to the end");
await shot("6b-scrolled");

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
await page.click("#play");
await page.waitForTimeout(600);
const t1 = await S("S.t");
check(await page.getAttribute("#play", "title") === "Pause", "while playing, the button offers Pause");
await page.click("#play");
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

// ── examples: five dials under Export, each a link ──
await tab("Export");
check(await page.$$eval(".examples a svg", (e) => e.length) === 5, "Export shows five example dials with pictures");
const example = await page.getAttribute(".examples a >> nth=1", "href");
await page.click(".examples a >> nth=1");
await page.waitForFunction((h) => location.hash === h && window.dial_tool.statik && window.dial_tool.S.ui_section === 4, example, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(700);
check(await page.evaluate((h) => location.hash === h, example) && await S("t.log_lines.slice(0, 3).every((l) => !l.includes('stands in'))"), "clicking Diver opens it: the address is its link and its fonts are drawn");
await shot("9-example");
await page.setInputFiles("#load-file", saved);
await page.waitForFunction(() => window.dial_tool.S.ha_hour.round === 2);

// ── a dial as a link ──
await context.grantPermissions(["local-fonts", "clipboard-read", "clipboard-write"]).catch(() => {});
await tab("Export");
await page.click("#copy-link");
await page.waitForFunction(() => window.dial_tool.log_lines[0].includes("link copied"), null, { timeout: 5000 }).catch(() => {});
const link = await page.evaluate(() => location.href);
check(/#1\.[A-Za-z0-9_-]+$/.test(link), `Copy link: the address carries the dial (${link.split("#")[1].length} characters after #)`);
const wanted = await S("JSON.stringify({ ...S, ui_section: 0, ui_ring: 0, ui_hand: 0 })");
const other = await context.newPage();                               // someone else's browser: no last session of this dial
await other.addInitScript(() => localStorage.removeItem("dial-tool-last"));
await other.goto(link);
await other.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
const got = await other.evaluate(() => JSON.stringify({ ...window.dial_tool.S, ui_section: 0, ui_ring: 0, ui_hand: 0 }));
check(got === wanted, "opening the link elsewhere gives the same dial, every setting");
await other.goto(link.split("#")[0] + "#1.not-a-dial");
await other.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
check(await other.evaluate(() => window.dial_tool.S.rings.length > 0), "a broken link opens the tool anyway");
await other.close();
await page.click('button:text-is("Defaults")');
await page.waitForFunction(() => window.dial_tool.statik && window.dial_tool.S.ha_hour.round === 0);
await page.waitForTimeout(600);
const short = await page.evaluate(() => location.hash);
check(short.length < 12, `the starting dial's link is short (${short})`);
await page.evaluate((l) => { location.hash = l.split("#")[1]; }, link);
await page.waitForFunction(() => window.dial_tool.S.ha_hour.round === 2, null, { timeout: 5000 }).catch(() => {});
check(await S("S.ha_hour.round === 2"), "pasting a link into the open tool switches to that dial");

check(errors.length === 0, "no errors in the browser's console" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s).` : "\nWindow test passed.");
process.exit(problems.length ? 1 : 0);
