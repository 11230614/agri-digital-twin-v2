import type {MonitoringSnapshot} from '../data/DemoMonitoringSource';
import type {VegetationMode} from '../app/ports/data-visual';
import {PlotDataVisuals} from './PlotDataVisuals';
/** One policy per entity. Global analysis mode, independently observed irrigation. */
export class PlotDataVisualCollection {
 private entries=new Map<string,PlotDataVisuals>();private active='plot-02';
 add(visual:PlotDataVisuals){if(this.entries.has(visual.entityId))throw new Error('重复田块表现');this.entries.set(visual.entityId,visual);}
 select(id:string){if(!this.entries.has(id))throw new Error('未知数据田块');this.active=id;}
 apply(snapshot:MonitoringSnapshot){for(const entry of this.entries.values())entry.apply(snapshot);}
 setMode(mode:VegetationMode){for(const entry of this.entries.values())entry.setMode(mode);}
 update(dt:number,now:number,reduced:boolean){let changed=false;for(const entry of this.entries.values())if(entry.update(dt,now,reduced))changed=true;return changed;}
 get snapshot(){return this.entries.get(this.active)!.snapshot;}
 get snapshots(){return [...this.entries.values()].map(e=>e.snapshot);}
}
