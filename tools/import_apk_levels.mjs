#!/usr/bin/env node
// Lấy level từ dữ liệu APK Stamp Solitaire 0.9.5 đã giải mã (research/apk/com.stamp.solit/levels/levels.json)
// thành level của prototype: giữ NGUYÊN bố cục cột, thứ tự bộ bài, số tem mỗi chủ đề (n); moves gốc nhưng tối thiểu 1.3 x tối ưu.
// Chủ đề APK chưa có art của mình thì thay bằng chủ đề có art (không trùng trong level, tránh cặp dễ nhầm).
// Chủ đề cần nhiều tem hơn số art đang có thì cho lặp art (cùng chủ đề nên không ảnh hưởng luật).
// Solver tính số nước tối ưu (dùng chấm Tem Điểm theo slack) và xác nhận level giải được.
//
// Chạy: node tools/import_apk_levels.mjs [--from=21 --count=40]   -> prototype/stamp/src/levels_apk.js
// Nguồn: [APK-LV] bản 0.9.5 (cũ hơn bản trong video). Bố cục là thiết kế của ABI: chỉ dùng cho prototype nội bộ.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createState } from '../prototype/stamp/src/engine.js';
import { solve } from '../prototype/stamp/src/solver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const arg = (k, d) => Number((process.argv.find(a => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=')[1]);
const FROM = arg('from', 21), COUNT = arg('count', 40);
const CHAPTER_SIZE = 10, FIRST_ID = 21;          // level APK FROM.. -> level 21.. của game, mỗi chương 10 level

const apk = JSON.parse(readFileSync(ROOT + 'research/apk/com.stamp.solit/levels/levels.json', 'utf8')).levels;
const slug = t => t.toLowerCase().replace(/ /g, '_').replace(/&/g, 'and');
const CARDS = ROOT + 'prototype/stamp/assets/cards/';
const ours = readdirSync(CARDS).filter(d => existsSync(CARDS + d + '/icon_line.png'));
const nameOf = Object.fromEntries(Object.entries(JSON.parse(readFileSync(ROOT + 'prototype/stamp/assets/manifest.json', 'utf8')))
  .map(([t, m]) => [m.dir.replace('cards/', ''), t]));
const OUR_TOPICS = ours.map(d => nameOf[d]).filter(Boolean);
const artsOf = t => readdirSync(CARDS + slug(t)).map(f => f.match(/^(\d+)\.png$/)).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b);
// cặp dễ nhầm (giống tools/gen_proto_levels.mjs CONFUSE) + vài cặp chương 1: không chung một level
const CONFUSE = [['Seafood', 'Shells'], ['Sailboats', 'Ship'], ['Shells', 'Sea life'], ['Seafood', 'Sea life'], ['Seafood', 'Grilled'],
  ['Seafood', 'Sushi'], ['Seafood', 'Sashimi'], ['Nautical', 'Ship'], ['Ball', 'Float'], ['Soda', 'Soft drink'], ['Coffee', 'Tea'],
  ['Nautical', 'Time'], ['Truck', 'Train'], ['Truck', 'Car'], ['Sushi', 'Sashimi'], ['Raw meat', 'Grilled'], ['Zoo', 'Beast'],
  ['Hoofed', 'Zoo'], ['Pets', 'Dog'], ['Pets', 'Cat'], ['Cake', 'Desserts'], ['Coffee', 'Ice cream'], ['Sauce', 'Soft drink']];
const clash = (a, set) => CONFUSE.some(([x, y]) => (x === a && set.has(y)) || (y === a && set.has(x)));

function rng(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
const usage = Object.fromEntries(OUR_TOPICS.map(t => [t, 0]));   // chủ đề thay thế: ưu tiên cái ít dùng nhất -> đa dạng giữa các level

const out = [];
for (let k = 0; k < COUNT; k++) {
  const src = apk[FROM - 1 + k];
  const id = FIRST_ID + k;
  const r = rng(id * 7919);
  const apkTopics = Object.keys(src.topics);
  const map = {};
  const used = new Set();
  // 1) giữ chủ đề APK nào mình có art (tên trùng)
  for (const t of apkTopics) if (OUR_TOPICS.includes(t) && !clash(t, used)) { map[t] = t; used.add(t); }
  // 2) chủ đề còn lại: chọn chủ đề có art, chưa dùng trong level, không dễ nhầm; ưu tiên ít dùng và đủ art cho n
  for (const t of apkTopics) {
    if (map[t]) continue;
    const n = src.topics[t];
    const cand = OUR_TOPICS.filter(x => !used.has(x) && !clash(x, used))
      .sort((a, b) => (usage[a] - usage[b]) || ((artsOf(b).length >= n) - (artsOf(a).length >= n)) || (r() - 0.5));
    map[t] = cand[0]; used.add(cand[0]);
  }
  for (const t of used) usage[t]++;
  // 3) chuyển lá: id duy nhất, art theo vòng của chủ đề mới (xáo theo seed)
  let nid = 0;
  const artCycle = {};
  const nextArt = t => {
    if (!artCycle[t]) { const a = artsOf(t); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } artCycle[t] = { a, i: 0 }; }
    const c = artCycle[t]; const v = c.a[c.i % c.a.length]; c.i++; return v;
  };
  const conv = c => c.k === 'topic' ? { id: nid++, t: map[c.t], k: 'topic', n: c.n } : { id: nid++, t: map[c.t], k: 'stamp', art: nextArt(map[c.t]) };
  const columns = src.columns.map(col => col.map(conv));
  const deck = src.deck.map(conv);
  const preplaced = (src.preplacedFoundations || []).map(st => st.map(conv));
  const lv = { foundations: src.foundations, moves: src.moves >= 99999 ? null : src.moves, columns, deck, preplaced };
  const res = solve(createState(lv), { width: 300, timeLimitMs: 20000 });
  if (!res) throw new Error(`L${id} (APK ${FROM + k}): solver không giải được`);
  // Đối tượng người lớn tuổi: moves gốc của APK có level sát hoặc thấp hơn lời giải (L31: 85 < 86).
  // Nới tối thiểu 1.3 x số nước tối ưu; level nào APK đã rộng rãi hơn thì giữ moves gốc.
  const apkMoves = lv.moves;
  if (lv.moves != null) lv.moves = Math.max(lv.moves, Math.ceil(res.moves * 1.3));
  const chapter = Math.floor((id - 1) / CHAPTER_SIZE) + 1;
  const cards = columns.flat().length + deck.length + preplaced.flat().length;
  out.push({ id, role: 'apk', unlock: null, chapter, seed: 0, solverMoves: res.moves, winRateSim: null,
    note: `APK 0.9.5 ${src.name}: bố cục, bộ bài, n gốc; moves ${apkMoves === lv.moves ? 'gốc' : apkMoves + ' -> ' + lv.moves + ' (1.3 x tối ưu)'}; chủ đề thay: ${Object.entries(map).filter(([a, b]) => a !== b).map(([a, b]) => a + '→' + b).join(', ') || 'không'}`,
    ...lv });
  process.stderr.write(`L${id} <- APK ${src.name}: ${cards} lá, ${apkTopics.length} chủ đề, moves ${apkMoves}${apkMoves === lv.moves ? '' : ' -> ' + lv.moves}, solver ${res.moves}\n`);
}

const header = '// SINH TỰ ĐỘNG bởi tools/import_apk_levels.mjs từ level APK Stamp Solitaire 0.9.5 (bố cục của ABI, chỉ dùng prototype nội bộ). Đừng sửa tay.\n';
writeFileSync(ROOT + 'prototype/stamp/src/levels_apk.js', header + 'export const LEVELS_APK = ' + JSON.stringify(out) + ';\n');
console.log(`${out.length} level -> prototype/stamp/src/levels_apk.js`);
