#!/usr/bin/env python3
"""Tổng hợp nhạc nền và âm thanh không khí "Little Post Office" (vòng P10, docs/design/benchmark-grand-games.md mục 6.3).

Tự tổng hợp bằng toán, không dùng sample hay nhạc có bản quyền, nên commit được vào repo public.
Dùng chung bộ tổng hợp và bộ đo của tools/synth_sfx.py (mộc cầm, hộp nhạc, reverb phòng gỗ, K-weighting).

  home.mp3      màn chính: piano nỉ (felt piano) + hộp nhạc + contrabass gảy nhẹ, 76 BPM, 24 ô nhịp (~76 s)
  play.mp3      màn chơi: piano nỉ thưa + hộp nhạc rất thưa + nền ấm nhỏ, 66 BPM, 20 ô nhịp (~73 s)
  ambience.mp3  bưu điện: room tone gỗ, giấy sột soạt thưa, đồng hồ quả lắc rất nhỏ, chim xa ngoài cửa sổ (40 s)

Nguyên tắc:
  - Thang C trưởng ngũ cung (C D E G A), trùng bộ SFX v3, nên SFX chồng lên nhạc không lệch tông.
    Hợp âm cũng chỉ dùng nốt ngũ cung (C6/9, Am7, Dm9sus, G9sus), không có nốt F, B.
  - Không trống, không nốt cao chói: giai điệu tối đa A5, lowpass 4 kHz, highpass 120 Hz.
  - Vòng lặp liền mạch: render dài hơn rồi gập phần đuôi (nốt ngân, reverb) về đầu, nên tín hiệu tuần hoàn đúng chu kỳ.
    File = 1 chu kỳ + XF giây đầu lặp lại ở cuối. audio.js phát bằng crossfade XF giây giữa 2 bản (không phụ thuộc
    độ trễ encoder mp3), nên điểm nối không có click.
  - File chuẩn hoá về LUFS tích hợp (BS.1770, có gate). audio.js nhân thêm gain trong meta.json để ra độ to trong game:
    nhạc -31 LUFS (dưới âm thao tác -28 khoảng 3 dB), ambience -38 ở màn chính, -42 ở màn chơi.
  - Mono, 22.05 kHz, mp3 64 kbps (ambience 48 kbps): mỗi file dưới 1 MB.

Dùng: python3 tools/synth_music.py            # ghi prototype/stamp/music/*.mp3 + music/meta.json (cần ffmpeg)
      python3 tools/synth_music.py play       # chỉ tạo 1 file
"""
import os, sys, json, subprocess, tempfile, wave
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import synth_sfx as S   # noqa: E402
from synth_sfx import SR, T, N, perc, lp, hp, norm, kalimba, wood_tick, reverb, kweight, rcos   # noqa: E402

ROOT = S.ROOT
OUT = os.path.join(ROOT, 'prototype/stamp/music')
XF = 2.0                  # giây crossfade ở điểm nối (file có thêm XF giây đầu lặp ở cuối)
EXTRA = 12.0              # render thêm để chứa đuôi nốt và reverb trước khi gập về đầu
IN_GAME = {'home': -31.0, 'play': -31.5, 'ambience': -38.0}   # LUFS mong muốn trong game
FILE_LUFS = {'home': -24.0, 'play': -24.0, 'ambience': -26.0}
AMB_PLAY_LUFS = -42.0
PENTA = ['C', 'D', 'E', 'G', 'A']


# ============================================================ nhạc cụ
def felt_piano(f, d=3.0, vel=0.6):
    """Piano nỉ: búa bọc nỉ dày nên ít hài cao, attack tròn ~7 ms, 2 dây lệch nhau 0.8 cent (ấm, có 'thở').
    Hài cao tắt nhanh hơn hài thấp; nốt càng cao ngân càng ngắn. Thêm 'thịch' nỉ rất nhỏ lúc búa chạm."""
    t = T(d)
    B = 0.00035                                                   # độ không điều hoà của dây
    t60 = float(np.clip(4.2 - 1.0 * np.log2(f / 130.8), 1.4, 4.2))
    roll = 0.75 - 0.35 * vel                                      # đánh nhẹ -> càng ít hài cao
    out = np.zeros_like(t)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 4200:
            break
        amp = k ** -1.4 * np.exp(-(k - 1) * roll)
        env = perc(d, t60 / (1 + 0.7 * (k - 1)), 0.007)
        for cents in (-0.8, 0.8):
            ph = S.rng.uniform(0, 2 * np.pi)
            out += 0.5 * amp * np.sin(2 * np.pi * fk * 2 ** (cents / 1200) * t + ph) * env
    thump = norm(lp(S.noise(0.04), 500)) * perc(0.04, 0.03, 0.003)
    out[:len(thump)] += 0.05 * vel * thump
    rel = int(0.25 * SR)                                          # nhả phím: tắt êm ở cuối d
    out[-rel:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(rel) / rel)
    return out * (0.35 + 0.65 * vel)


def pluck_bass(f, d=1.4, vel=0.6):
    """Contrabass gảy nhẹ (pizzicato): thân tròn, tắt nhanh, gần như không có hài trên 800 Hz."""
    s = S.modal(f, [(1, 1.0, 0.9), (2.0, 0.45, 0.5), (3.0, 0.15, 0.3), (4.02, 0.05, 0.2)], d, attack=0.006)
    return lp(s, 800) * vel


def music_box(f, d=1.6, vel=0.5):
    """Hộp nhạc dịu (kalimba của synth_sfx, cắt bớt sáng)."""
    return lp(kalimba(f, d), 3000) * vel


def soft_pad(notes, d, gain=1.0, attack=1.2, release=1.5):
    """Nền ấm rất nhỏ: sine + hài 2 nhẹ, 2 lớp lệch 3 cent (chorus chậm), attack/release dài."""
    t = T(d)
    n = len(t)
    na, nr = int(attack * SR), int(release * SR)
    env = np.ones(n)
    env[:na] = rcos(na)
    env[-nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / nr)
    out = np.zeros(n)
    for nm in notes:
        f = N(nm)
        for c in (-3, 3):
            fc = f * 2 ** (c / 1200)
            out += np.sin(2 * np.pi * fc * t) + 0.18 * np.sin(4 * np.pi * fc * t)
    return lp(out * env, 1800) * gain / max(1, len(notes))


# ============================================================ sáng tác
def scale(lo='C4', hi='A5'):
    allnotes = [f'{p}{o}' for o in range(2, 7) for p in PENTA]
    return [x for x in allnotes if N(lo) - 0.1 <= N(x) <= N(hi) + 0.1]


def melody(rng, chords_tones, bars, beats_per_bar=4, lo='C5', hi='A5', density=1.0, start='E5'):
    """Giai điệu ngũ cung đi bậc liền là chính, chia câu 2 ô nhịp, cuối câu dừng ở nốt trong hợp âm.
    Trả về list (beat bắt đầu, tên nốt, độ dài beat, vel)."""
    sc = scale(lo, hi)
    RHY = [  # mẫu nhịp 1 câu 2 ô (8 phách): (phách, độ dài)
        [(0, 1.5), (1.5, 0.5), (2, 2), (4, 3)],
        [(0, 1), (1, 1), (2, 2), (5, 3)],
        [(0, 2), (2, 1), (3, 1), (4, 4)],
        [(1, 1), (2, 1.5), (3.5, 0.5), (4, 3)],
        [(0, 3), (3, 1), (4, 4)],
        [(0, 2), (2.5, 1.5), (4, 2), (6, 2)],
    ]
    out = []
    i = sc.index(start) if start in sc else len(sc) // 2
    for ph in range(0, bars, 2):
        if rng.random() > density:                     # câu nghỉ cho thở
            continue
        rhy = RHY[rng.integers(len(RHY))]
        for j, (b, dur) in enumerate(rhy):
            beat = ph * beats_per_bar + b
            if j == len(rhy) - 1:                       # cuối câu: về nốt trong hợp âm gần nhất
                bar = min(bars - 1, int(beat // beats_per_bar))
                tones = [k for k, nm in enumerate(sc) if nm[:-1] in chords_tones[bar]]
                i = min(tones, key=lambda k: abs(k - i)) if tones else i
            else:
                step = int(rng.choice([-2, -1, 0, 1, 2], p=[0.1, 0.35, 0.1, 0.35, 0.1]))
                i = int(np.clip(i + step, 0, len(sc) - 1))
            out.append((beat, sc[i], dur, 0.42 + 0.12 * rng.random()))
    return out


def place(buf, at, sig, gain=1.0):
    i = int(round(at * SR))
    if i < 0:
        return
    end = min(len(buf), i + len(sig))
    buf[i:end] += sig[:end - i] * gain


def circular(x, L):
    """Gập phần sau L về đầu: tín hiệu tuần hoàn chu kỳ L mẫu."""
    y = x[:L].copy()
    rest = x[L:]
    k = 0
    while k < len(rest):
        seg = rest[k:k + L]
        y[:len(seg)] += seg
        k += L
    return y


def fft_noise(n, rng, shape):
    """Nhiễu tuần hoàn đúng n mẫu (lọc trong miền tần số), shape(f) -> biên độ."""
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(spec * shape(f), n)


# ---- bản nhạc
CHORDS_HOME = [  # (bass, nốt hợp âm tay trái, tên các nốt cho giai điệu)
    ('C3', ('G3', 'C4', 'E4'), 'CEGA'),        # C6/9
    ('A2', ('E3', 'A3', 'C4'), 'ACEG'),        # Am7
    ('D3', ('A3', 'C4', 'E4'), 'DACE'),        # Dm9 không có F (sus)
    ('G2', ('D3', 'G3', 'A3'), 'GACD'),        # G9sus4
]
CHORDS_PLAY = [
    ('A2', ('E3', 'A3', 'C4'), 'ACEG'),        # Am7
    ('C3', ('G3', 'C4', 'E4'), 'CEGA'),        # C6/9
    ('G2', ('D3', 'G3', 'A3'), 'GACD'),        # G9sus4
    ('C3', ('E3', 'G3', 'D4'), 'CEGD'),        # Cadd9
]


def song_home():
    rng = np.random.default_rng(1976)
    S.rng = np.random.default_rng(76)
    bpm, bars = 76, 24
    beat = 60 / bpm
    L = int(round(bars * 4 * beat * SR))
    buf = np.zeros(L + int(EXTRA * SR))
    prog = [CHORDS_HOME[(b // 2) % 4] for b in range(bars)]                # mỗi hợp âm 2 ô nhịp
    hum = lambda: rng.normal(0, 0.008)                                      # lệch nhịp kiểu người đánh
    for b, (bass, lh, _) in enumerate(prog):
        t0 = b * 4 * beat
        sec = b // 8                                                         # 0: A, 1: B, 2: A'
        # tay trái piano nỉ: nốt trầm phách 1, rải hợp âm phách 2 và 3.5 (ô thứ hai của hợp âm thưa hơn)
        first = b % 2 == 0
        place(buf, t0 + hum(), felt_piano(N(bass if N(bass) >= N('C3') else bass[0] + '3'), 4.0, 0.32 if first else 0.24))
        place(buf, t0 + beat + hum(), felt_piano(N(lh[0]), 3.0, 0.3))
        place(buf, t0 + 2.5 * beat + hum(), felt_piano(N(lh[1]), 3.0, 0.28))
        if first or sec == 1:
            place(buf, t0 + 3 * beat + hum(), felt_piano(N(lh[2]), 2.6, 0.24))
        # contrabass gảy ở đoạn B và A'
        if sec >= 1:
            place(buf, t0 + hum(), pluck_bass(N(bass), 1.6, 0.4))
            if sec == 1 and not first:
                place(buf, t0 + 2 * beat + hum(), pluck_bass(N(bass) * 1.5, 1.2, 0.35))    # quãng 5
    tones = [c[2] for c in prog]
    # giai điệu: A piano nỉ (C5..A5), B hộp nhạc, A' piano thưa hơn
    for (bt, nm, dur, vel) in melody(rng, tones[0:8], 8, lo='C5', hi='A5', density=0.9, start='E5'):
        place(buf, bt * beat + hum(), felt_piano(N(nm), max(1.6, dur * beat + 1.2), vel))
    for (bt, nm, dur, vel) in melody(rng, tones[8:16], 8, lo='C5', hi='A5', density=1.0, start='G5'):
        place(buf, (32 + bt) * beat + hum(), music_box(N(nm), 1.6, vel * 0.9))
    for (bt, nm, dur, vel) in melody(rng, tones[16:24], 8, lo='C5', hi='G5', density=0.7, start='E5'):
        place(buf, (64 + bt) * beat + hum(), felt_piano(N(nm), max(1.6, dur * beat + 1.2), vel * 0.9))
    return buf, L, dict(bpm=bpm, bars=bars)


def song_play():
    rng = np.random.default_rng(1966)
    S.rng = np.random.default_rng(66)
    bpm, bars = 66, 20
    beat = 60 / bpm
    L = int(round(bars * 4 * beat * SR))
    buf = np.zeros(L + int(EXTRA * SR))
    prog = [CHORDS_PLAY[(b // 2) % 4] for b in range(bars)]
    hum = lambda: rng.normal(0, 0.008)
    for b, (bass, lh, _) in enumerate(prog):
        t0 = b * 4 * beat
        if b % 2 == 0:   # hợp âm đổi: nền ấm rất nhỏ ngân 2 ô nhịp + nốt trầm + hợp âm rải chậm
            place(buf, t0, soft_pad([lh[0], lh[1], lh[2]], 8 * beat + 1.5, 0.13))
            place(buf, t0 + hum(), felt_piano(N(bass if N(bass) >= N('C3') else bass[0] + '3'), 5.0, 0.28))
            for k, nm in enumerate(lh):
                place(buf, t0 + (1 + k * 0.5) * beat + hum(), felt_piano(N(nm), 4.0, 0.24))
        else:            # ô thứ hai: 1 nốt nhắc lại rất nhẹ
            place(buf, t0 + 2 * beat + hum(), felt_piano(N(lh[1]), 3.0, 0.2))
    tones = [c[2] for c in prog]
    # giai điệu thưa: piano nỉ ở nửa đầu, hộp nhạc ở nửa sau, nhiều câu nghỉ
    for (bt, nm, dur, vel) in melody(rng, tones[0:10], 10, lo='C5', hi='G5', density=0.6, start='E5'):
        place(buf, bt * beat + hum(), felt_piano(N(nm), max(2.0, dur * beat + 1.5), vel * 0.9))
    for (bt, nm, dur, vel) in melody(rng, tones[10:20], 10, lo='C5', hi='A5', density=0.6, start='A5'):
        place(buf, (40 + bt) * beat + hum(), music_box(N(nm), 1.8, vel * 0.75))
    return buf, L, dict(bpm=bpm, bars=bars)


def ambience():
    """Bưu điện nhỏ buổi sáng: room tone, giấy, đồng hồ quả lắc rất nhỏ, chim xa (lọc như nghe qua cửa sổ)."""
    rng = np.random.default_rng(404)
    S.rng = np.random.default_rng(405)
    dur = 40.0
    L = int(dur * SR)
    # room tone: nhiễu nâu nhẹ dưới 600 Hz, tuần hoàn đúng L (không gập được vì là nhiễu liên tục)
    room = fft_noise(L, rng, lambda f: np.where(f > 60, 1 / np.sqrt(np.maximum(f, 1)), 0) / (1 + (f / 600) ** 4))
    room = norm(room)
    ev = np.zeros(L + int(EXTRA * SR))
    # giấy sột soạt: 6 lần thưa, mỗi lần 0.4-1.2 s
    for at in (2.5, 9.0, 15.5, 22.0, 29.5, 35.0):
        at += rng.uniform(-0.8, 0.8)
        d = rng.uniform(0.4, 1.2)
        env = np.sin(np.pi * np.clip(T(d) / d, 0, 1)) ** 1.5
        rust = 0.6 * S.crackle(d, 140, 900, 3200) + 0.4 * norm(S.bp(S.noise(d), 500, 2200))
        place(ev, at, rust * env, 0.07)
    # đồng hồ quả lắc: tích (1.0 s) - tắc, gỗ trầm, rất nhỏ
    for k in range(int(dur)):
        place(ev, k + 0.02, lp(wood_tick(820 if k % 2 == 0 else 690, 0.06), 1800), 0.05)
    # chim xa: 4 cụm, mỗi cụm 2-4 tiếng hót ngắn đi lên, lọc tối như qua cửa kính
    birds = np.zeros_like(ev)
    for at in (4.0, 13.0, 24.5, 33.0):
        at += rng.uniform(-1, 1)
        base = rng.uniform(2300, 2900)
        for j in range(int(rng.integers(2, 5))):
            d = rng.uniform(0.07, 0.12)
            t = T(d)
            f = base * (1 + 0.35 * (t / d) ** 0.7) * (1 + 0.04 * j)
            chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2
            place(birds, at + j * rng.uniform(0.14, 0.22), chirp, 0.6)
    birds = lp(reverb(birds, 0.5, 1.2, 2500)[:len(ev)], 3200, 4)
    ev = reverb(ev, 0.18, 0.7, 3000)[:len(ev)] + 0.08 * birds
    y = circular(ev, L) + 0.035 * room
    return hp(np.concatenate([y[-int(0.5 * SR):], y]), 120)[int(0.5 * SR):], L, dict(seconds=dur)


# ============================================================ đo & ghi
def lufs_i(x):
    """Loudness tích hợp BS.1770-4 (khối 400 ms, chồng 75%, gate tuyệt đối -70, gate tương đối -10)."""
    y = kweight(x)
    w, hop = int(0.4 * SR), int(0.1 * SR)
    cs = np.concatenate([[0], np.cumsum(y * y)])
    ms = (cs[w::hop] - cs[:-w:hop]) / w
    lk = -0.691 + 10 * np.log10(ms + 1e-15)
    ms = ms[lk > -70]
    rel = -0.691 + 10 * np.log10(ms.mean() + 1e-15) - 10
    ms = ms[-0.691 + 10 * np.log10(ms + 1e-15) > rel]
    return -0.691 + 10 * np.log10(ms.mean() + 1e-15)


def soft_compress(y, above_db=4.0, ratio=2.0, win=0.3):
    """Nén mềm, tuần hoàn (cửa sổ tính vòng quanh điểm nối): nốt giai điệu không nhô quá nền,
    nhạc nằm yên dưới SFX. Ngưỡng = mức RMS trung vị + above_db."""
    n = int(win * SR)
    k = np.ones(n) / n
    ext = np.concatenate([y[-n:], y, y[:n]])
    rms = np.sqrt(np.convolve(ext * ext, k, mode='same')[n:-n] + 1e-12)
    lev = 20 * np.log10(rms)
    thr = np.median(lev[lev > lev.max() - 40]) + above_db
    gr = np.minimum(0.0, (thr - lev) * (1 - 1 / ratio))
    g = 10 ** (gr / 20)
    g = np.concatenate([g[-n:], g, g[:n]])
    g = np.convolve(g, k, mode='same')[n:-n]
    return y * g


def finish_loop(x, L, periodic=False):
    """Lọc (trước khi gập, để cả phần vang của bộ lọc cũng tuần hoàn), gập về chu kỳ L."""
    x = hp(x, 120)                                                # như SFX v3: không dồn năng lượng dưới loa điện thoại
    x = S.peq(x, 190, -5, 0.7)                                    # bớt ù dải 150-250 Hz (nốt trầm piano ngân dài)
    x = lp(x, 4000, 4)
    return x[:L] if periodic else circular(x, L)


def write_mp3(path, x, kbps):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ar', '22050', '-ac', '1', '-codec:a', 'libmp3lame',
                    '-b:a', f'{kbps}k', '-write_xing', '1', path], check=True)
    os.unlink(tmp)


def seam_db(y):
    """Sai biệt tại điểm nối so với đỉnh: |y[0] - y[-1]| trừ đi bước trung bình quanh đó (dB so với đỉnh)."""
    jump = abs(y[0] - y[-1])
    local = np.median(np.abs(np.diff(np.concatenate([y[-200:], y[:200]]))))
    return 20 * np.log10(max(jump - local, 1e-9) / (np.abs(y).max() + 1e-12))


TRACKS = {'home': song_home, 'play': song_play, 'ambience': ambience}


def build(name):
    raw, L, info = TRACKS[name]()
    if name == 'ambience':
        y = raw                                                   # đã tuần hoàn và đã lọc
    else:
        y = soft_compress(finish_loop(reverb(raw, 0.38, 2.4, 2400), L))
    y = y * 10 ** ((FILE_LUFS[name] - lufs_i(y)) / 20)
    peak = np.abs(y).max()
    if peak > 0.84:                                               # chừa headroom ~ -1.5 dB (không cần limiter)
        y *= 0.84 / peak
    out = np.concatenate([y, y[:int(XF * SR)]])                   # thêm XF giây đầu ở cuối để crossfade
    return out, y, L, info


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or list(TRACKS)
    meta_path = os.path.join(OUT, 'meta.json')
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    for k in names:
        out, y, L, info = build(k)
        path = os.path.join(OUT, k + '.mp3')
        write_mp3(path, out, 48 if k == 'ambience' else 64)
        fl = lufs_i(y)
        gain = 10 ** ((IN_GAME[k] - fl) / 20)
        m = dict(loop_s=round(L / SR, 6), xfade_s=XF, file_lufs_i=round(fl, 1), in_game_lufs=IN_GAME[k],
                 gain=round(gain, 4), true_peak_db=round(20 * np.log10(S.true_peak(y)), 1),
                 seam_db=round(seam_db(y), 1), kb=round(os.path.getsize(path) / 1024), **info)
        if k == 'ambience':
            m['gain_play'] = round(10 ** ((AMB_PLAY_LUFS - fl) / 20), 4)
        meta[k] = m
        print(f"{k:9} loop {m['loop_s']:6.2f} s  file {m['file_lufs_i']} LUFS-I  trong game {IN_GAME[k]}  gain {m['gain']}  "
              f"TP {m['true_peak_db']} dB  nối {m['seam_db']} dB  {m['kb']} KB")
    json.dump(dict(sorted(meta.items())), open(meta_path, 'w'), indent=1, ensure_ascii=False)
    print(f'{len(names)} file -> {os.path.relpath(OUT, ROOT)}')
