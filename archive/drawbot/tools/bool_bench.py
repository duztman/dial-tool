"""
bool_bench.py — how fast is shape combining (union, difference, remove overlap)?

DrawBot 3.132 combines shapes with `booleanOperations` (partly pure Python).
The test harness, through drawbot-skia, uses `skia-pathops` (C++).
This script builds every harness dial twice, once with each library, with
the shape memory (`_memo`) cleared before every build, and prints the times.

Off-Mac numbers. They show how much faster one library is than the other,
not how fast the Mac is. See docs/preview.md §2.4.

Setup: the harness's packages, plus booleanOperations
    pip install drawbot-skia skia-pathops pillow booleanOperations
Use:
    python tools/bool_bench.py            # all harness dials, median of 3
    python tools/bool_bench.py 5          # median of 5
"""

import statistics, sys, time, os

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import test_harness as H
import booleanOperations
from fontTools.pens.basePen import BasePen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.pointPen import SegmentToPointPen, PointToSegmentPen
from drawbot_skia.path import BezierPath as BP


class Cubic(BasePen):
    """booleanOperations accepts lines and cubic curves only; TrueType text arrives as quadratics."""
    def __init__(self, out):
        super().__init__(None)
        self.out = out
    def _moveTo(self, p): self.out.moveTo(p)
    def _lineTo(self, p): self.out.lineTo(p)
    def _curveToOne(self, a, b, c): self.out.curveTo(a, b, c)
    def _closePath(self): self.out.closePath()
    def _endPath(self): self.out.endPath()


class Contour:
    """the contour object booleanOperations expects (DrawBot hands it the same shape)."""
    def __init__(self, rec):
        self.rec = rec
    def __len__(self):
        return len(self.rec.value)
    def drawPoints(self, pointPen):
        self.rec.replay(SegmentToPointPen(pointPen))


def contours(path):
    rec = RecordingPen()
    path.drawToPen(Cubic(rec))
    out, cur = [], None
    for op, args in rec.value:
        if op == "moveTo":
            cur = RecordingPen()
            out.append(cur)
        getattr(cur, op)(*args)
    return [Contour(c) for c in out]


def run(fn, *paths):
    result = BP()
    fn(*[contours(p) for p in paths], PointToSegmentPen(result))
    return result


PATHOPS = dict(union=BP.union, difference=BP.difference, removeOverlap=BP.removeOverlap)

def use_pathops():
    for k, v in PATHOPS.items():
        setattr(BP, k, v)

def use_boolean_operations():
    def union(a, b):
        both = BP()
        both.appendPath(a)
        both.appendPath(b)
        return run(booleanOperations.union, both)
    def remove_overlap(a):
        a.path = run(booleanOperations.union, a).path
        return a
    BP.union = union
    BP.difference = lambda a, b: run(booleanOperations.difference, a, b)
    BP.removeOverlap = remove_overlap


if __name__ == "__main__":
    repeats = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    ns = H.load_dial(H.find_font())
    print(f"{'dial':22s} {'pathops':>10s} {'booleanOperations':>19s} {'slower by':>10s}")
    for name, over in H.VARIANTS.items():
        row = []
        for mode in (use_pathops, use_boolean_operations):
            mode()
            times = []
            for _ in range(repeats):
                ns["_memo"].clear()                                 # cold build, like a first render
                S = ns["fresh_settings"](over)
                t0 = time.perf_counter()
                ns["build_static"](S)
                times.append((time.perf_counter() - t0) * 1000)
            row.append(statistics.median(times))
        print(f"{name:22s} {row[0]:8.0f} ms {row[1]:16.0f} ms {row[1] / max(row[0], 0.1):9.1f}×")
    use_pathops()
