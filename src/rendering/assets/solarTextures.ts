import { CanvasTexture, SRGBColorSpace } from 'three';

/** Own authored texture: sixteen optical partitions, not a claim about rated hardware. */
export function createSolarTextures(){
  const width=2048,height=1024;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#aab6bf';ctx.fillRect(0,0,width,height);
  const pitchX=width/7.92,pitchY=height/3.12;
  for(let row=0;row<2;row++)for(let col=0;col<8;col++){
    const x=col*(.9725+.02)*pitchX,y=row*(1.55+.02)*pitchY,w=.9725*pitchX,h=1.55*pitchY;
    ctx.fillStyle=(row+col)%3===0?'#2b4961':'#29465d';ctx.fillRect(x,y,w,h);
    // Six columns of silicon cells, ten rows; restrained grid + fine conductive fingers.
    for(let r=0;r<10;r++)for(let c=0;c<6;c++){
      const cellX=x+c*w/6,cellY=y+r*h/10,cw=w/6,ch=h/10;
      const variation=Math.sin(col*31+row*13+c*2.7+r*8.3)*2;
      ctx.fillStyle=`rgb(${35+variation},${62+variation},${83+variation})`;
      const cut=2;
      ctx.beginPath();ctx.moveTo(cellX+cut,cellY+1);ctx.lineTo(cellX+cw-cut,cellY+1);ctx.lineTo(cellX+cw-1,cellY+cut);ctx.lineTo(cellX+cw-1,cellY+ch-cut);ctx.lineTo(cellX+cw-cut,cellY+ch-1);ctx.lineTo(cellX+cut,cellY+ch-1);ctx.lineTo(cellX+1,cellY+ch-cut);ctx.lineTo(cellX+1,cellY+cut);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(182,204,215,.24)';
      for(let finger=1;finger<8;finger++)ctx.fillRect(cellX+2,cellY+finger*ch/8,cw-4,.55);
      ctx.fillStyle='rgba(193,207,213,.58)';ctx.fillRect(cellX+cw*.33,cellY+1,.8,ch-2);ctx.fillRect(cellX+cw*.67,cellY+1,.8,ch-2);
    }
  }
  const color=new CanvasTexture(canvas);color.colorSpace=SRGBColorSpace;color.anisotropy=8;
  let disposed=false;return {color,dispose:()=>{if(disposed)return;disposed=true;color.dispose();}};
}
