// WebAudio: nạp trước toàn bộ sfx, phát không trễ, hỗ trợ pitch/volume.
const FILES = {
  pick: 'pickcard', place: 'addcardnormal', open: 'sfndocktopic', complete: 'endaddtopic',
  flip: 'changefacecard', back: 'backcard', draw: 'spawncard', hint: 'suggest', joker: 'boosterchoosetopic',
  magnet: 'magnet', feature: 'newfeature', slot: 'unlockdock', win: 'wins', lose: 'outofmove', coin: 'coin',
  coins: 'coincollect', claim: 'endclaimcoin', click: 'click', close: 'close', whoosh: 'iconmove',
  sparkle: 'etfx_spawn', boom: 'etfx_explosion_magic2',
};
for (let i = 1; i <= 11; i++) FILES['combo' + i] = `collectable_card_flying_v2_var_${String(i).padStart(2, '0')}`;

let ctx = null;
let master = null;
const buffers = {};
let muted = false;
try { muted = localStorage.getItem('ss_muted') === '1'; } catch (e) { /* storage bị chặn */ }

export async function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(ctx.destination);
  await Promise.all(Object.entries(FILES).map(async ([k, f]) => {
    try {
      const res = await fetch(`assets/audio/${f}.mp3`);
      buffers[k] = await ctx.decodeAudioData(await res.arrayBuffer());
    } catch (e) { /* thiếu file: im lặng */ }
  }));
}

export function unlockAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

const lastPlay = {};
export function sfx(name, { vol = 1, rate = 1, delay = 0 } = {}) {
  if (!ctx || !buffers[name] || muted) return;
  const now = ctx.currentTime;
  if (lastPlay[name] && now - lastPlay[name] < 0.03 && !delay) return;   // chống chồng tiếng
  lastPlay[name] = now;
  const src = ctx.createBufferSource();
  src.buffer = buffers[name];
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(g).connect(master);
  src.start(now + delay);
}

export function comboSfx(step) {
  const i = Math.max(1, Math.min(11, step));
  sfx('combo' + i, { vol: 0.9 });
}

export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('ss_muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
  if (master) master.gain.value = m ? 0 : 0.8;
}
export const isMuted = () => muted;

export function haptic(p) {
  const ua = navigator.userActivation;
  if (ua && !ua.hasBeenActive) return;            // trình duyệt chặn rung trước lần chạm đầu
  if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } }
}
