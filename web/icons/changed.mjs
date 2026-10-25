// icons/changed.mjs — runs the icon check only when an icon could have changed (R19, a small push; Okay, 19 Oct 2026:
// "Icon check all, is it necessary? Just for the updated ones in the last round … I doubt icons [affect each other]").
// Every icon is drawn in src/icons.js, so: when that file differs from the last commit, or anything under icons/
// does, the check runs whole (it must open every state to find
// the icons anyway — the rules themselves cost nothing); otherwise nothing ran and nothing could have moved.
//
//   cd web && node icons/changed.mjs          (part of `npm run small`)
import { execSync } from "child_process";

const diff = execSync("git diff --unified=0 HEAD -- src/icons.js icons/", { encoding: "utf8" });
const in_block = /^diff --git a\/src\/icons\.js/m.test(diff);
const in_tools = /^diff --git a\/icons\//m.test(diff);
if (!in_block && !in_tools) { console.log("ok    icons unchanged since the last commit: the icon check is skipped (R19, a small push)"); process.exit(0); }
console.log(`icons changed (${in_block ? "src/icons.js" : ""}${in_block && in_tools ? ", " : ""}${in_tools ? "icons/" : ""}): the icon check runs`);
execSync("node icons/check.mjs", { stdio: "inherit" });
