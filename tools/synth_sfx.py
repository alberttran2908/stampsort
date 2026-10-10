#!/usr/bin/env python3
"""Tổng hợp bộ SFX "Little Post Office" cho prototype (v3: chill cho người lớn tuổi, xem docs/design/sfx-review.md).

Tông: giấy, con dấu cao su/gỗ, chuông quầy bưu điện dịu, mộc cầm (marimba) dùi mềm cho combo, hộp nhạc + chuông xa
+ nền ấm cho mốc lớn (không kèn, không fanfare).
Tất cả tạo bằng toán (modal/additive, FM, nhiễu lọc nhiều lớp, reverb tổng hợp), không dùng sample ngoài,
không dùng âm thanh APK đối thủ, nên commit được vào repo public.

Nguyên tắc (chi tiết ở docs/design/sfx-review.md):
  - Mọi âm thuộc thang C ngũ cung (C D E G A) để chồng nhau không lệch tông.
  - Âm thao tác lặp nhiều: <= 150 ms, attack >= 2.5 ms, thân âm 300-1500 Hz (loa điện thoại nghe được).
  - Mọi âm: năng lượng dồn 300 Hz - 2.5 kHz, lowpass 4.5 kHz, highpass >= 120 Hz; combo không vượt C6.
  - Bắt đầu đúng transient ở mẫu 0 (fade-in 1.5 ms chống click), đuôi tự nhiên, cắt ở -60 dB + fade.
  - Chuẩn hoá theo loudness (M-max LUFS, BS.1770 K-weighting, cửa sổ 400 ms) theo nhóm vai trò,
    có bù sẵn vol mà main.js đang truyền vào, rồi limiter true peak -1.5 dBTP.

Dùng: python3 tools/synth_sfx.py            # ghi prototype/stamp/sfx/<tên>.mp3 + sfx/meta.json (cần ffmpeg)
      python3 tools/synth_sfx.py pick open   # chỉ tạo vài âm
Tên file trùng khoá trong prototype/stamp/src/audio.js (NAMES). Âm mới (deny, stamp, ...) chỉ được phát khi main.js gọi.
"""
import os, sys, json, subprocess, tempfile, wave, zlib
import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'prototype/stamp/sfx')
LN1000 = np.log(1000.0)          # e-mũ tới -60 dB
rng = np.random.default_rng(7)   # đặt lại theo tên âm trong build(), để mỗi âm tái tạo y hệt


# ============================================================ cơ bản
def T(d):
    return np.arange(int(round(SR * d))) / SR


def zeros(d):
    return np.zeros(int(round(SR * d)))


def N(name):
    """'C5' / 'F#4' -> Hz."""
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = names[name[0]] + (1 if '#' in name else 0) - (1 if 'b' in name[1:] else 0)
    return 440.0 * 2 ** ((n + 12 * (int(name[-1]) + 1) - 69) / 12)


def mix(*layers):
    """layers: (at_s, sig[, gain]) -> tín hiệu đủ dài chứa tất cả."""
    end = max(int(round(SR * l[0])) + len(l[1]) for l in layers)
    out = np.zeros(end)
    for l in layers:
        i = int(round(SR * l[0]))
        sig = np.array(l[1], dtype=float)
        nf = min(len(sig) // 4, int(0.006 * SR))          # fade 6 ms cuối mỗi lớp: lớp bị cắt giữa chừng không gây click
        if nf > 1:
            sig[-nf:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(nf) / nf)
        out[i:i + len(sig)] += sig * (l[2] if len(l) > 2 else 1.0)
    return out


def rcos(n):
    return 0.5 - 0.5 * np.cos(np.pi * np.arange(n) / max(1, n))


ATTACK_MIN = 0.0025              # v3: mọi tiếng gõ/giấy có attack tối thiểu 2.5 ms (tròn, ít click sắc)
LP_MAX = 4500                    # v3: mọi âm cắt mềm phía trên ~4.5 kHz (24 dB/oct)
HP_MIN = 120                     # v3: không dồn năng lượng xuống dưới loa điện thoại


def perc(d, t60, attack=0.001):
    """Envelope gõ: attack raised-cosine rồi suy giảm mũ, t60 = thời gian về -60 dB."""
    t = T(d)
    env = np.exp(-LN1000 * t / t60)
    a = min(len(t), max(1, int(SR * max(attack, ATTACK_MIN))))
    env[:a] *= rcos(a)
    return env


def adsr(d, a, dc, s, r):
    """ADSR chuẩn (giây, mức sustain 0..1). Release nằm trong d."""
    n = int(round(SR * d))
    na, nd, nr = int(SR * a), int(SR * dc), int(SR * r)
    ns = max(0, n - na - nd - nr)
    env = np.concatenate([rcos(na), s + (1 - s) * np.exp(-5 * np.arange(nd) / max(1, nd)), np.full(ns, s),
                          s * (0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / max(1, nr)))])
    return env[:n] if len(env) >= n else np.pad(env, (0, n - len(env)))


def swell(d, peak_at=0.5, start=0.0, shape=1.5):
    """Envelope phồng lên rồi xẹp (whoosh): bắt đầu ở mức start (để có phản hồi ngay), đỉnh ở peak_at."""
    t = T(d) / d
    up = start + (1 - start) * np.clip(t / peak_at, 0, 1) ** shape
    down = np.clip((1 - t) / (1 - peak_at), 0, 1) ** shape
    return np.where(t < peak_at, up, down)


# ============================================================ bộ lọc
def sos_filter(x, kind, f, order=2):
    nyq = SR / 2
    wn = [min(f[0], nyq * 0.95) / nyq, min(f[1], nyq * 0.95) / nyq] if kind == 'band' else min(f, nyq * 0.95) / nyq
    return signal.sosfilt(signal.butter(order, wn, kind, output='sos'), x)


def lp(x, f, order=2):
    return sos_filter(x, 'low', f, order)


def hp(x, f, order=2):
    return sos_filter(x, 'high', f, order)


def bp(x, lo, hi, order=2):
    return sos_filter(x, 'band', (lo, hi), order)


def peq(x, f, gain_db, q=1.0):
    """Peaking EQ (RBJ). Dùng để khoét 2-5 kHz cho âm thao tác."""
    A = 10 ** (gain_db / 40); w0 = 2 * np.pi * f / SR; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    return signal.lfilter(b, a, x)


def svf(x, fc, q=0.9, mode='bp'):
    """State-variable filter TPT (Zavalishin), fc có thể thay đổi theo mẫu: dải lọc trượt cho tiếng gió/giấy."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    g = np.tan(np.pi * np.clip(fc, 20, SR * 0.45) / SR)
    k = 1.0 / q
    a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2
    y = np.empty_like(x)
    ic1 = ic2 = 0.0
    for i in range(len(x)):
        v3 = x[i] - ic2
        v1 = a1[i] * ic1 + a2[i] * v3
        v2 = ic2 + a2[i] * ic1 + a3[i] * v3
        ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2
        y[i] = v1 if mode == 'bp' else (v2 if mode == 'lp' else x[i] - k * v1 - v2)
    return y


# ============================================================ nguồn âm
def noise(d):
    return rng.standard_normal(int(round(SR * d)))


def norm(x):
    return x / (np.abs(x).max() + 1e-12)


def bandnoise(d, lo, hi, order=2):
    return norm(bp(noise(d), lo, hi, order))


def sweepnoise(d, f0, f1, q=1.0, curve='exp'):
    """Nhiễu qua bandpass trượt f0 -> f1 (giấy lật, gió thổi)."""
    t = T(d) / d
    fc = f0 * (f1 / f0) ** t if curve == 'exp' else f0 + (f1 - f0) * t
    return norm(svf(noise(d), fc, q))


def crackle(d, rate, lo, hi):
    """Hạt giấy sột soạt: xung thưa ngẫu nhiên lọc dải."""
    n = int(round(SR * d))
    x = np.zeros(n)
    k = rng.poisson(rate * d)
    x[rng.integers(0, n, k)] = rng.uniform(-1, 1, k) * rng.uniform(0.2, 1, k)
    return norm(bp(x, lo, hi)) if k else x


def modal(f0, partials, d, attack=0.0008, drop=0.0, drop_t=0.03):
    """Tổng các mode suy giảm (gỗ, thanh kim loại). partials: (tỉ lệ, biên độ, t60).
    drop: cao độ trượt xuống (vd 0.06 = 6%) trong drop_t giây, cho tiếng gõ có 'thân'."""
    t = T(d)
    bend = 1 + drop * np.exp(-t / drop_t) if drop else 1.0
    out = np.zeros_like(t)
    for ratio, amp, t60 in partials:
        f = f0 * ratio
        if f > SR * 0.42:
            continue
        ph = 2 * np.pi * np.cumsum(f * bend * np.ones_like(t)) / SR
        out += amp * np.sin(ph) * perc(d, t60, attack)
    return out


def marimba(f, d=0.6, mallet=0.5):
    """Mộc cầm: thanh gỗ chỉnh âm (1 : 3.99 : 9.9) + ống cộng hưởng đẩy âm cơ bản. mallet 0 mềm .. 1 cứng."""
    t60 = float(np.clip(0.95 - 0.28 * np.log2(f / 260), 0.32, 1.0))
    s = modal(f, [(1, 1.0, t60), (2.0, 0.04, t60 * 0.5), (3.99, 0.10 + 0.25 * mallet, t60 * 0.22),
                  (9.9, 0.02 + 0.06 * mallet, t60 * 0.08)], d)
    tick = lp(noise(0.006), 2500 + 3000 * mallet) * perc(0.006, 0.004, 0.0003)
    s[:len(tick)] += 0.06 * (0.5 + mallet) * norm(tick)
    return s


def kalimba(f, d=0.6, scoop=0.0):
    """Hộp nhạc / kalimba: lưỡi thép, partial 5.4 nhanh tắt. scoop: trượt cao độ từ dưới lên (cent)."""
    t = T(d)
    bend = 2 ** (-scoop / 1200 * np.exp(-t / 0.025)) if scoop else 1.0
    out = np.zeros_like(t)
    for ratio, amp, t60 in ((1, 1.0, 0.75), (2.0, 0.06, 0.3), (5.4, 0.22, 0.09), (11.7, 0.05, 0.04)):
        if f * ratio > SR * 0.42:
            continue
        out += amp * np.sin(2 * np.pi * np.cumsum(f * ratio * bend * np.ones_like(t)) / SR) * perc(d, t60, 0.0008)
    return out


def glock(f, d=0.6, t60=0.9, bright=0.6):
    """Chuông thanh (glockenspiel/celesta) tỉ lệ thanh tự do 1 : 2.76 : 5.40 : 8.93."""
    return modal(f, [(1, 1.0, t60), (2.76, 0.30 * bright, t60 * 0.45), (5.40, 0.14 * bright, t60 * 0.22),
                     (8.93, 0.05 * bright, t60 * 0.12)], d, attack=0.0006)


def desk_bell(f, d=1.0, t60=1.1, index=1.6, ratio=3.5):
    """Chuông quầy bưu điện ("ding"): FM c:m = 1:3.5, chỉ số điều chế giảm dần -> sáng lúc gõ rồi tròn lại,
    cộng partial 2.0/2.4 nhẹ cho thân chuông."""
    t = T(d)
    I = index * np.exp(-t / 0.08) + 0.25 * index * np.exp(-t / 0.5)
    s = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * ratio * t)) * perc(d, t60, 0.0008)
    s += 0.18 * np.sin(2 * np.pi * f * 2.0 * t) * perc(d, t60 * 0.6, 0.0008)
    s += 0.10 * np.sin(2 * np.pi * f * 2.42 * t) * perc(d, t60 * 0.4, 0.0008)
    return s


def coin_ping(f, d=0.3):
    """Đồng xu chạm: partial không điều hoà của đĩa kim loại, ngắn."""
    return modal(f, [(1, 1.0, 0.32), (2.32, 0.32, 0.16), (3.88, 0.16, 0.1), (5.35, 0.07, 0.06)], d, attack=0.0005)


def thunk(f=300, d=0.14, drop=0.08, slap=0.5, felt=1800):
    """Con dấu / mộc gỗ đập xuống giấy: thân modal (có trượt cao độ) + tiếng 'bộp' nhiễu lọc thấp + giấy."""
    body = modal(f, [(1, 1.0, 0.09), (1.92, 0.55, 0.06), (3.1, 0.28, 0.04), (4.65, 0.12, 0.025)], d, drop=drop)
    pad = lp(noise(d), felt) * perc(d, 0.035, 0.0005)
    pap = bandnoise(0.03, 700, 3000) * perc(0.03, 0.02, 0.0004)
    return mix((0, body, 1.0), (0, norm(pad), 0.45), (0, pap, slap * 0.5))


def wood_tick(f, d=0.06, amp=1.0):
    """Tiếng 'tok' gỗ nhỏ (nút bấm, tích tắc đồng hồ)."""
    s = modal(f, [(1, 1.0, 0.045), (2.57, 0.32, 0.025), (4.9, 0.10, 0.014)], d)
    tr = lp(noise(0.004), 3500) * perc(0.004, 0.003, 0.0002)
    s[:len(tr)] += 0.12 * norm(tr)
    return amp * s


# ============================================================ không gian
_IR = {}


def room_ir(t60=0.6, damp=3500):
    """IR phòng nhỏ ấm (bưu điện gỗ): vài phản xạ sớm + đuôi nhiễu suy giảm, cao tần tắt nhanh hơn."""
    key = (round(t60, 3), damp)
    if key in _IR:
        return _IR[key]
    r = np.random.default_rng(1234)
    t = T(t60 * 1.1)
    n = r.standard_normal(len(t))
    tail = lp(n, damp) * np.exp(-LN1000 * t / t60) + 0.25 * hp(n, damp) * np.exp(-LN1000 * t / (t60 * 0.35))
    tail *= np.clip((t - 0.012) / 0.02, 0, 1)                         # đuôi bắt đầu sau phản xạ sớm
    for ms, g in ((7, 0.5), (11, -0.38), (17, 0.3), (23, -0.22), (31, 0.16)):
        tail[int(SR * ms / 1000)] += g * 3
    ir = tail / np.sqrt(np.sum(tail ** 2))
    _IR[key] = ir
    return ir


def reverb(x, wet=0.12, t60=0.6, damp=3500):
    if wet <= 0:
        return x
    ir = room_ir(t60, damp)
    y = signal.fftconvolve(x, ir)
    out = np.pad(x, (0, len(ir) - 1)) + wet * y * 0.35
    return out


# ============================================================ đo & hoàn thiện
def kweight(x):
    G, Q, fc = 4.0, 1 / np.sqrt(2), 1500.0
    A = 10 ** (G / 40); w0 = 2 * np.pi * fc / SR; al = np.sin(w0) / (2 * Q); c = np.cos(w0)
    b = [A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al)]
    a = [(A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al]
    x = signal.lfilter(b, a, x)
    w0 = 2 * np.pi * 38.0 / SR; al = np.sin(w0); c = np.cos(w0)
    return signal.lfilter([(1 + c) / 2, -(1 + c), (1 + c) / 2], [1 + al, -2 * c, 1 - al], x)


def lufs_m(x):
    """Loudness momentary max (cửa sổ 400 ms, bước 10 ms). Âm ngắn hơn 400 ms: đo cả âm trong 1 cửa sổ."""
    y = kweight(np.concatenate([np.zeros(int(0.4 * SR)), x, np.zeros(int(0.4 * SR))]))
    w = int(0.4 * SR); hop = int(0.01 * SR)
    cs = np.concatenate([[0], np.cumsum(y * y)])
    ms = (cs[w::hop] - cs[:-w:hop]) / w
    return -0.691 + 10 * np.log10(ms.max() + 1e-12)


def true_peak(x):
    return np.abs(signal.resample_poly(x, 4, 1)).max()


def limit(x, ceiling_db=-1.5, look_ms=4.0):
    """Limiter lookahead theo true peak (4x). Chỉ giảm gain quanh đỉnh vượt ngưỡng."""
    c = 10 ** (ceiling_db / 20)
    up = np.abs(signal.resample_poly(x, 4, 1))[:len(x) * 4]
    up = np.pad(up, (0, len(x) * 4 - len(up))).reshape(-1, 4).max(1)
    g = np.minimum(1.0, c / (up + 1e-12))
    if g.min() >= 1.0:
        return x
    L = max(1, int(SR * look_ms / 1000))
    g = minimum_filter1d(g, 2 * L + 1)
    g = np.convolve(g, np.ones(L) / L, mode='same')
    return x * np.minimum(g, 1.0)


def finish(x, spec):
    x = hp(np.asarray(x, dtype=np.float64), max(HP_MIN, spec.get('hp', HP_MIN)))   # bỏ DC + phần dưới loa điện thoại
    if spec.get('deharsh'):
        x = peq(x, 3300, -spec['deharsh'], 0.9)                        # khoét vùng chói 2-5 kHz
    x = lp(x, min(LP_MAX, spec.get('lp', LP_MAX)), 4)                  # 24 dB/oct: cắt mềm phía trên, giữ ấm
    # đuôi: cắt khi đường bao 5 ms < -60 dB so với đỉnh, rồi fade
    env = np.sqrt(np.convolve(x * x, np.ones(220) / 220, mode='same'))
    above = np.where(env > env.max() * 10 ** (-60 / 20))[0]
    end = min(len(x), (above[-1] if len(above) else len(x)) + int(0.005 * SR))
    if spec.get('max'):
        end = min(end, int(SR * spec['max']))
    x = x[:end].copy()
    nf = min(len(x) // 3, int(SR * spec.get('fade', 12) / 1000))
    x[-nf:] *= (0.5 + 0.5 * np.cos(np.pi * np.arange(nf) / nf))
    # đầu: bỏ mẫu lặng (nếu có) rồi fade-in 1.5 ms để giữ transient mà không click
    st = np.where(np.abs(x) > np.abs(x).max() * 10 ** (-50 / 20))[0]
    x = x[st[0]:] if len(st) else x
    ni = int(0.0015 * SR)
    x[:ni] *= rcos(ni)
    # loudness theo nhóm (đã bù vol trong main.js), rồi limiter; lặp để sát mục tiêu
    target = spec['lufs'] - 20 * np.log10(spec.get('vol', 1.0))
    for _ in range(4):
        x = x * 10 ** ((target - lufs_m(x)) / 20)
        x = limit(x, -1.5)
        if abs(lufs_m(x) - target) < 0.15:
            break
    return x


def write_mp3(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-codec:a', 'libmp3lame', '-b:a', '128k',
                    '-write_xing', '1', path], check=True)
    os.unlink(tmp)


# ============================================================ từng âm
# v3 "chill cho người lớn tuổi": attack tròn (>= 2.5 ms), năng lượng dồn 300 Hz - 2.5 kHz, mọi âm cắt mềm từ ~4.5 kHz,
# không kèn/fanfare, combo không vượt C6, thưởng có đuôi reverb ấm dài hơn, ít lớp chồng cùng lúc.

# ---- thao tác (lặp nhiều: ngắn, mềm, khô)
def s_pick():                       # nhấc tem khỏi bàn: "sột" giấy nhỏ đi lên
    d = 0.1
    lift = sweepnoise(d, 900, 1800, q=1.0) * perc(d, 0.085, 0.004)
    tick = modal(N('G4'), [(1, 1, 0.05), (2.0, 0.3, 0.03), (3.0, 0.1, 0.02)], d, attack=0.003)
    return mix((0, lift, 0.75), (0, tick, 0.35))


def s_place():                      # tem đặt xuống cột: "bộp" giấy có thân gỗ ấm
    d = 0.12
    body = modal(N('G4'), [(1, 1.0, 0.09), (2.31, 0.45, 0.06), (4.1, 0.15, 0.035)], d, attack=0.003, drop=0.04, drop_t=0.02)
    slap = bandnoise(0.04, 400, 1800) * perc(0.04, 0.03, 0.004)
    puff = lp(noise(0.06), 900) * perc(0.06, 0.05, 0.004)
    return mix((0, body, 0.8), (0, slap, 0.6), (0, norm(puff), 0.4))


def s_draw():                       # rút lá: "sạt" giấy tròn
    slide = sweepnoise(0.1, 1900, 800, q=0.9) * swell(0.1, 0.25, 0.35)
    tap = modal(N('A4'), [(1, 1, 0.035), (2.4, 0.35, 0.02)], 0.05, attack=0.003)
    return mix((0, slide, 0.8), (0.07, tap, 0.25))


def s_flip():                       # lá úp lật ngửa: "phựt" mềm rồi đặt
    turn = sweepnoise(0.08, 900, 2000, q=1.1) * swell(0.08, 0.35, 0.4, 1.2)
    body = modal(N('C5'), [(1, 1, 0.045), (2.3, 0.3, 0.025)], 0.06, attack=0.003)
    puff = lp(noise(0.04), 1000) * perc(0.04, 0.03, 0.004)
    return mix((0, turn, 0.7), (0.07, body, 0.3), (0.07, norm(puff), 0.3))


def s_click():                      # nút UI: "tok" gỗ trầm, tròn
    return wood_tick(N('E5'), 0.08)


def s_back():                       # Undo: hai tok đi xuống, chậm rãi
    return mix((0, wood_tick(N('G5'), 0.07), 0.7), (0.07, wood_tick(N('C5'), 0.09), 0.65))


def s_close():                      # đóng bảng: gấp giấy nhẹ + tok trầm
    sw = sweepnoise(0.12, 1800, 700, q=0.9) * swell(0.12, 0.3, 0.5)
    return mix((0, sw, 0.5), (0.02, wood_tick(N('C5'), 0.1), 0.8))


def s_deny():                       # nước đi chưa được: một "phù" giấy/gỗ trầm, không phải lỗi, không buzz
    d = 0.14
    puff = svf(noise(d), 700 * np.exp(-T(d) / 0.06) + 450, 0.7, 'lp') * perc(d, 0.11, 0.008)
    body = modal(N('E4'), [(1, 1.0, 0.07), (2.0, 0.5, 0.05), (3.0, 0.2, 0.03)], d, attack=0.008)
    return lp(mix((0, norm(puff), 0.7), (0, body, 0.55)), 1400)


def s_facedown():                   # chạm lá còn úp: "tụp" nỉ rất nhỏ
    pad = lp(noise(0.05), 900) * perc(0.05, 0.035, 0.004)
    body = modal(N('A4'), [(1, 1, 0.04), (2.4, 0.3, 0.025)], 0.06, attack=0.003)
    return mix((0, norm(pad), 0.55), (0, body, 0.5))


def s_popup():                      # bảng mở ra: giấy mở + tok nhỏ
    sw = sweepnoise(0.13, 700, 1500, q=0.9) * swell(0.13, 0.35, 0.3)
    return mix((0, sw, 0.45), (0, wood_tick(N('E5'), 0.08), 0.5))


def s_recycle():                    # lật lại chồng bài: riffle chậm, tròn
    times = np.cumsum(np.linspace(0.05, 0.03, 9)) - 0.05
    layers = [(float(tm), bandnoise(0.03, 800, 2400) * perc(0.03, 0.02, 0.003), 0.5 + 0.4 * k / 8) for k, tm in enumerate(times)]
    under = sweepnoise(0.4, 500, 1200, q=0.8) * swell(0.4, 0.7, 0.3)
    return mix((0, under, 0.35), *layers)


# ---- phản hồi cốt lõi
# combo: ngũ cung G4 -> C6 (không vượt C6). Từ combo9 giữ C6 nhưng thêm bè ấm bên dưới thay vì lên cao hơn.
COMBO = ('G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'C6', 'C6', 'C6')
COMBO_UNDER = {8: ('G5',), 9: ('E5', 'G5'), 10: ('C5', 'E5', 'G5')}


def s_combo(i):                     # tem vào ô đúng: mộc cầm dùi mềm + chút hộp nhạc, đuôi ấm
    f = N(COMBO[i])
    layers = [(0, marimba(f, 0.8, 0.12), 1.0), (0.004, kalimba(f, 0.6), 0.18)]
    for n in COMBO_UNDER.get(i, ()):
        layers.append((0.03, marimba(N(n), 0.8, 0.1), 0.32))
    return reverb(mix(*layers), 0.16 + 0.01 * i, 0.8, 2500)


def s_open():                       # đặt tem vương miện, mở ô: con dấu tròn + chuông quầy dịu C5/G5
    return reverb(mix((0, thunk(330, 0.15, 0.05, slap=0.2, felt=900), 0.6),
                      (0.02, desk_bell(N('G5'), 1.2, 1.2, 0.6), 0.5),
                      (0.02, desk_bell(N('C5'), 1.2, 1.3, 0.5), 0.35)), 0.24, 1.0, 2500)


def s_complete():                   # ô đầy: niêm sáp + chuông đi lên chậm (C5-E5-G5-C6), đuôi ấm
    wax = thunk(N('D4'), 0.18, 0.06, slap=0.15, felt=700)
    arp = [(0.03 + 0.09 * k, glock(N(n), 1.3, 1.3, 0.25), 0.45 + 0.05 * k) for k, n in enumerate(('C5', 'E5', 'G5', 'C6'))]
    bell = (0.03, desk_bell(N('C5'), 1.5, 1.6, 0.6), 0.3)
    return reverb(mix((0, wax, 0.7), bell, *arp), 0.28, 1.2, 2500)


def s_boom():                       # "phụp" nỉ rất nhẹ (lớp dưới complete và banner level khó)
    d = 0.45
    t = T(d)
    f = 170 + 80 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * perc(d, 0.3, 0.006)
    puff = svf(noise(d), 1200 * np.exp(-t / 0.08) + 350, 0.7, 'lp') * perc(d, 0.25, 0.008)
    thud = modal(N('C4'), [(1, 1, 0.22), (1.5, 0.4, 0.16), (2, 0.5, 0.15)], 0.35, attack=0.006, drop=0.05, drop_t=0.03)
    return reverb(mix((0, body, 0.3), (0, norm(puff), 0.5), (0, thud, 0.8)), 0.15, 0.8, 2000)


def s_whoosh():                     # lá thư bay: gió êm, trầm hơn
    d = 0.45
    t = T(d)
    w = sweepnoise(d, 350, 1400, q=1.1) * swell(d, 0.55, 0.25, 1.3)
    w *= 1 + 0.1 * np.sin(2 * np.pi * 18 * t)
    return lp(w, 3000, 4)


def s_sparkle():                    # dọn sạch cột: chuông nhỏ G5-C6-E6 (thấp, không lấp lánh chói)
    return reverb(mix(*[(0.07 * k, glock(N(n), 0.9, 1.0, 0.2), 0.9 - 0.15 * k)
                        for k, n in enumerate(('G5', 'C6', 'E6'))]), 0.26, 1.0, 2500)


# ---- booster / gợi ý
def s_hint():                       # gợi ý: chuông dịu E5 -> A5
    return reverb(mix((0, desk_bell(N('E5'), 1.2, 1.2, 0.5), 0.8), (0.18, desk_bell(N('A5'), 1.2, 1.2, 0.5), 0.65)), 0.26, 1.1, 2500)


def s_joker():                      # tem vàng / chọn booster: hộp nhạc G4-C5-E5 + chuông nhỏ G5
    notes = [(0.09 * k, kalimba(N(n), 0.7, scoop=30), 0.8) for k, n in enumerate(('G4', 'C5', 'E5'))]
    return reverb(mix(*notes, (0.27, glock(N('G5'), 0.9, 1.0, 0.2), 0.3)), 0.22, 1.0, 2500)


def s_magnet():                     # túi kéo tem: ù hút trầm êm + chuông C5-E5-G5 khi tới nơi
    d = 0.6
    t = T(d)
    f = N('C4') * 2 ** (0.6 * t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph) + 0.1 * np.sin(4 * ph)
    tone = tone * swell(d, 0.75, 0.3, 1.2) * (0.85 + 0.15 * np.sin(2 * np.pi * 8 * t))
    flutter = sweepnoise(d, 600, 1500, q=0.9) * swell(d, 0.7, 0.2)
    chimes = [(0.52 + 0.08 * k, glock(N(n), 0.9, 1.0, 0.2), 0.35) for k, n in enumerate(('C5', 'E5', 'G5'))]
    return reverb(mix((0, wood_tick(N('C5'), 0.08), 0.45), (0, norm(tone), 0.3), (0, flutter, 0.12), *chimes), 0.22, 1.0, 2500)


def s_slot():                       # mở khoá ô phụ: chốt gỗ "cạch" tròn + chuông E5 -> A5
    def latch():
        return modal(820, [(1, 1, 0.03), (1.73, 0.5, 0.02), (2.6, 0.2, 0.014)], 0.05, attack=0.003)
    return reverb(mix((0, latch(), 0.5), (0.08, latch(), 0.45), (0.08, thunk(380, 0.12, 0.04, 0.15, 900), 0.4),
                      (0.16, desk_bell(N('E5'), 1.2, 1.2, 0.6), 0.45), (0.26, desk_bell(N('A5'), 1.2, 1.2, 0.5), 0.35)), 0.24, 1.0, 2500)


# ---- kinh tế / thưởng
def soft_coin(f, d=0.45):
    """Đồng xu êm: partial không điều hoà nhưng tắt nhanh, thân ở âm cơ bản."""
    return modal(f, [(1, 1.0, 0.4), (2.32, 0.22, 0.16), (3.88, 0.08, 0.09)], d, attack=0.003)


def s_coin():                       # một đồng xu: G5 -> C6
    return reverb(mix((0, soft_coin(N('G5')), 0.8), (0.07, soft_coin(N('C6')), 0.9)), 0.14, 0.8, 2500)


def s_coins():                      # vài đồng xu rơi thong thả
    pool = ('G5', 'A5', 'C6', 'E5', 'D5')
    layers = [(0.12 * k + float(rng.uniform(0, 0.03)), soft_coin(N(pool[int(rng.integers(0, 5))])), 0.95 - 0.06 * k) for k in range(8)]
    return reverb(mix(*layers), 0.2, 1.0, 2500)


def s_claim():                      # nhận thưởng: xu C6 + hợp âm C5-E5-G5 rải chậm, đuôi ấm
    chord = [(0.08 + 0.05 * k, desk_bell(N(n), 1.4, 1.4, 0.5), 0.4) for k, n in enumerate(('C5', 'E5', 'G5'))]
    return reverb(mix((0, soft_coin(N('C6')), 0.6), *chord), 0.28, 1.2, 2500)


def s_stamp():                      # con dấu cao su "cộp" tròn (Tem Điểm, màn Chương 2)
    handle = wood_tick(440, 0.06, 0.4)
    pad = modal(300, [(1, 1, 0.1), (2.1, 0.5, 0.07), (3.3, 0.2, 0.04)], 0.15, attack=0.004, drop=0.1, drop_t=0.02)
    rub = lp(noise(0.1), 900) * perc(0.1, 0.08, 0.005)
    return reverb(mix((0, handle, 0.7), (0.004, pad, 1.0), (0.004, norm(rub), 0.5)), 0.12, 0.6, 2500)


# ---- mốc lớn: hộp nhạc + chuông xa + nền ấm (không kèn, không fanfare)
def warm_pad(notes, d, at=0.0, gain=1.0):
    """Nền ấm như đàn harmonium xa: sine + hài bậc 2, 3 nhẹ, attack chậm 120 ms."""
    t = T(d)
    env = adsr(d, 0.12, 0.2, 0.75, min(0.5, d * 0.5))
    out = np.zeros_like(t)
    for n in notes:
        f = N(n)
        out += (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t))
    return (at, lp(out * env, 2200) / max(1, len(notes)), gain)


def music_box_line(notes):
    """notes: (tên, lúc bắt đầu)."""
    return [(at, kalimba(N(n), 1.0), 0.8) for n, at in notes]


def s_feature():                    # tính năng mới / cứu trợ: hộp nhạc G4-C5-E5-G5 thong thả + chuông xa
    mb = music_box_line((('G4', 0), ('C5', 0.15), ('E5', 0.3), ('G5', 0.45)))
    bells = [(0.5, desk_bell(N(n), 1.8, 1.8, 0.4), 0.16) for n in ('C5', 'E5', 'G5')]
    return reverb(mix(*mb, *bells, warm_pad(('C4', 'G4'), 1.4, 0.45, 0.12)), 0.3, 1.5, 2200)


def s_overtime():                   # Overtime: chuông chiều trầm ấm C5 rồi G4, đồng hồ tích-tắc rất nhẹ
    ticks = [(0, wood_tick(900, 0.06), 0.35), (0.22, wood_tick(700, 0.07), 0.35)]
    bells = [(0.4, desk_bell(N('C5'), 2.2, 2.2, 0.5), 0.6), (0.4, desk_bell(N('G4'), 2.2, 2.4, 0.4), 0.35),
             (0.85, desk_bell(N('E5'), 2.0, 2.0, 0.4), 0.35)]
    return reverb(mix(*ticks, *bells, warm_pad(('C4', 'G4'), 1.6, 0.4, 0.1)), 0.32, 1.6, 2200)


def s_decor():                      # đặt đồ trang trí: "bóp" mềm + gõ gỗ + chuông C5-E5-G5
    d = 0.14
    t = T(d)
    f = 260 * 2.4 ** np.clip(t / 0.06, 0, 1)
    pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * perc(d, 0.11, 0.005)
    chime = [(0.1 + 0.06 * k, glock(N(n), 1.1, 1.2, 0.2), 0.42) for k, n in enumerate(('C5', 'E5', 'G5'))]
    return reverb(mix((0, pop, 0.5), (0.04, thunk(420, 0.1, 0.04, 0.1, 900), 0.45), *chime), 0.28, 1.2, 2500)


def s_chapter():                    # xong chương: giai điệu hộp nhạc dài hơn + nền ấm + chuông xa
    mb = music_box_line((('G4', 0), ('C5', 0.16), ('E5', 0.32), ('G5', 0.48), ('E5', 0.8), ('G5', 0.96), ('C6', 1.12)))
    bells = [(1.15, desk_bell(N(n), 2.0, 2.0, 0.4), 0.15) for n in ('C5', 'E5', 'G5')]
    return reverb(mix(*mb, *bells, warm_pad(('C4', 'E4', 'G4'), 2.0, 1.1, 0.16)), 0.32, 1.6, 2200)


def s_win():                        # thắng: giai điệu mộc cầm thong thả + hợp âm chuông xa + nền ấm
    mel = (('C5', 0), ('E5', 0.14), ('G5', 0.28), ('C6', 0.42), ('A5', 0.7), ('C6', 0.84), ('G5', 0.98))
    mar = [(at, marimba(N(n), 0.9, 0.15), 0.7) for n, at in mel]
    bells = [(1.2 + 0.05 * k, desk_bell(N(n), 2.0, 2.0, 0.4), 0.18) for k, n in enumerate(('C5', 'E5', 'G5', 'C6'))]
    end = (1.2, marimba(N('C5'), 1.2, 0.12), 0.6)
    return reverb(mix(*mar, end, *bells, warm_pad(('C4', 'E4', 'G4'), 2.0, 1.15, 0.18)), 0.3, 1.6, 2200)


def s_lose():                       # hết nước: hộp nhạc E5-D5-C5 rồi nghỉ trên hợp âm trưởng, dịu, không buồn
    notes = [(0.26 * k, kalimba(N(n), 1.0), 0.7) for k, n in enumerate(('E5', 'D5', 'C5'))]
    rest = [(0.78, kalimba(N(n), 1.2), 0.35) for n in ('G4', 'E5')]
    return reverb(mix(*notes, *rest, warm_pad(('C4', 'G4'), 1.6, 0.6, 0.12)), 0.3, 1.5, 2200)


# ============================================================ danh mục
# lufs = độ to MONG MUỐN khi phát trong game (đã nhân vol); vol = vol main.js đang truyền ở chỗ gọi chính.
# File được chuẩn hoá về lufs - 20*log10(vol), nên đổi vol trong code sẽ đổi tương ứng.
# v3 (người lớn tuổi): nhỏ hơn v2 3-5 dB, khoảng cách các bậc hẹp lại (tổng dải ~9 dB thay vì ~11 dB):
# thao tác -28..-28.5 | UI -27 | deny -29.5 | combo -24..-22.5 | thưởng nhỏ -21.5..-24 | mốc lớn -19..-20.5
# lp mặc định 4500 Hz (24 dB/oct) cho mọi âm, hp >= 120 Hz.
SPEC = {
    # thao tác
    'pick':     dict(f=s_pick, grp='Thao tác', hp=150, lufs=-28, vol=0.8, deharsh=3, lp=3500),
    'place':    dict(f=s_place, grp='Thao tác', hp=150, lufs=-28, vol=0.55, deharsh=2, lp=3000),
    'draw':     dict(f=s_draw, grp='Thao tác', hp=150, lufs=-28.5, vol=0.7, deharsh=3, lp=3500),
    'flip':     dict(f=s_flip, grp='Thao tác', hp=150, lufs=-28.5, vol=0.7, deharsh=3, lp=3500),
    'facedown': dict(f=s_facedown, grp='Thao tác', hp=150, lufs=-30.5, vol=1, lp=2500, new=True),
    'recycle':  dict(f=s_recycle, grp='Thao tác', hp=150, lufs=-27.5, vol=1, deharsh=3, lp=3500, new=True),
    # UI
    'click':    dict(f=s_click, grp='UI', hp=150, lufs=-27, vol=1, lp=3500),
    'back':     dict(f=s_back, grp='UI', hp=150, lufs=-27, vol=1, lp=3500),
    'close':    dict(f=s_close, grp='UI', hp=150, lufs=-27, vol=1, lp=3500),
    'deny':     dict(f=s_deny, grp='UI', hp=200, lufs=-29.5, vol=1, lp=1600, new=True),
    'popup':    dict(f=s_popup, grp='UI', hp=150, lufs=-28.5, vol=1, lp=3500, new=True),
    # phản hồi cốt lõi
    'open':     dict(f=s_open, grp='Cốt lõi', lufs=-22.5, vol=1),
    'complete': dict(f=s_complete, grp='Cốt lõi', lufs=-20.5, vol=1),
    'boom':     dict(f=s_boom, grp='Cốt lõi', hp=150, lufs=-30, vol=0.35, lp=2500),
    'whoosh':   dict(f=s_whoosh, grp='Cốt lõi', lufs=-28, vol=0.5, lp=3000),
    'sparkle':  dict(f=s_sparkle, grp='Cốt lõi', lufs=-28, vol=0.4),
    # booster
    'hint':     dict(f=s_hint, grp='Booster', lufs=-23, vol=1),
    'joker':    dict(f=s_joker, grp='Booster', lufs=-22.5, vol=1),
    'magnet':   dict(f=s_magnet, grp='Booster', hp=150, lufs=-22.5, vol=1),
    'slot':     dict(f=s_slot, grp='Booster', lufs=-22, vol=1),
    # thưởng
    'coin':     dict(f=s_coin, grp='Thưởng', lufs=-26.5, vol=0.5),
    'coins':    dict(f=s_coins, grp='Thưởng', lufs=-22.5, vol=1),
    'claim':    dict(f=s_claim, grp='Thưởng', lufs=-21.5, vol=0.7),
    'stamp':    dict(f=s_stamp, grp='Thưởng', hp=150, lufs=-24, vol=1, lp=3000, new=True),
    # mốc lớn
    'feature':  dict(f=s_feature, grp='Mốc lớn', lufs=-20.5, vol=1),
    'overtime': dict(f=s_overtime, grp='Mốc lớn', lufs=-20.5, vol=1, new=True),
    'decor':    dict(f=s_decor, grp='Mốc lớn', lufs=-21, vol=1, new=True),
    'chapter':  dict(f=s_chapter, grp='Mốc lớn', lufs=-19.5, vol=1, new=True),
    'win':      dict(f=s_win, grp='Mốc lớn', lufs=-19.5, vol=1),
    'lose':     dict(f=s_lose, grp='Mốc lớn', lufs=-22.5, vol=1),
}
for _i in range(11):   # combo: -24 (combo1) lên -22.5 (combo11), vol 0.9 trong comboSfx
    SPEC[f'combo{_i + 1}'] = dict(f=(lambda i=_i: s_combo(i)), grp='Combo', lufs=round(-24 + 0.15 * _i, 2), vol=0.9)


def build(name):
    global rng
    rng = np.random.default_rng(zlib.crc32(name.encode()))
    spec = SPEC[name]
    return finish(spec['f'](), spec)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or list(SPEC)
    meta_path = os.path.join(OUT, 'meta.json')
    meta = {}
    if os.path.exists(meta_path) and sys.argv[1:]:
        meta = json.load(open(meta_path))
    for k in names:
        x = build(k)
        write_mp3(os.path.join(OUT, k + '.mp3'), x)
        sp = SPEC[k]
        meta[k] = dict(group=sp['grp'], new=bool(sp.get('new')), vol=sp.get('vol', 1), target_lufs=sp['lufs'],
                       file_lufs=round(lufs_m(x), 1), true_peak_db=round(20 * np.log10(true_peak(x)), 1),
                       ms=round(len(x) / SR * 1000))
        print(f"{k:10} {meta[k]['ms']:5} ms  file {meta[k]['file_lufs']:6} LUFS-M  (trong game {sp['lufs']})  TP {meta[k]['true_peak_db']} dB")
    json.dump(dict(sorted(meta.items())), open(meta_path, 'w'), indent=1, ensure_ascii=False)
    print(f'{len(names)} file -> {os.path.relpath(OUT, ROOT)}')
