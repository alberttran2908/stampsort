// Test trình duyệt cho L1 + L2: Thư hôm nay, Sổ dấu ngày, lịch local với đồng hồ giả (__game.live.setNow).
// Chạy TRONG TRÌNH DUYỆT, trang http://localhost:8766/index.html?debug&now=2026-10-12 (Thứ Hai), profile riêng vì save bị thay:
//   const m = await import('/tests/daily.browser.js');
//   await m.setup();     // save: đã thắng L4 (chưa mở Thư hôm nay), rồi reload
//   // sau reload:
//   const m = await import('/tests/daily.browser.js');
//   await m.runAll();    // mảng "PASS|FAIL  tên  [chi tiết]"
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;
const SAVE_KEY = () => 'stampsort_proto_v1' + (G().variant === 'b' ? '_b' : '');
const EVENTS_KEY = 'stampsort_events_v1';
const events = name => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]').filter(e => e.name === name);
const DAY0 = '2026-10-12T10:00';
const dayMs = n => new Date(DAY0).getTime() + n * 864e5;
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
async function waitPanel(ms = 4000) { for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length) return true; await sleep(100); } return false; }
async function closeIntro(ms = 2500) { for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length && !G().win) clickBtn(0); await sleep(300); } }
async function step() {
  const g = G(), acts = g.E.legalMoves(g.S).filter(a => a.src && a.dst);
  if (acts.length) g.doMove(acts[0].src, acts[0].dst, false); else g.onDeck();
  await settle();
}
async function winNow(maxS = 150) {
  G().autoplay(260);
  for (let i = 0; i < maxS * 4; i++) {
    await sleep(250);
    const w = G().win;
    if (w && w.ended) { for (let k = 0; k < 30 && G().win.paid !== G().win.reward; k++) await sleep(100); return true; }   // chờ xu bay xong
  }
  return false;
}
// xu thưởng combo (gửi thư liên tiếp) cũng cộng trong ván: so phần thưởng Daily qua win.paid, xu tổng cho phép dư <= 40
const coinOk = (delta, reward) => delta >= reward && delta - reward <= 40;
const D = () => G().save.daily || { won: {}, stamps: [], hist: {} };
const btn = () => document.getElementById('dailyBtn');
/** Mở panel Thư hôm nay từ nút trên màn chính, bấm nút theo regex, chờ vào ván. */
async function playDaily(re = /Open|Mở thư|Continue|tiếp/) {
  G().goHome(); await sleep(300);
  btn().dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await waitPanel(2000);
  const texts = btnTexts();
  const ok = clickText(re);
  await sleep(400); await settle(12000); await closeIntro(1500); await settle();
  return { texts, ok };
}
async function finishHome() { clickBtn(0); await sleep(600); }

export async function setup() {
  localStorage.clear();
  const stars = { 1: 3, 2: 3, 3: 2, 4: 3 };
  localStorage.setItem(SAVE_KEY(), JSON.stringify({ unlocked: 5, coins: 1000, stars, hint: 3, pack: 2, stamper: 0, joker: 0, slot: 0,
    seen: { rules: 1, unlock_hint: 1, unlock_pack: 1, tap: 1, pts_explain: 1 }, attempts: {} }));
  location.reload();
}

const SCEN = [];
const scen = (name, fn) => SCEN.push({ name, fn });

scen('Mới thắng L4: không có nút Thư hôm nay; thắng L5: nút hiện, chấm đỏ, popup "Mới!" 1 lần', async () => {
  G().live.setNow(dayMs(0));
  G().goHome(); await sleep(400);
  const hidden = btn().classList.contains('off');
  const s = G().save; s.unlocked = 6; s.stars[5] = 2; G().persist();
  G().goHome(); await sleep(500);
  const shown = !btn().classList.contains('off') && btn().classList.contains('new');
  const popup = G().panelTitle;
  clickBtn(0); await sleep(500);                   // "Xem" -> panel Thư hôm nay
  const panelT = G().panelTitle;
  clickText(/Close|Đóng/); await sleep(300);
  G().goHome(); await sleep(400);
  const again = G().panelTitle;
  return { pass: hidden && shown && /New|Mới/.test(popup) && /Today|Thư hôm nay/.test(panelT) && !again,
    detail: `L4: ẩn ${hidden}; L5: hiện+chấm ${shown}; popup "${popup}" -> "${panelT}"; lần sau popup: "${again || 'không'}"` };
});
scen('Giao Thư hôm nay: +40 xu, 1 dấu ngày, tiến độ chiến dịch không đổi, ván dở chiến dịch không bị đè', async () => {
  // ván dở chiến dịch ở L6 trước khi chơi Daily
  G().startLevel(5); await sleep(400); await settle(9000); await closeIntro(1500); await step(); await step();
  G().goHome(); await sleep(300);
  const camp0 = localStorage.getItem(SAVE_KEY() + '_resume');
  const coins0 = G().save.coins, unl0 = G().save.unlocked;
  const { texts } = await playDaily();
  const inDaily = G().daily && G().daily.key === '2026-10-12';
  const title = document.getElementById('title').textContent;
  const won = await winNow();
  const w = G().win, ttl = G().panelTitle;
  await finishHome();
  const d = D();
  const camp1 = localStorage.getItem(SAVE_KEY() + '_resume');
  const pass = inDaily && won && w.reward === 40 && w.paid === 40 && coinOk(G().save.coins - coins0, 40) && d.stamps.length === 1 && d.won[d.stamps[0]] === 1
    && G().save.unlocked === unl0 && camp0 && camp1 === camp0 && btn().classList.contains('done') && events('daily_complete').length === 1;
  return { pass, detail: `nút panel [${texts.join(' | ')}]; HUD "${title}"; thắng ${won} "${ttl}" thưởng ${w && w.reward}; xu +${G().save.coins - coins0}; dấu ${d.stamps.length}; unlocked ${unl0}->${G().save.unlocked}; ván dở L6 giữ nguyên: ${!!camp0 && camp1 === camp0}` };
});
scen('Chơi lại Thư hôm nay: không thưởng, không thêm dấu', async () => {
  const coins0 = G().save.coins;
  const { texts } = await playDaily(/again|Chơi lại/);
  const rep = G().daily && G().daily.replay;
  const won = await winNow();
  const w = G().win, ttl = G().panelTitle;
  await finishHome();
  return { pass: rep && won && w.reward === 0 && w.paid === 0 && coinOk(G().save.coins - coins0, 0) && D().stamps.length === 1,
    detail: `nút [${texts.join(' | ')}]; replay ${rep}; "${ttl}" thưởng ${w && w.reward}; xu ${coins0}->${G().save.coins}; dấu ${D().stamps.length}` };
});
scen('Sang ngày mới (đồng hồ giả +1 ngày): chấm đỏ lại, lá thư khác hôm qua, giao được thêm 1 dấu', async () => {
  const src0 = G().save.daily.hist[Object.keys(G().save.daily.hist)[0]];
  G().live.setNow(dayMs(1));
  G().refreshHome(); G().goHome(); await sleep(300);
  const fresh = btn().classList.contains('new');
  await playDaily();
  const src1 = G().daily && G().daily.src, key = G().daily && G().daily.key;
  const won = await winNow();
  await finishHome();
  return { pass: fresh && key === '2026-10-13' && src1 && src1 !== src0 && won && D().stamps.length === 2,
    detail: `chấm đỏ: ${fresh}; ${key}: ${src1} (hôm qua ${src0}); dấu ${D().stamps.length}` };
});
scen('Bỏ 3 ngày: tiến độ còn nguyên, chỉ chơi bù được hôm qua (+20 xu), thư không lặp', async () => {
  G().live.setNow(dayMs(5));                       // 17/10 (Thứ Bảy), bỏ 14, 15, 16
  G().refreshHome(); G().goHome(); await sleep(300);
  btn().dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await waitPanel(2000);
  const texts = btnTexts();
  const coins0 = G().save.coins;
  clickText(/Yesterday|hôm qua/);
  await sleep(400); await settle(12000); await closeIntro(1500); await settle();
  const cu = G().daily;
  const won = await winNow();
  const reward = G().win && G().win.reward;
  await finishHome();
  const d = D();
  const srcs = Object.values(d.hist);
  return { pass: texts.filter(x => /Yesterday|hôm qua/.test(x)).length === 1 && cu && cu.catchup && cu.key === '2026-10-16' && won && reward === 20
      && coinOk(G().save.coins - coins0, 20) && d.stamps.length === 3 && new Set(srcs).size === srcs.length && events('daily_catchup').length === 1,
    detail: `nút [${texts.join(' | ')}]; chơi bù ${cu && cu.key} catchup ${cu && cu.catchup}; thưởng ${reward}; dấu ${d.stamps.length}; thư đã mở ${srcs.join(', ')}` };
});
scen('Lùi giờ máy 3 ngày: không có Thư hôm nay mới, ngày hiệu dụng giữ nguyên', async () => {
  const before = G().live.today();
  G().live.setNow(dayMs(2));
  G().refreshHome(); G().goHome(); await sleep(300);
  const after = G().live.today(), st = G().live.state();
  return { pass: before === '2026-10-17' && after === before && st.rolledBack, detail: `trước ${before}, sau khi lùi về 14/10: ${after}, rolledBack ${st.rolledBack}, pd ${st.pd}` };
});
scen('Thư dở: thoát giữa chừng rồi mở lại panel thì "Chơi tiếp lá thư" dựng lại đúng bàn', async () => {
  G().live.setNow(dayMs(6));                       // 18/10
  await playDaily();
  await step(); await step(); await step();
  const used = G().S.used;
  G().goHome(); await sleep(300);
  const saved = !!G().loadDailyRun('2026-10-18');
  const { texts } = await playDaily(/Continue|tiếp/);
  const back = G().S && G().S.used;
  G().goHome(); await sleep(300);
  return { pass: saved && /Continue|tiếp/.test(texts[0]) && back === used, detail: `lưu: ${saved}; nút [${texts.join(' | ')}]; used ${used} -> ${back}` };
});
scen('Qua nửa đêm khi đang chơi: thắng vẫn tính cho ngày bắt đầu', async () => {
  const { texts } = await playDaily(/Continue|tiếp|Open|Mở/);
  G().live.setNow(dayMs(7));                       // sang 19/10 giữa ván
  const won = await winNow();
  await finishHome();
  const d = D();
  const k18 = Object.keys(d.won).map(Number).find(k => G().save.daily.hist[k] && new Date(k * 864e5).toISOString().startsWith('2026-10-18'));
  return { pass: won && !!k18 && d.won[k18] === 1 && d.stamps.length === 4, detail: `nút [${texts.join(' | ')}]; thắng ${won}; won 18/10: ${k18 ? d.won[k18] : 'không'}; dấu ${d.stamps.length}` };
});
scen('Đủ 20 dấu: đầy trang Sổ dấu ngày, +150 xu + món kỷ niệm, sang trang 2', async () => {
  const s = G().save, d = s.daily;
  const base = d.stamps[0] - 40;
  while (d.stamps.length < 19) { const k = base + d.stamps.length; d.stamps.push(k); d.won[k] = 1; }
  G().persist();
  G().live.setNow(dayMs(8));                       // 20/10
  const coins0 = s.coins;
  await playDaily();
  const won = await winNow();
  const w = G().win, body = document.querySelector('.panel.win .pin') ? document.querySelector('.panel.win .pin').textContent : '';
  await finishHome();
  btn().dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await waitPanel(2000);
  const head = (document.querySelector('.panel .sb-head') || {}).textContent || '';
  clickText(/Close|Đóng/); await sleep(300);
  return { pass: won && w.reward === 190 && w.paid === 190 && coinOk(G().save.coins - coins0, 190) && d.pages === 1 && d.keepsakes === 1 && /2/.test(head) && events('stampbook_page_complete').length === 1,
    detail: `thưởng ${w && w.reward} (xu +${G().save.coins - coins0}); trang ${d.pages}, kỷ niệm ${d.keepsakes}; sổ: "${head}"; màn thắng: "${body.replace(/\s+/g, ' ').slice(0, 90)}"` };
});
scen('Album có trang Sổ dấu ngày; nhãn EN/VI không có chữ "mất chuỗi / streak lost / hết hạn"', async () => {
  G().openAlbum(); await sleep(300);
  const has = !!document.querySelector('#albumBody .sb');
  document.getElementById('albumClose').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  const src = await (await fetch('src/copy.js')).text();
  const bad = /mất chuỗi|streak lost|hết hạn|expire/i.test(src);
  return { pass: has && !bad, detail: `album có sổ: ${has}; chữ cấm trong copy.js: ${bad}` };
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
