# QA hồi quy bản mới: prototype Stamp Sort (2026-10-10)

**Build:** commit `8518c2d`, chạy local `http://localhost:8766/` (thư mục `prototype/stamp`).
**Cách test:**
- Chrome headless, profile riêng (không đụng save của người dùng).
- Chạm và kéo bằng `Input.dispatchTouchEvent` qua CDP: trình duyệt tự hit-test như ngón tay thật, có phần tử che là chạm trúng phần tử đó.
- Khung 375×812 và 360×640, tiếng Việt, có thử tiếng Anh.
- Chỉ dùng debug (`startLevel`, `Win now`, `setState`, đặt `S.moves`) để nhảy level hoặc dựng tình huống. Mọi nước đi đều bằng chạm/kéo.
- SFX: bọc `fetch` + `decodeAudioData` + `AudioBufferSourceNode.start` trước khi game nạp, ghi tên file mỗi lần phát. Không nghe bằng tai.
- Chỉ ghi điều tự quan sát được.

## Tóm tắt
- Đã chạy 41 kịch bản. Gồm: regression 16 lỗi QA cũ và P0/P1 review; FTUE L1–L4 ở 375×812 và L1–L2 ở 360×640; booster L4/L7/L9; cứu trợ L5; panel kẹt; hết nước; chương 2; meta; đổi ngôn ngữ; giảm chuyển động; bấm nhanh; hai ngón; 2 bộ test kéo thả.
- Lỗi mới: **0 Blocker, 1 Major, 7 Minor**.
- Lỗi QA cũ: 14/16 đã hết. #15 mới sửa một phần. #2 chưa tái hiện lại được nên chưa kết luận.
- Review P0/P1: 14/16 đã hết. #8 và #15 chưa kiểm tra lại. Thêm P2 #23 (hết nước, thiếu xu) mới sửa một phần.
- Lỗi đáng chú ý nhất (Major): khi một câu gợi ý theo ngữ cảnh ở L2–L5 đang hiện, chỉ cần thả hụt một lá, bấm Gợi ý, hoặc đúng lúc popup "Mới: Gợi ý" ở L2 bật lên, là bàn tay mất. Sau đó gợi ý khi đứng yên cũng không hiện lại trong 40–60 giây.

> **Trạng thái sửa (cập nhật cùng ngày):** đã sửa cả 8 lỗi mới và #15 còn tồn.
> - **N1:** gợi ý theo ngữ cảnh bị mất bàn tay thì 3,5 giây sau tự vẽ lại; sau 12 giây tự kết thúc để gợi ý rảnh tay tiếp quản; không bật gợi ý mới khi có popup hoặc popup tặng quà sắp hiện. Kiểm tra lại ở L3: thả hụt khi đang có câu "Hết tem hợp? Chạm bộ bài." thì bàn tay quay lại ngay; câu gợi ý hết hạn sau 12 giây, khoảng trống không có bàn tay chỉ còn khoảng 5 giây (trước là 60 giây).
> - **N2:** hết nước + thiếu xu thì mở lại bảng trước rồi mới hiện toast (toast nằm trên lớp mờ), kèm tiếng deny.
> - **N3:** `popup.mp3` phát khi mở bảng thường (bảng có radial đã có âm riêng).
> - **N4:** thêm tiếng deny khi chạm ra ngoài lúc đặt Tem Vàng cứu trợ, và khi bấm Hoàn tác trong kịch bản.
> - **N5:** chạm bộ bài khi đang chọn cột/ô cho booster trong kịch bản: báo "Chạm cột/ô đang sáng" + deny.
> - **N6:** tên chủ đề dài có dấu cách (vd. "Thuyền buồm", "Côn trùng", "Bánh ngọt") xuống 2 dòng 29px thay vì co còn 24px; icon thu nhỏ để chừa chỗ. Số đếm "0/5" dời vào trong khung. Huy hiệu giá booster 32px (trước 26px), Undo 30px.
> - **N7:** chạm đúp do run tay: chạm thứ hai trong 250 ms bị bỏ qua (chạm lá, rút bài, Hoàn tác); kéo thì vẫn nhận. Kiểm tra: 3 chạm nhanh vào bộ bài chỉ tính 1 nước; 3 lần bấm nhanh Hoàn tác chỉ trừ 1 lượt.
> - **N8:** hai bộ test không `await startLevel` nữa (trên save trống `startLevel` chờ người chơi đóng bảng luật nên test treo), và đóng mọi bảng xuất hiện trong 9 giây đầu bằng `pointerup`. Kiểm tra: `runAll()` trên save trống 13/13 PASS.
> - **#15 (còn tồn):** bàn tay chỉ booster và cột nằm ngang, ngón chỉ sang trái vào mép phải mục tiêu, thân tay nằm bên phải, nên không che nhãn tên bên dưới và không đè ô chữ gợi ý. Đã chụp lại L4.
> - Kiểm tra chung: test logic 103/103; kéo thả 13/13; tutorial L1, booster L7/L9, naive-drag (seed 1) đều PASS trên Chrome headless.

## Regression 16 lỗi QA cũ (`docs/qa/qa-interaction-2026-10-10.md`)

| # | Trạng thái | Ghi chú |
|---|---|---|
| 1 | Fixed | Lá 2 của L1 là Pizza. Bước 4: kéo cam vào ô Trái cây thì ô không sáng, toast "Xếp lên chỗ bàn tay chỉ trước đã.", tiếng deny |
| 2 | Chưa tái hiện lại | Bàn dựng bằng `setState` không bật được câu "Chạm bộ bài". Lần chơi L2 thật lần này không gặp lại. Chưa đủ để kết luận |
| 3 | Fixed | L3: đứng yên tới khi bàn tay gợi ý hiện, bấm Hoàn tác. Sau 1 giây và 3 giây đều không còn bàn tay, không còn vệt sáng |
| 4 | Fixed | Bấm Gợi ý 3 lần nhanh: chỉ trừ 1 lượt (lần khác chỉ trừ 150 xu một lần) |
| 5 | Fixed | Nút Hoàn tác mờ trong kịch bản L1. Bảng luật ghi "Mỗi level 5 lần hoàn tác miễn phí" |
| 6 | Fixed | Sau kịch bản L1, đứng yên 45 giây: bàn tay hiện ở giây 6,7, 18,7 và 38,7 (giãn 7 → 12 → 20 giây) |
| 7 | Fixed | L9: cột đích có đỉnh là tem thường (Sculpture). Đặt xong có câu dạy. Tặng 2, sau kịch bản còn 1 |
| 8 | Fixed | Dải lộ của tem nằm dưới Tem Vàng cao 27px CSS (trước 13px). Chạm vào đó thì có câu giải thích, không mất nước |
| 9 | Fixed | Cứu trợ Nam châm ở L5: bấm Nam châm thì bàn tay chuyển xuống hàng ô (y 167 so với ô y 141), 4 ô sáng |
| 10 | Fixed | L5 vào Overtime, Hoàn tác, đi tiếp: HUD giữ ∞, không phát lại âm/thông báo Overtime |
| 11 | Fixed | Quảng cáo giả hiện "Quảng cáo · (Quảng cáo giả lập)" |
| 12 | Fixed | Ô Chương 2 khi khoá: "Bến Cảng · qua Level 10 để mở", dấu "LV 10", nút "Chơi Level 2" |
| 13 | Fixed | Bóng decor kế tiếp là hình khung ảnh mờ, nhận ra được (`dc-frame ghost`) |
| 14 | Fixed | Sau popup "Mới: Gợi ý", bàn tay chỉ nút Gợi ý. Có lỗi mới liên quan, xem N1 |
| 15 | Một phần | L4: bàn tay vẫn che chữ "châm" của nhãn "Nam châm" (khung bàn tay đè 50–64% nhãn trong phần lớn chu kỳ). L7: bàn tay che nhãn "Kính" trên lá vương miện. Ảnh `img/v2/l4-hand-covers-label.jpg` |
| 16 | Fixed | L7: sau khi bấm Con dấu, chỉ cột 4 sáng, lá trên cùng có viền sáng. Chạm sai cột: "Chạm cột đang sáng." kèm tiếng deny |

## Regression P0/P1 review game design (`docs/design/review-interaction-ftue-2026-10-10.md`)

| # | Trạng thái | Ghi chú |
|---|---|---|
| 1 | Fixed | L1: thả hụt vương miện ra giữa bàn. Toast "Đặt vào ô bàn tay chỉ nhé.", sau 0,3 giây bàn tay đã hiện lại |
| 2 | Fixed | Như QA #1 |
| 3 | Fixed | Sau bước 6 của L1, chạm bộ bài 6 lần liền đều được. Hoàn tác bật ngay |
| 4 | Fixed | Cột 1 của L1 là `~Fruit ~Pizza Cat*` |
| 5 | Fixed | L4: chạm lá hoặc bộ bài trước khi bấm Nam châm thì có toast "Chạm Nam châm đang sáng trước nhé." Bàn tay vẫn còn sau 0,8 giây và sau 5 giây |
| 6 | Fixed | Như QA #16 (L7). L9 cũng có cột sáng |
| 7 | Fixed | Như QA #7 |
| 8 | Chưa kiểm tra lại | Bàn dựng bằng `setState` không cho kết quả tin được (L1 lại chạy kịch bản) |
| 9 | Fixed | Chạm lá thứ 2 của quạt rút: "Chỉ dùng được tem rút trên cùng." kèm tiếng deny |
| 10 | Fixed | Panel kẹt chỉ hiện booster dùng được, kèm giá. Huỷ Nam châm hoặc Tem Vàng thì panel hiện lại, không trừ xu. Đóng panel Ô phụ thì panel kẹt hiện lại. Hết bài rồi chạm bộ bài thì panel kẹt hiện |
| 11 | Fixed | Tem Vàng cứu trợ ở L5: có câu "Đặt Tem Vàng lên một cột…", cả 4 cột sáng. Chạm ra ngoài thì báo "Chạm cột đang sáng.", không huỷ được |
| 12 | Fixed | Như QA #5 |
| 13 | Fixed | Màn thắng L1: có dòng "Dùng Tem Điểm để trang trí bưu điện của bạn." và nút "Trang trí: Cờ dây". Bấm nút thì về màn hình chính và mở bảng Trang trí |
| 14 | Fixed | L12/L13/L14: câu "Tem mới: Vỏ ốc / Hải sản / Hàng hải…". Tem vương miện chủ đề mới nằm ngửa trên đỉnh cột ở cả 4 level L11–L14 (L11 có câu "Tem mới: Thuyền buồm" khi vào lần đầu) |
| 15 | Chưa kiểm tra lại | Độ khó cần mô phỏng nhiều ván, không đo bằng chơi tay |
| 16 | Fixed | Không level nào chứa cả Seafood và Shells, ở cả bản A (`levels.js`) và bản B (`levels_b.js`) |
| P2 #23 | Một phần | Thiếu xu không còn ghi `level_fail` 2 lần. Có nút "Trang chủ". Nhưng toast "Không đủ xu" vẫn bị lớp mờ che (xem N2) |

## Lỗi mới

| # | Mức | Level/màn | Bước tái hiện | Thực tế | Mong đợi | Ảnh |
|---|---|---|---|---|---|---|
| N1 | Major | L2–L5, câu gợi ý theo ngữ cảnh (vd. "Hết tem hợp? Chạm bộ bài." ở L3, "Tem vương miện: mở ô mới." ở L2) | Save chưa thấy câu gợi ý. Lúc câu gợi ý và bàn tay đang hiện, làm 1 trong 3 việc: (a) kéo một lá rồi thả vào chỗ trống; (b) bấm Gợi ý; (c) ở L2, câu "Tem vương miện" bật đúng lúc popup "Mới: Gợi ý" | (a) Bàn tay mất ngay. Câu chữ tự ẩn sau khoảng 5 giây. 60 giây sau đó không có bàn tay nào. (b) Gợi ý hiện 6 giây rồi tắt, 34 giây tiếp theo không có bàn tay. (c) Chữ nói về tem vương miện nhưng bàn tay chỉ nút Gợi ý, tay tắt sau 1,4 giây, 40 giây không có gì. Trong cả 3 trường hợp, gợi ý khi đứng yên (7/12/20 giây) không chạy | Bàn tay của câu gợi ý tự hiện lại (như bộ hẹn giờ của kịch bản L1), hoặc huỷ câu gợi ý để gợi ý khi đứng yên chạy tiếp | `img/v2/l2-tip-crown-hand-on-hint-360.jpg` |
| N2 | Minor | Panel Hết nước | Xu < 300. Hết nước, bấm nút mờ "+5 nước 300 xu · Thiếu 100 xu" | Toast "Không đủ xu" nằm ở `#ui`, dưới lớp mờ của panel vừa mở lại, nên không nhìn thấy. Chỉ có tiếng click, không có deny | Toast nổi trên lớp mờ, có tiếng deny | `img/v2/oom-short-coins-no-toast.jpg` |
| N3 | Minor | SFX | Đọc log SFX qua mọi màn đã test | `popup.mp3` được nạp (`audio.js`) nhưng không có chỗ nào gọi `sfx('popup')`. Bảng kẹt, Ô phụ, Trang trí, Hết nước, "Sắp có level mới" mở ra không có âm riêng | Nối `popup` khi mở các bảng không có âm riêng, hoặc bỏ khỏi danh sách nạp | – |
| N4 | Minor | Âm báo từ chối | (a) L5 cứu trợ Tem Vàng, chạm ra ngoài cột. (b) L1 trong kịch bản, bấm nút Hoàn tác đang mờ | Có toast ("Chạm cột đang sáng." / "Chưa được! Làm theo bàn tay.") nhưng im lặng. Các chỗ từ chối khác đều có deny | Phát `deny` cho thống nhất | – |
| N5 | Minor | L7, kịch bản Con dấu | Bấm Con dấu, rồi chạm bộ bài | Không có chữ, không có âm, chế độ chọn cột vẫn giữ. Ở L9 (Tem Vàng), cùng thao tác này báo "Chạm cột đang sáng." kèm deny | Báo như L9 | – |
| N6 | Minor | Lá vương miện, chữ nhỏ | L11, xem lá vương miện "Thuyền buồm" ở 375×812 | Tên chủ đề co còn 8,3px CSS, chữ chạm viền khung vàng (cách mép lá 5px). Số đếm "0/5" đè lên viền trên trái. Tên ngắn ("Vỏ ốc", "Hải sản") 11,8px. Badge giá booster ("150", "250") 9px | Tên dài xuống dòng hoặc giữ ≥ 11px. Số đếm nằm trong khung | `img/v2/l11-crown-label-small.jpg` |
| N7 | Minor | Chạm đúp (L18) | Chạm bộ bài 4 lần, mỗi lần cách khoảng 100ms. Bấm Hoàn tác 3 lần nhanh. Chạm đúp một lá có nước đi (cách 90ms hoặc 250ms) | Bộ bài: rút 4 lá, mất 4 nước. Hoàn tác: lùi 3 nước, lượt miễn phí 5 → 2. Lá: lá đi, lần chạm thứ 2 trúng lá vừa lộ bên dưới và đi tiếp, mất 2 nước. Riêng khoảng cách 150ms chỉ tính 1 | Gộp chạm đúp trong khoảng ngắn (vd. < 300ms) thành 1, nhất là bộ bài và Hoàn tác | – |
| N8 | Minor | Bộ test `tests/drag-scenarios.browser.js` và `tests/naive-drag.browser.js` | Chạy `runAll()` trên save trống | `initPool` đóng panel bằng `.click()`, trong khi nút panel chỉ nghe `pointerup`. Bảng "Cách chơi" của L3 vì thế không đóng, test treo hơn 20 phút cho tới khi đóng bảng bằng tay. `naive-drag` dùng cùng cách đóng | Test đóng panel bằng `pointerup` | – |

## Góc nhìn người lớn tuổi
- **Toast:** báo lỗi hiện 2,2–2,4 giây. Cứu trợ hiện lâu hơn: "Bí rồi? Tặng bạn Nam châm…" 4,8 giây, "Bí rồi? Tặng bạn Tem Vàng!" 3,9 giây, Overtime 4,2 giây. Câu 8–9 chữ trong 2,4 giây là đọc vừa kịp, không dư. Toast không bị cắt giữa chừng trừ khi có toast mới.
- **Đứng yên ở L1:** trong kịch bản, bàn tay lặp liên tục (có mặt 82% thời gian trong 14 giây). Sau kịch bản, gợi ý lặp ở 7, 19, 39 giây.
- **Đứng yên khi có câu gợi ý ở L2–L5:** dễ mất hết chỉ dẫn (N1). Người hay thả hụt sẽ gặp lỗi này.
- **Chữ:**
  - Nhãn booster và Hoàn tác 12,5px.
  - Tên chủ đề trên ruy băng khay và lá vương miện tên ngắn 11,8px.
  - Tên dài trên lá vương miện 8,3px (N6). Badge giá 9px.
  - Không chữ nào tràn khỏi phần tử ở 375 và 360.
- **Nhãn EN "Golden Stamp":** vừa khít, cách mép phải màn hình 4px ở cả 375 (297–371) và 360 (285–356). Không chồng lên "Stamper". Ảnh `img/v2/en-booster-bar-375.jpg`, `img/v2/en-booster-bar-360.jpg`.
- **Ribbon khay:** "Sinh vật biển", "Khủng long", "Trái cây" nằm gọn trong ribbon.
- **Undo:** 5 lượt miễn phí (badge 5 → 1), lượt 6 và 7 tính 30 xu mỗi lượt. Khi chuyển sang trả xu không có câu báo, chỉ có badge đổi thành đồng xu "30".
- **Chạm nhầm:**
  - Chạm lá úp: toast "Tem úp. Dọn tem phía trên trước." kèm âm `facedown`.
  - Thả hụt trong kịch bản L1: được chỉ lại ngay.
  - Chạm đúp bị tính 2 lần (N7).
- **360×640:**
  - Bảng thắng có 3 nút (đáy nút cuối ở y 493/640), bảng Cách chơi và popup Gợi ý đều nằm gọn trong màn.
  - Toast và câu gợi ý không che lá ở L1–L2.
  - Ở 360 chỉ chơi L1–L2; L3–L4 chỉ chơi ở 375.
- **Giảm chuyển động (`prefers-reduced-motion: reduce`):** 0 animation lặp vô hạn trong L5 (bình thường có 2: `bob`, `pulse`). Bàn tay vẫn chạy (JS), nên vẫn có chỉ dẫn.
- **Icon:** booster Tem Vàng dùng hình mũ hề (joker), không giống một con tem. Đây là ghi chú về hình, không tính là lỗi.

## SFX gọi đúng sự kiện

| Sự kiện | Âm ghi được | Kết quả |
|---|---|---|
| Đi sai, kéo sai đích, chạm sai bước kịch bản | `deny` (không còn `close`) | Đúng |
| Chạm lá úp | `facedown` | Đúng |
| Hoàn tác sau khi gửi thư | `click`, `deny` + "Thư đã gửi thì không lấy lại được." | Đúng |
| Vào Overtime (L5) | `overtime` | Đúng, chỉ 1 lần, không lặp sau Hoàn tác |
| Đặt decor (chương 1 và chương 2) | `click`, `decor` | Đúng |
| Hết chương 1, hết chương 2 | `chapter` (sau `win`, `stamp`×3) | Đúng |
| Lật lại bộ bài | `recycle` | Đúng |
| Tem Điểm ở màn thắng | `stamp`, `claim` ×3 | Đúng |
| Teaser và màn Chương 2 | `stamp` | Đúng |
| Đóng Album, đóng teaser | `close` | Đúng |
| Mở bảng (kẹt, Ô phụ, Hết nước…) | không có âm riêng | `popup` không được gọi (N3) |
| Tem Vàng cứu trợ: chạm ra ngoài cột; Hoàn tác trong kịch bản | im lặng | Thiếu `deny` (N4) |
| L7: chạm bộ bài khi đang chọn cột | im lặng | Thiếu phản hồi (N5) |
| Thiếu xu ở bảng Hết nước | chỉ `click` | Thiếu `deny` (N2) |

## PASS
- Save trống: màn hình chính, "Chơi Level 1" mở kịch bản L1. Đi hết 7 bước bằng chạm/kéo thật.
- L1: chạm thay cho kéo vẫn được. Chạm bộ bài sớm bị từ chối có lời, bàn tay vẫn còn.
- L1 thắng: +3 Tem Điểm kèm câu giải thích. Nút "Trang trí: Cờ dây" đưa về màn hình chính và mở bảng Trang trí. Đặt được Cờ dây, nút còn "Trang trí 1".
- Album sau L1 chỉ liệt kê chủ đề của L1–L2 (13/37 tem).
- L2: bảng Cách chơi hiện một lần. Popup "Mới: Gợi ý" sau đúng 6 nước, +3 lượt.
- L4: rules → popup "Mới: Nam châm" → bấm Nam châm hút 2 tem vào ô Khủng long. Còn 1 Nam châm.
- L7: Con dấu lật 5 lá úp của cột sáng.
- L9: tặng 2 Tem Vàng, kịch bản dùng 1, còn 1. Câu "Tem nào cũng xếp được lên Tem Vàng…" hiện sau khi đặt.
- L5 kẹt cứng: tặng Nam châm, bàn tay chỉ nút. Hút xong vẫn kẹt thì tặng Tem Vàng, đặt được. Tem Vàng miễn phí không trừ vào kho.
- Panel kẹt ở level thường (L19): đủ nút, hiện lại sau khi huỷ. Không trừ xu khi huỷ.
- Hết nước: có +5 quảng cáo, +5 xu, Chơi lại, Trang chủ. Lần thứ 2 vẫn còn quảng cáo nếu lần đầu dùng xu. Nút Trang chủ về màn hình chính. Mỗi lần hết nước ghi đúng 1 `level_fail`.
- Hết chương 1: popup "Xong chương 1!" (+200), nút "Chương 2 →" vào thẳng L11. L11 có câu "Tem mới: Thuyền buồm…" và tem vương miện ngửa sẵn.
- Màn hình chính chương 2: lưới L11–L20, ô "← Chương 1 · Phố Chính" chuyển qua lại được. Decor đổi theo chương. Đặt Quạt trần ở chương 2 được.
- Hết L20: popup "Xong chương 2!", nút Play đổi thành "Sắp có level mới" và mở popup đúng.
- Đổi ngôn ngữ giữa ván (L19, đã đi 3 nước): chữ đổi sang EN, `used`/`moves`/bộ bài giữ nguyên, không ghi thêm `level_start`.
- Hai ngón kéo hai lá cùng lúc: không lá lạc, không lá kẹt trạng thái nhấc, mọi lá đúng vị trí layout.
- `tests/drag-scenarios.browser.js`: 13/13 PASS, sau khi đóng tay bảng Cách chơi (N8).
- `tests/naive-drag.browser.js`:
  - L3 (seed 7) và L5 hasty (seed 3): không báo lỗi.
  - L12 hasty (seed 11): lần chạy đầu, lúc câu "Tem mới" đang hiện, báo 2 HIT_MISS (điểm bấm trúng một phần tử không có class). Chạy lại: 0. Chưa xác định được phần tử che.
