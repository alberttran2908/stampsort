// Haptic 4 bậc (docs/design/benchmark-grand-games.md mục 4.4, vòng P1).
//   tap       chạm/nhặt lá, thả lá, rút bài    -> iOS selectionChanged       | web 5 ms
//   progress  tem vào ô, lật trúng vương miện   -> iOS impact LIGHT           | web 10 ms
//   milestone gửi thư, Stamper, mở ô phụ, decor -> iOS impact MEDIUM          | web [10, 30, 10]
//   success   thắng level                       -> iOS notification SUCCESS   | web [20, 60, 20]
//   deny      thả sai, hết nước                 -> không rung (game không phạt người chơi)
// Không dùng HEAVY (người lớn tuổi, older-players-pass.md).
//
// Nền tảng:
//   - Trong app Capacitor (iOS): plugin @capacitor/haptics qua window.Capacitor (bridge native tự tiêm vào WebView,
//     không cần bundler). Không có plugin thì im lặng.
//   - Trình duyệt có navigator.vibrate (Android Chrome): rung theo mẫu ms.
//   - WebKit (Safari, iOS web) không có Vibration API: không làm gì.
// Lời gọi cũ kiểu haptic(6) / haptic([10, 30, 10]) vẫn chạy: trên iOS được quy về bậc gần nhất,
// trên web/Android phát đúng mẫu ms cũ (không đổi hành vi).
// Công tắc: localStorage 'ss_haptics' ('0' = tắt). Mặc định bật.

const WEB = { tap: 5, progress: 10, milestone: [10, 30, 10], success: [20, 60, 20], deny: 0 };
const TIERS = Object.keys(WEB);

let enabled = true;
try { enabled = localStorage.getItem('ss_haptics') !== '0'; } catch (e) { /* storage bị chặn */ }

let plugin;            // undefined: chưa dò; null: không có
let selectionReady = false;

function nativePlugin() {
  if (plugin !== undefined) return plugin;
  plugin = null;
  try {
    const C = window.Capacitor;
    if (C && C.isNativePlatform && C.isNativePlatform() && (!C.isPluginAvailable || C.isPluginAvailable('Haptics'))) {
      plugin = (C.Plugins && C.Plugins.Haptics) || (C.registerPlugin ? C.registerPlugin('Haptics') : null);
    }
  } catch (e) { plugin = null; }
  return plugin;
}

// Mẫu ms cũ -> bậc. Các mẫu đang dùng trong main.js:
//   4-8: nhặt/thả/rút/undo/thả sai -> tap | 10-20: combo, mở vương miện, Tem Điểm -> progress
//   [8,30,8]: lật trúng vương miện -> progress | [10..20, 30..40, ..]: thư, Stamper, ô phụ, decor, Overtime -> milestone
//   [20,60,20,60,40]: thắng -> success | [30,50,30]: hết nước -> deny (không rung trên iOS)
function tierOf(p) {
  if (typeof p === 'string') return TIERS.includes(p) ? p : 'tap';
  if (typeof p === 'number') return p <= 0 ? 'deny' : p <= 8 ? 'tap' : 'progress';
  if (Array.isArray(p) && p.length) {
    if (p.length >= 5) return 'success';
    if (p[0] >= 30) return 'deny';
    if (p[0] <= 8) return 'progress';
    return 'milestone';
  }
  return 'deny';
}

function fireNative(H, tier) {
  let r;
  switch (tier) {
    case 'tap':
      if (!selectionReady) { selectionReady = true; r = H.selectionStart(); }   // iOS: selectionChanged cần selectionStart trước
      r = Promise.resolve(r).then(() => H.selectionChanged());
      break;
    case 'progress': r = H.impact({ style: 'LIGHT' }); break;
    case 'milestone': r = H.impact({ style: 'MEDIUM' }); break;
    case 'success': r = H.notification({ type: 'SUCCESS' }); break;
    default: return;
  }
  if (r && r.catch) r.catch(() => {});
}

export function haptic(p = 'tap') {
  if (!enabled) return;
  try {
    const H = nativePlugin();
    if (H) { fireNative(H, tierOf(p)); return; }
    if (!navigator.vibrate) return;
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;          // trình duyệt chặn rung trước lần chạm đầu
    const pat = typeof p === 'string' ? WEB[tierOf(p)] : p;
    if (pat) navigator.vibrate(pat);
  } catch (e) { /* ignore */ }
}

export function setHapticsEnabled(on) {
  enabled = !!on;
  try { localStorage.setItem('ss_haptics', on ? '1' : '0'); } catch (e) { /* ignore */ }
}
export const hapticsEnabled = () => enabled;
