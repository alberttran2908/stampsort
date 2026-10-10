// Kịch bản kéo thả cố định, mô phỏng thói quen người chơi chưa hiểu luật. Chạy TRONG TRÌNH DUYỆT bằng PointerEvent thật.
// Dựng bàn riêng cho từng tình huống từ chính các lá của level 3 (window.__game.setState), kéo, rồi so với ý định.
//   const m = await import('/tests/drag-scenarios.browser.js'); await m.runAll()
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = () => window.__game;

async function settle(maxMs = 4000) {
  const t0 = performance.now();
  await sleep(60);
  while (performance.now() - t0 < maxMs) {
    if (!G().busy) { await sleep(300); if (!G().busy) return true; }
    await sleep(50);
  }
  return false;
}

let POOL = null;      // lá của level 3 theo topic
let A, B, C, D, E, F; // topic xếp theo số tem giảm dần
async function initPool() {
  const g = G();
  g.startLevel(2);   // không await: trên save trống startLevel chờ người chơi đóng bảng luật -> treo
  await settle(6000);
  // save trống: bảng luật / quà booster hiện SAU khi chia bài -> đóng mọi bảng xuất hiện trong 9 giây đầu (nút chỉ nghe pointerup)
  for (const t0 = performance.now(); performance.now() - t0 < 9000;) {
    const b = [...document.querySelectorAll('.panel .btn')].find(x => x.offsetParent);
    if (b) b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await sleep(300);
  }
  const all = [...g.S.cols.flat(), ...g.S.deck, ...g.S.waste].map(c => ({ ...c }));
  POOL = all;
  const cnt = {};
  for (const c of all) if (c.k === 'stamp') cnt[c.t] = (cnt[c.t] || 0) + 1;
  [A, B, C, D, E, F] = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]);
}

/** spec.cols: mảng cột, mỗi lá là 'A' | 'A*' (vương miện) | '_A' (úp), A/B/C là topic. spec.found: [null | 'A', ...] */
async function build(spec) {
  const g = G();
  const used = new Set();
  const T = { A, B, C, D, E, F };
  const take = (t, k) => {
    const c = POOL.find(x => !used.has(x.id) && x.t === t && x.k === k) || POOL.find(x => !used.has(x.id) && x.k === 'stamp' && x.t !== A && x.t !== B);
    used.add(c.id);
    return { ...c };
  };
  const parse = tok => {
    const down = tok.startsWith('_');
    const s = tok.replace('_', '');
    const crown = s.endsWith('*');
    const c = take(T[s[0]], crown ? 'topic' : 'stamp');
    c.up = !down;
    return c;
  };
  const found = spec.found.map(f => (f ? { t: T[f], n: 99, topic: { ...take(T[f], 'topic'), up: true }, cards: [] } : null));
  const cols = spec.cols.map(col => col.map(parse));
  const deck = POOL.filter(c => !used.has(c.id)).map(c => ({ ...c, up: false }));
  found.forEach(f => { if (f) f.n = POOL.filter(c => c.t === f.t).length; });
  const s = { cols, deck, waste: [], found, extraSlot: false, moves: 99, used: 0, delivered: found.filter(Boolean).length, total: POOL.length, jokerCount: 0 };
  g.setState(s);
  await sleep(50); await settle();
  return s;
}

const geo = () => G().geo();
const toClient = (x, y) => { const q = geo(); return { x: q.stageLeft + x * q.scale, y: q.stageTop + y * q.scale }; };
function fire(type, el, c, id) {
  el.dispatchEvent(new PointerEvent(type, { clientX: c.x, clientY: c.y, pointerId: id, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
}
/** điểm trên phần LỘ của lá (cột i, vị trí idx); fx, fy trong [0..1] */
function grabPoint(i, idx, fx = 0.5, fy = 0.5) {
  const g = G(), col = g.S.cols[i], views = g.views();
  const r = views.get(col[idx].id).el.getBoundingClientRect();
  let bottom = r.bottom;
  if (idx + 1 < col.length) bottom = Math.min(bottom, views.get(col[idx + 1].id).el.getBoundingClientRect().top);
  return { x: r.left + 6 + fx * (r.width - 12), y: r.top + 4 + fy * (bottom - r.top - 8) };
}
let PID = 20;
async function drag(from, toStage, { steps = 10, stepMs = 16 } = {}) {
  const board = document.getElementById('board');
  const el = document.elementFromPoint(from.x, from.y);
  const to = toClient(toStage.x, toStage.y);
  const id = PID++;
  fire('pointerdown', el, from, id);
  for (let k = 1; k <= steps; k++) {
    const c = { x: from.x + (to.x - from.x) * k / steps, y: from.y + (to.y - from.y) * k / steps };
    fire('pointermove', board, c, id);
    await sleep(stepMs);
  }
  fire('pointerup', board, to, id);
}
async function tap(from) {
  const el = document.elementFromPoint(from.x, from.y);
  const id = PID++;
  fire('pointerdown', el, from, id);
  await sleep(60);
  fire('pointerup', document.getElementById('board'), from, id);
}
const colTop = j => { const g = G(), q = geo(), col = g.S.cols[j], L = g.layout(); const y = col.length ? L.get(col[col.length - 1].id).y : q.TAB_Y; return { x: q.cols[j] + q.CW / 2, y: y + q.CH / 2 }; };
const slotCenter = k => { const q = geo(); return { x: q.slots[k].x + q.CW / 2, y: q.slots[k].y + q.CH / 2 }; };
const ids = (i, from = 0) => G().S.cols[i].slice(from).map(c => c.id);
const colIds = j => G().S.cols[j].map(c => c.id);
const foundIds = k => { const f = G().S.found[k]; return f ? [f.topic.id, ...f.cards.map(c => c.id)] : []; };
function strays() {
  const g = G(), L = g.layout(), views = g.views(), bad = [];
  for (const [id, t] of L) {
    const v = views.get(id);
    if (!v || getComputedStyle(v.el).visibility === 'hidden') continue;
    if (Math.abs(v.x - t.x) > 3 || Math.abs(v.y - t.y) > 3) bad.push(id);
  }
  g.S.cols.forEach((col, j) => { if (col.length && !col[col.length - 1].up) bad.push('úp@' + j); });
  return bad;
}

const SCEN = [];
const scen = (name, fn) => SCEN.push({ name, fn });
const has = (arr, sub) => sub.every(x => arr.includes(x));

// --- xấp tem thường
const BASE = { cols: [['_C', 'A', 'A', 'A'], ['_C', 'A'], ['_C', 'B*', 'B', 'B'], ['_C', 'B']], found: [null, null, null, null] };
for (const [label, idx, fy] of [['lá trên cùng', 3, 0.7], ['lá giữa', 2, 0.5], ['lá dưới cùng của xấp', 1, 0.3]]) {
  scen(`Cầm ${label} của xấp 3 tem, thả lên tem cùng loại ở cột khác: cả xấp đi`, async () => {
    await build(BASE);
    const stack = ids(0, 1);
    await drag(grabPoint(0, idx, 0.5, fy), colTop(1));
    await settle();
    return { pass: has(colIds(1), stack) && G().S.cols[0].length === 1, detail: `cột 1: ${colIds(1).length} lá, cột 0 còn ${G().S.cols[0].length}` };
  });
}
scen('Chạm (không kéo) lá trên cùng của xấp: cả xấp tự đi tới chỗ hợp lệ', async () => {
  await build(BASE);
  const stack = ids(0, 1);
  await tap(grabPoint(0, 3));
  await settle();
  return { pass: has(colIds(1), stack), detail: `cột 1: ${colIds(1).length} lá` };
});
// --- xấp có tem vương miện ở đáy
scen('Xấp [vương miện B, B, B]: cầm lá B trên cùng, thả lên tem B ở cột khác → 2 tem B đi, vương miện ở lại', async () => {
  await build(BASE);
  const two = ids(2, 2);
  await drag(grabPoint(2, 3, 0.5, 0.7), colTop(3));
  await settle();
  return { pass: has(colIds(3), two), detail: `cột 3: ${colIds(3).length} lá, toast: "${G().toastText}"` };
});
scen('Xấp [vương miện B, B, B]: cầm lá trên cùng, thả vào ô trống → cả 3 vào ô', async () => {
  await build(BASE);
  const all3 = ids(2, 1);
  await drag(grabPoint(2, 3, 0.5, 0.7), slotCenter(1));
  await settle();
  const k = G().S.found.findIndex(f => f && f.t === B);
  return { pass: k >= 0 && has(foundIds(k), all3), detail: `ô B: ${k >= 0 ? foundIds(k).length : 0} lá` };
});
scen('Chạm lá trên cùng của xấp [vương miện B, B, B] khi còn ô trống: cả xấp vào ô', async () => {
  await build(BASE);
  await tap(grabPoint(2, 3));
  await settle();
  const k = G().S.found.findIndex(f => f && f.t === B);
  return { pass: k >= 0 && foundIds(k).length === 3, detail: `ô B: ${k >= 0 ? foundIds(k).length : 0} lá` };
});
scen('Chạm lá trên cùng của xấp [vương miện B, B, B] khi HẾT ô trống: 2 tem B sang tem B ở cột khác', async () => {
  await build({ ...BASE, found: ['C', 'D', 'E', 'F'] });
  const two = ids(2, 2);
  await tap(grabPoint(2, 3));
  await settle(1500);
  return { pass: has(colIds(3), two), detail: `cột 3: ${colIds(3).length} lá, toast: "${G().toastText}"` };
});
// --- thả lệch: ngón tay ở ô này, lá dưới cùng của xấp lệch sang ô bên cạnh
scen('Ngón tay thả ở ô 2 (cầm mép phải lá trên cùng): xấp vào ô 2, không nhảy sang ô 1', async () => {
  await build(BASE);
  const q = geo();
  const p = grabPoint(2, 3, 0.98, 0.9);
  await drag(p, { x: q.slots[2].x + 10, y: q.slots[2].y + q.CH * 0.6 });
  await settle();
  const k = G().S.found.findIndex(f => f && f.t === B);
  return { pass: k === 2, detail: `vào ô ${k}` };
});
// --- ô đã mở đúng loại
scen('Cầm lá trên cùng của xấp 3 tem A, thả vào ô A đang mở: cả 3 vào ô', async () => {
  await build({ ...BASE, found: [null, 'A', null, null] });
  const stack = ids(0, 1);
  await drag(grabPoint(0, 3, 0.5, 0.7), slotCenter(1));
  await settle();
  return { pass: has(foundIds(1), stack), detail: `ô A: ${foundIds(1).length} lá` };
});
// --- lá bị lá khác loại đè
scen('Cầm lá A bị tem B đè lên: có câu giải thích (không chỉ rung)', async () => {
  await build({ cols: [['_C', 'A', 'B'], ['_C', 'A'], ['_C', 'B'], ['_C', 'C']], found: [null, null, null, null] });
  await drag(grabPoint(0, 1, 0.5, 0.5), colTop(1));
  await sleep(250);
  const msg = G().toastText;
  await settle();
  return { pass: !!msg && G().S.cols[1].length === 2, detail: `toast: "${msg}"` };
});
// --- kéo qua kéo lại thật nhanh (không chờ animation)
scen('Kéo xấp sang cột trống rồi kéo ngay lại sang cột khác (không chờ animation): xấp nguyên vẹn, không lá lạc', async () => {
  await build({ cols: [['_C', 'A', 'A', 'A'], ['_C', 'A'], [], ['_C', 'B']], found: [null, null, null, null] });
  const stack = ids(0, 1);
  await drag(grabPoint(0, 3, 0.5, 0.7), colTop(2), { steps: 5, stepMs: 10 });
  await sleep(70);
  await drag(grabPoint(2, 2, 0.5, 0.7), colTop(1), { steps: 5, stepMs: 10 });
  await settle();
  const bad = strays();
  return { pass: has(colIds(1), stack) && !bad.length, detail: `cột 1: ${colIds(1).length} lá, lạc: ${bad.join(',') || 'không'}` };
});
scen('Kéo xấp qua lại giữa 2 cột 4 lần liên tiếp thật nhanh: không mất lá, không lá lạc', async () => {
  await build({ cols: [['_C', 'A', 'A'], ['_C', 'A'], [], ['_C', 'B']], found: [null, null, null, null] });
  const all = [...ids(0, 1), ...ids(1, 1)];
  let from = 0, to = 1;
  for (let r = 0; r < 4; r++) {
    const col = G().S.cols[from];
    await drag(grabPoint(from, col.length - 1, 0.5, 0.6), colTop(to), { steps: 4, stepMs: 8 });
    await sleep(90);
    [from, to] = [to, from];
  }
  await settle();
  const where = [0, 1].map(j => colIds(j).filter(id => all.includes(id)).length);
  const bad = strays();
  return { pass: (where[0] === 3 || where[1] === 3) && !bad.length, detail: `tem A ở cột 0/1: ${where.join('/')}, lạc: ${bad.join(',') || 'không'}` };
});

export async function runAll() {
  await initPool();
  const out = [];
  for (const s of SCEN) {
    try { const r = await s.fn(); out.push(`${r.pass ? 'PASS' : 'FAIL'}  ${s.name}  [${r.detail}]`); } catch (e) { out.push(`ERR   ${s.name}  ${String(e && e.stack).slice(0, 200)}`); }
  }
  return out;
}
export { initPool, build, grabPoint, drag, tap, colTop, slotCenter, settle, BASE };
