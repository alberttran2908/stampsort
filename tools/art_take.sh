#!/bin/bash
# Lấy lưới chủ đề vừa tải từ ChatGPT (~/Downloads/lpo_topic_<slug>.png), cắt và ghi vào assets, làm ảnh xem nhanh.
set -e
cd "$(dirname "$0")/.."
slug=$1
for i in 1 2 3 4 5 6; do [ -f ~/Downloads/lpo_topic_$slug.png ] && break; sleep 1; done
mv ~/Downloads/lpo_topic_$slug.png research/art-redo/gen/
python3 tools/art_slice.py topic $slug research/art-redo/gen/lpo_topic_$slug.png --apply --no-icon | grep -v '^ok' | grep -v "TRỐNG ô 1 " || true
python3 - "$slug" <<'PY'
import sys
from PIL import Image
s = sys.argv[1]
a = Image.open(f'research/art-redo/ref/topic_{s}.png').convert('RGB').resize((400, 400))
b = Image.open(f'research/art-redo/gen/lpo_topic_{s}.png').convert('RGBA').resize((400, 400))
bg = Image.new('RGB', (400, 400), (240, 232, 214)); bg.paste(b, (0, 0), b)
c = Image.new('RGB', (810, 400), (255, 255, 255)); c.paste(a, (0, 0)); c.paste(bg, (410, 0))
c.save(f'research/art-redo/preview_{s}.jpg', quality=80)
PY
echo "xong $slug"
