// build.mjs — packs the web version into ONE file, web/dial-tool.html.
//
// Everything is inside that file: the code (src/), the two engines (PathKit and HarfBuzz,
// as WebAssembly) and Inter as the stand-in font. So it opens by double-click, needs no
// server and no internet, and can be put anywhere.
//
//   cd web && npm install && node build.mjs [/path/to/stand-in-font.otf]

import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));      // a path with spaces, or on Windows (farukahmet's PRs #1 and #3, 18 Oct 2026)
const require = createRequire(import.meta.url);
const defaultFont = fs.existsSync("/usr/share/fonts/opentype/inter/Inter-Regular.otf")      // Inter, SIL Open Font Licence; where it isn't installed, Barlow (farukahmet's PRs #1 and #3)
  ? "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
  : path.join(here, "fonts/Barlow-Regular.ttf");
const FONT = process.argv[2] || defaultFont;
const b64 = (file) => fs.readFileSync(file).toString("base64");

const patch_engines = {                            // both engines look for their .wasm file next to the page:
  name: "engines-from-the-page",                   // hand them the bytes packed in the page instead
  setup(build) {
    build.onLoad({ filter: /harfbuzzjs[\\/]dist[\\/]index\.mjs$/ }, (args) => {
      const text = fs.readFileSync(args.path, "utf8");
      const call = "init(await createHarfBuzz());";
      if (!text.includes(call)) throw new Error("harfbuzzjs changed how it starts: update build.mjs");
      return { contents: text.replace(call, `init(await createHarfBuzz({ wasmBinary: globalThis.__DIAL.bytes("harfbuzz") }));`), loader: "js" };
    });
  },
};

const out = await esbuild.build({
  entryPoints: [path.join(here, "src/main.js")], bundle: true, format: "esm", write: false, minify: false,
  platform: "browser", target: "es2022", plugins: [patch_engines], external: ["fs", "path", "module", "url", "crypto"],
  logLevel: "warning",
});
const code = out.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
// Silkscreen (SIL OFL, fonts/ui/): the pixel font for the tiny numbers inside small drawings. Packed into the stylesheet.
const pixel = [["Regular", 400], ["Bold", 700]].map(([style, weight]) => `@font-face { font-family: "Silkscreen"; font-weight: ${weight}; src: url(data:font/ttf;base64,${b64(path.join(here, `fonts/ui/Silkscreen-${style}.ttf`))}) format("truetype"); font-display: block; }\n`).join("");      // bold: the stickers that matter most in the font sheet
// the stylesheet: one file per cascade layer in src/css/, joined in the order of their numbers (R32)
const sheets = fs.readdirSync(path.join(here, "src/css")).filter((f) => f.endsWith(".css")).sort();
// Dial Time (fonts/ui/time_font.py: Barlow Condensed Light, SIL OFL, cut down, its colon smaller and centred): the
// bar's time and AM · PM (#284, beta 4.44)
const time_face = `@font-face { font-family: "Dial Time"; font-weight: 300; src: url(data:font/ttf;base64,${b64(path.join(here, "fonts/ui/DialTime-Light.ttf"))}) format("truetype"); font-display: block; }`;
// Dial Mono (fonts/ui/mono_font.py: JetBrains Mono, SIL OFL, at the weight whose stem is a line at 10 px, cut down):
// the unit box's word (#302, beta 4.44.1)
const unit_face = `@font-face { font-family: "Dial Mono"; font-weight: 400; src: url(data:font/ttf;base64,${b64(path.join(here, "fonts/ui/DialMono.ttf"))}) format("truetype"); font-display: block; }`;
// Dial Date (fonts/ui/date_font.py: Inter SemiBold, SIL OFL, its figures only): the bar's stacked date (4.62; Inter since 4.63)
const date_face = `@font-face { font-family: "Dial Date"; font-weight: 600; src: url(data:font/otf;base64,${b64(path.join(here, "fonts/ui/DialDate-SemiBold.otf"))}) format("opentype"); font-display: block; }`;
const css = sheets.map((f) => fs.readFileSync(path.join(here, "src/css", f), "utf8")).join("\n") + pixel + time_face + unit_face + date_face;
const version = /VERSION = "([^"]+)"/.exec(fs.readFileSync(path.join(here, "src/geometry.js"), "utf8"))[1];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Dial Tool</title>
<!-- Dial Tool, web version · ${version} · built ${new Date().toISOString().slice(0, 10)} · source: github.com/duztman/dial-tool, web/src
     One file: code, shape engine (PathKit), text engine (HarfBuzz), the stand-in font (Inter, OFL), the pixel font (Silkscreen, OFL), the time's face (Barlow Condensed, OFL) and the unit box's (JetBrains Mono, OFL) are all inside. -->
<style>
${css}</style>
</head>
<body>
<div id="app"><p class="starting">Starting…</p></div>
<script>
globalThis.__DIAL = {
  packed: {
    pathkit: "${b64(require.resolve("pathkit-wasm/bin/pathkit.wasm"))}",
    harfbuzz: "${b64(require.resolve("harfbuzzjs/dist/harfbuzz.wasm"))}",
    font: "${b64(FONT)}",
  },
  bytes(name) { return Uint8Array.from(atob(this.packed[name]), (c) => c.charCodeAt(0)); },
};
window.addEventListener("error", (e) => { const a = document.getElementById("app"); if (a && a.textContent.startsWith("Starting")) a.innerHTML = '<p class="starting">Dial Tool couldn’t start: ' + e.message + '</p>'; });
</script>
<script type="module">
${code}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(here, "dial-tool.html"), html);
console.log(`dial-tool.html · ${version} · ${(html.length / 1e6).toFixed(2)} MB`);
