import {Group,Vector3,type PerspectiveCamera} from 'three';
export type AssetQuality='near'|'mid'|'far';
export function chooseAssetLod(pixels:number,previous:AssetQuality,near:number,mid:number):AssetQuality{
 if(previous==='near'&&pixels>=near*.85)return 'near';
 if(pixels>=near)return 'near';
 if(previous==='far'&&pixels<mid*1.15)return 'far';
 return pixels>=mid?'mid':'far';
}
/** Asset roots remain rigid; all variants share installation, semantic state and bounding centre. */
export function createAssetLod(variants:Record<AssetQuality,Group>,center:Vector3,diameter:number,near:number,mid:number){
 const root=new Group();for(const [q,g] of Object.entries(variants)){g.visible=q==='near';root.add(g);}
 let quality:AssetQuality='near';const point=new Vector3();
 return{root,get quality(){return quality;},prepare:(camera:PerspectiveCamera,height:number)=>{
  root.updateWorldMatrix(true,false);point.copy(center).applyMatrix4(root.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
  const pixels=diameter*height/(2*Math.max(.1,-point.z)*Math.tan(camera.fov*Math.PI/360));
  const next=chooseAssetLod(pixels,quality,near,mid);if(next===quality)return false;
  quality=next;for(const [q,g] of Object.entries(variants))g.visible=q===quality;return true;
 }};
}
