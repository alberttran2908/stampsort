# usage: autosplit.py <sheet.png> top@1200 n4 n5 n6 n7 n8 n9   ('-' skips). names relative to assets/, optional @size
# Splits a decor sheet by blobs (dilated alpha), top row = blob(s) in upper band, rest sorted by rows then x.
import sys; sys.path.insert(0,'tools'); argv=sys.argv[:]; sys.argv=['x']
import art_slice as A
import numpy as np
from scipy import ndimage
from PIL import Image
im=Image.open(argv[1]).convert('RGBA')
if im.getchannel('A').getextrema()[0] >= 10: im=A.remove_bg(im)
arr=np.array(im); m=arr[...,3]>24
lab,n=ndimage.label(m)
objs=ndimage.find_objects(lab)
sizes=ndimage.sum(m,lab,range(1,n+1))
big=sizes.max()
cand=[(i+1,objs[i]) for i in range(n) if sizes[i]>=0.04*big]
# attach small detached bits (sparkles, steam, strings) to the main blob whose padded bbox holds their centre
for i in range(n):
    if sizes[i]<0.04*big and sizes[i]>40:
        sl=objs[i]; cy=(sl[0].start+sl[0].stop)/2; cx=(sl[1].start+sl[1].stop)/2
        for lid,ms in cand:
            if ms[0].start-30<=cy<=ms[0].stop+30 and ms[1].start-30<=cx<=ms[1].stop+30:
                lab[lab==i+1]=lid; break
H=arr.shape[0]
info=[]
for lid,sl in cand:
    y0,y1=sl[0].start,sl[0].stop; x0,x1=sl[1].start,sl[1].stop
    info.append(dict(lid=lid,x0=x0,x1=x1,y0=y0,y1=y1,cy=(y0+y1)/2,cx=(x0+x1)/2))
info.sort(key=lambda d:d['cy'])
# row grouping
rows=[]
for d in info:
    if rows and abs(d['cy']-np.mean([e['cy'] for e in rows[-1]]))< H*0.12: rows[-1].append(d)
    else: rows.append([d])
for r in rows: r.sort(key=lambda d:d['cx'])
print('rows:', [[(d['x0'],d['y0'],d['x1'],d['y1']) for d in r] for r in rows])
names=argv[2:]
# top row: merge all blobs of first row into one object
order=[rows[0]]+[[d] for r in rows[1:] for d in r]
for name,group in zip(names,order):
    if name=='-': continue
    size=600
    if '@' in name: name,size=name.split('@'); size=int(size)
    keep=np.isin(lab,[d['lid'] for d in group]) & m
    ys,xs=np.where(keep)
    out=arr.copy(); out[...,3]=np.where(keep,arr[...,3],0)
    x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    c=Image.fromarray(out).crop((x0,y0,x1,y1))
    t=A.tight(c,size); t.save(f'prototype/stamp/assets/{name}.png'); print(name,t.size)
if len(order)!=len(names): print('WARN: objects',len(order),'names',len(names))
