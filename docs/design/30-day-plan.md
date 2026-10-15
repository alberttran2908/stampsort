# Kế hoạch 30 ngày chơi: level, tính năng, backlog theo vòng

**Ngày:** 2026-10-15 · **Tác giả:** game-designer agent · **Trạng thái:** kế hoạch, chưa sửa code.
**Yêu cầu của người dùng:** "tối ưu gameplay, sản xuất level cho tới khi game đủ tính năng và level cho 30 ngày chơi".
**Đối tượng:** người chơi lớn tuổi, tone chill (`older-players-pass.md`). Không có cốt truyện.

> **Cập nhật 2026-10-15 (người dùng chốt, level dev ghi lại; ưu tiên hơn đề xuất GD bên dưới):**
> 1. **Luật A là mặc định bản phát hành** (bám ABI: 7–10 chủ đề, 4 booster có Con dấu). Level L21+ sinh theo luật A. B chỉ còn là biến thể thử qua `?variant=b`.
> 2. **Level thường vẫn thua** khi hết lượt (như ABI). Không có soft-fail "Thư đến trễ" ở level thường. Level khó (`special`) vẫn vào Ca tối.
> 3. Duyệt 27 chủ đề mới và tên khu chương 3–11 (mục 2.2).
> 4. **Level ABI là nguồn ứng viên hợp lệ** ("quan trọng là level tốt nhất, của ABI hay tự làm không quan trọng, tôi đã xin phép rồi"). Mỗi vị trí level chọn ứng viên tốt nhất giữa layout ABI (đổi chủ đề, chỉnh moves) và layout tự sinh, chấm bằng validator.
>
> Vẫn giữ ràng buộc cho người lớn tuổi: CONFUSE, moves hào phóng (chỉnh theo mục tiêu `o35`), ván không quá dài. Chi tiết số liệu R1–R3 và các quyết định level dev: `docs/design/level-pipeline-r1-r3.md`. Các mục bị ảnh hưởng (1.3, 3.3, 3.5, 4.2 M2, 5, 6, 7, 8) đã sửa hoặc đánh dấu bên dưới.

**Nhãn nguồn:**

| Nhãn | Nghĩa |
|---|---|
| `[APK]` | `research/apk/com.stamp.solit/levels/levels.json` (963 level, bản 0.9.5) và `teardown-video-apk-0.9.5.md` |
| `[VIDEO]` | Video level 1–9 của Stamp Solitaire, `teardown-video-apk-0.9.5.md` |
| `[STORE]` | Review và listing, `docs/product/competitor-stamp-solitaire.md` |
| `[CODE file:dòng]` | Mặc định là `prototype/stamp/src/main.js` |
| `[SIM]` | Mô phỏng tôi chạy ngày 2026-10-15 bằng engine và `sampleHidden` thật, trên bản sao repo trong scratchpad. 100 ván mỗi level, seed `9000+L`, độc lập với seed của generator |
| `[DOC]` | Tài liệu trong repo |
| `[GIẢ THUYẾT]` | Suy luận, cần đo bằng playtest |

**Profile mô phỏng** (dùng xuyên suốt tài liệu):

| Mã | Ý nghĩa | Tham số `playHidden` | Giây/nước |
|---|---|---|---|
| `c10` | Người chơi phổ thông | width 2, depth 6, noise 1.6, mistake 0.10 | 3.2 |
| `c25` | Người mới (`NEWBIE` trong generator) | như trên, mistake 0.25 | 3.8 |
| `o35` | Người lớn tuổi mới chơi | width 2, depth 4, noise 2.0, mistake 0.35 | 4.5 |
| `sk` | Người giỏi | width 4, depth 22, noise 0.8, mistake 0 | 2.2 |

Giây/nước lấy theo `difficulty_report.mjs` và review GD v2 `[GIẢ THUYẾT]`.

---

## 1. "Đủ 30 ngày chơi" nghĩa là gì

### 1.1 Định nghĩa

> Một người chơi lớn tuổi **chơi đều mỗi ngày** không hết level chiến dịch trước D30. Người chơi **nhanh** (khoảng P90) không hết trước khoảng D28. Ngoài chiến dịch, mỗi ngày luôn có 1 "Thư hôm nay" (Daily Post).

Không có lives hay energy (P4), nên tốc độ tiêu thụ level chỉ phụ thuộc vào thời gian người chơi bỏ ra.

### 1.2 Nhịp chơi giả định `[GIẢ THUYẾT]`

Thời lượng level lấy từ `[SIM]`: level thường của luật B (34–41 lá) mất 56–75 nước ở profile `o35`. Như vậy khoảng 4,5–5,6 phút, tính cả màn thắng thì khoảng 5,5 phút. Persona nhanh chơi theo nhịp `c10`, khoảng 4 phút mỗi level.

| Giai đoạn | Persona | Phiên/ngày | Phút/phiên | Phút/ngày | Daily Post | Phút/level | Level chiến dịch/ngày | Lũy kế cuối giai đoạn |
|---|---|---|---|---|---|---|---|---|
| D1 | Đều đặn | 2 | 20 | 40 | 1 (mở sau L5) | ~3,5 (L1–L4 ngắn) | 9 | **L9** |
| D2–D7 | Đều đặn | 2 | 15 | 30 | 1 × 5 phút | 5,5 | 4–5 | **L36** |
| D8–D30 | Đều đặn | 1–2 (TB 1,5) | 15 | 22 | 1 × 5 phút | 5,5 | 3 | **L105** |
| D1 | Nhanh | 3 | 30 | 90 | 1 | ~3,5 | 18 | L18 |
| D2–D7 | Nhanh | 2 | 20 | 40 | 1 | 4 | 9 | L72 |
| D8–D30 | Nhanh | 2 | 15 | 30 | 1 | 4 | 6 | ~L210 |

### 1.3 Tổng số level cần

| Hạng mục | Số level | Cơ sở |
|---|---|---|
| Chiến dịch | **200** (L1–L200) | Khoảng 1,9 lần persona đều đặn (L105 ở D30). Persona nhanh hết vào khoảng D28 |
| Trong đó sinh mới | **180** (L21–L200) | ~~Thay hẳn L21–L60 của ABI~~ **(sửa 2026-10-15)** Mỗi vị trí chọn giữa ứng viên ABI và tự sinh (`tools/gen_levels.mjs`). `levels_apk.js` (import nguyên ABI L21–L60) chỉ còn để so sánh |
| L1–L20 | 20 (có sẵn) | Chỉnh lại bằng validator mới (R4), **bản A** |
| Daily Post | **60** (pool) | 30 ngày cộng 100% buffer. Xoay vòng theo ngày lịch |
| **Tổng level cần sinh** | **240** | 180 chiến dịch + 60 daily |

**Thực tế nguồn ABI (đo 2026-10-15, `[APK]`):** trong 963 level, chỉ khoảng **20 layout khác nhau** vừa trần độ dài của mình (≤ 54 lá, n ≤ 8). 179 level là cùng một layout 36 lá, 3 khay, đổi chủ đề. Phần lớn level ABI sau L20 có 64–98 lá (o35 10–15 phút), vượt trần. Vì vậy ABI chỉ là nguồn phụ: ở ch3 có 2/20 level chọn từ ABI (L29, L35). Muốn dùng nhiều level ABI hơn thì phải nới trần độ dài, việc này cần PO quyết.

Mốc dự phòng: nếu art chậm, có thể chốt **140 level (8 chương)** để chạy playtest 7 ngày trước. 140 vẫn hơn 1,3 lần persona đều đặn ở D30.

So sánh với đối thủ: ABI có 963 level `[APK]`, nhưng sau L50 chỉ còn 3 template (36/64/98 lá). Người chơi tới level 272 kêu "100 level gần nhất không có category mới" `[STORE]`. Bài học: số lượng không giữ người chơi, **chủ đề mới mới giữ**. Vì vậy mỗi chương có 3 chủ đề mới (mục 2).

---

## 2. Cấu trúc chương

### 2.1 Quy tắc

- Chương 1–2 giữ 10 level, để FTUE có nhịp thưởng nhanh. Từ chương 3 trở đi, mỗi chương **20 level**. Persona đều đặn hết một chương sau 4–6 ngày, tức khoảng một tuần một khu mới.
- Mỗi chương mới gồm: **3 chủ đề tem mới**, 6 decor, 1 bưu thiếp teaser, 1 câu kết chương, và 6 câu nhắn cư dân mới (EN/VI).
- Chủ đề mới của chương xuất hiện ở ≥ 40% số level trong chương. Chủ đề mới của chương trước xuất hiện ở ≥ 20%. Phần còn lại lấy từ pool nền.
- **Art hiện có:** 63 chủ đề, mỗi chủ đề 3–8 art `[CODE assets/cards]`. Bỏ Raw meat (lệch tone, dễ nhầm với Grilled). Sauce chỉ có 3 art. Còn lại 61 chủ đề dùng được làm pool nền. Hầu hết đã xuất hiện ở L1–L20, nên **chương 3+ không có chủ đề nào "mới" nếu không vẽ thêm**.

### 2.2 Bảng chương

| Ch | Level | Khu (VI / EN) | Mùa | Cư dân nhận chủ đề mới | 3 chủ đề mới cần vẽ (EN / VI) | Cặp cần thêm vào `CONFUSE` hoặc kiểm tra | 6 decor (món cuối luôn là chỗ ngủ của Pip) |
|---|---|---|---|---|---|---|---|
| 1 | 1–10 | Phố Chính / Main Street | Xuân | Otto, Marigold, Finch | Có sẵn | | Có: bunting, frame, clock, postbox, board, cat |
| 2 | 11–20 | Bến Cảng / The Harbor | Hè | Bo, Lina | Có sẵn: Sailboats, Shells, Seafood, Nautical | | Có: fan, porthole, buoy, lantern, chart, boatbed |
| 3 | 21–40 | Đồi Trà / Tea Hill | Thu | Ines | Lantern / Đèn lồng; Knitting / Đồ len; Acorn / Hạt dẻ & quả sồi | Acorn ↔ Leaf, Tree (cấm vẽ lá) | Kệ trà, thảm len, lò sưởi, ấm đồng, chậu cúc, giỏ len của Pip |
| 4 | 41–60 | Vườn Táo / Apple Orchard | Đông | Otto | Winter / Người tuyết; Candle / Nến; Gift / Hộp quà | Candle ↔ Lantern | Vòng hoa, tất treo, đèn dây, giỏ táo, khăn len treo, Pip trong hộp quà |
| 5 | 61–80 | Ga Tàu / Train Station | Xuân | Finch | Luggage / Vali; Umbrella / Ô dù; Camera / Máy ảnh | Camera ↔ Phone | Bảng giờ tàu, vali cũ, đồng hồ ga, ghế băng, đèn tín hiệu, Pip trên vali |
| 6 | 81–100 | Đảo Xa / Far Island | Hè | Bo | Lighthouse / Hải đăng; Treasure / Kho báu; Cactus / Xương rồng | Lighthouse ↔ Nautical; Treasure ↔ Gems | Mô hình hải đăng, rương gỗ, chậu xương rồng, võng, quả địa cầu, Pip trong vỏ sò |
| 7 | 101–120 | Chợ Phiên / Market Square | Thu | Marigold | Bread / Bánh mì; Cheese / Phô mai; Pottery / Đồ gốm | Bread ↔ Cake, Desserts; Pottery ↔ Tea | Giỏ mây, bảng giá phấn, rổ bánh, cân đồng, mái hiên sọc, Pip trên bao bột |
| 8 | 121–140 | Bờ Hồ / Lakeside | Đông | Lina | Fishing / Đồ câu; Picnic / Dã ngoại; Painting / Họa cụ | Fishing ↔ Sea life (chỉ vẽ dụng cụ) | Cần câu treo, giỏ picnic, giá vẽ, tranh hồ, đèn bão nhỏ, Pip trên gối kẻ ô |
| 9 | 141–160 | Đồi Cối Xay Gió / Windmill Hill | Xuân | Otto | Stationery / Văn phòng phẩm; Wooden Toys / Đồ chơi gỗ; Honey / Ong & mật | Honey ↔ Insect; Wooden Toys ↔ Chess, Kite | Mô hình cối xay, kệ sách, hộp bút, ngựa gỗ, bình hoa dại, Pip trong giỏ sách |
| 10 | 161–180 | Quảng Trường Lễ Hội / Festival Square | Hè | Marigold | Fireworks / Pháo hoa; Mask / Mặt nạ hội; Bell / Chuông | Bell ↔ Music Inst, Notes | Dây đèn hội, mặt nạ treo, chuông cửa, hộp nhạc, cờ hội, Pip đội mũ tiệc |
| 11 | 181–200 | Đồi Mây / Cloud Hill | Thu | Bo | Weather / Thời tiết; Origami / Giấy gấp; Keys / Chìa khóa | Weather ↔ Planet; Origami ↔ Bird, Sailboats | Chong chóng, chuỗi hạc giấy, móc chìa khóa, nhiệt kế cổ, áo mưa treo, Pip trên gối mây |

Tên chủ đề ở trên là đề xuất. Mỗi chủ đề phải qua confusion check (cỡ lá thật, 3 giây) trước khi khóa. Nếu bị loại thì thay bằng chủ đề khác cùng khu.

### 2.3 Art cần vẽ thêm (quy trình ChatGPT ở `art-redo-chatgpt.md`)

| Loại | Số lượng | Số ảnh ChatGPT | Tái dùng |
|---|---|---|---|
| Chủ đề tem mới | 27 (3 × 9 chương). **Tối thiểu 18** (2 mỗi chương) | 27 lưới 3×3 (giữ ≥ 6 art, tốt nhất ≥ 8 để có tem `n = 8`) | Không |
| Icon lá vương miện | 27 | 3 bảng 9 icon, sau đó chạy `tools/icon_line.py` | Không |
| Decor | 54 (6 × 9 chương) | 9 lưới (mỗi lưới dư 3 ô) | **Có, ở mức hệ thống:** 6 chỗ đặt trên nền chung và `CHAPTERS[].decor` giữ nguyên `[CODE 39–51]`. Món đồ thì vẽ mới. Phương án dự phòng: đổi màu bộ decor chương 1–2 thành "phiên bản mùa" |
| Bưu thiếp teaser chương | 9 | 9 | Không |
| Icon booster (Tem Đa Năng, Nam châm theo theme) | 2–3 | 1 lưới | |
| Decor hiếm theo tháng (Could) | 1 | Dùng ô dư của lưới decor | |
| **Tổng** | | **khoảng 50 ảnh** | Giới hạn upload của gói Plus là khoảng 90 ảnh mỗi khung giờ `[DOC art-redo]`. Cần 2–3 buổi |

Art phụ thuộc vào trình duyệt của người dùng, nên các vòng art (A1–A5) tách khỏi vòng dev. Generator có **topic dự phòng**: chủ đề chưa có art thì tạm thay bằng chủ đề nền ít dùng nhất. Khi art về, chỉ cần sinh lại đúng chương đó.

---

## 3. Đường cong độ khó 200 level

### 3.1 Hiện trạng (vì sao phải đổi cách sinh)

- L1–L20 được viết tay từng dòng trong bảng `DESIGN` `[CODE tools/gen_proto_levels.mjs]`. Viết tay 180 level nữa thì không khả thi và không nhất quán.
- Moves được chọn bằng phân vị của chính seed dùng để chọn layout, nên số liệu khớp quá sát (review GD v2 mục 3). Đo bằng seed độc lập, chương 2 bản B: `c25` thắng trong moves 76–98%, nhưng **`o35` chỉ 39–81%** (L14 39%, L17 60%, L19 65%). `o35` thắng khi được +5 là 80–95% `[SIM]`.
- Thời gian chạy đo được `[SIM]`: level thường khoảng 5 giây, level khó khoảng 19 giây (thử 40 seed). Kiểm tra 100 ván `o35` mất khoảng 0,3 giây. Sinh 180 level cộng kiểm tra độc lập mất dưới 30 phút: **khả thi**.

### 3.2 Nhịp 20 level mỗi chương (chương 3–11)

| p | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Vai trò | intro-br | nor | nor | intro | nor | bump | br | nor | bump | **HARD** | br | intro | nor | nor | bump | br | nor | nor | bump | **SUPER** |
| Chủ đề mới | #1 | | | #2 | | | | | | | | #3 | | | | | | | | |

- 4 level nghỉ (br) = 20%, khớp với nhịp breather khoảng 1/5 của ABI `[APK]`. 2 đỉnh khó = 10% (ABI có level lớn khoảng 1/7 `[APK]`). Ít đỉnh hơn ABI vì đối tượng của mình chill hơn.
- **Không bao giờ có 3 level liên tiếp** thuộc nhóm bump/HARD/SUPER mà không có br ở giữa.
- Chương 1–2 giữ vai trò hiện có (HARD ở L5, L15; SUPER ở L10, L20 là mốc UA, `difficulty-and-ua-milestones.md`).

### 3.3 Tham số theo chương

**Bảng đang dùng (luật A, 2026-10-15)**, nguồn sự thật là `TIERS` trong `tools/level_spec.mjs`:

| Ch | Lá nor / br / bump / HARD / SUPER | Chủ đề nor / br / bump / HARD / SUPER | Khay | Cột | `n` | Deck | Slack sàn nor | `c25` / `o35` / `o35` +5 (nor) |
|---|---|---|---|---|---|---|---|---|
| 3 | 40–44 / 34–40 / 42–46 / 48–52 / 50–54 | 7 / 6 / 8 / 8 / 9 | 4 (br p16: 3, SUPER: 5) | 4 (SUPER 5) | 3–6 | 55% | 1.28 | 0.90 / 0.75 / 0.95 |
| 4 | 40–45 / 34–40 / 42–46 / 48–52 / 50–54 | 7 / 6 / 8 / 8 / 9 | như trên | 4 | 3–7 (L41: một chủ đề `n = 8`) | 58% | 1.25 | 0.90 / 0.75 / 0.95 |
| 5 | 41–45 / 36–41 / 43–46 / 48–52 / 50–54 | 7 / 6 / 8 / 9 / 10 | như trên | 4, 5 từ L66 | 3–7 | 60% | 1.22 | 0.88 / 0.72 / 0.95 |
| 6 | như ch5 | 8 / 6 / 8 / 9 / 10 | như trên | 5 | 3–8 | 60% | 1.22 | 0.88 / 0.72 / 0.94 |
| 7–8 | 42–46 / 37–42 / 44–46 / 48–52 / 50–54 | 8 / 6 / 9 / 9 / 10 | như trên | 5 | 3–8 | 62% | 1.20 | 0.85 / 0.70 / 0.93 |
| 9–11 | như ch7–8 | 8 / 6 / 9 / 10 / 10 | như trên | 5 | 3–8 | 62% | 1.18 | 0.85 / 0.70 / 0.93 |

- Cơ sở: level A L1–L20 hiện có (nor 7 chủ đề 38–46 lá, bump/hard 8 chủ đề 48–52 lá, super 9 chủ đề, 5 khay) và xu hướng ABI (sau L20 trung vị 10 chủ đề, 64 lá) `[APK]`, cắt theo trần độ dài.
- **Trần (sửa cho luật A):** level thường ≤ 46 lá, trung vị `o35` ≤ 6 phút, **bump ≤ 6,5 phút**. Level khó ≤ 54 lá, ≤ 8 phút. Đo được: luật A (7–8 chủ đề) cần khoảng 1,9 nước/lá với `o35`, nên 6 phút tương đương khoảng 44 lá. Bump 45 lá ở bản spec đầu có 9/9 ứng viên vượt 6 phút.
- Level khó có thêm biến thể deck +8 điểm (`colsAlt`). Generator xen kẽ hai biến thể vì nhiều lá ẩn làm hẹp khoảng cách `sk` − `c10`.
- Mục tiêu `sk` ở level khó được nới trần thành **0.35–0.70 (HARD) và 0.30–0.65 (SUPER)**, xem bảng vai trò.

**Bảng gốc của GD (luật B: ≤ 6 chủ đề ở level thường), giữ để tham khảo, không còn dùng cho L21+:**

| Ch | Level | Lá (normal) | Chủ đề nor / bump / hard | Khay nor (bump, hard) | Cột (lá ban đầu) | `n` mỗi chủ đề | Deck | Slack sàn nor | `c25` nor ≥ | `o35` nor ≥ | `o35` +5 ≥ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1–2 | 1–20 | giữ (B: 34–41) | ≤ 6 | 3–4 | 3–4 cột | 3–6 | ~55% | theo report | 0.85 | 0.70 | 0.93 |
| 3 | 21–40 | 34–40 | 5–6 / 6 / 6 | 4 (3, 4) | 4 cột: 3-4-5-6 | 4–6 | 50–55% | 1.28 | 0.90 | 0.75 | 0.95 |
| 4 | 41–60 | 36–42 | 6 / 6 / 6 | 4 (3, 3–4) | 4 cột | 4–7, một chủ đề `n = 8` | 55% | 1.25 | 0.90 | 0.75 | 0.95 |
| 5 | 61–80 | 38–44 | 6 / 6 / 7 | 4 (3, 3) | 4–5 cột | 4–7 | 55–60% | 1.22 | 0.88 | 0.72 | 0.95 |
| 6 | 81–100 | 38–44 | 6 / 6 / 7 | 3–4 (3, 3) | 5 cột: 2-3-4-5-6 | 4–8 | 55–60% | 1.22 | 0.88 | 0.72 | 0.94 |
| 7–8 | 101–140 | 40–46 | 6 / 6 / 7 | 3–4 (3, 3) | 5 cột | 4–8 | 60% | 1.20 | 0.85 | 0.70 | 0.93 |
| 9–11 | 141–200 | 40–46 | 6 / 7 / 7 | 3 (br: 4) | 5 cột | 4–8 | 60% | 1.18 | 0.85 | 0.70 | 0.93 |

Từ chương 7, độ khó **đi ngang**. Sự đa dạng đến từ chủ đề, tỉ lệ chủ đề trên số khay và biến thể cấu trúc (mục 3.5), không đến từ việc siết moves thêm. ABI cũng đi ngang sau L50 `[APK]`.

**Điều chỉnh theo vai trò** (áp lên dòng của chương):

| Vai trò | Lá | Chủ đề | Khay | Slack sàn | Mục tiêu (seed kiểm tra, ≥ 200 ván) | Kẹt `c10` ≤ |
|---|---|---|---|---|---|---|
| br / intro-br | −15% | 5 | 4 | 1.35 | `c25` ≥ 0.97, `o35` ≥ 0.85, `o35` +5 ≥ 0.97 | 0 |
| intro | như nor | như nor | như nor | như nor | Như nor. Vương miện của chủ đề mới ngửa trên cột hoặc nằm trong 3 lá rút đầu (`fair()` đã có) | 0.03 |
| nor | bảng trên | bảng trên | bảng trên | bảng trên | Bảng trên | 0.03 (ch3–6), 0.05 (ch7+) |
| bump | +10% | bảng trên | bớt 1 | 1.15 | `c25` ≥ 0.80, `o35` ≥ 0.60, `o35` +5 ≥ 0.90 | 0.05 |
| HARD | +15% | tối đa 7 từ ch5 | 3–4 | 1.02 | `c10` trong moves 0.15–0.35, `sk` 0.35–~~0.55~~ **0.70**. Cờ `special: 'hard'`, Ca tối | 0.10 |
| SUPER | +25%, ≤ 52 | tối đa 7 | 3–4 | 1.03 | `c10` 0.10–0.30, `sk` 0.30–~~0.50~~ **0.65** | 0.15 |

(Cột Lá, Chủ đề, Khay ở bảng vai trò thuộc luật B. Luật A dùng bảng `TIERS` ở trên. Mục tiêu, slack sàn và ngưỡng kẹt vẫn giữ nguyên.) Lý do nới `sk`: đo trên seed check, A L15 có `sk` 0.71 và A L20 có `sk` 1.00. Ở ch3, thử 3 lần × 40 layout thì chỉ 1–2 layout có cả `c10` và `sk` trong khoảng cũ. Điều kiện chính của level khó vẫn là `c10` và kẹt.

**Trần cứng (PO câu 6, mục 5):** level thường ≤ 46 lá và trung vị `o35` ≤ 6 phút (khoảng 80 nước). Level khó ≤ 52 lá và ≤ 8 phút. Slack ≤ 1.6 để level không quá dễ.

**Daily Post:** 30–36 lá, ~~5~~ **6 chủ đề (luật A, như level nghỉ; sửa 2026-10-15)**, 4 khay, `c25` ≥ 0.97, `o35` ≥ 0.85. Chỉ dùng chủ đề nền và chủ đề chương 2–3, để không lộ chủ đề của chương người chơi chưa tới. Không có level khó.

### 3.4 Mốc giới thiệu cơ chế

Sau L10 không có luật mới (giống ABI `[APK]`). Với người lớn tuổi, đây là điểm cộng. Biến thể chỉ là **cấu trúc**, dùng luật sẵn có. Mỗi biến thể có 1 câu tip ngắn ở lần đầu gặp.

| Lần đầu ở | Biến thể | Engine | Tip lần đầu (VI) |
|---|---|---|---|
| L1–L9 | Vương miện, xếp chồng, bộ bài, Gợi ý (L2), Ô phụ (L2), Nam châm (L4), Con dấu (L7, **giữ ở luật A**), Tem Đa Năng (L9) | Có | Có sẵn |
| L11 | Giới thiệu chủ đề mới đầu chương (`introduce`) | Có `[CODE 2219]` | Có sẵn |
| ~~L26 (ch3 p6)~~ **L36 (ch3 p16, level nghỉ)** | Level 3 khay "Hôm nay mở ít quầy". Luật A: 3 khay đặt ở level nghỉ p16 của mỗi chương (ABI dùng 3 khay cho level nhỏ 6–7 chủ đề `[APK]` L22, L27, L36, L41). Bump 8 chủ đề với 3 khay thì quá dễ kẹt. Spec: `tip: 'few_counters'` | Có | "Hôm nay chỉ mở 3 quầy, cứ thong thả." |
| L41 (ch4 p1) | "Bao thư lớn": 1 chủ đề `n = 8` | Có (cần ≥ 8 art) | "Bao thư lớn: cần 8 tem." |
| L66 (ch5 p6) | Level 5 cột | Có | Không cần |
| L70 (ch5 p10) | Level khó ~~7~~ **9 chủ đề (luật A)** | Có | Không cần |
| L87 (ch6 p7) | Ô mở sẵn ở level nghỉ (`preplace`) | Có | "Một quầy đã mở sẵn." |
| L107 (ch7 p7) | **Could:** "Cột ngửa", mọi lá trên bàn ngửa sẵn (level nghỉ) | Cần thêm cờ `openCols` trong `createState` | "Hôm nay thư đã mở sẵn." |
| Từ ch8 | **Could:** "Tem hiếm" (lá Tem Đa Năng nằm sẵn trong bộ bài, concept mục 5) | Cần thêm loại lá mới | |

### 3.5 Mở rộng generator (cụ thể)

Giữ `tools/gen_proto_levels.mjs` cho L1–L20 (`DESIGN` viết tay). Thêm generator theo tham số cho L21+ và Daily.

| # | Phần | Mô tả |
|---|---|---|
| E1 | `tools/level_rules.mjs` | Chuyển `CONFUSE`, danh sách loại trừ (Raw meat), `availableArts`, `fair()`, profile `c10/c25/o35/sk` ra module dùng chung. Thêm cặp Ice cream ↔ Coffee (review #13) và các cặp ở mục 2.2 |
| E2 | `tools/level_spec.mjs` | `TIERS` (bảng 3.3), `ROLE_ADJ` (bảng vai trò), `PATTERN` (20 vai trò), `CHAPTER_TOPICS` (3 chủ đề mới mỗi chương, kèm `fallback`). Hàm `specFor(L)` trả về `{ id, chapter, role, F, cols, topics: {tên: n}, introduce, special, targets, slackFloor, capCards, capMin }` |
| E3 | Chọn chủ đề | Tất định theo `L`. Ép có chủ đề mới (intro) và đạt hạn mức 40%/20% (mục 2.1). Tránh chủ đề đã dùng ở 2 level liền trước, ưu tiên chủ đề ít dùng nhất trong chương. Không bao giờ ghép cặp `CONFUSE`. `n ≤ số art` (không lặp art). Chỉnh `n` để tổng lá nằm trong khoảng của tier |
| E4 | Ba bộ seed | `gen` (chọn layout), `tune` (chọn moves, 60 ván mỗi profile), `check` (kiểm tra cuối, 200 ván, seed `50000+id`, không bao giờ dùng để chỉnh). Sửa lỗi "khớp quá sát" của review GD v2 |
| E5 | Chỉnh moves theo vai trò | `budget = max(ceil(solver × slackFloor), phân vị c25, phân vị o35, phân vị o35+5)` trên seed `tune`. Nếu vượt trần (slack > 1.6, trung vị `o35` > `capMin`) thì loại seed. Sau đó chạy `check`; trượt thì +2 moves rồi kiểm tra lại, tối đa 3 lần. Vẫn trượt thì đổi seed |
| E6 | Chọn level khó | Seed có `c10` trong moves nằm trong khoảng mục tiêu, kẹt ≤ ngưỡng, `sk` nằm trong khoảng. Thử 40 seed như hiện nay |
| E7 | CLI và đầu ra | `node tools/gen_levels.mjs --from=21 --to=40` ghi gộp vào `prototype/stamp/src/levels_gen.js` (`export const LEVELS_GEN`), giữ nguyên level ngoài khoảng. `--daily=60` ghi `levels_daily.js`. Report `prototype/stamp/levels-gen-report.json`: lá, chủ đề, khay, solver, moves, slack, win từng profile, kẹt, phút ước tính. `--md` in bảng |
| E8 | Tất định | Cùng lệnh thì ra cùng file (so hash). Seed = `chapter × 100000 + p × 1000 + k` |
| E9 | `tools/validate_levels.mjs` | Chạy được trên `levels_b.js`, `levels_gen.js`, `levels_daily.js`. Dùng seed `check`, so với `targets` của từng level (level cũ thì dùng mặc định theo vai trò). Thoát với mã 1 nếu có level trượt. Dùng cho QA và CI |
| E10 (mới 2026-10-15) | Ứng viên ABI trong `gen_levels.mjs` | Layout ABI khử trùng theo cấu trúc. Lọc theo số lá, số chủ đề (±1), n ≤ 8 và biến thể cấu trúc của vị trí. Đổi chủ đề theo spec (chủ đề mới ở ô có vương miện nhìn thấy sớm, hạn mức, rồi chủ đề nền). Moves chỉnh như ứng viên tự sinh. Mỗi layout chỉ dùng 1 lần |

**Trạng thái E1–E10 (2026-10-15):** đã làm cả 10 trong `tools/level_rules.mjs`, `tools/level_spec.mjs`, `tools/gen_levels.mjs`, `tools/validate_levels.mjs`. Riêng `--daily` (E7) để tới R15. `gen_proto_levels.mjs` chưa chuyển sang `level_rules.mjs`, để R4 làm. Seed: gen = `chương × 100000 + p × 1000 + k`, tune = `70000 + id`, check = `50000 + id`. Xếp hạng ứng viên chỉ dùng seed tune. Seed check dùng để kiểm tra và cho phép nới +2 moves (tối đa 3 lần) theo E5. Ở level khó thì bước nới là ±1 theo `c10`/`sk`.

---

## 4. Tính năng retention D1–D30

### 4.1 Hiện trạng (đã kiểm tra trong `main.js`)

| Tính năng | Trạng thái | Nguồn |
|---|---|---|
| Lưu tiến trình (level mở, xu, Tem Điểm, booster) | Có | `[CODE 102–106]` localStorage |
| Lưu ván đang chơi dở | **Chưa** (grep không thấy `visibilitychange`) | `[CODE]` |
| Tem Điểm và decor | Có cho ch1–2. Ch3–6 có `decor: []`, panel báo "sắp có" | `[CODE 39–51, 2376]` |
| Album | Có, tự đầy khi gửi tem. Icon 32–40px là nhỏ | `[CODE 2034–2056]` |
| Thưởng hết chương | +200 xu, mời sang chương sau hoặc mở album | `[CODE 2017–2032]` |
| Câu nhắn cư dân | Có, 3–6 câu mỗi người | `[CODE copy.js:262–]` |
| Teaser chương | Chỉ có teaser riêng cho chương 2 | `[CODE 2408–2427]` |
| Ca tối (không thể thua) | Chỉ ở level khó. Level thường hết moves thì hiện "Hết nước" kèm tiếng `lose` | `[CODE 2060–2085]` |
| Undo 5 lượt, Gợi ý khi đứng im | Có | `[DOC older-players-pass]` |
| Nút "Nhận x2 (quảng cáo)" | Là nút **đầu tiên, màu cam** ở màn thắng | `[CODE 2000]` |
| Banner level khó | Vẫn có `boom` và rung | `[CODE 2249]` |
| Chơi lại trong Pause | Không hỏi xác nhận, nút cam nổi | `[CODE 2444]` |
| Ngưỡng nhận kéo | 12px (chạm trượt bị mất) | `[CODE 1328]` |
| Cài đặt | Chỉ có âm thanh bật/tắt và ngôn ngữ | `[CODE 2445–2446]` |
| Analytics | Có funnel. Thiếu các sự kiện ở review GD v2 mục 8. `MAX = 800` | `[CODE analytics.js:6]` |
| Daily, quà đăng nhập, streak, thông báo, nhắc nghỉ | **Chưa** | grep |
| Bỏ level APK khỏi bản build | Có: `deploy_web.sh` thay `levels_apk.js` bằng mảng rỗng nếu không đặt `KEEP_APK_LEVELS=1` | `[CODE tools/deploy_web.sh:18]` |

Đối thủ: không có daily hay streak `[STORE]` `teardown-stamp-solitaire.md:117`. Có event "Climbing Quest" và "Stamp Rush" ở bản 0.17+ `[STORE]`. Có lives và trừ lives gấp đôi khi từ chối quảng cáo `[STORE]`: đây là dark pattern mình tránh.

### 4.2 MoSCoW

**Must** (bắt buộc cho Definition of Done):

| # | Tính năng | Mục đích (người chơi cảm thấy gì) | Quy tắc chính | Đo bằng |
|---|---|---|---|---|
| M1 | Lưu ván dở và hỏi "Chơi tiếp ván dở?" | Một cuộc gọi đến không làm mất 6 phút chơi | Lưu state sau mỗi nước và khi `visibilitychange`. Mở lại thì hỏi; chọn "Ván mới" thì không mất gì | `level_resume`, `level_abandon` |
| ~~M2~~ | ~~"Thư đến trễ" (soft-fail, PO câu 1)~~ **Bỏ (2026-10-15): người dùng chốt level thường vẫn thua.** | Không bao giờ thấy chữ "thua" | Hết moves thì vào Ca tối như level khó. Có 1 lựa chọn phụ "+5 lượt (quảng cáo)" để giữ 2 Tem Điểm. Không có tiếng `lose` | `overtime_start` ở level thường, `level_quit` |
| M3 | Daily Post "Thư hôm nay" | Lý do mở app mỗi ngày dù đang kẹt ở chiến dịch | Mở sau L5. Mỗi ngày lịch 1 level từ pool 60 (dễ, mục 3.3). Thắng được 1 **dấu ngày** vào "Sổ dấu ngày" (trang lịch trong album) và 40 xu. Chơi lại được nhưng không có thưởng. Không đếm ngược | `daily_start/complete`, D1/D7/D30 theo nhóm có chơi daily |
| M4 | Thẻ tuần 5/7, **không phạt** | Thấy được sự đều đặn mà không sợ "mất chuỗi" | Mỗi tuần lịch có 7 ô. Đủ 5 dấu ngày thì mở hộp quà (1 Gợi ý, 1 Nam châm, 100 xu). Tuần mới bắt đầu thẻ mới. **Không có chuỗi bị reset** và không có copy kiểu "sắp mất" | `weekly_box_open`, phân bố số ngày chơi/tuần |
| M5 | Decor và teaser cho ch3–11 | "Thị trấn còn gì" thay cho cốt truyện | 6 món mỗi chương. Giá lấy từ economy sim (R19). Chưa có art thì hiện bóng mờ ("đang đóng gói") nhưng vẫn mua được, sau này đổi sang ảnh thật | `decor_place` theo chương, % người mở chương mới trong 3 ngày |
| M6 | Thưởng hết chương có ý nghĩa | Khoảnh khắc lớn mỗi tuần | +200 xu, bưu thiếp chương vào album, mời sang khu mới (có sẵn, tổng quát hoá cho 11 chương) | `chapter_complete` |
| M7 | Accessibility P0 (review GD v2 #1, #3, #4, #11) | Chạm hơi trượt vẫn đi được, chữ đọc thoải mái, không xem quảng cáo nhầm | Chạm trượt dưới khoảng 30px được xử lý như chạm. Chữ ≥ 48px stage. "Tiếp tục" là nút chính. Hỏi xác nhận khi Chơi lại hoặc về Home | `tap_drift`, `win_button` |
| M8 | Analytics cho D1–D30 | Biết người chơi rời đi ở đâu | Các sự kiện ở review GD v2 mục 8, cộng `daily_*`, `weekly_*`, `welcome_back`, `level_resume`. `MAX` 800 → 5000 | Có trong bảng Events ở `?debug` |
| M9 | Economy cân lại | Luôn đủ xu cho 1 Gợi ý, mua đủ decor trong một lượt chơi | Xem R19–R20 | Bảng economy sim |

**Should:**

| # | Tính năng | Quy tắc |
|---|---|---|
| S1 | "Thư buổi sáng" (quà đăng nhập) | Lần mở đầu tiên mỗi ngày: Pip mang 20 xu, thỉnh thoảng 1 Gợi ý. Giá trị cố định, không có thang tăng dần, không có ngày "đặc biệt" bị lỡ |
| S2 | "Chào mừng quay lại" | Vắng từ 3 ngày trở lên: "Pip giữ thư cho bạn", tặng 1 Gợi ý và 1 Nam châm. Nhắc người chơi đang ở chương nào và món decor kế tiếp. Level đầu tiên sau khi quay lại được +5 lượt |
| S3 | Bảng Cài đặt | Chữ (Thường / Lớn / Rất lớn), âm lượng 3 mức, rung, giảm chuyển động. Chế độ tay trái là Could |
| S4 | Nhắc nghỉ sau 45 phút | "Pip ngủ rồi, bạn nghỉ chút nhé?" Tắt được, không khoá game |
| S5 | Thông báo cục bộ (iOS Capacitor) | Chỉ hỏi quyền sau lần thứ 3 hoàn thành daily. Tối đa 1 thông báo mỗi ngày, vào giờ người chơi chọn. Mặc định tắt |
| S6 | Thanh chủ đề đã mở (review #17) | Icon mờ của các chủ đề đã mở hoặc đã gửi trong level, không lộ chủ đề chưa gặp |
| S7 | Câu nhắn mới mỗi chương | +6 câu (EN/VI) cho cư dân của chương |

**Could:** "Cột ngửa", "Tem hiếm", cư dân mới (2 chương một người), decor hiếm theo tháng (20 dấu ngày trong tháng), Pip đổi trang phục, DDA ẩn (nếu PO không chọn soft-fail).

**Won't (giai đoạn này):** lives hoặc energy; interstitial giữa level; leaderboard hay thi đấu; streak reset về 0 và thang thưởng đăng nhập có ngày bị lỡ; event đếm ngược tạo FOMO; cốt truyện.

---

## 5. Đề xuất mặc định cho 8 câu hỏi PO (review GD v2 mục 10)

Đây là **đề xuất của GD**. PO có thể đổi. Backlog dưới đây làm theo các mặc định này.

| # | Câu hỏi | Đề xuất GD | Lý do ngắn |
|---|---|---|---|
| 1 | Level thường có được thua không? | **ĐÃ CHỐT 2026-10-15: có, thua như ABI. Đề xuất cũ không dùng:** (b) Soft-fail "Thư đến trễ" ở luật B: hết moves thì vào Ca tối, có lựa chọn phụ +5 lượt (quảng cáo). A giữ như ABI để A/B trên traffic UA | Pillar P4. `o35` vẫn thua 5–20% sau khi đã +5 `[SIM]`. Chỗ chi xu chuyển sang Gợi ý và Nam châm (để lấy đủ 3 Tem Điểm và gỡ kẹt). Kẹt cứng vẫn cần booster hoặc Undo |
| 2 | "Nhận x2 (quảng cáo)" | **Giữ, nhưng là nút phụ nhỏ** dưới "Tiếp tục". Chỉ hiện từ L11, không hiện ở màn hết chương. Ghi `ad_offer/ad_watch` | Vẫn đo được ARPDAU, nhưng không để người lớn tuổi bấm nhầm |
| 3 | Tem Điểm ở level khó, giá decor | **Ca tối ở level khó: 2 điểm.** ~~Ca tối ở level thường: 1 điểm~~ (level thường không có Ca tối, câu 1). Thắng trong moves: 3 hoặc 2. Tổng giá decor mỗi chương = 90% số Tem Điểm `o35` kiếm được trong một lượt chơi (R19). Giá khởi điểm: ch1–2 2/2/3/3/4/5 (19), ch3+ 4/5/6/7/8/10 (40) | Level khó được thiết kế để vào Ca tối, nên không được phạt. `o35` hiện chỉ kiếm 19,6 trên 24 điểm ở ch1 (review GD v2) |
| 4 | Luật nào cho người lớn tuổi | **ĐÃ CHỐT 2026-10-15: A là mặc định, level L21+ sinh theo luật A. Đề xuất cũ không dùng:** B là mặc định của bản phát hành (bỏ `?variant=b`). A chỉ chạy qua URL hoặc Remote Config cho A/B. Mọi level L21+ sinh theo luật B | Ít tải nhận thức hơn, ván ngắn hơn khoảng 20% `[DOC review v2]` |
| 5 | Làm Daily Post trước playtest 7 ngày không? | **Có**, bản tối thiểu (M3, M4) | Không có daily thì không đo được D7 |
| 6 | Độ dài ván | **Trung vị `o35` ≤ 6 phút** ở level thường, ≤ 8 phút ở level khó. Tương đương ≤ 46 và ≤ 52 lá | Nằm trong khoảng một ván Klondike. 2 ván vừa một phiên 15 phút |
| 7 | Thị trường và ngôn ngữ | **Song ngữ ngay từ đầu.** Playtest có điều phối bằng VI (dễ tuyển người). Soft launch và UA bằng EN (US), nơi có tệp người chơi của đối thủ `[STORE]`. Chọn chủ đề tem dễ hiểu ở cả hai thị trường (tránh Sashimi ở level đầu) | Không khoá sớm. Chi phí copy thấp vì câu ngắn |
| 8 | Bộ booster | **ĐÃ CHỐT 2026-10-15 theo câu 4: A giữ 4 booster (có Con dấu). Đề xuất cũ chỉ còn áp cho biến thể B:** Luật B gộp còn 3: Gợi ý (Pip), Nam châm, Tem Đa Năng (đổi tên từ Tem Vàng/Joker). Cộng Undo và Ô phụ. Bỏ Con dấu khỏi B (bỏ kịch bản L7). A giữ 4 booster | Con dấu và Nam châm khác nhau quá tinh tế. Tên "Tem Vàng" trùng với "Tem Điểm" (review #12) |

---

## 6. Backlog theo vòng

Mỗi vòng khoảng 1–2 giờ dev, kết thúc bằng commit riêng. **AC** = acceptance criteria. Lệnh test chung:
- `node prototype/stamp/tests/fuzz.test.mjs --quick` (gọi tắt là **fuzz**).
- `node tools/validate_levels.mjs` (gọi tắt là **validator**, có từ R2).

### Giai đoạn 1: hạ tầng generator

| Vòng | Việc | AC |
|---|---|---|
| **R1** ✅ | E1 và E2: `level_rules.mjs` và `level_spec.mjs` (TIERS, ROLE_ADJ, PATTERN, CHAPTER_TOPICS kèm fallback, `specFor`). Thêm cặp `CONFUSE` mới. Chưa sinh level. **Xong 2026-10-15, theo luật A** | `node tools/level_spec.mjs --print=21-200` in bảng 180 dòng. Test `tools/tests/level_spec.test.mjs` pass: ~~level thường ≤ 6 chủ đề (hard ≤ 7)~~ số chủ đề đúng tier A (thường ≤ 9, khó ≤ 10), 0 cặp `CONFUSE`, `n ≤ art`, số lá nằm trong tier, chủ đề mới có ở level intro, đạt hạn mức 40%/20%, không có 3 đỉnh liên tiếp. **Kết quả: 14/14 test pass (0,4 giây). 180 dòng. 42 cặp CONFUSE. Hạn mức đạt đúng 8/20 và 4/20 ở cả 9 chương. Chạy CLI 2 lần cho cùng hash** |
| **R2** ✅ | E9: validator với 4 profile, seed `check`, mục tiêu theo vai trò. Thêm profile `o35` vào `difficulty_report.mjs`. **Xong 2026-10-15** | Chạy trên `levels_b.js` L2–L20, in bảng markdown, ghi `prototype/stamp/validate-report_b.json`, mất dưới 3 phút. Phải **bắt được** L14 B (`o35` khoảng 0,39 < 0,60) như `[SIM]`. **Kết quả: B L2–L20 mất 13,6 giây (14 luồng). L14 B trượt với `o35` 0,43 < 0,60, `c25` 0,74 < 0,80 và CONFUSE Coffee+Ice cream. B 8/19 pass. A (mặc định) L2–L20 8/19 pass, mất 18,3 giây. Danh sách trượt ở `level-pipeline-r1-r3.md`** |
| **R3** ✅ | E3–E8: `gen_levels.mjs`. Sinh **ch3 (L21–40)** bằng topic dự phòng. **Sửa 2026-10-15:** mỗi vị trí chọn giữa ứng viên tự sinh và ứng viên ABI (đổi chủ đề, moves chỉnh theo mục tiêu), xếp hạng trên seed tune, kiểm tra trên seed check. Chưa nối vào game | Validator pass 20/20. Chạy lại 2 lần cho cùng hash. Report có cột phút ước tính, trung vị `o35` ≤ 6 phút. Sinh xong dưới 10 phút. **Kết quả: validator pass 20/20 trên seed check (generator và validator độc lập đều cho 20/20). 2 lần chạy cùng sha256 `e9175fe3a7469eaf`. Report có cột phút: `o35` 4,7–6,3 phút ở level thường và bump, 6,9–7,5 ở level khó. 2 level lấy từ ABI (L29, L35). Thời gian: CPU khoảng 3.600 giây; 474 giây khi máy rảnh, 751–1.163 giây khi agent khác chiếm CPU, nên AC thời gian chỉ đạt khi máy rảnh. Seed chưa dùng (90000, 300 ván): 18/20, hai trượt sát biên `o35` +5. Dùng art thật Lantern/Knitting/Acorn. Chi tiết ở `level-pipeline-r1-r3.md`** |
| **R4** | Chỉnh lại L1–L20 **A** (mặc định, sửa 2026-10-15; B chỉ còn là biến thể) bằng validator: tách seed tune/check trong `gen_proto_levels.mjs` (hoặc cho `gen_levels.mjs` nhận spec viết tay cho L2–L20), chuyển sang `level_rules.mjs`. Nới moves các level trượt `o35`: A L4, L7, L8, L17, L18, L19. Sửa Ice cream ↔ Coffee ở A L14, A L20, B L14. Quyết định trần cho L9 (48 lá, 6,7 phút), L10/L20 (58–60 lá). ~~Dựng lại L1~~ (bỏ: người dùng đã xin phép dùng nội dung ABI, rủi ro #8) | Validator A L2–L20 pass. Fuzz pass |
| **R5** | Nối vào game. **Luật A là mặc định (sửa 2026-10-15)**, không đổi save key. `LEVELS = A + LEVELS_GEN`. `?apk=1` chỉ để so sánh nội bộ. `src/chapters.js` sinh `CHAPTERS` cho 11 chương. Copy tên chương 7–11 và `chapter_body` (EN/VI). Teaser chương tổng quát hoá (dùng ảnh bưu thiếp, có placeholder). Game đọc `tip` của level (`few_counters`, `big_envelope`, `preplaced`) | Fuzz cập nhật và pass (kiểm `LEVELS_GEN`). Ảnh chụp màn hình chính ch3 và thông báo khoá ch4. ~~grep "APK 0.9.5" ra 0~~ Bản build không còn `levels_apk.js` (level ABI đã đi qua `gen_levels.mjs` và validator) |

### Giai đoạn 2: sinh level chương 3+

| Vòng | Việc | AC |
|---|---|---|
| **R6** | Sinh ch4–ch7 (L41–120): `node tools/gen_levels.mjs --from=41 --to=120`. Có "Bao thư lớn" ở L41, 3 khay ở level nghỉ p16, 5 cột từ L66, level khó 9 chủ đề từ L70, `preplace` ở L87. **Gộp R6 và R7 cũ (2026-10-15):** generator đã tự chọn ứng viên và tự kiểm tra, mất khoảng 9 phút mỗi chương | Validator pass 80/80. Test spec pass. L41 có 1 chủ đề `n = 8` (hoặc ghi rõ fallback `n = 7`). Bảng tóm tắt theo chương: trung vị số lá, `o35`, phút, số level ABI |
| **R7** | Sinh ch8–ch11 (L121–200), gộp R8 cũ | Validator pass 80/80. Toàn bộ L21–200: level thường ≤ 46 lá, level khó ≤ 54 lá. Trung bình `o35` ở level thường từng chương nằm trong 0.72–0.95 (không chương nào dễ hẳn hoặc khó hẳn; sàn slack làm `o35` thực tế cao hơn mục tiêu, xem `level-pipeline-r1-r3.md`) |
| ~~R8~~ | Gộp vào R7 (2026-10-15) | |

### Giai đoạn 3: tối ưu gameplay cho người lớn tuổi

| Vòng | Việc | AC |
|---|---|---|
| **R9** | Chạm trượt (review #1). Hỏi xác nhận Chơi lại/Home (#11). Tip `info` ≥ 6 giây, câu "Tem mới" giữ tới nước đi đầu (#9). Tip "chạm để tự đi" (#8) | Mở rộng `naive-drag.browser.js`: trượt 5/8/12pt thì lá vẫn đi. Bấm Chơi lại hiện hộp hỏi. Test kéo cũ vẫn pass |
| **R10** | M1: lưu và tiếp tục ván dở | Test trình duyệt: đi 5 nước, reload, chọn "Chơi tiếp": moves, cột, ô, bộ bài giống hệt. Chọn "Ván mới" thì không trừ gì. Có sự kiện `level_resume` |
| **R11** | ~~M2 "Thư đến trễ" ở B~~ (bỏ: level thường vẫn thua, 2026-10-15). Luật Tem Điểm mới (câu 3: Ca tối ở level khó được 2 điểm). Bỏ `boom` và rung ở banner khó, câu mới "Hôm nay hơi đông thư, cứ thong thả" (#16) | Unit test cho `stars()`. Ảnh chụp banner khó. Level thường hết lượt vẫn hiện panel thua như hiện nay |
| **R12** | M7 phần màn thắng: "Tiếp tục" là nút chính, x2 thành nút phụ từ L11. M8: thêm sự kiện, `MAX` 5000 | Ảnh chụp màn thắng ở L3 (không có x2) và L12 (x2 nhỏ). Bảng Events có `tap_drift`, `win_button`, `ad_offer`, `app_hidden`, `idle_long` |
| **R13** | M7 cỡ chữ (#3) và S3 Cài đặt (chữ 3 mức, âm lượng, rung, giảm chuyển động) | Ảnh chụp 375×812 ở mức Lớn: L1, L20, màn thắng, album, Pause. Script kiểm tra không có phần tử tràn (`scrollWidth > clientWidth`) trong panel. Lựa chọn được lưu sau khi reload |
| ~~R14~~ | Bỏ (2026-10-15): luật A giữ 4 booster có Con dấu. Việc đổi tên "Tem Vàng" thành Tem Đa Năng (review #12) gộp vào R12 nếu PO đồng ý | |

### Giai đoạn 4: tính năng retention

| Vòng | Việc | AC |
|---|---|---|
| **R15** | M3 Daily Post: `gen_levels.mjs --daily=60`, nút "Thư hôm nay" ở màn chính (mở sau L5), khoá theo ngày lịch máy, thưởng, trang "Sổ dấu ngày" trong album | Validator daily 60/60 (`c25` ≥ 0.97). Test giả lập đồng hồ: qua ngày thì đổi level, đã xong thì giữ trạng thái, chơi lại không có thưởng. Ảnh chụp |
| **R16** | M4 Thẻ tuần 5/7. S1 Thư buổi sáng. S2 Chào mừng quay lại | Unit test với đồng hồ giả: chơi các ngày 1, 2, 4, 6, 7 thì mở hộp. Vắng 3 ngày thì nhận quà quay lại đúng 1 lần. Grep copy không có "mất chuỗi" hay "streak lost" |
| **R17** | M5, M6: dữ liệu decor ch3–11 (giá tạm), placeholder bóng mờ, bưu thiếp chương vào album. S7: câu nhắn mới | Panel decor chạy ở cả 11 chương. Mua được món đầu ch3. Ảnh chụp ch3 có placeholder |
| **R18** | S4 nhắc nghỉ 45 phút. S5 thông báo cục bộ (Capacitor `@capacitor/local-notifications`, mặc định tắt) | Test đồng hồ giả: nhắc đúng 1 lần mỗi 45 phút, tắt được. Build iOS: hỏi quyền chỉ sau daily thứ 3 |

### Giai đoạn 5: economy

| Vòng | Việc | AC |
|---|---|---|
| **R19** | `tools/economy_sim.mjs`: mô phỏng 30 ngày cho persona đều đặn (`o35`) và nhanh (`c10`) theo bảng 1.2. Dùng thắng, thua, kẹt từ validator, chính sách dùng booster (Gợi ý khi kẹt, Nam châm khi kẹt cứng), daily, thẻ tuần, thưởng chương. In xu, booster tồn và Tem Điểm theo ngày | Bảng theo ngày. Đề xuất giá đạt mục tiêu: (a) sau L10, số dư `o35` không dưới giá 1 Gợi ý quá 5 level liên tiếp; (b) số dư ở D30 trong khoảng 800–2.500 (không tích trữ vô nghĩa); (c) `o35` mua đủ 6 decor mỗi chương trong một lượt chơi; (d) trung bình đủ xu cho 1 booster mỗi 3–4 level |
| **R20** | Áp hằng số mới (`COSTS`, thưởng, giá decor) vào `main.js` và `chapters.js`. Chạy lại sim | Sim pass (a)–(d). Bảng giá cuối gửi PO chốt (PO quyết giá IAP và quảng cáo) |

### Giai đoạn 6: QA toàn bộ

| Vòng | Việc | AC |
|---|---|---|
| **R21** | QA: validator 200 + 60 với 300 ván. Fuzz đầy đủ (`--games=120`). Test kéo trên trình duyệt. Quét ảnh chụp: level đầu mỗi chương và mọi level khó (EN/VI, chữ Lớn). Kiểm tra chế độ `lite` | Tất cả pass. Thư mục ảnh chụp. Danh sách lỗi đã sửa |
| **R22** | `tools/content_days.mjs`: tính persona tới level nào ở từng ngày, dựa trên trung vị validator × giây/nước. Kiểm tra đường cong: không có 3 level thường liên tiếp với `o35` < 0.75. Chạy hết checklist mục 7 | Persona đều đặn ở D30 ≤ L140. Persona nhanh hết chiến dịch ≥ D26. Checklist mục 7 đủ |

### Vòng art (cần người dùng chạy ChatGPT; agent chuẩn bị prompt, `grid_map`, lệnh cắt)

| Vòng | Việc | Mở khoá |
|---|---|---|
| A1 | 9 chủ đề ch3–5 cùng icon | Sinh lại ch3–5 bằng chủ đề thật |
| A2 | 9 chủ đề ch6–8 cùng icon | Sinh lại ch6–8 |
| A3 | 9 chủ đề ch9–11 cùng icon | Sinh lại ch9–11 |
| A4 | Decor ch3–7 (5 lưới) và 5 bưu thiếp | Thay placeholder |
| A5 | Decor ch8–11 (4 lưới), 4 bưu thiếp, icon booster | Thay placeholder |

Thứ tự gợi ý (sửa 2026-10-15): R1–R3 ✅ → R4 → R5 → A1 (song song R6) → R6–R7 → R9–R13 → R15–R18 → R19–R20 → A2–A5 cộng sinh lại các chương có art mới → R21–R22. **Tổng: 20 vòng dev** (22 − R8 − R14), trong đó còn 17.

---

## 7. Definition of Done (khi nào vòng lặp dừng)

Vòng lặp dừng khi **mọi ô dưới đây đều đạt**. Các mục Could chuyển sang backlog sau launch.

| Nhóm | Tiêu chí |
|---|---|
| Level | 200 level chiến dịch và 60 Daily. ~~Bản build phát hành có 0 level APK. L1 có bố cục riêng~~ (bỏ 2026-10-15: được dùng level ABI). Mọi level L21+ có `source` (`gen:` hoặc `abi:`) và đã qua validator |
| Validator | 100% pass trên seed `check` (≥ 300 ván): level thường `o35` ≥ mục tiêu của chương và `o35` +5 ≥ 0.93. Level khó: `c10` 0.15–0.35, kẹt ≤ 0.10. Level nghỉ: `o35` ≥ 0.85 |
| Đường cong | Level thường **luật A ≤ 8 chủ đề** (bump ≤ 9), ≤ 46 lá, trung vị `o35` ≤ 6 phút (bump ≤ 6,5). Level khó ≤ 54 lá, ≤ 8 phút. 0 cặp `CONFUSE`. Mỗi chương 20 level có 4 level nghỉ. Không có 3 đỉnh liên tiếp |
| Chủ đề mới | ≥ 18 chủ đề mới có art (≥ 2 mỗi chương, mục tiêu 27), qua confusion check |
| Tính năng Must | M1–M9 xong. 8 câu PO đã chốt (theo mặc định mục 5 hoặc theo PO) |
| Economy | Sim R19 đạt (a)–(d) |
| Test | Fuzz đầy đủ, test spec, test kéo trên trình duyệt, test đồng hồ giả (daily, thẻ tuần, quay lại, nhắc nghỉ), kiểm tra build không có level APK |
| Nội dung 30 ngày | `content_days`: persona đều đặn ≤ L140 ở D30, persona nhanh hết chiến dịch ≥ D26, ngày nào cũng có Daily |
| Tài liệu | `CLAUDE.md` trỏ tới generator mới và tài liệu này. Có bảng trạng thái R1–R22 |

---

## 8. Rủi ro lớn

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| 1 | **Người chơi mô phỏng không phải người lớn tuổi thật.** `o35` là giả định, có thể quá hào phóng hoặc quá khắt khe | Playtest có điều phối (8–10 người) ngay sau R14. Thêm hệ số moves toàn cục chỉnh được qua Remote Config (+0–15%) |
| 2 | **Art phụ thuộc người dùng** (khoảng 50 ảnh, giới hạn upload) | Dùng topic dự phòng để không chặn dev. DoD chỉ cần 18 chủ đề mới. Decor dự phòng: đổi màu decor chương 1–2 |
| 3 | **200 level không có luật mới** dễ gây đơn điệu với người chơi chăm (ABI bị chê đúng điểm này `[STORE]`) | 3 chủ đề mới mỗi chương, biến thể cấu trúc (3.4), Could "Cột ngửa" và "Tem hiếm". Đo `level_quit` theo chương |
| 4 | ~~Soft-fail làm mất chỗ chi xu chính~~ Không còn (level thường vẫn thua, 2026-10-15). Rủi ro ngược lại: người lớn tuổi thua nhiều thì bỏ game | Moves chỉnh theo mục tiêu `o35` trên seed riêng. Thêm hệ số moves toàn cục qua Remote Config (rủi ro #1). Đo `level_fail` theo level |
| 5 | Chủ đề mới dễ nhầm (Candle–Lantern, Bread–Cake, Weather–Planet…) | Thêm cặp vào `CONFUSE` trước khi sinh. Confusion test ở cỡ lá thật |
| 6 | Đổi mặc định sang B làm tester TestFlight mất tiến trình (khác save key) | Chép save A sang B lần đầu (R5) |
| 7 | Validator bị khớp quá sát nếu dùng seed `check` để chỉnh | Quy tắc E4: seed `check` chỉ để kiểm tra. Đổi seed `check` mỗi lần QA lớn (R21) |
| 8 | ~~L1 dựng tay theo video level 1 của ABI~~ | **Đóng 2026-10-15:** người dùng đã xin phép dùng nội dung ABI |
| 9 | Ca tối ở level khó vẫn có thể bị cảm nhận như "thua" (review GD v2) | Bỏ `boom` và rung, cho 2 Tem Điểm, copy ấm. Hỏi trong playtest: "Bạn có nghĩ mình đã thua không?" |

## 9. Câu hỏi còn mở

1. PO xác nhận 8 mặc định ở mục 5, đặc biệt câu 1 (soft-fail) và câu 8 (bỏ Con dấu ở B).
2. Người dùng duyệt danh sách 27 chủ đề mới và 9 tên khu (mục 2.2) trước A1.
3. Nhịp phiên của người lớn tuổi (bảng 1.2) cần số liệu thật: playtest mang về nhà 7 ngày, đo `session_length` và số level mỗi ngày.
4. Daily theo ngày lịch toàn cầu (mọi người cùng một thư) hay theo ngày kể từ khi cài? Đề xuất: theo ngày lịch, vì "tem có dấu ngày thật" (concept mục 5).
