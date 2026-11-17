import { Cartesian3, Matrix4, PerspectiveFrustum, Viewer } from 'cesium';
import type { CameraShot } from '../app/ports/scene';
import type { GeoReferenceAdapter } from '../spatial/GeoReferenceAdapter';
import type { Vec3 } from '../shared/contracts/spatial';
import {ParkNavigationPolicy} from './ParkNavigationPolicy';
import {ParkNavigationInput} from './ParkNavigationInput';
import {fittedCameraPosition} from '../spatial/fitCamera';

export class CameraController {
  private shot: CameraShot;
  private navigation?:ParkNavigationPolicy;
  private input?:ParkNavigationInput;
  private lastPose:number[]=[];
  constructor(private readonly viewer: Viewer, private readonly geo: GeoReferenceAdapter, initial: CameraShot,localNavigation=false) {
    this.shot = initial;
    const controls = viewer.scene.screenSpaceCameraController;
    controls.enableCollisionDetection = false;
    controls.minimumZoomDistance = .5;
    controls.maximumZoomDistance = 1500;
    if(localNavigation){
      controls.enableRotate=false;controls.enableTranslate=false;controls.enableZoom=false;controls.enableTilt=false;controls.enableLook=false;
      controls.inertiaSpin=0;controls.inertiaTranslate=0;controls.inertiaZoom=0;
      this.navigation=new ParkNavigationPolicy(initial,Math.max(1,viewer.canvas.clientWidth),Math.max(1,viewer.canvas.clientHeight));
      this.input=new ParkNavigationInput(viewer.canvas,this.navigation,()=>controls.enableInputs);
    }
  }
  applyShot(shot: CameraShot, width: number, height: number): void {
    this.shot = shot;
    this.input?.cancel();this.navigation?.reset(shot,width,height);
    this.setFrustum(width, height);
    this.applyPose(width,height);
  }
  private applyPose(width:number,height:number):void {
    const shot=this.shot,position=this.navigation?.state.positionM??fittedCameraPosition(shot,width,height);
    const target=this.navigation?.state.targetM??shot.targetM;
    if(this.navigation){const pose=[...position,...target];if(pose.every((v,i)=>Math.abs(v-(this.lastPose[i]??Infinity))<1e-10))return;this.lastPose=pose;}
    const d: Vec3 = [target[0]-position[0],target[1]-position[1],target[2]-position[2]];
    const direction = Cartesian3.normalize(new Cartesian3(...this.geo.farmVectorToEcef(d)), new Cartesian3());
    const up = Cartesian3.normalize(new Cartesian3(...this.geo.farmVectorToEcef(this.navigation?[0,1,0]:shot.up)), new Cartesian3());
    // setView converts through heading/pitch/roll; it requires an orthonormal input basis.
    const right=Cartesian3.normalize(Cartesian3.cross(direction,up,new Cartesian3()),new Cartesian3());
    Cartesian3.normalize(Cartesian3.cross(right,direction,up),up);
    this.viewer.camera.setView({ destination: new Cartesian3(...this.geo.farmToEcef(position)), orientation: { direction, up }, endTransform: Matrix4.IDENTITY });
  }
  setFrustum(width: number, height: number): void {
    const frustum = this.viewer.camera.frustum;
    if (!(frustum instanceof PerspectiveFrustum)) throw new Error('禁止切换非透视模式');
    const a = width / Math.max(1,height);
    const v = this.shot.verticalFovDeg * Math.PI / 180;
    frustum.aspectRatio = a;
    frustum.fov = a > 1 ? 2 * Math.atan(Math.tan(v / 2) * a) : v;
    frustum.near = this.shot.nearM;
    frustum.far = this.shot.farM;
    if(this.navigation){this.navigation.resize(width,height);this.applyPose(width,height);}
    else if(this.shot.fitBounds)this.applyPose(width,height);
  }
  get navigationState(){return this.navigation?.state;}
  get focusStatus(){return this.navigation?.focusStatus??'idle';}
  cancelFocus(){this.navigation?.cancelFocus();}
  focusEntity(entity:import('../app/ports/interaction').InteractionEntity,insets?:{left:number;right:number}){
    this.input?.cancel();this.navigation?.focus(entity.focusTargetM,entity.bounds.radiusM,entity.minimumDistanceM,insets,{yawRad:entity.focusYawRad,pitchRad:entity.focusPitchRad});
  }
  advanceFocus(dt:number){this.navigation?.advanceFocus(dt);}
  dispose(){this.input?.dispose();}
  enforceLocalPolicy(): void {
    if(this.navigation){this.applyPose(this.viewer.canvas.clientWidth,this.viewer.canvas.clientHeight);return;}
    const c = this.viewer.camera.positionWC;
    const p = this.geo.ecefToFarm([c.x,c.y,c.z]);
    const dx=p[0]-60, dz=p[2]+50, radius=Math.hypot(dx,dz);
    if (p[1] >= .35 && p[1] <= 1500 && radius <= 1500) return;
    const ratio = radius > 1500 ? 1500/radius : 1;
    const destination = this.geo.farmToEcef([60+dx*ratio,Math.min(1500,Math.max(.35,p[1])),-50+dz*ratio]);
    const camera=this.viewer.camera;
    camera.setView({ destination:new Cartesian3(...destination), orientation:{ direction:Cartesian3.clone(camera.directionWC), up:Cartesian3.clone(camera.upWC) } });
  }
}
