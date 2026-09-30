// Solver (beam search, full information) + người chơi mô phỏng (chỉ thấy lá ngửa).
import { clone, applyMove, draw, isWon, maxRunStart, checkMove, stateKey, JOKER } from './engine.js';

/** Nước đi "có ý nghĩa" để giảm nhánh: luôn nhấc cả chồng dài nhất. */
export function candidateActions(s) {
  const acts = [];
  const srcs = [];
  if (s.waste.length) srcs.push({ from: 'waste' });
  s.cols.forEach((col, i) => {
    const idx = maxRunStart(s, i);
    if (idx >= 0) srcs.push({ from: 'col', i, idx });
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
export function solve(state, { width = 1500, maxMoves = 400, timeLimitMs = Infinity, noise = 0, rnd = Math.random } = {}) {
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
    if (!next.length) return null;
    next.sort((x, y) => x.f - y.f);
    layer = next.slice(0, width);
    if (Date.now() - t0 > timeLimitMs) return null;
  }
  return null;
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
