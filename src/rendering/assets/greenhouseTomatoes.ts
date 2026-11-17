import {CylinderGeometry,Group,InstancedMesh,Matrix4,Mesh,Vector3,type BufferGeometry,type Material} from 'three';
import {createTomato,type TomatoMaterials} from './tomato';
/** Shared geometry for ten approved plants; scene owns borrowed materials. */
export function createGreenhouseTomatoes(materials:TomatoMaterials){
 const asset=createTomato(materials),root=new Group(),batches:InstancedMesh[]=[];root.name='greenhouse-tomato-canopy';
 const plants=([-1,1] as const).flatMap(side=>Array.from({length:5},(_,j)=>new Vector3(side*8.4,0,-4-5*j)));
 asset.root.traverse(n=>{if(n instanceof Mesh){const mesh=new InstancedMesh(n.geometry as BufferGeometry,n.material as Material,10);mesh.name=n.name;mesh.castShadow=true;mesh.receiveShadow=true;plants.forEach((p,i)=>mesh.setMatrixAt(i,new Matrix4().makeTranslation(p.x,p.y,p.z)));mesh.computeBoundingSphere();root.add(mesh);batches.push(mesh);}});
 const supportGeometries:BufferGeometry[]=[];
 const segment=(a:Vector3,b:Vector3,r:number)=>{const delta=b.clone().sub(a),g=new CylinderGeometry(r,r,delta.length(),5);supportGeometries.push(g);const mesh=new Mesh(g,materials.rope);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new Vector3(0,1,0),delta.normalize());mesh.castShadow=true;root.add(mesh);};
 for(const side of [-1,1]){const x=side*8.4;segment(new Vector3(x,2.6,-3),new Vector3(x,2.6,-25),.003);for(const z of [-4,-8,-12,-16,-20,-24]){const archY=3+3.95*Math.sqrt(1-(x/8.95)**2);segment(new Vector3(x,2.6,z),new Vector3(x,archY-.04,z),.002);}}
 const supportTops=plants.map(p=>p.clone().add(asset.supportTop));for(const top of supportTops)segment(top,new Vector3(top.x<0?-8.4:8.4,2.6,top.z),.001);
 let disposed=false;return{root,plants,supportTops,dispose:()=>{if(disposed)return;disposed=true;supportGeometries.forEach(g=>g.dispose());batches.forEach(b=>b.dispose());asset.dispose();root.clear();}};
}
