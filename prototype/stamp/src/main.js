import { LEVELS } from './levels.js';
import * as E from './engine.js';
import { hint as solverHint, solve } from './solver.js';
import { initAudio, unlockAudio, sfx, comboSfx, haptic, setMuted, isMuted } from './audio.js';
import { tween, ease, wait, initFx, sparkle, confetti, coinFly, ring, killTweens, killKey, setLite, clearParticles } from './fx.js';
import { candidateActions, isDeadlocked } from './solver.js';
import { track, events as allEvents, funnelSummary, clearEvents } from './analytics.js';

// ============================================================ constants
const CW = 165, CH = 214;
const ROW_A = 245, FOUND_Y = 585, TAB_Y = 885, TAB_BOTTOM = 1680;
const DECK_X = 860, WASTE_X = 430, EXTRA_X = 54;
const DOWN_GAP = 32, UP_GAP = 70;
const COMBO_MAX = 6;
// Giá theo APK 0.9.5: BoosterManager (hint 300, pack 500, stamper 500, joker 1200), GameSetting (hộc phụ 1000,
// 900 = giả thuyết giá +5 moves). Undo không có trong game gốc: khác biệt "cozy" của mình.
const COSTS = { undo: 50, hint: 300, pack: 500, stamper: 500, joker: 1200, slot: 1000, moves: 900 };
// Lịch mở theo video: Hint L2, Pack L4, Stamper L7, Joker L9; hộc phụ mua được từ L2.
const UNLOCK_AT = { hint: 2, pack: 4, stamper: 7, joker: 9, slot: 2 };
const GIFTS = { hint: 3, pack: 2, stamper: 2, joker: 2 };
// Mốc UA: level "khó nhưng không thể thua". Mặc định theo levels.js (special/safety); ghi đè để A/B test:
//   ?hard=5,10      danh sách level khó      ?safety=overtime | retry | none
const AB = (() => {
  const h = location.search.match(/hard=([\d,]*)/);
  const sf = location.search.match(/safety=(overtime|retry|none)/);
  return { hard: h ? h[1].split(',').filter(Boolean).map(Number) : null, safety: sf ? sf[1] : null };
})();
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
const SAVE_KEY = 'stampsort_proto_v1';
const defaultSave = () => ({ unlocked: 1, coins: 500, stars: {}, hint: 0, pack: 0, stamper: 0, joker: 0, slot: 0, seen: {}, attempts: {} });
let save = defaultSave();
try { save = { ...defaultSave(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch (e) { /* ignore */ }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

// ============================================================ stage scaling
let scale = 1, stageLeft = 0, stageTop = 0;
function fit() {
  scale = Math.min(innerWidth / 1080, innerHeight / 1920);
  stageLeft = (innerWidth - 1080 * scale) / 2;
  stageTop = (innerHeight - 1920 * scale) / 2;
  stage.style.transform = `scale(${scale})`;
  stage.style.left = stageLeft + 'px';
  stage.style.top = stageTop + 'px';
}
addEventListener('resize', fit);
fit();
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
  const gap = n >= 5 ? 26 : 44;
  const w = n * CW + (n - 1) * gap;
  return (1080 - w) / 2 + i * (CW + gap);
}
function slotPos(k) {
  if (k >= L.foundations) return { x: EXTRA_X, y: ROW_A };
  const n = L.foundations;
  const gap = n >= 5 ? 22 : 38;
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
    const d = Math.min(3, nd - 1 - i);            // 3 lá trên cùng tạo độ dày
    T.set(c.id, { x: DECK_X, y: ROW_A - (nd > 1 ? Math.max(0, 3 - d) * 4 : 0), z: 100 + i, up: false, hide: i < nd - 3 });
  });
  const nw = S.waste.length;
  S.waste.forEach((c, i) => {
    const vis = i - (nw - 3);                      // vị trí trong quạt 3 lá
    const x = WASTE_X + Math.max(0, vis) * 66;
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
function faceIndex(id) { return ((id * 7 + levelIdx * 3) % 6) + 1; }
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
    front.innerHTML = `<div class="crown"></div><div class="cnt">0/${card.n}</div><img class="art" src="${iconUrl(card.t)}" draggable="false"><div class="tag">${card.t}</div>`;
  } else if (card.k === E.JOKER) {
    el.classList.add('joker');
  } else {
    front.style.backgroundImage = `url(assets/ui/face_${faceIndex(card.id)}.png)`;
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
  v.el.style.transform = `translate3d(${v.x + v.ox}px,${v.y}px,0) rotate(${v.r}deg) scale(${v.s})`;
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
    el.innerHTML = '<div class="ribbon"></div><div class="count"></div>';
    board.append(el);
    slotEls.push(el);
  }
  // hộc phụ (khóa)
  extraEl = document.createElement('div');
  extraEl.className = 'slot locked';
  extraEl.style.left = EXTRA_X + 'px'; extraEl.style.top = ROW_A + 'px';
  const slotUnlocked = levelIdx + 1 >= UNLOCK_AT.slot;
  extraEl.innerHTML = '<div class="ribbon"></div><div class="count"></div><div class="lockicon"></div>' +
    (slotUnlocked ? '<div class="plus"></div>' : `<div class="lv">Lv ${UNLOCK_AT.slot}</div>`);
  extraEl.addEventListener('pointerup', onExtraSlot);
  board.append(extraEl);
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
  deckCount.style.left = DECK_X + CW - 44 + 'px'; deckCount.style.top = ROW_A - 26 + 'px';
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
function updateSlotLabels() {
  S.found.forEach((f, k) => {
    const el = slotEl(k);
    if (!el) return;
    if (!f && completing.has(k)) return;
    el.classList.toggle('open', !!f);
    if (f) {
      el.querySelector('.ribbon').textContent = f.t;
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
  fill.style.transform = `scaleX(${Math.min(combo, COMBO_MAX) / COMBO_MAX})`;
  const tp = topicProgress();
  $('combo').querySelector('.txt').textContent = combo >= 2 ? `Combo x${combo}` : `Topics ${tp.done}/${tp.total}`;
  if (S.moves === 5 && !lowWarned && L.moves != null) { lowWarned = true; toast('Only <em style="color:#ffcf3f;font-style:normal">5 moves</em> left!', 1600); }
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
    const st = scriptStep();
    const scriptWants = st && st.booster === d.id && !(d.id === 'joker' ? jokerMode : pickMode === d.id);
    b.classList.toggle('active', (d.id === 'joker' && jokerMode) || pickMode === d.id || !!scriptWants);
    const badge = b.querySelector('.badge');
    b.querySelector('.lockbig').style.display = locked ? '' : 'none';
    if (locked) { badge.style.display = 'none'; b.querySelector('.name').textContent = `Lv ${UNLOCK_AT[d.id]}`; continue; }
    badge.style.display = '';
    b.querySelector('.name').textContent = d.name;
    if (count > 0) { badge.className = 'badge'; badge.textContent = count; }
    else { badge.className = 'badge coin'; badge.textContent = COSTS[d.id]; }
  }
  const u = $('undoBtn');
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
  toast('Not enough coins');
  sfx('close');
  return false;
}
function onBooster(id) {
  if (ended || busyInput) return;
  const lv = levelIdx + 1;
  if (id !== 'undo' && lv < UNLOCK_AT[id]) { toast(`Unlocks at level ${UNLOCK_AT[id]}`); sfx('close'); return; }
  if (scriptStep() && scriptStep().booster !== id) { toast('Follow the hand!', 1000); return; }
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
  if (!undoStack.length) { toast('Nothing to undo'); sfx('close'); return; }
  if (!spend('undo')) return;
  const snap = undoStack.pop();
  S = snap.s;
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
  if (!a) { toast('No useful move found. Try Undo or a booster.'); sfx('close'); return; }
  if (!spend('hint')) return;
  sfx('hint');
  if (!showAction(a)) toast('Try drawing from the deck');
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
  if (!jokerFree && save.joker <= 0 && save.coins < COSTS.joker) { toast('Not enough coins'); sfx('close'); return; }
  jokerMode = true;
  sfx('joker');
  colZones.forEach((z, i) => { z.style.opacity = 1; z.classList.add('target'); });
  S.cols.forEach(col => { if (col.length) views.get(col[col.length - 1].id).el.classList.add('hintglow'); });
  if (!scriptStep()) tut('Tap a column to place the <em>Golden Stamp</em>. Any stamp can go on it!');
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
function startPick(kind) {
  if (pickMode === kind) { cancelPick(); return; }
  const piles = S.found.map((_, k) => k).filter(pullable);
  if (!piles.length) { toast('Open a topic pile first'); sfx('close'); return; }
  if (save[kind] <= 0 && save.coins < COSTS[kind]) { toast('Not enough coins'); sfx('close'); return; }
  if (kind === 'pack' && piles.length === 1) { applyPull(piles[0], kind); return; }
  pickMode = kind;
  sfx('joker');
  piles.forEach(k => slotEl(k).classList.add('target'));
  if (!scriptStep()) tut(kind === 'pack' ? 'Tap a pile: <em>2 hidden stamps</em> of that topic jump in!' : 'Tap a pile to <em>stamp in 1 card</em> of that topic.');
  renderBoosters();
}
function cancelPick(force = false) {
  if (scriptStep() && scriptStep().booster && !force) return;
  pickMode = null;
  slotEls.concat([extraEl]).forEach(e => e && e.classList.remove('target'));
  tut(null);
  renderBoosters();
}
function slotAt(p) {
  for (let k = 0; k < S.found.length; k++) {
    const q = slotPos(k);
    if (p.x >= q.x - 20 && p.x <= q.x + CW + 20 && p.y >= q.y - 50 && p.y <= q.y + CH + 20) return k;
  }
  return -1;
}
function applyPull(k, kind) {
  cancelPick(true);
  if (!pullable(k)) { toast('No stamps of that topic left'); sfx('close'); return; }
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
  if (scriptStep()) { toast('Follow the hand!', 1000); return; }
  if (levelIdx + 1 < UNLOCK_AT.slot) { toast(`Unlocks at level ${UNLOCK_AT.slot}`); sfx('close'); return; }
  panel({
    title: 'Extra Slot',
    body: `<div class="feature-icon" style="background-image:url(assets/ui/slot_empty.png);width:180px;height:230px"></div><p>Unlock one more pile for this level.</p>`,
    buttons: [
      { label: 'Free <small>(ad)</small>', cls: 'orange', act: () => fakeAd(unlockExtra) },
      { label: `${COSTS.slot} coins`, act: () => {
        if (save.coins < COSTS.slot) { toast('Not enough coins'); setTimeout(() => onExtraSlot(), 300); return; }
        save.coins -= COSTS.slot; persist(); bumpCoins(); unlockExtra();
      } },
      { label: 'Close', cls: 'brown', act: () => {} },
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
  if (!html) { t.classList.remove('on'); return; }
  t.innerHTML = html;
  t.classList.add('on');
}

// ---- Tutorial ép bước (level 1 dựng lại từ video). Bước: { text, src: cardId, dst: {found:k}|{onto:cardId}, draw, info }
function scriptStep() { return script ? script.steps[script.i] || null : null; }
function colOfCard(id) { return S.cols.findIndex(col => col.some(c => c.id === id)); }
function scriptAction(step) {
  if (!step || step.info || step.booster) return null;
  if (step.draw) return { draw: true };
  const src = locate(step.src);
  if (!src) return null;
  const dst = step.dst.found != null ? { to: 'found', i: step.dst.found } : { to: 'col', j: colOfCard(step.dst.onto) };
  return { src, dst };
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
  tut(step.text);
  if (step.info) {
    clearHint();
    setTimeout(() => { if (scriptStep() === step) { script.i++; runScript(); } }, step.ms || 2600);
    return;
  }
  if (step.booster) { showBoosterStep(step); return; }
  showAction(scriptAction(step));
}
function boosterCenter(id) {
  const b = $('boosters').querySelector(`[data-id=${id}]`);
  const idx = [...b.parentNode.children].indexOf(b);
  const n = b.parentNode.children.length;
  return { x: 570 + (idx - (n - 1) / 2) * (168 + 34), y: 1790 };
}
function showBoosterStep(step) {
  clearHint();
  const inMode = (step.booster === 'joker' && jokerMode) || pickMode === step.booster;
  $('boosters').querySelectorAll('.booster').forEach(b => b.classList.toggle('active', b.dataset.id === step.booster && !inMode));
  if (!inMode) { const c = boosterCenter(step.booster); handTap(c.x, c.y); return; }
  if (step.slot != null) { const p = slotPos(step.slot); slotEl(step.slot).classList.add('target'); handTap(p.x + CW / 2, p.y + CH / 2); }
  else { const col = S.cols[step.col]; const ys = colOffsets(col); handTap(colX(step.col) + CW / 2, (col.length ? ys[ys.length - 1] : TAB_Y) + CH / 2); }
}
function scriptAllows(src, dst) {
  const a = scriptAction(scriptStep());
  if (!a || a.draw) return false;
  const same = (x, y) => x.from === y.from && (x.from === 'waste' || (x.i === y.i && x.idx === y.idx));
  return same(src, a.src) && dst.to === a.dst.to && (dst.to === 'found' ? dst.i === a.dst.i : dst.j === a.dst.j);
}
function scriptReject(vs) {
  if (vs) nudge(vs);
  sfx('close', { vol: 0.5 });
  toast('Follow the hand!', 1000);
  const T = computeLayout();
  for (const v of views.values()) if (T.get(v.id) && !v.gone) moveView(v, T.get(v.id), { dur: 220, easing: ease.outBackSoft });
  showAction(scriptAction(scriptStep()));
}

// Tutorial theo ngữ cảnh: mỗi bước hiện khi điều kiện đúng lần đầu, ẩn khi người chơi làm đúng loại nước đó.
const TUTS = [
  { id: 'moves', lv: [2], info: true, text: 'Every drag or draw uses <em>1 move</em>. Finish all piles before moves run out!',
    when: () => S.used === 0 },
  { id: 'open', lv: [], text: 'Drag a <em>golden topic stamp</em> to an empty slot to start a pile.',
    when: () => !S.found.some(Boolean) && findAction(a => a.dst && a.dst.to === 'found' && !S.found[a.dst.i]),
    done: ev => ev.some(e => e.type === 'open') },
  { id: 'deliver', lv: [], text: 'Now add stamps of the <em>same topic</em> to the pile.',
    when: () => findAction(a => a.dst && a.dst.to === 'found' && S.found[a.dst.i]),
    done: ev => ev.some(e => e.type === 'deliver' && e.count > 0) },
  { id: 'draw', lv: [2], text: 'Need more stamps? Tap the <em>deck</em> to draw one.',
    when: () => S.deck.length && !findAction(a => a.dst && a.dst.to === 'found'),
    action: () => ({ draw: true }), done: ev => ev.some(e => e.type === 'draw') },
  { id: 'stack', lv: [2, 3], text: 'Stamps of the same topic can be <em>stacked</em> on the table.',
    when: () => findAction(a => a.dst && a.dst.to === 'col' && S.cols[a.dst.j].length && a.src.from === 'col'),
    done: ev => ev.some(e => e.type === 'move' && e.dst.to === 'col') },
  { id: 'pile', lv: [3], info: true, text: 'A pile always starts with its <em>topic stamp</em>. Only matching stamps go on it.',
    when: () => S.used === 0 },
  { id: 'empty', lv: [3], text: 'An <em>empty column</em> takes any stack. Use it to dig out buried stamps!',
    when: () => findAction(a => a.dst && a.dst.to === 'col' && !S.cols[a.dst.j].length),
    done: ev => ev.some(e => e.type === 'move' && e.dst.to === 'col') },
  { id: 'full', lv: [3, 4], info: true, text: 'All slots busy? <em>Finish a pile</em> to free its slot.',
    when: () => S.found.every(Boolean) },
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
    const a = step.when();
    if (!a) continue;
    save.seen[step.id] = 1;
    persist();
    tutorial = { id: step.id };
    tut(step.text);
    if (!step.info) showAction(step.action ? step.action() : a);
    else setTimeout(() => { if (tutorial && tutorial.id === step.id) { tutorial = null; tut(null); } }, 3800);
    return;
  }
}
function resetIdleHint() {
  clearTimeout(idleTimer);
  if ((levelIdx + 1 > 3 && !specialOf(L)) || ended || script) return;
  idleTimer = setTimeout(() => {           // level đầu và level khó: đứng im thì gợi ý miễn phí
    if (ended || tutorial || jokerMode) return;
    const a = computeHint();
    showAction(a);
    hintTimer = setTimeout(clearHint, 3500);
  }, 7000);
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
    if (p.x >= x - 20 && p.x <= x + CW + 20 && p.y >= TAB_Y - 60) return i;
  }
  return -1;
}
function onDown(e) {
  unlockAudio();
  if (ended || busyInput || panelOpen || drag) return;
  const p = toStage(e);
  if (pickMode) {
    const k = slotAt(p);
    const st = scriptStep();
    if (st && st.booster && k !== st.slot) { toast('Tap the glowing pile'); sfx('close', { vol: 0.5 }); return; }
    if (k >= 0 && S.found[k] && pullable(k)) applyPull(k, pickMode); else cancelPick();
    return;
  }
  if (jokerMode) {
    const i = colAt(p);
    const st = scriptStep();
    if (st && st.booster && i !== st.col) { toast('Tap the highlighted column'); sfx('close', { vol: 0.5 }); return; }
    if (i >= 0) placeJokerAt(i); else toggleJoker();
    return;
  }
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;
  const v = cardEl._view;
  const loc = locate(v.id);
  if (!loc || (loc.from === 'col' && !E.runAt(S, loc.i, loc.idx))) {
    // lá úp hoặc không nhấc được: rung nhẹ
    if (loc && loc.from === 'col') { nudge([v]); if (!v.card.up && !S.cols[loc.i][loc.idx].up) toast('Face-down stamp: move the stamps on top first', 1300); }
    return;
  }
  clearHint();
  const run = E.sourceCards(S, loc);
  const vs = run.map(c => views.get(c.id));
  drag = { src: loc, vs, start: p, last: p, t0: performance.now(), moved: false, offs: vs.map(w => ({ x: w.x - p.x, y: w.y - p.y })), vx: 0, pid: e.pointerId };
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
    highlightTargets(drag.src);
  }
  if (!drag.moved) return;
  const vx = p.x - drag.last.x;
  drag.vx = drag.vx * 0.7 + vx * 0.3;
  drag.last = p;
  const tilt = Math.max(-10, Math.min(10, drag.vx * 0.6));
  drag.vs.forEach((v, k) => {
    // lá sau đuổi theo lá trước: cảm giác chồng mềm
    const lag = k * 0.18;
    const tx = p.x + drag.offs[k].x, ty = p.y + drag.offs[k].y;
    v.x += (tx - v.x) * (1 - lag);
    v.y += (ty - v.y) * (1 - lag);
    v.r = tilt * (1 - k * 0.15);
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
    const dst = E.bestTargetFor(S, d.src);
    if (dst) doMove(d.src, dst, false);
    else rejectTap(d.src, d.vs);
    return;
  }
  const p = toStage(e);
  const dst = dropTarget(d.src, p, d.vs[0]);
  d.vs.forEach(v => { v.lifted = false; v.el.classList.remove('lift'); });
  if (dst) doMove(d.src, dst, true);
  else {
    const why = scriptStep() ? 'Follow the hand!' : dropReason(d.src, p);
    if (why) toast(why);
    sfx('close', { vol: 0.5 });
    const T = computeLayout();
    d.vs.forEach(v => { moveView(v, T.get(v.id), { dur: 260, easing: ease.outBackSoft }).then(() => setZ(v, T.get(v.id).z)); });
  }
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
  const bottom = (col.length ? ys[ys.length - 1] : TAB_Y) + CH + 140;
  return { x: colX(dst.j) - 22, y: TAB_Y - 60, w: CW + 44, h: bottom - TAB_Y + 60 };
}
function dropTarget(src, p, v0) {
  const c = { x: v0.x + CW / 2, y: v0.y + CH / 2 };
  let best = null, bd = Infinity;
  for (const dst of allTargets(src)) {
    const r = targetRect(dst);
    const inside = q => q.x >= r.x && q.x <= r.x + r.w && q.y >= r.y && q.y <= r.y + r.h;
    if (!inside(p) && !inside(c)) continue;
    const d = Math.hypot(r.x + r.w / 2 - c.x, r.y + Math.min(r.h, CH) / 2 - c.y);
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
      if (why === 'need_topic') return 'Start a pile with a <em style="color:#ffcf3f;font-style:normal">topic stamp</em>';
      if (why === 'wrong_topic') return 'That pile is for a different topic';
    }
  }
  const i = colAt(p);
  if (i >= 0) {
    const why = E.checkMove(S, src, { to: 'col', j: i });
    if (why === 'wrong_topic') return 'Only the same topic can stack';
    if (why === 'topic_on_card') return 'Topic stamps go to a slot or an empty column';
  }
  return null;
}
function rejectTap(src, vs) {
  const run = E.sourceCards(S, src);
  nudge(vs);
  sfx('close', { vol: 0.5 });
  haptic(4);
  if (!run) return;
  if (run[0].k === 'topic') toast(S.found.every(Boolean) ? 'All slots are busy. Finish a pile first!' : 'No place for it yet');
  else if (!S.found.some(f => f && f.t === run[0].t)) toast('Its pile isn\'t open yet. Find the <em style="color:#ffcf3f;font-style:normal">topic stamp</em>!');
  else toast('No place for it yet');
}
function nudge(vs) {
  vs.forEach(v => {
    const o = { k: 0 };
    tween(o, { k: 1 }, { dur: 320, key: 'nudge-' + v.id, onUpdate: () => { v.ox = Math.sin(o.k * Math.PI * 5) * 9 * (1 - o.k); applyTransform(v); } })
      .then(() => { v.ox = 0; applyTransform(v); });
  });
}
function highlightTargets(src) {
  for (const dst of allTargets(src)) {
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
  const res = E.applyMove(S, src, dst);
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
    } else if (ev.type === 'open') {
      const el = slotEl(ev.slot);
      const p = slotPos(ev.slot);
      setTimeout(() => {
        el.classList.add('open');
        el.querySelector('.ribbon').textContent = ev.t;
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
        if (step >= 3) floatText(`x${step}`, p.x + CW / 2, p.y - 60, step >= 5 ? '#ff9d3b' : '#ffe36b');
        if (step > 0 && step % COMBO_MAX === 0) comboReward(p.x + CW / 2, p.y);
      }, late || (fromDrag ? 110 : 200));
    } else if (ev.type === 'complete') {
      const pr = completeAnim(ev.slot, ev.cards, ev.t, late ? late + 150 : fromDrag ? 260 : 380);
      pending.push(pr);
      pr.then(() => { pending = pending.filter(x => x !== pr); });
      undoStack = [];     // phong bì đã gửi: không undo
    } else if (ev.type === 'flip') {
      const v = views.get(ev.id);
      setTimeout(() => sfx('flip', { vol: 0.7 }), 120);
      void v;
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
  floatText(topic, cx, p.y - 30, '#ffffff');
  await wait(380);
  completing.delete(slot);
  // bay đi
  slotEl(slot).classList.toggle('open', !!S.found[slot]);
  if (!S.found[slot]) slotEl(slot).querySelector('.count').textContent = '';
  const fly = { k: 0 };
  const sx = e.x, sy = e.y;
  sfx('whoosh', { vol: 0.8 });
  const wx0 = cx - 42, wy0 = cy - 50;
  await tween(fly, { k: 1 }, { dur: 520, easing: ease.inBack, onUpdate: () => {
    e.x = sx + (1250 - sx) * fly.k; e.y = sy + (-260 - sy) * fly.k - Math.sin(fly.k * Math.PI) * 120;
    e.r = 25 * fly.k; e.s = 1.08 - 0.5 * fly.k; drawEnv();
    wax.style.transform = `translate(${wx0 + (e.x - sx)}px,${wy0 + (e.y - sy)}px) rotate(${e.r}deg) scale(${e.s / 1.08})`;
    if (Math.random() < 0.35) sparkle(e.x + 115, e.y + 96, 1, { spread: 0.3 });
  } });
  env.remove(); wax.remove();
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
  if (canAutoFinish() && autoFinish(token)) return;
  if (isStuck()) {
    Promise.all(pending).then(() => wait(500)).then(same(() => {
      if (!isStuck() || ended || jokerMode) return;
      if (safetyOf(L) !== 'none') rescueJoker(); else stuckPanel();
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
  floatText('OVERTIME!', 540, 420, '#ff7a59');
  toast('Out of moves, but the post office stays open: <em style="color:#ffcf3f;font-style:normal">keep going for free!</em>', 2800);
  const tp = topicProgress();
  track('overtime_start', { level: levelIdx + 1, attempt: play.attempt, delivered: S.delivered, total: S.total, topics_left: tp.total - tp.done, special: specialOf(L) || '' });
}
// Kẹt cứng ở level khó: tặng Joker miễn phí để luôn đi tiếp được.
function rescueJoker() {
  play.rescues++;
  jokerFree = true;
  track('rescue_joker', { level: levelIdx + 1, attempt: play.attempt, delivered: S.delivered, total: S.total });
  toast('Stuck? The Postmaster lends you a <em style="color:#ffcf3f;font-style:normal">free Golden Stamp</em>!', 2600);
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
  toast('Auto finish!', 1200);
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
function stars() {
  if (overtime) return 1;
  if (L.moves == null) return 3;
  const r = S.moves / L.moves;
  return r >= 0.25 ? 3 : r >= 0.1 ? 2 : 1;
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
  save.stars[lv] = Math.max(save.stars[lv] || 0, st);
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, lv + 1));
  extraKept = -1;
  persist();
  const token = levelToken;
  await wait(700);
  if (token !== levelToken) return;
  const last = lv === LEVELS.length;
  panel({
    title: last ? 'All Delivered!' : 'Perfect!',
    radial: true,
    body: `<div class="stars"><i></i><i></i><i></i></div>
      <h3>All topics cleared!</h3><p>Level ${lv} complete · ${S.moves === Infinity ? '' : `${S.moves} moves left`}</p>
      ${last ? '<p>That was the last level of the prototype. Thanks for playing!</p>' : ''}
      <div class="coins-line"><i></i><span>+${reward}</span></div>`,
    buttons: [
      { label: `Claim x2 <small>(ad)</small>`, cls: 'orange', act: () => fakeAd(() => {
        coinsTo(reward, 540, 900);
        const tk = levelToken;
        setTimeout(() => { if (tk === levelToken) (last ? goHome() : startLevel(levelIdx + 1)); }, 1300);
      }) },
      { label: last ? 'Home' : 'Continue', act: () => (last ? goHome() : startLevel(levelIdx + 1)) },
    ],
    onOpen: pEl => {
      const ss = pEl.querySelectorAll('.stars i');
      for (let k = 0; k < st; k++) setTimeout(() => { ss[k].classList.add('on'); sfx('claim', { vol: 0.6, rate: 1 + k * 0.12 }); haptic(10); }, 380 + k * 260);
      setTimeout(() => coinsTo(reward, 540, 1000), 380 + st * 260 + 200);
    },
  });
}
function outOfMoves() {
  ended = true;
  sfx('lose');
  haptic([30, 50, 30]);
  track('level_fail', { level: levelIdx + 1, attempt: play.attempt, reason: 'out_of_moves', delivered: S.delivered, total: S.total, special: specialOf(L) || '' });
  if (safetyOf(L) === 'retry') {
    // Level khó kiểu "chơi lại miễn phí": không phạt, giữ Ô phụ, vào lại ngay
    panel({ title: 'So Close!', body: '<p>This is a hard level. Try again: it is <b>free</b>, no penalty.</p>', buttons: [
      { label: 'Try again', act: () => startLevel(levelIdx) },
      { label: '+5 moves <small>(free ad)</small>', cls: 'orange', act: () => fakeAd(() => addMoves(5, true, 'ad')) },
    ] });
    return;
  }
  const canFree = !freeMovesUsed;
  const buttons = [];
  if (canFree) buttons.push({ label: '+5 moves <small>(free ad)</small>', cls: 'orange', act: () => fakeAd(() => addMoves(5, true, 'ad')) });
  buttons.push({ label: `+5 moves <small>${COSTS.moves} coins</small>`, act: () => {
    if (save.coins < COSTS.moves) { toast('Not enough coins'); outOfMoves(); return; }
    save.coins -= COSTS.moves; persist(); bumpCoins(); addMoves(5, false, 'coins');
  } });
  buttons.push({ label: 'Retry', cls: 'brown', act: () => startLevel(levelIdx) });
  const tp = topicProgress();
  panel({ title: 'Out of Moves', body: `<p>You ran out of moves with <b>${tp.total - tp.done} topics</b> (${S.total - S.delivered} stamps) still to clear.</p><p>Get extra moves to keep going, or retry the level.</p>`, buttons });
}
function stuckPanel() {
  track('level_stuck', { level: levelIdx + 1, attempt: play.attempt, delivered: S.delivered, total: S.total, moves_left: S.moves });
  const buttons = [];
  if (levelIdx + 1 >= UNLOCK_AT.joker) buttons.push({ label: 'Use a Joker', cls: 'orange', act: () => { toggleJoker(); } });
  if (levelIdx + 1 >= UNLOCK_AT.pack && S.found.some((_, k) => pullable(k))) buttons.push({ label: 'Use a Pack', cls: 'orange', act: () => startPick('pack') });
  if (levelIdx + 1 >= UNLOCK_AT.slot && !S.extraSlot) buttons.push({ label: 'Extra slot', cls: 'orange', act: () => onExtraSlot() });
  if (undoStack.length) buttons.push({ label: 'Undo', act: () => doUndo() });
  buttons.push({ label: 'Retry', cls: 'brown', act: () => startLevel(levelIdx) });
  panel({ title: 'No Moves Left', body: '<p>No stamp can move anymore.</p>', buttons });
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
  const p = panel({ title: 'Ad Break', body: '<p>(Mock rewarded ad)</p><p id="adc">2</p>', buttons: [] });
  let n = 2;
  const t = setInterval(() => {
    n--;
    const c = p.querySelector('#adc');
    if (c) c.textContent = n;
    if (n <= 0) { clearInterval(t); closePanel(); done(); }
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
  const token = levelToken;
  const pre = (L.preplaced || []).flat();
  const allCards = [...L.columns.flat(), ...L.deck, ...pre];
  const topics = [...new Set(allCards.map(c => c.t))];
  await preload(allCards.filter(c => c.k === 'stamp').map(artUrl).concat(topics.map(iconUrl)));
  if (token !== levelToken) return;
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
  await wait(350);
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
  el.innerHTML = (sp ? `<div class="hard-pill">${sp === 'superhard' ? 'SUPER HARD LEVEL' : 'HARD LEVEL'}</div>` : '') + `<div style="font-size:110px;line-height:1">Level ${levelIdx + 1}</div>
    <div style="margin-top:22px;display:inline-block;padding:14px 34px;border-radius:30px;background:rgba(0,0,0,.35);font-size:44px">
      Clear <span style="color:#ffcf3f">${tp.total - tp.done} topics</span> · ${L.moves == null ? 'unlimited moves' : `<span style="color:#ffcf3f">${L.moves} moves</span>`}</div>`;
  el.style.cssText = 'position:absolute;left:0;right:0;top:700px;text-align:center;color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.25);z-index:4000;pointer-events:none';
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
const RULES_HTML = `
  <div style="text-align:left;font-size:32px;line-height:1.35;color:#5a3a26">
    <p style="margin:0 0 18px"><b style="color:#2f8a3a">WIN:</b> put every stamp into its topic pile. When all topics are cleared, you win!</p>
    <p style="margin:0 0 18px"><b style="color:#c9493b">LOSE:</b> every drag and every deck tap uses 1 move. Run out of moves before clearing all topics and the level fails (get +5 moves or retry).</p>
    <p style="margin:0 0 18px"><b>Piles:</b> only a golden <b>topic stamp</b> can open an empty slot. A pile is sent away when full (count x/n), freeing the slot.</p>
    <p style="margin:0"><b>Table:</b> stack stamps only on the same topic. An empty column takes any stack. Wrong moves are free.</p>
  </div>`;
function showRules(onClose) {
  panel({ title: 'How to Play', body: RULES_HTML, buttons: [{ label: 'Got it', act: () => onClose && onClose() }] });
}
function featureIntro() {
  const u = L.unlock;
  if (!u || save.seen['unlock_' + u]) return Promise.resolve();
  save.seen['unlock_' + u] = 1;
  const info = {
    hint: { title: 'Booster: Hint', icon: 'assets/ui/ic_hint.png', text: 'Stuck? The magnifier shows a good next move.' },
    pack: { title: 'Booster: Pack', icon: 'assets/ui/ic_pack_big.png', text: 'Pulls <b>2 hidden stamps</b> of a topic straight into its pile.' },
    stamper: { title: 'Booster: Stamper', icon: 'assets/ui/ic_stamper.png', text: 'Choose a pile and <b>stamp in 1 card</b> of that topic.' },
    joker: { title: 'Booster: Joker', icon: 'assets/ui/joker_card.png', text: 'Play the Golden Stamp on any column. <b>Any stamp</b> can go on it until the level ends!' },
  }[u];
  save[u] = (save[u] || 0) + GIFTS[u];
  persist();
  renderBoosters();
  sfx('feature');
  return new Promise(res => {
    panel({
      title: info.title, radial: true,
      body: `<div class="feature-icon" style="background-image:url(${info.icon})"></div><p>${info.text}</p><h3>+${GIFTS[u]} free</h3>`,
      buttons: [{ label: 'Claim', act: () => {
        updateHUD();
        if (L.script) { res(); return; }          // kịch bản ép bước sẽ tự chỉ tay
        const b = $('boosters').querySelector(`[data-id=${u}]`);
        const idx = [...b.parentNode.children].indexOf(b);
        const n = b.parentNode.children.length;
        const x = 540 + (idx - (n - 1) / 2) * (168 + 34);
        tut(`Tap <em>${info.title.split(': ')[1]}</em> any time you need it.`);
        handTap(x, 1790);
        setTimeout(() => { hideHand(); if (!tutorial && !scriptStep()) tut(null); res(); }, 2400);
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
    el.textContent = lv;
    el.addEventListener('pointerup', () => { unlockAudio(); if (lv <= save.unlocked || DEBUG) { sfx('click'); startLevel(i); } else sfx('close'); });
    grid.append(el);
  });
  $('playBtn').textContent = `Play  Level ${save.unlocked}`;
  $('home').classList.remove('off');
}
$('undoBtn').addEventListener('pointerup', () => { unlockAudio(); onBooster('undo'); });
$('playBtn').addEventListener('pointerup', () => { unlockAudio(); sfx('click'); startLevel(save.unlocked - 1); });
$('pauseBtn').addEventListener('pointerup', () => {
  if (panelOpen) return;
  unlockAudio();
  sfx('click');
  panel({
    title: 'Paused',
    body: `<p>Level ${levelIdx + 1}</p>`,
    buttons: [
      { label: 'Resume', act: () => {} },
      { label: 'How to Play', cls: 'brown', act: () => showRules() },
      { label: 'Restart', cls: 'orange', act: () => startLevel(levelIdx) },
      { label: isMuted() ? 'Sound: Off' : 'Sound: On', cls: 'brown', act: () => { setMuted(!isMuted()); } },
      { label: 'Home', cls: 'brown', act: goHome },
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
window.__game = { get S() { return S; }, get level() { return levelIdx + 1; }, startLevel, autoplay, doMove, onDeck, E, goHome };

// ============================================================ boot
(async function boot() {
  initFx($('fx'));
  setLite(LITE);
  buildDebug();
  try { manifest = await (await fetch('assets/manifest.json')).json(); } catch (e) { manifest = {}; }
  await preload(['back', 'topic_frame', 'crown', 'slot_empty', 'moves_box', 'booster_btn', 'joker_card', 'envelope_closed', 'wax', 'hand', 'coin', 'star', 'lock', 'plus', 'recycle', 'radial', 'header_win', 'logo',
    'face_1', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6', 'ic_hint', 'ic_joker', 'ic_undo'].map(n => `assets/ui/${n}.png`));
  initAudio();
  track('app_open', { lite: LITE, ab_hard: AB.hard ? AB.hard.join('-') : 'default', ab_safety: AB.safety || 'default' });
  goHome();
  const m = location.search.match(/level=(\d+)/);
  if (m) startLevel(+m[1] - 1);
})();
