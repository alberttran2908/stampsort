# Giao diện concept B "cửa sổ bưu điện" và review UI/UX

**Ngày:** 2026-10-10 · **Code:** `prototype/stamp/index.html` (CSS), `prototype/stamp/src/main.js` (bố cục) · **Art:** vẽ qua ChatGPT, mẫu ở `research/art-redo/ui2/`

## 1. Hướng đã chọn

Hai concept do ChatGPT vẽ theo wireframe đúng toạ độ trong game (`research/art-redo/ui2/wireframe_game.png`):
- **A:** quầy gỗ ấm cúng, nhiều đồ trang trí.
- **B:** cửa sổ bưu điện sáng, gọn.

Người dùng chọn **B**. Lý do: nền sáng và không có đồ trang trí sát mép, nên lá bài nổi rõ.

| Thành phần | File (`assets/ui/`) | Ghi chú |
|---|---|---|
| Nền | `bg_game.jpg`, `bg_hard.jpg` | Tường mint có họa tiết phong bì, kèn bưu điện, dấu chân mèo; kệ gỗ ở đáy. Họa tiết trong vùng chơi được làm mờ 60%. Bản level khó là tông tím chiều tối, pha bằng code |
| Ô MOVES, băng tiêu đề, nhãn gợi ý | `hud_moves.png`, `banner.png`, `tipbox.png` | Viền air-mail đỏ-xanh. Băng tiêu đề và nhãn gợi ý dùng 9-slice (`border-image`) |
| Thanh tiến độ | `bar_track.png` | Chia N đoạn bằng CSS (`--segs`), mỗi đoạn là một lá thư |
| Khay ô chứa | `slot_tray.png`, `tray_front.png` | Mép trước có biển đồng (`.tray-front`, z 380) đè lên chân lá, nên tem trông như cắm trong khay. Số đếm nằm trên biển đồng |
| Nút | `btn_pause.png`, `btn_undo.png`, `btn_undo_off.png`, `token.png`, `btn_yellow.png`, `btn_blue.png` | Booster dạng đồng xu. Trạng thái tắt của Undo bake sẵn, không dùng CSS filter |
| Popup | `panel.png`, `ribbon.png` | Khung air-mail dùng 9-slice, ruy băng đỏ |
| Lá Joker | `joker_card.png`, `ic_joker.png` | Mũ hề nhiều chóp có chuông, trên tem vàng. Bản trước vẽ mũ bưu tá nên không ai nhận ra là Joker |

## 2. Bố cục tràn màn hình

- Stage rộng 1080 và cao `H = max(1920, innerHeight / scale)`, nên không còn dải trống trên dưới như trước.
- HUD được đẩy xuống theo `safe-area-inset-top`.
- Thanh booster neo theo đáy và tránh `safe-area-inset-bottom`.
- Phần dư chia: 30% đẩy bàn chơi xuống, 70% cho chiều sâu cột bài.
- Biến CSS `--hud`, `--bd`, `--bot`, `--mid`, `--extra` được tính trong `fit()`.
- Đổi cỡ hoặc xoay màn hình thì gọi `placeChrome()`, không dựng lại lá bài.
- Cột bài dừng ở mép kệ gỗ (`TAB_BOTTOM`). Nếu cột đã sâu tới vùng nhãn gợi ý thì gợi ý hiện dạng toast 2,6 giây, không che lá.

## 3. Review UI/UX (agent chuyên UI/UX, trên 8 ảnh chụp ở khung 375×812)

Quy đổi: 1 px stage ≈ 0,347 pt. 44 pt = 127 px, 12 pt = 35 px.

| # | Mức | Vấn đề | Đã làm |
|---|---|---|---|
| 1 | P0 | Chữ gameplay quá nhỏ: ribbon tên chủ đề 6,9 pt, tên trên lá vương miện 8 pt, thanh tiến độ 8 pt | Ribbon và tên trên lá lên 30px, tự co theo độ dài (tối thiểu 22px). Nhãn booster, Undo, ô phụ 30–32px. Nhãn bộ bài 36px. Gợi ý 40px. Chữ popup 38px. Toast 38px |
| 2 | P0 | "slot" mang 3 nghĩa; level 10 có 5 khay mà ghi "Fill 9 slots" | "slot/ô" chỉ dùng cho khay. Đơn vị mục tiêu là **letter/thư**: "Send 9 letters", "6 letters left to send", thanh tiến độ hiện "0/6" kèm icon thư. Luật r3 và r4 viết lại |
| 3 | P0 | Cột bài chui xuống dưới nhãn gợi ý và kệ | `TAB_BOTTOM` bằng mép kệ. Gợi ý tự chuyển sang toast khi cột sâu, và tự ẩn sau 6 giây |
| 4 | P1 | Hai dải trống trên dưới chiếm 18% chiều cao, chưa xử lý vùng an toàn | Tràn màn hình (mục 2) |
| 5 | P1 | 5 khay chồng lên nhau, khay lệch cột, huy hiệu đếm lấn ribbon bên cạnh | Khay và cột dùng chung gap (44 hoặc 36). Khay hẹp lại khi có 5 ô. Số đếm chuyển xuống biển đồng |
| 6 | P1 | Quá nhiều màu đỏ cạnh tranh với lá bài | Ribbon đổi sang nâu gỗ. Đỏ chỉ dùng cho huy hiệu, MOVES và level khó |
| 7 | P1 | Lá bài nhỏ hơn concept khi level có 4 cột | **Chưa làm.** Đổi kích thước lá ảnh hưởng toàn bộ bố cục và test kéo thả, để đợt sau |
| 8 | P1 | Vẫn mời mua bằng 900 xu khi chỉ có 505 | Nút mờ đi và ghi "Need 395 more coins". "(free ad)" đổi thành "▶ ad". Bỏ câu thứ hai |
| 9 | P1 | Booster khoá thành khối đen (do CSS filter), Undo tắt làm mờ cả nhãn, ô phụ khoá trông giống lá bài | Booster khoá chỉ hiện ổ khoá (bỏ filter). Undo tắt dùng ảnh xám bake sẵn, nhãn vẫn rõ, ẩn huy hiệu. Ô phụ khoá là khay mờ có ổ khoá |
| 10 | P1 | Vùng chạm Pause/Undo dưới 44 pt; Undo nhỏ hơn booster | Vùng chạm mở rộng thêm 14px mỗi phía. Undo 140px, có vạch ngăn. Booster dàn đều |
| 11 | P1 | Banner đầu level chữ trắng trên nền sáng; lá đang chia bay dưới chữ | Dải nền tối phía sau chữ, chữ có viền. Level khó chờ banner xong mới chia bài |
| 12 | P1 | Họa tiết nền chỏi với lá bài | Làm mờ họa tiết 60% trong vùng chơi (bake vào ảnh) |
| 13 | P1 | Chữ hướng dẫn còn nhỏ | Như mục 1 |
| 14–16 | P2 | Lề chưa thống nhất; ô MOVES nhỏ; bộ bài trông như 1 lá | Lề trái/phải 48. Quạt 3 lá căn giữa màn hình. Ô MOVES 170×184. Bộ bài lệch chéo 4 lá, nhãn đếm đè góc dưới phải |
| 17–18 | P2 | Popup thắng nói thừa; luật chơi có chú thích dài | Bỏ "All slots filled!" và "Level n ·". Gợi ý sao chỉ hiện khi chưa đủ 3 sao. "Đi sai không mất nước" thành dòng luật thứ 5 có icon Undo |
| 19 | P2 | Đường viền mảnh bên trong khung popup; khoảng trống dưới nút cuối | Giảm khoảng trống. Đường viền là một phần của art, **chưa sửa** |
| 20 | P2 | Màn hình chính: nút Play lơ lửng, level khoá quá mờ | Nút Play đặt trên kệ (vùng ngón cái). Level khoá rõ hơn. Chưa thêm ô xu và nút cài đặt |
| 21 | P2 | Gợi ý nằm mãi trên màn | Tự ẩn sau 6 giây |
| 22 | P2 | Khung tranh mèo ở góc nền bị HUD che một nửa | **Chưa sửa** (cần vẽ lại nền) |

**Kiểm tra sau khi sửa:**
- Khung 375×812: màn hình chính, level 3, level 10 (5 khay), bảng luật, popup hết nước. Console không có lỗi.
- 13/13 kịch bản kéo thả.
- 70/70 test logic.

## 4. Còn lại

- Lá to hơn khi level có ≤ 4 cột (P1-7). Cách làm: CW/CH thành biến, CSS dùng `--cw/--ch`.
- Màn hình chính chưa có ô xu và nút cài đặt.
- Trên máy dài (như 375×812), phần dôi ra phía trên được tô màu tường, nối với ảnh nền bằng một dải chuyển mềm. Muốn đẹp hơn thì cần ảnh nền cao 1080×2400.
