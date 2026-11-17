import { Matrix4, Quaternion, Vector3 } from 'three';
import type { Anchor, FrameDefinition, Quat, Vec3 } from '../shared/contracts/spatial';

function validate(position: Vec3, quaternion: Quat): void {
  if (![...position, ...quaternion].every(Number.isFinite)) throw new Error('变换含非有限数值');
  if (Math.abs(Math.hypot(...quaternion) - 1) > 1e-6) throw new Error('四元数必须归一化');
}

/** 刚体框架；所有返回矩阵均为副本，外部不能改变缓存。 */
export class FrameRegistry {
  private frames = new Map<string, FrameDefinition>();
  private cache = new Map<string, Matrix4>();
  revision = 0;
  constructor() {
    this.frames.set('FarmWorld', { frameId: 'FarmWorld', parentFrameId: null, localPosition: [0, 0, 0], localQuaternion: [0, 0, 0, 1] });
  }
  has(id: string): boolean { return this.frames.has(id); }
  register(definition: FrameDefinition): void {
    if (this.has(definition.frameId)) throw new Error('重复框架 ID');
    this.check(definition);
    this.frames.set(definition.frameId, structuredClone(definition));
    this.invalidate();
  }
  update(definition: FrameDefinition): void {
    if (!this.has(definition.frameId) || definition.frameId === 'FarmWorld') throw new Error('框架不存在或根不可变');
    this.check(definition);
    this.frames.set(definition.frameId, structuredClone(definition));
    this.invalidate();
  }
  unregister(id: string): void {
    if (id === 'FarmWorld') throw new Error('不能删除 FarmWorld');
    if (!this.has(id)) throw new Error('框架不存在');
    if ([...this.frames.values()].some(f => f.parentFrameId === id)) throw new Error('先删除子框架');
    this.frames.delete(id); this.invalidate();
  }
  private check(d: FrameDefinition): void {
    validate(d.localPosition, d.localQuaternion);
    if (!d.frameId || !d.parentFrameId || !this.has(d.parentFrameId)) throw new Error('父框架不存在');
    let parent: string | null = d.parentFrameId;
    while (parent) {
      if (parent === d.frameId) throw new Error('框架成环');
      parent = this.frames.get(parent)!.parentFrameId;
    }
  }
  private invalidate(): void { this.revision++; this.cache.clear(); }
  getWorldMatrix(id: string): Matrix4 {
    const cached = this.cache.get(id);
    if (cached) return cached.clone();
    const f = this.frames.get(id);
    if (!f) throw new Error(`未知框架 ${id}`);
    const local = new Matrix4().compose(new Vector3(...f.localPosition), new Quaternion(...f.localQuaternion), new Vector3(1, 1, 1));
    const world = f.parentFrameId ? this.getWorldMatrix(f.parentFrameId).multiply(local) : local;
    this.cache.set(id, world); return world.clone();
  }
  transformPoint(point: Vec3, from: string, to = 'FarmWorld'): Vec3 {
    if (!point.every(Number.isFinite)) throw new Error('无效点');
    return new Vector3(...point).applyMatrix4(this.getWorldMatrix(to).invert().multiply(this.getWorldMatrix(from))).toArray();
  }
  transformDirection(direction: Vec3, from: string, to = 'FarmWorld'): Vec3 {
    if (!direction.every(Number.isFinite)) throw new Error('无效方向');
    const rotation = new Quaternion().setFromRotationMatrix(this.getWorldMatrix(to).invert().multiply(this.getWorldMatrix(from)));
    return new Vector3(...direction).applyQuaternion(rotation).toArray();
  }
  resolveAnchor(anchor: Anchor): { positionM: Vec3; quaternion: Quat; revision: number } {
    validate(anchor.positionM, anchor.quaternion);
    const q = new Quaternion().setFromRotationMatrix(this.getWorldMatrix(anchor.frameId)).multiply(new Quaternion(...anchor.quaternion));
    return { positionM: this.transformPoint(anchor.positionM, anchor.frameId), quaternion: q.toArray(), revision: this.revision };
  }
}

export function yawForDirection(x: number, z: number): number {
  if (![x, z].every(Number.isFinite) || Math.hypot(x, z) === 0) throw new Error('方向不可为零');
  return Math.atan2(x, z);
}
export function farmDistance(a: Vec3, b: Vec3): { horizontalM: number; spatialM: number } {
  if (![...a, ...b].every(Number.isFinite)) throw new Error('无效距离输入');
  return { horizontalM: Math.hypot(a[0]-b[0], a[2]-b[2]), spatialM: Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]) };
}
