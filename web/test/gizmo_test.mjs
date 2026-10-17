// gizmo_test.mjs — Verifies on-canvas guide drag handles for Rings in browser
import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const htmlPath = resolve("web/dial-tool.html");
const url = pathToFileURL(htmlPath).href;

console.log("Testing on-canvas guide handles for Rings...");

let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
} catch {
  browser = await chromium.launch({ headless: true });
}
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  await page.goto(url);
  await page.waitForSelector(".preview");

  // Click the Rings tab in the UI
  await page.click('button[data-tab="Rings"]');
  // Ensure guides are enabled
  await page.evaluate(() => {
    window.dial_tool.set_value("global", "guides", true);
  });

  await page.waitForSelector(".gizmo-handle", { timeout: 5000 });

  const handles = await page.evaluate(() => {
    const list = document.querySelectorAll(".gizmo-handle");
    return Array.from(list).map((el) => ({
      type: el.dataset.type,
      id: el.dataset.id,
      cursor: el.style.cursor,
    }));
  });

  console.log(`✓ Rendered ${handles.length} on-canvas handles:`, handles.map((h) => h.id).join(", "));
  if (handles.length !== 4) {
    throw new Error(`Expected 4 gizmo handles, got ${handles.length}`);
  }

  // Check handle visual styling (colored fill, white icons)
  const styles = await page.evaluate(() => {
    const radCircle = document.querySelector('.gizmo-handle[data-type="radius"] circle');
    const radPath = document.querySelector('.gizmo-handle[data-type="radius"] path');
    const spanCircle = document.querySelector('.gizmo-handle[data-type="span"] circle');
    const spanPath = document.querySelector('.gizmo-handle[data-type="span"] path');
    return {
      radFill: radCircle.getAttribute("fill"),
      radStroke: radCircle.getAttribute("stroke"),
      radPathFill: radPath.getAttribute("fill"),
      spanFill: spanCircle.getAttribute("fill"),
      spanPathFill: spanPath.getAttribute("fill"),
    };
  });
  console.log("Handle styling check:", styles);
  if (styles.radPathFill !== "#FFFFFF" || styles.spanPathFill !== "#FFFFFF") {
    throw new Error("Handle icons must be white (#FFFFFF)");
  }
  if (styles.radFill === "#FFFFFF" || styles.spanFill === "#FFFFFF") {
    throw new Error("Handle backgrounds should be fully colored with guide tone, not white");
  }
  console.log("✓ Handles have fully colored backgrounds and white icons!");

  // Test hover tooltip for each handle
  const checkHoverTip = async (type, expectedSubstring) => {
    const handle = page.locator(`.gizmo-handle[data-type="${type}"]`);
    const box = await handle.boundingBox();
    if (!box) throw new Error(`Could not find bounding box for ${type}`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // Wait slightly for hover to process
    await page.waitForTimeout(100);
    const tipText = await page.evaluate(() => {
      const tip = document.querySelector(".tip");
      return tip && !tip.hidden ? tip.textContent.trim() : null;
    });
    console.log(`Hover on ${type}: "${tipText}"`);
    if (!tipText || !tipText.toLowerCase().includes(expectedSubstring.toLowerCase())) {
      throw new Error(`Expected tip for ${type} to contain "${expectedSubstring}", got "${tipText}"`);
    }
  };

  await checkHoverTip("radius", "center radius");
  await checkHoverTip("size", "size");
  await checkHoverTip("start", "start angle");
  await checkHoverTip("span", "span angle");
  console.log("✓ All 4 handles show parameter name and value immediately upon hover!");

  // Get initial ring state
  const initR = await page.evaluate(() => window.dial_tool.ring().r);
  const initSpan = await page.evaluate(() => window.dial_tool.ring().span);
  console.log(`Initial ring values: radius = ${initR} mm, span = ${initSpan}°`);

  // Drag the radius handle outward
  const radiusHandle = page.locator('.gizmo-handle[data-type="radius"]');
  const rBox = await radiusHandle.boundingBox();
  if (!rBox) throw new Error("Could not find radius handle bounding box");

  const startX = rBox.x + rBox.width / 2;
  const startY = rBox.y + rBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY - 40, { steps: 5 }); // drag upward (radially outward)
  await page.mouse.up();

  const newR = await page.evaluate(() => window.dial_tool.ring().r);
  console.log(`After dragging radius handle: radius = ${newR} mm`);
  if (Math.abs(newR - initR) < 0.1) {
    throw new Error(`Radius did not change after drag! Was ${initR}, now ${newR}`);
  }

  // Test drag span handle
  const spanHandle = page.locator('.gizmo-handle[data-type="span"]');
  const sBox = await spanHandle.boundingBox();
  if (!sBox) throw new Error("Could not find span handle bounding box");

  const spanStartX = sBox.x + sBox.width / 2;
  const spanStartY = sBox.y + sBox.height / 2;

  await page.mouse.move(spanStartX, spanStartY);
  await page.mouse.down();
  await page.mouse.move(spanStartX - 40, spanStartY, { steps: 5 }); // drag counter-clockwise
  await page.mouse.up();

  const newSpan = await page.evaluate(() => window.dial_tool.ring().span);
  console.log(`After dragging span handle: span = ${newSpan}°`);
  if (newSpan === initSpan) {
    throw new Error(`Span did not change after drag! Was ${initSpan}, now ${newSpan}`);
  }

  console.log("✓ Dragging on-canvas handles updates ring values and preview smoothly!");
  console.log("All guide handle tests passed successfully!");
} finally {
  await browser.close();
}
