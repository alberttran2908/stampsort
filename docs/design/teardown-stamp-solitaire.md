# Teardown: Stamp Solitaire: Card Matching (ABI Game Studio)

**Ngày phân tích:** 2026-09-25
**Trạng thái nguồn:** KHÔNG có APK dump (`research/apk/` trống). Toàn bộ dựa trên nguồn công khai qua WebSearch. WebFetch/curl tới `play.google.com`, `apps.apple.com`, `appbrain.com`, `apkpure.com`, `mwm.ai`, `youtube.com` và các site rule-guide đều bị **egress proxy chặn**, nên chỉ đọc được snippet tìm kiếm, không đọc được trang gốc, ảnh screenshot hay video. Mọi nhận định vì thế được gắn nhãn `[STORE]` (snippet từ store/aggregator), `[PLAY]` (review người chơi được trích qua snippet), hoặc `[GIẢ THUYẾT]`.

## 0. Nguồn đã dùng

| Nhãn | Nguồn | URL |
|---|---|---|
| S1 | Google Play listing (package `com.stamp.solit`) | https://play.google.com/store/apps/details?id=com.stamp.solit&hl=en-US |
| S2 | App Store listing (id 6761845923) | https://apps.apple.com/us/app/stamp-solitaire-card-matching/id6761845923 |
| S3 | App Store reviews | https://apps.apple.com/us/app/stamp-solitaire-card-matching/id6761845923?see-all=reviews&platform=iphone |
| S4 | AppBrain (version, downloads, rating) | https://www.appbrain.com/app/stamp-solitaire-card-matching/com.stamp.solit |
| S5 | MWM app page | https://mwm.ai/apps/app/6761845923 |
| S6 | UpdateStar (version mới nhất) | https://stamp-solitaire-card-matching.updatestar.com/en |
| S7 | Clone/cùng template: Stamp Match: Solitaire Master (`com.stamp.match`) | https://play.google.com/store/apps/details?id=com.stamp.match |
| S8 | Game gốc của template: Solitaire Word Association (PlaySimple) | https://play.google.com/store/apps/details?id=in.playsimple.solitaireassociation&hl=en_US |
| S9 | Cùng template: Word Solitaire: Categories | https://play.google.com/store/apps/details?id=com.solitaire.match.words&hl=en |
| S10 | Rule guide Solitaire Associations (web) | https://www.solitaireassociation.com/games/solitaire-associations |
| S11 | Newsletter Super Monday (Carlos Pereira) | https://carlospereiragame.substack.com/p/super-monday-casual-hybrid-and-hyper-f15 |
| S12 | HybridCasual Puzzle Market Radar #33 | https://nextbiggames.com/2026/03/26/hybridcasual-puzzle-market-radar-33-trends/ |
| S13 | YouTube: Mumui Gaming Part 1 | https://www.youtube.com/watch?v=-twrTYn_Zys |
| S14 | YouTube playlist "all level solution" (level 2/13/22/25/36, đăng 17-22/05/2026) | https://www.youtube.com/playlist?list=PLqJsxX17a6_ib2kDkP3eYb53Z79XDEpnL |

## 1. Tổng quan

| Mục | Nội dung | Nguồn |
|---|---|---|
| Thể loại | Solitaire-association / category-sort puzzle, skin sưu tầm tem | [STORE] S1, S2 |
| Publisher | Google Play: ABI GLOBAL LTD.; App Store: PITI STUDIO TECHNOLOGY DEVELOPMENT AND INVESTMENT JSC (pháp nhân của ABI) | [STORE] S1, S2, S5 |
| Version | AppBrain: 0.17.1 (29/05/2026); UpdateStar: 0.26.1 (19/08/2026). Bản ~0.9.5 mà đề bài nêu có thể là bản cũ hơn; cần xác minh | [STORE] S4, S6 |
| Quy mô | ~370k lượt tải, ~350k trong 30 ngày gần nhất (~12k/ngày); rating 4.63/5 trên 3.7k đánh giá (Android); một nguồn khác 4.7/5, 250k+ tải | [STORE] S4, S5 |
| Vị trí thị trường | Được mô tả là "iteration của Solitaire Association đang gaining traction"; xu hướng 2026 nghiêng về sorting/association puzzle | [STORE] S11, S12 |
| Hook | "Classic solitaire meets the colorful world of stamp collecting": xếp tem vào đúng nhóm chủ đề, hoàn thành album | [STORE] S1, S2 |
| Đối tượng | Casual 30+, thích word/trivia + solitaire; không có timer, "relaxing, stress-free pacing" | [STORE] S2; [GIẢ THUYẾT] phần tuổi |
| Monetization | Free, có ads + IAP; review nhắc gói remove-ads ~$13 | [STORE] S1; [PLAY] S3 |

**Nhận định ngắn:** Đây là bản re-skin theo công thức ABI: lấy template đang tăng trưởng (Solitaire Word Association của PlaySimple), thay word card bằng **stamp có hình + chữ**, thêm lớp meta "album/collection" và LiveOps event, đẩy mạnh ad monetization. Cùng lúc thị trường đã có clone ngược lại (Stamp Match: Solitaire Master, S7).

## 2. Core loop

| Thành phần | Mô tả | Nguồn |
|---|---|---|
| Mục tiêu level | Xếp toàn bộ stamp/card trên board vào đúng nhóm chủ đề (category) và "clear the board" | [STORE] S1, S2 |
| Hành động cơ bản | Draw, reveal, organize: rút bài từ deck, lật bài trên tableau, kéo card lên slot category tương ứng | [STORE] S2 ("draw, reveal, and organizing stamps as you build themed category albums") |
| Điều kiện thắng | Mọi card đã vào đúng nhóm; template gốc: complete khi tất cả card từ deck đã được assign | [STORE] S9 |
| Điều kiện thua | Hết **moves** (có moves counter) | [STORE] S5; [PLAY] S1 review "insufficient moves relative to number of cards" |
| Thời lượng | Ước 1-3 phút/level ở early game | [GIẢ THUYẾT] |
| Ràng buộc cảm xúc | Không timer; tension đến từ hai nguồn: (a) bài bị chôn dưới tableau, (b) ngân sách moves | [STORE] S8 (no timer); [PLAY] |

**Vòng lặp (theo template và snippet):** Nhìn category slot đang mở → tìm card top có thể đi → nếu card thuộc category chưa mở thì phải mở category (đặt category card có crown icon trước, theo S9) hoặc dùng move để dời card trong tableau → hết đường thì draw deck → hết moves thì mua thêm moves bằng coin/ad hoặc thua.

## 3. Cơ chế chi tiết

### 3.1 Tableau và deck (kế thừa template)
- Template gốc: 4-6 cột card chồng lên nhau, chỉ card trên cùng của mỗi cột được tương tác; có deck + waste; một số card úp (face-down) [STORE] S8, S10.
- Hai loại move: (1) đưa top card lên category pile; (2) dời top card sang cột khác để lộ card bên dưới [STORE] S10.
- "Draw too early increases noise" – draw là quyết định có chi phí thật [STORE] S10.
- Stamp Solitaire dùng cấu trúc tương tự; chưa có bằng chứng về số cột, số card úp [GIẢ THUYẾT].

### 3.2 Category matching / "Match 4"
- Mỗi level có **4 category ẩn**, mỗi card thuộc đúng 1 category [STORE] S8, S10 (template).
- Clone S7 mô tả rõ: "Match 4 same-group cards in a row" → nhiều khả năng mỗi category slot cần đủ 4 card để "hoàn thành" và biến mất/ghi vào album [STORE] S7; áp cho Stamp Solitaire là [GIẢ THUYẾT].
- Card là **hình ảnh tem** ("image association puzzles", "image cards go with image cards") thay vì chỉ chữ → giảm rào cản ngôn ngữ, tăng tính visual [STORE] S1, S9.

### 3.3 Golden Stamp (Joker)
- "Joker Card, also known as Golden Stamp, assists players in completing collections"; "allows players to flexibly match stamps into any available category" [STORE] S5.
- Template: Joker dùng 0 move, không rủi ro, tự đưa card vào đúng category [STORE] S10.
- Vai trò thiết kế: booster "an toàn tuyệt đối" → tạo sink cho coin và reward ad [GIẢ THUYẾT].

### 3.4 Magic Hint
- Icon kính lúp, gợi ý một nước đi hợp lệ [STORE] S5.
- Review phàn nàn "bị ép dùng help item mà không được cấp thêm item" → hint có thể được auto-trigger hoặc nudge mạnh trong tutorial/khi kẹt [PLAY] S1.

### 3.5 Moves counter
- Có moves counter ("intuitive moves counter for strategic gameplay") [STORE] S5.
- Đây là fail state chính và điểm bán chính (mua thêm moves) [PLAY] S1, S3.

### 3.6 Booster khác
- Listing nói "powerful boosters" nhưng không liệt kê [STORE] S5.
- Template có Undo, Shuffle (chỉ xáo card úp), Wildcard, Dictionary [STORE] S9. Stamp Solitaire nhiều khả năng có Undo + Shuffle; Dictionary có thể thay bằng "xem tên category" [GIẢ THUYẾT].

## 4. Level structure

| Mục | Dữ liệu | Nguồn |
|---|---|---|
| Số level | Không công bố. Review nhắc chơi tới level 118 → tối thiểu >118. Clone S7 quảng cáo "unlimited levels" (có thể generator) | [PLAY] S1; [STORE] S7 |
| Mở khoá | Tuyến tính, level-by-level | [GIẢ THUYẾT] |
| Biến số độ khó | (a) số card trên board, (b) số card úp, (c) số cột, (d) độ "gần nghĩa" giữa các category, (e) ngân sách moves | [GIẢ THUYẾT] dựa trên S8/S10 |
| Difficulty spike | Video solution xuất hiện từ level 2, 13, 22, 25, 36 (cùng tuần) → nhu cầu walkthrough ngay tuần đầu; gợi ý wall level sớm quanh 13/22/36 | [STORE] S14 (chỉ là bằng chứng gián tiếp) |
| Wall level "hard" | Có "challenging levels" bị review tố "không đủ moves so với số card"; dev đã trả lời điều chỉnh lại số moves | [PLAY] S3 |

Không đủ dữ liệu để vẽ bảng theo mốc 1/10/30/50/100. Đề xuất lấy: chơi tay + ghi lại (số cột, số card, số úp, moves, category, kết quả) cho 40 level đầu, hoặc dump `level_*.json` khi có APK.

## 5. Fail state & recovery

| Điểm | Quan sát | Nguồn |
|---|---|---|
| Thua | Hết moves khi vẫn còn card | [PLAY] S1 |
| Cứu | Mua thêm moves bằng coin hoặc xem reward ad; "completing levels requires spending coins or watching ads on challenging stages" | [PLAY] S1 |
| Không thấy bằng chứng | Hệ thống lives/hearts. Chưa có review nào nhắc "hết tim" | [GIẢ THUYẾT]: không có lives, thua chỉ mất coin/thời gian |
| Ad cadence | Đầu game không có ads → sau đó interstitial sau mỗi level (skip sau 5s) → về sau ads xuất hiện cả trong gameplay, thời lượng tăng theo level; bỏ qua "double reward" vẫn bị "ad break" | [PLAY] S1 |
| Điểm gợi mua | (1) hết moves; (2) gói remove-ads ~$13; (3) mua coin/booster | [PLAY] S1, S3 |
| Bug/friction | Mất coin đã kiếm, freeze, mất tiến độ phải chơi lại level | [PLAY] S1 |

**Đọc từ góc thiết kế:** ABI dùng moves budget như "van" điều tiết monetization: ép chặt ở wall level, rồi nới khi churn/review xấu (bằng chứng: dev phản hồi đã tăng moves, S3). Ad cadence được ramp theo level, đúng playbook hyper-casual → hybrid.

## 6. Meta & retention hooks

| Hook | Bằng chứng | Nguồn |
|---|---|---|
| Album / Collection | "complete themed albums", "discover charming stamp designs"; clone: "empty album transform into colorful collection of global art", "unlock exotic destinations" | [STORE] S1, S2, S7 |
| Event: Climbing Quest | Trong what's new gần đây. Tên gợi race/ladder event theo số level thắng liên tiếp | [STORE] S1; cách hoạt động là [GIẢ THUYẾT] |
| Event: Stamp Rush | Trong what's new. Tên gợi event thu thập tem có giới hạn thời gian | [STORE] S1; [GIẢ THUYẾT] |
| Daily reward / streak | Không tìm thấy bằng chứng | – |
| Leaderboard / social | Không tìm thấy bằng chứng | – |
| Offline | Clone S7 nhấn mạnh offline; Stamp Solitaire chưa xác nhận | [STORE] S7 |

Meta còn mỏng: album là meta chính, event mới được thêm gần đây (0.17 → 0.26). Đây là game đang ở giai đoạn "prove core, then layer meta".

## 7. Onboarding & FTUE

- Không có bằng chứng trực tiếp (screenshot/video không đọc được).
- Suy luận từ template và review [GIẢ THUYẾT]:
  - Level 1-3: board nhỏ, không card úp, category dễ (Animals, Fruits...), hand-holding từng move.
  - Level 2 đã có video solution (S14) → có thể tutorial không dạy đủ về "draw deck" hoặc "dời card trong tableau".
  - Review "bị ép dùng help item" → tutorial ép dùng Hint/Golden Stamp để dạy booster, tặng item mẫu.
  - Không có ads trong ~N level đầu (review S1) → FTUE sạch, ad ramp bắt đầu sau.

## 8. UX / juice

- Listing nhấn "smooth interactions, relaxing visuals, stress-free pacing", "calm and satisfying" [STORE] S2.
- Fantasy: nhà sưu tầm tem, hoàn thành album, đi qua các quốc gia/chủ đề [STORE] S2, S7.
- Điểm "satisfying" theo template: khoảnh khắc đủ 4 card cùng nhóm → set bay vào album [GIẢ THUYẾT].
- Điểm phá cảm giác relax: interstitial trong gameplay, ad dài dần [PLAY] S1.

## 9. Điểm mạnh / điểm yếu / cơ hội

**Điểm mạnh**
- Core đã được validate bởi template gốc (PlaySimple) và nhiều clone; ABI tận dụng UA machine để scale nhanh (350k tải/30 ngày) [STORE] S4, S11.
- Tem có hình → localize dễ hơn word-only, visual đẹp cho creative ads [STORE] S1.
- Golden Stamp/Joker = booster "0 rủi ro" dễ hiểu, dễ bán [STORE] S5, S10.

**Điểm yếu**
- Ad load quá nặng, phá "relaxing" promise → review 1-sao tập trung vào ads [PLAY] S1, S3.
- Level tuning không ổn định (thiếu moves, phải patch) [PLAY] S3.
- Bug mất coin/tiến độ [PLAY] S1.
- Meta mỏng, event mới bổ sung; chưa thấy daily/streak/social.
- Trong category solitaire, "biết category" là kiến thức, không phải kỹ năng → replayability thấp, phụ thuộc content pipeline.

**Cơ hội**
- Người chơi thích core nhưng ghét ad → chỗ trống cho sản phẩm cùng core, monetize bằng IAP/meta thay vì interstitial.
- Chưa ai làm "sort" thật sự (chỉ match category); có thể đẩy về phía sort puzzle có deterministic skill.

## 10. Gợi ý khác biệt hoá cho stampsort

| # | Hướng | Lý do thiết kế | Rủi ro |
|---|---|---|---|
| 1 | **Sort thật, không đoán category**: category hiển thị sẵn, thử thách nằm ở thứ tự lật/dời card và ngân sách moves (giống Ball Sort/Water Sort logic) | Biến game từ trivia sang skill puzzle: solvable bằng logic, dễ sinh level bằng generator + solver, không phụ thuộc kho từ vựng | Mất "aha" của việc nhận ra category; cần thêm twist để không thành Ball Sort re-skin |
| 2 | **Album là meta chính có ý nghĩa gameplay**: mỗi trang album mở khoá là một "bộ tem" mới xuất hiện trong level, kèm perk nhỏ (ví dụ: bộ Ocean tăng 1 move) | Gắn collection với core thay vì chỉ cosmetic; tạo lý do quay lại để "hoàn thành trang" | Balance perk gây power creep; cần art pipeline lớn |
| 3 | **Ad-light, IAP-first**: không interstitial trong gameplay; rewarded ad chỉ tại điểm fail; bán "Season Album Pass" | Bảo vệ promise "relaxing"; review của đối thủ cho thấy ad là nguyên nhân churn số 1 | ARPDAU sớm thấp hơn ABI; PO cần chấp nhận LTV dài hạn thay vì D1 revenue |
| 4 | **Lives thay moves, hoặc moves + undo miễn phí có giới hạn** | Moves budget cứng tạo cảm giác bị "bóp"; undo miễn phí 3 lần/level cho phép thử-sai nhưng vẫn giữ tension | Giảm điểm bán "thêm moves"; phải bù bằng booster khác (Golden Stamp, Shuffle) |
| 5 | **Daily Stamp + streak + weekly event ngay từ launch** (Daily Stamp: một level thủ công/ngày ghi vào album ngày; streak 7 ngày = tem hiếm) | Đối thủ thiếu daily/streak; đây là retention hook rẻ nhất trong casual puzzle | Cần content ops hàng ngày; nếu tem hiếm quá mạnh sẽ phá economy |

Quyết định ưu tiên giữa các hướng, giá gói, KPI mục tiêu: chuyển cho `product-owner`.

## 11. Danh sách cần xác minh khi có APK

Grep trong `research/apk/com.stamp.solit/extracted/` theo từ khoá `level`, `stage`, `difficulty`, `booster`, `hint`, `undo`, `shuffle`, `joker`, `golden`, `coin`, `reward`, `daily`, `event`, `rush`, `climb`, `streak`, `tutorial`, `remote_config`, `default`, `ads`, `interstitial`.

| Tham số | Muốn biết | Gợi ý file/key |
|---|---|---|
| Số category slot / level | 4 cố định hay tăng (5, 6)? | `level_*.json`: `categories`, `slots` |
| Số card / category | 4 (match-4) hay thay đổi? | `cardsPerGroup`, `groupSize` |
| Tableau | số cột, số card úp, có deck/waste không | `columns`, `faceDown`, `deck` |
| Tổng số level và cách sinh | handcrafted hay generator; có loop/"unlimited" không | số file level, `seed`, `generator` |
| Moves budget | công thức theo số card; buffer bao nhiêu so với optimal | `moves`, `maxMoves`, `extraMoves` |
| Giá booster | Golden Stamp, Hint, Undo, Shuffle, +5 moves: giá coin và số lượng free | `shop`, `booster_price`, `remote_config` |
| Coin economy | coin thưởng/level, double reward ad, coin khởi đầu | `reward`, `levelComplete`, `coinStart` |
| Lives/hearts | có hay không, thời gian hồi | `lives`, `heart`, `regen` |
| Ad cadence | interstitial bắt đầu từ level nào, tần suất, cap/ngày | `ads`, `interstitialInterval`, `levelStartAds` |
| Event config | Climbing Quest, Stamp Rush: thời hạn, milestone, reward | `event`, `quest`, `rush`, `milestone` |
| Album | số bộ tem, số tem/bộ, điều kiện mở | `album`, `collection`, `stamp` |
| FTUE | số bước tutorial, level nào force booster | `tutorial`, `onboarding`, `step` |
| Engine/SDK | Unity? ad mediation nào (MAX/AdMob/IronSource), analytics (Firebase/Adjust/AppsFlyer) | `report.md`, `inventory.json` |
| Remote config defaults | mọi tham số A/B: moves, ad, giá | `remote_config_defaults`, `firebase` |

## 12. Câu hỏi còn mở

1. Category có được hiển thị tên ngay từ đầu hay ẩn cho tới khi đặt card đầu tiên (như template có category card crown)?
2. Card là hình thuần, hay hình + chữ? Có localize chữ không?
3. Có hệ thống lives không? Thua có mất gì ngoài moves?
4. "Climbing Quest" và "Stamp Rush" hoạt động thế nào, reward gì, có yêu cầu chơi liên tiếp không?
5. Số level thực tế và có "endless/generated" sau khi hết handcrafted?
6. Bản 0.9.5 (đề bài) khác gì 0.17.1/0.26.1 – event và ad ramp có từ bản nào?
7. Screenshot/video trên store (không đọc được do proxy) thể hiện UI thế nào: số slot trên đầu màn hình, vị trí deck, HUD booster?

**Dữ liệu cần thêm:** (a) APK dump theo `docs/apk-analysis-guide.md`; (b) session chơi tay 40 level đầu ghi bảng thông số; (c) chụp store screenshot/what's new thủ công từ máy không qua proxy.
