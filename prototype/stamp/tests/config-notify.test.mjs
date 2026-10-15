// Unit test L13 (config.js, assets/liveops.json) và L11 (notify.js: lịch thông báo, nhắc nghỉ).
// Chạy: node prototype/stamp/tests/config-notify.test.mjs
import { readFileSync } from 'node:fs';
import * as LIVE from '../src/liveops.js';
import * as EV from '../src/events.js';
import { applyConfig, defaults, CONF, loadConfig } from '../src/config.js';
import { buildSchedule, restTimer } from '../src/notify.js';

const results = [];
async function test(name, fn) { try { await fn(); results.push([true, name]); } catch (e) { results.push([false, name, e.message]); } }
const ok = (c, m) => { if (!c) throw new Error(m); };
const FILE = JSON.parse(readFileSync(new URL('../assets/liveops.json', import.meta.url), 'utf8'));
const FIRST = 20000;
const live = { firstOpenDay: FIRST, maxSeenDay: FIRST };
const msOf = (pd, h = 12) => (FIRST + pd - 1) * 864e5 + new Date().getTimezoneOffset() * 6e4 + h * 36e5;

await test('L13 assets/liveops.json hợp lệ: áp vào không có cảnh báo, giá trị = mặc định trong code', () => {
  const info = applyConfig(FILE);
  ok(info.source === 'file' && info.warnings.length === 0, info.warnings.join('; '));
  const d = defaults(), f = { ...FILE }; delete f._note;
  ok(JSON.stringify(f) === JSON.stringify(d), 'file khác mặc định');
});
await test('L13 thiếu file / JSON hỏng / không phải object: chạy bằng mặc định', async () => {
  ok(applyConfig(null).source === 'default', 'null');
  ok(applyConfig([1, 2]).source === 'default' && LIVE.WEEKLY.coins === 100, 'mảng');
  const miss = await loadConfig('x.json', async () => ({ ok: false, status: 404 }));
  ok(miss.source === 'default' && /404/.test(miss.warnings[0]), '404: ' + miss.warnings[0]);
  const bad = await loadConfig('x.json', async () => ({ ok: true, text: async () => '{ "rewards": ' }));
  ok(bad.source === 'default' && /hỏng/.test(bad.warnings[0]) && CONF.daily.today === 40, 'hỏng');
  const net = await loadConfig('x.json', async () => { throw new Error('offline'); });
  ok(net.source === 'default', 'mạng');
});
await test('L13 ghi đè một phần: phần thưởng, ngưỡng mở khoá, lịch; khoá lạ và sai kiểu bị bỏ qua (giữ mặc định)', () => {
  const info = applyConfig({ rewards: { daily: { today: 50 }, weekly: { coins: 'nhiều' }, route: { stations: 24 } }, features: { daily: 6 }, cycle: 30, lạ: 1 });
  ok(CONF.daily.today === 50 && CONF.daily.catchup === 20, 'daily');
  ok(LIVE.WEEKLY.coins === 100 && info.warnings.some(w => /weekly\.coins/.test(w)), 'sai kiểu giữ mặc định');
  ok(EV.ROUTE.stations === 24 && LIVE.FEATURES.daily === 6 && LIVE.SCHED.cycle === 30, 'ghi đè');
  ok(info.warnings.some(w => /lạ/.test(w)) && info.source === 'file+default', 'khoá lạ');
  applyConfig(null);
  ok(CONF.daily.today === 40 && EV.ROUTE.stations === 20 && LIVE.FEATURES.daily === 5 && LIVE.SCHED.cycle === 28, 'áp lại thì về mặc định, không cộng dồn');
});
await test('L13 mảng sai (lịch event, vòng túi thư, pool việc vặt) thì giữ nguyên mảng mặc định', () => {
  const info = applyConfig({ big_events: [{ id: 'route', from: 9, to: 2, minLevel: 12 }], rewards: { mailbag: { cycle: ['hint', 'gold'] }, errands: { pool: [{ id: 'spend', on: 'spend_coins', need: 1, coins: 9 }] } } });
  ok(LIVE.BIG_EVENTS.length === 3 && LIVE.BIG_EVENTS[0].from === 2, 'lịch');
  ok(EV.MAILBAG.cycle.join() === 'hint,pack,stamper,hint,pack,joker', 'vòng');
  ok(EV.ERRAND_POOL.length === 7 && EV.ERRAND_POOL.every(e => e.on !== 'spend_coins'), 'pool');
  ok(info.warnings.length === 3, info.warnings.join('; '));
  applyConfig(null);
});
await test('L13 kill_switch.season = true: không có Tem theo mùa trong cửa sổ của nó; event khác vẫn chạy', () => {
  applyConfig({ kill_switch: { season: true } });
  for (let pd = 8; pd <= 21; pd++) ok(EV.currentEvent(live, msOf(pd), 99) === null, 'pd ' + pd);
  ok(EV.currentEvent(live, msOf(3), 99).id === 'route' && EV.currentEvent(live, msOf(23), 99).id === 'errands', 'event khác');
  applyConfig({ kill_switch: { gentle_retry: true, mailbag: true } });
  ok(!EV.gentleOn({ lv: 12, n: 5 }, 12) && EV.mailbagWin({}, 30) === null && EV.KILL.season === false, 'tắt F11, F5; season bật lại');
  applyConfig(null);
});
await test('L13 lịch đổi qua file: E1 dài 10 ngày thì cd 2–10 là Tuyến đưa thư', () => {
  applyConfig({ big_events: [{ id: 'route', from: 2, to: 10, minLevel: 12, fromNext: 1 }, { id: 'season', from: 11, to: 21, minLevel: 20 }, { id: 'errands', from: 22, to: 28, minLevel: 30 }] });
  ok(EV.currentEvent(live, msOf(10), 99).id === 'route' && EV.currentEvent(live, msOf(11), 99).id === 'season', 'lịch mới');
  applyConfig(null);
});
await test('L11 lịch thông báo 7 ngày: tối đa 1 mỗi ngày, đúng giờ chọn, ngày mở E1/E2 dùng câu event, hôm nay qua giờ thì bỏ', () => {
  const now = msOf(1, 10);                                  // D1 10:00, giờ nhắc 9:00 đã qua
  const list = buildSchedule(live, now, 30, { hour: 9 });
  ok(list.length === 7, 'n ' + list.length);
  const days = list.map(n => n.day);
  ok(new Set(days).size === days.length && days[0] === FIRST + 1, 'mỗi ngày 1, bắt đầu từ mai');
  ok(list.every(n => new Date(n.at).getHours() === 9 && new Date(n.at).getMinutes() === 0), 'giờ');
  ok(list.find(n => n.day === FIRST + 1).kind === 'route' && list.filter(n => n.kind === 'route').length === 1, 'D2: mở Tuyến đưa thư');
  const l2 = buildSchedule(live, msOf(5, 8), 30, { hour: 15 });
  ok(l2[0].day === FIRST + 4 && l2.find(n => n.day === FIRST + 7).kind === 'season', 'D5 15:00 còn kịp; D8: Tem theo mùa');
  ok(buildSchedule(live, msOf(5, 8), 30, { hour: 15, skipDay: FIRST + 4 })[0].day === FIRST + 5, 'đã giao thư hôm nay thì bỏ hôm nay');
  ok(buildSchedule(live, now, 10, { hour: 9 }).every(n => n.kind === 'daily'), 'chưa L12: không có câu event');
  ok(buildSchedule(live, now, 30, { hour: 9, dailyOn: false }).every(n => n.kind !== 'daily'), 'chưa mở Thư hôm nay: chỉ câu event');
});
await test('L11 nội dung thông báo và nhắc nghỉ không gây áp lực (EN/VI)', () => {
  const src = readFileSync(new URL('../src/copy.js', import.meta.url), 'utf8');
  const lines = src.split('\n').filter(l => /notif_|rest_note/.test(l)).join('\n');
  const bad = lines.match(/hết hạn|sắp mất|mất chuỗi|nhanh lên|kẻo|expire|hurry|last chance|don't miss|streak/gi);
  ok(!bad && lines.length > 200, bad ? bad.join(',') : 'thiếu chữ');
});
await test('L11 nhắc nghỉ: đúng 45 phút ở tiền cảnh; ra nền >= 10 phút thì tính lại; ra nền ngắn thì cộng tiếp', () => {
  const r = restTimer({ minutes: 45, awayResetMinutes: 10 });
  let t0 = 0, fired = 0;
  for (let i = 0; i < 44 * 12; i++) { t0 += 5000; if (r.tick(5000, true, t0)) fired++; }
  ok(!fired, 'chưa tới 45');
  r.tick(5000, false, t0 += 5000); t0 += 5 * 60e3;          // ra nền 5 phút
  for (let i = 0; i < 12; i++) { t0 += 5000; if (r.tick(5000, true, t0)) fired++; }
  ok(fired >= 1, 'cộng tiếp sau 5 phút ở nền');
  r.reset();
  for (let i = 0; i < 40 * 12; i++) { t0 += 5000; r.tick(5000, true, t0); }
  r.tick(5000, false, t0 += 5000); t0 += 11 * 60e3;          // ra nền 11 phút
  let f2 = 0;
  for (let i = 0; i < 10 * 12; i++) { t0 += 5000; if (r.tick(5000, true, t0)) f2++; }
  ok(!f2, 'đã tính lại từ đầu');
});

let nf = 0;
for (const [pass, name, msg] of results) { if (!pass) nf++; console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : '\n       ' + msg}`); }
console.log(`\n${results.length - nf}/${results.length} pass, ${nf} fail.`);
process.exit(nf ? 1 : 0);
