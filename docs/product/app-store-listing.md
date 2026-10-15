# App Store listing: Little Post Office (iOS)

**Ngày:** 2026-10-15. **App Store Connect:** app id 6822926419, bundle `games.notbad.stampsort`, SKU `stampsort-ios`.
**Trạng thái:** chỉ TestFlight nội bộ. Bản này có 40 level lấy từ APK của ABI (L21–L60), nên **không nộp review, không phát hành** cho tới khi thay các level đó.
**Ngôn ngữ chính:** English (U.S.). Tiếng Việt thêm sau nếu thị trường đầu tiên là Việt Nam.

## Văn bản (giới hạn ký tự của Apple)

| Trường | Nội dung | Ký tự |
|---|---|---|
| Name (30) | Little Post Office | 18 |
| Subtitle (30) | Cozy Stamp Sorting Solitaire | 28 |
| Keywords (100) | solitaire,stamp,sort,card,puzzle,cozy,relaxing,letter,mail,collect,calm,easy,brain,offline | 91 |
| Promotional Text (170) | Welcome to the little post office of Wren Hollow! Sort cute stamps into letters, decorate your cozy counter and deliver mail at your own pace. | 145 |
| Support URL | https://notbad.games/stampsort/support.html | |
| Marketing URL | https://notbad.games/stampsort/ | |
| Privacy Policy URL | https://notbad.games/stampsort/privacy.html | |
| Copyright | 2026 Dung Tran | |

### Description (4000)

```
Little Post Office is a calm, cozy card puzzle about sorting stamps.

Find the crown stamp to open a slot, then fill it with stamps of the same kind: cats, fruit, sailboats, teapots and many more. When a slot is full, it becomes a letter for a friendly neighbor in town.

• Relaxing play with no timers and no pressure. Take your time.
• Easy to learn, with a gentle tutorial and helpful hints when you get stuck.
• Big, clear text and soft sounds, easy on the eyes and ears.
• Earn Stamp Points and decorate your little post office.
• Collect every stamp in your album.
• Visit Main Street, the Harbor and more places in town.
• Helpful boosters: Hint, Magnet, Stamper and the Golden Stamp.
• 5 free Undos in every level.
• Play offline, anytime. No account needed.

Grab a cup of tea and start sorting the mail!
```

## Phân loại và khai báo

| Mục | Giá trị | Ghi chú |
|---|---|---|
| Category | Games, phụ: Puzzle, Card | |
| Age Rating | **13+** (Mỹ và 172 nước; Brazil 12+) | Tính từ bảng câu hỏi ngày 2026-10-15. Chỉ có 1 câu trả lời khác None: "Alcohol, Tobacco, or Drug Use or References: Infrequent", do bộ tem **Cocktail** (martini, margarita; dùng ở L1–20 và L21–60). Muốn về **4+**: vẽ lại bộ này thành nước trái cây/mocktail hoặc thay chủ đề, rồi sửa câu trả lời thành None |
| Price | Free | Không có in-app purchase. Đã lưu giá $0.00 cho 175 nước. **App Availability chưa đặt** (chọn nước phát hành là quyết định lúc release) |
| App Privacy | Data Not Collected (đã lưu, **chưa bấm Publish**) | Không SDK quảng cáo/phân tích/theo dõi; tiến trình chỉ lưu trên máy (`prototype/stamp/privacy.html`) |
| Content Rights | **Để trống** | **Đúng cho bản phát hành sau khi bỏ 40 level APK.** Bản TestFlight nội bộ hiện tại vẫn còn 40 level đó |
| Encryption | Không (ITSAppUsesNonExemptEncryption = NO) | |

## Ảnh

- **Icon:** vẽ qua ChatGPT (`research/art-redo/gen/lpo_appicon.png`), đã đóng vào build 2.
- **Screenshots:** 5 ảnh, iPhone 6.9" (1320×2868) và iPad 13" (2064×2752). Chụp gameplay thật bằng Chrome headless (ảnh gốc `research/store/raw/`), ghép khung có chú thích font Lilita One và viền airmail (ảnh nộp `research/store/final/`). Thư mục `research/store/` không commit.
  - Màn thắng: ẩn nút "Claim x2 (ad)" khi chụp, vì app khai báo không có quảng cáo. **Trước khi phát hành phải bỏ nút quảng cáo giả này khỏi bản iOS** (`claim2`, `free_ad`, `fakeAd` trong `main.js`), nếu không ảnh và khai báo privacy sẽ lệch với app.
  - Chú thích:
    1. Sort cute stamps into letters
    2. New stamps in every place you visit
    3. Deliver mail to friendly neighbors
    4. Decorate your little post office
    5. Collect them all in your album

## Trạng thái trên App Store Connect (2026-10-15)

Đã điền và lưu:
- App Information: subtitle, category Games (Puzzle, Card), Age Rating.
- Pricing: Free.
- App Privacy: privacy URL, Data Not Collected.
- Version 1.0: promo text, description, keywords, support/marketing URL, copyright, 5 ảnh iPhone, 5 ảnh iPad 13".

Chưa làm, có chủ ý:
- **Add for Review**: không nộp, vì build còn 40 level của ABI.
- **App Privacy > Publish**: để chủ tài khoản bấm.
- **Content Rights**: build hiện tại có level của ABI, nên cả "No" lẫn "Yes, I have rights" đều sai. Chỉ khai sau khi thay 40 level.
- **App Availability, chọn Build cho version, App Review Information** (liên hệ, ghi chú): làm lúc chuẩn bị nộp thật.

Ghi chú:
- Apple (2026) bắt buộc khay ảnh **iPhone 6.1"/6.3"** (1206×2622 hoặc 1179×2556), không còn là 6.9". Ảnh iPhone đã thu nhỏ từ 1320×2868 xuống 1206×2622 (`research/store/final_iphone63/`). iPad 13" vẫn là 2064×2752.
- Ảnh ghép khung có thể dựng lại: chụp bằng Chrome headless theo cảnh (seed save, play, new, win, home, album), rồi ghép khung HTML 1 trang. Script nằm trong scratchpad phiên làm việc, không nằm trong repo.
