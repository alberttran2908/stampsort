// L1 (liveops-30-days.md mục 3, 9.2): lịch tính local theo đồng hồ máy, không cần server.
// Module thuần (không DOM): chạy được trong Node cho tests/liveops.test.mjs. Đồng hồ giả: setClock() hoặc ?now= (main.js, chế độ ?debug).
//
// Ngày lịch tính theo giờ máy (múi giờ máy), đổi lúc 00:00. "Ngày của người chơi" pd = số ngày lịch từ lần mở app đầu, bắt đầu 1.
// Chu kỳ 28 ngày: k = floor((pd - 1) / 28), cd = ((pd - 1) mod 28) + 1. Chống lùi giờ: lưu maxSeenDay, ngày hiệu dụng
// không bao giờ nhỏ hơn (mục 3.3): lùi giờ không tạo Thư hôm nay mới, không tạo quà mới.

export const CYCLE = 28;
// Bảng mở khoá theo level ĐÃ THẮNG (mục 2). Chỉ F1/F2 có UI ở vòng này; còn lại dùng cho liveState và các vòng sau.
export const FEATURES = { daily: 5, stampbook: 5, weekly: 5, weekend: 8, morning: 5, gentleRetry: 11, route: 12, mailbag: 15, season: 20, errands: 30 };
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
  if (live.lastOpenDay !== day) { live.prevOpenDay = live.lastOpenDay ?? null; live.lastOpenDay = day; }
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
