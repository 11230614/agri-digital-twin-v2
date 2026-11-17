import { BoxGeometry, BufferGeometry, Color, DirectionalLight, Group, HemisphereLight, Line, LineBasicMaterial, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import type { Vec3 } from '../shared/contracts/spatial';

export const CALIBRATION_POINTS: readonly Vec3[] = [[0,0,0],[100,0,0],[0,0,-100],[0,10,0],[120,0,-100],[60,10,-50],[60,0,-50]];
export function createCalibrationScene(): { scene:Scene; surfaces:Group; dispose:()=>void } {
  const scene=new Scene();
  scene.background=null;
  scene.add(new HemisphereLight(0xe1efff,0x73684e,2));
  const sun=new DirectionalLight(0xfff0d3,3);
  sun.position.set(-70,120,30);
  sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:300});
  sun.shadow.normalBias=.03;
  sun.target.position.set(60,0,-50);
  scene.add(sun,sun.target);
  const surfaces=new Group();
  surfaces.name='calibration-surfaces-not-final-layout';
  // Only a 10x4 m test road; the park footprint is an open outline, not a map-covering slab.
  const road=new Mesh(new BoxGeometry(10,.12,4),new MeshStandardMaterial({color:0x666957,roughness:.95}));
  road.position.set(60,-.04,-50); // actual top y=.02
  road.receiveShadow=true;
  surfaces.add(road);
  scene.add(surfaces);
  const cube=new Mesh(new BoxGeometry(10,10,10),new MeshStandardMaterial({color:0xd3ded5,roughness:.62,metalness:.12}));
  cube.position.set(80,5,-65);
  cube.castShadow=true;
  cube.receiveShadow=true;
  scene.add(cube);
  const marker=(point:Vec3,color:number)=>{
    const mesh=new Mesh(new BoxGeometry(1,1,1),new MeshStandardMaterial({color}));
    mesh.position.fromArray(point);mesh.position.y+=.5;mesh.castShadow=true;scene.add(mesh);
  };
  marker([0,0,0],0xffffff);marker([100,0,0],0xe6a956);marker([0,0,-100],0x83c6b2);marker([0,10,0],0x94baff);
  const line=(points:Vec3[],color:number)=>{
    scene.add(new Line(new BufferGeometry().setFromPoints(points.map(p=>new Vector3(...p))),new LineBasicMaterial({color:new Color(color)})));
  };
  line([[0,.05,0],[120,.05,0],[120,.05,-100],[0,.05,-100],[0,.05,0]],0xdfd8b7);
  line([[0,.05,0],[100,.05,0]],0xe6a956);
  line([[0,.05,0],[0,.05,-100]],0x83c6b2);
  line([[0,0,0],[0,10,0]],0x94baff);
  let disposed=false;
  return {scene,surfaces,dispose:()=>{
    if(disposed)return;disposed=true;
    scene.traverse(object=>{
      if(object instanceof Mesh || object instanceof Line) {
        object.geometry.dispose();
        for(const material of Array.isArray(object.material)?object.material:[object.material]) material.dispose();
      }
    });
    sun.shadow.dispose();
    scene.clear();
  }};
}
