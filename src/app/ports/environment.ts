/** Presentation-only demo presets. Never device telemetry or the real clock. */
export type Season='spring'|'summer'|'autumn'|'winter';
export type DayPeriod='day'|'dusk'|'night';
export interface EnvironmentPreset {readonly season:Season;readonly period:DayPeriod}
export interface EnvironmentAppearance extends EnvironmentPreset {readonly mode:'demo';readonly autoCycle:false}
export const SEASONS:ReadonlyArray<{id:Season;label:string}>=[{id:'spring',label:'春季'},{id:'summer',label:'夏季'},{id:'autumn',label:'秋季'},{id:'winter',label:'冬季'}];
export const DAY_PERIODS:ReadonlyArray<{id:DayPeriod;label:string}>=[{id:'day',label:'白天'},{id:'dusk',label:'黄昏'},{id:'night',label:'夜晚'}];
export function validateEnvironmentPreset(value:EnvironmentPreset):void{
 if(!SEASONS.some(s=>s.id===value.season)||!DAY_PERIODS.some(p=>p.id===value.period))throw new Error('无效环境预设');
}
