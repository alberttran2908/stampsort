// WebAudio: nạp trước toàn bộ sfx, phát không trễ, hỗ trợ pitch/volume.
// SFX tự tổng hợp bằng tools/synth_sfx.py (sfx/<tên>.mp3), không dùng âm thanh của APK.
// Nhạc nền và không khí bưu điện tự tổng hợp bằng tools/synth_music.py (music/<tên>.mp3, music/meta.json).
// Haptic nằm ở haptics.js.
const NAMES = ['pick', 'place', 'open', 'complete', 'flip', 'back', 'draw', 'hint', 'joker', 'magnet', 'feature',
  'slot', 'win', 'lose', 'coin', 'coins', 'claim', 'click', 'close', 'whoosh', 'sparkle', 'boom',
  // thêm sau review SFX (docs/design/sfx-review.md): từ chối, chạm lá úp, con dấu, Overtime, decor, chương, lật lại bộ bài, popup
  'deny', 'facedown', 'stamp', 'overtime', 'decor', 'chapter', 'recycle', 'popup'];
for (let i = 1; i <= 11; i++) NAMES.push('combo' + i);

const SFX_LEVEL = 0.8;
let ctx = null;
let master = null;
const buffers = {};
let muted = false;
let musicOn = true;
try {
  muted = localStorage.getItem('ss_muted') === '1';
  musicOn = localStorage.getItem('ss_music') !== '0';     // mặc định bật (ở mức nhỏ, xem MUSIC_LEVEL)
} catch (e) { /* storage bị chặn */ }

export async function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : SFX_LEVEL;
  master.connect(ctx.destination);
  initMusicGraph();
  await Promise.all(NAMES.map(async (k) => {
    try {
      const res = await fetch(`sfx/${k}.mp3`);
      buffers[k] = await ctx.decodeAudioData(await res.arrayBuffer());
    } catch (e) { /* thiếu file: im lặng */ }
  }));
  loadMusic();          // sau SFX: nhạc không giành băng thông với âm thao tác
}

export function unlockAudio() {
  if (ctx && ctx.state !== 'running' && !document.hidden) ctx.resume().catch(() => {});
  onGesture();
}

// Biến thể cao độ nhỏ (±3%) cho âm thao tác lặp nhiều, để 40 lần mỗi ván không nghe y hệt (benchmark P10)
const JITTER = new Set(['pick', 'draw', 'flip']);
// Âm lớn thì nhạc nhỏ đi (ducking): độ giảm dB
const DUCK = { win: 6, chapter: 6, feature: 6, complete: 4, lose: 4 };

const lastPlay = {};
export function sfx(name, { vol = 1, rate = 1, delay = 0 } = {}) {
  if (!ctx || !buffers[name] || muted) return;
  const now = ctx.currentTime;
  if (lastPlay[name] && now - lastPlay[name] < 0.03 && !delay) return;   // chống chồng tiếng
  lastPlay[name] = now;
  if (rate === 1 && JITTER.has(name)) rate = 0.97 + Math.random() * 0.06;
  const src = ctx.createBufferSource();
  src.buffer = buffers[name];
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(g).connect(master);
  src.start(now + delay);
  if (DUCK[name]) duck(DUCK[name], delay, buffers[name].duration / rate);
}

export function comboSfx(step) {
  const i = Math.max(1, Math.min(11, step));
  sfx('combo' + i, { vol: 0.9 });
}

export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('ss_muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
  if (master) master.gain.value = m ? 0 : SFX_LEVEL;
}
export const isMuted = () => muted;

// ============================================================ nhạc nền + không khí (P10)
// Đồ thị: nguồn -> gain bản nhạc (mức trong meta.json, fade) -> duck -> musicBus (bật/tắt, ẩn app) -> loa.
// Mỗi bản là 1 vòng lặp liền mạch: file = 1 chu kỳ + xfade_s giây đầu lặp ở cuối. Phát 2 bản chồng nhau,
// crossfade tuyến tính xfade_s giây ở điểm nối (2 tín hiệu giống hệt nhau nên tổng không đổi), không phụ thuộc
// độ trễ encoder mp3 và không có click. Giải mã khi cần, nhả bộ nhớ bản không dùng.
const MUSIC_LEVEL = SFX_LEVEL;          // gain trong meta.json đã đưa nhạc về -31 LUFS, nằm dưới âm thao tác ~3 dB
const SCENE_TRACKS = { home: 'home', play: 'play' };
let musicBus = null;
let duckNode = null;
let meta = null;
const raw = {};                          // ArrayBuffer mp3 đã tải (nhỏ), giải mã lại khi cần
const players = {};
let scene = 'home';
let gestured = false;
let pumpTimer = 0;

function initMusicGraph() {
  musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  duckNode = ctx.createGain();
  duckNode.connect(musicBus).connect(ctx.destination);
  const gesture = () => unlockAudio();
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'keydown']) addEventListener(ev, gesture, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? pauseAll() : resumeAll()));
  document.addEventListener('pause', pauseAll);      // Capacitor: app vào nền
  document.addEventListener('resume', resumeAll);
  addEventListener('pagehide', pauseAll);
  addEventListener('pageshow', resumeAll);
}

async function loadMusic() {
  try {
    meta = await (await fetch('music/meta.json')).json();
    await Promise.all(['home', 'play', 'ambience'].map(async (k) => {
      try { raw[k] = await (await fetch(`music/${k}.mp3`)).arrayBuffer(); } catch (e) { /* thiếu file: bỏ qua */ }
    }));
  } catch (e) { meta = null; }
  applyScene();
}

function onGesture() {
  if (gestured || !ctx) return;
  gestured = true;
  if (musicOn) fadeBus(MUSIC_LEVEL, 2.5);
  applyScene();
}

function fadeBus(to, sec) {
  if (!musicBus) return;
  const g = musicBus.gain, now = ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(to, now + sec);
}

function duck(db, delay, dur) {
  if (!duckNode || !musicOn) return;
  const g = duckNode.gain, now = ctx.currentTime + delay;
  const low = Math.pow(10, -db / 20);
  g.cancelScheduledValues(ctx.currentTime);
  g.setValueAtTime(g.value, ctx.currentTime);
  g.linearRampToValueAtTime(low, now + 0.3);
  g.setValueAtTime(low, now + Math.max(0.3, dur * 0.7));
  g.linearRampToValueAtTime(1, now + Math.max(0.3, dur * 0.7) + 1.5);
}

async function player(name) {
  const p = players[name] = players[name] || { name, out: null, buf: null, decoding: null, alive: false, next: 0, first: true, srcs: new Set(), stopT: 0 };
  if (!p.buf && raw[name]) {
    p.decoding = p.decoding || ctx.decodeAudioData(raw[name].slice(0)).then(b => { p.buf = b; p.decoding = null; return b; }, () => { p.decoding = null; return null; });
    await p.decoding;
  }
  return p.buf ? p : null;
}

function schedule(p) {
  const L = meta[p.name].loop_s, X = meta[p.name].xfade_s;
  const now = ctx.currentTime;
  while (p.alive && p.next < now + 6) {
    const t0 = p.next;
    const off = Math.max(0, now - t0);           // trễ (tab bị treo): vào giữa bản cho đúng pha
    const src = ctx.createBufferSource();
    src.buffer = p.buf;
    const g = ctx.createGain();
    if (p.first) g.gain.setValueAtTime(1, t0);
    else { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + X); }
    g.gain.setValueAtTime(1, t0 + L);
    g.gain.linearRampToValueAtTime(0, t0 + L + X);
    src.connect(g).connect(p.out);
    src.start(t0 + off, off);
    src.stop(t0 + L + X + 0.05);
    const set = p.srcs;
    set.add(src);
    src.onended = () => { set.delete(src); try { g.disconnect(); } catch (e) { /* ignore */ } };
    p.first = false;
    p.next = t0 + L;
  }
}

function pump() {
  for (const p of Object.values(players)) if (p.alive && p.buf) schedule(p);
}

function startPlayer(p, level, fade) {
  const now = ctx.currentTime;
  if (!p.alive) {                       // phiên mới có gain riêng: phiên cũ (nếu đang fade out) tự tắt, không chồng lệch pha
    p.out = ctx.createGain();
    p.out.gain.value = 0;
    p.out.connect(duckNode);
    p.srcs = new Set();
    p.alive = true;
    p.first = true;
    p.next = now + 0.05;
  }
  const g = p.out.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(level, now + fade);
  p.stopT = 0;
  schedule(p);
  if (!pumpTimer) pumpTimer = setInterval(pump, 1000);
}

function stopPlayer(p, fade) {
  if (!p || !p.alive) return;
  const now = ctx.currentTime;
  const out = p.out, g = out.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(0, now + fade);
  p.alive = false;
  for (const s of p.srcs) { try { s.stop(now + fade + 0.05); } catch (e) { /* ignore */ } }
  const token = p.stopT = now + fade;
  setTimeout(() => {
    try { out.disconnect(); } catch (e) { /* ignore */ }
    if (!p.alive && p.stopT === token) p.buf = null;      // nhả bộ nhớ (giải mã lại khi cần)
  }, (fade + 0.5) * 1000);
}

let sceneToken = 0;
async function applyScene() {
  if (!ctx || !meta) return;
  const token = ++sceneToken;
  const want = SCENE_TRACKS[scene] || 'home';
  if (!gestured || !musicOn) {
    if (!musicOn) for (const p of Object.values(players)) stopPlayer(p, 1.0);
    return;
  }
  for (const k of Object.values(SCENE_TRACKS)) if (k !== want) stopPlayer(players[k], 2.5);
  const [m, a] = await Promise.all([player(want), player('ambience')]);
  if (token !== sceneToken || !musicOn) return;          // cảnh đã đổi trong lúc giải mã
  if (m) startPlayer(m, meta[want].gain, 3);
  if (a) startPlayer(a, scene === 'play' ? meta.ambience.gain_play : meta.ambience.gain, 4);
}

// main.js gọi khi đổi màn: 'home' (màn chính) hoặc 'play' (màn chơi)
export function setMusicScene(s) {
  if (s === scene) return;
  scene = s;
  applyScene();
}

export function setMusicOn(on) {
  musicOn = !!on;
  try { localStorage.setItem('ss_music', on ? '1' : '0'); } catch (e) { /* ignore */ }
  if (!ctx) return;
  if (musicOn) { fadeBus(gestured ? MUSIC_LEVEL : 0, 1.5); applyScene(); }
  else { fadeBus(0, 0.8); applyScene(); }
}
export const isMusicOn = () => musicOn;

let hiddenRunning = false;
function pauseAll() {
  if (!ctx || hiddenRunning) return;
  hiddenRunning = ctx.state === 'running';
  if (!hiddenRunning) return;
  fadeBus(0, 0.15);
  setTimeout(() => { if (hiddenRunning) ctx.suspend().catch(() => {}); }, 180);
}
function resumeAll() {
  if (!ctx || !hiddenRunning || document.hidden) return;
  hiddenRunning = false;
  ctx.resume().catch(() => {}).then(() => { if (musicOn && gestured) fadeBus(MUSIC_LEVEL, 1.5); });
}

// Chỉ để kiểm thử (Chrome headless, sfx-preview): trạng thái nhạc hiện tại
export function musicState() {
  return {
    ctx: ctx && ctx.state, gestured, musicOn, scene, meta: !!meta, loaded: Object.keys(raw),
    bus: musicBus && +musicBus.gain.value.toFixed(3), duck: duckNode && +duckNode.gain.value.toFixed(3),
    playing: Object.values(players).filter(p => p.alive).map(p => ({ name: p.name, decoded: !!p.buf, level: +p.out.gain.value.toFixed(3), sources: p.srcs.size })),
  };
}
