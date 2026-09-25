# Đưa APK vào phiên làm việc để phân tích

Phiên Claude Code chạy trong container cloud, không nhận file đính kèm trực tiếp và mạng ra ngoài bị giới hạn theo network policy của environment. Vì vậy APK lớn (100-300MB) cần đi một trong các đường dưới đây, xếp theo độ tiện.

## Cách 1 (khuyên dùng): giải nén ở máy bạn, bỏ `lib/`, commit lên nhánh

APK chỉ là file zip. Phần nặng nhất là `lib/` (native `.so`, thường 60-80% dung lượng) và không cần cho phân tích game design. Phần còn lại (`assets/`, `res/`, `classes*.dex`, `resources.arsc`, `AndroidManifest.xml`) mới chứa level data, config, strings, SDK.

```bash
# macOS / Linux (Windows dùng Git Bash hoặc 7-Zip)
mkdir -p research/raw/<package_name>
unzip -q StampSolitaire.apk -d research/raw/<package_name>
rm -rf research/raw/<package_name>/lib          # .gitignore cũng đã loại sẵn

# GitHub từ chối file > 100MB: cắt nhỏ những file như vậy
cd research/raw/<package_name>
find . -type f -size +95M | while read f; do split -b 95m "$f" "$f.part-"; rm "$f"; done
cd -

git checkout -b apk/stamp-solitaire
git add research/raw
git commit -m "Thêm bản giải nén APK Stamp Solitaire (không có lib/)"
git push -u origin apk/stamp-solitaire
```

Sau đó nhắn cho Claude: "APK đã ở nhánh `apk/stamp-solitaire`, thư mục `research/raw/<package_name>`". Claude sẽ ghép lại các file `.part-*`, chạy `tools/apk_dump.py` và ghi kết quả vào `research/apk/<package_name>/`.

Nếu là file `.xapk`/`.apks` (nhiều APK con): giải nén lớp ngoài trước, rồi giải nén `base.apk` và các `split_config.*.apk` vào cùng thư mục như trên.

## Cách 2: cho phép container tải từ một URL

Đưa APK lên nơi có link tải trực tiếp (Google Drive, Dropbox, S3 presigned, server riêng). Container hiện **không** truy cập được `drive.google.com`, `apkpure.com`, `apkmirror.com`. Bạn cần mở host đó trong cài đặt environment: menu cloud environment trên thanh tiêu đề phiên → Edit → Network access → thêm domain (với Google Drive cần cả `drive.google.com` và `drive.usercontent.google.com`). Các mức truy cập mô tả tại https://code.claude.com/docs/en/claude-code-on-the-web. Sau đó gửi link, Claude sẽ tải và bóc tách trong container mà không cần commit file gốc.

## Cách 3: Google Drive connector

Phiên này có kết nối Google Drive. Upload APK lên Drive rồi gửi link/tên file; Claude sẽ thử tải qua connector. Cách này chưa được kiểm chứng với file nhị phân trên 100MB nên chỉ dùng khi hai cách trên không tiện.

## Cách 4: chỉ gửi những gì cần

Nếu bạn đã biết engine (ví dụ Unity), chỉ cần gửi:
- `AndroidManifest.xml`, `resources.arsc`, `classes*.dex` (nhận diện SDK, strings)
- `assets/` trừ `assets/bin/Data/*.resS` và `*.resource` (texture/audio, không cần)
- `res/xml/`, `res/raw/` (remote config defaults)

## Sau khi có APK

```bash
python3 tools/apk_dump.py research/raw/<package_name> --out research/apk --package <package_name>
```

Kết quả: `research/apk/<package_name>/report.md` (tổng quan), `extracted/` (file text), `unity/` (TextAsset, ScriptableObject nếu là Unity), `strings.json`. Từ đây gọi agent `game-designer` để teardown cơ chế và `product-owner` để phân tích stack monetization.
