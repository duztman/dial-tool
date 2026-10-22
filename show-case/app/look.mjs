import { chromium } from "../../web/node_modules/playwright/index.mjs";
import { fileURLToPath } from "node:url";
const APP = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");      // show-case/app
const REPO = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
const [w, h, out, act] = [+process.argv[2] || 1400, +process.argv[3] || 900, process.argv[4] || APP + "/look.png", process.argv[5] || ""];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
const logs = []; p.on("console", (m) => logs.push(m.type() + ": " + m.text())); p.on("pageerror", (e) => logs.push("ERROR " + e.message));
await p.goto("http://localhost:8765/local.html"); await p.waitForTimeout(3000);
if (act) { await eval(`(async () => { ${act} })()`); await p.waitForTimeout(1200); }
await p.screenshot({ path: out });
console.log(logs.join("\n"));
await b.close();
