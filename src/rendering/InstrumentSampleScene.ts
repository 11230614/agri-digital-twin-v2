import { BoxGeometry, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshStandardMaterial, Scene, WebGLRenderer } from 'three';
import type { CameraShot } from '../app/ports/scene';
import type { SceneContent } from './SceneContent';
import { createWeatherStation,createSoilSensor } from './assets/instruments';
import { createDaylightEnvironment } from './assets/daylightEnvironment';
import { createSoilTextures } from './assets/proceduralTextures';
import { createEntityNodes,TransformSync } from './EntityNodes';
import { FrameRegistry } from '../spatial/FrameRegistry';
export const INSTRUMENT_SAMPLE_SHOTS:readonly CameraShot[]=[
 {id:'device-whole',label:'组合 · 真实比例',positionM:[64,2.5,-44],targetM:[60,1.7,-50],up:[0,1,0],verticalFovDeg:40,nearM:.02,farM:3000},
 {id:'device-head',label:'气象站 · 风杯百叶箱',positionM:[61.2,3.2,-48.5],targetM:[60,2.9,-50],up:[0,1,0],verticalFovDeg:38,nearM:.01,farM:3000},
 {id:'device-sensor',label:'传感器 · 设备头接线',positionM:[61.4,.65,-48.9],targetM:[61,.38,-49.8],up:[0,1,0],verticalFovDeg:40,nearM:.01,farM:3000},
 {id:'device-back',label:'背面 · 箱体与基座',positionM:[57,2.5,-54.5],targetM:[60,1.7,-50],up:[0,1,0],verticalFovDeg:40,nearM:.02,farM:3000},
];
export function createInstrumentSampleScene(renderer:WebGLRenderer):SceneContent{
  const scene=new Scene();scene.background=null;const environment=createDaylightEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.55;
  scene.add(new HemisphereLight(0xdcecf7,0x88724f,2.5));const sun=new DirectionalLight(0xffefd5,3);sun.position.set(51,17,-42);sun.target.position.set(60,3,-50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:8,bottom:-8,near:.1,far:40});sun.shadow.normalBias=.012;sun.shadow.bias=-.00005;scene.add(sun,sun.target);
  const soil=createSoilTextures();
  const materials={metal:new MeshStandardMaterial({color:0xa3adb0,metalness:.75,roughness:.35}),housing:new MeshStandardMaterial({color:0xd9ded6,metalness:.1,roughness:.65}),dark:new MeshStandardMaterial({color:0x273231,roughness:.7,side:DoubleSide}),indicator:new MeshStandardMaterial({color:0x5b938b,roughness:.45})};
  const weather=createWeatherStation(materials),sensor=createSoilSensor(materials),frames=new FrameRegistry();
  for(const [id,asset,position] of [['weather-sample',weather,[60,0,-50]],['sensor-sample',sensor,[61,0,-49.8]]] as const){const nodes=createEntityNodes(id);nodes.visual.add(asset.root);scene.add(nodes.root);frames.register({frameId:id,parentFrameId:'FarmWorld',localPosition:[...position],localQuaternion:[0,0,0,1]});new TransformSync(frames).apply(nodes,id);}
  const surfaces=new Group(),groundMaterial=new MeshStandardMaterial({map:soil.color,bumpMap:soil.bump,bumpScale:.01,roughness:1}),ground=new Mesh(new BoxGeometry(3,.08,3),groundMaterial);ground.position.set(60,-.04,-50);ground.receiveShadow=true;surfaces.add(ground);scene.add(surfaces);
  let disposed=false;return {scene,surfaces,skyColor:'#c6deea',dispose:()=>{if(disposed)return;disposed=true;weather.dispose();sensor.dispose();for(const m of Object.values(materials))m.dispose();soil.dispose();ground.geometry.dispose();groundMaterial.dispose();scene.environment=null;environment.dispose();sun.shadow.dispose();scene.clear();}};
}
