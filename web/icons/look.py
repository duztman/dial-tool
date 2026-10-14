"""icons/look.py — how heavy each icon line looks (R33, docs/design.md §9: "equal on the eye").

The screen is blurred as an eye sees a 2× screen at a desk (a gaussian, sigma 1.5 screen dots); the darkness is read
along each line's middle, in place among the icon's other parts (crowding counts), and compared with a lone straight
LINE (1.5) read the same way. A line within 6 % of it is equal to the eye; outside, it is listed with the width that
would bring it there. Measured, then looked at: the eye has the last word (Okay, 14 Oct 2026: "perception overrules,
sensibly").

    cd web && node icons/check.mjs && python3 icons/look.py            (needs numpy, scipy, pillow)
    python3 icons/look.py some.json                                      (any list of { id, svg }, e.g. from fit.mjs)
"""
import json, subprocess, sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates

SIGMA = 1.5            # screen dots
LIMIT = 0.06           # off by more than this: listed
HERE = os.path.dirname(os.path.abspath(__file__))
# lines this reading can't judge, and why (each was looked at instead)
SKIP = {
    "ring-size": "a value button: its disc's light fill reads as ink here",
    "ring-r": "a value button: its disc's light fill reads as ink here",
    "ring-mode": "Placement: its A's cross the faint dial edge, which reads here at full ink",
    "ring-kind": "pictured widths (ticks, marks, band), not lines",
    "add-": "pictured widths (ticks, marks, band), not lines",
}

def weigh(lines, sigma=SIGMA):
    res = {}
    for ln in lines:
        dark = 1 - np.asarray(Image.open(ln["file"]).convert("L"), dtype=float) / 255
        bl = gaussian_filter(dark, sigma)
        P = np.array(ln["P"]) - 0.5
        n = len(P)
        if not ln["closed"]:      # skip about one width at each open end: caps are not the line
            cut = max(1, int(n * min(0.25, ln["w"] / max(ln["L"], 1))))
            P = P[cut:n - cut] if n - 2 * cut >= 3 else P
        res[(ln["id"], ln["k"])] = float(np.median(map_coordinates(bl, [P[:, 1], P[:, 0]], order=1)))
    return res

def render(items, out, mode="context"):
    json.dump(items, open(out + ".json", "w"))
    subprocess.run(["node", os.path.join(HERE, "weigh.mjs"), out + ".json", out, mode], check=True, capture_output=True, cwd=os.path.dirname(HERE))
    return json.load(open(os.path.join(out, "lines.json")))

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out", "look.json")
    items = json.load(open(src))
    work = os.path.join(HERE, "out", "weigh")
    ref = render([{"id": "reference", "svg": '<svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M3 17.25H31" stroke-width="1.5"/></svg>'}], work + "-ref")
    T = list(weigh(ref).values())[0]
    lines = render(items, work)
    m = weigh(lines)
    # a second reading a quarter point heavier gives each line's slope: the width that would make it equal
    heavier = render([{**it, "w": {str(l["k"]): l["w"] + 0.25 for l in lines if l["id"] == it["id"]}} for it in items], work + "-b")
    m2 = weigh(heavier)
    alone = weigh(render(items, work + "-alone", "alone"))      # each line drawn by itself: is it the line, or its neighbours?
    rows, off = [], []
    for l in lines:
        key = (l["id"], l["k"])
        if any(l["id"].startswith(s) for s in SKIP): continue
        dev = m[key] / T - 1
        slope = (m2.get(key, m[key]) - m[key]) / 0.25
        fix = l["w"] + (T - m[key]) / slope if slope > 0.05 else None
        rows.append(dev)
        if abs(dev) > LIMIT: off.append((l["id"], l["k"], l["tag"], l["w"], dev, fix, alone.get(key, m[key]) / T - 1))
    if not rows: print("no lines to read"); return
    print(f"{len(rows)} lines read against a straight {1.5} line · median {np.median(np.abs(rows)) * 100:.1f} % off · worst tenth {np.percentile(np.abs(rows), 90) * 100:.1f} %")
    for i, k, tag, w, dev, fix, solo in sorted(off, key=lambda r: -abs(r[4])):
        why = f" in place, {solo * 100:+.0f} % drawn alone" + (": its neighbours (a fill, crowding) make the difference; look before changing it" if (solo * dev < 0 or abs(solo) <= LIMIT) else "")
        try_ = f" · equal at about {fix:.2f}: try {'DENSE' if fix < 1.4 else 'LINE' if fix < 1.53 else 'SLANT' if fix < 1.6 else 'CURVE'}" if fix and 1 < fix < 2.2 else ""
        print(f"look  {i} line {k} ({tag}, {w:.3f}) looks {dev * 100:+.0f} %{why}{try_}")
    print("skipped: " + "; ".join(f"{k}… ({v})" for k, v in SKIP.items()))
    if not off: print(f"ok    every line within {LIMIT * 100:.0f} % of the reference")

if __name__ == "__main__":
    main()
