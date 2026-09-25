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
