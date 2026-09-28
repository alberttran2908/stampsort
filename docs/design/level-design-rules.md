# Level design rules: Little Post Office (stampsort)

**Tác giả:** game-designer agent · **Ngày:** 2026-09-28 · **Trạng thái:** bản 1, đủ để viết generator + solver và dựng 20 level đầu. Luật chơi ở `gdd-core.md`; mọi số gắn `[GIẢ THUYẾT]` chờ playtest; số ở bảng level mẫu (mục 4) là **ước lượng tay**, generator ghi đè `solverMoves`/`moveBudget` khi chạy.

---

## 1. Tham số level

| Tham số | Ý nghĩa | Miền | Ghi chú |
|---|---|---|---|
| `numCategories` | Số loại thư trong level | 2-3 (level 1-3), 4-6 sau đó | > 4 tạo quyết định "mở hộc nào" (`gdd` 2.4); ≤ 6 vì readability (mục 5) |
| `k` (cardsPerCategory) | Số card mỗi category = target của hộc | **4 cố định** MVP | "Match 4" tạo nhịp Deliver dày (mỗi 4-6 move một lần). K = 5 chỉ thử ở tier 5 `[GIẢ THUYẾT]` |
| `numColumns` | Số cột tableau | 2-6, luôn ≥ 2 | ≥ 2 để `MOVE_COLUMN` luôn khả thi (`gdd` 8.1) |
| `cardsPerColumn` | Mảng số card mỗi cột | Chênh ≤ 1 giữa các cột | Tổng = `numCategories·k − deckSize` |
| `faceDownRatio` | Tỉ lệ card úp trong tableau | 0-0.6 | Card úp là phần **đáy** mỗi cột; top luôn ngửa; `faceDownCount = round(ratio·tableauCards)` chia đều từ cột dài nhất |
| `deckSize` | Số card trong deck | 0-12 | Ở tier ≥ 3 cho phép 1 category nằm hoàn toàn trong deck |
| `moveBudget` | Giờ làm | = `ceil(solverMoves × kTier)` | Mục 2.3 |
| `activeSlots` | Số hộc | `min(4, numCategories)` | |
| `jokerGift` | Số Tem vàng tặng đầu level | 0-1 | Level 5 và wall level |
| `tier` | 1-5 | Theo bảng mục 3 | Quyết định `kTier`, miền tham số |
| `role` | `tutorial / normal / bump / wall / breather / milestone` | | Điều chỉnh `kTier` và tham số (mục 3.2) |

---

## 2. Generator và solver

### 2.1 Chiến lược
**Sinh ngẫu nhiên rồi giải** (không reverse-construction): vì `MOVE_COLUMN` không ràng buộc nên mọi layout đều giải được khi đủ moves; bài toán chỉ là **đo `solverMoves`** đủ chặt để `moveBudget` công bằng. Solver có **full information** (biết card úp), người chơi thì không; chênh lệch này được bù bằng `kTier` (hệ số ≥ 1.15 chứ không phải 1.0).

### 2.2 Solver (A* với node limit, fallback greedy)

```python
# State: (cols, deck, waste, slots, moves_used); cols = tuple[tuple[card]], slots = tuple[(cat, count) | None]
def actions(s):
    for i, col in enumerate(s.cols):
        if col: yield from place_or_open(s, src=("col", i), card=col[-1])
    if s.waste: yield from place_or_open(s, src=("waste",), card=s.waste[-1])
    if s.deck: yield ("DRAW",)
    elif s.waste: yield ("RECYCLE",)            # 0 move
    for i, col in enumerate(s.cols):
        if col:
            for j in range(len(s.cols)):
                if i != j: yield ("MOVE_COLUMN", i, j)

def place_or_open(s, src, card):
    for si, slot in enumerate(s.slots):
        if slot and slot[0] == card.cat: yield ("PLACE", src, si); return
    for si, slot in enumerate(s.slots):
        if slot is None: yield ("OPEN", src, si); return   # chỉ 1 hộc rỗng, tránh đối xứng

def h(s):                                      # admissible lower bound
    remaining = sum(map(len, s.cols)) + len(s.deck) + len(s.waste)
    return remaining + len(s.deck)             # mỗi card ≥ 1 PLACE; mỗi card trong deck ≥ 1 DRAW

def solve(level, node_limit=200_000):
    # A*: f = g + h, ưu tiên mở rộng PLACE hoàn thành hộc > PLACE > OPEN > DRAW > MOVE_COLUMN
    # visited theo hash(state) bỏ moves_used; nếu vượt node_limit → greedy theo cùng thứ tự ưu tiên
    # trả về (path, len(path_costing_moves), exact: bool)
```

`solverMoves` = số action tốn move trên path tìm được. Nếu `exact=False` (greedy) thì đó là **cận trên**, budget hơi rộng, chấp nhận được; log lại để tune tay.

### 2.3 Generator

```python
def generate(p, seed):
    rng = Random(seed)
    cards = [Card(cat, art) for cat in p.categories for art in range(p.k)]
    for attempt in range(300):
        rng.shuffle(cards)
        deck, rest = cards[:p.deckSize], cards[p.deckSize:]
        cols = split_even(rest, p.numColumns, rng)          # chênh ≤ 1
        set_face_down(cols, p.faceDownRatio)                # từ đáy, top luôn ngửa
        if not constraints_ok(cols, deck, p): continue
        path, m, exact = solve(Level(cols, deck, p))
        if path is None or not (p.targetSolverRange[0] <= m <= p.targetSolverRange[1]): continue
        budget = ceil(m * kTier(p.tier, p.role))
        slack = budget - m
        return Level(cols, deck, solverMoves=m, moveBudget=budget,
                     starThresholds={"two": ceil(0.4*slack), "three": ceil(0.75*slack)}, seed=seed)
    raise NoLevel

def constraints_ok(cols, deck, p):
    tops = [c[-1].cat for c in cols if c]
    if len(set(tops)) < 2: return False                     # mở màn phải có ≥ 2 lựa chọn OPEN
    if p.tier < 3 and any(count_in(deck, cat) == p.k for cat in p.categories):
        return False                                        # tier 1-2: không có category nằm trọn trong deck
    if p.role == "wall" and max_depth_of_some_category(cols) < 3: return False
    return True
```

**`kTier` (hệ số budget / solverMoves) `[GIẢ THUYẾT]`:**

| Tier | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| `normal` | 1.60 | 1.45 | 1.30 | 1.20 | 1.15 |
| `bump` | 1.45 | – | – | – | – |
| `wall` | – | 1.30 | 1.20 | 1.12 | 1.08 |
| `breather` | 1.60 | 1.60 | 1.45 | 1.35 | 1.30 |

Level 1 ngoại lệ: `moveBudget = solverMoves + 6` (FTUE, `concept` mục 6). `targetSolverRange` theo tier: T1 8-30, T2 22-38, T3 30-45, T4 36-52, T5 40-60.

---

## 3. Độ khó

### 3.1 Difficulty score
`D = 0.35·T + 0.25·H + 0.20·B + 0.20·P + C`, clamp 0-1, với:

| Thành phần | Công thức | Đo cái gì |
|---|---|---|
| T (tightness) | `(1.6 − kTier) / 0.45` clamp 0-1 | Budget chặt tới đâu |
| H (hidden) | `faceDownRatio / 0.6` | Thông tin ẩn |
| B (breadth) | `(numCategories − 4) / 2` clamp 0-1 | Áp lực hộc |
| P (deck pressure) | `(deckSize / totalCards) / 0.4` clamp 0-1 | Bao nhiêu thư "đến sau" |
| C (confusion) | +0.05 mỗi cặp category "gần nhau" cùng có mặt, max +0.10 | Chỉ tier ≥ 3 (mục 5) |

Vì `MOVE_COLUMN` không ràng buộc, D không cần thành phần "solvability"; độ khó cảm nhận đến từ 4 trục trên `[GIẢ THUYẾT]`, kiểm chứng bằng tương quan D với win rate (mục 6).

### 3.2 Curve level 1-70

Nhịp mỗi block 10 level: `x1-x2` normal tăng dần · `x3` nhẹ · `x4-x5` normal · `x6` **giới thiệu** category/khu mới, nhẹ hơn · `x7` normal+ · **`x8` wall** · **`x9` breather** · `x0` milestone (normal, reward). Block 1 là FTUE: level 8 chỉ là `bump`, wall thật đầu tiên ở **18** (`concept` mục 6).

| Level | Tier | `numCategories` | `faceDownRatio` | `deckSize` | `kTier` normal | Wall (level, `kTier`) | Breather | D mục tiêu |
|---|---|---|---|---|---|---|---|---|
| 1-10 | 1 | 2→5 | 0-0.40 | 0-4 | 1.60 | 8 bump (1.45) | 9 | 0.0-0.45 |
| 11-20 | 2 | 4-6 | 0.35-0.50 | 4-6 | 1.45 | **18** (1.30), `jokerGift` 1 | 19 | 0.35-0.75 |
| 21-30 | 2→3 | 5-6 | 0.40-0.50 | 4-8 | 1.40 | 28 (1.25) | 29 | 0.45-0.75 |
| 31-40 | 3 | 5-6 | 0.45-0.55 | 6-8 | 1.30 | 38 (1.20) | 39 | 0.50-0.80 |
| 41-50 | 4 | 6 | 0.45-0.55 | 6-10 | 1.20 | 48 (1.12) | 49 | 0.55-0.85 |
| 51-60 | 4 | 6 | 0.50-0.60 | 8-10 | 1.20 | 58 (1.12) | 59 | 0.60-0.85 |
| 61-70 | 5 | 6 | 0.50-0.60 | 8-12 | 1.15 | 68 (1.08) | 69 | 0.65-0.90 |

Mốc content: 21 mở Bến Cảng (chapter 2), 41 mở Đồi Trà, 61 mở Vườn Táo; 36 lần đầu có cặp "gần nhau". Breather sau wall giảm `numCategories` 1 bậc và dùng `kTier` breather.

---

## 4. Bảng 20 level mẫu (chapter 1, Phố Chính)

Pool category chapter 1 (6, đủ cho `numCategories = 6`): **Bánh** (Marigold), **Đồng hồ** (Finch), **Hoa xuân** (Lina), **Chim sẻ** (Otto), **Cá mòi** (Pip), **Chìa khoá** (Otto) — hai bộ cuối là đề xuất thêm vào `concept` 3.1. Chapter 1 chưa có cặp gần nhau. `k = 4`. Ước `solverMoves ≈ total + 1.25·deck + 0.5·faceDownCount`.

| Lvl | Role | nCat | Categories | Cols | cardsPerColumn | faceDown | deck | solver (ước) | kTier | budget | Joker | D | Dạy gì |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | tutorial | 2 | Bánh, Đồng hồ | 2 | 4,4 | 0 | 0 | 8 | +6 | 14 | 0 | 0.02 | Kéo/tap card lên hộc; category hiện tên sẵn |
| 2 | tutorial | 3 | +Hoa xuân | 3 | 4,4,4 | 2 | 0 | 13 | 1.60 | 21 | 0 | 0.07 | Card úp tự lật; hộc **ẩn**, mở khi đặt card đầu |
| 3 | tutorial | 3 | Bánh, Hoa xuân, Chim sẻ | 3 | 3,3,3 | 2 | 3 | 17 | 1.60 | 28 | 0 | 0.22 | Deck/waste; Pip xuất hiện, 1 Hint free |
| 4 | tutorial | 4 | Bánh, Đồng hồ, Hoa xuân, Chim sẻ | 4 | 4,4,4,4 | 4 | 0 | 18 | 1.60 | 29 | 0 | 0.10 | `MOVE_COLUMN`; Return to Sender khi đặt nhầm cột |
| 5 | tutorial | 4 | như 4 | 4 | 4,4,4,4 | 5 | 0 | 19 | 1.45 | 28 | 1 | 0.25 | Tem vàng (gợi ý, không ép); mở decor giường Pip |
| 6 | normal | 4 | Đồng hồ, Hoa xuân, Chim sẻ, Cá mòi | 4 | 3,3,3,3 | 4 | 4 | 23 | 1.60 | 37 | 0 | 0.26 | Deck + úp cùng lúc |
| 7 | normal | 5 | +Bánh | 4 | 4,4,4,4 | 5 | 4 | 28 | 1.55 | 44 | 0 | 0.37 | **5 loại, 4 hộc**: giao xong mới nhận loại mới |
| 8 | bump | 5 | như 7 | 4 | 4,4,4,4 | 6 | 4 | 29 | 1.45 | 43 | 0 | 0.47 | Lần đầu phải cân nhắc thứ tự mở hộc |
| 9 | breather | 4 | Bánh, Đồng hồ, Chim sẻ, Cá mòi | 4 | 4,4,4,4 | 4 | 0 | 18 | 1.60 | 29 | 0 | 0.10 | Nghỉ |
| 10 | milestone | 5 | Bánh, Đồng hồ, Hoa xuân, Chim sẻ, Cá mòi | 5 | 4,3,3,3,3 | 6 | 4 | 28 | 1.55 | 44 | 0 | 0.40 | 5 cột; thưởng decor |
| 11 | normal | 5 | như 10 | 5 | 4,3,3,3,3 | 6 | 4 | 28 | 1.45 | 41 | 0 | 0.47 | Vào tier 2 |
| 12 | normal | 5 | Đồng hồ, Hoa xuân, Chim sẻ, Cá mòi, Chìa khoá | 5 | 4,3,3,3,3 | 7 | 4 | 29 | 1.45 | 43 | 0 | 0.50 | Category thứ 6 xuất hiện lần đầu |
| 13 | normal (nhẹ) | 4 | Bánh, Hoa xuân, Cá mòi, Chìa khoá | 4 | 3,3,3,3 | 4 | 4 | 23 | 1.50 | 35 | 0 | 0.34 | |
| 14 | normal | 5 | Bánh, Đồng hồ, Chim sẻ, Cá mòi, Chìa khoá | 5 | 3,3,3,3,2 | 6 | 6 | 31 | 1.45 | 45 | 0 | 0.55 | Deck lớn hơn tableau nhỏ |
| 15 | normal | 5 | như 10 | 5 | 4,3,3,3,3 | 8 | 4 | 29 | 1.45 | 43 | 0 | 0.53 | Nửa bàn úp |
| 16 | normal (intro) | 6 | cả 6 | 5 | 4,4,4,3,3 | 6 | 6 | 35 | 1.50 | 53 | 0 | 0.54 | **6 loại, 4 hộc** |
| 17 | normal+ | 6 | cả 6 | 5 | 4,4,4,3,3 | 8 | 6 | 36 | 1.45 | 53 | 0 | 0.63 | Dẫn vào wall |
| 18 | **wall** | 6 | cả 6 | 5 | 4,4,4,3,3 | 9 | 6 | 36 | 1.30 | 47 | 1 | 0.77 | Wall đầu tiên; Otto tặng 1 Tem vàng |
| 19 | breather | 4 | Bánh, Đồng hồ, Hoa xuân, Chim sẻ | 4 | 3,3,3,3 | 3 | 4 | 23 | 1.60 | 37 | 0 | 0.23 | Nghỉ, flavor Marigold |
| 20 | milestone | 5 | Bánh, Đồng hồ, Hoa xuân, Chim sẻ, Cá mòi | 5 | 4,3,3,3,3 | 6 | 4 | 28 | 1.50 | 42 | 0 | 0.43 | Kết chapter 1, mở Bến Cảng |

Ghi chú: level 3 chỉnh từ "14 card" trong `concept` mục 6 thành 12 (3 category × 4) để giữ `k` cố định. Không ads trong 20 level này.

---

## 5. Quy tắc readability

| Quy tắc | Giá trị | Lý do |
|---|---|---|
| Kích thước card | 120 px, tem ≥ 60% diện tích, 1 motif, không chữ nhỏ | Gate G3: early ≥ 85%, mid ≥ 65% nhận đúng trong 3 s (`positioning` mục 4) |
| Số category **có mặt** trong một level | ≤ 6 | 6 màu mực (coral, sky, sage, butter, lavender, cocoa); tier 1-2 mỗi category trong level một màu riêng |
| Tier ≥ 3 | Cho phép 2 category cùng màu mực, phân biệt bằng motif | Tăng độ khó đọc có kiểm soát |
| Cặp "gần nhau" | Cùng lớp motif khác chi tiết: Bánh/Bánh trung thu, Chim sẻ/Cú, Hoa xuân/Lá thu, Vỏ ốc/Hải sản, Đèn lồng/Hải đăng. Chỉ đồng thời xuất hiện từ **tier 3 (level ≥ 36)**, tối đa 2 cặp/level | Cộng C vào D (3.1) |
| Ngưỡng nhầm lẫn | Test G3 đo confusion từng cặp: > 15% → không cùng level trước tier 3; > 30% → sửa art, không dùng | Số liệu từ test 20 người |
| Card úp | Mặt sau phong bì đồng nhất, không gợi ý category | Card úp phải thật sự ẩn |
| Hộc `Open` | Portrait + tên cư dân + `count/target`, màu viền = màu mực category | Người chơi khớp màu trước, motif sau |

---

## 6. Đo và tune

### 6.1 Metric per level (mỗi ngày, cohort theo level version)

| Metric | Định nghĩa | Mục tiêu normal | Wall | Breather |
|---|---|---|---|---|
| `firstTryWinRate` | Thắng ở attempt 1 / người bắt đầu level | T1 85-95%, T2 65-80%, T3-5 55-70% | 35-50% | ≥ 85% |
| `winRate` | Thắng / attempt | ≥ 60% | ≥ 40% | ≥ 85% |
| `attemptsToPass` | Trung bình attempt tới khi thắng | ≤ 1.5 | ≤ 2.5 | ≤ 1.2 |
| `extraMovesRate` | Attempt dùng Ca tối / attempt | ≤ 10% | 20-35% | ≤ 5% |
| `jokerRate`, `hintRate`, `undoExhaustRate` | / attempt | Theo dõi | | |
| `quitRate` | Bắt đầu level, không thắng, không quay lại trong 24 h | ≤ 3% | ≤ 6% | ≤ 2% |
| `avgMovesLeftWin` | Moves còn khi thắng | Gần `starThresholds.two` | Gần 0-3 | |
| `D` vs `firstTryWinRate` | Tương quan trên toàn bộ level | r ≤ −0.6, nếu không thì sửa trọng số D | | |

### 6.2 Ngưỡng hành động

| Tín hiệu | Hành động | Cơ chế |
|---|---|---|
| `firstTryWinRate` thấp hơn mục tiêu > 15 điểm **hoặc** `quitRate` vượt ngưỡng | **Nerf**: `moveBudgetDelta +2`; nếu vẫn thấp sau 3 ngày: giảm `faceDownCount` 1-2 | Remote config `levelOverrides[levelId] = {moveBudgetDelta, faceDownDelta}`; không cần build |
| `firstTryWinRate` cao hơn mục tiêu > 15 điểm và không phải breather | **Buff**: `moveBudgetDelta −1` | Như trên |
| Wall có `extraMovesRate` < 15% | Wall chưa đủ wall: `kTier` wall giảm 0.05 ở lần sinh lại | Regenerate + version mới |
| Cùng level bị nerf 2 lần liên tiếp | Sinh lại layout (seed mới), không đắp moves nữa | Tránh "budget ảo" kiểu ABI hotfix moves (`teardown` mục 5 `[PLAY]`) |

Giới hạn: mỗi level thay đổi ≤ ±3 moves/tuần; mọi thay đổi ghi `levelVersion` để cohort không lẫn. Khác ABI ở chỗ **chủ động**: chạy solver + ngưỡng trước khi ship, tune theo metric hằng ngày thay vì chờ review 1 sao.

### 6.3 Quy trình trước khi ship một batch level
1. Generator sinh, solver `exact=True` cho ≥ 90% level; số greedy còn lại ghi nhãn để playtest tay.
2. 5 người nội bộ chơi mù (không biết layout) → `firstTryWinRate` nội bộ phải trong mục tiêu ± 20 điểm.
3. Kiểm tra curve: D không giảm quá 0.25 giữa 2 level liên tiếp trừ breather; không có 3 level liên tiếp cùng `numCategories` và `deckSize`.

---

## 7. Câu hỏi mở

1. `kTier` và `targetSolverRange` là ước lượng; sau 200 attempt/level ở soft launch cần fit lại bằng hồi quy `firstTryWinRate ~ D`.
2. Hệ số ước `solverMoves` (1.25·deck, 0.5·faceDown) sẽ bị thay bằng số thật của solver; giữ ở đây chỉ để đọc bảng level mẫu.
3. Wall dùng `jokerGift` 1 có làm wall mất "wall" không? So sánh 18 có/không Joker ở A/B nội bộ.
