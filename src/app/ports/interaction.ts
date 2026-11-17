import type {Vec3} from '../../shared/contracts/spatial';
/** Pure interaction entity metadata. No mutable renderer handles in UI snapshots. */
export interface InteractionEntity {
 readonly id:string;readonly kind:'plot'|'soil-sensor'|'greenhouse'|'weather-station'|'controller';readonly name:string;readonly ownerId?:string;
 readonly bounds:{readonly minM:Vec3;readonly maxM:Vec3;readonly centerM:Vec3;readonly radiusM:number};
 readonly focusTargetM:Vec3;readonly minimumDistanceM:number;readonly focusYawRad?:number;readonly focusPitchRad?:number;
}
export interface InteractionSnapshot {
 readonly entities:readonly InteractionEntity[];
 readonly selectedId:string|null;
 readonly focusStatus:'idle'|'moving'|'arrived'|'interrupted';
 readonly lastPick?:{readonly candidates:number;readonly narrowTests:number;readonly elapsedMs:number};
}
