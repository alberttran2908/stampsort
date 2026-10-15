#!/usr/bin/env python3
"""Cắt ảnh lưới 3x3 do ChatGPT vẽ lại thành từng file, đúng kích thước canvas của file cũ.

Dùng:
  python3 tools/art_slice.py topic <slug> <grid.png>      # icon + tem của một chủ đề (theo research/art-redo/grid_map.json)
  python3 tools/art_slice.py ui <sheet.png> name1,name2,...   # lưới 3x3 các file UI (bỏ trống bằng "-")
  python3 tools/art_slice.py cards <sheet.png> fruit/0,ball/1,...   # lưới 3x3 tem lẻ của nhiều chủ đề
  python3 tools/art_slice.py paths <sheet.png> -,decor/bunting,...   # đường dẫn tuỳ ý trong assets (decor cắt sát, cạnh dài 600)
  python3 tools/art_slice.py postcard <ảnh.png> ch3                   # bưu thiếp teaser -> assets/ch3/postcard.jpg (900x600)
  python3 tools/art_slice.py bg <cảnh.png> [<tile.png>] bg_game_tall   # nền cao 1080x2400 -> assets/ui/bg_game_tall.jpg

Tuỳ chọn:
  --apply         ghi vào prototype/stamp/assets (không có thì chỉ ghi bản xem trước vào research/art-redo/out/)
  --fixed         cắt cứng theo lưới (khi các vật đứng sát nhau bị gộp)
  --grid CxR      lưới C cột x R hàng thay cho 3x3 (vd. --grid 2x3 cho bảng nút 2 cột 3 hàng). Ô đánh số theo hàng
  --no-icon       (topic) bỏ ô icon, icon làm riêng bằng bảng icon
  Hậu tố kích thước cho từng đích (ui, paths):  ten@512 = cắt sát, cạnh dài 512 px;  ten@868x194 = cắt sát rồi kéo đầy
  đúng canvas WxH (nút 9-slice, khung). Không có hậu tố: giữ canvas file cũ (UI), cắt sát 256 (tem) hoặc 600 (decor).
  bg: --soften A:B (mặc định 0.08:0.86) làm mờ họa tiết 60% trong vùng chơi từ A đến B chiều cao;
      --feather N (mặc định 240) chiều cao dải chuyển giữa tile tường và cảnh.

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


def grid_size():
    """--grid CxR (mặc định 3x3) -> (cột, hàng)."""
    for a in sys.argv:
        if a.startswith('--grid'):
            v = a.split('=', 1)[1] if '=' in a else sys.argv[sys.argv.index(a) + 1]
            c, r = v.lower().split('x')
            return int(c), int(r)
    return 3, 3


def cells_fixed(im, cols=3, rows=3):
    """Cắt cứng theo lưới (dùng khi các vật đứng sát nhau bị gộp). Trong mỗi ô chỉ giữ vật chính
    (vùng lớn nhất và các mảnh nằm trong khung của nó), bỏ mảnh vụn của ô bên cạnh lấn sang."""
    import numpy as np
    from scipy import ndimage
    w, h = im.size
    arr = np.array(im)
    for k in range(cols * rows):
        cw, ch = w / cols, h / rows
        m = int(min(cw, ch) * 0.15)                   # lấn 15% sang ô bên để không cắt cụt vật tràn ô
        x0, y0 = max(0, int((k % cols) * cw) - m), max(0, int((k // cols) * ch) - m)
        x1, y1 = min(w, int((k % cols + 1) * cw) + m), min(h, int((k // cols + 1) * ch) + m)
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


def cells(im, cols=3, rows=3):
    """Tách vật thể theo vùng alpha liên thông (nối các mảnh gần nhau), gán vào ô lưới theo tâm vùng.
    Vật thể lấn sang ô bên cạnh vẫn được giữ nguyên, không bị cắt cụt như khi cắt cứng theo 1/3."""
    import numpy as np
    from scipy import ndimage
    a = np.array(im.getchannel('A')) > 24
    w, h = im.size
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=max(2, w // 120)))
    groups = {k: np.zeros_like(a) for k in range(cols * rows)}
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = (lab[sl] == i) & a[sl]
        if m.sum() < (w * h) * 0.0004:
            continue                                   # vụn
        ys, xs = np.nonzero(m)
        cy, cx = ys.mean() + sl[0].start, xs.mean() + sl[1].start
        k = min(rows - 1, int(cy * rows / h)) * cols + min(cols - 1, int(cx * cols / w))
        groups[k][sl] |= m
    arr = np.array(im)
    for k in range(cols * rows):
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


def split_spec(t):
    """'ui/btn@868x194.png' hoặc 'ui/btn.png@868x194' -> ('ui/btn.png', (868, 194)); '@512' -> ('...', 512)."""
    if t is None or '@' not in t:
        return t, None
    base, spec = t.split('@', 1)
    if spec.endswith('.png'):
        spec = spec[:-4]
    if not base.endswith('.png'):
        base += '.png'
    if 'x' in spec:
        w, h = spec.lower().split('x')
        return base, (int(w), int(h))
    return base, int(spec)


def stretch(cell, size):
    bbox = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
    return cell.crop(bbox).resize(size, Image.LANCZOS) if bbox else None


def run(targets, grid_path, apply):
    im = remove_bg(Image.open(grid_path))
    cols, rows = grid_size()
    report = []
    specs = [split_spec(t) for t in targets]
    targets = [t for t, _ in specs]
    for k, cell in (cells_fixed(im, cols, rows) if '--fixed' in sys.argv else cells(im, cols, rows)):
        if k >= len(targets) or targets[k] in (None, '-'):
            continue
        rel, spec = specs[k]
        old = os.path.join(ASSETS, rel)
        if isinstance(spec, int):
            out = tight(cell, spec)                   # hậu tố @N: cắt sát, cạnh dài N
        elif isinstance(spec, tuple):
            out = stretch(cell, spec)                 # hậu tố @WxH: kéo đầy canvas (9-slice, khung)
        elif rel.startswith('cards/') or rel.startswith('decor/'):
            out = tight(cell, 600 if rel.startswith('decor/') else 256)   # tem/icon/decor: CSS đặt theo chiều rộng, chỉ cần cắt sát
        else:
            size = Image.open(old).size if os.path.exists(old) else (256, 256)
            name = os.path.basename(rel)[:-4]
            if name in STRETCH:                       # khung: CSS vẽ phủ kín (100% 100%), nên kéo vật thể đầy canvas
                out = stretch(cell, size)
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
            os.makedirs(os.path.dirname(old), exist_ok=True)   # chủ đề mới / thư mục mới (cards/lantern, fx/)
            out.save(old)
        report.append(f'ok ô {k + 1} -> {rel} {out.size}')
    seen = {r.split(' -> ')[1].split(' ')[0] for r in report if ' -> ' in r}
    for t in targets:
        if t not in (None, '-') and t not in seen:
            report.append(f'THIẾU {t} (không tách được vật thể cho ô này, thử --fixed)')
    return report


def postcard(src, chapter, apply):
    """Bưu thiếp teaser chương (như assets/ch2/postcard.jpg): cắt giữa về tỉ lệ 3:2, 900x600, JPEG."""
    im = Image.open(src).convert('RGB')
    w, h = im.size
    if w / h > 1.5:
        nw = round(h * 1.5); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = round(w / 1.5); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize((900, 600), Image.LANCZOS)
    rel = f'{chapter}/postcard.jpg'
    for dst in [os.path.join(OUT, rel)] + ([os.path.join(ASSETS, rel)] if apply else []):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im.save(dst, quality=86, optimize=True)
    return [f'ok {rel} (900, 600)' + ('' if apply else ' (chỉ xem trước, thêm --apply để ghi)')]


def _opt(name, default):
    for i, a in enumerate(sys.argv):
        if a == name and i + 1 < len(sys.argv):
            return sys.argv[i + 1]
        if a.startswith(name + '='):
            return a.split('=', 1)[1]
    return default


def bg_tall(scene_path, tile_path, name, apply, W=1080, H=2400):
    """Nền cao WxH không đường nối (benchmark P3). Cảnh ChatGPT (dọc 2:3, 1/3 trên chỉ là giấy dán tường)
    co về rộng W, đặt sát đáy. Phần trên lấp bằng tile giấy dán tường: tile được làm liền theo chiều dọc
    (gối đầu-đuôi), chỉnh màu theo dải tường trên cùng của cảnh, rồi hoà vào cảnh qua dải --feather px.
    Không có tile thì lấy dải tường trên cùng của chính cảnh làm tile. Sau đó làm mờ họa tiết 60% trong
    vùng chơi (--soften), như bg_game.jpg cũ. In số đo đường nối: chênh lệch trung bình lớn nhất giữa 2 hàng
    pixel liền nhau trong vùng tường (P3 yêu cầu < 6/255)."""
    import numpy as np
    from PIL import ImageFilter
    feather = int(_opt('--feather', 240))
    a_, b_ = (float(v) for v in _opt('--soften', '0.08:0.86').split(':'))
    scene = Image.open(scene_path).convert('RGB')
    sh = round(scene.height * W / scene.width)
    scene = np.asarray(scene.resize((W, sh), Image.LANCZOS)).astype(np.float64)
    if sh >= H:
        out = scene[sh - H:]
        y0 = 0
    else:
        y0 = H - sh                                               # mép trên của cảnh trên canvas
        band = scene[:max(feather * 2, sh // 5)]                  # dải tường trên cùng của cảnh
        if tile_path:
            t = Image.open(tile_path).convert('RGB')
            t = np.asarray(t.resize((W, round(t.height * W / t.width)), Image.LANCZOS)).astype(np.float64)
        else:
            t = band.copy()
        # chỉnh màu tile theo dải tường (trung bình, độ lệch từng kênh)
        t = (t - t.mean((0, 1))) / (t.std((0, 1)) + 1e-6) * band.std((0, 1)) + band.mean((0, 1))
        # làm tile liền theo chiều dọc: gối o hàng đuôi lên o hàng đầu
        th = t.shape[0]; o = th // 4
        wgt = (np.arange(o) / o)[:, None, None]
        seam = t[th - o:] * (1 - wgt) + t[:o] * wgt
        tile = np.concatenate([seam, t[o:th - o]])               # chu kỳ th - o, lặp liền mạch
        need = y0 + feather
        reps = int(np.ceil(need / tile.shape[0])) + 1
        col = np.concatenate([tile] * reps)[-need:]               # đáy tile khớp vào đầu dải chuyển
        out = np.zeros((H, W, 3))
        out[y0:] = scene
        out[:y0] = col[:y0]
        al = (0.5 - 0.5 * np.cos(np.pi * np.arange(feather) / feather))[:, None, None]   # 0 = tile, 1 = cảnh
        out[y0:y0 + feather] = col[y0:] * (1 - al) + scene[:feather] * al
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    # làm mờ họa tiết 60% trong vùng chơi, mép mềm 120 px
    blur = np.asarray(img.filter(ImageFilter.GaussianBlur(22))).astype(np.float64)
    ys = np.arange(H)[:, None, None]
    ya, yb, f = a_ * H, b_ * H, 120
    m = np.clip(np.minimum((ys - ya) / f, (yb - ys) / f), 0, 1) * 0.6
    fin = np.asarray(img).astype(np.float64) * (1 - m) + blur * m
    img = Image.fromarray(np.clip(fin, 0, 255).astype(np.uint8))
    # đo đường nối trong vùng tường (trên dải chuyển + 300 px)
    g = np.asarray(img.convert('L')).astype(np.float64)
    top = max(y0 + feather + 300, int(H * 0.6))
    rowdiff = np.abs(np.diff(g[:top], axis=0)).mean(1)
    worst = int(np.argmax(rowdiff))
    rel = f'ui/{name}.jpg'
    report = [f'ok {rel} {img.size}, cảnh cao {sh}px đặt từ y={y0}, dải chuyển {feather}px',
              f'đường nối: chênh lệch hàng lớn nhất {rowdiff.max():.2f}/255 ở y={worst} (P3 cần < 6)']
    dsts = [os.path.join(OUT, rel)] + ([os.path.join(ASSETS, rel)] if apply else [])
    for dst in dsts:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        img.save(dst, quality=88, optimize=True)
    # xem trước 3 tỉ lệ màn hình (neo đáy như CSS): 16:9, 19.5:9, 20:9
    prev = Image.new('RGB', (3 * 300 + 40, 670), (255, 255, 255))
    for i, hh in enumerate((1920, 2340, 2400)):
        crop = img.crop((0, H - hh, W, H)).resize((300, round(300 * hh / W)))
        prev.paste(crop, (10 + i * 310, 670 - crop.height))
    pp = os.path.join(OUT, f'ui/{name}_preview.jpg')
    prev.save(pp, quality=80)
    report.append(f'xem trước 3 tỉ lệ: {os.path.relpath(pp, ROOT)}')
    return report


if __name__ == '__main__':
    VALOPT = ('--grid', '--soften', '--feather')
    args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] not in VALOPT]
    apply = '--apply' in sys.argv
    if args[0] == 'postcard':                        # postcard <ảnh> ch3
        print('\n'.join(postcard(args[1], args[2], apply)))
        sys.exit(0)
    if args[0] == 'bg':                              # bg <cảnh> [<tile>] <tên>
        scene, tile, name = (args[1], None, args[2]) if len(args) == 3 else (args[1], args[2], args[3])
        print('\n'.join(bg_tall(scene, tile, name, apply)))
        sys.exit(0)
    if args[0] == 'icons':                           # icons <số bảng> <sheet.png>: 9 icon chủ đề theo research/art-redo/icon_sheets.json
        grid = args[2]
        group = json.load(open(os.path.join(ROOT, 'research/art-redo/icon_sheets.json')))[int(args[1]) - 1]
        targets = [f'cards/{t}/icon.png' for t in group]
    elif args[0] == 'topic':
        slug, grid = args[1], args[2]
        gm = json.load(open(os.path.join(ROOT, 'research/art-redo/grid_map.json')))[slug]
        targets = [f'cards/{slug}/{a}.png' for a in gm]
        if '--no-icon' in sys.argv:                # icon làm riêng bằng bảng icon (ô icon ở đâu cũng bỏ)
            targets = [None if a == 'icon' else t for a, t in zip(gm, targets)]
    elif args[0] == 'paths':                         # paths <sheet.png> decor/clock,ui/tem_diem@512,...: đường dẫn trong assets (không .png)
        grid = args[1]
        targets = [None if n == '-' else f'{n}.png' for n in args[2].split(',')]
    elif args[0] == 'cards':                         # cards <sheet.png> fruit/0,ball/1,...: lưới tem lẻ của nhiều chủ đề
        grid = args[1]
        targets = [None if n == '-' else f'cards/{n}.png' for n in args[2].split(',')]
    else:
        grid = args[1]
        targets = [None if n == '-' else f'ui/{n}.png' for n in args[2].split(',')]
    print('\n'.join(run(targets, grid, apply)))
