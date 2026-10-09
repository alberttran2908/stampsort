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
export function clearParticles() { parts.length = 0; if (cx) cx.clearRect(0, 0, 1080, 1920); }
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
export function initFx(canvas) { cv = canvas; cx = canvas.getContext('2d'); }
/** Máy yếu: canvas hiệu ứng nửa độ phân giải (ít pixel/frame 4 lần), ít hạt hơn, hạt vẽ fillRect không xoay. */
export function setLite(on) {
  LITE = !!on;
  PSCALE = LITE ? 0.4 : 1;
  if (!cv) return;
  const k = LITE ? 0.5 : 1;
  cv.width = 1080 * k; cv.height = 1920 * k;
  cx.setTransform(k, 0, 0, k, 0, 0);
}
function img(src) {
  if (!imgCache[src]) { const i = new Image(); i.src = src; imgCache[src] = i; }
  return imgCache[src];
}

const COLORS = ['#ffd84a', '#ff7a59', '#5fd3ff', '#8cff7a', '#ff9de2', '#ffffff'];
/** Tia sáng nhỏ khi đặt tem. */
export function sparkle(x, y, n = 10, { spread = 1, colors = ['#fff7b0', '#ffe36b', '#ffffff'], size = 9 } = {}) {
  n = Math.max(1, Math.round(n * PSCALE));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (160 + Math.random() * 380) * spread;
    parts.push({ kind: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 700, life: 0.5 + Math.random() * 0.35,
      t: 0, size: size * (0.6 + Math.random() * 0.8), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
      color: colors[(Math.random() * colors.length) | 0] });
  }
  loop();
}
/** Confetti khi thắng. */
export function confetti(n = 160) {
  n = Math.round(n * PSCALE);
  for (let i = 0; i < n; i++) {
    parts.push({ kind: 'rect', x: 540 + (Math.random() - 0.5) * 300, y: 700, vx: (Math.random() - 0.5) * 1700,
      vy: -900 - Math.random() * 1100, g: 1500, drag: 1.6, life: 2.4 + Math.random(), t: 0, w: 16 + Math.random() * 14,
      h: 9 + Math.random() * 8, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      color: COLORS[(Math.random() * COLORS.length) | 0] });
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
export function ring(x, y, { color = '#fff4a0', r0 = 30, r1 = 170, life = 0.45, width = 10 } = {}) {
  parts.push({ kind: 'ring', x, y, r0, r1, life, t: 0, color, width });
  loop();
}

function particlesStep(now) {
  if (!cx) return;
  const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
  lastT = now;
  cx.clearRect(0, 0, 1080, 1920);
  const coin = img('assets-ec8b6642/ui/coin.png');
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
    cx.fillStyle = p.color;
    if (LITE) { const s = p.kind === 'rect' ? p.w : p.size; cx.fillRect(p.x - s / 2, p.y - s / 2, s, p.kind === 'rect' ? p.h : s); continue; }
    cx.save();
    cx.translate(p.x, p.y);
    cx.rotate(p.rot);
    if (p.kind === 'rect') {
      cx.scale(1, Math.abs(Math.cos(p.rot * 1.7)) + 0.15);
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      const s = p.size;
      cx.beginPath();
      for (let j = 0; j < 8; j++) {
        const rr = j % 2 ? s * 0.38 : s;
        const an = (j * Math.PI) / 4;
        cx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
      }
      cx.closePath(); cx.fill();
    }
    cx.restore();
  }
  cx.globalAlpha = 1;
}
