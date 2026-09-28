# GDD Core: Little Post Office (stampsort)

**Tác giả:** game-designer agent · **Ngày:** 2026-09-28 · **Trạng thái:** bản 1, đủ để code prototype; mọi số gắn `[GIẢ THUYẾT]` phải playtest, giá/số coin do PO chốt.

**Nguồn:** đây là thiết kế riêng. Chỗ nào kế thừa template Solitaire Associations ghi `[STORE]` kèm mục trong `teardown-stamp-solitaire.md`; fiction lấy từ `concept-little-post-office.md` mục 4. Luật level (tham số, generator, curve) ở `level-design-rules.md`.

---

## 0. Thuật ngữ thống nhất

| Code (EN) | Fiction VN | Fiction EN | Ghi chú |
|---|---|---|---|
| `Card` (Stamp) | Lá thư | Letter | `categoryId`, `artId`, `faceUp` |
| `Category` | Loại thư (bộ tem của một cư dân) | Mail type | Mỗi card thuộc đúng 1 category |
| `Tableau` / `Column` | Bàn phân loại / Chồng thư | Sorting desk / Pile | Stack, chỉ top card tương tác |
| `Deck` / `Waste` | Bao thư đến / Thư đang cầm | Mailbag / In hand | Rút 1 lá/lần |
| `Slot` | Hộc thư | Pigeonhole | 4 hộc, category ẩn tới khi đặt card đầu |
| `Deliver` (slot complete) | Giao thư | Delivery | Khoảnh khắc satisfying chính |
| `Moves` | Giờ làm | Working hours | Đồng hồ của Finch trên HUD |
| `OutOfMoves` | Thư bị trễ | Mail's late | Không dùng chữ "thua"/"fail" |
| `Undo` | Return to Sender | | 3 free/level |
| `Hint` | Pip chỉ đường | | Pip ngồi lên card nên đi |
| `Joker` | Tem vàng (của Otto) | Golden stamp | |
| `Shuffle` | Lắc bao thư | | Phase 2 |
| `ExtraMoves` | Ca tối | Night shift | +5 moves, rewarded ad |
| `PreBoost.Coffee` | Cà phê sáng | Morning coffee | +3 moves trước level |
| `PreBoost.EarlyPip` | Pip trực sớm | | Mở sẵn 1 hộc, Phase 2 |
| `Stars` | Dấu bưu điện (1-3) | Postmarks | Quy ra Tem Điểm cho decor |

---

## 1. Mục tiêu level, thắng, thua

| Mục | Luật |
|---|---|
| Mục tiêu | **Giao hết thư**: mọi card của level vào đúng hộc |
| Thắng | `tableau`, `deck`, `waste` đều rỗng. Kiểm tra thắng **trước** kiểm tra hết moves (đặt lá cuối khi moves 1→0 vẫn thắng) |
| Thư bị trễ | `moves == 0` và còn card. Hiện popup "Thư bị trễ" (mục 7) |
| Lives | **Không có lives.** Thua không mất gì ngoài thời gian; retry ngay, không chờ hồi |
| Thời lượng | Mục tiêu 1-3 phút/level `[GIẢ THUYẾT]` |
| Retry | Chơi lại **cùng layout** (cùng `seed`): card úp ở vị trí cũ, thất bại thành thông tin, đúng fiction "mai giao tiếp" `[GIẢ THUYẾT]`, so với re-seed ở playtest |

**Vì sao không lives:** pillar P4; ABI cũng không thấy bằng chứng có lives (`teardown` mục 5 `[GIẢ THUYẾT]`); tension đã đủ từ moves + card úp; lives đẩy người chơi cozy ra khỏi session thay vì retry.

---

## 2. Thành phần bàn chơi

### 2.1 Card
- `id`, `categoryId`, `artId` (1..K trong bộ), `faceUp: bool`.
- Card úp không đọc được. Card ngửa phải nhận ra category trong 2 giây ở 120 px (Gate G3, `positioning` mục 4).

### 2.2 Tableau
- `numColumns` cột (2-6), mỗi cột là stack, index 0 = đáy, cuối = top.
- Chỉ **top card** tương tác được (kéo lên hộc hoặc sang cột khác).
- Card úp **tự lật** ngay khi trở thành top, **0 move**. Deck không chứa card úp.
- Cột rỗng là hợp lệ; card nào cũng đặt được vào cột rỗng.

### 2.3 Deck + Waste
- Deck úp, tap = rút 1 card lên waste (ngửa). Chỉ **top của waste** tương tác được; rút thêm sẽ chôn card trước đó.
- Deck rỗng + tap = **recycle**: toàn bộ waste lật lại thành deck, **giữ nguyên thứ tự** (card rút trước lại rút trước), **0 move, không giới hạn số lần**. Chi phí của deck nằm ở move mỗi lần rút và ở việc rút = chôn thư đang cầm (`[STORE]` teardown 3.1); không giới hạn vòng để tránh dead end nhân tạo (P4).
- Waste top **không** được đặt sang cột tableau, chỉ vào hộc `[GIẢ THUYẾT]`: deck là áp lực riêng, solver đơn giản.

### 2.4 Slot (hộc thư)
- `activeSlots = min(4, numCategories)` (level 1-3 có 2-3 hộc, từ level 4 luôn 4).
- Trạng thái: `Closed` (rỗng, không có category, mặt hộc trống) → `Open{categoryId, count, target}` → khi `count == target` thì **Deliver** (animation Pip/xe đẩy mang thư, portrait cư dân cười) và hộc **trở về `Closed`**, sẵn sàng nhận category mới.
- `target` = số card thực của category đó trong level. Generator luôn làm bằng `K` (`level-design-rules.md` mục 1); runtime dùng số thực để không bao giờ kẹt (mục 8.4).
- Hộc `Open` hiển thị portrait + tên cư dân + `count/target`. Hộc `Closed` không tiết lộ gì.
- Một category chỉ chiếm **một** hộc tại một thời điểm.
- Khi `numCategories > 4`: hộc là tài nguyên; phải giao xong một hộc mới nhận loại thư mới. Đây là **quyết định có ý nghĩa** chính của core (mở loại nào trước).

### 2.5 HUD
- Đồng hồ moves (số còn lại), 2 mốc sao dưới đồng hồ (`starThresholds`, mục 5), nút Undo (kèm số lần free còn), nút Hint, nút Joker (số lượng), nút Shuffle (Phase 2).

---

## 3. Luật đặt card và các action

| Action | Nguồn → Đích | Điều kiện hợp lệ | Move |
|---|---|---|---|
| `PLACE` | top cột / top waste → hộc `Open` | `card.categoryId == slot.categoryId` | 1 |
| `OPEN` | top cột / top waste → hộc `Closed` | Không có hộc `Open` nào cùng category (nếu có, redirect sang hộc đó thành `PLACE`) | 1 |
| `MOVE_COLUMN` | top cột A → cột B (A ≠ B, kể cả rỗng) | Luôn hợp lệ. Không ràng buộc category `[GIẢ THUYẾT]` | 1 |
| `DRAW` | deck → waste | deck còn card | 1 |
| `RECYCLE` | waste → deck | deck rỗng và waste còn card | 0 |
| `FLIP` | tự động | card úp thành top | 0 |

**Đặt sai category vào hộc `Open`: không cho phép, không tốn move.** Card bay về chỗ cũ, hộc rung nhẹ, không âm "lỗi". Lý do (P1 "sort, đừng đoán"): đặt sai chỉ là đọc nhầm hình, không phải quyết định; phạt sẽ đẩy người chơi sang thử-sai kiểu trivia (`teardown` mục 9). Quyết định có chi phí thật là `OPEN` (loại thư nào chiếm hộc) và `MOVE_COLUMN`/`DRAW` (đào thư).

**Tap vs drag:** tap card = tự `PLACE` vào hộc `Open` cùng category, không có thì card lắc nhẹ; tap **không bao giờ** tự `OPEN`. `OPEN` và `MOVE_COLUMN` phải drag, vì mở hộc là quyết định, không được xảy ra vô tình.

**`MOVE_COLUMN` không ràng buộc:** với ≥ 2 cột, mọi card đều đào được nếu đủ moves → level **không dead end về cấu trúc**, chỉ hết moves (8.1). Biến thể kiểu Ball Sort (chỉ đặt lên card cùng category hoặc cột rỗng) để playtest sau MVP `[GIẢ THUYẾT]`: sâu hơn nhưng với card úp dễ thành may rủi.

---

## 4. Moves và booster

Move đếm **theo action** (bảng mục 3): mỗi `PLACE`/`OPEN`/`MOVE_COLUMN`/`DRAW` = 1. `RECYCLE`, `FLIP`, mọi booster = 0.

| Booster | Fiction | Hiệu ứng chính xác | Nguồn | Giới hạn/level | Gợi ý khi nào | MVP |
|---|---|---|---|---|---|---|
| **Undo** | Return to Sender | Khôi phục **snapshot** trạng thái trước action gần nhất (kể cả `faceUp`, moves +1). Không undo qua mốc **Deliver**, **Joker**, **Shuffle** (stack bị xoá tại các mốc này; nút xám, tooltip "Thư đã giao rồi") | 3 free/level; lần 4+ coin nhỏ | Không giới hạn thêm | Không gợi, nút luôn hiện | Có |
| **Hint** | Pip chỉ đường | Pip ngồi lên **1 card** và chỉ đích; theo thứ tự ưu tiên bên dưới; không tự thực hiện; không tốn move | Coin; 1 free tại level 3 (FTUE) | 3/level `[GIẢ THUYẾT]` | Sau 20 s không thao tác: Pip ngáp (không popup) | Có |
| **Joker** | Tem vàng | Chọn 1 hộc `Open` → kéo **card sâu nhất** của category đó (ưu tiên: card úp sâu nhất trong tableau → deck → waste → top card) bay vào hộc, 0 move. Nếu đủ target thì Deliver như thường. Không dùng được khi không có hộc `Open` (nút xám) | Coin / rewarded ad; Otto tặng 1 ở level 5 | 2/level `[GIẢ THUYẾT]` | Khi ≥ 2 hộc mở và có card của hộc mở nằm ở độ sâu ≥ 3 | Có |
| **Shuffle** | Lắc bao thư | Xáo ngẫu nhiên vị trí **các card úp** trong tableau với nhau + xáo deck; card ngửa giữ nguyên; 0 move; xoá undo stack. Kế thừa template `[STORE]` teardown 3.6 | Coin | 1/level | Không gợi | Phase 2 |
| **ExtraMoves** | Ca tối | +5 moves tại popup Thư bị trễ, chơi tiếp ngay | Lần 1: rewarded ad (hoặc coin); lần 2: coin | 2/level `[GIẢ THUYẾT]` | Popup Thư bị trễ; là **điểm rewarded ad duy nhất** (concept mục 4) | Có |
| **Coffee** | Cà phê sáng | Bắt đầu level với +3 moves | Coin | 1/level | Popup pre-level, sau 2 lần trễ liên tiếp cùng level | Có |
| **EarlyPip** | Pip trực sớm | Hộc 1 mở sẵn (`count 0`) với category đầu tiên trong lời giải của solver | Coin | 1/level | Như Coffee | Phase 2 |

**Vì sao Joker "kéo card sâu nhất" chứ không phải card wild:** card wild đếm vào target sẽ luôn dư 1 card thật không có hộc, phá điều kiện thắng "bàn sạch". Kéo card thật lên giữ luật đơn giản và luôn có giá trị tối đa. ABI mô tả Golden Stamp là "match vào bất kỳ category" (`[STORE]` teardown 3.3); ta khác ở đây.

**Thứ tự ưu tiên Hint** (prototype dùng heuristic): (1) `PLACE` hoàn thành hộc → (2) `PLACE` bất kỳ, ưu tiên cột che nhiều card úp nhất → (3) `OPEN` với category có nhiều card đang là top nhất, nếu còn hộc `Closed` → (4) `DRAW` nếu deck còn card chưa xem trong vòng này → (5) `MOVE_COLUMN` lộ card úp ở cột ngắn nhất. Không gợi `MOVE_COLUMN` khi còn `PLACE` hợp lệ.

---

## 5. Sao (dấu bưu điện)

- Có **3 sao**, tính theo **moves còn lại** khi thắng, so với mốc lưu sẵn trong level data: `starThresholds = {two: m2, three: m3}` (số moves còn lại tối thiểu). Generator tính từ slack `S = moveBudget − solverMoves`: `m3 = ceil(0.75·S)`, `m2 = ceil(0.4·S)` `[GIẢ THUYẾT]`. Ví dụ solver 28, budget 44 → S 16 → 3 sao khi còn ≥ 12, 2 sao khi còn ≥ 7.
- Thắng luôn ≥ 1 sao, kể cả sau Ca tối. Sao **không** gate tiến độ; chỉ quy ra Tem Điểm mở decor (`concept` mục 5) và là lý do replay nhẹ.
- Dùng slack thay vì % budget vì ở tier 5 budget chỉ 1.15× solver, % sẽ khiến 3 sao bất khả thi; slack giữ 3 sao luôn đạt được khi chơi gần tối ưu.
- Hai mốc hiển thị dưới đồng hồ; không popup nhắc.

---

## 6. Kinh tế trong level (MVP tối thiểu, PO chốt số)

| Khoản | Đề xuất `[GIẢ THUYẾT]` | Ghi chú cho PO |
|---|---|---|
| Coin khởi đầu | 150 | Đủ 1 Joker + 1 Hint để nếm |
| Coin thắng level | 20 + 10 × (sao − 1) → 20/30/40 | Không có "double reward ad" ở MVP (giữ P4) |
| Undo lần 4+ | 10 | Sink nhỏ, không bao giờ chặn |
| Hint | 25 | |
| Joker | 60 hoặc 1 rewarded ad | Booster bán chính |
| Ca tối | lần 1: ad hoặc 90; lần 2: 90 | Điểm chuyển đổi chính |
| Cà phê sáng | 40 | |
| Shuffle | 40 | Phase 2 |

Nguyên tắc: thắng 1 sao phải **tự nuôi được** 1 Hint mỗi 2 level; Joker và Ca tối là chỗ thiếu coin thật sự. PO mô phỏng faucet/sink bằng win rate ở `level-design-rules.md` mục 6.

---

## 7. Flow một level

```
Map/Town ──▶ PreLevel ──▶ Playing ──┬─▶ Win ──▶ (Map, next level)
                ▲                   └─▶ OutOfMoves ──┬─▶ Ca tối ──▶ Playing (moves +5)
                └────── "Mai giao tiếp" (retry, cùng seed) ◀──┘
                                                     └─▶ Về thị trấn (không phạt)
```

| Màn | Nội dung | Nút |
|---|---|---|
| **PreLevel** | "Ngày N ở bưu điện", số hộc, moves, 2 mốc sao, ô chọn Cà phê sáng (và Pip trực sớm Phase 2); portrait cư dân **không** hiện (category ẩn) | Bắt đầu |
| **Playing** | Board; 1 dòng flavor ngắn của Otto ở level 1-5 (FTUE, `concept` mục 6) | HUD |
| **Deliver** (trong Playing) | Animation ≤ 1.2 s, không chặn input sau 0.4 s; haptic nhẹ | – |
| **Win** | (1) bó thư cuối bay đi, (2) 1-3 dấu bưu điện đóng "cộp", (3) 1 câu flavor của cư dân vừa được giao (`concept` 3.3, tap bỏ qua), (4) coin + tem rơi vào album, (5) mở decor/chapter thì màn riêng | Tiếp tục · Về thị trấn |
| **OutOfMoves** | Xe đẩy quay về; "Thư bị trễ, mai giao tiếp nhé." Không chữ "thua", không đếm ngược | **Ca tối +5** (ad/coin) · **Mai giao tiếp** (retry) · Về thị trấn |

Không interstitial ở bất kỳ điểm nào (P4).

---

## 8. Edge cases

| # | Tình huống | Xử lý |
|---|---|---|
| 8.1 | Deck + waste rỗng, không `PLACE` hợp lệ | Không phải dead end: `MOVE_COLUMN` luôn khả thi khi ≥ 2 cột (generator bắt buộc). Thua chỉ khi `moves == 0` |
| 8.2 | Joker khi cả 4 hộc đã mở | Chọn 1 trong 4 (hộc sáng lên, tap chọn, tap ngoài huỷ, không mất Joker). 0 hộc mở: nút xám |
| 8.3 | Undo sau Deliver | Không được: Deliver là **commit point**, undo stack xoá ("thư đã đi", không đảo animation). Undo vẫn dùng cho action **sau** Deliver |
| 8.4 | Category có ít hơn K card (lỗi data / biến thể sau) | `slot.target = số card thực của category`; hiển thị `count/target`. Generator MVP reject category ≠ K |
| 8.5 | `OPEN` khi category đó đã có hộc `Open` | Redirect thành `PLACE` vào hộc đó |
| 8.6 | Đặt lá cuối cùng khi moves = 1 | Kiểm tra thắng trước, thắng |
| 8.7 | `MOVE_COLUMN` qua lại vô hạn | Cho phép; chỉ tốn moves. Hint không bao giờ gợi |
| 8.8 | Joker khi category của hộc chỉ còn card đang là top | Kéo top đó (vẫn tiết kiệm 1 move) |
| 8.9 | Ca tối lần 3 | Không có; popup chỉ còn "Mai giao tiếp" |
| 8.10 | Recycle liên tục | Cho phép, 0 move; đếm `recycleCount` để tune |
| 8.11 | Thoát giữa level | Lưu snapshot, quay lại tiếp tục; không phạt |
| 8.12 | `numCategories < 4` (level 1-3) | `activeSlots = numCategories`, hộc thừa không hiển thị |

---

## 9. Dữ liệu level và action cho prototype

```json
{
  "id": 7, "tier": 1, "seed": 1007, "role": "normal",
  "k": 4, "activeSlots": 4,
  "categories": ["banh", "dongho", "hoaxuan", "chimse", "camoi"],
  "columns": [
    [{"cat": "banh", "art": 2, "faceUp": false}, {"cat": "chimse", "art": 1, "faceUp": true}],
    ...
  ],
  "deck": [{"cat": "camoi", "art": 3}, ...],
  "solverMoves": 28, "moveBudget": 44,
  "starThresholds": {"two": 7, "three": 12},
  "jokerGift": 0, "preOpenedSlot": null
}
```

- `columns[i][0]` là đáy, phần tử cuối là top; `deck[0]` là card rút đầu tiên.
- Bất biến khi load: mỗi `cat` có đúng `k` card; top mỗi cột `faceUp = true`; `numColumns ≥ 2`.
- Runtime state: `columns`, `deck`, `waste`, `slots[4]`, `movesLeft`, `undoLeft`, `undoStack[]` (snapshot), `jokers`, `extraMovesUsed`, `hintsUsed`, `recycleCount`.
- Action enum: `PLACE(src, slotIdx)`, `OPEN(src, slotIdx)`, `MOVE_COLUMN(from, to)`, `DRAW`, `RECYCLE`, `UNDO`, `HINT`, `JOKER(slotIdx)`, `SHUFFLE`, `EXTRA_MOVES`. `src` = `{col: i}` hoặc `{waste}`.
- Telemetry mỗi action: `levelId`, `attempt`, `action`, `movesLeft`, `t`.

---

## 10. Câu hỏi mở (playtest quyết)

1. Retry cùng seed có làm wall "quá dễ ở lần 2"? Đo win rate lần 2 ở level 18.
2. Có cho waste top đặt sang cột tableau không? (2.3)
3. `MOVE_COLUMN` không ràng buộc có làm mid-game thành "đào bừa"? Quit rate T3 cao → thử biến thể Ball Sort (mục 3).
4. K = 4 cố định hay K = 5 ở tier 5?
5. 3 undo free: đo % level dùng hết 3 undo để biết sink còn không.
