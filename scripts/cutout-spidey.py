from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

HERO = Path(r"C:\SIH landing page\public\hero")
NEW_THWIP = Path(
    r"C:\Users\Onkar Nagargoje\.cursor\projects\c-SIH-landing-page\assets"
    r"\c__Users_Onkar_Nagargoje_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-e8950d3b-a23d-49a8-aa0d-25c3279219c0.png"
)


def lum_sat(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = mx - mn
    return lum, sat


def light_bg(rgb):
    lum, sat = lum_sat(rgb)
    checker_gray = (sat <= 32) & (lum >= 175)
    pale = (sat <= 48) & (lum >= 215)
    return checker_gray | pale


def dark_bg(rgb):
    lum, sat = lum_sat(rgb)
    return (sat <= 45) & (lum <= 52)


def flood(mask, starts):
    h, w = mask.shape
    out = np.zeros((h, w), dtype=bool)
    q = deque(starts)
    for y, x in starts:
        if 0 <= y < h and 0 <= x < w and mask[y, x]:
            out[y, x] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return out


def large_components(mask, min_px):
    h, w = mask.shape
    seen = np.zeros((h, w), dtype=bool)
    keep = np.zeros((h, w), dtype=bool)
    ys, xs = np.where(mask)
    for y, x in zip(ys.tolist(), xs.tolist()):
        if seen[y, x]:
            continue
        q = deque([(y, x)])
        seen[y, x] = True
        cells = [(y, x)]
        while q:
            cy, cx = q.popleft()
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
                    cells.append((ny, nx))
        if len(cells) >= min_px:
            for py, px in cells:
                keep[py, px] = True
    return keep


def feather(alpha, radius=2):
    a = alpha.astype(np.float32)
    for _ in range(radius):
        pad = np.pad(a, 1, mode="edge")
        a = (
            pad[1:-1, 1:-1]
            + pad[:-2, 1:-1]
            + pad[2:, 1:-1]
            + pad[1:-1, :-2]
            + pad[1:-1, 2:]
        ) / 5.0
    mixed = np.where(alpha == 0, np.minimum(a, 90), np.maximum(alpha, a * 0.35 + alpha * 0.65))
    return np.clip(mixed, 0, 255).astype(np.uint8)


def cutout(path, dest):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.float32)
    h, w = rgb.shape[:2]
    min_px = max(400, int(h * w * 0.004))

    light = light_bg(rgb)
    dark = dark_bg(rgb)

    remove = large_components(light, min_px)

    edge_starts = []
    for x in range(w):
        edge_starts.append((0, x))
        edge_starts.append((h - 1, x))
    for y in range(h):
        edge_starts.append((y, 0))
        edge_starts.append((y, w - 1))
    remove |= flood(dark | light, edge_starts)

    alpha = np.where(remove, 0, 255).astype(np.uint8)
    # keep a 1px ring of partial opacity on the silhouette
    alpha = feather(alpha, radius=1)
    arr[:, :, 3] = alpha
    Image.fromarray(arr, "RGBA").save(dest, optimize=True)
    gone = (alpha < 16).mean() * 100
    print(f"{dest.name}: {w}x{h} removed {gone:.1f}%")


def main():
    # Replace the main pose with the newest upload, then cut all assets.
    sources = {
        "spidey-thwip.png": NEW_THWIP,
        "spidey-bust.png": HERO / "spidey-bust.png",
        "spidey-hang.png": HERO / "spidey-hang.png",
        "spidey-leap.png": HERO / "spidey-leap.png",
    }
    for name, src in sources.items():
        cutout(src, HERO / name)


if __name__ == "__main__":
    main()
