// Dial Tool, web version — files out: SVG and PDF, both vector and at true size.
// Both draw the scene (R26) and nothing else; guides and backdrop never reach a file (R5).

import { MM, scene, turned, page_mm, live_texts, font_of, has_font, Path } from "./geometry.js";

const num = (v, digits = 4) => {
  const s = (v + 0).toFixed(digits).replace(/^-(0(\.0+)?)$/, "$1");       // no "-0"
  return s.includes(".") ? s.replace(/\.?0+$/, "") || "0" : s;
};
const rgb = (c) => `rgb(${c.slice(0, 3).map((v) => Math.round(v * 255)).join(",")})`;

/** the shapes of a scene, hands turned to their angle: [{role, path, fill, …}] without guides. */
function drawn(S, statik, t, preview, selected) {
  return scene(S, statik, t, preview, selected).map((item) => (item.role === "hand" ? { ...item, path: turned(item.path, item.angle) } : item));
}

const WEIGHTS = [["extralight", 200], ["ultralight", 200], ["thin", 100], ["hairline", 100], ["semibold", 600], ["demibold", 600], ["extrabold", 800],
  ["ultrabold", 800], ["light", 300], ["medium", 500], ["bold", 700], ["black", 900], ["heavy", 900]];
const escaped = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** one live text → an SVG <text>. The steps are in mm with y up; SVG's y runs down, so every
 *  move and turn is mirrored. The font is named, not built in: it must be installed where the file is opened. */
function svg_text(x) {
  const t = x.t, font = has_font(t.ps) ? font_of(t) : { family: t.family, style: "", ps: t.ps };
  const style = (font.style || "").toLowerCase().replace(/[\s-]/g, "");
  const weight = (WEIGHTS.find(([name]) => style.includes(name)) || [0, 400])[1];
  const steps = x.steps.map((s) => (s[0] === "t" ? `translate(${num(s[1])} ${num(-s[2])})` : `rotate(${num(-s[1])} ${num(s[2])} ${num(-s[3])})`)).join(" ");
  const features = Object.entries(t.features || {}).map(([tag, on]) => `'${tag}' ${on ? 1 : 0}`).join(", ");
  const axes = Object.entries(t.axes || {}).map(([tag, v]) => `'${tag}' ${num(v)}`).join(", ");
  const css = [features && `font-feature-settings:${features}`, axes && `font-variation-settings:${axes}`].filter(Boolean).join(";");
  return `<text transform="${steps}" x="${num(x.at[0])}" y="${num(-x.at[1])}" font-family="${escaped(font.family)}" data-font="${escaped(font.ps)}" font-size="${num(x.size)}"`
    + (weight !== 400 ? ` font-weight="${weight}"` : "") + (/italic|oblique/.test(style) ? ` font-style="italic"` : "")
    + (t.tracking ? ` letter-spacing="${num(t.tracking / 1000 * x.size)}"` : "") + (css ? ` style="${css}"` : "")
    + ` fill="${rgb(x.fill)}"${x.fill[3] < 1 ? ` fill-opacity="${num(x.fill[3])}"` : ""}>${escaped(x.txt)}</text>`;
}

/** an SVG file's text. The page is the dial plus its margins, in millimetres.
 *  live: numerals and window text stay text (export option, as in dial.py); masks stay outlines. */
export function svg_document(S, statik, t, { preview = false, selected = null, live = false } = {}) {
  live = live && !preview && !S.out_production;
  const size = page_mm(S), flip = S.out_mirror ? -1 : 1;
  const out = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${num(size)}mm" height="${num(size)}mm" viewBox="0 0 ${num(size)} ${num(size)}">`,
  ];
  if (preview && !S.out_production) out.push(`<rect width="${num(size)}" height="${num(size)}" fill="${rgb(S.c_backdrop)}"/>`);
  out.push(`<g transform="translate(${num(size / 2)} ${num(size / 2)}) scale(${flip} 1)">`);
  for (const item of drawn(S, statik, t, preview, selected)) {
    const name = item.role === "ring" ? item.ring.ring.name : item.role === "hand" ? item.name + " hand" : item.role;
    const id = ` id="${name.replace(/[^A-Za-z0-9]+/g, "-")}-${out.length}"`;
    const text = live ? live_texts(S, statik, item) : null;
    if (text && text.texts.length) {
      let clip = "";
      if (text.removed) {                          // everything except what was cut away
        const area = new Path().rect(-500, -500, 1000, 1000).difference(text.removed);
        out.push(`<clipPath id="cut-${out.length}"><path d="${area.svg(5, true)}"/></clipPath>`);
        clip = ` clip-path="url(#cut-${out.length - 1})"`;
      }
      out.push(`<g${id}${clip}>`, ...text.texts.map(svg_text), `</g>`);
    } else if (item.role === "guide") {
      out.push(`<path${id} d="${item.path.svg(5, true)}" fill="none" stroke="${rgb(item.stroke)}" stroke-opacity="${item.stroke[3]}" stroke-width="${num(0.03 * item.px)}"/>`);
    } else {
      const alpha = item.fill[3] < 1 ? ` fill-opacity="${num(item.fill[3])}"` : "";
      out.push(`<path${id} d="${item.path.svg(5, true)}" fill="${rgb(item.fill)}"${alpha}/>`);
    }
  }
  out.push(`</g>`, `</svg>`);
  return out.join("\n");
}

/** a one-page PDF as bytes: filled paths only (R4), page = dial + margins at true size. */
export function pdf_document(S, statik, t) {
  const size = page_mm(S) * MM, flip = S.out_mirror ? -1 : 1;
  const alphas = [];                               // one graphics state per transparency used
  const body = [`q ${num(MM * flip, 6)} 0 0 ${num(MM, 6)} ${num(size / 2)} ${num(size / 2)} cm`];
  for (const item of drawn(S, statik, t, false, null)) {
    const [r, g, b, a] = item.fill;
    if (a < 1 && !alphas.includes(a)) alphas.push(a);
    body.push(a < 1 ? `q /A${alphas.indexOf(a)} gs` : "q", `${num(r)} ${num(g)} ${num(b)} rg`);
    for (const c of item.path.d) {
      const v = c.slice(1).map((x) => num(x, 5)).join(" ");
      body.push(c[0] === "M" ? `${v} m` : c[0] === "L" ? `${v} l` : c[0] === "C" ? `${v} c` : "h");
    }
    body.push("f", "Q");
  }
  body.push("Q");
  const stream = body.join("\n");
  const states = alphas.map((a, i) => `/A${i} << /ca ${num(a)} >>`).join(" ");
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(size)} ${num(size)}] /Contents 4 0 R /Resources << /ExtGState << ${states} >> >> >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Title (Dial Tool) /Creator (Dial Tool, web version) >>`,
  ];
  let text = "%PDF-1.4\n";
  const starts = [];
  objects.forEach((o, i) => {
    starts.push(text.length);
    text += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = text.length;
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + starts.map((s) => String(s).padStart(10, "0") + " 00000 n \n").join("");
  text += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(text);           // every character is plain ASCII, so bytes = characters
}
