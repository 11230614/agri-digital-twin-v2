import { BoxGeometry, Color, DirectionalLight, DoubleSide, Group, HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PMREMGenerator, Quaternion, Scene, Vector3, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { SceneContent } from './SceneContent';
import type { CameraShot } from '../app/ports/scene';
import { createLeafGeometry } from './assets/leafGeometry';
import { createLeafTextures,createSoilTextures } from './assets/proceduralTextures';

export const LEAF_SAMPLE_SHOTS:readonly CameraShot[]=[
  {id:'leaf-near',label:'单株 · 棚内规格',positionM:[60.48,.60,-49.12],targetM:[60,.18,-50],up:[0,1,0],verticalFovDeg:36,nearM:.03,farM:3000},
  {id:'leaf-field',label:'单株 · 田间规格',positionM:[60.40,.50,-49.25],targetM:[60,.14,-50],up:[0,1,0],verticalFovDeg:36,nearM:.03,farM:3000},
  {id:'leaf-top',label:'俯看 · 叶片层次',positionM:[60.25,1.1,-49.65],targetM:[60,.12,-50],up:[0,1,0],verticalFovDeg:40,nearM:.03,farM:3000},
  {id:'leaf-row',label:'种植样段 · 0.6m间距',positionM:[60.6,.85,-48.2],targetM:[60.6,.16,-53],up:[0,1,0],verticalFovDeg:55,nearM:.05,farM:3000},
];
/** Isolated authoring sample, not a complete field/greenhouse or a passed stage. */
export function createLeafSampleScene(renderer:WebGLRenderer):SceneContent {
  const scene=new Scene();scene.background=null;
  const generator=new PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=generator.fromScene(room,.04);
  room.dispose();generator.dispose();scene.environment=environment.texture;scene.environmentIntensity=.35;
  const surfaces=new Group();scene.add(surfaces);
  scene.add(new HemisphereLight(0xe4efff,0x8e795e,2.8));
  const sun=new DirectionalLight(0xffeed0,3.2);sun.position.set(57,7,-46);sun.target.position.set(60,0,-52);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});
  sun.shadow.bias=-.00008;sun.shadow.normalBias=.004;scene.add(sun,sun.target);
  const leafTextures=createLeafTextures(),soilTextures=createSoilTextures();
  const leafMaterial=new MeshPhysicalMaterial({map:leafTextures.color,bumpMap:leafTextures.bump,bumpScale:.00035,roughnessMap:leafTextures.roughness,roughness:.8,metalness:0,side:DoubleSide,vertexColors:true,sheen:.18,sheenColor:new Color(0xc1d998),sheenRoughness:.75});
  const soilMaterial=new MeshStandardMaterial({map:soilTextures.color,bumpMap:soilTextures.bump,bumpScale:.014,roughness:1});
  const soil=new Mesh(new BoxGeometry(2.4,.14,5.8),soilMaterial);soil.position.set(60.6,-.07,-52.4);soil.receiveShadow=true;surfaces.add(soil);
  const near=createLeafGeometry(.35,.45,'near'),field=createLeafGeometry(.28,.35,'near');
  const plants=new InstancedMesh(near,leafMaterial,27);
  const transform=new Matrix4(),quaternion=new Quaternion();let index=0;
  // Fixed dimensions; variation rotates individual plants without moving root bases.
  for(let row=0;row<9;row++)for(let column=0;column<3;column++){
    quaternion.setFromAxisAngle(new Vector3(0,1,0),index===0?0:Math.sin(index*2.3)*Math.PI);
    const horizontal=index===0?1:1+.025*Math.sin(index*1.9);
    const height=index===0?1:.975+.025*Math.cos(index*2.8);
    transform.compose(new Vector3(60+column*.6,0,-50-row*.6),quaternion,new Vector3(horizontal,height,horizontal));
    plants.setMatrixAt(index++,transform);
  }
  plants.castShadow=true;plants.receiveShadow=true;plants.computeBoundingBox();plants.computeBoundingSphere();scene.add(plants);
  let disposed=false;
  return {scene,surfaces,selectShot:id=>{
    plants.geometry=id==='leaf-field'?field:near;
    plants.count=id==='leaf-row'?27:1;
    plants.computeBoundingBox();plants.computeBoundingSphere();
  },dispose:()=>{
    if(disposed)return;disposed=true;
    near.dispose();field.dispose();plants.dispose();leafMaterial.dispose();soil.geometry.dispose();soilMaterial.dispose();
    scene.environment=null;environment.dispose();
    leafTextures.dispose();soilTextures.dispose();sun.shadow.dispose();scene.clear();
  }};
}
