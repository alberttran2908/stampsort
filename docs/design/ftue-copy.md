# FTUE và câu chữ hướng dẫn: Stamp Sort

**Ngày:** 2026-10-03 · **Code:** `prototype/stamp/src/copy.js` (toàn bộ chữ, EN + VI), `src/main.js` (cơ chế dạy)

## 1. Nguyên tắc

| Nguyên tắc | Áp dụng trong game | Nguồn |
|---|---|---|
| 80–90% người chơi không đọc chữ hướng dẫn | Dạy bằng bàn tay chỉ, ô sáng lên, lá bật về khi sai. Chữ chỉ là phụ đề | [Udonis: FTUE](https://www.blog.udonis.co/mobile-marketing/mobile-games/first-time-user-experience) |
| Mỗi câu tối đa khoảng 8 từ, mỗi lần một ý | Mọi câu trong `copy.js` dài 4–9 từ, bắt đầu bằng động từ, từ khoá tô vàng | [Udonis: mobile game tutorial](https://www.blog.udonis.co/mobile-marketing/mobile-games/mobile-game-tutorial) |
| Dạy đúng lúc (just-in-time), không dồn luật từ đầu | Level 1 chỉ dạy 7 thao tác. Khái niệm khác hiện **một lần** khi gặp lần đầu | [Roblox: onboarding techniques](https://create.roblox.com/docs/production/game-design/onboarding-techniques) |
| Thang hỗ trợ khi lúng túng: sai 2 lần trong vài giây thì chỉ cách làm đúng | Sai 2 lần trong 6 giây thì bàn tay chỉ luôn một nước hợp lệ (level 1–5 và level khó) | [GDevelop: why tutorials fail](https://gdevelop.io/blog/improve-game-tutorials) |
| Sai là cơ hội dạy, không phạt | Đi sai: lá bật về, 0 move, toast nói **cách làm đúng** chứ không chỉ "sai rồi" | [Psychology of Games: errors in tutorials](https://www.psychologyofgames.com/2018/12/you-screwed-up-the-value-of-errors-in-game-tutorials/) |
| Cùng thể loại: lá viền vàng là "đầu nhóm", đặt vào ô trống thì tên nhóm hiện ra | Giữ nguyên cách này. Ô trống vẽ sẵn vương miện mờ để nối hình với lá vương miện | [Solitaire Associations rules](https://www.solitaireassociation.com/games/solitaire-associations) |

**Game gốc làm gì:** level 1 có kịch bản 6 câu, mỗi câu 15–25 từ, ví dụ câu đầu tiên mở bằng "Your goal is to bring all the Stamps to the foundation…" và dài 26 từ `[VIDEO 00:05]`. Câu "Clear every topic to win the level!" hiện ở `[VIDEO 00:40]`. Các level sau chỉ có câu nhắc khi xếp sai ("You can only stack stamps from the same topic") `[VIDEO]`. Video không cho thấy câu nào giải thích chuyện thua hết moves. Bản mình giữ cấu trúc kịch bản level 1 của game gốc nhưng rút mỗi câu xuống dưới 9 từ, và thêm các lớp dạy bên dưới.

## 2. Từ vựng cố định

Mỗi thứ trên màn hình chỉ có **một** tên, dùng giống nhau ở HUD, toast, kịch bản và bảng luật. Bản trước dùng lẫn slot / pile / column / table / stack cho 3 thứ khác nhau, người chơi thử nghiệm không phân biệt được (mục 6).

| Khái niệm | EN | VI | Lý do |
|---|---|---|---|
| Lá mở ô (có vương miện) | crown stamp | tem vương miện | Gọi theo thứ nhìn thấy trên lá. Bản cũ gọi "golden topic stamp", trùng chữ "golden" với Joker |
| Joker | Golden Stamp | Tem Vàng | Chữ "GOLDEN STAMP" in sẵn trên hình lá |
| Ô phía trên (foundation), trống hay đã có tem | slot | ô | Bỏ hẳn chữ "pile": ô trống và ô đang lấp là cùng một chỗ |
| Hàng tem phía dưới | column | cột | |
| Nhiều tem cùng loại xếp chồng trên cột | stack | xấp | "xấp" để không trùng "chồng" với ô |
| Tem cùng nhóm | same kind / matching | cùng loại | Bỏ chữ "topic" vì trừu tượng |
| Lượt đi | move | nước | |
| Thắng | fill every slot | lấp đầy mọi ô | Nối thẳng với thanh "Filled 2/6" / "Đã đầy 2/6" trên HUD |
| Booster nam châm (Pack trong game gốc) | Magnet | Nam châm | Icon là nam châm, tên "Pack" không khớp hình |

Tên chủ đề cũng đổi sang tên dễ hiểu: EN "Hoofed" thành "Hoofed animals", "Time" thành "Clocks". VI dịch hết (Mèo, Trái cây, Chim…), xem `TOPIC_EN` / `TOPIC_VI` trong `copy.js`.

## 3. Các lớp dạy

| Lớp | Khi nào | Nội dung |
|---|---|---|
| Kịch bản ép bước, level 1 | Lần đầu vào level 1 | 8 câu ngắn theo đúng 7 bước của game gốc (`script_1_0` … `script_1_7`) |
| Kịch bản booster | Lần đầu mở Magnet (L4), Stamper (L7), Joker (L9) | 1 câu và bàn tay chỉ |
| Gợi ý theo ngữ cảnh | Lần đầu tình huống xảy ra (bảng dưới) | 1 câu, tự tắt hoặc tắt khi làm đúng |
| Dạy khi sai | Mỗi nước sai | Toast nói cách làm đúng. Sai 2 lần trong 6 giây thì bàn tay chỉ một nước hợp lệ |
| Gợi ý khi đứng im | Level 1–3 và level khó, đứng im 7 giây | Bàn tay chỉ nước tốt |
| Hình thay chữ | Luôn luôn | Ô trống có vương miện mờ. Đích hợp lệ sáng lên khi kéo. Thanh "Filled x/n" luôn là tiến độ (combo chỉ hiện bằng chữ bay). Thẻ mục tiêu đầu level |
| Chạm ô để xem | Mọi lúc | Tem cùng loại đang lộ sáng lên, kèm câu "Bird: 3 more to go" |
| Bảng luật bằng hình | Level đầu có giới hạn moves (L2), và trong Pause | 4 dòng, mỗi dòng có hình lá bài thật |

## 4. Bảng câu chữ

| Khoá | Khi hiện | EN | VI |
|---|---|---|---|
| `tip_moves` | Vào L2 | Each drag or deck tap = **1 move**. | Mỗi lần kéo hoặc rút = **1 nước**. |
| `tip_crown` | L2–4, có tem vương miện mở được ô | **Crown stamp**: opens a new slot. | **Tem vương miện**: mở ô mới. |
| `tip_draw` | L2–3, không còn nước vào ô | No match? Tap the **deck**. | Hết tem hợp? Chạm **bộ bài**. |
| `tip_stack` | L2–3, có thể xếp xấp | Stack **same-kind** stamps on columns. | Xếp tem **cùng loại** lên nhau trên cột. |
| `tip_peek` | L2–3, đã có ô mở | Tap a slot to **see** its stamps. | Chạm một ô để **xem** tem của nó. |
| `tip_empty` | L3–5, có cột trống dùng được | **Empty column**: park any stack there. | **Cột trống**: gửi tạm xấp nào cũng được. |
| `tip_full` | Mọi level, hết ô trống mà có tem vương miện chờ | No empty slot. **Fill a slot** first. | Hết ô trống. **Lấp đầy một ô** trước. |
| `tip_complete` | Lần đầu một ô đầy | Slot full! Sent. It’s **free** again. | Ô đầy, đã gửi! Ô **trống lại**. |
| `tip_recycle` | Lần đầu nạp lại bộ bài | Deck refilled. **No move** used. | Nạp lại bộ bài. **Không tốn nước**. |
| `tip_combo` | Lần đầu combo x3 | **Combo!** Fill slots in a row for coins. | **Combo!** Giao liên tiếp được xu. |
| `tip_low` | Lần đầu còn 10 nước (level ≥ 20 nước); mỗi level khi còn 5 | Only **{n} moves** left. Plan ahead! | Còn **{n} nước**. Tính kỹ nhé! |
| `err_need_crown` | Thả tem thường vào ô trống | Empty slots need a **crown stamp**. | Ô trống cần **tem vương miện**. |
| `err_wrong_pile` | Thả vào ô khác loại | This slot takes **{topic}** only. | Ô này chỉ nhận **{topic}**. |
| `err_wrong_stack` | Xếp lên tem khác loại | Only **same-kind** stamps stack. | Chỉ xếp tem **cùng loại**. |
| `err_crown_on_stamp` | Đặt tem vương miện lên tem | Crown stamps go to **empty slots**. | Tem vương miện vào **ô trống**. |
| `err_no_pile` | Chạm tem chưa có ô mở | Find its **crown stamp** first. | Tìm **tem vương miện** của nó trước. |
| `err_slots_busy` | Chạm tem vương miện khi hết ô | No empty slot. **Fill a slot** first. | Hết ô trống. **Lấp đầy một ô**. |
| `err_facedown` | Chạm tem úp | Hidden stamp. Clear the ones **on top**. | Tem úp. Dọn tem **phía trên** trước. |

Bảng đầy đủ, gồm panel, booster, và level khó, nằm trong `prototype/stamp/src/copy.js`. Chọn ngôn ngữ bằng `?lang=vi` hoặc `?lang=en`, tự theo ngôn ngữ máy, hoặc đổi trong Pause. Tên chủ đề có bản EN và VI riêng.

## 5. Đo hiệu quả

| Sự kiện | Dùng để |
|---|---|
| `invalid_move` (level, reason: drop / facedown / no_pile / crown_no_slot / no_place) | Tìm khái niệm người chơi hiểu sai nhiều nhất |
| `tip_shown` (level, key) | Biết gợi ý nào được kích hoạt và kích hoạt ở đâu |
| `tutorial_complete`, `af_tutorial_completion` | Tỉ lệ qua kịch bản level 1 |
| `level_quit` ở L1–3 | Tỉ lệ bỏ cuộc vì không hiểu |

Mục tiêu đề xuất **[GIẢ THUYẾT]**: hơn 95% người chơi xong tutorial. Ở L2–3, trung bình dưới 3 lần `invalid_move` mỗi level. `level_quit` ở L1–3 dưới 5%.

## 6. Playtest người chơi lần đầu (2026-10-03)

**Cách làm:** một agent đóng vai người chưa từng chơi thể loại này, chơi bản web đang deploy từ level 1, chỉ nhìn màn hình, ghi lại chỗ khựng lại. Đây là **[GIẢ THUYẾT]** về hành vi người thật, cần xác nhận bằng playtest với người.

| # | Vấn đề | Sửa |
|---|---|---|
| 1 | Kịch bản L1 chỉ nhận đúng ô bàn tay chỉ; kéo vào ô trống khác bị từ chối mà không rõ lý do | Ô trống nào cũng nhận tem vương miện. Giao tem tự vào ô đúng loại. Toast "Not yet! Follow the hand" nằm **phía trên** khung hướng dẫn, không bị che |
| 2 | Cầm lá trên cùng của xấp thì chỉ lá đó đi, không phải cả xấp | Cầm **bất kỳ lá nào** trong xấp cùng loại là nhấc cả xấp (không tính Tem Vàng ở đáy, trừ khi cầm đúng Tem Vàng) |
| 3 | Quá nhiều từ cho 3 thứ (slot/pile/column/table/stack) | Từ vựng cố định, mục 2 |
| 4 | Gợi ý "cột trống" chỉ một nước vô ích | Chỉ gợi ý khi dời xấp sang cột trống làm **lộ lá úp** |
| 5 | Thanh HUD lúc là combo, lúc là tiến độ. Màn thắng 2 sao vẫn ghi "Perfect!" | Thanh luôn là tiến độ. Tiêu đề theo sao: 3 sao "Perfect!", 2 sao "Great!", 1 sao "Well done!". Thêm dòng "More moves left = more ★" |
| 6 | Tên chủ đề khó ("Hoofed"), art mơ hồ (bóng bay trông như con sâu, đồng hồ cát nghĩa là "Time") | Đổi tên dễ hiểu. Art: ghi vào brief đặt art (dưới) |
| 7 | Booster tên "Pack" nhưng icon nam châm. Icon Undo giống icon nạp bài. Bàn trống với "MOVES 0" lúc đang tải. Bảng luật và popup booster hiện liền nhau ở L2 | Đổi tên Magnet. Undo dùng ký hiệu ↶. HUD cập nhật trước khi tải ảnh. Popup Hint ở L2 dời tới sau nước thứ 6 |
| 8 | Nghi nút popup khó bấm | Đã bấm thật bằng chuột vào Play, Continue, Got it, Claim, "+5 moves": đều chạy. Lúc kiểm tra phát hiện lỗi thật: nút "+5 moves (quảng cáo)" không làm gì vì biến `t` trong `fakeAd` che hàm dịch `t()`. Đã sửa |

Chạy lại kịch bản L1 sau khi sửa phát hiện thêm: câu "No match? Tap the deck" sai ngữ cảnh vì lúc đó trên bàn có sẵn tem khớp. Đổi thành "Tap the deck for new stamps".

**Ghi chú cho brief đặt art** (khi thay art APK):
- Mỗi chủ đề cần một hình **đọc ra ngay trong 1 giây** ở cỡ lá bài trên điện thoại. Tránh vật có dáng giống vật khác (bóng bay dài, dây).
- Icon chủ đề (trên lá vương miện) nên là vật tiêu biểu nhất của nhóm, không phải biểu tượng trừu tượng (đồng hồ cát cho "Time").
- Icon Undo và icon nạp bài phải khác dáng hẳn nhau.
- Tên booster phải khớp icon.
