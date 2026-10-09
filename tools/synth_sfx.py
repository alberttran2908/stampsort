#!/usr/bin/env python3
"""Tổng hợp bộ SFX riêng cho prototype (thay toàn bộ âm thanh lấy từ APK).

Tông "Little Post Office": tiếng giấy, tiếng đóng dấu, chuông bưu điện nhỏ, mộc cầm (marimba) cho combo.
Tất cả được tạo bằng toán (sine, nhiễu lọc), không dùng sample ngoài, nên commit được.

Dùng: python3 tools/synth_sfx.py            # ghi prototype/stamp/sfx/<tên>.mp3 (cần ffmpeg)
Tên file trùng khoá trong prototype/stamp/src/audio.js.
"""
import os, subprocess, tempfile, wave
import numpy as np
from scipy import signal

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'prototype/stamp/sfx')
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(SR * dur)) / SR


def note(name):
    """'C5' -> Hz."""
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = names[name[0]] + (1 if '#' in name else 0)
    octave = int(name[-1])
    return 440.0 * 2 ** ((n + 12 * (octave + 1) - 69) / 12)


def decay(dur, k, attack=0.004):
    t = t_(dur)
    env = np.exp(-t * k)
    a = int(SR * attack)
    if a:
        env[:a] *= np.linspace(0, 1, a)
    return env


def place(buf, snd, at):
    i = int(SR * at)
    end = min(len(buf), i + len(snd))
    buf[i:end] += snd[:end - i]
    return buf


def marimba(f, dur=0.5, vol=1.0):
    t = t_(dur)
    s = np.sin(2 * np.pi * f * t) * decay(dur, 9)
    s += 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * decay(dur, 30)       # partial gỗ
    s += 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * decay(dur, 70)
    return vol * s


def bell(f, dur=1.0, vol=1.0, k=4.5):
    t = t_(dur)
    s = np.zeros_like(t)
    for ratio, amp, kk in ((1, 1, k), (2.0, 0.5, k * 1.6), (2.76, 0.35, k * 2.2), (5.4, 0.18, k * 3.5), (8.9, 0.08, k * 5)):
        s += amp * np.sin(2 * np.pi * f * ratio * t + rng.uniform(0, 6)) * decay(dur, kk, 0.002)
    return vol * s / 2.1


def noise(dur, lo, hi, order=2):
    n = rng.standard_normal(int(SR * dur))
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], 'band')
    return signal.lfilter(b, a, n)


def paper(dur, lo=1800, hi=7000, k=None, attack=0.01, vol=0.5):
    """Tiếng giấy/lá bài sột soạt: nhiễu dải cao, lên nhanh xuống nhanh."""
    n = noise(dur, lo, hi)
    t = t_(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 if k is None else decay(dur, k, attack)
    return vol * n * env / (np.abs(n).max() + 1e-9)


def thunk(dur=0.18, f0=150, f1=70, vol=1.0):
    """Tiếng con dấu gỗ đập xuống: sine trượt xuống + tiếng gõ thấp."""
    t = t_(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 35)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(dur, 28, 0.001)
    click = noise(0.03, 300, 2500) * decay(0.03, 140, 0.0005)
    s[: len(click)] += 0.35 * click / (np.abs(click).max() + 1e-9)
    return vol * s


def sweep(dur, f0, f1, vol=1.0, wave='sine', trem=0):
    t = t_(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) if wave == 'sine' else signal.sawtooth(ph, 0.5)
    if trem:
        s *= 0.75 + 0.25 * np.sin(2 * np.pi * trem * t)
    return vol * s


def whoosh(dur=0.45, lo=400, hi=5000, up=True, vol=0.5):
    """Nhiễu với dải lọc trượt (lá bay)."""
    n = rng.standard_normal(int(SR * dur))
    out = np.zeros_like(n)
    seg = 512
    for i in range(0, len(n), seg):
        x = i / len(n)
        c = lo * (hi / lo) ** (x if up else 1 - x)
        b, a = signal.butter(2, [max(60, c * 0.6) / (SR / 2), min(SR / 2 - 200, c * 1.6) / (SR / 2)], 'band')
        out[i:i + seg] = signal.lfilter(b, a, n[max(0, i - 2048):i + seg])[-len(n[i:i + seg]):]
    t = t_(dur)
    env = np.sin(np.pi * t / dur) ** 1.5
    return vol * out * env / (np.abs(out).max() + 1e-9)


def buf(dur):
    return np.zeros(int(SR * dur))


def fade_out(s, ms=30):
    n = min(len(s), int(SR * ms / 1000))
    s[-n:] *= np.linspace(1, 0, n)
    return s


# ---------- từng âm ----------
def s_pick():
    b = buf(0.16)
    place(b, paper(0.12, 2500, 8000, vol=0.45), 0)
    place(b, marimba(note('E6'), 0.12, 0.18), 0)
    return b


def s_place():
    b = buf(0.3)
    place(b, thunk(0.22, 210, 110, 0.55), 0)
    place(b, paper(0.06, 1500, 6000, k=60, attack=0.001, vol=0.35), 0)
    return b


def s_open():                                  # đặt lá vương miện mở khay: đóng dấu + chuông
    b = buf(0.9)
    place(b, thunk(0.25, 160, 70, 0.9), 0)
    place(b, bell(note('G5'), 0.8, 0.45), 0.05)
    return b


def s_complete():                              # gửi đi một lá thư: chuông đi lên
    b = buf(1.0)
    for i, n in enumerate(('C6', 'E6', 'G6', 'C7')):
        place(b, bell(note(n), 0.6, 0.35 + 0.08 * i, k=6), 0.06 * i)
    place(b, whoosh(0.35, 800, 6000, True, 0.25), 0.05)
    return b


def s_flip():
    b = buf(0.22)
    place(b, paper(0.14, 2000, 9000, vol=0.5), 0)
    place(b, paper(0.05, 1200, 4000, k=80, attack=0.001, vol=0.3), 0.11)
    return b


def s_back():
    return whoosh(0.16, 3500, 900, True, 0.45)


def s_draw():
    b = buf(0.2)
    place(b, paper(0.03, 2500, 9000, k=120, attack=0.0005, vol=0.6), 0)
    place(b, paper(0.12, 1800, 7000, vol=0.35), 0.02)
    return b


def s_hint():
    b = buf(1.1)
    place(b, bell(note('G5'), 0.9, 0.4, k=4), 0)
    place(b, bell(note('D6'), 0.9, 0.35, k=4), 0.16)
    return b


def s_joker():                                 # mũ hề: ba nốt nảy
    b = buf(0.5)
    for i, n in enumerate(('G5', 'C6', 'E6')):
        t = t_(0.18)
        f = note(n) * (1 + 0.03 * np.sin(2 * np.pi * 18 * t))
        s = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR, 0.5) * decay(0.18, 16)
        place(b, 0.35 * s, 0.08 * i)
    place(b, bell(note('C7'), 0.3, 0.15, k=10), 0.2)
    return b


def s_magnet():
    b = buf(1.0)
    s = sweep(0.7, 220, 880, 0.3, trem=14) * np.sin(np.pi * t_(0.7) / 0.7)
    place(b, s, 0)
    for i in range(5):
        place(b, bell(note('C7') * (1 + 0.12 * i), 0.3, 0.12, k=12), 0.45 + 0.07 * i)
    return b


def s_feature():                               # mở tính năng mới: kèn bưu điện nhỏ (marimba + chuông)
    b = buf(1.5)
    for i, n in enumerate(('C5', 'E5', 'G5', 'C6')):
        place(b, marimba(note(n), 0.5, 0.6), 0.09 * i)
    for n in ('C6', 'E6', 'G6'):
        place(b, bell(note(n), 1.1, 0.25, k=3.5), 0.38)
    return b


def s_slot():                                  # mở khoá ô phụ: chốt kêu cạch + chuông
    b = buf(1.1)
    place(b, noise(0.03, 1500, 8000) * decay(0.03, 150, 0.0005) * 0.12, 0)
    place(b, noise(0.03, 1000, 6000) * decay(0.03, 150, 0.0005) * 0.12, 0.07)
    place(b, thunk(0.15, 300, 160, 0.4), 0.07)
    place(b, bell(note('E6'), 0.9, 0.4, k=4), 0.15)
    place(b, bell(note('B6'), 0.9, 0.25, k=4), 0.22)
    return b


def s_win():
    b = buf(2.4)
    mel = (('C5', 0), ('E5', 0.12), ('G5', 0.24), ('C6', 0.36), ('A5', 0.6), ('C6', 0.72), ('E6', 0.84))
    for n, at in mel:
        place(b, marimba(note(n), 0.6, 0.55), at)
    for n in ('C6', 'E6', 'G6', 'C7'):
        place(b, bell(note(n), 1.4, 0.22, k=2.5), 1.08)
    place(b, whoosh(0.5, 1500, 9000, True, 0.12), 1.0)
    return b


def s_lose():                                  # hết nước: đi xuống nhẹ nhàng, không gắt
    b = buf(1.8)
    for i, n in enumerate(('G5', 'E5', 'D5', 'C5')):
        t = t_(0.5)
        f = note(n) * (1 - 0.012 * t / 0.5)
        s = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * signal.sawtooth(2 * np.pi * np.cumsum(f) / SR, 0.5)) * decay(0.5, 5, 0.02)
        place(b, 0.4 * s, 0.22 * i)
    return b


def coin_ping(vol=0.5):
    b = buf(0.35)
    place(b, bell(note('B6'), 0.3, vol, k=12), 0)
    place(b, bell(note('E7'), 0.3, vol, k=9), 0.06)
    return b


def s_coin():
    return coin_ping(0.5)


def s_coins():
    b = buf(1.6)
    for i in range(10):
        place(b, coin_ping(0.25 + 0.03 * (i % 3)), 0.09 * i + rng.uniform(0, 0.02))
    return b


def s_claim():
    b = buf(0.9)
    place(b, coin_ping(0.45), 0)
    for n in ('G6', 'B6', 'D7'):
        place(b, bell(note(n), 0.7, 0.2, k=5), 0.12)
    return b


def s_click():
    b = buf(0.07)
    place(b, marimba(note('C6'), 0.06, 0.35), 0)
    place(b, noise(0.015, 2000, 9000) * decay(0.015, 300, 0.0005) * 0.05, 0)
    return b


def s_close():
    b = buf(0.3)
    place(b, paper(0.18, 1200, 5000, vol=0.35), 0)
    place(b, marimba(note('G5'), 0.18, 0.22), 0.05)
    place(b, marimba(note('C5'), 0.2, 0.22), 0.12)
    return b


def s_whoosh():
    return whoosh(0.45, 500, 6000, True, 0.45)


def s_sparkle():
    b = buf(0.5)
    for i, n in enumerate(('E7', 'G7', 'C8', 'A7')):
        place(b, bell(note(n), 0.25, 0.14, k=14), 0.05 * i)
    return b


def s_boom():                                  # "phụt" mềm + chuông (lộ lá vương miện, Joker xuất hiện)
    b = buf(0.9)
    n = noise(0.35, 80, 900) * decay(0.35, 10, 0.01)
    place(b, 0.5 * n / np.abs(n).max(), 0)
    place(b, thunk(0.3, 110, 50, 0.5), 0)
    for i, nn in enumerate(('C6', 'G6', 'C7')):
        place(b, bell(note(nn), 0.6, 0.2, k=6), 0.08 + 0.05 * i)
    return b


COMBO = ('C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6', 'C7')   # ngũ cung đi lên


def s_combo(i):
    b = buf(0.45)
    place(b, paper(0.1, 2000, 8000, vol=0.18), 0)
    place(b, marimba(note(COMBO[i]), 0.42, 0.6), 0.01)
    return b


SOUNDS = {
    'pick': s_pick, 'place': s_place, 'open': s_open, 'complete': s_complete, 'flip': s_flip, 'back': s_back,
    'draw': s_draw, 'hint': s_hint, 'joker': s_joker, 'magnet': s_magnet, 'feature': s_feature, 'slot': s_slot,
    'win': s_win, 'lose': s_lose, 'coin': s_coin, 'coins': s_coins, 'claim': s_claim, 'click': s_click,
    'close': s_close, 'whoosh': s_whoosh, 'sparkle': s_sparkle, 'boom': s_boom,
}
for _i in range(11):
    SOUNDS[f'combo{_i + 1}'] = (lambda i=_i: s_combo(i))


# Âm lượng đỉnh từng âm (1 = -1 dBFS): âm thao tác lặp nhiều nhỏ hơn âm thưởng
GAIN = {'click': 0.45, 'pick': 0.55, 'place': 0.65, 'flip': 0.55, 'draw': 0.55, 'back': 0.55, 'close': 0.5,
        'whoosh': 0.45, 'sparkle': 0.5, 'coin': 0.6, 'hint': 0.7, 'lose': 0.75}


def write_mp3(name, x):
    x = np.asarray(x, dtype=np.float64)
    g = GAIN.get(name, 0.7 if name.startswith('combo') else 0.85)
    x = x / (np.abs(x).max() + 1e-9) * 0.89 * g                 # chuẩn hoá đỉnh rồi nhân mức riêng
    x = fade_out(x, 15)
    pcm = (x * 32767).astype('<i2')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-codec:a', 'libmp3lame', '-b:a', '96k',
                    os.path.join(OUT, name + '.mp3')], check=True)
    os.unlink(tmp)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for k, fn in SOUNDS.items():
        write_mp3(k, fn())
    print(f'{len(SOUNDS)} file -> {os.path.relpath(OUT, ROOT)}')
