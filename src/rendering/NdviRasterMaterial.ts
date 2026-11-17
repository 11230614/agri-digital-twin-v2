import {Color,DataTexture,DoubleSide,FloatType,LinearFilter,NearestFilter,NoColorSpace,RGBAFormat,ShaderMaterial,UnsignedByteType,Vector4} from 'three';
import {validateNdviRaster,type NdviRaster} from '../data/NdviRaster';
import {NDVI_STOPS} from '../app/ports/data-visual';
export function ndviColor(value:number|null){
 if(value===null||!Number.isFinite(value)||value< -1||value>1)return new Color('#8a9ca0');
 for(let i=1;i<NDVI_STOPS.length;i++){const a=NDVI_STOPS[i-1],b=NDVI_STOPS[i];if(value<=b.value)return new Color(a.color).lerp(new Color(b.color),(value-a.value)/(b.value-a.value));}
 return new Color(NDVI_STOPS.at(-1)!.color);
}
/** Numeric texture (linear, no gamma) -> fragment sample -> Color Ramp texture lookup. */
export function createNdviRasterMaterial(){
 let pixels=new Float32Array([0,0,0,0]);
 let texture=new DataTexture(pixels,1,1,RGBAFormat,FloatType);
 const setup=(t:DataTexture)=>{t.colorSpace=NoColorSpace;t.flipY=false;t.minFilter=NearestFilter;t.magFilter=NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;};setup(texture);
 const rampBytes=new Uint8Array(256*4);
 for(let i=0;i<256;i++){const c=ndviColor(i/255*2-1);rampBytes.set([Math.round(c.r*255),Math.round(c.g*255),Math.round(c.b*255),255],i*4);}
 const ramp=new DataTexture(rampBytes,256,1,RGBAFormat,UnsignedByteType);ramp.colorSpace=NoColorSpace;ramp.minFilter=LinearFilter;ramp.magFilter=LinearFilter;ramp.generateMipmaps=false;ramp.needsUpdate=true;
 const material=new ShaderMaterial({side:DoubleSide,depthTest:true,depthWrite:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,uniforms:{ndviTexture:{value:texture},colorRamp:{value:ramp},extent:{value:new Vector4(0,0,1,1)},dataAvailable:{value:0},noDataColor:{value:new Color('#8a9ca0')}},
 vertexShader:`varying vec2 farmXZ;
void main(){
 vec4 local=vec4(position,1.0);
 #ifdef USE_INSTANCING
 local=instanceMatrix*local;
 #endif
 vec4 world=modelMatrix*local;
 farmXZ=world.xz;
 gl_Position=projectionMatrix*viewMatrix*world;
}`,
 fragmentShader:`uniform sampler2D ndviTexture;
uniform sampler2D colorRamp;
uniform vec4 extent;
uniform float dataAvailable;
uniform vec3 noDataColor;
varying vec2 farmXZ;
void main(){
 vec2 uv=(farmXZ-extent.xy)/extent.zw;
 if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0))))discard;
 vec4 pixel=texture2D(ndviTexture,uv);
 // R encodes (physicalNDVI+1)/2. A=0 means invalid, not NDVI=0.
 float ndvi=pixel.r*2.0-1.0;
 float rampU=((ndvi+1.0)*0.5*255.0+0.5)/256.0;
 vec3 mapped=texture2D(colorRamp,vec2(rampU,0.5)).rgb;
 gl_FragColor=vec4(dataAvailable>0.5&&pixel.a>0.5?mapped:noDataColor,1.0);
 #include <colorspace_fragment>
}`});
 let uploads=0,lastKey='',disposed=false;
 return {material,get uploads(){return uploads;},setAvailable(available:boolean){material.uniforms.dataAvailable.value=available?1:0;},
  apply(r:NdviRaster){
   if(disposed)return;validateNdviRaster(r);const key=[r.mode,r.sourceId,r.entityId,r.revision,r.timestamp].join('/');if(key===lastKey)return;
   if(texture.image.width!==r.width||texture.image.height!==r.height){texture.dispose();pixels=new Float32Array(r.width*r.height*4);texture=new DataTexture(pixels,r.width,r.height,RGBAFormat,FloatType);setup(texture);material.uniforms.ndviTexture.value=texture;}
   const bytes=pixels;
   for(let i=0;i<r.values.length;i++){const valid=r.validMask[i]===1;bytes[i*4]=valid?(r.values[i]+1)/2:0;bytes[i*4+1]=0;bytes[i*4+2]=0;bytes[i*4+3]=valid?1:0;}
   const e=r.extentM;material.uniforms.extent.value.set(e.xMin,e.zMin,e.xMax-e.xMin,e.zMax-e.zMin);texture.needsUpdate=true;lastKey=key;uploads++;
  },
  dispose(){if(disposed)return;disposed=true;texture.dispose();ramp.dispose();material.dispose();},
 };
}

