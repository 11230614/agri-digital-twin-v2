import { BoxGeometry, BufferGeometry, CatmullRomCurve3, CylinderGeometry, Float32BufferAttribute, Group, Mesh, Path, PlaneGeometry, Shape, ShapeGeometry, TorusGeometry, TubeGeometry, Vector3, type Material } from 'three';

export interface GreenhouseMaterials {frame:Material;glass:Material;bed:Material;soil:Material;floor:Material;rubber:Material;device:Material;screen:Material;light:Material}
/** Geometry-only authoring asset. Materials are borrowed; geometry has this sole owner. */
export function createGreenhouse(materials:GreenhouseMaterials,quality:'near'|'mid'|'far'='near'){
  const root=new Group();root.name='greenhouse-sample:EntityRoot';
  const structure=new Group(),roof=new Group(),walls=new Group(),interior=new Group(),glass=new Group();
  structure.name='fixed-structure';roof.name='roof.cover';walls.name='wall.cover';interior.name='interior';glass.name='glazing';glass.add(roof,walls);root.add(structure,glass,interior);
  const geometries=new Set<BufferGeometry>();
  const mesh=(parent:Group,name:string,geometry:BufferGeometry,material:Material,position:readonly number[]=[0,0,0])=>{geometries.add(geometry);const result=new Mesh(geometry,material);result.name=name;result.position.set(position[0],position[1],position[2]);result.castShadow=material!==materials.glass;result.receiveShadow=material!==materials.glass;parent.add(result);return result;};
  const box=(parent:Group,name:string,size:readonly number[],position:readonly number[],material=materials.frame)=>mesh(parent,name,new BoxGeometry(size[0],size[1],size[2]),material,position);
  const bar=(parent:Group,name:string,a:Vector3,b:Vector3,width:number,material=materials.frame)=>{
    const result=box(parent,name,[width,a.distanceTo(b),width],a.clone().add(b).multiplyScalar(.5).toArray(),material);result.quaternion.setFromUnitVectors(new Vector3(0,1,0),b.clone().sub(a).normalize());return result;
  };
  // Recenter authored vertices so Three's transparency sorter uses each panel's actual centre.
  const panel=(parent:Group,name:string,geometry:BufferGeometry)=>{
    geometry.computeBoundingBox();const center=geometry.boundingBox!.getCenter(new Vector3());geometry.translate(-center.x,-center.y,-center.z);geometry.computeVertexNormals();
    return mesh(parent,name,geometry,materials.glass,center.toArray());
  };
  const quad=(parent:Group,name:string,points:number[],indices=[0,1,2,0,2,3])=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points,3));g.setIndex(indices);return panel(parent,name,g);};
  const archSegments=quality==='near'?48:quality==='mid'?24:12;
  // All centre lines stay inside the 18 x 28 x 7 envelope, including tube radius/end caps.
  for(const z of [-.06,-4,-8,-12,-16,-20,-24,-27.94]){
    for(const x of [-8.95,8.95])box(structure,'side-column',[.1,3,.1],[x,1.5,z]);
    const points=Array.from({length:49},(_,i)=>{const t=i/48*Math.PI;return new Vector3(8.95*Math.cos(t),3+3.95*Math.sin(t),z);});
    mesh(structure,'arch',new TubeGeometry(new CatmullRomCurve3(points),archSegments,.045,quality==='near'?6:4,false),materials.frame);
  }
  for(const t of [0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI])box(structure,'longitudinal-purlin',[.06,.06,27.88],[8.95*Math.cos(t),3+3.95*Math.sin(t),-14]);
  for(const t of [Math.PI/8,3*Math.PI/8,5*Math.PI/8,7*Math.PI/8])box(structure,'glazing-seam',[.025,.025,27.78],[8.975*Math.cos(t),3+3.975*Math.sin(t),-14]);
  for(const x of [-8.95,8.95])box(structure,'side-glazing-transom',[.035,.035,27.78],[x,1.5,-14]);
  for(const x of [-4,4])box(structure,'light-support-rail',[.04,.04,27.78],[x,3+3.95*Math.sqrt(1-(x/8.95)**2)-.08,-14]);
  for(const x of [-8.95,8.95])box(structure,'side-base',[.1,.1,27.88],[x,.05,-14]);
  for(const x of [-5.275,5.275])box(structure,'front-base',[7.35,.1,.1],[x,.05,-.06]);
  box(structure,'rear-base',[17.9,.1,.1],[0,.05,-27.94]);
  // Seven bays, eight curved glass strips per bay, normals facing outward/upward.
  for(let bay=0;bay<7;bay++){
    const z0=-.11-bay*(27.78/7),z1=-.11-(bay+1)*(27.78/7);
    for(const sign of [-1,1]){
      const x=sign*8.975;
      quad(walls,'side-glass',[x,.1,z0,x,3,z0,x,3,z1,x,.1,z1],sign===1?[0,2,1,0,3,2]:[0,1,2,0,2,3]);
    }
    for(let strip=0;strip<8;strip++){
      const vertices:number[]=[],indices:number[]=[];
      for(let j=0;j<=4;j++){
        const t=(strip+j/4)/8*Math.PI,x=8.975*Math.cos(t),y=3+3.975*Math.sin(t);
        vertices.push(x,y,z0,x,y,z1);
        if(j<4){const a=j*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      }
      const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setIndex(indices);panel(roof,'roof-glass',g);
    }
  }
  const rect=(x0:number,y0:number,x1:number,y1:number)=>{const s=new Shape();s.moveTo(x0,y0);s.lineTo(x1,y0);s.lineTo(x1,y1);s.lineTo(x0,y1);s.closePath();return s;};
  const wallShape=(name:string,shape:Shape,z:number,back=false)=>{
    const geometry=new ShapeGeometry(shape,32);geometry.translate(0,0,z);
    if(back){const index=geometry.index!;for(let i=0;i<index.count;i+=3){const a=index.getX(i);index.setX(i,index.getX(i+2));index.setX(i+2,a);}}
    return panel(walls,name,geometry);
  };
  const archCap=()=>{const s=new Shape();s.moveTo(8.975,3);for(let j=1;j<=48;j++){const t=j/48*Math.PI;s.lineTo(8.975*Math.cos(t),3+3.975*Math.sin(t));}s.lineTo(8.975,3);s.closePath();return s;};
  for(const z of [-.12,-27.88]){
    const back=z<-20;wallShape(back?'rear-arch-glass':'front-arch-glass',archCap(),z,back);
    for(const x of [-7,-3.5,3.5,7]){const high=3+3.95*Math.sqrt(1-(x/8.95)**2);box(structure,'end-mullion',[.06,high-.1,.06],[x,(high+.1)/2,z]);}
    box(structure,'end-transom',[17.9,.06,.06],[0,3,z]);
  }
  wallShape('front-left-glass',rect(-8.975,.1,-1.6,3),-.12);
  wallShape('front-right-glass',rect(1.6,.1,8.975,3),-.12);
  wallShape('front-header-glass',rect(-1.6,2.6,1.6,3),-.12);
  const rear=rect(-8.975,.1,8.975,3);
  for(const x of [-5,0,5]){const hole=new Path();hole.absarc(x,2.2,.62,0,Math.PI*2,true);rear.holes.push(hole);}
  wallShape('rear-wall-with-fan-openings',rear,-27.88,true);
  for(const x of [-1.55,1.55])box(structure,'door-jamb',[.1,2.5,.1],[x,1.25,-.07]);
  box(structure,'door-header',[6.2,.1,.08],[0,2.55,-.05]);
  const doors:Group[]=[];
  for(const sign of [-1,1]){
    const door=new Group();door.name=sign===-1?'door.left':'door.right';door.position.set(sign*.75,1.225,-.05);root.add(door);doors.push(door);
    for(const x of [-.72,.72])box(door,'door-stile',[.04,2.45,.04],[x,0,0]);
    for(const y of [-1.205,1.205])box(door,'door-rail',[1.4,.04,.04],[0,y,0]);
    const pane=new PlaneGeometry(1.4,2.37);mesh(door,'door-glass',pane,materials.glass,[0,0,0]);
    box(door,'door-handle',[.025,.24,.025],[-sign*.6,0,.025],materials.rubber);
  }
  // Raised beds: soil top exactly y=.45, no coplanar full-size cap on the edging.
  for(const x of [-5,5]){
    for(const dx of [-2.96,2.96])box(interior,'bed-long-edge',[.08,.45,24],[x+dx,.225,-14],materials.bed);
    for(const z of [-25.96,-2.04])box(interior,'bed-end-edge',[5.84,.45,.08],[x,.225,z],materials.bed);
    box(interior,'bed-soil',[5.84,.38,23.84],[x,.26,-14],materials.soil);
  }
  box(interior,'central-aisle',[4,.02,27.8],[0,.01,-14],materials.floor);
  for(const x of [-7.8,-2.2,2.2,7.8]){const pipe=mesh(interior,'drip-line',new CylinderGeometry(.016,.016,24,6),materials.rubber,[x,.466,-14]);pipe.rotation.x=Math.PI/2;}
  for(const x of [-4,4])for(const z of [-4,-10,-16,-22]){
    box(interior,'light-housing',[.08,.04,1.2],[x,3.8,z]);box(interior,'light-emitter',[.064,.006,1.16],[x,3.777,z],materials.light);
    const high=3+3.95*Math.sqrt(1-(x/8.95)**2);
    for(const dz of [-.45,.45])bar(interior,'light-suspension',new Vector3(x,3.82,z+dz),new Vector3(x,high-.08,z+dz),.008,materials.rubber);
  }
  for(const sign of [-1,1])for(const z of [-6,-14,-22]){
    box(interior,'control-mounting-arm',[.35,.04,.1],[sign*8.77,1.55,z]);
    const device=new Group();device.name='control-box';device.position.set(sign*8.6,1.4,z);device.rotation.y=-sign*Math.PI/2;interior.add(device);
    box(device,'control-housing',[.3,.45,.15],[0,.225,0],materials.device);box(device,'control-screen',[.18,.11,.008],[0,.28,.079],materials.screen);box(device,'control-seam',[.23,.008,.008],[0,.14,.079],materials.rubber);
  }
  const rotors:Group[]=[];
  for(const x of [-5,0,5]){
    const fan=new Group();fan.name='fan-housing';fan.position.set(x,2.2,-27.6);interior.add(fan);
    const cylinder=mesh(fan,'fan-open-cylinder',new CylinderGeometry(.67,.67,.25,24,1,true),materials.frame);cylinder.rotation.x=Math.PI/2;
    const shroud=mesh(fan,'fan-rear-sleeve',new CylinderGeometry(.62,.62,.28,24,1,true),materials.device,[0,0,-.14]);shroud.rotation.x=Math.PI/2;
    for(const z of [-.125,.125])mesh(fan,'fan-rim',new TorusGeometry(.67,.03,4,24),materials.frame,[0,0,z]);
    for(const r of [.2,.4,.59])mesh(fan,'fan-guard-ring',new TorusGeometry(r,.006,3,20),materials.rubber,[0,0,.135]);
    for(const t of [0,Math.PI/2])bar(fan,'fan-guard-spoke',new Vector3(-.6*Math.cos(t),-.6*Math.sin(t),.14),new Vector3(.6*Math.cos(t),.6*Math.sin(t),.14),.008,materials.rubber);
    const rotor=new Group();rotor.name=`fan.0${rotors.length+1}.rotor`;fan.add(rotor);rotors.push(rotor);
    const hub=mesh(rotor,'fan-hub',new CylinderGeometry(.09,.09,.12,12),materials.device,[0,0,.02]);hub.rotation.x=Math.PI/2;
    for(let i=0;i<4;i++){
      const shape=new Shape();shape.moveTo(.06,-.04);shape.bezierCurveTo(.25,-.14,.5,-.2,.59,-.04);shape.quadraticCurveTo(.62,.05,.51,.12);shape.quadraticCurveTo(.24,.14,.06,.04);shape.closePath();
      const g=new ShapeGeometry(shape,5);const p=g.getAttribute('position');for(let j=0;j<p.count;j++)p.setZ(j,.05*Math.sin(p.getX(j)*5));g.computeVertexNormals();const blade=mesh(rotor,'fan-curved-blade',g,materials.device);blade.rotation.z=i*Math.PI/2;
    }
  }
  let disposed=false;
  return {root,roof,walls,doors,rotors,setInspection:(doorRatio:number,cutaway:boolean)=>{doors[0].position.x=-.75-1.5*doorRatio;doors[1].position.x=.75+1.5*doorRatio;roof.visible=!cutaway;},dispose:()=>{if(disposed)return;disposed=true;for(const g of geometries)g.dispose();root.clear();}};
}
