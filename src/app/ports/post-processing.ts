import type {Mesh} from 'three';
export interface PostProcessingSettings {
 readonly bloom:boolean;
 readonly enhance:boolean;
 readonly depthOfField?:boolean;
 readonly ssao?:boolean;
}
export interface PostProcessingSnapshot extends PostProcessingSettings {
 readonly active:boolean;readonly bypassReason:'disabled'|'ndvi'|'unavailable'|'view'|null;
 readonly depthEffect:'depthOfField'|'ssao'|null;
 readonly depthTargetId?:string;
 readonly bloomSuspended:boolean;
 readonly error?:string;readonly bloomSize:readonly [number,number];readonly eligibleSources:number;
 readonly sceneCalls:number;readonly sceneTriangles:number;readonly effectCalls:number;readonly effectTriangles:number;
}
/** Prepared renderer-only handles, never exposed through SceneSnapshot. Geometry is borrowed. */
export interface BloomSource {readonly mesh:Mesh;readonly kind:'water'|'indicator';readonly enabled?:()=>boolean}
