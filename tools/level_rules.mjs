// Luật dùng chung cho mọi tool sinh/đo level (E1 trong docs/design/30-day-plan.md).
// Không có DOM, không ghi file. Import từ: level_spec.mjs, gen_levels.mjs, validate_levels.mjs, difficulty_report.mjs.
//
// Dùng:
//   import { CONFUSE, confuses, availableArts, usableTopic, fair, PROFILES, SEC_PER_MOVE, rng, hashStr } from './level_rules.mjs';
//   node tools/level_rules.mjs            -> in danh sách chủ đề dùng được (số art) và các cặp CONFUSE
//
// Ghi chú: tools/gen_proto_levels.mjs (L1-L20) vẫn giữ CONFUSE cũ của nó để không làm vỡ A/B L14 (Ice cream + Coffee)
// trước R4. R4 sẽ chuyển gen_proto_levels.mjs sang import module này.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const CARDS_DIR = ROOT + 'prototype/stamp/assets/cards/';
const manifest = JSON.parse(readFileSync(ROOT + 'prototype/stamp/assets/manifest.json', 'utf8'));

// ---------------------------------------------------------------- chủ đề và art
export const slug = t => t.toLowerCase().replace(/ /g, '_').replace(/&/g, 'and');

/** Index art thật trong prototype/stamp/assets/cards/<slug>/N.png. Chủ đề chưa có thư mục -> []. */
const artCache = new Map();
export function availableArts(t) {
  if (artCache.has(t)) return artCache.get(t);
  const dir = CARDS_DIR + slug(t);
  const arts = existsSync(dir)
    ? readdirSync(dir).map(f => f.match(/^(\d+)\.png$/)).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b)
    : [];
  artCache.set(t, arts);
  return arts;
}
export const artCount = t => availableArts(t).length;
/** Có đủ art để vào level: thư mục có >= minArts ảnh và icon nét (lá vương miện). */
export const hasArt = (t, minArts = 3) => artCount(t) >= minArts && existsSync(CARDS_DIR + slug(t) + '/icon_line.png');

// Loại khỏi pool: Raw meat (lệch tone, nhầm với Grilled), Sauce (chỉ 3 art, nhầm Soft drink). Plan mục 2.1.
export const EXCLUDED = new Set(['Raw meat', 'Sauce']);
/** Tất cả chủ đề có art trong manifest (63), trừ EXCLUDED. */
export const BASE_TOPICS = Object.keys(manifest).filter(t => !EXCLUDED.has(t) && hasArt(t));
export const usableTopic = (t, nMin = 3) => !EXCLUDED.has(t) && hasArt(t, nMin);

// ---------------------------------------------------------------- cặp dễ nhầm
// Không bao giờ đặt chung một level. Nguồn từng nhóm:
//  - 12 cặp đầu: tools/gen_proto_levels.mjs (so sánh art 2026-10-10).
//  - 11 cặp tiếp: tools/import_apk_levels.mjs (review chương 1).
//  - Coffee <-> Ice cream: review GD v2 #13 (đã có trong import_apk_levels, giữ một bản).
//  - Còn lại: chủ đề mới chương 3-11 (plan mục 2.2). Knitting <-> Outerwear là [GIẢ THUYẾT] của level dev (áo len vs áo khoác len).
export const CONFUSE = [
  ['Seafood', 'Shells'], ['Sailboats', 'Ship'], ['Shells', 'Sea life'], ['Seafood', 'Sea life'], ['Seafood', 'Grilled'],
  ['Seafood', 'Sushi'], ['Seafood', 'Sashimi'], ['Nautical', 'Ship'], ['Ball', 'Float'], ['Soda', 'Soft drink'],
  ['Coffee', 'Tea'], ['Nautical', 'Time'],
  ['Truck', 'Train'], ['Truck', 'Car'], ['Sushi', 'Sashimi'], ['Raw meat', 'Grilled'], ['Zoo', 'Beast'], ['Hoofed', 'Zoo'],
  ['Pets', 'Dog'], ['Pets', 'Cat'], ['Cake', 'Desserts'], ['Coffee', 'Ice cream'], ['Sauce', 'Soft drink'],
  // chủ đề mới (plan 2.2)
  ['Acorn', 'Leaf'], ['Acorn', 'Tree'], ['Candle', 'Lantern'], ['Camera', 'Phone'], ['Lighthouse', 'Nautical'],
  ['Treasure', 'Gems'], ['Bread', 'Cake'], ['Bread', 'Desserts'], ['Pottery', 'Tea'], ['Fishing', 'Sea life'],
  ['Honey', 'Insect'], ['Wooden Toys', 'Chess'], ['Wooden Toys', 'Kite'], ['Bell', 'Music Inst'], ['Bell', 'Notes'],
  ['Weather', 'Planet'], ['Origami', 'Bird'], ['Origami', 'Sailboats'],
  ['Knitting', 'Outerwear'],
  // Duyệt trên ảnh thật 2026-10-15 (level dev, art-batch-1.md mục 1.7 + ghi chú agent Art). Cùng chương 8: Fishing <-> Picnic
  // (giỏ mây quai da Picnic/0 vs Fishing/5; xô inox có quai Picnic/7 vs Fishing/6) -> hai chủ đề này không bao giờ chung level.
  ['Fishing', 'Picnic'],
  ['Lantern', 'Balloon'],      // lồng đèn tròn đỏ / đèn ngôi sao (Lantern/0, /3) vs bóng bay tròn, bóng ngôi sao (Balloon/3)
  ['Lantern', 'Flower'],       // đèn hoa sen hồng Lantern/2 gần như trùng hoa sen Flower/1 (thấy khi duyệt, không có trong 1.7)
  ['Luggage', 'Treasure'],     // rương/vali da chồng Luggage/7, /0 vs rương gỗ Treasure/1
  ['Umbrella', 'Weather'],     // ô cầu vồng Umbrella/2 vs cầu vồng Weather/2
  ['Umbrella', 'Mushroom'],    // ô đỏ mở Umbrella/0 vs nấm đỏ chấm trắng Mushroom/0
  ['Cheese', 'Pizza'], ['Cheese', 'Cake'],   // miếng tam giác vàng; Cake/3 là cheesecake
  ['Pottery', 'Honey'],        // hũ gốm có nắp Pottery/4 vs hũ mật Honey/0
  ['Pottery', 'Cactus'],       // xương rồng trong chậu đất Cactus/3, /4 vs bình đất nung Pottery/0
  ['Mask', 'Glasses'],         // mặt nạ che mắt Mask/0, /1, /6 vs kính
  ['Winter', 'Weather'],       // đống tuyết Winter/7 vs mây Weather/3
  ['Stationery', 'Painting'],  // bút chì, hộp bút Stationery/0, /7 vs cọ, hộp màu Painting/1, /4
  // Chương 12-13 (agent Art + duyệt ảnh thật 2026-10-15): Sewing/2 là gối cắm kim hình cà chua có quả dâu.
  ['Sewing', 'Knitting'], ['Sewing', 'Vegetable'], ['Sewing', 'Fruit'],
  ['Snow Sports', 'Winter'],   // xe trượt tuyết Winter/5 là đồ thể thao tuyết
  ['Books', 'Stationery'],     // sách mở Books/1 vs sổ lò xo Stationery/6
  // Không thêm ở ch12-13: Fireplace-Candle (lửa lò khác nến), Bicycle-Car.
  // Không thêm (ảnh thật không giống): Picnic-Bread, Picnic-Juice, Fireworks-Flower (pháo hoa trên nền trời tối), Origami-Aircraft
  // (không có máy bay giấy), Keys-Treasure (không có chìa), Fishing-Float (chỉ phao câu nhỏ).
];

// Art gần trùng TRONG một chủ đề (agent Art 2026-10-15): khi chọn n art cho level, tránh lấy 2 art cùng nhóm nếu còn art khác.
// Winter/0-3 đều là người tuyết; Cactus/1 và /6 là hai cây tròn có hoa (chỉ khác màu hoa).
export const ART_TWINS = { Winter: [[0, 1, 2, 3]], Cactus: [[1, 6]] };
/** Xáo art của chủ đề rồi lấy n art; art thứ 2+ của một nhóm ART_TWINS bị đẩy xuống cuối (chỉ dùng khi không còn art khác).
 *  Chủ đề không có nhóm: kết quả và số lần gọi r() giống hệt shuffle(availableArts(t)) -> level cũ không đổi. */
export function pickArts(t, n, r, exclude = []) {
  const order = shuffle(availableArts(t).filter(a => !exclude.includes(a)), r);
  const groups = ART_TWINS[t];
  if (!groups) return order.slice(0, n);
  const seen = new Set(), first = [], rest = [];
  for (const a of order) {
    const g = groups.findIndex(G => G.includes(a));
    if (g >= 0 && seen.has(g)) rest.push(a); else { if (g >= 0) seen.add(g); first.push(a); }
  }
  return [...first, ...rest].slice(0, n);
}
/** Các cặp art gần trùng cùng có trong level (cảnh báo của validator). */
export function twinHits(cards) {
  const out = [];
  for (const [t, groups] of Object.entries(ART_TWINS)) for (const G of groups) {
    const got = cards.filter(c => c.k === 'stamp' && c.t === t && G.includes(c.art)).map(c => c.art);
    if (got.length > 1) out.push(`${t} ${got.sort((a, b) => a - b).join('/')}`);
  }
  return out;
}
const confuseSet = new Set(CONFUSE.flatMap(([a, b]) => [a + '|' + b, b + '|' + a]));
export const confuses = (a, b) => confuseSet.has(a + '|' + b);
/** Các cặp CONFUSE trong một danh sách chủ đề. */
export const confusePairs = topics => {
  const out = [];
  for (let i = 0; i < topics.length; i++) for (let j = i + 1; j < topics.length; j++) if (confuses(topics[i], topics[j])) out.push([topics[i], topics[j]]);
  return out;
};

// ---------------------------------------------------------------- ngẫu nhiên tất định
export function rng(seed) {
  let x = seed >>> 0 || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
export function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/** FNV-1a 32-bit, dùng để phá hoà tất định. */
export function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

// ---------------------------------------------------------------- người chơi mô phỏng
// Tham số cho solver.js playHidden/sampleHidden (KHÔNG nhìn trộm lá úp). Bảng "Profile mô phỏng" của plan.
export const PROFILES = {
  c10: { width: 2, depth: 6, noise: 1.6, mistake: 0.10, capMoves: 260 },   // phổ thông
  c25: { width: 2, depth: 6, noise: 1.6, mistake: 0.25, capMoves: 260 },   // người mới (NEWBIE của gen_proto_levels)
  o35: { width: 2, depth: 4, noise: 2.0, mistake: 0.35, capMoves: 260 },   // người lớn tuổi mới chơi
  sk: { width: 4, depth: 22, noise: 0.8, mistake: 0, capMoves: 260 },      // người giỏi
};
// Giây mỗi nước [GIẢ THUYẾT] (difficulty_report.mjs + review GD v2)
export const SEC_PER_MOVE = { c10: 3.2, c25: 3.8, o35: 4.5, sk: 2.2 };

// ---------------------------------------------------------------- công bằng của layout
const EARLY_ROLES = new Set(['tutorial', 'teach', 'breather', 'br', 'intro-br']);
/** Port của fair() trong gen_proto_levels.mjs. role: vai trò level; introduce: chủ đề mới phải thấy sớm. */
export function fair(role, lv, introduce = null) {
  const tops = lv.columns.map(c => c[c.length - 1]).filter(Boolean);
  const early = EARLY_ROLES.has(role);
  const firstDeck = lv.deck.slice(0, early ? 3 : 6);
  if (![...tops, ...firstDeck].some(c => c.k === 'topic')) return false;
  if (role === 'tutorial') {
    if (tops.filter(c => c.k === 'topic').length !== 1) return false;
    const tt = tops.find(c => c.k === 'topic').t;
    if (!tops.some(c => c.k === 'stamp' && c.t === tt)) return false;
  }
  // chủ đề mới: tem vương miện ngửa trên đỉnh cột hoặc nằm trong 3 lá rút đầu
  if (introduce && introduce.length && !introduce.every(tp => [...tops, ...lv.deck.slice(0, 3)].some(c => c.k === 'topic' && c.t === tp))) return false;
  // level sớm/nghỉ: không chôn 2+ tem vương miện ở đáy các cột cao
  if (early && lv.columns.filter(c => c.length >= 3 && c[0].k === 'topic').length > 1) return false;
  return true;
}

// ---------------------------------------------------------------- tiện ích level
export const allCards = lv => [...lv.columns.flat(), ...lv.deck, ...(lv.preplaced || []).flat()];
export const cardCount = lv => allCards(lv).length;
/** { chủ đề: số tem thường } của một level đã sinh. */
export function topicsOf(lv) {
  const out = {};
  for (const c of allCards(lv)) if (c.k === 'topic') out[c.t] = c.n;
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`${BASE_TOPICS.length} chủ đề dùng được (đã bỏ ${[...EXCLUDED].join(', ')}):`);
  console.log(BASE_TOPICS.map(t => `${t}:${artCount(t)}`).join(', '));
  console.log(`\n${CONFUSE.length} cặp CONFUSE:`);
  console.log(CONFUSE.map(p => p.join(' <-> ')).join('; '));
}
