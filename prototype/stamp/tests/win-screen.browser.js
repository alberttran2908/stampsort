// Test trình duyệt cho R12 + P6: màn thắng dàn dựng, thứ tự nút, chạm để tua, ô xu trên lớp mờ, sự kiện analytics.
// Chạy TRONG TRÌNH DUYỆT (không phải Node), PointerEvent thật. Save của trang bị thay bằng save mẫu: dùng profile riêng.
//
//   const m = await import('/tests/win-screen.browser.js');
//   m.setup();                    // ghi save mẫu (mở tới L20, đã xem hết tutorial) rồi reload; chờ trang tải xong
//   // sau reload:
//   const m = await import('/tests/win-screen.browser.js');
//   await m.runAll();             // mảng "PASS|FAIL  tên  [chi tiết]"
//   await m.runEvents();          // cùng phiên, trang mở lại với ?idle=3&debug: ad_offer extra_slot, app_hidden, idle_long, bảng Events
//                                 // (bảng Events cần tap_drift trong bộ đệm: chạy naive-drag runDrift trước)
//
// Thắng bằng __game.autoplay(270): bước >= 250 ms vì rút bài nhanh hơn bị coi là chạm đúp.
// Đo thời gian bằng MutationObserver: t0 = body có class "win" (đầu dòng thời gian), "sẵn sàng" = mọi nút hết class "wait".
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;
const SAVE_KEY = () => 'stampsort_proto_v1' + (G().variant === 'b' ? '_b' : '');
const EVENTS_KEY = 'stampsort_events_v1';
const save = () => JSON.parse(localStorage.getItem(SAVE_KEY()) || '{}');
const events = (name, pred = () => true) => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]').filter(e => e.name === name && pred(e));
const CONT = ['Continue', 'Tiếp tục'];

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
async function closePanels(ms = 3000) {
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
  await closePanels(2000);
  await settle();
}
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
function press(el, { down = true } = {}) {
  const c = center(el);
  const o = { clientX: c.x, clientY: c.y, pointerId: 3, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true };
  if (down) el.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1 }));
  el.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 }));
}
async function until(fn, ms = 5000, step = 10) {
  for (const t0 = performance.now(); performance.now() - t0 < ms;) { const v = fn(); if (v) return v; await sleep(step); }
  return null;
}

/** Thắng level idx bằng solver; tapAt (ms từ t0): chạm để tua. Trả về số đo. */
async function playToWin(idx, { tapAt = null } = {}) {
  await enter(idx);
  const m = { t0: 0, tPanel: 0, tReady: 0, tTap: 0, tSkip: 0 };
  const mo = new MutationObserver(() => {
    const now = performance.now();
    if (!m.t0 && document.body.classList.contains('win')) m.t0 = now;
    if (m.t0 && !m.tPanel && document.querySelector('.panel.win')) m.tPanel = now;
    const btns = [...document.querySelectorAll('.panel.win .btn')];
    if (m.tPanel && !m.tReady && btns.length && btns.every(b => !b.classList.contains('wait'))) m.tReady = now;
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
  G().autoplay(270);   // >= 250 ms: onDeck bỏ chạm đúp trong 250 ms (tooSoon), nhanh hơn thì lời giải lệch
  await until(() => m.t0, 120000, 20);
  m.coinsAtT0 = save().coins;
  if (tapAt != null && m.t0) {
    await until(() => performance.now() >= m.t0 + tapAt, 5000, 2);
    const target = document.elementFromPoint(innerWidth / 2, innerHeight * 0.4);
    const o = { clientX: innerWidth / 2, clientY: innerHeight * 0.4, pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: 1 };
    m.tTap = performance.now();
    m.tapTarget = target ? target.className || target.id || target.tagName : 'null';
    target.dispatchEvent(new PointerEvent('pointerdown', o));
    const want = () => { const lc = events('level_complete').pop(); return lc ? lc.stars : 3; };
    await until(() => {
      const on = document.querySelectorAll('.panel.win .stars i.on').length;
      const btns = [...document.querySelectorAll('.panel.win .btn')];
      const w = G().win;
      return on === want() && btns.length && btns.every(b => !b.classList.contains('wait')) && w && w.paid === w.reward;
    }, 3000, 5);
    m.tSkip = performance.now();
    // ngón tay tua nhấc lên đúng trên nút đầu: không được tính là bấm nút
    const b0 = document.querySelector('.panel.win .btn');
    if (b0) b0.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 }));
    await sleep(50);
    m.panelAfterLift = !!document.querySelector('.panel.win');
  }
  await until(() => m.tReady, 8000, 10);
  mo.disconnect();
  m.btns = [...document.querySelectorAll('.panel.win .btn')].map(b => ({ text: b.textContent.trim(), small: b.classList.contains('small') }));
  m.stars = document.querySelectorAll('.panel.win .stars i.on').length;
  m.win = G().win;
  return m;
}
function coinHit() {
  const box = document.querySelector('.hud-coins.clone');
  if (!box) return 'không có bản sao ô xu';
  const c = center(box);
  const el = document.elementFromPoint(c.x, c.y);
  return el && el.closest('.hud-coins') ? 'ok' : `trúng ${el ? el.className || el.tagName : 'null'}`;
}

const SCEN = [];
const scen = (name, fn) => SCEN.push({ name, fn });

scen('L3: "Tiếp tục" là nút đầu, không có x2; nút bấm được <= 2600 ms; ô xu nằm trên lớp mờ; win_button', async () => {
  const nBtn = events('win_button').length;
  const m = await playToWin(2);
  const ready = Math.round(m.tReady - m.t0), panelAt = Math.round(m.tPanel - m.t0);
  const hit = coinHit();
  await sleep(1600);                                     // xu bay xong, số đếm dần xong
  const shown = Number((document.querySelector('.hud-coins.clone span') || {}).textContent);
  const coinsOk = shown === save().coins;
  const first = m.btns[0] || {};
  const b0 = document.querySelector('.panel.win .btn');
  press(b0);
  await sleep(500);
  const ev = events('win_button').slice(nBtn);
  const pass = CONT.includes(first.text) && !m.btns.some(b => b.small) && m.tReady && ready <= 2600 && hit === 'ok' && coinsOk
    && ev.length === 1 && ev[0].button === 'continue' && G().level === 4;
  return { pass, detail: `nút: ${m.btns.map(b => b.text + (b.small ? '(nhỏ)' : '')).join(' | ')}; bảng lúc ${panelAt} ms, sẵn sàng ${ready} ms; ô xu: ${hit}; số xu hiện ${shown} = save ${save().coins}: ${coinsOk}; win_button ${JSON.stringify(ev.map(e => ({ b: e.button, ms: e.ms, skipped: e.skipped })))}; sang L${G().level}` };
});
scen('L12: chạm ở 1000 ms -> <= 300 ms đủ Tem Điểm, nút bấm được, xu cộng đủ; nhấc ngón không bấm nút; x2 nhỏ -> ad_offer/ad_watch win_x2', async () => {
  const nOffer = events('ad_offer', e => e.placement === 'win_x2').length, nWatch = events('ad_watch', e => e.placement === 'win_x2').length;
  const m = await playToWin(11, { tapAt: 1000 });
  const skipMs = Math.round(m.tSkip - m.tTap);
  const lc = events('level_complete').pop();
  const coinsOk = save().coins >= m.coinsAtT0 + m.win.reward;
  const first = m.btns[0] || {}, x2 = m.btns.find(b => b.small);
  const offer = events('ad_offer', e => e.placement === 'win_x2').length - nOffer;
  const small = [...document.querySelectorAll('.panel.win .btn.small')][0];
  if (small) press(small);
  await sleep(2400);                                     // quảng cáo giả 1,4 giây
  const watch = events('ad_watch', e => e.placement === 'win_x2').length - nWatch;
  const wb = events('win_button').pop();
  await sleep(1800);
  const pass = skipMs <= 300 && m.stars === lc.stars && m.win.paid === m.win.reward && coinsOk && m.panelAfterLift
    && CONT.includes(first.text) && !!x2 && offer === 1 && watch === 1 && wb && wb.button === 'x2' && wb.skipped === true;
  return { pass, detail: `chạm vào "${m.tapTarget}" ở ${Math.round(m.tTap - m.t0)} ms, xong sau ${skipMs} ms; Tem Điểm ${m.stars}/${lc.stars}; thưởng ${m.win.paid}/${m.win.reward}, save ${m.coinsAtT0} -> ${save().coins}; bảng còn sau khi nhấc ngón: ${m.panelAfterLift}; nút: ${m.btns.map(b => b.text + (b.small ? '(nhỏ)' : '')).join(' | ')}; ad_offer win_x2 +${offer}, ad_watch win_x2 +${watch}, win_button ${wb && wb.button} skipped=${wb && wb.skipped}` };
});
scen('L20 (hết chương 2): không có x2', async () => {
  const m = await playToWin(19);
  const pass = CONT.includes((m.btns[0] || {}).text) && !m.btns.some(b => b.small);
  press(document.querySelector('.panel.win .btn'));
  await sleep(800);
  await closePanels(1500);
  return { pass, detail: `nút: ${m.btns.map(b => b.text + (b.small ? '(nhỏ)' : '')).join(' | ')}` };
});
scen('Giảm chuyển động: không phong bì/confetti, bảng hiện ngay, nút bấm được sớm', async () => {
  G().settings.set('motion', 'reduce');
  const m = await playToWin(2);
  const ready = Math.round(m.tReady - m.t0), panelAt = Math.round(m.tPanel - m.t0);
  G().settings.set('motion', 'auto');
  press(document.querySelector('.panel.win .btn'));
  await sleep(500);
  return { pass: m.tReady && ready <= 1600 && panelAt <= 400, detail: `bảng lúc ${panelAt} ms, sẵn sàng ${ready} ms` };
});

/** Save mẫu: đã qua tutorial, mở tới L20, nhiều xu. */
export function setup() {
  const seen = {};
  for (const k of ['rules', 'script_1', 'script_4', 'script_7', 'script_9', 'unlock_hint', 'unlock_pack', 'unlock_stamper', 'unlock_joker',
    'moves', 'crown', 'tap', 'draw', 'stack', 'peek', 'empty', 'full', 'intro_11', 'intro_12', 'pts_explain']) seen[k] = 1;
  for (let i = 11; i <= 20; i++) seen['intro_' + i] = 1;
  localStorage.setItem(SAVE_KEY(), JSON.stringify({ unlocked: 20, coins: 2000, stars: {}, hint: 3, pack: 2, stamper: 2, joker: 2, slot: 0, seen, attempts: {}, fixture: 'win-test' }));
  localStorage.removeItem(SAVE_KEY() + '_resume');
  location.reload();
}
const ready = () => save().fixture === 'win-test';

export async function runAll() {
  if (!ready()) return ['SETUP  chưa có save mẫu: gọi setup() rồi chạy lại sau khi trang tải xong'];
  G().settings.set('motion', 'auto');
  await closePanels(800);
  const out = [];
  for (const s of SCEN) {
    try { const r = await s.fn(); out.push(`${r.pass ? 'PASS' : 'FAIL'}  ${s.name}  [${r.detail}]`); } catch (e) { out.push(`ERR   ${s.name}  ${String(e && e.stack).slice(0, 300)}`); }
  }
  G().goHome();
  return out;
}

/** Sự kiện R12 còn lại. Trang phải mở với ?idle=3 (và ?debug để kiểm bảng Events). */
export async function runEvents() {
  if (!/idle=3/.test(location.search)) return ['SETUP  mở trang với ?idle=3&debug'];
  const out = [];
  const n0 = name => events(name).length;
  const before = { offer: events('ad_offer', e => e.placement === 'extra_slot').length, hidden: n0('app_hidden'), idle: n0('idle_long'), pause: n0('pause_open'), rules: n0('rules_open') };
  await enter(2);
  document.querySelector('.slot.locked').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await sleep(500);
  const offer = events('ad_offer', e => e.placement === 'extra_slot').length - before.offer;
  await closePanels(1200);
  out.push(`${offer === 1 ? 'PASS' : 'FAIL'}  ad_offer extra_slot khi mở bảng Ô phụ  [+${offer}]`);
  // app vào nền (giả document.hidden)
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
  delete document.hidden;
  document.dispatchEvent(new Event('visibilitychange'));
  const hid = n0('app_hidden') - before.hidden;
  out.push(`${hid === 1 ? 'PASS' : 'FAIL'}  app_hidden khi app vào nền  [+${hid}]`);
  // đứng yên > 3 giây (?idle=3), interval 1,5 giây
  await sleep(6500);
  const idle = events('idle_long').slice(before.idle);
  out.push(`${idle.length === 1 && idle[0].s >= 3 ? 'PASS' : 'FAIL'}  idle_long sau ~6 giây đứng yên (1 lần/đợt)  [${JSON.stringify(idle.map(e => ({ s: e.s, moves_used: e.moves_used })))}]`);
  // Pause, Cách chơi
  document.getElementById('pauseBtn').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await sleep(500);
  const howto = visibleBtns()[1];
  if (howto) howto.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await sleep(500);
  await closePanels(1000);
  const pz = n0('pause_open') - before.pause, ru = n0('rules_open') - before.rules;
  out.push(`${pz === 1 && ru === 1 ? 'PASS' : 'FAIL'}  pause_open, rules_open  [+${pz}, +${ru}]`);
  // bảng Events trong ?debug: đủ 5 tên sự kiện của AC R12
  const evBtn = [...document.querySelectorAll('#debug button')].find(b => b.textContent === 'Events');
  if (evBtn) evBtn.click();
  await sleep(500);
  const txt = (document.querySelector('.panel') || {}).textContent || '';
  const need = ['tap_drift', 'win_button', 'ad_offer', 'app_hidden', 'idle_long'];
  const got = need.map(n => { const m = txt.match(new RegExp(n + ': (\\d+)')); return [n, m ? +m[1] : 0]; });
  out.push(`${got.every(([, c]) => c > 0) ? 'PASS' : 'FAIL'}  Bảng Events ?debug có đủ 5 sự kiện AC  [${got.map(([n, c]) => n + ' ' + c).join(', ')}]`);
  const close = visibleBtns().find(b => b.textContent.trim() === 'Close');
  if (close) close.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await sleep(400);
  G().goHome();
  return out;
}
export { playToWin, enter, settle, coinHit };
