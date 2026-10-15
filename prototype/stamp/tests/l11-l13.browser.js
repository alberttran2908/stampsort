// Test trình duyệt L11 (nhắc nghỉ, thông báo nhẹ), L13 (liveops.json, kill_switch), R11 (banner level khó, Tem Điểm).
// Trang http://localhost:8766/index.html?debug (profile riêng, save bị thay):
//   const m = await import('/tests/l11-l13.browser.js');
//   m.setup(); // reload
//   await m.runAll();                 // trang thường: config từ file, web không hỏi thông báo, plugin giả, nhắc nghỉ, banner khó
//   // trang ?debug&liveops=tests/fixtures/liveops_kill_season.json:  await m.runKill();
//   // trang ?debug&liveops=tests/fixtures/liveops_broken.json:       await m.runBroken();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;
const SAVE_KEY = () => 'stampsort_proto_v1' + (G().variant === 'b' ? '_b' : '');
const EVENTS_KEY = 'stampsort_events_v1';
const events = name => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]').filter(e => e.name === name);
const FIRST = Math.floor(Date.UTC(2026, 8, 21) / 864e5);
const pdMs = pd => { const d = new Date((FIRST + pd - 1) * 864e5); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 8).getTime(); };
async function settle(maxMs = 6000) {
  const t0 = performance.now(); await sleep(60);
  while (performance.now() - t0 < maxMs) { if (!G().busy) { await sleep(320); if (!G().busy) return true; } await sleep(50); }
  return false;
}
const visibleBtns = () => [...document.querySelectorAll('.panel .btn')].filter(b => b.offsetParent && !b.classList.contains('wait'));
const btnTexts = () => visibleBtns().map(b => b.textContent.trim());
function clickText(re) { const b = visibleBtns().find(x => re.test(x.textContent.trim())); if (b) b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return !!b; }
async function closeAll(ms = 1500) { for (const t0 = performance.now(); performance.now() - t0 < ms;) { const b = visibleBtns()[0]; if (b && !G().win) b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await sleep(300); } }
const fixture = (won, extra = {}) => ({ unlocked: won + 1, coins: 1000, stars: Object.fromEntries(Array.from({ length: won }, (_, i) => [i + 1, 3])), hint: 2, pack: 2, stamper: 2, joker: 2, slot: 0,
  seen: { rules: 1, unlock_hint: 1, unlock_pack: 1, unlock_stamper: 1, unlock_joker: 1, tap: 1, pts_explain: 1, feat_daily: 1, feat_route: 1, feat_mailbag: 1, feat_season: 1, feat_errands: 1 },
  attempts: {}, live: { firstOpenDay: FIRST, maxSeenDay: FIRST, lastOpenDay: FIRST }, morning: { last: FIRST + 300, n: 1 }, chv: 2, ...extra });
function setDay(pd) { G().live.setNow(pdMs(pd)); G().save.morning = { last: FIRST + pd - 1, n: 1 }; G().persist(); G().live.touch(); G().refreshHome(); }
function useSave(s) { const cur = G().save; for (const k of Object.keys(cur)) delete cur[k]; Object.assign(cur, s); for (let i = 1; i <= 80; i++) cur.seen['intro_' + i] = 1; G().persist(); }
export function setup() { localStorage.clear(); localStorage.setItem(SAVE_KEY(), JSON.stringify(fixture(16))); location.reload(); }

/** Plugin LocalNotifications giả (giống API Capacitor). */
function fakePlugin(grant = true) {
  const calls = { schedule: [], cancel: 0, request: 0 };
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: { LocalNotifications: {
    checkPermissions: async () => ({ display: calls.granted ? 'granted' : 'prompt' }),
    requestPermissions: async () => { calls.request++; calls.granted = grant; return { display: grant ? 'granted' : 'denied' }; },
    schedule: async ({ notifications }) => { calls.schedule.push(notifications); return { notifications }; },
    cancel: async () => { calls.cancel++; },
  } } };
  return calls;
}

const SCEN = [];
const scen = (name, fn) => SCEN.push({ name, fn });
scen('L13: liveops.json đọc lúc khởi động (nguồn file, 0 cảnh báo), thưởng Thư hôm nay lấy từ file', async () => {
  const c = G().config();
  return { pass: c.source === 'file' && c.warnings.length === 0 && G().CONF.daily.today === 40 && events('config_load').length >= 1, detail: `nguồn ${c.source}, cảnh báo ${c.warnings.length}, daily.today ${G().CONF.daily.today}` };
});
scen('L11 web: sau 3 lần giao Thư hôm nay vẫn không hỏi thông báo, Cài đặt không có dòng thông báo', async () => {
  useSave(fixture(16, { daily: { won: { [FIRST]: 1, [FIRST + 1]: 1, [FIRST + 2]: 1 }, stamps: [FIRST, FIRST + 1, FIRST + 2], hist: {}, pages: 0, keepsakes: 0 } }));
  setDay(4);
  const due = G().notif.askDue();
  G().returnHome(); await sleep(900);
  const title = G().panelTitle;
  await closeAll(800);
  G().settingsPanel(); await sleep(400);
  const rows = [...document.querySelectorAll('.panel .set-lbl')].map(e => e.textContent);
  await closeAll(600);
  return { pass: !due && !/remind|nhắc mỗi/i.test(title) && !rows.some(r => /Daily reminder|Nhắc mỗi ngày/.test(r)) && rows.some(r => /Rest|nghỉ/.test(r)),
    detail: `hỏi: ${due}; popup "${title || 'không'}"; dòng cài đặt [${rows.join(' | ')}]` };
});
scen('L11 native (plugin giả): mặc định tắt; Daily thứ 2 chưa hỏi; sau Daily thứ 3 hỏi 1 lần; "Bật nhắc" xin quyền và xếp <= 7 thông báo, mỗi ngày tối đa 1', async () => {
  const calls = fakePlugin(true);
  useSave(fixture(16, { daily: { won: { [FIRST]: 1, [FIRST + 1]: 1 }, stamps: [FIRST, FIRST + 1], hist: {}, pages: 0, keepsakes: 0 } }));
  setDay(3);
  const off = G().settings.get('notif') === 0;
  const due2 = G().notif.askDue();
  G().save.daily.won[FIRST + 2] = 1; G().save.daily.stamps.push(FIRST + 2); G().persist();
  const due3 = G().notif.askDue();
  G().returnHome(); await sleep(900);
  const title = G().panelTitle, body = (document.querySelector('.panel .pin') || {}).textContent || '';
  clickText(/Yes, remind|Bật nhắc/); await sleep(800);
  const sched = calls.schedule[calls.schedule.length - 1] || [];
  const days = sched.map(n => new Date(n.schedule.at).toDateString());
  const again = G().notif.askDue();
  G().returnHome(); await sleep(900);
  const t2 = G().panelTitle;
  await closeAll(600);
  G().settingsPanel(); await sleep(400);
  const rows = [...document.querySelectorAll('.panel .set-lbl')].map(e => e.textContent);
  await closeAll(600);
  const words = sched.map(n => n.title + ' ' + n.body).join(' | ');
  const pass = off && !due2 && due3 && /daily note|Nhắc nhẹ/.test(title) && calls.request === 1 && G().settings.get('notif') === 1 && sched.length > 0 && sched.length <= 7
    && new Set(days).size === days.length && !again && !/daily note|Nhắc nhẹ/.test(t2) && rows.some(r => /Reminder time|Giờ nhắc/.test(r)) && !/expire|hết hạn|sắp mất|streak/i.test(words + body);
  delete window.Capacitor;
  return { pass, detail: `tắt mặc định ${off}; hỏi sau 2/3: ${due2}/${due3}; "${title}"; xin quyền ${calls.request}; xếp ${sched.length} (${new Set(days).size} ngày); hỏi lại ${again}; nội dung: ${words.slice(0, 140)}` };
});
scen('L11 nhắc nghỉ: tới 45 phút thì hiện tấm giấy nhỏ (không phải bảng, bấm vẫn chơi được); đang mở bảng thì đợi; tắt trong Cài đặt thì không hiện', async () => {
  useSave(fixture(16)); setDay(3);
  G().goHome(); await sleep(300);
  G().settingsPanel(); await sleep(300);
  G().rest.add(45 * 60e3);
  await sleep(5600);
  const whilePanel = document.getElementById('restNote').classList.contains('on');
  await closeAll(600);
  await sleep(5600);
  const shown = document.getElementById('restNote').classList.contains('on');
  const blocking = !!document.querySelector('.panel.on');
  const txt = document.getElementById('restNote').textContent;
  document.getElementById('restNote').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await sleep(500);
  const hidden = !document.getElementById('restNote').classList.contains('on');
  G().settings.set('rest', 0);
  G().rest.add(50 * 60e3); await sleep(5600);
  const offShown = document.getElementById('restNote').classList.contains('on');
  G().settings.set('rest', 1);
  return { pass: !whilePanel && shown && !blocking && /45/.test(txt) && hidden && !offShown && events('rest_reminder').length === 1,
    detail: `lúc có bảng: ${whilePanel}; sau đó: ${shown} "${txt}"; có bảng chặn: ${blocking}; chạm ẩn: ${hidden}; tắt cài đặt mà vẫn hiện: ${offShown}` };
});
scen('R11 banner level khó: không còn tiếng boom và rung bàn, có câu "cứ thong thả"; level thường hết nước vẫn hiện bảng hết nước', async () => {
  useSave(fixture(16)); setDay(3);
  const frames = []; let on = true;
  const watch = () => { if (!on) return; frames.push(document.getElementById('board').style.transform || ''); requestAnimationFrame(watch); };
  G().startLevel(14); requestAnimationFrame(watch);         // L15 là level khó
  await sleep(1200);
  const banner = [...document.querySelectorAll('#overlay div')].map(e => e.textContent).find(x => /thong thả|Take your time/.test(x)) || '';
  await sleep(1500); on = false;
  await settle(9000); await closeAll(1200);
  const shook = frames.filter(f => f && f !== 'none').length;
  G().startLevel(15); await sleep(400); await settle(9000); await closeAll(1200);
  G().S.moves = 0; G().outOfMoves(); await sleep(500);
  const oom = G().panelTitle;
  G().goHome(); await sleep(300);
  return { pass: !!banner && shook === 0 && /Out of Moves|Hết nước/i.test(oom), detail: `banner "${banner.slice(0, 80)}"; khung rung ${shook}/${frames.length}; L16 hết nước: "${oom}"` };
});

export async function runAll() {
  const out = [];
  for (const s of SCEN) { let r; try { r = await s.fn(); } catch (e) { r = { pass: false, detail: 'EXC ' + (e && e.stack || e) }; } out.push(`${r.pass ? 'PASS' : 'FAIL'}  ${s.name}  [${r.detail}]`); }
  G().live.reset(); G().goHome();
  return out;
}
/** Trang mở với ?debug&liveops=tests/fixtures/liveops_kill_season.json */
export async function runKill() {
  useSave(fixture(24)); setDay(10);                  // cửa sổ Tem theo mùa, đủ L20
  G().goHome(); await sleep(300);
  const tile = document.getElementById('eventTile');
  const tileOff = tile.classList.contains('off');
  const st = G().ev.state();
  G().startLevel(24); await sleep(500); await settle(9000); await closeAll(1000);
  const card = G().ev.seasonCard;
  G().goHome(); await sleep(300);
  setDay(31);                                        // chu kỳ 2, cd 3 (lùi về D3 bị chặn bởi chống lùi giờ)
  const routeOn = G().ev.state() && G().ev.state().id === 'route';
  const c = G().config();
  const pass = c.source === 'file' && tileOff && st === null && card == null && routeOn && G().CONF.daily.today === 55 && G().touchPoints().length <= 5;
  G().live.reset();
  return [`${pass ? 'PASS' : 'FAIL'}  L13 kill_switch.season = true: ô Event trống trong cửa sổ Tem theo mùa, không có lá tem mùa; Tuyến đưa thư vẫn chạy; daily.today ghi đè 55  [nguồn ${c.source}, ô ẩn ${tileOff}, phiên ${JSON.stringify(st)}, lá ${card}, D31 tuyến ${routeOn}, today ${G().CONF.daily.today}]`];
}
/** Trang mở với ?debug&liveops=tests/fixtures/liveops_broken.json */
export async function runBroken() {
  const c = G().config();
  useSave(fixture(16)); setDay(3);
  G().goHome(); await sleep(300);
  await (async () => { G().startLevel(5); await sleep(400); await settle(9000); await closeAll(1000); })();
  const playing = !!(G().S && G().S.cols.length);
  G().goHome(); await sleep(300);
  const pass = c.source === 'default' && /hỏng/.test(c.warnings[0] || '') && G().CONF.daily.today === 40 && playing && G().ev.state() && G().ev.state().id === 'route';
  G().live.reset();
  return [`${pass ? 'PASS' : 'FAIL'}  L13 liveops.json hỏng: chạy bằng mặc định, game vẫn chơi được, event vẫn theo lịch  [nguồn ${c.source}, "${c.warnings[0]}", today ${G().CONF.daily.today}, vào L6 ${playing}]`];
}
