# The title page's picture (20 Oct 2026, 19:04–19:38): one Calatrava drawn twice under the same light — Miyazaki on the
# left, Engineer on the right — joined at the watch's centre, with a faint material noise on the ground only. The ground
# is found by rendering each half once with a black floor (-m0) and once with a white one (-m1): what changes is ground.
from PIL import Image, ImageFilter
import random, numpy as np
L = lambda f: np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
B, E = L('cover-B.png'), L('cover-L.png'); h, w, _ = B.shape
x = round(195.1 / 297 * w)                       # the watch's centre, 195.1 mm from the page's left edge
img = E.copy(); img[:, :x] = B[:, :x]
ground = lambda p: np.abs(L(p + '-m1.png') - L(p + '-m0.png')).max(axis=2) / 255.0
gm = ground('cover-L'); gm[:, :x] = ground('cover-B')[:, :x]
gm = np.asarray(Image.fromarray((gm * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
rnd = random.Random(3)
def layer(div, blur, sd):
    sw, sh = w // div, h // div; n = Image.new('L', (sw, sh)); n.putdata([int(max(0, min(255, 128 + rnd.gauss(0, 1) * sd))) for _ in range(sw * sh)])
    return (np.asarray(n.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(blur))).astype(np.float32) - 128) / 128
big, fine, mid = layer(24, 10, 60), layer(3, 1.5, 50), layer(8, 3, 70)
img = img + (((big * 6 + fine * 2.5) - (np.clip(mid, 0, None) * 9 + 1.5)) * gm)[..., None]   # a big soft grain, a fine one, a darker detailed one
Image.fromarray(np.clip(img, 0, 255).astype('uint8')).save('png/cover-page.png', optimize=True)
