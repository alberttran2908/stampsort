# L11, L13, R11: Nhắc nghỉ, Thông báo nhẹ, liveops.json, luật Tem Điểm (Feature Dev, 2026-10-15)

Nguồn: `liveops-30-days.md` mục 6.1, 6.2 (F9, F10), 3.4, 9.2 (L11, L13); `30-day-plan.md` câu 3 và vòng R11. Chưa commit.

## 1. File

| File | Nội dung |
|---|---|
| `prototype/stamp/assets/liveops.json` (mới) | Cấu hình đóng gói: `schedule_mode`, `cycle`, `features` (ngưỡng mở khoá), `big_events` (lịch 28 ngày), `weekend_event`, `rewards` (daily, weekly, morning, welcome, weekend, mailbag, route, season kèm `rare_decor`, errands kèm pool, gentle_retry), `rest`, `notifications`, `kill_switch` (12 công tắc). Nằm trong `assets/` vì `deploy_web.sh` chỉ chép `src/`, `assets/`... (không sửa `tools/`) |
| `prototype/stamp/src/config.js` (mới) | `applyConfig(raw)`: trộn lên mặc định theo đúng kiểu, ghi đè tại chỗ vào hằng của `liveops.js`, `events.js`, `CONF`. `loadConfig(url)`: 404, mạng lỗi, JSON hỏng thì dùng mặc định và ghi cảnh báo. Khoá lạ bỏ qua (khoá bắt đầu bằng `_` là ghi chú) |
| `prototype/stamp/src/notify.js` (mới) | `buildSchedule` (lịch 7 ngày, tối đa 1 mỗi ngày), bọc plugin `LocalNotifications` (`requestPermission`, `reschedule`, `cancelAll`), `restTimer` (đếm 45 phút ở tiền cảnh) |
| `prototype/stamp/src/points.js` (mới) | `stampPoints`: luật Tem Điểm R11 |
| `prototype/stamp/src/liveops.js` | `SCHED.cycle` thay hằng `CYCLE` trong `liveState`; `fromNext` (E1 từ chu kỳ 2 bắt đầu cd 1) thành dữ liệu; `pickPopup` thêm mục `notif` |
| `prototype/stamp/src/events.js` | `KILL` đủ 12 công tắc; độ dài event đọc từ `BIG_EVENTS`; bộ 3 Tem theo mùa trao decor hiếm (`rare`) |
| `prototype/stamp/src/settings.js` | `rest` (mặc định 1), `notif` (mặc định 0), `notif_hour` (9/15/19) |
| `prototype/stamp/src/main.js` | Đọc `liveops.json` trước mọi thứ (`?debug&liveops=` để thử file khác); áp `kill_switch` cho Thư hôm nay, Thẻ tuần, Thư buổi sáng, Chào mừng, ô Event; nhắc nghỉ; hỏi và xếp thông báo; dòng Cài đặt; `stars()` dùng `stampPoints`; banner level khó không còn boom/rung, thêm câu "cứ thong thả"; decor hiếm theo mùa, `season_all.png`, PNG tem mùa |
| `prototype/stamp/index.html`, `src/copy.js` | Tấm giấy nhắc nghỉ; chữ EN/VI cho nhắc nghỉ, thông báo, Cài đặt, banner khó, decor hiếm |
| `mobile/` | `@capacitor/local-notifications` 8.3.1, `npx cap sync ios` (Package.swift có 2 plugin). `xcodebuild` cho Simulator: BUILD SUCCEEDED. README thêm 1 dòng |
| `tests/config-notify.test.mjs`, `tests/points.test.mjs`, `tests/l11-l13.browser.js` (mới), `tests/fixtures/liveops_kill_season.json`, `liveops_broken.json` | Test |

## 2. Quyết định

| # | Quyết định | Lý do |
|---|---|---|
| C-1 | Giá trị trong `liveops.json` hiện bằng đúng hằng số trong code (test kiểm file = mặc định). GD đổi số trong file, không phải sửa code | Yêu cầu: "chỉ cần làm cấu trúc và giá trị hiện tại" |
| C-2 | Sai kiểu từng giá trị thì giữ mặc định của giá trị đó. Mảng có luật (lịch event, vòng túi thư, mốc, pool việc vặt) sai một phần tử thì giữ **cả mảng** mặc định. Pool việc vặt chặn mọi `on` ngoài 7 loại (không thể thêm việc "tiêu xu") | Tránh lịch hay vòng booster lệch nửa chừng; giữ luật "không việc nào buộc tiêu xu" ngay cả khi file bị sửa sai |
| C-3 | `kill_switch.<event>` = true: event không chạy, ô Event ẩn trong cửa sổ đó, không có dấu tem mùa. Các công tắc khác: daily, weekly, morning, welcome, weekend, mailbag, gentle_retry, rest, notifications | Mục 9.2 L13 |
| C-4 | `weekend_event.min_level` là ngưỡng E3 thật (`features.weekend` giữ cho bảng mở khoá nhưng không dùng để tính) | Lịch cũ đọc ngưỡng từ `SMALL_EVENTS` |
| N-1 | Thông báo chỉ có trên app native. Web: không hỏi, không có dòng trong Cài đặt, mọi hàm trả về êm | Yêu cầu "web thì bỏ qua êm" |
| N-2 | Sau lần giao Thư hôm nay thứ 3 (lần đầu thắng, không tính chơi lại), popup tự hiện ở màn chính hỏi trước bằng lời của Pip ("Bật nhắc" / "Để sau"). Chỉ khi bấm "Bật nhắc" mới gọi hộp xin quyền của iOS. Hỏi 1 lần; sau đó bật được trong Cài đặt. Popup này xếp sau phong bì quà, trước "Tính năng mới", vẫn tối đa 1 popup mỗi lần | Mục 6.2 F9. Không bật hộp hệ thống bất ngờ |
| N-3 | Lịch 7 ngày, tối đa 1 mỗi ngày, giờ chọn 9:00 / 15:00 / 19:00. Ngày mở Tuyến đưa thư (đủ L12) và ngày mở Tem theo mùa (đủ L20) dùng câu event, còn lại là "Thư hôm nay đã đến". Đã giao thư hôm nay thì bỏ thông báo hôm nay. Xếp lại khi mở app, khi quay lại từ nền và sau khi giao Thư hôm nay | Mục 6.2 F9. Nội dung không có "hết hạn", "sắp mất", "nhanh lên" (test quét EN/VI) |
| R-1 | Nhắc nghỉ: đếm thời gian app ở tiền cảnh (cả màn chính), ra nền >= 10 phút thì đếm lại. Tới 45 phút thì đợi lúc rảnh (không có bảng, không đang kéo, không giữa màn thắng) rồi hiện 1 tấm giấy nhỏ có Pip dưới HUD, tự ẩn sau 9 giây, chạm để ẩn. Không chặn thao tác, không có nút bắt buộc. Tắt được trong Cài đặt (mặc định bật) | Mục 6.1 F10: "nhẹ nhàng, không chặn" |
| P-1 | Tem Điểm: thắng trong số nước được 3 (còn >= 50% phần nước dư so với lời giải tối ưu) hoặc 2; Ca tối ở level khó được 2 (trước là 1); level không giới hạn nước được 3. Không còn mức 1 điểm | `30-day-plan.md` câu 3: "Ca tối ở level khó: 2 điểm", "Thắng trong moves: 3 hoặc 2" |
| P-2 | Banner level khó: bỏ tiếng `boom` và rung bàn, thay bằng tiếng chuông nhỏ (`feature`, âm lượng 0,4) và câu "Hôm nay hơi đông thư, cứ thong thả." / "A busy day at the post office. Take your time." Level thường hết nước vẫn hiện bảng hết nước như ABI | R11 (#16), rủi ro 9 trong plan |
| A-1 | Bộ 3 Tem theo mùa: decor hiếm theo hình tem của tháng thật (hoa: hộp thư hoa anh đào, vỏ sò: đèn vỏ sò, lá phong: hộp thư lá phong, bông tuyết: hộp thư tuyết) + trang tem mùa (huy chương `season_all.png`) + 1 Tem Vàng. Decor hiếm vào mục "Decor hiếm" trong Album (chưa có chỗ đặt thứ 7 trên tường, để R17) | Tin nhắn điều phối, art đợt 6 |

## 3. Kiểm thử (Chrome headless riêng cổng 948x–949x, preview 8766)

| Bộ | Kết quả |
|---|---|
| `config-notify.test.mjs` (mới) | 9/9: file = mặc định, thiếu/hỏng/mạng lỗi chạy mặc định, ghi đè một phần, khoá lạ và sai kiểu, mảng sai giữ mặc định, `kill_switch.season`, lịch đổi qua file, lịch thông báo 7 ngày, chữ không gây áp lực, nhắc nghỉ 45 phút |
| `points.test.mjs` (mới) | 4/4: 3 hoặc 2 khi thắng trong số nước, Ca tối 2, không giới hạn 3, quét 2000 trường hợp chỉ ra 2 hoặc 3 |
| `l11-l13.browser.js` (mới) | 7/7 (EN và VI): đọc file lúc khởi động; web không hỏi; plugin giả: hỏi đúng sau Daily thứ 3, xin quyền 1 lần, xếp 7 thông báo / 7 ngày; nhắc nghỉ đợi bảng đóng, không chặn, tắt được; banner khó 0/162 khung rung, có câu "cứ thong thả", level thường hết nước vẫn hiện bảng; `kill_switch.season` ẩn ô Event và không có tem mùa; file hỏng vẫn chơi được |
| `liveops`, `events`, `fuzz --quick` | 19/19, 11/11 (thêm kiểm decor hiếm), 106/106 |
| `home-liveops`, `events.browser`, `daily`, `r5-chapters`, `drag/naive/resume`, `settings`, `win-screen` x2 | 12/12, 7/7, 10/10, 10/10, 19 PASS, 5/5, 9/9 + 9/9 |
| iOS | `npx cap sync ios`, `xcodebuild` Simulator: BUILD SUCCEEDED |

Ảnh: `docs/qa/img/l11-l13/` (390×844, 375×667, EN/VI): banner level khó, nhắc nghỉ ở màn chính và trong level, popup hỏi thông báo, Cài đặt bản native và bản web, panel Tem theo mùa bộ 3 (decor hiếm), Album có trang tem mùa và decor hiếm.

## 4. Còn để sau

- Đặt decor hiếm và món kỷ niệm lên tường (cần chỗ đặt thứ 7, R17).
- Remote Config: `loadConfig` nhận URL, nối Firebase sau (chưa gọi mạng).
- Thử thông báo thật trên iPhone (TestFlight): hộp xin quyền, giờ, nội dung.
