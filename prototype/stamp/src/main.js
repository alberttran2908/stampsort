import { LEVELS as LEVELS_A } from './levels.js';
import { LEVELS as LEVELS_B } from './levels_b.js';
import * as E from './engine.js';
import { hint as solverHint, solve } from './solver.js';
import { initAudio, unlockAudio, sfx, comboSfx, haptic, setMuted, isMuted } from './audio.js';
import { tween, ease, wait, initFx, sparkle, confetti, coinFly, ring, killTweens, killKey, setLite, clearParticles } from './fx.js';
import { candidateActions, isDeadlocked } from './solver.js';
import { track, events as allEvents, funnelSummary, clearEvents, setCommon } from './analytics.js';
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
const GIFTS = { hint: 3, pack: 2, stamper: 2, joker: 1 };
// Tem Điểm (thay sao, gdd-core.md mục 5 + concept mục 5 "Bưu điện nhỏ"): mỗi level 1-3 Tem Điểm theo moves dư.
// Tổng kiếm được = tổng điểm CAO NHẤT từng level (chơi lại để nâng điểm thì được phần chênh). Tiêu vào decor màn hình chính,
// mở lần lượt; decor không cho perk gameplay. Giá [GIẢ THUYẾT]: tổng 24 / tối đa 30 của chương 1 -> trung bình ~2.4 điểm/level
// là đủ cả phòng, món cuối thường cần chơi lại 1-2 level.
const DECOR = [
  { id: 'bunting', cost: 2 }, { id: 'frame', cost: 3 }, { id: 'clock', cost: 4 },
  { id: 'postbox', cost: 4 }, { id: 'board', cost: 5 }, { id: 'cat', cost: 6 },
];   // Joker 1: quà 2 lá làm L10 "trông khó" mà không "thấy khó"
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
const LEVELS = VARIANT === 'b' ? LEVELS_B : LEVELS_A;
setCommon({ variant: VARIANT });
const specialOf = lv => ((AB.hard ? AB.hard.includes(lv.id) : !!lv.special) ? (lv.special || 'hard') : null);
const safetyOf = lv => (specialOf(lv) ? (AB.safety || lv.safety || 'overtime') : 'none');
const BOOSTERS = [
  { id: 'hint', name: 'Hint', icon: 'assets/ui/ic_hint.png' },
  { id: 'pack', name: 'Pack', icon: 'assets/ui/ic_pack.png' },
  { id: 'stamper', name: 'Stamper', icon: 'assets/ui/ic_stamper.png' },
  { id: 'joker', name: 'Joker', icon: 'assets/ui/ic_joker.png' },
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

// ============================================================ save
const SAVE_KEY = 'stampsort_proto_v1' + (VARIANT === 'b' ? '_b' : '');   // tiến trình riêng cho từng bộ level
const defaultSave = () => ({ unlocked: 1, coins: 500, stars: {}, hint: 0, pack: 0, stamper: 0, joker: 0, slot: 0, seen: {}, attempts: {} });
let save = defaultSave();
try { save = { ...defaultSave(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch (e) { /* ignore */ }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

// ============================================================ stage scaling
let scale = 1, stageLeft = 0, stageTop = 0;
function safeInsets() {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:0;top:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none';
  document.body.append(d);
  const cs = getComputedStyle(d);
  const r = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  d.remove();
  return r;
}
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
  const sat = ins.top / scale, sab = ins.bottom / scale;
  const extra = STAGE_H - 1920;
  const free = Math.max(0, extra - sat - sab);
  DY_HUD = sat;                                    // HUD tránh tai thỏ
  DY_BOARD = sat + free * 0.3;                     // phần dư: 30% đẩy bàn chơi xuống, 70% cho chiều sâu cột bài
  DY_BOT = extra - sab;                            // thanh booster neo theo đáy, tránh thanh home
  layoutRows();
  stage.style.height = STAGE_H + 'px';
  for (const [k, v] of [['--hud', DY_HUD], ['--bd', DY_BOARD], ['--bot', DY_BOT], ['--mid', extra / 2], ['--extra', extra]]) stage.style.setProperty(k, v + 'px');
  const fxc = document.getElementById('fx');
  if (fxc) { fxc.height = STAGE_H; fxc.style.height = STAGE_H + 'px'; }
  stage.style.transform = `scale(${scale})`;
  stage.style.left = stageLeft + 'px';
  stage.style.top = stageTop + 'px';
}
addEventListener('resize', () => { fit(); placeChrome(); });
fit();
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
}
const toStage = e => ({ x: (e.clientX - stageLeft) / scale, y: (e.clientY - stageTop) / scale });

// ============================================================ assets
let manifest = {};
const slug = t => t.toLowerCase().replace(/ /g, '_').replace(/&/g, 'and');
const artUrl = c => `assets/cards/${slug(c.t)}/${c.art}.png`;
const iconUrl = t => `assets/cards/${slug(t)}/icon.png`;
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
let undoLeft = 3;
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
let play = { start: 0, attempt: 0, boosters: 0, undo: 0, rescues: 0, continues: 0 };   // số liệu ván hiện tại cho analytics
let levelActive = false;
let extraKept = -1;          // level đã mua Ô phụ (giữ khi Retry cùng level)
let levelToken = 0;
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
  let total = 0;
  for (let j = 0; j < col.length - 1; j++) total += col[j].up ? UP_GAP : DOWN_GAP;
  const maxH = TAB_BOTTOM - TAB_Y - CH;
  const f = total > maxH ? maxH / total : 1;
  const ys = [];
  let y = TAB_Y;
  for (let j = 0; j < col.length; j++) {
    ys.push(y);
    y += (col[j].up ? UP_GAP : DOWN_GAP) * f;
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
    front.innerHTML = `<div class="crown"></div><div class="cnt">0/${card.n}</div><img class="art" src="${iconUrl(card.t)}" draggable="false"><div class="tag" style="font-size:${fitSize(topicName(card.t), 30, 9)}px">${topicName(card.t)}</div>`;
  } else if (card.k === E.JOKER) {
    el.classList.add('joker');
  } else {
    front.style.backgroundImage = `url(assets/ui/face_${faceIndex(card)}.png)`;
    front.innerHTML = `<img class="art" src="${artUrl(card)}" draggable="false">`;
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
  return n <= fitChars ? base : Math.max(22, Math.floor(base * fitChars / n));
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
      rb.style.fontSize = fitSize(nm, 30, 9) + 'px';
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
  $('coins').querySelector('span').textContent = save.coins;
  $('title').textContent = `Level ${levelIdx + 1}`;
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
function bumpCoins() {
  const el = $('coins');
  const o = { s: 1.2 };
  $('coins').querySelector('span').textContent = save.coins;
  tween(o, { s: 1 }, { dur: 220, easing: ease.outBack, key: 'coinbump', onUpdate: () => { el.style.transform = `scale(${o.s})`; } });
}
function coinsTo(n, fromX, fromY) {
  const hudX = 1080 - 150 - 120, hudY = 72;
  const per = Math.max(1, Math.round(n / Math.min(n, 12)));
  let left = n;
  const count = Math.min(n, 12);
  coinFly(fromX, fromY, hudX, hudY, count, () => {
    const add = Math.min(per, left);
    left -= add;
    save.coins += add;
    sfx('coin', { vol: 0.5, rate: 1 + Math.random() * 0.2 });
    bumpCoins();
    if (left > 0 && count === 1) { save.coins += left; left = 0; }
    persist();
  });
  setTimeout(() => { if (left > 0) { save.coins += left; left = 0; bumpCoins(); persist(); } }, 1800);
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
    const locked = lv < UNLOCK_AT[d.id];
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
    if (locked) { badge.style.display = 'none'; b.querySelector('.name').textContent = `Lv ${UNLOCK_AT[d.id]}`; continue; }
    badge.style.display = '';
    b.querySelector('.name').textContent = t('b_' + d.id);
    if (count > 0) { badge.className = 'badge'; badge.textContent = count; }
    else { badge.className = 'badge coin'; badge.textContent = COSTS[d.id]; }
  }
  const u = $('undoBtn');
  u.querySelector('.lbl').textContent = t('b_undo');
  const ub = u.querySelector('.badge');
  if (undoLeft > 0) { ub.className = 'badge'; ub.textContent = undoLeft; }
  else { ub.className = 'badge coin'; ub.textContent = COSTS.undo; }
  u.classList.toggle('off', !undoStack.length);
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
  sfx('close');
  return false;
}
function onBooster(id) {
  if (ended || busyInput) return;
  const lv = levelIdx + 1;
  if (id !== 'undo' && lv < UNLOCK_AT[id]) { toast(t('unlocks', { n: UNLOCK_AT[id] })); sfx('close'); return; }
  if (scriptStep() && scriptStep().booster !== id) { toast(t('follow'), 1000); return; }
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
function pushUndo() {
  undoStack.push({ s: E.clone(S), combo });
  if (undoStack.length > 60) undoStack.shift();
}
function doUndo() {
  if (!undoStack.length) { toast(t('nothing_undo')); sfx('close'); return; }
  if (!spend('undo')) return;
  const snap = undoStack.pop();
  // Undo không xoá thông tin: lá đã lộ trên cột vẫn ngửa sau khi hoàn tác (bỏ lỗ hổng "đi thử, nhìn lá úp, Undo")
  const seen = new Set(S.cols.flat().filter(c => c.up).map(c => c.id));
  S = snap.s;
  S.cols.forEach(col => col.forEach(c => { if (seen.has(c.id)) c.up = true; }));
  combo = snap.combo;
  clearHint();
  sfx('back');
  haptic(8);
  // view của các lá đã trả về
  relayout({ dur: 260 });
  updateSlotLabels();
  updateHUD(true);
}

// ---- hint
function clearHint() {
  clearTimeout(hintTimer);
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
  if (loopHand) handDrag(v0.x + CW / 2, v0.y + CH / 2, to.x, to.y);
  return true;
}
function doHint() {
  const a = computeHint();
  if (!a) { toast(t('no_hint')); sfx('close'); return; }
  if (!spend('hint')) return;
  sfx('hint');
  if (!showAction(a)) toast(t('try_deck'));
  hintTimer = setTimeout(clearHint, 4000);
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
    if (scriptStep()) return;
    jokerMode = false; clearHint(); tut(null); updateDeckUI(); renderBoosters(); return;
  }
  if (!jokerFree && save.joker <= 0 && save.coins < COSTS.joker) { toast(t('coins_short')); sfx('close'); return; }
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
    ring(T.x + CW / 2, T.y + CH / 2, { color: '#ffd84a' });
    sparkle(T.x + CW / 2, T.y + CH / 2, 16, { colors: ['#ffd84a', '#fff4a0', '#ffffff'] });
    sfx('open');
    haptic(20);
  });
  relayout({ except: new Set([id]) });
  updateHUD();
  undoStack = [];      // không undo joker
  renderBoosters();
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
function startPick(kind) {
  if (pickMode === kind) { cancelPick(); return; }
  if (kind === 'stamper') {
    const cols = S.cols.map((_, i) => i).filter(hasHidden);
    if (!cols.length) { toast(t('no_hidden')); sfx('close'); return; }
    if (save[kind] <= 0 && save.coins < COSTS[kind]) { toast(t('coins_short')); sfx('close'); return; }
    pickMode = kind;
    sfx('joker');
    cols.forEach(i => { const c = S.cols[i][S.cols[i].length - 1]; if (c) views.get(c.id).el.classList.add('hintglow'); });
    if (!scriptStep()) tut(t('pick_stamper'));
    renderBoosters();
    return;
  }
  const piles = S.found.map((_, k) => k).filter(pullable);
  if (!piles.length) { toast(t('open_pile_first')); sfx('close'); return; }
  if (save[kind] <= 0 && save.coins < COSTS[kind]) { toast(t('coins_short')); sfx('close'); return; }
  if (kind === 'pack' && piles.length === 1) { applyPull(piles[0], kind); return; }
  pickMode = kind;
  sfx('joker');
  piles.forEach(k => slotEl(k).classList.add('target'));
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
  haptic([10, 30, 10]);
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
  if (!pullable(k)) { toast(t('none_left')); sfx('close'); return; }
  if (!spend(kind)) return;
  const res = E.pullToFoundation(S, k, kind === 'pack' ? 2 : 1);
  if (!res.ok) return;
  undoStack = [];
  clearHint();
  const p = slotPos(k);
  if (kind === 'stamper') stampSlam(p.x + CW / 2, p.y + CH / 2);
  else { sfx('magnet'); ring(p.x + CW / 2, p.y + CH / 2, { color: '#5fd3ff', r1: 260, width: 12 }); }
  haptic([10, 30, 10]);
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
    sfx('complete', { vol: 0.8, rate: 1.2 });
    shake(7);
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
  if (levelIdx + 1 < UNLOCK_AT.slot) { toast(t('unlocks', { n: UNLOCK_AT.slot })); sfx('close'); return; }
  panel({
    title: t('extra_title'),
    body: `<div class="feature-icon" style="background-image:url(assets/ui/slot_tray.png);width:230px;height:224px"></div><p>${t('extra_body')}</p>`,
    buttons: [
      { label: t('free_ad'), cls: 'orange', act: () => fakeAd(unlockExtra) },
      { label: t('coins', { n: COSTS.slot }), act: () => {
        if (save.coins < COSTS.slot) { toast(t('coins_short')); setTimeout(() => onExtraSlot(), 300); return; }
        save.coins -= COSTS.slot; persist(); bumpCoins(); unlockExtra();
      } },
      { label: t('close'), cls: 'brown', act: () => {} },
    ],
  });
}
function unlockExtra() {
  E.addExtraSlot(S);
  extraKept = levelIdx;
  undoStack = [];
  sfx('slot');
  haptic([10, 30, 10]);
  ring(EXTRA_X + CW / 2, ROW_A + CH / 2, { color: '#8cff7a', r1: 200 });
  sparkle(EXTRA_X + CW / 2, ROW_A + CH / 2, 22, { colors: ['#8cff7a', '#fff', '#ffe36b'] });
  updateDeckUI();
  updateSlotLabels();
}

// ============================================================ hand / tutorial / toast
const handEl = $('hand');
let handAnim = null;
function hideHand() { handAnim = null; handEl.style.opacity = 0; }
function handDrag(x0, y0, x1, y1) {
  const token = {};
  handAnim = token;
  const h = { x: x0, y: y0, o: 0, s: 1 };
  const draw = () => { handEl.style.opacity = h.o; handEl.style.transform = `translate(${h.x - 30}px,${h.y - 10}px) scale(${h.s})`; };
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
function handTap(x, y) {
  const token = {};
  handAnim = token;
  const h = { x, y, o: 1, s: 1 };
  const draw = () => { handEl.style.opacity = h.o; handEl.style.transform = `translate(${h.x - 30}px,${h.y - 10}px) scale(${h.s})`; };
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
  const t = $('toast');
  t.innerHTML = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), ms);
}
function tut(html) {
  const t = $('tut');
  clearTimeout(tutTimer);
  if (!html) { t.classList.remove('on'); return; }
  const deepest = S ? Math.max(0, ...S.cols.map(col => (col.length ? colOffsets(col)[col.length - 1] : TAB_Y) + CH)) : 0;
  if (!script && deepest > 1490 + DY_BOT) { t.classList.remove('on'); toast(html, 2600); return; }
  t.innerHTML = html;
  t.classList.add('on');
  if (!script) tutTimer = setTimeout(() => t.classList.remove('on'), 6000);   // gợi ý tự ẩn, không nằm mãi trên màn
}
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
    script = null;
    tut(null);
    clearHint();
    tutorialCheck();
    resetIdleHint();
    return;
  }
  tut(t(step.booster ? 'script_' + step.booster : `script_${L.id}_${script.i}`) || step.text);
  if (step.info) {
    clearHint();
    setTimeout(() => { if (scriptStep() === step) { script.i++; runScript(); } }, step.ms || 2600);
    return;
  }
  if (step.booster) { showBoosterStep(step); return; }
  showAction(scriptAction(step));
}
function boosterCenter(id) {
  // vị trí thật trên stage (thanh booster neo theo đáy màn hình, dàn đều)
  const b = $('boosters').querySelector(`[data-id=${id}]`);
  return { x: b.parentElement.offsetLeft + b.offsetLeft + b.offsetWidth / 2, y: b.parentElement.offsetTop + b.offsetTop + b.offsetHeight / 2 };
}
function showBoosterStep(step) {
  clearHint();
  const inMode = (step.booster === 'joker' && jokerMode) || pickMode === step.booster;
  $('boosters').querySelectorAll('.booster').forEach(b => b.classList.toggle('active', b.dataset.id === step.booster && !inMode));
  if (!inMode) { const c = boosterCenter(step.booster); handTap(c.x, c.y); return; }
  if (step.booster === 'stamper') { const ci = stamperCol(step); const col = S.cols[ci]; const ys = colOffsets(col); handTap(colX(ci) + CW / 2, (col.length ? ys[ys.length - 1] : TAB_Y) + CH / 2); }
  else if (step.slot != null) { const p = slotPos(step.slot); slotEl(step.slot).classList.add('target'); handTap(p.x + CW / 2, p.y + CH / 2); }
  else { const col = S.cols[step.col]; const ys = colOffsets(col); handTap(colX(step.col) + CW / 2, (col.length ? ys[ys.length - 1] : TAB_Y) + CH / 2); }
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
  sfx('close', { vol: 0.5 });
  toast(t('follow'), 1000);
  const T = computeLayout();
  for (const v of views.values()) if (T.get(v.id) && !v.gone) moveView(v, T.get(v.id), { dur: 220, easing: ease.outBackSoft });
  showAction(scriptAction(scriptStep()));
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
function findAction(pred) {
  const acts = E.legalMoves(S);
  // ưu tiên chồng dài nhất (giống solver)
  return acts.find(a => pred(a) && (a.src.from === 'waste' || a.src.idx === E.maxRunStart(S, a.src.i))) || null;
}
function tutorialCheck(events = []) {
  if (tutorial) {
    const step = TUTS.find(t => t.id === tutorial.id);
    if (step.info ? events.length : step.done && step.done(events)) {
      tutorial = null; tut(null); clearHint();
    } else if (!step.info) {
      // làm lại mũi tên theo state mới
      const a = step.action ? step.action() : step.when();
      if (a) showAction(a); else { tutorial = null; tut(null); clearHint(); }
      return;
    } else return;
  }
  for (const step of TUTS) {
    if (!step.lv.includes(levelIdx + 1) || save.seen[step.id]) continue;
    if (!canTip()) return;
    const a = step.when();
    if (!a) continue;
    markTip();
    save.seen[step.id] = 1;
    persist();
    tutorial = { id: step.id };
    track('tip_shown', { level: levelIdx + 1, key: step.id });
    tut(typeof step.text === 'function' ? step.text() : step.text);
    if (!step.info) showAction(step.action ? step.action() : a);
    else setTimeout(() => { if (tutorial && tutorial.id === step.id) { tutorial = null; tut(null); } }, 3800);
    return;
  }
}
function resetIdleHint() {
  clearTimeout(idleTimer);
  if ((levelIdx + 1 > 3 && !specialOf(L)) || ended || script) return;
  // level khó: giữ khoảnh khắc tự nghĩ ra và giá trị của Hint -> chỉ gợi ý miễn phí sau lần kẹt/Overtime đầu tiên, chờ lâu hơn
  if (specialOf(L) && !overtime && !play.rescues) return;
  idleTimer = setTimeout(() => {           // level đầu và level khó: đứng im thì gợi ý miễn phí
    if (ended || tutorial || jokerMode) return;
    const a = computeHint();
    showAction(a);
    hintTimer = setTimeout(clearHint, 3500);
  }, specialOf(L) ? 20000 : 7000);
}

// ============================================================ panels
let panelOpen = null;
function panel({ title, body = '', buttons = [], radial = false, onOpen }) {
  closePanel(true);
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const p = document.createElement('div');
  p.className = 'panel';
  p.innerHTML = `<div class="head">${title}</div>${body}<div class="btns"></div>`;
  const btns = p.querySelector('.btns');
  for (const b of buttons) {
    const el = document.createElement('div');
    el.className = 'btn ' + (b.cls || '');
    el.innerHTML = b.label;
    el.addEventListener('pointerup', ev => {
      ev.stopPropagation();
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
  if (radial) { const r = document.createElement('div'); r.className = 'radial'; scrim.append(r); }
  overlay.append(scrim, p);
  requestAnimationFrame(() => { scrim.classList.add('on'); p.classList.add('on'); });
  panelOpen = { scrim, p };
  onOpen && onOpen(p);
  return p;
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
    if (st && st.booster === 'stamper' && i !== stamperCol(st)) { toast(t('tap_column')); sfx('close', { vol: 0.5 }); return; }
    if (i >= 0 && hasHidden(i)) applyReveal(i); else cancelPick();
    return;
  }
  if (pickMode) {
    const k = slotAt(p);
    const st = scriptStep();
    if (st && st.booster && k !== st.slot) { toast(t('tap_pile')); sfx('close', { vol: 0.5 }); return; }
    if (k >= 0 && S.found[k] && pullable(k)) applyPull(k, pickMode); else cancelPick();
    return;
  }
  if (jokerMode) {
    const i = colAt(p);
    const st = scriptStep();
    if (st && st.booster && i !== st.col) { toast(t('tap_column')); sfx('close', { vol: 0.5 }); return; }
    if (i >= 0) placeJokerAt(i); else toggleJoker();
    return;
  }
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;
  const v = cardEl._view;
  const loc = locate(v.id);
  if (!loc || (loc.from === 'col' && !E.runAt(S, loc.i, loc.idx))) {
    // lá úp, hoặc lá bị tem khác loại đè lên: rung nhẹ và nói lý do
    if (loc && loc.from === 'col') {
      const col = S.cols[loc.i];
      nudge(col.slice(loc.idx).map(c => views.get(c.id)));
      if (!col[loc.idx].up) { toast(t('err_facedown'), 1400); teachOnError('facedown'); }
      else { toast(t('err_mixed'), 1700); teachOnError('mixed'); }
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
  if (!drag.moved && Math.hypot(dx, dy) > 12) {
    drag.moved = true;
    sfx('pick', { vol: 0.8 });
    haptic(6);
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
    highlightTargets(drag.cands);
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
  if (!d.moved) {
    // chạm: tự tìm đích
    if (scriptStep()) {
      const a = scriptAction(scriptStep());
      if (a && !a.draw && scriptAllows(d.src, a.dst)) doMove(d.src, a.dst, false); else scriptReject(d.vs);
      return;
    }
    const pick = bestTapFor(d.cands);
    // chạm không tự mở ô trống CUỐI CÙNG (quyết định dễ gây kẹt): phải kéo vào nếu chắc chắn
    if (pick && pick.dst.to === 'found' && !S.found[pick.dst.i] && S.found.filter(f => !f).length === 1) {
      nudge(d.vs); sfx('close', { vol: 0.5 }); toast(t('err_last_slot'), 2000);
      track('last_slot_tap_blocked', { level: levelIdx + 1 });
    } else if (pick) doMove(pick.src, pick.dst, false);
    else rejectTap(d.src, d.vs);
    return;
  }
  const p = toStage(e);
  // Lượt 1: chỗ NGÓN TAY thả, thử mọi cách hiểu cú cầm (xấp lớn nhất trước). Lượt 2 (dự phòng): tâm lá đáy của xấp.
  let pick = null;
  for (const src of d.cands) { const dst = targetAt(src, p); if (dst) { pick = { src, dst }; break; } }
  if (!pick) for (const src of d.cands) {
    const v0 = views.get(E.sourceCards(S, src)[0].id);
    const dst = targetAt(src, { x: v0.x + CW / 2, y: v0.y + CH / 2 });
    if (dst) { pick = { src, dst }; break; }
  }
  d.vs.forEach(v => { v.lifted = false; v.el.classList.remove('lift'); });
  if (pick) doMove(pick.src, pick.dst, true);
  else {
    const why = scriptStep() ? t('follow') : dropReason(d.cands[d.cands.length - 1], p);   // lý do theo lá đang cầm
    if (why) { toast(why, 1600); if (!scriptStep()) teachOnError('drop'); }
    sfx('close', { vol: 0.5 });
    const T = computeLayout();
    d.vs.forEach(v => { moveView(v, T.get(v.id), { dur: 260, easing: ease.outBackSoft }).then(() => setZ(v, T.get(v.id).z)); });
  }
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
  sfx('close', { vol: 0.5 });
  haptic(4);
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
    if (a) { showAction(a); hintTimer = setTimeout(clearHint, 3500); }
  }, 700);
}
// Nhịp gợi ý: mỗi lần một khái niệm, cách nhau >= 4 nước và 7 giây, tối đa 3 gợi ý mỗi level (chống quá tải).
let tipGate = { used: -99, t: 0, count: 0 };
function canTip() {
  if (script || tutorial || !S) return false;
  return S.used - tipGate.used >= 4 && Date.now() - tipGate.t >= 7000 && tipGate.count < 3;
}
function markTip() { tipGate = { used: S.used, t: Date.now(), count: tipGate.count + 1 }; }
// Gợi ý một lần cho mỗi khái niệm, đúng lúc nó xảy ra (just-in-time).
function onceTip(key, vars = {}, ms = 3200) {
  if (save.seen['tip_' + key] || !canTip()) return false;
  markTip();
  save.seen['tip_' + key] = 1;
  persist();
  track('tip_shown', { level: levelIdx + 1, key });
  tut(t('tip_' + key, vars));
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
function highlightTargets(cands) {
  for (const dst of cands.flatMap(allTargets)) {
    if (dst.to === 'found') slotEl(dst.i).classList.add('target');
    else {
      const col = S.cols[dst.j];
      if (col.length) views.get(col[col.length - 1].id).el.classList.add('hintglow');
      else colZones[dst.j].classList.add('target');
    }
  }
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
  clearHint();
  resetIdleHint();
  playEvents(res.events, fromDrag);
}
function onDeck() {
  if (ended || busyInput || panelOpen || jokerMode) return;
  if (pickMode) { if (!(scriptStep() && scriptStep().booster)) cancelPick(); return; }
  if (!S.deck.length && !S.waste.length) return;
  if (scriptStep() && !scriptStep().draw) { scriptReject(); return; }
  const before = E.clone(S);
  const res = E.draw(S);
  if (!res.ok) { if (res.why === 'no_moves') outOfMoves(); return; }
  undoStack.push({ s: before, combo });
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
        haptic(5);
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
        ring(p.x + CW / 2, p.y + CH / 2, { color: '#ffd84a', r1: 150 });
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
        haptic(10);
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
    } else if (ev.type === 'flip') {
      const v = views.get(ev.id);
      setTimeout(() => sfx('flip', { vol: 0.7 }), 120);
      // lật ra TEM VƯƠNG MIỆN = sự kiện thông tin quan trọng nhất (mở được ô mới): loé + âm riêng + rung nhẹ
      const c = v && v.card;
      if (c && c.k === 'topic') setTimeout(() => {
        const tt = T.get(ev.id) || { x: v.x, y: v.y };
        ring(tt.x + CW / 2, tt.y + CH / 2, { color: '#ffd84a', r1: 170, width: 10 });
        sparkle(tt.x + CW / 2, tt.y + 30, 14, { colors: ['#ffd84a', '#fff4a0', '#ffffff'] });
        sfx('open', { vol: 0.6, rate: 1.25 });
        haptic([8, 30, 8]);
      }, 260);
    } else if (ev.type === 'draw') {
      const v = views.get(ev.id);
      special.add(ev.id);
      setZ(v, 3000);
      sfx('draw', { vol: 0.7 });
      haptic(4);
      combo = 0;
      moveView(v, T.get(ev.id), { dur: 260, easing: ease.outCubic, arc: 30 }).then(() => setZ(v, T.get(ev.id).z));
      setUp(v, true, { delay: 30 });
    } else if (ev.type === 'recycle') {
      sfx('whoosh');
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
  if (script) { $('boosters').querySelectorAll('.booster').forEach(b => b.classList.remove('active')); script.i++; setTimeout(runScript, 420); }
  else tutorialCheck(events);
  afterAction();
}
function landSquash(v) {
  const o = { k: 0 };
  tween(o, { k: 1 }, { dur: 180, key: 'sq-' + v.id, onUpdate: () => { v.s = 1 + 0.06 * Math.sin(o.k * Math.PI) ; applyTransform(v); } })
    .then(() => { v.s = 1; applyTransform(v); });
}
function floatText(txt, x, y, color = '#ffe36b') {
  const el = document.createElement('div');
  el.textContent = txt;
  el.style.cssText = `position:absolute;left:0;top:0;font-size:56px;color:${color};text-shadow:0 4px 0 rgba(0,0,0,.3);z-index:4000;pointer-events:none;white-space:nowrap`;
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
  haptic([16, 40, 16]);
  shake(9);
  ring(cx, cy, { color: '#ffffff', r1: 230, width: 14 });
  sparkle(cx, cy, 26, { spread: 1.3, colors: ['#ffd84a', '#ff7a59', '#ffffff', '#fff4a0'], size: 12 });
  const sq = { s: 1 };
  tween(sq, { s: 0.92 }, { dur: 70, onUpdate: () => { e.s = 1.08 * sq.s; drawEnv(); } }).then(() =>
    tween(sq, { s: 1 }, { dur: 200, easing: ease.outBack, onUpdate: () => { e.s = 1.08 * sq.s; drawEnv(); } }));
  floatText(`${topicName(topic)} · ${t('to_resident', { name: residentOf(topic) })}`, cx, p.y - 30, '#ffffff');
  lastDelivered = topic;
  await wait(380);
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
  await tween(fly, { k: 1 }, { dur: 560, easing: ease.inOutCubic, onUpdate: () => {
    e.x = sx + (tx - sx) * fly.k; e.y = sy + (ty - sy) * fly.k - Math.sin(fly.k * Math.PI) * 140;
    e.r = -10 * Math.sin(fly.k * Math.PI); e.s = 1.08 - 0.86 * fly.k; drawEnv();
    wax.style.transform = `translate(${wx0 + (e.x - sx)}px,${wy0 + (e.y - sy)}px) rotate(${e.r}deg) scale(${e.s / 1.08})`;
    if (Math.random() < 0.35) sparkle(e.x + 115, e.y + 96, 1, { spread: 0.3 });
  } });
  env.remove(); wax.remove();
  // đến nơi: thanh nảy nhẹ + loé sáng ở đoạn vừa gửi
  sfx('coin', { vol: 0.5 });
  ring(tx + 115, ty + 96, { color: '#ffd84a', r1: 120, width: 10 });
  sparkle(tx + 115, ty + 96, 10, { colors: ['#ffd84a', '#ffffff', '#8cc8ff'] });
  bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump');
}
function shake(px) {
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
  if (E.isWon(S)) {
    ended = true;
    clearTimeout(idleTimer);
    tut(null);
    Promise.all(pending).then(() => wait(250)).then(same(winSequence));
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
  if (isStuck()) {
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
  sfx('feature');
  haptic([20, 40, 20]);
  floatText(t('overtime_big'), 540, 420, '#ffd36b');
  toast(t('overtime'), 2800);
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
    { const c = boosterCenter('pack'); handTap(c.x, c.y); }
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
const pointsSpent = () => DECOR.slice(0, save.decor || 0).reduce((a, d) => a + d.cost, 0);
const pointsLeft = () => pointsEarned() - pointsSpent();
// Sao theo phần moves dư so với lời giải tối ưu (gdd-core.md mục 5): slack = moves - tối ưu.
// 3★ nếu còn >= 50% slack, 2★ nếu >= 20%. Luật cũ (>= 25% ngân sách) gần như không ai đạt 3★.
function stars() {
  if (overtime) return 1;
  if (L.moves == null) return 3;
  const slack = Math.max(1, L.moves - (L.solverMoves || Math.round(L.moves * 0.8)));
  return S.moves >= 0.5 * slack ? 3 : S.moves >= 0.2 * slack ? 2 : 1;
}
async function winSequence() {
  levelActive = false;
  const lvNum = levelIdx + 1;
  const done = {
    level: lvNum, attempt: play.attempt, moves_used: S.used, moves_left: S.moves === Infinity ? 0 : S.moves,
    time_s: Math.round((Date.now() - play.start) / 1000), stars: stars(), overtime, boosters: play.boosters, undo: play.undo,
    rescues: play.rescues, continues: play.continues, special: specialOf(L) || '', safety: safetyOf(L),
  };
  track('level_complete', done);
  track('af_level_achieved', { af_level: lvNum, af_score: done.stars });      // sự kiện chuẩn AppsFlyer
  if (specialOf(L)) track(`milestone_level_${lvNum}`, done);                  // mốc UA (L5, L10)
  sfx('win');
  confetti(170);
  haptic([20, 60, 20, 60, 40]);
  const st = stars();
  const reward = 10 + st * 10;
  const lv = levelIdx + 1;
  const gain = Math.max(0, st - (save.stars[lv] || 0));     // Tem Điểm mới: chỉ phần vượt điểm cao nhất cũ
  save.stars[lv] = Math.max(save.stars[lv] || 0, st);
  if (gain) track('points_earned', { level: lv, gain, total: pointsEarned(), left: pointsLeft() });
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, lv + 1));
  extraKept = -1;
  persist();
  const token = levelToken;
  await wait(700);
  if (token !== levelToken) return;
  const last = lv === LEVELS.length;
  panel({
    title: last ? t('win_last') : st === 3 ? t('win_title') : st === 2 ? t('win_great') : t('win_ok'),
    radial: true,
    body: `<div class="stars"><i></i><i></i><i></i></div>
      <div class="pts-line">${gain ? t('pts_gain', { n: gain }) : t('pts_best', { n: save.stars[lv] })}</div>
      ${S.moves === Infinity ? '' : `<p>${t('moves_left', { n: S.moves })}</p>`}
      ${L.moves != null && !overtime && st < 3 ? `<p style="font-size:32px;margin:0">${t('stars_hint')}</p>` : ''}
      ${last ? `<p>${t('win_end')}</p>` : ''}
      ${lastDelivered ? `<p class="note"><b>${residentOf(lastDelivered)}:</b> “${residentNote(residentOf(lastDelivered))}”</p>` : ''}
      <div class="coins-line"><i></i><span>+${reward}</span></div>`,
    buttons: [
      { label: t('claim2'), cls: 'orange', act: () => fakeAd(() => {
        coinsTo(reward, 540, 900);
        const tk = levelToken;
        setTimeout(() => { if (tk === levelToken) (last ? chapterReward() : startLevel(levelIdx + 1)); }, 1300);
      }) },
      { label: last ? t('home') : t('cont'), act: () => (last ? chapterReward() : startLevel(levelIdx + 1)) },
    ],
    onOpen: pEl => {
      const ss = pEl.querySelectorAll('.stars i');
      // Tem Điểm "đóng cộp" từng cái (tiếng con dấu + chuông nhỏ lên dần)
      for (let k = 0; k < st; k++) setTimeout(() => { ss[k].classList.add('on'); sfx('place', { rate: 0.9 }); sfx('claim', { vol: 0.4, rate: 1 + k * 0.12, delay: 0.05 }); haptic(14); }, 380 + k * 300);
      setTimeout(() => coinsTo(reward, 540, 1000), 380 + st * 260 + 200);
    },
  });
}
// Cuối chương (L10): thưởng một lần + mời mở album -> lý do quay lại (đo D1)
function chapterReward() {
  if (save.chapter1) { goHome(); return; }
  save.chapter1 = 1;
  save.coins += 200;
  persist();
  track('chapter_complete', { chapter: 1 });
  sfx('feature');
  panel({ title: t('chapter_title'), radial: true,
    body: `<div class="feature-icon" style="background-image:url(assets/ui/envelope_closed.png)"></div><p>${t('chapter_body')}</p><div class="coins-line"><i></i><span>+200</span></div>`,
    buttons: [{ label: t('open_album'), act: () => { goHome(); openAlbum(); } }, { label: t('home'), cls: 'orange', act: () => goHome() }],
    onOpen: () => setTimeout(() => coinsTo(200, 540, 1000), 500) });
}
// Album tem: mọi chủ đề trong 10 level, tem đã gửi hiện ra, tem chưa có hiện mặt sau lá
function openAlbum() {
  const topics = [];
  const arts = {};
  for (const lvd of LEVELS) for (const c of [...lvd.columns.flat(), ...lvd.deck, ...(lvd.preplaced || []).flat()]) {
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
  $('albumBody').innerHTML = rows;
  $('albumCount').textContent = t('album_count', { n: have, total });
  $('album').classList.remove('off');
  track('album_open', { have, total });
}
$('albumBtn').addEventListener('pointerup', () => { unlockAudio(); sfx('click'); openAlbum(); });
$('decorBtn').addEventListener('pointerup', () => { unlockAudio(); sfx('click'); decorPanel(); });
$('albumClose').addEventListener('pointerup', () => { sfx('close'); $('album').classList.add('off'); });
function outOfMoves() {
  ended = true;
  sfx('lose');
  haptic([30, 50, 30]);
  track('level_fail', { level: levelIdx + 1, attempt: play.attempt, reason: 'out_of_moves', delivered: S.delivered, total: S.total, special: specialOf(L) || '' });
  if (safetyOf(L) === 'retry') {
    // Level khó kiểu "chơi lại miễn phí": không phạt, giữ Ô phụ, vào lại ngay
    panel({ title: t('soclose'), body: `<p>${t('soclose_body')}</p>`, buttons: [
      { label: t('try_again'), act: () => startLevel(levelIdx) },
      { label: t('more_ad'), cls: 'orange', act: () => fakeAd(() => addMoves(5, true, 'ad')) },
    ] });
    return;
  }
  const canFree = !freeMovesUsed;
  const buttons = [];
  if (canFree) buttons.push({ label: t('more_ad'), cls: 'orange', act: () => fakeAd(() => addMoves(5, true, 'ad')) });
  const short = save.coins < COSTS.moves;
  buttons.push({ cls: short ? 'off' : '', label: t('more_coins', { n: COSTS.moves }) + (short ? `<br><small>${t('coins_need', { n: COSTS.moves - save.coins })}</small>` : ''), act: () => {
    if (save.coins < COSTS.moves) { toast(t('coins_short')); outOfMoves(); return; }
    save.coins -= COSTS.moves; persist(); bumpCoins(); addMoves(5, false, 'coins');
  } });
  buttons.push({ label: t('retry'), cls: 'brown', act: () => startLevel(levelIdx) });
  const tp = topicProgress();
  panel({ title: t('oom_title'), body: `<p>${t('oom_body', { n: tp.total - tp.done })}</p>`, buttons });
}
function stuckPanel() {
  track('level_stuck', { level: levelIdx + 1, attempt: play.attempt, delivered: S.delivered, total: S.total, moves_left: S.moves });
  const buttons = [];
  if (levelIdx + 1 >= UNLOCK_AT.joker) buttons.push({ label: t('use_joker'), cls: 'orange', act: () => { toggleJoker(); } });
  if (levelIdx + 1 >= UNLOCK_AT.pack && S.found.some((_, k) => pullable(k))) buttons.push({ label: t('use_pack'), cls: 'orange', act: () => startPick('pack') });
  if (levelIdx + 1 >= UNLOCK_AT.slot && !S.extraSlot) buttons.push({ label: t('extra_slot'), cls: 'orange', act: () => onExtraSlot() });
  if (undoStack.length) buttons.push({ label: t('undo'), act: () => doUndo() });
  buttons.push({ label: t('retry'), cls: 'brown', act: () => startLevel(levelIdx) });
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
}
function fakeAd(done) {
  const p = panel({ title: t('ad_break'), body: '<p>(Mock rewarded ad)</p><p id="adc">2</p>', buttons: [] });
  let n = 2;
  const timer = setInterval(() => {
    n--;
    const c = p.querySelector('#adc');
    if (c) c.textContent = n;
    if (n <= 0) { clearInterval(timer); closePanel(); done(); }
  }, 700);
}

// ============================================================ level flow
async function startLevel(i) {
  closePanel(true);
  if (levelActive && L && S) track('level_quit', { level: levelIdx + 1, attempt: play.attempt, moves_used: S.used, delivered: S.delivered, total: S.total, time_s: Math.round((Date.now() - play.start) / 1000) });
  const nextIdx = Math.max(0, Math.min(LEVELS.length - 1, i));
  if (nextIdx !== levelIdx) extraKept = -1;
  levelIdx = nextIdx;
  levelToken++;
  clearParticles();
  completing.clear();
  L = LEVELS[levelIdx];
  S = E.createState(L);
  undoStack = [];
  undoLeft = 3;
  combo = 0;
  ended = false;
  pending = [];
  freeMovesUsed = false;
  jokerMode = false;
  tutorial = null;
  script = null;
  pickMode = null;
  lastMovesShown = null;
  lowWarned = false;
  tipGate = { used: -99, t: 0, count: 0 };
  deferredIntro = false;
  lastDelivered = null;
  overtime = false;
  jokerFree = false;
  movesEl.classList.remove('overtime');
  save.attempts = save.attempts || {};
  save.attempts[levelIdx + 1] = (save.attempts[levelIdx + 1] || 0) + 1;
  persist();
  play = { start: Date.now(), attempt: save.attempts[levelIdx + 1], boosters: 0, undo: 0, rescues: 0, continues: 0 };
  levelActive = true;
  document.body.classList.toggle('hard', !!specialOf(L));
  track('level_start', { level: levelIdx + 1, attempt: play.attempt, moves: L.moves ?? -1, special: specialOf(L) || '', safety: safetyOf(L) });
  clearHint();
  tut(null);
  $('home').classList.add('off');
  updateHUD();
  const token = levelToken;
  const pre = (L.preplaced || []).flat();
  const allCards = [...L.columns.flat(), ...L.deck, ...pre];
  const topics = [...new Set(allCards.map(c => c.t))];
  await preload(allCards.filter(c => c.k === 'stamp').map(artUrl).concat(topics.map(iconUrl)));
  if (token !== levelToken) return;
  setCardScale();
  // thứ tự chủ đề cố định theo dữ liệu level (deck + cột), để mỗi lần chơi lại màu khung không đổi
  faceOfTopic = new Map();
  [...L.columns.flat(), ...L.deck, ...(L.preplaced || []).flat()].forEach(c => faceIndex(c));
  buildChrome();
  for (const c of [...L.deck, ...L.columns.flat()]) makeView(c);
  // lá trong ô mở sẵn: hiện ngay tại ô
  const T0 = computeLayout();
  for (const c of pre) { const v = makeView(c); const t = T0.get(c.id); v.x = t.x; v.y = t.y; setZ(v, t.z); setUp(v, true, { animate: false }); applyTransform(v); }
  if (extraKept === levelIdx) E.addExtraSlot(S);        // Ô phụ đã mua ở lượt trước của level này vẫn giữ khi Retry
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
  if (L.moves != null && !save.seen.rules) {
    save.seen.rules = 1;
    persist();
    await bannerDone;
    if (token !== levelToken) return;
    await new Promise(res => showRules(res));
  }
  if (token !== levelToken) return;
  await featureIntro();
  if (token !== levelToken) return;
  if (L.script && !save.seen['script_' + L.id]) { script = { steps: L.script, i: 0 }; runScript(); return; }
  tutorialCheck();
  resetIdleHint();
}
let bannerEl = null;
function removeBanner() { if (bannerEl) { bannerEl.remove(); bannerEl = null; } }
function levelBanner() {
  removeBanner();
  const tp = topicProgress();
  const el = document.createElement('div');
  bannerEl = el;
  const sp = specialOf(L);
  el.innerHTML = (sp ? `<div class="hard-pill">${t(sp === 'superhard' ? 'superhard' : 'hard')}</div>` : '') + `<div style="font-size:110px;line-height:1">${t('level', { n: levelIdx + 1 })}</div>
    <div style="margin-top:22px;display:inline-block;padding:14px 34px;border-radius:30px;background:rgba(0,0,0,.25);font-size:46px">
      ${t('goal', { n: tp.total - tp.done, moves: L.moves == null ? t('goalInf') : t('goalMoves', { n: L.moves }) })}</div>`;
  el.style.cssText = `position:absolute;left:0;right:0;top:${660 + (STAGE_H - 1920) / 2}px;padding:40px 0 46px;text-align:center;color:#fff;background:rgba(50,32,20,.55);
    text-shadow:0 5px 0 #5a3a26,3px 0 0 #5a3a26,-3px 0 0 #5a3a26,0 -3px 0 #5a3a26;z-index:4000;pointer-events:none`;
  overlay.append(el);
  const o = { y: -60, a: 0, s: 0.6 };
  const draw = () => { el.style.transform = `translateY(${o.y}px) scale(${o.s})`; el.style.opacity = o.a; };
  draw();
  if (sp) { sfx('boom', { vol: 0.5 }); shake(8); }
  return tween(o, { y: 0, a: 1, s: 1 }, { dur: 380, easing: ease.outBack, onUpdate: draw })
    .then(() => wait(sp ? 1900 : 1300))
    .then(() => tween(o, { y: -40, a: 0 }, { dur: 260, onUpdate: draw }))
    .then(() => { el.remove(); if (bannerEl === el) bannerEl = null; });
}
// Luật thắng/thua (game gốc chỉ có vài câu ở level 1; mình làm rõ hơn): hiện ở level đầu có moves và trong Pause.
// Bảng luật bằng hình: 4 dòng, mỗi dòng <= 7 từ, kèm hình lá bài thật (show, don't tell).
function rulesHtml() {
  // hình minh hoạ ghép từ chính sprite trong game (lá vương miện Cat, tem mèo, phong bì, ô MOVES)
  const box = inner => `<div style="position:relative;flex:0 0 96px;height:124px">${inner}</div>`;
  const crownCard = box(`<div style="position:absolute;inset:0;background:url(assets/ui/topic_frame.png) center/100% 100%"></div>
    <img src="${iconUrl('Cat')}" style="position:absolute;left:20px;top:30px;width:56px;height:56px">
    <div style="position:absolute;left:30px;top:-12px;width:36px;height:34px;background:url(assets/ui/crown.png) center/contain no-repeat"></div>`);
  const stampCard = box(`<div style="position:absolute;inset:0;background:url(assets/ui/face_3.png) center/100% 100%"></div>
    <img src="assets/cards/cat/5.png" style="position:absolute;left:12px;top:16px;width:72px;height:72px">`);
  const env = box(`<div style="position:absolute;inset:8px -6px;background:url(assets/ui/envelope_closed.png) center/contain no-repeat"></div>
    <div style="position:absolute;left:30px;top:40px;width:36px;height:42px;background:url(assets/ui/wax.png) center/contain no-repeat"></div>`);
  const moves = box(`<div style="position:absolute;inset:0;background:url(assets/ui/hud_moves.png) center/100% 100%"></div>
    <div style="position:absolute;left:0;right:0;top:46px;text-align:center;font-size:44px;color:#4a2a1a">12</div>`);
  const undo = box(`<div style="position:absolute;left:4px;top:14px;width:88px;height:88px;background:url(assets/ui/btn_undo.png) center/contain no-repeat"></div>`);
  const row = (fig, txt) => `<div style="display:flex;align-items:center;gap:24px;margin:0 0 14px;text-align:left">${fig}
    <div style="font-size:38px;line-height:1.22;color:#5a3a26">${txt}</div></div>`;
  return `<div>${row(crownCard, t('r1'))}${row(stampCard, t('r2'))}${row(env, t('r3'))}${row(moves, t('r4'))}${row(undo, t('r6'))}
    <p style="font-size:32px;margin:4px 0 0">${t('r5')}</p></div>`;
}
function showRules(onClose) {
  panel({ title: t('howto'), body: rulesHtml(), buttons: [{ label: t('got_it'), act: () => onClose && onClose() }] });
}
let deferredIntro = false;
function featureIntro(force = false) {
  const u = L.unlock;
  if (!u || save.seen['unlock_' + u]) return Promise.resolve();
  // Hint ở L2: đừng dồn ngay sau bảng luật; giới thiệu sau vài nước, lúc người chơi bắt đầu cần
  if (u === 'hint' && !force) { deferredIntro = true; return Promise.resolve(); }
  deferredIntro = false;
  save.seen['unlock_' + u] = 1;
  const icons = { hint: 'assets/ui/ic_hint.png', pack: 'assets/ui/ic_pack_big.png', stamper: 'assets/ui/ic_stamper.png', joker: 'assets/ui/joker_card.png' };
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
        { const c = boosterCenter(u); handTap(c.x, c.y); }
        setTimeout(() => { hideHand(); res(); }, 1800);
      } }],
    });
  });
}

// ============================================================ home / pause
function goHome() {
  if (levelActive && S) track('level_quit', { level: levelIdx + 1, attempt: play.attempt, moves_used: S.used, delivered: S.delivered, total: S.total, time_s: Math.round((Date.now() - play.start) / 1000) });
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
  LEVELS.forEach((_, i) => {
    const el = document.createElement('div');
    const lv = i + 1;
    el.className = 'lvl' + (lv > save.unlocked ? ' locked' : '') + (save.stars[lv] ? ' done' : '') + (lv === save.unlocked ? ' cur' : '');
    el.innerHTML = `${lv}${save.stars[lv] ? `<span class="pts">${'<i></i>'.repeat(save.stars[lv])}</span>` : ''}`;
    el.addEventListener('pointerup', () => { unlockAudio(); if (lv <= save.unlocked || DEBUG) { sfx('click'); startLevel(i); } else sfx('close'); });
    grid.append(el);
  });
  $('playBtn').textContent = t('play', { n: save.unlocked });
  renderDecor();
  $('home').classList.remove('off');
}
// ============================================================ Bưu điện nhỏ (decor màn hình chính, mua bằng Tem Điểm)
function renderDecor(justPlaced = -1) {
  const n = save.decor || 0;
  $('decor').innerHTML = DECOR.map((d, i) => (i < n || i === n)
    ? `<img class="dc dc-${d.id}${i === n ? ' ghost' : ''}${i === justPlaced ? ' new' : ''}" src="assets/decor/${d.id}.png" alt="">` : '').join('');
  $('decorBtn').innerHTML = `${t('decorate')} ${pointsLeft()}<i></i>`;
  const next = DECOR[n];
  $('decorBtn').classList.toggle('ready', !!next && pointsLeft() >= next.cost);
}
function decorPanel() {
  const n = save.decor || 0;
  const d = DECOR[n];
  const left = pointsLeft();
  track('decor_open', { placed: n, points: left });
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
      ${ok ? '' : `<p style="font-size:32px;margin:0">${t('pts_need', { n: d.cost - left })}</p>`}`,
    buttons: [
      { label: t('decor_place', { n: d.cost }), cls: ok ? '' : 'off', act: () => {
        if (!ok) { decorPanel(); return; }
        save.decor = n + 1;
        persist();
        track('decor_place', { id: d.id, index: n + 1, cost: d.cost, points_left: pointsLeft() });
        sfx('slot');
        haptic([15, 40, 15]);
        renderDecor(n);
      } },
      { label: t('close'), cls: 'orange', act: () => {} },
    ],
  });
}
$('undoBtn').addEventListener('pointerup', () => { unlockAudio(); onBooster('undo'); });
$('playBtn').addEventListener('pointerup', () => { unlockAudio(); sfx('click'); startLevel(save.unlocked - 1); });
$('pauseBtn').addEventListener('pointerup', () => {
  if (panelOpen) return;
  unlockAudio();
  sfx('click');
  panel({
    title: t('paused'),
    body: `<p>${t('level', { n: levelIdx + 1 })}</p>`,
    buttons: [
      { label: t('resume'), act: () => {} },
      { label: t('howto'), cls: 'brown', act: () => showRules() },
      { label: t('restart'), cls: 'orange', act: () => startLevel(levelIdx) },
      { label: isMuted() ? t('sound_off') : t('sound_on'), cls: 'brown', act: () => { setMuted(!isMuted()); } },
      { label: t('lang'), cls: 'brown', act: () => { setLang(getLang() === 'vi' ? 'en' : 'vi'); applyStaticCopy(); updateHUD(); startLevel(levelIdx); } },
      { label: t('home'), cls: 'brown', act: goHome },
    ],
  });
});

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
  btn('Reset save', () => { save = defaultSave(); persist(); clearEvents(); location.reload(); });
  btn('Events', () => {
    const f = funnelSummary();
    const rows = Object.keys(f).sort((a, b) => a - b).map(k => `<tr><td>${k}</td><td>${f[k].start}</td><td>${f[k].complete}</td><td>${f[k].fail}</td><td>${f[k].overtime}</td></tr>`).join('');
    const last = allEvents().slice(-12).reverse().map(e => `<div>${e.name} ${e.level ? 'L' + e.level : ''}</div>`).join('');
    panel({ title: 'Events', body: `<table style="width:100%;font-size:26px;color:#5a3a26"><tr><th>Lv</th><th>start</th><th>win</th><th>fail</th><th>OT</th></tr>${rows}</table><div style="text-align:left;font-size:22px;color:#7a5238;margin-top:16px">${last}</div>`,
      buttons: [{ label: 'Copy JSON', act: () => { try { navigator.clipboard.writeText(JSON.stringify(allEvents())); toast('Copied'); } catch (e) { toast('Copy failed'); } } }, { label: 'Close', cls: 'brown', act: () => {} }] });
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
  get busy() { return !!(drag || busyInput || panelOpen || ended || completing.size); } };

// ============================================================ boot
function applyStaticCopy() {
  movesEl.querySelector('.lbl').textContent = t('moves');
  document.documentElement.lang = getLang();
  $('albumBtn').textContent = t('album');
  $('decorBtn').title = t('pts_name');
  $('albumTitle').textContent = t('album_title');
  $('albumClose').textContent = t('close');
}
(async function boot() {
  applyStaticCopy();
  initFx($('fx'));
  setLite(LITE);
  buildDebug();
  try { manifest = await (await fetch('assets/manifest.json')).json(); } catch (e) { manifest = {}; }
  await preload(['back', 'topic_frame', 'crown', 'slot_tray', 'tray_front', 'btn_undo_off', 'hud_moves', 'token', 'joker_card', 'envelope_closed', 'wax', 'hand', 'coin', 'tem_diem', 'lock', 'plus', 'recycle', 'radial', 'logo',
    'face_1', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6', 'ic_hint', 'ic_joker', 'banner', 'bar_track', 'tipbox', 'ribbon', 'btn_yellow', 'btn_blue',
    'btn_pause', 'btn_undo', 'deck_tag', 'panel'].map(n => `assets/ui/${n}.png`).concat(['assets/ui/bg_game.jpg']));
  initAudio();
  track('app_open', { lite: LITE, ab_hard: AB.hard ? AB.hard.join('-') : 'default', ab_safety: AB.safety || 'default' });
  goHome();
  const m = location.search.match(/level=(\d+)/);
  if (m) startLevel(+m[1] - 1);
})();
