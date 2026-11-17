import type { CameraShot } from '../app/ports/scene';
// Stage 2 diagnostics only. These are not approved agricultural CameraShots.
export const CALIBRATION_SHOTS: readonly CameraShot[] = Object.freeze([
  { id: 'cal-overview', label: '园区尺度', positionM: [165,145,110], targetM: [60,0,-50], up: [0,1,0], verticalFovDeg: 45, nearM: .5, farM: 6000 },
  { id: 'cal-reverse', label: '反向观察', positionM: [-75,100,-170], targetM: [60,0,-50], up: [0,1,0], verticalFovDeg: 48, nearM: .5, farM: 6000 },
  { id: 'cal-eye', label: '人眼近景', positionM: [55,1.7,-36], targetM: [60,1.7,-50], up: [0,1,0], verticalFovDeg: 65, nearM: .05, farM: 3000 },
  { id: 'cal-low', label: '低角度', positionM: [45,.8,-30], targetM: [60,1,-50], up: [0,1,0], verticalFovDeg: 55, nearM: .05, farM: 3000 },
  { id: 'cal-context', label: '底图上下文', positionM: [390,800,680], targetM: [60,0,-50], up: [0,1,0], verticalFovDeg: 48, nearM: .5, farM: 6000 },
]);
