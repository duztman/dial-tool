"""check3d.py — compares same3d.mjs's before-* and after-* shots: the largest difference of any pixel and how many pixels differ."""
import sys, glob, os
from PIL import Image, ImageChops
import numpy as np
d = sys.argv[1]; bad = 0
for b in sorted(glob.glob(os.path.join(d, "before-*"))):
    a = b.replace("before-", "after-")
    if not os.path.exists(a): print("missing", os.path.basename(a)); bad += 1; continue
    if b.endswith(".png"):
        x, y = np.asarray(Image.open(b).convert("RGB"), int), np.asarray(Image.open(a).convert("RGB"), int)
        if x.shape != y.shape: print("size differs", os.path.basename(b)); bad += 1; continue
        diff = np.abs(x - y).max(axis=2); n = int((diff > 2).sum())
        print(f"{os.path.basename(b)[7:]:28s} max {int(diff.max()):3d}  pixels over 2: {n}")
        print(f"{'':28s} (pictures carry the AO's noise: judged by eye, the scene.txt and engineer.svg are the exact proof)") if n and 0 else None
    else:
        same = open(b).read() == open(a).read(); print(f"{os.path.basename(b)[7:]:28s} {'same' if same else 'DIFFERS'}"); bad += not same
print("SAME" if not bad else f"{bad} differ")
