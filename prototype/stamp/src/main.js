import { LEVELS as LEVELS_A } from './levels.js';
import { LEVELS as LEVELS_B } from './levels_b.js';
import { LEVELS_APK } from './levels_apk.js';   // L21-L60: level APK 0.9.5 (tools/import_apk_levels.mjs), chỉ còn làm fallback
import { buildChapters, KEEPSAKE_DECOR } from './chapters.js';
import * as LIVE from './liveops.js';
import { buildDailyPool, pickDaily, dailyLevel } from './daily.js';
// L21+ sinh bởi tools/gen_levels.mjs (luật A, R3). File do Level Dev ghi, có thể chưa có: nạp động, thiếu thì mảng rỗng.
const LEVELS_GEN = await import('./levels_gen.js').then(m => m.LEVELS_GEN || [], () => []);
// Pool Thư hôm nay của Level Dev (gen_levels.mjs --daily, L2). Chưa có thì daily.js dựng pool tạm từ level chiến dịch.
const LEVELS_DAILY = await import('./levels_daily.js').then(m => m.LEVELS_DAILY || [], () => []);
import * as E from './engine.js';
import { hint as solverHint, solve } from './solver.js';
import { initAudio, unlockAudio, sfx, comboSfx, setMusicOn, isMusicOn, setMusicScene, setSfxVolume, sfxVolume } from './audio.js';
import { haptic, hapticsEnabled, setHapticsEnabled } from './haptics.js';   // 4 bậc, Capacitor Haptics trên iOS (benchmark-grand-games.md P1)
import { getSetting, setSetting, onSetting, textScale } from './settings.js';   // cài đặt của máy (R13)
import { tween, ease, wait, initFx, sparkle, confetti, coinFly, ring, killTweens, killKey, setLite, clearParticles, setFxSize, preloadFx } from './fx.js';
import { candidateActions, isDeadlocked } from './solver.js';
import { track as trackRaw, events as allEvents, funnelSummary, clearEvents, setCommon } from './analytics.js';
import * as EV from './events.js';
import { loadConfig, CONF, configInfo } from './config.js';
import * as NT from './notify.js';
import { stampPoints } from './points.js';
// L13: liveops.json đóng gói (phần thưởng, ngưỡng mở khoá, lịch event, kill_switch). Đọc trước mọi thứ dùng các hằng đó.
// Thiếu file / hỏng: chạy bằng mặc định trong code. ?debug&liveops=<đường dẫn> để test file khác.
const CFG_INFO = await loadConfig((/debug/.test(location.search) && (location.search.match(/[?&]liveops=([^&]+)/) || [])[1]) ? decodeURIComponent(location.search.match(/[?&]liveops=([^&]+)/)[1]) : 'assets/liveops.json');
// L9: bộ đếm Tuần việc vặt lấy từ chính các sự kiện analytics (level_complete, daily_complete, deliver, decor_place)
function track(name, data = {}) { trackRaw(name, data); try { onMeta(name, data); } catch (e) { /* đếm việc vặt không được làm hỏng ván */ } }
import { t, getLang, setLang, topicName, residentOf, residentNote } from './copy.js';

// ============================================================ constants
// Lá dựng trong DOM ở kích thước gốc 165x214 rồi phóng to bằng CK khi đặt vị trí (applyTransform, .slot dùng --ck).
// CW/CH là kích thước THẬT trên stage, mọi phép tính bố cục / vùng chạm dùng CW/CH. CK đổi theo level: setCardScale().
const CW0 = 165, CH0 = 214;
let CW = CW0, CH = CH0, CK = 1;
// Toạ độ trên stage 1080 x H. H = 1920 trên màn 9:16; máy dài hơn thì stage cao thêm (full-bleed, không letterbox).
// Các hàng được đẩy theo vùng an toàn (tai thỏ / thanh home) và chia phần dư: xem fit().
let ROW_A = 245, FOUND_Y = 585, TAB_Y = 885, TAB_BOTTOM = 1560;
let STAGE_H = 1920, DY_HUD = 0, DY_BOARD = 0, DY_BOT = 0;
let DECK_X = 867, WASTE_X = 391, FAN = 66;
const EXTRA_X = 48;   // lề trái/phải 48, quạt 3 lá waste căn giữa màn hình
let DOWN_GAP = 32, UP_GAP = 70;
const COMBO_MAX = 6;
// Giá theo APK 0.9.5: BoosterManager (hint 300, pack 500, stamper 500, joker 1200), GameSetting (hộc phụ 1000,
// 900 = giả thuyết giá +5 moves). Undo không có trong game gốc: khác biệt "cozy" của mình.
// Giá theo thu nhập 10 level đầu (~750-800 xu kể cả x2 quảng cáo): đủ mua 1 lần +5 moves hoặc 1-2 booster.
// [GIẢ THUYẾT] chờ PO chốt (review game design 2026-10-10 mục 3.4). Giá cũ: hint 300, pack/stamper 500, joker 1200, slot 1000, moves 900.
const COSTS = { undo: 30, hint: 150, pack: 250, stamper: 250, joker: 500, slot: 400, moves: 300 };
// Lịch mở theo video: Hint L2, Pack L4, Stamper L7, Joker L9; hộc phụ mua được từ L2.
const UNLOCK_AT = { hint: 2, pack: 4, stamper: 7, joker: 9, slot: 2 };
const GIFTS = { hint: 3, pack: 2, stamper: 2, joker: 2 };   // Joker 2 (PO chốt 2026-10-10): kịch bản L9 dùng 1, còn 1 cho L10
// Tem Điểm (thay sao, gdd-core.md mục 5 + concept mục 5 "Bưu điện nhỏ"): mỗi level 1-3 Tem Điểm theo moves dư.
// Tổng kiếm được = tổng điểm CAO NHẤT từng level (chơi lại để nâng điểm thì được phần chênh). Tiêu vào decor màn hình chính,
// mở lần lượt; decor không cho perk gameplay. Giá [GIẢ THUYẾT]: tổng 24 / tối đa 30 của chương 1 -> trung bình ~2.4 điểm/level
// là đủ cả phòng, món cuối thường cần chơi lại 1-2 level.
// Mỗi chương (concept mục 3.1: khu mới = tem mới + decor mới) có 6 decor riêng, dùng chung 6 chỗ trên ảnh nền
// (đỉnh, tường trái/giữa/phải, kệ trái/phải). Màn hình chính hiện lưới level + decor của chương đang xem.
// R5: CHAPTERS sinh trong chapters.js (ch1–2: 10 level, ch3+: 20 level). Khai báo sau LEVELS (cần độ dài chiến dịch).
// Mốc UA: level "khó nhưng không thể thua". Mặc định theo levels.js (special/safety); ghi đè để A/B test:
//   ?hard=5,10      danh sách level khó      ?safety=overtime | retry | none
const AB = (() => {
  const h = location.search.match(/hard=([\d,]*)/);
  const sf = location.search.match(/safety=(overtime|retry|none)/);
  return { hard: h ? h[1].split(',').filter(Boolean).map(Number) : null, safety: sf ? sf[1] : null };
})();
// Bộ level: ?variant=a (Baseline A, clone ABI) | ?variant=b (luật riêng: ≤ 6 chủ đề, không cặp dễ nhầm; tools/gen_proto_levels.mjs --variant=b).
// Nhớ theo máy (A/B gán cố định cho mỗi người chơi), mặc định A. Mọi sự kiện analytics mang thêm trường variant.
const VARIANT = (() => {
  const q = location.search.match(/variant=([ab])/);
  let v = q ? q[1] : null;
  try { v = v || localStorage.getItem('stampsort_variant'); if (v) localStorage.setItem('stampsort_variant', v); } catch (e) { /* ignore */ }
  return v === 'b' ? 'b' : 'a';
})();
// L21+ (dùng chung cho A và B): ưu tiên level sinh (levels_gen.js); số level chưa sinh thì lấy level APK cùng số để tester
// không mất nội dung (bản web công khai: deploy_web.sh thay levels_apk.js bằng mảng rỗng, nên chỉ còn level sinh).
// ?apk=1: ép dùng level APK để so sánh nội bộ. Dừng ở chỗ hổng đầu tiên để số level luôn liền mạch (id = chỉ số + 1).
const USE_APK = /[?&]apk=1/.test(location.search);
const LEVELS_TAIL = (() => {
  const gen = new Map(LEVELS_GEN.map(l => [l.id, l])), apk = new Map(LEVELS_APK.map(l => [l.id, l]));
  const out = [];
  for (let id = 21; ; id++) {
    const lv = USE_APK ? (apk.get(id) || gen.get(id)) : (gen.get(id) || apk.get(id));
    if (!lv) break;
    out.push(lv.source ? lv : { ...lv, source: 'apk' });
  }
  return out;
})();
const LEVELS = (VARIANT === 'b' ? LEVELS_B : LEVELS_A).concat(LEVELS_TAIL);
const CHAPTERS = buildChapters(LEVELS.length);
const chapterOf = lv => CHAPTERS.find(c => lv >= c.from && lv <= c.to) || CHAPTERS[CHAPTERS.length - 1];
let homeCh = CHAPTERS[0];     // chương đang xem ở màn hình chính
let homePage = 0;             // chương 20 level: 2 trang 10 ô (lưới giữ 2 hàng, vừa màn 9:16)
setCommon({ variant: VARIANT });
const specialOf = lv => ((AB.hard ? AB.hard.includes(lv.id) : !!lv.special) ? (lv.special || 'hard') : null);
const safetyOf = lv => (specialOf(lv) ? (AB.safety || lv.safety || 'overtime') : 'none');
const BOOSTERS = [
  { id: 'hint', name: 'Hint', icon: 'assets/ui/ic_hint.png' },
  { id: 'pack', name: 'Pack', icon: 'assets/ui/ic_magnet.png' },       // art đợt 2 (D4 ô dư): nam châm giữ phong bì, khớp tên Nam châm
  { id: 'stamper', name: 'Stamper', icon: 'assets/ui/ic_stamper.png' },
  { id: 'joker', name: 'Joker', icon: 'assets/ui/ic_wild.png' },        // art đợt 2 (D3 ô dư): tem vàng ngôi sao cầu vồng, khớp tên Tem Vàng
];

const $ = id => document.getElementById(id);
const stage = $('stage'), board = $('board'), overlay = $('overlay');
const DEBUG = /debug/.test(location.search);

// Máy yếu (skill weak-gpu-perf): RAM <= 2GB, <= 4 nhân, hoặc GPU Mali/Adreno đời thấp/PowerVR. ?lite=1 / ?lite=0 để ép.
const LITE = (() => {
  const q = location.search.match(/lite=(\d)/);
  if (q) return q[1] === '1';
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  let gpu = '';
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  } catch (e) { /* không có WebGL */ }
  const weakGpu = /Mali-(4|T\d|G(31|51|52|57))|Adreno \(TM\) ([1-5]\d\d|60\d|61\d)|PowerVR|Vivante/i.test(gpu);
  return mem <= 2 || cores <= 4 || weakGpu;
})();
document.body.classList.toggle('lite', LITE);

// ============================================================ cài đặt máy (R13): cỡ chữ, âm lượng, giảm chuyển động
const MQ_REDUCE = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
/** Giảm chuyển động: cài đặt trong bảng Cài đặt HOẶC cài đặt hệ thống. Không đổi tốc độ lá bay / kéo thả (benchmark mục 8). */
function reduceMotion() { return getSetting('motion') === 'reduce' || !!(MQ_REDUCE && MQ_REDUCE.matches); }
/** Cỡ chữ cho style inline: nhân biến --fs (áp ngay khi đổi mức, không cần dựng lại). */
const fs = n => `calc(${n}px * var(--fs, 1))`;
function applySettings() {
  document.body.style.setProperty('--fs', String(textScale()));
  document.body.classList.toggle('reduce-motion', reduceMotion());
  setLite(LITE || reduceMotion());                  // fx.js: ít hạt hơn khi giảm chuyển động
  setSfxVolume(getSetting('sfx'));
}
document.body.style.setProperty('--fs', String(textScale()));
if (MQ_REDUCE && MQ_REDUCE.addEventListener) MQ_REDUCE.addEventListener('change', () => applySettings());

// ============================================================ save
const SAVE_KEY = 'stampsort_proto_v1' + (VARIANT === 'b' ? '_b' : '');   // tiến trình riêng cho từng bộ level
const defaultSave = () => ({ unlocked: 1, coins: 500, stars: {}, hint: 0, pack: 0, stamper: 0, joker: 0, slot: 0, seen: {}, attempts: {} });
let save = defaultSave();
try { save = { ...defaultSave(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch (e) { /* ignore */ }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
// Chủ đề Cocktail đổi thành Juice (age rating 4+, 2026-10-15): chuyển tem đã sưu tầm trong album sang tên mới
if (save.album && save.album.Cocktail) {
  save.album.Juice = [...new Set([...(save.album.Juice || []), ...save.album.Cocktail])];
  delete save.album.Cocktail;
  persist();
}
// R5: chương 3+ đổi từ 10 sang 20 level (L21+ là level sinh). Tiến độ giữ theo SỐ level (unlocked, Tem Điểm từng level),
// không reset. Cờ thưởng hết chương 3–6 thuộc cấu trúc cũ (L30/L40/L50/L60 của level APK) không còn đúng: bỏ một lần.
if ((save.chv || 1) < 2) { for (const k of ['chapter3', 'chapter4', 'chapter5', 'chapter6']) delete save[k]; save.chv = 2; persist(); }
// L1: lịch local. Đồng hồ giả chỉ ở chế độ ?debug: ?now=YYYY-MM-DD[THH:MM] (đồng hồ vẫn chạy từ mốc đó), ?pd=N (ngày người chơi N).
save.live = save.live || {};
{
  const q = location.search.match(/[?&]now=(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?)/);
  if (DEBUG && q) { const off = new Date(q[1].length > 10 ? q[1] : q[1] + 'T12:00').getTime() - Date.now(); LIVE.setClock(() => Date.now() + off); }
  const pq = location.search.match(/[?&]pd=(\d+)/);
  if (DEBUG && pq) {
    if (!Number.isFinite(save.live.firstOpenDay)) save.live.firstOpenDay = LIVE.epochDay(LIVE.nowMs());
    const target = (save.live.firstOpenDay + Math.max(1, +pq[1]) - 1) * 864e5 + 12 * 36e5;   // trưa ngày đích (giờ địa phương)
    const off = target + new Date(target).getTimezoneOffset() * 6e4 - Date.now();
    LIVE.setClock(() => Date.now() + off);
  }
}
LIVE.touch(save.live);
persist();
// Save của bản 10 level dừng ở unlocked = 10 dù đã thắng L10: mở level kế tiếp level cao nhất đã thắng
{
  const won = Object.keys(save.stars).map(Number).filter(n => save.stars[n]);
  if (won.length) save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, Math.max(...won) + 1));
}

// ============================================================ stage scaling
let scale = 1, stageLeft = 0, stageTop = 0;
// Vùng an toàn (tai thỏ / Dynamic Island / thanh home). P0 TestFlight 4: HUD bị thanh trạng thái đè vì WKWebView (Capacitor,
// contentInset: never) trả env(safe-area-inset-*) = 0 lúc main.js chạy, inset chỉ có sau khi webview gắn vào cửa sổ và không
// có sự kiện resize nào báo -> đo lại nhiều lần (watchInsets). Thêm 2 lưới an toàn:
//   - ?sat=59&sab=34 (pt): ép inset để test trên Chrome (Chrome desktop luôn trả 0);
//   - app iOS native mà env() vẫn 0 sau 1,5 giây: đoán theo kích thước màn hình (máy có tai thỏ/đảo: 47-59pt trên, 34pt dưới).
const INSET_Q = (() => {
  const a = location.search.match(/[?&]sat=(\d+)/), b = location.search.match(/[?&]sab=(\d+)/);
  return a || b ? { top: a ? +a[1] : 0, bottom: b ? +b[1] : 0 } : null;
})();
const BOOT_T = performance.now();
function guessIosInsets() {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform() || (C.getPlatform && C.getPlatform() !== 'ios')) return null;
  if (performance.now() - BOOT_T < 1500) return null;          // chờ env() thật trước
  const w = Math.min(screen.width, screen.height), h = Math.max(screen.width, screen.height);
  if (h / w < 2) return { top: 20, bottom: 0 };                // iPhone SE / 8: thanh trạng thái 20pt, không có thanh home
  return { top: h >= 852 && w >= 393 ? 59 : 47, bottom: 34 };   // Dynamic Island 59pt; tai thỏ 44-48pt
}
function safeInsets() {
  if (INSET_Q) return INSET_Q;
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:0;top:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none';
  document.body.append(d);
  const cs = getComputedStyle(d);
  const r = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  d.remove();
  if (!r.top && !r.bottom) return guessIosInsets() || r;
  return r;
}
let insetKey = '';
// Bố cục dọc: khay đích ngay dưới HUD, cột bài ở giữa, hàng rút bài (ô phụ, lá đã rút, bộ bài) neo theo đáy
// ngay trên nhãn gợi ý: bộ bài là chỗ chạm nhiều nhất nên nằm trong vùng ngón cái. Gọi lại khi đổi cỡ lá (CH).
function layoutRows() {
  FOUND_Y = 282 + DY_BOARD;                        // ribbon tên chủ đề (~58px) không chạm ô MOVES
  TAB_Y = 585 + DY_BOARD;
  ROW_A = 1490 + DY_BOT - CH - 36;
  TAB_BOTTOM = ROW_A - 24;                         // cột bài dừng phía trên hàng rút bài
  if (stage) stage.style.setProperty('--rowa', ROW_A + 'px');
}
function fit() {
  scale = Math.min(innerWidth / 1080, innerHeight / 1920);
  STAGE_H = Math.max(1920, Math.round(innerHeight / scale));
  stageLeft = (innerWidth - 1080 * scale) / 2;
  stageTop = (innerHeight - STAGE_H * scale) / 2;
  const ins = safeInsets();
  insetKey = ins.top + ',' + ins.bottom;
  const sat = ins.top / scale, sab = ins.bottom / scale;
  const extra = STAGE_H - 1920;
  const free = Math.max(0, extra - sat - sab);
  DY_HUD = sat;                                    // HUD tránh tai thỏ
  DY_BOARD = sat + free * 0.3;                     // phần dư: 30% đẩy bàn chơi xuống, 70% cho chiều sâu cột bài
  DY_BOT = extra - sab;                            // thanh booster neo theo đáy, tránh thanh home
  layoutRows();
  stage.style.height = STAGE_H + 'px';
  stage.classList.toggle('short', extra < 160);       // màn 16:9 (iPhone SE): màn chính thu gọn logo/lưới để decor tường không chạm biển chương
  for (const [k, v] of [['--hud', DY_HUD], ['--bd', DY_BOARD], ['--bot', DY_BOT], ['--mid', extra / 2], ['--extra', extra], ['--sab', sab]]) stage.style.setProperty(k, v + 'px');
  const fxc = document.getElementById('fx');
  if (fxc) { fxc.style.height = STAGE_H + 'px'; setFxSize(STAGE_H); }   // QA N2: bitmap = chiều cao stage thật
  stage.style.transform = `scale(${scale})`;
  stage.style.left = stageLeft + 'px';
  stage.style.top = stageTop + 'px';
}
addEventListener('resize', () => { fit(); placeChrome(); });
fit();
// Inset đổi mà kích thước không đổi (webview iOS nhận safe area muộn, xoay máy, ra/vào nền): dựng lại bố cục
function checkInsets() {
  const ins = safeInsets();
  if (ins.top + ',' + ins.bottom !== insetKey) { fit(); placeChrome(); }
}
[0, 60, 200, 500, 1000, 1600, 2500, 4000].forEach(ms => setTimeout(checkInsets, ms));
setInterval(checkInsets, 2000);
for (const ev of ['orientationchange', 'pageshow', 'focus']) addEventListener(ev, () => setTimeout(checkInsets, 120));
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(checkInsets, 120); });
document.addEventListener('resume', () => setTimeout(checkInsets, 120));     // Capacitor: app quay lại từ nền
// Đặt lại vị trí phần khung bàn chơi theo toạ độ mới (đổi cỡ / xoay màn hình) mà không dựng lại lá bài
function placeChrome() {
  if (!S || !slotEls.length) return;
  slotEls.forEach((el, k) => { const p = slotPos(k); el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; });
  if (extraEl) { extraEl.style.left = EXTRA_X + 'px'; extraEl.style.top = ROW_A + 'px'; }
  colZones.forEach((z, i) => { z.style.left = colX(i) + 'px'; z.style.top = TAB_Y + 'px'; });
  if (recycleEl) { recycleEl.style.left = DECK_X + 'px'; recycleEl.style.top = ROW_A + 'px'; }
  if (deckHit) { deckHit.style.left = DECK_X - 10 + 'px'; deckHit.style.top = ROW_A - 14 + 'px'; }
  if (deckCount) { deckCount.style.left = DECK_X + CW - 104 + 'px'; deckCount.style.top = ROW_A + CH - 34 + 'px'; }
  relayout({ dur: 0 });
  if (typeof script !== 'undefined' && script && !drag && !panelOpen) showScriptHint();
}
const toStage = e => ({ x: (e.clientX - stageLeft) / scale, y: (e.clientY - stageTop) / scale });

// ============================================================ assets
let manifest = {};
const slug = t => t.toLowerCase().replace(/ /g, '_').replace(/&/g, 'and');
const artUrl = c => `assets/cards/${slug(c.t)}/${c.art}.png`;
const iconUrl = t => `assets/cards/${slug(t)}/icon.png`;
// Lá chủ đề vương miện: icon chỉ có nét, không màu (tools/icon_line.py) để không lẫn với tem thường có màu
const lineIconUrl = t => `assets/cards/${slug(t)}/icon_line.png`;
const decoded = new Map();     // giữ tham chiếu để trình duyệt không bỏ bitmap đã giải mã
function preload(urls) {
  return Promise.all(urls.map(u => {
    if (decoded.has(u)) return decoded.get(u);
    const i = new Image();
    // tải xong thì giải mã trước (tránh khựng lần đầu hiện lá); decode() có thể treo ở trang ẩn nên luôn có hạn chót
    const p = new Promise(res => {
      let done = false;
      const fin = () => { if (!done) { done = true; res(i); } };
      i.onload = () => { if (i.decode) i.decode().then(fin, fin); else fin(); setTimeout(fin, 400); };
      i.onerror = fin;
      setTimeout(fin, 4000);
    });
    i.src = u;
    decoded.set(u, p);
    return p;
  }));
}

// ============================================================ game state
let S = null;             // engine state
let L = null;             // level data
let levelIdx = 0;
let views = new Map();    // id -> view
let slotEls = [];         // foundation slot elements
let colZones = [];
let extraEl = null;
let deckHit = null, deckCount = null, recycleEl = null;
let undoStack = [];
let undoLeft = 5;
let combo = 0;
let busyInput = false;
let pending = [];         // promise của các animation hoàn thành ô
let ended = false;
let freeMovesUsed = false;
let jokerMode = false;
let pickMode = null;       // 'pack' | 'stamper': đang chờ chọn ô
let jokerSeq = 0;
let hintTimer = null;
let idleTimer = null;
let tutorial = null;
let script = null;         // tutorial ép bước: { steps, i }
let lastMovesShown = null;
let lowWarned = false;
let overtime = false;          // đã vào Overtime (level khó, hết moves vẫn chơi tiếp)
let jokerFree = false;         // Joker cứu trợ miễn phí khi kẹt (level khó)
let play = { start: 0, attempt: 0, boosters: 0, undo: 0, rescues: 0, continues: 0, taps: 0, drags: 0 };   // số liệu ván hiện tại cho analytics
let levelActive = false;
let extraKept = -1;          // level đã mua Ô phụ (giữ khi Retry cùng level)
let levelToken = 0;
let seasonCard = null, seasonKey = '';   // E2: id lá mang dấu tem mùa của ván này, khoá level để không nhận 2 lần
let dailyRun = null;            // đang chơi Thư hôm nay: { key, day, lv, catchup, replay }
const runKey = () => (dailyRun ? L.id : levelIdx);   // khoá "cùng một ván" cho Ô phụ giữ khi chơi lại
const completing = new Set();   // slot đang chạy animation phong bì

// ============================================================ layout
function colX(i) {
  const n = S.cols.length;
  const gap = n >= 5 ? 36 : 44;                    // cùng gap với hàng khay để khay và cột thẳng hàng
  const w = n * CW + (n - 1) * gap;
  return (1080 - w) / 2 + i * (CW + gap);
}
function slotPos(k) {
  if (k >= L.foundations) return { x: EXTRA_X, y: ROW_A };
  const n = L.foundations;
  const gap = n >= 5 ? 36 : 44;
  const w = n * CW + (n - 1) * gap;
  return { x: (1080 - w) / 2 + k * (CW + gap), y: FOUND_Y };
}
function colOffsets(col) {
  let nUp = 0, nDown = 0;
  for (let j = 0; j < col.length - 1; j++) if (col[j].up) nUp++; else nDown++;
  const maxH = TAB_BOTTOM - TAB_Y - CH;
  let up = UP_GAP, down = DOWN_GAP;
  // cột quá dài: nén khoảng lá úp trước (tối thiểu 10px), chỉ khi vẫn không đủ mới nén khoảng lá ngửa
  if (nUp * up + nDown * down > maxH) {
    down = Math.min(DOWN_GAP, Math.max(10 * CK, (maxH - nUp * up) / Math.max(1, nDown)));
    if (nUp * up + nDown * down > maxH) up = Math.max(0, (maxH - nDown * down) / Math.max(1, nUp));
  }
  const ys = [];
  let y = TAB_Y;
  for (let j = 0; j < col.length; j++) {
    ys.push(y);
    y += col[j].up ? up : down;
  }
  return ys;
}
/** id -> {x,y,z,up} theo state hiện tại */
function computeLayout() {
  const T = new Map();
  const nd = S.deck.length;
  S.deck.forEach((c, i) => {
    const d = Math.min(3, nd - 1 - i);            // 4 lá trên cùng lệch chéo tạo độ dày
    const o = nd > 1 ? (3 - d) * 5 : 0;
    T.set(c.id, { x: DECK_X - o, y: ROW_A - o, z: 100 + i, up: false, hide: i < nd - 4 });
  });
  const nw = S.waste.length;
  S.waste.forEach((c, i) => {
    const vis = i - (nw - 3);                      // vị trí trong quạt 3 lá
    const x = WASTE_X + Math.max(0, vis) * FAN;
    T.set(c.id, { x, y: ROW_A, z: 200 + i, up: true, hide: vis < -1 });
  });
  S.found.forEach((f, k) => {
    if (!f) return;
    const p = slotPos(k);
    const all = [f.topic, ...f.cards];
    all.forEach((c, j) => T.set(c.id, { x: p.x, y: p.y - Math.min(j, 6) * 2.5, z: 300 + j, up: true, hide: j < all.length - 2 }));
  });
  S.cols.forEach((col, i) => {
    const ys = colOffsets(col);
    col.forEach((c, j) => T.set(c.id, { x: colX(i), y: ys[j], z: 400 + j, up: c.up }));
  });
  return T;
}

// ============================================================ card views
// Màu khung lá theo CHỦ ĐỀ (cố định trong một level): thêm một kênh nhận diện, giảm nhầm giữa các chủ đề gần nhau.
let faceOfTopic = new Map();
function faceIndex(card) {
  if (!faceOfTopic.has(card.t)) faceOfTopic.set(card.t, (faceOfTopic.size % 6) + 1);
  return faceOfTopic.get(card.t);
}
function makeView(card) {
  const el = document.createElement('div');
  el.className = 'card';
  const inner = document.createElement('div');
  inner.className = 'inner';
  const front = document.createElement('div');
  front.className = 'side front';
  const back = document.createElement('div');
  back.className = 'side back';
  if (card.k === 'topic') {
    el.classList.add('topic');
    front.innerHTML = `<div class="crown"></div><div class="cnt">0/${card.n}</div><img class="art" src="${lineIconUrl(card.t)}" draggable="false"><div class="tag" style="${tagStyle(topicName(card.t))}">${topicName(card.t)}</div>`;
  } else if (card.k === E.JOKER) {
    el.classList.add('joker');
  } else {
    front.style.backgroundImage = `url(assets/ui/face_${faceIndex(card)}.png)`;
    front.innerHTML = `<img class="art" src="${artUrl(card)}" draggable="false">${card.id === seasonCard ? `<i class="season-mark" style="background-image:url(${motifUrl()})"></i>` : ''}`;
    if (card.id === seasonCard) el.classList.add('seasonal');
  }
  inner.append(front, back);
  el.append(inner);
  board.append(el);
  const v = { id: card.id, card, el, inner, x: DECK_X, y: ROW_A, r: 0, s: 1, z: 0, up: false, lifted: false, ox: 0 };
  el.classList.add('down');
  el._view = v;
  applyTransform(v);
  views.set(card.id, v);
  return v;
}
function animOn(v) { v.ac = (v.ac || 0) + 1; if (v.ac === 1) v.el.classList.add('anim'); }
function animOff(v) { v.ac = Math.max(0, (v.ac || 0) - 1); if (!v.ac) v.el.classList.remove('anim'); }
function applyTransform(v) {
  // phóng quanh tâm hộp 165x214 nên dịch thêm để góc trên-trái của lá (đã phóng) nằm đúng (x, y)
  v.el.style.transform = `translate3d(${v.x + v.ox + 82.5 * (CK - 1)}px,${v.y + 107 * (CK - 1)}px,0) rotate(${v.r}deg) scale(${v.s * CK})`;
}
// Level ít cột/ô (<= 4) thì lá to hơn ~11% (art ~43pt -> ~48pt trên điện thoại 375pt); 5 cột giữ cỡ gốc cho vừa ngang.
function setCardScale() {
  const n = Math.max(L.foundations || 0, S.cols.length);
  CK = n <= 4 ? 184 / CW0 : 1;
  CW = CW0 * CK; CH = CH0 * CK;
  UP_GAP = 70 * CK; DOWN_GAP = 32 * CK; FAN = 66 * CK;
  DECK_X = 1080 - 48 - CW;
  WASTE_X = 540 - (2 * FAN + CW) / 2;
  board.style.setProperty('--ck', CK);
  layoutRows();
}
function setZ(v, z) { if (v.z !== z) { v.z = z; v.el.style.zIndex = z; } }
function setUp(v, up, { animate = true, delay = 0 } = {}) {
  if (v.up === up) return;
  v.up = up;
  if (!animate) { killKey('flip-' + v.id); v.inner.style.transform = ''; v.el.classList.toggle('down', !up); return; }
  // lật 2D: thu scaleX về 0, đổi mặt, mở ra lại (không cần preserve-3d / perspective)
  const o = { k: 0 };
  animOn(v);
  tween(o, { k: 1 }, { dur: 300, delay, easing: ease.inOutCubic, key: 'flip-' + v.id, onUpdate: () => {
    if (o.k >= 0.5) v.el.classList.toggle('down', !v.up);
    v.inner.style.transform = `scaleX(${Math.max(0.03, Math.abs(Math.cos(o.k * Math.PI)))})`;
  } }).then(() => { v.inner.style.transform = ''; v.el.classList.toggle('down', !v.up); animOff(v); });
}
function moveView(v, t, { dur = 240, easing = ease.outCubic, delay = 0, arc = 0, lift = false } = {}) {
  const sx = v.x, sy = v.y;
  const dx = t.x - sx, dy = t.y - sy;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && v.r === 0 && v.s === 1) { v.x = t.x; v.y = t.y; applyTransform(v); return Promise.resolve(); }
  const o = { p: 0 };
  const r0 = v.r, s0 = v.s;
  animOn(v);
  return tween(o, { p: 1 }, {
    dur, easing, delay, key: 'pos-' + v.id,
    onUpdate: () => {
      const p = o.p;
      v.x = sx + dx * p;
      v.y = sy + dy * p - arc * Math.sin(Math.PI * Math.min(1, p));
      v.r = r0 * (1 - Math.min(1, p)) + (arc ? Math.sin(Math.PI * Math.min(1, p)) * (dx > 0 ? 6 : -6) : 0);
      v.s = s0 + (1 - s0) * Math.min(1, p) + (lift ? 0.08 * Math.sin(Math.PI * Math.min(1, p)) : 0);
      applyTransform(v);
    },
  }).then(() => animOff(v));
}

/** Đưa mọi view về vị trí theo state. except: bỏ qua các id đang được animate riêng. */
function relayout({ dur = 220, except = new Set(), flipDelay = 90 } = {}) {
  const T = computeLayout();
  for (const [id, v] of views) {
    const t = T.get(id);
    if (t && !v.gone) setHidden(v, t.hide, dur + 60);
    if (except.has(id) || v.lifted || v.gone) continue;
    if (!t) continue;
    setZ(v, t.z);
    moveView(v, t, { dur });
    setUp(v, t.up, { delay: flipDelay });
  }
  updateDeckUI();
  updateTopicCounts();
}

// Lá bị che hoàn toàn (đáy deck, waste cũ, giữa ô): ẩn để trình duyệt khỏi paint/composite.
function setHidden(v, hide, delay = 0) {
  clearTimeout(v.hideT);
  if (!hide) { v.el.style.visibility = ''; return; }
  v.hideT = setTimeout(() => { v.el.style.visibility = 'hidden'; }, delay);   // chờ lá khác bay tới che
}
function updateTopicCounts() {
  for (const v of views.values()) {
    if (v.card.k !== 'topic') continue;
    const cnt = v.el.querySelector('.cnt');
    const f = S.found.find(f => f && f.topic.id === v.id);
    cnt.textContent = f ? `${f.cards.length}/${f.n}` : `0/${v.card.n}`;
    v.el.classList.toggle('infound', !!f);
  }
}

// ============================================================ board chrome
function buildChrome() {
  board.innerHTML = '';
  views = new Map();
  slotEls = [];
  colZones = [];
  for (let k = 0; k < L.foundations; k++) {
    const p = slotPos(k);
    const el = document.createElement('div');
    el.className = 'slot';
    el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
    // .tray-front là con của .slot nhưng z-index vẫn so với lá trong #board (.slot không có z-index):
    // mép khay đè lên lá trong ô (z 300+), dưới lá ở cột (z 400+) và lá đang kéo/bay. Số đếm nằm trên biển đồng.
    el.innerHTML = '<div class="ribbon"></div><div class="tray-front"><div class="count"></div></div>';
    board.append(el);
    slotEls.push(el);
  }
  board.classList.toggle('n5', L.foundations >= 5 || S.cols.length >= 5);
  // hộc phụ (khóa)
  extraEl = document.createElement('div');
  extraEl.className = 'slot locked';
  extraEl.style.left = EXTRA_X + 'px'; extraEl.style.top = ROW_A + 'px';
  const slotUnlocked = levelIdx + 1 >= UNLOCK_AT.slot;
  extraEl.innerHTML = '<div class="ribbon"></div><div class="tray-front"><div class="count"></div></div><div class="lockicon"></div>' +
    (slotUnlocked ? `<div class="plus"></div><div class="lv">${t('extra_label')}</div>` : `<div class="lv">Lv ${UNLOCK_AT.slot}</div>`);
  extraEl.addEventListener('pointerup', onExtraSlot);
  board.append(extraEl);
  if (levelIdx === 0) extraEl.style.display = 'none';       // màn đầu sạch: chưa cần ô phụ
  // vùng cột
  S.cols.forEach((_, i) => {
    const z = document.createElement('div');
    z.className = 'colzone';
    z.style.left = colX(i) + 'px'; z.style.top = TAB_Y + 'px';
    board.append(z);
    colZones.push(z);
  });
  // deck
  recycleEl = document.createElement('div');
  recycleEl.className = 'recycle';
  recycleEl.style.left = DECK_X + 'px'; recycleEl.style.top = ROW_A + 'px';
  recycleEl.innerHTML = '<i></i>';
  board.append(recycleEl);
  deckHit = document.createElement('div');
  deckHit.className = 'deck-hit';
  deckHit.style.left = DECK_X - 10 + 'px'; deckHit.style.top = ROW_A - 14 + 'px'; deckHit.style.zIndex = 950;
  deckHit.addEventListener('pointerdown', e => { e.stopPropagation(); unlockAudio(); onDeck(); });
  board.append(deckHit);
  deckCount = document.createElement('div');
  deckCount.className = 'deck-count';
  deckCount.style.left = DECK_X + CW - 104 + 'px'; deckCount.style.top = ROW_A + CH - 34 + 'px';   // nhãn đè góc dưới phải bộ bài (concept B)
  board.append(deckCount);
}
function updateDeckUI() {
  deckCount.textContent = S.deck.length;
  deckCount.style.opacity = S.deck.length ? 1 : 0;
  recycleEl.style.opacity = !S.deck.length && S.waste.length ? 1 : 0.25;
  recycleEl.querySelector('i').style.opacity = !S.deck.length && S.waste.length ? 1 : 0;
  // hộc phụ
  const extraOpen = S.extraSlot;
  extraEl.classList.toggle('locked', !extraOpen);
  extraEl.querySelectorAll('.lockicon,.plus,.lv').forEach(x => (x.style.display = extraOpen ? 'none' : ''));
  // cột rỗng: hiện vùng
  colZones.forEach((z, i) => { z.style.opacity = S.cols[i].length ? 0 : 1; });
}
function slotEl(k) { return k >= L.foundations ? extraEl : slotEls[k]; }
// cỡ chữ theo độ dài (không đo DOM): đủ chỗ thì giữ cỡ chuẩn, dài thì co dần tới tối thiểu 22px rồi mới cắt "..."
function fitSize(text, base, fitChars) {
  const n = String(text).length;
  return n <= fitChars ? base : Math.max(24, Math.floor(base * fitChars / n));
}
// Nhãn tên trên lá vương miện (review GD v2 #3): luôn 34px, không co; tên dài xuống 2 dòng. Từ đơn dài (> 8 ký tự) khít chữ lại
// một chút thay vì cắt "...". Lá có kích thước cố định nên KHÔNG nhân --fs.
function tagStyle(name) {
  const str = String(name);
  if (str.length <= 8) return 'font-size:34px';
  const longest = Math.max(...str.split(/\s+/).map(w => w.length));
  return `font-size:34px;white-space:normal;line-height:.92;bottom:12px;overflow:visible${longest > 8 ? `;letter-spacing:${longest > 10 ? -2.5 : -1.5}px` : ''}`;
}
function updateSlotLabels() {
  S.found.forEach((f, k) => {
    const el = slotEl(k);
    if (!el) return;
    if (!f && completing.has(k)) return;
    el.classList.toggle('open', !!f);
    if (f) {
      const nm = topicName(f.t);
      const rb = el.querySelector('.ribbon');
      rb.textContent = nm;
      rb.style.fontSize = fitSize(nm, 34, 8) + 'px';
      el.querySelector('.count').textContent = `${f.cards.length}/${f.n}`;
    }
  });
}

// ============================================================ HUD
const movesEl = $('moves'), movesVal = movesEl.querySelector('.val');
const movesAnim = { s: 1 };
function updateHUD(bump = false) {
  const m = S.moves;
  movesVal.textContent = m === Infinity ? '∞' : m;
  movesEl.classList.toggle('low', m !== Infinity && m <= 5);
  if (bump && lastMovesShown !== m && m !== Infinity) {
    movesAnim.s = 1.25;
    tween(movesAnim, { s: 1 }, { dur: 260, easing: ease.outBack, key: 'mv', onUpdate: o => { movesVal.style.transform = `scale(${o.s})`; } });
  }
  lastMovesShown = m;
  bumpCoins({ instant: true, pop: false });                // vào level: đặt thẳng số xu, không đếm
  $('title').textContent = curTitle();
  const fill = $('combo').querySelector('.fill');
  { const tp0 = topicProgress(); fill.style.transform = `scaleX(${tp0.total ? tp0.done / tp0.total : 0})`; $('combo').style.setProperty('--segs', Math.max(1, tp0.total)); }
  const tp = topicProgress();
  $('combo').querySelector('.txt').textContent = t('piles', { done: tp.done, total: tp.total });
  if (S.moves === 5 && !lowWarned && L.moves != null) { lowWarned = true; toast(t('tip_low', { n: 5 }), 1600); }
  if (S.moves === 10 && L.moves != null && L.moves > 20) onceTip('low', { n: 10 });
  renderBoosters();
}
/** Số chủ đề đã giao xong / tổng: mục tiêu thắng là giao hết. */
function topicProgress() {
  const total = L.columns.flat().concat(L.deck, (L.preplaced || []).flat()).filter(c => c.k === 'topic').length;
  let left = S.found.filter(Boolean).length;
  for (const col of S.cols) for (const c of col) if (c.k === 'topic') left++;
  for (const c of S.deck.concat(S.waste)) if (c.k === 'topic') left++;
  return { done: total - left, total };
}
// Số xu trên HUD đếm dần tới save.coins trong 600 ms (R12, benchmark 4.3); lần gọi mới huỷ lần cũ (key riêng).
// Cập nhật cả bản sao ô xu nằm trên lớp mờ ở màn thắng.
const coinShown = { v: 0 };
const coinSpans = () => document.querySelectorAll('.hud-coins span');
function setCoinText(v) { const n = Math.round(v); coinSpans().forEach(sp => { sp.textContent = n; }); }
function bumpCoins({ instant = false, pop = true } = {}) {
  const to = save.coins;
  if (instant || reduceMotion()) { killKey('coincount'); coinShown.v = to; setCoinText(to); }
  else tween(coinShown, { v: to }, { dur: 600, easing: ease.outCubic, key: 'coincount', onUpdate: o => setCoinText(o.v) }).then(() => { if (coinShown.v === to) setCoinText(to); });
  if (!pop) return;
  const o = { s: 1.2 };
  const els = document.querySelectorAll('.hud-coins');
  tween(o, { s: 1 }, { dur: 220, easing: ease.outBack, key: 'coinbump', onUpdate: () => { els.forEach(el => { el.style.transform = `scale(${o.s})`; }); } });
}
/** Xu bay từ (fromX, fromY) về ô xu, cộng dần vào save. Trả về { finish() } để cộng ngay phần còn lại (chạm để tua). */
function coinsTo(n, fromX, fromY) {
  const hudX = 1080 - 150 - 120, hudY = 72 + DY_HUD;            // ô xu dời xuống theo vùng an toàn
  let left = Math.max(0, n);
  const ctrl = { get left() { return left; }, finish() { if (left > 0) { save.coins += left; left = 0; persist(); bumpCoins(); } } };
  if (!left) return ctrl;
  const count = Math.min(left, 12);
  const per = Math.max(1, Math.floor(left / count));
  let landed = 0;
  coinFly(fromX, fromY, hudX, hudY, count, () => {
    landed++;
    if (left <= 0) return;
    const add = landed >= count ? left : Math.min(per, left);     // đồng cuối mang phần lẻ
    left -= add;
    save.coins += add;
    sfx('coin', { vol: 0.5, rate: [1, 1.1225, 1.2599][Math.floor(Math.random() * 3)] });
    bumpCoins();
    persist();
  });
  setTimeout(() => ctrl.finish(), 1800);                          // xu bị xoá giữa đường (đổi level): vẫn cộng đủ
  return ctrl;
}

// ============================================================ boosters
function renderBoosters() {
  const box = $('boosters');
  const lv = levelIdx + 1;
  if (!box.children.length) {
    for (const d of BOOSTERS) {
      const b = document.createElement('div');
      b.className = 'booster';
      b.dataset.id = d.id;
      b.innerHTML = `<i style="background-image:url(${d.icon})"></i><div class="badge"></div><div class="name"></div><div class="lockbig"></div>`;
      b.addEventListener('pointerup', () => { unlockAudio(); onBooster(d.id); });
      box.append(b);
    }
  }
  for (const d of BOOSTERS) {
    const b = box.querySelector(`[data-id=${d.id}]`);
    const giftPending = L && L.unlock === d.id && !save.seen['unlock_' + d.id];   // quà sắp tặng: đừng bán trước
    const locked = lv < UNLOCK_AT[d.id] || giftPending;
    const count = save[d.id];
    b.classList.toggle('locked', locked);
    // chỉ hiện booster khoá KẾ TIẾP (biết cái gì sắp mở), các booster khoá xa hơn ẩn đi cho thanh dưới gọn
    const nextLock = BOOSTERS.map(x => x.id).find(id => lv < UNLOCK_AT[id]);
    b.style.visibility = locked && d.id !== nextLock ? 'hidden' : '';
    const st = scriptStep();
    const scriptWants = st && st.booster === d.id && !(d.id === 'joker' ? jokerMode : pickMode === d.id);
    b.classList.toggle('active', (d.id === 'joker' && jokerMode) || pickMode === d.id || !!scriptWants);
    const badge = b.querySelector('.badge');
    b.querySelector('.lockbig').style.display = locked ? '' : 'none';
    if (locked) { badge.style.display = 'none'; b.querySelector('.name').textContent = giftPending ? t('b_' + d.id) : `Lv ${UNLOCK_AT[d.id]}`; continue; }
    badge.style.display = '';
    b.querySelector('.name').textContent = t('b_' + d.id);
    b.querySelector('.name').classList.toggle('long', t('b_' + d.id).length > 9);   // Golden Stamp: chữ nhỏ hơn một bậc, không ra mép màn
    if (count > 0) { badge.className = 'badge'; badge.textContent = count; }
    else { badge.className = 'badge coin'; badge.textContent = COSTS[d.id]; }
  }
  const u = $('undoBtn');
  u.querySelector('.lbl').textContent = t('b_undo');
  const ub = u.querySelector('.badge');
  if (undoLeft > 0) { ub.className = 'badge'; ub.textContent = undoLeft; }
  else { ub.className = 'badge coin'; ub.textContent = COSTS.undo; }
  u.classList.toggle('off', !undoStack.length || !!scriptStep());
}
function spend(kind) {
  const have = kind === 'undo' ? undoLeft : save[kind];
  const used = paid => {
    if (kind === 'undo') play.undo++; else play.boosters++;
    track('booster_use', { level: levelIdx + 1, type: kind, paid, special: specialOf(L) || '' });
    return true;
  };
  if (have > 0) {
    if (kind === 'undo') undoLeft--; else save[kind]--;
    persist();
    return used(false);
  }
  if (save.coins >= COSTS[kind]) {
    save.coins -= COSTS[kind];
    persist();
    bumpCoins();
    return used(true);
  }
  toast(t('coins_short'));
  sfx('deny');
  return false;
}
function onBooster(id) {
  if (ended || busyInput) return;
  const lv = levelIdx + 1;
  if (id === 'joker' && jokerFree && !jokerMode) { toggleJoker(); return; }         // Tem Vàng cứu trợ: bật lại được kể cả khi booster còn khoá
  if (id !== 'undo' && lv < UNLOCK_AT[id]) { toast(t('unlocks', { n: UNLOCK_AT[id] })); sfx('deny'); return; }
  if (id !== 'undo' && L.unlock === id && !save.seen['unlock_' + id]) { toast(t('gift_soon')); sfx('deny'); return; }
  if (!scriptStep() && !(id === 'hint' && hintActive)) clearHint();                // bàn tay cũ (gợi ý, cứu trợ) không đứng lại trên nút
  if (scriptStep() && scriptStep().booster !== id) { toast(t('follow'), 1000); sfx('deny'); return; }
  sfx('click', { vol: 0.6 });
  if (id !== 'joker' && jokerMode) toggleJoker();
  if (id !== 'pack' && id !== 'stamper' && pickMode) cancelPick();
  if (id === 'undo') return doUndo();
  if (id === 'hint') return doHint();
  if (id === 'joker') { toggleJoker(); if (scriptStep() && scriptStep().booster === id) showBoosterStep(scriptStep()); return; }
  if (id === 'pack' || id === 'stamper') startPick(id);
  if (scriptStep() && scriptStep().booster === id) showBoosterStep(scriptStep());
}

// ---- undo
let undoBlockedBySend = false;
function pushUndo() {
  undoStack.push({ s: E.clone(S), combo });
  if (undoStack.length > 60) undoStack.shift();
}
function doUndo() {
  if (tooSoon()) return;
  if (!undoStack.length) { toast(t(undoBlockedBySend ? 'undo_sent' : 'nothing_undo')); sfx('deny'); return; }
  if (!spend('undo')) return;
  const snap = undoStack.pop();
  lastActAt = performance.now();
  // Undo không xoá thông tin: lá đã lộ trên cột vẫn ngửa sau khi hoàn tác (bỏ lỗ hổng "đi thử, nhìn lá úp, Undo")
  const seen = new Set(S.cols.flat().filter(c => c.up).map(c => c.id));
  S = snap.s;
  S.cols.forEach(col => col.forEach(c => { if (seen.has(c.id)) c.up = true; }));
  if (overtime) S.moves = Infinity;            // đã vào Overtime thì Undo không đưa về số moves cũ (QA #10)
  combo = snap.combo;
  clearHint();
  sfx('back');
  haptic('tap');
  // view của các lá đã trả về
  relayout({ dur: 260 });
  updateSlotLabels();
  updateHUD(true);
  saveRun();
}

// ---- hint
let hintActive = false;      // gợi ý (booster Hint) đang hiện: bấm thêm không tính phí
function clearHint() {
  clearTimeout(hintTimer);
  hintActive = false;
  for (const v of views.values()) v.el.classList.remove('hintglow');
  slotEls.concat([extraEl]).forEach(e => e && e.classList.remove('target'));
  colZones.forEach(z => z.classList.remove('target'));
  hideHand();
}
function computeHint() {
  const a = solverHint(S, { width: 50, timeLimitMs: 300 });
  return a;
}
function showAction(a, { loopHand = true } = {}) {
  clearHint();
  if (!a) return false;
  if (a.draw) {
    const top = S.deck.length ? views.get(S.deck[S.deck.length - 1].id) : null;
    if (top) top.el.classList.add('hintglow');
    handTap(DECK_X + CW / 2, ROW_A + CH / 2);
    return true;
  }
  const run = E.sourceCards(S, a.src);
  if (!run) return false;
  run.forEach(c => views.get(c.id).el.classList.add('hintglow'));
  const v0 = views.get(run[0].id);
  const to = targetCenter(a.dst);
  if (a.dst.to === 'found') slotEl(a.dst.i).classList.add('target');
  else {
    const col = S.cols[a.dst.j];
    if (col.length) views.get(col[col.length - 1].id).el.classList.add('hintglow');
    else colZones[a.dst.j].classList.add('target');
  }
  if (loopHand) handDrag(v0.x + CW / 2, v0.y + CH * 0.3, to.x, to.y - CH * 0.2);
  return true;
}
function doHint() {
  if (hintActive) return;                 // đang hiện đúng gợi ý này rồi (QA: bấm 4 lần mất 2 lượt + 300 xu)
  const a = computeHint();
  if (!a) { toast(t('no_hint')); sfx('deny'); return; }
  if (!spend('hint')) return;
  sfx('hint');
  if (!showAction(a)) toast(t('try_deck'));
  hintActive = true;
  hintTimer = setTimeout(clearHint, 6000);
  updateHUD();
}
function targetCenter(dst) {
  if (dst.to === 'found') { const p = slotPos(dst.i); return { x: p.x + CW / 2, y: p.y + CH / 2 }; }
  const col = S.cols[dst.j];
  const ys = colOffsets(col);
  const y = col.length ? ys[ys.length - 1] + UP_GAP : TAB_Y;
  return { x: colX(dst.j) + CW / 2, y: y + CH / 2 };
}

// ---- joker
function toggleJoker() {
  if (jokerMode) {
    if (scriptStep() || jokerFree) return;
    jokerMode = false; clearHint(); tut(null); updateDeckUI(); renderBoosters(); recheckStuck(); return;
  }
  if (!jokerFree && save.joker <= 0 && save.coins < COSTS.joker) { toast(t('coins_short')); sfx('deny'); return; }
  jokerMode = true;
  sfx('joker');
  colZones.forEach((z, i) => { z.style.opacity = 1; z.classList.add('target'); });
  S.cols.forEach(col => { if (col.length) views.get(col[col.length - 1].id).el.classList.add('hintglow'); });
  if (!scriptStep()) tut(t('joker_place'));
  renderBoosters();
}
function placeJokerAt(j) {
  jokerMode = false;
  if (jokerFree) jokerFree = false;
  else if (!spend('joker')) { clearHint(); updateDeckUI(); return; }
  pushUndo();
  const id = 'J' + (++jokerSeq);
  const res = E.placeJoker(S, j, id);
  const v = makeView({ id, t: E.JOKER, k: E.JOKER });
  const b = $('boosters').querySelector('[data-id=joker]');
  v.x = 540 - CW / 2; v.y = 1700; v.s = 0.5;
  setUp(v, true, { animate: false });
  applyTransform(v);
  clearHint();
  tut(null);
  const T = computeLayout().get(id);
  setZ(v, 3000);
  sfx('magnet');
  moveView(v, T, { dur: 420, easing: ease.outBack, arc: 160 }).then(() => {
    setZ(v, T.z);
    ring(T.x + CW / 2, T.y + CH / 2, { color: '#d9a441' });
    sparkle(T.x + CW / 2, T.y + CH / 2, 16, { colors: ['#ffd84a', '#fff4a0', '#ffffff'] });
    sfx('open');
    haptic('progress');
  });
  relayout({ except: new Set([id]) });
  updateHUD();
  undoStack = [];      // không undo joker
  renderBoosters();
  saveRun();
  if (script) { $('boosters').querySelectorAll('.booster').forEach(b => b.classList.remove('active')); script.i++; setTimeout(runScript, 500); }
  if (b) b.classList.remove('active');
  void res;
}

// ---- Pack (2 lá ẩn) / Stamper (1 lá) vào ô chọn
function pullable(k) {
  const f = S.found[k];
  if (!f) return false;
  const { hidden, visible } = E.cardsOfTopic(S, f.t);
  return hidden.length + visible.length > 0;
}
const hasHidden = i => S.cols[i].some(c => !c.up);
// cột kịch bản dạy Stamper: cột còn nhiều lá úp nhất (level có thể sinh lại nên không cố định số cột trong dữ liệu)
function stamperCol(step) {
  if (step.col == null) step.col = S.cols.map((c, i) => [c.filter(x => !x.up).length, i]).sort((a, b) => b[0] - a[0])[0][1];
  return step.col;
}
function jokerCol(step) {
  if (step._col == null) {
    const score = (c, i) => [c.length && c[c.length - 1].k === 'stamp' ? 1 : 0, c.filter(x => !x.up).length, c.length, -i];
    step._col = S.cols.map((c, i) => [score(c, i), i]).sort((a, b) => { for (let k = 0; k < 4; k++) if (a[0][k] !== b[0][k]) return b[0][k] - a[0][k]; return 0; })[0][1];
  }
  return step._col;
}
function startPick(kind) {
  if (pickMode === kind) { cancelPick(); return; }
  if (kind === 'stamper') {
    const cols = S.cols.map((_, i) => i).filter(hasHidden);
    if (!cols.length) { toast(t('no_hidden')); sfx('deny'); return; }
    if (save[kind] <= 0 && save.coins < COSTS[kind]) { toast(t('coins_short')); sfx('deny'); return; }
    pickMode = kind;
    sfx('joker');
    cols.forEach(i => { const c = S.cols[i][S.cols[i].length - 1]; if (c) views.get(c.id).el.classList.add('hintglow'); });
    if (!scriptStep()) tut(t('pick_stamper'));
    renderBoosters();
    return;
  }
  const piles = S.found.map((_, k) => k).filter(pullable);
  if (!piles.length) { toast(t('open_pile_first')); sfx('deny'); return; }
  if (save[kind] <= 0 && save.coins < COSTS[kind]) { toast(t('coins_short')); sfx('deny'); return; }
  if (kind === 'pack' && piles.length === 1) { applyPull(piles[0], kind); return; }
  pickMode = kind;
  sfx('joker');
  piles.forEach(k => slotEl(k).classList.add('target'));
  if (!scriptStep() && play.magnetRescued) { const q = slotPos(piles[0]); handTap(q.x + CW / 2, q.y + CH * 0.35); }
  if (!scriptStep()) tut(t(kind === 'pack' ? 'pick_pack' : 'pick_stamper'));
  renderBoosters();
}
function cancelPick(force = false) {
  if (scriptStep() && scriptStep().booster && !force) return;
  if (pickMode === 'stamper') for (const v of views.values()) v.el.classList.remove('hintglow');
  pickMode = null;
  slotEls.concat([extraEl]).forEach(e => e && e.classList.remove('target'));
  tut(null);
  renderBoosters();
  if (!force) recheckStuck();
}
// Huỷ booster/đóng panel mà vẫn kẹt: hiện lại panel kẹt (review FTUE #10: kẹt im lặng)
function recheckStuck() {
  setTimeout(() => {
    if (!S || ended || panelOpen || jokerMode || pickMode || safetyOf(L) !== 'none') return;
    if (isStuck()) stuckPanel();
  }, 450);
}
// Chạm một chồng: tem cùng loại đang lộ sáng lên + còn thiếu bao nhiêu (giúp nhận ra "loại" của tem).
function peekPile(k) {
  const f = S.found[k];
  clearHint();
  let shown = 0;
  for (const col of S.cols) { const top = col[col.length - 1]; for (const c of col) if (c.up && c.t === f.t && c.k === 'stamp') { views.get(c.id).el.classList.add('hintglow'); shown++; } void top; }
  const w = S.waste[S.waste.length - 1];
  if (w && w.t === f.t) { views.get(w.id).el.classList.add('hintglow'); shown++; }
  slotEl(k).classList.add('target');
  toast(t('peek', { topic: topicName(f.t), n: f.n - f.cards.length }), 1500);
  sfx('click', { vol: 0.5 });
  hintTimer = setTimeout(clearHint, 1600);
}
function slotAt(p) {
  for (let k = 0; k < S.found.length; k++) {
    const q = slotPos(k);
    if (p.x >= q.x - 20 && p.x <= q.x + CW + 20 && p.y >= q.y - 50 && p.y <= q.y + CH + 20) return k;
  }
  return -1;
}
function applyReveal(i) {
  cancelPick(true);
  if (!spend('stamper')) return;
  const res = E.revealColumn(S, i);
  if (!res.ok) return;
  undoStack = [];
  clearHint();
  const col = S.cols[i];
  const ys = colOffsets(col);
  stampSlam(colX(i) + CW / 2, ys[0] + CH / 2);
  haptic('milestone');
  track('stamper_reveal', { level: levelIdx + 1, col: i, cards: res.events.length });
  playEvents(res.events, false);
  relayout({ dur: 260 });
  renderBoosters();
  if (script && scriptStep() && scriptStep().booster === 'stamper') {   // kịch bản dạy Stamper: sang bước tiếp
    $('boosters').querySelectorAll('.booster').forEach(b => b.classList.remove('active'));
    script.i++;
    setTimeout(runScript, 700);
  }
}
function applyPull(k, kind) {
  cancelPick(true);
  if (!pullable(k)) { toast(t('none_left')); sfx('deny'); return; }
  if (!spend(kind)) return;
  const res = E.pullToFoundation(S, k, kind === 'pack' ? 2 : 1);
  if (!res.ok) return;
  undoStack = [];
  clearHint();
  const p = slotPos(k);
  if (kind === 'stamper') stampSlam(p.x + CW / 2, p.y + CH / 2);
  else { sfx('magnet'); ring(p.x + CW / 2, p.y + CH / 2, { color: '#3d6fa8', r1: 260, width: 12 }); }
  haptic('milestone');
  playEvents(res.events, false);
}
function stampSlam(x, y) {
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;left:0;top:0;width:200px;height:203px;background:url(assets/ui/ic_stamper.png) center/contain no-repeat;z-index:3800;pointer-events:none';
  board.append(el);
  const o = { y: y - 420, s: 1.2, a: 0 };
  const draw = () => { el.style.transform = `translate(${x - 100}px,${o.y - 150}px) scale(${o.s})`; el.style.opacity = o.a; };
  draw();
  tween(o, { y, a: 1, s: 1 }, { dur: 260, easing: ease.inCubic, onUpdate: draw }).then(() => {
    sfx('complete', { vol: 0.8, rate: 1.1225 });   // giữ đúng thang C ngũ cung (sfx-review.md)
    shake(3);
    sparkle(x, y, 14, { colors: ['#ff7a59', '#fff', '#ffd84a'] });
    return wait(120);
  }).then(() => tween(o, { y: y - 300, a: 0 }, { dur: 300, easing: ease.outCubic, onUpdate: draw })).then(() => el.remove());
}

// ---- hộc phụ
function onExtraSlot(e) {
  e && e.stopPropagation();
  if (ended || S.extraSlot) return;
  unlockAudio();
  if (scriptStep()) { toast(t('follow'), 1000); return; }
  if (levelIdx + 1 < UNLOCK_AT.slot) { toast(t('unlocks', { n: UNLOCK_AT.slot })); sfx('deny'); return; }
  track('ad_offer', { level: levelIdx + 1, placement: 'extra_slot' });
  panel({
    title: t('extra_title'),
    body: `<div class="feature-icon" style="background-image:url(assets/ui/slot_tray.png);width:230px;height:224px"></div><p>${t('extra_body')}</p>`,
    buttons: [
      { label: t('free_ad'), cls: 'orange', act: () => fakeAd(unlockExtra, 'extra_slot') },
      { label: t('coins', { n: COSTS.slot }), act: () => {
        if (save.coins < COSTS.slot) { toast(t('coins_short')); setTimeout(() => onExtraSlot(), 300); return; }
        save.coins -= COSTS.slot; persist(); bumpCoins(); unlockExtra();
      } },
      { label: t('close'), cls: 'brown', act: () => recheckStuck() },
    ],
  });
}
function unlockExtra() {
  E.addExtraSlot(S);
  extraKept = runKey();
  undoStack = [];
  sfx('slot');
  haptic('milestone');
  ring(EXTRA_X + CW / 2, ROW_A + CH / 2, { color: '#d9a441', r1: 200 });
  sparkle(EXTRA_X + CW / 2, ROW_A + CH / 2, 22, { colors: ['#8cff7a', '#fff', '#ffe36b'] });
  updateDeckUI();
  updateSlotLabels();
  saveRun();
}

// ============================================================ hand / tutorial / toast
const handEl = $('hand');
let handAnim = null;
function hideHand() { handAnim = null; handEl.style.opacity = 0; }
function handDrag(x0, y0, x1, y1) {
  const token = {};
  handAnim = token;
  const h = { x: x0, y: y0, o: 0, s: 1 };
  const draw = () => { if (handAnim !== token) return; handEl.style.opacity = h.o; handEl.style.transform = `translate(${h.x - 30}px,${h.y - 10}px) scale(${h.s})`; };
  const cycle = async () => {
    while (handAnim === token) {
      h.x = x0; h.y = y0; h.o = 0; h.s = 1.1; draw();
      await tween(h, { o: 1, s: 1 }, { dur: 220, onUpdate: draw });
      await wait(150);
      await tween(h, { x: x1, y: y1 }, { dur: 800, easing: ease.inOutCubic, onUpdate: draw });
      await wait(250);
      await tween(h, { o: 0 }, { dur: 220, onUpdate: draw });
      await wait(250);
    }
  };
  cycle();
}
function handTap(x, y, { side = false } = {}) {
  const token = {};
  handAnim = token;
  const h = { x, y, o: 1, s: 1 };
  // side: bàn tay xoay ngang, ngón trỏ chỉ sang trái, thân tay nằm bên phải và hơi cao hơn điểm chạm
  // -> không che nhãn tên dưới nút/lá và không với tới ô chữ gợi ý (QA #15). Đầu ngón trong .hand ở (21,8),
  // transform-origin (30,17) => sau khi xoay -90° đầu ngón ở (21,26).
  const draw = () => { if (handAnim !== token) return; handEl.style.opacity = h.o;
    handEl.style.transform = side ? `translate(${h.x - 21}px,${h.y - 26}px) rotate(-90deg) scale(${h.s})` : `translate(${h.x - 30}px,${h.y - 10}px) scale(${h.s})`; };
  const cycle = async () => {
    while (handAnim === token) {
      await tween(h, { s: 0.82 }, { dur: 200, onUpdate: draw });
      await tween(h, { s: 1 }, { dur: 260, easing: ease.outBack, onUpdate: draw });
      await wait(450);
    }
  };
  cycle();
}
let toastTimer = null;
function toast(msg, ms = 1500) {
  ms = Math.max(2200, ms * 1.5);      // người lớn tuổi đọc chậm hơn: chữ hiện lâu hơn
  const t = $('toast');
  const host = panelOpen ? overlay : $('ui');      // có panel: đưa toast lên trên lớp mờ (review FTUE #23)
  if (t.parentElement !== host) host.append(t);
  t.innerHTML = msg;
  // toast neo đáy ngay trên hàng rút bài và mọc lên theo chiều cao chữ (cỡ chữ R13): cột dài chạm tới đáy toast thì lên trên khay
  const deepest = S && S.cols ? Math.max(0, ...S.cols.map(col => (col.length ? colOffsets(col)[col.length - 1] : TAB_Y) + CH)) : 0;
  t.classList.remove('high');
  t.classList.toggle('high', !!S && !panelOpen && $('home').classList.contains('off') && deepest > ROW_A - 16 - t.offsetHeight - 10);
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), ms);
}
// ms: tự ẩn sau bao lâu (0 = giữ tới khi có lệnh ẩn, vd. câu "Tem mới" giữ tới nước đi đầu tiên)
function tut(html, ms = 9000) {
  const t = $('tut');
  clearTimeout(tutTimer);
  if (!html) { t.classList.remove('on'); return; }
  const deepest = S ? Math.max(0, ...S.cols.map(col => (col.length ? colOffsets(col)[col.length - 1] : TAB_Y) + CH)) : 0;
  // cột dài che chỗ ô chữ: đưa lên toast, vẫn hiện >= TIP_MIN_MS (toast nhân 1.5 thời gian)
  if (!script && deepest > 1490 + DY_BOT) { t.classList.remove('on'); toast(html, Math.max(TIP_MIN_MS, Math.min(ms || 9000, 9000)) / 1.5); return; }
  t.innerHTML = html;
  t.classList.add('on');
  if (!script && ms > 0) tutTimer = setTimeout(() => t.classList.remove('on'), ms);   // gợi ý tự ẩn, không nằm mãi trên màn
}
// Nhịp đọc của người lớn tuổi (review #9): chữ gợi ý hiện ít nhất 6 giây, kể cả khi người chơi đi nước ngay.
const TIP_MIN_MS = 6000, TIP_MAX_MS = 12000;
let tutTimer = 0;

// ---- Tutorial ép bước (level 1 dựng lại từ video). Bước: { text, src: cardId, dst: {found:k}|{onto:cardId}, draw, info }
function scriptStep() { return script ? script.steps[script.i] || null : null; }
function colOfCard(id) { return S.cols.findIndex(col => col.some(c => c.id === id)); }
function scriptAction(step) {
  if (!step || step.info || step.booster) return null;
  if (step.draw) return { draw: true };
  const src = locate(step.src);
  if (!src) return null;
  if (step.dst.found != null) {
    const card = E.sourceCards(S, src)[0];
    let i = S.found.findIndex(f => f && f.t === card.t);                          // chồng đúng loại đã mở
    if (i < 0) i = !S.found[step.dst.found] ? step.dst.found : S.found.findIndex(f => !f);   // hoặc ô trống
    return { src, dst: { to: 'found', i } };
  }
  return { src, dst: { to: 'col', j: colOfCard(step.dst.onto) } };
}
function runScript() {
  const step = scriptStep();
  if (!step) {
    save.seen['script_' + L.id] = 1;
    persist();
    if (L.id === 1) { track('tutorial_complete', { level: 1 }); track('af_tutorial_completion', { af_success: true, af_content_id: 'level1' }); }
    const wasJoker = script.steps.some(x => x.booster === 'joker');
    script = null;
    clearInterval(scriptNagTimer);
    tut(null);
    clearHint();
    renderBoosters();
    // vừa đặt Tem Vàng theo kịch bản: dạy nốt cách dùng nó (review FTUE #7, QA #7)
    if (wasJoker) tut(t('joker_after'), TIP_MIN_MS + 2000);
    tutorialCheck();
    resetIdleHint();
    return;
  }
  const html = t(step.booster ? 'script_' + step.booster : `script_${L.id}_${script.i}`) || step.text;
  if (step.info) {
    // bước chỉ có chữ: kết thúc kịch bản ngay (không chặn thao tác bằng "Làm theo bàn tay" khi không có bàn tay)
    script.i = script.steps.length;
    runScript();
    tut(html, 0);
    const shown = $('tut').innerHTML;
    setTimeout(() => { if (!script && $('tut').innerHTML === shown) tut(null); }, Math.max(TIP_MIN_MS, step.ms || 0));
    return;
  }
  tut(html);
  scriptNag();
  if (step.booster) { showBoosterStep(step); return; }
  showAction(scriptAction(step));
}
function boosterCenter(id) {
  // vị trí thật trên stage (thanh booster neo theo đáy màn hình, dàn đều)
  const b = $('boosters').querySelector(`[data-id=${id}]`);
  return { x: b.parentElement.offsetLeft + b.offsetLeft + b.offsetWidth / 2, y: b.parentElement.offsetTop + b.offsetTop + b.offsetHeight * 0.5, r: b.parentElement.offsetLeft + b.offsetLeft + b.offsetWidth * 0.86 };   // r: mép phải đồng xu (bàn tay chỉ ngang)
}
function showBoosterStep(step) {
  clearHint();
  const inMode = (step.booster === 'joker' && jokerMode) || pickMode === step.booster;
  $('boosters').querySelectorAll('.booster').forEach(b => b.classList.toggle('active', b.dataset.id === step.booster && !inMode));
  if (!inMode) { const c = boosterCenter(step.booster); handTap(c.r, c.y, { side: true }); return; }
  const glowCol = ci => {
    const col = S.cols[ci]; const ys = colOffsets(col);
    if (col.length) views.get(col[col.length - 1].id).el.classList.add('hintglow');
    colZones[ci].classList.add('target');
    handTap(colX(ci) + CW * 0.88, (col.length ? ys[ys.length - 1] : TAB_Y) + CH * 0.4, { side: true });
  };
  if (step.booster === 'stamper') glowCol(stamperCol(step));
  else if (step.slot != null) { const p = slotPos(step.slot); slotEl(step.slot).classList.add('target'); handTap(p.x + CW / 2, p.y + CH * 0.35); }
  else glowCol(jokerCol(step));
}
function scriptAllows(src, dst) {
  const a = scriptAction(scriptStep());
  if (!a || a.draw) return false;
  const same = (x, y) => x.from === y.from && (x.from === 'waste' || (x.i === y.i && x.idx === y.idx));
  if (!same(src, a.src) || dst.to !== a.dst.to) return false;
  if (dst.to === 'found') return !E.checkMove(S, src, dst);      // ô trống bất kỳ / ô đúng loại đều được
  return dst.j === a.dst.j;
}
function scriptReject(vs) {
  if (vs) nudge(vs);
  sfx('deny');
  const st = scriptStep();
  // nói rõ bước này cần gì (review FTUE #2: "Not yet!" chung chung mâu thuẫn với điều vừa học)
  const msg = st && st.booster ? t('script_tap_booster', { name: t('b_' + st.booster) })
    : st && st.draw ? t('script_reject_draw')
    : st && st.dst && st.dst.onto != null ? t('script_reject_stack')
    : st && st.dst && st.dst.found != null ? t('script_reject_slot') : t('follow');
  toast(msg, 1600);
  const T = computeLayout();
  for (const v of views.values()) if (T.get(v.id) && !v.gone) moveView(v, T.get(v.id), { dur: 220, easing: ease.outBackSoft }).then(() => setZ(v, T.get(v.id).z));
  showScriptHint();
}
// Vẽ lại chỉ dẫn của bước kịch bản hiện tại (bàn tay + vệt sáng)
function showScriptHint() {
  const st = scriptStep();
  if (!st || st.info) return;
  if (st.booster) showBoosterStep(st); else showAction(scriptAction(st));
}
// Kịch bản: bàn tay mất (bị huỷ bởi thao tác nào đó) thì vài giây sau tự hiện lại, không bao giờ để người chơi không có chỉ dẫn
let scriptNagTimer = 0;
function scriptNag() {
  clearInterval(scriptNagTimer);
  scriptNagTimer = setInterval(() => {
    if (!script) { clearInterval(scriptNagTimer); return; }
    if (!handAnim && !drag && !panelOpen && !busyInput && !ended) showScriptHint();
  }, 4000);
}

// Tutorial theo ngữ cảnh: mỗi bước hiện khi điều kiện đúng lần đầu, ẩn khi người chơi làm đúng loại nước đó.
const TUTS = [
  { id: 'moves', lv: [2], info: true, text: () => t('tip_moves'), when: () => S.used === 0 },
  { id: 'open', lv: [], text: () => t('script_1_0'),
    when: () => !S.found.some(Boolean) && findAction(a => a.dst && a.dst.to === 'found' && !S.found[a.dst.i]),
    done: ev => ev.some(e => e.type === 'open') },
  { id: 'crown', lv: [2, 3, 4], text: () => t('tip_crown'),
    when: () => S.found.some(f => !f) && findAction(a => a.dst && a.dst.to === 'found' && !S.found[a.dst.i]),
    done: ev => ev.some(e => e.type === 'open') },
  // dạy "chạm để tự đi" (review #8): bàn tay CHẠM (không kéo) lên một lá chạm vào là đi tới chỗ có ích
  { id: 'tap', lv: [2, 3, 4], tapHand: true, text: () => t('tip_tap'),
    when: () => S.used >= 1 && tapTeachAction(),
    done: ev => !lastMoveDrag && ev.some(e => e.type === 'move') },
  { id: 'draw', lv: [2, 3], text: () => t('tip_draw'),
    when: () => S.deck.length && !findAction(a => a.dst && a.dst.to === 'found'),
    action: () => ({ draw: true }), done: ev => ev.some(e => e.type === 'draw') },
  { id: 'stack', lv: [3, 4], text: () => t('tip_stack'),
    when: () => findAction(a => a.dst && a.dst.to === 'col' && S.cols[a.dst.j].length && a.src.from === 'col'),
    done: ev => ev.some(e => e.type === 'move' && e.dst.to === 'col') },
  { id: 'peek', lv: [3, 4], info: true, text: () => t('tip_peek'), when: () => S.found.some(Boolean) && S.used > 3 },
  { id: 'empty', lv: [3, 4, 5], text: () => t('tip_empty'),
    when: () => findAction(a => a.dst && a.dst.to === 'col' && !S.cols[a.dst.j].length && a.src.from === 'col' && a.src.idx > 0 && !S.cols[a.src.i][a.src.idx - 1].up),
    done: ev => ev.some(e => e.type === 'move' && e.dst.to === 'col') },
  { id: 'full', lv: [3, 4, 5, 6, 7, 8, 9, 10], info: true, text: () => t('tip_full'),
    when: () => S.found.every(Boolean) && [...S.cols.map(c => c[c.length - 1]), S.waste[S.waste.length - 1]].some(c => c && c.k === 'topic') },
];
// ---- "chạm để tự đi" (review #8): tip ở L2-L4 hoặc ngay sau lần kéo hụt đầu tiên (mọi level)
let lastMoveDrag = false;      // nước đi gần nhất là kéo (true) hay chạm (false)
/** Một nước chạm vào là đi tới chỗ CÓ ÍCH: vào ô đúng loại, lên tem cùng loại, hoặc tem vương miện mở ô (khi không rủi ro). */
function tapTeachAction() {
  const useful = a => a.dst && a.src && (a.dst.to === 'found'
    ? (!!S.found[a.dst.i] || !lastSlotRisky())
    : S.cols[a.dst.j].length > 0 && S.cols[a.dst.j][S.cols[a.dst.j].length - 1].k !== E.JOKER);
  const a = findAction(useful);
  if (!a) return null;
  // lá chạm vào phải tự đi đúng nước này (chạm chọn đích theo bestTapFor)
  const pick = bestTapFor([a.src]);
  return pick ? { src: pick.src, dst: pick.dst } : null;
}
function showTapHand(a) {
  clearHint();
  if (!a) return false;
  const run = E.sourceCards(S, a.src);
  if (!run) return false;
  run.forEach(c => { const v = views.get(c.id); if (v) v.el.classList.add('hintglow'); });
  const top = views.get(run[run.length - 1].id);
  if (!top) return false;
  handTap(top.x + CW / 2, top.y + CH * 0.45);
  return true;
}
function teachTapSoon() {
  if (save.seen.tap || script) return;
  setTimeout(() => {
    if (save.seen.tap || script || tutorial || introHold || ended || panelOpen || drag || jokerMode || pickMode || !S) return;
    save.seen.tap = 1;
    persist();
    track('tip_shown', { level: levelIdx + 1, key: 'tap', via: 'drop_miss' });
    const a = tapTeachAction();
    if (a) {
      tutorial = { id: 'tap', t0: Date.now() };
      tut(t('tip_tap'), TIP_MAX_MS);
      showTapHand(a);
      tutorialNag();
    } else tut(t('tip_tap'), TIP_MAX_MS);
  }, 1600);
}
function findAction(pred) {
  const acts = E.legalMoves(S);
  // ưu tiên chồng dài nhất (giống solver)
  return acts.find(a => pred(a) && (a.src.from === 'waste' || a.src.idx === E.maxRunStart(S, a.src.i))) || null;
}
function tutorialCheck(events = []) {
  if (!tutorial && (panelOpen || (deferredIntro && S.used >= 6))) return;   // đừng bật gợi ý mới đè lên popup (QA v2 N1: L2 "Tem vương miện" + popup Gợi ý)
  if (tutorial) {
    const step = TUTS.find(t => t.id === tutorial.id);
    if (step.info) {
      // tip chỉ có chữ: ẩn sau nước đi đầu tiên, nhưng không sớm hơn TIP_MIN_MS kể từ lúc hiện
      if (events.length && !tutorial.moved) {
        const tok = tutorial;
        tok.moved = true;
        setTimeout(() => { if (tutorial === tok) { tutorial = null; tut(null); } }, Math.max(0, TIP_MIN_MS - (Date.now() - tok.t0)));
      }
      return;
    }
    if (step.done && step.done(events)) {
      tutorial = null; tut(null); clearHint();
    } else {
      // làm lại mũi tên theo state mới
      const ok = step.when();
      const a = ok ? (step.action ? step.action() : ok) : null;
      if (a) (step.tapHand ? showTapHand(a) : showAction(a)); else { tutorial = null; tut(null); clearHint(); }
      return;
    }
  }
  for (const step of TUTS) {
    if (!step.lv.includes(levelIdx + 1) || save.seen[step.id]) continue;
    if (!canTip()) return;
    const a = step.when();
    if (!a) continue;
    markTip();
    save.seen[step.id] = 1;
    persist();
    const tok = { id: step.id, t0: Date.now() };
    tutorial = tok;
    track('tip_shown', { level: levelIdx + 1, key: step.id });
    tut(typeof step.text === 'function' ? step.text() : step.text, step.info ? TIP_MAX_MS : 9000);
    if (step.tapHand) { showTapHand(a); tutorialNag(); }
    else if (!step.info) { showAction(step.action ? step.action() : a); tutorialNag(); }
    else setTimeout(() => { if (tutorial === tok) { tutorial = null; tut(null); } }, TIP_MAX_MS);
    return;
  }
}
// Gợi ý ngữ cảnh đang hiện mà bàn tay bị huỷ (thả hụt, bấm Gợi ý...) thì vài giây sau vẽ lại; hết 12 giây thì tự kết thúc
let tutNagTimer = 0;
function tutorialNag() {
  clearInterval(tutNagTimer);
  const started = Date.now(), id = tutorial && tutorial.id;
  tutNagTimer = setInterval(() => {
    if (!tutorial || tutorial.id !== id || ended) { clearInterval(tutNagTimer); return; }
    if (Date.now() - started > 12000) { clearInterval(tutNagTimer); tutorial = null; tut(null); if (!hintActive) clearHint(); return; }
    if (!handAnim && !drag && !panelOpen && !busyInput && !hintActive && !jokerMode && !pickMode) tutorialCheck([]);
  }, 3500);
}
function resetIdleHint(n = 0) {
  clearTimeout(idleTimer);
  if ((levelIdx + 1 > 3 && !specialOf(L)) || ended || script) return;
  // level khó: giữ khoảnh khắc tự nghĩ ra và giá trị của Hint -> chỉ gợi ý miễn phí sau lần kẹt/Overtime đầu tiên, chờ lâu hơn
  if (specialOf(L) && !overtime && !play.rescues) return;
  // đứng im thì gợi ý miễn phí, lặp lại và giãn dần (7 -> 12 -> 20 giây; level khó 20 -> 30 giây)
  const delays = specialOf(L) ? [20000, 30000] : [7000, 12000, 20000];
  idleTimer = setTimeout(() => {
    if (ended || panelOpen || drag) { resetIdleHint(n); return; }
    if (!(tutorial || jokerMode || pickMode || hintActive)) {
      showAction(computeHint());
      hintTimer = setTimeout(clearHint, 5000);
    }
    resetIdleHint(n + 1);
  }, delays[Math.min(n, delays.length - 1)]);
}

// ============================================================ panels
let panelOpen = null;
// kind: class thêm cho .panel ('win' trượt lên, 'tall' đặt cao hơn). instant: hiện ngay, không hiệu ứng/không tiếng
// (dựng lại bảng Cài đặt, chạm để tua màn thắng). Nút có class 'wait' chưa bấm được; nút đã bị "tước" (_armed = false,
// vd. ngón tay vừa chạm để tua) chỉ nhận pointerup sau một pointerdown mới -> một chạm tua không thành bấm nút.
function panel({ title, body = '', buttons = [], radial = false, onOpen, kind = '', instant = false }) {
  closePanel(true);
  const scrim = document.createElement('div');
  scrim.className = 'scrim' + (instant ? ' instant' : '');
  const p = document.createElement('div');
  p.className = 'panel' + (kind ? ' ' + kind : '') + (instant ? ' instant' : '');
  p.innerHTML = `<div class="head">${title}</div><div class="pin">${body}<div class="btns"></div></div>`;
  const btns = p.querySelector('.btns');
  for (const b of buttons) {
    const el = document.createElement('div');
    el.className = 'btn ' + (b.cls || '');
    el.innerHTML = b.label;
    el.addEventListener('pointerdown', () => { if (!el.classList.contains('wait')) el._armed = true; });
    el.addEventListener('pointerup', ev => {
      ev.stopPropagation();
      if (el.classList.contains('wait') || el._armed === false) return;
      unlockAudio();
      sfx('click', { vol: 0.7 });
      closePanel();
      b.act && b.act();
    });
    btns.append(el);
  }
  overlay.style.pointerEvents = 'auto';
  overlay.style.zIndex = $('home').classList.contains('off') ? '' : '48';   // panel mở từ màn hình chính (Trang trí) phải nằm trên .home
  handEl.style.visibility = 'hidden';
  $('tut').classList.add('hold');          // UI/UX P2-1: chữ dạy không thò ra sau bảng
  if (radial) { const r = document.createElement('div'); r.className = 'radial'; scrim.append(r); }
  overlay.append(scrim, p);
  if (instant) { scrim.classList.add('on'); p.classList.add('on'); }
  else requestAnimationFrame(() => { scrim.classList.add('on'); p.classList.add('on'); });
  panelOpen = { scrim, p };
  fitPanel(p);
  requestAnimationFrame(() => fitPanel(p));
  if (!radial && !instant) sfx('popup', { vol: 0.8 });
  onOpen && onOpen(p);
  return p;
}
/** Chữ to làm thân panel dài quá màn hình: bật cuộn trong thân (lưới an toàn, R13). */
function fitPanel(p) {
  const pin = p && p.querySelector('.pin');
  if (!pin || !p.isConnected) return;
  pin.classList.remove('scroll');
  pin.classList.toggle('scroll', pin.scrollHeight > pin.clientHeight + 1);
}
function closePanel(instant = false) {
  if (!panelOpen) return;
  const { scrim, p } = panelOpen;
  panelOpen = null;
  if (instant) { scrim.remove(); p.remove(); }
  else {
    scrim.classList.remove('on'); p.classList.remove('on');
    setTimeout(() => { scrim.remove(); p.remove(); }, 250);
  }
  overlay.style.pointerEvents = 'none';
  handEl.style.visibility = '';
  $('tut').classList.remove('hold');
}

// ============================================================ input
let drag = null;
board.addEventListener('pointerdown', onDown);
addEventListener('pointermove', onMove, { passive: false });
addEventListener('pointerup', onUp);
addEventListener('pointercancel', onUp);

function locate(id) {
  if (S.waste.length && S.waste[S.waste.length - 1].id === id) return { from: 'waste' };
  for (let i = 0; i < S.cols.length; i++) {
    const j = S.cols[i].findIndex(c => c.id === id);
    if (j >= 0) return { from: 'col', i, idx: j };
  }
  return null;
}
function colAt(p) {
  for (let i = 0; i < S.cols.length; i++) {
    const x = colX(i);
    if (p.x >= x - 20 && p.x <= x + CW + 20 && p.y >= TAB_Y - 60 && p.y < ROW_A - 10) return i;   // không lấn hàng rút bài
  }
  return -1;
}
// Chạm trượt (review game design v2 #1): đo bằng pt trên màn hình (px CSS), không theo stage, vì run tay là khoảng cách thật.
// Ngón tay đi chưa quá DRAG_START_PT: vẫn là chạm. Đã nhấc lá nhưng thả trong TAP_SLOP_PT quanh điểm bấm và chỗ thả
// không có đích hợp lệ: coi như chạm (lá tự đi), không coi là kéo hụt. 12pt trượt vẫn phải tính là chạm.
const DRAG_START_PT = 8, TAP_SLOP_PT = 14;
let lastActAt = 0;          // thời điểm thao tác gần nhất (nước đi, rút bài, hoàn tác)
const tooSoon = () => performance.now() - lastActAt < 250;   // chạm đúp do run tay: bỏ cú thứ hai (QA v2 N7)
function onDown(e) {
  unlockAudio();
  if (ended || busyInput || panelOpen || drag) return;
  const p = toStage(e);
  if (!pickMode && !jokerMode && !script) {
    const k0 = slotAt(p);
    if (k0 >= 0 && S.found[k0] && !e.target.closest('.card[data-x]')) { peekPile(k0); }
  }
  if (pickMode === 'stamper') {                  // Stamper: chọn một CỘT có lá úp
    const i = colAt(p);
    const st = scriptStep();
    if (st && st.booster === 'stamper' && i !== stamperCol(st)) { toast(t('tap_column')); sfx('deny'); return; }
    if (i >= 0 && hasHidden(i)) applyReveal(i);
    else if (i >= 0) { toast(t('no_hidden_col')); sfx('deny'); }
    else cancelPick();
    return;
  }
  if (pickMode) {
    const k = slotAt(p);
    const st = scriptStep();
    if (st && st.booster && k !== st.slot) { toast(t('tap_pile')); sfx('deny'); return; }
    if (k >= 0 && S.found[k] && pullable(k)) applyPull(k, pickMode); else cancelPick();
    return;
  }
  if (jokerMode) {
    const i = colAt(p);
    const st = scriptStep();
    if (st && st.booster && i !== jokerCol(st)) { toast(t('tap_column')); sfx('deny'); return; }
    if (i >= 0) placeJokerAt(i);
    else if (jokerFree) { toast(t('tap_column')); sfx('deny'); }       // Tem Vàng cứu trợ: phải đặt, không huỷ được
    else toggleJoker();
    return;
  }
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;
  const v = cardEl._view;
  const loc = locate(v.id);
  if (!loc && S.waste.some(c => c.id === v.id)) { nudge([v]); sfx('deny'); toast(t('err_waste_top'), 1500); return; }
  if (!loc || (loc.from === 'col' && !E.runAt(S, loc.i, loc.idx))) {
    // lá úp, hoặc lá bị tem khác loại đè lên: rung nhẹ và nói lý do
    if (loc && loc.from === 'col') {
      const col = S.cols[loc.i];
      nudge(col.slice(loc.idx).map(c => views.get(c.id)));
      if (!col[loc.idx].up) { sfx('facedown'); toast(t('err_facedown'), 1400); teachOnError('facedown'); }
      else { sfx('deny'); toast(t('err_mixed'), 1700); teachOnError('mixed'); }
    }
    return;
  }
  clearHint();
  // Các cách hiểu cú cầm, ưu tiên xấp lớn nhất: cầm lá nào trong xấp cùng loại cũng nhấc cả xấp.
  // Khi thả/chạm, nếu cả xấp không hợp lệ (vd. đáy là tem vương miện mà thả lên tem) thì thử xấp nhỏ hơn, tới lá đang cầm.
  const cands = [];
  if (loc.from === 'col') {
    const col = S.cols[loc.i];
    let start = E.maxRunStart(S, loc.i);
    if (col[start] && col[start].k === E.JOKER && col[loc.idx].k !== E.JOKER) start++;
    for (let s0 = Math.min(start, loc.idx); s0 <= loc.idx; s0++) if (E.runAt(S, loc.i, s0)) cands.push({ from: 'col', i: loc.i, idx: s0 });
  } else cands.push(loc);
  const src0 = cands[0];
  const run = E.sourceCards(S, src0);
  const vs = run.map(c => views.get(c.id));
  const grabK = Math.max(0, run.findIndex(c => c.id === v.id));
  drag = { src: src0, cands, vs, grabK, start: p, last: p, t0: performance.now(), moved: false, offs: vs.map(w => ({ x: w.x - p.x, y: w.y - p.y })), vx: 0, pid: e.pointerId };
  try { board.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
}
function onMove(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  e.preventDefault();
  const p = toStage(e);
  const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
  if (!drag.moved && Math.hypot(dx, dy) * scale > DRAG_START_PT) {
    drag.moved = true;
    sfx('pick', { vol: 0.8 });
    haptic('tap');
    drag.vs.forEach((v, k) => {
      killTweens(v);
      killKey('pos-' + v.id);
      animOn(v);
      v.dragAnim = true;
      v.lifted = true;
      v.el.classList.add('lift');
      setZ(v, 5000 + k);
      tween(v, { s: 1.07 }, { dur: 120, key: 'lift-' + v.id, onUpdate: applyTransform });
    });
    if (scriptStep()) { const a = scriptAction(scriptStep()); if (a && !a.draw) highlightDst(a.dst); }
    else highlightTargets(drag.cands);
  }
  if (!drag.moved) return;
  const vx = p.x - drag.last.x;
  drag.vx = drag.vx * 0.7 + vx * 0.3;
  drag.last = p;
  const tilt = Math.max(-10, Math.min(10, drag.vx * 0.6));
  drag.vs.forEach((v, k) => {
    // lá đang cầm bám sát ngón tay, lá càng xa lá đang cầm càng trễ: cảm giác chồng mềm
    const lag = Math.min(0.5, Math.abs(k - drag.grabK) * 0.12);
    const tx = p.x + drag.offs[k].x, ty = p.y + drag.offs[k].y;
    v.x += (tx - v.x) * (1 - lag);
    v.y += (ty - v.y) * (1 - lag);
    v.r = tilt * (1 - Math.abs(k - drag.grabK) * 0.12);
    applyTransform(v);
  });
}
function onUp(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  const d = drag;
  drag = null;
  unhighlight();
  d.vs.forEach(v => { if (v.dragAnim) { v.dragAnim = false; animOff(v); } });
  if (!d.moved && tooSoon()) return;          // chạm đúp do run tay: bỏ cú chạm thứ hai (kéo thì vẫn nhận)
  if (!d.moved) { play.taps++; onTap(d); return; }
  const p = toStage(e);
  // Lượt 1: chỗ NGÓN TAY thả, thử mọi cách hiểu cú cầm (xấp lớn nhất trước). Lượt 2 (dự phòng): tâm lá đáy của xấp.
  let pick = null;
  for (const src of d.cands) { const dst = targetAt(src, p); if (dst) { pick = { src, dst }; break; } }
  if (!pick) for (const src of d.cands) {
    const v0 = views.get(E.sourceCards(S, src)[0].id);
    const dst = targetAt(src, { x: v0.x + CW / 2, y: v0.y + CH / 2 });
    if (dst) { pick = { src, dst }; break; }
  }
  d.vs.forEach(v => { v.lifted = false; v.el.classList.remove('lift'); killKey('lift-' + v.id); });
  const driftPt = Math.hypot(p.x - d.start.x, p.y - d.start.y) * scale;
  if (!pick && driftPt <= TAP_SLOP_PT) {
    // chạm trượt (run tay): lá đã nhấc lên nhưng ngón tay gần như đứng yên và không thả vào đích nào -> xử lý như chạm
    if (tooSoon()) { snapBack(d.vs); return; }
    play.taps++;
    const before = S.used;
    onTap(d, true);
    track('tap_drift', { level: levelIdx + 1, pt: Math.round(driftPt * 10) / 10, moved: S.used !== before });
    return;
  }
  play.drags++;
  if (pick) doMove(pick.src, pick.dst, true);
  else if (scriptStep()) scriptReject(null);           // thả hụt trong kịch bản: lá về chỗ, bàn tay hiện lại (review FTUE #1)
  else {
    const why = dropReason(d.cands[d.cands.length - 1], p);   // lý do theo lá đang cầm
    if (why) { toast(why, 1600); teachOnError('drop'); }
    sfx('deny');
    snapBack(d.vs);
    teachTapSoon();                                       // kéo hụt lần đầu: chỉ lối dễ hơn "chạm để tự đi" (review #8)
  }
}
function snapBack(vs) {
  const T = computeLayout();
  vs.forEach(v => { const t0 = T.get(v.id); if (t0) moveView(v, t0, { dur: 260, easing: ease.outBackSoft }).then(() => setZ(v, t0.z)); });
}
/** Chạm một lá/xấp: tự tìm đích. drift: chạm trượt (lá đã nhấc lên): lá đứng lệch, phải trả về chỗ nếu không đi. */
function onTap(d, drift = false) {
  if (scriptStep()) {
    const a = scriptAction(scriptStep());
    if (a && !a.draw && scriptAllows(d.src, a.dst)) doMove(d.src, a.dst, false);
    else { if (drift) snapBack(d.vs); scriptReject(d.vs); }
    return;
  }
  const pick = bestTapFor(d.cands);
  // chạm không tự mở ô trống CUỐI CÙNG (quyết định dễ gây kẹt): phải kéo vào nếu chắc chắn
  // QA N9: mẹo "chỉ cần chạm" không được mâu thuẫn với luật này -> chạm lần 2 vào cùng lá trong 5 giây là xác nhận, lá tự vào ô.
  const card0 = pick && pick.src.from === 'col' ? S.cols[pick.src.i][pick.src.idx] : pick && pick.src.from === 'waste' ? S.waste[S.waste.length - 1] : null;
  const armed = lastSlotArm && card0 && lastSlotArm.id === card0.id && performance.now() - lastSlotArm.t < 5000;
  if (pick && pick.dst.to === 'found' && !S.found[pick.dst.i] && lastSlotRisky() && !armed) {
    if (drift) snapBack(d.vs);
    lastSlotArm = card0 ? { id: card0.id, t: performance.now() } : null;
    nudge(d.vs); sfx('deny'); toast(t('err_last_slot'), 2600);
    track('last_slot_tap_blocked', { level: levelIdx + 1 });
  } else if (pick) { if (armed) track('last_slot_tap_confirm', { level: levelIdx + 1 }); lastSlotArm = null; doMove(pick.src, pick.dst, false); }
  else { if (drift) snapBack(d.vs); rejectTap(d.src, d.vs); }
}
let lastSlotArm = null;       // lá vừa bị chặn mở ô cuối bằng chạm: chạm lại lá đó để xác nhận
// Mở ô trống CUỐI bằng chạm chỉ bị chặn khi có rủi ro: level có giới hạn moves và còn nhiều chủ đề chưa mở hơn số ô trống
function lastSlotRisky() {
  const free = S.found.filter(f => !f).length;
  if (free !== 1 || L.moves == null) return false;
  const tp = topicProgress();
  return tp.total - tp.done - S.found.filter(Boolean).length > free;
}
/** Chạm: thử từ xấp lớn nhất. Ưu tiên đích "có ích" (vào ô, ghép lên tem cùng loại) hơn là dời sang cột trống. */
function bestTapFor(cands) {
  let fallback = null;
  for (const src of cands) {
    const dst = E.bestTargetFor(S, src);
    if (!dst) continue;
    const useful = dst.to === 'found' || (S.cols[dst.j].length && S.cols[dst.j][S.cols[dst.j].length - 1].k !== E.JOKER);
    if (useful) return { src, dst };
    if (!fallback) fallback = { src, dst };
  }
  return fallback;
}
function allTargets(src) {
  const out = [];
  S.found.forEach((_, k) => { if (!E.checkMove(S, src, { to: 'found', i: k })) out.push({ to: 'found', i: k }); });
  S.cols.forEach((_, j) => { if (!E.checkMove(S, src, { to: 'col', j })) out.push({ to: 'col', j }); });
  return out;
}
function targetRect(dst) {
  if (dst.to === 'found') { const p = slotPos(dst.i); return { x: p.x - 30, y: p.y - 50, w: CW + 60, h: CH + 90 }; }
  const col = S.cols[dst.j];
  const ys = colOffsets(col);
  const bottom = Math.min((col.length ? ys[ys.length - 1] : TAB_Y) + CH + 140, ROW_A - 10);   // không lấn hàng rút bài
  return { x: colX(dst.j) - 22, y: TAB_Y - 60, w: CW + 44, h: bottom - TAB_Y + 60 };
}
/** Đích hợp lệ có vùng chứa điểm q (gần tâm nhất), hoặc null. */
function targetAt(src, q) {
  let best = null, bd = Infinity;
  for (const dst of allTargets(src)) {
    const r = targetRect(dst);
    if (q.x < r.x || q.x > r.x + r.w || q.y < r.y || q.y > r.y + r.h) continue;
    const d = Math.hypot(r.x + r.w / 2 - q.x, r.y + Math.min(r.h, CH) / 2 - q.y);
    if (d < bd) { bd = d; best = dst; }
  }
  return best;
}
function dropReason(src, p) {
  const run = E.sourceCards(S, src);
  if (!run) return null;
  for (let k = 0; k < S.found.length; k++) {
    const r = targetRect({ to: 'found', i: k });
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
      const why = E.checkMove(S, src, { to: 'found', i: k });
      if (why === 'need_topic') return t('err_need_crown');
      if (why === 'wrong_topic') return t('err_wrong_pile', { topic: S.found[k] ? topicName(S.found[k].t) : '' });
    }
  }
  const i = colAt(p);
  if (i >= 0) {
    const why = E.checkMove(S, src, { to: 'col', j: i });
    if (why === 'wrong_topic') return t('err_wrong_stack');
    if (why === 'topic_on_card') return t('err_crown_on_stamp');
  }
  return null;
}
function rejectTap(src, vs) {
  const run = E.sourceCards(S, src);
  nudge(vs);
  sfx('deny');
  haptic('deny');           // thả/chạm sai: không rung (game không phạt người chơi)
  if (!run) return;
  let msg;
  if (run[0].k === 'topic') msg = S.found.every(Boolean) ? t('err_slots_busy') : t('err_no_place');
  else if (!S.found.some(f => f && f.t === run[0].t)) msg = t('err_no_pile');
  else msg = t('err_no_place');
  toast(msg, 1600);
  teachOnError(run[0].k === 'topic' ? 'crown_no_slot' : !S.found.some(f => f && f.t === run[0].t) ? 'no_pile' : 'no_place');
}
// Thang hỗ trợ khi lúng túng (research: 2 lần sai trong ~6 giây -> chỉ cách làm đúng). Level đầu và level khó.
let invalidTimes = [];
function teachOnError(reason = 'other') {
  track('invalid_move', { level: levelIdx + 1, attempt: play.attempt, reason });
  const now = Date.now();
  invalidTimes = invalidTimes.filter(x => now - x < 6000).concat(now);
  if (invalidTimes.length < 2 || script || ended) return;
  if (levelIdx + 1 > 5 && !specialOf(L)) return;
  invalidTimes = [];
  setTimeout(() => {
    if (ended || script || jokerMode || pickMode) return;
    const a = computeHint();
    if (a) { showAction(a); hintTimer = setTimeout(clearHint, 5000); }
  }, 700);
}
// Nhịp gợi ý: mỗi lần một khái niệm, cách nhau >= 4 nước và 7 giây, tối đa 3 gợi ý mỗi level (chống quá tải).
let tipGate = { used: -99, t: 0, count: 0 };
function canTip() {
  if (script || tutorial || introHold || !S) return false;
  return S.used - tipGate.used >= 4 && Date.now() - tipGate.t >= 7000 && tipGate.count < 3;
}
function markTip() { tipGate = { used: S.used, t: Date.now(), count: tipGate.count + 1 }; }
// Gợi ý một lần cho mỗi khái niệm, đúng lúc nó xảy ra (just-in-time).
function onceTip(key, vars = {}, ms = TIP_MIN_MS + 1000) {
  if (save.seen['tip_' + key] || !canTip()) return false;
  markTip();
  save.seen['tip_' + key] = 1;
  persist();
  track('tip_shown', { level: levelIdx + 1, key });
  tut(t('tip_' + key, vars), ms);
  const mine = $('tut').innerHTML;
  setTimeout(() => { if ($('tut').innerHTML === mine && !script && !tutorial) tut(null); }, ms);
  return true;
}
function nudge(vs) {
  vs.forEach(v => {
    const o = { k: 0 };
    tween(o, { k: 1 }, { dur: 320, key: 'nudge-' + v.id, onUpdate: () => { v.ox = Math.sin(o.k * Math.PI * 5) * 9 * (1 - o.k); applyTransform(v); } })
      .then(() => { v.ox = 0; applyTransform(v); });
  });
}
function highlightDst(dst) {
  if (dst.to === 'found') slotEl(dst.i).classList.add('target');
  else {
    const col = S.cols[dst.j];
    if (col.length) views.get(col[col.length - 1].id).el.classList.add('hintglow');
    else colZones[dst.j].classList.add('target');
  }
}
function highlightTargets(cands) {
  for (const dst of cands.flatMap(allTargets)) highlightDst(dst);
}
function unhighlight() {
  slotEls.concat([extraEl]).forEach(e => e && e.classList.remove('target'));
  colZones.forEach(z => z.classList.remove('target'));
  for (const v of views.values()) v.el.classList.remove('hintglow');
}

// ============================================================ actions
function doMove(src, dst, fromDrag) {
  if (scriptStep() && !autoFinishing && !scriptAllows(src, dst)) { scriptReject(); return; }
  const before = E.clone(S);
  const opening = dst.to === 'found' && !S.found[dst.i] ? S.found.filter(f => !f).length : 0;
  const res = E.applyMove(S, src, dst);
  if (res.ok && opening) track('slot_open', { level: levelIdx + 1, via: fromDrag ? 'drag' : (autoFinishing ? 'auto' : 'tap'), empty_before: opening, last: opening === 1 });
  if (!res.ok) {
    const T = computeLayout();
    for (const v of views.values()) if (T.get(v.id)) moveView(v, T.get(v.id), { dur: 200 });
    return;
  }
  undoStack.push({ s: before, combo });
  if (undoStack.length > 60) undoStack.shift();
  undoBlockedBySend = false;
  lastActAt = performance.now();
  lastMoveDrag = !!fromDrag;
  clearHint();
  resetIdleHint();
  playEvents(res.events, fromDrag);
}
function onDeck() {
  if (ended || busyInput || panelOpen) return;
  if (tooSoon()) return;
  if (jokerMode) { toast(t('tap_column')); sfx('deny'); return; }
  if (pickMode) {
    if (!(scriptStep() && scriptStep().booster)) cancelPick();
    else { toast(t(pickMode === 'stamper' ? 'tap_column' : 'tap_pile')); sfx('deny'); }
    return;
  }
  if (!S.deck.length && !S.waste.length) {
    if (isStuck() && safetyOf(L) === 'none') stuckPanel(); else { toast(t('deck_empty')); sfx('deny'); }
    return;
  }
  if (scriptStep() && !scriptStep().draw) { scriptReject(); return; }
  const before = E.clone(S);
  const res = E.draw(S);
  if (!res.ok) { if (res.why === 'no_moves') outOfMoves(); return; }
  undoStack.push({ s: before, combo });
  undoBlockedBySend = false;
  lastActAt = performance.now();
  clearHint();
  resetIdleHint();
  playEvents(res.events, false);
}

function playEvents(events, fromDrag) {
  const T = computeLayout();
  const special = new Set();
  let delivered = false;
  const pullEv = events.find(e => e.type === 'pull');
  const late = pullEv ? 380 + pullEv.cards.length * 140 : 0;   // chờ lá bay tới ô rồi mới đếm
  for (const ev of events) {
    if (ev.type === 'pull') {
      const sp = slotPos(ev.slot);
      ev.cards.forEach((id, k) => {
        const v = views.get(id);
        if (!v) return;
        special.add(id);
        const t = T.get(id) || { x: sp.x, y: sp.y - 10, z: 3000 };
        setTimeout(() => {
          setZ(v, 3200 + k);
          setUp(v, true, { delay: 120 });
          sfx('whoosh', { vol: 0.5, rate: 1.2 + k * 0.1 });
          moveView(v, t, { dur: 420, easing: ease.inOutCubic, arc: 160, lift: true }).then(() => {
            setZ(v, T.get(id) ? T.get(id).z : v.z);
            landSquash(v);
            sparkle(sp.x + CW / 2, sp.y + 30, 8);
          });
        }, k * 140);
      });
      continue;
    }
    if (ev.type === 'move') {
      const toFound = ev.dst.to === 'found';
      ev.cards.forEach((id, k) => {
        const v = views.get(id);
        special.add(id);
        const sp = toFound ? slotPos(ev.dst.i) : null;
        const t = T.get(id) || { x: sp.x, y: sp.y - 10, z: 3000 + k };
        setZ(v, 3000 + k);
        v.lifted = false;
        v.el.classList.remove('lift');
        const dur = fromDrag ? 170 : 230 + k * 25;
        const p = moveView(v, t, { dur, easing: fromDrag ? ease.outBackSoft : ease.outCubic, arc: fromDrag ? 0 : 50, lift: !fromDrag, delay: fromDrag ? 0 : k * 18 });
        p.then(() => {
          setZ(v, T.get(id) ? T.get(id).z : v.z);
          if (k === 0) landSquash(v);
        });
        setUp(v, true);
      });
      if (!toFound) {
        sfx('place', { vol: 0.55, rate: 0.95 + Math.random() * 0.1 });
        haptic('tap');
        combo = 0;
      }
      // dọn sạch một cột (cột trống là tài nguyên): phản hồi riêng, 3 lần đầu kèm chữ
      if (ev.src && ev.src.from === 'col' && S.cols[ev.src.i] && !S.cols[ev.src.i].length) {
        const zx = colX(ev.src.i) + CW / 2, zy = TAB_Y + CH / 2;
        setTimeout(() => {
          sparkle(zx, zy, 12, { colors: ['#8cc8ff', '#ffffff', '#ffd84a'] });
          sfx('sparkle', { vol: 0.4 });
          save.colFreeShown = (save.colFreeShown || 0) + 1;
          if (save.colFreeShown <= 3) floatText(t('col_free'), zx, zy, '#5a3a26');
        }, 200);
      }
    } else if (ev.type === 'open') {
      const el = slotEl(ev.slot);
      const p = slotPos(ev.slot);
      setTimeout(() => {
        el.classList.add('open');
        el.querySelector('.ribbon').textContent = topicName(ev.t);
        sfx('open');
        ring(p.x + CW / 2, p.y + CH / 2, { color: '#d9a441', r1: 150 });
        sparkle(p.x + CW / 2, p.y + CH / 2, 12, { colors: ['#ffd84a', '#fff4a0'] });
      }, fromDrag ? 120 : 200);
    } else if (ev.type === 'deliver') {
      delivered = true;
      combo += 1;
      const step = combo;
      const p = slotPos(ev.slot);
      const el = slotEl(ev.slot);
      setTimeout(() => {
        comboSfx(step);
        haptic('progress');
        const c = el.querySelector('.count');
        c.textContent = `${ev.count}/${ev.n}`;
        const o = { s: 1.5 };
        tween(o, { s: 1 }, { dur: 300, easing: ease.outBack, key: 'cnt' + ev.slot, onUpdate: () => { c.style.transform = `scale(${o.s})`; } });
        sparkle(p.x + CW / 2, p.y + 20, 6 + Math.min(12, step * 2));
        if (step >= 2) floatText(t('combo', { n: step }), p.x + CW / 2, p.y - 60, step >= 5 ? '#ff9d3b' : '#ffe36b');
        if (step === 3 && levelIdx + 1 >= 3) onceTip('combo');
        if (step > 0 && step % COMBO_MAX === 0) comboReward(p.x + CW / 2, p.y);
      }, late || (fromDrag ? 110 : 200));
    } else if (ev.type === 'complete') {
      if (levelIdx + 1 >= 2) setTimeout(() => onceTip('complete'), 1500);
      const pr = completeAnim(ev.slot, ev.cards, ev.t, late ? late + 150 : fromDrag ? 260 : 380);
      pending.push(pr);
      pr.then(() => { pending = pending.filter(x => x !== pr); });
      undoStack = [];     // phong bì đã gửi: không undo
      undoBlockedBySend = true;
    } else if (ev.type === 'flip') {
      const v = views.get(ev.id);
      setTimeout(() => sfx('flip', { vol: 0.7 }), 120);
      // lật ra TEM VƯƠNG MIỆN = sự kiện thông tin quan trọng nhất (mở được ô mới): loé + âm riêng + rung nhẹ
      const c = v && v.card;
      if (c && c.k === 'topic') setTimeout(() => {
        const tt = T.get(ev.id) || { x: v.x, y: v.y };
        ring(tt.x + CW / 2, tt.y + CH / 2, { color: '#d9a441', r1: 170, width: 10 });
        sparkle(tt.x + CW / 2, tt.y + 30, 14, { colors: ['#ffd84a', '#fff4a0', '#ffffff'] });
        sfx('open', { vol: 0.6, rate: 1.2599 });
        haptic('progress');
      }, 260);
    } else if (ev.type === 'draw') {
      const v = views.get(ev.id);
      special.add(ev.id);
      setZ(v, 3000);
      sfx('draw', { vol: 0.7 });
      haptic('tap');
      combo = 0;
      moveView(v, T.get(ev.id), { dur: 260, easing: ease.outCubic, arc: 30 }).then(() => setZ(v, T.get(ev.id).z));
      setUp(v, true, { delay: 30 });
    } else if (ev.type === 'recycle') {
      sfx('recycle');
      onceTip('recycle');
      [...S.deck].reverse().forEach((c, k) => {
        const v = views.get(c.id);
        special.add(c.id);
        setUp(v, false, { delay: k * 12 });
        moveView(v, T.get(c.id), { dur: 280, delay: k * 12, easing: ease.inOutCubic }).then(() => setZ(v, T.get(c.id).z));
      });
    }
  }
  relayout({ dur: 220, except: special });
  if (!delivered) updateSlotLabels();
  else setTimeout(updateSlotLabels, 400);
  updateHUD(true);
  if (introHold) releaseIntro();
  if (script) { $('boosters').querySelectorAll('.booster').forEach(b => b.classList.remove('active')); script.i++; setTimeout(runScript, 420); }
  else tutorialCheck(events);
  afterAction();
}
function landSquash(v) {
  const o = { k: 0 };
  tween(o, { k: 1 }, { dur: 180, key: 'sq-' + v.id, onUpdate: () => { v.s = 1 + 0.06 * Math.sin(o.k * Math.PI) ; applyTransform(v); } })
    .then(() => { v.s = 1; applyTransform(v); });
}
// P5: chữ nổi (combo, +xu, giao thư) là chữ nâu đậm trên viên kem (tương phản > 7:1), thay chữ vàng nhạt trên nền mint.
// Tham số màu cũ chỉ còn dùng cho viền nhấn (combo lớn viền đỏ air-mail).
function floatText(txt, x, y, color = '') {
  const el = document.createElement('div');
  el.textContent = txt;
  const edge = color === '#ff9d3b' ? '#c8483c' : 'rgba(90,58,38,.75)';
  el.style.cssText = `position:absolute;left:0;top:0;font-size:${fs(50)};line-height:1.15;padding:4px 26px 2px;border-radius:40px;background:#fff8ea;color:#5a3a26;
    box-shadow:0 0 0 4px ${edge},0 5px 0 rgba(90,58,38,.25);z-index:4000;pointer-events:none;white-space:nowrap`;
  board.append(el);
  const o = { y, a: 1, s: 0.4 };
  const draw = () => { el.style.transform = `translate(${x - el.offsetWidth / 2}px,${o.y}px) scale(${o.s})`; el.style.opacity = o.a; };
  draw();
  tween(o, { s: 1 }, { dur: 250, easing: ease.outBack, onUpdate: draw });
  tween(o, { y: y - 90 }, { dur: 800, easing: ease.outCubic, onUpdate: draw });
  tween(o, { a: 0 }, { dur: 300, delay: 550, onUpdate: draw }).then(() => el.remove());
}
function comboReward(x, y) {
  floatText('+5', x, y - 110, '#ffd84a');
  sfx('claim', { vol: 0.7 });
  coinsTo(5, x, y);
}

// Chuỗi hoàn thành ô: gom tem -> phong bì bật ra -> sáp đóng "cộp" -> bay đi.
let lastDelivered = null;      // chủ đề vừa giao gần nhất -> cư dân nhắn ở màn thắng
async function completeAnim(slot, ids, topic, delay) {
  const token = levelToken;
  completing.add(slot);
  try { await completeAnimInner(slot, ids, topic, delay, token); } finally { if (token === levelToken) completing.delete(slot); }
  if (token === levelToken) updateSlotLabels();
}
async function completeAnimInner(slot, ids, topic, delay, token) {
  const p = slotPos(slot);
  const cx = p.x + CW / 2, cy = p.y + CH / 2;
  const vs = ids.map(id => views.get(id)).filter(Boolean);
  vs.forEach(v => { v.gone = true; clearTimeout(v.hideT); v.el.style.visibility = ''; });
  // album: tem đã gửi thì được sưu tầm (theo chủ đề + art)
  save.album = save.album || {};
  const got = new Set(save.album[topic] || []);
  vs.forEach(v => { if (v.card && v.card.k === 'stamp') got.add(v.card.art); });
  save.album[topic] = [...got];
  persist();
  track('deliver', { level: dailyRun ? dailyRun.key : levelIdx + 1, topic, stamps: vs.filter(v => v.card && v.card.k === 'stamp').length });
  if (seasonCard != null && ids.includes(seasonCard)) seasonCollectFx(views.get(seasonCard));
  await wait(delay);
  if (token !== levelToken) return;
  // gom
  vs.forEach((v, k) => {
    killTweens(v);
    setZ(v, 3500 + k);
    tween(v, { x: p.x, y: p.y, r: (k % 2 ? 1 : -1) * (2 + k), s: 0.96 }, { dur: 160, easing: ease.outCubic, onUpdate: applyTransform });
  });
  await wait(170);
  // phong bì
  const env = document.createElement('div');
  env.style.cssText = `position:absolute;left:0;top:0;width:230px;height:193px;background:url(assets/ui/envelope_closed.png) center/contain no-repeat;z-index:3600;pointer-events:none`;
  board.append(env);
  const e = { x: cx - 115, y: cy - 96, s: 0.1, r: -8, a: 1 };
  const drawEnv = () => { env.style.transform = `translate(${e.x}px,${e.y}px) rotate(${e.r}deg) scale(${e.s})`; env.style.opacity = e.a; };
  drawEnv();
  vs.forEach(v => tween(v, { s: 0.25, y: p.y + 20 }, { dur: 200, easing: ease.inCubic, onUpdate: o => { applyTransform(o); v.el.style.opacity = Math.max(0, (o.s - 0.25) / 0.7); } }));
  sfx('whoosh', { vol: 0.5, rate: 1.3 });
  await tween(e, { s: 1.08, r: 0 }, { dur: 260, easing: ease.outBack, onUpdate: drawEnv });
  if (token !== levelToken) { env.remove(); return; }
  vs.forEach(v => { v.el.remove(); views.delete(v.id); });
  // sáp
  const wax = document.createElement('div');
  wax.style.cssText = `position:absolute;left:0;top:0;width:84px;height:100px;background:url(assets/ui/wax.png) center/contain no-repeat;z-index:3700;pointer-events:none`;
  board.append(wax);
  const w = { s: 3.2, a: 0 };
  const drawWax = () => { wax.style.transform = `translate(${cx - 42}px,${cy - 50}px) scale(${w.s})`; wax.style.opacity = w.a; };
  drawWax();
  await tween(w, { s: 1, a: 1 }, { dur: 190, easing: ease.inCubic, onUpdate: drawWax });
  sfx('complete');
  sfx('boom', { vol: 0.35 });
  haptic('milestone');
  shake(3);
  ring(cx, cy, { color: '#f6eedc', r1: 230, width: 14 });
  sparkle(cx, cy, 26, { spread: 1.3, colors: ['#ffd84a', '#ff7a59', '#ffffff', '#fff4a0'], size: 12 });
  const sq = { s: 1 };
  tween(sq, { s: 0.92 }, { dur: 70, onUpdate: () => { e.s = 1.08 * sq.s; drawEnv(); } }).then(() =>
    tween(sq, { s: 1 }, { dur: 200, easing: ease.outBack, onUpdate: () => { e.s = 1.08 * sq.s; drawEnv(); } }));
  floatText(`${topicName(topic)} · ${t('to_resident', { name: residentOf(topic) })}`, cx, p.y - 30, '#ffffff');
  lastDelivered = topic;
  const fast = E.isWon(S);          // UI/UX P2-8: lá thư cuối của ván rút ngắn để bảng thắng hiện sớm hơn (~1,1 s thay vì 1,6 s)
  await wait(fast ? 150 : 380);
  completing.delete(slot);
  // bay đi
  slotEl(slot).classList.toggle('open', !!S.found[slot]);
  if (!S.found[slot]) slotEl(slot).querySelector('.count').textContent = '';
  // bay vào ĐÚNG đoạn của nó trên thanh tiến độ: mục tiêu "gửi N lá thư" khép vòng bằng hình
  const bar = $('combo');
  const tp = topicProgress();
  const seg = Math.max(0, Math.min(tp.total - 1, tp.done - 1));
  const tx = bar.offsetLeft + 24 + (seg + 0.5) / Math.max(1, tp.total) * (bar.offsetWidth - 48) - 115;
  const ty = bar.offsetTop + bar.offsetHeight / 2 - 96;
  const fly = { k: 0 };
  const sx = e.x, sy = e.y;
  sfx('whoosh', { vol: 0.8 });
  const wx0 = cx - 42, wy0 = cy - 50;
  await tween(fly, { k: 1 }, { dur: fast ? 420 : 560, easing: ease.inOutCubic, onUpdate: () => {
    e.x = sx + (tx - sx) * fly.k; e.y = sy + (ty - sy) * fly.k - Math.sin(fly.k * Math.PI) * 140;
    e.r = -10 * Math.sin(fly.k * Math.PI); e.s = 1.08 - 0.86 * fly.k; drawEnv();
    wax.style.transform = `translate(${wx0 + (e.x - sx)}px,${wy0 + (e.y - sy)}px) rotate(${e.r}deg) scale(${e.s / 1.08})`;
    if (Math.random() < 0.35) sparkle(e.x + 115, e.y + 96, 1, { spread: 0.3 });
  } });
  env.remove(); wax.remove();
  // đến nơi: thanh nảy nhẹ + loé sáng ở đoạn vừa gửi
  sfx('coin', { vol: 0.5 });
  ring(tx + 115, ty + 96, { color: '#d9a441', r1: 120, width: 10 });
  sparkle(tx + 115, ty + 96, 10, { colors: ['#ffd84a', '#ffffff', '#8cc8ff'] });
  bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump');
}
function shake(px) {
  if (reduceMotion()) return;
  px *= 0.5;                          // người lớn tuổi: rung nhẹ, không giật
  const o = { k: 0 };
  tween(o, { k: 1 }, { dur: 260, key: 'shake', onUpdate: () => {
    const a = px * (1 - o.k);
    board.style.transform = `translate(${(Math.random() - 0.5) * a}px,${(Math.random() - 0.5) * a}px)`;
  } }).then(() => { board.style.transform = ''; });
}

// ============================================================ end states
function afterAction() {
  if (ended) return;
  const token = levelToken;
  const same = fn => () => { if (token === levelToken) fn(); };
  saveRun();
  if (E.isWon(S)) {
    clearRun();
    ended = true;
    clearTimeout(idleTimer);
    tut(null);
    Promise.all(pending).then(() => wait(120)).then(same(winSequence));
    return;
  }
  if (S.moves <= 0) {
    if (safetyOf(L) === 'overtime') { startOvertime(); return; }
    ended = true;
    Promise.all(pending).then(() => wait(450)).then(same(outOfMoves));
    return;
  }
  if (deferredIntro && S.used >= 6 && !panelOpen && !script) { deferredIntro = false; Promise.all(pending).then(() => wait(400)).then(same(() => featureIntro(true))); }
  if (canAutoFinish() && autoFinish(token)) return;
  if (isStuck() && S.used >= stuckMuteUntil) {
    Promise.all(pending).then(() => wait(500)).then(same(() => {
      if (!isStuck() || ended || jokerMode) return;
      if (safetyOf(L) !== 'none') rescue(); else stuckPanel();
    }));
  }
}
// Overtime: level khó hết moves thì không thua, chơi tiếp với moves vô hạn (chỉ còn 1 sao).
function startOvertime() {
  overtime = true;
  S.moves = Infinity;
  movesEl.classList.add('overtime');
  updateHUD();
  sfx('overtime');
  haptic('milestone');
  floatText(t('overtime_big'), 540, 420, '#ffd36b');
  toast(t('overtime'), 2800);
  saveRun();
  const tp = topicProgress();
  track('overtime_start', { level: levelIdx + 1, attempt: play.attempt, delivered: S.delivered, total: S.total, topics_left: tp.total - tp.done, special: specialOf(L) || '' });
}
// Kẹt cứng ở level khó: ưu tiên booster người chơi đã được dạy (Magnet, mở từ L4) để họ tự gỡ thế kẹt,
// mỗi lượt chơi 1 lần; vẫn kẹt (hoặc chưa mở Magnet, hoặc không ô nào còn tem ẩn để hút) thì tặng Joker.
function rescue() {
  const lv = levelIdx + 1;
  const piles = S.found.map((_, k) => k).filter(k => pullable(k) && E.cardsOfTopic(S, S.found[k].t).hidden.length > 0);
  if (lv >= UNLOCK_AT.pack && !play.magnetRescued && piles.length) {
    play.magnetRescued = true;
    play.rescues++;
    save.pack = (save.pack || 0) + 1;
    persist();
    renderBoosters();
    track('rescue_magnet', { level: lv, attempt: play.attempt, delivered: S.delivered, total: S.total });
    toast(t('rescue_magnet'), 3200);
    sfx('feature');
    $('boosters').querySelector('[data-id=pack]').classList.add('active');
    { const c = boosterCenter('pack'); handTap(c.r, c.y, { side: true }); }
    return;
  }
  rescueJoker();
}
function rescueJoker() {
  play.rescues++;
  jokerFree = true;
  track('rescue_joker', { level: levelIdx + 1, attempt: play.attempt, delivered: S.delivered, total: S.total });
  toast(t('rescue'), 2600);
  sfx('feature');
  toggleJoker();
  // chưa học Tem Vàng (L9) thì giải thích nó làm gì; bàn tay chỉ cột nên đặt (đỉnh là tem thường, nhiều lá úp nhất)
  tut(t('rescue_joker_how'));
  const ci = jokerCol({});
  const col = S.cols[ci]; const ys = colOffsets(col);
  handTap(colX(ci) + CW * 0.88, (col.length ? ys[ys.length - 1] : TAB_Y) + CH * 0.4, { side: true });
}
// Deck hết và không còn lá úp: tự dọn bàn nếu solver chắc chắn thắng trong số moves còn lại.
let autoFinishing = false;
function canAutoFinish() {
  if (autoFinishing || S.deck.length || S.waste.length) return false;
  return S.cols.every(col => col.every(c => c.up));
}
/** Trả về true nếu bắt đầu tự dọn bàn; false nếu không chắc thắng (để afterAction kiểm tra kẹt). */
function autoFinish(token) {
  const r = solve(S, { width: 200, timeLimitMs: 250 });
  if (!r || r.moves - S.used > S.moves) return false;
  runAutoFinish(token, r);
  return true;
}
async function runAutoFinish(token, r) {
  autoFinishing = true;
  busyInput = true;
  toast(t('autofinish'), 1200);
  await wait(350);
  try {
    for (const a of r.path) {
      if (token !== levelToken || ended) break;
      if (a.draw) break;
      doMove(a.src, a.dst, false);
      await wait(170);
    }
  } finally {
    autoFinishing = false;
    if (token === levelToken) busyInput = false;
  }
}
// Kẹt cứng: không còn nước có ích, kể cả khi deck còn bài (rút vòng vòng cũng vô ích).
function isStuck() { return isDeadlocked(S); }
const pointsEarned = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const pointsSpent = () => CHAPTERS.reduce((sum, c) => sum + c.decor.slice(0, save[c.key] || 0).reduce((a, d) => a + d.cost, 0), 0);
const pointsLeft = () => pointsEarned() - pointsSpent();
// R11: luật Tem Điểm mới (points.js): thắng trong số nước 3 hoặc 2 điểm, Ca tối ở level khó 2 điểm.
function stars() {
  return stampPoints({ levelMoves: L.moves, solverMoves: L.solverMoves, movesLeft: S.moves === Infinity ? 0 : S.moves, overtime });
}
// ============================================================ màn thắng dàn dựng (R12 + P6, benchmark-grand-games.md mục 4.3)
// Dòng thời gian (giây, tính từ lúc vào màn thắng):
//   0,2-0,9 khay thành phong bì bay vào thanh tiến độ (túi thư [ART] chưa có: tạm bay vào #combo như completeAnimInner)
//   0,9 tiếng win + confetti giấy | 1,1 bảng trượt lên | 1,4/1,7/2,0 Tem Điểm đóng cộp | 2,2 xu bay, số đếm dần | 2,5 nút bấm được (AC ≤ 2,6)
// Chạm bất kỳ đâu từ 0,9 giây: tua tới bước cuối (finishWin). Giảm chuyển động: không phong bì/confetti, bảng hiện ngay,
// Tem Điểm cách nhau 150 ms. "Tiếp tục" là nút chính; "Nhận x2" là nút phụ nhỏ, chỉ từ L11 và không có ở màn hết chương.
let winTL = null;          // { t0, steps, timers, ended, skipped, finalized, skipFrom }
let winInfo = null;        // cho test: { reward, paid() }
let winCatch = null, winCoinClone = null, winEnvs = [], winBag = null;
// P6: túi thư của Pip (mailbag_open -> mailbag_full) phía trên bảng thắng. Phong bì từ các khay bay vào miệng túi.
function bagShow({ full = false, instant = false } = {}) {
  if (!winBag) {
    winBag = document.createElement('div');
    winBag.className = 'win-bag';
    overlay.append(winBag);
  }
  winBag.classList.toggle('full', full);
  if (instant) { winBag.style.transform = ''; winBag.style.opacity = 1; return winBag; }
  const o = { s: 0.4, a: 0 };
  const draw = () => { if (winBag) { winBag.style.transform = `scale(${o.s})`; winBag.style.opacity = o.a; } };
  draw();
  tween(o, { s: 1, a: 1 }, { dur: 240, easing: ease.outBackSoft, onUpdate: draw });
  return winBag;
}
function bagFill() {
  if (!winBag || winBag.classList.contains('full')) return;
  winBag.classList.add('full');
  sfx('claim', { vol: 0.45, rate: 0.9 });
  if (reduceMotion()) return;
  const o = { k: 0 };
  tween(o, { k: 1 }, { dur: 260, easing: ease.outCubic, key: 'bagsq', onUpdate: () => {
    if (winBag) winBag.style.transform = `scale(${1 + 0.06 * Math.sin(o.k * Math.PI)},${1 - 0.08 * Math.sin(o.k * Math.PI)})`;
  } });
}
const bagMouth = () => (winBag ? { x: winBag.offsetLeft + winBag.offsetWidth / 2, y: winBag.offsetTop + winBag.offsetHeight * 0.42 } : { x: 540, y: 400 });
function runWinTimeline(steps, skipFrom) {
  const tl = { t0: performance.now(), steps, timers: [], ended: false, skipped: false, finalized: false, skipFrom };
  for (const st of steps) {
    st.ran = false;
    tl.timers.push(setTimeout(() => { if (tl.finalized || winTL !== tl) return; st.ran = true; st.run(); }, st.at));
  }
  return tl;
}
/** Đưa màn thắng về trạng thái cuối ngay. skip = người chơi chạm để tua (mục tiêu xong trong 300 ms). */
function finishWin(skip = false) {
  const tl = winTL;
  if (!tl || tl.finalized || (skip && tl.ended)) return;
  tl.finalized = true;
  if (skip) tl.skipped = true;
  tl.timers.forEach(clearTimeout);
  for (const st of tl.steps) if (st.finish) st.finish(st.ran);
  tl.ended = true;
}
/** Rời màn thắng (vào level mới, về Trang chủ): dừng dòng thời gian, cộng nốt xu thưởng, dọn lớp phụ. */
function endWin() {
  const tl = winTL;
  if (tl) {
    tl.timers.forEach(clearTimeout);
    if (!tl.finalized) { tl.finalized = true; for (const st of tl.steps) if (st.leave) st.leave(st.ran); }
  }
  winTL = null;
  winEnvs.forEach(e => e.remove()); winEnvs = [];
  if (winBag) { killKey('bagsq'); winBag.remove(); winBag = null; }
  if (winCatch) { winCatch.remove(); winCatch = null; }
  if (winCoinClone) { winCoinClone.remove(); winCoinClone = null; }
  document.body.classList.remove('win');
}
overlay.addEventListener('pointerdown', () => {
  const tl = winTL;
  if (!tl || tl.ended || tl.finalized || performance.now() - tl.t0 < tl.skipFrom) return;
  finishWin(true);
  // ngón tay vừa chạm để tua: nút chỉ nhận pointerup của một lần chạm MỚI (chạm tua không thành bấm nút)
  if (panelOpen) panelOpen.p.querySelectorAll('.btn').forEach(b => { b._armed = false; });
});
/** Mỗi khay đích thành một phong bì, bay lần lượt (cách 80 ms) vào thanh tiến độ. Trả về các phần tử để tua/dọn. */
function fadeTrays(instant = false) {
  for (const el of [...slotEls, extraEl]) if (el) { el.style.transition = instant ? 'none' : 'opacity .2s'; el.style.opacity = '0'; }
}
function flyTraysAway() {
  const m = bagMouth();
  const tx = m.x, ty = m.y;
  let landed = 0;
  const envs = [];
  slotEls.forEach((_, k) => {
    const p = slotPos(k);
    const env = document.createElement('div');
    env.style.cssText = 'position:absolute;left:0;top:0;width:230px;height:193px;background:url(assets/ui/envelope_closed.png) center/contain no-repeat;z-index:28;pointer-events:none;opacity:0';
    overlay.append(env);
    envs.push(env);
    const e = { x: p.x + CW / 2, y: p.y + CH / 2, s: 0.2, a: 0, r: -6 };
    const draw = () => { env.style.transform = `translate(${e.x - 115}px,${e.y - 96}px) rotate(${e.r}deg) scale(${e.s})`; env.style.opacity = e.a; };
    draw();
    setTimeout(() => {
      if (!env.isConnected) return;
      sfx('whoosh', { vol: 0.3, rate: 1.15 + k * 0.06 });
      tween(e, { s: 0.72, a: 1, r: 0 }, { dur: 120, easing: ease.outBackSoft, onUpdate: draw })
        .then(() => {
          if (!env.isConnected) return null;
          const sx = e.x, sy = e.y, f = { k: 0 };
          return tween(f, { k: 1 }, { dur: 330, easing: ease.inOutCubic, onUpdate: () => {
            e.x = sx + (tx - sx) * f.k; e.y = sy + (ty - sy) * f.k - Math.sin(f.k * Math.PI) * 120;
            e.s = 0.72 - 0.5 * f.k; e.r = -8 * Math.sin(f.k * Math.PI); draw();
          } });
        })
        .then(() => {
          if (!env.isConnected) return;
          env.remove();
          sparkle(tx, ty, 4);
          if (++landed === slotEls.length) bagFill();
          else if (winBag && !reduceMotion()) { const o = { k: 0 }; tween(o, { k: 1 }, { dur: 160, key: 'bagsq', onUpdate: () => { if (winBag) winBag.style.transform = `scale(1,${1 - 0.05 * Math.sin(o.k * Math.PI)})`; } }); }
        });
    }, k * 80);
  });
  return envs;
}
async function winSequence() {
  if (dailyRun) return dailyWinSequence();
  clearRun();
  levelActive = false;
  const lvNum = levelIdx + 1;
  const done = {
    level: lvNum, attempt: play.attempt, moves_used: S.used, moves_left: S.moves === Infinity ? 0 : S.moves,
    time_s: Math.round((Date.now() - play.start) / 1000), stars: stars(), overtime, boosters: play.boosters, undo: play.undo,
    rescues: play.rescues, continues: play.continues, special: specialOf(L) || '', safety: safetyOf(L), taps: play.taps || 0, drags: play.drags || 0,
  };
  track('level_complete', done);
  track('af_level_achieved', { af_level: lvNum, af_score: done.stars });      // sự kiện chuẩn AppsFlyer
  if (specialOf(L)) track(`milestone_level_${lvNum}`, done);                  // mốc UA (L5, L10)
  const st = stars();
  const mult = EV.weekendMult(LIVE.liveState(save.live, LIVE.nowMs(), wonLevel()));   // E3: Thứ Bảy, Chủ nhật xu thắng x2 (từ L8)
  const reward = (10 + st * 10) * mult;
  if (mult > 1) track('weekend_bonus', { level: levelIdx + 1, base: reward / mult, reward });
  const lv = levelIdx + 1;
  EV.gentleRecord(save.losses = save.losses || {}, lv, true);
  const gain = Math.max(0, st - (save.stars[lv] || 0));     // Tem Điểm mới: chỉ phần vượt điểm cao nhất cũ
  save.stars[lv] = Math.max(save.stars[lv] || 0, st);
  if (gain) track('points_earned', { level: lv, gain, total: pointsEarned(), left: pointsLeft() });
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, lv + 1));
  extraKept = -1;
  const last = lv === LEVELS.length;
  const chEnd = CHAPTERS.find(c => c.to === lv);          // level cuối chương -> thưởng chương
  const explainPts = gain > 0 && !save.seen.pts_explain;
  if (explainPts) save.seen.pts_explain = 1;
  // đủ Tem Điểm cho món decor kế tiếp của chương này: mời trang trí ngay (mỗi món mời 1 lần), không thì vòng meta vô hình
  const dch = chapterOf(lv);
  const dnext = decorOf(dch)[save[dch.key] || 0];       // chương chưa có art decor: không mời trang trí
  const promptDecor = !chEnd && dnext && pointsLeft() >= dnext.cost && save.seen['decor_prompt_' + dnext.id] !== 1;
  if (promptDecor) save.seen['decor_prompt_' + dnext.id] = 1;
  persist();
  const evLines = winMeta();                     // E1 đi 1 trạm, F5 túi thư +1 (sau khi unlocked cập nhật: thắng L15 là mở túi thư)
  const showX2 = lv >= 11 && !chEnd;                      // PO chốt (R12): x2 từ L11, không ở màn hết chương

  endWin();
  const calm = reduceMotion();
  document.body.classList.add('win');
  overlay.style.pointerEvents = 'auto';
  overlay.style.zIndex = '';
  winCatch = document.createElement('div');
  winCatch.className = 'win-catch';
  overlay.append(winCatch);
  // ô xu nằm dưới lớp mờ (#ui z 6 < #overlay z 10): chép một bản lên trên lớp mờ, cùng toạ độ
  winCoinClone = $('coins').cloneNode(true);
  winCoinClone.removeAttribute('id');
  winCoinClone.classList.add('clone');
  winCoinClone.style.transform = '';
  overlay.append(winCoinClone);

  let pEl = null, coinCtl = null, paidDirect = false;
  winInfo = { level: lv, reward, paid: () => (paidDirect ? reward : coinCtl ? reward - coinCtl.left : 0) };
  const winButton = (button, fn) => {
    const tl = winTL;
    finishWin(false);
    track('win_button', { level: lv, button, ms: tl ? Math.round(performance.now() - tl.t0) : -1, skipped: !!(tl && tl.skipped) });
    fn();
  };
  const buttons = [
    { label: t('cont'), cls: 'wait', act: () => winButton('continue', () => (chEnd ? chapterReward(chEnd) : startLevel(levelIdx + 1))) },
    ...(promptDecor ? [{ label: t('decorate_now', { name: t('decor_' + dnext.id) }), cls: 'sub wait', act: () => winButton('decorate', () => { goHome(dch.id); decorPanel(); }) }] : []),
    ...(showX2 ? [{ label: t('claim2'), cls: 'small wait', act: () => winButton('x2', () => fakeAd(() => {
      coinsTo(reward, 540, 900);
      const tk = levelToken;
      setTimeout(() => { if (tk === levelToken) startLevel(levelIdx + 1); }, 1300);
    }, 'win_x2')) }] : []),
  ];
  if (showX2) track('ad_offer', { level: lv, placement: 'win_x2' });
  const openPanel = instant => panel({
    title: chEnd ? t('win_last') : st === 3 ? t('win_title') : st === 2 ? t('win_great') : t('win_ok'),
    radial: true, kind: 'win', instant,
    body: `<div class="stars"><i></i><i></i><i></i></div>
      <div class="pts-line">${gain ? t('pts_gain', { n: gain }) : t('pts_best', { n: save.stars[lv] })}</div>
      ${explainPts ? `<p style="font-size:${fs(42)};margin:0 0 6px">${t('pts_explain')}</p>` : ''}
      ${S.moves === Infinity ? '' : `<p>${t('moves_left', { n: S.moves })}</p>`}
      ${L.moves != null && !overtime && st < 3 ? `<p style="font-size:${fs(42)};margin:0">${t('stars_hint')}</p>` : ''}
      ${last ? `<p>${t('win_end')}</p>` : ''}
      ${lastDelivered ? `<p class="note"><b>${residentOf(lastDelivered)}:</b> “${residentNote(residentOf(lastDelivered))}”</p>` : ''}
      <div class="coins-line"><i></i><span>+${reward}</span>${mult > 1 ? `<em class="x2">${t('weekend_x2')}</em>` : ''}</div>${evLines}`,
    buttons,
  });
  const T = calm ? { win: 0, panel: 150, stamp0: 350, gap: 150 } : { win: 900, panel: 1100, stamp0: 1400, gap: 300 };
  T.coins = calm ? T.stamp0 + 3 * T.gap : 2200;
  T.ready = calm ? T.coins + 300 : 2500;          // AC <= 2,6 giây: chừa 100 ms cho độ trễ setTimeout
  const unwait = () => { if (pEl) { pEl.querySelectorAll('.btn.wait').forEach(b => { b.classList.remove('wait'); b.classList.add('pop'); }); fitPanel(pEl); } };
  const steps = [];
  if (!calm) {
    steps.push({ at: 60, run: () => bagShow(), finish: () => bagShow({ full: true, instant: true }) });
    steps.push({ at: 200, run: () => { winEnvs = flyTraysAway(); }, finish: () => { winEnvs.forEach(e => e.remove()); winEnvs = []; } });
  }
  steps.push({ at: calm ? T.panel : 950, run: () => { fadeTrays(calm); if (calm) bagShow({ full: true, instant: true }); else bagFill(); },
    finish: () => { fadeTrays(true); bagShow({ full: true, instant: true }); } });   // UI/UX P1-3: khay trống không ló trên ruy băng
  steps.push({ at: T.win, run: () => {
    sfx('win');
    if (!calm) { const m = bagMouth(); confetti(46, { x: m.x, y: m.y, drag: 3.2, gravity: 650, life: 2.1, spread: 0.75 }); }
    haptic('success');
  } });
  steps.push({ at: T.panel, run: () => { pEl = openPanel(calm); }, finish: ran => { if (!ran) pEl = openPanel(true); } });
  let stampSkipped = false;
  for (let k = 0; k < st; k++) {
    steps.push({ at: T.stamp0 + k * T.gap,
      run: () => {
        const i = pEl && pEl.querySelectorAll('.stars i')[k];
        if (i) i.classList.add('on');
        sfx('stamp', { rate: [0.94, 1, 1.06][k] });
        sfx('claim', { vol: 0.4, rate: [1, 1.1225, 1.2599][k], delay: 0.05 });
        haptic('progress');
      },
      finish: ran => {
        if (ran) return;
        const i = pEl && pEl.querySelectorAll('.stars i')[k];
        if (i) i.classList.add('on', 'now');
        if (!stampSkipped) { stampSkipped = true; sfx('stamp'); }
      } });
  }
  steps.push({ at: T.coins,
    run: () => { coinCtl = coinsTo(reward, 540, 1000); },
    finish: ran => {
      if (ran && coinCtl) { coinCtl.finish(); bumpCoins({ instant: true, pop: false }); return; }
      if (!paidDirect) { paidDirect = true; save.coins += reward; persist(); bumpCoins({ instant: true }); sfx('coins', { vol: 0.6 }); }
    },
    leave: ran => {
      if (ran && coinCtl) coinCtl.finish();
      else if (!paidDirect) { paidDirect = true; save.coins += reward; persist(); }
    } });
  steps.push({ at: T.ready, run: () => { unwait(); if (winTL) winTL.ended = true; }, finish: unwait });
  winTL = runWinTimeline(steps, calm ? T.panel : 900);
}
// Màn thắng Thư hôm nay (L2): cùng khung dàn dựng với màn thắng thường, phần thưởng là dấu ngày đóng lên + xu.
function dailyWinSequence() {
  const run = dailyRun;
  clearDailyRun();
  levelActive = false;
  const D = dailySave();
  const first = !D.won[run.day];
  const reward = first ? (run.catchup ? DAILY_REWARD.catchup : DAILY_REWARD.today) : 0;
  let pageDone = false, wkBox = null;
  if (first) {
    D.won[run.day] = run.catchup ? 2 : 1;
    D.stamps.push(run.day);
    if (D.stamps.length % STAMP_PAGE === 0) { pageDone = true; D.pages++; D.keepsakes++; }
    // F3 Thẻ tuần (L3): ô thứ 5 của tuần chứa ngày lá thư -> hộp mở ngay
    const w = weekly(run.day);
    if (w.ready && !EV.KILL.weekly) {
      save.weekly[w.week] = 1;
      wkBox = { coins: LIVE.WEEKLY.coins, hint: LIVE.WEEKLY.hint, pack: LIVE.WEEKLY.pack };
      save.hint = (save.hint || 0) + wkBox.hint; save.pack = (save.pack || 0) + wkBox.pack;
      track('weekly_box_open', { week: LIVE.dayKey(LIVE.weekStart(run.day)), days: w.count, day: run.key });
    }
  }
  const total = reward + (pageDone ? DAILY_REWARD.page : 0) + (wkBox ? wkBox.coins : 0);
  persist();
  const evLines = winMeta();
  notifSync('daily_win');                          // L11: hôm nay đã giao thư -> bỏ thông báo của hôm nay
  track('daily_complete', { day: run.key, attempt: play.attempt, moves_used: S.used, moves_left: S.moves === Infinity ? 0 : S.moves, catchup: !!run.catchup,
    replay: !first, reward: total, stamps: D.stamps.length, time_s: Math.round((Date.now() - play.start) / 1000), src: L.src });
  if (first && run.catchup) track('daily_catchup', { day: run.key });
  if (pageDone) track('stampbook_page_complete', { page: D.pages, stamps: D.stamps.length, days: D.stamps[D.stamps.length - 1] - D.stamps[D.stamps.length - STAMP_PAGE] + 1 });
  endWin();
  const calm = reduceMotion();
  document.body.classList.add('win');
  overlay.style.pointerEvents = 'auto';
  overlay.style.zIndex = '';
  winCatch = document.createElement('div'); winCatch.className = 'win-catch'; overlay.append(winCatch);
  winCoinClone = $('coins').cloneNode(true); winCoinClone.removeAttribute('id'); winCoinClone.classList.add('clone'); winCoinClone.style.transform = ''; overlay.append(winCoinClone);
  let pEl = null, coinCtl = null, paidDirect = false;
  winInfo = { level: run.key, reward: total, paid: () => (paidDirect ? total : coinCtl ? total - coinCtl.left : 0) };
  const inPage = pageDone ? STAMP_PAGE : D.stamps.length % STAMP_PAGE;
  const openPanel = instant => panel({
    title: first ? t('daily_win') : t('daily_win_again'), radial: true, kind: 'win', instant,
    body: `<div class="postmark big"><b>${dailyDateText(run.day)}</b><small>${t('daily_word')}</small></div>
      ${first ? `<div class="pts-line">${t('book_title')} · ${inPage}/${STAMP_PAGE}</div>` : `<p>${t('daily_no_reward')}</p>`}
      ${pageDone ? `<p>${t('book_page_done', { n: DAILY_REWARD.page })}</p>` : ''}
      ${wkBox ? `<p><b>${t('weekly_box')}</b></p>${giftChips({ hint: wkBox.hint, pack: wkBox.pack, coins: wkBox.coins })}` : ''}
      ${total ? `<div class="coins-line"><i></i><span>+${total}</span></div>` : ''}${evLines}`,
    buttons: [{ label: t('daily_home'), cls: 'wait', act: () => { const tl = winTL; finishWin(false); track('win_button', { level: run.key, button: 'home', ms: tl ? Math.round(performance.now() - tl.t0) : -1 }); goHome(); } }],
  });
  const T = calm ? { win: 0, panel: 150, stamp: 350, coins: 650, ready: 900 } : { win: 300, panel: 500, stamp: 850, coins: 1250, ready: 1600 };
  const unwait = () => { if (pEl) { pEl.querySelectorAll('.btn.wait').forEach(b => { b.classList.remove('wait'); b.classList.add('pop'); }); fitPanel(pEl); } };
  const stampOn = () => { const m = pEl && pEl.querySelector('.postmark'); if (m) m.classList.add('on'); };
  const steps = [
    { at: T.panel, run: () => { fadeTrays(calm); bagShow({ full: true, instant: calm }); }, finish: () => { fadeTrays(true); bagShow({ full: true, instant: true }); } },
    { at: T.win, run: () => { sfx('win'); if (!calm) confetti(36, { x: 540, y: 420, drag: 3.2, gravity: 650, life: 2.1, spread: 0.75 }); haptic('success'); } },
    { at: T.panel, run: () => { pEl = openPanel(calm); }, finish: ran => { if (!ran) pEl = openPanel(true); } },
    { at: T.stamp, run: () => { stampOn(); sfx('stamp'); haptic('progress'); }, finish: ran => { if (!ran) stampOn(); } },
    { at: T.coins, run: () => { if (total) coinCtl = coinsTo(total, 540, 1000); },
      finish: ran => { if (!total) return; if (ran && coinCtl) { coinCtl.finish(); bumpCoins({ instant: true, pop: false }); return; } if (!paidDirect) { paidDirect = true; save.coins += total; persist(); bumpCoins({ instant: true }); } },
      leave: ran => { if (!total) return; if (ran && coinCtl) coinCtl.finish(); else if (!paidDirect) { paidDirect = true; save.coins += total; persist(); } } },
    { at: T.ready, run: () => { unwait(); if (winTL) winTL.ended = true; }, finish: unwait },
  ];
  winTL = runWinTimeline(steps, calm ? T.panel : 300);
}
// Cuối chương: thưởng một lần + mời sang chương sau (hoặc mở album) -> lý do quay lại (đo D1)
function chapterReward(ch = CHAPTERS[0]) {
  const next = CHAPTERS.find(c => c.id === ch.id + 1 && c.from <= LEVELS.length);
  const body = ch.id === 1 ? t('chapter_body_1') : `${t('chapter_done', { place: chPlace(ch) })} ${next ? t('chapter_next', { next: chPlace(next) }) : t('chapter_more')}`;
  const flag = 'chapter' + ch.id;
  if (save[flag]) { goHome(next ? next.id : ch.id); return; }
  save[flag] = 1;
  save.coins += 200;
  persist();
  track('chapter_complete', { chapter: ch.id });
  sfx('chapter');
  panel({ title: t('chapter_title', { n: ch.id }), radial: true,
    body: `<div class="feature-icon" style="background-image:url(assets/ui/envelope_closed.png)"></div><p>${body}</p><div class="coins-line"><i></i><span>+200</span></div>`,
    buttons: next
      ? [{ label: t('next_ch', { n: next.id }), act: () => playLevel(next.from - 1) }, { label: t('open_album'), cls: 'orange', act: () => { goHome(next.id); openAlbum(); } }]
      : [{ label: t('open_album'), act: () => { goHome(ch.id); openAlbum(); } }, { label: t('home'), cls: 'orange', act: () => goHome(ch.id) }],
    onOpen: () => setTimeout(() => coinsTo(200, 540, 1000), 500) });
}
// Album tem: mọi chủ đề trong 10 level, tem đã gửi hiện ra, tem chưa có hiện mặt sau lá
function openAlbum() {
  const topics = [];
  const arts = {};
  for (const lvd of LEVELS.filter(l => l.id <= save.unlocked)) for (const c of [...lvd.columns.flat(), ...lvd.deck, ...(lvd.preplaced || []).flat()]) {   // chỉ chủ đề của level đã mở
    if (!arts[c.t]) { arts[c.t] = new Set(); topics.push(c.t); }
    if (c.k === 'stamp') arts[c.t].add(c.art);
  }
  const al = save.album || {};
  let have = 0, total = 0;
  const rows = topics.map(tp => {
    const all = [...arts[tp]].sort((a, b) => a - b);
    const got = new Set(al[tp] || []);
    have += all.filter(a => got.has(a)).length; total += all.length;
    const cells = all.map(a => got.has(a)
      ? `<div class="al-st"><img src="${artUrl({ t: tp, art: a })}"></div>`
      : `<div class="al-st miss"></div>`).join('');
    return `<div class="al-row"><img class="al-ic" src="${iconUrl(tp)}"><div class="al-info"><b>${topicName(tp)}</b><span>${all.filter(a => got.has(a)).length}/${all.length} · ${t('to_resident', { name: residentOf(tp) })}</span><div class="al-cells">${cells}</div></div></div>`;
  }).join('');
  // L7, L8: tem tuyến (xong 20 trạm) và trang tem mùa (đủ 3 bộ) đứng đầu album, sau Sổ dấu ngày
  const rs = save.routeStamps || [], sp = save.seasonPages || [];
  const extra = (rs.length ? `<div class="al-special"><div class="sb-head">${t('album_route')} · ${rs.length}</div><div class="al-rs">${rs.map(r => { const sc = routeScene(r.k); return `<div class="al-rst"><img src="${sc.postcard}" alt=""><span>${chPlace(sc)}</span></div>`; }).join('')}</div></div>` : '')
    + (sp.length ? `<div class="al-special"><div class="sb-head">${t('album_season')} · ${sp.length}</div><div class="al-rs">${sp.map(x => `<div class="al-sp"><i style="background-image:url(assets/ui/season_all.png)"></i><span>${t('season_' + x.motif)}</span></div>`).join('')}</div></div>` : '')
    + ((save.rareDecor || []).length ? `<div class="al-special"><div class="sb-head">${t('album_rare')} · ${save.rareDecor.length}</div><div class="al-rs">${save.rareDecor.map(x => `<div class="al-sp"><i style="background-image:url(assets/decor/${x.id}.png)"></i><span>${t('decor_rare_' + x.motif)}</span></div>`).join('')}</div></div>` : '');
  $('albumBody').innerHTML = (dailyOn() ? stampBookHtml() : '') + extra + rows;   // L2: trang Sổ dấu ngày đầu album
  $('albumCount').textContent = t('album_count', { n: have, total });
  $('album').classList.remove('off');
  track('album_open', { have, total });
}
$('albumBtn').addEventListener('pointerup', () => { unlockAudio(); sfx('click'); openAlbum(); });
$('decorBtn').addEventListener('pointerup', () => { unlockAudio(); sfx('click'); decorPanel(); });
$('albumClose').addEventListener('pointerup', () => { sfx('close'); $('album').classList.add('off'); });
function outOfMoves(again = false) {
  ended = true;
  if (!again) { sfx('lose'); haptic('deny'); }
  if (!again && dailyRun) track('daily_fail', { day: dailyRun.key, attempt: play.attempt, delivered: S.delivered, total: S.total });
  else if (!again) {
    track('level_fail', { level: levelIdx + 1, attempt: play.attempt, reason: 'out_of_moves', delivered: S.delivered, total: S.total, special: specialOf(L) || '' });
    EV.gentleRecord(save.losses = save.losses || {}, levelIdx + 1, false); persist();   // F11: đếm thua liền ở cùng level
  }
  if (safetyOf(L) === 'retry') {
    // Level khó kiểu "chơi lại miễn phí": không phạt, giữ Ô phụ, vào lại ngay
    track('ad_offer', { level: levelIdx + 1, placement: 'soclose_more' });
    panel({ title: t('soclose'), body: `<p>${t('soclose_body')}</p>`, buttons: [
      { label: t('try_again'), act: () => restartCur() },
      { label: t('more_ad'), cls: 'orange', act: () => fakeAd(() => addMoves(5, true, 'ad'), 'soclose_more') },
    ] });
    return;
  }
  const canFree = !freeMovesUsed;
  const buttons = [];
  if (canFree) {
    track('ad_offer', { level: levelIdx + 1, placement: 'oom_more' });
    buttons.push({ label: t('more_ad'), cls: 'orange', act: () => fakeAd(() => addMoves(5, true, 'ad'), 'oom_more') });
  }
  const short = save.coins < COSTS.moves;
  buttons.push({ cls: short ? 'off' : '', label: t('more_coins', { n: COSTS.moves }) + (short ? `<br><small>${t('coins_need', { n: COSTS.moves - save.coins })}</small>` : ''), act: () => {
    if (save.coins < COSTS.moves) { outOfMoves(true); toast(t('coins_short')); sfx('deny'); return; }
    save.coins -= COSTS.moves; persist(); bumpCoins(); addMoves(5, false, 'coins');
  } });
  buttons.push({ label: t('retry'), cls: 'brown', act: () => restartCur() });
  buttons.push({ label: t('home'), cls: 'brown', act: () => goHome() });
  const tp = topicProgress();
  panel({ title: t('oom_title'), body: `<p>${t('oom_body', { n: tp.total - tp.done })}</p>`, buttons });
}
let stuckMuteUntil = 0;
function stuckPanel() {
  stuckMuteUntil = S.used + S.deck.length + S.waste.length + 1;   // đóng panel rồi rút tiếp: chỉ nhắc lại sau một vòng bộ bài
  track('level_stuck', { level: levelIdx + 1, attempt: play.attempt, delivered: S.delivered, total: S.total, moves_left: S.moves });
  const buttons = [];
  const can = k => save[k] > 0 || save.coins >= COSTS[k];
  const cnt = k => save[k] > 0 ? ` <small>(${save[k]})</small>` : ` <small>(${COSTS[k]} ${t('coin_word')})</small>`;
  if (levelIdx + 1 >= UNLOCK_AT.joker && can('joker')) buttons.push({ label: t('use_joker') + cnt('joker'), cls: 'orange', act: () => { toggleJoker(); } });
  if (levelIdx + 1 >= UNLOCK_AT.pack && can('pack') && S.found.some((_, k) => pullable(k))) buttons.push({ label: t('use_pack') + cnt('pack'), cls: 'orange', act: () => startPick('pack') });
  if (levelIdx + 1 >= UNLOCK_AT.slot && !S.extraSlot) buttons.push({ label: t('extra_slot'), cls: 'orange', act: () => onExtraSlot() });
  if (undoStack.length) buttons.push({ label: t('undo'), act: () => doUndo() });
  buttons.push({ label: t('retry'), cls: 'brown', act: () => restartCur() });
  panel({ title: t('stuck_title'), body: `<p>${t('stuck_body')}</p>`, buttons });
}
function addMoves(n, free = false, source = 'debug') {
  if (free) freeMovesUsed = true;
  play.continues++;
  track('continue_moves', { level: levelIdx + 1, attempt: play.attempt, source, amount: n });
  S.moves += n;
  ended = false;
  sfx('claim');
  floatText(`+${n}`, 110, 200, '#8cff7a');
  updateHUD(true);
  saveRun();
}
// Quảng cáo giả (prototype). placement: chỗ đặt quảng cáo cho analytics (ad_offer -> ad_watch).
function fakeAd(done, placement = 'unknown') {
  const lv = levelIdx + 1;
  const p = panel({ title: t('ad_break'), body: `<p>${t('ad_mock')}</p><p id="adc">2</p>`, buttons: [] });
  let n = 2;
  const timer = setInterval(() => {
    n--;
    const c = p.querySelector('#adc');
    if (c) c.textContent = n;
    if (n <= 0) { clearInterval(timer); closePanel(); track('ad_watch', { level: lv, placement }); done(); }
  }, 700);
}

// ============================================================ lưu và tiếp tục ván dở (R10, review game design v2 #5)
// Một bản lưu duy nhất (ván gần nhất), khoá riêng cạnh save chính nên save cũ của tester không đổi cấu trúc, không cần migration.
// Lưu sau mỗi thao tác và khi app bị ẩn (cuộc gọi đến, khoá màn hình). Không lưu khi đang chạy kịch bản dạy chơi.
// Dữ liệu level đổi (generator sinh lại) thì chữ ký levelSig khác -> bỏ bản lưu, chơi ván mới.
const RESUME_KEY = SAVE_KEY + '_resume';
const RESUME_DAILY_KEY = SAVE_KEY + '_resume_daily';   // Thư hôm nay lưu riêng: chơi Daily không bao giờ đè ván dở chiến dịch
let levelSigCache = null;
function levelSig(lv) {
  const s = JSON.stringify([lv.id, lv.moves, lv.foundations, lv.columns, lv.deck, lv.preplaced || []]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36) + '.' + s.length;
}
const liveCards = st => [...st.deck, ...st.waste, ...st.cols.flat(), ...st.found.filter(Boolean).flatMap(f => [f.topic, ...f.cards])];
const UNDO_KEEP = 10;      // N4: giữ 10 bước hoàn tác gần nhất trong bản lưu (mỗi level có 5 lượt miễn phí)
const packState = st => { const c = E.clone(st); if (c.moves === Infinity) c.moves = 'inf'; return c; };   // JSON không có Infinity
const unpackState = st => E.clone({ ...st, moves: st.moves === 'inf' ? Infinity : st.moves });
function saveRun() {
  if (!levelActive || !S || !L || script || E.isWon(S)) return;
  if (!S.used) return;     // QA N1/N5: chưa đi nước nào thì không lưu (chỉ mở xem rồi thoát không đè ván dở cũ)
  if (!levelSigCache) levelSigCache = levelSig(L);
  const data = { v: 1, lv: L.id, idx: levelIdx, sig: levelSigCache, at: Date.now(), s: packState(S),
    undo: undoStack.slice(-UNDO_KEEP).map(u => ({ s: packState(u.s), combo: u.combo })),
    undoLeft, combo, freeMovesUsed, overtime, lowWarned, play: { ...play, elapsed: Date.now() - play.start },
    ...(dailyRun ? { daily: dailyRun.key, catchup: !!dailyRun.catchup } : {}) };
  try { localStorage.setItem(dailyRun ? RESUME_DAILY_KEY : RESUME_KEY, JSON.stringify(data)); } catch (e) { /* đầy bộ nhớ / chế độ riêng tư: bỏ qua */ }
}
function clearRun() { try { localStorage.removeItem(dailyRun ? RESUME_DAILY_KEY : RESUME_KEY); } catch (e) { /* ignore */ } }
const clearCampaignRun = () => { try { localStorage.removeItem(RESUME_KEY); } catch (e) { /* ignore */ } };
const clearDailyRun = () => { try { localStorage.removeItem(RESUME_DAILY_KEY); } catch (e) { /* ignore */ } };
/** Bản lưu ván dở CHIẾN DỊCH còn dùng được (đúng level, level chưa đổi), hoặc null. */
function loadRun() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(RESUME_KEY) || 'null'); } catch (e) { d = null; }
  if (!d) return null;
  const lv = LEVELS[d.idx];
  if (d.v !== 1 || !lv || lv.id !== d.lv || levelSig(lv) !== d.sig || !d.s || d.idx + 1 > save.unlocked) { clearCampaignRun(); return null; }
  return d;
}
/** Bản lưu ván dở Thư hôm nay của ngày `key`, hoặc null (thư khác ngày / level đổi thì bỏ). */
function loadDailyRun(key) {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(RESUME_DAILY_KEY) || 'null'); } catch (e) { d = null; }
  if (!d) return null;
  const run = dailyFor(LIVE.parseDayKey(d.daily));
  if (d.v !== 1 || !run || run.lv.id !== d.lv || levelSig(run.lv) !== d.sig || !d.s) { clearDailyRun(); return null; }
  return key && d.daily !== key ? null : d;
}
/** Dựng state từ bản lưu, kiểm tra lá khớp với level (không thừa, không trùng). Lỗi thì ném ra -> chơi ván mới. */
function restoreRun(d, lv) {
  const S2 = unpackState(d.s);
  const known = new Set([...lv.columns.flat(), ...lv.deck, ...(lv.preplaced || []).flat()].map(c => c.id));
  const check = st => {
    const seen = new Set();
    for (const c of liveCards(st)) {
      if (seen.has(c.id) || !(known.has(c.id) || /^J\d+$/.test(String(c.id)))) throw new Error('resume: lá lạ ' + c.id);
      seen.add(c.id);
    }
  };
  check(S2);
  if (!Number.isFinite(S2.used) || S2.found.length < lv.foundations || S2.cols.length !== lv.columns.length) throw new Error('resume: state hỏng');
  let undo = [];
  try { undo = (d.undo || []).map(u => ({ s: unpackState(u.s), combo: u.combo || 0 })); undo.forEach(u => check(u.s)); } catch (e) { undo = []; }
  return { S: S2, undo, undoLeft: d.undoLeft ?? 5, combo: d.combo || 0, freeMovesUsed: !!d.freeMovesUsed, overtime: !!d.overtime, lowWarned: !!d.lowWarned,
    play: { boosters: 0, undo: 0, rescues: 0, continues: 0, taps: 0, drags: 0, ...d.play, elapsed: Math.max(0, d.play && d.play.elapsed || 0) } };
}
/** Vào level i từ màn hình chính: có ván dở của đúng level đó thì hỏi chơi tiếp hay ván mới.
 *  QA N1: có ván dở ở level KHÁC thì hỏi trước. Chọn mở level mới thì ván cũ vẫn giữ cho tới nước đi đầu của level mới
 *  (saveRun bỏ qua ván chưa đi nước nào), nên chỉ mở xem rồi thoát cũng không mất gì. */
function playLevel(i) {
  const run = loadRun();
  if (run && run.idx === i) askResume(run);
  else if (run) {
    track('resume_conflict_open', { level: i + 1, saved_level: run.idx + 1, moves_used: run.s.used });
    panel({ title: t('resume_title'), body: `<p>${t('resume_conflict', { n: run.idx + 1, m: i + 1 })}</p>`, buttons: [
      { label: t('play_resume', { n: run.idx + 1 }), act: () => { track('resume_conflict_choice', { level: i + 1, choice: 'resume' }); startLevel(run.idx, { resume: run }); } },
      { label: t('resume_conflict_new', { n: i + 1 }), cls: 'brown', act: () => { track('resume_conflict_choice', { level: i + 1, choice: 'new' }); startLevel(i); } },
    ] });
  } else startLevel(i);
}
function askResume(run) {
  panel({
    title: t('resume_title'),
    body: `<p>${t('resume_body', { n: run.idx + 1 })}</p><p style="font-size:${fs(42)};margin:0">${t('resume_free')}</p>`,
    buttons: [
      { label: t('resume_yes'), act: () => startLevel(run.idx, { resume: run }) },
      { label: t('resume_new'), cls: 'brown', act: () => { track('level_resume_decline', { level: run.idx + 1, moves_used: run.s.used }); clearCampaignRun(); startLevel(run.idx); } },
    ],
  });
}
// Đứng yên lâu giữa ván (R12/M8): ghi 1 lần cho mỗi đợt đứng yên > IDLE_S giây (?idle=<giây> để test, mặc định 30).
// Thời gian panel mở / chưa vào ván không tính là đứng yên.
const IDLE_S = (() => { const m = location.search.match(/[?&]idle=(\d+)/); return m ? Math.max(1, +m[1]) : 30; })();
let lastInputAt = performance.now(), idleLogged = false;
stage.addEventListener('pointerdown', () => { lastInputAt = performance.now(); idleLogged = false; }, true);
setInterval(() => {
  const now = performance.now();
  if (!levelActive || panelOpen || ended || busyInput || !S || document.hidden) { lastInputAt = now; idleLogged = false; return; }
  const idle = now - Math.max(lastInputAt, lastActAt);
  if (idle >= IDLE_S * 1000 && !idleLogged) {
    idleLogged = true;
    track('idle_long', { level: levelIdx + 1, s: Math.round(idle / 1000), moves_used: S.used });
  }
}, Math.min(5000, IDLE_S * 500));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  saveRun();
  if (levelActive && S) track('app_hidden', { level: levelIdx + 1, moves_used: S.used, time_s: Math.round((Date.now() - play.start) / 1000) });
});
addEventListener('pagehide', () => saveRun());

/** Chơi lại ván đang chơi (chiến dịch hoặc Thư hôm nay). */
function restartCur() { if (dailyRun) startDaily(dailyRun.day); else startLevel(levelIdx); }
const curTitle = () => (dailyRun ? t('daily_title') : t('level', { n: levelIdx + 1 }));
function trackQuit(extra = {}) {
  const base = { attempt: play.attempt, moves_used: S.used, delivered: S.delivered, total: S.total, time_s: Math.round((Date.now() - play.start) / 1000), ...extra };
  if (dailyRun) track('daily_quit', { day: dailyRun.key, ...base }); else track('level_quit', { level: levelIdx + 1, ...base });
}
// ============================================================ level flow
// resume: bản lưu ván dở (loadRun) của đúng level i -> dựng lại bàn y như lúc dừng, không tính lượt chơi mới
// daily: { key, day, lv, catchup, replay } -> chơi Thư hôm nay (L2). levelIdx giữ ở level hiện tại của người chơi để mọi cổng
// mở khoá (booster, Ô phụ, mẹo) giống chiến dịch; số level, tiến độ, Tem Điểm của chiến dịch không đổi.
async function startLevel(i, { resume = null, daily = null } = {}) {
  endWin();
  closePanel(true);
  setMusicScene('play');
  if (levelActive && L && S) trackQuit();
  const prevKey = L ? runKey() : null;
  const nextIdx = daily ? Math.max(0, Math.min(LEVELS.length, save.unlocked) - 1) : Math.max(0, Math.min(LEVELS.length - 1, i));
  levelIdx = nextIdx;
  dailyRun = daily;
  levelToken++;
  clearParticles();
  completing.clear();
  L = daily ? daily.lv : LEVELS[levelIdx];
  if (prevKey !== runKey()) extraKept = -1;
  levelSigCache = null;
  let restored = null;
  if (resume) { try { restored = restoreRun(resume, L); } catch (e) { restored = null; } }
  if (!restored) {      // ván mới / chơi lại cùng level: bỏ bản lưu cũ
    if (daily) { const old = loadDailyRun(daily.key); if (old) clearDailyRun(); }
    else { const old = loadRun(); if (old && old.idx === levelIdx) clearCampaignRun(); }
  }
  S = restored ? restored.S : E.createState(L);
  // F6 (L4): quà Chào mừng quay lại +5 nước cho level chiến dịch đầu tiên chơi sau khi nhận (không áp cho Thư hôm nay, ván dở)
  let welcomeMoves = 0;
  if (!restored && !daily && L.moves != null && save.welcomeMoves > 0) {
    welcomeMoves = save.welcomeMoves; S.moves += welcomeMoves; save.welcomeMoves = 0; persist();
    track('welcome_moves_used', { level: levelIdx + 1, moves: welcomeMoves });
  }
  // F11 (L10) Thử lại nhẹ tay: thua 2 lần liền ở cùng level thường (từ L11) -> lần này +3 nước và 1 lá đầu bộ bài lật sẵn
  let gentle = false;
  if (!restored && !daily && L.moves != null && EV.gentleOn(save.losses || {}, levelIdx + 1, { special: !!specialOf(L) })) {
    gentle = true;
    S.moves += EV.GENTLE.moves;
    if (S.deck.length) { const c = S.deck.pop(); c.up = true; S.waste.push(c); }
    track('gentle_retry', { level: levelIdx + 1, losses: save.losses.n, moves: EV.GENTLE.moves });
  }
  // E2 Tem theo mùa (L8): 1 lá mang dấu tem mùa (Thư hôm nay luôn có, chiến dịch khoảng một nửa), chọn tất định
  seasonCard = null; seasonKey = daily ? 'D' + daily.key : 'L' + L.id;
  { const es = evState(); if (es.cur && es.cur.id === 'season') seasonCard = EV.seasonCardFor(L, es.cur.k, es.s, seasonKey); }
  undoStack = restored ? restored.undo : [];
  undoLeft = restored ? restored.undoLeft : 5;   // người lớn tuổi đi sai nhiều hơn: 5 lần hoàn tác miễn phí mỗi level
  combo = restored ? restored.combo : 0;
  ended = false;
  pending = [];
  freeMovesUsed = restored ? restored.freeMovesUsed : false;
  jokerMode = false;
  tutorial = null;
  script = null;
  pickMode = null;
  lastMovesShown = null;
  lowWarned = restored ? restored.lowWarned : false;
  tipGate = { used: -99, t: 0, count: 0 };
  stuckMuteUntil = 0;
  deferredIntro = false;
  introHold = null;
  lastDelivered = null;
  overtime = restored ? restored.overtime : false;
  jokerFree = false;
  movesEl.classList.toggle('overtime', overtime);
  jokerSeq = 0;
  if (restored) {
    // id Tem Vàng đã đặt: J1, J2... -> đặt tiếp không trùng id
    for (const c of liveCards(S)) { const m = /^J(\d+)$/.exec(String(c.id)); if (m) jokerSeq = Math.max(jokerSeq, +m[1]); }
    if (S.extraSlot) extraKept = runKey();
    play = { ...restored.play, start: Date.now() - restored.play.elapsed };
    delete play.elapsed;
  } else {
    const ak = daily ? L.id : levelIdx + 1;
    save.attempts = save.attempts || {};
    save.attempts[ak] = (save.attempts[ak] || 0) + 1;
    persist();
    play = { start: Date.now(), attempt: save.attempts[ak], boosters: 0, undo: 0, rescues: 0, continues: 0, taps: 0, drags: 0 };
  }
  levelActive = true;
  document.body.classList.toggle('hard', !!specialOf(L));
  if (daily) track(restored ? 'daily_resume' : 'daily_start', { day: daily.key, attempt: play.attempt, catchup: !!daily.catchup, replay: !!daily.replay, src: L.src, moves: L.moves });
  else if (restored) track('level_resume', { level: levelIdx + 1, attempt: play.attempt, moves_used: S.used, moves_left: S.moves === Infinity ? -1 : S.moves,
    delivered: S.delivered, total: S.total, away_s: Math.round((Date.now() - resume.at) / 1000), overtime, special: specialOf(L) || '' });
  else track('level_start', { level: levelIdx + 1, attempt: play.attempt, moves: L.moves ?? -1, special: specialOf(L) || '', safety: safetyOf(L), src: L.source || 'base' });
  clearHint();
  tut(null);
  $('home').classList.add('off');
  updateHUD();
  const token = levelToken;
  const pre = (L.preplaced || []).flat();
  const allCards = [...L.columns.flat(), ...L.deck, ...pre];
  const topics = [...new Set(allCards.map(c => c.t))];
  await preload(allCards.filter(c => c.k === 'stamp').map(artUrl).concat(topics.map(lineIconUrl)));
  if (token !== levelToken) return;
  setCardScale();
  // thứ tự chủ đề cố định theo dữ liệu level (deck + cột), để mỗi lần chơi lại màu khung không đổi
  faceOfTopic = new Map();
  [...L.columns.flat(), ...L.deck, ...(L.preplaced || []).flat()].forEach(c => faceIndex(c));
  buildChrome();
  if (restored) {
    // ván dở: lá ở bộ bài, lá đã rút và lá trong ô hiện ngay tại chỗ; lá trên cột được chia lại như đầu ván
    for (const c of liveCards(S)) makeView(c);
    const T0 = computeLayout();
    for (const c of [...S.waste, ...S.found.filter(Boolean).flatMap(f => [f.topic, ...f.cards])]) {
      const v = views.get(c.id); const t = T0.get(c.id); v.x = t.x; v.y = t.y; setZ(v, t.z); setUp(v, true, { animate: false }); applyTransform(v);
    }
  } else {
    for (const c of [...L.deck, ...L.columns.flat()]) makeView(c);
    // lá trong ô mở sẵn: hiện ngay tại ô
    const T0 = computeLayout();
    for (const c of pre) { const v = makeView(c); const t = T0.get(c.id); v.x = t.x; v.y = t.y; setZ(v, t.z); setUp(v, true, { animate: false }); applyTransform(v); }
    if (extraKept === runKey()) E.addExtraSlot(S);        // Ô phụ đã mua ở lượt trước của level này vẫn giữ khi Retry
  }
  updateHUD();
  updateSlotLabels();
  updateDeckUI();
  busyInput = true;
  // chia bài
  const T = computeLayout();
  for (const c of S.deck) { const v = views.get(c.id); const t = T.get(c.id); v.x = t.x; v.y = t.y; setZ(v, t.z); applyTransform(v); }
  const order = [];
  const maxLen = Math.max(...S.cols.map(c => c.length));
  for (let j = 0; j < maxLen; j++) S.cols.forEach(col => { if (col[j]) order.push(col[j]); });
  for (const c of order) { const v = views.get(c.id); v.x = DECK_X; v.y = ROW_A; setZ(v, 1000); applyTransform(v); }
  const bannerDone = levelBanner();
  // level khó: chờ banner xong mới chia bài, để hai chuyển động không tranh nhau
  if (specialOf(L)) await bannerDone; else await wait(350);
  order.forEach((c, k) => {
    const v = views.get(c.id);
    const t = T.get(c.id);
    setTimeout(() => {
      setZ(v, 1500 + k);
      if (k % 3 === 0) sfx('draw', { vol: 0.35, rate: 1.1 + Math.random() * 0.2 });
      moveView(v, t, { dur: 300, easing: ease.outCubic, arc: 40 }).then(() => setZ(v, t.z));
      if (t.up) setUp(v, true, { delay: 220 });
    }, k * 38);
  });
  await wait(order.length * 38 + 420);
  if (token !== levelToken) return;
  busyInput = false;
  relayout({ dur: 120 });
  if (welcomeMoves) toast(t('wb_toast', { n: welcomeMoves }), 1800);
  else if (gentle) toast(t('gentle_toast'), 1800);
  if (L.moves != null && !save.seen.rules) {
    save.seen.rules = 1;
    persist();
    await bannerDone;
    if (token !== levelToken) return;
    await new Promise(res => showRules(res, 'first_level'));
  }
  if (token !== levelToken) return;
  await bannerDone;
  if (token !== levelToken) return;
  await featureIntro();
  if (token !== levelToken) return;
  if (restored) {
    // ván dở đã hết nước lúc dừng: mở lại bảng "Hết nước" (không phát lại tiếng thua, không ghi level_fail lần nữa)
    if (S.moves <= 0 && safetyOf(L) !== 'overtime') outOfMoves(true);
    else { afterAction(); if (!ended) { tutorialCheck(); resetIdleHint(); } }
    return;
  }
  if (L.script && !save.seen['script_' + L.id]) { script = { steps: L.script, i: 0 }; runScript(); return; }
  // Câu đầu level: chủ đề mới (introduce) và/hoặc biến thể cấu trúc của level sinh (tip: 3 quầy, bao thư lớn, quầy mở sẵn;
  // plan mục 3.4). Cờ "đã xem" chỉ ghi ở nước đi đầu (releaseIntro): thoát trước nước đầu thì lần sau vẫn thấy (QA N7).
  const intro = L.introduce && L.introduce.length && !save.seen['intro_' + L.id];
  const tipKey = L.tip && !save.seen['ltip_' + L.tip] ? L.tip : null;
  if (intro || tipKey) {
    const parts = [];
    if (intro) parts.push(t('new_topic', { names: L.introduce.map(tp => `<b>${topicName(tp)}</b>`).join(', ') }));
    if (tipKey) parts.push(t('ltip_' + tipKey));
    tut(parts.join('<br>'), 0); sfx('feature', { vol: 0.5 });
    introHold = { html: $('tut').innerHTML, t0: Date.now(), token, flags: [...(intro ? ['intro_' + L.id] : []), ...(tipKey ? ['ltip_' + tipKey] : [])],
      redo: () => [intro && t('new_topic', { names: L.introduce.map(tp => `<b>${topicName(tp)}</b>`).join(', ') }), tipKey && t('ltip_' + tipKey)].filter(Boolean).join('<br>') };     // giữ tới nước đi đầu tiên (review #9)
    if (intro) track('topic_intro', { level: levelIdx + 1, topics: L.introduce.join(',') });
    if (tipKey) track('level_tip', { level: levelIdx + 1, tip: tipKey });
  }
  tutorialCheck();
  resetIdleHint();
}
// Câu "Tem mới: ..." đầu level: không tự tắt, ẩn sau nước đi đầu tiên (nhưng hiện ít nhất TIP_MIN_MS)
let introHold = null;
function releaseIntro() {
  const h = introHold;
  introHold = null;
  if (!h) return;
  if (h.flags && h.flags.length) { for (const f of h.flags) save.seen[f] = 1; persist(); }
  setTimeout(() => {
    if (h.token === levelToken && $('tut').innerHTML === h.html) tut(null);
    if (!script && !ended && h.token === levelToken) tutorialCheck();   // tip đã nhường chỗ cho câu này thì giờ mới được hiện
  }, Math.max(0, TIP_MIN_MS - (Date.now() - h.t0)));
}
let bannerEl = null;
function removeBanner() { if (bannerEl) { bannerEl.remove(); bannerEl = null; } }
function levelBanner() {
  removeBanner();
  const tp = topicProgress();
  const el = document.createElement('div');
  bannerEl = el;
  const sp = specialOf(L);
  el.innerHTML = (sp ? `<div class="hard-pill">${t(sp === 'superhard' ? 'superhard' : 'hard')}</div>` : '') + `<div style="font-size:${fs(dailyRun ? 96 : 110)};line-height:1">${curTitle()}</div>${dailyRun ? `<div style="font-size:${fs(44)};margin-top:8px">${dailyDateText(dailyRun.day)}</div>` : ''}
    <div style="margin-top:22px;display:inline-block;max-width:960px;padding:14px 34px;border-radius:30px;background:rgba(0,0,0,.25);font-size:${fs(48)}">
      ${t('goal', { n: tp.total - tp.done, moves: L.moves == null ? t('goalInf') : t('goalMoves', { n: L.moves }) })}</div>${sp ? `<div class="hard-calm" style="margin-top:16px;font-size:${fs(44)}">${t('hard_calm')}</div>` : ''}`;
  el.style.cssText = `position:absolute;left:0;right:0;top:${660 + (STAGE_H - 1920) / 2}px;padding:40px 0 46px;text-align:center;color:#fff;background:rgba(50,32,20,.55);
    text-shadow:0 5px 0 #5a3a26,3px 0 0 #5a3a26,-3px 0 0 #5a3a26,0 -3px 0 #5a3a26;z-index:4000;pointer-events:none`;
  overlay.append(el);
  const calm = reduceMotion();                     // giảm chuyển động: chỉ hiện/ẩn bằng mờ, không bật nảy
  const o = calm ? { y: 0, a: 0, s: 1 } : { y: -60, a: 0, s: 0.6 };
  const draw = () => { el.style.transform = `translateY(${o.y}px) scale(${o.s})`; el.style.opacity = o.a; };
  draw();
  if (sp) sfx('feature', { vol: 0.4, rate: 0.9 });   // R11: bỏ tiếng boom và rung ở banner level khó, chỉ một tiếng chuông nhỏ
  return tween(o, { y: 0, a: 1, s: 1 }, { dur: calm ? 250 : 380, easing: calm ? ease.linear : ease.outBack, onUpdate: draw })
    .then(() => wait(sp ? 2300 : 1700))
    .then(() => tween(o, { y: calm ? 0 : -40, a: 0 }, { dur: 260, onUpdate: draw }))
    .then(() => { el.remove(); if (bannerEl === el) bannerEl = null; });
}
// Luật thắng/thua (game gốc chỉ có vài câu ở level 1; mình làm rõ hơn): hiện ở level đầu có moves và trong Pause.
// Bảng luật bằng hình: 4 dòng, mỗi dòng <= 7 từ, kèm hình lá bài thật (show, don't tell).
function rulesHtml() {
  // hình minh hoạ ghép từ chính sprite trong game (lá vương miện Cat, tem mèo, phong bì, ô MOVES)
  const box = inner => `<div style="position:relative;flex:0 0 96px;height:124px">${inner}</div>`;
  const crownCard = box(`<div style="position:absolute;inset:0;background:url(assets/ui/topic_frame.png) center/100% 100%"></div>
    <img src="${lineIconUrl('Cat')}" style="position:absolute;left:20px;top:30px;width:56px;height:56px">
    <div style="position:absolute;left:30px;top:-12px;width:36px;height:34px;background:url(assets/ui/crown.png) center/contain no-repeat"></div>`);
  const stampCard = box(`<div style="position:absolute;inset:0;background:url(assets/ui/face_3.png) center/100% 100%"></div>
    <img src="assets/cards/cat/5.png" style="position:absolute;left:12px;top:16px;width:72px;height:72px">`);
  const env = box(`<div style="position:absolute;inset:8px 0;background:url(assets/ui/envelope_closed.png) center/contain no-repeat"></div>
    <div style="position:absolute;left:30px;top:40px;width:36px;height:42px;background:url(assets/ui/wax.png) center/contain no-repeat"></div>`);
  const moves = box(`<div style="position:absolute;inset:0;background:url(assets/ui/hud_moves.png) center/100% 100%"></div>
    <div style="position:absolute;left:0;right:0;top:46px;text-align:center;font-size:44px;color:#4a2a1a">12</div>`);
  const undo = box(`<div style="position:absolute;left:4px;top:14px;width:88px;height:88px;background:url(assets/ui/btn_undo.png) center/contain no-repeat"></div>`);
  const row = (fig, txt) => `<div style="display:flex;align-items:center;gap:24px;margin:0 0 14px;text-align:left">${fig}
    <div style="flex:1;min-width:0;font-size:${fs(44)};line-height:1.2;color:#5a3a26">${txt}</div></div>`;
  return `<div>${row(crownCard, t('r1'))}${row(stampCard, t('r2'))}${row(env, t('r3'))}${row(moves, t('r4'))}${row(undo, t('r6'))}
    <p style="font-size:${fs(42)};margin:4px 0 0">${t('r5')}</p></div>`;
}
function showRules(onClose, via = 'pause') {
  track('rules_open', { level: levelIdx + 1, via });
  panel({ title: t('howto'), body: rulesHtml(), buttons: [{ label: t('got_it'), act: () => onClose && onClose() }] });
}
let deferredIntro = false;
function featureIntro(force = false) {
  const u = L.unlock;
  if (!u || save.seen['unlock_' + u]) return Promise.resolve();
  // Hint ở L2: đừng dồn ngay sau bảng luật; giới thiệu sau vài nước, lúc người chơi bắt đầu cần
  if (u === 'hint' && !force) { deferredIntro = true; return Promise.resolve(); }
  deferredIntro = false;
  clearHint();
  save.seen['unlock_' + u] = 1;
  const icons = { hint: 'assets/ui/ic_hint.png', pack: 'assets/ui/ic_magnet.png', stamper: 'assets/ui/ic_stamper.png', joker: 'assets/ui/joker_card.png' };
  const info = { title: t('booster', { name: t('b_' + u) }), icon: icons[u], text: t('bi_' + u), name: t('b_' + u) };
  save[u] = (save[u] || 0) + GIFTS[u];
  persist();
  renderBoosters();
  sfx('feature');
  return new Promise(res => {
    panel({
      title: info.title, radial: true,
      body: `<div class="feature-icon" style="background-image:url(${info.icon})"></div><p>${info.text}</p><h3>${t('free_n', { n: GIFTS[u] })}</h3>`,
      buttons: [{ label: t('claim'), act: () => {
        updateHUD();
        if (L.script) { res(); return; }          // kịch bản ép bước sẽ tự chỉ tay
        // chỉ bàn tay, không thêm chữ: popup vừa giải thích rồi, nhường lượt gợi ý cho khái niệm của level
        { const c = boosterCenter(u); handTap(c.r, c.y, { side: true }); }
        setTimeout(() => { hideHand(); res(); }, 1800);
      } }],
    });
  });
}

// ============================================================ Thư hôm nay + Sổ dấu ngày (L2, liveops-30-days.md F1, F2)
// Mở khi đã thắng L5 (bảng mục 2: "theo level đã thắng"). Mỗi ngày lịch (giờ máy, chống lùi giờ) 1 lá thư. Thắng lần đầu:
// 40 xu + 1 dấu ngày. Chơi lại: không thưởng. Thua: chơi lại không mất gì. Chơi bù được thư hôm qua (1 ngày): 20 xu + dấu.
// Sổ dấu ngày: trang 20 ô, đầy trang thì 150 xu + 1 decor kỷ niệm (art rare_postbox chưa có: hiện con dấu sáp thay thế).
// Không có chữ "mất chuỗi", không đếm ngược, không hết hạn (mục 10 "Không FOMO").
const DAILY_REWARD = CONF.daily;                 // L13: liveops.json rewards.daily
const STAMP_PAGE = CONF.daily.page_size;
let dailyPool = null;
const getDailyPool = () => (dailyPool = dailyPool || buildDailyPool({ daily: LEVELS_DAILY, campaign: LEVELS }));
function dailySave() {
  const D = save.daily = save.daily || {};
  D.won = D.won || {}; D.hist = D.hist || {}; D.stamps = D.stamps || [];
  D.pages = D.pages || 0; D.keepsakes = D.keepsakes || 0;
  return D;
}
const wonLevel = () => Math.max(0, Math.min(save.unlocked, LEVELS.length + 1) - 1);
const dailyOn = () => !EV.KILL.daily && LIVE.featureOn('daily', wonLevel()) && getDailyPool().length > 0;
const today = () => LIVE.effectiveDay(save.live);
/** Lá thư của ngày `day`: { key, day, lv, src }, hoặc null. Đã mở thư ngày đó thì giữ đúng lá cũ (pickDaily đọc hist). */
function dailyFor(day) {
  if (!Number.isFinite(day)) return null;
  const cur = curLevel();
  const e = pickDaily(getDailyPool(), day, dailySave().hist, x => !x.tuned && x.lv.id >= cur && x.lv.id < cur + 10);
  if (!e) return null;
  const key = LIVE.dayKey(day);
  return { key, day, src: e.src, lv: dailyLevel(e, key) };
}
/** Ngày chơi bù được: hôm qua, chưa thắng, không trước ngày cài app. */
function catchupDay() {
  const D = dailySave(), y = today() - 1;
  return y >= (save.live.firstOpenDay ?? y) && !D.won[y] ? y : null;
}
function dailyDateText(day) {
  const d = new Date(day * 864e5);
  const m = d.getUTCMonth(), dd = d.getUTCDate();
  return getLang() === 'vi' ? `${dd}/${m + 1}` : `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]} ${dd}`;
}
function startDaily(day, { resume = null } = {}) {
  const run = dailyFor(day);
  if (!run) return;
  const D = dailySave();
  if (!D.hist[day]) { D.hist[day] = run.src; persist(); }
  run.catchup = day < today();
  run.replay = !!D.won[day];
  startLevel(0, { daily: run, resume });
}
/** Các ô của trang Sổ dấu ngày đang mở (trang đầy thì sang trang mới). */
function stampBookHtml({ compact = false } = {}) {
  const D = dailySave();
  const n = D.stamps.length, inPage = n % STAMP_PAGE, page = Math.floor(n / STAMP_PAGE) + 1;
  const from = n - inPage;
  // panel Thư hôm nay: chỉ 1 dòng tiến độ (panel đã có Thẻ tuần, cả trang 20 ô làm nút Mở thư tụt khỏi màn 375). Trang đầy đủ ở Album.
  if (compact) return `<div class="sb compact"><div class="sb-head">${t('book_title')} · ${t('book_page', { n: page })} · ${inPage}/${STAMP_PAGE}</div>
    <span class="ch-bar sb-bar"><b style="width:${Math.round(100 * inPage / STAMP_PAGE)}%"></b></span></div>`;
  const cells = Array.from({ length: STAMP_PAGE }, (_, i) => {
    const day = D.stamps[from + i];
    return day != null ? `<div class="sb-cell on"><span>${dailyDateText(day)}</span></div>` : '<div class="sb-cell"></div>';
  }).join('');
  const keep = D.keepsakes ? `<div class="sb-keep"><i></i>${t('keepsake_name')} · ${t('book_keepsakes', { n: D.keepsakes })}</div>` : '';
  return `<div class="sb"><div class="sb-head">${t('book_title')} · ${t('book_page', { n: page })} · ${inPage}/${STAMP_PAGE}</div><div class="sb-grid">${cells}</div>${keep}</div>`;
}
function dailyPanel(source = 'home') {
  if (!dailyOn()) return;
  LIVE.touch(save.live); persist();
  const D = dailySave(), td = today();
  const won = !!D.won[td];
  const run = loadDailyRun(LIVE.dayKey(td));
  const cu = catchupDay();
  const cuRun = cu != null ? loadDailyRun(LIVE.dayKey(cu)) : null;
  track('daily_open', { source, day: LIVE.dayKey(td), won, catchup: cu != null, stamps: D.stamps.length });
  const buttons = [];
  if (!won) buttons.push({ label: run ? t('daily_continue') : t('daily_play'), act: () => startDaily(td, { resume: run }) });
  if (cu != null) buttons.push({ label: t('daily_catchup', { n: DAILY_REWARD.catchup }), cls: won ? '' : 'brown', act: () => startDaily(cu, { resume: cuRun }) });
  if (won) buttons.push({ label: t('daily_replay'), cls: 'brown', act: () => startDaily(td) });
  buttons.push({ label: t('close'), cls: 'orange', act: () => refreshHome() });
  panel({ title: t('daily_title'), kind: 'tall daily',
    body: `<div class="postmark${won ? ' done' : ''}"><b>${dailyDateText(td)}</b><small>${t('daily_word')}</small></div>
      <p>${won ? t('daily_done') : t('daily_body', { n: DAILY_REWARD.today })}</p>${weeklyHtml()}${stampBookHtml({ compact: true })}`,
    buttons });
}
/** Lần đầu thấy nút Thư hôm nay: 1 popup (1 câu, 1 hình, 1 nút "Xem"), theo luật mở khoá mục 2. Gọi qua hàng đợi homePopups. */
// Popup "Tính năng mới" theo bảng mở khoá (mục 2): mỗi thứ 1 lần, tối đa 1 popup mỗi phiên (hàng đợi homePopups).
// Event chỉ giới thiệu khi đang chạy và đủ level (L12 Tuyến đưa thư, L20 Tem theo mùa, L30 Tuần việc vặt).
const FEATURE_POPS = [
  { id: 'daily', due: () => dailyOn(), icon: () => 'assets/ui/ic_daily.png', text: 'daily_intro', open: () => dailyPanel('intro') },
  { id: 'route', due: () => evActive('route'), icon: () => 'assets/ui/ic_event.png', text: 'route_intro', open: () => eventPanel('route') },
  { id: 'mailbag', due: () => !EV.KILL.mailbag && LIVE.featureOn('mailbag', wonLevel()), icon: () => 'assets/ui/mailbag_full.png', text: 'bag_intro', open: null },
  { id: 'season', due: () => evActive('season'), icon: () => motifUrl(), text: 'season_intro', open: () => eventPanel('season') },
  { id: 'errands', due: () => evActive('errands'), icon: () => 'assets/decor/chalk_board.png', text: 'errands_intro', open: () => eventPanel('errands') },
];
const featureNext = () => FEATURE_POPS.find(f => !save.seen['feat_' + f.id] && f.due());
const featureDue = () => !!featureNext();
function dailyIntro() {
  const f = featureNext();
  if (!f || panelOpen) return false;
  save.seen['feat_' + f.id] = 1; persist();
  track('feature_unlock', { feature: f.id, level: wonLevel() });
  sfx('feature');
  panel({ title: t('feat_new'), radial: true,
    body: `<div class="feature-icon" style="background-image:url(${f.icon()})"></div><p>${t(f.text)}</p>`,
    buttons: [{ label: f.open ? t('feat_see') : t('got_it'), act: () => { if (f.open) f.open(); } }] });
  return true;
}
// ============================================================ L3: Thẻ tuần 5/7 (F3)
// Tuần lịch Thứ Hai–Chủ nhật, mỗi ngày có Thư hôm nay đã giao đóng 1 ô (thư hôm qua chơi bù đóng ô hôm qua). Đủ 5 ô thì hộp mở
// ngay lúc thắng (không đợi Chủ nhật): 1 Gợi ý, 1 Nam châm, 100 xu. Tuần mới thẻ mới. Không có chữ "mất chuỗi".
function weekly(day = today()) { save.weekly = save.weekly || {}; return LIVE.weeklyCard(dailySave().won, day, save.weekly); }
function weeklyHtml() {
  if (EV.KILL.weekly) return '';
  const w = weekly(), td = today(), names = t('wd_short').split(',');
  const cells = w.days.map((d, i) => `<div class="wk-cell${w.cells[i] ? ' on' : ''}${d === td ? ' today' : ''}"><b></b>${names[i]}</div>`).join('');
  return `<div class="wk-card${w.claimed ? ' done' : ''}"><div class="wk-head">${t('weekly_title')} · ${Math.min(w.count, w.need)}/${w.need}</div>
    <div class="wk-row">${cells}</div><div class="wk-note">${w.claimed ? t('weekly_done') : t('weekly_note')}</div></div>`;
}
/** Phần quà dạng chip có icon (phong bì quà, hộp tuần). */
function giftChips(r) {
  const chip = (icon, txt) => `<div class="gift-chip"><i style="background-image:url(${icon})"></i>${txt}</div>`;
  const out = [];
  if (r.coins) out.push(chip('assets/ui/coin.png', `+${r.coins}`));
  if (r.hint) out.push(chip('assets/ui/ic_hint.png', `${t('b_hint')} +${r.hint}`));
  if (r.pack) out.push(chip('assets/ui/ic_magnet.png', `${t('b_pack')} +${r.pack}`));
  if (r.stamper) out.push(chip('assets/ui/ic_stamper.png', `${t('b_stamper')} +${r.stamper}`));
  if (r.joker) out.push(chip('assets/ui/ic_wild.png', `${t('b_joker')} +${r.joker}`));
  if (r.moves) out.push(chip('assets/ui/plus.png', t('wb_moves', { n: r.moves })));
  if (r.stamp || r.routeStamp) out.push(chip('assets/ui/ic_album.png', t('route_stamp')));
  if (r.page || r.seasonPage) out.push(chip('assets/ui/season_all.png', t('season_page')));
  if (r.rare || r.rareDecor) { const m = motifNow(); out.push(chip(`assets/decor/${EV.SEASON.rare_decor[m]}.png`, t('decor_rare_' + m))); }
  return `<div class="gift-list">${out.join('')}</div>`;
}
/** Nút Thư hôm nay trên màn chính: ẩn trước khi mở khoá, chấm đỏ khi chưa giao thư hôm nay, dấu tích khi đã giao, huy hiệu Thẻ tuần n/5. */
function refreshDailyBtn() {
  const b = $('dailyBtn');
  if (!b) return;
  const on = dailyOn();
  b.classList.toggle('off', !on);
  if (!on) return;
  const won = !!dailySave().won[today()];
  b.classList.toggle('new', !won);
  b.classList.toggle('done', won);
  b.querySelector('.lbl').textContent = t('daily_btn');
  const w = weekly(), wk = b.querySelector('.wk');
  wk.classList.toggle('on', !EV.KILL.weekly && (w.count > 0 || w.claimed));
  wk.classList.toggle('full', w.claimed);
  wk.textContent = `${Math.min(w.count, w.need)}/${w.need}`;
}
// ============================================================ L5: ô Event (điểm chạm 3)
// Event lớn E1/E2/E4 làm ở L7–L9. Mỗi vòng sau đăng ký vào EVENT_UI[id] = { progress() -> {p, n}, open() }.
// Trạng thái: ẩn (chưa qua L5, hoặc ngoài cửa sổ event); mờ "Mở ở Level N" (trong cửa sổ, chưa đủ level; không phải nút);
// mờ "Sắp có" (đủ level nhưng event chưa làm xong, không phải nút); sáng (icon, vạch tiến độ, bấm được, tính là điểm chạm).
const EVENT_UI = {};
function refreshEventTile() {
  const el = $('eventTile');
  const won = wonLevel();
  const st = LIVE.liveState(save.live, LIVE.nowMs(), won);
  const id0 = st.big || st.bigPending;
  const id = id0 && !EV.KILL[id0] ? id0 : null;            // L13: kill_switch.<event> = true -> ô Event trống trong cửa sổ đó
  const ui = id && st.big && EVENT_UI[st.big];
  const show = !!id && LIVE.featureOn('daily', won);      // không function meta nào trước L5 (mục 2 quy tắc 1)
  el.classList.toggle('off', !show);
  el.classList.toggle('on', !!(show && ui));
  el.classList.toggle('dim', !!(show && !ui));
  if (show && ui) { el.dataset.touch = 'event'; el.setAttribute('role', 'button'); } else { delete el.dataset.touch; el.removeAttribute('role'); }
  el.dataset.event = show ? id : '';
  if (!show) return;
  el.querySelector('.lbl').textContent = t('ev_' + id);
  const ev = LIVE.BIG_EVENTS.find(e => e.id === id);
  el.querySelector('i').style.backgroundImage = `url(${{ route: 'assets/ui/ic_event.png', season: motifUrl(), errands: 'assets/decor/chalk_board.png' }[id]})`;
  let pr = null;
  if (ui) pr = ui.progress();
  el.querySelector('.sub').textContent = st.big ? (ui ? `${pr.p}/${pr.n}` : t('ev_soon')) : t('ev_opens', { n: ev.minLevel });
  if (pr) el.querySelector('.ev-bar b').style.width = `${Math.round(100 * pr.p / Math.max(1, pr.n))}%`;
  el.classList.toggle('new', !!(ui && ui.dot && ui.dot()));      // có mốc quà chờ nhận: chấm đỏ (không đếm ngược)
}
$('eventTile').addEventListener('pointerup', () => {
  const id = $('eventTile').dataset.event, ui = EVENT_UI[id];
  if (!ui || !$('eventTile').classList.contains('on')) return;
  unlockAudio(); sfx('click'); ui.open();
});
// ============================================================ L3, L4: Thư buổi sáng (F4), Chào mừng quay lại (F6), phong bì quà gộp
// Quà event đã qua mà chưa nhận nằm ở save.gifts (các vòng L7–L9 đẩy vào khi event kết thúc). Tất cả gộp vào 1 phong bì.
function giftsDue() {
  const won = wonLevel();
  const st = LIVE.liveState(save.live, LIVE.nowMs(), won);
  // chưa qua L5: không đón (không function meta nào trước L5), bỏ luôn lần vắng này để sau này không đón nhầm
  if (save.live.awayDue && !LIVE.featureOn('welcome', won)) { delete save.live.awayDue; persist(); }
  return { day: st.day, welcome: !EV.KILL.welcome && LIVE.welcomeDue(save.live, won) ? save.live.awayDue : 0, gifts: (save.gifts || []).length > 0,
    morning: !EV.KILL.morning && LIVE.morningDue(save.morning, st.day, st.pd, won) };
}
function giftPopup(due) {
  const parts = [];
  if (due.welcome) parts.push(LIVE.welcomeReward(due.welcome));
  const evGifts = (save.gifts || []).slice();
  parts.push(...evGifts);
  const mN = due.morning ? ((save.morning && save.morning.n) || 0) + 1 : 0;
  if (due.morning) parts.push(LIVE.morningReward(mN));
  const r = LIVE.mergeRewards(parts);
  const title = due.welcome ? t('wb_title') : due.gifts ? t('gifts_title') : t('morning_title');
  const lines = [];
  if (due.welcome) {
    lines.push(`<p>${t('wb_body')}</p>`);
    const ch = chapterOf(curLevel()), dn = decorOf(ch)[save[ch.key] || 0];
    lines.push(`<p class="small">${t('wb_place', { place: chPlace(ch) })}${dn ? ' ' + t('wb_decor', { name: t('decor_' + dn.id) }) : ''}</p>`);
  } else if (due.gifts) lines.push(`<p>${t('gifts_body')}</p>`);
  else lines.push(`<p>${t('morning_body')}</p>`);
  sfx('feature', { vol: 0.6 });
  panel({ title, kind: 'tall gift', body: `<div class="gift-art"></div>${lines.join('')}${giftChips(r)}`,
    buttons: [{ label: t('claim'), act: () => {
      save.coins += r.coins;
      for (const k of ['hint', 'pack', 'stamper', 'joker']) if (r[k]) save[k] = (save[k] || 0) + r[k];
      if (r.moves) save.welcomeMoves = Math.max(save.welcomeMoves || 0, r.moves);   // không cộng dồn nếu nhận 2 lần mà chưa chơi
      if (due.welcome) { track('welcome_back', { away: due.welcome, level: wonLevel(), joker: r.joker }); delete save.live.awayDue; }
      if (evGifts.length) { track('event_gift_claim', { n: evGifts.length, src: evGifts.map(g => g.src || '').join(',') }); save.gifts = (save.gifts || []).slice(evGifts.length); }
      if (due.morning) { save.morning = { last: due.day, n: mN }; track('morning_claim', { n: mN, hint: r.hint > 0 ? 1 : 0, merged: !!(due.welcome || due.gifts) }); }
      persist();
      sfx('coins', { vol: 0.6 }); haptic('milestone');
      bumpCoins();
      refreshHome();
    } }] });
  return true;
}
// ============================================================ L6–L9: event và túi thư (events.js)
// save.ev = { route | season | errands: trạng thái phiên đang chạy }. Phiên đã qua được chốt khi mở app / về màn chính /
// có thắng thua: quà đã đạt mà chưa nhận chuyển vào save.gifts (phong bì quà gộp), tem tuyến và trang tem mùa vào album.
function evState() {
  save.ev = save.ev || {};
  const had = JSON.stringify(save.ev);
  const cur = EV.currentEvent(save.live, LIVE.nowMs(), wonLevel());
  const r = EV.syncEvents(save.ev, cur);
  if (r.gifts.length) {
    const keep = [];
    for (const g of r.gifts) {
      if (g.routeStamp) addRouteStamp();
      if (g.seasonPage) addSeasonPage();
      if (g.rareDecor) addRareDecor();
      delete g.routeStamp; delete g.seasonPage; delete g.rareDecor;
      if (['coins', 'hint', 'pack', 'stamper', 'joker'].some(k => g[k])) keep.push(g);
    }
    save.gifts = (save.gifts || []).concat(keep);
    track('event_end_gifts', { n: r.gifts.length, src: [...new Set(r.gifts.map(g => g.src))].join(',') });
  }
  if (r.gifts.length || JSON.stringify(save.ev) !== had) persist();
  return { cur, s: r.cur };
}
const evActive = id => { const e = EV.currentEvent(save.live, LIVE.nowMs(), wonLevel()); return !!e && e.id === id; };
/** E2: lá tem mùa vừa được gửi: +1 tem (giữ cả khi thua sau đó), dấu tem bay lên đỉnh màn. */
function seasonCollectFx(v) {
  const es = evState();
  if (!es.cur || es.cur.id !== 'season') return;
  const n = EV.seasonCollect(es.s, seasonKey);
  if (n == null) return;
  persist();
  track('season_stamp_get', { n, level: seasonKey, k: es.cur.k });
  if (n % EV.SEASON.set === 0 && n <= 24) track('season_set_complete', { set: n / EV.SEASON.set, k: es.cur.k });
  sfx('claim', { vol: 0.6, rate: 1.12 });
  const tx = 540, ty = 150 + DY_HUD;
  floatText(t('season_get', { n: Math.min(n, 24), m: 24 }), tx, ty + 120);
  if (reduceMotion() || !v) return;
  const el = document.createElement('div');
  el.className = 'season-fly';
  el.style.backgroundImage = `url(${motifUrl()})`;
  board.append(el);
  const o = { x: v.x + CW - 40, y: v.y + 20, s: 1 };
  const draw = () => { el.style.transform = `translate(${o.x - 40}px,${o.y - 40}px) scale(${o.s})`; };
  draw();
  tween(o, { x: tx, y: ty, s: 0.7 }, { dur: 620, easing: ease.inOutCubic, onUpdate: draw }).then(() => { el.remove(); sparkle(tx, ty, 6); });
}
function addRouteStamp() {
  const e = EV.currentEvent(save.live, LIVE.nowMs(), wonLevel());
  save.routeStamps = save.routeStamps || [];
  save.routeStamps.push({ k: e ? e.k : (save.routeStamps.length), day: today() });
}
/** Decor hiếm theo mùa (bộ 3 Tem theo mùa): vào bộ sưu tập, hiện ở album (chưa có chỗ đặt thứ 7 trên tường, để R17). */
function addRareDecor() {
  const motif = motifNow(), id = EV.SEASON.rare_decor[motif];
  save.rareDecor = save.rareDecor || [];
  if (id && !save.rareDecor.some(x => x.id === id)) save.rareDecor.push({ id, motif, day: today() });
  track('season_rare_decor', { id, motif });
}
function addSeasonPage() {
  save.seasonPages = save.seasonPages || [];
  save.seasonPages.push({ motif: EV.SEASON_MOTIF(new Date(today() * 864e5).getUTCMonth() + 1), day: today() });
}
// cảnh tuyến theo chu kỳ: bưu thiếp chương 2..13 xoay vòng (Phố Chính không có bưu thiếp)
const routeScene = k => CHAPTERS[1 + (k % 12)] || CHAPTERS[1];
const motifNow = () => EV.SEASON_MOTIF(new Date(today() * 864e5).getUTCMonth() + 1);
const motifUrl = (m = motifNow()) => `assets/ui/season_${m}.png`;   // art đợt 6
/** Cộng 1 phần quà (từ mốc event, túi thư). Xu cộng ngay, booster vào kho, tem tuyến/trang mùa vào album. */
function applyReward(r) {
  if (r.coins) save.coins += r.coins;
  for (const k of ['hint', 'pack', 'stamper', 'joker']) if (r[k]) save[k] = (save[k] || 0) + r[k];
  if (r.routeStamp) addRouteStamp();
  if (r.seasonPage) addSeasonPage();
  if (r.rareDecor) addRareDecor();
  persist();
}
/** Đếm việc vặt (E4) từ sự kiện chơi. */
function evBump(on, n = 1) {
  const { cur, s } = evState();
  if (!cur || cur.id !== 'errands') return;
  const done = EV.errandBump(s, cur.k, on, n);
  persist();
  for (const id of done) {
    trackRaw('errand_complete', { errand: id, k: cur.k });
    if (!$('home').classList.contains('off')) continue;
    const e = EV.ERRAND_POOL.find(x => x.id === id);
    if (!winTL) toast(t('ev_line_errand', { name: t('er_' + id, { n: e.need }) }), 1600);
  }
}
function onMeta(name, d) {
  if (name === 'level_complete') { evBump('win'); if (d.stars === 3) evBump('stars3'); if (d.special) evBump('hard_win'); }
  else if (name === 'daily_complete' && !d.replay) evBump('daily_day');
  else if (name === 'decor_place') evBump('decor');
  else if (name === 'deliver') { evBump('deliver'); if (d.stamps >= 6) evBump('deliver_big'); }
}
/** Thắng 1 ván (chiến dịch hoặc Thư hôm nay): đi 1 trạm (E1), túi thư +1 (F5). Trả các dòng hiển thị ở màn thắng. */
function winMeta() {
  const lines = [];
  const { cur, s } = evState();
  if (cur && cur.id === 'route') {
    const p = EV.routeStep(s);
    if (p != null) {
      persist();
      track('route_step', { station: p, k: cur.k });
      if (p === EV.ROUTE.stations) track('route_complete', { k: cur.k });
      lines.push(`<span class="evl"><i style="background-image:url(assets/ui/ic_event.png)"></i>${p <= EV.ROUTE.stations ? t('ev_line_route', { n: p, m: EV.ROUTE.stations }) : t('route_trip', { n: Math.ceil((p - EV.ROUTE.stations) / EV.ROUTE.trip.len), m: EV.ROUTE.trip.max })}</span>`);
    }
  }
  save.mailbag = save.mailbag || { n: 0, i: 0 };
  const got = EV.mailbagWin(save.mailbag, wonLevel());
  if (LIVE.featureOn('mailbag', wonLevel()) && !EV.KILL.mailbag) {
    if (got) {
      applyReward(got);
      track('mailbag_open', { kind: got.kind, round: save.mailbag.i });
      lines.push(`<span class="evl full"><i style="background-image:url(assets/ui/mailbag_full.png)"></i>${t('bag_full')} ${giftChips(got).replace(/<\/?div class="gift-list">/g, '')}</span>`);
    } else lines.push(`<span class="evl"><i style="background-image:url(assets/ui/mailbag_open.png)"></i>${t('ev_line_bag', { n: save.mailbag.n, m: EV.MAILBAG.need })}</span>`);
  }
  persist();
  return lines.length ? `<div class="ev-lines">${lines.join('')}</div>` : '';
}
// ---- panel event (bấm ô Event): tiến độ, mốc quà, nút Nhận cho từng mốc đã đạt
function rewardMini(r) { return giftChips(r).replace('gift-list', 'gift-list mini'); }
function msRow(id, cur, m, label) {
  const btn = m.claimed ? `<span class="ev-got">${t('ev_claimed')}</span>`
    : m.reached ? `<b class="ev-claim" role="button" data-mid="${m.mid}">${t('claim')}</b>` : '';
  return `<div class="ev-ms${m.reached ? ' reached' : ''}${m.claimed ? ' done' : ''}"><div class="ev-ms-l">${label}</div>${rewardMini(m.reward)}${btn}</div>`;
}
function eventPanel(id, { instant = false } = {}) {
  const { cur, s } = evState();
  if (!cur || cur.id !== id) { refreshHome(); return; }
  track('event_open', { event: id, k: cur.k, instant });
  const ms = EV.milestones(id, s, cur.k);
  let body = '';
  if (id === 'route') {
    const sc = routeScene(cur.k);
    const p = Math.min(s.p, EV.ROUTE.stations);
    const dots = Array.from({ length: EV.ROUTE.stations }, (_, i) => {
      const n = i + 1, gift = EV.ROUTE.milestones.some(m => m.at === n);
      return `<b class="rt-dot${n <= p ? ' on' : ''}${n === p ? ' cur' : ''}${gift ? ' gift' : ''}">${gift ? '' : n}</b>`;
    }).join('');
    body = `<div class="rt-scene"><img src="${sc.postcard}" alt=""><span>${chPlace(sc)}</span></div>
      <div class="rt-track">${dots}</div><p class="small">${t('route_rule')}</p>
      ${ms.filter(m => !m.trip || s.p >= EV.ROUTE.stations).map(m => msRow(id, cur, m, m.trip ? t('route_trip', { n: m.trip, m: EV.ROUTE.trip.max }) : t('route_stop', { n: m.at, m: EV.ROUTE.stations }))).join('')}`;
  } else if (id === 'season') {
    const motif = motifNow();
    const sets = EV.SEASON.sets.map((m, si) => {
      const cells = Array.from({ length: EV.SEASON.set }, (_, i) => `<b class="ss-cell${si * 8 + i < s.n ? ' on' : ''}"></b>`).join('');
      return `<div class="ss-row"><div class="ss-cells" style="--motif:url(${motifUrl(motif)})">${cells}</div></div>${msRow(id, cur, ms[si], t('season_set', { n: si + 1 }))}`;
    }).join('');
    const extra = s.n >= 24 ? ms.filter(m => m.extra).map(m => msRow(id, cur, m, t('season_extra', { n: m.extra, m: EV.SEASON.extra.max }))).join('') : '';
    body = `<div class="ss-head" style="--motif:url(${motifUrl(motif)})"><i></i>${t('season_' + motif)} · ${t('season_get', { n: Math.min(s.n, 24), m: 24 })}</div>
      <p class="small">${t('season_rule')}</p>${sets}${extra}`;
  } else {
    body = `<p class="small">${t('errands_rule')}</p>${ms.map(m => {
      if (m.box) return msRow(id, cur, m, t('er_box'));
      const c = s.c[m.errand.id] || 0;
      return msRow(id, cur, m, `${t('er_' + m.errand.id, { n: m.errand.need })}<span class="er-bar"><b style="width:${Math.round(100 * c / m.errand.need)}%"></b></span><small>${c}/${m.errand.need}</small>`);
    }).join('')}`;
  }
  const p = panel({ title: t('ev_' + id), kind: 'tall event ev-' + id, instant, body, buttons: [{ label: t('close'), cls: 'sec', act: () => refreshHome() }] });
  p.querySelectorAll('.ev-claim').forEach(b => b.addEventListener('pointerup', ev => {
    ev.stopPropagation();
    const st = evState();
    if (!st.cur || st.cur.id !== id) return;
    const r = EV.claim(id, st.s, b.dataset.mid, st.cur.k);
    if (!r) return;
    applyReward(r);
    track('event_claim', { event: id, mid: b.dataset.mid, k: st.cur.k, ...r });
    if (r.routeStamp) toast(t('route_done'), 1800);
    sfx('coins', { vol: 0.6 }); haptic('milestone');
    bumpCoins();
    eventPanel(id, { instant: true });
  }));
}
for (const id of ['route', 'season', 'errands']) {
  EVENT_UI[id] = {
    progress: () => { const { cur, s } = evState(); return cur && cur.id === id ? EV.progress(id, s, cur.k) : { p: 0, n: 1 }; },
    dot: () => { const { cur, s } = evState(); return !!(cur && cur.id === id && EV.claimable(id, s, cur.k).length); },
    open: () => eventPanel(id),
  };
}
// ---- E3 dải băng cuối tuần và F5 thanh túi thư trên màn chính
function refreshWeekendBag() {
  const st = LIVE.liveState(save.live, LIVE.nowMs(), wonLevel());
  const wk = EV.weekendMult(st) > 1;
  $('wkendRibbon').classList.toggle('off', !wk);
  $('wkendRibbon').textContent = t('weekend_ribbon');
  const bagOn = !EV.KILL.mailbag && LIVE.featureOn('mailbag', wonLevel());
  $('home').classList.toggle('bag', bagOn);
  const bb = $('bagBar');
  bb.classList.toggle('off', !bagOn);
  if (!bagOn) return;
  const bag = save.mailbag || { n: 0, i: 0 };
  bb.querySelector('.bb-fill').style.width = `${Math.round(100 * (bag.n || 0) / EV.MAILBAG.need)}%`;
  bb.querySelector('.bb-txt').textContent = `${bag.n || 0}/${EV.MAILBAG.need}`;
  const icon = { hint: 'ic_hint', pack: 'ic_magnet', stamper: 'ic_stamper', joker: 'ic_wild' }[EV.mailbagNext(bag)];
  bb.querySelector('.bb-next').style.backgroundImage = `url(assets/ui/${icon}.png)`;
  bb.setAttribute('aria-label', `${t('bag_title')} ${bag.n || 0}/${EV.MAILBAG.need}`);
}
// ============================================================ L11: Thông báo nhẹ (F9) và Nhắc nghỉ (F10), notify.js
// F9: mặc định tắt. Chỉ trên app native có plugin; web bỏ qua êm (không hỏi, không có dòng trong Cài đặt).
const notifOk = () => NT.notifSupported() && !EV.KILL.notifications;
const notifAskDue = () => notifOk() && !save.seen.notif_ask && getSetting('notif') !== 1 && dailySave().stamps.length >= CONF.notifications.ask_after_daily;
function notifTexts(kind) { return { title: t('notif_' + kind + '_title'), body: t('notif_' + kind + '_body') }; }
async function notifSync(reason = 'open') {
  if (!notifOk()) return 0;
  if (getSetting('notif') !== 1) { await NT.cancelAll(); return 0; }
  const td = today();
  const list = NT.buildSchedule(save.live, LIVE.nowMs(), wonLevel(), { hour: getSetting('notif_hour'), days: CONF.notifications.days, dailyOn: dailyOn(), kill: EV.KILL,
    skipDay: dailySave().won[td] ? td : null });
  const n = await NT.reschedule(list, notifTexts);
  trackRaw('notif_schedule', { n, reason, hour: getSetting('notif_hour'), kinds: list.map(x => x.kind[0]).join('') });
  return n;
}
function notifPrompt() {
  save.seen.notif_ask = 1; persist();
  track('notif_prompt', { daily_done: dailySave().stamps.length });
  panel({ title: t('notif_title'), kind: 'tall gift', body: `<div class="gift-art"></div><p>${t('notif_body', { h: getSetting('notif_hour') })}</p><p class="small">${t('notif_note')}</p>`,
    buttons: [
      { label: t('notif_yes'), act: async () => {
        const ok = await NT.requestPermission();
        track('notif_enable', { granted: ok });
        if (ok) { setSetting('notif', 1); notifSync('enable'); toast(t('notif_on', { h: getSetting('notif_hour') }), 1800); }
        else toast(t('notif_denied'), 2200);
      } },
      { label: t('notif_later'), cls: 'sec', act: () => track('notif_later', {}) },
    ] });
  return true;
}
// F10: đếm thời gian app ở tiền cảnh. Tới 45 phút thì chờ lúc rảnh (không có bảng, không đang kéo, không giữa màn thắng)
// rồi hiện 1 tấm giấy nhỏ, tự ẩn sau 9 giây, chạm để ẩn. Không chặn thao tác, không có nút bắt buộc.
const restT = NT.restTimer({ minutes: CONF.rest.minutes, awayResetMinutes: CONF.rest.away_reset_minutes });
let restPending = false;
function restShow() {
  restPending = false; restT.reset();
  const el = $('restNote');
  el.innerHTML = `<i></i><span>${t('rest_note', { n: CONF.rest.minutes })}</span>`;
  el.classList.add('on');
  track('rest_reminder', { minutes: CONF.rest.minutes, level: levelActive ? levelIdx + 1 : 0, screen: $('home').classList.contains('off') ? 'level' : 'home' });
  clearTimeout(restShow.t); restShow.t = setTimeout(() => el.classList.remove('on'), 9000);
}
$('restNote').addEventListener('pointerdown', ev => { ev.stopPropagation(); $('restNote').classList.remove('on'); });
setInterval(() => {
  if (EV.KILL.rest || getSetting('rest') !== 1) { restT.reset(); return; }
  if (restT.tick(5000, !document.hidden)) restPending = true;
  if (restPending && !document.hidden && !panelOpen && !winTL && !drag && !busyInput) restShow();
}, 5000);
// Hàng đợi popup tự hiện ở màn chính (mục 4): tối đa 1 popup mỗi lần mở app (boot, quay lại từ nền) và mỗi lần về màn chính.
// Ưu tiên: hỏi chơi tiếp ván dở (chỉ lúc mở app) > phong bì quà (F6 > quà event cũ > F4, gộp 1 phong bì) > "Tính năng mới"
// (tối đa 1 mỗi phiên). Thứ chưa hiện được thì đợi lần sau; quà đã đạt không mất.
let popupVisit = 0, popupUsed = -1, featureShown = false;
const popupLog = [];
function homePopups(trigger = 'home') {
  if (panelOpen || $('home').classList.contains('off') || popupUsed === popupVisit) return null;
  if (!$('album').classList.contains('off') || !$('ch2').classList.contains('off')) return null;
  const g = giftsDue();
  const run = trigger === 'boot' ? loadRun() : null;
  const pick = LIVE.pickPopup({ resume: !!run, welcome: !!g.welcome, gifts: g.gifts, morning: g.morning, notif: notifAskDue(), feature: featureDue(), featureShown }, trigger);
  if (!pick) return null;
  popupUsed = popupVisit;
  popupLog.push({ visit: popupVisit, trigger, pick, t: Date.now() });
  if (pick === 'resume') askResume(run);
  else if (pick === 'gifts') giftPopup(g);
  else if (pick === 'notif') notifPrompt();
  else if (pick === 'feature') { featureShown = true; dailyIntro(); }
  return pick;
}
function newVisit() { popupVisit++; }
function refreshHome() {
  if ($('home').classList.contains('off')) return;
  LIVE.touch(save.live); persist();
  evState();                                       // chốt phiên event đã qua (quà chưa nhận -> phong bì) trước khi tính popup
  refreshDailyBtn(); refreshEventTile(); refreshWeekendBag(); renderDecor(); bumpCoins({ instant: true, pop: false });
}
$('dailyBtn').addEventListener('pointerup', () => { unlockAudio(); sfx('click'); dailyPanel('home'); });
// quay lại từ nền (qua nửa đêm, vắng nhiều ngày): màn chính cập nhật; vắng >= 30 phút hoặc sang ngày mới thì tính là một lần mở app
let hiddenAt = 0, hiddenDay = null;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); hiddenDay = today(); return; }
  refreshHome();
  if (hiddenAt && (Date.now() - hiddenAt >= 30 * 60e3 || today() !== hiddenDay)) { newVisit(); setTimeout(() => homePopups('resume'), 300); notifSync('resume'); }
  hiddenAt = 0;
});

// ============================================================ home / pause
// Level hiện tại để hiển thị (save cũ có thể mở xa hơn số level đang có: không hạ unlocked, chỉ kẹp khi hiển thị)
const curLevel = () => Math.max(1, Math.min(save.unlocked, LEVELS.length));
const chPages = ch => Math.max(1, Math.ceil((Math.min(ch.to, LEVELS.length) - ch.from + 1) / 10));
function goHome(chId, page) {
  const returning = $('home').classList.contains('off');     // về từ level/màn khác (không phải lật trang chương, đổi ngôn ngữ)
  endWin();
  setMusicScene('home');
  homeCh = CHAPTERS.find(c => c.id === chId && c.from <= LEVELS.length) || chapterOf(curLevel());
  homePage = Number.isFinite(page) ? Math.max(0, Math.min(chPages(homeCh) - 1, page))
    : Math.max(0, Math.min(chPages(homeCh) - 1, Math.floor((Math.min(Math.max(curLevel(), homeCh.from), homeCh.to) - homeCh.from) / 10)));
  if (levelActive && S) {
    saveRun();
    const run = dailyRun ? loadDailyRun(dailyRun.key) : loadRun();
    trackQuit({ resumable: !!(run && (dailyRun || run.idx === levelIdx)) });
  }
  dailyRun = null;
  levelActive = false;
  document.body.classList.remove('hard');
  levelToken++;
  removeBanner();
  closePanel(true);
  ended = true;
  busyInput = false;
  script = null;
  clearTimeout(idleTimer);
  tut(null);
  clearHint();
  const grid = $('grid');
  grid.innerHTML = '';
  const run = loadRun();
  const pFrom = homeCh.from + homePage * 10, pTo = Math.min(homeCh.to, pFrom + 9, LEVELS.length);
  for (let lv = pFrom; lv <= pTo; lv++) {      // chỉ hiện 10 level của trang đang xem
    const i = lv - 1;
    const el = document.createElement('div');
    el.className = 'lvl' + (lv > save.unlocked ? ' locked' : '') + (save.stars[lv] ? ' done' : '') + (lv === save.unlocked ? ' cur' : '') + (run && run.idx === i ? ' resume' : '');
    el.innerHTML = `${lv}${save.stars[lv] ? `<span class="pts">${'<i></i>'.repeat(save.stars[lv])}</span>` : ''}`;
    el.dataset.map = lv;                           // ô bản đồ level: không tính là điểm chạm chính (L5)
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', t('level', { n: lv }) + (lv > save.unlocked ? ' 🔒' : ''));
    el.addEventListener('pointerup', () => { unlockAudio(); if (lv <= save.unlocked || DEBUG) { sfx('click'); playLevel(i); } else sfx('deny'); });
    grid.append(el);
  }
  // Thanh chương ngay dưới lưới level: [‹] biển gỗ tên chương + tiến độ chương [›]. Chương 20 level có 2 trang:
  // mũi tên đi từng trang rồi sang chương. Chương sau còn khoá: nút có ổ khoá, bấm xem teaser (bưu thiếp, tem mới, cư dân).
  const nav = document.createElement('div');
  nav.className = 'ch-nav';
  const prevCh = CHAPTERS.find(c => c.id === homeCh.id - 1);
  const nextCh = CHAPTERS.find(c => c.id === homeCh.id + 1 && c.from <= LEVELS.length);
  const pages = chPages(homeCh);
  const hasPrev = homePage > 0 || !!prevCh, nextIsPage = homePage < pages - 1;
  const hasNext = nextIsPage || !!nextCh;
  const nextOpen = nextIsPage || (nextCh && save.unlocked >= nextCh.from);
  const chTo = Math.min(homeCh.to, LEVELS.length);
  const doneN = Array.from({ length: chTo - homeCh.from + 1 }, (_, k) => homeCh.from + k).filter(l => save.stars[l]).length;
  const totalN = chTo - homeCh.from + 1;
  nav.innerHTML = `<div class="ch-arrow${hasPrev ? '' : ' none'}" role="button" aria-label="${t('ch_page_prev')}">‹</div>
    <div class="ch-lbl"><small>${t('ch_word', { n: homeCh.id })}${pages > 1 ? ` · ${pFrom}–${pTo}` : ''}</small><span class="ch-name">${chPlace(homeCh)}</span>
      <span class="ch-prog"><span class="ch-bar"><b style="width:${Math.round(100 * doneN / totalN)}%"></b></span><span class="ch-cnt">${doneN}/${totalN}</span></span></div>
    <div class="ch-arrow${hasNext ? '' : ' none'}${hasNext && !nextOpen ? ' locked' : ''}" role="button" aria-label="${t('ch_page_next')}">${hasNext && !nextOpen ? '<i></i>' : '›'}</div>`;
  const [aPrev, , aNext] = nav.children;
  if (hasPrev) aPrev.addEventListener('pointerup', () => { unlockAudio(); sfx('click'); if (homePage > 0) goHome(homeCh.id, homePage - 1); else goHome(prevCh.id, chPages(prevCh) - 1); });
  if (hasNext) aNext.addEventListener('pointerup', () => {
    unlockAudio(); sfx('click');
    if (nextIsPage) goHome(homeCh.id, homePage + 1);
    else if (nextOpen) goHome(nextCh.id, 0);
    else openChapterTeaser(nextCh, 'home_tile');
  });
  grid.append(nav);
  // có ván dở: nút chính là "Chơi tiếp Level N" (vào thẳng ván dở, không hỏi lại)
  $('playBtn').textContent = run ? t('play_resume', { n: run.idx + 1 }) : allDone() ? t('more_soon') : t('play', { n: curLevel() });
  $('home').classList.remove('off');
  refreshHome();
  // popup tự hiện chỉ khi vừa về màn chính; chờ 1 nhịp để lệnh mở ngay sau goHome (Album, Trang trí) được ưu tiên
  if (!booting && returning) { newVisit(); const v = popupVisit; setTimeout(() => { if (v === popupVisit) homePopups('home'); }, 260); }
}
const chPlace = ch => t(ch.named ? 'ch_place_' + ch.id : 'ch_place_x');
const chName = ch => (ch.named ? t('ch_name_' + ch.id) : `${t('ch_word', { n: ch.id })} · ${t('ch_place_x')}`);
// ============================================================ Bưu điện nhỏ (decor màn hình chính, mua bằng Tem Điểm)
const allDone = () => !!save.stars[LEVELS.length];
// Art decor / bưu thiếp chương 3+ đang được vẽ (art-batch-1.md): kiểm tra bằng cách tải thử ảnh, có đủ 6 món mới bật decor.
// Chưa đủ thì panel Trang trí báo "sắp có" (giữ hành vi cũ). Kết quả nhớ trong phiên.
const imgOk = new Map();
function probeImg(url) {
  if (!imgOk.has(url)) imgOk.set(url, new Promise(res => { const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = url; }));
  return imgOk.get(url);
}
const decorState = new Map();      // chương id -> true (đủ art) | false | undefined (đang kiểm tra)
function decorOf(ch) {
  if (ch.id <= 2) return ch.decor;
  if (!ch.decor.length) return [];
  if (!decorState.has(ch.id)) {
    decorState.set(ch.id, undefined);
    Promise.all(ch.decor.map(d => probeImg(`assets/decor/${d.id}.png`))).then(r => {
      decorState.set(ch.id, r.every(Boolean));
      if (r.every(Boolean) && homeCh === ch && !$('home').classList.contains('off')) renderDecor();
    });
  }
  return decorState.get(ch.id) ? ch.decor : [];
}
function renderDecor(justPlaced = -1) {
  const DECOR = decorOf(homeCh);
  const n = save[homeCh.key] || 0;
  // chương 3+: class theo chỗ đặt (dc-s0..dc-s5), dùng chung 6 chỗ của nền với chương 1–2
  $('decor').innerHTML = DECOR.map((d, i) => (i < n || i === n)
    ? `<img class="dc dc-${d.id}${homeCh.id > 2 ? ' dc-s' + i : ''}${i === n ? ' ghost' : ''}${i === justPlaced ? ' new' : ''}" src="assets/decor/${d.id}.png" alt="">` : '').join('');
  $('decorBtn').querySelector('.pts').textContent = pointsLeft();
  const next = DECOR[n];
  $('decorBtn').classList.toggle('ready', !!next && pointsLeft() >= next.cost);
  $('homePip').classList.toggle('off', DECOR.length >= 6 && n >= 6);   // giường của Pip (món thứ 6) đã đặt: Pip ngủ trên đó, không ngồi chờ nữa
}
function decorPanel() {
  const DECOR = decorOf(homeCh);
  const n = save[homeCh.key] || 0;
  const d = DECOR[n];
  const left = pointsLeft();
  track('decor_open', { chapter: homeCh.id, placed: n, points: left });
  if (!DECOR.length) { panel({ title: t('decorate'), body: `<p>${t('decor_soon')}</p>`, buttons: [{ label: t('close'), act: () => {} }] }); return; }
  if (!d) {
    panel({ title: t('decorate'), body: `<p>${t('decor_done')}</p>`, buttons: [{ label: t('close'), act: () => {} }] });
    return;
  }
  const ok = left >= d.cost;
  panel({
    title: t('decorate'),
    body: `<div class="feature-icon" style="background-image:url(assets/decor/${d.id}.png)"></div>
      <p><b>${t('decor_' + d.id)}</b> · ${n + 1}/${DECOR.length}</p>
      <div class="pts-line">${t('pts_have', { n: left })}</div>
      ${ok ? '' : `<p style="font-size:${fs(42)};margin:0">${pointsEarned() ? t('pts_need', { n: d.cost - left }) : t('pts_first')}</p>`}`,
    buttons: [
      { label: t('decor_place', { n: d.cost }), cls: ok ? '' : 'off', act: () => {
        if (!ok) { decorPanel(); return; }
        save[homeCh.key] = n + 1;
        persist();
        track('decor_place', { chapter: homeCh.id, id: d.id, index: n + 1, cost: d.cost, points_left: pointsLeft() });
        sfx('decor');
        haptic('milestone');
        renderDecor(n);
      } },
      { label: t('close'), cls: 'orange', act: () => {} },
    ],
  });
}
$('undoBtn').addEventListener('pointerup', () => { unlockAudio(); onBooster('undo'); });
$('playBtn').addEventListener('pointerup', () => {
  unlockAudio(); sfx('click');
  const run = loadRun();
  if (run) startLevel(run.idx, { resume: run });
  else if (allDone()) panel({ title: t('more_soon'), body: `<p>${t('more_soon_body')}</p>`, buttons: [{ label: t('close'), act: () => {} }] });
  else startLevel(curLevel() - 1);
});
// Teaser chương (R5, tổng quát từ teaser chương 2, concept-little-post-office.md mục 3.1): bưu thiếp khu mới, tem mới,
// cư dân, decor. Hook thay cho story: "thị trấn còn gì". Chương đã mở: cùng màn này thành màn giới thiệu chương (dấu "OPEN").
// Bưu thiếp đọc assets/chN/postcard.jpg; chưa có art thì hiện bưu thiếp giấy kem có tên khu (placeholder).
// Tem mới lấy từ trường introduce của level trong chương (luôn là chủ đề có art thật, kể cả khi đang dùng fallback).
// Sự kiện: chapter_teaser_open (chương 2 vẫn ghi thêm chapter2_teaser_open để so với số liệu cũ).
let teaserCh = null;
const chOpen = ch => LEVELS.length >= ch.from && save.unlocked >= ch.from;
const chLevel = ch => Math.min(ch.to, LEVELS.length, Math.max(ch.from, save.unlocked));
function chTopics(ch) {
  const out = [];
  for (const l of LEVELS) if (l.id >= ch.from && l.id <= ch.to) for (const tp of l.introduce || []) if (!out.includes(tp)) out.push(tp);
  return out.slice(0, 4);
}
function openChapterTeaser(ch, source) {
  teaserCh = ch;
  const open = chOpen(ch);
  const prev = CHAPTERS.find(c => c.id === ch.id - 1) || CHAPTERS[0];
  $('ch2').classList.toggle('open', open);
  $('ch2Title').textContent = t('ch_word', { n: ch.id });
  $('ch2Sub').textContent = open ? t('ch_sub_open', { place: chPlace(ch) }) : t('ch_sub_locked', { place: chPlace(ch), n: prev.to });
  $('ch2Soon').textContent = open ? t('ch2_open') : t('ch2_lock_stamp', { n: prev.to });
  const card = $('ch2').querySelector('.ch2-card');
  const img = card.querySelector('img');
  card.classList.remove('ph');
  card.dataset.place = chPlace(ch);
  img.src = ch.postcard;
  probeImg(ch.postcard).then(okImg => { if (teaserCh === ch && !okImg) card.classList.add('ph'); });
  const tps = chTopics(ch);
  $('ch2Stamps').textContent = t('ch_new_stamps');
  $('ch2Stamps').style.display = tps.length ? '' : 'none';
  $('ch2StampRow').innerHTML = tps.map(tp => `<div class="ch2-st"><div><img src="${iconUrl(tp)}" alt=""></div>${topicName(tp)}</div>`).join('');
  $('ch2Npc').innerHTML = ch.id === 2 ? t('ch2_npc') : t(ch.named ? 'ch_npc_' + ch.id : 'ch_npc_x');
  $('ch2Decor').textContent = t('ch_new_decor');
  const drow = $('ch2DecorRow');
  const showDecor = items => { drow.innerHTML = items.map(d => `<img src="assets/decor/${d.id}.png" alt="">`).join(''); $('ch2Decor').style.display = drow.style.display = items.length ? '' : 'none'; };
  const pick = ch.decor.length >= 6 ? [ch.decor[3], ch.decor[1], ch.decor[0]] : [];
  showDecor(ch.id <= 2 ? pick : []);
  if (ch.id > 2 && pick.length) Promise.all(ch.decor.map(d => probeImg(`assets/decor/${d.id}.png`))).then(r => { if (teaserCh === ch && r.every(Boolean)) showDecor(pick); });
  $('ch2Tip').textContent = t('ch2_tip');
  const nb = $('ch2Notify');
  nb.textContent = t('play', { n: open ? chLevel(ch) : curLevel() });
  nb.classList.remove('done');
  $('ch2').classList.remove('off');
  const soon = $('ch2Soon');
  soon.style.animation = 'none'; void soon.offsetWidth; soon.style.animation = '';   // chạy lại hiệu ứng đóng dấu
  setTimeout(() => sfx('stamp', { rate: 0.9 }), 280);
  track('chapter_teaser_open', { chapter: ch.id, source, open, points_left: pointsLeft() });
  if (ch.id === 2) track('chapter2_teaser_open', { source, open, points_left: pointsLeft(), decor: save.decor || 0 });
}
$('ch2Notify').addEventListener('pointerup', () => {
  // chương đã mở: chơi level đầu chương (hoặc level đang tới trong chương); còn khoá: chơi tiếp level đang dở để mở chương
  unlockAudio(); sfx('click'); $('ch2').classList.add('off');
  const ch = teaserCh || CHAPTERS[1];
  playLevel((chOpen(ch) ? chLevel(ch) : curLevel()) - 1);
});
$('ch2Close').addEventListener('pointerup', () => { sfx('close'); $('ch2').classList.add('off'); });
$('pauseBtn').addEventListener('pointerup', () => {
  if (panelOpen) return;
  unlockAudio();
  sfx('click');
  track('pause_open', { level: levelIdx + 1, moves_used: S ? S.used : 0 });
  pausePanel();
});
// Pause gọn còn 5 nút (R13): âm thanh, nhạc, ngôn ngữ chuyển vào bảng Cài đặt
function pausePanel() {
  panel({
    title: t('paused'),
    body: `<p>${curTitle()}</p>`,
    buttons: [
      { label: t('resume'), act: () => {} },
      { label: t('howto'), cls: 'brown', act: () => showRules() },
      { label: t('settings'), cls: 'brown', act: () => settingsPanel({ back: pausePanel }) },
      { label: t('restart'), cls: 'brown', act: () => confirmRestart() },
      { label: t('home'), cls: 'brown', act: () => confirmHome() },
    ],
  });
}
// ============================================================ bảng Cài đặt (R13)
// Mở từ Pause (Đóng -> quay lại Pause) và từ nút Cài đặt ở màn chính. Mỗi lựa chọn áp ngay; đổi cỡ chữ / ngôn ngữ thì
// dựng lại bảng (instant) để người chơi thấy ngay cỡ chữ mới.
function settingsPanel({ back = null, instant = false } = {}) {
  const segs = (key, opts, cur) => `<div class="seg" data-key="${key}">${opts.map(([v, lbl]) =>
    `<b data-v="${v}" class="${String(v) === String(cur) ? 'on' : ''}" role="button">${lbl}</b>`).join('')}</div>`;
  const row = (lbl, ctl, inline = false) => `<div class="set-row${inline ? ' inline' : ''}"><div class="set-lbl">${lbl}</div>${ctl}</div>`;
  const onOff = (key, on) => segs(key, [[1, t('on')], [0, t('off')]], on ? 1 : 0);
  const body = `<div class="set-list">
    ${row(t('set_text'), segs('text', [0, 1, 2].map(v => [v, t('text_' + v)]), getSetting('text')))}
    ${row(t('set_sfx'), segs('sfx', [0, 1, 2].map(v => [v, t('sfx_' + v)]), sfxVolume()))}
    ${row(t('set_music'), onOff('music', isMusicOn()), true)}
    ${row(t('set_haptics'), onOff('haptics', hapticsEnabled()), true)}
    ${row(t('set_motion'), onOff('motion', getSetting('motion') === 'reduce'), true)}
    ${EV.KILL.rest ? '' : row(t('set_rest'), onOff('rest', getSetting('rest') === 1), true)}
    ${notifOk() ? row(t('set_notif'), onOff('notif', getSetting('notif') === 1), true) : ''}
    ${notifOk() && getSetting('notif') === 1 ? row(t('set_notif_hour'), segs('notif_hour', CONF.notifications.hours.map(h => [h, `${h}:00`]), getSetting('notif_hour'))) : ''}
    ${row(t('set_lang'), segs('lang', [['en', 'English'], ['vi', 'Tiếng Việt']], getLang()))}
  </div>`;
  const p = panel({ title: t('settings'), kind: 'tall', instant, body,
    buttons: [{ label: t('close'), act: () => { if (back) back(); } }] });
  p.querySelectorAll('.seg b').forEach(b => b.addEventListener('pointerup', ev => {
    ev.stopPropagation();
    unlockAudio();
    const key = b.parentElement.dataset.key, raw = b.dataset.v;
    const v = key === 'lang' ? raw : Number(raw);
    const from = { text: getSetting('text'), sfx: sfxVolume(), music: isMusicOn() ? 1 : 0, haptics: hapticsEnabled() ? 1 : 0,
      motion: getSetting('motion') === 'reduce' ? 1 : 0, lang: getLang(), rest: getSetting('rest'), notif: getSetting('notif'), notif_hour: getSetting('notif_hour') }[key];
    if (from === v) return;
    if (key === 'text') setSetting('text', v);
    else if (key === 'sfx') setSetting('sfx', v);
    else if (key === 'music') setMusicOn(!!v);
    else if (key === 'haptics') { setHapticsEnabled(!!v); if (v) haptic('tap'); }
    else if (key === 'motion') setSetting('motion', v ? 'reduce' : 'auto');
    else if (key === 'lang') { setLang(v); applyLang(); }
    else if (key === 'rest') setSetting('rest', v);
    else if (key === 'notif') {
      if (v) { NT.requestPermission().then(ok => { if (ok) { setSetting('notif', 1); notifSync('setting'); } else toast(t('notif_denied'), 2200); settingsPanel({ back, instant: true }); }); return; }
      setSetting('notif', 0); notifSync('setting');
    }
    else if (key === 'notif_hour') { setSetting('notif_hour', v); notifSync('setting'); }
    track('setting_change', { key, from, to: v, level: levelActive ? levelIdx + 1 : 0 });
    sfx('click', { vol: 0.7 });                    // nghe thử mức âm lượng vừa chọn
    settingsPanel({ back, instant: true });
  }));
  return p;
}
onSetting(() => applySettings());
// đổi ngôn ngữ (bảng Cài đặt): viết lại mọi chữ đang hiện
function applyLang() {
  applyStaticCopy();
  relabelCards();
  if (S && L) { updateSlotLabels(); updateHUD(); }
  if (script) tut(t(scriptStep() && scriptStep().booster ? 'script_' + scriptStep().booster : `script_${L.id}_${script.i}`));
  else if (introHold && introHold.redo) { tut(introHold.redo(), 0); introHold.html = $('tut').innerHTML; }   // QA N6: câu "Tem mới" đang giữ
  if (extraEl && S && L) { const lvEl = extraEl.querySelector('.lv'); if (lvEl && levelIdx + 1 >= UNLOCK_AT.slot) lvEl.textContent = t('extra_label'); }   // QA N6
  if (!$('home').classList.contains('off')) goHome(homeCh.id);
}
$('gearBtn').addEventListener('pointerup', () => { unlockAudio(); sfx('click'); settingsPanel(); });
// Giữa ván (đã đi ít nhất 1 nước) mới hỏi; nút an toàn "Chơi tiếp" đứng đầu, nút làm mất ván màu nâu
const midLevel = () => levelActive && !ended && S && S.used > 0;
function confirmRestart() {
  if (!midLevel()) { restartCur(); return; }
  track('confirm_open', { level: levelIdx + 1, kind: 'restart', moves_used: S.used });
  panel({ title: t('confirm_restart_title'), body: `<p>${t('confirm_restart_body')}</p>`, buttons: [
    { label: t('keep_playing'), act: () => track('confirm_choice', { level: levelIdx + 1, kind: 'restart', choice: 'keep' }) },
    { label: t('confirm_restart_yes'), cls: 'brown', act: () => { track('confirm_choice', { level: levelIdx + 1, kind: 'restart', choice: 'yes' }); restartCur(); } },
  ] });
}
function confirmHome() {
  if (!midLevel()) { goHome(); return; }
  saveRun();
  const run = dailyRun ? loadDailyRun(dailyRun.key) : loadRun();
  const saved = !!(run && (dailyRun || run.idx === levelIdx));
  track('confirm_open', { level: levelIdx + 1, kind: 'home', moves_used: S.used, saved });
  panel({ title: t('confirm_home_title'), body: `<p>${t(saved ? 'confirm_home_saved' : 'confirm_home_lost')}</p>`, buttons: [
    { label: t('keep_playing'), act: () => track('confirm_choice', { level: levelIdx + 1, kind: 'home', choice: 'keep' }) },
    { label: t('confirm_home_yes'), cls: 'brown', act: () => { track('confirm_choice', { level: levelIdx + 1, kind: 'home', choice: 'yes' }); goHome(); } },
  ] });
}

// ============================================================ debug
function buildDebug() {
  const d = $('debug');
  if (!DEBUG) return;
  d.classList.add('on');
  const btn = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; d.append(b); };
  btn('Auto-solve', () => autoplay());
  btn('+20 moves', () => { S.moves += 20; ended = false; updateHUD(true); });
  btn('Win now', () => { S.delivered = S.total; afterAction(); });
  btn('Reveal', () => { for (const col of S.cols) for (const c of col) c.up = true; relayout(); });
  btn('Next lv', () => startLevel(levelIdx + 1));
  btn('Reset save', () => { save = defaultSave(); persist(); clearRun(); clearEvents(); location.reload(); });
  btn('Events', () => {
    const f = funnelSummary();
    const rows = Object.keys(f).sort((a, b) => a - b).map(k => `<tr><td>${k}</td><td>${f[k].start}</td><td>${f[k].complete}</td><td>${f[k].fail}</td><td>${f[k].overtime}</td></tr>`).join('');
    const last = allEvents().slice(-12).reverse().map(e => `<div>${e.name} ${e.level ? 'L' + e.level : ''}</div>`).join('');
    // sự kiện của AC R12 (30-day-plan.md): đếm trong bộ đệm để soát nhanh
    const ac = ['tap_drift', 'win_button', 'ad_offer', 'ad_watch', 'app_hidden', 'idle_long', 'pause_open', 'rules_open', 'setting_change'];
    const cnt = n => allEvents().filter(e => e.name === n).length;
    const acRow = `<div style="text-align:left;font-size:22px;color:#5a3a26;margin-top:12px">${ac.map(n => `${n}: <b>${cnt(n)}</b>`).join(' · ')}</div>`;
    panel({ title: 'Events', body: `<table style="width:100%;font-size:26px;color:#5a3a26"><tr><th>Lv</th><th>start</th><th>win</th><th>fail</th><th>OT</th></tr>${rows}</table>${acRow}<div style="text-align:left;font-size:22px;color:#7a5238;margin-top:16px">${last}</div>`,
      buttons: [{ label: 'Copy JSON', act: () => { try { navigator.clipboard.writeText(JSON.stringify(allEvents())).then(() => toast('Copied'), () => toast('Copy failed')); } catch (e) { toast('Copy failed'); } } }, { label: 'Close', cls: 'brown', act: () => {} }] });
  });
  // đồng hồ FPS (chỉ debug)
  const fps = document.createElement('div');
  fps.style.cssText = 'font:22px monospace;color:#fff;background:#0008;padding:6px 8px;border-radius:10px';
  d.prepend(fps);
  let n = 0, t0 = performance.now(), worst = 0, last = t0;
  const tick = now => {
    n++; worst = Math.max(worst, now - last); last = now;
    if (now - t0 > 1000) { fps.textContent = `${Math.round(n * 1000 / (now - t0))}fps ${Math.round(worst)}ms${LITE ? ' LITE' : ''}`; n = 0; worst = 0; t0 = now; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
async function autoplay(stepMs = 380) {
  const r = solve(S, { width: 800 });
  if (!r) { toast('Solver: no solution'); return; }
  for (const a of r.path) {
    if (ended) break;
    if (a.draw) { if (!S.deck.length) onDeck(); onDeck(); }
    else doMove(a.src, a.dst, false);
    await wait(stepMs);
  }
}
window.__game = { variant: VARIANT, get S() { return S; }, get level() { return levelIdx + 1; }, startLevel, autoplay, doMove, onDeck, E, goHome,
  // cho harness test kéo thả (tests/naive-drag.browser.js)
  geo: () => ({ CW, CH, TAB_Y, scale, stageLeft, stageTop, slots: S.found.map((_, k) => slotPos(k)), cols: S.cols.map((_, i) => colX(i)) }),
  layout: () => computeLayout(), views: () => views,
  setState(s2) { S = s2; undoStack = []; clearHint(); tut(null); relayout({ dur: 0 }); updateSlotLabels(); updateHUD(); updateDeckUI(); },
  get toastText() { const el = $('toast'); return el && el.classList.contains('on') ? el.textContent : ''; },
  get tutText() { const el = $('tut'); return el && el.classList.contains('on') ? el.textContent : ''; },
  get scriptStep() { return scriptStep(); }, get panelTitle() { return panelOpen ? panelOpen.p.querySelector('.head').textContent : ''; },
  loadRun, saveRun, clearRun, playLevel,
  get tipDebug() { return { tutorial, tipGate, introHold: !!introHold, deferredIntro, tap: !!(S && tapTeachAction()), seen: save.seen }; },
  get busy() { return !!(drag || busyInput || panelOpen || ended || completing.size); },
  // R12/R13: màn thắng, cài đặt, các bảng (tests/win-screen.browser.js, tests/settings.browser.js)
  get win() { return winInfo && { level: winInfo.level, reward: winInfo.reward, paid: winInfo.paid(), ended: !!(winTL && winTL.ended), skipped: !!(winTL && winTL.skipped), active: !!winTL }; },
  settings: { get: getSetting, set: setSetting, music: isMusicOn, haptics: hapticsEnabled, sfx: sfxVolume, reduceMotion },
  settingsPanel, pausePanel, showRules: () => showRules(() => {}, 'test'), openAlbum, askResume, confirmRestart, outOfMoves, finishWin,
  // R5, L1, L2 (tests/r5-chapters.browser.js, tests/daily.browser.js)
  get levels() { return LEVELS.map(l => ({ id: l.id, source: l.source || 'base', role: l.role, tip: l.tip || '' })); },
  chapters: CHAPTERS, get homeCh() { return homeCh.id; }, get homePage() { return homePage; }, openChapterTeaser, chapterReward, get daily() { return dailyRun && { key: dailyRun.key, catchup: !!dailyRun.catchup, replay: !!dailyRun.replay, src: dailyRun.src }; },
  get save() { return save; }, persist, curLevel, decorOf, startDaily, dailyPanel, dailyFor, loadDailyRun, refreshHome, dailyPool: () => getDailyPool().map(e => e.src),
  live: { setNow(v) { const off = (typeof v === 'number' ? v : new Date(v).getTime()) - Date.now(); LIVE.setClock(() => Date.now() + off); }, reset() { LIVE.setClock(null); },
    state: () => LIVE.liveState(save.live, LIVE.nowMs(), wonLevel()), today: () => LIVE.dayKey(today()), touch() { LIVE.touch(save.live); persist(); } },
  // L3–L5 (tests/home-liveops.browser.js): về màn chính như từ một level, hàng đợi popup, Thẻ tuần, điểm chạm
  returnHome(chId) { $('home').classList.add('off'); goHome(chId); }, homePopups, get popupLog() { return popupLog.slice(); }, newVisit,
  weekly: () => weekly(), giftsDue, refreshEventTile,
  config: () => configInfo(), CONF,
  notif: { sync: notifSync, prompt: notifPrompt, askDue: () => notifAskDue(), NT }, rest: { add(ms) { restT.st.active += ms; }, get state() { return { ...restT.st, pending: restPending }; } },
  // L6–L10 (tests/events.browser.js)
  ev: { state: () => { const e = evState(); return e.cur ? { id: e.cur.id, k: e.cur.k, key: e.cur.key, s: JSON.parse(JSON.stringify(e.s)) } : null; }, panel: eventPanel,
    get seasonCard() { return seasonCard; }, get seasonKey() { return seasonKey; }, EV },
  touchPoints: () => [...document.querySelectorAll('#home [data-touch]')].filter(el => el.offsetParent && getComputedStyle(el).visibility !== 'hidden').map(el => el.dataset.touch) };

// đổi ngôn ngữ giữa ván: viết lại tên chủ đề trên lá vương miện
function relabelCards() {
  for (const v of views.values()) {
    const tag = v.card && v.card.k === 'topic' && v.el.querySelector('.tag');
    if (tag) { tag.textContent = topicName(v.card.t); tag.style.cssText = tagStyle(topicName(v.card.t)); }
  }
}
// ============================================================ boot
function applyStaticCopy() {
  movesEl.querySelector('.lbl').textContent = t('moves');
  document.documentElement.lang = getLang();
  $('albumBtn').querySelector('.lbl').textContent = t('album');
  $('albumBtn').setAttribute('aria-label', t('album'));
  $('decorBtn').querySelector('.lbl').textContent = t('decorate');
  $('decorBtn').setAttribute('aria-label', t('decorate'));
  $('homeCoins').setAttribute('aria-label', t('coins_aria'));
  $('albumClose').setAttribute('aria-label', t('close'));
  $('ch2Close').setAttribute('aria-label', t('close'));
  $('rotateTxt').textContent = t('rotate');
  $('ch2Title').textContent = t('ch2_title');
  $('ch2Sub').textContent = t('ch2_sub');
  $('ch2Soon').textContent = t('ch2_soon');
  $('ch2Stamps').textContent = t('ch2_stamps');
  $('ch2Npc').innerHTML = t('ch2_npc');
  $('ch2Decor').textContent = t('ch2_decor');
  $('ch2Tip').textContent = t('ch2_tip');
  $('albumTitle').textContent = t('album_title');
  $('gearBtn').setAttribute('aria-label', t('settings_aria'));
}
let booting = true;            // lúc mở app: hộp "Chơi tiếp ván dở" được ưu tiên hơn popup tính năng mới (tối đa 1 popup)
(async function boot() {
  applyStaticCopy();
  initFx($('fx'));
  setFxSize(STAGE_H);
  applySettings();
  buildDebug();
  try { manifest = await (await fetch('assets/manifest.json')).json(); } catch (e) { manifest = {}; }
  await preload(['back', 'topic_frame', 'crown', 'slot_tray', 'tray_front', 'btn_undo_off', 'hud_moves', 'token', 'joker_card', 'envelope_closed', 'wax', 'hand', 'coin', 'tem_diem', 'lock', 'plus', 'recycle', 'radial', 'logo',
    'face_1', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6', 'ic_hint', 'ic_magnet', 'ic_wild', 'banner', 'bar_track', 'tipbox', 'ribbon', 'btn_primary', 'btn_primary_down', 'btn_secondary', 'btn_secondary_down',
    'btn_close', 'btn_pause', 'btn_undo', 'deck_tag', 'panel', 'mailbag_open', 'mailbag_full', 'ic_settings', 'ic_album', 'ic_decor', 'ic_daily', 'level_pin', 'chapter_sign']
    .map(n => `assets/ui/${n}.png`).concat(['assets/ui/bg_game_tall.jpg']));
  preloadFx();
  initAudio();
  track('config_load', { source: CFG_INFO.source, warnings: CFG_INFO.warnings.length, version: CFG_INFO.cfg.version });
  if (CFG_INFO.warnings.length && DEBUG) console.warn('liveops.json:', CFG_INFO.warnings.join(' | '));
  track('app_open', { lite: LITE, ab_hard: AB.hard ? AB.hard.join('-') : 'default', ab_safety: AB.safety || 'default' });
  goHome();
  const m = location.search.match(/level=(\d+)/);
  booting = false;
  if (m) playLevel(+m[1] - 1);
  else { newVisit(); homePopups('boot'); }       // tối đa 1 popup lúc mở app: ván dở (R10) > phong bì quà > tính năng mới
  notifSync('open');                             // L11: xếp lại lịch 7 ngày mỗi lần mở app (chỉ app native, khi đã bật)
})();
