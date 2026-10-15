# Benchmark chất lượng: Grand Games (Magic Sort và các game cùng studio)

**Ngày:** 2026-10-15 · **Tác giả:** game-designer agent · **Trạng thái:** đề xuất, chưa sửa code.
**Yêu cầu của người dùng:** chuẩn chất lượng là game của Grand Games: "các tính năng, events vừa đủ, chất lượng, hiệu ứng, đồ hoạ, âm thanh đều tinh tế và xịn". Tài liệu này biến câu đó thành tiêu chí đo được và một backlog polish.
**Đối tượng của mình:** người chơi lớn tuổi, tone chill (`older-players-pass.md`). Không có cốt truyện.

**Nhãn nguồn:**

| Nhãn | Nghĩa |
|---|---|
| `[WEB n]` | Nguồn web, số `n` tra ở mục 12 |
| `[STORE]` | App Store listing (mô tả, IAP, version history), đọc ngày 2026-10-15 |
| `[CODE file:dòng]` | Code prototype, mặc định là `prototype/stamp/src/main.js` |
| `[ẢNH]` | Ảnh chụp prototype ngày 2026-10-15, Chrome headless 390×844 @2x, `?debug` (lưu trong scratchpad, không commit) |
| `[DOC]` | Tài liệu trong repo |
| `[GIẢ THUYẾT]` | Suy luận, cần kiểm chứng |
| `[MỤC TIÊU]` | Thông số mình đề xuất cho game của mình. **Không phải số đo từ Magic Sort** |

> **Giới hạn quan trọng.** Không nguồn công khai nào mô tả thông số animation của Magic Sort (thời lượng tween, easing, số hạt). Mục 4 vì vậy là **spec mục tiêu** dựa trên quy ước của nhóm game "premium casual" (Royal Match, Zen Match, Magic Sort) và nguyên tắc đã được phân tích công khai. Muốn có số thật thì làm vòng **P0** (quay màn hình Magic Sort 60fps rồi đếm frame), mục 10.

---

## 1. "Chuẩn Grand Games" thành tiêu chí đo được

| Trụ cột (lời người dùng) | Nghĩa cụ thể | Đo bằng | Ngưỡng đạt `[MỤC TIÊU]` |
|---|---|---|---|
| **Tính năng, event vừa đủ** | Ít hệ thống nhưng hệ thống nào cũng chạy tốt. Mở dần theo level. Màn chính không bị nhồi | Số điểm chạm trên màn chính, level mở từng tính năng | ≤ 5 điểm chạm ở màn chính (Play, Daily, 1 event, Album, Trang trí). Tối đa 1 event chạy cùng lúc ở D1–D30. Không tính năng nào mở trước L5 |
| **Chất lượng** | Không lỗi hình, không giật, không chỗ trống vô lý, không đường nối | Frame time, ảnh chụp ở 3 tỉ lệ màn hình | p95 frame ≤ 20 ms, frame tệ nhất ≤ 50 ms kể cả lúc chia bài. 0 đường nối nền ở 16:9, 19.5:9, 20:9 |
| **Hiệu ứng (juice)** | Mỗi thao tác có phản hồi ngay. Ăn mừng tỉ lệ với ý nghĩa sự kiện. Ăn mừng không chặn tay | Đếm frame trên video 60fps | Phản hồi hình ≤ 1 frame sau khi chạm. Animation lõi ≤ 250 ms. Thao tác kế tiếp nhận được ≤ 150 ms sau khi thả |
| **Đồ hoạ** | Một ngôn ngữ hình ảnh nhất quán, palette hẹp, phân cấp rõ | Rà theo checklist mục 5 | 1 kiểu nút chính, 1 kiểu nút phụ. Hạt và confetti dùng palette của game |
| **Âm thanh** | Có nhạc và không khí nền, SFX mềm, không mệt tai | LUFS, số lớp, test ×12 | Có nhạc nền ở 2 màn (chính, chơi). Nhạc nhỏ hơn SFX thao tác 2–4 dB. Bật/tắt nhạc và SFX riêng |
| **"Xịn" (cảm nhận tổng)** | Người chơi thấy game chỉn chu ngang game top | Playtest cảm nhận | 5 người lớn tuổi xem 2 video 30 giây (Magic Sort và mình), chấm "trông chỉn chu" thang 1–7: mình ≥ 5,5 và kém Magic Sort ≤ 0,5 điểm |

---

## 2. Grand Games là ai, và họ làm gì để được gọi là "xịn"

### 2.1 Studio

- Istanbul, thành lập đầu 2024. Ba nhà sáng lập đều từ Good Job Games, từng làm Zen Match (tile sort, sau đó bán cho Moon Active) `[WEB 1][WEB 3]`.
- Gọi vốn: pre-seed 3 triệu USD (7/2024), Series A 30 triệu USD do Balderton dẫn (1/2025) `[WEB 3][WEB 4]`. Một nguồn tổng hợp ghi Series B 70 triệu USD (5/2026), chưa kiểm chứng được bằng bài gốc vì PocketGamer.biz chặn truy cập `[WEB 10]`.
- Cấu trúc: các team nhỏ tự chủ (kiểu Supercell). Magic Sort và Car Match được làm trong chưa đầy 10 tháng `[WEB 3][WEB 4]`.
- Danh mục trên App Store: Magic Sort!, Car Match, Block Out!, Maze Out!, Knock And Drop, Pixel Pop!, Block Star `[STORE]`.

### 2.2 Đánh giá của giới phân tích về chất lượng

| Nhận định | Nguồn |
|---|---|
| "Stick to a proven core, wrap it in premium visuals, ship strong levels, run a tight LiveOps calendar" | Deconstructor of Fun `[WEB 2]` |
| Magic Sort "chỉ cần thêm vài event và offer là trông gần như Royal Match" | `[WEB 2]` |
| "Near-Royal Match-level production values", level nhanh, phản hồi nhạy, puzzle rõ ràng | Naavik `[WEB 3]` |
| Không đột phá về gameplay so với các game water sort khác | `[WEB 2][WEB 5]` |
| Màu sắc rực, animation mượt, nước xoáy và chảy giữa các chai "satisfying" | Gamigion `[WEB 5]` |
| Nhạc nền êm, tiếng nước nhẹ tạo cảm giác zen. Ống thuỷ tinh trông thật, màu nước rực và dễ phân biệt | `[WEB 8]`, Mobidictum ("calming audio", "polished interface") `[WEB 9]` |

Chuẩn tham chiếu của cả nhóm này là Royal Match. Naavik mô tả animation power-up của Royal Match là **"short, fluid, just enough to satisfy players"**: đủ để thoả mãn nhưng không làm chậm, nên số lượt thử mỗi phiên tăng `[WEB 11]`. Đây là nguyên tắc juice số 1 của tài liệu này.

### 2.3 Điểm yếu người chơi phàn nàn (để mình tránh)

| Phàn nàn | Tỉ lệ / nguồn |
|---|---|
| Quá nhiều quảng cáo, quảng cáo ép thoát | 67% và 33% của 61 review tiêu cực trên Google Play `[WEB 7]` |
| Pay-to-win | 25% review tiêu cực `[WEB 7]` |
| Độ khó "lừa", gai độ khó, may rủi quá lớn, thua là phải thử lại mù quáng | 17% `[WEB 7]`, `[WEB 6]` |
| Event chỉ hợp người chơi cạnh tranh. Trả 7 EUR để giữ chuỗi Sky Jump, phần thưởng không bằng giá một lần nối | `[WEB 6]` |
| Đồ hoạ "trông như AI vẽ" | 5% review tiêu cực `[WEB 7]` |

Mình nhắm người lớn tuổi, nên **những điểm yếu này quan trọng ngang điểm mạnh**: lấy độ chỉn chu của Grand Games, bỏ áp lực event và quảng cáo của họ.

---

## 3. Tính năng meta và LiveOps của Magic Sort

### 3.1 Danh sách

| Nhóm | Tính năng | Mô tả đã biết | Mở ở level | Nguồn |
|---|---|---|---|---|
| Core | Đổ nước, chai, chướng ngại | Chai bọc đá, level màu ẩn, chai giới hạn dung tích, đổi màu | Chưa rõ. Một bài phân tích viết cơ chế mới "đến quá muộn" | `[STORE][WEB 6][WEB 12]` |
| Booster | Undo, Shuffle | Trả xu khi kẹt | Chưa rõ | `[STORE][WEB 5]` |
| Nối ván | +1 chai rỗng | Hiện khi hết đường, giống "+5 moves" của Candy Crush. Phần lớn doanh thu IAP đến từ đây | Ngay khi thua | `[WEB 3][WEB 5]` |
| Độ khó thích ứng | Bỏ 1 màu ở lượt thử thứ 2 | Ví dụ ở L26: thua lần đầu thì lượt sau có ít màu hơn | L26 | `[WEB 3]` |
| Mạng | Lives | Có video hướng dẫn "lấy thêm lives" | Chưa rõ | `[WEB 12]` |
| Booster meta | Cauldron (vạc) và nguyên liệu | "Stir up boosts in the cauldron", "gather ingredients to brew stronger magic" | Chưa rõ | `[STORE]` |
| Daily | Daily puzzle, daily challenge tracker | Có chế độ puzzle hằng ngày | Chưa rõ | `[WEB 3]` |
| Xếp hạng | 3 leaderboard: tuần, quốc gia, toàn cầu | Meta nhẹ | Chưa rõ | `[WEB 3]` |
| Event milestone | Broom Streak | Thắng liên tiếp không thua để lên mốc | "Khá sớm" | `[WEB 3][WEB 6]` |
| Event chuỗi | Sky Jump | Chuỗi thắng, có thể trả xu để giữ chuỗi | Chưa rõ | `[WEB 6]` |
| Event đua | Magic Streak, Jetpack Race | Leaderboard cạnh tranh | Chưa rõ | `[WEB 3][WEB 12]` |
| Event tiền | Coin Rush | Có video hướng dẫn | Chưa rõ | `[WEB 12]` |
| Ưu đãi | Endless Portal (5,99 USD) | Tên gợi ý gói "vô hạn" theo thời gian (lives hoặc booster) `[GIẢ THUYẾT]` | Chưa rõ | `[STORE][WEB 12]` |
| Social | Thi đấu, chat | Nhãn tuổi 13+ ghi "Frequent Contests, Loot Boxes, Messaging and Chat" `[STORE]`. Car Match thêm "Teams" và "Collection event" ngày 26/2 `[STORE]`, nên Magic Sort nhiều khả năng cũng có Teams `[GIẢ THUYẾT]` | Chưa rõ | `[STORE]` |
| Quảng cáo | Interstitial, rewarded | Quảng cáo bắt đầu từ L22 | L22 | `[WEB 5]` |
| IAP | 10 gói từ 0,99 tới 19,99 USD | Starter, Special Offer, 3 bundle theo cấp (Apprentice, Magician, Sorcerer), 3 gói xu, Endless Portal | | `[STORE]` |

### 3.2 Nhịp ra nội dung và event

| Game | Bằng chứng | Nhịp |
|---|---|---|
| Magic Sort | 26 bản cập nhật từ 21/2 tới 5/10, bản nào cũng ghi "New 100 levels" `[STORE]` | **Khoảng 9 ngày một bản, mỗi bản 100 level**. Event mới khoảng 2 tháng một lần (theo Naavik, số liệu cũ khoảng 2025) `[WEB 3]` |
| Block Out! | 25 bản từ 14/4 tới 13/10 `[STORE]`. Khu vực mới (area): Florence 6/7, Mona Lisa 20/7, Perfect Portrait 17/8, Dino Discovery 31/8, Jurassic 14/9, Egg Trouble 28/9, Dino Chase 13/10 | **Khu vực mới đúng 2 tuần một lần.** Chướng ngại mới khoảng 4 tuần một lần (Color Shutter, Hay Block, Ivy, Multilayer, Color Grinder, Locked Shutter). Event và chế độ: Streak Race (8/6), Mission Carnival (24/7), Balloon Ride (3/8), Lily Leap (10/8). Có "Block Pass" (9,99 USD). Bản 14/4 ghi riêng "New sound effects" |
| Car Match | 25 bản. Từ tháng 3, gần như bản nào cũng ghi "Multiple new events and offers" `[STORE]` | 1–3 tuần một bản. Teams và Collection event thêm cùng lúc (26/2) |

Rút ra (`[GIẢ THUYẾT]` cho phần diễn giải):
- **Nội dung đều đặn quan trọng hơn nhiều tính năng.** Grand Games thắng bằng nhịp ổn định: level mới mỗi tuần, khu vực mới mỗi 2 tuần. Số loại event không nhiều (khoảng 4–6 template xoay vòng).
- **"Vừa đủ"** nghĩa là ít template nhưng chạy liên tục, và mở dần. Block Out cho thấy công thức: area meta (trang trí theo khu) cộng 1 event xoay vòng cộng pass.
- **Không xác minh được** số icon event cùng lúc trên màn chính Magic Sort từ nguồn chữ. Cần ảnh chụp thật (câu hỏi mở #1).

### 3.3 Đối chiếu với Stamp Solitaire và game mình

| Hạng mục | Magic Sort | Stamp Solitaire (ABI) | Little Post Office hiện tại |
|---|---|---|---|
| Meta chính | Leaderboard, cauldron | Climbing Quest, Stamp Rush (bản 0.17+) `[DOC teardown-stamp-solitaire.md]` | Tem Điểm đổi decor, album, thưởng chương `[CODE 2107–2124, 2565–2617]` |
| Daily | Có | Không | Chưa có (M3 trong `30-day-plan.md`) |
| Event | 4–5 template, cạnh tranh | 2 | Chưa có |
| Lives | Có | Có, trừ gấp đôi khi từ chối quảng cáo | Không (chủ ý) |
| Nhịp nội dung | 100 level mỗi khoảng 9 ngày | | 60 level, kế hoạch 200 |

---

## 4. Juice và game feel

### 4.1 Nguyên tắc

1. **Phản hồi trong 1 frame, kết thúc trong 1/4 giây.** Thao tác lõi (nhặt, thả, rút) có phản hồi hình ngay lập tức và kết thúc ≤ 250 ms. Lấy theo nguyên tắc "short, fluid, just enough" `[WEB 11]`.
2. **Ăn mừng tỉ lệ với ý nghĩa.** 4 bậc: thao tác < tiến độ (tem vào ô) < mốc (đủ bộ, gửi thư) < kết thúc (thắng, hết chương). Mỗi bậc lên thì tăng một chiều (thời lượng, số hạt, âm, haptic), không tăng tất cả cùng lúc.
3. **Ăn mừng không bao giờ chặn tay.** Người chơi đi nước kế tiếp trong lúc phong bì đang bay.
4. **Ít đường cong, dùng nhất quán.** 3 easing: `outCubic` (di chuyển), `outBackSoft` (đáp xuống, bật), `inOutCubic` (bay vòng cung). Không dùng `outElastic` trong gameplay.
5. **Anticipation, overshoot, settle.** Vật nhấc lên hơi phồng, đáp xuống hơi nén rồi về 1.0. Biên độ nhỏ (2–6%) là đủ "xịn". Biên độ lớn trông rẻ.
6. **Ánh sáng và bóng làm nên độ sâu.** Bóng to và mờ hơn khi nhấc lá, hạt có alpha mềm, không dùng màu neon.

### 4.2 Spec từng khoảnh khắc

Cột "Hiện tại" đọc từ code. Cột "Mục tiêu" là `[MỤC TIÊU]` cho bản người lớn tuổi (đã áp dụng mục 7).

| Khoảnh khắc | Hiện tại | Mục tiêu | Ghi chú |
|---|---|---|---|
| **Chạm lá (pointerdown)** | Chưa có phản hồi tới khi kéo quá 12 px. Lúc đó lá phóng 1.0→1.07 trong 120 ms `[CODE 1398–1407]` | Ngay khi chạm: lá 1.0→1.04 trong 80 ms `outCubic`, bóng chuyển sang `shadow_lift`. Khi bắt đầu kéo: 1.04→1.07 trong 80 ms. Haptic "light" | Phản hồi tức thì là chỗ người chơi cảm thấy game "nhạy" |
| **Kéo** | Lá đi theo ngón tay | Lá nghiêng theo vận tốc ngang, tối đa ±4°, về 0° trong 120 ms khi dừng. Lá phía dưới trong chồng trễ 1 frame (nối đuôi) | Vật lý nhẹ làm lá trông như giấy thật |
| **Thả đúng lên cột** | 170 ms `outBackSoft`, squash 6% trong 180 ms, `place`, rung 5 `[CODE 1696–1712, 1804]` | Giữ nguyên thời lượng. Squash về 3% (0.97 dọc / 1.03 ngang, 90 ms rồi về 1.0 trong 120 ms). Thêm 3–4 hạt "bụi giấy" màu kem, bay ngang 30–60 px, sống 300 ms | Đã gần đạt |
| **Thả sai** | Về chỗ cũ 260 ms `outBackSoft`, lắc 9 px, 5 nửa chu kỳ, 320 ms `[CODE 1468, 1599]` | Về chỗ 220 ms `outBackSoft`. Lắc 6 px, 3 nửa chu kỳ, 240 ms. Âm `deny` | Lắc nhỏ hơn để không có cảm giác bị mắng |
| **Rút bài** | 260 ms `outCubic`, cung 30, lật 300 ms `[CODE 1775–1781, 355]` | Giữ nguyên. Lá vừa rút nảy nhẹ 1.0→1.03→1.0 khi đáp | |
| **Lật lá úp** | Lật 300 ms `inOutCubic` (scaleX) | 260 ms. Ở nửa chặng (scaleX = 0) đổi mặt, nảy 1.0→1.04→1.0 trong 120 ms | |
| **Lật trúng tem vương miện** | Vòng sáng vàng, 14 sao, `open` rate 1.26, rung `[CODE 1764–1772]` | Giữ nguyên. Thêm vương miện nảy riêng 0→1.15→1.0 trong 280 ms. Đổi sao 8 cánh thành hạt lấp lánh tròn mềm | Đây là sự kiện thông tin quan trọng nhất trong level |
| **Tem vào ô (deliver)** | Số đếm 1.5→1.0 trong 300 ms `outBack`, sao 6–18 hạt, chữ "Combo xN" vàng nhạt `[CODE 1736–1755]` | Số đếm 1.3→1.0 trong 240 ms. Hạt 4 + 2×combo, tối đa 12. Chữ combo: nâu đậm trên viên giấy kem, viền 4 px, bay lên 60 px trong 700 ms | Chữ vàng nhạt trên nền mint tương phản kém `[ẢNH 04]` |
| **Đủ bộ, gửi thư** | Lá thu về, phong bì phồng 1.08, niêm sáp, rung màn 9 px, vòng trắng, 26 hạt, bay tới thanh tiến độ 560 ms `[CODE 1833–1910]` | Tổng ≤ 1,4 giây, không chặn tay (đã đạt). **Bỏ rung màn**, thay bằng phong bì nén 0.94 rồi bật 1.0 (bậc mốc). 16 hạt **giấy và tem nhỏ** theo palette. Thanh tiến độ: ô vừa đầy sáng lên 400 ms | Rung màn hợp game arcade hơn game chill |
| **Booster Stamper** | Con dấu rơi 260 ms `inCubic`, rung 7 px `[CODE 886–899]` | Rơi 240 ms, nén 0.92 rồi về 1.0, rung màn ≤ 3 px hoặc bỏ. Âm `stamp` | |
| **Đầu level** | Dải nền tối bán trong suốt, chữ "Level N" 110 px, 380 ms `outBack`, giữ 1,7 giây `[CODE 2432–2453]`. Frame tệ nhất 167 ms lúc chia bài `[ẢNH 02]` | Băng ruy-băng giấy (dùng `ribbon.png`) trượt xuống 320 ms `outBackSoft`, giữ 1,4 giây, có thể chạm để bỏ qua. Chia bài theo cột, mỗi lá trễ 30 ms, 240 ms `outCubic`. Ảnh decode trước khi chia (`img.decode()`) để frame tệ nhất ≤ 50 ms | Dải tối trông giống lớp debug |
| **Thắng** | `win`, confetti 170 mảnh 6 màu sáng, popup đè lên bàn trống, Tem Điểm đóng cộp từng cái 300 ms, xu bay `[CODE 2042–2105][ẢNH 06]` | Xem 4.3 | Đây là khoảnh khắc "xịn" quan trọng nhất |
| **Xu bay về HUD** | 0,75 giây mỗi đồng, trễ 60 ms, ô xu nảy 220 ms `[CODE 541, fx.js coinFly]` | Giữ nguyên. Ô xu phải nằm **trên** lớp scrim khi popup mở. Số đếm chạy dần (count-up) 600 ms thay vì nhảy | Đếm dần là chi tiết "premium" rẻ nhất |
| **Nút bấm** | `:active` scale 0.92 hoặc tụt 5 px `[index.html 133–194]` | Nhấn: 0.94 trong 60 ms. Nhả: 1.0→1.03→1.0 trong 160 ms `outBackSoft` (cần JS, `:active` không làm được overshoot). Âm `click` khi nhả | |
| **Popup** | scale 0.6→1 trong 350 ms `cubic-bezier(.3,1.6,.5,1)`, scrim 250 ms `[index.html 178–182]` | Mở: 0.88→1.0 trong 280 ms `outBackSoft`, scrim 200 ms. Đóng: 1.0→0.94 và mờ trong 160 ms. Overshoot 1.6 hiện tại hơi "nhún" | |
| **Chuyển màn chính và level** | Màn chính mờ dần 350 ms `[index.html 222]` | Mờ 300 ms cộng bàn chơi trượt lên 24 px. Quay về: ngược lại. Không có màn trắng hoặc giật | |
| **Đứng yên (ambient)** | Logo lắc lư 3 giây `[index.html 226]`. Màn chơi tĩnh | Màn chính: hạt bụi trong nắng (6–10 hạt, alpha 0.3, trôi chậm), đuôi mèo hoặc rèm khẽ lay mỗi 6–10 giây. Màn chơi: tĩnh (không làm người lớn tuổi phân tâm) | "Sống" ở màn chính, "yên" ở màn chơi |

### 4.3 Màn thắng dàn dựng (thay popup đè lên bàn trống)

| t (giây) | Diễn biến `[MỤC TIÊU]` |
|---|---|
| 0,0 | Lá cuối vào ô. Combo cuối như bình thường |
| 0,2–0,9 | Các khay đóng lại thành phong bì, bay vào túi thư của Pip ở cuối màn (hoặc khe hộp thư), mỗi khay trễ 80 ms. Âm `whoosh` nhỏ |
| 0,9 | Âm `win`. Hạt giấy và tem nhỏ (40–60 mảnh, palette kem, đỏ air-mail, xanh air-mail, vàng đồng) rơi chậm, có drag, sống 2,5 giây. Không dùng 6 màu neon |
| 1,1 | Bảng thắng trượt lên 280 ms. Tiêu đề trên ruy băng |
| 1,4 / 1,7 / 2,0 | Tem Điểm đóng cộp (đã có) |
| 2,2 | Xu bay về ô xu (đếm dần 600 ms) |
| ≤ 2,6 | Nút "Tiếp tục" bấm được. **Chạm bất kỳ đâu từ 0,9 giây là tua nhanh tới bước này** |

Nút "Tiếp tục" là nút chính, "Nhận x2" là nút phụ (đã có trong R12 của `30-day-plan.md`).

### 4.4 Haptic

**Phát hiện:** `haptic()` dùng `navigator.vibrate` `[CODE audio.js:61–65]`. WebKit (Safari, WKWebView) không hỗ trợ Vibration API, và `mobile/package.json` không có `@capacitor/haptics`. **Bản iOS hiện không rung chút nào**, dù `main.js` gọi `haptic(` ở 17 chỗ.

| Bậc | Khi nào | iOS (Capacitor Haptics) `[MỤC TIÊU]` | Android/web |
|---|---|---|---|
| Thao tác | Chạm lá, thả lá, rút bài | `selectionChanged` | 4–6 ms |
| Tiến độ | Tem vào ô, lật trúng vương miện | `impact LIGHT` | 10 ms |
| Mốc | Gửi thư, Stamper, mở ô phụ | `impact MEDIUM` | [10, 30, 10] |
| Kết thúc | Thắng | `notification SUCCESS` | [20, 60, 20] |
| Từ chối | Thả sai | Không rung | Không rung |

Người lớn tuổi: mặc định bật, nhưng không dùng `HEAVY`. Có công tắc trong Cài đặt (S3).

---

## 5. Đồ hoạ và UI

### 5.1 Chuẩn tham chiếu

| Thuộc tính | Magic Sort / nhóm premium casual | Nguồn |
|---|---|---|
| Palette | Màu nước rực, dễ phân biệt, nền tối dịu để chai nổi | `[WEB 5][WEB 8]`, nền tối `[GIẢ THUYẾT]` |
| Vật liệu | Thuỷ tinh trông thật, chất lỏng có chuyển động | `[WEB 8]` |
| Phân cấp | Gameplay là thứ sáng và tương phản nhất. HUD và nút lùi về sau | `[GIẢ THUYẾT]`, theo nguyên tắc nhất quán thị giác `[WEB 11]` |
| UI motion | Royal Match dùng chuyển động UI nhỏ để báo thông tin (vd. bảng nhiệm vụ làm nổi mục vừa xong) | `[WEB 13]` |
| Nhất quán | Hàng trăm asset trông như thuộc cùng một game | `[WEB 13]` |

### 5.2 Checklist áp cho game mình `[MỤC TIÊU]`

| # | Quy tắc | Hiện tại `[ẢNH]` |
|---|---|---|
| G1 | Lá bài là vùng tương phản cao nhất màn hình | Đạt. Nền mint làm mờ 60%, lá kem viền nâu nổi rõ |
| G2 | Palette UI ≤ 5 màu chủ đạo: kem giấy, nâu gỗ, đỏ air-mail, xanh air-mail, vàng đồng. Xanh mint chỉ dùng cho nền | Gần đạt. Nút xanh dương bóng và vàng bóng kiểu "kẹo" lệch chất giấy và gỗ |
| G3 | 1 kiểu nút chính (vàng đồng hoặc đỏ sáp), 1 kiểu phụ (giấy kem viền nâu) | Chưa. Có 3 kiểu: kẹo xanh, kẹo vàng, đồng xu kem |
| G4 | Không có đường nối, không có vùng trống vô lý | **Chưa.** Có đường nối ngang ở khoảng 18% chiều cao, chỗ mép trên ảnh nền gặp dải màu tường, cửa sổ bị cắt ngang `[ẢNH 01, 03]`. Ở L12, khoảng trống giữa đáy cột bài và hàng rút bài chiếm khoảng 44% chiều cao màn hình `[ẢNH 03]` |
| G5 | Tiền tệ và booster: icon to, số đặt trên viên nền riêng, có nút "+" | Gần đạt. Ô xu có icon và số, chưa có "+". Màn chính chưa có ô xu (đã ghi ở `ui-concept-b.md`) |
| G6 | Trạng thái khoá phân biệt được trong 0,5 giây | Chưa. Level 22–30 trông gần giống level đang mở, chỉ khác level hiện tại `[ẢNH 01]` |
| G7 | Chữ có tương phản ≥ 4.5:1 (WCAG AA) | Chưa với chữ "Combo xN" vàng nhạt trên nền mint `[ẢNH 04]` |
| G8 | Typography: 1 font hiển thị (đã có font tròn đậm), số dùng cùng font, không có chữ mảnh dưới 34 px | Đạt (`older-players-pass.md` mục 3) |
| G9 | Popup không có đường viền mảnh bên trong | Chưa. Đường mảnh trong khung popup vẫn còn (`ui-concept-b.md` #19) `[ẢNH 06]` |
| G10 | Hạt và VFX theo palette và chất liệu của theme (giấy, tem, sáp) | Chưa. Sao 8 cánh và confetti 6 màu neon `[CODE fx.js:84]` |

---

## 6. Âm thanh

### 6.1 Chuẩn tham chiếu

- Magic Sort: nhạc nền êm cộng tiếng nước nhẹ, cảm giác "zen" `[WEB 8][WEB 9]`. Block Out có một bản cập nhật riêng chỉ để thay SFX `[STORE]`: Grand Games coi âm thanh là hạng mục được đầu tư riêng.
- Cảm giác "xịn mà không ồn" `[GIẢ THUYẾT, theo kinh nghiệm thể loại]`:
  - nhạc nền ít nhạc cụ (2–3 lớp), nhịp chậm, nằm dưới SFX;
  - SFX thao tác ngắn, khô, có biến thể cao độ nhỏ để 40 lần mỗi ván không lặp y hệt;
  - âm thưởng dùng chung một thang âm với nhạc;
  - có ducking: nhạc nhỏ đi khi jingle thắng phát.

### 6.2 Hiện trạng

| Hạng mục | Hiện tại | Đánh giá |
|---|---|---|
| SFX | 41 âm tự tổng hợp, chuẩn hoá LUFS theo bậc, thang C ngũ cung, lowpass 4,5 kHz, attack mềm (v3) `[DOC sfx-review.md mục 8]` | **Đạt, có thể tốt hơn chuẩn.** Phương pháp đo kỹ hơn đa số studio nhỏ. Còn thiếu: chưa ai nghe bằng tai trên loa điện thoại |
| Biến thể cao độ | `place` có rate ngẫu nhiên 0.95–1.05. `pick`, `draw`, `flip` không có `[CODE 1710, 1776, 1758]` | Thiếu nhỏ. Rate ngẫu nhiên ±3% cho pick, draw, flip |
| Nhạc nền | **Không có.** Grep `music`/`bgm` trong code ra 0 | **Thiếu lớn nhất về âm thanh** |
| Không khí nền (ambience) | Không có | Thiếu |
| Bật/tắt | 1 công tắc chung `[CODE audio.js:53]` | Thiếu: cần tách nhạc và SFX |

### 6.3 Spec nhạc nền `[MỤC TIÊU]`

| Thuộc tính | Màn chính | Màn chơi |
|---|---|---|
| Nhạc cụ | Hộp nhạc, piano nỉ (felt piano), contrabass pizzicato nhẹ | Piano nỉ hoặc kalimba, pad ấm rất nhỏ |
| Nhịp | 72–80 BPM | 64–72 BPM |
| Thang âm | C trưởng ngũ cung (trùng SFX) | như trái |
| Độ dài vòng lặp | 60–90 giây, nối không có tiếng click (crossfade 2 giây) | như trái |
| Độ to trong game | −32 đến −30 LUFS (dưới âm thao tác khoảng −28,5 từ 2–4 dB) | như trái |
| Ambience | Tiếng chim xa, đồng hồ quả lắc rất nhỏ, −38 LUFS | Tắt hoặc chỉ room tone −42 LUFS |
| Ducking | Hạ 6 dB trong 300 ms khi phát `win`, `chapter`, `feature`. Trả lại trong 1,5 giây | như trái |

Cách làm: mở rộng `tools/synth_sfx.py` hoặc thêm `tools/synth_music.py` dùng lại các bộ tổng hợp đã có (mộc cầm, hộp nhạc, chuông FM), sinh giai điệu theo luật ngũ cung có seed. Nếu kết quả tổng hợp nghe "máy", phương án dự phòng là nhạc royalty-free có license thương mại (PO chốt chi phí).

---

## 7. So sánh với game mình, xếp theo mức ảnh hưởng tới cảm nhận chất lượng

| Hạng | Hạng mục | Grand-tier | Mình hiện tại | Ảnh hưởng | Vòng |
|---|---|---|---|---|---|
| 1 | Nhạc nền và ambience | Có, êm `[WEB 8]` | Không có | **Cao.** Thiếu nhạc làm cả game có cảm giác "prototype" | P10 |
| 2 | Haptic trên iPhone | Có `[GIẢ THUYẾT]` | Bằng 0 trên iOS (WebKit không có `navigator.vibrate`) | **Cao** trên nền tảng phát hành | P1 |
| 3 | Đường nối nền và khoảng trống giữa màn | Không có | Có đường nối ở khoảng 18% chiều cao. Khoảng trống khoảng 44% ở level ít lá | **Cao.** Thấy ở mọi ảnh chụp và store screenshot | P2, P3 |
| 4 | Màn thắng | Màn riêng, dàn dựng | Popup đè lên bàn trống, nút quảng cáo đứng đầu | **Cao.** Khoảnh khắc được nhớ nhất mỗi level | P6 |
| 5 | Màn chính | Sống, rõ trạng thái | Trống ở giữa, không ô xu, không cài đặt, level khoá khó phân biệt, không ambient | **TB–Cao.** Ấn tượng đầu và mỗi lần quay lại | P9 |
| 6 | VFX theo theme | Hạt và hiệu ứng ăn theo chất liệu | Sao 8 cánh và confetti neon chung chung | TB | P5 |
| 7 | Đầu level | Mượt | Dải tối kiểu debug, frame 167 ms lúc chia | TB | P7 |
| 8 | Ngôn ngữ nút | Một hệ | 3 kiểu nút lẫn lộn | TB | P11 |
| 9 | Phản hồi chạm tức thì | Có | Chỉ phản hồi khi kéo quá 12 px | TB (người chơi không gọi tên được nhưng cảm thấy) | P4 |
| 10 | Popup, chuyển màn, nút bấm | Overshoot nhỏ, đồng bộ | Overshoot lớn (1.6), không đồng bộ | Thấp–TB | P8 |
| 11 | Tương phản chữ combo | | Vàng nhạt trên mint | Thấp–TB | P5 |
| 12 | LiveOps, event, daily | 4–6 template, nội dung mỗi tuần | Chưa có (M3, M4 trong `30-day-plan.md`) | Cao cho retention, TB cho cảm nhận chất lượng | Mục 9 |

**Những gì đã đạt chuẩn:**
- Bộ SFX (đo loudness, cùng thang âm, mềm cho người lớn tuổi).
- Ăn mừng không chặn tay: `onDown` chỉ chặn khi `busyInput`, không chặn khi `completing` `[CODE 1327]`.
- Phân cấp phản hồi 4 bậc đã có khung (place < deliver < complete < win).
- 60 fps khi chơi `[ẢNH 03–04]`, có chế độ `lite` cho máy yếu, tôn trọng `prefers-reduced-motion`.
- Tem phân biệt bằng hình chứ không chỉ bằng màu. Đây là lợi thế với người lớn tuổi so với water sort chỉ dựa vào màu `[GIẢ THUYẾT]`.
- Không có lives, không có interstitial: tránh đúng 2 phàn nàn lớn nhất của Magic Sort `[WEB 7]`.

---

## 8. Điều chỉnh cho người lớn tuổi

| Của Grand Games | Giữ / Đổi | Cách làm cho mình |
|---|---|---|
| Animation lõi ngắn, phản hồi tức thì | **Giữ nguyên tốc độ** | Người lớn tuổi cần thời gian đọc, không cần thao tác chậm. Độ trễ làm họ tưởng chạm hụt |
| Ăn mừng | **Chậm hơn khoảng 1,2 lần, ít hạt hơn** | Hạt ≤ 60% số hiện tại, rơi chậm (drag cao). Luôn tua được bằng 1 chạm |
| Rung màn (screen shake) | **Bỏ hoặc ≤ 3 px** | Thay bằng nén và bật của chính vật thể |
| Haptic | Giữ, **nhẹ hơn** | Không dùng HEAVY. Có công tắc |
| Overshoot (outBack) | Giữ, **biên độ nhỏ** | `outBackSoft` (c1 = 1.1) thay cho `outBack` (1.70158) ở UI |
| Nhạc | Giữ, **chậm và nhỏ hơn** | 64–80 BPM, không có trống |
| Độ khó thích ứng (bỏ 1 màu sau khi thua ở L26) | **Giữ, nhân rộng** | Thua lần đầu ở level thường: lượt sau +5 moves hoặc 1 lá ngửa thêm. Kết hợp "Thư đến trễ" (M2) |
| Event chuỗi thắng mất trắng khi thua (Broom Streak, Sky Jump) | **Đổi** | Event tích luỹ không mất: thua không lùi, chỉ không tiến |
| Leaderboard, Jetpack Race, đua | **Bỏ** ở D1–D30 | Nếu cần social, dùng mục tiêu chung của thị trấn (co-op ẩn danh), sau D30 |
| Lives, Endless Portal | **Bỏ** | Không có lives (đã chốt trong Won't của `30-day-plan.md`) |
| Quảng cáo từ L22 | PO chốt | Đề xuất: không có interstitial. Rewarded do người chơi chủ động |
| Nội dung mới mỗi tuần | **Giữ tinh thần, nhịp chậm hơn** | 1 chương (20 level, 6 decor) mỗi 2 tuần, giống nhịp area của Block Out |
| Cơ chế mới "đến quá muộn" (phàn nàn) | **Rút kinh nghiệm** | Mỗi chương có 1 điểm mới nhỏ (chủ đề, decor, hoặc 1 cơ chế) |

---

## 9. Event và tính năng nên thêm vào kế hoạch 30 ngày

Bổ sung cho M1–M9 và S1–S7 trong `30-day-plan.md`. **PO chốt thứ tự và KPI.** Tôi đề xuất cơ chế và lý do.

| # | Đề xuất | Tương đương Grand Games | Vì sao vui (người chơi cảm thấy gì) | Quy tắc chính | Mở ở | Đo bằng |
|---|---|---|---|---|---|---|
| E1 | **Tuyến đưa thư** (Mail Route), event milestone không mất | Broom Streak | "Hôm nay mình đi thêm được 3 trạm." Tiến bộ thấy được mà không sợ mất | Tuyến 10 trạm. Mỗi level thắng đi 1 trạm, 3 Tem Điểm đi 2 trạm. Thua không lùi. Trạm 3, 6, 10 có quà (Gợi ý, xu, món decor nhỏ). Tuyến kéo dài 7 ngày rồi đổi cảnh (bến cảng, đồi chè...) | L12 | `route_step`, % hoàn thành tuyến, D7 nhóm có tham gia và nhóm không |
| E2 | **Tem theo mùa** (collection event) | Collection event (Car Match), nguyên liệu (cauldron) | Cảm giác "sưu tầm", nối vào album sẵn có | 1 tem mùa (vd. lá phong) xuất hiện ngẫu nhiên trong 1/3 số level, như lá thường của chủ đề sẵn có, không thêm chủ đề mới. Gom 12 thì nhận 1 trang album và 1 decor hiếm. Chu kỳ 14 ngày | L20 | `season_stamp_get`, % gom đủ |
| E3 | **Cuối tuần xu đôi** | Coin Rush | Chút vui nhỏ, không bắt buộc | Thứ Bảy và Chủ nhật: xu thưởng level ×2. Không đếm ngược trên màn hình, chỉ có 1 dải băng "Cuối tuần vui vẻ" | L8 | Số phiên cuối tuần so với ngày thường |
| E4 | **Nhịp nội dung 2 tuần** | Area mới mỗi 2 tuần (Block Out) | "Thị trấn có khu mới" | Mỗi 2 tuần: 1 chương mới (20 level, 6 decor, 1 teaser). Đây là kế hoạch sản xuất, không phải tính năng | | `chapter_start` trong 3 ngày sau khi phát hành |
| E5 | **Giới hạn màn chính** | "Vừa đủ" | Không bị choáng | Tối đa 5 điểm chạm: Play, Thư hôm nay, 1 event (E1 hoặc E2), Album, Trang trí. Event thứ hai thì gộp vào 1 icon "Bảng tin bưu điện" | | Ảnh chụp màn chính, tỉ lệ chạm từng nút |

**Không đưa vào:** leaderboard, race, teams, chuỗi thắng bị reset, lives, gói "vô hạn" theo giờ, đồng hồ đếm ngược.

---

## 10. Backlog polish theo vòng

Mỗi vòng khoảng 1–2 giờ dev. Ký hiệu: **[ART]** cần vẽ mới qua ChatGPT (quy trình `art-redo-chatgpt.md`, cắt bằng `tools/art_slice.py`), **[SFX]** cần âm mới (`tools/synth_sfx.py` hoặc tool nhạc mới). Video 60fps quay bằng Chrome DevTools hoặc QuickTime trên máy thật, đếm frame bằng `ffmpeg -vf "select=..."`.

| Vòng | Nội dung | Art / SFX | Acceptance criteria (kiểm chứng được) |
|---|---|---|---|
| **P0** | Đo chuẩn thật: quay Magic Sort và Block Out trên iPhone 60fps (L1–L5, 1 lần thắng, 1 lần thua, màn chính, 1 event). Agent tách frame và điền bảng thời lượng thật vào mục 4.2 | Người dùng quay | Bảng có ≥ 12 khoảnh khắc, mỗi cái có số frame. Ảnh màn chính có đếm số icon event. Cập nhật cột "Mục tiêu" nếu lệch > 30% |
| **P1** (đã làm 2026-10-15, chờ thử trên iPhone) | Haptic thật trên iOS: thêm `@capacitor/haptics`. `haptic()` nhận bậc (`tap`, `progress`, `milestone`, `success`) thay cho mảng ms, map như mục 4.4 | Không | Trên iPhone (TestFlight): video có tiếng rung ở 5 khoảnh khắc. Web/Android không đổi hành vi. Grep: không còn gọi `haptic([` bằng mảng số trong `main.js` |
| **P2** | Bố cục dọc: chia khoảng trống thừa giữa HUD, khay, cột, hàng rút khi level có ít lá (đẩy khay và cột xuống, hoặc phóng lá theo P1-7 của `ui-concept-b.md`) | Không | Ảnh 375×812 và 390×844 ở L3, L10, L12: khoảng trống giữa đáy cột lúc chia và hàng rút ≤ 25% chiều cao màn. 13/13 kịch bản kéo thả vẫn qua |
| **P3** | Nền cao 1080×2400 cho `bg_game` và `bg_hard`, bỏ dải màu tường | **[ART]** 2 ảnh nền | Ảnh ở 16:9, 19.5:9, 20:9: không có đường nối. Kiểm bằng script: chênh lệch trung bình giữa 2 hàng pixel liền nhau ở mọi vị trí < 6/255 trong vùng ngoài lá bài |
| **P4** | Motion token và cảm giác cầm lá: gom thời lượng và easing vào hằng `MOTION` trong `fx.js`. Phản hồi ngay khi chạm (1.04 trong 80 ms), lá nghiêng theo vận tốc ±4°, lắc khi thả sai còn 6 px và 240 ms | Không | Video 60fps: phản hồi ở frame đầu sau pointerdown. Thả sai: 14–15 frame. Grep `dur: [0-9]` trong `main.js` (hiện 41 chỗ) giảm ≥ 70% |
| **P5** | VFX theo theme: thay sao 8 cánh và confetti neon bằng sprite giấy, tem nhỏ, phong bì nhỏ, lấp lánh tròn mềm. Chữ combo nâu đậm trên viên kem. Bỏ rung màn ở gửi thư, Stamper và banner level khó | **[ART]** 1 lưới 3×3 sprite hạt | Ảnh chụp lúc gửi thư: 0 hạt màu ngoài palette 5 màu (script đếm màu trên canvas FX). Tương phản chữ combo ≥ 4.5:1. Grep: không còn `shake(` lớn hơn 3 |
| **P6** | Màn thắng dàn dựng theo 4.3: khay thành phong bì bay vào túi thư, confetti giấy, bảng trượt lên, xu đếm dần, chạm để tua, "Tiếp tục" là nút chính | **[ART]** túi thư hoặc khe hộp thư (1 asset). SFX dùng lại `win`, `stamp`, `coins` | Video: nút bấm được ở ≤ 2,6 giây, chạm 1 lần ở 1,0 giây thì nhảy tới bước cuối ≤ 300 ms. Ô xu thấy được trên scrim. Ảnh L3 và L12 |
| **P7** | Đầu level: banner ruy băng thay dải tối, chạm để bỏ qua, chia bài theo cột trễ 30 ms, decode ảnh trước khi chia | Không (dùng `ribbon.png`) | Debug FPS: frame tệ nhất khi chia bài ≤ 50 ms (Chrome, CPU throttle 4×). Ảnh banner. Bỏ qua bằng chạm ≤ 200 ms |
| **P8** | Popup, chuyển màn, nút bấm: popup 0.88→1 trong 280 ms `outBackSoft`, đóng 160 ms. Nút nhả có overshoot 1.03. Chuyển màn chính và level 300 ms kèm trượt 24 px | Không | Video: popup mở 16–17 frame, đóng 9–10 frame. Không có frame trắng khi chuyển màn |
| **P9** | Màn chính sống: ô xu và nút Cài đặt, biển tên chương, level khoá có ổ khoá và mờ 40%, level hiện tại có mũi tên hoặc Pip, hạt bụi trong nắng, lấp khoảng trống giữa | **[ART]** biển tên chương, icon Cài đặt, Pip tư thế đứng chờ (tuỳ chọn) | Ảnh 390×844: phân biệt khoá và mở trong test 5 giây với 3 người. ≤ 5 điểm chạm chính. Không còn vùng trống > 20% chiều cao |
| **P10** (đã làm 2026-10-15, chờ người dùng nghe duyệt) | Nhạc nền 2 vòng lặp và ambience theo 6.3. Công tắc nhạc và SFX riêng. Ducking. Rate ngẫu nhiên ±3% cho pick, draw, flip | **[SFX]** tool nhạc mới (`tools/synth_music.py`) hoặc mở rộng `synth_sfx.py` | LUFS nhạc trong game −32 đến −30. Điểm nối vòng lặp: không có click (đỉnh sai biệt < −50 dB). 2 công tắc lưu vào localStorage. Trang `sfx-preview.html` có nút nghe nhạc. Người dùng nghe trên loa điện thoại và duyệt |
| **P11** | Ngôn ngữ nút thống nhất: 1 nút chính (vàng đồng hoặc đỏ sáp), 1 nút phụ (giấy kem viền nâu), 1 nút tắt | **[ART]** 3 trạng thái × 2 kiểu nút, 9-slice | Ảnh màn chính, màn thắng, bảng hết nước: chỉ còn 2 kiểu nút. Không còn `btn_blue.png` trong CSS |
| **P12** | Playtest cảm nhận (mục 1, dòng cuối) sau P1–P11 | Không | 5 người lớn tuổi, điểm "trông chỉn chu" ≥ 5,5/7, kém Magic Sort ≤ 0,5 |

**Thứ tự đề xuất:** P0 (song song), P1, P2, P4, P7, P8 (không cần art, làm ngay). Sau đó P5, P6, P9, P11 (gom art thành 1 đợt ChatGPT). P3 vào cùng đợt art. P10 làm riêng vì cần người dùng nghe duyệt.

### Kết quả P1 và P10 (2026-10-15)

**P1. Haptic** `[CODE]`
- Thêm `@capacitor/haptics` **8.0.2** vào `mobile/` (Capacitor core/ios 8.5.3), `npx cap sync ios` đưa plugin vào `CapApp-SPM/Package.swift`. Build `xcodebuild` (scheme App, generic/platform=iOS) thành công.
- Module mới `prototype/stamp/src/haptics.js`, 4 bậc như mục 4.4: `tap` = selectionChanged, `progress` = impact LIGHT, `milestone` = impact MEDIUM, `success` = notification SUCCESS, `deny` = không rung. Không dùng HEAVY. Gọi plugin qua `window.Capacitor.Plugins.Haptics` (bridge native tự tiêm, không cần bundler). Trên web có `navigator.vibrate` (Android) thì rung như cũ; Safari/iOS web không làm gì. Công tắc lưu ở `localStorage['ss_haptics']` (chưa có nút trong UI, chờ S3).
- `main.js` chỉ đổi dòng import. 17 chỗ gọi `haptic(...)` giữ nguyên tham số ms cũ (Feature Dev đang sửa `main.js` song song); `haptics.js` quy mẫu ms về bậc: 4–8 ms = tap; 10–20 ms và `[8,30,8]` = progress; `[10,30,10]`, `[16,40,16]`, `[20,40,20]`, `[15,40,15]` = milestone; `[20,60,20,60,40]` = success; `[30,50,30]` (hết nước) = deny. Thả sai (`haptic(4)` trong `rejectTap`) đang trùng mẫu với rút bài nên ra tap (rất nhẹ). Còn nợ tiêu chí "không còn `haptic([`" của P1: đổi sang tên bậc khi `main.js` rảnh.
- Kiểm thử bằng Capacitor giả lập trong Chrome headless: 15 mẫu ra đúng lời gọi plugin, tắt công tắc thì không gọi. Chưa thử trên iPhone thật.

**P10. Nhạc nền và không khí** `[CODE]`
- `tools/synth_music.py` (dùng lại bộ tổng hợp và bộ đo của `synth_sfx.py`) tạo `prototype/stamp/music/`: `home.mp3` (piano nỉ, hộp nhạc, contrabass gảy; 76 BPM, vòng 75,8 s, 608 KB), `play.mp3` (piano nỉ thưa, hộp nhạc, nền ấm nhỏ; 66 BPM, vòng 72,7 s, 585 KB), `ambience.mp3` (room tone, giấy sột soạt thưa, đồng hồ quả lắc rất nhỏ, chim xa; vòng 40 s, 247 KB). Thang C ngũ cung, hợp âm chỉ dùng nốt ngũ cung, không trống, highpass 120 Hz, lowpass 4 kHz, nén mềm. Mono 22,05 kHz.
- Độ to trong game: nhạc màn chính −31, màn chơi −31,5 LUFS; ambience −38 (màn chính), −42 (màn chơi). Gain nằm trong `music/meta.json`.
- Vòng lặp: render dài rồi gập đuôi về đầu nên tín hiệu tuần hoàn; file có thêm 2 s đầu ở cuối, `audio.js` crossfade 2 s giữa 2 bản. Đo trong Chrome (OfflineAudioContext): bước nhảy mẫu lớn nhất ở điểm nối nhỏ hơn ở phần còn lại của bản, tức không có click.
- `audio.js`: nhạc bắt đầu sau lần chạm đầu tiên (fade in 2,5–3 s), đổi bản khi chuyển màn (`setMusicScene('home'|'play')`, crossfade 2,5 s), ducking −6 dB khi `win`, `chapter`, `feature` và −4 dB khi `complete`, `lose` (hạ 300 ms, trả lại 1,5 s), tạm dừng khi tab hoặc app bị ẩn (`visibilitychange`, sự kiện `pause`/`resume` của Capacitor). Chỉ giải mã bản đang phát, nhả bộ nhớ bản đã tắt. Rate ngẫu nhiên ±3% cho `pick`, `draw`, `flip`.
- Công tắc "Nhạc nền: Bật/Tắt" (EN "Music: On/Off") trong bảng Tạm dừng, riêng với Âm thanh, lưu `localStorage['ss_music']`, mặc định bật. Màn chính chưa có nút Cài đặt (P9).
- `tools/deploy_web.sh` copy thêm `music/` và đổi tên theo mã băm như `sfx/`.
- Nghe thử: `sfx-preview.html` có mục "Nhạc nền và không khí (P10)", phát đúng độ to trong game, có thể bấm SFX chồng lên.
- **Chưa xong tiêu chí:** người dùng chưa nghe duyệt trên loa điện thoại. Phổ nhạc màn chơi dồn nhiều ở 120–300 Hz (khoảng 70% năng lượng), trên loa điện thoại có thể nghe mỏng: nếu cần, nâng quãng tay trái lên 1 quãng 8 trong `song_play()`.

---

## 11. Câu hỏi còn mở và dữ liệu cần thêm

1. **Màn chính Magic Sort có bao nhiêu icon event cùng lúc, ở level 30, 100, 300?** Cần ảnh chụp thật (P0). Không nguồn chữ nào ghi.
2. Thông số animation thật của Magic Sort (pour, chai đầy, thắng): cần video 60fps (P0).
3. Level mở từng tính năng của Magic Sort (daily, event, cauldron, leaderboard): bài level deconstruction 1–300 của Gamigion có, nhưng nằm sau paywall `[WEB 14]`. Đề xuất PO cân nhắc mua 1 tháng.
4. Magic Sort có Teams không: nhãn tuổi gợi ý có chat, chưa xác nhận.
5. Nhạc tự tổng hợp có đủ "xịn" không, hay cần nhạc có license: quyết định chi phí thuộc PO.
6. E1–E3 có đủ để đo D7 trong 30 ngày không, hay chỉ cần M3, M4 trước: PO chốt.
7. Người lớn tuổi có thích haptic không: đo bằng tỉ lệ tắt haptic trong Cài đặt sau khi có S3.

---

## 12. Nguồn

1. [Mobidictum / Invest in Türkiye: Grand Games raises USD 30 million Series A](https://f.invest.gov.tr/en/News/News-from-Turkey/Pages/grand-games-raises-usd-30-million-series-a.aspx)
2. [Deconstructor of Fun: Sort Puzzles, How a New Subgenre is Born (2/2026)](https://www.deconstructoroffun.com/blog/2026/2/6/sort-puzzles-how-a-new-subgenre-is-born)
3. [Naavik: Grand Games and Leveling Up Mobile Casual Puzzle](https://naavik.co/digest/why-peak-games-investors-backed-grand-games/)
4. [Balderton: Grand Games raises $30M Series A](https://balderton.com/?p=10975), [TechCrunch](https://techcrunch.com/2025/01/09/grand-games-the-turkish-gaming-startup-behind-pouring-game-magic-sort-drinks-up-30m/)
5. [Gamigion: Magic Sort Analysis, Grand Games' New Treasure](https://www.gamigion.com/magic/)
6. [Gamigion: Game Deconstruction, Magic Sort by Grand Games](https://www.gamigion.com/game-deconstruction-magic-sort-by-grand-games/)
7. [Glotier: Magic Sort! review analysis (150 review Google Play, 7/2026)](https://glotier.com/games/magic-sort)
8. [Industry.co.id: Magic Sort, game puzzle sorting warna yang bikin rileks](https://www.industry.co.id/read/155589/magic-sort-game-puzzle-sorting-warna-yang-bikin-rileks-tips-lengkap-semua-level)
9. [Mobidictum: Grand Games rises to Top 5 among Turkish publishers](https://mobidictum.com/grand-games-rises-to-top-5-among-turkish-mobile-game-publishers-in-less-than-a-year/)
10. [PocketGamer.biz: Grand Games raises $70m Series B](https://www.pocketgamer.biz/grand-games-raises-70m-series-b-to-scale-hybrid-casual-gaming/) (không truy cập được, chỉ thấy tiêu đề)
11. [Naavik: Why Dream Games' success is a challenge to replicate](https://naavik.co/digest/why-dream-games-success-is-a-challenge-to-replicate/)
12. Video YouTube (chỉ dùng tiêu đề): [Jetpack Race](https://www.youtube.com/watch?v=4HxQ_0YPfvY), [Broom Streak](https://www.youtube.com/watch?v=Cp41UN1xKjc), [Coin Rush](https://www.youtube.com/watch?v=6tixkPAPBzQ), [Lives](https://www.youtube.com/watch?v=sQ1n3iMcckc), [Hidden Color Levels](https://www.youtube.com/watch?v=a2-Kyi5ehEI), [Stone Wrapped Tubes](https://www.youtube.com/watch?v=ultq4OeioPc), [Endless Portal](https://www.youtube.com/watch?v=5PyYQM850_A)
13. [Funovus: Royal Match Dominates Match-3, What Can ALL Designers Learn?](https://funovus.com/blogs/royal-match-dominates-match-3-what-can-all-designers-learn)
14. [Gamigion: Magic Sort Level Deconstruction (1-300)](https://gamigion.substack.com/p/magic-sort-level-deconstruction-1) (paywall)
15. App Store: [Magic Sort!](https://apps.apple.com/us/app/magic-sort/id6499209744), [Block Out!](https://apps.apple.com/us/app/block-out-color-sort-puzzle/id6752672568), [Car Match](https://apps.apple.com/us/app/car-match-traffic-puzzle/id6504421808)
