/** Normalized raster contract shared by demo and future real-data adapters. No Three objects. */
export interface NdviRaster {
 readonly entityId:string;readonly mode:'demo'|'live'|'replay';readonly sourceId:string;readonly revision:number;readonly timestamp:number;
 readonly quality:'good'|'unknown'|'stale';readonly frameId:'FarmWorld';
 readonly width:number;readonly height:number;
 /** Row-major, pixel-edge extent: row 0 north (-Z), columns east (+X), rows south (+Z). */
 readonly extentM:{readonly xMin:number;readonly xMax:number;readonly zMin:number;readonly zMax:number};
 /** Physical NDVI [-1,1], not grayscale. Invalid pixels are excluded by validMask=0. */
 readonly values:readonly number[];readonly validMask:readonly number[];
}
export function validateNdviRaster(r:NdviRaster):void{
 const e=r.extentM;
 if(r.frameId!=='FarmWorld'||!['demo','live','replay'].includes(r.mode)||!['good','unknown','stale'].includes(r.quality)||!r.entityId||!r.sourceId||!Number.isSafeInteger(r.revision)||r.revision<0||!Number.isFinite(r.timestamp)||!Number.isInteger(r.width)||!Number.isInteger(r.height)||r.width<1||r.height<1||r.width>2048||r.height>2048||![e.xMin,e.xMax,e.zMin,e.zMax].every(Number.isFinite)||e.xMax<=e.xMin||e.zMax<=e.zMin||r.values.length!==r.width*r.height||r.validMask.length!==r.values.length)throw new Error('NDVI栅格元数据无效');
 for(let i=0;i<r.values.length;i++)if(![0,1].includes(r.validMask[i])||r.validMask[i]===1&&(!Number.isFinite(r.values[i])||r.values[i]< -1||r.values[i]>1))throw new Error('NDVI栅格像元无效');
}
export function rasterMean(r:NdviRaster):number|null{
 validateNdviRaster(r);let sum=0,count=0;for(let i=0;i<r.values.length;i++)if(r.validMask[i]===1){sum+=r.values[i];count++;}return count?sum/count:null;
}
