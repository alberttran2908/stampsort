// Unit test L1 (lịch local) + L2 (pool Thư hôm nay). Chạy: node prototype/stamp/tests/liveops.test.mjs
// AC L1 (liveops-30-days.md mục 9.2): (1) pd đúng qua nửa đêm và qua tháng; (2) cd 1–28 ra đúng event, chu kỳ 2 có E1 từ cd 1;
// (3) level < minLevel thì big = null; (4) lùi giờ không tạo ngày mới; (5) T7, CN thì weekend = true; (6) 120 ngày không có 2 event lớn.
// L2: pool không rỗng, chọn tất định, không lặp trong 30 ngày liền, giữ thư đã mở khi pool lớn lên, level Daily hợp lệ với engine.
import * as LIVE from '../src/liveops.js';
import { buildDailyPool, pickDaily, dailyLevel } from '../src/daily.js';
import * as E from '../src/engine.js';
import { solve } from '../src/solver.js';
import { LEVELS } from '../src/levels.js';
import { LEVELS_APK } from '../src/levels_apk.js';

const GEN = await import('../src/levels_gen.js').then(m => m.LEVELS_GEN || [], () => []);
const results = [];
function test(name, fn) { try { fn(); results.push([true, name]); } catch (e) { results.push([false, name, e.message]); } }
const ok = (c, m) => { if (!c) throw new Error(m); };
const local = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

test('L1-1 pd tăng đúng lúc 00:00 giờ máy, qua tháng và qua năm', () => {
  const live = {};
  LIVE.touch(live, local(2026, 10, 31, 23, 59));
  ok(LIVE.liveState(live, local(2026, 10, 31, 23, 59)).pd === 1, 'pd ngày đầu = 1');
  ok(LIVE.liveState(live, local(2026, 11, 1, 0, 0)).pd === 2, 'qua nửa đêm sang tháng 11: pd = 2');
  ok(LIVE.liveState(live, local(2026, 12, 31, 23, 0)).pd === 62, 'cuối năm');
  ok(LIVE.liveState(live, local(2027, 1, 1, 0, 1)).pd === 63, 'qua năm');
  ok(LIVE.dayKey(LIVE.epochDay(local(2027, 1, 1, 0, 1))) === '2027-01-01', 'dayKey theo lịch địa phương');
});
test('L1-2 cd 1–28 ra đúng event; chu kỳ 1 cd 1 trống, chu kỳ 2 có E1 từ cd 1', () => {
  const live = { firstOpenDay: 20000, maxSeenDay: 20000 };
  const at = pd => LIVE.liveState(live, (20000 + pd - 1) * 864e5 + new Date().getTimezoneOffset() * 6e4 + 12 * 36e5, 999);
  ok(at(1).big === null && at(1).cd === 1, 'D1 trống');
  for (let pd = 2; pd <= 7; pd++) ok(at(pd).big === 'route', 'E1 cd 2-7: pd ' + pd);
  for (let pd = 8; pd <= 21; pd++) ok(at(pd).big === 'season', 'E2 cd 8-21: pd ' + pd);
  for (let pd = 22; pd <= 28; pd++) ok(at(pd).big === 'errands', 'E4 cd 22-28: pd ' + pd);
  ok(at(29).cd === 1 && at(29).k === 1 && at(29).big === 'route', 'D29: chu kỳ 2, E1 từ cd 1');
});
test('L1-3 chưa đủ level thì big = null (bigPending báo event đang chạy)', () => {
  const live = { firstOpenDay: 20000, maxSeenDay: 20000 };
  const ms = d => (20000 + d) * 864e5 + new Date().getTimezoneOffset() * 6e4 + 12 * 36e5;
  const s = LIVE.liveState(live, ms(9), 19);          // pd 10 = E2, cần L20
  ok(s.big === null && s.bigPending === 'season', JSON.stringify(s));
  ok(LIVE.liveState(live, ms(9), 20).big === 'season', 'đủ L20');
  ok(LIVE.liveState(live, ms(2), 11).big === null && LIVE.liveState(live, ms(2), 12).big === 'route', 'E1 cần L12');
});
test('L1-4 lùi giờ không tạo ngày mới (maxSeenDay), tiến giờ thì chấp nhận', () => {
  const live = {};
  const d1 = LIVE.touch(live, local(2026, 10, 15));
  const d2 = LIVE.touch(live, local(2026, 10, 17));
  ok(d2 === d1 + 2, 'tiến 2 ngày');
  const back = LIVE.touch(live, local(2026, 10, 14));
  ok(back === d2, 'lùi về 14/10 vẫn là 17/10');
  const st = LIVE.liveState(live, local(2026, 10, 14));
  ok(st.rolledBack && st.day === d2 && st.pd === 3, JSON.stringify(st));
  ok(LIVE.effectiveDay(live, local(2026, 10, 16)) === d2, 'effectiveDay không lùi');
});
test('L1-5 Thứ Bảy, Chủ nhật thì weekend = true (khi đã qua L8)', () => {
  const live = {};
  LIVE.touch(live, local(2026, 10, 12));               // Thứ Hai
  const wk = d => LIVE.liveState(live, local(2026, 10, d), 8).weekend;
  ok(!wk(12) && !wk(16) && wk(17) && wk(18) && !wk(19), 'T2..T2');
  ok(!LIVE.liveState(live, local(2026, 10, 17), 7).weekend, 'chưa L8 thì không');
  ok(LIVE.isoWeek(LIVE.epochDay(local(2026, 10, 12))) === LIVE.isoWeek(LIVE.epochDay(local(2026, 10, 18))), 'T2 và CN cùng tuần');
  ok(LIVE.isoWeek(LIVE.epochDay(local(2026, 10, 19))) === LIVE.isoWeek(LIVE.epochDay(local(2026, 10, 12))) + 1, 'T2 sau là tuần mới');
});
test('L1-6 120 ngày: mỗi ngày tối đa 1 event lớn, mọi ngày có đúng 1 cửa sổ trừ D1', () => {
  const live = { firstOpenDay: 20000, maxSeenDay: 20000 };
  for (let pd = 1; pd <= 120; pd++) {
    const ms = (20000 + pd - 1) * 864e5 + new Date().getTimezoneOffset() * 6e4 + 12 * 36e5;
    const s = LIVE.liveState(live, ms, 999);
    const wins = LIVE.BIG_EVENTS.filter(e => { const from = e.id === 'route' && s.k >= 1 ? 1 : e.from; return s.cd >= from && s.cd <= e.to; });
    ok(wins.length <= 1, 'pd ' + pd + ': ' + wins.length + ' event');
    ok(pd === 1 ? s.big === null : !!s.big, 'pd ' + pd);
  }
});
test('L1 bảng mở khoá: Thư hôm nay mở khi đã thắng L5, không function meta nào trước L5', () => {
  ok(!LIVE.featureOn('daily', 4) && LIVE.featureOn('daily', 5), 'daily L5');
  ok(Object.values(LIVE.FEATURES).every(v => v >= 5), 'không có gì trước L5');
});

// ---------------------------------------------------------------- L2
const campaign = LEVELS.concat((() => {
  const gen = new Map(GEN.map(l => [l.id, l])), apk = new Map(LEVELS_APK.map(l => [l.id, l]));
  const out = [];
  for (let id = 21; ; id++) { const lv = gen.get(id) || apk.get(id); if (!lv) break; out.push(lv.source ? lv : { ...lv, source: 'apk' }); }
  return out;
})());
const pool = buildDailyPool({ campaign });
test('L2 pool tạm: không rỗng, không có level khó/kịch bản/giới thiệu booster, 30–46 lá', () => {
  ok(pool.length >= 10, 'pool ' + pool.length);
  for (const e of pool) {
    const l = e.lv, n = l.columns.flat().length + l.deck.length + (l.preplaced || []).flat().length;
    ok(!l.special && !l.script && !l.unlock && n >= 30 && n <= 46, e.src);
  }
  ok(new Set(pool.map(e => e.src)).size === pool.length, 'src trùng');
});
test('L2 pool của Level Dev (LEVELS_DAILY) được ưu tiên và dùng nguyên', () => {
  const p2 = buildDailyPool({ daily: [{ id: 1, ...LEVELS[5] }], campaign });
  ok(p2.length === 1 && p2[0].tuned && dailyLevel(p2[0], 'k').columns === p2[0].lv.columns, 'tuned');
});
test('L2 chọn tất định và không lặp trong 30 ngày liền (người chơi mở thư mỗi ngày)', () => {
  const hist = {}, hist2 = {};
  for (let d = 20000; d < 20030; d++) { hist[d] = pickDaily(pool, d, hist).src; hist2[d] = pickDaily(pool, d, hist2).src; }
  const srcs = Object.values(hist);
  ok(JSON.stringify(hist) === JSON.stringify(hist2), 'tất định');
  const need = Math.min(30, pool.length);
  ok(new Set(srcs.slice(0, need)).size === need, `lặp trong ${need} ngày đầu: ${srcs.join(',')}`);
});
test('L2 bỏ vài ngày không làm lặp thư, thư đã mở được giữ khi pool lớn lên', () => {
  const hist = {};
  for (const d of [20000, 20001, 20004, 20009, 20010]) hist[d] = pickDaily(pool, d, hist).src;
  ok(new Set(Object.values(hist)).size === 5, 'lặp sau khi bỏ ngày');
  const bigger = pool.concat([{ src: 'gen:999', lv: pool[0].lv, tuned: false }]).sort((a, b) => (a.src < b.src ? -1 : 1));
  for (const d of Object.keys(hist)) ok(pickDaily(bigger, +d, hist).src === hist[d], 'đổi thư ngày ' + d);
});
test('L2 tránh level chiến dịch người chơi sắp gặp (pool tạm)', () => {
  for (let d = 20000; d < 20040; d++) { const e = pickDaily(pool, d, {}, x => x.lv.id >= 21 && x.lv.id < 31); ok(!(e.lv.id >= 21 && e.lv.id < 31), 'ngày ' + d + ': ' + e.src); }
});
test('L2 level Daily: cột đảo, lượt >= lượt gốc, giải được trong số lượt (solver), id riêng', () => {
  for (const e of pool.slice(0, 12)) {
    const lv = dailyLevel(e, '2026-10-15');
    ok(lv.id === 'D2026-10-15' && lv.daily && !lv.special && lv.moves >= e.lv.moves, e.src);
    ok(JSON.stringify(lv.columns) === JSON.stringify([...e.lv.columns].reverse()), 'cột đảo ' + e.src);
    const r = solve(E.createState(lv), { width: 400 });
    ok(r && r.moves <= lv.moves, 'solver ' + e.src + ' ' + (r ? r.moves : 'none') + '/' + lv.moves);
  }
});

// ---------------------------------------------------------------- L3, L4 (Thẻ tuần, Thư buổi sáng, Chào mừng quay lại, hàng đợi popup)
const MON = LIVE.epochDay(local(2026, 10, 12));      // Thứ Hai
test('L3 Thẻ tuần: T2, T3, T5, T6 chưa đủ; thêm CN (dấu thứ 5) thì sẵn sàng mở hộp; bỏ T4, T7 không phạt', () => {
  const won = { [MON]: 1, [MON + 1]: 1, [MON + 3]: 1, [MON + 4]: 1 };
  const w4 = LIVE.weeklyCard(won, MON + 4, {});
  ok(w4.count === 4 && !w4.ready && w4.days[0] === MON && w4.days[6] === MON + 6, JSON.stringify(w4));
  won[MON + 6] = 1;
  const w5 = LIVE.weeklyCard(won, MON + 6, {});
  ok(w5.count === 5 && w5.ready && JSON.stringify(w5.cells) === JSON.stringify([true, true, false, true, true, false, true]), 'CN: ' + JSON.stringify(w5));
  ok(!LIVE.weeklyCard(won, MON + 6, { [w5.week]: 1 }).ready, 'đã nhận thì không mở lần 2');
});
test('L3 Thẻ tuần: tuần mới thẻ trống; thư hôm qua chơi bù đóng ô hôm qua (cùng tuần), CN chơi bù vào T2 thuộc tuần cũ', () => {
  const won = { [MON]: 1, [MON + 1]: 1, [MON + 2]: 1, [MON + 3]: 1, [MON + 6]: 2 };
  const next = LIVE.weeklyCard(won, MON + 7, {});
  ok(next.count === 0 && next.week === LIVE.weeklyCard(won, MON, {}).week + 1, 'tuần mới');
  ok(LIVE.weeklyCard(won, MON + 6, {}).count === 5, 'CN (chơi bù) vẫn tính cho tuần cũ');
  ok(LIVE.weekStart(MON + 6) === MON && LIVE.weekStart(MON + 7) === MON + 7, 'weekStart');
});
test('L3 Thư buổi sáng: từ ngày người chơi thứ 2, đã qua L5, 1 lần mỗi ngày; lần 7, 14 thêm Gợi ý', () => {
  ok(!LIVE.morningDue({}, MON, 1, 9), 'D1 không có');
  ok(LIVE.morningDue({}, MON + 1, 2, 5) && !LIVE.morningDue({}, MON + 1, 2, 4), 'D2: cần L5');
  ok(!LIVE.morningDue({ last: MON + 1, n: 1 }, MON + 1, 2, 9), 'đã nhận hôm nay');
  ok(LIVE.morningDue({ last: MON + 1, n: 1 }, MON + 4, 5, 9), 'bỏ vài ngày vẫn nhận tiếp');
  const r = [1, 6, 7, 8, 13, 14].map(n => LIVE.morningReward(n));
  ok(r.every(x => x.coins === 20) && r.map(x => x.hint).join('') === '001001', JSON.stringify(r));
});
test('L4 Chào mừng quay lại: vắng 2 ngày không có, vắng 3 ngày có, vắng 7 ngày thêm Tem Đa Năng; lùi giờ không tạo', () => {
  const live = {};
  LIVE.touch(live, local(2026, 10, 12));
  LIVE.touch(live, local(2026, 10, 15));            // vắng 13, 14
  ok(!live.awayDue && !LIVE.welcomeDue(live, 9), 'vắng 2: ' + JSON.stringify(live));
  LIVE.touch(live, local(2026, 10, 19));            // vắng 16, 17, 18
  ok(live.awayDue === 3 && LIVE.welcomeDue(live, 9) && !LIVE.welcomeDue(live, 4), 'vắng 3 (và cần L5)');
  ok(LIVE.welcomeReward(3).joker === 0 && LIVE.welcomeReward(7).joker === 1 && LIVE.welcomeReward(3).moves === 5, 'quà');
  delete live.awayDue;
  LIVE.touch(live, local(2026, 10, 14));            // lùi giờ
  ok(!live.awayDue, 'lùi giờ');
  LIVE.touch(live, local(2026, 10, 27));            // vắng 20..26 = 7
  ok(live.awayDue === 7, 'vắng 7: ' + live.awayDue);
});
test('L4 hàng đợi popup: tối đa 1, ưu tiên ván dở (lúc mở app) > phong bì quà > tính năng mới; quà gộp', () => {
  const all = { resume: true, welcome: true, gifts: true, morning: true, feature: true };
  ok(LIVE.pickPopup(all, 'boot') === 'resume', 'boot');
  ok(LIVE.pickPopup(all, 'home') === 'gifts', 'home: ván dở chỉ hỏi lúc mở app');
  ok(LIVE.pickPopup({ morning: true, feature: true }) === 'gifts', 'F4 trước tính năng mới');
  ok(LIVE.pickPopup({ feature: true }) === 'feature' && LIVE.pickPopup({ feature: true, featureShown: true }) === null, '1 tính năng mới mỗi phiên');
  ok(LIVE.pickPopup({}) === null, 'không có gì');
  const m = LIVE.mergeRewards([LIVE.welcomeReward(7), { coins: 50 }, LIVE.morningReward(7)]);
  ok(m.coins === 70 && m.hint === 2 && m.pack === 1 && m.joker === 1 && m.moves === 5, JSON.stringify(m));
});
const COPY_SRC = (await import('node:fs')).readFileSync(new URL('../src/copy.js', import.meta.url), 'utf8');
test('Copy EN/VI: 0 kết quả cho "mất chuỗi", "streak lost", "hết hạn", "expire"', () => {
  const bad = COPY_SRC.match(/mất chuỗi|streak lost|hết hạn|expire/gi);
  ok(!bad, bad && bad.join(','));
});

let nf = 0;
for (const [pass, name, msg] of results) { if (!pass) nf++; console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : '\n       ' + msg}`); }
console.log(`\n${results.length - nf}/${results.length} pass, ${nf} fail.`);
process.exit(nf ? 1 : 0);
