(()=>{
"use strict";
const W=80,H=60,C={outline:"#654437",dark:"#9a633b",brown:"#cb9155",gold:"#edb676",cream:"#fff0d4",shade:"#e6c8a6",pink:"#eca9a0",eye:"#30251f",white:"#fffaf0"};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=t=>t*t*(3-2*t);
function draw(ctx,phase,run,flip){
 ctx.clearRect(0,0,W,H);ctx.save();if(flip){ctx.translate(W,0);ctx.scale(-1,1);}
 const bob=run?Math.round(Math.sin(phase*2)*1.1):0;ctx.translate(0,bob);
 const e=(x,y,rx,ry,c,outline=false)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();if(outline){ctx.lineWidth=1.5;ctx.strokeStyle=C.outline;ctx.stroke();}};
 const leg=(x,y,offset,far)=>{const swing=run?Math.sin(phase+offset)*5:0,lift=run?Math.max(0,Math.cos(phase+offset)*3):0;e(x+swing,y-lift,6,3.2,far?C.shade:C.cream,true);};
 e(65,41,5,3.5,C.shade,true);
 leg(36,52,0,true);leg(57,52,Math.PI,true);
 e(46,38,23,15,C.brown,true);e(43,33,19,11,C.gold);
 e(44,44,17,8,C.cream);e(53,35,9,8,C.brown);
 e(20,22,7,8,C.brown,true);e(20,22,4.5,5,C.pink);
 e(43,20,7,7,C.gold,true);e(43,20,4.5,4.5,C.pink);
 e(30,32,20,18,C.gold,true);e(21,40,11,10,C.cream);e(39,40,12,10,C.cream);
 e(17,35,3.3,4.5,C.eye);e(37,34,3.5,4.5,C.eye);e(16,34,1,1.2,C.white);e(36,33,1,1.2,C.white);
 e(27,40,3,2,C.pink);ctx.strokeStyle=C.outline;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(27,42);ctx.lineTo(27,45);ctx.moveTo(27,45);ctx.lineTo(24,44);ctx.moveTo(27,45);ctx.lineTo(30,44);ctx.stroke();
 e(14,41,2.5,1.4,C.pink);e(41,40,2.8,1.4,C.pink);
 leg(25,52,Math.PI,false);leg(53,52,0,false);
 ctx.restore();
 const img=ctx.getImageData(0,0,W,H);for(let i=3;i<img.data.length;i+=4)img.data[i]=img.data[i]<128?0:255;ctx.putImageData(img,0,0);
}
async function visit({stage,windows=[],targetIndices=[],onRun=()=>{}}){
 const targets=new Set(targetIndices.filter(i=>Number.isInteger(i)&&i>=0&&i<windows.length));
 if(!windows.length)return;
 if(!stage||window.matchMedia("(prefers-reduced-motion: reduce)").matches){for(let i=0;i<windows.length;i++)if(targets.has(i))await onRun(i);return;}
 const bounds=stage.getBoundingClientRect();
 const width=Math.min(66,Math.max(42,bounds.width*.145)),height=width*H/W;
 const first=windows[0].getBoundingClientRect();
 // One fixed vertical lane for the entire visit, even when slot widths differ.
 const laneX=clamp(first.left-bounds.left+first.width*.72-width/2,2,Math.max(2,bounds.width-width-2));
 const anchors=windows.map(win=>{
   const q=win.getBoundingClientRect();
   return {x:laneX,y:q.top-bounds.top-height*.86};
 });
 const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;canvas.className="hamster-sprite-canvas";canvas.setAttribute("aria-hidden","true");
 Object.assign(canvas.style,{position:"absolute",width:width+"px",height:height+"px",pointerEvents:"none",imageRendering:"pixelated",zIndex:"12",left:anchors[0].x+"px",top:-height+"px"});
 const ctx=canvas.getContext("2d",{willReadFrequently:true});
 if(!ctx){for(let i=0;i<windows.length;i++)if(targets.has(i))await onRun(i);return;}
 stage.appendChild(canvas);
 let pos={x:anchors[0].x,y:-height},phase=0;
 function paint(point,running=false,jump=false){
   canvas.style.left=laneX+"px";canvas.style.top=point.y+"px";
   canvas.style.transform=jump?"scale(.93,1.07)":"none";
   draw(ctx,phase,running,false);
 }
 function tween(ms,fn){
   return new Promise((resolve,reject)=>{
    let start=null;
    function frame(now){try{if(start===null)start=now;const elapsed=Math.max(0,now-start),t=clamp(elapsed/ms,0,1);fn(t,elapsed);if(t>=1)resolve();else requestAnimationFrame(frame);}catch(e){reject(e);}}
    requestAnimationFrame(frame);
   });
 }
 async function move(to,duration,arc=0){
   const from={...pos};
   await tween(duration,(t,elapsed)=>{
     const q=arc?t*t:smooth(t);
     phase=elapsed/80;
     paint({x:laneX,y:from.y+(to.y-from.y)*q},false,arc>0&&t>.1&&t<.9);
   });
   pos=to;
 }
 try {
   for(let i=0;i<anchors.length;i++){
     const anchor=anchors[i];
     if(targets.has(i)){
       await move(anchor,i===0?360:300,12);
       paint(anchor);await tween(100,()=>paint(anchor));
       const reroll=Promise.resolve().then(()=>onRun(i));reroll.catch(()=>{});
       await Promise.all([reroll,tween(1080,(t,elapsed)=>{
         phase=elapsed/35;paint(anchor,true);
       })]);
       paint(anchor);
     }else{
       // Fly past the slot without touching its top or starting a reroll.
       const flyby={x:laneX,y:Math.max(pos.y,Math.min(anchor.y+height*.65,anchors[i+1]?.y??Infinity))};
       await move(flyby,i===0?280:240,18);
     }
   }
   await move({x:laneX,y:bounds.height+height+8},380,14);
 }finally{canvas.remove();}
}
window.LunchHamster={visit,draw};
})();