import { CanvasTexture, EquirectangularReflectionMapping, PMREMGenerator, SRGBColorSpace, type WebGLRenderer } from 'three';
/** Own procedural daylight panorama for reflections only; never replaces the map/background. */
export function createDaylightEnvironment(renderer:WebGLRenderer){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d')!;const gradient=ctx.createLinearGradient(0,0,0,512);
  gradient.addColorStop(0,'#769fcb');gradient.addColorStop(.3,'#b8d6e8');gradient.addColorStop(.49,'#e7eadc');gradient.addColorStop(.53,'#a5af91');gradient.addColorStop(1,'#626b49');ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);
  for(let i=0;i<16;i++){
    const x=(i*191)%1024,y=70+(i*67)%145;
    const cloud=ctx.createRadialGradient(x,y,2,x,y,90);cloud.addColorStop(0,'rgba(255,255,245,.55)');cloud.addColorStop(1,'rgba(255,255,245,0)');ctx.fillStyle=cloud;ctx.save();ctx.translate(x,y);ctx.scale(2,.35);ctx.translate(-x,-y);ctx.fillRect(x-90,y-90,180,180);ctx.restore();
  }
  const source=new CanvasTexture(canvas);source.colorSpace=SRGBColorSpace;source.mapping=EquirectangularReflectionMapping;
  const generator=new PMREMGenerator(renderer),target=generator.fromEquirectangular(source);source.dispose();generator.dispose();return target;
}
