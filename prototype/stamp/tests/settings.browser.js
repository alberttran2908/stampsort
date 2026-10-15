// Test trình duyệt cho R13: cỡ chữ 3 mức không làm tràn chữ / panel, cài đặt giữ sau reload, Giảm chuyển động tắt rung màn.
// Chạy TRONG TRÌNH DUYỆT, PointerEvent thật cho nút panel. Dùng profile trình duyệt riêng (save bị thay bằng save mẫu).
//
//   const m = await import('/tests/settings.browser.js');
//   m.setup();                     // save mẫu + reload
//   // sau reload:
//   const m = await import('/tests/settings.browser.js');
//   await m.runOverflow();         // (a) 3 mức chữ x 9 màn: không phần tử nào tràn ngang, đáy panel trong màn hình
//   await m.runMotion();           // (c) Giảm chuyển động: Stamper không làm rung bàn (board.style.transform rỗng)
//   await m.prepareReload();       // (b) đổi mọi cài đặt qua bảng Cài đặt rồi tải lại trang (không query)
//   // sau reload:
//   const m = await import('/tests/settings.browser.js');
//   await m.checkReload();         // đọc lại: giá trị giữ nguyên, --fs đúng, nhạc/rung khớp
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;
const SAVE_KEY = () => 'stampsort_proto_v1' + (G().variant === 'b' ? '_b' : '');
const RELOAD_KEY = 'settings_test_reload';
const save = () => JSON.parse(localStorage.getItem(SAVE_KEY()) || '{}');

async function settle(maxMs = 5000) {
  const t0 = performance.now();
  await sleep(60);
  while (performance.now() - t0 < maxMs) {
    if (!G().busy) { await sleep(320); if (!G().busy) return true; }
    await sleep(50);
  }
  return false;
}
const visibleBtns = () => [...document.querySelectorAll('.panel .btn')].filter(b => b.offsetParent);
async function closePanels(ms = 2500) {
  for (const t0 = performance.now(); performance.now() - t0 < ms;) {
    const b = visibleBtns()[0];
    if (b) b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await sleep(300);
  }
}
async function enter(idx) {
  G().startLevel(idx);
  await sleep(400);
  await settle(9000);
  await closePanels(1800);
  await settle();
}
async function step() {
  const g = G(), acts = g.E.legalMoves(g.S).filter(a => a.src && a.dst);
  if (acts.length) g.doMove(acts[0].src, acts[0].dst, false); else g.onDeck();
  await settle();
}

/** Quét tràn: mọi phần tử trong .panel/.album/.toast/.tut đang hiện; đáy panel/album không ra khỏi màn hình. */
function scan(label) {
  const bad = [];
  const roots = [...document.querySelectorAll('.panel, .album:not(.off), .toast.on, .tut.on')].filter(r => r.offsetParent || r.getClientRects().length);
  for (const root of roots) {
    // .panel: ruy băng tiêu đề (.head) cố ý rộng hơn panel -> đo phần thân (.pin) và mọi phần tử bên trong
    const els = root.matches('.panel') ? [...root.querySelectorAll('.pin, .pin *')] : [root, ...root.querySelectorAll('*')];
    for (const el of els) {
      if (!el.clientWidth) continue;
      if (el.scrollWidth > el.clientWidth + 1) bad.push(`${label}: tràn ngang ${el.className || el.tagName} "${(el.textContent || '').trim().slice(0, 24)}" ${el.scrollWidth}>${el.clientWidth}`);
    }
    if (root.matches('.panel, .album')) {
      const r = root.getBoundingClientRect();
      if (r.bottom > innerHeight + 1) bad.push(`${label}: đáy ${root.className} ${Math.round(r.bottom)} > ${innerHeight}`);
      if (r.top < -1) bad.push(`${label}: đỉnh ${root.className} ${Math.round(r.top)} < 0`);
    }
  }
  return { roots: roots.length, bad };
}

const SCREENS = [
  ['Pause', async () => { document.getElementById('pauseBtn').dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await sleep(500); }],
  ['Cài đặt', async () => { G().settingsPanel(); await sleep(400); }],
  ['Cách chơi', async () => { G().showRules(); await sleep(500); }],
  ['Xác nhận Chơi lại', async () => { await step(); G().confirmRestart(); await sleep(500); }],
  ['Ván đang dở', async () => { await step(); G().saveRun(); const run = G().loadRun(); if (run) G().askResume(run); await sleep(500); }],
  ['Hết nước', async () => {
    const g = G(); const s = g.E.clone(g.S); s.moves = 1; g.setState(s);
    await step(); await sleep(1200);
  }],
  ['Album', async () => { G().goHome(); await sleep(300); G().openAlbum(); await sleep(400); }],
];

export async function runOverflow() {
  if (save().fixture !== 'settings-test') return ['SETUP  gọi setup() trước'];
  const out = [];
  for (const lv of [0, 1, 2]) {
    G().settings.set('text', lv);
    const fsVal = getComputedStyle(document.body).getPropertyValue('--fs').trim();
    const bad = [];
    let screens = 0;
    for (const [name, open] of SCREENS) {
      await enter(2);
      await open();
      const r = scan(name);
      screens += r.roots ? 1 : 0;
      if (!r.roots) bad.push(`${name}: không thấy bảng`);
      bad.push(...r.bad);
      await closePanels(900);
      document.getElementById('album').classList.add('off');
    }
    // toast + gợi ý (tut) trên bàn
    await enter(2);
    document.getElementById('undoBtn').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await sleep(300);
    const tr = scan('Toast'); bad.push(...tr.bad);
    // màn thắng
    await enter(2);
    G().autoplay(270);   // >= 250 ms: onDeck bỏ chạm đúp trong 250 ms (tooSoon), nhanh hơn thì lời giải lệch
    for (let i = 0; i < 600 && !(document.querySelector('.panel.win .btn') && G().win && G().win.ended); i++) await sleep(100);
    const wr = scan('Màn thắng'); bad.push(...wr.bad);
    if (!wr.roots) bad.push('Màn thắng: không thấy bảng');
    await closePanels(900);
    out.push(`${bad.length ? 'FAIL' : 'PASS'}  Cỡ chữ ${['Thường', 'Lớn', 'Rất lớn'][lv]} (--fs ${fsVal}): ${screens}/${SCREENS.length} bảng + toast + màn thắng${bad.length ? '  [' + bad.slice(0, 8).join('; ') + ']' : ''}`);
  }
  G().settings.set('text', 1);
  G().goHome();
  return out;
}

export async function runMotion() {
  if (save().fixture !== 'settings-test') return ['SETUP  gọi setup() trước'];
  const res = [];
  for (const mode of ['reduce', 'auto']) {
    G().settings.set('motion', mode);
    await enter(7);                                   // L8: Stamper đã mở
    const board = document.getElementById('board');
    const g = G();
    const col = g.S.cols.findIndex(c => c.some(x => !x.up));
    const b = document.querySelector('.booster[data-id=stamper]');
    b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await sleep(200);
    const geo = g.geo();
    const x = geo.stageLeft + (geo.cols[col] + geo.CW / 2) * geo.scale, y = geo.stageTop + (geo.TAB_Y + 30) * geo.scale;
    board.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, pointerId: 4, bubbles: true, buttons: 1 }));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, pointerId: 4, bubbles: true }));
    let moved = 0, samples = 0;
    for (const t0 = performance.now(); performance.now() - t0 < 900;) { samples++; if (board.style.transform) moved++; await sleep(8); }
    res.push({ mode, col, moved, samples, bodyClass: document.body.classList.contains('reduce-motion') });
    await settle();
  }
  G().settings.set('motion', 'auto');
  G().goHome();
  const [r, a] = res;
  return [`${r.moved === 0 && r.bodyClass && a.moved > 0 ? 'PASS' : 'FAIL'}  Giảm chuyển động: Stamper không rung bàn  [bật: ${r.moved}/${r.samples} khung có transform, body.reduce-motion ${r.bodyClass}; tắt (đối chứng): ${a.moved}/${a.samples}]`];
}

const WANT = { text: 2, sfx: 1, motion: 'reduce', music: false, haptics: false, lang: 'en' };
export async function prepareReload() {
  // đổi qua bảng Cài đặt bằng PointerEvent thật (giống người chơi), không gọi API
  G().settingsPanel();
  await sleep(400);
  const tap = async (key, v) => {
    const b = document.querySelector(`.seg[data-key="${key}"] b[data-v="${v}"]`);
    if (b) b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await sleep(250);
  };
  await tap('text', 2); await tap('sfx', 1); await tap('motion', 1); await tap('music', 0); await tap('haptics', 0); await tap('lang', 'en');
  const now = { text: G().settings.get('text'), sfx: G().settings.sfx(), motion: G().settings.get('motion'), music: G().settings.music(), haptics: G().settings.haptics() };
  sessionStorage.setItem(RELOAD_KEY, JSON.stringify(now));
  location.href = location.pathname;          // bỏ query (?lang=... sẽ đè ngôn ngữ đã lưu)
  return now;
}
export async function checkReload() {
  const before = JSON.parse(sessionStorage.getItem(RELOAD_KEY) || 'null');
  if (!before) return 'SETUP  gọi prepareReload() trước';
  sessionStorage.removeItem(RELOAD_KEY);
  await sleep(500);
  const s = G().settings;
  const got = { text: s.get('text'), sfx: s.sfx(), motion: s.get('motion'), music: s.music(), haptics: s.haptics(), lang: document.documentElement.lang };
  const fsVal = getComputedStyle(document.body).getPropertyValue('--fs').trim();
  const ok = Object.keys(WANT).every(k => got[k] === WANT[k]) && fsVal === '1.3' && document.body.classList.contains('reduce-motion');
  const events = JSON.parse(localStorage.getItem('stampsort_events_v1') || '[]').filter(e => e.name === 'setting_change').slice(-6).map(e => `${e.key}:${e.from}->${e.to}`);
  // trả về mặc định cho các test sau
  s.set('text', 1); s.set('sfx', 2); s.set('motion', 'auto');
  return `${ok ? 'PASS' : 'FAIL'}  Cài đặt giữ sau reload: ${JSON.stringify(got)}, --fs ${fsVal}; trước reload ${JSON.stringify(before)}; setting_change: ${events.join(', ')}`;
}

export function setup() {
  const seen = {};
  for (const k of ['rules', 'script_1', 'script_4', 'script_7', 'script_9', 'unlock_hint', 'unlock_pack', 'unlock_stamper', 'unlock_joker',
    'moves', 'crown', 'tap', 'draw', 'stack', 'peek', 'empty', 'full', 'pts_explain']) seen[k] = 1;
  for (let i = 1; i <= 20; i++) seen['intro_' + i] = 1;
  localStorage.setItem(SAVE_KEY(), JSON.stringify({ unlocked: 12, coins: 2000, stars: {}, hint: 3, pack: 2, stamper: 5, joker: 2, slot: 0, seen, attempts: {}, fixture: 'settings-test',
    album: { Cat: [1, 2, 3], Boat: [1, 2] } }));
  localStorage.removeItem(SAVE_KEY() + '_resume');
  location.reload();
}
export { scan, enter, settle };
