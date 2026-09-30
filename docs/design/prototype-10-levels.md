# Prototype 10 level: Stamp Sort

**Ngày:** 2026-09-30 · **Code:** `prototype/stamp/` · **Trạng thái:** bản chơi được, art tạm từ APK Stamp Solitaire, chờ art order.

Mục tiêu của bản này là kiểm chứng **core loop và gamefeel**, chưa phải meta hay fiction "Little Post Office". Luật bám sát game gốc đã xác nhận ở `teardown-video-apk-0.9.5.md`, cộng thêm Undo như một khác biệt "cozy" có chủ đích.

## 1. Cách chạy

```bash
.venv/bin/python tools/build_proto_assets.py
python3 -m http.server 8765 --directory prototype/stamp
```

Mở `http://localhost:8765`. Điện thoại cùng wifi mở `http://<IP máy>:8765`. Thêm `?debug` để hiện bảng debug (tự giải, thêm moves, thắng ngay, lật hết lá, qua level, xóa save). Thêm `?level=N` để vào thẳng level N.

Bản web test: https://notbad.games/stampsort/ (nhánh `gh-pages`, deploy lại bằng `tools/deploy_web.sh`). Bản này chứa art APK tạm, chỉ để test nội bộ.

Art và âm thanh nằm trong `prototype/stamp/assets/`, bị `.gitignore`, build lại bằng script trên. Khi có art order, giữ nguyên tên file trong `assets/ui/` và `assets/cards/<topic>/` rồi thay file là xong. Bảng tên file và sprite gốc nằm ở `ASSET_MAP` trong `tools/build_proto_assets.py`.

## 2. Luật chơi

| Luật | Chi tiết |
|---|---|
| Mục tiêu | Gom mọi tem vào các ô theo chủ đề. Ô đủ n tem thì đóng thành phong bì và trống lại |
| Mở ô | Chỉ **tem chủ đề** (khung vàng, vương miện) vào được ô trống. Ô hiện tên chủ đề và `x/n` |
| Đặt vào ô | Tem cùng chủ đề. Kéo cả chồng cùng chủ đề vào ô được, tính 1 move |
| Bàn (tableau) | Chỉ xếp tem lên tem cùng chủ đề. Chồng cùng chủ đề đi cùng nhau. Cột trống nhận mọi chồng. Tem chủ đề chỉ đặt vào ô hoặc cột trống |
| Úp/ngửa | Mọi lá trong cột úp trừ lá trên cùng. Lá lộ ra tự lật, không tốn move |
| Deck | Chạm để rút 1 lá, tốn 1 move. Waste xòe 3 lá, chỉ lá trên cùng dùng được. Hết deck thì chạm để lật waste về, không tốn move |
| Moves | Mọi nước kéo và rút tốn 1 move, kể cả kéo cả chồng vào ô (đã xác minh bằng OCR video). Lật lại deck và kéo sai không tốn move (đã xác minh). Level 1 vô hạn |
| Thắng / thua | Thắng khi giao hết tem. Hết moves thì thua, có +5 moves (1 lần xem ad giả lập miễn phí, sau đó 100 coin) |
| Kẹt | Deck rỗng và không còn nước có ích: hiện panel gợi ý Joker, Ô phụ, Undo hoặc chơi lại |

Chạm một lá sẽ tự tìm đích tốt nhất theo thứ tự: ô cùng chủ đề, ô trống (với tem chủ đề), cột cùng chủ đề, cột trống, Joker. Không có đích thì lá rung và hiện lý do.

## 3. Booster

Bốn booster, giá và lịch mở theo game gốc (`research/apk/com.stamp.solit/levels/boosters.json` và video). Undo là khác biệt riêng của mình, nằm ở nút tròn bên trái thanh booster.

| Booster | Mở ở | Tặng khi mở | Giá khi hết | Tác dụng | Nguồn |
|---|---|---|---|---|---|
| Hint | 2 | 3 | 300 coin | Solver tìm nước tiếp theo, tô sáng lá và đích | APK giá 300, video mở L2 |
| Pack | 4 | 2 | 500 coin | 2 lá ẩn (úp hoặc trong deck) của một ô đang mở bay vào ô, 0 move. Một ô mở thì tự áp dụng, nhiều ô thì chạm chọn | APK "Add 2 random hidden cards to a Topic", video L4 |
| Stamper | 7 | 2 | 500 coin | Chọn một ô, 1 lá của chủ đề đó được "đóng dấu" vào, 0 move | APK "Choose a Topic to add one card", video L7 |
| Joker | 9 | 2 | 1200 coin | Golden Stamp đặt lên cột chọn, 0 move, mọi tem xếp lên được đến hết level | APK, video L9 |
| Ô phụ | 2 | – | 1000 coin hoặc 1 ad (giả lập) | Thêm 1 ô ở góc trái hàng deck cho level hiện tại | APK `GameSetting` 1000, video L2 |
| Undo | 1 | 3 mỗi level | 50 coin | Hoàn tác, trả lại move. Không hoàn tác sau khi phong bì đã gửi hoặc sau booster | Riêng của mình |

Coin khởi đầu 500 (APK `CurrencyManager`). Thắng được 10 + 10 × sao, nút "Claim x2" xem ad giả lập để nhân đôi. Hết moves: +5 moves miễn phí 1 lần qua ad giả lập, sau đó 900 coin (giả thuyết: số 900 trong `GameSetting`).

## 4. Mười level

Level 1-9 dựng lại từ video (thông số đọc bằng OCR 3124 frame với `tools/ocr_frames.swift` và xem frame): số ô, số cột, deck ban đầu, **moves đúng như video**, danh sách chủ đề và n. Chủ đề video không có art trong APK được thay bằng chủ đề gần nhất (Cow→Hoofed, Clock→Time, Animals→Beast, Music Note→Notes, Butterfly→Insect, Marine Animal→Sea life, Summer Trip→Float, Grill→Grilled, Pet Supplies→Pet Care). Level 2 trùng cấu trúc với level 2 trong APK. Thứ tự lá úp không thấy trong video, nên generator (`node tools/gen_proto_levels.mjs`) chọn seed có số move tối ưu của solver không quá 85-100% moves video và tỉ lệ thắng mô phỏng gần mục tiêu. Level 10 là finale riêng vì video dừng ở level 9.

| Level | Vai trò | Ô | Cột | Chủ đề | Lá | Deck | Move tối ưu | Moves | Moves video | Moves/tối ưu | Thắng mô phỏng | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | tutorial | 3 | 2-3-4 | 3 | 16 | 7 | 23 | inf | inf | - | 1 | Kịch bản ép 7 bước, moves vô hạn |
| 2 | teach | 3 | 3-4-5 | 6 | 30 | 18 | 48 | 66 | 66 | 1.38 | 1 | Mở Hint |
| 3 | teach | 4 | 2-3-4-5 | 6 | 35 | 21 | 56 | 75 | 75 | 1.34 | 0.95 | 4 ô |
| 4 | normal | 4 | 3-4-5-6 | 8 | 43 | 24 | 66 | 82 | 82 | 1.24 | 0.95 | Mở Pack (ô Dinosaur mở sẵn) |
| 5 | normal | 4 | 3-4-5-6 | 8 | 52 | 34 | 87 | 96 | 96 | 1.1 | 0.84 | Deck 34 |
| 6 | normal | 4 | 3-4-5-6 | 7 | 40 | 22 | 62 | 76 | 76 | 1.23 | 0.91 |  |
| 7 | normal | 4 | 3-4-5-6 | 7 | 45 | 26 | 70 | 80 | 80 | 1.14 | 0.81 | Mở Stamper (ô Sea life mở sẵn) |
| 8 | normal | 4 | 3-4-5-7 | 7 | 41 | 22 | 64 | 75 | 75 | 1.17 | 0.82 |  |
| 9 | wall | 4 | 3-4-5-6 | 8 | 48 | 30 | 79 | 110 | 110 | 1.39 | 0.53 | Mở Joker, dùng ngay |
| 10 | finale | 5 | 3-4-5-6-7 | 9 | 60 | 35 | 96 | 125 | - | 1.3 | 0.93 | Finale riêng, 5 ô |

Moves của game gốc chặt: solver full-info cần 72-91% số moves. Người chơi thật không thấy lá úp nên sẽ cần nhiều nước hơn, đây là chỗ Joker, Pack, Stamper và +5 moves kiếm tiền. Nếu playtest thấy quá khó, tăng moves trong `DESIGN` của generator rồi chạy lại.

## 5. Gamefeel

| Khoảnh khắc | Phản hồi |
|---|---|
| Nhấc lá | Lá phóng to 7%, bóng đổ sâu, nghiêng theo vận tốc kéo, chồng phía sau đuổi theo có độ trễ, tiếng nhấc, rung nhẹ |
| Kéo | Đích hợp lệ phát sáng (ô viền vàng, lá đỉnh cột phát sáng, cột trống tô sáng) |
| Thả đúng | Lá trượt vào với easing out-back, nảy nhẹ khi chạm |
| Thả sai | Lá bay về chỗ cũ, toast giải thích lý do bằng một câu |
| Chạm | Lá bay theo đường cong tới đích tốt nhất. Không có đích thì rung ngang |
| Mở ô | Ribbon tên chủ đề bật lên, vòng sáng lan, tia sáng vàng |
| Giao tem | Số đếm phóng to rồi thu lại, tia sáng, âm thanh cao dần theo combo (11 bậc), chữ "x3", "x4" bay lên từ combo 3 |
| Đủ ô | Tem gom lại, phong bì bật ra, dấu sáp đập xuống kèm rung màn hình và rung máy, tên chủ đề bay lên, phong bì bay khỏi màn hình kèm vệt sáng |
| Lật lá | Lật 3D bằng rotateY |
| Pack | Vòng sóng xanh ở ô, 2 lá ẩn bay theo đường cong từ deck hoặc từ dưới cột vào ô, lật giữa đường |
| Stamper | Con dấu đập từ trên xuống ô, rung màn hình, 1 lá bay vào |
| Joker | Golden Stamp bay từ thanh booster xuống cột, vòng sáng vàng |
| Kịch bản tutorial | Booster cần bấm nhấp nháy, bàn tay chỉ, đi sai thì lá bật về và nhắc "Follow the hand!" |
| Rút bài | Lá bay từ deck sang waste và lật giữa đường |
| Moves còn ≤ 5 | Số chuyển đỏ và đập nhịp |
| Thắng | Confetti, sao bật từng cái kèm âm cao dần, coin bay về HUD từng đồng |
| Vào level | Chữ "Level N" rơi xuống, chia bài từng lá từ deck ra cột |

Mọi chuyển động chỉ dùng transform và opacity. Particle vẽ trên một canvas duy nhất.

## 6. Tutorial

Hai lớp, dựng lại theo video.

**Kịch bản ép bước** (chỉ cho đúng nước đi của bước, có bàn tay và lá phát sáng, đi sai thì lá bật về kèm "Follow the hand!"):

| Level | Bước | Nguồn |
|---|---|---|
| 1 | Bàn dựng tay y video: cột 1 táo úp + mèo trắng; cột 2 chuối, mèo mướp úp + chủ đề Cat; cột 3 pizza, dứa, dưa hấu úp + cam; deck 7 lá (chủ đề Fruit, dâu, chủ đề Pizza, 2 lát pizza, mèo cam, mèo xám). Bảy bước: đưa Cat vào ô giữa → mèo trắng vào ô → rút bài → đưa Fruit vào ô → xếp cam lên táo → dời chồng táo+cam lên dưa hấu → kéo cả chồng 3 lá vào ô Fruit → "Clear every topic to win". Sau đó chơi tự do với moves vô hạn | `[VIDEO 00:00-00:48]` |
| 4 | Ô Dinosaur mở sẵn. Popup Pack → bấm Pack → 2 tem Dinosaur ẩn bay vào ô | `[VIDEO 04:28-04:36]` |
| 7 | Ô Sea life (Marine Animal) mở sẵn. Popup Stamper → bấm Stamper → chạm ô → 1 tem được đóng dấu vào | `[VIDEO 10:40-10:52]` |
| 9 | Popup Joker → bấm Joker → chạm cột 2 → Golden Stamp đặt xuống | `[VIDEO 14:32-14:44]` |

**Gợi ý theo ngữ cảnh** (không khóa màn hình, hiện một lần):

| Bước | Level | Hiện khi |
|---|---|---|
| Moves có hạn | 2 | Vào level |
| Rút bài | 2 | Không còn nước vào ô và deck còn lá |
| Xếp chồng | 2-3 | Có nước gộp chồng cùng chủ đề |
| Ô bắt đầu bằng tem chủ đề | 3 | Vào level (câu tương ứng ở video L3) |
| Cột trống | 3 | Có chồng chuyển được vào cột trống |
| Ô bận | 3-4 | Mọi ô đều đang mở |

Kéo sai hiện toast giải thích ("Only the same topic can stack", "Start a pile with a topic stamp"), tương đương các câu nhắc trong video L2, L3. Level 1-3 có gợi ý miễn phí khi đứng im 7 giây.

## 7. Câu hỏi cho playtest

1. Hệ số moves có đủ rộng cho người mới ở level 2-5 không? Đo moves còn lại khi thắng.
2. Chạm để tự đi có làm người chơi bỏ qua kéo thả và mất cảm giác "solitaire" không?
3. Level 9 (xe cộ dễ nhầm) có tạo "aha" hay chỉ gây bực?
4. Undo 3 lượt có làm game quá dễ không? So sánh tỉ lệ thắng có và không có Undo.
5. Chuỗi phong bì có quá dài khi người chơi đang chơi nhanh không? Hiện kéo dài khoảng 1.5 giây nhưng không khóa input.
