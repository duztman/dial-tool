# R23 · Imported files (SVG, PDF, AI)

**Imported files (SVG, PDF, AI)** — the web version reads an SVG through one door, `read_logo` in `web/src/logo.js` (build list #173, one mechanism for every place an SVG can go); its first place is the logo (#609), which takes one solid colour only, joins everything into one shape and refuses a second colour, a gradient, a picture and live text, saying which. A marker's, a hand's and a moon's SVG are not built. For those: drawn pointing up (12 o'clock); the artboard's centre is the anchor — a hand's pivot, a marker's centre. Only the first page counts. Fills are ink; plain white fills cut; strokes become outlines (R4); clipping is ignored; text, images and gradients are skipped and reported in the Export log.

Back to the index: [rules.md](../rules.md)
