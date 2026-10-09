# Thay đồ hoạ APK bằng art mới vẽ qua ChatGPT

**Ngày:** 2026-10-09 · **Phạm vi:** toàn bộ đồ hoạ prototype 10 level (`prototype/stamp/assets/`). Âm thanh vẫn là bản tạm từ APK.

## 1. Nguyên tắc

- **Giữ bố cục, vẽ mới.** Mỗi file giữ đúng vai trò, kích thước canvas, vị trí trong game và loại vật (giống mèo, kiểu xe…). Tư thế, góc nhìn và nét vẽ phải khác bản ABI. Lần thử đầu của chủ đề Cat bám tư thế cũ gần như y hệt nên bị loại và vẽ lại.
- **Một style chung "Little Post Office":** viền nâu ấm `#5a3a26` (không đen), màu pastel ấm, một lớp bóng mềm và một điểm sáng, tỉ lệ chibi, kiểu sticker. Bản Cat đã duyệt (`research/art-redo/style_ref_cat.png`) được gửi kèm mọi lệnh làm mẫu.
- **Icon chủ đề là hình biểu tượng, không phải nhân vật.** Bản đầu bắt icon "giống icon con mèo" (mặt cười, chân mèo), kết quả không ai nhận ra chủ đề. Bản dùng: một vật tiêu biểu nhất của chủ đề, viền nâu đậm, nền kem, tối đa một màu nhấn, không mặt, không chân, phải nhận ra được ở 48px.

## 2. Kết quả

| Nhóm | Số lượng | Cách làm |
|---|---|---|
| Tem trong lá | 310 tem, 59 chủ đề | Mỗi chủ đề một lưới 3×3. 44 chủ đề có lưới mẫu cũ gửi kèm. 15 chủ đề cuối chỉ dùng chữ, vì hết lượt tải file. ChatGPT tự chọn món, còn xa hình ABI hơn |
| Icon chủ đề | 59 | 7 bảng 9 icon, có ghi tên chủ đề trên lưới mẫu |
| Khung lá bài | 9 | Mặt sau (họa tiết phong bì, kèn bưu điện), 6 mặt tem pastel, khung vàng lá vương miện, Tem Vàng (mũ bưu tá) |
| Icon và UI | 17 | Kính lúp, Tem Vàng, nam châm, nam châm trong phong bì, con dấu, xu, sao, khoá, nút cộng, vương miện, nút nạp bài, dấu sáp, tay chỉ, phong bì, ô MOVES, nút booster, ruy băng |
| Logo | 1 | "STAMP SORT" (tên tạm, đổi được) |
| Vẽ bằng code | 5 | Tia sáng màn thắng. Ô trống, bóng đổ, bóng khi nhấc, viền sáng được bake từ khung lá mới |

Đã xoá khỏi `assets`: 12 file UI ABI game không dùng, cùng 261 file tem ABI không có trong 10 level. Bản sao lưu art APK nằm ở `research/art-redo/backup/` (gitignore). Sau khi nén bằng pngquant: tem 8,4MB, UI 0,9MB. Bộ art APK cũ là 12MB.

## 3. Quy trình và công cụ

1. **Lưới mẫu:** `research/art-redo/ref/` (gitignore, chứa art APK). `grid_map.json` ghi ô nào ứng với file nào. `icon_sheets.json` ghi thứ tự 9 chủ đề trên mỗi bảng icon.
2. **ChatGPT web trên Chrome của người dùng:** một vòng lặp JS chạy trong tab ChatGPT gắn ảnh mẫu, gõ lệnh, gửi, chờ ảnh rồi tải về `~/Downloads/lpo_*.png`. Cứ 6 chủ đề mở chat mới.
3. **Cắt:** `tools/art_slice.py` (xem docstring) xoá nền, tách 9 ô và ghi vào `assets`.
   - Tem: cắt sát vật thể, cạnh dài 256px (game vẽ bằng `object-fit: contain`).
   - UI: giữ canvas cũ. Khung lá, ô MOVES, nút và ruy băng được kéo đầy canvas vì CSS vẽ phủ kín.
   - `--fixed`: cắt theo lưới, lấn 15% sang ô bên, chỉ giữ vật chính.
   - Cách tách theo vùng liên thông bị lỗi khi các vật đứng sát nhau: Car có một ô ra cả hàng 3 xe.
   - Script báo `THIẾU` cho ô không tách được.
4. **Tự động:** `tools/art_take.sh <slug>` lấy ảnh từ Downloads, cắt, ghi vào game và làm ảnh so sánh cũ/mới `research/art-redo/preview_<slug>.jpg`.

## 4. Sự cố gặp phải

| Sự cố | Xử lý |
|---|---|
| CSP của chatgpt.com chặn tải ảnh mẫu từ localhost | Đưa sẵn toàn bộ ảnh mẫu vào một ô file ẩn trong trang. Vòng lặp lấy file từ đó và gắn qua `DataTransfer` |
| Trang có 2 khung soạn tin (khung cũ ẩn) | Chỉ dùng phần tử đang hiển thị |
| ChatGPT ẩn bớt ảnh cũ khi chat dài | Nhận diện ảnh mới theo kích thước file, không đếm số ảnh |
| **Hết lượt tải file của gói Plus** (khoảng 90 ảnh trong một khung giờ; báo "Upload limit reached", không có lỗi trong trang) | Làm tiếp bằng chữ, trong chat đã có sẵn các lưới làm mẫu style. Kết quả vẫn đồng bộ |
| ChatGPT đặt vật lệch ô (nấm morel nằm ở ô 8) | Gán tay |

## 5. Vẽ lại thêm theo review game design (P2 #17, #18)

Cùng chat và style ref với các đợt trước. Ba lưới 3x3 (`research/art-redo/gen/lpo_p2_a|b|c.png`) được cắt bằng `python3 tools/art_slice.py cards <lưới> fruit/0,ball/1,... --fixed --apply`:
- Fruit 0, 1, 2, 4, 5, 6 và Ball 0, 1, 2, 5, 6, 7: bỏ mặt cười.
- Notes 0, 2, 3, 6, 7, 8, 11: đồ vật âm nhạc thay cho ký hiệu nhạc phẳng.
- Ship 1 → thuyền gỗ, Beast 14 → cáo, Zoo 5 → ngựa vằn, Zoo 7 → hà mã.

Nền level khó: tải nền ban ngày lên, yêu cầu vẽ lại cùng bố cục lúc buổi tối (`ui2/lpo_bg_evening.png`), rồi xử lý như nền ngày (crop 1080×1920, làm mờ họa tiết vùng chơi 60%) thành `assets/ui/bg_hard.jpg`.

Decor "Bưu điện nhỏ" và icon Tem Điểm: một lưới (`gen/lpo_decor_a.png`), hàng 1 là cờ dây trải ngang. Cắt bằng `python3 tools/art_slice.py paths <lưới> -,decor/bunting,-,decor/frame,... --apply`. Hàng 2–3 dùng thêm `--fixed` vì khung tem dính với hòm thư. Cờ dây cắt lại ở độ phân giải gốc (1201 px) vì hiển thị rộng 1020 px.

## 6. Còn lại

- ~~Âm thanh APK~~: đã thay bằng SFX tự tổng hợp (`tools/synth_sfx.py`, `prototype/stamp/sfx/`). `prototype/stamp/assets/` được commit, chỉ còn ignore `assets/audio/`.
- ~~Level 7 có Zoo cạnh Sea life và Float~~: đã đổi Zoo → Cake (P0).
