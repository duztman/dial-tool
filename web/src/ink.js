// Dial Tool, web version — labels centred on their ink (Okay, 14 Oct 2026: "proportional ink box it is").
//
// What it does. A short label in a box of its own ("10:30", "720×", "AM", "1") is centred by the browser on its
// line box: the advance widths left and right, and the font's whole height. That puts the space a "1" carries, and
// the room the font keeps for accents and descenders, into the centring, so a label can sit visibly off-centre.
// Here each such label is measured as it is actually drawn — the rectangle its ink covers — and moved so that
// rectangle's centre is the box's centre. Overhangs are allowed; the ink is what is centred.
//
// How. The label's text goes into a <span class="ink">. A canvas draws the same text in the same face and size and
// reports its ink rectangle (measureText's actualBoundingBox…) and the font's own box (fontBoundingBox…). The
// difference between the two centres is written to the span as --ink-dx and --ink-dy, rounded to the screen's
// dots; the stylesheet moves the span by them (3-controls.css). Figures in these labels are proportional (R32,
// design canon §2): a "1" no longer takes the width of a "0".
//
// Which labels: the selectors in INKED — boxes whose label stands still. Numbers that change while you drag
// (fields) keep tabular figures and are left alone. The time in the bar is the one field centred on its ink
// (Okay, 14 Oct 2026, 23:19: "we have the new ink weight centerer, apply that"): monospace, and measured as
// "00:00:00" — every figure a 0 — so it does not shift as its figures change (app.js, sync_time). A label whose text changes (AM → PM, ··· → 2:15)
// is measured again; so is every label once the fonts have loaded.

const INKED = [
  ".atgrid button",          // a window's places: 3 · 6 · 9 · 12 · 1:30 … 10:30 · 4 · ···
  ".steps12 button",         // the bottom bar's hours and 10:10
  "#ampm",                   // AM · PM, the time's own window
  ".fit > span",             // Fit, beside its magnifier
  "#show-now > .word",       // the showcase's Now pill (15 Oct 2026)
  ".irisgo",                 // ACTIVATE SHOWCASE, beside the iris
  "#now",                    // NOW, beside it (Okay, 14 Oct 2026: "make sure the inner type is centered with equal padding within buttons")
  "#unit",                   // mm · pt · in · lig
].join(", ");

const canvas = document.createElement("canvas");
const pen = canvas.getContext("2d");
const known = new Map();       // "font|text" → [dx, dy] in CSS pixels: a label is measured once per face and size

/** how far a label's ink centre is from its box centre: [dx, dy], in CSS pixels, y down. */
export function offset(text, style) {
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const track = parseFloat(style.letterSpacing) || 0;      // tracking: the browser adds it after every letter, the last too
  const key = font + "|" + track + "|" + text;
  if (!known.has(key)) {
    pen.font = font;
    const m = pen.measureText(text);
    // left to right: the ink rectangle's centre against the middle of the advance (what the browser centres)
    const ink_x = (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
    // top to bottom: the ink rectangle's centre against the middle of the font's own box (the line box's middle)
    const ink_y = (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
    const box_y = (m.fontBoundingBoxDescent - m.fontBoundingBoxAscent) / 2;
    const dot = 1 / (window.devicePixelRatio || 1);
    const snap = (v) => Math.round(v / dot) * dot;          // whole screen dots, so the type stays sharp
    // with tracking the box is wider by a letter-space after each letter; the ink by one fewer: half a space to the right
    known.set(key, [snap(m.width / 2 - ink_x + track / 2), snap(box_y - ink_y)]);
  }
  return known.get(key);
}

/** wrap and place one label; a box with anything but plain text in it is left alone. */
function centre(box) {
  let span = box.firstElementChild;
  if (!(span && span.classList.contains("ink") && box.childNodes.length === 1)) {
    if (box.children.length || !box.textContent.trim()) return;
    span = document.createElement("span");
    span.className = "ink";
    span.textContent = box.textContent;
    box.replaceChildren(span);
  }
  const [dx, dy] = offset(span.textContent, getComputedStyle(span));
  span.style.setProperty("--ink-dx", dx + "px");
  span.style.setProperty("--ink-dy", dy + "px");
}

export function centre_all(root = document) {
  for (const box of root.querySelectorAll(INKED)) centre(box);
}

/** keep every listed label centred: now, when the fonts arrive, and whenever a label's text changes. Only changes
 *  inside a listed box are acted on, so the preview and the running time cost nothing here. */
export function start_ink(root = document.body) {
  centre_all(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { known.clear(); centre_all(root); });
  new MutationObserver((changes) => {
    const boxes = new Set();
    for (const c of changes) {
      const node = c.target.nodeType === 1 ? c.target : c.target.parentElement;
      const box = node && node.closest(INKED);
      if (box) boxes.add(box);
      for (const added of c.addedNodes) if (added.nodeType === 1) {
        if (added.matches(INKED)) boxes.add(added);
        for (const inner of added.querySelectorAll(INKED)) boxes.add(inner);
      }
    }
    boxes.forEach(centre);
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
