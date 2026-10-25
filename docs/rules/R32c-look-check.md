# R32c · The look-check

A change to the stylesheet that must not change the look — a token, the layer order, a file moved — is proved with the look-check, `web/test/same.mjs`: save the look before the change (`node test/same.mjs save`), compare after (`node test/same.mjs`). It reads the computed style of every element in 563 states, three screens at once, in about two minutes, and prints every difference. No difference, the change is proved; a difference is either the intended one, named in the commit, or a bug.

**Checked by:** it is the check

Back to the index: [rules.md](../rules.md)
