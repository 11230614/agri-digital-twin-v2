/** Click intent only; navigation remains the owner of all drag input. */
export class EntityPickInput {
 private down?:{id:number;x:number;y:number;time:number;dragged:boolean};
 private readonly cleanup:(()=>void)[]=[];
 constructor(canvas:HTMLCanvasElement,pick:(x:number,y:number,double:boolean)=>void,enabled:()=>boolean){
  const listen=(name:string,fn:EventListener)=>{canvas.addEventListener(name,fn);this.cleanup.push(()=>canvas.removeEventListener(name,fn));};
  listen('pointerdown',((e:PointerEvent)=>{if(this.down){this.down=undefined;return;}if(e.button!==0||!enabled())return;this.down={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),dragged:false};}) as EventListener);
  listen('pointermove',((e:PointerEvent)=>{if(this.down?.id===e.pointerId&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>5)this.down.dragged=true;}) as EventListener);
  listen('pointerup',((e:PointerEvent)=>{const down=this.down;this.down=undefined;if(!down||down.id!==e.pointerId||down.dragged||e.button!==0||performance.now()-down.time>600||!enabled())return;const r=canvas.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;pick((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2,false);}) as EventListener);
  listen('dblclick',((e:MouseEvent)=>{if(e.button!==0||!enabled())return;const r=canvas.getBoundingClientRect();pick((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2,true);}) as EventListener);
  const cancel=()=>{this.down=undefined;};listen('pointercancel',cancel);window.addEventListener('blur',cancel);this.cleanup.push(()=>window.removeEventListener('blur',cancel));
 }
 dispose(){for(const remove of this.cleanup.splice(0))remove();this.down=undefined;}
}
