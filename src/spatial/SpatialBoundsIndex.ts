import { Box3, Vector3 } from 'three';
import type { Bounds, Vec3 } from '../shared/contracts/spatial';
import type { FrameRegistry } from './FrameRegistry';

/** Coarse world AABB index. Input bounds are explicit local business bounds,
 * distinct from the measured render geometry. No terrain or exact OBB claim. */
export class SpatialBoundsIndex {
  private entries=new Map<string,{frameId:string;local:Bounds;world?:Box3;revision:number}>();
  constructor(private readonly frames:FrameRegistry){}
  set(id:string,frameId:string,local:Bounds):void {
    if(!this.frames.has(frameId)||!id)throw new Error('未知框架或空 ID');
    if(![...local.minM,...local.maxM].every(Number.isFinite)||local.minM.some((v,i)=>v>local.maxM[i]))throw new Error('包络无效');
    this.entries.set(id,{frameId,local:structuredClone(local),revision:-1});
  }
  remove(id:string):void{this.entries.delete(id);}
  getWorldBounds(id:string):Bounds {
    const entry=this.entries.get(id);if(!entry)throw new Error('未知空间实体');
    if(entry.revision!==this.frames.revision){
      entry.world=new Box3(new Vector3(...entry.local.minM),new Vector3(...entry.local.maxM)).applyMatrix4(this.frames.getWorldMatrix(entry.frameId));
      entry.revision=this.frames.revision;
    }
    return {minM:entry.world!.min.toArray(),maxM:entry.world!.max.toArray()};
  }
  queryAabb(bounds:Bounds,frameId='FarmWorld'):readonly string[]{
    const query=new Box3(new Vector3(...bounds.minM),new Vector3(...bounds.maxM)).applyMatrix4(this.frames.getWorldMatrix(frameId));
    const found:string[]=[];
    for(const id of this.entries.keys()){
      const world=this.getWorldBounds(id);
      if(query.intersectsBox(new Box3(new Vector3(...world.minM),new Vector3(...world.maxM))))found.push(id);
    }
    return found;
  }
}
