// Dial Tool, web version — files out: SVG and PDF, both vector and at true size.
// Both draw the scene (R26) and nothing else; guides and backdrop never reach a file (R5).

import { MM, scene, turned, page_mm, live_texts, font_of, has_font, Path, circle, VERSION } from "./geometry.js";

// who made a file, written into every PDF, SVG and PNG (#226): which build drew it, so a file can be traced to its version
export const MADE_BY = `Dial Tool, web version, ${VERSION}`;

/** a number for a file: at most `digits` decimals, no trailing zeros, no "-0" (the Wear OS export uses it too). */
export const num = (v, digits = 4) => {
  const s = (v + 0).toFixed(digits).replace(/^-(0(\.0+)?)$/, "$1");       // no "-0"
  return s.includes(".") ? s.replace(/\.?0+$/, "") || "0" : s;
};
/** a colour as #RRGGBB, as SVG and Wear OS write it. */
export const rgb = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();

/** what a scene item is called in a file: a layer in the PDF, an id in the SVG. */
function item_name(item) {
  if (item.role === "ring") return (item.ring.ring.name || item.ring.kind) + (item.part ? ` colour ${item.part}` : "");      // a band with sector colours is one shape per colour
  if (item.role === "hand") return { hour: "Hour hand", minute: "Minute hand", second: "Seconds hand" }[item.name] || item.name;
  if (item.role === "mark") return ({ hour: "Hour hand", minute: "Minute hand", second: "Seconds hand" }[item.name] || item.name) + " mark";      // a disc's painted mark (#300)
  if (item.window !== undefined) return `Window ${item.window + 1} ${{ "date disc": "disc", "date number": "content", "date picture": "picture", "date frame": "frame", cutline: "cut line" }[item.role] || item.role}`;
  return item.role[0].toUpperCase() + item.role.slice(1);
}

/** a name for a file: what it is, how big, and the day — so exports don't all end up as "dial (7).pdf".
 *  dial-30mm-2026-10-12.pdf · a production mask says so: dial-30mm-mask-mirrored-2026-10-12.pdf */
export function file_name(S, ext, now = new Date()) {
  const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((v) => String(v).padStart(2, "0")).join("-");
  const what = ext === "json" ? "" : (S.out_production ? "-mask" : "") + (S.out_mirror ? "-mirrored" : "");
  if (ext === "mp4" || ext === "gif") return `dial-${num(S.dial_d, 2)}mm-${day}.${ext}`;      // a moving picture (#51): never a mask
  if (ext === "sheet") return `dial-${num(S.dial_d, 2)}mm-sheet${what}-${day}.pdf`;      // a print sheet (4.75)
  return `dial-${num(S.dial_d, 2)}mm${what}-${day}.${ext}`;
}

/** the shapes of a scene, hands turned to their angle: [{role, path, fill, …}] without guides. */
function drawn(S, statik, t, preview, selected) {
  return scene(S, statik, t, preview, selected).map((item) => (item.role === "hand" || item.role === "mark" ? { ...item, path: turned(item.path, item.angle) } : item));
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
  if (!preview) out.push(`<title>Dial Tool · ${num(S.dial_d, 2)} mm dial${S.out_production ? " · print mask" : ""}${S.out_mirror ? " · mirrored" : ""}</title>`, `<metadata>${MADE_BY}</metadata>`);
  const ids = new Map();                           // every shape is named after what it is; a second "Markers" is markers-2
  const named = (item) => {
    const slug = item_name(item).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || item.role.replace(/ /g, "-");
    ids.set(slug, (ids.get(slug) || 0) + 1);
    return ` id="${/^[a-z]/.test(slug) ? "" : "ring-"}${slug}${ids.get(slug) > 1 ? "-" + ids.get(slug) : ""}"`;
  };
  if (preview && !S.out_production) out.push(`<rect width="${num(size)}" height="${num(size)}" fill="${rgb(S.c_backdrop)}"/>`);
  out.push(`<g id="dial" transform="translate(${num(size / 2)} ${num(size / 2)})${flip < 0 ? " scale(-1 1)" : ""}">`);
  for (const item of drawn(S, statik, t, preview, selected)) {
    const id = named(item);
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

/** text → a PDF string that is safe whatever letters it holds (UTF-16, written as hex). */
const pdf_text = (text) => "<FEFF" + [...String(text)].flatMap((ch) => { const c = ch.codePointAt(0); return c > 0xFFFF ? [0xD800 + ((c - 0x10000) >> 10), 0xDC00 + ((c - 0x10000) & 0x3FF)] : [c]; })
  .map((u) => u.toString(16).padStart(4, "0").toUpperCase()).join("") + ">";

/** a one-page PDF as bytes: filled paths only (R4), page = dial + margins at true size.
 *  Every scene item is a layer with its name (plate, each ring, each hand …), so the file opens sorted.
 *  A production mask is written in grey ink (0 g), not RGB black: one plate, nothing for a printer to mix. */
export function pdf_document(S, statik, t) {
  const size = page_mm(S) * MM, flip = S.out_mirror ? -1 : 1;
  const alphas = [];                               // one graphics state per transparency used
  const layers = [];                               // layer names, bottom first
  const body = [`q ${num(MM * flip, 6)} 0 0 ${num(MM, 6)} ${num(size / 2)} ${num(size / 2)} cm`];
  for (const item of drawn(S, statik, t, false, null)) {
    const [r, g, b, a] = item.fill;
    if (a < 1 && !alphas.includes(a)) alphas.push(a);
    layers.push(item_name(item));
    body.push(`/OC /L${layers.length - 1} BDC`, a < 1 ? `q /A${alphas.indexOf(a)} gs` : "q", S.out_production ? `${num(r)} g` : `${num(r)} ${num(g)} ${num(b)} rg`);
    for (const c of item.path.d) {
      const v = c.slice(1).map((x) => num(x, 5)).join(" ");
      body.push(c[0] === "M" ? `${v} m` : c[0] === "L" ? `${v} l` : c[0] === "C" ? `${v} c` : "h");
    }
    body.push("f", "Q", "EMC");
  }
  body.push("Q");
  const stream = body.join("\n");
  const states = alphas.map((a, i) => `/A${i} << /ca ${num(a)} >>`).join(" ");
  const FIRST = 6;                                 // the layers are objects 6, 7, 8 …
  const refs = layers.map((_, i) => `${FIRST + i} 0 R`);
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R /OCProperties << /OCGs [${refs.join(" ")}] /D << /Order [${refs.slice().reverse().join(" ")}] /ON [${refs.join(" ")}] >> >> >>`,      // listed top first, as the ring list is
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(size)} ${num(size)}] /Contents 4 0 R /Resources << /ExtGState << ${states} >> /Properties << ${refs.map((r, i) => `/L${i} ${r}`).join(" ")} >> >> >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Title ${pdf_text(`Dial Tool · ${num(S.dial_d, 2)} mm dial${S.out_production ? " · print mask" : ""}`)} /Creator ${pdf_text(MADE_BY)} >>`,
    ...layers.map((name) => `<< /Type /OCG /Name ${pdf_text(name)} >>`),
  ];
  let text = "%PDF-1.5\n";
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

// ── PNG: the picture's own record of how big it is ──────────

const CRC = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
const crc32 = (bytes) => { let c = 0xFFFFFFFF; for (const b of bytes) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

/** a PNG's bytes, with its resolution written in (a "pHYs" record right after the header), so a 600 dpi
 *  picture opens at true size in Photoshop, InDesign or a print dialogue instead of at 72 dpi. */
export function png_with_dpi(bytes, dpi) {
  const per_metre = Math.round(dpi / 0.0254);
  const phys = new Uint8Array(9), view = new DataView(phys.buffer);
  view.setUint32(0, per_metre); view.setUint32(4, per_metre); phys[8] = 1;      // dots per metre, across and down
  const made = new TextEncoder().encode("Software\0" + MADE_BY);      // a text record: who made it (#226)
  const chunks = [png_chunk("pHYs", phys), png_chunk("tEXt", made)], extra = chunks.reduce((n, c) => n + c.length, 0);
  const at = 33;                                   // after the 8-byte signature and the 25-byte header record
  const out = new Uint8Array(bytes.length + extra);
  out.set(bytes.subarray(0, at)); let k = at;
  for (const c of chunks) { out.set(c, k); k += c.length; }
  out.set(bytes.subarray(at), k);
  return out;
}
/** one PNG record: its length, its four-letter name, its data, and a check sum over name and data */
function png_chunk(name, data) {
  const c = new Uint8Array(12 + data.length), view = new DataView(c.buffer);
  view.setUint32(0, data.length);
  c.set([...name].map((ch) => ch.charCodeAt(0)), 4); c.set(data, 8);
  view.setUint32(8 + data.length, crc32(c.subarray(4, 8 + data.length)));
  return c;
}

// ── a print sheet (#348, 4.75) ──────────────────────────────
// Okay's notes 2: "Printing: print page preparation, preview, copies, stacks — something simple, elegant, efficient and
// paper savingly". One page of a paper size, as many copies of the dial as asked (or as fit), each at its true size,
// packed in straight rows or staggered ones — whichever holds more, as circles stack tighter staggered — the block
// centred on the page. Each copy is the same drawing as the PDF export (one form, placed again and again), mirrored or
// a print mask as Print says. A cut line round each, if asked: a hairline ring just outside the dial, filled (R4).
export const PAPERS = [["A4", 210, 297], ["Letter", 215.9, 279.4], ["A5", 148, 210]];
export const SHEET_EDGE = 8;                       // mm kept clear at the paper's edges, where a printer can't reach
const CUT_AT = 0.4, CUT_W = 0.1;                   // the cut line: this far outside the dial, this thick (mm)

/** discs of one diameter D, as many as fit in a w × h room with gap between them: in straight rows or staggered
 *  ones (every other row half a pitch along, rows a hexagon's height apart), whichever holds more. {places: [[x, y]
 *  from the room's top left, each a disc's centre less D/2], staggered}. One packing for every page of copies: the
 *  print sheet (4.75) and Compare (#435), which asks it how large n dials can be. */
export function pack_discs(w, h, D, gap) {
  const pitch = D + gap;
  const across = (len) => (len + 1e-9 >= D ? Math.floor((len - D) / pitch + 1e-9) + 1 : 0);
  const straight = () => { const c = across(w), r = across(h), out = []; for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) out.push([i * pitch, j * pitch]); return out; };
  const staggered = () => {
    const rise = pitch * Math.sqrt(3) / 2, rows = h + 1e-9 >= D ? Math.floor((h - D) / rise + 1e-9) + 1 : 0, out = [];
    for (let j = 0; j < rows; j++) { const off = j % 2 ? pitch / 2 : 0, c = across(w - off); for (let i = 0; i < c; i++) out.push([off + i * pitch, j * rise]); }
    return out;
  };
  const a = straight(), b = staggered();
  return b.length > a.length ? { places: b, staggered: true } : { places: a, staggered: false };
}

/** places, centred as a block in a w × h room: each [x, y] from the room's top left, a disc's centre less D/2. */
export function centre_block(places, w, h) {
  if (!places.length) return places;
  const xs = places.map((p) => p[0]), ys = places.map((p) => p[1]);
  const dx = (w - (Math.max(...xs) - Math.min(...xs))) / 2 - Math.min(...xs), dy = (h - (Math.max(...ys) - Math.min(...ys))) / 2 - Math.min(...ys);
  return places.map(([x, y]) => [x + dx, y + dy]);
}

/** where the copies stand on a sheet: {places: [[x, y] mm from the page's bottom left, each a dial's centre], fits,
 *  staggered, paper: [name, w, h]}. copies 0 = as many as fit. */
export function sheet_layout(S) {
  const paper = PAPERS[S.out_paper] || PAPERS[0], [, W, H] = paper, D = S.dial_d, gap = Math.max(+S.out_gap || 0, 0);
  const packed = pack_discs(W - 2 * SHEET_EDGE, H - 2 * SHEET_EDGE, D, gap), use = packed.places;
  const want = +S.out_copies > 0 ? Math.min(Math.round(+S.out_copies), use.length) : use.length;
  const places = use.slice(0, want);
  if (!places.length) return { places, fits: 0, staggered: false, paper };
  return { places: centre_block(places, W, H).map(([x, y]) => [x, H - y]), fits: use.length, staggered: packed.staggered, paper };      // first copies at the top
}

/** the print sheet as PDF bytes: the dial drawn once as a form, placed at every copy. */
export function pdf_sheet(S, statik, t) {
  const L = sheet_layout(S), [, W, H] = L.paper, flip = S.out_mirror ? -1 : 1, R = S.dial_d / 2;
  const alphas = [], dial = [];
  for (const item of drawn(S, statik, t, false, null)) {
    if (item.role === "registration") continue;      // a page's corners are the sheet's, not each copy's (#224)
    const [r, g, b, a] = item.fill;
    if (a < 1 && !alphas.includes(a)) alphas.push(a);
    dial.push(a < 1 ? `q /A${alphas.indexOf(a)} gs` : "q", S.out_production ? `${num(r)} g` : `${num(r)} ${num(g)} ${num(b)} rg`, ...path_ops(item.path), "f", "Q");
  }
  if (S.out_cutline) dial.push("q", S.out_production ? "0 g" : "0 0 0 rg", ...path_ops(circle(2 * (R + CUT_AT + CUT_W)).difference(circle(2 * (R + CUT_AT)))), "f", "Q");      // the cut line: a ring, filled (R4)
  const form = dial.join("\n"), reach = R + CUT_AT + CUT_W + 0.5;
  const page = L.places.map(([x, y]) => `q ${num(MM * flip, 6)} 0 0 ${num(MM, 6)} ${num(x * MM, 3)} ${num(y * MM, 3)} cm /Dial Do Q`).join("\n");
  const states = alphas.map((a, i) => `/A${i} << /ca ${num(a)} >>`).join(" ");
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(W * MM)} ${num(H * MM)}] /Contents 4 0 R /Resources << /XObject << /Dial 6 0 R >> >> >>`,
    `<< /Length ${page.length} >>\nstream\n${page}\nendstream`,
    `<< /Title ${pdf_text(`Dial Tool · ${num(S.dial_d, 2)} mm dial · ${L.places.length} on ${L.paper[0]}${S.out_production ? " · print mask" : ""}${S.out_mirror ? " · mirrored" : ""}`)} /Creator ${pdf_text(MADE_BY)} >>`,
    `<< /Type /XObject /Subtype /Form /BBox [${num(-reach)} ${num(-reach)} ${num(reach)} ${num(reach)}] /Resources << /ExtGState << ${states} >> >> /Length ${form.length} >>\nstream\n${form}\nendstream`,
  ];
  let text = "%PDF-1.5\n";
  const starts = [];
  objects.forEach((o, i) => { starts.push(text.length); text += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = text.length;
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + starts.map((s) => String(s).padStart(10, "0") + " 00000 n \n").join("");
  text += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(text);
}
/** a path as PDF drawing operators. */
const path_ops = (p) => p.d.map((c) => { const v = c.slice(1).map((x) => num(x, 5)).join(" "); return c[0] === "M" ? `${v} m` : c[0] === "L" ? `${v} l` : c[0] === "C" ? `${v} c` : "h"; });
