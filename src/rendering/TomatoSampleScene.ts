import { BoxGeometry, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Scene, WebGLRenderer } from 'three';
import type { CameraShot } from '../app/ports/scene';
import type { SceneContent } from './SceneContent';
import { createTomato } from './assets/tomato';
import { createDaylightEnvironment } from './assets/daylightEnvironment';
import { createSoilTextures,createTomatoTextures } from './assets/proceduralTextures';
import { createEntityNodes,TransformSync } from './EntityNodes';
import { FrameRegistry } from '../spatial/FrameRegistry';

export const TOMATO_SAMPLE_SHOTS:readonly CameraShot[]=[
  {id:'tomato-whole',label:'单株 · 枝叶全貌',positionM:[61.85,1.85,-46.6],targetM:[60,1.18,-50],up:[0,1,0],verticalFovDeg:43,nearM:.03,farM:3000},
  {id:'tomato-leaf',label:'复叶 · 锯齿叶缘',positionM:[60.61,1.6,-49.28],targetM:[60,1.4,-50],up:[0,1,0],verticalFovDeg:38,nearM:.02,farM:3000},
  {id:'tomato-fruit',label:'果簇 · 青果转色',positionM:[59.6,1.45,-49.45],targetM:[59.92,1.3,-50],up:[0,1,0],verticalFovDeg:35,nearM:.01,farM:3000},
  {id:'tomato-back',label:'背面 · 支撑与根基',positionM:[58.4,1.65,-52.9],targetM:[60,1.15,-50],up:[0,1,0],verticalFovDeg:44,nearM:.03,farM:3000},
];
export function createTomatoSampleScene(renderer:WebGLRenderer):SceneContent{
  const scene=new Scene();scene.background=null;const environment=createDaylightEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.6;
  scene.add(new HemisphereLight(0xdcecf7,0x8a765b,2.5));const sun=new DirectionalLight(0xffefd5,3);sun.position.set(57,7,-47);sun.target.position.set(60,1,-50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-2,right:2,top:3,bottom:-3,near:.1,far:15});sun.shadow.normalBias=.002;sun.shadow.bias=-.00005;scene.add(sun,sun.target);
  const texture=createTomatoTextures(),soil=createSoilTextures();
  const materials={stem:new MeshStandardMaterial({color:0x5d7831,roughness:.82,side:DoubleSide}),leaf:new MeshPhysicalMaterial({map:texture.color,bumpMap:texture.bump,bumpScale:.0003,roughness:.8,side:DoubleSide,vertexColors:true,sheen:.12}),greenFruit:new MeshPhysicalMaterial({color:0x8b9e39,roughness:.4,clearcoat:.23,clearcoatRoughness:.35}),turningFruit:new MeshPhysicalMaterial({color:0xc99335,roughness:.43,clearcoat:.2}),rope:new MeshStandardMaterial({color:0xc4b991,roughness:.95})};
  const tomato=createTomato(materials),nodes=createEntityNodes('tomato-sample');nodes.visual.add(tomato.root);scene.add(nodes.root);const frames=new FrameRegistry();frames.register({frameId:'tomato-sample',parentFrameId:'FarmWorld',localPosition:[60,0,-50],localQuaternion:[0,0,0,1]});new TransformSync(frames).apply(nodes,'tomato-sample');
  const surfaces=new Group();const groundMaterial=new MeshStandardMaterial({map:soil.color,bumpMap:soil.bump,bumpScale:.008,roughness:1});const ground=new Mesh(new BoxGeometry(1.25,.1,1.25),groundMaterial);ground.position.set(60,-.05,-50);ground.receiveShadow=true;surfaces.add(ground);scene.add(surfaces);
  let disposed=false;return {scene,surfaces,skyColor:'#c6deea',dispose:()=>{if(disposed)return;disposed=true;tomato.dispose();for(const m of Object.values(materials))m.dispose();texture.dispose();soil.dispose();ground.geometry.dispose();groundMaterial.dispose();scene.environment=null;environment.dispose();sun.shadow.dispose();scene.clear();}};
}
