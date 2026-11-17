import type {CameraShot} from '../app/ports/scene';
/** Five real scale experiences, explicit stable IDs. No A2/B-07 business alias is inferred. */
export const PARK_SHOTS:readonly CameraShot[]=[
 {id:'CAM-01',label:'整园总览',positionM:[84,173,61],targetM:[54,0,-39],up:[0,1,0],verticalFovDeg:45,nearM:.1,farM:3000,surfaceMode:'normal',fitBounds:{minM:[-9,0,-99],maxM:[117,9,0]}},
 {id:'CAM-02',label:'棚内人眼',positionM:[54,1.7,-58],targetM:[54,1.55,-79],up:[0,1,0],verticalFovDeg:65,nearM:.03,farM:3000},
 {id:'CAM-03',label:'沿垄近景',positionM:[43.5,.8,-13.8],targetM:[42.3,.27,-17.5],up:[0,1,0],verticalFovDeg:55,nearM:.02,farM:3000},
 {id:'CAM-04',label:'温室全貌',positionM:[78,16,-42],targetM:[54,2.6,-69],up:[0,1,0],verticalFovDeg:50,nearM:.05,farM:3000,fitBounds:{minM:[44,0,-84],maxM:[64,7,-54]}},
 {id:'CAM-05',label:'田块全貌',positionM:[82,26,9],targetM:[54,.8,-29],up:[0,1,0],verticalFovDeg:48,nearM:.03,farM:3000,fitBounds:{minM:[40,0,-45],maxM:[69,3.5,-10]}},
];
