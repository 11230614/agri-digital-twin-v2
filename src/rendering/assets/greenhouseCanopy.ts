import { Frustum, Sphere, Group, InstancedMesh, Matrix4, PerspectiveCamera, Quaternion, Vector3, type Material } from 'three';
import {createInstancePartition,type InstancePartition} from './instancePartition';
import { createLeafGeometry, type LeafQuality } from './leafGeometry';

/** Rendering-only projected-size LOD with hysteresis; never changes plant installation points. */
export function chooseLeafLod(pixels:number,previous:LeafQuality):LeafQuality{
  if(previous==='near'&&pixels>=21)return 'near';
  if(pixels>=28)return 'near';
  if(previous==='far'&&pixels<5)return 'far';
  return pixels>=4?'mid':'far';
}
export function createGreenhouseCanopy(material:Material,options:{cullOffscreen?:boolean;distantMaterial?:Material}={}){
  const root=new Group();root.name='approved-leaf-02-canopy';
  const batches=Object.fromEntries((['near','mid','far'] as const).map(quality=>{
    const mesh=new InstancedMesh(createLeafGeometry(.35,.45,quality),quality==='near'?material:(options.distantMaterial??material),780);mesh.count=0;mesh.name=`leaf-${quality}`;mesh.castShadow=quality==='near';mesh.receiveShadow=true;root.add(mesh);return [quality,mesh];
  })) as Record<LeafQuality,InstancedMesh>;
  const plants:{matrix:Matrix4;position:Vector3;quality:LeafQuality}[]=[];
  const rotation=new Quaternion();let index=0;
  for(const centerX of [-5,5])for(let col=0;col<10;col++)for(let row=0;row<39;row++){
    const position=new Vector3(centerX-2.7+.6*col,.45,-25.4+.6*row);
    rotation.setFromAxisAngle(new Vector3(0,1,0),Math.sin(index*2.3)*Math.PI);
    const horizontal=1+.025*Math.sin(index*1.9),height=.975+.025*Math.cos(index*2.8);
    plants.push({position,matrix:new Matrix4().compose(position,rotation,new Vector3(horizontal,height,horizontal)),quality:'far'});index++;
  }
  const submit=createInstancePartition(batches,plants),viewMatrix=new Matrix4();
  const up=new Vector3(0,1,0),point=new Vector3(),frustum=new Frustum(),sphere=new Sphere(point,.6);let disposed=false;let lastView:number[]=[];
  return {root,plants,batches,prepare:(camera:PerspectiveCamera,viewportHeight:number)=>{
    const ids:InstancePartition={near:[],mid:[],far:[]};root.updateWorldMatrix(true,false);const view=[...camera.matrixWorldInverse.elements,...camera.projectionMatrix.elements,...root.matrixWorld.elements,viewportHeight];if(view.every((v,i)=>Math.abs(v-(lastView[i]??Infinity))<1e-8))return false;lastView=view;
    if(options.cullOffscreen)frustum.setFromProjectionMatrix(camera.projectionMatrix);
    viewMatrix.multiplyMatrices(camera.matrixWorldInverse,root.matrixWorld);const factor=.47*viewportHeight/(2*Math.tan(camera.fov*Math.PI/360));
    for(let index=0;index<plants.length;index++){const plant=plants[index];
      point.copy(plant.position).addScaledVector(up,.175).applyMatrix4(viewMatrix);
      if(options.cullOffscreen&&!frustum.intersectsSphere(sphere))continue;
      const pixels=point.z>=0?0:factor/Math.max(.1,-point.z);
      const quality=plant.quality=chooseLeafLod(pixels,plant.quality);
      ids[quality].push(index);
    }
    return submit(ids);
  },dispose:()=>{if(disposed)return;disposed=true;for(const mesh of Object.values(batches)){mesh.geometry.dispose();mesh.dispose();}root.clear();}};
}
