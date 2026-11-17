import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

function canvasPixels(size:number,paint:(x:number,y:number)=>readonly[number,number,number]){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d')!;const pixels=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const rgb=paint(x/size,y/size),i=(y*size+x)*4;
    pixels.data[i]=rgb[0];pixels.data[i+1]=rgb[1];pixels.data[i+2]=rgb[2];pixels.data[i+3]=255;
  }ctx.putImageData(pixels,0,0);return new CanvasTexture(canvas);
}
const noise=(x:number,y:number)=>{const value=Math.sin(x*127.1+y*311.7)*43758.5453;return value-Math.floor(value);};
function smoothNoise(x:number,y:number){
  const a=Math.floor(x),b=Math.floor(y),fx=x-a,fy=y-b;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return (noise(a,b)*(1-u)+noise(a+1,b)*u)*(1-v)+(noise(a,b+1)*(1-u)+noise(a+1,b+1)*u)*v;
}
export function createLeafTextures(){
  const tone=(u:number,v:number)=>{
    const center=Math.exp(-Math.pow((u-.5)*(20+v*30),2));
    const branch=Math.pow(Math.max(0,Math.cos((v-Math.abs(u-.5)*.57)*Math.PI*12)),34)*Math.min(1,Math.abs(u-.5)*18);
    const detail=noise(u*1024,v*1024)-.5;
    return {vein:center*.65+branch*.12,detail};
  };
  const color=canvasPixels(1024,(u,v)=>{
    const {vein,detail}=tone(u,v);
    const fade=Math.max(0,Math.min(1,(v-.18)/.26));
    const blade=fade*fade*(3-2*fade);
    const light=.91+.08*v+detail*.04+smoothNoise(u*24,v*32)*.07;
    return [(178*(1-blade)+62*blade+vein*21)*light,(197*(1-blade)+114*blade+vein*22)*light,(121*(1-blade)+39*blade+vein*15)*light];
  });color.colorSpace=SRGBColorSpace;
  const bump=canvasPixels(1024,(u,v)=>{const {vein,detail}=tone(u,v);const h=120+vein*55+detail*10;return [h,h,h];});
  const roughness=canvasPixels(1024,(u,v)=>{const {vein,detail}=tone(u,v);const h=160+detail*24-vein*12;return[h,h,h];});
  // UV.y=0 is the root. Canvas paint row 0 is authored as the root too.
  for(const texture of [color,bump,roughness])texture.flipY=false;
  return {color,bump,roughness,dispose:()=>{color.dispose();bump.dispose();roughness.dispose();}};
}
export function createSoilTextures(){
  const color=canvasPixels(1024,(u,v)=>{
    const fine=noise(u*1024,v*1024),coarse=smoothNoise(u*140,v*140);
    const pebble=coarse>.91?15:0;const shade=coarse*25+fine*13+pebble;
    return[45+shade,31+shade*.75,20+shade*.52];
  });color.colorSpace=SRGBColorSpace;
  const bump=canvasPixels(1024,(u,v)=>{const h=70+noise(u*1024,v*1024)*25+smoothNoise(u*140,v*140)*115;return[h,h,h];});
  for(const texture of [color,bump]){texture.wrapS=texture.wrapT=RepeatWrapping;texture.repeat.set(3,5);texture.anisotropy=8;}
  return {color,bump,dispose:()=>{color.dispose();bump.dispose();}};
}
export function createConcreteTextures(){
  const color=canvasPixels(1024,(u,v)=>{const grain=noise(u*1024,v*1024)*9+smoothNoise(u*30,v*30)*12;return[139+grain,145+grain,139+grain];});color.colorSpace=SRGBColorSpace;
  const bump=canvasPixels(1024,(u,v)=>{const h=100+noise(u*1024,v*1024)*50;return[h,h,h];});
  for(const t of [color,bump]){t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(4,28);t.anisotropy=8;}
  return {color,bump,dispose:()=>{color.dispose();bump.dispose();}};
}
export function createTomatoTextures(){
  const detail=(u:number,v:number)=>{const mid=Math.exp(-Math.pow((u-.5)*60,2));const vein=Math.pow(Math.max(0,Math.cos((v-Math.abs(u-.5)*.65)*Math.PI*14)),22)*.22;return mid*.65+vein;};
  const color=canvasPixels(1024,(u,v)=>{const grain=noise(u*1024,v*1024)*7+smoothNoise(u*24,v*28)*8,vein=detail(u,v);return[40+grain+vein*22,86+grain+vein*26,25+grain*.5+vein*12];});color.colorSpace=SRGBColorSpace;color.flipY=false;
  const bump=canvasPixels(1024,(u,v)=>{const h=100+detail(u,v)*65+noise(u*1024,v*1024)*12;return[h,h,h];});bump.flipY=false;
  return {color,bump,dispose:()=>{color.dispose();bump.dispose();}};
}
export function createTreeTextures(){
  const leafColor=canvasPixels(1024,(u,v)=>{const vein=Math.exp(-Math.pow((u-.5)*50,2))*15+Math.pow(Math.max(0,Math.cos((v-Math.abs(u-.5)*.65)*Math.PI*12)),28)*5;const variation=smoothNoise(u*16,v*24)*12;return[55+vein+variation,99+vein+variation,30+vein*.6+variation*.5];});leafColor.colorSpace=SRGBColorSpace;leafColor.flipY=false;
  const barkColor=canvasPixels(1024,(u,v)=>{const furrow=Math.pow(Math.max(0,Math.sin(u*100+smoothNoise(u*20,v*18)*3)),6);const grain=noise(u*1024,v*1024)*12;return[80+grain-furrow*25,65+grain*.8-furrow*20,47+grain*.6-furrow*13];});barkColor.colorSpace=SRGBColorSpace;
  const barkBump=canvasPixels(1024,(u,v)=>{const h=100+Math.pow(Math.max(0,Math.sin(u*100+smoothNoise(u*20,v*18)*3)),6)*85;return[h,h,h];});
  for(const t of [barkColor,barkBump]){t.wrapS=t.wrapT=RepeatWrapping;t.anisotropy=8;}
  return {leafColor,barkColor,barkBump,dispose:()=>{leafColor.dispose();barkColor.dispose();barkBump.dispose();}};
}
