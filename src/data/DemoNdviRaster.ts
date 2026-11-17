import {PARK_LAYOUT} from '../config/park-layout';
import type {NdviRaster} from './NdviRaster';
/** Synthetic spatial pattern in the same demo layer as all sensor readings. Never a measured map. */
export function createDemoNdviRaster(timestamp:number,revision:number,quality:NdviRaster['quality'],wave:number,entityId='plot-02'):NdviRaster{
 const plot=PARK_LAYOUT.plots.find(p=>p.id===entityId);if(!plot)throw new Error('未知NDVI田块');
 const profile=({'plot-01':{base:.83,u:.68,v:.35},'plot-02':{base:.79,u:.27,v:.68},'plot-03':{base:.63,u:.51,v:.47}} as const)[entityId as 'plot-01'|'plot-02'|'plot-03'];
 const width=28,height=32,values:number[]=[],validMask:number[]=[];
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const u=(col+.5)/width,v=(row+.5)/height;
  const low=Math.exp(-((u-profile.u)**2/.022+(v-profile.v)**2/.045));
  values.push(+Math.max(-1,Math.min(1,profile.base+.09*Math.sin(u*4+v*3)-.43*low+wave*.025)).toFixed(4));
  validMask.push(quality==='unknown'||u>.86&&v<.13?0:1);
 }
 return Object.freeze({entityId,mode:'demo',sourceId:'demo-ndvi-v1',revision,timestamp,quality,frameId:'FarmWorld',width,height,extentM:Object.freeze({xMin:plot.positionM[0]-14,xMax:plot.positionM[0]+14,zMin:plot.positionM[2]-16,zMax:plot.positionM[2]+16}),values:Object.freeze(values),validMask:Object.freeze(validMask)});
}
