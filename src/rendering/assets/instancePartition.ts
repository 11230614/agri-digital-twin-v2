import {Sphere,type InstancedMesh,type Matrix4} from 'three';
import type {LeafQuality} from './leafGeometry';
export type InstancePartition=Record<LeafQuality,number[]>;
/** Static plants have immutable transforms. A subset always fits the full-population local sphere. */
export function createInstancePartition(batches:Record<LeafQuality,InstancedMesh>,plants:readonly {matrix:Matrix4}[]){
 for(const mesh of Object.values(batches)){
  mesh.geometry.computeBoundingSphere();const all=new Sphere().makeEmpty(),one=new Sphere();
  for(const plant of plants)all.union(one.copy(mesh.geometry.boundingSphere!).applyMatrix4(plant.matrix));
  mesh.boundingSphere=all;
 }
 const previous:InstancePartition={near:[],mid:[],far:[]};
 return(next:InstancePartition)=>{
  let changed=false;
  for(const quality of ['near','mid','far'] as const){
   const ids=next[quality],old=previous[quality],mesh=batches[quality];
   if(ids.length===old.length&&ids.every((id,i)=>id===old[i]))continue;
   ids.forEach((id,i)=>mesh.setMatrixAt(i,plants[id].matrix));
   mesh.count=ids.length;mesh.instanceMatrix.needsUpdate=true;previous[quality]=ids.slice();changed=true;
  }
  return changed;
 };
}
