# Dial Tool — changelog

## beta 1.0 · 4 Oct 2026

First version as a project. Own window replaces DrawBot's `Variable()` panel.

- **Window:** section switcher (Dial · Track · Markers · Type · Numerals · Hands · Date · Export); live preview keeps zoom; time slider, Now, Play, Fit.
- **Number controls:** label · slider · typed field · stepper; typed shorthand `+`, `x`, `/`; typing past a slider's range extends it.
- **Markers:** bar, wedge (taper), dot, SVG; rounded outer/inner tips (true fillets); hollow wall for any shape; show-at; 12 o'clock style, scale, gap.
- **Fixed:** dots in one-ring mode (were silently turned into bars); double 12 had no gap control.
- **Type:** any installed font (family → style → named instance); language; size; tracking in 1/1000 em; variable axes as sliders; OpenType features as a checkbox list with designer names.
- **Numerals:** on-path placement keeps real kerning and one baseline; per-numeral nudge in the interface.
- **Hands:** proportions, seconds hand with counterweight, motion (sweep / quartz / 6 / 8 beats per second), SVG hands.
- **Date:** rounded aperture with frame; print kept clear of the hole.
- **Export:** PDF, SVG, PNG (dpi), MP4, GIF; production mask; mirror; save/load settings; last session restored; error log.
- **Tools:** `dial_probe.py` (interface foundation test), `test_harness.py` (off-Mac geometry renders).

## probe · 4 Oct 2026

`tools/dial_probe.py`. All checks passed on Okay's Mac (DrawBot 3.132): GridView forms, private drawing engine, 690 font families, feature lists, live outline render ≈ 50 ms. Found: vanilla Tabs collapse around auto-layout content.

## v0 · 3 Oct 2026

Single script with DrawBot's `Variable()` slider panel: track, markers, numerals (upright / radial / auto-flip / on path), parametric hands, date window, production and mirror modes, PDF/SVG/MP4 export. Limits that led to beta 1.0: no typed numbers, no sections, no font picker, fixed panel width.
