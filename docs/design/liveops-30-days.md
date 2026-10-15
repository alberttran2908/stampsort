# Tính năng và event 30 ngày (theo mẫu Grand Games)

**Ngày:** 2026-10-15 · **Tác giả:** game-designer agent · **Trạng thái:** đề xuất thiết kế, chưa sửa code.
**Yêu cầu của người dùng:** "nội dung và tính năng cho người chơi chơi được tới ngày 30, số lượng level và live ops function cũng kha khá". Bổ sung: "nói Live Ops thì cũng không đúng hoàn toàn, bạn cứ xem game của Grand là dễ hiểu nhất" và "họ làm nội dung và function bài bản".
**Đã chốt, không bàn lại:** luật A mặc định, level thường vẫn thua như ABI, được dùng level ABI (chọn ứng viên tốt nhất), đối tượng lớn tuổi và chill, không dark pattern, chuẩn chất lượng Grand Games.
**Quan hệ với tài liệu khác:** bổ sung cho `30-day-plan.md` (file đó do Level Dev giữ, tài liệu này không sửa nó). Các vòng L1–L14 ở mục 9 **thay** R15, R16, R18 và **gộp** một phần với R19, R22. Event E1–E5 gốc nằm ở `benchmark-grand-games.md` mục 9.

**Nhãn nguồn:**

| Nhãn | Nghĩa |
|---|---|
| `[GG-n]` | Nguồn về Grand Games, số `n` tra ở mục 12 |
| `[APK]` | Chuỗi trong `research/raw/com.stamp.solit/assets/bin/Data/Managed/Metadata/global-metadata.dat` (bản 0.9.5, không commit), lấy bằng `strings`. Hoặc level data ở `research/apk/com.stamp.solit/levels/` |
| `[STORE-ABI]` | Store listing Stamp Solitaire, `teardown-stamp-solitaire.md` |
| `[CODE]` | `prototype/stamp/src/main.js` |
| `[DOC]` | Tài liệu trong repo |
| `[GIẢ THUYẾT]` | Suy luận hoặc ước tính, cần đo |

---

## 0. Tóm tắt quyết định

| Hạng mục | Đề xuất |
|---|---|
| Khuôn mẫu | Bộ tính năng của Grand Games (Magic Sort là chính, Block Out và Car Match bổ sung), chuyển sang theme bưu điện. ABI chỉ dùng khi Grand không có và thật cần |
| Số function | **13 function** người chơi gặp trong 30 ngày: 3 event lớn xoay vòng, 1 event nhỏ, 6 function thường trực, 3 function hỗ trợ (mục 6) |
| Lịch | **Chu kỳ cố định 28 ngày tính theo ngày của người chơi**, chạy local theo đồng hồ máy, tối đa 1 event lớn cùng lúc (mục 3) |
| Màn chính | **5 điểm chạm**: Chơi, Thư hôm nay, ô Event (1 ô), Album, Trang trí. Xu và Cài đặt nằm trên HUD |
| Level | **Chiến dịch 240** (sàn 200), **Daily Post 90**, **0 level riêng cho event**. Tổng 330, cần làm mới 310. Dự kiến khoảng 75 từ ABI (khoảng 24%), khoảng 235 tự sinh (mục 7) |
| Backlog | 14 vòng L1–L14 (mục 9) |

---

## 1. Grand Games tổ chức nội dung và function thế nào

### 1.1 Năm nguyên tắc "bài bản" rút ra từ bằng chứng

| # | Nguyên tắc | Bằng chứng | Áp cho mình |
|---|---|---|---|
| N1 | **Nhịp nội dung cố định, không đổi định dạng.** Mỗi bản cập nhật ghi cùng một câu, cùng một lượng nội dung | Magic Sort: 25 bản từ 21/2 tới 5/10, bản nào cũng "New 100 levels", khoảng 9 ngày một bản `[GG-1]`. Car Match: 25 bản, gần như bản nào cũng "100 new levels" kèm "Multiple New Events and Offers" `[GG-3]` | 1 chương 20 level kèm 6 decor và 3 chủ đề tem mới mỗi 2 tuần sau launch. Ở bản launch, có sẵn đủ cho 30 ngày cộng buffer |
| N2 | **Khu vực mới và chướng ngại mới theo lịch riêng, chậm hơn level** | Block Out: khu vực mới đúng 2 tuần một lần (Florence 6/7, Mona Lisa 20/7, Perfect Portrait 17/8, Dino Discovery 31/8, Jurassic 14/9, Egg Trouble 28/9, Dino Chase 13/10). Chướng ngại mới khoảng 4 tuần một lần (Color Shutter, Hay Block, Ivy, Multilayer, Color Grinder, Locked Shutter) `[GG-2]` | Khu mới = chương (20 level). Biến thể cấu trúc mới (3 khay, Bao thư lớn, 5 cột, ô mở sẵn) theo `30-day-plan.md` mục 3.4, khoảng 1 cái mỗi 1–2 chương |
| N3 | **Ít template event, xoay vòng, thêm template mới rất chậm** | Magic Sort có khoảng 4–6 template (Broom Streak, Magic Streak, Jetpack Race, Sky Jump, Coin Rush, Treasure Drill). Event mới khoảng 2 tháng một lần `[GG-4][GG-5][GG-1]`. Block Out thêm 1 event hoặc "journey" mỗi 1–2 tháng: journey 11/5, 25/5, 8/6; Streak Race 8/6; Mission Carnival 24/7; Balloon Ride 3/8; Lily Leap 10/8 `[GG-2]` | 3 template event lớn (Tuyến đưa thư, Tem theo mùa, Tuần việc vặt) và 1 event nhỏ (Cuối tuần xu đôi). Thêm template thứ 4 sau D30, không trước |
| N4 | **Event chạy trên level chính, không cần level riêng** | Broom Streak, Sky Jump, Jetpack Race đều tính bằng số level chính thắng liên tiếp `[GG-5]`. Coin Rush là thưởng xu khi chơi level `[GG-6]` | Mọi event lớn đếm thắng ở chiến dịch và Daily Post. Không sản xuất level riêng cho event |
| N5 | **Mỗi function có một vòng thưởng rõ ràng và một cách cứu thất bại** | Daily puzzle có "daily challenge completion tracker" `[GG-4]`. Thua thì mua thêm 1 chai rỗng bằng xu để chơi tiếp, đây là nguồn IAP chính `[GG-4]`. Độ khó thích ứng: thua lần đầu ở L26 thì lần sau bớt 1 màu `[GG-4]`. Có cauldron biến nguyên liệu thành booster `[GG-1]` | Mỗi function ở mục 6 ghi: hành động, tiến độ thấy được, phần thưởng, và "thua thì sao". Cứu thua: +5 lượt (đã có), "Thử lại nhẹ tay" (F11) |

**Những gì chưa xác minh được về Grand Games** (không bịa, ghi rõ để đo ở vòng P0 của `benchmark-grand-games.md`):
- Level mở từng tính năng của Magic Sort. Nguồn công khai chỉ có: event xuất hiện "khá sớm" `[GG-5]`, interstitial từ L22 `[GG-6]`, DDA ở L26 `[GG-4]`. Bài phân tích level 1–300 của Gamigion nằm sau paywall.
- Số icon trên màn chính Magic Sort ở các mốc level.
- Cơ chế của Treasure Drill (chỉ thấy tên trong review và một gói IAP 24,99 USD) `[GG-1]`.
- "NEW SEASON Nature Collection: complete sets, unlock grand rewards, grab a special token for your profile" chỉ thấy trong đoạn trích kết quả tìm kiếm của App Store (vùng mo). Mở trang thì không thấy `[GG-1, chưa xác minh]`. Car Match thì xác nhận có "collection event" từ 26/2 `[GG-3]`.

### 1.2 Bảng chuyển đổi: Grand Games → Little Post Office

Cột "ABI" để biết đối thủ trực tiếp có gì. Cột "Quyết định" ghi lý do giữ, đổi hay bỏ.

| Nhóm | Bản gốc ở Grand Games (nguồn) | ABI có không (nguồn) | Bản của mình | Quyết định và lý do |
|---|---|---|---|---|
| Nhịp level | 100 level mỗi khoảng 9 ngày `[GG-1]` | 963 level ở 0.9.5, sau L50 chỉ 3 template `[APK]` | 240 level ở launch, sau đó 20 level mỗi 2 tuần | **Giữ tinh thần, chậm hơn.** Người lớn tuổi chơi khoảng 2–4 level mỗi ngày (mục 5), không cần 100 level mỗi 9 ngày |
| Khu vực | Area mới mỗi 2 tuần (Block Out) `[GG-2]` | Không | Chương = khu thị trấn mới, 6 decor, 3 chủ đề tem mới | **Giữ.** Đã có khung chương |
| Daily puzzle | Daily puzzle kèm tracker hoàn thành `[GG-4]`. Review: "dailies can be way too hard" `[GG-1]` | Không có bằng chứng `[STORE-ABI]` | **F1 Thư hôm nay** kèm **F2 Sổ dấu ngày** (tracker) | **Giữ, làm dễ.** Daily dễ hơn level thường (`c25` ≥ 0.97), tránh đúng lời chê của Magic Sort |
| Quà hằng ngày | "refreshed Daily Gift" (Block Out 8/6) `[GG-2]` | `LastLoginDate` `[APK]` | **F4 Thư buổi sáng** | **Giữ, bỏ thang tăng dần.** Giá trị cố định, không có ngày bị lỡ |
| Event milestone solo | Broom Streak: thắng liên tiếp không thua để lên mốc `[GG-4][GG-5]` | Climbing Quest (0.17+) `[STORE-ABI]` | **E1 Tuyến đưa thư** | **Đổi luật:** thua không mất tiến độ, chỉ không tiến. Người lớn tuổi sợ "mất chuỗi" |
| Event chuỗi trả tiền giữ chuỗi | Sky Jump, Lily Leap. Trả khoảng 7 EUR xu để giữ chuỗi, thưởng không bằng giá một lần nối `[GG-5][GG-2]` | Key `WinStreak` `[APK]` | Không có | **Bỏ.** Đây là chỗ Magic Sort bị chê nhiều nhất `[GG-5]`, và là dark pattern với nhóm của mình |
| Event đua và leaderboard | Magic Streak, Jetpack Race, Streak Race. 3 leaderboard tuần, quốc gia, toàn cầu `[GG-4][GG-2]` | Không | Không có ở D1–D30 | **Bỏ.** Cần server, tạo áp lực so sánh. Sau D30, nếu có backend, cân nhắc "mục tiêu chung của thị trấn" (co-op ẩn danh) |
| Event collection | Collection event (Car Match 26/2) `[GG-3]`. "Collectible cards" trong review Magic Sort `[GG-1]` | Album là meta chính `[STORE-ABI]`. Push "Your album isn't complete yet" `[APK]` | **E2 Tem theo mùa** | **Giữ.** Hợp nhất fantasy sưu tầm tem, nối vào album sẵn có |
| Event nhiệm vụ | Mission Carnival (Block Out 24/7) `[GG-2]` | Module `DailyMission`: `MissionManager`, `DailyTaskContainer`, `IsClaimMissionChest` `[APK]` | **E4 Tuần việc vặt** | **Giữ dạng event xoay vòng**, không làm nhiệm vụ ngày thường trực (thêm điểm chạm và cảm giác "việc nhà") |
| Event xu | Coin Rush `[GG-6]` | Không | **E3 Cuối tuần xu đôi** | **Giữ, làm nhẹ.** Chỉ cuối tuần, không đếm ngược |
| Journey | "New journey" (Block Out 11/5, 25/5, 8/6), Balloon Ride (3/8) `[GG-2]` | Không | Gộp vào **E1** (bản đồ tuyến có cảnh theo khu) | **Gộp.** Không rõ journey là chế độ riêng hay event. Bản của mình chỉ cần một bản đồ tiến độ |
| Booster meta | Cauldron: gom nguyên liệu, nấu booster `[GG-1]` | `RewardChest` (namespace AnimalRestaurant) `[APK]` | **F5 Túi thư của Pip** | **Giữ, đơn giản hoá.** Không thêm loại tiền: thắng level thì túi đầy dần, đầy thì ra 1 booster |
| Cứu thua | +1 chai rỗng bằng xu `[GG-4]` | Hộc phụ 1000 xu hoặc ad, có lives `[APK]` | +5 lượt (300 xu, đã có `[CODE]`), Ô phụ | **Giữ như hiện tại.** Giá do PO chốt |
| Độ khó thích ứng | Thua lần đầu ở L26 thì lượt sau bớt 1 màu `[GG-4]` | Không có bằng chứng | **F11 Thử lại nhẹ tay** | **Giữ.** Level vẫn thua được (đã chốt), chỉ lần thử sau dễ hơn |
| Lives | Có, team xin lives `[GG-1]` | 5 tim, Infinity Heart `[APK]` | Không | **Bỏ** (đã chốt, Won't trong `30-day-plan.md`) |
| Teams, chat | Teams (Car Match 26/2), xin lives trong team `[GG-3][GG-1]` | Không | Không | **Bỏ ở D1–D30.** Cần server và kiểm duyệt chat |
| Pass | Block Pass 9,99 USD `[GG-2]` | Không | Không ở D1–D30 | **PO quyết.** Nếu làm, gắn vào E2 (track miễn phí giữ nguyên) |
| Gói ưu đãi | Starter, Special Offer, Endless Portal, Choose One `[GG-1]` | Piggy bank, VIP pack, 6 gói xu `[APK]` | Không thiết kế ở đây | **PO quyết** giá và có hay không |
| Vòng quay may mắn | Không thấy | `SpinUI`, `LastSpinDate`, `SpinCountToday` `[APK]` | Không | **Bỏ.** Grand không có, cảm giác cờ bạc |
| Thông báo | Không rõ | `NotificationManager`, câu push "New stamps are waiting!", "Ready for a relaxing challenge?" `[APK]` | **F9 Thông báo nhẹ** | **Thêm vì thật cần** cho D7/D30 khi không có server. Mặc định tắt, tối đa 1 lần mỗi ngày |
| Chào mừng quay lại | Không rõ | Không có bằng chứng | **F6 Chào mừng quay lại** | **Thêm** (đã có trong plan S2). Nhóm lớn tuổi hay nghỉ vài ngày |
| Thẻ tuần | Không rõ | Không | **F3 Thẻ tuần 5/7** | **Thêm** (plan M4). Thay cho streak, không phạt |
| Nhắc nghỉ | Không | Không | **F10 Nhắc nghỉ 45 phút** | **Thêm** (plan S4). Phù hợp người lớn tuổi |

Ghi chú về `[APK]`: các class trên có trong metadata, nhưng cùng file còn có key của game ABI khác (`keyLevelUnlock_ColorBlockJam`, `BagTutorial`, `ConveyorTutorial`, namespace `AnimalRestaurant`). Codebase dùng chung nên **có class chưa chắc là tính năng đang bật** `[GIẢ THUYẾT]`. Video level 1–9 không thấy spin, mission hay piggy bank trên màn chính `[DOC teardown-video-apk-0.9.5.md]`.

**Có trong gợi ý nhưng không đưa vào:** "thử thách theo chủ đề" với level riêng. Grand không có, metadata ABI không có class tương ứng, và nó cần level riêng. Phần "theo chủ đề" đã có ở E2 (tem mùa theo tháng thật).

---

## 2. Bảng mở khoá tính năng theo level

Quy tắc mở khoá (theo Grand Games: mở dần, onboarding nhanh `[GG-5]`, và `benchmark-grand-games.md` mục 1):
1. **Không function meta nào mở trước L5.** L1–L4 chỉ có core và booster.
2. **Mỗi level tối đa 1 thứ mới.** Mỗi phiên tối đa 1 popup "Tính năng mới". Nếu 2 thứ cùng đến hạn thì thứ sau đợi lần mở app kế tiếp.
3. Mở khoá theo **level đã thắng**. Event còn phải khớp với lịch (mục 3). Đủ level mà ngoài lịch thì ô Event trống.
4. Popup mở khoá: 1 câu, 1 hình, 1 nút "Xem". Không có hướng dẫn nhiều bước.

| # | Tính năng | Mở khi | Người lớn tuổi gặp ở | Người nhanh gặp ở | Lần đầu gặp thấy gì |
|---|---|---|---|---|---|
| — | Core, Undo 5 lượt | L1 | D1 | D1 | Có sẵn |
| — | Gợi ý, Ô phụ | L2 | D1 | D1 | Có sẵn, tặng 3 Gợi ý `[CODE GIFTS]` |
| — | Trang trí (Tem Điểm) | Có sẵn | D1 | D1 | Nút sáng khi đủ điểm món đầu |
| — | Nam châm | L4 | D1 | D1 | Có sẵn, tặng 2 |
| F1, F2, F3 | Thư hôm nay, Sổ dấu ngày, Thẻ tuần | **L5** | D1 | D1 | Nút "Thư hôm nay" xuất hiện trên màn chính, có chấm đỏ. Thẻ tuần và Sổ dấu ngày nằm trong panel của nó |
| — | Con dấu | L7 | D1 | D1 | Có sẵn, tặng 2 |
| E3 | Cuối tuần xu đôi | L8 và hôm đó là Thứ Bảy hoặc Chủ nhật | Thứ Bảy đầu tiên | Thứ Bảy đầu tiên | Dải băng "Cuối tuần vui vẻ, xu thắng ×2" |
| — | Tem Đa Năng | L9 | D1 | D1 | Có sẵn, tặng 2 |
| F4 | Thư buổi sáng | Lần mở app đầu tiên của ngày lịch thứ 2 trở đi, đã qua L5 | D2 | D2 | Pip đưa phong bì, 1 chạm để nhận |
| F11 | Thử lại nhẹ tay | L11, sau lần thua thứ 2 liên tiếp ở cùng level | Khi gặp | Hiếm | Câu "Lần này Pip xếp gọn giúp bạn một chút" |
| E1 | Tuyến đưa thư | **L12** và đang trong cửa sổ của E1 | D2 | D1 | Icon túi thư ở ô Event, popup bản đồ tuyến |
| F5 | Túi thư của Pip | **L15** | D3 | D1 | Thanh nhỏ dưới nút Chơi |
| F9 | Hỏi quyền thông báo | Sau khi hoàn thành Thư hôm nay lần thứ 3 | D3 | D3 | Hỏi 1 lần, có nút "Để sau" |
| E2 | Tem theo mùa | **L20** và trong cửa sổ của E2 | D8 (theo lịch) | D8 | Tem mùa xuất hiện trên 1 lá, bay vào ô Event |
| E4 | Tuần việc vặt | **L30** và trong cửa sổ của E4 | D22 (theo lịch) | D22 | Bảng 5 việc của bưu điện |
| F6 | Chào mừng quay lại | Vắng ≥ 3 ngày lịch | Khi gặp | Khi gặp | Pip giữ thư cho bạn |
| F10 | Nhắc nghỉ | Chơi liên tục 45 phút | Khi gặp | D1 | Câu nhắc, tắt được |

---

## 3. Lịch event xoay vòng cố định

### 3.1 Cách tính lịch (local, không cần server)

- **Ngày của người chơi** `pd` = số ngày lịch (giờ máy, múi giờ máy) từ lần mở app đầu tiên, bắt đầu từ 1. Ngày đổi lúc 00:00 giờ máy.
- **Chu kỳ 28 ngày** tính theo `pd`. Chu kỳ `k = floor((pd − 1) / 28)`, ngày trong chu kỳ `cd = ((pd − 1) mod 28) + 1`.
- **Event nhỏ E3** tính theo **thứ trong tuần thật** (Thứ Bảy, Chủ nhật). **Thẻ tuần F3** tính theo **tuần lịch thật** (Thứ Hai tới Chủ nhật).
- **Lý do chọn ngày của người chơi, không chọn lịch toàn cầu:** (1) chưa có backend để đồng bộ; (2) người mới không vào giữa một event 14 ngày đã chạy được 12 ngày (không FOMO); (3) trải nghiệm D1–D30 tất định nên mô phỏng được chính xác (mục 10). Grand Games nhiều khả năng dùng lịch toàn cầu vì có leaderboard `[GIẢ THUYẾT]`. Khi có Remote Config, có thể chuyển sang lịch toàn cầu sau D30 bằng cờ `schedule_mode`.

### 3.2 Lịch chu kỳ 28 ngày

| Ngày trong chu kỳ `cd` | Ô event lớn (tối đa 1) | Điều kiện level | Ghi chú |
|---|---|---|---|
| 1 | Chu kỳ đầu: trống (D1 là ngày học chơi). Từ chu kỳ 2: E1 bắt đầu (E1 chạy `cd` 1–7) | | Vì vậy D29 mở Tuyến đưa thư #2 |
| 2–7 (6 ngày) | **E1 Tuyến đưa thư** | ≥ L12 | Cảnh tuyến đổi theo chu kỳ: Phố Chính, Bến Cảng, Đồi Trà... |
| 8–21 (14 ngày) | **E2 Tem theo mùa** | ≥ L20 | Hình tem mùa theo **tháng thật**: tháng 3–5 hoa, 6–8 vỏ sò, 9–11 lá phong, 12–2 bông tuyết |
| 22–28 (7 ngày) | **E4 Tuần việc vặt** | ≥ L30 | 5 việc rút tất định từ pool theo `k` |

Từ chu kỳ thứ 2, `cd = 1` thuộc E1 (E1 dài 7 ngày, `cd` 1–7). Nhịp này lặp vô hạn cho tới khi có Remote Config.

**Event nhỏ chạy chồng được** (không chiếm ô event, không thêm điểm chạm):

| Event nhỏ | Khi nào | Hiển thị |
|---|---|---|
| E3 Cuối tuần xu đôi | Thứ Bảy, Chủ nhật (giờ máy), ≥ L8 | Dải băng không bấm được ở đỉnh màn chính, nhãn "×2" ở màn thắng |

**Không bao giờ có 2 event lớn cùng lúc.** Nếu người chơi chưa đủ level cho event đang chạy, ô Event hiện "Mở ở Level N" mờ (không phải nút).

### 3.3 Edge case của lịch

| Tình huống | Xử lý |
|---|---|
| Vắng nhiều ngày | `pd` vẫn tăng theo lịch. Event đã qua thì **quà đã đạt mà chưa nhận được tự trao** ở lần mở kế tiếp ("Pip giữ thư cho bạn"). Tiến độ dở dang không chuyển sang event mới |
| Đồng hồ máy lùi | Lưu `maxSeenDate`. Nếu ngày hiện tại < `maxSeenDate` thì coi như vẫn là `maxSeenDate`: không có Daily mới, không có quà sáng mới |
| Đồng hồ máy tiến (chỉnh giờ để gian lận) | Chấp nhận. Game một người chơi, không có bảng xếp hạng nên không ảnh hưởng ai. Nếu nhảy ≥ 3 ngày thì kích hoạt F6 như vắng thật |
| Qua nửa đêm khi đang chơi | Level đang chơi không đổi. Màn chính cập nhật khi quay về |
| Đổi múi giờ (du lịch) | Dùng ngày theo giờ máy hiện tại. Có thể được hoặc mất 1 ngày, chấp nhận |
| Cài lại app (mất localStorage) | Bắt đầu lại từ `pd = 1`. Ngoài phạm vi D1–D30 |

### 3.4 Dữ liệu (để dev làm ngay)

```js
// src/liveops/schedule.js  (đề xuất, chưa code)
export const CYCLE = 28;
export const BIG_EVENTS = [            // theo ngày trong chu kỳ cd
  { id: 'route',   from: 2,  to: 7,  minLevel: 12 },   // chu kỳ >= 2: from = 1
  { id: 'season',  from: 8,  to: 21, minLevel: 20 },
  { id: 'errands', from: 22, to: 28, minLevel: 30 },
];
export const SMALL_EVENTS = [{ id: 'weekend', days: [6, 0], minLevel: 8 }];  // getDay(): 6 = T7, 0 = CN
export function liveState(firstOpenDate, now, level) { /* trả { pd, k, cd, big, weekend, dailyIndex, week } */ }
```

Override qua `liveops.json` đóng gói cùng bản build (cùng khoá với Remote Config sau này): `schedule_mode`, `big_events`, `rewards`, `daily_pool_offset`, `kill_switch.<id>`. Thêm `?now=YYYY-MM-DD` và `?pd=N` trong chế độ `?debug` để test.

---

## 4. Màn chính: 5 điểm chạm

| Vị trí | Điểm chạm | Trạng thái | Ghi chú |
|---|---|---|---|
| Đáy giữa, to nhất | **1. Chơi (Level N)** | Luôn có. Thanh Túi thư Pip (F5) nằm ngay dưới, là một phần của nút | Nút chính duy nhất |
| Trái, ngang tầm mắt | **2. Thư hôm nay** | Từ L5. Chấm đỏ khi chưa chơi Daily hôm nay. Huy hiệu "5/7" của Thẻ tuần | Mở panel Daily, Thẻ tuần, Sổ dấu ngày |
| Phải, ngang tầm mắt | **3. Ô Event** | Icon của event lớn đang chạy. Vạch tiến độ nhỏ. Trống hoặc mờ khi không có | Chỉ 1 ô, dùng chung cho E1, E2, E4 |
| Đáy trái | **4. Album** | Luôn có | Thêm trang "Tem mùa" và "Sổ dấu ngày" |
| Đáy phải | **5. Trang trí** | Luôn có. Sáng khi đủ Tem Điểm cho món kế tiếp `[CODE decorBtn]` | |
| HUD trên | Xu (trái), Cài đặt (phải) | Không tính là điểm chạm chính | Theo `benchmark-grand-games.md` P9 |
| Đỉnh | Dải băng Cuối tuần (E3) | Không bấm được | |
| Popup tự hiện | Thư buổi sáng (F4), Chào mừng quay lại (F6), quà event đã qua | Tối đa 1 popup mỗi lần mở app, theo thứ tự ưu tiên F6 > quà event cũ > F4 | Gộp thành 1 phong bì nếu nhiều quà cùng lúc |

Mô phỏng và ảnh chụp phải chứng minh: ở mọi ngày D1–D30, số điểm chạm bấm được ở vùng chính ≤ 5.

---

## 5. Lịch D1–D30 theo người chơi

### 5.1 Nhịp giả định `[GIẢ THUYẾT]`

Thời gian lấy theo `30-day-plan.md` mục 1.2, chỉnh cho luật A (khoảng 1,9 nước mỗi lá với `o35`, nên level thường khoảng 6 phút một lần chơi). Level thường vẫn thua, nên tính thêm lần thử lại.

| Persona | Hồ sơ | Phút/ngày | Daily | Phút hiệu dụng mỗi level (gồm thử lại) | Level/ngày |
|---|---|---|---|---|---|
| **Lớn tuổi, đều đặn** (`o35`) | Chơi mỗi ngày | D1: 40, D2–7: 30, D8–30: 22 | 4 phút | L1–4: 3, L5–10: 5, L11+: khoảng 7 (6 phút × 1,2 lần) | D1: 9, D2–7: khoảng 3,5, D8+: khoảng 2,4 |
| **Nhanh** (`c10`, khoảng P90) | Chơi mỗi ngày | D1: 90, D2–7: 40, D8–30: 30 | 3 phút | L1–10: 3, L11+: khoảng 4,8 | D1: 22, D2–7: khoảng 7,5, D8+: khoảng 5,4 |

Giả định D1 là Thứ Hai (cuối tuần rơi vào D6–7, D13–14, D20–21, D27–28). Ngày khác thì E3 và Thẻ tuần dịch theo, event lớn không đổi. Số liệu thật thay bằng `content_days` và playtest 7 ngày.

### 5.2 Bảng theo ngày

"Lv cuối ngày" là level đã thắng cao nhất. Cột "Gặp mới" là của người lớn tuổi (người nhanh gặp sớm hơn, xem mục 2).

| Ngày | Thứ | Lớn tuổi: Lv cuối ngày | Nhanh: Lv cuối ngày | Người lớn tuổi gặp mới | Event lớn | Event nhỏ | Lý do quay lại ngày mai |
|---|---|---|---|---|---|---|---|
| D1 | T2 | 9 | 22 | Core, 4 booster (L2/4/7/9), **Thư hôm nay** (L5), Trang trí món 1–2 | — | | Thư hôm nay mới, ô 1/7 của Thẻ tuần, decor ch1 còn dở |
| D2 | T3 | 13 | 30 | **Thư buổi sáng**, hết chương 1 (L10, +200 xu, bưu thiếp), **Tuyến đưa thư** (L12) | E1 #1 Phố Chính | | Tuyến còn 15 trạm, quà ở trạm 5 |
| D3 | T4 | 16 | 37 | **Túi thư Pip** (L15), level khó L15 (Ca tối), hỏi quyền thông báo | E1 | | Túi thư sắp đầy, trạm 10 |
| D4 | T5 | 20 | 45 | Hết chương 2 (L20, SUPER), khu Đồi Trà mở | E1 | | Khu mới, decor ch3, chủ đề tem mới |
| D5 | T6 | 23 | 52 | Chủ đề tem mới đầu ch3 | E1 | | Thẻ tuần còn thiếu 0–1 ô, tuyến gần đích |
| D6 | T7 | 27 | 60 | **Cuối tuần xu đôi**, xong tuyến (quà trạm 20) | E1 | E3 | Xu đôi còn Chủ nhật, Thẻ tuần |
| D7 | CN | 30 | 67 | **Hộp Thẻ tuần** #1, level khó L30 | E1 (ngày cuối) | E3 | Event mới bắt đầu ngày mai (đã báo trước 1 câu, không đếm ngược) |
| D8 | T2 | 32 | 72 | **Tem theo mùa** (đã ≥ L20) | E2 Tem mùa | | Tem mùa trong Thư hôm nay, bộ 1 (8 tem) |
| D9 | T3 | 35 | 78 | | E2 | | Bộ 1 gần đủ |
| D10 | T4 | 37 | 83 | Bộ tem mùa 1 xong | E2 | | Bộ 2, decor ch3 món 5 |
| D11 | T5 | 40 | 89 | Hết ch3 (L40), khu Vườn Táo | E2 | | Khu mới, Bao thư lớn ở L41 |
| D12 | T6 | 42 | 94 | Bao thư lớn (`n = 8`) lần đầu | E2 | | Thẻ tuần, bộ 2 |
| D13 | T7 | 44 | 99 | | E2 | E3 | Xu đôi Chủ nhật |
| D14 | CN | 47 | 105 | Hộp Thẻ tuần #2, bộ 2 xong | E2 | E3 | Bộ 3 là decor hiếm |
| D15 | T2 | 49 | 110 | | E2 | | Bộ 3 |
| D16 | T3 | 52 | 116 | | E2 | | Bộ 3, decor ch4 |
| D17 | T4 | 54 | 121 | | E2 | | Bộ 3 còn vài tem |
| D18 | T5 | 56 | 126 | Bộ 3 xong: **decor hiếm mùa**, trang album mùa | E2 | | Decor ch4, Sổ dấu ngày gần đầy |
| D19 | T6 | 59 | 132 | | E2 | | Thẻ tuần |
| D20 | T7 | 61 | 137 | Hết ch4 (L60), khu Ga Tàu | E2 | E3 | Khu mới, xu đôi |
| D21 | CN | 64 | 143 | Hộp Thẻ tuần #3 | E2 (ngày cuối) | E3 | Event mới ngày mai |
| D22 | T2 | 66 | 148 | **Tuần việc vặt** (≥ L30). **Sổ dấu ngày trang 1 đầy** (20 dấu): decor kỷ niệm | E4 Việc vặt | | 5 việc trong tuần |
| D23 | T3 | 68 | 153 | | E4 | | Việc "Thư hôm nay 4 ngày" |
| D24 | T4 | 71 | 159 | | E4 | | Việc "thắng 8 level" |
| D25 | T5 | 73 | 164 | Level 5 cột lần đầu (L66) đã gặp ở D22 | E4 | | Hộp việc vặt |
| D26 | T6 | 76 | 170 | | E4 | | Hộp việc vặt, decor ch5 |
| D27 | T7 | 78 | 175 | Hộp việc vặt (đủ 5 việc) | E4 | E3 | Xu đôi |
| D28 | CN | 80 | 180 | Hết ch5 (L80), khu Đảo Xa. Hộp Thẻ tuần #4 | E4 (ngày cuối) | E3 | Tuyến mới ngày mai |
| D29 | T2 | 83 | 186 | **Tuyến đưa thư #2** (cảnh Bến Cảng) | E1 #2 | | Tuyến 20 trạm mới |
| D30 | T3 | 85 | 191 | | E1 #2 | | Tuyến, decor ch6, Sổ dấu ngày trang 2 |

**Đọc bảng:**
- Người lớn tuổi đến D30 ở khoảng **L85** (khoảng L85–105 nếu ván ngắn hơn như `30-day-plan.md` 1.2). Ngày nào cũng có ≥ 2 lý do quay lại, trong đó luôn có Thư hôm nay mới.
- Người nhanh đến D30 ở khoảng **L191**. Với 240 level còn khoảng 49 level (khoảng 9 ngày). Với 200 level thì hết ở khoảng D31–32: quá sát, nên 200 chỉ là sàn.
- Người lớn tuổi có "khoảnh khắc lớn" (khu mới, decor hiếm, hộp) ít nhất mỗi 3–4 ngày: D2, D4, D7, D11, D14, D18, D20, D22, D27, D28.

### 5.3 Persona phụ để kiểm tra không có FOMO

| Persona | Hồ sơ | Phải đạt |
|---|---|---|
| Lớn tuổi, chơi 5/7 ngày | Bỏ Thứ Tư và Thứ Sáu | Vẫn mở đủ 4 hộp Thẻ tuần. Tuyến đạt ≥ 15/20 trạm. Tem mùa ≥ 2/3 bộ. Việc vặt ≥ 4/5 |
| Lớn tuổi, nghỉ 4 ngày (D10–D13) | Vắng giữa E2 | F6 tặng quà quay lại 1 lần. Tem mùa vẫn ≥ 2/3 bộ |

---

## 6. Danh sách function

### 6.1 Bảng tổng

| ID | Function (VI / EN) | Bản gốc Grand | Mở | Chu kỳ | Phần thưởng | UI trên màn chính | Local hay server |
|---|---|---|---|---|---|---|---|
| F1 | **Thư hôm nay** / Today's Post | Daily puzzle `[GG-4]` | L5 | Mỗi ngày lịch | 40 xu + 1 dấu ngày (+1 tem mùa khi E2 chạy) | Điểm chạm 2 | Local. Level chọn tất định theo ngày lịch |
| F2 | **Sổ dấu ngày** / Date Stamp Book | Daily challenge tracker `[GG-4]` | Cùng F1 | Trang 20 dấu, không hạn | Trang đầy: 1 decor kỷ niệm + 150 xu, mở trang mới | Trong panel F1, trang trong Album | Local |
| F3 | **Thẻ tuần 5/7** / Weekly Card | (không có ở Grand, plan M4) | Cùng F1 | Tuần lịch T2–CN | Đủ 5 dấu: 1 Gợi ý, 1 Nam châm, 100 xu | Huy hiệu trên điểm chạm 2 | Local |
| F4 | **Thư buổi sáng** / Morning Mail | Daily Gift `[GG-2]` | D2, ≥ L5 | Lần mở đầu mỗi ngày | 20 xu. Mỗi lần nhận thứ 7 (đếm số lần nhận, không cần liên tiếp): thêm 1 Gợi ý | Popup tự hiện | Local |
| F5 | **Túi thư của Pip** / Pip's Mailbag | Cauldron `[GG-1]` | L15 | Liên tục | Mỗi 12 lần thắng (chiến dịch hoặc Daily): 1 booster, vòng Gợi ý → Nam châm → Con dấu → Gợi ý → Nam châm → Tem Đa Năng | Thanh dưới nút Chơi | Local |
| F6 | **Chào mừng quay lại** / Welcome Back | (không có ở Grand, plan S2) | Vắng ≥ 3 ngày | Mỗi lần vắng | ≥ 3 ngày: 1 Gợi ý, 1 Nam châm, level đầu +5 lượt. ≥ 7 ngày: thêm 1 Tem Đa Năng | Popup tự hiện | Local |
| E1 | **Tuyến đưa thư** / Mail Route | Broom Streak, journey `[GG-4][GG-2]` | L12 | `cd` 2–7 (chu kỳ sau 1–7) | Trạm 5: 50 xu. Trạm 10: 1 Gợi ý. Trạm 15: 1 Nam châm. Trạm 20: 1 Tem Đa Năng + tem tuyến vào album. Chuyến thêm 5 trạm: 30 xu, tối đa 3 lần | Điểm chạm 3 | Local |
| E2 | **Tem theo mùa** / Seasonal Stamps | Collection event `[GG-3]` | L20 | `cd` 8–21 | Bộ 1 (8 tem): 1 Con dấu + 50 xu. Bộ 2 (16): 1 Gợi ý + 1 Nam châm. Bộ 3 (24): **decor hiếm mùa** + trang album mùa + 1 Tem Đa Năng. Thêm mỗi 8 tem: 30 xu, tối đa 2 lần | Điểm chạm 3 | Local. Hình tem theo tháng thật |
| E3 | **Cuối tuần xu đôi** / Weekend Double Coins | Coin Rush `[GG-6]` | L8 | T7, CN | Xu thắng level ×2 (không áp cho Daily, hộp, event) | Dải băng không bấm | Local |
| E4 | **Tuần việc vặt** / Errand Week | Mission Carnival `[GG-2]`, ABI `DailyMission` `[APK]` | L30 | `cd` 22–28 | Mỗi việc: 30–50 xu. Đủ 5 việc: hộp 1 Gợi ý, 1 Nam châm, 1 Con dấu | Điểm chạm 3 | Local |
| F9 | **Thông báo nhẹ** / Gentle Reminder | (ABI có push `[APK]`) | Sau Daily thứ 3 | Tối đa 1/ngày | Không thưởng | Cài đặt | Local notification (Capacitor). Push từ server để sau |
| F10 | **Nhắc nghỉ** / Rest Reminder | Không có | 45 phút chơi liên tục | Mỗi 45 phút | Không thưởng | Popup | Local |
| F11 | **Thử lại nhẹ tay** / Gentle Retry | DDA ở L26 `[GG-4]` | L11 | Mỗi level | Thua 2 lần liền ở cùng level: lần thử sau +3 lượt và 1 lá đầu bộ bài lật sẵn | Không có UI riêng, 1 câu ở đầu level | Local. Cờ `kill_switch.gentle_retry` |

Ngoài bảng: thưởng hết chương (+200 xu, bưu thiếp, đã có) và decor mỗi chương (M5, M6 trong plan) là "function" nội dung, thuộc R17.

### 6.2 Chi tiết từng function

Mỗi mục: mục đích (người chơi cảm thấy gì), quy tắc, edge case, đo bằng gì, rủi ro.

**F1 Thư hôm nay**
- Mục đích: "Sáng nào cũng có một lá thư cho mình". Lý do mở app kể cả khi đang kẹt ở chiến dịch.
- Quy tắc: level `daily[(epochDay(today) + offset) mod pool]`, chọn theo **ngày lịch thật** để ai cũng nhận cùng lá thư mỗi ngày (khớp ý "tem có dấu ngày thật"). Độ khó như level nghỉ (`c25` ≥ 0.97, `o35` ≥ 0.85). Thắng thì nhận thưởng 1 lần. Chơi lại được nhưng không có thưởng. Thua thì chơi lại không mất gì (Daily không trừ gì). **Chơi bù được Thư hôm qua** (1 ngày): nhận dấu ngày và 20 xu.
- Edge case: chưa tới L5 thì ẩn. Qua nửa đêm khi đang chơi Daily: vẫn tính cho ngày bắt đầu. Pool hết vòng (90 ngày) thì lặp lại, đổi chủ đề theo `offset` của vòng.
- Đo: `daily_start`, `daily_complete`, `daily_catchup`, D7 và D30 của nhóm chơi Daily so với nhóm không.
- Rủi ro: Daily quá khó (Magic Sort bị chê `[GG-1]`). Giữ mục tiêu validator của level nghỉ.

**F2 Sổ dấu ngày**
- Mục đích: thấy được sự đều đặn qua một vật sưu tầm, không có hạn chót.
- Quy tắc: mỗi Daily thắng (kể cả chơi bù) đóng 1 dấu có ngày. Trang 20 ô. Đầy trang thì nhận decor kỷ niệm (dùng ô dư của lưới decor, `30-day-plan.md` 2.3) và 150 xu, rồi mở trang mới.
- Đo: `stampbook_page_complete`, số ngày từ lúc mở tới khi đầy trang.
- Rủi ro: thấp.

**F3 Thẻ tuần 5/7**
- Mục đích: thay streak. Đủ 5 trên 7 ngày là đủ, bỏ 2 ngày không sao.
- Quy tắc: tuần lịch T2–CN. Mỗi ngày có Daily thắng đóng 1 ô. Đủ 5 thì hộp mở ngay (không đợi Chủ nhật). Tuần mới thì thẻ mới. Không có chữ "mất chuỗi" hay "streak lost".
- Edge case: chơi bù Thư hôm qua đóng ô của hôm qua nếu còn cùng tuần.
- Đo: `weekly_box_open`, phân bố số ngày chơi mỗi tuần.

**F4 Thư buổi sáng**
- Mục đích: lời chào nhỏ của Pip. Không thang tăng dần, không có ngày đặc biệt để lỡ.
- Quy tắc: lần mở app đầu tiên mỗi ngày lịch (từ D2, ≥ L5): 20 xu. Lần nhận thứ 7, 14, 21... thêm 1 Gợi ý. Không cần liên tiếp.
- Đo: `morning_claim`, tỉ lệ mở app có nhận quà sáng.

**F5 Túi thư của Pip**
- Mục đích: thắng nhiều thì túi đầy, luôn có booster sắp tới. Bản đơn giản của cauldron, không thêm loại tiền mới.
- Quy tắc: mỗi lần thắng (chiến dịch, Daily) +1. Đủ 12 thì nhận 1 booster theo vòng cố định 6 món (mục 6.1). Thua không trừ.
- Đo: `mailbag_open`. Tỉ lệ dùng booster nhận từ túi trong 3 level kế tiếp.
- Rủi ro: thừa booster làm mất chỗ tiêu xu. Kiểm bằng `economy_sim` (mục 8).

**F6 Chào mừng quay lại**
- Mục đích: người lớn tuổi hay nghỉ vài ngày (ốm, đi chơi). Quay lại thì được đón, không bị nhắc là đã bỏ lỡ gì.
- Quy tắc: vắng ≥ 3 ngày lịch: 1 popup "Pip giữ thư cho bạn", kèm quà ở mục 6.1, nhắc khu đang ở và món decor kế tiếp. Gộp quà event đã qua vào cùng popup. Mỗi lần vắng nhận 1 lần.
- Đo: `welcome_back` (kèm số ngày vắng), retention 3 ngày sau khi quay lại.

**E1 Tuyến đưa thư**
- Mục đích: "Hôm nay mình đi thêm được mấy trạm". Tiến bộ thấy được, không sợ mất.
- Quy tắc: tuyến 20 trạm trên bản đồ cảnh khu. Mỗi lần thắng (chiến dịch hoặc Daily) đi 1 trạm. **Thua không lùi.** Bỏ luật "3 Tem Điểm đi 2 trạm" ở bản E1 cũ của benchmark, để người lớn tuổi không thấy áp lực phải chơi hoàn hảo. Hết tuyến thì có "chuyến thêm" 5 trạm (tối đa 3 lần) cho người chơi nhanh.
- Cân chỉnh: người lớn tuổi khoảng 4,5 trạm mỗi ngày ở D2–7, nên xong ở khoảng D6. Ở chu kỳ sau khoảng 3,4 trạm mỗi ngày, xong vào ngày 6 của 7. Người chơi 5/7 ngày đạt khoảng 17 trạm (3 trên 4 mốc quà).
- Edge case: vào event muộn (đạt L12 giữa cửa sổ): vẫn đủ trạm 10 trở lên nếu còn ≥ 3 ngày.
- Đo: `route_step`, `route_complete`, % người đạt trạm 20, D7 của nhóm tham gia.

**E2 Tem theo mùa**
- Mục đích: cảm giác sưu tầm, nối vào album. Event "đẹp" nhất, có decor hiếm.
- Quy tắc: một **dấu tem mùa** (hình phủ lên góc lá, không đổi luật và không đổi chủ đề của lá) nằm trên 1 lá ở **mỗi Thư hôm nay** và ở **một nửa số level chiến dịch** (chọn tất định bằng `hash(levelId, k)`). Lá đó được gửi đi thì tem bay vào ô Event, **giữ cả khi thua**. Chơi lại level đã nhận tem mùa thì không có tem nữa. 3 bộ, mỗi bộ 8 tem. Bộ 3 cho decor hiếm (1 decor hiếm mỗi mùa thật).
- Cân chỉnh: người lớn tuổi khoảng 2,2 tem mỗi ngày (1 Daily cộng 2,4 × 0,5 chiến dịch), nên đủ 24 tem ở khoảng ngày 11 trên 14. Người chơi 5/7 ngày đạt khoảng 22 tem (2 bộ, gần đủ bộ 3).
- Engine: chỉ là cờ hiển thị trên 1 lá và 1 bộ đếm. Không cần sinh lại level. Lá có tem mùa không được là lá Tem Đa Năng.
- Art: 4 hình tem mùa (1 sprite mỗi mùa), 4 decor hiếm, 1 khung trang album. Dự phòng: dùng sáp niêm đổi màu.
- Đo: `season_stamp_get`, `season_set_complete`, % đủ bộ 3.

**E3 Cuối tuần xu đôi**
- Mục đích: chút vui nhỏ, không bắt buộc.
- Quy tắc: T7 và CN, xu thắng level chiến dịch ×2. Không đếm ngược, không popup. Dải băng không bấm được.
- Đo: số phiên cuối tuần so với ngày thường.

**E4 Tuần việc vặt**
- Mục đích: đổi nhịp mỗi tuần thứ 4 bằng các mục tiêu nhỏ, đa dạng.
- Quy tắc: 5 việc rút tất định từ pool theo chu kỳ `k`. Mỗi việc độc lập, có thưởng riêng. Đủ 5 thì mở hộp. **Không có việc nào buộc tiêu xu hay dùng booster.**
- Pool việc (gợi ý, cân cho người lớn tuổi xong trong khoảng 5 trên 7 ngày): thắng 8 level; chơi Thư hôm nay 4 ngày; gửi 6 bao thư lớn (≥ 6 tem); đạt 3 Tem Điểm ở 3 level; đặt 1 món trang trí; thắng 1 level khó (Ca tối cũng tính); gửi 15 bao thư của một chủ đề bất kỳ có trong khu hiện tại.
- Đo: `errand_complete` theo từng loại việc, % mở hộp.

**F9 Thông báo nhẹ**
- Quy tắc: hỏi quyền sau Daily thứ 3, có "Để sau". Mặc định tắt. Tối đa 1 thông báo mỗi ngày vào giờ người chơi chọn (mặc định 9:00). Nội dung xoay vòng giữa: Thư hôm nay đã đến; Tem mùa mới về (ngày đầu E2); Tuyến mới mở (ngày đầu E1). **Không bao giờ** gửi "sắp hết hạn" hay "sắp mất".
- Kỹ thuật: `@capacitor/local-notifications`. Lên lịch trước 7 ngày từ `liveState`, xếp lại mỗi lần mở app.

**F10 Nhắc nghỉ** và **F11 Thử lại nhẹ tay**: như bảng 6.1. F11 không áp cho level khó (đã có Ca tối) và không áp cho Daily.

---

## 7. Số level cần

### 7.1 Con số

| Hạng mục | Số level | Cơ sở |
|---|---|---|
| **Chiến dịch** | **240** (L1–L240, 12 chương: ch1–2 mỗi chương 10, ch3–13 mỗi chương 20) | Người nhanh ở khoảng L191 vào D30, cần còn ≥ 20 level (mục 10). 240 cho buffer khoảng 49 level (khoảng 9 ngày). Người lớn tuổi ở khoảng L85, gấp khoảng 2,8 lần |
| Sàn chiến dịch | 200 | Như `30-day-plan.md` 1.3. Với 200, người nhanh hết ở khoảng D31–32, không đạt DoD mục 10. Chỉ chấp nhận nếu bản cập nhật +20 level phát hành trước D14 sau launch |
| **Daily Post** | **90** | 30 ngày cộng 200% buffer, tức 1 quý không lặp. Vì F1 chọn theo ngày lịch thật nên người cài muộn vẫn không gặp lại thư cũ trong 3 tháng |
| **Level riêng cho event** | **0** | Theo N4: event của Grand chạy trên level chính `[GG-5]`. E2 chỉ phủ dấu lên lá có sẵn |
| **Tổng** | **330**, cần làm mới **310** (L1–L20 đã có) | |

Ch12–13 cần thêm 6 chủ đề tem mới và 12 decor ngoài bảng 2.2 của plan. Generator đã có topic dự phòng, nên level vẫn sinh được trước khi có art. Art của ch12–13 có thể về sau launch vì người lớn tuổi chỉ tới đó sau khoảng D60 `[GIẢ THUYẾT]`.

### 7.2 Tỉ lệ ABI và tự sinh

Thực tế kho ABI (đo lại 2026-10-15 trên `research/apk/com.stamp.solit/levels/levels.csv`) `[APK]`:
- 963 level. Chỉ **203 level ≤ 54 lá**. Trong đó **179 level là cùng một template** 36 lá, 3 khay, cột 3-4-5, 6 chủ đề, phân bố `n` = {3, 3, 4, 4, 8, 8}, chỉ khác thứ tự chia. 24 level còn lại gần như mỗi cái một layout (41 lá 4 khay 2-3-4-5 có 5 level, các layout khác 1–2 level).
- Phần lớn level ABI sau L20 có 64–98 lá, vượt trần độ dài của mình (≤ 46 lá ở level thường, ≤ 54 lá ở level khó).

Vì vậy ABI hợp nhất ở 2 chỗ:
1. **Daily Post:** template 36 lá của ABI có cỡ đúng như Daily (30–36 lá, 6 chủ đề). 179 cách chia khác nhau là kho ứng viên lớn. Cần **nới spec Daily cho phép 3 khay** (hiện `30-day-plan.md` 3.3 ghi 4 khay). Đây là quyết định level design thuộc GD: chấp nhận 3–4 khay, với điều kiện validator đạt `c25` ≥ 0.97 và `o35` ≥ 0.85. Nhược điểm: cùng hình dạng bàn. Vì vậy trộn khoảng 50% với level tự sinh 4 khay để có nhịp khác.
2. **Chiến dịch, level nghỉ 3 khay (p16 mỗi chương) và vài level thường:** p16 dùng 3 khay `[DOC level_spec.mjs SMALL_TRAY_AT]`, khớp template 36 lá. Thêm khoảng 24 layout lẻ ≤ 54 lá cho vị trí nor, bump, HARD (Level Dev đã chọn 2/20 ở ch3).

| Hạng mục | Tổng | Ước tính từ ABI | Ước tính tự sinh | Ghi chú |
|---|---|---|---|---|
| Chiến dịch L1–L20 | 20 | 0 (đã có) | 20 | L1 dựng lại riêng (R4) |
| Chiến dịch L21–L240 | 220 | khoảng 30–40 (11 vị trí p16 + khoảng 20–30 vị trí khác) | khoảng 180–190 | Mỗi vị trí chọn ứng viên tốt nhất bằng validator. Một layout ABI không dùng lại quá 2 lần trong chiến dịch |
| Daily Post | 90 | khoảng 45 | khoảng 45 | Xen kẽ ABI và tự sinh theo ngày để không có 2 ngày liền cùng hình dạng |
| **Tổng** | **330** | **khoảng 75–85 (khoảng 24%)** | **khoảng 245–255** | Con số cuối do validator quyết, đây là ước tính năng lực kho |

Mọi level ABI đều đổi sang chủ đề của mình, chỉnh lại moves theo `o35` và qua validator như level tự sinh. Bản build không chứa chữ "APK 0.9.5" (`deploy_web.sh`).

### 7.3 Khi người chơi hết chiến dịch

- Màn chính hiện "Chuyến tàu thư mới đang trên đường" thay cho số level. Thư hôm nay, event và Túi thư vẫn chạy. E1 và E4 tính cả **chơi lại level cũ** (thắng level đã qua cũng tính 1 trạm), để người chơi rất nhanh vẫn có việc.
- Sau launch: +20 level (1 chương) mỗi 2 tuần, theo nhịp area của Block Out `[GG-2]` (N1, N2).

---

## 8. Economy tóm tắt (để `economy_sim` kiểm ở R19)

Hằng số hiện tại `[CODE]`: xu khởi đầu 500. Thắng: 10 + 10 × Tem Điểm (20–40 xu). Hết chương +200. Giá: Undo 30, Gợi ý 150, Nam châm 250, Con dấu 250, Tem Đa Năng 500, Ô phụ 400, +5 lượt 300. Quà khi mở booster: Gợi ý 3, Nam châm 2, Con dấu 2, Tem Đa Năng 2.

**Nguyên tắc cho phần thưởng mới:** event và function trả **booster và đồ sưu tầm** là chính, xu ít. Lý do: ước tính dưới đây cho thấy xu đã dư nếu giữ thưởng thắng hiện tại.

### 8.1 Nguồn và chỗ tiêu trong 30 ngày, người lớn tuổi đều đặn `[GIẢ THUYẾT]`

Cơ sở: khoảng 85 lần thắng chiến dịch, khoảng 27 Daily, trung bình 2,4 Tem Điểm mỗi level, 5 chương hoàn thành.

| Nguồn xu | Ước tính 30 ngày |
|---|---|
| Khởi đầu | 500 |
| Thắng chiến dịch (khoảng 34 × 85) | khoảng 2.900 |
| E3 cuối tuần (khoảng 21 lần thắng vào T7, CN) | khoảng 700 |
| F1 Daily (40 × 27) | khoảng 1.080 |
| F4 quà sáng (20 × 29) | khoảng 580 |
| F3 Thẻ tuần (4 hộp) | 400 |
| Hết chương (5 × 200) | 1.000 |
| F2 Sổ dấu ngày (1 trang) | 150 |
| E1, E2, E4 (phần xu) | khoảng 450 |
| **Tổng vào** | **khoảng 7.750** |

| Chỗ tiêu xu | Ước tính 30 ngày |
|---|---|
| +5 lượt (khoảng 19 lần thua đầu ở level thường, dùng ở 60% số lần) | khoảng 3.300 |
| Mua booster khi hết kho | khoảng 750 |
| Undo trả phí, Ô phụ | khoảng 500 |
| **Tổng ra** | **khoảng 4.550** |
| **Số dư D30** | **khoảng 3.200**, cao hơn mục tiêu 800–2.500 của R19 |

| Booster miễn phí (người lớn tuổi) | 30 ngày |
|---|---|
| Quà mở booster | 9 |
| F4 (lần nhận thứ 7, 14, 21, 28) | 4 Gợi ý |
| F3 (4 hộp) | 4 Gợi ý, 4 Nam châm |
| F5 (khoảng 112 lần thắng / 12) | khoảng 9 |
| E1 (#1 đủ, #2 dở), E2, E4 | khoảng 10 |
| **Tổng** | **khoảng 40, tức khoảng 1 booster mỗi 2,1 level** |

**Tem Điểm:** khoảng 2,4 × 85 ≈ 204 điểm. Giá decor khởi điểm (plan câu 3): ch1–2 mỗi chương 24, ch3+ mỗi chương 40. Đến hết ch5 tổng giá 168, nên người lớn tuổi mua đủ 5 chương và 1–3 món của ch6. Ch1 sát: 10 level × 2,4 = 24, đúng bằng giá 24. Theo luật 90% của plan, giá ch1–2 nên còn khoảng 22.

**Người nhanh:** khoảng 191 lần thắng, ít thua, nên số dư D30 khoảng 12.000–14.000 xu. Đây là tích trữ vô nghĩa, nhưng đây là nhóm ít cần cứu. Có cần chỗ tiêu xu cho nhóm này không (ví dụ đồ trang trí mua bằng xu) là **quyết định của PO**.

### 8.2 Đề xuất cho R19 thử trong `economy_sim`

| Tham số | Hiện tại | Phương án thử | Mục tiêu |
|---|---|---|---|
| Xu thắng | 10 + 10 × sao | **10 + 5 × sao** (15–25) | Số dư D30 của người lớn tuổi 800–2.500 |
| E3 | ×2 toàn bộ xu thắng | ×2 phần gốc 10 xu | Như trên |
| F5 | 12 lần thắng | 12 hoặc 15 | Booster miễn phí khoảng 1 mỗi 2,5–3 level |
| F4 | +1 Gợi ý mỗi lần nhận thứ 7 | Giữ | |
| Giá decor ch1–2 | 24 | 22 | Người lớn tuổi mua đủ 6 món trong 1 lượt chơi chương |

Mục tiêu (a)–(d) của R19 giữ nguyên. Thêm (e): người lớn tuổi chơi 5/7 ngày vẫn đạt (a) và (c). Giá IAP, quảng cáo thưởng và có bán xu hay không là **PO chốt**.

---

## 9. Backlog cho dev (vòng L1–L14)

Mỗi vòng khoảng 1–2 giờ, kết thúc bằng 1 commit. Lệnh test chung: **fuzz** (`node prototype/stamp/tests/fuzz.test.mjs --quick`), **validator** (`node tools/validate_levels.mjs`). Test lịch dùng đồng hồ giả: `liveState()` nhận `now` làm tham số, UI nhận `?now=YYYY-MM-DD&debug`. Ảnh chụp: Chrome headless 390×844 @2x.

### 9.1 Vị trí trong plan

| Vòng | Thay hoặc gộp | Phụ thuộc |
|---|---|---|
| L1 | Mới (nền cho R15, R16) | Sau R10 (schema save ổn định) |
| L2 | **Thay R15** | L1. Pool Daily từ Level Dev: `gen_levels.mjs --daily=90` với ứng viên ABI (việc của Level Dev, sau R3) |
| L3, L4 | **Thay R16** | L1, L2 |
| L5 | Gộp với P9 (màn chính sống) của benchmark | L2 |
| L6–L9 | Mới | L5 |
| L10 | Mới (DDA, plan để ở Could) | R10 |
| L11 | **Thay R18** | L2 |
| L12 | **Gộp với R22** (`content_days`) và là đầu vào cho **R19** | L1, validator |
| L13 | Mới | L1 |
| L14 | Gộp vào R21 (QA) | Tất cả |

Thứ tự đề xuất: R1–R10 → **L1 → L2 → L3 → L4 → L5** → R11–R14 → **L6 → L7 → L8 → L9 → L10 → L11** → R17 → **L12** → R19–R20 → **L13** → R21 + **L14** → R22 (đã gộp vào L12, chỉ còn checklist).

### 9.2 Các vòng

| Vòng | Việc | Acceptance criteria |
|---|---|---|
| **L1** | `src/liveops/clock.js` và `schedule.js`: `liveState(firstOpen, now, level)` trả `{ pd, k, cd, big, weekend, dailyIndex, isoWeek }`. Bảng `FEATURES` (mục 2) và `BIG_EVENTS` (mục 3.4). Lưu `save.live = { firstOpen, maxSeenDate, ... }`. Chống lùi giờ. `?now=` và `?pd=` khi `?debug`. Chưa có UI | `node prototype/stamp/tests/liveops.test.mjs` pass: (1) `pd` đúng qua nửa đêm và qua tháng; (2) `cd` 1–28 ra đúng event, chu kỳ 2 có E1 từ `cd` 1; (3) level < `minLevel` thì `big = null`; (4) lùi giờ không tạo ngày mới; (5) T7, CN thì `weekend = true`; (6) không ngày nào trong 120 ngày có 2 event lớn |
| **L2** | F1 Thư hôm nay và F2 Sổ dấu ngày. Nút trên màn chính (từ L5), panel Daily, chơi bù hôm qua, thưởng 1 lần, trang Sổ dấu ngày trong Album, tracking `daily_*` | Validator Daily 90/90 (`c25` ≥ 0.97, `o35` ≥ 0.85). Test đồng hồ giả: qua ngày thì đổi level; đã thắng thì giữ trạng thái; chơi lại không thưởng; chơi bù chỉ được 1 ngày; 20 dấu thì mở trang mới và trao decor. Ảnh: màn chính L4 (không có nút), L5 (có nút, chấm đỏ), panel Daily |
| **L3** | F3 Thẻ tuần 5/7 trong panel Daily, huy hiệu trên nút. F4 Thư buổi sáng | Test: chơi Daily vào T2, T3, T5, T6, CN thì hộp mở ngay khi thắng Daily Chủ nhật (dấu thứ 5); tuần mới thì thẻ trống; F4 nhận đúng 1 lần mỗi ngày, Gợi ý ở lần thứ 7 và 14 (không cần liên tiếp). Grep copy EN/VI: 0 kết quả cho "mất chuỗi", "streak lost", "hết hạn" |
| **L4** | F6 Chào mừng quay lại. Hàng đợi popup lúc mở app (ưu tiên F6 > quà event cũ > F4, tối đa 1 popup, gộp quà) | Test: vắng 2 ngày thì không có F6; vắng 3 ngày thì F6 đúng 1 lần, level đầu +5 lượt; vắng 7 ngày thì có thêm Tem Đa Năng; quà event đạt nhưng chưa nhận được trao khi quay lại. Ảnh popup gộp |
| **L5** | Màn chính 5 điểm chạm: ô Event (icon, vạch tiến độ, trạng thái mờ "Mở ở Level N"), dải băng E3, popup "Tính năng mới" theo luật mục 2 (1 thứ mỗi level, 1 popup mỗi phiên) | Ảnh ở `?pd=1` L1, `?pd=2` L13, `?pd=8` L32, `?pd=22` L66, `?pd=27` (T7) L78: đếm phần tử bấm được trong vùng chính ≤ 5 (script đếm `[data-touch]`). Không còn vùng trống > 20% chiều cao (chung tiêu chí P9) |
| **L6** | E3 Cuối tuần xu đôi. F5 Túi thư của Pip (thanh dưới nút Chơi, vòng 6 booster) | Test: thắng vào T7 thì xu ×2 theo hằng số trong `liveops.json`; Daily không ×2; 12 lần thắng thì ra đúng booster theo vòng, thua không trừ. Ảnh màn thắng có nhãn ×2 |
| **L7** | E1 Tuyến đưa thư: panel bản đồ 20 trạm (art cảnh dùng nền chương), bước khi thắng chiến dịch hoặc Daily, 4 mốc quà, chuyến thêm, trao quà còn lại khi event kết thúc | Test: 20 lần thắng thì đủ 4 mốc; thua không đổi trạm; chuyến thêm tối đa 3; hết cửa sổ thì quà đã đạt mà chưa nhận được trao. Ảnh panel ở trạm 0, 7, 20 |
| **L8** | E2 Tem theo mùa: cờ `seasonStamp` trên 1 lá (chọn bằng `hash(levelId, k)`, không phải lá Tem Đa Năng), bay vào ô Event khi lá được gửi, 3 bộ × 8, trang album mùa, decor hiếm. Hình theo tháng thật. Dự phòng: sáp niêm đổi màu nếu chưa có art | Test: Daily luôn có 1 tem; tỉ lệ level chiến dịch có tem trong L21–L240 nằm trong 45–55%; thua vẫn giữ tem đã gửi; chơi lại level đã nhận không có tem; 24 tem thì có decor hiếm. Fuzz pass (cờ không đổi luật). Ảnh lá có dấu tem mùa ở cỡ lá thật |
| **L9** | E4 Tuần việc vặt: pool việc, bộ đếm lấy từ sự kiện analytics sẵn có (`level_win`, `daily_complete`, `deliver`, `decor_place`), 5 việc tất định theo `k`, hộp | Test: mỗi loại việc tăng đúng khi phát sự kiện tương ứng; không việc nào có điều kiện tiêu xu hay dùng booster (test quét pool); `k` khác thì bộ việc khác. Ảnh bảng 5 việc |
| **L10** | F11 Thử lại nhẹ tay: thua 2 lần liền ở level thường (≥ L11) thì lần sau +3 lượt và 1 lá lật sẵn. Cờ tắt trong `liveops.json` | Test: thua 1 lần thì không có; thua 2 lần thì lần 3 có; thắng thì đặt lại bộ đếm; không áp cho `special` và Daily. Validator ghi thêm cột `o35` khi có F11 |
| **L11** | F9 Thông báo nhẹ (Capacitor local notifications, mặc định tắt, hỏi sau Daily thứ 3, giờ chọn được, lịch 7 ngày từ `liveState`). F10 Nhắc nghỉ 45 phút | Test đồng hồ giả: lịch 7 ngày tối đa 1 thông báo/ngày, nội dung đúng loại ngày (Daily, ngày đầu E1, ngày đầu E2); grep nội dung không có "hết hạn", "sắp mất". Nhắc nghỉ đúng 1 lần mỗi 45 phút, tắt được. Build iOS: hỏi quyền chỉ sau Daily thứ 3 |
| **L12** | `tools/liveops_sim.mjs`: mô phỏng D1–D30 cho 4 persona (mục 5.1 và 5.3), dùng phút mỗi level từ report validator, gọi `liveState` thật. In bảng như mục 5.2: level, tính năng gặp, event, lý do quay lại. Xuất JSON cho `economy_sim` (R19). Thay `content_days` của R22 | Chạy dưới 10 giây, tất định. Bảng khớp các tiêu chí ở mục 10. Có cờ `--md` |
| **L13** | `liveops.json` đóng gói cùng build: phần thưởng, cửa sổ event, `kill_switch`, `schedule_mode`. Đọc lúc khởi động, có giá trị mặc định trong code. Chuẩn bị chỗ nối Firebase Remote Config (chưa gọi mạng) | Test: thiếu file hoặc file hỏng thì chạy bằng mặc định; `kill_switch.season = true` thì E2 không xuất hiện và ô Event trống trong cửa sổ đó |
| **L14** | QA LiveOps: ảnh chụp các mốc `?pd=` 1, 2, 3, 7, 8, 14, 18, 21, 22, 27, 29 (EN/VI, chữ Lớn). Kiểm đổi ngày khi app đang mở, lùi giờ, vắng 3 và 7 ngày | Thư mục ảnh chụp. Mọi test `liveops*.test.mjs` pass. Danh sách lỗi đã sửa |

---

## 10. Definition of Done cho "đủ 30 ngày"

Dừng khi mọi ô dưới đây đạt. Kiểm bằng `liveops_sim` (L12), test đồng hồ giả, validator và ảnh chụp.

| Nhóm | Tiêu chí kiểm được |
|---|---|
| Nội dung không cạn | `liveops_sim`: người lớn tuổi đều đặn ở D30 trong khoảng **L75–L120**. Người nhanh ở D30 **còn ≥ 20 level chiến dịch chưa chơi**. Không persona nào hết Daily trong 30 ngày (pool 90) |
| Lý do quay lại | Mỗi ngày D1–D30, với cả 4 persona, có **≥ 1 lý do quay lại ngày mai** thuộc danh sách: Thư hôm nay mới; event lớn đang chạy còn mốc quà chưa đạt; Thẻ tuần còn thiếu ≤ 2 ô; Túi thư còn ≤ 3 lần thắng; đủ Tem Điểm cho món decor kế tiếp hoặc còn ≤ 1 level; khu mới vừa mở. Ở D1–D7 mỗi ngày **≥ 2 lý do** |
| Khoảnh khắc lớn | Người lớn tuổi đều đặn có khoảnh khắc lớn (khu mới, decor hiếm, hộp tuần, hộp việc vặt, xong tuyến) cách nhau **≤ 4 ngày** |
| Không FOMO | Persona 5/7 ngày: đủ 4 hộp Thẻ tuần, E1 ≥ 15/20 trạm, E2 ≥ 2/3 bộ, E4 ≥ 4/5 việc. Grep copy EN/VI: 0 kết quả cho đồng hồ đếm ngược, "mất chuỗi", "streak lost", "hết hạn", "sắp mất" |
| Gọn | Ở mọi `pd` 1–30: ≤ 5 điểm chạm chính (ảnh L5, L14), ≤ 1 event lớn (test L1). Không function meta nào mở trước L5. Không level nào có 2 thứ mới |
| Level | 240 level chiến dịch (sàn 200 kèm bản cập nhật trước D14) và 90 Daily qua validator. Daily: `c25` ≥ 0.97, `o35` ≥ 0.85. Bản build có 0 chuỗi "APK 0.9.5" |
| Function | 13 function ở mục 6.1 chạy được, mỗi cái có sự kiện analytics riêng (`daily_*`, `stampbook_*`, `weekly_*`, `morning_claim`, `mailbag_open`, `welcome_back`, `route_*`, `season_*`, `errand_*`, `weekend_bonus`, `notif_*`, `rest_reminder`, `gentle_retry`) |
| Economy | `economy_sim` (R19) đạt (a)–(e) ở mục 8.2 với dữ liệu từ `liveops_sim` |
| Bền vững | Test: lùi giờ không tạo quà; vắng nhiều ngày thì quà đã đạt vẫn được trao; `kill_switch` tắt từng function mà game vẫn chạy |

**Lệch so với `30-day-plan.md` mục 7** (Level Dev hoặc PO cập nhật plan nếu đồng ý): plan ghi "người nhanh hết chiến dịch ≥ D26" và 200 level. Tài liệu này đề xuất chặt hơn: người nhanh **chưa hết** ở D30, nên cần 240 level.

---

## 11. Rủi ro và câu hỏi còn mở

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| 1 | Nhịp chơi thật của người lớn tuổi khác giả định (mục 5.1) | `liveops_sim` đọc phút từ validator. Playtest 7 ngày đo `session_length`. Cửa sổ event và ngưỡng quà nằm trong `liveops.json` để chỉnh không cần sửa code |
| 2 | Quá nhiều quà làm mất chỗ tiêu xu và booster | Phần thưởng nghiêng về booster và đồ sưu tầm. R19 kiểm (a)–(e) |
| 3 | Lịch theo ngày người chơi khác lịch toàn cầu, khó làm event đồng loạt sau này | Cờ `schedule_mode`. Sau D30 có thể chuyển sang lịch toàn cầu khi có Remote Config |
| 4 | Art của E2 (4 tem mùa, 4 decor hiếm) và cảnh tuyến E1 chậm | Dự phòng: sáp niêm đổi màu, cảnh tuyến dùng nền chương |
| 5 | 3 khay ở Daily (template ABI) làm Daily khó hơn mong muốn | Validator quyết. Nếu tỉ lệ đạt thấp thì giảm phần ABI trong Daily |

**Câu hỏi còn mở:**
1. **PO:** chốt 240 level ở launch hay 200 cộng bản cập nhật trước D14. Chốt có chỗ tiêu xu cho người chơi nhanh không. Giá IAP, Pass, gói ưu đãi (Grand có, mình chưa thiết kế).
2. **PO:** F11 Thử lại nhẹ tay có bật mặc định không (đề xuất bật, theo Magic Sort L26 `[GG-4]`). Level vẫn thua được nên không trái quyết định đã chốt.
3. **Dữ liệu cần thêm (vòng P0 của benchmark):** quay màn hình Magic Sort và Block Out ở level 1–60 để ghi level mở từng tính năng, số icon trên màn chính, cách hoạt động của Treasure Drill và collection season. Đây là chỗ duy nhất tài liệu này phải dùng `[GIẢ THUYẾT]` cho Grand Games.
4. **Người dùng:** duyệt tên VI/EN của 13 function và 4 chủ đề tem mùa.

---

## 12. Nguồn

1. `[GG-1]` App Store, Magic Sort! (US và vùng mo, đọc 2026-10-15): mô tả (cauldron, ingredients), 25 bản cập nhật 21/2–5/10 đều ghi "New 100 levels", IAP (Starter, Apprentice, Magician, Sorcerer, Endless Portal 5,99 và 11,99, Treasure Drill 24,99, Choose One 34,99, Special Offer), review nhắc teams xin lives, dailies, Jetpack Race, Treasure Drill, collectible cards. [Link](https://apps.apple.com/us/app/magic-sort/id6499209744), [vùng mo](https://apps.apple.com/mo/app/magic-sort/id6499209744?l=en-GB&platform=ipad)
2. `[GG-2]` App Store, Block Out! (đọc 2026-10-15): version history (area, obstacle, Streak Race, Daily Gift, journey, Mission Carnival, Balloon Ride, Lily Leap, sound effects), IAP Block Pass 9,99. [Link](https://apps.apple.com/us/app/block-out-color-sort-puzzle/id6752672568)
3. `[GG-3]` App Store, Car Match (đọc 2026-10-15): "100 new levels" và "Multiple New Events and Offers", collection event và teams (26/2), Facebook Login (3/2026). [Link](https://apps.apple.com/us/app/car-match-traffic-puzzle/id6504421808)
4. `[GG-4]` Naavik, Grand Games and Leveling Up Mobile Casual Puzzle: daily puzzle và tracker, 3 leaderboard, Broom Streak, Magic Streak, Jetpack Race, event mới khoảng 2 tháng một lần, mua chai để nối, DDA ở L26. [Link](https://naavik.co/digest/why-peak-games-investors-backed-grand-games/)
5. `[GG-5]` Gamigion, Game Deconstruction: Magic Sort: Broom Streak, Jetpack Race, Sky Jump xuất hiện khá sớm, tính theo chuỗi thắng, trả khoảng 7 EUR để giữ chuỗi. [Link](https://www.gamigion.com/game-deconstruction-magic-sort-by-grand-games/)
6. `[GG-6]` Qua `benchmark-grand-games.md` mục 12: Gamigion "Magic Sort Analysis" (quảng cáo từ L22), video YouTube Coin Rush. [Link](https://www.gamigion.com/magic/), [Coin Rush](https://www.youtube.com/watch?v=6tixkPAPBzQ)
7. `[APK]` `global-metadata.dat` bản 0.9.5: `MissionManager`, `DailyTaskContainer`, `IsClaimMissionChest`, `SpinUI`, `LastSpinDate`, `SpinCountToday`, `PiggyBankUI`, `WinStreak`, `Infinity Heart`, `NotificationManager`, câu push "New stamps are waiting!", "Your album isn't complete yet". Level data: `research/apk/com.stamp.solit/levels/levels.csv`, `levels.json`.
