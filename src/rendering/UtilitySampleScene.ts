import { BoxGeometry, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshStandardMaterial, Scene, WebGLRenderer } from 'three';
import type { CameraShot } from '../app/ports/scene';
import type { SceneContent } from './SceneContent';
import { createController,createIrrigation } from './assets/irrigation';
import { createDaylightEnvironment } from './assets/daylightEnvironment';
import { createSoilTextures } from './assets/proceduralTextures';
import { createEntityNodes,TransformSync } from './EntityNodes';
import { FrameRegistry } from '../spatial/FrameRegistry';
export const UTILITY_SAMPLE_SHOTS:readonly CameraShot[]=[
 {id:'utility-whole',label:'组合 · 单田管网',positionM:[91,29,-13],targetM:[60,.5,-50],up:[0,1,0],verticalFovDeg:43,nearM:.03,farM:3000},
 {id:'utility-cabinet',label:'控制柜 · 门缝显示区',positionM:[77.5,1.3,-31.8],targetM:[76,.65,-34],up:[0,1,0],verticalFovDeg:40,nearM:.01,farM:3000},
 {id:'utility-valve',label:'入水阀 · 手柄与接头',positionM:[47.65,.43,-34.55],targetM:[47.4,.11,-35],up:[0,1,0],verticalFovDeg:40,nearM:.005,farM:3000},
 {id:'utility-joint',label:'支管 · 连接与端帽',positionM:[48.65,.48,-34.45],targetM:[48.3,.08,-35],up:[0,1,0],verticalFovDeg:43,nearM:.005,farM:3000},
];
export function createUtilitySampleScene(renderer:WebGLRenderer):SceneContent{
  const scene=new Scene();scene.background=null;const environment=createDaylightEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.55;
  scene.add(new HemisphereLight(0xdcecf7,0x88724f,2.5));const sun=new DirectionalLight(0xffefd5,3);sun.position.set(43,34,-24);sun.target.position.set(60,0,-50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:26,bottom:-26,near:.1,far:100});sun.shadow.normalBias=.012;sun.shadow.bias=-.00005;scene.add(sun,sun.target);
  const soil=createSoilTextures();
  const materials={metal:new MeshStandardMaterial({color:0xa3adb0,metalness:.7,roughness:.4}),housing:new MeshStandardMaterial({color:0xd9ded6,metalness:.1,roughness:.65}),dark:new MeshStandardMaterial({color:0x303b38,roughness:.75}),screen:new MeshStandardMaterial({color:0x182b29,roughness:.35}),handle:new MeshStandardMaterial({color:0x557b74,roughness:.6})};
  const controller=createController(materials),irrigation=createIrrigation(materials),frames=new FrameRegistry();
  for(const [id,asset,position] of [['controller-sample',controller,[76,0,-34]],['irrigation-sample',irrigation,[60,0,-50]]] as const){const nodes=createEntityNodes(id);nodes.visual.add(asset.root);scene.add(nodes.root);frames.register({frameId:id,parentFrameId:'FarmWorld',localPosition:[...position],localQuaternion:[0,0,0,1]});new TransformSync(frames).apply(nodes,id);}
  const surfaces=new Group(),groundMaterial=new MeshStandardMaterial({map:soil.color,bumpMap:soil.bump,bumpScale:.01,roughness:1}),ground=new Mesh(new BoxGeometry(28,.08,32),groundMaterial);ground.position.set(60,-.04,-50);ground.receiveShadow=true;surfaces.add(ground);const pad=new Mesh(new BoxGeometry(1.3,.08,1),groundMaterial);pad.position.set(76,-.04,-34);pad.receiveShadow=true;surfaces.add(pad);scene.add(surfaces);
  let disposed=false;return {scene,surfaces,skyColor:'#c6deea',selectShot:(id:string)=>{
    const close=id!=='utility-whole',target=id==='utility-cabinet'?[76,.6,-34]:id==='utility-joint'?[48.3,.08,-35]:[47.4,.1,-35];
    if(close){sun.target.position.set(target[0],target[1],target[2]);sun.position.set(target[0]-10,target[1]+15,target[2]+10);}else{sun.target.position.set(60,0,-50);sun.position.set(43,34,-24);}
    const extent=close?3:26;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});sun.shadow.normalBias=close?.004:.012;sun.shadow.camera.updateProjectionMatrix();
  },dispose:()=>{if(disposed)return;disposed=true;controller.dispose();irrigation.dispose();for(const m of Object.values(materials))m.dispose();soil.dispose();ground.geometry.dispose();pad.geometry.dispose();groundMaterial.dispose();scene.environment=null;environment.dispose();sun.shadow.dispose();scene.clear();}};
}
