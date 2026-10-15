// L2 (liveops-30-days.md mục 6.2 F1): pool và level của "Thư hôm nay". Module thuần (không DOM), test được trong Node.
//
// Nguồn pool, theo thứ tự:
//  1. LEVELS_DAILY (src/levels_daily.js, Level Dev sinh bằng gen_levels.mjs --daily và validator: c25 >= 0.97, o35 >= 0.85).
//  2. Chưa có thì POOL TẠM (quyết định của Feature Dev 2026-10-15, chờ pool thật): level chiến dịch dễ, cỡ Daily
//     (30–46 lá, không phải level khó, không có kịch bản dạy chơi hay giới thiệu booster, không phải "bump").
//     Level thường (không phải level nghỉ) được cộng 12% lượt cho dễ hơn chiến dịch (mục tiêu Daily = level nghỉ).
//     Đảo thứ tự cột để không nhìn ra ngay là level đã chơi (cột độc lập nhau trong luật, độ khó không đổi).
// Thứ tự pool: xáo tất định theo id (băm), để 2 ngày liền nhau không phải 2 level liền nhau của chiến dịch.

const REST = /^(br|intro-br|breather)$/;
const NORMAL = /^(nor|intro|normal|teach)$/;
const cardsOf = l => l.columns.flat().length + l.deck.length + (l.preplaced || []).flat().length;
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/** Pool Thư hôm nay: mảng { src, lv, tuned }. src là khoá ổn định (dùng để chống lặp và giữ thư đã mở trong ngày). */
export function buildDailyPool({ daily = [], campaign = [] } = {}) {
  if (daily.length) return daily.map(l => ({ src: 'daily:' + l.id, lv: l, tuned: true }));
  const pool = campaign.filter(l => l.id >= 3 && !l.special && !l.script && !l.unlock && l.moves != null
    && (REST.test(l.role || '') || NORMAL.test(l.role || '')) && cardsOf(l) >= 30 && cardsOf(l) <= 46)
    .map(l => ({ src: (l.source && l.source !== 'apk' ? 'gen:' : l.source === 'apk' ? 'apk:' : 'base:') + l.id, lv: l, tuned: false }));
  return pool.sort((a, b) => hash('lpo-daily-1|' + a.src) - hash('lpo-daily-1|' + b.src));
}

/**
 * Chọn mục pool cho ngày `day`. history: { [day]: src } các ngày đã mở thư. Đã có lựa chọn cho ngày đó (còn trong pool) thì giữ
 * (thư không đổi giữa ngày khi pool lớn lên). Không lặp: bỏ qua src đã dùng trong cửa sổ min(pool - 1, 60) ngày quanh đó.
 */
export function pickDaily(pool, day, history = {}, avoid = null) {
  if (!pool.length) return null;
  const kept = history[day] && pool.find(e => e.src === history[day]);
  if (kept) return kept;
  // pool tạm: tránh level chiến dịch người chơi sắp gặp (avoid(entry) = true), để Thư hôm nay không trùng level ngay sau đó
  if (avoid) { const ok = pool.filter(e => !avoid(e)); if (ok.length >= Math.min(pool.length, 8)) pool = ok; }
  const win = Math.min(pool.length - 1, 60);
  const recent = new Set();
  for (let d = day - win; d < day + win + 1; d++) if (d !== day && history[d]) recent.add(history[d]);
  const start = ((day % pool.length) + pool.length) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const e = pool[(start + i) % pool.length];
    if (!recent.has(e.src)) return e;
  }
  return pool[start];
}

/** Level chơi được cho ngày `key` từ một mục pool. id riêng ('D' + ngày) nên chữ ký lưu ván / cờ đã xem không lẫn với chiến dịch. */
export function dailyLevel(entry, key) {
  const l = entry.lv;
  const rest = REST.test(l.role || '');
  const moves = entry.tuned || rest ? l.moves : Math.ceil(l.moves * 1.12);
  return {
    id: 'D' + key, daily: true, src: entry.src, role: 'daily', foundations: l.foundations, moves, solverMoves: l.solverMoves,
    columns: entry.tuned ? l.columns : [...l.columns].reverse(), deck: l.deck, preplaced: l.preplaced || [],
    introduce: [], unlock: null,
  };
}
