// L6–L10 (liveops-30-days.md mục 3, 6.1, 6.2): Cuối tuần xu đôi (E3), Túi thư của Pip (F5), Tuyến đưa thư (E1),
// Tem theo mùa (E2), Tuần việc vặt (E4), Thử lại nhẹ tay (F11). Module thuần (không DOM): test được trong Node.
//
// Nguyên tắc chung (mục 10 "Không FOMO"): thua không mất tiến độ, không đếm ngược, không "mất chuỗi". Quà đã đạt mà chưa
// nhận thì khi event kết thúc được chuyển vào save.gifts (phong bì quà gộp ở màn chính, L4). Mỗi mốc quà chỉ nhận 1 lần.
// Trạng thái event lưu theo "phiên" key = id + '#' + chu kỳ k: chu kỳ mới là phiên mới, phiên cũ được chốt (finalize).
import { liveState, featureOn, BIG_EVENTS } from './liveops.js';

// Hằng số phần thưởng (L13 sẽ đọc đè từ liveops.json)
export const WEEKEND = { mult: 2 };
export const MAILBAG = { need: 12, cycle: ['hint', 'pack', 'stamper', 'hint', 'pack', 'joker'] };
export const ROUTE = {
  stations: 20,
  milestones: [{ at: 5, coins: 50 }, { at: 10, hint: 1 }, { at: 15, pack: 1 }, { at: 20, joker: 1, stamp: 1 }],
  trip: { len: 5, coins: 30, max: 3 },
};
export const SEASON = {
  set: 8,
  sets: [{ at: 8, stamper: 1, coins: 50 }, { at: 16, hint: 1, pack: 1 }, { at: 24, joker: 1, page: 1, rare: 1 }],
  // decor hiếm theo mùa (art đợt 6), trao ở bộ 3 theo hình tem của tháng thật
  rare_decor: { flower: 'rare_sakura_postbox', shell: 'rare_shell_lantern', leaf: 'rare_maple_mailbox', snow: 'rare_snow_mailbox' },
  extra: { len: 8, coins: 30, max: 2 },
};
// Pool việc vặt (mục 6.2 E4). Không việc nào buộc tiêu xu hay dùng booster (test quét `on`).
export const ERRAND_POOL = [
  { id: 'win8', on: 'win', need: 8, coins: 50 },
  { id: 'daily4', on: 'daily_day', need: 4, coins: 40 },
  { id: 'big6', on: 'deliver_big', need: 6, coins: 40 },
  { id: 'stars3', on: 'stars3', need: 3, coins: 40 },
  { id: 'decor1', on: 'decor', need: 1, coins: 30 },
  { id: 'hard1', on: 'hard_win', need: 1, coins: 40 },
  { id: 'deliver15', on: 'deliver', need: 15, coins: 30 },
];
export const ERRANDS = { pick: 5, box: { hint: 1, pack: 1, stamper: 1 } };
export const GENTLE = { losses: 2, moves: 3, minLevel: 11 };
// Công tắc tắt từng tính năng (L13: liveops.json "kill_switch" đọc đè). main.js đọc cả daily/weekly/morning/welcome/rest/notifications.
export const KILL = { daily: false, weekly: false, morning: false, welcome: false, gentle_retry: false, weekend: false, route: false, season: false, errands: false, mailbag: false, rest: false, notifications: false };

export function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ------------------------------------------------------------ E3 Cuối tuần xu đôi
/** Hệ số xu thắng level: x2 vào Thứ Bảy, Chủ nhật (đã qua L8). Không áp cho Thư hôm nay, hộp, event. */
export const weekendMult = (st, daily = false) => (!KILL.weekend && st && st.weekend && !daily ? WEEKEND.mult : 1);

// ------------------------------------------------------------ F5 Túi thư của Pip
/** Mỗi lần thắng (chiến dịch hoặc Thư hôm nay) +1. Đủ 12: 1 booster theo vòng 6 món, đếm lại từ 0. Thua không trừ. */
export function mailbagWin(bag, wonLevel) {
  if (KILL.mailbag || !featureOn('mailbag', wonLevel)) return null;
  bag.n = (bag.n || 0) + 1;
  bag.i = bag.i || 0;
  if (bag.n < MAILBAG.need) return null;
  bag.n = 0;
  const kind = MAILBAG.cycle[bag.i % MAILBAG.cycle.length];
  bag.i++;
  return { [kind]: 1, kind };
}
export const mailbagNext = bag => MAILBAG.cycle[(bag.i || 0) % MAILBAG.cycle.length];

// ------------------------------------------------------------ phiên event
/** Event lớn đang chạy và đủ level: { id, k, key, cd, endCd, daysLeft } hoặc null. */
export function currentEvent(live, ms, wonLevel) {
  const st = liveState(live, ms, wonLevel);
  if (!st.big || KILL[st.big]) return null;
  const to = (BIG_EVENTS.find(e => e.id === st.big) || {}).to;
  return { id: st.big, k: st.k, key: st.big + '#' + st.k, cd: st.cd, endCd: to, month: new Date(st.day * 864e5).getUTCMonth() + 1 };
}
const blank = (id, key) => ({ route: { key, p: 0, claimed: {} }, season: { key, n: 0, got: {}, claimed: {} }, errands: { key, c: {}, claimed: {} } }[id]);

/** Mốc quà của 1 phiên: [{ mid, reward, reached, claimed }]. */
export function milestones(id, s, k = 0) {
  const out = [];
  if (id === 'route') {
    for (const m of ROUTE.milestones) out.push({ mid: 'm' + m.at, at: m.at, reward: strip(m), reached: s.p >= m.at });
    for (let i = 1; i <= ROUTE.trip.max; i++) { const at = ROUTE.stations + i * ROUTE.trip.len; out.push({ mid: 't' + i, at, trip: i, reward: { coins: ROUTE.trip.coins }, reached: s.p >= at }); }
  } else if (id === 'season') {
    for (const m of SEASON.sets) out.push({ mid: 's' + m.at, at: m.at, reward: strip(m), reached: s.n >= m.at });
    for (let i = 1; i <= SEASON.extra.max; i++) { const at = 24 + i * SEASON.extra.len; out.push({ mid: 'x' + i, at, extra: i, reward: { coins: SEASON.extra.coins }, reached: s.n >= at }); }
  } else if (id === 'errands') {
    const list = pickErrands(k);
    for (const e of list) out.push({ mid: e.id, errand: e, at: e.need, reward: { coins: e.coins }, reached: (s.c[e.id] || 0) >= e.need });
    out.push({ mid: 'box', box: true, reward: { ...ERRANDS.box }, reached: list.every(e => (s.c[e.id] || 0) >= e.need) });
  }
  for (const m of out) m.claimed = !!s.claimed[m.mid];
  return out;
}
function strip(m) { const r = { ...m }; delete r.at; return r; }
/** Tiến độ hiển thị trên ô Event: { p, n }. */
export function progress(id, s, k = 0) {
  if (id === 'route') return { p: Math.min(s.p, ROUTE.stations), n: ROUTE.stations };
  if (id === 'season') return { p: Math.min(s.n, 24), n: 24 };
  const list = pickErrands(k);
  return { p: list.filter(e => (s.c[e.id] || 0) >= e.need).length, n: list.length };
}
export const claimable = (id, s, k) => milestones(id, s, k).filter(m => m.reached && !m.claimed);

/**
 * Đồng bộ save.ev với lịch: phiên đã qua (khác key hiện tại) được chốt, quà đã đạt mà chưa nhận vào gifts.
 * Trả { cur (trạng thái phiên đang chạy hoặc null), gifts: [{ src, ...reward }] }.
 */
export function syncEvents(ev, cur) {
  const gifts = [];
  for (const id of ['route', 'season', 'errands']) {
    const s = ev[id];
    if (!s) continue;
    if (cur && cur.key === s.key) continue;
    const k = +String(s.key).split('#')[1] || 0;
    for (const m of claimable(id, s, k)) gifts.push({ src: id, ev: s.key, mid: m.mid, ...rewardOnly(m.reward) });
    delete ev[id];
  }
  if (cur && !ev[cur.id]) ev[cur.id] = blank(cur.id, cur.key);
  return { cur: cur ? ev[cur.id] : null, gifts };
}
const rewardOnly = r => { const o = {}; for (const k of ['coins', 'hint', 'pack', 'stamper', 'joker']) if (r[k]) o[k] = r[k]; if (r.stamp) o.routeStamp = 1; if (r.page) o.seasonPage = 1; if (r.rare) o.rareDecor = 1; return o; };
export { rewardOnly };

/** Nhận 1 mốc (1 lần). Trả phần quà hoặc null. */
export function claim(id, s, mid, k = 0) {
  const m = milestones(id, s, k).find(x => x.mid === mid);
  if (!m || !m.reached || s.claimed[mid]) return null;
  s.claimed[mid] = 1;
  return rewardOnly(m.reward);
}

// ------------------------------------------------------------ E1 Tuyến đưa thư
/** Thắng (chiến dịch hoặc Thư hôm nay): đi 1 trạm. Thua: không gọi, không lùi. Trả số trạm mới hoặc null nếu đã hết tuyến. */
export function routeStep(s) {
  const max = ROUTE.stations + ROUTE.trip.len * ROUTE.trip.max;
  if (s.p >= max) return null;
  s.p++;
  return s.p;
}

// ------------------------------------------------------------ E2 Tem theo mùa
export const SEASON_MOTIF = m => (m >= 3 && m <= 5 ? 'flower' : m >= 6 && m <= 8 ? 'shell' : m >= 9 && m <= 11 ? 'leaf' : 'snow');
/**
 * Lá mang dấu tem mùa: Thư hôm nay luôn có 1; level chiến dịch khoảng một nửa (hash(levelId, k)). Chỉ lá tem thường
 * (không phải lá vương miện, không phải Tem Vàng). levelKey đã nhận tem trong phiên này thì không có nữa. Trả id lá hoặc null.
 */
export function seasonCardFor(level, k, s, levelKey) {
  if (!s || s.got[levelKey]) return null;
  if (!level.daily && hash(`lpo-season|${level.id}|${k}`) % 2 === 1) return null;
  const cards = [...level.columns.flat(), ...level.deck].filter(c => c.k === 'stamp');
  if (!cards.length) return null;
  return cards[hash(`lpo-season-card|${levelKey}|${k}`) % cards.length].id;
}
/** Lá tem mùa được gửi đi: +1 tem (giữ cả khi thua). Trả số tem mới hoặc null. */
export function seasonCollect(s, levelKey) {
  if (s.got[levelKey]) return null;
  s.got[levelKey] = 1;
  s.n++;
  return s.n;
}

// ------------------------------------------------------------ E4 Tuần việc vặt
/** 5 việc tất định theo chu kỳ k. */
export function pickErrands(k) {
  return ERRAND_POOL.slice().sort((a, b) => hash(`lpo-errand|${k}|${a.id}`) - hash(`lpo-errand|${k}|${b.id}`)).slice(0, ERRANDS.pick)
    .sort((a, b) => ERRAND_POOL.indexOf(a) - ERRAND_POOL.indexOf(b));
}
/** Một sự kiện chơi (win, daily_day, deliver, deliver_big, stars3, decor, hard_win): tăng việc tương ứng. Trả id việc vừa xong. */
export function errandBump(s, k, on, n = 1) {
  const done = [];
  for (const e of pickErrands(k)) {
    if (e.on !== on) continue;
    const before = s.c[e.id] || 0;
    s.c[e.id] = Math.min(e.need, before + n);
    if (before < e.need && s.c[e.id] >= e.need) done.push(e.id);
  }
  return done;
}

// ------------------------------------------------------------ F11 Thử lại nhẹ tay
/** Ghi kết quả level chiến dịch thường. lossRec = save.losses = { lv, n }. */
export function gentleRecord(rec, lv, won) {
  if (won) { if (rec.lv === lv) { rec.lv = null; rec.n = 0; } return; }
  if (rec.lv === lv) rec.n = (rec.n || 0) + 1; else { rec.lv = lv; rec.n = 1; }
}
/** Lần thử này có được giúp không: thua >= 2 lần liền ở cùng level thường (từ L11), không phải level khó, không phải Daily. */
export const gentleOn = (rec, lv, { special = false, daily = false } = {}) =>
  !KILL.gentle_retry && !special && !daily && lv >= GENTLE.minLevel && rec.lv === lv && (rec.n || 0) >= GENTLE.losses;
