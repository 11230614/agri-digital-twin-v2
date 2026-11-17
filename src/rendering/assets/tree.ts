import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Group, Mesh, Vector3, type Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export interface TreeMaterials {bark:Material;leaf:Material}
/** Deterministic branching broadleaf tree; crown consists of actual leaves, never solid balls. */
export function createTree(materials:TreeMaterials,seed=17,quality:'near'|'mid'|'far'='near'){
  if(!Number.isInteger(seed))throw new Error('树木种子须为整数');
  const root=new Group();root.name='tree-sample:EntityRoot';
  let randomState=seed>>>0;const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
  const wood:BufferGeometry[]=[],foliage:BufferGeometry[]=[];
  const branch=(points:Vector3[],startRadius:number,endRadius:number,segments:number,sides:number)=>{
    segments=Math.max(1,Math.round(segments*(quality==='near'?1:quality==='mid'?.7:.4)));sides=Math.max(3,Math.round(sides*(quality==='near'?1:.65)));
    const path=new CatmullRomCurve3(points),frames=path.computeFrenetFrames(segments,false),positions:number[]=[],uv:number[]=[],indices:number[]=[];
    for(let j=0;j<=segments;j++){
      const t=j/segments,center=path.getPoint(t),radius=startRadius*(1-t)+endRadius*t;
      for(let k=0;k<=sides;k++){
        const angle=k/sides*Math.PI*2,p=center.clone().addScaledVector(frames.normals[j],radius*Math.cos(angle)).addScaledVector(frames.binormals[j],radius*Math.sin(angle));positions.push(p.x,Math.max(0,p.y),p.z);uv.push(k/sides,t*points[0].distanceTo(points.at(-1)!)*2);
        if(j<segments&&k<sides){const a=j*(sides+1)+k;indices.push(a,a+1,a+sides+1,a+1,a+sides+2,a+sides+1);}
      }
    }
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();wood.push(g);
  };
  const leaf=(base:Vector3,direction:Vector3,length:number,width:number,tint:number)=>{
    const along=direction.clone().normalize(),across=new Vector3().crossVectors(along,new Vector3(.13,1,.07)).normalize();
    const normal=new Vector3().crossVectors(across,along).normalize();
    const at=(t:number,w:number,lift:number)=>base.clone().addScaledVector(along,t*length).addScaledVector(across,w*width).addScaledVector(normal,lift*length);
    const points=[at(0,0,0),at(.28,-.42,.015),at(.68,-.4,0),at(1,0,-.07),at(.68,.4,0),at(.28,.42,.015),at(.5,0,.07)];
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points.flatMap(p=>p.toArray()),3));g.setAttribute('uv',new Float32BufferAttribute([.5,0,.08,.28,.1,.68,.5,1,.9,.68,.92,.28,.5,.5],2));g.setAttribute('color',new Float32BufferAttribute(points.flatMap(()=>[tint*.96,tint,tint*.87]),3));g.setIndex(quality==='near'?[0,6,1,1,6,2,2,6,3,3,6,4,4,6,5,5,6,0]:quality==='mid'?[0,2,1,0,3,2,0,4,3,0,5,4]:[0,3,2,0,5,3]);g.computeVertexNormals();foliage.push(g);
  };
  const top=new Vector3(.14,6.7,-.09);
  branch([new Vector3(),new Vector3(.04,1.5,.03),new Vector3(-.08,3.2,.05),new Vector3(.1,4.9,-.03),top],.16,.025,12,8);
  const clusters:Vector3[]=[];
  for(let i=0;i<4;i++){
    const angle=i*Math.PI*.5+.32+(random()-.5)*.35;
    const center=new Vector3(Math.cos(angle)*(1.35+random()*.25),5.25+i*.23,Math.sin(angle)*(1.35+random()*.25));clusters.push(center);
    const anchor=new Vector3(.02,2.6+i*.34,.02);
    branch([anchor,anchor.clone().lerp(center,.45).add(new Vector3(0,.35,0)),center],.075-i*.007,.018,6,5);
  }
  clusters.push(top);
  // Five crown groups; each has eight connected secondary sprays carrying twelve cupped leaves.
  for(let cluster=0;cluster<clusters.length;cluster++){
    const center=clusters[cluster];
    for(let twig=0;twig<8;twig++){
      const angle=twig/8*Math.PI*2+cluster*.7+(random()-.5)*.35;
      const end=center.clone().add(new Vector3(Math.cos(angle)*(1.05+random()*.25),-.8+random()*2.1,Math.sin(angle)*(1.05+random()*.25)));
      branch([center,center.clone().lerp(end,.55).add(new Vector3(0,.15,0)),end],.016,.003,2,3);
      for(let i=0;i<12;i++){
        const t=.12+i/13,base=center.clone().lerp(end,t);
        const azimuth=angle+(i%2?1:-1)*(1+random()*.8);
        const direction=new Vector3(Math.cos(azimuth),-.4+random()*1.5,Math.sin(azimuth));
        leaf(base,direction,.42+random()*.22,.24+random()*.14,.7+random()*.32);
      }
    }
  }
  let radius=0,high=0;for(const g of [...wood,...foliage]){const p=g.getAttribute('position');for(let i=0;i<p.count;i++){radius=Math.max(radius,Math.hypot(p.getX(i),p.getZ(i)));high=Math.max(high,p.getY(i));}}
  // Bake final nominal dimensions into the asset, leaving business scale rigid.
  for(const g of [...wood,...foliage])g.scale(2.8/radius,8/high,2.8/radius);
  const geometries:BufferGeometry[]=[];
  for(const [name,list,material] of [['bark',wood,materials.bark],['leaves',foliage,materials.leaf]] as const){
    const geometry=mergeGeometries(list,false);if(!geometry)throw new Error('树木几何合并失败');for(const g of list)g.dispose();geometries.push(geometry);const mesh=new Mesh(geometry,material);mesh.name=`tree-${name}`;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  }
  let disposed=false;return {root,manifest:{seed,mainBranchGroups:4,crownGroups:5,leafCount:480,heightM:8,staticCrownDiameterM:5.6},dispose:()=>{if(disposed)return;disposed=true;for(const g of geometries)g.dispose();root.clear();}};
}
