// QA: fuzz + unit test cho engine/solver/levels của prototype Stamp Sort.
// Chạy: node prototype/stamp/tests/fuzz.test.mjs [--games=N] [--quick]
// Spec: docs/design/prototype-10-levels.md mục 2, 3.
// Test thể hiện hành vi MONG ĐỢI theo spec. Test fail = bug (hoặc nghi vấn ghi rõ trong tên).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../src/engine.js';
import { solve, hint, candidateActions } from '../src/solver.js';
import { LEVELS } from '../src/levels.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const QUICK = !!ARGS.quick;
const GAMES_PER_LEVEL = Number(ARGS.games || (QUICK ? 20 : 120));
const RANDOM_LEVEL_GAMES = QUICK ? 150 : 1000;

// ---------------------------------------------------------------- harness
const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, msg: e && e.message ? e.message : String(e) }); }
}
class Fail extends Error {}
function ok(cond, msg) { if (!cond) throw new Fail(msg); }
function eq(a, b, msg) { if (a !== b) throw new Fail(`${msg}: mong đợi ${JSON.stringify(b)}, thực tế ${JSON.stringify(a)}`); }

function rng(seed) {
  let x = (seed >>> 0) || 0x9e3779b9;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
const pickOf = (r, arr) => arr[Math.floor(r() * arr.length)];
const deep = o => JSON.parse(JSON.stringify(o));
const snap = s => JSON.stringify(s, (k, v) => (v === Infinity ? 'INF' : v));
// snapshot "chức năng": bỏ cờ up của lá trong deck/waste (engine không đọc cờ này ở deck/waste, layout cũng không)
const fsnap = s => snap({ ...s, deck: s.deck.map(({ up, ...c }) => c), waste: s.waste.map(({ up, ...c }) => c) });

// card factory
const S = (id, t) => ({ id, t, k: 'stamp', art: 0 });
const T = (id, t, n) => ({ id, t, k: 'topic', n });
function mk(cols, { deck = [], found = 1, moves = 99, pre } = {}) {
  return E.createState({ foundations: found, moves, columns: cols, deck, preplaced: pre });
}
const allUp = s => { s.cols.forEach(c => c.forEach(x => { x.up = true; })); return s; };
const src = (i, idx) => ({ from: 'col', i, idx });
const W = { from: 'waste' };
const F = i => ({ to: 'found', i });
const C = j => ({ to: 'col', j });

// ---------------------------------------------------------------- invariants
function levelIds(level) {
  const ids = [];
  level.columns.forEach(c => c.forEach(x => ids.push(x.id)));
  level.deck.forEach(x => ids.push(x.id));
  (level.preplaced || []).forEach(st => st.forEach(x => ids.push(x.id)));
  return ids;
}

/** Trả về danh sách vi phạm (chuỗi "loại: chi tiết"). ctx: { ids, completed:Set, jokers:Set, initMoves } */
function invariants(s, ctx) {
  const v = [];
  const count = new Map();
  const bump = (id, where) => count.set(id, (count.get(id) || 0) + 1);
  let inFound = 0;
  let remaining = 0;
  s.cols.forEach((col, i) => {
    let seenUp = false;
    col.forEach((c, j) => {
      if (c.k === E.JOKER) { if (!ctx.jokers.has(c.id)) v.push(`joker_la: id ${c.id}`); if (c.up !== true) v.push('joker_up'); seenUp = true; return; }
      bump(c.id); remaining++;
      if (c.up === true) seenUp = true;
      else if (seenUp) v.push(`up_order: cột ${i} lá úp ${c.id} nằm trên lá ngửa`);
    });
    if (col.length && col[col.length - 1].up !== true) v.push(`top_not_up: cột ${i} đỉnh ${col[col.length - 1].id} up=${col[col.length - 1].up}`);
  });
  s.deck.forEach(c => { bump(c.id); remaining++; if (c.k === E.JOKER) v.push('joker_in_deck'); });
  s.waste.forEach(c => { bump(c.id); remaining++; if (c.k === E.JOKER) v.push('joker_in_waste'); });
  s.found.forEach((f, k) => {
    if (!f) return;
    bump(f.topic.id); inFound++; remaining++;
    if (f.topic.k !== 'topic' || f.topic.t !== f.t) v.push(`found_topic: ô ${k}`);
    if (f.n !== f.topic.n) v.push(`found_n: ô ${k}`);
    if (f.cards.length >= f.n) v.push(`found_overflow: ô ${k} ${f.cards.length}/${f.n} nhưng chưa đóng`);
    f.cards.forEach(c => { bump(c.id); inFound++; remaining++; if (c.t !== f.t || c.k !== 'stamp') v.push(`found_wrong: ô ${k} (${f.t}) chứa ${c.id} ${c.t}/${c.k}`); });
  });
  ctx.completed.forEach(id => bump(id));
  for (const id of ctx.ids) { const n = count.get(id) || 0; if (n !== 1) v.push(`conservation: id ${id} xuất hiện ${n} lần`); }
  for (const id of count.keys()) if (!ctx.idSet.has(id)) v.push(`conservation: id lạ ${id}`);
  if (s.delivered !== inFound + ctx.completed.size + ctx.preCompleted) v.push(`delivered: ${s.delivered} != thực ${inFound + ctx.completed.size}`);
  if (s.total !== ctx.ids.length) v.push(`total: ${s.total} != ${ctx.ids.length}`);
  // jokers không nằm ngoài bàn
  if (E.isWon(s) !== (remaining === 0)) v.push(`isWon: isWon=${E.isWon(s)} nhưng còn ${remaining} lá`);
  if (E.isLost(s) !== (!E.isWon(s) && s.moves <= 0)) v.push('isLost');
  if (Number.isFinite(ctx.initMoves) && s.moves + s.used !== ctx.initMoves) v.push(`moves_used: moves+used=${s.moves + s.used} != ${ctx.initMoves}`);
  return v;
}

function allSources(s) {
  const out = [W];
  s.cols.forEach((col, i) => { for (let idx = 0; idx < col.length; idx++) out.push(src(i, idx)); });
  return out;
}
function allDsts(s) {
  const out = [];
  for (let k = 0; k < s.found.length; k++) out.push(F(k));
  for (let j = 0; j < s.cols.length; j++) out.push(C(j));
  return out;
}
const mkey = m => JSON.stringify([m.src, m.dst]);

// ---------------------------------------------------------------- fuzz
const FAILS = new Map(); // type -> { count, first }
let MODE = '';
function report(type, detail, where) {
  type = MODE + type;
  const e = FAILS.get(type);
  if (e) e.count++;
  else FAILS.set(type, { count: 1, first: `${where} :: ${detail}` });
}

function randomLevel(r) {
  const nTopics = 1 + Math.floor(r() * 3);
  const cards = [];
  let id = 0;
  const topics = [];
  for (let t = 0; t < nTopics; t++) {
    const name = 'R' + t;
    const n = 1 + Math.floor(r() * 4);
    topics.push(T(id++, name, n));
    for (let i = 0; i < n; i++) cards.push(S(id++, name));
  }
  const pre = [];
  const foundations = 1 + Math.floor(r() * 3);
  const pool = cards.slice();
  for (const tp of topics) {
    if (pre.length < foundations - 0 && r() < 0.2) {
      const st = [tp];
      // preplace có thể kèm vài stamp nhưng không đủ n
      const own = pool.filter(c => c.t === tp.t);
      const k = Math.floor(r() * Math.max(0, tp.n - 1) + 0.0);
      for (let i = 0; i < Math.min(k, own.length); i++) { st.push(own[i]); pool.splice(pool.indexOf(own[i]), 1); }
      pre.push(st);
    } else pool.push(tp);
  }
  // xáo
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const nCols = 1 + Math.floor(r() * 4);
  const columns = Array.from({ length: nCols }, () => []);
  const deck = [];
  for (const c of pool) {
    if (r() < 0.4) deck.push(c); else columns[Math.floor(r() * nCols)].push(c);
  }
  return { id: 'rand', foundations, moves: r() < 0.5 ? null : 5 + Math.floor(r() * 40), columns, deck, preplaced: pre };
}

function doRandomAction(s, r, ctx, opts) {
  // trả về { kind, res, expectDelta } ; mutate s
  const x = r();
  const openSlots = s.found.map((f, k) => (f ? k : -1)).filter(k => k >= 0);
  if (x < 0.05 && openSlots.length && opts.boosters) {
    const k = pickOf(r, openSlots);
    const count = r() < 0.5 ? 1 : 2;
    return { kind: 'pull', k, count, res: E.pullToFoundation(s, k, count, r), expectDelta: 0 };
  }
  if (x < 0.065 && opts.boosters && ctx.jokers.size < 3) {
    const j = Math.floor(r() * s.cols.length);
    const id = 'J' + ctx.jokers.size;
    ctx.jokers.add(id);
    return { kind: 'joker', res: E.placeJoker(s, j, id), expectDelta: 0 };
  }
  if (x < 0.075 && opts.boosters) return { kind: 'slot', res: E.addExtraSlot(s), expectDelta: 0 };
  if (x < 0.25) {
    const sr = pickOf(r, allSources(s));
    const ds = r() < 0.05 ? (r() < 0.5 ? F(s.found.length + 1) : C(s.cols.length + 2)) : pickOf(r, allDsts(s));
    return { kind: 'rawmove', src: sr, dst: ds, res: E.applyMove(s, sr, ds), expectDelta: 1 };
  }
  if (x < 0.42) {
    const recycle = !s.deck.length;
    return { kind: recycle ? 'recycle' : 'draw', res: E.draw(s), expectDelta: recycle ? 0 : 1 };
  }
  if (x < 0.6) {
    const srcs = allSources(s).filter(sr => E.sourceCards(s, sr));
    if (srcs.length) {
      const sr = pickOf(r, srcs);
      const d = E.bestTargetFor(s, sr);
      if (d) return { kind: 'tap', src: sr, dst: d, res: E.applyMove(s, sr, d), expectDelta: 1 };
    }
  }
  const lm = E.legalMoves(s);
  if (lm.length) {
    const m = pickOf(r, lm);
    return { kind: 'legal', src: m.src, dst: m.dst, res: E.applyMove(s, m.src, m.dst), expectDelta: 1 };
  }
  const recycle = !s.deck.length;
  return { kind: recycle ? 'recycle' : 'draw', res: E.draw(s), expectDelta: recycle ? 0 : 1 };
}

function myHiddenVisible(s, t) {
  const hidden = [], visible = [];
  s.cols.forEach(col => col.forEach(c => { if (c.t === t && c.k === 'stamp') (c.up ? visible : hidden).push(c.id); }));
  s.deck.forEach(c => { if (c.t === t && c.k === 'stamp') hidden.push(c.id); });
  s.waste.forEach(c => { if (c.t === t && c.k === 'stamp') visible.push(c.id); });
  return { hidden, visible };
}

function perStepChecks(s, ctx, where, r) {
  // 1) legalMoves vs brute force
  const brute = new Set();
  for (const sr of allSources(s)) for (const d of allDsts(s)) if (E.checkMove(s, sr, d) === null) brute.add(mkey({ src: sr, dst: d }));
  const lm = E.legalMoves(s);
  const lmSet = new Set(lm.map(mkey));
  for (const k of brute) if (!lmSet.has(k)) report('legalMoves_missing', `thiếu nước ${k}`, where);
  for (const k of lmSet) if (!brute.has(k)) report('legalMoves_extra', `nước thừa ${k}`, where);
  if (lmSet.size !== lm.length) report('legalMoves_dup', 'trùng nước', where);
  // 2) mỗi nước legal apply ok, và checkMove null <=> applyMove ok trên mọi cặp
  for (const sr of allSources(s)) for (const d of allDsts(s)) {
    const c = E.clone(s);
    const why = E.checkMove(c, sr, d);
    const res = E.applyMove(c, sr, d);
    if ((why === null) !== res.ok) report('check_vs_apply', `checkMove=${why} apply.ok=${res.ok} ${mkey({ src: sr, dst: d })}`, where);
  }
  // 3) bestTargetFor
  for (const sr of allSources(s)) {
    const run = E.sourceCards(s, sr);
    const best = E.bestTargetFor(s, sr);
    if (!run) { if (best) report('bestTarget_on_bad_source', mkey({ src: sr, dst: best }), where); continue; }
    const legalD = allDsts(s).filter(d => E.checkMove(s, sr, d) === null);
    if (best) {
      const why = E.checkMove(s, sr, best);
      if (why !== null) report('bestTarget_illegal', `${mkey({ src: sr, dst: best })} checkMove=${why} moves=${s.moves}`, where);
      if (legalD.some(d => d.to === 'found') && best.to !== 'found') report('bestTarget_priority', `có đích ô nhưng chọn ${JSON.stringify(best)}`, where);
    } else {
      const fromBottom = sr.from === 'col' && sr.idx === 0;
      const useful = legalD.filter(d => !(d.to === 'col' && !s.cols[d.j].length && fromBottom));
      if (useful.length) report('bestTarget_null_but_legal', `${JSON.stringify(sr)} có ${JSON.stringify(useful)}`, where);
    }
  }
  // 4) clone độc lập
  const before = fsnap(s);
  const c = E.clone(s);
  const cctx = { ...ctx, jokers: new Set(ctx.jokers) };
  for (let i = 0; i < 3; i++) doRandomAction(c, r, cctx, { boosters: true });
  const open = c.found.map((f, k) => (f ? k : -1)).filter(k => k >= 0);
  if (open.length) E.pullToFoundation(c, open[0], 2, r);
  if (fsnap(s) !== before) report('clone_shared', 'thao tác trên clone làm đổi state gốc', where);
}

function playGame(level, seed, mode, opts) {
  const r = rng(seed);
  const L = deep(level);
  if (opts.infinite) L.moves = null;
  if (mode === 'masked') L.deck.forEach(c => { c.up = true; }); // né bug waste->cột để soi bug khác
  MODE = mode + '/';
  const s = E.createState(L);
  const ids = levelIds(L);
  const ctx = { ids, idSet: new Set(ids), completed: new Set(), jokers: new Set(), initMoves: s.moves, preCompleted: 0 };
  const where0 = `level=${level.id} seed=${seed} mode=${mode}${opts.infinite ? ' inf' : ''}`;
  let v = invariants(s, ctx);
  v.forEach(x => report('inv_' + x.split(':')[0], x, where0 + ' step=0'));
  const maxSteps = opts.maxSteps || 300;
  let stuck = 0;
  for (let step = 1; step <= maxSteps; step++) {
    const where = `${where0} step=${step}`;
    if (step % opts.deepEvery === 0) perStepChecks(s, ctx, where, r);
    const m0 = s.moves, u0 = s.used;
    const pre = snap(s);
    let pullInfo = null;
    // chuẩn bị kiểm tra pull: tính trước
    const act = (() => {
      const peek = r();
      if (peek < 0.06 && opts.boosters) {
        const open = s.found.map((f, k) => (f ? k : -1)).filter(k => k >= 0);
        if (open.length) {
          const k = pickOf(r, open); const count = r() < 0.5 ? 1 : 2; const f = s.found[k];
          const hv = myHiddenVisible(s, f.t);
          pullInfo = { k, count, t: f.t, n: f.n, had: f.cards.length, hv };
          return { kind: 'pull', res: E.pullToFoundation(s, k, count, r), expectDelta: 0 };
        }
      }
      return doRandomAction(s, r, ctx, opts);
    })();
    const res = act.res;
    if (res.ok) {
      for (const ev of res.events || []) if (ev.type === 'complete') ev.cards.forEach(id => ctx.completed.add(id));
      const exp = act.expectDelta;
      if (Number.isFinite(m0) && s.moves !== m0 - exp) report('moves_delta_' + act.kind, `moves ${m0} -> ${s.moves}, mong đợi -${exp}`, where);
      if (s.used !== u0 + exp) report('used_delta_' + act.kind, `used ${u0} -> ${s.used}`, where);
      if (act.kind === 'rawmove' && E.checkMove !== null) { /* đã kiểm tra qua apply */ }
    } else {
      if (snap(s) !== pre) report('failed_action_mutates_' + act.kind, `res=${JSON.stringify(res)}`, where);
    }
    if (pullInfo) {
      const { hidden, visible } = pullInfo.hv;
      const want = Math.min(pullInfo.count, pullInfo.n - pullInfo.had);
      const expN = Math.min(want, hidden.length + visible.length);
      if (!res.ok) { if (expN > 0) report('pull_refused', `mong đợi kéo ${expN}`, where); }
      else {
        const ev = res.events.find(e => e.type === 'pull');
        const got = ev.cards;
        if (got.length !== expN) report('pull_count', `kéo ${got.length}, mong đợi ${expN}`, where);
        const hs = new Set(hidden), vs = new Set(visible);
        const fromHidden = got.filter(id => hs.has(id)).length;
        if (fromHidden !== Math.min(expN, hidden.length)) report('pull_not_hidden_first', `lấy ${fromHidden} lá ẩn, có ${hidden.length}`, where);
        if (got.some(id => !hs.has(id) && !vs.has(id))) report('pull_wrong_card', JSON.stringify(got), where);
        const completes = pullInfo.had + got.length >= pullInfo.n;
        const hasComplete = res.events.some(e => e.type === 'complete');
        if (completes !== hasComplete || (completes && s.found[pullInfo.k] !== null)) report('pull_complete', `had=${pullInfo.had} +${got.length} n=${pullInfo.n}`, where);
      }
    }
    v = invariants(s, ctx);
    v.forEach(x => report('inv_' + x.split(':')[0], x + ` (sau ${act.kind}${act.src ? ' ' + mkey(act) : ''})`, where));
    if (v.length && opts.stopOnInv) break;
    if (E.isWon(s)) {
      // sau khi thắng: không còn nước, deck rỗng
      if (E.legalMoves(s).length) report('won_has_moves', '', where);
      break;
    }
    if (s.moves <= 0) {
      // thua: mọi nước đều bị chặn, nhưng recycle (0 move) vẫn phải được
      if (E.legalMoves(s).length) report('lost_has_legal', '', where);
      if (s.deck.length && E.draw(E.clone(s)).ok) report('lost_can_draw', '', where);
      break;
    }
    if (!res.ok) { if (++stuck > 30) break; } else stuck = 0;
  }
}

function runFuzz() {
  const t0 = Date.now();
  let games = 0;
  for (const level of LEVELS) {
    for (let g = 0; g < GAMES_PER_LEVEL; g++) {
      for (const mode of ['raw', 'masked']) {
        playGame(level, 1000 * level.id + g, mode, { boosters: g % 3 !== 0, infinite: g % 2 === 1, deepEvery: 4, maxSteps: 300 });
        games++;
      }
    }
  }
  const r = rng(424242);
  for (let g = 0; g < RANDOM_LEVEL_GAMES; g++) {
    const seed = Math.floor(r() * 1e9);
    const lv = randomLevel(rng(seed));
    lv.id = 'rand#' + seed;
    for (const mode of ['raw', 'masked']) { playGame(lv, seed, mode, { boosters: true, deepEvery: 1, maxSteps: 150 }); games++; }
  }
  return { games, ms: Date.now() - t0 };
}

// ================================================================ UNIT TESTS
// ---- luật cơ bản (mục 2)
test('luật: chỉ lá topic mở được ô trống', () => {
  const s = mk([[S(1, 'A')], [T(2, 'A', 1)]]);
  eq(E.checkMove(s, src(0, 0), F(0)), 'need_topic', 'stamp vào ô trống');
  eq(E.checkMove(s, src(1, 0), F(0)), null, 'topic vào ô trống');
});
test('luật: stamp lên lá cùng topic (kể cả lá topic) trên bàn; topic không lên lá thường', () => {
  const s = mk([[S(1, 'A')], [T(2, 'A', 2)], [S(3, 'A')], [S(4, 'B')]]);
  eq(E.checkMove(s, src(0, 0), C(1)), null, 'stamp A lên topic A');
  eq(E.checkMove(s, src(1, 0), C(2)), 'topic_on_card', 'topic A lên stamp A');
  eq(E.checkMove(s, src(3, 0), C(0)), 'wrong_topic', 'B lên A');
});
test('luật: chồng có lá topic ở giữa không nhấc được; topic ở đáy chồng thì được', () => {
  const s = allUp(mk([[S(1, 'A'), T(2, 'A', 3), S(3, 'A')], [T(4, 'B', 1), S(5, 'B')]]));
  eq(E.runAt(s, 0, 0), null, 'run [s,topic,s]');
  ok(E.runAt(s, 0, 1), 'run [topic,s] phải nhấc được');
  eq(E.maxRunStart(s, 0), 1, 'maxRunStart');
  eq(E.maxRunStart(s, 1), 0, 'maxRunStart topic đáy');
});
test('luật: chồng [topic, stamp..] vào ô trống = 1 move, đủ n thì đóng ngay', () => {
  const s = allUp(mk([[T(1, 'A', 2), S(2, 'A'), S(3, 'A')], [S(9, 'Z')]], { found: 1 }));
  const res = E.applyMove(s, src(0, 0), F(0));
  ok(res.ok, 'apply'); eq(s.moves, 98, 'moves'); eq(s.delivered, 3, 'delivered');
  ok(res.events.some(e => e.type === 'complete'), 'phải có complete'); eq(s.found[0], null, 'ô trống lại');
});
test('luật: ô không nhận stamp vượt n (dữ liệu nhân tạo)', () => {
  const s = allUp(mk([[S(2, 'A'), S(3, 'A')]], { pre: [[T(1, 'A', 2), S(4, 'A')]] }));
  ok(E.checkMove(s, src(0, 0), F(0)) !== null, 'chồng 2 vào ô 1/2 phải bị từ chối');
  eq(E.checkMove(s, src(0, 1), F(0)), null, '1 lá vào ô 1/2 được');
});
test('luật: lá lộ ra tự lật, 0 move', () => {
  const s = mk([[S(1, 'B'), S(2, 'A')], [S(3, 'A')]]);
  E.applyMove(s, src(0, 1), C(1));
  eq(s.cols[0][0].up, true, 'lá lộ ra phải ngửa'); eq(s.moves, 98, 'chỉ tốn 1 move');
});
test('BUG? lá từ waste đặt lên cột phải ngửa và nhấc tiếp được', () => {
  const s = mk([[S(1, 'A')], []], { deck: [S(2, 'A')] });
  E.draw(s);
  ok(E.applyMove(s, W, C(0)).ok, 'waste -> cột');
  eq(s.cols[0][1].up, true, 'lá vừa đặt (đỉnh cột) up');
  ok(E.runAt(s, 0, 1), 'phải nhấc được lá đỉnh');
  ok(E.legalMoves(s).length > 0, 'phải có nước (VD chuyển chồng sang cột trống)');
});
test('BUG? lá từ waste vào cột trống cũng phải ngửa', () => {
  const s = mk([[S(1, 'A')], []], { deck: [T(2, 'B', 1)] });
  E.draw(s); E.applyMove(s, W, C(1));
  eq(s.cols[1][0].up, true, 'topic trên cột trống phải up');
  ok(E.bestTargetFor(s, src(1, 0)), 'chạm topic trên cột phải đi vào ô trống');
});
test('waste rỗng: nguồn waste không hợp lệ', () => {
  const s = mk([[S(1, 'A')]]);
  eq(E.checkMove(s, W, C(0)), 'bad_source', 'checkMove'); eq(E.bestTargetFor(s, W), null, 'bestTargetFor');
});
test('deck rỗng + waste rỗng: draw trả empty, không đổi state', () => {
  const s = mk([[S(1, 'A')]]);
  const b = snap(s); const r = E.draw(s);
  eq(r.ok, false, 'ok'); eq(r.why, 'empty', 'why'); eq(snap(s), b, 'state');
});
test('hết moves: mọi nước bị chặn, recycle vẫn được (0 move), draw bị chặn', () => {
  const s = mk([[S(1, 'A')], [S(2, 'A')]], { deck: [S(3, 'B'), S(4, 'B')], moves: 2 });
  E.draw(s); E.draw(s); eq(s.moves, 0, 'moves');
  ok(E.isLost(s), 'isLost');
  eq(E.checkMove(s, src(0, 0), C(1)), 'no_moves', 'checkMove');
  eq(E.legalMoves(s).length, 0, 'legalMoves');
  ok(E.draw(s).ok, 'recycle khi moves=0'); eq(s.waste.length, 0, 'waste');
  eq(E.draw(s).why, 'no_moves', 'draw khi moves=0');
});
test('BUG? bestTargetFor khi moves=0 không được trả đích (topic -> ô trống bỏ qua checkMove)', () => {
  const s = mk([[T(1, 'A', 1)], [S(2, 'A')]], { moves: 0 });
  const d = E.bestTargetFor(s, src(0, 0));
  ok(d === null || E.checkMove(s, src(0, 0), d) === null, `trả ${JSON.stringify(d)} trong khi checkMove=${d && E.checkMove(s, src(0, 0), d)}`);
});
test('thắng ở nước cuối khi moves về 0 là thắng, không thua', () => {
  const s = mk([[T(1, 'A', 1)], [S(2, 'A')]], { moves: 2 });
  E.applyMove(s, src(0, 0), F(0)); E.applyMove(s, src(1, 0), F(0));
  ok(E.isWon(s), 'isWon'); ok(!E.isLost(s), 'isLost');
});

test('thấp: checkMove/bestTargetFor với nguồn cột không tồn tại trả bad_source thay vì ném lỗi', () => {
  const s = mk([[S(1, 'A')]]);
  let why, best;
  try { why = E.checkMove(s, src(5, 0), C(0)); } catch (e) { why = 'THROW ' + e.message; }
  eq(why, 'bad_source', 'checkMove');
  try { best = E.bestTargetFor(s, src(5, 0)); } catch (e) { best = 'THROW ' + e.message; }
  eq(best, null, 'bestTargetFor');
});

// ---- recycle
test('recycle nhiều vòng: thứ tự rút giữ nguyên, recycle 0 move', () => {
  const deck = [S(1, 'A'), S(2, 'B'), S(3, 'C'), S(4, 'D'), S(5, 'E')];
  const s = mk([[S(9, 'Z')]], { deck, moves: 100 });
  for (let round = 0; round < 4; round++) {
    const order = [];
    for (let i = 0; i < 5; i++) { const r = E.draw(s); ok(r.ok, 'draw'); order.push(r.events[0].id); }
    eq(order.join(), '1,2,3,4,5', `vòng ${round} thứ tự`);
    const m = s.moves; const r = E.draw(s);
    eq(r.events[0].type, 'recycle', 'recycle'); eq(s.moves, m, 'recycle 0 move'); eq(s.deck.length, 5, 'deck đầy');
  }
  eq(s.used, 20, 'used');
});
test('recycle sau khi lấy bớt lá giữa waste (pull) vẫn đúng thứ tự', () => {
  const s = mk([[S(9, 'Z')]], { deck: [S(1, 'A'), S(2, 'B'), S(3, 'A'), S(4, 'C')], pre: [[T(10, 'A', 3), S(11, 'A')]] });
  for (let i = 0; i < 4; i++) E.draw(s);
  E.pullToFoundation(s, 0, 1, () => 0);
  E.draw(s); // recycle
  const order = []; while (s.deck.length) order.push(E.draw(s).events[0].id);
  eq(order.join(), '2,3,4', 'thứ tự sau recycle');
});

// ---- pullToFoundation
test('pull: ưu tiên lá ẩn (úp + deck), 0 move', () => {
  const s = mk([[S(1, 'A'), S(2, 'B')], [S(3, 'A')]], { deck: [S(4, 'A'), S(5, 'A')], pre: [[T(10, 'A', 5)]] });
  E.draw(s); // waste = 4 (A, visible)
  const m = s.moves;
  const r = E.pullToFoundation(s, 0, 2, rng(1));
  ok(r.ok, 'ok'); eq(s.moves, m, '0 move');
  const got = r.events.find(e => e.type === 'pull').cards.slice().sort();
  eq(got.join(), '1,5', 'lấy 2 lá ẩn (1 úp ở cột, 5 trong deck)');
  ok(r.events.find(e => e.type === 'pull').wasUp.every(x => x === false), 'wasUp false');
});
test('pull: hết lá ẩn thì lấy lá ngửa; không vượt n; đóng ô đúng lúc', () => {
  const s = mk([[S(1, 'B'), S(2, 'A')]], { pre: [[T(10, 'A', 2), S(11, 'A')]] });
  const r = E.pullToFoundation(s, 0, 2, rng(2));
  ok(r.ok, 'ok'); eq(r.events.find(e => e.type === 'pull').cards.length, 1, 'chỉ kéo 1 (need=1)');
  ok(r.events.some(e => e.type === 'complete'), 'complete'); eq(s.found[0], null, 'ô trống lại');
  eq(s.cols[0][0].up, true, 'lá B lộ ra phải lật'); eq(s.delivered, 3, 'delivered');
});
test('pull: chưa đủ n thì không đóng', () => {
  const s = mk([[S(1, 'A'), S(2, 'A'), S(3, 'A')]], { pre: [[T(10, 'A', 3)]] });
  const r = E.pullToFoundation(s, 0, 2, rng(3));
  ok(!r.events.some(e => e.type === 'complete'), 'không complete'); eq(s.found[0].cards.length, 2, '2/3');
  eq(s.cols[0][0].up, true, 'đỉnh còn lại ngửa');
});
test('pull: không lấy lá topic, không lấy Joker; ô trống -> no_pile', () => {
  const s = mk([[T(5, 'A', 9)], [S(6, 'B')]], { deck: [T(7, 'A', 9)], pre: [[T(10, 'A', 2)]] });
  E.placeJoker(s, 1, 'J');
  const r = E.pullToFoundation(s, 0, 2);
  eq(r.ok, false, 'ok'); eq(r.why, 'none_left', 'why');
  eq(E.pullToFoundation(s, 3, 1).why, 'no_pile', 'ô không tồn tại');
  const s2 = mk([[S(1, 'A')]], { found: 2 });
  eq(E.pullToFoundation(s2, 0, 1).why, 'no_pile', 'ô trống');
});
test('pull: topic chỉ còn lá ngửa (waste giữa + đỉnh cột dưới Joker)', () => {
  const s = mk([[S(1, 'B'), S(2, 'A')], [S(3, 'C')]], { deck: [S(4, 'A'), S(5, 'D')], pre: [[T(10, 'A', 3)]] });
  E.draw(s); E.draw(s); // waste: 4(A), 5(D)
  E.placeJoker(s, 0, 'J'); // A(2) nằm dưới Joker
  const r = E.pullToFoundation(s, 0, 2, rng(4));
  ok(r.ok, 'ok');
  eq(r.events.find(e => e.type === 'pull').cards.slice().sort().join(), '2,4', 'lấy 2 lá ngửa');
  eq(s.waste.map(c => c.id).join(), '5', 'waste còn 5');
  eq(s.cols[0].map(c => c.id).join(), '1,J', 'cột 0 còn [1, J]');
  ok(invariants(s, { ids: [1, 2, 3, 4, 5, 10], idSet: new Set([1, 2, 3, 4, 5, 10]), completed: new Set(), jokers: new Set(['J']), initMoves: s.moves + s.used, preCompleted: 0 })
    .filter(x => !x.startsWith('up_order')).length === 0, 'invariant');
});
test('pull: kéo lá ngửa đỉnh cột làm lá úp dưới lật lên', () => {
  const s = mk([[S(1, 'B'), S(2, 'C'), S(3, 'A')]], { pre: [[T(10, 'A', 3)]] });
  const r = E.pullToFoundation(s, 0, 1, rng(5));
  eq(s.cols[0][1].up, true, 'lá 2 lật'); ok(r.events.some(e => e.type === 'flip' && e.id === 2), 'event flip');
  eq(s.cols[0][0].up, false, 'lá 1 vẫn úp');
});
test('nghi vấn (thấp): pull/draw không làm đổi object trong snapshot clone (undo)', () => {
  const s = mk([[S(9, 'Z')]], { deck: [S(1, 'A')], pre: [[T(10, 'A', 3)]] });
  const backup = E.clone(s); const before = snap(backup);
  E.pullToFoundation(s, 0, 1);
  eq(snap(backup), before, 'snapshot undo bị đổi');
});

// ---- Joker
test('joker: 0 move, nhận mọi chồng/topic, chồng trên Joker vẫn theo luật cùng topic', () => {
  const s = allUp(mk([[S(1, 'A')], [T(2, 'B', 1)], [S(3, 'C'), S(4, 'C')], [S(5, 'D')]]));
  const m = s.moves;
  ok(E.placeJoker(s, 0, 'J1').ok, 'place'); eq(s.moves, m, '0 move');
  eq(E.checkMove(s, src(1, 0), C(0)), null, 'topic lên Joker');
  eq(E.checkMove(s, src(2, 0), C(0)), null, 'chồng C lên Joker');
  E.applyMove(s, src(2, 0), C(0));
  eq(E.checkMove(s, src(3, 0), C(0)), 'wrong_topic', 'D lên C (trên Joker)');
  // Luật (video L9): Joker nhấc được cùng chồng trên nó, đặt lên bất kỳ cột nào, 1 move, không vào ô
  ok(E.runAt(s, 0, 1) && E.runAt(s, 0, 1)[0].k === 'joker', 'nhấc Joker kèm chồng');
  eq(E.maxRunStart(s, 0), 1, 'chồng dài nhất bắt đầu từ Joker');
  ok(E.runAt(s, 0, 2), 'chồng ngay trên Joker vẫn nhấc riêng được');
  eq(E.checkMove(s, src(0, 1), F(0)), 'bad_target', 'Joker không vào ô');
  const mv = s.moves; ok(E.applyMove(s, src(0, 1), C(3)).ok, 'Joker lên lá D'); eq(s.moves, mv - 1, 'di chuyển Joker 1 move');
  eq(E.placeJoker(s, 9, 'X').ok, false, 'cột không tồn tại');
});
test('joker: nhiều Joker (khác cột và chồng lên nhau), thắng khi còn Joker', () => {
  const s = mk([[T(1, 'A', 1)], [S(2, 'A')]]);
  E.placeJoker(s, 0, 'J1'); E.placeJoker(s, 1, 'J2'); E.placeJoker(s, 1, 'J3');
  eq(s.jokerCount, 3, 'jokerCount');
  ok(!E.isWon(s), 'chưa thắng');
  // lá dưới Joker lấy ra được bằng cách dời Joker
  eq(E.maxRunStart(s, 0), 1, 'cột 0: chồng bắt đầu từ Joker');
  ok(E.applyMove(s, src(0, 1), C(1)).ok, 'dời Joker sang cột 1 (lên Joker khác)');
  ok(E.runAt(s, 0, 0), 'topic A lộ ra, nhấc được');
  const s2 = mk([[T(1, 'A', 1)], [S(2, 'A')], []]);
  E.applyMove(s2, src(0, 0), F(0)); E.placeJoker(s2, 2, 'J'); E.applyMove(s2, src(1, 0), C(2));
  E.applyMove(s2, src(2, 1), F(0));
  ok(E.isWon(s2), 'thắng dù Joker còn trên bàn');
});
test('BUG? Joker đặt lên cột có lá không được chôn vĩnh viễn các lá bên dưới (level phải còn giải được)', () => {
  // Ván nhỏ: cột 0 [A úp, topic A ngửa]; đặt Joker lên cột 0 -> topic A và stamp A bị kẹt dưới Joker.
  const s = mk([[S(1, 'A'), T(2, 'A', 1)], [S(3, 'B')]], { deck: [T(4, 'B', 1)] });
  E.placeJoker(s, 0, 'J');
  ok(solve(s, { width: 200 }) !== null, 'ván không còn giải được sau khi đặt Joker');
});

// ---- extra slot
test('ô phụ: thêm 1 lần, mở bằng topic, hoàn thành rồi trống lại, dùng lại được', () => {
  const s = mk([[T(1, 'A', 1)], [S(2, 'A')], [T(3, 'B', 1), S(4, 'B')]], { found: 1 });
  allUp(s);
  E.applyMove(s, src(2, 0), F(0)); // ô 0 = B, đủ 1 -> đóng luôn
  eq(s.found[0], null, 'ô 0 đóng');
  ok(E.addExtraSlot(s).ok, 'add'); eq(E.addExtraSlot(s).ok, false, 'add lần 2'); eq(s.found.length, 2, 'found.length');
  E.applyMove(s, src(0, 0), F(1)); eq(s.found[1].t, 'A', 'ô phụ mở A');
  E.applyMove(s, src(1, 0), F(1)); eq(s.found[1], null, 'ô phụ đóng'); ok(E.isWon(s), 'won');
  const c = E.clone(s); eq(c.extraSlot, true, 'clone giữ extraSlot'); eq(c.found.length, 2, 'clone found.length');
});

// ---- clone & level immutability
test('nghi vấn (thấp): clone độc lập tuyệt đối, kể cả cờ up của lá deck/waste', () => {
  const s = mk([[S(1, 'A'), S(2, 'A')]], { deck: [S(3, 'A'), S(4, 'B')], pre: [[T(10, 'A', 4)]] });
  E.draw(s);
  const b = snap(s); const c = E.clone(s);
  E.applyMove(c, src(0, 1), F(0)); E.draw(c); E.pullToFoundation(c, 0, 2); E.addExtraSlot(c); E.placeJoker(c, 0, 'J');
  c.found.forEach(f => f && f.cards.push({ id: 99 }));
  eq(snap(s), b, 'state gốc bị đổi');
});
test('BUG? chơi một ván không được sửa object LEVELS (chơi lại level phải như lần đầu)', () => {
  const L = deep(LEVELS[0]);
  const before = JSON.stringify(L);
  const s = E.createState(L);
  // rút Fruit topic (id 10) vào ô, rút 15 (Fruit) rồi đặt lên cột 0 (đỉnh là Cat 1?) -> dùng cột có Fruit
  E.applyMove(s, src(1, 2), F(1)); // Cat topic
  E.applyMove(s, src(0, 1), F(1)); // Cat 1 -> lộ Fruit 11
  E.draw(s); E.applyMove(s, W, F(2)); // Fruit topic
  E.draw(s); E.applyMove(s, W, C(0)); // Fruit 15 lên Fruit 11
  E.draw(s); E.draw(s); E.draw(s); E.draw(s); E.draw(s); // hết deck
  E.draw(s); // recycle
  E.pullToFoundation(s, 1, 2);       // Cat từ deck
  E.applyMove(s, src(0, 1), C(2));   // nhấc Fruit 15 (nếu được) -> lật
  eq(JSON.stringify(L), before, 'LEVELS bị mutate');
});
test('createState hai lần từ cùng level cho state giống hệt', () => {
  const a = snap(E.createState(LEVELS[3])); const b = snap(E.createState(LEVELS[3]));
  eq(a, b, 'state');
});

// ---- stateKey
test('stateKey phân biệt ô phụ / joker (nghi vấn, chỉ ảnh hưởng solver nếu dùng booster)', () => {
  const s = mk([[S(1, 'A')]], { found: 1 });
  const k1 = E.stateKey(s); E.addExtraSlot(s);
  ok(E.stateKey(s) !== k1, 'stateKey không đổi khi thêm ô phụ');
});

// ---------------------------------------------------------------- level data
const manifest = JSON.parse(readFileSync(join(ROOT, 'assets/manifest.json'), 'utf8'));
const slug = t => t.toLowerCase().replace(/ /g, '_').replace(/&/g, 'and');

test('levels: có đúng 10 level, id 1..10', () => {
  eq(LEVELS.length, 10, 'số level'); LEVELS.forEach((l, i) => eq(l.id, i + 1, 'id'));
});
for (const L of LEVELS) {
  test(`level ${L.id}: id lá duy nhất, mỗi topic 1 lá topic + đúng n stamp, preplaced hợp lệ`, () => {
    const ids = levelIds(L);
    eq(new Set(ids).size, ids.length, 'id trùng');
    const all = [...L.columns.flat(), ...L.deck, ...(L.preplaced || []).flat()];
    const topics = all.filter(c => c.k === 'topic');
    const names = new Set(all.map(c => c.t));
    for (const t of names) {
      const tc = topics.filter(c => c.t === t);
      eq(tc.length, 1, `topic ${t} số lá topic`);
      eq(all.filter(c => c.t === t && c.k === 'stamp').length, tc[0].n, `topic ${t} số stamp vs n`);
    }
    ok(all.every(c => c.k === 'topic' || c.k === 'stamp'), 'k lạ');
    ok((L.preplaced || []).length <= L.foundations, 'preplaced > foundations');
    (L.preplaced || []).forEach(st => { eq(st[0].k, 'topic', 'preplaced[0] là topic'); ok(st.slice(1).every(c => c.t === st[0].t && c.k === 'stamp'), 'preplaced cùng topic'); ok(st.length - 1 < st[0].n, 'preplaced đã đủ n'); });
    ok(L.columns.every(c => c.length > 0), 'cột rỗng ban đầu');
    ok(L.moves === null || (Number.isInteger(L.moves) && L.moves > 0), 'moves');
  });
  test(`level ${L.id}: art hợp lệ, file ảnh và icon tồn tại`, () => {
    const all = [...L.columns.flat(), ...L.deck, ...(L.preplaced || []).flat()];
    const bad = [];
    for (const c of all) {
      const m = manifest[c.t];
      if (!m) { bad.push(`manifest thiếu ${c.t}`); continue; }
      if (m.dir !== 'cards/' + slug(c.t)) bad.push(`dir ${m.dir} != cards/${slug(c.t)}`);
      if (c.k === 'stamp') {
        if (!Number.isInteger(c.art) || c.art < 0 || c.art >= m.arts) bad.push(`${c.id} ${c.t} art ${c.art}/${m.arts}`);
        else if (!existsSync(join(ROOT, 'assets/cards', slug(c.t), c.art + '.png'))) bad.push(`thiếu file ${slug(c.t)}/${c.art}.png`);
      } else if (!existsSync(join(ROOT, 'assets/cards', slug(c.t), 'icon.png'))) bad.push(`thiếu icon ${slug(c.t)}`);
    }
    // art trùng trong cùng topic (hai tem giống hệt nhau trên bàn)
    const seen = new Map();
    for (const c of all.filter(x => x.k === 'stamp')) { const k = c.t + '#' + c.art; seen.set(k, (seen.get(k) || 0) + 1); }
    const dup = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
    ok(!bad.length, bad.slice(0, 5).join('; '));
    ok(!dup.length, `art trùng trong cùng topic: ${dup.join(', ')}`);
  });
  test(`level ${L.id}: solve() thắng trong số moves cho phép, replay path bằng engine hợp lệ`, () => {
    const s0 = E.createState(L);
    const r = solve(s0);
    ok(r, 'solver không giải được');
    if (L.moves != null) ok(r.moves <= L.moves, `cần ${r.moves} > ${L.moves}`);
    const s = E.createState(L);
    for (const a of r.path) {
      if (a.draw) { if (!s.deck.length) ok(E.draw(s).ok, 'recycle'); ok(E.draw(s).ok, 'draw'); }
      else { const res = E.applyMove(s, a.src, a.dst); ok(res.ok, `replay ${mkey(a)} ${res.why}`); }
    }
    ok(E.isWon(s), 'replay không thắng'); eq(s.used, r.moves, 'used');
    const h = hint(E.createState(L), { width: 30, timeLimitMs: 300 });
    ok(h && (h.draw || E.checkMove(E.createState(L), h.src, h.dst) === null), 'hint không hợp lệ');
  });
}
test('candidateActions đều thực thi được trên các level', () => {
  for (const L of LEVELS) {
    const s = E.createState(L);
    for (const a of candidateActions(s)) if (!a.draw) ok(E.checkMove(s, a.src, a.dst) === null, `L${L.id} ${mkey(a)}`);
  }
});

function runScript(L, s, { onlyBoosters = false } = {}) {
  const findCard = id => {
    for (let i = 0; i < s.cols.length; i++) { const idx = s.cols[i].findIndex(c => c.id === id); if (idx >= 0) return src(i, idx); }
    if (s.waste.length && s.waste[s.waste.length - 1].id === id) return W;
    return null;
  };
  (L.script || []).forEach((st, n) => {
    const tag = `bước ${n + 1}`;
    if (st.info) return;
    if (st.draw) { ok(E.draw(s).ok, `${tag} draw`); return; }
    if (st.booster === 'stamper') {          // Stamper mới: lật ngửa mọi lá úp của cột còn nhiều lá úp nhất
      const ci = s.cols.map((c, i) => [c.filter(x => !x.up).length, i]).sort((x, y) => y[0] - x[0])[0][1];
      const hidden = s.cols[ci].filter(c => !c.up).length;
      const r = E.revealColumn(s, ci); ok(r.ok, `${tag} stamper ${r.why}`);
      eq(r.events.length, hidden, `${tag} số lá lật`); ok(s.cols[ci].every(c => c.up), `${tag} cột còn lá úp`);
      return;
    }
    if (st.booster === 'pack') {
      const cnt = 2;
      const f = s.found[st.slot]; ok(f, `${tag} ô ${st.slot} chưa mở`);
      const had = f.cards.length;
      const r = E.pullToFoundation(s, st.slot, cnt, rng(7)); ok(r.ok, `${tag} ${st.booster} ${r.why}`);
      const ev = r.events.find(e => e.type === 'pull');
      eq(ev.cards.length, cnt, `${tag} số lá`); ok(ev.wasUp.every(x => !x), `${tag} phải là lá ẩn`);
      eq((s.found[st.slot] ? s.found[st.slot].cards.length : f.n), had + cnt, `${tag} ô`);
      return;
    }
    if (st.booster === 'joker') { ok(E.placeJoker(s, st.col, 'JOKER1').ok, `${tag} joker`); return; }
    if (onlyBoosters) return;
    const sr = findCard(st.src); ok(sr, `${tag} không tìm thấy lá ${st.src} ở vị trí nhấc được`);
    let dst;
    if (st.dst.found != null) dst = F(st.dst.found);
    else { const at = findCard(st.dst.onto); ok(at && at.from === 'col', `${tag} lá đích ${st.dst.onto}`); dst = C(at.i); ok(s.cols[at.i][s.cols[at.i].length - 1].id === st.dst.onto, `${tag} lá đích ${st.dst.onto} không ở đỉnh`); }
    const r = E.applyMove(s, sr, dst); ok(r.ok, `${tag} ${JSON.stringify(st)} -> ${r.why}`);
    // bước ép phải khớp với đích tap-to-move? (chỉ cảnh báo, không fail)
  });
}
test('Stamper: revealColumn lật hết lá úp của 1 cột, không đổi vị trí lá, không tốn move', () => {
  const s = E.createState(LEVELS[3]);
  const i = s.cols.findIndex(c => c.some(x => !x.up));
  const ids = s.cols[i].map(c => c.id), used = s.used;
  const r = E.revealColumn(s, i);
  ok(r.ok, 'ok'); ok(s.cols[i].every(c => c.up), 'hết lá úp'); eq(JSON.stringify(s.cols[i].map(c => c.id)), JSON.stringify(ids), 'thứ tự lá'); eq(s.used, used, 'không tốn move');
  ok(!E.revealColumn(s, i).ok, 'lần 2 trên cùng cột phải báo không còn lá úp');
});
test('script level 1 thực thi tuần tự hợp lệ và còn giải được sau đó', () => {
  const s = E.createState(LEVELS[0]);
  runScript(LEVELS[0], s);
  ok(solve(s, { width: 300 }), 'sau script không giải được');
});
for (const id of [4, 7, 9]) {
  test(`script booster level ${id} áp dụng được trên state ban đầu`, () => {
    const L = LEVELS[id - 1]; const s = E.createState(L);
    runScript(L, s, { onlyBoosters: true });
  });
}
test('BUG? level 9: sau bước Joker bắt buộc (cột 2), level vẫn phải giải được (không cần booster)', () => {
  const L = LEVELS[8]; const s = E.createState(L);
  runScript(L, s, { onlyBoosters: true });
  ok(solve(s) !== null, `Joker chôn các lá: ${s.cols[1].map(c => c.id + (c.up ? '' : '~')).join(',')}`);
});
test('level 4/7: sau Pack/Stamper vẫn giải được trong moves', () => {
  for (const id of [4, 7]) {
    const L = LEVELS[id - 1]; const s = E.createState(L);
    runScript(L, s, { onlyBoosters: true });
    const r = solve(s); ok(r && r.moves <= L.moves, `L${id}`);
  }
});

// ---------------------------------------------------------------- run
const fz = runFuzz();
test(`fuzz: ${fz.games} ván, không vi phạm invariant`, () => {
  ok(FAILS.size === 0, [...FAILS].map(([k, e]) => `\n    - ${k} (x${e.count}) ví dụ: ${e.first}`).join(''));
});

let nf = 0;
for (const r of results) {
  if (r.ok) console.log(`  ok   ${r.name}`);
  else { nf++; console.log(`  FAIL ${r.name}\n       ${r.msg}`); }
}
console.log(`\n${results.length - nf}/${results.length} pass, ${nf} fail. Fuzz ${fz.games} ván trong ${fz.ms} ms.`);
process.exit(nf ? 1 : 0);
