// Dial Tool, web version — files out: SVG and PDF, both vector and at true size.
// Both draw the scene (R26) and nothing else; guides and backdrop never reach a file (R5).

import { MM, scene, turned, page_mm } from "./geometry.js";

const num = (v, digits = 4) => {
  const s = v.toFixed(digits);
  return s.includes(".") ? s.replace(/\.?0+$/, "") || "0" : s;
};
const rgb = (c) => `rgb(${c.slice(0, 3).map((v) => Math.round(v * 255)).join(",")})`;

/** the shapes of a scene, hands turned to their angle: [{role, path, fill, …}] without guides. */
function drawn(S, statik, t, preview, selected) {
  return scene(S, statik, t, preview, selected).map((item) => (item.role === "hand" ? { ...item, path: turned(item.path, item.angle) } : item));
}

/** an SVG file's text. The page is the dial plus its margins, in millimetres. */
export function svg_document(S, statik, t, { preview = false, selected = null } = {}) {
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
    if (item.role === "guide") {
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
