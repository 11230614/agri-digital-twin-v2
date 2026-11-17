import {CanvasTexture,MeshStandardMaterial,RepeatWrapping,SRGBColorSpace} from 'three';
import {PARK_ROADS} from '../../config/park-layout';

/** Independently authored site materials. All variation is fixed in FarmWorld metres. */
export function createLandscapeMaterials(){
 const textures:CanvasTexture[]=[];
 const grain=(grass:boolean)=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(512,512);let seed=grass?31217:7193;
  for(let i=0;i<pixels.data.length;i+=4){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const n=seed/4294967296-.5,base=grass?[84,106,57]:[117,120,111];
   for(let k=0;k<3;k++)pixels.data[i+k]=base[k]+n*(grass?22:19);
   pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  if(grass){
   // Short cut-grass fibres, irregular orientations, no periodic sinusoidal waves.
   ctx.strokeStyle='rgba(159,168,105,.18)';ctx.lineWidth=.7;
   for(let i=0;i<9500;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=(seed&65535)/128,y=(seed>>>16)/128;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(i*2.39)*2,y-1.5-(i%3));ctx.stroke();}
  }
  const t=new CanvasTexture(canvas);t.wrapS=t.wrapT=RepeatWrapping;t.anisotropy=8;textures.push(t);return t;
 };
 const noise=`
 varying vec3 vSitePosition;
 float siteHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float siteNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(siteHash(i),siteHash(i+vec2(1,0)),f.x),mix(siteHash(i+vec2(0,1)),siteHash(i+vec2(1,1)),f.x),f.y);}
 `;
 const grassMap=grain(true);grassMap.colorSpace=SRGBColorSpace;
 const roadMap=grain(false);roadMap.colorSpace=SRGBColorSpace;
 // Separate non-colour height samples: do not interpret an sRGB colour map as bump data.
 const grassBump=grain(true),roadBump=grain(false);
 const grass=new MeshStandardMaterial({map:grassMap,bumpMap:grassBump,bumpScale:.006,roughness:.98});
 const road=new MeshStandardMaterial({map:roadMap,bumpMap:roadBump,bumpScale:.003,roughness:.94});
 const roads=PARK_ROADS.filter(r=>r.kind==='road');
 const f=(v:number)=>Number.isInteger(v)?`${v}.0`:`${v}`;
 const distances=roads.map(r=>{
  const [x0,,z0]=r.fromM,[x1,,z1]=r.toM,alongX=z0===z1;
  const hx=alongX?Math.abs(x1-x0)/2:r.widthM/2,hz=alongX?r.widthM/2:Math.abs(z1-z0)/2;
  return `edge=min(edge,siteBox(vSitePosition.xz-vec2(${f((x0+x1)/2)},${f((z0+z1)/2)}),vec2(${f(hx)},${f(hz)})));`;
 }).join('\n');
 for(const [material,isGrass] of [[grass,true],[road,false]] as const){
  material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 vSitePosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSitePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=noise+(isGrass?'':'float siteBox(vec2 p,vec2 b){vec2 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,q.y),0.0);}\n')+shader.fragmentShader;
   const color=isGrass?`
    float broad=siteNoise(vSitePosition.xz*.11),localTone=siteNoise(vSitePosition.xz*.43+17.0);
    diffuseColor.rgb*=mix(vec3(.88,.91,.82),vec3(1.08,1.04,.96),broad);
    diffuseColor.rgb*=.93+.12*localTone;
   `:`
    float edge=10000.0;
    ${distances}
    float shoulder=1.0-smoothstep(0.0,.16,abs(edge));
    diffuseColor.rgb*=.94+.09*siteNoise(vSitePosition.xz*1.3);
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.72,.72,.67),shoulder*.55);
   `;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+color);
  };
  material.customProgramCacheKey=()=>`site-landscape-03-${isGrass?'grass':'road'}`;
 }
 let disposed=false;return{grass,road,dispose:()=>{if(disposed)return;disposed=true;grass.dispose();road.dispose();textures.forEach(t=>t.dispose());}};
}
