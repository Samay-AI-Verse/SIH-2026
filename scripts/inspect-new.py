from PIL import Image
from pathlib import Path
import numpy as np

p = Path(r"C:\Users\Onkar Nagargoje\.cursor\projects\c-SIH-landing-page\assets\c__Users_Onkar_Nagargoje_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-e8950d3b-a23d-49a8-aa0d-25c3279219c0.png")
im = np.array(Image.open(p).convert("RGBA"))
h, w = im.shape[:2]
print("size", w, h)
# sample a 12x8 grid
for y in range(0, h, h // 8):
    row = []
    for x in range(0, w, w // 10):
        r, g, b, a = im[min(y, h - 1), min(x, w - 1)]
        row.append(f"{r:3},{g:3},{b:3}")
    print(y, " ".join(row))

# unique-ish bg: pixels with low saturation
rgb = im[:, :, :3].astype(np.float32)
mx = rgb.max(axis=2)
mn = rgb.min(axis=2)
sat = mx - mn
lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
print("low sat pct", round((sat < 25).mean() * 100, 1))
print("near white pct", round(((sat < 25) & (lum > 200)).mean() * 100, 1))
print("mid gray pct", round(((sat < 25) & (lum > 140) & (lum <= 200)).mean() * 100, 1))
print("dark pct", round((lum < 50).mean() * 100, 1))
