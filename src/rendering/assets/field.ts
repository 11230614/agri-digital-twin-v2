import {BufferGeometry,Float32BufferAttribute,Frustum,Sphere,Group,InstancedMesh,Matrix4,Mesh,Quaternion,Vector3, type Material, type PerspectiveCamera} from 'three';
import {createLeafGeometry,type LeafQuality} from './leafGeometry';
import {createInstancePartition,type InstancePartition} from './instancePartition';
import {chooseLeafLod} from './greenhouseCanopy';
export interface FieldRecipe {readonly key:string;readonly widthM:number;readonly lengthM:number;readonly rows:number;readonly plants:number;readonly ridgeHeightM:number;readonly branchHeightM:number;readonly columnOffsetsM:readonly number[];readonly plantsPerColumn:number;readonly spacingM:number}
export const FIELD_BASELINE:FieldRecipe=Object.freeze({key:'technical-baseline-v1',widthM:28,lengthM:32,rows:10,plants:900,ridgeHeightM:.12,branchHeightM:.135,columnOffsetsM:Object.freeze([-.45,.45]),plantsPerColumn:45,spacingM:.6});
export const FIELD_RECIPE:FieldRecipe=Object.freeze({...FIELD_BASELINE,key:'visual-candidate-02',plants:2680,columnOffsetsM:Object.freeze([-.57,-.19,.19,.57]),plantsPerColumn:67,spacingM:.4});
export function createRidgeGeometry(){
 const p:number[]=[],uv:number[]=[],idx:number[]=[];const xs=[-.9,-.7,.7,.9],zs=[-14,-13.7,13.7,14];
 for(let j=0;j<4;j++)for(let i=0;i<4;i++){p.push(xs[i],(i===1||i===2)&&j>0&&j<3?.12:0,zs[j]);uv.push(xs[i]/2,zs[j]/2);if(i<3&&j<3){const a=j*4+i;idx.push(a,a+4,a+1,a+1,a+4,a+5);}}
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingBox();return g;
}
export function createField(materials:{soil:Material;leaf:Material},recipe:FieldRecipe=FIELD_RECIPE,distantMaterial:Material=materials.leaf){
 const root=new Group(),ridgeGeometry=createRidgeGeometry();root.name='field-sample';
 for(let row=0;row<10;row++){const mesh=new Mesh(ridgeGeometry,materials.soil);mesh.position.x=-11.7+2.6*row;mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);}
 const batches=Object.fromEntries((['near','mid','far'] as const).map(quality=>{const mesh=new InstancedMesh(createLeafGeometry(.28,.35,quality),quality==='near'?materials.leaf:distantMaterial,recipe.plants);mesh.count=0;mesh.name=`field-leaf-${quality}`;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return[quality,mesh];})) as Record<LeafQuality,InstancedMesh>;
 const plants:{position:Vector3;matrix:Matrix4;quality:LeafQuality}[]=[];let index=0;const q=new Quaternion();
 for(let row=0;row<10;row++)for(const offset of recipe.columnOffsetsM)for(let j=0;j<recipe.plantsPerColumn;j++){
  const position=new Vector3(-11.7+2.6*row+offset,.12,-13.2+recipe.spacingM*j);q.setFromAxisAngle(new Vector3(0,1,0),Math.sin(index*2.3)*Math.PI);const horizontal=1+.025*Math.sin(index*1.9),height=.975+.025*Math.cos(index*2.8);plants.push({position,matrix:new Matrix4().compose(position,q,new Vector3(horizontal,height,horizontal)),quality:'far'});index++;
 }
 const submit=createInstancePartition(batches,plants),viewMatrix=new Matrix4();
 const point=new Vector3(),frustum=new Frustum(),sphere=new Sphere(point,.6);let disposed=false;let lastView:number[]=[];
 return{root,plants,batches,prepare:(camera:PerspectiveCamera,viewportHeight:number)=>{const ids:InstancePartition={near:[],mid:[],far:[]};root.updateWorldMatrix(true,false);const view=[...camera.matrixWorldInverse.elements,...camera.projectionMatrix.elements,...root.matrixWorld.elements,viewportHeight];if(view.every((v,i)=>Math.abs(v-(lastView[i]??Infinity))<1e-8))return false;lastView=view;frustum.setFromProjectionMatrix(camera.projectionMatrix);viewMatrix.multiplyMatrices(camera.matrixWorldInverse,root.matrixWorld);const factor=.37*viewportHeight/(2*Math.tan(camera.fov*Math.PI/360));for(let index=0;index<plants.length;index++){const plant=plants[index];point.copy(plant.position).y+=.14;point.applyMatrix4(viewMatrix);if(!frustum.intersectsSphere(sphere))continue;const pixels=point.z>=0?0:factor/Math.max(.1,-point.z);const quality=plant.quality=chooseLeafLod(pixels,plant.quality);ids[quality].push(index);}return submit(ids);},dispose:()=>{if(disposed)return;disposed=true;ridgeGeometry.dispose();for(const mesh of Object.values(batches)){mesh.geometry.dispose();mesh.dispose();}root.clear();}};
}
