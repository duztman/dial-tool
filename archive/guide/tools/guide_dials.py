"""
guide_dials.py — the example dials shown in the guidebook, as Dial Tool settings.

Each dial is a settings dictionary, exactly what Export → Save… writes and
Load… reads (rings top first; anything not named keeps its starting value).
They are drawn after well-known dial types, by eye — approximations, not
measured copies. tools/make_guide.py renders them and prints these same
values next to each picture, so the guide's numbers are the real ones.

Fonts are named as on macOS (family + PostScript name). Off-Mac, the guide
is rendered with open fonts that look similar (FONT_STAND_INS).

make_guide.py also writes each one to docs/guide/presets/<name>.json, ready for Load….
"""

import json

BLACK  = [0.06, 0.06, 0.07, 1]
WHITE  = [0.97, 0.97, 0.95, 1]
SILVER = [0.93, 0.93, 0.91, 1]
CREAM  = [0.93, 0.89, 0.78, 1]          # aged lume
LUME   = [0.88, 0.92, 0.84, 1]          # fresh lume
STEEL  = [0.78, 0.79, 0.80, 1]
GRAPHITE = [0.20, 0.21, 0.23, 1]
INK    = [0.08, 0.08, 0.08, 1]
RED    = [0.82, 0.12, 0.10, 1]
ORANGE = [0.93, 0.42, 0.10, 1]
BLUE   = [0.10, 0.22, 0.50, 1]
NAVY   = [0.13, 0.22, 0.36, 1]

DIN     = dict(family="DIN Alternate", ps="DINAlternate-Bold")
FUTURA  = dict(family="Futura", ps="Futura-Medium")
HELV    = dict(family="Helvetica Neue", ps="HelveticaNeue-Medium")
BODONI  = dict(family="Bodoni 72", ps="BodoniSvtyTwoITCTT-Book")

# macOS PostScript name → (open font file in docs/guide/cache, variable-font instance)
FONT_STAND_INS = {
    "DINAlternate-Bold":       ("Barlow-SemiBold.ttf", None),
    "Futura-Medium":           ("Jost.ttf", dict(wght=500)),
    "HelveticaNeue":           ("Arimo.ttf", dict(wght=400)),
    "HelveticaNeue-Medium":    ("Arimo.ttf", dict(wght=500)),
    "HelveticaNeue-Bold":      ("Arimo.ttf", dict(wght=700)),
    "BodoniSvtyTwoITCTT-Book": ("BodoniModa.ttf", dict(wght=700, opsz=6)),
}


def lume_hand(shape, length, width, colour, **more):
    return dict(shape=shape, len=length, w=width, c=colour, **more)


DIALS = {}

# ── field watch ──────────────────────────────────────────────
DIALS["field"] = dict(
    note='The 24-hour ring is a second numerals ring with a Custom list. The minute ticks <b>skip where</b> the hour marks sit, so the two never overprint.',
    title="Field watch",
    after="After the A-11 of the 1940s and its descendants: 12 and 24 hours, a plain minute track, nothing else.",
    settings=dict(
        dial_d=30.0, c_plate=BLACK,
        rings=[
            dict(kind="numerals", name="Hours", r=10.5, size=3.0, c=CREAM, **DIN),
            dict(kind="numerals", name="24 hours", r=7.3, size=1.35, c=CREAM, labels="Custom",
                 custom="24, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23", **DIN),
            dict(kind="markers", name="Hour marks", r=14.4, len=1.7, w=0.42, c=CREAM),
            dict(kind="ticks", name="Minutes", r=14.4, count=60, len=1.0, w=0.16, c=CREAM, skip=1),
        ],
        ha_hour=lume_hand("sword", 7.6, 1.5, CREAM, tail=1.6, tip=2.4),
        ha_minute=lume_hand("sword", 12.6, 1.2, CREAM, tail=1.8, tip=3.0),
        ha_second=lume_hand("baton", 13.2, 0.14, CREAM, tail=3.4),
        ha_cap=1.5, c_cap=CREAM,
    ))

# ── pilot, type B ────────────────────────────────────────────
DIALS["pilot"] = dict(
    note='The minutes are <b>Numbers</b>: first 5, step 5, two digits, over a 300° span that leaves 12 free for the triangle. The two dots are a ticks ring with Count 2 on a 22° span.',
    title="Pilot, type B",
    after="After the 1940s observer's watch: minutes outside, hours on an inner ring, a triangle and two dots at 12.",
    settings=dict(
        dial_d=34.0, c_plate=BLACK,
        rings=[
            dict(kind="numerals", name="Minutes", r=12.6, count=11, start=30, span=300, size=2.5, c=WHITE,
                 labels="Numbers", num_from=5, num_step=5, num_digits=2, **DIN),
            dict(kind="markers", name="Triangle", r=14.0, count=1, shape="wedge", taper=0.0, len=2.6, w=2.6, c=WHITE),
            dict(kind="ticks", name="Two dots", r=13.6, count=2, start=-11, span=22, shape="dot", w=0.7, c=WHITE),
            dict(kind="markers", name="Five minutes", r=16.4, len=2.2, w=0.5, c=WHITE),
            dict(kind="ticks", name="Minute track", r=16.4, count=60, len=1.3, w=0.2, c=WHITE, skip=1),
            dict(kind="numerals", name="Hours", r=6.6, size=1.7, c=WHITE, **DIN),
            dict(kind="band", name="Hour circle", r=8.6, width=0.14, c=WHITE),
        ],
        ha_hour=lume_hand("sword", 7.4, 2.0, WHITE, tail=1.4, tip=2.6),
        ha_minute=lume_hand("sword", 14.6, 1.5, WHITE, tail=1.8, tip=3.6),
        ha_second=lume_hand("baton", 15.4, 0.16, WHITE, tail=4.2, counter=1.1),
        ha_cap=1.7, c_cap=WHITE,
    ))

# ── diver ────────────────────────────────────────────────────
DIALS["diver"] = dict(
    note='Three markers rings share the hours: dots on <b>Every 3, skip those instead</b>; bars on Count 4 with the first position set to none; one triangle. The date takes 3 by itself.',
    title="Diver",
    after="After the 1950s dive watch: fat dots, bars at 6 and 9, a triangle at 12, the date at 3.",
    settings=dict(
        dial_d=29.0, c_plate=BLACK,
        rings=[
            dict(kind="markers", name="Triangle", r=13.2, count=1, shape="wedge", taper=0.0, len=3.3, w=3.5,
                 round_out=0.25, c=LUME),
            dict(kind="markers", name="Bars 6 · 9", r=13.2, count=4, len=3.3, w=1.5, round_out=0.2, round_in=0.2,
                 twelve="none", c=LUME),
            dict(kind="markers", name="Dots", r=13.0, shape="dot", w=2.3, every=3, invert=True, c=LUME),
            dict(kind="numerals", name="Depth", r=5.2, count=1, start=180, size=0.95, mode="on path",
                 labels="Custom", custom="200 m  ·  660 ft", c=WHITE, **HELV),
            dict(kind="ticks", name="Minutes", r=14.3, count=60, len=0.9, w=0.16, c=WHITE),
        ],
        da_on=True, da_at=0, da_r=10.7, da_w=2.7, da_h=2.0, da_round=0.15, da_frame=0.0, da_clear=0.3,
        da_day="24", da_size=68, da_ink=INK,
        ha_hour=lume_hand("pencil", 7.4, 2.0, STEEL, tail=1.6, tip=1.8),
        ha_minute=lume_hand("pencil", 12.4, 1.5, STEEL, tail=1.8, tip=2.0),
        ha_second=lume_hand("lollipop", 13.0, 0.18, STEEL, tail=3.4, feature=1.25, feature_at=70),
        ha_cap=1.6, c_cap=STEEL,
    ))

# ── dress, after Seiko ───────────────────────────────────────
DIALS["dress"] = dict(
    note="The double bar is the markers ring's <b>12 o'clock</b> style. Both lines of text are numerals rings with Count 1, set <b>on path</b> at 180°.",
    title="Dress watch",
    after="After the Japanese dress watches of the 1960s: plain bars, a double bar at 12, dauphine hands, a framed date.",
    settings=dict(
        dial_d=30.4, c_plate=SILVER,
        rings=[
            dict(kind="markers", name="Hours", r=13.9, len=2.9, w=0.8, twelve="double", twelve_gap=0.3, c=GRAPHITE),
            dict(kind="ticks", name="Minutes", r=14.7, count=60, len=0.8, w=0.09, c=GRAPHITE, skip=1),
            dict(kind="numerals", name="Line 1", r=5.6, count=1, start=180, size=0.95, mode="on path",
                 labels="Custom", custom="AUTOMATIC", c=GRAPHITE, **HELV),
            dict(kind="numerals", name="Line 2", r=7.0, count=1, start=180, size=0.7, mode="on path",
                 labels="Custom", custom="HI-BEAT  36000", c=GRAPHITE, **HELV),
        ],
        da_on=True, da_at=0, da_r=10.9, da_w=2.7, da_h=2.0, da_round=0.1, da_frame=0.22, da_clear=0.25,
        da_day="8", da_size=70, da_ink=GRAPHITE,
        ha_hour=lume_hand("dauphine", 8.4, 1.6, GRAPHITE, tail=1.4, feature_at=20),
        ha_minute=lume_hand("dauphine", 13.0, 1.25, GRAPHITE, tail=1.6, feature_at=15),
        ha_second=lume_hand("baton", 13.9, 0.12, BLUE, tail=3.6),
        ha_cap=1.1, c_cap=GRAPHITE,
    ))

# ── railway ──────────────────────────────────────────────────
DIALS["railway"] = dict(
    note='Two rings. Everything is in the proportions: bars 3.7 × 1.3, ticks 1.3 × 0.45, and a lollipop with its disc at 100 % of the length.',
    title="Station clock",
    after="After the Swiss railway clock of 1944: heavy bars, and a red seconds hand like a dispatcher's baton.",
    settings=dict(
        dial_d=30.0, c_plate=WHITE,
        rings=[
            dict(kind="markers", name="Hours", r=14.3, len=3.7, w=1.3, c=INK),
            dict(kind="ticks", name="Minutes", r=14.3, count=60, len=1.3, w=0.45, c=INK, skip=1),
        ],
        ha_hour=lume_hand("baton", 8.8, 1.7, INK, tail=2.4),
        ha_minute=lume_hand("baton", 13.6, 1.3, INK, tail=2.8),
        ha_second=lume_hand("lollipop", 9.8, 0.34, RED, tail=3.6, feature=2.7, feature_at=100),
        ha_cap=1.0, c_cap=RED,
    ))

# ── bauhaus ──────────────────────────────────────────────────
DIALS["bauhaus"] = dict(
    note='Line weights carry it: 0.14 for the hours, 0.09 for the minutes, hands under half a millimetre.',
    title="Bauhaus",
    after="After the German wall-clock school of the 1950s–60s: hairline marks, small numerals, thin hands.",
    settings=dict(
        dial_d=31.0, c_plate=WHITE,
        rings=[
            dict(kind="numerals", name="Hours", r=10.9, size=1.75, c=INK, **FUTURA),
            dict(kind="markers", name="Hour lines", r=14.6, len=2.4, w=0.14, c=INK),
            dict(kind="ticks", name="Minutes", r=14.6, count=60, len=1.3, w=0.09, c=INK, skip=1),
        ],
        ha_hour=lume_hand("baton", 8.6, 0.46, INK, tail=1.6),
        ha_minute=lume_hand("baton", 13.4, 0.36, INK, tail=2.0),
        ha_second=lume_hand("baton", 14.0, 0.1, INK, tail=3.6),
        ha_cap=0.9, c_cap=INK,
    ))

# ── california ───────────────────────────────────────────────
DIALS["california"] = dict(
    note="Two numerals rings on one radius, each with a <b>Custom</b> list that leaves the other's positions empty — so Roman and Arabic can use different fonts and placements.",
    title="California",
    after="After the 1930s–40s dial: Roman on top, Arabic below, bars at 3 · 6 · 9, a triangle at 12, a railroad track.",
    settings=dict(
        dial_d=30.0, c_plate=BLACK,
        rings=[
            dict(kind="numerals", name="Roman", r=9.6, size=3.3, mode="radial", c=CREAM, labels="Custom",
                 custom=", I, II, , , , , , , , X, XI", **BODONI),
            dict(kind="numerals", name="Arabic", r=9.6, size=3.2, mode="upright", c=CREAM, labels="Custom",
                 custom=", , , , 4, 5, , 7, 8, , ,", **DIN),
            dict(kind="markers", name="Bars + triangle", r=11.4, count=4, len=3.4, w=1.0, twelve="triangle",
                 twelve_scale=1.25, c=CREAM),
            dict(kind="ticks", name="Minutes", r=14.2, count=60, len=1.0, w=0.14, c=CREAM),
            dict(kind="band", name="Outer rail", r=14.2, width=0.12, c=CREAM),
            dict(kind="band", name="Inner rail", r=13.32, width=0.12, c=CREAM),
        ],
        ha_hour=lume_hand("pencil", 7.2, 1.5, CREAM, tail=1.4, tip=1.6),
        ha_minute=lume_hand("pencil", 11.8, 1.2, CREAM, tail=1.6, tip=1.8),
        ha_second=lume_hand("baton", 12.6, 0.13, CREAM, tail=3.2, counter=0.9),
        ha_cap=1.4, c_cap=CREAM,
    ))

# ── sector ───────────────────────────────────────────────────
DIALS["sector"] = dict(
    note='Bands do the colour: a chapter ring 2.6 wide, and pies made by Band width = Radius with Every 2. The crosshair is a ticks ring, Count 4, Length 12.',
    title="Sector dial",
    after="After the 1930s scientific dials: a chapter ring, a crosshair, zones of colour.",
    settings=dict(
        dial_d=30.0, c_plate=[0.94, 0.92, 0.87, 1],
        rings=[
            dict(kind="numerals", name="Hours", r=8.6, every=3, size=2.0, c=INK, **FUTURA),
            dict(kind="markers", name="Hour bars", r=11.9, len=1.4, w=0.45, every=3, invert=True, c=INK),
            dict(kind="ticks", name="Minutes", r=14.4, count=60, len=0.7, w=0.1, c=[1, 1, 1, 1]),
            dict(kind="numerals", name="Minute numerals", r=12.9, start=30, labels="Numbers", num_from=5,
                 num_step=5, num_digits=2, size=0.9, mode="radial, auto-flip", c=[1, 1, 1, 1], **FUTURA),
            dict(kind="band", name="Chapter", r=14.7, width=2.6, c=NAVY),
            dict(kind="ticks", name="Crosshair", r=12.0, count=4, len=12.0, w=0.1, c=INK),
            dict(kind="band", name="Sectors", r=6.0, width=6.0, count=12, every=2, c=[0.86, 0.82, 0.72, 1]),
        ],
        ha_hour=lume_hand("dauphine", 7.5, 1.3, NAVY, tail=1.0, feature_at=22),
        ha_minute=lume_hand("dauphine", 12.6, 1.1, NAVY, tail=1.4, feature_at=18),
        ha_second=lume_hand("lollipop", 13.4, 0.12, RED, tail=3.0, feature=0.9, feature_at=80),
        ha_cap=1.6, c_cap=NAVY,
    ))

# ── gauge ────────────────────────────────────────────────────
DIALS["gauge"] = dict(
    note='Start −135°, Span 270°. A partial span marks both ends, so Count 10 gives 0 to 90. The red zone <b>knocks out</b> everything above it with a 0.12 clearance.',
    title="Gauge",
    after="A 270° scale with a red zone: positions over a partial span mark both ends.",
    settings=dict(
        dial_d=30.0, c_plate=[0.95, 0.94, 0.90, 1],
        rings=[
            dict(kind="numerals", name="Scale", r=11.3, count=10, start=-135, span=270, labels="Numbers",
                 num_from=0, num_step=10, size=1.5, mode="radial, auto-flip", c=INK, **HELV),
            dict(kind="markers", name="Scale marks", r=14.3, count=10, start=-135, span=270, len=1.6, w=0.34,
                 shape="wedge", taper=0.3, c=INK),
            dict(kind="ticks", name="Scale ticks", r=14.3, count=46, start=-135, span=270, len=0.8, w=0.1,
                 skip=1, c=INK),
            dict(kind="band", name="Rail", r=14.5, width=0.12, count=1, start=-135, span=270, c=INK),
            dict(kind="band", name="Red zone", r=14.5, width=0.9, count=1, start=108, span=27, c=RED,
                 knock=3, clear=0.12),
        ],
        ha_hour=dict(on=False), ha_second=dict(on=False),
        ha_minute=lume_hand("arrow", 12.6, 0.4, INK, tail=2.6, tip=2.2, feature=1.5),
        ha_cap=1.2, c_cap=RED, t=10 * 3600 + 36 * 60,
    ))

ORDER = ["field", "diver", "dress", "pilot", "california", "railway", "bauhaus", "sector", "gauge"]


NAMED = dict(labels="LABEL_SETS", mode="MODES", twelve="TWELVES", skip="SKIP_FROM", knock="KNOCK_FROM")

def resolved(settings, ns):
    """names → the popup indexes dial.py stores (R9), using dial.py's own lists (ns = its namespace)."""
    out = json.loads(json.dumps(settings))
    for ring in out.get("rings", []):
        for key, list_name in NAMED.items():
            if isinstance(ring.get(key), str):
                names = [n[0] if isinstance(n, tuple) else n for n in ns[list_name]]
                ring[key] = names.index(ring[key])
    return out
