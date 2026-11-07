// shot-set.mjs — a round's set of crops from the working page: top · low · side · lug join · underside. Run from web/: node try/relight/shot-set.mjs <prefix>
import { chromium } from "playwright"; import fs from "fs";
const prefix = process.argv[2] || "/tmp/n";
const html = fs.readFileSync("try/relight/watch3d.html","utf8").replace('<script src="scene.js"></script>', `<script>${fs.readFileSync("try/relight/scene.js","utf8")}</script>`).replaceAll("https://cdn.jsdelivr.net/npm/three@0.170.0/", "http://localhost:8765/node_modules/three/");
fs.writeFileSync("try/relight/_t.html", html);
const b = await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1243/chrome-linux64/chrome",args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const pg = await b.newPage({viewport:{width:1300,height:1000}});
const errs=[]; pg.on("pageerror",e=>errs.push(String(e))); pg.on("console",m=>{ if(m.type()==="error" && !m.text().includes("404")) errs.push(m.text()); });
await pg.goto("http://localhost:8765/try/relight/_t.html"); await pg.waitForFunction(()=>window.watch3d, null, {timeout:120000}); await pg.waitForTimeout(2000);
const shot = async (name, fn) => { await pg.evaluate(fn); await pg.waitForTimeout(800); await pg.locator("#gl").screenshot({path:`${prefix}-${name}.png`}); };
const cam = (el, az, d, fov, look) => `(()=>{ const w=window.watch3d, c=w.camera; w.S.view="free"; c.fov=${fov}; const el=${el}*Math.PI/180, az=${az}*Math.PI/180, d=${d}; c.position.set(Math.sin(az)*Math.cos(el)*d, Math.sin(el)*d, Math.cos(az)*Math.cos(el)*d); c.lookAt(${look}); w.controls.target.set(${look}); c.updateProjectionMatrix(); w.controls.update(); w.render(); })()`;
await shot("top", ()=>window.watch3d.set("view","top"));
await shot("low", ()=>window.watch3d.set("view","low"));
await shot("side", ()=>window.watch3d.set("view","side"));
await shot("lugjoin", cam(25, -45, 150, 14, "-8,4,18"));
await shot("under", cam(-30, -40, 200, 16, "0,0,0"));
console.log("errors", errs); await b.close(); fs.unlinkSync("try/relight/_t.html");
