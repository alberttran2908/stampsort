// Unit test L6–L10 (events.js): lịch 28 ngày, phiên event, tiến độ không mất khi bỏ ngày, phần thưởng 1 lần, túi thư,
// cuối tuần x2, tem mùa, việc vặt, thử lại nhẹ tay. Chạy: node prototype/stamp/tests/events.test.mjs
import * as LIVE from '../src/liveops.js';
import * as EV from '../src/events.js';

const results = [];
function test(name, fn) { try { fn(); results.push([true, name]); } catch (e) { results.push([false, name, e.message]); } }
const ok = (c, m) => { if (!c) throw new Error(m); };
const FIRST = 20000;                                           // ngày đầu (số ngày lịch)
const live = { firstOpenDay: FIRST, maxSeenDay: FIRST };
const msOf = pd => (FIRST + pd - 1) * 864e5 + new Date().getTimezoneOffset() * 6e4 + 12 * 36e5;   // trưa ngày người chơi pd (giờ máy)
const ev = (pd, won = 99) => EV.currentEvent(live, msOf(pd), won);

test('Chu kỳ 28 ngày: D1 trống, cd 2–7 Tuyến đưa thư, 8–21 Tem theo mùa, 22–28 Tuần việc vặt, D29 Tuyến đưa thư (chu kỳ 2, từ cd 1)', () => {
  const want = pd => { const cd = ((pd - 1) % 28) + 1, k = Math.floor((pd - 1) / 28); if (cd === 1) return k ? 'route' : null; return cd <= 7 ? 'route' : cd <= 21 ? 'season' : 'errands'; };
  for (let pd = 1; pd <= 84; pd++) {
    const e = ev(pd);
    ok((e ? e.id : null) === want(pd), `pd ${pd}: ${e && e.id} != ${want(pd)}`);
    if (e) ok(e.key === e.id + '#' + Math.floor((pd - 1) / 28), 'key ' + pd);
  }
});
test('Chưa đủ level thì không có event (L12 / L20 / L30)', () => {
  ok(!ev(3, 11) && ev(3, 12).id === 'route', 'route L12');
  ok(!ev(10, 19) && ev(10, 20).id === 'season', 'season L20');
  ok(!ev(25, 29) && ev(25, 30).id === 'errands', 'errands L30');
});
test('E1: bỏ vài ngày không mất trạm; phiên mới (chu kỳ sau) bắt đầu lại; quà đạt mà chưa nhận vào gifts đúng 1 lần', () => {
  const store = {};
  let r = EV.syncEvents(store, ev(2)); EV.routeStep(r.cur); EV.routeStep(r.cur);     // D2: 2 trạm
  r = EV.syncEvents(store, ev(5)); for (let i = 0; i < 3; i++) EV.routeStep(r.cur);    // bỏ D3, D4; D5: +3
  ok(r.cur.p === 5 && r.gifts.length === 0, 'p ' + r.cur.p);
  r = EV.syncEvents(store, ev(6)); for (let i = 0; i < 6; i++) EV.routeStep(r.cur);    // D6: tới trạm 11
  ok(EV.claim('route', r.cur, 'm5') && !EV.claim('route', r.cur, 'm5'), 'nhận m5 đúng 1 lần');
  ok(!EV.claim('route', r.cur, 'm15'), 'chưa tới m15 thì không nhận được');
  r = EV.syncEvents(store, ev(9));                                                     // hết cửa sổ E1, đang E2
  const g = r.gifts.filter(x => x.src === 'route');
  ok(g.length === 1 && g[0].mid === 'm10' && g[0].hint === 1, 'gifts ' + JSON.stringify(r.gifts));
  ok(!store.route && store.season && store.season.n === 0, 'chuyển sang phiên E2');
  ok(EV.syncEvents(store, ev(10)).gifts.length === 0, 'không trao lần 2');
  r = EV.syncEvents(store, ev(29));
  ok(store.route && store.route.key === 'route#1' && store.route.p === 0, 'chu kỳ 2: tuyến mới');
});
test('E1: tối đa 20 trạm + 3 chuyến thêm (5 trạm, 30 xu); trạm 20 có tem tuyến', () => {
  const s = { key: 'route#0', p: 0, claimed: {} };
  let n = 0; while (EV.routeStep(s) != null) n++;
  ok(n === 35 && s.p === 35, 'max ' + n);
  const ms = EV.milestones('route', s);
  ok(ms.length === 7 && ms.every(m => m.reached), 'mốc');
  const r20 = EV.claim('route', s, 'm20');
  ok(r20.joker === 1 && r20.routeStamp === 1, JSON.stringify(r20));
  ok(EV.claim('route', s, 't3').coins === 30 && !EV.claim('route', s, 't4'), 'chuyến thêm');
});
test('E2: Thư hôm nay luôn có 1 lá tem mùa; chiến dịch L21–L240 có 45–55%; không phải lá vương miện/Tem Vàng; nhận rồi thì chơi lại không có', () => {
  const mk = (id, daily = false) => ({ id, daily, columns: [[{ id: id + 'a', k: 'topic', t: 'X' }, { id: id + 'b', k: 'stamp', t: 'X' }], [{ id: id + 'c', k: 'joker' }]], deck: [{ id: id + 'd', k: 'stamp', t: 'Y' }] });
  const s = { key: 'season#0', n: 0, got: {}, claimed: {} };
  for (let d = 0; d < 30; d++) ok(EV.seasonCardFor(mk('D' + d, true), 0, s, 'D' + d), 'daily ' + d);
  let has = 0;
  for (let id = 21; id <= 240; id++) { const c = EV.seasonCardFor(mk(id), 0, s, 'L' + id); if (c) { has++; ok(/[bd]$/.test(c), 'chỉ lá tem thường: ' + c); } }
  const share = has / 220;
  ok(share >= 0.45 && share <= 0.55, 'tỉ lệ ' + share.toFixed(3));
  ok(EV.seasonCollect(s, 'D1') === 1 && EV.seasonCollect(s, 'D1') == null && !EV.seasonCardFor(mk('D1', true), 0, s, 'D1'), 'nhận 1 lần');
});
test('E2: 24 tem đủ 3 bộ (bộ 3 có trang tem mùa + Tem Vàng), thêm tối đa 2 bộ 30 xu; hình theo tháng thật', () => {
  const s = { key: 'season#0', n: 40, got: {}, claimed: {} };
  const ms = EV.milestones('season', s);
  ok(ms.filter(m => m.reached).length === 5, 'mốc');
  const r3 = EV.claim('season', s, 's24');
  ok(r3.joker === 1 && r3.seasonPage === 1, JSON.stringify(r3));
  ok(EV.progress('season', s).p === 24, 'tiến độ ô Event dừng ở 24');
  ok([3, 6, 9, 12].map(EV.SEASON_MOTIF).join() === 'flower,shell,leaf,snow' && EV.SEASON_MOTIF(2) === 'snow', 'mùa');
});
test('E4: 5 việc tất định theo chu kỳ, khác chu kỳ thì khác bộ; không việc nào cần tiêu xu/dùng booster; đếm đúng loại', () => {
  const a = EV.pickErrands(0).map(e => e.id), b = EV.pickErrands(0).map(e => e.id);
  ok(a.length === 5 && new Set(a).size === 5 && a.join() === b.join(), 'tất định');
  ok(new Set([0, 1, 2, 3, 4, 5].map(k => EV.pickErrands(k).map(e => e.id).join())).size >= 2, 'đổi theo k');
  ok(EV.ERRAND_POOL.every(e => !/spend|coin|booster|buy/i.test(e.on)), 'pool');
  const k = 0, s = { key: 'errands#0', c: {}, claimed: {} };
  const list = EV.pickErrands(k);
  for (const e of list) { for (let i = 0; i < e.need + 3; i++) EV.errandBump(s, k, e.on); ok(s.c[e.id] === e.need, e.id + ' chặn ở need'); }
  ok(EV.errandBump(s, k, 'booster_use').length === 0, 'sự kiện lạ không đếm');
  const box = EV.milestones('errands', s, k).find(m => m.box);
  ok(box.reached && EV.claim('errands', s, 'box', k).stamper === 1 && !EV.claim('errands', s, 'box', k), 'hộp 1 lần');
});
test('F5 Túi thư: chưa L15 không đếm; mỗi 12 lần thắng 1 booster theo vòng 6 món', () => {
  const bag = {};
  ok(EV.mailbagWin(bag, 14) == null && !bag.n, 'chưa L15');
  const got = [];
  for (let i = 0; i < 72; i++) { const r = EV.mailbagWin(bag, 20); if (r) got.push(r.kind); }
  ok(got.join() === 'hint,pack,stamper,hint,pack,joker', got.join());
  ok(bag.n === 0 && EV.mailbagNext(bag) === 'hint', 'vòng lại');
});
test('E3 Cuối tuần: T7, CN x2 cho chiến dịch (từ L8); Thư hôm nay không x2; ngày thường x1', () => {
  const lv = {};
  const day = (y, m, d) => new Date(y, m - 1, d, 12).getTime();
  LIVE.touch(lv, day(2026, 10, 12));
  const st = (d, won = 10) => LIVE.liveState(lv, day(2026, 10, d), won);
  ok(EV.weekendMult(st(17)) === 2 && EV.weekendMult(st(18)) === 2, 'T7 CN');
  ok(EV.weekendMult(st(16)) === 1 && EV.weekendMult(st(19)) === 1, 'T6 T2');
  ok(EV.weekendMult(st(17), true) === 1, 'Daily');
  ok(EV.weekendMult(st(17, 7)) === 1, 'chưa L8');
});
test('F11 Thử lại nhẹ tay: thua 1 lần không có, thua 2 lần liền có, thắng thì đặt lại; không áp level khó, Daily, dưới L11', () => {
  const rec = {};
  EV.gentleRecord(rec, 12, false);
  ok(!EV.gentleOn(rec, 12), 'thua 1');
  EV.gentleRecord(rec, 12, false);
  ok(EV.gentleOn(rec, 12) && !EV.gentleOn(rec, 13), 'thua 2 ở L12');
  ok(!EV.gentleOn(rec, 12, { special: true }) && !EV.gentleOn(rec, 12, { daily: true }), 'khó / Daily');
  EV.gentleRecord(rec, 13, false);
  ok(!EV.gentleOn(rec, 13), 'đổi level thì đếm lại');
  EV.gentleRecord(rec, 13, false); EV.gentleRecord(rec, 13, true);
  ok(!EV.gentleOn(rec, 13), 'thắng thì đặt lại');
  const r2 = {}; EV.gentleRecord(r2, 10, false); EV.gentleRecord(r2, 10, false);
  ok(!EV.gentleOn(r2, 10), 'dưới L11');
});
test('Mô phỏng 56 ngày, người chơi 5/7 ngày (3 thắng + 1 Thư hôm nay mỗi ngày chơi): mọi ngày tối đa 1 event, tiến độ không mất, quà không trao 2 lần', () => {
  const store = {}, gifts = [];
  let maxRoute = 0, maxSeason = 0, errDone = 0;
  for (let pd = 2; pd <= 56; pd++) {
    const cur = ev(pd, 40);
    const r = EV.syncEvents(store, cur);
    gifts.push(...r.gifts);
    ok(Object.keys(store).length <= 1, 'pd ' + pd + ': ' + Object.keys(store));
    if (pd % 7 === 3 || pd % 7 === 6) continue;              // nghỉ 2 ngày mỗi tuần
    for (let w = 0; w < 4; w++) {
      if (!cur) break;
      if (cur.id === 'route') maxRoute = Math.max(maxRoute, EV.routeStep(r.cur) || 0);
      if (cur.id === 'season' && w < 3) maxSeason = Math.max(maxSeason, EV.seasonCollect(r.cur, `L${pd}-${w}`) ? r.cur.n : 0);
      if (cur.id === 'errands') { for (const on of ['win', 'deliver', 'deliver', 'deliver_big']) EV.errandBump(r.cur, cur.k, on); if (w === 0) { EV.errandBump(r.cur, cur.k, 'daily_day'); EV.errandBump(r.cur, cur.k, 'stars3'); } }
    }
    if (cur && cur.id === 'errands') errDone = Math.max(errDone, EV.progress('errands', r.cur, cur.k).p);
  }
  const mids = gifts.map(g => g.ev + ':' + g.mid);
  ok(new Set(mids).size === mids.length, 'trao trùng: ' + mids.join());
  ok(maxRoute >= 15 && maxSeason >= 16 && errDone >= 3, `tuyến ${maxRoute}, tem ${maxSeason}, việc ${errDone}`);
});

let nf = 0;
for (const [pass, name, msg] of results) { if (!pass) nf++; console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : '\n       ' + msg}`); }
console.log(`\n${results.length - nf}/${results.length} pass, ${nf} fail.`);
process.exit(nf ? 1 : 0);
