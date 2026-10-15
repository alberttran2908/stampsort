// Unit test R11: luật Tem Điểm (points.js). Chạy: node prototype/stamp/tests/points.test.mjs
import { stampPoints } from '../src/points.js';
const results = [];
function test(name, fn) { try { fn(); results.push([true, name]); } catch (e) { results.push([false, name, e.message]); } }
const ok = (c, m) => { if (!c) throw new Error(m); };
test('Thắng trong số nước: còn >= 50% phần nước dư thì 3, không thì 2 (không còn 1 điểm)', () => {
  // level 40 nước, lời giải tối ưu 30 -> phần dư 10
  ok(stampPoints({ levelMoves: 40, solverMoves: 30, movesLeft: 10 }) === 3, 'dư 10');
  ok(stampPoints({ levelMoves: 40, solverMoves: 30, movesLeft: 5 }) === 3, 'dư đúng 50%');
  ok(stampPoints({ levelMoves: 40, solverMoves: 30, movesLeft: 4 }) === 2, 'dư 4');
  ok(stampPoints({ levelMoves: 40, solverMoves: 30, movesLeft: 0 }) === 2, 'thắng ở nước cuối vẫn 2');
});
test('Ca tối ở level khó: 2 điểm (trước đây 1)', () => {
  ok(stampPoints({ levelMoves: 60, solverMoves: 55, movesLeft: 0, overtime: true }) === 2, 'overtime');
});
test('Level không giới hạn nước: 3; thiếu solverMoves thì ước 80% số nước', () => {
  ok(stampPoints({ levelMoves: null }) === 3, 'không giới hạn');
  ok(stampPoints({ levelMoves: 50, movesLeft: 5 }) === 3 && stampPoints({ levelMoves: 50, movesLeft: 4 }) === 2, 'ước lượng: dư 10, cần 5');
});
test('Điểm luôn là 2 hoặc 3 khi thắng (quét 2000 trường hợp)', () => {
  for (let m = 10; m < 60; m += 3) for (let sv = 5; sv <= m; sv += 4) for (let left = 0; left <= m - sv; left++) for (const ot of [false, true]) {
    const p = stampPoints({ levelMoves: m, solverMoves: sv, movesLeft: left, overtime: ot });
    ok(p === 2 || p === 3, `${m}/${sv}/${left}/${ot}: ${p}`);
  }
});
let nf = 0;
for (const [pass, name, msg] of results) { if (!pass) nf++; console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : '\n       ' + msg}`); }
console.log(`\n${results.length - nf}/${results.length} pass, ${nf} fail.`);
process.exit(nf ? 1 : 0);
