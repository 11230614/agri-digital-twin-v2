import {Scene,type PerspectiveCamera} from 'three';
import {CSS2DObject,CSS2DRenderer} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type {InteractionEntity} from '../app/ports/interaction';

/** Runtime-owned DOM labels. Uses the synchronized camera, never a separate frame loop. */
export class EntityLabelLayer {
 private readonly renderer=new CSS2DRenderer();
 private readonly scene=new Scene();
 private readonly labels:{object:CSS2DObject;button:HTMLButtonElement;release:()=>void}[]=[];
 private width=0;private height=0;private disposed=false;
 constructor(host:HTMLElement,entities:readonly InteractionEntity[],actions:{select:(id:string)=>void;focus:(id:string)=>void;enabled:()=>boolean}){
  const layer=this.renderer.domElement;layer.className='entity-css2d-layer';layer.setAttribute('aria-label','交互样板对象');
  // Scope layering here as well as CSS so labels cannot block the scene on diagnostic routes.
  Object.assign(layer.style,{position:'absolute',inset:'0',zIndex:'2',pointerEvents:'none'});
  host.append(layer);
  for(const entity of entities){
   const button=document.createElement('button');button.type='button';button.className='entity-marker';button.dataset.entityMarker=entity.id;
   button.textContent=entity.name;button.setAttribute('aria-label',entity.name);button.setAttribute('aria-pressed','false');
   const icon=document.createElement('span');icon.textContent='⌖';icon.setAttribute('aria-hidden','true');button.append(icon);
   const object=new CSS2DObject(button);object.center.set(.5,1.15);
   object.position.set(entity.bounds.centerM[0],entity.bounds.maxM[1]+.15,entity.bounds.centerM[2]);
   this.scene.add(object);
   const click=(event:MouseEvent)=>{event.stopPropagation();if(actions.enabled())actions.select(entity.id);};
   const double=(event:MouseEvent)=>{event.stopPropagation();if(actions.enabled())actions.focus(entity.id);};
   const stop=(event:Event)=>event.stopPropagation();
   const wheel=(event:WheelEvent)=>{event.preventDefault();event.stopPropagation();};
   button.addEventListener('click',click);button.addEventListener('dblclick',double);
   button.addEventListener('pointerdown',stop);button.addEventListener('pointerup',stop);button.addEventListener('wheel',wheel,{passive:false});
   this.labels.push({object,button,release:()=>{button.removeEventListener('click',click);button.removeEventListener('dblclick',double);button.removeEventListener('pointerdown',stop);button.removeEventListener('pointerup',stop);button.removeEventListener('wheel',wheel);object.removeFromParent();button.remove();}});
  }
 }
 render(camera:PerspectiveCamera,width:number,height:number,selectedId:string|null,visible:boolean){
  if(this.disposed)return;
  this.renderer.domElement.hidden=!visible;if(!visible)return;
  if(this.width!==width||this.height!==height){this.width=width;this.height=height;this.renderer.setSize(width,height);}
  for(const {button} of this.labels){const selected=button.dataset.entityMarker===selectedId;if(button.classList.contains('selected')!==selected){button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}}
  this.renderer.render(this.scene,camera);
 }
 dispose(){if(this.disposed)return;this.disposed=true;for(const label of this.labels)label.release();this.labels.length=0;this.scene.clear();this.renderer.domElement.remove();}
}
