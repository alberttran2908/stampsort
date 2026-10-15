# L6–L10: Cuối tuần xu đôi, Túi thư của Pip, Tuyến đưa thư, Tem theo mùa, Tuần việc vặt, Thử lại nhẹ tay (Feature Dev, 2026-10-15)

Nguồn: `liveops-30-days.md` mục 2, 3, 4, 6.1, 6.2 (E1, E2, E3, E4, F5, F11), 9.2 (L6–L10), 10 (Không FOMO). Chưa commit.

## 1. File

| File | Nội dung |
|---|---|
| `prototype/stamp/src/events.js` (mới) | Logic thuần, test được trong Node: `currentEvent` (phiên event = id + chu kỳ k), `syncEvents` (chốt phiên đã qua, quà chưa nhận vào gifts), `milestones`, `claim` (1 lần), `routeStep`, `seasonCardFor`, `seasonCollect`, `SEASON_MOTIF`, `pickErrands`, `errandBump`, `mailbagWin`, `weekendMult`, `gentleRecord`, `gentleOn`. Hằng `WEEKEND`, `MAILBAG`, `ROUTE`, `SEASON`, `ERRAND_POOL`, `ERRANDS`, `GENTLE`, `KILL` |
| `prototype/stamp/src/main.js` | `track()` bọc `trackRaw` để đếm việc vặt; `evState`, `winMeta` (trạm tuyến, túi thư ở màn thắng), `eventPanel` (3 panel event, nút Nhận từng mốc), đăng ký `EVENT_UI` (ô Event sáng thật), dải băng cuối tuần, thanh túi thư, tem mùa trên lá và lúc gửi, x2 xu cuối tuần, Thử lại nhẹ tay, album tem tuyến và trang tem mùa, popup "Tính năng mới" cho event và túi thư |
| `prototype/stamp/src/copy.js` | Chữ EN/VI cho E1–E4, F5, F11, album |
| `prototype/stamp/index.html` | Dải băng, thanh túi thư, chấm đỏ ô Event, dòng event màn thắng, nhãn x2, dấu tem mùa trên lá, panel event, album |
| `prototype/stamp/assets/ui/season_{flower,shell,leaf,snow}.svg` (mới) | Dấu tem mùa **tạm** (vẽ bằng code, palette 5 màu), chờ art ChatGPT |
| `prototype/stamp/tests/events.test.mjs` (mới) | 11 test Node, có mô phỏng 56 ngày |
| `prototype/stamp/tests/events.browser.js` (mới) | 7 kịch bản trình duyệt với đồng hồ giả |

## 2. Quyết định

| # | Quyết định | Lý do |
|---|---|---|
| E-1 | Trạng thái event lưu theo phiên `id#k` trong `save.ev`. Mỗi lần mở app, về màn chính, thắng hoặc thua đều gọi `syncEvents`: phiên đã qua bị chốt, mốc đã đạt mà chưa nhận chuyển vào `save.gifts`, rồi trao bằng phong bì quà gộp của L4 | Mục 3.3: "quà đã đạt mà chưa nhận được tự trao ở lần mở kế tiếp", "tiến độ dở dang không chuyển sang event mới". Mỗi mốc có `mid` riêng, chỉ trao 1 lần (test mô phỏng 56 ngày không có trao trùng) |
| E-2 | Mốc quà nhận bằng nút "Nhận" trong panel event. Ô Event có chấm đỏ khi có mốc chờ nhận | Một khoảnh khắc nhận quà rõ ràng cho người lớn tuổi. Không có đồng hồ hay chữ "sắp hết". Quên nhận thì vẫn được trao khi event kết thúc |
| E-3 | E1: mọi lần thắng (chiến dịch, Thư hôm nay, kể cả chơi lại Thư hôm nay) đi 1 trạm. Thua không gọi gì, nên không lùi | Mục 6.2 E1. Chơi lại Daily để đi trạm là có lợi một chút nhưng vô hại (game 1 người, chuyến thêm tối đa 3) |
| E-4 | E1: cảnh tuyến là bưu thiếp chương `2 + (k mod 12)` (Bến Cảng, Đồi Trà, ...) kèm tên khu | Mục 6.2: "art cảnh dùng nền chương". Phố Chính chưa có bưu thiếp. Trạm 20 thêm 1 tem tuyến vào album (bưu thiếp của khu đó) |
| E-5 | E2: "lá được gửi đi" = ô chứa lá đó hoàn thành (phong bì bay đi). Tem cộng ngay lúc đó và lưu ngay, nên thua sau đó vẫn giữ. Level đã nhận tem trong phiên thì chơi lại không có tem (`got[levelKey]`) | Mục 6.2 E2 |
| E-6 | E2: chọn lá bằng hash tất định. Thư hôm nay luôn có. Chiến dịch có khoảng một nửa số level (`hash(levelId, k) mod 2`). Chỉ lá tem thường (không phải lá vương miện, không phải Tem Vàng) | Test: tỉ lệ L21–L240 nằm trong 45–55% |
| E-7 | E2: chưa có art tem mùa nên dùng 4 SVG tạm (hoa, vỏ sò, lá phong, bông tuyết) theo **tháng thật**. Decor hiếm theo mùa chưa có art: bộ 3 trao trang tem mùa (album), 1 Tem Vàng và 100 xu | Mục 6.2 có cho phép dự phòng khi chưa có art. Có art thì thay file SVG cùng tên, và đổi xu thành món decor hiếm |
| E-8 | E4: bộ đếm lấy từ chính sự kiện analytics (`level_complete`, `daily_complete` (không tính chơi lại), `decor_place`, sự kiện mới `deliver` mỗi lần gửi một bao thư). Việc "15 bao thư của một chủ đề trong khu hiện tại" đơn giản thành "15 bao thư" | Mục 9.2 L9. Đơn giản hơn cho người lớn tuổi, không phải nhớ chủ đề nào |
| E-9 | E3: x2 chỉ áp cho xu thắng level chiến dịch (10 + 10 × Tem Điểm). Không áp cho Thư hôm nay, thưởng chương, hộp, event. Dải băng không bấm được, nằm giữa ô xu và bánh răng. Màn thắng có nhãn đỏ "Cuối tuần ×2" | Mục 6.1 E3. Thắng chính L8 vào Thứ Bảy thì chưa có x2 (lúc tính thưởng mới đã thắng L7) |
| E-10 | F5: thanh túi thư (icon túi, vạch, n/12, icon booster kế tiếp) nằm dưới nút Chơi, chỉ hiện từ L15. Khi có thanh, nút Chơi nâng lên 52 px (neo theo đáy, tránh thanh home). Đủ 12 lần thắng thì booster vào kho ngay, màn thắng có dòng "Túi thư của Pip đầy rồi!" | Mục 4: "thanh dưới nút Chơi, là một phần của nút" |
| E-11 | F11: thua 2 lần liền ở cùng level thường (từ L11, không phải level khó, không phải Daily) thì lần sau +3 nước và lá trên cùng bộ bài lật sẵn ra ô rút (không tốn nước), kèm 1 câu của Pip. Còn thua tiếp thì lần sau vẫn được giúp, tới khi thắng hoặc đổi level. **Bật mặc định**, công tắc `EV.KILL.gentle_retry` | Mục 6.1 F11, câu hỏi mở 2 (đề xuất bật). Level vẫn thua được |
| E-12 | Popup "Tính năng mới" cho Tuyến đưa thư (khi chạy, từ L12), Túi thư (L15), Tem theo mùa (L20), Việc vặt (L30). Mỗi thứ 1 lần, tối đa 1 popup mỗi phiên, xếp sau phong bì quà | Mục 2 quy tắc 2, 4 |
| E-13 | Công tắc tắt từng function (`KILL`) đang là hằng trong `events.js` | `liveops.json` là việc của L13 |

## 3. Còn để sau

- Art: 4 hình tem mùa (thay `season_*.svg`), 4 decor hiếm theo mùa.
- L11 (Thông báo nhẹ, Nhắc nghỉ), L12 (`liveops_sim`), L13 (`liveops.json` đọc đè `KILL` và hằng phần thưởng).
- Ô Event dùng `ic_event` (biển gỗ) cho E1, dấu tem mùa cho E2, `decor/chalk_board` (bảng giá phấn) cho E4. Nếu cần icon riêng cho E4 thì thêm vào đợt art sau.

## 4. Kiểm thử (2026-10-15, Chrome headless riêng cổng 948x–949x, preview 8766)

| Bộ | Kết quả |
|---|---|
| `events.test.mjs` (mới, Node) | 11/11: lịch 84 ngày đúng event theo cd, cần L12/L20/L30, bỏ ngày không mất trạm, quà chưa nhận vào gifts đúng 1 lần, 20 trạm + 3 chuyến thêm, tem mùa 45–55% level, 5 việc tất định, túi thư vòng 6 món, x2 cuối tuần, thử lại nhẹ tay, mô phỏng 56 ngày người chơi 5/7 (tuyến >= 15, tem >= 16, không trao trùng) |
| `events.browser.js` (mới) | 7/7, chạy cả EN và VI: ô Event qua 29 ngày; E1 thắng/thua/bỏ ngày/nhận mốc/phong bì khi hết event; E2 Thư hôm nay có tem, thua vẫn giữ, chơi lại không có; E4 đếm và nhận việc; E3 x2 + dải băng + túi thư; F11 +3 nước và 1 lá lật sẵn; chữ cấm |
| `liveops.test.mjs`, `fuzz --quick` | 19/19, 106/106 |
| `home-liveops`, `daily`, `r5-chapters`, `drag/naive/resume`, `settings`, `win-screen` (2 lần) | 12/12, 10/10, 10/10, 19 PASS, 5/5, 9/9 + 9/9. Test L5 đổi kỳ vọng: event đang chạy và đủ level thì ô Event sáng (5 điểm chạm, đúng mức trần) |

Ảnh: `docs/qa/img/l6-l10/` (390×844 và 375×667, EN và VI): màn chính Thứ Bảy (dải băng, thanh túi thư, ô Việc vặt có chấm đỏ), màn chính khi có Tuyến đưa thư, 3 panel event, lá có dấu tem mùa ở cỡ lá thật, màn thắng có dòng trạm tuyến và túi thư đầy, màn thắng Thứ Bảy có nhãn ×2, phong bì quà khi E1 kết thúc, album có tem tuyến, câu Thử lại nhẹ tay.
