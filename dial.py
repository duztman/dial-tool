# ─────────────────────────────────────────────────────────────
#  dial.py — Dial Tool for DrawBot                     beta 1.0
#
#  ⌘R opens the tool window. Running again replaces the window
#  and keeps your current settings.
#
#  1 · SETTINGS     every setting and its starting value
#  2 · GEOMETRY     settings → shapes  (millimetres, clock angles)
#  3 · DRAWING      shapes → a page    (preview and export)
#  4 · INTERFACE    the window
#
#  Units: millimetres. Angles: 0° = 12 o'clock, clockwise.
#  Everything is a filled shape — no strokes — so widths are exact
#  in Illustrator and clean for etching, printing and laser.
# ─────────────────────────────────────────────────────────────

import os, json, time, traceback, builtins
from math import sin, cos, tan, acos, radians, degrees, hypot, pi

try:
    from drawBot.context.baseContext import BezierPath, FormattedString
except ImportError:                                   # test harness outside the app
    from drawbot_skia.path import BezierPath
    FormattedString = None

MM = 72 / 25.4                                        # 1 mm in points


# ═════════════════════════════════════════════════════════════
#  1 · SETTINGS
# ═════════════════════════════════════════════════════════════

DIVISIONS   = [60, 120, 240, 300]
COLLISIONS  = ["one ring", "skip", "knockout", "stack"]
SHAPES      = ["bar", "wedge", "dot", "svg"]
SHOW_AT     = ["all", "cardinals", "non-cardinals", "12 only", "none"]
TWELVES     = ["same", "double", "triangle", "none"]
NUMERAL_AT  = ["all", "cardinals", "non-cardinals", "12 only", "12 & 6", "none"]
MODES       = ["upright", "radial", "radial, auto-flip", "on path"]
HAND_STYLES = ["baton", "dauphine", "sword", "leaf", "svg"]
DATE_AT     = [("3", 90), ("4:30", 135), ("6", 180), ("9", 270), ("12", 0)]
LANGS       = ["default", "tr", "nl", "de", "pl", "ro", "ca", "ar", "fa", "zh-Hans", "ja"]
BEATS       = [("sweep", 0), ("quartz · 1/s", 1), ("6 beats/s", 6), ("8 beats/s", 8)]
LABEL_SETS  = [
    ("Arabic",         "12 1 2 3 4 5 6 7 8 9 10 11"),
    ("Roman · IIII",   "XII I II III IIII V VI VII VIII IX X XI"),
    ("Roman · IV",     "XII I II III IV V VI VII VIII IX X XI"),
    ("Eastern Arabic", "١٢ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ١٠ ١١"),
    ("Chinese",        "十二 一 二 三 四 五 六 七 八 九 十 十一"),
    ("Words",          "TWELVE ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN"),
    ("Custom",         ""),
]

DEFAULTS = dict(
    # dial
    dial_d=30.0, margin=3.0, guides=True,
    c_plate=[0.93, 0.91, 0.86, 1], c_ink=[0.08, 0.08, 0.08, 1], c_hands=[0.10, 0.10, 0.12, 1],
    c_accent=[0.80, 0.22, 0.10, 1], c_backdrop=[0.80, 0.80, 0.78, 1],
    # track
    tr_div=0, tr_inset=0.6, tr_len=1.0, tr_w=0.12, tr_minor_len=0.5, tr_minor_w=0.7,
    tr_rail=False, tr_rail_w=0.1, tr_collision=0, tr_clear=0.25,
    # hour markers
    mk_shape=0, mk_svg="", mk_at=0, mk_len=2.8, mk_w=0.7, mk_offset=0.0, mk_taper=0.35,
    mk_round_out=0.0, mk_round_in=0.0, mk_wall=0.0,
    mk_twelve=0, mk_twelve_scale=1.0, mk_twelve_gap=0.5,
    # type
    ty_family="Helvetica Neue", ty_ps="HelveticaNeue", ty_size=2.4, ty_tracking=0.0,
    ty_lang=0, ty_axes={}, ty_features={},
    # numerals
    nu_set=0, nu_custom="", nu_at=0, nu_mode=0, nu_r=10.0, nu_nudge={},
    # hands
    ha_on=True, ha_style=0, ha_svg_hour="", ha_svg_min="", ha_svg_sec="",
    ha_hour_len=55.0, ha_min_len=88.0, ha_hour_w=1.4, ha_min_w=1.0, ha_tail=12.0, ha_cap=1.6,
    ha_sec_on=True, ha_sec_len=92.0, ha_sec_w=0.15, ha_counter=1.1, ha_beat=0,
    # date
    da_on=False, da_at=0, da_r=10.5, da_w=2.6, da_h=2.0, da_round=0.2, da_frame=0.15,
    da_day="17", da_size=62.0,
    # time and output
    t=10 * 3600 + 9 * 60 + 36,
    out_production=False, out_mirror=False, out_dpi=600.0, out_seconds=4.0, out_fps=30.0,
    ui_section=0,
)

# settings that change only colour, hands or output — no need to rebuild the dial geometry
NOT_GEOMETRY = ("t", "guides", "ui_section")
NOT_GEOMETRY_PREFIX = ("c_", "ha_", "out_")

def fresh_settings(over=None):
    S = json.loads(json.dumps(DEFAULTS))              # deep copy
    for k, v in (over or {}).items():
        if k in S:
            S[k] = v
    return S


# ═════════════════════════════════════════════════════════════
#  2 · GEOMETRY
# ═════════════════════════════════════════════════════════════

# ── basics ───────────────────────────────────────────────────

def clock_point(r, a):
    """point at radius r, clock angle a."""
    return (r * sin(radians(a)), r * cos(radians(a)))

def place(p, r, a):
    """a shape drawn upright at the origin → pushed out to radius r, turned to clock angle a."""
    p.translate(0, r)
    p.rotate(-a, center=(0, 0))                       # DrawBot turns counter-clockwise
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

def shown(h, mode):
    """h = 0…11 (0 is 12 o'clock)"""
    return {"all": True, "cardinals": h % 3 == 0, "non-cardinals": h % 3 != 0,
            "12 only": h == 0, "12 & 6": h in (0, 6), "none": False}[mode]

def track_radii(S):
    R = S["dial_d"] / 2
    out = R - S["tr_inset"]
    return R, out, out - S["tr_len"]


# ── imported SVG (Illustrator: draw pointing up, artboard centre = anchor) ──

_svg_cache = {}

def svg_shape(path):
    if not path or not os.path.exists(path):
        return None
    key = (path, os.path.getmtime(path))
    if key not in _svg_cache:
        from fontTools.svgLib.path import SVGPath
        from fontTools.pens.recordingPen import RecordingPen
        svg = SVGPath(path)
        rec = RecordingPen()                          # neutral pen: SVG arcs become curves
        svg.draw(rec)
        p = BezierPath()
        rec.replay(p)
        vb = svg.root.get("viewBox")
        if vb:
            x, y, w, h = [float(v) for v in vb.replace(",", " ").split()]
        else:
            x0, y0, x1, y1 = p.bounds()
            x, y, w, h = x0, y0, x1 - x0, y1 - y0
        p.translate(-(x + w / 2), -(y + h / 2))       # anchor → origin
        p.scale(1 / MM, -1 / MM)                      # points → mm, flip y (SVG is y-down)
        _svg_cache[key] = p
    return _svg_cache[key].copy()


# ── type: every numeral goes through DrawBot's styled string ─

TEST_FONT = None                                      # only used by the test harness

def type_kwargs(S, size):
    lang = LANGS[S["ty_lang"]]
    return dict(font=S["ty_ps"], fontSize=size, tracking=S["ty_tracking"] / 1000 * size,
                openTypeFeatures=dict(S["ty_features"]), fontVariations=dict(S["ty_axes"]),
                language=None if lang == "default" else lang)

def text_path(txt, S, size):
    """text → outlines, with font, tracking, features, axes and language."""
    p = BezierPath()
    if FormattedString is not None:
        p.text(FormattedString(txt, **type_kwargs(S, size)))
    else:
        p.text(txt, font=TEST_FONT, fontSize=size)
    return p

def advance(txt, S, size):
    """typeset width, kerning and tracking included."""
    if not txt:
        return 0.0
    if FormattedString is not None:
        sz = FormattedString(txt, **type_kwargs(S, size)).size()
        return getattr(sz, "width", None) or sz[0]
    b = text_path(txt, S, size).bounds()
    return b[2] if b else 0.0

def centred(p):
    b = p.bounds()
    if b:
        p.translate(-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2)
    return p


# ── track: the ring of minute ticks ──────────────────────────

def tick(S, a, minor=False):
    R, t_out, t_in = track_radii(S)
    L = S["tr_minor_len"] if minor else S["tr_len"]
    W = S["tr_w"] * (S["tr_minor_w"] if minor else 1)
    p = BezierPath()
    p.rect(-W / 2, -L / 2, W, L)
    return place(p, t_out - L / 2, a)


# ── hour markers ─────────────────────────────────────────────

def marker_shape(S, L, W, kind=None, taper=None, grow=0.0, solid=False):
    """one marker centred on the origin, pointing outward (+y)."""
    kind = kind or SHAPES[S["mk_shape"]]
    taper = S["mk_taper"] if taper is None else taper
    if kind == "svg":
        p = svg_shape(S["mk_svg"])
        if p is not None:
            return p
        kind = "bar"

    def outline(L, W, ro, ri):
        if kind == "dot":
            return circle(W)
        wi = W if kind == "bar" else W * taper            # width at the inner end
        if wi < 1e-3:                                     # taper 0 → triangle
            return poly([(0, -L / 2), (W / 2, L / 2), (-W / 2, L / 2)], [ri, ro, ro])
        return poly([(-wi / 2, -L / 2), (wi / 2, -L / 2), (W / 2, L / 2), (-W / 2, L / 2)],
                    [ri, ri, ro, ro])

    ro, ri = S["mk_round_out"], S["mk_round_in"]
    p = outline(L + 2 * grow, W + 2 * grow, ro + grow, ri + grow)
    wall = 0 if solid else S["mk_wall"]
    if wall > 0 and W - 2 * wall > 0.01 and (kind == "dot" or L - 2 * wall > 0.01):
        p = p.difference(outline(L - 2 * wall, W - 2 * wall, max(ro - wall, 0), max(ri - wall, 0)))
    return p

def hour_marker(S, a, is_twelve, grow=0.0, solid=False):
    style = TWELVES[S["mk_twelve"]] if is_twelve else "same"
    if style == "none":
        return None
    k = S["mk_twelve_scale"] if is_twelve else 1.0
    L, W = S["mk_len"] * k, S["mk_w"] * k
    if style == "triangle":
        shape = marker_shape(S, L * 1.1, W * 2.4, kind="wedge", taper=0, grow=grow, solid=solid)
    else:
        shape = marker_shape(S, L, W, grow=grow, solid=solid)
    b = shape.bounds()
    if b is None:
        return None
    extent, width = (b[3] - b[1]) - 2 * grow, (b[2] - b[0]) - 2 * grow
    R, t_out, t_in = track_radii(S)
    if COLLISIONS[S["tr_collision"]] == "one ring":
        r_mid = t_out - extent / 2                        # sits on the track's outer edge
    else:
        r_mid = t_in - S["mk_offset"] - extent / 2
    r_mid = max(r_mid, 0.1)
    if style == "double":
        da = degrees((S["mk_twelve_gap"] + width) / 2 / r_mid)
        return merge([place(shape.copy(), r_mid, a - da), place(shape, r_mid, a + da)])
    return place(shape, r_mid, a)

def build_track(S):
    """minute track + hour markers, with the chosen collision rule."""
    div = DIVISIONS[S["tr_div"]]
    per_min, per_hour = div // 60, div // 12
    mode = COLLISIONS[S["tr_collision"]]
    at, dA = SHOW_AT[S["mk_at"]], date_angle(S)
    small, big, clear = [], [], []
    for i in range(div):
        a = i * 360 / div
        if i % per_hour == 0:
            h = i // per_hour
            m = hour_marker(S, a, h == 0) if shown(h, at) and not near(a, dA) else None
            if m is not None:
                big.append(m)
                if mode == "knockout":
                    clear.append(hour_marker(S, a, h == 0, grow=S["tr_clear"], solid=True))
                if mode in ("one ring", "skip"):
                    continue                              # the marker owns this position
            small.append(tick(S, a))
        else:
            small.append(tick(S, a, minor=(i % per_min != 0)))
    track = merge(small)
    if S["tr_rail"]:
        R, t_out, t_in = track_radii(S)
        rw = S["tr_rail_w"]
        rails = circle(2 * t_out).difference(circle(2 * (t_out - rw)))
        rails = rails.union(circle(2 * (t_in + rw)).difference(circle(2 * t_in)))
        track = track.union(rails)
    else:
        track.removeOverlap()
    if clear:
        cutter = merge(clear)
        cutter.removeOverlap()
        track = track.difference(cutter)
    markers = merge(big)
    markers.removeOverlap()
    return track, markers


# ── numerals ─────────────────────────────────────────────────

def labels(S):
    name, txt = LABEL_SETS[S["nu_set"]]
    parts = [s.strip() for s in S["nu_custom"].split(",")] if name == "Custom" else txt.split()
    return (parts + [""] * 12)[:12]

def on_path(txt, r, a, S, size):
    """letters walk along the circle with real kerning; the bottom half flips to read left → right."""
    flip = 90 < a % 360 < 270
    tr = S["ty_tracking"] / 1000 * size
    adv = [advance(txt[:i], S, size) for i in range(len(txt) + 1)]   # where each letter starts
    total = adv[-1] - tr
    whole = text_path(txt, S, size).bounds()
    yc = (whole[1] + whole[3]) / 2 if whole else 0                   # one baseline for all letters
    out = []
    for i, ch in enumerate(txt):
        if not ch.strip():
            continue
        g = text_path(ch, S, size)
        own = advance(ch, S, size) - tr
        c = adv[i] + own / 2 - total / 2                              # letter centre along the word
        g.translate(-own / 2, -yc)
        if flip:
            g.rotate(180)
            out.append(place(g, r, a - degrees(c / r)))
        else:
            out.append(place(g, r, a + degrees(c / r)))
    return merge(out)

def build_numerals(S):
    mode, at, dA = MODES[S["nu_mode"]], NUMERAL_AT[S["nu_at"]], date_angle(S)
    out = []
    for h, lab in enumerate(labels(S)):
        a = h * 30
        if not lab or not shown(h, at) or near(a, dA):
            continue
        n = S["nu_nudge"].get(str(12 if h == 0 else h), {})
        r, a = S["nu_r"] + n.get("dr", 0), a + n.get("da", 0)
        size, rot = S["ty_size"] * n.get("s", 1), n.get("rot", 0)
        if mode == "on path":
            p = on_path(lab, r, a, S, size)
            if rot:
                p.rotate(-rot, center=clock_point(r, a))
        else:
            p = centred(text_path(lab, S, size))
            if mode == "upright":
                p.rotate(-rot)
                p.translate(*clock_point(r, a))
            else:
                flip = 180 if (mode == "radial, auto-flip" and 90 < a % 360 < 270) else 0
                p.rotate(-(flip + rot))
                place(p, r, a)
        out.append(p)
    return merge(out)


# ── date window ──────────────────────────────────────────────

def date_angle(S):
    return DATE_AT[S["da_at"]][1] if S["da_on"] else None

def date_window(S, grow=0.0):
    p = rounded_rect(S["da_w"] + 2 * grow, S["da_h"] + 2 * grow, S["da_round"] + grow)
    p.translate(*clock_point(S["da_r"], date_angle(S)))
    return p

def build_date(S):
    if date_angle(S) is None:
        return None
    win = date_window(S)
    f = S["da_frame"]
    num = centred(text_path(S["da_day"], S, S["da_h"] * S["da_size"] / 100))
    num.translate(*clock_point(S["da_r"], date_angle(S)))
    return dict(window=win,
                frame=date_window(S, f).difference(win) if f > 0 else None,
                cutline=date_window(S, 0.05).difference(win),      # aperture outline for production
                number=num)


# ── everything that doesn't move ─────────────────────────────

def build_static(S):
    track, markers = build_track(S)
    numerals = build_numerals(S)
    date = build_date(S)
    plate = circle(S["dial_d"])
    if date:
        plate = plate.difference(date["window"])
        cut = date_window(S, S["da_frame"] + S["tr_clear"])      # keep print clear of the hole
        track, markers, numerals = [x if empty(x) else x.difference(cut)
                                    for x in (track, markers, numerals)]
    return dict(plate=plate, track=track, markers=markers, numerals=numerals, date=date)


# ── hands ────────────────────────────────────────────────────

def hand_angles(t, beats_per_second=0):
    t %= 43200
    s = t % 60
    if beats_per_second:
        s = int(s * beats_per_second) / beats_per_second
    return t / 43200 * 360, (t % 3600) / 3600 * 360, s / 60 * 360

def hand_path(style, L, W, tail):
    """drawn pointing at 12, pivot at the origin."""
    p = BezierPath()
    if style == "baton":
        p.rect(-W / 2, -tail, W, L + tail)
    elif style == "dauphine":
        p.polygon((0, L), (W / 2, L * 0.18), (0, -tail), (-W / 2, L * 0.18))
    elif style == "sword":
        p.polygon((0, L), (W / 2, L * 0.75), (W * 0.4, -tail), (-W * 0.4, -tail), (-W / 2, L * 0.75))
    else:                                                          # leaf
        k = 0.55
        p.moveTo((0, -tail))
        p.curveTo((W * k, L * 0.15), (W * k, L * 0.6), (0, L))
        p.curveTo((-W * k, L * 0.6), (-W * k, L * 0.15), (0, -tail))
        p.closePath()
    return p

def build_hands(S, t):
    R = S["dial_d"] / 2
    style = HAND_STYLES[S["ha_style"]]
    ah, am, asec = hand_angles(t, BEATS[S["ha_beat"]][1])
    out = {}
    for name, a, pct, W, svg_key in (("hour", ah, S["ha_hour_len"], S["ha_hour_w"], "ha_svg_hour"),
                                     ("minute", am, S["ha_min_len"], S["ha_min_w"], "ha_svg_min")):
        p = svg_shape(S[svg_key]) if style == "svg" else None
        if p is None:
            L = pct / 100 * R
            p = hand_path("baton" if style == "svg" else style, L, W, S["ha_tail"] / 100 * L)
        p.rotate(-a)
        out[name] = p
    if S["ha_sec_on"]:
        p = svg_shape(S["ha_svg_sec"]) if style == "svg" else None
        if p is None:
            L, tail, w = S["ha_sec_len"] / 100 * R, R * 0.22, S["ha_sec_w"]
            p = BezierPath()
            p.rect(-w / 2, -tail, w, L + tail)
            if S["ha_counter"] > 0:
                p = p.union(place(circle(S["ha_counter"]), -R * 0.16, 0))
        p.rotate(-asec)
        out["second"] = p
    out["cap"] = circle(S["ha_cap"]) if S["ha_cap"] > 0 else None
    return out


# ═════════════════════════════════════════════════════════════
#  3 · DRAWING  — D is a DrawBot drawing engine
# ═════════════════════════════════════════════════════════════

def draw_page(D, S, static, t, preview=True):
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

    if production:                                                 # mono mask, no plate, no hands
        D.fill(0, 0, 0, 1)
        for k in ("track", "markers", "numerals"):
            D.drawPath(static[k])
        if date:
            if date["frame"]:
                D.drawPath(date["frame"])
            D.drawPath(date["cutline"])
    else:
        if date:                                                   # date disc, seen through the hole
            D.fill(1, 1, 1, 1)
            D.drawPath(date["window"])
            D.fill(*S["c_ink"])
            D.drawPath(date["number"])
        D.fill(*S["c_plate"])
        D.drawPath(static["plate"])
        D.fill(*S["c_ink"])
        for k in ("track", "markers", "numerals"):
            D.drawPath(static[k])
        if date and date["frame"]:
            D.drawPath(date["frame"])
        if S["ha_on"]:
            H = build_hands(S, t)
            D.fill(*S["c_hands"])
            D.drawPath(H["hour"])
            D.drawPath(H["minute"])
            D.fill(*S["c_accent"])
            for k in ("second", "cap"):
                if H.get(k) is not None:
                    D.drawPath(H[k])

    if preview and S["guides"]:                                    # never exported
        R, t_out, t_in = track_radii(S)
        D.fill(None)
        D.stroke(0.0, 0.55, 0.9, 0.8)
        D.strokeWidth(0.03)
        for r in (R, t_out, t_in, S["nu_r"]) + ((S["da_r"],) if date else ()):
            if r > 0:
                D.oval(-r, -r, 2 * r, 2 * r)
        D.line((-R, 0), (R, 0))
        D.line((0, -R), (0, R))
        D.stroke(None)


# ═════════════════════════════════════════════════════════════
#  4 · INTERFACE
# ═════════════════════════════════════════════════════════════

try:
    import AppKit, CoreText, Quartz
    from vanilla import (Window, Group, TextBox, Slider, EditText, Stepper, ComboBox, PopUpButton,
                         CheckBox, ColorWell, SegmentedButton, List, CheckBoxListCell, TextEditor,
                         Button, GridView)
    from vanilla.dialogs import getFile, putFile
    from drawBot.drawBotDrawingTools import DrawBotDrawingTool
    from drawBot.ui.drawView import DrawView
    HAVE_UI = True
except ImportError:
    HAVE_UI = False

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

def label(text):
    return TextBox("auto", f"{text}:" if text else "", alignment="right", sizeStyle="small")

def segmented(items, callback, momentary=False):
    c = SegmentedButton("auto", [dict(title=t) for t in items], callback=callback, sizeStyle="small",
                        selectionStyle="momentary" if momentary else "one")
    try:
        c.getNSSegmentedButton().setSegmentDistribution_(AppKit.NSSegmentDistributionFillEqually)
    except Exception:
        pass                                                       # older macOS: segments keep their own width
    return c

def blank():
    return TextBox("auto", "")

def bold(text):
    t = TextBox("auto", text, sizeStyle="small")
    t.getNSTextField().setFont_(AppKit.NSFont.boldSystemFontOfSize_(AppKit.NSFont.smallSystemFontSize()))
    return t


# ── one number = label · slider · typed field · stepper ──────

class Param:
    def __init__(self, text, lo, hi, value, step, on_change):
        self.step, self.on_change = step, on_change
        self.value = value
        self.lo, self.hi = min(lo, value), max(hi, value)
        self.slider = Slider("auto", minValue=self.lo, maxValue=self.hi, value=value,
                             callback=self._slid, sizeStyle="small")
        self.field = EditText("auto", fmt(value, step), continuous=False,
                              callback=self._typed, sizeStyle="small")
        self.stepper = Stepper("auto", value=value, minValue=-1e6, maxValue=1e6, increment=step,
                               callback=self._stepped, sizeStyle="small")
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
        if v > self.hi:                                            # typing past the end extends the slider
            self.hi = v
            self.slider.setMaxValue(v)
        if v < self.lo:
            self.lo = v
            self.slider.setMinValue(v)
        self.set(v, sender)

    def set(self, v, source=None, quiet=False):
        self.value = v
        if source is not self.slider:
            self.slider.set(v)
        self.field.set(fmt(v, self.step))
        if source is not self.stepper:
            self.stepper.set(v)
        if not quiet:
            self.on_change(v)


# ── interface description: one line per row ──────────────────

def num(key, text, lo, hi, step, show=None): return dict(kind="num", key=key, text=text, lo=lo, hi=hi, step=step, show=show)
def pop(key, text, items, show=None):        return dict(kind="pop", key=key, text=text, items=items, show=show)
def seg(key, text, items, show=None):        return dict(kind="seg", key=key, text=text, items=items, show=show)
def chk(key, text, show=None):               return dict(kind="chk", key=key, text=text, show=show)
def col(key, text, show=None):               return dict(kind="col", key=key, text=text, show=show)
def txt(key, text, show=None):               return dict(kind="txt", key=key, text=text, show=show)
def svg(key, text, show=None):               return dict(kind="svg", key=key, text=text, show=show)
def bar(text, items, action, show=None):     return dict(kind="bar", text=text, items=items, action=action, show=show)
def hdr(text, show=None):                    return dict(kind="hdr", text=text, show=show)
def custom(name, show=None):                 return dict(kind="custom", name=name, show=show)

is_ = lambda key, *values: (lambda S: S[key] in values)

SECTIONS = [
    ("Dial", [
        num("dial_d", "Diameter", 15, 50, 0.1),
        num("margin", "Page margin", 0, 10, 0.5),
        chk("guides", "Construction guides"),
        hdr("Colour"),
        col("c_plate", "Plate"), col("c_ink", "Print"), col("c_hands", "Hands"),
        col("c_accent", "Seconds"), col("c_backdrop", "Backdrop"),
    ]),
    ("Track", [
        pop("tr_div", "Divisions", [str(d) for d in DIVISIONS]),
        num("tr_inset", "Inset", 0, 4, 0.05),
        num("tr_len", "Tick length", 0.1, 4, 0.05),
        num("tr_w", "Tick width", 0.02, 0.6, 0.01),
        num("tr_minor_len", "Fine length", 0.1, 3, 0.05, show=lambda S: S["tr_div"] > 0),
        num("tr_minor_w", "Fine width ×", 0.2, 1, 0.05, show=lambda S: S["tr_div"] > 0),
        chk("tr_rail", "Railroad rails"),
        num("tr_rail_w", "Rail width", 0.02, 0.4, 0.01, show=is_("tr_rail", True)),
        hdr("Where ticks meet markers"),
        seg("tr_collision", "Rule", COLLISIONS),
        num("tr_clear", "Clearance", 0, 1, 0.01, show=is_("tr_collision", 2)),
    ]),
    ("Markers", [
        seg("mk_shape", "Shape", SHAPES),
        svg("mk_svg", "SVG file", show=is_("mk_shape", 3)),
        pop("mk_at", "Show at", SHOW_AT),
        num("mk_len", "Length", 0.2, 8, 0.05, show=lambda S: S["mk_shape"] != 2),
        num("mk_w", "Width · Ø", 0.1, 4, 0.05),
        num("mk_offset", "Offset", -3, 6, 0.05, show=lambda S: S["tr_collision"] != 0),
        num("mk_taper", "Inner width ×", 0, 2, 0.01, show=is_("mk_shape", 1)),
        num("mk_round_out", "Round outer", 0, 2, 0.01, show=is_("mk_shape", 0, 1)),
        num("mk_round_in", "Round inner", 0, 2, 0.01, show=is_("mk_shape", 0, 1)),
        num("mk_wall", "Hollow wall", 0, 1.5, 0.01, show=lambda S: S["mk_shape"] != 3),
        hdr("12 o'clock"),
        seg("mk_twelve", "Style", TWELVES),
        num("mk_twelve_scale", "Scale ×", 0.5, 2.5, 0.05, show=lambda S: S["mk_twelve"] != 3),
        num("mk_twelve_gap", "Gap", 0, 3, 0.05, show=is_("mk_twelve", 1)),
    ]),
    ("Type", [
        custom("family"), custom("style"), custom("instance"),
        pop("ty_lang", "Language", LANGS),
        num("ty_size", "Size", 0.5, 8, 0.05),
        num("ty_tracking", "Tracking", -200, 800, 5),
        custom("axes_header"),
    ]),
    ("Numerals", [
        pop("nu_set", "Labels", [n for n, _ in LABEL_SETS]),
        txt("nu_custom", "Custom", show=lambda S: LABEL_SETS[S["nu_set"]][0] == "Custom"),
        pop("nu_at", "Show at", NUMERAL_AT),
        pop("nu_mode", "Placement", MODES),
        num("nu_r", "Radius", 1, 22, 0.05),
        hdr("Move one numeral"),
        custom("nudge"),
    ]),
    ("Hands", [
        chk("ha_on", "Show hands"),
        pop("ha_style", "Style", HAND_STYLES),
        svg("ha_svg_hour", "Hour SVG", show=is_("ha_style", 4)),
        svg("ha_svg_min", "Minute SVG", show=is_("ha_style", 4)),
        svg("ha_svg_sec", "Seconds SVG", show=is_("ha_style", 4)),
        num("ha_hour_len", "Hour length %", 20, 110, 1),
        num("ha_min_len", "Minute length %", 30, 120, 1),
        num("ha_hour_w", "Hour width", 0.1, 4, 0.05),
        num("ha_min_w", "Minute width", 0.1, 4, 0.05),
        num("ha_tail", "Tail %", 0, 40, 1),
        num("ha_cap", "Cap Ø", 0, 4, 0.05),
        hdr("Seconds"),
        chk("ha_sec_on", "Seconds hand"),
        num("ha_sec_len", "Length %", 30, 120, 1, show=is_("ha_sec_on", True)),
        num("ha_sec_w", "Width", 0.03, 0.6, 0.01, show=is_("ha_sec_on", True)),
        num("ha_counter", "Counterweight Ø", 0, 3, 0.05, show=is_("ha_sec_on", True)),
        pop("ha_beat", "Motion", [n for n, _ in BEATS], show=is_("ha_sec_on", True)),
    ]),
    ("Date", [
        chk("da_on", "Date window"),
        pop("da_at", "Position", [n for n, _ in DATE_AT], show=is_("da_on", True)),
        num("da_r", "Radius", 2, 18, 0.05, show=is_("da_on", True)),
        num("da_w", "Width", 0.5, 6, 0.05, show=is_("da_on", True)),
        num("da_h", "Height", 0.5, 5, 0.05, show=is_("da_on", True)),
        num("da_round", "Corner", 0, 2, 0.05, show=is_("da_on", True)),
        num("da_frame", "Frame", 0, 0.6, 0.01, show=is_("da_on", True)),
        txt("da_day", "Shows", show=is_("da_on", True)),
        num("da_size", "Text % of height", 20, 100, 1, show=is_("da_on", True)),
    ]),
    ("Export", [
        chk("out_production", "Production: mono print mask"),
        chk("out_mirror", "Mirror: toner transfer"),
        num("out_dpi", "PNG dpi", 72, 2400, 1),
        num("out_seconds", "Clip seconds", 1, 60, 1),
        num("out_fps", "Frames per s", 6, 60, 1),
        bar("Export", ["PDF", "SVG", "PNG", "MP4", "GIF"], "export"),
        bar("Settings", ["Save…", "Load…", "Defaults"], "presets"),
    ]),
]

GRID_COLUMNS = [dict(width=104, columnPlacement="trailing"), dict(width=196, columnPlacement="fill"),
                dict(width=56, columnPlacement="fill"), dict(width=22, columnPlacement="leading")]


def guard(fn):
    """any error in a control goes to the log instead of disappearing."""
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
        self.ready, self.timer, self.last_save = False, None, 0
        self.visibility = []                                       # (grid, row, predicate)
        self.axis_params, self.nudge_params = {}, {}
        self.families = font_families()

        self.w = Window((1240, 820), "Dial Tool · beta 1.0", minSize=(1000, 700), autosaveName="DialToolWindow")
        titles = [t for t, _ in SECTIONS]
        self.w.sections = SegmentedButton((10, 10, 430, 24), [dict(title=t, width=52) for t in titles],
                                          callback=self._section_cb, sizeStyle="small")
        self.groups = []
        for i, (title, spec) in enumerate(SECTIONS):
            g = Group((10, 44, 430, -34))
            setattr(self.w, f"section{i}", g)
            self.groups.append(g)
            self._build_section(g, title, spec)

        self.w.canvas = DrawView((450, 10, -10, -72))
        self.w.timeLabel = TextBox((452, -58, 40, 18), "Time", sizeStyle="small")
        self.w.timeSlider = Slider((492, -60, -312, 22), minValue=0, maxValue=43199, value=self.S["t"],
                                   callback=self._time_slid, sizeStyle="small")
        self.w.timeField = EditText((-302, -60, 76, 22), fmt_time(self.S["t"]), continuous=False,
                                    callback=self._time_typed, sizeStyle="small")
        self.w.now = Button((-218, -60, 56, 22), "Now", callback=self._now, sizeStyle="small")
        self.w.play = Button((-156, -60, 66, 22), "Play", callback=self._play, sizeStyle="small")
        self.w.fit = Button((-84, -60, 74, 22), "Fit", callback=self._fit, sizeStyle="small")
        self.w.status = TextBox((12, -24, -12, 16), "", sizeStyle="mini")

        self._load_nudge()
        self.w.bind("close", self._closed)
        self.w.sections.set(self.S["ui_section"])
        self._show_section(self.S["ui_section"])
        self._refresh_visibility()
        self.w.open()
        self.ready = True
        family = self.S["ty_family"] if self.S["ty_family"] in self.families else (
            "Helvetica Neue" if "Helvetica Neue" in self.families else self.families[0])
        self.family.set(family)
        self.load_family(family, keep_ps=self.S["ty_ps"])          # renders

    # ── building sections ────────────────────────────────────

    def _build_section(self, g, title, spec):
        rows, merges, visibility = [], [], []
        for item in spec:
            for cells, wide, top in self._make_rows(item):
                if wide:
                    merges.append(len(rows))
                if item.get("show"):
                    visibility.append((len(rows), item["show"]))
                rows.append(dict(cells=cells, rowPadding=(top, 0)))
        g.grid = GridView("auto", rows, columnDescriptions=GRID_COLUMNS, columnSpacing=6,
                          rowSpacing=6, rowPlacement="center", rowAlignment="none")
        nsgrid = g.grid.getNSGridView()
        for r in merges:                                           # wide controls span 3 columns
            try:
                nsgrid.mergeCellsInHorizontalRange_verticalRange_((1, 3), (r, 1))
            except Exception:
                pass
        for r, pred in visibility:
            self.visibility.append((g.grid, r, pred))
        if title == "Type":
            self.type_grid, self.type_base_rows = g.grid, len(rows)
            g.featuresLabel = bold("OpenType features")
            g.features = List("auto", [],
                columnDescriptions=[dict(title="", key="on", cell=CheckBoxListCell(), width=22),
                                    dict(title="Tag", key="tag", editable=False, width=46),
                                    dict(title="Feature", key="name", editable=False)],
                editCallback=self._features_edited, allowsSorting=False, drawFocusRing=False)
            self.features_list = g.features
            g.addAutoPosSizeRules(["H:|[grid]", "H:|-4-[featuresLabel]-4-|", "H:|-4-[features]-4-|",
                                   "V:|[grid]-16-[featuresLabel]-6-[features]|"])
        elif title == "Export":
            g.log = TextEditor("auto", "", readOnly=True)
            self.logbox = g.log
            g.addAutoPosSizeRules(["H:|[grid]", "H:|-4-[log]-4-|", "V:|[grid]-16-[log]|"])
        else:
            g.addAutoPosSizeRules(["H:|[grid]", "V:|[grid]"])

    def _make_rows(self, item):
        """→ list of (cells, wide, top padding)"""
        k, S = item["kind"], self.S
        if k == "num":
            p = Param(item["text"], item["lo"], item["hi"], S[item["key"]], item["step"],
                      lambda v, key=item["key"]: self.set(key, v))
            return [(p.row, False, 0)]
        if k == "pop":
            c = PopUpButton("auto", item["items"], sizeStyle="small",
                            callback=lambda s, key=item["key"]: self.set(key, s.get()))
            c.set(S[item["key"]])
            return [([label(item["text"]), c, blank(), blank()], True, 0)]
        if k == "seg":
            c = segmented(item["items"], lambda s, key=item["key"]: self.set(key, s.get()))
            c.set(S[item["key"]])
            return [([label(item["text"]), c, blank(), blank()], True, 0)]
        if k == "chk":
            c = CheckBox("auto", item["text"], value=S[item["key"]], sizeStyle="small",
                         callback=lambda s, key=item["key"]: self.set(key, bool(s.get())))
            return [([blank(), c, blank(), blank()], True, 0)]
        if k == "col":
            c = ColorWell("auto", color=to_ns(S[item["key"]]),
                          callback=lambda s, key=item["key"]: self.set(key, from_ns(s.get())))
            return [([label(item["text"]), dict(view=c, width=44, height=20, columnPlacement="leading"),
                      blank(), blank()], False, 0)]
        if k == "txt":
            c = EditText("auto", S[item["key"]], continuous=False, sizeStyle="small",
                         callback=lambda s, key=item["key"]: self.set(key, str(s.get())))
            return [([label(item["text"]), c, blank(), blank()], True, 0)]
        if k == "svg":
            c = PopUpButton("auto", [], sizeStyle="small",
                            callback=lambda s, key=item["key"]: self._svg_cb(s, key))
            self._svg_items(c, S[item["key"]])
            return [([label(item["text"]), c, blank(), blank()], True, 0)]
        if k == "bar":
            c = segmented(item["items"], lambda s, act=item["action"]: self._bar(act, s), momentary=True)
            return [([label(item["text"]), c, blank(), blank()], True, 4)]
        if k == "hdr":
            return [([blank(), bold(item["text"]), blank(), blank()], True, 12)]
        return getattr(self, "_rows_" + item["name"])()

    # custom rows

    def _rows_family(self):
        self.family = ComboBox("auto", self.families, completes=True, sizeStyle="small",
                               callback=self._family_cb)
        self.family.getNSComboBox().setNumberOfVisibleItems_(24)
        return [([label("Family"), self.family, blank(), blank()], True, 0)]

    def _rows_style(self):
        self.style = PopUpButton("auto", [], sizeStyle="small", callback=self._style_cb)
        return [([label("Style"), self.style, blank(), blank()], True, 0)]

    def _rows_instance(self):
        self.instance = PopUpButton("auto", ["—"], sizeStyle="small", callback=self._instance_cb)
        return [([label("Instance"), self.instance, blank(), blank()], True, 0)]

    def _rows_axes_header(self):
        self.axes_header = bold("Variable axes")
        return [([blank(), self.axes_header, blank(), blank()], True, 12)]

    def _rows_nudge(self):
        self.nudge_pick = PopUpButton("auto", ["12"] + [str(i) for i in range(1, 12)], sizeStyle="small",
                                      callback=lambda s: self._load_nudge())
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
        for grid, row, pred in self.visibility:
            grid.showRow(row, bool(pred(self.S)))

    # ── settings → render ────────────────────────────────────

    @guard
    def set(self, key, value):
        self.S[key] = value
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
        draw_page(self.D, self.S, self.static, self.S["t"], preview=True)
        self._show_pdf(self.D.pdfImage())
        ms = (time.perf_counter() - t0) * 1000
        self.w.status.set(f"{self.S['ty_ps']}   ·   Ø {self.S['dial_d']:.1f} mm   ·   redraw {ms:.0f} ms")
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

    # ── type ─────────────────────────────────────────────────

    @guard
    def _family_cb(self, sender):
        name = str(sender.get())
        if name in self.families and name != self.S["ty_family"]:
            self.load_family(name)

    def load_family(self, family, keep_ps=None):
        self.S["ty_family"] = family
        self.styles = font_styles(family)
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
        self.load_font(pss[i])

    @guard
    def _style_cb(self, sender):
        self.load_font(self.styles[sender.get()][1])

    @guard
    def load_font(self, ps):
        self.S["ty_ps"] = ps
        fs = FormattedString()
        axes = fs.listFontVariations(ps)
        self.instances = fs.listNamedInstances(ps)
        self.instance.setItems(["—"] + list(self.instances))

        grid = self.type_grid.getNSGridView()                      # rebuild the axis rows
        while grid.numberOfRows() > self.type_base_rows:
            row = grid.rowAtIndex_(grid.numberOfRows() - 1)
            for c in range(row.numberOfCells()):
                v = row.cellAtIndex_(c).contentView()
                if v is not None:
                    v.removeFromSuperview()
            grid.removeRowAtIndex_(grid.numberOfRows() - 1)
        old, new, self.axis_params = self.S["ty_axes"], {}, {}
        for tag, a in axes.items():
            lo, hi = a["minValue"], a["maxValue"]
            v = min(max(old.get(tag, a["defaultValue"]), lo), hi)
            new[tag] = v
            p = Param(str(a["name"]), lo, hi, v, 1 if hi - lo > 20 else 0.01,
                      lambda val, tag=tag: self._axis_changed(tag, val))
            p.row[0].getNSTextField().setToolTip_(tag)
            self.axis_params[tag] = (p, str(a["name"]))
            self.type_grid.appendRow(p.row)
        self.S["ty_axes"] = new
        self.axes_header.set("Variable axes" if axes else "Variable axes: none in this font")

        names = designer_feature_names(ps)
        tags = sorted(set(str(t) for t in fs.listOpenTypeFeatures(ps)))
        feats = self.S["ty_features"]
        self._updating_features = True
        self.features_list.set([dict(on=feats.get(t, t in DEFAULT_ON), tag=t,
                                     name=names.get(t) or FEATURE_NAMES.get(t, "")) for t in tags])
        self._updating_features = False
        self.static_dirty = True
        self.render()

    @guard
    def _axis_changed(self, tag, value):
        self.S["ty_axes"][tag] = value
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
                self.S["ty_axes"][tag] = v
        self.static_dirty = True
        self.render()

    @guard
    def _features_edited(self, sender):
        if getattr(self, "_updating_features", False):
            return
        feats = {}
        for item in sender.get():
            tag, on = str(item["tag"]), bool(item["on"])
            if on != (tag in DEFAULT_ON):
                feats[tag] = on                                    # only store what differs from the font's default
        self.S["ty_features"] = feats
        self.static_dirty = True
        self.render()

    # ── numeral nudge ────────────────────────────────────────

    def _nudge_key(self):
        return self.nudge_pick.getItem()

    def _load_nudge(self):
        n = self.S["nu_nudge"].get(self._nudge_key(), {})
        for key, p in self.nudge_params.items():
            p.set(n.get(key, p.rest), quiet=True)

    @guard
    def _nudge_changed(self, key, value):
        h = self._nudge_key()
        n = dict(self.S["nu_nudge"].get(h, {}))
        n[key] = value
        n = {k: v for k, v in n.items() if v != self.nudge_params[k].rest}
        nudges = dict(self.S["nu_nudge"])
        if n:
            nudges[h] = n
        else:
            nudges.pop(h, None)
        self.set("nu_nudge", nudges)

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
        if index == 1:
            self.S["nu_nudge"] = {}
        else:
            self.S["nu_nudge"] = {k: v for k, v in self.S["nu_nudge"].items() if k != self._nudge_key()}
        self._load_nudge()
        self.set("nu_nudge", self.S["nu_nudge"])

    # ── SVG files ────────────────────────────────────────────

    def _svg_items(self, popup, path):
        popup.setItems([os.path.basename(path) if path else "none", "Choose…", "Clear"])
        popup.set(0)

    @guard
    def _svg_cb(self, sender, key):
        choice = sender.get()
        if choice == 1:
            paths = getFile(messageText="Choose an SVG (drawn pointing up, anchor at artboard centre)",
                            fileTypes=["svg"])
            if paths:
                self.S[key] = paths[0]
        elif choice == 2:
            self.S[key] = ""
        self._svg_items(sender, self.S[key])
        self.set(key, self.S[key])

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
