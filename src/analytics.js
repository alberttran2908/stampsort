// Analytics tối giản cho prototype: ghi sự kiện vào bộ đệm localStorage + console (debug),
// và chuyển tiếp sang SDK thật khi có (AppsFlyer / Firebase qua Capacitor plugin hoặc web SDK).
// Danh sách sự kiện và ý nghĩa UA: docs/design/difficulty-and-ua-milestones.md

const KEY = 'stampsort_events_v1';
const MAX = 800;
const DEBUG = /debug/.test(location.search);
let buffer = [];
try { buffer = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { buffer = []; }

const session = {
  id: Math.random().toString(36).slice(2, 10),
  start: Date.now(),
};
let installTs = Number(localStorage.getItem('stampsort_install_ts') || 0);
if (!installTs) {
  installTs = Date.now();
  try { localStorage.setItem('stampsort_install_ts', String(installTs)); } catch (e) { /* ignore */ }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(buffer.slice(-MAX))); } catch (e) { /* ignore */ }
}

/** Ghi một sự kiện. params: object phẳng (số/chuỗi/bool). */
export function track(name, params = {}) {
  const ev = {
    name,
    t: Date.now(),
    sinceInstallMin: Math.round((Date.now() - installTs) / 6000) / 10,
    session: session.id,
    ...params,
  };
  buffer.push(ev);
  if (buffer.length > MAX) buffer = buffer.slice(-MAX);
  persist();
  if (DEBUG) console.debug('[event]', name, params);
  // Chuyển tiếp SDK thật nếu đã nạp (không có thì bỏ qua)
  try {
    const af = window.AppsFlyer || (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppsFlyer);
    if (af && af.logEvent) af.logEvent({ eventName: name, eventValue: params });
    const fb = window.FirebaseAnalytics || (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics);
    if (fb && fb.logEvent) fb.logEvent({ name, params });
  } catch (e) { /* SDK lỗi không được làm hỏng game */ }
  return ev;
}

export function events() { return buffer.slice(); }
export function clearEvents() { buffer = []; persist(); }

/** Tóm tắt funnel từ bộ đệm (dùng cho bảng debug). */
export function funnelSummary() {
  const byLevel = {};
  for (const e of buffer) {
    if (!e.level) continue;
    const b = (byLevel[e.level] = byLevel[e.level] || { start: 0, complete: 0, fail: 0, overtime: 0, timeS: 0 });
    if (e.name === 'level_start') b.start++;
    if (e.name === 'level_complete') { b.complete++; b.timeS += e.time_s || 0; }
    if (e.name === 'level_fail') b.fail++;
    if (e.name === 'overtime_start') b.overtime++;
  }
  return byLevel;
}
