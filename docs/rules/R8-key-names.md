# R8 · Never rename a setting key

**Never rename a setting key** without a migration: settings files and the last session use these names. `from_beta1()` converts beta 1.0 settings; `fresh_settings()` runs it. A key nothing reads any more stays in `DEFAULTS` with a comment, so an old file still opens.

**Checked by:** `test/linktrip.mjs` (the key table)

Back to the index: [rules.md](../rules.md)
