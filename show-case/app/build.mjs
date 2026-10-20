import { fileURLToPath } from "node:url";
const APP = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");      // show-case/app
const REPO = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
// Dial Show Case: one page — the code (src/), Dial Tool's engine and stylesheet, PathKit and HarfBuzz as WebAssembly,
// Inter as the stand-in font. The dial fonts are files beside it (fonts/), fetched when a dial uses one.
import fs from "fs"; import path from "path"; import { createRequire } from "module";
const WEB = REPO + "/web";
const esbuild = (await import(WEB + "/node_modules/esbuild/lib/main.js")).default;
const require = createRequire(WEB + "/");
const b64 = (file) => fs.readFileSync(file).toString("base64");
const FONT = fs.existsSync("/usr/share/fonts/opentype/inter/Inter-Regular.otf") ? "/usr/share/fonts/opentype/inter/Inter-Regular.otf" : path.join(WEB, "fonts/Barlow-Regular.ttf");
const first = fs.readFileSync(REPO + "/show-case/src/links.txt", "utf8").trim().split("\n")[0];
const patch = { name: "engines-from-the-page", setup(build) {
  build.onLoad({ filter: /harfbuzzjs[\\/]dist[\\/]index\.mjs$/ }, (args) => {
    const text = fs.readFileSync(args.path, "utf8"), call = "init(await createHarfBuzz());";
    if (!text.includes(call)) throw new Error("harfbuzzjs changed how it starts");
    return { contents: text.replace(call, `init(await createHarfBuzz({ wasmBinary: globalThis.__DIAL.bytes("harfbuzz") }));`), loader: "js" };
  });
} };
const out = await esbuild.build({ entryPoints: [APP + "/src/main.js"], bundle: true, format: "esm", write: false, platform: "browser", target: "es2022",
  plugins: [patch], external: ["fs", "path", "module", "url", "crypto"], nodePaths: [WEB + "/node_modules"], logLevel: "warning", define: {} });
const code = out.outputFiles[0].text.replace("__FIRST_LINK__", first).replace("__FONT_BASE__", process.env.FONT_BASE || "fonts/").replace(/<\/script/g, "<\\/script");
const ui = (fam, w, file, fmt) => `@font-face { font-family: "${fam}"; font-weight: ${w}; src: url(data:font/${fmt};base64,${b64(path.join(WEB, "fonts/ui", file))}) format("${fmt === "ttf" ? "truetype" : "opentype"}"); font-display: block; }`;
const css = fs.readdirSync(path.join(WEB, "src/css")).filter((f) => f.endsWith(".css")).sort().map((f) => fs.readFileSync(path.join(WEB, "src/css", f), "utf8")).join("\n")
  + ui("Silkscreen", 400, "Silkscreen-Regular.ttf", "ttf") + ui("Silkscreen", 700, "Silkscreen-Bold.ttf", "ttf") + ui("Dial Time", 300, "DialTime-Light.ttf", "ttf")
  + ui("Dial Mono", 400, "DialMono.ttf", "ttf") + ui("Dial Date", 600, "DialDate-SemiBold.otf", "otf") + `@font-face { font-family: "Bar Inter"; font-weight: 400; src: url(data:font/otf;base64,${b64(FONT)}) format("opentype"); font-display: block; }`
  + "\n" + fs.readFileSync(APP + "/src/extra.css", "utf8");
const html = `<title>Dial Show Case</title>
<style>
${css}</style>
<div id="app"><p class="starting">Starting…</p></div>
<script>
globalThis.__DIAL = {
  packed: { pathkit: "${b64(require.resolve("pathkit-wasm/bin/pathkit.wasm"))}", harfbuzz: "${b64(require.resolve("harfbuzzjs/dist/harfbuzz.wasm"))}", font: "${b64(FONT)}" },
  bytes(name) { return Uint8Array.from(atob(this.packed[name]), (c) => c.charCodeAt(0)); },
};
window.addEventListener("error", (e) => { const a = document.getElementById("app"); if (a && a.textContent.startsWith("Starting")) a.innerHTML = '<p class="starting">Dial Show Case couldn’t start: ' + e.message + '</p>'; });
</script>
<script type="module">
${code}
</script>
`;
fs.mkdirSync(APP + "/out", { recursive: true }); fs.writeFileSync(process.env.OUT || APP + "/out/dial-show-case.html", html);
if (process.env.OUT) { console.log("written", process.env.OUT); process.exit(0); }
// the fonts beside it
fs.mkdirSync(APP + "/out/fonts", { recursive: true });
const { FONT_LIST } = await import(WEB + "/src/font_list.js");
for (const f of new Set(FONT_LIST.map((x) => x.file))) fs.copyFileSync(path.join(WEB, "fonts", f), path.join(APP + "/out/fonts", f));
// a local copy with the skeleton the artifact host adds, for testing here
fs.writeFileSync(APP + "/out/local.html", `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${html}</body></html>`);
console.log("dial-show-case.html", (html.length / 1e6).toFixed(2), "MB");
