import type { Group, Scene, PerspectiveCamera } from 'three';
import type { InspectionState } from '../app/ports/scene';
export interface SceneContent {
  readonly scene:Scene;
  readonly bloomSources?:readonly import('../app/ports/post-processing').BloomSource[];
  readonly depthSample?:import('./DepthEffects').DepthSample;
  readonly interaction?:import('./EntityInteraction').EntityInteraction;
  readonly dataVisuals?:import('./PlotDataVisualCollection').PlotDataVisualCollection;
  readonly environmentController?:import('./EnvironmentController').EnvironmentController;
  advanceVisual?(dt:number,now:number,reducedMotion:boolean):void;
  readonly surfaces:Group;
  readonly skyColor?:string;
  readonly sky?:import('../config/park-environment').SkyAppearance;
  readonly environment?:{readonly candidateId:string;readonly mountainTriangles:number;readonly sky:boolean;readonly fog:boolean};
  selectShot?(id:string):void;
  setInspection?(state:InspectionState):void;
  prepareRender?(camera:PerspectiveCamera,viewportHeight:number):void;
  dispose():void;
}
