export type Vec3 = readonly [number, number, number];
export type Quat = readonly [number, number, number, number];
export interface FrameDefinition { frameId: string; parentFrameId: string | null; localPosition: Vec3; localQuaternion: Quat; ownerId?: string }
export interface Anchor { id: string; ownerId: string; frameId: string; positionM: Vec3; quaternion: Quat; orientationMode: 'full'|'forward-only'|'none' }
export interface Bounds { minM: Vec3; maxM: Vec3 }
export interface GeoPoint { longitudeDeg: number; latitudeDeg: number; ellipsoidHeightM: number }
