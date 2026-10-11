// the two engines, loaded for Node (tests only; the page loads them in app.js)
import fs from "fs";
import { createRequire } from "module";
import * as HB from "harfbuzzjs";
import * as G from "../src/geometry.js";

const require = createRequire(import.meta.url);

export async function engines(font = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf") {
  const PathKitInit = require("pathkit-wasm/bin/pathkit.js");
  const PK = await PathKitInit({ wasmBinary: fs.readFileSync(require.resolve("pathkit-wasm/bin/pathkit.wasm")) });
  G.start(PK, HB);
  G.add_font(fs.readFileSync(font), 0, true);      // stands in for every font, as the Python harness's test font does
  return G;
}
