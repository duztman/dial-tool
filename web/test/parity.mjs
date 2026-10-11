// draws each settings file in a folder with the web geometry → <name>.web.pdf and <name>.web.svg
// (test/parity.py makes the folder, draws the same settings with dial.py, and compares)
import fs from "fs";
import path from "path";
import { engines } from "./engines.mjs";
import { pdf_document, svg_document } from "../src/output.js";

const dir = process.argv[2];
const G = await engines();
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const S = G.fresh_settings(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
  const t0 = performance.now();
  const statik = G.build_static(S);
  const ms = performance.now() - t0;
  const name = path.join(dir, file.replace(/\.json$/, ""));
  fs.writeFileSync(name + ".web.pdf", pdf_document(S, statik, S.t));
  fs.writeFileSync(name + ".web.svg", svg_document(S, statik, S.t));
  console.log(`${file.padEnd(28)} ${statik.rings.length} rings · geometry ${ms.toFixed(0).padStart(4)} ms`);
}
