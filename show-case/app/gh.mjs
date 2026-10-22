import { chromium } from "../../web/node_modules/playwright/index.mjs";
import { fileURLToPath } from "node:url";
const APP = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");      // show-case/app
const REPO = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
const logs = []; p.on("console", (m) => logs.push(m.type() + ": " + m.text())); p.on("pageerror", (e) => logs.push("ERROR " + e.message));
await p.goto("http://localhost:8766/show-case/"); await p.waitForTimeout(4000);
await p.screenshot({ path: APP + "/gh.png" });
const [d] = await Promise.all([p.waitForEvent("download", { timeout: 30000 }), p.click("#tab-export").then(() => p.click("#sc-png"))]);
console.log("download", d.suggestedFilename());
console.log(logs.join("\n"));
await b.close();
