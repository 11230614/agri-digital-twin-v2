import { Camera as CesiumCamera, Matrix4 as CesiumMatrix4, PerspectiveFrustum, SceneTransforms } from 'cesium';
import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { Cartesian3 } from 'cesium';
import type { Scene as CesiumScene } from 'cesium';
import type { GeoReferenceAdapter } from '../spatial/GeoReferenceAdapter';
import type { Vec3 } from '../shared/contracts/spatial';

const threeMatrix = (m: CesiumMatrix4) => new Matrix4().fromArray(CesiumMatrix4.toArray(m));
export class CameraBridge {
  private readonly earthToFarm: Matrix4;
  constructor(private readonly geo: GeoReferenceAdapter, readonly camera = new PerspectiveCamera()) {
    this.earthToFarm = threeMatrix(geo.getEcefToFarm());
    camera.matrixAutoUpdate = false;
    camera.matrixWorldAutoUpdate = false;
  }
  sync(source: CesiumCamera): void {
    const frustum = source.frustum;
    if (!(frustum instanceof PerspectiveFrustum)) throw new Error('仅支持 SCENE3D PerspectiveFrustum');
    const world = this.earthToFarm.clone().multiply(threeMatrix(source.inverseViewMatrix));
    this.camera.matrix.copy(world);
    this.camera.matrixWorld.copy(world);
    this.camera.matrixWorldInverse.copy(world).invert();
    // Keep metadata useful for diagnostics; do not rebuild the copied projection.
    world.decompose(this.camera.position, this.camera.quaternion, this.camera.scale);
    this.camera.near = frustum.near;
    this.camera.far = frustum.far;
    this.camera.fov = frustum.fovy * 180 / Math.PI;
    this.camera.aspect = frustum.aspectRatio;
    this.camera.projectionMatrix.copy(threeMatrix(frustum.projectionMatrix));
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
  }
  measureScreenError(scene: CesiumScene, points: readonly Vec3[], width: number, height: number): number | null {
    let max = 0, count = 0;
    for (const point of points) {
      const projected = new Vector3(...point).project(this.camera);
      if (projected.z < -1 || projected.z > 1) continue;
      const earth = this.geo.farmToEcef(point);
      const cesium = SceneTransforms.worldToWindowCoordinates(scene, new Cartesian3(...earth));
      if (!cesium) continue;
      const x = (projected.x + 1) * width / 2;
      const y = (1 - projected.y) * height / 2;
      max = Math.max(max, Math.hypot(cesium.x - x, cesium.y - y));
      count++;
    }
    return count ? max : null;
  }
}
