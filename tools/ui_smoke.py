"""
ui_smoke.py — run dial.py's whole interface without a Mac.

Stand-ins replace vanilla, AppKit, Quartz (Core Animation layers included)
and DrawBot's window parts, then the script clicks through every section,
ring kind, page, hand and button. The frame clock is driven by hand: after
every click one display frame runs, and the canvas's layers are compared
with the scene they should show.

The vanilla stand-ins accept exactly what vanilla 0.5.0 accepts: class
signatures and method names come from tools/vanilla-0.5.0-api.json, which
was extracted from vanilla's source (the version DrawBot 3.132 bundles).
Like the real thing, a control held only by a GridView loses its callback
(R22), popups drop repeated titles, and lists report selection changes.

It catches: wrong keyword arguments, methods vanilla doesn't have, layout
rules naming missing views, lost callbacks, and any error the interface
logs. It can't show layout or appearance — that still needs the Mac.

Setup: the harness's packages (pip install drawbot-skia skia-pathops pillow)
Use:   python tools/ui_smoke.py
"""

import builtins, gc, json, math, os, random, re, sys, tempfile, time, traceback, types, weakref

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import test_harness                                         # drawbot-skia + expandStroke, test font, test SVGs
import drawbot_skia.drawbot as SKIA_DB
from drawbot_skia.path import BezierPath

API = json.load(open(os.path.join(HERE, "vanilla-0.5.0-api.json")))
CLASSES, DIALOGS = API["classes"], API["dialogs"]
PROBLEMS = []


def problem(message):
    if message not in PROBLEMS:
        PROBLEMS.append(message)
        print("PROBLEM ", message)


def lineage(name):
    seen, order, todo = set(), [], [name]
    while todo:
        n = todo.pop(0)
        if n in seen or n not in CLASSES:
            continue
        seen.add(n)
        order.append(n)
        todo += CLASSES[n]["bases"]
    return order

def methods_of(name):
    return {m for n in lineage(name) for m in CLASSES[n]["methods"]}

def init_of(name):
    return next(CLASSES[n]["init"] for n in lineage(name) if CLASSES[n]["init"])

def check_call(name, args, kwargs):
    init = init_of(name)
    params = init["args"]
    if len(args) > len(params) and not init["varargs"]:
        problem(f"{name}(): {len(args)} positional arguments, vanilla takes {len(params)}")
    for k in kwargs:
        if k not in params and k not in init["kwonly"] and not init["kwargs"]:
            problem(f"{name}(): vanilla 0.5.0 has no keyword {k!r}")
    given = set(params[:len(args)]) | set(kwargs)
    for p in params[:len(params) - init["defaults"]]:
        if p not in given:
            problem(f"{name}(): missing {p!r}")
    return dict(zip(params, args), **kwargs)


# ── Cocoa stand-ins ──────────────────────────────────────────

class NS:
    """any Cocoa object we don't model: every call works and returns another stand-in."""
    def __init__(self, **kw):
        self.__dict__.update(kw)
    def __getattr__(self, name):
        if name.startswith("__"):
            raise AttributeError(name)
        return lambda *a, **k: NS()
    def __iter__(self):
        return iter([])

OBJC_CLASSES = {}                                                   # one process: classes outlive a ⌘R

class NSView(NS):
    def __init_subclass__(cls, **kw):
        super().__init_subclass__(**kw)
        if cls.__name__.startswith("DialTool"):                     # dial.py's own Cocoa classes (R27)
            if cls.__name__ in OBJC_CLASSES:
                raise RuntimeError(f"{cls.__name__} is overriding existing Objective-C class")
            OBJC_CLASSES[cls.__name__] = cls
    @classmethod
    def alloc(cls):
        return cls()
    def initWithFrame_(self, frame):
        return self
    def __init__(self, wrapper=None):
        self._wrapper = weakref.ref(wrapper) if wrapper is not None else (lambda: None)
        self._subviews, self._target, self._action, self._clicked = [], (lambda: None), None, -1
        self._size, self._layer, self._hidden = (900.0, 700.0), None, False
    def bounds(self):
        return NS(size=NS(width=self._size[0], height=self._size[1]))
    def setLayer_(self, layer):
        self._layer = layer
    def setHidden_(self, hidden):
        self._hidden = bool(hidden)
    def convertPoint_fromView_(self, point, view):
        return point
    def window(self):
        return NS(backingScaleFactor=lambda: 2.0)
    def sim_resize(self, w, h):
        self._size = (float(w), float(h))
        self.setFrameSize_(NS(width=w, height=h))
    def subviews(self):
        return list(self._subviews)
    def vanillaWrapper(self):
        return self._wrapper()
    def className(self):
        w = self._wrapper()
        return type(w).__name__ if w is not None else "dead control"

class NSControl(NSView):
    def action(self):
        return self._action
    def target(self):
        return self._target()                                       # Cocoa doesn't retain targets
    def selectedSegment(self):
        return self._clicked

class Target:                                                       # vanilla's VanillaCallbackWrapper
    def __init__(self, callback):
        self.callback = callback

class Color:
    def __init__(self, *c):
        self.c = list(c)
    def CGColor(self):
        return tuple(self.c)
    def colorUsingColorSpace_(self, space):
        return self
    def redComponent(self): return self.c[0]
    def greenComponent(self): return self.c[1]
    def blueComponent(self): return self.c[2]
    def alphaComponent(self): return self.c[3]

COMMON_MODES = "kCFRunLoopCommonModes"                              # also runs while a control is held
DISPLAY_LINK = [True]                                               # False: pretend macOS 13 (no display links)

class Timer:                                                        # NSTimer made with timerWith…: not scheduled yet
    def __init__(self, block):
        self.block, self.valid, self.modes = block, True, []
    def invalidate(self):
        self.valid = False

class Link:                                                         # CADisplayLink
    def __init__(self, target):
        self.target, self.paused, self.valid, self.modes = target, False, True, []
    def addToRunLoop_forMode_(self, loop, mode):
        self.modes.append(mode)
    def setPaused_(self, paused):
        self.paused = bool(paused)
    def invalidate(self):
        self.valid = False

class Layer:
    """CALayer / CAShapeLayer: remembers what was set, counts the sets, and insists that
    every change happens inside a transaction with animations off."""
    log = []                                                        # (layer, property) for every set
    def __init__(self):
        self.sublayers, self.parent = [], None
        self.props = {"FillColor": (0, 0, 0, 1)}                    # a new CAShapeLayer fills black
    @classmethod
    def layer(cls):
        return cls()
    def addSublayer_(self, layer):
        self.sublayers.append(layer)
        layer.parent = self
    def removeFromSuperlayer(self):
        self.parent.sublayers.remove(self)
        self.parent = None
    def __getattr__(self, name):
        if name.startswith("set") and name.endswith("_"):
            def setter(value, prop=name[3:-1]):
                if self.parent is not None and not Transaction.quiet():
                    problem(f"layer {prop} changed outside a no-animation transaction: it would fade in")
                self.props[prop] = value
                Layer.log.append((self, prop))
            return setter
        raise AttributeError(name)

class Transaction:                                                  # CATransaction
    stack = []
    @classmethod
    def begin(cls):
        cls.stack.append(False)
    @classmethod
    def setDisableActions_(cls, on):
        cls.stack[-1] = bool(on)
    @classmethod
    def commit(cls):
        cls.stack.pop()
    @classmethod
    def quiet(cls):
        return bool(cls.stack) and cls.stack[-1]

CG_PATH = [True]                                                    # False: pretend macOS 13 (no NSBezierPath.CGPath)

class CGPath:
    def __init__(self, path, route):
        self.path, self.route = path, route

class NSBezierPath:
    def __init__(self, path):
        self.path = path
    def CGPath(self):
        if not CG_PATH[0]:
            raise AttributeError("CGPath")
        return CGPath(self.path, "CGPath")

def cg_bounding_box(cgpath):
    x0, y0, x1, y1 = cgpath.path.bounds()
    return NS(size=NS(width=x1 - x0, height=y1 - y0))

BezierPath.getNSBezierPath = lambda self: NSBezierPath(self)       # DrawBot's BezierPath has these three
BezierPath.setNSBezierPath = lambda self, ns_path: setattr(self, "path", ns_path.path.path)
BezierPath._getCGPath = lambda self: CGPath(self, "DrawBot")

class Event:                                                        # NSEvent: a scroll or a pinch at a point
    def __init__(self, at=(0, 0), dx=0, dy=0, precise=True, command=False, magnification=0):
        self.at, self.dx, self.dy, self.precise = at, dx, dy, precise
        self.command, self.mag = command, magnification
    def locationInWindow(self): return NS(x=self.at[0], y=self.at[1])
    def scrollingDeltaX(self): return self.dx
    def scrollingDeltaY(self): return self.dy
    def hasPreciseScrollingDeltas(self): return self.precise
    def modifierFlags(self): return COMMAND if self.command else 0
    def magnification(self): return self.mag

COMMAND = 1 << 20

class RunLoop:
    def addTimer_forMode_(self, timer, mode):
        timer.modes.append(mode)

class NSWindow(NS):
    def displayLinkWithTarget_selector_(self, target, selector):
        if not DISPLAY_LINK[0]:
            raise AttributeError("displayLinkWithTarget_selector_")
        if selector != "action:" or not isinstance(target, Target):
            problem(f"display link: target {target!r} / selector {selector!r} can't be called")
        return Link(target)

def drive(frames=1):
    """let the frame clock tick, as the display would. A sleeping or unscheduled clock doesn't tick."""
    tool = getattr(builtins, "_dial_tool", None)
    clock = getattr(tool, "clock", None)
    if clock is None:
        return
    for _ in range(frames):
        link, timer = clock.link, clock.timer
        if link is not None and link.valid and not link.paused and COMMON_MODES in link.modes:
            link.target.callback(link)
        elif timer is not None and timer.valid and COMMON_MODES in timer.modes:
            timer.block(timer)
    if tool.ready and tool.pending:
        problem("a redraw was asked for, but the next frame didn't draw it (clock asleep or not scheduled?)")
    if tool.ready and tool.mode() == 0:
        for message in check_canvas(tool):
            problem(message)

DIAL = {}                                                           # dial.py's namespace, once loaded

def check_canvas(tool):
    """the canvas's layers must show exactly the scene (R26): same order, shapes, colours, angles.
    → the differences found."""
    found = []
    problem = found.append
    S, canvas = tool.S, tool.canvas
    items = DIAL["scene"](S, tool.static, S["t"], True, S["ui_ring"])
    layers = canvas.dial.sublayers
    if not (len(items) == len(canvas.slots) == len(layers)) or any(s.layer is not l for s, l in zip(canvas.slots, layers)):
        return [f"canvas: {len(items)} scene items, {len(canvas.slots)} slots, {len(layers)} layers"]
    if [s.role for s in canvas.slots] != [i["role"] for i in items]:
        problem("canvas: slot roles differ from the scene's")
    for n, (item, slot) in enumerate(zip(items, canvas.slots)):
        got, what = slot.layer.props, f"canvas slot {n} ({item['role']})"
        shown = got.get("Path")
        if "key" in item:
            a, b = shown.path.bounds(), item["path"].bounds()
            if slot.key != item["key"] or a is None or max(abs(x - y) for x, y in zip(a, b)) > 1e-6:
                problem(f"{what}: shows another shape than the scene's")
        elif shown is None or shown.path is not slot.source:
            problem(f"{what}: its layer doesn't show the slot's path")
        elif slot.source is not item["path"] and slot.source.bounds() != item["path"].bounds():
            problem(f"{what}: its layer doesn't show the scene's path")   # (an equal shape rebuilt after the
                                                                          # shape memory emptied is fine)
        if got.get("FillColor") != (tuple(item["fill"]) if item["fill"] else None):
            problem(f"{what}: fill {got.get('FillColor')} isn't {item['fill']}")
        stroke = item.get("stroke")
        if got.get("StrokeColor") != (tuple(stroke) if stroke else None):
            problem(f"{what}: stroke {got.get('StrokeColor')} isn't {stroke}")
        if stroke and abs(got.get("LineWidth", 0) * canvas.z - item["px"]) > 1e-9:
            problem(f"{what}: guide isn't {item['px']} screen point(s) wide")
        want = ("rotate", -math.radians(item["angle"])) if item["angle"] else None
        turn = got.get("AffineTransform")
        if (turn if turn != ("rotate", -0.0) and turn != ("rotate", 0.0) else None) != want:
            problem(f"{what}: turned {turn}, should be {want}")
    mirror = -1 if S["out_mirror"] else 1
    if canvas.dial.props.get("AffineTransform") != ("scale", mirror * canvas.z, canvas.z) \
            or canvas.dial.props.get("Position") != canvas.c:
        problem("canvas: the dial layer isn't at the canvas's zoom, centre and mirror")
    backdrop = (1, 1, 1, 1) if S["out_production"] else tuple(S["c_backdrop"])
    if canvas.host.props.get("BackgroundColor") != backdrop:
        problem("canvas: backdrop colour not shown")
    return found

FONTS = {"Helvetica Neue": [["HelveticaNeue", "Regular"], ["HelveticaNeue-Bold", "Bold"]],
         "Skia": [["Skia-Regular", "Regular"], ["Skia-Regular_Bold", "Bold"]],
         ".SF NS": [["SFNS", "Regular"]]}

def fake_module(name, **attrs):
    m = types.ModuleType(name)
    m.__dict__.update(attrs)
    m.__getattr__ = lambda attr: NS()
    sys.modules[name] = m
    return m


# ── vanilla stand-ins ────────────────────────────────────────

class V:
    """base for vanilla stand-ins; checks every call against vanilla 0.5.0."""
    ns_class = NSControl
    def __init__(self, *args, **kwargs):
        object.__setattr__(self, "_kw", check_call(self._vanilla_name(), args, kwargs))
        view_class = getattr(type(self), "nsViewClass", None) or self.ns_class   # as vanilla's Group does
        object.__setattr__(self, "_nsObject", view_class(self))
        callback = self._kw.get("callback")
        if callback is not None:
            object.__setattr__(self, "_target", Target(callback))   # held by the Python object only
            self._nsObject._target = weakref.ref(self._target)
            self._nsObject._action = "action:"
        object.__setattr__(self, "_shown", True)
        self.setup()

    def setup(self):
        pass

    @classmethod
    def _vanilla_name(cls):
        """the vanilla class this is, or is built on (dial.py's Canvas is a Group)."""
        return next(c.__name__ for c in cls.__mro__ if c.__name__ in CLASSES)

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        cls = self._vanilla_name()
        if name in methods_of(cls):
            return lambda *a, **k: NS()
        raise AttributeError(f"vanilla 0.5.0 {cls} has no {name!r}")

    def __setattr__(self, name, value):
        object.__setattr__(self, name, value)
        if isinstance(value, (V, DrawView)) and not name.startswith("_"):
            self._nsObject._subviews.append(value._nsObject)

    def show(self, on):
        object.__setattr__(self, "_shown", bool(on))
        self._nsObject._hidden = not on

    def addAutoPosSizeRules(self, rules, metrics=None):
        for rule in rules:
            for name in re.findall(r"\[(\w+)", rule):
                if not hasattr(self, name) or not isinstance(getattr(self, name), (V, DrawView)):
                    problem(f"layout rule {rule!r} names {name!r}, which isn't in this group")

    def sim_fire(self, sender=None):
        target = self._nsObject.target()
        if target is None:
            problem(f"{type(self).__name__} '{self._kw.get('title', self._kw.get('text', ''))}' "
                    "ignores clicks: its callback is gone (R22)")
            return
        target.callback(self if sender is None else sender)
        drive()                                                     # the next display frame

class Value(V):
    key = "value"
    def setup(self):
        object.__setattr__(self, "_value", self._kw.get(self.key))
    def get(self):
        return self._value
    def set(self, v):
        object.__setattr__(self, "_value", v)

class TextBox(Value):
    key = "text"
    def getNSTextField(self):
        return self._nsObject

class EditText(TextBox):
    pass

class TextEditor(TextBox):
    pass

class Slider(Value):
    def setMinValue(self, v):
        self._kw["minValue"] = v
    def setMaxValue(self, v):
        self._kw["maxValue"] = v
    def set(self, v):
        lo, hi = self._kw.get("minValue", 0), self._kw.get("maxValue", 100)
        object.__setattr__(self, "_value", min(max(v, lo), hi))     # NSSlider clamps

class Stepper(Value):
    pass

class CheckBox(Value):
    def setup(self):
        object.__setattr__(self, "_value", bool(self._kw.get("value", False)))

class ColorWell(Value):
    key = "color"

class Button(V):
    def setTitle(self, title):
        self._kw["title"] = title

class ComboBox(Value):
    def setup(self):
        object.__setattr__(self, "_value", "")
    def getNSComboBox(self):
        return self._nsObject

class PopUpButton(V):
    def setup(self):
        object.__setattr__(self, "_items", [])
        object.__setattr__(self, "_index", 0)
        self.setItems(self._kw.get("items", []))
    def setItems(self, items):
        menu = []
        for t in items:                                              # Cocoa: a repeated title replaces the earlier item
            if t in menu:
                menu.remove(t)
            menu.append(t)
        object.__setattr__(self, "_items", menu)
        object.__setattr__(self, "_index", 0 if menu else -1)
    def getItems(self):
        return list(self._items)
    def get(self):
        return self._index
    def set(self, i):
        if not 0 <= i < len(self._items):
            problem(f"PopUpButton.set({i}) but it has {len(self._items)} items {self._items[:6]}")
            return
        object.__setattr__(self, "_index", i)
    def getItem(self):
        return self._items[self._index] if self._index >= 0 else None
    def getNSPopUpButton(self):
        return self._nsObject
    def sim_pick(self, i):
        self.set(i)
        self.sim_fire()

class SegmentedButton(V):
    def setup(self):
        object.__setattr__(self, "_count", len(self._kw["segmentDescriptions"]))
        object.__setattr__(self, "_index", -1)
        self._nsObject.segmentCount = lambda: self._count
    def get(self):
        return self._index if self._index >= 0 else None
    def set(self, i):
        if not 0 <= i < self._count:
            problem(f"SegmentedButton.set({i}) but it has {self._count} segments")
        object.__setattr__(self, "_index", i)
    def getNSSegmentedButton(self):
        return self._nsObject
    def sim_click(self, i):
        if self._kw.get("selectionStyle", "one") != "momentary":
            self.set(i)
        self._nsObject._clicked = i
        self.sim_fire()
        self._nsObject._clicked = -1

class List(V):
    ns_class = NSView
    def setup(self):
        object.__setattr__(self, "_items", [dict(x) for x in self._kw.get("items", [])])
        object.__setattr__(self, "_sel", [0] if self._items else [])
    def _changed_selection(self):
        cb = self._kw.get("selectionCallback")
        if cb:
            cb(self)
    def _edited(self):
        cb = self._kw.get("editCallback")
        if cb:
            cb(self)
    def set(self, items):
        object.__setattr__(self, "_items", [dict(x) for x in items])
        self._edited()                                               # vanilla's KVO observer fires on new content
        if any(i >= len(self._items) for i in self._sel) or (not self._sel and self._items):
            object.__setattr__(self, "_sel", [0] if self._items else [])
            self._changed_selection()
    def get(self):
        return self._items
    def getSelection(self):
        return list(self._sel)
    def setSelection(self, sel):
        for i in sel:
            if not 0 <= i < len(self._items):
                problem(f"List.setSelection({sel}) but it has {len(self._items)} items")
                return
        if sel != self._sel:
            object.__setattr__(self, "_sel", list(sel))
            self._changed_selection()
    def sim_select(self, i):
        self.setSelection([i])
        drive()
    def sim_edit(self, i, key, value):
        self._items[i][key] = value
        self._edited()
        drive()

class Group(V):
    ns_class = NSView
    def getNSView(self):
        return self._nsObject

class ScrollView(V):
    ns_class = NSView
    def setup(self):
        doc = self._kw["nsView"]
        self._nsObject._subviews.append(doc)
        object.__setattr__(self, "_doc", doc)
    def getNSScrollView(self):
        return NS(contentView=lambda: NS(), documentView=lambda: self._doc, setBorderType_=lambda b: None)

class Window(Group):
    def setup(self):
        object.__setattr__(self, "_events", {})
        object.__setattr__(self, "_nsWindow", NSWindow())
    def open(self):
        pass
    def bind(self, event, callback):
        self._events.setdefault(event, []).append(callback)
    def close(self):
        for cb in self._events.get("close", []):
            cb(self)
    def getNSWindow(self):
        return self._nsWindow

class GridRow(NS):
    def __init__(self, cells):
        self.cells, self.hidden = cells, False
    def numberOfCells(self):
        return len(self.cells)
    def cellAtIndex_(self, i):
        return NS(contentView=lambda v=self.cells[i]: v)
    def setHidden_(self, h):
        self.hidden = h

class NSGridView(NSView):
    def __init__(self, wrapper):
        super().__init__(wrapper)
        self.rows = []
    def numberOfRows(self):
        return len(self.rows)
    def rowAtIndex_(self, i):
        if not 0 <= i < len(self.rows):
            problem(f"grid row {i} doesn't exist ({len(self.rows)} rows)")
            return GridRow([])
        return self.rows[i]
    def removeRowAtIndex_(self, i):
        self.rows.pop(i)
    def subviews(self):
        return [c for r in self.rows for c in r.cells if c is not None]

class GridView(V):
    ns_class = NSGridView
    def setup(self):
        for row in self._kw["contents"]:
            self.appendRow(row["cells"] if isinstance(row, dict) else row)
        self._kw["contents"] = None                                 # vanilla doesn't keep them either
    def _ns(self, cell):                                             # keeps the Cocoa view only, like vanilla
        view = cell["view"] if isinstance(cell, dict) else cell
        if isinstance(view, (V, DrawView)):
            return view._nsObject
        return None
    def appendRow(self, cells, rowHeight=None, rowPadding=None, rowPlacement=None, rowAlignment=None):
        self._nsObject.rows.append(GridRow([self._ns(c) for c in cells]))
    def showRow(self, index, value):
        self._nsObject.rowAtIndex_(index).setHidden_(not value)
    def getRowCount(self):
        return len(self._nsObject.rows)
    def getNSGridView(self):
        return self._nsObject

def CheckBoxListCell(title=None):
    return NS()

class DrawView:                                                      # drawBot.ui.drawView.DrawView
    def __init__(self, posSize):
        self._nsObject = NSView(self)
        self.pdf, self.count = None, 0
    def setPDFDocument(self, pdf):
        self.pdf = pdf
        self.count += 1
    def show(self, on):
        self._nsObject._hidden = not on
    def getNSView(self):
        return NS(autoScales=lambda: True)

for _cls in (TextBox, EditText, TextEditor, Slider, Stepper, CheckBox, ColorWell, Button, ComboBox,
             PopUpButton, SegmentedButton, List, Group, ScrollView, Window, GridView):  # stand-ins may only add real methods
    for _m in vars(_cls):
        if not _m.startswith(("_", "sim_")) and _m not in ("setup", "key", "ns_class") \
                and _m not in methods_of(_cls.__name__):
            problem(f"stand-in {_cls.__name__}.{_m} isn't a vanilla 0.5.0 method")

ANSWERS = {"getFile": [], "putFile": []}

def dialog(name):
    def fn(*args, **kwargs):
        params = DIALOGS[name]["args"]
        for k in kwargs:
            if k not in params:
                problem(f"vanilla.dialogs.{name}: no keyword {k!r}")
        return ANSWERS[name].pop(0) if ANSWERS[name] else None
    return fn


class FakeFormattedString:
    AXES = {"Skia-Regular": {"wght": dict(name="Weight", minValue=0.48, maxValue=3.2, defaultValue=1.0),
                             "wdth": dict(name="Width", minValue=0.62, maxValue=1.3, defaultValue=1.0)}}
    def __init__(self, *args, **kwargs):
        pass
    def listFontVariations(self, ps):
        return self.AXES.get(ps, {})
    def listNamedInstances(self, ps):
        return {"Black": {"Weight": 3.2, "Width": 1.0}, "Condensed": {"Weight": 1.0, "Width": 0.62}} \
            if ps in self.AXES else {}
    def listOpenTypeFeatures(self, ps):
        return ["kern", "liga", "tnum", "ss01"]


class FakeDrawingTool:                                               # DrawBotDrawingTool on drawbot-skia
    def __getattr__(self, name):
        return getattr(SKIA_DB, name)
    def pdfImage(self):
        return NS(pageCount=lambda: 1)
    def frameDuration(self, seconds):
        pass
    def saveImage(self, path, **options):
        if path.endswith((".mp4", ".gif")):
            open(path, "w").close()                                  # drawbot-skia can't write movies
        else:
            SKIA_DB.saveImage(path)


def install_fakes():
    class nosuchclass_error(Exception):
        pass
    def lookUpClass(name):
        if name not in OBJC_CLASSES:
            raise nosuchclass_error(name)
        return OBJC_CLASSES[name]
    fake_module("objc", lookUpClass=lookUpClass, nosuchclass_error=nosuchclass_error,
                super=lambda cls, obj: NS(), python_method=lambda fn: fn)
    fake_module("AppKit", NSControl=NSControl, NSView=NSView, NSSegmentDistributionFillEqually=1,
                NSEventModifierFlagCommand=COMMAND, NSScreen=NS(mainScreen=lambda: NS(backingScaleFactor=lambda: 2.0)),
                NSTextAlignmentLeft=0, NSNoBorder=0,
                NSColor=NS(colorWithSRGBRed_green_blue_alpha_=lambda *c: Color(*c)),
                NSColorSpace=NS(sRGBColorSpace=lambda: NS()),
                NSFontManager=NS(sharedFontManager=lambda: NS(
                    availableFontFamilies=lambda: list(FONTS),
                    availableMembersOfFontFamily_=lambda f: FONTS.get(f, []))),
                NSFont=NS(boldSystemFontOfSize_=lambda s: NS(), smallSystemFontSize=lambda: 11,
                          systemFontSize=lambda: 13,
                          fontWithName_size_=lambda n, s: None),
                NSTimer=NS(timerWithTimeInterval_repeats_block_=lambda i, r, b: Timer(b)),
                NSRunLoop=NS(mainRunLoop=lambda: RunLoop()), NSRunLoopCommonModes=COMMON_MODES)
    fake_module("CoreText")
    fake_module("Quartz", CALayer=Layer, CAShapeLayer=Layer, CATransaction=Transaction,
                CGAffineTransformMakeScale=lambda x, y: ("scale", x, y),
                CGAffineTransformMakeRotation=lambda a: ("rotate", a),
                CGPathGetBoundingBox=cg_bounding_box)
    vanilla = fake_module("vanilla", **{c.__name__: c for c in (
        Window, Group, TextBox, Slider, EditText, Stepper, ComboBox, PopUpButton, CheckBox, ColorWell,
        SegmentedButton, List, TextEditor, Button, GridView, ScrollView)}, CheckBoxListCell=CheckBoxListCell)
    vanilla.__path__ = []
    fake_module("vanilla.dialogs", getFile=dialog("getFile"), putFile=dialog("putFile"))
    fake_module("vanilla.vanillaBase", VanillaCallbackWrapper=Target)
    for name in ("drawBot", "drawBot.ui", "drawBot.context"):
        fake_module(name).__path__ = []
    fake_module("drawBot.drawBotDrawingTools", DrawBotDrawingTool=FakeDrawingTool)
    fake_module("drawBot.ui.drawView", DrawView=DrawView)
    fake_module("drawBot.context.baseContext", BezierPath=BezierPath, FormattedString=FakeFormattedString)


# ── the run ──────────────────────────────────────────────────

def load_dial(home):
    os.environ["HOME"] = home                                       # last session goes to a temp folder
    ns = {"__name__": "dial_smoke"}
    exec(compile(open(test_harness.DIAL, encoding="utf-8").read(), "dial.py", "exec"), ns)
    if not ns["HAVE_UI"]:
        raise SystemExit("dial.py didn't take the stand-ins (HAVE_UI is False)")
    font = test_harness.find_font()
    def text_path(txt, t, size):                                    # geometry text without FormattedString
        p = BezierPath()
        p.text(txt, font=font, fontSize=size)
        return p
    def advance(txt, t, size):
        b = text_path(txt, t, size).bounds() if txt else None
        return b[2] if b else 0.0
    ns["text_path"], ns["advance"] = text_path, advance
    ns["TEST_FONT"] = font                                          # live text uses the plain test font
    DIAL.clear()
    DIAL.update(ns)
    return ns


def controls_of(grid):
    """the Python controls behind a grid's Cocoa views (alive only if the tool keeps them, R22)."""
    out = []
    for view in grid.getNSGridView().subviews():
        w = view.vanillaWrapper()
        if isinstance(w, V):
            out.append(w)
    return out


def ring_controls(tool):
    return controls_of(tool.ring_grid)


def controls_in(tool):
    """every control the tool built into its grids, as Python objects."""
    out = []
    for rows in tool.keep:
        for row in rows:
            for cell in row["cells"]:
                view = cell["view"] if isinstance(cell, dict) else cell
                if isinstance(view, V):
                    out.append(view)
    return out


def exercise(tool, controls, popups_max=12):
    """use each control once or a few times, as a person would."""
    for c in controls:
        if isinstance(c, PopUpButton):
            items = c.getItems()
            if "Choose…" in items:                                  # a file popup
                ANSWERS["getFile"].append([test_harness.resolve_files("@hand.svg")])
                c.sim_pick(items.index("Choose…"))
                continue
            for i in list(range(len(items)))[:popups_max] + [0]:
                if i < len(c.getItems()):
                    c.sim_pick(i)
        elif isinstance(c, SegmentedButton):
            if c._kw.get("selectionStyle") == "momentary":
                continue                                            # button bars: tested on their own
            for i in list(range(c._count)) + [0]:
                c.sim_click(i)
        elif isinstance(c, CheckBox):
            for _ in range(2):
                c.set(not c.get())
                c.sim_fire()
        elif isinstance(c, Slider):
            lo, hi = c._kw.get("minValue", 0), c._kw.get("maxValue", 100)
            c.set(lo + (hi - lo) * 0.37)
            c.sim_fire()
        elif isinstance(c, Stepper):
            c.set((c.get() or 0) + 1)
            c.sim_fire()
        elif isinstance(c, EditText):
            c.set("x1.1" if re.match(r"^-?[\d.]+$", str(c.get())) else "XII, III, VI, IX")
            c.sim_fire()
        elif isinstance(c, ColorWell):
            c.set(Color(0.2, 0.4, 0.6, 1))
            c.sim_fire()


def errors_in(tool):
    if tool is None:
        return []
    return [line for line in tool.logbox.get().splitlines() if "error in" in line or "Traceback" in line]


def step(name, fn):
    before = len(PROBLEMS)
    tool = getattr(builtins, "_dial_tool", None)
    seen = len(errors_in(tool))
    try:
        fn()
    except Exception:
        problem(f"{name}: {traceback.format_exc().strip().splitlines()[-1]}\n{traceback.format_exc()}")
    if getattr(builtins, "_dial_tool", None) is not tool:
        seen = 0                                                    # a new window has a new log
    tool = getattr(builtins, "_dial_tool", None)
    new_errors = errors_in(tool)[: max(len(errors_in(tool)) - seen, 0)]
    if new_errors:
        log = tool.logbox.get()
        problem(f"{name}: the tool logged an error:\n{log[:2500]}")
    print(("ok      " if len(PROBLEMS) == before else "FAILED  ") + name)


def main():
    harness = test_harness.load_dial(test_harness.find_font())      # the harness's dial.py, before the stand-ins
    install_fakes()
    home = tempfile.mkdtemp(prefix="dial-smoke-")
    os.makedirs(os.path.join(test_harness.OUT), exist_ok=True)
    ns = load_dial(home)
    T = lambda: builtins._dial_tool

    step("open the window", lambda: (ns["start"](), drive()))
    gc.collect()                                                    # strict: anything only cycles hold is gone
    step("all controls connected (R22)", lambda: None if "all controls connected" in T().logbox.get()
         else problem("the launch self-check didn't report 'all controls connected'"))

    def shape_engine():
        """on the Mac, dial.py wraps DrawBot's BezierPath to combine shapes with skia-pathops.
        Here that wrapper runs on the stand-in path; its renders must equal the harness's."""
        from PIL import Image, ImageChops
        if "shape combining: skia-pathops" not in T().logbox.get() or ns["BezierPath"] is BezierPath:
            problem("with pathops installed, the log should say 'shape combining: skia-pathops …'")
        for name in ("knockout-date", "scale-arc", "file-shapes", "production-mirror"):
            ns["_memo"].clear()
            harness["_memo"].clear()
            a = Image.open(test_harness.render(harness, "_engine-harness", test_harness.VARIANTS[name]))
            b = Image.open(test_harness.render(ns, "_engine-mac", test_harness.VARIANTS[name]))
            if ImageChops.difference(a.convert("RGBA"), b.convert("RGBA")).getbbox():
                problem(f"shape combining: {name} differs between the harness and the Mac route")
        import pathops
        real_op, real_simplify, failed = pathops.op, pathops.simplify, []
        def failing(real):                                          # skia gives up once → DrawBot's own method
            def fn(*a, **k):                                        # (here "DrawBot's own" is the stand-in's, which
                if len(failed) % 2 == 0:                            # calls pathops again: that second call works)
                    failed.append(1)
                    raise pathops.PathOpsError("simulated")
                failed.append(0)
                return real(*a, **k)
            return fn
        pathops.op, pathops.simplify = failing(real_op), failing(real_simplify)
        try:
            a, b = ns["circle"](10), ns["circle"](6)
            ring = a.difference(b)
            both = ns["merge"]([a, b])
            both.removeOverlap()
            if sum(failed) != 2 or ring.pointInside((0, 0)) or not ring.pointInside((4, 0)) \
                    or not both.pointInside((0, 0)):
                problem("when pathops fails on a shape, DrawBot's own method should combine it (R17)")
        finally:
            pathops.op, pathops.simplify = real_op, real_simplify
        real = sys.modules.pop("pathops")
        sys.modules["pathops"] = None                               # as if skia-pathops weren't installed
        try:
            plain = {"__name__": "dial_smoke_plain"}
            exec(compile(open(test_harness.DIAL, encoding="utf-8").read(), "dial.py", "exec"), plain)
            if plain["BezierPath"] is not BezierPath or "booleanOperations" not in plain["SHAPE_ENGINE"]:
                problem("without pathops, dial.py should use DrawBot's own BezierPath and say so (R17)")
        finally:
            sys.modules["pathops"] = real
    step("shape combining: pathops route equals the harness; falls back without it", shape_engine)

    def sections():
        for i in range(len(ns["SECTIONS"])):
            T().w.sections.sim_click(i)
            for _ in range(2):                                      # guides: in reach from every section
                T().w.guides.set(not T().w.guides.get())
                T().w.guides.sim_fire()
        if T().S["guides"] is not True:
            problem("the Guides checkbox didn't toggle the guides setting")
    step("section switcher; guides from every section", sections)

    def add_rings():
        g = T().ring_group
        for i in range(1, len(ns["KINDS"]) + 1):
            g.add.sim_pick(i)
        names = [r["name"] for r in T().S["rings"]]
        if len(names) != 7 or len(set(names)) != 7:
            problem(f"after adding one ring of each kind: {names}")
    step("add a ring of each kind", add_rings)

    def every_ring_every_page():
        g = T().ring_group
        if not hasattr(g, "details") or not isinstance(g.details, ScrollView):
            problem("the ring settings aren't in a scroll view")
        for r in range(len(T().S["rings"])):
            g.list.sim_select(r)
            exercise(T(), ring_controls(T()))
            g.list.sim_select(r)
    step("every control on every ring (all kinds)", every_ring_every_page)

    def change_kinds():
        g = T().ring_group
        g.list.sim_select(0)
        kind_popup = next(c for c in controls_in(T()) if isinstance(c, PopUpButton) and c.getItems() == ns["KINDS"])
        for k in list(range(len(ns["KINDS"]))) + [2]:
            kind_popup.sim_pick(k)
            if T().ring()["kind"] != k:
                problem("changing a ring's kind didn't stick")
    step("change a ring's kind", change_kinds)

    def type_controls():
        tool = T()
        tool.family.set("Skia")
        tool.family.sim_fire()
        for i in range(len(tool.style.getItems())):
            tool.style.sim_pick(i)
        tool.style.sim_pick(0)
        if not tool.axis_params:
            problem("Skia's axes didn't become sliders")
        for i in range(len(tool.instance.getItems())):
            tool.instance.sim_pick(i)
        for tag, (p, name) in tool.axis_params.items():
            p.slider.set(p.lo + (p.hi - p.lo) / 2)
            p.slider.sim_fire()
        tnum = [str(item["tag"]) for item in tool.features_list.get()].index("tnum")
        tool.features_list.sim_edit(tnum, "on", True)
        if tool.ring()["features"].get("tnum") is not True:
            problem(f"feature toggle not stored: {tool.ring()['features']}")
        tool.family.set("Helvetica Neue")
        tool.family.sim_fire()
    step("type: family, style, instance, axes, features", type_controls)

    def nudges():
        tool = T()
        for i in range(len(tool.nudge_pick.getItems())):
            tool.nudge_pick.sim_pick(i)
            tool.nudge_params["dr"].field.set("+0.3")
            tool.nudge_params["dr"].field.sim_fire()
        tool.nudge_reset.sim_click(0)
        tool.nudge_reset.sim_click(1)
        if tool.ring()["nudge"]:
            problem("Reset all left nudges behind")
    step("nudges and their reset", nudges)

    def ring_tools():
        g = T().ring_group
        n = len(T().S["rings"])
        for i in (0, 2, 3, 3, 1):                                   # duplicate, up, down, down, delete
            g.tools.sim_click(i)
        if len(T().S["rings"]) != n:
            problem("duplicate then delete didn't return to the same count")
        for _ in range(len(T().S["rings"]) + 1):
            g.tools.sim_click(1)                                    # delete everything: the last one stays
        if len(T().S["rings"]) != 1:
            problem("deleting every ring should keep the last one")
        g.list.sim_edit(0, "on", False)
        g.list.sim_edit(0, "name", "Renamed")
        if T().S["rings"][0]["on"] or T().S["rings"][0]["name"] != "Renamed":
            problem("list edits (show checkbox, name) didn't reach the ring")
        g.list.sim_edit(0, "on", True)
    step("duplicate, move, delete, rename, hide", ring_tools)

    def hands():
        tool = T()
        hand_controls = controls_of(tool.groups[2].grid)
        picker = next(c for c in hand_controls if isinstance(c, SegmentedButton) and c._count == 3)
        shape = next(c for c in hand_controls if isinstance(c, PopUpButton) and c.getItems() == ns["HAND_SHAPES"])
        for h in range(3):
            picker.sim_click(h)
            for s in range(len(ns["HAND_SHAPES"])):
                shape.sim_pick(s)
                exercise(tool, [c for c in hand_controls if c is not shape and c is not picker], popups_max=4)
    step("hands: each hand, each shape, every control", hands)

    def date_and_dial():
        tool = T()
        tool.S["da_on"] = True
        tool.static_dirty = True
        tool.render()
        drive()
        exercise(tool, controls_in(tool), popups_max=6)
    step("everything once more with the date window on", date_and_dial)

    def frame_clock():
        tool = T()
        link, view = tool.clock.link, tool.w.pdf
        tool.w.preview.sim_click(1)                                 # the PDF preview: every draw is a new document
        if "clock: display link" not in tool.logbox.get():
            problem("the launch log doesn't say 'clock: display link'")
        n = view.count
        tool.set_value("global", "guides", not tool.S["guides"])    # what a control's callback does
        if view.count != n or not tool.pending or link.paused:
            problem("a control's callback must only ask for a frame, with the clock awake (R28)")
        tool.set_value("global", "guides", not tool.S["guides"])    # twice in one frame…
        drive()
        if view.count != n + 1:
            problem(f"…should draw once; drew {view.count - n} times")
        drive()
        if view.count != n + 1 or not link.paused:
            problem("with nothing to draw, the clock should go to sleep and draw nothing")
        if "build" not in tool.w.status.get() or "frame" not in tool.w.status.get():
            problem(f"status line has no build / frame times: {tool.w.status.get()!r}")
        tool.w.preview.sim_click(0)
    step("frame clock: callbacks ask, one frame draws, idle sleeps (R28)", frame_clock)

    def canvas_only_what_changed():
        tool = T()
        if tool.mode() != 0 or "preview: canvas" not in tool.logbox.get() or "paths: CGPath" not in tool.logbox.get():
            problem("the canvas should be the preview at launch, and the log should say so")
        tool.S["ha_on"] = True
        for h in ns["HANDS"]:
            tool.S["ha_" + h]["on"] = True
        tool.render()
        drive()
        hands = [s for s in tool.canvas.slots if s.role == "hand"]
        before = [s.layer.props.get("AffineTransform") for s in hands]
        Layer.log.clear()
        tool.w.timeSlider.set((tool.S["t"] + 4000) % 43200)
        tool.w.timeSlider.sim_fire()                                # time only…
        props = {prop for _, prop in Layer.log}
        if props != {"AffineTransform"} or len(Layer.log) != 3:
            problem(f"a time change should only turn the three hands, it set {sorted(props)} × {len(Layer.log)}")
        if any(a == b for a, b in zip(before, [s.layer.props.get("AffineTransform") for s in hands])):
            problem("a time change didn't turn every hand")
        Layer.log.clear()
        well = next(c for c in controls_of(tool.groups[0].grid) if isinstance(c, ColorWell))
        well.set(Color(0.3, 0.5, 0.7, 1))
        well.sim_fire()                                             # …a colour only
        if {prop for _, prop in Layer.log} != {"FillColor"} or len(Layer.log) != 1:
            problem(f"a plate colour change should set one fill, it set {[p for _, p in Layer.log]}")
        Layer.log.clear()
        drive()
        if Layer.log:
            problem("an idle frame changed layers")
    step("canvas: a time or colour change touches only that", canvas_only_what_changed)

    def canvas_zoom_pan():
        tool = T()
        canvas, view, S = tool.canvas, tool.canvas.getNSView(), tool.S
        fit, zoom_about = ns["fit_zoom"], ns["zoom_about"]
        if abs(fit(600, 600, dict(dial_d=30.0, margin=3.0)) - 600 / 36) > 1e-12:
            problem("fit_zoom: 30 mm + 3 mm margins in 600 × 600 should be 600 / 36 points per mm")
        rnd = random.Random(7)
        for _ in range(500):
            z, k = rnd.uniform(1, 300), rnd.uniform(0.2, 5)
            c, p = (rnd.uniform(0, 900), rnd.uniform(0, 700)), (rnd.uniform(0, 900), rnd.uniform(0, 700))
            z2, c2 = zoom_about(z, c, p, k, 2.0, 400.0)
            under = lambda z, c: ((p[0] - c[0]) / z, (p[1] - c[1]) / z)     # the mm point under the cursor
            if not 2.0 - 1e-9 <= z2 <= 400.0 + 1e-9 or max(abs(a - b) for a, b in zip(under(z, c), under(z2, c2))) > 1e-9:
                problem("zoom_about: the point under the cursor moved, or the limits were passed")
                break
        view.sim_resize(900, 700)
        tool.w.fit.sim_fire()
        page = S["dial_d"] + 2 * S["margin"]
        if not canvas.fitted or abs(canvas.z - 700 / page) > 1e-9 or canvas.c != (450, 350):
            problem(f"Fit: zoom {canvas.z}, centre {canvas.c} in a 900 × 700 view")
        view.sim_resize(1000, 800)
        if abs(canvas.z - 800 / page) > 1e-9 or canvas.c != (500, 400):
            problem("a fitted dial should refit when the view is resized")
        at = (120.0, 630.0)
        spot = ((at[0] - canvas.c[0]) / canvas.z, (at[1] - canvas.c[1]) / canvas.z)
        view.magnifyWithEvent_(Event(at=at, magnification=0.5))     # pinch
        view.scrollWheel_(Event(at=at, dy=30, command=True))        # ⌘-scroll
        now = ((at[0] - canvas.c[0]) / canvas.z, (at[1] - canvas.c[1]) / canvas.z)
        if canvas.fitted or canvas.z <= 800 / page * 1.5 or max(abs(a - b) for a, b in zip(spot, now)) > 1e-9:
            problem("pinch and ⌘-scroll should zoom in about the cursor")
        c = canvas.c
        view.scrollWheel_(Event(dx=12, dy=-7))                      # two fingers: right and up
        if canvas.c != (c[0] + 12, c[1] + 7):
            problem("two-finger scroll should move the dial with the fingers")
        view.scrollWheel_(Event(dx=1, dy=0, precise=False))         # a mouse wheel notch
        if canvas.c != (c[0] + 22, c[1] + 7):
            problem("a mouse wheel should pan in bigger steps")
        z, c = canvas.z, canvas.c
        view.sim_resize(1100, 900)
        if canvas.z != z or canvas.c != (c[0] + 50, c[1] + 50):
            problem("a zoomed dial should keep its zoom and place when the view is resized")
        for _ in range(40):
            view.magnifyWithEvent_(Event(at=at, magnification=1.0))
        if canvas.z != ns["ZOOM_MAX"]:
            problem("zooming in should stop at ZOOM_MAX")
        for _ in range(40):
            view.magnifyWithEvent_(Event(at=at, magnification=-0.5))
        if abs(canvas.z - 900 / page / 4) > 1e-9:
            problem("zooming out should stop at a quarter of Fit")
        tool.w.guides.set(True)
        tool.w.guides.sim_fire()                                    # guides: still 1 point wide at this zoom (drive checks)
        tool.w.guides.sim_fire()
        z = canvas.z
        tool.set_value("global", "dial_d", S["dial_d"] + 1)         # redraws must not reset the zoom (build list #5)
        drive()
        if canvas.z != z:
            problem("a redraw reset the zoom")
        tool.set_value("global", "dial_d", S["dial_d"] - 1)
        tool.w.fit.sim_fire()
        tool.set_value("global", "margin", S["margin"] + 2)         # fitted: a bigger page refits
        drive()
        if abs(canvas.z - 900 / (S["dial_d"] + 2 * S["margin"])) > 1e-9:
            problem("a fitted dial should refit when the page size changes")
        tool.set_value("global", "margin", S["margin"] - 2)
        for key in ("out_mirror", "out_production"):                # drive checks mirror and backdrop
            tool.set_value("global", key, True)
            drive()
            tool.set_value("global", key, False)
            drive()
    step("canvas: fit, pinch, ⌘-scroll, pan, resize, limits, mirror, production", canvas_zoom_pan)

    def preview_switch():
        tool = T()
        pdf, canvas = tool.w.pdf, tool.w.canvas
        n = pdf.count
        tool.w.preview.sim_click(1)
        if tool.S["ui_preview"] != 1 or pdf.count != n + 1 or pdf._nsObject._hidden or not canvas._nsObject._hidden:
            problem("switching to PDF should show and draw the PDF preview and hide the canvas")
        tool.w.fit.sim_fire()
        exercise(tool, controls_of(tool.groups[0].grid))            # the Dial section, drawn as PDF
        tool.w.preview.sim_click(0)
        if tool.S["ui_preview"] != 0 or tool.mode() != 0 or canvas._nsObject._hidden or not pdf._nsObject._hidden:
            problem("switching back should show the canvas and hide the PDF preview")
    step("preview switch: Canvas → PDF → Canvas", preview_switch)

    def canvas_fails():
        tool = T()
        real = tool.canvas.draw
        def broken(items, S):
            raise RuntimeError("simulated Core Animation failure")
        object.__setattr__(tool.canvas, "draw", broken)
        n = tool.w.pdf.count
        tool.w.guides.sim_fire()
        log = tool.logbox.get()
        if "the canvas failed" not in log or tool.mode() != 1 or tool.w.pdf.count != n + 1 \
                or tool.w.pdf._nsObject._hidden or tool.w.preview.get() != 1:
            problem("a canvas error should be logged and the PDF preview should take over in the same frame (R17)")
        tool.logbox.set("")                                         # that error was the test's own
        tool.w.guides.sim_fire()
        tool.w.fit.sim_fire()
        ns["start"]()                                               # ⌘R: a fresh window gets the canvas back
        drive()
        if T().mode() != 0:
            problem("after running again the canvas should be back")
    step("canvas failure falls back to PDF, logged", canvas_fails)

    def time_controls():
        tool = T()
        tool.w.timeField.set("3:15:20")
        tool.w.timeField.sim_fire()
        if tool.S["t"] != 3 * 3600 + 15 * 60 + 20:
            problem("typed time didn't reach the setting")
        tool.w.timeSlider.set(20000)
        tool.w.timeSlider.sim_fire()
        tool.w.now.sim_fire()
        tool.w.play.sim_fire()
        if not tool.playing or tool.w.play._kw["title"] != "Stop":
            problem("Play didn't start")
        seen = [tool.S["t"]]
        for _ in range(2):
            time.sleep(0.02)
            tool.w.guides.set(not tool.w.guides.get())
            tool.w.guides.sim_fire()                                # using a control while playing
            seen.append(tool.S["t"])
        if not seen[0] < seen[1] < seen[2]:
            problem(f"Play should keep the hands moving while controls are used: {seen}")
        tool.w.timeSlider.set(100)
        tool.w.timeSlider.sim_fire()                                # the time slider while playing
        if not 100 <= tool.S["t"] < 101:
            problem(f"dragging the time while playing should carry on from there, got {tool.S['t']}")
        tool.w.play.sim_fire()
        drive(2)
        if tool.playing or tool.w.play._kw["title"] != "Play" or not tool.clock.link.paused:
            problem("Stop should stop the hands and let the clock sleep")
        tool.w.fit.sim_fire()
    step("time: typed, slider, now, play (also while a control is used), fit", time_controls)

    def export():
        tool = T()
        bar = next(c for c in controls_in(tool) if isinstance(c, SegmentedButton) and c._count == 5
                   and c._kw.get("selectionStyle") == "momentary")
        for i, kind in enumerate(["pdf", "svg", "png", "mp4", "gif"]):
            path = os.path.join(home, f"dial.{kind}")
            ANSWERS["putFile"].append(path)
            bar.sim_click(i)
            if not os.path.exists(path):
                problem(f"export {kind} wrote nothing")
    step("export PDF, SVG, PNG, MP4, GIF", export)

    def export_live_text():
        tool = T()
        live = next(c for c in controls_in(tool) if isinstance(c, CheckBox) and "Live text" in c._kw["title"])
        live.set(True)
        live.sim_fire()
        if tool.S["out_live_text"] is not True:
            problem("the live text checkbox didn't reach the setting")
        tool.S["da_on"] = True
        tool.static_dirty = True
        bar = next(c for c in controls_in(tool) if isinstance(c, SegmentedButton) and c._count == 5
                   and c._kw.get("selectionStyle") == "momentary")
        for i, kind in enumerate(["pdf", "svg"]):
            path = os.path.join(home, f"live.{kind}")
            ANSWERS["putFile"].append(path)
            bar.sim_click(i)
            if not os.path.exists(path):
                problem(f"live-text export {kind} wrote nothing")
        live.set(False)
        live.sim_fire()
    step("export with live text", export_live_text)

    def presets():
        tool = T()
        bar = next(c for c in controls_in(tool) if isinstance(c, SegmentedButton) and c._count == 3
                   and c._kw.get("selectionStyle") == "momentary")
        path = os.path.join(home, "preset.json")
        ANSWERS["putFile"].append(path)
        bar.sim_click(0)
        rings = json.load(open(path))["rings"]
        ANSWERS["getFile"].append([path])
        bar.sim_click(1)                                            # load: a new window
        if T() is tool or len(T().S["rings"]) != len(rings):
            problem("loading a preset didn't reopen with its rings")
        gc.collect()
        if "all controls connected" not in T().logbox.get():
            problem("after reopening, controls aren't connected")
        bar2 = next(c for c in controls_in(T()) if isinstance(c, SegmentedButton) and c._count == 3
                    and c._kw.get("selectionStyle") == "momentary")
        bar2.sim_click(2)                                           # defaults
    step("settings: save, load, defaults", presets)

    def rerun_and_migrate():
        before = T().S
        ns["start"]()                                               # ⌘R again: same settings, new window
        if T().S["rings"] != before["rings"]:
            problem("running again didn't keep the rings")
        T().w.close()
        builtins._dial_tool = None
        beta1 = dict(tr_div=3, tr_rail=True, tr_collision=2, nu_set=1, ha_style=2, ui_section=5,
                     nu_nudge={"12": {"dr": 0.4}})
        os.makedirs(os.path.dirname(ns["LAST_SESSION"]), exist_ok=True)
        json.dump(beta1, open(ns["LAST_SESSION"], "w"))
        ns["start"]()
        S = T().S
        if [r["name"] for r in S["rings"]] != ["Numerals", "Markers", "Minute ticks", "Fine ticks",
                                               "Outer rail", "Inner rail"]:
            problem(f"beta 1.0 last session became {[r['name'] for r in S['rings']]}")
        if S["ui_section"] != 2 or S["rings"][0]["nudge"] != {"0": {"dr": 0.4}}:
            problem("beta 1.0 section or nudge didn't convert")
    step("run again; open a beta 1.0 last session", rerun_and_migrate)

    def clock_fallback_and_close():
        tool = T()
        link = tool.clock.link
        tool.w.close()
        if link.valid or tool.clock is not None:
            problem("closing the window should stop the clock")
        builtins._dial_tool = None
        DISPLAY_LINK[0] = False                                     # as on macOS 13
        try:
            ns["start"]()
            drive()
            tool = T()
            timer = tool.clock.timer
            if "clock: timer" not in tool.logbox.get() or timer is None or COMMON_MODES not in timer.modes:
                problem("without display links the clock should fall back to a timer in the common modes (R17)")
            n = len(tool.canvas.slots)
            tool.w.guides.set(not tool.w.guides.get())
            tool.w.guides.sim_fire()
            if len(tool.canvas.slots) == n:
                problem("the timer clock didn't draw the frame")
            tool.w.close()
            if timer.valid:
                problem("closing the window should stop the timer")
        finally:
            DISPLAY_LINK[0] = True
    step("clock: timer fallback; closing stops it", clock_fallback_and_close)

    def no_canvas_class_and_old_macos():
        T().w.close()
        builtins._dial_tool = None
        CG_PATH[0] = False                                          # macOS 13: no NSBezierPath.CGPath
        try:
            ns["start"]()
            drive()
            tool = T()
            if "paths: DrawBot" not in tool.logbox.get() or tool.mode() != 0:
                problem("without NSBezierPath.CGPath the canvas should use DrawBot's converter and say so")
            if any(s.layer.props["Path"].route != "DrawBot" for s in tool.canvas.slots):
                problem("…and every path should come through it")
            tool.w.close()
        finally:
            CG_PATH[0] = True
        builtins._dial_tool = None
        real, ns["CanvasView"] = ns["CanvasView"], None             # the view class couldn't be made
        try:
            ns["start"]()
            drive()
            tool = T()
            if "preview: PDF only" not in tool.logbox.get() or tool.mode() != 1 or tool.w.pdf.count < 1:
                problem("without the canvas view class the tool should open with the PDF preview and say so (R17)")
            exercise(tool, controls_of(tool.groups[0].grid))
            tool.w.fit.sim_fire()
            tool.w.play.sim_fire()
            tool.w.play.sim_fire()
            tool.w.close()
        finally:
            ns["CanvasView"] = real
        builtins._dial_tool = None
    step("fallbacks: DrawBot's path converter; no canvas class → PDF only", no_canvas_class_and_old_macos)

    def second_run_of_the_script():
        ns2 = load_dial(home)                                       # ⌘R runs dial.py again in the same process
        if ns2["CanvasView"] is not ns["CanvasView"] or ns2["FlippedView"] is not ns["FlippedView"]:
            problem("a second run must look its Cocoa classes up, not define them again (R27)")
        ns2["start"]()
        drive()
        if T().mode() != 0 or ns2["NOTES"]:
            problem(f"second run: canvas not showing, or notes: {ns2['NOTES']}")
        T().w.close()
    step("the script runs a second time in the same process (⌘R)", second_run_of_the_script)

    print()
    if PROBLEMS:
        print(f"{len(PROBLEMS)} problem(s).")
        sys.exit(1)
    print("UI smoke test passed — no problems found (layout and looks still need the Mac).")


if __name__ == "__main__":
    main()
