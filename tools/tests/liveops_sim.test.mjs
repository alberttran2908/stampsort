// Test cho tools/liveops_sim.mjs (L12 + R19, docs/design/liveops-30-days.md mục 9.2, 10; docs/design/economy-30-days.md).
// Chạy: node tools/tests/liveops_sim.test.mjs        (thoát mã 1 nếu có test trượt)
import { readFileSync } from 'node:fs';
import * as EV from '../../prototype/stamp/src/events.js';
import * as LIVE from '../../prototype/stamp/src/liveops.js';
import { statsFromDist, statsFromReports, buildLevelTable, loadStats, makeConfig, simulate, runAll, parseSet, proposalJson, PERSONAS, PROPOSAL, LIVEOPS_JSON } from '../liveops_sim.mjs';

const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, msg: e.message }); }
}
function ok(c, msg) { if (!c) throw new Error(msg); }

await test('statsFromDist: Tem Điểm theo nước dư so với lời giải (giống main.js stars())', () => {
  // budget 80, solver 60 -> slack 20: 3 sao nếu dư >= 10, 2 sao nếu dư >= 4
  const s = statsFromDist([60, 70, 71, 76, 77, 79, 83, 90, Infinity, Infinity], { budget: 80, solver: 60, secPerMove: 6 });
  ok(s.win === 0.6, `win ${s.win}`);
  ok(s.winP5 === 0.7, `winP5 ${s.winP5}`);
  ok(s.s.join() === [2 / 6, 2 / 6, 2 / 6].map(x => +x.toFixed(4)).join(), `s ${s.s}`);
  ok(Math.abs(s.tFail - 8) < 1e-9, `tFail ${s.tFail}`);
});

await test('bảng level: đủ L1–L240, level thật không bị ghi đè, phần chưa sinh có cờ ngoại suy', () => {
  const st = loadStats();
  const lt = buildLevelTable(st, 240);
  ok(lt.table.length === 241, `có ${lt.table.length - 1} level`);
  ok(lt.table[1].budget == null, 'L1 không giới hạn nước');
  ok(!lt.table[lt.maxReal].extrapolated && (lt.maxReal === 240 || lt.table[lt.maxReal + 1].extrapolated), 'cờ ngoại suy');
  const hard = lt.table.filter(r => r && /HARD|SUPER/.test(r.role));
  ok(hard.length >= 24 && hard.every(r => r.special), `level khó ${hard.length}, đều có special`);
  ok(lt.daily.o35.win >= 0.9, `Thư hôm nay o35 ${lt.daily.o35.win}`);
});

await test('fallback khi chưa có stats: đọc report validator, vẫn đủ 240 level', () => {
  const st = statsFromReports();
  ok(st.levels[2] && st.levels[21], 'có L2 và L21');
  const lt = buildLevelTable(st, 240);
  ok(lt.table.length === 241 && lt.table.slice(1).every(r => r.o35 && r.c10), 'đủ profile');
});

await test('tất định: cùng tham số cho cùng kết quả', async () => {
  const a = await runAll({ runs: 6 });
  const b = await runAll({ runs: 6 });
  ok(JSON.stringify(a.S) === JSON.stringify(b.S), 'tổng hợp khác nhau giữa 2 lần chạy');
});

await test('không làm bẩn hằng số của game: chạy --proposal xong thì liveops.js / events.js về số của liveops.json', async () => {
  const J = JSON.parse(readFileSync(LIVEOPS_JSON, 'utf8'));
  await runAll({ runs: 3, proposal: true, overrides: { live: { MAILBAG: { need: 99 }, FEATURES: { route: 77 } } } });
  ok(EV.MAILBAG.need === J.rewards.mailbag.need && EV.ROUTE.stations === J.rewards.route.stations && LIVE.WEEKLY.coins === J.rewards.weekly.coins && LIVE.FEATURES.route === J.features.route, 'hằng số chưa trả về');
  ok(LIVE.BIG_EVENTS.find(e => e.id === 'season').from === J.big_events.find(e => e.id === 'season').from, 'BIG_EVENTS chưa trả về');
  ok(EV.ERRAND_POOL.map(e => e.id).join() === J.rewards.errands.pool.map(e => e.id).join(), 'pool việc vặt chưa trả về');
});

await test('lịch thật: mỗi ngày tối đa 1 event lớn, tối đa 5 điểm chạm, F6 đúng ngày quay lại', async () => {
  const r = await runAll({ runs: 10, days: 56 });
  for (const v of Object.values(r.all)) for (const rep of v.reps) for (const d of rep.dayLog) {
    ok(d.bigCount <= 1, `${v.name} D${d.pd} có ${d.bigCount} event lớn`);
    ok(d.touch <= 5, `${v.name} D${d.pd} có ${d.touch} điểm chạm`);
  }
  const back = r.all.returner.rep.dayLog.filter(d => d.gifts.length).map(d => d.pd);
  ok(back.join() === '14,42', `F6 ở ${back}`);
  ok(r.all.returner.rep.dayLog[13].gifts[0].includes('4'), 'vắng 4 ngày');
});

await test('số hiện tại: nhịp level nằm trong khoảng hợp lý, người lớn tuổi D30 ở L75–L120', async () => {
  const r = await runAll({ runs: 30 });
  ok(r.S.older.levelD.p50 >= 75 && r.S.older.levelD.p50 <= 120, `L${r.S.older.levelD.p50}`);
  ok(r.S.fast.levelD.p50 > r.S.older.levelD.p50 * 1.8, 'người nhanh phải nhanh hơn rõ');
  ok(r.S.older57.levelD.p50 < r.S.older.levelD.p50, '5/7 chậm hơn đều đặn');
});

await test('bộ số đề xuất (D1 Thứ Hai): đạt mọi tiêu chí DoD mục 10 + R19', async () => {
  const r = await runAll({ runs: 80, proposal: true });
  const bad = r.checks.filter(c => !c.ok).map(c => `${c.id}: ${c.value}`);
  ok(!bad.length, bad.join(' | '));
});

await test('bộ số đề xuất, không quảng cáo: economy vẫn đạt (a), (b), (c)', async () => {
  const r = await runAll({ runs: 60, proposal: true, ads: false });
  for (const id of ['eco_a', 'eco_b', 'eco_c']) { const c = r.checks.find(x => x.id === id); ok(c.ok, `${id}: ${c.value}`); }
});

await test('Thẻ tuần tuần đầu (đề xuất): cài app Thứ Bảy vẫn mở được hộp tuần đầu', async () => {
  const cfg = makeConfig({ proposal: true, start: '2026-11-07' });
  const lt = buildLevelTable(loadStats(), 240);
  const rep = simulate(PERSONAS.older, cfg, lt, { days: 3, seed: 7 });
  ok(rep.moments.some(m => m.what === 'hộp Thẻ tuần' && m.pd <= 2), `khoảnh khắc: ${rep.moments.map(m => m.pd + ' ' + m.what).join(', ')}`);
});

await test('liveops.json đề xuất: cùng cấu trúc file đang đóng gói, mang đúng số của PROPOSAL', () => {
  const j = proposalJson();
  ok(j.features.route === PROPOSAL.live.FEATURES.route && j.big_events[0].minLevel === PROPOSAL.live.FEATURES.route, 'route');
  ok(j.rewards.route.stations === PROPOSAL.live.ROUTE.stations && j.rewards.mailbag.need === PROPOSAL.live.MAILBAG.need, 'route/mailbag');
  ok(j.rewards.daily.page_size === PROPOSAL.game.daily.pageSize && j.rewards.daily.today === PROPOSAL.game.daily.today, 'daily');
  const ids = j.rewards.errands.pool.map(e => e.id);
  ok(ids.includes('pts8') && !ids.includes('decor1') && !ids.includes('stars3') && j.rewards.errands.pool.every(e => e.coins === PROPOSAL.live.ERRAND_COINS), ids.join());
});

await test('parseSet gộp đúng khoá lồng nhau', () => {
  const o = parseSet('game.winPerStar=5,live.MAILBAG.need=15,game.decorCh12=2/2/3/3/4/5,game.weekendMode=base');
  ok(o.game.winPerStar === 5 && o.live.MAILBAG.need === 15 && o.game.decorCh12.join() === '2,2,3,3,4,5' && o.game.weekendMode === 'base', JSON.stringify(o));
  ok(PROPOSAL.game && PROPOSAL.live, 'có PROPOSAL');
});

await test('chạy mặc định (200 replica x 4 persona x 30 ngày) dưới 10 giây', async () => {
  const t0 = Date.now();
  await runAll({ runs: 200 });
  const sec = (Date.now() - t0) / 1000;
  ok(sec < 10, `${sec.toFixed(1)} giây`);
});

let fail = 0;
for (const r of results) { console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '\n      ' + r.msg}`); if (!r.ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} pass`);
process.exitCode = fail ? 1 : 0;
