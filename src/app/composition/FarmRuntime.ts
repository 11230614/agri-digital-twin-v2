import { Color, EllipsoidTerrainProvider, SceneMode, Viewer } from 'cesium';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, WebGLRenderer } from 'three';
import type { CameraShot, SceneFacade, SceneSnapshot, RuntimeStatus } from '../ports/scene';
import type { SceneContent } from '../../rendering/SceneContent';
import { CALIBRATION_SHOTS } from '../../config/calibration-shots';
import { GeoReferenceAdapter } from '../../spatial/GeoReferenceAdapter';
import { CameraBridge } from '../../rendering/CameraBridge';
import { CameraController } from '../../rendering/CameraController';
import { MapLayerManager } from '../../rendering/MapLayerManager';
import { CALIBRATION_POINTS, createCalibrationScene } from '../../rendering/CalibrationScene';
import { FrameCoordinator } from './FrameCoordinator';
import {createLocalSky} from '../../rendering/LocalSky';
import {EntityPickInput} from '../../rendering/EntityPickInput';
import {EntityLabelLayer} from '../../rendering/EntityLabelLayer';
import {createDemoMonitoringSource} from '../../data/DemoMonitoringSource';

/** Stage 1–2 composition root. Agricultural ECS/services are added in their stages. */
export class FarmRuntime {
  private status:RuntimeStatus='idle';
  private startPromise?:Promise<void>;
  private generation=0;
  private disposedPromise?:Promise<void>;
  private readonly cleanup:(()=>void)[]=[];
  private readonly listeners=new Set<(state:SceneSnapshot)=>void>();
  private viewer?:Viewer;
  private renderer?:WebGLRenderer;
  private controller?:CameraController;
  private frames?:FrameCoordinator;
  private map?:MapLayerManager;
  private calibration?:SceneContent;
  private readonly shots:readonly CameraShot[];
  private focusInsets={left:0,right:0};
  private entityLabelsVisible=true;
  private localSky?:ReturnType<typeof createLocalSky>;
  private demo?:ReturnType<typeof createDemoMonitoringSource>;
  private snapshot:SceneSnapshot={runtime:'idle',map:{status:'loading',sourceId:'local-sentinel2',generation:0,offlineFallback:false},shotId:CALIBRATION_SHOTS[0].id,overlayVisible:true,surfacesVisible:true,viewport:{width:0,height:0,dpr:1},alignmentErrorPx:null,renderedFrames:0,threeDrawCalls:0,threeTriangles:0};
  private readonly facade:SceneFacade={
    setEnvironmentPreset:preset=>{
      if(this.status!=='running'&&this.status!=='paused')return;
      const environment=this.calibration?.environmentController;if(!environment)return;
      environment.set(preset);this.localSky?.setAppearance(environment.sky);
      if(this.viewer)this.viewer.scene.backgroundColor=Color.fromCssColorString(environment.sky.horizon);
      this.snapshot={...this.snapshot,appearance:environment.snapshot};this.publish();
    },
    setDataVisualPlot:id=>{this.calibration?.dataVisuals?.select(id);this.snapshot={...this.snapshot,dataVisual:this.calibration?.dataVisuals?.snapshot};this.publish();},
    setVegetationMode:mode=>{this.calibration?.dataVisuals?.setMode(mode);},
    setDemoScenario:(scenario,entityId)=>{this.demo?.setScenario(scenario,entityId??this.calibration?.dataVisuals?.snapshot.entityId);},
    setEntityLabelsVisible:visible=>{this.entityLabelsVisible=visible;},
    setFocusSafeInsets:insets=>{
      if(![insets.left,insets.right].every(v=>Number.isFinite(v)&&v>=0))throw new Error('无效HUD安全区域');
      this.focusInsets={...insets};
    },
    selectEntity:id=>{
      if(this.status!=='running'&&this.status!=='paused')return;
      const interaction=this.calibration?.interaction;if(!interaction)return;
      this.controller?.cancelFocus();interaction.select(id);if(id&&interaction.find(id)?.kind==='plot')this.facade.setDataVisualPlot(id);this.updateInteraction();this.publish();
    },
    focusEntity:(id,insets)=>{
      if(this.status!=='running')return;
      const interaction=this.calibration?.interaction,entity=interaction?.find(id);if(!entity)return;
      interaction!.select(id);if(entity.kind==='plot')this.facade.setDataVisualPlot(id);this.controller?.focusEntity(entity,insets??this.focusInsets);this.updateInteraction();this.publish();
    },
    setInspection:state=>{
      if(!Number.isFinite(state.doorRatio)||state.doorRatio<0||state.doorRatio>1)throw new Error('审阅门位须在0..1范围内');
      if(!this.calibration?.setInspection)return;
      const inspection=Object.freeze({doorRatio:state.doorRatio,cutaway:!!state.cutaway});
      this.calibration.setInspection(inspection);this.snapshot={...this.snapshot,inspection};this.publish();
    },
    subscribe:listener=>{this.listeners.add(listener);listener(this.snapshot);return()=>this.listeners.delete(listener);},
    setCameraShot:id=>{
      const shot=this.shots.find(shot=>shot.id===id);
      if(!shot)throw new Error(`未知镜头 ${id}`);
      if(this.status!=='running'&&this.status!=='paused')return;
      this.snapshot={...this.snapshot,shotId:id};
      if(shot.surfaceMode&&this.snapshot.inspection)this.facade.setInspection({doorRatio:this.snapshot.inspection.doorRatio,cutaway:shot.surfaceMode==='inspection-cutaway'});
      const {width,height}=this.snapshot.viewport;
      this.controller!.applyShot(shot,width,height);this.publish();
      this.calibration?.selectShot?.(id);
    },
    setOverlayVisible:visible=>{this.snapshot={...this.snapshot,overlayVisible:visible};this.publish();},
    setSurfacesVisible:visible=>{
      if(this.calibration)this.calibration.surfaces.visible=visible;
      this.snapshot={...this.snapshot,surfacesVisible:visible};this.publish();
    },
    retryMap:async()=>{await this.map?.load();},
    pause:()=>this.pause(),resume:()=>this.resume(),
  };
  constructor(private readonly host:HTMLElement,private readonly contentFactory:(renderer:WebGLRenderer)=>SceneContent=createCalibrationScene,shots:readonly CameraShot[]=CALIBRATION_SHOTS,private readonly renderOptions:{localNavigation?:boolean;imageryOnlyCesium?:boolean;cameraPath?:(timeS:number,width:number,height:number)=>CameraShot}={}) {
    if(!shots.length)throw new Error('镜头清单不能为空');
    this.shots=shots;this.snapshot={...this.snapshot,shotId:shots[0].id};
  }
  getFacade():SceneFacade {return this.facade;}
  getStatus():RuntimeStatus{return this.status;}
  private updateInteraction():void{
    const interaction=this.calibration?.interaction;if(!interaction)return;
    this.snapshot={...this.snapshot,interaction:{entities:interaction.entities,selectedId:interaction.selectedId,focusStatus:this.controller?.focusStatus??'idle',lastPick:{...interaction.lastPick}}};
  }
  private publish():void {
    this.snapshot=Object.freeze({...this.snapshot,runtime:this.status,viewport:Object.freeze({...this.snapshot.viewport}),map:Object.freeze({...this.snapshot.map})});
    for(const listener of this.listeners)listener(this.snapshot);
  }
  start():Promise<void> {
    if(this.status==='disposed'||this.status==='disposing'||this.status==='failed')return Promise.reject(new Error('请为新生命周期创建新的 Runtime'));
    if(this.startPromise)return this.startPromise;
    if(this.status!=='idle')return Promise.reject(new Error('请为新生命周期创建新的 Runtime'));
    this.status='starting';this.publish();
    const generation=++this.generation;
    this.startPromise=this.initialize(generation);
    return this.startPromise;
  }
  private async initialize(generation:number):Promise<void> {
    try {
      // Dedicated children are the only DOM nodes owned and removed by this Runtime.
      const cesiumHost=document.createElement('div');cesiumHost.className='cesium-host';
      const overlay=document.createElement('canvas');overlay.className='three-overlay';
      overlay.setAttribute('aria-hidden','true');
      this.host.append(cesiumHost,overlay);
      this.cleanup.push(()=>{cesiumHost.remove();overlay.remove();});
      const viewer=this.viewer=new Viewer(cesiumHost,{
        baseLayer:false,terrainProvider:new EllipsoidTerrainProvider(),
        // Raster-only bottom canvas has no 3D edges/translucent assets to multisample.
        msaaSamples:this.renderOptions.imageryOnlyCesium?1:4,
        contextOptions:{webgl:{antialias:!this.renderOptions.imageryOnlyCesium}},
        orderIndependentTranslucency:!this.renderOptions.imageryOnlyCesium,
        sceneMode:SceneMode.SCENE3D,scene3DOnly:true,
        animation:false,timeline:false,geocoder:false,homeButton:false,sceneModePicker:false,
        baseLayerPicker:false,navigationHelpButton:false,fullscreenButton:false,
        selectionIndicator:false,infoBox:false,skyBox:false,skyAtmosphere:false,
        useBrowserRecommendedResolution:false,requestRenderMode:false,
      });
      this.cleanup.push(()=>{if(!viewer.isDestroyed())viewer.destroy();this.viewer=undefined;});
      viewer.scene.globe.baseColor=Color.fromCssColorString('#172521');
      viewer.scene.backgroundColor=Color.fromCssColorString('#172521');
      viewer.scene.globe.enableLighting=false;
      if(viewer.scene.sun)viewer.scene.sun.show=false;
      if(viewer.scene.moon)viewer.scene.moon.show=false;
      const renderer=this.renderer=new WebGLRenderer({canvas:overlay,alpha:true,antialias:true});
      this.cleanup.push(()=>{renderer.dispose();renderer.forceContextLoss();this.renderer=undefined;});
      renderer.setClearColor(0,0);renderer.autoClear=false;
      renderer.outputColorSpace=SRGBColorSpace;renderer.toneMapping=ACESFilmicToneMapping;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFSoftShadowMap;
      const geo=new GeoReferenceAdapter();
      const bridge=new CameraBridge(geo);
      const calibration=this.calibration=this.contentFactory(renderer);
      this.cleanup.push(()=>{calibration.dispose();this.calibration=undefined;});
      if(calibration.dataVisuals){
        const demo=this.demo=createDemoMonitoringSource();
        const stop=demo.start(monitoring=>{calibration.dataVisuals!.apply(monitoring);this.snapshot={...this.snapshot,monitoring};this.publish();});
        this.cleanup.push(()=>{stop();this.demo=undefined;});
      }
      const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
      if(calibration.skyColor)viewer.scene.backgroundColor=Color.fromCssColorString(calibration.skyColor);
      if(calibration.sky){const sky=this.localSky=createLocalSky(viewer.scene,geo,calibration.sky);this.cleanup.push(()=>{sky.dispose();this.localSky=undefined;});}
      this.snapshot={...this.snapshot,environment:calibration.environment,appearance:calibration.environmentController?.snapshot};
      if(calibration.setInspection){const inspection=Object.freeze({doorRatio:0,cutaway:false});calibration.setInspection(inspection);this.snapshot={...this.snapshot,inspection};}
      const controller=this.controller=new CameraController(viewer,geo,this.shots[0],this.renderOptions.localNavigation);
      this.cleanup.push(()=>controller.dispose());
      const labels=calibration.interaction?new EntityLabelLayer(this.host,calibration.interaction.entities,{
        select:id=>this.facade.selectEntity(id),focus:id=>this.facade.focusEntity(id),enabled:()=>this.status==='running'&&this.snapshot.overlayVisible,
      }):undefined;
      if(labels)this.cleanup.push(()=>labels.dispose());
      if(calibration.interaction){
        this.updateInteraction();
        const interrupt=()=>controller.cancelFocus();viewer.canvas.addEventListener('pointerdown',interrupt);
        this.cleanup.push(()=>viewer.canvas.removeEventListener('pointerdown',interrupt));
        const picking=new EntityPickInput(viewer.canvas,(x,y,double)=>{
          bridge.sync(viewer.camera);
          const id=calibration.interaction!.pick(x,y,bridge.camera);
          this.facade.selectEntity(id);if(double&&id)this.facade.focusEntity(id);
        },()=>this.status==='running'&&this.snapshot.overlayVisible);
        this.cleanup.push(()=>picking.dispose());
      }
      let viewportDirty=true;
      const resize=()=>{
        const width=Math.max(1,this.host.clientWidth),height=Math.max(1,this.host.clientHeight);
        const dpr=Math.min(window.devicePixelRatio||1,1.5);
        renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);
        viewer.resolutionScale=dpr/(window.devicePixelRatio||1);
        viewer.resize();controller.setFrustum(width,height);
        this.snapshot={...this.snapshot,viewport:{width,height,dpr}};
        viewportDirty=false;
      };
      const observer=new ResizeObserver(()=>{viewportDirty=true;});observer.observe(this.host);
      this.cleanup.push(()=>observer.disconnect());
      resize();controller.applyShot(this.shots[0],this.host.clientWidth,this.host.clientHeight);
      calibration.selectShot?.(this.shots[0].id);
      const map=this.map=new MapLayerManager(viewer,state=>{this.snapshot={...this.snapshot,map:state};this.publish();});
      this.cleanup.push(()=>{map.dispose();this.map=undefined;});
      let lastPublish=0;
      const frames=this.frames=new FrameCoordinator(viewer.scene,(_dt,time)=>{
        if(viewportDirty || this.snapshot.viewport.dpr!==Math.min(window.devicePixelRatio||1,1.5))resize();
        if(this.renderOptions.cameraPath){const {width,height}=this.snapshot.viewport;controller.applyShot(this.renderOptions.cameraPath(time,width,height),width,height);}
        controller.advanceFocus(_dt);
        controller.enforceLocalPolicy();
        calibration.advanceVisual?.(document.hidden?0:_dt,Date.now(),reducedMotion.matches);
      },()=>{
        if(generation!==this.generation)return;
        bridge.sync(viewer.camera);
        calibration.scene.updateMatrixWorld(true);
        calibration.prepareRender?.(bridge.camera,this.snapshot.viewport.height);
        renderer.setRenderTarget(null);renderer.setScissorTest(false);
        renderer.clear(true,true,true);
        if(this.snapshot.overlayVisible)renderer.render(calibration.scene,bridge.camera);
        labels?.render(bridge.camera,this.snapshot.viewport.width,this.snapshot.viewport.height,calibration.interaction?.selectedId??null,this.entityLabelsVisible&&this.snapshot.overlayVisible);
        this.snapshot={...this.snapshot,renderedFrames:this.snapshot.renderedFrames+1};
        if(performance.now()-lastPublish>250){
          lastPublish=performance.now();
          const {width,height}=this.snapshot.viewport;
          if(calibration.interaction)this.updateInteraction();
          this.snapshot={...this.snapshot,dataVisual:calibration.dataVisuals?.snapshot,plotVisuals:calibration.dataVisuals?.snapshots,navigation:controller.navigationState,alignmentErrorPx:bridge.measureScreenError(viewer.scene,CALIBRATION_POINTS,width,height),camera:{rightM:bridge.camera.matrixWorld.elements.slice(0,3) as [number,number,number],positionM:bridge.camera.position.toArray() as [number,number,number],fovDeg:bridge.camera.fov,nearM:bridge.camera.near,farM:bridge.camera.far},threeDrawCalls:this.snapshot.overlayVisible?renderer.info.render.calls:0,threeTriangles:this.snapshot.overlayVisible?renderer.info.render.triangles:0};
          this.publish();
        }
      });
      this.cleanup.push(()=>{frames.dispose();this.frames=undefined;});
      this.cleanup.push(viewer.scene.renderError.addEventListener((_scene,error)=>{
        this.status='failed';++this.generation;
        this.snapshot={...this.snapshot,error:String(error)};this.publish();
        // Leave Cesium's render stack before destroying its resources.
        queueMicrotask(()=>this.releaseResources());
      }));
      // Map loading failure is diagnostic, not a fake map success or a model failure.
      await map.load();
      if(generation!==this.generation)return;
      this.status='running';this.publish();
    } catch(error) {
      if(generation!==this.generation)return;
      this.status='failed';this.snapshot={...this.snapshot,error:error instanceof Error?error.message:String(error)};
      this.releaseResources();this.publish();throw error;
    }
  }
  pause():void {
    if(this.status!=='running')return;
    this.status='paused';this.frames?.setPaused(true);
    if(this.viewer)this.viewer.scene.screenSpaceCameraController.enableInputs=false;
    this.publish();
  }
  resume():void {
    if(this.status!=='paused')return;
    this.status='running';this.frames?.setPaused(false);
    if(this.viewer)this.viewer.scene.screenSpaceCameraController.enableInputs=true;
    this.publish();
  }
  private releaseResources():void {
    const errors:unknown[]=[];
    for(const dispose of this.cleanup.reverse().splice(0))try{dispose();}catch(error){errors.push(error);}
    if(errors.length)this.snapshot={...this.snapshot,error:`资源释放异常：${errors.map(String).join('; ')}`};
    this.controller=undefined;
  }
  dispose():Promise<void> {
    if(this.disposedPromise)return this.disposedPromise;
    this.status='disposing';++this.generation;this.publish();
    this.releaseResources();this.status='disposed';this.publish();this.listeners.clear();
    return this.disposedPromise=Promise.resolve();
  }
}

