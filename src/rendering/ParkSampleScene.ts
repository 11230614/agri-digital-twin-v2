import {Box3,CircleGeometry,CylinderGeometry,DirectionalLight,Fog,Group,HemisphereLight,Mesh,Scene,ShadowMaterial,Vector3,type WebGLRenderer} from 'three';
import {EnvironmentController} from './EnvironmentController';
import {CONTROLLER_BINDINGS,WEATHER_BINDINGS,GREENHOUSE_NAMES} from '../config/interaction-bindings';
import {EntityInteraction} from './EntityInteraction';
import {createNdviRasterVisualization} from './NdviRasterVisualization';
import {createIrrigationFlow} from './IrrigationFlow';
import {PlotDataVisualCollection} from './PlotDataVisualCollection';
import {PlotDataVisuals} from './PlotDataVisuals';
import type {SceneContent} from './SceneContent';
import type {Vec3} from '../shared/contracts/spatial';
import {PARK_LAYOUT} from '../config/park-layout';
import {FrameRegistry} from '../spatial/FrameRegistry';
import {createEntityNodes,TransformSync,type EntityNodes} from './EntityNodes';
import {createFarmPalette} from './assets/farmPalette';
import {createDaylightEnvironment} from './assets/daylightEnvironment';
import {createGreenhouse} from './assets/greenhouse';
import {createGreenhouseCanopy} from './assets/greenhouseCanopy';
import {createGreenhouseTomatoes} from './assets/greenhouseTomatoes';
import {createField} from './assets/field';
import {createSolarTable} from './assets/solarTable';
import {createWeatherStation,createSoilSensor} from './assets/instruments';
import {createController,createIrrigation} from './assets/irrigation';
import {createTree} from './assets/tree';
import {createPartitionedSurface} from './assets/partitionedSurface';
import {batchStatic} from './assets/batchStatic';
import {createAssetLod} from './assets/assetLod';
import {parkSurfaceRects} from './assets/parkSurface';
import {createSurroundingMountains} from './assets/surroundingMountains';
import {PARK_ENVIRONMENT,PARK_ATMOSPHERE} from '../config/park-environment';

/** Static multi-asset layout review. Shares the one runtime clock; not the final ECS integration. */
export type ParkQuality='reference'|'balanced';
export function createParkSampleScene(renderer:WebGLRenderer,quality:ParkQuality='reference',surroundings=true,atmosphere=true):SceneContent{
 const balanced=quality==='balanced';
 const scene=new Scene();scene.background=null;scene.matrixWorldAutoUpdate=false;const release:(()=>void)[]=[];let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const f of release.reverse())f();scene.clear();};
 try{
  const palette=createFarmPalette(balanced);release.push(()=>palette.dispose());
  const interaction=new EntityInteraction();scene.add(interaction.root);release.push(()=>interaction.dispose());
  const environment=createDaylightEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.6;release.push(()=>{scene.environment=null;environment.dispose();});
  const hemi=new HemisphereLight(0xdcecf7,0x90805f,2.6);scene.add(hemi);
  const sun=new DirectionalLight(0xffefd5,3);sun.castShadow=true;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;sun.shadow.mapSize.set(balanced?2048:4096,balanced?2048:4096);sun.shadow.bias=-.00005;sun.shadow.normalBias=.012;scene.add(sun,sun.target);release.push(()=>sun.shadow.dispose());
  const frames=new FrameRegistry(),sync=new TransformSync(frames);
  const install=(id:string,visual:Group,positionM:Vec3,parent?:EntityNodes,parentFrame='FarmWorld')=>{
   const nodes=createEntityNodes(id);nodes.visual.add(visual);(parent?.visual??scene).add(nodes.root);
   frames.register({frameId:id,parentFrameId:parentFrame,localPosition:positionM,localQuaternion:[0,0,0,1],ownerId:id});sync.apply(nodes,id,parentFrame);return nodes;
  };
  const terrain=createPartitionedSurface(parkSurfaceRects(),{road:palette.road,path:palette.greenhouse.floor,soil:palette.greenhouse.soil,grass:palette.grass});release.push(()=>terrain.dispose());
  const surfaces=new Group();surfaces.name='local-designed-surfaces';surfaces.add(terrain.root);scene.add(surfaces);
  const lods:ReturnType<typeof createAssetLod>[]=[],greenhouses:PReturn[]=[],canopies:ReturnType<typeof createGreenhouseCanopy>[]=[],fields:ReturnType<typeof createField>[]=[];
  const dataVisuals=new PlotDataVisualCollection();let environmentController:EnvironmentController|undefined;
  const dynamicRoots:Group[]=[];
  type PReturn=ReturnType<typeof createGreenhouse>;
  for(const entry of PARK_LAYOUT.greenhouses){
   const variants=Object.fromEntries((['near','mid','far'] as const).map(q=>{const gh=createGreenhouse(palette.greenhouse,q);release.push(()=>gh.dispose());const batch=batchStatic(gh.root,[...gh.doors,...gh.rotors]);release.push(()=>batch.dispose());greenhouses.push(gh);return[q,gh.root];})) as Record<'near'|'mid'|'far',Group>;
   const lod=createAssetLod(variants,new Vector3(0,3.5,-14),30,700,240);lods.push(lod);
   const crop=createGreenhouseCanopy(palette.crop,{cullOffscreen:true,distantMaterial:palette.cropDistant}),tomatoes=createGreenhouseTomatoes(palette.tomatoes);release.push(()=>crop.dispose(),()=>tomatoes.dispose());
   const wrapper=new Group();wrapper.add(lod.root,crop.root,tomatoes.root);install(entry.id,wrapper,entry.positionM);canopies.push(crop);
   wrapper.updateWorldMatrix(true,true);interaction.register({id:entry.id,kind:'greenhouse',name:GREENHOUSE_NAMES[entry.id],box:new Box3().setFromObject(wrapper),minimumDistanceM:22,focusYawRad:0,focusPitchRad:Math.PI/6});
  }
  for(const entry of PARK_LAYOUT.plots){
   const field=createField({soil:palette.greenhouse.soil,leaf:palette.crop},undefined,palette.cropDistant),pipes=createIrrigation(palette.utilities,.135,true);release.push(()=>field.dispose(),()=>pipes.dispose());
   const nodes=install(entry.id,field.root,entry.positionM);install(`${entry.id}:irrigation`,pipes.root,[0,0,0],nodes,entry.id);fields.push(field);
   interaction.register({id:entry.id,kind:'plot',name:({'plot-01':'一号田块','plot-02':'二号田块','plot-03':'三号田块'} as Record<string,string>)[entry.id],box:new Box3(new Vector3(entry.positionM[0]-14,0,entry.positionM[2]-16),new Vector3(entry.positionM[0]+14,.42,entry.positionM[2]+16)),minimumDistanceM:12});
   {
    const color=createNdviRasterVisualization(field),flow=createIrrigationFlow(pipes.network);
    nodes.visual.add(color.root,flow.root);dynamicRoots.push(color.root,flow.root,pipes.bindings['valve.handle']);
    release.push(()=>color.dispose(),()=>flow.dispose());dataVisuals.add(new PlotDataVisuals(color,flow,pipes.bindings['valve.handle'],entry.id));
   }
  }
  const group=install(PARK_LAYOUT.solarGroup.id,new Group(),PARK_LAYOUT.solarGroup.positionM),table=createSolarTable(palette.tables);release.push(()=>table.dispose());
  for(const entry of PARK_LAYOUT.solarTables)install(entry.id,table.root.clone(true),entry.positionM,group,PARK_LAYOUT.solarGroup.id);
  for(const entry of PARK_LAYOUT.weather){const asset=createWeatherStation({...palette.utilities,indicator:palette.utilities.handle});release.push(()=>asset.dispose());const nodes=install(entry.id,asset.root,entry.positionM);nodes.root.updateWorldMatrix(true,true);const binding=WEATHER_BINDINGS[entry.id];interaction.register({id:entry.id,kind:'weather-station',name:binding.name,box:new Box3().setFromObject(nodes.root).expandByScalar(.04),minimumDistanceM:8,focusYawRad:.4,focusPitchRad:.25});}
  for(const entry of PARK_LAYOUT.controllers){const asset=createController(palette.utilities);release.push(()=>asset.dispose());const nodes=install(entry.id,asset.root,entry.positionM);nodes.root.updateWorldMatrix(true,true);const binding=CONTROLLER_BINDINGS[entry.id];interaction.register({id:entry.id,kind:'controller',name:binding.name,ownerId:binding.plotId,box:new Box3().setFromObject(nodes.root).expandByScalar(.025),minimumDistanceM:3,focusYawRad:0,focusPitchRad:.25});}
  for(const entry of PARK_LAYOUT.sensors){const asset=createSoilSensor({...palette.utilities,indicator:palette.utilities.handle});release.push(()=>asset.dispose());const nodes=install(entry.id,asset.root,entry.positionM);if(entry.id==='plot-02:sensor-02'){nodes.root.updateWorldMatrix(true,true);const box=new Box3().setFromObject(nodes.root).expandByScalar(.015);interaction.register({id:entry.id,kind:'soil-sensor',name:'二号田块 · 土壤探头02',ownerId:'plot-02',box,minimumDistanceM:2.4});}}
  const trees=Object.fromEntries((['near','mid','far'] as const).map(q=>{const tree=createTree(q==='near'?palette.trees:{...palette.trees,leaf:palette.treeDistant},17,q);release.push(()=>tree.dispose());return[q,tree];})) as Record<'near'|'mid'|'far',ReturnType<typeof createTree>>;
  const patch=new CircleGeometry(4,32),shadowReceiver=new ShadowMaterial({color:0x263021,opacity:.26,depthWrite:false});patch.rotateX(-Math.PI/2);release.push(()=>patch.dispose(),()=>shadowReceiver.dispose());
  for(const entry of PARK_LAYOUT.trees){const lod=createAssetLod({near:trees.near.root.clone(true),mid:trees.mid.root.clone(true),far:trees.far.root.clone(true)},new Vector3(0,4,0),8,150,45);lods.push(lod);install(entry.id,lod.root,entry.positionM);const local=new Mesh(patch,shadowReceiver);local.position.fromArray(entry.positionM);local.receiveShadow=true;surfaces.add(local);}
  const postGeometry=new CylinderGeometry(.03,.03,.35,8);release.push(()=>postGeometry.dispose());
  for(const entry of PARK_LAYOUT.plots)for(const x of [-13.7,13.7])for(const z of [-15.7,15.7]){const post=new Mesh(postGeometry,palette.utilities.metal);post.position.set(entry.positionM[0]+x,.175,entry.positionM[2]+z);post.castShadow=true;scene.add(post);}
  const selectShot=(id:string)=>{
   // A single global sun direction. Only shadow coverage follows the authored viewing zone.
   const focus=id==='CAM-02'||id==='CAM-04'?new Vector3(54,0,-69):id==='CAM-03'?new Vector3(43,0,-18):id==='CAM-05'?new Vector3(54,0,-29):new Vector3(54,0,-45);
   sun.target.position.copy(focus);if(environmentController)environmentController.positionSun();else sun.position.copy(focus).add(new Vector3(-80,110,60));
   const extent=id==='CAM-01'||id==='ENV-01'?91:id==='CAM-03'?8:26;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:.1,far:300});sun.shadow.normalBias=id==='CAM-03'?.003:.012;sun.shadow.camera.updateProjectionMatrix();sun.shadow.needsUpdate=true;
  };
  // Static infrastructure is batched within its own entity root; moving mechanisms stay independent.
  for(const child of scene.children){if(child instanceof Group&&child!==surfaces&&child!==interaction.root&&!PARK_LAYOUT.greenhouses.some(e=>child.name.includes(e.id))&&!PARK_LAYOUT.trees.some(e=>child.name.includes(e.id))){const batch=batchStatic(child,dynamicRoots);release.push(()=>batch.dispose());}}

  const mountains=surroundings?createSurroundingMountains():undefined;if(mountains){scene.add(mountains.root);release.push(()=>mountains.dispose());}
  const sky=surroundings?(atmosphere?PARK_ATMOSPHERE:PARK_ENVIRONMENT.sky):undefined;
  if(surroundings&&atmosphere){const fog=PARK_ATMOSPHERE.fog!;scene.fog=new Fog(fog.color,fog.nearM,fog.farM);release.push(()=>{scene.fog=null;});}
  if(surroundings&&atmosphere)environmentController=new EnvironmentController(scene,sun,hemi,{tree:[palette.trees.leaf,palette.treeDistant],grass:palette.grass,mountain:mountains?.material});
  selectShot('CAM-01');
  return{scene,surfaces,interaction,dataVisuals,environmentController,advanceVisual:(dt,now,reduced)=>{if(dataVisuals?.update(dt,now,reduced))sun.shadow.needsUpdate=true;},skyColor:sky?.horizon??'#c6deea',sky,environment:mountains?{candidateId:atmosphere?'atmosphere-candidate-02':PARK_ENVIRONMENT.id,mountainTriangles:mountains.triangles,sky:true,fog:atmosphere}:undefined,selectShot,setInspection:state=>{for(const gh of greenhouses)gh.setInspection(state.doorRatio,state.cutaway);sun.shadow.needsUpdate=true;},prepareRender:(camera,height)=>{let changed=false;for(const lod of lods)if(lod.prepare(camera,height))changed=true;for(const crop of canopies)if(crop.prepare(camera,height))changed=true;for(const field of fields)if(field.prepare(camera,height))changed=true;if(changed)sun.shadow.needsUpdate=true;},dispose};
 }catch(error){dispose();throw error;}
}


