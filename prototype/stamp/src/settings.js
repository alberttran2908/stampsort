// Cài đặt của MÁY (R13, docs/design/r12-r13-tech-notes.md): cỡ chữ, âm lượng SFX, giảm chuyển động.
// Không nằm trong save tiến trình (save tách theo variant A/B), không cần migration: khoá chưa có thì dùng mặc định.
// Các công tắc đã có khoá riêng giữ nguyên, bảng Cài đặt đọc/ghi qua API sẵn có:
//   ngôn ngữ 'ss_lang' (copy.js), rung 'ss_haptics' (haptics.js), nhạc 'ss_music' (audio.js).
// Mặc định cho người lớn tuổi (older-players-pass.md): chữ Lớn, SFX Vừa.

const KEY = 'ss_settings';
const DEFAULTS = { text: 1, sfx: 2, motion: 'auto' };
const VALID = { text: [0, 1, 2], sfx: [0, 1, 2], motion: ['auto', 'reduce'] };
/** Hệ số cỡ chữ cho 3 mức Thường / Lớn / Rất lớn (biến CSS --fs). */
export const TEXT_SCALE = [1, 1.15, 1.3];

let cur = { ...DEFAULTS };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const got = JSON.parse(raw) || {};
    for (const k of Object.keys(VALID)) if (VALID[k].includes(got[k])) cur[k] = got[k];
  } else if (localStorage.getItem('ss_muted') === '1') {
    cur.sfx = 0;                                   // người đã tắt âm ở nút cũ trong Pause: giữ tắt
  }
} catch (e) { /* storage bị chặn: dùng mặc định */ }

const listeners = new Set();

export function getSetting(k) { return cur[k]; }

export function setSetting(k, v) {
  if (!VALID[k] || !VALID[k].includes(v)) return false;
  const from = cur[k];
  if (from === v) return false;
  cur = { ...cur, [k]: v };
  try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) { /* ignore */ }
  for (const fn of listeners) { try { fn(k, v, from); } catch (e) { /* listener lỗi không chặn listener khác */ } }
  return true;
}

/** Đăng ký nghe thay đổi: fn(key, to, from). Trả về hàm huỷ. */
export function onSetting(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const textScale = () => TEXT_SCALE[cur.text] || 1;
