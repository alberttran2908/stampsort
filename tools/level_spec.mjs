// Spec tham số cho level L21-L200 theo LUẬT A (E2 + E3 trong docs/design/30-day-plan.md, cập nhật 2026-10-15:
// người dùng chốt luật A là mặc định bản phát hành, level thường vẫn thua khi hết lượt).
// Không sinh layout: chỉ quyết định vai trò, số lá, số khay, cột, chủ đề và n, mục tiêu độ khó. Layout do gen_levels.mjs sinh.
//
// Dùng:
//   node tools/level_spec.mjs --print=21-200          bảng markdown 1 dòng / level
//   node tools/level_spec.mjs --print=21-40 --json    JSON
//   node tools/level_spec.mjs --chapters              bảng chương (tên khu, chủ đề mới, fallback đang dùng)
//   import { specFor, chapterOf, TIERS, ROLE_ADJ, PATTERN, CHAPTER_TOPICS, legacyTargets } from './level_spec.mjs';
//
// Tất định: specFor(L) chỉ phụ thuộc dữ liệu tĩnh trong file này, art đang có của chương L và chương liền trước.
// Khi art của chương X về, chỉ chương X và X+1 đổi chủ đề (X+1 dùng chủ đề của X theo hạn mức 20%).
import { pathToFileURL } from 'node:url';
import { BASE_TOPICS, EXCLUDED, artCount, hasArt, confuses, confusePairs, hashStr, rng } from './level_rules.mjs';

export const RULES = 'A';
export const FIRST_GEN = 21, LAST_GEN = 200, CHAPTER_LEN = 20;

// ---------------------------------------------------------------- nhịp 20 level (plan 3.2)
export const PATTERN = ['intro-br', 'nor', 'nor', 'intro', 'nor', 'bump', 'br', 'nor', 'bump', 'HARD',
  'br', 'intro', 'nor', 'nor', 'bump', 'br', 'nor', 'nor', 'bump', 'SUPER'];
export const INTRO_AT = [1, 4, 12];                      // vị trí giới thiệu chủ đề mới #1, #2, #3
export const PEAK = new Set(['bump', 'HARD', 'SUPER']);
export const BREATHER = new Set(['br', 'intro-br']);
// Level nghỉ 3 khay: ABI dùng 3 khay cho level nhỏ 6-7 chủ đề, 36-44 lá (APK L22, L27, L36, L41) [APK].
export const SMALL_TRAY_AT = 16;
export const SPECIAL_DECK_BONUS = 0.08;

// ---------------------------------------------------------------- tham số theo chương, LUẬT A
// Cơ sở: level A L1-L20 hiện có (nor 7 chủ đề 38-46 lá, bump/hard 8 chủ đề 48-52 lá, super 9 chủ đề 58-60 lá, 5 khay) [CODE levels.js]
// và xu hướng ABI (sau L20 trung vị 10 chủ đề, 64 lá, deck 66-75%) [APK]. Giữ trần độ dài cho người lớn tuổi:
// level thường <= 46 lá và trung vị o35 <= 6 phút (bump <= 6,5 phút); level khó <= 54 lá và <= 8 phút. Không theo ABI phần level 64-98 lá.
// Đo 2026-10-15: luật A (7-8 chủ đề) cần ~1,9 nước/lá với o35, nên 6 phút ứng với ~44 lá (luật B: ~46).
// cards: [min, max] theo vai trò. topics: số chủ đề. F: số khay. n: [min, max] tem thường mỗi chủ đề. deck: tỉ lệ lá trong bộ bài.
// slack: sàn moves = ceil(solver x slack) ở level nor/intro. tgt: mục tiêu level nor/intro (seed check).
export const TIERS = [
  { ch: [3, 3], cards: { nor: [40, 44], br: [34, 40], bump: [42, 46], HARD: [48, 52], SUPER: [50, 54] },
    topics: { nor: 7, br: 6, bump: 8, HARD: 8, SUPER: 9 }, F: { nor: 4, br: 4, bump: 4, HARD: 4, SUPER: 5 },
    cols: 4, n: [3, 6], deck: 0.55, slack: 1.28, tgt: { c25: 0.90, o35: 0.75, o35p5: 0.95 }, stuck: 0.03 },
  { ch: [4, 4], cards: { nor: [40, 45], br: [34, 40], bump: [42, 46], HARD: [48, 52], SUPER: [50, 54] },
    topics: { nor: 7, br: 6, bump: 8, HARD: 8, SUPER: 9 }, F: { nor: 4, br: 4, bump: 4, HARD: 4, SUPER: 5 },
    cols: 4, n: [3, 7], deck: 0.58, slack: 1.25, tgt: { c25: 0.90, o35: 0.75, o35p5: 0.95 }, stuck: 0.03 },
  { ch: [5, 5], cards: { nor: [41, 45], br: [36, 41], bump: [43, 46], HARD: [48, 52], SUPER: [50, 54] },
    topics: { nor: 7, br: 6, bump: 8, HARD: 9, SUPER: 10 }, F: { nor: 4, br: 4, bump: 4, HARD: 4, SUPER: 5 },
    cols: 4, cols5From: 6, n: [3, 7], deck: 0.60, slack: 1.22, tgt: { c25: 0.88, o35: 0.72, o35p5: 0.95 }, stuck: 0.03 },
  { ch: [6, 6], cards: { nor: [41, 45], br: [36, 41], bump: [43, 46], HARD: [48, 52], SUPER: [50, 54] },
    topics: { nor: 8, br: 6, bump: 8, HARD: 9, SUPER: 10 }, F: { nor: 4, br: 4, bump: 4, HARD: 4, SUPER: 5 },
    cols: 5, n: [3, 8], deck: 0.60, slack: 1.22, tgt: { c25: 0.88, o35: 0.72, o35p5: 0.94 }, stuck: 0.03 },
  { ch: [7, 8], cards: { nor: [42, 46], br: [37, 42], bump: [44, 46], HARD: [48, 52], SUPER: [50, 54] },
    topics: { nor: 8, br: 6, bump: 9, HARD: 9, SUPER: 10 }, F: { nor: 4, br: 4, bump: 4, HARD: 4, SUPER: 5 },
    cols: 5, n: [3, 8], deck: 0.62, slack: 1.20, tgt: { c25: 0.85, o35: 0.70, o35p5: 0.93 }, stuck: 0.05 },
  { ch: [9, 11], cards: { nor: [42, 46], br: [37, 42], bump: [44, 46], HARD: [48, 52], SUPER: [50, 54] },
    topics: { nor: 8, br: 6, bump: 9, HARD: 10, SUPER: 10 }, F: { nor: 4, br: 4, bump: 4, HARD: 4, SUPER: 5 },
    cols: 5, n: [3, 8], deck: 0.62, slack: 1.18, tgt: { c25: 0.85, o35: 0.70, o35p5: 0.93 }, stuck: 0.05 },
];
export const tierOf = ch => TIERS.find(t => ch >= t.ch[0] && ch <= t.ch[1]);

// Điều chỉnh theo vai trò (plan 3.3, bảng "Điều chỉnh theo vai trò"). Khoảng lá và số chủ đề đã nằm trong TIERS.
// targets: win = tỉ lệ thắng trong moves (seed check). Khoảng [a, b] = phải nằm trong khoảng. stuck = kẹt cứng c10 tối đa.
export const ROLE_ADJ = {
  'intro-br': { base: 'br', slack: 1.35, targets: { c25: 0.97, o35: 0.85, o35p5: 0.97 }, stuck: 0 },
  br: { base: 'br', slack: 1.35, targets: { c25: 0.97, o35: 0.85, o35p5: 0.97 }, stuck: 0 },
  intro: { base: 'nor', slack: null, targets: null, stuck: 0.03 },          // như nor
  nor: { base: 'nor', slack: null, targets: null, stuck: null },            // theo tier
  bump: { base: 'bump', slack: 1.15, targets: { c25: 0.80, o35: 0.60, o35p5: 0.90 }, stuck: 0.05 },
  // sk: plan ghi 0.35-0.55 / 0.30-0.50. Nới trần lên 0.70 / 0.65 (quyết định level dev 2026-10-15): đo seed check, A L15 sk 0.71,
  // A L20 sk 1.00; ch3 thử 3 lần x 40 layout chỉ 1-2 layout có c10 và sk cùng trong khoảng cũ. c10 (người chơi phổ thông)
  // và kẹt mới là điều kiện chính của "thiếu moves chứ không kẹt"; sk chỉ bảo đảm người giỏi cũng thấy chật.
  HARD: { base: 'HARD', slack: 1.02, targets: { c10: [0.15, 0.35], sk: [0.35, 0.70] }, stuck: 0.10, special: 'hard' },
  SUPER: { base: 'SUPER', slack: 1.03, targets: { c10: [0.10, 0.30], sk: [0.30, 0.65] }, stuck: 0.15, special: 'superhard' },
};
// Trần cứng (PO câu 6, chỉnh cho luật A): level thường <= 46 lá, <= 6 phút (trung vị o35), bump <= 6,5 phút;
// level khó <= 54 lá, <= 8 phút. Slack <= 1.6.
export const CAP = { normal: { cards: 46, min: 6 }, bump: { cards: 46, min: 6.5 }, special: { cards: 54, min: 8 }, slackMax: 1.6 };
/** Trần phút theo vai trò (dùng cả cho level cũ: role 'bump', special 'hard'/'superhard'). */
export const capMinFor = (role, special) => (special ? CAP.special.min : role === 'bump' ? CAP.bump.min : CAP.normal.min);

// Mục tiêu mặc định cho level cũ L1-L20 (validator dùng khi level không có targets). Bảng 3.3 dòng "1-2".
export function legacyTargets(role, special) {
  if (special === 'hard' || role === 'hard') return { targets: ROLE_ADJ.HARD.targets, stuck: ROLE_ADJ.HARD.stuck, special: 'hard' };
  if (special === 'superhard' || role === 'superhard') return { targets: ROLE_ADJ.SUPER.targets, stuck: ROLE_ADJ.SUPER.stuck, special: 'superhard' };
  if (role === 'breather') return { targets: ROLE_ADJ.br.targets, stuck: 0 };
  if (role === 'bump') return { targets: ROLE_ADJ.bump.targets, stuck: ROLE_ADJ.bump.stuck };
  return { targets: { c25: 0.85, o35: 0.70, o35p5: 0.93 }, stuck: 0.03 };   // teach, normal
}

// ---------------------------------------------------------------- chương và chủ đề mới (plan 2.2, người dùng duyệt 2026-10-15)
// fallback: chủ đề nền có art, dùng tạm khi chủ đề mới chưa có art (>= 5 ảnh + icon_line.png). 27 fallback khác nhau,
// không trùng chủ đề chương 2, gần nghĩa với khu nếu được. Car (8 art) giữ cho "Bao thư lớn" L41 (n = 8).
export const CHAPTER_TOPICS = {
  3: { vi: 'Đồi Trà', en: 'Tea Hill', season: 'Thu', resident: 'Ines', topics: [
    { name: 'Lantern', vi: 'Đèn lồng', fallback: 'Tea' }, { name: 'Knitting', vi: 'Đồ len', fallback: 'Outerwear' },
    { name: 'Acorn', vi: 'Hạt dẻ & quả sồi', fallback: 'Mushroom' }] },
  4: { vi: 'Vườn Táo', en: 'Apple Orchard', season: 'Đông', resident: 'Otto', topics: [
    { name: 'Winter', vi: 'Người tuyết', fallback: 'Car' }, { name: 'Candle', vi: 'Nến', fallback: 'Bouquet' },
    { name: 'Gift', vi: 'Hộp quà', fallback: 'Candy' }] },
  5: { vi: 'Ga Tàu', en: 'Train Station', season: 'Xuân', resident: 'Finch', topics: [
    { name: 'Luggage', vi: 'Vali', fallback: 'Train' }, { name: 'Umbrella', vi: 'Ô dù', fallback: 'Aircraft' },
    { name: 'Camera', vi: 'Máy ảnh', fallback: 'Ball' }] },
  6: { vi: 'Đảo Xa', en: 'Far Island', season: 'Hè', resident: 'Bo', topics: [
    { name: 'Lighthouse', vi: 'Hải đăng', fallback: 'Ship' }, { name: 'Treasure', vi: 'Kho báu', fallback: 'Gems' },
    { name: 'Cactus', vi: 'Xương rồng', fallback: 'Water Plants' }] },
  7: { vi: 'Chợ Phiên', en: 'Market Square', season: 'Thu', resident: 'Marigold', topics: [
    { name: 'Bread', vi: 'Bánh mì', fallback: 'Pizza' }, { name: 'Cheese', vi: 'Phô mai', fallback: 'Fast food' },
    { name: 'Pottery', vi: 'Đồ gốm', fallback: 'Vegetable' }] },
  8: { vi: 'Bờ Hồ', en: 'Lakeside', season: 'Đông', resident: 'Lina', topics: [
    { name: 'Fishing', vi: 'Đồ câu', fallback: 'Sea life' }, { name: 'Picnic', vi: 'Dã ngoại', fallback: 'Grilled' },
    { name: 'Painting', vi: 'Họa cụ', fallback: 'Flower' }] },
  9: { vi: 'Đồi Cối Xay Gió', en: 'Windmill Hill', season: 'Xuân', resident: 'Otto', topics: [
    { name: 'Stationery', vi: 'Văn phòng phẩm', fallback: 'Tool' }, { name: 'Wooden Toys', vi: 'Đồ chơi gỗ', fallback: 'Balloon' },
    { name: 'Honey', vi: 'Ong & mật', fallback: 'Juice' }] },
  10: { vi: 'Quảng Trường Lễ Hội', en: 'Festival Square', season: 'Hè', resident: 'Marigold', topics: [
    { name: 'Fireworks', vi: 'Pháo hoa', fallback: 'Kite' }, { name: 'Mask', vi: 'Mặt nạ hội', fallback: 'Ice cream' },
    { name: 'Bell', vi: 'Chuông', fallback: 'Music Inst' }] },
  11: { vi: 'Đồi Mây', en: 'Cloud Hill', season: 'Thu', resident: 'Bo', topics: [
    { name: 'Weather', vi: 'Thời tiết', fallback: 'Planet' }, { name: 'Origami', vi: 'Giấy gấp', fallback: 'Cat' },
    { name: 'Keys', vi: 'Chìa khóa', fallback: 'Time' }] },
};
// Chủ đề mới của chương 2 (Bến Cảng), dùng cho hạn mức 20% ở chương 3 [CODE levels.js L11-L14 introduce].
export const CH2_TOPICS = ['Sailboats', 'Shells', 'Seafood', 'Nautical'];
export const NEW_ART_MIN = 5;                    // chủ đề mới cần >= 5 art để thay fallback (plan 2.3: giữ >= 6, tốt nhất 8)
export const QUOTA = { cur: 0.40, prev: 0.20 };  // plan 2.1

export const chapterOf = L => (L <= 10 ? 1 : L <= 20 ? 2 : 3 + Math.floor((L - FIRST_GEN) / CHAPTER_LEN));
export const posOf = L => ((L - FIRST_GEN) % CHAPTER_LEN) + 1;
export const firstOf = ch => FIRST_GEN + (ch - 3) * CHAPTER_LEN;

/** Chủ đề mới đã quyết của chương: tên thật nếu có art, ngược lại fallback. */
export function resolvedTopics(ch) {
  if (ch === 2) return CH2_TOPICS.map(t => ({ name: t, use: t, fallback: false }));
  const c = CHAPTER_TOPICS[ch];
  if (!c) return [];
  return c.topics.map(t => (hasArt(t.name, NEW_ART_MIN) ? { name: t.name, use: t.name, fallback: false } : { name: t.name, use: t.fallback, fallback: true }));
}

/** Pool nền của chương ch: chủ đề có art, trừ chủ đề hạn mức của ch và ch-1, fallback của ch-1..ch+1,
 *  chủ đề mới thật của chương >= ch (chưa tới). Chủ đề mới thật của chương <= ch-2 vào pool nền bình thường. */
function backgroundPool(ch) {
  const block = new Set([...resolvedTopics(ch), ...resolvedTopics(ch - 1)].map(t => t.use));
  for (const k of [ch - 1, ch, ch + 1]) for (const t of (CHAPTER_TOPICS[k]?.topics || [])) block.add(t.fallback);
  const pool = new Set(BASE_TOPICS);
  for (let k = 3; k <= ch - 2; k++) for (const t of resolvedTopics(k)) if (!t.fallback) pool.add(t.use);
  for (const k of Object.keys(CHAPTER_TOPICS).map(Number)) if (k >= ch) for (const t of CHAPTER_TOPICS[k].topics) pool.delete(t.name);
  return [...pool].filter(t => !block.has(t) && !EXCLUDED.has(t)).sort();
}

// ---------------------------------------------------------------- dựng 1 chương
function colsFor(nCols, table) {
  // hình bậc thang a, a+1, ..., phần dư cộng vào các cột cao nhất; a >= 1
  const tri = (nCols * (nCols - 1)) / 2;
  const a = Math.max(1, Math.floor((table - tri) / nCols));
  const cols = Array.from({ length: nCols }, (_, i) => a + i);
  let rem = table - cols.reduce((x, y) => x + y, 0);
  for (let i = nCols - 1; rem > 0; i = (i - 1 + nCols) % nCols) { cols[i]++; rem--; }
  return cols;
}

function allocateN(topics, total, nRange, r, fixed = {}) {
  // total = tổng tem thường. Mỗi chủ đề trong [nMin, min(nMax, art)]; chủ đề fixed giữ n cho trước.
  const cap = t => fixed[t] ?? Math.min(nRange[1], artCount(t));
  const n = Object.fromEntries(topics.map(t => [t, fixed[t] ?? Math.min(nRange[0], cap(t))]));
  let rem = total - topics.reduce((s, t) => s + n[t], 0);
  while (rem > 0) {
    const room = topics.filter(t => fixed[t] == null && n[t] < cap(t));
    if (!room.length) break;
    n[room[Math.floor(r() * room.length)]]++;
    rem--;
  }
  return n;
}

const chapterCache = new Map();
export function buildChapter(ch) {
  if (chapterCache.has(ch)) return chapterCache.get(ch);
  const tier = tierOf(ch);
  if (!tier) throw new Error(`chương ${ch} không có tier`);
  const cur = resolvedTopics(ch);
  const prev = resolvedTopics(ch - 1);
  const pool = backgroundPool(ch);
  const quotaCur = Math.ceil(QUOTA.cur * CHAPTER_LEN), quotaPrev = Math.ceil(QUOTA.prev * CHAPTER_LEN);
  // hạn mức: { topic, from (vị trí bắt đầu được dùng), need }
  const quotas = [
    ...cur.map((t, i) => ({ topic: t.use, from: INTRO_AT[i], need: quotaCur, got: 0, kind: 'cur' })),
    ...prev.map(t => ({ topic: t.use, from: 1, need: quotaPrev, got: 0, kind: 'prev' })),
  ];
  const usage = Object.fromEntries(pool.map(t => [t, 0]));
  const specs = [];
  const recent = [];                       // chủ đề của 2 level liền trước
  for (let p = 1; p <= CHAPTER_LEN; p++) {
    const L = firstOf(ch) + p - 1;
    const role = PATTERN[p - 1];
    const adj = ROLE_ADJ[role];
    const base = adj.base;
    const r = rng(hashStr(`spec:${L}`));
    const k = tier.topics[base];
    const [lo, hi] = tier.cards[base];
    const capCards = adj.special ? CAP.special.cards : CAP.normal.cards;
    // 1) chủ đề bắt buộc: chủ đề mới ở level intro + hạn mức trải đều (đếm mong muốn tới cuối level p)
    const chosen = [];
    const add = t => { if (!chosen.includes(t) && !chosen.some(x => confuses(x, t))) { chosen.push(t); return true; } return false; };
    const introIdx = INTRO_AT.indexOf(p);
    const introduce = introIdx >= 0 ? [cur[introIdx].use] : null;
    if (introduce) add(introduce[0]);
    const maxQuota = Math.max(1, k - 3);           // chừa >= 3 chỗ cho pool nền
    const due = quotas.filter(q => p >= q.from && q.got < q.need && !chosen.includes(q.topic)).map(q => {
      const span = CHAPTER_LEN - q.from + 1;
      const want = Math.ceil((q.need * (p - q.from + 1)) / span);
      return { q, lag: want - q.got, urgency: (q.need - q.got) / (CHAPTER_LEN - p + 1) };
    }).filter(x => x.lag > 0).sort((a, b) => b.urgency - a.urgency || a.q.topic.localeCompare(b.q.topic));
    for (const { q } of due) { if (chosen.length >= maxQuota) break; add(q.topic); }
    // 2) số lá mục tiêu: tăng dần theo vị trí trong chương, dao động ±1
    const frac = (p - 1) / (CHAPTER_LEN - 1);
    let C = Math.round(lo + (hi - lo) * frac) + ((hashStr(`C:${L}`) % 3) - 1);
    C = Math.max(lo, Math.min(hi, capCards, C));
    // 3) pool nền: tránh 2 level liền trước, ít dùng nhất trong chương, đủ art, phá hoà bằng hash
    const needAvg = Math.ceil((C - k) / k);
    const recentSet = new Set(recent.flat());
    const rank = t => [recentSet.has(t) ? 1 : 0, usage[t], Math.min(tier.n[1], artCount(t)) < needAvg ? 1 : 0, hashStr(`${L}:${t}`)];
    const cmp = (a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
    const cand = pool.filter(t => artCount(t) >= tier.n[0]).sort(cmp);
    for (const t of cand) { if (chosen.length >= k) break; add(t); }
    // 4) khả thi số lá: nếu tổng trần n quá thấp, đổi chủ đề nền ít art lấy chủ đề nhiều art
    const capOf = t => Math.min(tier.n[1], artCount(t));
    const maxCards = () => chosen.reduce((s, t) => s + capOf(t) + 1, 0);
    const bgIdx = () => chosen.map((t, i) => [t, i]).filter(([t]) => !quotas.some(q => q.topic === t) && !(introduce || []).includes(t));
    let guard = 0;
    while (maxCards() < C && guard++ < 20) {
      const low = bgIdx().sort((a, b) => capOf(a[0]) - capOf(b[0]))[0];
      if (!low) break;
      const rest = chosen.filter(t => t !== low[0]);
      const better = cand.filter(t => !chosen.includes(t) && capOf(t) > capOf(low[0]) && !rest.some(x => confuses(x, t)))
        .sort((a, b) => capOf(b) - capOf(a) || cmp(a, b))[0];
      if (!better) break;
      chosen[low[1]] = better;
    }
    C = Math.min(C, maxCards());
    C = Math.max(C, chosen.reduce((s, t) => s + Math.min(tier.n[0], capOf(t)) + 1, 0));
    // 5) n: Bao thư lớn ở L41 (chủ đề mới #1 n = 8 nếu đủ art, không thì 7)
    const fixed = {};
    let bigEnvelope = null;
    if (ch === 4 && p === 1) {
      const t = cur[0].use;
      fixed[t] = Math.min(8, artCount(t));
      bigEnvelope = { topic: t, n: fixed[t], note: fixed[t] === 8 ? 'n = 8' : `fallback n = ${fixed[t]} (chưa đủ 8 art)` };
    }
    const nAlloc = allocateN(chosen, C - chosen.length, bigEnvelope ? [tier.n[0], 8] : tier.n, r, fixed);
    const cards = Object.values(nAlloc).reduce((s, n) => s + n + 1, 0);
    // 6) khay, cột
    let F = tier.F[base];
    let tip = null;
    if (BREATHER.has(role) && p === SMALL_TRAY_AT) { F = 3; if (ch === 3) tip = 'few_counters'; }
    const nCols = role === 'SUPER' ? 5 : tier.cols5From && p >= tier.cols5From ? 5 : tier.cols;
    if (ch === 5 && p === tier.cols5From) tip = tip || 'five_columns';
    const preplace = ch === 6 && p === 7 ? chosen.filter(t => !quotas.some(q => q.topic === t))[0] || null : null;
    if (preplace) tip = 'preplaced';
    if (bigEnvelope) tip = 'big_envelope';
    // level khó: biến thể thêm 8 điểm lá trong bộ bài (nhiều lá ẩn hơn -> người giỏi khó lập kế hoạch, khoảng sk - c10 hẹp lại).
    // A L5/L15 (deck 64-65%) đạt c10 ~0,2 và sk ~0,5; ch3 thử 2026-10-15: L30 chỉ đạt với deck 63%, L40 chỉ đạt với deck 55%.
    // gen_levels.mjs xen kẽ 2 biến thể cho level khó: cols (deck của tier) và colsAlt (+8 điểm).
    const deckTarget = +tier.deck.toFixed(2);
    const onTable = d => Math.round((cards - (preplace ? 1 : 0)) * (1 - d));
    const cols = colsFor(nCols, onTable(deckTarget));
    const colsAlt = adj.special ? colsFor(nCols, onTable(tier.deck + SPECIAL_DECK_BONUS)) : null;
    // ghi nhận
    for (const q of quotas) if (chosen.includes(q.topic)) q.got++;
    for (const t of chosen) if (t in usage) usage[t]++;
    recent.unshift(chosen); recent.length = Math.min(recent.length, 2);
    const tgt = adj.targets || tier.tgt;
    specs.push({
      id: L, chapter: ch, p, role, rules: RULES, special: adj.special || null,
      F, cols, colsAlt, cards, deckTarget, deckPct: +(1 - cols.reduce((a, b) => a + b, 0) / cards).toFixed(2),
      topics: nAlloc, introduce, preplace, bigEnvelope, tip,
      required: chosen.filter(t => quotas.some(q => q.topic === t) || (introduce || []).includes(t)),
      newTopics: cur.map(t => t.use), fallback: Object.fromEntries(cur.filter(t => t.fallback).map(t => [t.name, t.use])),
      targets: tgt, maxStuck: adj.stuck ?? tier.stuck, slackFloor: adj.slack ?? tier.slack,
      capCards, capMin: capMinFor(role, adj.special), slackMax: CAP.slackMax,
      cardRange: [lo, Math.min(hi, capCards)], topicCount: k, nRange: bigEnvelope ? [tier.n[0], 8] : tier.n,
    });
  }
  const res = { ch, specs, quotas: quotas.map(({ topic, need, got, kind, from }) => ({ topic, need, got, kind, from })), pool };
  chapterCache.set(ch, res);
  return res;
}

export function specFor(L) {
  if (L < FIRST_GEN || L > LAST_GEN) throw new Error(`specFor: L${L} ngoài ${FIRST_GEN}-${LAST_GEN} (L1-L20 dùng gen_proto_levels.mjs)`);
  return buildChapter(chapterOf(L)).specs[posOf(L) - 1];
}

// ---------------------------------------------------------------- CLI
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
  if (process.argv.includes('--chapters')) {
    console.log('| Ch | Level | Khu | Chủ đề mới | Đang dùng | Pool nền |');
    console.log('|---|---|---|---|---|---|');
    for (let ch = 3; ch <= 11; ch++) {
      const c = CHAPTER_TOPICS[ch], b = buildChapter(ch);
      console.log(`| ${ch} | ${firstOf(ch)}-${firstOf(ch) + 19} | ${c.vi} / ${c.en} | ${c.topics.map(t => t.name).join(', ')} | ${resolvedTopics(ch).map(t => t.use + (t.fallback ? '*' : '')).join(', ')} | ${b.pool.length} |`);
    }
    console.log('\n`*` = fallback (chưa có art chủ đề mới).');
  } else {
    const [a, z] = (arg('print') || '21-40').split('-').map(Number);
    const rows = [];
    for (let L = a; L <= (z || a); L++) rows.push(specFor(L));
    if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 1));
    else {
      const fmtT = t => Object.entries(t).map(([k, v]) => Array.isArray(v) ? `${k} ${v[0]}-${v[1]}` : `${k}≥${v}`).join(', ');
      console.log('| L | Ch | p | Vai trò | Khay | Cột | Lá | Deck | Chủ đề (n) | Mới | Mục tiêu | Kẹt c10 ≤ | Slack sàn | Ghi chú |');
      console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
      for (const s of rows) {
        const nt = Object.entries(s.topics).map(([t, n]) => (s.newTopics.includes(t) ? `**${t}**` : t) + ` ${n}`).join(', ');
        const note = [s.introduce && `giới thiệu ${s.introduce[0]}`, s.special, s.tip, s.preplace && `mở sẵn ${s.preplace}`, s.bigEnvelope && `bao thư lớn ${s.bigEnvelope.topic} ${s.bigEnvelope.n}`].filter(Boolean).join('; ');
        console.log(`| ${s.id} | ${s.chapter} | ${s.p} | ${s.role} | ${s.F} | ${s.cols.join('-')} | ${s.cards} | ${Math.round(s.deckPct * 100)}% | ${nt} | ${s.newTopics.length} | ${fmtT(s.targets)} | ${s.maxStuck} | ${s.slackFloor} | ${note} |`);
      }
      console.log(`\n${rows.length} dòng. Luật ${RULES}. **Đậm** = chủ đề mới của chương (fallback nếu chưa có art: node tools/level_spec.mjs --chapters).`);
    }
  }
}
