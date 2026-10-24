// grey.cjs — the first dial in greys, for the help page's pictures (Okay, 24 Oct 2026, 20:51: "make the dial grayscale,
// good contrast with back and within, not crazy. Simple"). A light grey ground, a dark plate, near-white print, light hands.
// Applied the way a visitor's own dial is: written to the browser's saved dial, then the page opened again.
const GREY = {
  c_backdrop: [0.82, 0.82, 0.82, 1],      // the ground: light
  c_plate: [0.20, 0.20, 0.20, 1],         // the plate: dark, far from the ground
  print: [0.94, 0.94, 0.94, 1],           // every ring: near white on the plate
  hands: [[0.86, 0.86, 0.86, 1], [0.70, 0.70, 0.70, 1], [1, 1, 1, 1]],      // hour, minute, seconds: told apart by tone
  c_cap: [0.96, 0.96, 0.96, 1],
  frame: [0.94, 0.94, 0.94, 1],           // a window's frame, as the print
  figures: [0.16, 0.16, 0.16, 1],         // what shows in a window: dark on its white disc
};
module.exports = async function grey(page) {
  await page.evaluate((G) => {
    const S = JSON.parse(JSON.stringify(window.dial_tool.S));
    S.c_backdrop = G.c_backdrop; S.c_plate = G.c_plate; S.c_cap = G.c_cap;
    S.rings.forEach((r) => { r.c = G.print; if (r.sectors) r.sectors = r.sectors.map(() => G.print); });
    ["ha_hour", "ha_minute", "ha_second"].forEach((k, i) => { S[k] = { ...S[k], c: G.hands[i] }; });
    S.da_ink = G.frame; S.da_text_c = G.figures;
    (S.windows || []).forEach((w) => { w.ink = G.frame; w.text_c = G.figures; });
    return JSON.stringify(S);
  }, GREY).then((settings) => page.addInitScript((s) => { if (!sessionStorage.getItem("greyed")) { localStorage.setItem("dial-tool-last", s); sessionStorage.setItem("greyed", "1"); } }, settings));
  await page.reload();      // the app saves its own dial as the page goes, so the grey one is written as the next page starts
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
};
