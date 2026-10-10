#!/usr/bin/env bash
# Build prototype/stamp thành trang tĩnh và đẩy lên nhánh gh-pages (GitHub Pages).
# Dùng: tools/deploy_web.sh            (build + deploy)
#       tools/deploy_web.sh --build-only (chỉ build vào dist/web)
# Art vẽ lại qua ChatGPT (docs/design/art-redo-chatgpt.md), SFX tự tổng hợp (tools/synth_sfx.py).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/web"
cd "$ROOT"

[ -d prototype/stamp/assets ] || .venv/bin/python tools/build_proto_assets.py
rm -rf "$OUT" && mkdir -p "$OUT"
cp prototype/stamp/index.html "$OUT/"
cp -R prototype/stamp/src prototype/stamp/assets prototype/stamp/sfx "$OUT/"
rm -rf "$OUT/assets/audio"
rm -rf "$OUT/sfx/_old"                # bản SFX cũ chỉ để so sánh trên sfx-preview.html          # âm thanh APK cũ: không còn dùng (đã thay bằng sfx/ tự tổng hợp)
touch "$OUT/.nojekyll"
# Chống cache JS cũ (GitHub Pages cache 10 phút): gắn ?v=<phiên bản> vào script và mọi import nội bộ
VER="$(git rev-parse --short HEAD)-$(date +%s)"
sed -i '' "s#src/main.js\"#src/main.js?v=$VER\"#" "$OUT/index.html"
for f in "$OUT"/src/*.js; do sed -i '' -E "s#from '\./([a-z]+)\.js'#from './\1.js?v=$VER'#g" "$f"; done
# Cloudflare trước GitHub Pages cache ảnh/âm thanh 4 giờ theo URL: đổi tên assets/ và sfx/ theo mã băm nội dung
# (chỉ đổi khi art/âm thanh đổi) rồi sửa mọi đường dẫn 'assets/... (assets/... `sfx/... trong index.html và src/*.js
for d in assets sfx; do
  H="$(cd "$OUT/$d" && find . -type f | LC_ALL=C sort | xargs shasum | shasum | cut -c1-8)"
  mv "$OUT/$d" "$OUT/$d-$H"
  for f in "$OUT/index.html" "$OUT"/src/*.js; do sed -i '' -E "s#([\"'\`(])$d/#\1$d-$H/#g" "$f"; done
done
echo "build: $(du -sh "$OUT" | cut -f1) -> $OUT"
[ "${1:-}" = "--build-only" ] && exit 0

WT="$ROOT/dist/gh-pages"
rm -rf "$WT"; git worktree prune
if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git fetch -q origin gh-pages
  git worktree add -q -B gh-pages "$WT" origin/gh-pages
else
  git worktree add -q --detach "$WT"
  (cd "$WT" && git checkout -q --orphan gh-pages && git rm -rq . >/dev/null 2>&1 || true)
fi
(cd "$WT" && find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} + && cp -R "$OUT"/. . \
  && git add -A && git commit -q -m "Deploy prototype web $(git -C "$ROOT" rev-parse --short HEAD)" \
  && git push -q origin gh-pages) || echo "không có thay đổi để deploy"
git worktree remove --force "$WT"
echo "deploy xong: nhánh gh-pages"
