import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Group, Mesh, SphereGeometry, TubeGeometry, Vector3, type Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export interface TomatoMaterials {stem:Material;leaf:Material;greenFruit:Material;turningFruit:Material;rope:Material}
/** Rooted, static botanical authoring asset. Geometry owned here; borrowed materials owned by scene. */
export function createTomato(materials:TomatoMaterials){
  const root=new Group();root.name='tomato-sample:EntityRoot';
  const parts=new Map<keyof TomatoMaterials,BufferGeometry[]>();
  const manifest={branchGroups:6,leaflets:60,fruitClusters:3,fruits:9,greenFruits:7,turningFruits:2,heightM:2.4,staticCrownDiameterM:.55};
  const fruitCenters:Vector3[]=[];
  const collect=(key:keyof TomatoMaterials,geometry:BufferGeometry)=>{if(!parts.has(key))parts.set(key,[]);parts.get(key)!.push(geometry);};
  const curve=(key:keyof TomatoMaterials,points:Vector3[],radius:number,segments=5,radial=4)=>collect(key,new TubeGeometry(new CatmullRomCurve3(points),segments,radius,radial,false));
  const stemAt=(y:number)=>new Vector3(.012*Math.sin(y*3),y,.009*Math.sin(y*4));
  curve('stem',Array.from({length:17},(_,i)=>stemAt(i/16*2.392)),.006,18,5);
  const leaf=(base:Vector3,angle:number,length:number,width:number,lift:number,seed:number)=>{
    const positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
    for(let j=0;j<=10;j++){
      const t=j/10,serration=j%2===0?1:.76;
      // Narrow stem connection, curved blade and a pointed serrated silhouette.
      const half=width*.5*Math.pow(Math.sin(Math.PI*t),.8)*serration;
      for(let k=0;k<3;k++){
        const across=k-1,radial=length*t;
        const sideways=half*across;
        const y=base.y+lift*t+.022*Math.sin(Math.PI*t)-.045*t*t+.009*across*across*Math.sin(Math.PI*t);
        positions.push(base.x+radial*Math.cos(angle)-sideways*Math.sin(angle),y,base.z+radial*Math.sin(angle)+sideways*Math.cos(angle));
        uv.push(k/2,t);const shade=.85+.1*t+.035*Math.sin(seed);colors.push(shade*.94,shade,shade*.9);
        if(j<10&&k<2){const a=j*3+k;indices.push(a,a+1,a+3,a+1,a+4,a+3);}
      }
    }
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();collect('leaf',geometry);
  };
  for(let group=0;group<6;group++){
    for(let side=0;side<2;side++){
    const y=.28+group*.39+side*.045,angle=.2+group*2.39+side*2.8,reach=.14-(group%2)*.01;
    const at=(t:number)=>stemAt(y).add(new Vector3(Math.cos(angle)*reach*t,.075*t-.025*t*t,Math.sin(angle)*reach*t));
    curve('stem',[at(0),at(.4),at(.75),at(1)],.0026,6,4);
    // Two opposed pairs plus one terminal leaflet, all joined directly to the rachis.
    for(let pair=0;pair<2;pair++)for(const sign of [-1,1]){
      const t=.3+pair*.3;leaf(at(t),angle+sign*(1.05-pair*.14),.15-pair*.012,.09-pair*.006,.02+pair*.006,group*7+pair+sign+side);
    }
    leaf(at(.94),angle,.15,.095,.026,group*7+5+side);
    }
  }
  // A short apical shoot caps the main stem at the nominal 2.4 m, not a crown centred at 2.4 m.
  curve('stem',[stemAt(2.35),stemAt(2.38),new Vector3(stemAt(2.392).x,2.396,stemAt(2.392).z)],.004,3,4);
  for(let cluster=0;cluster<3;cluster++){
    const y=[.56,1.34,1.73][cluster],angle=[.8,2.7,5.1][cluster];
    const hub=stemAt(y+.08).add(new Vector3(Math.cos(angle)*.105,-.025,Math.sin(angle)*.105));
    curve('stem',[stemAt(y+.13),hub.clone().add(new Vector3(0,.04,0)),hub],.0026,4,3);
    for(let fruit=0;fruit<3;fruit++){
      const center=hub.clone().add(new Vector3((fruit-1)*.047,-.045-fruit*.029,(fruit%2)*.035));
      const radius=[.026,.023,.029][(cluster+fruit)%3];fruitCenters.push(center.clone());
      const body=new SphereGeometry(radius,12,8);const p=body.getAttribute('position');
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),z=p.getZ(i),theta=Math.atan2(z,x),rib=1+.035*Math.cos(theta*5);
        p.setXYZ(i,x*rib,p.getY(i)*.94,z*rib);
      }body.computeVertexNormals();body.translate(center.x,center.y,center.z);
      collect(cluster===1&&fruit===2||cluster===2&&fruit===1?'turningFruit':'greenFruit',body);
      const calyx=center.clone().add(new Vector3(0,radius*.94,0));
      curve('stem',[hub,calyx.clone().add(new Vector3(0,.012,0)),calyx],.0016,3,3);
      const vertices:number[]=[],indices:number[]=[];
      for(let sepal=0;sepal<5;sepal++){
        const theta=sepal/5*Math.PI*2,index=vertices.length/3;
        vertices.push(calyx.x+.003*Math.cos(theta-.6),calyx.y,calyx.z+.003*Math.sin(theta-.6),calyx.x+.019*Math.cos(theta),calyx.y-.006,calyx.z+.019*Math.sin(theta),calyx.x+.003*Math.cos(theta+.6),calyx.y,calyx.z+.003*Math.sin(theta+.6));indices.push(index,index+2,index+1);
      }
      const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setAttribute('uv',new Float32BufferAttribute(new Array(vertices.length/3*2).fill(0),2));g.setIndex(indices);g.computeVertexNormals();collect('stem',g);
    }
  }
  // Stem and support line attach at common tie heights; this is not a freestanding stake.
  curve('rope',Array.from({length:13},(_,i)=>{const y=i/12*2.399;return new Vector3(.026+Math.sin(y*8)*.004,y,.012);}),.001,12,3);
  for(const y of [.55,1.15,1.75,2.2])curve('rope',[stemAt(y),new Vector3(.026,y,.012)],.0012,2,3);
  // Match crown width in asset space once, including fruit/stems; EntityRoot remains unit scale.
  let maxRadius=0,maxY=0;
  for(const list of parts.values())for(const g of list){const p=g.getAttribute('position');for(let i=0;i<p.count;i++){maxRadius=Math.max(maxRadius,Math.hypot(p.getX(i),p.getZ(i)));maxY=Math.max(maxY,p.getY(i));}}
  const horizontal=.275/maxRadius,vertical=2.4/maxY;
  for(const list of parts.values())for(const g of list)g.scale(horizontal,vertical,horizontal);
  for(const center of fruitCenters){center.x*=horizontal;center.z*=horizontal;center.y*=vertical;}
  const owned:BufferGeometry[]=[];
  for(const [key,list] of parts){
    const geometry=mergeGeometries(list,false);if(!geometry)throw new Error(`番茄几何合并失败: ${key}`);for(const g of list)g.dispose();owned.push(geometry);
    const mesh=new Mesh(geometry,materials[key]);mesh.name=`tomato-${key}`;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  }
  let disposed=false;return {root,manifest,fruitCenters,supportTop:new Vector3(.026+Math.sin(2.399*8)*.004,2.399,.012).multiply(new Vector3(horizontal,vertical,horizontal)),dispose:()=>{if(disposed)return;disposed=true;for(const g of owned)g.dispose();root.clear();}};
}
