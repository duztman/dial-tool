// a fat-numeral field dial, drawn once by the Dial Tool's engine: twelve Archivo numerals at weight 800, wide
import fs from "fs"; import path from "path";
const W = "/home/claude/dial-tool/web";
const { engines } = await import(W + "/test/engines.mjs");
const { FONT_LIST } = await import(W + "/src/font_list.js");
const G = await engines();
for (const f of FONT_LIST) G.add_font(fs.readFileSync(path.join(W, "fonts", f.file)));
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
const cream = [0.93, 0.91, 0.86, 1];
const S = G.fresh_settings({
  dial_d: 31, c_plate: [0.09, 0.09, 0.1, 1], c_backdrop: [0.5, 0.5, 0.5, 1], guides: false, da_on: false,
  rings: [
    { kind: 2, name: "Numerals", c: cream, r: 10.3, every: 1, size: 4.3, family: "Archivo", ps: "Archivo-SemiBold", axes: { wght: 820, wdth: 100 } },
    { name: "Minute ticks", c: cream, r: 15.1, count: 60, len: 1.1, w: 0.25 },
    { kind: 1, name: "Hour marks", c: cream, r: 15.1, every: 1, len: 1.8, w: 0.9 },
  ],
  ha_hour: { fit: false, len: 8.4, w: 1.9, tail: 1, tip: 0, c: cream, shape: 0 },
  ha_minute: { fit: false, len: 13.2, w: 1.5, tail: 1.4, tip: 0, c: cream, shape: 0 },
  ha_second: { fit: false, len: 13.8, w: 0.18, tail: 3, c: [0.85, 0.26, 0.15, 1] },
});
const st = G.build_static(S);
const items = G.scene(S, st, 36600, true, 0).filter((x) => x.fill && !x.stroke);
while (G.NOTES.length) console.log("note:", G.NOTES.shift());
const D = JSON.parse(fs.readFileSync("/home/claude/playbox/dials.json", "utf8")).filter((d) => d.name !== "Fat field");
D.push({ name: "Fat field", d: S.dial_d, items: items.map((x) => ({ role: x.role, hand: (x.role === "hand" || x.role === "mark") && ["hour", "minute", "second"].includes(x.name) ? x.name : null, p: x.path.svg(3), f: hex(x.fill), a: +x.fill[3] })) });
fs.writeFileSync("/home/claude/cases/dials-cases.json", JSON.stringify(D));
console.log(items.length, items.map((x) => x.role).join(" "));
