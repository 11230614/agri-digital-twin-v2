import {BufferGeometry,Color,Float32BufferAttribute,Group,Mesh,MeshStandardMaterial} from 'three';
import {PARK_ENVIRONMENT as config} from '../../config/park-environment';
const smooth=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
/** Deterministic rolling hills with a flat, empty central exclusion zone. */
export function surroundingHeight(x:number,z:number):number{
 const r=Math.hypot(x,z);let h=0;
 for(const hill of config.hills){const d=((x-hill.x)/hill.widthX)**2+((z-hill.z)/hill.widthZ)**2;h+=hill.height*Math.exp(-1.7*d);}
 const ridge=1+.15*Math.sin(x*.018+Math.sin(z*.014)*2)+.07*Math.sin(z*.039+x*.027);
 return Math.max(0,config.heightScale*h*ridge*smooth(config.innerRadiusM,300,r)*(1-smooth(1350,config.outerRadiusM,r)));
}
export function createSurroundingMountains(){
 const root=new Group();root.name='decorative-mountains-candidate-01';root.position.fromArray(config.centerM);
 const geometry=new BufferGeometry(),positions:number[]=[],colors:number[]=[],alphas:number[]=[],indices:number[]=[];
 const green=new Color('#6b8052'),high=new Color('#87916c'),stone=new Color('#a2a08a'),far=new Color('#899c9e');
 const color=new Color();const {angularSegments:n,radialSegments:m,innerRadiusM:inner,outerRadiusM:outer}=config;
 for(let j=0;j<=m;j++){
  // More vertices around the foreground slopes; never fill the central map hole.
  const radius=inner+(outer-inner)*(j/m)**1.35;
  for(let i=0;i<=n;i++){
   const angle=i/n*Math.PI*2,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,h=surroundingHeight(x,z);
   positions.push(x,h-.15,z);
   const dx=(surroundingHeight(x+2,z)-surroundingHeight(x-2,z))/4,dz=(surroundingHeight(x,z+2)-surroundingHeight(x,z-2))/4;
   const slope=Math.hypot(dx,dz),patch=.5+.5*Math.sin(x*.031+Math.sin(z*.019))*Math.sin(z*.024-x*.011);
   color.copy(green).lerp(high,Math.min(.65,h/400+patch*.2)).lerp(stone,smooth(.55,1.1,slope)*.6);
   // Provisional distance colour for the silhouette study, not the final fog implementation.
   color.lerp(far,smooth(450,1500,radius)*.48);colors.push(color.r,color.g,color.b);
   alphas.push(smooth(inner,inner+65,radius)*(1-smooth(1580,outer,radius)));
   if(i<n&&j<m){const a=j*(n+1)+i,b=a+n+1;indices.push(a,a+1,b,a+1,b+1,b);}
  }
 }
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.setAttribute('edgeAlpha',new Float32BufferAttribute(alphas,1));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,transparent:true});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float edgeAlpha; varying float vEdgeAlpha;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEdgeAlpha=edgeAlpha;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vEdgeAlpha;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= vEdgeAlpha;');
 };
 material.customProgramCacheKey=()=>'mountain-edge-alpha-v1';
 const mesh=new Mesh(geometry,material);mesh.name='rolling-mountain-landscape';mesh.castShadow=false;mesh.receiveShadow=false;
 // Draw the blended terrain edge before greenhouse glass. Sorting this large
 // mesh by its centre alone can otherwise paint mountains over transparent panes.
 mesh.renderOrder=-10;root.add(mesh);
 let disposed=false;
 return{root,material,triangles:indices.length/3,dispose(){if(disposed)return;disposed=true;geometry.dispose();material.dispose();root.clear();}};
}
