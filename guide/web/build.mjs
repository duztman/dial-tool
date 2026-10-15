// build.mjs — edition 1 of the guide as one plain web page (guide/PLAN.md step 5): the text of guide/text/edition-1.md,
// the First dial's pictures and links (guide/checks/first-dial.json). No designed look yet (that is step 7): a clean,
// readable page on the canon's paper and ink. Refuses to build if a sentence's check fails (tools/claims.mjs).
//
//   node guide/web/build.mjs         → guide/web/out/index.html (+ img/), for /dial-tool/guide/
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const HERE = path.dirname(new URL(import.meta.url).pathname), ROOT = path.resolve(HERE, "../.."), OUT = path.join(HERE, "out");
const APP = "https://duztman.github.io/dial-tool/";
execFileSync("node", [path.join(ROOT, "guide/tools/claims.mjs")], { stdio: "inherit" });      // throws if a check fails
const first = JSON.parse(fs.readFileSync(path.join(ROOT, "guide/checks/first-dial.json"), "utf8"));
const version = JSON.parse(fs.readFileSync(path.join(ROOT, "guide/checks/results.json"), "utf8")).version;
const app = fs.readFileSync(path.join(ROOT, "web/src/geometry.js"), "utf8").match(/VERSION = "([^"]+)"/)[1];
if (app !== version || first.version !== app) throw new Error(`the checks ran on ${version}, the First dial on ${first.version}, the app is ${app}: run guide/checks/checks.mjs and first-dial.mjs again`);
let md = fs.readFileSync(path.join(ROOT, "guide/text/edition-1.md"), "utf8");
md = md.replace(/^# .*\n\n\*[^\n]*\*\n/, "");                          // the draft's own title and note

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s.replace(/\s*<!-- check: \w+ -->/g, ""))
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const html = [], toc = [];
let list = null, table = null, firstDial = false;
const close = () => { if (list) { html.push(`</${list}>`); list = null; } if (table) { html.push("</tbody></table>"); table = null; } };
for (const line of md.split("\n")) {
  if (/^---\s*$/.test(line)) { close(); html.push("</section><section>"); continue; }
  let m;
  if ((m = line.match(/^## (.+)/))) { close(); toc.push([slug(m[1]), m[1]]); firstDial = /first dial/i.test(m[1]); html.push(`<h2 id="${slug(m[1])}">${inline(m[1])}</h2>`); continue; }
  if ((m = line.match(/^### (.+)/))) { close(); html.push(`<h3>${inline(m[1])}</h3>`); continue; }
  if ((m = line.match(/^(\d+)\. (.+)/))) {
    if (list !== "ol") { close(); html.push('<ol class="steps">'); list = "ol"; }
    const step = firstDial ? first.steps.find((s) => s.n === +m[1]) : null;
    html.push(`<li><p>${inline(m[2])}</p>` + (step ? `<figure><img src="img/${step.picture}" alt="The dial after step ${step.n}: ${esc(step.title)}"><figcaption><a href="${APP}${step.link}">Open the dial as it is after this step</a> · beta ${esc(version.replace("beta ", ""))}, iPad</figcaption></figure>` : "") + "</li>");
    continue;
  }
  if (line.startsWith("|")) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.every((c) => /^-+$/.test(c))) continue;
    if (!table) { close(); html.push(`<table><thead><tr>${cells.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>`); table = true; continue; }
    html.push(`<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`); continue;
  }
  if (!line.trim()) { if (table) close(); continue; }
  close();
  if ((m = line.match(/^Watch: (.+)/))) html.push(`<p class="watch"><strong>Watch:</strong> ${inline(m[1])}</p>`);
  else html.push(`<p>${inline(line)}</p>`);
}
close();

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dial Tool guide</title>
<style>
:root{--paper:#FCFCFA;--ink:#111;--grey:#5C5C58;--rule:#B9B9B4;--ground:#ECECE8}
html{background:var(--paper);color:var(--ink);font:16px/1.5 Inter,"Helvetica Neue",Arial,sans-serif;-webkit-text-size-adjust:100%}
body{margin:0 auto;max-width:720px;padding:24px 20px 96px}
header{border-bottom:2px solid var(--ink);padding-bottom:12px;margin-bottom:8px}
header h1{font-weight:300;font-size:40px;line-height:1.05;margin:0 0 8px}
header p{margin:0;color:var(--grey);font-size:14px}
nav{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:14px;margin:12px 0 0}
nav a{color:var(--ink)}
section{border-top:1px solid var(--rule);padding-top:8px;margin-top:40px}
section:first-of-type{border:0;margin-top:0}
h2{font-weight:300;font-size:30px;line-height:1.15;margin:16px 0 12px}
h3{font-size:16px;margin:28px 0 4px;padding-top:8px;border-top:1px solid var(--ground)}
p{margin:0 0 12px}
.watch{font-size:14px;color:var(--grey);margin:-4px 0 16px 20px}
ol.steps{padding-left:0;list-style:none;counter-reset:s}
ol.steps li{counter-increment:s;margin:0 0 28px;padding-left:36px;position:relative}
ol.steps li::before{content:counter(s);position:absolute;left:0;top:0;font-weight:600}
figure{margin:8px 0 0}
figure img{width:100%;max-width:420px;height:auto;display:block;background:var(--ground)}
figcaption{font-size:13px;color:var(--grey);margin-top:4px}
figcaption a{color:var(--ink)}
table{border-collapse:collapse;width:100%;font-size:14px;margin:8px 0 16px}
th{text-align:left;border-bottom:1px solid var(--ink);padding:6px 8px 6px 0}
td{border-bottom:1px solid var(--rule);padding:6px 8px 6px 0;vertical-align:top}
code{font-size:.9em;background:var(--ground);padding:0 3px}
a{color:var(--ink);text-underline-offset:3px}
footer{margin-top:56px;font-size:13px;color:var(--grey);border-top:1px solid var(--rule);padding-top:8px}
</style></head><body>
<header><h1>Dial Tool guide</h1><p>Edition 1, draft · ${new Date().toISOString().slice(0, 10)} · for <a href="${APP}">Dial Tool</a> ${esc(version)}. Pictures from an iPad held landscape.</p>
<nav>${toc.map(([id, t]) => `<a href="#${id}">${inline(t)}</a>`).join("")}</nav></header>
<section>${html.join("\n")}</section>
<footer>Every “do this and that happens” sentence here was checked against ${esc(version)} by a script. Found something wrong? It is a fault: tell Okay.</footer>
</body></html>`;
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, "img"), { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), page);
for (const s of first.steps) fs.copyFileSync(path.join(HERE, "img", s.picture), path.join(OUT, "img", s.picture));
console.log(`guide/web/out/index.html · ${(page.length / 1024).toFixed(0)} KB · ${first.steps.length} pictures`);
