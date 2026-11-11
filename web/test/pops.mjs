// pops.mjs — an audit, not part of npm test (about 3 minutes): every opener the page shows is pressed — menus, +, cogs, swatches,
// pills — in every tab of both modes, with the rehaut, the bezel and the hand functions on, and what opens is asked two things:
// is it inside the window, and is it on top at fifteen of its points (the page's own elementFromPoint). A list cut by the panel's
// scrolling list, or lying under the bar, shows here as "under …" (Okay, 11 Nov 2026: "dropdowns behind ui elements").
//   cd web && node build.mjs && node test/pops.mjs [width height]      default 1180 820, an iPad on its side
import { chromium } from "playwright";
const [W = 1180, H = 820, FILE = "dial-tool.html"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("page error:", e.message.slice(0, 200)));
await page.addInitScript(() => { setTimeout(() => { if (!localStorage.getItem("dial-tool-last")) localStorage.setItem("dial-tool-last", "{}"); if (!localStorage.getItem("dial-tool-folds")) localStorage.setItem("dial-tool-folds", '{"*":false}'); }, 0); });
await page.goto("file://" + process.cwd() + "/" + FILE);
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik); await page.waitForTimeout(400);
let seen = 0; const wrong = new Set();
const floats = () => page.evaluate(() => { const out = []; document.querySelectorAll("body *").forEach((e) => { const cs = getComputedStyle(e); if ((cs.position === "absolute" || cs.position === "fixed") && e.offsetWidth > 40 && e.offsetHeight > 40 && cs.visibility !== "hidden" && cs.pointerEvents !== "none" && !e.closest("svg")) { if (!e.dataset.pp) e.dataset.pp = "p" + Math.random().toString(36).slice(2, 8); out.push(e.dataset.pp); } }); return out; });
const visit = async (where) => {
  const ids = await page.evaluate(() => [...document.querySelectorAll('select, [aria-expanded="false"], [aria-haspopup], .plus, .kind, .cog, .pill, .swatch')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !b.disabled && !b.closest("#menu-list, .irisbox"); }).map((b, i) => (b.dataset.op = "o" + i, "o" + i)));
  for (const id of ids) {
    const at = await page.evaluate((id) => { const s = document.querySelector(`[data-op="${id}"]`); if (!s || !s.isConnected || !s.offsetWidth) return null; const sc = s.closest(".form"); if (sc) { const r0 = s.getBoundingClientRect(), f = sc.getBoundingClientRect(); if (r0.top < f.top || r0.bottom > f.bottom) sc.scrollTop += r0.top - f.top - f.height / 2; } const r = s.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2, top = document.elementFromPoint(x, y); return { x, y, name: (s.id || s.className || s.tagName) + (s.textContent ? " “" + s.textContent.trim().slice(0, 14) + "”" : ""), reach: Boolean(top && (top === s || s.contains(top) || top.contains(s) || top.closest("label, .menubox")?.contains(s))), topis: top ? top.tagName + "." + String(top.className).slice(0, 30) : "none" }; }, id);
    if (!at) continue;
    if (!at.reach) { wrong.add(`COVERED  ${where} · ${at.name}: under ${at.topis}`); continue; }
    const before = new Set(await floats());
    await page.mouse.click(at.x, at.y); await page.waitForTimeout(90);
    const after = (await floats()).filter((p) => !before.has(p));
    seen++;
    for (const p of after) {
      const r = await page.evaluate((p) => { const l = document.querySelector(`[data-pp="${p}"]`); if (!l) return null; const b = l.getBoundingClientRect(), out = []; let n = 0;
        for (const fx of [0.04, 0.5, 0.96]) for (const fy of [0.04, 0.3, 0.5, 0.7, 0.96]) { n++; const x = b.left + b.width * fx, y = b.top + b.height * fy; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { out.push(`outside the window at ${Math.round(x)},${Math.round(y)}`); continue; } const e = document.elementFromPoint(x, y); if (e && !l.contains(e) && !e.contains(l) && !e.closest("#menu-list, .colourpop")) out.push(`${Math.round(fx * 100)}/${Math.round(fy * 100)} under ${e.tagName}.${String(e.className).slice(0, 34)}`); }
        return { name: (l.id || l.className), out, n, box: [b.left, b.top, b.width, b.height].map(Math.round) }; }, p);
      if (r && r.out.length) wrong.add(`BEHIND   ${where} · ${at.name} → ${String(r.name).slice(0, 30)} [${r.box}] ${r.out.length}/${r.n}: ${r.out.slice(0, 3).join("; ")}`);
    }
    await page.keyboard.press("Escape"); await page.waitForTimeout(40);
    const still = (await floats()).filter((p) => !before.has(p));
    if (still.length) { await page.mouse.click(at.x, at.y); await page.waitForTimeout(60); if ((await floats()).filter((p) => !before.has(p)).length) { await page.evaluate(() => document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await page.mouse.click(700, 400); await page.waitForTimeout(60); } }
  }
};
const section = async (mode, tab) => {
  await page.evaluate((tab) => [...document.querySelectorAll(".panel > .tabs > button")].find((b) => !b.hidden && b.dataset.tab === tab)?.click(), tab); await page.waitForTimeout(150);
  const subs = await page.evaluate(() => [...document.querySelectorAll(".panel .segs > .tab, .panel .tabsbar button")].filter((b) => b.offsetWidth && !b.classList.contains("plus")).map((b, i) => (b.dataset.sub = "s" + i, "s" + i)));
  if (!subs.length) return visit(`${mode} › ${tab}`);
  for (const s of subs) { const name = await page.evaluate((s) => { const b = document.querySelector(`[data-sub="${s}"]`); if (!b) return null; b.click(); return b.textContent.trim().slice(0, 12) || b.id; }, s); if (name === null) continue; await page.waitForTimeout(150);
    const inner = await page.evaluate(() => [...document.querySelectorAll(".panel .form .segs > .tab, .panel .form [role=tab]")].filter((b) => b.offsetWidth).map((b, i) => (b.dataset.sub2 = "t" + i, "t" + i)));
    if (!inner.length) await visit(`${mode} › ${tab} › ${name}`);
    for (const t of inner) { const n2 = await page.evaluate((t) => { const b = document.querySelector(`[data-sub2="${t}"]`); if (!b) return null; b.click(); return b.textContent.trim().slice(0, 12); }, t); if (n2 === null) continue; await page.waitForTimeout(120); await visit(`${mode} › ${tab} › ${name} › ${n2}`); }
  }
};
// everything on: the rehaut and the bezel with their rings, the hand functions, two windows
await page.evaluate(() => { const t = window.dial_tool, S = t.S; for (const k of Object.keys(S)) if (/^(rh|bz)_on$|^rehaut$|^bezel$/.test(k)) S[k] = true; ["gmt", "day", "month", "date"].forEach((h) => { if (S["ha_" + h]) { S["ha_" + h].added = true; S["ha_" + h].on = true; } }); t.render(); });
for (const tab of await page.evaluate(() => [...document.querySelectorAll(".panel > .tabs > button")].filter((b) => !b.hidden).map((b) => b.dataset.tab))) await section("edit", tab);
await page.evaluate(() => window.dial_tool.show_mode(true, true)); await page.waitForTimeout(600);
for (const tab of await page.evaluate(() => [...document.querySelectorAll(".panel > .tabs > button")].filter((b) => !b.hidden).map((b) => b.dataset.tab))) await section("show", tab);
console.log([...wrong].join("\n")); console.log(`${W}×${H}: ${seen} openers pressed, ${wrong.size} wrong`);
await browser.close();
process.exit(wrong.size ? 1 : 0);
