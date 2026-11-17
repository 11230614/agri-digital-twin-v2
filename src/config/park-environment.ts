/** Review candidate only. Distances/heights are metres in FarmWorld, not surveyed terrain. */
export const PARK_ENVIRONMENT = Object.freeze({
 id:'surroundings-candidate-01',centerM:[54,0,-45] as const,
 innerRadiusM:180,outerRadiusM:1700,angularSegments:192,radialSegments:72,
 heightScale:.65,
 sky:{horizon:'#e1e9e6',zenith:'#80b3d5',cloud:'#f7f5eb'},
 hills:[
  {x:-270,z:-260,height:95,widthX:155,widthZ:190},
  {x:-430,z:160,height:130,widthX:210,widthZ:175},
  {x:290,z:330,height:80,widthX:190,widthZ:155},
  {x:480,z:-240,height:135,widthX:190,widthZ:240},
  {x:80,z:-610,height:185,widthX:285,widthZ:190},
  {x:-780,z:-490,height:235,widthX:300,widthZ:230},
  {x:810,z:310,height:210,widthX:320,widthZ:260},
  {x:-330,z:870,height:225,widthX:285,widthZ:290},
  {x:710,z:-960,height:285,widthX:350,widthZ:310},
  {x:-1030,z:610,height:265,widthX:340,widthZ:310},
  {x:0,z:-1240,height:260,widthX:360,widthZ:245},
  {x:280,z:1280,height:230,widthX:420,widthZ:290},
 ] as const,
});
export interface SkyAppearance {horizon:string;zenith:string;cloud:string;cloudTextureUrl?:string;cloudTint?:string;sunDirectionM?:[number,number,number];sunGlow?:number;mapBrightness?:number;fog?:{color:string;nearM:number;farM:number}}
export const PARK_ATMOSPHERE:SkyAppearance={horizon:'#d9e5e9',zenith:'#4b91c5',cloud:'#fffdf5',cloudTextureUrl:'/environment/daylight-clouds.png',fog:{color:'#b5c8cf',nearM:220,farM:1800}};
/** Extra review view, does not replace any of the five approved farm cameras. */
export const ENVIRONMENT_REVIEW_SHOT:import('../app/ports/scene').CameraShot={id:'ENV-01',label:'周边山体审阅',positionM:[90,42,81],targetM:[54,0,-39],up:[0,1,0],verticalFovDeg:45,nearM:.1,farM:3000,surfaceMode:'normal'};
