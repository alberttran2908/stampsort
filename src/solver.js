// Solver (beam search, full information) + người chơi mô phỏng (chỉ thấy lá ngửa).
import { clone, applyMove, draw, isWon, maxRunStart, checkMove, stateKey, legalMoves, JOKER, pullToFoundation, revealColumn, cardsOfTopic } from './engine.js?v=35b4998-1791578264';

/** Nước đi "có ý nghĩa" để giảm nhánh: luôn nhấc cả chồng dài nhất. */
export function candidateActions(s) {
  const acts = [];
  const srcs = [];
  if (s.waste.length) srcs.push({ from: 'waste' });
  s.cols.forEach((col, i) => {
    const idx = maxRunStart(s, i);
    if (idx < 0) return;
    srcs.push({ from: 'col', i, idx });
    // chồng dài nhất bắt đầu bằng Joker thì không vào ô được: xét thêm chồng ngay phía trên Joker
    if (col[idx].k === JOKER && idx + 1 < col.length) srcs.push({ from: 'col', i, idx: idx + 1 });
  });
  for (const src of srcs) {
    // foundation
    for (let k = 0; k < s.found.length; k++) {
      const dst = { to: 'found', i: k };
      if (!checkMove(s, src, dst)) {
        acts.push({ src, dst, pri: 3 });
        if (!s.found[k]) break;          // các hộc trống là đối xứng, chỉ thử 1
      }
    }
    // cột
    let triedEmpty = false;
    for (let j = 0; j < s.cols.length; j++) {
      const dst = { to: 'col', j };
      if (checkMove(s, src, dst)) continue;
      const col = s.cols[j];
      if (!col.length) {
        if (triedEmpty) continue;
        if (src.from === 'col' && src.idx === 0) continue;   // chuyển cả cột sang cột rỗng: vô ích
        triedEmpty = true;
        acts.push({ src, dst, pri: 1 });
      } else if (col[col.length - 1].k === JOKER) {
        if (src.from === 'col' && src.idx === 0) continue;
        acts.push({ src, dst, pri: 1 });
      } else {
        acts.push({ src, dst, pri: 2 });                     // gộp cùng topic
      }
    }
  }
  if (s.deck.length || s.waste.length) acts.push({ draw: true, pri: 0 });
  return acts;
}

function doAction(s, a) {
  if (a.draw) {
    if (!s.deck.length) draw(s);        // recycle (0 move) rồi rút
    return draw(s).ok;
  }
  return applyMove(s, a.src, a.dst).ok;
}

function h(s) {
  let down = 0;
  for (const col of s.cols) for (const c of col) if (!c.up) down++;
  return (s.total - s.delivered) + 0.6 * down + 0.5 * s.deck.length + 0.3 * s.waste.length;
}

/** Beam search theo từng lớp số move. Trả về { moves, path } hoặc null. */
export function solve(state, { width = 1500, maxMoves = 400, timeLimitMs = Infinity, noise = 0, rnd = Math.random, partial = false } = {}) {
  const t0 = Date.now();
  let layer = [{ s: clone(state), path: [] }];
  layer[0].s.moves = Infinity;
  const seen = new Map();
  for (let depth = 0; depth < maxMoves; depth++) {
    const next = [];
    for (const node of layer) {
      for (const a of candidateActions(node.s)) {
        const s2 = clone(node.s);
        if (!doAction(s2, a)) continue;
        const path = node.path.concat([a]);
        if (isWon(s2)) return { moves: s2.used, path };
        const key = stateKey(s2);
        const prev = seen.get(key);
        if (prev !== undefined && prev <= s2.used) continue;
        seen.set(key, s2.used);
        next.push({ s: s2, path, f: h(s2) - a.pri * 0.01 + (noise ? noise * rnd() : 0) });
      }
    }
    if (!next.length) return partial && layer[0] && layer[0].path.length ? { moves: null, path: layer[0].path, partial: true } : null;
    next.sort((x, y) => x.f - y.f);
    layer = next.slice(0, width);
    if (Date.now() - t0 > timeLimitMs) return partial ? { moves: null, path: layer[0].path, partial: true } : null;
  }
  return partial && layer[0] ? { moves: null, path: layer[0].path, partial: true } : null;
}

/** Gợi ý nước tiếp theo cho người chơi (nhanh, width nhỏ). */
export function hint(state, { width = 60, timeLimitMs = 400 } = {}) {
  const r = solve(state, { width, timeLimitMs });
  if (r && r.path.length) return r.path[0];
  return greedyChoice(state, Math.random, 0);
}

// ---------- lựa chọn tham lam: fallback cho hint khi solver hết giờ ----------
function greedyChoice(s, rnd, eps) {
  const acts = candidateActions(s);
  if (!acts.length) return null;
  if (rnd() < eps) return acts[Math.floor(rnd() * acts.length)];
  let best = null;
  let bestScore = -Infinity;
  for (const a of acts) {
    let sc;
    if (a.draw) sc = 1;
    else if (a.dst.to === 'found') sc = 100;
    else {
      const exposes = a.src.from === 'col' && a.src.idx > 0 && !s.cols[a.src.i][a.src.idx - 1].up;
      const empties = a.src.from === 'col' && a.src.idx === 0;
      const tgt = s.cols[a.dst.j];
      const merge = tgt.length && tgt[tgt.length - 1].k !== JOKER;
      sc = (exposes ? 40 : 0) + (empties ? 25 : 0) + (merge ? 15 : 0) + (a.src.from === 'waste' ? 10 : 0);
      if (!exposes && !empties && !merge && a.src.from !== 'waste') sc = -1;
      // topic stamp đang kẹt trên cột: đưa ra cột trống chỉ khi không có hộc trống
      if (a.src.from === 'col' && tgt.length === 0 && !exposes) sc = -1;
    }
    sc += rnd() * 5;
    if (sc > bestScore) { bestScore = sc; best = a; }
  }
  return bestScore < 0 ? acts.find(a => a.draw) || best : best;
}

/** Người chơi mô phỏng "lập kế hoạch có nhiễu": beam hẹp + nhiễu. Trả về mảng số move cần để thắng
 *  (Infinity nếu kẹt). Tỉ lệ thắng ở ngân sách B = tỉ lệ phần tử <= B. */
export function sampleMovesNeeded(state, { runs = 40, width = 6, noise = 1.2, seed = 1 } = {}) {
  let x = seed >>> 0 || 1;
  const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  const out = [];
  for (let r = 0; r < runs; r++) {
    const res = solve(state, { width, noise, rnd, maxMoves: 600 });
    out.push(res ? res.moves : Infinity);
  }
  return out.sort((a, b) => a - b);
}

/** Kẹt cứng: không còn nước có ích trên bàn (vào ô, lộ lá úp, làm trống cột) và không lá nào trong deck/waste
 *  đặt được ở đâu. Khi đó rút deck vòng vòng cũng vô ích, dù deck còn bài. */
export function isDeadlocked(s) {
  if (isWon(s)) return false;
  for (const a of candidateActions(s)) {
    if (a.draw || a.src.from === 'waste') continue;
    if (a.dst.to === 'found') return false;
    const col = s.cols[a.src.i];
    if (a.src.idx > 0 && !col[a.src.idx - 1].up) return false;        // lộ lá úp
    if (a.src.idx === 0 && s.cols[a.dst.j].length) return false;       // làm trống một cột
  }
  for (const c of s.deck.concat(s.waste)) {
    if (c.k === 'topic' && s.found.some(f => !f)) return false;
    if (c.k === 'stamp' && s.found.some(f => f && f.t === c.t)) return false;
    for (const col of s.cols) {
      const top = col[col.length - 1];
      if (!top || top.k === JOKER) return false;
      if (c.k === 'stamp' && top.t === c.t) return false;
    }
  }
  return true;
}

// ---------- người chơi "không nhìn trộm" (gần người thật hơn) ----------
/** Bản đoán: đổi ngẫu nhiên danh tính các lá ẩn (úp trên bàn + deck) giữa các vị trí ẩn. Người chơi chỉ biết lá ngửa. */
function determinize(s, rnd) {
  const d = clone(s);
  const slots = [];
  d.cols.forEach(col => col.forEach((c, j) => { if (!c.up) slots.push(c); }));
  d.deck.forEach(c => slots.push(c));
  const ids = slots.map(c => ({ id: c.id, t: c.t, k: c.k, n: c.n, art: c.art }));
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  slots.forEach((c, i) => { Object.assign(c, ids[i]); });
  return d;
}

/** Một ván của người chơi không nhìn trộm: lập kế hoạch ngắn trên bản đoán, đi nước đầu, lập lại khi lộ thông tin.
 *  Trả về { moves (Infinity nếu không thắng), deadlock (kẹt cứng), deadlockAt (số move lúc kẹt) }. */
export function playHidden(state, { width = 4, depth = 22, noise = 0.8, capMoves = 300, rnd = Math.random, mistake = 0, boosters = null } = {}) {
  const left = boosters ? { magnet: boosters.magnet || 0, stamper: boosters.stamper || 0 } : null;
  let used = 0;
  const s = clone(state);
  s.moves = Infinity;
  let plan = [];
  let guard = 0;
  const seen = new Map();
  while (!isWon(s) && s.used < capMoves && guard++ < capMoves * 3) {
    if (isDeadlocked(s)) {
      // người chơi biết dùng booster: kẹt thì Magnet (hút 2 tem ẩn vào ô có tem ẩn), rồi Stamper (lật cột nhiều lá úp nhất). Không tốn move.
      let saved = false;
      if (left && left.magnet > 0) {
        const k = s.found.findIndex(f => f && cardsOfTopic(s, f.t).hidden.length > 0);
        if (k >= 0 && pullToFoundation(s, k, 2, rnd).ok) { left.magnet--; used++; saved = true; }
      }
      if (!saved && left && left.stamper > 0) {
        const ci = s.cols.map((c, i) => [c.filter(x => !x.up).length, i]).sort((a, b) => b[0] - a[0])[0];
        if (ci && ci[0] > 0 && revealColumn(s, ci[1]).ok) { left.stamper--; used++; saved = true; }
      }
      if (saved) { plan = []; continue; }
      return { moves: Infinity, deadlock: true, deadlockAt: s.used, boostersUsed: used };
    }
    if (!plan.length) {
      const det = determinize(s, rnd);
      const r = solve(det, { width, maxMoves: depth, noise, rnd, partial: true });
      plan = r && r.path ? r.path.slice(0, 4) : [];
      if (!plan.length) { const acts = candidateActions(s); if (!acts.length) break; plan = [acts[Math.floor(rnd() * acts.length)]]; }
    }
    let a = plan.shift();
    // nước phí kiểu người chơi phổ thông: rút deck hoặc một nước hợp lệ bất kỳ (kể cả chuyển chồng vô ích)
    if (mistake && rnd() < mistake) {
      const all = legalMoves(s);
      a = (rnd() < 0.5 || !all.length) && (s.deck.length || s.waste.length) ? { draw: true } : all[Math.floor(rnd() * all.length)] || a;
      plan = [];
    }
    const before = s.deck.length + s.cols.reduce((n, c) => n + c.filter(x => !x.up).length, 0);
    let ok;
    if (a.draw) { if (!s.deck.length) draw(s); ok = draw(s).ok; }
    else ok = applyMove(s, a.src, a.dst).ok;
    if (!ok) { plan = []; continue; }
    const after = s.deck.length + s.cols.reduce((n, c) => n + c.filter(x => !x.up).length, 0);
    if (after !== before) plan = [];                 // lộ lá mới: lập kế hoạch lại
    const k = stateKey(s);
    const c = (seen.get(k) || 0) + 1;
    seen.set(k, c);
    if (c > 6) plan = [];                             // lặp vòng: bỏ kế hoạch cũ
  }
  return { moves: isWon(s) ? s.used : Infinity, deadlock: false, boostersUsed: used };
}

/** Nhiều ván không nhìn trộm: { dist (số move thắng, Infinity = không thắng), deadlocks, deadlockAt[] } */
export function sampleHidden(state, { runs = 20, seed = 1, ...opt } = {}) {
  let x = seed >>> 0 || 1;
  const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  const dist = [];
  const deadlockAt = [];
  for (let r = 0; r < runs; r++) {
    const g = playHidden(state, { ...opt, rnd });
    dist.push(g.moves);
    if (g.deadlock) deadlockAt.push(g.deadlockAt);
  }
  return { dist: dist.sort((a, b) => a - b), deadlocks: deadlockAt.length, deadlockAt };
}
