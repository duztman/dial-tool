// the dials for the five-lights batch (15:54): two fonts for the dress, two for the field
//   dress A: Italiana — the narrowest serif in the roster (a condensed Didone); Roman numerals, larger, turning with the
//            ring and flipping at the bottom, tracked open so no two letters touch
//   dress B: Koch Fraktur — the old script; Arabic numerals, upright, larger
//   field A/B: Public Sans · Space Grotesk — grotesques, bold, proportional figures (pnum on, tnum off), not monospaced;
//            tracking tight so 10, 11 and 12 sit close
import fs from "fs"; import path from "path";
const W = "/home/claude/dial-tool/web";
const { engines } = await import(W + "/test/engines.mjs");
const { FONT_LIST } = await import(W + "/src/font_list.js");
const { DIALS: GALLERY } = await import(W + "/gallery.mjs");
const G = await engines();
for (const f of FONT_LIST) G.add_font(fs.readFileSync(path.join(W, "fonts", f.file)));
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
const bake = (name, S) => {
  const items = G.scene(S, G.build_static(S), 36600, true, 0).filter((x) => x.fill && !x.stroke);
  while (G.NOTES.length) console.log(name, "note:", G.NOTES.shift());
  return { name, d: S.dial_d, items: items.map((x) => ({ role: x.role, hand: (x.role === "hand" || x.role === "mark") && ["hour", "minute", "second"].includes(x.name) ? x.name : null, p: x.path.svg(3), f: hex(x.fill), a: +x.fill[3] })) };
};
const dressBase = () => structuredClone(GALLERY.find((d) => d.name === "Dress, am · pm").settings);
const dA = dressBase(); Object.assign(dA.rings[0], { labels: 1, mode: 2, size: 5.0, width: 1, r: 12.5, family: "Italiana", ps: "Italiana-Regular", axes: {}, tracking: 90 });
const dB = dressBase(); Object.assign(dB.rings[0], { labels: 0, mode: 0, size: 4.6, width: 1, r: 12.3, family: "Koch-Fraktur", ps: "KochFetteDeutscheSchriftUNZ1A", axes: {}, tracking: 30 });
const cream = [0.93, 0.91, 0.86, 1];
const field = (family, ps, wght, tracking) => G.fresh_settings({
  dial_d: 31, c_plate: [0.09, 0.09, 0.1, 1], c_backdrop: [0.5, 0.5, 0.5, 1], guides: false, da_on: false,
  rings: [
    { kind: 2, name: "Numerals", c: cream, r: 10.4, every: 1, size: 4.4, family, ps, axes: { wght }, features: { pnum: 1, tnum: 0 }, tracking },
    { name: "Minute ticks", c: cream, r: 15.1, count: 60, len: 1.1, w: 0.25 },
    { kind: 1, name: "Hour marks", c: cream, r: 15.1, every: 1, len: 1.8, w: 0.9 },
  ],
  ha_hour: { fit: false, len: 8.4, w: 1.9, tail: 1, tip: 0, c: cream, shape: 0 },
  ha_minute: { fit: false, len: 13.2, w: 1.5, tail: 1.4, tip: 0, c: cream, shape: 0 },
  ha_second: { fit: false, len: 13.8, w: 0.18, tail: 3, c: [0.85, 0.26, 0.15, 1] },
});
const out = [bake("Dress Italiana", G.fresh_settings(dA)), bake("Dress Fraktur", G.fresh_settings(dB)),
  bake("Field Public Sans", field("Public Sans", "PublicSans-Thin", 800, -60)), bake("Field Space Grotesk", field("Space Grotesk", "SpaceGrotesk-Light", 700, -60))];
const all = JSON.parse(fs.readFileSync("/home/claude/cases/dials-cases.json", "utf8")).filter((d) => !out.some((o) => o.name === d.name));
fs.writeFileSync("/home/claude/cases/dials-cases.json", JSON.stringify([...all, ...out]));
console.log("ok", out.map((o) => o.name + " " + o.items.length).join(", "));
