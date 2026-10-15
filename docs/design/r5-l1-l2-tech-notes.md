# R5, L1, L2 và đợt sửa P1: ghi chú kỹ thuật (Feature Dev, 2026-10-15)

Nguồn yêu cầu: `30-day-plan.md` (R5), `level-pipeline-r1-r3.md`, `liveops-30-days.md` (mục 2, 3, 4, 6.2 F1/F2, 9.2 L1/L2), `art-batch-1.md` mục 6, báo cáo `docs/qa/uiux-build5-2026-10-15.md` và `docs/qa/qa-ed368d6-2026-10-15.md`. Chưa commit.

## 1. File

| File | Nội dung |
|---|---|
| `prototype/stamp/src/chapters.js` (mới) | `buildChapters()`: 13 chương phủ L1–L240 (ch1–2: 10 level, ch3+: 20 level), decor theo art-batch-1, giá ch3+ 4/5/6/7/8/10 |
| `prototype/stamp/src/liveops.js` (mới) | L1: `epochDay`, `touch` (chống lùi giờ), `liveState`, `FEATURES`, `BIG_EVENTS`, đồng hồ giả `setClock` |
| `prototype/stamp/src/daily.js` (mới) | L2: pool Thư hôm nay, `pickDaily` (tất định, không lặp, giữ thư đã mở), `dailyLevel` |
| `prototype/stamp/src/main.js` | Nạp `levels_gen.js`, chương 20 level, teaser chung, Thư hôm nay, Sổ dấu ngày, sửa P1 |
| `prototype/stamp/src/copy.js` | Chữ EN/VI mới (chương 7–13, teaser, Daily, tip level, 27 tên chủ đề, 54 tên decor) |
| `prototype/stamp/src/fx.js` | QA N2: bitmap canvas hiệu ứng = chiều cao stage thật, xoá toàn bộ |
| `prototype/stamp/index.html` | Nút Thư hôm nay, biển chương có tiến độ, CSS decor theo chỗ đặt, CSS màn thắng/chữ HUD |
| `prototype/stamp/tests/liveops.test.mjs` (mới) | Node: AC L1 (6 mục) và pool Daily |
| `prototype/stamp/tests/r5-chapters.browser.js`, `daily.browser.js` (mới) | Test trình duyệt R5, L2 |
| `prototype/stamp/tests/fuzz.test.mjs` | Thêm kiểm `LEVELS_GEN` và chiến dịch ghép |

## 2. Quyết định (tự quyết theo tài liệu, ghi lý do)

| # | Quyết định | Lý do |
|---|---|---|
| F1 | `levels_gen.js` nạp bằng `import()` động, thiếu file thì mảng rỗng | File do Level Dev ghi dần (lúc viết: L21–L49). Import tĩnh sẽ làm hỏng cả game nếu file chưa có |
| F2 | Mỗi số level L21+: level sinh nếu có, không thì level APK cùng số; dừng ở chỗ hổng đầu tiên; `?apk=1` ép dùng APK | Tester TestFlight không mất nội dung khi chương chưa sinh xong. Web công khai: `deploy_web.sh` đã thay `levels_apk.js` bằng mảng rỗng, nên chỉ còn level sinh |
| F3 | 13 chương thay vì 12 | `liveops-30-days.md` 7.1 ghi "12 chương" nhưng tính ra 240 level = ch1–2 (20) + ch3–13 (11 × 20), tức 13 chương. Chương chỉ hiện khi đã có level, nên định nghĩa dư không ảnh hưởng gì. Tên ch12 "Rừng Thông / Pine Woods" (Đông) và ch13 "Thung Lũng Hoa / Flower Valley" (Xuân) là **đề xuất**, chờ duyệt |
| F4 | Lưới màn chính giữ 2 hàng: chương 20 level chia 2 trang 10 ô, mũi tên đi từng trang rồi sang chương | Lưới 4 hàng không vừa màn 9:16 cùng logo và nút. Biển gỗ (`chapter_sign.png`) ghi "Chương 3 · 31–40", tên khu, vạch tiến độ "14/20" |
| F5 | Save cũ: giữ `unlocked`, Tem Điểm, xu theo số level. Bỏ một lần cờ `chapter3`–`chapter6` (`chv = 2`) | Cờ đó thuộc cấu trúc 10 level/chương của bản APK (thưởng ở L30/L40...). Không bỏ thì tester mất thưởng hết chương 3 thật ở L40. Có thể nhận +200 lần nữa: chấp nhận (hào phóng, đối tượng lớn tuổi) |
| F6 | Decor/bưu thiếp chương 3+: tải thử ảnh, đủ 6 món mới bật decor, không thì "sắp có". Bưu thiếp thiếu thì hiện placeholder giấy kem có tên khu | Art đang về dần (trong phiên đã có ch3, ch4). Không cần sửa code khi art về |
| F7 | Tem mới trong teaser lấy từ `introduce` của level trong chương | Luôn khớp art thật (kể cả khi generator dùng fallback) |
| F8 | Thư hôm nay mở khi **đã thắng L5** | Bảng mục 2: "mở khoá theo level đã thắng", "mở khi L5". Popup 1 câu, 1 hình, nút "Xem", chỉ 1 lần |
| F9 | Nút Thư hôm nay ở bên trái logo, ngang tầm mắt | Mục 4: "Trái, ngang tầm mắt". Đặt dưới lưới thì chồng mũi tên chương trên màn 9:16. Bên phải logo để dành cho ô Event (L5) |
| F10 | Pool tạm khi chưa có `levels_daily.js`: level chiến dịch 30–46 lá, không khó, không kịch bản/giới thiệu booster, không "bump"; level thường +12% lượt; đảo thứ tự cột; tránh 10 level chiến dịch kế tiếp của người chơi | Doc gợi ý "tạm lấy từ level đã sinh/ABI 36 lá". Kho ABI 36 lá chưa được đổi chủ đề và chỉnh lượt (việc của Level Dev, `gen_levels.mjs --daily`), level APK trong game đều > 46 lá trừ 2. Đảo cột không đổi độ khó (cột độc lập trong luật). Có `levels_daily.js` (`export const LEVELS_DAILY`) thì dùng nguyên |
| F11 | Ngày theo giờ máy, đổi lúc 00:00. Lá thư chọn theo ngày lịch, đã mở thì khoá theo `save.daily.hist` | Thư không đổi giữa ngày khi pool lớn lên; không lặp trong cửa sổ min(pool − 1, 60) ngày |
| F12 | Ván dở Thư hôm nay lưu ở khoá riêng (`..._resume_daily`) | Chơi Daily không bao giờ đè ván dở chiến dịch |
| F13 | Đồng hồ giả chỉ ở `?debug`: `?now=YYYY-MM-DD[THH:MM]`, `?pd=N`; test gọi `__game.live.setNow()` | Theo mục 3.4. Người chơi web không chỉnh ngày bằng URL |
| F14 | Phần thưởng: 40 xu (chơi bù hôm qua 20), Sổ dấu ngày 20 ô, đầy trang +150 xu + 1 món kỷ niệm | Mục 6.1. Art kỷ niệm `rare_postbox` chưa có: hiện con dấu sáp và bộ đếm "Món kỷ niệm: N" |

## 3. Sửa lỗi theo báo cáo QA và UI/UX

| Mã | Sửa |
|---|---|
| UI P1-1 | Thân bảng có lề đáy 28 px; câu giải thích Tem Điểm chỉ hiện lần đầu (đã có cờ); đo lại bảng (`fitPanel`) khi nút sẵn sàng |
| UI P1-2 | Nút chính màn thắng rộng 600 px, chữ 56 px, "thở" 1→1,04 (tắt khi Giảm chuyển động). Nút Trang trí thành nút phụ giấy kem (cao 127 px, tối đa 520 px). Nút chờ ẩn hẳn rồi hiện dần 160 ms |
| UI P1-3 | Khay mờ về 0 sau khi phong bì bay (0,95 s), tua thì ẩn ngay |
| UI P1-4 | Mũi tên chương 128 px, nút chia đoạn Cài đặt 128 px |
| UI P1-5 | "NƯỚC" và số xu 40 px, tiến độ thư 44 px, bộ đếm lá vương miện thành viên kem 38 px nhô ra mép trái (không nhận chạm) |
| UI P2-1 | Chữ dạy ẩn khi có bảng |
| UI P2-8 | Lá thư cuối của ván rút từ 1,56 s xuống khoảng 1,0 s, chờ 120 ms thay vì 250 ms trước màn thắng |
| QA N1, N5 | Không lưu ván chưa đi nước nào. Có ván dở ở level khác mà mở level mới thì hỏi ("Chơi tiếp Level N" / "Chơi Level M"); chọn mở level mới thì ván cũ vẫn giữ tới nước đi đầu |
| QA N2 | Canvas hiệu ứng theo chiều cao stage thật, `clearRect` xoá toàn bộ |
| QA N3 | Nhãn VI "Âm thanh" thành "Âm hiệu ứng" (đã có công tắc Nhạc nền riêng); "Giảm chuyển động" thành "Bớt chuyển động" / "Less motion" (UI P2-3) |
| QA N4 | Bản lưu giữ 10 bước hoàn tác gần nhất |
| QA N6 | Đổi ngôn ngữ giữa ván viết lại câu "Tem mới" đang giữ và nhãn Ô phụ |
| QA N7 | Cờ "đã xem" của câu chủ đề mới / tip level chỉ ghi ở nước đi đầu |
| QA N9 | Ô trống cuối: chạm lần 2 vào cùng lá trong 5 giây là xác nhận ("Chạm lần nữa để mở ô") |
| QA N10 | Như P1-1 (lề đáy thân bảng) |
| QA N11 | Tên trên lá vương miện ẩn khi lá nằm trong ô (ruy băng khay đã có tên) |

## 4. Còn để sau

- Pool Daily thật 90 level (Level Dev, `gen_levels.mjs --daily`). Pool tạm hiện có 23 level (L1–L40), nên thư lặp lại sau 23 ngày; L41–L80 sẽ nâng lên khoảng 50.
- Thẻ tuần, Thư buổi sáng (L3), Chào mừng quay lại (L4), ô Event (L5), `liveops.json` (L13).
- `deploy_web.sh` (Level Dev giữ `tools/`): regex gắn `?v=` không khớp tên có dấu gạch dưới và import động, nên `levels_gen.js` có thể bị cache cũ tới 10 phút trên GitHub Pages.
