# R30 · The web version

**The web version** (`web/`) is the tool. **`archive/drawbot/dial.py` is frozen** (Okay, 12 Oct 2026: "Do not work on dial.py anymore, we're on github"): it is not edited, and new settings keys go into `web/src/geometry.js` only. The keys the two share keep their names (R8), so an old settings file still opens in both; a key only the web version knows is ignored by `dial.py`. The web version builds to **one file** with nothing fetched at run time; its two engines are pinned in `web/package.json` (PathKit — Skia's shape combining; HarfBuzz — text). The parity test (`web/test/parity.py`) still compares the shared geometry with `dial.py`; a web-only feature is outside it — numerals rings since 4.91 (#488), left out on both sides.

**Checked by:** `test/parity.py`

Back to the index: [rules.md](../rules.md)
