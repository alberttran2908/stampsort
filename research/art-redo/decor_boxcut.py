# usage: boxcut.py <grid.png> name:x0,y0,x1,y1[@size] ...   (writes prototype/stamp/assets/<name>.png)
# keeps the largest connected blob in the box plus blobs >= 8% of it (drops slivers of neighbours)
import sys; sys.path.insert(0,'tools'); argv=sys.argv[:]; sys.argv=['x']
import art_slice as A
import numpy as np
from scipy import ndimage
from PIL import Image
im=Image.open(argv[1]).convert('RGBA')
transparent = im.getchannel('A').getextrema()[0] < 10
for spec in argv[2:]:
    name, rest = spec.split(':',1)
    size=600
    if '@' in rest: rest, size = rest.split('@'); size=int(size)
    box=tuple(int(v) for v in rest.split(','))
    c=im.crop(box)
    if not transparent: c=A.remove_bg(c)
    arr=np.array(c); m=arr[...,3]>24
    lab,n=ndimage.label(m)
    if n>1:
        sizes=ndimage.sum(m,lab,range(1,n+1)); big=sizes.max()
        keep=[i+1 for i,s in enumerate(sizes) if s>=0.08*big]
        arr[...,3]=np.where(np.isin(lab,keep),arr[...,3],0); c=Image.fromarray(arr)
    t=A.tight(c,size); t.save(f'prototype/stamp/assets/{name}.png'); print(name, t.size)
