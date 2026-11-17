"""Original deterministic, seamless cloud colour/coverage panorama. Build-time only."""
from pathlib import Path
import numpy as np
from PIL import Image
W,H=2048,1024
u=(np.arange(W,dtype=np.float32)+.5)/W
v=(np.arange(H,dtype=np.float32)+.5)/H
az=(u-.5)*2*np.pi;el=(.5-v)*np.pi
x=np.cos(el[:,None])*np.cos(az[None,:]);y=np.broadcast_to(np.sin(el[:,None]),(H,W));z=np.cos(el[:,None])*np.sin(az[None,:])
def noise(x,y,z):
 ix=np.floor(x);iy=np.floor(y);iz=np.floor(z);fx=x-ix;fy=y-iy;fz=z-iz
 sx=fx*fx*(3-2*fx);sy=fy*fy*(3-2*fy);sz=fz*fz*(3-2*fz)
 def h(a,b,c):
  q=np.sin(a*127.1+b*311.7+c*74.7+19.3)*43758.5453
  return q-np.floor(q)
 def lerp(a,b,t):return a+(b-a)*t
 return lerp(lerp(lerp(h(ix,iy,iz),h(ix+1,iy,iz),sx),lerp(h(ix,iy+1,iz),h(ix+1,iy+1,iz),sx),sy),lerp(lerp(h(ix,iy,iz+1),h(ix+1,iy,iz+1),sx),lerp(h(ix,iy+1,iz+1),h(ix+1,iy+1,iz+1),sx),sy),sz)
def fbm(x,y,z):
 result=np.zeros_like(x);weight=.52
 for i in range(6):
  result+=weight*noise(x,y,z);x=x*2.03+7.1;y=y*2.03-3.6;z=z*2.03+11.4;weight*=.48
 return result
def cloud(x,y,z):
 # Domain warp breaks the smooth noise blobs into irregular banks and billows.
 warp=noise(x*2+3,y*2+7,z*2-4)-.5
 return fbm(x*5.4+warp*1.5,y*3.8+warp,z*5.4+warp*1.5)
plane_x=x/np.maximum(y,.09)*.65;plane_z=z/np.maximum(y,.09)*.65
plane_y=np.full_like(y,.4)
d=cloud(plane_x,plane_y,plane_z);density=np.clip((d-.49)/.16,0,1)
alpha=(density*density*(3-2*density))*.94
# Match the park's north-west/south daylight. Density gradients supply cheap baked shading.
lit=np.clip(.9+(d-cloud(plane_x-.035,plane_y+.05,plane_z+.025))*2.5,.76,1)
colour=np.stack([lit*255,lit*254,lit*250],axis=-1)
alpha*=np.clip((y-.015)/.12,0,1)
rgba=np.concatenate([colour,alpha[:,:,None]*255],axis=-1).clip(0,255).astype(np.uint8)
path=Path('public/environment/daylight-clouds.png');path.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(rgba).save(path,optimize=True)
print(f'{path}: {path.stat().st_size} bytes; {W}x{H}; original procedural asset, no external runtime dependency')
