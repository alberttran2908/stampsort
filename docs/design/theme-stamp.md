# Theme stamp: giữ tem thì sao, và làm thế nào để khác ABI

**Tác giả:** game-designer agent · **Ngày:** 2026-09-28 · **Trạng thái:** bản đầu

**Câu hỏi:** `theme-options.md` đã khuyến nghị postcard. Nếu vẫn giữ theme tem thì có làm được không, và khác Stamp Solitaire (ABI) bằng cách nào?

**Nhãn nguồn:** phần lớn là `[GIẢ THUYẾT]`. Bằng chứng về ABI lấy từ `docs/design/teardown-stamp-solitaire.md` (mục 3, 6, 9) và `docs/product/competitor-stamp-solitaire.md` (mục 1, 2). ASO kiểm tra bằng 2 query WebSearch ngày 28/09/2026 (`[STORE]`). Bộ tiêu chí A-H lấy nguyên từ `theme-options.md` mục 1.

---

## 1. Đánh giá thẳng: giữ tem được không?

| | Điểm mạnh | Điểm yếu |
|---|---|---|
| Thị trường | ABI đã validate một phần: ~370K tải Android trong ~7 tuần, rating 4.6-4.7 `[STORE]` competitor mục 2 | Keyword "stamp solitaire" và "stamp match" đã thuộc ABI (2 app) `[STORE]` teardown S1, S7; ta vào sau, search "stamp" hiện ABI trước |
| Content | Category cực phong phú và có thật (quốc gia, năm, chủ đề, mệnh giá) | Người chơi đã thấy "tem trong game association", khó tạo cảm giác mới |
| Audience | Philately là hobby thật, tệp 45+ US/EU, hoài cổ, trung tính giới | Chính là tệp ABI đang mua; đấu CPI trực diện trên cùng creative |
| Art | Art AI dễ: 1 motif + 1 khung + răng cưa | Icon/creative gần trùng (hình chữ nhật răng cưa); dễ bị coi là clone |
| Design | Tem gắn tự nhiên với album, dấu bưu điện, phong bì, nhiều "đồ chơi" cho twist | ABI meta mỏng nhưng vẫn có album + 2 event (teardown mục 6); nếu ta chỉ "tem đẹp hơn" thì không có lý do để đổi game |

**Kết luận `[GIẢ THUYẾT]`:** giữ tem **được**, với 4 điều kiện, thiếu một là không nên:

1. **"Stamp" không là danh từ chính của tên và icon.** Tên bắt đầu bằng vai trò/nơi chốn (postmaster, post office); icon là hành động (tay đóng dấu hủy, hộp thư), không phải một con tem.
2. **Có sub-fantasy rõ** khác "người sưu tầm tem" của ABI, thấy được trong 3 giây đầu creative.
3. **Art direction ngược với ABI**: ABI flat, sạch, rực; ta khắc 1-2 màu, giấy ố, dấu hủy đè.
4. **Meta dày hơn ABI ngay từ launch**, vì đây là điểm ABI yếu nhất (teardown mục 6/9).

---

## 2. Năm sub-fantasy của tem

| # | Sub-fantasy | Fantasy và cách chia category | Twist gameplay | Khác ABI thế nào |
|---|---|---|---|---|
| a | **Philatelist thật** | Kế thừa album của ông, săn tem hiếm/lỗi in. Category: quốc gia hư cấu × thời kỳ × chủ đề | Card **lỗi in** hiếm dùng như Joker, vào album ở ô riêng; **kính lúp** = hint in-fiction | Sâu hơn ("săn" thay vì "xem"), nhưng nhìn từ xa vẫn là tem |
| b | **Passport stamps** | Hành trình du lịch, mỗi trang hộ chiếu là một chuyến. Category: quốc gia, loại visa, phương tiện | Hình dấu (tròn/vuông/lục giác) là trục phụ; đủ trang = đóng dấu cả trang | Khác hẳn về hình nhưng dấu đơn sắc, chữ nhỏ → **fail gate C** ở 120 px |
| c | **Bưu điện cổ điển** | Người chơi là **postmaster** thị trấn nhỏ 1900-1950, phân loại thư đến vào hộc. Category = hộc: tuyến (biển, tàu, hàng không), vùng, motif tem | **Dấu hủy**: đủ 4 thì tự đập dấu (haptic); "Return to sender" = undo; thư express = +moves | Vai trò chủ động (làm việc) thay vì thụ động (sưu tầm); tem là công cụ, icon/creative khác hẳn |
| d | **Tem là bằng chứng story** | Thư tình/gia phả, mỗi chương mở qua sắp xếp thư. Category theo người gửi, năm, địa điểm | Xong level mở đoạn thư (narrative reward) | Cảm xúc mạnh nhất nhưng content đắt, category bị bó bởi story → **fail B** |
| e | **Rubber stamp / triện Á Đông** | Bàn làm việc, bộ con dấu, mực đỏ. Category: chữ triện, hình ấn, dấu văn phòng | Ấn dấu = juice tốt | Rất khác ABI nhưng đơn sắc, khó đọc; triện chỉ hợp thị trường Á → **fail C** |

**Chấm nhanh `[GIẢ THUYẾT]`** (1-5, tổng 40, gate B/C/F ≤ 2 loại):

| # | A | B | C | D | E | F | G | H | Tổng | Gate |
|---|---|---|---|---|---|---|---|---|---|---|
| a Philatelist | 5 | 5 | 4 | 5 | 4 | 4 | **1** | 4 | 32 | OK, G thấp nhất |
| b Passport | 4 | 3 | **2** | 4 | 4 | 4 | 4 | 4 | 29 | Fail C |
| c Post office | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | **34** | OK |
| d Narrative | 5 | **2** | 3 | 3 | 2 | 4 | 4 | 5 | 28 | Fail B |
| e Rubber stamp | 3 | 3 | **2** | 2 | 5 | 5 | 5 | 2 | 27 | Fail C |

Ghi chú G `[STORE]`: query "passport stamp puzzle" và "post office sorting game" chỉ trả về Stamp Solitaire/Stamp Match, solitaire sort chung, game trẻ em (Post Office - Neighborhood Mail Carrier, Amazon), web game (PrimaryGames, Novel Games) và cozy game PC (Cat Mail Co., Steam). Chưa có association solitaire nào chiếm "post office"/"postmaster" trên mobile → G = 4. Philatelist thuần đụng thẳng ABI → G = 1.

Điểm 34 của (c) thấp hơn postcard (35) đúng 1 điểm, thắng ở G, thua ở D và H.

---

## 3. Hướng tem cụ thể: "Postmaster" (c) với meta philatelist (a)

Gộp (c) làm **core fantasy** (vai trò, creative, icon) và (a) làm **meta**: mỗi lá thư phân loại xong, tem trên phong bì được "bóc" vào album cá nhân.

### 3.1 Art direction: đối lập với ABI

| Yếu tố | ABI (`[STORE]`/`[PLAY]` teardown mục 8: AI, colorful, clean) | Ta `[GIẢ THUYẾT]` |
|---|---|---|
| Kỹ thuật | Flat, nhiều màu, gradient AI | **Khắc kim loại (engraved)** 1-2 màu mực trên giấy kem, như tem 1900-1950 |
| Khung | Răng cưa vẽ sạch | Răng cưa **die-cut lệch**, góc rách, hinge dán mặt sau |
| Bề mặt | Sạch | Giấy ố, mực lệch bản, foxing nhẹ |
| Lớp phủ | Không | **Dấu hủy** tròn đè 1/4 tem (ngày, tên thị trấn), nét bút mực xanh |
| Card | Tem = card | Card = **phong bì nhỏ**, tem chiếm ~60% diện tích để đọc được ở 120 px; địa chỉ viết tay là décor |
| Màu | Rực | 6 màu mực (carmine, Prussian, olive, sepia, tím, đen); early game nhận category bằng màu mực |

### 3.2 Bộ category ví dụ (9 bộ, tên nước hư cấu để tránh IP)

| Category | Item (motif khắc) | Tier |
|---|---|---|
| Chim | sẻ, cú, hạc, công, bồ câu đưa thư | 1, mực olive |
| Tàu biển | tàu buồm, tàu hơi nước, phà, tàu phá băng | 1, Prussian |
| Hoa | tulip, hồng, sen, lavender, anh đào | 1, carmine |
| Đầu máy xe lửa | hơi nước, điện, funicular, monorail đời đầu | 2 |
| Máy bay đời đầu | biplane, khinh khí cầu, zeppelin, thuỷ phi cơ | 2 (wall với Tàu biển + Xe lửa: cùng "phương tiện") |
| Kiến trúc | hải đăng, cầu, nhà thờ, tháp đồng hồ, cối xay gió | 2 |
| Nguyên thủ hư cấu | vua, nữ hoàng, tổng thống, đô đốc (chân dung profile) | 3, phân biệt bằng mũ/huy hiệu |
| Bản đồ & quốc huy | đảo, sư tử, đại bàng, gấu | 3 |
| Thể thao | chạy, bơi, trượt tuyết, đấu kiếm, đua thuyền | 3 (wall với Chim + Máy bay: "bay") |

Trục thứ hai cho late game: **cùng motif khác nước** (Chim của Vestland vs Chim của Solmar, phân biệt bằng khung/màu mực). Đây là cách tăng "gần nghĩa" mà ABI chưa khai thác (review "level 272 không có category mới" `[PLAY]` competitor mục 6).

### 3.3 Meta album: những gì ABI chưa có (teardown mục 6: chỉ album + 2 event, không daily/streak/social)

| Hệ thống | Mô tả | Mục đích | Đo bằng |
|---|---|---|---|
| **Album nước × thời kỳ** | Trang = 1 nước × 1 thập niên, 8-12 ô; tem bóc từ phong bì rơi vào ô | Mở trang mới = bộ category mới trong level (teardown mục 10, hướng 2) | % DAU mở album; D7 |
| **Tem hiếm / lỗi in** | 1-3% card là lỗi in (ngược hình, thiếu màu); là Joker trong level, ô riêng trong album | Reward biến thiên trong core; sink coin ("kính lúp") | Tỉ lệ dùng Joker; conversion kính lúp |
| **Giá trị catalog** | Album có định giá tăng theo tem hiếm và bộ đủ | Số tăng liên tục cho người thích collect | Retention nhóm xem album ≥ 3 lần/ngày |
| **Daily Post** | 1 level tay/ngày, tem có dấu hủy ghi ngày thật; streak 7 = tem hiếm | Daily/streak ABI thiếu | D1/D7 nhóm hoàn thành daily |
| **Stamp Fair cuối tuần** | 48h: đổi tem trùng lấy tem thiếu với NPC | Xử lý tem trùng | Tham gia / DAU |
| **Sổ chuyển giao** | Trang hoàn thành mở 2-3 dòng thư của "ông" (narrative nhẹ từ (d), không bó category) | Cảm xúc, rẻ vì chỉ text | Screenshot/share rate |

### 3.4 Twist gameplay

1. **Dấu hủy (Cancel)**: hộc đủ 4 thì người chơi **giữ và thả** để đập dấu; đúng nhịp (vòng tròn co lại) thì tem bóc sạch hơn, vào album ở chất lượng Mint/Fine/Poor. Không ảnh hưởng thắng/thua, chỉ ảnh hưởng album: thêm skill expression mà không tăng độ khó cho tệp 45+. Có setting auto-cancel.
2. **Return to Sender**: undo in-fiction, 3 lần miễn phí/level (teardown mục 10, hướng 4); thư trả về mang dấu đỏ "RETURN" trong tableau.

### 3.5 Tên gợi ý

*Postmaster: Sort & Collect* · *Little Post Office Solitaire* · *Dead Letter Office: Sort Puzzle*. "Post office" là danh từ chung, không trademark; "Dead Letter" tối hơn, cần test.

---

## 4. So sánh: Postmaster (tem) vs Postcard

| Tiêu chí | Postmaster | Postcard vintage | Nghiêng về |
|---|---|---|---|
| Hiểu trong 1 giây ở creative | Trung bình: "phân loại thư" cần 1 shot giải thích | Cao: ai cũng biết bưu thiếp | Postcard |
| Khoảng cách với ABI (ASO, icon) | Trung bình: khác vai trò/art nhưng vẫn là tem | Cao: không đụng "stamp" | Postcard |
| Giữ tệp Stamp Solitaire ghét ads | Cao | Cao (tem trên bưu thiếp) | Hoà |
| Readability 120 px | 4: motif + màu mực | 4: linen chữ lớn | Hoà |
| Độ dày meta khả thi | Cao: album × hiếm × giá trị × daily có sẵn trong đời thực | Trung bình-cao | Postmaster |
| Twist đặc trưng | Dấu hủy, Return to Sender | Flip mặt sau, postmark DDA | Hoà |
| Chi phí art | Trung bình: engraved khó AI hơn flat | Thấp-trung bình | Postcard |
| Rủi ro bị coi clone / ABI đè UA | Cao | Thấp-trung bình | Postcard |
| Keyword còn trống | "post office"/"postmaster" trống `[STORE]` | "postcard" đã có trong vài solitaire `[STORE]` theme-options mục 2 | Postmaster |

**Khuyến nghị cuối `[GIẢ THUYẾT]`:** **không đổi, postcard vẫn là mặc định.** Postmaster thắng ở meta và keyword trống nhưng thua ở hai thứ quyết định giai đoạn đầu: CPI (hiểu trong 1 giây) và rủi ro đối đầu trực diện ABI.

Chỉ **giữ tem theo hướng Postmaster** nếu đủ 3 điều kiện, PO chốt ngưỡng:

| # | Điều kiện | Cách kiểm |
|---|---|---|
| 1 | Creative test 3 skin (postcard / postmaster / luggage label, cùng gameplay 15s): Postmaster có CPI trong **±10%** của postcard (chặt hơn ±15% thông thường, để bù rủi ro clone) | Test Meta US nữ 30-55 như `theme-options.md` mục 4, thêm 1 biến thể |
| 2 | Icon và tên không có hình tem/chữ "stamp"; readability tem khắc ≥ 85% ở tier 1 | Test 20 người như theme-options mục 4 |
| 3 | Meta mục 3.3 (ít nhất album × hiếm + Daily Post) có ở bản launch, không dồn sang v2 | Backlog PO |

Nếu chỉ đạt 2/3: làm postcard và **mang Postmaster vào postcard làm tầng meta** (tem trên bưu thiếp bóc vào album, dấu hủy khi đủ bộ). Hai hướng không loại trừ nhau: postcard là skin, postmaster là chiều sâu.

---

## 5. Câu hỏi còn mở

1. Tệp 45+ US có thấy "phân loại thư" là công việc (chán) thay vì relax? Test 2 câu copy: "Sort the mail" vs "Complete the album".
2. Dấu hủy hold-and-release có làm người lớn tuổi khó chịu? Đo % bật auto-cancel.
3. Art engraved sinh bằng AI có giữ style qua 200+ tem không, hay cần artist retouch? Ảnh hưởng trực tiếp E.
4. Chưa có `[APK]`: khi dump `com.stamp.solit`, kiểm tra album ABI có bao nhiêu bộ và có "rare" không, để chắc mục 3.3 là chỗ trống thật.
