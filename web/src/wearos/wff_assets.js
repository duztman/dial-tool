// wff_assets.js — Renders Wear OS assets (SVGs and PNGs) from Dial Tool geometry
import {
  circle,
  hand_shape,
  turned,
  hand_angles,
  BEATS,
  WINDOW_KINDS,
  windows_of,
  build_static,
  sector_colour,
  empty,
} from "../geometry.js";

import { num, rgb } from "../output.js";      // the same number and colour writers as the SVG and PDF files

/**
 * Returns an SVG document for a given list of scene items scaled to 450x450 px.
 */
function layer_svg(S, items, { background = null, size = 450 } = {}) {
  const scale = size / S.dial_d;
  const center = size / 2;
  const out = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
  ];

  if (background) {
    out.push(`  <rect width="${size}" height="${size}" fill="${background}"/>`);
  }

  out.push(`  <g transform="translate(${center} ${center}) scale(${num(scale)})">`);
  for (const item of items) {
    if (!item.path) continue;
    const alpha = item.fill && item.fill[3] < 1 ? ` fill-opacity="${num(item.fill[3])}"` : "";
    const fill = item.fill ? rgb(item.fill) : "#FFFFFF";
    out.push(`    <path d="${item.path.svg(5, true)}" fill="${fill}"${alpha}/>`);
  }
  out.push(`  </g>`, `</svg>`);
  return out.join("\n");
}

/**
 * Builds SVG for the stationary dial face (plate + rings) combined.
 * The plate is solid (no window holes) and window frames are NOT baked in: each window
 * is a customizable complication slot drawn on top (disc + content + frame), so turning a
 * window off or swapping it for a stock complication leaves a clean, hole-free dial.
 */
export function svg_dial_face(S, statik, ambient = false) {
  const items = [];
  const rings = statik.rings.slice().reverse();
  const plate = statik.plate ? circle(S.dial_d) : null;

  if (!ambient || ambient === "plate") {
    if (plate) items.push({ role: "plate", path: plate, fill: S.c_plate });
  } else if (ambient === "dimmed") {
    if (plate) {
      const dim = [S.c_plate[0] * 0.15, S.c_plate[1] * 0.15, S.c_plate[2] * 0.15, 1];
      items.push({ role: "plate", path: plate, fill: dim });
    }
  } else {
    // Pure black
    if (plate) items.push({ role: "plate", path: plate, fill: [0, 0, 0, 1] });
  }

  // Rings
  for (const d of rings) {
    if (d.tints) {
      d.tints.forEach((tint) => {
        const ringFill = (ambient && ambient !== "plate") ? [0.9, 0.9, 0.9, 1] : sector_colour(d.ring, tint.at);
        items.push({ role: "ring", path: tint.path, fill: ringFill });
      });
    } else {
      const ringFill = (ambient && ambient !== "plate") ? [0.9, 0.9, 0.9, 1] : d.ring.c;
      items.push({ role: "ring", path: d.path, fill: ringFill });
    }
  }

  return layer_svg(S, items);
}

const DAYS_FULL = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

/**
 * Infers the 7 day-of-week labels (1=Sunday .. 7=Saturday in WFF [DAY_OF_WEEK])
 * matching the length and letter casing of the user's sample text in the window.
 */
export function day_labels_for(sampleText) {
  const raw = String(sampleText || "MON").trim();
  const s = /^\d+$/.test(raw) || !raw ? "MON" : raw;
  const len = s.length;
  const base = DAYS_FULL.map((d) => {
    if (len === 1) return d.slice(0, 1);
    if (len === 2) return d.slice(0, 2);
    if (len === 3) return d.slice(0, 3);
    return d;
  });
  if (s === s.toLowerCase()) {
    return base.map((d) => d.toLowerCase());
  }
  if (len >= 2 && s[0] === s[0].toUpperCase() && s.slice(1) === s.slice(1).toLowerCase()) {
    return base.map((d) => d[0] + d.slice(1).toLowerCase());
  }
  return base;
}

/**
 * Rebuilds a single window (`winIndex = 0..3`) with a custom state mutation,
 * without rebuilding any rings or other windows.
 */
function build_single_window(S, winIndex, mutate) {
  const S_copy = {
    ...S,
    rings: S.rings.map((r) => ({ ...r, on: false })),
    da_on: false,
    windows: S.windows.map((w) => ({ ...w, on: false })),
    dial_hole: 0,
  };
  const w = windows_of(S_copy)[winIndex];
  w.on = true;
  mutate(w, S_copy);
  return build_static(S_copy).windows[0];
}

/**
 * Computes the 450x450 pixel bounding box, sprite sheet grid dimensions, and WFF
 * data-source expressions for an active window `x` from `statik.windows`.
 */
export function compute_window_layout(S, x) {
  const scale = 450 / S.dial_d;
  const b = (x.frame ? x.window.union(x.frame).bounds() : x.window.bounds()) || [-5, -5, 5, 5];
  const [x0, y0, x1, y1] = b;

  // In geometry.js, +y is UP; in 450x450 SVG/WFF space, +y is DOWN from center (225, 225)
  const boxX = Math.max(0, Math.floor(225 + x0 * scale) - 1);
  const boxY = Math.max(0, Math.floor(225 - y1 * scale) - 1);
  const boxW = Math.max(2, Math.min(450, Math.ceil(225 + x1 * scale) + 1) - boxX);
  const boxH = Math.max(2, Math.min(450, Math.ceil(225 - y0 * scale) + 1) - boxY);

  const kind = WINDOW_KINDS[x.w.kind] || "date";
  let frames, cols, rows, colExpr, rowExpr;

  if (kind === "date" || kind === "big date") {      // a big date (4.74): one frame a day, as a date
    frames = 31;
    cols = 6;
    rows = 6;
    colExpr = "(([DAY] - 1) % 6)";
    rowExpr = "floor(([DAY] - 1) / 6)";
  } else if (kind === "day") {
    frames = 7;
    cols = 1;
    rows = 7;
    colExpr = "0";
    rowExpr = "([DAY_OF_WEEK] - 1)";
  } else if (kind === "am · pm") {
    frames = 48;
    cols = 6;
    rows = 8;
    colExpr = "(([HOUR_0_23] * 2 + floor([MINUTE] / 30)) % 6)";
    rowExpr = "floor(([HOUR_0_23] * 2 + floor([MINUTE] / 30)) / 6)";
  } else {
    // "moon phase": [MOON_PHASE_POSITION] is 0..28
    frames = 29;
    cols = 6;
    rows = 5;
    colExpr = "(clamp([MOON_PHASE_POSITION], 0, 28) % 6)";
    rowExpr = "floor(clamp([MOON_PHASE_POSITION], 0, 28) / 6)";
  }

  return {
    index: x.index,
    kind,
    boxX,
    boxY,
    boxW,
    boxH,
    frames,
    cols,
    rows,
    sheetW: cols * boxW,
    sheetH: rows * boxH,
    colExpr,
    rowExpr,
  };
}

/**
 * Builds the 2D sprite sheet SVG for an active window `x` from `statik.windows`,
 * containing all dynamic frames for its kind (`date`, `day`, `am · pm`, `moon phase`).
 */
export function svg_window_sheet(S, x) {
  const layout = compute_window_layout(S, x);
  const { kind, boxX, boxY, boxW, boxH, frames, cols, sheetW, sheetH } = layout;
  const scale = 450 / S.dial_d;

  const discColor = x.w.disc_c || [1, 1, 1, 1];
  const discFill = rgb(discColor);
  const discAlpha = discColor[3] < 1 ? ` fill-opacity="${num(discColor[3])}"` : "";

  const textColor = x.w.text_c || x.w.ink || [0, 0, 0, 1];
  const textFill = rgb(textColor);
  const textAlpha = textColor[3] < 1 ? ` fill-opacity="${num(textColor[3])}"` : "";

  // The plate under the window is solid now, so the disc is the exact window shape (no cutline bleed),
  // and the frame (if any) is drawn on top of it inside every cell.
  const discD = x.window.svg(5, true);
  const frameColor = x.w.ink || [0, 0, 0, 1];
  const frameD = x.frame && !empty(x.frame) ? x.frame.svg(5, true) : null;
  const frameFill = rgb(frameColor);
  const frameAlpha = frameColor[3] < 1 ? ` fill-opacity="${num(frameColor[3])}"` : "";

  const zeroPadDate = kind === "date" && /^0\d$/.test(String(x.w.text || "").trim());
  const dayLabels = kind === "day" ? day_labels_for(x.w.text) : null;

  const out = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">`,
  ];

  for (let k = 0; k < frames; k++) {
    const col = k % cols;
    const row = Math.floor(k / cols);
    const tx = col * boxW + (225 - boxX);
    const ty = row * boxH + (225 - boxY);

    const frameWin = build_single_window(S, x.index, (w, S_copy) => {
      if (kind === "date" || kind === "big date") {
        const d = k + 1;
        w.text = zeroPadDate && d < 10 ? `0${d}` : String(d);
      } else if (kind === "day") {
        w.text = dayLabels[k];
      } else if (kind === "am · pm") {
        S_copy.t = k * 1800; // 30-minute steps across 24 hours
      } else if (kind === "moon phase") {
        w.age = (k / 28) * 29.53;
      }
    });

    out.push(`  <g transform="translate(${num(tx)} ${num(ty)}) scale(${num(scale)})">`);
    out.push(`    <path d="${discD}" fill="${discFill}"${discAlpha}/>`);
    if (frameWin && frameWin.number && !empty(frameWin.number)) {
      out.push(`    <path d="${frameWin.number.svg(5, true)}" fill="${textFill}"${textAlpha}/>`);
    }
    for (const m of (frameWin && frameWin.more) || []) {      // a picture's further colours, a date's neighbours (4.73, 4.74)
      const c = x.w[m.key] || (m.like_number ? x.w.text_c || x.w.ink : m.or);
      if (m.path && !empty(m.path)) out.push(`    <path d="${m.path.svg(5, true)}" fill="${rgb(c)}"${c[3] < 1 ? ` fill-opacity="${num(c[3])}"` : ""}/>`);
    }
    if (frameD) out.push(`    <path d="${frameD}" fill="${frameFill}"${frameAlpha}/>`);
    out.push(`  </g>`);
  }

  out.push(`</svg>`);
  return out.join("\n");
}

/**
 * Builds SVG for an individual upright analog hand.
 */
export function svg_hand(S, name, ambient = false) {
  const handConfig = S["ha_" + name];
  if (!handConfig || !handConfig.on) return null;

  const path = hand_shape(handConfig);
  let fill = handConfig.c;

  if (ambient && ambient !== "plate") {
    // For ambient mode on dark/black plates, ensure sufficient luminance for legibility
    const lum = 0.2126 * fill[0] + 0.7152 * fill[1] + 0.0722 * fill[2];
    if (lum < 0.4) fill = [0.9, 0.9, 0.9, 1];
  }

  return layer_svg(S, [{ role: "hand", path, fill }]);
}

/**
 * Builds SVG for the center pin cap.
 */
export function svg_cap(S) {
  if (!S.ha_on || S.ha_cap <= 0) return null;
  const path = circle(S.ha_cap);
  return layer_svg(S, [{ role: "cap", path, fill: S.c_cap }]);
}

/**
 * Builds SVG for the preview snapshot (with windows and hands at standard 10:10:31).
 */
export function svg_preview(S, statik) {
  const items = [];
  const rings = statik.rings.slice().reverse();

  // Windows underneath the plate
  for (const x of statik.windows || []) {
    items.push({ role: "date disc", path: x.window, fill: x.w.disc_c || [1, 1, 1, 1] });
    items.push({ role: "date number", path: x.number, fill: x.w.text_c || x.w.ink });
    for (const m of x.more || []) items.push({ role: "date picture", path: m.path, fill: x.w[m.key] || (m.like_number ? x.w.text_c || x.w.ink : m.or) });      // a picture's further colours (4.73)
  }

  if (statik.plate) items.push({ role: "plate", path: statik.plate, fill: S.c_plate });

  for (const d of rings) {
    if (d.tints) {
      d.tints.forEach((tint) => items.push({ role: "ring", path: tint.path, fill: sector_colour(d.ring, tint.at) }));
    } else {
      items.push({ role: "ring", path: d.path, fill: d.ring.c });
    }
  }

  // Window frames above plate and rings
  for (const x of statik.windows || []) {
    if (x.frame) items.push({ role: "date frame", path: x.frame, fill: x.w.ink });
  }

  if (S.ha_on) {
    // 10:10:31 angles
    const angles = hand_angles(10 * 3600 + 10 * 60 + 31, (BEATS[S.ha_beat] || BEATS[0])[1]);
    const hands = ["hour", "minute", "second"];
    hands.forEach((name, i) => {
      const h = S["ha_" + name];
      if (h && h.on) {
        items.push({ role: "hand", path: turned(hand_shape(h), angles[i]), fill: h.c });
      }
    });

    if (S.ha_cap > 0) {
      items.push({ role: "cap", path: circle(S.ha_cap), fill: S.c_cap });
    }
  }

  return layer_svg(S, items, { size: 450 });
}

/**
 * Browser helper: converts an SVG string to a PNG Uint8Array using HTMLCanvasElement.
 * Automatically uses the SVG's naturalWidth/naturalHeight when width/height are omitted.
 */
export async function svg_to_png_bytes(svgString, width = null, height = null) {
  if (typeof document === "undefined") {
    throw new Error("svg_to_png_bytes requires a browser DOM environment");
  }

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const w = width || img.naturalWidth || 450;
    const h = height || width || img.naturalHeight || 450;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("Canvas PNG export failed");
    return new Uint8Array(await pngBlob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}
