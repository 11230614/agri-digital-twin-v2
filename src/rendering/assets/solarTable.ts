import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Quaternion, TubeGeometry, CatmullRomCurve3, Vector3, type Material, type BufferGeometry } from 'three';

export const SOLAR_TABLE = Object.freeze({widthM:8,slopeDepthM:3.2,thicknessM:.05,tiltRad:25*Math.PI/180,centerHeightM:.65+1.6*Math.sin(25*Math.PI/180),columns:8,rows:2});
export interface SolarMaterials {cell:Material;frame:Material;back:Material;cable:Material;foot:Material}
/** One isolated fixed table, local installation point at ground centre. No geography or state. */
export function createSolarTable(materials:SolarMaterials){
  const root=new Group();root.name='solar-table-sample:EntityRoot';
  const visual=new Group();visual.name='VisualRoot';root.add(visual);
  const tilted=new Group();tilted.name='fixed-tilt-25deg';tilted.position.y=SOLAR_TABLE.centerHeightM;tilted.rotation.x=SOLAR_TABLE.tiltRad;visual.add(tilted);
  const geometries=new Set<BufferGeometry>();
  const add=(parent:Group,name:string,geometry:BufferGeometry,material:Material,position:readonly number[])=>{
    geometries.add(geometry);const mesh=new Mesh(geometry,material);mesh.name=name;mesh.position.set(position[0],position[1],position[2]);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  const box=(parent:Group,name:string,size:readonly number[],position:readonly number[],material:Material)=>add(parent,name,new BoxGeometry(size[0],size[1],size[2]),material,position);
  box(tilted,'backsheet',[7.92,.012,3.12],[0,-.019,0],materials.back);
  for(const x of [-3.98,3.98])box(tilted,'side-frame',[.04,.05,3.2],[x,0,0],materials.frame);
  for(const z of [-1.58,1.58])box(tilted,'end-frame',[7.92,.05,.04],[0,0,z],materials.frame);
  const surface=add(tilted,'solar-cell-surface',new PlaneGeometry(7.92,3.12),materials.cell,[0,.023,0]);surface.rotation.x=-Math.PI/2;
  surface.userData.partition={columns:8,rows:2,gapM:.02,cellWidthM:.9725,cellDepthM:1.55};
  // Horizontal members follow the underside plane. Legs terminate at their actual lower face.
  for(const z of [-1.1,1.1])box(tilted,'mounting-rail',[7.4,.08,.1],[0,-.07,z],materials.frame);
  const sin=Math.sin(SOLAR_TABLE.tiltRad),cos=Math.cos(SOLAR_TABLE.tiltRad);
  const supportPoints:Vector3[]=[];
  for(const x of [-3,3])for(const z of [-1.1,1.1]){
    const top=new Vector3(x,SOLAR_TABLE.centerHeightM-.11*cos-z*sin,-.11*sin+z*cos);supportPoints.push(top);
    box(visual,'concrete-foot',[.32,.06,.32],[x,.03,top.z],materials.foot);
    box(visual,'base-plate',[.18,.012,.18],[x,.066,top.z],materials.frame);
    box(visual,'upright',[.08,top.y-.072,.08],[x,(top.y+.072)/2,top.z],materials.frame);
    for(const dx of [-.06,.06]){
      const bolt=add(visual,'anchor-bolt',new CylinderGeometry(.011,.011,.016,6),materials.frame,[x+dx,.08,top.z]);bolt.castShadow=false;
    }
  }
  const bar=(name:string,a:Vector3,b:Vector3,width:number)=>{
    const mesh=box(visual,name,[width,a.distanceTo(b),width],a.clone().add(b).multiplyScalar(.5).toArray(),materials.frame);
    mesh.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),b.clone().sub(a).normalize()));
  };
  for(const x of [-3,3]){
    const back=supportPoints.find(p=>p.x===x&&p.z<0)!,front=supportPoints.find(p=>p.x===x&&p.z>0)!;
    bar('fixed-diagonal-brace',new Vector3(x,.18,back.z),front.clone().add(new Vector3(0,-.1,0)),.04);
  }
  box(tilted,'junction-box',[.20,.05,.12],[0,-.05,-.25],materials.cable);
  for(const x of [-.07,.07]){
    const curve=new CatmullRomCurve3([new Vector3(x,-.075,-.25),new Vector3(x,-.09,-.48),new Vector3(x,-.085,-1.04),new Vector3(x+.3,-.085,-1.1)]);
    add(tilted,'back-cable',new TubeGeometry(curve,10,.008,5,false),materials.cable,[0,0,0]);
  }
  let disposed=false;
  return {root,tilted,supportPoints,dispose:()=>{if(disposed)return;disposed=true;for(const geometry of geometries)geometry.dispose();root.clear();}};
}
