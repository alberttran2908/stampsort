# Concept pitch: Little Post Office

**Tác giả:** game-designer agent · **Ngày:** 2026-09-28 · **Trạng thái:** concept, chờ người dùng chốt 3 điểm ở mục 7.4

**Bối cảnh:** người dùng chọn hướng Postmaster (`theme-stamp.md` mục 3) và bổ sung: "có câu chuyện 1 chút, cute 1 chút thì tốt". Tài liệu này giữ nguyên core Solitaire Associations (4 category ẩn, tableau, moves; `teardown-stamp-solitaire.md` mục 2-3), giữ theme tem/bưu điện, nhưng đổi tone từ "vintage engraved nghiêm túc" sang **cozy, cute, narrative nhẹ**. Decision gate G1-G4 trong `positioning-stamp-vs-alt.md` mục 4 vẫn áp dụng, có đề xuất sửa G1 ở mục 7.2.

**Nhãn nguồn:** `[STORE]` snippet store/WebSearch 28/09/2026; `[MARKET]` case study/bài viết ngành; `[PLAY]` review người chơi; `[GIẢ THUYẾT]` suy luận của designer. Không có số liệu demographic thật, mọi nhận định về audience là `[GIẢ THUYẾT]` trừ chỗ ghi khác.

---

## 1. High concept và pillars

**High concept (3 câu):** Bạn là nhân viên mới của bưu điện nhỏ ở thị trấn Wren Hollow, mỗi ngày phân loại thư vào đúng hộc của cư dân bằng luật Solitaire Associations. Mỗi lá thư giao xong hé lộ 1-3 câu về cuộc sống của người nhận, và một lá thư thất lạc 30 năm dẫn bạn đi qua từng khu, từng mùa của thị trấn. Không timer, không ad giữa level, không "thua": thư chỉ bị trễ, và bạn luôn được giao lại.

| # | Pillar | Là gì | Không phải là |
|---|---|---|---|
| P1 | **Sort, đừng đoán** | Thử thách nằm ở thứ tự lật/dời card và ngân sách moves; category là "hộc thư" đọc được từ hình trong 2 giây | Không phải trivia; không có category cần kiến thức (thủ đô, năm) |
| P2 | **Thư là phần thưởng** | Xong level = giao thư = đọc 1-3 câu; story là dessert sau mỗi level, không phải bữa chính | Không phải visual novel; không cutscene, không dialogue tree, không chặn input |
| P3 | **Cute ấm, không trẻ con** | Nhân vật tròn, gouache mềm, hài hước nhẹ kiểu người lớn (bà chủ tiệm bánh buôn chuyện, ông thợ đồng hồ khó tính) | Không phải game cho trẻ em; không mascot hét, không màu neon, không "kawaii" quá đà |
| P4 | **Tử tế với người chơi** | Undo miễn phí, fail không mất gì ngoài thời gian, ad chỉ khi người chơi tự chọn | Không phải ABI: không interstitial trong gameplay (`teardown` mục 5, 9 `[PLAY]`) |

---

## 2. Tone và art direction "cute"

### 2.1 Tham chiếu phong cách (mood only, không dùng IP)

| Trục | Tham chiếu | Lấy gì | Không lấy gì |
|---|---|---|---|
| Kết cấu | Storybook gouache/watercolor, giấy kem có vân | Nét cọ mềm, viền dày màu nâu ấm thay vì đen | Gradient AI bóng, flat vector rực như ABI (`teardown` mục 8 `[STORE]`) |
| Thế giới | Cozy town kiểu Animal Crossing / Cozy Grove / Dorfromantik | Thị trấn nhỏ, nhà mái dốc, mỗi cư dân một cửa tiệm | Mô hình nhân vật thú (tránh trùng Animal Crossing và Cat Mail Co., xem 7.3) |
| Nhân vật | Ghibli-adjacent, người thật tỉ lệ thấp | Cư dân là **người**, biểu cảm bằng lông mày và miệng, không thoại lồng tiếng | Big-eye anime |

### 2.2 Thông số art

| Yếu tố | Quy tắc | Lý do |
|---|---|---|
| Tỉ lệ nhân vật | Cư dân **2.5 đầu**, tay ngắn, đầu tròn; Pip (mèo) 2 đầu | Đọc được ở portrait 96 px trên màn hình thư; vẽ nhanh, AI + retouch được |
| Palette nền | Giấy kem #F4EBD9, gỗ ấm, xanh rêu, nâu sepia nhạt | Làm nền trung tính để 6 màu mực tem nổi |
| 6 màu mực tem | coral, sky blue, sage, butter yellow, lavender, cocoa (pastel nhưng bão hoà ≥ 60%) | Early game nhận category bằng màu như `theme-stamp.md` 3.1, nhưng ấm hơn engraved |
| Card | Phong bì nhỏ, tem chiếm **≥ 60% diện tích**, 1 motif/tem, không chữ nhỏ, răng cưa mềm | **Gate G3 readability**: card 120 px, 3 giây, early ≥ 85%, mid ≥ 65% (`positioning` mục 4; `theme-options` mục 4) |
| Motif | Silhouette rõ, đường viền dày 3 px ở 120 px | Cute có xu hướng "tròn hoá" mọi thứ khiến cú và mèo giống nhau; phải test cặp dễ nhầm |
| Icon | Hộp thư đỏ có Pip ngồi trên, hoặc tay đưa phong bì qua quầy | Không có hình tem/chữ "stamp" (điều kiện 1, `theme-stamp.md` mục 1) |

### 2.3 Vì sao cute không mâu thuẫn với nữ 35+

- `[MARKET]` Các title casual top-grossing kết hợp **story + nhân vật cute + puzzle**: Gardenscapes/Homescapes (Playrix, Austin), Lily's Garden (Tactile), Merge Mansion (Metacore, Maddie và bà), Royal Match (Dream Games, King Robert). Cả nhóm này được ngành mô tả là có audience chủ yếu nữ trưởng thành. Số % chính xác theo tuổi: chưa có nguồn trong repo, coi là `[GIẢ THUYẾT]` cho tới khi PO lấy từ Sensor Tower/AppMagic.
- `[GIẢ THUYẾT]` Tệp 35+ không từ chối "cute", họ từ chối "trẻ con": khác nhau ở **giọng viết** (hài người lớn) và **nhịp** (không mascot hét). Cozy Grove và Unpacking cute nhưng kể về mất mát, chuyển nhà. Ranh giới P3: cute ở **hình**, người lớn ở **chữ**.

---

## 3. Câu chuyện nhẹ

### 3.1 Cấu trúc kể chuyện

| Tầng | Đơn vị | Tần suất | Dài | Hình thức |
|---|---|---|---|---|
| Thư (micro) | 1 đoạn thư 1-3 câu | mỗi level | ≤ 40 từ EN | Card thư hiện trên màn hình win, trước reward, tap để đóng |
| Beat khu (mid) | 1 sự kiện của 1 cư dân | mỗi 4-5 level | 2 card thư liên tiếp | Portrait cư dân + 1 sticker mới trong bưu điện |
| Chapter (macro) | 1 khu/mùa, 4-6 cư dân, 1 manh mối thư thất lạc | mỗi 20-25 level | 1 ảnh tĩnh + 3 câu | Mở khu mới trên bản đồ, decor mới |
| Tuyến chính | Lá thư thất lạc 30 năm, ai gửi, gửi cho ai | 1 manh mối/chapter | | Kết ở chapter 6 (~150 level), sau đó tuyến mới |

### 3.2 Cast (7 nhân vật)

| Tên | Vai | Tính cách (1 dòng) | Quan hệ |
|---|---|---|---|
| **Otto** | Postmaster già, sắp nghỉ hưu | Ấm, hay quên, giấu chuyện cũ sau nụ cười | Mentor của người chơi; giữ hộc "thư không địa chỉ" 30 năm |
| **Pip** | Mèo bưu điện | Lười, kiêu, chỉ đường khi thấy tiện | Mascot hint; ngủ trên bao thư của Bo |
| **Bà Marigold** | Chủ tiệm bánh | Buôn chuyện nhưng tốt bụng, gửi công thức cho cả thị trấn | Biết mọi bí mật trừ bí mật của chính mình |
| **Ông Finch** | Thợ đồng hồ | Khó tính, đúng giờ, than thư trễ | "Đối thủ" hài của người chơi; hoá ra đặt hàng quà cho cháu |
| **Lina** | Chủ tiệm hoa, 20s | Lo lắng, viết thư cho penpal nước ngoài chưa từng gặp | Cháu của Ines; tuyến phụ về dũng cảm |
| **Thuyền trưởng Bo** | Cựu thuỷ thủ, sống ở hải đăng | Cộc, ít nói, tay run khi cầm bút | Người viết lá thư thất lạc |
| **Bà Ines** | Chủ quán trà trên đồi | Điềm tĩnh, nhớ tất cả, không hỏi | Người nhận lá thư thất lạc; bạn cũ của Otto và Bo |

Người chơi: không tên, không giới tính, không portrait; cư dân gọi là "cháu"/"bạn mới" (EN: "new hire"). Mọi tên ≤ 8 ký tự, dễ đọc ở mọi ngôn ngữ.

### 3.3 Outline 3 chapter đầu

| Chapter | Khu / mùa | Level | Cư dân | Beat theo level | Manh mối tuyến chính |
|---|---|---|---|---|---|
| 1. Phố Chính | Xuân | 1-20 | Otto, Pip, Marigold, Finch | L1 xuống tàu, Otto đưa tạp dề · L3 Pip xuất hiện · L5 Otto tặng tem vàng · L8 Marigold gửi bánh nhầm địa chỉ · L12 Finch than thư trễ · L15 dọn kho, thấy hộc "không địa chỉ" · L18 wall level đầu · L20 Otto: "lá thư đó... để sau" | Phong bì ố, chỉ còn tem hình hải đăng, tên người nhận nhoè |
| 2. Bến Cảng | Hè | 21-45 | Bo, Lina, Marigold (khách) | L21 mở đường ra cảng · L25 Bo từ chối nhận thư · L30 Lina nhờ gửi thư penpal, run tay · L35 Pip ngủ trên bao thư của Bo, lộ bút mực xanh giống lá thư cũ · L40 wall · L45 Bo: "Ngày xưa tôi có viết một lá..." | Mực xanh + nét chữ khớp; Bo là người gửi |
| 3. Đồi Trà | Thu | 46-70 | Ines, Lina, Finch (khách) | L46 lên đồi, Ines mời trà · L50 Lina nhận thư hồi âm đầu tiên · L55 Finch mua đồng hồ cũ của Ines, thấy tên khắc · L60 Ines kể về hải đăng thời trẻ · L65 wall · L70 người chơi cầm lá thư, chưa đưa: "Có nên không?" (không phải choice, chỉ là beat) | Ines là người nhận; Otto biết từ đầu |

Chapter 4-6 (chưa viết chi tiết): Vườn Táo (đông), Ga Tàu, Hải Đăng (kết: giao thư, Otto nghỉ hưu, người chơi thành Postmaster; mở tuyến 2 "thư từ nước ngoài" = category nước hư cấu như `theme-stamp.md` 3.2).

### 3.4 Sáu đoạn thư mẫu (giọng chuẩn)

| # | Từ → Đến | Nội dung (bản EN để localize; bản VN dưới) |
|---|---|---|
| 1 | Marigold → Finch | "Your clock is three minutes fast. Your bread was three minutes late. We're even." / "Đồng hồ ông nhanh ba phút. Bánh của tôi trễ ba phút. Hoà." |
| 2 | Otto → người chơi | "Pip only helps when she feels like it. Same as me at your age." / "Pip chỉ giúp khi nó thích. Hồi bằng tuổi cháu, tôi cũng vậy." |
| 3 | Lina → penpal | "I planted the seeds you sent. Nothing yet. I check every morning anyway." / "Tớ đã gieo hạt cậu gửi. Chưa lên gì. Sáng nào tớ cũng ra xem." |
| 4 | Finch → cháu (Momo) | "Do not open before Sunday. I will know." / "Chưa Chủ nhật thì chưa được mở. Ông biết hết đấy." |
| 5 | Bo → (không địa chỉ, 30 năm) | "The light still turns. I still look at the hill." / "Đèn vẫn quay. Tôi vẫn nhìn về phía đồi." |
| 6 | Ines → Otto | "You kept it all these years. Bring the new one for tea. Bring the cat too." / "Ông giữ nó chừng ấy năm. Dẫn đứa mới lên uống trà. Dẫn cả con mèo." |

### 3.5 Quy tắc viết

| Quy tắc | Giá trị | Lý do |
|---|---|---|
| Độ dài | ≤ 40 từ EN, 1-3 câu; tiêu đề ≤ 3 từ | Đọc trong 4 giây, ngang animation reward |
| Skip | Tap bất kỳ đâu để đóng; setting "Tự động đóng thư sau 3s"; lịch sử đọc lại trong Album | Không chặn người chỉ muốn chơi; đo skip rate (mục 7.3) |
| Không chặn gameplay | Thư không bao giờ hiện **trước** level; wall level không có story beat để không đổ lỗi story cho fail | Tách cảm xúc thắng/thua khỏi story |
| Localization | Không chơi chữ, không idiom, không rhyme; tên riêng không dịch; ICU placeholders cho tên; không text trong art (tem, biển hiệu dùng ký hiệu) | Giảm chi phí dịch 8-10 ngôn ngữ |
| Giọng | Hài khô, ấm, không cảm thán, không emoji; nỗi buồn chỉ ám chỉ | P3: cute ở hình, người lớn ở chữ |
| Không phụ thuộc thứ tự | Mỗi thư đọc một mình vẫn hiểu; beat nối chỉ qua 2 card liên tiếp | Người skip 10 thư vẫn theo được tuyến chính |

---

## 4. Story bám vào core loop

| Hành động gameplay | Ý nghĩa fiction | Người chơi cảm thấy | Bán được? |
|---|---|---|---|
| 4 category slot | 4 **hộc thư** của 4 cư dân/địa chỉ trong khu (mặt hộc có portrait nhỏ) | "Tôi đang xếp cho ai đó", không phải "nhóm trừu tượng" | Không |
| Đặt card đúng category | Bỏ thư vào hộc, hộc rung nhẹ, dấu hủy nhỏ đập | Tick nhỏ | |
| Hoàn thành 1 category (đủ 4) | **Giao thư**: Pip/xe đẩy mang bó thư đi, portrait cư dân mỉm cười | Khoảnh khắc "satisfying" chính (`teardown` mục 8) | |
| Xong level | Cư dân hồi âm: card thư 1-3 câu | Relief + tò mò | |
| Draw deck | Chuyến xe thư tiếp theo tới | Rủi ro "noise" như template (`teardown` 3.1 `[STORE]`) | |
| Moves | **Giờ làm việc** trong ngày (đồng hồ của Finch trên HUD) | Tension mềm, không phải "bị bóp" | |
| Hết moves | **Thư bị trễ**: xe đẩy quay về, không mất gì, "Mai giao tiếp" = retry | Không có từ "thua", "fail", "lose" trong UI | Điểm bán chính, xem dưới |
| Joker | **Tem vàng của Postmaster**: Otto ký tay, thư vào bất kỳ hộc nào | An toàn tuyệt đối như ABI Golden Stamp (`teardown` 3.3 `[STORE]`) | Có |
| Hint | **Pip chỉ đường**: mèo ngồi lên card nên đi | | Có (Pip đòi cá) |
| Undo | **Return to Sender**: 3 lần miễn phí/level, dấu đỏ trên card | Thử-sai không sợ | Lần 4+ bán |
| Shuffle card úp | **Lắc bao thư** | | Có |
| Xem tên 1 category | **Sổ của Otto**: mở 1 trang | Cứu khi đoán sai | Có |

### 4.1 Booster bán được mà vẫn trong fiction

| Booster | Fiction | Khi nào | Loại |
|---|---|---|---|
| Tem vàng (Joker) | Otto ký | Trong level | Coin / rewarded ad / bundle |
| Pip chỉ đường (Hint) | Cho Pip cá | Trong level | Coin |
| Thêm giờ (+5 moves) | "Làm thêm ca tối", đèn bưu điện bật | Khi thư trễ | Coin / rewarded ad (điểm fail duy nhất có ad, `teardown` mục 10 hướng 3) |
| Cà phê sáng (pre-level) | +3 moves từ đầu | Trước level, sau khi trễ 2 lần | Coin |
| Pip trực sớm (pre-level) | 1 category hiện tên từ đầu | Trước level | Coin |

Giá và số free: PO chốt. Nguyên tắc: mọi booster mang tên nhân vật hoặc hành động thật ở bưu điện; không "Power-up", "Bomb", "Rocket". Shuffle ("Lắc bao thư") và undo lần 4+ bán bằng coin nhỏ.

---

## 5. Meta

| Hệ thống | Mô tả | Mục đích | MVP? | Đo bằng |
|---|---|---|---|---|
| **Bưu điện nhỏ (decor)** | 1 phòng, 6-8 slot decor/chapter (quầy, ghế, cây, đèn, bảng thông báo, giường của Pip). Mở bằng **Tem Điểm** kiếm từ level (1-3/level theo sao). MVP: mỗi slot 1 mẫu cố định; post-launch: chọn 1 trong 3 mẫu kiểu Homescapes | Lý do "về nhà" giữa level; screenshot đẹp | **MVP** (1 phòng, decor cố định) | % người chơi mở màn hình bưu điện/ngày; D7 nhóm có ≥ 3 decor |
| **Album theo cư dân/khu** | Mỗi cư dân 1 trang, 8-12 ô; tem bóc từ thư giao đúng rơi vào ô. Đủ trang = đọc lại toàn bộ thư của cư dân đó + 1 sticker | Collection; kho lưu story cho người skip | **MVP** | % DAU mở album; trang hoàn thành/người |
| **Tem hiếm** | 1-3% card là tem "lỗi in đáng yêu" (Pip in ngược), là Joker trong level, ô riêng trong album (`theme-stamp.md` 3.3) | Reward biến thiên trong core | **MVP** (chỉ Joker + ô album; chưa có Mint/Fine/Poor) | Tỉ lệ dùng Joker |
| **Daily Post + streak** | 1 level tay/ngày, tem có dấu ngày thật; 7 ngày liên tiếp = tem hiếm + 1 thư đặc biệt từ cư dân ngẫu nhiên | ABI thiếu daily/streak (`teardown` mục 6) | **MVP** | D1/D7 nhóm hoàn thành daily |
| **Sự kiện mùa** | 4 mùa = 4 event 10-14 ngày: Thiệp Tết, Thư Tình, Bưu thiếp Hè, Đèn Thu; category theo mùa, decor theo mùa | LiveOps | Post-launch (event 1 sau launch 4-6 tuần) | Tham gia/DAU |
| **Trang phục Pip** | Khăn quàng, mũ đưa thư | Cosmetic IAP rẻ | Post-launch | Conversion |
| **Dấu hủy hold-and-release** | Như `theme-stamp.md` 3.4, tuỳ chọn, auto mặc định | Skill expression | Post-launch, A/B | % tắt auto-cancel |

Decor **không** cho perk gameplay (khác `teardown` mục 10 hướng 2) để tránh power creep; PO có thể đổi nếu cần điểm bán thêm.

---

## 6. FTUE: 5 level đầu

| Level | Thông số `[GIẢ THUYẾT]` | Dạy gì | Story beat | Thư mở |
|---|---|---|---|---|
| 1 | 2 category, 8 card, 2 cột, 0 úp, moves = optimal + 6 | Kéo card lên hộc; category hiện tên sẵn (Marigold, Finch) | Xuống tàu, Otto đưa tạp dề và nói "Hai hộc thôi, hôm nay nhẹ" | Otto: "Đừng lo về con mèo. Nó lo về cháu rồi." |
| 2 | 3 category, 12 card, 3 cột, 2 úp | Lật card úp; category **ẩn**, hiện tên khi đặt card đầu | Marigold ghé, để lại bánh | Marigold: thư #1 (mục 3.4) |
| 3 | 3 category, 14 card, 3 cột, 3 úp, có deck | Draw deck; Pip xuất hiện lần đầu, chỉ 1 hint miễn phí | Pip nhảy lên quầy | Otto: thư #2 |
| 4 | 4 category, 16 card, 4 cột, 4 úp | Dời card giữa cột; **Return to Sender** (undo) khi người chơi đặt sai lần đầu | Finch vào than thư trễ, ra ngoài | Finch: "Ba phút. Tôi đếm." |
| 5 | 4 category, 16 card, 4 cột, 5 úp, moves = optimal + 3 | **Tem vàng**: Otto tặng 1, tutorial gợi ý dùng nhưng **không ép** (tránh phàn nàn ABI `[PLAY]` `teardown` 3.4) | Otto: "Tem này tôi ký. Dùng khi kẹt, đừng dùng cho vui." | Mở decor slot đầu tiên: giường Pip |

Không ads trong 20 level đầu. Level 6-20 tăng card úp và độ "gần nghĩa" (Chim vs Máy bay); wall đầu ở 18, breather 19-20 (chi tiết ở `level-design-rules.md` sau).

---

## 7. Rủi ro và câu hỏi mở

### 7.1 Chi phí story và localize `[GIẢ THUYẾT]`

| Hạng mục | Ước lượng launch (3 chapter, 70 level) | Ghi chú |
|---|---|---|
| Thư | 70 thư × ≤ 40 từ ≈ 2.800 từ EN + 6 chapter card ≈ 300 từ | 1 writer, 1-2 tuần kể cả rewrite |
| Localize | ~3.100 từ × 9 ngôn ngữ | Rẻ vì quy tắc 3.5; rủi ro là **giọng** hài khô mất khi dịch máy; cần 1 native review/ngôn ngữ cho 20 thư đầu |
| Art nhân vật | 7 portrait × 3 biểu cảm | 2.5 đầu, AI + retouch |
| Nợ content | Mỗi 20-25 level cần 1 chapter mới với 4-6 cư dân | Pipeline phải sản xuất 1 chapter/3-4 tuần sau launch; nếu không kịp, level 70+ chạy generator không story (chấp nhận được vì P2: story là dessert) |

### 7.2 Cute vs vintage trong creative test

Đề xuất sửa **G1** (`positioning` mục 4): test **4 skin** thay vì 3: postcard / postmaster-engraved / luggage / **postmaster-cute (Little Post Office)**, cùng gameplay 15s, $400/skin → tổng ~$1.600. Skin cute có thêm 3s đầu Pip nhảy lên quầy để test hook nhân vật. Ngưỡng giữ nguyên: cute phải thắng postcard **> 25% CPI** để chốt (PO đã siết vì rủi ro clone; art cute cũng tốn hơn engraved ở phần nhân vật). Nếu cute và engraved cùng thua postcard: về hướng "postcard là skin, Postmaster là chiều sâu" (`theme-stamp.md` mục 4) và **giữ story + cast** vì story không phụ thuộc skin.

### 7.3 Rủi ro khác

| Rủi ro | Mức | Bằng chứng | Giảm thiểu |
|---|---|---|---|
| Thị trấn cozy + mèo + bưu điện trùng vibe game khác | Trung | `[STORE]` Cat Mail Co. (Steam, 7/2026) và Catto's Post Office đều là mèo + bưu điện cozy; Cozy Grove, Animal Crossing là thú | Cư dân là **người**; Pip là mèo duy nhất; cân nhắc đổi Pip thành chim (mục 7.4) |
| Story làm chậm session | Trung | Chưa có data | Đo `letter_screen_time` và `letter_skip_rate`; mục tiêu thời gian màn hình thư ≤ 5s median, skip ≤ 40%. Nếu skip > 60%: chuyển thư sang tần suất 1/3 level |
| Cute bị 35+ coi là "trẻ con" | Trung | `[GIẢ THUYẾT]` | Copy test 2 câu trên creative: "Sort the mail. Read the gossip." vs "Help the town" |
| Category "hộc theo cư dân" giới hạn kho category | Thấp-trung | Mỗi khu chỉ 4-6 cư dân | Hộc = cư dân **hoặc** loại thư (bưu thiếp, bưu kiện, thiệp) hoặc motif tem; cư dân chỉ là "chủ hộc" khi có story beat |

### 7.4 Ba điểm cần người dùng quyết

1. **Mascot hint: mèo Pip hay chim bồ câu?** Mèo thân thiện hơn nhưng trùng 2 game cozy PC; bồ câu đúng nghề hơn, ít trùng, kém cute hơn.
2. **Tuyến chính bittersweet (thư thất lạc 30 năm, Bo và Ines) hay thuần nhẹ (thị trấn chuẩn bị lễ hội)?** Bittersweet cho share/screenshot tốt, nhưng tăng rủi ro giọng khi dịch.
3. **Scope decor MVP: 1 phòng decor cố định (đề xuất) hay có chọn 1/3 mẫu ngay từ launch?** Chọn mẫu tăng cảm giác sở hữu nhưng gấp 3 art.

---

## 8. Tên game

### 8.1 Kết quả check `[STORE]` (3 query WebSearch, 28/09/2026)

| Tìm | Kết quả | Ảnh hưởng |
|---|---|---|
| "Little Post Office" game | Không có app nào tên chính xác này trên Play/App Store trong snippet. Tên gần: **Lil' Post Office** (Funbly, iOS id1614898084, sim chạy bưu điện), **Mini Post Office** (Play, `com.minipostomat.officeposT`, arcade sort kiện hàng) | Tên chưa bị chiếm nguyên văn; nhưng "Lil' Post Office" gần về âm, rủi ro nhầm trên App Store search. Cần PO kiểm tra trademark |
| "Little Post Office" app | Ngoài Lil' Post Office, chỉ có bài Wikipedia về toà nhà lịch sử "Little Post Office" (Martinsville, VA) và app USPS | Không có trademark game rõ ràng trong snippet |
| cozy post office game | Cat Mail Co. (Steam), Catto's Post Office (PC), Post Office Empire, Post Office: Idle Game (iOS), Kids post office, Post office game: Professions | "Post office" trên mobile toàn sim/idle/trẻ em; **chưa có association solitaire** nào, khớp `theme-stamp.md` mục 2 ghi chú G |

### 8.2 Năm gợi ý

| # | Tên | Ưu | Nhược |
|---|---|---|---|
| 1 | **Little Post Office: Sort & Story** | Đúng hướng người dùng chọn; "post office" trống trong subgenre | Gần "Lil' Post Office" |
| 2 | **Pip's Post: Letter Sort Puzzle** | Nhân vật trong tên, cute rõ | Nếu đổi mascot thì mất tên; "Pip" ngắn, khó rank |
| 3 | **Cozy Post: Sort & Deliver** | "Cozy" là keyword đang lên `[STORE]` (bài cozy mobile 2026) | Chung chung, dễ bị nhiều app "Cozy" đè |
| 4 | **Dear Wren Hollow** | Có story, khác biệt, screenshot đẹp | Không mô tả gameplay; CPI có thể cao |
| 5 | **Tiny Mail Town: Sort Puzzle** | Nói được cả cute + thị trấn + sort | "Tiny"/"Mini" đã có Mini Post Office |

Đề xuất designer: #1 làm title, #4 làm tên thị trấn/subtitle trong game. PO chốt sau G2 (trademark + ASA popularity cho "post office", "cozy", "letter sort").
