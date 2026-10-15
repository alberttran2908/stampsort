#!/usr/bin/env node
// L12 + R19 (docs/design/liveops-30-days.md mục 5, 8, 9.2, 10): mô phỏng D1–D30 (và D1–D56) cho 4 persona, kiểm DoD mục 10
// và mục tiêu economy (a)–(e) của R19. Kết quả và đề xuất số: docs/design/economy-30-days.md.
//
// Gọi THẬT logic lịch và event của game (module thuần, không DOM): liveops.js (touch, liveState, weeklyCard, morningDue,
// welcomeDue...), events.js (currentEvent, syncEvents, claim, routeStep, seasonCollect, mailbagWin, errandBump...), chapters.js
// (giá decor). Hằng số nằm trong main.js (DOM, không import được) được chép lại ở GAME bên dưới, có ghi dòng nguồn.
//
// Tỉ lệ thắng, phân bố Tem Điểm và phút mỗi lần chơi: tools/data/liveops-level-stats.json, đo bằng chính người chơi mô phỏng
// của validator (solver.js sampleHidden, profile o35 / c10 ở level_rules.mjs) trên level thật (levels.js L1–L20, levels_gen.js L21+).
// Level chưa sinh: ngoại suy theo vị trí trong chương (trung bình cùng vị trí ở các chương đã có), ghi rõ trong báo cáo.
// Chưa có file stats thì lấy tỉ lệ thắng từ levels-gen-report.json / validate-report.json và giả định phân bố Tem Điểm.
//
// Chạy:
//   node tools/liveops_sim.mjs                     30 ngày, 4 persona, số hiện tại trong code; in DoD và economy
//   node tools/liveops_sim.mjs --proposal          áp bộ số đề xuất (PROPOSAL bên dưới)
//   node tools/liveops_sim.mjs --days=56           soi chu kỳ event thứ 2
//   node tools/liveops_sim.mjs --md                thêm bảng theo ngày như mục 5.2 (replica trung vị)
//   node tools/liveops_sim.mjs --json=out.json     xuất JSON (đầu vào economy, thay content_days của R22)
//   node tools/liveops_sim.mjs --proposal --emit-json=tools/data/liveops.proposal.json   liveops.json đề xuất cho Feature Dev
//   node tools/liveops_sim.mjs --runs=200 --content=240 --no-ads --catchup --start=2026-11-05 (D1 là thứ khác Thứ Hai)
//   node tools/liveops_sim.mjs --set=game.winPerStar=5,live.MAILBAG.need=15   thử nhanh một số (gộp lên bộ đang dùng)
//   node tools/liveops_sim.mjs --refresh-stats [--stat-runs=100]   đo lại tools/data/liveops-level-stats.json (vài phút, đa luồng)
// Tất định: cùng tham số thì cùng kết quả. Chạy mặc định dưới 10 giây (stats đã có).
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import * as LIVE from '../prototype/stamp/src/liveops.js';
import * as EV from '../prototype/stamp/src/events.js';
import { buildChapters } from '../prototype/stamp/src/chapters.js';
import { applyConfig, CONF } from '../prototype/stamp/src/config.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
export const STATS_FILE = resolve(HERE, 'data/liveops-level-stats.json');
export const LIVEOPS_JSON = resolve(ROOT, 'prototype/stamp/assets/liveops.json');
// Số "hiện tại" = liveops.json đang đóng gói (L13), áp bằng chính config.js của game. Không có file thì là hằng số trong code.
export const LIVEOPS_SOURCE = (() => {
  if (!existsSync(LIVEOPS_JSON)) return 'hằng số trong code (chưa có liveops.json)';
  try { const r = applyConfig(JSON.parse(readFileSync(LIVEOPS_JSON, 'utf8')), 'liveops_sim'); return 'prototype/stamp/assets/liveops.json' + (r && r.warnings && r.warnings.length ? ` (cảnh báo: ${r.warnings.join('; ')})` : ''); }
  catch (e) { return 'hằng số trong code (liveops.json lỗi: ' + e.message + ')'; }
})();
const DAY_MS = 864e5;

// ============================================================ hằng số game chép từ main.js (đổi ở đây khi main.js đổi)
export const GAME_DEFAULT = {
  startCoins: 500,                                   // main.js defaultSave: coins 500
  winBase: 10, winPerStar: 10,                       // main.js: reward = (10 + st * 10) * mult
  weekendMode: 'all',                                // events.js weekendMult: x2 toàn bộ xu thắng chiến dịch
  chapterCoins: 200,                                 // main.js chapterReward: +200
  costs: { undo: 30, hint: 150, pack: 250, stamper: 250, joker: 500, slot: 400, moves: 300 },   // main.js COSTS
  gifts: { hint: 3, pack: 2, stamper: 2, joker: 2 },                                           // main.js GIFTS
  unlockAt: { hint: 2, pack: 4, stamper: 7, joker: 9 },                                        // main.js UNLOCK_AT
  daily: { today: CONF.daily.today, catchup: CONF.daily.catchup, page: CONF.daily.page, pageSize: CONF.daily.page_size },   // liveops.json rewards.daily
  x2From: 11,                                        // main.js showX2: lv >= 11 && !chEnd
  seasonDaily: 1,                                    // Thư hôm nay có 1 lá tem mùa
  seasonShare: 2,                                     // events.js seasonCardFor: hash % 2 === 1 thì không có tem (1/2 level)
  pointsRule: 'r11',                                 // points.js stampPoints: thắng trong số nước 3 hoặc 2, không còn 1 điểm
  rescueStars: 2,                                    // thắng sau +5 nước: còn ít nước -> 2 điểm (points.js)
  hardOvertimeStars: 2,                              // points.js POINTS.overtime
  decorCh12: [2, 3, 4, 4, 5, 6],                     // chapters.js META ch1, ch2 (tổng 24)
  decorCh3: [4, 5, 6, 7, 8, 10],                     // chapters.js COST_CH3 (tổng 40)
};

// ============================================================ bộ số đề xuất (economy-30-days.md, mục 4). --proposal áp bộ này.
export const PROPOSAL = {
  game: {
    startCoins: 300,               // đang 500
    winBase: 10, winPerStar: 0,    // thắng = 10 xu (đang 10 + 10 x Tem Điểm = 20–40). Tem Điểm đã là phần thưởng của sao
    weekendMode: 'all',            // giữ x2 toàn bộ: cuối tuần 20 xu/level, vẫn thấy rõ
    chapterCoins: 100,
    daily: { today: 15, catchup: 10, page: 50, pageSize: 10 },   // Sổ dấu ngày: trang 10 dấu (đang 20)
    seasonShare: 1,                // tem mùa trên MỌI level chiến dịch (đang 1/2)
    decorCh12: [2, 3, 3, 4, 4, 5], // 21 = 90% Tem Điểm o35 kiếm ở ch1–2 theo luật R11 (code đang 24)
    decorCh3: [5, 6, 7, 8, 10, 11], // 47 ≈ 97–101% Tem Điểm o35 mỗi chương ch3+ (code đang 40): món thứ 6 mua ở ~85% chương, không trôi về đầu chương
  },
  live: {
    FEATURES: { route: 5, season: 16 },   // E1 mở từ L5 (đang L12), E2 từ L16 (đang L20)
    MORNING: { coins: 10 },
    WEEKLY: { coins: 50, firstWeek: true },   // tuần cài app cần ít dấu hơn (tuần không đủ 7 ngày)
    MAILBAG: { need: 18 },
    BIG_EVENTS: { route: { to: 8 }, season: { from: 9 } },   // E1 cd 2–8 (chu kỳ sau 1–8), E2 cd 9–21 (đang 2–7 / 8–21)
    ROUTE: { stations: 24, milestones: [{ at: 6, coins: 20 }, { at: 12, hint: 1 }, { at: 18, pack: 1 }, { at: 24, joker: 1, stamp: 1 }], trip: { len: 6, coins: 10, max: 10 } },
    SEASON: { sets: [{ at: 8, stamper: 1, coins: 20 }, { at: 16, hint: 1 }, { at: 24, joker: 1, page: 1, rare: 1 }], extra: { len: 8, coins: 10, max: 2 } },
    ERRAND_COINS: 20,
    ERRANDS: { box: { hint: 1, pack: 1 } },
    ERRAND_NEED: { daily4: 3, win8: 6 },
    ERRAND_SWAP: { stars3: { id: 'pts8', on: 'points', need: 8 } },   // 'đạt 3 Tem Điểm ở 3 level' -> 'Kiếm 8 Tem Điểm' (không đòi chơi hoàn hảo)
    ERRAND_DROP: ['decor1'],       // 'đặt 1 món trang trí' bị chặn khi đã mua hết decor của khu hiện tại
  },
};

// ============================================================ persona (mục 5.1, 5.3) [GIẢ THUYẾT]
// minutes: phút/ngày theo [D1, D2–7, D8+]. skip(pd, weekday) = true thì hôm đó không mở app.
// Hành vi khi thua: pAd = xem quảng cáo +5 nước miễn phí (1 lần mỗi lượt chơi), pCoin = mua +5 nước bằng xu (doc 8.1: 60%),
// pUse = dùng booster có sẵn trong kho ở lượt chơi lại / level khó, pBuy = mua booster bằng xu khi chơi lại mà kho trống,
// pX2 = xem quảng cáo nhân đôi xu ở màn thắng (từ L11). overhead = phút ngoài ván (màn thắng, màn chính) mỗi lượt.
const OLDER = { profile: 'o35', minutes: [40, 30, 22], pAd: 0.5, pCoin: 0.6, pUse: 0.5, pBuy: 0.25, pX2: 0.1, pUndo: 0.08, overhead: 0.4, catchup: false };
export const PERSONAS = {
  older: { ...OLDER, name: 'Lớn tuổi đều đặn', skip: () => false },
  older57: { ...OLDER, name: 'Lớn tuổi 5/7 (bỏ T4, T6)', skip: (pd, wd) => wd === 3 || wd === 5 },
  fast: { profile: 'c10', name: 'Người nhanh', minutes: [90, 40, 30], pAd: 0.3, pCoin: 0.8, pUse: 0.3, pBuy: 0.2, pX2: 0.05, pUndo: 0.03, overhead: 0.3, catchup: false, skip: () => false },
  returner: { ...OLDER, name: 'Lớn tuổi nghỉ rồi quay lại (vắng D10–D13, D35–D41)', skip: pd => (pd >= 10 && pd <= 13) || (pd >= 35 && pd <= 41) },
};
// Hiệu quả booster dùng trong 1 lượt chơi: phần thất bại được cứu [GIẢ THUYẾT]
const BOOST_EFF = { hint: 0.35, pack: 0.5, stamper: 0.5, joker: 0.6, slot: 0.45 };
const LOSS_SEASON_KEEP = 0.6;     // thua mà lá tem mùa đã được gửi (giữ tem) [GIẢ THUYẾT]
const LOSS_DELIVER = 0.6;         // thua: phần bao thư đã gửi [GIẢ THUYẾT]

// ============================================================ RNG tất định
function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ============================================================ dữ liệu level
const PATTERN = ['intro-br', 'nor', 'nor', 'intro', 'nor', 'bump', 'br', 'nor', 'bump', 'HARD', 'br', 'intro', 'nor', 'nor', 'bump', 'br', 'nor', 'nor', 'bump', 'SUPER'];
const posOf = L => ((L - 21) % 20) + 1;
const PROFILE_KEYS = ['o35', 'c10'];

/** Thống kê 1 level cho 1 profile từ phân bố số nước (dist đã sort, Infinity = không xong). */
export function statsFromDist(dist, { budget, solver, secPerMove }) {
  const n = dist.length;
  const fin = dist.filter(Number.isFinite);
  if (budget == null) {   // L1 không giới hạn nước
    const med = fin.length ? fin[fin.length >> 1] : 30;
    return { win: 1, winP5: 1, s: [0, 0, 1], tWin: med * secPerMove / 60, tFail: 0, tAll: med * secPerMove / 60 };
  }
  const slack = Math.max(1, budget - (solver || Math.round(budget * 0.8)));
  const s = [0, 0, 0];
  let sumWin = 0, nWin = 0;
  for (const m of dist) {
    if (!(m <= budget)) continue;
    const left = budget - m;
    const st = left >= 0.5 * slack ? 3 : left >= 0.2 * slack ? 2 : 1;
    s[st - 1]++; sumWin += m; nWin++;
  }
  const med = fin.length ? fin[fin.length >> 1] : 260;
  const r = x => +x.toFixed(4);
  return {
    win: r(nWin / n), winP5: r(dist.filter(m => m <= budget + 5).length / n),
    s: s.map(x => r(nWin ? x / nWin : 0)),                     // phân bố Tem Điểm khi thắng trong số nước
    tWin: r((nWin ? sumWin / nWin : budget) * secPerMove / 60), // phút một lượt thắng
    tFail: r(budget * secPerMove / 60),                         // phút một lượt hết nước
    tAll: r(med * secPerMove / 60),                             // trung vị mọi ván xong (level khó có Ca tối)
  };
}

function levelMeta(lv) {
  const cards = [...lv.columns.flat(), ...lv.deck, ...(lv.preplaced || []).flat()];
  const topics = cards.filter(c => c.k === 'topic');
  const role = lv.role === 'hard' ? 'HARD' : lv.role === 'superhard' ? 'SUPER' : lv.role;
  return { id: lv.id, role, special: lv.special || null, cards: cards.length, topics: topics.length,
    big: topics.filter(t => (t.n || 0) >= 6).length, budget: lv.moves ?? null, solver: lv.solverMoves || null, src: lv.source || 'base' };
}

async function loadLevels() {
  const { LEVELS } = await import('../prototype/stamp/src/levels.js');
  const gen = await import('../prototype/stamp/src/levels_gen.js').then(m => m.LEVELS_GEN || [], () => []);
  const byId = new Map(gen.map(l => [l.id, l]));
  const out = LEVELS.slice(0, 20);
  for (let id = 21; byId.has(id); id++) out.push(byId.get(id));   // như main.js: dừng ở chỗ hổng đầu tiên
  return out;
}

// ---------------------------------------------------------------- đo lại stats (đa luồng)
async function refreshStats(statRuns) {
  const levels = await loadLevels();
  const { SEC_PER_MOVE } = await import('./level_rules.mjs');
  const jobs = Math.max(1, Math.min(cpus().length - 1, 14));
  const t0 = Date.now();
  const queue = levels.map(l => l.id);
  const res = {};
  await Promise.all(Array.from({ length: jobs }, () => new Promise((ok, fail) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { statRuns } });
    const next = () => { const id = queue.shift(); if (id == null) { w.terminate(); ok(); } else w.postMessage(id); };
    w.on('message', m => { res[m.id] = m; process.stderr.write(`. L${m.id}`); next(); });
    w.on('error', fail);
    next();
  })));
  const out = { generated: new Date().toISOString(), runs: statRuns, seedBase: 70000, secPerMove: SEC_PER_MOVE,
    note: 'Đo bằng solver.js sampleHidden (profile o35, c10 của level_rules.mjs), seed 70000 + id. Không dùng để chỉnh moves.',
    maxLevel: levels.at(-1).id, levels: res };
  mkdirSync(dirname(STATS_FILE), { recursive: true });
  writeFileSync(STATS_FILE, JSON.stringify(out));
  console.error(`\nĐã ghi ${STATS_FILE}: ${levels.length} level, ${statRuns} ván/profile, ${((Date.now() - t0) / 1000).toFixed(0)} giây`);
}
async function workerMain() {
  const levels = await loadLevels();
  const { createState } = await import('../prototype/stamp/src/engine.js');
  const { sampleHidden } = await import('../prototype/stamp/src/solver.js');
  const { PROFILES, SEC_PER_MOVE } = await import('./level_rules.mjs');
  parentPort.on('message', id => {
    const lv = levels.find(l => l.id === id);
    const meta = levelMeta(lv);
    const st0 = createState(lv);
    const row = { ...meta };
    for (const p of PROFILE_KEYS) {
      const r = sampleHidden(st0, { runs: workerData.statRuns, seed: 70000 + id, ...PROFILES[p] });
      row[p] = statsFromDist(r.dist, { budget: meta.budget, solver: meta.solver, secPerMove: SEC_PER_MOVE[p] });
      row[p].stuck = +(r.deadlocks / workerData.statRuns).toFixed(4);
    }
    parentPort.postMessage(row);
  });
}

// ---------------------------------------------------------------- bảng level cho mô phỏng
/** Fallback khi chưa có stats: từ report validator. Phân bố Tem Điểm giả định [GIẢ THUYẾT]. */
export function statsFromReports() {
  const rows = {};
  const sp = { o35: 4.5, c10: 3.2 };
  const put = (id, role, special, budget, topics, big, sims) => {
    const r = { id, role, special, budget, topics, big, src: 'report' };
    for (const p of PROFILE_KEYS) {
      const s = sims[p] || {};
      r[p] = { win: s.win ?? 0.9, winP5: s.winP5 ?? Math.min(1, (s.win ?? 0.9) + 0.06), s: [0.25, 0.4, 0.35],
        tWin: s.minutes ?? 5.5, tFail: budget ? budget * sp[p] / 60 : 0, tAll: s.minutes ?? 5.5 };
    }
    rows[id] = r;
  };
  try {
    const v = JSON.parse(readFileSync(resolve(ROOT, 'prototype/stamp/validate-report.json'), 'utf8'));
    for (const x of v.results) put(x.id, x.special ? (x.special === 'hard' ? 'HARD' : 'SUPER') : x.role, x.special, x.moves, x.topics, 1, x.sim);
  } catch { /* không có */ }
  try {
    const g = JSON.parse(readFileSync(resolve(ROOT, 'prototype/stamp/levels-gen-report.json'), 'utf8'));
    for (const x of g.rows) {
      const c = x.check || {};
      put(x.L, x.role, /HARD|SUPER/.test(x.role) ? x.role.toLowerCase() : null, x.moves, x.topicsUsed || x.topics, 1,
        { o35: { win: c.o35, winP5: c.o35p5, minutes: c.minutes }, c10: { win: c.c10, winP5: Math.min(1, (c.c10 ?? 1) + 0.05), minutes: c.minutes ? +(c.minutes * 3.2 / 4.5).toFixed(1) : null } });
    }
  } catch { /* không có */ }
  rows[1] = { id: 1, role: 'tutorial', special: null, budget: null, topics: 3, big: 0, o35: { win: 1, winP5: 1, s: [0, 0, 1], tWin: 2, tFail: 0, tAll: 2 }, c10: { win: 1, winP5: 1, s: [0, 0, 1], tWin: 1.5, tFail: 0, tAll: 1.5 } };
  return { levels: rows, maxLevel: Math.max(...Object.keys(rows).map(Number)), source: 'report (chưa có stats, Tem Điểm giả định 25/40/35%)' };
}

/** Bảng level L1..content: dữ liệu thật tới maxLevel, sau đó ngoại suy theo vị trí trong chương. */
export function buildLevelTable(stats, content = 240) {
  const real = stats.levels;
  const maxReal = stats.maxLevel;
  const byPos = {};
  const firstCh = 4;                                       // dùng chương 4+ (đã qua tier mở đầu) để ngoại suy
  for (const r of Object.values(real)) {
    if (r.id < 21 + (firstCh - 3) * 20) continue;
    (byPos[posOf(r.id)] = byPos[posOf(r.id)] || []).push(r);
  }
  const avg = list => {
    const o = { role: list[0].role, special: list[0].special, budget: Math.round(list.reduce((a, r) => a + (r.budget || 0), 0) / list.length),
      topics: Math.round(list.reduce((a, r) => a + r.topics, 0) / list.length), big: list.reduce((a, r) => a + r.big, 0) / list.length, src: 'ngoại suy' };
    for (const p of PROFILE_KEYS) {
      const m = k => list.reduce((a, r) => a + r[p][k], 0) / list.length;
      o[p] = { win: m('win'), winP5: m('winP5'), tWin: m('tWin'), tFail: m('tFail'), tAll: m('tAll'),
        s: [0, 1, 2].map(i => list.reduce((a, r) => a + r[p].s[i], 0) / list.length) };
    }
    return o;
  };
  const table = [null];
  for (let L = 1; L <= content; L++) {
    if (real[L]) { table.push({ ...real[L], id: L, extrapolated: false }); continue; }
    const list = byPos[posOf(L)] || Object.values(real).filter(r => r.role === PATTERN[posOf(L) - 1]);
    table.push({ ...avg(list), id: L, extrapolated: true });
  }
  // Thư hôm nay: pool tạm của daily.js là level nghỉ/thường 30–46 lá (+12% nước ở level thường) -> dùng trung bình level nghỉ
  const rest = Object.values(real).filter(r => /^(br|intro-br|breather)$/.test(r.role));
  const daily = rest.length ? avg(rest) : { topics: 6, big: 1, o35: { win: 0.97, winP5: 0.99, s: [0.2, 0.4, 0.4], tWin: 5, tFail: 6, tAll: 5 }, c10: { win: 1, winP5: 1, s: [0.1, 0.3, 0.6], tWin: 3.5, tFail: 4.5, tAll: 3.5 } };
  return { table, maxReal, daily };
}

export function loadStats() {
  if (existsSync(STATS_FILE)) { const s = JSON.parse(readFileSync(STATS_FILE, 'utf8')); s.source = `stats ${s.generated.slice(0, 10)}, ${s.runs} ván/profile`; return s; }
  return statsFromReports();
}

// ============================================================ cấu hình (số hiện tại / đề xuất)
const deep = o => JSON.parse(JSON.stringify(o));
const LIVE_BASE = { FEATURES: deep(LIVE.FEATURES), BIG_EVENTS: deep(LIVE.BIG_EVENTS), WEEKLY: deep(LIVE.WEEKLY), MORNING: deep(LIVE.MORNING), WELCOME: deep(LIVE.WELCOME), MAILBAG: deep(EV.MAILBAG),
  ROUTE: deep(EV.ROUTE), SEASON: deep(EV.SEASON), ERRAND_POOL: deep(EV.ERRAND_POOL), ERRANDS: deep(EV.ERRANDS), WEEKEND: deep(EV.WEEKEND) };
/** Đặt hằng số của liveops.js / events.js (mutate object export, chỉ trong tiến trình mô phỏng) về gốc rồi áp override. */
function applyLive(over = {}) {
  const set = (obj, base, o = {}) => { for (const k of Object.keys(obj)) delete obj[k]; Object.assign(obj, deep(base), deep(o)); };
  set(LIVE.FEATURES, LIVE_BASE.FEATURES, over.FEATURES);
  LIVE.BIG_EVENTS.forEach((e, i) => Object.assign(e, LIVE_BASE.BIG_EVENTS[i], (over.BIG_EVENTS || {})[e.id] || {}, { minLevel: LIVE.FEATURES[e.id] ?? LIVE_BASE.BIG_EVENTS[i].minLevel }));
  set(LIVE.WEEKLY, LIVE_BASE.WEEKLY, over.WEEKLY); set(LIVE.MORNING, LIVE_BASE.MORNING, over.MORNING); set(LIVE.WELCOME, LIVE_BASE.WELCOME, over.WELCOME);
  set(EV.MAILBAG, LIVE_BASE.MAILBAG, over.MAILBAG); set(EV.ROUTE, LIVE_BASE.ROUTE, over.ROUTE); set(EV.SEASON, LIVE_BASE.SEASON, over.SEASON);
  set(EV.ERRANDS, LIVE_BASE.ERRANDS, over.ERRANDS); set(EV.WEEKEND, LIVE_BASE.WEEKEND, over.WEEKEND);
  EV.ERRAND_POOL.splice(0, EV.ERRAND_POOL.length, ...deep(LIVE_BASE.ERRAND_POOL).filter(e => !(over.ERRAND_DROP || []).includes(e.id)).map(e => ({ ...e, ...(over.ERRAND_COINS ? { coins: over.ERRAND_COINS } : {}), ...((over.ERRAND_NEED || {})[e.id] ? { need: over.ERRAND_NEED[e.id] } : {}), ...((over.ERRAND_SWAP || {})[e.id] || {}) })));
}
export function makeConfig({ proposal = false, ads = true, content = 240, catchup = null, overrides = {}, start = null } = {}) {
  const game = merge(merge(deep(GAME_DEFAULT), proposal ? deep(PROPOSAL.game) : {}), deep(overrides.game || {}));
  const live = merge(proposal ? deep(PROPOSAL.live) : {}, deep(overrides.live || {}));
  const startMs = start ? (([y, m, d]) => new Date(y, m - 1, d, 10, 0, 0).getTime())(start.split('-').map(Number)) : START_MS;
  return { game, live, ads, content, catchup, proposal, startMs };
}

// ============================================================ mô phỏng 1 persona, 1 replica
const BOOSTERS = ['hint', 'pack', 'stamper', 'joker'];
const START_MS = new Date(2026, 10, 2, 10, 0, 0).getTime();   // D1 = Thứ Hai 2/11/2026, 10:00 giờ máy (mục 5.1)

export function simulate(persona, cfg, lt, { days = 30, seed = 1, trace = false } = {}) {
  applyLive(cfg.live);
  const G = cfg.game;
  const P = persona;
  const R = rng(seed);
  const chapters = buildChapters(240).map(c => ({ ...c, decor: c.decor.map((d, i) => ({ ...d, cost: (c.id <= 2 ? G.decorCh12 : G.decorCh3)[i] })) }));
  const chEnd = new Map(chapters.map(c => [c.to, c]));
  const maxLv = Math.min(cfg.content, lt.table.length - 1);
  const pAd = cfg.ads ? P.pAd : 0, pX2 = cfg.ads ? P.pX2 : 0;
  const catchup = cfg.catchup ?? P.catchup;

  const save = { coins: G.startCoins, unlocked: 1, best: {}, hint: 0, pack: 0, stamper: 0, joker: 0, decor: {}, ev: {},
    mailbag: { n: 0, i: 0 }, morning: { last: null, n: 0 }, live: {}, dailyWon: {}, weeklyClaimed: {}, stamps: 0, pages: 0, losses: { lv: null, n: 0 }, movesBonus: 0 };
  const wonLevel = () => Math.max(0, Math.min(save.unlocked, maxLv + 1) - 1);
  const acc = { coinsIn: {}, coinsOut: {}, freeBoost: {}, boughtBoost: {}, usedBoost: {}, attempts: 0, losses: 0, campaignWins: 0, replays: 0,
    dailyWins: 0, rescues: { ad: 0, coins: 0 }, gentle: 0, welcome: 0, decorBought: 0, chapterDecor: [], decorDoneAt: [], lowStreakMax: 0, minutes: 0 };
  let lowStreak = 0;
  const addIn = (src, n) => { if (!n) return; save.coins += n; acc.coinsIn[src] = (acc.coinsIn[src] || 0) + n; };
  const spend = (what, n) => { save.coins -= n; acc.coinsOut[what] = (acc.coinsOut[what] || 0) + n; };
  const giveB = (src, r) => { for (const k of BOOSTERS) if (r[k]) { save[k] += r[k]; acc.freeBoost[src] = (acc.freeBoost[src] || 0) + r[k]; } };
  const reward = (src, r) => { if (!r) return; addIn(src, r.coins || 0); giveB(src, r); if (r.moves) save.movesBonus = Math.max(save.movesBonus, r.moves); };

  const pointsEarned = () => Object.values(save.best).reduce((a, b) => a + b, 0);
  const pointsSpent = () => chapters.reduce((s, c) => s + c.decor.slice(0, save.decor[c.id] || 0).reduce((a, d) => a + d.cost, 0), 0);
  const nextDecor = () => { for (const c of chapters) { if (c.from > save.unlocked) break; const i = save.decor[c.id] || 0; if (i < c.decor.length) return { c, d: c.decor[i] }; } return null; };
  const dayLog = [];
  const news = [];                          // { what, pd, lv }: thứ mới người chơi gặp (popup / băng)
  const seen = new Set();
  const isNew = what => { if (seen.has(what)) return; seen.add(what); news.push({ what, pd: today.pd, lv: wonLevel() }); };
  let today = null, day = 0, ms = 0, curEv = null;
  const moments = [];
  const big = what => { moments.push({ pd: today.pd, what }); today.moments.push(what); };

  const evSync = () => {
    const cur = EV.currentEvent(save.live, ms, wonLevel());
    const r = EV.syncEvents(save.ev, cur);
    for (const g of r.gifts) reward('event_' + g.src, g);
    curEv = cur ? { ...cur, s: r.cur } : null;
    if (cur && today && today.open) isNew(cur.id);
    return curEv;
  };
  const evClaim = () => {
    if (!curEv) return;
    for (const m of EV.claimable(curEv.id, curEv.s, curEv.k)) {
      const r = EV.claim(curEv.id, curEv.s, m.mid, curEv.k);
      reward('event_' + curEv.id, r);
      if (curEv.id === 'route' && m.mid === 'm' + EV.ROUTE.stations) big('xong tuyến');
      if (curEv.id === 'season' && m.mid === 's' + EV.SEASON.sets.at(-1).at) big('bộ tem mùa 3 (decor hiếm)');
      if (curEv.id === 'errands' && m.mid === 'box') big('hộp việc vặt');
    }
  };
  const errDone = {};
  const bump = (on, n = 1) => { if (curEv && curEv.id === 'errands' && n > 0) for (const id of EV.errandBump(curEv.s, curEv.k, on, n)) errDone[id + '#' + curEv.k] = today.pd; };
  const buyDecor = () => {
    for (let nd = nextDecor(); nd && pointsEarned() - pointsSpent() >= nd.d.cost; nd = nextDecor()) {
      save.decor[nd.c.id] = (save.decor[nd.c.id] || 0) + 1; acc.decorBought++; today.decor++;
      if (save.decor[nd.c.id] === nd.c.decor.length) acc.decorDoneAt.push({ ch: nd.c.id, at: Math.min(1, (wonLevel() - nd.c.from + 1) / (nd.c.to - nd.c.from + 1)) });
      bump('decor');
    }
  };
  const afterWin = (isDaily, lvKey, lvRow) => {
    evSync();
    if (curEv && curEv.id === 'route') EV.routeStep(curEv.s);
    if (curEv && curEv.id === 'season' && (isDaily || seasonHas(lvRow.id))) seasonGet(lvKey, isDaily);
    const got = EV.mailbagWin(save.mailbag, wonLevel());
    if (got) giveB('mailbag', got);
    bump('deliver', lvRow.topics); bump('deliver_big', Math.round(lvRow.big));
    evClaim();
  };
  const afterLoss = (isDaily, lvKey, lvRow) => {
    evSync();
    if (curEv && curEv.id === 'season' && (isDaily || seasonHas(lvRow.id)) && R() < LOSS_SEASON_KEEP) seasonGet(lvKey, isDaily);
    bump('deliver', Math.round(lvRow.topics * LOSS_DELIVER)); bump('deliver_big', R() < 0.5 ? Math.round(lvRow.big) : 0);
    evClaim();
  };
  const seasonGet = (key, isDaily = false) => { for (let i = 0; i < (isDaily ? G.seasonDaily : 1); i++) EV.seasonCollect(curEv.s, key + (i ? '#' + i : '')); };
  const seasonHas = id => { const h = EV.hash(`lpo-season|${id}|${curEv.k}`); return G.seasonShare === 1 ? true : G.seasonShare === 3 ? h % 3 !== 0 : h % 2 === 0; };
  // F3 Thẻ tuần: tuần đầu (tuần cài app) cần max(1, số ngày còn lại của tuần - 2) dấu nếu bật WEEKLY.firstWeek (đề xuất)
  const weekly = d => {
    const w = LIVE.weeklyCard(save.dailyWon, d, save.weeklyClaimed);
    const first = LIVE.epochDay(cfg.startMs || START_MS);
    if (LIVE.WEEKLY.firstWeek && w.week === LIVE.isoWeek(first)) {
      w.need = Math.max(1, Math.min(LIVE.WEEKLY.need, 7 - ((LIVE.weekday(first) + 6) % 7) - 2));
      w.ready = !w.claimed && w.count >= w.need;
    }
    return w;
  };
  const sampleStars = st => { const r = R(); const v = r < st.s[2] ? 3 : r < st.s[2] + st.s[1] ? 2 : 1; return G.pointsRule === 'r11' ? Math.max(2, v) : v; };

  /** Một lượt chơi level chiến dịch L. Trả { win, stars, minutes }. */
  function attemptCampaign(L) {
    const row = lt.table[L], st = row[P.profile];
    acc.attempts++;
    if (P.pUndo && R() < P.pUndo && save.coins >= G.costs.undo) spend('undo', G.costs.undo);
    if (row.special) {      // level khó: Ca tối, không thua (main.js safetyOf 'overtime')
      const inBudget = R() < st.win;
      return { win: true, stars: inBudget ? sampleStars(st) : G.hardOvertimeStars, minutes: (inBudget ? st.tWin : st.tAll) + P.overhead };
    }
    if (row.budget == null) return { win: true, stars: 3, minutes: st.tWin + P.overhead };
    let w = st.win;
    const q = st.win < 1 ? Math.max(0, Math.min(1, (st.winP5 - st.win) / (1 - st.win))) : 0;   // thua -> thắng nhờ +5
    if (save.movesBonus) { w = st.winP5; save.movesBonus = 0; acc.welcome++; }
    else if (!EV.KILL.gentle_retry && EV.gentleOn(save.losses, L)) { w = Math.min(0.995, st.win + 0.75 * (st.winP5 - st.win) + 0.02); acc.gentle++; }
    // booster: ở lượt chơi lại hoặc level chật (w < 0.9)
    const retry = save.losses.lv === L && save.losses.n >= 1;
    if (retry || w < 0.9) {
      const have = BOOSTERS.filter(k => save[k] > 0 && L >= G.unlockAt[k]);
      let used = null;
      if (have.length && R() < P.pUse) { used = have[0]; save[used]--; }
      else if (!have.length && retry && R() < P.pBuy) {
        const kind = R() < 0.7 ? 'hint' : R() < 0.67 ? 'pack' : 'slot';
        if (L >= (G.unlockAt[kind] || 2) && save.coins >= G.costs[kind]) { spend('booster', G.costs[kind]); acc.boughtBoost[kind] = (acc.boughtBoost[kind] || 0) + 1; used = kind; }
      }
      if (used) { acc.usedBoost[used] = (acc.usedBoost[used] || 0) + 1; w += (1 - w) * BOOST_EFF[used]; }
    }
    if (R() < w) return { win: true, stars: sampleStars(st), minutes: st.tWin + P.overhead };
    // hết nước: quảng cáo +5 (1 lần), rồi +5 bằng xu
    let t = st.tFail + P.overhead, adUsed = false;
    if (R() < pAd) { adUsed = true; t += 0.4; if (R() < q) { acc.rescues.ad++; return { win: true, stars: G.rescueStars, minutes: t }; } }
    if (save.coins >= G.costs.moves && R() < P.pCoin) {
      spend('moves', G.costs.moves); t += 0.4;
      if (R() < (adUsed ? q * 0.5 : q)) { acc.rescues.coins++; return { win: true, stars: G.rescueStars, minutes: t }; }
    }
    return { win: false, stars: 0, minutes: t };
  }

  function playCampaign() {
    const replay = save.unlocked > maxLv;      // hết chiến dịch: chơi lại level cũ (E1, E4 vẫn tính, mục 7.3)
    const L = replay ? 1 + Math.floor(R() * maxLv) : save.unlocked;
    const row = lt.table[L];
    const res = attemptCampaign(L);
    const lvKey = 'L' + L;
    if (!res.win) {
      acc.losses++; today.losses++;
      if (!row.special) EV.gentleRecord(save.losses, L, false);
      afterLoss(false, lvKey, row);
      return res.minutes;
    }
    EV.gentleRecord(save.losses, L, true);
    const weekend = LIVE.liveState(save.live, ms, wonLevel()).weekend && !EV.KILL.weekend;
    let coins = G.winBase + G.winPerStar * res.stars;
    if (weekend) coins += G.weekendMode === 'all' ? coins * (EV.WEEKEND.mult - 1) : G.winBase * (EV.WEEKEND.mult - 1);
    addIn(weekend ? 'win+weekend' : 'win', coins);
    const isEnd = chEnd.has(L) && !replay;
    if (L >= G.x2From && !isEnd && R() < pX2) addIn('ad_x2', coins);
    save.best[L] = Math.max(save.best[L] || 0, res.stars);
    if (replay) acc.replays++; else { acc.campaignWins++; today.wins++; }
    save.unlocked = Math.max(save.unlocked, Math.min(maxLv + 1, L + 1));
    // quà mở booster (main.js unlockIntro): tặng GIFTS, kịch bản dạy dùng 1 [GIẢ THUYẾT: L2/L4/L7/L9 mỗi cái dùng 1]
    if (wonLevel() >= LIVE.FEATURES.daily) isNew('daily');
    if (wonLevel() >= LIVE.FEATURES.mailbag) isNew('mailbag');
    for (const k of BOOSTERS) if (save.unlocked === G.unlockAt[k] && !save['g_' + k]) { isNew('booster ' + k); save['g_' + k] = 1; giveB('unlock_gift', { [k]: G.gifts[k] }); save[k] -= 1; }
    if (isEnd) {
      const c = chEnd.get(L);
      addIn('chapter', G.chapterCoins);
      big(`hết chương ${c.id}`); today.newArea = true;
    }
    bump('win'); if (res.stars === 3) bump('stars3'); if (row.special) bump('hard_win'); bump('points', res.stars);   // 'Kiếm 8 Tem Điểm': Tem Điểm của ván (kể cả chơi lại), không chỉ phần vượt
    afterWin(false, lvKey, row);
    buyDecor();
    if (isEnd) {
      const c = chEnd.get(L);
      const spentOn = save.decor[c.id] || 0;
      acc.chapterDecor.push({ ch: c.id, bought: spentOn, of: c.decor.length, pd: today.pd, pointsLeft: pointsEarned() - pointsSpent() });
    }
    if (save.unlocked > 11 && !replay) {
      if (save.coins < G.costs.hint) { lowStreak++; acc.lowStreakMax = Math.max(acc.lowStreakMax, lowStreak); } else lowStreak = 0;
    }
    return res.minutes;
  }

  function playDaily(d, isCatchup) {
    const st = lt.daily[P.profile];
    let mins = 0;
    for (let tries = 0; tries < 4; tries++) {
      acc.attempts++;
      const win = R() < st.win;
      mins += (win ? st.tWin : st.tFail) + P.overhead;
      const key = 'D' + d;
      if (!win) { afterLoss(true, key, lt.daily); continue; }
      acc.dailyWins++; today.daily = isCatchup ? 'bù' : 'có';
      save.dailyWon[d] = isCatchup ? 2 : 1;
      addIn('daily', isCatchup ? G.daily.catchup : G.daily.today);
      save.stamps++;
      if (save.stamps % G.daily.pageSize === 0) { save.pages++; addIn('stampbook', G.daily.page); big('Sổ dấu ngày đầy trang (decor kỷ niệm)'); }
      const w = weekly(d);
      if (w.ready) { save.weeklyClaimed[w.week] = 1; reward('weekly', { coins: LIVE.WEEKLY.coins, hint: LIVE.WEEKLY.hint, pack: LIVE.WEEKLY.pack }); big('hộp Thẻ tuần'); }
      bump('daily_day');
      afterWin(true, key, lt.daily);
      buyDecor();
      return mins;
    }
    return mins;
  }

  let lastOpenPd = null;
  for (let pd = 1; pd <= days; pd++) {
    ms = (cfg.startMs || START_MS) + (pd - 1) * DAY_MS;
    day = LIVE.epochDay(ms);
    const wd = LIVE.weekday(day);
    today = { pd, wd, open: pd === 1 || !P.skip(pd, wd), wins: 0, losses: 0, daily: '', decor: 0, moments: [], newArea: false, gifts: [], features: [] };
    const lvStart = wonLevel();
    if (today.open) {
      LIVE.touch(save.live, ms);
      // popup lúc mở app: F6 > quà event cũ > F4 (gộp 1 phong bì, liveops.js pickPopup)
      evSync();
      if (LIVE.welcomeDue(save.live, wonLevel())) { reward('welcome', LIVE.welcomeReward(save.live.awayDue)); today.gifts.push(`chào mừng (vắng ${save.live.awayDue})`); save.live.awayDue = 0; }
      else if (save.live.awayDue && wonLevel() < 5) save.live.awayDue = 0;
      if (LIVE.morningDue(save.morning, day, pd, wonLevel())) { save.morning.last = day; save.morning.n++; reward('morning', LIVE.morningReward(save.morning.n)); }
      const budget = P.minutes[pd === 1 ? 0 : pd <= 7 ? 1 : 2];
      let used = 0;
      let dailyDone = !!save.dailyWon[day], cuDone = !catchup;
      while (used < budget) {
        const left = budget - used;
        if (wonLevel() >= LIVE.FEATURES.daily && !dailyDone) { used += playDaily(day, false); dailyDone = true; continue; }
        if (wonLevel() >= LIVE.FEATURES.daily && !cuDone) {
          cuDone = true;
          const y = day - 1;
          if (!save.dailyWon[y] && lastOpenPd !== null && lastOpenPd < pd - 1 && pd > 1) { used += playDaily(y, true); continue; }
        }
        const nxt = lt.table[Math.min(save.unlocked, maxLv)];
        const expect = nxt[P.profile].tWin + P.overhead;
        if (left < 0.4 * expect) break;
        used += playCampaign();
      }
      acc.minutes += used;
      lastOpenPd = pd;
    }
    // trạng thái cuối ngày và lý do quay lại ngày mai (DoD mục 10)
    evSync();
    const wl = wonLevel();
    for (const [f, at] of Object.entries(LIVE.FEATURES)) if (lvStart < at && wl >= at) today.features.push(f);
    const tomorrowMs = ms + DAY_MS, tDay = day + 1;
    const stT = LIVE.liveState(save.live, tomorrowMs, wl);
    const reasons = [];
    if (wl >= LIVE.FEATURES.daily) reasons.push('Thư hôm nay mới');
    if (stT.big && !EV.KILL[stT.big]) {
      const key = stT.big + '#' + stT.k;
      const s = save.ev[stT.big];
      if (!s || s.key !== key) reasons.push('event mới bắt đầu');
      else if (EV.milestones(stT.big, s, stT.k).some(m => !m.reached)) reasons.push('event còn mốc quà');
    }
    if (wl >= LIVE.FEATURES.weekly && LIVE.isoWeek(tDay) === LIVE.isoWeek(day)) {
      const w = weekly(day);
      const daysLeft = 7 - ((LIVE.weekday(tDay) + 6) % 7);
      if (!w.claimed && w.need - w.count <= 2 && w.need - w.count <= daysLeft) reasons.push('Thẻ tuần');
    }
    if (wl >= LIVE.FEATURES.mailbag && EV.MAILBAG.need - save.mailbag.n <= 3) reasons.push('Túi thư sắp đầy');
    const nd = nextDecor();
    if (nd && nd.d.cost - (pointsEarned() - pointsSpent()) <= 3) reasons.push('decor kế tiếp');
    if (today.newArea) reasons.push('khu mới');
    const touch = 3 + (wl >= LIVE.FEATURES.daily ? 1 : 0) + (LIVE.liveState(save.live, ms, wl).big ? 1 : 0);
    const stNow = LIVE.liveState(save.live, ms, wl);
    dayLog.push({
      pd, wd, open: today.open, level: wl, wins: today.wins, losses: today.losses, daily: today.daily, coins: save.coins,
      boosters: BOOSTERS.reduce((a, k) => a + Math.max(0, save[k]), 0), points: pointsEarned(), pointsLeft: pointsEarned() - pointsSpent(),
      decor: acc.decorBought, big: stNow.big || (stNow.bigPending ? stNow.bigPending + ' (chưa đủ level)' : ''), weekend: stNow.weekend,
      evProgress: curEv ? EV.progress(curEv.id, curEv.s, curEv.k) : null, moments: today.moments, features: today.features, gifts: today.gifts,
      reasons, touch, bigCount: stNow.big ? 1 : 0,
    });
  }
  // kết quả event theo phiên (k): đọc từ log cuối mỗi cửa sổ
  return { persona: P.name, dayLog, moments, acc, save: { coins: save.coins, unlocked: save.unlocked, level: wonLevel(),
    boosters: Object.fromEntries(BOOSTERS.map(k => [k, save[k]])), points: pointsEarned(), pointsLeft: pointsEarned() - pointsSpent(), stamps: save.stamps, pages: save.pages,
    weeklyBoxes: Object.keys(save.weeklyClaimed).length,
    weeklyBoxes28: Object.keys(save.weeklyClaimed).filter(w => +w <= LIVE.isoWeek(LIVE.epochDay(cfg.startMs || START_MS) + 27) - (LIVE.weekday(LIVE.epochDay(cfg.startMs || START_MS) + 27) === 0 ? 0 : 1)).length,
    weeksDue28: (() => { const f = LIVE.epochDay(cfg.startMs || START_MS); let n = 0; for (let d = f; d <= f + 27; d++) if (LIVE.weekday(d) === 0) n++; return n; })(), decor: acc.decorBought }, events: eventResults(dayLog), errDone, news };
}

/** Tiến độ cao nhất của từng phiên event (route#k: trạm, season#k: tem, errands#k: số việc xong). */
function eventResults(log) {
  const out = {};
  let prevKey = null;
  for (const d of log) {
    if (!d.evProgress || !d.big || d.big.includes('chưa')) continue;
    const k = Math.floor((d.pd - 1) / 28);
    const key = d.big + '#' + k;
    out[key] = Math.max(out[key] || 0, d.evProgress.p);
    prevKey = key;
  }
  return out;
}

// ============================================================ chạy nhiều replica, tổng hợp, kiểm DoD
const q = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * (a.length - 1) + 0.5))]; };

export function runPersona(key, cfg, lt, { days = 30, runs = 200 } = {}) {
  const P = PERSONAS[key];
  const reps = [];
  for (let i = 0; i < runs; i++) reps.push(simulate(P, cfg, lt, { days, seed: 1000 * (Object.keys(PERSONAS).indexOf(key) + 1) + i }));
  const lv = reps.map(r => r.save.level);
  const medLv = q(lv, 0.5);
  const coins = reps.map(r => r.save.coins);
  const medC = q(coins, 0.5);
  // replica đại diện: level D-cuối = trung vị, xu gần trung vị nhất
  const rep = reps.filter(r => r.save.level === medLv).sort((a, b) => Math.abs(a.save.coins - medC) - Math.abs(b.save.coins - medC))[0] || reps[0];
  return { key, name: P.name, reps, rep, days };
}

function sumObj(list) { const o = {}; for (const x of list) for (const [k, v] of Object.entries(x)) o[k] = (o[k] || 0) + v; return o; }
const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);

export function summarize(res, D = 30) {
  const reps = res.reps;
  const at = (r, d) => r.dayLog[Math.min(d, r.dayLog.length) - 1];
  const lvD = reps.map(r => at(r, D).level);
  const coinsD = reps.map(r => at(r, D).coins);
  const s = {
    name: res.name, key: res.key,
    levelD: { p10: q(lvD, 0.1), p50: q(lvD, 0.5), p90: q(lvD, 0.9) },
    coinsD: { p10: q(coinsD, 0.1), p50: q(coinsD, 0.5), p90: q(coinsD, 0.9) },
    coinsIn: Object.fromEntries(Object.entries(sumObj(reps.map(r => r.acc.coinsIn))).map(([k, v]) => [k, Math.round(v / reps.length)])),
    coinsOut: Object.fromEntries(Object.entries(sumObj(reps.map(r => r.acc.coinsOut))).map(([k, v]) => [k, Math.round(v / reps.length)])),
    freeBoost: Object.fromEntries(Object.entries(sumObj(reps.map(r => r.acc.freeBoost))).map(([k, v]) => [k, +(v / reps.length).toFixed(1)])),
    usedBoost: Object.fromEntries(Object.entries(sumObj(reps.map(r => r.acc.usedBoost))).map(([k, v]) => [k, +(v / reps.length).toFixed(1)])),
    boughtBoost: Object.fromEntries(Object.entries(sumObj(reps.map(r => r.acc.boughtBoost))).map(([k, v]) => [k, +(v / reps.length).toFixed(1)])),
    invD: q(reps.map(r => at(r, D).boosters), 0.5),
    wins: mean(reps.map(r => r.acc.campaignWins)), dailyWins: mean(reps.map(r => r.acc.dailyWins)), losses: mean(reps.map(r => r.acc.losses)),
    attempts: mean(reps.map(r => r.acc.attempts)), rescues: { ad: mean(reps.map(r => r.acc.rescues.ad)), coins: mean(reps.map(r => r.acc.rescues.coins)) },
    gentle: mean(reps.map(r => r.acc.gentle)),
    pointsD: q(reps.map(r => at(r, D).points), 0.5), decorD: q(reps.map(r => at(r, D).decor), 0.5),
    lowStreakMax: q(reps.map(r => r.acc.lowStreakMax), 0.5), lowStreakP90: q(reps.map(r => r.acc.lowStreakMax), 0.9),
    weeklyBoxes: q(reps.map(r => r.save.weeklyBoxes), 0.5), weeklyBoxes28: q(reps.map(r => r.save.weeklyBoxes28), 0.5), weeksDue28: reps[0].save.weeksDue28, stamps: q(reps.map(r => r.save.stamps), 0.5),
    events: {}, eventsP25: {},
    chapterDecor: {},
    minutesPerDay: mean(reps.map(r => r.acc.minutes)) / D,
  };
  const evKeys = [...new Set(reps.flatMap(r => Object.keys(r.events)))];
  for (const k of evKeys) { s.events[k] = q(reps.map(r => r.events[k] || 0), 0.5); s.eventsP25[k] = q(reps.map(r => r.events[k] || 0), 0.25); }
  // decor theo chương: % replica mua đủ 6 món tại lúc hết chương
  const byCh = {};
  for (const r of reps) for (const c of r.acc.chapterDecor) (byCh[c.ch] = byCh[c.ch] || []).push(c);
  const doneAt = {};
  for (const r of reps) for (const c of r.acc.decorDoneAt) (doneAt[c.ch] = doneAt[c.ch] || []).push(c.at);
  for (const [ch, list] of Object.entries(byCh)) s.chapterDecor[ch] = { doneAt: doneAt[ch] ? +q(doneAt[ch], 0.5).toFixed(2) : null, n: list.length, full: +(list.filter(c => c.bought >= c.of).length / list.length).toFixed(2), bought: q(list.map(c => c.bought), 0.5) };
  const freeTotal = Object.values(s.freeBoost).reduce((a, b) => a + b, 0);
  s.freeTotal = +freeTotal.toFixed(1);
  s.levelsPerFree = +(s.wins / (freeTotal || 1)).toFixed(2);
  const inc = Object.values(s.coinsIn).reduce((a, b) => a + b, 0);
  s.incomeTotal = inc;
  s.incomePerWin = +(inc / (s.wins || 1)).toFixed(1);
  s.discretionaryPerWin = +((inc - (s.coinsOut.moves || 0)) / (s.wins || 1)).toFixed(1);
  return s;
}

/** Kiểm DoD mục 10 + R19 (a)–(e). Trả [{ id, group, text, ok, value }]. */
export function checkDoD(all, cfg, lt, D = 30) {
  const S = Object.fromEntries(Object.entries(all).map(([k, r]) => [k, summarize(r, D)]));
  const out = [];
  const add = (id, group, text, ok, value) => out.push({ id, group, text, ok: !!ok, value });
  const o = S.older, f = S.fast, s57 = S.older57, rt = S.returner;
  add('content_older', 'Nội dung', `Lớn tuổi đều đặn D${D} ở L75–L120 (trung vị)`, o.levelD.p50 >= 75 && o.levelD.p50 <= 120, `L${o.levelD.p50} (P10 L${o.levelD.p10}, P90 L${o.levelD.p90})`);
  add('content_fast', 'Nội dung', `Người nhanh D${D} còn ≥ 20 level chưa chơi (chiến dịch ${cfg.content})`, cfg.content - f.levelD.p90 >= 20, `L${f.levelD.p50} (P90 L${f.levelD.p90}), còn ${cfg.content - f.levelD.p90} ở P90`);
  add('daily_pool', 'Nội dung', 'Không persona nào hết Daily trong 30 ngày (pool 90)', D <= 90, 'pool thật 90 cần có (đang dùng pool tạm)');
  // lý do quay lại: dùng mọi replica của 4 persona
  let worst = { n: 99 }, worst17 = { n: 99 }, failDays = 0, fail17 = 0, totalDays = 0;
  for (const [k, r] of Object.entries(all)) for (const rep of r.reps) for (const d of rep.dayLog.slice(0, D)) {
    totalDays++;
    if (d.reasons.length < 1) failDays++;
    if (d.pd <= 7 && d.reasons.length < 2) fail17++;
    if (d.reasons.length < worst.n) worst = { n: d.reasons.length, k, pd: d.pd };
    if (d.pd <= 7 && d.reasons.length < worst17.n) worst17 = { n: d.reasons.length, k, pd: d.pd };
  }
  add('reasons', 'Lý do quay lại', 'Mỗi ngày D1–D30 có ≥ 1 lý do (4 persona, mọi replica)', failDays === 0, `${failDays}/${totalDays} ngày-replica thiếu; ít nhất ${worst.n} (${worst.k} D${worst.pd})`);
  add('reasons17', 'Lý do quay lại', 'D1–D7 mỗi ngày ≥ 2 lý do', fail17 === 0, `${fail17} ngày-replica thiếu; ít nhất ${worst17.n} (${worst17.k} D${worst17.pd})`);
  // khoảnh khắc lớn: người lớn tuổi đều đặn, mọi replica
  let gapFail = 0, maxGap = 0;
  for (const rep of all.older.reps) {
    const daysM = [...new Set(rep.moments.filter(m => m.pd <= D).map(m => m.pd))].sort((a, b) => a - b);
    const pts = [0, ...daysM];
    let g = 0;
    for (let i = 1; i < pts.length; i++) g = Math.max(g, pts[i] - pts[i - 1]);
    g = Math.max(g, D - pts[pts.length - 1]);
    maxGap = Math.max(maxGap, g);
    if (g > 4) gapFail++;
  }
  add('moments', 'Khoảnh khắc lớn', 'Lớn tuổi đều đặn: khoảnh khắc lớn cách nhau ≤ 4 ngày', gapFail / all.older.reps.length <= 0.1, `${(100 * gapFail / all.older.reps.length).toFixed(0)}% replica có khoảng > 4 ngày; khoảng lớn nhất ${maxGap}`);
  // không FOMO: 5/7
  const evAt = (s, id) => Object.entries(s.eventsP25).filter(([k]) => k.startsWith(id + '#0')).map(([, v]) => v)[0] ?? 0;
  add('fomo_weekly', 'Không FOMO', `Persona 5/7: đủ hộp Thẻ tuần mọi tuần kết thúc trong D1–D28 (${s57.weeksDue28} tuần)`, s57.weeklyBoxes28 >= s57.weeksDue28, `${s57.weeklyBoxes28}/${s57.weeksDue28} hộp (trung vị)`);
  const rt3 = EV.ROUTE.milestones[2].at, sn2 = EV.SEASON.sets[1].at;
  add('fomo_route', 'Không FOMO', `Persona 5/7: Tuyến #1 ≥ 3/4 mốc quà (≥ ${rt3}/${EV.ROUTE.stations} trạm, P25)`, evAt(s57, 'route') >= rt3, `${evAt(s57, 'route')} trạm`);
  add('fomo_season', 'Không FOMO', `Persona 5/7: Tem mùa ≥ 2/3 bộ (≥ ${sn2} tem, P25)`, evAt(s57, 'season') >= sn2, `${evAt(s57, 'season')} tem`);
  add('fomo_errands', 'Không FOMO', 'Persona 5/7: Việc vặt ≥ 4/5 (P25)', evAt(s57, 'errands') >= 4, `${evAt(s57, 'errands')} việc`);
  add('return_season', 'Không FOMO', 'Persona nghỉ D10–D13: Tem mùa ≥ 2/3 bộ (P25), F6 trao đúng 1 lần mỗi lần vắng', evAt(rt, 'season') >= sn2 && all.returner.rep.dayLog.filter(d => d.gifts.length && d.pd <= D).length === (D >= 41 ? 2 : 1), `${evAt(rt, 'season')} tem; F6 ở ${all.returner.rep.dayLog.filter(d => d.gifts.length).map(d => 'D' + d.pd).join(', ')}`);
  // gọn
  let touchMax = 0, bigMax = 0;
  for (const r of Object.values(all)) for (const rep of r.reps) for (const d of rep.dayLog) { touchMax = Math.max(touchMax, d.touch); bigMax = Math.max(bigMax, d.bigCount); }
  const featMin = Math.min(...Object.values(LIVE.FEATURES));
  add('touch', 'Gọn', '≤ 5 điểm chạm chính, ≤ 1 event lớn mỗi ngày', touchMax <= 5 && bigMax <= 1, `tối đa ${touchMax} điểm chạm, ${bigMax} event lớn`);
  add('meta_l5', 'Gọn', 'Không function meta nào mở trước L5', featMin >= 5, `sớm nhất L${featMin}`);
  // mỗi level tối đa 1 thứ mới: cùng ngày (cùng phiên) và cùng level đã thắng thì là trùng. Thứ đến hạn theo lịch ở ngày khác
  // (ví dụ Tuyến đưa thư hiện ở lần mở app D2) không tính trùng với thứ mở theo level hôm trước (mục 2 quy tắc 2: hàng đợi popup).
  const dupCount = {};
  for (const r of Object.values(all)) for (const rep of r.reps) {
    const by = {};
    for (const n of rep.news) (by[n.pd + '|' + n.lv] = by[n.pd + '|' + n.lv] || []).push(n.what);
    for (const [k, l] of Object.entries(by)) if (l.length > 1) { const key = `L${k.split('|')[1]}: ${l.join(' + ')}`; dupCount[key] = (dupCount[key] || 0) + 1; }
  }
  const dup = Object.entries(dupCount).sort((x, y) => y[1] - x[1]);
  add('one_new', 'Gọn', 'Không level nào có 2 thứ mới cùng phiên (4 persona, mọi replica)', dup.length === 0, dup.length ? dup.slice(0, 4).map(([k, n]) => `${k} (${n} replica)`).join('; ') : 'mỗi level ≤ 1');
  // economy R19
  add('eco_a', 'Economy', '(a) Sau L10, xu < giá 1 Gợi ý không quá 5 level liên tiếp (lớn tuổi đều đặn, P90)', o.lowStreakP90 <= 5, `trung vị ${o.lowStreakMax}, P90 ${o.lowStreakP90} level`);
  add('eco_b', 'Economy', `(b) Xu dư D${D} trong 800–2.500 (lớn tuổi đều đặn, trung vị)`, o.coinsD.p50 >= 800 && o.coinsD.p50 <= 2500, `${o.coinsD.p50} (P10 ${o.coinsD.p10}, P90 ${o.coinsD.p90})`);
  const chs = Object.entries(o.chapterDecor).filter(([, v]) => v.n >= all.older.reps.length * 0.5);
  const chFail = chs.filter(([, v]) => v.full < 0.8);
  add('eco_c', 'Economy', '(c) Mua đủ 6 decor mỗi chương ngay khi hết chương (≥ 80% replica)', chFail.length === 0, chs.map(([ch, v]) => `ch${ch} ${Math.round(v.full * 100)}%`).join(', '));
  // (d) viết trước khi có nguồn booster miễn phí (F3, F4, F5, E1, E2, E4). Đo theo ý định "có 1 booster dùng được mỗi 3–4 level":
  // booster miễn phí + xu tự do (thu − tiền +5 nước) quy ra Gợi ý. In kèm con số chỉ tính xu để so với định nghĩa cũ.
  const avail = (o.freeTotal + (o.discretionaryPerWin * o.wins) / cfg.game.costs.hint) / (o.wins || 1);
  add('eco_d', 'Economy', '(d) Có 1 booster dùng được mỗi ≤ 4 level (booster miễn phí + xu tự do quy ra Gợi ý)', 1 / avail <= 4, `1 booster mỗi ${(1 / avail).toFixed(1)} level (chỉ tính xu: 1 Gợi ý mỗi ${(cfg.game.costs.hint / o.discretionaryPerWin).toFixed(1)} level)`);
  add('eco_e', 'Economy', '(e) Persona 5/7 cũng đạt (a) và (c)', s57.lowStreakP90 <= 5 && Object.entries(s57.chapterDecor).filter(([, v]) => v.n >= all.older57.reps.length * 0.5 && v.full < 0.8).length === 0, `chuỗi thiếu xu P90 ${s57.lowStreakP90}; decor ${Object.entries(s57.chapterDecor).filter(([, v]) => v.n >= all.older57.reps.length * 0.5).map(([ch, v]) => `ch${ch} ${Math.round(v.full * 100)}%`).join(', ')}`);
  add('eco_boost', 'Economy', 'Booster miễn phí 1 mỗi 2,5–3,5 level, kho D30 ≤ 10 (lớn tuổi đều đặn)', o.levelsPerFree >= 2.5 && o.levelsPerFree <= 3.5 && o.invD <= 10, `${o.freeTotal} booster miễn phí / ${o.wins.toFixed(0)} level = 1 mỗi ${o.levelsPerFree} level; kho D${D} ${o.invD}`);
  return { checks: out, S };
}

// ============================================================ in báo cáo
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
function mdDayTable(all, D) {
  const o = all.older.rep.dayLog, f = all.fast.rep.dayLog;
  const lines = ['| Ngày | Thứ | Lớn tuổi: Lv | Nhanh: Lv | Lớn tuổi: xu / booster / Tem Điểm dư / decor | Gặp mới, khoảnh khắc (lớn tuổi) | Event lớn | E3 | Lý do quay lại (lớn tuổi) |', '|---|---|---|---|---|---|---|---|---|'];
  for (let i = 0; i < D; i++) {
    const d = o[i], g = f[i];
    const news = [...d.features.map(x => 'mở ' + x), ...d.moments, ...d.gifts].join(', ');
    lines.push(`| D${d.pd} | ${WD[d.wd]} | ${d.level} | ${g.level} | ${d.coins} / ${d.boosters} / ${d.pointsLeft} / ${d.decor} | ${news} | ${d.big ? d.big + (d.evProgress ? ` ${d.evProgress.p}/${d.evProgress.n}` : '') : '—'} | ${d.weekend ? '×2' : ''} | ${d.reasons.join(', ')} (${d.reasons.length}) |`);
  }
  return lines.join('\n');
}
function mdSummary(S, D) {
  const keys = Object.keys(S);
  const row = (label, fn) => `| ${label} | ${keys.map(k => fn(S[k])).join(' | ')} |`;
  const fmt = o => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ');
  return [
    `| Chỉ số D${D} | ${keys.map(k => S[k].name).join(' | ')} |`, `|---|${keys.map(() => '---').join('|')}|`,
    row('Level (P10 / P50 / P90)', s => `${s.levelD.p10} / ${s.levelD.p50} / ${s.levelD.p90}`),
    row('Phút chơi trung bình/ngày', s => s.minutesPerDay.toFixed(1)),
    row('Thắng chiến dịch / Daily / thua', s => `${s.wins.toFixed(0)} / ${s.dailyWins.toFixed(0)} / ${s.losses.toFixed(0)}`),
    row('Cứu bằng +5 (quảng cáo / xu)', s => `${s.rescues.ad.toFixed(1)} / ${s.rescues.coins.toFixed(1)}`),
    row('Thử lại nhẹ tay (lượt)', s => s.gentle.toFixed(1)),
    row('Xu dư (P10 / P50 / P90)', s => `${s.coinsD.p10} / ${s.coinsD.p50} / ${s.coinsD.p90}`),
    row('Xu vào (trung bình)', s => `${s.incomeTotal}: ${fmt(s.coinsIn)}`),
    row('Xu ra (trung bình)', s => fmt(s.coinsOut)),
    row('Xu vào mỗi level thắng / xu tự do', s => `${s.incomePerWin} / ${s.discretionaryPerWin}`),
    row('Booster miễn phí', s => `${s.freeTotal}: ${fmt(s.freeBoost)}`),
    row('Booster đã dùng / mua bằng xu', s => `${fmt(s.usedBoost)} / ${fmt(s.boughtBoost) || '0'}`),
    row('Level mỗi booster miễn phí / kho cuối', s => `${s.levelsPerFree} / ${s.invD}`),
    row('Tem Điểm / decor đã mua', s => `${s.pointsD} / ${s.decorD}`),
    row('Decor đủ khi hết chương (% replica)', s => Object.entries(s.chapterDecor).filter(([, v]) => v.n >= 20).map(([c, v]) => `ch${c} ${Math.round(v.full * 100)}%`).join(', ')),
    row('Món decor thứ 6 mua lúc đã chơi (% chương, trung vị)', s => Object.entries(s.chapterDecor).filter(([, v]) => v.n >= 20 && v.doneAt != null).map(([c, v]) => `ch${c} ${Math.round(v.doneAt * 100)}%`).join(', ')),
    row('Chuỗi level thiếu xu Gợi ý (P50 / P90)', s => `${s.lowStreakMax} / ${s.lowStreakP90}`),
    row('Thư hôm nay đã thắng / hộp Thẻ tuần', s => `${s.stamps} / ${s.weeklyBoxes}`),
    row('Event (P50; P25)', s => Object.keys(s.events).sort().map(k => `${k} ${s.events[k]}; ${s.eventsP25[k]}`).join(' · ')),
  ].join('\n');
}

export async function runAll({ proposal = false, days = 30, runs = 200, content = 240, ads = true, catchup = null, overrides = {}, start = null } = {}) {
  const stats = loadStats();
  const lt = buildLevelTable(stats, content);
  const cfg = makeConfig({ proposal, ads, content, catchup, overrides, start });
  const all = {};
  for (const k of Object.keys(PERSONAS)) all[k] = runPersona(k, cfg, lt, { days, runs });
  const res = checkDoD(all, cfg, lt, Math.min(days, 30));
  applyLive({});    // trả hằng số module về gốc
  return { stats, lt, cfg, all, ...res };
}

/** liveops.json đề xuất: lấy file đang đóng gói, thay các khoá có trong PROPOSAL.live. Khoá mới (Feature Dev cần thêm vào config.js)
 *  ghi kèm trong "_todo". Phần nằm ngoài liveops.json (main.js, chapters.js, events.js) xem economy-30-days.md mục 7. */
export function proposalJson() {
  const cur = JSON.parse(readFileSync(LIVEOPS_JSON, 'utf8'));
  const L = PROPOSAL.live, G = PROPOSAL.game;
  const out = deep(cur);
  Object.assign(out.features, L.FEATURES);
  for (const e of out.big_events) { Object.assign(e, L.BIG_EVENTS[e.id] || {}); if (out.features[e.id] != null) e.minLevel = out.features[e.id]; }
  const rw = out.rewards;
  Object.assign(rw.daily, { today: G.daily.today, catchup: G.daily.catchup, page: G.daily.page, page_size: G.daily.pageSize });
  Object.assign(rw.weekly, { coins: L.WEEKLY.coins });
  Object.assign(rw.morning, L.MORNING);
  Object.assign(rw.mailbag, L.MAILBAG);
  Object.assign(rw.route, deep(L.ROUTE));
  Object.assign(rw.season, deep(L.SEASON));
  rw.errands.box = deep(L.ERRANDS.box);
  rw.errands.pool = rw.errands.pool.filter(e => !L.ERRAND_DROP.includes(e.id))
    .map(e => ({ ...e, coins: L.ERRAND_COINS, ...(L.ERRAND_NEED[e.id] ? { need: L.ERRAND_NEED[e.id] } : {}), ...(L.ERRAND_SWAP[e.id] || {}) }));
  out._note_proposal = 'ĐỀ XUẤT economy-30-days.md (liveops_sim --proposal). Chưa áp vào game.';
  out._todo = [
    'config.js ERRAND_ON thêm "points" (việc pts8); main.js onMeta: level_complete -> evBump("points", d.stars)',
    'rewards.weekly.first_week = true: khoá mới, config.js + liveops.js weeklyCard cần firstOpenDay (tuần cài app cần max(1, số ngày còn lại - 2) dấu)',
  ];
  out.rewards.weekly.first_week = true;
  return out;
}

/** --set=game.winPerStar=5,live.MAILBAG.need=15,live.FEATURES.route=6 -> { game: {...}, live: {...} } (gộp sâu lên bộ số đang dùng). */
export function parseSet(str) {
  const out = {};
  if (!str) return out;
  for (const part of str.split(',')) {
    const [path, val] = part.split('=');
    const keys = path.split('.');
    let o = out;
    keys.slice(0, -1).forEach(k => { o = o[k] = o[k] || {}; });
    o[keys.at(-1)] = val.includes('/') ? val.split('/').map(Number) : isNaN(+val) ? val : +val;
  }
  return out;
}
function merge(a, b) { for (const [k, v] of Object.entries(b || {})) a[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge({ ...a[k] }, v) : v; return a; }

async function cli() {
  const arg = n => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : null; };
  const flag = n => process.argv.includes('--' + n);
  if (flag('refresh-stats')) { await refreshStats(+(arg('stat-runs') || 100)); return; }
  const t0 = Date.now();
  const days = +(arg('days') || 30), runs = +(arg('runs') || 200), content = +(arg('content') || 240);
  const overrides = parseSet(arg('set'));
  const r = await runAll({ proposal: flag('proposal'), days, runs, content, ads: !flag('no-ads'), catchup: flag('catchup') ? true : null, overrides, start: arg('start') });
  const D = Math.min(days, 30);
  console.log(`# liveops_sim: ${flag('proposal') ? 'BỘ SỐ ĐỀ XUẤT' : 'số hiện tại trong code'}, ${days} ngày, ${runs} replica/persona, chiến dịch ${content} level${flag('no-ads') ? ', không quảng cáo' : ''}, D1 = ${new Date(r.cfg.startMs).toDateString()}`);
  console.log(`Số hiện tại lấy từ: ${LIVEOPS_SOURCE}.`);
  console.log(`Dữ liệu level: ${r.stats.source}; thật tới L${r.lt.maxReal}, L${r.lt.maxReal + 1}–L${content} ngoại suy theo vị trí trong chương.\n`);
  console.log(`## Tổng hợp D${D}\n\n${mdSummary(r.S, D)}\n`);
  if (days > 30) {
    const S56 = Object.fromEntries(Object.entries(r.all).map(([k, v]) => [k, summarize(v, days)]));
    console.log(`## Tổng hợp D${days}\n\n${mdSummary(S56, days)}\n`);
    for (const [k, v] of Object.entries(r.all)) {
      const hit = v.reps.map(rep => rep.dayLog.find(d => d.level >= r.lt.maxReal)?.pd).filter(Boolean);
      if (hit.length) console.log(`- ${v.name}: chạm L${r.lt.maxReal} (level thật cuối) ở D${q(hit, 0.5)} (trung vị)`);
    }
  }
  for (const [k, v] of Object.entries(r.all)) {
    const hit = v.reps.map(rep => rep.dayLog.find(d => d.level >= r.lt.maxReal)?.pd).filter(Boolean);
    if (hit.length && days <= 30) console.log(`- ${v.name}: chạm L${r.lt.maxReal} (level đã sinh) ở D${q(hit, 0.5)} (trung vị, ${hit.length}/${v.reps.length} replica)`);
  }
  console.log(`\n## DoD mục 10 + R19\n\n| # | Nhóm | Tiêu chí | Kết quả | Đạt |\n|---|---|---|---|---|`);
  r.checks.forEach((c, i) => console.log(`| ${i + 1} | ${c.group} | ${c.text} | ${c.value} | ${c.ok ? 'ĐẠT' : '**CHƯA**'} |`));
  if (flag('md')) console.log(`\n## Theo ngày (replica trung vị)\n\n${mdDayTable(r.all, days)}\n`);
  const emit = arg('emit-json');
  if (emit) { writeFileSync(resolve(process.cwd(), emit), JSON.stringify(proposalJson(), null, 2) + '\n'); console.log(`\nĐã ghi liveops.json đề xuất: ${emit}`); }
  const jsonPath = arg('json');
  if (jsonPath) {
    const out = { cfg: r.cfg, days, runs, source: r.stats.source, summary: r.S, checks: r.checks,
      days_table: Object.fromEntries(Object.entries(r.all).map(([k, v]) => [k, v.rep.dayLog])) };
    writeFileSync(resolve(process.cwd(), jsonPath), JSON.stringify(out, null, 1));
    console.log(`\nĐã ghi ${jsonPath}`);
  }
  console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)} giây)`);
  process.exitCode = r.checks.every(c => c.ok) ? 0 : 1;
}

if (!isMainThread) workerMain();
else if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
