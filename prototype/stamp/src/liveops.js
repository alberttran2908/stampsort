// L1 (liveops-30-days.md mục 3, 9.2): lịch tính local theo đồng hồ máy, không cần server.
// Module thuần (không DOM): chạy được trong Node cho tests/liveops.test.mjs. Đồng hồ giả: setClock() hoặc ?now= (main.js, chế độ ?debug).
//
// Ngày lịch tính theo giờ máy (múi giờ máy), đổi lúc 00:00. "Ngày của người chơi" pd = số ngày lịch từ lần mở app đầu, bắt đầu 1.
// Chu kỳ 28 ngày: k = floor((pd - 1) / 28), cd = ((pd - 1) mod 28) + 1. Chống lùi giờ: lưu maxSeenDay, ngày hiệu dụng
// không bao giờ nhỏ hơn (mục 3.3): lùi giờ không tạo Thư hôm nay mới, không tạo quà mới.

export const CYCLE = 28;
// Bảng mở khoá theo level ĐÃ THẮNG (mục 2). Chỉ F1/F2 có UI ở vòng này; còn lại dùng cho liveState và các vòng sau.
export const FEATURES = { daily: 5, stampbook: 5, weekly: 5, weekend: 8, morning: 5, welcome: 5, gentleRetry: 11, route: 12, mailbag: 15, season: 20, errands: 30 };
// Event lớn theo ngày trong chu kỳ cd (mục 3.2, 3.4). Chu kỳ đầu E1 bắt đầu cd 2 (D1 là ngày học chơi), từ chu kỳ 2 bắt đầu cd 1.
export const BIG_EVENTS = [
  { id: 'route', from: 2, to: 7, minLevel: 12 },
  { id: 'season', from: 8, to: 21, minLevel: 20 },
  { id: 'errands', from: 22, to: 28, minLevel: 30 },
];
export const SMALL_EVENTS = [{ id: 'weekend', days: [6, 0], minLevel: 8 }];   // getDay(): 6 = Thứ Bảy, 0 = Chủ nhật

let clock = () => Date.now();
/** Đồng hồ giả cho test: fn trả ms. setClock(null) về đồng hồ thật. */
export function setClock(fn) { clock = typeof fn === 'function' ? fn : () => Date.now(); }
export const nowMs = () => clock();

/** Số ngày lịch (giờ máy) của thời điểm ms: ngày 0 = 1970-01-01 theo lịch địa phương. Qua nửa đêm giờ máy thì +1. */
export function epochDay(ms) {
  const d = new Date(ms);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
}
/** Ngày lịch -> 'YYYY-MM-DD' (dùng làm khoá save, dễ đọc khi debug). */
export function dayKey(day) {
  const d = new Date(day * 864e5);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
export function parseDayKey(k) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(k || '');
  return m ? Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5) : null;
}
/** Thứ trong tuần của ngày lịch (0 = Chủ nhật ... 6 = Thứ Bảy), giống Date.getDay(). */
export const weekday = day => new Date(day * 864e5).getUTCDay();
/** Tuần lịch Thứ Hai–Chủ nhật: số thứ tự tuần (ngày Thứ Hai của tuần / 7). Dùng cho Thẻ tuần F3 (L3). */
export const isoWeek = day => Math.floor((day - ((weekday(day) + 6) % 7) + 3) / 7);

/** Khởi tạo / cập nhật trạng thái lịch trong save. Trả ngày hiệu dụng (đã chống lùi giờ). Gọi mỗi lần mở app / về màn chính. */
export function touch(live, ms = clock()) {
  const real = epochDay(ms);
  if (!Number.isFinite(live.firstOpenDay)) live.firstOpenDay = real;
  if (!Number.isFinite(live.maxSeenDay)) live.maxSeenDay = real;
  const day = Math.max(real, live.maxSeenDay);
  live.maxSeenDay = day;
  if (live.lastOpenDay !== day) {
    // F6 (L4): số ngày lịch KHÔNG mở app giữa lần mở trước và hôm nay. Giữ con số lớn nhất tới khi nhận quà chào mừng.
    if (Number.isFinite(live.lastOpenDay)) {
      const away = day - live.lastOpenDay - 1;
      if (away >= WELCOME.minAway) live.awayDue = Math.max(live.awayDue || 0, away);
    }
    live.prevOpenDay = live.lastOpenDay ?? null; live.lastOpenDay = day;
  }
  return day;
}
/** Ngày hiệu dụng mà không ghi vào save (đọc thuần). */
export function effectiveDay(live, ms = clock()) {
  const real = epochDay(ms);
  return Number.isFinite(live.maxSeenDay) ? Math.max(real, live.maxSeenDay) : real;
}

/**
 * Trạng thái lịch. wonLevel = level cao nhất đã thắng.
 * Trả { day, pd, k, cd, big, weekend, dailyIndex, isoWeek, rolledBack }.
 * big: id event lớn đang chạy và đủ level (tối đa 1), hoặc null. bigPending: event đang trong cửa sổ nhưng chưa đủ level.
 */
export function liveState(live, ms = clock(), wonLevel = 0, opts = {}) {
  const real = epochDay(ms);
  const first = Number.isFinite(live.firstOpenDay) ? live.firstOpenDay : real;
  const day = Number.isFinite(live.maxSeenDay) ? Math.max(real, live.maxSeenDay) : real;
  const pd = day - first + 1;
  const k = Math.floor((pd - 1) / CYCLE), cd = ((pd - 1) % CYCLE) + 1;
  let win = null;
  for (const e of BIG_EVENTS) {
    const from = e.id === 'route' && k >= 1 ? 1 : e.from;
    if (cd >= from && cd <= e.to) { win = e; break; }
  }
  const big = win && wonLevel >= win.minLevel ? win.id : null;
  const wd = weekday(day);
  const weekend = SMALL_EVENTS[0].days.includes(wd) && wonLevel >= SMALL_EVENTS[0].minLevel;
  const pool = opts.poolSize || 0;
  return { day, key: dayKey(day), pd, k, cd, big, bigPending: win && !big ? win.id : null, weekend, weekday: wd,
    dailyIndex: pool ? ((day + (opts.offset || 0)) % pool + pool) % pool : null, isoWeek: isoWeek(day), rolledBack: real < day };
}
/** Tính năng đã mở theo bảng FEATURES. */
export const featureOn = (id, wonLevel) => wonLevel >= (FEATURES[id] ?? Infinity);

// ============================================================ L3, L4 (liveops-30-days.md mục 6.1, 6.2: F3, F4, F6; mục 4: hàng đợi popup)
// Hằng số phần thưởng (sau này đọc từ liveops.json, L13).
export const WEEKLY = { need: 5, coins: 100, hint: 1, pack: 1 };
export const MORNING = { coins: 20, hintEvery: 7 };
export const WELCOME = { minAway: 3, bigAway: 7, hint: 1, pack: 1, moves: 5, joker: 1 };

/** Ngày Thứ Hai của tuần lịch chứa `day`. */
export const weekStart = day => day - ((weekday(day) + 6) % 7);

/**
 * F3 Thẻ tuần 5/7: 7 ô Thứ Hai..Chủ nhật của tuần chứa `day`. won: { [ngày]: 1|2 } (D.won của Thư hôm nay; chơi bù đóng ô
 * của ngày lá thư, nên thư hôm qua cùng tuần thì đóng ô hôm qua). claimed: { [isoWeek]: 1 }.
 * Trả { week, days[7], cells[7] (true = có dấu), count, need, claimed, ready (đủ 5 mà chưa nhận) }.
 */
export function weeklyCard(won = {}, day, claimed = {}) {
  const mon = weekStart(day), week = isoWeek(day);
  const days = Array.from({ length: 7 }, (_, i) => mon + i);
  const cells = days.map(d => !!won[d]);
  const count = cells.filter(Boolean).length;
  const got = !!claimed[week];
  return { week, days, cells, count, need: WEEKLY.need, claimed: got, ready: !got && count >= WEEKLY.need };
}

/** F4 Thư buổi sáng: đến hạn khi đã qua L5, từ ngày người chơi thứ 2, và chưa nhận hôm nay. m = save.morning = { last, n }. */
export function morningDue(m = {}, day, pd, wonLevel) {
  return featureOn('morning', wonLevel) && pd >= 2 && m.last !== day;
}
/** Phần thưởng lần nhận thứ n (đếm số lần nhận, không cần liên tiếp): 20 xu, lần thứ 7, 14, 21... thêm 1 Gợi ý. */
export const morningReward = n => ({ coins: MORNING.coins, hint: n > 0 && n % MORNING.hintEvery === 0 ? 1 : 0 });

/** F6 Chào mừng quay lại: vắng >= 3 ngày lịch (live.awayDue do touch() ghi) và đã qua L5. */
export const welcomeDue = (live = {}, wonLevel) => featureOn('welcome', wonLevel) && (live.awayDue || 0) >= WELCOME.minAway;
export function welcomeReward(away) {
  return { hint: WELCOME.hint, pack: WELCOME.pack, moves: WELCOME.moves, joker: away >= WELCOME.bigAway ? WELCOME.joker : 0 };
}

const KINDS = ['coins', 'hint', 'pack', 'stamper', 'joker', 'moves'];
/** Cộng nhiều phần quà thành 1 phong bì. */
export function mergeRewards(list) {
  const out = Object.fromEntries(KINDS.map(k => [k, 0]));
  for (const r of list) for (const k of KINDS) out[k] += r[k] || 0;
  return out;
}

/**
 * Hàng đợi popup tự hiện ở màn chính (mục 4): tối đa 1 popup mỗi lần mở app / mỗi lần về màn chính.
 * Thứ tự: (1) hỏi chơi tiếp ván dở (chỉ lúc mở app) > (2) phong bì quà gộp: F6 > quà event cũ > F4 > (3) "Tính năng mới"
 * (tối đa 1 mỗi phiên). due = { resume, welcome, gifts, morning, feature, featureShown }. Trả 'resume' | 'gifts' | 'feature' | null.
 */
export function pickPopup(due, trigger = 'home') {
  if (due.resume && trigger === 'boot') return 'resume';
  if (due.welcome || due.gifts || due.morning) return 'gifts';
  if (due.feature && !due.featureShown) return 'feature';
  return null;
}
