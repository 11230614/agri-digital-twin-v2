import {BufferGeometry,Float32BufferAttribute,Group,Mesh} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {createField} from './assets/field';
import {createRidgeGeometry} from './assets/field';
import {createNdviRasterMaterial,ndviColor} from './NdviRasterMaterial';
import type {NdviRaster} from '../data/NdviRaster';
import type {VegetationMode} from '../app/ports/data-visual';
/** One surface batch matching soil/ridges plus the existing three instanced canopy LOD batches. */
export function createNdviRasterVisualization(field:ReturnType<typeof createField>){
 const shader=createNdviRasterMaterial(),root=new Group();root.name='ndvi-ground-surface';
 const base=new BufferGeometry();base.setAttribute('position',new Float32BufferAttribute([-14,0,-16,-14,0,16,14,0,16,14,0,-16],3));base.setIndex([0,1,2,0,2,3]);
 const parts=[base];for(let i=0;i<10;i++){const ridge=createRidgeGeometry();ridge.deleteAttribute('normal');ridge.deleteAttribute('uv');ridge.translate(-11.7+2.6*i,0,0);parts.push(ridge);}
 const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!geometry)throw new Error('NDVI地表构建失败');
 const ground=new Mesh(geometry,shader.material);ground.name='ndvi-ground';root.add(ground);root.visible=false;
 const batches=Object.values(field.batches),originals=batches.map(b=>b.material);let mode:VegetationMode='natural',color='#8a9ca0',disposed=false;
 return {root,ground,get color(){return color;},get mode(){return mode;},get uploads(){return shader.uploads;},
  apply(r:NdviRaster){shader.apply(r);},
  set(next:VegetationMode,value:number|null){if(disposed)return;color='#'+ndviColor(value).getHexString();shader.setAvailable(value!==null);root.visible=next==='ndvi';if(next!==mode){mode=next;for(let i=0;i<batches.length;i++)batches[i].material=next==='ndvi'?shader.material:originals[i];}},
  dispose(){if(disposed)return;disposed=true;for(let i=0;i<batches.length;i++)batches[i].material=originals[i];geometry.dispose();shader.dispose();root.clear();},
 };
}
