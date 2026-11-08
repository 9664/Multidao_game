/* Validated local progress; a checkpoint restarts its wave, it is not a live battle save. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SiegeProgress=api;})(globalThis,()=>{
'use strict';
const KEY='multidao-progress-080',safe=(x,fallback)=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):fallback;
function clean(input){const a=input&&typeof input==='object'?input:{},e=a.endless&&typeof a.endless==='object'?a.endless:{};const out={selected:Math.max(1,Math.min(6,safe(a.selected,1))),mode:a.mode==='endless'?'endless':'campaign',completed:{},sound:a.sound!==false,music:a.music!==false,volume:Number.isFinite(a.volume)?Math.max(0,Math.min(1,a.volume)):.58,quality:['auto','hd','lite'].includes(a.quality)?a.quality:'auto',motion:a.motion!==false,endless:{seed:Number.isFinite(e.seed)?e.seed>>>0:20261108,checkpoint:safe(e.checkpoint,1),best:safe(e.best,0),generator:1}};
 for(const id of ['dawn','canyon','snow','sand','forge','citadel']){const v=a.completed?.[id];if(v&&Number.isFinite(v.time)&&v.time>0)out.completed[id]={stars:Math.max(1,Math.min(3,Math.floor(v.stars)||1)),time:v.time};}
 return out;
}
function load(storage){try{return clean(JSON.parse(storage.getItem(KEY)||storage.getItem('multidao-campaign-071')||'null'));}catch{return clean(null);}}
function save(storage,value){try{storage.setItem(KEY,JSON.stringify(clean(value)));return true;}catch{return false;}}
return {KEY,clean,load,save};
});
