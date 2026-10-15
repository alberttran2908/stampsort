// Tween (rAF) + particle trên 1 canvas. Chỉ đụng transform/opacity để giữ 60fps trên máy yếu.

export const ease = {
  linear: t => t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBackSoft: t => { const c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
};

const tweens = new Set();
let running = false;
const frameHooks = new Set();

/** Tween các thuộc tính số của obj. Trả về Promise. */
export function tween(obj, to, { dur = 300, easing = ease.outCubic, delay = 0, onUpdate, key } = {}) {
  if (key) for (const t of tweens) if (t.obj === obj && t.key === key) { tweens.delete(t); t.resolve(); }
  return new Promise(resolve => {
    const from = {};
    for (const k in to) from[k] = obj[k];
    tweens.add({ obj, from, to, dur, easing, start: performance.now() + delay, onUpdate, resolve, key });
    loop();
  });
}
export function killKey(prefix) {
  for (const t of tweens) if (t.key && t.key.startsWith(prefix)) { tweens.delete(t); t.resolve(); }
}
/** Xoá mọi hạt (khi đổi level giữa chừng). */
export function clearParticles() { parts.length = 0; clearAll(); }
export function killTweens(obj) {
  for (const t of tweens) if (t.obj === obj) { tweens.delete(t); t.resolve(); }
}
export const wait = ms => new Promise(r => setTimeout(r, ms));
export function onFrame(fn) { frameHooks.add(fn); loop(); return () => frameHooks.delete(fn); }

function loop() {
  if (running) return;
  running = true;
  requestAnimationFrame(step);
}
function step(now) {
  for (const t of tweens) {
    if (now < t.start) continue;
    const p = Math.min(1, (now - t.start) / t.dur);
    const e = t.easing(p);
    for (const k in t.to) t.obj[k] = t.from[k] + (t.to[k] - t.from[k]) * e;
    t.onUpdate && t.onUpdate(t.obj, p);
    if (p >= 1) { tweens.delete(t); t.resolve(); }
  }
  for (const f of frameHooks) f(now);
  particlesStep(now);
  if (tweens.size || frameHooks.size || parts.length) requestAnimationFrame(step);
  else running = false;
}

// ---------------- particles ----------------
let cv = null;
let cx = null;
const parts = [];
const imgCache = {};
let lastT = 0;
let LITE = false;
let PSCALE = 1;          // hệ số số hạt
let FX_H = 1920;         // QA N2: chiều cao stage thật (màn cao > 1920), bitmap canvas phải bằng, không giãn
export function initFx(canvas) { cv = canvas; cx = canvas.getContext('2d'); }
/** Xoá toàn bộ bitmap (không phụ thuộc transform / chiều cao cũ): confetti rơi dưới y 1920 không còn đọng vệt. */
function clearAll() { if (!cx) return; cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.restore(); }
/** main.js fit(): đặt chiều cao stage (toạ độ stage 1080 x h). */
export function setFxSize(h) { FX_H = Math.max(1920, Math.round(h || 1920)); applySize(); }
function applySize() {
  if (!cv) return;
  const k = LITE ? 0.5 : 1;
  if (cv.width !== Math.round(1080 * k) || cv.height !== Math.round(FX_H * k)) { cv.width = Math.round(1080 * k); cv.height = Math.round(FX_H * k); }
  cx.setTransform(k, 0, 0, k, 0, 0);
}
/** Máy yếu: canvas hiệu ứng nửa độ phân giải (ít pixel/frame 4 lần), ít hạt hơn, hạt vẽ fillRect không xoay. */
export function setLite(on) {
  LITE = !!on;
  PSCALE = LITE ? 0.4 : 1;
  applySize();
}
function img(src) {
  if (!imgCache[src]) { const i = new Image(); i.src = src; imgCache[src] = i; }
  return imgCache[src];
}

// P5 (benchmark-grand-games.md, art-batch-1 P5): hạt theo theme bưu điện thay sao 8 cánh và confetti neon. Sprite 128 px
// trong assets/fx/, đúng palette 5 màu (kem giấy, nâu gỗ, đỏ air-mail, xanh air-mail, vàng đồng).
const FX = n => `assets/fx/${n}.png`;
export const FX_SPRITES = ['paper_cream', 'paper_red', 'paper_blue', 'foil_gold', 'stamp_red', 'stamp_blue', 'envelope', 'wax_drop', 'twinkle'];
const CONFETTI_SET = ['paper_cream', 'paper_red', 'paper_blue', 'foil_gold', 'paper_cream', 'paper_red', 'paper_blue', 'foil_gold', 'stamp_red', 'stamp_blue', 'envelope'];
/** Tải trước sprite hạt (gọi lúc khởi động, để hạt đầu tiên không trống). */
export function preloadFx() { for (const n of FX_SPRITES) img(FX(n)); }
/** Lấp lánh mềm 4 cánh khi đặt tem / gửi thư. colors giữ cho tương thích chỗ gọi cũ, không dùng (sprite đã có màu vàng đồng). */
export function sparkle(x, y, n = 10, { spread = 1, size = 9 } = {}) {
  n = Math.max(1, Math.round(n * PSCALE * 0.7));
  const tw = img(FX('twinkle'));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (120 + Math.random() * 300) * spread;
    parts.push({ kind: 'tw', im: tw, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, g: 420, drag: 2.2, life: 0.55 + Math.random() * 0.35,
      t: 0, size: size * (2.6 + Math.random() * 1.6), rot: 0, vr: 0 });
  }
  loop();
}
/** Hạt giấy khi thắng: mảnh giấy kem/đỏ/xanh, lá vàng, tem nhỏ, phong bì nhỏ. Rơi chậm (drag cao, trọng lực thấp),
 *  lật như giấy (co giãn theo trục dọc). x, y: điểm bung (mặc định giữa trên màn). */
export function confetti(n = 60, { drag = 3.2, gravity = 650, life = 2.1, spread = 0.75, x = 540, y = 700, set = CONFETTI_SET } = {}) {
  n = Math.round(n * PSCALE);
  for (let i = 0; i < n; i++) {
    const name = set[(Math.random() * set.length) | 0];
    const small = /^(stamp|envelope)/.test(name);
    parts.push({ kind: 'spr', im: img(FX(name)), x: x + (Math.random() - 0.5) * 300, y, vx: (Math.random() - 0.5) * 1700 * spread,
      vy: (-900 - Math.random() * 1100) * spread, g: gravity, drag, life: life + Math.random() * (life / 2.4), t: 0,
      size: (small ? 40 : 46) + Math.random() * 16, rot: Math.random() * 6, vr: (Math.random() - 0.5) * (small ? 5 : 9), flip: !small });
  }
  loop();
}
/** Coin bay từ (x,y) về (tx,ty). */
export function coinFly(x, y, tx, ty, n, onEach) {
  for (let i = 0; i < n; i++) {
    parts.push({ kind: 'coin', x, y, sx: x, sy: y, tx, ty, t: 0, delay: i * 0.06, life: 0.75,
      ox: (Math.random() - 0.5) * 260, oy: -120 - Math.random() * 200, done: false, onEach });
  }
  loop();
}
/** Vòng sóng lan ra. */
export function ring(x, y, { color = '#f6eedc', r0 = 30, r1 = 170, life = 0.45, width = 10 } = {}) {
  parts.push({ kind: 'ring', x, y, r0, r1, life, t: 0, color, width });
  loop();
}

function particlesStep(now) {
  if (!cx) return;
  const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
  lastT = now;
  clearAll();
  const coin = img('assets/ui/coin.png');
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.kind === 'coin') {
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.t += dt;
      const k = Math.min(1, p.t / p.life);
      const e = k * k;
      const bx = p.sx + p.ox * Math.sin(k * Math.PI);
      const by = p.sy + p.oy * Math.sin(k * Math.PI);
      const x = bx + (p.tx - bx) * e;
      const y = by + (p.ty - by) * e;
      const s = 56 * (1 - 0.35 * k);
      if (coin.complete) cx.drawImage(coin, x - s / 2, y - s / 2, s, s);
      if (k >= 1) { parts.splice(i, 1); p.onEach && p.onEach(); }
      continue;
    }
    p.t += dt;
    if (p.t >= p.life) { parts.splice(i, 1); continue; }
    const a = 1 - p.t / p.life;
    if (p.kind === 'ring') {
      const r = p.r0 + (p.r1 - p.r0) * ease.outCubic(p.t / p.life);
      cx.globalAlpha = a;
      cx.strokeStyle = p.color;
      cx.lineWidth = p.width * a;
      cx.beginPath(); cx.arc(p.x, p.y, r, 0, Math.PI * 2); cx.stroke();
      continue;
    }
    if (p.drag) { p.vx -= p.vx * p.drag * dt; p.vy -= p.vy * p.drag * dt * 0.3; }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    cx.globalAlpha = Math.min(1, a * 1.6);
    const im = p.im;
    if (!im || !im.complete || !im.naturalWidth) continue;
    const sz = p.kind === 'tw' ? p.size * (0.6 + 0.4 * a) : p.size;
    if (LITE) { cx.drawImage(im, p.x - sz / 2, p.y - sz / 2, sz, sz); continue; }   // máy yếu: không xoay
    cx.save();
    cx.translate(p.x, p.y);
    if (p.rot) cx.rotate(p.rot);
    if (p.flip) cx.scale(1, Math.abs(Math.cos(p.rot * 1.7)) * 0.8 + 0.2);
    const k = sz / Math.max(im.naturalWidth, im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
    cx.drawImage(im, -w / 2, -h / 2, w, h);
    cx.restore();
  }
  cx.globalAlpha = 1;
}
