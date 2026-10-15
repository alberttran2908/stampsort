// L11 (liveops-30-days.md mục 6.1, 6.2: F9 Thông báo nhẹ, F10 Nhắc nghỉ). Phần lịch là logic thuần (test được trong Node).
//
// F9: mặc định TẮT. Chỉ hỏi sau lần giao Thư hôm nay thứ 3, có "Để sau". Tối đa 1 thông báo mỗi ngày, vào giờ người chơi chọn
// (mặc định 9:00). Lên lịch trước 7 ngày từ liveState, xếp lại mỗi lần mở app. Nội dung: Thư hôm nay đã đến; ngày đầu Tuyến
// đưa thư; ngày đầu Tem theo mùa. KHÔNG BAO GIỜ "sắp hết hạn", "sắp mất". Native: @capacitor/local-notifications (bridge tự tiêm
// window.Capacitor.Plugins.LocalNotifications). Web: không có plugin -> mọi hàm trả về êm, không hỏi gì.
// F10: chơi liên tục 45 phút (app ở tiền cảnh) thì 1 câu nhắc nhẹ, không chặn. Ra nền >= 10 phút thì tính lại từ đầu.
import { liveState, BIG_EVENTS, featureOn } from './liveops.js';

const IDS = [7101, 7102, 7103, 7104, 7105, 7106, 7107];    // id cố định để huỷ / xếp lại

/**
 * Lịch 7 ngày: [{ id, at (ms, giờ máy), kind: 'daily'|'route'|'season', day }]. live: save.live. Ngày hôm nay chỉ có nếu giờ
 * nhắc chưa qua. Tối đa 1 mỗi ngày; ngày mở event lớn ưu tiên câu event (nếu đủ level), còn lại là Thư hôm nay (nếu đã mở).
 */
export function buildSchedule(live, nowMs, wonLevel, { hour = 9, days = 7, dailyOn = true, kill = {}, skipDay = null } = {}) {
  const out = [];
  const now = new Date(nowMs);
  for (let i = 0; out.length < days && i <= days; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, 0, 0, 0).getTime();
    if (at <= nowMs) continue;
    const st = liveState(live, at, wonLevel);
    if (st.day === skipDay) continue;                       // hôm nay đã giao Thư hôm nay: không nhắc nữa
    let kind = null;
    const start = BIG_EVENTS.find(e => (st.k >= 1 && e.fromNext != null ? e.fromNext : e.from) === st.cd);
    if (start && wonLevel >= start.minLevel && !kill[start.id] && (start.id === 'route' || start.id === 'season')) kind = start.id;
    else if (dailyOn && !kill.daily) kind = 'daily';
    if (kind) out.push({ id: IDS[out.length], at, kind, day: st.day });
  }
  return out;
}
export { IDS as NOTIF_IDS };

let regd = null;
/** Plugin native: proxy có sẵn trong Capacitor.Plugins, hoặc đăng ký theo tên (như haptics.js). Web: null. */
function plugin() {
  if (typeof window === 'undefined' || !window.Capacitor) return null;
  const C = window.Capacitor;
  try {
    if (C.isNativePlatform && !C.isNativePlatform()) return null;
    if (C.Plugins && C.Plugins.LocalNotifications) return C.Plugins.LocalNotifications;
    if (C.isPluginAvailable && !C.isPluginAvailable('LocalNotifications')) return null;
    return regd || (regd = C.registerPlugin ? C.registerPlugin('LocalNotifications') : null);
  } catch (e) { return null; }
}
/** Có thông báo cục bộ không (chỉ app native có plugin). */
export const notifSupported = () => !!plugin();

/** Xin quyền (chỉ gọi sau khi người chơi bấm "Bật nhắc"). Trả true nếu được phép. */
export async function requestPermission() {
  const p = plugin();
  if (!p) return false;
  try {
    const cur = await p.checkPermissions();
    if (cur && cur.display === 'granted') return true;
    const r = await p.requestPermissions();
    return !!r && r.display === 'granted';
  } catch (e) { return false; }
}
/** Huỷ lịch cũ rồi xếp lịch mới. texts(kind) -> { title, body }. Trả số thông báo đã xếp (0 nếu web / lỗi). */
export async function reschedule(list, texts) {
  const p = plugin();
  if (!p) return 0;
  try {
    await p.cancel({ notifications: IDS.map(id => ({ id })) });
    if (!list.length) return 0;
    await p.schedule({ notifications: list.map(n => ({ id: n.id, ...texts(n.kind), schedule: { at: new Date(n.at), allowWhileIdle: true }, extra: { kind: n.kind } })) });
    return list.length;
  } catch (e) { return 0; }
}
export async function cancelAll() {
  const p = plugin();
  if (!p) return;
  try { await p.cancel({ notifications: IDS.map(id => ({ id })) }); } catch (e) { /* ignore */ }
}

// ------------------------------------------------------------ F10 Nhắc nghỉ
/** Bộ đếm thời gian chơi liên tục. tick(ms, visible) gọi đều; trả true khi tới lúc nhắc (rồi tự đếm lại). */
export function restTimer({ minutes = 45, awayResetMinutes = 10 } = {}) {
  const st = { active: 0, hiddenAt: null };
  return {
    st,
    tick(dt, visible, now = Date.now()) {
      if (!visible) { if (st.hiddenAt == null) st.hiddenAt = now; return false; }
      if (st.hiddenAt != null) { if (now - st.hiddenAt >= awayResetMinutes * 60e3) st.active = 0; st.hiddenAt = null; }
      st.active += dt;
      return st.active >= minutes * 60e3;
    },
    reset() { st.active = 0; },
  };
}
export const notifFeatureOn = (wonLevel, dailyDone, askAfter = 3) => featureOn('daily', wonLevel) && dailyDone >= askAfter;
