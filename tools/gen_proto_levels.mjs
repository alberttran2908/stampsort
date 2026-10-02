#!/usr/bin/env node
// Sinh 10 level cho prototype/stamp theo DESIGN bên dưới (xem docs/design/prototype-10-levels.md).
// Mỗi level: thử nhiều seed -> solver (beam) đo số move tối thiểu -> chọn ngân sách moves nhỏ nhất
// để người chơi mô phỏng đạt tỉ lệ thắng mục tiêu, nhưng không thấp hơn solver x minSlack.
// Chạy: node tools/gen_proto_levels.mjs   (ghi prototype/stamp/src/levels.js)
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createState } from '../prototype/stamp/src/engine.js';
import { solve, sampleMovesNeeded } from '../prototype/stamp/src/solver.js';

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
  { role: 'hard', special: 'hard', F: 4, cols: [3, 4, 5, 6], moves: 96, target: 0.35, unlock: null,
    topics: { Dog: 6, Train: 6, Tree: 5, Soda: 6, 'Ice cream': 6, Fruit: 6, Truck: 4, Kite: 5 },
    note: 'Video L5 (moves 96). MỐC UA 1: level khó, hết moves vào Overtime, không thể thua.' },
  { role: 'normal', F: 4, cols: [3, 4, 5, 6], moves: 76, target: 0.8, unlock: null,
    topics: { 'Soft drink': 6, Planet: 5, Beast: 4, Notes: 5, Sauce: 3, Vegetable: 6, Insect: 4 }, note: 'Video L6.' },
  { role: 'normal', F: 4, cols: [3, 4, 5, 6], moves: 80, target: 0.75, unlock: 'stamper', preplace: 'Sea life',
    topics: { 'Sea life': 6, Glasses: 8, Float: 6, Tea: 5, Notes: 3, Car: 5, Zoo: 5 },
    script: [{ text: 'Tap <em>Stamper</em>, then tap the pile.', booster: 'stamper', slot: 0 }],
    note: 'Video L7: ô Marine Animal mở sẵn để dạy Stamper.' },
  { role: 'normal', F: 4, cols: [3, 4, 5, 7], moves: 75, target: 0.75, unlock: null,
    topics: { Footwear: 4, 'Raw meat': 5, Outerwear: 5, Cocktail: 5, Desserts: 5, Grilled: 5, Bouquet: 5 }, note: 'Video L8.' },
  { role: 'wall', F: 4, cols: [3, 4, 5, 6], moves: 110, target: 0.6, unlock: 'joker',
    topics: { Zoo: 5, Sculpture: 5, Pizza: 5, Sashimi: 5, Balloon: 5, 'Pet Care': 5, 'Water Plants': 5, Gardening: 5 },
    script: [{ text: 'Tap <em>Joker</em>, then tap a column.', booster: 'joker', col: 1 }],
    note: 'Video L9: mở Joker, dùng ngay đầu level.' },
  // Mốc UA 2: level siêu khó cuối chương, cũng không thể thua.
  { role: 'superhard', special: 'superhard', F: 5, cols: [3, 4, 5, 6, 7], moves: null, target: 0.25, unlock: null,
    topics: { Cat: 6, Coffee: 6, 'Music Inst': 6, Cake: 6, Aircraft: 6, Mushroom: 6, Gems: 5, Sushi: 5, Tool: 5 },
    note: 'Finale riêng (video dừng ở L9). MỐC UA 2: siêu khó, hết moves vào Overtime, không thể thua.' },
];

// Level 1 theo video (art index xem prototype/stamp/assets/cards/<topic>/): đáy -> đỉnh; deck theo thứ tự rút.
function buildL1() {
  const T = (id, t, n) => ({ id, t, k: 'topic', n });
  const C = (id, t, art) => ({ id, t, k: 'stamp', art });
  const cat = T(0, 'Cat', 4), white = C(1, 'Cat', 5), tabby = C(2, 'Cat', 2), orangeCat = C(3, 'Cat', 6), grey = C(4, 'Cat', 1);
  const fruit = T(10, 'Fruit', 6), apple = C(11, 'Fruit', 6), orange = C(12, 'Fruit', 4), melon = C(13, 'Fruit', 0),
    pine = C(14, 'Fruit', 1), straw = C(15, 'Fruit', 2), banana = C(16, 'Fruit', 5);
  const pizza = T(20, 'Pizza', 3), p1 = C(21, 'Pizza', 0), p2 = C(22, 'Pizza', 1), p3 = C(23, 'Pizza', 7);
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
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function build(d, seed) {
  const r = rng(seed * 7919 + 13);
  const cards = [];
  const pre = [];
  let id = 0;
  for (const [t, n] of Object.entries(d.topics)) {
    const arts = shuffle([...Array(manifest[t].arts).keys()], r).slice(0, n);
    if (arts.length < n) throw new Error(`${t}: chỉ có ${manifest[t].arts} art, cần ${n}`);
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
  // không để cả 3+ tem chủ đề chôn đáy các cột cao nhất ở level sớm
  if (early && lv.columns.filter(c => c.length >= 3 && c[0].k === 'topic').length > 1) return false;
  return true;
}

// Mức sàn moves = solver x slack (người thật cần nhiều nước hơn solver full-info).
const SLACK = { teach: 2.0, breather: 1.8, normal: 1.5, bump: 1.45, wall: 1.3, finale: 1.3, hard: 1.0, superhard: 1.03 };
// Tỉ lệ kẹt tối đa của người chơi mô phỏng khi chọn seed (layout dễ deadlock = bất công với người thật).
const MAX_FAIL = { tutorial: 0, teach: 0.03, breather: 0.03, normal: 0.1, bump: 0.2, wall: 0.4, finale: 0.25, hard: 0.3, superhard: 0.35 };

// --only=5,10 : chỉ sinh lại các level này, giữ nguyên level khác từ levels.js / levels-report.json hiện có
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean).map(Number);
let OLD = null, OLD_REPORT = null;
if (ONLY.length) {
  OLD = (await import(ROOT + 'prototype/stamp/src/levels.js?' + Date.now())).LEVELS;
  OLD_REPORT = JSON.parse(readFileSync(ROOT + 'prototype/stamp/levels-report.json', 'utf8'));
}
const out = [];
const report = [];
const SIM = { runs: 30, width: 5, noise: 1.5 };
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
    if (d.moves != null && res.moves > d.moves * ratio) continue;
    const dist = sampleMovesNeeded(createState(lv), { ...SIM, seed });
    const fail = dist.filter(m => !Number.isFinite(m)).length / dist.length;
    if (fail > MAX_FAIL[d.role]) continue;
    tries.push({ seed: li * 1000 + seed, lv, solver: res.moves, dist });
  }
  process.stderr.write(`L${li + 1}: ${tries.length} seed hợp lệ / ${checked} đã giải, ratio ${ratio.toFixed(2)}\n`);
  if (!tries.length) throw new Error('không sinh được level ' + (li + 1));
  let pick;
  if (d.moves != null) {
    // seed có tỉ lệ thắng mô phỏng tại đúng moves của video gần target nhất
    tries.sort((a, b) => Math.abs(winAt(a.dist, d.moves) - d.target) - Math.abs(winAt(b.dist, d.moves) - d.target) || a.solver - b.solver);
    pick = tries[0];
  } else {
    tries.sort((a, b) => a.solver - b.solver);
    pick = tries[Math.floor(tries.length / 2)];
  }
  const exact = solve(createState(pick.lv), { width: 3000 });
  const solverMoves = Math.min(pick.solver, exact ? exact.moves : Infinity);
  const dist = sampleMovesNeeded(createState(pick.lv), { ...SIM, runs: 80, seed: pick.seed });
  let budget = d.moves;
  if (budget == null) {
    const k = Math.min(dist.length - 1, Math.ceil(d.target * dist.length) - 1);
    budget = Math.max(Math.ceil(solverMoves * SLACK[d.role]), Number.isFinite(dist[k]) ? dist[k] : 0);
  }
  const winSim = winAt(dist, budget);
  const lv = { ...pick.lv, moves: budget };
  const cardsN = lv.columns.flat().length + lv.deck.length + lv.preplaced.flat().length;
  out.push({ id: li + 1, role: d.role, unlock: d.unlock, note: d.note, seed: pick.seed, solverMoves, winRateSim: +winSim.toFixed(2),
    ...(d.special ? { special: d.special, safety: 'overtime' } : {}),
    ...(d.script ? { script: d.script } : {}), ...lv });
  report.push({ L: li + 1, role: d.role, F: d.F, cols: d.cols.join('-'), topics: Object.keys(d.topics).length, cards: cardsN,
    deck: lv.deck.length, solver: solverMoves, moves: budget, video: d.moves ?? '-', movesPerCard: +(budget / cardsN).toFixed(2),
    slack: +(budget / solverMoves).toFixed(2), winSim: +winSim.toFixed(2) });
  console.log(JSON.stringify(report[report.length - 1]));
}

const header = '// SINH TỰ ĐỘNG bởi tools/gen_proto_levels.mjs. Đừng sửa tay; sửa DESIGN rồi chạy lại.\n';
writeFileSync(ROOT + 'prototype/stamp/src/levels.js', header + 'export const LEVELS = ' + JSON.stringify(out) + ';\n');
writeFileSync(ROOT + 'prototype/stamp/levels-report.json', JSON.stringify(report, null, 1));
console.log('-> prototype/stamp/src/levels.js');
