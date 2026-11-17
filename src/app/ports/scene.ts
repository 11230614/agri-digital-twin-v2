import type { Vec3 } from '../../shared/contracts/spatial';

export type RuntimeStatus = 'idle'|'starting'|'running'|'paused'|'failed'|'disposing'|'disposed';
/** Authoring view pose only, never device observed/desired telemetry. */
export interface InspectionState {readonly doorRatio:number;readonly cutaway:boolean}
export interface CameraShot {
  readonly id: string;
  readonly label: string;
  readonly positionM: Vec3;
  readonly targetM: Vec3;
  readonly up: Vec3;
  readonly verticalFovDeg: number;
  readonly nearM: number;
  readonly farM: number;
  /** Authoring bounds are stable across LOD changes; absent for human-eye/detail shots. */
  readonly fitBounds?: {readonly minM:Vec3;readonly maxM:Vec3};
  readonly surfaceMode?:'normal'|'inspection-cutaway';
}
export interface MapState {
  readonly status: 'loading'|'ready'|'degraded'|'failed';
  readonly sourceId: string;
  readonly generation: number;
  readonly offlineFallback: boolean;
  readonly lastError?: { readonly code: string; readonly message: string };
}
export interface SceneSnapshot {
  readonly appearance?:import('./environment').EnvironmentAppearance;
  readonly monitoring?:import('../../data/DemoMonitoringSource').MonitoringSnapshot;
  readonly plotVisuals?:readonly import('./data-visual').DataVisualSnapshot[];
  readonly dataVisual?:import('./data-visual').DataVisualSnapshot;
  readonly interaction?:import('./interaction').InteractionSnapshot;
  readonly runtime: RuntimeStatus;
  readonly map: MapState;
  readonly error?: string;
  readonly shotId: string;
  readonly overlayVisible: boolean;
  readonly surfacesVisible: boolean;
  readonly viewport: { readonly width: number; readonly height: number; readonly dpr: number };
  readonly alignmentErrorPx: number | null;
  readonly renderedFrames: number;
  readonly threeDrawCalls: number;
  readonly threeTriangles: number;
  readonly inspection?:InspectionState;
  readonly environment?:{readonly candidateId:string;readonly mountainTriangles:number;readonly sky:boolean;readonly fog:boolean};
  readonly navigation?:import('../../rendering/ParkNavigationPolicy').NavigationState;
  readonly camera?: {readonly rightM?:Vec3;readonly positionM?:Vec3;readonly fovDeg:number;readonly nearM:number;readonly farM:number};
}
export interface SceneFacade {
  setEnvironmentPreset(preset:import('./environment').EnvironmentPreset):void;
  setDataVisualPlot(id:string):void;
  setVegetationMode(mode:import('./data-visual').VegetationMode):void;
  setDemoScenario(scenario:import('../../data/DemoMonitoringSource').DemoScenario,entityId?:string):void;
  setEntityLabelsVisible(visible:boolean):void;
  selectEntity(id:string|null):void;
  focusEntity(id:string,safeInsetsPx?:{left:number;right:number}):void;
  setFocusSafeInsets(insets:{left:number;right:number}):void;
  subscribe(listener: (snapshot: SceneSnapshot) => void): () => void;
  setCameraShot(id: string): void;
  setOverlayVisible(visible: boolean): void;
  setSurfacesVisible(visible: boolean): void;
  setInspection(state:InspectionState):void;
  retryMap(): Promise<void>;
  pause(): void;
  resume(): void;
}
