# R32b · The specials block

Special places happen (Okay, 16 Oct 2026: "r32 is fine"; special places "may happen sometimes"). A value may leave the unit scale, or a part leave R32, only as a **special**: a named token in one labelled block of `1-tokens.css` (`/* specials */`), with Okay's words and the date beside it, used by name — never a bare number in a rule. `!important` and negative margins stay banned: there is no special for them.

The block stands at the end of `:root` in `1-tokens.css` (#290), in two groups: the ones Okay asked for, each with his words, and the ones found off the scale with no figure from him (#294). The grid's own measures (`--margin`, `--eye`, `--gap`, `--col`) and the sizes of things are not specials. The block is looked through at each release (how many, still wanted?); the layout check (#188) will read it, so anything off the scale that is not in it fails.

**Checked by:** the layout check (#188) reads the block

Back to the index: [rules.md](../rules.md)
