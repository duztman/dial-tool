// tools/build_apk.mjs — Builds and signs a Wear OS APK from dial settings
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { fresh_settings, build_static } from "../web/src/geometry.js";
import { engines } from "../web/test/engines.mjs";
import { generate_watchface_xml } from "../web/src/wearos/wff_xml.js";
import { svg_dial_face, svg_hand, svg_cap, svg_preview } from "../web/src/wearos/wff_assets.js";
import { build_wearos_apk } from "../web/src/wearos/apk_packager.js";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(path.resolve(root, "web/package.json"));
const { chromium } = require("playwright");

// Load settings
let S;
const settingsArg = process.argv[2];
if (settingsArg && fs.existsSync(settingsArg)) {
  S = fresh_settings(JSON.parse(fs.readFileSync(settingsArg, "utf8")));
  console.log(`Loaded settings from ${settingsArg}`);
} else {
  S = fresh_settings();
  console.log("Using default dial settings");
}

// Initialize geometry engine
const fontPath = path.resolve(root, "web/fonts/ui/Silkscreen-Regular.ttf");
await engines(fontPath);
const statik = build_static(S);

console.log("Generating WFF XML and SVG layers...");
const xml = generate_watchface_xml(S);

const svgs = {
  dial_face: svg_dial_face(S, statik),
  dial_face_ambient: svg_dial_face(S, statik, true),
  hour_hand: svg_hand(S, "hour"),
  hour_hand_ambient: svg_hand(S, "hour", true),
  minute_hand: svg_hand(S, "minute"),
  minute_hand_ambient: svg_hand(S, "minute", true),
  second_hand: svg_hand(S, "second"),
  cap: svg_cap(S),
  preview: svg_preview(S, statik),
  icon: svg_preview(S, statik),
};

console.log("Rendering layers to PNG using browser...");
let browser;
try {
  browser = await chromium.launch({ channel: "msedge" });
} catch {
  browser = await chromium.launch();
}
const page = await browser.newPage({ viewport: { width: 450, height: 450 } });

const drawables = {};
for (const [key, svg] of Object.entries(svgs)) {
  if (!svg) continue;
  await page.setContent(svg);
  drawables[key] = await page.screenshot({ omitBackground: true });
}
await browser.close();

console.log("Assembling APK container...");
const unsignedApkBytes = build_wearos_apk(xml, drawables);

const outDir = path.resolve(root, "build");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const unsignedApkPath = path.join(outDir, "dial-wearos-unsigned.apk");
fs.writeFileSync(unsignedApkPath, unsignedApkBytes);

console.log("Signing APK with v1, v2, and v3 signatures via uber-apk-signer...");
const signerJar = path.resolve(root, "tools/uber-apk-signer.jar");

execSync(`java -jar "${signerJar}" -a "${unsignedApkPath}" -o "${outDir}"`, {
  stdio: "inherit",
});

const finalApk = path.join(outDir, "dial-wearos-aligned-debugSigned.apk");
const targetApk = path.join(outDir, "dial-wearos.apk");
if (fs.existsSync(finalApk)) {
  if (fs.existsSync(targetApk)) fs.unlinkSync(targetApk);
  fs.renameSync(finalApk, targetApk);
  console.log(`\n🎉 Success! Ready-to-install Wear OS APK created at:\n   ${targetApk}\n`);
  console.log(`To install on your Pixel Watch via ADB:\n   adb install -r "${targetApk}"\n`);
}
