# Positioning: giữ theme tem (stamp) hay đổi theme?

**Tác giả:** product-owner agent · **Ngày:** 2026-09-28 · **Trạng thái:** bản đầu, chờ test creative

**Câu hỏi:** "Nếu vẫn dùng theme tem thì sao?" – góc product: có đáng đối đầu trực tiếp ABI trên keyword và thị trường "stamp" không.

**Tham chiếu:** `docs/product/competitor-stamp-solitaire.md` (mục 2, 5, 7, 8), `docs/design/theme-options.md` (mục 4: game-designer đề xuất postcard, fallback luggage label), `docs/design/theme-stamp.md` (mục 3–4: sub-fantasy "Postmaster" – người chơi là nhân viên bưu điện phân loại thư, twist Dấu hủy + Return to Sender, meta album × độ hiếm; designer vẫn giữ postcard làm mặc định, chỉ chuyển sang tem nếu đủ 3 điều kiện).

**Nhãn nguồn:** `[STORE]` snippet WebSearch từ Google Play/App Store/AppBrain; `[MARKET]` bài viết/case study; `[GIẢ THUYẾT]` suy luận. **Hạn chế:** không truy cập trực tiếp được store và không có tool ASO (AppTweak/Sensor Tower keyword volume), nên mức bão hoà keyword chỉ suy từ kết quả tìm kiếm, không có search volume thật.

---

## 1. Cạnh tranh keyword/ASO cho "stamp"

Kết quả từ 5 truy vấn WebSearch (stamp solitaire / stamp match / stamp sort / stamp collect-album / tên game + appmagic). Bỏ qua app PC (Stamp Collector trên Steam) và app indie không đáng kể (Stamp Brains, Stamps-My Stamp it):

| Keyword | App tìm thấy | Publisher | Quy mô (snippet) | Cùng subgenre? | Nguồn |
|---|---|---|---|---|---|
| stamp solitaire | **Stamp Solitaire: Card Matching** (`com.stamp.solit`, iOS id6761845923) | ABI Global / Piti Studio | 370K Android (350K trong 30 ngày, mốc ~6/2026), 4.63/3.7K; iOS 250K+, 4.7 | **Có** – đối tượng teardown | `[STORE]` https://www.appbrain.com/app/stamp-solitaire-card-matching/com.stamp.solit ; https://mwm.ai/apps/app/6761845923 |
| stamp match / stamp solitaire | **Stamp Match: Solitaire Master** (`com.stamp.match`) | ABI Games PTE (sibling) | 10K+ Android, 4.5 | **Có** – bản test song song của ABI | `[STORE]` https://play.google.com/store/apps/details?id=com.stamp.match |
| stamp sort | **Stamp Sort** (`com.stampsort.blockpuzzle`) | không rõ (không phải ABI) | không có số | Không – sort/stack/merge block | `[STORE]` https://play.google.com/store/apps/details?id=com.stampsort.blockpuzzle |
| stamp collect / album | **Philatelist – Stamp Collecting** (`com.fredbeargames.philatelistpuzzle`) | Fred Bear Games | không có số | Không – jigsaw 80 tem thật | `[STORE]` https://play.google.com/store/apps/details?id=com.fredbeargames.philatelistpuzzle |
| stamp (iOS) | **Stamps** (id6744961801) – xếp tem vào grid theo nước/nội dung/giá | indie | không có số | Không – grid puzzle, có daily mode | `[STORE]` https://apps.apple.com/us/app/stamps/id6744961801 |

**Kết luận:**
- Với tổ hợp **"stamp" + "solitaire"/"match"** trên mobile: chỉ có **2 title, cả 2 đều của ABI** (2 tài khoản publisher). Theo snippet, ABI chiếm ~100% kết quả liên quan subgenre `[STORE]`. Keyword chưa "bão hoà" theo nghĩa nhiều đối thủ, mà **bão hoà theo nghĩa một chủ sở hữu**: mọi lượt search "stamp solitaire" là brand traffic của ABI, chứ không phải generic traffic.
- Keyword "stamp" generic (sort/collect/album): vài app nhỏ, khác subgenre → không có đối thủ nhưng cũng **không có bằng chứng về search volume** `[GIẢ THUYẾT]`: người chơi casual tìm "solitaire", không tìm "stamp".
- **Rủi ro tên:** "Stamp Sort" đã là tên app trên Play. Codename `stampsort` giữ nội bộ được, nhưng store title không thể là "Stamp Sort".
- ABI dùng Apple Search Ads và AppsFlyer `[MARKET]` https://www.appsflyer.com/customers/abi-game-studio/ → nếu ta bid keyword "stamp solitaire" trên ASA, ta cạnh tranh với chính chủ brand, CPT sẽ cao hơn generic `[GIẢ THUYẾT]`.

---

## 2. Ma trận lợi ích / rủi ro khi giữ theme tem

| Loại | Yếu tố | Mức độ | Bằng chứng | Cách giảm thiểu |
|---|---|---|---|---|
| Lợi | ABI đã validate demand: ~0.6–0.7M tải 2 nền tảng trong ~2 tháng, rating 4.6–4.7 | **Trung** | `[STORE]` AppBrain, mwm.ai; phần lớn là UA trả tiền, chưa chứng minh organic demand cho "tem" | Coi đây là validate **template**, không phải **theme** |
| Lợi | Tận dụng search traffic "stamp solitaire" của ABI | **Thấp** | mục 1: đó là brand traffic của ABI; chỉ hớt được nếu rank #2-3 | Không đặt kế hoạch UA dựa vào nó; chỉ tính khi đo được ≥ 20% install organic từ keyword |
| Lợi | Audience đã hiểu gameplay + có tệp "bỏ game vì ads" | **Trung-cao** | `[STORE]` review: bỏ ở level 118, "ads ridiculous"; Hitapps rating 4.14 | Lợi ích của **template**, không phụ thuộc theme; creative "no mid-level ads" dùng được với mọi theme |
| Rủi | Bị coi clone | **Cao** | ABI đã có 2 bản cùng skin; bản thứ 3 gần như chắc bị gọi là copy | Đổi sub-fantasy (B) hoặc theme (C) |
| Rủi | ABI out-spend UA | **Cao** | ~12K tải/ngày Android, CPI thấp nhờ AnyMind + network in-house `[STORE]`/`[MARKET]` | Không đấu volume; iOS-first, IAP-first (competitor mục 9); khác creative angle |
| Rủi | Keyword bị ABI (stamp) và Hitapps (associations) chiếm | **Cao** | mục 1; competitor mục 8 rủi ro #3 | Chọn keyword cluster riêng ("postcard", "travel", "vintage", "collection") |
| Rủi | Bị report copycat / trademark trên store | **Trung** | Chưa kiểm tra USPTO cho "Stamp Solitaire" `[GIẢ THUYẾT]`; ABI có 3-4 pháp nhân, có kinh nghiệm store policy | Không dùng "Stamp Solitaire" trong title/subtitle; kiểm tra trademark trước khi đặt tên |
| Rủi | Art tem AI của ABI đã "sạch", icon tem khó nổi bật | **Trung-cao** | `[STORE]` review khen "pictures easy to recognize" dù art AI | Phải thắng bằng art style khác hẳn → tăng cost art, mâu thuẫn với tốc độ |

---

## 3. Ba kịch bản

Ước lượng **định tính**, tất cả là `[GIẢ THUYẾT]` trừ chỗ ghi nguồn. "CPI tương đối" so với kịch bản A = 1.0x; ngưỡng tuyệt đối chỉ có sau test.

| Tiêu chí | A. Tem, cạnh tranh trực diện | B. Tem "Postmaster" (`theme-stamp.md` mục 3) | C. Postcard / luggage (theme-options 3.1/3.2) |
|---|---|---|---|
| CPI kỳ vọng (tương đối) | 1.0x lúc đầu nhưng **tăng dần** vì đấu cùng audience/creative với ABI; ASA brand keyword đắt | 1.0–1.1x; vẫn nhận diện "tem" nhanh, ít đụng auction hơn nếu angle khác | 1.0–1.15x (±15% theo designer); luggage có thể +10-25% do nhận diện thấp hơn |
| Rủi ro ASO | **Cao**: keyword của ABI, title dễ bị coi copycat, tên "Stamp Sort" đã có | **Trung**: vẫn keyword "stamp" nhưng có cluster riêng (bưu điện, philatelist, thư tay) | **Thấp-trung**: "postcard" xuất hiện ở vài solitaire lớn làm meta `[STORE]` theme-options; "luggage label"/"vintage travel" trống |
| Time-to-market | **Nhanh nhất**: art pipeline copy được, category có sẵn | +2–4 tuần: art khắc (engraved) khó AI hơn, cần retouch tay; designer yêu cầu meta album × hiếm + Daily Post có ở bản launch | +2–4 tuần: pipeline art linen/art deco, bảng category 2 trục, test readability |
| Hút người chơi bỏ Stamp Solitaire vì ads | **Trung**: nhận ra gameplay ngay nhưng cũng nhận ra "clone" → trust thấp | **Trung-cao**: cùng vibe tem, khác tên/story → "game khác, tử tế hơn" | **Trung-cao**: giữ DNA thư tín (tem, dấu bưu điện); creative phải nói rõ "no ad breaks" |
| Phù hợp iOS-first / IAP-first | **Thấp**: audience iOS tìm "stamp solitaire" đã cài bản ABI; ta là "second choice" | **Trung-cao**: meta album × độ hiếm (Mint/Fine/Poor) là chỗ bán IAP tốt; nhưng creative "phân loại thư" cần 1 shot giải thích → CPI kém hơn | **Cao**: Flip hint in-fiction (bán coin), scrapbook/bản đồ bán được Season Pass; luggage có vali = meta 1 màn hình |
| Rủi ro pháp lý/policy | Trung (trademark chưa kiểm tra) | Thấp-trung | Thấp (tên hư cấu cho khách sạn/hãng tàu) |
| Kết luận nhanh | **Không làm** | Fallback nếu test creative cho thấy tem thắng rõ | **Mặc định** |

**Vì sao A không đáng:** mọi lợi ích của A (demand validated, audience hiểu gameplay, tệp ghét ads) đều đến từ **template**, không từ **theme**; trong khi mọi rủi ro cao nhất (clone, keyword, UA out-spend, icon khó nổi bật) đều gắn với **theme**. Giữ tem là gánh rủi ro của theme để lấy lợi ích vốn đã có sẵn ở bất kỳ theme nào.

---

## 4. Khuyến nghị PO

**Chọn kịch bản C (postcard, fallback luggage)** theo đề xuất game-designer; giữ **B làm phương án dự phòng có điều kiện**, loại A.

### Điều kiện chuyển đổi (decision gate, chốt sau test creative)

| Gate | Cách đo | Ngưỡng | Hành động |
|---|---|---|---|
| G1. Creative test 3 skin | 3 video 15s cùng gameplay, đổi skin: **postcard / postmaster (tem) / luggage** (đồng bộ với theme-stamp.md mục 4; không test skin tem kiểu ABI vì A đã loại). Meta, US, nữ 30–55, budget bằng nhau **$400/skin**, 4–5 ngày, tối ưu install | So sánh **IPM** và **CPI** (CTR chỉ tham khảo) | Postcard tốt nhất hoặc trong **±15%** skin tốt nhất → chốt C-postcard |
| | | Luggage thắng postcard **> 25%** CPI | → C-luggage |
| | | Postmaster thắng postcard **> 25%** CPI **và** G2 không đỏ **và** đội cam kết meta album × hiếm ở launch (điều kiện 3 của designer) | → B Postmaster, không bao giờ A. PO siết hơn ngưỡng ±10% của designer: B phải **thắng rõ** chứ không chỉ "không thua", vì B gánh thêm rủi ro clone và cost art khắc |
| G2. ASO/trademark | Kiểm tra USPTO/EUIPO "Stamp Solitaire"; keyword popularity ASA cho "stamp solitaire", "postcard", "vintage travel" | Nếu ABI đã đăng ký trademark hoặc popularity "stamp" < 20 (thang ASA) | G2 đỏ → loại B, chốt C bất kể G1 |
| G3. Readability | Test 20 người, card 120 px, 3 giây (theme-options mục 4) | Early ≥ 85%, mid ≥ 65% | Rớt → chỉnh art, không đổi theme |
| G4. Sau soft launch | % install organic từ keyword theme (ASA/Play Console) sau 4 tuần | ≥ 20% | < 5%: theme không đóng góp ASO, tối ưu creative thay vì title |

Ngân sách G1: ~$1.200 + 3–4 ngày art skin trên cùng 1 đoạn gameplay prototype; rất nhỏ so với rủi ro chọn sai theme cho 3–6 tháng content.

### 3 việc làm ngay trong 2 tuần

| # | Việc | Owner | Output | Đo bằng |
|---|---|---|---|---|
| 1 | **Creative test 3 skin** (G1): game-designer cung cấp 12 card mẫu/skin; art làm 3 skin trên cùng gameplay capture; UA chạy Meta US 5 ngày | PO + game-designer + art | Bảng IPM/CPI/CTR theo skin, quyết định theme ký ngày 12/10 | IPM, CPI, ngưỡng ±15%/25% ở trên |
| 2 | **ASO & tên** (G2): kiểm tra trademark "Stamp Solitaire"; chốt 3 tên ứng viên cho postcard (theme-options 3.1) tránh "stamp" trong title; kiểm tra "Stamp Sort" (`com.stampsort.blockpuzzle`) để không trùng; đăng ký bundle ID/App Store name giữ chỗ | PO | Shortlist tên + keyword cluster ("postcard", "vintage", "travel", "sort", "solitaire") | Keyword popularity ASA, độ trùng title trên Play |
| 3 | **Review mining định lượng** để size tệp "ad-refugee": lấy 200 review mới nhất của Stamp Solitaire + Solitaire Associations Journey, gắn tag (ads / difficulty / content / bug), tính %; viết 2 message creative ("no ad breaks mid-level", "fair moves") | PO | `docs/product/review-mining.md` + 2 message cho creative test | % review nhắc ads (mục tiêu xác nhận ≥ 30% để giữ USP "fair ads") |

**Điểm PO chốt với game-designer:** đồng ý với đề xuất "postcard là skin, Postmaster là chiều sâu" (theme-stamp.md mục 4): tầng meta tem-trên-bưu-thiếp + dấu hủy được đưa vào backlog postcard như epic riêng, có RICE và ngày ship, thay vì để B/C loại trừ nhau. Cần designer xác nhận: dấu hủy không làm tăng độ khó cảm nhận cho tệp 45+ (đo bằng level_fail_rate và opt-out "auto-cancel").

---

## Nguồn

- Google Play Stamp Solitaire: https://play.google.com/store/apps/details?id=com.stamp.solit
- App Store Stamp Solitaire: https://apps.apple.com/us/app/stamp-solitaire-card-matching/id6761845923
- AppBrain Stamp Solitaire: https://www.appbrain.com/app/stamp-solitaire-card-matching/com.stamp.solit
- mwm.ai (iOS): https://mwm.ai/apps/app/6761845923
- Stamp Match (ABI sibling): https://play.google.com/store/apps/details?id=com.stamp.match
- Stamp Sort (block puzzle, trùng tên): https://play.google.com/store/apps/details?id=com.stampsort.blockpuzzle
- Philatelist – Stamp Collecting: https://play.google.com/store/apps/details?id=com.fredbeargames.philatelistpuzzle
- Stamps (iOS): https://apps.apple.com/us/app/stamps/id6744961801
- ABI + AppsFlyer/ASA: https://www.appsflyer.com/customers/abi-game-studio/
- ABI + AnyMind: https://anymindgroup.com/news/press-release/abi-anymind-optimization
