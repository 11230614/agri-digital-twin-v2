import {BufferGeometry,Float32BufferAttribute,Group,Mesh,type Material} from 'three';
export interface SurfaceRect {readonly id:string;readonly x0:number;readonly x1:number;readonly z0:number;readonly z1:number;readonly kind:'road'|'path'|'grass'|'soil'|'excluded';readonly topM:number;readonly bottomM:number}
export interface SurfaceCell {readonly x0:number;readonly x1:number;readonly z0:number;readonly z1:number;readonly source:SurfaceRect}
/** Rectangular arrangement: last descriptor wins. All crossings become one non-overlapping surface. */
export function partitionSurfaces(rects:readonly SurfaceRect[]):SurfaceCell[]{
 for(const r of rects)if(![r.x0,r.x1,r.z0,r.z1,r.topM,r.bottomM].every(Number.isFinite)||r.x1<=r.x0||r.z1<=r.z0||r.bottomM>=r.topM)throw new Error(`非法地表矩形 ${r.id}`);
 const xs=[...new Set(rects.flatMap(r=>[r.x0,r.x1]))].sort((a,b)=>a-b),zs=[...new Set(rects.flatMap(r=>[r.z0,r.z1]))].sort((a,b)=>a-b),cells:SurfaceCell[]=[];
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
  const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2,source=[...rects].reverse().find(r=>x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1);
  if(source&&source.kind!=='excluded')cells.push({x0:xs[i],x1:xs[i+1],z0:zs[j],z1:zs[j+1],source});
 }
 return cells;
}
/** Top surfaces and actual thickness walls, batched per shared material. No coplanar crossing faces. */
export function createPartitionedSurface(rects:readonly SurfaceRect[],materials:Readonly<Record<'road'|'path'|'grass'|'soil',Material>>){
 const cells=partitionSurfaces(rects),root=new Group();root.name='partitioned-site-surfaces';const owned:BufferGeometry[]=[];
 for(const kind of ['road','path','grass','soil'] as const){
  const p:number[]=[],uv:number[]=[],indices:number[]=[];
  const quad=(a:number[],b:number[],c:number[],d:number[])=>{const start=p.length/3;for(const v of [a,b,c,d]){p.push(...v);uv.push(v[0]/2,v[2]/2);}indices.push(start,start+1,start+2,start,start+2,start+3);};
  for(const cell of cells.filter(c=>c.source.kind===kind)){
   const {x0,x1,z0,z1,source:{topM:y,bottomM:b}}=cell;quad([x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0]);
   // Emit only the exterior height difference; adjacent coplanar cells share no duplicate wall.
   for(const [side,value,low,high] of [['x',x0,z0,z1],['x',x1,z0,z1],['z',z0,x0,x1],['z',z1,x0,x1]] as const){
    const negative=side==='x'?value===x0:value===z0,other=cells.find(n=>n!==cell&&(side==='x'?(negative?n.x1===value:n.x0===value)&&n.z0===low&&n.z1===high:(negative?n.z1===value:n.z0===value)&&n.x0===low&&n.x1===high));
    const lower=other?Math.max(b,other.source.topM):b;if(lower>=y)continue;
    if(side==='x'&&negative)quad([value,y,high],[value,y,low],[value,lower,low],[value,lower,high]);
    else if(side==='x')quad([value,y,low],[value,y,high],[value,lower,high],[value,lower,low]);
    else if(negative)quad([low,y,value],[high,y,value],[high,lower,value],[low,lower,value]);
    else quad([high,y,value],[low,y,value],[low,lower,value],[high,lower,value]);
   }
  }
  if(!p.length)continue;const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();owned.push(g);const m=new Mesh(g,materials[kind]);m.name=`site-${kind}`;m.receiveShadow=true;m.castShadow=kind==='road'||kind==='path';root.add(m);
 }
 let disposed=false;return{root,cells,dispose:()=>{if(disposed)return;disposed=true;owned.forEach(g=>g.dispose());root.clear();}};
}
