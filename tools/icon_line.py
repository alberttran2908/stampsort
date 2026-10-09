#!/usr/bin/env python3
"""Sinh icon nét (icon_line.png) cho lá chủ đề vương miện từ icon màu (icon.png) của từng chủ đề.

Góp ý người dùng 2026-10-10: tem chủ đề vương miện phải cùng một kiểu, không màu, chỉ nét viền,
để không lẫn với tem thường (tem thường đều có màu). Cách làm:
- Giữ các điểm có màu gần màu nét nâu #5a3a26 (nét viền gốc), bỏ phần tô.
- Vùng màu nhấn (khác màu nền kem, vd. lát xúc xích pizza, lục địa trên hành tinh) đổi thành nét viền mảnh.
  Đoạn nào chạy sát nét viền ngoài thì bỏ để không bị viền đôi.
- Xoá chấm vụn, làm mềm mép 1px.

Dùng: python3 tools/icon_line.py      (ghi prototype/stamp/assets/cards/<chủ đề>/icon_line.png)
"""
import glob, os
import numpy as np
from PIL import Image
from scipy import ndimage
INK=np.array([0x5a,0x3a,0x26])
def clean(m, frac):
    lab,n=ndimage.label(m)
    if not n: return m
    sizes=ndimage.sum(m,lab,range(1,n+1))
    return np.isin(lab,1+np.nonzero(sizes>=max(30,m.size*frac))[0])
def line_icon(im, detail=True):
    a=np.array(im.convert('RGBA')).astype(int)
    rgb,al=a[...,:3],a[...,3]
    d=np.sqrt(((rgb-INK)**2).sum(-1))
    lum=(0.3*rgb[...,0]+0.59*rgb[...,1]+0.11*rgb[...,2])
    ink=((d<75)|(lum<55))&(al>40)
    ink=clean(ink,0.0008)
    if detail:
        op=(al>200)&~ndimage.binary_dilation(ink,iterations=2)
        cols=rgb[op]
        if len(cols):
            # màu nền chủ đạo (kem) = trung vị của các điểm sáng
            bright=cols[(cols.sum(1)>600)]
            base=np.median(bright,0) if len(bright) else np.array([250,240,220])
            acc=op&(np.sqrt(((rgb-base)**2).sum(-1))>70)
            acc=ndimage.binary_opening(acc,iterations=2)
            acc=clean(acc,0.002)
            w=max(2,round(im.width/64))
            edge=acc&~ndimage.binary_erosion(acc,iterations=w)
            edge=edge&~ndimage.binary_dilation(ink,iterations=w+4)   # bỏ viền đôi chạy sát nét ngoài
            edge=clean(edge,0.0006)
            ink=ink|edge
    out=np.zeros_like(a); out[...,:3]=INK
    out[...,3]=np.where(ink,255,0)
    o=Image.fromarray(out.astype('uint8'))
    # làm mềm mép nét ~1px
    from PIL import ImageFilter
    A=o.getchannel('A').filter(ImageFilter.GaussianBlur(0.6))
    o.putalpha(A)
    return o


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'prototype/stamp/assets/cards')
    fs = sorted(glob.glob(os.path.join(root, '*/icon.png')))
    for f in fs:
        line_icon(Image.open(f)).save(os.path.join(os.path.dirname(f), 'icon_line.png'), optimize=True)
    print(f'{len(fs)} icon_line.png')
