import {Box3,Box3Helper,Color,Group,Ray,Raycaster,Sphere,Vector2,Vector3,type PerspectiveCamera} from 'three';
import type {InteractionEntity} from '../app/ports/interaction';
/** Cached business proxies: sphere broad phase, box narrow phase; never traverses plants. */
export class EntityInteraction {
 readonly root=new Group();
 private readonly entries:{entity:InteractionEntity;sphere:Sphere;box:Box3}[]=[];
 private readonly highlight:Box3Helper;
 private readonly raycaster=new Raycaster();
 private selected:string|null=null;
 lastPick={candidates:0,narrowTests:0,elapsedMs:0};
 constructor(){
  this.root.name='interaction-highlights';
  this.highlight=new Box3Helper(new Box3(),new Color('#77ffd1'));
  for(const material of [this.highlight.material].flat()){material.depthTest=true;material.depthWrite=false;material.toneMapped=false;}
  this.highlight.visible=false;this.root.add(this.highlight);
 }
 register(input:{id:string;kind:InteractionEntity['kind'];name:string;ownerId?:string;box:Box3;minimumDistanceM:number;focusYawRad?:number;focusPitchRad?:number}){
  if(this.entries.some(e=>e.entity.id===input.id))throw new Error(`重复交互实体 ${input.id}`);
  const box=input.box.clone(),sphere=box.getBoundingSphere(new Sphere());
  if(box.isEmpty()||!Number.isFinite(sphere.radius)||sphere.radius<=0)throw new Error('无效交互包络');
  const entity:InteractionEntity=Object.freeze({id:input.id,kind:input.kind,name:input.name,ownerId:input.ownerId,bounds:Object.freeze({minM:Object.freeze(box.min.toArray()),maxM:Object.freeze(box.max.toArray()),centerM:Object.freeze(sphere.center.toArray()),radiusM:sphere.radius}),focusTargetM:Object.freeze(sphere.center.toArray()),minimumDistanceM:input.minimumDistanceM,focusYawRad:input.focusYawRad,focusPitchRad:input.focusPitchRad});
  this.entries.push({entity,sphere,box});return entity;
 }
 get entities():readonly InteractionEntity[]{return Object.freeze(this.entries.map(e=>e.entity));}
 find(id:string){return this.entries.find(e=>e.entity.id===id)?.entity;}
 select(id:string|null){
  const entry=this.entries.find(e=>e.entity.id===id);
  if(id!==null&&!entry)throw new Error(`未知交互实体 ${id}`);
  this.selected=id;this.highlight.visible=!!entry;
  if(entry){this.highlight.box.copy(entry.box).expandByScalar(entry.entity.kind==='plot'?.04:.025);this.highlight.updateMatrixWorld(true);}
 }
 get selectedId(){return this.selected;}
 pickRay(ray:Ray,near=0,far=Infinity):string|null{
  const start=performance.now();let candidates=0,tests=0,best=Infinity,result:string|null=null;let shellDistance=Infinity,shellId:string|null=null;const point=new Vector3();
  for(const entry of this.entries){
   if(!ray.intersectsSphere(entry.sphere))continue;candidates++;tests++;
   if(entry.entity.kind==='greenhouse'&&entry.box.containsPoint(ray.origin))continue;
   const hit=ray.intersectBox(entry.box,point);if(!hit)continue;
   const distance=hit.distanceTo(ray.origin);if(distance<near||distance>far)continue;
   if(entry.entity.kind==='greenhouse'){if(distance<shellDistance){shellDistance=distance;shellId=entry.entity.id;}continue;}
   if(distance<best){best=distance;result=entry.entity.id;}
  }
  this.lastPick={candidates,narrowTests:tests,elapsedMs:performance.now()-start};return result??shellId;
 }
 pick(x:number,y:number,camera:PerspectiveCamera){this.raycaster.setFromCamera(new Vector2(x,y),camera);return this.pickRay(this.raycaster.ray,camera.near,camera.far);}
 dispose(){this.entries.length=0;this.highlight.geometry.dispose();for(const material of [this.highlight.material].flat())material.dispose();this.root.clear();}
}

