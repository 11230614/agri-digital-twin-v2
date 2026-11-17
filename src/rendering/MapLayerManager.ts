import { ImageryLayer, Rectangle, SingleTileImageryProvider, Viewer } from 'cesium';
import type { MapState } from '../app/ports/scene';

interface ImageryManifest {
  id: string; url: string; credit: string; boundsDegrees: [number,number,number,number]; width: number; height: number;
}
export class MapLayerManager {
  private generation = 0;
  private disposed = false;
  private request?: AbortController;
  private layer?: ImageryLayer;
  private listeners: (()=>void)[] = [];
  constructor(private readonly viewer: Viewer, private readonly publish: (state: MapState)=>void) {}
  private clear(): void {
    this.request?.abort();
    for(const off of this.listeners.splice(0)) off();
    if(this.layer && !this.viewer.isDestroyed()) this.viewer.imageryLayers.remove(this.layer,true);
    this.layer=undefined;
  }
  async load(): Promise<void> {
    if(this.disposed) return;
    const generation=++this.generation;
    this.clear();
    const request=this.request=new AbortController();
    const current=()=>!this.disposed && this.generation===generation;
    let sourceId='local-sentinel2';
    const state=(status:MapState['status'],message?:string)=>{
      if(current()) this.publish({status,sourceId,generation,offlineFallback:false,...(message?{lastError:{code:'LOCAL_IMAGERY',message}}:{})});
    };
    state('loading');
    try {
      const response=await fetch('/maps/imagery.json',{signal:request.signal});
      if(!response.ok) throw new Error(`影像清单 HTTP ${response.status}`);
      const info=await response.json() as ImageryManifest;
      if(!current()) return;
      if(!info.id || !info.credit || !info.url.startsWith('/maps/') || info.url.includes('..') || info.boundsDegrees?.length!==4 || !info.boundsDegrees.every(Number.isFinite)) throw new Error('离线影像清单格式不合法');
      sourceId=info.id;
      const provider=await SingleTileImageryProvider.fromUrl(info.url,{rectangle:Rectangle.fromDegrees(...info.boundsDegrees),credit:info.credit});
      // Cesium image fetch cannot be aborted: a stale result is never attached.
      if(!current()) return;
      this.layer=this.viewer.imageryLayers.addImageryProvider(provider);
      this.listeners.push(provider.errorEvent.addEventListener((error:{message:string})=>state('failed',error.message)));
      let frames=0, ready=false;
      this.listeners.push(this.viewer.scene.postRender.addEventListener(()=>{
        if(!current() || ready) return;
        if(++frames>2 && this.viewer.scene.globe.tilesLoaded) { ready=true; state('ready'); }
      }));
    } catch(error) {
      if(current() && !request.signal.aborted) state('failed',error instanceof Error?error.message:String(error));
    }
  }
  dispose(): void {
    if(this.disposed) return;
    this.disposed=true;
    ++this.generation;
    this.clear();
  }
}
