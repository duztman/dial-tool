// look.cjs — the help page as a reader sees it: every section, wide (1100) and on a phone (390), into out/.
//   node guide/help/look.cjs   — then look at guide/help/out/ before publish.sh (out/ is not committed)
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "out");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  let bad = 0;
  for (const w of [1100, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 820 } });
    await p.goto("file://" + path.join(__dirname, "index.html"));
    await p.evaluate(() => document.fonts.ready);
    const ids = await p.$$eval("h2[id]", (hs) => hs.map((h) => h.id));
    for (const [i, id] of ids.entries()) {
      const [y, end] = await p.evaluate((id) => { const h = document.getElementById(id), n = h.nextElementSibling && [...document.querySelectorAll("h2[id]")][[...document.querySelectorAll("h2[id]")].indexOf(h) + 1];
        const top = h.getBoundingClientRect().top + scrollY; return [top, n ? n.getBoundingClientRect().top + scrollY : document.body.scrollHeight]; }, id);
      await p.screenshot({ path: path.join(OUT, `${String(i + 1).padStart(2, "0")}-${id}-${w}.png`), fullPage: true, clip: { x: 0, y: Math.max(0, y - 12), width: w, height: Math.min(end - y + 12, 6000) } });
    }
    const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    const broken = await p.evaluate(() => [...document.images].filter((i) => !i.closest(".box") && !i.naturalWidth).map((i) => i.src));
    const inter = await p.evaluate(() => document.fonts.check("17px Inter"));
    console.log(`${w}: ${ids.length} sections · sideways scroll ${wide ? "YES" : "no"} · broken pictures ${broken.length} · Inter ${inter ? "loaded" : "MISSING"}`);
    bad += wide || broken.length || !inter;
  }
  await b.close();
  process.exit(bad ? 1 : 0);
})();
