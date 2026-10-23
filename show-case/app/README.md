# Dial Tool Show Case — the app

Written 21 Oct 2026 (session closed 02:35 Istanbul). A side product of Dial Tool, made without the project's protocol
(Okay, 20 Oct 2026: "read readme but nothing on the git or the actual tool"). Nothing in the web app depends on it.

- **Live, stable** (Okay, 21 Oct 2026: "this is where we park stable versions"): <https://duztman.github.io/dial-tool/show-case/>,
  branch `gh-pages`, file `show-case/index.html`. Built from `dev`'s `web/src/watch.js`: live is **beta 1.0.21** (23 Oct 2026, Dial Tool 4.92).
- **Working copy**: the Claude artifact <https://claude.ai/artifact/PrAdn9LAkcKqQPqNHq9pQ5>. It counts versions on from
  the live one in small steps: 1.0.1, 1.0.2, …

## What it does

Paste a Dial Tool link → the dial is drawn in a whole watch (case, crown, strap or bracelet). You can change the dial's
colours and ink heights, the watch, the light, and the time (Dial Tool's bottom bar), then export PNG or PDF. The PDF is
a JPEG at the drawing's real mm size.

The column on the right has four tabs:

- **Dial**: link and Open on the pane's line; one row per dial colour, with its ink height; Reset colours and ink; Hand
  bevels.
- **Watch**: three panes.
  - **Watch**: View (Detail · Whole watch · Dial), Case (Dress · Field · Diver), Size, Metal (Fe Au Al CuSn Ti Black),
    Case colour, and the diver's insert.
  - **Strap**: Leather or NATO; Bracelet on the diver only.
  - **Reset**: its button on the pane's line.
- **Light**: two fixed lines on top, **Style** (Engineer · Miyazaki) and **Lighting** (Dramatic · Flat). Then four
  panes: Sun, Shadows, Flare (Blurs and Flare ticks on one line), Glass reflection.
- **Export**: PNG and PDF.

The canvas has two controls at the bottom left, stacked: the zoom pill (− + Fit) on top, Background (10 solids,
10 45° gradients) under it. The arrow at the top right slides the column away.

## Rules Okay set (keep them)

- **The opener** (Okay, 21 Oct 2026, 02:40): the first dial from `show-case/src/links.txt`, Dress, Au, brown leather,
  Detail, Miyazaki, Dramatic, the sun from 225° at 40° high, on the **Ember** gradient (#2a1a17 → #b4533a). Opening a
  link returns the background to its automatic one (from the drawing), unless the background was picked by hand.
- **View is zoom only.** Lighting (Dramatic/Flat) is its own choice on the Light tab.
- **Fit**:
  - **Detail** (Okay's screenshot, 21 Oct 2026, 02:35, "This is how fit fits into canvas"): the lug ends meet the
    canvas's top and bottom limits, 64 px in from each edge. When the window grows and its width allows, the watch
    grows with it. This is the current behaviour; keep it.
  - **Whole watch**: the whole drawing fits, with the same 64 px.
  - **Dial**: fits like Dial Tool's Fit, the dial plus the page margin across the shorter side.
- **Column colour**: the background colour made darker and more saturated (hsl s×2.2+0.15, l×30 %), at 85 % opacity.
  The title and tabs are 10 % lighter, as on Dial Tool. Its "blacks" (lines, field outlines) adapt to the column's
  lightness. The bar stays Dial Tool's grey.
- **Tabs**: measured to Dial Tool's px for px. The chosen tab's 3 px bar stands on the 2 px line under the tabs. Each
  tab's first pane draws no line of its own.
- **Bar type**: Inter with tabular figures and a plain zero, 14 px, one size for everything except the date. Each word
  is centred on its ink. The speed pill (1 · 50 · 750) shows "X" on the active speed only.
- **Colour pickers**: the system picker. A native colour input lies over each swatch, because the artifact frame
  blocks opening one from script.
- **Window discs** are not printed, so they have no ink relief.

## Build

From this folder, with the repo's `web/node_modules` installed:

```
node build.mjs     # → out/dial-show-case.html (the artifact) + out/fonts/ + out/local.html (local test page)
FONT_BASE="../fonts/" OUT=<gh-pages clone>/show-case/index.html node build.mjs   # the GitHub Pages page
```

The engine is imported from `web/src/watch.js`; the page's own code is `src/main.js` (state, the panel helpers, tabs,
framing, export; `VERSION` near the top), `src/bar.js` (Dial Tool's bottom bar, ported) and `src/extra.css` (what is
specific to this page, laid over Dial Tool's stylesheet). `look.mjs` takes a screenshot of `local.html` served from
`out/` on port 8765; `gh.mjs` checks the gh-pages copy on port 8766 (loads the page, makes a PNG export). The bar's
"Bar Inter" is packed from `/usr/share/fonts/opentype/inter/Inter-Regular.otf` when installed, otherwise from Barlow.
To publish the artifact, publish `out/dial-show-case.html`; the dial fonts go up once as supporting files under `fonts/`.

## Open, on Okay's word only

- Add every dial used in testing to the Gallery on main, once each: one design, one Gallery dial ("don't do yet, note").
- The Dial tab will get **Materials and finishing**: enamel, sunburst, paint… (21 Oct 2026, note only).
- Folding the Playbox in: "thinkable but not today".
- The source lives on `dev` since 22 Oct 2026 (the branch `show-case-app` is retired); the page stays after the merge, built from `watch.js` (Okay, 22 Oct 2026).
