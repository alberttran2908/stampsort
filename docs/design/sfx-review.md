# SFX review và làm lại: Little Post Office

> **Bản hiện hành: v3, chill cho người lớn tuổi (mục 8).** Mục 2-7 ghi lại review bản đầu (v1) và lần làm lại thứ nhất (v2); các đề xuất main.js ở mục 6 đã được nối.

Ngày: 2026-10-10. Phạm vi: 33 SFX tự tổng hợp của `prototype/stamp/` cùng 8 âm mới đề xuất.
Nguồn: số liệu đo từ file (`ffmpeg` giải mã rồi phân tích bằng numpy/scipy), cách gọi lấy từ `prototype/stamp/src/main.js` và `audio.js` (snapshot ngày 2026-10-10), tần suất mỗi ván ước lượng từ `prototype/stamp/levels-report.json` (L4-L10: khoảng 43 lá, 7-8 bộ, 24 lá chồng bài, 70-80 nước). **Lưu ý:** agent không nghe được bằng tai. Mọi kết luận về "cảm giác" là **giả thuyết thiết kế**, cần người nghe xác nhận qua `http://localhost:8766/sfx-preview.html`.

## 1. Cách đo
- Loudness: **M-max LUFS** (BS.1770 K-weighting, cửa sổ 400 ms, bước 10 ms). Âm ngắn hơn 400 ms được đo trọn trong một cửa sổ, nên âm ngắn phải có đỉnh cao hơn để đạt cùng mức. Cách đo này gần với cảm nhận độ to của âm ngắn.
- "Trong game" = LUFS file + 20·log10(vol mà main.js truyền ở chỗ gọi chính), chưa tính master 0.8.
- True peak: lấy mẫu lên 4x. Lead: thời gian tới mẫu đầu tiên vượt -30 dB so với đỉnh, đo sau khi bỏ encoder delay của MP3 (Chrome có bỏ, đã kiểm tra trong trình duyệt bằng trang preview).
- Phổ: centroid, % năng lượng ở 2-5 kHz (vùng chói), % dưới 250 Hz (loa điện thoại gần như không phát được).

## 2. Review bản cũ (trước khi làm lại)

| âm | khi nào phát (main.js) | lần/ván | ms | LUFS file | trong game | lead ms | centroid Hz | 2-5k % | <250 % | vấn đề |
|---|---|---|---|---|---|---|---|---|---|---|
| pick | bắt đầu kéo (>12 px), vol 0.8 | 20-40 | 160 | -22.9 | -24.8 | 0.5 | 3155 | 16 | 0 | dài hơn mức cần, sáng |
| place | đặt lên cột, vol 0.55; cả Tem Điểm và màn Chương 2 | 10-20 | 300 | -25.9 | **-31.1** | 0.1 | 203 | 1 | **99** | gần như im trên loa điện thoại; một âm phải gánh 3 vai |
| draw | rút bài 0.7; chia bài 0.35 | 25-35 (+15) | 200 | -25.6 | -28.7 | 0 | **4788** | 55 | 0 | chói, xèo |
| flip | lá úp lật ngửa, vol 0.7 | 12-15 | 220 | -23.0 | -26.1 | 8.9 | **5737** | 40 | 0 | chói nhất bộ, 57% năng lượng >5 kHz |
| click | mọi nút UI | 5-15 | 70 | -23.7 | -23.7 | 0.2 | 1164 | 4 | 0 | đuôi bị cắt (-40 dB) |
| back | Undo | 0-5 | 160 | -21.8 | -21.8 | 6.1 | 2466 | 55 | 0 | không có transient rõ |
| close | 26 chỗ: đóng bảng, thiếu xu **và mọi lần từ chối** (0.5) | 2-10 | 300 | -21.7 | -21.7 | **13.8** | 1154 | 13 | 0 | trùng vai trò; 2 nốt đi xuống nghe "buồn"; đuôi cắt -31 dB |
| combo1-11 | tem vào ô (vol 0.9), combo reset khi đặt cột/rút bài | 20-30 | 450 | -18.8 → -16.2 | -19.7 → -17.1 | **8-10** | 626 → 2331 | 0-4 | 0 | trễ 10 ms ở âm nghe nhiều nhất; marimba mỏng, combo cao không giàu thêm |
| open | đặt tem vương miện; lật trúng 0.6 rate 1.25 | 10-13 | 900 | -19.9 | -19.9 | 0.1 | 495 | 2 | **55** | thân âm dưới 250 Hz mất trên điện thoại |
| complete | niêm sáp (cùng boom 0.35) | 7-8 | 1000 | -14.0 | -14.0 | 0.5 | 2083 | 46 | 0 | arpeggio trùng quãng với chuông trong boom nên nghe đục |
| boom | dưới complete 0.35; banner level khó 0.5 | 7-8 | 900 | -18.1 | -27.2 | 0.1 | 953 | 16 | 33 | có chuông C6-G6-C7, chồng lên complete |
| whoosh | lá thư gom (0.5, rate 1.3) và bay (0.8); recycle (1) | 14-16 | 450 | -22.0 | -28.0 | **32.8** | 2568 | 53 | 0 | im 33 ms đầu, lệch hình |
| sparkle | dọn sạch cột, 0.4 | 2-4 | 500 | -19.0 | -27.0 | 0.1 | 4156 | 83 | 0 | rất cao (E7-C8), chói |
| hint | gợi ý | 0-3 | 1100 | -15.1 | -15.1 | 0.2 | 1194 | 10 | 0 | to ngang âm thắng |
| joker | Tem Vàng, chọn booster | 0-2 | 500 | -15.6 | -15.6 | 0.4 | 1189 | 6 | 0 | sawtooth rè, không cozy |
| magnet | Tem Vàng bay vào, booster Pack | 0-2 | 1000 | **-10.9** | **-10.9** | 9.8 | 566 | 4 | 1 | to nhất bộ (to hơn cả win 2.7 dB), sine quét kiểu sci-fi |
| slot | mở ô phụ; đặt decor | 0-1 | 1100 | -15.6 | -15.6 | 0.2 | 1438 | 13 | 15 | B6 lệch ngũ cung; gánh luôn vai decor |
| coin | thư tới thanh tiến độ; tới 12 lần liên tiếp cuối ván | 8-20 | 350 | -18.2 | -24.2 | 0.1 | 2946 | 59 | 0 | B6 lệch ngũ cung; đuôi cắt -40 dB |
| coins | **không được gọi** | 0 | 1600 | -12.0 | -12.0 | 10.5 | 2956 | 55 | 0 | file thừa |
| claim | combo +5 (0.7), Tem Điểm (0.4), +moves (1) | 1-6 | 900 | -14.1 | -17.2 | 0.2 | 2761 | 54 | 0 | ổn |
| feature | tính năng mới, cứu trợ, Overtime, thưởng chương, bộ tem mới (0.5) | 0-2 | 1500 | -13.9 | -13.9 | 0.4 | 910 | 4 | 0 | một âm cho 5 sự kiện khác nhau |
| win | thắng | 1 | 2400 | -13.6 | -13.6 | 0.2 | 1071 | 5 | 0 | ổn, hơi mỏng |
| lose | hết moves | 0-1 | 1800 | -13.5 | -13.5 | 0.9 | 637 | 0 | 0 | to ngang win, có sawtooth rè, nghe như bị phạt |

## 3. Vấn đề chính
- Độ to lệch nhau: nhóm thao tác dao động từ -21.7 (close) tới -31.1 (place) trong game, chênh 9 dB. magnet (-10.9) to hơn win, lose to ngang win.
- Chuẩn hoá theo peak, không theo loudness: âm ngắn/âm noise nhỏ hơn hẳn âm tonal cùng nhóm.
- Âm thao tác quá sáng (draw, flip có centroid 4.8-5.7 kHz) và dài hơn 150 ms (pick 160, place 300, draw 200, flip 220, close 300), dễ mệt tai sau 30-40 lần mỗi ván.
- place/open/boom để 33-99% năng lượng dưới 250 Hz: trên loa điện thoại (nơi đa số người chơi nghe) gần như mất.
- Khoảng lặng đầu file: whoosh 33 ms, close 14 ms, combo 8-10 ms (đúng âm nghe nhiều nhất), magnet/coins 10 ms, flip 9 ms.
- Đuôi bị cắt khi còn to: close -31 dB, click/coin -40 dB, back -43 dB (dễ gây tiếng "tách").
- Lệch tông: B6 trong coin/slot/claim không thuộc C ngũ cung, chồng lên combo bị chỏi. Rate 1.2 của complete (stamper) tăng 3.16 semitone, cũng lệch tông.
- Trùng vai trò: close (đóng bảng và từ chối), place (đặt lá, Tem Điểm, Chương 2), feature (5 sự kiện), slot (ô phụ và decor), whoosh (lá thư bay và lật lại chồng bài).
- Thiếu âm: chạm lá úp (đang im), từ chối riêng, con dấu Tem Điểm, Overtime, đặt decor, xong chương, lật lại chồng bài, mở bảng.
- complete + boom: hai arpeggio chuông cùng quãng chồng lên nhau 7-8 lần mỗi ván.

## 4. Thiết kế mới (v2)

### Nguyên tắc
- Một thang âm: mọi âm có cao độ thuộc C ngũ cung (C D E G A), nên chồng nhau không chỏi.
- Bảng âm sắc theo theme: giấy (nhiễu lọc nhiều lớp, dải lọc trượt, hạt sột soạt), con dấu cao su/gỗ (modal synthesis có trượt cao độ, thân âm 300-1500 Hz), chuông quầy bưu điện (FM 1:3.5, chỉ số điều chế giảm dần), mộc cầm (tỉ lệ thanh gỗ 1 : 3.99 : 9.9) cho combo, hộp nhạc/kalimba, **kèn bưu điện nhỏ** (additive, vibrato trễ) làm "chữ ký" cho các mốc lớn.
- Thao tác lặp nhiều: 45-120 ms, khô (không reverb), khoét -2 đến -3 dB quanh 3.3 kHz, lọc thấp 24 dB/oct ở 6-7 kHz, highpass 90 Hz.
- Thưởng và mốc: reverb phòng gỗ nhỏ tổng hợp (IR nhiễu suy giảm, t60 0.5-1.1 s, mix 10-25%) cho ấm.
- Transient ở mẫu 0: bỏ mẫu lặng đầu file, fade-in 0.7 ms chống click. Đuôi cắt khi đường bao xuống dưới -60 dB rồi fade raised-cosine.
- Loudness theo bậc, đã bù sẵn vol trong main.js: file = mục tiêu trong game - 20·log10(vol), nên **không cần đổi vol** để cân bằng.
  - thao tác -25 (facedown -27) | UI -23/-24 | combo -20 → -18 | open -18.5 | complete -15.5 | thưởng nhỏ -17 → -19 | mốc lớn -14 → -16 | lose -18 (nhẹ hơn win 4 dB).
- Limiter true peak lookahead (-1.5 dBTP, chừa chỗ cho MP3), MP3 128 kbps mono có LAME/Xing header (Chrome bỏ encoder delay, đo được lead ≤0.7 ms).
- Tái tạo y hệt: seed ngẫu nhiên theo tên âm. Script ghi thêm `sfx/meta.json` (số đo) cho trang preview.

### Từng âm
- pick: nhiễu giấy có dải lọc trượt lên 1.3 → 2.8 kHz + hạt sột soạt + tick gỗ G5 rất nhỏ ("nhấc lên"). 90 ms.
- place: "pạch" giấy có thân gỗ A4 trượt cao độ + bộp nỉ. 96 ms, thân ở 400-1000 Hz nên loa điện thoại phát được.
- draw: búng lá (attack 1 ms, không gắt) + vệt trượt đi xuống + tap nhỏ. 115 ms.
- flip: "phựt" lật (dải lọc lên 1.2 → 3 kHz) + tiếng đặt C5. 117 ms.
- facedown (mới): "tụp" nỉ G4 rất nhỏ, báo "chưa được" mà không phải lỗi. 46 ms.
- recycle (mới): riffle 11 lần búng giấy nhanh dần trên nền gió nhẹ. 360 ms.
- click: "tok" gỗ G5 (tỉ lệ 1 : 2.57 : 4.9). 53 ms.
- back: hai tick C6 → G5 đi xuống + vệt giấy ngược ("tua lại"). 122 ms.
- close: gấp giấy đi xuống + tok C5, trung tính. 114 ms.
- deny (mới): "bụp bụp" gỗ bọc nỉ E4 → D4, bão hoà nhẹ để có hài cho loa nhỏ. Mềm, không phải buzzer. 154 ms.
- popup (mới, tuỳ chọn): giấy mở ra + tok E5 + chấm chuông C7 rất nhỏ. 269 ms.
- combo1-11: chạm giấy + mộc cầm theo ngũ cung C5 → C7; từ combo5 thêm quãng 5 phía trên, từ combo8 thêm lấp lánh quãng 8, reverb tăng nhẹ theo combo. -20 → -18 LUFS trong game.
- open: con dấu (thân 330 Hz) + chuông quầy G5 với D6 (quãng 5). 0.9 s.
- complete: niêm sáp D4 nặng, mềm + chuông quầy C6 + arpeggio glockenspiel C6-E6-G6-C7 + làn gió mỏng. 1.07 s.
- boom: "phụp" nỉ (thud C4 có quãng 5, nhiễu lọc thấp quét xuống), **bỏ chuông** để chồng với complete không bị đục. 454 ms.
- whoosh: gió có dải lọc trượt 450 → 2100 Hz, phần phật 22 Hz, bắt đầu ở 22% biên độ để phản hồi ngay. 400 ms.
- sparkle: glock G6-C7-E7-G7 (thấp hơn bản cũ một quãng 8). 0.7 s.
- hint: chuông FM mềm G5 → D6. 1 s.
- joker: kalimba G5-C6-E6, mỗi nốt trượt lên 80 cent ("nhún nhảy") + glock C7. 0.78 s.
- magnet: tick khởi động + ù hút (2 saw lệch 0.7%, lọc thấp mở dần, tremolo 12 Hz) + giấy phần phật + chuông C6-E6-G6 khi tới nơi. 1.2 s, nhỏ hơn bản cũ 7.5 dB.
- slot: chốt "cạch-cạch" + con dấu nhỏ + chuông E6 → A6. 1 s.
- coin: đĩa kim loại (partial không điều hoà) G6 → C7. 355 ms.
- coins: 11 xu ngẫu nhiên trong ngũ cung. 1.25 s.
- claim: xu C7 + hợp âm C6-E6-G6 rải bằng chuông quầy + glock C7. 0.96 s.
- stamp (mới): con dấu cao su "cộp": tay cầm gỗ + đệm cao su (290 Hz, trượt 12%) + giấy. 298 ms.
- feature: kèn bưu điện G4-C5-E5-G5 (tiếng gọi bưu tá) + mộc cầm đi kèm + chuông C6-E6-G6. 1.35 s.
- overtime (mới): đồng hồ bưu điện tích-tắc-tích + chuông C6 → C7 + kèn G4 nhẹ. 1.5 s.
- decor (mới): "bóp" (sine trượt 320 → 960 Hz) + gõ gỗ + chuông E6-G6-C7. 0.9 s.
- chapter (mới): kèn dài 7 nốt kết ở C6 cùng bè E5/G5 + chuông + mưa xu nhẹ. 2.3 s.
- win: giai điệu mộc cầm (giữ motif cũ) + kèn G4-A4-C5 + hợp âm kèn + chuông + glock đi lên. 2.5 s.
- lose: hộp nhạc G5-E5-D5-C5, nốt cuối chùng 35 cent, nền sine C4/G4 ấm. 1.6 s, không có sawtooth.

## 5. Số liệu sau khi làm lại (v2, đã được thay bằng v3 ở mục 8)
Đo trên file MP3 đã nén (LUFS thấp hơn mục tiêu khoảng 0.4 dB do bộ mã hoá).

| âm | ms | LUFS file | vol gọi | trong game | true peak | lead ms | centroid Hz | 2-5k % | <250 % |
|---|---|---|---|---|---|---|---|---|---|
| pick | 90 | -24.1 | 0.8 | -26.0 | -1.9 | 0.7 | 1618 | 16 | 0 |
| place | 96 | -21.4 | 0.55 | -26.6 | -1.9 | 0.6 | 498 | 0 | 0 |
| draw | 115 | -22.4 | 0.7 | -25.5 | -3.7 | 0.4 | 2193 | 33 | 0 |
| flip | 117 | -22.3 | 0.7 | -25.4 | -5.7 | 0.2 | 2262 | 41 | 0 |
| facedown (mới) | 46 | -28.4 | 1 | -28.4 | -2.3 | 0.3 | 515 | 2 | 8 |
| recycle (mới) | 360 | -23.4 | 1 | -23.4 | -5.3 | 0.2 | 2096 | 41 | 0 |
| click | 53 | -24.4 | 1 | -24.4 | -2.4 | 0.4 | 791 | 0 | 0 |
| back | 122 | -23.6 | 1 | -23.6 | -2.0 | 0.5 | 1193 | 11 | 0 |
| close | 114 | -23.5 | 1 | -23.5 | -1.9 | 0.5 | 1490 | 26 | 0 |
| deny (mới) | 154 | -24.4 | 1 | -24.4 | -4.8 | 0.2 | 350 | 0 | 4 |
| popup (mới) | 269 | -25.4 | 1 | -25.4 | -4.5 | 0.2 | 1832 | 33 | 1 |
| combo1 | 607 | -19.5 | 0.9 | -20.4 | -6.2 | 0.2 | 528 | 0 | 0 |
| combo6 | 433 | -18.5 | 0.9 | -19.4 | -3.2 | 0.2 | 1088 | 0 | 0 |
| combo11 | 479 | -17.5 | 0.9 | -18.4 | -4.0 | 0.2 | 2383 | 100 | 0 |
| open | 877 | -18.9 | 1 | -18.9 | -4.0 | 0.2 | 1439 | 15 | 0 |
| complete | 1074 | -15.9 | 1 | -15.9 | -5.2 | 0.2 | 1568 | 29 | 0 |
| boom | 454 | -16.5 | 0.35 | -25.6 | -1.9 | 0.4 | 341 | 1 | 47 |
| whoosh | 400 | -18.4 | 0.5 | -24.4 | -5.7 | 0.5 | 1541 | 24 | 0 |
| sparkle | 709 | -16.5 | 0.4 | -24.5 | -6.7 | 0.2 | 2251 | 71 | 0 |
| hint | 1027 | -19.4 | 1 | -19.4 | -9.0 | 0.2 | 1587 | 13 | 0 |
| joker | 775 | -18.9 | 1 | -18.9 | -8.0 | 0.2 | 1132 | 5 | 0 |
| magnet | 1211 | -18.4 | 1 | -18.4 | -7.8 | 0.2 | 1060 | 2 | 0 |
| slot | 1026 | -17.4 | 1 | -17.4 | -4.3 | 0.1 | 1993 | 13 | 0 |
| coin | 355 | -16.9 | 0.5 | -22.9 | -2.5 | 0.3 | 2034 | 67 | 0 |
| coins | 1254 | -17.4 | 1 | -17.4 | -7.2 | 0.3 | 2090 | 49 | 0 |
| claim | 960 | -14.8 | 0.7 | -17.9 | -4.1 | 0.2 | 2507 | 48 | 0 |
| stamp (mới) | 298 | -21.0 | 1 | -21.0 | -1.9 | 0.4 | 397 | 1 | 2 |
| feature | 1348 | -15.9 | 1 | -15.9 | -5.9 | 0.3 | 747 | 2 | 0 |
| overtime (mới) | 1487 | -16.4 | 1 | -16.4 | -6.7 | 0.2 | 1507 | 30 | 0 |
| decor (mới) | 891 | -16.9 | 1 | -16.9 | -5.3 | 0.2 | 1620 | 32 | 0 |
| chapter (mới) | 2316 | -14.4 | 1 | -14.4 | -5.6 | 2.7 | 1099 | 12 | 0 |
| win | 2536 | -14.4 | 1 | -14.4 | -4.0 | 0.3 | 870 | 5 | 0 |
| lose | 1604 | -18.4 | 1 | -18.4 | -8.3 | 0.2 | 579 | 0 | 1 |

- Nhóm thao tác trong game: -25.4 đến -26.6 (chênh 1.2 dB, bản cũ chênh 9 dB). Âm thao tác dài 46-117 ms (bản cũ 160-300 ms).
- Combo đi lên đều 0.2 dB mỗi bậc (-20.4 → -18.4), lead 0.2 ms (bản cũ 8-10 ms).
- Không clip, DC < 0.002, đuôi mọi file kết thúc dưới -47 dB so với đỉnh (bản cũ có file bị cắt ở -31 dB).
- Bậc to rõ: thao tác ≈ -26 < UI ≈ -24 < combo ≈ -20/-18 < thưởng ≈ -17/-19 < mốc ≈ -14/-16; magnet giờ nhỏ hơn win 4 dB.
- Còn sáng do bản chất (chấp nhận được, phát ít và vol thấp): coin 67%, sparkle 71% năng lượng ở 2-5 kHz. Nếu nghe thấy chói khi 12 xu nối nhau, giảm octave coin trong `s_coin`.
- place/stamp/pick/click cần limiter cắt 2-6 dB ở transient (âm rất ngắn), nên true peak chạm trần -1.9 dBTP. Đây là chủ ý, giúp tiếng mềm hơn.

## 6. Đề xuất sửa main.js / audio.js
Số dòng theo snapshot 2026-10-10, có thể lệch nếu file đã sửa: tìm theo đoạn code trích.
1. **Bắt buộc trước khi dùng âm mới:** `audio.js` dòng 3-4, thêm vào `NAMES`: `'deny', 'facedown', 'stamp', 'overtime', 'decor', 'chapter', 'recycle', 'popup'`.
2. Từ chối nước đi: đổi `sfx('close', { vol: 0.5 })` thành `sfx('deny')` (không truyền vol) ở dòng 1048 (scriptReject), 1228, 1230, 1237, 1244, 1254, 1335, 1356, 1426 (rejectTap), 1515, 1518 (deck_empty).
3. "Không làm được" do thiếu xu / chưa mở / không có gợi ý: đổi `sfx('close')` thành `sfx('deny')` ở dòng 599, 606, 607, 627, 685, 707, 772, 773, 782, 783, 851, 884, và ô level còn khoá dòng 2279 (`else sfx('close')`).
4. Giữ `sfx('close')` chỉ cho việc đóng thật: dòng 2007 (albumClose), 2371 (ch2Close). Tuỳ chọn: nút có nhãn "Đóng" trong panel (dòng 1166) phát `sfx('close')` thay vì `click`.
5. Chạm lá úp (dòng 1260): trong nhánh `if (!col[loc.idx].up)` thêm `sfx('facedown');`; trong nhánh `else` (err_mixed) thêm `sfx('deny');`. Hiện cả hai nhánh đang im.
6. Tem Điểm ở bảng thắng (dòng 1959): `sfx('place', { rate: 0.9 })` → `sfx('stamp', { rate: [0.94, 1, 1.06][k] })`. Giữ `claim`, nhưng nên đổi rate `1 + k * 0.12` thành `[1, 1.1225, 1.2599][k]` (đúng quãng 2 và quãng 3 trưởng, đúng thang âm).
7. Màn Chương 2 (dòng 2362): `sfx('place', { rate: 0.85 })` → `sfx('stamp', { rate: 0.9 })`.
8. Overtime (dòng 1818, startOvertime): `sfx('feature')` → `sfx('overtime')`.
9. Đặt decor (dòng 2332): `sfx('slot')` → `sfx('decor')`.
10. Thưởng chương (dòng 1973, chapterReward): `sfx('feature')` → `sfx('chapter')`.
11. Lật lại chồng bài (dòng 1649, `ev.type === 'recycle'`): `sfx('whoosh')` → `sfx('recycle')`.
12. Tuỳ chọn: trong `panel()` phát `sfx('popup')` khi mở, chỉ với các bảng không có âm riêng (không áp dụng cho bảng thắng/thua/tính năng mới).
13. Stamper (dòng 871): `sfx('complete', { vol: 0.8, rate: 1.2 })` → `rate: 1.1225` (+2 semitone, đúng thang). rate 1.2 hiện tại lệch tông với combo.
14. Lật trúng vương miện (dòng 1636): `rate: 1.25` → `rate: 1.2599` (quãng 3 trưởng chuẩn), khác biệt nhỏ.
15. Mưa xu (dòng 531): `rate: 1 + Math.random() * 0.2` → `rate: [1, 1.1225, 1.2599][Math.floor(Math.random() * 3)]` để xu không lệch tông nhau.
16. Không cần đổi vol nào khác: file đã bù sẵn vol hiện tại (place 0.55, draw 0.7, flip 0.7, coin 0.5, whoosh 0.5/0.8, boom 0.35, sparkle 0.4, claim 0.7). Đổi vol thì âm to/nhỏ theo đúng tỉ lệ.
17. `coins.mp3` vẫn không được gọi. Có thể dùng cho +200 xu ở chapterReward (`sfx('coins', { vol: 0.6, delay: 1.0 })`), hoặc bỏ qua vì `chapter` đã có mưa xu nhẹ.
18. Giữ `sfx('boom', { vol: 0.35 })` đi kèm complete (dòng 1739): boom mới không còn chuông nên chồng vào sẽ dày mà không đục.

## 7. Cách dùng, rủi ro
- Tạo lại: `python3 tools/synth_sfx.py` (cả bộ, khoảng 2 giây) hoặc `python3 tools/synth_sfx.py pick open` (vài âm). Mục tiêu loudness/vol của từng âm nằm trong `SPEC` cuối script.
- Nghe thử: `http://localhost:8766/sfx-preview.html`. Trang có Play theo đúng vol/rate trong game, Bản cũ để so sánh A/B, nút ×12 để thử mệt tai, chuỗi phát như trong game (gửi thư, combo 1→11, mưa xu, bảng thắng, từ chối), và công tắc giả lập loa điện thoại.
- `prototype/stamp/sfx/_old/` chứa bản cũ chỉ để A/B. **Xoá trước khi commit/deploy** (deploy_web.sh copy cả thư mục sfx/).
- Trình duyệt cache MP3 theo URL: khi chơi thử game ở localhost sau khi chạy lại script, cần hard reload. Bản deploy đã đổi tên sfx/ theo mã băm nên không bị.
- Safari/iOS: chưa kiểm tra việc bỏ encoder delay MP3. Nếu không bỏ, mọi âm trễ đều khoảng 25 ms. Trang preview có dòng tự đo con số này trên trình duyệt đang mở.
- Chưa ai nghe bằng tai. Cần nghe trên loa điện thoại thật, nhất là: deny (có đủ "mềm" không), combo1 khi lặp 12 lần, chuỗi gửi thư, kèn ở feature/win (cozy hay bị "sến").

## 8. Chỉnh cho người lớn tuổi (v3, 2026-10-10)
Bối cảnh: người dùng chốt đối tượng chính là người chơi lớn tuổi, tone chill. v3 thay toàn bộ 41 file, giữ nguyên tên. Đo bằng cùng phương pháp ở mục 1, trên file MP3 đã nén.

### Nguyên tắc
- Mềm, ấm, bớt chất "arcade": mọi envelope có attack tối thiểu 2.5 ms (`ATTACK_MIN`), fade-in đầu file 1.5 ms. Mỗi lớp âm có fade 6 ms ở cuối, nên không còn click khi lớp bị cắt.
- Bỏ hẳn kèn bưu điện. Các mốc lớn (feature, win, chapter) dùng hộp nhạc thong thả, chuông quầy chỉ số FM thấp nghe như chuông xa, và nền "harmonium" sine attack 120 ms ở mức rất nhỏ.
- Combo: mộc cầm dùi mềm (mallet 0.1) cộng một chút hộp nhạc. Ngũ cung G4-A4-C5-D5-E5-G5-A5-C6, **không vượt C6**. combo9-11 giữ nốt C6 và thêm bè ấm bên dưới (G5, rồi E5+G5, rồi C5+E5+G5) thay vì lên cao hơn.
- Dải tần: lowpass 4.5 kHz 24 dB/oct cho mọi âm (`LP_MAX`), âm thao tác 2.5-3.5 kHz. Highpass ≥120 Hz cho mọi âm, 150-200 Hz cho thao tác/UI. Chuông, xu, sparkle hạ 1 quãng 8, xuống vùng G5-C6.
- Nhỏ và đều: trung bình nhỏ hơn v2 4.2 dB. Dải độ to từ -30.9 tới -19.9 LUFS trong game (v2 là -28.4 tới -14.4). Thứ bậc vẫn giữ: thao tác ≈ -28.5 < UI ≈ -27.5 < combo -24.4 → -22.9 < thưởng/booster ≈ -22 → -23 < mốc ≈ -20 → -21.
- `deny`: một tiếng "phù" duy nhất, gồm nhiễu lọc thấp quét xuống và thân gỗ E4 lọc dưới 1.6 kHz. -29.9 LUFS, nhỏ thứ hai sau `facedown`. Không còn hai nhịp "bụp bụp" vốn đọc ra như "không-không".
- `lose`: hộp nhạc E5-D5-C5 rồi nghỉ trên G4+E5 (hợp âm trưởng) cùng nền ấm. Bỏ nốt chùng xuống. `overtime`: hai tiếng tích-tắc rất nhẹ rồi chuông chiều trầm C5/G4, sau đó E5.
- Nhịp thong thả: arpeggio của complete, claim, feature chậm lại (90-160 ms mỗi nốt). Reverb phòng gỗ tối hơn (damp 2.2-2.5 kHz), t60 1.0-1.6 s, mix 22-32%. Âm thao tác vẫn khô, dài 48-124 ms.
- Ít lớp dồn: trong chuỗi gửi thư, complete (-20.9) là lớp trội; boom hạ xuống -30.5, whoosh -28.4, coin -26.9.

### Số đo v2 → v3 (trong game = đã nhân vol main.js, chưa tính master 0.8)

| âm | ms | LUFS trong game | true peak dB | centroid Hz | 2-5 kHz % | 300 Hz-2.5 kHz % | <250 Hz % |
|---|---|---|---|---|---|---|---|
| pick | 90 → 91 | -26.0 → -28.4 | -1.9 → -2.9 | 1618 → 950 | 16 → 5 | 85 → 97 | 0 → 0 |
| place | 96 → 99 | -26.6 → -28.7 | -1.9 → -1.9 | 498 → 447 | 0 → 0 | 99 → 99 | 0 → 1 |
| draw | 115 → 111 | -25.5 → -28.9 | -3.7 → -6.4 | 2193 → 1573 | 33 → 25 | 69 → 88 | 0 → 0 |
| flip | 117 → 122 | -25.4 → -28.9 | -5.7 → -7.3 | 2262 → 1323 | 41 → 16 | 70 → 92 | 0 → 0 |
| facedown | 46 → 48 | -28.4 → -30.9 | -2.3 → -7.6 | 515 → 519 | 2 → 0 | 88 → 87 | 8 → 6 |
| recycle | 360 → 400 | -23.4 → -27.9 | -5.3 → -12.1 | 2096 → 1291 | 41 → 15 | 69 → 93 | 0 → 1 |
| click | 53 → 54 | -24.4 → -27.4 | -2.4 → -4.1 | 791 → 668 | 0 → 0 | 100 → 100 | 0 → 0 |
| back | 122 → 124 | -23.6 → -27.4 | -2.0 → -6.6 | 1193 → 579 | 11 → 0 | 91 → 99 | 0 → 0 |
| close | 114 → 120 | -23.5 → -27.5 | -1.9 → -5.7 | 1490 → 1054 | 26 → 15 | 82 → 94 | 0 → 0 |
| deny | 154 → 117 | -24.4 → -29.9 | -4.8 → -8.7 | 350 → 551 | 0 → 0 | 76 → 91 | 4 → 7 |
| popup | 269 → 130 | -25.4 → -28.9 | -4.5 → -10.2 | 1832 → 1353 | 33 → 17 | 82 → 89 | 1 → 1 |
| combo1 | 607 → 767 | -20.4 → -24.4 | -6.2 → -8.6 | 528 → 396 | 0 → 0 | 100 → 100 | 0 → 0 |
| combo6 | 433 → 717 | -19.4 → -23.7 | -3.2 → -8.7 | 1088 → 787 | 0 → 0 | 100 → 100 | 0 → 0 |
| combo8 | 482 → 714 | -19.0 → -23.4 | -3.0 → -8.8 | 1452 → 1049 | 6 → 0 | 96 → 100 | 0 → 0 |
| combo11 | 479 → 803 | -18.4 → -22.9 | -4.0 → -7.5 | 2383 → 921 | 100 → 0 | 80 → 100 | 0 → 0 |
| open | 877 → 1221 | -18.9 → -22.9 | -4.0 → -8.8 | 1439 → 816 | 15 → 4 | 84 → 97 | 0 → 0 |
| complete | 1074 → 1603 | -15.9 → -20.9 | -5.2 → -12.0 | 1568 → 709 | 29 → 0 | 97 → 100 | 0 → 0 |
| boom | 454 → 617 | -25.6 → -30.5 | -1.9 → -1.9 | 341 → 356 | 1 → 0 | 22 → 27 | 47 → 20 |
| whoosh | 400 → 450 | -24.4 → -28.4 | -5.7 → -8.8 | 1541 → 1051 | 24 → 8 | 86 → 96 | 0 → 1 |
| sparkle | 709 → 1140 | -24.5 → -28.5 | -6.7 → -9.7 | 2251 → 1018 | **71 → 0** | 61 → 100 | 0 → 0 |
| hint | 1027 → 1320 | -19.4 → -23.4 | -9.0 → -12.3 | 1587 → 949 | 13 → 6 | 83 → 96 | 0 → 0 |
| joker | 775 → 1118 | -18.9 → -22.9 | -8.0 → -11.8 | 1132 → 553 | 5 → 0 | 100 → 100 | 0 → 0 |
| magnet | 1211 → 1702 | -18.4 → -22.9 | -7.8 → -12.6 | 1060 → 561 | 2 → 0 | 96 → 97 | 0 → 0 |
| slot | 1026 → 1420 | -17.4 → -22.4 | -4.3 → -9.0 | 1993 → 949 | 13 → 7 | 79 → 95 | 0 → 0 |
| coin | 355 → 740 | -22.9 → -26.9 | -2.5 → -6.3 | 2034 → 982 | **67 → 1** | 96 → 100 | 0 → 0 |
| coins | 1254 → 1572 | -17.4 → -22.9 | -7.2 → -11.5 | 2090 → 795 | 49 → 0 | 81 → 100 | 0 → 0 |
| claim | 960 → 1553 | -17.9 → -21.9 | -4.1 → -8.0 | 2507 → 794 | 48 → 3 | 72 → 98 | 0 → 0 |
| stamp | 298 → 463 | -21.0 → -24.4 | -1.9 → -2.8 | 397 → 411 | 1 → 0 | 85 → 94 | 2 → 2 |
| feature | 1348 → 2341 | -15.9 → -20.9 | -5.9 → -10.3 | 747 → 596 | 2 → 0 | 98 → 98 | 0 → 0 |
| overtime | 1487 → 2704 | -16.4 → -20.9 | -6.7 → -10.7 | 1507 → 548 | 30 → 1 | 99 → 98 | 0 → 0 |
| decor | 891 → 1456 | -16.9 → -21.4 | -5.3 → -10.1 | 1620 → 623 | 32 → 0 | 99 → 100 | 0 → 0 |
| chapter | 2316 → 3668 | -14.4 → -19.9 | -5.6 → -9.1 | 1099 → 691 | 12 → 0 | 96 → 98 | 0 → 0 |
| win | 2536 → 3752 | -14.4 → -19.9 | -4.0 → -8.9 | 870 → 699 | 5 → 0 | 96 → 97 | 0 → 0 |
| lose | 1604 → 2698 | -18.4 → -22.9 | -8.3 → -12.4 | 579 → 562 | 0 → 0 | 94 → 96 | 1 → 0 |

- Trung bình cả bộ: 2-5 kHz giảm từ 18.6% xuống 3.0%. Vùng 300 Hz-2.5 kHz tăng từ 88% lên 96%. Năng lượng trên 4.5 kHz lớn nhất chỉ còn 0.3% (v2 có âm tới 14.8%).
- Độ dài: âm thao tác vẫn 48-124 ms. Đuôi âm thưởng dài thêm 0.4-1.3 s, phần lớn là đuôi reverb dưới -30 dB.
- Kỹ thuật: lead ≤1.5 ms, không clip, DC < 0.001, đuôi kết thúc dưới -45 dB.
- Ngoại lệ có chủ ý: boom còn 20% dưới 250 Hz (tiếng "phụp" nỉ, nằm ở -30.5 LUFS dưới complete). place và stamp vẫn chạm limiter (âm rất ngắn), true peak -1.9/-2.8 dB.
- Rate trong main.js (open 1.2599, coin/claim tới 1.2599, complete 1.1225) đẩy nốt cao nhất lên khoảng E6 (1.3 kHz), vẫn trong vùng an toàn. Combo không dùng rate nên giữ trần C6.

### main.js
- **Không cần sửa gì.** File đã bù sẵn vol hiện tại (place 0.55, draw/flip 0.7, coin 0.5, whoosh 0.5/0.8, boom 0.35, sparkle 0.4, claim 0.7/0.4, combo 0.9). Các rate theo thang âm đã nối vẫn đúng thang với v3.
- Tuỳ chọn, nếu nghe vẫn thấy dồn: bỏ `sfx('boom', { vol: 0.35 })` đi kèm complete. complete v3 đã có tiếng niêm sáp riêng.
- Muốn cả game nhỏ/to hơn nữa thì chỉ cần đổi master gain 0.8 trong `audio.js`, không cần tạo lại file.
