// claims.mjs — the guide's truth gate (guide/PLAN.md §5): every check a sentence names (<!-- check: B8 -->) must
// exist and have passed in the last run of guide/checks/checks.mjs. Exits 1 otherwise.
//
//   node guide/tools/claims.mjs            (from the repo's root)
import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const results = JSON.parse(fs.readFileSync(path.join(root, "guide/checks/results.json"), "utf8"));
const bad = [], named = new Map();
for (const file of fs.readdirSync(path.join(root, "guide/text")).filter((f) => f.endsWith(".md"))) {
  const lines = fs.readFileSync(path.join(root, "guide/text", file), "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/<!-- check: ([A-Za-z0-9]+) -->/g)) {
      const id = m[1], r = results.results[id];
      named.set(id, (named.get(id) || 0) + 1);
      if (!r) bad.push(`${file}:${i + 1} names ${id}, which has no check`);
      else if (!r.ok) bad.push(`${file}:${i + 1} names ${id}, which fails: ${r.note}`);
    }
  });
}
console.log(`${[...named.values()].reduce((a, b) => a + b, 0)} sentences name ${named.size} checks; run of ${results.when.slice(0, 16)} on ${results.version || "?"}`);
for (const b of bad) console.log("FAIL  " + b);
const unused = Object.keys(results.results).filter((id) => !named.has(id));
if (unused.length) console.log("checks no sentence names yet: " + unused.join(" "));
process.exit(bad.length ? 1 : 0);
