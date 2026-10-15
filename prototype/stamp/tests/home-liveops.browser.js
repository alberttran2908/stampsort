// Test trình duyệt cho L3 (Thẻ tuần 5/7, Thư buổi sáng), L4 (Chào mừng quay lại, hàng đợi popup), L5 (màn chính 5 điểm chạm).
// Chạy TRONG TRÌNH DUYỆT, trang http://localhost:8766/index.html?debug&now=2026-10-12T10:00 (Thứ Hai), profile riêng (save bị thay):
//   const m = await import('/tests/home-liveops.browser.js');
//   m.setup();                 // save: đã thắng L5, ngày đầu 12/10; reload
//   // sau reload:
//   await m.runAll();          // mảng "PASS|FAIL  tên  [chi tiết]"
//   m.setupBoot();             // dựng trạng thái "mọi popup cùng đến hạn" + ván dở; reload
//   // sau reload:
//   await m.checkBoot();       // popup không chồng: lúc mở app đúng 1 popup, mỗi lần về màn chính tối đa 1
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;
const SAVE_KEY = () => 'stampsort_proto_v1' + (G().variant === 'b' ? '_b' : '');
const EVENTS_KEY = 'stampsort_events_v1';
const events = name => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]').filter(e => e.name === name);
const DAY0 = '2026-10-12T10:00';                    // Thứ Hai
const dayMs = n => new Date(DAY0).getTime() + n * 864e5;
const dayNum = n => Math.floor(Date.UTC(2026, 9, 12 + n) / 864e5);   // số ngày lịch (khoá D.won)
async function settle(maxMs = 6000) {
  const t0 = performance.now();
  await sleep(60);
  while (performance.now() - t0 < maxMs) { if (!G().busy) { await sleep(320); if (!G().busy) return true; } await sleep(50); }
  return false;
}
const panels = () => [...document.querySelectorAll('.panel')].filter(p => p.isConnected && p.classList.contains('on'));
const visibleBtns = () => [...document.querySelectorAll('.panel .btn')].filter(b => b.offsetParent && !b.classList.contains('wait'));
const btnTexts = () => visibleBtns().map(b => b.textContent.trim());
function clickBtn(i) { const b = visibleBtns()[i]; if (!b) return false; b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return true; }
function clickText(re) { const i = btnTexts().findIndex(x => re.test(x)); return i >= 0 && clickBtn(i); }
async function waitPanel(ms = 4000) { for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length) return true; await sleep(100); } return false; }
async function closeIntro(ms = 2500) { for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length && !G().win) clickBtn(0); await sleep(300); } }
async function winNow(maxS = 150) {
  G().autoplay(260);
  for (let i = 0; i < maxS * 4; i++) {
    await sleep(250);
    const w = G().win;
    if (w && w.ended) { for (let k = 0; k < 30 && G().win.paid !== G().win.reward; k++) await sleep(100); return true; }
  }
  return false;
}
const D = () => G().save.daily || { won: {}, stamps: [], hist: {} };
/** Mở Thư hôm nay từ nút màn chính và thắng. Trả { reward, title, body }. */
async function winDaily() {
  G().goHome(); await sleep(300);
  document.getElementById('dailyBtn').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await waitPanel(2000);
  clickText(/Open|Mở thư|Continue|tiếp/);
  await sleep(400); await settle(12000); await closeIntro(1500); await settle();
  const ok = await winNow();
  const w = G().win, pin = document.querySelector('.panel.win .pin');
  const r = { ok, reward: w && w.reward, title: G().panelTitle, body: pin ? pin.textContent.replace(/\s+/g, ' ') : '' };
  clickBtn(0); await sleep(700);
  return r;
}
/** Về màn chính như từ một level, chờ popup (nếu có). Trả tiêu đề popup hoặc ''. */
async function backHome(ms = 900) { G().returnHome(); await sleep(ms); return G().panelTitle; }
const fixture = (won, extra = {}) => ({ unlocked: won + 1, coins: 1000, stars: Object.fromEntries(Array.from({ length: won }, (_, i) => [i + 1, 3])),
  hint: 3, pack: 2, stamper: 2, joker: 2, slot: 0, seen: { rules: 1, unlock_hint: 1, unlock_pack: 1, unlock_stamper: 1, unlock_joker: 1, tap: 1, pts_explain: 1, feat_daily: 1 }, attempts: {}, ...extra });
function setSave(s) { localStorage.setItem(SAVE_KEY(), JSON.stringify(s)); }

export function setup() {
  localStorage.clear();
  setSave(fixture(5, { live: { firstOpenDay: dayNum(0), maxSeenDay: dayNum(0), lastOpenDay: dayNum(0) } }));
  location.reload();
}

const SCEN = [];
const scen = (name, fn) => SCEN.push({ name, fn });

/** Khoảng trống dọc lớn nhất (tỉ lệ chiều cao màn) giữa các khối của màn chính. */
function maxGap() {
  const sel = ['#homeCoins', '#gearBtn', '.home .logo', '#grid', '#playBtn', '#albumBtn', '#decorBtn', '#dailyBtn', '#eventTile', '#homePip', '#decor img:not(.ghost)'];
  const iv = [];
  for (const q of sel) for (const el of document.querySelectorAll(q)) { if (!el.offsetParent && el.tagName !== 'IMG') continue; const r = el.getBoundingClientRect(); if (r.height > 0) iv.push([r.top, r.bottom]); }
  iv.sort((a, b) => a[0] - b[0]);
  let gap = Math.max(0, iv[0][0]), end = iv[0][1];
  for (const [a, b] of iv.slice(1)) { if (a > end) gap = Math.max(gap, a - end); end = Math.max(end, b); }
  gap = Math.max(gap, innerHeight - end);
  return gap / innerHeight;
}
export function gapDebug() {
  const sel = ['#homeCoins', '#gearBtn', '.home .logo', '#grid', '#playBtn', '#albumBtn', '#decorBtn', '#dailyBtn', '#eventTile', '#homePip'];
  return sel.map(q => { const el = document.querySelector(q); if (!el || !el.offsetParent) return q + ' -'; const r = el.getBoundingClientRect(); return `${q} ${Math.round(r.top)}-${Math.round(r.bottom)}`; }).join(' | ') + ' H ' + innerHeight;
}
scen('L5: điểm chạm chính theo level (L1–L4: 3, từ L5: 4, ô Event mờ không tính, event đang chạy và đủ level: 5), luôn <= 5; không vùng trống > 20%', async () => {
  const rows = [];
  let pass = true;
  for (const [won, pd] of [[0, 1], [4, 1], [5, 1], [11, 2], [13, 2], [32, 8], [66, 22], [78, 27]]) {
    const s = G().save;
    s.unlocked = won + 1; s.stars = Object.fromEntries(Array.from({ length: won }, (_, i) => [i + 1, 3]));
    s.live.firstOpenDay = dayNum(0) - (pd - 1); s.live.maxSeenDay = dayNum(0); s.live.lastOpenDay = dayNum(0);
    s.morning = { last: dayNum(0), n: 1 };
    G().persist(); G().live.setNow(dayMs(0));
    G().goHome(); await sleep(350);
    const tp = G().touchPoints();
    const ev = document.getElementById('eventTile');
    const evState = ev.classList.contains('off') ? 'ẩn' : ev.classList.contains('on') ? 'sáng' : 'mờ: ' + ev.textContent.replace(/\s+/g, ' ').trim();
    const ls = G().live.state();
    const lit = won >= 5 && !!ls.big;               // L6–L9: event đang chạy và đủ level thì ô Event sáng (điểm chạm thứ 5)
    const want = won >= 5 ? ['play', 'album', 'decor', 'daily', ...(lit ? ['event'] : [])] : ['play', 'album', 'decor'];
    const gap = maxGap();
    const ok = tp.length <= 5 && want.every(x => tp.includes(x)) && tp.length === want.length && gap <= 0.2
      && (won < 5 || pd === 1 ? evState === 'ẩn' : lit ? evState === 'sáng' : evState.startsWith('mờ'));
    if (!ok) pass = false;
    rows.push(`L${won + 1}/pd${pd}: ${tp.length} [${tp.join(',')}] event ${evState}, trống ${Math.round(gap * 100)}%${ok ? '' : ' ✗'}`);
  }
  return { pass, detail: rows.join(' | ') };
});
scen('L5: level khoá có ổ khoá và mờ, level hiện tại có ghim; nút Cài đặt là icon, có ô xu', async () => {
  const s = G().save; s.unlocked = 6; s.stars = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 }; G().persist();
  G().goHome(); await sleep(300);
  const locked = [...document.querySelectorAll('#grid .lvl.locked')];
  const lockOk = locked.length === 4 && locked.every(el => getComputedStyle(el, '::before').backgroundImage.includes('lock.png') && +getComputedStyle(el).opacity <= 0.65);
  const cur = document.querySelector('#grid .lvl.cur');
  const pin = cur && getComputedStyle(cur, '::before').backgroundImage.includes('level_pin');
  const gear = document.getElementById('gearBtn'), coins = document.getElementById('homeCoins');
  const gearOk = getComputedStyle(gear).backgroundImage.includes('ic_settings') && !gear.textContent.trim() && gear.getBoundingClientRect().width >= 44;
  const coinOk = coins.offsetParent && +coins.querySelector('span').textContent === G().save.coins;
  return { pass: lockOk && pin && gearOk && coinOk, detail: `khoá ${locked.length} ô, ổ khoá+mờ ${lockOk}; ghim L${cur && parseInt(cur.textContent, 10)} ${pin}; bánh răng ${gearOk} (${Math.round(gear.getBoundingClientRect().width)} px); ô xu ${coinOk}` };
});
scen('L3: Thẻ tuần 5/7: T2, T3, T5, T6 chưa mở hộp; thắng Daily CN (dấu thứ 5) thì hộp mở ngay; bỏ T4, T7 không mất gì', async () => {
  const s = G().save;
  s.unlocked = 7; s.stars = Object.fromEntries(Array.from({ length: 6 }, (_, i) => [i + 1, 3]));
  s.live = { firstOpenDay: dayNum(0), maxSeenDay: dayNum(0), lastOpenDay: dayNum(0) };
  s.daily = { won: { [dayNum(0)]: 1, [dayNum(1)]: 1, [dayNum(3)]: 1 }, hist: {}, stamps: [dayNum(0), dayNum(1), dayNum(3)], pages: 0, keepsakes: 0 };
  s.weekly = {}; s.morning = { last: dayNum(6), n: 3 };
  G().persist();
  G().live.setNow(dayMs(4));                       // Thứ Sáu: dấu thứ 4
  G().refreshHome();
  const h0 = G().save.hint, p0 = G().save.pack;
  const fri = await winDaily();
  const wFri = G().weekly();
  const badgeFri = document.querySelector('#dailyBtn .wk').textContent;
  G().live.setNow(dayMs(6));                       // Chủ nhật: dấu thứ 5
  G().refreshHome();
  const nBox = events('weekly_box_open').length;
  const sun = await winDaily();
  const wSun = G().weekly();
  const badgeSun = document.querySelector('#dailyBtn .wk');
  const boxEv = events('weekly_box_open').length - nBox;
  const pass = fri.ok && fri.reward === 40 && wFri.count === 4 && !wFri.claimed && badgeFri === '4/5'
    && sun.ok && sun.reward === 140 && wSun.claimed && boxEv === 1 && G().save.hint === h0 + 1 && G().save.pack === p0 + 1
    && badgeSun.classList.contains('full') && /Weekly box|hộp tuần/i.test(sun.body);
  return { pass, detail: `T6: thưởng ${fri.reward}, thẻ ${wFri.count}/5, huy hiệu "${badgeFri}"; CN: thưởng ${sun.reward}, đã mở ${wSun.claimed}, weekly_box_open +${boxEv}, Gợi ý ${h0}->${G().save.hint}, Nam châm ${p0}->${G().save.pack}; màn thắng "${sun.body.slice(0, 120)}"` };
});
scen('L3: tuần mới thì thẻ trống; mở lại panel Daily thấy 7 ô trống, chữ "5 ngày là đủ"', async () => {
  G().live.setNow(dayMs(7));                       // Thứ Hai tuần sau
  G().refreshHome(); G().goHome(); await sleep(300);
  const w = G().weekly();
  const badge = document.querySelector('#dailyBtn .wk');
  G().dailyPanel('test'); await sleep(500);
  const cells = document.querySelectorAll('.panel .wk-cell').length, on = document.querySelectorAll('.panel .wk-cell.on').length;
  const note = (document.querySelector('.panel .wk-note') || {}).textContent || '';
  clickText(/Close|Đóng/); await sleep(300);
  return { pass: w.count === 0 && !w.claimed && !badge.classList.contains('on') && cells === 7 && on === 0 && /5/.test(note),
    detail: `thẻ ${w.count}/5 đã nhận ${w.claimed}; huy hiệu hiện ${badge.classList.contains('on')}; panel ${on}/${cells} ô, "${note}"` };
});
scen('L3: Thư buổi sáng: đúng 1 lần mỗi ngày (+20 xu), lần nhận thứ 7 và 14 thêm 1 Gợi ý (không cần liên tiếp)', async () => {
  const s = G().save;
  s.morning = { last: dayNum(7), n: 5 }; delete s.live.awayDue; G().persist();   // vắng từ kịch bản trước không lẫn vào đây
  const rows = [];
  let pass = true;
  for (const [d, wantHint] of [[8, 0], [10, 1], [13, 0]]) {        // lần 6 (T3), lần 7 (T5, bỏ T4), lần 8
    G().live.setNow(dayMs(d));
    const c0 = G().save.coins, h0 = G().save.hint;
    const title = await backHome();
    const chips = [...document.querySelectorAll('.panel .gift-chip')].map(e => e.textContent.trim());
    clickText(/Claim|Nhận/); await sleep(500);
    const again = await backHome();
    if (again) clickText(/Claim|Nhận/);
    const ok = /Morning|buổi sáng/.test(title) && G().save.coins - c0 === 20 && G().save.hint - h0 === wantHint && !again;
    if (!ok) pass = false;
    rows.push(`ngày ${d}: "${title}" [${chips.join(', ')}] xu +${G().save.coins - c0}, Gợi ý +${G().save.hint - h0}, lần 2 "${again || 'không'}" (n=${G().save.morning.n})`);
  }
  return { pass: pass && G().save.morning.n === 8 && events('morning_claim').length >= 3, detail: rows.join(' | ') };
});
scen('L4: vắng 2 ngày không có Chào mừng; vắng 3 ngày có (1 lần), +1 Gợi ý +1 Nam châm, level đầu +5 nước; quà event cũ gộp chung 1 phong bì', async () => {
  const s = G().save;
  const nWb = events('welcome_back').length;
  delete s.live.awayDue; s.welcomeMoves = 0; G().persist();
  G().live.setNow(dayMs(13)); G().live.touch();
  G().live.setNow(dayMs(16));                      // vắng 14, 15 = 2 ngày
  G().live.touch();
  const due2 = G().giftsDue();
  const t2 = await backHome();
  clickText(/Claim|Nhận/); await sleep(400);
  G().live.setNow(dayMs(20));                      // vắng 17, 18, 19 = 3 ngày
  G().live.touch();
  s.gifts = [{ src: 'route', coins: 50 }]; G().persist();
  const c0 = s.coins, h0 = s.hint, p0 = s.pack, j0 = s.joker;
  const t3 = await backHome();
  const nPanels = panels().length;
  const chips = [...document.querySelectorAll('.panel .gift-chip')].map(e => e.textContent.trim());
  clickText(/Claim|Nhận/); await sleep(500);
  const again = await backHome();
  const got = { coins: G().save.coins - c0, hint: G().save.hint - h0, pack: G().save.pack - p0, joker: G().save.joker - j0 };
  // level chiến dịch đầu tiên sau đó: +5 nước
  const idx = G().curLevel() - 1;
  G().startLevel(idx); await sleep(500); await settle(9000);
  const lvMoves = G().S.moves;
  const want = (await import('/src/levels.js').then(m => m.LEVELS[idx] && m.LEVELS[idx].moves).catch(() => null));
  G().goHome(); await sleep(300);
  const pass = !due2.welcome && !/Welcome|quay lại/.test(t2) && /Welcome|quay lại/.test(t3) && nPanels === 1 && !again
    && got.coins === 70 && got.hint === 1 && got.pack === 1 && got.joker === 0 && (want == null || lvMoves === want + 5)
    && events('welcome_back').length - nWb === 1 && (G().save.gifts || []).length === 0;
  return { pass, detail: `vắng 2: "${t2 || 'không popup'}"; vắng 3: "${t3}" (${nPanels} bảng) [${chips.join(', ')}]; nhận ${JSON.stringify(got)}; lần 2 "${again || 'không'}"; L${idx + 1} moves ${lvMoves} (gốc ${want})` };
});
scen('L4: vắng 7 ngày có thêm Tem Đa Năng; lùi giờ không tạo quà', async () => {
  G().live.setNow(dayMs(28));                      // vắng 21..27 = 7 ngày
  G().live.touch();
  const j0 = G().save.joker;
  const t7 = await backHome();
  clickText(/Claim|Nhận/); await sleep(400);
  const gotJ = G().save.joker - j0;
  G().live.setNow(dayMs(24));                      // lùi giờ 4 ngày
  G().live.touch();
  const back = await backHome();
  if (back) clickText(/Claim|Nhận/);
  return { pass: /Welcome|quay lại/.test(t7) && gotJ === 1 && !back, detail: `vắng 7: "${t7}", Tem Vàng +${gotJ}; lùi giờ: "${back || 'không popup'}"` };
});
scen('Copy EN/VI: không có "mất chuỗi", "streak lost", "hết hạn", "expire"', async () => {
  const src = await (await fetch('src/copy.js')).text();
  const bad = src.match(/mất chuỗi|streak lost|hết hạn|expire/gi);
  return { pass: !bad, detail: bad ? bad.join(', ') : '0 kết quả' };
});

export async function runAll() {
  const out = [];
  for (const s of SCEN) {
    let r;
    try { r = await s.fn(); } catch (e) { r = { pass: false, detail: 'EXC ' + (e && e.stack || e) }; }
    out.push(`${r.pass ? 'PASS' : 'FAIL'}  ${s.name}  [${r.detail}]`);
  }
  G().goHome();
  return out;
}

/** Mọi popup cùng đến hạn: ván dở chiến dịch, vắng 4 ngày, Thư buổi sáng, quà event cũ, "Tính năng mới" (Thư hôm nay). */
export function setupBoot() {
  localStorage.clear();
  const s = fixture(5, { live: { firstOpenDay: dayNum(0) - 10, maxSeenDay: dayNum(0) - 5, lastOpenDay: dayNum(0) - 5 }, morning: { last: dayNum(0) - 5, n: 2 }, gifts: [{ src: 'season', coins: 30 }] });
  delete s.seen.feat_daily;
  setSave(s);
  sessionStorage.setItem('hl_boot', '1');
  location.reload();
}
export async function checkBoot() {
  const out = [];
  // ván dở: tạo sau reload (cần engine), rồi reload lại một lần nữa
  if (sessionStorage.getItem('hl_boot') === '1') {
    G().startLevel(5); await sleep(500); await settle(9000); await closeIntro(1500);
    const g = G(), a = g.E.legalMoves(g.S).filter(x => x.src && x.dst)[0];
    if (a) g.doMove(a.src, a.dst, false); else g.onDeck();
    await settle(); G().saveRun();
    sessionStorage.setItem('hl_boot', '2');
    location.reload();
    return ['RELOAD  gọi lại checkBoot() sau khi trang tải xong'];
  }
  await sleep(1500);
  const n1 = panels().length, t1 = G().panelTitle, log1 = G().popupLog;
  await sleep(1500);
  const n1b = panels().length;
  out.push(`${n1 === 1 && n1b === 1 && /Unfinished|dở/i.test(t1) && log1.length === 1 ? 'PASS' : 'FAIL'}  Mở app: đúng 1 popup (ván dở), sau 3 giây vẫn 1  [${n1}/${n1b} bảng, "${t1}", log ${JSON.stringify(log1.map(x => x.pick))}]`);
  clickBtn(0); await sleep(600); await settle(9000); await closeIntro(1200);
  G().goHome(); await sleep(900);
  const n2 = panels().length, t2 = G().panelTitle;
  const chips = [...document.querySelectorAll('.panel .gift-chip')].map(e => e.textContent.trim());
  clickText(/Claim|Nhận/); await sleep(1500);
  const n2b = panels().length;
  out.push(`${n2 === 1 && /Welcome|quay lại/.test(t2) && n2b === 0 && chips.length >= 3 ? 'PASS' : 'FAIL'}  Về màn chính lần 1: 1 phong bì gộp (Chào mừng + quà event + Thư buổi sáng), nhận xong không bật popup khác  [${n2} bảng "${t2}" [${chips.join(', ')}], sau khi nhận ${n2b} bảng]`);
  const t3 = await backHome();
  clickBtn(0); await sleep(600);
  if (G().panelTitle) { document.querySelectorAll('.panel .btn').forEach(() => {}); clickText(/Close|Đóng/); await sleep(300); }
  const t4 = await backHome();
  out.push(`${/New|Mới/.test(t3) && !t4 ? 'PASS' : 'FAIL'}  Lần về sau: "Tính năng mới" (Thư hôm nay) 1 lần mỗi phiên, lần kế không còn popup  ["${t3}" -> "${t4 || 'không'}"]`);
  const log = G().popupLog;
  const perVisit = {};
  for (const x of log) perVisit[x.visit] = (perVisit[x.visit] || 0) + 1;
  out.push(`${Object.values(perVisit).every(n => n <= 1) ? 'PASS' : 'FAIL'}  Mỗi lần mở app / về màn chính tối đa 1 popup  [${JSON.stringify(log.map(x => x.trigger + ':' + x.pick))}]`);
  sessionStorage.removeItem('hl_boot');
  return out;
}
