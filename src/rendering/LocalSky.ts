import {Cartesian3,Color,PostProcessStage,type Scene} from 'cesium';
import type {GeoReferenceAdapter} from '../spatial/GeoReferenceAdapter';
import type {SkyAppearance} from '../config/park-environment';

/** Sky is composed in the bottom canvas only where a ray misses the WGS84 globe.
 * Three stays transparent, so neither the sky nor clouds cover map imagery.
 */
export function createLocalSky(scene:Scene,geo:GeoReferenceAdapter,style:SkyAppearance){
 const direction=(p:[number,number,number])=>Cartesian3.normalize(new Cartesian3(...geo.farmVectorToEcef(p)),new Cartesian3());
 const stage=scene.postProcessStages.add(new PostProcessStage({name:'farm-local-daylight-sky',uniforms:{
  farmUp:direction([0,1,0]),farmEast:direction([1,0,0]),farmSouth:direction([0,0,1]),sunDirection:direction(style.sunDirectionM??[-80,110,60]),
  cloudTint:Color.fromCssColorString(style.cloudTint??'#ffffff'),sunGlow:style.sunGlow??1,mapBrightness:style.mapBrightness??1,
  horizonColor:Color.fromCssColorString(style.horizon),zenithColor:Color.fromCssColorString(style.zenith),cloudColor:Color.fromCssColorString(style.cloud),
  ...(style.cloudTextureUrl?{cloudPanorama:style.cloudTextureUrl}:{}),
  ...(style.fog?{fogColor:Color.fromCssColorString(style.fog.color),fogNear:style.fog.nearM,fogFar:style.fog.farM,cameraHeight:()=>{const p=scene.camera.positionWC;return Math.max(.35,geo.ecefToFarm([p.x,p.y,p.z])[1]);}}:{}),
 },fragmentShader:`
 uniform sampler2D colorTexture;
 uniform vec3 farmUp; uniform vec3 farmEast; uniform vec3 farmSouth; uniform vec3 sunDirection;
 uniform vec4 cloudTint;uniform float sunGlow;uniform float mapBrightness;
 uniform vec4 horizonColor; uniform vec4 zenithColor; uniform vec4 cloudColor;
 ${style.cloudTextureUrl?'uniform sampler2D cloudPanorama;':''}
 ${style.fog?'uniform vec4 fogColor; uniform float fogNear; uniform float fogFar; uniform float cameraHeight;':''}
 in vec2 v_textureCoordinates;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){
  vec4 source=texture(colorTexture,v_textureCoordinates);source.rgb*=mapBrightness;
  vec4 eye=czm_inverseProjection*vec4(v_textureCoordinates*2.0-1.0,1.0,1.0);
  vec3 ray=normalize(czm_inverseViewRotation*normalize(eye.xyz/eye.w));
  // Globe depth is cleared in some raster-only Cesium passes. Test the actual
  // ellipsoid analytically rather than treating cleared pixels as empty sky.
  vec3 radii=vec3(6378137.0,6378137.0,6356752.314245);
  vec3 origin=czm_viewerPositionWC/radii,direction=ray/radii;
  float a=dot(direction,direction),b=dot(origin,direction),c=dot(origin,origin)-1.0;
  float discriminant=b*b-a*c;
  if(b<0.0&&discriminant>=0.0){
   ${style.fog?`float rayDown=-dot(ray,farmUp);
   float distanceM=rayDown>.00001?cameraHeight/rayDown:fogFar;
   float viewDepth=distanceM*max(0.0,-normalize(eye.xyz/eye.w).z);
   source.rgb=mix(source.rgb,fogColor.rgb,smoothstep(fogNear,fogFar,viewDepth));`:''}
   out_FragColor=source;return;
  }
  float elevation=max(0.0,dot(ray,farmUp));
  vec3 sky=mix(horizonColor.rgb,zenithColor.rgb,pow(elevation,.48));
  ${style.cloudTextureUrl?`
  vec2 cloudUV=vec2(atan(dot(ray,farmSouth),dot(ray,farmEast))/6.28318530718+.5,.5+asin(clamp(dot(ray,farmUp),-1.0,1.0))/3.14159265359);
  vec4 cloud=texture(cloudPanorama,cloudUV);
  sky=mix(sky,cloud.rgb*cloudTint.rgb,cloud.a*smoothstep(.06,.22,elevation));
  `:`vec2 cloudUV=vec2(dot(ray,farmEast),dot(ray,farmSouth))/max(.18,elevation)*2.2;
  float cloud=noise(cloudUV)*.57+noise(cloudUV*2.04+7.3)*.28+noise(cloudUV*4.1)*.15;
  float veil=smoothstep(.51,.77,cloud)*smoothstep(.025,.22,elevation)*.48;
  sky=mix(sky,cloudColor.rgb,veil);`}
  sky+=sunGlow*vec3(.06,.045,.018)*pow(max(0.0,dot(ray,sunDirection)),32.0);
  out_FragColor=vec4(sky,1.0);
 }` }));
 let disposed=false;return{setAppearance(next:SkyAppearance){
  if(disposed)return;
  stage.uniforms.horizonColor=Color.fromCssColorString(next.horizon);stage.uniforms.zenithColor=Color.fromCssColorString(next.zenith);stage.uniforms.cloudColor=Color.fromCssColorString(next.cloud);
  stage.uniforms.cloudTint=Color.fromCssColorString(next.cloudTint??'#ffffff');stage.uniforms.sunGlow=next.sunGlow??1;stage.uniforms.mapBrightness=next.mapBrightness??1;stage.uniforms.sunDirection=direction(next.sunDirectionM??[-80,110,60]);
  if(style.fog&&next.fog){stage.uniforms.fogColor=Color.fromCssColorString(next.fog.color);stage.uniforms.fogNear=next.fog.nearM;stage.uniforms.fogFar=next.fog.farM;}
 },dispose(){if(disposed)return;disposed=true;if(!scene.isDestroyed())scene.postProcessStages.remove(stage);}};
}
