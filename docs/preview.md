# Dial Tool — the preview: findings and the plan

*Written 4 Oct 2026, after beta 2.2. Research only so far: nothing in `dial.py` has changed yet.*
*Okay's answers, 4 Oct 03:30: **skia-pathops yes**, **Canvas first**. §4 step 6 is part of the run.*

**How to use this file.** §2 is what we found, with evidence. §3 is the design. §4–§6 are the
build steps, the off-Mac tests and the Mac check. **§7 is the run**: when Okay says
*"run the preview plan"*, an agent follows §7 from top to bottom and hands over a new version.
§8 lists risks with their fallbacks, §9 the rule changes, §10 the questions still open (each has
a default, so the run never stalls on them).

---

## 1 · Summary

Okay's three complaints about the preview (4 Oct): **flashing**, **lag while dragging**,
**blur while zooming**. All three come from *how* the preview is shown, not from the dial's
geometry being big:

- The preview is a PDF reader. Every change writes a whole new PDF and swaps it into DrawBot's
  `DrawView` (Apple's `PDFView`). Swapping documents flashes; zooming shows a stretched picture
  until the gesture ends; every step pays for a PDF round trip.
- Shape combining (knockouts, cuts, unions) in DrawBot runs on `booleanOperations`, which is
  **2–14× slower** than the library the harness uses (§2.4). That is the biggest part of the lag
  on heavy rings.

The fix keeps DrawBot and adds nothing that has to be installed:

1. **One scene.** A function in part 3 lists what to draw, bottom to top. Export (through
   DrawBot) and the preview both read it, so they can't drift apart.
2. **Canvas.** The preview draws that list with Core Animation shape layers: one layer per plate,
   ring, date part and hand. Hands turn by rotating their layer; colours and guides change a
   property; zoom transforms the whole tree, which macOS redraws sharp at every step.
3. **Frame clock.** Controls only mark what changed; a clock tied to the display redraws at most
   once per frame. Dragging stays responsive, and Play keeps running while a slider is held.
4. **The PDF preview stays** as a switch (Canvas · PDF): a fallback if the canvas fails, and the
   reference to compare against. That switch *is* the Mac probe — no separate probe script.
5. **skia-pathops** for shape combining (Okay: yes, 4 Oct), installed once per Mac through
   DrawBot's own package menu. Without it, the tool still works — just slower.

---

## 2 · Findings

### 2.1 What the preview does today (beta 2.2)

From `dial.py` and DrawBot 3.132's source:

1. A control changes a setting → `DialTool.set_value()` → `render()`, synchronously, inside the
   control's callback.
2. `render()` rebuilds the geometry if `static_dirty` (`build_static`, per-ring memory `memo()`),
   then `self.D.newDrawing()` + `draw_page(...)` records every path into DrawBot's private engine.
3. `self.D.pdfImage()` replays that recording into a **new PDF context** and returns a parsed
   `PDFDocument` (`drawBotDrawingTools.py`, `pdfImage()` → `DrawBotContext().getNSPDFDocument()`).
4. `_show_pdf()` hands it to `DrawView.setPDFDocument()` → `PDFView.setDocument_()`
   (`drawBot/ui/drawView.py`), then restores zoom and scroll by hand.
5. Play: an `NSTimer` at 30 Hz (`scheduledTimerWithTimeInterval_repeats_block_`) calls `render()`
   — the whole chain above, 30 times a second, to turn three hands.

The geometry itself is small: 300–1,700 path segments per dial (harness variants, counted
4 Oct); building the hands takes 0.3–1 ms.

### 2.2 Flashing

- **Cause:** `PDFView.setDocument_` drops the old document and lays out and renders the new one;
  the view shows its background in between.
- **Evidence:** the same report on Apple's developer forum (thread 763408): calling
  `layoutDocumentView()` after `setDocument` reduces the flash but does not remove it; no fix given.
- **Fix:** Core Animation commits a group of changes as one atomic update ("a mechanism for
  grouping multiple layer-tree operations into atomic updates", Apple, `CATransaction`). A shape
  swapped inside one transaction replaces the old one in the same frame. Core Animation's
  implicit 0.25 s animation must be switched off for these changes
  (`CATransaction.setDisableActions_(True)`), or every edit would morph.

### 2.3 Blur while zooming

- **Cause:** `PDFView` is a scroll view. During a pinch, AppKit scales the content it already drew
  and redraws sharply only when the gesture ends (WWDC 2013 session 215, "Optimizing Drawing and
  Scrolling on OS X": "during the overdraw, it will scale that content" … "we'll go ahead and
  redraw the visible rect when the gesture ends"). PDFKit adds its own tiled, delayed rendering.
- **Fix:** zoom by changing the transform of our own layer tree. Apple, `CAShapeLayer`: the shape
  "will be mapped into screen space before being rasterized to preserve resolution independence"
  wherever possible — so it is re-rasterized at every zoom step.
- **Not** `NSScrollView`'s built-in magnification: it is the same mechanism that blurs today.
  Self-drawing views inside it also show tiling seams when zoomed on current macOS (Apple forum
  thread 663536).

### 2.4 Lag while dragging

Three causes, stacked:

1. **Shape combining — the biggest.** DrawBot 3.132's `BezierPath.union / difference /
   removeOverlap / xor` call `booleanOperations` (pyclipper plus curve fitting in Python;
   `drawBot/context/baseContext.py`, lines 710–760). The harness runs the same `dial.py` geometry
   on drawbot-skia, whose shape combining is `skia-pathops` (C++). Measured with
   `tools/bool_bench.py` — cold builds of every harness dial, shape memory cleared, median of 3,
   off-Mac (Linux, Python 3.13), 4 Oct 2026:

   | dial | skia-pathops | booleanOperations | slower by |
   |---|---|---|---|
   | default | 7 ms | 12 ms | 1.8× |
   | dots-one-ring | 12 ms | 30 ms | 2.6× |
   | rounded-wedge | 8 ms | 16 ms | 2.0× |
   | knockout-date | 105 ms | 450 ms | 4.3× |
   | words-on-path | 28 ms | 72 ms | 2.6× |
   | production-mirror | 22 ms | 63 ms | 2.9× |
   | sector-dial | 8 ms | 15 ms | 1.9× |
   | scale-arc | 62 ms | 901 ms | 14.4× |
   | file-shapes | 12 ms | 32 ms | 2.7× |

   These are relative numbers; the Intel Mac is probably slower than the test machine. During a
   drag, beta 2's memory (`memo()`) rebuilds only the ring being edited and the rings that skip or
   knock out round it — but a knockout ring or the dial diameter still rebuilds a lot.
   `dial.py` has 25 shape-combining calls (`grep -n "\.difference(\|\.union(\|\.removeOverlap(\|\.xor("`).
2. **The PDF round trip** (§2.1 steps 2–4). Not yet timed on the Mac; the switch in §3.5 measures it.
3. **No coalescing.** Every slider event runs the full chain before the next event is handled.

### 2.5 Side bug: Play stops while a control is held

`scheduledTimerWithTimeInterval_repeats_block_` schedules the timer in the run loop's *default*
mode. While a slider is dragged, AppKit runs the loop in *event-tracking* mode, so the timer
doesn't fire (cocoa-dev, Oct 2002: add the timer to `NSEventTrackingRunLoopMode`, or to
`NSRunLoopCommonModes`, which includes it). Fixed for free by the frame clock (§3.4).

### 2.6 Machines and macOS

- Okay's machines (4 Oct): an Intel Mac with integrated graphics on macOS 15.3, and an Apple Silicon
  M4 Mac, which can only run macOS 15 or later. **Both are on macOS 15**, so APIs from macOS 14
  are safe — with a fallback anyway (R17).
- macOS 14 APIs this plan uses: `NSBezierPath.CGPath` (path → Core Graphics path; Apple docs,
  macOS 14.0+) and `NSView.displayLinkWithTarget:selector:` (display-synced clock; macOS 14.0+).
- Test the canvas on the **Intel** Mac first: it has the weakest graphics.

### 2.7 Ruled out, and why

| Option | Why not |
|---|---|
| Tidy `DrawView` (no page shadow, swap the page instead of the document) | Might soften the flash; can't fix blur during zoom or the PDF round trip. Still a document viewer. |
| `NSScrollView` magnification over the canvas | Same stretch-then-redraw mechanism that blurs now (§2.3). |
| Merz (RoboFont's Core Animation wrapper) | Same idea, proven in RoboFont 4 ("rendering speed will enormously benefit"; no blur at 500 % zoom). Not public: no repo on GitHub under robotools/typesupply/typemytype, not on PyPI (checked 4 Oct). Like ezui (brief §8). |
| Browser / web view preview | Parked (brief §8): DrawBot was chosen for type. |
| Bitmap in an image view | Blurs when zoomed; redraw at each zoom step = PDFView's problem again. |
| Geometry on a background thread | Shape combining is mostly Python: the interpreter lock means no real gain, plus thread-safety risk with Cocoa. |
| CoreGraphics drawing (`drawRect_`) as the canvas | Kept as **contingency** (§8, risk 1): same rasterizer as the PDF, but everything is redrawn every frame and it needs its own view class. Use it only if shape layers look worse than the PDF. |

### 2.8 Facts checked in source (4 Oct)

- DrawBot 3.132 is still the latest release (tags in `typemytype/drawbot`; master has commits to
  May 2026, no new tag). Python 3.12. PyObjC unpinned in `requirements.txt` (bundled at build).
- `drawBot.context.baseContext.BezierPath`: `getNSBezierPath()` (public) and `_getCGPath()`
  (private, unchanged since 2020) — two ways to get a Core Graphics path.
- DrawBot fills with `CGContextFillPath` = non-zero winding (`pdfContext.py` lines 115, 125).
  `CAShapeLayer`'s default `fillRule` is non-zero too, so fills match.
- vanilla 0.5.0: `vanilla.vanillaBase.VanillaCallbackWrapper` (an `NSObject` with an `action:`
  method that calls a Python function) — usable as the target for a display link.
  `Group` builds its view through `getNSSubclass(nsViewClass)`, which makes and caches a `V…`
  subclass once per process — that is how `DrawView` sets its own view class (`nsViewClass =
  DrawBotPDFView`), and it survives ⌘R.
- PyObjC refuses to define an Objective-C class whose name already exists in the process
  ("X is overriding existing Objective-C class", RoboFont forum). `dial.py` already handles this
  for `DialToolFlippedView` (R24): `objc.lookUpClass(name)` first, define only if missing.
- DrawBot 3.132's package menu (Python → Install Python Packages, `drawBot/pipInstaller.py`) runs
  `pip install --upgrade --target <DrawBot's folder>` and adds that folder to `sys.path`.
  `skia-pathops` 0.9.2 has a `cp310-abi3-macosx_10_9_universal2` wheel: runs on Python 3.12,
  Intel and Apple Silicon.

---

## 3 · Design

```
settings S ──build_static──▶ static (memo per ring)
                                  │
                         scene(S, static, t, …)        part 3 · DRAWING (no interface, R6)
                                  │
              ┌───────────────────┴───────────────────┐
         draw_page(D, …)                        Canvas.show(items)       part 4 · INTERFACE
     DrawBot: export + PDF preview         Core Animation layers (preview)
```

### 3.1 One scene (part 3)

Add to part 3, above `draw_page`:

```python
def scene(S, static, t, preview=True, selected=None):
    """what to draw, bottom to top. Export and both previews read this list (R26)."""
```

Each item is a dict:

| key | meaning |
|---|---|
| `role` | `"date disc"`, `"date number"`, `"plate"`, `"ring"`, `"date frame"`, `"cutline"`, `"hand"`, `"cap"`, `"guide"` |
| `path` | a `BezierPath` in mm. For a hand: **upright** (pointing at 12, pivot at the origin) — the very object `hand_shape(h)` returns, so its identity only changes when the hand's settings change |
| `fill` | RGBA list, or `None` for guides |
| `angle` | clock angle (R2) for hands; `0` otherwise |
| `stroke`, `width` | guides only: RGBA and width in mm (as `draw_page` uses today: 0.03, selected 0.05) |
| `ring` | for `"ring"` items: the entry from `static["rings"]` (draw_page needs it for live text) |
| `name` | for hands: `"hour"`, `"minute"`, `"second"` |

Order and content follow `draw_page` exactly as it is in beta 2.2:

- **Production** (`S["out_production"]`): rings, date frame, cutline — all fill `[0, 0, 0, 1]`;
  no plate, no hands. Guides are still added in a production *preview*, as today.
- **Otherwise:** date disc `[1, 1, 1, 1]` + date number (`da_ink`) if there is a date; plate
  (`c_plate`); rings bottom first (`static["rings"][::-1]`, fill `ring["c"]`); date frame
  (`da_ink`); hands if `ha_on` (from `HANDS` / `hand_shape` / `hand_angles`, same as
  `build_hands`); the cap (`c_cap`) if `ha_cap > 0`.
- **Guides** (only if `preview and S["guides"]`, never exported — R5): the dial edge and date
  radius circles, the two axis lines (blue `0, .55, .9, .5`, 0.03), then each visible ring's
  edges (blue `.35` alpha, or orange `1, .45, 0, .95` at 0.05 for `selected`).

Then **`draw_page` draws from the scene**: page, backdrop rect (preview, not production),
`translate`, `scale(MM)`, mirror — unchanged; then for each item: fill + `drawPath`; a hand is
`item["path"].copy()` rotated by `-angle` (exactly what `build_hands` does now); guides with
stroke. The **live-text** export branch stays where it is: when `live` is on, `"date number"`
and numerals `"ring"` items are drawn with `live_text` / `numerals_live` instead of their path
(same conditions as today). `build_hands` stays (other code and the harness may call it) but is
built on the same helper.

**Done when:** `tools/test_harness.py` renders are pixel-identical to the renders made before the
change (§5.1), and `tools/ui_smoke.py` passes.

### 3.2 Canvas (part 4)

**The view class.** One small `NSView` subclass that only forwards events to Python; all logic
lives in ordinary Python on the `Canvas` object, so the class never needs to change.

```python
CanvasView = None
if HAVE_UI:
    try:
        CanvasView = objc.lookUpClass("DialToolCanvasView1")      # made by an earlier run (⌘R again, R24)
    except objc.nosuchclass_error:
        try:
            class DialToolCanvasView1(AppKit.NSView):
                """the canvas's view: passes gestures and size changes on to its Canvas (R27)."""
                def acceptsFirstResponder(self):
                    return True
                def scrollWheel_(self, event):
                    self._pass("scrolled", event)
                def magnifyWithEvent_(self, event):
                    self._pass("magnified", event)
                def setFrameSize_(self, size):
                    objc.super(DialToolCanvasView1, self).setFrameSize_(size)
                    self._pass("resized", None)
                def viewDidChangeBackingProperties(self):
                    self._pass("rescaled", None)
                @objc.python_method
                def _pass(self, name, event):
                    try:
                        owner = self.vanillaWrapper()                # set by vanilla's V… subclass
                        if owner is not None:
                            getattr(owner, name)(event)
                    except Exception:
                        print(traceback.format_exc())
            CanvasView = DialToolCanvasView1
        except Exception as e:
            note(f"no canvas view class ({e}); PDF preview only")
```

- The name ends in `1`. If the forwarding contract ever changes (a new event), use
  `DialToolCanvasView2` — an old run's class can't be redefined (R27).
- `vanillaWrapper()` exists because vanilla builds instances through `getNSSubclass` (§2.8).

**The vanilla wrapper.** Same pattern as DrawBot's `DrawView`:

```python
class Canvas(Group):
    nsViewClass = CanvasView
```

It owns: the layer tree, the zoom state, the slots (one per scene item), and the four event
methods `scrolled`, `magnified`, `resized`, `rescaled`. Store it on the tool
(`self.w.canvas2` or similar) — vanilla keeps attributes of the window alive (R22).

**Layer tree** (built once in `Canvas.__init__`):

```
view (layer-hosting)                setLayer_(host) THEN setWantsLayer_(True) — this order makes it hosting
└─ host     CALayer                 backgroundColor = backdrop (white in production)
   └─ dial  CALayer                 bounds (0,0,0,0); position = centre c; affineTransform = scale(±z, z)
      ├─ slot 0  CAShapeLayer       bounds (0,0,0,0), position (0,0): its path is in mm
      ├─ slot 1  CAShapeLayer
      └─ …                          one per scene item, same order
```

- A layer-hosting view must not get subviews. Put nothing else inside the `Canvas` group.
- `contentsScale` of every layer = `window.backingScaleFactor()` (and again in `rescaled`).
- Children sit at the dial layer's anchor, so mm `(0, 0)` = dial centre, y up (AppKit doesn't flip
  a layer-hosting view's layers). A hand slot rotates about its position = the pivot:
  `setAffineTransform_(CGAffineTransformMakeRotation(-radians(angle)))` (R2: clockwise).
- **Mirror** (`out_mirror`): x scale `-z` instead of `z` on the dial layer.

**Updating** (`Canvas.show(items, S, playing)`), inside one transaction:

```python
CATransaction.begin()
CATransaction.setDisableActions_(True)            # no implicit 0.25 s morphs
... add/remove slots to match len(items); for each slot i:
    if item["path"] is not slot.source:          # same object = same shape (memo)
        slot.layer.setPath_(cg_path(item["path"])); slot.source = item["path"]
    fill / stroke / lineWidth / hidden / rotation only if changed
CATransaction.commit()
```

- `cg_path(p)`: `p.getNSBezierPath().CGPath()` on macOS 14+, else `p._getCGPath()` (DrawBot,
  private) — log once which one is used.
- Colours: `Quartz.CGColorCreateSRGB(r, g, b, a)` (settings colours are sRGB, see `from_ns`).
- Guides: `fillColor` None, `strokeColor` the item's colour, and `lineWidth = px / z` so they
  stay 1 screen point (selected: 1.5) at every zoom — re-set when `z` changes. Guides are
  preview-only (R5), so this deliberate difference from `draw_page` never reaches an export.
- Ring identity is by position in the list: reordering rings just reassigns paths.

**Zoom and pan** — state: `z` = screen points per mm, `c` = where the dial centre sits in view
points, `fitted` = True until Okay zooms or pans. Pure functions (so the smoke test can check them):

```python
def fit_zoom(view_w, view_h, S):    return min(view_w, view_h) / (S["dial_d"] + 2 * S["margin"])
def zoom_about(z, c, p, k, lo, hi): # point p stays under the cursor
    k = min(max(z * k, lo), hi) / z
    return z * k, (p[0] + (c[0] - p[0]) * k, p[1] + (c[1] - p[1]) * k)
```

- **Pinch** (`magnified`): `k = 1 + event.magnification()`; `p = view.convertPoint_fromView_(event.locationInWindow(), None)`.
- **Two-finger scroll** (`scrolled`): pan `c += (dx, -dy)` with `dx, dy = event.scrollingDeltaX(), event.scrollingDeltaY()`;
  if `not event.hasPreciseScrollingDeltas()` (a mouse wheel) multiply by 10. Verify the direction
  on the Mac (§6 step 7): one sign flip if it feels backwards.
- **⌘ + scroll** zooms about the cursor: `k = exp(dy * 0.01)` (`modifierFlags() & NSEventModifierFlagCommand`).
- Limits: `lo = fit / 4`, `hi = 400` points per mm.
- **Fit** button: `fitted = True`; `z = fit_zoom(...)`, `c` = view centre.
- **resized**: if `fitted`, refit; else shift `c` by half the size change (the dial stays put).
- Zoom and pan live in Python, so redraws never reset them (build list #5 becomes trivially true).

### 3.3 Frame clock (part 4)

One clock drives every redraw, for both previews.

```python
self.clock_target = VanillaCallbackWrapper(self._frame)        # keep it (R22)
link = view.displayLinkWithTarget_selector_(self.clock_target, "action:")     # macOS 14+
link.addToRunLoop_forMode_(AppKit.NSRunLoop.mainRunLoop(), AppKit.NSRunLoopCommonModes)
```

- Fallback (R17): `AppKit.NSTimer.timerWithTimeInterval_repeats_block_(1 / 60, True, block)` added
  with `NSRunLoop.mainRunLoop().addTimer_forMode_(timer, NSRunLoopCommonModes)`. Log which clock runs.
- `render()` keeps its name and every call site: it now only sets `self.pending = True` and
  unpauses the clock. The `static_dirty` flag already says whether geometry must be rebuilt.
- `_frame(sender)`:
  1. If playing: `S["t"] = start_t + (now − start_wall)`, `_sync_time()`, `pending = True`.
  2. If not pending: pause the clock unless playing; return.
  3. `pending = False`; rebuild if `static_dirty` (time it: *build ms*).
  4. Canvas: `items = scene(...)`; `canvas.show(items, S, playing)`.
     PDF: today's body — `newDrawing`, `draw_page`, `_show_pdf(pdfImage())`.
  5. Status line: `canvas · build 34 ms · frame 3 ms` (or `pdf · …`); `NOTES` → log; `_autosave()`.
- `_play` starts/stops by setting a flag and unpausing — no own timer. `_tick` goes.
- `_closed`: `link.invalidate()` (or the timer), clock target released.
- Errors inside `_frame` go to the log (`guard`), and must not kill the clock.
- Effect: a slider callback costs only a flag; the frame does the work with the latest value.
  Heavy rebuilds still take their time (§2.4), but the slider itself stays live.

### 3.4 What triggers what

| Change | Work in the next frame |
|---|---|
| time slider, Now, Play | hands' rotations only (canvas); full redraw (PDF) |
| colours, backdrop, guides, selected ring | fills / strokes / hidden only |
| any geometry setting (`static_dirty`) | rebuild changed rings (memo), new paths for changed slots |
| a hand's settings (`ha_…`) | that hand's path (new `hand_shape` object) |
| production, mirror | scene changes / dial transform |
| zoom, pan, resize | dial layer transform + guide widths |

### 3.5 Canvas · PDF switch

- New setting `ui_preview` (R7: `ui_` prefix; R9: index) in `DEFAULTS`: `0` = Canvas, `1` = PDF.
  Default **0 = Canvas** (Okay, 4 Oct).
- A segmented control `Canvas | PDF` in the bar under the preview, next to Guides
  (shrink the time slider by ~120 points). Switching shows one view, hides the other, sets `pending`.
- Both views exist from the start (`DrawView` and `Canvas` at the same position).
- If the canvas can't be built (no view class, any exception): log the reason, force `ui_preview = 1`
  for this session, disable the Canvas segment (R17).
- `Fit` works on whichever is showing (PDF: `setAutoScales_(True)` as now).

### 3.6 Faster shape combining (skia-pathops) — Okay: yes (4 Oct)

- Okay installs it once **on each Mac**: DrawBot → menu **Python → Install Python Packages** → *Install / Upgrade*,
  type `skia-pathops`, **Go!**. Check in a DrawBot script: `import pathops; print(pathops.__version__)` → `0.9.2` or newer.
- In `dial.py` part 1, where `BezierPath` is imported, and **only in the DrawBot branch** (the
  harness already runs on pathops):

```python
try:
    import pathops
    class BezierPath(BezierPath):                         # DrawBot's path, faster shape combining
        """same as DrawBot's BezierPath; union/difference/xor/removeOverlap through skia-pathops."""
        def _ops(self):
            p = pathops.Path(); self.drawToPen(p.getPen()); return p
        def _back(self, p):
            out = self.__class__(); p.draw(out); return out
        def union(self, other):      return self._back(pathops.op(self._ops(), other._ops(), pathops.PathOp.UNION))
        def difference(self, other): return self._back(pathops.op(self._ops(), other._ops(), pathops.PathOp.DIFFERENCE))
        def xor(self, other):        return self._back(pathops.op(self._ops(), other._ops(), pathops.PathOp.XOR))
        def removeOverlap(self):
            self.setNSBezierPath(self._back(pathops.simplify(self._ops())).getNSBezierPath()); return self
    SHAPE_ENGINE = "skia-pathops"
except ImportError:
    SHAPE_ENGINE = "booleanOperations (DrawBot)"
```

- Checked in DrawBot 3.132's source (4 Oct): `copy()` builds `self.__class__()`, so copies keep
  the subclass; the operators `% | & ^` call the methods above; `BezierPath` is a `BasePen`, so
  `p.draw(out)` works. Caveat: `copyContextProperties` walks `self.__class__.__bases__`, so a
  subclass copies only the first mixin's context properties — `dial.py` sets none, so nothing is
  lost; don't start using them on paths without checking. `intersection` isn't used by `dial.py`;
  add it the same way if it ever is. Log `SHAPE_ENGINE` at launch.
- Bonus: the Mac then combines shapes with the same library as the harness, so off-Mac renders
  and Mac renders agree more closely.
- Without it, nothing changes: heavy rings stay slow, but the frame clock keeps the slider live.

---

## 4 · Build steps

Each step ends with its test and a commit to `dev`. Stop rule: R20.

| # | Step | Touches | Done when |
|---|---|---|---|
| 0 | Baseline: `git pull`; harness renders copied aside (§5.1); `ui_smoke.py` passes; note `VERSION` | — | baseline saved |
| 1 | `scene()` in part 3; `draw_page` reads it (§3.1) | part 3 | harness pixel-identical; smoke passes |
| 2 | Frame clock (§3.3) with the **PDF preview only**; `render()` → request; Play on the clock | part 4 | smoke passes (with clock stand-in, §5.2); Play-while-dragging bug gone by construction |
| 3 | `DialToolCanvasView1` + `Canvas` + layer tree + `show()` (§3.2) | part 4 | smoke: canvas slots follow the scene (§5.2) |
| 4 | Zoom/pan + Fit + resize (§3.2) | part 4 | smoke: `zoom_about` keeps the point under the cursor; fit math |
| 5 | `ui_preview` switch + fallback (§3.5) | parts 1, 4 | smoke: switch both ways; forced fallback path logs and still renders |
| 6 | skia-pathops subclass (§3.6) — Okay said yes | part 1 | harness unchanged (it doesn't use this branch); smoke passes |
| 7 | Launch log lines (§6 step 1) | part 4 | smoke shows them in the log |
| 8 | Docs + guide (§7 step 6) | docs | R25: `make_guide.py` reports 5 pages |

---

## 5 · Tests off-Mac

### 5.1 Harness: pixel-identical before and after `scene()`

```bash
python tools/test_harness.py && mkdir -p /tmp/before && cp test-renders/*.png /tmp/before/
# … make the change …
python tools/test_harness.py
python - <<'EOF'
from PIL import Image, ImageChops; import glob, os
bad = [f for f in glob.glob("/tmp/before/*.png")
       if ImageChops.difference(Image.open(f).convert("RGBA"),
            Image.open("test-renders/" + os.path.basename(f)).convert("RGBA")).getbbox()]
print("identical" if not bad else f"DIFFERENT: {bad}")
EOF
```

Look at `test-renders/sheet.png` too (R19).

### 5.2 Smoke test: new stand-ins and checks (`tools/ui_smoke.py`)

The fake `Quartz` module is empty today; the canvas needs:

- `Quartz` → a module whose missing attributes return an `NS()` stand-in (module `__getattr__`),
  so `CAShapeLayer.layer()`, `CATransaction.begin()`, `CGColorCreateSRGB(...)`,
  `CGAffineTransformMakeRotation(...)` all work.
- `objc` → add `super` (returns an object whose methods do nothing) and `python_method`
  (returns the function unchanged). `lookUpClass` keeps raising, so the class gets defined.
- `AppKit` → add `NSRunLoop`, `NSRunLoopCommonModes`, `NSEventModifierFlagCommand`,
  `NSTimer.timerWithTimeInterval_repeats_block_`.
- `vanilla.vanillaBase` → `VanillaCallbackWrapper` (the existing `Target` stand-in fits).
- The view's `displayLinkWithTarget_selector_` returns a stand-in link with `addToRunLoop_forMode_`,
  `setPaused_`, `invalidate`.
- **Drive the clock:** after every simulated click, call `tool._frame(None)` (a frame never runs by
  itself off-Mac). Put that in the smoke's click helper so every existing step gets a frame.

New checks:

1. After each step, the canvas's slot roles equal `[i["role"] for i in scene(...)]`, and each
   slot's `source` is the item's `path` object.
2. Time change only: no slot gets a new path; hand slots get new rotations.
3. `zoom_about`: for random `z, c, p, k`, the mm point under `p` is the same before and after;
   limits respected. `fit_zoom` for 30 mm + 3 mm margins in a 600 × 600 view = 600 / 36.
4. Switch `ui_preview` 0 → 1 → 0; force canvas failure (make `CanvasView` None) → log line, PDF works.
5. ⌘R twice (`start()` twice): no error, one window.
6. The existing checks (R22 callback check, every ring kind, export, presets) still pass.

### 5.3 Shape-combining speed

`python tools/bool_bench.py` — reruns §2.4's table. Add new harness dials there automatically.

---

## 6 · Mac check (the probe, built into the release)

Okay runs the new version and sends **screenshots + the Export log + the status line numbers**.

1. **Launch.** The Export log should list: `preview: canvas` (or the reason it fell back),
   `clock: display link` (or `timer`), `paths: CGPath (macOS 14+)` (or `DrawBot`),
   `shape combining: …`, and `all controls connected`.
2. **Flashing.** Drag a ring's radius slider. Canvas: no flash. Switch to PDF and repeat to compare.
3. **Lag.** Drag the dial diameter, then a knockout ring's clearance. Note the status line's
   *build* and *frame* ms in both modes.
4. **Blur.** Pinch-zoom to ~10× on the track. Canvas: sharp during the pinch. PDF: blurry until release.
5. **Truth.** At Fit and at ~8×, switch Canvas ↔ PDF on the finest ticks (0.12 mm) and the numerals.
   They should look the same. Screenshot both if they don't.
6. **Play.** Press Play, then drag any slider: the hands keep moving. Try sweep, 6 and 8 beats/s.
7. **Gestures.** Two-finger pan moves the dial *with* the fingers; ⌘-scroll zooms about the
   cursor; Fit recentres; resizing the window keeps the dial in place.
8. **Modes.** Production and Mirror show correctly on the canvas; hidden rings disappear.
9. **⌘R twice:** no error in DrawBot's output; one window.
10. **Export** a PDF and compare with the same dial exported by beta 2.2 in Illustrator: identical
    (export didn't change).

**Decisions from the check:**
- All good → merge to `main` (with Okay's word), build list items → done.
- Step 5 shows the canvas drawing worse than the PDF → contingency (§8 risk 1).
- Canvas broken on a Mac → `ui_preview` default becomes PDF (one line); report; R20.
- Step 3 still slow on heavy rings → check the launch log says `shape combining: skia-pathops`; if it says booleanOperations, the install didn't reach that Mac.

---

## 7 · Run — when Okay says "run the preview plan"

1. **Sync.** `git fetch`; work on `dev` at its tip. Read README → rules → brief → glossary →
   build list → this file. Read `git log` since 4 Oct for changes to `render`, `_show_pdf`,
   `draw_page`, `build_hands`, `_play`, `_tick` — adapt §3 to them, don't overwrite them.
2. **Coordinate.** If another agent's work on `dev` touches the same functions and isn't committed,
   stop and ask Okay which goes first. Don't run two edits of `dial.py` in parallel.
3. **Answers.** Check §10 for Okay's answers (or the conversation). No answer → use the defaults.
4. **Build.** §4 steps 0–7, testing as in §5 after each, one commit per step
   (`preview: …`). Check every vanilla call against `tools/vanilla-0.5.0-api.json` and every
   DrawBot call against DrawBot 3.132's source (R13).
5. **Version.** `VERSION` = the next free number after what's on `dev` (e.g. `beta 2.3`);
   window title follows it.
6. **Docs** (plain, dated, for agents):
   - `docs/changelog.md`: new section — the three fixes, the switch, the clock, gestures, the
     side bug, skia-pathops if used.
   - `docs/brief.md` §4: decision row "Preview drawn by Core Animation from one scene; PDF preview
     kept as a switch" (and skia-pathops if used); remove §5 item 9 if settled.
   - `docs/build-list.md`: #37–#41 → verify; #5 and #6 updated; #14 updated.
   - `docs/rules.md`: add R26–R28 (§9).
   - `docs/glossary.md`: the terms already added on 4 Oct — check they still match the code.
   - Guidebook (R25): `docs/guide/guide.md` — preview switch, pinch / two-finger pan / ⌘-scroll,
     Fit; `python tools/make_guide.py` → 5 pages.
   - This file: mark steps done, record anything that differed from the plan.
7. **Hand over.** Push `dev`. Tell Okay in a few lines what changed and give him §6 as the
   checklist. `main` only after his check.

---

## 8 · Risks

| # | Risk | How we'd notice | Fallback |
|---|---|---|---|
| 1 | Shape layers rasterize fine lines differently from the PDF (Apple: "may favor speed over accuracy" where segments cross) | §6 step 5 | Contingency: draw the same scene with Core Graphics in a layer with a drawing delegate (needs a second small class, `DialToolCanvasDrawer1`); everything redrawn per frame. Only if Okay sees a difference that matters. |
| 2 | Re-rasterizing every layer during a pinch stutters on Intel integrated graphics | §6 step 4 | Fewer layers: merge all static rings into one path per colour while zooming. |
| 3 | Layer-hosting view geometry flipped or offset | §6 steps 1–2 (dial upside down or off-centre) | Set `geometryFlipped` on `host` accordingly; one line. |
| 4 | Scroll direction backwards | §6 step 7 | Flip the sign of `dy`. |
| 5 | `displayLink…` or `CGPath` missing on some macOS | launch log | NSTimer in common modes; DrawBot's `_getCGPath()`. |
| 6 | Hiding a ring rebuilds others (it changes who skips / knocks out) | expected | Correct behaviour; memo keeps it cheap. |
| 7 | Smoke test can't see Cocoa | always | That's what §6 is for (R19 + Mac check). |
| 8 | skia-pathops output differs slightly from booleanOperations (contour starts, curve splits) | export compared in Illustrator | Same areas; harness already uses it. Uninstall to go back. |
| 9 | Another agent edits the same functions | `git log` in §7 step 1 | §7 step 2: ask Okay. |

---

## 9 · Rule changes

- **R13** — reworded 4 Oct (already in `rules.md`): APIs that ship with DrawBot 3.132 — vanilla
  0.5.0, DrawBot, and Apple frameworks through its PyObjC; macOS 14+ APIs allowed with a fallback.
- **R26 · One scene.** *(add when §4 step 1 lands)* Export and every preview draw from `scene()`.
  Preview-only extras (guides, backdrop, guide line widths in screen points) are the only allowed
  difference, and never reach an export (R5).
- **R27 · Our own Cocoa classes** *(add when §4 step 3 lands)*: one name per contract, ending in a
  number (`DialToolCanvasView1`); looked up with `objc.lookUpClass` before defining (generalises
  R24's pattern); they only forward to Python. Change the contract → new number.
- **R28 · Nothing renders inside a control's callback.** *(add when §4 step 2 lands)* Callbacks
  change settings and call `render()`, which only requests a frame; the frame clock draws.

---

## 10 · Questions for Okay (defaults in brackets)

1. ~~**skia-pathops**~~ — **yes** (Okay, 4 Oct 03:30). Step 6 runs; Okay installs it on each Mac.
2. ~~**Which preview at first launch**~~ — **Canvas** (Okay, 4 Oct 03:30).
3. **Display**: Retina or not? Changes how fine lines look in any preview, not the plan. [not needed to run]
4. **Worst lag**: which slider? Helps judge step 3 of §6. [not needed to run]

---

## 11 · Sources

- Apple forum — PDFView flashes when setting a new document: https://developer.apple.com/forums/thread/763408
- WWDC 2013 session 215 (magnification scales drawn content until the gesture ends): https://nonstrict.eu/wwdcindex/wwdc2013/215/
- Apple — CAShapeLayer: https://developer.apple.com/documentation/quartzcore/cashapelayer
- Apple — CATransaction: https://developer.apple.com/documentation/quartzcore/catransaction
- Apple — NSView `displayLink(target:selector:)`, macOS 14+: https://developer.apple.com/documentation/appkit/nsview/displaylink(target:selector:)
- Apple — NSBezierPath `cgPath`, macOS 14+: https://developer.apple.com/documentation/appkit/nsbezierpath/cgpath
- Apple — NSScrollView (magnification API): https://developer.apple.com/documentation/appkit/nsscrollview
- Apple forum — tiling seams when zooming self-drawing views: https://developer.apple.com/forums/thread/663536
- cocoa-dev — timers don't fire while a slider is dragged: https://lists.apple.com/archives/cocoa-dev/2002/Oct/msg00491.html
- RoboFont forum — "overriding existing Objective-C class": https://forum.robofont.com/post/2198
- RoboFont — Merz (Core Animation instead of procedural drawing): https://doc.robofont.com/documentation/topics/merz
- DrawBot forum — the preview "only shows the pdf": https://forum.drawbot.com/post/412 · animation needs an own NSView: https://forum.drawbot.com/post/899
- DrawBot 3.132 source: https://github.com/typemytype/drawbot/tree/3.132 (`drawBot/ui/drawView.py`, `drawBot/context/baseContext.py`, `drawBot/context/pdfContext.py`, `drawBot/drawBotDrawingTools.py`, `drawBot/pipInstaller.py`, `requirements.txt`, `CHANGELOG.md`)
- vanilla 0.5.0 source (PyPI `cocoa-vanilla` 0.5.0): `vanillaBase.py` (`VanillaCallbackWrapper`, `_setupView`), `nsSubclasses.py` (`getNSSubclass`), `vanillaGroup.py`, `vanillaScrollView.py`
- skia-pathops on PyPI (0.9.2, universal2 abi3 wheel): https://pypi.org/project/skia-pathops/
- Measurements: `tools/bool_bench.py` (this repo), 4 Oct 2026
