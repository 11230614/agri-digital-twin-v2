import {Color,DoubleSide,MeshPhysicalMaterial,MeshStandardMaterial,type Material} from 'three';
import {createConcreteTextures,createLeafTextures,createSoilTextures,createTomatoTextures,createTreeTextures} from './proceduralTextures';
import {createSolarTextures} from './solarTextures';
import {createLandscapeMaterials} from './landscapeMaterials';

/** One scene owns all borrowed materials/textures. Approved asset builders own their geometry. */
export function createFarmPalette(balanced=false){
 const soil=createSoilTextures(),leaf=createLeafTextures(),concrete=createConcreteTextures(),tomato=createTomatoTextures(),tree=createTreeTextures(),solar=createSolarTextures();
 const owned:Material[]=[];const standard=(p:ConstructorParameters<typeof MeshStandardMaterial>[0])=>{const m=new MeshStandardMaterial(p);owned.push(m);return m;};
 const physical=(p:ConstructorParameters<typeof MeshPhysicalMaterial>[0])=>{const m=new MeshPhysicalMaterial(p);owned.push(m);return m;};
 const glass=physical({color:0xddeae7,transparent:true,opacity:.32,roughness:.14,metalness:0,side:DoubleSide,depthWrite:false,clearcoat:.8,clearcoatRoughness:.12,envMapIntensity:1.2});glass.forceSinglePass=true;
 const greenhouse={frame:standard({color:0xd9dfd7,roughness:.42,metalness:.65}),glass,bed:standard({color:0xc6cbc2,roughness:.8}),soil:standard({map:soil.color,bumpMap:soil.bump,bumpScale:.009,roughness:1}),floor:standard({map:concrete.color,bumpMap:concrete.bump,bumpScale:.002,roughness:.72}),rubber:standard({color:0x27322d,roughness:.8}),device:standard({color:0x9fac9f,metalness:.35,roughness:.55,side:DoubleSide}),screen:standard({color:0x203d3a,roughness:.3}),light:standard({color:0xd7efeb,emissive:0xb8e4df,emissiveIntensity:.4,roughness:.3})};
 const crop=physical({map:leaf.color,bumpMap:leaf.bump,bumpScale:.00035,roughnessMap:leaf.roughness,roughness:.8,side:DoubleSide,vertexColors:true,sheen:.18,sheenColor:new Color(0xc1d998),sheenRoughness:.75});
 const tomatoes={stem:standard({color:0x5d7831,roughness:.82,side:DoubleSide}),leaf:physical({map:tomato.color,bumpMap:tomato.bump,bumpScale:.0003,roughness:.8,side:DoubleSide,vertexColors:true,sheen:.12}),greenFruit:physical({color:0x8b9e39,roughness:.4,clearcoat:.23,clearcoatRoughness:.35}),turningFruit:physical({color:0xc99335,roughness:.43,clearcoat:.2}),rope:standard({color:0xc4b991,roughness:.95})};
 const utilities={metal:standard({color:0xa3adb0,metalness:.7,roughness:.4}),housing:standard({color:0xd9ded6,metalness:.1,roughness:.65}),dark:standard({color:0x303b38,roughness:.75}),screen:standard({color:0x182b29,roughness:.35}),handle:standard({color:0x557b74,roughness:.6})};
 const trees={bark:standard({map:tree.barkColor,bumpMap:tree.barkBump,bumpScale:.025,roughness:.95}),leaf:physical({map:tree.leafColor,roughness:.82,side:DoubleSide,vertexColors:true,sheen:.13})};
 const tables={cell:standard({map:solar.color,roughness:.32,metalness:.25}),frame:standard({color:0xb9c3c3,roughness:.38,metalness:.7}),back:standard({color:0xc5cac7,roughness:.8}),cable:standard({color:0x222a2c,roughness:.75}),foot:standard({color:0x96938a,roughness:.95})};
 const cropDistant=balanced?standard({map:leaf.color,roughness:.8,side:DoubleSide,vertexColors:true}):crop;
 const treeDistant=balanced?standard({map:tree.leafColor,roughness:.82,side:DoubleSide,vertexColors:true}):trees.leaf;
 const landscape=createLandscapeMaterials(),{grass,road}=landscape;
 let disposed=false;return{greenhouse,crop,cropDistant,treeDistant,tomatoes,utilities,trees,tables,grass,road,dispose:()=>{if(disposed)return;disposed=true;owned.forEach(m=>m.dispose());for(const pack of [soil,leaf,concrete,tomato,tree,solar])pack.dispose();landscape.dispose();}};
}
