import {BufferGeometry,Group,InstancedMesh,Matrix4,Mesh,Object3D} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Exact static vertex baking. Source builders retain ownership of their original geometry. */
export function batchStatic(root:Group,excluded:readonly Object3D[]=[]){
 root.updateWorldMatrix(true,true);const inverse=new Matrix4().copy(root.matrixWorld).invert();
 const groups=new Map<string,Mesh[]>(),owned:BufferGeometry[]=[],meshes:Mesh[]=[];
 root.traverse(n=>{
  if(!(n instanceof Mesh)||n instanceof InstancedMesh||Array.isArray(n.material)||n.material.transparent)return;
  for(let p:Object3D|null=n;p;p=p.parent)if(excluded.includes(p))return;
  const key=[n.material.uuid,n.castShadow,n.receiveShadow,...Object.keys(n.geometry.attributes).sort()].join('/');
  const list=groups.get(key)??[];list.push(n);groups.set(key,list);
 });
 for(const list of groups.values()){
  if(list.length<2)continue;
  const baked=list.map(n=>{const g=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();g.applyMatrix4(new Matrix4().multiplyMatrices(inverse,n.matrixWorld));return g;});
  const g=mergeGeometries(baked,false);baked.forEach(g=>g.dispose());if(!g)throw new Error('静态合批失败');
  const mesh=new Mesh(g,list[0].material);mesh.castShadow=list[0].castShadow;mesh.receiveShadow=list[0].receiveShadow;mesh.name='static-batch';
  for(const n of list)n.removeFromParent();root.add(mesh);owned.push(g);meshes.push(mesh);
 }
 let disposed=false;return{meshes,dispose:()=>{if(disposed)return;disposed=true;meshes.forEach(m=>m.removeFromParent());owned.forEach(g=>g.dispose());}};
}
