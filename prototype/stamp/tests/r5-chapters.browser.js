// Test trình duyệt cho R5: level sinh L21+, chương 20 level, chuyển chương, save cũ của tester, ván dở khi mở level khác (QA N1).
// Chạy TRONG TRÌNH DUYỆT (trang http://localhost:8766/index.html?debug), profile riêng vì save bị thay:
//   const m = await import('/tests/r5-chapters.browser.js');
//   await m.setup();     // ghi save kiểu tester cũ (đang ở L35 của bản level APK, đã nhận thưởng chương 3–4 cũ) rồi reload
//   // sau reload:
//   const m = await import('/tests/r5-chapters.browser.js');
//   await m.runAll();    // mảng "PASS|FAIL  tên  [chi tiết]"
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;
const SAVE_KEY = () => 'stampsort_proto_v1' + (G().variant === 'b' ? '_b' : '');
const EVENTS_KEY = 'stampsort_events_v1';
const events = name => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]').filter(e => e.name === name);
async function settle(maxMs = 6000) {
  const t0 = performance.now();
  await sleep(60);
  while (performance.now() - t0 < maxMs) { if (!G().busy) { await sleep(320); if (!G().busy) return true; } await sleep(50); }
  return false;
}
const visibleBtns = () => [...document.querySelectorAll('.panel .btn')].filter(b => b.offsetParent && !b.classList.contains('wait'));
function clickBtn(i) { const b = visibleBtns()[i]; if (!b) return false; b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return true; }
async function waitPanel(ms = 6000) { for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length) return true; await sleep(100); } return false; }
async function closePanels(ms = 2500) { for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length && !G().win) clickBtn(0); await sleep(300); } }
async function enter(idx) { G().startLevel(idx); await sleep(400); await settle(12000); await closePanels(2500); await settle(); }
async function step() {
  const g = G(), acts = g.E.legalMoves(g.S).filter(a => a.src && a.dst);
  if (acts.length) g.doMove(acts[0].src, acts[0].dst, false); else g.onDeck();
  await settle();
}
/** Thắng ván hiện tại bằng solver (debug Auto-solve), chờ màn thắng xong. */
async function winNow(maxS = 150) {
  G().autoplay(260);
  for (let i = 0; i < maxS * 4; i++) { await sleep(250); const w = G().win; if (w && w.ended) return true; }
  return false;
}
const tiles = () => [...document.querySelectorAll('#grid .lvl')].map(e => parseInt(e.textContent, 10));

export async function setup() {
  localStorage.clear();
  const stars = Object.fromEntries(Array.from({ length: 34 }, (_, i) => [i + 1, 2]));
  // tester cũ: đang ở L35 của bản 60 level APK, có cờ thưởng hết chương 3 và 4 của cấu trúc 10 level (L30, L40 cũ), có decor ch1
  localStorage.setItem(SAVE_KEY(), JSON.stringify({ unlocked: 35, coins: 2500, stars, hint: 3, pack: 2, stamper: 2, joker: 2, slot: 0, decor: 6,
    chapter1: 1, chapter2: 1, chapter3: 1, chapter4: 1, seen: { rules: 1, unlock_hint: 1, unlock_pack: 1, unlock_stamper: 1, unlock_joker: 1, feat_daily: 1, tap: 1, pts_explain: 1 }, attempts: {} }));
  location.reload();
}

const SCEN = [];
const scen = (name, fn) => SCEN.push({ name, fn });

scen('Level: L21+ lấy từ levels_gen.js, chỗ chưa sinh lấy level APK cùng số, id liền mạch', async () => {
  const L = G().levels;
  const gen = L.filter(l => /^gen:|^abi:/.test(l.source)).map(l => l.id), apk = L.filter(l => l.source === 'apk').map(l => l.id);
  const contiguous = L.every((l, i) => l.id === i + 1);
  return { pass: contiguous && gen.length >= 20 && gen[0] === 21 && apk.every(id => id > Math.max(...gen) || !gen.includes(id)),
    detail: `${L.length} level; sinh: L${gen[0]}–L${gen[gen.length - 1]} (${gen.length}); APK: ${apk.length ? `L${apk[0]}–L${apk[apk.length - 1]}` : 'không'}` };
});
scen('Save cũ ở L35: giữ unlocked, Tem Điểm, xu; bỏ cờ thưởng chương 3–4 cũ; màn chính ở Chương 3 trang 31–40, ô 35 là level hiện tại', async () => {
  G().goHome(); await sleep(500);
  const s = G().save;
  const play = document.getElementById('playBtn').textContent;
  const cur = document.querySelector('#grid .lvl.cur');
  const t = tiles();
  const pass = s.unlocked === 35 && s.coins === 2500 && Object.keys(s.stars).length === 34 && !s.chapter3 && !s.chapter4 && s.chapter2 === 1 && s.chv === 2
    && G().homeCh === 3 && G().homePage === 1 && t[0] === 31 && t[t.length - 1] === 40 && /35/.test(play) && cur && parseInt(cur.textContent, 10) === 35;
  return { pass, detail: `unlocked ${s.unlocked}, xu ${s.coins}, Tem Điểm ${Object.keys(s.stars).length} level, cờ ch3/ch4 ${s.chapter3}/${s.chapter4}, chương ${G().homeCh} trang ${G().homePage} ô ${t[0]}–${t[t.length - 1]}, nút "${play}"` };
});
scen('Save cũ: vào L35 (level sinh) chơi được, ván dở cũ của L35 bản APK bị bỏ vì chữ ký level đổi', async () => {
  // bản lưu ván dở giả của L35 cũ (chữ ký khác) -> phải bị bỏ, không hỏi
  localStorage.setItem(SAVE_KEY() + '_resume', JSON.stringify({ v: 1, lv: 35, idx: 34, sig: 'old.apk', at: Date.now(), s: { cols: [] } }));
  const dropped = G().loadRun() === null && !localStorage.getItem(SAVE_KEY() + '_resume');
  await enter(34);
  const S = G().S, L = G().levels[34];
  await step(); await step();
  return { pass: dropped && G().level === 35 && /^gen:|^abi:/.test(L.source) && S.used >= 1 && S.cols.length >= 4,
    detail: `bỏ bản lưu cũ: ${dropped}; L${G().level} nguồn ${L.source}, ${S.cols.length} cột, đi ${S.used} nước` };
});
scen('QA N1: có ván dở L35, mở L21 thì hỏi trước; chỉ mở xem rồi thoát không mất ván L35', async () => {
  G().goHome(); await sleep(400);
  const had = G().loadRun();
  G().playLevel(20);
  const asked = await waitPanel(2000);
  const btns = visibleBtns().map(b => b.textContent.trim());
  clickBtn(1);                                     // "Chơi Level 21"
  await sleep(400); await settle(9000); await closePanels(1500);
  const inL21 = G().level === 21 && G().S.used === 0;
  G().goHome(); await sleep(400);
  const kept = G().loadRun();
  return { pass: !!had && had.idx === 34 && asked && btns.length === 2 && /35/.test(btns[0]) && inL21 && kept && kept.idx === 34,
    detail: `ván dở trước: L${had && had.idx + 1}; hỏi: ${asked} [${btns.join(' | ')}]; vào L21 used 0: ${inL21}; sau khi thoát ván dở vẫn là L${kept && kept.idx + 1}` };
});
scen('Chơi L21 tới thắng: màn thắng, Tem Điểm ghi theo số level, unlocked không lùi', async () => {
  await enter(20);
  const won = await winNow();
  const s = G().save;
  const title = G().panelTitle;
  return { pass: won && !!s.stars[21] && s.unlocked === 35, detail: `thắng: ${won} "${title}", Tem Điểm L21 ${s.stars[21]}, unlocked ${s.unlocked}` };
});
scen('L41 (chương 4) chia bài và chơi được', async () => {
  await enter(40);
  const L = G().levels[40], S = G().S;
  const n = S.cols.flat().length + S.deck.length;
  await step(); await step(); await step();
  return { pass: G().level === 41 && n > 20 && G().S.used >= 1, detail: `L41 nguồn ${L.source}, ${n} lá, đi ${G().S.used} nước` };
});
scen('Chuyển chương: thắng L40 -> thưởng hết Chương 3 (+200, câu chung) -> "Chương 4 →" vào L41; màn chính Chương 4', async () => {
  const s = G().save; s.unlocked = 40; G().persist();
  G().clearRun();
  await enter(39);
  const coins0 = G().save.coins;
  const won = await winNow(240);
  clickBtn(0);                                     // Tiếp tục -> thưởng chương
  const chPanel = await waitPanel(3000);
  await sleep(500);
  const title = G().panelTitle, body = ([...document.querySelectorAll('.panel .pin p')].pop() || {}).textContent || '';
  await sleep(2200);
  const coinsAfter = G().save.coins;
  const btns = visibleBtns().map(b => b.textContent.trim());
  clickBtn(0);                                     // Chương 4 →
  await sleep(500); await settle(12000); await closePanels(2000);
  const lv = G().level;
  G().goHome(); await sleep(500);
  const pass = won && chPanel && /3/.test(title) && /Tea Hill|Đồi Trà/.test(body) && /Apple Orchard|Vườn Táo/.test(body) && G().save.chapter3 === 1
    && coinsAfter - coins0 >= 200 && /4/.test(btns[0]) && lv === 41 && G().homeCh === 4 && tiles()[0] === 41;
  return { pass, detail: `thắng ${won}; bảng "${title}": "${body}"; xu +${coinsAfter - coins0}; nút [${btns.join(' | ')}]; vào L${lv}; màn chính chương ${G().homeCh} ô ${tiles()[0]}` };
});
scen('Thanh chương: ‹ › đi từng trang 10 level rồi sang chương; chương sau còn khoá mở teaser chung (bưu thiếp/placeholder, tem mới)', async () => {
  const s = G().save; s.unlocked = 35; G().persist();
  G().goHome(3, 0); await sleep(300);
  const p0 = tiles();
  const arrows = () => [...document.querySelectorAll('.ch-nav .ch-arrow')];
  const sz = arrows().map(a => Math.round(a.getBoundingClientRect().width / (document.getElementById('stage').getBoundingClientRect().width / 1080)));
  arrows()[1].dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await sleep(300);
  const p1 = tiles(), locked = arrows()[1].classList.contains('locked');
  arrows()[1].dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await sleep(600);
  const teaser = document.getElementById('ch2');
  const open = !teaser.classList.contains('off'), ttl = document.getElementById('ch2Title').textContent;
  const ph = teaser.querySelector('.ch2-card').classList.contains('ph');
  const nT = events('chapter_teaser_open').filter(e => e.chapter === 4).length;
  document.getElementById('ch2Close').dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await sleep(300);
  arrows()[0].dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await sleep(300);
  const back = tiles();
  arrows()[0].dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await sleep(300);
  const ch2 = G().homeCh;
  return { pass: p0[0] === 21 && p1[0] === 31 && locked && open && /4/.test(ttl) && nT >= 1 && back[0] === 21 && ch2 === 2 && sz.every(v => v >= 127),
    detail: `trang 1: ${p0[0]}–${p0[p0.length - 1]}, trang 2: ${p1[0]}–${p1[p1.length - 1]}, › khoá: ${locked}; teaser "${ttl}" mở: ${open}, bưu thiếp placeholder: ${ph}; ‹ về ${back[0]}, ‹ nữa: chương ${ch2}; nút mũi tên ${sz.join('/')}px stage` };
});
scen('Decor chương 3+ có đủ art thì đặt được (6 món, giá 4/5/6/7/8/10, chỗ đặt dc-s0..5); chương thiếu art báo "sắp có"', async () => {
  const has = async id => (await fetch(`assets/decor/${id}.png`, { method: 'HEAD' })).ok;
  G().goHome(3, 0); await sleep(1200);
  const s = G().save; const before = s.decor3 || 0;
  document.getElementById('decorBtn').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await waitPanel(1500);
  const body3 = document.querySelector('.panel .pin').textContent.replace(/\s+/g, ' ').trim();
  clickBtn(0); await sleep(500);
  const after = G().save.decor3 || 0;
  const img = document.querySelector('#decor .dc-s0');
  // chương chưa có art (chương đầu tiên thiếu ít nhất 1 file decor), không cần có level
  let missing = null;
  for (const ch of G().chapters.slice(2)) { if (!ch.decor.length) continue; const ok = await Promise.all(ch.decor.map(d => has(d.id))); if (!ok.every(Boolean)) { missing = ch; break; } }
  if (missing) { G().decorOf(missing); await sleep(800); }
  const soonOk = !missing || G().decorOf(missing).length === 0;
  const ch3 = G().chapters[2];
  const ch3art = (await Promise.all(ch3.decor.map(d => has(d.id)))).every(Boolean);
  return { pass: ch3.decor.map(d => d.cost).join('/') === '4/5/6/7/8/10' && (!ch3art || (after === before + 1 && !!img && /1\/6/.test(body3))) && soonOk,
    detail: `ch3 đủ art: ${ch3art}; "${body3.slice(0, 50)}", đặt ${before} -> ${after}, ảnh chỗ TRÊN: ${!!img}; chương thiếu art: ${missing ? missing.id + ' -> "sắp có" ' + soonOk : 'không có'}` };
});
scen('Câu tip của level sinh (L36 "3 quầy") hiện 1 lần ở đầu level, cờ ghi sau nước đầu', async () => {
  const s = G().save; s.unlocked = 40; delete s.seen.ltip_few_counters; G().persist();
  const L = G().levels[35];
  await enter(35);
  const tip = G().tutText;
  const before = !!G().save.seen.ltip_few_counters;
  await step(); await sleep(300);
  const after = !!G().save.seen.ltip_few_counters;
  return { pass: L.tip === 'few_counters' && /3/.test(tip) && !before && after, detail: `tip "${L.tip}": "${tip}", cờ trước/sau nước đầu: ${before}/${after}` };
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
