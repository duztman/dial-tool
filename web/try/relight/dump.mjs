// dump.mjs — the opener dial's parts as show.js hands them to watch.js, for the relight trial (branch try/relight).
// Run from web/: node try/relight/dump.mjs → try/relight/scene.js
import fs from "fs";
import { engines } from "../../test/engines.mjs";
const G = await engines("fonts/Barlow-SemiBold.ttf");
const { OPENER } = await import("../../src/opener.js");
const SHOW = await import("../../src/show.js");
const S = G.fresh_settings(OPENER);
S.sh_on = true; S.sh_from = 135; S.sh_rise = 40;
const statik = G.build_static(S);
const items = G.scene(S, statik, S.t ?? 0, true, null).filter((x) => x.fill && !x.stroke);
const o = SHOW.options(S, items, true);
const A = {}; for (const x of G.scene(S, statik, S.t ?? 0, true, null)) if (x.role === "hand" && ["hour", "minute", "second"].includes(x.name)) A[x.name] = x.angle;
const out = { d: S.dial_d, size: o.size, items: o.items, A, heights: o.heights, metal: o.metal, leather: o.leather, floor: o.floor, floor2: o.floor2, insert: o.insert, L: o.L, h: o.h, ink_step: G.INK_STEP_MM };
fs.writeFileSync("try/relight/scene.js", "window.SCENE = " + JSON.stringify(out) + ";\n");
console.log(out.items.length, "parts;", out.items.map((x) => x.role + (x.hand ? ":" + x.hand : "") + "@" + (x.ink * G.INK_STEP_MM).toFixed(2)).join(" "), "\nangles", A, "heights", o.heights, "size", o.size);
