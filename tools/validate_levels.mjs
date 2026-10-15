#!/usr/bin/env node
// Validator level (E9 trong docs/design/30-day-plan.md): đo mỗi level bằng 4 người chơi mô phỏng KHÔNG nhìn trộm
// (c10, c25, o35, sk ở tools/level_rules.mjs) trên seed "check" = 50000 + id (không bao giờ dùng để chỉnh moves),
// so với mục tiêu của level (level.targets nếu có, ngược lại mặc định theo vai trò: level_spec.mjs legacyTargets).
// Kèm kiểm tra tĩnh: CONFUSE, số chủ đề theo luật, n khớp số tem, art có thật, giải được, số lá và phút <= trần.
//
// Chạy:
//   node tools/validate_levels.mjs                                   levels.js (luật A, mặc định bản phát hành), L2-L20
//   node tools/validate_levels.mjs --file=prototype/stamp/src/levels_b.js --levels=2-20
//   node tools/validate_levels.mjs --file=prototype/stamp/src/levels_gen.js --levels=21-40 --runs=300
//   Tuỳ chọn: --runs=200 (ván / profile)  --jobs=N (luồng, mặc định số CPU - 1)  --out=<json>  --quiet
//             --seed-base=50000 (đổi khi QA lớn để có seed chưa từng dùng, rủi ro #7 của plan)
// Ghi: prototype/stamp/validate-report[_b|_gen|_daily].json (theo tên file level) hoặc --out. In bảng markdown ra stdout.
// Thoát mã 1 nếu có level trượt (dùng cho QA/CI). Cảnh báo (warn) không làm trượt.
import { writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createState } from '../prototype/stamp/src/engine.js';
import { solve, sampleHidden } from '../prototype/stamp/src/solver.js';
import { ROOT, PROFILES, SEC_PER_MOVE, confusePairs, availableArts, allCards } from './level_rules.mjs';
import { legacyTargets, CAP, capMinFor } from './level_spec.mjs';

export const CHECK_SEED_BASE = 50000;
// Cặp CONFUSE được phép khi level không dùng đúng art gây nhầm (A L5: bỏ tem xe buýt 2 tầng Truck #3, gen_proto_levels.mjs avoid).
const CONFUSE_ART = { 'Truck|Train': { Truck: [3] } };
// Trần số chủ đề theo luật: B (levels_b.js) <= 6; A: level thường <= 9, level khó <= 10.
const TOPIC_CAP = { A: { normal: 9, special: 10 }, B: { normal: 6, special: 6 } };

function rulesOf(file, lv) { return lv.rules || (/_b\.js$/.test(file) ? 'B' : 'A'); }

/** Đo 1 level. Chạy trong worker. */
function validateLevel(lv, { runs, file, seedBase = null }) {
  const id = lv.id;
  const rules = rulesOf(file, lv);
  const fails = [], warns = [];
  const cards = allCards(lv);
  const topicCards = cards.filter(c => c.k === 'topic');
  const topics = topicCards.map(c => c.t);
  const special = lv.special || null;
  const legacy = !lv.targets;
  const tg = legacy ? legacyTargets(lv.role, special) : { targets: lv.targets, stuck: lv.maxStuck, special };
  const capCards = lv.capCards ?? (special ? CAP.special.cards : CAP.normal.cards);
  const capMin = lv.capMin ?? capMinFor(lv.role, special);

  // ---- tĩnh
  for (const [a, b] of confusePairs(topics)) {
    const ex = CONFUSE_ART[a + '|' + b] || CONFUSE_ART[b + '|' + a];
    const hit = !ex || Object.entries(ex).some(([t, arts]) => cards.some(c => c.t === t && c.k === 'stamp' && arts.includes(c.art)));
    if (hit) fails.push(`CONFUSE ${a}+${b}`);
  }
  const tcap = TOPIC_CAP[rules][special ? 'special' : 'normal'];
  if (topics.length > tcap) fails.push(`${topics.length} chủ đề > ${tcap} (luật ${rules})`);
  if (new Set(topics).size !== topics.length) fails.push('trùng tem vương miện');
  for (const tc of topicCards) {
    const st = cards.filter(c => c.k === 'stamp' && c.t === tc.t);
    if (st.length !== tc.n) fails.push(`${tc.t}: n ${tc.n} != ${st.length} tem`);
    const have = availableArts(tc.t);
    const bad = st.filter(c => !have.includes(c.art));
    if (bad.length) fails.push(`${tc.t}: art không có ${bad.map(c => c.art)}`);
    if (new Set(st.map(c => c.art)).size !== st.length) warns.push(`${tc.t}: lặp art`);
  }
  if (cards.length > capCards) fails.push(`${cards.length} lá > ${capCards}`);
  const st0 = createState(lv);
  const sol = solve(st0, { width: 400 });            // không giới hạn thời gian: kết quả không phụ thuộc tải máy
  if (!sol) fails.push('solver không giải được');
  const solverMin = Math.min(lv.solverMoves || Infinity, sol ? sol.moves : Infinity);
  const budget = lv.moves ?? Infinity;
  const slack = Number.isFinite(budget) && Number.isFinite(solverMin) ? budget / solverMin : null;
  if (slack != null && slack > CAP.slackMax) (legacy ? warns : fails).push(`slack ${slack.toFixed(2)} > ${CAP.slackMax}`);
  if (!legacy && lv.slackFloor && slack != null && slack < lv.slackFloor - 1e-9) fails.push(`slack ${slack.toFixed(2)} < sàn ${lv.slackFloor}`);

  // ---- mô phỏng: profile cần cho mục tiêu, cộng c10 (kẹt) và o35 (phút)
  const need = new Set(['c10', 'o35']);
  for (const k of Object.keys(tg.targets)) need.add(k === 'o35p5' ? 'o35' : k);
  const sim = {};
  for (const p of ['c10', 'c25', 'o35', 'sk']) {
    if (!need.has(p)) continue;
    const r = sampleHidden(st0, { runs, seed: (seedBase ?? CHECK_SEED_BASE) + id, ...PROFILES[p] });
    const won = r.dist.filter(Number.isFinite);
    const med = won.length ? won[won.length >> 1] : null;
    sim[p] = {
      win: +(r.dist.filter(m => m <= budget).length / runs).toFixed(3),
      winP5: +(r.dist.filter(m => m <= budget + 5).length / runs).toFixed(3),
      stuck: +(r.deadlocks / runs).toFixed(3),
      median: med,
      minutes: med ? +((med * SEC_PER_MOVE[p]) / 60).toFixed(1) : null,
    };
  }
  // ---- so mục tiêu
  for (const [k, v] of Object.entries(tg.targets)) {
    const got = k === 'o35p5' ? sim.o35.winP5 : sim[k].win;
    const name = k === 'o35p5' ? 'o35+5' : k;
    if (Array.isArray(v)) { if (got < v[0] || got > v[1]) fails.push(`${name} ${got.toFixed(3)} ngoài ${v[0]}-${v[1]}`); }
    else if (got < v) fails.push(`${name} ${got.toFixed(3)} < ${v}`);
  }
  if (sim.c10.stuck > tg.stuck + 1e-9) fails.push(`kẹt c10 ${sim.c10.stuck.toFixed(3)} > ${tg.stuck}`);
  if (sim.o35.minutes != null && sim.o35.minutes > capMin) fails.push(`o35 ${sim.o35.minutes} phút > ${capMin}`);
  if (sim.o35.median == null) fails.push('o35 không thắng ván nào');
  return {
    id, role: lv.role, special, rules, legacy, cards: cards.length, topics: topics.length, F: lv.foundations,
    moves: lv.moves ?? null, solver: Number.isFinite(solverMin) ? solverMin : null, slack: slack != null ? +slack.toFixed(2) : null,
    targets: tg.targets, maxStuck: tg.stuck, capMin, sim, fails, warns, pass: fails.length === 0,
  };
}

if (!isMainThread && workerData?.role === 'validate') {
  parentPort.on('message', ({ lv, opts }) => {
    const t0 = Date.now();
    const r = validateLevel(lv, opts);
    r.sec = +((Date.now() - t0) / 1000).toFixed(1);
    parentPort.postMessage(r);
  });
} else if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (k, d) => (process.argv.find(a => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=').slice(1).join('=');
  const file = resolve(ROOT, arg('file', 'prototype/stamp/src/levels.js'));
  const runs = Number(arg('runs', 200));
  const seedBase = Number(arg('seed-base', CHECK_SEED_BASE));
  const jobs = Math.max(1, Number(arg('jobs', Math.max(1, cpus().length - 1))));
  const mod = await import(pathToFileURL(file).href);
  const all = Object.values(mod).find(Array.isArray);
  const [lo, hi] = arg('levels', '').split('-').map(Number);
  const levels = all.filter(l => (lo ? l.id >= lo && l.id <= (hi || lo) : l.moves != null) && l.moves != null);
  const suffix = (basename(file, '.js').match(/^levels(_\w+)?$/) || [])[1] || '';
  const out = resolve(ROOT, arg('out', `prototype/stamp/validate-report${suffix}.json`));
  const t0 = Date.now();
  const results = [];
  await new Promise((done, fail) => {
    let next = 0, active = 0;
    const pool = Array.from({ length: Math.min(jobs, levels.length) }, () => new Worker(new URL(import.meta.url), { workerData: { role: 'validate' } }));
    const feed = w => {
      if (next >= levels.length) { w.terminate(); if (--active === 0) done(); return; }
      w.postMessage({ lv: levels[next++], opts: { runs, file, seedBase } });
    };
    for (const w of pool) {
      active++;
      w.on('message', r => { results.push(r); if (!process.argv.includes('--quiet')) process.stderr.write(`L${r.id} ${r.pass ? 'pass' : 'FAIL'} (${r.sec}s)\n`); feed(w); });
      w.on('error', fail);
      feed(w);
    }
  });
  results.sort((a, b) => a.id - b.id);
  const sec = +((Date.now() - t0) / 1000).toFixed(1);
  const pct = x => (x == null ? '-' : Math.round(x * 100) + '%');
  console.log(`Validator: ${basename(file)} L${levels[0]?.id}-L${levels.at(-1)?.id}, ${runs} ván/profile, seed ${seedBase}+id, ${jobs} luồng, ${sec}s\n`);
  console.log('| L | Vai trò | Lá | Chủ đề | Moves | Slack | c10 thắng | c10 kẹt | c25 thắng | o35 thắng | o35 +5 | sk thắng | o35 phút | Kết quả |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    const s = r.sim;
    const res = r.pass ? 'pass' : '**TRƯỢT**: ' + r.fails.join('; ');
    console.log(`| ${r.id} | ${r.special || r.role} | ${r.cards} | ${r.topics} | ${r.moves} | ${r.slack ?? '-'} | ${pct(s.c10?.win)} | ${pct(s.c10?.stuck)} | ${pct(s.c25?.win)} | ${pct(s.o35?.win)} | ${pct(s.o35?.winP5)} | ${pct(s.sk?.win)} | ${s.o35?.minutes ?? '-'} | ${res}${r.warns.length ? ' (cảnh báo: ' + r.warns.join('; ') + ')' : ''} |`);
  }
  const nFail = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - nFail}/${results.length} pass. Report: ${out.replace(ROOT, '')}`);
  writeFileSync(out, JSON.stringify({ file: file.replace(ROOT, ''), runs, checkSeedBase: seedBase, profiles: PROFILES, secPerMove: SEC_PER_MOVE, seconds: sec, pass: results.length - nFail, total: results.length, results }, null, 1));
  process.exit(nFail ? 1 : 0);
}

export { validateLevel };
