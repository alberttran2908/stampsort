# Review game design: prototype 10 level (Stamp Sort / Little Post Office)

**Ngày:** 2026-10-10 · **Người review:** game-designer agent · **Phạm vi:** art direction, level design và độ khó, design tổng thể (core loop, FTUE, booster, economy, theme, mốc UA) của build hiện tại `prototype/stamp/`.

**Nhãn nguồn dùng trong tài liệu**

| Nhãn | Nghĩa |
|---|---|
| `[SS 0x]` | Ảnh chụp build hiện tại `research/gd-review/0x_*.jpg` (iPhone 375×812, lưu ở tỉ lệ 0.6) |
| `[UI 0x]` | Popup của vòng UI trước, `research/ui-review/0x_*.jpg|png` |
| `[ART all_n]` | Bảng art thật đang dùng `research/art-redo/all_1..3.jpg`. Map chỉ số art theo `research/art-redo/used_arts.json` và `levels.js` |
| `[DATA]` | `prototype/stamp/difficulty-report.json` (40 ván mỗi mức, người chơi mô phỏng không nhìn trộm) |
| `[DESIGN]` | Mảng `DESIGN` trong `tools/gen_proto_levels.mjs` |
| `[CODE file:dòng]` | Code prototype |
| `[VIDEO]`, `[APK-LV]` | Như `teardown-video-apk-0.9.5.md` |
| `[GIẢ THUYẾT]` | Suy luận của tôi, cần playtest hoặc đo |

---

## 0. Tóm tắt cho người bận

1. **Core loop và gamefeel đã tốt.** Người chơi mô phỏng mức "giỏi" khớp với video gốc gần như từng level, sai lệch chỉ 1–3 moves `[DATA]` so với `[VIDEO]`. Juice cho lúc gửi phong bì đã đủ. Prototype đạt mục tiêu "dựng lại baseline ABI".
2. **Có 3 điểm dễ làm người chơi bỏ game nhất trong 10 level:**
   - **L5 (mốc UA 1).** 65–80% ván rơi vào kẹt cứng chứ không phải hết moves `[DATA]`. Khi kẹt, game tặng một **Tem Vàng mà người chơi chưa được dạy** (Joker mở ở L9).
   - **L7.** Có 4 cặp tem dễ nhầm giữa các chủ đề. Đây cũng là level dạy Stamper. Người mới chơi chỉ thắng 55% `[DATA]`.
   - **Hệ thống sao.** Với luật hiện tại, gần như không ai đạt 3 sao ở L2–L8, kể cả người chơi giỏi. Vì vậy dòng "More moves left = more ★" hiện ở hầu hết các level.
3. **Lá bài quá nhỏ so với concept B đã duyệt.** Khoảng 20–25% chiều cao màn hình dưới tableau bị bỏ trống `[SS 02–05]`. Đây là đòn bẩy readability rẻ nhất.
4. **Theme "Little Post Office" mới chỉ nằm ở lớp vỏ UI** (viền air-mail, nền, khay gỗ). Gameplay và nội dung chưa có bưu điện, cư dân, mèo Pip hay lời nhắn. Chủ đề tem toàn đồ vật chung chung kiểu ABI.
5. **Công cụ đo đang lệch nhau.** Generator chọn seed bằng solver *nhìn được lá úp* (`sampleMovesNeeded`), còn báo cáo độ khó dùng người chơi *không nhìn trộm* (`sampleHidden`). Hệ quả: `levels.js` ghi L5 `winRateSim 0.93`, trong khi `[DATA]` cho thấy người chơi phổ thông chỉ thắng 13%. Phải sửa chỗ này trước khi tune bất cứ level nào.

---

## 1. Visual / art direction

### 1.1 Độ đồng bộ style

| Thành phần | Đánh giá | Bằng chứng |
|---|---|---|
| Tem (310 art) | **Đồng bộ tốt.** Viền nâu ấm, chibi, một lớp bóng, kiểu sticker. Đọc như một bộ | `[ART all_1..3]` |
| Icon chủ đề (59) | Đồng bộ: line-art kem viền nâu, một màu nhấn. Đọc tốt trên lá vương miện ở L1 (con mèo) | `[SS 01]`, `[ART]` cột đầu |
| Khung lá, khay, HUD, popup | Đồng bộ với concept B: răng cưa tem, viền air-mail, gỗ, đồng | `[SS 01–05]`, `[UI 00]` |
| **Ngoại lệ style** | (a) **Fruit và Ball có mặt cười kawaii**, các chủ đề khác không có. Quả cam cười là hình đầu tiên người chơi thấy ở L1. Điều này trái pillar P3 "cute ấm, không trẻ con / không kawaii quá đà" (`concept-little-post-office.md` mục 1). (b) **Notes** là ký hiệu phẳng màu vàng (♭ # ♮), không phải đồ vật, trông giống icon UI. (c) **Sculpture** trắng đơn sắc trên nền kem, độ tương phản thấp. (d) **Raw meat** (thịt bò sống, phi lê cá hồi) và **Sashimi** vẽ kiểu thực phẩm thật, lệch tone cozy. (e) **Ship** có tàu chiến (lệch tone) | `[ART all_1]` hàng Fruit, Ball; `[ART all_2]` hàng Notes; `[ART all_3]` hàng Raw meat, Sculpture |
| Stamper icon | Cụm đỏ-xanh-vàng trông như đồ chơi hoặc cần điều khiển, không giống con dấu. Concept B vẽ con dấu gỗ, dễ hiểu hơn | `[SS 04]` vs `[UI 00]` |
| Màu nền lá (6 màu pastel) | **Gán theo `card.id`, nên ngẫu nhiên** (`faceIndex(card.id)`, `[CODE main.js:246]`). Màu đang là nhiễu, chưa phải tín hiệu. `level-design-rules.md` mục 5 định nghĩa màu mực theo chủ đề ở tier đầu | `[SS 02]`: hai tem Glasses có hai nền khác màu |

### 1.2 Readability ở cỡ lá trên điện thoại

- Lá hiện khoảng 57×74 pt, art khoảng 43 pt. Ở level 4 cột, tableau kết thúc ở khoảng y=640/974, cách kệ gỗ khoảng 160 px (ảnh 0.6), tức **khoảng 20% chiều cao trống** `[SS 02, 04]`. Concept B đã duyệt có lá rộng khoảng 23% màn hình, tức to hơn khoảng 30–35% `[UI 00]`. UI review đã ghi lại việc này nhưng **chưa làm** (`ui-concept-b.md` mục 3 #7).
- Những chủ đề chịu thiệt nhất khi lá nhỏ, vì chi tiết mảnh hoặc các tem quá giống nhau:

| Chủ đề | Vấn đề ở cỡ 43 pt |
|---|---|
| Notes | ♭ và ♮ gần như giống nhau, khó đọc ra là "nhạc" |
| Sculpture | Tượng trắng trên nền kem, mất viền |
| Tea | 5 ấm trà gần như y hệt nhau. Vẫn cùng chủ đề nên không gây nhầm, nhưng nhàm |
| Planet | Hai hành tinh cam gần như trùng nhau |
| Sashimi, Raw meat | Lát cá hoặc thịt trên đĩa thành mảng màu, khó đọc |
| Balloon | Bóng hình con sâu, bóng số "11" (playtest trước đã báo "trông như con sâu", `ftue-copy.md` mục 6 #6) |

### 1.3 Nhầm lẫn giữa các chủ đề **trong cùng level**

Tôi đối chiếu đúng các art được chọn cho từng level (`levels.js`) với bảng art. Mức độ là `[GIẢ THUYẾT]`, cần test G3 (`level-design-rules.md` mục 5: nhầm > 15% thì không được xếp chung level trước tier 3).

| Level | Cặp dễ nhầm (tem → chủ đề người chơi dễ đoán nhầm) | Mức |
|---|---|---|
| L3 | Candy **kẹo bông** (khối hồng trên que) ↔ Balloon (bóng tim hồng, bóng tròn có dây). Candy **kẹo mút tròn** ↔ Balloon | Trung |
| L4 | Leaf (lá tre, lá sồi) ↔ Flower: nhẹ | Thấp |
| L5 | Truck có **xe buýt 2 tầng** ↔ Train (đều là phương tiện công cộng; xe buýt cũng không phải xe tải). Kite có **diều cá mập** trông như con cá mập vì dây diều gần như không thấy (`[SS 03]`: ô Kite hiện tem cá mập) | Trung–Cao |
| L6 | Sauce (**chai** tương cà đỏ, mù tạt vàng, lọ xì dầu) ↔ Soft drink (**chai** cola đỏ, chai cam, chai xanh) | Cao |
| **L7** | (1) Zoo **hải cẩu** ↔ Sea life. (2) Float **phao cá mập** ↔ Sea life (cá voi sát thủ). (3) Float **phao chim cánh cụt**, **phao hồng hạc** ↔ Zoo. (4) Glasses **kính lặn có ống thở** ↔ Float (đồ đi biển). Thêm: Zoo có **chó đốm** và **bò sữa**, không phải thú sở thú. **L7 dùng đủ cả 6/6 tem Float, 6/6 Sea life, 8/8 Glasses**, nên không có biến thể nào tránh được những cặp này | **Rất cao** |
| L8 | Grilled **xiên nướng** ↔ Desserts **dango** (cũng là xiên). Grilled **bít tết** ↔ Raw meat **bít tết, sườn**. Icon Raw meat là **đùi giăm bông** trông như đồ đã nấu chín. Cocktail ↔ Desserts **parfait** (đều đựng trong ly) | Cao |
| L9 | Balloon **bóng hình sư tử** ↔ Zoo. Water Plants ↔ Gardening (chậu hoa, gói hạt có mầm). Gardening **xẻng** ↔ Pet Care **bàn chải** (đều cán gỗ) | Trung–Cao |
| L10 | Coffee **frappé kem** ↔ Cake **cupcake**: nhẹ | Thấp |
| L1, L2 | Không đáng kể | – |

**Nhầm lẫn giữa các level** (dạy một cách hiểu rồi lại phủ định ở level sau):
- Rùa: Pets ở L4, Sea life ở L7.
- Hươu cao cổ, nai: Hoofed ở L3, Zoo ở L7 và L9.
- Kem que: Ice cream ở L5, Desserts ở L8.
- Bắp: Vegetable ở L6, Grilled ở L8.
- Cá hồi: Raw meat ở L8, Sashimi ở L9, Sushi ở L10.
- Sen: Flower ở L4, icon Water Plants ở L9.

Đề xuất quy tắc: **một vật chỉ thuộc một chủ đề trong toàn chapter**.

**Nhận định:** nhầm lẫn kiểu này trái pillar P1 "Sort, đừng đoán". Hiện mình chỉ đang chép đúng nhầm lẫn của bản gốc vì tem bám theo lưới cũ (`art-redo-chatgpt.md` mục 5). Kéo sai không tốn move, nên chi phí là thời gian và bực bội, không phải thua. Tuy vậy, L7 vừa có 4 cặp nhầm, vừa có moves chặt, vừa dạy booster mới. Đây là chồng ba áp lực ở cùng một chỗ.

### 1.4 Icon chủ đề yếu hoặc không khớp nội dung

| Chủ đề | Icon hiện tại | Vấn đề | Sửa |
|---|---|---|---|
| Phone | Điện thoại thông minh | Không tem nào là smartphone. Cả 4 tem là điện thoại quay số, Nokia, nắp gập. Thế giới Wren Hollow cũng "không smartphone" (`concept` mục 3.1) | Icon điện thoại quay số |
| Insect | Bướm | Không có tem bướm (bọ cánh cứng, bọ rùa, bọ ngựa) | Icon bọ rùa, hoặc thêm 1 tem bướm |
| Glasses | Kính cận | Không có tem kính cận (kính râm, kính trượt tuyết, kính lặn, kính một mắt) | Thêm 2 tem kính cận để thay kính lặn và kính trượt tuyết |
| Hoofed | Móng ngựa | Ký hiệu trừu tượng, trái quy tắc "vật tiêu biểu nhất" (`art-redo-chatgpt.md` mục 1) | Đầu ngựa. Tên EN "Farm animals" dễ hiểu hơn "Hoofed animals" |
| Float | Phao tròn cứu hộ | Không có trong bộ tem | Phao bơi có sọc |
| Zoo | Cổng sở thú | Trừu tượng | Voi (chưa có ở chủ đề nào khác) |
| Notes | Khóa Sol | Ký hiệu, đúng nhưng lạnh | Giữ, chỉ đổi tem (P2) |
| Time | Đồng hồ đeo tay | Ổn. Nhưng tên EN "Clocks" mà trong bộ có 2 đồng hồ cát | Đổi 2 đồng hồ cát thành đồng hồ báo thức hoặc đồng hồ treo tường |

### 1.5 Theme "Little Post Office" có hiện ra không

| Lớp | Có | Thiếu |
|---|---|---|
| Vỏ UI | Viền air-mail, tường mint có hoạ tiết phong bì, kèn bưu điện, dấu chân mèo, khay gỗ biển đồng, mặt sau lá là phong bì, phong bì và dấu sáp khi đủ ô | – |
| Nhân vật và bối cảnh | – | Không có cư dân, không có Pip, không thấy "bưu điện" như một nơi chốn. Màn hình chính chỉ có nút Play `[UI 01]` |
| Nội dung | Tem có răng cưa và dấu bưu điện ở góc | Chủ đề là đồ vật chung kiểu ABI (Pizza, Car, Sashimi), không gắn với thị trấn hay cư dân |
| Phản hồi sau khi giao | Phong bì bay **ra khỏi màn hình** | Không có người nhận, không có lời nhắn |
| Level khó | Banner đỏ "HARD LEVEL", rung màn hình, nền tím chiều tối `[SS 03]` | Tím xám và đỏ cảnh báo là tone "nguy hiểm", trái với chill. Concept đã có sẵn fiction "Ca tối" và "bưu điện vẫn mở" |

Kết luận: prototype **đọc ra "cozy stamp game"**, nhưng **chưa đọc ra "Little Post Office"**. Có ba việc rẻ nhất để sửa, chi tiết ở mục 3.6:
- Gắn chủ đề có sẵn với cư dân, ví dụ Cake → Marigold, Time → Finch, Flower/Bouquet → Lina, Ship/Sea life → Bo, Tea → Ines, Cat → Pip.
- Hiện 1 câu flavor ở màn thắng (concept mục 3.3 đã có 8 câu mẫu).
- Đổi skin level khó thành "Busy Day / Ca tối" với đèn vàng ấm.

### 1.6 Juice còn thiếu cho vòng lặp thoả mãn

Prototype đã có rất nhiều juice (`prototype-10-levels.md` mục 5). Những chỗ còn thiếu, xếp theo tác động:

1. **Phong bì bay vào thanh tiến độ** thay vì bay ra khỏi màn hình. Như vậy mục tiêu "Send N letters" khép vòng bằng hình: một đoạn của thanh sáng lên, kèm tiếng "tách". Hiện thanh và phong bì là hai thứ rời nhau.
2. **Khoảnh khắc "lật ra tem vương miện".** Đây là sự kiện thông tin quan trọng nhất trong level, vì nó mở được ô mới, nhưng hiện chỉ lật như mọi lá khác. Nên thêm vương miện loé, âm riêng và rung nhẹ.
3. **Dọn sạch một cột** (cột trống là tài nguyên) chưa có phản hồi riêng.
4. **Vào Overtime** đang dùng chữ đỏ "OVERTIME!" và màu cảnh báo `[CODE main.js:1552]`. Nên đổi thành đèn bàn bật sáng và tông vàng ấm: "Ca tối, bưu điện vẫn mở". Người chơi phải thấy nhẹ nhõm, không phải thấy mình đã thua.
5. **Màn thắng không có "người nhận".** Thêm 1 dòng flavor và avatar.
6. **Âm thanh vẫn là của APK** (`art-redo-chatgpt.md` mục 5), nên chưa thể đánh giá âm thanh như một phần của theme.

---

## 2. Level design và độ khó

### 2.1 Bảng tổng hợp (số liệu từ `[DATA]` và `[DESIGN]`)

| L | Vai trò | Ô | Chủ đề | Lá | Moves | Tối ưu | Moves/lá | Biên (giỏi) | Giỏi thắng / kẹt | Phổ thông (10%) thắng / kẹt | Người mới (25%) thắng / +5 | Phút (10%) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | tutorial | 3 | 3 | 16 | ∞ | 23 | – | – | 100 / 0 | 100 / 0 | 100 / 100 | 1.3 |
| 2 | teach | 3 | 6 | 30 | 66 | 48 | 2.20 | 24% | 100 / 0 | 100 / 0 | 100 / 100 | 2.8 |
| 3 | teach | 4 | 6 | 35 | 75 | 56 | 2.14 | 21% | 100 / 0 | 100 / 0 | 100 / 100 | 3.3 |
| 4 | normal | 4 | 8 | 43 | 82 | 66 | 1.91 | 17% | 100 / 0 | 100 / 0 | 95 / 100 | 3.8 |
| 5 | **HARD** | 4 | 8 | 52 | 96 | 88 | 1.85 | 7% | 23 / **65** | 13 / **80** | 7 / 10 | 5.0 |
| 6 | normal | 4 | 7 | 40 | 76 | 62 | 1.90 | 17% | 100 / 0 | 100 / 0 | 90 / 95 | 3.5 |
| 7 | normal | 4 | 7 | 45 | 80 | 71 | 1.78 | 10% | 100 / 0 | 95 / 0 | **55** / 100 | 4.1 |
| 8 | normal | 4 | 7 | 41 | 75 | 64 | 1.83 | 11% | 100 / 0 | 93 / 0 | 85 / 97 | 3.8 |
| 9 | "wall" | 4 | 8 | 48 | 110 | 80 | 2.29 | 25% | 100 / 0 | 100 / 0 | 95 / 97 | 4.5 |
| 10 | **SUPER HARD** | 5 | 9 | 60 | 100 | 98 | 1.67 | −1% | 47 / 0 | 13 / 0 | 0 / 23 | 5.5 |

Đối chiếu: số moves còn lại khi thắng trong video gốc là L2 17, L3 19, L4 15, L5 6, L6 11, L7 8, L8 9 `[VIDEO]`. Người chơi giỏi mô phỏng còn 16, 16, 14, 7, 13, 8, 8. **Mô hình đã khớp** với cách bản gốc được chơi. Thời gian luỹ kế (mức phổ thông, chưa tính popup và animation): tới L5 khoảng 16 phút, tới L10 khoảng 38 phút. Cả hai nằm trong mục tiêu 12–20 và ~40 phút (`difficulty-and-ua-milestones.md` mục 2).

### 2.2 Nhận định đường cong

```
Độ khó cảm nhận (phổ thông)
L1 ▁  L2 ▂  L3 ▂  L4 ▃  L5 █ (kẹt)  L6 ▃  L7 ▅  L8 ▄  L9 ▂  L10 █ (moves)
```

- **L2–L4 phẳng và dễ** (100% thắng ở mọi mức). Với vai trò dạy luật thì chấp nhận được. Nhưng L2 là một bước nhảy *về nhận thức*: từ 16 lá và 3 chủ đề lên 30 lá, 6 chủ đề, deck 18, có giới hạn moves, bảng luật, Hint và ô phụ trả tiền. Dữ liệu thắng không thấy vấn đề, nhưng `invalid_move` và `level_quit` ở L2 cần theo dõi `[GIẢ THUYẾT]`.
- **L5 khó vì kẹt, không phải vì moves.** Biên 7% là chặt. Nhưng điểm đáng lo là **65–80% ván kẹt cứng**: người chơi mở hết ô quá sớm trong khi tem cần nằm dưới lá không đi được. Overtime (moves vô hạn) **không cứu được** thế kẹt này. Chỉ Joker cứu trợ cứu được (`[CODE main.js:1545–1547]`). Trải nghiệm thực tế của đa số người chơi ở mốc UA 1 sẽ là: bị kẹt, rồi "Stuck? Here's a free Golden Stamp!", rồi bước vào chế độ đặt một lá **chưa từng được dạy**, vì Joker mở ở L9 và thanh booster vẫn đang khoá ô Joker `[SS 03]`. Đây là cảm giác "game thương hại tôi", không phải "tôi vượt qua được". Mốc này lại rơi đúng khoảng phút 16, thường là cuối phiên đầu tiên `[GIẢ THUYẾT]`.
- **L10 là mô hình đúng cho level "khó nhưng không thể thua":** không kẹt (0%), biên âm, phổ thông thắng trong moves chỉ 13%. Phần lớn người chơi hết moves khi gần xong, vào Overtime, rồi hoàn thành sau 4–8 nước nữa (trung vị phổ thông 104, người mới 108 so với moves 100). Cảm giác là suýt kịp rồi được nhẹ nhõm. **L5 nên được làm lại theo khuôn L10.**
- **L7 là điểm churn ẩn.** Người mới thắng 55% trong moves, cộng 4 cặp tem nhầm (mục 1.3), cộng dạy Stamper. Con số mô phỏng còn *lạc quan* vì người chơi mô phỏng không bao giờ nhầm hình.
- **L9 không phải wall** (biên 25%, nhãn trong `[DESIGN]` sai). Nhưng một level dễ ngay trước L10 lại là **nhịp đúng**: breather kiêm phần thưởng (Joker) trước wall. Đề xuất đổi nhãn, không cần đổi độ khó.
- **Mô phỏng chưa tính booster, Undo và gợi ý miễn phí.** Tới L10 người chơi đã được tặng 3 Hint, 2 Magnet, 2 Stamper và 2 Joker, có 3 Undo mỗi level, gợi ý tự động sau 7 giây đứng im ở level khó, và Undo còn cho "nhìn trộm" lá úp (mục 3.3). Độ khó thật của L5–L10 **thấp hơn bảng trên** khá nhiều `[GIẢ THUYẾT]`. Không nên siết thêm moves L10 khi chưa có profile mô phỏng biết dùng booster.

### 2.3 Lệch giữa generator và báo cáo độ khó (lỗi công cụ, cần sửa trước)

- Generator lọc seed bằng `sampleMovesNeeded` (`[CODE solver.js:127]`). Hàm này chạy `solve()` có nhiễu trên state đầy đủ, nên **thấy lá úp**. `MAX_FAIL.hard = 0.3` vì vậy chỉ lọc kẹt của người chơi *biết hết*.
- Báo cáo độ khó dùng `sampleHidden` (không nhìn trộm), nên ra kết quả kẹt 65–80%.
- Hậu quả: `levels.js` và `prototype-10-levels.md` mục 4 ghi L5 "thắng mô phỏng 0.93", L10 "0.3". Hai con số này mô tả hai trò chơi khác nhau. Mọi lần tune bằng `DESIGN.target` đều đang nhắm vào một người chơi không tồn tại.
- **Sửa:** generator dùng `sampleHidden` với profile `casual10` cho cả `MAX_FAIL` (tỉ lệ kẹt) lẫn `target` (tỉ lệ thắng). Giữ `solve()` chỉ để lấy số moves tối ưu.

### 2.4 Hệ thống sao đang phạt cả người chơi giỏi

Luật hiện tại: 3★ nếu moves còn lại ≥ 25% ngân sách, 2★ nếu ≥ 10% (`[CODE main.js:1605–1610]`). Áp vào trung vị moves `[DATA]`:

| L | Giỏi: còn / sao | Phổ thông: còn / sao | Người mới: còn / sao |
|---|---|---|---|
| 2 | 16 (24%) / 2★ | 14 / 2★ | 12 / 2★ |
| 3 | 16 (21%) / 2★ | 13 / 2★ | 10 / 2★ |
| 4 | 14 (17%) / 2★ | 11 / 2★ | 9 / 2★ |
| 6 | 13 (17%) / 2★ | 11 / 2★ | 8 / 2★ |
| 7 | 8 (10%) / 2★ | 3 / 1★ | 0 / 1★ |
| 8 | 8 (11%) / 2★ | 4 / 1★ | 2 / 1★ |
| 9 | 28 (25%) / 3★ | 26 / 2★ | 22 / 2★ |

Kết quả: chỉ L1 và L9 cho 3★. Ngay cả người chơi trong video cũng chỉ được 2★ ở L2–L8. "Perfect!" gần như không bao giờ xuất hiện, còn "More moves left = more ★" hiện gần như mọi level.

**Đề xuất:** tính sao theo slack như `gdd-core.md` mục 5. Với S = moves − tối ưu: 3★ nếu còn ≥ 0.5·S, 2★ nếu còn ≥ 0.2·S.
- Ngưỡng 3★ sẽ là L2 9, L3 10, L4 8, L5 4, L6 7, L7 5, L8 6, L9 15, L10 1.
- Người giỏi đạt 3★ ở mọi level thường. Người phổ thông đạt 3★ ở L2–L6, 2★ ở L7–L8. Người mới đạt 1★ ở L7–L8.
- Phân tầng đúng chỗ, và thắng trong moves ở level khó được thưởng xứng đáng.

### 2.5 Đề xuất thay đổi theo level

| L | Hiện tại | Đề xuất | Dữ liệu ủng hộ | Mục tiêu sau khi đổi |
|---|---|---|---|---|
| 1 | ∞, 3 chủ đề | Giữ thông số. Ẩn khay ô phụ có khoá "Lv 2" ở L1 (nhiễu thị giác ngay màn đầu) | `[SS 01]` | 100%, ≤ 1.5 phút |
| 2 | 66 moves, 6 chủ đề | Giữ moves. Chỉ sửa luật sao | Biên 24%, 100% ở mọi mức | Phổ thông 3★ |
| 3 | 75 | Giữ moves. Bỏ **kẹo bông** khỏi Candy (thay bằng kẹo gói) | Cặp nhầm Candy/Balloon (1.3) | Như cũ |
| 4 | 82, 8 chủ đề | Giữ | 100/100/95% | Như cũ |
| **5** | 96, kẹt 65–80% | **Sinh lại seed** với `sampleHidden`: kẹt phổ thông ≤ 25%, thắng trong moves (phổ thông) 15–25%, giỏi 40–50%. Ngân sách 92–96 (chọn theo seed). Đổi tem **xe buýt** của Truck thành xe tải kéo hoặc xe ben, bỏ **diều cá mập** | L10 cho thấy cấu hình "biên âm, kẹt 0%" tạo được trải nghiệm suýt kịp rồi Overtime. Kẹt hiện tại buộc phải tặng Joker chưa dạy | Overtime 60–85% (KPI ở `difficulty-and-ua-milestones.md` mục 5), kẹt ≤ 25%, quit < 10% |
| 6 | 76 | Giữ moves. Thay **Sauce** (3 lá) bằng một chủ đề 3 lá không phải chai, ví dụ Bird (art có sẵn) | Cặp nhầm Sauce/Soft drink | Người mới ≥ 90% |
| **7** | 80, 7 chủ đề, 4 cặp nhầm | **Thay Zoo** bằng chủ đề không phải động vật (ví dụ Hat hoặc Cake). Thay kính lặn và kính trượt tuyết trong Glasses bằng 2 kính cận mới vẽ (hoặc giảm Glasses từ 8 xuống 6 lá và moves từ 80 xuống 77 để giữ tỉ lệ). Nếu chưa kịp sửa art thì nới moves 80 → 84 | Người mới 55%, biên 10%, đồng thời dạy Stamper | Người mới ≥ 75% trong moves |
| 8 | 75 | Thay **Raw meat** (lệch tone, nhầm với Grilled) bằng chủ đề có sẵn như Ship hoặc Chess. Bỏ **dango** khỏi Desserts | Cặp nhầm Grilled/Raw meat/Desserts | Người mới ≥ 85% |
| 9 | 110, nhãn "wall" | Đổi nhãn thành `breather` / reward. Giữ 110 (3★ cho người giỏi là phần thưởng trước L10). Thay **Balloon** (bóng sư tử nhầm với Zoo) bằng Candy (đã bỏ kẹo bông). Giữ cặp Water Plants/Gardening làm "cặp aha" duy nhất | Biên 25%, 95–100% | Như cũ |
| **10** | 100, biên −1%, kẹt 0% | **Giữ** cấu hình. Giảm quà Joker ở L9 từ 2 xuống 1 hoặc đo trước. Thêm profile mô phỏng biết dùng booster trước khi siết | Đã đúng khuôn "không thể thua". Quà booster chưa được tính | Overtime 60–85% |

**Số chủ đề và số ô.** Bản prototype đang chép thông số video: 8 chủ đề ở L4, L5, L9 và 9 chủ đề ở L10. Điều này vi phạm quy tắc của chính mình (`level-design-rules.md` mục 5: tối đa 6 chủ đề mỗi level; cặp "gần nhau" chỉ từ level 36). Tôi không đề xuất giảm ngay, vì baseline ABI là thứ cần đo trước. Nhưng nên ghi rõ đây là **Baseline A (clone ABI)**. Khi đã có số liệu playtest thì làm **Variant B (luật riêng: ≤ 6 chủ đề, không cặp nhầm trước tier 3)** để so `firstTryWinRate` và `quitRate`.

**Độ dài phiên.** Mức phổ thông mất 2.8–5.5 phút mỗi level, dài hơn mục tiêu 1–3 phút trong `gdd-core.md` mục 1. Bản gốc cũng dài cỡ này `[VIDEO]` (17 phút cho 9 level với người chơi giỏi). Đây là quyết định của PO: hoặc chấp nhận 3–5 phút như thể loại, hoặc giảm số lá ở level thường xuống khoảng 35–40.

### 2.6 Dự báo điểm churn trong 10 level

| Điểm | Lý do | Mức |
|---|---|---|
| L2 | Nhảy nhận thức: 6 chủ đề, deck 18, moves, bảng luật, Hint, ô phụ | Thấp–Trung |
| **L5** | Kẹt cứng 65–80%, tặng Tem Vàng chưa dạy, rơi vào phút 16 khi phiên đầu thường kết thúc | **Cao** |
| **L7** | Người mới 55%, 4 cặp nhầm, booster mới | **Cao** |
| L10 | Ván dài nhất (5.5–6.8 phút), thường chỉ được 1★ trong Overtime, rồi gặp "That was the last level" | Trung (với prototype) |

---

## 3. Design tổng thể

### 3.1 Độ rõ của core loop

- Vòng lặp **mở ô bằng tem vương miện → gom tem cùng loại → phong bì đi → ô trống lại** rõ ràng, có đủ hình hỗ trợ: vương miện mờ trong ô trống, đích hợp lệ sáng lên khi kéo, toast giải thích lỗi `[SS 01]`, `ftue-copy.md`.
- **Quyết định có ý nghĩa nhất của thể loại là "mở ô nào, khi nào".** Kẹt cứng ở L5 chính là hậu quả của việc mở ô quá sớm. Nhưng **chạm một lá sẽ tự mở ô trống nếu đó là tem vương miện** (`prototype-10-levels.md` mục 2: thứ tự tìm đích có "ô trống (với tem chủ đề)"). Như vậy prototype đang *tự động hoá đúng cái quyết định tạo ra chiều sâu*, và có khả năng đẩy người chơi phổ thông vào kẹt `[GIẢ THUYẾT]`. `gdd-core.md` mục 3 đã quy định "tap không bao giờ tự OPEN".
  - **Đề xuất:** khi chỉ còn 1 ô trống, chạm tem vương miện không tự mở ô. Thay vào đó lá rung và hiện toast "Last free slot: drag to open". Ghi sự kiện `open_via` (tap/drag) để kiểm chứng tương quan với kẹt.

### 3.2 Nhịp FTUE

| Level | Dạy gì | Đánh giá |
|---|---|---|
| L1 | Kịch bản 7 bước, moves vô hạn, 1.3 phút | Tốt. Câu ngắn, đúng 7 thao tác. Chỉ cần bỏ nhiễu (khay "Lv 2", 4 booster khoá) `[SS 01]` |
| L2 | Moves, bảng luật, Hint (dời tới sau nước thứ 6), ô phụ +1 | Hơi dồn nhưng đã giãn hợp lý. Bảng luật 5 dòng có hình `[UI 03]` dễ đọc |
| L3–L4 | 4 ô, cột trống, Magnet (kịch bản) | Tốt. Magnet đến ngay trước L5 khó là đúng nhịp |
| L5 | Level khó, combo | **Vấn đề:** Tem Vàng cứu trợ xuất hiện trước khi được dạy (mục 2.2). Gợi ý tự động sau **7 giây** đứng im ở level khó (`[CODE main.js:947–955]`): người chơi đang suy nghĩ ở level khó sẽ liên tục bị bàn tay chỉ, mất khoảnh khắc "aha", và Hint trả phí cũng mất giá trị |
| L7 | Stamper | Booster yếu (3.3), lại dạy ở level nhiễu nhất |
| L9 | Joker (kịch bản, dùng ngay đầu level) | Tốt. Dạy xong là được dùng ở L10 |

**Sửa:**
- Rescue ở level khó dùng **Magnet** trước (đã dạy ở L4, `pullable` có sẵn). Chỉ khi Magnet không giải được mới dùng Tem Vàng, kèm 1 câu `bi_joker` và bàn tay chỉ cột.
- Gợi ý tự động ở level khó chỉ bật **sau lần kẹt hoặc vào Overtime đầu tiên**, và chờ 20 giây. L1–L3 giữ 7–10 giây.

### 3.3 Booster: thứ tự mở và giá trị

| Booster | Mở | Vai trò thật | Đánh giá |
|---|---|---|---|
| Undo | L1, 3 lượt/level | Sửa sai | **Lỗ hổng "nhìn trộm":** Undo khôi phục snapshot đầy đủ (`[CODE main.js:546–555]`) và trả lại move. Người chơi có thể đi một nước làm lộ lá úp, xem, rồi Undo: biết thêm thông tin mà không mất gì. Điều này phá cả độ khó đo được (mô phỏng không nhìn trộm) lẫn giá trị của Hint. **Sửa:** nếu nước đi đã làm lộ lá úp thì Undo vẫn giữ lá đó ngửa ("thư đã bóc"), hoặc không hoàn move |
| Hint | L2, tặng 3 | Thông tin | Dùng solver (`solverHint`). Nếu solver đọc cả lá úp thì Hint là booster thông tin mạnh, đáng giá. Cần xác minh `solverHint` có dùng lá úp không |
| Magnet | L4, tặng 2 | Tiến độ (2 lá ẩn vào ô, 0 move) | Tốt, chống kẹt hiệu quả |
| **Stamper** | L7, tặng 2 | Tiến độ (**1** lá vào ô) | **Bị Magnet lấn át hoàn toàn:** cùng hàm `pullToFoundation`, count 1 so với 2, **cùng giá 500** (`[CODE main.js:710, 21]`). Không có lý do để chọn Stamper |
| Joker | L9, tặng 2 | Không gian (cột nhận mọi tem) | Mạnh, đúng vai trò chống kẹt. Đặt trước L10 là hợp lý |
| Ô phụ | L2 | Không gian | Khay khoá luôn hiện ở góc trái. Trông giống một ô thật, và ở L10 có 5 ô thì càng chật `[SS 05]` |

**Đề xuất cho Stamper** `[GIẢ THUYẾT, cần playtest]`: tách theo 3 vai trò.
- **Thông tin:** Hint, và Stamper mới.
- **Tiến độ:** Magnet.
- **Không gian:** Joker, Ô phụ.

**Stamper mới = "Đóng dấu kiểm tra":** chọn 1 cột, mọi lá úp trong cột đó lật ngửa, 0 move. Booster này đánh vào đúng nguyên nhân gốc của kẹt. Bằng chứng: solver biết hết thì không kẹt, người chơi không nhìn trộm thì kẹt 65–80% `[DATA]`. Fiction khớp (con dấu bưu điện kiểm thư). Icon con dấu gỗ như concept B `[UI 00]`.

### 3.4 Economy (PO chốt số, ở đây chỉ phân tích tỉ lệ)

| Khoản | Giá trị trong code | Nguồn |
|---|---|---|
| Coin khởi đầu | 500 | `[CODE main.js:64]` |
| Thắng | 10 + 10 × sao (20/30/40), x2 nếu xem ad | `[CODE main.js:1626]` |
| Combo | +5 coin mỗi 6 lần giao liên tiếp | `[CODE main.js:1442]` |
| Hint / Magnet / Stamper / Joker | 300 / 500 / 500 / 1200 | APK, `[CODE main.js:21]` |
| Ô phụ / +5 moves / Undo thêm | 1000 / 900 / 50 | `[CODE main.js:21]` |

- **Thu nhập 10 level** của một người chơi phổ thông (với luật sao hiện tại) khoảng 270 coin cộng chút combo, **tổng khoảng 750–800 coin ở L10** nếu không tiêu gì. Như vậy **+5 moves (900) và Ô phụ (1000) không bao giờ mua được trong 10 level**. Nút coin luôn ở trạng thái mờ "Need N more coins" `[UI 05]`. Bài học người chơi rút ra là "coin vô dụng". Một Hint (300) bằng khoảng 10 lần thắng.
- **Quà tặng hào phóng** (9 booster miễn phí, 3 Undo mỗi level, +5 moves qua ad miễn phí mỗi level, Overtime, rescue). Thất bại hầu như không gây đau, nên prototype **chưa đo được nhu cầu booster**. Điều này chấp nhận được cho FTUE, nhưng cần ghi rõ: 10 level này *không* kiểm chứng economy.
- **Lệch pillar:** nút "Claim x2 (ad)" ở màn thắng `[UI 08]` trái với `gdd-core.md` mục 6 (MVP không có double reward ad, pillar P4). Đây là quyết định của PO, nhưng cần chốt rõ ràng thay vì để mặc định theo ABI.
- **Đề xuất cho PO:** chọn một trong hai hướng.
  - (a) Hạ giá theo tỉ lệ để có ít nhất một khoản chi coin trong 10 level: +5 moves khoảng 3 lần thắng, Hint khoảng 1 lần thắng.
  - (b) Giữ giá ABI nhưng chấp nhận rằng 10 level này chỉ đo tỉ lệ xem rewarded ad.

### 3.5 Meta và progression (mức prototype)

- Hiện chưa có meta: màn hình chính có nút Play và lưới level. L10 kết thúc bằng "That was the last level. Thanks for playing!".
- Với mục tiêu đo D1, cần ít nhất **một lý do quay lại nhìn thấy được**. Rẻ nhất và khớp theme nhất là **trang album tem**: mỗi level thắng thì các chủ đề vừa giao "dán" vào một trang. 59 chủ đề có sẵn, 10 level lấp khoảng 1 trang. Có thể thêm **phần thưởng cuối chapter ở L10** (một decor hoặc một con tem hiếm) và màn "Chapter 2 sắp mở". Cả hai đều có trong `concept` mục 5.
- Sao hiện không dùng vào việc gì. Có thể đổi thành "Tem Điểm" để mở album hoặc decor, đúng như GDD.

### 3.6 Cách diễn đạt mục tiêu "letters"

- "Send 9 letters", "6 letters left to send", thanh tiến độ có icon thư `[CODE copy.js]`. Cách này **đúng hơn "slots"** (đã sửa lỗi L10 có 5 khay mà ghi "Fill 9 slots").
- Nhưng mô hình trong đầu người chơi chưa liền mạch. Trên bàn họ thấy *tem*, ô ghi "Dinosaur 2/4", rồi một phong bì bay *ra ngoài*. Không có gì nói rằng "4 tem khủng long = 1 lá thư gửi cho ai đó". Copy cũng còn lẫn: `tip_combo` "Fill slots in a row", `tip_complete` "Slot full! Sent.".
- **Đề xuất:**
  1. Phong bì bay vào đoạn tương ứng trên thanh tiến độ (mục 1.6).
  2. Khi một ô mở, ribbon hiện kèm người nhận: "Dinosaur · to Otto", gắn chủ đề với cư dân như mục 1.5.
  3. Màn thắng hiện 1 câu flavor của cư dân nhận lá thư cuối.
  4. Thống nhất copy: `tip_combo` thành "Send letters in a row for coins", `tip_complete` thành "Letter sent! The slot is free again".

### 3.7 Mốc UA và lưới an toàn

| Mốc | Vị trí | Đánh giá |
|---|---|---|
| L5 (`milestone_level_5`) | Khoảng 16 phút | Vị trí tốt. **Cơ chế khó sai loại**: khó vì kẹt (phải cứu bằng Joker chưa dạy) thay vì khó vì moves (Overtime cứu tự nhiên). Sửa theo mục 2.5 |
| L10 (`milestone_level_10`) | Khoảng 38–40 phút | Vị trí và cấu hình tốt. Lưu ý quà Joker ở L9 và gợi ý tự động có thể làm L10 "trông khó" nhưng không được "cảm thấy khó" |
| Overtime chỉ 1★ | | Hợp lý về động lực (người giỏi vẫn muốn thắng trong moves). Cần đổi visual và copy sang tông ấm (1.6 #4) |
| Banner "HARD LEVEL" đỏ, rung, nền tím | `[SS 03]` | Tạo được tension, nhưng lệch tone. Đề xuất "Busy Day!" hoặc "Holiday Rush", nền chiều tối ấm có đèn bàn. Giữ rung nhẹ |
| A/B `overtime / retry / none` | | Thiết kế A/B tốt. Thêm nhánh **rescue = Magnet trước, Joker sau** |

---

## 4. Danh sách hành động

Effort: S ≤ 1 ngày, M 2–4 ngày, L ≥ 1 tuần (một người).

### P0: làm trước playtest người thật kế tiếp

| # | Việc | Tác động kỳ vọng | Effort | Owner |
|---|---|---|---|---|
| 1 | Generator dùng `sampleHidden` (profile casual10) cho cả `MAX_FAIL` và `target`. Cập nhật lại bảng trong `prototype-10-levels.md` | Mọi số tune khớp với người chơi thật hơn. Bỏ được con số "0.93" sai ở L5 | M | code |
| 2 | Sinh lại **L5** theo khuôn L10: kẹt phổ thông ≤ 25%, thắng trong moves 15–25%, moves 92–96. Bỏ xe buýt và diều cá mập | Mốc UA 1 thành "suýt kịp rồi Overtime" thay vì "kẹt rồi được thương hại". Kỳ vọng giảm quit ở L5 `[GIẢ THUYẾT]` | M | design + code |
| 3 | Rescue ở level khó: Magnet trước, Joker sau, có 1 câu giải thích và bàn tay chỉ | Không còn mechanic chưa dạy ở level khó nhất | S | code |
| 4 | Sửa **L7**: thay Zoo, bỏ kính lặn và kính trượt tuyết (hoặc nới moves lên 84 nếu chưa có art) | Người mới từ 55% lên ≥ 75% trong moves `[GIẢ THUYẾT]`. Bỏ 4 cặp nhầm | S (design) + S (art 2 tem kính) | design, art |
| 5 | Luật sao theo slack (3★ ≥ 0.5·S, 2★ ≥ 0.2·S) | 3★ đạt được ở L2–L6 cho người phổ thông. "Perfect!" xuất hiện. Thưởng xứng đáng khi thắng trong moves ở level khó | S | code |
| 6 | Cỡ lá theo số cột (CW/CH thành biến, mục P1-7 trong UI review) | Art từ khoảng 43 pt lên khoảng 55 pt, readability tăng cho mọi chủ đề, giảm nhầm | M | code |

### P1: trong vòng lặp tiếp theo

| # | Việc | Tác động | Effort | Owner |
|---|---|---|---|---|
| 7 | Màu nền lá theo chủ đề (cố định trong một level, ít nhất ở L1–L6) thay vì theo `card.id` | Thêm một kênh nhận diện miễn phí, giảm nhầm Sea life/Float/Zoo | S | code |
| 8 | Stamper mới = lật ngửa toàn bộ lá úp của 1 cột (vai trò thông tin). Icon con dấu gỗ | Booster thứ 3 có lý do tồn tại, đánh vào nguyên nhân kẹt | S (design) + M (code) + S (art) | design, code, art |
| 9 | Undo không xoá thông tin: lá đã lộ thì vẫn ngửa sau Undo, hoặc không hoàn move | Bỏ lỗ hổng nhìn trộm. Mô phỏng độ khó còn đúng | S | design + code |
| 10 | Gợi ý tự động ở level khó chỉ bật sau lần kẹt hoặc Overtime đầu tiên, chờ 20 giây | Giữ khoảnh khắc "aha" và giá trị của Hint | S | code |
| 11 | Chạm không tự mở ô trống cuối cùng, cùng sự kiện `open_via` | Giảm kẹt do mở ô vô tình, đo được nguyên nhân | S | code |
| 12 | Sửa cặp nhầm L3 (kẹo bông), L6 (Sauce → Bird), L8 (Raw meat → Ship/Chess, bỏ dango), L9 (Balloon → Candy). Áp quy tắc "một vật chỉ một chủ đề trong chapter" | Tuân pillar P1, giảm `invalid_move` | S (design, sinh lại level) + S–M (art) | design, art |
| 13 | Sửa icon không khớp: Phone (quay số), Insect (bọ rùa), Glasses (thêm kính cận), Hoofed (đầu ngựa), Float (phao bơi), Zoo (voi). Time: đổi 2 đồng hồ cát | Lá vương miện đọc ra chủ đề ngay | M | art |
| 14 | Theme tối thiểu: phong bì bay vào thanh tiến độ; gắn chủ đề với cư dân; 1 câu flavor ở màn thắng (dùng pool có sẵn trong `concept` mục 3.3) | "Little Post Office" hiện ra ở core loop, mục tiêu "letters" có nghĩa | M (code) + S (copy) | code, design |
| 15 | Profile mô phỏng biết dùng Undo, Hint, Magnet, Joker trong `difficulty_report.mjs` | Biết độ khó thật của L7 và L10 trước khi siết hoặc nới | M | code |
| 16 | PO chốt hướng economy cho 10 level: (a) hạ giá theo tỉ lệ thu nhập, hoặc (b) chỉ đo ad. Chốt có giữ "Claim x2" hay không. Cân nhắc quà Joker ở L9 từ 2 xuống 1 | Coin có ý nghĩa, hoặc ít nhất mục tiêu đo được ghi rõ | S | PO + design |

### P2: khi có thời gian hoặc trước soft launch

| # | Việc | Tác động | Effort | Owner |
|---|---|---|---|---|
| 17 | Bỏ mặt cười ở Fruit và Ball. Vẽ lại Notes thành đồ vật (hộp nhạc, máy đếm nhịp, tờ nhạc). Đổi tàu chiến, thỏ trong Beast, chó đốm và bò trong Zoo | Đồng bộ style, đúng pillar P3 | M | art |
| 18 | Skin level khó "Busy Day / Ca tối": nền ấm có đèn, Overtime tông vàng, copy mới | Tension vẫn còn nhưng không phá tone chill | S (art) + S (code) | art, code |
| 19 | Trang album tem cùng phần thưởng cuối chapter ở L10, sao đổi thành Tem Điểm | Có lý do quay lại để đo D1 | M | design, code, art |
| 20 | Juice: vương miện loé khi lật ra tem vương miện, phản hồi khi dọn sạch cột | Nhấn đúng sự kiện thông tin quan trọng | S | code |
| 21 | Ẩn khay ô phụ có khoá ở L1. Cân nhắc gom booster khoá thành 1 icon "?" | Màn đầu sạch hơn | S | code |
| 22 | Thay âm thanh APK | Đánh giá được âm thanh như một phần theme, gỡ được gitignore asset | L | art (audio) |
| 23 | Dựng Variant B (luật riêng: ≤ 6 chủ đề, không cặp nhầm trước tier 3) để A/B với Baseline A (clone ABI) | Biết luật riêng tốt hơn hay kém bản gốc | M | design + code |

---

## 5. Câu hỏi còn mở và dữ liệu cần thêm

1. `solverHint` có đọc lá úp không? Câu trả lời quyết định Hint là booster thông tin mạnh hay chỉ là gợi ý heuristic.
2. Tỉ lệ người chơi thật dùng Undo để nhìn trộm. Đo bằng sự kiện "undo ngay sau nước làm lộ lá úp".
3. Confusion test G3 cho các cặp ở mục 1.3 (20 người, 3 giây, cỡ lá thật), nhất là L7 và L8.
4. Playtest người thật L1–L10 với các sự kiện có sẵn: `level_quit` ở L5 và L7, `rescue_joker` trên `level_start` ở L5, `invalid_move` theo chủ đề.
5. Trải nghiệm vào Overtime: người chơi thấy nhẹ nhõm hay thấy mình đã thua? Cần phỏng vấn ngắn sau L5 và L10.
6. PO: độ dài 3–5 phút mỗi level có chấp nhận được không, hay quay về mục tiêu 1–3 phút?
7. Profile mô phỏng biết dùng booster: L10 có còn "siêu khó" khi người chơi dùng 2 Joker được tặng?
