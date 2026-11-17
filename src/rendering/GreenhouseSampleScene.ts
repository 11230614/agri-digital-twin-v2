import { BoxGeometry, Color, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Scene, WebGLRenderer } from 'three';
import type { CameraShot } from '../app/ports/scene';
import type { SceneContent } from './SceneContent';
import { createGreenhouse } from './assets/greenhouse';
import {createGreenhouseTomatoes} from './assets/greenhouseTomatoes';
import { createGreenhouseCanopy } from './assets/greenhouseCanopy';
import { createDaylightEnvironment } from './assets/daylightEnvironment';
import { createConcreteTextures, createLeafTextures, createSoilTextures,createTomatoTextures } from './assets/proceduralTextures';
import { FrameRegistry } from '../spatial/FrameRegistry';
import { createEntityNodes, TransformSync } from './EntityNodes';

export const GREENHOUSE_SAMPLE_SHOTS:readonly CameraShot[]=[
  {id:'gh-exterior',label:'整棚 · 玻璃与拱架',positionM:[84,16,-27],targetM:[60,2.6,-53],up:[0,1,0],verticalFovDeg:47,nearM:.1,farM:3000},
  {id:'gh-interior',label:'棚内 · 人眼通道',positionM:[60,1.7,-43],targetM:[60,1.55,-64],up:[0,1,0],verticalFovDeg:65,nearM:.03,farM:3000},
  {id:'gh-crop',label:'床沿 · 叶菜近景',positionM:[58.75,1.28,-46.2],targetM:[56.7,.67,-49],up:[0,1,0],verticalFovDeg:48,nearM:.03,farM:3000},
  {id:'gh-entry',label:'入口 · 滑门三态',positionM:[63,3,-32],targetM:[60,1.6,-40],up:[0,1,0],verticalFovDeg:52,nearM:.05,farM:3000},
  {id:'gh-tomato',label:'侧带 · 番茄与吊蔓',positionM:[67.55,1.65,-47.2],targetM:[68.4,1.2,-49],up:[0,1,0],verticalFovDeg:47,nearM:.02,farM:3000},
  {id:'gh-rear',label:'后端 · 风机安装',positionM:[60,1.75,-61],targetM:[60,2,-67.6],up:[0,1,0],verticalFovDeg:62,nearM:.03,farM:3000},
];
/** Single fixed greenhouse authoring view. No full-farm/model-handle acceptance claim. */
export function createGreenhouseSampleScene(renderer:WebGLRenderer):SceneContent{
  const scene=new Scene();scene.background=null;
  const environment=createDaylightEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.65;
  scene.add(new HemisphereLight(0xdcecf7,0x9a8868,2.7));
  const sun=new DirectionalLight(0xffefd5,3);sun.position.set(39,35,-30);sun.target.position.set(60,0,-54);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-25,right:25,top:24,bottom:-24,near:.1,far:100});sun.shadow.bias=-.00007;sun.shadow.normalBias=.015;scene.add(sun,sun.target);
  const soil=createSoilTextures(),leaf=createLeafTextures(),concrete=createConcreteTextures(),tomatoTexture=createTomatoTextures();
  // Thin-sheet glass is intentionally visible from both sides after outward winding is verified.
  // Alpha + PMREM reflections preserve the independent Cesium canvas; transmission can't sample it.
  const glass=new MeshPhysicalMaterial({color:0xddeae7,transparent:true,opacity:.32,roughness:.14,metalness:0,side:DoubleSide,depthWrite:false,clearcoat:.8,clearcoatRoughness:.12,envMapIntensity:1.2});glass.forceSinglePass=true;
  const materials={frame:new MeshStandardMaterial({color:0xd9dfd7,roughness:.42,metalness:.65}),glass,bed:new MeshStandardMaterial({color:0xc6cbc2,roughness:.8}),soil:new MeshStandardMaterial({map:soil.color,bumpMap:soil.bump,bumpScale:.009,roughness:1}),floor:new MeshStandardMaterial({map:concrete.color,bumpMap:concrete.bump,bumpScale:.002,roughness:.72}),rubber:new MeshStandardMaterial({color:0x27322d,roughness:.8}),device:new MeshStandardMaterial({color:0x9fac9f,metalness:.35,roughness:.55,side:DoubleSide}),screen:new MeshStandardMaterial({color:0x203d3a,roughness:.3}),light:new MeshStandardMaterial({color:0xd7efeb,emissive:0xb8e4df,emissiveIntensity:.4,roughness:.3})};
  const leafMaterial=new MeshPhysicalMaterial({map:leaf.color,bumpMap:leaf.bump,bumpScale:.00035,roughnessMap:leaf.roughness,roughness:.8,metalness:0,side:DoubleSide,vertexColors:true,sheen:.18,sheenColor:new Color(0xc1d998),sheenRoughness:.75});
  const tomatoMaterials={stem:new MeshStandardMaterial({color:0x5d7831,roughness:.82,side:DoubleSide}),leaf:new MeshPhysicalMaterial({map:tomatoTexture.color,bumpMap:tomatoTexture.bump,bumpScale:.0003,roughness:.8,side:DoubleSide,vertexColors:true,sheen:.12}),greenFruit:new MeshPhysicalMaterial({color:0x8b9e39,roughness:.4,clearcoat:.23,clearcoatRoughness:.35}),turningFruit:new MeshPhysicalMaterial({color:0xc99335,roughness:.43,clearcoat:.2}),rope:new MeshStandardMaterial({color:0xc4b991,roughness:.95})};
  const tomatoes=createGreenhouseTomatoes(tomatoMaterials);
  const greenhouse=createGreenhouse(materials),canopy=createGreenhouseCanopy(leafMaterial);greenhouse.root.add(canopy.root,tomatoes.root);
  const nodes=createEntityNodes('greenhouse-sample');nodes.visual.add(greenhouse.root);scene.add(nodes.root);
  const frames=new FrameRegistry();frames.register({frameId:'greenhouse-sample',parentFrameId:'FarmWorld',localPosition:[60,0,-40],localQuaternion:[0,0,0,1]});new TransformSync(frames).apply(nodes,'greenhouse-sample');
  const surfaces=new Group(),ground=new Mesh(new BoxGeometry(20,.1,30),materials.soil);ground.position.set(60,-.05,-54);ground.receiveShadow=true;surfaces.add(ground);scene.add(surfaces);
  let disposed=false;return {scene,surfaces,skyColor:'#c6deea',setInspection:state=>greenhouse.setInspection(state.doorRatio,state.cutaway),prepareRender:(camera,height)=>canopy.prepare(camera,height),dispose:()=>{if(disposed)return;disposed=true;canopy.dispose();tomatoes.dispose();for(const m of Object.values(tomatoMaterials))m.dispose();tomatoTexture.dispose();greenhouse.dispose();for(const material of Object.values(materials))material.dispose();leafMaterial.dispose();soil.dispose();leaf.dispose();concrete.dispose();ground.geometry.dispose();scene.environment=null;environment.dispose();sun.shadow.dispose();scene.clear();}};
}
