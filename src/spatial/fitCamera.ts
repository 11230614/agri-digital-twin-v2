import {Vector3} from 'three';
import type {CameraShot} from '../app/ports/scene';
import type {Vec3} from '../shared/contracts/spatial';
/** Fit all eight authored bound corners to actual canvas aspect, preserving target and view direction. */
export function fittedCameraPosition(shot:CameraShot,width:number,height:number):Vec3{
 if(!shot.fitBounds)return shot.positionM;
 const target=new Vector3(...shot.targetM),direction=target.clone().sub(new Vector3(...shot.positionM)).normalize(),right=new Vector3().crossVectors(direction,new Vector3(...shot.up)).normalize(),up=new Vector3().crossVectors(right,direction).normalize();
 const tanV=Math.tan(shot.verticalFovDeg*Math.PI/360)*.9,tanH=tanV*width/Math.max(1,height);
 let distance=shot.nearM;
 for(const x of [shot.fitBounds.minM[0],shot.fitBounds.maxM[0]])for(const y of [shot.fitBounds.minM[1],shot.fitBounds.maxM[1]])for(const z of [shot.fitBounds.minM[2],shot.fitBounds.maxM[2]]){
  const d=new Vector3(x,y,z).sub(target),depth=d.dot(direction);
  distance=Math.max(distance,Math.abs(d.dot(right))/tanH-depth,Math.abs(d.dot(up))/tanV-depth,shot.nearM*2-depth);
 }
 return target.addScaledVector(direction,-distance).toArray();
}
