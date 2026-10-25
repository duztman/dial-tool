# R26 · One scene

Export and every preview draw from `scene()` (`geometry.js`). The only differences allowed are preview-only: guides, backdrop, the canvas's guides in screen points, **shadows** (`draw_shadows()` in `guides.js`, from the scene's items), **X-ray** (the windows' discs whole, in a stack by depth with the selected one on top, each layer fainter than the one above; and the discs' dashed edges), a **case** round the dial and its **strap** or bracelet (`watch.js`; in edit mode the view fits the dial, never the case; in **show mode** the whole watch, `show.js`, and Fit fits the case), and the **Tiny Preview**'s window (drawn from an export). None of them reaches a file (R5).

**Checked by:** `test/parity.py`; the window test

Back to the index: [rules.md](../rules.md)
