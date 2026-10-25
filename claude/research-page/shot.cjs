const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html{padding:0}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + require('fs').readFileSync('index.built.html','utf8') + '</body></html>';
  require('fs').writeFileSync('_wrap.html', html);
  await p.goto('file://' + process.cwd() + '/_wrap.html'); await p.waitForTimeout(1500);
  await p.screenshot({ path: '_s1.png' });
  await p.click('.tile'); await p.waitForTimeout(800); await p.screenshot({ path: '_s2.png' });
  await p.keyboard.press('Escape'); await p.evaluate(() => document.documentElement.setAttribute('data-theme','dark')); await p.waitForTimeout(300);
  await p.screenshot({ path: '_s3.png' });
  const m = await b.newPage({ viewport: { width: 400, height: 800 } }); await m.goto('file://' + process.cwd() + '/_wrap.html'); await m.waitForTimeout(1200);
  const sw = await m.evaluate(() => document.documentElement.scrollWidth); console.log('phone scrollWidth', sw);
  await m.screenshot({ path: '_s4.png' });
  await b.close();
})();
