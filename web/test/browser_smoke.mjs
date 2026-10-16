import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, "../package.json"));
const { chromium } = require("playwright");

console.log("Testing dial-tool.html in browser...");
let browser;
try {
  browser = await chromium.launch({ channel: "msedge" });
} catch {
  browser = await chromium.launch();
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, reducedMotion: "reduce" });
const fontsDir = path.resolve(__dirname, "../fonts");
await context.route("https://duztman.github.io/dial-tool/fonts/**", (route) =>
  route.fulfill({
    path: path.join(fontsDir, decodeURIComponent(route.request().url().split("/fonts/")[1])),
    headers: { "access-control-allow-origin": "*" },
  })
);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

const htmlPath = path.resolve(__dirname, "../dial-tool.html");
await page.goto("file:///" + htmlPath.replace(/\\/g, "/"));

// Wait for app to initialize
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
console.log("✓ App loaded and initialized");

// Switch to Export section, type a custom Watch Face Name, and click button
await page.click('button[data-tab="Export"]');
await page.waitForSelector("#export-wearos", { state: "visible", timeout: 5000 });
await page.fill("#wearos-name", "Bauhaus 38");
const pkgNote = await page.textContent("#wearos-pkg");
console.log(`✓ Custom watch face package preview: ${pkgNote}`);
if (!pkgNote.includes("com.dialtool.watchface.bauhaus_38")) {
  throw new Error(`Expected package note to contain com.dialtool.watchface.bauhaus_38, got: ${pkgNote}`);
}

const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 15000 }),
  page.click("#export-wearos"),
]);

const downloadName = download.suggestedFilename();
console.log(`✓ Triggered download: ${downloadName}`);
if (downloadName !== "dial-wearos-bauhaus_38.apk") {
  throw new Error(`Expected dial-wearos-bauhaus_38.apk download, got: ${downloadName}`);
}
const savedApk = path.resolve(__dirname, "../../build/browser-exported.apk");
await download.saveAs(savedApk);
console.log(`✓ Saved browser-exported APK to: ${savedApk}`);

await browser.close();

if (errors.length > 0) {
  console.error("Browser console errors encountered:", errors);
  process.exit(1);
}

console.log("\nBrowser test passed with 0 errors!");
