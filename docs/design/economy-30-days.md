# Economy và nhịp 30 ngày: mô phỏng L12 + R19

**Ngày:** 2026-10-15 · **Tác giả:** game-designer agent · **Trạng thái:** đã áp phần số nằm trong `prototype/stamp/assets/liveops.json` (mục 5.1, theo phép của điều phối). Phần cần sửa code (mục 5.2) chưa áp.
**Công cụ:** `tools/liveops_sim.mjs` (test: `tools/tests/liveops_sim.test.mjs`, 13/13 pass). **Đầu vào:** `liveops-30-days.md` (mục 5, 8, 10), `30-day-plan.md` (R19 (a)–(d)), code ở working tree hiện tại (đã gồm L11, L13, R11 của Feature Dev).

**Nhãn nguồn:** `[SIM]` = kết quả `liveops_sim` (200 replica mỗi persona, tất định) · `[CODE]` = hằng số trong `prototype/stamp/src/*.js` hoặc `assets/liveops.json` · `[DOC]` = tài liệu trong repo · `[GIẢ THUYẾT]` = giả định hành vi, cần playtest để đo.

---

## 0. Tóm tắt

| | Trước (code + `liveops.json` gốc) | Bộ số đề xuất |
|---|---|---|
| DoD mục 10 + R19 (20 tiêu chí, D1 là Thứ Hai) | **14/20 đạt** (sau khi đã sửa `liveops.json`, chưa sửa code: 16/20) | **20/20 đạt** |
| Xu dư D30, người lớn tuổi đều đặn (trung vị) | **7.400** (mục tiêu 800–2.500) | **2.310** (không quảng cáo: 1.770) |
| Decor đủ 6 món lúc hết chương 1–2 | 67% / 56% replica | 100% / 100% |
| Booster miễn phí | 1 mỗi 2,35 level, kho D30 là 13 | 1 mỗi 2,69 level, kho D30 là 9 |
| Tuyến đưa thư, persona 5/7 ngày (P25) | 12/20 trạm | 23/24 trạm |
| D1–D7 có ≥ 2 lý do quay lại | trượt ở D1 (người chơi mới ở L5–L6) | đạt |
| Khoảnh khắc lớn cách nhau ≤ 4 ngày | trượt (khoảng trống 6 ngày) | đạt (90% replica; sát ngưỡng, xem 5.4) |

Ba phát hiện chính:
1. **Xu dư gấp 3 lần mục tiêu.** Người lớn tuổi hầu như không thua (validator chỉnh level hào phóng, thêm +5 nước bằng quảng cáo, Thử lại nhẹ tay). Chỗ tiêu xu chỉ khoảng 1.100 xu/30 ngày, trong khi thu vào khoảng 8.000. R11 bỏ mức 1 Tem Điểm nên xu thắng còn tăng thêm (30–40 xu/level). `[SIM]`
2. **Lịch event chưa hợp với người chơi 5/7 ngày.** Tuyến đưa thư mở ở L12, người lớn tuổi chỉ tới L12 vào D2–D4, nên người bỏ Thứ Tư và Thứ Sáu chỉ còn 3 ngày chơi trong cửa sổ. `[SIM]`
3. **Decor trôi dần về đầu chương.** Với R11, o35 kiếm khoảng 48 Tem Điểm mỗi chương ch3+, giá 40. Phần dư dồn lại, nên tới ch6 món decor thứ 6 đã mua xong khi mới chơi 35% chương, tới ch9 là 0%: decor hết là mục tiêu của chương. `[SIM]`

---

## 1. Công cụ

### 1.1 Cách chạy

```
node tools/liveops_sim.mjs                      # số hiện tại, 30 ngày, in tổng hợp + DoD
node tools/liveops_sim.mjs --proposal --md      # bộ số đề xuất + bảng theo ngày như liveops-30-days.md mục 5.2
node tools/liveops_sim.mjs --days=56            # soi chu kỳ event thứ 2
node tools/liveops_sim.mjs --no-ads --start=2026-11-05 --set=game.winPerStar=5,live.MAILBAG.need=15
node tools/liveops_sim.mjs --proposal --emit-json=tools/data/liveops.proposal.json   # liveops.json đề xuất
node tools/liveops_sim.mjs --refresh-stats      # đo lại tỉ lệ thắng sau khi Level Dev sinh thêm level (khoảng 70 giây)
```

Mặc định chạy khoảng 3–5 giây. Thoát mã 1 nếu còn tiêu chí DoD chưa đạt.

### 1.2 Mô phỏng gì, lấy số từ đâu

| Phần | Nguồn |
|---|---|
| Lịch, event, quà | **Gọi thẳng code game** (module thuần): `liveops.js` (`touch`, `liveState`, `weeklyCard`, `morningDue`, `welcomeDue`...), `events.js` (`currentEvent`, `syncEvents`, `claim`, `routeStep`, `seasonCollect`, `mailbagWin`, `pickErrands`, `errandBump`, `gentleOn`), `chapters.js`. Số "hiện tại" đọc từ `assets/liveops.json` qua chính `config.js applyConfig` `[CODE]` |
| Hằng số chỉ có trong `main.js` | Chép lại trong `GAME_DEFAULT` có ghi nguồn: xu khởi đầu 500, thắng `10 + 10 × Tem Điểm`, hết chương +200, giá (Gợi ý 150, Nam châm 250, Con dấu 250, Tem Vàng 500, Ô phụ 400, +5 nước 300, Undo 30), quà mở booster (3/2/2/2), x2 quảng cáo từ L11 `[CODE]` |
| Tem Điểm | Luật R11 (`points.js`): thắng trong số nước được 3 hoặc 2, Ca tối level khó được 2, không còn 1 điểm `[CODE]` |
| Tỉ lệ thắng, phân bố Tem Điểm, phút mỗi lượt | `tools/data/liveops-level-stats.json`: người chơi mô phỏng của validator (`solver.js sampleHidden`, profile `o35` và `c10`) chạy 100 ván trên **level thật** L1–L104 (`levels.js`, `levels_gen.js`). L105–L240 chưa sinh: lấy trung bình cùng vị trí trong chương ở ch4–ch6 `[SIM]` |
| Thư hôm nay | Trung bình các level nghỉ (pool tạm của `daily.js` là level nghỉ/thường 30–46 lá) `[SIM]` |

### 1.3 Persona và hành vi `[GIẢ THUYẾT]`

| Persona | Profile | Phút/ngày (D1 / D2–7 / D8+) | Lịch |
|---|---|---|---|
| Lớn tuổi đều đặn | `o35`, 4,5 giây/nước | 40 / 30 / 22 | Mỗi ngày |
| Lớn tuổi 5/7 | `o35` | như trên | Bỏ Thứ Tư, Thứ Sáu (ngày cài app luôn chơi) |
| Người nhanh | `c10`, 3,2 giây/nước | 90 / 40 / 30 | Mỗi ngày |
| Nghỉ rồi quay lại | `o35` | như trên | Vắng D10–D13 (4 ngày), D35–D41 (7 ngày) |

Hành vi khi chơi (lớn tuổi / nhanh): xem quảng cáo +5 nước khi hết nước 50% / 30%; mua +5 bằng xu 60% (theo `liveops-30-days.md` 8.1) / 80%; dùng booster có sẵn ở lượt chơi lại hoặc level chật 50% / 30%; mua booster bằng xu khi kho trống và đang chơi lại 25% / 20%; xem quảng cáo x2 ở màn thắng 10% / 5%; ngoài ván 0,4 / 0,3 phút mỗi lượt. Booster cứu 35–60% phần thua (Gợi ý 35%, Nam châm, Con dấu 50%, Tem Vàng 60%). Mỗi level tutorial dùng 1 booster quà.

### 1.4 Giới hạn

- Hành vi tiêu xu là phần không chắc nhất. Người chơi thật có thể bấm Gợi ý nhiều hơn. Vì vậy có chạy độ nhạy không quảng cáo (mục 5.2).
- Phút mỗi nước là giả thuyết của validator (4,5 giây cho `o35`).
- Một nửa chiến dịch (L105–L240) là ngoại suy. Chạy lại `--refresh-stats` khi Level Dev sinh xong.
- D1 là Thứ Hai như doc. Các ngày bắt đầu khác: mục 5.4.

---

## 2. Kết quả với số hiện tại `[SIM]`

| Chỉ số D30 | Lớn tuổi đều đặn | Lớn tuổi 5/7 | Người nhanh | Nghỉ rồi quay lại |
|---|---|---|---|---|
| Level (P10 / P50 / P90) | 89 / 91 / 94 | 66 / 69 / 70 | 219 / 220 / 220 | 78 / 80 / 83 |
| Thắng chiến dịch / Thư hôm nay / thua | 91 / 30 / 3 | 68 / 22 / 2 | 220 / 30 / 0 | 81 / 26 / 3 |
| Xu dư (P10 / P50 / P90) | 6.670 / **7.400** / 8.090 | 5.410 / 6.150 / 6.630 | 16.170 / 16.540 / 16.800 | 5.820 / 6.650 / 7.240 |
| Xu vào | 7.980 (thắng 3.930, Thư hôm nay 1.200, hết chương 1.000, quà sáng 580, Thẻ tuần 400, x2 quảng cáo 350, event 370, Sổ dấu 150) | 6.400 | 16.260 | 7.070 |
| Xu ra | 1.100 (+5 nước 870, Undo 230) | 820 | 250 | 1.000 |
| Booster miễn phí / kho D30 | 38,9 (1 mỗi 2,35 level) / 13 | 33,3 / 15 | 51 / 47 | 36,6 / 15 |
| Decor đủ lúc hết chương | ch1 67%, ch2 56%, ch3–5 100% | ch1 62%, ch2 46% | 100% | ch1 65%, ch2 53% |
| Món decor thứ 6 mua lúc đã chơi | ch1–2 100%, ch3 85%, ch4 65%, ch5 50% | | | |
| D56: xu dư / decor thứ 6 | 13.030 / ch6 35%, ch8 5%, ch9 0% | | | |

**DoD trượt (6/20):**

| Tiêu chí | Kết quả | Nguyên nhân |
|---|---|---|
| D1–D7 ≥ 2 lý do | 514 ngày-replica thiếu, đều là D1 | Hết D1 người lớn tuổi mới ở L5–L6. Tuyến đưa thư cần L12 nên không thành lý do "event mới bắt đầu"; Thẻ tuần còn thiếu 4 ô |
| Khoảnh khắc lớn ≤ 4 ngày | 100% replica có khoảng 5–6 ngày | Các khoảng D6→D11, D12→D17, D19→D25 trống: xong tuyến D6–7, bộ tem mùa 3 D17, hộp việc vặt D25 (việc "3 level đạt 3 Tem Điểm" chậm, o35 chỉ 35% level đạt 3) |
| 5/7: Tuyến ≥ 15/20 | 12 trạm (P25) | Đạt L12 ở D4, còn 3 ngày chơi trong cửa sổ cd 2–7 |
| (b) Xu dư 800–2.500 | 7.400 | Mục 0, phát hiện 1 |
| (c), (e) Decor đủ mỗi chương | ch1–2 chỉ 46–67% | Giá ch1–2 là 24 = 100% số Tem Điểm o35 kiếm được (23,9). Plan câu 3 đặt 90% |
| Booster không thừa | 1 mỗi 2,35 level, kho 13 | Túi thư 12 lần thắng (cả Thư hôm nay) ra 8 booster/30 ngày, thêm Thẻ tuần 8, event 10 |

---

## 3. Đề xuất: bảng trước / sau và lý do

### 3.1 Xu (chỗ vào)

| Tham số | Trước | Sau | Lý do |
|---|---|---|---|
| Xu khởi đầu | 500 | **300** | Cắt không thấy được (người chơi không biết "lẽ ra"). Tuần 1 vẫn còn 290–650 xu, đủ 1 lần +5 nước. Phương án tương đương nếu muốn giữ 500: hết chương còn 60 xu (sim: D30 2.320) |
| Xu thắng level | 10 + 10 × Tem Điểm (30 / 40 sau R11) | **10** | Tem Điểm đã là phần thưởng của sao (decor). Xu theo sao là thưởng hai lần cho cùng một việc. "Thắng là 10 xu" dễ hiểu hơn cho người lớn tuổi. Đây là nguồn lớn nhất (khoảng 50% thu) |
| Cuối tuần xu đôi | x2 xu thắng | **Giữ x2** | Xu thắng đã nhỏ, x2 = 20 xu vẫn thấy rõ ở màn thắng. Phương án "x2 phần gốc" của doc 8.2 thành vô nghĩa khi không còn phần theo sao |
| Hết chương | +200 | **+100** | Khoảnh khắc chính là khu mới và bưu thiếp, xu là phụ |
| Thư hôm nay / chơi bù | 40 / 20 | **15 / 10** | Phần thưởng thật của Thư hôm nay là dấu ngày, Thẻ tuần, tem mùa |
| Sổ dấu ngày đầy trang | 150 xu, trang 20 dấu | **50 xu, trang 10 dấu** | Xem 3.4 (nhịp khoảnh khắc). 3 trang/30 ngày × 50 = cùng tổng xu như 1 trang × 150 |
| Thư buổi sáng | 20 xu | **10 xu** | Lời chào, không phải nguồn thu. Gợi ý ở lần nhận thứ 7 giữ nguyên |
| Hộp Thẻ tuần | 100 xu + Gợi ý + Nam châm | **50 xu** + Gợi ý + Nam châm | Giữ 2 booster để hộp vẫn là khoảnh khắc lớn |
| Tuyến: trạm đầu / chuyến thêm | 50 / 30 xu | **20 / 10 xu** | Tuyến trả booster là chính (nguyên tắc doc mục 8) |
| Tem mùa: bộ 1 / thêm 8 tem | 50 / 30 xu | **20 / 10 xu** | Như trên |
| Việc vặt mỗi việc | 30–50 xu | **20 xu** | Như trên |

### 3.2 Tem Điểm và decor

| Tham số | Trước | Sau | Lý do |
|---|---|---|---|
| Giá decor ch1–2 | 2/3/4/4/5/6 (24) | **2/3/3/4/4/5 (21)** | = 90% Tem Điểm o35 kiếm ở ch1–2 theo R11 (23,6–23,9) `[SIM]`, đúng luật 90% của plan câu 3. Sau: 100% replica mua đủ khi hết chương, món thứ 6 mua ở 80–90% chương |
| Giá decor ch3+ | 4/5/6/7/8/10 (40) | **5/6/7/8/10/11 (47)** | o35 kiếm 46,5–48,5 mỗi chương. Giá 40 làm phần dư dồn lại và decor trôi về đầu chương (ch9: mua xong trước khi chơi level đầu). Giá 47 (khoảng 97–101%) dựa vào phần dư nhỏ của ch1–2: món thứ 6 mua ở **85% chương, ổn định tới ch9**, vẫn 94–100% replica mua đủ khi hết chương (thử 46: trôi về 70%; 48: ch9 chỉ 66% đủ) `[SIM]` |

Luật 90% của plan câu 3 được hiểu lại cho ch3+: đặt giá khoảng 100% vì có phần dư mang sang từ ch1–2. Nếu đặt 90% cho mọi chương thì decor hết là mục tiêu từ khoảng ch6.

### 3.3 Booster miễn phí

| Tham số | Trước | Sau | Lý do |
|---|---|---|---|
| Túi thư của Pip | 12 lần thắng | **18** | Nguồn lớn nhất và tăng theo tốc độ chơi (người nhanh 19 booster/30 ngày). 18 cho người lớn tuổi khoảng 1 túi mỗi 4–5 ngày |
| Tem mùa bộ 2 | Gợi ý + Nam châm | **Gợi ý** | Bớt 1 |
| Hộp việc vặt | Gợi ý + Nam châm + Con dấu | **Gợi ý + Nam châm** | Bớt 1 |

Kết quả: 34 booster miễn phí/30 ngày (1 mỗi 2,69 level), kho D30 là 9, người lớn tuổi đã dùng khoảng 21. Quà mở booster (9, PO đã chốt Tem Vàng 2) không đổi.

### 3.4 Lịch event và cơ chế (vì DoD lý do quay lại, khoảnh khắc lớn, 5/7)

| Tham số | Trước | Sau | Lý do |
|---|---|---|---|
| Tuyến đưa thư mở | L12 | **L5** | Hết D1 người lớn tuổi ở L5–L6 `[SIM]` (doc dự đoán L9). Mở L5 thì D1 luôn có lý do thứ 2 "tuyến mới bắt đầu ngày mai". Popup Tuyến chỉ hiện từ D2 (theo lịch) nên không trùng popup Thư hôm nay ở L5. Người chơi chậm đạt L5 trong cửa sổ: hàng đợi popup đẩy Tuyến sang lần mở sau (quy tắc 2 mục 2) |
| Cửa sổ Tuyến / Tem mùa | cd 2–7 / 8–21 (chu kỳ sau Tuyến từ cd 1) | **cd 2–8 / 9–21** | Người 5/7 có thêm 1 ngày Tuyến (cửa sổ 7 ngày ở chu kỳ 1, 8 ngày từ chu kỳ 2). Tem mùa còn 13 ngày, vẫn đủ |
| Số trạm Tuyến | 20, mốc 5/10/15/20 | **24, mốc 6/12/18/24** | Người đều đặn xong tuyến D6–D7 (trước là D5–D6), lấp khoảng trống D6→D11. Người 5/7 đạt 3/4 mốc (23 trạm) |
| Chuyến thêm | 5 trạm, tối đa 3 | **6 trạm, tối đa 10**, 10 xu | Người nhanh xong 35 trạm ở D5 rồi không còn lý do quay lại D5–D7. Tối đa 10 thì thực tế không hết trong cửa sổ, tổng tối đa 100 xu |
| Tem mùa mở | L20 | **L16** | 5/7 ở D8 có thể ở L19, ngày mai Tem mùa bắt đầu mà chưa đủ level thì mất lý do quay lại. L16 trống (L15 Túi thư, L20 hết chương 2) |
| Tem mùa trên lá | 1/2 số level chiến dịch (`hash % 2`) | **Mọi level** (Thư hôm nay vẫn 1) | Bộ 3 (decor hiếm) về sớm hơn, D15 thay vì D17, lấp khoảng D12→D17. Luật đơn giản hơn: "ván nào cũng có 1 tem mùa". Bộ vẫn 8/16/24, không đổi album |
| Sổ dấu ngày | trang 20 dấu | **trang 10 dấu** | Người đều đặn có món kỷ niệm ở D10, D20, D30, lấp D6→D11 và D19→D25. Cần 3 món kỷ niệm mỗi 30 ngày thay vì 1,5 (art) |
| Việc vặt: thắng level | 8 | **6** (giữ id `win8` để thứ tự rút không đổi) | Hộp việc vặt về D24 thay vì D25–D27 |
| Việc vặt: Thư hôm nay | 4 ngày | **3 ngày** (giữ id `daily4`) | Như trên |
| Việc vặt "3 level đạt 3 Tem Điểm" | `stars3` | **"Kiếm 8 Tem Điểm"** (`pts8`, `on: 'points'`, đếm Tem Điểm ở màn thắng, kể cả chơi lại) | Việc này đòi chơi hoàn hảo, trái nguyên tắc E1 ("không áp lực phải chơi hoàn hảo"). o35 chỉ 35% level đạt 3 nên việc này giữ hộp tới D25–D28 |
| Việc vặt "đặt 1 món trang trí" | `decor1` | **Bỏ khỏi pool** | Bị chặn khi đã mua hết decor của khu hiện tại (người chơi không thể làm, không phải do mình) |
| Thẻ tuần tuần đầu | cần 5 dấu | **cần max(1, số ngày còn lại của tuần cài app − 2)** | Cài app Thứ Bảy thì tuần đầu chỉ có 2 ngày, thẻ 0/5 không bao giờ đầy. Vẫn cho bỏ 2 ngày như 5/7 |

Không đổi: giá booster, +5 nước, Ô phụ, Undo, quảng cáo (PO), quà Chào mừng quay lại, Thử lại nhẹ tay, E3 chỉ cuối tuần.

### 3.5 Định nghĩa lại tiêu chí (d) của R19

(d) "trung bình đủ xu cho 1 booster mỗi 3–4 level" viết trước khi có 6 nguồn booster miễn phí (F3, F4, F5, E1, E2, E4). Với hành vi đo được, (d) tính bằng xu và (b) không thể cùng đạt: xu dư D30 ≤ 2.500 nghĩa là thu tối đa khoảng 34 xu/level, tức 1 Gợi ý mỗi 4,4 level, trong khi người lớn tuổi chỉ tiêu khoảng 1.100 xu/tháng. Mình chọn giữ (b) (chống tích trữ) và đo (d) theo ý định "có 1 booster dùng được mỗi ≤ 4 level" = booster miễn phí + xu tự do quy ra Gợi ý. Sau đề xuất: 1 booster mỗi 1,9 level. Chỉ tính xu: 1 Gợi ý mỗi 6,1 level. Công cụ in cả hai con số.

---

## 4. Kết quả sau đề xuất `[SIM]`

### 4.1 Tổng hợp D30

| Chỉ số D30 | Lớn tuổi đều đặn | Lớn tuổi 5/7 | Người nhanh | Nghỉ rồi quay lại |
|---|---|---|---|---|
| Level (P10 / P50 / P90) | 89 / 91 / 94 | 66 / 69 / 70 | 219 / 220 / 220 | 79 / 80 / 83 |
| Xu dư (P10 / P50 / P90) | 1.620 / **2.310** / 2.890 | 1.370 / 1.980 / 2.430 | 5.190 / 5.490 / 5.630 | 1.490 / 2.090 / 2.570 |
| Xu vào | 3.040 (thắng 1.160, hết chương 500, Thư hôm nay 450, quà sáng 290, Thẻ tuần 200, Sổ dấu 150, event 190, x2 quảng cáo 105) | 2.410 | 5.410 | 2.660 |
| Xu ra | 1.060 (+5 nước 830, Undo 230) | 750 | 250 | 900 |
| Booster miễn phí / kho D30 | 34 (1 mỗi 2,69 level) / 9 | 31,3 / 12 | 43 / 39 | 32,5 / 11 |
| Decor đủ khi hết chương | ch1–5: 99–100% | ch1–4: 100% | 100% | 100% |
| Món decor thứ 6 mua lúc đã chơi | ch1 90%, ch2 80%, ch3–5 85% | | | |
| Event chu kỳ 1 (P25) | Tuyến 24/24, Tem mùa 24/24, Việc vặt 5/5 | 23/24, 24/24, 5/5 | đủ | 24/24, 24/24, 5/5 |

### 4.2 DoD mục 10 + R19 (D1 = Thứ Hai)

| # | Tiêu chí | Trước | Sau |
|---|---|---|---|
| 1 | Lớn tuổi đều đặn D30 ở L75–L120 | L91 ĐẠT | L91 ĐẠT |
| 2 | Người nhanh D30 còn ≥ 20 level (240) | còn 20 ở P90, ĐẠT (sát) | như trước |
| 3 | Không hết Daily (pool 90) | ĐẠT nếu có pool 90 (đang là pool tạm) | như trước |
| 4 | Mỗi ngày ≥ 1 lý do quay lại | ĐẠT | ĐẠT |
| 5 | D1–D7 ≥ 2 lý do | **CHƯA** (D1) | ĐẠT |
| 6 | Khoảnh khắc lớn ≤ 4 ngày | **CHƯA** (100% replica có khoảng 5–6 ngày) | ĐẠT (90% replica; khoảng lớn nhất 5) |
| 7 | 5/7: hộp Thẻ tuần mọi tuần | 4/4 ĐẠT | 4/4 ĐẠT |
| 8 | 5/7: Tuyến ≥ 3/4 mốc | **CHƯA** (12/20) | ĐẠT (23/24) |
| 9 | 5/7: Tem mùa ≥ 2/3 bộ | 23 ĐẠT | 24 ĐẠT |
| 10 | 5/7: Việc vặt ≥ 4/5 | 5 ĐẠT | 5 ĐẠT |
| 11 | Nghỉ D10–D13: Tem mùa ≥ 2/3, F6 đúng 1 lần mỗi lần vắng | ĐẠT | ĐẠT (F6 ở D14, D42) |
| 12 | ≤ 5 điểm chạm, ≤ 1 event lớn | ĐẠT | ĐẠT |
| 13 | Không meta trước L5 | ĐẠT | ĐẠT |
| 14 | Không level nào có 2 thứ mới cùng phiên | ĐẠT | ĐẠT |
| 15 | (a) Thiếu xu Gợi ý không quá 5 level liền | ĐẠT (0) | ĐẠT (0; không quảng cáo: P90 3) |
| 16 | (b) Xu dư D30 800–2.500 | **CHƯA** (7.400) | ĐẠT (2.310) |
| 17 | (c) Đủ 6 decor khi hết chương (≥ 80%) | **CHƯA** (ch1 67%, ch2 56%) | ĐẠT (99–100%) |
| 18 | (d) 1 booster dùng được mỗi ≤ 4 level (3.5) | ĐẠT | ĐẠT (1,9) |
| 19 | (e) 5/7 cũng đạt (a), (c) | **CHƯA** | ĐẠT |
| 20 | Booster miễn phí 1 mỗi 2,5–3,5 level, kho ≤ 10 | **CHƯA** (2,35; 13) | ĐẠT (2,69; 9) |

### 4.3 Độ nhạy

| Kịch bản | Xu dư D30 lớn tuổi (P10 / P50 / P90) | Ghi chú |
|---|---|---|
| Đề xuất, có quảng cáo | 1.620 / 2.310 / 2.890 | P90 trên 2.500 |
| Đề xuất, **không quảng cáo** | 840 / 1.770 / 2.490 | (a) P90 3 level thiếu xu, vẫn đạt. Mọi tiêu chí economy đạt |
| Số hiện tại, không quảng cáo | 6.190 (trung vị) | Vẫn gấp 2,5 lần trần |

### 4.4 Chu kỳ event thứ 2 (D56)

| | Số hiện tại | Đề xuất |
|---|---|---|
| Lớn tuổi D56: level / xu dư | L162 / 13.030 | L162 / **3.840** |
| Event chu kỳ 2 (đều đặn, P25) | Tuyến 20/20, Tem mùa 24/24, Việc vặt 5/5 | Tuyến 24/24, Tem mùa 24/24, Việc vặt 5/5 |
| 5/7, Tuyến chu kỳ 2 (P25) | 18/20 | 21/24 |
| Decor thứ 6 mua lúc (ch6 / ch9) | 35% / 0% | 85% / 85% |
| Người nhanh hết 240 level | khoảng D33 | khoảng D33 |

Sau D30 xu vẫn tăng khoảng 55 xu/ngày ở người lớn tuổi (D56: 3.840). R19 chỉ kiểm D30. Chỗ tiêu xu dài hạn là quyết định của PO (mục 8).

### 4.5 Ngày bắt đầu khác Thứ Hai

Hộp Thẻ tuần đổi ngày theo thứ, nên nhịp khoảnh khắc lớn thay đổi. Kết quả với bộ đề xuất (tỉ lệ replica có ít nhất 1 khoảng 5–6 ngày):

| D1 là | T2 | T3 | T4 | T5 | T6 | T7 | CN |
|---|---|---|---|---|---|---|---|
| Khoảng > 4 ngày | 10% | 29% | 29% | 30% | 7% | 15% | 16% |

Các tiêu chí khác đạt ở mọi ngày bắt đầu, trừ kho booster 11 (trần 10) khi D1 là T5, T6, CN vì có thêm hộp Thẻ tuần đầu. Khoảng trống còn lại rơi vào D11→D16 hoặc D25→D30. Đã thử: trang Sổ dấu ngày 7/8/9 ô, cửa sổ Tem mùa từ cd 10, 2 tem mùa ở Thư hôm nay, trần tem mùa mỗi ngày. Không phương án nào đạt ở cả 7 ngày bắt đầu (cửa sổ cd 10 cho T2 2% nhưng T3–T5 70%). Mình chọn phương án có trung bình thấp nhất (19%). Đây là rủi ro còn mở, đo bằng analytics (mục 9).

### 4.6 Bảng theo ngày, người lớn tuổi đều đặn, bộ đề xuất (replica trung vị)

Thay bảng 5.2 của `liveops-30-days.md` (bảng đó giả định L9 ở D1, L85 ở D30).

| Ngày | Thứ | Lv | Lv người nhanh | Xu / booster / Tem Điểm dư / decor | Khoảnh khắc | Event | Lý do quay lại |
|---|---|---|---|---|---|---|---|
| D1 | T2 | 6 | 22 | 345 / 4 / 2 / 4 | Thư hôm nay | — | Thư hôm nay, tuyến mới mai, decor (3) |
| D2 | T3 | 10 | 31 | 480 / 4 / 0 / 7 | hết chương 1 | Tuyến 5/24 | 4 |
| D3 | T4 | 13 | 40 | 555 / 1 / 2 / 9 | | Tuyến 9/24 | 4 |
| D4 | T5 | 16 | 49 | 290 / 1 / 0 / 11 | Túi thư, (Tem mùa mở ở L16) | Tuyến 13/24 | 3 |
| D5 | T6 | 20 | 58 | 475 / 4 / 0 / 13 | hộp Thẻ tuần, hết chương 2 | Tuyến 18/24 | 3 |
| D6 | T7 | 24 | 67 | 550 / 4 / 4 / 14 | | Tuyến 23/24 (x2) | 3 |
| D7 | CN | 28 | 76 | 655 / 5 / 6 / 15 | **xong tuyến** | Tuyến 24/24 (x2) | 4 |
| D8 | T2 | 31 | 82 | 730 / 6 / 4 / 16 | | Tuyến (chuyến thêm) | 2 |
| D9 | T3 | 34 | 89 | 785 / 6 / 1 / 17 | | Tem mùa 4/24 | 2 |
| D10 | T4 | 36 | 95 | 880 / 5 / 6 / 17 | **Sổ dấu ngày trang 1** | Tem mùa 7/24 | 3 |
| D12 | T6 | 42 | 108 | 830 / 9 / 3 / 19 | hộp Thẻ tuần, hết chương 3 | Tem mùa 15/24 | 4 |
| D15 | T2 | 50 | 127 | 1.055 / 10 / 1 / 22 | **bộ tem mùa 3 (decor hiếm)** | Tem mùa 24/24 | 2 |
| D19 | T6 | 60 | 151 | 1.425 / 11 / 0 / 25 | hộp Thẻ tuần, hết chương 4 | Tem mùa | 2 |
| D20 | T7 | 63 | 158 | 1.560 / 10 / 2 / 26 | Sổ dấu ngày trang 2 | Tem mùa (x2) | 1 |
| D24 | T4 | 75 | 183 | 1.830 / 11 / 3 / 29 | **hộp việc vặt** | Việc vặt 5/5 | 2 |
| D26 | T6 | 80 | 195 | 2.060 / 12 / 4 / 30 | hộp Thẻ tuần, hết chương 5 | Việc vặt | 4 |
| D29 | T2 | 89 | 214 | 2.215 / 11 / 0 / 34 | | Tuyến #2 4/24 | 2 |
| D30 | T3 | 91 | 220 | 2.310 / 11 / 4 / 34 | Sổ dấu ngày trang 3 | Tuyến #2 7/24 | 2 |

Bảng đủ 30 dòng: `node tools/liveops_sim.mjs --proposal --md`.

---

## 5. Thay đổi cho Feature Dev

Không sửa code game (`src/`). `tools/data/liveops.proposal.json` là bản đầy đủ (gồm `pts8` và `first_week`); chạy qua `applyConfig` hiện tại sẽ có 2 cảnh báo, đúng việc 1 và 7 ở 5.2.

### 5.1 Đổi số trong `assets/liveops.json` (ĐÃ ÁP)

Đã ghi vào `prototype/stamp/assets/liveops.json` (bản gốc giống mặc định trong code), `applyConfig` không cảnh báo. Pool việc vặt **tạm giữ** `stars3` và `decor1` (chỉ đổi xu 20, `win8` cần 6, `daily4` cần 3) vì `config.js` chưa nhận `on: 'points'`; đổi sang `pts8` và bỏ `decor1` khi làm việc 1 ở 5.2. Hệ quả: `node prototype/stamp/tests/config-notify.test.mjs` báo 1 FAIL "file khác mặc định" (8/9). **Feature Dev cập nhật mặc định trong `liveops.js`, `events.js`, `config.js CONF.daily` theo bảng dưới** để test khớp lại. `events.test.mjs` 11/11, `liveops.test.mjs` 19/19, `points.test.mjs` 4/4 vẫn pass (đọc mặc định trong code). Sim với `liveops.json` mới, chưa sửa code: 16/20 (còn trượt khoảnh khắc lớn, (b) 5.980 xu, (c), (e)).

| Khoá | Trước | Sau |
|---|---|---|
| `features.route`, `big_events[route].minLevel` | 12 | 5 |
| `features.season`, `big_events[season].minLevel` | 20 | 16 |
| `big_events[route].to` / `big_events[season].from` | 7 / 8 | 8 / 9 |
| `rewards.daily` | today 40, catchup 20, page 150, page_size 20 | 15, 10, 50, 10 |
| `rewards.weekly.coins` | 100 | 50 |
| `rewards.morning.coins` | 20 | 10 |
| `rewards.mailbag.need` | 12 | 18 |
| `rewards.route` | stations 20; mốc 5 (50 xu) / 10 / 15 / 20; trip len 5, coins 30, max 3 | stations 24; mốc 6 (20 xu) / 12 (Gợi ý) / 18 (Nam châm) / 24 (Tem Vàng + tem tuyến); trip len 6, coins 10, max 10 |
| `rewards.season.sets` | 8: Con dấu + 50 xu; 16: Gợi ý + Nam châm; 24: như cũ | 8: Con dấu + 20 xu; 16: Gợi ý; 24: như cũ (Tem Vàng, trang, decor hiếm) |
| `rewards.season.extra.coins` | 30 | 10 |
| `rewards.errands.box` | Gợi ý, Nam châm, Con dấu | Gợi ý, Nam châm |
| `rewards.errands.pool` | coins 30–50; win8 need 8; daily4 need 4; có stars3, decor1 | coins 20; win8 need 6; daily4 need 3 (**giữ id** để thứ tự rút theo `k` ổn định, chữ dùng `{n}`); stars3 thành `{ id: 'pts8', on: 'points', need: 8 }`; bỏ decor1 |

### 5.2 Cần sửa code

| # | Chỗ | Việc |
|---|---|---|
| 1 | `src/config.js ERRAND_ON`, `main.js onMeta` | Thêm `'points'`; `level_complete` gọi `evBump('points', d.stars)` (Tem Điểm của ván, kể cả chơi lại). **Không làm thì `applyConfig` bỏ cả pool mới và dùng pool cũ** (quyết định C-2). Chữ EN/VI `er_pts8` |
| 2 | `main.js` thưởng thắng (dòng `reward = (10 + st * 10) * mult`) | Thành 10 × mult. Nên đưa vào `liveops.json` (`rewards.win = { base: 10, per_point: 0 }`) |
| 3 | `main.js chapterReward` (+200, hai chỗ cả chữ `+200`) | +100, đưa vào `liveops.json` (`rewards.chapter`) |
| 4 | `main.js defaultSave` | coins 500 thành 300. Chỉ áp cho save mới |
| 5 | `src/chapters.js` | ch1–2: 2/3/3/4/4/5. `COST_CH3`: 5/6/7/8/10/11. Save cũ đã mua decor không bị trừ lại |
| 6 | `src/events.js seasonCardFor` | Bỏ điều kiện `hash(...) % 2 === 1` (mọi level chiến dịch có 1 lá tem mùa). Sửa AC test L8 (45–55%) thành 100% |
| 7 | `src/liveops.js weeklyCard` (+ `rewards.weekly.first_week`) | Tuần chứa `firstOpenDay`: `need = max(1, min(5, số ngày từ firstOpenDay tới Chủ nhật − 2))`. Huy hiệu hiện `n/need` |
| 8 | Test | `events.test.mjs`, `liveops.test.mjs`, `config-notify.test.mjs`: số trạm 24, tem mùa 100%, pool việc vặt mới, `liveops.json` = mặc định mới. Chạy lại `node tools/tests/liveops_sim.test.mjs` |
| 9 | Chữ | "20 trạm" thành theo `stations`; Sổ dấu ngày "20 ô" thành `page_size`; câu Thẻ tuần tuần đầu |

Sau khi áp: `node tools/liveops_sim.mjs` (không `--proposal`) phải ra 20/20, vì sim đọc `liveops.json` thật. Mục 2, 3 và 4 của bảng 5.2 nằm trong `main.js`, sim chép tay ở `GAME_DEFAULT`: cập nhật `GAME_DEFAULT` cùng lúc (hoặc đưa vào `liveops.json` như gợi ý thì sim tự đọc được sau khi thêm vào `config.js`).

### 5.3 Art

- Sổ dấu ngày 10 dấu/trang: 3 món kỷ niệm mỗi 30 ngày thay vì 1,5. Cần thêm 2–3 món kỷ niệm (ngoài `rare_postbox`) hoặc xoay vòng 3 món.

---

## 6. Việc cho Level Dev

| # | Việc | Bằng chứng |
|---|---|---|
| 1 | **Sinh đủ L105–L240 trước launch.** Người nhanh chạm L104 ở D12, người lớn tuổi đều đặn ở D35 | `[SIM]` |
| 2 | **FTUE: rút ngắn L2–L4.** `o35` mất 4,3 / 5,0 / 5,9 phút (validator), hết D1 (40 phút) người lớn tuổi chỉ tới L5–L6, doc giả định L9. Đề xuất L2–L4 ≤ 3 phút `o35` (khoảng 25–30 lá) | `validate-report.json` |
| 3 | **Pool Thư hôm nay 90** (đang là pool tạm 23 level, lặp sau khoảng 23 ngày) | `daily.js` |
| 4 | **240 level vừa đủ cho người nhanh:** D30 ở L220 (còn đúng 20 ở P90), hết chiến dịch khoảng D33. Nhịp +20 level/2 tuần không theo kịp người nhanh (khoảng 7 level/ngày). Đề xuất bản cập nhật đầu tiên trước D21, hoặc PO chốt 260 | `[SIM]` |
| 5 | Sau khi sinh thêm: `node tools/liveops_sim.mjs --refresh-stats` rồi chạy lại sim (phần L105+ đang là ngoại suy) | |

---

## 7. Quyết định của PO

1. **Người nhanh tích xu:** 5.490 xu ở D30, 8.790 ở D56 (sau đề xuất). Có cần chỗ tiêu xu cho nhóm này không (decor mua bằng xu, gói trang trí, tem sưu tầm đặc biệt).
2. **Xu dài hạn của người lớn tuổi:** vẫn tăng khoảng 55 xu/ngày sau D30. Có cần chỗ tiêu thứ hai ngoài +5 nước không.
3. **Giá booster** (không đổi trong đề xuất). Ghi chú: với giá Gợi ý 150, chỉ tính xu thì người lớn tuổi đủ 1 Gợi ý mỗi 6 level. Hạ Gợi ý xuống 100 làm tăng chỗ tiêu xu.
4. **x2 quảng cáo màn thắng và +5 quảng cáo:** đề xuất vẫn đạt khi không có quảng cáo (mục 4.3).
5. **240 hay 260 level ở launch** (Level Dev mục 4).

---

## 8. Rủi ro và câu hỏi mở

| # | Rủi ro | Cách đo / giảm |
|---|---|---|
| 1 | Hành vi tiêu xu thật khác giả định (đặc biệt Gợi ý) | Playtest 7 ngày: `coins_spend` theo loại, `booster_use`. Chỉnh `rewards.*` trong `liveops.json`, không sửa code |
| 2 | Nhịp khoảnh khắc lớn phụ thuộc thứ bắt đầu (mục 4.5) | Sự kiện analytics mới: số ngày giữa 2 khoảnh khắc lớn (`chapter_complete`, `weekly_box_open`, `route_complete`, `season_set_complete` bộ 3, `errand_box`, `stampbook_page_complete`) theo thứ cài app |
| 3 | Xu thắng 10 làm màn thắng kém "đã" | Giữ hiệu ứng xu bay. x2 cuối tuần và x2 quảng cáo vẫn cho số 20. Có thể đo `win_button` thời gian rời màn thắng trước/sau |
| 4 | Decor giá 47 khó hơn với người thua nhiều hơn `o35` | Sim 5/7 và không quảng cáo vẫn 99–100%. Theo dõi `points_left` lúc `chapter_complete` |
| 5 | Một nửa chiến dịch là ngoại suy | `--refresh-stats` sau mỗi đợt Level Dev |

**Câu hỏi mở:** người dùng có muốn nới tiêu chí "khoảnh khắc lớn ≤ 4 ngày" thành "≤ 5 ngày" hoặc thêm "bộ tem mùa 2 / trang album mùa" vào danh sách khoảnh khắc lớn? Với một trong hai cách, mọi ngày bắt đầu đều đạt.
