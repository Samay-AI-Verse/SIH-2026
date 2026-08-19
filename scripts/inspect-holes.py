from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

p = Path(r"C:\SIH landing page\public\hero\spidey-thwip.png")
arr = np.array(Image.open(p).convert("RGBA"))
h, w = arr.shape[:2]
alpha = arr[:, :, 3]


def flood_from_border(mask):
    out = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if mask[y, x] and not out[y, x]:
                out[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if mask[y, x] and not out[y, x]:
                out[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return out


trans = alpha < 16
exterior = flood_from_border(trans)
interior = trans & ~exterior
seen = np.zeros((h, w), dtype=bool)
comps = []
ys, xs = np.where(interior)
for y, x in zip(ys.tolist(), xs.tolist()):
    if seen[y, x]:
        continue
    q = deque([(y, x)])
    seen[y, x] = True
    cells = [(y, x)]
    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and interior[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
                cells.append((ny, nx))
    ys2 = [c[0] for c in cells]
    xs2 = [c[1] for c in cells]
    comps.append(
        {
            "n": len(cells),
            "x0": min(xs2),
            "y0": min(ys2),
            "x1": max(xs2),
            "y1": max(ys2),
            "cx": int(sum(xs2) / len(xs2)),
            "cy": int(sum(ys2) / len(ys2)),
        }
    )

comps.sort(key=lambda c: -c["n"])
print("components", len(comps))
for c in comps[:15]:
    print(c)
