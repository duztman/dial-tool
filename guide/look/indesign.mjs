// indesign.mjs — the pages as an InDesign package (Okay, 15 Oct 2026, 13:44: "1! Go!" — InDesign as his drafting
// table; the build stays the source, and what he moves there is carried back into build.mjs by hand).
// Called by build.mjs once the pages are set: reads every page's parts from the browser as they stand (text with its
// runs and first baseline, pictures, lines, dots, outlines, grounds), turns the dial SVGs and the drawn overlays into
// PDFs (InDesign places PDF reliably; SVG import has crashed for some), and hands the lot to idml.py, which writes
// out/indesign/Dial-Tool-guide/ (the .idml, Links/, Document fonts/, the PDF) and a zip of it.
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

/** everything on each A4 page, in drawing order, in millimetres from the page's top left */
export async function extract(pg) {
  return pg.evaluate(() => {
    const MM = 96 / 25.4, PT = 72 / 96, DESC = 0.2421875;      // Inter: the descender, 496 of 2048 units
    const pages = [];
    const hex = (c) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); if (!m || (m[4] !== undefined && +m[4] === 0)) return null; return "#" + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, "0").toUpperCase()).join(""); };
    for (const sec of document.querySelectorAll("section.page")) {
      const P = sec.getBoundingClientRect(), items = [];
      const box = (e) => { const r = e.getBoundingClientRect(); return [(r.left - P.left) / MM, (r.top - P.top) / MM, r.width / MM, r.height / MM]; };
      const style_of = (e) => {
        if (e.matches("h1")) return "Title";
        if (e.matches(".lead")) return "Lead";
        if (e.matches(".block.small p")) return "Small";
        if (e.matches(".block.watch.attached p")) return "Watch note";
        if (e.matches(".block p")) return "Body";
        if (e.matches(".nlabel")) return "Label";
        if (e.matches(".cap")) return "Caption";
        if (e.matches(".layernote")) return "Layer note";
        if (e.matches(".kcell")) return "Kind";
        if (e.matches("th")) return "Table head";
        if (e.matches("td")) return "Table";
        if (e.matches(".ptab")) return "Tab";
        return "Running head";
      };
      const text = (e) => {
        const cs = getComputedStyle(e), fs = parseFloat(cs.fontSize), runs = [];
        const walk = (n) => {
          for (const c of n.childNodes) {
            if (c.nodeType === 3) { const t = c.textContent.replace(/\s+/g, " "); if (t) { const p = getComputedStyle(c.parentElement); runs.push({ t, w: +p.fontWeight, c: hex(p.color) }); } }
            else if (c.nodeName === "BR") runs.push({ t: " ", w: 400, c: null });
            else if (c.nodeName === "SVG" || c.nodeName === "svg") continue;
            else if (c.nodeType === 1) { if (c.matches(".ptab span")) runs.push({ t: " ", w: 400, c: null }); walk(c); }
          }
        };
        walk(e);
        if (runs.length) { runs[0].t = runs[0].t.replace(/^ /, ""); runs[runs.length - 1].t = runs[runs.length - 1].t.replace(/ $/, ""); }
        // the first baseline: the bottom of the first letter's box, less the descender
        let base = null; const wk = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        for (let n; (n = wk.nextNode());) { const i = n.textContent.search(/\S/); if (i < 0) continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); const pfs = parseFloat(getComputedStyle(n.parentElement).fontSize); base = (q.bottom - P.top - DESC * pfs) / MM; break; }
        const lh = parseFloat(cs.lineHeight);
        return { k: "text", box: box(e), base, style: style_of(e), runs,
          single: e.getBoundingClientRect().height < 1.5 * lh, size: fs * PT, leading: lh * PT, weight: +cs.fontWeight, color: hex(cs.color), align: cs.textAlign, track: (parseFloat(cs.letterSpacing) || 0) / fs * 1000, balance: cs.textWrap === "balance" || cs.textWrapStyle === "balance" };
      };
      const border_top = (e) => { const cs = getComputedStyle(e), w = parseFloat(cs.borderTopWidth); if (w > 0 && cs.borderTopStyle !== "none") { const b = box(e); items.push({ k: "line", pts: [[b[0], b[1] + w / MM / 2], [b[0] + b[2], b[1] + w / MM / 2]], stroke: hex(cs.borderTopColor), sw: w / MM }); } };
      const outline = (e, r = 0) => { const cs = getComputedStyle(e), w = parseFloat(cs.outlineWidth); if (w > 0 && cs.outlineStyle !== "none") { const b = box(e), o = parseFloat(cs.outlineOffset) || 0, d = (o + w / 2) / MM; items.push({ k: "orect", box: [b[0] - d, b[1] - d, b[2] + 2 * d, b[3] + 2 * d], stroke: hex(cs.outlineColor), sw: w / MM, r }); } };
      const shadow = (e) => { const s = getComputedStyle(e).boxShadow; if (!s || s === "none") return null; const m = s.match(/rgba?\(([^)]*)\)\s+([-\d.]+)px\s+([-\d.]+)px\s+([\d.]+)px/); if (!m) return null; const a = m[1].split(",").map(Number); return { x: +m[2] / MM, y: +m[3] / MM, blur: +m[4] / MM, opacity: a[3] ?? 1 }; };
      for (const e of sec.querySelectorAll(":scope > *")) {
        const cs = getComputedStyle(e);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        if (e.matches(".tabline")) {
          const t = e.querySelector(".ptab"); items.push({ k: "rect", box: box(t), fill: hex(getComputedStyle(t).backgroundColor) });
          for (const x of e.querySelectorAll(".ptab, .gname, .gurl")) items.push(text(x));
        } else if (e.matches(".head")) {
          border_top(e); for (const x of e.querySelectorAll("h1, .lead")) items.push(text(x));
        } else if (e.matches(".block")) {
          border_top(e);
          const tri = e.querySelector("svg.tri"); if (tri) items.push({ k: "icon", box: box(tri), svg: tri.outerHTML, name: "watch" });
          for (const p of e.querySelectorAll("p")) items.push(text(p));
        } else if (e.matches("table")) {
          for (const tr of e.querySelectorAll("tr")) { const cells = [...tr.children]; const a = box(cells[0]), z = box(cells[cells.length - 1]), c0 = getComputedStyle(cells[0]), w = parseFloat(c0.borderBottomWidth);
            if (w > 0) items.push({ k: "line", pts: [[a[0], a[1] + a[3] - w / MM / 2], [z[0] + z[2], a[1] + a[3] - w / MM / 2]], stroke: hex(c0.borderBottomColor), sw: w / MM });
            for (const c of cells) items.push(text(c)); }
        } else if (e.matches(".ground")) {
          items.push({ k: "rect", box: box(e), fill: hex(cs.backgroundColor) });
        } else if (e.matches(".shot")) {
          const img = e.querySelector("img"); items.push({ k: "img", box: box(e), src: img.getAttribute("src") }); outline(e);
        } else if (e.matches("img.card")) {
          items.push({ k: "img", box: box(e), src: e.getAttribute("src"), r: parseFloat(cs.borderTopLeftRadius) / MM || 0, shadow: shadow(e), fade: e.classList.contains("cut") ? parseFloat(cs.getPropertyValue("--fade")) || 80 : null });
          outline(e, parseFloat(cs.borderTopLeftRadius) / MM || 0);
        } else if (e.matches("a.diallink")) {
          const bg = hex(cs.backgroundColor); if (bg) items.push({ k: "rect", box: box(e), fill: bg }); outline(e);
          items.push({ k: "img", box: box(e), src: e.querySelector("img").getAttribute("src"), href: e.href });
        } else if (e.matches("svg.lines")) {
          for (const s of e.children) {
            const ss = getComputedStyle(s), stroke = hex(ss.stroke), sw = parseFloat(ss.strokeWidth);
            if (s.matches("rect")) items.push({ k: "orect", box: ["x", "y", "width", "height"].map((a) => +s.getAttribute(a)), stroke, sw, r: +(s.getAttribute("rx") || 0), fill: hex(ss.fill) });
            else if (s.matches("circle")) items.push({ k: "dot", c: [+s.getAttribute("cx"), +s.getAttribute("cy")], r: +s.getAttribute("r"), fill: hex(ss.fill) });
            else if (s.matches("line")) items.push({ k: "line", pts: [[+s.getAttribute("x1"), +s.getAttribute("y1")], [+s.getAttribute("x2"), +s.getAttribute("y2")]], stroke, sw });
            else if (s.matches("polyline")) items.push({ k: "line", pts: s.getAttribute("points").trim().split(/\s+/).map((p) => p.split(",").map(Number)), stroke, sw });
          }
        } else if (e.matches("svg.stack")) {
          const c = e.cloneNode(true); c.setAttribute("xmlns", "http://www.w3.org/2000/svg"); c.setAttribute("width", "297mm"); c.setAttribute("height", "210mm"); c.removeAttribute("class");
          items.push({ k: "overlay", svg: c.outerHTML, name: "stack-" + sec.dataset.no });
        } else if (e.matches(".nlabel, .cap, .layernote, .kcell")) {
          items.push(text(e));
        }
      }
      pages.push({ no: sec.dataset.no, items });
    }
    return pages;
  });
}

/** the package: SVGs made PDF by the browser, then idml.py */
export async function make_package(browser, layout, { HERE, OUT, IMG, VERSION }) {
  const DIR = path.join(OUT, "indesign", "Dial-Tool-guide"), LINKS = path.join(DIR, "Links");
  fs.rmSync(path.join(OUT, "indesign"), { recursive: true, force: true }); fs.mkdirSync(LINKS, { recursive: true });
  const pdfp = await browser.newPage();
  const to_pdf = async (svg, w0, h0, file) => {
    const F = Math.max(1, 150 / Math.min(w0, h0)), w = w0 * F, h = h0 * F;      // Chromium prints a small page wrongly (wider, empty): print large, InDesign scales it to its frame
    await pdfp.setContent(`<!doctype html><html><head><style>@page{size:${w}mm ${h}mm;margin:0}html,body{margin:0}svg{display:block;width:${w}mm;height:${h}mm}</style></head><body>${svg}</body></html>`);
    await pdfp.pdf({ path: path.join(LINKS, file), width: `${w}mm`, height: `${h}mm`, printBackground: true, preferCSSPageSize: true });
  };
  const done = new Set();
  for (const p of layout) for (const it of p.items) {
    if (it.k === "img") {
      const src = path.join(OUT, it.src), base = path.basename(it.src);
      if (base.endsWith(".svg")) {
        const pdf = base.replace(/\.svg$/, ".pdf");
        if (!done.has(pdf)) { const svg = fs.readFileSync(src, "utf8").replace(/^<\?xml[^>]*>\s*/, ""); const [, , , vw, vh] = svg.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/).map(Number); await to_pdf(svg, vw, vh, pdf); done.add(pdf); }
        it.link = pdf; it.format = "pdf";
      } else { if (!done.has(base)) { fs.copyFileSync(src, path.join(LINKS, base)); done.add(base); } it.link = base; it.format = "png"; }
    } else if (it.k === "overlay") { const f = it.name + ".pdf"; await to_pdf(it.svg, 297, 210, f); it.link = f; it.format = "pdf"; it.box = [0, 0, 297, 210]; delete it.svg; }
    else if (it.k === "icon") { const f = it.name + ".pdf"; if (!done.has(f)) { const svg = it.svg.replace("<svg", `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="fill:none;stroke:#111111;stroke-width:1.6;stroke-linejoin:round"`).replace(/class="[^"]*"/, ""); await to_pdf(svg, 4.6, 4.6, f); done.add(f); } it.link = f; it.format = "pdf"; delete it.svg; }
  }
  await pdfp.close();
  fs.writeFileSync(path.join(OUT, "review", "layout.json"), JSON.stringify(layout));
  execFileSync("python3", [path.join(HERE, "idml.py"), path.join(OUT, "review", "layout.json"), DIR, VERSION], { stdio: "inherit" });
  fs.cpSync(path.join(HERE, "fonts", "desktop"), path.join(DIR, "Document fonts"), { recursive: true });
  fs.copyFileSync(path.join(OUT, "guide.pdf"), path.join(DIR, "guide.pdf"));
  fs.writeFileSync(path.join(DIR, "README.txt"), README(VERSION, layout.length));
  execFileSync("zip", ["-qr", "Dial-Tool-guide-indesign.zip", "Dial-Tool-guide"], { cwd: path.join(OUT, "indesign") });
  return DIR;
}

const README = (version, n) => `Dial Tool guide, edition 1 — InDesign package
${version} · made ${new Date().toISOString().slice(0, 10)} by guide/look/build.mjs

  Dial-Tool-guide.idml   ${n} pages, A4 landscape. Open it in InDesign, then File › Save As… .indd.
  Links/                 the pictures: interface crops (PNG, 3 pixels a point) and the dials (PDF, vector).
  Document fonts/        Inter Regular, Light and SemiBold (OFL). InDesign turns these on for this document.
  guide.pdf              the pages as the build set them, to compare.

What is the same as the PDF: every frame's place and size, the 12 × 14 grid (margins and columns; the rows are
guides), the colours (swatches named "Guide" and the hex code), the paragraph styles (Title, Lead, Body, Label, Caption, …),
the text (live), the lines and outlines (live), the crops and their scale.

What differs: InDesign breaks lines with its own measure, so a few lines can break elsewhere (the styles use the
single-line composer, which is closest to a browser's). The fades at the bottom of two crops (page 03) are hard
edges here. Drop shadows on the cards are InDesign effects. The exploded dial on page 01 is one placed PDF
(stack-01.pdf), not live shapes.

If the pictures show as missing: Links panel › select all › Relink to Folder… › this Links folder.

How changes come back: this is a drafting table, not the source. Move, resize, restyle what you like, then send
the .idml (or the .indd) or screenshots; Claude carries the changes into guide/look/build.mjs, so the next build
from the app keeps them. Words you change here are carried into guide/text/edition-1.md the same way.
`;
