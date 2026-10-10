# QA tương tác & tutorial – prototype Stamp Sort (2026-10-10)

Nguồn: chơi thử thật trên bản local `http://localhost:8766/` (thư mục `prototype/stamp`), khung điện thoại 375×812 và 360×640, tiếng Việt (có thử tiếng Anh). Thao tác bằng click/kéo thật (PointerEvent của trình duyệt). Chỉ ghi điều đã tự quan sát.

## Tóm tắt
- Đã chạy 32 kịch bản: FTUE từ save trống (L1–L3), kịch bản booster L2/L4/L7/L9, hết nước, Overtime L5, kẹt và cứu, meta (màn thắng, Trang trí, Album, Chương 2, hết chương), đổi cỡ màn hình, đổi ngôn ngữ, bấm nhanh, chạm hai ngón, 2 bộ test tự động.
- Lỗi: **0 Blocker, 4 Major, 12 Minor**.
- Tutorial không có chỗ tắc cứng: làm theo bàn tay thì luôn đi tiếp được. Nhưng có 4 chỗ người mới dễ bối rối (xem mục "Tutorial: chỗ bị tắc").
- Cách dựng tình huống: dùng `__game.startLevel(i)` để nhảy level, đặt `S.moves` nhỏ để tới nhanh màn hết nước/Overtime, dựng bàn kẹt bằng `__game.setState` (giống bộ test có sẵn). Mọi nước đi đều bằng click/kéo.

> **Trạng thái (cập nhật cùng ngày):** đã sửa cả 16 lỗi.
> - #1 kịch bản L1: lá 2 đổi thành tem Pizza, trong kịch bản chỉ sáng đích đúng, câu từ chối nói rõ bước cần gì.
> - #2 gợi ý "Chạm bộ bài" tự tắt khi đã có nước vào ô. #3 bàn tay không còn đứng hình sau Undo (animation dừng hẳn khi bị huỷ). #4 bấm Gợi ý khi gợi ý đang hiện không tính phí.
> - #5 Undo mờ trong kịch bản, bảng luật sửa câu. #6 gợi ý rảnh tay lặp lại, giãn dần. #7 Tem Vàng L9 không đè tem vương miện, có câu dạy cách dùng, tặng 2.
> - #8 cột dài nén khoảng lá úp trước, phần lộ của lá ngửa giữ đủ để chạm. #9 cứu trợ Nam châm: bàn tay chuyển sang ô. #10 Overtime giữ nguyên sau Undo. #11 quảng cáo giả dịch được.
> - #12 ô Chương 2 khi khoá ghi "qua Level 10 để mở" và nút chơi tiếp. #13 bóng decor là hình mờ nhìn ra được. #14 dọn bàn tay cũ trước popup booster. #15 bàn tay chỉ phần trên lá và đồng xu, không che nhãn. #16 cột đích sáng rõ ở L7.

## Bảng lỗi

| # | Mức | Level/màn | Bước tái hiện | Thực tế | Mong đợi | Ảnh |
|---|---|---|---|---|---|---|
| 1 | Major | L1, bước 3 "Chạm bộ bài" và bước 5 "Xếp tem" | Save trống, làm bước 1–2. Ở bước 3, kéo/chạm tem Mèo vừa lộ ở cột giữa vào ô Mèo. Ở bước 5, kéo táo vào ô Trái cây | Bị từ chối, hiện "Chưa được! Làm theo bàn tay." dù đó là nước hợp luật và đúng điều bước 2 vừa dạy ("Thêm tem cùng loại vào ô đó") | Cho đi nước đúng luật (rồi chỉ tiếp), hoặc kịch bản không để lộ nước "đúng mà bị cấm" | `docs/qa/img/l1-step2-cat-blocked.jpg` |
| 2 | Major | L2 | Thắng L1, ở L2 đi tới lúc ô Ô tô đầy (còn xấp 3 tem Bóng trên cột). Gợi ý "Hết tem hợp? Chạm bộ bài." hiện. Dời xấp Bóng sang cột trống, chạm vương miện Bóng vào ô | Bàn tay vẫn nhấp vào bộ bài sau mọi nước khác, kể cả khi xấp 3 tem Bóng có thể vào ô Bóng vừa mở. Chỉ hết khi người chơi rút bài | Gợi ý tự tắt khi điều kiện "không còn nước vào ô" không còn đúng | `docs/qa/img/l2-draw-tip-with-crown.jpg`, `docs/qa/img/l2-draw-hand-persists.jpg` |
| 3 | Major | L3 (mọi level có gợi ý rảnh tay) | Đi 1 nước (vd. rút bài), đứng yên ~8 giây tới khi bàn tay gợi ý nhấp trên bộ bài, bấm Hoàn tác | Bàn tay đứng im (không nhấp, không mờ) trên bộ bài, không có ô sáng, nằm đó tới nước đi kế tiếp. Tái hiện 2/2 lần | Hoàn tác xoá hẳn bàn tay | `docs/qa/img/l3-frozen-hand-after-undo.jpg` |
| 4 | Major | L3, nút Gợi ý | Còn 2 Gợi ý miễn phí, 1500 xu. Bấm Gợi ý 4 lần liên tiếp thật nhanh | Mất cả 2 lượt miễn phí và 300 xu (2×150), cả 4 lần chỉ ra cùng một gợi ý | Khi gợi ý đang hiện thì bấm thêm không tính phí (hoặc chặn bấm liên tiếp) | `docs/qa/img/hint-spam-before.jpg`, `docs/qa/img/hint-spam-after.jpg` |
| 5 | Minor | L1 | Trong kịch bản, bấm Hoàn tác (nút đang hiện số 3) | Báo "Chưa được! Làm theo bàn tay." Bảng Cách chơi lại ghi "Hoàn tác lúc nào cũng được" | Làm mờ nút Hoàn tác trong kịch bản, hoặc sửa câu trong bảng luật | – |
| 6 | Minor | L1–L3, gợi ý rảnh tay | Đi 1 nước rồi đứng yên 25 giây | Gợi ý hiện đúng 1 lần (giây 7 đến 10,5) rồi không hiện lại | Lặp lại gợi ý nếu người chơi vẫn đứng im | – |
| 7 | Minor | L9, kịch bản Tem Vàng | Nhận Tem Vàng, làm theo bàn tay | Bàn tay bắt đặt Tem Vàng lên cột 2, đè lên vương miện Kẹo lúc 4 ô đều trống, che mất nước mở ô. Muốn gỡ phải dời Tem Vàng (tốn 1 nước; chạm tem Kẹo bên dưới báo "Chỉ xấp tem cùng loại mới nhấc cùng nhau"). Sau khi đặt không có bước dạy "xếp tem lên Tem Vàng" | Chọn cột có tem thường ở trên, thêm 1 bước xếp tem lên Tem Vàng | – |
| 8 | Minor | L9, cột có Tem Vàng | Chạm phần lộ của tem nằm dưới Tem Vàng | Dải lộ chỉ cao ~13px CSS (tem thường ~27px), chạm hụt trúng Tem Vàng, Tem Vàng bị dời đi và mất 1 nước | Dải lộ cao như các lá khác | – |
| 9 | Minor | L5, cứu bằng Nam châm | Kẹt ở level khó, hiện "Bí rồi? Tặng bạn Nam châm. Chạm vào nhé!", bấm Nam châm | Đã vào chế độ chọn ô ("Chạm một ô: +2 tem ẩn.") nhưng bàn tay vẫn nhấp trên nút Nam châm, không chỉ sang ô | Bàn tay chuyển sang ô cần chạm | – |
| 10 | Minor | L5, Overtime | Hết nước để vào Overtime, bấm Hoàn tác, đi lại 1 nước | HUD từ ∞ về "1"; đi 1 nước thì thông báo và âm thanh Overtime bật lại lần nữa | Giữ Overtime sau Hoàn tác, không báo lại | – |
| 11 | Minor | Quảng cáo giả (Ô phụ, +5 nước) | Bản tiếng Việt, bấm "Miễn phí (quảng cáo)" | Hiện chữ tiếng Anh "(Mock rewarded ad)" | Dịch hoặc ẩn khi test người dùng | – |
| 12 | Minor | Màn hình chính, ô Chương 2 khi còn khoá | Chưa qua L10, chạm ô "Chương 2 · Bến Cảng" | Popup ghi "sắp mở", "Trong lúc chờ: chơi lại level…" và nút "Báo tôi khi mở", trong khi Chương 2 đã chơi được ngay sau L10 | Ghi rõ "Qua Level 10 để mở" | – |
| 13 | Minor | Màn hình chính, decor | Đặt decor đầu tiên (Cờ dây) | Bóng của món tiếp theo (khung ảnh) hiện thành một ô xám trơn phía trên nút Album, không nhận ra là món decor | Bóng có hình nhận ra được, hoặc có nhãn | – |
| 14 | Minor | L2, popup "Mới: Gợi ý" | Đi 6 nước rồi để popup mở vài giây, bấm Nhận | Bàn tay hiện ở ô Ô tô (giữa đường kéo) thay vì chỉ nút Gợi ý. Mới thấy 1 lần, chưa tái hiện lại | Bàn tay chỉ nút Gợi ý | – |
| 15 | Minor | L1, L4 | Xem bàn tay ở bước 1 L1 và ở bước Nam châm L4 | Bàn tay che nhãn "Mèo" của vương miện và chữ "Nam châm" dưới nút | Lệch bàn tay để không che nhãn | – |
| 16 | Minor | L7, kịch bản Con dấu | Bấm Con dấu rồi chạm sai cột | Báo "Chạm cột đang sáng." nhưng trên ảnh chụp không thấy cột nào sáng rõ (chỉ có bàn tay) | Viền sáng rõ ở cột cần chạm | – |

## Tutorial: chỗ bị tắc
- Không có chỗ tắc cứng: ở mọi bước của L1 (7 bước), L4, L7, L9, làm theo bàn tay thì đi tiếp được. Thoát giữa kịch bản L1 về Trang chủ rồi vào lại thì kịch bản chạy lại từ bước 1, không kẹt.
- L1 bước 3 (Chạm bộ bài): đây là chỗ dễ bối rối nhất. Tem Mèo lộ ra đúng lúc bước 2 vừa dạy "thêm tem cùng loại vào ô", người chơi làm theo thì bị báo "Chưa được!" (lỗi #1).
- L1 bước 5 (Xếp tem): ô Trái cây vừa mở, kéo táo/cam vào ô bị từ chối; chỉ được xếp lên nhau trên cột (lỗi #1).
- L1: Hoàn tác bị chặn trong khi bảng luật hứa "lúc nào cũng được" (lỗi #5).
- L2: gợi ý "Chạm bộ bài" cứ chỉ bộ bài sau khi đã có nước tốt hơn (lỗi #2).
- L1–L3: đứng yên quá lâu thì chỉ được gợi ý 1 lần (lỗi #6). Hoàn tác lúc gợi ý đang chạy để lại bàn tay đứng im chỉ bộ bài (lỗi #3).
- L9: kịch bản Tem Vàng che vương miện và không dạy cách dùng Tem Vàng sau khi đặt (lỗi #7).

## Kịch bản đã PASS
- Save trống: vào màn hình chính, "Chơi Level 1" mở L1 kèm kịch bản.
- L1: chạm bộ bài sớm, chạm/kéo lá khác lá được chỉ, kéo sai đích đều báo "Chưa được! Làm theo bàn tay." và bàn tay chỉ lại.
- L1: chạm thay cho kéo vẫn được tính ở bước 1 và bước 4. Kéo vào ô trống khác ô bàn tay chỉ cũng được (bước 3).
- L1: cầm lá trên cùng của xấp thì cả xấp đi (bước 5, bước 6).
- L1: Pause, mở Cách chơi, bấm Hiểu rồi thì về ván, bàn tay hiện lại đúng bước.
- L1: bấm ô booster khoá báo "Mở ở level 2".
- L1 thắng thì sang L2. L2 hiện bảng Cách chơi một lần.
- Thả sai không trừ nước ("Chỉ xếp tem cùng loại.", số nước giữ nguyên).
- L2: popup "Mới: Gợi ý" hiện sau 6 nước, +3 lượt miễn phí, Gợi ý chỉ đúng nước.
- Chạm vương miện khi chỉ còn 1 ô trống bị chặn ("Ô trống cuối cùng! Chắc thì kéo vào nhé."), kéo vào thì được.
- Ô phụ +1 qua quảng cáo giả: mở thêm ô, kéo vương miện vào ô phụ được.
- L3: chạm lá úp báo "Tem úp. Dọn tem phía trên trước."; Hoàn tác trả nước và giữ lá đã lật.
- L4: popup "Mới: Nam châm"; trong kịch bản, Gợi ý/chạm lá/chạm bộ bài đều bị chặn có thông báo; bấm Nam châm thì tự hút 2 tem vào ô Khủng long.
- L7: popup "Mới: Con dấu"; chạm sai cột báo lỗi; chạm đúng cột lật ngửa cả cột.
- L9: popup "Mới: Tem Vàng"; chạm sai cột báo lỗi; chạm đúng cột đặt được Tem Vàng.
- Hết nước: popup có +5 nước (quảng cáo, 1 lần), +5 nước 300 xu, Chơi lại. Lần hết nước thứ hai chỉ còn lựa chọn xu.
- L5: hết nước thì vào Overtime (∞) có thông báo.
- Kẹt ở L5: tặng Nam châm, vẫn kẹt thì tặng Tem Vàng, đặt được Tem Vàng.
- Kẹt ở L6: panel "Hết đường đi" có Dùng Nam châm / Ô phụ / Hoàn tác / Chơi lại; Dùng Nam châm hoạt động.
- Màn thắng: +3 Tem Điểm, Nhận x2 qua quảng cáo giả cộng xu.
- Trang trí: đặt Cờ dây (trừ 2 Tem Điểm, hiện trên màn hình chính). Album mở và đóng được.
- Ô Chương 2 khi khoá mở popup giới thiệu; "Báo tôi khi mở" đổi thành "Sẽ báo bạn!".
- L10 thắng (debug Win now): "Xong chương 1!", nút Chương 2 mở popup "đã mở", màn hình chính chuyển sang L11–L20; nút chuyển qua lại Chương 1/Chương 2 hoạt động; chơi được L11.
- L20 thắng: "Xong chương 2!", về Trang chủ, nút "Sắp có level mới" mở popup.
- Đổi ngôn ngữ giữa ván (Pause): chữ đổi ngay, ván giữ nguyên.
- Đổi cỡ 375×812 sang 360×640 giữa ván: bố cục co lại, kéo thả vẫn đúng; L10 (5 cột) vừa khung 360×640.
- Chạm bộ bài 3 lần thật nhanh: chỉ rút 1 lá, không lá lạc.
- Hai ngón chạm hai lá cùng lúc: ngón thứ hai bị bỏ qua, không lá lạc, không lá kẹt trạng thái nhấc.
- `tests/drag-scenarios.browser.js`: 13/13 PASS. `tests/naive-drag.browser.js` (L3 seed 7; L5 hasty seed 3): không báo lỗi.
