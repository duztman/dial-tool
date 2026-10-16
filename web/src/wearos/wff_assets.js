// wff_assets.js — Renders Wear OS assets (SVGs and PNGs) from Dial Tool geometry
import { circle, hand_shape, turned, hand_angles, BEATS } from "../geometry.js";

const num = (v, digits = 4) => {
  const s = (v + 0).toFixed(digits).replace(/^-(0(\.0+)?)$/, "$1");
  return s.includes(".") ? s.replace(/\.?0+$/, "") || "0" : s;
};

const rgb = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();

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
 * Builds SVG for just the dial plate (background disc).
 */
export function svg_dial_plate(S, statik, ambient = false) {
  if (!statik.plate) return null;
  let fill = S.c_plate;
  if (ambient === "dimmed") {
    fill = [S.c_plate[0] * 0.15, S.c_plate[1] * 0.15, S.c_plate[2] * 0.15, 1];
  } else if (ambient && ambient !== "plate") {
    // "black" or true: pure black plate (or omit if alpha=0)
    fill = [0, 0, 0, 1];
  }
  return layer_svg(S, [{ role: "plate", path: statik.plate, fill }]);
}

/**
 * Builds SVG for just the dial rings (ticks, numerals, markers, bands).
 */
export function svg_dial_rings(S, statik, ambient = false) {
  const items = [];
  const rings = statik.rings.slice().reverse();

  for (const d of rings) {
    if (d.tints) {
      d.tints.forEach((tint, n) => {
        const fill = ambient ? [0.9, 0.9, 0.9, 1] : d.ring.c;
        items.push({ role: "ring", path: tint.path, fill });
      });
    } else {
      const fill = ambient ? [0.9, 0.9, 0.9, 1] : d.ring.c;
      items.push({ role: "ring", path: d.path, fill });
    }
  }

  return layer_svg(S, items);
}

/**
 * Builds SVG for the stationary dial face (plate + rings) combined.
 */
export function svg_dial_face(S, statik, ambient = false) {
  const items = [];
  const rings = statik.rings.slice().reverse();

  // Dial plate
  if (!ambient) {
    if (statik.plate) items.push({ role: "plate", path: statik.plate, fill: S.c_plate });
  } else if (ambient === "plate") {
    if (statik.plate) items.push({ role: "plate", path: statik.plate, fill: S.c_plate });
  } else if (ambient === "dimmed") {
    if (statik.plate) {
      const dim = [S.c_plate[0] * 0.15, S.c_plate[1] * 0.15, S.c_plate[2] * 0.15, 1];
      items.push({ role: "plate", path: statik.plate, fill: dim });
    }
  } else {
    // Pure black
    if (statik.plate) items.push({ role: "plate", path: statik.plate, fill: [0, 0, 0, 1] });
  }

  // Rings
  for (const d of rings) {
    const ringFill = (ambient && ambient !== "plate") ? [0.9, 0.9, 0.9, 1] : d.ring.c;
    if (d.tints) {
      d.tints.forEach((tint) => {
        items.push({ role: "ring", path: tint.path, fill: ringFill });
      });
    } else {
      items.push({ role: "ring", path: d.path, fill: ringFill });
    }
  }

  return layer_svg(S, items);
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
 * Builds SVG for the preview snapshot (with hands at standard 10:10:31).
 */
export function svg_preview(S, statik) {
  const items = [];
  const rings = statik.rings.slice().reverse();

  if (statik.plate) items.push({ role: "plate", path: statik.plate, fill: S.c_plate });

  for (const d of rings) {
    if (d.tints) {
      d.tints.forEach((tint) => items.push({ role: "ring", path: tint.path, fill: d.ring.c }));
    } else {
      items.push({ role: "ring", path: d.path, fill: d.ring.c });
    }
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
 */
export async function svg_to_png_bytes(svgString, size = 450) {
  if (typeof document === "undefined") {
    throw new Error("svg_to_png_bytes requires a browser DOM environment");
  }

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);

    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("Canvas PNG export failed");
    return new Uint8Array(await pngBlob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}
