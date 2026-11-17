import {Vector3} from 'three';
import type {CameraShot} from '../app/ports/scene';
import type {Vec3} from '../shared/contracts/spatial';
import {fittedCameraPosition} from '../spatial/fitCamera';
import {PARK_SHOTS} from '../config/park-shots';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const radians=(v:number)=>v*Math.PI/180;
export interface NavigationState {targetM:Vec3;distanceM:number;maxDistanceM:number;yawRad:number;pitchRad:number;positionM:Vec3;mode:'orbit'|'local'}
/** Pure FarmWorld navigation. No geography, DOM, frame loop or Three object ownership. */
export class ParkNavigationPolicy {
 private target=new Vector3();private distance=1;private yaw=0;private pitch=0;
 private maxDistance=1;private width=1;private height=1;private shot!:CameraShot;
 private local=false;
 private flight?:{start:NavigationState;target:Vec3;distance:number;yaw:number;pitch:number;elapsed:number};
 focusStatus:'idle'|'moving'|'arrived'|'interrupted'='idle';
 cancelFocus(){if(this.flight){this.flight=undefined;this.focusStatus='interrupted';}}
 focus(target:Vec3,radius:number,minimumDistance:number,insets:{left:number;right:number}={left:0,right:0},pose:{yawRad?:number;pitchRad?:number}={}){
  if(![...target,radius,minimumDistance,insets.left,insets.right,pose.yawRad??.4,pose.pitchRad??radians(42)].every(Number.isFinite)||radius<=0||minimumDistance<=0||insets.left<0||insets.right<0)throw new Error('无效聚焦参数');
  this.cancelFocus();
  const vertical=radians(this.shot.verticalFovDeg)/2;
  const usable=Math.max(.15,(this.width-insets.left-insets.right)/this.width);
  const horizontal=Math.atan(Math.tan(vertical)*this.width/this.height*usable);
  const distance=clamp(Math.max(minimumDistance,radius/Math.sin(Math.min(vertical,horizontal)) * 1.15),1,this.maxDistance);
  this.local=false;
  this.flight={start:this.state,target,distance,yaw:pose.yawRad??.4,pitch:pose.pitchRad??radians(42),elapsed:0};this.focusStatus='moving';
 }
 advanceFocus(dt:number){
  const flight=this.flight;if(!flight)return;
  flight.elapsed+=clamp(dt,0,.1);const t=Math.min(1,flight.elapsed/1.1),ease=t*t*(3-2*t),s=flight.start;
  this.target.set(...s.targetM).lerp(new Vector3(...flight.target),ease);this.distance=s.distanceM+(flight.distance-s.distanceM)*ease;
  const angle=Math.atan2(Math.sin(flight.yaw-s.yawRad),Math.cos(flight.yaw-s.yawRad));
  this.yaw=s.yawRad+angle*ease;this.pitch=s.pitchRad+(flight.pitch-s.pitchRad)*ease;this.constrain();
  if(t>=1){this.flight=undefined;this.focusStatus='arrived';}
 }
 constructor(shot:CameraShot,width:number,height:number){this.reset(shot,width,height);}
 reset(shot:CameraShot,width:number,height:number){
  this.cancelFocus();this.focusStatus='idle';
  this.shot=shot;this.local=shot.id==='CAM-02'||shot.id==='CAM-03';this.width=width;this.height=height;
  const p=new Vector3(...fittedCameraPosition(shot,width,height)),target=new Vector3(...shot.targetM),offset=p.clone().sub(target);
  this.distance=offset.length();this.yaw=Math.atan2(offset.x,offset.z);this.pitch=Math.asin(offset.y/this.distance);
  // Near shots rotate around a point 2m ahead, avoiding a sweep around the whole greenhouse.
  if(this.local){this.distance=2;target.copy(p).addScaledVector(offset.normalize(),-2);}
  this.target.copy(target);this.calculateMax();this.constrain();
 }
 resize(width:number,height:number){
  const ratio=this.distance/this.maxDistance;this.width=width;this.height=height;this.calculateMax();
  // Preserve a user's pose; at the overview limit keep the same framing after a resize.
  if(ratio>.999)this.distance=this.maxDistance;
  this.constrain();
 }
 private calculateMax(){
  const overview=PARK_SHOTS[0],p=new Vector3(...fittedCameraPosition(overview,this.width,this.height));
  this.maxDistance=p.distanceTo(new Vector3(...overview.targetM))*Math.tan(radians(overview.verticalFovDeg)/2)/Math.tan(radians(this.shot.verticalFovDeg)/2);
 }
 /** User-requested faster drag: 0.012rad/CSS px (~69 degrees per 100px), with no per-drag cap. */
 orbit(dx:number,dy:number){this.cancelFocus();this.yaw-=dx*.012;this.pitch+=dy*.012;this.constrain();}
 zoom(delta:number){this.cancelFocus();this.distance*=Math.exp(clamp(delta,-1200,1200)*.0015);this.constrain();}
 pan(dx:number,dy:number){
  this.cancelFocus();
  const meters=2*this.distance*Math.tan(radians(this.shot.verticalFovDeg)/2)/Math.max(1,this.height);
  // Horizontal ground basis: no altitude/up mutation from a pan gesture.
  this.target.x+=(-Math.cos(this.yaw)*dx-Math.sin(this.yaw)*dy)*meters;
  this.target.z+=(Math.sin(this.yaw)*dx-Math.cos(this.yaw)*dy)*meters;
  this.constrain();
 }
 private constrain(){
  this.distance=clamp(this.distance,this.local?.5:1,this.maxDistance);
  this.pitch=clamp(this.pitch,radians(this.local?-10:15),radians(this.local?80:85));
  this.yaw=Math.atan2(Math.sin(this.yaw),Math.cos(this.yaw));
  // Full park plus 5m. Near maximum zoom-out, progressively return the focus to the overview centre.
  const freedom=1-clamp((this.distance/this.maxDistance-.65)/.35,0,1);
  const cx=54,cz=-39;
  // Outer 5m envelope alone allows the view centre to land on empty imagery.
  // Keep the pivot on the designed surface with a distance-dependent inset as well.
  const inset=Math.min(10,this.distance*.15);
  this.target.x=clamp(this.target.x,Math.max(inset,cx+(-5-cx)*freedom),Math.min(108-inset,cx+(113-cx)*freedom));
  this.target.z=clamp(this.target.z,Math.max(-90+inset,cz+(-95-cz)*freedom),Math.min(-inset,cz+(5-cz)*freedom));
  // Keep even a slightly upward near view above the design ground plane.
  const minPitch=Math.asin(clamp((.35-this.target.y)/this.distance,-1,1));
  this.pitch=Math.max(this.pitch,minPitch);
 }
 get state():NavigationState{
  const horizontal=this.distance*Math.cos(this.pitch);
  return{targetM:this.target.toArray(),distanceM:this.distance,maxDistanceM:this.maxDistance,yawRad:this.yaw,pitchRad:this.pitch,mode:this.local?'local':'orbit',positionM:[this.target.x+horizontal*Math.sin(this.yaw),this.target.y+this.distance*Math.sin(this.pitch),this.target.z+horizontal*Math.cos(this.yaw)]};
 }
}
