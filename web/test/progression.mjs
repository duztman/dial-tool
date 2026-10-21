// progression.mjs — the progression strip (R36, #503): the same views in every step's last build.
//
//   node test/progression.mjs 4.5 4.91 <out>     every step from 4.5 to 4.91
//   node test/progression.mjs 4.92 4.92 <out>    one step's frame, after a release
//
// For each step (4.5, 4.6 … the second number), the last build of it in docs/versions.md is taken out of the
// history (git archive, web/ only), served, and shot twice at an iPad's landscape size (1180 × 820, 2×):
//   <version>-opens.png   the tool as a first visitor sees it, nothing kept
//   <version>-watch.png   Okay's watch (web/src/opener.js) at 10:10, given as the last session (dial-tool-last),
//                         which every build reads; a build that lacks a key draws its own default for it
// Then <out>/index.html: every step, a slider through those whose pictures are beside it.
// Needs the full history (git fetch --unshallow) and Playwright's Chromium.
import { chromium } from "playwright";
import { execSync } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";

const ROOT = execSync("git rev-parse --show-toplevel").toString().trim();
const [from, to, OUT] = process.argv.slice(2);
if (!OUT) { console.log("node test/progression.mjs <from> <to> <out folder>"); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const num = (v) => v.split(".").map(Number);
const step = (v) => num(v).slice(0, 2).join(".");
const before = (a, b) => { const x = num(a), y = num(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0); return false; };

// the last build of each step, from docs/versions.md (newest rows first)
const rows = execSync("tools/versions.sh list", { cwd: ROOT }).toString().trim().split("\n").map((l) => l.split(" "));
const last = new Map();
for (const [v, sha] of rows) if (/^\d+\.\d+/.test(v) && !last.has(step(v))) last.set(step(v), [v, sha]);
const frames = [...last.values()].filter(([v]) => !before(step(v), from) && !before(to, step(v))).sort((a, b) => (before(a[0], b[0]) ? -1 : 1));

// Okay's watch, at 10:10
const src = fs.readFileSync(path.join(ROOT, "web/src/opener.js"), "utf8");
const watch = JSON.parse(src.match(/export const OKAYS_WATCH = (\{.*?\});/)[1]);
watch.t = 10 * 3600 + 10 * 60;

const TMP = fs.mkdtempSync("/tmp/progression-");
const server = http.createServer((q, r) => {
  const f = path.join(TMP, decodeURIComponent(q.url.split("?")[0]));
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { "Content-Type": f.endsWith(".html") ? "text/html" : f.endsWith(".js") || f.endsWith(".mjs") ? "text/javascript" : f.endsWith(".wasm") ? "application/wasm" : "application/octet-stream" }); r.end(b); });
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function shoot(url, file, init) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
  if (init) await ctx.addInitScript(init.fn, init.arg);
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForSelector("canvas", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);                       // fonts and the first drawing; builds differ in what they signal
  await page.screenshot({ path: file });
  await ctx.close();
}

for (const [v, sha] of frames) {
  const dir = path.join(TMP, "v" + v);
  fs.mkdirSync(dir);
  execSync(`git archive ${sha} web | tar -x -C ${dir}`, { cwd: ROOT });
  const url = `http://localhost:${port}/v${v}/web/dial-tool.html`;
  try {
    await shoot(url, path.join(OUT, `${v}-opens.png`));
    await shoot(url, path.join(OUT, `${v}-watch.png`), { fn: (s) => localStorage.setItem("dial-tool-last", s), arg: JSON.stringify(watch) });
    console.log("ok", v);
  } catch (e) { console.log("FAIL", v, e.message.split("\n")[0]); }
  fs.rmSync(dir, { recursive: true, force: true });
}
await browser.close();
server.close();
fs.rmSync(TMP, { recursive: true, force: true });

// index.html: every step in docs/versions.md; the page keeps those whose pictures are in its folder, so a frame added
// later (a new step, or the past from 3.0) shows up without the page being written again
const all = [...last.values()].map(([v]) => v).sort((a, b) => (before(a, b) ? -1 : 1));
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><title>Dial Tool — progression</title>
<style>body{margin:0;background:#141414;color:#ddd;font:14px -apple-system,sans-serif}header{position:sticky;top:0;background:#141414;padding:12px 16px;display:flex;gap:16px;align-items:center}
input[type=range]{flex:1}#v{font-variant-numeric:tabular-nums;min-width:6em}main{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 16px 16px}img{width:100%;display:block}</style>
<header><b>Dial Tool</b><span id="v">…</span><input type="range" id="s" min="0" value="0"><span>as it opens · Okay's watch · ← →</span></header>
<main><img id="a"><img id="b"></main>
<script>const ALL=${JSON.stringify(all)};const s=document.getElementById("s");let V=[];
const has=(v)=>new Promise((ok)=>{const i=new Image();i.onload=()=>ok(true);i.onerror=()=>ok(false);i.src=v+"-opens.png";});
Promise.all(ALL.map(has)).then((r)=>{V=ALL.filter((v,i)=>r[i]);s.max=V.length-1;s.value=V.length-1;show();});
function show(){const v=V[s.value];if(!v)return;document.getElementById("v").textContent="beta "+v;document.getElementById("a").src=v+"-opens.png";document.getElementById("b").src=v+"-watch.png";}
s.oninput=show;document.onkeydown=(e)=>{if(e.key==="ArrowLeft")s.value--;if(e.key==="ArrowRight")s.value++;show();};</script>`);
console.log(frames.length, "steps shot into", OUT);
