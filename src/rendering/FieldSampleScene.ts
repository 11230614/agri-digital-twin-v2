import { BoxGeometry, Color, CylinderGeometry, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Scene, WebGLRenderer } from 'three';
import type { CameraShot } from '../app/ports/scene';
import type { SceneContent } from './SceneContent';
import { createController,createIrrigation } from './assets/irrigation';
import {createField} from './assets/field';
import {createWeatherStation,createSoilSensor} from './assets/instruments';
import { createDaylightEnvironment } from './assets/daylightEnvironment';
import { createSoilTextures,createLeafTextures } from './assets/proceduralTextures';
import { createEntityNodes,TransformSync } from './EntityNodes';
import { FrameRegistry } from '../spatial/FrameRegistry';
export const FIELD_SAMPLE_SHOTS:readonly CameraShot[]=[
 {id:'field-whole',label:'田块全貌 · 10垄2680株',positionM:[88,26,4],targetM:[60,.8,-34],up:[0,1,0],verticalFovDeg:43,nearM:.03,farM:3000},
 {id:'field-row',label:'行间 · 土垄与滴灌',positionM:[49.5,1.2,-18.2],targetM:[48.3,.24,-25],up:[0,1,0],verticalFovDeg:52,nearM:.02,farM:3000},
 {id:'field-leaf',label:'作物近景 · 贴垄根基',positionM:[49.12,.66,-20.02],targetM:[48.75,.27,-20.8],up:[0,1,0],verticalFovDeg:40,nearM:.015,farM:3000},
 {id:'field-edge',label:'监测边带 · 设备比例',positionM:[78,3.2,-13],targetM:[73.2,1.2,-35],up:[0,1,0],verticalFovDeg:44,nearM:.02,farM:3000},
 {id:'field-valve',label:'入水口 · 高度过渡',positionM:[48,.55,-18],targetM:[47.7,.1,-19],up:[0,1,0],verticalFovDeg:44,nearM:.01,farM:3000},
];
export function createFieldSampleScene(renderer:WebGLRenderer):SceneContent{
  const scene=new Scene();scene.background=null;const environment=createDaylightEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.55;
  scene.add(new HemisphereLight(0xdcecf7,0x88724f,2.5));const sun=new DirectionalLight(0xffefd5,3);sun.position.set(43,34,-24);sun.target.position.set(60,0,-50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:26,bottom:-26,near:.1,far:100});sun.shadow.normalBias=.012;sun.shadow.bias=-.00005;scene.add(sun,sun.target);
  const soil=createSoilTextures(),leaf=createLeafTextures();for(const t of [soil.color,soil.bump])t.repeat.set(1,1);
  const materials={metal:new MeshStandardMaterial({color:0xa3adb0,metalness:.7,roughness:.4}),housing:new MeshStandardMaterial({color:0xd9ded6,metalness:.1,roughness:.65}),dark:new MeshStandardMaterial({color:0x303b38,roughness:.75}),screen:new MeshStandardMaterial({color:0x182b29,roughness:.35}),handle:new MeshStandardMaterial({color:0x557b74,roughness:.6})};
  const leafMaterial=new MeshPhysicalMaterial({map:leaf.color,bumpMap:leaf.bump,bumpScale:.00035,roughnessMap:leaf.roughness,roughness:.8,side:DoubleSide,vertexColors:true,sheen:.18,sheenColor:new Color(0xc1d998),sheenRoughness:.75});
  const groundMaterial=new MeshStandardMaterial({map:soil.color,bumpMap:soil.bump,bumpScale:.009,roughness:1});
  const field=createField({soil:groundMaterial,leaf:leafMaterial}),controller=createController(materials),irrigation=createIrrigation(materials,.135),weather=createWeatherStation({...materials,indicator:materials.handle}),sensors=Array.from({length:3},()=>createSoilSensor({...materials,indicator:materials.handle})),frames=new FrameRegistry();
  const install=(id:string,asset:{root:Group},position:[number,number,number])=>{const nodes=createEntityNodes(id);nodes.visual.add(asset.root);scene.add(nodes.root);frames.register({frameId:id,parentFrameId:'FarmWorld',localPosition:position,localQuaternion:[0,0,0,1]});new TransformSync(frames).apply(nodes,id);};
  install('plot-02',field,[60,0,-34]);install('irrigation-sample',irrigation,[60,0,-34]);install('controller-02',controller,[76,0,-20]);install('weather-02',weather,[73.2,0,-46]);sensors.forEach((asset,i)=>install(`plot-02:sensor-0${i+1}`,asset,[73.2,0,[-24,-34,-44][i]]));
  const surfaces=new Group(),ground=new Mesh(new BoxGeometry(28,.08,32),groundMaterial);ground.position.set(60,-.04,-34);const uv=ground.geometry.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*14,uv.getY(i)*16);ground.receiveShadow=true;surfaces.add(ground);
  const pad=new Mesh(new BoxGeometry(1.3,.08,1),groundMaterial);pad.position.set(76,-.04,-20);pad.receiveShadow=true;surfaces.add(pad);scene.add(surfaces);
  const cornerGeometry=new CylinderGeometry(.03,.03,.35,8);for(const x of [-13.7,13.7])for(const z of [-15.7,15.7]){const post=new Mesh(cornerGeometry,materials.metal);post.position.set(60+x,.175,-34+z);post.castShadow=true;scene.add(post);}
  let disposed=false;return {scene,surfaces,skyColor:'#c6deea',prepareRender:(camera,height)=>field.prepare(camera,height),selectShot:(id:string)=>{
    const close=id==='field-leaf'||id==='field-valve'||id==='field-row'||id==='field-edge',target=id==='field-edge'?[73,1,-34]:id==='field-leaf'?[48.75,.2,-20.8]:id==='field-valve'?[47.7,.1,-19]:[48.3,.2,-25];
    if(close){sun.target.position.set(target[0],target[1],target[2]);sun.position.set(target[0]-10,target[1]+15,target[2]+10);}else{sun.target.position.set(60,0,-34);sun.position.set(43,34,-8);}
    const extent=close?(id==='field-edge'?18:id==='field-row'?8:3):26;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});sun.shadow.normalBias=id==='field-edge'?.02:close?.003:.008;sun.shadow.camera.updateProjectionMatrix();
  },dispose:()=>{if(disposed)return;disposed=true;field.dispose();controller.dispose();irrigation.dispose();weather.dispose();sensors.forEach(s=>s.dispose());cornerGeometry.dispose();leafMaterial.dispose();leaf.dispose();for(const m of Object.values(materials))m.dispose();soil.dispose();ground.geometry.dispose();pad.geometry.dispose();groundMaterial.dispose();scene.environment=null;environment.dispose();sun.shadow.dispose();scene.clear();}};
}
