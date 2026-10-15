// Test nhanh cho tools/gen_levels.mjs và tools/validate_levels.mjs (không chạy cả chương; cả chương: xem R3 trong plan).
// Chạy: node tools/tests/gen_levels.test.mjs        (khoảng 30-60 giây, thoát mã 1 nếu có test trượt)
import { LEVELS as LEVELS_B } from '../../prototype/stamp/src/levels_b.js';
import { allCards, artCount, availableArts, confusePairs, fair } from '../level_rules.mjs';
import { specFor } from '../level_spec.mjs';
import { buildGen, abiPool, abiCandidates, rethemeAbi, evaluate, shrinkSpec } from '../gen_levels.mjs';
import { LEVELS as LEVELS_A } from '../../prototype/stamp/src/levels.js';
import { CAP } from '../level_spec.mjs';
import { validateLevel } from '../validate_levels.mjs';

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, msg: e.message }); }
}
function ok(c, msg) { if (!c) throw new Error(msg); }
const topicsOf = lv => Object.fromEntries(allCards(lv).filter(c => c.k === 'topic').map(c => [c.t, c.n]).sort((a, b) => a[0].localeCompare(b[0])));
const sorted = o => Object.fromEntries(Object.entries(o).sort((a, b) => a[0].localeCompare(b[0])));

test('buildGen dựng đúng spec: chủ đề, n, số lá, cột, khay; art khác nhau và có thật', () => {
  for (const L of [21, 26, 30, 36, 40, 41, 87]) {
    const s = specFor(L), lv = buildGen(s, s.chapter * 100000 + s.p * 1000 + 1);
    ok(JSON.stringify(topicsOf(lv)) === JSON.stringify(sorted(s.topics)), `L${L}: chủ đề ${JSON.stringify(topicsOf(lv))}`);
    ok(allCards(lv).length === s.cards, `L${L}: ${allCards(lv).length} lá`);
    ok(lv.columns.map(c => c.length).join() === s.cols.join(), `L${L}: cột`);
    ok(lv.foundations === s.F && (lv.preplaced.length > 0) === !!s.preplace, `L${L}: khay/mở sẵn`);
    for (const t of Object.keys(s.topics)) {
      const arts = allCards(lv).filter(c => c.t === t && c.k === 'stamp').map(c => c.art);
      ok(new Set(arts).size === arts.length && arts.every(a => availableArts(t).includes(a)), `L${L} ${t}: art`);
    }
  }
  const s30 = specFor(30);
  ok(buildGen(s30, 310002).columns.map(c => c.length).join() === s30.colsAlt.join(), 'L30 seed chẵn dùng colsAlt');
});

test('abiPool khử trùng layout; ứng viên ABI đổi chủ đề: không CONFUSE, n <= art, chủ đề mới ngửa sớm, hạn mức có mặt', () => {
  const pool = abiPool();
  ok(pool.length >= 50 && pool.length < 963, `${pool.length} layout`);   // 963 level ABI chỉ có 73 layout khác nhau (đo 2026-10-15)
  ok(new Set(pool.map(a => a.sig)).size === pool.length, 'trùng sig');
  let tried = 0;
  for (let L = 21; L <= 60; L++) {
    const s = specFor(L);
    for (const a of abiCandidates(s, new Set(), 4)) {
      const rt = rethemeAbi(s, a);
      if (!rt) continue;
      tried++;
      const tp = topicsOf(rt.lv);
      ok(!confusePairs(Object.keys(tp)).length, `L${L} abi L${a.level}: CONFUSE`);
      for (const [t, n] of Object.entries(tp)) ok(n <= artCount(t), `L${L} ${t}: n ${n} > art`);
      ok(fair(s.role, rt.lv, s.introduce), `L${L}: không công bằng`);
      for (const t of s.required) ok(tp[t], `L${L} abi L${a.level}: thiếu ${t}`);
      ok(allCards(rt.lv).length === a.cards && rt.lv.foundations === a.raw.foundations, `L${L}: layout ABI bị đổi`);
    }
  }
  ok(tried >= 10, `chỉ ${tried} ứng viên ABI hợp lệ ở L21-L60`);
});

test('evaluate tất định và chọn moves >= sàn slack', () => {
  const s = specFor(22), lv = buildGen(s, 302006);
  const a = evaluate(s, lv), b = evaluate(s, lv);
  ok(JSON.stringify(a) === JSON.stringify(b), 'khác nhau giữa 2 lần');
  ok(a.ok && a.budget >= Math.ceil(a.solver * s.slackFloor), JSON.stringify(a));
});

test('shrinkSpec (R6): bớt 2 tem mỗi bước, giữ chủ đề giới thiệu và bao thư lớn, n >= tối thiểu, cột khớp số lá', () => {
  for (const L of [41, 60, 72, 87]) {
    const s = specFor(L);
    for (const step of [1, 2, 3]) {
      const t = shrinkSpec(s, step);
      const sum = Object.values(t.topics).reduce((a, n) => a + n + 1, 0);
      ok(sum === t.cards && t.cards <= s.cards - 2 && t.cards >= s.cards - 2 * step, `L${L} bước ${step}: ${t.cards} lá`);
      ok(Object.keys(t.topics).join() === Object.keys(s.topics).join(), `L${L}: đổi chủ đề`);
      ok(Object.values(t.topics).every(n => n >= s.nRange[0]), `L${L}: n < tối thiểu`);
      for (const k of [...(s.introduce || []), ...(s.bigEnvelope ? [s.bigEnvelope.topic] : [])]) ok(t.topics[k] === s.topics[k], `L${L}: bớt ${k}`);
      ok(t.cols.reduce((a, b) => a + b, 0) < t.cards - (s.preplace ? 1 : 0) && t.cols.length === s.cols.length, `L${L}: cột`);
      const lv = buildGen(t, 1);
      ok(allCards(lv).length === t.cards, `L${L}: buildGen ${allCards(lv).length} lá`);
    }
  }
});

test('levels.js (A, sau R4): 0 cặp CONFUSE (trừ Truck bỏ art #3 ở L5), số lá <= trần 46 / 54, id 1-20', () => {
  ok(LEVELS_A.length === 20 && LEVELS_A.every((l, i) => l.id === i + 1), 'id');
  for (const l of LEVELS_A) {
    const tp = Object.keys(Object.fromEntries(allCards(l).filter(c => c.k === 'topic').map(c => [c.t, 1])));
    const bad = confusePairs(tp).filter(([x, y]) => !(l.id === 5 && [x, y].includes('Truck') && !allCards(l).some(c => c.t === 'Truck' && c.art === 3)));
    ok(!bad.length, `L${l.id}: CONFUSE ${JSON.stringify(bad)}`);
    if (l.id > 1) ok(allCards(l).length <= (l.special ? CAP.special.cards : CAP.normal.cards), `L${l.id}: ${allCards(l).length} lá`);
  }
});

test('validator bắt CONFUSE, n sai và L14 B (o35 < 0.60)', () => {
  const l14 = LEVELS_B.find(l => l.id === 14);
  const r = validateLevel(l14, { runs: 100, file: 'levels_b.js' });
  ok(!r.pass && r.fails.some(f => f.startsWith('CONFUSE')) && r.sim.o35.win < 0.6, JSON.stringify(r.fails));
  const bad = JSON.parse(JSON.stringify(LEVELS_B.find(l => l.id === 12)));
  bad.deck.find(c => c.k === 'topic').n += 1;
  const r2 = validateLevel(bad, { runs: 20, file: 'levels_b.js' });
  ok(r2.fails.some(f => f.includes('tem')), JSON.stringify(r2.fails));
});

let fail = 0;
for (const r of results) { console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '\n      ' + r.msg}`); if (!r.ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} pass.`);
process.exit(fail ? 1 : 0);
