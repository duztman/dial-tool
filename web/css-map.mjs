// css-map.mjs — the stylesheet's tokens, each with its value, its comment and where it is used.
//
//   node css-map.mjs          writes ../docs/css-map.md from web/src/css/
//   node css-map.mjs check    fails if docs/css-map.md is not what the stylesheet gives (run by npm test and npm run small)
//
// It is the generated half of docs/sectors.md (the index into the design rules): sectors.md names a region and its
// levers; this map says what each lever is set to, what it was for (the comment beside it in 1-tokens.css, or where it
// is set) and which files use it — so a session changing a value sees at once what else moves with it.
// Nothing in it is written by hand: change the stylesheet, run it again.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "src", "css");
const out = join(here, "..", "docs", "css-map.md");
const files = readdirSync(dir).filter(f => f.endsWith(".css")).sort();
const text = Object.fromEntries(files.map(f => [f, readFileSync(join(dir, f), "utf8")]));

// where each token is set: file, value, the comment on its line (or the one just above)
const set = new Map();
for (const f of files) {
  const lines = text[f].split("\n");
  lines.forEach((line, i) => {
    const re = /(--[a-z][\w-]*)\s*:\s*([^;{}]+);/g;
    let m;
    while ((m = re.exec(line))) {
      const name = m[1], value = m[2].trim();
      let note = (line.match(/\/\*\s*(.*?)\s*\*\//) || [])[1] || "";
      if (!note && i && /^\s*\/\*/.test(lines[i - 1]) && !/--/.test(lines[i - 1])) note = lines[i - 1].replace(/^\s*\/\*\s*|\s*\*\/\s*$/g, "");
      const selector = scope(lines, i);
      const e = set.get(name) || { name, where: [] };
      e.where.push({ file: f, value, note: note.replace(/\s+/g, " ").trim(), selector });
      set.set(name, e);
    }
  });
}
// the nearest selector above a line (what block the setting stands in)
function scope(lines, i) {
  for (let k = i; k >= 0; k--) {
    const m = lines[k].match(/^\s*([^{}/*][^{}]*?)\s*\{\s*$/) || lines[k].match(/^\s*([^{}/*][^{}]*?)\s*\{/);
    if (m && !/^@/.test(m[1])) return m[1].replace(/\s+/g, " ").trim();
    if (/^\s*\}/.test(lines[k]) && k < i) continue;
  }
  return "";
}
// where each token is used (var(--x)), per file
const used = new Map();
for (const f of files) {
  for (const m of text[f].matchAll(/var\(\s*(--[a-z][\w-]*)/g)) {
    const u = used.get(m[1]) || new Map();
    u.set(f, (u.get(f) || 0) + 1);
    used.set(m[1], u);
  }
}
// the specials block of 1-tokens.css: everything after its heading comment
const tokens = text["1-tokens.css"];
const specialsAt = tokens.indexOf("specials (R32)");
const specialNames = new Set();
if (specialsAt >= 0) for (const m of tokens.slice(specialsAt).matchAll(/(--[a-z][\w-]*)\s*:/g)) specialNames.add(m[1]);

// the window's part in it: a token set from JavaScript (setProperty, an inline style) or read by it (token(), getPropertyValue)
const js = new Map();
for (const f of readdirSync(join(here, "src")).filter(f => f.endsWith(".js")).sort()) {
  const s = readFileSync(join(here, "src", f), "utf8");
  for (const m of s.matchAll(/setProperty\(\s*["'](--[\w-]+)/g)) note(m[1], "set by " + f);
  for (const m of s.matchAll(/\bset\(\s*["'](--[\w-]+)/g)) note(m[1], "set by " + f);                  // show.js's set(name, value)
  for (const m of s.matchAll(/\[\s*["'](--[\w-]+)["']\s*,\s*["'](--[\w-]+)["']\s*\]/g)) note(m[1], "set by " + f);      // mode.js's [to, from] pairs
  for (const m of s.matchAll(/style(?:=|:\s*)[`"'][^`"']*?(--[\w-]+)\s*:/g)) note(m[1], "set by " + f);      // an inline style
  for (const m of s.matchAll(/(?:token|getPropertyValue)\(\s*["'](--[\w-]+)/g)) note(m[1], "read by " + f);
}
function note(name, what) { const a = js.get(name) || new Set(); a.add(what); js.set(name, a); }

const short = f => f.replace(/\.css$/, "");
const rows = [];
const names = [...new Set([...set.keys(), ...used.keys()])].sort();
for (const name of names) {
  const e = set.get(name);
  const u = used.get(name);
  const where = e ? e.where : [];
  const base = where.find(w => w.file === "1-tokens.css") || where[0];
  const value = base ? base.value : "—";
  const note = base ? base.note : "";
  const again = where.filter(w => w !== base).map(w => `${short(w.file)} \`${w.selector || ":root"}\` → \`${w.value}\``);
  const uses = u ? [...u.entries()].map(([f, n]) => `${short(f)}${n > 1 ? " ×" + n : ""}`).join(", ") : "—";
  const kind = !e ? "**not set**" : specialNames.has(name) ? "special" : base.file === "1-tokens.css" ? "" : "set in " + short(base.file);
  const win = js.has(name) ? [...js.get(name)].join(", ") : "";
  rows.push({ name, value, note, again: win ? [...again, win] : again, uses, kind, unused: !u && !win });
}
const unset = rows.filter(r => r.kind === "**not set**" && !js.has(r.name)).map(r => r.name);
const unused = rows.filter(r => r.unused && r.kind !== "**not set**").map(r => r.name);

let md = `# The stylesheet's tokens — a map

*Generated by \`web/css-map.mjs\` from \`web/src/css/\`; never edited by hand (\`npm test\` fails when it is stale). ${rows.length} tokens, ${files.length} files. The regions these levers belong to: \`sectors.md\`. The rules: R32, R32a–c.*

- A token's value is the one in \`1-tokens.css\` (or where it is first set); *set again* says where a part sets it anew (a scrolling part's surface, show mode's column).
- *Used in* counts \`var(--name)\` per file; a token used nowhere is listed at the end, as is a token used but never set.
- A **special** is in the specials block (R32b): off the scale on purpose, with Okay's words beside it in the file.

| Token | Value | What it is for | Used in | Set again |
|---|---|---|---|---|
`;
for (const r of rows) {
  if (r.unused || (r.kind === "**not set**" && !js.has(r.name))) continue;
  md += `| \`${r.name}\`${r.kind && r.kind !== "**not set**" ? " · " + r.kind : (r.kind ? " · the window's" : "")} | \`${r.value.replace(/\|/g, "\\|")}\` | ${r.note.replace(/\|/g, "\\|")} | ${r.uses} | ${r.again.join("; ").replace(/\|/g, "\\|")} |\n`;
}
md += `\n**Set but used nowhere** (${unused.length}): ${unused.map(n => "`" + n + "`").join(", ") || "none"}.\n`;
md += `\n**Used but never set** (${unset.length}): ${unset.map(n => "`" + n + "`").join(", ") || "none"}.\n`;

if (process.argv[2] === "check") {
  const now = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (now !== md) { console.log("fail  docs/css-map.md is stale: run `node css-map.mjs` and commit it"); process.exit(1); }
  console.log(`ok    docs/css-map.md matches the stylesheet (${rows.length} tokens)`);
} else {
  writeFileSync(out, md);
  console.log(`wrote docs/css-map.md: ${rows.length} tokens; ${unused.length} set but unused; ${unset.length} used but unset`);
}
