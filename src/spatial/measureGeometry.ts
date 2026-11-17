import { Box3, InstancedMesh, Matrix4, Mesh, Object3D, Vector3 } from 'three';
import type { Bounds, Vec3 } from '../shared/contracts/spatial';

/** 测真实顶点，含实例/父链变换；GPU 位移包络须另加解析最大量。 */
export function measureGeometry(root: Object3D, space: Object3D | null = null, expansionM: Vec3 = [0,0,0]): Bounds {
  if (!expansionM.every(v => Number.isFinite(v) && v >= 0)) throw new Error('扩张量非法');
  root.updateWorldMatrix(true, true); space?.updateWorldMatrix(true, false);
  const inverse = space ? space.matrixWorld.clone().invert() : new Matrix4();
  const box = new Box3(); const point = new Vector3(); const instance = new Matrix4();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const position = object.geometry.getAttribute('position');
    if (!position) return;
    const count = object instanceof InstancedMesh ? object.count : 1;
    const base = inverse.clone().multiply(object.matrixWorld);
    for (let i=0; i<count; i++) {
      const matrix = base.clone();
      if (object instanceof InstancedMesh) { object.getMatrixAt(i, instance); matrix.multiply(instance); }
      for (let j=0; j<position.count; j++) {
        point.fromBufferAttribute(position, j).applyMatrix4(matrix);
        if (!point.toArray().every(Number.isFinite)) throw new Error('几何含无效顶点');
        box.expandByPoint(point);
      }
    }
  });
  if (box.isEmpty()) throw new Error('没有可测量几何');
  const e = new Vector3(...expansionM); box.min.sub(e); box.max.add(e);
  return { minM: box.min.toArray(), maxM: box.max.toArray() };
}
