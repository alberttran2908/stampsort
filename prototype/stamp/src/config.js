// L13 (liveops-30-days.md mục 3.4, 9.2): cấu hình LiveOps đóng gói cùng bản build (assets/liveops.json), đọc lúc khởi động.
// Cùng khoá với Firebase Remote Config sau này (chưa gọi mạng). Module thuần: test được trong Node.
//
// Cách hoạt động: giá trị mặc định là chính các hằng số trong liveops.js / events.js / CONF dưới đây (chụp lại lúc nạp module).
// applyConfig(raw) trộn raw lên mặc định rồi GHI ĐÈ TẠI CHỖ vào các object đó, nên mọi module đang dùng chúng thấy giá trị mới.
// Khoá lạ bị bỏ qua, sai kiểu thì giữ mặc định (ghi vào warnings). Thiếu file / JSON hỏng: chạy bằng mặc định.
import * as LIVE from './liveops.js';
import * as EV from './events.js';

/** Giá trị chỉ main.js dùng (thưởng Thư hôm nay, nhắc nghỉ, thông báo). */
export const CONF = {
  daily: { today: 40, catchup: 20, page: 150, page_size: 20 },
  rest: { minutes: 45, away_reset_minutes: 10 },
  notifications: { days: 7, hours: [9, 15, 19], default_hour: 9, ask_after_daily: 3 },
};
const BOOSTERS = ['hint', 'pack', 'stamper', 'joker'];
const ERRAND_ON = ['win', 'daily_day', 'deliver', 'deliver_big', 'stars3', 'decor', 'hard_win'];
const clone = o => JSON.parse(JSON.stringify(o));

// Ánh xạ khoá JSON -> object đích trong code
const TARGETS = () => ({
  features: LIVE.FEATURES,
  rewards: {
    daily: CONF.daily, weekly: LIVE.WEEKLY, morning: LIVE.MORNING, welcome: LIVE.WELCOME, weekend: EV.WEEKEND,
    mailbag: EV.MAILBAG, route: EV.ROUTE, season: EV.SEASON, errands: EV.ERRANDS, gentle_retry: EV.GENTLE,
  },
  rest: CONF.rest,
  notifications: CONF.notifications,
  kill_switch: EV.KILL,
});
const DEFAULTS = {
  version: 1, schedule_mode: LIVE.SCHED.mode, cycle: LIVE.SCHED.cycle,
  features: clone(LIVE.FEATURES),
  big_events: clone(LIVE.BIG_EVENTS),
  weekend_event: { days: [...LIVE.SMALL_EVENTS[0].days], min_level: LIVE.SMALL_EVENTS[0].minLevel },
  rewards: {
    daily: clone(CONF.daily), weekly: clone(LIVE.WEEKLY), morning: clone(LIVE.MORNING), welcome: clone(LIVE.WELCOME), weekend: clone(EV.WEEKEND),
    mailbag: clone(EV.MAILBAG), route: clone(EV.ROUTE), season: clone(EV.SEASON), errands: { ...clone(EV.ERRANDS), pool: clone(EV.ERRAND_POOL) }, gentle_retry: clone(EV.GENTLE),
  },
  rest: clone(CONF.rest),
  notifications: clone(CONF.notifications),
  kill_switch: clone(EV.KILL),
};
export const defaults = () => clone(DEFAULTS);

const isNum = v => typeof v === 'number' && Number.isFinite(v);
/** Trộn src lên mẫu def theo đúng kiểu của def. Trả giá trị mới; ghi lỗi vào warn. */
function merge(def, src, path, warn) {
  if (src === undefined) return clone(def);
  if (Array.isArray(def)) {
    if (!Array.isArray(src)) { warn.push(path + ': cần mảng'); return clone(def); }
    return null;                                     // mảng: xử lý riêng ở validArray
  }
  if (def && typeof def === 'object') {
    if (!src || typeof src !== 'object' || Array.isArray(src)) { warn.push(path + ': cần object'); return clone(def); }
    const out = {};
    for (const k of Object.keys(def)) {
      const v = merge(def[k], src[k], path + '.' + k, warn);
      out[k] = v === null ? validArray(path + '.' + k, def[k], src[k], warn) : v;
    }
    for (const k of Object.keys(src)) if (!(k in def) && !k.startsWith('_')) warn.push(path + '.' + k + ': khoá lạ, bỏ qua');   // khoá _note: ghi chú
    return out;
  }
  if (typeof def === 'number') { if (isNum(src) && src >= 0) return src; warn.push(path + ': cần số >= 0'); return def; }
  if (typeof def === 'boolean') { if (typeof src === 'boolean') return src; warn.push(path + ': cần true/false'); return def; }
  if (typeof def === 'string') { if (typeof src === 'string') return src; warn.push(path + ': cần chuỗi'); return def; }
  return clone(def);
}
/** Mảng có luật riêng: sai một phần tử thì giữ cả mảng mặc định (tránh lịch event hay vòng booster lệch nửa chừng). */
function validArray(path, def, src, warn) {
  let ok = true;
  if (/big_events$/.test(path)) ok = src.length > 0 && src.every(e => e && typeof e.id === 'string' && ['route', 'season', 'errands'].includes(e.id) && isNum(e.from) && isNum(e.to) && e.from <= e.to && isNum(e.minLevel));
  else if (/mailbag\.cycle$/.test(path)) ok = src.length > 0 && src.every(b => BOOSTERS.includes(b));
  else if (/route\.milestones$/.test(path) || /season\.sets$/.test(path)) ok = src.length > 0 && src.every(m => m && isNum(m.at));
  else if (/errands\.pool$/.test(path)) ok = src.length >= 5 && src.every(e => e && typeof e.id === 'string' && ERRAND_ON.includes(e.on) && isNum(e.need) && e.need > 0 && isNum(e.coins));
  else if (/days$/.test(path) || /hours$/.test(path)) ok = src.length > 0 && src.every(isNum);
  else ok = src.every(x => typeof x === typeof def[0]);
  if (!ok) { warn.push(path + ': mảng không hợp lệ, dùng mặc định'); return clone(def); }
  return clone(src);
}
function assignDeep(target, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) assignDeep(target[k], src[k]);
    else target[k] = clone(src[k]);
  }
}
let last = { source: 'default', warnings: [], cfg: defaults() };
/**
 * Áp cấu hình. raw: object đã parse (null = thiếu file / hỏng). Trả { source: 'file'|'default', warnings, cfg }.
 * Gọi nhiều lần được (luôn trộn lên mặc định gốc, không cộng dồn lần trước).
 */
export function applyConfig(raw, source = 'file') {
  const warn = [];
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) { if (raw != null) warn.push('gốc: cần object'); raw = {}; source = 'default'; }
  const cfg = merge(DEFAULTS, raw, 'liveops', warn);
  // ghi đè tại chỗ
  LIVE.SCHED.cycle = Math.max(7, Math.round(cfg.cycle));
  LIVE.SCHED.mode = cfg.schedule_mode === 'global' ? 'global' : 'player';
  LIVE.BIG_EVENTS.splice(0, LIVE.BIG_EVENTS.length, ...clone(cfg.big_events));
  LIVE.SMALL_EVENTS[0].days = [...cfg.weekend_event.days];
  LIVE.SMALL_EVENTS[0].minLevel = cfg.weekend_event.min_level;
  const T = TARGETS();
  assignDeep(T.features, cfg.features);
  for (const k of Object.keys(T.rewards)) {
    const r = clone(cfg.rewards[k]);
    if (k === 'errands') { EV.ERRAND_POOL.splice(0, EV.ERRAND_POOL.length, ...r.pool); delete r.pool; }
    // mảng (vòng booster, mốc) thay nguyên, object trộn
    for (const kk of Object.keys(r)) if (Array.isArray(r[kk])) { T.rewards[k][kk] = r[kk]; delete r[kk]; }
    assignDeep(T.rewards[k], r);
  }
  assignDeep(T.rest, cfg.rest);
  for (const kk of Object.keys(cfg.notifications)) T.notifications[kk] = clone(cfg.notifications[kk]);
  assignDeep(T.kill_switch, cfg.kill_switch);
  last = { source: warn.length && source === 'file' ? 'file+default' : source, warnings: warn, cfg };
  return last;
}
export const configInfo = () => last;
/** Đọc file JSON (trình duyệt). Lỗi mạng / 404 / JSON hỏng: mặc định. */
export async function loadConfig(url = 'assets/liveops.json', fetchFn = globalThis.fetch) {
  let raw = null, err = '';
  try {
    const r = await fetchFn(url, { cache: 'no-store' });
    if (!r.ok) err = 'HTTP ' + r.status;
    else { const txt = await r.text(); try { raw = JSON.parse(txt); } catch (e) { err = 'JSON hỏng'; } }
  } catch (e) { err = 'không tải được'; }
  const info = applyConfig(raw, raw ? 'file' : 'default');
  if (err) info.warnings.unshift(url + ': ' + err);
  return info;
}
