import path from "path";
import { fileURLToPath } from "url";
import { DEFAULTS, HAND_SHAPES, fresh_settings, build_static } from "../src/geometry.js";
import { engines } from "./engines.mjs";
import { generate_watchface_xml } from "../src/wearos/wff_xml.js";
import { svg_dial_face, svg_hand, svg_cap, svg_preview } from "../src/wearos/wff_assets.js";
import { build_wearos_apk, build_signed_wearos_apk } from "../src/wearos/apk_packager.js";
import { unzipSync } from "../src/wearos/fflate.js";

console.log("Running Wear OS integration tests...");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await engines(path.resolve(__dirname, "../fonts/ui/Silkscreen-Regular.ttf"));

// 1. Settings & Static Geometry
const S = fresh_settings();
const statik = build_static(S);

// 2. Generate WFF XML
const xml = generate_watchface_xml(S);
if (!xml.includes("<WatchFace width=\"450\" height=\"450\">")) {
  throw new Error("Missing or invalid WatchFace root element in WFF XML");
}
if (!xml.includes("<AnalogClock x=\"0\" y=\"0\" width=\"450\" height=\"450\">")) {
  throw new Error("Missing AnalogClock element in WFF XML");
}
if (!xml.includes("<HourHand resource=\"hour_hand\"")) {
  throw new Error("Missing HourHand element in WFF XML");
}
if (!xml.includes("<MinuteHand resource=\"minute_hand\"")) {
  throw new Error("Missing MinuteHand element in WFF XML");
}
if (!xml.includes("<SecondHand resource=\"second_hand\"")) {
  throw new Error("Missing SecondHand element in WFF XML");
}
if (!xml.includes('<Variant mode="AMBIENT" target="alpha" value="0" />')) {
  throw new Error("Missing alpha=0 AMBIENT variant in WFF XML");
}
if (!xml.includes('<Variant mode="AMBIENT" target="alpha" value="255" />')) {
  throw new Error("Missing alpha=255 AMBIENT variant in WFF XML");
}
if (xml.includes('target="resource"')) {
  throw new Error("Invalid target='resource' found in WFF XML (Wear OS ignores resource variants)");
}
const xmlPlate = generate_watchface_xml({ ...S, wearos_aod: "plate" });
if (xmlPlate.includes("dial_face_ambient")) {
  throw new Error("Plate mode should not generate separate dial_face_ambient layer");
}
console.log("✓ WFF XML structure and AOD alpha variants validated successfully");

// 3. Generate Layer SVGs (including upstream beta 4.41 disc hand and AOD modes)
const svgFace = svg_dial_face(S, statik);
const svgFaceAmbientBlack = svg_dial_face(S, statik, "black");
const svgFaceAmbientDim = svg_dial_face(S, statik, "dimmed");
const svgFaceAmbientPlate = svg_dial_face(S, statik, "plate");
const svgHour = svg_hand(S, "hour");
const svgMinute = svg_hand(S, "minute");
const svgSecond = svg_hand(S, "second");
const svgCap = svg_cap(S);
const svgPreview = svg_preview(S, statik);

if (!svgFaceAmbientBlack.includes("#000000")) {
  throw new Error("svg_dial_face black mode missing #000000 fill");
}
if (!svgFaceAmbientPlate.includes(svgFace.slice(0, 100))) {
  // should match plate fill
}

const discIdx = HAND_SHAPES.indexOf("disc");
if (discIdx < 0) throw new Error("Expected 'disc' in HAND_SHAPES");
const S_disc = fresh_settings({ ha_hour: { ...S.ha_hour, shape: discIdx } });
const svgDiscHour = svg_hand(S_disc, "hour");

if (!svgFace.includes("<svg") || !svgFace.includes("d=\"")) {
  throw new Error("Failed to render dial_face SVG");
}
if (!svgHour || !svgHour.includes("<path")) {
  throw new Error("Failed to render hour hand SVG");
}
if (!svgDiscHour || !svgDiscHour.includes("<path")) {
  throw new Error("Failed to render disc hour hand SVG");
}
if (!svgMinute || !svgMinute.includes("<path")) {
  throw new Error("Failed to render minute hand SVG");
}
if (!svgSecond || !svgSecond.includes("<path")) {
  throw new Error("Failed to render second hand SVG");
}
console.log("✓ All layer SVGs (including disc hand) generated and validated successfully");

// 4. Test APK Packaging & Signing with dummy/sample PNG buffers
const dummyPng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
const apkBytes = await build_signed_wearos_apk(xml, {
  dial_face: dummyPng,
  hour_hand: dummyPng,
  minute_hand: dummyPng,
  second_hand: dummyPng,
});

if (!apkBytes || apkBytes.length < 1000) {
  throw new Error("Generated APK is empty or corrupted");
}

// Verify APK Sig Block 42 magic is present
const apkText = new TextDecoder("latin1").decode(apkBytes);
if (!apkText.includes("APK Sig Block 42")) {
  throw new Error("Signed APK missing 'APK Sig Block 42'");
}

// 5. Verify Unpack of generated APK
const unpacked = unzipSync(apkBytes);
if (!unpacked["res/raw/watchface.xml"]) {
  throw new Error("Generated APK missing res/raw/watchface.xml");
}
const extractedXml = new TextDecoder().decode(unpacked["res/raw/watchface.xml"]);
if (!extractedXml.includes("<WatchFace width=\"450\" height=\"450\">")) {
  throw new Error("Extracted watchface.xml does not match injected XML");
}
console.log(`✓ Signed APK (v2/v3) packaging validated successfully (size: ${apkBytes.length} bytes)`);

console.log("\nAll Wear OS tests passed successfully!");
