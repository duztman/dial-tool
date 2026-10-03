# ─────────────────────────────────────────────────────────────
#  dial.py — Dial Tool for DrawBot                     beta 2.1
#
#  ⌘R opens the tool window. Running again replaces the window
#  and keeps your current settings.
#
#  1 · SETTINGS     every setting and its starting value
#  2 · GEOMETRY     settings → shapes  (millimetres, clock angles)
#  3 · DRAWING      shapes → a page    (preview and export)
#  4 · INTERFACE    the window
#
#  The dial is a list of RINGS. A ring repeats one thing around
#  the centre — ticks, markers, numerals or a band of colour — at
#  its positions. The list order is the stacking order: the top
#  ring is drawn last, and a ring can skip the positions, or knock
#  out the shapes, of the rings above it.
#
#  Units: millimetres. Angles: 0° = 12 o'clock, clockwise.
#  Everything is a filled shape — no strokes — so widths are exact
#  in Illustrator and clean for etching, printing and laser.
# ─────────────────────────────────────────────────────────────

import os, json, copy, time, traceback, builtins
from math import sin, cos, tan, acos, sqrt, ceil, radians, degrees, hypot, pi

try:
    from drawBot.context.baseContext import BezierPath, FormattedString
except ImportError:                                   # test harness outside the app
    from drawbot_skia.path import BezierPath
    FormattedString = None

VERSION = "beta 2.1"
MM = 72 / 25.4                                        # 1 mm in points (render time only, R1)
MM_PER_PT = 25.4 / 72                                 # imported files arrive in points


# ═════════════════════════════════════════════════════════════
#  1 · SETTINGS
# ═════════════════════════════════════════════════════════════

KINDS       = ["ticks", "markers", "numerals", "band"]
SHAPES      = ["bar", "wedge", "dot", "file"]
TWELVES     = ["same", "double", "triangle", "none"]          # the mark at a markers ring's first position
SKIP_FROM   = ["nothing", "markers above", "markers & numerals above", "all marks above"]
KNOCK_FROM  = ["nothing", "markers above", "markers & numerals above", "everything above"]
FROM_KINDS  = [(), ("markers",), ("markers", "numerals"), ("ticks", "markers", "numerals", "band")]
MODES       = ["upright", "radial", "radial, auto-flip", "on path"]
HANDS       = ["hour", "minute", "second"]
HAND_SHAPES = ["baton", "pencil", "sword", "dauphine", "leaf", "arrow", "syringe", "breguet", "lollipop", "file"]
DATE_AT     = [("3", 90), ("4:30", 135), ("6", 180), ("9", 270), ("12", 0)]
LANGS       = ["default", "tr", "nl", "de", "pl", "ro", "ca", "ar", "fa", "zh-Hans", "ja"]
BEATS       = [("sweep", 0), ("quartz · 1/s", 1), ("6 beats/s", 6), ("8 beats/s", 8)]
FILE_TYPES  = ["svg", "pdf", "ai"]
LABEL_SETS  = [                                       # popups store the index (R9): only ever append
    ("Arabic",         "12 1 2 3 4 5 6 7 8 9 10 11"),
    ("Roman · IIII",   "XII I II III IIII V VI VII VIII IX X XI"),
    ("Roman · IV",     "XII I II III IV V VI VII VIII IX X XI"),
    ("Eastern Arabic", "١٢ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ١٠ ١١"),
    ("Chinese",        "十二 一 二 三 四 五 六 七 八 九 十 十一"),
    ("Words",          "TWELVE ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN"),
    ("Custom",         ""),
    ("Numbers",        ""),                           # first, step, digits
]

INK    = [0.08, 0.08, 0.08, 1]
ACCENT = [0.80, 0.22, 0.10, 1]

# every ring carries every key, so changing its kind keeps everything (R7)
RING_BASE = dict(
    kind=0, name="", on=True, c=INK,
    # where: radius and positions
    r=13.0, count=12, start=0.0, span=360.0, every=1, offset=0, invert=False,
    # rings above: which of them this ring gives way to (index into SKIP_FROM / KNOCK_FROM)
    skip=0, knock=0, clear=0.25,
    # ticks and markers
    shape=0, file="", scale=1.0, len=2.8, w=0.7, taper=0.35, round_out=0.0, round_in=0.0, wall=0.0,
    twelve=0, twelve_scale=1.0, twelve_gap=0.5,
    # numerals
    labels=0, custom="", num_from=0.0, num_step=5.0, num_digits=0, mode=0, size=2.4, nudge={},
    family="Helvetica Neue", ps="HelveticaNeue", tracking=0.0, lang=0, axes={}, features={},
    # band
    width=1.0, fill=100.0,
)
TYPE_KEYS = ("family", "ps", "size", "tracking", "lang", "axes", "features")

HAND_BASE = dict(
    on=True, shape=0, file="", fit=True, scale=1.0, w_scale=1.0,
    len=10.0, w=1.0, tail=1.0, tip=1.0, feature=1.2, feature_at=75.0,
    counter=0.0, wall=0.0, c=[0.10, 0.10, 0.12, 1],
)

DEFAULTS = dict(
    version=2,
    # dial
    dial_d=30.0, margin=3.0, guides=True,
    c_plate=[0.93, 0.91, 0.86, 1], c_backdrop=[0.80, 0.80, 0.78, 1],
    # rings, top first — filled in below: beta 1.0's starting dial, as rings
    rings=[],
    # hands
    ha_on=True, ha_beat=0, ha_cap=1.6, c_cap=ACCENT, ha_hour={}, ha_minute={}, ha_second={},
    # date
    da_on=False, da_at=0, da_r=10.5, da_w=2.6, da_h=2.0, da_round=0.2, da_frame=0.15,
    da_clear=0.25, da_day="17", da_size=62.0, da_ink=INK,
    # time and output
    t=10 * 3600 + 9 * 60 + 36,
    out_production=False, out_mirror=False, out_dpi=600.0, out_seconds=4.0, out_fps=30.0,
    # interface
    ui_section=0, ui_ring=0, ui_hand=0,
)

# settings that change only colour, hands, output or the interface — no need to rebuild the dial
NOT_GEOMETRY = ("t", "guides", "ui_section", "ui_ring", "ui_hand")
NOT_GEOMETRY_PREFIX = ("c_", "ha_", "out_")
WHOLE = ("count", "every", "offset", "num_digits")   # whole numbers


def complete(base, d):
    """base values + d's values (deep copies), names turned into popup indexes."""
    out = json.loads(json.dumps(base))
    out.update(json.loads(json.dumps(d or {})))
    for key, names in (("kind", KINDS), ("shape", HAND_SHAPES if "fit" in base else SHAPES)):
        if isinstance(out.get(key), str) and out[key] in names:
            out[key] = names.index(out[key])        # JSON written by hand may use names
    return out

def kind_of(ring):
    return KINDS[ring["kind"]]

KIND_START = {                                        # a new ring, sized for a dial of radius R
    "ticks":    lambda R: dict(r=R - 0.6, count=60, len=1.0, w=0.12),
    "markers":  lambda R: dict(r=R - 1.6, count=12, len=2.8, w=0.7),
    "numerals": lambda R: dict(r=round(R * 0.67, 2), count=12),
    "band":     lambda R: dict(r=R, count=1, width=1.0, c=ACCENT),
}

def new_ring(kind, S, like=None):
    """a fresh ring; numerals copy the type of `like` (another numerals ring)."""
    ring = complete(RING_BASE, dict(kind=KINDS.index(kind), **KIND_START[kind](S["dial_d"] / 2)))
    if like is not None:
        for k in TYPE_KEYS:
            ring[k] = copy.deepcopy(like[k])
    names = {r["name"] for r in S["rings"]}
    base = kind.capitalize()
    ring["name"], n = base, 2
    while ring["name"] in names:
        ring["name"], n = f"{base} {n}", n + 1
    return ring


# ── beta 1.0 settings → rings and hands (R8) ─────────────────

BETA1_DEFAULTS = dict(
    dial_d=30.0, margin=3.0, guides=True,
    c_plate=[0.93, 0.91, 0.86, 1], c_ink=INK, c_hands=[0.10, 0.10, 0.12, 1],
    c_accent=ACCENT, c_backdrop=[0.80, 0.80, 0.78, 1],
    tr_div=0, tr_inset=0.6, tr_len=1.0, tr_w=0.12, tr_minor_len=0.5, tr_minor_w=0.7,
    tr_rail=False, tr_rail_w=0.1, tr_collision=0, tr_clear=0.25,
    mk_shape=0, mk_svg="", mk_at=0, mk_len=2.8, mk_w=0.7, mk_offset=0.0, mk_taper=0.35,
    mk_round_out=0.0, mk_round_in=0.0, mk_wall=0.0, mk_twelve=0, mk_twelve_scale=1.0, mk_twelve_gap=0.5,
    ty_family="Helvetica Neue", ty_ps="HelveticaNeue", ty_size=2.4, ty_tracking=0.0,
    ty_lang=0, ty_axes={}, ty_features={},
    nu_set=0, nu_custom="", nu_at=0, nu_mode=0, nu_r=10.0, nu_nudge={},
    ha_on=True, ha_style=0, ha_svg_hour="", ha_svg_min="", ha_svg_sec="",
    ha_hour_len=55.0, ha_min_len=88.0, ha_hour_w=1.4, ha_min_w=1.0, ha_tail=12.0, ha_cap=1.6,
    ha_sec_on=True, ha_sec_len=92.0, ha_sec_w=0.15, ha_counter=1.1, ha_beat=0,
    da_on=False, da_at=0, da_r=10.5, da_w=2.6, da_h=2.0, da_round=0.2, da_frame=0.15,
    da_day="17", da_size=62.0,
    t=10 * 3600 + 9 * 60 + 36,
    out_production=False, out_mirror=False, out_dpi=600.0, out_seconds=4.0, out_fps=30.0,
    ui_section=0,
)

def from_beta1(old):
    """beta 1.0's one track + markers + numerals become rings; its hands become three hands."""
    o = json.loads(json.dumps(BETA1_DEFAULTS))
    o.update({k: v for k, v in old.items() if k in BETA1_DEFAULTS})
    ink, R = o["c_ink"], o["dial_d"] / 2
    t_out = R - o["tr_inset"]
    t_in = t_out - o["tr_len"]
    rule = ["one ring", "skip", "knockout", "stack"][o["tr_collision"]]
    skip = 1 if rule in ("one ring", "skip") else 0           # ticks gave way to markers only
    knock = 1 if rule == "knockout" else 0
    clear = o["tr_clear"]

    def show(name):                                   # beta's "show at" → every / offset / invert
        every, invert = {"cardinals": (3, False), "non-cardinals": (3, True),
                         "12 only": (12, False), "12 & 6": (6, False)}.get(name, (1, False))
        return dict(every=every, offset=0, invert=invert, on=name != "none")

    ring = lambda kind, name, **kw: complete(RING_BASE, dict(kind=KINDS.index(kind), name=name, c=ink, **kw))
    typ = dict(family=o["ty_family"], ps=o["ty_ps"], size=o["ty_size"], tracking=o["ty_tracking"],
               lang=o["ty_lang"], axes=o["ty_axes"], features=o["ty_features"])
    nudge = {("0" if k == "12" else str(int(k))): v for k, v in o["nu_nudge"].items()}
    rings = [
        ring("numerals", "Numerals", r=o["nu_r"], count=12, labels=o["nu_set"], custom=o["nu_custom"],
             mode=o["nu_mode"], nudge=nudge, **typ,
             **show(["all", "cardinals", "non-cardinals", "12 only", "12 & 6", "none"][o["nu_at"]])),
        ring("markers", "Markers", r=t_out if rule == "one ring" else t_in - o["mk_offset"], count=12,
             shape=o["mk_shape"], file=o["mk_svg"], len=o["mk_len"], w=o["mk_w"], taper=o["mk_taper"],
             round_out=o["mk_round_out"], round_in=o["mk_round_in"], wall=o["mk_wall"],
             twelve=o["mk_twelve"], twelve_scale=o["mk_twelve_scale"], twelve_gap=o["mk_twelve_gap"],
             **show(["all", "cardinals", "non-cardinals", "12 only", "none"][o["mk_at"]])),
        ring("ticks", "Minute ticks", r=t_out, count=60, len=o["tr_len"], w=o["tr_w"],
             skip=skip, knock=knock, clear=clear),
    ]
    div = [60, 120, 240, 300][o["tr_div"]]
    if div > 60:
        rings.append(ring("ticks", "Fine ticks", r=t_out, count=div, len=o["tr_minor_len"],
                          w=o["tr_w"] * o["tr_minor_w"], skip=3, knock=knock, clear=clear))
    if o["tr_rail"]:
        rw = o["tr_rail_w"]
        rings.append(ring("band", "Outer rail", r=t_out, count=1, width=rw, knock=knock, clear=clear))
        rings.append(ring("band", "Inner rail", r=t_in + rw, count=1, width=rw, knock=knock, clear=clear))

    style = ["baton", "dauphine", "sword", "leaf", "file"][o["ha_style"]]
    hand = lambda **kw: complete(HAND_BASE, kw)
    def main_hand(pct, w, svg):
        L = pct / 100 * R
        return hand(shape=HAND_SHAPES.index(style), file=svg, fit=False, len=L, w=w,
                    tail=o["ha_tail"] / 100 * L, tip=0.25 * L, feature_at=18.0, c=o["c_hands"])
    sec_file = o["ha_svg_sec"] if style == "file" else ""
    return dict(
        version=2, dial_d=o["dial_d"], margin=o["margin"], guides=o["guides"],
        c_plate=o["c_plate"], c_backdrop=o["c_backdrop"], rings=rings,
        ha_on=o["ha_on"], ha_beat=o["ha_beat"], ha_cap=o["ha_cap"], c_cap=o["c_accent"],
        ha_hour=main_hand(o["ha_hour_len"], o["ha_hour_w"], o["ha_svg_hour"]),
        ha_minute=main_hand(o["ha_min_len"], o["ha_min_w"], o["ha_svg_min"]),
        ha_second=hand(on=o["ha_sec_on"], shape=HAND_SHAPES.index("file" if sec_file else "baton"),
                       file=sec_file, fit=False, len=o["ha_sec_len"] / 100 * R, w=o["ha_sec_w"],
                       tail=R * 0.22, counter=0.0 if sec_file else o["ha_counter"], c=o["c_accent"]),
        **{k: o[k] for k in ("da_on", "da_at", "da_r", "da_w", "da_h", "da_round", "da_frame",
                             "da_day", "da_size", "t", "out_production", "out_mirror", "out_dpi",
                             "out_seconds", "out_fps")},
        da_clear=clear, da_ink=ink,
        ui_section=[0, 1, 1, 1, 1, 2, 3, 4][o["ui_section"]],
    )

_start = from_beta1({})
for _k in ("rings", "ha_hour", "ha_minute", "ha_second"):
    DEFAULTS[_k] = _start[_k]
OLD_ONLY = set(BETA1_DEFAULTS) - set(DEFAULTS)

def fresh_settings(over=None):
    """DEFAULTS + saved or partial settings. beta 1.0 settings are converted first (R8)."""
    over = dict(over or {})
    if "rings" not in over and OLD_ONLY & set(over):
        over = from_beta1(over)
    S = json.loads(json.dumps(DEFAULTS))
    for k, v in over.items():
        if k in S:
            S[k] = json.loads(json.dumps(v))
    S["rings"] = [complete(RING_BASE, r) for r in S["rings"]] or [complete(RING_BASE, {})]
    for h in HANDS:
        S["ha_" + h] = complete(HAND_BASE, S["ha_" + h])
    S["ui_ring"] = min(max(int(S["ui_ring"]), 0), len(S["rings"]) - 1)
    return S


# ═════════════════════════════════════════════════════════════
#  2 · GEOMETRY
# ═════════════════════════════════════════════════════════════

# ── basics ───────────────────────────────────────────────────

NOTES = []                                            # messages for the Export log (R17)

def note(message):
    if message not in NOTES:
        NOTES.append(message)

def clock_point(r, a):
    """point at radius r, clock angle a."""
    return (r * sin(radians(a)), r * cos(radians(a)))

def place(p, r, a):
    """a shape drawn upright at the origin → pushed out to radius r, turned to clock angle a."""
    p.translate(0, r)
    p.rotate(-a, center=(0, 0))                       # DrawBot turns counter-clockwise (R2)
    return p

def circle(d):
    p = BezierPath()
    p.oval(-d / 2, -d / 2, d, d)
    return p

def merge(paths):
    out = BezierPath()
    for p in paths:
        if p is not None:
            out.appendPath(p)
    return out

def empty(p):
    return p is None or p.bounds() is None

def poly(points, radii=None):
    """closed polygon; radii[i] rounds corner i with a true fillet (tangent arc)."""
    n = len(points)
    radii = radii or [0] * n
    segs = []
    for i in range(n):
        P, A, B, r = points[i], points[i - 1], points[(i + 1) % n], radii[i]
        ux, uy = A[0] - P[0], A[1] - P[1]
        vx, vy = B[0] - P[0], B[1] - P[1]
        la, lb = hypot(ux, uy), hypot(vx, vy)
        if r <= 0 or la < 1e-9 or lb < 1e-9:
            segs.append((P,)); continue
        ux, uy, vx, vy = ux / la, uy / la, vx / lb, vy / lb
        theta = acos(max(-1.0, min(1.0, ux * vx + uy * vy)))      # inside angle
        if theta < 1e-3 or theta > pi - 1e-3:
            segs.append((P,)); continue
        d = r / tan(theta / 2)                                    # cut-back along each edge
        dmax = min(la, lb) / 2
        if d > dmax:
            d, r = dmax, dmax * tan(theta / 2)
        S = (P[0] + ux * d, P[1] + uy * d)
        E = (P[0] + vx * d, P[1] + vy * d)
        h = 4 / 3 * tan((pi - theta) / 4) * r                     # bezier handle for that arc
        segs.append((S, (S[0] - ux * h, S[1] - uy * h), (E[0] - vx * h, E[1] - vy * h), E))
    p = BezierPath()
    p.moveTo(segs[0][0])
    for k, s in enumerate(segs):
        if k:
            p.lineTo(s[0])
        if len(s) == 4:
            p.curveTo(s[1], s[2], s[3])
    p.closePath()
    return p

def rounded_rect(w, h, r):
    return poly([(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)], [r] * 4)

def near(a, b, tol=1.0):
    return b is not None and abs((a - b + 180) % 360 - 180) < tol

def arc(p, r, a0, a1):
    """continue p along a circle of radius r, from clock angle a0 (where p is) to a1."""
    n = max(1, int(ceil(abs(a1 - a0) / 90 - 1e-9)))
    step = (a1 - a0) / n
    for k in range(n):
        u, v = radians(a0 + k * step), radians(a0 + (k + 1) * step)
        h = 4 / 3 * tan((v - u) / 4) * r                          # handle length for this piece
        x0, y0, x3, y3 = r * sin(u), r * cos(u), r * sin(v), r * cos(v)
        p.curveTo((x0 + h * cos(u), y0 - h * sin(u)), (x3 - h * cos(v), y3 + h * sin(v)), (x3, y3))

def sector(r_in, r_out, a0, a1):
    """the area between two radii and two clock angles. A full turn makes a ring; r_in 0 a pie."""
    r_in = max(r_in, 0.0)
    if r_out <= r_in:
        return None
    if a1 - a0 >= 360 - 1e-6:
        p = circle(2 * r_out)
        return p.difference(circle(2 * r_in)) if r_in > 1e-6 else p
    p = BezierPath()
    p.moveTo(clock_point(r_out, a0))
    arc(p, r_out, a0, a1)
    if r_in > 1e-6:
        p.lineTo(clock_point(r_in, a1))
        arc(p, r_in, a1, a0)
    else:
        p.lineTo((0, 0))
    p.closePath()
    return p

def offset(p, d):
    """the same shape grown (d > 0) or shrunk (d < 0) by d mm, corners rounded."""
    if empty(p) or abs(d) < 1e-6:
        return p
    band = p.expandStroke(2 * abs(d))                              # a band of width 2|d| along the outline
    return p.union(band) if d > 0 else p.difference(band)

_memo = {}

def memo(key, build):
    """remember a result by its inputs, so editing one ring doesn't rebuild the others."""
    if key not in _memo:
        if len(_memo) > 600:
            _memo.clear()
        _memo[key] = build()
    return _memo[key]

def file_stamp(path):
    return os.path.getmtime(path) if path and os.path.exists(path) else None

def key_of(d, skip=("c", "name")):
    """a settings dict as text, without colour and name; files by modification time."""
    k = {a: b for a, b in d.items() if a not in skip}
    k["_file"] = file_stamp(d.get("file"))
    return json.dumps(k, sort_keys=True)


# ── imported files: SVG, PDF, AI (R23) ───────────────────────
#   Draw pointing up (12 o'clock); the artboard's centre is the anchor
#   (pivot for hands). Fills are ink, white fills cut, strokes become
#   outlines; text, images and gradients are skipped and reported.

_file_cache = {}

def file_shape(path):
    """an SVG, PDF or AI file → one filled shape in mm, anchor at the origin."""
    if not path:
        return None
    if not os.path.exists(path):
        note(f"file not found: {path}")
        return None
    key = (path, os.path.getmtime(path))
    if key not in _file_cache:
        try:
            ext = os.path.splitext(path)[1].lower()
            _file_cache[key] = svg_path(path) if ext == ".svg" else pdf_path(path)
        except Exception as e:
            note(f"couldn't read {os.path.basename(path)}: {e}")
            _file_cache[key] = None
    p = _file_cache[key]
    return None if p is None else p.copy()

def svg_path(path):
    from fontTools.svgLib.path import SVGPath
    from fontTools.pens.recordingPen import RecordingPen
    svg = SVGPath(path)
    rec = RecordingPen()                              # neutral pen: SVG arcs become curves
    svg.draw(rec)
    p = BezierPath()
    rec.replay(p)
    vb = svg.root.get("viewBox")
    if vb:
        x, y, w, h = [float(v) for v in vb.replace(",", " ").split()]
    else:
        x0, y0, x1, y1 = p.bounds()
        x, y, w, h = x0, y0, x1 - x0, y1 - y0
    p.translate(-(x + w / 2), -(y + h / 2))           # anchor → origin
    p.scale(MM_PER_PT, -MM_PER_PT)                    # points → mm, flip y (SVG is y-down)
    return p


class PDFPainter:
    """PDF drawing operators → one filled shape (in points, page space).

    Fills add ink, white fills cut, strokes are outlined (R4). Clipping is
    ignored; text, images and gradients are skipped and listed in .skipped.
    UI-free and Mac-free, so the harness can test it with plain operators.
    """
    CAPS, JOINS = ("butt", "round", "square"), ("miter", "round", "bevel")

    def __init__(self):
        self.ctm, self.saved = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0), []
        self.lw, self.cap, self.join = 1.0, 0, 0
        self.fill_white = self.stroke_white = False
        self.subpaths, self.last = [], (0.0, 0.0)
        self.shape, self.skipped = BezierPath(), set()

    def xy(self, x, y):
        a, b, c, d, e, f = self.ctm
        return (a * x + c * y + e, b * x + d * y + f)

    def op(self, name, v):
        """one operator with its numbers, e.g. op("re", [0, 0, 10, 20])."""
        if name == "q":
            self.saved.append((self.ctm, self.lw, self.cap, self.join, self.fill_white, self.stroke_white))
        elif name == "Q" and self.saved:
            self.ctm, self.lw, self.cap, self.join, self.fill_white, self.stroke_white = self.saved.pop()
        elif name == "cm":
            a, b, c, d, e, f = v
            A, B, C, D, E, F = self.ctm
            self.ctm = (a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D,
                        e * A + f * C + E, e * B + f * D + F)
        elif name == "w":
            self.lw = v[0]
        elif name in ("J", "j"):
            setattr(self, "cap" if name == "J" else "join", int(v[0]) % 3)
        elif name in ("g", "G", "rg", "RG", "k", "K"):
            white = all(x >= 0.999 for x in v) if name.lower() != "k" else all(x <= 0.001 for x in v)
            setattr(self, "fill_white" if name.islower() else "stroke_white", white)
        elif name in ("sc", "scn"):
            self.fill_white = False                   # colour space unknown: count it as ink
        elif name in ("SC", "SCN"):
            self.stroke_white = False
        elif name == "m":
            self.last = self.xy(*v)
            self.subpaths.append([self.last, [], False])
        elif name in ("l", "c", "v", "y"):
            if not self.subpaths or self.subpaths[-1][2]:
                self.subpaths.append([self.last, [], False])
            pts = [self.xy(v[i], v[i + 1]) for i in range(0, len(v), 2)]
            if name == "v":                           # first handle sits on the current point
                pts = [self.last] + pts
            elif name == "y":                         # second handle sits on the end point
                pts = pts + pts[-1:]
            self.subpaths[-1][1].append(("l" if name == "l" else "c",) + tuple(pts))
            self.last = pts[-1]
        elif name == "h":
            if self.subpaths:
                self.subpaths[-1][2] = True
                self.last = self.subpaths[-1][0]
        elif name == "re":
            x, y, w, h = v
            for k, (px, py) in enumerate(((x, y), (x + w, y), (x + w, y + h), (x, y + h))):
                self.op("m" if k == 0 else "l", [px, py])
            self.op("h", [])
        elif name in ("f", "F", "f*", "B", "B*", "b", "b*", "S", "s", "n"):
            if name in ("b", "b*", "s"):
                self.op("h", [])
            if name not in ("S", "s", "n"):
                self._paint(self._fill_path("*" in name), self.fill_white)
            if name in ("S", "s", "B", "B*", "b", "b*"):
                self._stroke()
            self.subpaths = []
        elif name == "BT":
            self.skipped.add("text")
        elif name in ("BI", "image"):
            self.skipped.add("images")
        elif name == "sh":
            self.skipped.add("gradients")

    def _path(self, closed, subpaths=None):
        p = BezierPath()
        for start, segs, was_closed in (self.subpaths if subpaths is None else subpaths):
            if not segs:
                continue
            p.moveTo(start)
            for s in segs:
                if s[0] == "l":
                    p.lineTo(s[1])
                else:
                    p.curveTo(s[1], s[2], s[3])
            if closed or was_closed:
                p.closePath()
            else:
                p.endPath()
        return p

    def _fill_path(self, even_odd):
        if not even_odd:
            p = self._path(True)
            if not empty(p):
                p.removeOverlap()                     # non-zero winding, like the PDF
            return p
        out = None                                    # even-odd: each part flips inside/outside
        for sp in self.subpaths:
            one = self._path(True, [sp])
            if not empty(one):
                out = one if out is None else out.xor(one)
        return out

    def _stroke(self):
        p = self._path(False)
        if empty(p):
            return
        a, b, c, d = self.ctm[:4]
        width = max(self.lw, 0.1) * (sqrt(abs(a * d - b * c)) or 1)
        self._paint(p.expandStroke(width, lineCap=self.CAPS[self.cap], lineJoin=self.JOINS[self.join]),
                    self.stroke_white)

    def _paint(self, p, white):
        if empty(p):
            return
        if white:
            if not empty(self.shape):
                self.shape = self.shape.difference(p)
        else:
            self.shape = p if empty(self.shape) else self.shape.union(p)


PDF_NUMBERS = dict(cm=6, w=1, J=1, j=1, g=1, G=1, rg=3, RG=3, k=4, K=4, m=2, l=2, c=6, v=4, y=4, re=4)
PDF_PLAIN = ("q", "Q", "h", "f", "F", "f*", "B", "B*", "b", "b*", "S", "s", "n", "BT", "BI", "sh",
             "sc", "scn", "SC", "SCN")

def pdf_path(path):
    """first page of a PDF (or an Illustrator file saved PDF-compatible) → shape in mm.
    Reads the page's drawing operators with macOS's PDF scanner (CoreGraphics)."""
    import Quartz
    url = Quartz.CFURLCreateWithFileSystemPath(None, path, Quartz.kCFURLPOSIXPathStyle, False)
    doc = Quartz.CGPDFDocumentCreateWithURL(url)
    if doc is None or Quartz.CGPDFDocumentGetNumberOfPages(doc) < 1:
        raise ValueError("not readable as PDF (Illustrator: save with 'Create PDF Compatible File')")
    page = Quartz.CGPDFDocumentGetPage(doc, 1)
    painter, table, keep = PDFPainter(), Quartz.CGPDFOperatorTableCreate(), []
    ok, res = Quartz.CGPDFDictionaryGetDictionary(Quartz.CGPDFPageGetDictionary(page), b"Resources", None)
    resources = [res if ok else None]

    def numbers_op(name, n):
        def callback(scanner, info):
            values = []
            for _ in range(n):
                ok, value = Quartz.CGPDFScannerPopNumber(scanner, None)
                if not ok:
                    return
                values.append(value)
            painter.op(name, values[::-1])            # operands come off the stack last-first
        return callback

    def plain_op(name):
        return lambda scanner, info: painter.op(name, [])

    def form_op(scanner, info):                       # "Do": a nested drawing (form) or an image
        ok, name = Quartz.CGPDFScannerPopName(scanner, None)
        res = resources[-1]
        if not ok or res is None or len(resources) > 8:
            return
        name = name if isinstance(name, bytes) else str(name).encode()
        ok, xobjects = Quartz.CGPDFDictionaryGetDictionary(res, b"XObject", None)
        if not ok:
            return
        ok, stream = Quartz.CGPDFDictionaryGetStream(xobjects, name, None)
        if not ok:
            return
        info_dict = Quartz.CGPDFStreamGetDictionary(stream)
        ok, subtype = Quartz.CGPDFDictionaryGetName(info_dict, b"Subtype", None)
        subtype = subtype.decode() if isinstance(subtype, bytes) else str(subtype)
        if subtype != "Form":
            painter.op("image", [])
            return
        matrix = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0]
        ok, array = Quartz.CGPDFDictionaryGetArray(info_dict, b"Matrix", None)
        if ok:
            for i in range(6):
                ok, value = Quartz.CGPDFArrayGetNumber(array, i, None)
                if ok:
                    matrix[i] = value
        ok, form_res = Quartz.CGPDFDictionaryGetDictionary(info_dict, b"Resources", None)
        form_res = form_res if ok else res
        content = Quartz.CGPDFContentStreamCreateWithStream(
            stream, form_res, Quartz.CGPDFScannerGetContentStream(scanner))
        inner = Quartz.CGPDFScannerCreate(content, table, None)
        resources.append(form_res)
        painter.op("q", [])
        painter.op("cm", matrix)
        Quartz.CGPDFScannerScan(inner)
        painter.op("Q", [])
        resources.pop()

    for name, n in PDF_NUMBERS.items():
        keep.append(numbers_op(name, n))
        Quartz.CGPDFOperatorTableSetCallback(table, name.encode(), keep[-1])
    for name in PDF_PLAIN:
        keep.append(plain_op(name))
        Quartz.CGPDFOperatorTableSetCallback(table, name.encode(), keep[-1])
    Quartz.CGPDFOperatorTableSetCallback(table, b"Do", form_op)
    scanner = Quartz.CGPDFScannerCreate(Quartz.CGPDFContentStreamCreateWithPage(page), table, None)
    Quartz.CGPDFScannerScan(scanner)

    box = Quartz.CGPDFPageGetBoxRect(page, Quartz.kCGPDFCropBox)            # the artboard
    p = painter.shape
    if empty(p):
        raise ValueError("no filled shapes found")
    p.translate(-(box.origin.x + box.size.width / 2), -(box.origin.y + box.size.height / 2))
    p.scale(MM_PER_PT)                                                       # PDF is y-up already
    if painter.skipped:
        note(f"{os.path.basename(path)}: skipped {', '.join(sorted(painter.skipped))} "
             "(outline text, expand appearance in Illustrator)")
    return p


# ── type: every numeral goes through DrawBot's styled string (R10) ──

TEST_FONT = None                                      # only used by the test harness

def type_kwargs(t, size):
    """t = a ring's type settings."""
    lang = LANGS[t["lang"]]
    return dict(font=t["ps"], fontSize=size, tracking=t["tracking"] / 1000 * size,
                openTypeFeatures=dict(t["features"]), fontVariations=dict(t["axes"]),
                language=None if lang == "default" else lang)

def text_path(txt, t, size):
    """text → outlines, with font, tracking, features, axes and language."""
    p = BezierPath()
    if FormattedString is not None:
        p.text(FormattedString(txt, **type_kwargs(t, size)))
    else:
        p.text(txt, font=TEST_FONT, fontSize=size)
    return p

def advance(txt, t, size):
    """typeset width, kerning and tracking included."""
    if not txt:
        return 0.0
    if FormattedString is not None:
        sz = FormattedString(txt, **type_kwargs(t, size)).size()
        return getattr(sz, "width", None) or sz[0]
    b = text_path(txt, t, size).bounds()
    return b[2] if b else 0.0

def centred(p):
    b = p.bounds()
    if b:
        p.translate(-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2)
    return p


# ── positions: where a ring puts things ──────────────────────

def ring_angles(ring):
    """clock angle of every position. Full turn: evenly round. Partial span: both ends marked.
    Bands: each position starts a segment, segments tile the span."""
    n = max(int(ring["count"]), 1)
    span = ring["span"]
    if kind_of(ring) == "band" or span >= 360:
        step = span / n
    else:
        step = span / (n - 1) if n > 1 else 0
    return [ring["start"] + i * step for i in range(n)]

def picked(ring, i):
    """the every / offset / skip-those-instead pattern."""
    hit = (i - int(ring["offset"])) % max(int(ring["every"]), 1) == 0
    return hit != bool(ring["invert"])


# ── ticks and markers ────────────────────────────────────────

def mark_outline(ring, L, W, shape=None, taper=None, grow=0.0, solid=False):
    """one mark centred on the origin, pointing outward (+y)."""
    shape = shape or SHAPES[ring["shape"]]
    taper = ring["taper"] if taper is None else taper
    wall = 0 if solid else ring["wall"]
    if shape == "file":
        p = file_shape(ring["file"])
        if p is not None:
            p.scale(ring["scale"])
            if wall > 0:
                p = p.difference(offset(p, -wall))
            return offset(p, grow) if grow else p
        shape = "bar"                                 # no file yet: a bar (R17)

    def outline(L, W, ro, ri):
        if shape == "dot":
            return circle(W)
        wi = W if shape == "bar" else W * taper       # width at the inner end
        if wi < 1e-3:                                 # taper 0 → triangle
            return poly([(0, -L / 2), (W / 2, L / 2), (-W / 2, L / 2)], [ri, ro, ro])
        return poly([(-wi / 2, -L / 2), (wi / 2, -L / 2), (W / 2, L / 2), (-W / 2, L / 2)],
                    [ri, ri, ro, ro])

    ro, ri = ring["round_out"], ring["round_in"]
    p = outline(L + 2 * grow, W + 2 * grow, ro + grow, ri + grow)
    if wall > 0 and W - 2 * wall > 0.01 and (shape == "dot" or L - 2 * wall > 0.01):
        p = p.difference(outline(L - 2 * wall, W - 2 * wall, max(ro - wall, 0), max(ri - wall, 0)))
    return p

def mark_at(ring, i, a, grow=0.0, solid=False):
    """the mark at position i: its outer end on the ring's radius."""
    first = kind_of(ring) == "markers" and i == 0
    style = TWELVES[ring["twelve"]] if first else "same"
    if style == "none":
        return None
    k = ring["twelve_scale"] if first else 1.0
    L, W = ring["len"] * k, ring["w"] * k
    if style == "triangle":
        shape = mark_outline(ring, L * 1.1, W * 2.4, shape="wedge", taper=0, grow=grow, solid=solid)
    else:
        shape = mark_outline(ring, L, W, grow=grow, solid=solid)
    b = shape.bounds()
    if b is None:
        return None
    extent, width = (b[3] - b[1]) - 2 * grow, (b[2] - b[0]) - 2 * grow
    r_mid = max(ring["r"] - extent / 2, 0.1)
    if style == "double":
        da = degrees((ring["twelve_gap"] + width) / 2 / r_mid)
        return merge([place(shape.copy(), r_mid, a - da), place(shape, r_mid, a + da)])
    return place(shape, r_mid, a)


# ── numerals ─────────────────────────────────────────────────

def number_label(v, digits):
    s = str(int(round(v))) if abs(v - round(v)) < 1e-9 else f"{v:g}"
    return s.zfill(int(digits)) if digits else s

def ring_labels(ring):
    """one label per position."""
    n = max(int(ring["count"]), 1)
    name, txt = LABEL_SETS[ring["labels"]]
    if name == "Custom":
        parts = [s.strip() for s in ring["custom"].split(",")]
        return (parts + [""] * n)[:n]
    if name == "Numbers":
        return [number_label(ring["num_from"] + i * ring["num_step"], ring["num_digits"]) for i in range(n)]
    parts = txt.split()
    return [parts[i % len(parts)] for i in range(n)]

def on_path(txt, r, a, t, size):
    """letters walk along the circle with real kerning; the bottom half flips to read left → right."""
    flip = 90 < a % 360 < 270
    tr = t["tracking"] / 1000 * size
    adv = [advance(txt[:i], t, size) for i in range(len(txt) + 1)]   # where each letter starts
    total = adv[-1] - tr
    whole = text_path(txt, t, size).bounds()
    yc = (whole[1] + whole[3]) / 2 if whole else 0                   # one baseline for all letters
    out = []
    for i, ch in enumerate(txt):
        if not ch.strip():
            continue
        g = text_path(ch, t, size)
        own = advance(ch, t, size) - tr
        c = adv[i] + own / 2 - total / 2                              # letter centre along the word
        g.translate(-own / 2, -yc)
        if flip:
            g.rotate(180)
            out.append(place(g, r, a - degrees(c / r)))
        else:
            out.append(place(g, r, a + degrees(c / r)))
    return merge(out)

def numeral_at(ring, i, a, label):
    mode = MODES[ring["mode"]]
    n = ring["nudge"].get(str(i), {})
    r, a = ring["r"] + n.get("dr", 0), a + n.get("da", 0)
    size, rot = ring["size"] * n.get("s", 1), n.get("rot", 0)
    if mode == "on path":
        p = on_path(label, r, a, ring, size)
        if rot:
            p.rotate(-rot, center=clock_point(r, a))
        return p
    p = centred(text_path(label, ring, size))
    if mode == "upright":
        p.rotate(-rot)
        p.translate(*clock_point(r, a))
    else:
        flip = 180 if (mode == "radial, auto-flip" and 90 < a % 360 < 270) else 0
        p.rotate(-(flip + rot))
        place(p, r, a)
    return p


# ── one ring ─────────────────────────────────────────────────

def ring_shapes(ring, keep, grow=0.0, solid=False):
    """→ (one shape, clock angles that got something). keep = the position indexes to draw.
    grow > 0 makes the outline used to knock out rings below."""
    def build():
        kind, angles = kind_of(ring), ring_angles(ring)
        parts, taken = [], []
        if kind in ("ticks", "markers"):
            for i in keep:
                m = mark_at(ring, i, angles[i], grow, solid)
                if m is not None:
                    parts.append(m)
                    taken.append(angles[i])
            out = merge(parts)
            out.removeOverlap()
            return out, taken
        if kind == "numerals":
            labels = ring_labels(ring)
            for i in keep:
                if labels[i]:
                    parts.append(numeral_at(ring, i, angles[i], labels[i]))
                    taken.append(angles[i])
        else:                                                      # band
            n = max(int(ring["count"]), 1)
            length = ring["span"] / n * min(max(ring["fill"], 0), 100) / 100
            for i in keep:
                parts.append(sector(ring["r"] - ring["width"], ring["r"], angles[i], angles[i] + length))
        out = merge(parts)
        return (offset(out, grow) if grow else out), taken
    return memo(("shapes", key_of(ring), tuple(keep), round(grow, 6), solid), build)

def date_angle(S):
    return DATE_AT[S["da_at"]][1] if S["da_on"] else None

def build_rings(S, cut=None):
    """every visible ring, top first: its positions, what it skips, what knocks it out.

    skip      — drop positions where the chosen rings above have a mark (bands have no positions).
    knock out — cut gaps (clearance) round the shapes of the chosen rings above.
    cut       — the date window's clear zone; markers and numerals also leave its position empty.
    """
    dA, done = date_angle(S), []
    for ring in S["rings"]:
        if not ring["on"]:
            continue
        kind, angles = kind_of(ring), ring_angles(ring)
        keep = [i for i in range(len(angles)) if picked(ring, i)]
        if dA is not None and kind in ("markers", "numerals"):
            keep = [i for i in keep if not near(angles[i], dA)]
        if ring["skip"]:
            taken = [a for d in done if d["kind"] in FROM_KINDS[ring["skip"]] for a in d["taken"]]
            keep = [i for i in keep if not any(near(angles[i], a, 0.01) for a in taken)]
        shape, taken = ring_shapes(ring, keep)
        sources = [d for d in done if d["kind"] in FROM_KINDS[ring["knock"]]]

        def final():
            out = shape
            if sources and not empty(out):
                cutter = merge([ring_shapes(d["ring"], d["keep"], grow=ring["clear"], solid=True)[0]
                                for d in sources])
                if not empty(cutter):
                    cutter.removeOverlap()
                    out = out.difference(cutter)
            if cut is not None and not empty(out):
                out = out.difference(cut)
            return out

        key = ("final", key_of(ring), tuple(keep),
               tuple((key_of(d["ring"]), tuple(d["keep"])) for d in sources), date_key(S) if cut else None)
        done.append(dict(ring=ring, kind=kind, keep=keep, taken=taken, path=memo(key, final)))
    return done


# ── date window ──────────────────────────────────────────────

def date_key(S):
    return json.dumps({k: v for k, v in S.items() if k.startswith("da_") and k != "da_ink"}, sort_keys=True)

def date_type(S):
    """the date's text uses the type of the top numerals ring."""
    for ring in S["rings"]:
        if kind_of(ring) == "numerals":
            return ring
    return RING_BASE

def date_window(S, grow=0.0):
    p = rounded_rect(S["da_w"] + 2 * grow, S["da_h"] + 2 * grow, S["da_round"] + grow)
    p.translate(*clock_point(S["da_r"], date_angle(S)))
    return p

def build_date(S):
    if date_angle(S) is None:
        return None
    win = date_window(S)
    f = S["da_frame"]
    num = centred(text_path(S["da_day"], date_type(S), S["da_h"] * S["da_size"] / 100))
    num.translate(*clock_point(S["da_r"], date_angle(S)))
    return dict(window=win,
                frame=date_window(S, f).difference(win) if f > 0 else None,
                cutline=date_window(S, 0.05).difference(win),      # aperture outline for production
                number=num)


# ── everything that doesn't move ─────────────────────────────

def build_static(S):
    date = build_date(S)
    cut = date_window(S, S["da_frame"] + S["da_clear"]) if date else None   # keep print clear of the hole
    plate = circle(S["dial_d"])
    if date:
        plate = plate.difference(date["window"])
    return dict(plate=plate, rings=build_rings(S, cut), date=date)


# ── hands ────────────────────────────────────────────────────

COUNTER_AT = 0.16 / 0.22      # counterweight centre, as a share of the tail (beta 1.0's proportion)

def hand_angles(t, beats_per_second=0):
    t %= 43200
    s = t % 60
    if beats_per_second:
        s = int(s * beats_per_second) / beats_per_second
    return t / 43200 * 360, (t % 3600) / 3600 * 360, s / 60 * 360

def hand_outline(shape, L, W, T, tip, F, at):
    """drawn pointing at 12, pivot at the origin. T tail, tip point length,
    F head / barrel width or ring / disc Ø, at = where that feature sits."""
    p = BezierPath()
    tip = min(max(tip, 0), L)
    if shape == "baton":
        p.rect(-W / 2, -T, W, L + T)
    elif shape == "pencil":
        p = poly([(-W / 2, -T), (W / 2, -T), (W / 2, L - tip), (0, L), (-W / 2, L - tip)])
    elif shape == "sword":
        p.polygon((0, L), (W / 2, L - tip), (W * 0.4, -T), (-W * 0.4, -T), (-W / 2, L - tip))
    elif shape == "dauphine":
        p.polygon((0, L), (W / 2, at), (0, -T), (-W / 2, at))
    elif shape == "leaf":
        k = 0.55
        p.moveTo((0, -T))
        p.curveTo((W * k, L * 0.15), (W * k, L * 0.6), (0, L))
        p.curveTo((-W * k, L * 0.6), (-W * k, L * 0.15), (0, -T))
        p.closePath()
    elif shape == "arrow":
        p.rect(-W / 2, -T, W, L - tip + T)
        head = BezierPath()
        head.polygon((-F / 2, L - tip), (F / 2, L - tip), (0, L))
        p = p.union(head)
    elif shape == "syringe":
        p.rect(-W / 2, -T, W, min(at, L - tip) + T)                # thin shaft
        needle = BezierPath()
        needle.polygon((-W / 2, L - tip), (W / 2, L - tip), (0, L))
        p = p.union(needle)
        if L - tip > at:                                           # wider barrel between them
            barrel = BezierPath()
            barrel.rect(-F / 2, at, F, L - tip - at)
            p = p.union(barrel)
    elif shape == "breguet":
        p = poly([(-W / 2, -T), (W / 2, -T), (W / 2, L - tip), (0, L), (-W / 2, L - tip)])
        ring = circle(F)
        ring.translate(0, at)
        p = p.union(ring)
        if F - 2 * W > 0.02:
            hole = circle(F - 2 * W)
            hole.translate(0, at)
            p = p.difference(hole)
    elif shape == "lollipop":
        p.rect(-W / 2, -T, W, L + T)
        disc = circle(F)
        disc.translate(0, at)
        p = p.union(disc)
    return p

def hand_shape(h):
    """one hand, upright, remembered until its settings change (only turning happens per frame)."""
    def build():
        shape = HAND_SHAPES[h["shape"]]
        L = h["len"]
        p = None
        if shape == "file":
            p = file_shape(h["file"])
            if p is not None:
                b = p.bounds()
                k = L / b[3] if (h["fit"] and b and b[3] > 1e-6) else h["scale"]
                p.scale(k * h["w_scale"], k)
            else:
                shape = "baton"                                    # no file yet (R17)
        if p is None:
            p = hand_outline(shape, L, h["w"], h["tail"], h["tip"], h["feature"], h["feature_at"] / 100 * L)
        if h["wall"] > 0:
            p = p.difference(offset(p, -h["wall"]))
        if h["counter"] > 0:
            p = p.union(place(circle(h["counter"]), -h["tail"] * COUNTER_AT, 0))
        return p
    return memo(("hand", key_of(h)), build)

def build_hands(S, t):
    """[(colour, shape)] for hour, minute, seconds, then the cap."""
    angles = hand_angles(t, BEATS[S["ha_beat"]][1])
    out = []
    for name, a in zip(HANDS, angles):
        h = S["ha_" + name]
        if h["on"]:
            p = hand_shape(h).copy()
            p.rotate(-a)
            out.append((h["c"], p))
    if S["ha_cap"] > 0:
        out.append((S["c_cap"], circle(S["ha_cap"])))
    return out


# ═════════════════════════════════════════════════════════════
#  3 · DRAWING  — D is a DrawBot drawing engine
# ═════════════════════════════════════════════════════════════

def draw_page(D, S, static, t, preview=True, selected=None):
    """selected = index of the ring being edited; its guides are drawn stronger."""
    size = (S["dial_d"] + 2 * S["margin"]) * MM
    D.newPage(size, size)
    production = S["out_production"]
    if preview and not production:
        D.fill(*S["c_backdrop"])
        D.rect(0, 0, size, size)
    D.translate(size / 2, size / 2)
    D.scale(MM)                                                    # from here on: millimetres
    if S["out_mirror"]:
        D.scale(-1, 1)                                             # for toner transfer
    D.stroke(None)
    date = static["date"]
    rings = static["rings"][::-1]                                  # bottom ring first, top ring last

    if production:                                                 # mono mask, no plate, no hands
        D.fill(0, 0, 0, 1)
        for d in rings:
            D.drawPath(d["path"])
        if date:
            if date["frame"]:
                D.drawPath(date["frame"])
            D.drawPath(date["cutline"])
    else:
        if date:                                                   # date disc, seen through the hole
            D.fill(1, 1, 1, 1)
            D.drawPath(date["window"])
            D.fill(*S["da_ink"])
            D.drawPath(date["number"])
        D.fill(*S["c_plate"])
        D.drawPath(static["plate"])
        for d in rings:
            D.fill(*d["ring"]["c"])
            D.drawPath(d["path"])
        if date and date["frame"]:
            D.fill(*S["da_ink"])
            D.drawPath(date["frame"])
        if S["ha_on"]:
            for colour, p in build_hands(S, t):
                D.fill(*colour)
                D.drawPath(p)

    if preview and S["guides"]:                                    # never exported (R5)
        R = S["dial_d"] / 2
        D.fill(None)
        D.strokeWidth(0.03)
        D.stroke(0.0, 0.55, 0.9, 0.5)
        for r in (R,) + ((S["da_r"],) if date else ()):
            D.oval(-r, -r, 2 * r, 2 * r)
        D.line((-R, 0), (R, 0))
        D.line((0, -R), (0, R))
        for i, ring in enumerate(S["rings"]):
            if not ring["on"]:
                continue
            kind = kind_of(ring)
            inner = {"ticks": ring["len"], "markers": ring["len"], "band": ring["width"]}.get(kind, 0)
            if i == selected:
                D.stroke(1.0, 0.45, 0.0, 0.95)
                D.strokeWidth(0.05)
            else:
                D.stroke(0.0, 0.55, 0.9, 0.35)
                D.strokeWidth(0.03)
            for r in {ring["r"], ring["r"] - inner}:
                if r > 0:
                    D.oval(-r, -r, 2 * r, 2 * r)
        D.stroke(None)


# ═════════════════════════════════════════════════════════════
#  4 · INTERFACE
# ═════════════════════════════════════════════════════════════

try:
    import objc, AppKit, CoreText, Quartz
    from vanilla import (Window, Group, TextBox, Slider, EditText, Stepper, ComboBox, PopUpButton,
                         CheckBox, ColorWell, SegmentedButton, List, CheckBoxListCell, TextEditor,
                         Button, GridView, ScrollView)
    from vanilla.dialogs import getFile, putFile
    from drawBot.drawBotDrawingTools import DrawBotDrawingTool
    from drawBot.ui.drawView import DrawView
    HAVE_UI = True
except ImportError:
    HAVE_UI = False

FlippedView = None
if HAVE_UI:
    try:
        FlippedView = objc.lookUpClass("DialToolFlippedView")     # made by an earlier run (⌘R again)
    except objc.nosuchclass_error:
        try:
            class DialToolFlippedView(AppKit.NSView):
                """y grows downward, so a short list sits at the top of its scroll view."""
                def isFlipped(self):
                    return True
            FlippedView = DialToolFlippedView
        except Exception as e:
            note(f"no scrolling for the ring settings ({e})")

SIZE = "regular"                                                   # control size: "regular" or "small"

SUPPORT = os.path.expanduser("~/Library/Application Support/DialTool")
LAST_SESSION = os.path.join(SUPPORT, "last.json")

FEATURE_NAMES = dict(
    kern="kerning", liga="ligatures", calt="contextual alternates", dlig="discretionary ligatures",
    tnum="tabular figures", pnum="proportional figures", onum="oldstyle figures",
    lnum="lining figures", zero="slashed zero", frac="fractions", sups="superscript",
    subs="subscript", sinf="scientific inferiors", ordn="ordinals", smcp="small caps",
    c2sc="caps to small caps", case="case-sensitive forms", salt="stylistic alternates",
    swsh="swash", titl="titling", ccmp="glyph composition", locl="localized forms",
    mark="mark positioning", mkmk="mark to mark", aalt="access all alternates",
    cpsp="capital spacing", hist="historical forms", ornm="ornaments")
DEFAULT_ON = {"kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "rlig", "rclt", "curs", "clig"}


# ── small helpers ────────────────────────────────────────────

def parse_number(text, current):
    """'1.2' absolute · '+0.5' add · 'x0.5' multiply · '/2' divide"""
    s = str(text).strip().replace(",", ".").replace("×", "x")
    try:
        if s[:1] == "+":
            return current + float(s[1:])
        if s[:1] in ("x", "*"):
            return current * float(s[1:])
        if s[:1] == "/":
            return current / float(s[1:])
        return float(s)
    except (ValueError, ZeroDivisionError):
        return None

def fmt(v, step):
    if step >= 1:
        return f"{v:.0f}"
    if step >= 0.1:
        return f"{v:.1f}"
    return f"{v:.2f}"

def parse_time(text):
    try:
        parts = [float(x) for x in str(text).split(":") if x.strip()]
    except ValueError:
        return None
    h, m, s = (parts + [0, 0, 0])[:3]
    return (h % 12) * 3600 + m * 60 + s

def fmt_time(t):
    t %= 43200
    h, m, s = int(t // 3600), int(t % 3600 // 60), int(t % 60)
    return f"{h or 12}:{m:02d}:{s:02d}"

def to_ns(c):
    return AppKit.NSColor.colorWithSRGBRed_green_blue_alpha_(*c)

def from_ns(color):
    c = color.colorUsingColorSpace_(AppKit.NSColorSpace.sRGBColorSpace())
    return [c.redComponent(), c.greenComponent(), c.blueComponent(), c.alphaComponent()]

def font_families():
    fm = AppKit.NSFontManager.sharedFontManager()
    return sorted((str(f) for f in fm.availableFontFamilies() if not str(f).startswith(".")), key=str.lower)

def font_styles(family):
    """[(style name, PostScript name)]"""
    members = AppKit.NSFontManager.sharedFontManager().availableMembersOfFontFamily_(family) or []
    return [(str(m[1]), str(m[0])) for m in members]

def designer_feature_names(ps):
    """names a type designer gave to ss01…ss20 / cv01… inside the font file."""
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
    except Exception:
        pass
    return names

def unique_titles(titles):
    """popup menus drop repeated titles, so number the repeats."""
    seen, out = set(), []
    for i, t in enumerate(titles):
        t = t or "·"
        if t in seen:
            t = f"{t}  ({i + 1})"
        seen.add(t)
        out.append(t)
    return out

def label(text):
    return TextBox("auto", f"{text}:" if text else "", alignment="right", sizeStyle=SIZE)

def fill_equally(segmented_button):
    try:
        segmented_button.getNSSegmentedButton().setSegmentDistribution_(AppKit.NSSegmentDistributionFillEqually)
    except Exception:
        pass                                                       # older macOS: segments keep their own width

def tabs_left(segmented_button):
    """tab-like switchers: titles aligned left (macOS 10.13+)."""
    try:
        ns = segmented_button.getNSSegmentedButton()
        for i in range(ns.segmentCount()):
            ns.setAlignment_forSegment_(getattr(AppKit, "NSTextAlignmentLeft", 0), i)
    except Exception:
        pass

def segmented(items, callback, momentary=False, pos="auto", tabs=False):
    c = SegmentedButton(pos, [dict(title=t) for t in items], callback=callback, sizeStyle=SIZE,
                        selectionStyle="momentary" if momentary else "one")
    fill_equally(c)
    if tabs:
        tabs_left(c)
    return c

def scroll_document(group):
    """a flipped view holding a vanilla Group; the group's content decides its height."""
    doc = FlippedView.alloc().initWithFrame_(((0, 0), (100, 100)))
    doc.setTranslatesAutoresizingMaskIntoConstraints_(False)
    view = group.getNSView()
    view.setTranslatesAutoresizingMaskIntoConstraints_(False)
    doc.addSubview_(view)
    AppKit.NSLayoutConstraint.activateConstraints_([
        view.topAnchor().constraintEqualToAnchor_(doc.topAnchor()),
        view.bottomAnchor().constraintEqualToAnchor_(doc.bottomAnchor()),
        view.leadingAnchor().constraintEqualToAnchor_(doc.leadingAnchor()),
        view.trailingAnchor().constraintEqualToAnchor_(doc.trailingAnchor())])
    return doc

def pin_document(scroll):
    """the document starts at the scroll view's top and is as wide as it; only its height scrolls."""
    sv = scroll.getNSScrollView()
    sv.setBorderType_(AppKit.NSNoBorder)
    clip, doc = sv.contentView(), sv.documentView()
    AppKit.NSLayoutConstraint.activateConstraints_([
        doc.topAnchor().constraintEqualToAnchor_(clip.topAnchor()),
        doc.leadingAnchor().constraintEqualToAnchor_(clip.leadingAnchor()),
        doc.trailingAnchor().constraintEqualToAnchor_(clip.trailingAnchor())])

def blank():
    return TextBox("auto", "")

def bold(text):
    t = TextBox("auto", text, sizeStyle=SIZE)
    size = AppKit.NSFont.systemFontSize() if SIZE == "regular" else AppKit.NSFont.smallSystemFontSize()
    t.getNSTextField().setFont_(AppKit.NSFont.boldSystemFontOfSize_(size))
    return t


# ── one number = label · slider · typed field · stepper (R15) ─

class Param:
    def __init__(self, text, lo, hi, value, step, on_change, whole=False):
        self.step, self.on_change, self.whole = step, on_change, whole
        self.value = value
        self.lo, self.hi = min(lo, value), max(hi, value)
        self.slider = Slider("auto", minValue=self.lo, maxValue=self.hi, value=value,
                             callback=self._slid, sizeStyle=SIZE)
        self.field = EditText("auto", fmt(value, step), continuous=False,
                              callback=self._typed, sizeStyle=SIZE)
        self.stepper = Stepper("auto", value=value, minValue=-1e6, maxValue=1e6, increment=step,
                               callback=self._stepped, sizeStyle=SIZE)
        self.row = [label(text), self.slider, self.field, self.stepper]

    def _slid(self, sender):
        self.set(round(sender.get() / self.step) * self.step, sender)

    def _stepped(self, sender):
        self.set(sender.get(), sender)

    def _typed(self, sender):
        v = parse_number(sender.get(), self.value)
        if v is None:
            sender.set(fmt(self.value, self.step))
            return
        self.set(v, sender)

    def set(self, v, source=None, quiet=False):
        if self.whole:
            v = int(round(v))
        if v > self.hi:                                            # past the end extends the slider
            self.hi = v
            self.slider.setMaxValue(v)
        if v < self.lo:
            self.lo = v
            self.slider.setMinValue(v)
        self.value = v
        if source is not self.slider:
            self.slider.set(v)
        self.field.set(fmt(v, self.step))
        if source is not self.stepper:
            self.stepper.set(v)
        if not quiet:
            self.on_change(v)


# ── interface description: one line per row ──────────────────
#   scope: which settings a row edits — "global" (S), "ring" (the selected
#   ring) or "hand" (the selected hand). show(target) hides rows that don't apply (R16).

def num(key, text, lo, hi, step, show=None, whole=False, scope=None):
    return dict(kind="num", key=key, text=text, lo=lo, hi=hi, step=step, show=show, whole=whole, scope=scope)
def pop(key, text, items, show=None, scope=None): return dict(kind="pop", key=key, text=text, items=items, show=show, scope=scope)
def seg(key, text, items, show=None, scope=None, tabs=False):
    return dict(kind="seg", key=key, text=text, items=items, show=show, scope=scope, tabs=tabs)
def chk(key, text, show=None, scope=None):        return dict(kind="chk", key=key, text=text, show=show, scope=scope)
def col(key, text, show=None, scope=None):        return dict(kind="col", key=key, text=text, show=show, scope=scope)
def txt(key, text, show=None, scope=None):        return dict(kind="txt", key=key, text=text, show=show, scope=scope)
def fil(key, text, show=None, scope=None):        return dict(kind="file", key=key, text=text, show=show, scope=scope)
def bar(text, items, action, show=None):          return dict(kind="bar", text=text, items=items, action=action, show=show)
def hdr(text, show=None):                         return dict(kind="hdr", text=text, show=show)
def note_row(text, show=None):                    return dict(kind="note", text=text, show=show)
def custom(name, show=None):                      return dict(kind="custom", name=name, show=show)

is_ = lambda key, *values: (lambda T: T[key] in values)
kind_in = lambda *names: (lambda R: kind_of(R) in names)
marks_with = lambda *shapes: (lambda R: kind_of(R) in ("ticks", "markers") and SHAPES[R["shape"]] in shapes)
labels_are = lambda name: (lambda R: kind_of(R) == "numerals" and LABEL_SETS[R["labels"]][0] == name)
hand_is = lambda *shapes: (lambda H: HAND_SHAPES[H["shape"]] in shapes)

DIAL_ROWS = [
    num("dial_d", "Diameter", 15, 50, 0.1),
    num("margin", "Page margin", 0, 10, 0.5),
    hdr("Colour"),
    col("c_plate", "Plate"), col("c_backdrop", "Backdrop"),
]

numerals_only = kind_in("numerals")

RING_ROWS = [                                                      # one list; rows that don't apply hide (R16)
    pop("kind", "Kind", KINDS),
    col("c", "Colour"),
    num("r", "Outer radius", 0, 25, 0.05, show=kind_in("ticks", "markers", "band")),
    num("r", "Centre radius", 0, 25, 0.05, show=kind_in("numerals")),
    hdr("Positions"),
    num("count", "Count", 1, 360, 1, whole=True),
    num("start", "Start °", -180, 180, 0.5),
    num("span", "Span °", 1, 360, 1),
    num("every", "Every", 1, 60, 1, whole=True),
    num("offset", "Offset", 0, 59, 1, whole=True),
    chk("invert", "Skip those instead"),
    hdr("Give way to rings above"),
    pop("skip", "Skip where", SKIP_FROM),
    pop("knock", "Knock out", KNOCK_FROM),
    num("clear", "Clearance", 0, 2, 0.01, show=lambda R: R["knock"] != 0),
    hdr("Look"),
    seg("shape", "Shape", SHAPES, show=kind_in("ticks", "markers")),
    fil("file", "File", show=marks_with("file")),
    num("scale", "Size ×", 0.05, 10, 0.01, show=marks_with("file")),
    num("len", "Length", 0.05, 10, 0.05, show=marks_with("bar", "wedge")),
    num("w", "Width · Ø", 0.02, 5, 0.01, show=marks_with("bar", "wedge", "dot")),
    num("taper", "Inner width ×", 0, 2, 0.01, show=marks_with("wedge")),
    num("round_out", "Round outer", 0, 2, 0.01, show=marks_with("bar", "wedge")),
    num("round_in", "Round inner", 0, 2, 0.01, show=marks_with("bar", "wedge")),
    num("wall", "Hollow wall", 0, 1.5, 0.01, show=kind_in("ticks", "markers")),
    hdr("12 o'clock · first position", show=kind_in("markers")),
    seg("twelve", "Style", TWELVES, show=kind_in("markers")),
    num("twelve_scale", "Scale ×", 0.5, 2.5, 0.05, show=lambda R: kind_of(R) == "markers" and R["twelve"] != 3),
    num("twelve_gap", "Gap", 0, 3, 0.05, show=lambda R: kind_of(R) == "markers" and R["twelve"] == 1),
    pop("labels", "Labels", [n for n, _ in LABEL_SETS], show=kind_in("numerals")),
    txt("custom", "Custom", show=labels_are("Custom")),
    num("num_from", "First number", -1000, 1000, 1, show=labels_are("Numbers")),
    num("num_step", "Step", -100, 100, 1, show=labels_are("Numbers")),
    num("num_digits", "Digits", 0, 4, 1, whole=True, show=labels_are("Numbers")),
    pop("mode", "Placement", MODES, show=kind_in("numerals")),
    num("size", "Size", 0.3, 8, 0.05, show=kind_in("numerals")),
    num("width", "Band width", 0.02, 25, 0.05, show=kind_in("band")),
    num("fill", "Fill % of step", 1, 100, 1, show=kind_in("band")),
    hdr("Nudge one numeral", show=numerals_only),
    custom("nudge", show=numerals_only),
    hdr("Type", show=numerals_only),
    custom("family", show=numerals_only), custom("style", show=numerals_only),
    custom("instance", show=numerals_only),
    pop("lang", "Language", LANGS, show=numerals_only),
    num("tracking", "Tracking", -200, 800, 5, show=numerals_only),
    custom("features", show=numerals_only),
    custom("axes_header", show=numerals_only),                     # axis rows are added after this, per font
]

HAND_ROWS = [
    chk("ha_on", "Show hands"),
    pop("ha_beat", "Motion", [n for n, _ in BEATS]),
    num("ha_cap", "Cap Ø", 0, 4, 0.05),
    col("c_cap", "Cap colour"),
    hdr("Hand"),
    seg("ui_hand", "Edit", ["Hour", "Minute", "Seconds"], tabs=True),
    chk("on", "Show this hand", scope="hand"),
    pop("shape", "Shape", HAND_SHAPES, scope="hand"),
    fil("file", "File", show=hand_is("file"), scope="hand"),
    chk("fit", "Fit file to length", show=hand_is("file"), scope="hand"),
    num("scale", "Size ×", 0.05, 10, 0.01, show=lambda H: HAND_SHAPES[H["shape"]] == "file" and not H["fit"], scope="hand"),
    num("len", "Length", 0.5, 30, 0.05, show=lambda H: HAND_SHAPES[H["shape"]] != "file" or H["fit"], scope="hand"),
    num("w", "Width", 0.02, 4, 0.01, show=lambda H: HAND_SHAPES[H["shape"]] != "file", scope="hand"),
    num("w_scale", "Width ×", 0.1, 5, 0.01, show=hand_is("file"), scope="hand"),
    num("tail", "Tail", 0, 10, 0.05, scope="hand"),
    num("tip", "Tip length", 0, 10, 0.05, show=hand_is("pencil", "sword", "arrow", "syringe", "breguet"), scope="hand"),
    num("feature", "Head width", 0, 6, 0.05, show=hand_is("arrow", "syringe"), scope="hand"),
    num("feature", "Ring · disc Ø", 0, 6, 0.05, show=hand_is("breguet", "lollipop"), scope="hand"),
    num("feature_at", "Widest at %", 0, 100, 1, show=hand_is("dauphine"), scope="hand"),
    num("feature_at", "Barrel from %", 0, 100, 1, show=hand_is("syringe"), scope="hand"),
    num("feature_at", "Ring · disc at %", 0, 100, 1, show=hand_is("breguet", "lollipop"), scope="hand"),
    num("counter", "Counterweight Ø", 0, 4, 0.05, scope="hand"),
    num("wall", "Hollow wall", 0, 1, 0.01, scope="hand"),
    col("c", "Colour", scope="hand"),
]

DATE_ROWS = [
    chk("da_on", "Date window"),
    pop("da_at", "Position", [n for n, _ in DATE_AT], show=is_("da_on", True)),
    num("da_r", "Radius", 2, 18, 0.05, show=is_("da_on", True)),
    num("da_w", "Width", 0.5, 6, 0.05, show=is_("da_on", True)),
    num("da_h", "Height", 0.5, 5, 0.05, show=is_("da_on", True)),
    num("da_round", "Corner", 0, 2, 0.05, show=is_("da_on", True)),
    num("da_frame", "Frame", 0, 0.6, 0.01, show=is_("da_on", True)),
    num("da_clear", "Print clearance", 0, 1, 0.01, show=is_("da_on", True)),
    col("da_ink", "Print colour", show=is_("da_on", True)),
    txt("da_day", "Shows", show=is_("da_on", True)),
    num("da_size", "Text % of height", 20, 100, 1, show=is_("da_on", True)),
    note_row("Uses the top numerals ring's type.", show=is_("da_on", True)),
]

EXPORT_ROWS = [
    chk("out_production", "Production: mono print mask"),
    chk("out_mirror", "Mirror: toner transfer"),
    num("out_dpi", "PNG dpi", 72, 2400, 1),
    num("out_seconds", "Clip seconds", 1, 60, 1),
    num("out_fps", "Frames per s", 6, 60, 1),
    bar("Export", ["PDF", "SVG", "PNG", "MP4", "GIF"], "export"),
    bar("Settings", ["Save…", "Load…", "Defaults"], "presets"),
]

SECTIONS = ["Dial", "Rings", "Hands", "Date", "Export"]
RING_TOOLS = ["Duplicate", "Delete", "↑ Up", "↓ Down"]

GRID_COLUMNS = [dict(width=132, columnPlacement="trailing"), dict(width=200, columnPlacement="fill"),
                dict(width=62, columnPlacement="fill"), dict(width=24, columnPlacement="leading")]
WIDE = 200 + 6 + 62 + 6 + 24                                       # a view spanning the last three columns
PANEL = 470                                                        # left panel width


def guard(fn):
    """any error in a control goes to the log instead of disappearing (R17)."""
    def wrapped(self, *args, **kwargs):
        try:
            return fn(self, *args, **kwargs)
        except Exception:
            self.log("error in " + fn.__name__ + "\n" + traceback.format_exc())
    wrapped.__name__ = fn.__name__
    return wrapped


class DialTool:

    def __init__(self, S=None):
        self.S = fresh_settings(S)
        self.D = DrawBotDrawingTool()                              # private engine: main canvas untouched
        self.static, self.static_dirty = None, True
        self.ready, self.timer, self.last_save, self.quiet = False, None, 0, False
        self.bindings = []                                         # (scope, key, refresh control from value)
        self.visibility = []                                       # (grid, row, predicate, scope)
        self.grids, self.keep = [], []                             # R22: every control's Python object
        self.axis_params, self.nudge_params = {}, {}
        self.families = font_families()

        self.w = Window((1300, 860), f"Dial Tool · {VERSION}", minSize=(1060, 720), autosaveName="DialToolWindow")
        self.w.sections = segmented(SECTIONS, self._section_cb, pos=(10, 10, PANEL, 26), tabs=True)
        self.groups = []
        for i, title in enumerate(SECTIONS):
            g = Group((10, 46, PANEL, -36))
            setattr(self.w, f"section{i}", g)
            self.groups.append(g)
            getattr(self, "_build_" + title.lower())(g)

        x = PANEL + 20                                             # preview and the bar under it
        self.w.canvas = DrawView((x, 10, -10, -74))
        self.w.timeLabel = TextBox((x + 2, -59, 40, 20), "Time", sizeStyle=SIZE)
        self.w.timeSlider = Slider((x + 44, -62, -410, 24), minValue=0, maxValue=43199, value=self.S["t"],
                                   callback=self._time_slid, sizeStyle=SIZE)
        self.w.timeField = EditText((-398, -62, 84, 24), fmt_time(self.S["t"]), continuous=False,
                                    callback=self._time_typed, sizeStyle=SIZE)
        self.w.guides = CheckBox((-302, -61, 78, 22), "Guides", value=bool(self.S["guides"]), sizeStyle=SIZE,
                                 callback=lambda s: self.set_value("global", "guides", bool(s.get())))
        self._bind("global", "guides", lambda v: self.w.guides.set(bool(v)))
        self.w.now = Button((-220, -62, 60, 24), "Now", callback=self._now, sizeStyle=SIZE)
        self.w.play = Button((-154, -62, 66, 24), "Play", callback=self._play, sizeStyle=SIZE)
        self.w.fit = Button((-82, -62, 72, 24), "Fit", callback=self._fit, sizeStyle=SIZE)
        self.w.status = TextBox((12, -26, -12, 18), "", sizeStyle="small")

        self.w.bind("close", self._closed)
        self.w.sections.set(self.S["ui_section"])
        self._show_section(self.S["ui_section"])
        self._refresh_ring_list()
        self._refresh_visibility()
        self.w.open()
        self.ready = True
        self._check_callbacks()
        self._load_ring()                                          # type, nudge, then renders

    # ── what the controls edit ───────────────────────────────

    def ring(self):
        return self.S["rings"][self.S["ui_ring"]]

    def target(self, scope):
        if scope == "ring":
            return self.ring()
        if scope == "hand":
            return self.S["ha_" + HANDS[self.S["ui_hand"]]]
        return self.S

    # ── building rows and grids ──────────────────────────────

    def _grid(self, spec, scope):
        """a form: rows of label · control · field · stepper."""
        rows, merges, visibility = [], [], []
        for item in spec:
            sc = item.get("scope") or scope
            for cells, wide, top in self._make_rows(item, sc):
                if wide:
                    merges.append(len(rows))
                if item.get("show"):
                    visibility.append((len(rows), item["show"], sc))
                rows.append(dict(cells=cells, rowPadding=(top, 0)))
        self.keep.append(rows)                                     # GridView keeps only the Cocoa views (R22)
        grid = GridView("auto", rows, columnDescriptions=GRID_COLUMNS, columnSpacing=6,
                        rowSpacing=6, rowPlacement="center", rowAlignment="none")
        nsgrid = grid.getNSGridView()
        for r in merges:                                           # wide controls span 3 columns
            try:
                nsgrid.mergeCellsInHorizontalRange_verticalRange_((1, 3), (r, 1))
            except Exception:
                pass
        for r, pred, sc in visibility:
            self.visibility.append((grid, r, pred, sc))
        self.grids.append(grid)
        return grid, len(rows)

    def _bind(self, scope, key, refresh):
        self.bindings.append((scope, key, refresh))

    def _make_rows(self, item, scope):
        """→ list of (cells, wide, top padding)"""
        k, key = item["kind"], item.get("key")
        T = self.target(scope) if key else None
        changed = lambda v, key=key, scope=scope: self.set_value(scope, key, v)
        if k == "num":
            p = Param(item["text"], item["lo"], item["hi"], T[key], item["step"], changed, whole=item["whole"])
            self._bind(scope, key, lambda v, p=p: p.set(v, quiet=True))
            return [(p.row, False, 0)]
        if k in ("pop", "seg"):
            if k == "pop":
                c = PopUpButton("auto", item["items"], sizeStyle=SIZE, callback=lambda s, f=changed: f(s.get()))
            else:
                c = segmented(item["items"], lambda s, f=changed: f(s.get()), tabs=item.get("tabs"))
            c.set(T[key])
            self._bind(scope, key, lambda v, c=c: c.set(v))
            return [([label(item["text"]), c, blank(), blank()], True, 0)]
        if k == "chk":
            c = CheckBox("auto", item["text"], value=bool(T[key]), sizeStyle=SIZE,
                         callback=lambda s, f=changed: f(bool(s.get())))
            self._bind(scope, key, lambda v, c=c: c.set(bool(v)))
            return [([blank(), c, blank(), blank()], True, 0)]
        if k == "col":
            c = ColorWell("auto", color=to_ns(T[key]), callback=lambda s, f=changed: f(from_ns(s.get())))
            self._bind(scope, key, lambda v, c=c: c.set(to_ns(v)))
            return [([label(item["text"]), dict(view=c, width=44, height=20, columnPlacement="leading"),
                      blank(), blank()], False, 0)]
        if k == "txt":
            c = EditText("auto", str(T[key]), continuous=False, sizeStyle=SIZE,
                         callback=lambda s, f=changed: f(str(s.get())))
            self._bind(scope, key, lambda v, c=c: c.set(str(v)))
            return [([label(item["text"]), c, blank(), blank()], True, 0)]
        if k == "file":
            c = PopUpButton("auto", [], sizeStyle=SIZE,
                            callback=lambda s, key=key, scope=scope: self._file_cb(s, scope, key))
            self._file_items(c, T[key])
            self._bind(scope, key, lambda v, c=c: self._file_items(c, v))
            return [([label(item["text"]), c, blank(), blank()], True, 0)]
        if k == "bar":
            c = segmented(item["items"], lambda s, act=item["action"]: self._bar(act, s), momentary=True)
            return [([label(item["text"]), c, blank(), blank()], True, 4)]
        if k == "hdr":
            return [([blank(), bold(item["text"]), blank(), blank()], True, 12)]
        if k == "note":
            return [([blank(), TextBox("auto", item["text"], sizeStyle="small"), blank(), blank()], True, 0)]
        return getattr(self, "_rows_" + item["name"])()

    # ── sections ─────────────────────────────────────────────

    def _build_simple(self, g, rows, scope="global"):
        g.grid, _ = self._grid(rows, scope)
        g.addAutoPosSizeRules(["H:|[grid]", "V:|[grid]"])

    def _build_dial(self, g):
        self._build_simple(g, DIAL_ROWS)

    def _build_hands(self, g):
        self._build_simple(g, HAND_ROWS)

    def _build_date(self, g):
        self._build_simple(g, DATE_ROWS)

    def _build_export(self, g):
        g.grid, _ = self._grid(EXPORT_ROWS, "global")
        g.log = TextEditor("auto", "", readOnly=True)
        self.logbox = g.log
        g.addAutoPosSizeRules(["H:|[grid]", "H:|-4-[log]-4-|", "V:|[grid]-16-[log]|"])

    def _build_rings(self, g):
        """the ring list, its tools, and one scrolling list of the selected ring's settings."""
        self.ring_group = g
        g.list = List((0, 0, -0, 132), [],
            columnDescriptions=[dict(title="", key="on", cell=CheckBoxListCell(), width=22),
                                dict(title="Ring", key="name"),
                                dict(title="Kind", key="kind", editable=False, width=80)],
            selectionCallback=self._ring_selected, editCallback=self._ring_edited,
            allowsMultipleSelection=False, allowsEmptySelection=False, allowsSorting=False,
            drawFocusRing=False)
        g.add = PopUpButton((0, 142, 132, 24), ["Add ring…"] + [k.capitalize() for k in KINDS],
                            callback=self._ring_add, sizeStyle=SIZE)
        g.tools = segmented(RING_TOOLS, lambda s: self._bar("ring_tool", s), momentary=True,
                            pos=(140, 141, -0, 26))
        details = Group("auto")
        details.grid, self.type_base_rows = self._grid(RING_ROWS, "ring")
        details.addAutoPosSizeRules(["H:|[grid]", "V:|-4-[grid]-16-|"])
        self.ring_grid = self.type_grid = details.grid
        self.details = details                                     # R22: its Python object stays here
        top = 178
        if FlippedView is not None:
            try:
                g.details = ScrollView((0, top, -0, -0), scroll_document(details), hasHorizontalScroller=False,
                                       hasVerticalScroller=True, autohidesScrollers=True, drawsBackground=False)
                pin_document(g.details)
                return
            except Exception:
                note("no scrolling for the ring settings\n" + traceback.format_exc())
        g.detailsPlain = details                                   # fallback: no scrolling (R17)
        g.addAutoPosSizeRules(["H:|[detailsPlain]|", f"V:|-{top}-[detailsPlain]"])

    # custom rows

    def _rows_family(self):
        self.family = ComboBox("auto", self.families, completes=True, sizeStyle=SIZE,
                               callback=self._family_cb)
        self.family.getNSComboBox().setNumberOfVisibleItems_(24)
        return [([label("Family"), self.family, blank(), blank()], True, 0)]

    def _rows_style(self):
        self.style = PopUpButton("auto", [], sizeStyle=SIZE, callback=self._style_cb)
        return [([label("Style"), self.style, blank(), blank()], True, 0)]

    def _rows_instance(self):
        self.instance = PopUpButton("auto", ["—"], sizeStyle=SIZE, callback=self._instance_cb)
        return [([label("Instance"), self.instance, blank(), blank()], True, 0)]

    def _rows_features(self):
        self.features_list = List("auto", [],
            columnDescriptions=[dict(title="", key="on", cell=CheckBoxListCell(), width=22),
                                dict(title="Tag", key="tag", editable=False, width=46),
                                dict(title="OpenType feature", key="name", editable=False)],
            editCallback=self._features_edited, allowsSorting=False, drawFocusRing=False)
        return [([label("Features"), dict(view=self.features_list, width=WIDE, height=150), blank(), blank()],
                 True, 0)]

    def _rows_axes_header(self):
        self.axes_header = bold("Variable axes")
        return [([blank(), self.axes_header, blank(), blank()], True, 12)]

    def _rows_nudge(self):
        self.nudge_pick = PopUpButton("auto", ["12"], sizeStyle=SIZE, callback=lambda s: self._load_nudge())
        rows = [([label("Numeral"), self.nudge_pick, blank(), blank()], True, 0)]
        for key, text, lo, hi, step, rest in (("dr", "Radius ±", -5, 5, 0.05, 0), ("da", "Angle ±°", -15, 15, 0.1, 0),
                                              ("rot", "Rotate °", -180, 180, 1, 0), ("s", "Size ×", 0.3, 3, 0.05, 1)):
            p = Param(text, lo, hi, rest, step, lambda v, k=key: self._nudge_changed(k, v))
            p.rest = rest
            self.nudge_params[key] = p
            rows.append((p.row, False, 0))
        self.nudge_reset = segmented(["Reset this", "Reset all"],
                                     lambda s: self._bar("_nudge_reset", s), momentary=True)
        rows.append(([blank(), self.nudge_reset, blank(), blank()], True, 4))
        return rows

    def _check_callbacks(self):
        """R17 + R22: report controls that would ignore clicks (action set, target gone)."""
        dead = []
        def walk(view):
            for v in view.subviews():
                if isinstance(v, AppKit.NSControl) and v.action() and v.target() is None:
                    dead.append(str(v.className()))
                walk(v)
        for grid in self.grids:
            walk(grid.getNSGridView())
        if dead:
            self.log(f"{len(dead)} controls lost their callback: " + ", ".join(sorted(set(dead))))
        else:
            self.log("all controls connected")

    # ── sections and visibility ──────────────────────────────

    def _section_cb(self, sender):
        i = sender.get()
        if i is not None:
            self.S["ui_section"] = i
            self._show_section(i)

    def _show_section(self, index):
        for i, g in enumerate(self.groups):
            g.show(i == index)

    def _refresh_visibility(self):
        for grid, row, pred, scope in self.visibility:
            grid.showRow(row, bool(pred(self.target(scope))))
        numerals = kind_of(self.ring()) == "numerals"              # axis rows, added per font, at the end
        for row in range(self.type_base_rows, self.ring_grid.getRowCount()):
            self.ring_grid.showRow(row, numerals)

    def _load_scope(self, scope):
        """put the selected ring's or hand's values into the controls."""
        T = self.target(scope)
        for sc, key, refresh in self.bindings:
            if sc == scope:
                refresh(T[key])
        self._refresh_visibility()

    # ── the ring list ────────────────────────────────────────

    def _refresh_ring_list(self):
        self.quiet = True
        try:
            items = [dict(on=bool(r["on"]), name=r["name"] or kind_of(r).capitalize(), kind=kind_of(r))
                     for r in self.S["rings"]]
            self.ring_group.list.set(items)
            self.ring_group.list.setSelection([self.S["ui_ring"]])
        finally:
            self.quiet = False

    @guard
    def _ring_selected(self, sender):
        if self.quiet:
            return
        sel = sender.getSelection()
        if sel and sel[0] != self.S["ui_ring"]:
            self.S["ui_ring"] = min(sel[0], len(self.S["rings"]) - 1)
            self._load_ring()

    @guard
    def _ring_edited(self, sender):
        if self.quiet:
            return
        for ring, item in zip(self.S["rings"], sender.get()):
            ring["on"] = bool(item["on"])
            ring["name"] = str(item["name"])
        self.static_dirty = True
        self.render()

    @guard
    def _load_ring(self):
        """the selected ring → every control in its list."""
        ring = self.ring()
        self.quiet = True
        try:
            self._load_scope("ring")
            if kind_of(ring) == "numerals":
                family = ring["family"] if ring["family"] in self.families else (
                    "Helvetica Neue" if "Helvetica Neue" in self.families else self.families[0])
                self.family.set(family)
                self.load_family(family, keep_ps=ring["ps"], quiet=True)
                self._load_nudge_picker()
        finally:
            self.quiet = False
        self._refresh_visibility()
        self.static_dirty = True
        self.render()

    @guard
    def _ring_add(self, sender):
        i = sender.get()
        sender.set(0)
        if not i:
            return
        kind = KINDS[i - 1]
        like = next((r for r in self.S["rings"] if kind_of(r) == "numerals"), None)
        sel = self.S["ui_ring"]
        self.S["rings"].insert(sel, new_ring(kind, self.S, like))  # above the selected ring
        self._ring_changed(sel)

    @guard
    def ring_tool(self, index):
        rings, sel = self.S["rings"], self.S["ui_ring"]
        if index == 0:                                             # duplicate, above
            dup = copy.deepcopy(rings[sel])
            dup["name"] = (dup["name"] or kind_of(dup).capitalize()) + " copy"
            rings.insert(sel, dup)
        elif index == 1:                                           # delete
            if len(rings) == 1:
                self.log("the last ring can't be deleted — hide it with its checkbox instead")
                return
            rings.pop(sel)
            sel = min(sel, len(rings) - 1)
        elif index == 2 and sel > 0:                               # up
            rings[sel - 1], rings[sel] = rings[sel], rings[sel - 1]
            sel -= 1
        elif index == 3 and sel < len(rings) - 1:                  # down
            rings[sel + 1], rings[sel] = rings[sel], rings[sel + 1]
            sel += 1
        self._ring_changed(sel)

    def _ring_changed(self, sel):
        self.S["ui_ring"] = sel
        self._refresh_ring_list()
        self._load_ring()

    # ── settings → render ────────────────────────────────────

    @guard
    def set_value(self, scope, key, value):
        if self.quiet:
            return
        if key in WHOLE:
            value = int(round(value))
        self.target(scope)[key] = value
        if scope == "ring":
            if key not in ("c", "name"):
                self.static_dirty = True
            if key == "kind":
                self._refresh_ring_list()
                self._load_ring()
                return
            if key in ("labels", "custom", "num_from", "num_step", "num_digits", "count"):
                self._load_nudge_picker()
        elif scope == "global":
            if key == "ui_hand":
                self._load_scope("hand")
            if key not in NOT_GEOMETRY and not key.startswith(NOT_GEOMETRY_PREFIX):
                self.static_dirty = True
        self._refresh_visibility()
        self.render()

    @guard
    def render(self):
        if not self.ready:
            return
        t0 = time.perf_counter()
        if self.static is None or self.static_dirty:
            self.static = build_static(self.S)
            self.static_dirty = False
        self.D.newDrawing()
        draw_page(self.D, self.S, self.static, self.S["t"], preview=True, selected=self.S["ui_ring"])
        self._show_pdf(self.D.pdfImage())
        ms = (time.perf_counter() - t0) * 1000
        ring = self.ring()
        font = f"   ·   {ring['ps']}" if kind_of(ring) == "numerals" else ""
        self.w.status.set(f"{ring['name']}{font}   ·   Ø {self.S['dial_d']:.1f} mm   ·   redraw {ms:.0f} ms")
        while NOTES:
            self.log(NOTES.pop(0))
        self._autosave()

    def _show_pdf(self, pdf):
        """swap the drawing but keep your zoom and scroll position."""
        view = self.w.canvas.getNSView()
        keep = not view.autoScales()
        point = None
        if keep:
            scale = view.scaleFactor()
            dest = view.currentDestination()
            point = dest.point() if dest is not None else None
        self.w.canvas.setPDFDocument(pdf)
        if keep:
            try:
                view.setAutoScales_(False)
                view.setScaleFactor_(scale)
                if point is not None and pdf.pageCount():
                    view.goToDestination_(Quartz.PDFDestination.alloc().initWithPage_atPoint_(
                        pdf.pageAtIndex_(0), point))
            except Exception:
                pass

    def _fit(self, sender):
        self.w.canvas.getNSView().setAutoScales_(True)

    # ── type (the selected numerals ring's) ──────────────────

    @guard
    def _family_cb(self, sender):
        name = str(sender.get())
        if name in self.families and name != self.ring()["family"]:
            self.load_family(name)

    def load_family(self, family, keep_ps=None, quiet=False):
        self.ring()["family"] = family
        self.styles = font_styles(family) or [("—", family)]
        names = [s for s, _ in self.styles]
        names = [f"{n}  ·  {ps}" if names.count(n) > 1 else n            # menus drop duplicate titles
                 for n, (_, ps) in zip(names, self.styles)]
        self.style.setItems(names)
        pss = [ps for _, ps in self.styles]
        if keep_ps in pss:
            i = pss.index(keep_ps)
        else:
            i = next((names.index(n) for n in ("Regular", "Roman", "Book", "Text", "Medium") if n in names), 0)
        self.style.set(i)
        self.load_font(pss[i], quiet)

    @guard
    def _style_cb(self, sender):
        self.load_font(self.styles[sender.get()][1])

    def load_font(self, ps, quiet=False):
        ring = self.ring()
        ring["ps"] = ps
        fs = FormattedString()
        axes = fs.listFontVariations(ps)
        self.instances = fs.listNamedInstances(ps)
        self.instance.setItems(["—"] + list(self.instances))

        grid = self.type_grid.getNSGridView()                      # rebuild the axis rows
        while grid.numberOfRows() > self.type_base_rows:
            row = grid.rowAtIndex_(grid.numberOfRows() - 1)
            for c in range(row.numberOfCells()):                   # detach controls, not just the row
                v = row.cellAtIndex_(c).contentView()
                if v is not None:
                    v.removeFromSuperview()
            grid.removeRowAtIndex_(grid.numberOfRows() - 1)
        old, new, self.axis_params = ring["axes"], {}, {}
        for tag, a in axes.items():
            lo, hi = a["minValue"], a["maxValue"]
            v = min(max(old.get(tag, a["defaultValue"]), lo), hi)
            new[tag] = v
            p = Param(str(a["name"]), lo, hi, v, 1 if hi - lo > 20 else 0.01,
                      lambda val, tag=tag: self._axis_changed(tag, val))
            p.row[0].getNSTextField().setToolTip_(tag)
            self.axis_params[tag] = (p, str(a["name"]))            # R22: kept here
            self.type_grid.appendRow(p.row)
        ring["axes"] = new
        self.axes_header.set("Variable axes" if axes else "Variable axes: none in this font")

        names = designer_feature_names(ps)
        tags = sorted(set(str(t) for t in fs.listOpenTypeFeatures(ps)))
        feats = ring["features"]
        was = self.quiet
        self.quiet = True
        try:
            self.features_list.set([dict(on=feats.get(t, t in DEFAULT_ON), tag=t,
                                         name=names.get(t) or FEATURE_NAMES.get(t, "")) for t in tags])
        finally:
            self.quiet = was
        self.static_dirty = True
        if not quiet:
            self.render()

    @guard
    def _axis_changed(self, tag, value):
        self.ring()["axes"][tag] = value
        self.instance.set(0)
        self.static_dirty = True
        self.render()

    @guard
    def _instance_cb(self, sender):
        i = sender.get()
        if not i:
            return
        location = list(self.instances.values())[i - 1]            # keyed by axis name
        for tag, (p, name) in self.axis_params.items():
            v = location.get(name, location.get(tag))
            if v is not None:
                p.set(v, quiet=True)
                self.ring()["axes"][tag] = v
        self.static_dirty = True
        self.render()

    @guard
    def _features_edited(self, sender):
        if self.quiet:
            return
        feats = {}
        for item in sender.get():
            tag, on = str(item["tag"]), bool(item["on"])
            if on != (tag in DEFAULT_ON):
                feats[tag] = on                                    # only what differs from the default (R12)
        self.ring()["features"] = feats
        self.static_dirty = True
        self.render()

    # ── numeral nudge ────────────────────────────────────────

    def _load_nudge_picker(self):
        if kind_of(self.ring()) != "numerals":
            return
        i = max(self.nudge_pick.get() or 0, 0)
        titles = unique_titles(ring_labels(self.ring()))
        self.nudge_pick.setItems(titles)
        self.nudge_pick.set(min(i, len(titles) - 1))
        self._load_nudge()

    def _nudge_key(self):
        return str(max(self.nudge_pick.get() or 0, 0))             # position index (R9)

    def _load_nudge(self):
        n = self.ring()["nudge"].get(self._nudge_key(), {})
        for key, p in self.nudge_params.items():
            p.set(n.get(key, p.rest), quiet=True)

    @guard
    def _nudge_changed(self, key, value):
        i = self._nudge_key()
        n = dict(self.ring()["nudge"].get(i, {}))
        n[key] = value
        n = {k: v for k, v in n.items() if v != self.nudge_params[k].rest}
        nudges = dict(self.ring()["nudge"])
        if n:
            nudges[i] = n
        else:
            nudges.pop(i, None)
        self.set_value("ring", "nudge", nudges)

    @guard
    def _bar(self, action, sender):
        """button bars: which segment was clicked."""
        index = sender.getNSSegmentedButton().selectedSegment()
        if index is None or index < 0:
            self.log(f"couldn't tell which {action} button was clicked — please report this")
            return
        getattr(self, action)(index)

    @guard
    def _nudge_reset(self, index):
        ring = self.ring()
        if index == 1:
            ring["nudge"] = {}
        else:
            ring["nudge"] = {k: v for k, v in ring["nudge"].items() if k != self._nudge_key()}
        self._load_nudge()
        self.set_value("ring", "nudge", ring["nudge"])

    # ── imported files ───────────────────────────────────────

    def _file_items(self, popup, path):
        popup.setItems([os.path.basename(path) if path else "none", "Choose…", "Clear"])
        popup.set(0)

    @guard
    def _file_cb(self, sender, scope, key):
        T = self.target(scope)
        choice = sender.get()
        if choice == 1:
            paths = getFile(messageText="Choose an SVG, PDF or AI file — drawn pointing up, "
                                        "anchor at the artboard centre", fileTypes=FILE_TYPES)
            if paths:
                T[key] = paths[0]
        elif choice == 2:
            T[key] = ""
        self._file_items(sender, T[key])
        self.set_value(scope, key, T[key])

    # ── time ─────────────────────────────────────────────────

    def _sync_time(self):
        self.w.timeSlider.set(self.S["t"] % 43200)
        self.w.timeField.set(fmt_time(self.S["t"]))

    @guard
    def _time_slid(self, sender):
        self.S["t"] = sender.get()
        self.w.timeField.set(fmt_time(self.S["t"]))
        self.render()

    @guard
    def _time_typed(self, sender):
        t = parse_time(sender.get())
        if t is not None:
            self.S["t"] = t
        self._sync_time()
        self.render()

    @guard
    def _now(self, sender):
        lt = time.localtime()
        self.S["t"] = lt.tm_hour % 12 * 3600 + lt.tm_min * 60 + lt.tm_sec
        self._sync_time()
        self.render()

    @guard
    def _play(self, sender):
        if self.timer is not None:
            self.timer.invalidate()
            self.timer = None
            sender.setTitle("Play")
            return
        self.play_from = (time.time(), self.S["t"])
        self.timer = AppKit.NSTimer.scheduledTimerWithTimeInterval_repeats_block_(1 / 30, True, self._tick)
        sender.setTitle("Stop")

    def _tick(self, timer):
        try:
            wall, t = self.play_from
            self.S["t"] = (t + time.time() - wall) % 43200
            self._sync_time()
            self.render()
        except Exception:
            timer.invalidate()

    # ── export and settings ──────────────────────────────────

    @guard
    def export(self, index):
        if index is None or index < 0:
            return
        kind = ["pdf", "svg", "png", "mp4", "gif"][index]
        path = putFile(messageText=f"Export {kind.upper()}", fileName=f"dial.{kind}", fileTypes=[kind])
        if not path:
            return
        D = DrawBotDrawingTool()
        D.newDrawing()
        static = build_static(self.S)
        if kind in ("mp4", "gif"):
            fps = self.S["out_fps"]
            for f in range(int(self.S["out_seconds"] * fps)):
                draw_page(D, self.S, static, self.S["t"] + f / fps, preview=False)
                D.frameDuration(1 / fps)
        else:
            draw_page(D, self.S, static, self.S["t"], preview=False)
        options = dict(imageResolution=self.S["out_dpi"]) if kind == "png" else {}
        D.saveImage(path, **options)
        D.endDrawing()
        self.log(f"exported {path}")

    @guard
    def presets(self, index):
        if index == 0:
            path = putFile(messageText="Save settings", fileName="dial.json", fileTypes=["json"])
            if path:
                with open(path, "w") as f:
                    json.dump(self.S, f, indent=1, ensure_ascii=False)
                self.log(f"saved {path}")
        elif index == 1:
            paths = getFile(messageText="Load settings", fileTypes=["json"])
            if paths:
                with open(paths[0]) as f:
                    self.reopen(json.load(f))
        elif index == 2:
            self.reopen({"ui_section": self.S["ui_section"]})

    def reopen(self, settings):
        """rebuild the window with new settings (simplest way to update every control)."""
        self.w.close()
        builtins._dial_tool = DialTool(settings)

    def _autosave(self, force=False):
        if force or time.time() - self.last_save > 1:
            try:
                os.makedirs(SUPPORT, exist_ok=True)
                with open(LAST_SESSION, "w") as f:
                    json.dump(self.S, f, ensure_ascii=False)
                self.last_save = time.time()
            except Exception:
                pass

    def _closed(self, sender):
        if self.timer is not None:
            self.timer.invalidate()
            self.timer = None
        self._autosave(force=True)
        self.ready = False

    def log(self, message):
        print(message)
        try:
            stamp = time.strftime("%H:%M:%S")
            self.logbox.set(f"{stamp}  {message}\n" + self.logbox.get())
            self.w.status.set(message.splitlines()[0])
        except Exception:
            pass


def start():
    previous = getattr(builtins, "_dial_tool", None)
    settings = None
    if previous is not None:                                       # re-run: keep the settings, replace the window
        settings = previous.S
        try:
            previous.w.close()
        except Exception:
            pass
    elif os.path.exists(LAST_SESSION):
        try:
            with open(LAST_SESSION) as f:
                settings = json.load(f)
        except Exception:
            settings = None
    builtins._dial_tool = DialTool(settings)


if HAVE_UI and __name__ == "__main__":
    try:
        start()
    except Exception:
        print(traceback.format_exc())
