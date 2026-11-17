import {deriveMonitoringAlerts,type MonitoringAlert} from './MonitoringAlerts';
import {PARK_LAYOUT} from '../config/park-layout';
import {createDemoNdviRaster} from './DemoNdviRaster';
import {rasterMean,type NdviRaster} from './NdviRaster';
export type DemoScenario='running'|'standby'|'fault'|'missing'|'stale';
export interface NdviReading {readonly value:number|null;readonly timestamp:number;readonly quality:'good'|'unknown'|'stale';readonly sourceId:'demo-ndvi-v1';readonly history:readonly number[];readonly raster?:NdviRaster;}
export interface PlotReading {readonly id:string;readonly name:string;readonly scenario?:DemoScenario;readonly timestamp:number;readonly quality:'good'|'unknown'|'stale';readonly ndvi:NdviReading;readonly moisture:number;readonly completedM3:number;readonly plannedM3:number;readonly flowM3h:number;readonly status:'灌溉中'|'待机'|'故障'|'未知';}
export interface GreenhouseReading {readonly id:string;readonly name:string;readonly temperature:number;readonly humidity:number;readonly co2:number;}
export interface MonitoringSnapshot {readonly alerts?:readonly MonitoringAlert[];readonly mode:'demo';readonly scenario:DemoScenario;readonly sourceId:'park-demo-v1';readonly timestamp:number;readonly temperature:number;readonly humidity:number;readonly wind:number;readonly light:number;readonly plots:readonly PlotReading[];readonly greenhouses:readonly GreenhouseReading[];readonly history:readonly number[];}
/** Sole observed demo source, owned by Runtime. Scenario selection is simulation, not device control. */
export function createDemoMonitoringSource(){
 let timer:ReturnType<typeof setInterval>|undefined,listener:((snapshot:MonitoringSnapshot)=>void)|undefined;
 let tick=0,revision=0,scenario:DemoScenario='running',lastTime=0;
 const history:number[]=[];let alerts:readonly MonitoringAlert[]=[];
 const profiles=[{id:'plot-01',name:'一号田块',initial:8.6,flow:1.5,moisture:66},{id:'plot-02',name:'二号田块',initial:6.8,flow:1.8,moisture:62},{id:'plot-03',name:'三号田块',initial:3.2,flow:1.2,moisture:48}];
 const states=new Map(profiles.map(p=>[p.id,{completed:p.initial,lastFlow:0,scenario:'running' as DemoScenario,history:[] as number[]}]));
 const integrate=(now:number)=>{for(const state of states.values())state.completed=Math.min(12,state.completed+Math.max(0,now-lastTime)*state.lastFlow/3600000);lastTime=now;};
 const sample=(now:number,record=true):MonitoringSnapshot=>{
  integrate(now);
  const wave=Math.sin(tick/9),temperature=+(24.6+wave*.5).toFixed(1);++revision;
  if(record){history.push(temperature);if(history.length>30)history.shift();}
  const snapshot:MonitoringSnapshot={mode:'demo',scenario,sourceId:'park-demo-v1',timestamp:now,temperature,humidity:Math.round(64+wave*2),wind:+(2.1+wave*.3).toFixed(1),light:Math.round(32800+wave*1200),
   plots:PARK_LAYOUT.plots.map(plot=>{
    const profile=profiles.find(p=>p.id===plot.id)!;const state=states.get(plot.id)!,selected=state.scenario;
    const quality=selected==='missing'?'unknown':selected==='stale'?'stale':'good',timestamp=quality==='stale'?now-60000:now;
    const raster=createDemoNdviRaster(timestamp,revision,quality,wave,plot.id),ndvi=rasterMean(raster);
    if(record&&quality==='good'&&ndvi!==null){state.history.push(ndvi);if(state.history.length>30)state.history.shift();}
    const running=selected==='running'&&state.completed<12;state.lastFlow=running?profile.flow:0;
    return {id:plot.id,name:profile.name,scenario:selected,timestamp,quality,ndvi:{value:quality==='unknown'?null:ndvi,timestamp,quality,sourceId:'demo-ndvi-v1',raster,history:[...state.history]},moisture:+(profile.moisture+wave*.8).toFixed(1),completedM3:state.completed,plannedM3:12,flowM3h:state.lastFlow,status:quality!=='good'?'未知':selected==='fault'?'故障':running?'灌溉中':'待机'};
   }),
   greenhouses:PARK_LAYOUT.greenhouses.map((p,i)=>({id:p.id,name:['一号温室','二号温室','三号温室'][i],temperature:+(25.2+i*.6+wave*.3).toFixed(1),humidity:Math.round(68+i*2+wave),co2:Math.round(650+i*35+wave*12)})),history:[...history]};
  alerts=deriveMonitoringAlerts(snapshot.plots,now,alerts);return {...snapshot,alerts};
 };
 return {
  start(next:(snapshot:MonitoringSnapshot)=>void){if(timer)throw new Error('监测源已启动');listener=next;tick=0;scenario='running';lastTime=Date.now();history.length=0;alerts=[];for(const p of profiles){const s=states.get(p.id)!;s.completed=p.initial;s.lastFlow=0;s.scenario='running';s.history.length=0;}listener(sample(lastTime));timer=setInterval(()=>{tick++;listener?.(sample(Date.now()));},6000);return()=>{clearInterval(timer);timer=undefined;listener=undefined;};},
  setScenario(value:DemoScenario,entityId='plot-02'){if(!['running','standby','fault','missing','stale'].includes(value))throw new Error('未知模拟情景');const state=states.get(entityId);if(!state)throw new Error('未知模拟田块');if(!listener)return;const now=Date.now();integrate(now);state.lastFlow=0;state.scenario=value;scenario=value;listener(sample(now,false));},
 };
}
