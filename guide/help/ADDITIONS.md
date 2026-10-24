# Help page — additions, waiting

*Started 24 Oct 2026. Okay: "Keep them inside a text doc, we'll check when full." Nothing here is on the page yet. Each line names where in the code it was read (`web/src/app.js` unless said), so it can be checked before it moves to `index.html`. Written against beta 4.92.7.*

## Keyboard

Not while typing in a field, on a slider or in a menu, nor with ⌘, Ctrl or ⌥ held, nor with a dialog open (keydown handler, ~line 1272).

| Keys | Does |
|---|---|
| ← · → | Time back or on by a minute |
| ⇧ ← · ⇧ → | By an hour |
| Space | Play or pause time |
| G | Guides on or off |
| H | Hands on or off |
| S | Shadows on or off |
| X | X-ray on or off (when the switch is there) |
| E | The dial alone; closes Compare if it is open |
| ⌘Z | Undo (Ctrl on Windows) |
| ⇧⌘Z · ⌘Y | Redo |
| In a number field: ↑ · ↓ | One step; with ⇧, ten |
| In a field: Enter · Esc | Take the value · cancel |
| Esc | Closes any open menu or pop-up |
| On a menu: Space · Enter · ↑ · ↓ | Opens the tool's own list; the arrows walk it |

Sources: `KEYS` (~line 333), the time handler (~1272), undo (~1291), number fields (~2969), menus (~1236, ~1936).

## Typing values

- `1.2` sets · `+0.5` adds · `x0.5` multiplies · `/2` divides (`parse_number`, ~line 1017).
- A length field takes a unit after the number: `12pt`, `0.5in`, `+1mm`, `3cm`, `20lig`, `40thou`; it is turned into the unit the field shows. Storage stays mm.
- A comma works as a decimal point; `×` works as `x`.

## Intricacies

- **Fine sliders.** Hold a slider with a mouse or pen and move away from its track, up or down: the farther, the finer, down to a twentieth (`FINE`, ~line 337; #406).
- **A finger opens the controller** instead of dragging a slider (R15; changed in 4.92.5–4.92.7 — describe it once it settles).
- **The preview:** scroll zooms, right-drag moves, two fingers pinch and move; the lens beside − + FIT says so.
- **The drawer on a phone:** drag its grip to make it taller or shorter ("Drawer height").
- **The ring list** shows five rows before it scrolls; its pill makes it taller or shorter (`RING_ROWS`, #256).
- **A text ring's angle snaps** to a position within 2° (`SNAP_DEG`, #297).
- **Now** turns the big hands once, opposite ways, and lands them (`SPIN_MS`).
- **Tiny preview:** the dial at its own size, bottom right; put it away with its close button.
- **Versions** keeps nine dials in this browser; Compare lays them side by side, packed.
- **Guides' chevron:** which rings and windows show guides, and their colours.
- **Shadows' chevron:** the light, and how high each part stands.
- **Export log** says what each export wrote, including the thinnest line.
- **Show mode remembers** itself: a session closed in show mode opens there.
- **Settings file vs link:** a link carries only what differs from the start and may stop working when the tool changes (R31); a settings file keeps every value and keeps opening.

To check before moving: the Tiny preview's wording, the Versions count (nine, 4.90 changelog), Compare's place.

## Simple examples (from the Gallery, so each is a link that opens it)

Each as: what it is · the rings, top first · the one setting that makes it.

- **First dial** — the starting dial; Dial › Reset brings it back.
- **B-Uhr, type B** — a pilot's dial: an outer minute track with numerals every five, an inner hour ring. Shows: two numerals rings at different radii.
- **Diver, bezel as rings** — the bezel drawn as rings on the dial. Shows: bands and Give way.
- **Montgomery** — a railroad minute track: two thin bands as rails, ticks between. Shows: *railroad = ticks between two bands*.
- **Day and date** — two windows. Shows: Windows, Follows the date, Names.
- **Dress, am · pm** — an am · pm window. Shows: Jumps.
- **Moon phase** — a moon window and stars.

To do: read each Gallery entry's settings (`web/gallery.mjs`) and write its line from them, not from its name; confirm which Gallery names are dials and which are ring names inside them.

## Bug reports

See the decision with Okay, 24 Oct 2026: a form on the site, name required, maybe a beta tester code. Not on the page until built.
