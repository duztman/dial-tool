// build.mjs — one file for the preview page (scene.js inlined). Run from web/: node try/relight/build.mjs → try/relight/relight-built.html
import fs from "fs";
const html = fs.readFileSync("try/relight/relight.html", "utf8"), scene = fs.readFileSync("try/relight/scene.js", "utf8");
fs.writeFileSync("try/relight/relight-built.html", html.replace('<script src="scene.js"></script>', `<script>${scene}</script>`));
