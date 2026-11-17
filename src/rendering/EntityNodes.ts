import { Group, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import type { FrameRegistry } from '../spatial/FrameRegistry';

export interface EntityNodes { readonly root:Group; readonly visual:Group }
/** Installation root never inherits the asset's source-unit or axis correction. */
export function createEntityNodes(entityId:string):EntityNodes {
  if(!entityId.trim())throw new Error('实体 ID 不能为空');
  const root=new Group(),visual=new Group();
  root.name=`${entityId}:EntityRoot`;visual.name=`${entityId}:VisualRoot`;
  root.add(visual);return {root,visual};
}
export function assertRigidBusinessChain(root:Object3D):void {
  for(let node:Object3D|null=root;node;node=node.parent){
    if(node.scale.distanceTo(new Vector3(1,1,1))>1e-8)throw new Error('业务父链禁止缩放');
    if(node.matrixAutoUpdate)node.updateMatrix();
    const e=node.matrix.elements;
    const x=new Vector3(e[0],e[1],e[2]),y=new Vector3(e[4],e[5],e[6]),z=new Vector3(e[8],e[9],e[10]);
    if(!e.every(Number.isFinite)||Math.abs(x.length()-1)>1e-8||Math.abs(y.length()-1)>1e-8||Math.abs(z.length()-1)>1e-8||Math.abs(x.dot(y))+Math.abs(x.dot(z))+Math.abs(y.dot(z))>1e-8||Math.abs(node.matrix.determinant()-1)>1e-8)throw new Error('业务父链必须为右手刚体');
  }
}
/** The only runtime writer of EntityRoot placement. Animation targets children. */
export class TransformSync {
  constructor(private readonly registry:FrameRegistry){}
  apply(nodes:EntityNodes,frameId:string,parentFrameId='FarmWorld'):void {
    assertRigidBusinessChain(nodes.root);
    const local=new Matrix4().copy(this.registry.getWorldMatrix(parentFrameId)).invert().multiply(this.registry.getWorldMatrix(frameId));
    const position=new Vector3(),quaternion=new Quaternion(),scale=new Vector3();
    local.decompose(position,quaternion,scale);
    nodes.root.position.copy(position);nodes.root.quaternion.copy(quaternion);
    nodes.root.updateWorldMatrix(true,true);
  }
}
