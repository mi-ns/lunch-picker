(()=>{
"use strict";
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let enabled=true,context=null;
try{enabled=localStorage.getItem("lunch-jackpot-sound")!=="off";}catch{}
function updateButtons(){document.querySelectorAll("[data-jackpot-sound]").forEach(b=>{b.textContent=enabled?"🔊 효과음 켜짐":"🔇 효과음 꺼짐";b.setAttribute("aria-pressed",String(enabled));});}
function prime(){
 if(!enabled)return;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=context||new Audio();if(context.state==="suspended")context.resume().catch(()=>{});}catch{}
}
function tone(hz,offset,duration,volume=.045,type="triangle"){
 if(!enabled||!context||context.state!=="running")return;
 try{const t=context.currentTime+Math.max(0,offset),osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.value=hz;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(context.destination);osc.start(t);osc.stop(t+duration+.02);}catch{}
}
function beat(i){
 const notes=[392,494,587,698,880];
 tone(notes[i],0,.18,.042);tone(notes[i]*2,0,.12,.014,"sine");
}
function fanfare(){
 // Original short synthesized flourish; no external audio or licensed recordings.
 [523.25,659.25,783.99,1046.5].forEach((n,i)=>tone(n,i*.085,.42,.035));
 [523.25,659.25,783.99,1046.5].forEach(n=>tone(n,.36,.8,.026));
 tone(261.63,.36,.8,.038,"sine");
}
function buildMarquee(stage){
 const frame=document.createElement("div");frame.className="j-marquee";frame.setAttribute("aria-hidden","true");
 const points=[];for(let i=0;i<10;i++){points.push([7+i*9.55,0],[7+i*9.55,100]);}
 for(let i=1;i<5;i++){points.push([0,i*20],[100,i*20]);}
 points.forEach(([x,y])=>{const b=document.createElement("i");b.className="j-bulb";b.style.left=x+"%";b.style.top=y+"%";frame.append(b);});
 stage.append(frame);return frame;
}
function burst(stage){
 const colors=["#ffd67b","#f4c15f","#fff1bc","#c98f44","#f6dca0"];
 for(let i=0;i<28;i++){const el=document.createElement("i"),angle=i/28*Math.PI*2,d=65+Math.random()*115;el.className="j-coin";el.style.setProperty("--dx",Math.cos(angle)*d+"px");el.style.setProperty("--dy",Math.sin(angle)*d+"px");el.style.setProperty("--rot",(Math.random()*480-240)+"deg");el.style.setProperty("--sz",(4+Math.random()*5)+"px");el.style.setProperty("--color",colors[i%colors.length]);stage.append(el);setTimeout(()=>el.remove(),1100);}
}
async function run({stage,windows,status,spin}){
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 stage.querySelectorAll(".j-marquee,.j-message,.j-coin").forEach(e=>e.remove());
 windows.forEach(w=>{w.classList.remove("j-won","j-focus","j-spin");w.classList.add("j-await");});
 if(status){status.classList.remove("j-final-status");status.classList.add("j-count");status.textContent="…";}
 const frame=buildMarquee(stage),bulbs=[...frame.children];stage.classList.add("j-show");
 let overlay=null;
 try{
  const timings=[360,320,270,235,210];
  for(let i=0;i<timings.length;i++){
    beat(i);
    bulbs.forEach((bulb,j)=>bulb.classList.toggle("lit",j%3===i%3));
    windows.forEach((w,j)=>w.classList.toggle("j-focus",j===Math.min(windows.length-1,Math.floor(i*windows.length/5))));
    if(status)status.textContent="● ".repeat(i+1).trim();
    await wait(reduced?90:timings[i]);
  }
  windows.forEach(w=>{w.classList.remove("j-focus");w.classList.add("j-spin");});
  bulbs.forEach(b=>b.classList.add("lit"));
  if(status)status.textContent="…";
  await spin();
  windows.forEach(w=>{w.classList.remove("j-spin","j-await");w.classList.add("j-won");});
  if(status){status.classList.remove("j-count");status.classList.add("j-final-status");status.textContent="JACKPOT!";}
  fanfare();
  overlay=document.createElement("div");overlay.className="j-message";overlay.setAttribute("aria-hidden","true");const title=document.createElement("div");title.className="j-title";title.textContent="JACKPOT!";overlay.append(title);stage.append(overlay);
  if(!reduced)burst(stage);
  await wait(reduced?450:1200);
 }finally{
  overlay?.remove();frame.remove();stage.classList.remove("j-show");
  windows.forEach(w=>w.classList.remove("j-await","j-focus","j-spin"));
  status?.classList.remove("j-count");
 }
}
function bind(){updateButtons();document.querySelectorAll("[data-jackpot-sound]").forEach(b=>b.addEventListener("click",()=>{enabled=!enabled;try{localStorage.setItem("lunch-jackpot-sound",enabled?"on":"off");}catch{}updateButtons();if(enabled)prime();}));}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
window.LunchJackpot={prime,run};
})();