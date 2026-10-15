# Ghi chú kỹ thuật R12 + P6 và R13 (2026-10-15)

Viết cho vòng tiếp theo của Feature Dev. Nguồn yêu cầu:
- `30-day-plan.md`: R12, R13, M7, M8, S3.
- `benchmark-grand-games.md`: mục 4.2, 4.3, 4.4, 8 và P6.
- `review-game-design-v2-2026-10-10.md`: mục 8 và các việc #3, #4, #10.

Tên hàm lấy theo `prototype/stamp/src/main.js`. Không ghi số dòng vì Polish Dev đang sửa file này.

**Ràng buộc đã chốt:**
- Người dùng chọn **luật A**. **Level thường vẫn thua như ABI.**
  - `outOfMoves()` giữ nguyên: tiêu đề "Hết nước", tiếng `lose`, +5 nước bằng quảng cáo, +5 bằng xu, Chơi lại.
  - R11 ("Thư đến trễ") không làm.
  - Hai vòng này chỉ thêm sự kiện vào màn hết nước, không đổi luật.
- Ca tối chỉ có ở level khó. Luật Tem Điểm `stars()` giữ nguyên.
- Không đổi format level, không sửa `tools/` hay `levels*.js`.
- Hai việc còn thuộc Polish Dev, R13 dùng lại chứ không làm lại:
  - Nhạc nền: `audio.js` có `setMusicOn`, `isMusicOn`, `setMusicScene`.
  - Rung: `haptics.js` có `haptic(tier)`, `setHapticsEnabled`, khoá `ss_haptics`.

---

## R12 + P6: màn thắng dàn dựng, nút chính, analytics

### Thứ tự làm

1. **Analytics (nhỏ, làm trước để các bước sau ghi được sự kiện)**

   Trong `analytics.js`: đổi `MAX` từ 800 thành 5000. 5000 sự kiện khoảng 1 MB localStorage, vẫn chấp nhận được.

   Sự kiện mới trong `main.js`:

   | Sự kiện | Chỗ gọi | Trường |
   |---|---|---|
   | `ad_offer` | Lúc dựng một panel có nút quảng cáo: màn thắng (x2), `onExtraSlot`, `outOfMoves` (+5 quảng cáo), nhánh `retry` của `outOfMoves` ("Suýt nữa") | `level`, `placement`: `win_x2` / `extra_slot` / `oom_more` / `soclose_more` |
   | `ad_watch` | Trong `fakeAd(done, placement)`, ngay trước `done()`. Thêm tham số `placement` cho mọi chỗ gọi | `level`, `placement` |
   | `win_button` | Mỗi nút của màn thắng | `level`, `button`: `continue` / `x2` / `decorate`, `ms`: thời gian từ lúc thắng tới lúc bấm, `skipped`: có tua không |
   | `idle_long` | `setInterval` 5 giây trong lúc `levelActive && !panelOpen`: không thao tác quá 30 giây thì ghi 1 lần cho mỗi đợt đứng yên. Mốc thao tác cuối dùng `lastActAt` cộng `pointerdown` trên `board` | `level`, `s`, `moves_used` |
   | `pause_open`, `rules_open` | Nút `pauseBtn`, `showRules()` | `level` |

   Đã có từ R9/R10: `tap_drift`, `app_hidden`, `level_resume`, `confirm_*`, `taps`/`drags` trong `level_complete`.

   Để test `idle_long` không phải chờ 30 giây: đọc ngưỡng từ `?idle=<giây>` (mặc định 30).

2. **Thứ tự nút màn thắng (M7, review #4)**

   Trong `winSequence()`, mảng `buttons`:
   - `cont` đứng đầu, kiểu mặc định (nút vàng, to).
   - `decorate_now` giữ kiểu `brown`.
   - `claim2` thành nút phụ nhỏ: class mới `.btn.small` trong `index.html` (chữ 34px, `min-width: 0`, nền giấy kem viền nâu, không dùng `btn_blue.png`). Chỉ hiện khi `lv >= 11`.
   - Quy tắc: không bao giờ quá 2 nút to.
   - Mỗi `act` gọi `track('win_button', ...)`.

3. **Dàn dựng theo mục 4.3, thay popup đè lên bàn trống**

   Tách `winSequence()` thành hàm điều phối `runWinTimeline()` với một mảng bước `{ at, run, finish }`:

   | t (giây) | Bước | Hàm |
   |---|---|---|
   | 0,2–0,9 | Mỗi khay (`slotEls`) thành phong bì, bay lần lượt cách nhau 80 ms. Asset túi thư `[ART]` chưa có: tạm bay vào thanh tiến độ `#combo`, giống `completeAnimInner`. Có asset thì đổi điểm đích | `flyTraysAway()` (mới, dùng lại sprite `envelope_closed.png`) |
   | 0,9 | Âm `win`. Confetti giấy 40–60 mảnh, palette 5 màu, drag cao, sống 2,5 giây. Thay `confetti(170)` | `confetti(n, { palette, drag })` trong `fx.js`: thêm tham số, giữ mặc định cũ cho chỗ khác |
   | 1,1 | Bảng trượt từ dưới lên 280 ms `outBackSoft` | `panel({ ..., kind: 'win' })`: class `.panel.win` với `transform` riêng trong CSS |
   | 1,4 / 1,7 / 2,0 | Tem Điểm đóng cộp (đã có trong `onOpen`) | giữ nguyên |
   | 2,2 | Xu bay về ô xu, số đếm dần 600 ms | `coinsTo()` giữ nguyên. `bumpCoins()` đổi sang count-up |
   | ≤ 2,6 | Nút bấm được. Trước đó nút có class `.wait` (mờ 0.6, không nhận chạm) | bỏ `.wait` ở bước cuối |

   **Chạm để tua:** từ 0,9 giây, một `pointerdown` trên `#overlay` hoặc scrim gọi `finishWin()`. Hàm này:
   - huỷ mọi `setTimeout` của timeline (giữ trong `winTimers`);
   - gọi `finish()` của từng bước chưa chạy: phong bì biến mất, mọi Tem Điểm hiện `.on` ngay, xu cộng thẳng vào `save.coins` rồi `persist()`, số trên ô xu đặt ngay giá trị cuối;
   - bỏ `.wait` khỏi các nút.

   Mục tiêu tua xong trong 300 ms. Chạm tua không được tính là bấm nút: nút chỉ nghe `pointerup`, và chỉ sau khi đã bỏ `.wait`.

   **Ô xu trên scrim:** `#coins` nằm trong `#ui` (z 6), dưới `#overlay` (z 10). Khi mở màn thắng, `body.classList.add('win')`, và CSS nâng `.hud-coins` lên trên scrim, ví dụ chép một bản sang `#overlay` cùng toạ độ. Toạ độ đích trong `coinsTo()` (`hudX`, `hudY`) không đổi.

   **Giảm chuyển động** (cờ từ R13, hoặc `prefers-reduced-motion`):
   - bỏ phong bì bay và confetti;
   - bảng hiện ngay;
   - Tem Điểm cách nhau 150 ms.

   Khi làm R12, viết sẵn một hàm `reduceMotion()` để R13 chỉ việc nối vào.

   Không đụng `chapterReward()` và `outOfMoves()`, ngoài việc thêm `ad_offer`.

4. **Count-up xu:** `bumpCoins()` tween số hiển thị từ giá trị cũ tới `save.coins` trong 600 ms, có `key` riêng để lần gọi mới huỷ lần cũ. `updateHUD()` vẫn đặt thẳng số (không đếm) khi vào level.

### Test kiểm R12

- **Mới, `tests/win-screen.browser.js`**, cùng kiểu với `drag-scenarios.browser.js`:
  - Đưa level tới thắng bằng `__game.autoplay(40)` (solver). L3 và L12 dùng save mẫu như `resume.browser.js` `setup()`.
  - (a) Nút đầu tiên là "Tiếp tục". L3 không có nút x2. L12 có x2 với class `small`.
  - (b) Từ lúc thắng (đo bằng `MutationObserver` khi bảng xuất hiện) tới lúc mọi nút hết `.wait`: ≤ 2600 ms.
  - (c) Chạm ở 1000 ms: trong ≤ 300 ms, đủ `.stars i.on`, nút bấm được, `save.coins` đã cộng đủ thưởng.
  - (d) `document.elementFromPoint` ở tâm ô xu trả về ô xu, không phải scrim.
  - (e) Có sự kiện `win_button`, `ad_offer` (placement `win_x2` ở L12) và `ad_watch` sau khi bấm x2.
- **Sự kiện:** mở panel Ô phụ (`ad_offer` `extra_slot`). Giả `visibilitychange` bằng `Object.defineProperty(document, 'hidden', ...)` để có `app_hidden`. Dùng `?idle=3` để có `idle_long`. Bảng Events trong `?debug` hiện đủ 5 tên của AC.
- **Ảnh 375×812:** màn thắng L3 và L12, chụp lúc 1,2 giây (đang dàn dựng) và lúc kết thúc.
- **Hồi quy:**
  - `drag-scenarios` 13/13;
  - `naive-drag` (`run` và `runDrift`, `runDriftScript`);
  - `resume.browser.js` (`runAll` và `prepareReload`/`checkReload`): thắng phải xoá bản lưu ván dở;
  - `node prototype/stamp/tests/fuzz.test.mjs`.

---

## R13: cỡ chữ và bảng Cài đặt

### Thứ tự làm

1. **Kho cài đặt thiết bị: file mới `src/settings.js`**
   - Không lưu vào save tiến trình (save tách theo variant A/B). Cài đặt là của máy.
   - Khoá `ss_settings`, giá trị `{ text: 0|1|2, sfx: 0|1|2, motion: 'auto'|'reduce' }`.
   - Hàm: `getSetting(k)`, `setSetting(k, v)` (ghi localStorage, gọi các listener), `onSetting(fn)`.
   - Không cần migration: khoá chưa có thì dùng mặc định. Mặc định đề xuất cho người lớn tuổi: chữ **Lớn** (`text: 1`), SFX vừa.
   - Các khoá đã có giữ nguyên, bảng Cài đặt chỉ đọc và ghi qua API sẵn: ngôn ngữ (`ss_lang`), rung (`ss_haptics`), nhạc (khoá của `audio.js`).
   - Bọc mọi truy cập localStorage trong try/catch như `haptics.js`.

2. **Bảng Cài đặt** (hàm mới `settingsPanel()` trong `main.js`, dùng `panel()`)
   - Mỗi dòng là nhãn + điều khiển, vùng chạm ≥ 44pt:
     - **Cỡ chữ**: 3 nút "Thường / Lớn / Rất lớn". Bấm là áp ngay để người chơi thấy luôn.
     - **Âm thanh** (SFX): Tắt / Nhỏ / Vừa. Thay cho nút "Âm thanh: Bật/Tắt" hiện có. Mức "Tắt" dùng `setMuted(true)`.
     - **Nhạc**: Bật / Tắt, qua `setMusicOn`.
     - **Rung**: Bật / Tắt, qua `setHapticsEnabled`.
     - **Giảm chuyển động**: Bật / Tắt.
     - **Ngôn ngữ**: chuyển ngay, giống nút hiện có. Đổi xong phải dựng lại panel để nhãn đổi theo.
   - Mở được từ 2 chỗ:
     - Pause: còn 5 nút "Chơi tiếp / Cách chơi / Cài đặt / Chơi lại / Trang chủ". Bỏ 3 nút âm thanh, nhạc, ngôn ngữ ra khỏi Pause. Nút "Chơi lại" và "Trang chủ" vẫn qua `confirmRestart()` / `confirmHome()`.
     - Màn chính: nút bánh răng, khớp P9. Icon `[ART]` chưa có thì tạm dùng chữ.
   - Sự kiện `setting_change` với `key`, `from`, `to`.
   - Copy EN/VI trong `copy.js`, không gạch ngang dài:
     - `settings`, `set_text`, `text_0..2`, `set_sfx`, `sfx_0..2`, `set_music`, `set_haptics`, `set_motion`, `on`, `off`.

3. **Cỡ chữ (review #3, M7)**
   - `body` có biến CSS `--fs`: 1 / 1.15 / 1.3, đặt bằng `document.body.style.setProperty('--fs', ...)`.
   - Trong `index.html`, các khối chữ đổi `font-size: Npx` thành `calc(Npx * var(--fs, 1))`:
     - `.toast`, `.tut`, `.panel p`, `.panel h3`, `.btn`, `.btn small`, `.btn-undo .lbl`;
     - nhãn booster `.booster .name`, `.ch-lbl`, `.al-info`, nút Play;
     - mức Thường phải đạt chuẩn của review: chữ hướng dẫn, toast, popup ≥ 48px stage; nhãn booster, Undo, số trên khay ≥ 40px.
   - Chữ inline trong JS dùng helper `fs(n)` (trả `n * scale`):
     - `font-size:36px` trong body của `winSequence`, `askResume`, `decorPanel`;
     - `rulesHtml()` (38px, 36px);
     - `floatText()` (56px);
     - `levelBanner()` (110px, 46px).
   - **Không** nhân `--fs` cho chữ trên lá (`tagStyle`, `fitSize` của ribbon), vì lá có kích thước cố định. Riêng nhãn vương miện: nâng sàn lên 34px, 2 dòng, không co (review #3).
   - **Chống tràn:**
     - `.panel` thêm `max-height: calc(100% - var(--mid) - 520px)` và `overflow-y: auto` làm lưới an toàn.
     - Nút dài được xuống dòng (`white-space: normal`) thay vì tràn ngang.
     - Ô nút Play rộng 520px: ở "Rất lớn", chuỗi "Chơi tiếp Level 12" phải vừa. Kiểm bằng script.
   - Toast và tut tính vị trí theo chiều cao chữ. Kiểm ở "Rất lớn" rằng chúng không đè hàng rút bài (logic `.toast.high` trong `toast()`).

4. **Giảm chuyển động**
   - Hằng `reduceMotion` thành hàm `reduceMotion()` = cài đặt `motion === 'reduce'` HOẶC `prefers-reduced-motion`.
   - Các chỗ áp dụng:
     - `shake()`;
     - màn thắng (R12, bước 3);
     - `levelBanner()`: hiện và ẩn bằng mờ, không bật nảy;
     - `body.classList.toggle('reduce-motion')` để CSS tắt `pulse` của `.lvl.cur` và logo lắc lư;
     - `fx.js`: gọi `setLite(true)` để giảm hạt (dùng lại cờ có sẵn).
   - Không đổi tốc độ lá bay hay kéo thả: mục 8 của benchmark nói giữ tốc độ thao tác lõi.

5. **Âm lượng SFX 3 mức** cần `audio.js`, mà file này đang thuộc Polish Dev.
   - Đề xuất API `setSfxVolume(0|1|2)`: hệ số 0 / 0.5 / 1 nhân vào `vol` trong `sfx()`.
   - Báo coordinator trước khi sửa. Nếu chưa được sửa thì tạm map: "Tắt" = `setMuted(true)`, "Nhỏ" và "Vừa" giữ như hiện tại, và ghi rõ trong báo cáo.

### Test kiểm R13

- **Mới, `tests/settings.browser.js`:**
  - (a) Với mỗi mức chữ 0/1/2, mở lần lượt: Pause, Cài đặt, Cách chơi, hộp xác nhận Chơi lại, hộp "Ván đang dở", màn thắng (dùng `autoplay`), bảng hết nước (`setState` với `moves = 1` rồi đi 1 nước), album. Với mỗi màn, quét mọi phần tử trong `.panel`, `.album`, `.toast`, `.tut`: không có `scrollWidth > clientWidth + 1`, và đáy panel không vượt màn hình.
  - (b) Đổi từng cài đặt, reload, đọc lại: giá trị giữ nguyên. Kiểm thêm: `getComputedStyle(body)` có `--fs` đúng, `isMusicOn()` / `hapticsEnabled()` khớp lựa chọn.
  - (c) Bật "Giảm chuyển động", gọi `shake()` qua một thao tác Stamper: `board.style.transform` vẫn rỗng.
- **Ảnh 375×812 ở mức Lớn** (AC của R13): L1 (kịch bản), L20, màn thắng, album, Pause, Cài đặt. Thêm Pause và màn thắng ở "Rất lớn" để soát tràn.
- **Hồi quy:** như R12. Thêm `runDrift` ở mức "Rất lớn": cỡ chữ không được đổi vùng chạm của lá.

---

## Rủi ro và phụ thuộc

- **Xung đột file với Polish Dev:** `main.js`, `index.html`, `audio.js`, `fx.js` (P4, P5, P8 cũng sửa các hàm này). Cần coordinator chia lượt.
  - R12 bước 3 đụng `panel()` và CSS `.panel`, trùng P8 (popup 0.88→1). Thống nhất một bộ thời lượng trong hằng `MOTION` (P4) trước khi làm.
- **Asset `[ART]` chưa có:** túi thư (P6), icon bánh răng (P9). Cả hai đều có phương án tạm, không chặn R12 hay R13.
- **Nút x2 từ L11 làm giảm số lần xem quảng cáo** so với hiện tại. PO đã chốt trong R12. Theo dõi bằng `ad_offer` / `ad_watch`.
- **Mặc định chữ Lớn** làm panel cao hơn. Pause phải gọn còn 5 nút (bước R13.2) trước khi đổi mặc định.
