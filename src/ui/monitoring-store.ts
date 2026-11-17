import {defineStore} from 'pinia';
import {shallowRef} from 'vue';
import type {MonitoringSnapshot} from '../data/DemoMonitoringSource';
/** Only the mounted monitoring source publishes observed demo snapshots. */
export const useMonitoringStore=defineStore('park-monitoring',()=>{
 const snapshot=shallowRef<MonitoringSnapshot>();
 return {snapshot,project:(value:MonitoringSnapshot)=>{snapshot.value=value;},reset:()=>{snapshot.value=undefined;}};
});
