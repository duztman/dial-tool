"""
ui_smoke.py — run dial.py's whole interface without a Mac.

Stand-ins replace vanilla, AppKit, Quartz and DrawBot's window parts, then
the script clicks through every section, ring kind, page, hand and button.

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

import builtins, gc, json, os, re, sys, tempfile, time, traceback, types, weakref

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

class NSView(NS):
    @classmethod
    def alloc(cls):
        return cls()
    def initWithFrame_(self, frame):
        return self
    def __init__(self, wrapper=None):
        self._wrapper = weakref.ref(wrapper) if wrapper is not None else (lambda: None)
        self._subviews, self._target, self._action, self._clicked = [], (lambda: None), None, -1
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
        object.__setattr__(self, "_kw", check_call(type(self).__name__, args, kwargs))
        object.__setattr__(self, "_nsObject", self.ns_class(self))
        callback = self._kw.get("callback")
        if callback is not None:
            object.__setattr__(self, "_target", Target(callback))   # held by the Python object only
            self._nsObject._target = weakref.ref(self._target)
            self._nsObject._action = "action:"
        object.__setattr__(self, "_shown", True)
        self.setup()

    def setup(self):
        pass

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        cls = type(self).__name__
        if name in methods_of(cls):
            return lambda *a, **k: NS()
        raise AttributeError(f"vanilla 0.5.0 {cls} has no {name!r}")

    def __setattr__(self, name, value):
        object.__setattr__(self, name, value)
        if isinstance(value, (V, DrawView)) and not name.startswith("_"):
            self._nsObject._subviews.append(value._nsObject)

    def show(self, on):
        object.__setattr__(self, "_shown", bool(on))

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
        raise nosuchclass_error(name)
    fake_module("objc", lookUpClass=lookUpClass, nosuchclass_error=nosuchclass_error)
    fake_module("AppKit", NSControl=NSControl, NSView=NSView, NSSegmentDistributionFillEqually=1,
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
    fake_module("Quartz")
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
    install_fakes()
    home = tempfile.mkdtemp(prefix="dial-smoke-")
    os.makedirs(os.path.join(test_harness.OUT), exist_ok=True)
    ns = load_dial(home)
    T = lambda: builtins._dial_tool

    step("open the window", lambda: (ns["start"](), drive()))
    gc.collect()                                                    # strict: anything only cycles hold is gone
    step("all controls connected (R22)", lambda: None if "all controls connected" in T().logbox.get()
         else problem("the launch self-check didn't report 'all controls connected'"))

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
        link, view = tool.clock.link, tool.w.canvas
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
    step("frame clock: callbacks ask, one frame draws, idle sleeps (R28)", frame_clock)

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
            n = tool.w.canvas.count
            tool.w.guides.set(not tool.w.guides.get())
            tool.w.guides.sim_fire()
            if tool.w.canvas.count != n + 1:
                problem("the timer clock didn't draw the frame")
            tool.w.close()
            if timer.valid:
                problem("closing the window should stop the timer")
        finally:
            DISPLAY_LINK[0] = True
    step("clock: timer fallback; closing stops it", clock_fallback_and_close)

    print()
    if PROBLEMS:
        print(f"{len(PROBLEMS)} problem(s).")
        sys.exit(1)
    print("UI smoke test passed — no problems found (layout and looks still need the Mac).")


if __name__ == "__main__":
    main()
