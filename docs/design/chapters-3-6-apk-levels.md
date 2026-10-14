# Chương 3–6: 40 level lấy từ APK (L21–L60)

**Ngày:** 2026-10-15. **Yêu cầu:** "lấy thêm 40 level từ apk". **Tool:** `node tools/import_apk_levels.mjs --from=21 --count=40` → `prototype/stamp/src/levels_apk.js`.

## Cách lấy

- **Nguồn:** level 21–60 trong `research/apk/com.stamp.solit/levels/levels.json` `[APK-LV]`, bản 0.9.5. Bản này cũ hơn bản trong video (xem `teardown-video-apk-0.9.5.md`).
- **Giữ nguyên:** bố cục cột, thứ tự bộ bài, số khay, số tem mỗi chủ đề (`n`, tới 12).
- **Moves:** lấy moves gốc, nhưng **tối thiểu 1,3 × số nước tối ưu** (do solver tính). Lý do: đối tượng là người lớn tuổi, và APK có level sát lời giải (L31 gốc cho 85 nước trong khi tối ưu là 86). 30/40 level được nới. Đáng kể nhất: L31 85 → 112, L49 130 → 164, L50 160 → 193, L45 155 → 188.
- **Chủ đề:** APK dùng 192 chủ đề cho 40 level này, mình mới có art cho 67.
  - Chủ đề trùng tên với chủ đề mình có thì giữ nguyên.
  - Chủ đề còn lại được thay bằng chủ đề có art. Điều kiện: không trùng trong cùng level, không dính cặp dễ nhầm (`CONFUSE` trong tool), ưu tiên chủ đề ít dùng nhất để các level đa dạng.
  - Danh sách thay thế của từng level ghi ở trường `note` trong `levels_apk.js`.
- **Art lặp:** chủ đề cần nhiều tem hơn số art đang có thì lặp art. Luật chơi không đổi vì cùng chủ đề, nhưng trên bàn có thể thấy 2 tem giống hệt nhau.
- **Chương:** L21–30 Đồi Trà, L31–40 Vườn Táo, L41–50 Ga Tàu, L51–60 Đảo Xa (tên khu theo `concept-little-post-office.md` mục 3.1). Bản A và B dùng chung 40 level này.

## Đặc điểm và rủi ro

| Chỉ số | L21–L60 | So với L1–L20 |
|---|---|---|
| Số lá | 36–96 (trung bình khoảng 64) | 16–59 |
| Số chủ đề | 6–16 | 3–9 |
| Số khay | 3–5 | 3–5 |
| Moves | 82–224 | 64–110 |

- **Ván dài:** level 90+ lá mất khoảng 8–12 phút với người chơi phổ thông `[GIẢ THUYẾT]`. Như vậy trái mục tiêu ≤ 5 phút cho người lớn tuổi (review game design v2).
- **Nhiều chủ đề (tới 16), nhiều tem lặp art:** tải nhận thức cao hơn hẳn chương 1–2.
- **Không có mốc khó hay Overtime:** level thường vẫn có thể hết nước, dù moves đã nới.
- **Chương 3–6 chưa có decor riêng:** nút Trang trí báo "sắp có". Chưa có tem mới hay câu giới thiệu chương.
- **Bản quyền:** bố cục là thiết kế level của ABI. Chỉ dùng cho prototype nội bộ và playtest. Trước khi phát hành phải thay bằng level tự sinh.

## Màn hình chính

- Thanh chương dưới lưới level: `‹  Chương N · Tên khu  ›`. Mũi tên phải có ổ khoá khi chương sau chưa mở.
  - Chương 2 còn khoá: mở teaser Bến Cảng.
  - Chương 3–6 còn khoá: báo "Qua Level X để mở chương này" kèm nút chơi tiếp.
- Thưởng hết chương (+200 xu) áp dụng cho mọi chương. Hết L60 báo thị trấn sẽ còn mở thêm.
