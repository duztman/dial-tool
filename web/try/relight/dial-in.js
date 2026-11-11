// dial-in.js — a dial from Dial Tool: its saved SVG → the scene the page builds. Each part's record is read by the tool's own
// reader (parts.js, beside the page), so the tool and this page agree on what every part is and how it stands.
import * as PARTS from "./parts.js";

/** a path's y turned over (the SVG's y runs down, the scene's up), and its reach from the centre. Dial Tool writes M L Q C Z, absolute */
export function flipPath(d, sx = 1) { let out = "", reach = 0, big = 0, sub = []; const re = /([MLQCZ])([^MLQCZ]*)/gi; let m, seen = 0;
  const close = () => { let a = 0; for (let i = 0; i < sub.length; i++) { const [x0, y0] = sub[i], [x1, y1] = sub[(i + 1) % sub.length]; a += x0 * y1 - x1 * y0; } big = Math.max(big, Math.abs(a) / 2); sub = []; };      // a contour's area, from its points (curves by their control points: near enough to tell a band from a numeral)
  if (/[a-yA-Y]/.test(d.replace(/[MLQCZ]/g, "").replace(/e[-+]?\d/gi, ""))) throw new Error("its paths use commands this page does not read");
  while ((m = re.exec(d))) { seen++; if (m[1] !== m[1].toUpperCase()) throw new Error("its paths are written relative"); const n = (m[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number);
    if (m[1] === "M" || m[1] === "Z") close();
    for (let i = 0; i + 1 < n.length; i += 2) { n[i] *= sx; n[i + 1] = -n[i + 1]; sub.push([n[i], n[i + 1]]); }
    if (n.length >= 2) reach = Math.max(reach, Math.hypot(n[n.length - 2], n[n.length - 1]));      // the reach by the points ON the outline (a curve's control points lie outside it)
    out += m[1] + n.map((v) => +v.toFixed(4)).join(" "); }
  close(); if (!seen) throw new Error("a path is empty"); return { p: out, reach, big }; }
export function readDial(text, base) {      // base: the opener's scene, whose numbers a read dial keeps (ink_step, open, size)
  const doc = new DOMParser().parseFromString(text, "image/svg+xml"); if (doc.querySelector("parsererror") || !doc.documentElement || doc.documentElement.localName !== "svg") throw new Error("it is not an SVG");
  const root = doc.querySelector('g[id="dial"]'); if (!root) throw new Error("it has no dial group — save it from Dial Tool's Export as SVG");
  if (root.querySelector("text")) throw new Error("its numerals are text — in Dial Tool's Export, save it with outlines (Live text off)");
  const tf = root.getAttribute("transform") || "", sx = /scale\(\s*-1/.test(tf) ? -1 : 1, items = [], skipped = [], num = (el, k) => (el.hasAttribute("data-" + k) ? +el.getAttribute("data-" + k) : null);
  // EXACT: a file saved by Dial Tool v1.1.63 or later says of every part what it is and how high it stands (show.js `svg_facts`):
  // each part's record (Dial Tool's parts.js: its make — plate, printed, applied, hand, on hand, cap, disc, in window, case — and its
  // numbers), and the dial its stack's rules (`data-stack`). parts.js reads it, a file of v1.1.63–66 too. An older file has none: GUESSED, below
  const exact = [...root.querySelectorAll("path")].some((el) => el.hasAttribute("data-role"));
  for (const el of root.querySelectorAll("path")) { const fill = el.getAttribute("fill"), d = el.getAttribute("d"); if (!d || !fill || fill === "none") continue;      // lines (guides) are not parts
    const id = el.getAttribute("id") || "", { p, reach, big } = flipPath(d, sx), a = +(el.getAttribute("fill-opacity") ?? 1), base = { bevel: false, dome: false, hw: 0, p, f: fill, a, id, reach, big };
    if (exact) { const R = PARTS.read_part((k) => el.getAttribute("data-" + k)), r = R.role, hand = R.hand;      // the part's record, read by Dial Tool's own reader (parts.js)
      if (R.make === "case") { skipped.push(id || r); continue; }      // the tool's case: this page's own case stands (dial only, Okay 10 Nov 2026)
      if (R.make === "plate") items.push({ ...base, role: "plate", hand: null, ink: 0 });
      else if (R.make === "disc") items.push({ ...base, role: "date disc", hand: null, ink: 0, under: R.under });
      else if (R.make === "in window") items.push({ ...base, role: "date number", hand: null, ink: 0 });      // what shows in a window lies on its disc, under the plate: flat in the plate's picture
      else if (R.make === "hand" && hand) { items.push({ ...base, role: "hand", hand, z: R.over ?? 0.15, t: R.t, section: R.section, bevel: R.section !== "flat", dome: R.section === "domed", hw: R.hw });
        const br = R.boss; if (br) items.push({ ...base, role: "boss", hand: null, id: id + "-boss", reach: br, big: 0, p: `M${br} 0A${br} ${br} 0 1 0 ${-br} 0A${br} ${br} 0 1 0 ${br} 0Z` }); }      // the hand's boss: a disc on it, as the tool's show mode draws it
      else if (R.make === "on hand" && hand) { const h = items.findLast((it) => it.role === "hand" && it.hand === hand); items.push({ ...base, role: r, hand, z: h?.z ?? 0.15 }); }      // printed on the hand: flush in its top (the builder)
      else if (R.make === "cap") items.push({ ...base, role: "cap", hand: null, z: R.over ?? 0.75, t: R.t });
      else if (R.make === "applied") items.push({ ...base, role: r, hand: null, ink: 6, h: R.height, section: R.section, applied: true });      // a solid piece on the plate: its own height and section
      else items.push({ ...base, role: r, hand: null, ink: 6, h: Math.max(0.01, R.ink ?? 0.21) });      // every printed part — a ring, its stroke, a window's frame — stands its ink's thickness over the plate
      continue; }
    const hand = /(^|-)hand(-\d+)?$/.test(id) ? (/^hour/.test(id) ? "hour" : /^minute/.test(id) ? "minute" : /^second/.test(id) ? "second" : "extra") : null;
    const role = hand ? "hand" : /^plate/.test(id) ? "plate" : /^window-\d+-disc/.test(id) ? "date disc" : /^window-\d+-(?!frame)/.test(id) ? "date number" : /^cap(-\d+)?$/.test(id) ? "cap" : id || "mark";
    items.push({ ...base, role, hand: hand === "extra" ? "hour" : hand, kind: hand, ink: role === "plate" || role.startsWith("date") ? 0 : 6 }); }
  const plate = items.find((it) => it.role === "plate"); if (!plate) throw new Error("it has no plate — is it a print mask? Save the dial itself");
  const title = doc.querySelector("title")?.textContent || "", d = +(root.getAttribute("data-dial-d") ?? 0) || +(title.match(/([\d.]+)\s*mm dial/)?.[1] ?? 0) || +(plate.reach * 2).toFixed(2);
  const kept = items.filter((it) => { const ok = it.reach <= d / 2 + 0.05; if (!ok) skipped.push(it.id || it.role); return ok; });      // wider than the plate: on the tool's bezel or rehaut — the case here is this page's own
  if (!exact) {
    // GUESSED (a file from before v1.1.63): a part with a contour enclosing over a tenth of the plate — a band, a sector, a circle line —
    // is taken as flat print; the rest stand 0.30 mm, each next one 0.02 higher; the hands clear the highest mark by 0.08, 0.32 apart
    for (const it of kept) if (!it.hand && !["plate", "cap", "date disc", "date number"].includes(it.role) && it.big > 0.1 * Math.PI * d * d / 4) { it.role = "date disc"; it.ink = 0; it.print = true; }
    const step = base.ink_step; let n = 0; for (const it of kept) if (!it.hand && it.ink) it.ink = 6 + (0.02 / step) * n++;
    let z = 0.3 + 0.02 * Math.max(0, n - 1) + 0.08; const lift = (it) => { it.z = z; z += 0.32; };
    for (const want of ["extra", "hour", "minute", "second"]) for (const it of kept) if (it.role === "hand" && it.kind === want) lift(it);
    for (const it of kept) if (it.role === "cap") { it.z = z; z += 0.1; } }
  return { ...base, stack: PARTS.read_stack(root.getAttribute("data-stack")), d, size: d / (2 * (base.open ?? 14.6)), items: kept, A: {}, skipped, exact, made: doc.querySelector("metadata")?.textContent || "" }; }
