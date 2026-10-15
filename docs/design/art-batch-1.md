# Đợt art 1: 27 chủ đề tem mới, decor, bưu thiếp và art polish

**Ngày:** 2026-10-15 · **Người soạn:** Polish Dev · **Trạng thái:** sẵn sàng chạy ChatGPT, chưa có ảnh nào.
**Nguồn nhu cầu:** `30-day-plan.md` mục 2.2–2.3 (27 chủ đề, 54 decor, 9 bưu thiếp, icon booster, decor hiếm) và `benchmark-grand-games.md` mục 10 (P3 nền cao, P5 hạt theo theme, P6 túi thư màn thắng, P9 icon và biển màn chính, P11 hệ nút).
**Quy trình gốc:** `art-redo-chatgpt.md` (lưới 3×3, style ref, cắt bằng `tools/art_slice.py`). Tài liệu này chỉ ghi phần mới.

---

## 0. Tóm tắt

| Đợt | Nội dung | Số ảnh | Số file đính kèm (upload) |
|---|---|---|---|
| **1** | 6 chủ đề chương 3–4 (T01–T06), art polish: hạt P5, bộ UI P6+P9, hệ nút P11, nền cao P3 (3 ảnh) | **12** | 6 |
| **2** | 9 chủ đề chương 5–7 (T07–T15), decor chương 3–4 (D3, D4), bưu thiếp chương 3–4 (C3, C4) | **13** | 7 |
| **3** | 12 chủ đề chương 8–11 (T16–T27) | **12** | 4 |
| **4** | Decor chương 5–11 (D5–D11), bưu thiếp chương 5–11 (C5–C11) | **14** | 6 |
| **Tổng** | | **51 ảnh** | **23** |

Đối chiếu với plan: 27 chủ đề kèm 27 icon (icon nằm ở ô 9 của lưới chủ đề, nên không cần 3 bảng icon riêng), 54 decor trong 9 lưới, 9 bưu thiếp, icon booster và decor hiếm dùng ô dư của lưới decor. Thêm 6 ảnh polish theo benchmark. Plan ước "khoảng 50 ảnh", khớp.

**Upload:** gói Plus hết lượt ở khoảng 90 file mỗi khung giờ. Ở đây chỉ đính kèm ảnh mẫu ở **lệnh đầu tiên của mỗi chat**. Các lệnh sau trong cùng chat chỉ gửi chữ (`art-redo-chatgpt.md` mục 4: cách này vẫn giữ style đồng bộ). Mỗi chat tối đa 6 ảnh. Cả 4 đợt dùng 23 lượt upload, nên 4 đợt có thể chạy trong 1–2 buổi.

**Ưu tiên:** chủ đề chương 3–4 và art polish trước (đợt 1). Sau mỗi đợt chủ đề, Level Dev sinh lại đúng các chương có art mới (generator đang dùng chủ đề dự phòng `fallback` trong `tools/level_spec.mjs`).

---

## 1. Quy ước chung

### 1.1 Ảnh mẫu (đường dẫn trong repo)

| Mã | File | Dùng cho |
|---|---|---|
| `REF-CAT` | `research/art-redo/style_ref_cat.png` | Mọi lưới tem, decor, UI (style đã duyệt) |
| `REF-TOPIC` | `research/art-redo/gen/lpo_ch2_s1.png` | Lưới tem (lưới mới nhất đã duyệt: Sailboats) |
| `REF-DECOR` | `research/art-redo/gen/lpo_decor_a.png` | Lưới decor (decor chương 1) |
| `REF-PIP` | `prototype/stamp/assets/decor/cat.png` | Pip (mèo cam) trong bộ UI và giường Pip |
| `REF-BG` | `research/art-redo/ui2/lpo_bg.png` | Nền ban ngày |
| `REF-BG-EVE` | `research/art-redo/ui2/lpo_bg_evening.png` | Nền buổi tối (level khó) |
| `REF-CARD` | `research/art-redo/gen/lpo_ch2_postcard.png` | Bưu thiếp teaser |

`research/art-redo/gen/` nằm trong `.gitignore` nhưng có sẵn trên máy.

### 1.2 Tên file tải về và nơi để

- Vòng lặp JS tải ảnh về `~/Downloads/` với tên ghi ở từng mục (luôn bắt đầu bằng `lpo_`).
- Lưới chủ đề: `tools/art_take.sh <slug>` tự chuyển `~/Downloads/lpo_topic_<slug>.png` vào `research/art-redo/gen/`, cắt, ghi vào game, sinh icon nét và làm ảnh xem nhanh `research/art-redo/preview_<slug>.jpg`.
- Các ảnh khác: `mv ~/Downloads/lpo_<tên>.png research/art-redo/gen/` rồi chạy lệnh cắt ghi ở từng mục.
- Lệnh nào cũng chạy được không có `--apply` để xem trước ở `research/art-redo/out/`.

### 1.3 Cắt: các chế độ của `tools/art_slice.py` (đã thêm trong đợt này)

| Chế độ / tuỳ chọn | Dùng cho |
|---|---|
| `topic <slug> <lưới>` | Lưới chủ đề theo `grid_map.json`. 27 chủ đề mới đã có map `[0..7, "icon"]`: ô 1–8 là tem 0–7, ô 9 là icon |
| `paths <lưới> a,b,...` | Đường dẫn tuỳ ý trong `assets` (decor, UI, fx). `-` là bỏ ô |
| hậu tố `@N` | Cắt sát, cạnh dài N px (vd. `ui/mailbag_open@600`) |
| hậu tố `@WxH` | Cắt sát rồi kéo đầy đúng canvas (nút 9-slice: `@868x194`) |
| `--grid CxR` | Lưới C cột × R hàng (bảng nút: `--grid 2x4`) |
| `--fixed` | Cắt cứng theo lưới khi các vật dính nhau (script báo `THIẾU`) |
| `postcard <ảnh> chN` | Bưu thiếp: cắt giữa 3:2, 900×600 JPEG → `assets/chN/postcard.jpg` |
| `bg <cảnh> [<tile>] <tên>` | Nền cao 1080×2400 → `assets/ui/<tên>.jpg`, in số đo đường nối và ảnh xem trước 3 tỉ lệ màn hình |

`--no-icon` giờ bỏ đúng ô có tên `icon`, ở vị trí nào cũng được (trước đây luôn bỏ ô 1).

### 1.4 Kiểm tra sau khi cắt (bắt buộc với chủ đề)

1. Mở `research/art-redo/preview_<slug>.jpg`. Ảnh này đặt 8 tem trên lá kem ở cỡ lá thật (khoảng 150 px) kèm icon màu và icon nét.
2. **Test 3 giây ở cỡ lá thật:** nhìn 3 giây, gọi được tên chủ đề, và không nhầm với các chủ đề ghi ở dòng "Không vẽ" của prompt.
3. Cần ≥ 6 tem dùng được (generator cần ≥ 5, `NEW_ART_MIN` trong `level_spec.mjs`; tốt nhất đủ 8 để có tem `n = 8`). Ô nào hỏng thì xoá file đó. Muốn vẽ lại vài ô thì gom vào một lưới `cards` (xem 1.5).
4. Icon (ô 9) phải đọc được ở 48 px. Icon nét `icon_line.png` không bị đứt hay bết.
5. Nén: `pngquant --force --ext .png --quality 70-90 prototype/stamp/assets/cards/<slug>/*.png`.

### 1.5 Khi ChatGPT làm sai

| Lỗi | Xử lý |
|---|---|
| Vật dính nhau, script báo `THIẾU` | Chạy lại lệnh cắt với `--fixed` |
| Vật nằm sai ô (vd. icon ở ô 1) | Cắt tay bằng `cards`: `python3 tools/art_slice.py cards <lưới> <slug>/icon,<slug>/0,... --apply` theo đúng thứ tự ô thực tế, rồi `python3 tools/icon_line.py` |
| Vẽ chữ, số, mặt cười | Gửi lại trong cùng chat: "Redraw the same grid without any text, numbers or faces." |
| Hỏng 1–3 ô của vài chủ đề | Gom vào một lưới 3×3 mới, cắt bằng `cards` (như `lpo_p2_a.png` trong `art-redo-chatgpt.md` mục 5) |
| Hết lượt upload | Làm tiếp bằng chữ trong chat đang có ảnh mẫu |

### 1.6 Khối style dùng chung

Mọi prompt bên dưới đã chứa sẵn khối style. Không cần ghép thêm. Nguyên tắc nằm trong khối đó: viền nâu ấm `#5a3a26` (không đen), pastel ấm, một lớp bóng mềm và một điểm sáng, tỉ lệ chibi, kiểu sticker, không chữ, không số. Tuổi 4+: không rượu bia, không vũ khí hay dao, không cờ bạc (không bài, xúc xắc, chip), không đầu lâu, không hình đáng sợ.

### 1.7 Cặp dễ nhầm mới (đề xuất cho Level Dev thêm vào `CONFUSE` trong `tools/level_rules.mjs`)

Prompt đã né các cặp trong plan. Khi viết danh sách món, tôi thấy thêm các cặp sau có thể nhầm ở cỡ lá. **Đây là giả thuyết**, Level Dev quyết sau khi xem ảnh thật:

| Cặp | Lý do |
|---|---|
| Lantern ↔ Balloon | Lồng đèn giấy tròn đỏ trông như bóng bay |
| Luggage ↔ Treasure | Vali cũ và rương gỗ (prompt Luggage đã cấm rương) |
| Umbrella ↔ Weather | Ô và mây mưa (prompt Weather đã cấm ô) |
| Umbrella ↔ Mushroom | Ô mở chấm bi trông như nấm đỏ chấm trắng (prompt đã cấm chấm bi) |
| Cheese ↔ Pizza, Cheese ↔ Cake | Miếng phô mai tam giác, miếng pizza và miếng cheesecake cùng dáng |
| Pottery ↔ Honey, Pottery ↔ Cactus | Hũ mật ong và chậu gốm. Prompt Cactus chỉ cho chậu đất trơn |
| Picnic ↔ Bread, Picnic ↔ Juice | Giỏ picnic thường có bánh mì và nước (prompt đã cấm đồ ăn và đồ uống) |
| Fireworks ↔ Flower | Pháo hoa nở trông như hoa cúc (prompt đặt pháo hoa trên đĩa trời đêm) |
| Mask ↔ Glasses | Mặt nạ che mắt trông như kính |
| Origami ↔ Aircraft | Máy bay giấy (prompt đã cấm) |
| Keys ↔ Treasure | Chìa khóa vàng (prompt Treasure đã cấm chìa) |
| Winter ↔ Weather | Người tuyết và bông tuyết (cả hai prompt đã cấm bông tuyết) |
| Fishing ↔ Float | Phao câu đỏ trắng trông như bóng hoặc phao bơi |
| Stationery ↔ Painting | Bút và cọ (hai prompt đã chia rõ) |

---

## 2. Đợt 1 (12 ảnh): chủ đề chương 3–4 và art polish

### Chat 1A: chủ đề chương 3–4 (6 ảnh)

**Đính kèm ở lệnh đầu tiên (T01):** `REF-CAT`, `REF-TOPIC`. T02–T06 chỉ gửi chữ.

| Mã | Chủ đề (EN / VI) | Chương | Tải về | Lệnh cắt (tương đương `tools/art_take.sh <slug>`) | Đích |
|---|---|---|---|---|---|
| T01 | Lantern / Đèn lồng | 3 | `lpo_topic_lantern.png` | `mv ~/Downloads/lpo_topic_lantern.png research/art-redo/gen/ && python3 tools/art_slice.py topic lantern research/art-redo/gen/lpo_topic_lantern.png --apply && python3 tools/icon_line.py` | `assets/cards/lantern/0–7.png, icon.png, icon_line.png` |
| T02 | Knitting / Đồ len | 3 | `lpo_topic_knitting.png` | `mv ~/Downloads/lpo_topic_knitting.png research/art-redo/gen/ && python3 tools/art_slice.py topic knitting research/art-redo/gen/lpo_topic_knitting.png --apply && python3 tools/icon_line.py` | `assets/cards/knitting/` |
| T03 | Acorn / Hạt dẻ & quả sồi | 3 | `lpo_topic_acorn.png` | `mv ~/Downloads/lpo_topic_acorn.png research/art-redo/gen/ && python3 tools/art_slice.py topic acorn research/art-redo/gen/lpo_topic_acorn.png --apply && python3 tools/icon_line.py` | `assets/cards/acorn/` |
| T04 | Winter / Người tuyết | 4 | `lpo_topic_winter.png` | `mv ~/Downloads/lpo_topic_winter.png research/art-redo/gen/ && python3 tools/art_slice.py topic winter research/art-redo/gen/lpo_topic_winter.png --apply && python3 tools/icon_line.py` | `assets/cards/winter/` |
| T05 | Candle / Nến | 4 | `lpo_topic_candle.png` | `mv ~/Downloads/lpo_topic_candle.png research/art-redo/gen/ && python3 tools/art_slice.py topic candle research/art-redo/gen/lpo_topic_candle.png --apply && python3 tools/icon_line.py` | `assets/cards/candle/` |
| T06 | Gift / Hộp quà | 4 | `lpo_topic_gift.png` | `mv ~/Downloads/lpo_topic_gift.png research/art-redo/gen/ && python3 tools/art_slice.py topic gift research/art-redo/gen/lpo_topic_gift.png --apply && python3 tools/icon_line.py` | `assets/cards/gift/` |

#### T01 Lantern

```
Draw a new stamp set "Lanterns" for the cozy mobile game Little Post Office, in exactly the same style as the attached reference images: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) round red paper lantern with gold top and bottom caps and a short red tassel, glowing warmly inside; (2) tall white cylindrical paper lantern with thin wooden ribs and a simple brush swirl (no writing); (3) pink lotus-flower paper lantern.
Row 2: (4) yellow star-shaped paper lantern; (5) short string of three small paper lanterns (orange, pink, yellow) on a little cord; (6) small paper lantern hanging from a wooden carrying stick.
Row 3: (7) grey stone garden lantern (Japanese toro style); (8) hexagonal wooden-frame lantern with cream paper panels; (9) THEME ICON: a round paper lantern with caps and tassel, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: candles or visible flames, glass or metal oil lanterns, hurricane lamps, balloons or balloon strings (every lantern must clearly show its top and bottom caps or frame), faces, any writing or characters.
```

#### T02 Knitting

```
Draw a new stamp set "Knitting" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) ball of red yarn with two wooden knitting needles stuck through it; (2) twisted skein of teal yarn with a plain paper band; (3) two knitting needles holding a half-finished striped scarf.
Row 2: (4) one mustard-yellow knitted mitten with a simple cable pattern; (5) knitted beanie with a big pom-pom; (6) striped knitted sock.
Row 3: (7) small wicker basket full of yarn balls; (8) crochet hook with a colourful granny square; (9) THEME ICON: a yarn ball with two crossed needles, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: sweaters, cardigans, jackets or coats, snowflakes, people or hands, faces, text.
```

#### T03 Acorn

```
Draw a new stamp set "Acorns and Nuts" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) classic acorn with a textured cap and a tiny stem; (2) two acorns joined at the stem; (3) chestnut sitting in its open spiky green husk.
Row 2: (4) one shiny brown chestnut; (5) walnut in its wrinkled shell; (6) two round hazelnuts side by side.
Row 3: (7) pine cone; (8) peanut in its shell; (9) THEME ICON: a single simple acorn, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Very important: absolutely NO leaves or leaf shapes anywhere, not even a small leaf on a stem. Also do not draw: trees, branches, mushrooms, squirrels or other animals, faces, text.
```

#### T04 Winter (Người tuyết)

```
Draw a new stamp set "Snowmen and Winter Fun" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) classic three-ball snowman with a carrot nose, coal-dot eyes and stick arms; (2) snowman wearing a black top hat and holding a small broom; (3) snowman wearing blue earmuffs.
Row 2: (4) two small snowmen side by side, one tall and one short; (5) snow globe with a tiny snowman inside on a wooden base; (6) wooden sled with red runners.
Row 3: (7) small igloo made of snow blocks; (8) pile of three snowballs; (9) THEME ICON: a simple two-ball snowman with only a carrot nose (no eyes, no mouth), drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, few details, must read at 48 px.
Do not draw: snowflakes, clouds, separate mittens or scarves, ice skates, skis, Christmas trees, gifts, people.
```

#### T05 Candle

```
Draw a new stamp set "Candles" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) tall white pillar candle with a small flame and one wax drip; (2) cream taper candle in a brass chamberstick with a finger loop; (3) three small tea-light candles in a row.
Row 2: (4) candle in a short glass jar; (5) two twisted pink dinner candles; (6) three-arm brass candelabra holding three candles.
Row 3: (7) short red candle melting on a little saucer; (8) thick lavender pillar candle with a ribbon tied around it; (9) THEME ICON: a single pillar candle with a flame, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: lanterns, paper lanterns or any glass lantern housing, birthday candles, number candles, cakes, faces, text.
```

#### T06 Gift

```
Draw a new stamp set "Gift Boxes" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) red cube gift box with a white ribbon and big bow; (2) tall blue gift box with a yellow ribbon; (3) round pink hatbox-style gift with a bow on top.
Row 2: (4) green gift bag with tissue paper sticking out; (5) stack of three presents, big, medium and small; (6) open gift box with its lid leaning against it and loose ribbon.
Row 3: (7) small gold box with a blank gift tag on a string; (8) long flat purple box in polka-dot paper with a ribbon; (9) THEME ICON: a simple present box with a bow, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: candy or candy canes, Christmas trees, suitcases or chests, characters, writing on the tags.
```

### Chat 1B: art polish UI (3 ảnh)

**Đính kèm ở lệnh đầu tiên (P5):** `REF-CAT`. **Đính kèm thêm ở P6+P9:** `REF-PIP`.

#### P5. Hạt theo theme (benchmark P5, G10)

Tải về `lpo_fx.png`. Palette 5 màu của game: kem giấy, nâu gỗ, đỏ air-mail, xanh air-mail, vàng đồng.

```
Draw a sprite sheet of small particle pieces for celebration effects in the cozy mobile game Little Post Office, in the same sticker style as the attached reference: warm dark-brown outline (#5a3a26, thin, never black), soft flat colours with one small highlight. Use ONLY this palette: paper cream #F6EEDC, wood brown #8A5A3B, airmail red #C8483C, airmail blue #3D6FA8, brass gold #D9A441.
Layout: square image, 3x3 grid, one piece centred in each cell, drawn large (filling about 60% of the cell) with clear empty space around it. No grid lines, no text, no numbers. Transparent background (if not possible: plain flat mid grey #BFC5CC).
Row 1: (1) small torn scrap of cream paper with a rough edge; (2) curled strip of airmail-red paper; (3) curled strip of airmail-blue paper.
Row 2: (4) tiny red postage stamp with perforated edges and a blank centre; (5) tiny blue postage stamp with perforated edges and a blank centre; (6) tiny sealed cream envelope with a red heart seal.
Row 3: (7) small red wax seal drop; (8) soft four-point twinkle with rounded points in brass gold; (9) small curled ribbon of gold foil confetti.
No neon colours, no eight-point stars, no faces.
```

Lệnh cắt (ảnh dùng làm sprite hạt, cạnh dài 128 px, game vẽ ở khoảng 20–60 px):

```
mv ~/Downloads/lpo_fx.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_fx.png fx/paper_cream@128,fx/paper_red@128,fx/paper_blue@128,fx/stamp_red@128,fx/stamp_blue@128,fx/envelope@128,fx/wax_drop@128,fx/twinkle@128,fx/foil_gold@128 --apply
```

Đích: `prototype/stamp/assets/fx/*.png` (thư mục mới). Feature Dev nối vào `fx.js` khi làm P5.

#### P6 + P9. Túi thư màn thắng và bộ icon màn chính

Tải về `lpo_ui_home.png`.

```
Draw a set of 9 user-interface props for the cozy mobile game Little Post Office, in exactly the same sticker style as the reference images in this chat: warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions. The orange tabby cat is Pip, the post office cat: keep Pip exactly like the attached cat image.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it, objects do not touch. No grid lines, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC).
Row 1: (1) Pip's canvas postal satchel, front view, top flap open, empty, leather strap and brass buckle, a small envelope emblem stitched on the front; (2) the same satchel full of letters and small parcels peeking out of the top; (3) Pip sitting upright and waiting patiently, wearing a tiny blue postal cap, tail curled around the paws, eyes open.
Row 2: (4) round settings icon: a brass cog with a cream centre; (5) "today's letter" icon: a cream envelope with a small red sun stamp on it; (6) stamp album icon: a closed brown book with one stamp on the cover.
Row 3: (7) decorate icon: the facade of a tiny post office building with a red door and a small heart above the door; (8) current-level marker: a round map pin in airmail red with a white paw print; (9) event icon: a small wooden signpost with an envelope pinned to it.
Icons 4 to 9 must be simple and readable at 48 px: thick outline, few details, no faces.
```

Lệnh cắt:

```
mv ~/Downloads/lpo_ui_home.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_ui_home.png ui/mailbag_open@600,ui/mailbag_full@600,ui/pip_wait@600,ui/ic_settings@256,ui/ic_daily@256,ui/ic_album@256,ui/ic_decor@256,ui/level_pin@200,ui/ic_event@256 --apply
```

Đích: `prototype/stamp/assets/ui/` (toàn tên mới, không ghi đè file đang dùng). P6 dùng `mailbag_open` (phong bì bay vào) rồi đổi sang `mailbag_full`. P9 dùng các icon còn lại. `ic_event` dành cho E1 "Tuyến đưa thư" (benchmark mục 9).

#### P11. Hệ nút: 1 chính, 1 phụ, 1 nút đóng, kèm biển tên chương (P9)

Tải về `lpo_buttons.png`. Ảnh **ngang 3:2**, lưới **2 cột × 4 hàng**, để nút đủ độ phân giải cho 9-slice (canvas 868×194 như `btn_yellow.png`).

```
Draw a button kit for the cozy mobile game Little Post Office, in the same sticker style as the reference images in this chat: warm dark-brown outline (#5a3a26, never black), soft colours, one soft shading layer and one small highlight.
Image: landscape 3:2. Layout: 2 columns x 4 rows, one object centred in each cell, each button filling about 90% of its cell width. No grid lines, no text, letters, numbers or icons on the buttons. Transparent background (if not possible: plain flat light grey #D6D9DC).
Buttons are wide rounded rectangles with an aspect ratio of about 4.5 to 1, a thick dark-brown outline, a slightly lighter top face and a darker bottom edge (bevel) about 12% of the height. The middle part must be plain and uniform from left to right (it will be stretched); any small ornament only near the four corners.
Column 1 = PRIMARY button in warm brass gold (#D9A441 face, darker gold bevel). Column 2 = SECONDARY button in cream paper (#F6EEDC face, light brown bevel, thin brown inner line).
Row 1: both buttons in normal state. Row 2: both buttons pressed (top face shifted down, bevel almost gone, face slightly darker). Row 3: both buttons disabled (same shape, desaturated grey-beige, flat, no highlight).
Row 4: (left) a blank wooden hanging sign for a chapter name: a wide plank about 2.7 to 1 with rounded corners and two short ropes at the top, plain centre for text; (right) a round close button: cream paper circle with a dark-brown outline and a simple brown X.
```

Lệnh cắt:

```
mv ~/Downloads/lpo_buttons.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_buttons.png ui/btn_primary@868x194,ui/btn_secondary@868x194,ui/btn_primary_down@868x194,ui/btn_secondary_down@868x194,ui/btn_primary_off@868x194,ui/btn_secondary_off@868x194,ui/chapter_sign@720,ui/btn_close@160 --grid 2x4 --apply
```

Đích: `prototype/stamp/assets/ui/`. Tên mới, không ghi đè `btn_yellow.png`/`btn_blue.png`. Feature Dev đổi CSS sang 2 kiểu nút (tiêu chí P11: không còn `btn_blue.png` trong CSS). Lát 9-slice đo lại theo ảnh mới (bản cũ là `70 90 80`).

### Chat 1C: nền cao 1080×2400 không đường nối (P3, 3 ảnh)

ChatGPT chỉ vẽ được tối đa 1024×1536 (2:3). Cách làm: vẽ cảnh 2:3 có **1/3 trên chỉ là giấy dán tường**, vẽ thêm một tile giấy dán tường liền mép. `art_slice.py bg` co cảnh về rộng 1080 đặt sát đáy (cao 1620), lấp 780 px phía trên bằng tile (đã làm liền theo chiều dọc và chỉnh màu theo dải tường của cảnh), hoà qua dải 240 px, rồi làm mờ họa tiết 60% trong vùng chơi như `bg_game.jpg` cũ. Nếu tile hỏng thì bỏ tham số tile: script lấy dải tường trên cùng của chính cảnh làm tile.

**B1. Nền ban ngày.** Đính kèm `REF-BG`. Tải về `lpo_bg_tall_day.png`.

```
Redraw the attached background for the cozy mobile game Little Post Office as a new portrait image (2:3, 1024x1536), same painted style, same warm morning light and mint-green post office wall.
Composition from bottom to top:
- Bottom 18%: a warm wooden shelf/counter spanning the full width, its top edge perfectly horizontal.
- From 18% to 65% of the height: the mint-green wall with a very faint pattern of tiny envelopes, post horns and paw prints; a tall window on the left whose frame, sunlight rays and plant stay INSIDE this zone; one small potted plant on the shelf at the right.
- Top 35% of the image: ONLY the same plain wallpaper with the same faint pattern, evenly lit, nothing else: no window, no light rays, no picture frames, no plants, no shelves, no lamps. The wallpaper must simply continue up to the top edge so the image can be extended upward.
Keep the centre calm and low-contrast because cards are placed on top. Nothing cut off by the left or right edges in the top half. No text, no people, no cat.
```

**B2. Tile giấy dán tường.** Không đính kèm. Tải về `lpo_bg_tile.png`.

```
Now draw only the wallpaper from that background as a seamless tileable texture: square 1024x1024, the same mint-green colour and the same faint pattern of tiny envelopes, post horns and paw prints at exactly the same size and spacing as in the background (about 6 motifs across the width). Very low contrast: the pattern is only slightly darker than the base. Evenly lit, flat, no light rays, no vignette, no shadows. The left and right edges and the top and bottom edges must wrap seamlessly.
```

**B3. Nền buổi tối (level khó).** Đính kèm `REF-BG-EVE`. Tải về `lpo_bg_tall_evening.png`.

```
Redraw the portrait background you just made (identical composition: same window, shelf, plant and wallpaper, same top 35% of plain wallpaper) at evening, with the mood of the attached evening image: purple-blue dusk sky with a few small stars through the window, a small warm brass desk lamp glowing on the shelf at the right, the wall in a cooler and dimmer tone. The lamp glow must stay in the lower half; the top 35% stays plain wallpaper, evenly lit, nothing else. No text, no people.
```

Lệnh cắt (ghi tên mới, không ghi đè `bg_game.jpg`/`bg_hard.jpg` vì CSS hiện vẽ nền ở 1080×1920):

```
mv ~/Downloads/lpo_bg_tall_day.png ~/Downloads/lpo_bg_tile.png ~/Downloads/lpo_bg_tall_evening.png research/art-redo/gen/
python3 tools/art_slice.py bg research/art-redo/gen/lpo_bg_tall_day.png research/art-redo/gen/lpo_bg_tile.png bg_game_tall --apply
python3 tools/art_slice.py bg research/art-redo/gen/lpo_bg_tall_evening.png research/art-redo/gen/lpo_bg_tile.png bg_hard_tall --apply
```

Đích: `prototype/stamp/assets/ui/bg_game_tall.jpg`, `bg_hard_tall.jpg`. Kiểm tra:
- Script in "đường nối: chênh lệch hàng lớn nhất …/255". P3 cần < 6.
- Xem `research/art-redo/out/ui/bg_game_tall_preview.jpg`: 3 khung 16:9, 19.5:9, 20:9 neo đáy.
- Vùng làm mờ mặc định là 8–86% chiều cao. Nếu kệ gỗ không nằm ở 18% đáy như yêu cầu thì chỉnh `--soften 0.08:0.84`. Nếu dải chuyển lộ thì tăng `--feather 320`.
- Feature Dev đổi CSS thành `center bottom/1080px 2400px` và trỏ sang file `_tall`.

---

## 3. Đợt 2 (13 ảnh): chủ đề chương 5–7, decor và bưu thiếp chương 3–4

### Chat 2A: chủ đề chương 5–6 (6 ảnh)

**Đính kèm ở lệnh đầu tiên (T07):** `REF-CAT`, `REF-TOPIC`. Các lệnh sau chỉ gửi chữ. Ở T07, đổi câu "reference images earlier in this chat" thành "attached reference images".

Lệnh cắt giống đợt 1, đổi slug. Mỗi dòng dưới đây là lệnh đầy đủ:

| Mã | Chủ đề | Ch | Tải về | Lệnh cắt | Đích |
|---|---|---|---|---|---|
| T07 | Luggage / Vali | 5 | `lpo_topic_luggage.png` | `mv ~/Downloads/lpo_topic_luggage.png research/art-redo/gen/ && python3 tools/art_slice.py topic luggage research/art-redo/gen/lpo_topic_luggage.png --apply && python3 tools/icon_line.py` | `assets/cards/luggage/` |
| T08 | Umbrella / Ô dù | 5 | `lpo_topic_umbrella.png` | `mv ~/Downloads/lpo_topic_umbrella.png research/art-redo/gen/ && python3 tools/art_slice.py topic umbrella research/art-redo/gen/lpo_topic_umbrella.png --apply && python3 tools/icon_line.py` | `assets/cards/umbrella/` |
| T09 | Camera / Máy ảnh | 5 | `lpo_topic_camera.png` | `mv ~/Downloads/lpo_topic_camera.png research/art-redo/gen/ && python3 tools/art_slice.py topic camera research/art-redo/gen/lpo_topic_camera.png --apply && python3 tools/icon_line.py` | `assets/cards/camera/` |
| T10 | Lighthouse / Hải đăng | 6 | `lpo_topic_lighthouse.png` | `mv ~/Downloads/lpo_topic_lighthouse.png research/art-redo/gen/ && python3 tools/art_slice.py topic lighthouse research/art-redo/gen/lpo_topic_lighthouse.png --apply && python3 tools/icon_line.py` | `assets/cards/lighthouse/` |
| T11 | Treasure / Kho báu | 6 | `lpo_topic_treasure.png` | `mv ~/Downloads/lpo_topic_treasure.png research/art-redo/gen/ && python3 tools/art_slice.py topic treasure research/art-redo/gen/lpo_topic_treasure.png --apply && python3 tools/icon_line.py` | `assets/cards/treasure/` |
| T12 | Cactus / Xương rồng | 6 | `lpo_topic_cactus.png` | `mv ~/Downloads/lpo_topic_cactus.png research/art-redo/gen/ && python3 tools/art_slice.py topic cactus research/art-redo/gen/lpo_topic_cactus.png --apply && python3 tools/icon_line.py` | `assets/cards/cactus/` |

Mọi prompt chủ đề từ đây dùng chung 2 đoạn đầu với T02 (style và layout). Để copy-paste được, mỗi prompt vẫn ghi đủ.

#### T07 Luggage

```
Draw a new stamp set "Luggage" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) vintage brown leather suitcase with two straps and a handle; (2) mint hard-shell rolling suitcase with its handle pulled up; (3) navy duffel bag.
Row 2: (4) small red train case with a handle on top; (5) travel backpack with a rolled blanket on top; (6) brown leather doctor's bag with a brass clasp.
Row 3: (7) cream suitcase covered with blank round travel stickers; (8) two stacked suitcases tied with a strap; (9) THEME ICON: a simple suitcase with a handle, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: trunks or treasure chests, hat boxes or bows, brand logos, text on stickers or tags, people.
```

#### T08 Umbrella

```
Draw a new stamp set "Umbrellas" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) open plain red umbrella with a curved wooden handle; (2) closed navy umbrella with a crook handle, standing upright; (3) open rainbow-striped umbrella.
Row 2: (4) clear bubble dome umbrella; (5) Japanese oil-paper parasol in soft orange; (6) small folded umbrella in its sleeve.
Row 3: (7) brass umbrella stand holding two closed umbrellas; (8) white lace parasol with frills; (9) THEME ICON: a simple open umbrella, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: polka dots or spots (they look like mushrooms), rain clouds, raindrops, sun, beach scenes, cocktail umbrellas, people.
```

#### T09 Camera

```
Draw a new stamp set "Cameras" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) vintage silver-and-black film camera; (2) boxy instant camera with a photo sliding out; (3) twin-lens reflex camera seen from the front.
Row 2: (4) old wooden bellows camera on a small tripod; (5) simple brown box camera; (6) roll of film next to its canister.
Row 3: (7) small fanned stack of instant photos showing tiny landscapes; (8) vintage movie camera with two film reels on top; (9) THEME ICON: a simple camera body with a round lens, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: smartphones, mobile phones, telephones, screens or tablets, brand names or logos, people.
```

#### T10 Lighthouse

```
Draw a new stamp set "Lighthouses" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) red-and-white striped lighthouse; (2) blue-and-white lighthouse with a gallery railing; (3) grey stone lighthouse with a red lantern room.
Row 2: (4) white lighthouse joined to a small keeper's cottage; (5) lighthouse on a little rocky islet with two small waves; (6) slim black-and-white spiral-striped lighthouse.
Row 3: (7) short squat yellow lighthouse; (8) octagonal wooden lighthouse in soft green; (9) THEME ICON: a simple lighthouse with two short light beams, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: ships or boats, anchors, ship wheels, compasses, life rings, seagulls, people.
```

#### T11 Treasure

```
Draw a new stamp set "Treasure" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) open wooden treasure chest overflowing with gold nuggets and pearls; (2) closed wooden chest with iron bands and a simple metal clasp; (3) rolled-out treasure map with a dotted path and a red X.
Row 2: (4) small stack of gold bars; (5) pearl necklace with one red jewel pendant; (6) golden jewelled egg on a little stand.
Row 3: (7) golden genie-style oil lamp; (8) small open jewellery box with velvet lining and a brooch; (9) THEME ICON: a simple closed treasure chest, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: crowns, loose gold coins, rings, keys, padlocks, swords or any weapons, skulls, pirate flags, compasses, telescopes, people.
```

#### T12 Cactus

```
Draw a new stamp set "Cacti" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) tall saguaro cactus with two arms standing in a little patch of sand; (2) round barrel cactus with a pink flower on top; (3) prickly pear cactus pads with small red fruits.
Row 2: (4) bunny-ear cactus in a small plain terracotta pot; (5) tall column cactus in a plain terracotta pot; (6) cluster of tiny round cacti in sand.
Row 3: (7) star-shaped cactus with a yellow flower; (8) fuzzy white old-man cactus covered in soft white hair; (9) THEME ICON: a simple saguaro cactus silhouette, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: decorative vases or patterned pots, baskets, leafy plants, flowers without a cactus, faces, text.
```

### Chat 2B: chủ đề chương 7 và decor chương 3–4 (5 ảnh)

**Đính kèm ở T13:** `REF-CAT`, `REF-TOPIC`. **Đính kèm ở D3:** `REF-DECOR`, `REF-PIP`. Ở T13, đổi câu "reference images earlier in this chat" thành "attached reference images".

| Mã | Chủ đề | Ch | Tải về | Lệnh cắt | Đích |
|---|---|---|---|---|---|
| T13 | Bread / Bánh mì | 7 | `lpo_topic_bread.png` | `mv ~/Downloads/lpo_topic_bread.png research/art-redo/gen/ && python3 tools/art_slice.py topic bread research/art-redo/gen/lpo_topic_bread.png --apply && python3 tools/icon_line.py` | `assets/cards/bread/` |
| T14 | Cheese / Phô mai | 7 | `lpo_topic_cheese.png` | `mv ~/Downloads/lpo_topic_cheese.png research/art-redo/gen/ && python3 tools/art_slice.py topic cheese research/art-redo/gen/lpo_topic_cheese.png --apply && python3 tools/icon_line.py` | `assets/cards/cheese/` |
| T15 | Pottery / Đồ gốm | 7 | `lpo_topic_pottery.png` | `mv ~/Downloads/lpo_topic_pottery.png research/art-redo/gen/ && python3 tools/art_slice.py topic pottery research/art-redo/gen/lpo_topic_pottery.png --apply && python3 tools/icon_line.py` | `assets/cards/pottery/` |

#### T13 Bread

```
Draw a new stamp set "Bread" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) long baguette; (2) round country loaf with a scored cross on top; (3) golden croissant.
Row 2: (4) soft pretzel; (5) sliced sandwich loaf with one slice standing in front; (6) bagel with sesame seeds.
Row 3: (7) glossy brioche bun; (8) dark seeded rye loaf; (9) THEME ICON: a simple bread loaf with three scores, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: sandwiches, burgers, cakes, doughnuts, cream, fruit, cheese, bottles or wine, knives, faces.
```

#### T14 Cheese

```
Draw a new stamp set "Cheese" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) thick wedge of yellow Swiss cheese with round holes, drawn as a solid 3D block; (2) whole cheese wheel with one wedge cut out; (3) small round cheese in red wax.
Row 2: (4) wedge of brie with a white rind; (5) wedge of blue cheese with blue veins; (6) cheese cubes on a small wooden board.
Row 3: (7) stack of three square cheese slices; (8) round cheese in an open thin wooden box with the lid beside it; (9) THEME ICON: a simple cheese wedge with holes, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: knives, wine or bottles, crackers, bread, mice, pizza, cakes or cheesecake, faces, text.
```

#### T15 Pottery

```
Draw a new stamp set "Pottery" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) tall terracotta amphora with two handles; (2) slim blue-and-white porcelain vase; (3) round-bellied green glazed vase.
Row 2: (4) empty cream ceramic pitcher jug; (5) lidded ginger jar with a simple pattern; (6) stack of three ceramic bowls.
Row 3: (7) potter's wheel with a lump of clay being shaped (no hands); (8) decorative painted plate on a small stand; (9) THEME ICON: a simple vase silhouette, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: teapots, cups or mugs, flowers or plants in the vases, cacti, honey pots, any liquid, wine, people or hands.
```

#### Lưới decor: quy ước chung (D3–D11)

Mỗi chương 6 decor, dùng chung **6 chỗ đặt** trên nền như chương 1–2 (`index.html` `.dc-*`, `CHAPTERS[].decor` trong `main.js`). Thứ tự và giá giữ như chương 1–2:

| Chỗ | CSS mẫu (ch1 / ch2) | Kích thước hiển thị | Giá |
|---|---|---|---|
| TRÊN: treo ngang trên cùng | `bunting` / `fan` | rộng 380–1020 | 2 |
| TƯỜNG-TRÁI | `frame` / `porthole` | rộng khoảng 200 | 3 |
| TƯỜNG-PHẢI | `clock` / `buoy` | rộng khoảng 180 | 4 |
| KỆ-TRÁI: đứng trên kệ, cao và hẹp | `postbox` / `lantern` | rộng khoảng 150 | 4 |
| TƯỜNG-GIỮA: to nhất | `board` / `chart` | rộng khoảng 240 | 5 |
| KỆ-PHẢI: chỗ ngủ của Pip | `cat` / `boatbed` | rộng khoảng 220 | 6 |

Bố cục lưới decor: **hàng 1 là món TRÊN**, vẽ trải ngang cả hàng. Hàng 2: TƯỜNG-TRÁI, TƯỜNG-GIỮA, TƯỜNG-PHẢI. Hàng 3: KỆ-TRÁI, giường Pip, ô dư. Script gán món trải ngang vào ô 2 theo tâm, nên lệnh cắt luôn có dạng `-,decor/<trên>@1200,-,...`. Plan chỉ liệt kê món, không ghép chỗ đặt. Ở vài chương có món không hợp chỗ nào (lò sưởi, ghế băng là đồ sàn, nền chỉ có 2 chỗ trên kệ). Tôi đổi món đó và ghi rõ ở từng lưới.

**Ô dư (ô 9)** dùng cho nhu cầu plan 2.3: icon Tem Đa Năng (D3), icon Nam châm theo theme (D4), decor hiếm theo tháng (D6), và phương án thay cho món đã đổi (D5, D8). Các chương còn lại dùng ô dư làm phương án B cho giường Pip.

#### D3. Decor chương 3, Đồi Trà (mùa thu)

Tải về `lpo_decor_ch3.png`. Đổi so với plan: "thảm len" thành dây cờ đan len (cần một món treo ngang); "lò sưởi" thành tranh đồi chè (lò sưởi là đồ sàn, không có chỗ đặt).

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Tea Hill" (autumn), in exactly the same style as the attached decoration sheet and reference images: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with autumn tones, one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip: keep Pip exactly like the attached cat image.
Layout: square image. Row 1 is ONE wide object spanning the full width of the row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: a garland of small knitted pennant flags in autumn colours (mustard, rust, cream, sage) on a yarn string, with small pom-poms, hanging in a gentle curve.
Row 2: (4) a small wooden wall shelf holding three tea tins and a little teacup; (5) a framed painting of green tea terraces on a hill with a tiny red-roofed house, wooden frame; (6) a hanging wall planter with white daisies.
Row 3: (7) a tall copper tea kettle standing on a small trivet; (8) Pip sleeping curled up in a round wicker basket filled with yarn balls; (9) a "Wild Stamp" booster icon: a golden postage stamp with perforated edges and a small rainbow star in the centre, simple and readable at 48 px.
```

```
mv ~/Downloads/lpo_decor_ch3.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch3.png -,decor/knit_bunting@1200,-,decor/tea_shelf,decor/tea_painting,decor/daisy_pot,decor/copper_kettle,decor/yarn_basket,ui/ic_wild@256 --apply
```

Đích: `assets/decor/` (6 file, cắt sát, cạnh dài 600; riêng món TRÊN 1200) và `assets/ui/ic_wild.png`. Gợi ý `CHAPTERS[2].decor` cho Feature Dev: `knit_bunting 2, tea_shelf 3, daisy_pot 4, copper_kettle 4, tea_painting 5, yarn_basket 6`.

#### D4. Decor chương 4, Vườn Táo (mùa đông)

Tải về `lpo_decor_ch4.png`.

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Apple Orchard" (winter), in exactly the same style as the decoration sheet and reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with cosy winter tones (red, green, cream, gold), one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip, same as before.
Layout: square image. Row 1 is ONE wide object spanning the full width of the row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: a string of warm round fairy lights (soft gold and red bulbs) on a dark-green cord, hanging in a gentle curve.
Row 2: (4) a round evergreen wreath with small red apples and a red bow; (5) three knitted stockings hanging from a short wooden rod, in red, green and cream; (6) a wooden wall peg with a striped knitted scarf hanging from it.
Row 3: (7) a wicker basket full of red apples; (8) Pip sleeping inside an open gift box with a loose ribbon; (9) a "Magnet" booster icon: a red horseshoe magnet with silver tips holding a tiny cream envelope, simple and readable at 48 px.
```

```
mv ~/Downloads/lpo_decor_ch4.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch4.png -,decor/string_lights@1200,-,decor/wreath,decor/stockings,decor/scarf_hook,decor/apple_basket,decor/gift_bed,ui/ic_magnet@256 --apply
```

Gợi ý `CHAPTERS[3].decor`: `string_lights 2, wreath 3, scarf_hook 4, apple_basket 4, stockings 5, gift_bed 6`.

### Chat 2C: bưu thiếp chương 3–4 (2 ảnh)

**Đính kèm ở C3:** `REF-CARD`. Bưu thiếp là ảnh teaser của màn "Chương N sắp mở" (giống `assets/ch2/postcard.jpg`). Dấu "SOON" và khung do CSS thêm.

#### C3. Đồi Trà

Tải về `lpo_postcard_ch3.png`.

```
Paint a picture-postcard landscape for the cozy mobile game Little Post Office, in exactly the same painted storybook style as the attached postcard: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2.
Scene "Tea Hill" in autumn: rolling green tea terraces on a gentle hill, a few small cottages with red and brown roofs, a winding stone path, round red paper lanterns strung between two posts, trees in warm orange and gold, a soft afternoon sky with light clouds.
No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.
```

```
mv ~/Downloads/lpo_postcard_ch3.png research/art-redo/gen/
python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch3.png ch3 --apply
```

Đích: `prototype/stamp/assets/ch3/postcard.jpg` (900×600).

#### C4. Vườn Táo

Tải về `lpo_postcard_ch4.png`.

```
Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2.
Scene "Apple Orchard" in winter: rows of small apple trees with a light dusting of snow and a few red apples still on the branches, a red wooden barn and a farmhouse with a smoking chimney and warm lit windows, a wooden fence, soft snowy ground, a pale winter sky at golden hour.
No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.
```

```
mv ~/Downloads/lpo_postcard_ch4.png research/art-redo/gen/
python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch4.png ch4 --apply
```

---

## 4. Đợt 3 (12 ảnh): chủ đề chương 8–11

### Chat 3A: chương 8–9 (6 ảnh). **Đính kèm ở T16:** `REF-CAT`, `REF-TOPIC`. Ở T16, đổi câu "reference images earlier in this chat" thành "attached reference images".

| Mã | Chủ đề | Ch | Tải về | Lệnh cắt | Đích |
|---|---|---|---|---|---|
| T16 | Fishing / Đồ câu | 8 | `lpo_topic_fishing.png` | `mv ~/Downloads/lpo_topic_fishing.png research/art-redo/gen/ && python3 tools/art_slice.py topic fishing research/art-redo/gen/lpo_topic_fishing.png --apply && python3 tools/icon_line.py` | `assets/cards/fishing/` |
| T17 | Picnic / Dã ngoại | 8 | `lpo_topic_picnic.png` | `mv ~/Downloads/lpo_topic_picnic.png research/art-redo/gen/ && python3 tools/art_slice.py topic picnic research/art-redo/gen/lpo_topic_picnic.png --apply && python3 tools/icon_line.py` | `assets/cards/picnic/` |
| T18 | Painting / Họa cụ | 8 | `lpo_topic_painting.png` | `mv ~/Downloads/lpo_topic_painting.png research/art-redo/gen/ && python3 tools/art_slice.py topic painting research/art-redo/gen/lpo_topic_painting.png --apply && python3 tools/icon_line.py` | `assets/cards/painting/` |
| T19 | Stationery / Văn phòng phẩm | 9 | `lpo_topic_stationery.png` | `mv ~/Downloads/lpo_topic_stationery.png research/art-redo/gen/ && python3 tools/art_slice.py topic stationery research/art-redo/gen/lpo_topic_stationery.png --apply && python3 tools/icon_line.py` | `assets/cards/stationery/` |
| T20 | Wooden Toys / Đồ chơi gỗ | 9 | `lpo_topic_wooden_toys.png` | `mv ~/Downloads/lpo_topic_wooden_toys.png research/art-redo/gen/ && python3 tools/art_slice.py topic wooden_toys research/art-redo/gen/lpo_topic_wooden_toys.png --apply && python3 tools/icon_line.py` | `assets/cards/wooden_toys/` |
| T21 | Honey / Ong & mật | 9 | `lpo_topic_honey.png` | `mv ~/Downloads/lpo_topic_honey.png research/art-redo/gen/ && python3 tools/art_slice.py topic honey research/art-redo/gen/lpo_topic_honey.png --apply && python3 tools/icon_line.py` | `assets/cards/honey/` |

#### T16 Fishing

```
Draw a new stamp set "Fishing Gear" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) wooden fishing rod with a reel and a curved line; (2) spinning fishing reel; (3) red-and-white fishing float with a thin antenna on top.
Row 2: (4) landing net with a wooden handle; (5) open green tackle box with small colourful lures in trays; (6) wicker fishing creel basket with a leather strap.
Row 3: (7) small metal bait bucket with a lid; (8) shiny metal spoon lure shaped like a teardrop with a tiny feather; (9) THEME ICON: a simple fishing rod with a bent line, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: fish or any sea animals, worms, boats, hats, boots, people or hands, text.
```

#### T17 Picnic

```
Draw a new stamp set "Picnic" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) closed wicker picnic hamper with leather straps; (2) open picnic hamper lined with red gingham cloth, empty; (3) rolled-up gingham picnic blanket tied with a strap.
Row 2: (4) thermos flask with a cup lid; (5) small blue cooler box; (6) wooden picnic table with two benches.
Row 3: (7) folding wooden camp stool; (8) stacked round metal lunch tins with a carrying handle; (9) THEME ICON: a simple picnic hamper, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: any food (bread, fruit, sandwiches, cakes), any drinks or bottles, wine, kites, hats, people.
```

#### T18 Painting

```
Draw a new stamp set "Painting Supplies" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) wooden artist palette with paint blobs and a thumb hole; (2) glass jar holding several paintbrushes; (3) small wooden easel with a blank canvas.
Row 2: (4) three squeezed paint tubes in red, blue and yellow; (5) open watercolour tin with colour pans; (6) flat brush finishing a colourful paint stroke.
Row 3: (7) small paint can with a drip running down the side; (8) framed landscape painting of hills and a sun in a gold frame; (9) THEME ICON: a simple palette with one brush, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: pencils, pens, crayons, notebooks, knives or palette knives, berets, people or hands, text.
```

#### T19 Stationery

```
Draw a new stamp set "Stationery" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) yellow pencil with a pink eraser tip; (2) fountain pen next to a small ink bottle; (3) pink eraser block.
Row 2: (4) small metal pencil sharpener; (5) a few colourful paper clips; (6) red stapler.
Row 3: (7) spiral notebook with a plain cover; (8) zipped pencil case; (9) THEME ICON: a simple pencil, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: envelopes, postage stamps, letters or postcards, scissors or cutters, paintbrushes or paint, rulers or tape measures, writing, faces.
```

#### T20 Wooden Toys

```
Draw a new stamp set "Wooden Toys" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with natural wood tones, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) stack of three wooden toy blocks showing simple shapes (star, heart, circle), no letters; (2) wooden spinning top; (3) wooden yo-yo with its string.
Row 2: (4) wooden stacking ring tower; (5) wooden shape-sorter box with shape holes; (6) wooden abacus with coloured beads.
Row 3: (7) wooden cup-and-ball toy (kendama); (8) wooden rainbow arch stacker; (9) THEME ICON: a single wooden block with a star, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: trains, cars, planes, boats, horses or rocking horses, animals, chess pieces, kites, dolls or faces, toy weapons, letters or numbers on blocks.
```

#### T21 Honey

```
Draw a new stamp set "Honey and Bees" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) glass honey jar with a cloth lid and a wooden dipper; (2) piece of golden honeycomb with a drip; (3) wooden honey dipper with honey dripping.
Row 2: (4) straw beehive skep; (5) white wooden beehive box; (6) slim glass honey bottle with a cork.
Row 3: (7) one big golden honey drop; (8) one cute round bee with soft stripes and small wings (no face); (9) THEME ICON: a simple honey jar with a dipper, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: more than one bee, other insects, flowers, bears, ceramic pots or vases, juice glasses, faces, text.
```

### Chat 3B: chương 10–11 (6 ảnh). **Đính kèm ở T22:** `REF-CAT`, `REF-TOPIC`. Ở T22, đổi câu "reference images earlier in this chat" thành "attached reference images".

| Mã | Chủ đề | Ch | Tải về | Lệnh cắt | Đích |
|---|---|---|---|---|---|
| T22 | Fireworks / Pháo hoa | 10 | `lpo_topic_fireworks.png` | `mv ~/Downloads/lpo_topic_fireworks.png research/art-redo/gen/ && python3 tools/art_slice.py topic fireworks research/art-redo/gen/lpo_topic_fireworks.png --apply && python3 tools/icon_line.py` | `assets/cards/fireworks/` |
| T23 | Mask / Mặt nạ hội | 10 | `lpo_topic_mask.png` | `mv ~/Downloads/lpo_topic_mask.png research/art-redo/gen/ && python3 tools/art_slice.py topic mask research/art-redo/gen/lpo_topic_mask.png --apply && python3 tools/icon_line.py` | `assets/cards/mask/` |
| T24 | Bell / Chuông | 10 | `lpo_topic_bell.png` | `mv ~/Downloads/lpo_topic_bell.png research/art-redo/gen/ && python3 tools/art_slice.py topic bell research/art-redo/gen/lpo_topic_bell.png --apply && python3 tools/icon_line.py` | `assets/cards/bell/` |
| T25 | Weather / Thời tiết | 11 | `lpo_topic_weather.png` | `mv ~/Downloads/lpo_topic_weather.png research/art-redo/gen/ && python3 tools/art_slice.py topic weather research/art-redo/gen/lpo_topic_weather.png --apply && python3 tools/icon_line.py` | `assets/cards/weather/` |
| T26 | Origami / Giấy gấp | 11 | `lpo_topic_origami.png` | `mv ~/Downloads/lpo_topic_origami.png research/art-redo/gen/ && python3 tools/art_slice.py topic origami research/art-redo/gen/lpo_topic_origami.png --apply && python3 tools/icon_line.py` | `assets/cards/origami/` |
| T27 | Keys / Chìa khóa | 11 | `lpo_topic_keys.png` | `mv ~/Downloads/lpo_topic_keys.png research/art-redo/gen/ && python3 tools/art_slice.py topic keys research/art-redo/gen/lpo_topic_keys.png --apply && python3 tools/icon_line.py` | `assets/cards/keys/` |

#### T22 Fireworks

Pháo hoa nở được đặt trên một **đĩa tròn trời đêm** để giữ hình khối (tia mảnh trên nền trong suốt khó cắt) và để khác hoa (cặp đề xuất Fireworks ↔ Flower).

```
Draw a new stamp set "Fireworks" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Bursts are drawn as chunky shapes on a small round navy night-sky disc with a brown outline, so the whole object is one solid round sticker.
Row 1: (1) red round firework burst on a navy disc; (2) blue star-shaped burst on a navy disc; (3) pink heart-shaped burst on a navy disc.
Row 2: (4) firework rocket on a stick with a short spark trail; (5) sparkler with little star-shaped sparks; (6) striped cardboard firework tube with a few sparks on top.
Row 3: (7) spinning pinwheel firework on a stick with sparks around it; (8) gold weeping-willow burst on a navy disc; (9) THEME ICON: a simple eight-ray burst, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: flowers or dandelions, explosions, bombs, strings of firecrackers, smoke clouds, fire, people.
```

#### T23 Mask

```
Draw a new stamp set "Festival Masks" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front view. All masks are friendly and cheerful, never scary.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) gold Venetian eye mask with one tall feather; (2) purple masquerade mask on a stick; (3) pair of smiling and sad theatre masks, gentle and cute.
Row 2: (4) cute red-and-gold lion-dance head; (5) white fox festival mask with red markings; (6) colourful carnival mask with sequins and three feathers.
Row 3: (7) blue butterfly-shaped eye mask; (8) silver half-face mask with swirl patterns; (9) THEME ICON: a simple eye mask, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: glasses or sunglasses shapes, scary or horror masks, skulls, bells, hats, people wearing the masks, text.
```

#### T24 Bell

```
Draw a new stamp set "Bells" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) brass handbell with a wooden handle; (2) big bronze tower bell hanging from a short wooden beam; (3) silver bicycle bell.
Row 2: (4) brass service desk bell; (5) two jingle bells tied with a red ribbon; (6) shop door bell on a curly iron bracket.
Row 3: (7) cowbell on a leather strap; (8) glass wind chime bell with a blank paper strip; (9) THEME ICON: a simple bell, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: musical instruments, music notes, sound waves, Christmas trees, faces, text.
```

#### T25 Weather

```
Draw a new stamp set "Weather" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front view. Calm, pleasant weather only.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) sun peeking out from behind a white cloud, with short rays; (2) grey rain cloud with three raindrops; (3) rainbow arching over two small clouds.
Row 2: (4) one big fluffy white cloud; (5) light-blue wind swirl lines; (6) vintage glass thermometer on a wooden board.
Row 3: (7) rooster weather vane on a pole with a plain arrow (no letters); (8) striped orange windsock on a pole; (9) THEME ICON: a simple sun behind a cloud, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: snowflakes, snowmen, umbrellas, lightning, storms, tornadoes, moons, stars or planets, faces on the sun or clouds, letters.
```

#### T26 Origami

```
Draw a new stamp set "Origami" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel paper colours with clear crisp folds, one soft shading layer and one small highlight, chunky cute proportions, front or slight three-quarter view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight.
Row 1: (1) pink paper crane; (2) orange paper fox; (3) green paper frog.
Row 2: (4) white paper rabbit; (5) red paper heart; (6) lilac paper lotus flower.
Row 3: (7) yellow-and-blue paper fortune teller (cootie catcher); (8) eight-pointed modular paper star; (9) THEME ICON: a simple paper crane, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: paper boats, paper planes, real animals with fur, eyes or faces, writing on the paper.
```

#### T27 Keys

```
Draw a new stamp set "Keys" for the cozy mobile game Little Post Office, in exactly the same style as the reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours, one soft shading layer and one small highlight, chunky cute proportions, front view.
Layout: square image, 3x3 grid, one object centred in each cell with clear empty space around it. Objects must not touch each other or cross into neighbouring cells. No grid lines, no frames, no text, letters or numbers anywhere. Transparent background (if not possible: plain flat light grey #D6D9DC). Each object must be recognisable at 60 px and clearly different in silhouette or main colour from the other eight. Draw every key large and thick so it reads at small size.
Row 1: (1) ornate brass skeleton key; (2) old dark-iron key with a round bow; (3) modern silver house key.
Row 2: (4) key ring holding three different keys; (5) key with a blank paper tag on a string; (6) golden key with a heart-shaped bow.
Row 3: (7) small key with a blue enamel bow; (8) brass keyhole plate with a key inserted; (9) THEME ICON: a simple old key, drawn simpler than the others: thick dark-brown outline, cream fill, at most one accent colour, flat, no face, few details, must read at 48 px.
Do not draw: padlocks, chests or treasure, doors, cars, text on the tag.
```

---

## 5. Đợt 4 (14 ảnh): decor và bưu thiếp chương 5–11

### Chat 4A: decor chương 5–8 (4 ảnh). **Đính kèm ở D5:** `REF-DECOR`, `REF-PIP`. Ở D5, đổi câu "decoration sheet and reference images earlier in this chat" thành "attached decoration sheet and reference images".

Mọi lưới decor dùng chung đoạn mở đầu và layout như D4. Mỗi prompt vẫn ghi đủ.

#### D5. Ga Tàu (mùa xuân)

Tải về `lpo_decor_ch5.png`. Đổi so với plan: "ghế băng" thành tranh cổ động du lịch (ghế băng là đồ sàn). Ghế băng vẫn được vẽ ở ô dư, nếu muốn dùng thì thay.

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Train Station" (spring), in exactly the same style as the decoration sheet and reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with fresh spring tones, one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip, same as before.
Layout: square image. Row 1 is ONE object centred across the whole row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: a round double-sided station clock hanging from an ornate iron ceiling bracket (clock faces without numbers, simple tick marks).
Row 2: (4) a green railway signal lamp with red and green lenses; (5) a small wooden departure board with flip tiles showing simple train and clock symbols (no words, no numbers); (6) a framed travel poster of a steam train crossing a green hill (no text).
Row 3: (7) two old leather suitcases stacked upright with straps; (8) Pip sleeping on top of a vintage suitcase; (9) a short wooden station bench with iron armrests.
```

```
mv ~/Downloads/lpo_decor_ch5.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch5.png -,decor/station_clock,-,decor/signal_lamp,decor/departure_board,decor/travel_poster,decor/old_suitcases,decor/suitcase_bed,decor/bench --apply
```

Gợi ý `CHAPTERS[4].decor`: `station_clock 2, signal_lamp 3, travel_poster 4, old_suitcases 4, departure_board 5, suitcase_bed 6`.

#### D6. Đảo Xa (mùa hè)

Tải về `lpo_decor_ch6.png`. Ô dư: decor hiếm theo tháng (plan 2.3, Could).

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Far Island" (summer), in exactly the same style as the decoration sheet and reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with sunny seaside tones, one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip, same as before.
Layout: square image. Row 1 is ONE wide object spanning the full width of the row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: a striped woven hammock hanging between two short ropes, empty, in a gentle curve.
Row 2: (4) a small desk globe on a wooden stand; (5) a small wall shelf holding a wooden sea chest with brass corners; (6) a potted cactus in a plain terracotta pot hanging in a macrame holder.
Row 3: (7) a tall model lighthouse, red and white, on a wooden base; (8) Pip sleeping curled up inside a big pink seashell; (9) a rare trophy decoration: a miniature golden postbox on a small pedestal with a tiny star on top.
```

```
mv ~/Downloads/lpo_decor_ch6.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch6.png -,decor/hammock@1200,-,decor/globe,decor/sea_chest,decor/cactus_pot,decor/lighthouse_model,decor/shell_bed,decor/rare_postbox --apply
```

Gợi ý `CHAPTERS[5].decor`: `hammock 2, globe 3, cactus_pot 4, lighthouse_model 4, sea_chest 5, shell_bed 6`. `rare_postbox` là decor hiếm theo tháng (thưởng 20 dấu ngày, plan mục 4).

#### D7. Chợ Phiên (mùa thu)

Tải về `lpo_decor_ch7.png`.

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Market Square" (autumn), in exactly the same style as the decoration sheet and reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with autumn market tones, one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip, same as before.
Layout: square image. Row 1 is ONE wide object spanning the full width of the row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: a short red-and-cream striped market awning valance with a scalloped edge.
Row 2: (4) a wicker basket hanging on a wall hook, with dried flowers; (5) a small chalkboard on an easel frame with simple chalk drawings of an apple, a loaf and a pear (no words, no numbers); (6) a brass balance scale on a small wall shelf.
Row 3: (7) a round basket of bread loaves covered with a cloth; (8) Pip sleeping on a plump flour sack; (9) Pip sitting on a folded flour sack, awake, as an alternative bed.
```

```
mv ~/Downloads/lpo_decor_ch7.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch7.png -,decor/awning@1200,-,decor/wicker_basket,decor/chalk_board,decor/brass_scale,decor/bread_basket,decor/flour_bed,decor/flour_bed_b --apply
```

Gợi ý `CHAPTERS[6].decor`: `awning 2, wicker_basket 3, brass_scale 4, bread_basket 4, chalk_board 5, flour_bed 6`.

#### D8. Bờ Hồ (mùa đông)

Tải về `lpo_decor_ch8.png`. Đổi so với plan: "đèn bão nhỏ" thành giày trượt băng treo, vì chương 2 đã có `decor/lantern` (đèn bão). Đèn bão vẫn được vẽ ở ô dư.

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Lakeside" (winter), in exactly the same style as the decoration sheet and reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with calm winter lake tones, one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip, same as before.
Layout: square image. Row 1 is ONE wide object spanning the full width of the row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: two wooden fishing rods resting horizontally on three small wall pegs.
Row 2: (4) a pair of white ice skates hanging from a hook by their laces; (5) a framed painting of a calm frozen lake with pine trees and a small cabin; (6) a small wall shelf holding a closed wicker picnic basket.
Row 3: (7) a small wooden painter's easel with a little canvas; (8) Pip sleeping on a red gingham cushion; (9) a small brass storm lantern.
```

```
mv ~/Downloads/lpo_decor_ch8.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch8.png -,decor/fishing_rods@1200,-,decor/ice_skates,decor/lake_painting,decor/picnic_shelf,decor/easel,decor/gingham_bed,decor/storm_lantern --apply
```

Gợi ý `CHAPTERS[7].decor`: `fishing_rods 2, ice_skates 3, picnic_shelf 4, easel 4, lake_painting 5, gingham_bed 6`.

### Chat 4B: decor chương 9–11 (3 ảnh). **Đính kèm ở D9:** `REF-DECOR`, `REF-PIP`. Ở D9, đổi câu "decoration sheet and reference images earlier in this chat" thành "attached decoration sheet and reference images".

#### D9. Đồi Cối Xay Gió (mùa xuân)

Tải về `lpo_decor_ch9.png`. Đổi so với plan: "bình hoa dại" thành dây hoa dại khô (cần một món treo ngang). Bình hoa vẫn được vẽ ở ô dư.

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Windmill Hill" (spring), in exactly the same style as the decoration sheet and reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with fresh spring meadow tones, one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip, same as before.
Layout: square image. Row 1 is ONE wide object spanning the full width of the row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: a garland of dried wildflowers (lavender, yellow and white blossoms) tied along a twine string, hanging in a gentle curve.
Row 2: (4) a ceramic cup full of coloured pencils on a tiny wall shelf; (5) a small wooden bookshelf with colourful books and a tiny plant; (6) a small wooden rocking horse on a wall shelf.
Row 3: (7) a tall model windmill with four sails on a wooden base; (8) Pip sleeping in a basket of old books; (9) a small glass vase of fresh wildflowers.
```

```
mv ~/Downloads/lpo_decor_ch9.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch9.png -,decor/flower_garland@1200,-,decor/pencil_cup,decor/bookshelf,decor/rocking_horse,decor/windmill_model,decor/book_bed,decor/wildflower_vase --apply
```

Gợi ý `CHAPTERS[8].decor`: `flower_garland 2, pencil_cup 3, rocking_horse 4, windmill_model 4, bookshelf 5, book_bed 6`.

#### D10. Quảng Trường Lễ Hội (mùa hè)

Tải về `lpo_decor_ch10.png`.

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Festival Square" (summer), in exactly the same style as the decoration sheet and reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with cheerful festival tones, one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip, same as before.
Layout: square image. Row 1 is ONE wide object spanning the full width of the row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: a string of colourful round festival lanterns and small triangle flags on one cord, hanging in a gentle curve.
Row 2: (4) two friendly festival masks hanging on a wall nail with ribbons; (5) a wooden music box with its lid open and a tiny dancer silhouette, on a small wall shelf; (6) a brass shop door bell on a curly iron bracket.
Row 3: (7) a tall festival flag on a wooden pole standing in a small stand; (8) Pip sleeping on a cushion, wearing a tiny striped party hat; (9) Pip on the same cushion awake and smiling softly, wearing the party hat, as an alternative.
```

```
mv ~/Downloads/lpo_decor_ch10.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch10.png -,decor/festival_lights@1200,-,decor/masks,decor/music_box,decor/door_bell,decor/flag_stand,decor/party_bed,decor/party_bed_b --apply
```

Gợi ý `CHAPTERS[9].decor`: `festival_lights 2, masks 3, door_bell 4, flag_stand 4, music_box 5, party_bed 6`.

#### D11. Đồi Mây (mùa thu)

Tải về `lpo_decor_ch11.png`.

```
Draw a set of room decorations for the cozy mobile game Little Post Office, chapter "Cloud Hill" (autumn), in exactly the same style as the decoration sheet and reference images earlier in this chat: sticker-style objects with a warm dark-brown outline (#5a3a26, never black), soft warm pastel colours with airy sky tones, one soft shading layer and one small highlight, chunky cute proportions, front view. The orange tabby cat is Pip, same as before.
Layout: square image. Row 1 is ONE wide object spanning the full width of the row. Rows 2 and 3 are 3 cells each, one object centred per cell, objects do not touch. No grid lines, no text, letters or numbers. Transparent background (if not possible: plain flat light grey #D6D9DC). No background scenery, no floor; each object stands alone.
Row 1: a string of colourful paper cranes hanging from one cord in a gentle curve.
Row 2: (4) a small wooden key-hook board with three keys hanging; (5) a yellow raincoat hanging from a wooden wall peg; (6) a vintage brass-and-wood wall thermometer.
Row 3: (7) a colourful paper pinwheel standing in a small pot; (8) Pip sleeping on a fluffy cloud-shaped pillow; (9) Pip curled on the same cloud pillow from a different angle, as an alternative.
```

```
mv ~/Downloads/lpo_decor_ch11.png research/art-redo/gen/
python3 tools/art_slice.py paths research/art-redo/gen/lpo_decor_ch11.png -,decor/crane_string@1200,-,decor/key_hooks,decor/raincoat_peg,decor/thermometer,decor/pinwheel_pot,decor/cloud_bed,decor/cloud_bed_b --apply
```

Gợi ý `CHAPTERS[10].decor`: `crane_string 2, key_hooks 3, thermometer 4, pinwheel_pot 4, raincoat_peg 5, cloud_bed 6`.

### Chat 4C và 4D: bưu thiếp chương 5–11 (7 ảnh)

**Chat 4C** (C5–C8) và **chat 4D** (C9–C11): đính kèm `REF-CARD` ở lệnh đầu mỗi chat. Ở lệnh đầu chat, đổi câu "the postcard earlier in this chat" thành "the attached postcard". Mọi prompt có chung khung sau, chỉ thay dòng `Scene`:

```
Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2.
Scene <SCENE>
No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.
```

Dưới đây là prompt đầy đủ đã thay sẵn:

| Mã | Tải về | Prompt (copy cả ô) | Lệnh cắt → đích |
|---|---|---|---|
| C5 | `lpo_postcard_ch5.png` | `Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2. Scene "Train Station" in spring: a small countryside railway station with a red-tiled roof and a platform clock, a cheerful little steam train in green and cream waiting at the platform with a soft white puff, cherry trees in pink bloom, tulips along the fence, gentle green hills behind. No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.` | `python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch5.png ch5 --apply` → `assets/ch5/postcard.jpg` |
| C6 | `lpo_postcard_ch6.png` | `Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2. Scene "Far Island" in summer: a small sunny island with a white sandy beach, a red-and-white lighthouse on the rocks, a few palm trees and round cacti, turquoise sea with gentle waves, a wooden jetty, a tiny cottage with a blue door, bright summer sky with puffy clouds. No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.` | `python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch6.png ch6 --apply` → `assets/ch6/postcard.jpg` |
| C7 | `lpo_postcard_ch7.png` | `Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2. Scene "Market Square" in autumn: a cobblestone town square with market stalls under red-and-cream striped awnings, baskets of bread, wheels of cheese, pumpkins and apples, clay pots on a table, a little fountain, old houses with flower boxes, trees in golden leaves. No people, no animals in the foreground, no bottles, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.` | `python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch7.png ch7 --apply` → `assets/ch7/postcard.jpg` |
| C8 | `lpo_postcard_ch8.png` | `Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2. Scene "Lakeside" in winter: a calm frozen lake surrounded by snowy pine trees, a small wooden cabin with warm lit windows and a chimney, a little wooden dock with a rowing boat pulled onto the snow, a painter's easel standing by the shore, a soft pink winter sunset. No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.` | `python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch8.png ch8 --apply` → `assets/ch8/postcard.jpg` |
| C9 | `lpo_postcard_ch9.png` | `Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2. Scene "Windmill Hill" in spring: green rolling hills covered in wildflowers, two old windmills with white sails on the hilltop, a row of wooden beehives at the edge of a meadow, a winding dirt path with a little wooden bridge over a stream, a bright spring sky. No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.` | `python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch9.png ch9 --apply` → `assets/ch9/postcard.jpg` |
| C10 | `lpo_postcard_ch10.png` | `Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2. Scene "Festival Square" on a summer evening: a lively town square decorated with strings of round lanterns and colourful flags, a small bandstand with a striped roof, gentle pastel fireworks blooming in the deep blue dusk sky, warm light from the houses around. No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.` | `python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch10.png ch10 --apply` → `assets/ch10/postcard.jpg` |
| C11 | `lpo_postcard_ch11.png` | `Paint another picture-postcard landscape in exactly the same painted storybook style as the postcard earlier in this chat: soft painterly shapes, warm light, gentle colours, cozy and calm. Landscape 3:2. Scene "Cloud Hill" in autumn: a high grassy hilltop above a soft sea of clouds, a small cottage with a rooster weather vane and a windsock, a few paper kites and paper cranes floating in the breeze, trees in amber and red, a wide calm sky at golden hour. No people, no animals in the foreground, no text, no letters, no stamps, no border or frame: the image fills the whole canvas.` | `python3 tools/art_slice.py postcard research/art-redo/gen/lpo_postcard_ch11.png ch11 --apply` → `assets/ch11/postcard.jpg` |

Trước mỗi lệnh cắt: `mv ~/Downloads/lpo_postcard_chN.png research/art-redo/gen/`.

---

## 6. Sau khi cắt: ai làm gì

| Việc | Ai | Ghi chú |
|---|---|---|
| Chạy ChatGPT theo thứ tự đợt 1 → 4, tải đúng tên file | Người điều phối | Mỗi chat tối đa 6 ảnh. Chỉ đính kèm ở lệnh đầu chat |
| Chạy lệnh cắt, xem `preview_<slug>.jpg`, làm test 3 giây ở cỡ lá thật (1.4) | Người điều phối | Hỏng thì vẽ lại theo 1.5 |
| Nén PNG bằng pngquant | Người điều phối | 1.4 bước 5 |
| Sinh lại chương có art mới (chủ đề có ≥ 5 tem và `icon_line.png` tự thay `fallback`) | Level Dev | `tools/level_spec.mjs`, `tools/gen_levels.mjs` |
| Xem xét các cặp `CONFUSE` đề xuất ở 1.7 | Level Dev | Sau khi có ảnh thật |
| Thêm `CHAPTERS[].decor` chương 3–11 và CSS `.dc-<id>` theo 6 chỗ đặt | Feature Dev | Dùng gợi ý ở từng lưới decor |
| Đổi CSS nền sang `bg_*_tall.jpg` (1080×2400), hệ nút mới, icon màn chính, sprite hạt `fx/`, túi thư màn thắng | Feature Dev | P3, P5, P6, P9, P11 trong benchmark |
| Màn "Chương N sắp mở" đọc `assets/chN/postcard.jpg` | Feature Dev | Hiện `index.html` đang gắn cứng `ch2` |
| Chép tên tiếng Việt chủ đề vào `copy.js` (nhãn album) | Feature Dev | Tên đã có trong `CHAPTER_TOPICS` của `level_spec.mjs` |

**Đã chuẩn bị sẵn trong repo:**
- `research/art-redo/grid_map.json`: thêm 27 slug, map `[0, 1, 2, 3, 4, 5, 6, 7, "icon"]`.
- `prototype/stamp/assets/manifest.json`: thêm 27 khoá (`{"dir": "cards/<slug>", "arts": 8}`), chỉ thêm, không đổi khoá cũ. Thêm trước không làm hỏng gì: `level_rules.mjs` chỉ nhận chủ đề có art và `icon_line.png` (vẫn 61 chủ đề nền), `main.js` chỉ tải file, không duyệt khoá. 14/14 test `level_spec.test.mjs` vẫn qua.
- `tools/art_slice.py`: thêm `--grid`, hậu tố `@N`/`@WxH`, `postcard`, `bg`. `--no-icon` bỏ đúng ô icon. Tự tạo thư mục mới khi `--apply`.
- `tools/art_take.sh`: chủ đề mới (không có lưới mẫu APK) thì cắt cả icon, chạy `icon_line.py`, làm ảnh xem nhanh ở cỡ lá thật.
