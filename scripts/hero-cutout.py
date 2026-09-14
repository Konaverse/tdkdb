"""
hero-cutout.py — builds the three homepage hero plates from the Almond render.

  python scripts/hero-cutout.py <render.png> <empty-plot.png> [out-dir]

  render.png      the building render, 1512 x 1300 (the "back layer")
  empty-plot.png  the same scene with the building removed (the inpainted plot)

Writes hero-plate.webp (street with the building's footprint filled — sky
interpolated from the render itself, plot from the inpainted image), and
hero-building.webp (the building with an alpha channel, cut along the sky).
The polygon below is in the render's pixel space; if a higher-resolution
render comes in, scale the polygon points by the same factor.

Needs Pillow and numpy.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
OUT=sys.argv[3] if len(sys.argv)>3 else "public/hero"
R=Image.open(sys.argv[1]).convert("RGB")
E=Image.open(sys.argv[2]).convert("RGB")
W,H=R.size
a=np.asarray(R).astype(np.int16); r,g,b=a[...,0],a[...,1],a[...,2]
sky=(b-np.maximum(r,g)>18)&(b>110)
P=[(560,300),(1100,585),(1100,700),(1062,742),(1062,960),(965,1005),(700,1105),(455,1092),
   (450,1050),(250,1040),(140,1000),(140,700),(175,600),(235,528),(380,452),(455,418)]
pm=Image.new("L",(W,H),0); ImageDraw.Draw(pm).polygon(P,fill=255)
force=Image.new("L",(W,H),0); ImageDraw.Draw(force).polygon([(945,690),(1062,700),(1062,745),(945,745)],fill=255)
m=((np.asarray(pm)>0)&~sky)|(np.asarray(force)>0)
free=~m; outside=np.zeros_like(m)
outside[0,:]=free[0,:]; outside[-1,:]=free[-1,:]; outside[:,0]=free[:,0]; outside[:,-1]=free[:,-1]
for it in range(4000):
    d=outside.copy(); d[1:,:]|=outside[:-1,:]; d[:-1,:]|=outside[1:,:]; d[:,1:]|=outside[:,:-1]; d[:,:-1]|=outside[:,1:]; d&=free
    if (d==outside).all(): break
    outside=d
m=m|(free&~outside)
mm=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
M=np.asarray(mm).astype(np.float32)/255
# --- base plate: empty plot colour-matched and blended under the building
s,dx,dy=1.04,7,164
Es=E.resize((int(E.width*s),int(E.height*s)),Image.LANCZOS)
warp=Image.new("RGB",(W,H),(0,0,0)); warp.paste(Es,(dx,dy))
cov=np.zeros((H,W),bool); cov[max(dy,0):dy+Es.height, max(dx,0):dx+Es.width]=True
Ra=np.asarray(R).astype(np.float32); Ea=np.asarray(warp).astype(np.float32)
wide=np.asarray(mm.filter(ImageFilter.MaxFilter(41)))>0
# Colour-fit the empty plot to the render on ground/horizon pixels only.
rows=np.arange(H)[:,None]
fitpx=cov&~wide&(rows>650)
for c in range(3):
    x=Ea[...,c][fitpx]; y=Ra[...,c][fitpx]
    A=np.vstack([x,np.ones_like(x)]).T; k,q=np.linalg.lstsq(A,y,rcond=None)[0]
    Ea[...,c]=np.clip(Ea[...,c]*k+q,0,255); print(f"chan{c}: k={k:.3f} q={q:.1f}")
# Sky rows: fill the footprint from the render's own sky, interpolating across
# the gap in each row. Nothing from the inpainted plate touches the sky.
foot=np.asarray(mm.filter(ImageFilter.MaxFilter(13)))>0
skyfill=Ra.copy()
xs=np.arange(W)
for yy in range(H):
    f=foot[yy]
    if not f.any() or f.all(): continue
    xp=xs[~f]
    for c in range(3):
        skyfill[yy,f,c]=np.interp(xs[f],xp,Ra[yy,~f,c])
wsky=np.clip((770-np.arange(H))/80.0,0,1)[:,None,None]   # 1 above y=690, 0 below 770
inside=skyfill*wsky+Ea*(1-wsky)
w=M[...,None]           # exactly the cutout's mask — the blend never shows outside it
base=Ra*(1-w)+inside*w
plate=Image.fromarray(base.astype(np.uint8))
plate.save(f"{OUT}/hero-plate.webp",quality=84,method=6)
plate.save(f"{OUT}/hero-plate.jpg",quality=86)
bld=R.convert("RGBA"); bld.putalpha(mm)
bld.save(f"{OUT}/hero-building.webp",quality=88,method=6)
bld.save(f"{OUT}/hero-building.png",optimize=True)
# overlay check of the lower right
print("done", (M>0.5).sum())
