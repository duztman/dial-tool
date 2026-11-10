// engine-build.mjs — Dial Tool's drawing engine as one file for the 3D page (round 84): a pasted link → the dial's SVG, heights and all.
//
//   node web/try/relight/engine-build.mjs <a checkout of dev>/web <out folder>
//
// A link is the dial's SETTINGS; its shapes are made by the tool's engine (geometry.js on PathKit and HarfBuzz, both WebAssembly)
// with the dial's fonts. An artifact may not load code or files from the tool's site, so the engine travels with the page:
// <out>/engine.js (this bundle, the two engines packed inside), <out>/fonts/ (the tool's font files) and <out>/movements.js
// (the tool's movement record as the tool reads it). The engine is the tool's
// own code at the checkout's version — build it again when the tool's link grows new keys. It reads a link exactly as the page
// does (session.js `unpack`) and writes exactly what Export → SVG writes (`svg_document` with `svg_facts`), so the 3D page reads
// a link through the same reader as a saved file.
import fs from "fs"; import path from "path"; import { createRequire } from "module"; import { pathToFileURL } from "url";
const [web, out] = process.argv.slice(2).map((p) => path.resolve(p)); if (!web || !out) { console.error("usage: node engine-build.mjs <dev checkout>/web <out folder>"); process.exit(1); }
const require = createRequire(path.join(web, "package.json")), esbuild = require("esbuild"), b64 = (f) => fs.readFileSync(f).toString("base64");
const { FONT_LIST } = await import(pathToFileURL(path.join(web, "src/font_list.js")));
const files = Object.fromEntries(FONT_LIST.filter((f) => f.file).map((f) => [f.ps, f.file]));      // a font's name in a dial → its file (the list's samples stay behind: 3.8 MB the engine does not need)
const STAND_IN = "Arimo-wght.ttf";      // the ring's starting font, in the tool's own files: what text falls back to
const entry = path.join(web, "__engine-entry.js");
fs.writeFileSync(entry, `
import PathKitInit from "pathkit-wasm/bin/pathkit.js";
import * as HarfBuzz from "harfbuzzjs";
import * as G from "./src/geometry.js";
import { svg_document } from "./src/output.js";
import { svg_facts } from "./src/show.js";
const FILES = ${JSON.stringify(files)};
const pathkit = await PathKitInit({ wasmBinary: globalThis.__DIAL3D.bytes("pathkit") }); G.start(pathkit, HarfBuzz);
export const VERSION = G.VERSION;
let stood = false;
const fetched = async (address) => { const a = await fetch(address); if (!a.ok) throw new Error(a.status + " from " + address); return new Uint8Array(await a.arrayBuffer()); };
/** a pasted link (the whole address, or its letters) → { svg, version, d }. fonts: the folder the font files are in */
export async function svgFromLink(text, fonts = "fonts/") {
  const hash = String(text).trim().replace(/^[^#]*#/, ""), kind = G.link_kind(hash);
  if (/^V[0-9]/.test(hash)) throw new Error("this link holds a set of dials — paste one dial's link");
  if (!kind) throw new Error("this is not a Dial Tool link");
  if (kind.scheme !== G.LINK_SCHEME) throw new Error("this link is from an older Dial Tool (scheme " + kind.scheme + ", this page reads " + G.LINK_SCHEME + ") — open it in Dial Tool and copy its link again");
  let settings = null;
  try { const bytes = G.un_base32(kind.letters); settings = G.from_link_text(new TextDecoder().decode(new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer()))); } catch (e) { settings = null; }
  if (!settings) throw new Error("this link can't be read — it may have been cut short when copied");
  const S = G.fresh_settings(settings), missing = [];
  if (!stood) { G.add_font(await fetched(fonts + ${JSON.stringify(STAND_IN)}), 0, true); stood = true; }
  for (const part of [...S.rings, ...G.windows_of(S).filter((w) => w.ps), ...S.rings.flatMap((r) => Object.values(r.nudge || {}).filter((n) => n.ps))]) {      // rings, windows and single numerals with a font of their own (fonts.js load_fonts_in_use)
    if (!part.ps || G.has_font(part.ps)) continue;
    const file = FILES[part.ps]; if (!file) { if (!missing.includes(part.ps)) missing.push(part.ps); continue; }
    const bytes = await fetched(fonts + file); for (let i = 0; i < 64; i++) { const got = G.add_font(bytes, i); if (!got || got.ps === part.ps) break; }
    if (!G.has_font(part.ps) && !missing.includes(part.ps)) missing.push(part.ps);
  }
  const statik = G.build_static(S);
  return { svg: svg_document(S, statik, S.t ?? 0, { facts: svg_facts(S) }), version: G.VERSION, d: S.dial_d, missing };
}
`);
const patch = { name: "engines", setup(build) { build.onLoad({ filter: /harfbuzzjs[\\/]dist[\\/]index\.mjs$/ }, (args) => { const text = fs.readFileSync(args.path, "utf8"), call = "init(await createHarfBuzz());"; if (!text.includes(call)) throw new Error("harfbuzzjs's start has changed: read its dist/index.mjs");
  return { contents: text.replace(call, `init(await createHarfBuzz({ wasmBinary: globalThis.__DIAL3D.bytes("harfbuzz") }));`), loader: "js" }; }); } };
let code;
try { code = (await esbuild.build({ entryPoints: [entry], bundle: true, format: "esm", write: false, platform: "browser", target: "es2022", plugins: [patch], external: ["fs", "path", "module", "url", "crypto"], logLevel: "warning", absWorkingDir: web })).outputFiles[0].text; } finally { fs.unlinkSync(entry); }
const head = `// Dial Tool's drawing engine for the Watch 3D page — built by web/try/relight/engine-build.mjs; do not edit\nglobalThis.__DIAL3D = { packed: { pathkit: "${b64(require.resolve("pathkit-wasm/bin/pathkit.wasm"))}", harfbuzz: "${b64(require.resolve("harfbuzzjs/dist/harfbuzz.wasm"))}" }, bytes(name) { const s = atob(this.packed[name]), out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; } };\n`;
fs.mkdirSync(path.join(out, "fonts"), { recursive: true }); fs.writeFileSync(path.join(out, "engine.js"), head + code);
const need = [...new Set([STAND_IN, ...Object.values(files)])]; let bytes = 0; for (const f of need) { fs.copyFileSync(path.join(web, "fonts", f), path.join(out, "fonts", f)); bytes += fs.statSync(path.join(out, "fonts", f)).size; }
fs.writeFileSync(path.join(out, "fonts.json"), JSON.stringify(need));
// the movements (round 88): the tool's own generated file (web/src/movements.js, written from docs/research/movements.json by
// web/movements.mjs), copied as it is — the page's Movement switch reads it, so no movement's number is written in the page
fs.copyFileSync(path.join(web, "src/movements.js"), path.join(out, "movements.js"));
console.log(`engine.js ${((head.length + code.length) / 1e6).toFixed(2)} MB · ${need.length} font files, ${(bytes / 1e6).toFixed(1)} MB`);
