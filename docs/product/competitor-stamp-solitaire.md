# Competitor teardown (product/thị trường): Stamp Solitaire: Card Matching

**Tác giả:** product-owner agent · **Ngày:** 2026-09-25 · **Trạng thái:** bản đầu, chưa có APK dump

**Phạm vi:** positioning, quy mô, monetization, LiveOps, ABI Game Studio, review, đối thủ, cơ hội/rủi ro cho `stampsort`. Không phân tích cơ chế gameplay chi tiết – xem `docs/design/teardown-stamp-solitaire.md` (game-designer).

**Nhãn nguồn:** `[STORE]` store listing/aggregator (AppBrain, mwm.ai, UpdateStar), `[MARKET]` AppMagic/Sensor Tower/bài viết, `[PLAY]` quan sát gameplay, `[GIẢ THUYẾT]` suy luận. Chưa có `[APK]`.

**Hạn chế phương pháp:** WebFetch tới play.google.com, apps.apple.com, appbrain.com, mwm.ai, appmagic.rocks, sensortower.com, abigames.com.vn, anymindgroup.com, pocketgamer.biz đều bị chặn egress. Toàn bộ số liệu dưới đây lấy từ **snippet WebSearch** của các trang đó, nên: (1) mốc thời gian của snippet không đồng nhất (AppBrain snapshot ~đầu tháng 6/2026, UpdateStar 8/2026); (2) không đọc được changelog đầy đủ, IAP catalog, giá No-Ads; (3) review chỉ là mẫu nhỏ, không có tỷ lệ. Độ tin cậy tổng thể: **trung bình-thấp**, cần xác minh lại khi truy cập trực tiếp store hoặc có APK.

---

## 1. Định danh và positioning

| Mục | Giá trị | Nguồn |
|---|---|---|
| Tên | Stamp Solitaire: Card Matching | `[STORE]` |
| Package Android | `com.stamp.solit` | `[STORE]` https://play.google.com/store/apps/details?id=com.stamp.solit |
| App Store ID | 6761845923 | `[STORE]` https://apps.apple.com/us/app/stamp-solitaire-card-matching/id6761845923 |
| Publisher Android | ABI GLOBAL LTD. | `[STORE]` https://play.google.com/store/apps/developer?id=ABI+GLOBAL+LTD. |
| Publisher iOS | PITI STUDIO TECHNOLOGY DEVELOPMENT AND INVESTMENT JSC ("Piti Studio") | `[STORE]` https://mwm.ai/apps/app/6761845923 |
| Category | Puzzle (Google Play: top 100 puzzle theo AppBrain) | `[STORE]` https://www.appbrain.com/app/stamp-solitaire-card-matching/com.stamp.solit |
| Kích thước APK | ~162 MB | `[STORE]` AppBrain |
| Model | Free, contains ads, in-app purchases | `[STORE]` |

**Positioning theo listing `[STORE]`:** "classic solitaire meets the colorful world of stamp collecting" – trộn solitaire + sorting/category matching + word/image association; nhấn mạnh "relaxing", "brain training", "collect stamps, themed albums", "no pressure". Mô tả Google Play còn dùng từ khóa "word cards", "word associations" – tức là ABI đang cố bám vào subgenre **Solitaire Associations / Word Solitaire** đang nóng (xem mục 7) nhưng khoác skin sưu tầm tem để khác biệt về visual.

**Audience `[GIẢ THUYẾT]` (độ tin cậy trung bình):** nữ 35+, US/Tier-1 tiếng Anh, chơi puzzle nhẹ, quen với solitaire; tệp trùng với Hitapps "Solitaire Associations Journey" và các game "sort" của ABI. Cơ sở: ngôn ngữ listing ("relaxing", "brain", "collect"), review viết tiếng Anh với giọng người chơi lớn tuổi (nhắc "level 272", "ad breaks"), và pattern ABI tối ưu thị trường US (mục 5).

**Sibling cùng template:** *Stamp Match: Solitaire Master* (`com.stamp.match`, publisher ABI GAMES PTE. LTD.) – "match 4 same-group cards in a row, boosters, unlimited levels, unlock destinations, build stamp gallery" `[STORE]` https://play.google.com/store/apps/details?id=com.stamp.match. `[GIẢ THUYẾT]`: đây là bản thử nghiệm trước hoặc bản chạy song song để A/B skin/tên; Stamp Solitaire là bản được chọn scale.

---

## 2. Quy mô và tăng trưởng

| Chỉ số | Giá trị | Mốc | Nguồn |
|---|---|---|---|
| Ra mắt Google Play | ~giữa tháng 4/2026 ("available 7 weeks ago" tính đến đầu 6/2026) | – | `[STORE]` AppBrain snippet |
| Downloads Android (tổng) | ~370K | ~đầu 6/2026 | `[STORE]` AppBrain |
| Downloads Android (30 ngày) | ~350K (~12K/ngày) | ~đầu 6/2026 | `[STORE]` AppBrain |
| Rating Google Play | 4.63 / 3.7K ratings | ~6/2026 | `[STORE]` AppBrain |
| Downloads iOS | "250k+" | không rõ mốc | `[STORE]` mwm.ai |
| Rating App Store | 4.7 / 2.2K ratings | không rõ mốc | `[STORE]` mwm.ai |
| Version | 0.17.1 (29/5/2026) → 0.26.1 (19/8/2026) | – | `[STORE]` AppBrain; https://stamp-solitaire-card-matching.updatestar.com/en |
| Xếp hạng | Top 100 Puzzle (Google Play, theo AppBrain) | ~6/2026 | `[STORE]` |

**Đọc số liệu:**
- 95% lượt tải Android nằm trong 30 ngày gần nhất tại thời điểm snapshot → game mới ở giai đoạn **ramp UA** (soft launch → scale) chứ chưa ổn định. `[GIẢ THUYẾT]` tổng cộng cả 2 nền tảng đến 6/2026 khoảng 0.6–0.7M; đến 9/2026 nếu giữ tốc độ 12K/ngày Android thì có thể 1.5–2M, độ tin cậy thấp.
- Rating 4.6–4.7 với vài nghìn lượt là **tốt** cho game có ads dày (benchmark ABI: các game ABI Global khác 4.5–4.6 `[STORE]`).
- Không tìm được ước lượng revenue riêng cho game này `[MARKET]` (AppMagic/Sensor Tower yêu cầu đăng nhập).
- Lưu ý phiên bản: brief nội bộ nhắc "~0.9.5"; theo semver, 0.9.x nằm trước 0.17.1 → đó là build khoảng cuối 4 – đầu 5/2026, tức ~2–3 tuần sau launch. Khi có APK cần đối chiếu `versionName`.

---

## 3. Mô hình monetization (suy ra từ listing + review)

Không đọc được IAP catalog hay giá No-Ads. Những gì suy ra được:

| Thành phần | Bằng chứng | Nhãn |
|---|---|---|
| **Interstitial sau level** | Review: "ads at the end of matches" rồi "ads after every level completion" | `[STORE]` review App Store https://apps.apple.com/us/app/stamp-solitaire-card-matching/id6761845923?see-all=reviews&platform=iphone |
| **Interstitial giữa level ("ad break")** | Review: "sponsored ad breaks in the middle of the game", "ads in the middle of gameplay" | `[STORE]` review App Store |
| **Escalation theo tiến độ** | "starts with no ads → after every level → mid-level; ad duration increases as you advance" | `[STORE]` review |
| **Rewarded: x2 reward sau level** | "watch ad for double rewards"; bỏ qua vẫn bị ad break | `[STORE]` review |
| **Rewarded: thêm moves / cứu level** | "spend all coins or watch multiple ads to finish the level" | `[STORE]` review |
| **Lives** | "if you don't watch the offered ad after losing and try to exit, it doubles the number of lives taken" | `[STORE]` review |
| **Coins (soft currency)** | dùng mua thêm moves/booster | `[STORE]` review |
| **Move limit theo level** | level 40+ cards thiếu moves; dev đã "adjusted affected levels" | `[STORE]` review + dev reply |
| **Boosters** | listing sibling Stamp Match: "use boosters when stuck" | `[STORE]` |
| **IAP** | "In-app purchases" trên cả 2 store; giá cụ thể không thấy | `[STORE]` |
| **No-Ads** | không xác nhận được có/không, giá bao nhiêu | chưa rõ |

**Kết luận `[GIẢ THUYẾT]` (độ tin cậy trung bình):** ad-first hybrid-casual điển hình ABI – interstitial tần suất tăng dần theo remote config (ramp theo level/ngày), rewarded gắn vào fail-state (moves/lives) và win-state (x2), IAP chủ yếu coin pack + có thể No-Ads/starter pack. Cơ chế "lives + moves + coins" cho thấy họ dùng **difficulty spike** làm điểm bán (review xác nhận). Dev có phản hồi và nerf level → có pipeline hotfix level data qua remote/CDN.

Ngoài ra ABI đã ký AnyMind (12/2023) để tối ưu floor price/ad demand toàn portfolio, ARPDAU một app tăng +8–15%/tháng `[MARKET]` https://anymindgroup.com/news/press-release/abi-anymind-optimization – tức stack ads của họ không chỉ MAX/AdMob mà có thêm lớp bidding riêng. ABI cũng dùng AppsFlyer + Apple Search Ads `[MARKET]` https://www.appsflyer.com/customers/abi-game-studio/.

---

## 4. LiveOps cadence

Không đọc được changelog đầy đủ; suy từ version/ngày:

| Mốc | Version | Nguồn |
|---|---|---|
| ~giữa 4/2026 | ra mắt Google Play | `[STORE]` AppBrain |
| 29/5/2026 | 0.17.1 | `[STORE]` AppBrain |
| 19/8/2026 | 0.26.1 | `[STORE]` UpdateStar |

- Từ launch đến 0.17.x trong ~6–7 tuần → ~2–3 bản/tuần giai đoạn đầu; từ 0.17.1 → 0.26.1 là 9 minor trong 82 ngày → **~1 minor/9 ngày** `[STORE]`, phù hợp pattern ABI "rapid prototyping and frequent updates" `[MARKET]` https://respawn.outlookindia.com/gaming/gaming-guides/top-10-hypercasual-gaming-publishers-worldwide-q3-2025.
- Version vẫn 0.x sau 4 tháng → `[GIẢ THUYẾT]` họ coi game còn ở giai đoạn tối ưu (chưa "1.0"), đúng phong cách soft-launch-kéo-dài của ABI.
- Nội dung update `[GIẢ THUYẾT]`: level mới, chỉnh moves/difficulty (dev reply xác nhận), ad config; chưa thấy bằng chứng event theo lịch (daily challenge, season) trong snippet. Review "level 272 mà 100 level gần nhất không có category mới" cho thấy **content cadence chưa theo kịp UA**.

---

## 5. ABI Game Studio: portfolio và pattern vận hành

| Mục | Dữ liệu | Nguồn |
|---|---|---|
| Pháp nhân | ABI Game Studio thuộc Onesoft JSC (2010), Hà Nội, >100 nhân sự, >150 title | `[MARKET]` https://abigames.com.vn/about-us/ |
| Tài khoản publisher | ABI Games Studio, ABI GAMES PTE. LTD. (Singapore), ABI GLOBAL LTD., iOS: Piti Studio | `[STORE]` https://play.google.com/store/apps/developer?id=ABI+GAMES+PTE.+LTD. ; https://apps.apple.com/us/developer/abi-global-ltd/id1743349083 |
| Quy mô | 102M downloads tính đến 6/2023; 67M downloads, ~$2.5M revenue riêng Q3/2025 | `[MARKET]` https://abigames.com.vn/abi-game-studio-reached-102-16m-downloads-in-june-2023/ ; Outlook India (AppMagic) |
| Hit hybrid-casual | Dreamy Room: >20M tải, >$5M (2/2025), 30M tải, 9.5M tải/30 ngày, ~$72K/ngày ad rev (Q1/2025). Bus Escape: >20M tải, >$10M (9/2024) | `[MARKET]` https://appmagic.rocks/google-play/dreamy-room/com.abi.dream.unpacking ; https://www.gamigion.com/ad-monetization-trends-q1-2025/ |
| Legacy | Galaxy Attack: Alien Shooter ~100M tải, top 10 US | `[MARKET]` abigames.com.vn |
| Portfolio ABI Global (cùng thời Stamp Solitaire) | Packingdom (4.6), Drop Color: Animal Joy (4.5), Block Art: Gem Sort Puzzle (4.5), Powder Factory: Sorting Jam (4.6) | `[STORE]` developer page |
| Ads stack | AnyMind AnyManager SDK (12/2023), AppsFlyer, Apple Search Ads | `[MARKET]` |
| Publishing | có chương trình ABI Publishing cho studio bên ngoài | `[MARKET]` https://abigames.com.vn/publishing/ |

**Pattern vận hành `[GIẢ THUYẾT]` (độ tin cậy cao vì khớp nhiều nguồn):**
1. **Trend-chasing có kỷ luật:** bắt subgenre đang lên (sort, unpacking, traffic jam, solitaire associations), reskin nhanh, tung nhiều biến thể dưới nhiều tài khoản publisher (Stamp Match vs Stamp Solitaire) để test tên/icon/skin.
2. **Ads-first, IAP phụ:** revenue/download rất thấp (Q3/2025: $2.5M / 67M ≈ $0.04/download) → LTV chủ yếu từ ads, CPI phải cực thấp; đây là điểm yếu nếu gặp đối thủ có IAP tốt.
3. **Nhiều pháp nhân** (VN/SG/UK-HK) – có thể để tách rủi ro policy và tối ưu thuế/thanh toán.
4. **Update dày, version 0.x kéo dài**, tối ưu bằng remote config và hotfix level data.

---

## 6. Phân tích review

Nguồn: snippet review App Store (https://apps.apple.com/us/app/stamp-solitaire-card-matching/id6761845923?see-all=reviews&platform=iphone) và Google Play (https://play.google.com/store/apps/details?id=com.stamp.solit). Mẫu nhỏ, **không có tỷ lệ**; thứ tự dưới đây theo tần suất xuất hiện trong snippet `[STORE]`.

**Top 5 phàn nàn**

| # | Phàn nàn | Trích dẫn tiêu biểu | Ý nghĩa product |
|---|---|---|---|
| 1 | Ads quá dày, leo thang, xuất hiện giữa level | "ads are just getting ridiculous… ad breaks in the middle of the game"; "Way too many ads!"; bỏ game ở level 118 | Ramp interstitial quá gắt sau ~100 level; điểm churn của người chơi engaged |
| 2 | Thiếu moves ở level khó (40+ cards) → ép coin/ads | "nowhere near enough moves… spend all coins or watch multiple ads" | Difficulty spike bị cảm nhận là pay-wall; dev đã nerf |
| 3 | Nội dung lặp, không có category/card mới | "level 272… no new categories in the last 100 levels… MAYBE 10 new cards" | Content pipeline chậm hơn UA |
| 4 | Lives bị trừ gấp đôi khi từ chối ad/thoát | "doubles the number of lives taken" | Dark pattern, gây mất niềm tin |
| 5 | Bug: reset về level 1, freeze sau level phải chơi lại | "reset to level 1 after level 8-10"; "freezes after completing a level" | Lỗi save/sync ở FTUE → rơi D1 |

Phụ: "For a game with AI designed cards, you show too many ads" – người chơi nhận ra art AI; là điểm chê thêm khi kết hợp với ads.

**Top 5 khen**

| # | Khen | Trích dẫn |
|---|---|---|
| 1 | Relaxing, dễ chơi | "really nice… and relaxing" |
| 2 | Hình ảnh tem đẹp, dễ nhận diện | "the pictures are really easy to recognize"; "praised the graphics" |
| 3 | Độ khó tăng hợp lý (giai đoạn đầu) | "difficulty scale" được khen |
| 4 | Yêu thích gameplay tổng thể | "i love this game!" |
| 5 | Dev phản hồi và sửa level | Stamp Solitaire Support Team: "adjusted affected levels to provide a fairer number of moves" |

---

## 7. Đối thủ trực tiếp

Subgenre: **Solitaire Associations / Category Sort Solitaire**. Số liệu Android từ AppBrain snippet `[STORE]`, mốc 5–6/2026 trừ khi ghi khác.

| Game | Publisher | Downloads Android | Rating | Ra mắt | Ghi chú |
|---|---|---|---|---|---|
| **Solitaire Associations Journey** | Hitapps Games | ~30M tổng, ~1.9M/30 ngày | 4.14 / 390K | trước 2026 | #1 Word; leader subgenre; rating thấp hơn hẳn → nhiều phàn nàn. https://www.appbrain.com/app/solitaire-associations-journey/com.hitappsgames.wordsolitaire |
| **Stamp Solitaire** (đối tượng) | ABI Global / Piti | ~370K, ~350K/30 ngày | 4.63 / 3.7K | 4/2026 | skin tem, art AI |
| **Word Solitaire: Categories** | AI Games FZ | không lấy được | – | – | 32 ngôn ngữ, Play Pass; category có hình. https://play.google.com/store/apps/details?id=com.solitaire.match.words |
| **Solitaire Word Association** | PlaySimple | ~13K, ~8.2K/30 ngày | 4.84 / 180 | 3/2026 | Big publisher word game đang test; v1.16.0 (18/5/2026). https://www.appbrain.com/app/solitaire-word-association/in.playsimple.solitaireassociation |
| **Categories Solitaire** | Multicast Games | ~26K | 4.56 / 200 | – | indie, update 1/2026. https://www.appbrain.com/app/categories-solitaire/com.multicast.catsolitaire |
| **Solitairy: Category Solitaire** | Emmanuel Quarcoo | không lấy được | – | 2025-26 | 40 level handcrafted, ít ads, No-Ads rẻ – được khen chính vì đó. https://apps.apple.com/us/app/solitairy-category-solitaire/id6758812533 |
| **Category Sort: Tile Solitaire** | không rõ | không lấy được | – | 2026 | 1000+ level, mahjong layout, boosters, offline. https://play.google.com/store/apps/details?id=oc.category.sort |

**Đọc bảng:** subgenre có 1 leader lớn (Hitapps, rating yếu), 1 big publisher đang thử (PlaySimple), và rất nhiều clone nhỏ ra trong 12 tháng gần nhất (Fiogonia, SNG, Qiiwi, Evrika, Mobgame, Felicity…) → thị trường **đông nhưng chưa có sản phẩm "chất lượng cao + ads vừa phải"**. Stamp Solitaire khác biệt bằng skin tem + hình ảnh thay vì chữ; đối thủ tệp lớn nhất là Hitapps.

Bối cảnh `[MARKET]`: puzzle ad exposure tăng ~40% YoY, hybrid-casual tăng revenue trong khi hypercasual tăng engagement (https://www.deconstructoroffun.com/blog/2026/2/2/state-of-mobile-2026 ; https://appmagic.rocks/research/mobile-landscape-report-2026). Không có số riêng cho subgenre.

---

## 8. Cơ hội và rủi ro cho stampsort

**Cơ hội**
1. **Khoảng trống "fair ads"**: cả leader (Hitapps 4.14) lẫn Stamp Solitaire đều bị chê ads leo thang giữa level. Một game giữ interstitial chỉ ở end-of-level + cooldown, bán No-Ads giá hợp lý có thể lấy rating và word-of-mouth. Đo: rating, % review nhắc "ads", D7.
2. **Content depth**: người chơi tới level 272 và chán vì không có category mới → nếu có pipeline category/theme theo tuần (hoặc procedural mix) sẽ giữ D30. Đo: D30, level reach distribution.
3. **Meta sưu tầm thực sự**: Stamp Solitaire quảng cáo "album/collection" nhưng review không nhắc meta → `[GIẢ THUYẾT]` meta mỏng. Album có mục tiêu, set bonus, sự kiện theo mùa là điểm khác biệt (cần game-designer xác nhận cơ chế).
4. **iOS Tier-1**: rating iOS 4.7 và audience lớn tuổi → IAP conversion tiềm năng cao hơn ads; ABI yếu IAP (≈$0.04/download).
5. **Difficulty minh bạch**: move limit hợp lý + booster mua bằng coin kiếm được → giảm cảm giác pay-wall, tăng trust.

**Rủi ro**
1. **UA đối đầu ABI**: họ scale ~12K tải/ngày chỉ Android với CPI thấp nhờ creative/network in-house; stampsort không thể thắng bằng volume. Cần tệp/geo hoặc kênh khác (iOS-first, creator, cross-promo).
2. **Subgenre bão hòa và ngắn hạn**: hàng chục clone trong 12 tháng → CPI sẽ tăng, eCPM giảm. Cửa sổ có thể chỉ 6–12 tháng `[GIẢ THUYẾT]`.
3. **Hitapps chiếm SEO/ASO** từ khóa "solitaire associations"; ABI chiếm "stamp solitaire". Cần tên/keyword riêng.
4. **Art AI**: nếu dùng art AI, rủi ro bị chê như Stamp Solitaire và policy store; art tay thì chi phí content cao – mâu thuẫn với cơ hội #2.
5. **Ads-only không đủ LTV**: benchmark ARPDAU casual US $0.08–0.15 `[MARKET, benchmark nội bộ]`; nếu giảm ads để lấy rating mà IAP không bù, LTV < CPI.

---

## 9. Đề xuất sơ bộ hướng MVP

Nguyên tắc: **không copy ABI về ads, copy họ về tốc độ**. Chi tiết MoSCoW để ở `prd-mvp.md`; đây là khung.

| Hướng | Nội dung | Vì sao | Đo bằng |
|---|---|---|---|
| Core | Solitaire-category matching (cơ chế do game-designer chốt), 150–200 level cho soft launch, move limit công khai | Đủ để đo D7; ABI ship ~hàng trăm level | level_complete, level_fail(reason) |
| Monetization | Interstitial chỉ end-of-level, cooldown ≥ 60s, bắt đầu từ level ~8; rewarded: +moves, x2 coin, revive; No-Ads $2.99–4.99 `[GIẢ THUYẾT]`; 1 starter pack | Khai thác khoảng trống "fair ads" mà vẫn có ARPDAU nền | ads/DAU, ARPDAU, No-Ads conversion |
| Meta | Album tem tối giản: mỗi 10 level mở 1 tem, 5 tem = 1 bộ có thưởng | Test giả thuyết meta sưu tầm giữ D7 | album_open, set_complete |
| LiveOps | Cadence 1 bản/2 tuần với 1 theme/category mới; remote config cho ads + difficulty | Đối thủ bị chê thiếu content | content_reach_ratio |
| Geo soft launch | Philippines/Canada Android + iOS US nhỏ | Rẻ để đo retention; iOS US để đo IAP | theo cohort |

**5 KPI soft launch (kèm ngưỡng benchmark `[MARKET]` nội bộ):**

| KPI | Ngưỡng đi tiếp | Vì sao chọn |
|---|---|---|
| D1 retention | ≥ 40% (mục tiêu 45%) | Core loop + FTUE có hấp dẫn không |
| D7 retention | ≥ 15% (mục tiêu 20%) | Difficulty curve + meta album có giữ chân không |
| Rewarded ads / DAU | ≥ 2.5 | Người chơi tự nguyện xem ad → thiết kế fail-state đúng |
| ARPDAU (US, ads+IAP) | ≥ $0.08 | Kiểm tra "fair ads" có bù được bằng IAP không |
| % review/feedback nhắc "ads" tiêu cực | < 10% (proxy: rating ≥ 4.6) | Chính là khoảng trống định vị |

KPI phụ: FTUE complete ≥ 85%, No-Ads conversion D7 ≥ 1%, level fail rate theo level (tìm spike).

---

## 10. Cần xác minh khi có APK

**SDK / stack muốn xem (`research/apk/com.stamp.solit/report.md`):**
- Mediation: AppLovin MAX hay AdMob mediation? Có AnyManager SDK (AnyMind) không? Có Pangle/Mintegral/Unity/ironSource/Vungle/Bigo adapter?
- Analytics/attribution: Firebase Analytics, AppsFlyer (đã xác nhận ABI dùng), Adjust?
- Remote config/A-B: Firebase Remote Config hay hệ riêng của ABI (tìm domain `abigames`, `onesoft`, endpoint config).
- IAP: Google Billing version, có subscription không (RevenueCat?).
- Engine: Unity version; bundle level data ở đâu (ScriptableObject/JSON/CSV).
- Có SDK "AI" hay watermark tool sinh ảnh trong asset không (để xác nhận art AI).

**Key remote config / default config muốn grep trong `extracted/`:**
- `interstitial`: `inter_start_level`, `inter_cooldown`, `inter_cap_per_session`, `inter_mid_level`, `ad_break`.
- `rewarded`: `reward_extra_moves`, `reward_coin_x2`, `revive_cost`, `reward_lives`.
- `lives`: `max_lives`, `life_regen_seconds`, `lives_lost_on_quit` (xác minh phàn nàn "doubles lives taken").
- `economy`: `coin_start`, `coin_per_level`, `booster_price_*`, `extra_moves_price`.
- `iap`: `noads`, `remove_ads`, `starter_pack`, `coin_pack_*`, SKU list và giá mặc định.
- `difficulty`: `moves_per_level`, `level_nerf`, `dda`/`dynamic_difficulty`, `fail_streak`.
- `liveops`: `event_*`, `daily_*`, `album`, `collection`, `season`.
- Danh sách category/tem: đếm số category và số card thực tế để đối chiếu phàn nàn "no new categories after 100 levels".

---

## Nguồn tổng hợp

- Google Play: https://play.google.com/store/apps/details?id=com.stamp.solit
- App Store: https://apps.apple.com/us/app/stamp-solitaire-card-matching/id6761845923 ; reviews: https://apps.apple.com/us/app/stamp-solitaire-card-matching/id6761845923?see-all=reviews&platform=iphone
- AppBrain: https://www.appbrain.com/app/stamp-solitaire-card-matching/com.stamp.solit
- mwm.ai: https://mwm.ai/apps/app/6761845923
- UpdateStar: https://stamp-solitaire-card-matching.updatestar.com/en
- Stamp Match (sibling): https://play.google.com/store/apps/details?id=com.stamp.match
- ABI: https://abigames.com.vn/ ; https://abigames.com.vn/about-us/ ; https://anymindgroup.com/news/press-release/abi-anymind-optimization ; https://www.appsflyer.com/customers/abi-game-studio/ ; https://respawn.outlookindia.com/gaming/gaming-guides/top-10-hypercasual-gaming-publishers-worldwide-q3-2025 ; https://appmagic.rocks/blog/q3hybrid2025 ; https://www.gamigion.com/ad-monetization-trends-q1-2025/
- Đối thủ: xem URL trong bảng mục 7.
