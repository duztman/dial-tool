// icons/changed.mjs — runs the icon check only when an icon could have changed (R19, a small push; Okay, 19 Oct 2026:
// "Icon check all, is it necessary? Just for the updated ones in the last round … I doubt icons [affect each other]").
// An icon is drawn in the icon block at the top of src/app.js (from "// ── icons" to "// ── rows"), so: when that block
// differs from the last commit, or anything under icons/ does, the check runs whole (it must open every state to find
// the icons anyway — the rules themselves cost nothing); otherwise nothing ran and nothing could have moved.
//
//   cd web && node icons/changed.mjs          (part of `npm run small`)
import { execSync } from "child_process";
import fs from "fs";

const lines = fs.readFileSync("src/app.js", "utf8").split("\n");
const from = lines.findIndex((l) => l.startsWith("// ── icons")) + 1, to = lines.findIndex((l) => l.startsWith("// ── rows")) + 1;
const diff = execSync("git diff --unified=0 HEAD -- src/app.js icons/", { encoding: "utf8" });
const hunks = [...diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)].map((m) => [+m[1], +m[1] + (m[2] === undefined ? 1 : +m[2])]);
const in_block = hunks.some(([a, b]) => a <= to && b >= from);
const in_tools = /^diff --git a\/icons\//m.test(diff);
if (!in_block && !in_tools) { console.log("ok    icons unchanged since the last commit: the icon check is skipped (R19, a small push)"); process.exit(0); }
console.log(`icons changed (${in_block ? "the icon block in app.js" : ""}${in_block && in_tools ? ", " : ""}${in_tools ? "icons/" : ""}): the icon check runs`);
execSync("node icons/check.mjs", { stdio: "inherit" });
