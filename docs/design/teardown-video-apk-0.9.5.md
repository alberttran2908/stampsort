# Teardown từ video level 1-9 và APK 0.9.5: Stamp Solitaire

**Ngày:** 2026-09-30 · **Trạng thái:** bổ sung và thay thế các mục 3, 4, 5, 11, 12 của `teardown-stamp-solitaire.md` (bản đó viết khi chưa có APK và video).

## 0. Nguồn và nhãn

| Nhãn | Nguồn | Ghi chú |
|---|---|---|
| `[VIDEO mm:ss]` | YouTube `fXxL3sDSrFA` "Stamp Solitaire levels 1-9", 17:21, 1080x1920. Bản trên máy: `research/video/levels-1-9.mp4` | Không biết version. Cắt frame 4 s/lần, sheet ở `research/video/sheets/` |
| `[APK]` | `Stamp+Solitaire_+Card+Matching_0.9.5_APKPure.xapk`, package `com.stamp.solit`, versionCode 14 | Unity IL2CPP. Giải nén ở `research/raw/com.stamp.solit/` |
| `[APK-LV]` | Level data giải mã từ `LevelManager` → 963 `LevelDataBase` | `research/apk/com.stamp.solit/levels/levels.json`, `levels.csv` |
| `[APK-CFG]` | `BoosterManager`, `GameSetting`, `CurrencyManager`, `DataGameManager`, `IAPProductCatalog` | `boosters.json`, `topics.json`, `unity/TextAsset/` |
| `[GIẢ THUYẾT]` | Suy luận chưa kiểm chứng | |

Tái lập toàn bộ: `python3 tools/stamp_levels_decode.py research/raw/com.stamp.solit/assets/bin/Data --out research/apk/com.stamp.solit/levels --export-assets research/apk/com.stamp.solit/assets_export` (cần `pip install UnityPy`).

**Lệch version:** video quay trên bản mới hơn 0.9.5. Bằng chứng rõ nhất là 10 trên 48 topic thấy trong video không có trong bảng 224 topic của APK: Cow, Watch, Cap, Clock, Animals, Music Note, Butterfly, Water Animal, Summer Trip, Pet Supplies. Level 2 trong video vẫn giống APK một phần (deck 18 lá, 4 topic Noodle/Ball/Car/Bird), nhưng moves khác (66 so với 90) và từ level 3 trở đi layout khác hẳn. AppBrain ghi bản 0.17.1 ngày 29/05/2026. Số liệu `[APK-LV]` vì thế là **bản cũ**, dùng để hiểu cấu trúc và cách sinh level, không dùng làm mốc độ khó hiện tại.

---

## 1. Mười điều quan trọng nhất

1. **Mỗi topic có số lá khác nhau.** Hộc hiện `x/n` với n từ 2 đến 12, phổ biến 3, 4, 6, 8 `[APK-LV]`. Video thấy 3 đến 6 `[VIDEO]`. GDD đang giả định K = 4 cố định.
2. **Chỉ topic stamp mới mở được foundation.** Topic stamp là lá viền vàng có vương miện và icon line-art. Stamp thường chỉ đặt lên foundation đã mở cùng topic `[VIDEO 00:28, 03:16]`.
3. **Topic bị ẩn cho tới khi topic stamp xuất hiện.** Stamp thường chỉ có hình và một con số mệnh giá trang trí, không ghi tên topic `[VIDEO]`. Người chơi phải tự đoán nhóm từ hình.
4. **Tableau chỉ xếp chồng cùng topic, và cả chồng di chuyển cùng nhau.** Cột trống nhận "complete stamp stack" `[VIDEO 00:17, 00:22]`.
5. **Mọi lá trong cột đều úp trừ lá trên cùng.** Cột xếp hình bậc thang như Klondike, ví dụ 2-3-4-5 hoặc 4-5-6-7 `[APK-LV][VIDEO]`.
6. **Deck là nguồn bài chính.** Khoảng 65% số lá và 70% topic stamp nằm trong deck `[APK-LV]`. Rút 1 lá tốn 1 move, waste xòe 3 lá, chỉ lá trên cùng dùng được `[VIDEO 06:48-06:52]`.
7. **Có 3 đến 5 foundation, cộng 1 hộc phụ mua thêm.** Hộc phụ giá 1000 coin hoặc 1 rewarded ad `[VIDEO 01:40][APK-CFG]`.
8. **Có 4 booster, mở theo level, và không có Undo.** Gồm Hint, Pack (nam châm), Stamper và Joker (Golden Stamp) `[APK-CFG][VIDEO]`.
9. **Monetization nặng.** Interstitial "Ad Break" sau mỗi level từ level 5, in-app review sau level 4, x2 coin qua ad ở màn thắng, có hệ lives 5 tim `[VIDEO]`.
10. **Level đại trà sinh theo template.** Sau level 50, 963 level chỉ xoay quanh 3 template (36/64/98 lá), moves ≈ 2 × số lá ở bản 0.9.5 `[APK-LV]`.

---

## 2. Luật chơi đã xác nhận

| Luật | Chi tiết | Nguồn |
|---|---|---|
| Mục tiêu | Đưa mọi stamp lên foundation theo topic, bắt đầu bằng topic stamp. Thao tác bằng kéo thả | `[VIDEO 00:05]` tutorial 1 |
| Mở foundation | Chỉ topic stamp vào được hộc trống ("Only a topic stamp can go into an empty foundation") | `[VIDEO 00:28]` |
| Đặt lên foundation | Chỉ stamp cùng topic. Hộc hiện nhãn tên topic và bộ đếm `x/n` | `[VIDEO 03:16]` tutorial "A foundation starts with a topic stamp" |
| Hoàn thành hộc | Đủ n lá thì chồng gấp thành phong bì có sáp niêm phong rồi bay đi, hộc trống lại | `[VIDEO 00:44, 05:56]` |
| Thắng | Mọi foundation đã giao hết. Lá Joker còn trên bàn không cần dọn | `[VIDEO 17:16]` |
| Tableau | Kéo stamp giữa các cột, chỉ đặt lên lá cùng topic ("Stack them when the sprites belong to the same topic") | `[VIDEO 00:22]` tutorial 4 |
| Chồng | Nhiều lá cùng topic liền nhau đi thành một chồng. Cột trống nhận cả chồng | `[VIDEO 00:17]` tutorial 3 |
| Úp/ngửa | Chỉ lá top ngửa. Lộ ra thì tự lật | `[VIDEO]`, `[APK]` không có cờ faceUp |
| Deck | Chạm deck góc phải trên để rút 1 lá, tốn 1 move. Hết deck thì nút recycle xanh xuất hiện | `[VIDEO 00:13]`, đếm moves `[VIDEO 06:44]` |
| Waste | Xòe 3 lá gần nhất, chỉ lá trên cùng kéo được. Kéo được từ waste sang tableau | `[VIDEO 04:52]` |
| Topic stamp nằm trong tableau | Hiện bộ đếm `0/n` ngay trên bàn. Nhiều khả năng nhận stamp cùng topic xếp lên | `[VIDEO 03:08]`, chưa xác minh: OCR 3124 frame (`tools/ocr_frames.swift`) không thấy bộ đếm trên lá topic ở bàn nào lớn hơn 0 khi đang chơi |
| Kéo chồng vào ô | Cả chồng cùng topic vào ô trong **1 move** | `[VIDEO 00:40]` level 1 Fruit 0/6→3/6; `[VIDEO 07:15]` level 5 Train 0/6→3/6, moves 76→75 (OCR) |
| Lật lại deck | **0 move** | `[VIDEO 03:41]` L3, `[VIDEO 08:04]` L5, `[VIDEO 09:57]` L6, `[VIDEO 12:01]` L7: deck nạp lại, moves giữ nguyên (OCR) |
| Kéo sai | Lá bật về, **0 move** | `[VIDEO 03:04-03:40]` nhiều lần kéo sai, moves đứng ở 52 |
| Moves | Mọi thao tác tốn 1 move, kể cả rút bài. Level 1 vô hạn | `[VIDEO]`, `[APK-LV]` moves = 99999 |
| Undo | Không có nút Undo trên thanh booster | `[VIDEO]` |
| Combo | Thanh combo dưới tiêu đề level (từ level 5) đầy dần bằng dấu sáp. Coin nhỏ bật ra 1, 3, 6, 13, 20, 25, 30 | `[VIDEO 06:44-08:52]`, `StreakManager` `[APK]`. Điều kiện tăng combo là `[GIẢ THUYẾT]` (đặt liên tiếp không rút bài) |

---

## 3. Định dạng level data trong APK

Class `LevelDataBase` (ScriptableObject, không typetree). Layout sau header MonoBehaviour `[APK]`:

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `tutorial` | int | 1 ở level 1-2 |
| `unk1` | int | luôn 0 |
| `moves` | int | 99999 = vô hạn |
| `nTopicsHint` | int | xấp xỉ số topic |
| `unk2` | int | chưa rõ |
| `topicList` | List\<string\> | chỉ có ở vài level đầu |
| `allCards` | List\<Card\> | toàn bộ lá, lặp lại 2 lần giống hệt nhau |
| `columns` | List\<Column\> | tableau. Column = int, int (luôn 0), List\<Card\>. Phần tử 0 là đáy, cuối là top |
| `preplaced` | List\<Column\> | foundation mở sẵn, chỉ ở level 1, 5, 7 |
| `deck` | List\<Card\> | phần còn lại |
| `foundations` | int | 3, 4 hoặc 5 |
| `tail` | int, float 0.3, int 3, int 0, int 2 | hằng số, chưa rõ nghĩa |

Card = `kind` (1 topic stamp, 2 stamp thường), `topic`, `PPtr<Sprite>`, tên sprite, `count` (n của topic stamp). Bộ đếm luôn khớp: số stamp thường mỗi topic đúng bằng n của topic stamp đó.

`LevelManager` giữ thứ tự 963 level (thư mục `Assets/Game_/SciptableObject/Object/BackLevel`). Bundle còn một **bộ 963 level thứ hai** không được `LevelManager` tham chiếu (pathID 10189-11152). Bộ này có cùng layout byte, moves ≈ 2 × số lá, nhưng deck gần như chưa xáo: 83% cặp lá liền nhau cùng topic. Level 2 của bộ này có moves 65 và phân bố n {6, 6, 4, 4, 3, 3}, rất gần level 2 trong video (66 moves). Giả thuyết: đây là bộ A/B hoặc bộ template mà game xáo lại lúc chạy `[GIẢ THUYẾT]`. Script hiện chỉ xuất bộ được tham chiếu.

---

## 4. Đường cong level (APK 0.9.5)

| Dải | Moves (min, trung vị, max) | Số lá | Topic | Deck | Moves/lá | Foundation |
|---|---|---|---|---|---|---|
| L2-10 | 90, 180, 220 | 30, 52, 59 | 6, 8, 9 | 18, 39, 45 | 2.7, 3.7, 4.4 | 4 (7 level), 3 (2) |
| L11-20 | 75, 148, 220 | 32, 56, 67 | 4, 8.5, 10 | 23, 40, 51 | 2.1, 3.2, 3.5 | 4 (8), 3 (2) |
| L21-50 | 80, 133, 240 | 36, 63, 95 | 6, 10, 16 | 27, 46, 70 | 1.7, 2.2, 3.6 | 4 (23), 3 (4), 5 (3) |
| L51-963 | 75, 130, 250 | 36, 64, 98 | 6, 10, 15 | 24, 42, 74 | ≈ 2.0 | 4 (65%), 3 (20%), 5 (15%) |

- Level khó nhất trong 100 level đầu (moves/lá thấp): 31, 32, 49, 50, 45, 43. Moves/lá rơi từ ~3.7 xuống ~2.0 quanh level 30 rồi đứng yên.
- Sau level 50 chỉ còn vài template:

| Template | Số lá | Foundation | Cột | Deck | Moves | Tần suất (L51+) |
|---|---|---|---|---|---|---|
| Normal | 64 | 4 | 4-5-6-7 | 42 | 130-150 | ≈ 58% |
| Breather | 36 | 3 | 3-4-5 | 24 | 75 | ≈ 19% |
| Big | 98 hoặc 92 | 5 | 5-6-7-8-9 | 63 / 57 | 185-230 | ≈ 14% |
| Medium-big | 80 | 4 | 5-6-7-8 | 54 | 160-190 | ≈ 5% |

- Nhịp không theo chu kỳ cố định 10 level. Breather rải khoảng 1/5 level, big khoảng 1/7.
- 224 topic, dùng đều (topic dùng nhiều nhất 66 lần trên 963 level). Mỗi topic có 6-17 art. Không level nào lặp art trong cùng một topic.

### So sánh 9 level đầu: video và APK

| Level | Video: moves đầu → còn lại khi thắng | Video: foundation / cột / deck | Topic thấy trong video (n) | APK 0.9.5: moves / foundation / cột / deck | Sự kiện trong video |
|---|---|---|---|---|---|
| 1 | ∞ | 3 / 3 / 7 | Cat 4, Fruit 6, Pizza 3 | ∞ / 3 / 4-5-5 / 3 | 4 bong bóng tutorial |
| 2 | 66 → 17 | 3 (+1 khóa) / 3 / 18 | Dog 4, Noodle 4, Ball 6, Bird 3, Car 3, Phone | 90 / 3 / 3-4-5 / 18 | Mở Hint (3 lượt free), popup hộc phụ |
| 3 | 75 → 19 | 4 / 4 / 21 | Ship 6, Candy 5, Cow 4, Balloon 5, Watch 5, Cap 4, Hat, Clock | 180 / 4 / 2-3-4-5 / 28 | |
| 4 | 82 → 15 | 4 / 4 / 24 | Dinosaur 4, Glasses 5, Fast Food 5, Pets 5, Chess 4, Car 4, Flower | 180 / 4 / 2-3-4-5 / 27 | Mở Pack. In-app review sau khi thắng |
| 5 | 96 → 6 | 4 / 4 / 34 | Dog 6, Tree 5, Train 6, Soda 6, Fruit, Ice Cream, Truck | 200 / 4 / 1-2-3-4 / 41 | Thanh combo xuất hiện. Ad Break sau level |
| 6 | 76 → 11 | 4 / 4 / 22 | Animals 4, Soft Drink 6, Planet 5, Music Note 5, Sauce 3, Vegetable 6 | 220 / 4 / 2-3-4-5 / 45 | Ad sau level |
| 7 | 80 → 8 | 4 (1 mở sẵn Water Animal 6) / 4 / 26 | Glasses, Music Note, Tea, Summer Trip, Zoo, Car | 145 / 3 / 2-3-4 / 43 (1 mở sẵn) | Mở Stamper. Ad Break |
| 8 | 75 → 9 | 4 / 4 / 22 | Footwear 4, Outerwear 5, Raw Meat 5, Cocktail 5, Desserts | 120 / 4 / 2-3-4-5 / 26 | Ad Break |
| 9 | 110 → 22 | 4 / 4 / 30 | Zoo 5, Sculpture 5, Pet Supplies 5, Pizza 5, Sashimi 5, Balloon | 175 / 4 / 2-3-4-5 / 41 | Mở Joker |

Người chơi trong video dùng 74-94% moves, trung bình khoảng 83%. Bản mới siết moves chặt hơn nhiều so với tỉ lệ 2 × số lá của 0.9.5. Mỗi level kéo dài 90-160 giây.

---

## 5. Booster, economy, ads

### Booster `[APK-CFG]` + `[VIDEO]`

| Booster | Mô tả trong game | Giá coin | Mở ở level (APK / video) | Free khi mở |
|---|---|---|---|---|
| Hint (kính lúp) | "Suggestion for your next move" | 300 | 2 / 2 | 3 |
| Pack (nam châm, phong bì) | "Add 2 random hidden cards to a Topic" | 500 | 5 / 4 | 2 |
| Indicate / Stamper (con dấu) | "Choose a Topic to add one card" | 500 | 7 / 7 | 2 |
| Joker (Golden Stamp) | "Play on any card. Any card can be placed on it until the level ends!" | 1200 | 9 / 9 | 2 |

Joker không phải lá tự bay lên foundation như teardown cũ đoán. Nó là một lá vàng đặt lên đầu bất kỳ cột nào, sau đó nhận mọi stamp, thành chỗ đỗ tạm vô hạn đến hết level `[VIDEO 14:36]`.

### Economy và meta

| Mục | Giá trị | Nguồn |
|---|---|---|
| Coin khởi đầu | 500 | `CurrencyManager` `[APK-CFG]`, `[VIDEO 01:40]` |
| Lives | 5, màn thắng hiện "Full" | `CurrencyManager` `[APK-CFG]`, `[VIDEO 02:32]` |
| Hằng số thời gian | 300.0 và 1200.0 | `CurrencyManager`. Hồi tim là `[GIẢ THUYẾT]` |
| Hộc phụ | 1000 coin hoặc 1 ad. `GameSetting` còn có 2000 và 4000, có thể là giá hộc thứ 2 và 3 | `[VIDEO 01:40]`, `[APK-CFG]` |
| Thưởng thắng | 20 coin (L2-4), 36 (L8), nút "Claim x2" qua rewarded ad | `[VIDEO]` |
| IAP | removeads, basic/collector/master/legend/rare pack, coin1-6, piggybank | `IAPProductCatalog.txt` `[APK-CFG]` |
| Meta khác trong code | `MissionManager`, `DailyTask`, `Achievement`, `RewardChest` (lấy từ project AnimalRestaurant) | tên class `[APK]` |

### Ads và SDK
- Interstitial "Ad Break..." sau level 5, 6, 7, 8. Không có ad trước level 5 `[VIDEO]`.
- In-app review Google Play sau khi thắng level 4 `[VIDEO 06:36]`.
- Mediation ironSource LevelPlay kèm AppLovin, Unity Ads, Mintegral, Moloco, InMobi, Pangle, Vungle, AdMob, Facebook AN. Attribution AppsFlyer. Firebase Analytics, Remote Config, Messaging `[APK]` `report.md`. Remote Config có thể ghi đè moves, đây cũng là một giả thuyết cho chỗ lệch với video.

---

## 6. Asset (tham khảo, không dùng lại)

Export ở `research/apk/com.stamp.solit/assets_export/` (đã `.gitignore`, chỉ để trên máy). Ảnh tổng quan: `assets_export/overview_ui_cards.jpg`.

| Nhóm | Số lượng | Ghi chú cho prototype |
|---|---|---|
| Card art | 2149 sprite, 224 topic, tên `<Topic>_P<n>` | Khoảng 135x135, nét viền đen dày, màu bão hòa, phong cách sticker. Nằm trên nền tem màu pastel có răng cưa |
| Icon topic | 224, line-art trắng | Vẽ lên khung vàng `Gold_Stamp_01` (190x248) kèm vương miện `Gold_Stamp_02` |
| Khung lá | `Card_Back_02` 180x240 | Tỉ lệ lá 3:4. Mặt úp là tem kem trơn |
| UI chính | `Box_Move_01` (ô moves), `Box_Frame_01` (hộc trống hình ngôi sao), `Envelope_01/02`, `Seal`, `Wax`, `GoldenStamp_01`, icon 4 booster, `BG_Letter_01-03` (loading) | |
| Font | Lilita One (chính), Bangers, Anton, Oswald | Lilita One là Google Font, dùng được cho web prototype |
| Audio | 42 clip `.wav` | Bảng dưới |

Âm thanh theo sự kiện, suy từ tên clip `[APK]`:

| Sự kiện | Clip |
|---|---|
| Nhấc lá / đặt lá | `PickCard`, `AddCardNormal` |
| Topic stamp vào hộc | `SFNDockTopic` |
| Hộc hoàn thành, phong bì bay | `EndAddTopic` |
| Lật lá, chia bài | `ChangeFaceCard`, `BackCard`, `SpawnCard` |
| Lá bay lên theo combo | `Collectable_Card_Flying_V2_var-01` đến `-11` (thang cao độ tăng dần) |
| Booster | `Suggest` (hint), `Magnet` (pack), `BoosterChooseTopic` (stamper), `NewFeature` (mở booster) |
| Hộc phụ | `UnlockDock`, `SoundUnlockDock` |
| Kết quả | `WinS`, `OutOfMove`, `Coin`, `CoinCollect`, `EndClaimCoin` |

### Layout màn chơi (portrait 1080x1920, đo trên `[VIDEO 06:58]`)

| Vùng | Vị trí theo chiều cao | Nội dung |
|---|---|---|
| HUD | 0-10% | Ô MOVES trái, "Level N" và thanh combo giữa, nút pause phải |
| Hàng deck | 16-30% | Hộc phụ khóa kèm dấu + (trái), waste xòe 3 lá (giữa), deck kèm số lá còn lại (phải) |
| Foundation | 33-44% | 3-5 hộc hình ngôi sao, mỗi hộc có nhãn tên topic và `x/n` |
| Tableau | 46-80% | Các cột bậc thang. Lá úp chồng lộ khoảng 12% chiều cao lá |
| Thanh booster | 87-95% | 4 nút, badge số lượng, hoặc ổ khóa ghi "LEVEL N" |

Lá rộng khoảng 15% chiều ngang màn hình.

---

## 7. Hệ quả cho GDD và prototype của stampsort

Đây là chỗ thiết kế hiện tại khác game gốc. Giữ hay đổi là quyết định thiết kế, không bắt buộc sửa theo.

| Mục | `gdd-core.md` / `prototype/index.html` hiện tại | Stamp Solitaire thật | Gợi ý |
|---|---|---|---|
| Số lá mỗi topic | K = 4 cố định | n từ 2 đến 12, hộc hiện `x/n` | Cho n biến thiên 3-8. Hộc to là "khoảnh khắc lớn" |
| Mở hộc | `OPEN` bằng bất kỳ lá nào của category | Chỉ topic stamp. Topic stamp là "chìa khóa" và là nguồn căng thẳng chính | Thêm lá "Người nhận" (portrait cư dân) làm topic stamp. Khớp fiction "Little Post Office" |
| Hiển thị topic | Category ẩn | Ẩn cho tới khi topic stamp lộ ra | Giữ |
| Tableau | `MOVE_COLUMN` tự do, 1 lá | Chỉ xếp lên cùng topic, di chuyển cả chồng, cột trống nhận mọi chồng | Đổi theo game gốc. Đây là phần "solitaire" tạo kỹ năng |
| Úp lá | `faceDownRatio` 0-0.6 | Mọi lá trừ top đều úp, cột bậc thang | Dùng bậc thang 2-3-4-5 |
| Deck | 0-12 lá | Deck là nguồn chính, khoảng 65% số lá, rút 1 lá/move, waste xòe 3 | Tăng vai trò deck. Để phần lớn topic stamp trong deck |
| Số hộc | 4 | 3/4/5 theo level, cộng hộc phụ trả phí | Hộc phụ là điểm bán tốt, hợp với fiction "mở thêm quầy" |
| Moves | `ceil(solverMoves × kTier)` | 0.9.5: ≈ 2 × số lá. Bản mới: người chơi giỏi dùng khoảng 83% | Bắt đầu từ 2 × số lá rồi siết theo playtest |
| Undo | 3 free, sau đó tốn coin | Không có | Undo là điểm khác biệt "cozy" có chủ đích, nên giữ |
| Booster | Hint, Joker (kéo lá sâu nhất), Ca tối (+5 moves), Cà phê sáng | Hint, Pack (+2 lá ẩn vào topic), Stamper (+1 lá vào topic chọn), Joker (chỗ đỗ vô hạn) | Cân nhắc Joker kiểu gốc. Nó dễ hiểu và mạnh mà không phá luật |
| Nhịp level | Tier/role tay | 3 template, breather khoảng 1/5 level | Generator theo template (36/64/98 lá) là đủ cho Phase 1 |
| Ads | Không interstitial | Interstitial mỗi level từ L5 | Giữ hướng ad-light như đã chọn |

Data cho prototype: `research/apk/com.stamp.solit/levels/levels.json` dùng được ngay làm level mẫu. Layout lá, deck, topic và n đã có đủ. Chỉ cần đổi tên topic sang bộ thư của stampsort và sinh art riêng.

---

## 8. Câu hỏi còn mở

1. Topic stamp nằm trong tableau có nhận stamp xếp lên không, và bộ đếm trên nó có tính vào foundation khi kéo lên không? Cần xem lại video ở tốc độ chậm quanh 03:10-03:40.
2. Recycle deck có tốn move không? Video không đủ rõ.
3. Hết moves thì hiện gì, giá "+moves" bao nhiêu? Video không có lần thua nào.
4. Điều kiện tăng thanh combo và công thức coin combo.
5. `GameSetting` 900 và 50, `CurrencyManager` 300.0 và 1200.0 nghĩa là gì? Cần dump IL2CPP (`libil2cpp.so` trong `config.arm64_v8a.apk` cùng `global-metadata.dat`) bằng Il2CppDumper để đọc tên field.
6. Version của video. Nếu tải được APK bản 0.17+ thì chạy lại `tools/stamp_levels_decode.py` để so moves.
7. Bộ 963 level thứ hai (không được tham chiếu) được dùng khi nào: A/B test qua Remote Config hay xáo lúc chạy?
