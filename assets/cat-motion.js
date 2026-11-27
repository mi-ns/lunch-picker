(() => {
  "use strict";
  const W = 112, H = 79;
  const assetBase = document.currentScript.src;
  const skins={ginger:"cat-sprite.png",mackerel:"cat-mackerel.png",tuxedo:"cat-tuxedo.png",calico:"cat-calico.png"};
  const sheets=new Map();
  function loadSkin(name){
    if(!sheets.has(name)){
      const file=skins[name];
      const promise=new Promise((resolve,reject)=>{
        const image=new Image();
        image.onload=()=>image.naturalWidth===W*4&&image.naturalHeight===H*4?resolve(image):reject(new Error("Invalid sprite dimensions"));
        image.onerror=()=>reject(new Error("Sprite load failed"));
        image.src=new URL("./"+file,assetBase).href;
      });
      sheets.set(name,promise);
      promise.catch(()=>sheets.delete(name));
    }
    return sheets.get(name);
  }
  Object.keys(skins).forEach(name=>loadSkin(name).catch(()=>{}));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const walk=[0,1,13,15,12,14];
  const smooth=t=>t*t*(3-2*t);
  function pose(t,hit){
    const leave=hit?1870:1420;
    if(t<780) return {frame:walk[Math.floor(t/100)%walk.length],progress:smooth(clamp(t/780,0,1)),facing:-1};
    if(t<1000) return {frame:4,progress:1,facing:-1};
    if(hit&&t<1150) return {frame:5,progress:1,facing:-1};
    if(hit&&t<1250) return {frame:6,progress:1,facing:-1};
    if(hit&&t<1340) return {frame:7,progress:1,facing:-1};
    if(hit&&t<1395) return {frame:8,progress:1,facing:-1};
    if(hit&&t<1450) return {frame:9,progress:1,facing:-1};
    if(hit&&t<1530) return {frame:10,progress:1,facing:-1};
    if(hit&&t<1630) return {frame:11,progress:1,facing:-1};
    if(t<leave) return {frame:t<leave-100?14:15,progress:1,facing:-1};
    return {frame:walk[Math.floor((t-leave)/100)%walk.length],progress:1-smooth(clamp((t-leave)/850,0,1)),facing:1};
  }
  async function visit(stage,target,hit=true,onImpact=()=>{},opts={}){
    const variants=Object.keys(skins);
    const style=variants.includes(opts.variant)?opts.variant:variants[Math.floor(Math.random()*variants.length)];
    let sheet;try{sheet=await loadSkin(style);}catch(e){if(style==="ginger")throw e;sheet=await loadSkin("ginger");}
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduced){if(hit)await onImpact();return;}
    const bounds=stage.getBoundingClientRect(), box=(target||stage).getBoundingClientRect();
    const width=Math.min(154, Math.max(102, bounds.width*.38)),height=width*H/W;
    const anchorX=clamp(box.right-bounds.left-width*.91,0,Math.max(0,bounds.width-width));
    const anchorY=clamp(box.top-bounds.top+Math.min(box.height*.44,30)-height*.82,0,Math.max(0,bounds.height-height));
    const canvas=document.createElement("canvas"); canvas.width=W;canvas.height=H;canvas.className="cat-sprite-canvas";canvas.setAttribute("aria-hidden","true");
    Object.assign(canvas.style,{position:"absolute",width:width+"px",height:height+"px",top:anchorY+"px",left:bounds.width+"px",pointerEvents:"none",imageRendering:"pixelated"});
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas not available");ctx.imageSmoothingEnabled=false;
    stage.appendChild(canvas);
    const speed=clamp(Number(opts.speed)||1,.4,2),end=hit?2720:2270;
    let start=null,impactTask=null;
    function draw(frame,facing){ctx.clearRect(0,0,W,H);ctx.save();if(facing<0){ctx.translate(W,0);ctx.scale(-1,1);}ctx.drawImage(sheet,frame%4*W,Math.floor(frame/4)*H,W,H,0,0,W,H);ctx.restore();}
    try {
      await new Promise((resolve,reject)=>{
        function step(now){
          try {
            if(start===null)start=now;
            const t=Math.max(0,(now-start)*speed);
            if(hit&&t>=1450&&!impactTask){
              target?.classList.add("cat-impact");
              impactTask=Promise.resolve().then(onImpact);impactTask.catch(()=>{});
            }
            if(t>=end){resolve();return;}
            const p=pose(t,hit);
            canvas.style.left=(bounds.width+6+(anchorX-bounds.width-6)*p.progress)+"px";
            draw(p.frame,p.facing);requestAnimationFrame(step);
          }catch(e){reject(e);}
        }
        requestAnimationFrame(step);
      });
      if(impactTask)await impactTask;
    }finally{target?.classList.remove("cat-impact");canvas.remove();}
  }
  window.LunchCat={visit,pose};
})();