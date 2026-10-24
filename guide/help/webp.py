# webp.py — the help page's pictures as WebP, at the sizes the page shows them (2× its column).
#   python3 guide/help/webp.py   (after shoot.cjs)
from pathlib import Path
from PIL import Image
here = Path(__file__).parent / "img"
for name, width in {"screen": 1440, "hands": 784, "windows": 720}.items():
    im = Image.open(here / f"{name}.png").convert("RGB")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(here / f"{name}.webp", quality=82, method=6)
    (here / f"{name}.png").unlink()
    print(name, im.size, (here / f"{name}.webp").stat().st_size // 1024, "KB")
