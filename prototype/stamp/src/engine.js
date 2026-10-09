// Luật chơi thuần (không DOM). Dùng chung cho game, solver và tools/gen_proto_levels.mjs.
// Luật theo docs/design/prototype-10-levels.md mục 2.

export const JOKER = 'joker';

/** Tạo state từ level data. Level: { foundations, moves, columns:[[card]], deck:[card], preplaced:[[card]] }
 *  card: { id, t, k:'topic'|'stamp', art?, n? }. columns[i][0] = đáy; deck[0] = lá rút đầu tiên. */
export function createState(level) {
  const cols = level.columns.map(col => col.map((c, i) => ({ ...c, up: i === col.length - 1 })));
  const found = Array.from({ length: level.foundations }, () => null);
  (level.preplaced || []).forEach((stack, i) => {
    const [topic, ...rest] = stack.map(c => ({ ...c, up: true }));
    found[i] = { t: topic.t, n: topic.n, topic, cards: rest };
  });
  let total = 0;
  for (const col of level.columns) total += col.length;
  total += level.deck.length;
  for (const s of level.preplaced || []) total += s.length;
  let delivered = 0;
  for (const s of level.preplaced || []) delivered += s.length;
  return {
    cols,
    deck: level.deck.slice().reverse().map(c => ({ ...c, up: false })),   // phần tử cuối = lá trên cùng của deck
    waste: [],
    found,
    extraSlot: false,
    moves: level.moves == null ? Infinity : level.moves,
    used: 0,
    delivered,
    total,
    jokerCount: 0,
  };
}

export function clone(s) {
  return {
    cols: s.cols.map(c => c.map(x => ({ ...x }))),
    deck: s.deck.map(c => ({ ...c })),
    waste: s.waste.map(c => ({ ...c })),
    found: s.found.map(f => (f ? { ...f, topic: { ...f.topic }, cards: f.cards.map(c => ({ ...c })) } : null)),
    extraSlot: s.extraSlot,
    moves: s.moves,
    used: s.used,
    delivered: s.delivered,
    total: s.total,
    jokerCount: s.jokerCount,
  };
}

export const isWon = s => s.delivered >= s.total;
export const isLost = s => !isWon(s) && s.moves <= 0;

/** Chồng bài có thể nhấc từ cột i bắt đầu ở vị trí idx (idx..cuối). null nếu không hợp lệ. */
export function runAt(s, i, idx) {
  const col = s.cols[i];
  if (!col || idx < 0 || idx >= col.length) return null;
  const run = col.slice(idx);
  if (run.some(c => !c.up)) return null;
  // Joker ("Play on any card"): chỉ được nằm ở đáy chồng; phía trên là một chồng cùng topic hợp lệ (có thể rỗng)
  let k = 0;
  if (run[0].k === JOKER) k = 1;
  if (run.slice(k).some(c => c.k === JOKER)) return null;
  const rest = run.slice(k);
  if (!rest.length) return run;
  const t = rest[0].t;
  for (let j = 0; j < rest.length; j++) {
    if (rest[j].t !== t) return null;
    if (j > 0 && rest[j].k === 'topic') return null;   // topic stamp chỉ được nằm ở đáy chồng (hoặc ngay trên Joker)
  }
  return run;
}

/** Vị trí thấp nhất có thể nhấc cả chồng ở cột i (chồng dài nhất ở đỉnh). -1 nếu cột rỗng/không nhấc được. */
export function maxRunStart(s, i) {
  const col = s.cols[i];
  if (!col.length) return -1;
  let idx = col.length - 1;
  if (!runAt(s, i, idx)) return -1;
  while (idx > 0 && runAt(s, i, idx - 1)) idx--;
  return idx;
}

export function sourceCards(s, src) {
  if (src.from === 'waste') return s.waste.length ? [s.waste[s.waste.length - 1]] : null;
  return runAt(s, src.i, src.idx);
}

/** Kiểm tra nước đi. Trả về null nếu hợp lệ, hoặc mã lý do. */
export function checkMove(s, src, dst) {
  if (isWon(s)) return 'won';
  if (s.moves <= 0) return 'no_moves';
  const run = sourceCards(s, src);
  if (!run) return 'bad_source';
  const base = run[0];
  if (base.k === JOKER) {
    // Joker đi cùng chồng trên nó, đặt được lên bất kỳ lá nào hoặc cột trống; không vào ô
    if (dst.to !== 'col' || !s.cols[dst.j]) return 'bad_target';
    if (src.from === 'col' && src.i === dst.j) return 'same';
    return null;
  }
  if (dst.to === 'found') {
    const f = s.found[dst.i];
    if (f === undefined) return 'bad_target';
    if (!f) return base.k === 'topic' ? null : 'need_topic';
    if (base.t !== f.t) return 'wrong_topic';
    if (base.k === 'topic') return 'wrong_topic';
    if (f.cards.length + run.length > f.n) return 'wrong_topic';
    return null;
  }
  if (dst.to === 'col') {
    if (src.from === 'col' && src.i === dst.j) return 'same';
    const col = s.cols[dst.j];
    if (!col) return 'bad_target';
    if (!col.length) return null;
    const top = col[col.length - 1];
    if (top.k === JOKER) return null;
    if (base.k === 'topic') return 'topic_on_card';
    if (top.t === base.t) return null;
    return 'wrong_topic';
  }
  return 'bad_target';
}

/** Thực hiện nước đi (mutate). Trả về danh sách event cho UI. */
export function applyMove(s, src, dst) {
  const why = checkMove(s, src, dst);
  if (why) return { ok: false, why };
  const events = [];
  let run;
  if (src.from === 'waste') run = [s.waste.pop()];
  else run = s.cols[src.i].splice(src.idx);
  // Lá từ deck/waste chưa từng có cờ up: phải ghi rõ là ngửa, nếu không layout và runAt coi nó là lá úp.
  for (const c of run) c.up = true;
  s.moves -= 1;
  s.used += 1;
  events.push({ type: 'move', cards: run.map(c => c.id), src, dst });
  if (dst.to === 'found') {
    let f = s.found[dst.i];
    let rest = run;
    if (!f) {
      f = s.found[dst.i] = { t: run[0].t, n: run[0].n, topic: run[0], cards: [] };
      rest = run.slice(1);
      events.push({ type: 'open', slot: dst.i, t: f.t });
    }
    f.cards.push(...rest);
    s.delivered += run.length;
    events.push({ type: 'deliver', slot: dst.i, count: f.cards.length, n: f.n, added: run.length });
    if (f.cards.length >= f.n) {
      events.push({ type: 'complete', slot: dst.i, t: f.t, cards: [f.topic.id, ...f.cards.map(c => c.id)] });
      s.found[dst.i] = null;
    }
  } else {
    s.cols[dst.j].push(...run);
  }
  if (src.from === 'col') {
    const col = s.cols[src.i];
    const top = col[col.length - 1];
    if (top && !top.up) {
      top.up = true;
      events.push({ type: 'flip', col: src.i, id: top.id });
    }
  }
  return { ok: true, events };
}

/** Rút 1 lá (1 move). Deck rỗng thì lật waste về deck (0 move). */
export function draw(s) {
  if (s.deck.length) {
    if (s.moves <= 0) return { ok: false, why: 'no_moves' };
    const c = s.deck.pop();
    c.up = true;
    s.waste.push(c);
    s.moves -= 1;
    s.used += 1;
    return { ok: true, events: [{ type: 'draw', id: c.id }] };
  }
  if (s.waste.length) {
    s.deck = s.waste.reverse();
    for (const c of s.deck) c.up = false;
    s.waste = [];
    return { ok: true, events: [{ type: 'recycle' }] };
  }
  return { ok: false, why: 'empty' };
}

/** Joker: đặt lá vàng lên đỉnh cột j, 0 move. Sau đó mọi chồng đặt lên được. */
export function placeJoker(s, j, id) {
  const col = s.cols[j];
  if (!col) return { ok: false, why: 'bad_target' };
  col.push({ id, t: JOKER, k: JOKER, up: true });
  s.jokerCount += 1;
  return { ok: true, events: [{ type: 'joker', col: j, id }] };
}

export function addExtraSlot(s) {
  if (s.extraSlot) return { ok: false };
  s.extraSlot = true;
  s.found.push(null);
  return { ok: true, events: [{ type: 'slot', slot: s.found.length - 1 }] };
}

/** Mọi nước đi hợp lệ (không gồm draw). Dùng cho solver, hint, auto-move. */
export function legalMoves(s) {
  const out = [];
  const srcs = [];
  if (s.waste.length) srcs.push({ from: 'waste' });
  s.cols.forEach((col, i) => {
    const start = maxRunStart(s, i);
    if (start < 0) return;
    for (let idx = start; idx < col.length; idx++) srcs.push({ from: 'col', i, idx });
  });
  for (const src of srcs) {
    for (let k = 0; k < s.found.length; k++) {
      const dst = { to: 'found', i: k };
      if (!checkMove(s, src, dst)) out.push({ src, dst });
    }
    for (let j = 0; j < s.cols.length; j++) {
      const dst = { to: 'col', j };
      if (!checkMove(s, src, dst)) out.push({ src, dst });
    }
  }
  return out;
}

/** Đích tốt nhất cho một nguồn khi người chơi chạm (tap-to-move). */
export function bestTargetFor(s, src) {
  if (s.moves <= 0) return null;
  const run = sourceCards(s, src);
  if (!run) return null;
  if (run[0].k === JOKER) {
    // chạm Joker: chuyển sang cột trống, nếu không có thì cột ngắn nhất (để mở lá bên dưới)
    let best = null;
    s.cols.forEach((col, j) => {
      if (src.from === 'col' && j === src.i) return;
      if (best === null || col.length < s.cols[best].length) best = j;
    });
    return best === null ? null : { to: 'col', j: best };
  }
  // 1) foundation cùng topic
  for (let k = 0; k < s.found.length; k++) {
    const f = s.found[k];
    if (f && !checkMove(s, src, { to: 'found', i: k })) return { to: 'found', i: k };
  }
  // 2) topic stamp -> hộc trống
  if (run[0].k === 'topic') {
    const k = s.found.findIndex(f => f === null);
    if (k >= 0) return { to: 'found', i: k };
  }
  // 3) cột có đỉnh cùng topic (ưu tiên cột lộ nhiều lá úp hơn)
  const same = [];
  const joker = [];
  const empty = [];
  s.cols.forEach((col, j) => {
    const dst = { to: 'col', j };
    if (checkMove(s, src, dst)) return;
    if (!col.length) empty.push(j);
    else if (col[col.length - 1].k === JOKER) joker.push(j);
    else same.push(j);
  });
  if (same.length) return { to: 'col', j: same[0] };
  // 4) cột trống, chỉ khi nhấc chồng ra giúp lộ lá (không đổi cột rỗng này sang cột rỗng khác)
  const fromBottom = src.from === 'col' && src.idx === 0;
  if (empty.length && !fromBottom) return { to: 'col', j: empty[0] };
  if (joker.length) return { to: 'col', j: joker[0] };
  return null;
}

export function stateKey(s) {
  const cols = s.cols.map(c => c.map(x => (x.up ? x.id : '~' + x.id)).join(',')).sort().join('|');
  const found = s.found.map(f => (f ? f.t + ':' + f.cards.length : '_')).sort().join(',');
  return cols + '#' + s.deck.length + ':' + s.waste.map(c => c.id).join(',') + '#' + found;
}

// ---------------- Pack / Stamper ----------------
/** Vị trí các stamp thuộc topic t, chia thành lá ẩn (úp / trong deck) và lá đang nhìn thấy. */
export function cardsOfTopic(s, t) {
  const hidden = [];
  const visible = [];
  s.cols.forEach((col, i) => col.forEach((c, j) => {
    if (c.t !== t || c.k !== 'stamp') return;
    (c.up ? visible : hidden).push({ where: 'col', i, id: c.id });
  }));
  s.deck.forEach(c => { if (c.t === t && c.k === 'stamp') hidden.push({ where: 'deck', id: c.id }); });
  s.waste.forEach(c => { if (c.t === t && c.k === 'stamp') visible.push({ where: 'waste', id: c.id }); });
  return { hidden, visible };
}

/** Booster: đưa tối đa `count` stamp của ô k vào ô (ưu tiên lá ẩn), 0 move. */
/** Stamper (review game design 2026-10-10): lật ngửa toàn bộ lá úp của một cột. Booster thông tin, đánh vào nguyên nhân kẹt;
 *  không tốn move, lá không di chuyển. */
export function revealColumn(s, i) {
  const col = s.cols[i];
  if (!col || !col.some(c => !c.up)) return { ok: false, why: 'none_hidden' };
  const events = [];
  col.forEach(c => { if (!c.up) { c.up = true; events.push({ type: 'flip', col: i, id: c.id }); } });
  return { ok: true, events };
}
export function pullToFoundation(s, k, count, rnd = Math.random) {
  const f = s.found[k];
  if (!f) return { ok: false, why: 'no_pile' };
  const need = f.n - f.cards.length;
  const { hidden, visible } = cardsOfTopic(s, f.t);
  const pick = [];
  const take = (arr) => {
    const a = arr.slice();
    while (a.length && pick.length < Math.min(count, need)) pick.push(a.splice(Math.floor(rnd() * a.length), 1)[0]);
  };
  take(hidden);
  take(visible);
  if (!pick.length) return { ok: false, why: 'none_left' };
  const ids = new Set(pick.map(p => p.id));
  const moved = [];
  const fromUp = {};
  s.cols.forEach((col, i) => {
    for (let j = col.length - 1; j >= 0; j--) if (ids.has(col[j].id)) { fromUp[col[j].id] = col[j].up; moved.push(col.splice(j, 1)[0]); }
  });
  for (let j = s.deck.length - 1; j >= 0; j--) if (ids.has(s.deck[j].id)) { fromUp[s.deck[j].id] = false; moved.push(s.deck.splice(j, 1)[0]); }
  for (let j = s.waste.length - 1; j >= 0; j--) if (ids.has(s.waste[j].id)) { fromUp[s.waste[j].id] = true; moved.push(s.waste.splice(j, 1)[0]); }
  const events = [{ type: 'pull', slot: k, cards: moved.map(c => c.id), wasUp: moved.map(c => fromUp[c.id]) }];
  s.cols.forEach((col, i) => {
    const top = col[col.length - 1];
    if (top && !top.up) { top.up = true; events.push({ type: 'flip', col: i, id: top.id }); }
  });
  moved.forEach(c => { c.up = true; });
  f.cards.push(...moved);
  s.delivered += moved.length;
  events.push({ type: 'deliver', slot: k, count: f.cards.length, n: f.n, added: moved.length });
  if (f.cards.length >= f.n) {
    events.push({ type: 'complete', slot: k, t: f.t, cards: [f.topic.id, ...f.cards.map(c => c.id)] });
    s.found[k] = null;
  }
  return { ok: true, events };
}
