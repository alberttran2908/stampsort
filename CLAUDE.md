# stampsort

Dự án nghiên cứu và thiết kế game puzzle mobile, lấy **Stamp Solitaire** (ABI Game Studio) làm đối tượng phân tích chính (competitor teardown) để xây dựng game riêng.

## Ngôn ngữ
- Trao đổi, tài liệu, commit message: **tiếng Việt** (thuật ngữ game dev giữ nguyên tiếng Anh: core loop, retention, booster, ARPDAU...).
- Code và tên file: tiếng Anh.

## Cấu trúc thư mục
- `.claude/agents/` – agent chuyên môn:
  - `game-designer` – phân tích cơ chế, level design, meta, economy; viết GDD.
  - `product-owner` – vision, roadmap, backlog, KPI, monetization, LiveOps; viết PRD/user story.
- `docs/design/` – tài liệu game design (GDD, teardown, level rules).
- `docs/product/` – tài liệu product (PRD, roadmap, backlog, KPI).
- `research/apk/<package>/` – kết quả bóc tách APK (report.md, inventory.json, extracted/).
- `tools/apk_dump.py` – script bóc tách APK (manifest, engine, SDK, asset text, Unity bundle).
- `tools/stamp_levels_decode.py` – giải mã 963 level, 224 topic, booster config của Stamp Solitaire (Unity không typetree) và export asset tham khảo.
- `research/apk/com.stamp.solit/levels/` – level data đã giải mã (JSON/CSV). Teardown đã xác nhận: `docs/design/teardown-video-apk-0.9.5.md`.
- `tools/ocr_frames.swift` – OCR hàng loạt frame video bằng macOS Vision (đọc moves, deck, bộ đếm ô) để xác minh luật từ video.
- `tools/difficulty_report.mjs` – đo độ khó 10 level bằng người chơi mô phỏng không nhìn trộm (giỏi / phí 10% / phí 25%). Mốc UA và level "khó nhưng không thể thua": `docs/design/difficulty-and-ua-milestones.md`.
- `prototype/stamp/tests/drag-scenarios.browser.js`, `naive-drag.browser.js` – test kéo thả kiểu người mới (chạy trong trình duyệt, PointerEvent thật). Kết quả: `docs/design/ftue-copy.md` mục 7.
- Giao diện concept B (cửa sổ bưu điện, tràn màn hình, safe area) và kết quả review UI/UX: `docs/design/ui-concept-b.md`.
- `tools/art_slice.py`, `tools/art_take.sh` – cắt lưới art do ChatGPT vẽ vào `prototype/stamp/assets`. Quy trình và style: `docs/design/art-redo-chatgpt.md`.
- `prototype/stamp/` – prototype 10 level (web; art vẽ lại qua ChatGPT ở `assets/`, SFX tự tổng hợp ở `sfx/`, cả hai đều commit; không còn dùng asset APK). Design: `docs/design/prototype-10-levels.md`. Level: `node tools/gen_proto_levels.mjs` (Baseline A) và `--variant=b` (luật riêng ≤ 6 chủ đề, mở bằng `?variant=b`). Cắt art ChatGPT: `tools/art_slice.py`. Icon nét cho lá vương miện: `python3 tools/icon_line.py`. SFX: `python3 tools/synth_sfx.py`. Deploy web: `tools/deploy_web.sh` (nhánh gh-pages).

## Quy ước làm việc
- Mọi kết luận về game đối thủ phải ghi rõ **nguồn**: từ APK dump (đường dẫn file), từ store listing, từ gameplay quan sát, hay là **giả thuyết**.
- File `.apk/.xapk` và thư mục `research/raw/` không commit (xem `.gitignore`). Chỉ commit phần đã trích xuất có giá trị (JSON/CSV config, strings, report).
- Bóc tách APK: `python3 tools/apk_dump.py <file.apk|thư mục đã giải nén> --out research/apk`.
- Cách đưa APK lớn vào phiên làm việc: xem `docs/apk-analysis-guide.md`.

## Hướng concept hiện tại (cập nhật 2026-09-28)
- Core: template Solitaire Associations (4 category ẩn, tableau, moves limit) như Stamp Solitaire.
- Theme: **tem / bưu điện**, sub-fantasy **"Little Post Office"** (người chơi là nhân viên bưu điện nhỏ), tone **cozy, cute, chill**. **Không có cốt truyện**: chỉ bối cảnh thị trấn và nhân vật dễ thương, thư giao xong là flavor text ngắn, không nối tiếp, không có bí ẩn hay tuyến chính.
- Postcard vẫn là phương án dự phòng nếu creative test cho CPI xấu. Xem `docs/design/theme-options.md`, `docs/design/theme-stamp.md`, `docs/product/positioning-stamp-vs-alt.md`.
- Concept pitch: `docs/design/concept-little-post-office.md`.
