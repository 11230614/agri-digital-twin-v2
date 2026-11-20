import {
 Box3, DepthTexture, Matrix4, Mesh, Scene, UnsignedIntType, Vector3, WebGLRenderTarget,
 type Object3D, type PerspectiveCamera, type WebGLRenderer,
} from 'three';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';

export interface DepthInterior {
 id: string;
 structure: Mesh[];
 interior: Box3;
}

export interface DepthSample {
 interiors: readonly DepthInterior[];
 focusAnchors: ReadonlyMap<string,Object3D>;
}

export interface DepthView {
 focusId: string | null;
 arrived: boolean;
 reducedMotion: boolean;
}

type Effect = 'depthOfField' | 'ssao';

export class DepthEffects {
 private readonly proxyScene = new Scene();
 private readonly proxies: {source: Mesh; proxy: Mesh}[] = [];
 private readonly focusPoint = new Vector3();
 private readonly lastView = new Matrix4();
 private readonly lastProjection = new Matrix4();
 private colorTarget?: WebGLRenderTarget;
 private ao?: SSAOPass;
 private aoValid = false;
 private width = 1;
 private height = 1;
 private focusStarted?: number;
 private focusAnchor?: Object3D;
 private activeInterior?: DepthInterior;
 get targetId() { return this.activeInterior?.id ?? this.focusId; }
 private focusId?: string;

 constructor(private readonly sample: DepthSample) {}

 select(view: DepthView | undefined, camera: PerspectiveCamera, dof: boolean, ssao: boolean): Effect | null {
  const focusId = view && dof && view.arrived ? view.focusId ?? undefined : undefined;
  const anchor = focusId ? this.sample.focusAnchors.get(focusId) : undefined;
  if (anchor !== this.focusAnchor) this.focusStarted = undefined;
  this.focusAnchor = anchor;
  this.focusId = anchor ? focusId : undefined;
  const interior = view && ssao && !anchor ? this.sample.interiors.find(room => {
   if (!room.interior.containsPoint(camera.position)) return false;
   const x = camera.position.x - (room.interior.min.x + room.interior.max.x) / 2;
   const ceiling = room.interior.min.y + 2.9 + 3.95 * Math.sqrt(1 - (x / 8.95) ** 2);
   return camera.position.y < ceiling;
  }) : undefined;
  if (interior !== this.activeInterior) {
   this.activeInterior = interior;
   this.aoValid = false;
   this.proxyScene.clear();
   this.proxies.length = 0;
  }
  return anchor ? 'depthOfField' : interior ? 'ssao' : null;
 }

 resize(width: number, height: number) {
  this.width = width;
  this.height = height;
  this.colorTarget?.setSize(width, height);
  this.ao?.setSize(Math.max(1, width >> 1), Math.max(1, height >> 1));
  this.aoValid = false;
 }

 renderColor(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {
  if (!this.colorTarget) {
   const depthTexture = new DepthTexture(this.width, this.height, UnsignedIntType);
   const target = this.colorTarget = new WebGLRenderTarget(this.width, this.height, {
    depthTexture, colorSpace: renderer.outputColorSpace, internalFormat: 'RGBA8',
   });
   // r170's display target path applies the scene's existing tone mapping and
   // output transfer function. RGBA8 stores those display bytes for our resolve.
   Object.assign(target, {isXRRenderTarget: true});
  }
  renderer.setRenderTarget(this.colorTarget);
  renderer.clear(true, true, true);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  return this.colorTarget;
 }

 focus(camera: PerspectiveCamera, reducedMotion: boolean) {
  this.focusPoint.setFromMatrixPosition(this.focusAnchor!.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
  const now = performance.now();
  this.focusStarted ??= now;
  return {distance: Math.max(camera.near, -this.focusPoint.z), strength: reducedMotion ? 1 : Math.min(1, (now - this.focusStarted) / 220)};
 }

 occlusion(renderer: WebGLRenderer, camera: PerspectiveCamera) {
  if (!this.ao) {
   this.ao = new SSAOPass(this.proxyScene, camera, Math.max(1, this.width >> 1), Math.max(1, this.height >> 1), 8);
  }
  const pass = this.ao;
  if (!this.proxies.length) {
   for (const source of this.activeInterior!.structure) {
    const proxy = new Mesh(source.geometry, pass.normalMaterial);
    proxy.matrixAutoUpdate = false;
    proxy.visible = false;
    this.proxyScene.add(proxy);
    this.proxies.push({source, proxy});
   }
  }
  let dirty = !this.aoValid || !this.lastView.equals(camera.matrixWorldInverse) || !this.lastProjection.equals(camera.projectionMatrix);
  for (const {source, proxy} of this.proxies) {
   let visible = true;
   for (let node: Object3D | null = source; node && visible; node = node.parent) visible = node.visible;
   if (proxy.visible !== visible || (visible && !proxy.matrix.equals(source.matrixWorld))) dirty = true;
   proxy.visible = visible;
   if (visible) proxy.matrix.copy(source.matrixWorld);
  }
  if (dirty) {
   const uniforms = pass.ssaoMaterial.uniforms;
   uniforms.cameraNear.value = camera.near;
   uniforms.cameraFar.value = camera.far;
   uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
   uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
   uniforms.kernelRadius.value = .42;
   uniforms.minDistance.value = .012 / (camera.far - camera.near);
   uniforms.maxDistance.value = .50 / (camera.far - camera.near);
   // Use SSAOPass's normal/depth, occlusion and blur stages. The shared resolve
   // applies the result with main-scene depth and preserves overlay alpha.
   pass.renderOverride(renderer, pass.normalMaterial, pass.normalRenderTarget, 0x7777ff, 1);
   pass.renderPass(renderer, pass.ssaoMaterial, pass.ssaoRenderTarget);
   pass.renderPass(renderer, pass.blurMaterial, pass.blurRenderTarget);
   this.lastView.copy(camera.matrixWorldInverse);
   this.lastProjection.copy(camera.projectionMatrix);
   this.aoValid = true;
  }
  return {color: pass.blurRenderTarget.texture, depth: pass.normalRenderTarget.depthTexture!};
 }

 dispose() {
  this.colorTarget?.dispose();
  this.ao?.noiseTexture.dispose();
  this.ao?.ssaoMaterial.dispose(); // r170 omits these two allocations in SSAOPass.dispose.
  this.ao?.dispose();
  this.colorTarget = undefined;
  this.ao = undefined;
  this.aoValid = false;
  this.proxyScene.clear();
  this.proxies.length = 0;
 }
}
