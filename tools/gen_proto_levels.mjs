#!/usr/bin/env node
// Sinh 10 level cho prototype/stamp theo DESIGN bên dưới (xem docs/design/prototype-10-levels.md).
// Mỗi level: thử nhiều seed -> solver (beam) đo số move tối thiểu -> chọn ngân sách moves nhỏ nhất
// để người chơi mô phỏng đạt tỉ lệ thắng mục tiêu, nhưng không thấp hơn solver x minSlack.
// Chạy: node tools/gen_proto_levels.mjs   (ghi prototype/stamp/src/levels.js)
import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createState } from '../prototype/stamp/src/engine.js';
import { solve, sampleHidden } from '../prototype/stamp/src/solver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(ROOT + 'prototype/stamp/assets/manifest.json', 'utf8'));

// Level 1-9 dựng từ video YouTube fXxL3sDSrFA (bản mới hơn APK 0.9.5): số ô, cột, deck, moves, topic và n
// đọc bằng OCR (tools/ocr_frames.swift) + xem frame. Topic video -> topic có art trong APK (Cow->Hoofed, Clock->Time,
// Animals->Beast, Music Note->Notes, Butterfly->Insect, Marine Animal->Sea life, Summer Trip->Float, Grill->Grilled,
// Pet Supplies->Pet Care). Thứ tự lá úp không thấy trong video: generator chọn seed khớp số moves của video.
// target = tỉ lệ thắng mong muốn của người chơi mô phỏng ở đúng số moves của video.
const DESIGN = [
  { role: 'tutorial', fixed: 'L1', unlock: null, note: 'Dựng tay theo video level 1: Cat/Fruit/Pizza, 3 cột, deck 7, kịch bản ép 7 bước.' },
  { role: 'teach', F: 3, cols: [3, 4, 5], moves: 66, target: 0.95, unlock: 'hint',
    topics: { Ball: 6, Dog: 4, Noodle: 4, Phone: 4, Bird: 3, Car: 3 }, note: 'Video L2 = APK L2 (Zoo->Dog, Coffee->Phone). Mở Hint.' },
  { role: 'teach', F: 4, cols: [2, 3, 4, 5], moves: 75, target: 0.9, unlock: null,
    topics: { Hoofed: 4, Ship: 6, Candy: 5, Balloon: 5, Time: 5, Hat: 4 }, note: 'Video L3: 4 ô.' },
  { role: 'normal', F: 4, cols: [3, 4, 5, 6], moves: 82, target: 0.85, unlock: 'pack', preplace: 'Dinosaur',
    topics: { Dinosaur: 4, Glasses: 5, Pets: 5, 'Fast food': 5, Chess: 4, Car: 4, Flower: 5, Leaf: 3 },
    script: [{ text: 'Tap <em>Pack</em>: 2 hidden stamps jump in.', booster: 'pack', slot: 0 }],
    note: 'Video L4: ô Dinosaur mở sẵn để dạy Pack.' },
  // Mốc UA 1: level khó "không thể thua" (Overtime). Video: người chơi giỏi chỉ còn 6 moves khi thắng L5 -> nhiều khả năng
  // game gốc cũng dùng L5 làm mốc khó [GIẢ THUYẾT]. target thấp = đa số người chơi sẽ hết moves và vào Overtime.
  // Review game design 2026-10-10: L5 cũ kẹt cứng 65-80% (người chơi không nhìn trộm) -> phải tặng Joker chưa dạy.
  // Sinh lại theo khuôn L10: ít kẹt (phổ thông <= 25%), thiếu moves vừa phải (phổ thông thắng 15-25%, giỏi 40-50%) -> đa số vào Overtime khi gần xong.
  // Bớt 2 lá (xe buýt, diều cá mập) nên khoảng moves nới xuống 84-96; kết quả 2026-10-10: 86 moves, kẹt 0%, phổ thông 22%, giỏi 38%.
  // Bỏ tem xe buýt 2 tầng (Truck, nhầm với Train) và diều cá mập (Kite).
  { role: 'hard', special: 'hard', F: 4, cols: [3, 4, 5, 6], moves: 96, movesRange: [84, 96], target: 0.2, skilledTarget: 0.45, maxStuck: 0.25,
    unlock: null, avoid: { Truck: [3], Kite: [3] },
    topics: { Dog: 6, Train: 6, Tree: 5, Soda: 6, 'Ice cream': 6, Fruit: 6, Truck: 3, Kite: 4 },
    note: 'Video L5 (moves 96). MỐC UA 1: thiếu moves chứ không kẹt; hết moves vào Overtime, không thể thua.' },
  // Review 2026-10-10: Sauce (chai) nhầm với Soft drink (chai) -> đổi sang Bird. Mục tiêu người mới >= 90%.
  { role: 'normal', F: 4, cols: [3, 4, 5, 6], moves: 76, target: 0.98, newbieTarget: 0.9, unlock: null,
    topics: { 'Soft drink': 6, Planet: 5, Beast: 4, Notes: 5, Bird: 3, Vegetable: 6, Insect: 4 }, note: 'Video L6 (Sauce -> Bird).' },
  // Review 2026-10-10: Zoo (hải cẩu, chim cánh cụt...) nhầm với Sea life / Float, kính lặn + kính trượt tuyết nhầm với Float.
  // Thay Zoo bằng Cake, Glasses 8 -> 6 (bỏ kính trượt tuyết, kính lặn; 2 art này sau đó được vẽ lại thành kính cận). Moves 79: người mới ~75-80%.
  { role: 'normal', F: 4, cols: [3, 4, 5, 6], moves: 79, target: 0.9, unlock: 'stamper', preplace: 'Sea life',
    topics: { 'Sea life': 6, Glasses: 6, Float: 6, Tea: 5, Notes: 3, Car: 5, Cake: 5 },
    script: [{ text: 'Tap <em>Stamper</em>, then tap the pile.', booster: 'stamper', slot: 0 }],
    note: 'Video L7: ô Marine Animal mở sẵn để dạy Stamper.' },
  // Review 2026-10-10: Raw meat nhầm với Grilled (bít tết sống/nướng) và lệch tone -> đổi sang Ship. Dango (Desserts) đã vẽ lại thành macaron.
  { role: 'normal', F: 4, cols: [3, 4, 5, 7], moves: 75, target: 0.97, newbieTarget: 0.85, unlock: null,
    topics: { Footwear: 4, Ship: 5, Outerwear: 5, Cocktail: 5, Desserts: 5, Grilled: 5, Bouquet: 5 }, note: 'Video L8 (Raw meat -> Ship).' },
  // Review 2026-10-10: số liệu cho thấy L9 là level nghỉ (biên 25%) -> nhãn breather. Balloon (bóng sư tử nhầm với Zoo) -> Candy (kẹo bông đã vẽ lại).
  { role: 'breather', F: 4, cols: [3, 4, 5, 6], moves: 110, target: 0.97, unlock: 'joker',
    topics: { Zoo: 5, Sculpture: 5, Pizza: 5, Sashimi: 5, Candy: 5, 'Pet Care': 5, 'Water Plants': 5, Gardening: 5 },
    script: [{ text: 'Tap <em>Joker</em>, then tap a column.', booster: 'joker', col: 1 }],
    note: 'Video L9: mở Joker, dùng ngay đầu level.' },
  // Mốc UA 2: level siêu khó cuối chương, cũng không thể thua.
  { role: 'superhard', special: 'superhard', F: 5, cols: [3, 4, 5, 6, 7], moves: null, target: 0.25, unlock: null,
    topics: { Cat: 6, Coffee: 6, 'Music Inst': 6, Cake: 6, Aircraft: 6, Mushroom: 6, Gems: 5, Sushi: 5, Tool: 5 },
    note: 'Finale riêng (video dừng ở L9). MỐC UA 2: siêu khó, hết moves vào Overtime, không thể thua.' },
  // ---------------- CHƯƠNG 2: BẾN CẢNG (L11-L20, concept-little-post-office.md mục 3.1) ----------------
  // Không có video gốc: moves chọn theo target (người chơi phổ thông, không nhìn trộm), sàn = solver x slack,
  // rồi nâng lên cho tới khi người mới (phí 25%) thắng >= newbieMin (review FTUE 2026-10-10 #15: L12 người mới chỉ 40%).
  // Người dùng chốt đối tượng là người lớn tuổi, tone chill (2026-10-10): level thường >= 80%, bump 75-80%, mở đầu chương 85-90%.
  // Mỗi level mở đầu chỉ giới thiệu 1 chủ đề mới (introduce), tem vương miện của nó ngửa sẵn trên cột hoặc trong 3 lá rút đầu (#14).
  // Seafood và Shells không bao giờ chung level (#16). Đường cong: dễ -> tăng dần -> L15 mốc khó (Overtime) -> L16 nghỉ -> L20 siêu khó.
  { role: 'breather', F: 4, cols: [3, 4, 5, 6], moves: null, target: 0.97, slack: 1.25, newbieMin: 0.9, unlock: null, chapter: 2, introduce: ['Sailboats'],
    topics: { Sailboats: 5, 'Ice cream': 5, Fruit: 5, Kite: 4, Glasses: 5, Hat: 4 }, note: 'Chương 2 mở màn (nghỉ): giới thiệu Sailboats.' },
  { role: 'normal', F: 4, cols: [3, 4, 5, 6], moves: null, target: 0.92, slack: 1.18, newbieMin: 0.85, unlock: null, chapter: 2, introduce: ['Shells'],
    topics: { Shells: 5, Sailboats: 5, Float: 5, Soda: 5, Footwear: 4, Tree: 4, Bird: 3 }, note: 'Giới thiệu Shells.' },
  { role: 'normal', F: 4, cols: [3, 4, 5, 6], moves: null, target: 0.9, slack: 1.14, newbieMin: 0.8, unlock: null, chapter: 2, introduce: ['Seafood'],
    topics: { Seafood: 5, Sailboats: 6, Cocktail: 5, Flower: 5, Hat: 4, Cake: 5, Insect: 4 }, note: 'Giới thiệu Seafood.' },
  { role: 'bump', F: 4, cols: [3, 4, 5, 6], moves: null, target: 0.85, slack: 1.1, newbieMin: 0.8, unlock: null, chapter: 2, introduce: ['Nautical'],
    topics: { Nautical: 6, Shells: 6, 'Ice cream': 6, Kite: 5, Bird: 3, Coffee: 5, Bouquet: 5, Footwear: 4 }, note: 'Giới thiệu Nautical, 8 chủ đề, bump trước mốc khó.' },
  { role: 'hard', special: 'hard', F: 4, cols: [3, 4, 5, 6], moves: null, target: 0.2, skilledTarget: 0.45, maxStuck: 0.25, unlock: null, chapter: 2,
    topics: { Sailboats: 6, Seafood: 6, Nautical: 6, 'Soft drink': 6, Fruit: 6, Hat: 4, Glasses: 5, Cake: 5 },
    note: 'MỐC KHÓ chương 2 (khuôn L5): thiếu moves chứ không kẹt; hết moves vào Overtime, không thể thua.' },
  { role: 'breather', F: 4, cols: [3, 4, 5, 6], moves: null, target: 0.97, slack: 1.3, newbieMin: 0.9, unlock: null, chapter: 2,
    topics: { Float: 5, Tree: 5, Flower: 5, Cake: 5, Sailboats: 5, Time: 5, Bird: 3 }, note: 'Level nghỉ sau mốc khó.' },
  { role: 'normal', F: 4, cols: [3, 4, 5, 7], moves: null, target: 0.88, slack: 1.12, newbieMin: 0.8, unlock: null, chapter: 2,
    topics: { Nautical: 6, Seafood: 6, Kite: 5, Tea: 5, Glasses: 6, Cocktail: 5, Insect: 4 }, note: '' },
  { role: 'normal', F: 4, cols: [3, 4, 5, 6], moves: null, target: 0.85, slack: 1.1, newbieMin: 0.8, unlock: null, chapter: 2,
    topics: { Shells: 6, Sailboats: 6, Soda: 6, 'Ice cream': 6, Footwear: 4, Bouquet: 5, Dog: 6 }, note: '' },
  { role: 'bump', F: 4, cols: [3, 4, 5, 7], moves: null, target: 0.8, slack: 1.08, newbieMin: 0.75, unlock: null, chapter: 2,
    topics: { Seafood: 6, Nautical: 6, Float: 6, Fruit: 6, Coffee: 6, Flower: 5, Hat: 4, Bird: 3 }, note: '8 chủ đề trước finale.' },
  { role: 'superhard', special: 'superhard', F: 5, cols: [3, 4, 5, 6, 7], moves: null, target: 0.25, unlock: null, chapter: 2,
    topics: { Sailboats: 6, Shells: 6, Nautical: 6, 'Ice cream': 6, Cocktail: 5, Kite: 5, Glasses: 5, Tree: 5, Coffee: 5 },
    note: 'Finale chương 2. MỐC siêu khó, hết moves vào Overtime, không thể thua.' },
];

// Cặp chủ đề dễ nhầm (art giống nhau): không bao giờ đặt chung một level (so sánh art 2026-10-10).
// Seafood có hàu, vẹm; Shells có nghêu, ốc móng tay (người Việt coi là hải sản). Ship có thuyền buồm; Sea life có vỏ sò ngọc trai và bạch tuộc; Grilled có cá nướng; Sushi/Sashimi có tôm; Ball có bóng bãi biển.
const CONFUSE = [['Seafood', 'Shells'], ['Sailboats', 'Ship'], ['Shells', 'Sea life'], ['Seafood', 'Sea life'], ['Seafood', 'Grilled'], ['Seafood', 'Sushi'],
  ['Seafood', 'Sashimi'], ['Nautical', 'Ship'], ['Ball', 'Float'], ['Soda', 'Soft drink'], ['Coffee', 'Tea'], ['Nautical', 'Time']];   // la bàn giống đồng hồ quả quýt   // Truck-Train ở A L5 đã xử lý bằng avoid (bỏ tem xe buýt)

// VARIANT B (review game design 2026-10-10, mục 23): luật riêng để A/B với Baseline A (clone ABI ở trên).
// Mỗi level tối đa 6 chủ đề, không có cặp dễ nhầm trước tier 3 (bỏ Truck cạnh Train, Float cạnh Sea life,
// Sculpture tương phản thấp, Sashimi lệch tone). Ít lá hơn nên moves không theo video: chọn theo target như L10.
// Chạy: node tools/gen_proto_levels.mjs --variant=b   (ghi prototype/stamp/src/levels_b.js)
const VARIANT_B = {
  4: { topics: { Dinosaur: 4, Glasses: 5, Pets: 5, 'Fast food': 5, Flower: 5, Chess: 4 } },
  5: { topics: { Dog: 6, Train: 6, Tree: 5, Soda: 6, 'Ice cream': 6, Fruit: 6 } },
  6: { topics: { 'Soft drink': 6, Planet: 5, Beast: 4, Notes: 5, Bird: 3, Vegetable: 6 } },
  7: { topics: { 'Sea life': 6, Glasses: 6, Tea: 5, Notes: 4, Car: 5, Cake: 5 } },
  8: { topics: { Footwear: 4, Ship: 5, Outerwear: 5, Cocktail: 5, Desserts: 5, Bouquet: 5 } },
  9: { topics: { Zoo: 5, Pizza: 5, Candy: 5, 'Pet Care': 5, 'Water Plants': 5, Gardening: 5 } },
  10: { topics: { Cat: 6, Coffee: 6, 'Music Inst': 6, Aircraft: 6, Mushroom: 6, Gems: 5 } },
  11: { topics: { Sailboats: 5, 'Ice cream': 5, Fruit: 5, Kite: 4, Glasses: 5, Hat: 4 } },
  12: { topics: { Shells: 5, Sailboats: 5, Float: 5, Soda: 5, Footwear: 4, Tree: 4 } },
  13: { topics: { Seafood: 5, Sailboats: 6, Cocktail: 5, Flower: 5, Hat: 4, Cake: 5 } },
  14: { topics: { Nautical: 6, Shells: 6, 'Ice cream': 6, Kite: 5, Coffee: 5, Bouquet: 5 } },
  15: { topics: { Sailboats: 6, Seafood: 6, Nautical: 6, 'Soft drink': 6, Fruit: 6, Glasses: 5 } },
  16: { topics: { Float: 5, Tree: 5, Flower: 5, Cake: 5, Sailboats: 5, Time: 5 } },
  17: { topics: { Nautical: 6, Seafood: 6, Kite: 5, Tea: 5, Glasses: 6, Cocktail: 5 } },
  18: { topics: { Shells: 6, Sailboats: 6, Soda: 6, 'Ice cream': 6, Bouquet: 5, Dog: 6 } },
  19: { topics: { Seafood: 6, Nautical: 6, Float: 6, Fruit: 6, Coffee: 6, Flower: 5 } },
  20: { F: 4, topics: { Sailboats: 6, Shells: 6, Nautical: 6, 'Ice cream': 6, Cocktail: 5, Kite: 5 } },   // 6 chủ đề + 5 khay thì quá dễ (casual 67%) -> 4 khay
};
const VARIANT = (process.argv.find(a => a.startsWith('--variant=')) || '').slice(10) || 'a';
if (VARIANT === 'b') {
  // Giữ biên moves như A (moves / solver của từng level ở levels-report.json) để A/B chỉ khác luật chủ đề, không khác độ rộng moves
  const repA = JSON.parse(readFileSync(ROOT + 'prototype/stamp/levels-report.json', 'utf8'));
  for (const [L, o] of Object.entries(VARIANT_B)) {
    const d = DESIGN[L - 1];
    if (!d.special) o.slackB = repA[L - 1].slack;
    Object.assign(d, o, { moves: null, movesRange: undefined, newbieTarget: undefined, skilledTarget: undefined,
      note: 'Variant B: ' + Object.keys(o.topics).length + ' chủ đề, không cặp dễ nhầm. ' + d.note });
  }
}
for (const [i, d] of DESIGN.entries()) {
  for (const [x, y] of CONFUSE) if (d.topics && d.topics[x] && d.topics[y]) throw new Error(`L${i + 1}: ${x} và ${y} dễ nhầm, không được chung level`);
}
const SUFFIX = VARIANT === 'b' ? '_b' : '';

// Level 1 theo video (art index xem prototype/stamp/assets/cards/<topic>/): đáy -> đỉnh; deck theo thứ tự rút.
function buildL1() {
  const T = (id, t, n) => ({ id, t, k: 'topic', n });
  const C = (id, t, art) => ({ id, t, k: 'stamp', art });
  // Review FTUE #4 / QA #1 (2026-10-10): lá 2 trước là tem Mèo ngửa ngay khi dời vương miện -> kéo vào ô Mèo (đúng luật) bị kịch bản chặn.
  // Đổi thành tem Pizza (chưa có ô Pizza) để bước 1 và bước 3 chỉ còn đúng một nước hợp lệ có ích.
  const cat = T(0, 'Cat', 3), white = C(1, 'Cat', 5), tabby = C(2, 'Pizza', 4), orangeCat = C(3, 'Cat', 6), grey = C(4, 'Cat', 1);
  const fruit = T(10, 'Fruit', 6), apple = C(11, 'Fruit', 6), orange = C(12, 'Fruit', 4), melon = C(13, 'Fruit', 0),
    pine = C(14, 'Fruit', 1), straw = C(15, 'Fruit', 2), banana = C(16, 'Fruit', 5);
  const pizza = T(20, 'Pizza', 4), p1 = C(21, 'Pizza', 0), p2 = C(22, 'Pizza', 1), p3 = C(23, 'Pizza', 7);
  return {
    foundations: 3, moves: null, preplaced: [],
    columns: [[apple, white], [banana, tabby, cat], [p1, pine, melon, orange]],
    deck: [fruit, straw, pizza, p2, p3, orangeCat, grey],
    script: [
      { text: 'Drag the <em>crown stamp</em> to an empty slot.', src: 0, dst: { found: 1 } },
      { text: 'Add a <em>matching</em> stamp to its pile.', src: 1, dst: { found: 1 } },
      { text: 'No match? Tap the <em>deck</em>.', draw: true },
      { text: 'New crown stamp! Start another pile.', src: 10, dst: { found: 2 } },
      { text: '<em>Stack</em> stamps of the same kind.', src: 12, dst: { onto: 11 } },
      { text: 'A whole <em>stack</em> moves together.', src: 11, dst: { onto: 13 } },
      { text: 'Send the stack in <em>1 move</em>!', src: 13, dst: { found: 2 } },
      { text: 'Fill every pile to <em>win</em>!', info: true, ms: 2600 },
    ],
  };
}

function rng(seed) {
  let x = seed >>> 0 || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
// Art thật đang có trong assets (đã bỏ các file tem APK không dùng): chỉ chọn trong số này.
const slug = t => t.toLowerCase().replace(/ /g, '_').replace(/&/g, 'and');
function availableArts(t) {
  const dir = ROOT + 'prototype/stamp/assets/cards/' + slug(t);
  if (!existsSync(dir)) return [...Array(manifest[t].arts).keys()];
  return readdirSync(dir).map(f => f.match(/^(\d+)\.png$/)).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b);
}
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function build(d, seed) {
  const r = rng(seed * 7919 + 13);
  const cards = [];
  const pre = [];
  let id = 0;
  for (const [t, n] of Object.entries(d.topics)) {
    const arts = shuffle(availableArts(t).filter(a => !(d.avoid && d.avoid[t] || []).includes(a)), r).slice(0, n);
    if (arts.length < n) throw new Error(`${t}: chỉ có ${arts.length} art dùng được, cần ${n}`);
    const topic = { id: id++, t, k: 'topic', n };
    if (d.preplace === t) pre.push([topic]); else cards.push(topic);
    for (const a of arts) cards.push({ id: id++, t, k: 'stamp', art: a });
  }
  shuffle(cards, r);
  const columns = d.cols.map(() => []);
  let p = 0;
  d.cols.forEach((n, i) => { columns[i] = cards.slice(p, p + n); p += n; });
  const deck = cards.slice(p);
  return { foundations: d.F, moves: d.moves ?? null, columns, deck, preplaced: pre };
}
function fair(d, lv) {
  const tops = lv.columns.map(c => c[c.length - 1]);
  const early = d.role === 'tutorial' || d.role === 'teach' || d.role === 'breather';
  // có ít nhất 1 tem chủ đề nhìn thấy/rút sớm
  const firstDeck = lv.deck.slice(0, early ? 3 : 6);
  if (![...tops, ...firstDeck].some(c => c.k === 'topic')) return false;
  if (d.role === 'tutorial') {
    if (tops.filter(c => c.k === 'topic').length !== 1) return false;
    // có ít nhất 1 tem thường cùng chủ đề đó nằm ở đỉnh cột khác
    const tt = tops.find(c => c.k === 'topic').t;
    if (!tops.some(c => c.k === 'stamp' && c.t === tt)) return false;
  }
  // level giới thiệu chủ đề mới: tem vương miện của nó ngửa trên đỉnh cột hoặc nằm trong 3 lá rút đầu
  if (d.introduce && !d.introduce.every(tp => [...tops, ...lv.deck.slice(0, 3)].some(c => c.k === 'topic' && c.t === tp))) return false;
  // không để cả 3+ tem chủ đề chôn đáy các cột cao nhất ở level sớm
  if (early && lv.columns.filter(c => c.length >= 3 && c[0].k === 'topic').length > 1) return false;
  return true;
}

// Mức sàn moves = solver x slack (người thật cần nhiều nước hơn solver full-info).
const SLACK = { teach: 2.0, breather: 1.8, normal: 1.5, bump: 1.45, wall: 1.3, finale: 1.3, hard: 1.0, superhard: 1.03 };
// Tỉ lệ KẸT CỨNG tối đa của người chơi mô phỏng (không nhìn trộm lá úp, profile phổ thông) khi chọn seed.
const MAX_FAIL = { tutorial: 0, teach: 0.05, breather: 0.05, normal: 0.15, bump: 0.2, wall: 0.3, finale: 0.25, hard: 0.25, superhard: 0.3 };
// Người chơi mô phỏng dùng để chọn level = profile "phổ thông" của tools/difficulty_report.mjs (KHÔNG nhìn trộm lá úp).
// Trước 2026-10-10 generator dùng solver nhìn được lá úp nên số "thắng mô phỏng" lệch hẳn báo cáo độ khó (L5: 0.93 vs 13%).
const CASUAL = { width: 2, depth: 6, noise: 1.6, mistake: 0.10, capMoves: 260 };
const SKILLED = { width: 4, depth: 22, noise: 0.8, mistake: 0, capMoves: 260 };
const NEWBIE = { width: 2, depth: 6, noise: 1.6, mistake: 0.25, capMoves: 260 };
const sim = (lv, prof, runs, seed) => { const r = sampleHidden(createState(lv), { runs, seed, ...prof }); return { dist: r.dist, stuck: r.deadlocks / runs }; };

// --only=5,10 : chỉ sinh lại các level này, giữ nguyên level khác từ levels.js / levels-report.json hiện có
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean).map(Number);
let OLD = null, OLD_REPORT = null;
if (ONLY.length) {
  OLD = (await import(ROOT + `prototype/stamp/src/levels${SUFFIX}.js?` + Date.now())).LEVELS;
  OLD_REPORT = JSON.parse(readFileSync(ROOT + `prototype/stamp/levels-report${SUFFIX}.json`, 'utf8'));
}
const out = [];
const report = [];
const SIM_RUNS = 24;
const winAt = (dist, m) => dist.filter(x => x <= m).length / dist.length;
for (let li = 0; li < DESIGN.length; li++) {
  const d = DESIGN[li];
  if (ONLY.length && !ONLY.includes(li + 1)) {
    out.push(OLD[li]);
    report.push(OLD_REPORT[li]);
    continue;
  }
  if (d.fixed === 'L1') {
    const lv = buildL1();
    const res = solve(createState(lv), { width: 800 });
    out.push({ id: 1, role: d.role, unlock: d.unlock, note: d.note, seed: 0, solverMoves: res.moves, winRateSim: 1, ...lv });
    report.push({ L: 1, role: d.role, F: 3, cols: '2-3-4', topics: 3, cards: 16, deck: 7, solver: res.moves, moves: 'inf', video: 'inf', winSim: 1 });
    console.log(JSON.stringify(report[report.length - 1]));
    continue;
  }
  const tries = [];
  // Moves của video chặt: ưu tiên seed có solver <= 85% moves; nếu hiếm thì nới dần (ghi lại trong report).
  let ratio = d.special ? 1.0 : 0.85;          // level khó: cho phép seed sát moves
  let checked = 0;
  const wantTries = d.special ? 40 : 10;          // level khó: thử nhiều layout hơn để tìm cái đủ khó
  for (let seed = 1; tries.length < wantTries && seed < 900; seed++) {
    if (seed % 150 === 0 && tries.length < 3) ratio += 0.05;
    const lv = build(d, li * 1000 + seed);
    if (!fair(d, lv)) continue;
    const res = solve(createState(lv), { width: 300 });
    if (!res) continue;
    checked++;
    const maxMoves = d.movesRange ? d.movesRange[1] : d.moves;
    if (maxMoves != null && res.moves > maxMoves * ratio) continue;
    const { dist, stuck } = sim(lv, CASUAL, SIM_RUNS, seed);
    if (stuck > (d.maxStuck ?? MAX_FAIL[d.role])) continue;
    // ngân sách: cố định theo video, hoặc chọn trong khoảng cho tỉ lệ thắng gần target nhất
    let budget = d.moves;
    if (d.movesRange) {
      let bestErr = Infinity;
      for (let m = d.movesRange[0]; m <= d.movesRange[1]; m++) { const e = Math.abs(winAt(dist, m) - d.target); if (e < bestErr) { bestErr = e; budget = m; } }
    }
    tries.push({ seed: li * 1000 + seed, lv, solver: res.moves, dist, stuck, budget });
  }
  process.stderr.write(`L${li + 1}: ${tries.length} seed hợp lệ / ${checked} đã giải, ratio ${ratio.toFixed(2)}\n`);
  if (!tries.length) throw new Error('không sinh được level ' + (li + 1));
  let pick;
  if (d.moves != null) {
    // seed có tỉ lệ thắng (người chơi phổ thông, không nhìn trộm) tại ngân sách moves gần target nhất
    tries.sort((a, b) => Math.abs(winAt(a.dist, a.budget) - d.target) - Math.abs(winAt(b.dist, b.budget) - d.target) || a.stuck - b.stuck || a.solver - b.solver);
    pick = tries[0];
    if (d.newbieTarget != null) {
      // level thường: trong các seed phổ thông đã thắng gần target, chọn seed người mới (phí 25%) thắng cao nhất
      const top = tries.filter(x => Math.abs(winAt(x.dist, x.budget) - d.target) <= 0.05).slice(0, 8);
      for (const x of top) x.newbie = winAt(sim(x.lv, NEWBIE, 30, x.seed).dist, x.budget);
      top.sort((a, b) => b.newbie - a.newbie);
      if (top.length) pick = top[0];
    }
    if (d.skilledTarget != null) {
      // trong vài seed tốt nhất, chọn seed có người chơi giỏi thắng gần skilledTarget nhất
      const top = tries.slice(0, 5).filter(x => Math.abs(winAt(x.dist, x.budget) - d.target) <= 0.1);
      for (const x of top) x.skilled = winAt(sim(x.lv, SKILLED, 16, x.seed).dist, x.budget);
      top.sort((a, b) => Math.abs(a.skilled - d.skilledTarget) - Math.abs(b.skilled - d.skilledTarget));
      if (top.length) pick = top[0];
    }
  } else {
    tries.sort((a, b) => a.solver - b.solver);
    pick = tries[Math.floor(tries.length / 2)];
  }
  const exact = solve(createState(pick.lv), { width: 3000 });
  const solverMoves = Math.min(pick.solver, exact ? exact.moves : Infinity);
  const { dist, stuck } = sim(pick.lv, CASUAL, 60, pick.seed);
  let budget = pick.budget ?? d.moves;
  if (budget == null && d.slackB) budget = Math.ceil(solverMoves * d.slackB);
  if (budget == null) {
    const k = Math.min(dist.length - 1, Math.ceil(d.target * dist.length) - 1);
    budget = Math.max(Math.ceil(solverMoves * (d.slack ?? SLACK[d.role])), Number.isFinite(dist[k]) ? dist[k] : 0);
  }
  let newbieWin = null;
  if (d.newbieMin != null) {
    const nd = sim(pick.lv, NEWBIE, 40, pick.seed).dist;
    const k = Math.min(nd.length - 1, Math.ceil(d.newbieMin * nd.length) - 1);
    if (Number.isFinite(nd[k]) && nd[k] > budget) budget = nd[k];
    newbieWin = winAt(nd, budget);
  }
  const winSim = winAt(dist, budget);
  const lv = { ...pick.lv, moves: budget };
  const cardsN = lv.columns.flat().length + lv.deck.length + lv.preplaced.flat().length;
  out.push({ id: li + 1, role: d.role, unlock: d.unlock, note: d.note, seed: pick.seed, solverMoves, winRateSim: +winSim.toFixed(2),
    ...(d.special ? { special: d.special, safety: 'overtime' } : {}), ...(d.chapter ? { chapter: d.chapter } : {}), ...(d.introduce ? { introduce: d.introduce } : {}),
    ...(d.script ? { script: d.script } : {}), ...lv });
  report.push({ L: li + 1, role: d.role, F: d.F, cols: d.cols.join('-'), topics: Object.keys(d.topics).length, cards: cardsN,
    deck: lv.deck.length, solver: solverMoves, moves: budget, video: d.moves ?? '-', movesPerCard: +(budget / cardsN).toFixed(2),
    slack: +(budget / solverMoves).toFixed(2), winSim: +winSim.toFixed(2), stuckSim: +stuck.toFixed(2), ...(pick.skilled != null ? { skilledWin: +pick.skilled.toFixed(2) } : {}), ...(pick.newbie != null ? { newbieWin: +pick.newbie.toFixed(2) } : {}), ...(newbieWin != null ? { newbieWin: +newbieWin.toFixed(2) } : {}) });
  console.log(JSON.stringify(report[report.length - 1]));
}

const header = '// SINH TỰ ĐỘNG bởi tools/gen_proto_levels.mjs. Đừng sửa tay; sửa DESIGN rồi chạy lại.\n';
writeFileSync(ROOT + `prototype/stamp/src/levels${SUFFIX}.js`, header + 'export const LEVELS = ' + JSON.stringify(out) + ';\n');
writeFileSync(ROOT + `prototype/stamp/levels-report${SUFFIX}.json`, JSON.stringify(report, null, 1));
console.log(`-> prototype/stamp/src/levels${SUFFIX}.js`);
