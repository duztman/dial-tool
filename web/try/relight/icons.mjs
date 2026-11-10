// icons.mjs — Show Case 3D's own icons (round 93), by Dial Tool's icon rule (R33, web/icons/README.md): each was drawn, fitted to the grid by
// `node icons/fit.mjs drawing.svg <size> <name>` in a dev checkout's web/, and weighed by `python3 icons/look.py icons/out/fit-<name>.json`; the
// widths below are what those two settled. Run from this folder (mkdir icons-out first): it writes icons-out/icons.json (what the page's
// round's patch pastes) and a fit-<name>.json each for look.py. The chevron, the arrow, the cross and the Dial tab's hub are the tool's own
// signs (web/src/icons.js: SIGNS.down, TOOL go, SIGNS.cross, SECTION_ICONS.Dial), repeated here so the page takes all of them from one file.
import fs from "fs";
const LINE = 1.5, CURVE = 1.625, DENSE = 1.25, SLANT = 1.5625, I = {};      // the helpers as in web/src/icons.js (it loads the page's modules, so they are repeated here word for word)
const sw = (w) => `stroke-width="${w}"`;
const box = (x, y, w, h, r, side = LINE, corner = CURVE) => { const X = x + w, Y = y + h;
  return `<path d="M${x + r} ${y}H${X - r}M${X} ${y + r}V${Y - r}M${X - r} ${Y}H${x + r}M${x} ${Y - r}V${y + r}"${side === LINE ? "" : ` ${sw(side)}`}/>`
    + `<path d="M${X - r} ${y}A${r} ${r} 0 0 1 ${X} ${y + r}M${X} ${Y - r}A${r} ${r} 0 0 1 ${X - r} ${Y}M${x + r} ${Y}A${r} ${r} 0 0 1 ${x} ${Y - r}M${x} ${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}" ${sw(corner)}/>`; };
const icon = (inside, size = 16, high = size) => `<svg viewBox="0 0 ${size} ${high}" width="${size}" height="${high}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="round" stroke-linejoin="round">${inside}</svg>`;
const fill = 'fill="currentColor" stroke="none"', ball = `<circle cx="12.25" cy="12.25" r="9" ${sw(CURVE)}/>`;
const IN = {
  camera: [`<path d="M3.25 4.75H5.25L6.5 2.75H10L11.25 4.75H13.25A1.5 1.5 0 0 1 14.75 6.25V11.75A1.5 1.5 0 0 1 13.25 13.25H3.25A1.5 1.5 0 0 1 1.75 11.75V6.25A1.5 1.5 0 0 1 3.25 4.75Z" ${sw(SLANT)}/><circle cx="8.25" cy="9.25" r="2.5" ${sw(CURVE)}/>`, 16],      // round 94 (Okay: "Have one outline, a detailed outline and a ring for lens inside"): the body and its hump one line; look.py: both lines within 1.4 %
  sun: [`<circle cx="8.25" cy="8.25" r="2.5" ${sw(CURVE)}/><path d="M8.25 1.25V3.25M8.25 13.25V15.25M1.25 8.25H3.25M13.25 8.25H15.25M3.25 3.25L4.75 4.75M11.75 11.75L13.25 13.25M3.25 13.25L4.75 11.75M11.75 4.75L13.25 3.25" ${sw(CURVE)}/>`, 16],
  photo: [`${ball}<path d="M7.75 10.75A5 5 0 0 1 10.75 7.75" ${sw(CURVE)}/><path d="M18.75 12.75A6.5 6.5 0 0 1 12.75 18.75"/>`, 24],
  toon: [`${ball}<path d="M20 7.5A9 9 0 0 1 7.5 20A11.5 11.5 0 0 0 20 7.5Z" ${fill}/>`, 24],
  dither: [`${ball}<circle cx="17" cy="16.5" r="1" ${fill}/><circle cx="14" cy="18.5" r="1" ${fill}/><circle cx="19" cy="13.5" r="1" ${fill}/><circle cx="14.5" cy="15" r="0.75" ${fill}/><circle cx="11" cy="17.5" r="0.75" ${fill}/><circle cx="17" cy="11.5" r="0.75" ${fill}/><circle cx="12" cy="14" r="0.5" ${fill}/><circle cx="14.5" cy="11" r="0.5" ${fill}/>`, 24],
  engineer: [`${ball}<path d="M12.25 3.25A3.5 9 0 0 1 12.25 21.25A3.5 9 0 0 1 12.25 3.25" ${sw(CURVE)}/><path d="M3.25 12.25H21.25"/>`, 24],
};
const out = {};
for (const [id, [inner, size]] of Object.entries(IN)) { const svg = icon(inner, size); out[id] = svg; fs.writeFileSync(`icons-out/fit-${id}.json`, JSON.stringify([{ id, svg: svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(' aria-hidden="true"', "") }])); }
out.down = icon(I.SIGNS?.down ?? `<path d="M4.25 6.25L8.25 10.25L12.25 6.25" ${sw(SLANT)}/>`); out.cross = icon(`<path d="M4.25 4.25L12.25 12.25M12.25 4.25L4.25 12.25" ${sw(SLANT)}/>`); out.go = icon(`<path d="M3.25 8.25H13.25M9.25 4.25L13.25 8.25L9.25 12.25"/>`);
out.dialhub = `<circle class="hub" cx="17" cy="17" r="2" ${sw(CURVE)}/>`;
fs.writeFileSync("icons-out/icons.json", JSON.stringify(out, null, 1)); console.log(Object.keys(out).join(" "), Object.keys(I).filter(k => /SIGN|TOOL|PICS/.test(k)).join(","));
