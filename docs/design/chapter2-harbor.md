# Chương 2: Bến Cảng (L11–L20)

**Ngày:** 2026-10-10. **Nguồn thiết kế:** `concept-little-post-office.md` mục 3.1 (khu Bến Cảng, mùa hè; cư dân Bo, Lina; tem tàu thuyền, hải sản, vỏ ốc, hải đăng; decor phao, cửa sổ tròn, quạt trần).
**Code:** DESIGN L11–L20 trong `tools/gen_proto_levels.mjs`, `CHAPTERS` trong `prototype/stamp/src/main.js`.

## 1. Nội dung mới

| Thành phần | Chi tiết |
|---|---|
| 4 bộ tem mới (mỗi bộ 7 tem) | **Sailboats** (thuyền buồm), **Seafood** (hải sản), **Shells** (vỏ ốc), **Nautical** (đồ hàng hải: hải đăng, neo, bánh lái, la bàn, ống nhòm, thư trong chai, chuông tàu). "Hải đăng" trong concept được mở rộng thành Nautical, vì 7 tem cùng là hải đăng thì quá đơn điệu |
| Cư dân | Sailboats, Seafood, Nautical gửi cho **thuyền trưởng Bo** (thêm 3 câu nhắn). Shells gửi cho **Lina** |
| Decor chương 2 | Quạt trần 2, cửa sổ tròn 3, phao cứu sinh 4, đèn bão 4, hải đồ 5, thuyền ngủ của Pip 6 (tổng 24 Tem Điểm, dùng chung 6 chỗ đặt với chương 1) |
| Art | Vẽ qua ChatGPT cùng style tem, lưới `research/art-redo/gen/lpo_ch2_s1..s4.png`. Icon lá vương miện tự sinh bằng `tools/icon_line.py` |

## 2. Cặp dễ nhầm (không bao giờ chung một level)

Generator kiểm tra danh sách `CONFUSE` và báo lỗi nếu vi phạm.

| Cặp | Vì sao (so ảnh art) |
|---|---|
| Sailboats – Ship | Ship có thuyền buồm, thuyền gỗ |
| Nautical – Ship | Cùng chủ đề tàu |
| Shells – Sea life | Sea life có vỏ sò ngọc trai |
| Seafood – Sea life / Grilled / Sushi / Sashimi | Bạch tuộc, cá nướng, tôm |
| Nautical – Time | La bàn trông giống đồng hồ quả quýt |
| Ball – Float, Soda – Soft drink, Coffee – Tea | Bóng bãi biển, lon/chai, cốc |

## 3. Đường cong độ khó

Không có video gốc, nên moves chọn theo **target** (tỉ lệ thắng của người chơi phổ thông, không nhìn trộm). Sàn moves là solver × `slack`. Chương 2 chặt hơn chương 1 (slack 1.08–1.15 so với khoảng 1.2).

| Level | Vai trò | A: chủ đề / lá | A: moves (solver) | Giỏi thắng | Phổ thông thắng | Người mới thắng (+5 moves) | B: chủ đề / lá | B: moves (solver) | B: phổ thông thắng (mô phỏng) |
|---|---|---|---|---|---|---|---|---|---|
| 11 | normal | 7 / 38 | 67 (58) | 100% | 93% | 83% (100%) | 6 / 34 | 58 (50) | 98% |
| 12 | normal | 7 / 40 | 74 (62) | 100% | 97% | 40% (87%) | 6 / 35 | 62 (52) | 98% |
| 13 | normal | 7 / 41 | 74 (65) | 100% | 90% | 53% (77%) | 6 / 36 | 63 (55) | 97% |
| 14 | bump | 8 / 48 | 91 (80) | 93% | 80% | 63% (93%) | 6 / 39 | 70 (61) | 97% |
| 15 | hard | 8 / 53 | 93 (89) | 93% | 27% | 3% (43%) | 6 / 42 | 71 (68) | 35% |
| 16 | breather | 7 / 40 | 84 (64) | 100% | 100% | 100% (100%) | 6 / 36 | 73 (55) | 100% |
| 17 | normal | 7 / 44 | 79 (70) | 100% | 100% | 50% (83%) | 6 / 39 | 67 (59) | 80% |
| 18 | normal | 7 / 46 | 84 (75) | 100% | 77% | 47% (77%) | 6 / 41 | 73 (65) | 95% |
| 19 | bump | 8 / 50 | 93 (83) | 100% | 90% | 53% (87%) | 6 / 41 | 72 (64) | 92% |
| 20 | superhard | 9 / 59 | 101 (96) | 87% | 13% | 0% (23%) | 6 / 41 | 64 (58) | 32% |

Nguồn số liệu:
- Bản A: `tools/difficulty_report.mjs --runs=30` (30 ván mỗi mức, người chơi không nhìn trộm).
- Bản B: `levels-report_b.json` (số "winSim" của generator).

Nhận xét:
- **Level thường:** phổ thông thắng 77–100%, không kẹt. Người mới (phí 25%) thắng 40–83%, thấp hơn chương 1 (73–100%). Đây là bước tăng độ khó có chủ ý; +5 moves (Ca tối) đưa lên 77–100%.
- **L12 người mới chỉ 40%**, trong khi đây là level giới thiệu Seafood và Nautical. Nếu playtest thấy người chơi rơi ở L12 thì nới slack L12 lên 1.18–1.2 `[GIẢ THUYẾT]`.
- **L15 (mốc khó) và L20 (siêu khó):** phổ thông thắng 27% và 13%, phần còn lại vào Overtime, không thể thua. **Người chơi giỏi thắng 87–93%**, cao hơn hẳn L5 (37%), vì generator chưa áp `skilledTarget` cho level không có moves theo video. Như vậy mốc khó ở chương 2 chỉ "khó" với người chơi phổ thông.
- **Bản B:** L20 ban đầu có 5 khay cho 6 chủ đề nên quá dễ (phổ thông 67%). Đã giảm còn 4 khay, xuống 32%.
- **Thời gian một ván** ở mức phổ thông: 3.4–5.6 phút, dài hơn chương 1 vì mỗi level có 38–59 lá.

## 4. Màn hình chính chia theo chương

- Lưới chỉ hiện 10 level của chương đang xem. Mặc định là chương chứa level đang chơi.
- Ô dưới lưới dùng để chuyển chương: "Chương 2 · Bến Cảng →" (có khoá và mở teaser nếu chưa mở), hoặc "← Chương 1 · Phố Chính".
- Decor hiện theo chương đang xem. Tem Điểm là một quỹ chung cho cả hai chương.
- Hết L10: popup "Xong chương 1!" (+200 xu), nút "Chương 2 →" mở màn giới thiệu Bến Cảng (dấu "ĐÃ MỞ", nút chơi L11).
- Hết L20: popup "Xong chương 2!" (+200 xu), báo Đồi Trà sắp mở. Nút Play đổi thành "Sắp có level mới".
- Save của bản 10 level (dừng ở `unlocked = 10` dù đã thắng L10) được tự nâng lên L11.
