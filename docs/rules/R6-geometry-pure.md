# R6 · Geometry is a function of settings

`geometry.js` (settings, geometry, drawing) never touches the window and never reads the clock; it takes the settings `S` and returns shapes. The window tells it the day (`set_today()`, from `sync_time()`), so a dial that follows the date draws today's in the window and one fixed day in a test. That is what makes it testable without a window (`web/test/parity.py`, `labels.mjs`, `linktrip.mjs`).

**Checked by:** `test/parity.py`; the window test (the preview adds nothing the files lack)

Back to the index: [rules.md](../rules.md)
