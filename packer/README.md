# Dial Packer

A side product of the Dial Tool (Okay, 19 Oct 2026: "Ship as a side product. Dial packer for visuals."). It packs discs of three sizes densely on a page, for visuals such as the guide's cover, where each disc will later hold a dial. Discs only for now: placing dials in them comes later, on Okay's word.

**Use it:** <https://duztman.github.io/dial-tool/packer/>, or open `dial-packer.html` from disk (one file; it fetches only the Inter web font).

## Files

| File | What it is |
|---|---|
| `dial-packer.html` | **The tool, built**: one file. Built by `node packer/build.mjs`; committed. |
| `src/page.html` | The window: controls, drawing the page as SVG, colours, Copy SVG / Copy layout. Marks `/*PACK*/` … where the scripts go. |
| `src/pack.js` | **Grow**: discs start small and scattered, push apart, grow together until they jam. Also: Big to centre, Smallest to corners, Touch each side, keeping the large discs off the sides. |
| `src/even.js` | **Even gaps**: springs between neighbours that want the same white. Also the page's measures (white between neighbours, biggest hole). |
| `src/voronoi.js` | **Voronoi** (the default): each disc moves to the middle of its cell, measured from disc edges; the page edge is a neighbour that wants no white, so discs along it touch it. |
| `src/colour.js` | Palette colours: Random (balanced, neighbours apart) or Centre → edge (like a gradient map); vividness sort; the colour mosaic's lighter steps (OKLCH, same chroma). |
| `build.mjs` | Joins the five into `dial-packer.html`. |

All sizes are in millimetres (R1). Same settings and seed always give the same page.

## How it came to be (19 Oct 2026, one session)

Asked as a cover sketch for the guidebook ("many different dials, dense packing with 3 sizes, about 30 dials on a page"), then built up in Okay's steps: other packings with "as equal as possible white space" → Voronoi, circles in the centre of cells, bleed 0, the page edges tangent to discs, a Generate button → big to the centre, smalls to the outside → palette colours, random or bright-to-centre "like a gradient map", add and remove colours → mosaics: sizes within brackets, lighter steps of a colour at the same chroma, the picked colour the darkest, each on its own switch → smallest (and lightest) to the corners, a few discs touching every side → medium and small mixed round the large ones; the large never touching a side; every label at the Medium size → shipped here.

Tried and dropped: filling from the page edge inward ("start from the outside borders"): the border row took ~20 of 30 discs and left the large ones in a hole (49 mm) in the middle; letting the cells decide which discs touch the edge gave the tangent edges without that.

## Change it

Edit `src/`, run `node packer/build.mjs`, open `dial-packer.html`. To put it online: copy `dial-packer.html` to `packer/index.html` on the `gh-pages` branch and push.
