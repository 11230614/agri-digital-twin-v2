import type {CameraShot} from '../app/ports/scene';
import {PARK_SHOTS} from './park-shots';
import {fittedCameraPosition} from '../spatial/fitCamera';
/** Dev-only repeatable camera load, advanced by the existing FrameCoordinator clock. */
export function createParkBenchmarkPath(id:string){
 const shot=PARK_SHOTS.find(s=>s.id===id);
 if(!shot||!['CAM-01','CAM-02','CAM-03'].includes(id))throw new Error('未知性能路径');
 return(timeS:number,width:number,height:number):CameraShot=>{
  const phase=2*Math.PI*timeS/30,[x,y,z]=fittedCameraPosition(shot,width,height);
  let positionM:CameraShot['positionM'];
  if(id==='CAM-01'){
   const yaw=Math.sin(phase)*Math.PI/24,dx=x-shot.targetM[0],dz=z-shot.targetM[2];
   positionM=[shot.targetM[0]+dx*Math.cos(yaw)-dz*Math.sin(yaw),y,shot.targetM[2]+dx*Math.sin(yaw)+dz*Math.cos(yaw)];
  }else if(id==='CAM-02')positionM=[x+.3*Math.sin(phase),y+.05*Math.sin(phase),z-.6*(1-Math.cos(phase))];
  else positionM=[x+.1*Math.sin(phase),y,z-.3*(1-Math.cos(phase))];
  return{...shot,positionM,fitBounds:undefined};
 };
}
