import type { Scene } from 'cesium';

/** The Cesium-owned loop is the only clock. Rendering never advances simulation. */
export class FrameCoordinator {
  private paused=false;
  private last=0;
  private time=0;
  private readonly removers: (()=>void)[];
  constructor(scene: Scene, before: (dt:number,time:number)=>void, render: ()=>void) {
    this.removers=[
      scene.preUpdate.addEventListener(()=>{
        const now=performance.now()/1000;
        const dt=this.paused||this.last===0?0:Math.min(.1,Math.max(0,now-this.last));
        this.last=now;this.time+=dt;
        before(dt,this.time);
      }),
      scene.postRender.addEventListener(render),
    ];
  }
  setPaused(paused:boolean):void {this.paused=paused;this.last=0;}
  dispose():void { for(const remove of this.removers.splice(0)) remove(); }
}
