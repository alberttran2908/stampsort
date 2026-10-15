#!/usr/bin/env node
// Báo cáo độ khó 10 level bằng 2 người chơi mô phỏng KHÔNG nhìn trộm lá úp (prototype/stamp/src/solver.js playHidden):
//  - "giỏi": lập kế hoạch sâu (22 bước, beam 4). Khớp người chơi trong video (chỉ hơn solver 1-8 moves).
//  - "phổ thông": nhìn trước ít (6 bước, beam 2), nhiều nước tuỳ hứng hơn.
//  - "o35": người lớn tuổi mới chơi (nhìn trước 4 bước, nhiễu 2.0, 35% nước phí), profile chung ở tools/level_rules.mjs.
// Chạy: node tools/difficulty_report.mjs [--runs=30] [--file=prototype/stamp/src/levels_b.js] [--out=<json>]
//   -> prototype/stamp/difficulty-report.json (hoặc --out) + bảng markdown ra stdout
// Kiểm tra đạt/trượt theo mục tiêu từng vai trò: dùng tools/validate_levels.mjs (seed check riêng, 200 ván).
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createState } from '../prototype/stamp/src/engine.js';
import { solve, sampleHidden } from '../prototype/stamp/src/solver.js';
import { PROFILES as SHARED } from './level_rules.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RUNS = Number((process.argv.find(a => a.startsWith('--runs=')) || '--runs=30').slice(7));
const argv = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const LEVEL_FILE = resolve(ROOT, argv('file') || 'prototype/stamp/src/levels.js');
const OUT = resolve(ROOT, argv('out') || 'prototype/stamp/difficulty-report.json');
const LEVELS = Object.values(await import(pathToFileURL(LEVEL_FILE).href)).find(Array.isArray);
const SEC_PER_MOVE = { skilled: 2.2, casual10: 3.2, casual25: 3.8, casual10b: 3.2, o35: 4.5 };     // [GIẢ THUYẾT] thời gian suy nghĩ + animation mỗi nước
const PROFILES = {
  skilled: { width: 4, depth: 22, noise: 0.8, mistake: 0 },      // giỏi, không nhìn trộm (≈ người chơi trong video)
  casual10: { width: 2, depth: 6, noise: 1.6, mistake: 0.10 },   // phổ thông: 10% nước phí
  casual25: { width: 2, depth: 6, noise: 1.6, mistake: 0.25 },   // mới chơi: 25% nước phí
  casual10b: { width: 2, depth: 6, noise: 1.6, mistake: 0.10, boosters: true },   // phổ thông + dùng Magnet/Stamper khi kẹt (số quà khi mở khoá)
  o35: { width: SHARED.o35.width, depth: SHARED.o35.depth, noise: SHARED.o35.noise, mistake: SHARED.o35.mistake },   // người lớn tuổi mới chơi
};
const UNLOCK = { pack: 4, stamper: 7 };   // giống main.js UNLOCK_AT
const GIFT = { pack: 2, stamper: 2 };

const pct = x => Math.round(x * 100);
const rows = [];
for (const L of LEVELS) {
  const st = createState(L);
  const min = solve(st, { width: 800 }).moves;
  const budget = L.moves ?? Infinity;
  const row = { level: L.id, role: L.role, special: L.special || '', budget: L.moves ?? 'inf', solverMin: min };
  for (const [name, prof] of Object.entries(PROFILES)) {
    const b = prof.boosters ? { magnet: L.id >= UNLOCK.pack ? GIFT.pack : 0, stamper: L.id >= UNLOCK.stamper ? GIFT.stamper : 0 } : null;
    const r = sampleHidden(st, { runs: RUNS, seed: 100 + L.id, capMoves: 260, ...prof, boosters: b });
    const won = r.dist.filter(Number.isFinite);
    const inBudget = r.dist.filter(m => m <= budget).length / RUNS;
    const plus5 = r.dist.filter(m => m <= budget + 5).length / RUNS;
    const med = won.length ? won[won.length >> 1] : null;
    row[name] = {
      win: +inBudget.toFixed(2),               // thắng trong số moves
      winPlus5: +plus5.toFixed(2),             // thắng nếu mua thêm 1 lần +5 moves
      deadlock: +(r.deadlocks / RUNS).toFixed(2),
      medianMoves: med,
      attempts: +(1 / Math.max(inBudget, 0.05)).toFixed(1),
      minutes: med ? +((med * SEC_PER_MOVE[name]) / 60).toFixed(1) : null,
    };
  }
  rows.push(row);
  process.stderr.write(`L${L.id} xong\n`);
}

writeFileSync(OUT, JSON.stringify({ runs: RUNS, profiles: PROFILES, secPerMove: SEC_PER_MOVE, rows }, null, 1));
console.log('| Level | Vai trò | Moves | Tối ưu | Giỏi: trung vị | Biên moves | Giỏi: thắng | Giỏi: kẹt | 10% phí: thắng | 10% phí: kẹt | 10% phí + booster: thắng | 10% phí + booster: kẹt | 25% phí: thắng | 25% phí: thắng nếu +5 | o35: thắng | o35: thắng nếu +5 | Phút/ván (10% phí) | Phút/ván (o35) |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  const head = r.budget === 'inf' ? '-' : r.skilled.medianMoves ? pct((r.budget - r.skilled.medianMoves) / r.budget) + '%' : '-';
  console.log(`| ${r.level} | ${r.special ? r.special.toUpperCase() : r.role} | ${r.budget} | ${r.solverMin} | ${r.skilled.medianMoves ?? '-'} | ${head} | ${pct(r.skilled.win)}% | ${pct(r.skilled.deadlock)}% | ${pct(r.casual10.win)}% | ${pct(r.casual10.deadlock)}% | ${pct(r.casual10b.win)}% | ${pct(r.casual10b.deadlock)}% | ${pct(r.casual25.win)}% | ${pct(r.casual25.winPlus5)}% | ${pct(r.o35.win)}% | ${pct(r.o35.winPlus5)}% | ${r.casual10.minutes ?? '-'} | ${r.o35.minutes ?? '-'} |`);
}
