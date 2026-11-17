import type {Group} from 'three';
import type {MonitoringSnapshot,PlotReading} from '../data/DemoMonitoringSource';
import type {DataVisualSnapshot,VegetationMode} from '../app/ports/data-visual';
import type {createNdviRasterVisualization} from './NdviRasterVisualization';
import type {createIrrigationFlow} from './IrrigationFlow';
/** Derived visual policy only; Runtime's demo source owns observed telemetry. */
export class PlotDataVisuals {
 private reading?:PlotReading;private mode:VegetationMode='natural';private phase=0;private time=0;
 private view:DataVisualSnapshot={entityId:'plot-02',mode:'natural',ndvi:null,ndviColor:'#8a9ca0',quality:'unknown',flowVisible:false,flowPhase:0,flowStatus:'未知',flowM3h:null,reducedMotion:false,extraDrawCalls:0,flowTriangles:0};
 constructor(private color:ReturnType<typeof createNdviRasterVisualization>,private flow:ReturnType<typeof createIrrigationFlow>,private valve:Group,readonly entityId='plot-02'){this.view={...this.view,entityId};}
 apply(snapshot:MonitoringSnapshot){this.reading=snapshot.plots.find(p=>p.id===this.entityId);if(this.reading?.ndvi.raster){if(this.reading.ndvi.raster.entityId!==this.entityId)throw new Error('NDVI栅格实体不匹配');this.color.apply(this.reading.ndvi.raster);}}
 setMode(mode:VegetationMode){if(mode!=='natural'&&mode!=='ndvi')throw new Error('未知植被显示模式');this.mode=mode;}
 update(dt:number,now:number,reducedMotion:boolean){
  const p=this.reading,expired=(timestamp:number)=>!Number.isFinite(timestamp)||now-timestamp>18000||timestamp-now>6000;
  const telemetryGood=p?.quality==='good'&&!expired(p.timestamp),ndvi=p?.ndvi;
  const quality=ndvi?.quality==='stale'||ndvi?.raster?.quality==='stale'||ndvi&&expired(ndvi.timestamp)||ndvi?.raster&&expired(ndvi.raster.timestamp)?'stale':ndvi?.raster?.quality==='good'&&ndvi?.quality==='good'&&ndvi.value!==null&&Number.isFinite(ndvi.value)&&ndvi.value>=-1&&ndvi.value<=1?'good':'unknown';
  const value=quality==='good'?ndvi!.value:null;this.color.set(this.mode,value);
  const flowValid=telemetryGood&&Number.isFinite(p!.flowM3h)&&p!.flowM3h>0&&p!.status==='灌溉中';
  if(flowValid&&!reducedMotion)this.phase=(this.phase+Math.max(0,Math.min(.05,dt))*Math.min(2,p!.flowM3h/1.8*.36))%2.4;
  if(flowValid&&!reducedMotion)this.time=(this.time+Math.max(0,Math.min(.05,dt)))%(Math.PI*2*100);
  this.flow.update(this.phase,!!flowValid,this.time);
  // Missing telemetry freezes the last observed valve pose; it does not imply closed.
  const previous=this.valve.rotation.y;
  if(telemetryGood)this.valve.rotation.y=p!.status==='灌溉中'?0:Math.PI/2;
  this.view={entityId:this.entityId,mode:this.mode,ndvi:value,ndviColor:this.color.color,quality,raster:ndvi?.raster?{width:ndvi.raster.width,height:ndvi.raster.height,revision:ndvi.raster.revision,uploads:this.color.uploads}:undefined,flowVisible:!!flowValid,flowPhase:this.phase,flowStatus:!telemetryGood?(p?.quality==='stale'||p&&expired(p.timestamp)?'数据过期':'数据缺失'):p!.status,flowM3h:telemetryGood?p!.flowM3h:null,reducedMotion,extraDrawCalls:(flowValid?1:0)+(this.mode==='ndvi'?1:0),flowTriangles:this.flow.triangles};
  return previous!==this.valve.rotation.y;
 }
 get snapshot(){return {...this.view};}
}

