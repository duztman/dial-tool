// session.js — what a browser keeps between two openings: the last session, the saved dials (Versions), a dial as
// a link (pack, unpack: the whole dial in capitals and digits, link scheme in geometry.js), a set of dials as one link,
// the undo history (HISTORY) and the words for a step.

import * as G from "./geometry.js";
import { KEY, LAST, through } from "./ui.js";
import { NAMED } from "./rows.js";

// your saved dials (4.76, #347): in this browser only, newest first, at most INSTANCES_MOST
export const INSTANCES_KEY = KEY("instances"), INSTANCES_MOST = 9;      // nine, a 3 × 3 grid (Okay, 20 Oct 2026, 02:26: "Versions limit 9, new ones after 9 replace the first: warn")

export const instances_read = () => { try { const v = JSON.parse(localStorage.getItem(INSTANCES_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };

export const instances_write = (list) => { try { localStorage.setItem(INSTANCES_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } };

/** a dial's small picture, as the Gallery's (gallery.mjs): every shape of its scene, no guides. */
export function dial_picture(S, statik) {
  const R = S.dial_d / 2 + 0.6, hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, "0")).join("");
  const shapes = G.scene(S, statik, S.t, false).map((i) => `<path d="${(i.role === "hand" || i.role === "mark" ? G.turned(i.path, i.angle) : i.path).svg(2, true)}" fill="${hex(i.fill)}"${i.fill[3] < 1 ? ` fill-opacity="${i.fill[3]}"` : ""}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-R} ${-R} ${2 * R} ${2 * R}" aria-hidden="true">${shapes}</svg>`;
}

export async function pack(S) {
  return `${G.LINK_SCHEME}` + G.base32(await through(new TextEncoder().encode(G.link_text(S)), new CompressionStream("deflate-raw")));
}

/** the part after # → { settings } for a dial, { old: scheme } for a link of an older scheme, { bad: true } for a link
 *  of this scheme that can't be read (cut short in a paste, a letter wrong), or null when there is no link. `also` names
 *  older schemes read anyway with today's reading: only for the dials saved in this browser (entry_settings). */
export async function unpack(hash, also = []) {
  const kind = G.link_kind(hash);
  if (!kind) return null;
  if (kind.scheme !== G.LINK_SCHEME && !also.includes(kind.scheme)) return { old: kind.scheme };
  try {
    const settings = G.from_link_text(new TextDecoder().decode(await through(G.un_base32(kind.letters), new DecompressionStream("deflate-raw"))));
    return settings ? { settings } : { bad: true };
  } catch (e) {
    return { bad: true };                          // said by the caller (R17: never another dial drawn quietly in its place)
  }
}

export const OLD_LINK_NOTE = "This link is from an older Dial Tool and can’t be opened: here is the First dial.";

export const BAD_LINK_NOTE = "This link can’t be read — it may have been cut short when copied. The dial shown is the one this browser had, or the First dial.";

// ── a set of saved dials as one link (#523; Okay, 24 Oct 2026: "Share dial (set — if there are versions under dial)
//   as link"; his answers: Copy set link in the Share pane, it opens as Compare, the receiver is asked before anything
//   is saved, the saved dials only) ──
//   "V" (for Versions), the scheme's number, then the same writing as one dial's link: the dials' names and link texts
//   as one list, deflated together (dials that share most settings pack small), in Crockford's base 32.
export async function pack_set(dials) {                   // dials: [{ name, S }]
  const text = JSON.stringify(dials.map((d) => [d.name, G.link_text(d.S)]));
  return `V${G.LINK_SCHEME}` + G.base32(await through(new TextEncoder().encode(text), new CompressionStream("deflate-raw")));
}

export const set_kind = (hash) => { const m = /^#?V([0-9])([0-9A-Z]+)$/.exec(hash || ""); return m ? { scheme: +m[1], letters: m[2] } : null; };

/** the part after # → { dials: [{ name, settings }] } for a set, { old: scheme } for a set of an older scheme, or null. */
export async function unpack_set(hash) {
  const kind = set_kind(hash);
  if (!kind) return null;
  if (kind.scheme !== G.LINK_SCHEME) return { old: kind.scheme };
  try {
    const list = JSON.parse(new TextDecoder().decode(await through(G.un_base32(kind.letters), new DecompressionStream("deflate-raw"))));
    const dials = list.map(([name, text]) => ({ name: String(name), settings: G.from_link_text(text) })).filter((d) => d.settings);
    return dials.length ? { dials } : null;
  } catch (e) {
    return null;
  }
}

export const OLD_SET_NOTE = "This set of dials is from an older Dial Tool and can’t be opened.";

/** a saved dial's settings: whole, as it was saved (`dial`), so it survives a new link scheme (R31); a dial saved
 *  with only its link is read from it, scheme 4 too (the scheme before Arimo became the starting font, #228). */
export async function entry_settings(e) {
  if (e.dial) { try { return G.fresh_settings(JSON.parse(e.dial)); } catch (x) { /* the link below */ } }
  const got = await unpack(e.link, [4]);
  return got && got.settings ? got.settings : null;
}

// ── undo ─────────────────────────────────────────────────────
//   The dial as it was after each change, as text: PAST (oldest first) · NOW · FUTURE (what was undone, until the
//   next change). It belongs to the page, not to one DialTool, so loading a file or a reset is one step back too.
//   A step is taken when the dial has been still for a moment (with the autosave), so one drag of a slider is one
//   step. Not part of a dial: the time shown and the window's own state (section, selected ring, unit…).
export const HISTORY = { past: [], now: null, future: [], most: 20 };      // 20 kept, as many as the list under undo shows (Okay, 21 Oct 2026: "Only 20 kept", #495)

export const dial_text = (S) => JSON.stringify(S, (key, value) => (key === "t" || key.startsWith("ui_") ? undefined : value));

/** what one undo step changed, in the panel's words (#172; atlas 5.15, "a history you can read"): "Numerals · Radius",
 *  "Hour hand · Length", "Window 2 · Width", "Diameter"; more than one thing → the first and how many more. Read from
 *  two states of the dial side by side, so nothing extra is kept per step. */
export const RING_WORDS = { r: "Radius", w: "Width", len: "Length", size: "Size" };      // a ring's keys whose row words change with its kind (Outer radius, Ø…): one word for all

export function step_name(a, b) {
  const A = JSON.parse(a), B = JSON.parse(b), out = [], same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const word = (scope, key) => (scope === "ring" && RING_WORDS[key]) || NAMED.get(`${scope}:${key}`) || NAMED.get(`*:${key}`) || key.replace(/^(da|ha|out|gd|sh|c)_/, "").replace(/_/g, " ");
  const inside = (who, scope, x = {}, y = {}) => { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) if (!same(x[k], y[k])) out.push(k === "on" ? `${who} ${y.on ? "shown" : "hidden"}` : `${who} · ${word(scope, k)}`); };
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
    if (same(A[key], B[key])) continue;
    if (key === "rings") {
      const ra = A.rings || [], rb = B.rings || [], names = (r) => r.map((x) => x.name).sort().join("|");
      if (ra.length !== rb.length) out.push(rb.length > ra.length ? "A ring added" : "A ring removed");
      else if (names(ra) === names(rb) && ra.some((x, i) => x.name !== rb[i].name)) out.push("Rings reordered");
      else rb.forEach((r, i) => inside(r.name || "A ring", "ring", ra[i], r));
    } else if (/^ha_(hour|minute|second)$/.test(key)) inside({ ha_hour: "Hour hand", ha_minute: "Minute hand", ha_second: "Seconds hand" }[key], "hand", A[key], B[key]);
    else if (key === "windows") (B.windows || []).forEach((w, i) => inside(`Window ${i + 2}`, "window", (A.windows || [])[i], w));
    else if (key === "da_on") out.push(`Window 1 ${B.da_on ? "shown" : "hidden"}`);
    else if (key.startsWith("da_")) out.push(`Window 1 · ${word("window", key.slice(3))}`);
    else out.push(word("global", key));
  }
  const list = [...new Set(out)];
  return list.length ? list[0] + (list.length > 1 ? ` +${list.length - 1}` : "") : "A change";
}

/** The short address (#537; Okay, 24 Oct 2026: "The address bar is nice to copy and share but cumbersome to just copy
 *  the domain and folder. Can we hide the full address and make the link still work"). A dial's link opens the dial,
 *  then the address bar is cut back to the site's own address, so copying it copies the site. The dial stays in the
 *  session (a reload brings it back); Copy link gives the whole dial. Where the session can't be kept (a private
 *  window) the address keeps the dial, so a reload doesn't lose it (R17). */
export function keep_and_shorten(S) {
  try { localStorage.setItem(LAST, JSON.stringify(S)); } catch (e) { return; }      // nothing kept: the address stays
  if (!location.hash) return;
  try { history.replaceState(null, "", location.href.split("#")[0]); } catch (e) { /* the address stays as it was */ }
}
