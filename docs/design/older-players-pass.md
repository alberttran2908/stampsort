# Vòng chỉnh thân thiện người lớn tuổi (2026-10-10)

**Nguồn quyết định:** người dùng chốt "game chill cho người già" khi duyệt bộ SFX. Đối tượng chính là người chơi lớn tuổi, tone chill. Mọi mặc định nghiêng về phía dễ chịu.

## 1. Âm thanh (chi tiết: `sfx-review.md` mục 8)

- Bỏ hẳn kèn bưu điện. Thắng, mở tính năng, hết chương dùng hộp nhạc chơi thong thả và chuông nghe như từ xa.
- Năng lượng dồn ở dải trung: 96% nằm trong 300 Hz–2,5 kHz. Phần 2–5 kHz giảm từ 18,6% xuống 3%.
- Độ to trung bình nhỏ hơn 4,2 dB. Khoảng cách giữa các nhóm hẹp hơn, không âm nào gây giật mình.
- Tiếng báo đi sai (`deny`) là một tiếng "phù" gỗ trầm duy nhất, rất nhỏ, để không có cảm giác bị trách.
- Combo không vượt nốt C6.

## 2. Độ khó

- Chương 2: moves được nâng tới khi người mới (người chơi mô phỏng đi phí 25% nước) thắng tối thiểu:
  - 80% ở level thường;
  - 75–80% ở level bump;
  - 85–90% ở level mở đầu chương và level nghỉ.
- Kết quả: L11–L19 người mới thắng 80–100% (bản B 78–100%). L15 và L20 vẫn là mốc khó, có Overtime nên không thể thua.
- Chương 1 giữ nguyên, vì bản A là baseline clone ABI dùng để A/B. Người mới ở chương 1 thắng 73–100%, +5 moves thì 100%.
- Hoàn tác miễn phí mỗi level: 3 → 5 lượt.

## 3. Đọc và chạm

- Chữ nhỏ nhất lên khoảng 34–36px trên stage 1080, tức khoảng 12–13pt trên điện thoại 375pt:
  - nhãn booster và Undo 36px;
  - toast 42px;
  - nhãn gợi ý 44px;
  - chữ trong popup 40px;
  - số đếm trên khay và lá 34px;
  - album 32–40px;
  - màn Chương 2 32–38px.
- Tên chủ đề trên lá vương miện 34px, tự co tới tối thiểu 24px khi tên dài (vd. "Thuyền buồm").
- Ô chuyển chương cao 104px (khoảng 36pt).

## 4. Nhịp và chuyển động

- Toast hiện ít nhất 2,2 giây và lâu hơn 1,5 lần so với trước. Nhãn gợi ý tự ẩn sau 9 giây (trước 6 giây). Gợi ý một lần hiện 4,8 giây.
- Bàn tay gợi ý: booster Hint hiện 6 giây, gợi ý khi đứng yên hiện 5 giây.
- Banner "Level n" hiện lâu hơn 0,4 giây.
- Rung màn hình còn một nửa biên độ. Nhấp nháy (pulse) có biên độ 1,07 thay vì 1,14 và nhịp chậm hơn (1,4–2 giây).
- Máy bật "giảm chuyển động" (`prefers-reduced-motion`) thì tắt rung và gần như tắt animation lặp.

## 5. Chưa làm, cần playtest với người thật

- Cỡ lá bài: hiện 165×214 (lá to hơn 11% khi level có ≤ 4 cột). Nếu người lớn tuổi khó nhận tem thì cân nhắc giảm số cột hoặc phóng lá.
- Kéo thả: người lớn tuổi có thể run tay. Hiện ngưỡng nhận kéo là 12px, và chạm-để-đi đã có. Cần đo tỉ lệ thả hụt (`invalid_move` reason `drop`) theo nhóm tuổi.
- Chế độ chữ cực lớn trong cài đặt.
