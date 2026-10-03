# ─────────────────────────────────────────────────────────────
#  dial_probe.py — foundation test for the dial UI
#  Open in DrawBot, ⌘R. A window opens; the "Report" tab says
#  what worked and which fallback was used if something didn't.
# ─────────────────────────────────────────────────────────────

import time, platform, traceback
from math import sin, cos, radians
import AppKit, CoreText
import vanilla
from vanilla import (Window, Tabs, TextBox, Slider, EditText, Stepper, ComboBox,
                     PopUpButton, TextEditor, Button, List, CheckBoxListCell)
from drawBot.context.baseContext import BezierPath, FormattedString

CHECKS = {}

def check(name, ok, note=""):
    CHECKS[name] = (ok, note)
    print(("PASS  " if ok else "FAIL  ") + name + (f" — {note}" if note else ""))


# ── fallbacks, decided once at start ─────────────────────────

GridView = getattr(vanilla, "GridView", None)
check("vanilla GridView (form layout)", GridView is not None,
      "" if GridView else "fallback: manual row placement")

try:
    from drawBot.drawBotDrawingTools import DrawBotDrawingTool
    DB = DrawBotDrawingTool()                      # private engine: main canvas untouched
    check("private drawing engine", True)
except Exception as e:
    import drawBot as DB
    check("private drawing engine", False, f"fallback: shared engine ({e})")

try:
    from drawBot.ui.drawView import DrawView
    CANVAS = "drawview"
except Exception as e:
    from vanilla import ImageView
    CANVAS = "image"
    check("DrawView canvas", False, f"fallback: image view ({e})")


# ── fonts: system families → styles ──────────────────────────

def system_families():
    try:
        fm = AppKit.NSFontManager.sharedFontManager()
        fams = sorted((str(f) for f in fm.availableFontFamilies() if not str(f).startswith(".")),
                      key=str.lower)
        check("system font families", bool(fams), f"{len(fams)} families")
        return fams, True
    except Exception as e:
        names = sorted(DB.installedFonts())
        check("system font families", False, f"fallback: flat PostScript list ({e})")
        return names, False

def styles_of(family):
    """[(style name, PostScript name)]"""
    members = AppKit.NSFontManager.sharedFontManager().availableMembersOfFontFamily_(family) or []
    return [(str(m[1]), str(m[0])) for m in members]

FEATURE_NAMES = dict(
    kern="kerning", liga="ligatures", calt="contextual alternates", dlig="discretionary ligatures",
    tnum="tabular figures", pnum="proportional figures", onum="oldstyle figures",
    lnum="lining figures", zero="slashed zero", frac="fractions", sups="superscript",
    subs="subscript", ordn="ordinals", smcp="small caps", c2sc="caps to small caps",
    case="case-sensitive forms", salt="stylistic alternates", swsh="swash", titl="titling",
    ccmp="glyph composition", locl="localized forms", mark="mark positioning",
    mkmk="mark to mark", aalt="access all alternates", cpsp="capital spacing")
DEFAULT_ON = {"kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "rlig", "rclt", "curs", "clig"}

def designer_feature_names(ps):
    """names a type designer gave ss01…ss20 / cv01… inside the font file."""
    names = {}
    try:
        from fontTools.ttLib import TTFont
        font = AppKit.NSFont.fontWithName_size_(ps, 10)
        url = CoreText.CTFontDescriptorCopyAttribute(font.fontDescriptor(), CoreText.kCTFontURLAttribute)
        path = url.path()
        if path.lower().endswith((".ttc", ".otc")):
            from drawBot.context.tools.openType import _getTTFontFromTTC
            ft = _getTTFontFromTTC(path, ps)
        else:
            ft = TTFont(path, lazy=True)
        for table in ("GSUB", "GPOS"):
            if table in ft and ft[table].table.FeatureList:
                for rec in ft[table].table.FeatureList.FeatureRecord:
                    p = rec.Feature.FeatureParams
                    nid = getattr(p, "UINameID", None) or getattr(p, "FeatUILabelNameID", None)
                    if nid:
                        names[rec.FeatureTag] = ft["name"].getDebugName(nid)
        check("designer feature names", True, f"{len(names)} named in {ps}")
    except Exception as e:
        check("designer feature names", False, f"fallback: tags only ({e})")
    return names


# ── one number control = label · slider · field · stepper ───

def fmt(v, step):
    return f"{v:.0f}" if step >= 1 else f"{v:.2f}"

class Param:
    def __init__(self, ui, label, lo, hi, value, step=1):
        self.ui, self.label, self.lo, self.hi, self.value, self.step = ui, label, lo, hi, value, step

    def cells(self):
        return [lambda pos: TextBox(pos, self.label + ":", alignment="right", sizeStyle="small"),
                self._slider, self._field, self._stepper]

    def _slider(self, pos):
        self.s = Slider(pos, minValue=self.lo, maxValue=self.hi, value=self.value,
                        callback=lambda s: self.set(s.get(), s), sizeStyle="small")
        return self.s

    def _field(self, pos):
        self.f = EditText(pos, fmt(self.value, self.step), continuous=False,
                          callback=self._typed, sizeStyle="small")
        return self.f

    def _stepper(self, pos):
        self.st = Stepper(pos, value=self.value, minValue=-1e6, maxValue=1e6,
                          increment=self.step, callback=lambda s: self.set(s.get(), s), sizeStyle="small")
        return self.st

    def _typed(self, sender):
        try:
            v = float(str(sender.get()).replace(",", "."))
        except ValueError:
            sender.set(fmt(self.value, self.step)); return
        if v > self.hi: self.hi = v; self.s.setMaxValue(v)     # typing past the end extends the slider
        if v < self.lo: self.lo = v; self.s.setMinValue(v)
        self.set(v, sender)

    def set(self, v, source=None, quiet=False):
        self.value = v
        if source is not self.s:  self.s.set(v)
        if source is not self.f:  self.f.set(fmt(v, self.step))
        if source is not self.st: self.st.set(v)
        if not quiet:
            self.ui.changed()


# ── a form: rows of 4 cells, GridView or manual fallback ─────

class Form:
    X, W, ROW = (10, 106, 284, 342), (92, 172, 52, 20), 30

    def __init__(self, host, name, top=12):
        self.host, self.name, self.top = host, name, top
        self.grid, self.count, self.manual = None, 0, GridView is None

    def add(self, rows):
        if not self.manual:
            try:
                built = [[(f("auto") if f else TextBox("auto", "")) for f in r] for r in rows]
                if self.grid is None:
                    cols = [dict(width=w, columnPlacement=p)
                            for w, p in zip(self.W, ("trailing", "fill", "fill", "leading"))]
                    self.grid = GridView("auto", built, columnDescriptions=cols, columnSpacing=6,
                                         rowSpacing=8, rowPlacement="center", rowAlignment="none")
                    setattr(self.host, self.name, self.grid)
                    self.host.addAutoPosSizeRules([f"H:|-10-[{self.name}]", f"V:|-{self.top}-[{self.name}]"])
                else:
                    for r in built:
                        self.grid.appendRow(r)
                self.count += len(rows)
                return
            except Exception:
                check("GridView build", False, "fallback: manual rows\n" + traceback.format_exc())
                self.manual = True
        for r in rows:
            y = self.top + self.count * self.ROW
            for c, f in enumerate(r):
                if f:
                    setattr(self.host, f"{self.name}_{self.count}_{c}", f((self.X[c], y, self.W[c], 22)))
            self.count += 1

    def trim(self, keep):
        while self.count > keep:
            self.count -= 1
            if self.grid is not None and not self.manual:
                g = self.grid.getNSGridView()
                row = g.rowAtIndex_(self.count)
                for c in range(row.numberOfCells()):           # detach controls, not just the row
                    v = row.cellAtIndex_(c).contentView()
                    if v is not None:
                        v.removeFromSuperview()
                g.removeRowAtIndex_(self.count)
            else:
                for c in range(4):
                    n = f"{self.name}_{self.count}_{c}"
                    if hasattr(self.host, n):
                        delattr(self.host, n)


# ── the window ───────────────────────────────────────────────

class Probe:
    def __init__(self):
        self.ready, self.axes, self.features = False, {}, []
        self.families, self.by_family = system_families()

        self.w = Window((1000, 660), "Dial UI probe", minSize=(820, 560))
        self.w.tabs = Tabs((10, 10, 400, -36), ["Type", "Features", "Report"])
        if CANVAS == "drawview":
            self.w.canvas = DrawView((420, 10, -10, -36))
        else:
            self.w.canvas = ImageView((420, 10, -10, -36), scale="proportional")
        self.w.status = TextBox((12, -26, -12, 18), "", sizeStyle="small")

        # Type tab
        t = self.w.tabs[0]
        self.form = Form(t, "typeForm")
        self.size = Param(self, "Size pt", 8, 160, 44, 1)
        self.track = Param(self, "Tracking", -200, 800, 0, 10)       # 1/1000 em, like Illustrator
        lab = lambda s: (lambda pos: TextBox(pos, s, alignment="right", sizeStyle="small"))
        self.form.add([
            [lab("Family:"), self._family, None, None],
            [lab("Style:"), self._style, None, None],
            [lab("Instance:"), self._instance, None, None],
            [lab("Language:"), self._language, None, None],
            self.size.cells(),
            self.track.cells(),
            [lab("Axes"), None, None, None],
        ])
        self.base_rows = self.form.count

        # Features tab: scrolling checkbox list
        self.w.tabs[1].list = List((10, 10, -10, -10), [],
            columnDescriptions=[dict(title="", key="on", cell=CheckBoxListCell(), width=22),
                                dict(title="Tag", key="tag", editable=False, width=46),
                                dict(title="Feature", key="name", editable=False)],
            editCallback=self._features_edited, allowsSorting=False, drawFocusRing=False)

        # Report tab
        r = self.w.tabs[2]
        r.text = TextEditor((10, 10, -10, -44), "", readOnly=True)
        r.copy = Button((10, -34, 140, 22), "Copy report", callback=self._copy_report, sizeStyle="small")

        start = "Helvetica Neue" if "Helvetica Neue" in self.families else self.families[0]
        self.family.set(start)
        self.load_family(start)
        self.w.open()
        self.ready = True
        check("window + tabs open", True)
        self.render()

    # cell factories (need self, so they live here)
    def _family(self, pos):
        self.family = ComboBox(pos, self.families, completes=True, callback=self._family_cb, sizeStyle="small")
        self.family.getNSComboBox().setNumberOfVisibleItems_(24)
        return self.family

    def _style(self, pos):
        self.style = PopUpButton(pos, [], callback=lambda s: self.load_font(), sizeStyle="small")
        return self.style

    def _instance(self, pos):
        self.instance = PopUpButton(pos, ["—"], callback=self._instance_cb, sizeStyle="small")
        return self.instance

    def _language(self, pos):
        self.langs = ["default", "tr", "nl", "de", "pl", "ro", "ar", "fa", "zh-Hans", "ja"]
        self.language = PopUpButton(pos, self.langs, callback=lambda s: self.changed(), sizeStyle="small")
        return self.language

    # — font loading —
    def _family_cb(self, sender):
        name = str(sender.get())
        if name in self.families and name != getattr(self, "current_family", None):
            self.load_family(name)

    def load_family(self, family):
        self.current_family = family
        self.styles = styles_of(family) if self.by_family else [("—", family)]
        self.style.setItems([s for s, _ in self.styles])
        self.load_font()

    def load_font(self):
        try:
            self.ps = self.styles[self.style.get()][1]
            fs = FormattedString()
            axes = fs.listFontVariations(self.ps)
            self.instances = fs.listNamedInstances(self.ps)
            self.instance.setItems(["—"] + list(self.instances))
            # rebuild axis rows
            self.form.trim(self.base_rows)
            self.axes = {}
            rows = []
            for tag, a in axes.items():
                p = Param(self, f"{a['name']} {tag}", a["minValue"], a["maxValue"], a["defaultValue"],
                          1 if a["maxValue"] - a["minValue"] > 20 else 0.01)
                self.axes[tag] = (p, a["name"])
                rows.append(p.cells())
            if rows:
                self.form.add(rows)
                check("variable axes → sliders", True, f"{len(rows)} axes in {self.ps}")
            # features
            names = designer_feature_names(self.ps)
            tags = sorted(set(fs.listOpenTypeFeatures(self.ps)))
            self._updating = True
            self.w.tabs[1].list.set([dict(on=t in DEFAULT_ON, tag=t,
                                          name=names.get(t) or FEATURE_NAMES.get(t, ""))
                                     for t in tags])
            self._updating = False
            check("OpenType feature list", True, f"{len(tags)} features in {self.ps}")
        except Exception:
            check("load font", False, traceback.format_exc())
        self.changed()

    def _instance_cb(self, sender):
        i = sender.get()
        if i == 0: return
        loc = list(self.instances.values())[i - 1]               # keys are axis names
        for tag, (p, name) in self.axes.items():
            if name in loc: p.set(loc[name], quiet=True)
            elif tag in loc: p.set(loc[tag], quiet=True)
        self.changed()

    def _features_edited(self, sender):
        if not getattr(self, "_updating", False):
            self.changed()

    # — state → drawing —
    def type_settings(self):
        size = self.size.value
        feats = {}
        for item in self.w.tabs[1].list.get():
            tag, on = str(item["tag"]), bool(item["on"])
            if on != (tag in DEFAULT_ON):
                feats[tag] = on
        lang = self.langs[self.language.get()]
        return dict(font=self.ps, fontSize=size, tracking=self.track.value / 1000 * size,
                    openTypeFeatures=feats, fontVariations={t: p.value for t, (p, _) in self.axes.items()},
                    language=None if lang == "default" else lang)

    def changed(self):
        if self.ready:
            self.render()

    def render(self):
        t0 = time.perf_counter()
        try:
            st = self.type_settings()
            DB.newDrawing()
            DB.newPage(560, 560)
            DB.fill(0.93, 0.91, 0.86); DB.oval(20, 20, 520, 520)
            DB.fill(0.08, 0.08, 0.08)
            for h in range(12):                                   # numerals as outlines
                p = BezierPath()
                p.text(FormattedString(str(12 if h == 0 else h), **st))
                b = p.bounds()
                if b:
                    a = radians(h * 30)
                    p.translate(280 + 205 * sin(a) - (b[0] + b[2]) / 2,
                                280 + 205 * cos(a) - (b[1] + b[3]) / 2)
                    DB.drawPath(p)
            spec = dict(st, fontSize=st["fontSize"] * 0.5, tracking=st["tracking"] * 0.5)
            for i, line in enumerate(("0123456789", "XII · IIII · fi ffl", "ĞİŞ ığş")):
                p = BezierPath()
                p.text(FormattedString(line, **spec))
                b = p.bounds()
                if b:
                    p.translate(280 - (b[0] + b[2]) / 2, 330 - i * spec["fontSize"] * 1.4)
                    DB.drawPath(p)
            pdf = DB.pdfImage()
            if CANVAS == "drawview":
                self.w.canvas.setPDFDocument(pdf)
            else:
                img = AppKit.NSImage.alloc().initWithData_(pdf.dataRepresentation())
                self.w.canvas.setImage(imageObject=img)
            ms = (time.perf_counter() - t0) * 1000
            check("live render (outlines with type settings)", True, f"{ms:.0f} ms")
            self.w.status.set(f"{self.ps}   ·   redraw {ms:.0f} ms")
        except Exception:
            check("live render", False, traceback.format_exc())
        self._write_report()

    # — report —
    def _write_report(self):
        head = (f"DrawBot {getattr(DB, '__version__', '?')} · vanilla {getattr(vanilla, '__version__', '?')} · "
                f"macOS {platform.mac_ver()[0]} · Python {platform.python_version()} · {platform.machine()}\n"
                f"canvas: {CANVAS} · layout: {'manual' if self.form.manual else 'grid'}\n\n")
        lines = [("PASS  " if ok else "FAIL  ") + n + (f" — {note}" if note else "")
                 for n, (ok, note) in CHECKS.items()]
        self.w.tabs[2].text.set(head + "\n".join(lines))

    def _copy_report(self, sender):
        pb = AppKit.NSPasteboard.generalPasteboard()
        pb.clearContents()
        pb.setString_forType_(self.w.tabs[2].text.get(), AppKit.NSPasteboardTypeString)


try:
    Probe()
except Exception:
    print(traceback.format_exc())
