# R7 · Every setting has a starting value

**Every setting has a starting value** in one of four places. `DEFAULTS`: the dial, hands, date, output and interface, with prefixed keys — `dial_`/`margin` · `c_` colour · `ha_` hands · `da_` date · `out_` output · `ui_` interface · `gd_` guides · `sh_` shadows · `w_` the watch in show mode (with `c_metal`, `c_nato`, `c_insert`, `c_backdrop2`, `out_watch_px`: in the file and the session, never in a link, R31). `RING_BASE`: every key a ring can have; every ring carries all of them, so changing a ring's kind keeps its settings. `HAND_BASE`: one hand's keys. `WINDOW_BASE`: one window's. Keys inside a ring, a hand or a window have no prefix.

**Checked by:** `test/linktrip.mjs` (every key has a starting value and a link code)

Back to the index: [rules.md](../rules.md)
