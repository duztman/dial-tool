"""score.py — the reader test's overlay (guide/BRIEF.md): lays a reader's mono mask PNG over the target's, both
exported by the app, centre on centre, at true size, and measures how far each mark is from the nearest mark of the
other. Pass for marks: no ink farther than 0.2 mm from the other's ink (the worst 0.2 % of pixels set aside: edges
anti-aliased). Counts, kinds, hands and colours are judged by eye from the colour exports; this reports marks only.

    python3 guide/tools/score.py target-mask.png reader-mask.png [overlay.png]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage


def load(path):
    im = Image.open(path)
    dpi = (im.info.get("dpi") or (600, 600))[0]
    a = np.asarray(im.convert("L"), dtype=np.uint8) < 128          # ink: the dark pixels
    return a, 25.4 / dpi


def centred(a, size):
    """put mask a in the middle of a size × size field (the dial's centre is the page's)."""
    out = np.zeros((size, size), bool)
    h, w = a.shape
    oy, ox = (size - h) // 2, (size - w) // 2
    out[max(oy, 0):max(oy, 0) + min(h, size), max(ox, 0):max(ox, 0) + min(w, size)] = \
        a[max(-oy, 0):max(-oy, 0) + min(h, size), max(-ox, 0):max(-ox, 0) + min(w, size)]
    return out


def main(target, reader, overlay=None):
    t, mm_t = load(target)
    r, mm_r = load(reader)
    if abs(mm_t - mm_r) > 1e-6:
        sys.exit(f"export both at the same dpi ({25.4 / mm_t:.0f} vs {25.4 / mm_r:.0f})")
    size = max(t.shape + r.shape)
    t, r = centred(t, size), centred(r, size)
    far_t = ndimage.distance_transform_edt(~r)[t] * mm_t             # each target ink pixel: mm to the reader's ink
    far_r = ndimage.distance_transform_edt(~t)[r] * mm_t             # and the other way
    worst = max(np.percentile(far_t, 99.8) if far_t.size else 99, np.percentile(far_r, 99.8) if far_r.size else 99)
    print(f"marks: worst {worst:.3f} mm (target→reader {np.percentile(far_t, 99.8):.3f}, reader→target {np.percentile(far_r, 99.8):.3f}) · "
          f"{'PASS' if worst <= 0.2 else 'FAIL'} at 0.2 mm")
    if overlay:                                                      # target in cyan, reader in magenta, both = black
        img = np.full((size, size, 3), 255, np.uint8)
        img[t & ~r] = (0, 170, 220)
        img[r & ~t] = (230, 0, 120)
        img[t & r] = (20, 20, 20)
        Image.fromarray(img).save(overlay)
    return worst <= 0.2


if __name__ == "__main__":
    sys.exit(0 if main(*sys.argv[1:4]) else 1)
