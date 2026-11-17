import type {PlotReading} from './DemoMonitoringSource';
export interface MonitoringAlert {readonly id:string;readonly entityId:string;readonly title:string;readonly description:string;readonly level:'warning';readonly timestamp:number;readonly status:'active';readonly sourceId:'demo-soil-rule-v1';readonly mode:'demo'}
/** Derived only from fresh observed moisture. IDs are stable across refreshes. */
export function deriveMonitoringAlerts(plots:readonly PlotReading[],now:number,previous:readonly MonitoringAlert[]=[]):readonly MonitoringAlert[]{
 return plots.filter(p=>p.quality==='good'&&Number.isFinite(p.timestamp)&&now-p.timestamp<=18000&&p.timestamp-now<=6000&&Number.isFinite(p.moisture)&&p.moisture<50).map(p=>{
  const id=`moisture-low:${p.id}`;return {id,entityId:p.id,title:`${p.name} · 土壤偏干`,description:`湿度 ${p.moisture}%，低于演示阈值50%。建议检查墒情与供水。`,level:'warning',timestamp:previous.find(a=>a.id===id)?.timestamp??now,status:'active',sourceId:'demo-soil-rule-v1',mode:'demo'};
 });
}
