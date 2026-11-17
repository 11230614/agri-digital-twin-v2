import {BoxGeometry,CylinderGeometry,Group,Mesh,Vector3, type Material, type BufferGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export interface UtilityMaterials {housing:Material;metal:Material;dark:Material;screen:Material;handle:Material}
function kit(){const root=new Group(),owned:BufferGeometry[]=[];const add=(g:BufferGeometry,m:Material,p:readonly number[],parent=root)=>{owned.push(g);const mesh=new Mesh(g,m);mesh.position.set(p[0],p[1],p[2]);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
const box=(w:number,h:number,d:number,p:readonly number[],m:Material,parent=root)=>add(new BoxGeometry(w,h,d),m,p,parent);
const rod=(a:readonly number[],b:readonly number[],radius:number,m:Material,parent=root,sides=8)=>{const from=new Vector3(...a as [number,number,number]),to=new Vector3(...b as [number,number,number]),v=to.clone().sub(from);const mesh=add(new CylinderGeometry(radius,radius,v.length(),sides),m,from.clone().add(to).multiplyScalar(.5).toArray(),parent);mesh.quaternion.setFromUnitVectors(new Vector3(0,1,0),v.normalize());return mesh;};
let disposed=false;return {root,add,box,rod,dispose:()=>{if(disposed)return;disposed=true;owned.forEach(g=>g.dispose());root.clear();}};}
export function createController(m:UtilityMaterials){const k=kit();k.root.name='controller-sample';
k.box(.8,.08,.4,[0,.04,0],m.dark);k.box(.78,1.1,.326,[0,.63,0],m.housing);k.box(.8,.02,.4,[0,1.19,0],m.housing);
// Door panel inset reveals a dark gasket, without coplanar duplicate faces.
k.box(.72,1.02,.008,[0,.63,.167],m.dark);k.box(.702,1,.008,[0,.63,.175],m.housing);
k.box(.23,.13,.01,[-.075,.91,.184],m.dark);k.box(.208,.108,.002,[-.075,.91,.19],m.screen);
k.box(.022,.17,.024,[.265,.61,.188],m.dark);
for(const x of [-.15,-.075,0])k.add(new CylinderGeometry(.012,.012,.006,8),m.handle,[x,.78,.187]).rotation.x=Math.PI/2;
for(let i=0;i<5;i++)k.box(.21,.007,.004,[-.07,.24+i*.025,.182],m.dark);
for(const y of [.32,.98])k.box(.018,.045,.018,[-.35,y,.182],m.metal);
return {root:k.root,dispose:k.dispose};}
export const FIELD_IRRIGATION=Object.freeze({main:{id:'sample-main',diameterM:.06,from:[-12.6,.08,15] as const,to:[12.6,.08,15] as const,lengthM:25.2},branches:Array.from({length:10},(_,i)=>({id:`sample-branch-${i+1}`,diameterM:.025,from:[-11.7+2.6*i,.08,15] as const,to:[-11.7+2.6*i,.08,-14] as const,lengthM:29}))});
export function createIrrigation(m:UtilityMaterials,branchHeightM=.08,transparentPipes=false){
if(!Number.isFinite(branchHeightM)||branchHeightM<.08||branchHeightM>.2)throw new Error("支管高度无效");const k=kit();k.root.name='irrigation-sample';
const pipeMaterial=m.dark.clone();pipeMaterial.transparent=transparentPipes;pipeMaterial.opacity=transparentPipes?.22:1;pipeMaterial.depthWrite=!transparentPipes;pipeMaterial.depthTest=true;
const pipe=(a:readonly number[],b:readonly number[],diameter:number)=>k.rod(a,b,diameter/2,pipeMaterial);
const network={main:FIELD_IRRIGATION.main,branches:FIELD_IRRIGATION.branches.map(edge=>{const x=edge.from[0],centerline:readonly (readonly number[])[]=[[x,.08,15],[x,.08,14.35],[x,branchHeightM,13.7],[x,branchHeightM,-13.7],[x,.08,-14]];const lengthM=centerline.slice(1).reduce((sum,p,i)=>sum+Math.hypot(...p.map((v,j)=>v-centerline[i][j])),0);return {...edge,centerline,lengthM};})};pipe(network.main.from,network.main.to,.06);
for(const edge of network.branches){for(let i=1;i<edge.centerline.length;i++)pipe(edge.centerline[i-1],edge.centerline[i],.025);const x=edge.from[0];k.rod([x-.055,.08,15],[x+.055,.08,15],.038,m.dark);k.rod([x,.08,14.91],[x,.08,14.99],.019,m.dark);k.box(.08,.042,.09,[x,.021,15],m.dark);k.rod([x,.08,-14.015],[x,.08,-13.985],.016,m.dark);}
const valve=new Group();valve.position.set(-12.6,.08,15);k.root.add(valve);
k.rod([-.06,0,0],[.06,0,0],.039,m.metal,valve);k.rod([0,0,0],[0,.06,0],.012,m.metal,valve);
const handle=new Group();handle.name='valve.handle';handle.position.set(0,.065,0);valve.add(handle);k.box(.08,.012,.018,[0,0,0],m.handle,handle);
// Static pipe meshes are batched by material; the mechanical handle keeps its own pivot.
k.root.updateMatrixWorld(true);for(const material of [m.dark,m.metal,pipeMaterial]){const meshes:Mesh[]=[];k.root.traverse(n=>{if(n instanceof Mesh&&n.material===material)meshes.push(n);});const geometries=meshes.map(mesh=>{const g=mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);return g;});const merged=mergeGeometries(geometries,false);if(merged){geometries.forEach(g=>g.dispose());meshes.forEach(mesh=>mesh.removeFromParent());const batched=k.add(merged,material,[0,0,0]);batched.name=material===pipeMaterial?'pipe-shell':'static-pipes';if(material===pipeMaterial){batched.renderOrder=30;batched.castShadow=!transparentPipes;}}}
let disposed=false;return {root:k.root,bindings:{'valve.handle':handle},network,dispose:()=>{if(disposed)return;disposed=true;k.dispose();pipeMaterial.dispose();}};}
