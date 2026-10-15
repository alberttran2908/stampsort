// Test trình duyệt cho R10: lưu và tiếp tục ván dở. Chạy TRONG TRÌNH DUYỆT (không phải Node), PointerEvent thật cho nút panel.
// Save của trang sẽ bị thay bằng save mẫu (unlocked 12, 2000 xu, đã xem hết tutorial): dùng profile trình duyệt riêng.
//
// Cách chạy (console hoặc javascript_tool, trang http://localhost:8766/index.html):
//   const m = await import('/tests/resume.browser.js');
//   await m.setup();            // ghi save mẫu rồi reload trang (bước này làm mất promise, chờ trang tải xong)
//   // sau reload:
//   const m = await import('/tests/resume.browser.js');
//   await m.runAll();           // các kịch bản trong trang, trả mảng "PASS|FAIL  tên  [chi tiết]"
//   await m.prepareReload();    // đi 5 nước ở L3, nhớ snapshot vào sessionStorage rồi reload thật
//   // sau reload:
//   const m = await import('/tests/resume.browser.js');
//   await m.checkReload();      // bấm "Chơi tiếp" ở hộp hỏi lúc mở app, so snapshot
//
// runAll() "dừng ván" bằng goHome (game lưu ván) rồi vào lại bằng playLevel: state được dựng lại từ JSON trong localStorage,
// không dùng lại state trong bộ nhớ. prepareReload/checkReload kiểm đường mở lại app thật (boot -> hộp hỏi).
// Driver CDP chỉ cần gọi lần lượt: setup, (chờ tải) runAll, prepareReload, (chờ tải) checkReload.
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;
const SAVE_KEY = () => 'stampsort_proto_v1' + (G().variant === 'b' ? '_b' : '');
const RESUME_KEY = () => SAVE_KEY() + '_resume';
const EVENTS_KEY = 'stampsort_events_v1';
const RELOAD_KEY = 'resume_test_reload';

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
function clickBtn(i) {
  const b = visibleBtns()[i];
  if (!b) return false;
  b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  return true;
}
async function waitPanel(ms = 6000) {
  for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length) return true; await sleep(100); }
  return false;
}
async function closePanels(ms = 3000) {
  for (const t0 = performance.now(); performance.now() - t0 < ms;) { if (visibleBtns().length) clickBtn(0); await sleep(300); }
}
/** Vào level (index 0-based) như người chơi mới bắt đầu: chờ chia bài, đóng bảng giới thiệu nếu có. */
async function enter(idx) {
  G().startLevel(idx);
  await sleep(400);
  await settle(9000);
  await closePanels(2500);
  await settle();
}
/** Một nước tất định: nước hợp lệ đầu tiên, không có thì rút bài. */
async function step() {
  const g = G(), acts = g.E.legalMoves(g.S).filter(a => a.src && a.dst);
  if (acts.length) g.doMove(acts[0].src, acts[0].dst, false); else g.onDeck();
  await settle();
}
function snap() {
  const S = G().S;
  return JSON.stringify({
    cols: S.cols.map(c => c.map(x => x.id + (x.up ? '+' : '-'))), deck: S.deck.map(c => c.id), waste: S.waste.map(c => c.id),
    found: S.found.map(f => f && [f.t, f.topic.id, ...f.cards.map(c => c.id)]), moves: String(S.moves), used: S.used,
    delivered: S.delivered, extra: S.extraSlot,
  });
}
const save = () => JSON.parse(localStorage.getItem(SAVE_KEY()) || '{}');
const wallet = () => { const s = save(); return JSON.stringify({ coins: s.coins, hint: s.hint, pack: s.pack, stamper: s.stamper, joker: s.joker }); };
const events = name => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]').filter(e => e.name === name);
/** Dừng ván (Trang chủ lưu ván) rồi vào lại level đó và chọn nút thứ `choice` của hộp hỏi (0 = Chơi tiếp, 1 = Ván mới). */
async function leaveAndReturn(idx, choice = 0) {
  G().goHome();
  await sleep(300);
  G().playLevel(idx);
  const asked = await waitPanel(2000);
  const btns = visibleBtns().map(b => b.textContent.trim());
  if (asked) clickBtn(choice);
  await sleep(400);
  await settle(9000);
  await sleep(300);
  return { asked, btns };
}

const SCEN = [];
const scen = (name, fn) => SCEN.push({ name, fn });

scen('L3: đi 5 nước, về Trang chủ, vào lại, chọn "Chơi tiếp": cột, ô, bộ bài, số nước giống hệt', async () => {
  await enter(2);
  for (let k = 0; k < 5; k++) await step();
  const before = snap(), att = JSON.stringify(save().attempts || {}), nResume = events('level_resume').length;
  G().goHome(1);                                 // xem chương 1 để thấy ô L3
  await sleep(400);
  const playLbl = document.getElementById('playBtn').textContent, tile = [...document.querySelectorAll('.lvl.resume')].map(e => e.textContent).join(',');
  G().playLevel(2);
  const asked = await waitPanel(2000);
  clickBtn(0);
  await sleep(400); await settle(9000); await sleep(300);
  const same = snap() === before, ev = events('level_resume').length - nResume, attSame = JSON.stringify(save().attempts || {}) === att;
  return { pass: asked && same && ev === 1 && attSame && /3/.test(playLbl) && tile === '3',
    detail: `hỏi: ${asked}, giống hệt: ${same}, level_resume +${ev}, attempts không đổi: ${attSame}, nút chính "${playLbl}", ô dở: ${tile || 'không'}` };
});
scen('Chọn "Ván mới": ván bắt đầu lại, không trừ xu hay booster, bản lưu bị xoá', async () => {
  await step(); await step();
  G().goHome();
  await sleep(300);
  const w0 = wallet(), nDecl = events('level_resume_decline').length;
  const { asked } = await leaveAndReturn(2, 1);
  await closePanels(1500);
  const S = G().S, w1 = wallet(), gone = !localStorage.getItem(RESUME_KEY());
  return { pass: asked && S.used === 0 && w0 === w1 && gone && events('level_resume_decline').length === nDecl + 1,
    detail: `used ${S.used}, ví ${w0} -> ${w1}, bản lưu xoá: ${gone}` };
});
scen('L5 (level khó) đang Ca tối: chơi tiếp vẫn Ca tối, moves vô hạn, bàn giống hệt', async () => {
  await enter(4);
  const g = G();
  const s = g.E.clone(g.S); s.moves = 1; g.setState(s);
  await step(); await sleep(600); await step();
  const before = snap(), otBefore = String(g.S.moves) === 'Infinity';
  const { asked } = await leaveAndReturn(4, 0);
  const ot = document.getElementById('moves').classList.contains('overtime');
  return { pass: otBefore && asked && snap() === before && String(G().S.moves) === 'Infinity' && ot,
    detail: `trước: Ca tối ${otBefore}; sau: moves ${G().S.moves}, nhãn Ca tối ${ot}, giống hệt ${snap() === before}` };
});
scen('L9: đã mở Ô phụ (quảng cáo giả): chơi tiếp vẫn còn Ô phụ, không cộng thêm ô', async () => {
  await enter(8);
  await step(); await step();
  document.querySelector('.slot.locked').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await waitPanel(2000);
  clickBtn(0);                                   // "Miễn phí (quảng cáo)"
  await sleep(2200); await settle();
  const before = snap(), n = G().S.found.length;
  const { asked } = await leaveAndReturn(8, 0);
  const S = G().S;
  return { pass: asked && S.extraSlot && S.found.length === n && snap() === before,
    detail: `Ô phụ ${S.extraSlot}, số ô ${n} -> ${S.found.length}, giống hệt ${snap() === before}` };
});
scen('Dữ liệu level đổi (chữ ký khác): bản lưu bị bỏ, không hỏi chơi tiếp', async () => {
  await step();
  G().goHome();
  await sleep(300);
  const r = JSON.parse(localStorage.getItem(RESUME_KEY()) || 'null');
  if (!r) return { pass: false, detail: 'không có bản lưu để thử' };
  r.sig = 'khac'; localStorage.setItem(RESUME_KEY(), JSON.stringify(r));
  const run = G().loadRun();
  return { pass: !run && !localStorage.getItem(RESUME_KEY()), detail: `loadRun: ${run ? 'còn' : 'null'}` };
});

/** Ghi save mẫu (đã qua tutorial, mở tới L12) rồi reload. */
export function setup() {
  const seen = {};
  for (const k of ['rules', 'script_1', 'script_4', 'script_7', 'script_9', 'unlock_hint', 'unlock_pack', 'unlock_stamper', 'unlock_joker',
    'moves', 'crown', 'tap', 'draw', 'stack', 'peek', 'empty', 'full', 'intro_11', 'intro_12', 'pts_explain']) seen[k] = 1;
  localStorage.setItem(SAVE_KEY(), JSON.stringify({ unlocked: 12, coins: 2000, stars: {}, hint: 3, pack: 2, stamper: 2, joker: 2, slot: 0, seen, attempts: {}, fixture: 'resume-test' }));
  localStorage.removeItem(RESUME_KEY());
  sessionStorage.removeItem(RELOAD_KEY);
  location.reload();
}
const ready = () => save().fixture === 'resume-test';

export async function runAll() {
  if (!ready()) return ['SETUP  chưa có save mẫu: gọi setup() rồi chạy lại sau khi trang tải xong'];
  if (visibleBtns().length) { clickBtn(1); await sleep(600); }      // hộp hỏi lúc mở app còn sót: chọn Ván mới để dọn
  const out = [];
  for (const s of SCEN) {
    try { const r = await s.fn(); out.push(`${r.pass ? 'PASS' : 'FAIL'}  ${s.name}  [${r.detail}]`); } catch (e) { out.push(`ERR   ${s.name}  ${String(e && e.stack).slice(0, 200)}`); }
  }
  G().goHome();
  return out;
}

/** Phần 1 của kiểm tra reload thật: đi 5 nước ở L3, nhớ snapshot, reload. */
export async function prepareReload() {
  if (!ready()) return 'SETUP  gọi setup() trước';
  await enter(2);
  for (let k = 0; k < 5; k++) await step();
  sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ snap: snap(), wallet: wallet(), resumes: events('level_resume').length }));
  location.reload();
  return 'reloading';
}
/** Phần 2: sau reload, hộp hỏi phải hiện; bấm "Chơi tiếp" và so snapshot. */
export async function checkReload() {
  const mem = JSON.parse(sessionStorage.getItem(RELOAD_KEY) || 'null');
  if (!mem) return 'SETUP  gọi prepareReload() trước';
  sessionStorage.removeItem(RELOAD_KEY);
  const asked = await waitPanel(6000);
  const title = G().panelTitle;
  if (asked) clickBtn(0);
  await sleep(400); await settle(9000); await sleep(300);
  const same = snap() === mem.snap, ev = events('level_resume').length - mem.resumes, w = wallet() === mem.wallet;
  return `${asked && same && ev === 1 && w ? 'PASS' : 'FAIL'}  Reload thật L3 sau 5 nước: hỏi "${title}", giống hệt: ${same}, level_resume +${ev}, ví không đổi: ${w}`;
}
export { snap, step, enter, settle };
