#!/usr/bin/env python3
"""Cắt ảnh lưới 3x3 do ChatGPT vẽ lại thành từng file, đúng kích thước canvas của file cũ.

Dùng:
  python3 tools/art_slice.py topic <slug> <grid.png>      # icon + tem của một chủ đề (theo research/art-redo/grid_map.json)
  python3 tools/art_slice.py ui <sheet.png> name1,name2,...   # lưới 3x3 các file UI (bỏ trống bằng "-")
  python3 tools/art_slice.py cards <sheet.png> fruit/0,ball/1,...   # lưới 3x3 tem lẻ của nhiều chủ đề
  python3 tools/art_slice.py paths <sheet.png> -,decor/bunting,...   # đường dẫn tuỳ ý trong assets (decor cắt sát, cạnh dài 600)

Ghi vào research/art-redo/out/... (bản xem trước) và, với --apply, ghi đè vào prototype/stamp/assets.
Nền: nếu ảnh không trong suốt, xoá nền bằng flood-fill từ mép (màu gần màu góc).
"""
import json, sys, os
from collections import deque
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'prototype/stamp/assets')
OUT = os.path.join(ROOT, 'research/art-redo/out')


def remove_bg(im, tol=38):
    """Flood-fill từ các mép: điểm gần màu nền (lấy ở góc) thành trong suốt. Giữ nguyên vật thể có màu giống nền ở bên trong."""
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    a_min = min(px[x, y][3] for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    if a_min < 20:
        return im                                   # đã trong suốt
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = tuple(sorted(c[i] for c in corners)[1] for i in range(3))
    near = lambda c: abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2]) <= tol
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        c = px[x, y]
        if not near(c):
            continue
        px[x, y] = (c[0], c[1], c[2], 0)
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # viền mềm: điểm sát nền giảm alpha một nửa
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if px[x, y][3] and any(px[x + dx, y + dy][3] == 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                c = px[x, y]
                px[x, y] = (c[0], c[1], c[2], c[3] // 2)
    return im


def cells_fixed(im):
    """Cắt cứng theo 1/3 (dùng khi các vật đứng sát nhau bị gộp). Trong mỗi ô chỉ giữ vật chính
    (vùng lớn nhất và các mảnh nằm trong khung của nó), bỏ mảnh vụn của ô bên cạnh lấn sang."""
    import numpy as np
    from scipy import ndimage
    w, h = im.size
    arr = np.array(im)
    for k in range(9):
        m = int(w / 3 * 0.15)                         # lấn 15% sang ô bên để không cắt cụt vật tràn ô
        x0, y0 = max(0, int((k % 3) * w / 3) - m), max(0, int((k // 3) * h / 3) - m)
        x1, y1 = min(w, int((k % 3 + 1) * w / 3) + m), min(h, int((k // 3 + 1) * h / 3) + m)
        a = arr[y0:y1, x0:x1, 3] > 24
        lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=3))
        if n == 0:
            continue
        sizes = ndimage.sum(a, lab, range(1, n + 1))
        main = int(np.argmax(sizes)) + 1
        keep = (lab == main) & a
        cut = np.zeros_like(arr)
        sub = arr[y0:y1, x0:x1].copy()
        sub[..., 3] = np.where(keep, sub[..., 3], 0)
        cut[y0:y1, x0:x1] = sub
        yield k, Image.fromarray(cut)


def cells(im):
    """Tách vật thể theo vùng alpha liên thông (nối các mảnh gần nhau), gán vào ô 3x3 theo tâm vùng.
    Vật thể lấn sang ô bên cạnh vẫn được giữ nguyên, không bị cắt cụt như khi cắt cứng theo 1/3."""
    import numpy as np
    from scipy import ndimage
    a = np.array(im.getchannel('A')) > 24
    w, h = im.size
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=max(2, w // 120)))
    groups = {k: np.zeros_like(a) for k in range(9)}
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = (lab[sl] == i) & a[sl]
        if m.sum() < (w * h) * 0.0004:
            continue                                   # vụn
        ys, xs = np.nonzero(m)
        cy, cx = ys.mean() + sl[0].start, xs.mean() + sl[1].start
        k = min(2, int(cy * 3 / h)) * 3 + min(2, int(cx * 3 / w))
        groups[k][sl] |= m
    arr = np.array(im)
    for k in range(9):
        if not groups[k].any():
            continue
        cut = arr.copy()
        cut[..., 3] = np.where(groups[k], cut[..., 3], 0)
        yield k, Image.fromarray(cut)


def fit(cell, size, pad=0.04):
    """Cắt sát vật thể, co vừa canvas (giữ tỉ lệ), đặt giữa."""
    bbox = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
    if not bbox:
        return None
    obj = cell.crop(bbox)
    W, H = size
    s = min(W * (1 - 2 * pad) / obj.width, H * (1 - 2 * pad) / obj.height)
    obj = obj.resize((max(1, round(obj.width * s)), max(1, round(obj.height * s))), Image.LANCZOS)
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    canvas.alpha_composite(obj, ((W - obj.width) // 2, (H - obj.height) // 2))
    return canvas


STRETCH = {'back', 'face_1', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6', 'topic_frame', 'joker_card',
           'moves_box', 'booster_btn', 'header_win'}


def tight(cell, maxside):
    bbox = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
    if not bbox:
        return None
    obj = cell.crop(bbox)
    s = maxside / max(obj.size)
    return obj.resize((max(1, round(obj.width * s)), max(1, round(obj.height * s))), Image.LANCZOS)


def run(targets, grid_path, apply):
    im = remove_bg(Image.open(grid_path))
    report = []
    for k, cell in (cells_fixed(im) if '--fixed' in sys.argv else cells(im)):
        if k >= len(targets) or targets[k] in (None, '-'):
            continue
        rel = targets[k]
        old = os.path.join(ASSETS, rel)
        if rel.startswith('cards/') or rel.startswith('decor/'):
            out = tight(cell, 600 if rel.startswith('decor/') else 256)   # tem/icon/decor: CSS đặt theo chiều rộng, chỉ cần cắt sát
        else:
            size = Image.open(old).size if os.path.exists(old) else (256, 256)
            name = os.path.basename(rel)[:-4]
            if name in STRETCH:                       # khung: CSS vẽ phủ kín (100% 100%), nên kéo vật thể đầy canvas
                bbox = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
                out = cell.crop(bbox).resize(size, Image.LANCZOS) if bbox else None
            else:
                out = fit(cell, size)                 # UI: giữ đúng canvas cũ vì CSS đặt theo kích thước file
            if out is not None: size = out.size
        if out is None:
            report.append(f'TRỐNG ô {k + 1} -> {rel}')
            continue
        dst = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        out.save(dst)
        if apply:
            out.save(old)
        report.append(f'ok ô {k + 1} -> {rel} {out.size}')
    seen = {r.split(' -> ')[1].split(' ')[0] for r in report if ' -> ' in r}
    for t in targets:
        if t not in (None, '-') and t not in seen:
            report.append(f'THIẾU {t} (không tách được vật thể cho ô này, thử --fixed)')
    return report


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    apply = '--apply' in sys.argv
    if args[0] == 'icons':                           # icons <số bảng> <sheet.png>: 9 icon chủ đề theo research/art-redo/icon_sheets.json
        grid = args[2]
        group = json.load(open(os.path.join(ROOT, 'research/art-redo/icon_sheets.json')))[int(args[1]) - 1]
        targets = [f'cards/{t}/icon.png' for t in group]
    elif args[0] == 'topic':
        slug, grid = args[1], args[2]
        gm = json.load(open(os.path.join(ROOT, 'research/art-redo/grid_map.json')))[slug]
        targets = [f'cards/{slug}/{a}.png' for a in gm]
        if '--no-icon' in sys.argv:
            targets[0] = None                      # icon làm riêng bằng bảng icon
    elif args[0] == 'paths':                         # paths <sheet.png> decor/clock,ui/tem_diem,...: đường dẫn trong assets (không .png)
        grid = args[1]
        targets = [None if n == '-' else f'{n}.png' for n in args[2].split(',')]
    elif args[0] == 'cards':                         # cards <sheet.png> fruit/0,ball/1,...: lưới tem lẻ của nhiều chủ đề
        grid = args[1]
        targets = [None if n == '-' else f'cards/{n}.png' for n in args[2].split(',')]
    else:
        grid = args[1]
        targets = [None if n == '-' else f'ui/{n}.png' for n in args[2].split(',')]
    print('\n'.join(run(targets, grid, apply)))
