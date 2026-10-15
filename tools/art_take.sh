#!/bin/bash
# Lấy lưới chủ đề vừa tải từ ChatGPT (~/Downloads/lpo_topic_<slug>.png), cắt và ghi vào assets, làm ảnh xem nhanh.
#   tools/art_take.sh <slug>
# - Chủ đề vẽ lại (có lưới mẫu research/art-redo/ref/topic_<slug>.png): bỏ ô icon (icon làm bằng bảng icon),
#   ảnh xem nhanh là cũ/mới cạnh nhau.
# - Chủ đề mới (không có lưới mẫu, vd. đợt art-batch-1): cắt cả icon (ô 9), sinh icon nét cho lá vương miện
#   (tools/icon_line.py), ảnh xem nhanh là lưới + các tem đã cắt đặt trên lá kem ở cỡ lá thật (~150 px).
set -e
cd "$(dirname "$0")/.."
slug=$1
for i in 1 2 3 4 5 6; do [ -f ~/Downloads/lpo_topic_$slug.png ] && break; sleep 1; done
mkdir -p research/art-redo/gen
mv ~/Downloads/lpo_topic_$slug.png research/art-redo/gen/
if [ -f research/art-redo/ref/topic_$slug.png ]; then
  python3 tools/art_slice.py topic $slug research/art-redo/gen/lpo_topic_$slug.png --apply --no-icon | grep -v '^ok' | grep -v "TRỐNG ô 1 " || true
else
  python3 tools/art_slice.py topic $slug research/art-redo/gen/lpo_topic_$slug.png --apply | grep -v '^ok' || true
  python3 tools/icon_line.py > /dev/null
fi
python3 - "$slug" <<'PY'
import sys, os, json
from PIL import Image
s = sys.argv[1]
ref = f'research/art-redo/ref/topic_{s}.png'
b = Image.open(f'research/art-redo/gen/lpo_topic_{s}.png').convert('RGBA').resize((400, 400))
bg = Image.new('RGB', (400, 400), (240, 232, 214)); bg.paste(b, (0, 0), b)
if os.path.exists(ref):
    a = Image.open(ref).convert('RGB').resize((400, 400))
    c = Image.new('RGB', (810, 400), (255, 255, 255)); c.paste(a, (0, 0)); c.paste(bg, (410, 0))
else:
    gm = json.load(open('research/art-redo/grid_map.json'))[s]
    names = [str(x) for x in gm if x != 'icon'] + ['icon', 'icon_line']
    c = Image.new('RGB', (410 + 4 * 160, 410), (255, 255, 255)); c.paste(bg, (0, 0))
    for i, n in enumerate(names[:10]):
        p = f'prototype/stamp/assets/cards/{s}/{n}.png'
        card = Image.new('RGB', (150, 200) if i < 8 else (150, 150), (250, 243, 228))
        if os.path.exists(p):
            im = Image.open(p).convert('RGBA'); im.thumbnail((120, 120))
            card.paste(im, ((150 - im.width) // 2, (card.height - im.height) // 2), im)
        x, y = 410 + (i % 4) * 160, (i // 4) * 205 if i < 8 else 410
        if i >= 8:                                        # icon và icon nét: hàng dưới, nhỏ hơn
            c2 = Image.new('RGB', (c.width, 570), (255, 255, 255)); c2.paste(c, (0, 0)); c = c2
            x, y = 410 + (i - 8) * 160, 415
        c.paste(card, (x, y))
c.save(f'research/art-redo/preview_{s}.jpg', quality=80)
PY
echo "xong $slug"
