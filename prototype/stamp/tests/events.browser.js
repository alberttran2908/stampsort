// Test trình duyệt L6–L10: Cuối tuần xu đôi, Túi thư của Pip, Tuyến đưa thư, Tem theo mùa, Tuần việc vặt, Thử lại nhẹ tay,
// và ô Event trên màn chính qua cả chu kỳ 28 ngày (đồng hồ giả). Trang http://localhost:8766/index.html?debug, profile riêng:
//   const m = await import('/tests/events.browser.js');
//   m.setup();          // save mẫu, reload
//   await m.runAll();   // mảng "PASS|FAIL  tên  [chi tiết]"
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;
const SAVE_KEY = () => 'stampsort_proto_v1' + (G().variant === 'b' ? '_b' : '');
const EVENTS_KEY = 'stampsort_events_v1';
const events = name => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]').filter(e => e.name === name);
const FIRST = Math.floor(Date.UTC(2026, 8, 21) / 864e5);        // ngày đầu T2 21/9/2026 -> pd 27 là T7 17/10
const pdMs = pd => { const d = new Date((FIRST + pd - 1) * 864e5); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 10).getTime(); };
async function settle(maxMs = 6000) {
  const t0 = performance.now();
  await sleep(60);
  while (performance.now() - t0 < maxMs) { if (!G().busy) { await sleep(320); if (!G().busy) return true; } await sleep(50); }
  return false;
}
const visibleBtns = () => [...document.querySelectorAll('.panel .btn')].filter(b => b.offsetParent && !b.classList.contains('wait'));
const btnTexts = () => visibleBtns().map(b => b.textContent.trim());
function clickBtn(i) { const b = visibleBtns()[i]; if (!b) return false; b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return true; }
function clickText(re) { const i = btnTexts().findIndex(x => re.test(x)); return i >= 0 && clickBtn(i); }
async function closeIntro(ms = 2000) { for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length && !G().win) clickBtn(0); await sleep(300); } }
async function enter(idx) { G().startLevel(idx); await sleep(400); await settle(9000); await closeIntro(1500); await settle(); }
async function winCur(maxS = 150) {
  G().autoplay(260);
  for (let i = 0; i < maxS * 4; i++) {
    await sleep(250);
    const w = G().win;
    if (w && w.ended) { for (let k = 0; k < 30 && G().win.paid !== G().win.reward; k++) await sleep(100); break; }
  }
  const pin = document.querySelector('.panel.win .pin');
  const r = { won: !!(G().win && G().win.ended), reward: G().win && G().win.reward, body: pin ? pin.textContent.replace(/\s+/g, ' ') : '' };
  G().goHome(); await sleep(400);
  return r;
}
async function winLevel(idx) { await enter(idx); return winCur(); }
async function loseLevel(idx) { await enter(idx); G().outOfMoves(); await sleep(300); G().goHome(); await sleep(400); }
function setDay(pd) { G().live.setNow(pdMs(pd)); G().save.morning = { last: FIRST + pd - 1, n: 1 }; G().persist(); G().live.touch(); G().refreshHome(); }   // Thư buổi sáng đã nhận: không lẫn popup
const fixture = won => ({ unlocked: won + 1, coins: 1000, stars: Object.fromEntries(Array.from({ length: won }, (_, i) => [i + 1, 3])), hint: 2, pack: 2, stamper: 2, joker: 2, slot: 0,
  seen: { rules: 1, unlock_hint: 1, unlock_pack: 1, unlock_stamper: 1, unlock_joker: 1, tap: 1, pts_explain: 1, feat_daily: 1, feat_route: 1, feat_mailbag: 1, feat_season: 1, feat_errands: 1 },
  attempts: {}, live: { firstOpenDay: FIRST, maxSeenDay: FIRST, lastOpenDay: FIRST }, morning: { last: FIRST + 200, n: 1 }, chv: 2 });
function reset(won) {
  const s = G().save;
  for (const k of Object.keys(s)) delete s[k];
  Object.assign(s, fixture(won));
  for (let i = 1; i <= 80; i++) s.seen['intro_' + i] = 1;
  G().persist();
}
export function setup() {
  localStorage.clear();
  localStorage.setItem(SAVE_KEY(), JSON.stringify(fixture(16)));
  location.reload();
}

const SCEN = [];
const scen = (name, fn) => SCEN.push({ name, fn });

scen('Ô Event qua chu kỳ 28 ngày (L40): D1 ẩn, D2–7 Tuyến đưa thư, D8–21 Tem theo mùa, D22–28 Tuần việc vặt, D29 Tuyến đưa thư; luôn tối đa 1 ô, sáng và bấm được', async () => {
  reset(40);
  const rows = []; let pass = true;
  for (let pd = 1; pd <= 29; pd++) {
    setDay(pd); G().goHome(); await sleep(120);
    const el = document.getElementById('eventTile');
    const id = el.classList.contains('off') ? null : el.dataset.event;
    const cd = ((pd - 1) % 28) + 1, k = Math.floor((pd - 1) / 28);
    const want = cd === 1 ? (k ? 'route' : null) : cd <= 7 ? 'route' : cd <= 21 ? 'season' : 'errands';
    const lit = !id || (el.classList.contains('on') && G().touchPoints().includes('event'));
    const n = G().touchPoints().length;
    if (id !== want || !lit || n > 5) { pass = false; rows.push(`D${pd}: ${id} (cần ${want}) sáng ${lit} điểm chạm ${n}`); }
  }
  return { pass, detail: rows.join(' | ') || '29 ngày đúng, tối đa 5 điểm chạm' };
});
scen('E1 Tuyến đưa thư: thắng đi 1 trạm (chiến dịch và Thư hôm nay), thua không lùi; bỏ ngày không mất; mốc nhận 1 lần; hết event thì quà chưa nhận vào phong bì', async () => {
  reset(16); setDay(3);
  await winLevel(16);
  const p1 = G().ev.state().s.p;
  await loseLevel(16);
  const p2 = G().ev.state().s.p;
  setDay(5);                                         // bỏ D4
  const p3 = G().ev.state().s.p;
  const st = G().save.ev.route; st.p = 9; G().persist();
  const w = await winLevel(16);                      // trạm 10: mốc Gợi ý
  const p4 = G().ev.state().s.p;
  G().ev.panel('route'); await sleep(400);
  const claimBtns = [...document.querySelectorAll('.panel .ev-claim')];
  const c0 = G().save.coins, h0 = G().save.hint;
  const m5 = claimBtns.find(b => b.dataset.mid === 'm5');
  if (m5) m5.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await sleep(400);
  const again = [...document.querySelectorAll('.panel .ev-claim')].map(b => b.dataset.mid);
  clickText(/Close|Đóng/); await sleep(300);
  const coinsGot = G().save.coins - c0;
  setDay(8);                                         // hết E1: m10 (Gợi ý) chưa nhận -> phong bì
  G().returnHome(); await sleep(900);
  const title = G().panelTitle, chips = [...document.querySelectorAll('.panel .gift-chip')].map(e => e.textContent.trim());
  clickText(/Claim|Nhận/); await sleep(400);
  const pass = p1 === 1 && p2 === 1 && p3 === 1 && p4 === 10 && /Mail Route|Tuyến đưa thư/.test(w.body) && coinsGot === 50 && !again.includes('m5')
    && again.includes('m10') && /gift|quà/i.test(title) && G().save.hint === h0 + 1 && events('route_step').length >= 2;
  return { pass, detail: `thắng: ${p1}; thua: ${p2}; bỏ D4: ${p3}; trạm ${p4}; màn thắng "${w.body.slice(0, 80)}"; nhận m5 +${coinsGot} xu, còn nút [${again}]; hết event: "${title}" [${chips}], Gợi ý ${h0}->${G().save.hint}` };
});
scen('E2 Tem theo mùa: Thư hôm nay luôn có lá tem mùa; gửi lá đó thì +1 tem; thua sau đó vẫn giữ; chơi lại không có tem', async () => {
  reset(24); setDay(10);
  G().dailyPanel('test'); await sleep(400); clickText(/Open|Mở thư/); await sleep(500); await settle(9000); await closeIntro(1200);
  const card = G().ev.seasonCard, mark = !!document.querySelector('.card.seasonal .season-mark');
  const w = await winCur();
  const n1 = G().ev.state().s.n;
  // chiến dịch: tìm level có tem mùa, chơi tới khi gửi được lá đó rồi cho thua
  let idx = 24, got = null;
  for (; idx < 40; idx++) { await enter(idx); if (G().ev.seasonCard != null) { got = idx; break; } G().goHome(); await sleep(200); }
  let n2 = n1, n3 = n1;
  if (got != null) {
    G().autoplay(260);
    for (let i = 0; i < 600 && G().ev.state().s.n === n1 && !(G().win && G().win.ended); i++) await sleep(100);
    n2 = G().ev.state().s.n;
    if (!(G().win)) { G().outOfMoves(); await sleep(300); }
    G().goHome(); await sleep(400);
    n3 = G().ev.state().s.n;
  }
  await enter(got != null ? got : 24);
  const replay = G().ev.seasonCard;
  G().goHome(); await sleep(300);
  const pass = card != null && mark && w.won && n1 === 1 && got != null && n2 === 2 && n3 === 2 && replay == null && events('season_stamp_get').length >= 2;
  return { pass, detail: `Daily: lá ${card}, có dấu ${mark}, thắng ${w.won}, tem ${n1}; chiến dịch L${got != null ? got + 1 : '-'}: tem ${n2}, sau khi thua ${n3}; chơi lại: lá tem mùa ${replay}` };
});
scen('E4 Tuần việc vặt: thắng/đặt decor/gửi thư tăng đúng việc; nhận việc 1 lần; không việc nào cần tiêu xu/booster', async () => {
  reset(34); setDay(23);
  const st0 = G().ev.state();
  const picked = G().ev.EV.pickErrands(st0.k).map(e => e.id);
  await winLevel(34);
  const s1 = G().ev.state().s.c;
  const s = G().save.ev.errands; const first = picked[0]; const e = G().ev.EV.ERRAND_POOL.find(x => x.id === first);
  s.c[first] = e.need; G().persist();
  G().ev.panel('errands'); await sleep(400);
  const btn = [...document.querySelectorAll('.panel .ev-claim')].find(b => b.dataset.mid === first);
  const c0 = G().save.coins;
  if (btn) btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await sleep(400);
  const still = [...document.querySelectorAll('.panel .ev-claim')].some(b => b.dataset.mid === first);
  clickText(/Close|Đóng/); await sleep(300);
  const winOk = !picked.includes('win8') || s1.win8 === 1;
  const delOk = !picked.includes('deliver15') || s1.deliver15 >= 3;
  const pass = picked.length === 5 && winOk && delOk && G().save.coins - c0 === e.coins && !still;
  return { pass, detail: `việc [${picked}]; sau 1 lần thắng ${JSON.stringify(s1)}; nhận "${first}" +${G().save.coins - c0} xu, nút còn: ${still}` };
});
scen('E3 Cuối tuần + F5 Túi thư: T7 thắng chiến dịch x2 xu (Daily không x2), dải băng chỉ T7/CN; túi thư 12 lần thắng ra booster, thua không trừ', async () => {
  reset(16); setDay(27);                             // T7
  const ribbonSat = !document.getElementById('wkendRibbon').classList.contains('off');
  G().save.mailbag = { n: 11, i: 0 }; G().persist();
  const h0 = G().save.hint;
  const w = await winLevel(16);
  const bagAfter = { ...G().save.mailbag };
  await loseLevel(16);
  const bagLose = { ...G().save.mailbag };
  G().dailyPanel('test'); await sleep(400); clickText(/Open|Mở thư/); await sleep(500); await settle(9000); await closeIntro(1200);
  const dw = await winCur();
  setDay(29);                                        // T2
  G().goHome(); await sleep(200);
  const ribbonMon = !document.getElementById('wkendRibbon').classList.contains('off');
  const bar = document.getElementById('bagBar').textContent.trim();
  const pass = ribbonSat && !ribbonMon && w.won && w.reward % 2 === 0 && w.reward >= 40 && /×2/.test(w.body) && dw.reward === 40
    && bagAfter.n === 0 && G().save.hint === h0 + 1 && bagLose.n === 0 && /1\/12/.test(bar) && events('weekend_bonus').length >= 1 && events('mailbag_open').length >= 1;
  return { pass, detail: `dải băng T7 ${ribbonSat}, T2 ${ribbonMon}; thắng T7 thưởng ${w.reward} "${w.body.slice(0, 60)}"; Daily ${dw.reward}; túi ${JSON.stringify(bagAfter)} (Gợi ý ${h0}->${G().save.hint}), sau thua ${JSON.stringify(bagLose)}; thanh "${bar}"` };
});
scen('F11 Thử lại nhẹ tay: thua 1 lần không có; thua 2 lần liền thì lần sau +3 nước và 1 lá lật sẵn; thắng thì hết; không áp Daily', async () => {
  reset(16); setDay(30);
  const base = await (async () => { await enter(12); const m = G().S.moves, w = G().S.waste.length; G().goHome(); await sleep(200); return { m, w }; })();
  await loseLevel(12);
  await enter(12); const one = { m: G().S.moves, w: G().S.waste.length }; G().goHome(); await sleep(200);
  await loseLevel(12);
  G().startLevel(12); let tst = '';
  for (let i = 0; i < 60 && !/Pip/.test(tst); i++) { await sleep(100); tst = G().toastText; }
  await settle(9000); await closeIntro(1200);
  const two = { m: G().S.moves, w: G().S.waste.length, toast: tst }; G().goHome(); await sleep(200);
  const pass = one.m === base.m && one.w === base.w && two.m === base.m + 3 && two.w === base.w + 1 && /Pip/.test(two.toast) && events('gentle_retry').length === 1;
  return { pass, detail: `gốc ${JSON.stringify(base)}; thua 1: ${JSON.stringify(one)}; thua 2: ${JSON.stringify(two)}` };
});
scen('Copy EN/VI: không đếm ngược, không "mất chuỗi", "streak lost", "hết hạn", "sắp mất"', async () => {
  const src = await (await fetch('src/copy.js')).text();
  const bad = src.match(/mất chuỗi|streak lost|hết hạn|expire|sắp mất|countdown|còn \d+ giờ/gi);
  return { pass: !bad, detail: bad ? bad.join(', ') : '0 kết quả' };
});

export async function runAll(only = null) {
  const out = [];
  for (const s of SCEN) {
    if (only && !only.some(o => s.name.startsWith(o))) continue;
    let r;
    try { r = await s.fn(); } catch (e) { r = { pass: false, detail: 'EXC ' + (e && e.stack || e) }; }
    out.push(`${r.pass ? 'PASS' : 'FAIL'}  ${s.name}  [${r.detail}]`);
  }
  G().live.reset(); G().goHome();
  return out;
}
