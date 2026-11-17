import { BoxGeometry, DirectionalLight, Group, HemisphereLight, Mesh, MeshStandardMaterial, PMREMGenerator, Scene, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CameraShot } from '../app/ports/scene';
import type { SceneContent } from './SceneContent';
import { createSolarTable } from './assets/solarTable';
import { createSolarTextures } from './assets/solarTextures';
import { createSoilTextures } from './assets/proceduralTextures';
import { FrameRegistry } from '../spatial/FrameRegistry';
import { createEntityNodes, TransformSync } from './EntityNodes';

export const SOLAR_SAMPLE_SHOTS:readonly CameraShot[]=[
  {id:'solar-front',label:'单桌 · 正面全貌',positionM:[67,6.5,-40],targetM:[60,1,-50],up:[0,1,0],verticalFovDeg:43,nearM:.05,farM:3000},
  {id:'solar-detail',label:'板面 · 电池细栅',positionM:[60.5,3.5,-47.3],targetM:[60,1.25,-50],up:[0,1,0],verticalFovDeg:40,nearM:.03,farM:3000},
  {id:'solar-rear',label:'背面 · 支架接线',positionM:[65,2.7,-56.5],targetM:[60,.95,-50],up:[0,1,0],verticalFovDeg:47,nearM:.03,farM:3000},
  {id:'solar-side',label:'侧面 · 固定倾角',positionM:[70,2.8,-49.8],targetM:[60,1,-50],up:[0,1,0],verticalFovDeg:35,nearM:.05,farM:3000},
];
/** Authoring sample only. Materials/textures owned here; builder owns only its geometry. */
export function createSolarSampleScene(renderer:WebGLRenderer):SceneContent{
  const scene=new Scene();scene.background=null;
  const generator=new PMREMGenerator(renderer),room=new RoomEnvironment(),environment=generator.fromScene(room,.04);room.dispose();generator.dispose();scene.environment=environment.texture;scene.environmentIntensity=.55;
  scene.add(new HemisphereLight(0xe4efff,0x8e795e,2.4));
  const sun=new DirectionalLight(0xffeed0,3.0);sun.position.set(54,12,-46);sun.target.position.set(60,0,-50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});sun.shadow.bias=-.00006;sun.shadow.normalBias=.008;scene.add(sun,sun.target);
  const texture=createSolarTextures(),soil=createSoilTextures();
  const materials={cell:new MeshStandardMaterial({map:texture.color,roughness:.32,metalness:.25}),frame:new MeshStandardMaterial({color:0xb9c3c3,roughness:.38,metalness:.7}),back:new MeshStandardMaterial({color:0xc5cac7,roughness:.8}),cable:new MeshStandardMaterial({color:0x222a2c,roughness:.75}),foot:new MeshStandardMaterial({color:0x96938a,roughness:.95})};
  const table=createSolarTable(materials),nodes=createEntityNodes('solar-sample');nodes.visual.add(table.root);
  const frames=new FrameRegistry();frames.register({frameId:'solar-sample',parentFrameId:'FarmWorld',localPosition:[60,0,-50],localQuaternion:[0,0,0,1]});new TransformSync(frames).apply(nodes,'solar-sample');scene.add(nodes.root);
  const surfaces=new Group();const groundMaterial=new MeshStandardMaterial({map:soil.color,bumpMap:soil.bump,bumpScale:.012,roughness:1});const ground=new Mesh(new BoxGeometry(10,.1,5.5),groundMaterial);ground.position.set(60,-.05,-50);ground.receiveShadow=true;surfaces.add(ground);scene.add(surfaces);
  let disposed=false;return {scene,surfaces,dispose:()=>{if(disposed)return;disposed=true;table.dispose();for(const material of Object.values(materials))material.dispose();texture.dispose();soil.dispose();ground.geometry.dispose();groundMaterial.dispose();scene.environment=null;environment.dispose();sun.shadow.dispose();scene.clear();}};
}
