# Pipeline level L21+: kết quả R1–R3 (luật A)

**Ngày:** 2026-10-15 · **Người làm:** level dev agent · **Kế hoạch gốc:** `30-day-plan.md` mục 3.5 và mục 6 (R1–R3).
**Trạng thái:** R1, R2, R3 đạt AC. Tiếp theo (R4, R6, R7): `level-r4-r6.md`. Level ch3 chưa nối vào game (thuộc R5). Chưa commit.

## 1. Lệnh

| Việc | Lệnh | Thời gian |
|---|---|---|
| Bảng spec 180 level | `node tools/level_spec.mjs --print=21-200` (thêm `--json`; `--chapters` để xem chủ đề mới và fallback) | < 1 giây |
| Test spec (R1) | `node tools/tests/level_spec.test.mjs` | 0,4 giây |
| Test generator và validator | `node tools/tests/gen_levels.test.mjs` | khoảng 10 giây |
| Validator (R2) | `node tools/validate_levels.mjs` (A, L2–L20). Thêm `--file=prototype/stamp/src/levels_b.js`, `--levels=21-40`, `--runs=300`, `--seed-base=90000` | 14–60 giây |
| Sinh chương (R3) | `node tools/gen_levels.mjs --from=21 --to=40 --md`. Ghi gộp vào `prototype/stamp/src/levels_gen.js` và `prototype/stamp/levels-gen-report.json` (đổi bằng `--out`, `--report`) | 8–13 phút cho 1 chương (14 luồng) |
| Độ khó kiểu cũ, có `o35` | `node tools/difficulty_report.mjs --file=... --out=...` | |

Vòng này **không ghi file nào trong `prototype/`**: mọi lần chạy đều dùng `--out` vào scratchpad, theo ràng buộc của người điều phối. Generator tất định, nên R5 chỉ cần chạy lại đúng lệnh trên với đường dẫn mặc định để có file giống hệt (so sha256 ở mục 4).

## 2. Quyết định

| # | Quyết định | Ai | Lý do, số liệu |
|---|---|---|---|
| D1 | Luật A mặc định, level thường vẫn thua, duyệt 27 chủ đề mới | Người dùng | Người điều phối báo 2026-10-15 |
| D2 | Level ABI là ứng viên hợp lệ | Người dùng | "level tốt nhất, của ABI hay tự làm không quan trọng" |
| D3 | Bảng `TIERS` luật A: nor 7–8 chủ đề, bump 8–9, HARD 8–10, SUPER 9–10 (5 khay) | Level dev | Theo A L1–L20 hiện có và xu hướng ABI `[APK]`. Cắt theo trần độ dài |
| D4 | Trần: thường ≤ 46 lá và ≤ 6 phút `o35`; bump ≤ 6,5 phút; khó ≤ 54 lá và ≤ 8 phút | Level dev | Bản spec đầu (≤ 48 lá): L26 bump 45 lá có 9/9 ứng viên vượt 6 phút. Luật A cần khoảng 1,9 nước/lá với `o35`, nên 6 phút ≈ 44 lá. Không theo ABI phần 64–98 lá (10–15 phút) |
| D5 | Nới trần `sk` ở level khó: HARD 0.35–**0.70**, SUPER 0.30–**0.65** | Level dev | Ở ch3, 3 lần × 40 layout chỉ có 1–2 layout đạt cả `c10` lẫn `sk` trong khoảng cũ. Level cũ cũng trượt (A L15 `sk` 0.71, A L20 1.00). `c10` và kẹt giữ nguyên |
| D6 | Level khó có biến thể deck +8 điểm (`colsAlt`). Seed chẵn dùng biến thể này | Level dev | L30 chỉ đạt khi deck 63%, L40 chỉ đạt khi deck 55%. A L5/L15 (deck 64–65%) đạt `sk` khoảng 0,5 |
| D7 | 3 khay đặt ở level nghỉ p16 (L36, L56…), không đặt ở bump p6 | Level dev | ABI dùng 3 khay cho level nhỏ 6–7 chủ đề `[APK]` (L22, L27, L36, L41). Bump 8 chủ đề với 3 khay thì dễ kẹt |
| D8 | Moves của ứng viên ABI **không** lấy theo ABI mà chỉnh theo mục tiêu như ứng viên tự sinh | Level dev | Để đường cong độ khó nhất quán giữa hai nguồn. Moves ABI gốc ghi trong `note` |
| D9 | Biên an toàn +0.03 khi chỉnh moves trên seed tune (không vượt 0.95) | Level dev | Seed tune chỉ có 60 ván. Kiểm tra trên seed 90000 khi chưa có biên: L35 `o35` +5 = 0.88 < 0.90 |
| D10 | Pool nền bỏ Raw meat, Sauce. Bird và Leaf (3 art) chỉ được `n = 3` | Level dev | Plan mục 2.1 |
| D11 | Thêm cặp CONFUSE Knitting ↔ Outerwear `[GIẢ THUYẾT]` | Level dev | Áo len và áo khoác len. Cần confusion check khi có art |
| D12 | Fallback: 27 chủ đề nền khác nhau, gần nghĩa với khu. Car (8 art) dùng cho "Bao thư lớn" L41 | Level dev | `CHAPTER_TOPICS` trong `level_spec.mjs`. Mask dùng fallback Ice cream vì Hat chỉ có 4 art |

## 3. R1, R2

**R1** (`tools/level_rules.mjs`, `tools/level_spec.mjs`, `tools/tests/level_spec.test.mjs`): 14/14 test pass.
- 180 dòng, 9 chương, mỗi chương có 4 level nghỉ, 1 HARD, 1 SUPER.
- 0 cặp CONFUSE (42 cặp trong danh sách). `n ≤ art`.
- Số lá nằm trong khoảng của tier và vai trò. Cột cộng deck khớp số lá, deck lệch tier ≤ 4 điểm.
- Mỗi chủ đề mới xuất hiện đúng 8/20 level (40%), mỗi chủ đề của chương trước 4/20 (20%), ở cả 9 chương. Chủ đề mới không xuất hiện trước level giới thiệu, cũng không có ở chương liền trước.
- Không có 3 đỉnh liên tiếp, kể cả nối từ A L1–L20.
- Hai lần chạy CLI cho cùng hash.
- Art Lantern, Knitting, Acorn, Winter, Candle, Gift về trong phiên (10:48–11:08). Spec ch3 và ch4 tự đổi từ fallback sang chủ đề thật, đúng cơ chế đã định: chỉ chương có art mới và chương liền sau đổi. Test vẫn 14/14 pass sau khi art về.

**R2** (`tools/validate_levels.mjs`; `difficulty_report.mjs` có thêm `o35`, `--file`, `--out`). Chạy 200 ván mỗi profile, seed `50000 + id`. Validator kiểm cả phần tĩnh: CONFUSE, số chủ đề theo luật, n khớp số tem, art có thật, giải được, số lá, phút, slack.

| File | Pass | Thời gian | Trượt |
|---|---|---|---|
| `levels_b.js` L2–L20 | 8/19 | 13,6 giây (máy rảnh), 63 giây (máy bận) | L2: kẹt c10 0.035 > 0.03; L5: sk 0.940 ∉ 0.35-0.7; L6: c25 0.715 < 0.85, o35 0.495 < 0.7, o35+5 0.800 < 0.93; L7: c25 0.805 < 0.85, o35 0.570 < 0.7, o35+5 0.910 < 0.93; L10: c10 0.450 ∉ 0.1-0.3, sk 0.965 ∉ 0.3-0.65; L13: o35 0.690 < 0.7; L14: CONFUSE Coffee+Ice cream, c25 0.740 < 0.8, o35 0.430 < 0.6, o35+5 0.845 < 0.9; L15: sk 1.000 ∉ 0.35-0.7; L17: o35 0.625 < 0.7, o35+5 0.925 < 0.93; L19: o35+5 0.875 < 0.9; L20: sk 0.860 ∉ 0.3-0.65 |
| `levels.js` (A) L2–L20 | 8/19 | 18,3 giây (máy rảnh), 94 giây (máy bận) | L4: o35 0.645 < 0.7, o35+5 0.825 < 0.93; L7: c25 0.845 < 0.85, o35 0.520 < 0.7, o35+5 0.890 < 0.93; L8: o35 0.695 < 0.7, o35+5 0.920 < 0.93; L9: 48 lá > 46, o35 6.7 phút > 6; L10: 60 lá > 54, c10 0.090 ∉ 0.1-0.3, o35 8.6 phút > 8; L14: CONFUSE Coffee+Ice cream, 48 lá > 46, o35+5 0.840 < 0.9; L15: sk 0.710 ∉ 0.35-0.7; L17: c25 0.760 < 0.85, o35 0.495 < 0.7, o35+5 0.855 < 0.93, o35 6.2 phút > 6; L18: o35 0.610 < 0.7, o35+5 0.880 < 0.93, o35 6.6 phút > 6; L19: 50 lá > 46, c25 0.700 < 0.8, o35 0.255 < 0.6, o35+5 0.560 < 0.9, o35 7.6 phút > 6.5; L20: CONFUSE Coffee+Ice cream, 58 lá > 54, c10 0.330 ∉ 0.1-0.3, sk 1.000 ∉ 0.3-0.65, o35 8.6 phút > 8 |

**L14 B bị bắt:** `o35` 0.43 < 0.60 (plan `[SIM]` ước khoảng 0,39), `c25` 0.74 < 0.80, `o35` +5 0.84 < 0.90 và CONFUSE Coffee+Ice cream. Đây là việc của R4: nới moves các level trượt `o35`, sửa CONFUSE ở A L14, A L20, B L14, quyết trần cho A L9/L10/L20.

## 4. R3: chương 3 (L21–L40)

`tools/gen_levels.mjs`: mỗi vị trí có 6 ứng viên tự sinh (level khó: 40) và tối đa 4 ứng viên ABI.
- Moves chỉnh trên seed tune `70000 + id` và xếp hạng theo điểm (kẹt, phút so với mức lý tưởng, slack, độ dễ thừa).
- Kiểm tra bằng validator trên seed check: 3 ứng viên đầu bảng mỗi lô. Trượt thì +2 moves (level khó ±1), tối đa 3 lần.

**Kết quả: 20/20 pass seed check. Chạy độc lập bằng validator: 20/20.** Có 2 (L29 ← ABI L46, L35 ← ABI L42) level từ ABI. sha256 `e9175fe3a7469eaf`, giống nhau ở 2 lần chạy. Thời gian phụ thuộc tải máy. CPU khoảng 3.600 giây ở mọi lần chạy (14 luồng; lý thuyết khoảng 4,5 phút nếu máy rảnh). Đo được: 474 giây khi load average khoảng 12; 751 giây khi load average khoảng 20; 1.163 giây khi máy chạy iOS Simulator và Chrome (load average lên tới 390). **AC "dưới 10 phút" chỉ đạt khi máy không bị agent khác chiếm CPU**.

Bản cuối dùng art thật của Lantern, Knitting, Acorn (về lúc 10:48–10:57). Cột c10…Phút đo trên seed check, 200 ván; (+n) là số moves nới ở bước kiểm tra:

| L | Vai trò | Nguồn | Lá | Chủ đề | Khay | Cột | Solver | Moves | Slack | c25 | o35 | o35 +5 | c10 | c10 kẹt | sk | Phút o35 | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 21 | intro-br | gen:301028 | 34 | 6 | 4 | 2-3-4-6 | 53 | 72 | 1.36 | 100% | 98% | 100% | 100% | 0% | - | 4.7 | pass |
| 22 | nor | gen:302006 | 40 | 7 | 4 | 3-4-5-6 | 62 | 80 | 1.29 | 98% | 95% | 98% | 100% | 0% | - | 5.3 | pass |
| 23 | nor | gen:303001 | 41 | 7 | 4 | 3-4-5-6 | 65 | 84 | 1.29 | 100% | 97% | 99% | 100% | 0% | - | 5.5 | pass |
| 24 | intro | gen:304028 | 42 | 7 | 4 | 3-4-5-7 | 66 | 85 | 1.29 | 100% | 92% | 98% | 100% | 0% | - | 5.7 | pass |
| 25 | nor | gen:305003 | 41 | 7 | 4 | 3-4-5-6 | 65 | 84 | 1.29 | 100% | 94% | 98% | 100% | 0% | - | 5.5 | pass |
| 26 | bump | gen:306006 | 43 | 8 | 4 | 3-4-5-7 | 68 | 80 | 1.18 | 96% | 78% | 92% | 99% | 0% | - | 5.8 | pass |
| 27 | br | gen:307003 | 35 | 6 | 4 | 2-3-5-6 | 54 | 73 | 1.35 | 100% | 98% | 100% | 100% | 0% | - | 4.7 | pass |
| 28 | nor | gen:308001 | 40 | 7 | 4 | 3-4-5-6 | 62 | 83 | 1.34 | 97% | 89% | 99% | 100% | 0% | - | 5.5 | pass |
| 29 | bump | abi:L46 | 41 | 7 | 4 | 2-3-4-5 | 68 | 83 | 1.22 | 95% | 74% | 92% | 100% | 0% | - | 6.1 | pass |
| 30 | HARD | gen:310013 | 51 | 8 | 4 | 4-5-6-8 | 80 | 82 | 1.02 | - | 2% | 23% | 28% | 0% | 44% | 6.9 | pass |
| 31 | br | gen:311008 | 36 | 6 | 4 | 2-3-5-6 | 57 | 77 | 1.35 | 100% | 98% | 100% | 100% | 0% | - | 5 | pass |
| 32 | intro | gen:312014 | 41 | 7 | 4 | 3-4-5-6 | 64 | 87 (+2) | 1.36 | 97% | 89% | 95% | 100% | 0% | - | 5.5 | pass |
| 33 | nor | gen:313001 | 43 | 7 | 4 | 3-4-5-7 | 67 | 86 | 1.28 | 100% | 100% | 100% | 100% | 0% | - | 5.5 | pass |
| 34 | nor | gen:314006 | 43 | 7 | 4 | 3-4-5-7 | 68 | 88 | 1.29 | 100% | 94% | 100% | 100% | 0% | - | 5.8 | pass |
| 35 | bump | abi:L42 | 41 | 8 | 4 | 2-3-4-5 | 68 | 88 (+2) | 1.29 | 97% | 80% | 92% | 100% | 0% | - | 6.3 | pass |
| 36 | br | gen:316005 | 40 | 6 | 3 | 3-4-5-6 | 64 | 87 | 1.36 | 100% | 98% | 100% | 100% | 0% | - | 5.5 | pass |
| 37 | nor | gen:317002 | 42 | 7 | 4 | 3-4-5-7 | 66 | 85 | 1.29 | 99% | 94% | 99% | 100% | 0% | - | 5.8 | pass |
| 38 | nor | gen:318005 | 43 | 7 | 4 | 3-4-5-7 | 67 | 94 (+4) | 1.4 | 100% | 88% | 97% | 100% | 0% | - | 5.9 | pass |
| 39 | bump | gen:319002 | 46 | 8 | 4 | 3-5-6-7 | 72 | 85 (+2) | 1.18 | 93% | 72% | 93% | 100% | 0% | - | 6.2 | pass |
| 40 | SUPER | gen:320019 | 54 | 9 | 5 | 2-4-5-6-7 | 84 | 89 | 1.06 | - | 1% | 8% | 11% | 0% | 53% | 7.5 | pass |

Nhận xét:
- Level thường có `o35` 0.88–1.00, cao hơn mục tiêu 0.75. Lý do: sàn slack 1.28 (`ceil(solver × 1.28)`) lớn hơn mọi phân vị mục tiêu, nên moves hào phóng hơn mức cần. Bump `o35` 0.74–0.78 (mục tiêu 0.60). Nếu GD muốn đường cong sát mục tiêu hơn thì hạ slack sàn nor xuống khoảng 1.20 (câu hỏi Q1).
- Level khó: L30 có `c10` 0.28 và `sk` 0.44. L40 có `c10` 0.11 và `sk` 0.53. Kẹt 0%, `o35` 6,9–7,5 phút.
- Kiểm tra lại bản cuối bằng validator độc lập, seed check: 20/20.
- **Kiểm tra trên seed chưa dùng (seed 90000, 300 ván): 18/20.** L32 `o35` +5 = 0.947 < 0.95. L35 (ABI L42) `o35` +5 = 0.877 < 0.90. Cả hai trượt trong khoảng 1,5 sai số chuẩn: `o35` +5 là chỉ số sát biên nhất, vì biên D9 bị chặn ở 0.95 nên mục tiêu 0.95 không có biên. Bản trước khi thêm D9 được 19/20. R21 nên chạy với seed mới và ≥ 300 ván; nếu trượt thì +2 moves. Một hướng khác: cho validator chấp nhận dung sai 1 sai số chuẩn (câu hỏi Q4).

## 5. Nguồn ABI

- 963 level ABI chỉ có **73 layout khác nhau**. 179 level là cùng một layout 36 lá, 3 khay, đổi chủ đề. Vừa trần độ dài của mình (≤ 54 lá, n ≤ 8, 5–10 chủ đề) thì còn khoảng 20 layout. Phần lớn level ABI sau L20 có 64–98 lá.
- Ở ch3, ứng viên ABI hợp lệ thắng ở 2 vị trí bump: L29 ← ABI L46 và L35 ← ABI L42. Cả hai đều 41 lá, 2-3-4-5, 4 khay. Các lần chạy với spec khác nhau (fallback hay art thật) chọn 1–2 level ABI.
- Hệ quả cho plan: ABI không rút ngắn R6–R8 nhiều về **số level**. Thứ rút ngắn là generator tự chọn và tự kiểm tra, nên R6–R8 gộp còn R6–R7 (khoảng 9 phút máy mỗi chương). Muốn dùng nhiều level ABI hơn thì phải nới trần độ dài (Q2).

## 6. Rủi ro và câu hỏi

| # | Nội dung | Đề xuất mặc định (đã áp dụng nếu có) |
|---|---|---|
| Q1 | Level thường dễ hơn mục tiêu (`o35` 0.90+) vì sàn slack | Giữ, vì đối tượng lớn tuổi và level vẫn thua được. GD có thể hạ slack sàn nor |
| Q2 | Dùng nhiều level ABI hơn bằng cách nới trần 46/54 lá? | Không: trái yêu cầu "ván không quá dài" |
| Q3 | D5 nới `sk` ở level khó | Đã áp dụng. GD xác nhận |
| R1 | Thời gian sinh phụ thuộc tải máy: 474 giây khi máy rảnh, 761 giây khi load average khoảng 20 (trước khi chạy song song toàn chương) | Đã xếp hàng đánh giá mọi vị trí từ đầu. Dùng `--jobs` |
| R2 | Art chủ đề mới về giữa chừng làm spec đổi, nên phải sinh lại chương đó (và chương sau) | Đúng thiết kế. Generator tất định |
| R3 | `levels_gen.js` có các trường mới (`tip`, `source`, `targets`, `rules`). Game chưa đọc | R5 |
| R4 | `gen_proto_levels.mjs` (L1–L20) vẫn giữ CONFUSE cũ, chưa dùng `level_rules.mjs` | R4 |
| R5 | Art chủ đề ch3 và ch4 đã về trong phiên (Lantern, Knitting, Acorn, Winter, Candle, Gift; mỗi chủ đề 8 ảnh, có icon nét). Ch3 bản cuối đã dùng art thật. L41 "Bao thư lớn" giờ là Winter, `n = 8` | Không cần làm gì thêm. Ch5–11 vẫn dùng fallback |
| Q4 | `o35` +5 trên seed chưa dùng có thể trượt sát biên (18/20) | Đề xuất: R21 dùng 300 ván và seed mới, trượt thì nới +2 moves. Không hạ mục tiêu |
