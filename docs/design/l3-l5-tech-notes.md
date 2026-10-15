# L3, L4, L5 và nối art polish: ghi chú kỹ thuật (Feature Dev, 2026-10-15)

Nguồn yêu cầu: `liveops-30-days.md` (mục 2, 4, 6.1, 6.2 F3/F4/F6, 9.2 L3/L4/L5), `benchmark-grand-games.md` (P3, P5, P6, P9, P11), `art-batch-1.md` mục 6, báo cáo QA cũ (nhãn Golden Stamp, test `idle_long`). Chưa commit.

## 1. File

| File | Nội dung |
|---|---|
| `prototype/stamp/src/liveops.js` | Thuần logic, test được trong Node: `weeklyCard`, `weekStart`, `morningDue`, `morningReward`, `welcomeDue`, `welcomeReward`, `mergeRewards`, `pickPopup`, hằng `WEEKLY`, `MORNING`, `WELCOME`. `touch()` ghi `live.awayDue` khi vắng >= 3 ngày lịch. `FEATURES.welcome = 5` |
| `prototype/stamp/src/main.js` | Thẻ tuần trong panel Thư hôm nay, huy hiệu n/5, hộp tuần ở màn thắng Daily; phong bì quà gộp (F6 + quà event cũ + F4); hàng đợi popup `homePopups`; +5 nước F6; ô Event; màn chính mới; túi thư màn thắng; icon booster mới; chữ nổi kem/nâu |
| `prototype/stamp/src/fx.js` | Hạt sprite `assets/fx/` thay sao 8 cánh và confetti màu neon (P5). `preloadFx()`. Máy yếu: vẽ sprite không xoay |
| `prototype/stamp/src/copy.js` | Chữ EN/VI mới: Thẻ tuần, Thư buổi sáng, Chào mừng quay lại, quà gộp, ô Event, nhãn aria; tên 6 chủ đề ch12–13 (Sách, Lò sưởi, Thể thao tuyết, Xe đạp, May vá, Sân chơi) và cư dân nhận (Lina, Finch); tên 12 decor ch12–13 |
| `prototype/stamp/src/chapters.js` | Decor ch12 Rừng Thông, ch13 Thung Lũng Hoa theo gợi ý `art-batch-1.md` mục 8 (thứ tự 6 chỗ đặt, giá 4/5/6/7/8/10). Bưu thiếp `assets/ch12`, `ch13` tự nhận qua đường dẫn chuẩn |
| `prototype/stamp/index.html` | Nền cao P3, hệ nút P11, màn chính P9 (ô xu, bánh răng, ô Album/Trang trí, ô Event, Pip ngồi chờ, hạt bụi nắng), túi thư P6, nút đóng tròn, nhãn booster dài |
| `prototype/stamp/tests/home-liveops.browser.js` (mới) | Test trình duyệt L3–L5: điểm chạm theo level, khoảng trống, Thẻ tuần, Thư buổi sáng, Chào mừng quay lại, popup không chồng lúc mở app |
| `prototype/stamp/tests/liveops.test.mjs` | Thêm 6 test Node cho L3, L4 và grep chữ cấm |
| `prototype/stamp/tests/win-screen.browser.js` | `runEvents` tất định (mục 4) |
| `prototype/stamp/tests/daily.browser.js` | Kịch bản 1 dùng `__game.returnHome()` (popup chỉ tự hiện khi vừa về màn chính) |

Không sửa `levels*.js`, `tools/`, art gốc.

## 2. Quyết định (tự quyết theo tài liệu, ghi lý do)

| # | Quyết định | Lý do |
|---|---|---|
| D1 | "Vắng N ngày" = số ngày lịch không mở app giữa 2 lần mở (`hôm nay − lần mở trước − 1`). F6 khi N >= 3, thêm Tem Đa Năng khi N >= 7 | Đúng nghĩa chữ "vắng" và AC L4 (vắng 2 ngày không có, vắng 3 ngày có). Mở T2 rồi T6 là vắng 3 ngày (T3, T4, T5) |
| D2 | F6 cũng chỉ có từ khi đã thắng L5. Vắng khi chưa tới L5 thì bỏ lần đón đó | Mục 2 quy tắc 1 và mục 10: "Không function meta nào mở trước L5". Người mới ở L3 nhận 1 Nam châm chưa mở khoá sẽ khó hiểu |
| D3 | Hàng đợi popup: lúc mở app (boot, hoặc quay lại từ nền sau >= 30 phút / sang ngày mới) và mỗi lần **về** màn chính từ level, tối đa 1 popup. Ưu tiên: hỏi ván dở (chỉ lúc mở app) > phong bì quà > "Tính năng mới" (tối đa 1 mỗi phiên). Thứ chưa hiện thì đợi lần sau, quà không mất | Mục 4: "Tối đa 1 popup mỗi lần mở app, F6 > quà event cũ > F4, gộp 1 phong bì". Ván dở đứng đầu vì giữ hành vi R10 (người chơi muốn chơi tiếp ván của mình, quà đợi tới lúc về màn chính). Lật trang chương, đổi ngôn ngữ không tính là "về" nên không bật popup |
| D4 | F6 + quà event cũ + F4 gộp **một** phong bì, tiêu đề theo thứ ưu tiên cao nhất; nhận bằng 1 chạm | Mục 4 "Gộp thành 1 phong bì nếu nhiều quà cùng lúc". F4 trong phong bì gộp vẫn tính 1 lần nhận (đếm lần thứ 7) |
| D5 | Quà chỉ cộng khi bấm "Nhận". Đóng app lúc popup đang mở thì lần sau vẫn còn | Bền vững (mục 10): quà đã đạt không mất |
| D6 | +5 nước F6 áp cho level chiến dịch đầu tiên bắt đầu mới (không áp Daily, ván dở, level không giới hạn nước). Nhận 2 lần mà chưa chơi thì vẫn +5, không cộng dồn | Mục 6.1 "level đầu +5 lượt" |
| D7 | Thẻ tuần đóng ô theo **ngày của lá thư** (`D.won[day]`), nên thư hôm qua chơi bù đóng ô hôm qua. Hộp mở ngay ở màn thắng Daily có dấu thứ 5, cộng chung xu thưởng (40 + 100) | Mục 6.2 F3. Không đợi Chủ nhật, không chữ "mất chuỗi". Huy hiệu n/5 (không phải "5/7") để người chơi thấy còn thiếu mấy ô |
| D8 | Trong panel Thư hôm nay, Sổ dấu ngày còn 1 dòng tiến độ (trang, n/20, vạch); trang 20 ô đầy đủ vẫn ở đầu Album | Panel có thêm Thẻ tuần: để nguyên 20 ô thì nút "Mở thư" tụt khỏi màn 375×667 |
| D9 | Ô Event: chưa qua L5 hoặc ngoài cửa sổ event thì ẩn. Trong cửa sổ mà chưa đủ level: mờ "Mở ở Level N". Đủ level nhưng event chưa làm (E1/E2/E4 là L7–L9): mờ "Sắp có". Cả hai trạng thái mờ **không phải nút** và không tính điểm chạm. Vòng sau chỉ cần đăng ký `EVENT_UI[id] = { progress, open }` là ô sáng, có vạch tiến độ, bấm được | Mục 3.2 "ô Event hiện 'Mở ở Level N' mờ (không phải nút)". Không hiện một nút mở ra màn trống |
| D10 | Điểm chạm chính đánh dấu `data-touch`: Chơi, Album, Trang trí (từ L1), Thư hôm nay (từ L5), Event (khi sáng). Lưới level và mũi tên chương là bản đồ (`data-map`), ô xu và bánh răng là HUD | Mục 4. Kết quả: L1–L4 = 3, L5+ = 4, tối đa 5 khi có event |
| D11 | Dải băng Cuối tuần (E3) **chưa hiện** | Dải băng hứa "xu ×2", phần ×2 thuộc L6. Hiện dải băng trước khi có ×2 là hứa sai |
| D12 | Pip ngồi chờ (`pip_wait`) trên kệ giữa màn khi chương chưa đặt giường của Pip (decor thứ 6), đặt rồi thì ẩn (Pip đã nằm ngủ trên giường) | P9 "lấp khoảng trống giữa" và "level hiện tại có mũi tên hoặc Pip". Không có Pip thì khoảng trống giữa lưới và nút Chơi là 21% ở 390×844 và 27% ở 375×667 khi chưa mua decor |
| D13 | Album, Trang trí thành 2 ô icon (`ic_album`, `ic_decor`) ở đáy trái/phải cạnh nút Chơi; nút Chơi và 2 ô neo theo đáy trên mặt kệ (tránh thanh home). Decor trên kệ hạ từ `bottom` 330 xuống 290 cho khớp mặt kệ của nền cao | Mục 4 (đáy trái, đáy phải). Ở vị trí cũ, 2 ô che mất decor trên kệ (hộp thư, giường Pip) |
| D14 | Màn 16:9 (iPhone SE, phần dư < 160 px stage): logo 524×360, lưới sát hơn (lớp `#stage.short`) | Ảnh 375×667: decor tường (bảng ghim, đồng hồ) chạm biển chương |
| D15 | Hệ nút P11: `.btn` = nút chính vàng đồng (`btn_primary`), `.btn.sec/.orange/.brown/.sub/.small` = nút phụ giấy kem (`btn_secondary`), `.x-close` = nút đóng tròn. Giữ tên lớp cũ để không đổi hàng chục chỗ gọi. 9-slice `44 96 60` (đo trên ảnh 868×194: góc trang trí trong 96 px, gờ đáy khoảng 60 px). Nhấn: ảnh `_down` và dịch xuống 4 px. Tắt: ảnh `_off` | Art agent ghi ảnh `_down` gần giống bản thường. CSS không còn `btn_blue.png`, `btn_yellow.png` |
| D16 | Nút đóng tròn chỉ thay chữ "Đóng" ở 2 tấm giấy toàn màn (Album, giới thiệu chương). Các bảng nhỏ giữ nút chữ "Đóng" (nút phụ) | Người lớn tuổi đọc chữ "Đóng" rõ hơn dấu X; X dùng ở chỗ tấm giấy chiếm cả màn, nơi người chơi tìm góc trên phải theo thói quen |
| D17 | Hạt P5: confetti là mảnh giấy kem/đỏ/xanh, lá vàng, tem nhỏ, phong bì nhỏ (tỉ lệ giữ theo ảnh, lật như giấy); lấp lánh 4 cánh mềm thay sao 8 cánh; vòng sóng đổi sang màu trong palette (vàng đồng, xanh air-mail, kem). Rung màn còn tối đa 3 (gửi thư, Con dấu, banner level khó) | Tiêu chí P5: 0 hạt màu ngoài palette, không `shake(` > 3. Giữ rung 3 (1,5 px) thay vì bỏ hẳn để test "Bớt chuyển động tắt rung" vẫn có đối chứng |
| D18 | Chữ nổi (combo, +5 xu, tên chủ đề giao xong, +nước): chữ nâu đậm trên viên kem viền nâu | P5 "Chữ combo nâu đậm trên viên kem". Tương phản #5a3a26 trên #fff8ea khoảng 10:1 |
| D19 | Túi thư P6: túi mở hiện ở 0,06 s phía trên ruy băng bảng thắng, phong bì từ các khay bay vào miệng túi (thay vì bay vào thanh tiến độ), túi đầy lên kèm nén nhẹ khi phong bì cuối vào. Chạm tua: túi đầy ngay. Bớt chuyển động: túi đầy hiện tĩnh, không phong bì bay. Màn thắng Thư hôm nay: túi đầy hiện cùng bảng | Mốc thời gian R12 giữ nguyên (nút bấm được 2,5 s, chạm tua <= 300 ms) |
| D20 | Nhãn booster dài ("Golden Stamp") cố định 36 px (không nhân cỡ chữ) và canh phải trong ô booster cuối | Ở chữ Lớn (mặc định), nhãn căn giữa ra ngoài mép phải màn 390 và chạm "Stamper". Không đổi tên vì "Golden Stamp" là từ cố định trong hướng dẫn |
| D21 | Icon booster: Nam châm dùng `ic_magnet` (nam châm giữ phong bì), Tem Vàng dùng `ic_wild` (tem vàng sao cầu vồng). Món kỷ niệm Sổ dấu ngày hiện ảnh `rare_postbox` (thay con dấu sáp) | Art đợt 2–4 đã có. Đặt món kỷ niệm lên tường như decor thường cần chỗ đặt thứ 7, để vòng R17 |

## 3. Art đã nối

| Art | Dùng ở |
|---|---|
| `bg_game_tall.jpg`, `bg_hard_tall.jpg` (P3) | Nền `#stage`, `.home`, level khó. Bỏ dải gradient che đường nối |
| `btn_primary*`, `btn_secondary*`, `btn_close` (P11) | Mọi nút panel, nút Chơi, nút màn thắng, X Album/teaser |
| `ic_settings`, `ic_album`, `ic_decor`, `ic_daily`, `ic_event`, `chapter_sign`, `level_pin` (P9) | Màn chính |
| `assets/fx/*` (P5) | `fx.js` confetti, sparkle |
| `mailbag_open`, `mailbag_full` (P6) | Màn thắng chiến dịch và Thư hôm nay |
| `pip_wait` | Pip ngồi chờ trên kệ, phong bì quà (F4/F6) |
| `ic_magnet`, `ic_wild` | Thanh booster, popup tặng Nam châm, chip quà |
| `assets/decor/*` ch3–11, `assets/chN/postcard.jpg` | Đã nối từ vòng R5 (tải thử ảnh, đủ 6 món thì bật). Vòng này kiểm lại vị trí trên nền cao: `docs/qa/img/l3-l5/after/decor/` |
| `rare_postbox` | Dòng "Món kỷ niệm" trong Sổ dấu ngày |
| Decor, bưu thiếp ch12–13 | `chapters.js` (vòng này). Ảnh kiểm vị trí: `after/decor/decor_ch12_*.jpg`, `decor_ch13_*.jpg` |

## 4. Test `idle_long` chập chờn: nguyên nhân và cách sửa

Lần chạy lỗi ghi 2 sự kiện `[{s:3},{s:4}]`. Sự kiện đầu đến từ **ván của test trước** (`runDrift` để level đứng yên), được ghi trong lúc `runEvents` đang vào level mới, sau khi đã lấy mốc đếm. Thêm nữa, `closePanels` bấm nút đầu của bảng Ô phụ là "xem quảng cáo giả" (1,4 s), làm thời điểm bắt đầu đứng yên trôi theo máy. Sửa trong test: về màn chính trước và chờ 1 nhịp interval rồi mới lấy mốc; đóng bảng Ô phụ bằng nút Đóng; chờ tới khi có sự kiện (tối đa 15 s) thay vì ngủ cố định 6,5 s, rồi chờ thêm 2 nhịp để chắc không có lần thứ hai. Không đổi logic `idle_long` trong game.

## 5. Còn để sau

- E3 dải băng và ×2 xu (L6). F5 Túi thư của Pip dưới nút Chơi (L6): chỗ dưới nút Chơi đang là mép trên thanh home, cần xếp lại khi làm.
- E1/E2/E4 (L7–L9) đăng ký vào `EVENT_UI`. Đẩy quà chưa nhận vào `save.gifts = [{ src, coins, hint, pack, stamper, joker }]` khi event kết thúc.
- Món kỷ niệm `rare_postbox` đặt lên tường (R17).
- `liveops.json` (L13): hằng `WEEKLY`, `MORNING`, `WELCOME` đang ở `liveops.js`.

## 6. Kiểm thử (2026-10-15, Chrome headless riêng cổng 948x, preview 8766)

| Bộ | Kết quả |
|---|---|
| `liveops.test.mjs` (Node) | 19/19 (13 cũ + 6 mới L3/L4 + grep chữ cấm) |
| `fuzz.test.mjs --quick` | 106/106, 1100 ván |
| `home-liveops.browser.js` (mới) | 8/8 `runAll` + 4/4 `checkBoot`, chạy cả EN và VI |
| `daily.browser.js` | 10/10 |
| `r5-chapters.browser.js` | 10/10 |
| `drag-scenarios`, `naive-drag` (runDrift, runDriftScript), `resume.browser.js` | 19 PASS, 0 FAIL |
| `settings.browser.js` | 3 cỡ chữ không tràn, Bớt chuyển động, giữ sau reload: PASS |
| `win-screen.browser.js` (`runAll` + `runEvents`) | 9/9, chạy liền 3 lần đều PASS (`idle_long` 1 sự kiện mỗi lần). Nút màn thắng bấm được ở 2502–2511 ms |
| Nhãn booster (script đo) | 390×844, 375×667, 360×780 × EN/VI × 3 cỡ chữ: cách mép >= 6 px, không chồng nhãn |

Ảnh: `docs/qa/img/l3-l5/before/`, `after/` (390×844 và 375×667, EN và VI), so sánh `compare_*.jpg`, decor ch1–13 trên nền cao `after/decor/`.
