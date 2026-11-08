/* Exact sampling acceleration. No quantization of positions or change in collision rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SiegePerformance=api;})(globalThis,()=>{
'use strict';
function accelerateRoad(road){
 if(road._fast)return road;road._fast=true;
 const points=road.samples,last=points.length-2,bins=new Uint16Array(Math.ceil(road.length*10)+2);let i=0;
 for(let b=0;b<bins.length;b++){while(i<last&&points[i+1].s<=b/10)i++;bins[b]=i;}
 const index=s=>{let j=bins[Math.max(0,Math.min(bins.length-1,Math.floor(s*10)))];while(j<last&&points[j+1].s<=s)j++;while(j>0&&points[j].s>s)j--;return j;};
 const width=s=>{const j=index(s),a=points[j],b=points[j+1];return a.width+(b.width-a.width)*(s-a.s)/(b.s-a.s||1);};
 road.sample=function(s){s=Math.max(0,Math.min(this.length,s));const j=index(s),a=points[j],b=points[j+1],f=(s-a.s)/(b.s-a.s||1);return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,width:a.width+(b.width-a.width)*f,tx:a.tx,tz:a.tz,s};};
 road.pose=function(u){const s=Math.max(0,Math.min(this.length,u.s)),j=index(s),a=points[j],b=points[j+1],f=(s-a.s)/(b.s-a.s||1);u.x=a.x+(b.x-a.x)*f-a.tz*u.l;u.z=a.z+(b.z-a.z)*f+a.tx*u.l;return u;};
 road.move=function(u,ds,dl,r=.135){u.px=u.x;u.pz=u.z;u.pa=u.angle;const n=Math.max(1,Math.ceil(Math.max(Math.abs(ds),Math.abs(dl))/.09));for(let k=0;k<n;k++){const w=width(u.s);u.l=Math.max(-w+r,Math.min(w-r,u.l+dl/n));const next=Math.max(0,Math.min(this.length,u.s+ds/n));if(Math.abs(u.l)<=width(next)-r)u.s=next;}this.pose(u);};
 return road;
}
return {accelerateRoad};
});
