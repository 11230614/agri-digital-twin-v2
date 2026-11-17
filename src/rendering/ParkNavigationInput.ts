import type {ParkNavigationPolicy} from './ParkNavigationPolicy';
/** Inputs only change local navigation state; the existing coordinator applies the camera once per frame. */
export class ParkNavigationInput {
 private pointers=new Map<number,{x:number;y:number;button:number}>();
 private removers:(()=>void)[]=[];
 constructor(private canvas:HTMLCanvasElement,private policy:ParkNavigationPolicy,private enabled:()=>boolean){
  const listen=<K extends keyof HTMLElementEventMap>(name:K,fn:(event:HTMLElementEventMap[K])=>void,options?:AddEventListenerOptions)=>{canvas.addEventListener(name,fn,options);this.removers.push(()=>canvas.removeEventListener(name,fn,options));};
  const originalTouch=canvas.style.touchAction;canvas.style.touchAction='none';this.removers.push(()=>{canvas.style.touchAction=originalTouch;});
  listen('contextmenu',e=>e.preventDefault());
  listen('pointerdown',e=>{if(!enabled()||![0,2].includes(e.button)&&e.pointerType!=='touch')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:e.button});});
  listen('pointermove',e=>{
   const previous=this.pointers.get(e.pointerId);if(!previous)return;
   if(!enabled()){this.cancel();return;}
   // Capture loss alone is not a release. Edge may drop capture while continuing
   // to deliver a pressed right button; recover instead of discarding the drag.
   if(e.pointerType!=='touch'&&!(e.buttons&(previous.button===2?2:1))){this.pointers.delete(e.pointerId);return;}
   if(!canvas.hasPointerCapture(e.pointerId))canvas.setPointerCapture(e.pointerId);
   e.preventDefault();const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
   const other=[...this.pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];
   if(e.pointerType==='touch'&&other){
    const oldLength=Math.hypot(previous.x-other.x,previous.y-other.y),length=Math.hypot(e.clientX-other.x,e.clientY-other.y);
    if(length>5&&oldLength>5)policy.zoom(Math.log(oldLength/length)/.0015);
    policy.orbit(dx*.5,dy*.5);
   }else if(previous.button===2)policy.orbit(dx,dy);else policy.pan(dx,dy);
   this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:previous.button});
  });
  const finish=(e:PointerEvent)=>{this.pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
  listen('pointerup',finish);listen('pointercancel',finish);
  listen('wheel',e=>{if(!enabled())return;e.preventDefault();policy.zoom(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1));},{passive:false});
  const blur=()=>this.cancel();window.addEventListener('blur',blur);this.removers.push(()=>window.removeEventListener('blur',blur));
 }
 cancel(){for(const id of this.pointers.keys())if(this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);this.pointers.clear();}
 dispose(){this.cancel();for(const remove of this.removers.splice(0))remove();}
}
