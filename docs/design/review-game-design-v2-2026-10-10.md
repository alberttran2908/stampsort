# Review game design v2: Stamp Sort / Little Post Office qua lăng kính người chơi lớn tuổi (2026-10-10)

**Build:** commit `76ff32b`, 20 level (A và B). Không sửa code game.
**Lăng kính:** người chơi lớn tuổi, tone chill (`older-players-pass.md`), cùng các mục tiêu sẵn có: D1, cozy, không cốt truyện, không "thua" (`concept-little-post-office.md` dòng 13, P4).

**Nhãn nguồn:**

| Nhãn | Nghĩa |
|---|---|
| `[CODE file:dòng]` | Mặc định là `prototype/stamp/src/main.js` |
| `[DOC file]` | Tài liệu trong repo |
| `[DATA]` | `levels-report*.json`, `difficulty-report.json` |
| `[SIM]` | Mô phỏng tôi tự chạy. Script `scratchpad/sim/pts_sim.mjs`: engine và `sampleHidden` thật, 30 ván mỗi level mỗi profile, seed 500+L, **độc lập với seed của generator** |
| `[SS]` | Ảnh chụp và thao tác thật trên Chrome headless 375×812 |
| `[GIẢ THUYẾT]` | Suy luận, cần playtest |

**Profile mô phỏng:**
- `c10`: phổ thông, phí 10% nước.
- `c25`: người mới, phí 25%.
- `o35`: người lớn tuổi mới chơi `[GIẢ THUYẾT]`, nhìn trước 4 bước, nhiễu 2.0, phí 35%.
- Thời gian mỗi nước: 3.2 / 3.8 / 4.5 giây `[GIẢ THUYẾT]`.

---

## Tóm tắt

1. Core loop, juice, âm thanh và theme đã nhất quán cozy. Các lỗi tutorial của 2 vòng QA đều đã sửa. Với người lớn tuổi, nền tảng đã đúng hướng.
2. **Lỗi tương tác lớn nhất còn lại: chạm hơi trượt thì bị mất.** Ngưỡng nhận kéo là 12px stage, tức khoảng 4pt trên điện thoại. Chạm trượt từ 5pt trở lên thành "kéo hụt": lá không đi, không có câu báo, và **không ghi sự kiện nào** `[SS]` `[CODE 1316, 1385]`. Đây đúng là kiểu chạm của người run tay.
3. **Chương 2 chưa "hào phóng" như tài liệu ghi.** Đo bằng seed độc lập, người mới thắng trong số moves ở L13 77%, L18 80%, L19 60%. Người lớn tuổi (giả định) chỉ thắng 33–60% ở L13/L14/L17/L19, và 10–27% vẫn thua sau khi đã dùng +5 miễn phí `[SIM]`. Số ≥ 80% trong tài liệu đang khớp quá sát với seed mô phỏng của generator.
4. **Normal level vẫn có trạng thái "thua".** Có màn "Hết nước" kèm tiếng lose, trái với concept "thư chỉ bị trễ". Ở level khó, 97–100% người lớn tuổi vào Ca tối và chỉ nhận 1 Tem Điểm, nên họ nhận đều đặn một tín hiệu "làm chưa tốt" `[SIM]` `[CODE 1936, 2050]`.
5. **Meta đọc được, nhưng được cân cho người chơi phổ thông.** Người lớn tuổi qua chương 1 được khoảng 19.6 Tem Điểm trên 24 cần, nên giỏ mèo Pip (món đắt nhất, cũng là món "đáng yêu" nhất) bị khoá sau việc chơi lại `[SIM]`. Chưa có daily hook (Daily Post có trong MVP của concept). 20 level chỉ đủ khoảng 2 giờ, nên không đo được D7.
6. **Đọc và chạm vẫn dưới chuẩn cho người lớn tuổi.** Chữ hướng dẫn, toast và popup khoảng 12–15pt. Nhãn trên lá vương miện khoảng 10–12pt. Không có cài đặt chữ lớn, âm lượng, rung. Không có hỏi xác nhận khi bấm Chơi lại, và không lưu ván dở khi bị gián đoạn.
7. **Trước playtest với người lớn tuổi thật**, cần sửa 5 việc P0: chạm trượt, analytics còn thiếu, cỡ chữ, thứ tự nút ở màn thắng, lưu ván dở. Cũng cần PO chốt 3 chính sách: normal level có được thua không, có giữ "Nhận x2" không, và Tem Điểm ở level khó.

---

## 1. Core loop và nhịp phiên

| Ý | Đánh giá | Nguồn |
|---|---|---|
| Vòng lặp | Rõ ràng: tem vương miện mở ô, gom tem cùng loại, phong bì bay vào thanh tiến độ, cư dân đáp lời. Đây là điểm mạnh nhất | `[SS l13_vi, win_vi]` |
| Độ dài ván, A | Phổ thông 3.4–5.6 phút. **Người lớn tuổi 5.1–8.7 phút** ở L3–L10 và 4.4–8.3 phút ở chương 2. L10 khoảng 116 nước | `[SIM]` |
| Độ dài ván, B | Người lớn tuổi 4.2–5.9 phút (cả 20 level mất khoảng 97 phút, A mất khoảng 121 phút). B vừa ngắn hơn vừa ổn định hơn | `[SIM]` |
| Nhận định thời lượng | Một ván Klondike thường 5–8 phút, nên độ dài không phải vấn đề. Vấn đề là **8 phút đếm moves về 0** mà **không lưu ván dở** (không có `visibilitychange` hay lưu state). Một cuộc gọi đến là mất cả ván | `[CODE]` grep không có, `[GIẢ THUYẾT]` |
| Số lá và chủ đề | A: L1 16 lá/3 chủ đề → L2 30/6 → L4 43/8 → L10 60/9 với 5 ô. Mỗi bậc gần gấp đôi. B giới hạn 34–41 lá, 6 chủ đề | `[DATA levels-report*.json]` |
| Tải nhận thức | Mỗi lúc phải giữ trong đầu: 4–5 ô đang mở, 7–9 chủ đề (vương miện nào đã thấy, nằm đâu), 20–35 lá trong bộ bài và 10–18 lá úp. Công cụ hỗ trợ đã có: nhãn ribbon trên ô, chạm ô để xem, thanh 0/N. **Chưa có gì cho biết còn những chủ đề nào chưa mở** | `[CODE 506–520]` |
| Cặp tem dễ nhầm còn sót | Kem ly đựng trong tách sứ (Ice cream art 4) ↔ Coffee (ly frappé có kem). Chung level ở A L14, A L20, B L14 | `[SS arts]`, `[SIM]` quét level |
| Kéo thả | Đã tốt cho người mới: cầm lá nào trong xấp cũng nhấc cả xấp, thả theo ngón tay (`ftue-copy.md` mục 7) | `[DOC]` |
| **Chạm trượt** | Ngưỡng kéo 12px stage, tức `12 × 0.347` ≈ 4pt trên màn 375pt. Android dùng 8dp, iOS khoảng 10pt. Thử thật: trượt 3pt thì vẫn đi; trượt 5, 8, 12pt thì không đi, không toast, chỉ có tiếng "phù". Trong kịch bản L1, chạm trượt còn hiện câu "Đặt vào ô bàn tay chỉ" dù người chơi đã chạm đúng lá | `[SS tremor]`, `[CODE 162, 1316, 1380–1388]` |
| Chạm để tự đi | Đã có và chọn đích có ích trước. **Nhưng chưa bao giờ được dạy**: L1 chỉ dạy "Kéo…", và không có tip nào nói "chạm tem để tự đi". Người khó kéo sẽ không biết có lối đi dễ hơn | `[CODE 1093–1111]`, `[DOC copy.js]` |
| Chạm đúp do run tay | Cú chạm thứ hai trong vòng 250 ms bị bỏ qua. Hợp lý | `[CODE 1245]` |

## 2. FTUE L1–L4 sau khi sửa

| Level | Người chơi gặp | Còn vướng (người lớn tuổi) | Nguồn |
|---|---|---|---|
| L1 | Kịch bản 8 bước, moves vô hạn. Chỉ có Undo (mờ) và 1 nút khoá "Lv 2" | Tốt. Chạm trượt bị báo sai (mục 1). Bàn tay vẫn đè lên icon và số "0/3" của lá vương miện ở bước 1 | `[SS l1_vi]` |
| L2 | Banner, rồi **bảng luật 6 câu**, tip moves, tip vương miện, tip rút bài. Sau 6 nước có popup tặng Gợi ý. Khay "+1 ô" có ổ khoá nhưng vẫn mua được | Bảng luật 6 câu đọc một lần là nhiều. Tip loại `info` (moves, peek, full) tự tắt sau **3,8 giây** hoặc ngay khi có nước đi, ngắn hơn nhịp 9 giây của vòng người lớn tuổi. Ổ khoá trên khay mua được trông như "chưa dùng được" | `[CODE 1143, 2257–2262]`, `[SS l4_vi]` |
| L3 | 4 ô, tip xếp chồng, xem ô, cột trống | Ổn. Gợi ý khi đứng yên sau 7 giây có thể làm người đang nghĩ thấy bị giục `[GIẢ THUYẾT]`, nhưng vẫn có lợi nhiều hơn | `[CODE 1163–1166]` |
| L4 | Popup tặng Nam châm và kịch bản. 8 chủ đề, 43 lá | Bước nhảy lớn nhất: từ 6 lên 8 chủ đề, cùng lúc với booster mới. Ở L4, người lớn tuổi thắng trong moves 67%, thua sau +5 là 13% `[SIM]`. B (6 chủ đề) cho 87% / 0% | `[SIM]` |
| Thứ tự booster | Undo L1 → Gợi ý L2 → Ô phụ L2 → Nam châm L4 → Con dấu L7 → Tem Vàng L9 | Thứ tự hợp lý. Nhưng tới L9 người chơi có **7 công cụ hỗ trợ**. Con dấu và Nam châm khác nhau tinh tế. Icon Con dấu là cái thông bồn đồ chơi màu đỏ-xanh-vàng, icon Tem Vàng là mũ hề: cả hai không khớp tên, lệch theme | `[SS l15_en]` |
| Câu "Tem mới: …" ở chương 2 | Hiện 3,6 giây rồi tự tắt | Hơi ngắn với người đọc chậm `[GIẢ THUYẾT]`. Nên giữ tới nước đi đầu tiên | `[CODE 2213]` |

## 3. Đường cong độ khó 20 level

Số liệu `[SIM]`, 30 ván. Ô ghi: thắng trong moves / thua dù đã dùng +5 miễn phí. Level khó ghi tỉ lệ vào Ca tối.

| L | Vai trò | Lá/chủ đề A | c25 A | o35 A | o35 B |
|---|---|---|---|---|---|
| 4 | normal | 43/8 | 93% / 0 | 67% / 13% | 87% / 0 |
| 5 | HARD | 50/8 | Ca tối 97% | Ca tối 97% | Ca tối 100% |
| 6 | normal | 40/7 | 97% / 0 | 73% / 20% | 53% / 10% |
| 7 | normal | 43/7 | 87% / 0 | 40% / 13% | 50% / 7% |
| 8 | normal | 41/7 | 93% / 0 | 80% / 10% | 63% / 23% |
| 10 | SUPERHARD | 60/9 | Ca tối 100% | Ca tối 100% | Ca tối 97% |
| 12 | normal | 38/7 | 97% / 0 | 93% / 3% | 67% / 3% |
| 13 | normal | 41/7 | 77% / 0 | 60% / 0 | 77% / 7% |
| 14 | bump | 48/8 | 90% / 3% | 43% / 10% | 47% / 13% |
| 15 | HARD | 52/8 | Ca tối 93% | Ca tối 100% | Ca tối 100% |
| 17 | normal | 44/7 | 90% / 0 | 47% / 17% | 63% / 7% |
| 18 | normal | 46/7 | 80% / 3% | 70% / 13% | 80% / 3% |
| 19 | bump | 50/8 | 60% / 13% | 33% / 27% | 70% / 3% |
| 20 | SUPERHARD | 58/9 | Ca tối 93% | Ca tối 100% | Ca tối 90% |

- **Chương 1 (baseline A):** với người lớn tuổi, các level thường thua 10–20% sau khi đã dùng +5. Hợp lý cho một bản clone ABI, nhưng lệch pillar "không thua" `[SIM]`.
- **Chương 2 không dễ hơn chương 1** khi đo bằng seed độc lập. L13, L19 (c25) và L14, L17, L19 (o35) còn khó hơn L6–L8. Nguyên nhân: generator nâng moves theo phân vị của **40 ván với đúng seed đã dùng để chọn layout** (`gen_proto_levels.mjs`, nhánh `newbieMin`), nên kết quả khớp quá sát `[CODE tools/gen_proto_levels.mjs:308–313]`.
- **Mốc L5/L10/L15/L20:** cơ chế "trông khó nhưng không thể thua" chạy đúng, kẹt cứng 0% `[SIM]`. Người lớn tuổi gần như **luôn** vào Ca tối.
  - Mặt tốt: không bao giờ bị chặn.
  - Mặt xấu: 7–9 phút đếm ngược về 0 mà không biết mình không thể thua, rồi chỉ được 1/3 Tem Điểm. Banner khó vẫn có tiếng `boom` và rung màn hình `[CODE 2237]`.
- **A và B:** B có tỉ lệ thua tương đương A, nhưng ngắn hơn khoảng 20% thời gian, và L4/L10/L20 nhẹ hơn hẳn về tải nhận thức. B vẫn có điểm yếu ở L6, L8, L14 `[SIM]`. Với người lớn tuổi, nghiêng về **luật B (≤ 6 chủ đề)** `[GIẢ THUYẾT, cần playtest]`.
- **Hệ quả cho UA:** L5 lọc người kiên nhẫn được, nhưng lọc **theo thời gian** chứ không theo kỹ năng. Mốc này vẫn hợp lệ với người lớn tuổi, với điều kiện Ca tối không bị cảm nhận như một lần thua (đo ở mục 8).

## 4. Meta và retention

| Ý | Đánh giá | Nguồn |
|---|---|---|
| Tem Điểm thay sao | Dễ hiểu hơn sao, có fiction, lúc "đóng cộp" rất đã tay. Có câu giải thích lần đầu và nút "Trang trí: <món>" ngay ở màn thắng | `[SS win_vi]` |
| Thu nhập Tem Điểm, một lượt chơi | c10: 25.1 (ch1) và 24.0 (ch2). c25: 21.9 và 19.5. **o35: 19.6 và 16.7**. Giá decor là 24 mỗi chương | `[SIM]` |
| Hệ quả | Người lớn tuổi mua được 5/6 món ở chương 1. **Giỏ mèo Pip (6 điểm)** phải chơi lại, mà chơi lại một level 5–8 phút để nâng từ 2 lên 3 điểm là việc khó với chính nhóm này. Hết 20 level, họ có khoảng 36 trên 48 điểm, nên chương 2 chỉ được khoảng 3/6 món | `[SIM]` |
| Level khó | Ca tối luôn cho 1 điểm. 4 level khó × (3 − 1) = **mất 8 điểm** so với mức tối đa, rơi đúng vào người lớn tuổi (97–100% vào Ca tối) | `[CODE 1936]`, `[SIM]` |
| Album | Tự đầy theo mỗi lần thắng, không có lựa chọn, kiểu "sổ lưu niệm". Hợp người lớn tuổi. Icon tem trong album 32–40px là nhỏ | `[CODE 2022–2044]` |
| Chương 2 | Lời hứa "thị trấn còn gì" (bưu thiếp cảng, Bo, decor mới) có thật. Người lớn tuổi tới L10 sau khoảng 55–60 phút chơi, nên phần lớn sẽ mở chương 2 ở phiên thứ 2–3 `[SIM]` thời lượng | `[SIM]` |
| D1 | Có 2 lý do quay lại: món decor kế tiếp hiện mờ, và chương 2. **Không có** daily, streak hay thông báo. Daily Post + streak là MVP trong concept nhưng chưa làm | `[DOC concept dòng 138]` |
| D7 | Khoảng 2 giờ nội dung cho người lớn tuổi, nên người chơi đều đặn sẽ hết game ở D2–D3. **Bản hiện tại không đo được D7** | `[SIM]` |
| Người lớn tuổi có hiểu không | Vòng "thắng → tem → trang trí phòng" quen thuộc (giống Homescapes, nhưng không có cốt truyện). Rủi ro là **tên dễ nhầm**: "Tem Vàng" (booster) với "Tem Điểm" (icon cũng là một con tem vàng có dấu đỏ) | `[SS win_vi]`, `[GIẢ THUYẾT]` |

## 5. Economy

| Ý | Đánh giá | Nguồn |
|---|---|---|
| Giá | Undo 30, Gợi ý 150, Nam châm và Con dấu 250, Tem Vàng 500, Ô phụ 400, +5 nước 300. Khởi đầu 500 xu | `[CODE 26]` |
| Thu | Thắng 20–40 xu (x2 nếu xem quảng cáo), combo +5, hết chương +200. 20 level được khoảng 1.600 xu không tính x2 `[GIẢ THUYẾT, ước theo SIM]` | `[CODE 1956, 2010]` |
| Quà | Gợi ý 3, Nam châm 2, Con dấu 2, Tem Vàng 2, cứu trợ ở level khó, +5 nước qua quảng cáo mỗi level một lần, Undo 5 lượt | `[CODE 29, 2121]` |
| Chỗ chi xu có ý nghĩa | **Có**, và nhờ chính độ khó hiện tại: 10–27% ván của người lớn tuổi hết nước dù đã dùng +5 miễn phí, nên +5 bằng xu (300) là chỗ chi thật. Nếu PO chọn "không thua" (mục 9) thì chỗ chi này biến mất, khi đó Gợi ý trở thành chỗ chi chính | `[SIM]` |
| Undo 5 lượt | Đúng với người lớn tuổi. Undo hoàn lại nước, nên với người đi phí thì đây là khoản +moves ngầm. Lỗ nhỏ: Undo sau khi rút bài làm lộ lá kế tiếp trong bộ bài (chỉ cột mới được giữ ngửa). Không hại người chơi, nhưng làm lệch số mô phỏng | `[CODE 633–650]` |
| "Nhận x2 (quảng cáo)" | Là **nút đầu tiên, to nhất, màu xanh nổi**, phía trên "Tiếp tục" ở mọi màn thắng. Người lớn tuổi hay bấm nút to đầu tiên, nên dễ xem quảng cáo ngoài ý muốn ở mỗi level. Vẫn trái gdd-core mục 6 (MVP không có double reward) | `[SS win_vi]`, `[CODE 1988]`, `[DOC gdd-core.md:130]` |
| Quảng cáo +5 nước | Hợp P4 (tự chọn). Nhưng việc xem quảng cáo **chưa được ghi sự kiện** ở 3/4 vị trí (x2, ô phụ, +5 kiểu "Suýt nữa"). Chỉ `continue_moves` có `source` | `[CODE 898, 1988, 2056, 2097]` |

## 6. Theme, art, âm thanh, copy

| Ý | Đánh giá | Nguồn |
|---|---|---|
| Cozy | Nhất quán: tem, khay gỗ, nền ca tối, decor, câu nhắn cư dân, SFX dải trung nhỏ nhẹ. Các chỗ lệch: icon Tem Vàng (mũ hề), icon Con dấu (đồ chơi), banner khó có `boom` và rung, "Nhận x2" màu xanh chói | `[SS]` |
| Icon nét trên lá vương miện | Phân biệt tem thường với vương miện tốt. Tín hiệu chính là **khung vàng và vương miện**, icon nét chỉ là phụ. Nét nâu mảnh trên nền kem khoảng 40pt: đọc được với crab, thuyền, sò; **yếu** với Kite (hình thoi có đuôi), Soda (lon trơn), Coffee/Tea (đường cong mảnh) `[GIẢ THUYẾT]`. Nhãn tên 29–30px stage ≈ 10pt, màu `#8a4b12` trên vàng, tương phản khoảng 4,6:1 | `[SS arts, l20_vi]`, `[CODE index.html:56]` |
| Đề xuất icon | Nét dày hơn khoảng 1,5 lần và **tên chủ đề làm tín hiệu chính** (≥ 36px, xuống 2 dòng thay vì co nhỏ). Đo bằng confusion test (mục 10) | `[GIẢ THUYẾT]` |
| SFX | Hợp người lớn tuổi về giấy tờ (`sfx-review.md` mục 8). Chưa có người nghe xác nhận bằng tai. Chưa có nhạc nền (với nhóm này có khi lại tốt) | `[DOC]` |
| Copy VI | Câu ngắn, có động từ, nhất quán. Các điểm vướng: "NƯỚC" và "Hết nước" có thể đọc thành "nước uống" (gợi ý thử "LƯỢT" / "Hết lượt") `[GIẢ THUYẾT]`. "Level", "Combo", tiêu đề "STAMP SORT" chưa Việt hoá. "Hàng hải", "Cocktail", "Sashimi" lạ với người lớn tuổi Việt `[GIẢ THUYẾT]` | `[DOC copy.js]` |
| Copy EN | Tốt: "Evening shift", "Finish at your pace". Từ "stamp" bị dùng cho 4 thứ: crown stamp, Golden Stamp, Stamp Points, Stamper | `[DOC copy.js]` |
| "Không thua" trong copy | Concept: "Thư bị trễ… Mai giao tiếp", không có từ thua. Code: tiêu đề "Hết nước / Out of Moves" kèm tiếng `lose` | `[DOC concept:120]`, `[CODE 2050, 2071]` |

## 7. Accessibility cho người lớn tuổi

| Hạng mục | Hiện có | Thiếu hoặc dưới chuẩn |
|---|---|---|
| Cỡ lá | 184×239 stage khi có ≤ 4 cột, khoảng 64×83pt. 5 cột: khoảng 57×74pt | Còn khoảng 20% chiều cao trống giữa cột bài và hàng rút bài lúc đầu ván `[SS l13_vi]`. Với 4 cột có thể lên khoảng 205px (+11%) |
| Cỡ chữ | Nhỏ nhất 34–36px stage, khoảng 12pt. Toast 42px, khoảng 14,6pt. Popup 40px, khoảng 13,9pt | Người lớn tuổi nên đọc **≥ 16–17pt**, tức ≥ 46–48px stage. Nhãn vương miện khoảng 10pt. Tem Điểm nhỏ trên ô level khoảng 10pt `[SS home_vi]` |
| Tương phản | Popup `#7a5238` trên kem khoảng 6,4:1: tốt | Nhãn vương miện khoảng 4,6:1. Huy hiệu giá (vàng) và số lượng (đỏ) **chỉ khác nhau ở màu**, không có icon xu |
| Màu | Khung lá theo chủ đề là kênh phụ, không bắt buộc | Chưa kiểm tra mù màu |
| Vùng chạm | Booster khoảng 40pt. Dải lộ của lá ngửa khoảng 27pt | Ngưỡng chạm trượt khoảng 4pt (mục 1). Dải lộ khoảng 27pt nhỏ hơn 44pt nhưng vẫn chấp nhận được vì cầm lá nào cũng nhấc cả xấp |
| Thời gian | Không có timer. Toast ≥ 2,2 giây. Nhãn gợi ý 9 giây | Tip `info` 3,8 giây, câu chủ đề mới 3,6 giây |
| Chuyển động | Rung và pulse đã dịu. Có tôn trọng `prefers-reduced-motion` | Không có công tắc trong game. Banner khó vẫn có tiếng `boom` và rung |
| Cài đặt | Pause có: Âm thanh bật/tắt, Ngôn ngữ, Cách chơi | Thiếu: **cỡ chữ (Lớn / Rất lớn)**, âm lượng SFX, tắt rung, giảm chuyển động, chế độ tay trái (bộ bài đang ở bên phải), nhắc nghỉ sau khoảng 30–45 phút |
| An toàn thao tác | | **Chơi lại** là nút cam nổi trong Pause và không hỏi xác nhận `[CODE 2422]`. Home giữa ván cũng không hỏi. Không lưu ván dở |

## 8. Rủi ro và đo lường trước playtest

**Sự kiện đã có** `[CODE track(...)]`:
- Funnel: `level_start`, `level_complete` (time_s, stars, overtime, undo, boosters), `level_fail`, `level_quit`, `level_stuck`.
- Level khó và cứu trợ: `overtime_start`, `rescue_*`, `continue_moves`.
- Tương tác và hướng dẫn: `invalid_move` (reason), `slot_open` (via), `tip_shown`, `topic_intro`.
- Meta: `points_earned`, `decor_*`, `album_open`, `chapter_*`.
- Mọi sự kiện mang `session` và `sinceInstallMin`, đủ để tính D1.

**Còn thiếu (cần thêm trước playtest):**

| Sự kiện | Vì sao |
|---|---|
| `tap_drift` (độ trượt px, có hay không có đích) | Lỗi chạm trượt hiện vô hình: `invalid_move` chỉ được ghi khi có lý do `[CODE 1385]` |
| `input_mix` trong `level_complete`: số lần chạm và số lần kéo | Biết người lớn tuổi chọn cách nhập nào |
| `ad_offer` / `ad_watch` (vị trí: x2, ô phụ, +5, Suýt nữa) | Đo việc bấm nhầm "Nhận x2" |
| `app_hidden` / `level_abandon` (visibilitychange) | Ván bị bỏ do gián đoạn hiện không ghi |
| `pause_open`, `setting_change`, `rules_open` | Đo nhu cầu cài đặt và đọc lại luật |
| `idle_long` (> 30 giây không thao tác) | Phát hiện bối rối hoặc mệt |
| `win_button` (nút nào được bấm) | Đo phản ứng ở màn thắng |
| Bộ đệm sự kiện | `MAX = 800` `[CODE analytics.js:6]`. Playtest 7 ngày có `invalid_move` dày nên dễ tràn. Cần tăng lên hoặc xuất định kỳ |

**Rủi ro chính:**
1. Chạm trượt khiến người chơi tưởng "game hỏng".
2. Chữ nhỏ khiến người chơi phải đeo kính hoặc bỏ game.
3. Thua ở normal level hoặc Ca tối bị cảm nhận như thua, nên người chơi bỏ ở L5/L7/L14/L19.
4. Gián đoạn mất ván.
5. Bấm nhầm quảng cáo x2.
6. Hết nội dung ở D2–D3, nên dữ liệu D7 không có nghĩa.

---

## 9. Bảng việc ưu tiên

Effort: S ≤ 1 ngày, M 2–4 ngày, L ≥ 1 tuần.

| # | Mức | Việc | Vì sao | Effort | Owner |
|---|---|---|---|---|---|
| 1 | P0 | Chạm trượt: nếu ngón tay đi < 30–36px stage (khoảng 10–12pt) và không có đích kéo hợp lệ thì xử lý như **chạm**. Nâng ngưỡng bắt đầu kéo lên khoảng 24px stage. Không hiện câu từ chối của kịch bản trong trường hợp này | Chạm trượt từ 5pt trở lên đang mất hẳn, không báo, không ghi `[SS]` | S | code |
| 2 | P0 | Thêm sự kiện mục 8 (`tap_drift`, `input_mix`, `ad_offer/watch`, `app_hidden`, `pause_open`, `setting_change`, `idle_long`, `win_button`), tăng `MAX` | Không có những sự kiện này thì playtest không trả lời được câu hỏi chính | S | code |
| 3 | P0 | Cỡ chữ: chữ hướng dẫn, toast, popup ≥ 48px stage. Nhãn booster, Undo, số trên khay ≥ 40px. Nhãn vương miện ≥ 34px (2 dòng, không co). Huy hiệu giá có icon xu | Hiện khoảng 12–15pt, dưới mức đọc thoải mái của người lớn tuổi | M | code, design |
| 4 | P0 | Màn thắng: "Tiếp tục" là nút chính. "Nhận x2" thành nút phụ nhỏ hoặc bỏ hẳn (PO chốt). Không bao giờ để quá 2 nút to | Tránh bấm nhầm quảng cáo, giữ P4 `[SS win_vi]` | S | code, PO |
| 5 | P0 | Lưu ván dở: lưu `S` khi `visibilitychange` hoặc mỗi nước đi, mở lại thì hỏi "Chơi tiếp ván dở?" | Ván 5–9 phút. Người lớn tuổi hay bị gián đoạn. Bắt buộc nếu playtest mang về nhà 7 ngày | M | code |
| 6 | P1 | Kiểm lại độ khó chương 2 bằng seed độc lập, ≥ 100 ván, thêm profile `o35`. Nới L13, L14, L17, L19 tới khi `o35` thua sau +5 ≤ 5%. Generator: tách seed chọn layout khỏi seed kiểm tra | Tài liệu nói ≥ 80% nhưng `[SIM]` độc lập ra 60–80% (c25) và 33–60% (o35) | M | design, code |
| 7 | P1 | Tem Điểm: Ca tối cho 2 điểm (thắng trong moves vẫn 3), hoặc hạ giá decor còn 2/2/3/3/4/4. Mục tiêu: `o35` mua đủ 6 món mỗi chương trong một lượt chơi | Hiện `o35` có 19.6 trên 24. Giỏ mèo Pip đang bị khoá sau việc chơi lại | S | design, PO |
| 8 | P1 | Dạy "chạm để tự đi": 1 tip ở L2, hoặc ngay sau lần kéo hụt đầu tiên | Người khó kéo không biết có lối đi dễ hơn | S | design, code |
| 9 | P1 | Nhịp đọc: tip `info` ≥ 6 giây, câu "Tem mới" giữ tới nước đi đầu tiên. Bảng luật L2 rút còn 3 câu (mở ô, gửi thư, moves); xếp chồng và Undo dạy lúc cần | Đồng bộ với nhịp 9 giây của vòng người lớn tuổi | S | design, code |
| 10 | P1 | Bảng Cài đặt: cỡ chữ Lớn/Rất lớn, âm lượng SFX, rung bật/tắt, giảm chuyển động, tay trái | Những thứ cơ bản người lớn tuổi sẽ tìm | M | code, design |
| 11 | P1 | Hỏi xác nhận khi bấm Chơi lại hoặc Home giữa ván. Chơi lại không dùng màu cam nổi | Tránh mất ván do bấm nhầm `[CODE 2422]` | S | code |
| 12 | P1 | Đổi tên để tránh trùng "Tem Vàng" và "Tem Điểm": Joker thành "Tem Đa Năng" / "Wild Stamp", icon con tem vàng có ngôi sao. Con dấu dùng icon con dấu gỗ | Hai tên trùng chữ "tem vàng". Icon mũ hề và đồ chơi lệch theme `[SS l15_en]` | S (copy) + S (art) | design, art |
| 13 | P1 | Sửa cặp nhầm: kem ly trong tách (Ice cream 4) ↔ Coffee. Thêm vào `avoid` hoặc `CONFUSE`, sinh lại A L14, A L20, B L14 | Pillar "Sort, đừng đoán" `[SS arts]` | S | design |
| 14 | P1 | Daily Post tối thiểu: 1 level mỗi ngày (dùng lại generator, luật B), có tem dấu ngày vào album, streak 7 ngày được 1 decor hiếm (PO chốt) | Lý do D1/D7 duy nhất không phụ thuộc vào việc còn nội dung | M–L | design, code, PO |
| 15 | P1 | Copy "không thua" ở normal level: "Thư đến trễ một chút", không tiếng `lose`. Nếu PO chọn soft-fail thì dùng cùng cơ chế Ca tối | Concept P4 `[DOC concept:120]` | S | design, PO |
| 16 | P2 | Banner level khó: bỏ `boom` và rung với nhóm người lớn tuổi. Câu thay thế: "Hôm nay hơi đông thư, cứ thong thả" | Giữ chill | S | code |
| 17 | P2 | Thanh tiến độ hiện icon mờ cho các chủ đề đã mở hoặc đã gửi (không lộ chủ đề chưa gặp) | Giảm tải nhớ "còn gì, đã thấy gì" | M | design, code |
| 18 | P2 | Cỡ lá: khi có ≤ 4 cột, CK lên khoảng 205/165, dùng phần chiều cao còn trống | Đọc tem dễ hơn | S | code |
| 19 | P2 | Copy VI: thử "LƯỢT" thay "NƯỚC", Việt hoá "Level" thành "Màn" và tiêu đề game. Đổi các chủ đề lạ (Cocktail, Sashimi) ở các level đầu | Dễ hiểu với người lớn tuổi Việt `[GIẢ THUYẾT]` | S | design |
| 20 | P2 | Undo sau khi rút bài: giữ thông tin (hoặc chấp nhận và ghi vào giới hạn của mô phỏng) | Số mô phỏng chính xác hơn | S | design |
| 21 | P2 | Nhắc nghỉ nhẹ sau 45 phút ("Pip ngủ rồi, bạn nghỉ chút nhé?"), tắt được | Chill, tử tế. Cũng giúp đo độ dài phiên | S | design, code |

---

## 10. Câu hỏi cần PO chốt

1. **Normal level có được thua không?**
   - (a) Giữ như ABI: +5 quảng cáo, rồi +5 bằng xu, rồi chơi lại.
   - (b) Soft-fail: hết nước thì vào Ca tối như level khó, chỉ mất Tem Điểm.
   - (c) (b) chỉ ở luật B hoặc chương 2.
   - Hệ quả: (b) bỏ chỗ chi xu chính (+5 nước), khi đó Gợi ý thành chỗ chi chính.
2. **"Nhận x2 (quảng cáo)":** bỏ, chuyển thành nút phụ, hay giữ để đo ARPDAU? Đang lệch gdd-core mục 6 và P4.
3. **Tem Điểm ở level khó và giá decor:** Ca tối được 1 hay 2 điểm? Có hạ giá decor để người lớn tuổi mua đủ 6 món trong một lượt chơi không?
4. **Playtest người lớn tuổi dùng luật nào?**
   - Đề xuất: B làm mặc định cho nhóm này.
   - A (baseline ABI) chỉ dùng cho A/B trên traffic UA.
   - Thay đổi accessibility (#1, #3, #5) áp dụng cho cả hai nhánh, không làm hỏng baseline.
5. **Có làm Daily Post (#14) trước playtest 7 ngày không?** Không làm thì chỉ đo được D1, không đo được D7.
6. **Mục tiêu độ dài ván** cho nhóm người lớn tuổi: ≤ 5 phút (cần cắt lá ở A) hay chấp nhận 5–9 phút?
7. **Thị trường và ngôn ngữ playtest:** VI hay EN (US)? Ảnh hưởng tới #19 và tới chọn chủ đề tem.
8. **Bộ booster:** giữ 4 booster và Ô phụ, hay gộp còn 3 (Gợi ý, Nam châm, Tem Đa Năng) cho nhóm người lớn tuổi?

---

## 11. Kế hoạch playtest với người lớn tuổi

**Ai:**
- 55–75 tuổi, chơi game bài hoặc giải đố (Solitaire, Mahjong, Word) ≥ 3 ngày/tuần.
- Trộn Android và iOS, nam và nữ.
- Ít nhất 3 người đeo kính lão, 2 người run tay nhẹ hoặc viêm khớp ngón tay.
- Loại trừ người làm trong ngành game.

| Vòng | Số người | Hình thức | Kịch bản | Đo |
|---|---|---|---|---|
| R1: có người điều phối | 8–10 (5 dùng A, 5 dùng B; chỉ để quan sát định tính, không kết luận A/B) | 45 phút, máy của chính họ, nói to suy nghĩ, quay tay và màn hình | (1) Mở app, không ai hướng dẫn, chơi L1–L5 (thêm L6 nếu còn giờ). (2) Nhiệm vụ: tắt âm thanh, đọc lại luật, trang trí 1 món, mở album. (3) Confusion test: 20 cặp tem ở cỡ lá thật, mỗi cặp 3 giây, gồm Ice cream–Coffee, Kite, Soda, Nautical–Time. (4) Phỏng vấn | Hoàn thành L1 không cần giúp; số lần chạm trượt (`tap_drift`); tỉ lệ chạm/kéo; số `invalid_move` mỗi level; thời gian mỗi level; lúc nào phải nheo mắt hoặc đeo kính; hiểu "Tem Điểm", "Tem Vàng", "Ca tối"; cảm giác ở Ca tối ("bạn có nghĩ mình đã thua không?"); có bấm nhầm x2 không |
| R2: mang về nhà | 30–40 (chia đều A/B nếu PO muốn có số sơ bộ) | 7 ngày trên bản web hoặc TestFlight. Gọi điện ngắn ở D3 và D7 | Chơi tự do. Có Daily Post nếu #14 xong | D1/D3/D7 (`app_open` theo `sinceInstallMin`); funnel L1→L5→L10→L20; `level_quit` và `level_abandon` theo level; `overtime_start` so với `level_quit` ở L5/L15; Tem Điểm và `decor_place`; `ad_watch` theo vị trí; `pause_open` / `setting_change`; độ dài phiên |

**Ngưỡng tham chiếu** `[GIẢ THUYẾT, PO chốt]`:

| Chỉ số | Ngưỡng |
|---|---|
| Hoàn thành L1 không cần giúp | ≥ 90% |
| `tap_drift` không có đích trên tổng số chạm (sau khi sửa #1) | < 3% |
| `invalid_move` trung vị mỗi level | ≤ 6 |
| Quit ở L5 | < 10% |
| Thời gian mỗi ván, trung vị | ≤ 6 phút |
| Người nói "bị căng" ở level khó | ≤ 30% |
| Đặt ≥ 1 decor ngay phiên đầu | ≥ 80% |
| Bấm x2 rồi nói là bấm nhầm | 0 |
| D1 (R2) | ≥ 45% |
| D7 (R2, chỉ khi có Daily) | ≥ 15% |

**Trước R1 cần xong:** P0 #1–#5. Nên xong thêm #8, #9, #11, #12, #13 (đều effort S).
