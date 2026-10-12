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
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true, reducedMotion: "reduce" });      // panes fold at once here; their slide has a check of its own
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
const tab = async (name) => { await page.click(`button[data-tab="${name}"]`); await frame(); };
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
const row_look = await page.$$eval(".ringlist li", (l) => l.map((e) => { const c = getComputedStyle(e); return (e.classList.contains("on") ? "on " : "") + c.borderTopWidth + " " + c.backgroundColor; }));
check(row_look.every((x) => x.includes("1px")) && row_look.filter((x) => x === "on 1px rgb(207, 228, 245)").length === 1, "every ring is a framed row; the selected one is light blue");
check(await page.$$eval(".ringlist input", (e) => e.length) === 0 && await page.$$eval(".ringlist .rename", (e) => e.length) === 1, "the ring list has no name fields: one rename box, on the selected ring");
const mine = await S("S.ui_ring"), other_ring = mine === 0 ? 1 : 0;
await page.click(`.ringlist li:nth-child(${other_ring + 1}) .name`);
check(await S(`S.ui_ring === ${other_ring}`) && await page.$$eval(".ringlist input", (e) => e.length) === 0, "a click on another ring's name selects it and renames nothing");
await page.click(`.ringlist li:nth-child(${mine + 1}) .name`);
await page.click(".ringlist li.on .rename");
await page.fill(".ringlist li.on input.name", "Edge");
await page.press(".ringlist li.on input.name", "Enter");
check(await S("S.rings[S.ui_ring].name === 'Edge'") && await page.textContent(".ringlist li.on span.name") === "Edge", "the rename box turns the name into a field; Enter keeps it: Edge");
await page.click(".ringlist li.on .rename");
await page.fill(".ringlist li.on input.name", "Nope");
await page.press(".ringlist li.on input.name", "Escape");
check(await S("S.rings[S.ui_ring].name === 'Edge'"), "Esc puts the old name back");
const was = await S("S.ui_ring");
await page.click("#ring-up");
check(await S(`S.rings[${was - 1}].name === 'Edge' && S.ui_ring === ${was - 1}`), "↑ Up moves it one place up the list");
await page.click("#ring-down");
check(await S(`S.rings[${was}].name === 'Edge' && S.ui_ring === ${was}`), "↓ Down moves it back");
await page.click("#ring-duplicate");
check(await S(`S.rings.length === ${before + 2} && S.rings[S.ui_ring].name === 'Edge copy'`), "Duplicate");
await page.click("#ring-delete");
check(await S(`S.rings.length === ${before + 1} && S.rings[S.ui_ring].name === 'Edge'`), "Delete removes the copy");
await page.click(".ringlist li.on button.eye");
await frame();
check(await S("S.rings[S.ui_ring].on === false && !t.items.some((i) => i.role === 'ring' && i.index === S.ui_ring)"), "the eye in the left column hides the ring in the preview");
check(await page.$$eval(".ringlist li.on.off .rename", (e) => e.length) === 0, "a hidden ring greys and loses its rename box");
await shot("4a-hidden-ring");
await page.click(".ringlist li.on button.eye");
check(await page.$$eval(".ringlist li.on .rename", (e) => e.length) === 1, "shown again: the rename box is back");
const eyes = await page.$$eval(".ringlist button.eye svg, .pinned button.fold .eye svg", (e) => [...new Set(e.map((x) => Math.round(x.getBoundingClientRect().left)))]);
check(eyes.length === 1, `ring eyes and pane eyes stand in one column (left edges: ${eyes.join(", ")})`);
check(await page.$$eval(".row.pick .pickt svg", (e) => e.length) >= 4, "Kind is a row of picture tiles");
await page.click("#ring-kind-Kind-0");
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
grip[2] = await page.$$eval(".ringlist li", (l) => l[1].getBoundingClientRect().top - l[0].getBoundingClientRect().top);      // from one row to the next
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

// ── guides: a switch on the preview's top right, with an arrow that drops their list (five kinds, eight colours) ──
await tab("Dial");
check(await page.$("main .guides #guides") !== null && await page.$(".panel #guides") === null && await page.isHidden("#guide-list"), "the Guides switch stands on the preview, not in the panel; its list is shut");
const guides_at = await page.evaluate(() => { const g = document.querySelector(".guides").getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(); return [Math.round(m.right - g.right), Math.round(g.top - m.top)]; });
check(guides_at[0] === 12 && guides_at[1] === 12, `it is 12 from the preview's top and right (${guides_at.join(" / ")})`);
await page.click("#guides-more");
check(await page.isVisible("#guide-list") && await page.$$eval("#guide-list .guidekind", (r) => r.length) === 5 && await page.$$eval("#guide-list .guidekind >> nth=0 >> .dots .tone", (b) => b.length) === 8 && await page.$$eval("#guide-list .dots .none", (b) => b.length) === 5 && await page.$("#guide-list .swatch") === null, "the arrow drops the list: five kinds of guide, each with None and eight round colours, no free colour");
const list_look = await page.evaluate(() => { const c = getComputedStyle(document.querySelector("#guide-list")), on = getComputedStyle(document.querySelector("#guide-list .tone.on")); return [c.backgroundColor, parseFloat(c.borderTopLeftRadius), on.borderTopLeftRadius, on.boxShadow.split("rgb").length - 1]; });
check(list_look[0] === "rgb(20, 20, 19)" && list_look[1] >= 12 && list_look[2] === "50%" && list_look[3] === 3, "the list is near black and round; the chosen colour is a disc in a thick ring of its own colour");
await page.fill("#global-gd-w-Thickness", "3");
await page.press("#global-gd-w-Thickness", "Enter");
await page.click("#guide-gd_axes");
await frame();
check(await S("t.items.filter((i) => i.role === 'guide' && i.px === 3).length > 0 && !t.items.some((i) => i.role === 'guide' && i.path.d.length === 2)"), "Guides: thickness 3, and None on centre lines takes them off the preview");
check(await page.$eval("#guide-gd_axes", (e) => e.classList.contains("on")) && await page.$$eval('#guide-list .guidekind:has-text("Centre lines") .tone.on', (b) => b.length) === 0, "None wears the mark; no colour does");
await page.click('#guide-list .guidekind:has-text("Centre lines") .tone >> nth=3');
await frame();
check(await S("S.gd_axes === true && S.gd_k_axes === 3"), "pressing a colour shows that kind again, in that colour");
await page.click("#guide-gd_axes");
await page.click('#guide-list .guidekind:has-text("Dial edge") .tone >> nth=0');
await frame();
check(await S("S.gd_k_edge === 0") && await page.$eval(".preview path[stroke]", (e) => e.getAttribute("stroke")) === "#ff2d95", "a colour pressed is the dial edge's: the first of the eight, at full strength");
await shot("4c-guides");
await page.click("#guides-reset");
await frame();
check(await S("S.gd_k_edge === 1 && S.gd_axes === true && S.gd_w === 1"), "Reset: the guides as they started");
await page.click("#guides");
await frame();
check(await S("!t.items.some((i) => i.role === 'guide')") && await page.isVisible("#guide-list"), "the Guides switch, off: none drawn; the list stays where it is");
await page.mouse.move(480, 30);
const one_colour = await page.evaluate(() => { const c = (q) => getComputedStyle(document.querySelector(q)); return [c("#guides").color, c("#guides svg").opacity, c("#guides-more").color, c("#guides").borderTopColor]; });
check(one_colour[0] === one_colour[2] && one_colour[0] === one_colour[3] && one_colour[1] === "1", `off, its sign, word, arrow and dashes are one colour (${one_colour[0]})`);
await page.mouse.click(480, 30);                      // the backdrop, off the dial
check(await page.isHidden("#guide-list"), "a press outside the list puts it away");
await page.click("#guides-more");
const looks = await page.evaluate(() => { const c = (q, p) => getComputedStyle(document.querySelector(q))[p]; return [c(".bar", "backgroundColor"), c(".bar", "color")]; });
check(looks[0] === "rgb(51, 51, 51)" && looks[1] === "rgb(242, 242, 238)", "the bar is 80 % black with light words");
await page.mouse.move(900, 400);
const off_look = await page.$eval("#guides", (e) => { const c = getComputedStyle(e); return [e.getAttribute("aria-pressed"), c.backgroundColor, e.textContent, c.borderTopStyle]; });
const off_line = await page.$eval("#guides", (e) => { const c = getComputedStyle(e); return [c.borderTopWidth, c.backgroundImage.split("linear-gradient").length - 1, c.borderTopColor]; });
check(off_look[0] === "false" && off_look[2] === "Guides" && off_look[3] === "dashed" && off_line[0] === "1px" && off_line[1] === 2 && off_line[2] === "rgb(92, 92, 88)", "off, its line is a hairline of two tones with no gaps: dashes as light as its word, a second tone under them");
await shot("4c3-guides-off");
await page.click("#guides");
await page.click("#guides-more");
await page.mouse.move(900, 400);
check(await S("S.guides === true && S.ui_section === 0") && await page.isHidden("#guide-list") && await page.$eval("#guides", (e) => { const c = getComputedStyle(e); return c.borderTopStyle + c.borderTopColor; }) === "solidrgb(17, 17, 17)", "pressed again it is on: a solid dark outline on a light backdrop");
// its colour follows the backdrop
await page.fill("#global-c-backdrop-Backdrop-hex", "#1A1A1F");
await page.press("#global-c-backdrop-Backdrop-hex", "Enter");
await frame();
check(await page.$eval("#guides", (e) => getComputedStyle(e).color) === "rgb(242, 242, 238)", "on a dark backdrop the switch is light");
await shot("4c4-guides-dark");
await page.fill("#global-c-backdrop-Backdrop-hex", "#CCCCC7");
await page.press("#global-c-backdrop-Backdrop-hex", "Enter");
// the Dial section: two panes, Dial (diameter, plate, background) and Page (margin, backdrop); no Guides pane
check(JSON.stringify(await page.$$eval(".form .pane h2", (h) => h.map((x) => x.textContent))) === '["Dial","Colours","Page"]' && await page.isVisible("#background-add"), "Dial has three panes: Dial, Colours and Page; Background is a button");
// units: a box at the panel's top right; lengths are shown and typed in the unit, kept in mm
const unit_box = async () => page.$eval("#unit", (e) => { const r = e.getBoundingClientRect(), row = document.querySelector(".form .row").getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height), Math.round(row.right - r.right)]; });
const as_mm = await unit_box();
check(as_mm[0] === "mm" && as_mm[3] === 0 && await page.isHidden("#unit-menu"), "the unit box says mm and ends on the panel's last column");
await page.click("#unit");
check(JSON.stringify(await page.$$eval("#unit-menu button span:first-child", (b) => b.map((x) => x.textContent))) === '["Millimetres","Points","Inches","Lignes"]', "its menu: millimetres, points, inches, lignes");
await page.click("#unit-in");
const as_in = await unit_box();
check(as_in[0] === "in" && as_in[1] === as_mm[1] && as_in[2] === as_mm[2] && await page.isHidden("#unit-menu"), `Inches: the box says in and keeps its size (${as_in[1]} × ${as_in[2]})`);
check(await page.inputValue("#global-dial-d-Diameter") === "1.181" && await S("S.dial_d") === 30, "a 30 mm diameter shows as 1.181; the setting is still 30");
await page.fill("#global-dial-d-Diameter", "1.5"); await page.press("#global-dial-d-Diameter", "Enter");
check(near(await S("S.dial_d"), 38.1, 1e-6), "1.5 typed in inches is 38.1 mm");
await page.click("#unit"); await page.click("#unit-pt");
check(await page.inputValue("#global-dial-d-Diameter") === "108.0", "in points it reads 108.0");
await shot("4b-units");
await page.click("#unit"); await page.mouse.click(480, 30);
check(await page.isHidden("#unit-menu"), "a press outside the menu puts it away");
await page.click("#unit"); await page.click("#unit-mm");
await page.fill("#global-dial-d-Diameter", "30"); await page.press("#global-dial-d-Diameter", "Enter");
// scale everything with the diameter: off, the rings stay; on, every measure follows, and comes back
const measures = () => S("[S.rings[0].r, S.rings[0].size, S.rings[1].len, S.ha_hour.len, S.ha_cap, S.rings[0].count, S.margin]");
const at_30 = await measures();
await page.fill("#global-dial-d-Diameter", "36"); await page.press("#global-dial-d-Diameter", "Enter");
check(JSON.stringify(await measures()) === JSON.stringify(at_30), "the diameter alone leaves rings and hands where they are");
await page.fill("#global-dial-d-Diameter", "30"); await page.press("#global-dial-d-Diameter", "Enter");
await page.check("#global-ui-scale-Scale-everything-with-it");
await page.fill("#global-dial-d-Diameter", "36"); await page.press("#global-dial-d-Diameter", "Enter");
const at_36 = await measures();
check(at_36.slice(0, 5).every((v, i) => near(v, at_30[i] * 1.2, 1e-4)) && at_36[5] === at_30[5] && at_36[6] === at_30[6], `with "scale everything" ticked, 30 → 36 makes radii, sizes, lengths and the cap 1.2× (count and margin stay)`);
await shot("4d-scaled");
for (const d of ["41.3", "22", "30"]) { await page.fill("#global-dial-d-Diameter", d); await page.press("#global-dial-d-Diameter", "Enter"); }
check(JSON.stringify(await measures()) === JSON.stringify(at_30), "36 → 41.3 → 22 → 30: everything is back exactly where it was");
await page.uncheck("#global-ui-scale-Scale-everything-with-it");
check(await page.evaluate(() => Math.round(document.querySelector(".row.nest .check").getBoundingClientRect().left) === Math.round(document.querySelector(".form .row.num input[type=range]").getBoundingClientRect().left)), "a nested question starts on the controls' column");
check(await S("!('ui_scale' in G_lean(S))".replace("G_lean(S)", "JSON.parse(JSON.stringify(S, (k, v) => (k.startsWith('ui_') ? undefined : v)))")), "the tick is the window's state, not the dial's");
// Colours: every coloured part in one list
const listed = await page.$$eval(".colourlist .row label", (l) => l.map((x) => x.textContent));
check(listed.length === await S("S.rings.length + 4 + [S.da_on, ...S.windows.map((w) => w.on)].filter(Boolean).length") && listed.join().includes("Hour hand,Minute hand,Seconds hand,Cap"), `Colours lists every ring, the hands, the cap and the windows that are on (${listed.join(" · ")})`);
await page.click("#colour-hand-second");
check(await page.textContent("#colour-pop h2") === "Seconds hand", "a swatch in the list opens the pop-out for that part");
await page.click("#pop-as-HEX"); await page.fill("#pop-hex", "#39FF14"); await page.press("#pop-hex", "Enter");
check(JSON.stringify(await S("S.ha_second.c.slice(0, 3).map((v) => Math.round(v * 255))")) === "[57,255,20]", "and sets its colour");
await page.fill("#pop-hex", "#CC381A"); await page.press("#pop-hex", "Enter");
await page.click("#pop-close");
// a band's sectors, one colour each
await tab("Rings");
await page.click("#add-band");
check(await page.isHidden("#sectors-same"), "a band of one piece has no sector colours");
await page.fill("#ring-count-Count", "6"); await page.press("#ring-count-Count", "Enter");
await page.fill("#ring-width-Band-width", "4"); await page.press("#ring-width-Band-width", "Enter").catch(() => {});
await frame();
const band = await S("S.ui_ring");
check(await page.$$eval(".form .colourlist .swatch", (b) => b.length) === 6, "six sectors: Sector colours shows six swatches");
await page.click(`#colour-ring-${band}-sector-1`);
check((await page.textContent("#colour-pop h2")).endsWith("sector 2"), "the second one opens the pop-out as “… · sector 2”");
check(await page.isVisible(".alpharow"), "a ring's colour has an opacity strip");
await page.fill("#pop-alpha", "50"); await page.press("#pop-alpha", "Enter");
await frame();
check(await S(`S.rings[${band}].cs["1"][3] === 0.5`) && await page.$eval(".preview path[fill-opacity='0.5']", (e) => e !== null) && await page.inputValue("#pop-alpha") === "50%", "opacity 50: the sector is half see-through in the preview");
await page.fill("#pop-alpha", "100"); await page.press("#pop-alpha", "Enter");
await page.fill("#pop-hex", "#0E2A47"); await page.press("#pop-hex", "Enter");
await page.click(`#colour-ring-${band}-sector-3`);
await page.fill("#pop-hex", "#0E2A47"); await page.press("#pop-hex", "Enter");
await frame();
const parts = await S(`t.items.filter((i) => i.role === 'ring' && i.index === ${band}).map((i) => [i.part, Math.round(i.fill[2] * 255)])`);
check(JSON.stringify(await S(`Object.keys(S.rings[${band}].cs)`)) === '["1","3"]' && parts.length === 2 && parts.some((p) => p[1] === 71), `two sectors navy: the band is drawn as two shapes, one per colour (${JSON.stringify(parts)})`);
await shot("4e-sectors");
await tab("Dial");
check(await page.$$eval(`.colourlist .swatch[id^="colour-ring-${band}-sector"]`, (b) => b.length) === 6, "Dial → Colours shows the band's six sectors too");
await tab("Rings");
await page.click("#sectors-same");
await frame();
check(await S(`Object.keys(S.rings[${band}].cs).length === 0 && t.items.filter((i) => i.role === 'ring' && i.index === ${band}).length === 1`), "All as the ring: one colour, one shape again");
await page.click("#ring-delete");
await tab("Dial");
// a line before and after every row: white on the scrolling grey, that grey on paper
const row_line = await page.$eval(".form .row.num", (e) => getComputedStyle(e).boxShadow);
check(row_line.split("rgb(255, 255, 255)").length === 3, "every row has a white hairline before and after it, on the grey");
await page.click('.form .fold:has-text("Dial")');
check(await page.isHidden("#global-dial-d-Diameter") && await page.isVisible("#global-margin-Page-margin"), "a heading folds its own group only");
check((await page.textContent('.form .fold:has-text("Dial") .summary')).includes("diameter 30.0"), "a folded pane says what it holds: diameter 30.0 …");
await page.click('.form .fold:has-text("Dial") .eye');
check(await page.isVisible("#global-dial-d-Diameter") && (await page.textContent('.form .fold:has-text("Dial") .summary')) === "", "its eye opens it again, and the summary goes");
// folding must not leave uneven gaps: folded panes stack line on line, whatever they hold
await tab("Hands");
const gaps = async () => page.$$eval(".form .pane", (h) => h.filter((e) => e.offsetParent).map((e, i, all) => (i ? Math.round(e.getBoundingClientRect().top - all[i - 1].getBoundingClientRect().top) : 0)).slice(1));
for (const name of ["Cap", "One hand", "Size"]) await page.click(`.form .fold:has-text("${name}") >> nth=0`);
const folded_gaps = await gaps();
check(folded_gaps[1] === 42 && folded_gaps[2] === 42, `folded panes in a row are 42 apart, and so is the open one after them (${folded_gaps.join(", ")})`);
for (const name of ["Cap", "One hand", "Size"]) await page.click(`.form .fold:has-text("${name}") >> nth=0`);
// All hands: one line, always in view — its name, the tick, the menu, on the columns
const bar_line = await page.evaluate(() => { const b = document.querySelector(".pinned .handsbar"), tops = [...b.children].map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)); const x = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left); return [Math.max(...tops) - Math.min(...tops), x(".handsbar .check") - x(".form .row.num input[type=range]"), b.querySelector("h2").textContent]; });
check(bar_line[0] <= 1 && bar_line[1] === 0 && bar_line[2] === "All hands", "All hands is one pinned line: name · Show hands · Motion, the tick on the controls' column");
await page.selectOption("#global-ha-beat-Motion", "1");
await page.uncheck("#global-ha-on-Show-hands");
await frame();
check(await S("S.ha_beat === 1 && S.ha_on === false && !t.items.some((i) => i.role === 'hand')"), "its menu and tick work: quartz, hands hidden");
await page.check("#global-ha-on-Show-hands"); await page.selectOption("#global-ha-beat-Motion", "0");
await shot("4f-hands-bar");
await tab("Dial");
// the columns: every slider, value and stepper starts on the same three lines
const lines = await page.$$eval(".form .row.num", (rows) => [...new Set(rows.filter((r) => r.offsetParent).map((r) => [...r.children].slice(1).map((c) => Math.round(c.getBoundingClientRect().left)).join("/")))]);
check(lines.length === 1, `number rows share their columns (${lines.join(" | ")})`);

// ── colour: a swatch opens the pop-out at its right; the value can be typed ──
await page.click("#global-c-plate-Plate");
const pop_at = await page.evaluate(() => { const p = document.querySelector("#colour-pop").getBoundingClientRect(), s = document.querySelector("#global-c-plate-Plate").closest(".colour").getBoundingClientRect(); return [Math.round(p.left - s.right), p.top < s.bottom && p.bottom > s.top]; });
check(await page.isVisible("#colour-pop") && pop_at[0] === 12 && pop_at[1], "the plate's swatch opens the colour pop-out, 12 to the right of its pill");
const pop_look = await page.evaluate(() => { const c = getComputedStyle(document.querySelector("#colour-pop")), pill = getComputedStyle(document.querySelector("#global-c-plate-Plate").closest(".colour")); return [c.backgroundColor, parseFloat(c.borderTopLeftRadius), parseFloat(pill.borderTopLeftRadius), document.querySelector("#global-c-plate-Plate-hex").closest(".colour") !== null]; });
check(pop_look[0] === "rgb(20, 20, 19)" && pop_look[1] >= 12 && pop_look[2] >= 6 && pop_look[3], "the pop-out is near black with round corners; a colour in the panel is a pill: a small swatch and its hex");
check(await page.isHidden(".alpharow"), "the plate has no opacity strip");
await page.mouse.click(200, 800);
check(await page.isHidden("#colour-pop"), "a press outside the pop-out puts it away");
await page.click("#global-c-plate-Plate");
await page.mouse.click(200, 800);
await page.click("#global-c-plate-Plate-hex");
check(await page.isVisible("#colour-pop") && await page.textContent("#colour-pop h2") === "Plate", "a click on the hex in the pill opens the pop-out too");
check(await page.$$eval("#pop-used button", (b) => b.length) >= 3 && await page.$$eval("#pop-palette button[data-colour]", (b) => b.length) === 10 && await page.isVisible('#pop-palette [data-colour="#0E2A47"]'), "first row: this dial's colours; second row: a palette of ten");
const one_row = await page.$$eval("#pop-palette button", (b) => new Set(b.map((x) => Math.round(x.getBoundingClientRect().top))).size);
check(one_row === 1, "the ten and their + stand in one row");
const sv = await page.$eval("#colour-pop .sv", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
await page.mouse.click(sv[0] + sv[2] * 0.5, sv[1] + sv[3] * 0.25);
const picked = await S("(() => { const [r, g, b] = S.c_plate, hi = Math.max(r, g, b), lo = Math.min(r, g, b); return [hi, (hi - lo) / hi]; })()");
check(near(picked[0], 0.75, 0.03) && near(picked[1], 0.5, 0.03), "a click in the colour field: half strength, three quarters bright");
const hue = await page.$eval("#colour-pop .hue", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
await page.mouse.click(hue[0] + hue[2] * 2 / 3, hue[1] + hue[3] / 2);
check(await S("S.c_plate[2] > S.c_plate[0] && S.c_plate[2] > S.c_plate[1]") && hue[3] >= 20, "a click two thirds along the hues: blue (the strip is 20 high or more)");
// add the colour in hand to the palette; it is kept by the browser; − takes it out
const in_hand = await S("document.querySelector('#global-c-plate-Plate-hex').value");
await page.click("#pop-add");
check(await page.$$eval("#pop-palette button[data-colour]", (b) => b.length) === 11 && await S(`JSON.parse(localStorage.getItem('dial-tool-palette')).includes('${in_hand}')`) && await page.textContent("#pop-add") === "−", "+ adds the colour in hand to the palette, kept by the browser; the + becomes −");
await page.click("#pop-add");
check(await page.$$eval("#pop-palette button[data-colour]", (b) => b.length) === 10, "− takes it out again");
await page.click("#pop-as-CMYK");
await page.fill("#pop-K", "100");
await page.press("#pop-K", "Enter");
await page.click("#pop-as-HEX");
check(JSON.stringify(await S("S.c_plate.slice(0, 3)")) === "[0,0,0]" && await page.inputValue("#pop-hex") === "#000000", "CMYK: K 100 is black, and HEX says #000000");
await page.click("#pop-as-RGB");
await page.fill("#pop-R", "255");
await page.press("#pop-R", "Enter");
check(await page.inputValue("#global-c-plate-Plate-hex") === "#FF0000", "RGB: R 255 → #FF0000");
const one_line = await page.evaluate(() => { const tops = [...document.querySelectorAll("#colour-pop .asnumbers button, #colour-pop .asnumbers input")].map((e) => Math.round(e.getBoundingClientRect().top)); const c = getComputedStyle(document.querySelector("#pop-copy")); return [new Set(tops).size, c.textTransform, document.querySelector("#pop-copy").textContent]; });
check(one_line[0] === 1 && one_line[2] === "COPY", "RGB · CMYK · HEX, the values and COPY stand on one line, in capitals");
const pop_size = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
const chip_gaps = await page.$$eval("#pop-palette button", (b) => { const r = b.map((x) => x.getBoundingClientRect()); return [Math.round(r[1].left - r[0].right), Math.round(r[0].width * 10) / 10, Math.round(r[0].height * 10) / 10]; });
check(chip_gaps[0] === 12 && chip_gaps[1] === chip_gaps[2] && chip_gaps[1] < 22, `the chips stand 12 apart and share the row: ${chip_gaps[1]} square`);
// its head drags it; the square widens it over the preview and back
const pop_before = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width]; });
await page.mouse.move(pop_before[0] + 60, pop_before[1] + 20);
await page.mouse.down();
await page.mouse.move(pop_before[0] + 260, pop_before[1] + 120, { steps: 4 });
await page.mouse.up();
const pop_moved = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top]; });
check(Math.round(pop_moved[0] - pop_before[0]) === 200 && Math.round(pop_moved[1] - pop_before[1]) === 100, "dragged by its head it moves with the pointer");
await page.click("#pop-wide");
const twice = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.width, r.height, r.right <= innerWidth && r.bottom <= innerHeight]; });
check(Math.round(twice[0]) === 2 * Math.round(pop_before[2]) && near(twice[1], 2 * pop_size[1], 2) && twice[2], `its square makes it twice the size: ${Math.round(twice[0])} × ${Math.round(twice[1])}, inside the window`);
await shot("4c2-picker-wide");
await page.click("#pop-wide");
const pop_back = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
check(pop_back[0] === pop_before[2] && near(pop_back[1], pop_size[1], 1), "and back to its own size");
await shot("4c1-picker");
await page.click('#colour-pop [data-colour="#0E2A47"]');
check(JSON.stringify(await S("S.c_plate.map((v) => Math.round(v * 255))")) === "[14,42,71,255]" && await page.inputValue("#global-c-plate-Plate-hex") === "#0E2A47", "picking navy sets the plate, and the value shows as text");
await page.fill("#global-c-plate-Plate-hex", "ede8db");
await page.press("#global-c-plate-Plate-hex", "Enter");
check(JSON.stringify(await S("S.c_plate.map((v) => Math.round(v * 255))")) === "[237,232,219,255]", "a typed value sets it too");
await page.click("#global-c-plate-Plate");
await shot("4c2-colour");
check(await page.$$eval(".tabs button", (b) => b.map((x) => x.textContent.trim()).join(" ")) === "Dial Rings Hands Windows Export" && await page.$("main button.guidesbox#guides svg") !== null, "tabs: Export last; Guides is a rounded switch with a bullseye at the top right");

// ── windows: up to four, each a date, a day, am · pm or a moon phase ──
await tab("Date");
const kinds = [["2", "1", "9"], ["3", "2", "6"], ["4", "3", "12"]];          // window, kind, position
for (const [n, kind, at] of kinds) {
  await page.click(`.segs button:text-is("${n}")`);
  await page.check("#window-on-Show-this-window");
  await page.click("#window-kind-Shows-" + kind);
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

// ── fonts: only the ring's font shows in Type; the list is a sheet over the panel ──
await click_mm(...clock(10, 120));
check(await page.$$eval(".form .fontrow", (rows) => rows.length) === 1 && await page.$$eval(".form select#font-family", (e) => e.length) === 0, "Type shows one font, the selected one, and no dropdowns");
await page.click("#font-current");
check(await page.$eval("#font-picker", (d) => d.open) && await page.$eval("#font-picker", (d) => { const r = d.getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(); return r.right <= m.left + 1; }), "pressing it opens the font sheet over the panel, beside the dial");
check(await page.$$eval('#font-picker .fontrow[data-group="list"]', (rows) => rows.length) === 20 && await page.$$eval('#font-picker .fontrow[data-group="list"] .sample svg path', (p) => p.length) === 20, "the sheet lists the tool's twenty families, each showing numerals in its own outlines");
await page.click('.fontrow[data-family="Jost"]');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Jost-Regular" && document.querySelector("#axis-wght"), null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Jost-Regular'") && await page.$("#axis-wght") !== null && await page.$eval("#font-picker", (d) => d.open), "click Jost: fetched and drawn, the sheet stays open to compare");
await page.click('.fontrow[data-family="Josefin Sans"]');
await page.waitForFunction(() => window.dial_tool.ring().family === "Josefin Sans");
check(await S("S.rings[S.ui_ring].axes.wght === 400"), "a variable font that rests at Thin starts at regular weight");
await shot("5a-font-sheet");

// add fonts: a Google Fonts link (served here from this machine: the test needs no network)
const meta = (name, file, ps) => `name: "${name}"\nlicense: "OFL"\nfonts {\n  name: "${name}"\n  style: "normal"\n  weight: 400\n  filename: "${file}"\n  post_script_name: "${ps}"\n  full_name: "${name} Regular"\n}\nfonts {\n  name: "${name}"\n  style: "italic"\n  weight: 400\n  filename: "Italic.ttf"\n  post_script_name: "${ps}Italic"\n  full_name: "${name} Italic"\n}\n`;
const asked_for = [];
await context.route("https://raw.githubusercontent.com/google/fonts/main/**", (route) => {
  const path_ = decodeURIComponent(route.request().url().split("/main/")[1]);
  asked_for.push(path_);
  const cors = { "access-control-allow-origin": "*" };
  if (path_ === "ofl/lora/METADATA.pb") return route.fulfill({ body: meta("Lora", "Lora[wght].ttf", "Lora-Regular"), headers: cors });
  if (path_ === "ofl/lora/Lora[wght].ttf") return route.fulfill({ path: "/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf", headers: cors });
  return route.fulfill({ status: 404, body: "404: Not Found", headers: cors });
});
await page.fill("#font-link", "https://fonts.google.com/specimen/Lora?preview.text=12");
await page.click("#font-add");
await page.waitForFunction(() => window.dial_tool.ring().family === "Lora" && window.dial_tool.statik, null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Lora-Regular'") && asked_for.includes("ofl/lora/Lora[wght].ttf") && !asked_for.includes("ofl/lora/Italic.ttf"), "a Google Fonts page link adds the family's upright fonts and uses it");
check((await page.textContent("#picker-note")).includes("Added Lora") && await page.$('#font-picker .fontrow[data-family="Lora"][data-group="added"] .sample svg') !== null && await S("JSON.parse(localStorage.getItem('dial-tool-fonts')).some((f) => f.ps === 'Lora-Regular' && f.url.includes('raw.githubusercontent.com'))"), "the sheet says so; Lora is listed under Added by you with its numerals, and this browser remembers where it came from");
await page.fill("#font-link", "Nonesuch Grotesk");
await page.press("#font-link", "Enter");
await page.waitForFunction(() => document.querySelector("#picker-note").textContent.includes("no family"), null, { timeout: 8000 }).catch(() => {});
check((await page.textContent("#picker-note")).includes("no family spelled"), "a name Google Fonts doesn't have is answered plainly");
await page.fill("#font-link", "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap");
await page.press("#font-link", "Enter");
await page.waitForFunction(() => document.querySelector("#picker-note").textContent.includes("Added Lora"), null, { timeout: 8000 }).catch(() => {});
check((await page.textContent("#picker-note")).includes("Added Lora"), "an embed link (fonts.googleapis.com/css2?family=…) works too");
errors.length = 0;                                   // the three "not found" answers above are the browser's, and expected

// a font file
await page.setInputFiles("#font-file", "/usr/share/fonts/truetype/google-fonts/Poppins-Light.ttf");
await page.waitForFunction(() => window.dial_tool.ring().ps === "Poppins-Light", null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Poppins-Light'") && (await page.textContent("#picker-note")).includes("Added Poppins"), "a font file is added and used");
await page.click('#font-picker .fontrow[data-family="Lora"]');
await page.waitForFunction(() => window.dial_tool.ring().family === "Lora");
await page.click("#font-done");
check(await page.$eval("#font-picker", (d) => !d.open) && (await page.textContent("#font-current .name")) === "Lora" && await page.$("#font-current .sample svg") !== null, "Done closes the sheet; Type shows Lora with its numerals");
await frame();
check(await page.$("#axis-wght") !== null, "Lora's weight axis has a slider");
const light = await S("t.statik.rings.find((d) => d.kind === 'numerals').path.svg(3).length");
await page.fill("#axis-wght", "700");
await page.press("#axis-wght", "Enter");
await frame();
check(await S("S.rings[S.ui_ring].axes.wght === 700") && (await S("t.statik.rings.find((d) => d.kind === 'numerals').path.svg(3).length")) !== light, "weight 700 changes the numerals' outlines");
const wide = await S("(() => { const b = t.statik.rings.find((d) => d.kind === 'numerals').parts[0].bounds(); return b[2] - b[0]; })()");
await page.click("#feature-tnum");
await frame();
const tab_w = await S("(() => { const b = t.statik.rings.find((d) => d.kind === 'numerals').parts[0].bounds(); return b[2] - b[0]; })()");
check(await S("S.rings[S.ui_ring].features.tnum === true") && tab_w !== wide, "the tnum feature (tabular figures) changes the width of “12”");
check(await page.getAttribute("#feature-tnum", "aria-pressed") === "true", "the feature's tile shows as pressed");
await page.click("#feature-tnum");
check(await S("!('tnum' in S.rings[S.ui_ring].features)"), "switching a feature back to the font's default stores nothing (R12)");
await shot("5-type");

// styles as buttons; the fonts on this computer
await page.click("#font-current");
await page.click('#font-picker .fontrow[data-family="Barlow"]');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Barlow-Regular");
await page.click("#font-done");
await page.click('.font .styles button:text-is("Bold")');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Barlow-Bold", null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Barlow-Bold'"), "Barlow's styles are buttons under the font: Bold");
await page.click("#font-current");
if (await page.evaluate(() => "queryLocalFonts" in window)) {
  await page.click("#local-fonts");
  await page.waitForFunction(() => [...window.dial_tool.catalog.values()].some((f) => f.data), null, { timeout: 15000 }).catch(() => {});
  const listed = await S("[...t.catalog.values()].filter((f) => f.data).length");
  check(listed > 5, `Installed fonts: ${listed} listed`);
  const pick = await S("[...t.catalog.values()].find((f) => f.data && /Liberation Sans$/.test(f.family) && /^Regular$/.test(f.style))?.family || [...t.catalog.values()].find((f) => f.data).family");
  await page.fill("#font-find", pick.slice(0, 6));
  await page.click(`#font-picker .fontrow[data-family="${pick}"]`);
  await page.waitForFunction((f) => window.dial_tool.ring().family === f && window.dial_tool.statik, pick);
  await frame();
  check(await S("S.rings[S.ui_ring].family") === pick && !(await page.textContent("#font-note")).includes("stands in"), `Find narrows the list; a font installed on this computer (${pick}) draws the numerals`);
} else check(false, "this browser has no queryLocalFonts");
await shot("6-local-font");
await page.click("#font-done");

// ── the ring's main rows stay in view while the rest scrolls ──
await page.$eval(".form", (e) => { e.scrollTop = 99999; });
check(await page.$eval("#ring-kind-Kind-0", (e) => { const r = e.getBoundingClientRect(), p = document.querySelector(".panel").getBoundingClientRect(); return r.top > p.top && r.bottom < p.bottom && e.closest(".pinned") !== null; }), "Kind, Colour and radius stay in view when the rows are scrolled to the end");
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
await page.click("#speed-60");
await page.click("#play");
await page.waitForTimeout(600);
const t2 = await S("S.t");
await page.click("#play");
check(t2 - t1 > 24 && t2 - t1 < 90 && await page.getAttribute("#speed-60", "aria-checked") === "true", `60×: a minute every second (${(t2 - t1).toFixed(0)} s in 0.6 s)`);
await page.click("#speed-1");
const z1 = await S("t.z");
await page.click("#zoom-in");
check(near(await S("t.z") / z1, 1.4, 0.01), "the + in the bar zooms in by 1.4");
await page.click("#zoom-out");
await page.click("#fit");
// the day slider's steps: a click on a step, or on the slider near one, goes exactly there; 10:10 is one of them
await page.click('.steps12 button:text-is("3")');
check(await S("S.t === 3 * 3600") && await page.inputValue("#time") === "3:00:00", "the step 3 under the day slider: three o'clock sharp");
await page.click(".steps12 button.special");
check(await S("S.t === 10 * 3600 + 600") && await page.$eval(".steps12 button.special", (e) => e.classList.contains("on")), "the 10:10 step: ten past ten");
const track = await page.$eval("#time-slider", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top + r.height / 2, r.width]; });
const cut = 60 * +(await page.getAttribute(".ruler", "data-minutes"));
check(cut < 3600 && await page.$$eval(".ruler path", (p) => p.length) >= 4, `the ruler cuts each hour (every ${cut / 60} minutes at this width)`);
await page.mouse.click(track[0] + 1.5 + (track[2] - 3) * 0.503, track[1]);
check(await S("S.t === 6 * 3600"), `a click on the ruler just past the middle snaps to six o'clock (${await S("S.t")})`);
await page.mouse.click(track[0] + 1.5 + (track[2] - 3) * (6 * 3600 + cut * 1.2) / 43200, track[1]);
check(await S(`S.t === 6 * 3600 + ${cut}`), `a click near the next cut snaps to it (${await S("S.t")})`);
const drag_from = track[0] + 1.5 + (track[2] - 3) * (6 * 3600 + cut) / 43200;
await page.mouse.move(drag_from, track[1]); await page.mouse.down(); await page.mouse.move(drag_from + 41, track[1], { steps: 4 }); await page.mouse.up();
check(await S(`S.t % ${cut} !== 0 && S.t > 6 * 3600`), `a drag does not snap (${await S("S.t")})`);
await page.setViewportSize({ width: 2200, height: 900 });
await frame();
const finer = 60 * +(await page.getAttribute(".ruler", "data-minutes"));
check(finer < cut, `on a wider window the ruler is cut finer (every ${finer / 60} minutes at 2200 wide)`);
await page.setViewportSize({ width: 1440, height: 900 });
await frame();
const under = await page.evaluate(() => { const l = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left), row = document.querySelector(".form .row.num") || document.querySelector(".row.num"); return { play: l("#play"), col: Math.round(row.getBoundingClientRect().left), now_right: Math.round(document.querySelector("#now").getBoundingClientRect().right), row_right: Math.round(row.getBoundingClientRect().right) }; });
check(under.play === under.col && under.now_right === under.row_right, `under the panel the time controls start and end with the six columns (${JSON.stringify(under)})`);
const pane_lines = await page.$$eval(".form .pane", (h) => h.filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().left) + "/" + Math.round(e.querySelector(".eye svg").getBoundingClientRect().left)));
check(pane_lines.length > 0 && pane_lines.every((x) => x === "24/26"), `a pane's line starts at the margin, over its eye, which stands 2 further in (${pane_lines[0]})`);
// the bar keeps the columns: widths of one or two columns, and the Guides switch ends on the panel's last column
const fits = await page.evaluate(() => { const w = (q) => Math.round(document.querySelector(q).getBoundingClientRect().width), r = (q) => Math.round(document.querySelector(q).getBoundingClientRect().right); return { play: w("#play"), speeds: w(".speeds"), time: w("#time"), now: w("#now"), zooms: w(".zooms"), fit: w("#fit"), side: Math.round(document.querySelector("#panel-toggle").getBoundingClientRect().left + 13) }; });
check(fits.play === 54 && fits.now === 54 && fits.zooms === 54 && fits.fit === 54 && fits.speeds === 120 && fits.time === 120 && fits.side === 32, `the bar fits the columns (${JSON.stringify(fits)})`);
await shot("7b-bar");
await page.fill("#time", "3:20:10");
await page.press("#time", "Enter");
check(await S("S.t === 3 * 3600 + 20 * 60 + 10"), "typed time 3:20:10");

// ── files: PDF, SVG, PNG, save, load ──
await tab("Export");
const size_mm = await S("S.dial_d + 2 * S.margin");
const await_ring_name = await S("S.rings.find((r) => r.on).name");
const pdf = await download("#export-pdf");
const pdf_text = fs.readFileSync(pdf, "latin1");
const box_pt = /MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf_text);
check(pdf_text.startsWith("%PDF-1.5") && box_pt && near(+box_pt[1] / 72 * 25.4, size_mm, 0.001), `PDF: page ${(box_pt[1] / 72 * 25.4).toFixed(2)} mm = dial + margins (${size_mm} mm)`);
check(!/ S\n| re\n|BT\n/.test(pdf_text) && (pdf_text.match(/\nf\n/g) || []).length >= 8, "PDF: filled paths only, no strokes or text (R4, R5)");
const layer_names = (pdf_text.match(/\/Type \/OCG \/Name <FEFF([0-9A-F]+)>/g) || []).map((x) => (/<FEFF([0-9A-F]+)>/.exec(x)[1].match(/.{4}/g) || []).map((h) => String.fromCharCode(parseInt(h, 16))).join(""));
check(layer_names.includes("Plate") && layer_names.includes("Hour hand") && layer_names.some((n) => n === await_ring_name) && (pdf_text.match(/ BDC\n/g) || []).length === layer_names.length,
  `PDF: every part is a layer with its name (${layer_names.join(" · ")})`);
check(/^dial-[\d.]+mm-\d{4}-\d\d-\d\d\.pdf$/.test(path.basename(pdf)), `the file says what it is: ${path.basename(pdf)}`);
const svg = await download("#export-svg");
const svg_text = fs.readFileSync(svg, "utf8");
const svg_ids = (svg_text.match(/ id="[^"]+"/g) || []).map((x) => x.slice(5, -1));
check(svg_ids.includes("plate") && svg_ids.includes("hour-hand") && new Set(svg_ids).size === svg_ids.length && !/scale\(1 1\)/.test(svg_text), `SVG: shapes are named after what they are, each name once (${svg_ids.slice(0, 6).join(", ")} …)`);
check(svg_text.includes(`width="${size_mm}mm"`) && !svg_text.includes("stroke=") && (svg_text.match(/<path/g) || []).length >= 8, "SVG: true size in mm, no guides");
// live text: the numerals stay text, each where its outline was
await page.check("#global-out-live-text-Keep-numerals-as-text-in-the-SVG");
const live_text = fs.readFileSync(await download("#export-svg"), "utf8");
fs.writeFileSync(path.join(OUT, "dial-live.svg"), live_text);
const numerals = await S("(() => { const d = t.statik.rings.find((d) => d.kind === 'numerals'); if (!d) return null; const b = d.parts[0].bounds(); return { n: d.parts.length, c: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], mode: d.ring.mode, family: d.ring.family }; })()");
if (numerals) {
  const texts = live_text.match(/<text [^>]*>[^<]*<\/text>/g) || [];
  const first = /translate\(([-\d.]+) ([-\d.]+)\) rotate/.exec(texts.find((x) => x.includes("rotate(")) || "");
  check(texts.length >= numerals.n && texts[0].includes(`font-family="${numerals.family}"`), `SVG with live text: ${texts.length} texts in ${numerals.family}`);
  if (numerals.mode === 0) check(first && near(+first[1], numerals.c[0], 0.01) && near(+first[2], -numerals.c[1], 0.01), "the first numeral's text stands where its outline's centre is");
}
check((live_text.match(/<path/g) || []).length >= 6 && !svg_text.includes("<text"), "everything else stays outlines; without the tick there is no text");
await page.uncheck("#global-out-live-text-Keep-numerals-as-text-in-the-SVG");
check(await page.$eval(".row:has(#export-png)", (r) => r.querySelector("input[type=range]") !== null) && /dpi = \d+ × \d+ px/.test(await page.textContent("#png-size")), "the PNG button shares a row with its dpi, and says what that comes to");
const png = await download("#export-png");
const want_px = Math.round(size_mm / 25.4 * await S("S.out_dpi"));
const png_bytes = fs.readFileSync(png);
check(png_bytes.readUInt32BE(16) === want_px && png_bytes.readUInt32BE(20) === want_px, `PNG: ${want_px} × ${want_px} px at ${await S("S.out_dpi")} dpi`);
const phys = png_bytes.indexOf("pHYs");
check(phys === 37 && near(png_bytes.readUInt32BE(phys + 4) * 0.0254, await S("S.out_dpi"), 0.5) && png_bytes.readUInt32BE(phys - 4) === 9, `PNG: its dpi is written in the file (${(png_bytes.readUInt32BE(phys + 4) * 0.0254).toFixed(1)}), so it opens at true size`);
// a production mask: grey ink only in the PDF, and black on white (not on nothing) in the PNG
await page.check("#global-out-production-Mono-print-mask");
const mask_pdf = await download("#export-pdf");
const mask_text = fs.readFileSync(mask_pdf, "latin1");
check(/\n0 g\n/.test(mask_text) && !/ rg\n/.test(mask_text) && path.basename(mask_pdf).includes("-mask-"), `a mask's PDF is in grey ink (0 g), no RGB black: ${path.basename(mask_pdf)}`);
const mask_png = await download("#export-png");
const corner = await page.evaluate(async (b64) => { const i = new Image(); i.src = "data:image/png;base64," + b64; await i.decode(); const c = document.createElement("canvas"); c.width = c.height = 4; const x = c.getContext("2d"); x.drawImage(i, 0, 0); return [...x.getImageData(0, 0, 1, 1).data]; }, fs.readFileSync(mask_png).toString("base64"));
check(corner.join() === "255,255,255,255", "a mask's PNG has a white ground");
await page.uncheck("#global-out-production-Mono-print-mask");
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
check(await page.inputValue("#link") === link && (await page.$eval("#log", (e) => getComputedStyle(e).fontFamily)).toLowerCase().includes("mono"), "the link is spelled out above its Copy button; the log is monospaced");
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

// ── nothing jumps: a click on the preview keeps the rows; panes slide; the Guides switch keeps its size ──
await tab("Rings");
await page.click(".ringlist li >> nth=2");
await page.$eval(".form", (e) => { e.scrollTop = 180; });
await page.evaluate(() => { window.__row = document.querySelector(".form .row"); });
await page.click(".swatch");
await click_mm(0, 10);                               // a numeral, in the section that is showing
const kept = await page.evaluate(() => ({ same_rows: window.__row === document.querySelector(".form .row"), scroll: document.querySelector(".form").scrollTop, picker: document.querySelector("#colour-pop").hidden, ring: window.dial_tool.ring().name, list: document.querySelector(".ringlist li.on .name").textContent }));
check(kept.same_rows && kept.scroll === 180 && kept.picker && kept.ring === kept.list, `a click on the preview keeps the rows, their scroll (${kept.scroll}) and selects ${kept.ring}; the colour pop-out, pressed outside of, is put away`);
await page.click(".swatch");
await tab("Hands"); await page.$eval(".form", (e) => { e.scrollTop = 120; }); await tab("Dial"); await tab("Hands");
check(await page.$eval(".form", (e) => e.scrollTop) === 120, "a section is back where it was scrolled to");
await page.$eval(".form", (e) => { e.scrollTop = 0; });
await tab("Dial");
const guides_w = [];
for (let i = 0; i < 2; i++) { guides_w.push(await page.$eval("#guides", (e) => e.getBoundingClientRect().width)); await page.click("#guides"); await frame(); }
check(guides_w[0] === guides_w[1], `the Guides switch is the same width on and off (${guides_w.join(" / ")})`);
check(await page.$eval("#global-dial-d-Diameter-slider", (e) => { const p = +e.style.getPropertyValue("--p"); return Math.abs(p - (e.value - e.min) / (e.max - e.min)) < 0.001 && getComputedStyle(e).appearance === "none"; }), "a slider knows how far along it is: its track is filled up to the handle");
await page.emulateMedia({ reducedMotion: "no-preference" });
const heights = await page.evaluate(async () => {
  const pane = [...document.querySelectorAll(".form .pane")].find((p) => !p.hidden && !p.classList.contains("folded")), body = pane.querySelector(".body"), next = pane.nextElementSibling;
  const open = body.offsetHeight, top0 = next.getBoundingClientRect().top, seen = [];
  pane.querySelector(".fold").click();
  for (let i = 0; i < 60 && (body.getAnimations().length || !i); i++) { await new Promise((r) => requestAnimationFrame(r)); seen.push(Math.round(body.getBoundingClientRect().height)); }
  const shut = { hidden: body.hidden, moved: Math.round(top0 - next.getBoundingClientRect().top) };
  pane.querySelector(".fold").click();
  await new Promise((r) => setTimeout(r, 400));
  return { open, between: seen.filter((h) => h > 0 && h < open).length, shut, again: body.offsetHeight };
});
check(heights.between >= 2 && heights.shut.hidden && heights.shut.moved === heights.open && heights.again === heights.open, `a pane slides shut and open: ${heights.between} steps on the way, and what is under it moves by exactly its height (${heights.shut.moved} = ${heights.open})`);
await page.emulateMedia({ reducedMotion: "reduce" });
check(errors.length === 0, "no errors in the browser's console" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
// ── the panel put away, and a phone ──
await page.click("#panel-toggle");
await frame();
check(await page.isHidden(".panel") && await page.$eval(".preview", (e) => e.getBoundingClientRect().left) < 2, "the square in the bar puts the panel away: the dial has the whole window");
await shot("10-no-panel");
await page.click("#panel-toggle");
check(await page.isVisible(".panel"), "and brings it back");
await page.setViewportSize({ width: 390, height: 844 });
await tab("Rings");
await frame();
const narrow = await page.evaluate(() => ({ wide: document.documentElement.scrollWidth, eye: document.querySelector(".form button.fold .eye").getBoundingClientRect().left, bar: document.querySelector(".bar").getBoundingClientRect().top }));
check(narrow.wide <= 390 && narrow.eye >= 0 && narrow.bar === 0, "a phone: nothing wider than the screen, the eyes in view, the bar on top");
await shot("11-phone");
await page.click('.form .fold:visible >> nth=0');
await shot("11b-phone-folded");
await page.click('.form .fold:visible >> nth=0');
await page.setViewportSize({ width: 1440, height: 900 });

// ── under a finger: small controls are pressed from a little outside their edge too ──
const touch = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const pad = await touch.newPage();
await pad.goto("file://" + process.cwd() + "/dial-tool.html");
await pad.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
await pad.tap("#guides-more");
const reach = await pad.evaluate(() => {
  const dots = [...document.querySelectorAll("#guide-list .guidekind:nth-child(2) .tone")], a = dots[2].getBoundingClientRect(), b = dots[3].getBoundingClientRect();
  const at = (x, y) => document.elementFromPoint(x, y);
  return { coarse: matchMedia("(pointer: coarse)").matches, size: a.width, left: at(a.left - 5, a.top + a.height / 2) === dots[2], above: at(a.left + a.width / 2, a.top - 10) === dots[2], nearer_next: at(b.left - 5, b.top + b.height / 2) === dots[3] };
});
check(reach.coarse && reach.left && reach.above && reach.nearer_next, `under a finger a ${reach.size} dot is pressed from 5 beside it and 10 above it; nearer the next dot, the next one is`);
await pad.touchscreen.tap(...await pad.$eval('#guide-list .guidekind:nth-child(2) .tone:nth-child(5)', (e) => { const r = e.getBoundingClientRect(); return [r.left - 4, r.top - 8]; }));
check(await pad.evaluate(() => window.dial_tool.S.gd_k_axes === 3), "a tap just outside a dot chooses it");
await pad.tap("#global-c-plate-Plate-hex");
const chip_reach = await pad.evaluate(() => { const c = [...document.querySelectorAll("#pop-palette button")], r = c[4].getBoundingClientRect(); return [document.elementFromPoint(r.left - 4, r.top + 4) === c[4], document.querySelector("#global-c-plate-Plate-hex").readOnly, !document.querySelector("#colour-pop").hidden]; });
check(chip_reach.every(Boolean), "the hex in a pill opens the pop-out and isn't typed in; a chip is pressed from 4 beside it");
await pad.screenshot({ path: path.join(OUT, "12-touch.png") });
await touch.close();

await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s).` : "\nWindow test passed.");
process.exit(problems.length ? 1 : 0);
