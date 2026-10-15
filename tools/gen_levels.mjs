#!/usr/bin/env node
// Sinh level chiến dịch L21+ theo LUẬT A (E3-E8 trong docs/design/30-day-plan.md, R3).
// Với mỗi vị trí level: lấy spec (tools/level_spec.mjs), dựng 2 loại ứng viên rồi chọn cái tốt nhất:
//   - gen: layout tự sinh đúng spec (chủ đề, n, khay, cột), seed gen = chương x 100000 + p x 1000 + k.
//   - abi: layout của 963 level Stamp Solitaire 0.9.5 (research/apk/com.stamp.solit/levels/levels.json), giữ nguyên
//          khay, cột, thứ tự lá, n; thay chủ đề sang chủ đề có art theo spec (chủ đề mới, hạn mức). Người dùng cho phép
//          dùng level ABI (2026-10-15). Mỗi layout ABI (khử trùng theo cấu trúc) dùng tối đa 1 lần trong file đầu ra.
// Moves KHÔNG lấy theo ABI: mọi ứng viên chỉnh moves trên seed "tune" (70000 + id, 60 ván) theo mục tiêu của vai trò
// (E5), chấm điểm, rồi kiểm tra bằng validator trên seed "check" (50000 + id, 200 ván). Trượt thì +2 moves, tối đa 3 lần (E5);
// vẫn trượt thì sang ứng viên kế. Seed check không dùng để xếp hạng ứng viên.
//
// Chạy:
//   node tools/gen_levels.mjs --from=21 --to=40                      ghi gộp prototype/stamp/src/levels_gen.js
//   node tools/gen_levels.mjs --from=21 --to=40 --out=/tmp/x.js --report=/tmp/x.json --md
//   Tuỳ chọn: --gen=6 (số ứng viên tự sinh / level, level khó tối thiểu 40)  --abi=4 (số ứng viên ABI / level, 0 = tắt)  --jobs=N  --runs=200 (seed check)
// Đầu ra: file level (export const LEVELS_GEN), report JSON (mặc định prototype/stamp/levels-gen-report.json).
// Tất định: cùng lệnh + cùng file đầu ra ban đầu -> cùng nội dung (không có giới hạn thời gian trong solver).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createState } from '../prototype/stamp/src/engine.js';
import { solve, sampleHidden } from '../prototype/stamp/src/solver.js';
import { ROOT, PROFILES, SEC_PER_MOVE, availableArts, artCount, confuses, fair, rng, shuffle, hashStr, allCards, pickArts, ART_TWINS } from './level_rules.mjs';
import { specFor, buildChapter, CAP, colsFor, SPECIAL_DECK_BONUS } from './level_spec.mjs';
import { validateLevel } from './validate_levels.mjs';

const TUNE_SEED_BASE = 70000, TUNE_RUNS = 60, TUNE_MARGIN = 0.03;
// Level khó: đường c10 theo moves rất dốc nên c10 cần nhiều ván; sk chậm (nhìn trước 22 bước) nên 100 ván; o35 chỉ để ước phút.
const TUNE_RUNS_SPECIAL = { c10: 200, sk: 100, o35: 60 };
const SPECIAL_GEN = 40, MAX_SPECIAL_CHECKS = 15;                       // E6: level khó thử 40 layout (c10 và sk cùng phải vào khoảng). R6: 9 -> 15 (L60 trượt sk sau 9)
// R6: vị trí không có ứng viên nào pass (thường do trần phút o35) thì thu nhỏ spec: bớt 2 tem mỗi bước, tối đa 3 bước (-6 lá).
// Ch5 L72 (intro, 5 cột): 13 ứng viên đều 6,5-6,8 phút > 6. Seed của bước thu nhỏ s: k = 600 + 130 (s - 1) ... (không trùng vòng 1-2).
const MAX_SHRINK = 3;
const IDEAL_MIN = { 'intro-br': 4.5, br: 4.5, intro: 5, nor: 5, bump: 5.5, HARD: 7, SUPER: 7.5 };

// ---------------------------------------------------------------- dựng ứng viên
/** Layout tự sinh theo spec (giống build() của gen_proto_levels.mjs). */
export function buildGen(spec, seed) {
  const r = rng(seed * 7919 + 13);
  const cards = [], pre = [];
  let id = 0;
  for (const [t, n] of Object.entries(spec.topics)) {
    const arts = pickArts(t, n, r);   // tránh 2 art gần trùng (ART_TWINS); chủ đề khác giống hệt shuffle cũ
    const topic = { id: id++, t, k: 'topic', n };
    if (spec.preplace === t) pre.push([topic]); else cards.push(topic);
    for (const a of arts) cards.push({ id: id++, t, k: 'stamp', art: a });
  }
  shuffle(cards, r);
  let p = 0;
  // level khó: seed chẵn dùng biến thể nhiều lá trong bộ bài (spec.colsAlt)
  const shape = spec.colsAlt && seed % 2 === 0 ? spec.colsAlt : spec.cols;
  const columns = shape.map(n => { const c = cards.slice(p, p + n); p += n; return c; });
  return { foundations: spec.F, moves: null, columns, deck: cards.slice(p), preplaced: pre };
}

let ABI = null;
/** 963 level ABI, khử trùng theo cấu trúc (khay, cột, thứ tự lá theo chỉ số chủ đề). */
export function abiPool() {
  if (ABI) return ABI;
  const raw = JSON.parse(readFileSync(ROOT + 'research/apk/com.stamp.solit/levels/levels.json', 'utf8')).levels;
  const seen = new Set();
  ABI = [];
  for (const L of raw) {
    const sig = abiSig(L);
    if (seen.has(sig)) continue;
    seen.add(sig);
    const ns = Object.values(L.topics);
    const cards = L.columns.flat().length + L.deck.length + (L.preplacedFoundations || []).flat().length;
    ABI.push({ level: L.level ?? +L.name.replace(/\D/g, ''), sig, raw: L, cards, k: ns.length, nMax: Math.max(...ns), nMin: Math.min(...ns) });
  }
  return ABI;
}
function abiSig(L) {
  const idx = {}; let k = 0;
  const m = c => { if (!(c.t in idx)) idx[c.t] = k++; return idx[c.t] + (c.k === 'topic' ? 'T' : ''); };
  return L.foundations + '|' + L.columns.map(c => c.map(m).join(',')).join('/') + '|' + L.deck.map(m).join(',') + '|' + (L.preplacedFoundations || []).map(s => s.map(m).join(',')).join('/');
}
const TIP_OK = {
  few_counters: a => a.raw.foundations === 3,
  big_envelope: a => Object.values(a.raw.topics).includes(8),
  preplaced: a => (a.raw.preplacedFoundations || []).length > 0,
  five_columns: a => a.raw.columns.length === 5,
};
/** Ứng viên ABI hợp với spec, xếp theo độ gần (số lá, số chủ đề, khay). */
export function abiCandidates(spec, used, max) {
  const [lo, hi] = [spec.cardRange[0] - 2, spec.capCards];
  return abiPool().filter(a => !used.has(a.sig) && a.cards >= lo && a.cards <= hi && Math.abs(a.k - spec.topicCount) <= 1
    && a.nMin >= 2 && a.nMax <= 8 && a.raw.foundations >= 3 && a.raw.foundations <= 5 && (!spec.tip || !TIP_OK[spec.tip] || TIP_OK[spec.tip](a)))
    .map(a => ({ a, d: Math.abs(a.cards - spec.cards) + 3 * Math.abs(a.k - spec.topicCount) + 2 * Math.abs(a.raw.foundations - spec.F), h: hashStr(`${spec.id}:${a.sig}`) }))
    .sort((x, y) => x.d - y.d || x.h - y.h).slice(0, max).map(x => x.a);
}
/** Thay chủ đề ABI sang chủ đề có art theo spec. null nếu không gán được (n > art, CONFUSE, chủ đề mới không thấy sớm). */
export function rethemeAbi(spec, a) {
  const L = a.raw;
  const r = rng(hashStr(`abi:${spec.id}:${a.sig}`));
  const slots = Object.entries(L.topics).map(([t, n]) => ({ t, n })).sort((x, y) => y.n - x.n || x.t.localeCompare(y.t));
  const visible = new Set([...L.columns.map(c => c[c.length - 1]), ...L.deck.slice(0, 3)].filter(c => c && c.k === 'topic').map(c => c.t));
  const map = {};
  const chosen = [];
  const ok = (t, s) => !chosen.includes(t) && !chosen.some(x => confuses(x, t)) && artCount(t) >= s.n;
  const put = (t, s) => { map[s.t] = t; chosen.push(t); };
  const free = () => slots.filter(s => !map[s.t]);
  for (const t of spec.introduce || []) {
    const s = free().find(s => visible.has(s.t) && ok(t, s));
    if (!s) return null;
    put(t, s);
  }
  for (const t of spec.required.filter(t => !chosen.includes(t))) {
    const s = free().find(s => ok(t, s));
    if (!s) return null;
    put(t, s);
  }
  const pool = buildChapter(spec.chapter).pool.slice().sort((x, y) => hashStr(`${spec.id}:${x}`) - hashStr(`${spec.id}:${y}`));
  const order = [...Object.keys(spec.topics).filter(t => !spec.required.includes(t)), ...pool];
  for (const s of free()) {
    const t = order.find(t => ok(t, s));
    if (!t) return null;
    put(t, s);
  }
  let id = 0;
  const arts = {};
  const conv = c => {
    const t = map[c.t];
    if (c.k === 'topic') return { id: id++, t, k: 'topic', n: c.n };
    if (!arts[t]) { const o = pickArts(t, artCount(t), r); arts[t] = ART_TWINS[t] ? o.reverse() : o; }   // pop() lấy từ cuối
    return { id: id++, t, k: 'stamp', art: arts[t].pop() };
  };
  const lv = { foundations: L.foundations, moves: null, columns: L.columns.map(col => col.map(conv)), deck: L.deck.map(conv),
    preplaced: (L.preplacedFoundations || []).map(st => st.map(conv)) };
  if (!fair(spec.role, lv, spec.introduce)) return null;
  return { lv, map, abiMoves: L.moves };
}

// ---------------------------------------------------------------- chỉnh moves và chấm điểm (seed tune)
const q = (dist, p) => { const k = Math.min(dist.length - 1, Math.max(0, Math.ceil(p * dist.length) - 1)); return dist[k]; };
const winAt = (dist, m) => dist.filter(x => x <= m).length / dist.length;

/** Đánh giá 1 ứng viên trên seed tune. Trả về { ok, budget, score, ... } hoặc { ok: false, why }. */
export function evaluate(spec, lv) {
  const st = createState(lv);
  const quick = solve(st, { width: 300 });
  if (!quick) return { ok: false, why: 'không giải được' };
  const exact = solve(st, { width: 1500 });
  const solver = Math.min(quick.moves, exact ? exact.moves : Infinity);
  const seed = TUNE_SEED_BASE + spec.id;
  const sim = p => {
    const runs = spec.special ? TUNE_RUNS_SPECIAL[p] : TUNE_RUNS;
    const r = sampleHidden(st, { runs, seed, ...PROFILES[p] });
    return { dist: r.dist, stuck: r.deadlocks / runs };
  };
  const c10 = sim('c10'), o35 = sim('o35');
  const t = spec.targets;
  const floor = Math.ceil(solver * spec.slackFloor);
  let budget, extra = {};
  if (spec.special) {
    const sk = sim('sk');
    let best = null;
    for (let m = floor; m <= Math.ceil(solver * 1.35); m++) {
      const a = winAt(c10.dist, m), b = winAt(sk.dist, m);
      const e = Math.abs(a - (t.c10[0] + t.c10[1]) / 2) + Math.abs(b - (t.sk[0] + t.sk[1]) / 2);
      if (!best || e < best.e - 1e-9) best = { m, e, a, b };
    }
    budget = best.m;
    extra = { tuneC10: +best.a.toFixed(2), tuneSk: +best.b.toFixed(2), fit: +best.e.toFixed(3) };
  } else {
    const c25 = sim('c25');
    // biên an toàn: mục tiêu + TUNE_MARGIN (không quá 0.95) vì seed tune chỉ 60 ván; thử seed 90000 khi chưa có biên: L35 o35+5 0.88 < 0.90
    const m = x => x + Math.max(0, Math.min(TUNE_MARGIN, 0.95 - x));
    budget = Math.max(floor, q(c25.dist, m(t.c25)), q(o35.dist, m(t.o35)), q(o35.dist, m(t.o35p5)) - 5);
    if (!Number.isFinite(budget)) return { ok: false, why: 'mô phỏng không đạt mục tiêu ở moves nào' };
    extra = { tuneC25: +winAt(c25.dist, budget).toFixed(2), tuneO35: +winAt(o35.dist, budget).toFixed(2) };
  }
  const won = o35.dist.filter(Number.isFinite);
  const minutes = won.length ? (won[won.length >> 1] * SEC_PER_MOVE.o35) / 60 : Infinity;
  const slack = budget / solver;
  const why = [];
  if (slack > CAP.slackMax + 1e-9) why.push(`slack ${slack.toFixed(2)}`);
  if (minutes > spec.capMin) why.push(`o35 ${minutes.toFixed(1)} phút`);
  if (c10.stuck > spec.maxStuck + 0.02) why.push(`kẹt ${c10.stuck.toFixed(2)}`);   // tune 60 ván: nới 2 điểm, check mới là cửa chặn
  if (why.length) return { ok: false, why: why.join(', '), solver, budget };
  const ideal = IDEAL_MIN[spec.role];
  const score = spec.special
    ? 2 * extra.fit + 2 * c10.stuck + Math.max(0, minutes - ideal) / ideal
    : 3 * c10.stuck + Math.max(0, minutes - ideal) / ideal + 0.5 * Math.max(0, slack - 1.45) + 0.3 * Math.max(0, extra.tuneO35 - (t.o35 + 0.15));
  return { ok: true, solver, budget, slack: +slack.toFixed(2), minutes: +minutes.toFixed(1), stuck: +c10.stuck.toFixed(2), score: +score.toFixed(4), ...extra };
}

/** Kiểm tra cuối bằng validator (seed check). Level thường trượt thì +2 moves, tối đa 3 lần (E5).
 *  Level khó: c10 hoặc sk dưới khoảng thì +1, trên khoảng thì -1 (không dưới sàn slack), tối đa 3 lần; mâu thuẫn hoặc lý do khác thì dừng. */
export function check(level, runs) {
  let moves = level.moves, last = null;
  const floor = Math.ceil(level.solverMoves * level.slackFloor);
  for (let i = 0; i <= 3; i++) {
    const r = validateLevel({ ...level, moves }, { runs, file: 'levels_gen.js' });
    last = { ...r, bumped: moves - level.moves };
    if (r.pass) return { pass: true, moves, result: last };
    if (!level.special) { moves += 2; continue; }
    const c10 = r.sim.c10.win, sk = r.sim.sk.win, [lo, hi] = level.targets.c10, [slo, shi] = level.targets.sk;
    const up = c10 < lo || sk < slo, down = c10 > hi || sk > shi;
    if (up && !down) moves += 1;
    else if (down && !up && moves - 1 >= floor) moves -= 1;
    else break;
  }
  return { pass: false, moves: level.moves, result: last };
}

// ---------------------------------------------------------------- worker
if (!isMainThread && workerData?.role === 'gen') {
  parentPort.on('message', ({ kind, spec, lv, level, runs, key }) => {
    try {
      if (kind === 'eval') parentPort.postMessage({ key, res: evaluate(spec, lv) });
      else parentPort.postMessage({ key, res: check(level, runs) });
    } catch (e) { parentPort.postMessage({ key, res: { ok: false, pass: false, why: 'lỗi: ' + e.message } }); }
  });
}

// ---------------------------------------------------------------- main
export function makePool(n) {
  const workers = Array.from({ length: n }, () => new Worker(new URL(import.meta.url), { workerData: { role: 'gen' } }));
  const idle = [...workers], queue = [], waiting = new Map();
  let seq = 0;
  const pump = () => {
    while (idle.length && queue.length) { const w = idle.pop(); const job = queue.shift(); w.postMessage(job); }
  };
  for (const w of workers) w.on('message', ({ key, res }) => { const cb = waiting.get(key); waiting.delete(key); idle.push(w); pump(); cb(res); });
  return {
    // prio: chen lên đầu hàng đợi (check, ứng viên ABI, vòng 2) để vị trí đang xét không phải chờ phần đánh giá trước của các vị trí sau
    run: (job, prio = false) => new Promise(res => { const key = seq++; waiting.set(key, res); queue[prio ? 'unshift' : 'push']({ ...job, key }); pump(); }),
    close: () => workers.forEach(w => w.terminate()),
  };
}

/** Spec bớt 2 x step tem (chủ đề nền có n lớn nhất trước; giữ chủ đề giới thiệu và bao thư lớn), cột tính lại theo deck của spec. */
export function shrinkSpec(spec, step) {
  if (!step) return spec;
  const topics = { ...spec.topics };
  const keep = new Set([...(spec.introduce || []), ...(spec.bigEnvelope ? [spec.bigEnvelope.topic] : [])]);
  for (let rem = 2 * step; rem > 0; rem--) {
    const t = Object.keys(topics).filter(x => !keep.has(x) && topics[x] > spec.nRange[0])
      .sort((a, b) => topics[b] - topics[a] || (spec.required.includes(a) - spec.required.includes(b)) || a.localeCompare(b))[0];
    if (!t) break;
    topics[t]--;
  }
  const cards = Object.values(topics).reduce((a, n) => a + n + 1, 0);
  const onTable = d => Math.round((cards - (spec.preplace ? 1 : 0)) * (1 - d));
  const cols = colsFor(spec.cols.length, onTable(spec.deckTarget));
  const colsAlt = spec.colsAlt ? colsFor(spec.colsAlt.length, onTable(spec.deckTarget + SPECIAL_DECK_BONUS)) : null;
  return { ...spec, topics, cards, cols, colsAlt, deckPct: +(1 - cols.reduce((a, b) => a + b, 0) / cards).toFixed(2), shrink: step };
}

/** Xếp hạng ứng viên đã đánh giá, kiểm tra theo lô 3 trên seed check. { pick, failed, valid, checked }; pick = valid[0] nếu không ai pass. */
async function choose(spec, cands, pool, runs) {
  // level khó: ứng viên mà seed tune dự báo c10 và sk cùng trong khoảng (chừa biên 0.02) được kiểm tra trước
  const inRange = c => !spec.special || (c.ev.tuneC10 >= spec.targets.c10[0] + 0.02 && c.ev.tuneC10 <= spec.targets.c10[1] - 0.02
    && c.ev.tuneSk >= spec.targets.sk[0] + 0.02 && c.ev.tuneSk <= spec.targets.sk[1] - 0.02);
  const valid = cands.filter(c => c.ev.ok).sort((a, b) => inRange(b) - inRange(a) || a.ev.score - b.ev.score || a.order - b.order);
  // kiểm tra theo lô 3 ứng viên tốt nhất (song song), lấy ứng viên đầu tiên theo thứ hạng tune mà pass seed check.
  // Level khó kiểm tra tối đa MAX_SPECIAL_CHECKS ứng viên (mỗi lần check có profile sk, chậm).
  let pick = null, checked = 0;
  for (let i = 0; i < valid.length && !pick && (!spec.special || i < MAX_SPECIAL_CHECKS); i += 3) {
    const batch = valid.slice(i, i + 3);
    const res = await Promise.all(batch.map(c => pool.run({ kind: 'check', runs, level: levelOf(spec, c.lv, c.source, c.ev, { seed: c.seed }) }, true)));
    checked += batch.length;
    batch.forEach((c, j) => { c.check = res[j]; });
    pick = batch.find(c => c.check.pass) || null;
  }
  return { pick: pick || valid[0] || null, failed: !pick, valid, checked };
}

const levelOf = (spec, lv, source, ev, extra = {}) => ({
  id: spec.id, role: spec.role, chapter: spec.chapter, rules: 'A', unlock: null,
  ...(spec.special ? { special: spec.special, safety: 'overtime' } : {}),
  ...(spec.introduce ? { introduce: spec.introduce } : {}),
  ...(spec.tip ? { tip: spec.tip } : {}),
  source, seed: extra.seed ?? 0, solverMoves: ev.solver,
  note: extra.note || '',
  targets: spec.targets, maxStuck: spec.maxStuck, slackFloor: spec.slackFloor, capCards: spec.capCards, capMin: spec.capMin,
  ...lv, moves: ev.budget,
});

async function main() {
  const arg = (k, d) => (process.argv.find(a => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=').slice(1).join('=');
  const from = Number(arg('from', 21)), to = Number(arg('to', from + 19));
  const out = resolve(ROOT, arg('out', 'prototype/stamp/src/levels_gen.js'));
  const reportPath = resolve(ROOT, arg('report', 'prototype/stamp/levels-gen-report.json'));
  const nGen = Number(arg('gen', 6)), nAbi = Number(arg('abi', 4)), runs = Number(arg('runs', 200));
  const jobs = Math.max(1, Number(arg('jobs', Math.max(1, cpus().length - 1))));
  const t0 = Date.now();
  // giữ level ngoài khoảng (E7)
  let kept = [];
  if (existsSync(out)) kept = (Object.values(await import(pathToFileURL(out).href + '?' + Date.now())).find(Array.isArray) || []).filter(l => l.id < from || l.id > to);
  const oldReport = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')).rows || [] : [];
  const usedAbi = new Set(kept.filter(l => l.source && l.source.startsWith('abi:')).map(l => l.abiSig));
  const pool = makePool(jobs);
  const made = [], rows = [];
  const flush = done => {
    const all = [...kept, ...made].sort((a, b) => a.id - b.id);
    const header = '// SINH TỰ ĐỘNG bởi tools/gen_levels.mjs (luật A, spec tools/level_spec.mjs). Đừng sửa tay; chạy lại generator.\n';
    const body = header + 'export const LEVELS_GEN = ' + JSON.stringify(all) + ';\n';
    mkdirSync(dirname(out), { recursive: true });
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(out, body);
    const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);
    // level chưa sinh trong khoảng (lần chạy dở) giữ dòng report cũ
    const allRows = [...oldReport.filter(r => r.L < from || r.L > to), ...rows].sort((a, b) => a.L - b.L);
    const sec = +((Date.now() - t0) / 1000).toFixed(0);
    writeFileSync(reportPath, JSON.stringify({ generated: { from, to, seconds: sec, hash, nGen, nAbi, runs, ...(done ? {} : { partial: rows.length }) }, rows: allRows }, null, 1));
    return { hash, sec };
  };
  // ứng viên gen không phụ thuộc lựa chọn ở vị trí trước: dựng và xếp hàng đánh giá cho mọi vị trí ngay từ đầu (dùng hết luồng).
  // Ứng viên ABI phụ thuộc layout ABI đã dùng nên vẫn xét tuần tự theo vị trí.
  const pre = new Map();
  for (let L = from; L <= to; L++) {
    const spec = specFor(L);
    const gens = [];
    const wantGen = spec.special ? Math.max(nGen, SPECIAL_GEN) : nGen;
    for (let k = 1; gens.length < wantGen && k < 400; k++) {
      const seed = spec.chapter * 100000 + spec.p * 1000 + k;
      const lv = buildGen(spec, seed);
      if (fair(spec.role, lv, spec.introduce)) gens.push({ kind: 'gen', lv, seed, source: `gen:${seed}` });
    }
    pre.set(L, { gens, evs: Promise.all(gens.map(c => pool.run({ kind: 'eval', spec, lv: c.lv }))) });
  }
  for (let L = from; L <= to; L++) {
    const spec = specFor(L);
    const cands = [...pre.get(L).gens];
    const abis = [];
    for (const a of nAbi ? abiCandidates(spec, usedAbi, nAbi * 3) : []) {
      if (abis.length >= nAbi) break;
      const rt = rethemeAbi(spec, a);
      if (rt) abis.push({ kind: 'abi', lv: rt.lv, source: `abi:L${a.level}`, abiSig: a.sig, abiMoves: rt.abiMoves, map: rt.map });
    }
    const abiEvs = Promise.all(abis.map(c => pool.run({ kind: 'eval', spec, lv: c.lv }, true)));
    cands.push(...abis);
    const evs = [...await pre.get(L).evs, ...await abiEvs];
    cands.forEach((c, i) => { c.ev = evs[i]; c.order = i; });
    // vòng 2: chưa đủ 3 ứng viên hợp lệ thì thêm 2 x nGen seed tự sinh (vẫn tất định theo k)
    if (cands.filter(c => c.ev.ok).length < 3) {
      const more = [];
      let k = Math.max(0, ...cands.filter(c => c.kind === 'gen').map(c => c.seed - spec.chapter * 100000 - spec.p * 1000)) + 1;
      for (; more.length < 2 * nGen && k < 800; k++) {
        const seed = spec.chapter * 100000 + spec.p * 1000 + k;
        const lv = buildGen(spec, seed);
        if (fair(spec.role, lv, spec.introduce)) more.push({ kind: 'gen', lv, seed, source: `gen:${seed}` });
      }
      const ev2 = await Promise.all(more.map(c => pool.run({ kind: 'eval', spec, lv: c.lv }, true)));
      more.forEach((c, i) => { c.ev = ev2[i]; c.order = cands.length + i; });
      cands.push(...more);
    }
    let best = { ...(await choose(spec, cands, pool, runs)), spec, shrink: 0 };
    let allCands = cands;
    for (let step = 1, prevCards = spec.cards; best.failed && step <= MAX_SHRINK; step++) {
      const s2 = shrinkSpec(spec, step);
      if (s2.cards >= prevCards) break;   // không bớt được nữa (mọi chủ đề đã ở n tối thiểu)
      prevCards = s2.cards;
      const more = [];
      for (let k = 600 + 130 * (step - 1); more.length < (s2.special ? SPECIAL_GEN : 2 * nGen) && k < 600 + 130 * step; k++) {
        const seed = spec.chapter * 100000 + spec.p * 1000 + k;
        const lv = buildGen(s2, seed);
        if (fair(s2.role, lv, s2.introduce)) more.push({ kind: 'gen', lv, seed, source: `gen:${seed}` });
      }
      const ev3 = await Promise.all(more.map(c => pool.run({ kind: 'eval', spec: s2, lv: c.lv }, true)));
      more.forEach((c, i) => { c.ev = ev3[i]; c.order = i; });
      allCands = [...allCands, ...more];
      const sel = await choose(s2, more, pool, runs);
      process.stderr.write(`L${L}: thu nhỏ ${step} (${s2.cards} lá): ${sel.failed ? 'chưa pass' : 'pass'} (ứng viên ${more.length}, hợp lệ ${sel.valid.length})\n`);
      if (!sel.failed || (!best.pick && sel.pick)) best = { ...sel, spec: s2, shrink: step };
    }
    const { failed, valid, checked } = best;
    let { pick } = best;
    const S = best.spec;
    if (!pick) { pool.close(); throw new Error(`L${L}: không có ứng viên hợp lệ (${allCands.map(c => c.source + ': ' + c.ev.why).join('; ')})`); }
    const ev = { ...pick.ev, budget: pick.check ? pick.check.moves : pick.ev.budget };
    const note = pick.kind === 'abi'
      ? `ABI 0.9.5 L${pick.source.slice(5)}: giữ khay/cột/thứ tự lá/n; chủ đề ${Object.entries(pick.map).map(([x, y]) => x + '→' + y).join(', ')}; moves ABI ${pick.abiMoves} -> ${ev.budget} (chỉnh theo mục tiêu)`
      : `Tự sinh theo level_spec (seed ${pick.seed})` + (best.shrink ? `; spec thu nhỏ ${best.shrink} bước (${spec.cards} -> ${S.cards} lá) vì không ứng viên nào đạt` : '');
    const level = { ...levelOf(S, pick.lv, pick.source, ev, { seed: pick.seed, note }), ...(pick.abiSig ? { abiSig: pick.abiSig } : {}) };
    if (pick.abiSig) usedAbi.add(pick.abiSig);
    made.push(level);
    const cr = pick.check?.result;
    const row = {
      L, chapter: spec.chapter, p: spec.p, role: spec.role, source: pick.source, cards: allCards(level).length, topics: Object.keys(S.topics).length, specCards: spec.cards, shrink: best.shrink,
      topicsUsed: allCards(level).filter(c => c.k === 'topic').length, F: level.foundations, cols: level.columns.map(c => c.length).join('-'),
      solver: ev.solver, moves: level.moves, slack: +(level.moves / ev.solver).toFixed(2), bumped: pick.check?.result?.bumped ?? null,
      tune: { score: pick.ev.score, minutes: pick.ev.minutes, stuck: pick.ev.stuck, c25: pick.ev.tuneC25, o35: pick.ev.tuneO35, c10: pick.ev.tuneC10, sk: pick.ev.tuneSk },
      check: cr ? { c10: cr.sim.c10?.win, c10stuck: cr.sim.c10?.stuck, c25: cr.sim.c25?.win, o35: cr.sim.o35?.win, o35p5: cr.sim.o35?.winP5, sk: cr.sim.sk?.win, minutes: cr.sim.o35?.minutes } : null,
      pass: !failed, fails: cr?.fails || [], candidates: { gen: allCands.filter(c => c.kind === 'gen').length, abi: allCands.filter(c => c.kind === 'abi').length, valid: valid.length, checked },
      rejected: allCands.filter(c => !c.ev.ok).map(c => `${c.source}: ${c.ev.why}`),
    };
    rows.push(row);
    process.stderr.write(`L${L} ${spec.role}: ${pick.source} ${failed ? 'TRƯỢT ' + row.fails.join('; ') : 'pass'}${best.shrink ? ` (thu nhỏ ${spec.cards} -> ${S.cards} lá)` : ''} (ứng viên ${allCands.length}, hợp lệ ${valid.length}, check ${checked}) ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
    flush(false);   // ghi dần sau mỗi level: tiến trình chết giữa chừng không mất level đã sinh
  }
  pool.close();
  const { hash, sec } = flush(true);
  if (process.argv.includes('--md')) {
    const pct = x => (x == null ? '-' : Math.round(x * 100) + '%');
    console.log('| L | Vai trò | Nguồn | Lá | Chủ đề | Khay | Cột | Solver | Moves | Slack | c25 | o35 | o35 +5 | c10 | c10 kẹt | sk | Phút o35 | Kết quả |');
    console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const r of rows) {
      const c = r.check || {};
      console.log(`| ${r.L} | ${r.role} | ${r.source} | ${r.cards} | ${r.topicsUsed} | ${r.F} | ${r.cols} | ${r.solver} | ${r.moves}${r.bumped ? ` (+${r.bumped})` : ''} | ${r.slack} | ${pct(c.c25)} | ${pct(c.o35)} | ${pct(c.o35p5)} | ${pct(c.c10)} | ${pct(c.c10stuck)} | ${pct(c.sk)} | ${c.minutes ?? '-'} | ${r.pass ? 'pass' : '**TRƯỢT** ' + r.fails.join('; ')} |`);
    }
  }
  const nPass = rows.filter(r => r.pass).length;
  console.log(`\n${nPass}/${rows.length} pass seed check. ${made.filter(l => l.source.startsWith('abi')).length} level từ ABI, ${made.filter(l => l.source.startsWith('gen')).length} tự sinh. ${sec}s. sha256 ${hash}. -> ${out.replace(ROOT, '')}`);
  process.exit(nPass === rows.length ? 0 : 1);
}

if (isMainThread && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
