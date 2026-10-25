# R25 · The guide follows the app

**The guide follows the app** (`guide/`, by `guide/PLAN.md`). Its pictures are made by script from the current app, never drawn; every "do X and Y happens" sentence has a scripted check that must pass. **It is rebuilt only when Okay asks** (`bash guide/make.sh`; Okay, 16 Oct 2026: "decouple the guide creation from each build, it's hand generated every once in a while by triggered me"): an app release does not touch it, and the live guide names the version it was made on; the picture diff then shows what changed since the last guide. Never type a value into the guide that a picture or a check doesn't use. Page design follows `guide/notes-okay.md` and the design canon (R29).

Back to the index: [rules.md](../rules.md)
