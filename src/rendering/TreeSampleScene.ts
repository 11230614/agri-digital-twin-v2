import { BoxGeometry, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Scene, WebGLRenderer } from 'three';
import type { CameraShot } from '../app/ports/scene';
import type { SceneContent } from './SceneContent';
import { createTree } from './assets/tree';
import { createDaylightEnvironment } from './assets/daylightEnvironment';
import { createSoilTextures,createTreeTextures } from './assets/proceduralTextures';
import { createEntityNodes,TransformSync } from './EntityNodes';
import { FrameRegistry } from '../spatial/FrameRegistry';
export const TREE_SAMPLE_SHOTS:readonly CameraShot[]=[
  {id:'tree-whole',label:'整树 · 自然冠形',positionM:[70,7,-35],targetM:[60,4,-50],up:[0,1,0],verticalFovDeg:43,nearM:.05,farM:3000},
  {id:'tree-crown',label:'树冠 · 曲面叶片',positionM:[64.4,7.2,-44.7],targetM:[60.6,6,-49.8],up:[0,1,0],verticalFovDeg:42,nearM:.03,farM:3000},
  {id:'tree-trunk',label:'树干 · 分枝树皮',positionM:[62.6,3,-45.9],targetM:[60,2.9,-50],up:[0,1,0],verticalFovDeg:46,nearM:.03,farM:3000},
  {id:'tree-back',label:'背面 · 不对称轮廓',positionM:[49,7,-63],targetM:[60,4,-50],up:[0,1,0],verticalFovDeg:43,nearM:.05,farM:3000},
];
export function createTreeSampleScene(renderer:WebGLRenderer):SceneContent{
  const scene=new Scene();scene.background=null;const environment=createDaylightEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.55;
  scene.add(new HemisphereLight(0xdcecf7,0x88724f,2.5));const sun=new DirectionalLight(0xffefd5,3);sun.position.set(51,17,-42);sun.target.position.set(60,3,-50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:8,bottom:-8,near:.1,far:40});sun.shadow.normalBias=.012;sun.shadow.bias=-.00005;scene.add(sun,sun.target);
  const texture=createTreeTextures(),soil=createSoilTextures();
  const materials={bark:new MeshStandardMaterial({map:texture.barkColor,bumpMap:texture.barkBump,bumpScale:.025,roughness:.95}),leaf:new MeshPhysicalMaterial({map:texture.leafColor,roughness:.82,side:DoubleSide,vertexColors:true,sheen:.13})};
  const tree=createTree(materials),nodes=createEntityNodes('tree-sample');nodes.visual.add(tree.root);scene.add(nodes.root);const frames=new FrameRegistry();frames.register({frameId:'tree-sample',parentFrameId:'FarmWorld',localPosition:[60,0,-50],localQuaternion:[0,0,0,1]});new TransformSync(frames).apply(nodes,'tree-sample');
  const surfaces=new Group(),groundMaterial=new MeshStandardMaterial({map:soil.color,bumpMap:soil.bump,bumpScale:.01,roughness:1}),ground=new Mesh(new BoxGeometry(8,.1,8),groundMaterial);ground.position.set(60,-.05,-50);ground.receiveShadow=true;surfaces.add(ground);scene.add(surfaces);
  let disposed=false;return {scene,surfaces,skyColor:'#c6deea',dispose:()=>{if(disposed)return;disposed=true;tree.dispose();for(const m of Object.values(materials))m.dispose();texture.dispose();soil.dispose();ground.geometry.dispose();groundMaterial.dispose();scene.environment=null;environment.dispose();sun.shadow.dispose();scene.clear();}};
}
