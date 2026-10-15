// Test cho tools/level_spec.mjs (R1 trong docs/design/30-day-plan.md, luật A).
// Chạy: node tools/tests/level_spec.test.mjs        (thoát mã 1 nếu có test trượt)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { LEVELS as LEVELS_A } from '../../prototype/stamp/src/levels.js';
import { artCount, confusePairs, hasArt } from '../level_rules.mjs';
import {
  specFor, buildChapter, tierOf, PATTERN, PEAK, BREATHER, INTRO_AT, CHAPTER_TOPICS, CH2_TOPICS, QUOTA, CAP,
  resolvedTopics, SPECIAL_DECK_BONUS, FIRST_GEN, LAST_GEN, CHAPTER_LEN, firstOf, NEW_ART_MIN,
} from '../level_spec.mjs';

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, msg: e.message }); }
}
function ok(c, msg) { if (!c) throw new Error(msg); }

const specs = [];
for (let L = FIRST_GEN; L <= LAST_GEN; L++) specs.push(specFor(L));
const chapters = [...new Set(specs.map(s => s.chapter))];

test('220 spec, id liên tục 21-240, 11 chương x 20', () => {
  ok(specs.length === 220, `có ${specs.length}`);
  specs.forEach((s, i) => ok(s.id === FIRST_GEN + i, `id ${s.id} ở vị trí ${i}`));
  ok(chapters.join(',') === '3,4,5,6,7,8,9,10,11,12,13', chapters.join(','));
});

test('số chủ đề đúng tier theo vai trò (luật A: nor 7-8, bump 8-9, hard 8-10, super 9-10)', () => {
  for (const s of specs) {
    const k = Object.keys(s.topics).length;
    ok(k === s.topicCount, `L${s.id} ${s.role}: ${k} chủ đề, spec ${s.topicCount}`);
    ok(s.special ? k <= 10 : k <= 9, `L${s.id}: ${k} chủ đề vượt trần`);
  }
});

test('0 cặp CONFUSE trong mọi level', () => {
  const bad = specs.map(s => [s.id, confusePairs(Object.keys(s.topics))]).filter(([, p]) => p.length);
  ok(!bad.length, bad.map(([id, p]) => `L${id}: ${p.map(x => x.join('+')).join(', ')}`).join('; '));
});

test('n <= số art, n trong khoảng của tier', () => {
  for (const s of specs) for (const [t, n] of Object.entries(s.topics)) {
    ok(n <= artCount(t), `L${s.id} ${t}: n ${n} > ${artCount(t)} art`);
    ok(n >= s.nRange[0] && n <= s.nRange[1], `L${s.id} ${t}: n ${n} ngoài ${s.nRange}`);
  }
});

test('số lá nằm trong khoảng tier của vai trò, <= trần (thường 46, khó 54), = tổng (n + 1)', () => {
  for (const s of specs) {
    const sum = Object.values(s.topics).reduce((a, n) => a + n + 1, 0);
    ok(sum === s.cards, `L${s.id}: tổng ${sum} != cards ${s.cards}`);
    ok(s.cards >= s.cardRange[0] && s.cards <= s.cardRange[1], `L${s.id} ${s.role}: ${s.cards} lá ngoài ${s.cardRange}`);
    ok(s.cards <= (s.special ? CAP.special.cards : CAP.normal.cards), `L${s.id}: ${s.cards} lá vượt trần`);
  }
});

test('cột + deck khớp số lá, deck% lệch tier <= 4 điểm (level khó có thêm biến thể +8 điểm), 4 cột (5 cột ở super, ch5 từ p6, ch6+)', () => {
  for (const s of specs) {
    const tier = tierOf(s.chapter);
    const table = s.cols.reduce((a, b) => a + b, 0);
    ok(table < s.cards && s.cols.every(c => c >= 1), `L${s.id}: cột ${s.cols}`);
    ok(Math.abs(s.deckPct - tier.deck) <= 0.04, `L${s.id}: deck ${s.deckPct} vs ${tier.deck}`);
    if (s.special) {
      const alt = 1 - s.colsAlt.reduce((a, b) => a + b, 0) / s.cards;
      ok(Math.abs(alt - tier.deck - SPECIAL_DECK_BONUS) <= 0.04 && s.colsAlt.length === s.cols.length, `L${s.id}: colsAlt deck ${alt}`);
    } else ok(s.colsAlt == null, `L${s.id}: colsAlt chỉ cho level khó`);
    const want = s.role === 'SUPER' ? 5 : tier.cols5From && s.p >= tier.cols5From ? 5 : tier.cols;
    ok(s.cols.length === want, `L${s.id}: ${s.cols.length} cột, cần ${want}`);
  }
});

test('chủ đề mới có ở level intro và không xuất hiện sớm hơn trong chương', () => {
  for (const ch of chapters) {
    const cs = specs.filter(s => s.chapter === ch);
    const cur = resolvedTopics(ch).map(t => t.use);
    INTRO_AT.forEach((p, i) => {
      const s = cs[p - 1];
      ok(s.introduce && s.introduce[0] === cur[i] && s.topics[cur[i]], `L${s.id}: thiếu giới thiệu ${cur[i]}`);
      for (const e of cs.slice(0, p - 1)) ok(!e.topics[cur[i]], `L${e.id}: ${cur[i]} xuất hiện trước level giới thiệu L${s.id}`);
    });
    // chủ đề mới (kể cả fallback) không có trong chương liền trước
    const prev = specs.filter(s => s.chapter === ch - 1);
    for (const t of cur) for (const e of prev) ok(!e.topics[t], `L${e.id} (ch${ch - 1}): đã dùng ${t} của ch${ch}`);
  }
});

test('hạn mức: mỗi chủ đề mới >= 40% level của chương, mỗi chủ đề chương trước >= 20%', () => {
  for (const ch of chapters) {
    const cs = specs.filter(s => s.chapter === ch);
    const count = t => cs.filter(s => s.topics[t]).length;
    for (const t of resolvedTopics(ch)) ok(count(t.use) >= Math.ceil(QUOTA.cur * CHAPTER_LEN), `ch${ch} ${t.use}: ${count(t.use)}/20`);
    const prev = ch === 3 ? CH2_TOPICS : resolvedTopics(ch - 1).map(t => t.use);
    for (const t of prev) ok(count(t) >= Math.ceil(QUOTA.prev * CHAPTER_LEN), `ch${ch} (chương trước) ${t}: ${count(t)}/20`);
  }
});

test('không có 3 đỉnh (bump/HARD/SUPER) liên tiếp, kể cả nối từ L1-L20 luật A; giữa 3 đỉnh liên tiếp luôn có level nghỉ', () => {
  const norm = r => (r === 'hard' ? 'HARD' : r === 'superhard' ? 'SUPER' : r === 'breather' ? 'br' : r);
  const seq = [...LEVELS_A.map(l => norm(l.special || l.role)), ...specs.map(s => s.role)];
  for (let i = 2; i < seq.length; i++) ok(!(PEAK.has(seq[i]) && PEAK.has(seq[i - 1]) && PEAK.has(seq[i - 2])), `L${i - 1}-L${i + 1}: 3 đỉnh liền`);
  const peaks = seq.map((r, i) => [r, i]).filter(([r]) => PEAK.has(r)).map(([, i]) => i);
  for (let j = 2; j < peaks.length; j++) {
    const [a, , c] = [peaks[j - 2], peaks[j - 1], peaks[j]];
    ok(seq.slice(a + 1, c).some(r => BREATHER.has(r)), `L${a + 1}..L${c + 1}: 3 đỉnh không có level nghỉ ở giữa`);
  }
});

test('mỗi chương 4 level nghỉ, 1 HARD, 1 SUPER; HARD/SUPER có special và mục tiêu c10/sk', () => {
  for (const ch of chapters) {
    const cs = specs.filter(s => s.chapter === ch);
    ok(cs.filter(s => BREATHER.has(s.role)).length === 4, `ch${ch}: số level nghỉ`);
    ok(cs.filter(s => s.role === 'HARD').length === 1 && cs.filter(s => s.role === 'SUPER').length === 1, `ch${ch}: đỉnh`);
  }
  for (const s of specs) {
    if (s.role === 'HARD') ok(s.special === 'hard' && s.targets.c10 && s.targets.sk, `L${s.id}`);
    else if (s.role === 'SUPER') ok(s.special === 'superhard' && s.targets.c10 && s.targets.sk, `L${s.id}`);
    else ok(!s.special && s.targets.c25 && s.targets.o35 && s.targets.o35p5, `L${s.id}: thiếu mục tiêu c25/o35/o35p5`);
    ok(s.slackFloor >= 1 && s.slackFloor <= CAP.slackMax && s.maxStuck >= 0, `L${s.id}: slack/kẹt`);
  }
});

test('biến thể cấu trúc: bao thư lớn L41 (n 8 hoặc fallback 7), 5 cột từ L66, 3 khay ở level nghỉ p16, mở sẵn L87', () => {
  const s41 = specFor(41);
  ok(s41.bigEnvelope && s41.topics[s41.bigEnvelope.topic] === s41.bigEnvelope.n && s41.bigEnvelope.n >= 7, 'L41');
  ok(specFor(65).cols.length === 4 && specFor(66).cols.length === 5, 'L66');
  for (const s of specs.filter(x => x.p === 16)) ok(s.F === 3 && BREATHER.has(s.role), `L${s.id}: 3 khay`);
  ok(specFor(87).preplace && specFor(87).topics[specFor(87).preplace] && BREATHER.has(specFor(87).role), 'L87');
});

test('33 chủ đề mới: fallback khác nhau, có art >= 5, không trùng chương 2, không CONFUSE trong chương và với chương trước', () => {
  const fb = Object.values(CHAPTER_TOPICS).flatMap(c => c.topics.map(t => t.fallback));
  ok(fb.length === 33 && new Set(fb).size === 33, `fallback trùng: ${fb.filter((t, i) => fb.indexOf(t) !== i)}`);
  for (const t of fb) ok(hasArt(t, NEW_ART_MIN) && !CH2_TOPICS.includes(t), `fallback ${t}`);
  for (let ch = 3; ch <= 13; ch++) {
    const set = resolvedTopics(ch).map(t => t.use);
    // Fishing <-> Picnic (ch8) nhầm trên ảnh thật, được chấp nhận: spec không bao giờ đặt chung (test "0 cặp CONFUSE"), hạn mức vẫn đạt
    const bad = confusePairs(set).filter(([a, b]) => !(a === 'Fishing' && b === 'Picnic') && !(a === 'Picnic' && b === 'Fishing'));
    ok(!bad.length, `ch${ch}: ${bad}`);
  }
});

test('tất định: 2 lần chạy CLI cho cùng hash', () => {
  const cli = fileURLToPath(new URL('../level_spec.mjs', import.meta.url));
  const h = () => createHash('sha256').update(execFileSync(process.execPath, [cli, '--print=21-240', '--json'])).digest('hex');
  const a = h(), b = h();
  ok(a === b, `${a} != ${b}`);
});

test('CLI --print=21-240 in đúng 220 dòng bảng', () => {
  const cli = fileURLToPath(new URL('../level_spec.mjs', import.meta.url));
  const out = execFileSync(process.execPath, [cli, '--print=21-240']).toString();
  const rows = out.split('\n').filter(l => /^\| \d+ \|/.test(l));
  ok(rows.length === 220, `${rows.length} dòng`);
});

let fail = 0;
for (const r of results) { console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '\n      ' + r.msg}`); if (!r.ok) fail++; }
const quota = chapters.map(ch => buildChapter(ch).quotas.map(q => `${q.topic} ${q.got}/${q.need}`).join(', '));
console.log(`\n${results.length - fail}/${results.length} pass.`);
if (process.argv.includes('--verbose')) quota.forEach((q, i) => console.log(`ch${chapters[i]}: ${q}`));
process.exit(fail ? 1 : 0);
