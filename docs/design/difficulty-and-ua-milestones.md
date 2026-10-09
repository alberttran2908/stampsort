# Độ khó và mốc UA: level "khó nhưng không thể thua"

**Ngày:** 2026-10-01 · **Code:** `prototype/stamp/` · **Công cụ:** `node tools/difficulty_report.mjs`, `node tools/gen_proto_levels.mjs --only=5,10`

## 1. Ý tưởng

Campaign UA thường không tối ưu theo lượt cài, mà theo một **sự kiện trong game** (ví dụ "hoàn thành level 5"). Mạng quảng cáo sẽ đi tìm thêm người giống những người đã bắn sự kiện đó. Muốn sự kiện lọc được người thật sự thích game, nó cần hai điều kiện:

1. **Tốn công thật.** Người chơi phải bỏ ra 15–40 phút và vượt qua một level trông rất khó. Người chỉ tải về cho vui sẽ bỏ trước mốc đó.
2. **Không ai bị chặn cứng.** Nếu level khó thật sự làm người chơi thua liên tục, mình mất luôn những người tốt. Vì vậy level mốc **trông khó nhưng không thể thua**.

Game gốc Stamp Solitaire có làm vậy không thì chưa xác minh được. Có một dấu hiệu: ở level 5, người chơi giỏi trong video chỉ còn 6 trên 96 moves khi thắng `[VIDEO 08:52]`, nên level 5 nhiều khả năng là mốc khó của họ **[GIẢ THUYẾT]**.

## 2. Mốc và sự kiện

| Mốc | Thời điểm ước tính sau khi cài (người chơi phổ thông) | Sự kiện | Dùng cho UA |
|---|---|---|---|
| Xong tutorial level 1 | ~1.5 phút | `tutorial_complete`, `af_tutorial_completion` | Lọc người mở app rồi bỏ ngay |
| Mỗi level thắng | | `af_level_achieved` (af_level, af_score = số sao) | Sự kiện chuẩn AppsFlyer, dựng funnel |
| **Level 5 (HARD)** | ~15 phút | `milestone_level_5` | **Sự kiện tối ưu chính (AEO)**: người đầu tư thời gian và không bỏ cuộc khi gặp khó |
| **Level 10 (SUPER HARD)** | ~40 phút | `milestone_level_10` | Tín hiệu người chơi giá trị cao, dùng cho tối ưu theo giá trị hoặc làm proxy cho ROAS khi chưa có IAP |

Thời gian ước tính lấy từ người chơi mô phỏng phí 10% số nước, giả định khoảng 3.2 giây mỗi nước **[GIẢ THUYẾT]**. Phải đo lại bằng playtest.

iOS (SKAdNetwork / AdAttributionKit): gợi ý ánh xạ conversion value theo các bit tutorial, level 3, level 5, level 10, có mua hàng **[GIẢ THUYẾT, PO chốt]**.

## 3. Cơ chế "không thể thua"

Level 5 và 10 có cờ `special` trong `levels.js`. Khi vào level, banner đỏ "HARD LEVEL" / "SUPER HARD LEVEL" hiện ra kèm rung màn hình, và nền bàn chuyển sang đỏ tía. Người chơi **không được báo trước** là mình không thể thua.

| Cơ chế | Mặc định | Hành vi |
|---|---|---|
| `overtime` | Có | Hết moves thì không thua. Ô MOVES chuyển thành ∞ màu đỏ, hiện câu "Out of moves, but the post office stays open: keep going for free!". Thắng trong Overtime chỉ được 1 sao (phần thưởng ít hơn, người giỏi vẫn có lý do thắng trong số moves) |
| `retry` | Để A/B | Hết moves thì hiện panel "So Close!" chỉ có nút chơi lại miễn phí và +5 moves qua ad. Không phạt, giữ Ô phụ đã mua |
| `none` | Để A/B (nhóm đối chứng) | Như level thường |
| Cứu khi kẹt: Magnet trước, Joker sau | Bật ở `overtime` và `retry` | Khi **kẹt cứng** (không còn nước có ích, kể cả khi deck còn bài): nếu đã mở Magnet (từ L4) và còn ô có tem ẩn để hút thì tặng **1 Magnet** (mỗi lượt chơi 1 lần), kèm câu "Stuck? Here's a free Magnet" và bàn tay chỉ vào nút. Vẫn kẹt, hoặc không dùng được Magnet, thì tặng 1 Golden Stamp và bật chế độ đặt. Lý do: dùng booster người chơi đã được dạy, không đưa cơ chế lạ vào level khó (review game design 2026-10-10). Moves vô hạn không cứu được thế kẹt |
| Gợi ý khi đứng im | Bật ở level khó | Đứng im 7 giây thì tự hiện gợi ý miễn phí |

Cấu hình A/B qua URL (sau này qua Remote Config): `?hard=5,10&safety=overtime|retry|none`. Mọi sự kiện đều mang kèm `special` và `safety`, `app_open` mang `ab_hard` và `ab_safety`.

**Kẹt cứng** là phát hiện mới của đợt này. Người chơi mở hết các ô quá sớm trong khi tem còn thiếu nằm dưới những lá không còn chỗ đi, thế là ván kẹt vĩnh viễn. Trước đây game chỉ báo kẹt khi deck đã hết. Giờ `isDeadlocked` (trong `solver.js`) phát hiện được cả khi deck còn bài. Ở level thường, game hiện panel "No Moves Left" (Joker, Pack, Ô phụ, Undo, Retry) ngay, thay vì để người chơi rút deck vô ích tới hết moves.

## 4. Độ khó đo được

Người chơi mô phỏng **không nhìn trộm lá úp**: mỗi lượt nó đoán ngẫu nhiên các lá ẩn, lập kế hoạch ngắn trên bản đoán, và lập lại khi lộ lá mới. Có ba mức:

- **Giỏi:** khớp người chơi trong video, chỉ hơn tối ưu 1–8 moves.
- **Phí 10%:** người chơi phổ thông.
- **Phí 25%:** người mới chơi.

Mỗi level chạy 30 ván cho mỗi mức. **Biên moves** = (moves cho phép − số moves trung vị của người giỏi) / moves cho phép, tức người chơi được phí tối đa bấy nhiêu phần trăm mà vẫn thắng.

| Level | Vai trò | Moves | Tối ưu | Giỏi: trung vị | Biên moves | Giỏi: thắng | Giỏi: kẹt | 10% phí: thắng | 10% phí: kẹt | 10% phí + booster: thắng | 10% phí + booster: kẹt | 25% phí: thắng | 25% phí: thắng nếu +5 | Phút/ván (10% phí) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | tutorial | inf | 23 | 23 | - | 100% | 0% | 100% | 0% | 100% | 0% | 100% | 100% | 1.3 |
| 2 | teach | 66 | 48 | 50 | 24% | 100% | 0% | 100% | 0% | 100% | 0% | 100% | 100% | 2.7 |
| 3 | teach | 75 | 56 | 59 | 21% | 100% | 0% | 100% | 0% | 100% | 0% | 100% | 100% | 3.3 |
| 4 | normal | 82 | 66 | 68 | 17% | 100% | 0% | 100% | 0% | 100% | 0% | 93% | 100% | 3.8 |
| 5 | HARD | 86 | 84 | 87 | -1% | 37% | 0% | 7% | 0% | 7% | 0% | 0% | 37% | 4.7 |
| 6 | normal | 76 | 62 | 64 | 16% | 97% | 0% | 100% | 0% | 100% | 0% | 80% | 100% | 3.5 |
| 7 | normal | 79 | 67 | 69 | 13% | 100% | 0% | 100% | 0% | 100% | 0% | 73% | 100% | 3.8 |
| 8 | normal | 75 | 63 | 65 | 13% | 100% | 0% | 100% | 0% | 100% | 0% | 97% | 100% | 3.6 |
| 9 | breather | 110 | 78 | 79 | 28% | 100% | 0% | 100% | 0% | 100% | 0% | 97% | 97% | 4.3 |
| 10 | SUPERHARD | 100 | 98 | 101 | -1% | 47% | 0% | 13% | 0% | 13% | 0% | 0% | 23% | 5.5 |

*Cập nhật 2026-10-10 sau khi sinh lại L5–L9 (xem mục 6). Cột "+ booster": người chơi phổ thông dùng Magnet/Stamper khi kẹt (số quà khi mở khoá). Kết quả trùng cột thường vì sau khi sửa không level nào còn kẹt cứng.*

**Đọc kết quả:**

- **Level 2–4** dễ, biên 17–24%. Đúng vai trò dạy luật.
- **Level 5 (HARD)** sau khi sinh lại: biên −1%, **kẹt 0%** ở mọi mức. Người giỏi thắng 37% trong moves, phổ thông 7%, nên đa số hết moves khi gần xong rồi vào Overtime. Bản cũ khó sai cách: 65–80% số ván kẹt cứng, phải tặng Joker chưa được dạy.
- **Level 7–8** là nhịp khó vừa. L7 đã bỏ các tem dễ nhầm (Zoo, kính lặn, kính trượt tuyết) và nới lên 79 moves: người mới thắng khoảng 73–80%. L8 người mới thắng 90%.
- **Level 9** thực tế dễ, biên 25%, vì có Joker. Nhãn "wall" không còn đúng. Hợp lý khi để level dạy Joker là phần thưởng sau level 8.
- **Level 10 (SUPER HARD)** có biên âm. Ngay cả người giỏi cũng chỉ thắng 47% trong 100 moves.
- Đường cong răng cưa: dễ → **khó (L5)** → hồi → khó vừa (L7–8) → dễ (L9) → **siêu khó (L10)**.

**Giới hạn:** người chơi mô phỏng chưa phải người thật. Tỉ lệ nước phí của người thật chưa biết. Bảng này dùng để so sánh các level với nhau và để chọn mốc, không dùng làm dự báo tuyệt đối.

## 5. Đo bằng playtest và A/B

Sự kiện ghi trong `localStorage` (`stampsort_events_v1`). Có SDK AppsFlyer hoặc Firebase thì tự chuyển tiếp. Bảng debug `?debug` → **Events** cho xem funnel theo level và copy JSON.

| Sự kiện | Tham số chính |
|---|---|
| `app_open` | lite, ab_hard, ab_safety |
| `level_start` | level, attempt, moves, special, safety |
| `level_complete` | level, attempt, moves_used, moves_left, time_s, stars, overtime, boosters, undo, rescues, continues |
| `level_fail` | level, attempt, reason, delivered, total |
| `level_stuck` | level, attempt, delivered, total, moves_left |
| `level_quit` | level, attempt, moves_used, delivered, total, time_s |
| `overtime_start` | level, attempt, delivered, total, topics_left |
| `rescue_magnet` | level, attempt, delivered, total |
| `rescue_joker` | level, attempt, delivered, total |
| `continue_moves` | level, attempt, source (ad/coins), amount |
| `booster_use` | level, type, paid |
| `tutorial_complete`, `af_tutorial_completion`, `af_level_achieved`, `milestone_level_5`, `milestone_level_10` | |

**Chỉ số cần đạt ở mốc L5 [GIẢ THUYẾT, PO chốt]:**

| Chỉ số | Mục tiêu |
|---|---|
| Tỉ lệ vào Overtime ở L5 | 60–85% (đủ để thấy khó) |
| Tỉ lệ thoát giữa chừng ở L5 (`level_quit` / `level_start`) | < 10% |
| Tỉ lệ hoàn thành L5 trong số người xong tutorial | ≥ 70% |
| Thời gian tới L5, trung vị | 12–20 phút |

**A/B:** chạy 3 nhánh `safety=overtime` / `retry` / `none`. So sánh tỉ lệ hoàn thành L5 và L10, D1 retention, độ dài phiên, và chất lượng người dùng đến từ campaign tối ưu theo `milestone_level_5`.

## 6. Thay đổi 2026-10-10 (theo review game design)

- **Generator đo bằng người chơi không nhìn trộm.** `tools/gen_proto_levels.mjs` chọn seed bằng `sampleHidden`, profile phổ thông (giống bảng trên), cho cả ngưỡng kẹt (`MAX_FAIL`) lẫn tỉ lệ thắng mục tiêu. Trước đây generator dùng solver nhìn được lá úp, nên ghi L5 "thắng 0.93" trong khi người chơi phổ thông thực tế chỉ thắng 13%.
- **L5 sinh lại theo khuôn L10.** 86 moves (khoảng cho phép 84–96), kẹt 0%. Bỏ tem xe buýt 2 tầng (Truck, nhầm với Train) và diều cá mập (Kite): Truck còn 3 tem, Kite còn 4.
- **L7.** Zoo đổi thành Cake. Glasses 8 → 6, bỏ kính trượt tuyết và kính lặn. Moves 80 → 79.
- **Sao** tính theo phần moves dư so với tối ưu: slack = moves − tối ưu; 3★ nếu còn ≥ 50% slack, 2★ nếu ≥ 20%. Luật cũ (còn ≥ 25% ngân sách) gần như không ai đạt 3★.
- **Cứu khi kẹt:** Magnet trước, Joker sau (mục 3).
- **P1 (cùng ngày):** L6 Sauce → Bird, L8 Raw meat → Ship, L9 Balloon → Candy, nhãn breather. Sinh lại L6, L8 (thêm mục tiêu người mới) và L9.
  - L8: người mới thắng 97%.
  - L6: generator đo được 100% nhưng báo cáo (seed mô phỏng khác) ra 80%, dưới mục tiêu 90%. Số moves giữ theo video (76). Nếu playtest thấy khó thì nới lên 78.
- **Stamper mới** lật ngửa cả một cột. Undo giữ ngửa các lá đã lộ. Gợi ý tự động ở level khó chỉ bật sau lần kẹt hoặc Overtime đầu tiên. Overtime đổi tên thành "Evening shift", tông ấm.
