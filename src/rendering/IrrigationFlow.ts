import {BufferGeometry,Float32BufferAttribute,FrontSide,Group,Mesh,ShaderMaterial,Vector3} from 'three';
import type {createIrrigation} from './assets/irrigation';
/** A single low-sided water tube inside the pipe. No particles or extra frame loop. */
export function createIrrigationFlow(network:ReturnType<typeof createIrrigation>['network']){
 const positions:number[]=[],distances:number[]=[],angles:number[]=[],radials:number[]=[],indices:number[]=[];
 const paths=[{points:[network.main.from,network.main.to],diameter:network.main.diameterM},...network.branches.map(b=>({points:b.centerline,diameter:b.diameterM}))];
 const sides=6;
 for(const {points,diameter} of paths){let distance=0;for(let i=1;i<points.length;i++){
  const a=new Vector3(...points[i-1] as [number,number,number]),b=new Vector3(...points[i] as [number,number,number]),length=a.distanceTo(b),tangent=b.clone().sub(a).normalize();
  const side=new Vector3().crossVectors(tangent,new Vector3(0,1,0)).normalize(),up=new Vector3().crossVectors(side,tangent).normalize();
  const radius=diameter*.36,steps=Math.ceil(length/.24),start=positions.length/3;
  for(let j=0;j<=steps;j++)for(let k=0;k<=sides;k++){
   const angle=k/sides*Math.PI*2,radial=side.clone().multiplyScalar(Math.cos(angle)*radius).addScaledVector(up,Math.sin(angle)*radius),point=a.clone().lerp(b,j/steps).add(radial);
   positions.push(point.x,point.y,point.z);radials.push(radial.x,radial.y,radial.z);distances.push(distance+length*j/steps);angles.push(angle);
  }
  for(let j=0;j<steps;j++)for(let k=0;k<sides;k++){const n=start+j*(sides+1)+k;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
  distance+=length;
 }}
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('flowDistance',new Float32BufferAttribute(distances,1));geometry.setAttribute('flowAngle',new Float32BufferAttribute(angles,1));geometry.setAttribute('flowRadial',new Float32BufferAttribute(radials,3));geometry.setIndex(indices);geometry.computeBoundingSphere();geometry.boundingSphere!.radius+=.003;
 const material=new ShaderMaterial({side:FrontSide,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,uniforms:{phase:{value:0},uTime:{value:0}},vertexShader:`
attribute float flowDistance;attribute float flowAngle;attribute vec3 flowRadial;
uniform float uTime;varying float d;varying float angle;
void main(){d=flowDistance;angle=flowAngle;
 // Radial motion stays within the physical pipe (water radius is 72% of pipe radius).
 vec3 p=position+flowRadial*(0.045*sin(d*19.0-uTime*3.0)+0.025*sin(d*31.0+flowAngle*2.0-uTime*2.0));
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`,fragmentShader:`
uniform float phase;uniform float uTime;varying float d;varying float angle;
void main(){
 float travel=d-phase;
 float ripple=0.5+0.5*sin(travel*52.35988+sin(angle*3.0-uTime)*0.6);
 // Dense 24cm pulses and a longer moving highlight, all advancing toward +d.
 float drop=pow(0.5+0.5*cos(travel*26.17994),6.0);
 float band=pow(0.5+0.5*cos(travel*2.617994),24.0);
 float bubble=pow(max(0.0,sin(travel*79.0+sin(angle*7.0))*sin(angle*5.0+travel*11.0)),12.0);
 float glint=pow(0.5+0.5*sin(angle),8.0);
 vec3 water=mix(vec3(0.025,0.32,0.58),vec3(0.28,0.82,1.0),drop*.55+ripple*.12+glint*.22);
 water=mix(water,vec3(0.78,0.96,1.0),clamp(band*.65+bubble*.4,0.0,0.85));
 gl_FragColor=vec4(water,clamp(.26+drop*.40+band*.18+bubble*.12,.0,.88));
 #include <colorspace_fragment>
}`});
 const root=new Group(),mesh=new Mesh(geometry,material);root.name='demo-irrigation-flow';mesh.name='flow-water-tube';mesh.renderOrder=20;mesh.castShadow=false;mesh.receiveShadow=false;root.add(mesh);root.visible=false;
 let disposed=false;
 return {root,mesh,triangles:indices.length/3,update(phase:number,visible:boolean,time=0){root.visible=visible;material.uniforms.phase.value=phase;material.uniforms.uTime.value=time;},get phase(){return material.uniforms.phase.value as number;},dispose(){if(disposed)return;disposed=true;geometry.dispose();material.dispose();root.clear();}};
}
