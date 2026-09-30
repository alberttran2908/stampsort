#!/usr/bin/env bash
# Build prototype/stamp thành trang tĩnh và đẩy lên nhánh gh-pages (GitHub Pages).
# Dùng: tools/deploy_web.sh            (build + deploy)
#       tools/deploy_web.sh --build-only (chỉ build vào dist/web)
# Lưu ý: bản build chứa art/audio tạm từ APK Stamp Solitaire (xem docs/design/prototype-10-levels.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/web"
cd "$ROOT"

[ -d prototype/stamp/assets ] || .venv/bin/python tools/build_proto_assets.py
rm -rf "$OUT" && mkdir -p "$OUT"
cp prototype/stamp/index.html "$OUT/"
cp -R prototype/stamp/src prototype/stamp/assets "$OUT/"
touch "$OUT/.nojekyll"
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
