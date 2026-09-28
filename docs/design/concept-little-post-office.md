# Concept pitch: Little Post Office

**Tác giả:** game-designer agent · **Ngày:** 2026-09-28 · **Trạng thái:** bản 2 (bỏ cốt truyện theo phản hồi người dùng), chờ chốt 3 điểm ở mục 7.3

**Bối cảnh:** người dùng chọn hướng Postmaster (`theme-stamp.md` mục 3), tone **cozy, cute, chill**; không cần cốt truyện, chỉ cần bối cảnh và nhân vật dễ thương. Core giữ nguyên Solitaire Associations (4 category ẩn, tableau, moves; `teardown-stamp-solitaire.md` mục 2-3). Gate G1-G4 trong `positioning-stamp-vs-alt.md` mục 4 vẫn áp dụng, đề xuất sửa G1 ở mục 7.2.

**Nhãn nguồn:** `[STORE]` snippet WebSearch 28/09/2026; `[MARKET]` bài viết ngành; `[PLAY]` review; `[GIẢ THUYẾT]` suy luận. Mọi nhận định về audience không có số liệu là `[GIẢ THUYẾT]`.

---

## 1. High concept và pillars

**High concept:** Bạn là nhân viên mới của bưu điện nhỏ ở thị trấn Wren Hollow, mỗi ngày phân loại thư vào hộc của cư dân bằng luật Solitaire Associations. Mỗi lá thư giao xong, cư dân đáp lại một câu vui vẻ; thị trấn mở dần từng khu, từng mùa, bưu điện của bạn đầy dần đồ đạc và mèo Pip ngủ ngày một nhiều chỗ. Không timer, không ad giữa level, không "thua": thư chỉ bị trễ, mai giao tiếp.

| # | Pillar | Là gì | Không phải là |
|---|---|---|---|
| P1 | **Sort, đừng đoán** | Thử thách là thứ tự lật/dời card và moves; hộc thư đọc được từ hình trong 2 giây | Không phải trivia; không category cần kiến thức |
| P2 | **Thư là flavor, không phải cốt truyện** | Một câu slice-of-life sau mỗi level, random, không nối nhau, tắt được | Không có tuyến chính, không bí ẩn, không beat, không choice |
| P3 | **Cute ấm, không trẻ con** | Nhân vật tròn, gouache mềm, hài khô kiểu người lớn | Không neon, không mascot hét, không "kawaii" quá đà |
| P4 | **Tử tế với người chơi** | Undo miễn phí, fail không mất gì, ad chỉ khi tự chọn | Không interstitial trong gameplay như ABI (`teardown` mục 5, 9 `[PLAY]`) |

---

## 2. Tone và art direction

### 2.1 Tham chiếu (mood only, không dùng IP)

| Trục | Tham chiếu | Lấy gì | Không lấy gì |
|---|---|---|---|
| Kết cấu | Storybook gouache, giấy kem có vân | Nét cọ mềm, viền nâu ấm | Gradient AI bóng, flat rực như ABI (`teardown` mục 8 `[STORE]`) |
| Thế giới | Cozy town kiểu Animal Crossing / Cozy Grove / Dorfromantik | Thị trấn nhỏ, mỗi cư dân một tiệm, mùa đổi màu | Nhân vật thú (tránh trùng Animal Crossing, Cat Mail Co.; xem 7.3) |

### 2.2 Thông số art

| Yếu tố | Quy tắc | Lý do |
|---|---|---|
| Tỉ lệ | Cư dân **2.5 đầu**, Pip 2 đầu | Đọc được ở portrait 96 px; AI + retouch nhanh |
| Palette nền | Giấy kem #F4EBD9, gỗ ấm, xanh rêu | Nền trung tính cho màu tem nổi |
| 6 màu mực tem | coral, sky blue, sage, butter yellow, lavender, cocoa (bão hoà ≥ 60%) | Early game nhận category bằng màu (`theme-stamp.md` 3.1) |
| Card | Phong bì nhỏ, tem **≥ 60% diện tích**, 1 motif, không chữ nhỏ | **Gate G3**: card 120 px, 3 giây, early ≥ 85%, mid ≥ 65% (`positioning` mục 4) |
| Icon | Hộp thư đỏ có Pip ngồi trên | Không tem/chữ "stamp" (`theme-stamp.md` mục 1) |

### 2.3 Vì sao cute hợp nữ 35+

- `[MARKET]` Gardenscapes/Homescapes, Lily's Garden, Merge Mansion, Royal Match đều là puzzle + nhân vật cute, ngành mô tả audience chủ yếu nữ trưởng thành; % theo tuổi chưa có trong repo (`[GIẢ THUYẾT]`, PO lấy từ Sensor Tower).
- `[GIẢ THUYẾT]` Tệp 35+ không từ chối cute, họ từ chối trẻ con; khác ở **giọng chữ** (hài khô) và **nhịp** (chậm). Ranh giới P3: cute ở hình, người lớn ở chữ.

---

## 3. Bối cảnh và nhân vật

### 3.1 Thị trấn Wren Hollow

Thị trấn ven biển nhỏ, không có năm cụ thể (xe đạp, tàu hơi nước, không smartphone). Mỗi khu = **bối cảnh + bộ tem + decor**, không cốt truyện:

| Khu | Mùa | Cư dân chính | Bộ tem (category) | Decor bưu điện |
|---|---|---|---|---|
| Phố Chính | Xuân | Otto, Pip, Marigold, Finch | Bánh, Đồng hồ, Hoa xuân, Chim sẻ | Quầy gỗ, giường Pip, đèn bàn |
| Bến Cảng | Hè | Bo, Lina | Tàu thuyền, Hải sản, Vỏ ốc, Hải đăng | Phao, cửa sổ tròn, quạt trần |
| Đồi Trà | Thu | Ines | Ấm trà, Lá thu, Bánh trung thu, Đèn lồng | Kệ trà, thảm len, lò sưởi |
| Vườn Táo | Đông | (cư dân mới) | Táo, Găng len, Người tuyết, Cú | Vòng hoa, tất treo, đèn dây |

Khu 5+ (Ga Tàu, Đảo Xa) thêm trục "tem nước hư cấu" như `theme-stamp.md` 3.2 để tăng độ gần nghĩa ở late game.

### 3.2 Cast (7)

| Tên | Vai | Tính cách | Thói quen dễ thương |
|---|---|---|---|
| **Otto** | Postmaster già | Ấm, hay quên, cười nhiều | Gọi nhầm tên Pip thành tên mèo cũ, Pip vẫn đến |
| **Pip** | Mèo bưu điện (mascot hint) | Lười, kiêu, chỉ giúp khi thích | Ngủ đúng trên lá thư bạn đang tìm |
| **Bà Marigold** | Chủ tiệm bánh | Buôn chuyện, hào phóng | Gửi công thức cho cả thị trấn, ai cũng nướng hỏng |
| **Ông Finch** | Thợ đồng hồ | Khó tính, đúng giờ | Chỉnh lại đồng hồ bưu điện mỗi lần ghé, lệch 1 phút |
| **Lina** | Chủ tiệm hoa | Nhút nhát, chu đáo | Kẹp một cánh hoa ép trong mỗi phong bì |
| **Thuyền trưởng Bo** | Cựu thuỷ thủ, giữ hải đăng | Cộc, tốt bụng | Vẽ hình thời tiết thay vì viết chữ trên thư |
| **Bà Ines** | Chủ quán trà trên đồi | Điềm tĩnh, nhớ hết | Mỗi thư kèm một túi trà, Pip ghét mùi bạc hà |

Người chơi: không tên, không giới tính, cư dân gọi là "bạn mới" (EN: "new hire"). Tên ≤ 8 ký tự, không dịch.

### 3.3 Flavor text slice-of-life

| Quy tắc | Giá trị |
|---|---|
| Pool | Mỗi cư dân **15-20 câu**, không nối tiếp nhau, đọc lẻ vẫn hiểu |
| Chọn | Random không lặp trong 5 lần gần nhất; ưu tiên cư dân vừa được giao thư (hộc hoàn thành cuối) |
| Độ dài | ≤ 15 từ EN, 1 câu; hiện trên màn hình win, trước reward |
| Tắt | Setting "Hiện lời nhắn cư dân" (mặc định bật), hoặc tap để đóng ngay |
| Localization | Không chơi chữ, không idiom, không vần; ICU placeholder cho tên |
| Giọng | Hài khô, ấm, không cảm thán, không emoji |

**8 ví dụ đúng giọng (EN để localize / VN):**

1. Marigold: "The scones are for you. The gossip is free." / "Bánh nướng tặng bạn. Chuyện phiếm miễn phí."
2. Finch: "Your clock is one minute fast. I fixed it. You're welcome." / "Đồng hồ bạn nhanh một phút. Tôi chỉnh rồi. Không cần cảm ơn."
3. Otto: "Pip helps when she feels like it. So did I, at your age." / "Pip giúp khi nó thích. Hồi bằng tuổi bạn, tôi cũng vậy."
4. Lina: "I put a petal in. If it fell out, that's fine too." / "Tôi kẹp một cánh hoa. Rơi mất cũng không sao."
5. Bo: "Sunny. Then not. Bring a hat." / "Nắng. Rồi hết nắng. Mang mũ."
6. Ines: "Tea's on. The cat may not come in." / "Trà pha rồi. Mèo không được vào."
7. Pip (thay lời): "Pip sat on your mail. Consider it approved." / "Pip ngồi lên thư của bạn. Coi như đã duyệt."
8. Bo: "The gulls say hi. I don't." / "Mòng biển gửi lời chào. Tôi thì không."

**Chi phí so với bản 1 `[GIẢ THUYẾT]`:**

| | Bản 1 (cốt truyện) | Bản 2 (flavor) |
|---|---|---|
| Launch | 70 thư × 40 từ + 6 chapter card ≈ **3.100 từ EN** | 7 cư dân × 18 câu × 15 từ ≈ **1.900 từ EN** (giảm ~40%) |
| Mỗi chapter thêm | ~1.000 từ có beat, phải giữ mạch | 1-2 cư dân mới × 18 câu ≈ **270-540 từ**, không thứ tự |
| Localize | Cần native review giữ mạch và giọng 20 thư đầu | Câu lẻ, dịch máy + 1 lượt review nhẹ; không có lỗi "dịch sai mạch" |
| Rủi ro content debt | Chapter chậm = story đứt | Không có; pool cũ dùng lại vô hạn |

---

## 4. Fiction bám vào core loop

| Hành động gameplay | Fiction | Bán được? |
|---|---|---|
| 4 category slot | 4 **hộc thư** của cư dân/loại thư (mặt hộc có portrait nhỏ) | |
| Hoàn thành category (đủ 4) | **Giao thư**: Pip/xe đẩy mang bó thư đi, portrait mỉm cười (khoảnh khắc satisfying chính) | |
| Xong level | Cư dân đáp 1 câu flavor | |
| Moves | **Giờ làm việc** (đồng hồ của Finch trên HUD) | |
| Hết moves | **Thư bị trễ**: xe đẩy quay về, không mất gì, "Mai giao tiếp" = retry; không có từ "thua"/"fail" | Điểm bán chính |
| Joker | **Tem vàng của Otto**, thư vào bất kỳ hộc (an toàn tuyệt đối như ABI Golden Stamp, `teardown` 3.3 `[STORE]`) | Coin / rewarded ad |
| Hint | **Pip chỉ đường**: mèo ngồi lên card nên đi | Coin ("cho Pip cá") |
| Undo | **Return to Sender**: 3 lần free/level, dấu đỏ trên card | Lần 4+ coin nhỏ |
| +5 moves | **Ca tối**, đèn bưu điện bật | Điểm rewarded ad duy nhất (`teardown` mục 10 hướng 3) |
| Pre-level | **Cà phê sáng** (+3 moves), **Pip trực sớm** (lộ 1 category) | Coin, gợi sau 2 lần trễ |

Shuffle = "Lắc bao thư", xem tên category = "Sổ của Otto" (coin). Giá và số free: PO chốt. Không "Power-up", "Bomb", "Rocket".

---

## 5. Meta

| Hệ thống | Mô tả | MVP? | Đo bằng |
|---|---|---|---|
| **Bưu điện nhỏ (decor)** | 1 phòng, 6-8 slot/chapter, mở bằng **Tem Điểm** (1-3/level theo sao). MVP: mỗi slot 1 mẫu; post-launch: chọn 1/3 mẫu kiểu Homescapes | **MVP** | % mở màn hình bưu điện/ngày; D7 nhóm ≥ 3 decor |
| **Album theo cư dân/khu** | Mỗi cư dân 1 trang 8-12 ô; tem bóc từ thư rơi vào ô; đủ trang = sticker + mở toàn bộ pool flavor của cư dân đó | **MVP** | % DAU mở album |
| **Tem hiếm** | 1-3% card "lỗi in đáng yêu" (Pip in ngược) = Joker trong level, ô riêng album | **MVP** | Tỉ lệ dùng Joker |
| **Daily Post + streak** | 1 level tay/ngày, tem có dấu ngày thật; 7 ngày = tem hiếm + trang phục Pip | **MVP** (ABI thiếu, `teardown` mục 6) | D1/D7 nhóm hoàn thành daily |
| **Chapter mới** | = khu mới + cư dân mới + bộ tem mới + decor mới, mở khi qua level cuối chapter; **không có narrative gate** | **MVP** (3 chapter) | Level đạt/người |
| **Sự kiện mùa** | 4 event 10-14 ngày/năm, bộ tem + decor mùa | Post-launch | Tham gia/DAU |

Decor không cho perk gameplay để tránh power creep.

---

## 6. FTUE: 5 level đầu

| Level | Thông số `[GIẢ THUYẾT]` | Dạy gì | Bối cảnh |
|---|---|---|---|
| 1 | 2 category, 8 card, 2 cột, 0 úp, moves = optimal + 6 | Kéo card lên hộc; category hiện tên sẵn | Otto đưa tạp dề: "Hai hộc thôi, hôm nay nhẹ" |
| 2 | 3 category, 12 card, 3 cột, 2 úp | Lật card úp; category **ẩn**, hiện tên khi đặt card đầu | Marigold để lại bánh |
| 3 | 3 category, 14 card, 3 cột, có deck | Draw deck; Pip xuất hiện, 1 hint free | Pip nhảy lên quầy |
| 4 | 4 category, 16 card, 4 cột, 4 úp | Dời card giữa cột; **Return to Sender** khi đặt sai lần đầu | Finch chỉnh đồng hồ |
| 5 | 4 category, 16 card, 5 úp, moves = optimal + 3 | **Tem vàng**: Otto tặng 1, gợi ý dùng, **không ép** (tránh phàn nàn ABI `[PLAY]` `teardown` 3.4) | Mở decor đầu: giường Pip |

Không ads trong 20 level đầu; wall đầu ở 18, breather 19-20 (chi tiết ở `level-design-rules.md` sau).

---

## 7. Rủi ro và câu hỏi mở

### 7.1 Rủi ro

| Rủi ro | Mức | Bằng chứng | Giảm thiểu / đo |
|---|---|---|---|
| Mèo + bưu điện cozy trùng game khác | Trung | `[STORE]` Cat Mail Co. (Steam 7/2026), Catto's Post Office | Cư dân là người; Pip là mèo duy nhất; cân nhắc đổi thành chim (7.3) |
| Flavor text làm chậm session | Thấp | Chưa có data | `letter_skip_rate`, `letter_screen_time`; nếu skip > 60% thì giảm tần suất còn 1/3 level |
| Cute bị 35+ coi là trẻ con | Trung | `[GIẢ THUYẾT]` | Copy test trên creative: "Sort the mail. Pet the cat." vs "Relax and sort" |
| Không có story thì thiếu lý do "xem tiếp gì" | Trung | Merge Mansion, Lily's Garden dùng story làm hook `[MARKET]` | Thay bằng **khu mới + cư dân mới + decor**: hook là "thị trấn còn gì", đo bằng % người mở chapter 2 trong 3 ngày |

### 7.2 Creative test

Sửa **G1** (`positioning` mục 4) thành **4 skin**: postcard / postmaster-engraved / luggage / **postmaster-cute**, $400/skin; skin cute có 3s Pip nhảy lên quầy. Ngưỡng giữ: cute thắng postcard **> 25% CPI**. Nếu cả 2 skin tem thua: postcard là skin, giữ cast + flavor vì không phụ thuộc skin.

### 7.3 Ba điểm cần người dùng quyết

1. **Mascot hint: mèo Pip hay chim bồ câu?** Mèo cute hơn nhưng trùng 2 cozy game PC; bồ câu đúng nghề, ít trùng.
2. **Cư dân là người (đề xuất) hay thú nhân hoá?** Thú cute hơn, dễ vẽ, nhưng đụng vibe Animal Crossing / Cat Mail Co. và khó ra "người lớn".
3. **Scope decor MVP: 1 phòng decor cố định (đề xuất) hay chọn 1/3 mẫu từ launch?** Chọn mẫu tăng sở hữu nhưng gấp 3 art.

---

## 8. Tên game

### 8.1 Check `[STORE]` (3 query WebSearch, 28/09/2026)

| Tìm | Kết quả | Ảnh hưởng |
|---|---|---|
| "Little Post Office" game | Không có app tên chính xác trên Play/App Store. Gần: **Lil' Post Office** (Funbly, iOS id1614898084, sim), **Mini Post Office** (Play, arcade sort kiện) | Chưa bị chiếm nguyên văn; gần âm với Lil' Post Office; PO check trademark (G2) |
| cozy post office game | Cat Mail Co., Catto's Post Office (PC); Post Office Empire, Post Office: Idle Game, Kids post office (mobile) | "Post office" mobile toàn sim/idle/trẻ em; chưa có association solitaire |

### 8.2 Năm gợi ý

| # | Tên | Ưu | Nhược |
|---|---|---|---|
| 1 | **Little Post Office: Sort & Chill** | Đúng hướng, "chill" nói đúng tone | Gần "Lil' Post Office" |
| 2 | **Cozy Sort: Little Post Office** | "Cozy" là keyword đang lên `[STORE]`; "sort" mô tả gameplay | Nhiều app "Cozy" |
| 3 | **Pip's Post: Cozy Sort** | Mascot trong tên | Đổi mascot thì mất tên |
| 4 | **Wren Hollow Post** | Khác biệt, ấm | Không mô tả gameplay, CPI có thể cao |
| 5 | **Tiny Mail Town: Cozy Sort** | Cute + thị trấn + sort | Gần "Mini Post Office" |

Đề xuất: #1 làm title, "Wren Hollow" làm tên thị trấn trong game. PO chốt sau G2.
