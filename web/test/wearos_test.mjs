import path from "path";
import { fileURLToPath } from "url";
import { DEFAULTS, HAND_SHAPES, WINDOW_BASE, fresh_settings, build_static } from "../src/geometry.js";
import { engines } from "./engines.mjs";
import { generate_watchface_xml } from "../src/wearos/wff_xml.js";
import {
  svg_dial_face,
  svg_hand,
  svg_cap,
  svg_preview,
  svg_window_sheet,
  compute_window_layout,
  day_labels_for,
} from "../src/wearos/wff_assets.js";
import { build_wearos_apk, build_signed_wearos_apk } from "../src/wearos/apk_packager.js";
import { unzipSync } from "../src/wearos/fflate.js";

console.log("Running Wear OS integration tests...");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await engines(path.resolve(__dirname, "../fonts/ui/Silkscreen-Regular.ttf"));

// 1. Settings & Static Geometry
const S = fresh_settings();
const statik = build_static(S);

// 2. Generate WFF XML
const xml = generate_watchface_xml(S, statik);
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
if (!xml.includes('<UserConfigurations>')) {
  throw new Error("Missing UserConfigurations in WFF XML");
}
if (!xml.includes('<ListConfiguration id="aod_plate"')) {
  throw new Error("Missing ListConfiguration id='aod_plate' in WFF XML");
}
if (!xml.includes('defaultValue="0"')) {
  throw new Error("Default AOD option should be 0 (Pure Black)");
}
if (!xml.includes('displayName="@string/aod_plate_setting"')) {
  throw new Error("Missing displayName reference in ListConfiguration");
}
console.log("✓ WFF XML structure, UserConfigurations, and AOD variants validated successfully");

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

// 4. Test all 4 Window Visualizations (date, day, am · pm, moon phase) across all 4 slots
if (day_labels_for("MON").join(",") !== "SUN,MON,TUE,WED,THU,FRI,SAT") {
  throw new Error("day_labels_for('MON') failed");
}
if (day_labels_for("Tu").join(",") !== "Su,Mo,Tu,We,Th,Fr,Sa") {
  throw new Error("day_labels_for('Tu') failed");
}
if (day_labels_for("friday").join(",") !== "sunday,monday,tuesday,wednesday,thursday,friday,saturday") {
  throw new Error("day_labels_for('friday') failed");
}

const S_win = fresh_settings({
  da_on: true,
  da_kind: 0, // date
  da_at: 0,   // 3 o'clock
  da_day: "07",
  windows: [
    { ...structuredClone(WINDOW_BASE), on: true, kind: 1, at: 3, text: "MON" }, // day at 12
    { ...structuredClone(WINDOW_BASE), on: true, kind: 2, at: 2 },              // am · pm at 9
    { ...structuredClone(WINDOW_BASE), on: true, kind: 3, at: 1, age: 14 },     // moon phase at 6
  ],
});
const statik_win = build_static(S_win);
if (statik_win.windows.length !== 4) {
  throw new Error(`Expected 4 active windows in statik_win, got ${statik_win.windows.length}`);
}

const xml_win = generate_watchface_xml(S_win, statik_win);
for (const expected of [
  'resource="window_0"',
  'resource="window_1"',
  'resource="window_2"',
  'resource="window_3"',
  "[DAY]",
  "[DAY_OF_WEEK]",
  "[HOUR_0_23]",
  "[MOON_PHASE_POSITION]",
  'renderMode="SOURCE"',
  'renderMode="MASK"',
  '<ComplicationSlot slotId="0"',
  '<ComplicationSlot slotId="3"',
  'isCustomizable="TRUE"',
  'defaultSystemProvider="EMPTY"',
  '<Complication type="EMPTY">',
  '<Complication type="SHORT_TEXT">',
  '<Complication type="RANGED_VALUE">',
  '<ListConfiguration\n            id="win_0"',
  '<ListConfiguration id="win_3">',
  "[COMPLICATION.TEXT]",
]) {
  if (!xml_win.includes(expected)) {
    throw new Error(`WFF XML with 4 windows missing expected token: ${expected}`);
  }
}
if ((xml_win.match(/<ComplicationSlot /g) || []).length !== 4) {
  throw new Error("Expected exactly 4 ComplicationSlots");
}
if (!(xml_win.indexOf('resource="dial_face"') < xml_win.indexOf("<ComplicationSlot") &&
      xml_win.indexOf("<ComplicationSlot") < xml_win.indexOf("<AnalogClock"))) {
  throw new Error("Window complication slots must sit between dial_face and the hands");
}

for (const x of statik_win.windows) {
  const layout = compute_window_layout(S_win, x);
  const sheetSvg = svg_window_sheet(S_win, x);
  if (!sheetSvg.includes(`width="${layout.sheetW}" height="${layout.sheetH}"`)) {
    throw new Error(`Window ${x.index} (${layout.kind}) sprite sheet SVG missing expected dimensions`);
  }
  const groupMatches = sheetSvg.match(/<g transform=/g) || [];
  if (groupMatches.length !== layout.frames) {
    throw new Error(`Window ${x.index} (${layout.kind}) expected ${layout.frames} frame groups, got ${groupMatches.length}`);
  }
}
console.log("✓ All 4 window visualizations (date, day, am · pm, moon phase) sprite sheets & WFF XML validated");

// 5. Test APK Packaging & Signing with dummy/sample PNG buffers (including window_0..3)
const dummyPng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
const apkBytes = await build_signed_wearos_apk(xml_win, {
  dial_face: dummyPng,
  hour_hand: dummyPng,
  minute_hand: dummyPng,
  second_hand: dummyPng,
  window_0: dummyPng,
  window_1: dummyPng,
  window_2: dummyPng,
  window_3: dummyPng,
});

if (!apkBytes || apkBytes.length < 1000) {
  throw new Error("Generated APK is empty or corrupted");
}

// Verify APK Sig Block 42 magic is present
const apkText = new TextDecoder("latin1").decode(apkBytes);
if (!apkText.includes("APK Sig Block 42")) {
  throw new Error("Signed APK missing 'APK Sig Block 42'");
}

// 6. Verify Unpack of generated APK
const unpacked = unzipSync(apkBytes);
if (!unpacked["res/raw/watchface.xml"]) {
  throw new Error("Generated APK missing res/raw/watchface.xml");
}
for (let i = 0; i < 4; i++) {
  if (!unpacked[`res/drawable-nodpi-v4/window_${i}.png`]) {
    throw new Error(`Generated APK missing res/drawable-nodpi-v4/window_${i}.png`);
  }
}
const extractedXml = new TextDecoder().decode(unpacked["res/raw/watchface.xml"]);
if (!extractedXml.includes("<WatchFace width=\"450\" height=\"450\">")) {
  throw new Error("Extracted watchface.xml does not match injected XML");
}
console.log(`✓ Signed APK (v2/v3) packaging with 4 window sprite sheets validated (size: ${apkBytes.length} bytes)`);

console.log("\nAll Wear OS tests passed successfully!");
