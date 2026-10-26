// thumbs.mjs — the Gallery's cards as small pictures for the help page (Okay, 26 Oct 2026: "Gallery needs thumbnails for
// each dial"): each card's own drawing (src/gallery.js, src/examples.js, made by card() in links.mjs), at 128 px — 64 on
// the page at 2× — into guide/help/img/g-<name>.webp.   cd web && node ../guide/help/thumbs.mjs
import { createRequire } from "module";
import { execFileSync } from "child_process";
import fs from "fs";
const WEB = new URL("../../web/", import.meta.url), OUT = new URL("./img/", import.meta.url).pathname, SIZE = 128;
const { chromium } = createRequire(new URL("package.json", WEB))("playwright");      // the web app's own Playwright
const { GALLERY } = await import(new URL("src/gallery.js", WEB)), { EXAMPLES } = await import(new URL("src/examples.js", WEB));
export const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
// each also at 1200 px for the lightbox, g-<name>-full.webp (Okay, 27 Oct 2026: "All these Lightboxes hi res image")
for (const c of [...GALLERY, ...EXAMPLES]) for (const px of [SIZE, 1200]) {
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${px}px;height:${px}px}</style>${c.picture.replace("<svg ", `<svg width="${px}" height="${px}" `)}`);
  const png = OUT + `g-${slug(c.name)}${px === SIZE ? "" : "-full"}.png`;
  await page.screenshot({ path: png, omitBackground: true });
  execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}");im.save("${png.replace(".png", ".webp")}",quality=86,method=6)`]);
  fs.unlinkSync(png);
}
await browser.close();
