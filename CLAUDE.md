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

## Quy ước làm việc
- Mọi kết luận về game đối thủ phải ghi rõ **nguồn**: từ APK dump (đường dẫn file), từ store listing, từ gameplay quan sát, hay là **giả thuyết**.
- File `.apk/.xapk` và thư mục `research/raw/` không commit (xem `.gitignore`). Chỉ commit phần đã trích xuất có giá trị (JSON/CSV config, strings, report).
- Bóc tách APK: `python3 tools/apk_dump.py <file.apk|thư mục đã giải nén> --out research/apk`.
- Cách đưa APK lớn vào phiên làm việc: xem `docs/apk-analysis-guide.md`.

## Hướng concept hiện tại (cập nhật 2026-09-28)
- Core: template Solitaire Associations (4 category ẩn, tableau, moves limit) như Stamp Solitaire.
- Theme: **tem / bưu điện**, sub-fantasy **"Little Post Office"** (người chơi là nhân viên bưu điện nhỏ), tone **cozy, cute, có narrative nhẹ** qua thư.
- Postcard vẫn là phương án dự phòng nếu creative test cho CPI xấu. Xem `docs/design/theme-options.md`, `docs/design/theme-stamp.md`, `docs/product/positioning-stamp-vs-alt.md`.
- Concept pitch: `docs/design/concept-little-post-office.md`.
