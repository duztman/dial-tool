const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file://' + process.cwd() + '/_wrap.html'); await p.waitForTimeout(1200);
  for (const id of ['fig-fairs','fig-chain','fig-pain','fig-groove','fig-night','fig-finest','fig-enamel','fig-fit']) {
    const el = await p.$('#' + id); if (el) await el.screenshot({ path: '_' + id + '.png' }); else console.log('missing', id);
  }
  const t = await p.$('h2#their-pain'); if (t) { await t.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.screenshot({ path: '_s5.png' }); }
  const m = await b.newPage({ viewport: { width: 400, height: 800 } }); await m.goto('file://' + process.cwd() + '/_wrap.html'); await m.waitForTimeout(800);
  const wide = await m.evaluate(() => { const out=[]; document.querySelectorAll('body *').forEach(e => { const r=e.getBoundingClientRect(); if (r.right > 402) out.push(e.tagName+'.'+e.className+' '+Math.round(r.right)); }); return out.slice(0,12); });
  console.log(wide.join('\n'));
  await b.close();
})();
