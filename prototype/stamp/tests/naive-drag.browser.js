// Người chơi "ngây thơ" cho kéo thả: chạy TRONG TRÌNH DUYỆT (không phải Node).
// Cầm vào một điểm ngẫu nhiên trên phần đang lộ của một lá ngửa, kéo bằng PointerEvent thật, thả vào chỗ ngẫu nhiên
// (ô, cột, khoảng trống). Không biết luật: so kết quả với Ý ĐỊNH = "lá tôi đang cầm (và các lá phía trên nó) tới chỗ tôi thả".
//   - REJECT_LEGAL: có cách hiểu hợp luật cho cú thả mà game từ chối (người chơi thấy "kéo không được")
//   - WRONG_DEST:   game có đi, nhưng lá đang cầm không tới chỗ người chơi thả
//   - SPLIT:        lá đang cầm đi, nhưng lá phía trên nó (cùng loại, đáng lẽ đi theo) bị bỏ lại
//   - HIT_MISS:     điểm bấm nằm trên phần lộ của lá A nhưng trình duyệt trả về lá khác / không phải lá
//   - STRAY:        sau khi ổn định, có lá không nằm đúng vị trí layout hoặc lá trên cùng cột bị úp
// Dùng (trong console hoặc javascript_tool):
//   const m = await import('/tests/naive-drag.browser.js'); await m.run({ level: 3, actions: 40, seed: 1, hasty: false })
const sleep = ms => new Promise(r => setTimeout(r, ms));

function rng(seed) {
  let x = seed >>> 0 || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}

async function settle(g, maxMs = 4000) {
  const t0 = performance.now();
  await sleep(60);
  while (performance.now() - t0 < maxMs) {
    if (!g.busy) { await sleep(320); if (!g.busy) return true; }
    await sleep(50);
  }
  return false;
}

const toClient = (G, x, y) => ({ x: G.stageLeft + x * G.scale, y: G.stageTop + y * G.scale });
const toStage = (G, cx, cy) => ({ x: (cx - G.stageLeft) / G.scale, y: (cy - G.stageTop) / G.scale });

function fire(type, el, c, id = 7) {
  const ev = new PointerEvent(type, { clientX: c.x, clientY: c.y, pointerId: id, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 });
  el.dispatchEvent(ev);
}

/** Phần đang lộ (toạ độ màn hình) của từng lá ngửa có thể cầm: [{ card, loc, rect }] */
function grabbables(g) {
  const S = g.S, views = g.views();
  const out = [];
  S.cols.forEach((col, i) => col.forEach((c, idx) => {
    if (!c.up) return;
    const v = views.get(c.id); if (!v) return;
    const r = v.el.getBoundingClientRect();
    let bottom = r.bottom;
    if (idx + 1 < col.length) { const nv = views.get(col[idx + 1].id); if (nv) bottom = Math.min(bottom, nv.el.getBoundingClientRect().top); }
    if (bottom - r.top < 6) return;
    out.push({ card: c, loc: { from: 'col', i, idx }, rect: { l: r.left, t: r.top, r: r.right, b: bottom } });
  }));
  if (S.waste.length) {
    const c = S.waste[S.waste.length - 1], v = views.get(c.id);
    if (v) { const r = v.el.getBoundingClientRect(); out.push({ card: c, loc: { from: 'waste' }, rect: { l: r.left, t: r.top, r: r.right, b: r.bottom } }); }
  }
  return out;
}

/** Vùng thả "nhìn thấy được" theo stage: ô k, hoặc cột j (cả dải cột từ TAB_Y xuống) */
function dropZones(g, G) {
  const S = g.S, L = g.layout();
  const zones = [];
  G.slots.forEach((p, k) => zones.push({ dst: { to: 'found', i: k }, x: p.x, y: p.y, w: G.CW, h: G.CH }));
  G.cols.forEach((x, j) => {
    const col = S.cols[j];
    const lastY = col.length ? L.get(col[col.length - 1].id).y : G.TAB_Y;
    zones.push({ dst: { to: 'col', j }, x, y: G.TAB_Y, w: G.CW, h: lastY - G.TAB_Y + G.CH });
  });
  return zones;
}

const where = (S, id) => {
  for (let k = 0; k < S.found.length; k++) if (S.found[k] && (S.found[k].topic.id === id || S.found[k].cards.some(c => c.id === id))) return { to: 'found', i: k };
  for (let j = 0; j < S.cols.length; j++) if (S.cols[j].some(c => c.id === id)) return { to: 'col', j };
  if (S.waste.some(c => c.id === id)) return { to: 'waste' };
  return { to: 'gone' };
};
const sameDst = (a, b) => a && b && a.to === b.to && (a.to === 'found' ? a.i === b.i : a.to === 'col' ? a.j === b.j : true);

function strays(g, G) {
  const S = g.S, L = g.layout(), views = g.views(), bad = [];
  for (const [id, t] of L) {
    const v = views.get(id);
    if (!v || v.el.style.display === 'none' || getComputedStyle(v.el).visibility === 'hidden') continue;
    if (Math.abs(v.x - t.x) > 3 || Math.abs(v.y - t.y) > 3) bad.push(`lá ${id} lệch (${Math.round(v.x)},${Math.round(v.y)}) != (${Math.round(t.x)},${Math.round(t.y)})`);
  }
  S.cols.forEach((col, j) => { if (col.length && !col[col.length - 1].up) bad.push(`cột ${j}: lá trên cùng bị úp`); });
  return bad;
}

export async function run({ level = 3, actions = 40, seed = 1, hasty = false, legalBias = 0.6, restart = true, verbose = false } = {}) {
  const g = window.__game;
  const rnd = rng(seed);
  if (restart) { g.startLevel(level - 1); await settle(g); }   // không await: save trống thì startLevel chờ đóng bảng luật
  // save trống: bảng luật / quà booster hiện SAU khi chia bài -> đóng mọi bảng xuất hiện trong 9 giây đầu (nút chỉ nghe pointerup)
  for (const t0 = performance.now(); performance.now() - t0 < 9000;) {
    const b = [...document.querySelectorAll('.panel .btn')].find(x => x.offsetParent);
    if (b) b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
  }
  const board = document.getElementById('board') || document.querySelector('.board');
  const log = [], counts = {};
  const bug = (kind, msg) => { counts[kind] = (counts[kind] || 0) + 1; if (log.length < 40) log.push(`[${kind}] ${msg}`); };
  let done = 0, moved = 0;
  for (let a = 0; a < actions; a++) {
    if (!hasty) await settle(g);
    if (g.S.delivered === g.S.total || document.querySelector('.panel:not(.off)')) break;
    if (g.S.moves <= 0) break;
    const G = g.geo(), S = g.S, E = g.E;
    const items = grabbables(g);
    if (!items.length || rnd() < 0.12) { g.onDeck(); await sleep(hasty ? 90 : 0); continue; }
    const zones = dropZones(g, G);
    // chọn lá + điểm cầm
    const it = items[Math.floor(rnd() * items.length)];
    const gx = it.rect.l + 4 + rnd() * (it.rect.r - it.rect.l - 8), gy = it.rect.t + 3 + rnd() * (it.rect.b - it.rect.t - 6);
    const hitEl = document.elementFromPoint(gx, gy);
    const hitCard = hitEl && hitEl.closest('.card');
    if (!hitCard || hitCard._view.id !== it.card.id) { bug('HIT_MISS', `bấm phần lộ của ${it.card.t}#${it.card.id} (${it.loc.from} ${it.loc.i ?? ''}:${it.loc.idx ?? ''}) nhưng trúng ${hitCard ? hitCard._view.id : hitEl && hitEl.className}`); continue; }
    // các cách hiểu: nhấc lá đang cầm + mọi lá phía trên; hoặc bắt đầu thấp hơn trong xấp hợp lệ
    const interps = [];
    if (it.loc.from === 'waste') interps.push({ from: 'waste' });
    else for (let s = it.loc.idx; s >= 0; s--) { if (E.runAt(S, it.loc.i, s)) interps.push({ from: 'col', i: it.loc.i, idx: s }); else if (s < it.loc.idx) break; }
    const fullAbove = it.loc.from === 'col' ? S.cols[it.loc.i].slice(it.loc.idx).map(c => c.id) : [it.card.id];
    // chọn chỗ thả
    const legalZones = zones.filter(z => interps.some(src => !E.checkMove(S, src, z.dst)));
    let z, px, py;
    const r0 = rnd();
    if (legalZones.length && r0 < legalBias) z = legalZones[Math.floor(rnd() * legalZones.length)];
    else if (r0 < 0.93) z = zones[Math.floor(rnd() * zones.length)];
    if (z) { px = z.x + 6 + rnd() * (z.w - 12); py = z.y + 6 + rnd() * (z.h - 12); }
    else { px = 40 + rnd() * 720; py = 420 + rnd() * 100; }      // khoảng trống giữa hàng ô và bàn
    const intent = z ? z.dst : null;
    if (verbose) log.push(`grab ${it.card.t}#${it.card.id} ${JSON.stringify(it.loc)} interps=${interps.length} legalZones=${legalZones.length} drop=${JSON.stringify(intent)} @${Math.round(px)},${Math.round(py)}`);
    const legal = !!(z && interps.some(src => !E.checkMove(S, src, z.dst)));
    // kéo thật
    const before = { used: S.used, delivered: S.delivered };
    const start = { x: gx, y: gy }, end = toClient(G, px, py);
    fire('pointerdown', hitEl, start);
    const steps = 6 + Math.floor(rnd() * 6);
    for (let k = 1; k <= steps; k++) {
      const c = { x: start.x + (end.x - start.x) * k / steps, y: start.y + (end.y - start.y) * k / steps };
      fire('pointermove', window, c); fire('pointermove', board, c);
      await sleep(hasty ? 8 : 16);
    }
    fire('pointerup', board, end);
    done++;
    if (hasty) { await sleep(40 + rnd() * 120); continue; }
    await settle(g);
    const S2 = g.S;
    const didMove = S2.used !== before.used || S2.delivered !== before.delivered;
    if (didMove) moved++;
    const desc = `${it.card.t}${it.card.k === 'topic' ? '(vương miện)' : it.card.k === 'joker' ? '(joker)' : ''}#${it.card.id} từ ${it.loc.from}${it.loc.i ?? ''}:${it.loc.idx ?? ''} → ${intent ? (intent.to === 'found' ? 'ô ' + intent.i : 'cột ' + intent.j) : 'khoảng trống'}`;
    if (legal && !didMove) bug('REJECT_LEGAL', desc + ` (hợp luật với: ${interps.filter(src => !E.checkMove(S, src, z.dst)).map(s => s.from === 'waste' ? 'waste' : 'idx ' + s.idx).join(',')})`);
    if (didMove) {
      const now = where(S2, it.card.id);
      if (intent && !sameDst(now, intent) && !(intent.to === 'found' && now.to === 'gone')) bug('WRONG_DEST', desc + ` nhưng lá tới ${JSON.stringify(now)}`);
      if (!intent && !(now.to === 'gone')) bug('WRONG_DEST', desc + ` (thả vào khoảng trống mà vẫn đi) → ${JSON.stringify(now)}`);
      const left = fullAbove.filter(id => { const w = where(S2, id); return w.to === 'col' && w.j === it.loc.i; });
      if (left.length && it.loc.from === 'col' && where(S2, it.card.id).to !== 'col' || (left.length && where(S2, it.card.id).j !== it.loc.i)) bug('SPLIT', desc + `: ${left.length} lá phía trên bị bỏ lại`);
    }
    const st = strays(g, G);
    if (st.length) bug('STRAY', `sau "${desc}": ${st.slice(0, 2).join('; ')}`);
  }
  if (hasty) { await settle(g, 6000); const st = strays(g, g.geo()); if (st.length) bug('STRAY', 'sau chuỗi kéo vội: ' + st.slice(0, 3).join('; ')); }
  return { level, seed, hasty, drags: done, moved, counts, log };
}
