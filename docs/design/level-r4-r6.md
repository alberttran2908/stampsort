# Level R4 (sửa L1–L20) và R6–R7 (sinh L41+): kết quả

**Ngày:** 2026-10-15 · **Người làm:** level dev agent · **Kế hoạch gốc:** `30-day-plan.md` mục 6 (R4, R6, R7). Tiếp nối `level-pipeline-r1-r3.md`.
**Trạng thái:** chưa commit. Chưa nối `levels_gen.js` vào game (R5, Feature Dev).

## 1. Lệnh

| Việc | Lệnh | Thời gian (máy có iOS Simulator chạy, load 7–25) |
|---|---|---|
| R4: sửa level trượt của A L1–L20 | `node tools/gen_proto_levels.mjs --r4` (thêm `--only=9,10`, `--jobs=N`) | khoảng 10 phút cho 12 level |
| Validator A L2–L20 | `node tools/validate_levels.mjs` | 40 giây (12 luồng) |
| Sinh chương | `node tools/gen_levels.mjs --from=41 --to=80 --md` (ghi gộp `prototype/stamp/src/levels_gen.js` + `prototype/stamp/levels-gen-report.json`) | khoảng 12–15 phút / chương |
| Validator level sinh | `node tools/validate_levels.mjs --file=prototype/stamp/src/levels_gen.js --levels=21-80` | |

## 2. R4: A L1–L20

### 2.1 Cách làm

`tools/gen_proto_levels.mjs` có chế độ mới `--r4`: chỉ xử lý level có trường `r4` trong `DESIGN`, giữ nguyên mọi level khác từ `levels.js` (kể cả L1 tutorial, kịch bản Pack L4, Stamper L7, Joker L9, `unlock`, `chapter`, `introduce`).
- `r4: 'moves'`: giữ nguyên layout, moves = max(moves cũ, moves chỉnh trên seed tune `70000 + id`), rồi kiểm tra bằng validator trên seed check `50000 + id` (trượt thì +2, tối đa 3 lần). Level thường không bao giờ bị bớt moves.
- `r4: 'regen'`: dựng lại layout theo `DESIGN` (chủ đề, n, cột; `colsAlt` cho seed chẵn), chấm điểm và kiểm tra bằng `evaluate`/`check` của `gen_levels.mjs`. Mục tiêu là mục tiêu legacy của validator (`legacyTargets`). L9 có thêm điều kiện: sau bước Joker của kịch bản (cột 2), level vẫn giải được.
- `gen_proto_levels.mjs` dùng `CONFUSE`, `rng`, `shuffle`, art từ `level_rules.mjs` (không còn danh sách CONFUSE riêng). Cặp có chủ đề nằm trong `avoid` được phép (A L5: Truck bỏ tem xe buýt #3, giống `CONFUSE_ART` của validator).
- Chạy `gen_proto_levels.mjs` **không** có `--r4` vẫn là thuật toán cũ, sinh lại cả 20 level: không dùng cho bản phát hành.

### 2.2 Level đổi

Số lá, cột, moves cũ → mới. Chỉ số đo bằng validator (seed check, 200 ván / profile). Level không có trong bảng giữ nguyên byte-for-byte.

| L | Vai trò | Cách sửa | Lý do (trước) | Thay đổi | Lá | Cột | Moves (gốc → mới) | c10 | c25 | o35 | o35 +5 | sk | Phút o35 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | teach, mở Gợi ý | regen | GD (`economy-30-days.md`): L2–L4 ≤ 3 phút; đang 4,2 phút | 6 → 4 chủ đề (Ball 4, Dog 3, Noodle 3, Phone 3); bỏ Bird, Car | 30 → 17 | 1-2-3 | 66 → 38 | 100% | 99% | 95% | 100% | - | 2.5 |
| 3 | teach, 4 ô | regen | ≤ 3 phút; đang 5,0 | 5 chủ đề x 3 tem, bỏ Hoofed | 35 → 20 | 2-3-4-5 | 75 → 35 | 100% | 99% | 90% | 100% | - | 2.3 |
| 4 | normal, mở Pack | regen | o35 0.645; sau đó ≤ 3 phút (đang 5,9) | 5 chủ đề (Dinosaur 4 mở sẵn, Glasses, Pets, Fast food, Flower 3); bỏ Chess, Car, Leaf. Giữ kịch bản Pack | 43 → 21 | 2-3-4-5 | 82 → 36 | 100% | 100% | 98% | 100% | - | 2.3 |
| 7 | normal, mở Stamper | moves | c25 0.845, o35 0.52 | giữ layout | 43 | 3-4-5-6 | 79 → 83 | 100% | 98% | 85% | 98% | - | 5.9 |
| 8 | normal | moves | o35 0.695 | giữ layout | 41 | 3-4-5-7 | 75 → 79 | 100% | 98% | 90% | 97% | - | 5.5 |
| 9 | breather, mở Joker | regen | 48 lá > 46, 6,7 phút | bỏ Sculpture (tương phản thấp). Giữ kịch bản Joker; Tem Vàng ở `main.js` không đổi | 48 → 42 | 3-4-5-7 | 110 → 89 | 100% | 100% | 96% | 99% | - | 5.7 |
| 10 | superhard (mốc UA 2) | regen | 60 lá > 54, c10 0.09, 8,6 phút | 9 chủ đề giữ nguyên, mỗi chủ đề 5 tem | 60 → 54 | 2-4-5-6-7 | 100 → 88 | 13% | - | 2% | 13% | 47% | 7.6 |
| 13 | normal | moves | pass seed check nhưng seed 90000: o35 0.64 | giữ layout | 41 | 3-4-5-6 | 76 → 78 | 100% | 94% | 86% | 98% | - | 5.6 |
| 14 | bump, giới thiệu Nautical | regen | CONFUSE Coffee + Ice cream, 48 lá | Coffee → Juice; Nautical, Shells, Ice cream 6→5, Kite 5→4. 46 lá thì 6,5–6,8 phút > 6,5 | 48 → 44 | 3-4-5-7 | 87 → 87 | 100% | 94% | 76% | 91% | - | 6.0 |
| 15 | hard (mốc khó ch2) | regen | sk 0.71 > 0.70; 88 moves thì c10 0.12 (không có moves nào đạt) | giữ chủ đề | 52 | 3-4-5-6 | 89 → 88 | 27% | - | 4% | 32% | 64% | 7.3 |
| 17 | normal | regen | o35 0.495, 6,2 phút | Nautical, Seafood, Glasses 6 → 5 | 44 → 41 | 3-4-5-7 | 82 → 82 | 98% | 95% | 85% | 97% | - | 5.5 |
| 18 | normal | regen | o35 0.61, 6,6 phút | Shells, Sailboats, Soda, Ice cream 6 → 5 | 46 → 42 | 3-4-5-7 | 90 → 83 | 100% | 99% | 88% | 96% | - | 5.5 |
| 19 | bump | regen | 50 lá, o35 0.255, 7,6 phút | Seafood, Nautical, Float, Fruit, Coffee 6 → 5; Flower 5 → 4 | 50 → 44 | 3-4-5-7 | 96 → 84 | 99% | 90% | 77% | 94% | - | 6.1 |
| 20 | superhard (finale ch2) | regen | CONFUSE Coffee + Ice cream, 58 lá, sk 1.00 | Coffee → Flower; 9 chủ đề x 5 tem | 58 → 54 | 2-4-5-6-7 | 100 → 89 | 10% | - | 1% | 18% | 60% | 7.5 |

L1 (tutorial), L5, L6, L11, L12, L16 giữ nguyên. L2–L4 có trường mới `capMin: 3` (validator dùng làm trần phút) và mục tiêu khi chỉnh moves như level nghỉ (c25 0.97, o35 0.85) vì đây là level học. Level thường R4 còn phải pass seed 90000 (300 ván), trượt thì +2 moves: lần kiểm tra seed 90000 đầu tiên có 4/19 trượt sát biên (L4, L8, L13, L18).

**Validator A L2–L20 sau R4: 19/19 pass trên seed check 50000 và 19/19 trên seed 90000 (300 ván)** (trước: 8/19). Report: `prototype/stamp/validate-report.json`. `levels-report.json` có thêm trường `r4` ở các level đã sửa.

Quyết định trần (plan R4 "quyết định trần cho L9, L10/L20"): **không** miễn trừ. L9 xuống 42 lá, L10/L20 xuống 54 lá để theo trần chung (thường ≤ 46 lá ≤ 6 phút, khó ≤ 54 lá ≤ 8 phút).

Hệ quả cho game (Feature Dev, QA):
- Save cũ: id level giữ nguyên. Ván dở (R10) của level đổi layout hoặc moves bị `loadRun()` bỏ qua nhờ `levelSig`, không cần sửa gì.
- L2–L4 ngắn hẳn (17–21 lá, khoảng 2,5 phút). L3 không còn Hoofed; L4 không còn Chess, Car, Leaf. L14, L20 không còn Coffee. Copy/album nào nhắc Coffee ở hai level này cần kiểm lại (tôi không sửa `copy.js`).
- `levels_b.js` (biến thể B) **chưa** sửa: B L14 vẫn có Coffee + Ice cream. `VARIANT_B[14]` trong tool đã đổi Coffee → Juice; chạy `--variant=b --only=14` khi cần.

## 3. Cặp dễ nhầm và art gần trùng (duyệt trên ảnh thật, 2026-10-15)

Nguồn: ghi chú agent Art (người điều phối chuyển), `art-batch-1.md` mục 1.7, và tôi xem contact sheet 8 tem của từng chủ đề. Thêm vào `CONFUSE` (`tools/level_rules.mjs`):

| Cặp | Bằng chứng trên ảnh | Nguồn đề xuất |
|---|---|---|
| Fishing ↔ Picnic | giỏ mây quai da Picnic/0 vs Fishing/5; xô inox Picnic/7 vs Fishing/6. Cùng chương 8: spec không bao giờ đặt chung, hạn mức 8/20 mỗi chủ đề vẫn đạt | Art |
| Lantern ↔ Balloon | lồng đèn tròn đỏ Lantern/0, đèn ngôi sao Lantern/3 vs bóng tròn, bóng ngôi sao Balloon/3 | 1.7 |
| Lantern ↔ Flower | đèn hoa sen Lantern/2 gần như trùng hoa sen Flower/1 | level dev (mới) |
| Luggage ↔ Treasure | rương da chồng Luggage/7 vs rương gỗ Treasure/1 | 1.7 |
| Umbrella ↔ Weather | ô cầu vồng Umbrella/2 vs cầu vồng Weather/2 | 1.7 |
| Umbrella ↔ Mushroom | ô đỏ Umbrella/0 vs nấm đỏ chấm trắng Mushroom/0 | 1.7 |
| Cheese ↔ Pizza, Cheese ↔ Cake | miếng tam giác vàng; Cake/3 là cheesecake | 1.7 |
| Pottery ↔ Honey | hũ có nắp Pottery/4 vs hũ mật Honey/0 | 1.7 |
| Pottery ↔ Cactus | chậu đất nung Cactus/3, /4 vs bình đất nung Pottery/0 | 1.7 |
| Mask ↔ Glasses | mặt nạ che mắt Mask/0, /1, /6 | 1.7 |
| Winter ↔ Weather | đống tuyết Winter/7 vs mây Weather/3 | 1.7 |
| Stationery ↔ Painting | bút chì, hộp bút vs cọ, hộp màu | 1.7 |
| Sewing ↔ Knitting, Sewing ↔ Vegetable, Sewing ↔ Fruit | gối cắm kim hình cà chua có quả dâu Sewing/2 | Art |
| Snow Sports ↔ Winter | xe trượt Winter/5 là đồ thể thao tuyết | Art (nghi ngờ), xác nhận |
| Books ↔ Stationery | sách mở Books/1 vs sổ lò xo Stationery/6 | Art (nghi ngờ), xác nhận |

**Không thêm** (ảnh thật khác rõ): Picnic–Bread, Picnic–Juice (không có đồ ăn, đồ uống), Fireworks–Flower (pháo hoa trên nền trời tối), Origami–Aircraft (không có máy bay giấy), Keys–Treasure (không có chìa), Fishing–Float (chỉ phao câu nhỏ), Fireplace–Candle, Bicycle–Car. Đây là đánh giá bằng mắt của level dev, chưa test người chơi.

**Art gần trùng trong một chủ đề** (`ART_TWINS`): Winter/0–3 (bốn người tuyết), Cactus/1 và /6. Generator chọn art bằng `pickArts`: lấy tối đa 1 art mỗi nhóm khi còn art khác. Winter n ≤ 5 thì không bao giờ có 2 người tuyết; L41 "Bao thư lớn" Winter n = 8 bắt buộc dùng cả 4 (validator cảnh báo, không trượt). Chủ đề không có nhóm cho kết quả y hệt trước (cùng số lần gọi rng), nên ch3 không đổi.

Ch3 (L21–40) giữ nguyên bản cuối R3 (sha256 `e9175fe3a7469eaf` lúc đó): spec ch3 không đổi khi thêm các cặp trên và ch12–13, không level nào chứa cặp mới.

**Chương 12–13** (13 chương, 240 level): thêm vào `CHAPTER_TOPICS` (Books, Fireplace, Snow Sports; Bicycle, Sewing, Playground), `LAST_GEN = 240`, tier ch9–13 dùng chung. Lưu ý: manifest đã có 6 chủ đề này trước khi spec biết chúng là chủ đề chương sau, nên trong khoảng đó chúng lọt vào pool nền của mọi chương. Lần sinh đang chạy lúc đó đã bị dừng và chạy lại.

## 4. R6–R7: L41–L140 (chương 4–8)

Lệnh: `node tools/gen_levels.mjs --from=41 --to=140 --md --jobs=13` (giữ L21–40 ch3). Mọi chủ đề mới dùng art thật (27 + 6 chủ đề đều có 8 tem và icon), không chương nào dùng fallback. 7.077 giây (load 18–30 do agent khác chạy iOS Simulator; CPU khoảng 5 lõi trung bình). sha256 `193c9da96b612324`.

**Kết quả: 100/100 pass seed check lúc sinh; validator độc lập L21–L140: 120/120 pass** (`prototype/stamp/validate-report_gen.json`). 0 level có cặp CONFUSE. Cảnh báo art gần trùng: 8 level, đều không tránh được (Winter n 6–8 ở L41, 43, 46, 48, 51, 58, 72; Cactus n 8 ở L111).

| Ch | Level | Pass | ABI | Thu nhỏ | Trung vị lá (thường) | Trung bình o35 (thường) | Trung vị phút o35 (thường) | Lá level khó | c10 / sk level khó |
|---|---|---|---|---|---|---|---|---|---|
| 3 | 21-40 | 20/20 | 2 | 0 | 41 | 0.90 | 5.5 | 51, 54 | 28% / 44%, 11% / 53% |
| 4 | 41-60 | 20/20 | 1 | 1 | 42 | 0.89 | 5.8 | 49, 52 | 33% / 63%, 14% / 63% |
| 5 | 61-80 | 20/20 | 2 | 5 | 42 | 0.87 | 5.8 | 50, 54 | 22% / 42%, 22% / 55% |
| 6 | 81-100 | 20/20 | 1 | 11 | 40 | 0.87 | 5.8 | 49, 52 | 21% / 63%, 26% / 63% |
| 7 | 101-120 | 20/20 | 0 | 15 | 40 | 0.88 | 5.9 | 50, 52 | 20% / 55%, 18% / 54% |
| 8 | 121-140 | 20/20 | 0 | 12 | 40 | 0.88 | 5.9 | 51, 54 | 28% / 60%, 23% / 58% |

Mốc cấu trúc: L41 Bao thư lớn Winter `n = 8` (`tip: big_envelope`); 3 khay ở L36, L56, L76, L96, L116, L136; 5 cột từ L66 (`tip: five_columns`); level khó 9 chủ đề từ L70; L87 mở sẵn 1 ô (`tip: preplaced`).

### 4.1 Thay đổi generator

- **Thu nhỏ spec** (`shrinkSpec`): vị trí không có ứng viên nào pass thì bớt 2 tem mỗi bước (chủ đề nền n lớn nhất trước, giữ chủ đề giới thiệu và bao thư lớn), tối đa 3 bước. Lần chạy đầu L72 không có ứng viên nào ≤ 6 phút (6,5–6,8) và generator dừng hẳn. Ghi `shrink`, `specCards` trong report và `note` của level.
- `MAX_SPECIAL_CHECKS` 9 → 15 (L60 trượt sk sau 9 ứng viên).
- Ghi file sau mỗi level (chết giữa chừng không mất phần đã sinh).
- Số level bị thu nhỏ tăng theo chương: ch5 5, ch6 11, ch7 15, ch8 12 (thường xuống 39–41 lá). Lý do: từ ch5 p6 có 5 cột và deck 60–62%, mỗi lá trong bộ bài tốn thêm 1 lần rút, nên 43–46 lá vượt 6 phút `o35`. **Đề xuất cho GD (Q5):** hạ khoảng lá tier ch9–13 (nor 39–43, bump 41–44) hoặc deck về 0.56, để spec khớp kết quả và sinh nhanh hơn khoảng 30%. Chưa đổi, chờ GD.

### 4.2 Còn lại

- L141–L240 (ch9–13): chưa sinh. Lệnh `node tools/gen_levels.mjs --from=141 --to=240 --md`, ước 2–2,5 giờ máy khi load 20. Game hiện dùng level APK cùng số (fallback của R5) cho L141+.
- Pool Thư hôm nay 90 level (`levels_daily.js`): chưa làm.
- Đã chạy `node tools/liveops_sim.mjs --refresh-stats` sau đợt sinh: `tools/data/liveops-level-stats.json` có 140 level thật. Sim mặc định: lớn tuổi đều đặn D30 ở L93 (DoD #1 đạt), người nhanh chạm L140 ở D18.

## 5. Câu hỏi và rủi ro

| # | Nội dung | Đề xuất |
|---|---|---|
| Q5 | Spec ch5+ hay phải thu nhỏ (mục 4.1) | Hạ khoảng lá ch9–13 trước khi sinh L141+ |
| Q6 | Winter n 6–8 buộc phải lặp người tuyết (7 level ch4–5) | Giới hạn Winter n ≤ 5 ngoài L41 (cần sinh lại ch4–5), hoặc Art vẽ lại 2 tem Winter thành vật khác |
| Q7 | Sculpture (tương phản thấp, đã bỏ khỏi L9) và Sashimi vẫn trong pool nền (vd L41) | GD quyết có đưa vào `EXCLUDED` không |
| Q8 | Cặp CONFUSE mới là đánh giá bằng mắt | QA/playtest với người lớn tuổi |
| R6 | Thêm cặp CONFUSE hoặc chủ đề chương mới làm đổi spec các chương có chủ đề đó: phải sinh lại chương đó và chương sau | Đúng thiết kế, generator tất định |
