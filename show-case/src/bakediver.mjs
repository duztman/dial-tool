// a quiet Seiko-diver dial (after the SPB143: black sunburst, applied batons, no numbers), drawn by the engine
import fs from "fs"; import path from "path";
const W = "/home/claude/dial-tool/web";
const { engines } = await import(W + "/test/engines.mjs");
const { FONT_LIST } = await import(W + "/src/font_list.js");
const G = await engines();
for (const f of FONT_LIST) G.add_font(fs.readFileSync(path.join(W, "fonts", f.file)));
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
const lume = [0.9, 0.9, 0.86, 1], steel = [0.82, 0.83, 0.82, 1];
const S = G.fresh_settings({
  dial_d: 30.8, c_plate: [0.12, 0.125, 0.135, 1], c_backdrop: [0.5, 0.5, 0.5, 1], guides: false, da_on: false,
  rings: [
    { kind: 1, name: "Hour batons", c: lume, r: 13.2, every: 1, len: 3.6, w: 1.5 },
    { name: "Minute ticks", c: [0.75, 0.75, 0.72, 1], r: 15.0, count: 60, len: 0.9, w: 0.2 },
  ],
  ha_hour: { fit: false, len: 8.0, w: 1.9, tail: 1.2, tip: 1.2, c: steel },
  ha_minute: { fit: false, len: 12.6, w: 1.5, tail: 1.6, tip: 1.6, c: steel },
  ha_second: { fit: false, len: 13.6, w: 0.25, tail: 3.2, c: [0.85, 0.85, 0.82, 1] },
});
const items = G.scene(S, G.build_static(S), 36600, true, 0).filter((x) => x.fill && !x.stroke);
while (G.NOTES.length) console.log("note:", G.NOTES.shift());
const D = JSON.parse(fs.readFileSync("/home/claude/cases/dials-cases.json", "utf8")).filter((d) => d.name !== "Quiet diver");
D.push({ name: "Quiet diver", d: S.dial_d, items: items.map((x) => ({ role: x.role, hand: (x.role === "hand" || x.role === "mark") && ["hour", "minute", "second"].includes(x.name) ? x.name : null, p: x.path.svg(3), f: hex(x.fill), a: +x.fill[3] })) });
fs.writeFileSync("/home/claude/cases/dials-cases.json", JSON.stringify(D));
console.log(items.length, items.map((x) => x.role).join(" "));
