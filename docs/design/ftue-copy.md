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

| Khái niệm | EN | VI | Lý do |
|---|---|---|---|
| Lá mở ô (có vương miện) | crown stamp | tem vương miện | Gọi theo thứ nhìn thấy trên lá. Bản cũ gọi "golden topic stamp", trùng chữ "golden" với Joker |
| Joker | Golden Stamp / Joker | Tem Vàng | Chữ "GOLDEN STAMP" in sẵn trên hình lá |
| Ô trống | slot | ô | |
| Ô đã mở, có tem | pile | chồng | |
| Tem cùng nhóm | same kind / matching | cùng loại | Bỏ chữ "topic" vì trừu tượng |
| Lượt đi | move | nước | |
| Thắng | fill every pile | lấp đầy mọi chồng | Nối thẳng với thanh "Piles 2/6" trên HUD |

## 3. Các lớp dạy

| Lớp | Khi nào | Nội dung |
|---|---|---|
| Kịch bản ép bước, level 1 | Lần đầu vào level 1 | 8 câu ngắn theo đúng 7 bước của game gốc (`script_1_0` … `script_1_7`) |
| Kịch bản booster | Lần đầu mở Pack (L4), Stamper (L7), Joker (L9) | 1 câu và bàn tay chỉ |
| Gợi ý theo ngữ cảnh | Lần đầu tình huống xảy ra (bảng dưới) | 1 câu, tự tắt hoặc tắt khi làm đúng |
| Dạy khi sai | Mỗi nước sai | Toast nói cách làm đúng. Sai 2 lần trong 6 giây thì bàn tay chỉ một nước hợp lệ |
| Gợi ý khi đứng im | Level 1–3 và level khó, đứng im 7 giây | Bàn tay chỉ nước tốt |
| Hình thay chữ | Luôn luôn | Ô trống có vương miện mờ. Đích hợp lệ sáng lên khi kéo. Thanh "Piles x/n". Thẻ mục tiêu đầu level |
| Chạm chồng để xem | Mọi lúc | Tem cùng loại đang lộ sáng lên, kèm câu "Bird: 3 more to go" |
| Bảng luật bằng hình | Level đầu có giới hạn moves (L2), và trong Pause | 4 dòng, mỗi dòng có hình lá bài thật |

## 4. Bảng câu chữ

| Khoá | Khi hiện | EN | VI |
|---|---|---|---|
| `tip_moves` | Vào L2 | Each drag or deck tap = **1 move**. | Mỗi lần kéo hoặc rút = **1 nước**. |
| `tip_crown` | L2–4, có tem vương miện mở được ô | **Crown stamp**: starts a new pile. | **Tem vương miện**: mở chồng mới. |
| `tip_draw` | L2–3, không còn nước vào ô | No match? Tap the **deck**. | Hết tem hợp? Chạm **bộ bài**. |
| `tip_stack` | L2–3, có thể xếp chồng | Stack **same-kind** stamps on the table. | Xếp tem **cùng loại** lên nhau. |
| `tip_peek` | L2–3, đã có chồng mở | Tap a pile to **see** its stamps. | Chạm chồng để **xem** tem của nó. |
| `tip_empty` | L3–5, có cột trống dùng được | **Empty column**: any stack fits. | **Cột trống**: chồng nào cũng vào. |
| `tip_full` | Mọi level, hết ô trống mà có tem vương miện chờ | All slots busy. **Finish a pile** first. | Hết ô trống. **Lấp đầy một chồng** trước. |
| `tip_complete` | Lần đầu đầy chồng | Pile full! Its slot is **free** again. | Chồng đã đầy! Ô **trống lại**. |
| `tip_recycle` | Lần đầu nạp lại bộ bài | Deck refilled. **No move** used. | Nạp lại bộ bài. **Không tốn nước**. |
| `tip_combo` | Lần đầu combo x3 | **Combo!** Fill piles in a row for coins. | **Combo!** Giao liên tiếp được xu. |
| `tip_low` | Lần đầu còn 10 nước (level ≥ 20 nước); mỗi level khi còn 5 | Only **{n} moves** left. Plan ahead! | Còn **{n} nước**. Tính kỹ nhé! |
| `err_need_crown` | Thả tem thường vào ô trống | Empty slots need a **crown stamp**. | Ô trống cần **tem vương miện**. |
| `err_wrong_pile` | Thả vào chồng khác loại | This pile takes **{topic}** only. | Chồng này chỉ nhận **{topic}**. |
| `err_wrong_stack` | Xếp lên tem khác loại | Only **same-kind** stamps stack. | Chỉ xếp tem **cùng loại**. |
| `err_crown_on_stamp` | Đặt tem vương miện lên tem | Crown stamps go to **empty slots**. | Tem vương miện vào **ô trống**. |
| `err_no_pile` | Chạm tem chưa có chồng | Find its **crown stamp** first. | Tìm **tem vương miện** của nó trước. |
| `err_slots_busy` | Chạm tem vương miện khi hết ô | All slots busy. **Finish a pile**. | Hết ô trống. **Lấp đầy một chồng**. |
| `err_facedown` | Chạm tem úp | Hidden stamp. Clear the ones **on top**. | Tem úp. Dọn tem **phía trên** trước. |

Bảng đầy đủ, gồm panel, booster, và level khó, nằm trong `prototype/stamp/src/copy.js`. Chọn ngôn ngữ bằng `?lang=vi` hoặc `?lang=en`, tự theo ngôn ngữ máy, hoặc đổi trong Pause. Tên chủ đề (Cat, Pizza…) vẫn giữ tiếng Anh vì gắn với art tạm.

## 5. Đo hiệu quả

| Sự kiện | Dùng để |
|---|---|
| `invalid_move` (level, reason: drop / facedown / no_pile / crown_no_slot / no_place) | Tìm khái niệm người chơi hiểu sai nhiều nhất |
| `tip_shown` (level, key) | Biết gợi ý nào được kích hoạt và kích hoạt ở đâu |
| `tutorial_complete`, `af_tutorial_completion` | Tỉ lệ qua kịch bản level 1 |
| `level_quit` ở L1–3 | Tỉ lệ bỏ cuộc vì không hiểu |

Mục tiêu đề xuất **[GIẢ THUYẾT]**: hơn 95% người chơi xong tutorial. Ở L2–3, trung bình dưới 3 lần `invalid_move` mỗi level. `level_quit` ở L1–3 dưới 5%.
