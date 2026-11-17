import {Color,Fog,Vector3,type DirectionalLight,type HemisphereLight,type Material,type Scene} from 'three';
import {validateEnvironmentPreset,type EnvironmentAppearance,type EnvironmentPreset} from '../app/ports/environment';
import {DEFAULT_ENVIRONMENT,PERIOD_STYLE,SEASON_STYLE,presetSky} from '../config/environment-presets';
/** Owns seasonal uniforms only. Asset builders retain ownership of materials. */
function seasonalChannel(material:Material){
 const tint={value:new Color('#ffffff')},strength={value:0},snow={value:0};
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  Object.assign(shader.uniforms,{seasonTint:tint,seasonStrength:strength,seasonSnow:snow});
  shader.vertexShader='varying float vSeasonUp;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\nvSeasonUp=(inverseTransformDirection(transformedNormal,viewMatrix)).y;');
  shader.fragmentShader='uniform vec3 seasonTint;uniform float seasonStrength;uniform float seasonSnow;varying float vSeasonUp;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float seasonLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   diffuseColor.rgb=mix(diffuseColor.rgb,seasonTint*(.28+seasonLuma*.9),seasonStrength);
   float snowCover=seasonSnow*smoothstep(.15,.78,vSeasonUp);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.82,.88,.92),snowCover);
  `);
 };
 material.customProgramCacheKey=()=>key+'-season-snow-v1';
 return {set(color:string,amount:number,cover:number){tint.value.set(color);strength.value=amount;snow.value=cover;}};
}
export class EnvironmentController {
 private state:EnvironmentPreset={...DEFAULT_ENVIRONMENT};
 private channels:{set(color:string,amount:number,cover:number):void;kind:'tree'|'grass'|'mountain'}[]=[];
 constructor(private scene:Scene,private sun:DirectionalLight,private hemi:HemisphereLight,materials:{tree:Material[];grass:Material;mountain?:Material}){
  for(const material of new Set(materials.tree))this.channels.push({...seasonalChannel(material),kind:'tree'});
  this.channels.push({...seasonalChannel(materials.grass),kind:'grass'});
  if(materials.mountain)this.channels.push({...seasonalChannel(materials.mountain),kind:'mountain'});
  this.set(this.state);
 }
 set(value:EnvironmentPreset){
  validateEnvironmentPreset(value);this.state={season:value.season,period:value.period};
  const season=SEASON_STYLE[value.season],p=PERIOD_STYLE[value.period];
  for(const c of this.channels)c.set(season[c.kind],season.strength,season.snow);
  this.sun.color.set(p.sun);this.sun.intensity=p.sunIntensity;this.hemi.color.set(p.hemi);this.hemi.groundColor.set(p.ground);this.hemi.intensity=p.hemiIntensity;
  this.scene.environmentIntensity=p.environmentIntensity;
  if(this.scene.fog instanceof Fog)this.scene.fog.color.set(p.fog);
  this.positionSun();this.sun.shadow.needsUpdate=true;
 }
 positionSun(){this.sun.position.copy(this.sun.target.position).add(new Vector3(...PERIOD_STYLE[this.state.period].direction));}
 get sky(){return presetSky(this.state.period);}
 get snapshot():EnvironmentAppearance{return {...this.state,mode:'demo',autoCycle:false};}
}
