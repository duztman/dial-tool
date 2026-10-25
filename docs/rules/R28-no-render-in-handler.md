# R28 · Nothing renders inside a control's handler

Handlers change settings and call `render()`, which only asks for a frame (`requestAnimationFrame`); `frame()` draws, at most once per display frame.

Back to the index: [rules.md](../rules.md)
