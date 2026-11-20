import {Color,FramebufferTexture,LinearFilter,Mesh,NoBlending,Scene,ShaderMaterial,UnsignedByteType,Vector2,WebGLRenderTarget,type PerspectiveCamera,type WebGLRenderer} from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {BloomPass} from 'three/examples/jsm/postprocessing/BloomPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type {BloomSource,PostProcessingSettings,PostProcessingSnapshot} from '../app/ports/post-processing';
import {DepthEffects,type DepthSample,type DepthView} from './DepthEffects';

const vertexShader=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
/** Display-referred input: original renderer has ALREADY applied per-material ACES/sRGB.
 * Framebuffer copies stay on GPU. Preserve premultiplied alpha; never tone-map a second time.
 * Bloom mask reuses the original default framebuffer DEPTH, drawing only prepared sources.
 */
export class PostProcessingManager {
 private settings:Required<PostProcessingSettings>={bloom:false,enhance:false,depthOfField:false,ssao:false};
 private base?:FramebufferTexture;private mask?:FramebufferTexture;
 private composer?:EffectComposer;private bloom?:BloomPass;private seed?:ShaderPass;private output?:ShaderPass;
 private readonly maskScene=new Scene();
 private readonly proxies:{source:BloomSource;mesh:Mesh}[]=[];
 private width=0;private height=0;private bloomSize:[number,number]=[0,0];private failed?:string;private disposed=false;
 private readonly depth?:DepthEffects;
 private view:PostProcessingSnapshot={bloom:false,enhance:false,active:false,bypassReason:'disabled',depthEffect:null,bloomSuspended:false,bloomSize:[0,0],eligibleSources:0,sceneCalls:0,sceneTriangles:0,effectCalls:0,effectTriangles:0};
 constructor(private readonly renderer:WebGLRenderer,private readonly sources:readonly BloomSource[]=[], sample?:DepthSample){
  if(sample)this.depth=new DepthEffects(sample);
 }
 set(settings:PostProcessingSettings){
  const next={depthOfField:false,ssao:false,...settings};
  if(!Object.values(next).every(value=>typeof value==='boolean'))throw new Error('无效后处理配置');
  this.settings=next;
 }
 get snapshot(){return {...this.view,...this.settings,bloomSize:[...this.bloomSize] as [number,number]};}
 resize(width:number,height:number){
  width=Math.max(1,Math.floor(width));height=Math.max(1,Math.floor(height));if(width===this.width&&height===this.height)return;
  this.width=width;this.height=height;this.base?.dispose();this.mask?.dispose();this.base=undefined;this.mask=undefined;
  this.bloomSize=[Math.max(1,Math.floor(width/2)),Math.max(1,Math.floor(height/2))];this.composer?.setSize(...this.bloomSize);
  this.depth?.resize(width,height);
 }
 private texture(){const t=new FramebufferTexture(this.width,this.height);t.minFilter=LinearFilter;t.magFilter=LinearFilter;return t;}
 private copyFrame(texture:FramebufferTexture){
  const renderer=this.renderer;
  // Three r170 may leave another texture unit active when slot 0 already
  // has this texture bound. The framebuffer copy uses the active unit.
  renderer.state.activeTexture(renderer.getContext().TEXTURE0);
  renderer.copyFramebufferToTexture(texture);
 }
 private prepare(bloom:boolean,depth=false){
  if(!depth)this.base??=this.texture();
  this.output??=new ShaderPass({name:'FarmAlphaSafeDisplayResolve',uniforms:{
   base:{value:null},glow:{value:null},strength:{value:0},enhance:{value:0},
   sceneDepth:{value:null},occlusion:{value:null},occlusionDepth:{value:null},
   depthMode:{value:0},clip:{value:new Vector2()},pixel:{value:new Vector2()},focusDistance:{value:0},focusStrength:{value:0},
  },vertexShader,fragmentShader:`
   uniform sampler2D base;uniform sampler2D glow;uniform float strength;uniform float enhance;varying vec2 vUv;
   uniform highp sampler2D sceneDepth,occlusionDepth;
   uniform sampler2D occlusion;
   uniform int depthMode;
   uniform vec2 clip,pixel;
   uniform float focusDistance,focusStrength;
   vec3 linearize(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
   vec3 encode(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
   float viewDistance(float z){return clip.x/(1.-z*(1.-clip.x/clip.y));}
   vec4 backgroundBlur(vec4 source,float centerDepth){
    if(source.a<.001)return source;
    float radius=7.2*focusStrength*smoothstep(.32,5.5,centerDepth-focusDistance);
    if(radius<.25)return source;
    vec3 sum=source.rgb/source.a*2.;
    float total=2.;
    for(int i=0;i<8;i++){
     float angle=float(i)*.78539816;
     float ring=mod(float(i),2.)<.5?1.:.58;
     vec2 uv=vUv+vec2(cos(angle),sin(angle))*pixel*radius*ring;
     vec4 sampleColor=texture2D(base,uv);
     float distance=viewDistance(texture2D(sceneDepth,uv).r);
     float weight=smoothstep(focusDistance+.20,focusDistance+.55,distance)*sampleColor.a;
     sum+=sampleColor.rgb*smoothstep(focusDistance+.20,focusDistance+.55,distance);
     total+=weight;
    }
    return vec4(sum/total*source.a,source.a);
   }
   void main(){
    vec4 b=texture2D(base,vUv);vec4 g=texture2D(glow,vUv)*strength;
    if(depthMode!=0){
     float z=texture2D(sceneDepth,vUv).r;
     if(z<.999999){
      float distance=viewDistance(z);
      if(depthMode==1)b=backgroundBlur(b,distance);
      if(depthMode==2){
       float proxyZ=texture2D(occlusionDepth,vUv).r;
       float matchDepth=1.-smoothstep(.02+distance*.004,.06+distance*.012,abs(distance-viewDistance(proxyZ)));
       if(proxyZ<.999999)b.rgb*=mix(1.,texture2D(occlusion,vUv).r,.58*matchDepth);
      }
     }
    }
    vec3 rgb=b.rgb;
    if(enhance>.5&&b.a>.0001){
     vec3 c=linearize(clamp(b.rgb/b.a,0.,1.));
     float luminance=dot(c,vec3(.2126,.7152,.0722));
     c=(mix(vec3(luminance),c,1.035)-.18)*1.025+.181;
     rgb=encode(clamp(c,0.,1.))*b.a;
    }
    float glowCoverage=clamp(max(g.r,max(g.g,g.b)),0.,1.);
    float coverage=b.a+(1.-b.a)*glowCoverage;
    gl_FragColor=vec4(min(rgb+g.rgb,vec3(coverage)),coverage);
   }`});
  this.output.textureID='unusedInput'; // Inputs are explicit base/glow, not a Composer readBuffer.
  this.output.material.toneMapped=false;this.output.material.transparent=true;this.output.material.blending=NoBlending;this.output.material.depthTest=false;this.output.material.depthWrite=false;this.output.renderToScreen=true;
  if(!bloom)return;
  this.mask??=this.texture();
  if(this.composer)return;
  const target=new WebGLRenderTarget(...this.bloomSize,{type:UnsignedByteType,depthBuffer:false});
  const composer=this.composer=new EffectComposer(this.renderer,target);composer.setPixelRatio(1);composer.setSize(...this.bloomSize);composer.renderToScreen=false;
  const seed=this.seed=new ShaderPass({uniforms:{tDiffuse:{value:null},mask:{value:null}},vertexShader,fragmentShader:'uniform sampler2D mask;varying vec2 vUv;void main(){gl_FragColor=texture2D(mask,vUv);}'});
  seed.material.toneMapped=false;seed.material.blending=NoBlending;
  // Nine taps per axis instead of the default25. Read convolution output directly;
  // final alpha-safe resolve owns intensity and compositing, not BloomPass's additive alpha.
  const pass=this.bloom=new BloomPass(1,9,1.3);composer.addPass(seed);composer.addPass(pass);
  for(const source of this.sources){
   let material:ShaderMaterial;
   if(source.kind==='water'&&source.mesh.material instanceof ShaderMaterial){
    const original=source.mesh.material;material=original.clone();
    material.uniforms=original.uniforms; // Same Runtime-owned animation clock; never mutate source uniforms.
    material.fragmentShader=material.fragmentShader.replace(/gl_FragColor=vec4\(water,[^;]+;/,'gl_FragColor=vec4(vec3(.22,.78,1.0),clamp(band*.8+drop*.18,0.,.85));');
   }else material=new ShaderMaterial({vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'void main(){gl_FragColor=vec4(.25,.85,.65,.8);}',transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
   material.depthWrite=false;material.depthTest=true;material.toneMapped=false;material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
   const mesh=new Mesh(source.mesh.geometry,material);mesh.matrixAutoUpdate=false;mesh.frustumCulled=true;mesh.renderOrder=20;this.maskScene.add(mesh);this.proxies.push({source,mesh});
  }
 }
 render(scene:Scene,camera:PerspectiveCamera,ndvi:boolean,visible:boolean,view?:DepthView){
  if(this.disposed)return;
  const r=this.renderer;r.info.autoReset=false;r.info.reset();r.setRenderTarget(null);r.setScissorTest(false);r.clear(true,true,true);
  const {bloom,enhance,depthOfField,ssao}=this.settings;
  const depthEffect=this.depth?.select(visible&&!ndvi&&!this.failed?view:undefined,camera,depthOfField,ssao)??null;
  const reason=!visible||!(bloom||enhance||depthOfField||ssao)?'disabled':ndvi?'ndvi':this.failed?'unavailable':!(bloom||enhance||depthEffect)?'view':null;
  if(visible&&!depthEffect)r.render(scene,camera);
  let sceneCalls=r.info.render.calls,sceneTriangles=r.info.render.triangles;
  let eligibleSources=0;
  if(!reason){
   const clearColor=depthEffect?r.getClearColor(new Color()):undefined;
   const clearAlpha=r.getClearAlpha(),autoClear=r.autoClear;
   try{
    if(depthEffect&&this.depth){
     const target=this.depth.renderColor(r,scene,camera);
     sceneCalls=r.info.render.calls;sceneTriangles=r.info.render.triangles;
     this.prepare(false,true);
     const output=this.output!;
     output.uniforms.base.value=target.texture;
     output.uniforms.glow.value=target.texture;
     output.uniforms.strength.value=0;
     output.uniforms.enhance.value=enhance?1:0;
     output.uniforms.sceneDepth.value=target.depthTexture;
     output.uniforms.clip.value.set(camera.near,camera.far);
     output.uniforms.pixel.value.set(1/this.width,1/this.height);
     if(depthEffect==='depthOfField'){
      const focus=this.depth.focus(camera,view!.reducedMotion);
      output.uniforms.depthMode.value=1;
      output.uniforms.focusDistance.value=focus.distance;
      output.uniforms.focusStrength.value=focus.strength;
     }else{
      const ao=this.depth.occlusion(r,camera);
      output.uniforms.depthMode.value=2;
      output.uniforms.occlusion.value=ao.color;
      output.uniforms.occlusionDepth.value=ao.depth;
     }
     output.render(r,null as never,null as never,0,false);
    }else{
    const activeSources=new Set<BloomSource>();
    if(this.settings.bloom){
     for(const source of this.sources){
      let enabled=source.enabled?.()??true;
      for(let object:import('three').Object3D|null=source.mesh;object&&enabled;object=object.parent)enabled=object.visible;
      if(enabled)activeSources.add(source);
     }
    }
    eligibleSources=activeSources.size;
    const bloomActive=eligibleSources>0;
    if(bloomActive||this.settings.enhance){
     this.prepare(bloomActive);
     this.copyFrame(this.base!);
     if(bloomActive){
      // Clear color only so opaque Three objects still occlude the emitters.
      r.clear(true,false,false);
      for(const {source,mesh} of this.proxies){
       mesh.visible=activeSources.has(source);
       if(mesh.visible)mesh.matrix.copy(source.mesh.matrixWorld);
      }
      r.render(this.maskScene,camera);this.copyFrame(this.mask!);
      this.seed!.uniforms.mask.value=this.mask;this.composer!.render(0);
     }
     const output=this.output!;
     output.uniforms.base.value=this.base;
     output.uniforms.glow.value=bloomActive?this.bloom!.renderTargetY.texture:this.base;
     output.uniforms.strength.value=bloomActive ? .45 : 0;
     output.uniforms.enhance.value=this.settings.enhance?1:0;
     output.uniforms.depthMode.value=0;
     output.render(r,null as never,null as never,0,false);
    }
    }
   }catch(error){
    this.failed=String(error);this.release();r.setRenderTarget(null);
    r.autoClear=autoClear;if(clearColor)r.setClearColor(clearColor,clearAlpha);
    r.clear(true,true,true);if(visible)r.render(scene,camera);
    sceneCalls=r.info.render.calls;sceneTriangles=r.info.render.triangles;
   }
  }
  this.view={...this.settings,active:!reason&&!this.failed,bypassReason:this.failed?'unavailable':reason,error:this.failed,depthEffect:this.failed?null:depthEffect,depthTargetId:this.failed?undefined:this.depth?.targetId,bloomSuspended:!!depthEffect&&bloom&&!this.failed,bloomSize:[...this.bloomSize],eligibleSources,sceneCalls,sceneTriangles,effectCalls:r.info.render.calls-sceneCalls,effectTriangles:r.info.render.triangles-sceneTriangles};
 }
 private release(){this.depth?.dispose();this.base?.dispose();this.mask?.dispose();this.composer?.dispose();this.seed?.dispose();this.bloom?.dispose();this.output?.dispose();for(const {mesh} of this.proxies)(mesh.material as ShaderMaterial).dispose();this.proxies.length=0;this.maskScene.clear();this.base=undefined;this.mask=undefined;this.composer=undefined;this.seed=undefined;this.bloom=undefined;this.output=undefined;}
 dispose(){if(this.disposed)return;this.disposed=true;this.release();}
}
