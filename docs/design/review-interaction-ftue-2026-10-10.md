# Review tương tác và FTUE: góc nhìn người chơi mới (2026-10-10)

**Phạm vi:** tutorial L1 (kịch bản 8 bước), kịch bản booster L4/L7/L9, lần đầu gặp các tình huống (lá úp, ô phụ, nạp lại bộ bài, hết nước, Overtime, kẹt), copy EN/VI, luồng meta mới (Tem Điểm, Trang trí, chương 2), FTUE chương 2.
**Build:** `prototype/stamp/` ở commit `2174d45`. Không sửa code game.
**Nhãn nguồn:** `[CODE file:dòng]` (mặc định là `prototype/stamp/src/main.js`), `[DOC file]`, `[SIM]` (chạy engine thật bằng Node, script trong scratchpad), `[ART]` (ảnh ghép tem chương 2 từ `assets/cards/`), `[GIẢ THUYẾT]`.
**Kiểm tra nền:** `node tests/fuzz.test.mjs` cho 103/103 pass, nên luật engine không có lỗi. Các vấn đề dưới đây nằm ở lớp UI, kịch bản và copy.

> **Trạng thái (cập nhật cùng ngày):** đã sửa toàn bộ 31 mục, trừ #31 (nút "Notify me" đã bỏ vì chương 2 đã có thật). PO chốt L9 tặng 2 Tem Vàng.
> - L1: thả hụt hoặc chạm sai thì bàn tay hiện lại ngay. Có thêm bộ hẹn giờ 4 giây vẽ lại chỉ dẫn nếu bị mất (#1).
> - Trong kịch bản chỉ sáng đích của kịch bản. Câu từ chối nói rõ bước cần gì: "Xếp lên chỗ bàn tay chỉ", "Đặt vào ô bàn tay chỉ", "Chạm bộ bài", "Chạm Con dấu đang sáng" (#2, #5).
> - Bước chữ cuối kết thúc kịch bản ngay, không chặn thao tác (#3). Lá 2 của L1 đổi thành tem Pizza (#4). Undo mờ trong kịch bản, bảng luật ghi "3 lần hoàn tác miễn phí" (#12).
> - L7/L9: cột đích sáng thật (#6). L9 đặt Tem Vàng lên cột có tem thường ở đỉnh, đặt xong có câu dạy cách dùng, tặng 2 (#7).
> - Chặn "ô trống cuối" chỉ khi có rủi ro: level có giới hạn moves và còn nhiều chủ đề chưa mở hơn số ô trống (#8). Chạm lá dưới của quạt lá rút thì báo (#9).
> - Panel kẹt: chỉ hiện booster dùng được (kèm số lượng hoặc giá), hiện lại khi huỷ booster hoặc đóng panel ô phụ mà vẫn kẹt. Bộ bài hết thì báo. Không bật lại sau mỗi lần rút (chờ đủ 1 vòng bộ bài) (#10, #22).
> - Tem Vàng cứu trợ: có câu giải thích, bàn tay chỉ cột, không huỷ được, nút Tem Vàng bấm được kể cả khi còn khoá (#11).
> - Lần đầu được Tem Điểm có câu giải thích. Đủ điểm cho món decor kế tiếp thì màn thắng có nút "Trang trí: <món>" (#13).
> - Chương 2 thiết kế lại: mỗi level mở đầu chỉ giới thiệu 1 chủ đề mới (L11 Thuyền buồm, L12 Vỏ ốc, L13 Hải sản, L14 Hàng hải). Tem vương miện của chủ đề mới ngửa sẵn hoặc nằm trong 3 lá rút đầu. Đầu level có câu "Tem mới: …" (#14). Moves nâng tới khi người mới thắng ≥ 55–80% (#15). Seafood và Shells không bao giờ chung level, generator và test đều chặn (#16).
> - P2: Hint ở L2 khoá tới lúc popup tặng (#17). Đổi ngôn ngữ đổi chữ tại chỗ, không chơi lại (#18). Đổi cỡ màn hình vẽ lại bàn tay, màn ngang có lớp nhắc xoay máy (#19). Sửa copy combo, moves, tên Tem Vàng EN thống nhất "Golden Stamp" (#20, #21). Hết nước: thiếu xu không ghi thua 2 lần, toast nằm trên lớp mờ, có nút Home (#23). Trang trí lần đầu và album chỉ hiện chủ đề đã mở (#24). Popup hết chương bấm "Chương 2 →" vào thẳng L11 (#25). Undo sau khi gửi thư nói lý do (#26). Gợi ý khi đứng yên lặp lại 7 → 12 → 20 giây (#27). Chế độ Tem Vàng/Con dấu báo khi chạm sai (#28). Popup booster chờ banner xong (#29). Toast lên trên khay đích khi cột dài (#30).
> - Kiểm tra: test logic 103/103; kéo thả 13/13; kịch bản L1, L7, L9, luồng chương, Gợi ý bấm liên tục, gợi ý rảnh tay lặp lại đều chạy bằng PointerEvent thật trên Chrome headless.

---

## Tóm tắt 5 dòng

1. Kịch bản L1 không soft-lock cứng. Nhưng **thả hụt một lá là bàn tay và vệt sáng biến mất**, trong khi toast vẫn bảo "Follow the hand". Đứng yên cũng không hiện lại. Đây là chỗ tắc dễ gặp nhất. (P0)
2. Ở bước 4–5 của L1, đích "ô Fruit" **sáng lên như đích hợp lệ** khi người chơi kéo lá. Thả vào đó (đúng điều vừa học ở bước 1) thì bị từ chối bằng câu chung chung "Not yet!". (P0)
3. Kịch bản booster L7/L9 bảo "Tap the glowing column" nhưng **không cột nào sáng**. L9 bản A ép đặt Tem Vàng **đè lên tem vương miện**. Chạm bàn chơi trong lúc chờ bấm booster cũng làm mất bàn tay. (P1)
4. Có 2 trạng thái "chết mà không ai báo". (a) Kẹt khi đã hết bài rút, sau khi đóng panel kẹt. (b) Tem Vàng cứu trợ ở L5/L15 bị huỷ, mà booster lại đang khoá. Copy luật "Undo anytime" và "Last free slot... if you are sure" ở L1 cũng sai với hành vi thật. (P1)
5. Chương 2: tem vương miện của chủ đề mới ở L11 **ra gần cuối bộ bài** (Sailboats lá 19/20), L12 người mới chỉ thắng 40%. Như vậy lời hứa "mở đầu dễ" chưa đạt. Cặp Seafood–Shells dễ nhầm lại nằm chung trong L15 và L20. (P1)

---

## 1. Bảng vấn đề

| # | Mức | Ở đâu | Người chơi gặp gì | Nguồn | Đề xuất sửa |
|---|---|---|---|---|---|
| 1 | P0 | L1 kịch bản, thả hụt (thả ra ngoài đích, thả tem vương miện lên cột) | Lá bật về chỗ cũ, toast "Not yet! Follow the hand", nhưng bàn tay và vệt sáng đã tắt. Đứng yên cũng không hiện lại. Chỉ còn dòng chữ | `[CODE 1182]` `clearHint()` ở `onDown`; nhánh thả hụt `[CODE 1268–1274]` không gọi `showAction`; `resetIdleHint` bỏ qua khi có `script` `[CODE 1060]` | Ở `onUp`, nhánh `!pick`: nếu `scriptStep()` thì gọi `scriptReject(d.vs)` thay cho toast riêng. Thêm hẹn giờ 4 giây trong `runScript`: chưa xong bước thì `showAction` hoặc `showBoosterStep` lại |
| 2 | P0 | L1 bước 4 ("Stack...") và bước 5 | Kéo Fruit 12 thì ô Fruit sáng lên là đích hợp lệ. Thả vào ô thì bị từ chối "Not yet!". Bước 1 vừa dạy "thêm tem cùng loại vào ô", nên người chơi thấy game mâu thuẫn | `highlightTargets` sáng mọi đích hợp lệ `[CODE 1218, 1385–1394]`; `scriptAllows` chỉ nhận đúng đích kịch bản `[CODE 986–993]`; `[SIM]` bước 4 và 5 có 3–5 nước hợp lệ khác bị chặn | Trong kịch bản, `highlightTargets` chỉ sáng đích của `scriptAction`. Lời từ chối nói rõ: thêm khoá `script_reject_stack` "First stack it on the <em>Fruit column</em>" / "Xếp lên <em>cột Fruit</em> trước đã" |
| 3 | P1 | L1 bước 7 (info, 2,6 giây) | Bấm deck hoặc kéo lá ngay sau bước 6 thì bị chặn "Follow the hand", trong khi bước này không có bàn tay | `runScript` giữ `script` trong bước info `[CODE 964–968]`; tap → `scriptReject` `[CODE 1243–1246]`; deck → `[CODE 1423]` | Bước `info` không chặn input: `runScript` kết thúc kịch bản ngay (lưu `seen`, `script = null`), chỉ để dòng chữ 2,6 giây như tip thường |
| 4 | P1 | L1 bước 1 | Lúc này có 2 tem Cat đang ngửa (cột 0 và cột 1). Kéo tem ở cột 1 vào ô Cat (đúng luật) thì bị từ chối | `[SIM]` sau bước 0: `col1 idx1 → F1` hợp lệ nhưng ngoài kịch bản; bước 4 phụ thuộc lá 11 ở cột 0 | Sửa dữ liệu L1 (`tools/gen_proto_levels.mjs`, phần L1 dựng tay): đổi lá 2 (Cat, giữa cột 1) thành Pizza, để bước 1 chỉ còn một đáp án |
| 5 | P1 | L4/L7/L9, bước "chạm booster" | Chạm một lá hoặc chạm deck trước khi bấm booster thì bàn tay biến mất. Chỉ còn booster nhấp nháy | `scriptReject` gọi `showAction(scriptAction(step))`, mà `scriptAction` trả `null` cho bước booster → `clearHint` `[CODE 937–938, 994–1001]` | Trong `scriptReject`: nếu `step.booster` thì gọi `showBoosterStep(step)` |
| 6 | P1 | L7 (Stamper), L9 (Joker), sau khi đã bấm booster | Chạm sai cột thì toast "Tap the <em>glowing</em> column", nhưng không cột nào sáng | `showBoosterStep` gọi `clearHint()` ngay sau khi `startPick` hoặc `toggleJoker` vừa tạo vệt sáng `[CODE 605–607, 977–985]`; toast `[CODE 1150, 1164]` | Trong `showBoosterStep`, nhánh `inMode`: thêm `hintglow` cho lá trên cùng (hoặc `colZones[ci].classList.add('target')`) của cột kịch bản |
| 7 | P1 | L9 bản A | Kịch bản ép đặt Tem Vàng lên cột 1, mà đỉnh cột 1 là **tem vương miện Candy**. Tem vương miện bị chôn, phải tốn 1 nước dời Joker đi mới mở được ô. Người chơi học sai cách dùng, và mất luôn Tem Vàng duy nhất được tặng (L10 còn 0) | `levels.js` L9 `script.col = 1`, cột 1 đỉnh `24:Candy*`; `GIFTS.joker = 1` `[CODE 31]`; bản B cột 1 đỉnh là tem thường | Chọn cột động như `stamperCol`: đỉnh là tem thường và bên dưới có nhiều lá úp nhất. Hoặc sửa `script.col` của L9 bản A trong generator. Cân nhắc tặng 2 Tem Vàng (PO chốt) |
| 8 | P1 | L1 sau kịch bản, L2–L3 | Chạm tem vương miện Pizza khi chỉ còn 1 ô trống thì bị chặn: "Last free slot! Drag it there **if you are sure**". L1 có moves vô hạn và chỉ 3 chủ đề nên mở ô không có rủi ro. Gợi ý tự động (solver) lại chính là bảo mở ô đó | `[CODE 1249–1253]`; `[SIM]` đường đi của `hint()` sau kịch bản L1 có bước mở ô cuối bằng Pizza | Bỏ chặn khi `L.moves == null`, hoặc khi số chủ đề còn lại ≤ số ô trống, hoặc khi nước đó trùng `computeHint()`. Copy dịu hơn: "Last free slot. <em>Drag</em> to open it." |
| 9 | P1 | Quạt 3 lá đã rút (waste) | Chạm hoặc kéo lá thứ 2–3 của quạt (đang nhìn thấy) thì **không có phản hồi gì**, cả rung lẫn chữ | `locate()` chỉ nhận lá trên cùng `[CODE 1125]`; `onDown` trả về im lặng khi `loc == null` `[CODE 1172–1181]` | Khi lá nằm trong `S.waste` mà không phải lá trên cùng: `nudge`, toast `err_waste_top` "Only the <em>top</em> stamp can move" / "Chỉ dùng được tem <em>trên cùng</em>" |
| 10 | P1 | Panel kẹt (level thường) | Đóng panel bằng một nút không giải quyết được (Ô phụ → Close, Magnet hoặc Joker rồi huỷ, hoặc thiếu xu) thì panel không hiện lại. Nếu bộ bài và waste đều hết, chạm deck không có gì xảy ra. Người chơi kẹt mà không có thông báo, chỉ còn cách Pause → Restart. Nút "Use a Joker" vẫn hiện dù không có Joker và không đủ xu | `stuckPanel` `[CODE 1919–1928]`; chỉ `afterAction` kiểm tra kẹt `[CODE 1705–1710]`; `onDeck` trả về im lặng `[CODE 1422]`; thiếu xu `[CODE 691, 750, 760]` | Kiểm tra lại `isStuck()` sau `cancelPick`, `toggleJoker` (khi tắt), đóng panel ô phụ, và trong `onDeck` khi hết bài. Nút booster ghi số lượng hoặc giá, không đủ thì ẩn. Luôn có Retry |
| 11 | P1 | L5/L15/L20 cứu trợ bằng Tem Vàng | Tem Vàng đến trước khi được dạy (L5 < L9), và không có câu nào giải thích nó làm gì. Chạm ra ngoài cột là huỷ, mà booster Joker đang khoá ("Unlocks at level 9") nên không bật lại được. `jokerFree` vẫn treo nhưng không nhìn thấy | `rescueJoker` `[CODE 1745–1752]`; `toggleJoker` không có nhánh "đang miễn phí" trên UI `[CODE 686–698]`; khoá ở `onBooster` `[CODE 598]` | Lần đầu cứu trợ: hiện thêm `bi_joker` và bàn tay chỉ một cột. Ở chế độ cứu trợ thì không cho huỷ. Hoặc cho bấm booster Joker khi `jokerFree` (badge "FREE") |
| 12 | P1 | Bảng luật (L2, Pause) | "Wrong moves are free. **Undo anytime.**" / "Hoàn tác lúc nào cũng được". Thực tế mỗi level chỉ 3 lượt miễn phí, sau đó 30 xu. Undo bị xoá sau khi gửi thư, sau Magnet, Stamper, Joker và ô phụ | `copy.js:72, 154`; `COSTS.undo` `[CODE 28]`; `undoStack = []` `[CODE 725, 801, 823, 869, 1526]` | Đổi r6: "3 free <b>Undos</b> per level. Sent letters stay sent." / "Mỗi level 3 lần <b>hoàn tác</b> miễn phí. Thư đã gửi thì không lấy lại." |
| 13 | P1 | Tem Điểm và Trang trí | Thắng xong, "Continue" vào thẳng level kế. Người chơi không quay về màn hình chính, nên không thấy nút "Decorate" nhấp nháy. "+3 Stamp Points" chưa bao giờ được giải thích. Vòng meta mới không ai nhìn thấy trong phiên đầu | Nút thắng `[CODE 1835–1840]`; decor chỉ có ở home `[CODE 2168–2176]` | Lần đầu `pointsLeft() >= cost` món kế tiếp: thêm nút "Decorate" trong panel thắng (về home, bàn tay chỉ nút). Lần đầu được Tem Điểm: thêm 1 dòng `pts_explain` "Use Stamp Points to decorate your post office" |
| 14 | P1 | L11 (mở chương 2) | Tem vương miện Sailboats là lá rút thứ 19/20, Shells là lá 15/20. Tem thuyền và vỏ ốc hiện lên từ sớm mà chưa có ô. Người chơi học chủ đề mới qua lỗi "Find its crown stamp first" | `levels.js` L11 `deck` (`0:Sailboats*` gần cuối, `6:Shells*` thứ 15) | Thêm luật cho generator ở level mở chương: tem vương miện của chủ đề mới phải ngửa sẵn trên cột hoặc nằm trong 3 lá rút đầu. Mỗi level chỉ 1 chủ đề mới. Lần đầu gặp: thẻ "New stamp" (dùng lại `.ch2-st`) |
| 15 | P1 | L11–L13 độ khó | Generator ghi "mở đầu dễ", nhưng slack L11 1,15 và L12 1,12, chặt hơn level thường chương 1 (khoảng 1,2). Người mới thắng L11 83%, **L12 40%**, L13 53%. Level thường không có Overtime | `tools/gen_proto_levels.mjs:63–67`; `[DOC chapter2-harbor.md mục 3]` | L11 thành breather: 6 chủ đề, slack ≥ 1,25. L12 slack 1,2. PO chốt mục tiêu tỉ lệ thắng của người mới |
| 16 | P1 | L15, L20 (cả A và B) | Seafood có hàu, vẹm. Shells có nghêu, ốc móng tay. Người Việt coi nghêu, sò là "Hải sản". Hai chủ đề này nằm chung trong 2 level mốc khó | `[ART]` ảnh ghép tem; `CONFUSE` thiếu cặp này `tools/gen_proto_levels.mjs:90–91`; L15 `topics` dòng 73 | Thêm `['Seafood','Shells']` vào `CONFUSE`, hoặc vẽ lại Shells chỉ gồm vỏ không ăn được (ốc xà cừ, sao biển, ốc anh vũ). Đổi tên VI thành "Vỏ sò ốc" |
| 17 | P2 | L2, 6 nước đầu | Hint đã mở khoá nhưng popup tặng quà dời tới nước thứ 6. Trong lúc đó booster hiện giá 150 xu, người chơi có thể mua đúng thứ sắp được tặng | `renderBoosters` `[CODE 549–564]`; `featureIntro` dời `[CODE 2100, 1703]` | Giữ khoá cho tới lúc popup hiện, hoặc cộng quà ngay từ đầu level |
| 18 | P2 | Pause → Language | Đổi ngôn ngữ là chơi lại level (mất tiến độ, tính thêm một lần thử), không có cảnh báo | `[CODE 2258]` | Đổi chữ tại chỗ (`applyStaticCopy`, `updateSlotLabels`, `renderBoosters`), không gọi `startLevel` |
| 19 | P2 | Xoay hoặc đổi cỡ màn hình | Bàn tay vẫn chạy theo toạ độ cũ (chỉ lệch chỗ). Màn ngang làm bàn chơi rất nhỏ, không có lời nhắc xoay máy | `resize` `[CODE 148]`; `handDrag`/`handTap` giữ toạ độ trong closure `[CODE 882–913]` | Trong `placeChrome`, nếu có `script` hoặc tip thì vẽ lại. Màn ngang thì hiện lớp phủ "Rotate your phone" |
| 20 | P2 | Copy `tip_combo` (EN), `tip_moves` | "Fill slots in a row" sai: combo tính theo mỗi lần **giao tem** liên tiếp, kéo lên cột hoặc rút bài là mất. "Each drag" bỏ sót chạm-để-đi (cũng tốn 1 nước) | `copy.js:25, 34`; combo `[CODE 1481, 1505, 1545]` | EN: "Deliver stamps in a row for coins." / "Each stamp move or deck tap = 1 move." |
| 21 | P2 | Tên Joker (EN) | Thanh booster ghi "Joker", còn cứu trợ, lúc đặt và popup ghi "Golden Stamp". Bản VI thống nhất "Tem Vàng" | `copy.js:23, 56, 59, 64, 66` | EN dùng thống nhất "Golden Stamp" (`b_joker`, `script_joker`) |
| 22 | P2 | Panel kẹt, copy | "No stamp can go anywhere" trong khi vẫn rút được bài, vẫn dời được lá (dù vô ích). Mỗi lần rút sau đó panel lại bật lên | `copy.js:161`; `isDeadlocked` đọc cả lá úp trong deck `solver.js:149–157` | "No useful move left, even in the deck." Sau khi người chơi đóng panel thì chỉ hiện lại khi bộ bài đã quay đủ 1 vòng |
| 23 | P2 | Panel hết nước | Bấm "+5 moves (xu)" khi thiếu xu thì gọi lại `outOfMoves()`: ghi `level_fail` 2 lần, phát tiếng thua lần nữa. Toast "Not enough coins" bị lớp mờ che. Panel không có nút về Home | `[CODE 1911–1912]`; `.toast` z 20 < `.scrim` z 30 (`index.html:165, 177`) | Tách phần dựng panel khỏi phần ghi sự kiện. Đưa toast lên trên lớp mờ (z > 31) khi có panel. Thêm nút Home |
| 24 | P2 | Màn hình chính, lần đầu mở | Bấm "Decorate 0" thì gặp câu "Replay a level with more moves left" khi chưa chơi level nào. Album liệt kê toàn bộ chủ đề của 20 level, toàn ô trống | `decorPanel` `[CODE 2177–2194]`; `openAlbum` `[CODE 1868–1890]` | `save.unlocked === 1` thì hiện "Win levels to earn Stamp Points". Album chỉ hiện chủ đề của các level đã mở |
| 25 | P2 | Popup hết chương 1 | Nút chính màu cam là "Open album", không phải "Chapter 2 →". Sang chương 2 tốn thêm 2 lần chạm (home, màn giới thiệu, Play) | `[CODE 1862–1864]` | Đổi thứ bậc màu: "Chapter 2 →" màu cam, bấm vào thì vào thẳng L11 |
| 26 | P2 | Undo sau khi gửi thư | Nút xám, bấm vào thì báo "Nothing to undo" dù vừa đi một nước | `[CODE 616, 1526]` | Nếu vừa gửi thư: "Sent letters can't be undone" |
| 27 | P2 | Gợi ý khi đứng yên (L1–L3) | Chỉ hiện một lần (3,5 giây), sau đó không lặp lại cho tới khi người chơi đi nước mới | `resetIdleHint` `[CODE 1058–1069]` | Hẹn lại sau mỗi lần ẩn gợi ý, giãn dần 7 → 12 → 20 giây |
| 28 | P2 | Chế độ chọn Joker/Stamper | Chạm deck trong chế độ Joker: im lặng. Chạm cột không có lá úp khi đang chọn Stamper: tự huỷ, im lặng | `[CODE 1420–1421, 1151]` | Toast `tap_column` cho cả hai trường hợp |
| 29 | P2 | L4/L7/L9 lúc vào level | Popup booster mới có thể hiện ra khi banner "Level n" (z 4000) còn đè lên khoảng 0,5 giây | `startLevel` `[CODE 2018–2043]` | `await bannerDone` trước `featureIntro`, như đang làm với bảng luật |
| 30 | P2 | Toast với cột dài | Toast nằm ngay trên hàng rút bài, che nửa dưới lá trên cùng (lá chơi được) của cột dài trong 1,5–2,6 giây | `.toast` `index.html:163`; `TAB_BOTTOM` `[CODE 123–124]` | Cột dài thì đưa toast lên vùng giữa khay đích và cột, hoặc rút ngắn thời gian hiện |
| 31 | P2 | Teaser chương 2, nút "Notify me" | Hứa "We'll let you know!" nhưng chưa có hệ thống thông báo | `[CODE 2234–2244]` | Ghi rõ trong kịch bản playtest. Bản phát hành thật phải nối với push |

---

## 2. Điểm tắc trong tutorial

### 2.1 L1: từng bước, khi người chơi làm khác đi

Bàn đầu `[SIM]`: cột 0 `~11F 1C`, cột 1 `~16F ~2C 0C*`, cột 2 `~21P ~14F ~13F 12F`. Deck rút theo thứ tự `10F* 15F 20P* 22P 23P 3C 4C`.

| Bước | Phải làm | Làm khác đi → game phản ứng | Tắc? |
|---|---|---|---|
| 0 | Kéo vương miện Cat vào ô trống | Chạm thay vì kéo: tự vào ô (OK). Kéo vào ô trống khác: nhận (OK). **Thả hụt hoặc thả lên cột: toast "Follow the hand", mất tay** (#1). Chạm lá úp: toast `err_facedown`, tay vẫn còn. Chạm deck: từ chối, tay hiện lại | Có (#1) |
| 1 | Tem Cat ở cột 0 vào ô Cat | Tem Cat ở cột 1 (cũng đúng luật): bị từ chối (#4) | Nhẹ |
| 2 | Chạm deck | Chạm hoặc kéo lá: từ chối, tay hiện lại (OK) | Không |
| 3 | Vương miện Fruit (waste) vào ô | Cat cột 1 vào ô Cat: bị từ chối | Nhẹ |
| 4 | Fruit 12 lên Fruit 11 (cột 0) | **Kéo vào ô Fruit đang sáng: "Not yet!"** (#2). Kéo 11 sang cột 2: từ chối | Có (#2) |
| 5 | Xấp [11, 12] lên 13 | Cầm lá trên của xấp: cả xấp đi (OK). Kéo xấp vào ô Fruit: từ chối (#2). Kéo 13 sang cột 0: từ chối | Có (#2) |
| 6 | Xấp [13, 11, 12] vào ô | OK | Không |
| 7 | (info 2,6 giây) | **Mọi thao tác bị chặn với câu "Follow the hand", trong khi bước này không có tay** (#3) | Ngắn |
| Sau kịch bản | Chơi tự do, moves vô hạn | Chạm Pizza khi chỉ còn 1 ô trống: "if you are sure" (#8). Gợi ý khi đứng yên sau 7 giây có hiện | Nhẹ |

Thao tác chung trong kịch bản:

| Thao tác | Phản ứng |
|---|---|
| Undo | Toast "Not yet! Follow the hand" (OK) |
| Bấm booster | "Unlocks at level 2" (OK) |
| Mở Pause | OK. Bước info vẫn đếm giờ dưới panel, không gây lỗi |
| Pause → Restart / Home | Kịch bản chạy lại từ đầu (OK) |
| Đổi ngôn ngữ | L1 chơi lại từ đầu (#18) |
| Xoay hoặc đổi cỡ màn hình | Tay chỉ lệch chỗ cho tới bước sau (#19) |
| Đứng yên | Tay lặp liên tục. **Nhưng nếu tay đã mất (#1, #5) thì không bao giờ hiện lại** |

### 2.2 Kịch bản booster

| Level | Luồng | Làm khác đi | Tắc? |
|---|---|---|---|
| L4 Magnet | Popup → bấm Magnet → tự hút vào ô Dinosaur (chỉ 1 ô nên không phải chọn) | Chạm lá hoặc deck trước: mất tay, booster vẫn nhấp nháy (#5). Bấm booster khác hoặc ô phụ: "Follow the hand" (OK) | Nhẹ |
| L7 Stamper | Popup → bấm Stamper → tay chỉ cột nhiều lá úp nhất → chạm cột đó | Chạm cột khác: "Tap the glowing column", nhưng không cột nào sáng (#6). Chạm deck trong chế độ chọn: im lặng. Chạm lá trước khi bấm booster: mất tay (#5) | Có (#6) |
| L9 Joker | Popup → bấm Joker → tay chỉ cột 1 → chạm | Như L7 (#5, #6). Bản A: Tem Vàng đè lên vương miện Candy (#7). Không huỷ được chế độ Joker trong kịch bản (đúng ý đồ) | Có (#6, #7) |

### 2.3 Lần đầu gặp

| Tình huống | Hiện tại | Đánh giá |
|---|---|---|
| Lá úp | Chạm: rung, toast "Hidden stamp. Clear the ones on top." | Tốt |
| Lá waste không phải lá trên cùng | Im lặng | Tắc nhẹ (#9) |
| Ô phụ (từ L2) | Khay "+1 slot" ở góc trái hàng rút bài. Chạm: panel quảng cáo/xu. Không có tip | Chấp nhận được. Khay nằm xa hàng ô đích, nên cần playtest xem người chơi có hiểu đó cũng là một ô `[GIẢ THUYẾT]` |
| Nạp lại bộ bài | Icon recycle hiện khi hết bài. Tip "Deck refilled. No move used." một lần | Tốt |
| Hết nước | Panel: +5 (quảng cáo, 1 lần), +5 (300 xu), Retry | Thiếu nút Home. Lỗi thiếu xu (#23) |
| Overtime (L5/L10/L15/L20) | Chữ nổi "Evening shift", toast "Finish at your pace", HUD ∞ | Rõ. Không nói Tem Điểm chỉ còn 1, nên có thể thất vọng ở màn thắng `[GIẢ THUYẾT]` |
| Kẹt (level thường) | Panel kẹt | Có thể chết im lặng (#10) |
| Kẹt (level khó) | Magnet miễn phí trước, rồi Tem Vàng | Tem Vàng chưa dạy và huỷ là mất (#11) |

---

## 3. Copy so với hành vi (EN và VI)

Đủ khoá ở cả 2 ngôn ngữ (không thiếu khoá nào).

| Khoá | Copy | Hành vi thật | Mức |
|---|---|---|---|
| `follow` | "Not yet! Follow the hand." | Hiện cả khi không có tay (#1, #3, #5) | P0 |
| `tap_column` | "Tap the glowing column." | Không cột nào sáng (#6) | P1 |
| `r6` | "Undo anytime." | 3 lượt miễn phí, bị xoá sau khi gửi thư hoặc dùng booster (#12) | P1 |
| `err_last_slot` | "Drag it there if you are sure." | Hiện ở L1 không rủi ro, và hiện cả khi gợi ý của chính game bảo mở ô đó (#8) | P1 |
| `tip_combo` (EN) | "Fill slots in a row" | Combo tính theo giao tem liên tiếp (#20). Bản VI "Giao liên tiếp" đúng | P2 |
| `tip_moves` | "Each drag or deck tap" | Chạm-để-đi cũng tốn nước (#20) | P2 |
| `b_joker` (EN) | "Joker" | Mọi chỗ khác gọi là "Golden Stamp" (#21) | P2 |
| `stuck_body` | "No stamp can go anywhere." | Vẫn rút được bài, vẫn dời được lá (#22) | P2 |
| `pts_need` | "Replay a level..." | Hiện cả khi chưa chơi level nào (#24) | P2 |
| `bi_pack`, `pick_pack` | "2 hidden stamps" | Thiếu lá ẩn thì lấy cả lá đang ngửa (`pullToFoundation` lấy `visible` sau) | Chấp nhận |
| `script_1_*`, `tip_*` còn lại, `err_*` | | Khớp | OK |

---

## 4. Chương 2 nhìn từ FTUE

| Câu hỏi | Trả lời | Nguồn |
|---|---|---|
| Tem mới được giới thiệu thế nào? | Chỉ qua màn giới thiệu chương (4 icon, tên, Bo). Trong level không có gì: không có thẻ "tem mới", không có tem vương miện mở sẵn | `[CODE 2217–2232]`, `levels.js` L11/L12 |
| L11 có dễ không? | Người chơi phổ thông thắng 93%, người mới 83%: đạt. Nhưng tem vương miện chủ đề mới ra muộn (#14), và slack chặt hơn chương 1 | `[DOC chapter2-harbor.md mục 3]` |
| L12 thì sao? | **Người mới thắng 40%** (87% nếu có +5 moves). Đây là bức tường ẩn ở level thứ 2 của chương, lại là level giới thiệu 2 chủ đề mới. Level thường không có Overtime cứu | như trên |
| Có mâu thuẫn với ý đồ không? | `gen_proto_levels.mjs:63` ghi "mở đầu dễ (giới thiệu tem mới)", nhưng target L11 0,95 / slack 1,15 và L12 0,9 / 1,12 đều chặt hơn level thường chương 1 | `tools/gen_proto_levels.mjs:63–67` |
| Nhầm lẫn mới | Seafood–Shells (#16). Sailboats (chương 2) với Ship (chương 1, có thuyền buồm): không chung level nhưng có thể nhầm qua trí nhớ giữa hai chương `[GIẢ THUYẾT]` | `[ART]` |
| Luồng vào chương | Popup hết chương → home chương 2 + màn giới thiệu "ĐÃ MỞ" → Play L11. Chạy được, chỉ thừa thao tác (#25). Decor chương 1 chưa mua sẽ không được nhắc lại khi home tự chuyển sang chương 2 `[GIẢ THUYẾT: mất động lực hoàn thành phòng 1]` | `[CODE 1851–1866, 2125–2126]` |

**Đề xuất cho FTUE chương 2:**
- L11: breather, 1 chủ đề mới, tem vương miện ngửa sẵn.
- L12: 1 chủ đề mới, slack 1,2.
- L13: chủ đề mới thứ 3.
- Nautical để L14, ghép với Shells (không có Seafood).

---

## 5. Câu hỏi còn mở

1. Người thật thả hụt bao nhiêu lần ở L1? Cần đếm `invalid_move` reason `drop` trong khi kịch bản đang chạy. Hiện `teachOnError` không được gọi trong kịch bản nên không có số liệu. Đề xuất thêm sự kiện `script_reject` (bước, loại).
2. Có nên cho kịch bản L1 nhận nước tương đương (ví dụ tem vào thẳng ô ở bước 4) rồi tự điều chỉnh, thay vì ép đúng một đường? Đánh đổi là bước "dạy xếp xấp" có thể bị bỏ qua.
3. PO: mục tiêu tỉ lệ thắng của người mới cho level thường ở chương 2 là bao nhiêu? (Hiện 40–63% ở L12/L13/L17/L18.) Có nên có Overtime nhẹ cho level thường không?
4. PO: tặng 1 hay 2 Tem Vàng ở L9? Kịch bản đã dùng hết 1, nên L10 bắt đầu với 0.
5. Khay ô phụ nằm ở hàng rút bài: người chơi có hiểu đó cũng là một ô đích không? Cần playtest với người thật.
6. Overtime chỉ cho 1 Tem Điểm: người chơi thấy nhẹ nhõm hay hụt hẫng? Có nên báo trước trong toast Overtime không?
7. Chưa kiểm tra bằng trình duyệt thật (PointerEvent) cho #1, #5, #6, #9. Nên thêm 4 kịch bản này vào `tests/drag-scenarios.browser.js` trước khi sửa, để có test hồi quy.
