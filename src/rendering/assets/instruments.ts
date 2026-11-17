import { BoxGeometry, CylinderGeometry, SphereGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector3, type Material } from 'three';
export interface InstrumentMaterials { metal:Material;housing:Material;dark:Material;indicator:Material }
function kit(materials:InstrumentMaterials){
 const root=new Group(),owned:BufferGeometry[]=[];
 const add=(g:BufferGeometry,m:Material,p:readonly number[],parent:Group=root)=>{owned.push(g);const mesh=new Mesh(g,m);mesh.position.set(p[0],p[1],p[2]);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const box=(w:number,h:number,d:number,p:readonly number[],m=materials.housing,parent=root)=>add(new BoxGeometry(w,h,d),m,p,parent);
 const rod=(a:readonly number[],b:readonly number[],r:number,m=materials.metal,parent=root)=>{const from=new Vector3(...a as [number,number,number]),to=new Vector3(...b as [number,number,number]),delta=to.clone().sub(from);const mesh=add(new CylinderGeometry(r,r,delta.length(),8),m,from.clone().add(to).multiplyScalar(.5).toArray(),parent);mesh.quaternion.setFromUnitVectors(new Vector3(0,1,0),delta.normalize());return mesh;};
 let disposed=false;return {root,add,box,rod,dispose:()=>{if(disposed)return;disposed=true;owned.forEach(g=>g.dispose());root.clear();}};
}
/** Static review asset. Cups/vane pivots are independent; no telemetry or frame clock here. */
export function createWeatherStation(m:InstrumentMaterials){
 const k=kit(m);k.root.name='weather-sample';
 k.box(.35,.08,.35,[0,.04,0],m.dark);k.rod([0,.08,0],[0,3.3,0],.025);
 for(const x of [-.125,.125])for(const z of [-.125,.125])k.add(new CylinderGeometry(.013,.013,.016,6),m.metal,[x,.088,z]);
 k.box(.16,.24,.1,[0,1.82,.075]);k.box(.142,.215,.005,[0,1.82,.128],m.housing);k.box(.014,.055,.012,[.052,1.82,.137],m.dark);
 k.box(.048,.025,.004,[-.025,1.87,.133],m.dark);
 for(let i=0;i<9;i++)k.add(new CylinderGeometry(.1-i*.001,.086,.018,12),m.housing,[0,2.44+i*.027,0]);
 k.add(new CylinderGeometry(.092,.1,.025,12),m.housing,[0,2.67,0]);
 k.rod([0,1.95,.075],[0,2.435,.025],.006,m.dark);
 const cups=new Group();cups.name='weather.cups';cups.position.set(0,3.2,0);k.root.add(cups);
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3,x=Math.cos(a)*.165,z=Math.sin(a)*.165;k.rod([0,0,0],[x,0,z],.007,m.metal,cups);const cup=k.add(new SphereGeometry(.047,10,5,0,Math.PI*2,0,Math.PI/2),m.dark,[x,.014,z],cups);cup.rotation.z=Math.PI/2;cup.rotation.y=-a;}
 k.add(new CylinderGeometry(.024,.03,.07,8),m.dark,[0,.035,0],cups);
 const vane=new Group();vane.name='weather.vane';vane.position.set(0,2.95,0);k.root.add(vane);k.rod([0,0,-.21],[0,0,.17],.006,m.metal,vane);
 const triangle=(p:number[])=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.computeVertexNormals();return g;};
 k.add(triangle([0,0,.23,-.048,0,.13,.048,0,.13]),m.dark,[0,0,0],vane);
 k.add(triangle([0,.055,-.2,0,-.045,-.2,0,0,-.09]),m.dark,[0,0,0],vane);
 // Small cable glands, no unsupported free-floating wires.
 k.rod([-.04,1.7,.07],[-.04,1.65,.07],.008,m.dark);
 return {root:k.root,bindings:{'weather.cups':cups,'weather.vane':vane},dispose:k.dispose};
}
export function createSoilSensor(m:InstrumentMaterials){
 const k=kit(m);k.root.name='soil-sensor-sample';k.rod([0,0,0],[0,.49,0],.0125);
 k.box(.12,.14,.1,[0,.48,0]);k.box(.108,.127,.004,[0,.48,.052]);k.box(.04,.025,.003,[0,.5,.056],m.dark);k.box(.009,.009,.004,[.033,.46,.056],m.indicator);
 k.rod([0,.55,0],[0,.6,0],.004,m.dark);
 k.rod([.04,.41,0],[.057,.365,.015],.006,m.dark);k.rod([.057,.365,.015],[.02,.31,.015],.004,m.dark);k.rod([.02,.31,.015],[.012,.2,0],.004,m.dark);
 return {root:k.root,dispose:k.dispose};
}
