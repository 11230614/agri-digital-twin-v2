import { BufferGeometry, Float32BufferAttribute } from 'three';

export type LeafQuality='near'|'mid'|'far';
/** Twelve individual cupped leaves (6+4+2), joined as one opaque mesh.
 * UV x follows leaf width, UV y base-to-tip. Root stays at local zero.
 * No sphere/polyhedron whole-plant proxy is used in the authored close-up. */
export function createLeafGeometry(heightM:number,crownDiameterM:number,quality:LeafQuality='near'):BufferGeometry {
  if(heightM<=0||crownDiameterM<=0||![heightM,crownDiameterM].every(Number.isFinite))throw new Error('作物尺寸无效');
  const positions:number[]=[],uvs:number[]=[],colors:number[]=[],indices:number[]=[];
  // Far leaves still need a blade midpoint: endpoint-only samples collapse the broad leaf to a stalk.
  const segments=quality==='near'?8:2;
  const across=quality==='near'?6:quality==='far'?1:2;
  const layers=quality==='far'?[{count:6,radius:1,high:.72,width:.47}]:[
    {count:6,radius:1,high:.60,width:.48},
    {count:4,radius:.64,high:.86,width:.39},
    {count:2,radius:.30,high:1,width:.26},
  ];
  let leafIndex=0;
  for(let layer=0;layer<layers.length;layer++){
    const info=layers[layer];
    for(let leaf=0;leaf<info.count;leaf++,leafIndex++){
      const angle=leaf/info.count*Math.PI*2+layer*1.13+Math.sin(leafIndex*2.3)*.11;
      const cos=Math.cos(angle),sin=Math.sin(angle);
      const offset=positions.length/3;
      for(let j=0;j<=segments;j++){
        // Extra samples around the rounded blade tip and the stalk/blade transition.
        const t=quality==='near'?[0,.13,.28,.45,.64,.80,.91,.98,1][j]:j/segments;
        const blade=Math.max(0,(t-.25)/.75);
        const stalkWidth=.035*(.5+.5*Math.sin(Math.min(1,t/.25)*Math.PI/2));
        const bladeWidth=Math.pow(Math.max(0,Math.sin(Math.PI*blade)),.52)*info.width;
        const width=(t<.25?stalkWidth:Math.max(bladeWidth,stalkWidth*(1-blade)))*(1+.08*Math.sin(leafIndex*1.7));
        const radius=info.radius*(.06+.94*Math.pow(t,1.18));
        // Upright spoon-shaped leaf, rather than a triangular sheet drooping to soil.
        const centerHeight=info.high*(1.55*t-.55*t*t)*(1+.045*Math.cos(leafIndex*2.3));
        for(let k=0;k<=across;k++){
          const u=k/across*2-1;
          const scallop=1+.045*Math.sin(blade*3*Math.PI+leafIndex*.6);
          const lateral=width*u*scallop*(1+.04*u*Math.sin(leafIndex));
          // Broad smooth cupping, a soft central rib and only small edge ripples.
          const bladeWeight=Math.sin(Math.PI*blade);
          const cup=.075*u*u*bladeWeight;
          const rib=.012*Math.exp(-u*u*20)*bladeWeight;
          const ripple=.012*Math.sin(blade*4*Math.PI+leafIndex)*Math.pow(Math.abs(u),3)*bladeWeight;
          const twist=u*width*.18*Math.sin(leafIndex*1.9)*bladeWeight;
          const y=centerHeight+cup+rib+ripple+twist;
          positions.push(radius*cos-lateral*sin,Math.max(0,y),radius*sin+lateral*cos);
          uvs.push(k/across,t);
          const shade=.90+layer*.035+.045*t+.025*Math.cos(leafIndex*2.1);
          colors.push(shade*.96,shade,shade*.92);
          if(j<segments&&k<across){
            const a=offset+j*(across+1)+k,b=a+across+1;
            indices.push(a,a+1,b,b,a+1,b+1);
          }
        }
      }
    }
  }
  let radiusMax=0,yMax=0;
  for(let i=0;i<positions.length;i+=3){radiusMax=Math.max(radiusMax,Math.hypot(positions[i],positions[i+2]));yMax=Math.max(yMax,positions[i+1]);}
  for(let i=0;i<positions.length;i+=3){positions[i]*=crownDiameterM/(2*radiusMax);positions[i+2]*=crownDiameterM/(2*radiusMax);positions[i+1]*=heightM/yMax;}
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2));
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  geometry.userData={asset:'pakchoi-candidate-02',quality,leafCount:layers.reduce((sum,layer)=>sum+layer.count,0),heightM,crownDiameterM};
  return geometry;
}
