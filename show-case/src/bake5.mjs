// Okay's three dials from his links (16:31), baked with the engine exactly as their settings say
import fs from "fs"; import path from "path"; import zlib from "zlib";
const W = "/home/claude/dial-tool/web";
const { engines } = await import(W + "/test/engines.mjs");
const { FONT_LIST } = await import(W + "/src/font_list.js");
const G = await engines();
for (const f of FONT_LIST) G.add_font(fs.readFileSync(path.join(W, "fonts", f.file)));
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
const links = fs.readFileSync("/home/claude/cases/links.txt", "utf8").trim().split("\n");
const names = ["Okay blue", "Okay military", "Okay Cinzel"];
const out = links.map((l, i) => {
  const lean = G.from_link_text(zlib.inflateRawSync(Buffer.from(G.un_base32(l.split("#")[1].slice(1)))).toString("utf8"));
  const S = G.fresh_settings(lean); S.guides = false;
  const items = G.scene(S, G.build_static(S), 36600, true, 0).filter((x) => x.fill && !x.stroke);
  while (G.NOTES.length) console.log(names[i], "note:", G.NOTES.shift());
  return { name: names[i], d: S.dial_d, own: true, items: items.map((x) => ({ role: x.role, hand: (x.role === "hand" || x.role === "mark") && ["hour", "minute", "second"].includes(x.name) ? x.name : null, p: x.path.svg(3), f: hex(x.fill), a: +x.fill[3] })) };
});
const all = JSON.parse(fs.readFileSync("/home/claude/cases/dials-cases.json", "utf8")).filter((d) => !names.includes(d.name));
fs.writeFileSync("/home/claude/cases/dials-cases.json", JSON.stringify([...all, ...out]));
console.log(out.map((o) => `${o.name} d ${o.d} items ${o.items.length} roles ${[...new Set(o.items.map((x) => x.role))].join(",")}`).join("\n"));
