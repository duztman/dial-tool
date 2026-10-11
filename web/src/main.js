// Dial Tool, web version — start: unpack the two engines and the stand-in font that
// are packed inside the page (build.mjs puts them there), then open the window.

import PathKitInit from "pathkit-wasm/bin/pathkit.js";
import * as HarfBuzz from "harfbuzzjs";
import { open_window } from "./app.js";

const pathkit = await PathKitInit({ wasmBinary: globalThis.__DIAL.bytes("pathkit") });
await open_window(pathkit, HarfBuzz, globalThis.__DIAL.bytes("font"));
