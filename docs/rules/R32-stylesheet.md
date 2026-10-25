# R32 · The web version's stylesheet

The web version's stylesheet is the folder `web/src/css/`, one file per part, joined by `build.mjs` in the order of their names. Each file is one cascade layer, and the layers come in this order: tokens · base · controls · panel (files 4a–4h: frame, lines and tabs, rows, hands, colour, rings, fonts, gallery) · **chosen** (what is switched on, picked or open is ink with paper words — one rule for every control, in a layer of its own so nothing earlier can undo it) · preview · bar · narrow.

- A value (colour, size, measure) is written once, as a token in `:root`, and used by name; a new value is a new token with a comment saying what it is.
- **Every space is a step of the unit** (`--u1` half a unit … `--u8` four units; `--unit` itself; `--air`); a line is `--hair`, `--thick` or `--triple`; pure white and black are `--white` and `--black`; hex is written short where it can be.
- A rule goes in the layer of the part it styles and never undoes another part's rule; no `!important`; no negative margin to escape a padding, and no exception (Okay, 14 Oct 2026: "lock it down").
- A plain `button` has no look: its class says what kind it is; a tab (`.tab`) draws itself in two clipped layers and cuts its own top corners.
- A control smaller than a row's height goes into the *reach* rule (controls layer), so a finger can press it from just outside its edge.
- **A hover look stands under `@media (hover: hover)`**, every one (a tap on an iPad would leave it on the control it last touched); a state that must show without a pointer (`[aria-expanded]`, `:focus-within`, `:active`) is written beside it, not inside it.

The parts of this rule with a page of their own: type sizes [R32a](R32a-type-sizes.md); the specials block [R32b](R32b-specials.md); the look-check [R32c](R32c-look-check.md). How the panel's parts are laid out (a framed thing, a heading with controls, a number row's tracks) is design canon: `docs/design.md` §10.

**Checked by:** `node test/same.mjs` (the look-check, R32c); a read of the diff for a bare number

Back to the index: [rules.md](../rules.md)
