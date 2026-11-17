import {PARK_LAYOUT,PARK_ROADS} from '../../config/park-layout';
import type {SurfaceRect} from './partitionedSurface';
/** No model-space repositioning; all rectangles are explicitly FarmWorld metres. */
export function parkSurfaceRects():SurfaceRect[]{
 const r:SurfaceRect[]=[{id:'park-core',x0:0,x1:PARK_LAYOUT.widthM,z0:-PARK_LAYOUT.lengthM,z1:0,kind:'grass',topM:0,bottomM:-.1}];
 for(const gh of PARK_LAYOUT.greenhouses){const [x,,z]=gh.positionM;r.push({id:`${gh.id}:ground`,x0:x-10,x1:x+10,z0:z-29,z1:z+1,kind:'soil',topM:0,bottomM:-.1});}
 for(const plot of PARK_LAYOUT.plots){const [x,,z]=plot.positionM;r.push({id:`${plot.id}:ground`,x0:x-14,x1:x+14,z0:z-16,z1:z+16,kind:'soil',topM:0,bottomM:-.1});}
 const [sx,,sz]=PARK_LAYOUT.solarGroup.positionM;r.push({id:'solar-group-01:ground',x0:sx-10,x1:sx+10,z0:sz-4,z1:sz+4,kind:'soil',topM:0,bottomM:-.1});
 for(const road of PARK_ROADS){const [x0,,z0]=road.fromM,[x1,,z1]=road.toM,h=road.widthM/2,alongX=z0===z1;r.push({id:road.id,x0:Math.min(x0,x1)-(alongX?0:h),x1:Math.max(x0,x1)+(alongX?0:h),z0:Math.min(z0,z1)-(alongX?h:0),z1:Math.max(z0,z1)+(alongX?h:0),kind:road.kind,topM:.02,bottomM:-.1});}
 return r;
}
