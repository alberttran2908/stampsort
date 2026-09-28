# Theme options: chọn theme hoài cổ cho template Solitaire Associations

**Tác giả:** game-designer agent · **Ngày:** 2026-09-28 · **Trạng thái:** bản đầu

**Câu hỏi:** Nếu làm game cùng template với Stamp Solitaire (4 category ẩn, tableau + deck, moves limit, meta album sưu tập) thì nên dùng theme gì để giữ được cảm giác hoài cổ như tem?

**Nhãn nguồn:** phần lớn nội dung là `[GIẢ THUYẾT]` từ kinh nghiệm thiết kế, chưa test với người chơi. Chỗ nào có bằng chứng sẽ ghi `[STORE]`/`[PLAY]` kèm URL. Tham chiếu: `docs/design/teardown-stamp-solitaire.md` (mục 2, 6, 10) và `docs/product/competitor-stamp-solitaire.md` (mục 1, 8, 9).

---

## 1. Vì sao "tem" hoạt động với template này

Template Solitaire Associations gốc dùng **word card** (Hitapps, PlaySimple). ABI thay bằng tem và được khen "pictures are really easy to recognize", "graphics" `[PLAY]` review App Store (xem competitor doc mục 6). Phân tích 6 đặc tính khiến tem "khớp" template `[GIẢ THUYẾT]`:

| # | Đặc tính của tem | Nó phục vụ phần nào của template |
|---|---|---|
| 1 | **Vật phẩm sưu tập có thật**, ai cũng biết, không cần giải thích | Meta album không phải "bịa": người chơi hiểu ngay "đủ bộ thì dán vào album" |
| 2 | **Category có sẵn trong đời thực**: quốc gia, năm, chủ đề (chim, tàu, hoa, vua chúa) | 4 category ẩn mỗi level lấy thẳng từ cách người sưu tầm tem phân loại; content pipeline gần như vô hạn |
| 3 | **Hình gần vuông, nhỏ, có viền**: 1 hình + 1 dòng chữ + giá tiền | Đọc được trên card ~100-140 px; viền răng cưa là "khung card" tự nhiên; text nhỏ là tuỳ chọn (localize dễ) |
| 4 | **Album là meta có sẵn**: trang album theo quốc gia/chủ đề, ô trống chờ lấp | Progress bar tự nhiên, "ô trống" tạo Zeigarnik; hợp với "mở trang mới = bộ tem mới trong level" (teardown mục 10, hướng 2) |
| 5 | **Hoài cổ nhẹ, trung tính giới**: tem gợi thư tay, bà/ông, du lịch; không gắn IP cụ thể | Audience nữ 35+ US `[GIẢ THUYẾT]` competitor mục 1; không rủi ro bản quyền nếu tự vẽ |
| 6 | **Art rẻ, sinh hàng loạt được**: 1 motif + 1 khung + 1 bảng màu; AI generate ổn | ABI dùng art AI, bị người chơi nhận ra nhưng vẫn 4.6-4.7 sao `[PLAY]` → art AI "đủ dùng" nếu ads không quá dày |

Điểm yếu của tem: keyword "stamp solitaire" đã thuộc ABI `[STORE]` https://play.google.com/store/apps/details?id=com.stamp.solit; tem khá "tĩnh", ít twist gameplay ngoài "dán vào album".

### Bộ tiêu chí chấm điểm (1-5, 5 = tốt nhất)

| Mã | Tiêu chí | Ý nghĩa | Ghi chú |
|---|---|---|---|
| A | Độ hoài cổ | Nhìn 1 giây thấy "vintage" | |
| B | Category tự nhiên | Có ≥ 30 category rõ ràng, chia được 4 nhóm ẩn có thể "gần nghĩa" để tăng khó | **Gate**: ≤ 2 loại |
| C | Đọc được trên card nhỏ | Nhận ra category từ hình ~120 px trong < 2 giây | **Gate**: ≤ 2 loại |
| D | Album/collection hợp lý | Meta sưu tập có thật trong đời, không cần bịa | |
| E | Chi phí art | 5 = rẻ, sinh hàng loạt bằng AI/template được | |
| F | Rủi ro IP/bản quyền | 5 = gần như không; 1 = chắc chắn dính | **Gate**: ≤ 2 loại |
| G | ASO / cạnh tranh | 5 = chưa game sort/solitaire nào chiếm keyword | kiểm tra nhanh bằng WebSearch |
| H | Phù hợp audience | Nữ 35+, Tier-1, thích relax + collect | |

Tổng tối đa 40. Đồng điểm thì phân định bằng B + C + H (ba tiêu chí ảnh hưởng trực tiếp tới gameplay và CPI).

---

## 2. Bảng 12 theme ứng viên `[GIẢ THUYẾT]`

| # | Theme | A | B | C | D | E | F | G | H | Tổng | Gate | Hạng |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Bưu thiếp vintage (postcard, kiểu "Greetings from") | 5 | 5 | 4 | 5 | 4 | 4 | 3 | 5 | **35** | OK | **1** |
| 2 | Nhãn hành lý/khách sạn (luggage labels) | 5 | 5 | 4 | 4 | 4 | 4 | 5 | 4 | **35** | OK | **2** |
| 3 | Nhãn hộp diêm (matchbox labels) | 5 | 4 | 5 | 4 | 5 | 4 | 5 | 3 | **35** | OK | **3** |
| 4 | Khuy áo/nút cổ (hộp khuy của bà) | 4 | 2 | 3 | 4 | 5 | 5 | 5 | 5 | 33 | Fail B | – |
| 5 | Nhãn thùng trái cây (fruit crate labels) | 4 | 4 | 4 | 3 | 4 | 4 | 5 | 4 | 32 | OK | 4 |
| 6 | Vé cổ (tàu, xem phim, vào cửa) | 4 | 4 | 3 | 3 | 4 | 4 | 4 | 4 | 30 | OK | 5 |
| 7 | Huy hiệu/pin/patch | 3 | 4 | 4 | 4 | 4 | 3 | 4 | 3 | 29 | OK | 6 |
| 8 | Nhãn chai (nước hoa, apothecary, mứt; tránh rượu) | 4 | 4 | 3 | 3 | 4 | 3 | 4 | 4 | 29 | OK | 6 |
| 9 | Bìa vinyl/cassette | 5 | 4 | 3 | 4 | 3 | 2 | 4 | 3 | 28 | Fail F | – |
| 10 | Tiền xu/tiền giấy cổ | 4 | 5 | 2 | 4 | 3 | 3 | 3 | 3 | 27 | Fail C | – |
| 11 | Thẻ bài sưu tập (baseball/trading card) | 4 | 4 | 3 | 5 | 3 | 1 | 3 | 2 | 25 | Fail F | – |
| 12 | Poster phim retro | 5 | 4 | 2 | 3 | 3 | 1 | 3 | 3 | 24 | Fail C, F | – |

Ghi chú chấm điểm:
- **G (ASO)** `[STORE]`: "postcard" đã được vài solitaire lớn dùng làm *reward meta* (Disney Solitaire https://apps.apple.com/us/app/disney-solitaire/id6475757306; Solitaire Card Games Classic https://apps.apple.com/us/app/solitaire-card-games-classic/id1564391515) nhưng chưa game association nào lấy làm core skin → 3. "Matchbox", "luggage label", "fruit crate label": không thấy game solitaire/sort nào → 5.
- **C**: postcard ảnh chụp thật chỉ được 2-3; chấm 4 với điều kiện minh hoạ "linen era" chữ lớn (mục 3.1).
- **F**: tên khách sạn/hãng tàu thật còn trademark (Ritz, Cunard) → hư cấu; rượu bị hạn chế rating/ad network → nhãn chai nên là nước hoa/apothecary/mứt.
- **Khuy áo** fail gate B: category theo chất liệu (ngọc trai, gỗ, đồng) khó đọc ở 120 px và không đủ 30 category.
- Loại sớm, không vào bảng: **con dấu sáp** (đơn sắc, giống nhau ở cỡ nhỏ), **bản đồ cổ** (không có category rõ), **bưu thiếp Đông Dương** (là một *bộ nội dung* của postcard cho thị trường VN/Pháp, không phải theme riêng).

---

## 3. Top 3 đề xuất chi tiết

### 3.1 Bưu thiếp vintage (postcard) — hạng 1

| Mục | Nội dung |
|---|---|
| **Fantasy** | "Wish you were here": người chơi là người nhận thư của cả thế giới, sắp xếp hộp bưu thiếp của bà vào scrapbook và ghim lên bản đồ. Giữ nguyên DNA "thư tay + tem" của Stamp Solitaire nhưng rộng hơn: mỗi bưu thiếp có tem, dấu bưu điện, chữ viết tay. |
| **Cách chia category** | Early game chia theo **motif hình** (không cần kiến thức địa lý); mid/late game chia theo **địa danh/vùng** hoặc **thập niên** để tăng độ "gần nghĩa". |
| **Ví dụ 10 category** | Bãi biển (Waikiki, Riviera, Copacabana, Miami, Bondi) · Núi (Alps, Rockies, Fuji, Andes, Dolomites) · Hải đăng (Portland, Cape Hatteras, Fastnet, Nazaré) · Lâu đài (Neuschwanstein, Edinburgh, Loire, Himeji) · Vườn hoa (tulip Hà Lan, anh đào Kyoto, lavender Provence, hoa hồng Bulgaria) · Nhà ga & tàu hoả (Orient Express, Grand Central, Shinkansen đời đầu, Glacier Express) · Chợ & ẩm thực (Marrakech souk, Tsukiji, Pike Place, chợ nổi) · Lễ hội (Carnival Rio, Oktoberfest, Songkran, Tết, Holi) · Thành phố về đêm (Paris, New York, Tokyo, Havana) · Safari & động vật (Serengeti, Galápagos, Kruger, Yellowstone). Level "wall": 4 category gần nhau, ví dụ Bãi biển / Hồ / Thác / Sông (đều là nước). |
| **Card** | Card gần vuông (crop 1:1 hoặc 4:3), khung trắng viền răng cưa nhẹ, minh hoạ flat 3-4 màu kiểu linen 1930-50, chữ "Greetings from ..." cỡ lớn phía dưới. Mặt sau: tem + dấu bưu điện + 1 dòng chữ viết tay. |
| **Album** | Scrapbook theo vùng (mỗi trang = 1 vùng, 8-12 ô); trang mở khoá đồng thời "ghim" lên bản đồ thế giới ở màn hình meta. Tem trên bưu thiếp tách ra thành sub-collection hiếm (giữ liên hệ với tên `stampsort`). |
| **Twist gameplay** | (1) **Flip**: lật mặt sau đọc dòng chữ viết tay = hint in-fiction ("The water was freezing but the view of the Alps..."), tốn 1 move hoặc 1 coin nhỏ; thay thế Magic Hint khô khan. (2) **Dấu bưu điện màu** = soft hint tự bật sau 2 lần fail cùng level (DDA nhẹ, không cần nói với người chơi). (3) **Postmark event** cuối tuần: bưu thiếp có dấu bưu điện đặc biệt, đủ bộ được tem hiếm. |
| **Tên gợi ý** | *Postcard Solitaire: Travel Sort* · *Greetings From: Postcard Puzzle* · *Wish You Were Here Solitaire* |
| **Rủi ro** | Nếu đội art trượt về ảnh chụp thật, C rớt xuống 2 và game thành "đoán địa danh" (trivia). Keyword "postcard" đã có mặt trong vài solitaire lớn nên ASO chỉ trung bình. Category địa lý gây rào cản với người không đi du lịch → bắt buộc dùng motif hình ở 30 level đầu. |

### 3.2 Nhãn hành lý vintage (luggage labels) — hạng 2

| Mục | Nội dung |
|---|---|
| **Fantasy** | Grand Tour 1920-1950: chiếc vali da dán kín nhãn khách sạn, hãng tàu, hãng bay. Người chơi "đi khắp thế giới" bằng cách lấp đầy vali. Cảm giác sang trọng, art deco, rất hợp creative ads. |
| **Cách chia category** | Hai trục có sẵn: **loại dịch vụ** (Grand Hotels, Ocean Liners, Airlines, Railways, Alpine Resorts, Seaside Resorts, Spa Towns, Safari Lodges, World Fairs, Desert/Orient) và **vùng** (Riviera, Alps, Orient, Americas, Nordic). Early game chia theo loại (tàu vs máy bay vs núi vs biển dễ đọc); late game chia theo vùng. |
| **Ví dụ 8 category** | Ocean Liners (Atlantic Star, Pacific Queen, Riviera Belle, Nordic Crown) · Airlines (Aero Alpina, Trans-Sahara Air, Pan Orient, Condor Sur) · Railways (Glacier Line, Orient Rail, Andes Express, Highland Rail) · Alpine Hotels (Hotel Edelweiss, Chalet Mont Blanc, Zermatt Palace, Innsbruck Grand) · Seaside Hotels (Hotel Riviera, Miramar, Copacabana Palace, Lido Excelsior) · Desert & Oasis (Hotel Sahara, Casablanca Grand, Petra Lodge, Marrakech Mamounia-kiểu-hư-cấu) · Safari Lodges · World Fairs (Paris 1937, New York 1939, Chicago 1933, Brussels 1958). Tất cả **tên hư cấu** để tránh trademark. |
| **Card** | Nhãn hình oval/khiên/lục giác nằm trong card vuông, 2-3 màu, chữ lớn chiếm 40% diện tích, hình minh hoạ đơn giản (tàu, núi, cọ, đèn lồng). Đọc rất tốt ở cỡ nhỏ. |
| **Album** | **Chiếc vali** là album: mỗi bộ hoàn thành "dán" lên một vị trí; vali đầy = hết chương, mở vali mới (hatbox, steamer trunk, túi golf). Một màn hình meta duy nhất, nhìn 1 giây thấy tiến độ. |
| **Twist gameplay** | (1) **Peel & stick**: đủ 4 card → cả bộ bóc keo, bay lên vali, dán "rụp" (haptic + âm giấy). (2) Nhãn **FRAGILE / RUSH / CUSTOMS** là booster in-fiction: Customs stamp = Golden Stamp (Joker), Rush = +3 moves, Fragile = undo miễn phí. (3) Chapter theo **chuyến đi** (Paris → Venice → Cairo) làm khung cho LiveOps. |
| **Tên gợi ý** | *Grand Tour Solitaire* · *Label Trunk: Sort & Travel* · *Voyage Labels* |
| **Rủi ro** | Nhận diện thấp hơn postcard: người không biết luggage label có thể thấy là "sticker chung chung" → CPI có thể cao hơn. Vibe hơi cao cấp/unisex, cần test với nữ 35+. Tên khách sạn thật là trademark → không được dùng, mất một phần "hoài cổ thật". |

### 3.3 Nhãn hộp diêm (matchbox labels) — hạng 3

| Mục | Nội dung |
|---|---|
| **Fantasy** | "Tiny treasures": ngăn kéo bếp của bà đầy hộp diêm từ khắp nơi; mỗi hộp là một bức tranh nhỏ. Cảm giác ấm, cozy, mini. |
| **Cách chia category** | Theo **motif** (rất phù hợp vì nhãn diêm cổ vốn in theo bộ chủ đề): Chim (sẻ, cú, hạc, bồ câu, công) · Mèo · Tàu thuyền (buồm, hơi nước, cá, phà) · Hoa · Xe cổ · Cá · Đèn & ánh sáng (đèn dầu, hải đăng, nến, lồng đèn) · Thể thao mùa đông · Đồ chơi · Không gian (vệ tinh, tên lửa, mặt trăng). Wall level: Chim / Bướm / Dơi / Máy bay (đều "bay"). |
| **Card** | Gần vuông (tỉ lệ hộp diêm 3:2 nhỏ), 1 hình + 1 từ, in 2-3 màu có "lệch bản" (misregistration) tạo chất in cũ. Đây là theme **đọc tốt nhất** trong 12 theme và art rẻ nhất. |
| **Album** | Tủ nhiều ngăn kéo / khay kính trưng bày; mỗi ngăn = 1 chủ đề. |
| **Twist gameplay** | (1) **Quẹt diêm**: đủ 4 → que diêm quẹt, lửa nhỏ bùng lên ấm áp rồi hộp trượt vào ngăn. (2) Số **que diêm còn trong hộp** = số undo miễn phí của level (hiển thị bằng hình, không cần số). (3) "Que diêm cuối" = Joker. |
| **Tên gợi ý** | *Matchbox Sort* · *Little Matchbox Solitaire* · *Strike & Sort* |
| **Rủi ro** | Diêm gợi lửa/thuốc lá → có thể ảnh hưởng brand-safety ở vài ad network và cảm nhận của phụ huynh. Phillumeny là hobby Đông Âu/Nhật/Ấn hơn là Mỹ → H chỉ 3 với audience US. Dễ bị nhìn thành "game cho trẻ con" nếu art quá cute. |

---

## 4. Khuyến nghị cuối cùng

**Chọn Postcard vintage (mục 3.1)**, mở rộng thành vũ trụ "Vintage Travel" trong đó **luggage label là tầng sưu tập hiếm** (dán lên vali ở màn hình meta, mở qua event/streak). Lý do `[GIẢ THUYẾT]`:

1. **Hiểu trong 1 giây**: creative ads phải giải thích được "đây là gì" mà không cần chữ; ai cũng biết bưu thiếp, ít người biết luggage label hay phillumeny. Đây là yếu tố quyết định CPI, mà CPI là rủi ro số 1 khi đối đầu ABI (competitor mục 8).
2. **Giữ DNA thư tín** của Stamp Solitaire (tem, dấu bưu điện) nên vẫn ăn tệp người chơi đang thích Stamp Solitaire nhưng ghét ads, đồng thời không đụng keyword "stamp".
3. **Hint in-fiction (Flip)** là twist duy nhất trong 3 theme vừa tăng cảm giác "relax" vừa là điểm bán tự nhiên (flip tốn coin), phù hợp hướng ad-light/IAP-first của teardown mục 10.
4. **Content pipeline hai trục** (motif + địa danh) giải quyết phàn nàn "level 272 không có category mới" `[PLAY]` competitor mục 6: chỉ cần thêm 1 vùng là có 8-12 category mới.
5. Nếu test thất bại, **fallback là Luggage label** vì dùng chung fantasy travel, chung audience, chung pipeline art deco; đổi theme không phải đổi thiết kế.

**Hai điều cần validate trước khi cam kết art pipeline:**

| # | Test | Cách làm | Ngưỡng đi tiếp (PO chốt số) |
|---|---|---|---|
| 1 | **CPI/CTR creative** | 3 video 15s cùng một đoạn gameplay, chỉ đổi skin: postcard vs luggage label vs matchbox. Chạy Meta, US, nữ 30-55, ngân sách bằng nhau, 3-5 ngày. | Postcard có CTR/CPI tốt nhất hoặc trong ±15% theme tốt nhất; nếu luggage label thắng rõ (> 25%) thì đổi sang 3.2 |
| 2 | **Readability của category ở cỡ card thật** | 20 người (không phải team) xem 12 card cỡ 120 px trong 3 giây, gọi tên nhóm. Chạy cho bộ early (motif) và bộ mid (địa danh). | Bộ early ≥ 85% đúng, bộ mid ≥ 65%; thấp hơn thì tăng cỡ chữ "Greetings from" hoặc bỏ trục địa danh |

Việc chốt ngưỡng, ngân sách test và thứ tự ưu tiên chuyển cho `product-owner`. Sau khi chọn theme, bước tiếp theo của game-designer: viết `gdd-core.md` với bảng category theo tier và quy tắc "gần nghĩa" cho wall level.
