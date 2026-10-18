// linktrip.mjs — a dial's link, there and back (#291; R31 as replaced, 16 Oct 2026). No browser: the same packing
// as the page's Copy link (links.mjs), read back as the page reads it (app.js unpack). The page's own way through
// (CompressionStream) is checked in window.mjs.
//
//   cd web && node test/linktrip.mjs
import zlib from "zlib";
import crypto from "crypto";
import * as G from "../src/geometry.js";
import { link } from "../links.mjs";
import { OPENER, OKAYS_WATCH } from "../src/opener.js";
import { DIALS } from "../gallery.mjs";
import { example_dials } from "../examples.mjs";

const problems = [];
const check = (ok, what) => { console.log((ok ? "ok    " : "FAIL  ") + what); if (!ok) problems.push(what); };

// a key's code is its place in LINK_KEYS, so the list only grows at its end (R31). test/link-keys.json is the list as
// released; it must stand at the start of LINK_KEYS, unchanged. After appending keys, append them to the file too.
// (4.72–4.75 put theirs higher up and moved the codes of 4.69's: found 19 Oct 2026, 4.79.)
{
  const frozen = JSON.parse(await import("fs").then((fs) => fs.readFileSync(new URL("./link-keys.json", import.meta.url), "utf8")));
  const moved = frozen.findIndex((k, i) => G.LINK_KEYS[i] !== k);
  check(moved < 0, moved < 0 ? `LINK_KEYS keeps the ${frozen.length} released keys in their places (${G.LINK_KEYS.length - frozen.length} appended since)`
    : `LINK_KEYS changed at ${moved}: "${frozen[moved]}" became "${G.LINK_KEYS[moved]}" — new keys go at the list's end only`);
}

/** a link → settings, as the page reads one */
const read = (l) => {
  const kind = G.link_kind(l);
  if (!kind || kind.scheme !== G.LINK_SCHEME) return null;
  return G.from_link_text(zlib.inflateRawSync(Buffer.from(G.un_base32(kind.letters))).toString());
};
/** where two settings differ by more than a link may change them: a number by 0.002 at most (3 decimals: 0.0005;
 *  a colour's channel as hex: half of 1/255, then kept to 4 decimals as the colour pop-out keeps it: 0.00005 more),
 *  the time by half a second. Measured 16 Oct 2026: 0.9 → 0.902 is the most it moves (229.5 of 255) */
const differences = (a, b, at = "") => {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= (at.endsWith(".t") ? 0.5 : 0.5 / 255 + 0.5e-4) ? [] : [`${at}: ${a} → ${b}`];
  if (Array.isArray(a) && Array.isArray(b)) return a.length !== b.length ? [`${at}: length ${a.length} → ${b.length}`] : a.flatMap((x, i) => differences(x, b[i], `${at}[${i}]`));
  if (a && b && typeof a === "object" && typeof b === "object") return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !k.startsWith("ui_")).flatMap((k) => differences(a[k], b[k], `${at}.${k}`));
  return JSON.stringify(a) === JSON.stringify(b) ? [] : [`${at}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`];
};

// every dial kept in the repo as a link, and the opener: there and back gives the same dial
const dials = [
  ["the opener (the guide's First dial)", OPENER],
  ["Okay's watch", OKAYS_WATCH],
  ...DIALS.map((d) => [`Gallery: ${d.name}`, { ...d.settings, guides: true }]),
  ...example_dials().map((d) => [`example: ${d.name}`, { ...d.settings, guides: true }]),
];
let longest = 0;
for (const [name, settings] of dials) {
  const S = G.fresh_settings(structuredClone(settings)), l = link(S), back = read(l);
  const diff = back ? differences(S, G.fresh_settings(back)) : ["not read back"];
  longest = Math.max(longest, l.length);
  check(/^#2[0-9A-Z]+$/.test(l) && diff.length === 0, `${name}: there and back the same dial (${l.length} characters, capitals and digits)${diff.length ? " — " + diff.slice(0, 4).join(" · ") : ""}`);
  check(link(G.fresh_settings(back || {})) === l, `${name}: read and written again, the same link`);
}

// what the squeeze must keep: a text that looks like a colour stays a text; the beat travels (#277); the time to the second
{
  const S = G.fresh_settings(structuredClone(OPENER));
  S.ha_beat = 1; S.t = 36610.4; S.rings[0].custom = "#a1b2c3, ##, #1";
  const back = G.fresh_settings(read(link(S)));
  check(back.ha_beat === 1 && back.t === 36610 && back.rings[0].custom === "#a1b2c3, ##, #1", `the beat travels (${back.ha_beat}), the time to the second (${back.t}), a text starting with # stays a text`);
  S.rings[0].custom = "#a1b2c3";
  check(G.fresh_settings(read(link(S))).rings[0].custom === "#a1b2c3", "even a text that is all a colour's hex");
}

// an older scheme is recognised, not read: the page opens the First dial with a note (window.mjs checks that)
check(G.link_kind("#1.fZLRjtsgEEV_~x")?.scheme === 1 && G.link_kind("0.abc")?.scheme === 0 && G.link_kind("#2ABC")?.scheme === 2 && G.link_kind("#hello") === null && G.link_kind("") === null,
  "a link of scheme 0 or 1 is known as one; anything else after # is not a dial");

// Crockford's base 32: any bytes there and back; read forgiving (small letters, O for 0, I and L for 1, dashes)
{
  const bytes = crypto.randomBytes(997), text = G.base32(bytes);
  const same = (a, b) => a && a.length === b.length && a.every((x, i) => x === b[i]);
  const forgiving = G.un_base32(text.toLowerCase().replace(/0/g, "o").replace(/1/g, "l").replace(/(.{8})/g, "$1-"));
  check(/^[0-9A-HJKMNP-TV-Z]+$/.test(text) && same(G.un_base32(text), bytes) && same(forgiving, bytes) && G.un_base32("2U") === null, "base 32: 997 random bytes there and back; small letters, O, I, L and dashes read as meant; U is no letter of it");
}

// the key table: every key of the settings has a code, and the table only grows (its first 156 keys stay as they are)
{
  const keys = [G.DEFAULTS, G.RING_BASE, G.HAND_BASE, G.WINDOW_BASE].flatMap((o) => Object.keys(o)).filter((k) => !k.startsWith("ui_") && k !== "version");
  const missing = [...new Set(keys)].filter((k) => !G.LINK_KEYS.includes(k));
  check(missing.length === 0 && new Set(G.LINK_KEYS).size === G.LINK_KEYS.length, `every settings key has a code, none twice${missing.length ? " — missing: " + missing.join(" ") + " (add them at the table's end)" : ""}`);
  const FROZEN = { count: 156, sha: "9aca7e8183e4ccce" };      // scheme 2's table as built (beta 4.43): changing these is a new scheme (R31)
  const sha = crypto.createHash("sha256").update(G.LINK_KEYS.slice(0, FROZEN.count).join(" ")).digest("hex").slice(0, 16);
  check(G.LINK_KEYS.length >= FROZEN.count && sha === FROZEN.sha, `the table only grows: its first ${FROZEN.count} keys as scheme 2 was built (${sha})`);
}

console.log(`\nlongest link: ${longest} characters`);
if (problems.length) { console.log(`\n${problems.length} problem(s).`); process.exit(1); }
console.log("\nLinks there and back: passed.");
