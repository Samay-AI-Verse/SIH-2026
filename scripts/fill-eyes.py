from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

src = Path(r"C:\SIH landing page\public\hero\spidey-thwip.png")
arr = np.array(Image.open(src).convert("RGBA"))
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


trans = alpha < 40
exterior = flood_from_border(trans)
interior = trans & ~exterior
seen = np.zeros((h, w), dtype=bool)
fill = np.zeros((h, w), dtype=bool)
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
    n = len(cells)
    y0 = min(c[0] for c in cells)
    y1 = max(c[0] for c in cells)
    # White lenses + small cutout holes. Skip the huge lower gap.
    if n >= 40 and n < 25000 and y0 < int(h * 0.55):
        for py, px in cells:
            fill[py, px] = True

# Grow the white fill one pixel so it meets the black eye rim.
grown = fill.copy()
grown[1:, :] |= fill[:-1, :]
grown[:-1, :] |= fill[1:, :]
grown[:, 1:] |= fill[:, :-1]
grown[:, :-1] |= fill[:, 1:]
fill = grown & (alpha < 80)

arr[fill, 0] = 255
arr[fill, 1] = 255
arr[fill, 2] = 255
arr[fill, 3] = 255

Image.fromarray(arr, "RGBA").save(src, optimize=True)
print("filled", int(fill.sum()), "px")
